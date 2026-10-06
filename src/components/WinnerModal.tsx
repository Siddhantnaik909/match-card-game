/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  RotateCw,
  ArrowRight,
  Sparkles,
  Users,
  Award,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { RoomPublicState, ParticipantResult } from '../types/game';
import { getCardDef } from '../utils/cards';

interface WinnerModalProps {
  winner: NonNullable<RoomPublicState['winner']>;
  results?: ParticipantResult[];
  onViewResults: () => void;
  onBackToLobby: () => void;
  isHost: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  results = [],
  onViewResults,
  onBackToLobby,
  isHost,
}) => {
  const cardDef = getCardDef(winner.cardType);

  useEffect(() => {
    // Multi-burst celebration confetti
    try {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch {
      // Safe fallback
    }
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remSec = seconds % 60;
    return `${minutes > 0 ? `${minutes}m ` : ''}${remSec < 10 ? `0${remSec}` : remSec}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-gradient-to-b from-[#141d33] via-[#0d1424] to-[#070b14] border border-amber-500/40 p-6 sm:p-8 shadow-[0_0_80px_rgba(251,191,36,0.25)] text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* 1st Place Trophy Crest */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
            <Trophy className="w-3.5 h-3.5 fill-amber-300" />
            <span>1st Place — Winner</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            MATCH COMPLETE
          </h1>

          <div className="mt-3 text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
            {winner.playerName}
          </div>

          <p className="text-xs sm:text-sm font-bold text-slate-300 mt-1 uppercase tracking-wider">
            COLLECTED 4 × {cardDef.name} CARDS
          </p>
        </div>

        {/* 4 Identical Cards Convergence */}
        <div className="relative z-10 my-6 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-center gap-2 sm:gap-4 shadow-inner">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="flex-1 py-3 px-2 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)] flex flex-col items-center justify-center gap-1.5 transform hover:scale-105 transition"
            >
              <span className="text-3xl sm:text-4xl animate-bounce" style={{ animationDelay: `${idx * 150}ms` }}>
                {cardDef.emoji}
              </span>
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-tight truncate max-w-full">
                {cardDef.name}
              </span>
            </div>
          ))}
        </div>

        {/* Match Statistics Row */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Match Time
              </div>
              <div className="text-base font-mono font-black text-white">
                {formatDuration(winner.durationMs)}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Passes
              </div>
              <div className="text-base font-mono font-black text-white">
                {winner.totalPasses} Passes
              </div>
            </div>
          </div>
        </div>

        {/* Complete Match Results Leaderboard */}
        <div className="relative z-10 text-left mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Full Match Standings ({results.length} Players)</span>
            </h4>
            <span className="text-[11px] text-slate-500">Every player recorded</span>
          </div>

          <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 p-2">
            {results.map((p) => {
              const isWin = p.status === 'winner';
              return (
                <div
                  key={p.playerId}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    isWin
                      ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center ${
                        p.rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : p.rank === 2
                          ? 'bg-slate-400 text-slate-950'
                          : p.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{p.rank}
                    </span>
                    <span className="font-bold text-slate-100 truncate max-w-[120px] sm:max-w-[160px]">
                      {p.displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      {p.matchProgress}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isWin
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isWin ? 'Winner' : 'Completed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onViewResults}
            className="w-full sm:flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-slate-800 transition"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={onBackToLobby}
            className="w-full sm:flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition cursor-pointer"
          >
            <span>{isHost ? 'START NEXT ROUND' : 'RETURN TO LOBBY'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
