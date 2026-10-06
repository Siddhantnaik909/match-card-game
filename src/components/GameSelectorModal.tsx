/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Layers, ShieldAlert, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GameMode } from '../types/game';

interface GameSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (mode: GameMode) => void;
}

export const GameSelectorModal: React.FC<GameSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectGame,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
            Game Mode Selection
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Choose Your Office Experience
          </h2>
          <p className="text-sm text-slate-300 mt-2">
            Select between fast-paced 4-card passing or secret-identity role deduction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. MATCH & COLLECT */}
          <div className="relative group rounded-2xl border-2 border-amber-500/50 hover:border-amber-400 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> 4–30 Players
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white">MATCH &amp; COLLECT</h3>
              <p className="text-sm text-slate-300 mt-2 font-medium">
                Pass cards. Build a collection. Be the first to collect 4 identical cards.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Receive 4 office cards at start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Select &amp; pass exactly 1 card per round</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>First to match 4 identical cards wins instantly</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectGame('match-and-collect')}
              className="mt-6 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <span>Play Match &amp; Collect</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2. CHOR-CHITTHI */}
          <div className="relative group rounded-2xl border-2 border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-b from-cyan-500/10 via-slate-900/90 to-slate-950 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> 4–30 Players
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white">CHOR-CHITTHI</h3>
              <p className="text-sm text-slate-300 mt-2 font-medium">
                Choose your hidden role and outsmart everyone.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Secret roles: Raja, Rani, Police, Chor</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Police publicly announced to uncover the Chor</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Point scoring based on deduction accuracy</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectGame('chor-chitthi')}
              className="mt-6 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition"
            >
              <span>Play Chor-Chitthi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
