/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  RotateCw,
  Clock,
  Sparkles,
  Layers,
  Check,
  MousePointerClick,
  Download,
  Trophy,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { GamePhase } from '../types/game';

interface PhaseIndicatorProps {
  currentPhase: GamePhase;
  currentRound: number;
  passTimerRemaining?: number;
  totalTimerSeconds?: number;
  direction?: 'clockwise' | 'counter-clockwise' | 'random';
}

interface StepDefinition {
  id: GamePhase;
  stepNumber: number;
  label: string;
  shortDesc: string;
  guidance: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepDefinition[] = [
  {
    id: 'select',
    stepNumber: 1,
    label: 'SELECT',
    shortDesc: 'Choose 1 Card',
    guidance: 'Pick 1 card from your hand to pass to your neighbor.',
    icon: MousePointerClick,
  },
  {
    id: 'transfer',
    stepNumber: 2,
    label: 'PASS',
    shortDesc: 'Arena Rotation',
    guidance: 'Passing selected cards simultaneously around the table.',
    icon: RotateCw,
  },
  {
    id: 'receive',
    stepNumber: 3,
    label: 'RECEIVE',
    shortDesc: 'Card Handshake',
    guidance: 'Incoming card delivered! Check your new 4-card combination.',
    icon: Download,
  },
  {
    id: 'check',
    stepNumber: 4,
    label: 'CHECK',
    shortDesc: '4-Match Evaluation',
    guidance: 'Server evaluates all hands for 4 identical cards to crown the winner!',
    icon: Trophy,
  },
];

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
  currentPhase,
  currentRound,
  passTimerRemaining,
  direction = 'clockwise',
}) => {
  // Map phase to step index (0 to 3)
  const effectiveStepId = currentPhase === 'lock' ? 'transfer' : currentPhase;
  const currentStepIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.id === effectiveStepId)
  );

  // Exact step progress percentage (25% for Step 1, 50% for Step 2, 75% for Step 3, 100% for Step 4)
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;
  const activeStep = STEPS[currentStepIndex];

  const isUrgent = (passTimerRemaining ?? 10) <= 3 && currentPhase === 'select';

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#131b2e] via-[#0d1322] to-[#070b14] border border-slate-800 p-4 sm:p-6 shadow-2xl overflow-hidden">
      {/* Ambient Top Glow Beam */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

      {/* Top Header Row: Round Badge, Sequence Compass, Active Phase Badge, Timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          {/* Round Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            <span>Round {currentRound}</span>
          </div>

          {/* Table Rotation Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
            <RotateCw
              className={`w-3.5 h-3.5 text-cyan-400 ${
                currentPhase === 'transfer' ? 'animate-spin' : ''
              } ${direction === 'counter-clockwise' ? '-scale-x-100' : ''}`}
            />
            <span className="hidden sm:inline text-slate-400">Passing:</span>
            <span className="font-mono text-cyan-300 font-bold uppercase">
              {direction === 'clockwise'
                ? 'Clockwise'
                : direction === 'counter-clockwise'
                ? 'Counter-Clockwise'
                : 'Random Shift'}
            </span>
          </div>
        </div>

        {/* Phase Pill & Countdown Clock */}
        <div className="flex items-center gap-2">
          {currentPhase === 'select' && passTimerRemaining !== undefined && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                isUrgent
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 animate-pulse ring-2 ring-rose-500/30'
                  : 'bg-slate-900 border border-slate-800 text-amber-400'
              }`}
            >
              {isUrgent ? <Flame className="w-3.5 h-3.5 text-rose-400" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{passTimerRemaining}s Left</span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5 shadow-sm shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Phase: {activeStep.label}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTINUOUS STEP-BASED ANIMATED PROGRESS TRACK
         ========================================================================= */}
      <div className="relative mb-6 px-2 sm:px-4">
        {/* Background Track */}
        <div className="relative h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
          {/* Animated Fill Bar */}
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-700 ease-out relative shadow-[0_0_20px_rgba(251,191,36,0.65)]"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Light Sweep Shimmer Animation */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-pulse" />
          </div>
        </div>

        {/* Milestone Node Dots along the track */}
        <div className="absolute -top-1.5 inset-x-2 sm:inset-x-4 flex justify-between pointer-events-none">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black font-mono transition-all duration-500 ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 scale-125 shadow-lg shadow-amber-400/50'
                      : isCompleted
                      ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/30'
                      : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.stepNumber}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          4 STEP CARDS PROGRESSION GRID
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {STEPS.map((step, index) => {
          const isDone = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/35 shadow-[0_0_25px_rgba(251,191,36,0.25)] scale-[1.02] z-10'
                  : isDone
                  ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800/90 text-slate-500'
              }`}
            >
              {/* Card Header: Step Pill & Step Icon */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono uppercase tracking-wider ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                        : isDone
                        ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    Step {step.stepNumber}
                  </span>

                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>

                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'text-amber-400 bg-amber-400/15 shadow-sm'
                      : isDone
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-600'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive && step.id === 'transfer' ? 'animate-spin-slow' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Title & Short Description */}
              <div>
                <h4
                  className={`font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white'
                      : isDone
                      ? 'text-emerald-200'
                      : 'text-slate-400'
                  }`}
                >
                  <span>{step.label}</span>
                  {isDone && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium line-clamp-1">
                  {step.shortDesc}
                </p>
              </div>

              {/* Status footer pill */}
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                <span
                  className={
                    isActive
                      ? 'text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1'
                      : isDone
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-600'
                  }
                >
                  {isActive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>IN PROGRESS</span>
                    </>
                  ) : isDone ? (
                    'COMPLETED'
                  ) : (
                    'PENDING'
                  )}
                </span>
                <span className="text-slate-500 font-normal">{Math.round((step.stepNumber / 4) * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          LIVE TACTICAL GUIDANCE STRIP
         ========================================================================= */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
            Action:
          </span>
          <span className="text-slate-200 font-semibold truncate sm:whitespace-normal">
            {activeStep.guidance}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0 self-end sm:self-auto">
          <span>Active Step {currentStepIndex + 1} of 4</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
        </div>
      </div>
    </div>
  );
};
