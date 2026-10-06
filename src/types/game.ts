/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'match-and-collect' | 'chor-chitthi';

export type RoomStatus = 'lobby' | 'countdown' | 'cinematic' | 'in-progress' | 'round-ended' | 'ended';

export type PassDirection = 'clockwise' | 'counter-clockwise' | 'random';

export type GamePhase = 'select' | 'lock' | 'transfer' | 'receive' | 'check';

export type PlayerActionStatus =
  | 'idle'
  | 'selecting'
  | 'selected'
  | 'passing'
  | 'receiving'
  | 'checking'
  | 'winner'
  | 'completed';

export interface CardDef {
  type: string;
  name: string;
  iconName: string;
  emoji: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  description: string;
}

export interface GameCard {
  id: string; // unique card instance ID
  type: string;
}

export interface PublicPlayer {
  id: string;
  displayName: string;
  isHost: boolean;
  ready: boolean;
  connected: boolean;
  hasPassed: boolean;
  cardCount: number;
  status: PlayerActionStatus;
  cardsPassedCount?: number;
  cardsReceivedCount?: number;
  chorChitthiRoleKnown?: boolean;
  publicRole?: string;
  score?: number;
}

export interface PrivatePlayerState {
  id: string;
  sessionId: string;
  displayName: string;
  hand: GameCard[];
  selectedCardId: string | null;
  chorChitthiRole?: string;
  chorChitthiPoints?: number;
}

export interface RoomSettings {
  minPlayers: number;
  maxPlayers: number;
  lobbyCountdownSeconds: number;
  passTimerSeconds: number;
  direction: PassDirection;
  enabledCards: string[];
  chorChitthiRoles: {
    rajaCount: number;
    raniCount: number;
    policeCount: number;
    chorCount: number;
    prajaCount: number;
    gameDurationSeconds: number;
    losingRole: string;
  };
}

export interface ParticipantResult {
  playerId: string;
  displayName: string;
  rank: number;
  status: 'winner' | 'completed';
  cardsPassed: number;
  cardsReceived: number;
  matchProgress: string;
}

export interface RoomPublicState {
  id: string;
  roomCode: string;
  gameMode: GameMode;
  status: RoomStatus;
  phase?: GamePhase;
  hostId: string;
  isLocked: boolean;
  settings: RoomSettings;
  players: PublicPlayer[];
  currentRound: number;
  passesInRound: number;
  roundStartedAt?: number;
  countdownRemaining?: number;
  passTimerRemaining?: number;
  direction: PassDirection;
  transferProgress?: {
    total: number;
    completed: number;
  };
  cinematicState?: {
    step: 'ready' | 'count_3' | 'count_2' | 'count_1' | 'go';
    playerCount: number;
  };
  winner?: {
    playerId: string;
    playerName: string;
    cardType: string;
    cardName: string;
    totalPasses: number;
    durationMs: number;
  };
  lastMatchResults?: ParticipantResult[];
  chorChitthiState?: {
    phase: 'distribution' | 'police-turn' | 'results';
    policePlayerId?: string;
    policePlayerName?: string;
    accusedPlayerId?: string;
    suspects?: { id: string; displayName: string }[];
    roundResult?: {
      policeWon: boolean;
      chorPlayerId: string;
      chorPlayerName: string;
      policePlayerName: string;
      scores: Record<string, number>;
    };
  };
}

export interface MatchResultRecord {
  id: string;
  roomId: string;
  roomCode: string;
  gameMode: GameMode;
  playerCount: number;
  winnerId: string;
  winnerName: string;
  winningCardType: string;
  winningCardName: string;
  detail: string;
  durationMs: number;
  totalRounds: number;
  totalCardsTransferred: number;
  completedAt: string;
  participants: ParticipantResult[];
}

export interface LeaderboardEntry {
  displayName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number; // percentage 0-100
  avgDurationMs: number;
  bestTimeMs?: number;
  currentStreak: number;
  bestStreak: number;
  totalRoundsSurvived: number;
  totalCardsPassed: number;
  totalCardsReceived: number;
  favoriteCard?: string;
  lastPlayed: string;
}

// Client -> Server WS Messages
export type ClientMessage =
  | { type: 'join_room'; roomCode: string; displayName: string; sessionId?: string }
  | { type: 'create_room'; displayName: string; gameMode: GameMode; sessionId?: string }
  | { type: 'reconnect'; roomCode: string; sessionId: string; playerId: string }
  | { type: 'toggle_ready' }
  | { type: 'start_game' }
  | { type: 'select_card'; cardId: string }
  | { type: 'pass_card' }
  | { type: 'police_accuse'; suspectId: string }
  | { type: 'update_settings'; settings: Partial<RoomSettings> }
  | { type: 'remove_player'; playerId: string }
  | { type: 'lock_room'; locked: boolean }
  | { type: 'next_round' }
  | { type: 'leave_room' }
  | { type: 'ping' };

// Server -> Client WS Messages
export type ServerMessage =
  | { type: 'room_state'; room: RoomPublicState }
  | { type: 'private_state'; state: PrivatePlayerState }
  | { type: 'phase_change'; phase: GamePhase; message?: string }
  | { type: 'cards_exchanged'; receivedCard: GameCard }
  | { type: 'match_complete'; winner: RoomPublicState['winner']; results: ParticipantResult[] }
  | { type: 'chor_police_phase'; policeId: string; policeName: string; suspects: { id: string; displayName: string }[] }
  | { type: 'chor_round_ended'; result: NonNullable<RoomPublicState['chorChitthiState']>['roundResult'] }
  | { type: 'error'; code: string; message: string }
  | { type: 'notification'; message: string; variant?: 'info' | 'success' | 'warning' | 'error' }
  | { type: 'pong' };
