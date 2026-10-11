/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { MatchResultRecord, LeaderboardEntry } from '../src/types/game';
import { UserAccount, AuthSession, PublicUserProfile, UserAchievement } from '../src/types/auth';

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target?: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface StorageData {
  results: MatchResultRecord[];
  blockedWords: string[];
  users: UserAccount[];
  sessions: AuthSession[];
  auditLogs: AdminAuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'game-store.json');

export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// System achievements definition
export const SYSTEM_ACHIEVEMENTS: Array<Omit<UserAchievement, 'unlockedAt'>> = [
  {
    id: 'ach-first-match',
    name: 'First Blood',
    description: 'Complete your first competitive multiplayer match',
    icon: '⚔️',
  },
  {
    id: 'ach-first-win',
    name: 'Champion Debut',
    description: 'Win your first official match',
    icon: '🏆',
  },
  {
    id: 'ach-win-streak-3',
    name: 'Hot Streak',
    description: 'Achieve a 3-game consecutive win streak',
    icon: '🔥',
  },
  {
    id: 'ach-veteran-10',
    name: 'Seasoned Office Pro',
    description: 'Compete in 10 or more multiplayer matches',
    icon: '🎖️',
  },
  {
    id: 'ach-pass-master',
    name: 'Courier Master',
    description: 'Pass 50+ cards around the circular arena',
    icon: '⚡',
  },
  {
    id: 'ach-grandmaster',
    name: 'Office Grandmaster',
    description: 'Surpass 1200 rating in competitive play',
    icon: '👑',
  },
];

