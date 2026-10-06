/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { MatchResultRecord, LeaderboardEntry } from '../src/types/game';

interface StorageData {
  results: MatchResultRecord[];
  blockedWords: string[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'game-store.json');

/**
 * Strips all undefined properties recursively from an object
 * to ensure zero-crash payload hygiene.
 */
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

class GameStorage {
  private data: StorageData = {
    results: [],
    blockedWords: [],
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
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[Storage] Error initializing game storage file:', err);
      this.data = { results: [], blockedWords: [] };
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
      console.error('[Storage] Error saving game storage:', err);
    }
  }

  public recordMatchResult(record: MatchResultRecord): void {
    const sanitized = sanitizePayload(record);
    // Prevent duplicate recording of the exact same match ID
    const exists = this.data.results.some((r) => r.id === sanitized.id);
    if (!exists) {
      this.data.results.unshift(sanitized);
      // Keep last 300 matches
      if (this.data.results.length > 300) {
        this.data.results = this.data.results.slice(0, 300);
      }
      this.save();
    }
  }

  public getResults(limit = 100): MatchResultRecord[] {
    return this.data.results.slice(0, limit);
  }

  /**
   * Deterministically calculates comprehensive leaderboard statistics
   * from 100% verified completed matches in the database.
   */
  public getLeaderboard(): LeaderboardEntry[] {
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
        // History chronological list for streak computation
        matchOutcomes: boolean[];
      }
    > = {};

    // Sort matches chronologically ascending to compute streaks accurately
    const chronologicalMatches = [...this.data.results].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    for (const match of chronologicalMatches) {
      const matchParticipants = match.participants && Array.isArray(match.participants)
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

    // Build finalized leaderboard entries
    const leaderboard: LeaderboardEntry[] = Object.values(playerStats).map((stat) => {
      // Calculate current streak & best streak
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

      // Favorite winning card
      let favoriteCard: string | undefined;
      let maxCardCount = 0;
      for (const [card, count] of Object.entries(stat.favoriteCardCounts)) {
        if (count > maxCardCount) {
          maxCardCount = count;
          favoriteCard = card;
        }
      }

      const winRate = stat.gamesPlayed > 0 ? (stat.wins / stat.gamesPlayed) * 100 : 0;
      const avgDurationMs = stat.gamesPlayed > 0 ? Math.round(stat.totalDurationMs / stat.gamesPlayed) : 0;

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

    // Deterministic ranking:
    // 1. Wins DESC
    // 2. Win Rate DESC
    // 3. Average Duration ASC (faster is better)
    // 4. Games Played DESC
    // 5. Display Name ASC (alphabetical tie-breaker)
    return leaderboard.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (a.avgDurationMs !== b.avgDurationMs) return a.avgDurationMs - b.avgDurationMs;
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      return a.displayName.localeCompare(b.displayName);
    });
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
