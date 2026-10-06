/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  RotateCw,
  ShieldAlert,
  Plus,
  Trash2,
  Check,
  Users,
  Volume2,
  VolumeX,
  Music,
  Lock,
  Unlock,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { RoomPublicState, RoomSettings, PassDirection } from '../types/game';
import { useAudioManager } from '../hooks/useAudioManager';
import { sound } from '../services/sound';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomPublicState;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onLockRoom?: (locked: boolean) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  room,
  onUpdateSettings,
  onLockRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'audio' | 'safety'>('rules');

  // Gameplay Settings state
  const [minPlayers, setMinPlayers] = useState(room.settings.minPlayers || 4);
  const [maxPlayers, setMaxPlayers] = useState(room.settings.maxPlayers || 30);
  const [passTimer, setPassTimer] = useState(room.settings.passTimerSeconds || 15);
  const [direction, setDirection] = useState<PassDirection>(room.direction || 'clockwise');
  const [isLocked, setIsLocked] = useState(room.isLocked || false);

  // Audio Manager integration
  const {
    sfxEnabled,
    musicEnabled,
    sfxVolume,
    toggleSfx,
    toggleMusic,
    setSfxVolume,
  } = useAudioManager();

  // Safety filter state
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [newBlockedWord, setNewBlockedWord] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMinPlayers(room.settings.minPlayers || 4);
      setMaxPlayers(room.settings.maxPlayers || 30);
      setPassTimer(room.settings.passTimerSeconds || 15);
      setDirection(room.direction || 'clockwise');
      setIsLocked(room.isLocked || false);

      fetch('/api/admin/blocked-words')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.blockedWords)) {
            setBlockedWords(data.blockedWords);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, room]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playButtonClick();

    onUpdateSettings({
      minPlayers: Math.max(4, Math.min(30, Number(minPlayers))),
      maxPlayers: Math.max(minPlayers, Math.min(30, Number(maxPlayers))),
      passTimerSeconds: Math.max(5, Math.min(60, Number(passTimer))),
      direction,
    });

    if (onLockRoom && isLocked !== room.isLocked) {
      onLockRoom(isLocked);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleAddBlockedWord = async () => {
    if (!newBlockedWord.trim()) return;
    try {
      const res = await fetch('/api/admin/blocked-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: newBlockedWord.trim() }),
      });
      const data = await res.json();
      if (Array.isArray(data.blockedWords)) {
        setBlockedWords(data.blockedWords);
        setNewBlockedWord('');
        sound.playButtonClick();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveBlockedWord = async (word: string) => {
    try {
      const res = await fetch('/api/admin/blocked-words', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();
      if (Array.isArray(data.blockedWords)) {
        setBlockedWords(data.blockedWords);
        sound.playButtonClick();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0e1628] border border-slate-700/80 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4 border-b border-slate-800 bg-[#0e1628] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Room Config &amp; Settings</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">Room: {room.roomCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Segmented Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('rules');
                sound.playButtonClick();
              }}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rules</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('audio');
                sound.playButtonClick();
              }}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'audio'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('safety');
                sound.playButtonClick();
              }}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'safety'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Safety</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: RULES & LIMITS */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {/* Min / Max Players */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <h4 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Player Capacity (4–30)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Minimum to Start ({minPlayers} players)
                    </label>
                    <input
                      type="range"
                      min={4}
                      max={maxPlayers}
                      value={minPlayers}
                      onChange={(e) => setMinPlayers(Number(e.target.value))}
                      className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Min 4 players recommended for fair rotation
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Maximum Capacity ({maxPlayers} players)
                    </label>
                    <input
                      type="range"
                      min={minPlayers}
                      max={30}
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Supports up to 30 colleagues simultaneously
                    </div>
                  </div>
                </div>
              </div>

              {/* Pass Timer & Direction */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <h4 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider mb-3 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5" /> Passing Cycle Mechanics
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pass Timer: <span className="font-mono text-amber-400 font-bold">{passTimer}s</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={45}
                      step={1}
                      value={passTimer}
                      onChange={(e) => setPassTimer(Number(e.target.value))}
                      className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Time allowed to pick 1 card each cycle
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Passing Direction
                    </label>
                    <select
                      value={direction}
                      onChange={(e) => setDirection(e.target.value as PassDirection)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white outline-none focus:border-amber-400"
                    >
                      <option value="clockwise">Clockwise (P1 → P2 → P3)</option>
                      <option value="counter-clockwise">Counter-Clockwise (P3 → P2 → P1)</option>
                      <option value="random">Randomize Every Round</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Room Access Locking */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>Lock Room Access</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isLocked ? 'New players cannot join this room' : 'Anyone with the room code can join'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocked(!isLocked)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isLocked
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isLocked ? 'LOCKED' : 'UNLOCKED'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO & SOUND */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> In-Game Audio Mixer
                </h4>

                {/* SFX Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Sound Effects (SFX)</div>
                      <div className="text-[11px] text-slate-400">Card clicks, passes, buzzer, fanfare</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSfx}
                    className={`min-h-[40px] px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                      sfxEnabled ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sfxEnabled ? 'ENABLED' : 'MUTED'}
                  </button>
                </div>

                {/* Ambient Music Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Ambient BGM</div>
                      <div className="text-[11px] text-slate-400">Synthesized office coffee shop chords</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMusic}
                    className={`min-h-[40px] px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                      musicEnabled ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {musicEnabled ? 'PLAYING' : 'OFF'}
                  </button>
                </div>

                {/* Volume Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>SFX Master Volume</span>
                    <span className="font-mono text-amber-400 font-bold">{Math.round(sfxVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    onChange={(e) => {
                      setSfxVolume(parseFloat(e.target.value));
                      sound.playCardSelect();
                    }}
                    className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY & MODERATION */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Automated Name Safety Shield
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Offensive names, profanities, spaced evasions, and leetspeak substitutions are automatically sanitized and hidden on both client and server.
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Add custom blocked keyword..."
                    value={newBlockedWord}
                    onChange={(e) => setNewBlockedWord(e.target.value)}
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlockedWord}
                    className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold flex items-center gap-1 text-slate-300">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{blockedWords.length} Protected Filter Rules</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Auto-Masked</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                    {blockedWords.map((word, idx) => (
                      <span
                        key={`${word}-${idx}`}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 font-mono"
                      >
                        <span>Pattern #{idx + 1} (••••)</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedWord(word)}
                          className="hover:text-rose-400 transition ml-0.5 min-w-[20px] flex items-center justify-center"
                          title="Remove filter rule"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save Action Bar */}
          <div className="pt-2 sticky bottom-0 bg-[#0e1628]/95 backdrop-blur-md pb-1">
            <button
              type="submit"
              className="w-full min-h-[48px] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition cursor-pointer ring-1 ring-amber-400/40"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3] text-slate-950" />
                  <span>SETTINGS SAVED!</span>
                </>
              ) : (
                <span>SAVE SETTINGS</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
