/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  RotateCw,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Crown,
  Wifi,
  WifiOff,
  Flame,
  MousePointerClick,
  Download,
  Trophy,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { RoomPublicState, PublicPlayer, GamePhase } from '../types/game';

interface GameArenaProps {
  room: RoomPublicState;
  currentPlayerId: string;
}

interface StepDefinition {
  id: GamePhase;
  stepNumber: number;
  label: string;
  shortDesc: string;
  guidance: string;
}

const ARENA_STEPS: StepDefinition[] = [
  {
    id: 'select',
    stepNumber: 1,
    label: 'SELECT',
    shortDesc: 'Pick 1 Card',
    guidance: 'Choose 1 card to pass to your neighbor before the timer expires.',
  },
  {
    id: 'transfer',
    stepNumber: 2,
    label: 'PASS',
    shortDesc: 'Arena Rotation',
    guidance: 'Passing cards simultaneously around the circular arena.',
  },
  {
    id: 'receive',
    stepNumber: 3,
    label: 'RECEIVE',
    shortDesc: 'Card Transfer',
    guidance: 'Incoming card delivered! Inspect your new 4-card battle deck.',
  },
  {
    id: 'check',
    stepNumber: 4,
    label: 'CHECK',
    shortDesc: '4-Match Evaluation',
    guidance: 'Server evaluating all decks for 4 identical cards to crown the winner!',
  },
];

