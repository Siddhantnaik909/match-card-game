/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  RotateCw,
  ArrowRight,
  Users,
  Award,
  Zap,
  CheckCircle2,
  Circle,
  LogOut,
  Hash,
  BarChart2,
  Crown,
  Flame,
  Star,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { RoomPublicState, ParticipantResult } from '../types/game';
import { getCardDef } from '../utils/cards';
import { sound } from '../services/sound';

interface PostGameScreenProps {
  room: RoomPublicState;
  currentPlayerId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
  onStartNextGame: () => void;
}

export const PostGameScreen: React.FC<PostGameScreenProps> = ({
  room,
  currentPlayerId,
  isHost,
  onPlayAgain,
  onLeaveRoom,
  onStartNextGame,
}) => {
  const [activeTab, setActiveTab] = useState<'results' | 'scoreboard'>('results');

  const winner = room.winner;
  const results: ParticipantResult[] = room.lastMatchResults || [];
  const matchNumber = room.matchNumber ?? room.currentRound ?? 1;
  const rematchReadyIds: string[] = room.rematchReadyIds || [];
  const sessionScores: Record<string, { wins: number; gamesPlayed: number; displayName: string }> =
    (room as any).sessionScores || {};

  const myRematchReady = rematchReadyIds.includes(currentPlayerId);
  const readyCount = rematchReadyIds.length;
  const totalPlayers = room.players.length;

  const cardDef = winner ? getCardDef(winner.cardType) : null;

  useEffect(() => {
    try {
      const end = Date.now() + 2500;
      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    } catch { /* safe */ }
  }, []);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m > 0 ? `${m}m ` : ''}${r < 10 ? '0' : ''}${r}s`;
  };

  const sessionBoard = Object.entries(sessionScores)
    .map(([playerId, data]) => {
      const player = room.players.find((p) => p.id === playerId);
      return {
        playerId,
        displayName: player?.displayName || data.displayName || playerId,
        wins: data.wins,
        gamesPlayed: data.gamesPlayed,
        connected: player?.connected ?? false,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.gamesPlayed - a.gamesPlayed);

  return (
    <div className="min-h-screen bg-[#0b101b] flex flex-col">
      {/* Sticky room header */}
      <div className="sticky top-0 z-30 bg-[#080d18]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Hash className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono font-black text-sm text-white tracking-wider">{room.roomCode}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
            <Star className="w-3 h-3" />
            <span>Game {matchNumber} Complete</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>{totalPlayers} players</span>
          </div>
          <button
            onClick={() => { sound.playButtonClick(); onLeaveRoom(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 py-6 space-y-4">

        {/* Winner Banner */}
        {winner && cardDef && (
          <div className="relative rounded-3xl bg-gradient-to-b from-[#141d33] via-[#0d1424] to-[#070b14] border border-amber-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(251,191,36,0.2)] overflow-hidden text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
                <Trophy className="w-3.5 h-3.5 fill-amber-300" />
                <span>Game {matchNumber} Winner</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{winner.playerName}</h1>
              <p className="text-sm font-bold text-slate-300 mt-1 uppercase tracking-wider">COLLECTED 4 x {cardDef.name} CARDS</p>
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-5 mb-3">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="flex-1 max-w-[80px] py-3 px-2 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-400/40 flex flex-col items-center gap-1.5">
                    <span className="text-2xl sm:text-3xl">{cardDef.emoji}</span>
                    <span className="text-[10px] font-black text-amber-300 uppercase truncate max-w-full">{cardDef.name}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-left flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0"><Clock className="w-4 h-4" /></div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Time</div>
                    <div className="text-sm font-mono font-black text-white">{formatDuration(winner.durationMs)}</div>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-left flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0"><RotateCw className="w-4 h-4" /></div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Passes</div>
                    <div className="text-sm font-mono font-black text-white">{winner.totalPasses}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('results')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${activeTab === 'results' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
            <Award className="w-3.5 h-3.5" /><span>Game {matchNumber} Results</span>
          </button>
          <button onClick={() => setActiveTab('scoreboard')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${activeTab === 'scoreboard' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>
            <BarChart2 className="w-3.5 h-3.5" /><span>Session Board</span>
          </button>
        </div>

        {/* Results tab */}
        {activeTab === 'results' && (
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Full Match Standings — {results.length} Players</span>
            </div>
            <div className="divide-y divide-slate-900">
              {results.map((p) => {
                const isWin = p.status === 'winner';
                const isMe = p.playerId === currentPlayerId;
                return (
                  <div key={p.playerId} className={`px-4 py-3 flex items-center justify-between text-xs ${isWin ? 'bg-amber-500/10 border-l-2 border-amber-500' : isMe ? 'bg-blue-500/5 border-l-2 border-blue-500/40' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 ${p.rank === 1 ? 'bg-amber-400 text-slate-950' : p.rank === 2 ? 'bg-slate-400 text-slate-950' : p.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>#{p.rank}</span>
                      <div>
                        <div className="font-bold text-slate-100">{p.displayName}{isMe && <span className="ml-1.5 text-[10px] text-blue-400">(You)</span>}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.matchProgress}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isWin ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'}`}>{isWin ? 'Winner' : `#${p.rank}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Session scoreboard tab */}
        {activeTab === 'scoreboard' && (
          <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">Session Wins — {matchNumber} Game{matchNumber !== 1 ? 's' : ''} Played</span>
              </div>
            </div>
            {sessionBoard.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No session data yet.</div>
            ) : (
              <div className="divide-y divide-slate-900">
                {sessionBoard.map((entry, idx) => {
                  const isMe = entry.playerId === currentPlayerId;
                  return (
                    <div key={entry.playerId} className={`px-4 py-3 flex items-center justify-between ${isMe ? 'bg-blue-500/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-400 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {idx === 0 ? '👑' : `#${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          {!entry.connected && <WifiOff className="w-3 h-3 text-slate-600" />}
                          <div>
                            <div className="text-xs font-bold text-slate-100">{entry.displayName}{isMe && <span className="ml-1.5 text-[10px] text-blue-400">(You)</span>}</div>
                            <div className="text-[10px] text-slate-500">{entry.gamesPlayed} game{entry.gamesPlayed !== 1 ? 's' : ''} played</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 font-black text-base font-mono">{entry.wins}</span>
                        <span className="text-[10px] text-slate-500 font-mono ml-1">W</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rematch panel */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Rematch Status</span>
            </div>
            <span className="text-xs font-mono text-slate-400">{readyCount} / {totalPlayers} ready</span>
          </div>
          <div className="h-1 bg-slate-900">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${totalPlayers > 0 ? (readyCount / totalPlayers) * 100 : 0}%` }} />
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {room.players.map((p) => {
              const isReady = rematchReadyIds.includes(p.id);
              const isMe = p.id === currentPlayerId;
              return (
                <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition ${isReady ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'}`}>
                  <div className="flex items-center gap-2">
                    {p.connected ? <Wifi className="w-3 h-3 text-emerald-400 shrink-0" /> : <WifiOff className="w-3 h-3 text-slate-600 shrink-0" />}
                    <span className="font-bold text-slate-200 truncate">
                      {p.displayName}{isMe && <span className="ml-1 text-blue-400">(You)</span>}
                      {p.isHost && <Crown className="inline w-3 h-3 text-amber-400 ml-1" />}
                    </span>
                  </div>
                  {isReady ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /><span>Ready</span></span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500"><Circle className="w-3.5 h-3.5" /><span>{p.connected ? 'Waiting' : 'Offline'}</span></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          <button
            onClick={() => { sound.playButtonClick(); onPlayAgain(); }}
            disabled={myRematchReady}
            className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${myRematchReady ? 'bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 cursor-default' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_35px_rgba(251,191,36,0.35)] hover:scale-[1.02] cursor-pointer ring-2 ring-amber-400/30'}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{myRematchReady ? "You are Ready!" : 'Play Again'}</span>
          </button>
          {isHost && (
            <button
              onClick={() => { sound.playButtonClick(); onStartNextGame(); }}
              className="sm:w-auto px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-lg shadow-blue-600/25"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Force Start</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
