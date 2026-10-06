/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  History,
  Clock,
  Users,
  Award,
  RefreshCw,
  Flame,
  Zap,
  Medal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MatchResultRecord, LeaderboardEntry } from '../types/game';

interface ResultsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'leaderboard' | 'history'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<MatchResultRecord[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resL, resH] = await Promise.all([
        fetch('/api/leaderboard'),
        fetch('/api/results'),
      ]);
      const dataL = await resL.json();
      const dataH = await resH.json();
      setLeaderboard(Array.isArray(dataL.leaderboard) ? dataL.leaderboard : []);
      setHistory(Array.isArray(dataH.results) ? dataH.results : []);
    } catch (e) {
      console.error('Failed to load official match records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatMs = (ms?: number) => {
    if (!ms || ms <= 0) return '-';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${min > 0 ? `${min}m ` : ''}${rem < 10 ? `0${rem}` : rem}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl">
      <div className="relative w-full max-w-4xl rounded-3xl bg-gradient-to-b from-[#11182c] via-[#0b101c] to-[#070912] border border-slate-700/80 p-4 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase">
                Competitive Standings
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                Verified records from completed multiplayer office matches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={fetchData}
              title="Refresh Records"
              className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex gap-2 my-5">
          <button
            onClick={() => setTab('leaderboard')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              tab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setTab('history')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              tab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Match Log</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {tab === 'leaderboard' ? (
            leaderboard.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Trophy className="w-14 h-14 text-slate-700 mx-auto mb-3" />
                <h4 className="text-lg font-black text-slate-300">No matches played yet.</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Start a match with 4 or more colleagues to record official stats and claim the podium!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Top 3 Podium Cards if at least 1 player has wins */}
                {leaderboard.length >= 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {leaderboard.slice(0, 3).map((p, idx) => {
                      const colors = [
                        'from-amber-400/20 border-amber-400/50 text-amber-300',
                        'from-slate-300/20 border-slate-300/50 text-slate-200',
                        'from-amber-700/20 border-amber-700/50 text-amber-500',
                      ];
                      const titles = ['1st Place', '2nd Place', '3rd Place'];

                      return (
                        <div
                          key={p.displayName}
                          className={`p-4 rounded-2xl border bg-gradient-to-b ${colors[idx]} bg-slate-950/80 flex flex-col justify-between`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                              {titles[idx]}
                            </span>
                            <Medal className="w-5 h-5" />
                          </div>
                          <div className="text-lg font-black text-white truncate">
                            {p.displayName}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                            <span>{p.wins} Wins ({p.winRate}%)</span>
                            <span>{p.gamesPlayed} Matches</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Deterministic Rankings Table */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Player</th>
                        <th className="p-3 text-center">Wins / Games</th>
                        <th className="p-3 text-center">Win Rate</th>
                        <th className="p-3 text-center">Best Streak</th>
                        <th className="p-3 text-center">Avg Duration</th>
                        <th className="p-3 text-right">Cards Passed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 font-medium">
                      {leaderboard.map((player, idx) => (
                        <tr key={player.displayName} className="hover:bg-slate-900/40 transition">
                          <td className="p-3 font-mono font-black text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="p-3 font-bold text-white">
                            {player.displayName}
                          </td>
                          <td className="p-3 text-center font-mono">
                            <span className="text-amber-400 font-bold">{player.wins}</span> / {player.gamesPlayed}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-400">
                            {player.winRate}%
                          </td>
                          <td className="p-3 text-center font-mono text-slate-300">
                            <span className="inline-flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-orange-400" />
                              {player.bestStreak}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-400">
                            {formatMs(player.avgDurationMs)}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-400">
                            {player.totalCardsPassed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <History className="w-14 h-14 text-slate-700 mx-auto mb-3" />
              <h4 className="text-lg font-black text-slate-300">No match records yet.</h4>
              <p className="text-xs text-slate-500 mt-1">
                Completed game rounds will be permanently cataloged here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => {
                const isExpanded = expandedMatchId === record.id;
                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-400 border border-slate-800">
                          {record.gameMode === 'match-and-collect' ? 'Match & Collect' : 'Chor-Chitthi'}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          Room: <strong className="text-white">{record.roomCode}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(record.completedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                      <span>{record.detail}</span>
                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : record.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
                      >
                        <span>{isExpanded ? 'Hide Standings' : 'View Standings'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-2 font-mono">
                      <span>{record.playerCount} Players</span>
                      <span>Rounds: {record.totalRounds || 1}</span>
                      <span>Time: {formatMs(record.durationMs)}</span>
                    </div>

                    {/* Expandable Standings Roster */}
                    {isExpanded && record.participants && (
                      <div className="mt-3 pt-3 border-t border-slate-900 space-y-1.5 animate-fadeIn">
                        {record.participants.map((p) => (
                          <div
                            key={p.playerId}
                            className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                              p.status === 'winner'
                                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                                : 'bg-slate-900/60 text-slate-400'
                            }`}
                          >
                            <span className="font-mono font-bold">
                              #{p.rank} {p.displayName}
                            </span>
                            <span className="font-mono text-[11px]">
                              {p.matchProgress}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
