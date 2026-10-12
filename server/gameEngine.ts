/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import { WebSocket } from 'ws';
import {
  GameCard,
  GameMode,
  GamePhase,
  PassDirection,
  PublicPlayer,
  PrivatePlayerState,
  ParticipantResult,
  RoomPublicState,
  RoomSettings,
  ServerMessage,
  SessionPlayerScore,
} from '../src/types/game';
import { DEFAULT_ENABLED_CARD_TYPES, getCardDef } from '../src/utils/cards';
import { nameFilter } from './nameFilter';
import { storage, sanitizePayload } from './storage';

export interface InternalPlayer {
  id: string;
  sessionId: string;
  displayName: string;
  ws?: WebSocket;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
  hand: GameCard[];
  selectedCardId: string | null;
  hasPassed: boolean;
  hasFinished: boolean;   // true once this player has matched 4-of-a-kind
  matchRank: number;      // 1 = first to match, 2 = second, etc.
  cardsPassedCount: number;
  cardsReceivedCount: number;
  chorRole?: string;
  score: number;
  disconnectTimer?: NodeJS.Timeout;
  userId?: string;
  publicPlayerId?: string;
  avatar?: string;
}

export interface InternalGlobalPlayer {
  id: string;
  sessionId: string;
  displayName: string;
  ws: WebSocket;
  status: 'idle' | 'in-room';
  userId?: string;
  publicPlayerId?: string;
  avatar?: string;
}

export interface QueueEntry {
  ws: WebSocket;
  displayName: string;
  gameMode: GameMode;
  userId?: string;
  joinedAt: number;
}

export interface InternalPlayRequest {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  targetPlayerId: string;
  roomCode: string;
  gameMode: GameMode;
  expiresAt: number;
}

export interface InternalRoom {
  id: string;
  roomCode: string;
  gameMode: GameMode;
  status: RoomPublicState['status'];
  phase: GamePhase;
  hostId: string;
  isLocked: boolean;
  players: InternalPlayer[];
  currentRound: number;
  passesInRound: number;
  roundStartedAt?: number;
  countdownTimer?: NodeJS.Timeout;
  passTimer?: NodeJS.Timeout;
  passTimerRemaining?: number;
  transferProgress?: {
    total: number;
    completed: number;
  };
  cinematicState?: {
    step: 'ready' | 'count_3' | 'count_2' | 'count_1' | 'go';
    playerCount: number;
  };
  settings: RoomSettings;
  finishedPlayerIds: Set<string>; // tracks which players have already matched
  winner?: RoomPublicState['winner'];
  lastMatchResults?: ParticipantResult[];
  chorChitthiState?: RoomPublicState['chorChitthiState'];
  /** Monotonically-increasing game number within this room session (1-indexed) */
  matchNumber: number;
  /** Unique ID for the current match instance — resets each game */
  matchId: string;
  /** Player IDs who have clicked Play Again after a game ends */
  rematchReadyIds: Set<string>;
  /** Session-level win/game counts, keyed by playerId */
  sessionScores: Map<string, SessionPlayerScore>;
  /** Guard: prevents duplicate rematch starts from race conditions */
  rematchStarting: boolean;
}

export class GameEngine {
  private rooms: Map<string, InternalRoom> = new Map(); // roomCode -> InternalRoom
  private sessionToRoom: Map<string, string> = new Map(); // sessionId -> roomCode
  private globalPlayers: Map<string, InternalGlobalPlayer> = new Map(); // playerId -> InternalGlobalPlayer
  private activeInvites: Map<string, InternalPlayRequest> = new Map(); // inviteId -> InternalPlayRequest
  private matchmakingQueues: Map<GameMode, QueueEntry[]> = new Map([
    ['match-and-collect', []],
    ['chor-chitthi', []],
  ]);

  constructor() {
    // Periodically clean up stale/abandoned rooms
    const cleanupTimer = setInterval(() => this.cleanupAbandonedRooms(), 60000);
    cleanupTimer.unref();
    // Periodically process matchmaking queue
    const matchmakingTimer = setInterval(() => this.processMatchmaking(), 2000);
    matchmakingTimer.unref();
  }

  // --- MATCHMAKING SYSTEM ---
  public joinQueue(ws: WebSocket, displayName: string, gameMode: GameMode, userId?: string): void {
    // Remove if already in queue
    this.leaveQueue(ws);

    const queue = this.matchmakingQueues.get(gameMode) || [];
    const entry: QueueEntry = {
      ws,
      displayName: displayName.trim(),
      gameMode,
      userId,
      joinedAt: Date.now(),
    };
    queue.push(entry);
    this.matchmakingQueues.set(gameMode, queue);

    this.sendQueueStatus(ws, true, queue.length, gameMode);
    this.broadcastQueueUpdates(gameMode);
    this.processMatchmaking();
  }

  public leaveQueue(ws: WebSocket): void {
    for (const [mode, queue] of this.matchmakingQueues.entries()) {
      const idx = queue.findIndex((e) => e.ws === ws);
      if (idx !== -1) {
        queue.splice(idx, 1);
        this.sendQueueStatus(ws, false, 0, mode);
        this.broadcastQueueUpdates(mode);
        break;
      }
    }
  }