class GameStorage {
  private data: StorageData = {
    results: [],
    blockedWords: [],
    users: [],
    sessions: [],
    auditLogs: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          results: Array.isArray(parsed.results) ? parsed.results : [],
          blockedWords: Array.isArray(parsed.blockedWords) ? parsed.blockedWords : [],
          users: Array.isArray(parsed.users) ? parsed.users : [],
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        };
      } else {
        this.save();
      }
      this.ensureDefaultAdmin();
    } catch (err) {
      console.error('[Storage] Error initializing storage:', err);
      this.data = { results: [], blockedWords: [], users: [], sessions: [], auditLogs: [] };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const safeData = sanitizePayload(this.data);
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(safeData, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Storage] Error saving storage:', err);
    }
  }

  // --- CRYPTO & PASSWORD HASHING ---
  public async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  public async verifyPassword(password: string, combinedHash: string): Promise<boolean> {
    return new Promise((resolve) => {
      const parts = combinedHash.split(':');
      if (parts.length !== 2) return resolve(false);
      const [salt, key] = parts;
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return resolve(false);
        const keyBuffer = Buffer.from(key, 'hex');
        if (keyBuffer.length !== derivedKey.length) return resolve(false);
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      });
    });
  }

  private generatePublicPlayerId(): string {
    const chars = '0123456789ABCDEF';
    let code = 'PID-';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private async ensureDefaultAdmin() {
    const adminExists = this.data.users.some((u) => u.role === 'admin');
    if (!adminExists) {
      const hash = await this.hashPassword('Admin@123456');
      const adminUser: UserAccount = {
        id: 'user-admin-default',
        publicPlayerId: 'PID-ADMIN01',
        username: 'admin',
        displayName: 'Platform Admin',
        email: 'admin@platform.game',
        passwordHash: hash,
        avatar: '👑',
        role: 'admin',
        isBanned: false,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        stats: {
          wins: 10,
          losses: 2,
          gamesPlayed: 12,
          winRate: 83.3,
          currentStreak: 4,
          bestStreak: 6,
          totalCardsPassed: 65,
          totalCardsReceived: 62,
          rating: 1350,
        },
        achievements: [
          {
            id: 'ach-first-match',
            name: 'First Blood',
            description: 'Complete your first competitive multiplayer match',
            icon: '⚔️',
            unlockedAt: new Date().toISOString(),
          },
          {
            id: 'ach-first-win',
            name: 'Champion Debut',
            description: 'Win your first official match',
            icon: '🏆',
            unlockedAt: new Date().toISOString(),
          },
        ],
      };
      this.data.users.push(adminUser);
      this.save();
    }
  }

  // --- USER AUTHENTICATION & MANAGEMENT ---
  public async registerUser(params: {
    username: string;
    displayName: string;
    email: string;
    password: string;
    avatar?: string;
  }): Promise<{ user?: PublicUserProfile; error?: string }> {
    const cleanUsername = params.username.toLowerCase().trim();
    const cleanEmail = params.email.toLowerCase().trim();
    const cleanDisplayName = params.displayName.trim();

    if (this.data.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { error: 'Username is already registered.' };
    }
    if (this.data.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { error: 'Email address is already registered.' };
    }

    let publicPlayerId = this.generatePublicPlayerId();
    while (this.data.users.some((u) => u.publicPlayerId === publicPlayerId)) {
      publicPlayerId = this.generatePublicPlayerId();
    }

    const passwordHash = await this.hashPassword(params.password);
    const newUser: UserAccount = {
      id: crypto.randomUUID(),
      publicPlayerId,
      username: cleanUsername,
      displayName: cleanDisplayName || cleanUsername,
      email: cleanEmail,
      passwordHash,
      avatar: params.avatar || '🎮',
      role: 'user',
      isBanned: false,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      stats: {
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalCardsPassed: 0,
        totalCardsReceived: 0,
        rating: 1000,
      },
      achievements: [],
    };

    this.data.users.push(newUser);
    this.save();

    return { user: this.toPublicProfile(newUser) };
  }

  public async loginUser(params: {
    login: string; // username or email
    password: string;
  }): Promise<{ user?: PublicUserProfile; session?: AuthSession; error?: string }> {
    const clean = params.login.toLowerCase().trim();
    const user = this.data.users.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (!user) {
      return { error: 'Invalid username/email or password.' };
    }
    if (user.isBanned) {
      return { error: 'Your account has been suspended by administration.' };
    }

    const valid = await this.verifyPassword(params.password, user.passwordHash);
    if (!valid) {
      return { error: 'Invalid username/email or password.' };
    }

    user.lastActive = new Date().toISOString();
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session: AuthSession = {
      token: sessionToken,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    this.data.sessions.push(session);
    // Keep max 1000 sessions
    if (this.data.sessions.length > 1000) {
      this.data.sessions = this.data.sessions.slice(-1000);
    }
    this.save();

    return { user: this.toPublicProfile(user), session };
  }

  public getUserBySessionToken(token: string): PublicUserProfile | null {
    if (!token) return null;
    const session = this.data.sessions.find(
      (s) => s.token === token && new Date(s.expiresAt).getTime() > Date.now()
    );
    if (!session) return null;
    const user = this.data.users.find((u) => u.id === session.userId);
    if (!user || user.isBanned) return null;
    user.lastActive = new Date().toISOString();
    return this.toPublicProfile(user);
  }

  public getUserById(userId: string): PublicUserProfile | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    return this.toPublicProfile(user);
  }

  public logoutSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  public updateUserProfile(
    userId: string,
    updates: { displayName?: string; avatar?: string }
  ): { user?: PublicUserProfile; error?: string } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return { error: 'User not found' };

    if (updates.displayName) {
      user.displayName = updates.displayName.trim();
    }
    if (updates.avatar) {
      user.avatar = updates.avatar.trim();
    }
    user.lastActive = new Date().toISOString();
    this.save();
    return { user: this.toPublicProfile(user) };
  }

  public toPublicProfile(user: UserAccount): PublicUserProfile {
    return {
      id: user.id,
      publicPlayerId: user.publicPlayerId,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      stats: { ...user.stats },
      achievements: [...user.achievements],
    };
  }

  // --- RECORD MATCH & UPDATE USER STATS ---
  public recordMatchResult(record: MatchResultRecord): void {
    const sanitized = sanitizePayload(record);
    const exists = this.data.results.some((r) => r.id === sanitized.id);
    if (!exists) {
      this.data.results.unshift(sanitized);
      if (this.data.results.length > 500) {
        this.data.results = this.data.results.slice(0, 500);
      }
      // Update registered users stats who participated in this match
      this.updateRegisteredPlayersFromMatch(sanitized);
      this.save();
    }
  }

  private updateRegisteredPlayersFromMatch(match: MatchResultRecord) {
    if (!match.participants || !Array.isArray(match.participants)) return;

    for (const p of match.participants) {
      // Find matching user by displayName or username
      const user = this.data.users.find(
        (u) =>
          u.displayName.toLowerCase() === p.displayName.toLowerCase() ||
          u.username.toLowerCase() === p.displayName.toLowerCase()
      );
      if (!user) continue;

      const isWinner = p.status === 'winner' || p.rank === 1;
      user.stats.gamesPlayed += 1;
      user.stats.totalCardsPassed += p.cardsPassed || 0;
      user.stats.totalCardsReceived += p.cardsReceived || 0;

      if (isWinner) {
        user.stats.wins += 1;
        user.stats.currentStreak += 1;
        if (user.stats.currentStreak > user.stats.bestStreak) {
          user.stats.bestStreak = user.stats.currentStreak;
        }
        // Rating update for winner
        user.stats.rating = Math.min(2500, user.stats.rating + 25);
      } else {
        user.stats.losses += 1;
        user.stats.currentStreak = 0;
        // Rating update for loss
        user.stats.rating = Math.max(800, user.stats.rating - 10);
      }

      user.stats.winRate =
        user.stats.gamesPlayed > 0
          ? Math.round((user.stats.wins / user.stats.gamesPlayed) * 1000) / 10
          : 0;

      // Check achievement progression
      this.evaluateAchievements(user);
    }
  }

  private evaluateAchievements(user: UserAccount) {
    const unlockedIds = new Set(user.achievements.map((a) => a.id));

    // First match
    if (user.stats.gamesPlayed >= 1 && !unlockedIds.has('ach-first-match')) {
      const def = SYSTEM_ACHIEVEMENTS.find((a) => a.id === 'ach-first-match')!;
      user.achievements.push({ ...def, unlockedAt: new Date().toISOString() });
    }
    // First win
    if (user.stats.wins >= 1 && !unlockedIds.has('ach-first-win')) {
      const def = SYSTEM_ACHIEVEMENTS.find((a) => a.id === 'ach-first-win')!;
      user.achievements.push({ ...def, unlockedAt: new Date().toISOString() });
    }
    // 3 win streak
    if (user.stats.currentStreak >= 3 && !unlockedIds.has('ach-win-streak-3')) {
      const def = SYSTEM_ACHIEVEMENTS.find((a) => a.id === 'ach-win-streak-3')!;
      user.achievements.push({ ...def, unlockedAt: new Date().toISOString() });
    }
    // 10 matches
    if (user.stats.gamesPlayed >= 10 && !unlockedIds.has('ach-veteran-10')) {
      const def = SYSTEM_ACHIEVEMENTS.find((a) => a.id === 'ach-veteran-10')!;
      user.achievements.push({ ...def, unlockedAt: new Date().toISOString() });
    }
    // 50 cards passed
    if (user.stats.totalCardsPassed >= 50 && !unlockedIds.has('ach-pass-master')) {
      const def = SYSTEM_ACHIEVEMENTS.find((a) => a.id === 'ach-pass-master')!;
      user.achievements.push({ ...def, unlockedAt: new Date().toISOString() });
    }
    // Rating > 1200
    if (user.stats.rating >= 1200 && !unlockedIds.has('ach-grandmaster')) {
      const def = SYSTEM_ACHIEVEMENTS.find((a) => a.id === 'ach-grandmaster')!;
      user.achievements.push({ ...def, unlockedAt: new Date().toISOString() });
    }
  }

  public getResults(limit = 100): MatchResultRecord[] {
    return this.data.results.slice(0, limit);
  }

  public getLeaderboard(): LeaderboardEntry[] {
    // Merge database matches with registered accounts for unified competitive standings
    const playerStats: Record<
      string,
      {
        displayName: string;
        wins: number;
        gamesPlayed: number;
        totalDurationMs: number;
        bestTimeMs: number;
        currentStreak: number;
        bestStreak: number;
        totalRoundsSurvived: number;
        totalCardsPassed: number;
        totalCardsReceived: number;
        favoriteCardCounts: Record<string, number>;
        lastPlayed: string;
        matchOutcomes: boolean[];
      }
    > = {};

    const chronologicalMatches = [...this.data.results].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    for (const match of chronologicalMatches) {
      const matchParticipants =
        match.participants && Array.isArray(match.participants)
          ? match.participants
          : [
              {
                playerId: match.winnerId,
                displayName: match.winnerName,
                rank: 1,
                status: 'winner' as const,
                cardsPassed: match.totalCardsTransferred || 1,
                cardsReceived: match.totalCardsTransferred || 1,
                matchProgress: 'Winner',
              },
            ];

      for (const p of matchParticipants) {
        const name = p.displayName.trim();
        if (!playerStats[name]) {
          playerStats[name] = {
            displayName: name,
            wins: 0,
            gamesPlayed: 0,
            totalDurationMs: 0,
            bestTimeMs: 999999999,
            currentStreak: 0,
            bestStreak: 0,
            totalRoundsSurvived: 0,
            totalCardsPassed: 0,
            totalCardsReceived: 0,
            favoriteCardCounts: {},
            lastPlayed: match.completedAt,
            matchOutcomes: [],
          };
        }

        const stat = playerStats[name];
        stat.gamesPlayed += 1;
        stat.totalDurationMs += match.durationMs;
        stat.totalRoundsSurvived += match.totalRounds || 1;
        stat.totalCardsPassed += p.cardsPassed || 0;
        stat.totalCardsReceived += p.cardsReceived || 0;

        const isWinner = p.status === 'winner' || match.winnerName === name;
        stat.matchOutcomes.push(isWinner);

        if (isWinner) {
          stat.wins += 1;
          if (match.durationMs > 0 && match.durationMs < stat.bestTimeMs) {
            stat.bestTimeMs = match.durationMs;
          }
          if (match.winningCardName) {
            stat.favoriteCardCounts[match.winningCardName] =
              (stat.favoriteCardCounts[match.winningCardName] || 0) + 1;
          }
        }

        if (new Date(match.completedAt).getTime() > new Date(stat.lastPlayed).getTime()) {
          stat.lastPlayed = match.completedAt;
        }
      }
    }

    const leaderboard: LeaderboardEntry[] = Object.values(playerStats).map((stat) => {
      let curStreak = 0;
      let maxStreak = 0;
      for (const won of stat.matchOutcomes) {
        if (won) {
          curStreak += 1;
          if (curStreak > maxStreak) maxStreak = curStreak;
        } else {
          curStreak = 0;
        }
      }

      let favoriteCard: string | undefined;
      let maxCardCount = 0;
      for (const [card, count] of Object.entries(stat.favoriteCardCounts)) {
        if (count > maxCardCount) {
          maxCardCount = count;
          favoriteCard = card;
        }
      }

      const winRate = stat.gamesPlayed > 0 ? (stat.wins / stat.gamesPlayed) * 100 : 0;
      const avgDurationMs =
        stat.gamesPlayed > 0 ? Math.round(stat.totalDurationMs / stat.gamesPlayed) : 0;

      return {
        displayName: stat.displayName,
        wins: stat.wins,
        losses: stat.gamesPlayed - stat.wins,
        gamesPlayed: stat.gamesPlayed,
        winRate: Math.round(winRate * 10) / 10,
        avgDurationMs,
        bestTimeMs: stat.bestTimeMs === 999999999 ? undefined : stat.bestTimeMs,
        currentStreak: curStreak,
        bestStreak: maxStreak,
        totalRoundsSurvived: stat.totalRoundsSurvived,
        totalCardsPassed: stat.totalCardsPassed,
        totalCardsReceived: stat.totalCardsReceived,
        favoriteCard,
        lastPlayed: stat.lastPlayed,
      };
    });

    return leaderboard.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (a.avgDurationMs !== b.avgDurationMs) return a.avgDurationMs - b.avgDurationMs;
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      return a.displayName.localeCompare(b.displayName);
    });
  }

  // --- ADMIN TOOLS & AUDIT ---
  public getAdminStats() {
    return {
      totalRegisteredUsers: this.data.users.length,
      totalMatchesCompleted: this.data.results.length,
      activeSessions: this.data.sessions.filter(
        (s) => new Date(s.expiresAt).getTime() > Date.now()
      ).length,
      blockedWordsCount: this.data.blockedWords.length,
      auditLogsCount: this.data.auditLogs.length,
    };
  }

  public getAllUsers(adminUserId: string): PublicUserProfile[] | null {
    const admin = this.data.users.find((u) => u.id === adminUserId);
    if (!admin || admin.role !== 'admin') return null;
    return this.data.users.map((u) => this.toPublicProfile(u));
  }

  public setUserBanStatus(adminUserId: string, targetUserId: string, isBanned: boolean): boolean {
    const admin = this.data.users.find((u) => u.id === adminUserId);
    if (!admin || admin.role !== 'admin') return false;
    const target = this.data.users.find((u) => u.id === targetUserId);
    if (!target || target.role === 'admin') return false;

    target.isBanned = isBanned;
    if (isBanned) {
      // Invalidate target user's active sessions
      this.data.sessions = this.data.sessions.filter((s) => s.userId !== targetUserId);
    }

    this.logAdminAction(adminUserId, admin.displayName, isBanned ? 'BAN_USER' : 'UNBAN_USER', target.username);
    this.save();
    return true;
  }

  public logAdminAction(adminId: string, adminName: string, action: string, target?: string, details?: Record<string, any>) {
    const log: AdminAuditLog = {
      id: crypto.randomUUID(),
      adminId,
      adminName,
      action,
      target,
      timestamp: new Date().toISOString(),
      details,
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 300) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 300);
    }
    this.save();
  }

  public getAuditLogs(adminUserId: string): AdminAuditLog[] | null {
    const admin = this.data.users.find((u) => u.id === adminUserId);
    if (!admin || admin.role !== 'admin') return null;
    return this.data.auditLogs;
  }

  public getBlockedWords(): string[] {
    return this.data.blockedWords;
  }

  public saveBlockedWords(words: string[]): void {
    this.data.blockedWords = sanitizePayload(words);
    this.save();
  }
}

export const storage = new GameStorage();
