import React, { useState, useEffect } from 'react';
import {
  Users, Radio, Layers, Trophy, ArrowRight, HelpCircle, Gamepad2, Sparkles,
  RotateCw, Zap, CheckCircle2, Flame, UserPlus, KeyRound
} from 'lucide-react';
import { GameMode, MatchResultRecord, LeaderboardEntry, GlobalPlayerInfo } from '../types/game';
import { sound } from '../services/sound';
import { OFFICE_CARDS } from '../utils/cards';

interface LandingHeroProps {
  onPlayNow: () => void;
  onHowToPlay: () => void;
  onChooseGame: () => void;
  onSelectMode: (mode: GameMode) => void;
  onCreateRoom?: (displayName: string, gameMode: GameMode) => void;
  onJoinRoom?: (roomCode: string, displayName: string) => void;
  joinError?: string | null;
  globalPlayers?: GlobalPlayerInfo[];
  onRegisterGlobal?: (displayName: string) => void;
  onSendInvite?: (targetPlayerId: string) => void;
  onFindMatch?: (displayName: string, mode: GameMode) => void;
  defaultPlayerName?: string;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onPlayNow,
  onHowToPlay,
  onChooseGame,
  onSelectMode,
  onCreateRoom,
  onJoinRoom,
  joinError,
  globalPlayers = [],
  onRegisterGlobal,
  onSendInvite,
  onFindMatch,
  defaultPlayerName = '',
}) => {
  const [quickTab, setQuickTab] = useState<'create' | 'join' | 'matchmake' | 'players'>('create');
  const [isRegistered, setIsRegistered] = useState(false);
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('match-and-collect');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (defaultPlayerName && !playerName) {
      setPlayerName(defaultPlayerName);
    }
  }, [defaultPlayerName]);

  const [simulatedCards, setSimulatedCards] = useState([
    { id: 'sim-1', name: 'Laptop', emoji: '💻', count: 3 },
    { id: 'sim-2', name: 'Coffee', emoji: '☕', count: 1 },
  ]);
  const [isSimulatedMatch, setIsSimulatedMatch] = useState(false);
  const [passSimulationCount, setPassSimulationCount] = useState(0);

  const [activeCollectibleCategory, setActiveCollectibleCategory] = useState<'all' | 'tech' | 'fuel' | 'workspace'>('all');

  const [recentWinners, setRecentWinners] = useState<MatchResultRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetch('/api/results').then((res) => res.json()).then((data) => {
      if (Array.isArray(data.results)) setRecentWinners(data.results.slice(0, 3));
    }).catch(() => {});
    fetch('/api/leaderboard').then((res) => res.json()).then((data) => {
      if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard.slice(0, 5));
    }).catch(() => {});
  }, []);

  const handleSimulatePass = () => {
    sound.playCardPass();
    if (!isSimulatedMatch) {
      setSimulatedCards([
        { id: 'sim-1', name: 'Laptop', emoji: '💻', count: 4 },
        { id: 'sim-2', name: 'Coffee', emoji: '☕', count: 0 },
      ]);
      setIsSimulatedMatch(true);
      setPassSimulationCount((prev) => prev + 1);
      setTimeout(() => sound.playVictory(), 300);
    } else {
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

    if (quickTab === 'matchmake') {
      if (onFindMatch) onFindMatch(trimmedName, selectedMode);
      else onPlayNow();
    } else if (quickTab === 'create') {
      if (onCreateRoom) onCreateRoom(trimmedName, selectedMode);
      else onPlayNow();
    } else if (quickTab === 'join') {
      let raw = roomCodeInput.trim();
      const paramMatch = raw.match(/[?&]room=([^&\s]+)/i);
      if (paramMatch) raw = paramMatch[1];
      const stripped = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      let cleanRoomCode = '';
      const fullMatch = stripped.match(/MATCH-([A-Z0-9]{4,6})/);
      if (fullMatch) cleanRoomCode = `MATCH-${fullMatch[1]}`;
      else {
        const suffix = stripped.replace(/-/g, '');
        if (/^[A-Z0-9]{4,6}$/.test(suffix)) cleanRoomCode = `MATCH-${suffix}`;
      }
      if (!cleanRoomCode) {
        setFormError('Please enter a valid room code');
        return;
      }
      if (onJoinRoom) onJoinRoom(cleanRoomCode, trimmedName);
      else onPlayNow();
    } else if (quickTab === 'players') {
      if (onRegisterGlobal) {
        onRegisterGlobal(trimmedName);
        setIsRegistered(true);
      }
    }
  };

  const allCardsList = Object.values(OFFICE_CARDS);
  const filteredCollectibles = allCardsList.filter((c) => {
    if (activeCollectibleCategory === 'all') return true;
    if (activeCollectibleCategory === 'tech') return ['laptop', 'monitor', 'keyboard', 'mouse', 'harddrive'].includes(c.type);
    if (activeCollectibleCategory === 'fuel') return ['coffee', 'cupsoda', 'cookie', 'lightbulb'].includes(c.type);
    if (activeCollectibleCategory === 'workspace') return ['plant', 'task', 'headphones', 'phone', 'folderkanban', 'briefcase'].includes(c.type);
    return true;
  });

  const bentoBoxClass = "rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden transition-all duration-500 hover:bg-white/[0.04]";

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 select-none font-sans overflow-hidden">
      {/* Premium Dark Glass Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* MASSIVE BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 auto-rows-min gap-4 sm:gap-5">
          
          {/* 1. HERO HEADLINE (Bento: 12 Cols) */}
          <div className={`md:col-span-12 p-10 sm:p-20 items-center justify-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 ${bentoBoxClass}`}>
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.05] border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide shadow-lg mb-8 hover:scale-105 transition-transform cursor-default">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Real-Time Office Card Game · 4–30 Players</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-[6rem] font-black tracking-tighter text-white uppercase leading-[0.9] drop-shadow-2xl">
              Work Smart.<br />
              <span className="bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 bg-clip-text text-transparent filter drop-shadow-[0_0_25px_rgba(251,191,36,0.2)]">
                Play Together.
              </span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-slate-400 font-medium max-w-2xl text-balance mx-auto">
              A fast multiplayer office card game. Pass one card, build your collection, and be the first to match 4!
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm font-bold">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/10 transition">
                <Users className="w-4 h-4 text-blue-400" /> 4–30 Players
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/10 transition">
                <Radio className="w-4 h-4 text-teal-400 animate-pulse" /> Live Real-Time
              </div>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/10 transition">
                <Layers className="w-4 h-4 text-amber-400" /> 4 Cards Per Hand
              </div>
            </div>
          </div>

          {/* 2. QUICK PLAY (Bento: 5 Cols) */}
          <div className={`md:col-span-5 p-8 sm:p-10 animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both ${bentoBoxClass}`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10">
                <button type="button" onClick={() => { setQuickTab('matchmake'); setFormError(''); sound.playButtonClick(); }} className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${quickTab === 'matchmake' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <Zap className="w-3.5 h-3.5" /> <span>Find Match</span>
                </button>
                <button type="button" onClick={() => { setQuickTab('create'); setFormError(''); sound.playButtonClick(); }} className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${quickTab === 'create' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <UserPlus className="w-3.5 h-3.5" /> <span>Create</span>
                </button>
                <button type="button" onClick={() => { setQuickTab('join'); setFormError(''); sound.playButtonClick(); }} className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${quickTab === 'join' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <KeyRound className="w-3.5 h-3.5" /> <span>Join</span>
                </button>
                <button type="button" onClick={() => { setQuickTab('players'); setFormError(''); sound.playButtonClick(); }} className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${quickTab === 'players' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  <Users className="w-3.5 h-3.5" /> <span>Online</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-5 flex-1 flex flex-col justify-center">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                <input type="text" placeholder="e.g. Alex Cooper" value={playerName} maxLength={20} onChange={(e) => setPlayerName(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 text-sm font-semibold focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition" />
              </div>

              {quickTab === 'join' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Room Code</label>
                  <input type="text" placeholder="e.g. MATCH-9421" value={roomCodeInput} maxLength={12} onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())} className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 font-mono text-sm tracking-wider uppercase focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition" />
                </div>
              ) : quickTab === 'players' ? (
                <div className="space-y-4">
                  {!isRegistered ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-slate-400">
                      Enter your name and click "Go Online" to invite players.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {globalPlayers.length <= 1 ? (
                        <p className="text-sm text-slate-500 text-center py-4">Waiting for players...</p>
                      ) : (
                        globalPlayers.filter(p => p.displayName !== playerName.trim()).map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${p.status === 'idle' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <span className="text-sm font-bold text-slate-200">{p.displayName}</span>
                            </div>
                            <button type="button" onClick={() => { if (onSendInvite) onSendInvite(p.id); sound.playButtonClick(); }} disabled={p.status !== 'idle'} className="px-3 py-1 rounded border border-amber-500/50 text-amber-400 text-xs font-bold hover:bg-amber-500/10 disabled:opacity-50 transition">
                              {p.status === 'idle' ? 'Invite' : 'In Game'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Game Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => { setSelectedMode('match-and-collect'); sound.playCardSelect(); }} className={`p-4 rounded-xl border text-left transition ${selectedMode === 'match-and-collect' ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400/40' : 'border-white/10 bg-black/40 text-slate-500 hover:text-slate-300'}`}>
                      <div className="flex items-center gap-2 mb-1 text-xs font-bold text-amber-400"><span>🎴</span> Match & Collect</div>
                    </button>
                    <button type="button" onClick={() => { setSelectedMode('chor-chitthi'); sound.playCardSelect(); }} className={`p-4 rounded-xl border text-left transition ${selectedMode === 'chor-chitthi' ? 'border-cyan-400 bg-cyan-500/15 text-white ring-1 ring-cyan-400/40' : 'border-white/10 bg-black/40 text-slate-500 hover:text-slate-300'}`}>
                      <div className="flex items-center gap-2 mb-1 text-xs font-bold text-cyan-400"><span>🕵️</span> Chor-Chitthi</div>
                    </button>
                  </div>
                </div>
              )}

              {(formError || (quickTab === 'join' && joinError)) && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                  {formError || joinError}
                </div>
              )}

              <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(251,191,36,0.3)] hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">
                <span>{quickTab === 'matchmake' ? 'FIND MATCH NOW' : quickTab === 'create' ? 'CREATE ROOM' : quickTab === 'join' ? 'JOIN ROOM' : isRegistered ? 'UPDATE NAME' : 'GO ONLINE'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          </div>

          {/* 3. SIMULATOR (Bento: 7 Cols) */}
          <div className={`md:col-span-7 p-8 sm:p-10 flex flex-col justify-between animate-in fade-in slide-in-from-right-8 duration-700 delay-150 fill-mode-both ${bentoBoxClass}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Live Preview</span>
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">Goal: 4 of a Kind</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black text-white">The 4-Card Passing Cycle</h3>
            <p className="text-sm text-slate-400 mt-2">Pass one card, receive one card simultaneously. The first to hold 4 identical cards triggers the win!</p>

            <div className="my-8 p-6 rounded-2xl bg-black/40 border border-white/5 text-center relative flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-6">
                <span>Your Hand:</span>
                {isSimulatedMatch ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> MATCHED!</span>
                ) : (
                  <span className="text-amber-400 font-mono">3 / 4 Match Progress</span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto w-full">
                {[0, 1, 2].map((idx) => (
                  <div key={`lap-${idx}`} className="p-4 rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent text-center shadow-lg transform hover:-translate-y-2 hover:scale-110 hover:-rotate-3 hover:border-amber-400/50 transition-all duration-300 cursor-pointer">
                    <div className="text-3xl sm:text-4xl mb-2">💻</div>
                    <div className="text-[10px] font-black text-amber-300 uppercase truncate">Laptop</div>
                  </div>
                ))}
                <div className={`p-4 rounded-xl border text-center transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-110 hover:rotate-3 ${isSimulatedMatch ? 'border-emerald-400 bg-emerald-500/20 scale-105 shadow-[0_0_40px_rgba(52,211,153,0.5)] ring-2 ring-emerald-400 animate-pulse' : 'border-white/10 bg-gradient-to-b from-white/10 to-transparent'}`}>
                  <div className="text-3xl sm:text-4xl mb-2">{isSimulatedMatch ? '💻' : '☕'}</div>
                  <div className={`text-[10px] font-black uppercase truncate ${isSimulatedMatch ? 'text-emerald-300' : 'text-orange-300'}`}>{isSimulatedMatch ? 'Laptop' : 'Coffee'}</div>
                </div>
              </div>

              <div className="mt-8">
                <button type="button" onClick={handleSimulatePass} className="w-full max-w-sm mx-auto py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer">
                  <RotateCw className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span>{isSimulatedMatch ? 'Reset Preview' : 'Simulate Receive Card'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. FOUR STEPS (Bento: 4x 3 Cols = 12) */}
          {[
            { step: '01', title: 'Deal 4 Cards', desc: 'Everyone gets 4 random cards.' },
            { step: '02', title: 'Pick 1 Card', desc: 'Select the card you do not need.' },
            { step: '03', title: 'Sync Pass', desc: 'Pass 1 card, receive 1 card.' },
            { step: '04', title: 'Match 4', desc: 'First to 4 identical cards wins!' }
          ].map((s, i) => (
            <div key={s.step} className={`md:col-span-3 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both ${bentoBoxClass}`} style={{animationDelay: `${300 + (i * 100)}ms`}}>
              <div className="w-12 h-12 rounded-xl bg-white/5 text-amber-400 flex items-center justify-center font-mono font-black text-xl mb-4 border border-white/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                {s.step}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}

          {/* 5. COLLECTIBLES & LEADERBOARD (Bento Row) */}
          <div className={`md:col-span-7 p-8 sm:p-10 ${bentoBoxClass}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Recent Champions</h3>
            <div className="space-y-3">
              {recentWinners.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">No matches yet. Host the first one!</div>
              ) : (
                recentWinners.map(m => (
                  <div key={m.id} className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{m.winnerName}</div>
                      <div className="text-xs text-slate-500 mt-1">Matched {m.winningCardName} in {m.totalRounds} rounds</div>
                    </div>
                    <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-xs font-mono text-amber-400">{m.playerCount} Players</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`md:col-span-5 p-8 sm:p-10 ${bentoBoxClass}`}>
             <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /> Global Leaderboard</h3>
             <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">No data yet.</div>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={entry.displayName} className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-white/10 font-mono font-bold text-slate-300 flex items-center justify-center text-xs">#{idx + 1}</span>
                      <span className="font-bold text-sm text-white">{entry.displayName}</span>
                    </div>
                    <div className="font-mono text-amber-400 font-bold text-xs">{entry.wins} Wins</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Quick Footer Links */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pb-12 pt-4 flex flex-wrap gap-6 items-center justify-center text-xs font-bold text-slate-500">
        <button onClick={onHowToPlay} className="hover:text-white transition">How to Play</button>
        <button onClick={onChooseGame} className="hover:text-white transition">Game Modes</button>
      </div>
    </div>
  );
};
