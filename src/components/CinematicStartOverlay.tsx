/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Users, Zap, ShieldAlert } from 'lucide-react';

interface CinematicStartOverlayProps {
  step: 'ready' | 'count_3' | 'count_2' | 'count_1' | 'go';
  playerCount: number;
}

export const CinematicStartOverlay: React.FC<CinematicStartOverlayProps> = ({
  step,
  playerCount,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl select-none animate-fadeIn pointer-events-auto">
      {/* Background ambient shockwave rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] rounded-full border border-amber-500/30 animate-ping opacity-25" />
        <div className="w-[700px] sm:w-[900px] h-[700px] sm:h-[900px] rounded-full border border-cyan-500/20 animate-pulse opacity-20" />
      </div>

      <div className="relative z-10 text-center max-w-xl mx-auto flex flex-col items-center">
        {step === 'ready' && (
          <div className="animate-scaleIn flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles className="w-4 h-4" /> Match &amp; Collect
            </div>

            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight uppercase drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
              GET READY
            </h1>

            <div className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-200 font-mono text-sm sm:text-base font-bold shadow-xl">
              <Users className="w-5 h-5 text-blue-400" />
              <span>{playerCount} Players Assembled</span>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
              Prepare to pass cards rapidly and lock in your sets!
            </p>
          </div>
        )}

        {(step === 'count_3' || step === 'count_2' || step === 'count_1') && (
          <div className="flex flex-col items-center animate-scaleIn">
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 mb-3 font-mono">
              ROUND STARTING IN
            </span>
            <div className="text-9xl sm:text-[140px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-orange-400 to-amber-500 font-mono drop-shadow-[0_0_60px_rgba(251,191,36,0.7)]">
              {step === 'count_3' ? '3' : step === 'count_2' ? '2' : '1'}
            </div>
          </div>
        )}

        {step === 'go' && (
          <div className="flex flex-col items-center animate-scaleIn">
            <div className="w-24 h-24 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center mb-4 shadow-[0_0_80px_rgba(251,191,36,0.9)]">
              <Zap className="w-14 h-14 fill-slate-950" />
            </div>
            <h2 className="text-7xl sm:text-9xl font-black text-white uppercase tracking-wider drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
              GO!
            </h2>
            <span className="mt-3 text-sm font-mono text-amber-300 uppercase tracking-widest font-bold">
              Dealing 4 cards to all {playerCount} players...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
