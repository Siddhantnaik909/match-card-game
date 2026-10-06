/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { gameEngine } from './server/gameEngine';
import { nameFilter } from './server/nameFilter';
import { storage } from './server/storage';
import { ClientMessage } from './src/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // 1. Mandatory Top-Level Request Deserialization
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 2. Health & Diagnostic Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'match-and-collect-engine',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Name Validation Endpoint
  app.post('/api/validate-name', (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const displayName = typeof body.displayName === 'string' ? body.displayName : '';
    const result = nameFilter.validate(displayName);
    if (!result.valid) {
      res.status(400).json({ valid: false, error: result.error });
      return;
    }
    res.json({ valid: true });
  });

  // 4. Persistent Results & Leaderboard Endpoints
  app.get('/api/results', (_req: Request, res: Response) => {
    const results = storage.getResults(50);
    res.json({ results });
  });

  app.get('/api/leaderboard', (_req: Request, res: Response) => {
    const leaderboard = storage.getLeaderboard();
    res.json({ leaderboard });
  });

  app.post('/api/validate-room', (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (typeof body.roomCode === 'string') {
      const room = gameEngine.getRoom(body.roomCode);
      if (!room) {
        res.json({ valid: false, error: 'Invalid room code. Please check and try again.' });
        return;
      }
      if (room.isLocked || room.status !== 'lobby') {
        res.json({ valid: false, error: 'Room is locked or game has already started.' });
        return;
      }
      if (room.players.length >= room.settings.maxPlayers) {
        res.json({ valid: false, error: `Room is full (Maximum ${room.settings.maxPlayers} players).` });
        return;
      }
      res.json({ valid: true });
      return;
    }
    res.status(400).json({ valid: false, error: 'Valid roomCode string required' });
  });

  // 5. Admin Blocked Words Endpoints
  app.get('/api/admin/blocked-words', (_req: Request, res: Response) => {
    const words = nameFilter.getBlockedWords();
    res.json({ blockedWords: words });
  });

  app.post('/api/admin/blocked-words', (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (typeof body.word === 'string' && body.word.trim()) {
      nameFilter.addBlockedWord(body.word.trim());
      storage.saveBlockedWords(nameFilter.getBlockedWords());
      res.json({ success: true, blockedWords: nameFilter.getBlockedWords() });
      return;
    }
    res.status(400).json({ error: 'Valid word string required' });
  });

  app.delete('/api/admin/blocked-words', (req: Request, res: Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (typeof body.word === 'string' && body.word.trim()) {
      nameFilter.removeBlockedWord(body.word.trim());
      storage.saveBlockedWords(nameFilter.getBlockedWords());
      res.json({ success: true, blockedWords: nameFilter.getBlockedWords() });
      return;
    }
    res.status(400).json({ error: 'Valid word string required' });
  });

  // 6. Real-Time WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Map each connected socket to active metadata
  interface SocketMeta {
    roomCode?: string;
    playerId?: string;
    sessionId?: string;
    isAlive: boolean;
  }
  const socketMetaMap = new WeakMap<WebSocket, SocketMeta>();

  wss.on('connection', (ws: WebSocket) => {
    socketMetaMap.set(ws, { isAlive: true });

    ws.on('pong', () => {
      const meta = socketMetaMap.get(ws);
      if (meta) meta.isAlive = true;
    });

    ws.on('message', (data: string | Buffer) => {
      try {
        const raw = data.toString();
        const msg = JSON.parse(raw) as ClientMessage;
        const meta = socketMetaMap.get(ws) || { isAlive: true };

        switch (msg.type) {
          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }

          case 'register_global': {
            const res = gameEngine.registerGlobalPlayer(msg.displayName, ws, msg.sessionId);
            if ('error' in res) {
              ws.send(JSON.stringify({ type: 'error', code: 'REGISTER_FAILED', message: res.error }));
              return;
            }
            meta.playerId = res.player.id;
            meta.sessionId = res.player.sessionId;
            socketMetaMap.set(ws, meta);
            break;
          }

          case 'send_invite': {
            if (meta.playerId && meta.roomCode) {
              const room = gameEngine.getRoom(meta.roomCode);
              if (room) {
                const res = gameEngine.sendInvite(meta.playerId, msg.targetPlayerId, meta.roomCode, room.gameMode);
                if (!res.success && res.error) {
                  ws.send(JSON.stringify({ type: 'error', code: 'INVITE_FAILED', message: res.error }));
                }
              }
            }
            break;
          }

          case 'respond_invite': {
            if (meta.playerId) {
              const res = gameEngine.respondInvite(msg.inviteId, msg.accept, meta.playerId);
              if (!res.success && res.error) {
                ws.send(JSON.stringify({ type: 'error', code: 'RESPOND_FAILED', message: res.error }));
              }
            }
            break;
          }

          case 'create_room': {
            const res = gameEngine.createRoom(
              msg.displayName,
              msg.gameMode || 'match-and-collect',
              ws,
              msg.sessionId
            );
            if ('error' in res) {
              ws.send(JSON.stringify({ type: 'error', code: 'CREATE_FAILED', message: res.error }));
              return;
            }
            meta.roomCode = res.room.roomCode;
            meta.playerId = res.player.id;
            meta.sessionId = res.player.sessionId;
            socketMetaMap.set(ws, meta);

            if (meta.playerId) {
              gameEngine.updateGlobalPlayerStatus(meta.playerId, 'in-room');
            }

            gameEngine.broadcastRoom(res.room);
            gameEngine.sendPrivateState(res.player);
            break;
          }

          case 'join_room': {
            const res = gameEngine.joinRoom(msg.roomCode, msg.displayName, ws, msg.sessionId);
            if ('error' in res) {
              ws.send(JSON.stringify({ type: 'error', code: 'JOIN_FAILED', message: res.error }));
              return;
            }
            meta.roomCode = res.room.roomCode;
            meta.playerId = res.player.id;
            meta.sessionId = res.player.sessionId;
            socketMetaMap.set(ws, meta);

            if (meta.playerId) {
              gameEngine.updateGlobalPlayerStatus(meta.playerId, 'in-room');
            }

            gameEngine.broadcastRoom(res.room);
            gameEngine.sendPrivateState(res.player);
            gameEngine.broadcastNotification(res.room, `${res.player.displayName} joined the lobby!`, 'info');
            break;
          }

          case 'reconnect': {
            const res = gameEngine.reconnectPlayer(msg.roomCode, msg.sessionId, msg.playerId, ws);
            if ('error' in res) {
              ws.send(JSON.stringify({ type: 'error', code: 'RECONNECT_FAILED', message: res.error }));
              return;
            }
            meta.roomCode = res.room.roomCode;
            meta.playerId = res.player.id;
            meta.sessionId = res.player.sessionId;
            socketMetaMap.set(ws, meta);

            if (meta.playerId) {
              gameEngine.updateGlobalPlayerStatus(meta.playerId, 'in-room');
            }

            gameEngine.broadcastRoom(res.room);
            gameEngine.sendPrivateState(res.player);
            gameEngine.broadcastNotification(res.room, `${res.player.displayName} reconnected.`, 'info');
            break;
          }

          case 'toggle_ready': {
            if (meta.roomCode && meta.playerId) {
              gameEngine.toggleReady(meta.roomCode, meta.playerId);
            }
            break;
          }

          case 'start_game': {
            if (meta.roomCode && meta.playerId) {
              const res = gameEngine.startGame(meta.roomCode, meta.playerId);
              if (!res.success && res.error) {
                ws.send(JSON.stringify({ type: 'error', code: 'START_FAILED', message: res.error }));
              }
            }
            break;
          }

          case 'select_card': {
            if (meta.roomCode && meta.playerId && msg.cardId) {
              const res = gameEngine.selectCard(meta.roomCode, meta.playerId, msg.cardId);
              if (!res.success && res.error) {
                ws.send(JSON.stringify({ type: 'error', code: 'SELECT_FAILED', message: res.error }));
              }
            }
            break;
          }

          case 'pass_card': {
            if (meta.roomCode && meta.playerId) {
              const res = gameEngine.passCard(meta.roomCode, meta.playerId);
              if (!res.success && res.error) {
                ws.send(JSON.stringify({ type: 'error', code: 'PASS_FAILED', message: res.error }));
              }
            }
            break;
          }

          case 'police_accuse': {
            if (meta.roomCode && meta.playerId && msg.suspectId) {
              const res = gameEngine.policeAccuse(meta.roomCode, meta.playerId, msg.suspectId);
              if (!res.success && res.error) {
                ws.send(JSON.stringify({ type: 'error', code: 'ACCUSE_FAILED', message: res.error }));
              }
            }
            break;
          }

          case 'next_round': {
            if (meta.roomCode && meta.playerId) {
              const res = gameEngine.nextRound(meta.roomCode, meta.playerId);
              if (!res.success && res.error) {
                ws.send(JSON.stringify({ type: 'error', code: 'NEXT_ROUND_FAILED', message: res.error }));
              }
            }
            break;
          }

          case 'update_settings': {
            if (meta.roomCode && meta.playerId && msg.settings) {
              const res = gameEngine.updateSettings(meta.roomCode, meta.playerId, msg.settings);
              if (!res.success && res.error) {
                ws.send(JSON.stringify({ type: 'error', code: 'SETTINGS_FAILED', message: res.error }));
              }
            }
            break;
          }

          case 'remove_player': {
            if (meta.roomCode && meta.playerId && msg.playerId) {
              const room = gameEngine.getRoom(meta.roomCode);
              if (room && room.hostId === meta.playerId) {
                gameEngine.removePlayer(meta.roomCode, msg.playerId);
              }
            }
            break;
          }

          case 'lock_room': {
            if (meta.roomCode && meta.playerId) {
              gameEngine.lockRoom(meta.roomCode, meta.playerId, Boolean(msg.locked));
            }
            break;
          }

          case 'leave_room': {
            if (meta.roomCode && meta.playerId) {
              gameEngine.removePlayer(meta.roomCode, meta.playerId);
              gameEngine.updateGlobalPlayerStatus(meta.playerId, 'idle');
              meta.roomCode = undefined;
              meta.playerId = undefined;
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      gameEngine.removeGlobalPlayer(ws);
      gameEngine.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket connection error:', err);
    });
  });

  // Heartbeat ping interval to keep connections alive and prune stale sockets
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const meta = socketMetaMap.get(ws);
      if (meta && !meta.isAlive) {
        ws.terminate();
        return;
      }
      if (meta) meta.isAlive = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // 7. Mount Vite in dev or static files in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Match & Collect Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
