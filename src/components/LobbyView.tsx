/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Crown,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  Settings,
  Copy,
  Check,
  UserX,
  Share2,
  Sparkles,
  Zap,
  Radio,
  Flame,
} from 'lucide-react';
import { RoomPublicState } from '../types/game';
import { sound } from '../services/sound';

interface LobbyViewProps {
  room: RoomPublicState;
  currentPlayerId: string;
  onToggleReady: () => void;
  onStartGame: () => void;
  onRemovePlayer: (playerId: string) => void;
  onLockRoom: (locked: boolean) => void;
  onOpenSettings: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentPlayerId,
  onToggleReady,
  onStartGame,
  onRemovePlayer,
  onLockRoom,
  onOpenSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === currentPlayerId;
  const me = room.players.find((p) => p.id === currentPlayerId);
  const minPlayers = room.settings.minPlayers || 4;
  const maxPlayers = room.settings.maxPlayers || 30;
  const currentCount = room.players.length;
  const canStart = currentCount >= minPlayers;

  const copyInviteLink = () => {
    sound.playButtonClick();
    navigator.clipboard.writeText(`${window.location.origin}?room=${room.roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readyCount = room.players.filter((p) => p.ready).length;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 select-none animate-fadeIn">
      {/* Game Lobby Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#11192e] via-[#0b101c] to-[#070a13] border border-slate-800 p-5 sm:p-9 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Light Beam */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        {/* Lobby Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/40">
                {room.gameMode === 'match-and-collect' ? 'Match & Collect' : 'Chor-Chitthi'}
              </span>
              {room.isLocked && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Room Locked
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono">
                {room.roomCode}
              </h1>
              <button
                onClick={copyInviteLink}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              Invite 3 to 29 colleagues with this code to assemble the arena roster.
            </p>
          </div>

          {/* Dynamic Player Capacity Meter */}
          <div className="flex items-center gap-4 bg-slate-950/80 px-6 py-4 rounded-2xl border border-slate-800 shrink-0 shadow-inner">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                Lobby Capacity
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {currentCount} <span className="text-base font-normal text-slate-500">/ {maxPlayers}</span>
              </div>
              <div className="text-xs font-semibold">
                {canStart ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Minimum reached ({minPlayers}+)
                  </span>
                ) : (
                  <span className="text-amber-400">
                    Need {minPlayers - currentCount} more player{minPlayers - currentCount > 1 ? 's' : ''} to launch
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 30-Slot Visual Player Grid Matrix */}
        <div className="my-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                Connected Roster
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300 font-bold">
                {readyCount} / {currentCount} Ready
              </span>
            </div>

            {isHost && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onLockRoom(!room.isLocked);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {room.isLocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{room.isLocked ? 'Unlock Lobby' : 'Lock Lobby'}</span>
                </button>
                <button
                  onClick={() => {
                    sound.playButtonClick();
                    onOpenSettings();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Config</span>
                </button>
              </div>
            )}
          </div>

          {/* Visual slot chips for up to 30 players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {(room.players || []).map((p) => {
              const isCurrentMe = p.id === currentPlayerId;
              const safeInitial = (p.displayName || 'P').charAt(0).toUpperCase();
              return (
                <div
                  key={p.id}
                  className={`p-3 min-h-[54px] rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                    isCurrentMe
                      ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        p.isHost
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {safeInitial}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1 truncate">
                        <span className="font-bold text-xs text-slate-100 truncate">
                          {p.displayName || 'Player'}
                        </span>
                        {p.isHost && (
                          <span title="Host">
                            <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {isCurrentMe ? 'You' : p.connected ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {p.ready ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <span>READY</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800">
                        WAITING
                      </span>
                    )}

                    {isHost && !p.isHost && (
                      <button
                        onClick={() => {
                          sound.playButtonClick();
                          onRemovePlayer(p.id);
                        }}
                        title="Kick player"
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty slot placeholders */}
            {Array.from({ length: Math.min(5, Math.max(0, minPlayers - currentCount)) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 flex items-center justify-center text-slate-600 text-xs font-mono"
              >
                + Empty Slot
              </div>
            ))}
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => {
              sound.playButtonClick();
              onToggleReady();
            }}
            className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
              me?.ready
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{me?.ready ? 'LOCKED IN · READY' : 'CLICK TO READY UP'}</span>
          </button>

          {isHost ? (
            <button
              onClick={() => {
                sound.playButtonClick();
                onStartGame();
              }}
              disabled={!canStart}
              className={`w-full sm:w-auto px-9 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all transform ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_35px_rgba(251,191,36,0.4)] hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-400/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>
                {canStart
                  ? `LAUNCH MATCH (${currentCount} PLAYERS)`
                  : `NEED ${minPlayers - currentCount} MORE TO LAUNCH`}
              </span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 font-medium text-center sm:text-right">
              {canStart
                ? 'Minimum players reached! Waiting for host to launch the match...'
                : `Waiting for ${minPlayers - currentCount} more player(s) to join...`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