  private sendQueueStatus(ws: WebSocket, inQueue: boolean, queueLength: number, gameMode: GameMode): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'queue_status',
          inQueue,
          queueLength,
          gameMode,
          estimatedWaitSeconds: Math.max(5, (4 - queueLength) * 4),
        })
      );
    }
  }

  private broadcastQueueUpdates(gameMode: GameMode): void {
    const queue = this.matchmakingQueues.get(gameMode) || [];
    for (const entry of queue) {
      this.sendQueueStatus(entry.ws, true, queue.length, gameMode);
    }
  }

  private processMatchmaking(): void {
    for (const [mode, queue] of this.matchmakingQueues.entries()) {
      // Clean disconnected sockets
      const active = queue.filter((e) => e.ws.readyState === WebSocket.OPEN);
      this.matchmakingQueues.set(mode, active);

      // Match-and-collect requires min 4 players to auto-start match, or 2 if players have waited > 20s
      const required = 4;
      if (active.length >= required) {
        const matched = active.splice(0, required);
        this.matchmakingQueues.set(mode, active);

        // Auto-create room for matched players
        const host = matched[0];
        const createRes = this.createRoom(host.displayName, mode, host.ws, undefined, host.userId);
        if ('error' in createRes) continue;

        const { room } = createRes;
        // Join the rest of the players
        for (let i = 1; i < matched.length; i++) {
          const p = matched[i];
          this.joinRoom(room.roomCode, p.displayName, p.ws, undefined, p.userId);
        }

        // Notify all matched players of match found
        for (const p of matched) {
          if (p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify({ type: 'match_found', roomCode: room.roomCode, gameMode: mode }));
          }
        }

        // Broadcast room state to all in room
        this.broadcastRoom(room);
        this.broadcastPrivateStates(room);
      }
    }
  }

  public getActiveRoomsList() {
    return Array.from(this.rooms.values()).map((r) => ({
      roomCode: r.roomCode,
      gameMode: r.gameMode,
      status: r.status,
      playerCount: r.players.filter((p) => p.connected).length,
      maxPlayers: r.settings.maxPlayers,
      isLocked: r.isLocked,
    }));
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MATCH-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  // --- GLOBAL PLAYER LOGIC ---

  public registerGlobalPlayer(displayName: string, ws: WebSocket, clientSessionId?: string, userId?: string): { player: InternalGlobalPlayer } | { error: string } {
    const val = nameFilter.validate(displayName);
    if (!val.valid) {
      return { error: val.error || 'Name Not Allowed' };
    }

    const playerId = this.generateId();
    const sessionId = clientSessionId || this.generateId();
    
    // Check if user is registered in storage
    const userAccount = userId ? storage.getUserById(userId) : null;

    const globalPlayer: InternalGlobalPlayer = {
      id: playerId,
      sessionId,
      displayName: displayName.trim(),
      ws,
      status: 'idle',
      userId: userAccount?.id,
      publicPlayerId: userAccount?.publicPlayerId,
      avatar: userAccount?.avatar || '🎮',
    };

    this.globalPlayers.set(playerId, globalPlayer);
    this.broadcastGlobalState();
    return { player: globalPlayer };
  }

  public removeGlobalPlayer(ws: WebSocket): void {
    for (const [id, player] of this.globalPlayers.entries()) {
      if (player.ws === ws) {
        this.globalPlayers.delete(id);
        this.broadcastGlobalState();
        break;
      }
    }
  }

  public updateGlobalPlayerStatus(playerId: string, status: 'idle' | 'in-room'): void {
    const player = this.globalPlayers.get(playerId);
    if (player) {
      player.status = status;
      this.broadcastGlobalState();
    }
  }

  public broadcastGlobalState(): void {
    const state = Array.from(this.globalPlayers.values()).map(p => ({
      id: p.id,
      displayName: p.displayName,
      status: p.status
    }));
    
    const msg = JSON.stringify({ type: 'global_state', players: state });
    for (const player of this.globalPlayers.values()) {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(msg);
      }
    }
  }

  public sendInvite(fromPlayerId: string, targetPlayerId: string, roomCode: string, gameMode: GameMode): { success: boolean; error?: string } {
    const fromPlayer = this.globalPlayers.get(fromPlayerId);
    const targetPlayer = this.globalPlayers.get(targetPlayerId);

    if (!fromPlayer) return { success: false, error: 'You are not registered' };
    if (!targetPlayer) return { success: false, error: 'Target player not found' };
    if (targetPlayer.status === 'in-room') return { success: false, error: 'Player is already in a room' };
    
    const room = this.rooms.get(roomCode.toUpperCase().trim());
    if (!room) return { success: false, error: 'Room not found' };

    const inviteId = this.generateId();
    const invite: InternalPlayRequest = {
      id: inviteId,
      fromPlayerId,
      fromPlayerName: fromPlayer.displayName,
      targetPlayerId,
      roomCode,
      gameMode,
      expiresAt: Date.now() + 60000 // 60s expiry
    };

    this.activeInvites.set(inviteId, invite);

    if (targetPlayer.ws.readyState === WebSocket.OPEN) {
      targetPlayer.ws.send(JSON.stringify({ type: 'invite_received', invite }));
    }

    return { success: true };
  }

  public respondInvite(inviteId: string, accept: boolean, responderId: string): { success: boolean; invite?: InternalPlayRequest; error?: string } {
    const invite = this.activeInvites.get(inviteId);
    if (!invite) return { success: false, error: 'Invite expired or invalid' };
    if (invite.targetPlayerId !== responderId) return { success: false, error: 'Not your invite' };

    this.activeInvites.delete(inviteId);

    const fromPlayer = this.globalPlayers.get(invite.fromPlayerId);
    if (fromPlayer && fromPlayer.ws.readyState === WebSocket.OPEN) {
      const responder = this.globalPlayers.get(responderId);
      fromPlayer.ws.send(JSON.stringify({ 
        type: 'invite_response', 
        inviteId, 
        accepted: accept,
        roomCode: accept ? invite.roomCode : undefined,
        targetPlayerName: responder?.displayName || 'Unknown'
      }));
    }

    return { success: true, invite: accept ? invite : undefined };
  }

  // --- END GLOBAL PLAYER LOGIC ---

  public getRoom(roomCode: string): InternalRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase().trim());
  }

  public createRoom(
    displayName: string,
    gameMode: GameMode = 'match-and-collect',
    ws: WebSocket,
    clientSessionId?: string,
    userId?: string
  ): { room: InternalRoom; player: InternalPlayer } | { error: string } {
    const val = nameFilter.validate(displayName);
    if (!val.valid) {
      return { error: val.error || 'Name Not Allowed\nPlease choose another name.' };
    }

    let roomCode = this.generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = this.generateRoomCode();
    }

    const playerId = this.generateId();
    const sessionId = clientSessionId || this.generateId();
    const userAccount = userId ? storage.getUserById(userId) : null;

    const hostPlayer: InternalPlayer = {
      id: playerId,
      sessionId,
      displayName: displayName.trim(),
      ws,
      isHost: true,
      ready: true,
      connected: true,
      hand: [],
      selectedCardId: null,
      hasPassed: false,
      hasFinished: false,
      matchRank: 0,
      cardsPassedCount: 0,
      cardsReceivedCount: 0,
      score: 0,
      userId: userAccount?.id,
      publicPlayerId: userAccount?.publicPlayerId,
      avatar: userAccount?.avatar || '👑',
    };

    const room: InternalRoom = {
      id: this.generateId(),
      roomCode,
      gameMode,
      status: 'lobby',
      phase: 'select',
      hostId: playerId,
      isLocked: false,
      players: [hostPlayer],
      currentRound: 1,
      passesInRound: 0,
      settings: {
        minPlayers: 4,
        maxPlayers: 30,
        lobbyCountdownSeconds: 5,
        passTimerSeconds: 12,
        direction: 'clockwise',
        enabledCards: [...DEFAULT_ENABLED_CARD_TYPES],
        chorChitthiRoles: {
          rajaCount: 1,
          raniCount: 1,
          policeCount: 1,
          chorCount: 1,
          prajaCount: 0,
          gameDurationSeconds: 45,
          losingRole: 'chor',
        },
      },
      finishedPlayerIds: new Set<string>(),
      // Phase 4.1 session fields
      matchNumber: 1,
      matchId: this.generateId(),
      rematchReadyIds: new Set<string>(),
      sessionScores: new Map<string, SessionPlayerScore>(),
      rematchStarting: false,
    };

    this.rooms.set(roomCode, room);
    this.sessionToRoom.set(sessionId, roomCode);

    return { room, player: hostPlayer };
  }

  public joinRoom(
    roomCode: string,
    displayName: string,
    ws: WebSocket,
    clientSessionId?: string,
    userId?: string
  ): { room: InternalRoom; player: InternalPlayer } | { error: string } {
    const cleanCode = roomCode.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { error: 'Invalid room code. Please check and try again.' };
    }

    if (room.isLocked || room.status !== 'lobby') {
      return { error: 'Room is locked or game has already started.' };
    }

    if (room.players.length >= room.settings.maxPlayers) {
      return { error: `Room is full (Maximum ${room.settings.maxPlayers} players).` };
    }

    const val = nameFilter.validate(displayName);
    if (!val.valid) {
      return { error: val.error || 'Name Not Allowed\nPlease choose another name.' };
    }

    const trimmedName = displayName.trim();
    const duplicate = room.players.some(
      (p) => p.displayName.toLowerCase() === trimmedName.toLowerCase() && p.connected
    );
    if (duplicate) {
      return { error: 'Name already taken in this room. Please choose another name.' };
    }

    const playerId = this.generateId();
    const sessionId = clientSessionId || this.generateId();
    const userAccount = userId ? storage.getUserById(userId) : null;

    const newPlayer: InternalPlayer = {
      id: playerId,
      sessionId,
      displayName: trimmedName,
      ws,
      isHost: false,
      ready: false,
      connected: true,
      hand: [],
      selectedCardId: null,
      hasPassed: false,
      hasFinished: false,
      matchRank: 0,
      cardsPassedCount: 0,
      cardsReceivedCount: 0,
      score: 0,
      userId: userAccount?.id,
      publicPlayerId: userAccount?.publicPlayerId,
      avatar: userAccount?.avatar || '🎮',
    };

    room.players.push(newPlayer);
    this.sessionToRoom.set(sessionId, cleanCode);

    return { room, player: newPlayer };
  }

  public reconnectPlayer(
    roomCode: string,
    sessionId: string,
    playerId: string,
    ws: WebSocket
  ): { room: InternalRoom; player: InternalPlayer } | { error: string } {
    const cleanCode = roomCode.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { error: 'Room not found. Game may have ended.' };
    }

    const player = room.players.find((p) => p.id === playerId && p.sessionId === sessionId);
    if (!player) {
      return { error: 'Player session expired or not found.' };
    }

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = undefined;
    }

    player.ws = ws;
    player.connected = true;

    return { room, player };
  }

  public handleDisconnect(ws: WebSocket): void {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.ws === ws);
      if (player) {
        player.connected = false;
        player.ws = undefined;

        if (room.status === 'lobby') {
          this.removePlayer(room.roomCode, player.id);
          this.broadcastRoom(room);
          return;
        }

        player.disconnectTimer = setTimeout(() => {
          this.handlePlayerTimeout(room.roomCode, player.id);
        }, 60000);

        this.broadcastNotification(
          room,
          `${player.displayName} disconnected. Waiting for reconnect...`,
          'warning'
        );
        this.broadcastRoom(room);
        break;
      }
    }
  }

  private handlePlayerTimeout(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.connected) return;

    this.broadcastNotification(
      room,
      `${player.displayName} was removed due to disconnection timeout.`,
      'warning'
    );

    const connectedPlayers = room.players.filter((p) => p.connected && p.id !== playerId);
    if (connectedPlayers.length < 2) {
      room.status = 'ended';
      this.broadcastNotification(room, 'Not enough players to continue. Game ended.', 'error');
    }

    this.removePlayer(roomCode, playerId);
    this.broadcastRoom(room);
  }

  public removePlayer(roomCode: string, playerId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const idx = room.players.findIndex((p) => p.id === playerId);
    if (idx === -1) return false;

    const [removed] = room.players.splice(idx, 1);
    if (removed.disconnectTimer) {
      clearTimeout(removed.disconnectTimer);
    }
    this.sessionToRoom.delete(removed.sessionId);

    if (removed.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
      this.broadcastNotification(room, `${room.players[0].displayName} is now the room host.`, 'info');
    }

    if (room.players.length === 0) {
      this.destroyRoom(roomCode);
    } else {
      this.broadcastRoom(room);
    }

    return true;
  }

  public toggleReady(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'lobby') return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.ready = !player.ready;
    this.broadcastRoom(room);
  }

  /**
   * Starts the game when minimum players (4) is reached.
   * Runs the cinematic countdown sequence before dealing cards.
   */
  public startGame(roomCode: string, hostPlayerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostId !== hostPlayerId) {
      return { success: false, error: 'Only the room host can start the game.' };
    }

    if (room.players.length < room.settings.minPlayers) {
      return {
        success: false,
        error: `Need at least ${room.settings.minPlayers} players to start. Current: ${room.players.length}.`,
      };
    }

    if (room.status !== 'lobby' && room.status !== 'round-ended') {
      return { success: false, error: 'Game is already starting or in progress.' };
    }

    // Lock lobby and start cinematic sequence
    room.isLocked = true;
    room.status = 'cinematic';
    const numPlayers = room.players.length;

    // Reset player scores/counters
    for (const p of room.players) {
      p.cardsPassedCount = 0;
      p.cardsReceivedCount = 0;
      p.hasPassed = false;
      p.selectedCardId = null;
    }

    // Stage 1: GET READY (shows total players)
    room.cinematicState = { step: 'ready', playerCount: numPlayers };
    this.broadcastRoom(room);

    setTimeout(() => {
      const r1 = this.rooms.get(roomCode);
      if (!r1 || r1.status !== 'cinematic') return;
      r1.cinematicState = { step: 'count_3', playerCount: numPlayers };
      this.broadcastRoom(r1);

      setTimeout(() => {
        const r2 = this.rooms.get(roomCode);
        if (!r2 || r2.status !== 'cinematic') return;
        r2.cinematicState = { step: 'count_2', playerCount: numPlayers };
        this.broadcastRoom(r2);

        setTimeout(() => {
          const r3 = this.rooms.get(roomCode);
          if (!r3 || r3.status !== 'cinematic') return;
          r3.cinematicState = { step: 'count_1', playerCount: numPlayers };
          this.broadcastRoom(r3);

          setTimeout(() => {
            const r4 = this.rooms.get(roomCode);
            if (!r4 || r4.status !== 'cinematic') return;
            r4.cinematicState = { step: 'go', playerCount: numPlayers };
            this.broadcastRoom(r4);

            setTimeout(() => {
              const rFinal = this.rooms.get(roomCode);
              if (!rFinal) return;
              rFinal.cinematicState = undefined;
              this.beginGameRound(rFinal);
            }, 800);
          }, 900);
        }, 900);
      }, 900);
    }, 1100);

    return { success: true };
  }

  private beginGameRound(room: InternalRoom): void {
    room.status = 'in-progress';
    room.phase = 'select';
    room.roundStartedAt = Date.now();
    room.passesInRound = 0;
    room.winner = undefined;
    room.lastMatchResults = undefined;

    if (room.gameMode === 'match-and-collect') {
      this.initMatchAndCollect(room);
    } else {
      this.initChorChitthi(room);
    }
  }

  // --- MATCH & COLLECT: DYNAMIC 4–30 PLAYERS ---
  private initMatchAndCollect(room: InternalRoom): void {
    const numPlayers = room.players.length;
    room.finishedPlayerIds.clear();

    // Pick exactly numPlayers distinct card types from available pool
    const pool = [...room.settings.enabledCards];
    const chosenTypes: string[] = [];

    // Cycle through pool to collect numPlayers distinct types
    let poolIndex = 0;
    while (chosenTypes.length < numPlayers) {
      const type = pool[poolIndex % pool.length];
      if (!chosenTypes.includes(type) || chosenTypes.length >= pool.length) {
        chosenTypes.push(type);
      }
      poolIndex += 1;
    }

    // Build the deck: exactly 4 cards of each chosen type => total 4 * numPlayers cards
    const deck: GameCard[] = [];
    for (const cType of chosenTypes) {
      for (let i = 0; i < 4; i++) {
        deck.push({
          id: `card-${cType}-${crypto.randomBytes(4).toString('hex')}`,
          type: cType,
        });
      }
    }

    // Fisher-Yates thorough shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Deal exactly 4 cards to EVERY single connected player 0 .. (numPlayers - 1)
    for (let pIdx = 0; pIdx < numPlayers; pIdx++) {
      const player = room.players[pIdx];
      player.hand = deck.slice(pIdx * 4, pIdx * 4 + 4);
      player.selectedCardId = null;
      player.hasPassed = false;
      player.hasFinished = false;
      player.matchRank = 0;
    }

    room.phase = 'select';
    room.transferProgress = { total: numPlayers, completed: 0 };

    this.startPassTimer(room);
    this.broadcastRoom(room);
    this.broadcastPrivateStates(room);

    // Initial check (in case of natural instant match)
    this.checkForMatchAndCollectWinner(room);
  }

  private startPassTimer(room: InternalRoom): void {
    console.log(`[TURN_START] Room ${room.roomCode} started pass timer for round ${room.currentRound}, pass ${room.passesInRound + 1}`);
    if (room.passTimer) {
      clearInterval(room.passTimer);
      room.passTimer = undefined;
    }

    let remaining = room.settings.passTimerSeconds || 12;
    room.passTimerRemaining = remaining;

    room.passTimer = setInterval(() => {
      const r = this.rooms.get(room.roomCode);
      if (!r || r.status !== 'in-progress') {
        if (room.passTimer) clearInterval(room.passTimer);
        return;
      }

      remaining -= 1;
      r.passTimerRemaining = remaining;

      if (remaining <= 0) {
        console.log(`[TIMEOUT] Room ${room.roomCode} pass timer reached 0`);
        if (r.passTimer) clearInterval(r.passTimer);
        r.passTimer = undefined;
        // Lock and auto-pass for anyone who hasn't clicked Pass yet
        this.forcePassUnselectedPlayers(r);
        this.processPassLifecycle(r);
      } else {
        this.broadcastRoom(r);
      }
    }, 1000);
  }

  public selectCard(roomCode: string, playerId: string, cardId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'in-progress' || room.phase !== 'select') {
      return { success: false, error: 'Cannot select card in current state.' };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found.' };
    if (player.hasFinished) return { success: false, error: 'You have already matched. Wait for the remaining players.' };

    if (player.hasPassed) {
      return { success: false, error: 'Card already locked for passing this round.' };
    }

    const ownsCard = player.hand.some((c) => c.id === cardId);
    if (!ownsCard) {
      return { success: false, error: 'You do not hold that card.' };
    }

    player.selectedCardId = cardId;
    console.log(`[PLAYER_MOVE] Player ${player.displayName} (${playerId}) selected a card`);
    this.sendPrivateState(player);
    this.broadcastRoom(room);

    return { success: true };
  }

  public passCard(roomCode: string, playerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'in-progress' || room.phase !== 'select') {
      return { success: false, error: 'Pass not available at this moment.' };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found.' };
    if (player.hasFinished) return { success: false, error: 'You have already matched. Wait for the remaining players.' };

    if (player.hasPassed) {
      return { success: false, error: 'You already passed your card for this round.' };
    }

    if (!player.selectedCardId) {
      return { success: false, error: 'Please select exactly one card before passing.' };
    }

    player.hasPassed = true;
    console.log(`[PASS] Player ${player.displayName} (${playerId}) locked in their pass`);
    this.broadcastRoom(room);

    // Matched hands are locked out of the passing ring. Disconnected players
    // still hold cards during the reconnect grace period and are auto-passed.
    const activePlayers = room.players.filter((p) => !p.hasFinished);
    const allPassed = activePlayers.length > 0 && activePlayers.every((p) => p.hasPassed);

    if (allPassed) {
      if (room.passTimer) {
        clearInterval(room.passTimer);
        room.passTimer = undefined;
      }
      this.processPassLifecycle(room);
    }

    return { success: true };
  }

  private forcePassUnselectedPlayers(room: InternalRoom): void {
    for (const player of room.players) {
      if (player.hasFinished) continue;
      if (!player.hasPassed) {
        if (!player.selectedCardId && player.hand.length > 0) {
          const counts = new Map<string, number>();
          for (const card of player.hand) counts.set(card.type, (counts.get(card.type) || 0) + 1);
          // Keep the strongest group and pass a least-common card on timeout.
          player.selectedCardId = [...player.hand].sort(
            (a, b) => counts.get(a.type)! - counts.get(b.type)!
          )[0].id;
        }
        player.hasPassed = true;
      }
    }
  }

  /**
   * Orchestrates the server-authoritative multi-phase pass lifecycle:
   * 1. LOCK: Lock all selections.
   * 2. TRANSFER: Collect passed cards and determine target player indexes.
   * 3. RECEIVE: Atomically deposit cards to destination hands.
   * 4. CHECK: Atomically inspect every player's hand for 4-of-a-kind.
   */
  private processPassLifecycle(room: InternalRoom): void {
    if (room.status !== 'in-progress' || room.phase !== 'select') return;
    const numPlayers = room.players.filter(p => !p.hasFinished).length;
    if (numPlayers < 2) return;

    // Phase: LOCK & TRANSFER
    room.phase = 'transfer';
    room.passesInRound += 1;
    this.broadcastRoom(room);

    setTimeout(() => {
      const r = this.rooms.get(room.roomCode);
      if (!r || r.status !== 'in-progress') return;
      const participants = r.players.filter(p => !p.hasFinished);
      const numPlayers = participants.length;

      // Extract cards selected by all players
      const passedCards: (GameCard | null)[] = [];
      for (let i = 0; i < numPlayers; i++) {
        const p = participants[i];
        const cardIdx = p.hand.findIndex((c) => c.id === p.selectedCardId);
        if (cardIdx !== -1) {
          passedCards[i] = p.hand.splice(cardIdx, 1)[0];
          p.cardsPassedCount += 1;
        } else {
          passedCards[i] = null;
        }
      }

      // Determine receiver indices according to direction for participating players
      const direction = r.settings.direction;
      const receivedCardsPerPlayer: (GameCard | null)[] = new Array(numPlayers).fill(null);

      const participatingIndices: number[] = [];
      for (let i = 0; i < numPlayers; i++) {
        if (passedCards[i] !== null) {
          participatingIndices.push(i);
        }
      }

      const numParticipating = participatingIndices.length;
      if (direction === 'random') {
        for (let i = numParticipating - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [participatingIndices[i], participatingIndices[j]] = [participatingIndices[j], participatingIndices[i]];
        }
      }
      if (numParticipating > 1) {
        for (let i = 0; i < numParticipating; i++) {
          const giverIdx = participatingIndices[i];
          let receiverIndexInArray = 0;

          if (direction === 'clockwise' || direction === 'random') {
            receiverIndexInArray = (i + 1) % numParticipating;
          } else if (direction === 'counter-clockwise') {
            receiverIndexInArray = (i - 1 + numParticipating) % numParticipating;
          }

          const targetIdx = participatingIndices[receiverIndexInArray];
          receivedCardsPerPlayer[targetIdx] = passedCards[giverIdx];
        }
      } else if (numParticipating === 1) {
        // If only one player passed, return their card to them to maintain 4-card invariant
        const soloIdx = participatingIndices[0];
        receivedCardsPerPlayer[soloIdx] = passedCards[soloIdx];
      }

      // Phase: RECEIVE
      r.phase = 'receive';
      r.transferProgress = { total: numPlayers, completed: numPlayers };

      for (let i = 0; i < numPlayers; i++) {
        const player = participants[i];
        const rec = receivedCardsPerPlayer[i];
        if (rec) {
          player.hand.push(rec);
          player.cardsReceivedCount += 1;
        }
        player.selectedCardId = null;
        player.hasPassed = false;

        if (rec && player.ws && player.ws.readyState === WebSocket.OPEN) {
          this.sendWs(player.ws, {
            type: 'cards_exchanged',
            receivedCard: rec,
          });
        }
      }

      this.broadcastPrivateStates(r);
      this.broadcastRoom(r);

      // Phase: CHECK
      setTimeout(() => {
        const rCheck = this.rooms.get(room.roomCode);
        if (!rCheck || rCheck.status !== 'in-progress') return;

        rCheck.phase = 'check';
        this.broadcastRoom(rCheck);
        
        console.log(`[TURN_END] Room ${rCheck.roomCode} pass evaluated`);

        const winnerFound = this.checkForMatchAndCollectWinner(rCheck);

        if (!winnerFound && rCheck.status === 'in-progress') {
          rCheck.currentRound += 1;
          rCheck.phase = 'select';
          this.startPassTimer(rCheck);
          this.broadcastRoom(rCheck);
        }
      }, 700);
    }, 600);
  }

  private checkForMatchAndCollectWinner(room: InternalRoom): boolean {
    if (room.status !== 'in-progress') return false;
    const activePlayers = room.players;
    let newlyFinished = false;

    // Check all players who haven't finished yet for a 4-of-a-kind match
    for (const player of room.players) {
      if (player.hasFinished) continue;
      if (player.hand.length === 4) {
        const firstType = player.hand[0].type;
        const isMatch = player.hand.every((c) => c.type === firstType);
        if (isMatch) {
          player.hasFinished = true;
          player.selectedCardId = null;
          player.hasPassed = false;
          room.finishedPlayerIds.add(player.id);
          player.matchRank = room.finishedPlayerIds.size;
          player.score += Math.max(1, activePlayers.length - player.matchRank + 1);
          newlyFinished = true;

          const cardDef = getCardDef(player.hand[0].type);
          console.log(`[PLAYER_MATCH] ${player.displayName} matched 4x${cardDef.name} — rank #${player.matchRank}`);

          // Announce this player's match to everyone, but don't end the game yet
          this.broadcastAll(room, {
            type: 'player_matched',
            playerId: player.id,
            playerName: player.displayName,
            cardType: player.hand[0].type,
            cardName: cardDef.name,
            rank: player.matchRank,
          });

          // First person to match is the "round winner" for display purposes
          if (player.matchRank === 1) {
            const duration = room.roundStartedAt ? Date.now() - room.roundStartedAt : 0;
            room.winner = {
              playerId: player.id,
              playerName: player.displayName,
              cardType: player.hand[0].type,
              cardName: cardDef.name,
              totalPasses: room.passesInRound,
              durationMs: duration,
            };
          }
        }
      }
    }

    // Never award an unmatched player a completion, even if only one remains.
    const allDone = activePlayers.every(p => p.hasFinished);

    if (allDone && room.finishedPlayerIds.size > 0) {
      // End the round only after every remaining participant has matched.
      room.status = 'round-ended';
      room.passTimerRemaining = 0;
      if (room.passTimer) {
        clearInterval(room.passTimer);
        room.passTimer = undefined;
      }

      console.log(`[ROUND_END] Room ${room.roomCode} – all players finished. Building leaderboard.`);

      // Build final sorted leaderboard
      const sortedParticipants: ParticipantResult[] = room.players
        .map((p) => {
          const typeCounts: Record<string, number> = {};
          for (const c of p.hand) typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
          const maxSame = Math.max(...Object.values(typeCounts), 1);
          const topCardType = Object.keys(typeCounts).find((k) => typeCounts[k] === maxSame) || 'unknown';
          const topDef = getCardDef(topCardType);
          const cardDef = p.hasFinished ? getCardDef(p.hand[0].type) : topDef;
          return {
            playerId: p.id,
            displayName: p.displayName,
            rank: p.hasFinished ? p.matchRank : activePlayers.length + 1,
             status: (p.matchRank === 1 ? 'winner' : 'completed') as ParticipantResult['status'],
            cardsPassed: p.cardsPassedCount,
            cardsReceived: p.cardsReceivedCount,
            matchProgress: p.hasFinished
              ? `4 × ${cardDef.name} (Matched!)`
              : `${maxSame} × ${topDef.name}`,
            maxSame,
          };
        })
        .sort((a, b) => a.rank - b.rank);

      room.lastMatchResults = sortedParticipants;

      // Persist the match result
      if (room.winner) {
        const primaryWinner = room.players.find(p => p.matchRank === 1)!;
        const cardDef = getCardDef(primaryWinner.hand[0].type);
        const duration = room.roundStartedAt ? Date.now() - room.roundStartedAt : 0;
        storage.recordMatchResult({
          id: this.generateId(),
          roomId: room.id,
          roomCode: room.roomCode,
          gameMode: 'match-and-collect',
          playerCount: room.players.length,
          winnerId: primaryWinner.id,
          winnerName: primaryWinner.displayName,
          winningCardType: primaryWinner.hand[0].type,
          winningCardName: cardDef.name,
          detail: `Collected 4 ${cardDef.name} cards in ${room.passesInRound} passes!`,
          durationMs: duration,
          totalRounds: room.currentRound,
          totalCardsTransferred: room.players.reduce((total, player) => total + player.cardsPassedCount, 0),
          completedAt: new Date().toISOString(),
          participants: sortedParticipants,
        });
      }

      this.broadcastAll(room, {
        type: 'match_complete',
        winner: room.winner,
        results: sortedParticipants,
      });

      this.broadcastRoom(room);
      return true;
    }

    // Game continues – broadcast updated room so new rank badges are visible
    if (newlyFinished) {
      this.broadcastPrivateStates(room);
      this.broadcastRoom(room);
    }

    return false;
  }

  // --- CHOR-CHITTHI MODE LOGIC ---
  private initChorChitthi(room: InternalRoom): void {
    const numPlayers = room.players.length;
    const roles: string[] = ['raja', 'rani', 'police', 'chor'];
    while (roles.length < numPlayers) {
      roles.push('praja');
    }

    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    let policePlayer: InternalPlayer | undefined;
    for (let i = 0; i < numPlayers; i++) {
      const player = room.players[i];
      player.chorRole = roles[i];
      if (roles[i] === 'police') {
        policePlayer = player;
      }
    }

    const suspects = room.players
      .filter((p) => p.id !== policePlayer?.id)
      .map((p) => ({ id: p.id, displayName: p.displayName }));

    room.chorChitthiState = {
      phase: 'police-turn',
      policePlayerId: policePlayer?.id,
      policePlayerName: policePlayer?.displayName,
      suspects,
    };

    this.broadcastPrivateStates(room);
    this.broadcastRoom(room);

    if (policePlayer) {
      this.broadcastNotification(
        room,
        `Police (${policePlayer.displayName}) must now identify who the Chor is!`,
        'info'
      );
    }
  }

  public policeAccuse(
    roomCode: string,
    policePlayerId: string,
    suspectId: string
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room || room.gameMode !== 'chor-chitthi' || room.status !== 'in-progress') {
      return { success: false, error: 'Chor-Chitthi accusation not available.' };
    }

    if (room.chorChitthiState?.policePlayerId !== policePlayerId) {
      return { success: false, error: 'Only the Police can make an accusation!' };
    }

    const suspect = room.players.find((p) => p.id === suspectId);
    const police = room.players.find((p) => p.id === policePlayerId);
    const chor = room.players.find((p) => p.chorRole === 'chor');

    if (!suspect || !police || !chor) {
      return { success: false, error: 'Suspect or player not found.' };
    }

    const isChor = suspect.id === chor.id;
    const scores: Record<string, number> = {};

    for (const p of room.players) {
      if (p.chorRole === 'raja') {
        p.score += 1000;
        scores[p.id] = 1000;
      } else if (p.chorRole === 'rani') {
        p.score += 800;
        scores[p.id] = 800;
      } else if (p.chorRole === 'praja') {
        p.score += 100;
        scores[p.id] = 100;
      }
    }

    if (isChor) {
      police.score += 500;
      chor.score += 0;
      scores[police.id] = 500;
      scores[chor.id] = 0;
    } else {
      police.score += 0;
      chor.score += 500;
      scores[police.id] = 0;
      scores[chor.id] = 500;
    }

    room.status = 'round-ended';
    room.chorChitthiState = {
      phase: 'results',
      policePlayerId: police.id,
      policePlayerName: police.displayName,
      accusedPlayerId: suspect.id,
      roundResult: {
        policeWon: isChor,
        chorPlayerId: chor.id,
        chorPlayerName: chor.displayName,
        policePlayerName: police.displayName,
        scores,
      },
    };

    const chorParticipants: ParticipantResult[] = room.players
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({
        playerId: p.id,
        displayName: p.displayName,
        rank: idx + 1,
        status: (isChor ? p.id === police.id : p.id === chor.id) ? 'winner' : 'completed',
        cardsPassed: 0,
        cardsReceived: 0,
        matchProgress: `Role: ${p.chorRole?.toUpperCase()} (${scores[p.id]} pts)`,
      }));

    room.lastMatchResults = chorParticipants;

    storage.recordMatchResult({
      id: this.generateId(),
      roomId: room.id,
      roomCode: room.roomCode,
      gameMode: 'chor-chitthi',
      playerCount: room.players.length,
      winnerId: isChor ? police.id : chor.id,
      winnerName: isChor ? police.displayName : chor.displayName,
      winningCardType: 'badge',
      winningCardName: isChor ? 'Police' : 'Chor',
      detail: isChor
        ? `Police ${police.displayName} correctly caught Chor ${chor.displayName}!`
        : `Chor ${chor.displayName} escaped from Police ${police.displayName}!`,
      durationMs: room.roundStartedAt ? Date.now() - room.roundStartedAt : 0,
      totalRounds: room.currentRound,
      totalCardsTransferred: 0,
      completedAt: new Date().toISOString(),
      participants: chorParticipants,
    });

    this.broadcastAll(room, {
      type: 'chor_round_ended',
      result: room.chorChitthiState.roundResult,
    });

    this.broadcastRoom(room);
    this.broadcastPrivateStates(room);

    return { success: true };
  }

  public nextRound(roomCode: string, hostPlayerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostId !== hostPlayerId) {
      return { success: false, error: 'Only the host can start the next round.' };
    }

    // Guard against double-start
    if (room.status !== 'round-ended') {
      return { success: false, error: 'No completed game to start a new round from.' };
    }

    console.log(`[NEXT_ROUND] Room ${room.roomCode} moving to next game by host ${hostPlayerId}`);

    this.beginNextGame(room);
    return { success: true };
  }

  /**
   * Phase 4.1: Any player can mark themselves as ready for a rematch.
   * When ALL connected players are ready, the next game starts automatically.
   * The host can also force-start via next_round at any time.
   */
  public readyForRematch(roomCode: string, playerId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.status !== 'round-ended') {
      return { success: false, error: 'No completed game to rematch from.' };
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found.' };

    // Idempotent: toggling off is intentional
    if (room.rematchReadyIds.has(playerId)) {
      room.rematchReadyIds.delete(playerId);
      this.broadcastRoom(room);
      return { success: true };
    }

    room.rematchReadyIds.add(playerId);
    this.broadcastRoom(room);

    // Auto-start: all connected players are ready
    const connectedPlayers = room.players.filter((p) => p.connected);
    const allReady =
      connectedPlayers.length >= room.settings.minPlayers &&
      connectedPlayers.every((p) => room.rematchReadyIds.has(p.id));

    if (allReady && !room.rematchStarting) {
      room.rematchStarting = true;
      console.log(`[REMATCH] Room ${room.roomCode} auto-starting next game — all ${connectedPlayers.length} players ready.`);
      this.broadcastNotification(room, 'All players ready! Starting next game...', 'success');
      // Short delay so clients can see the "all ready" state
      setTimeout(() => {
        const r = this.rooms.get(roomCode);
        if (r && r.status === 'round-ended') {
          this.beginNextGame(r);
        }
      }, 1500);
    }

    return { success: true };
  }

  /**
   * Phase 4.1: Transitions the room from round-ended to the next game's lobby,
   * preserving room membership and accumulating session scores.
   */
  private beginNextGame(room: InternalRoom): void {
    // Accumulate session scores from the completed game
    for (const p of room.players) {
      if (!room.sessionScores.has(p.id)) {
        room.sessionScores.set(p.id, { displayName: p.displayName, wins: 0, gamesPlayed: 0 });
      }
      const stat = room.sessionScores.get(p.id)!;
      stat.gamesPlayed += 1;
      if (p.matchRank === 1) {
        stat.wins += 1;
      }
    }

    // Advance game counter
    room.matchNumber += 1;
    room.matchId = this.generateId();
    room.currentRound = 1;
    room.status = 'lobby';
    room.phase = 'select';
    room.winner = undefined;
    room.chorChitthiState = undefined;
    room.isLocked = false;
    room.cinematicState = undefined;
    room.finishedPlayerIds = new Set<string>();
    room.passesInRound = 0;
    room.rematchReadyIds = new Set<string>();
    room.rematchStarting = false;

    for (const p of room.players) {
      p.hand = [];
      p.selectedCardId = null;
      p.hasPassed = false;
      p.hasFinished = false;
      p.matchRank = 0;
      p.ready = false;
      p.chorRole = undefined;
      // NOTE: p.score accumulates across rounds within the same game session
    }

    this.broadcastRoom(room);
    this.broadcastPrivateStates(room);
    this.broadcastNotification(
      room,
      `Game ${room.matchNumber} lobby opened. Ready up for the next match!`,
      'info'
    );
  }

  public updateSettings(
    roomCode: string,
    hostPlayerId: string,
    settings: Partial<RoomSettings>
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostId !== hostPlayerId) {
      return { success: false, error: 'Only the host can update room settings.' };
    }

    if (settings.minPlayers !== undefined && (settings.minPlayers < 4 || settings.minPlayers > 30)) {
      return { success: false, error: 'Min players must be between 4 and 30.' };
    }

    if (settings.maxPlayers !== undefined && (settings.maxPlayers < 4 || settings.maxPlayers > 30)) {
      return { success: false, error: 'Max players must be between 4 and 30.' };
    }

    room.settings = { ...room.settings, ...settings };
    this.broadcastRoom(room);
    return { success: true };
  }

  public lockRoom(roomCode: string, hostPlayerId: string, locked: boolean): { success: boolean; error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostId !== hostPlayerId) {
      return { success: false, error: 'Only the host can lock the room.' };
    }

    room.isLocked = locked;
    this.broadcastRoom(room);
    this.broadcastNotification(room, locked ? 'Lobby is now locked.' : 'Lobby is unlocked.', 'info');
    return { success: true };
  }

  // --- SERIALIZATION & BROADCAST ---
  public getPublicRoomState(room: InternalRoom, countdownRemaining?: number): RoomPublicState {
    const publicPlayers: PublicPlayer[] = room.players.map((p) => {
      let status: PublicPlayer['status'] = 'idle';

      if (room.status === 'in-progress') {
        if (p.hasFinished) {
          status = p.matchRank === 1 ? 'winner' : 'completed';
        } else if (room.winner && room.winner.playerId === p.id) {
          status = 'winner';
        } else if (room.phase === 'transfer') {
          status = 'passing';
        } else if (room.phase === 'receive') {
          status = 'receiving';
        } else if (room.phase === 'check') {
          status = 'checking';
        } else if (p.hasPassed) {
          status = 'selected';
        } else if (p.selectedCardId) {
          status = 'selected';
        } else {
          status = 'selecting';
        }
      } else if (room.status === 'round-ended') {
        status = room.winner && room.winner.playerId === p.id ? 'winner' : 'completed';
      }

      return {
        id: p.id,
        displayName: p.displayName,
        isHost: p.isHost,
        ready: p.ready,
        connected: p.connected,
        hasPassed: p.hasPassed,
        hasFinished: p.hasFinished,
        matchRank: p.matchRank,
        cardCount: p.hand.length,
        status,
        cardsPassedCount: p.cardsPassedCount,
        cardsReceivedCount: p.cardsReceivedCount,
        chorChitthiRoleKnown: room.chorChitthiState?.phase === 'results' || p.chorRole === 'police',
        publicRole:
          room.chorChitthiState?.phase === 'results'
            ? p.chorRole
            : p.chorRole === 'police'
            ? 'Police'
            : undefined,
        score: p.score,
        userId: p.userId,
        publicPlayerId: p.publicPlayerId,
        avatar: p.avatar,
      };
    });

    return sanitizePayload({
      id: room.id,
      roomCode: room.roomCode,
      gameMode: room.gameMode,
      status: room.status,
      phase: room.phase,
      hostId: room.hostId,
      isLocked: room.isLocked,
      settings: room.settings,
      players: publicPlayers,
      currentRound: room.currentRound,
      passesInRound: room.passesInRound,
      roundStartedAt: room.roundStartedAt,
      countdownRemaining: countdownRemaining ?? undefined,
      passTimerRemaining: room.passTimerRemaining,
      direction: room.settings.direction,
      transferProgress: room.transferProgress,
      cinematicState: room.cinematicState,
      winner: room.winner,
      lastMatchResults: room.lastMatchResults,
      chorChitthiState: room.chorChitthiState,
      // Phase 4.1 session fields
      matchNumber: room.matchNumber,
      rematchReadyIds: Array.from(room.rematchReadyIds),
      sessionScores: Object.fromEntries(room.sessionScores),
    });
  }

  public broadcastRoom(room: InternalRoom, countdownRemaining?: number): void {
    const publicState = this.getPublicRoomState(room, countdownRemaining);
    this.broadcastAll(room, {
      type: 'room_state',
      room: publicState,
    });
  }

  public broadcastPrivateStates(room: InternalRoom): void {
    for (const player of room.players) {
      this.sendPrivateState(player);
    }
  }

  public sendPrivateState(player: InternalPlayer): void {
    if (!player.ws || player.ws.readyState !== WebSocket.OPEN) return;

    const privateState: PrivatePlayerState = sanitizePayload({
      id: player.id,
      sessionId: player.sessionId,
      displayName: player.displayName,
      hand: player.hand,
      selectedCardId: player.selectedCardId,
      chorChitthiRole: player.chorRole,
      chorChitthiPoints: player.score,
      userId: player.userId,
      publicPlayerId: player.publicPlayerId,
      avatar: player.avatar,
    });

    this.sendWs(player.ws, {
      type: 'private_state',
      state: privateState,
    });
  }

  public broadcastNotification(
    room: InternalRoom,
    message: string,
    variant: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    this.broadcastAll(room, {
      type: 'notification',
      message,
      variant,
    });
  }

  public broadcastAll(room: InternalRoom, msg: ServerMessage): void {
    const raw = JSON.stringify(msg);
    for (const p of room.players) {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        try {
          p.ws.send(raw);
        } catch (err) {
          console.error(`Error sending message to player ${p.id}:`, err);
        }
      }
    }
  }

  public sendWs(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(msg));
      } catch (err) {
        console.error('Error sending WS message:', err);
      }
    }
  }

  private destroyRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (room.countdownTimer) clearTimeout(room.countdownTimer);
    if (room.passTimer) clearInterval(room.passTimer);

    for (const p of room.players) {
      if (p.disconnectTimer) clearTimeout(p.disconnectTimer);
      this.sessionToRoom.delete(p.sessionId);
    }

    this.rooms.delete(roomCode);
  }

  private cleanupAbandonedRooms(): void {
    for (const [code, room] of this.rooms.entries()) {
      const allDisconnected = room.players.every((p) => !p.connected);
      if (allDisconnected) {
        this.destroyRoom(code);
      }
    }
  }
}

export const gameEngine = new GameEngine();
