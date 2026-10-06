/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ArrowDown, Layers, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'match-and-collect' | 'chor-chitthi'>('match-and-collect');

  if (!isOpen) return null;

  const steps = [
    { title: 'JOIN', desc: 'Join or create a room with 4 to 30 players.' },
    { title: 'GET 4 CARDS', desc: 'Every player starts with exactly four cards in hand.' },
    { title: 'PICK 1 CARD', desc: 'Select exactly one card you want to pass to the next player.' },
    { title: 'PASS', desc: 'All players pass their card simultaneously around the table.' },
    { title: 'RECEIVE', desc: 'Receive one card from your neighbor to keep your hand at 4 cards.' },
    { title: 'CHECK FOR 4 MATCHING CARDS', desc: 'Server checks if any player holds four identical cards.' },
    { title: 'WIN', desc: 'The first player to match four of a kind wins the game instantly!' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 p-4 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Rules &amp; Guidelines
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-white mt-0.5">
              How To Play
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex gap-2 my-4">
          <button
            onClick={() => setActiveTab('match-and-collect')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'match-and-collect'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Match &amp; Collect</span>
          </button>

          <button
            onClick={() => setActiveTab('chor-chitthi')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'chor-chitthi'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Chor-Chitthi</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'match-and-collect' ? (
            <>
              {/* Critical Reminder Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Important:</strong>
                  This is NOT a memory or flip-card game. It is a live passing card game where everyone passes simultaneously!
                </div>
              </div>

              {/* Step by step ladder */}
              <div className="space-y-2 pt-2">
                {steps.map((step, idx) => (
                  <React.Fragment key={step.title}>
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-xs sm:text-sm text-slate-100 tracking-wide">
                          {step.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{step.desc}</div>
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="flex justify-center text-slate-600">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>Summary:</strong> Everyone starts with four cards. Select one card and pass it.
                  Receive one card from another player. Continue until someone has four identical cards.
                  The first player to match four wins.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 text-xs sm:text-sm flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Hidden Role Social Deduction:</strong>
                  Roles are secret. Only the Police announces their identity to investigate everyone else!
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <strong className="text-amber-400 text-sm block">Raja (King) — 1,000 Points</strong>
                    <span className="text-xs text-slate-300">Supreme ruler of the office court.</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="text-2xl">👸</span>
                  <div>
                    <strong className="text-rose-400 text-sm block">Rani (Queen) — 800 Points</strong>
                    <span className="text-xs text-slate-300">Prestigious second-in-command.</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="text-2xl">👮‍♂️</span>
                  <div>
                    <strong className="text-blue-400 text-sm block">Police (Sipahi) — 500 Points</strong>
                    <span className="text-xs text-slate-300">Must deduce and accuse the Chor. If right, gains 500 pts. If wrong, gets 0 pts!</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="text-2xl">🥷</span>
                  <div>
                    <strong className="text-purple-400 text-sm block">Chor (Thief) — 0 or 500 Points</strong>
                    <span className="text-xs text-slate-300">Default losing role. If the Police fails to identify you, you win the 500 points!</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="text-2xl">🧑‍💼</span>
                  <div>
                    <strong className="text-emerald-400 text-sm block">Praja (Citizen) — 100 Points</strong>
                    <span className="text-xs text-slate-300">Supporters in games with 5+ players.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
