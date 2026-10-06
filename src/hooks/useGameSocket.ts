/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClientMessage,
  ServerMessage,
  RoomPublicState,
  PrivatePlayerState,
  GameMode,
  RoomSettings,
  GameCard,
  GlobalPlayerInfo,
  PlayRequest,
} from '../types/game';
import { sound } from '../services/sound';

export interface ToastMessage {
  id: string;
  message: string;
  variant: 'info' | 'success' | 'warning' | 'error';
}

const SESSION_STORAGE_KEY = 'match_collect_session';

interface StoredSession {
  sessionId: string;
  playerId: string;
  roomCode: string;
  displayName: string;
}

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [room, setRoom] = useState<RoomPublicState | null>(null);
  const [privatePlayer, setPrivatePlayer] = useState<PrivatePlayerState | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastReceivedCard, setLastReceivedCard] = useState<GameCard | null>(null);
  const [isPassingAnim, setIsPassingAnim] = useState(false);
  const [lastJoinError, setLastJoinError] = useState<string | null>(null);
  
  const [globalPlayers, setGlobalPlayers] = useState<GlobalPlayerInfo[]>([]);
  const [incomingInvite, setIncomingInvite] = useState<PlayRequest | null>(null);
  
  const isPendingJoinRef = useRef(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<ClientMessage[]>([]);

  // Use refs to avoid stale closure problems in WebSocket handlers
  const roomRef = useRef<RoomPublicState | null>(null);
  const privatePlayerRef = useRef<PrivatePlayerState | null>(null);

  // Keep refs in sync with state
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { privatePlayerRef.current = privatePlayer; }, [privatePlayer]);

  const addToast = useCallback(
    (message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      // Buffer message to send as soon as connected
      messageQueueRef.current.push(msg);
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        connect();
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsReconnecting(false);

        // Flush any buffered messages (e.g. create_room / join_room)
        while (messageQueueRef.current.length > 0) {
          const pending = messageQueueRef.current.shift();
          if (pending && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(pending));
          }
        }

        // Ping heartbeat every 20 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        // Check if there was an active session to reconnect
        try {
          const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
          if (raw) {
            const stored: StoredSession = JSON.parse(raw);
            if (stored.roomCode && stored.sessionId && stored.playerId) {
              setIsReconnecting(true);
              ws.send(
                JSON.stringify({
                  type: 'reconnect',
                  roomCode: stored.roomCode,
                  sessionId: stored.sessionId,
                  playerId: stored.playerId,
                })
              );
            }
          }
        } catch (e) {
          console.warn('[WS] Session read failed:', e);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerMessage;
          switch (msg.type) {
            case 'global_state': {
              setGlobalPlayers(msg.players);
              break;
            }

            case 'invite_received': {
              sound.playCardReceive();
              setIncomingInvite(msg.invite);
              break;
            }

            case 'invite_response': {
              if (msg.accepted && msg.roomCode) {
                addToast(`${msg.targetPlayerName} accepted your invite!`, 'success');
              } else {
                addToast(`${msg.targetPlayerName} declined your invite.`, 'warning');
              }
              break;
            }

            case 'room_state': {
              // Use functional update to get fresh previous state (avoids stale closure)
              setRoom((prev) => {
                const newRoom = msg.room;

                // Cinematic audio cues
                if (newRoom.cinematicState) {
                  const step = newRoom.cinematicState.step;
                  if (step === 'ready') {
                    sound.playCountdown();
                  } else if (step === 'count_3' || step === 'count_2' || step === 'count_1') {
                    sound.playUrgentTick();
                  } else if (step === 'go') {
                    sound.playGoBuzzer();
                    sound.playDealCascade();
                  }
                }

                // In-game urgent pass timer audio cues
                if (
                  newRoom.status === 'in-progress' &&
                  newRoom.passTimerRemaining !== undefined &&
                  newRoom.passTimerRemaining <= 3 &&
                  newRoom.passTimerRemaining > 0 &&
                  prev?.passTimerRemaining !== newRoom.passTimerRemaining
                ) {
                  sound.playUrgentTick();
                }

                return newRoom;
              });

              // Room joined/created successfully — clear any pending join error
              isPendingJoinRef.current = false;
              setLastJoinError(null);
              break;
            }

            case 'private_state': {
              setPrivatePlayer(msg.state);
              // Save session for reconnect — use roomCode from room_state message
              // which arrives before or alongside private_state.
              // Use ref to get fresh room value, and also check the room code
              // from the message itself if available.
              if (msg.state.sessionId && msg.state.id) {
                // Try to get roomCode from current room ref
                const currentRoomCode = roomRef.current?.roomCode;
                if (currentRoomCode) {
                  const stored: StoredSession = {
                    sessionId: msg.state.sessionId,
                    playerId: msg.state.id,
                    roomCode: currentRoomCode,
                    displayName: msg.state.displayName,
                  };
                  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
                } else {
                  // room_state may not have been processed yet — delay briefly
                  setTimeout(() => {
                    const delayedRoomCode = roomRef.current?.roomCode;
                    if (delayedRoomCode) {
                      const stored: StoredSession = {
                        sessionId: msg.state.sessionId,
                        playerId: msg.state.id,
                        roomCode: delayedRoomCode,
                        displayName: msg.state.displayName,
                      };
                      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
                    }
                  }, 100);
                }
              }
              break;
            }

            case 'cards_exchanged': {
              sound.playCardReceive();
              setLastReceivedCard(msg.receivedCard);
              setIsPassingAnim(true);
              setTimeout(() => {
                setIsPassingAnim(false);
              }, 1200);
              break;
            }

            case 'match_complete': {
              sound.playVictory();
              setRoom((prev) =>
                prev
                  ? {
                      ...prev,
                      status: 'round-ended',
                      winner: msg.winner,
                      lastMatchResults: msg.results,
                    }
                  : null
              );
              addToast(`MATCH COMPLETE! ${msg.winner?.playerName} won!`, 'success');
              break;
            }

            case 'chor_round_ended': {
              sound.playVictory();
              addToast(
                msg.result?.policeWon
                  ? `Police ${msg.result.policePlayerName} caught the Chor!`
                  : `Chor ${msg.result?.chorPlayerName} escaped!`,
                'success'
              );
              break;
            }

            case 'notification': {
              addToast(msg.message, msg.variant || 'info');
              break;
            }

            case 'error': {
              // If we're waiting on a join/create, surface the error into the modal
              if (isPendingJoinRef.current) {
                setLastJoinError(msg.message);
                isPendingJoinRef.current = false;
              } else {
                addToast(msg.message, 'error');
              }
              break;
            }

            case 'pong':
              break;
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // If we were inside an active room, schedule reconnect attempt
        const hasSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (hasSession) {
          setIsReconnecting(true);
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 2500);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    } catch (err) {
      console.error('[WS] Connection init failed:', err);
    }
  // IMPORTANT: No dependency on room — we use refs to avoid WebSocket reconnection loops
  }, [addToast]);

  useEffect(() => {
    connect();
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // Action methods
  const registerGlobal = useCallback((displayName: string) => {
    send({ type: 'register_global', displayName });
  }, [send]);

  const sendInvite = useCallback((targetPlayerId: string) => {
    send({ type: 'send_invite', targetPlayerId });
  }, [send]);

  const respondInvite = useCallback((inviteId: string, accept: boolean) => {
    send({ type: 'respond_invite', inviteId, accept });
    setIncomingInvite(null);
  }, [send]);

  const createRoom = useCallback(
    (displayName: string, gameMode: GameMode = 'match-and-collect') => {
      isPendingJoinRef.current = true;
      setLastJoinError(null);
      send({ type: 'create_room', displayName, gameMode });
    },
    [send]
  );

  const joinRoom = useCallback(
    (roomCode: string, displayName: string) => {
      isPendingJoinRef.current = true;
      setLastJoinError(null);
      send({ type: 'join_room', roomCode, displayName });
    },
    [send]
  );

  const clearJoinError = useCallback(() => {
    setLastJoinError(null);
    isPendingJoinRef.current = false;
  }, []);

  const toggleReady = useCallback(() => {
    send({ type: 'toggle_ready' });
  }, [send]);

  const startGame = useCallback(() => {
    send({ type: 'start_game' });
  }, [send]);

  const selectCard = useCallback(
    (cardId: string) => {
      sound.playCardSelect();
      send({ type: 'select_card', cardId });
    },
    [send]
  );

  const passCard = useCallback(() => {
    sound.playCardPass();
    send({ type: 'pass_card' });
  }, [send]);

  const policeAccuse = useCallback(
    (suspectId: string) => {
      send({ type: 'police_accuse', suspectId });
    },
    [send]
  );

  const nextRound = useCallback(() => {
    send({ type: 'next_round' });
  }, [send]);

  const updateSettings = useCallback(
    (settings: Partial<RoomSettings>) => {
      send({ type: 'update_settings', settings });
    },
    [send]
  );

  const removePlayer = useCallback(
    (playerId: string) => {
      send({ type: 'remove_player', playerId });
    },
    [send]
  );

  const lockRoom = useCallback(
    (locked: boolean) => {
      send({ type: 'lock_room', locked });
    },
    [send]
  );

  const leaveRoom = useCallback(() => {
    send({ type: 'leave_room' });
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setRoom(null);
    setPrivatePlayer(null);
  }, [send]);

  return {
    isConnected,
    isReconnecting,
    room,
    privatePlayer,
    toasts,
    lastReceivedCard,
    isPassingAnim,
    lastJoinError,
    clearJoinError,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    selectCard,
    passCard,
    policeAccuse,
    nextRound,
    updateSettings,
    removePlayer,
    lockRoom,
    leaveRoom,
    addToast,
    globalPlayers,
    incomingInvite,
    registerGlobal,
    sendInvite,
    respondInvite,
  };
}
