/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserAccount {
  id: string; // Internal unique ID
  publicPlayerId: string; // e.g. "PID-89421A"
  username: string; // Unique handle
  displayName: string;
  email: string;
  passwordHash: string; // salt:hash (scrypt)
  avatar: string; // avatar key or emoji
  role: 'user' | 'admin' | 'moderator';
  isBanned: boolean;
  createdAt: string;
  lastActive: string;
  stats: {
    wins: number;
    losses: number;
    gamesPlayed: number;
    winRate: number;
    currentStreak: number;
    bestStreak: number;
    totalCardsPassed: number;
    totalCardsReceived: number;
    rating: number; // Elo-style rating starting at 1000
  };
  achievements: UserAchievement[];
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface PublicUserProfile {
  id: string;
  publicPlayerId: string;
  username: string;
  displayName: string;
  avatar: string;
  role: string;
  createdAt: string;
  lastActive: string;
  stats: UserAccount['stats'];
  achievements: UserAchievement[];
  isOnline?: boolean;
}

export interface AuthSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface MatchmakingQueueState {
  inQueue: boolean;
  queueLength: number;
  mode: string;
  estimatedWaitSeconds: number;
  elapsedSeconds: number;
}
