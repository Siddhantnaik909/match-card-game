/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Radio,
  Layers,
  Trophy,
  ArrowRight,
  HelpCircle,
  Gamepad2,
  Sparkles,
  RotateCw,
  Zap,
  CheckCircle2,
  Shield,
  Award,
  ChevronRight,
  Flame,
  Laptop,
  Coffee,
  Sprout,
  Headphones,
  Smartphone,
  FolderKanban,
  Play,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import { GameMode, MatchResultRecord, LeaderboardEntry } from '../types/game';
import { sound } from '../services/sound';
import { OFFICE_CARDS } from '../utils/cards';

interface LandingHeroProps {
  onPlayNow: () => void;
  onHowToPlay: () => void;
  onChooseGame: () => void;
  onSelectMode: (mode: GameMode) => void;
  onCreateRoom?: (displayName: string, gameMode: GameMode) => void;
  onJoinRoom?: (roomCode: string, displayName: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onPlayNow,
  onHowToPlay,
  onChooseGame,
  onSelectMode,
  onCreateRoom,
  onJoinRoom,
}) => {
  // Quick play form state right on the hero
  const [quickTab, setQuickTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('match-and-collect');
  const [formError, setFormError] = useState('');

  // Interactive Live Card Simulator State
  const [simulatedCards, setSimulatedCards] = useState([
    { id: 'sim-1', name: 'Laptop', emoji: '💻', count: 3 },
    { id: 'sim-2', name: 'Coffee', emoji: '☕', count: 1 },
  ]);
  const [isSimulatedMatch, setIsSimulatedMatch] = useState(false);
  const [passSimulationCount, setPassSimulationCount] = useState(0);

  // Office Collectibles Filter
  const [activeCollectibleCategory, setActiveCollectibleCategory] = useState<'all' | 'tech' | 'fuel' | 'workspace'>('all');

  // Real Persistent Match Records & Leaderboards
  const [recentWinners, setRecentWinners] = useState<MatchResultRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetch('/api/results')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.results)) {
          setRecentWinners(data.results.slice(0, 3));
        }
      })
      .catch(() => {});

    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  const handleSimulatePass = () => {
    sound.playCardPass();
    if (!isSimulatedMatch) {
      // Simulate receiving the 4th Laptop card!
      setSimulatedCards([
        { id: 'sim-1', name: 'Laptop', emoji: '💻', count: 4 },
        { id: 'sim-2', name: 'Coffee', emoji: '☕', count: 0 },
      ]);
      setIsSimulatedMatch(true);
      setPassSimulationCount((prev) => prev + 1);
      setTimeout(() => {
        sound.playVictory();
      }, 300);
    } else {
      // Reset simulator
      setSimulatedCards([
        { id: 'sim-1', name: 'Laptop', emoji: '💻', count: 2 },
        { id: 'sim-2', name: 'Coffee', emoji: '☕', count: 2 },
      ]);
      setIsSimulatedMatch(false);
      setPassSimulationCount((prev) => prev + 1);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = playerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Please enter a display name (at least 2 letters)');
      return;
    }

    sound.playButtonClick();

    if (quickTab === 'create') {
      if (onCreateRoom) {
        onCreateRoom(trimmedName, selectedMode);
      } else {
        onPlayNow();
      }
    } else {
      let trimmedCode = roomCodeInput.trim().toUpperCase().replace(/\s+/g, '-');
      if (!trimmedCode.startsWith('MATCH-') && /^[A-Z0-9]{4,6}$/.test(trimmedCode)) {
        trimmedCode = `MATCH-${trimmedCode}`;
      }
      if (!trimmedCode || trimmedCode.length < 5) {
        setFormError('Please enter a valid room code (e.g. MATCH-XXXX)');
        return;
      }
      if (onJoinRoom) {
        onJoinRoom(trimmedCode, trimmedName);
      } else {
        onPlayNow();
      }
    }
  };

  const allCardsList = Object.values(OFFICE_CARDS);
  const filteredCollectibles = allCardsList.filter((c) => {
    if (activeCollectibleCategory === 'all') return true;
    if (activeCollectibleCategory === 'tech') {
      return ['laptop', 'monitor', 'keyboard', 'mouse', 'harddrive'].includes(c.type);
    }
    if (activeCollectibleCategory === 'fuel') {
      return ['coffee', 'cupsoda', 'cookie', 'lightbulb'].includes(c.type);
    }
    if (activeCollectibleCategory === 'workspace') {
      return ['plant', 'task', 'headphones', 'phone', 'folderkanban', 'briefcase'].includes(c.type);
    }
    return true;
  });

  return (
    <div className="relative overflow-hidden bg-[#070b14] text-slate-100 select-none">
      {/* Background Ambience with Generated Card Arena Image & Scrim */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src="/src/assets/images/hero_card_arena_1791309003140.jpg"
          alt="Card game arena"
          referrerPolicy="no-referrer"
          className="w-full h-[650px] object-cover opacity-20 filter blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/70 via-[#070b14]/90 to-[#070b14]" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-blue-500/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />
      </div>

      {/* =========================================================================
          HERO SECTION (2 Columns: Quick Play & Visual Interactive Card Table)
         ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 lg:pb-24">
        {/* Live Multiplayer Status Kicker */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/95 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide shadow-lg shadow-amber-500/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Real-Time Office Card Game · 4–30 Players</span>
          </div>
        </div>

        {/* Hero Headline & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white uppercase leading-[1.08] drop-shadow-xl">
            Work Smart.{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Play Together.
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-300 font-normal leading-relaxed text-balance">
            A fast multiplayer office card game. Pass one card, build your collection, and be the first to match 4!
          </p>

          {/* Quick HUD Metrics */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <Users className="w-4 h-4 text-blue-400" />
              <span>4–30 Players</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>Real-Time Multiplayer</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>4 Cards Per Hand</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <Trophy className="w-4 h-4 text-orange-400" />
              <span>One Winner</span>
            </div>
          </div>
        </div>

        {/* 2-Column Desktop Grid: Quick-Play Panel + Interactive Card Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          {/* Left Column: Quick Play / Instant Launch Box */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-b from-[#11192e] via-[#0b101c] to-[#070a13] border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setQuickTab('create');
                    setFormError('');
                    sound.playButtonClick();
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    quickTab === 'create'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Room</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickTab('join');
                    setFormError('');
                    sound.playButtonClick();
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    quickTab === 'join'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Join with Code</span>
                </button>
              </div>

              <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                Instant Lobby
              </span>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Cooper"
                  value={playerName}
                  maxLength={20}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-semibold focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                />
              </div>

              {quickTab === 'join' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MATCH-9421"
                    value={roomCodeInput}
                    maxLength={12}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white placeholder:text-slate-500 font-mono text-sm tracking-wider uppercase focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMode('match-and-collect');
                        sound.playCardSelect();
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedMode === 'match-and-collect'
                          ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-amber-300">
                        <span>🎴</span> Match &amp; Collect
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        Pass 1, collect 4 identical cards
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMode('chor-chitthi');
                        sound.playCardSelect();
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedMode === 'chor-chitthi'
                          ? 'border-cyan-400 bg-cyan-500/15 text-white ring-1 ring-cyan-400/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-cyan-300">
                        <span>🕵️</span> Chor-Chitthi
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        Hidden role deduction (Raja/Chor)
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(251,191,36,0.3)] hover:scale-[1.01] active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer ring-2 ring-amber-400/40"
              >
                <span>{quickTab === 'create' ? 'CREATE ROOM & PLAY' : 'JOIN ROOM'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={onHowToPlay}
                className="hover:text-amber-400 transition flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to Play</span>
              </button>
              <button
                type="button"
                onClick={onChooseGame}
                className="hover:text-cyan-400 transition flex items-center gap-1"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>All Modes</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Interactive Game Arena Card */}
          <div className="lg:col-span-6 rounded-3xl bg-gradient-to-b from-[#11192e] via-[#090e1c] to-[#070a13] border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Live Gameplay Preview</span>
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                Goal: 4 of a Kind
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">
              The 4-Card Passing Cycle
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Every round, each player passes 1 card and receives 1 card. Hands stay at exactly 4 cards. The moment you hold 4 identical cards, you win!
            </p>

            {/* Simulated Hand on the Table */}
            <div className="my-6 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 text-center relative">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
                <span>Your 4-Card Hand:</span>
                {isSimulatedMatch ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 4 IDENTICAL CARDS MATCHED!
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono">3 / 4 Match Progress</span>
                )}
              </div>

              {/* 4 Cards visual in row */}
              <div className="grid grid-cols-4 gap-2.5 max-w-sm mx-auto">
                {/* 3 Laptops */}
                {[0, 1, 2].map((idx) => (
                  <div
                    key={`lap-${idx}`}
                    className="p-3 rounded-2xl border border-amber-400/80 bg-gradient-to-b from-amber-500/20 to-slate-900 text-center shadow-lg transform hover:-translate-y-1 transition duration-200"
                  >
                    <div className="text-2xl mb-1">💻</div>
                    <div className="text-[10px] font-black text-amber-300 uppercase truncate">
                      Laptop
                    </div>
                  </div>
                ))}

                {/* 4th Card (Coffee or 4th Laptop) */}
                <div
                  className={`p-3 rounded-2xl border text-center shadow-lg transition duration-300 ${
                    isSimulatedMatch
                      ? 'border-emerald-400 bg-gradient-to-b from-emerald-500/30 to-slate-900 scale-105 shadow-[0_0_20px_rgba(52,211,153,0.4)] ring-2 ring-emerald-400'
                      : 'border-orange-500/60 bg-gradient-to-b from-orange-500/20 to-slate-900'
                  }`}
                >
                  <div className="text-2xl mb-1">{isSimulatedMatch ? '💻' : '☕'}</div>
                  <div
                    className={`text-[10px] font-black uppercase truncate ${
                      isSimulatedMatch ? 'text-emerald-300' : 'text-orange-300'
                    }`}
                  >
                    {isSimulatedMatch ? 'Laptop' : 'Coffee'}
                  </div>
                </div>
              </div>

              {/* Interactive Pass trigger button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleSimulatePass}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <RotateCw className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span>
                    {isSimulatedMatch
                      ? 'Reset Preview'
                      : 'Simulate Receiving Next Pass (Complete 4-Set)'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Simulation Steps Run: {passSimulationCount}</span>
              <span className="text-emerald-400 font-semibold">100% Real Multiplayer Logic</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: HOW IT WORKS IN 4 SIMPLE STEPS
         ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
            <Zap className="w-4 h-4" />
            <span>HOW IT PLAYS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Four Steps to Breakroom Glory
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            No long rulebooks or turn delays. Fast-paced, intuitive office card passing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#11192e] to-[#070b14] border border-slate-800 relative group hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-black text-lg mb-4 border border-amber-500/30">
              01
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Deal 4 Cards</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every player is automatically dealt exactly 4 illustrated office cards from the synchronized deck.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#11192e] to-[#070b14] border border-slate-800 relative group hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-black text-lg mb-4 border border-blue-500/30">
              02
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Pick 1 Card</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose the card you don't need to pass along. Lock in your choice before the round timer ticks down.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#11192e] to-[#070b14] border border-slate-800 relative group hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-mono font-black text-lg mb-4 border border-teal-500/30">
              03
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Synchronized Pass</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All players pass 1 card and receive 1 card simultaneously in clockwise rotation around the table.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#11192e] to-[#070b14] border border-slate-800 relative group hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono font-black text-lg mb-4 border border-orange-500/30">
              04
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Match 4 &amp; Win</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The first colleague to assemble 4 identical cards triggers the round victory buzzer and claims the title!
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TWO GAME MODES (MATCH & COLLECT & CHOR-CHITTHI)
         ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400 mb-1">
              GAMEPLAY VARIETIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Two Office Classics
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-md">
            Seamlessly switch modes in the lobby. Both support 4 to 30 connected players.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mode 1: Match & Collect */}
          <div className="rounded-3xl bg-gradient-to-b from-[#10172b] to-[#070b14] border border-amber-500/30 p-7 sm:p-9 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-amber-400 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  FLAGSHIP MODE
                </span>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  4–30 PLAYERS
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                Match &amp; Collect
              </h3>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Pass 1 card, receive 1 card in a rapid synchronized circle. Collect 4 matching cards before any other player to claim instant victory.
              </p>

              <div className="my-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Clockwise, counter-clockwise, or randomized passing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Strict 4-card hand equilibrium enforced by server</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>35+ unique office suits to collect</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onSelectMode('match-and-collect');
              }}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <span>PLAY MATCH &amp; COLLECT</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Mode 2: Chor-Chitthi */}
          <div className="rounded-3xl bg-gradient-to-b from-[#10172b] to-[#070b14] border border-cyan-500/30 p-7 sm:p-9 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-cyan-400 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-400 text-slate-950">
                  PARTY DEDUCTION
                </span>
                <span className="font-mono text-xs text-cyan-400 font-bold">
                  4–30 PLAYERS
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                Chor-Chitthi
              </h3>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                The beloved Indian party game adapted for modern browser multiplayer. Secret roles (Raja, Mantri, Sipahi, Chor) are dealt in digital chits!
              </p>

              <div className="my-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Secret digital role unfold while keeping a poker face</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Police player interrogates the table to catch the Chor</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Rounds points scoring (Raja 1000, Mantri 800, Sipahi 500, Chor 0)</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playButtonClick();
                onSelectMode('chor-chitthi');
              }}
              className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <span>PLAY CHOR-CHITTHI</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: OFFICE COLLECTIBLES SHOWCASE
         ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400 mb-1">
              THE OFFICE SUITS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Collectibles Archive
            </h2>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All Items' },
                { id: 'tech', label: 'Tech' },
                { id: 'fuel', label: 'Fuel' },
                { id: 'workspace', label: 'Workspace' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCollectibleCategory(cat.id);
                  sound.playButtonClick();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeCollectibleCategory === cat.id
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collectibles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredCollectibles.slice(0, 12).map((c) => (
            <div
              key={c.type}
              onClick={() => sound.playCardSelect()}
              className="p-4 rounded-2xl bg-gradient-to-b from-[#11192e] to-[#070b14] border border-slate-800/80 hover:border-amber-400/60 transition transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between shadow-lg"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>#4SET</span>
                <span className="font-mono text-[10px] text-amber-400/80">SUIT</span>
              </div>
              <div className="text-3xl my-2 text-center">{c.emoji}</div>
              <div className="text-center">
                <div className="font-bold text-xs text-white truncate">{c.name}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: REAL PERSISTENT HALL OF CHAMPIONS
         ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400 mb-1">
              OFFICE LEADERBOARD
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hall of Champions
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Directly from database records · Zero fake statistics
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Matches */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900/70 border border-slate-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Recent Completed Matches</span>
            </h3>

            {recentWinners.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No recent matches completed yet. Host a game with colleagues to record the first win!
              </div>
            ) : (
              <div className="space-y-3">
                {recentWinners.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{m.winnerName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {m.gameMode === 'match-and-collect' ? 'Match & Collect' : 'Chor-Chitthi'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Matched {m.winningCardName} cards in {m.totalRounds} rounds ({Math.round(m.durationMs / 1000)}s)
                      </div>
                    </div>
                    <div className="text-right text-xs font-mono text-slate-400 shrink-0">
                      {m.playerCount} Players
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Leaderboard */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/70 border border-slate-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Top Office Champions</span>
            </h3>

            {leaderboard.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                Play games to populate the global leaderboard.
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={entry.displayName}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 font-mono font-bold text-slate-300 flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white">{entry.displayName}</span>
                    </div>
                    <div className="font-mono text-amber-400 font-bold">
                      {entry.wins} Wins ({entry.winRate}%)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
         ========================================================================= */}
      <footer className="mt-16 border-t border-slate-800/80 pt-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white">MATCH &amp; COLLECT</span>
          <span>· Real-time office multiplayer game</span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={onHowToPlay} className="hover:text-slate-200 transition">
            How to Play
          </button>
          <span>·</span>
          <button type="button" onClick={onChooseGame} className="hover:text-slate-200 transition">
            Game Modes
          </button>
          <span>·</span>
          <button type="button" onClick={onPlayNow} className="hover:text-amber-400 font-bold transition">
            Play Now
          </button>
        </div>
      </footer>
    </div>
  );
};
