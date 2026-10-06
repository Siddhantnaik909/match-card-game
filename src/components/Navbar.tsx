/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  Trophy,
  Settings,
  LogOut,
  Copy,
  Check,
  Sliders,
} from 'lucide-react';
import { RoomPublicState } from '../types/game';
import { useAudioManager } from '../hooks/useAudioManager';

interface NavbarProps {
  isConnected: boolean;
  isReconnecting: boolean;
  room: RoomPublicState | null;
  onOpenHowToPlay: () => void;
  onOpenResults: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
  isHost: boolean;
  onPlayNow?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isConnected,
  isReconnecting,
  room,
  onOpenHowToPlay,
  onOpenResults,
  onOpenSettings,
  onLeaveRoom,
  isHost,
  onPlayNow,
}) => {
  const {
    sfxEnabled,
    musicEnabled,
    sfxVolume,
    toggleSfx,
    toggleMusic,
    setSfxVolume,
  } = useAudioManager();

  const [copied, setCopied] = useState(false);
  const [showAudioPopover, setShowAudioPopover] = useState(false);

  const copyRoomCode = () => {
    if (!room?.roomCode) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25 text-slate-950 font-black text-xl">
            🎴
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white uppercase">
                Match <span className="text-amber-400">&amp;</span> Collect
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-800/90 text-amber-300 border border-slate-700">
                Multiplayer
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Work Smart. Play Together.</p>
          </div>
        </div>

        {/* Center: Room Code Badge if in room */}
        {room && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
            <span className="text-xs text-slate-400 font-medium">Room:</span>
            <span className="font-mono text-xs font-bold text-amber-400 tracking-wider">
              {room.roomCode}
            </span>
            <button
              onClick={copyRoomCode}
              title="Copy Room Code"
              className="p-1 hover:text-white text-slate-400 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection status pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium"
            title={isConnected ? 'Server Connected' : isReconnecting ? 'Reconnecting to Server...' : 'Disconnected'}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : isReconnecting
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden md:inline text-slate-300 text-[11px]">
              {isConnected ? 'Online' : isReconnecting ? 'Reconnecting' : 'Offline'}
            </span>
          </div>

          {/* Persistent Sound & Music Control Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAudioPopover(!showAudioPopover)}
              title="Audio & Music Controls"
              className={`min-h-[44px] min-w-[44px] p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                sfxEnabled || musicEnabled
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-500 border-slate-800'
              }`}
            >
              {sfxEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline text-[11px]">Audio</span>
            </button>

            {/* Audio Settings Popover */}
            {showAudioPopover && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-32px)] rounded-2xl bg-[#0f172a] border border-slate-700/80 p-4 shadow-2xl z-50 animate-scaleIn backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Audio Mixer</span>
                  </span>
                  <button
                    onClick={() => setShowAudioPopover(false)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {/* SFX Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                      {sfxEnabled ? (
                        <Volume2 className="w-4 h-4 text-amber-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Sound Effects</span>
                    </div>
                    <button
                      onClick={toggleSfx}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        sfxEnabled
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sfxEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Music (BGM) Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                      <Music className={`w-4 h-4 ${musicEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                      <span>Ambient Music</span>
                    </div>
                    <button
                      onClick={toggleMusic}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        musicEnabled
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {musicEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* SFX Volume Slider */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Volume</span>
                      <span className="font-mono">{Math.round(sfxVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sfxVolume}
                      onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* How to Play */}
          <button
            onClick={onOpenHowToPlay}
            title="How to Play"
            className="min-h-[44px] min-w-[44px] p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Results / Leaderboard */}
          <button
            onClick={onOpenResults}
            title="View Match Results & Leaderboard"
            className="min-h-[44px] min-w-[44px] p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Rankings</span>
          </button>

          {/* Quick Play CTA when outside a room */}
          {!room && onPlayNow && (
            <button
              onClick={onPlayNow}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <span>Play</span>
            </button>
          )}

          {/* Host Settings */}
          {room && isHost && (
            <button
              onClick={onOpenSettings}
              title="Room & Host Settings"
              className="min-h-[44px] min-w-[44px] p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Config</span>
            </button>
          )}

          {/* Leave Room Button */}
          {room && (
            <button
              onClick={onLeaveRoom}
              title="Leave Room"
              className="min-h-[44px] min-w-[44px] p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
