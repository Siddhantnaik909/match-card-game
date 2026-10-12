/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
  MousePointerClick,
  Layers,
  Flame,
} from 'lucide-react';
import { RoomPublicState, PrivatePlayerState, GameCard } from '../types/game';
import { GameArena } from './GameArena';
import { PlayingCard } from './PlayingCard';
import { getCardDef } from '../utils/cards';

interface MatchCollectBoardProps {
  room: RoomPublicState;
  privatePlayer: PrivatePlayerState | null;
  lastReceivedCard: GameCard | null;
  isPassingAnim: boolean;
  onSelectCard: (cardId: string) => void;
  onPassCard: () => void;
}

export const MatchCollectBoard: React.FC<MatchCollectBoardProps> = ({
  room,
  privatePlayer,
  lastReceivedCard,
  isPassingAnim,
  onSelectCard,
  onPassCard,
}) => {
  const me = room.players.find((p) => p.id === privatePlayer?.id);
  const hand = privatePlayer?.hand || [];
  const selectedCardId = privatePlayer?.selectedCardId;
  const hasSelected = Boolean(selectedCardId);
  const hasPassed = Boolean(me?.hasPassed);
  const hasFinished = Boolean(me?.hasFinished);
  const remainingPlayers = room.players.filter(p => !p.hasFinished).length;
  const passedPlayers = room.players.filter(p => !p.hasFinished && p.hasPassed).length;
  const currentPhase = room.phase || 'select';
  const mobilePhaseLabel =
    currentPhase === 'select' ? 'Choose a card'
      : currentPhase === 'transfer' ? 'Passing cards'
      : currentPhase === 'receive' ? 'Cards received'
      : 'Checking matches';

  const selectedCard = hand.find((c) => c.id === selectedCardId);
  const selectedDef = selectedCard ? getCardDef(selectedCard.type) : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-6 select-none animate-fadeIn">
      {/* Keep the active turn visible without the full desktop arena on phones and tablets. */}
      <div
        className="lg:hidden sticky top-20 z-30 -mx-1 flex items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur-md"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
            <span className="text-amber-300">ROUND {room.currentRound}</span>
            <span className="text-slate-600" aria-hidden="true">/</span>
            <span aria-live="polite">{remainingPlayers} still playing</span>
          </div>
          <div aria-live="polite" className="mt-1 truncate text-sm font-semibold text-white">{mobilePhaseLabel}</div>
          {currentPhase === 'select' && (
            <div className="mt-0.5 text-[11px] text-slate-400">{passedPlayers} of {remainingPlayers} locked in</div>
          )}
        </div>

        <div
          className={`shrink-0 rounded-xl border px-3 py-2 text-center ${
            currentPhase === 'select' && (room.passTimerRemaining ?? 12) <= 3
              ? 'border-rose-400/50 bg-rose-500/10 text-rose-300'
              : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
          }`}
        >
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-75">
            {currentPhase === 'select' ? 'Pass in' : 'Pass'}
          </div>
          <div className="font-mono text-xl font-black leading-tight">
            {currentPhase === 'select' ? `${Math.ceil(room.passTimerRemaining ?? room.settings.passTimerSeconds)}s` : '…'}
          </div>
        </div>
      </div>

      {/* Full table arena stays on wide screens; the compact turn bar above serves smaller screens. */}
      <div className="hidden lg:block">
        <GameArena room={room} currentPlayerId={privatePlayer?.id || ''} />
      </div>

      {/* 2. Primary Gameplay Priority: Player Hand Deck */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#11182c] via-[#0b101c] to-[#070a13] border border-slate-800 p-5 sm:p-7 shadow-2xl overflow-hidden">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        {/* Hand Deck Header & Pass Action Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Your Battle Hand
              </h3>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                {hand.length} / 4 Cards
              </span>
            </div>

            <div className="text-xs sm:text-sm font-medium mt-1">
              {hasFinished ? (
                <span className="text-emerald-400 font-semibold">
                  Matched! Place #{me?.matchRank}. Your cards are locked. Waiting for {remainingPlayers} remaining {remainingPlayers === 1 ? 'player' : 'players'} — final rankings appear when everyone matches.
                </span>
              ) : hasPassed ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1.5 animate-pulse">
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {selectedDef ? selectedDef.name : 'Card'} locked in. Waiting for opponents to pass...
                  </span>
                </span>
              ) : currentPhase === 'transfer' ? (
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5 animate-pulse">
                  <span>Passing cards simultaneously around the table...</span>
                </span>
              ) : currentPhase === 'receive' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 animate-pulse">
                  <span>New card delivered! Check your 4 cards.</span>
                </span>
              ) : hasSelected && selectedDef ? (
                <span className="text-slate-200">
                  <strong className="text-amber-400 font-bold">{selectedDef.name}</strong> selected. Click{' '}
                  <strong className="text-white">"LOCK IN &amp; PASS"</strong> to confirm.
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Choose 1 card from your hand to pass to your neighbor.</span>
                </span>
              )}
            </div>
          </div>

          {/* Primary Action Button: LOCK IN & PASS */}
          <div className="shrink-0">
            <button
              onClick={onPassCard}
              disabled={hasFinished || !hasSelected || hasPassed || currentPhase !== 'select'}
              className={`w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all transform duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                hasPassed || hasFinished
                  ? 'bg-slate-800/90 text-slate-400 cursor-not-allowed border border-slate-700/60'
                  : hasSelected
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.45)] hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-amber-400/50'
                  : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              {hasFinished ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Matched · #{me?.matchRank}</span>
                </>
              ) : hasPassed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Card Locked In</span>
                </>
              ) : (
                <>
                  <span>LOCK IN &amp; PASS</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Interactive Tactical Playing Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 justify-items-center">
          {hand.map((card, idx) => {
            const isSelected = selectedCardId === card.id;
            const isNew = lastReceivedCard?.id === card.id;

            return (
              <PlayingCard
                key={card.id || `card-${idx}`}
                cardId={card.id}
                cardType={card.type}
                isSelected={isSelected}
                onSelect={() => !hasFinished && !hasPassed && currentPhase === 'select' && onSelectCard(card.id)}
                disabled={hasFinished || hasPassed || currentPhase !== 'select'}
                isNew={isNew}
                dealIndex={idx}
              />
            );
          })}
        </div>

        {/* Tactical Footer Strip */}
        <div className="mt-8 pt-4 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Collect 4 identical cards to secure your place. The game continues until everyone matches.</span>
          </div>

          <span className="font-mono text-[11px] text-slate-500">
            Pass Count: {room.passesInRound} · Total Cards Passed: {room.players.reduce((total, player) => total + (player.cardsPassedCount || 0), 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
