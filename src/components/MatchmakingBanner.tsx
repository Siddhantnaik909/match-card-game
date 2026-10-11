/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Loader2, X, Users, Compass } from 'lucide-react';
import { GameMode } from '../types/game';
import { sound } from '../services/sound';

interface MatchmakingBannerProps {
  inQueue: boolean;
  queueLength: number;
  gameMode: GameMode;
  estimatedWaitSeconds: number;
  onCancel: () => void;
}

export const MatchmakingBanner: React.FC<MatchmakingBannerProps> = ({
  inQueue,
  queueLength,
  gameMode,
  estimatedWaitSeconds,
  onCancel,
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!inQueue) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [inQueue]);

  if (!inQueue) return null;

  const formatSec = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-amber-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-white tracking-wide">
                Searching For Match
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400">
              Mode: <span className="text-amber-300 font-bold uppercase">{gameMode}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playButtonClick();
            onCancel();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Cancel search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>In Queue: <strong className="text-white">{queueLength}</strong></span>
        </div>
        <div className="text-amber-400 font-bold">
          Elapsed: {formatSec(elapsed)}
        </div>
      </div>
    </div>
  );
};
