/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Crown,
  Eye,
  EyeOff,
  UserCheck,
  AlertTriangle,
  Award,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { RoomPublicState, PrivatePlayerState } from '../types/game';

interface ChorChitthiBoardProps {
  room: RoomPublicState;
  privatePlayer: PrivatePlayerState | null;
  onAccuse: (suspectId: string) => void;
  onNextRound?: () => void;
  isHost?: boolean;
}

export const ChorChitthiBoard: React.FC<ChorChitthiBoardProps> = ({
  room,
  privatePlayer,
  onAccuse,
  onNextRound,
  isHost,
}) => {
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);

  const myRole = privatePlayer?.chorChitthiRole;
  const isPolice = myRole === 'police';
  const state = room.chorChitthiState;
  const isPolicePhase = state?.phase === 'police-turn';
  const isResultsPhase = state?.phase === 'results';

  // Role visual dictionary
  const roleMeta: Record<
    string,
    { title: string; points: string; color: string; desc: string; emoji: string }
  > = {
    raja: {
      title: 'Raja (King)',
      points: '1,000 Points',
      color: 'from-amber-500/20 to-yellow-600/20 border-amber-500/50 text-amber-400',
      desc: 'The supreme ruler. Guaranteed victory points unless dethroned.',
      emoji: '👑',
    },
    rani: {
      title: 'Rani (Queen)',
      points: '800 Points',
      color: 'from-rose-500/20 to-pink-600/20 border-rose-500/50 text-rose-400',
      desc: 'The royal queen with prestigious 800-point status.',
      emoji: '👸',
    },
    police: {
      title: 'Police (Sipahi)',
      points: '500 Points (if guess is correct)',
      color: 'from-blue-500/20 to-indigo-600/20 border-blue-500/50 text-blue-400',
      desc: 'Identify the Chor! If correct, you keep 500 points. If wrong, Chor steals them!',
      emoji: '👮‍♂️',
    },
    chor: {
      title: 'Chor (Thief)',
      points: '0 Points (or 500 if Police fails)',
      color: 'from-purple-500/20 to-slate-900 border-purple-500/50 text-purple-400',
      desc: 'Keep a poker face! If the Police fails to accuse you, you take all 500 points.',
      emoji: '🥷',
    },
    praja: {
      title: 'Praja (Citizen)',
      points: '100 Points',
      color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/50 text-emerald-400',
      desc: 'Faithful citizen supporting the royal court.',
      emoji: '🧑‍💼',
    },
  };

  const meta = roleMeta[myRole || 'praja'] || roleMeta.praja;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-400 font-extrabold text-xs uppercase tracking-wider border border-cyan-500/30 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Chor-Chitthi Mode</span>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Room: <strong className="text-white">{room.roomCode}</strong>
          </span>
        </div>

        <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <span>Active Phase:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 uppercase font-mono font-bold">
            {state?.phase || 'Setup'}
          </span>
        </div>
      </div>

      {/* Secret Chit Role Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
        <div className="max-w-md mx-auto">
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
            Your Secret Role Chit
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            Tap to {roleRevealed ? 'Hide' : 'Reveal'} Your Role
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Do not let adjacent coworkers see your screen!
          </p>

          <div className="mt-6">
            <button
              onClick={() => setRoleRevealed(!roleRevealed)}
              className={`w-full p-8 rounded-3xl border-2 transition-all transform duration-300 relative group cursor-pointer ${
                roleRevealed
                  ? `bg-gradient-to-b ${meta.color} shadow-2xl`
                  : 'bg-slate-950 border-slate-700 hover:border-slate-500'
              }`}
            >
              {roleRevealed ? (
                <div className="flex flex-col items-center">
                  <span className="text-5xl sm:text-6xl mb-3">{meta.emoji}</span>
                  <h3 className="text-2xl font-black text-white">{meta.title}</h3>
                  <span className="mt-1 px-3 py-1 rounded-full bg-slate-950/80 text-xs font-mono font-bold text-amber-400 border border-slate-800">
                    {meta.points}
                  </span>
                  <p className="mt-3 text-xs text-slate-300 max-w-xs">{meta.desc}</p>

                  <div className="mt-5 flex items-center gap-1.5 text-xs text-slate-400">
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Tap again to conceal</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3 group-hover:scale-110 transition">
                    <Eye className="w-6 h-6 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-base text-slate-200">
                    Chit Sealed 📜
                  </h4>
                  <span className="text-xs text-slate-400 mt-1">
                    Click to unfold your assignment
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Police Identification / Accusation Phase */}
      {isPolicePhase && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase mb-2 border border-blue-500/30">
              <ShieldAlert className="w-4 h-4" /> Police Announced
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {state.policePlayerName} is the Police!
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              {isPolice
                ? 'You are the Police! Pick who you suspect is the Chor from the suspect list below:'
                : `Waiting for Police (${state.policePlayerName}) to identify the Chor...`}
            </p>
          </div>

          {/* Suspects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {state.suspects?.map((suspect) => {
              const isSelected = selectedSuspectId === suspect.id;
              return (
                <button
                  key={suspect.id}
                  disabled={!isPolice}
                  onClick={() => setSelectedSuspectId(suspect.id)}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500/15 ring-2 ring-rose-400/30'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  } ${!isPolice ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center justify-center">
                      {suspect.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100">{suspect.displayName}</div>
                      <div className="text-[11px] text-slate-400">Suspect</div>
                    </div>
                  </div>

                  {isPolice && isSelected && (
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Accuse
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isPolice && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => selectedSuspectId && onAccuse(selectedSuspectId)}
                disabled={!selectedSuspectId}
                className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Confirm Accusation</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Phase */}
      {isResultsPhase && state.roundResult && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-center">
          <div className="max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white">
              {state.roundResult.policeWon ? 'Police Caught The Chor!' : 'The Chor Escaped!'}
            </h3>

            <p className="text-sm text-slate-300 mt-2">
              Chor was <strong className="text-purple-400">{state.roundResult.chorPlayerName}</strong>.
              {state.roundResult.policeWon
                ? ` Police ${state.roundResult.policePlayerName} receives 500 points!`
                : ` Chor ${state.roundResult.chorPlayerName} fooled Police ${state.roundResult.policePlayerName} and took 500 points!`}
            </p>

            {/* Score Summary */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">
                Round Points Tally
              </h4>
              <div className="space-y-2">
                {room.players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                    <span className="font-semibold text-slate-200">
                      {p.displayName} {p.publicRole && `(${p.publicRole})`}
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      +{state.roundResult?.scores[p.id] ?? 0} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {isHost && onNextRound && (
              <button
                onClick={onNextRound}
                className="mt-6 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition cursor-pointer"
              >
                Start Next Round
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
