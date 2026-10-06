/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  LogIn,
  AlertCircle,
  ArrowRight,
  Dices,
  Layers,
  ShieldAlert,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { GameMode } from '../types/game';
import { sound } from '../services/sound';

interface JoinCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode: GameMode;
  initialRoomCode?: string;
  initialTab?: 'create' | 'join';
  onCreateRoom: (displayName: string, mode: GameMode) => void;
  onJoinRoom: (roomCode: string, displayName: string) => void;
  joinError?: string | null;
  onClearJoinError?: () => void;
}

const RANDOM_NAMES = [
  'PixelPilot',
  'CyberFox',
  'ApexCoder',
  'CoffeeKing',
  'NeonViper',
  'EchoByte',
  'ShadowLead',
  'RocketDesk',
  'MatrixHawk',
  'AlphaWolf',
  'TurboTech',
  'QuantumPro',
  'SwiftFalcon',
  'ZenithAce',
];

export const JoinCreateModal: React.FC<JoinCreateModalProps> = ({
  isOpen,
  onClose,
  defaultMode,
  initialRoomCode = '',
  initialTab,
  onCreateRoom,
  onJoinRoom,
  joinError,
  onClearJoinError,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>(defaultMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      if (initialRoomCode) {
        setRoomCode(initialRoomCode.toUpperCase().trim());
        setTab('join');
      } else if (initialTab) {
        setTab(initialTab);
      }
      setGameMode(defaultMode);
      setErrorMessage(null);
    }
  }, [isOpen, initialRoomCode, initialTab, defaultMode]);

  if (!isOpen) return null;

  const handleRandomizeName = () => {
    sound.playButtonClick();
    const randomPick = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    setDisplayName(`${randomPick}${num}`);
    setErrorMessage(null);
  };

  // Client-side quick precheck matching server safety guidelines
  const validateName = (name: string): boolean => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setErrorMessage('Name must be between 2 and 20 characters.');
      return false;
    }

    const safeRegex = /^[\p{L}\p{N}\s\-_.]+$/u;
    if (!safeRegex.test(trimmed)) {
      setErrorMessage('Name contains invalid characters. Use letters, numbers, spaces, or - _ .');
      return false;
    }

    if (/(.)\1{4,}/.test(trimmed)) {
      setErrorMessage('Name cannot have 5+ identical repeating characters.');
      return false;
    }

    const reserved = ['admin', 'system', 'moderator', 'host', 'bot', 'root'];
    const clean = trimmed.toLowerCase().replace(/[\s\-_.]/g, '');
    if (reserved.some((r) => clean === r || clean.startsWith(r + '1'))) {
      setErrorMessage('This name is reserved by system. Please choose another name.');
      return false;
    }

    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateName(displayName)) return;

    setIsSubmitting(true);
    sound.playButtonClick();

    try {
      // Pre-validate name with server API
      const res = await fetch('/api/validate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (!data.valid) {
        setErrorMessage(data.error || 'Name Not Allowed\nPlease choose another name.');
        setIsSubmitting(false);
        return;
      }

      // Send create room via WebSocket — modal stays open until room_state arrives
      onCreateRoom(displayName.trim(), gameMode);
    } catch {
      // If offline, proceed through WebSocket which also validates
      onCreateRoom(displayName.trim(), gameMode);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let raw = roomCode.trim();

    // If pasted a URL like https://...onrender.com/?room=MATCH-4GBX, extract ?room= value
    const paramMatch = raw.match(/[?&]room=([^&\s]+)/i);
    if (paramMatch) {
      raw = paramMatch[1];
    }

    // Strip to only alphanumeric + dash, uppercase
    const stripped = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // Extract the code: either full MATCH-XXXX or just the 4-6 char part
    let cleanRoomCode = '';
    const fullMatch = stripped.match(/MATCH-([A-Z0-9]{4,6})/);
    if (fullMatch) {
      cleanRoomCode = `MATCH-${fullMatch[1]}`;
    } else {
      // Just the suffix: e.g. "4GBX" or "4 G B X" → "4GBX"
      const suffix = stripped.replace(/-/g, '');
      if (/^[A-Z0-9]{4,6}$/.test(suffix)) {
        cleanRoomCode = `MATCH-${suffix}`;
      }
    }

    if (!cleanRoomCode) {
      setErrorMessage('Please enter a valid room code (e.g. MATCH-4GBX or just 4GBX).');
      return;
    }


    if (!validateName(displayName)) return;

    setIsSubmitting(true);
    sound.playButtonClick();

    try {
      // Only validate name via API (room validation is done server-side via WebSocket)
      const res = await fetch('/api/validate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();
      if (!data.valid) {
        setErrorMessage(data.error || 'Name Not Allowed\nPlease choose another name.');
        setIsSubmitting(false);
        return;
      }

      // Room code validity is validated by the server via WebSocket join_room.
      // The modal stays open — App.tsx closes it when room state is confirmed.
      // Errors (invalid code, room full) come back via joinError prop.
      onJoinRoom(cleanRoomCode, displayName.trim());
      // Keep submitting=true — will reset when joinError arrives or room joins
    } catch {
      // If name API is unreachable, proceed — WebSocket server validates everything
      onJoinRoom(cleanRoomCode, displayName.trim());
    } finally {
      // Don't reset isSubmitting here — we wait for server response
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#131b2e] via-[#0d1322] to-[#070b14] border border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Ambient Top Light Beam */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              Multiplayer Match Hub
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {tab === 'create' ? 'Host New Game' : 'Join Existing Room'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {tab === 'create'
              ? 'Configure your room and invite 3–29 players for a real-time card showdown.'
              : 'Enter a room code to jump straight into the arena with colleagues.'}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setErrorMessage(null);
              sound.playButtonClick();
            }}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Room</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setErrorMessage(null);
              sound.playButtonClick();
            }}
            className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              tab === 'join'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4 stroke-[3]" />
            <span>Join Room</span>
          </button>
        </div>

        {/* Error notification banner — local validation or server join error */}
        {(errorMessage || joinError) && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="font-semibold whitespace-pre-line leading-relaxed flex-1">
              {joinError || errorMessage}
            </div>
            <button
              onClick={() => { setErrorMessage(null); onClearJoinError?.(); }}
              className="text-rose-400 hover:text-rose-200 text-xs p-1"
            >
              ✕
            </button>
          </div>
        )}

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Display Name Input with Randomizer */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Player Display Name
                </label>
                <button
                  type="button"
                  onClick={handleRandomizeName}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Random Tag</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={20}
                  placeholder="e.g. Alex Cooper"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-100 placeholder:text-slate-500 text-sm font-semibold outline-none transition"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Letters, numbers, spaces, and safe punctuation (2–20 characters).
              </p>
            </div>

            {/* Game Mode Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Select Game Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setGameMode('match-and-collect');
                    sound.playCardSelect();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative overflow-hidden ${
                    gameMode === 'match-and-collect'
                      ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400/40 shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🎴</span>
                    <span className="font-bold text-xs sm:text-sm text-amber-300">
                      Match &amp; Collect
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Pass 1 card, collect 4-of-a-kind. Supports 4–30 players.
                  </p>
                  <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    4–30 Players
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGameMode('chor-chitthi');
                    sound.playCardSelect();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative overflow-hidden ${
                    gameMode === 'chor-chitthi'
                      ? 'border-cyan-400 bg-cyan-500/15 text-white ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🕵️</span>
                    <span className="font-bold text-xs sm:text-sm text-cyan-300">
                      Chor-Chitthi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Secret roles &amp; office deduction. Raja, Mantri, Sipahi, Chor.
                  </p>
                  <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    4 Players
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !displayName.trim()}
              className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(251,191,36,0.35)] transition cursor-pointer"
            >
              <span>{isSubmitting ? 'Creating Lobby...' : 'Create & Enter Lobby'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-5">
            {/* Room Code Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Room Code
              </label>
              <input
                type="text"
                required
                maxLength={12}
                placeholder="MATCH-XXXX"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setErrorMessage(null);
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-100 placeholder:text-slate-500 text-sm font-mono font-bold tracking-wider outline-none transition uppercase"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Enter the 6-character room code from your host (e.g. MATCH-8K29).
              </p>
            </div>

            {/* Display Name Input with Randomizer */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Player Display Name
                </label>
                <button
                  type="button"
                  onClick={handleRandomizeName}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Random Tag</span>
                </button>
              </div>

              <input
                type="text"
                required
                maxLength={20}
                placeholder="e.g. Alex Cooper"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-100 placeholder:text-slate-500 text-sm font-semibold outline-none transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !displayName.trim() || !roomCode.trim()}
              className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(251,191,36,0.35)] transition cursor-pointer"
            >
              <span>{isSubmitting ? 'Connecting...' : 'Join Game Lobby'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
