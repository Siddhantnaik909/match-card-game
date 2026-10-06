/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Default list of reserved names
export const RESERVED_NAMES = [
  'admin',
  'administrator',
  'system',
  'sysadmin',
  'moderator',
  'mod',
  'host',
  'server',
  'bot',
  'ai',
  'root',
  'superuser',
  'support',
  'official',
];

// Default list of profanities and offensive terms (can be added to dynamically by admin)
export const DEFAULT_BLOCKED_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'cunt',
  'dick',
  'nigger',
  'nigga',
  'faggot',
  'slut',
  'whore',
  'kill',
  'nazi',
  'hitler',
  'terrorist',
  'pedophile',
  'pussy',
  'cock',
  'retard',
  'twat',
  'porn',
  'sex',
  'penis',
  'vagina',
  'tits',
  'boobs',
];

class NameSafetyFilter {
  private customBlockedWords: Set<string> = new Set(DEFAULT_BLOCKED_WORDS.map((w) => w.toLowerCase()));

  public getBlockedWords(): string[] {
    return Array.from(this.customBlockedWords);
  }

  public addBlockedWord(word: string): void {
    const trimmed = word.trim().toLowerCase();
    if (trimmed) {
      this.customBlockedWords.add(trimmed);
    }
  }

  public removeBlockedWord(word: string): void {
    const trimmed = word.trim().toLowerCase();
    this.customBlockedWords.delete(trimmed);
  }

  public setBlockedWords(words: string[]): void {
    this.customBlockedWords = new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean));
  }

  /**
   * Normalizes text by removing leetspeak/symbol substitutions and collapsing repetitions
   */
  private normalize(input: string): string {
    let text = input.toLowerCase();

    // Map common leetspeak substitutions
    const map: Record<string, string> = {
      '@': 'a',
      '4': 'a',
      '8': 'b',
      '3': 'e',
      '1': 'i',
      '!': 'i',
      '|': 'i',
      '0': 'o',
      '$': 's',
      '5': 's',
      '7': 't',
      '+': 't',
      'v': 'u',
      'vv': 'w',
    };

    for (const [symbol, letter] of Object.entries(map)) {
      text = text.replaceAll(symbol, letter);
    }

    // Collapse consecutive repeating letters (e.g. "baaaaad" -> "bad")
    text = text.replace(/(.)\1{2,}/g, '$1$1');

    return text;
  }

  /**
   * Validates whether a player display name is acceptable.
   * Returns { valid: boolean, error?: string }
   */
  public validate(displayName: unknown): { valid: boolean; error?: string } {
    if (typeof displayName !== 'string') {
      return { valid: false, error: 'Name Not Allowed\nPlease choose another name.' };
    }

    const trimmed = displayName.trim();

    // Length check: 2-20 characters
    if (trimmed.length < 2 || trimmed.length > 20) {
      return { valid: false, error: 'Name Not Allowed\nPlease choose another name.' };
    }

    // Allowed characters: letters, numbers, spaces, and safe common symbols (- _ .)
    const safeCharRegex = /^[\p{L}\p{N}\s\-_.]+$/u;
    if (!safeCharRegex.test(trimmed)) {
      return { valid: false, error: 'Name Not Allowed\nPlease choose another name.' };
    }

    // Excessive repeated character check (e.g. "aaaaaaa" or "------")
    if (/(.)\1{4,}/.test(trimmed)) {
      return { valid: false, error: 'Name Not Allowed\nPlease choose another name.' };
    }

    // Check reserved names
    const lowerClean = trimmed.toLowerCase().replace(/[\s\-_.]/g, '');
    for (const reserved of RESERVED_NAMES) {
      if (lowerClean === reserved || lowerClean.startsWith(reserved + '1') || lowerClean.endsWith('admin')) {
        return { valid: false, error: 'Name Not Allowed\nPlease choose another name.' };
      }
    }

    // Check blocked words with normalization and space removal
    const normalized = this.normalize(trimmed);
    const compactNormalized = normalized.replace(/\s+/g, '');

    for (const word of this.customBlockedWords) {
      // Check full string or word boundary or compact form
      if (
        normalized.includes(word) ||
        compactNormalized.includes(word) ||
        new RegExp(`\\b${word}\\b`, 'i').test(normalized)
      ) {
        return { valid: false, error: 'Name Not Allowed\nPlease choose another name.' };
      }
    }

    return { valid: true };
  }
}

export const nameFilter = new NameSafetyFilter();
