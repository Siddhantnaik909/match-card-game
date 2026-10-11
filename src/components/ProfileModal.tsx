/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trophy, Flame, Zap, Award, Edit2, Check, Shield, Calendar, UserCheck } from 'lucide-react';
import { PublicUserProfile } from '../types/auth';
import { sound } from '../services/sound';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PublicUserProfile | null;
  onUpdateProfile: (updates: { displayName?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
}

const AVATAR_OPTIONS = ['🎮', '⚡', '👑', '🔥', '💻', '🦊', '🚀', '🐺', '☕', '🕶️', '🎯', '💎', '🦄', '🦁', '🌟', '🛡️'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🎮');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    sound.playButtonClick();
    const res = await onUpdateProfile({ displayName, avatar: selectedAvatar });
    setSaving(false);
    if (!res.success) {
      setError(res.error || 'Failed to update profile');
    } else {
      setIsEditing(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#111827] via-[#0b101b] to-[#070912] border border-slate-700/80 p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-2xl flex items-center justify-center border border-amber-500/30">
              {user.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {user.displayName}
                </h2>
                {user.role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">@{user.username} · ID: {user.publicPlayerId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setDisplayName(user.displayName);
                setSelectedAvatar(user.avatar);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-bold flex items-center gap-1 border border-slate-700/50"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="my-4 p-4 rounded-2xl bg-slate-900 border border-amber-500/30 animate-in fade-in">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              Customize Identity
            </h3>
            {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
            <div className="mb-3">
              <label className="block text-xs text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1.5">Avatar Icon</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                      selectedAvatar === av
                        ? 'border-amber-400 bg-amber-500/20'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase hover:bg-amber-400 transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}

        {/* Career Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rating</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{user.stats.rating}</div>
            <div className="text-[10px] text-slate-500">Competitive Elo</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Win Rate</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{user.stats.winRate}%</div>
            <div className="text-[10px] text-slate-500">{user.stats.wins}W / {user.stats.losses}L</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Win Streak</div>
            <div className="text-2xl font-black text-orange-400 mt-1">{user.stats.currentStreak} 🔥</div>
            <div className="text-[10px] text-slate-500">Best: {user.stats.bestStreak}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matches</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{user.stats.gamesPlayed}</div>
            <div className="text-[10px] text-slate-500">{user.stats.totalCardsPassed} cards passed</div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Career Achievements ({user.achievements.length})
            </h3>
          </div>
          {user.achievements.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
              No trophies unlocked yet. Complete matches to earn medals!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {user.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/20 flex items-center gap-3"
                >
                  <div className="text-2xl w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    {ach.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{ach.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-tight">{ach.description}</p>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Unlocked: {formatDate(ach.unlockedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Account Details and Logout */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Member since {formatDate(user.createdAt)}</span>
          </div>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