export const GameArena: React.FC<GameArenaProps> = ({ room, currentPlayerId }) => {
  const players = room.players;
  const numPlayers = players.length;
  const currentPhase: GamePhase = room.phase || 'select';
  const passTimer = room.passTimerRemaining ?? 12;
  const totalTimer = room.settings.passTimerSeconds || 12;
  const timerPercent = Math.max(0, Math.min(100, (passTimer / totalTimer) * 100));
  const isUrgent = passTimer <= 3 && currentPhase === 'select';

  // Count players who have locked in their card
  const passedCount = players.filter((p) => p.hasPassed).length;

  // Find player's position and immediate passing neighbors
  const myIndex = players.findIndex((p) => p.id === currentPlayerId);
  const passDirection = room.direction || 'clockwise';

  let passesToIndex = -1;
  let receivesFromIndex = -1;

  if (myIndex !== -1 && numPlayers > 1) {
    if (passDirection === 'clockwise') {
      passesToIndex = (myIndex + 1) % numPlayers;
      receivesFromIndex = (myIndex - 1 + numPlayers) % numPlayers;
    } else {
      passesToIndex = (myIndex - 1 + numPlayers) % numPlayers;
      receivesFromIndex = (myIndex + 1) % numPlayers;
    }
  }

  const passesToPlayer = passesToIndex !== -1 ? players[passesToIndex] : null;
  const receivesFromPlayer = receivesFromIndex !== -1 ? players[receivesFromIndex] : null;

  // Step Progress mapping (0 to 3)
  const effectiveStepId = currentPhase === 'lock' ? 'transfer' : currentPhase;
  const currentStepIndex = Math.max(
    0,
    ARENA_STEPS.findIndex((s) => s.id === effectiveStepId)
  );
  const progressPercent = ((currentStepIndex + 1) / ARENA_STEPS.length) * 100;
  const activeStep = ARENA_STEPS[currentStepIndex];

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-[#10182c] via-[#090f1d] to-[#060912] border border-slate-800 p-4 sm:p-6 lg:p-7 shadow-2xl overflow-hidden flex flex-col gap-6">
      {/* Background radial arena grid & ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-gradient-to-tr from-amber-500/10 via-cyan-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* =========================================================================
          SECTION 1: TOP BATTLE HUD STRIP
         ========================================================================= */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
            <Layers className="w-3.5 h-3.5" />
            <span>Round {room.currentRound}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-slate-200">
            Pass #{room.passesInRound + 1}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono">{numPlayers} Players In Arena</span>
          </div>
        </div>

        {/* Passing Compass Direction & Phase Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
            {passDirection === 'clockwise' ? (
              <RotateCw
                className={`w-3.5 h-3.5 text-cyan-400 ${
                  currentPhase === 'transfer' ? 'animate-spin' : ''
                }`}
              />
            ) : (
              <RotateCcw
                className={`w-3.5 h-3.5 text-cyan-400 ${
                  currentPhase === 'transfer' ? 'animate-spin' : ''
                }`}
              />
            )}
            <span className="font-mono text-cyan-300 uppercase">
              {passDirection === 'clockwise' ? 'Clockwise' : 'Counter-Clockwise'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Phase: {activeStep.label}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: CENTER ARENA & CIRCULAR TACTICAL TIMER
         ========================================================================= */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 my-1">
        {/* Left: Neighbor Transfer Radar (Tactical Flow) */}
        <div className="w-full lg:w-72 order-2 lg:order-1 flex flex-col gap-2.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            Your Transfer Vector
          </span>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                IN
              </span>
              <div className="truncate">
                <div className="text-[10px] text-slate-400">Receiving from</div>
                <div className="font-bold text-white truncate max-w-[130px]">
                  {receivesFromPlayer ? receivesFromPlayer.displayName : 'Previous Player'}
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                OUT
              </span>
              <div className="truncate">
                <div className="text-[10px] text-slate-400">Passing to</div>
                <div className="font-bold text-white truncate max-w-[130px]">
                  {passesToPlayer ? passesToPlayer.displayName : 'Next Player'}
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
        </div>

        {/* Center: Circular Combat Clock & Real-Time Arena Status */}
        <div className="order-1 lg:order-2 flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-slate-950/90 border border-slate-800/90 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-2">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-slate-800/90 fill-none stroke-[5]"
              />
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                style={{
                  strokeDasharray: '280',
                  strokeDashoffset: `${280 - (280 * timerPercent) / 100}`,
                  transition: 'stroke-dashoffset 0.6s ease-in-out',
                }}
                className={`fill-none stroke-[6] stroke-linecap-round ${
                  isUrgent
                    ? 'stroke-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]'
                    : 'stroke-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                }`}
              />
            </svg>

            {/* Inner Timer Content */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Round Timer</span>
              </div>

              <div
                className={`font-mono font-black text-3xl sm:text-4xl tracking-tight transition-colors ${
                  isUrgent ? 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'text-white'
                }`}
              >
                {currentPhase === 'select' ? `${passTimer.toFixed(1)}s` : '0.0s'}
              </div>

              <div className="mt-2 text-xs font-bold font-mono">
                {currentPhase === 'transfer' ? (
                  <span className="text-cyan-400 animate-pulse">Passing Cards...</span>
                ) : currentPhase === 'receive' ? (
                  <span className="text-emerald-400 animate-pulse">Cards Received!</span>
                ) : currentPhase === 'check' ? (
                  <span className="text-amber-400 animate-pulse">Evaluating 4-of-a-kind...</span>
                ) : (
                  <span className="text-amber-300">
                    {passedCount} / {numPlayers} Locked In
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Readiness Gauge */}
        <div className="w-full lg:w-72 order-3 flex flex-col gap-2.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
            Table Pass Readiness
          </span>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold">Lock-In Progress</span>
              <span className="font-mono text-amber-400 font-black">
                {Math.round((passedCount / Math.max(1, numPlayers)) * 100)}%
              </span>
            </div>

            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                style={{
                  width: `${Math.round((passedCount / Math.max(1, numPlayers)) * 100)}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              {passedCount === numPlayers
                ? 'All players locked in. Instant transfer initiated!'
                : `${numPlayers - passedCount} player(s) currently selecting their card to pass.`}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: INTEGRATED 4-STEP PHASE PROGRESSION TRACK
         ========================================================================= */}
      <div className="relative z-10 pt-2 border-t border-slate-800/80">
        {/* Animated Progress Bar */}
        <div className="relative mb-5 px-1 sm:px-2">
          <div className="relative h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(251,191,36,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 4 Step Cards Progression */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {ARENA_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/35 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-[1.01]'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950'
                        : isCompleted
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    Step {step.stepNumber}
                  </span>

                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                  {isCompleted && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>

                <div>
                  <h4
                    className={`text-xs font-black uppercase tracking-wider ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                    {step.shortDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Objective Banner */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium truncate">
            <span className="font-extrabold text-amber-400 uppercase tracking-wide text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 shrink-0">
              Current Action:
            </span>
            <span className="truncate text-slate-200">{activeStep.guidance}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline shrink-0">
            Phase {currentStepIndex + 1} of 4
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: SURROUNDING OPPONENT ROSTER (4–30 PLAYERS)
         ========================================================================= */}
      <div className="relative z-10 pt-3 border-t border-slate-800/70">
        <div className="flex items-center justify-between mb-2.5 text-xs">
          <span className="uppercase font-black tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>Arena Combatants</span>
            <span className="text-slate-500 font-normal">({numPlayers} Connected)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Simultaneous 4-card equilibrium
          </span>
        </div>

        {/* Dynamic player chips */}
        <div className="flex flex-wrap items-center gap-2 max-h-36 overflow-y-auto pr-1">
          {players.map((p, idx) => {
            const isMe = p.id === currentPlayerId;
            const hasPicked = p.hasPassed;

            return (
              <div
                key={p.id}
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                  isMe
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40'
                    : hasPicked
                    ? 'bg-slate-900/90 border-slate-700/80 text-slate-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400'
                }`}
              >
                {/* Status Dot */}
                <span
                  className={`w-2 h-2 rounded-full ${
                    !p.connected
                      ? 'bg-rose-500'
                      : hasPicked
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'bg-slate-600'
                  }`}
                />

                {/* Initial */}
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                    isMe
                      ? 'bg-amber-400 text-slate-950'
                      : p.isHost
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {p.displayName.charAt(0).toUpperCase()}
                </span>

                {/* Name */}
                <span className="font-bold truncate max-w-[100px]">
                  {p.displayName} {isMe && '(You)'}
                </span>

                {/* Lock icon if ready */}
                {hasPicked && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}

                {/* Host crown */}
                {p.isHost && (
                  <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
