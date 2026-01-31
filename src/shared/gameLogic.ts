// Bowldem Game Logic
// Shared between client and server

import type { Player, Puzzle, GuessFeedback, GameState, UserStats } from './types/game';

// Game Constants
export const EPOCH_DATE = '2026-01-15';
export const MAX_GUESSES = 5;

/**
 * Get today's date in UTC as YYYY-MM-DD string
 */
export function getTodayUTC(): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return dateStr ?? '2026-01-31'; // Fallback should never happen
}

/**
 * Calculate puzzle number based on days since epoch
 */
export function getPuzzleNumber(dateStr: string = getTodayUTC()): number {
  const date = new Date(dateStr + 'T00:00:00Z');
  const epoch = new Date(EPOCH_DATE + 'T00:00:00Z');
  const diffTime = date.getTime() - epoch.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Get puzzle index from puzzle number (wraps around if exceeds total)
 */
export function getPuzzleIndex(puzzleNumber: number, totalPuzzles: number): number {
  return puzzleNumber % totalPuzzles;
}

/**
 * Get the puzzle for a specific date
 */
export function getPuzzleForDate(puzzles: Puzzle[], dateStr: string = getTodayUTC()): {
  puzzle: Puzzle;
  puzzleNumber: number;
  puzzleIndex: number;
} {
  const puzzleNumber = getPuzzleNumber(dateStr);
  const puzzleIndex = getPuzzleIndex(puzzleNumber, puzzles.length);
  const puzzle = puzzles[puzzleIndex];
  if (!puzzle) {
    throw new Error(`No puzzle found for index ${puzzleIndex}`);
  }
  return {
    puzzle,
    puzzleNumber,
    puzzleIndex
  };
}

/**
 * Generate feedback for a guess
 */
export function generateFeedback(
  guessedPlayerKey: string,
  puzzle: Puzzle,
  playersLookup: Record<string, Player>
): GuessFeedback | null {
  const guessedPlayer = playersLookup[guessedPlayerKey];
  if (!guessedPlayer || !puzzle) return null;

  const matchData = puzzle.matchData;
  const playersInMatch = matchData.playersInMatch || [];
  const targetPlayerTeam = matchData.targetPlayerTeam;
  const targetPlayerRole = matchData.targetPlayerRole;

  return {
    playerName: guessedPlayer.fullName,
    country: guessedPlayer.country,
    role: guessedPlayer.role,
    playedInGame: playersInMatch.includes(guessedPlayerKey),
    sameTeam: guessedPlayer.country === targetPlayerTeam,
    sameRole: guessedPlayer.role === targetPlayerRole,
    isMVP: guessedPlayerKey === puzzle.targetPlayer
  };
}

/**
 * Create default game state
 */
export function createDefaultGameState(puzzleNumber: number, puzzleDate: string): GameState {
  return {
    puzzleNumber,
    puzzleDate,
    guesses: [],
    gameStatus: 'in_progress'
  };
}

/**
 * Create default user stats
 */
export function createDefaultStats(): UserStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0],
    lastWinDate: null
  };
}

/**
 * Update stats after game completion
 */
export function updateStats(
  stats: UserStats,
  won: boolean,
  guessCount: number,
  puzzleDate: string
): UserStats {
  const newStats = { ...stats };
  newStats.gamesPlayed += 1;

  if (won) {
    newStats.gamesWon += 1;
    newStats.guessDistribution[guessCount - 1] = (newStats.guessDistribution[guessCount - 1] || 0) + 1;

    // Update streak
    const yesterday = new Date(puzzleDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (newStats.lastWinDate === yesterdayStr) {
      newStats.currentStreak += 1;
    } else if (newStats.lastWinDate !== puzzleDate) {
      newStats.currentStreak = 1;
    }

    newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak);
    newStats.lastWinDate = puzzleDate;
  } else {
    newStats.currentStreak = 0;
  }

  return newStats;
}

/**
 * Get milliseconds until next puzzle (midnight UTC)
 */
export function getMillisecondsUntilNextPuzzle(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

/**
 * Format milliseconds as HH:MM:SS
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Generate share text for results
 */
export function generateShareText(
  puzzleNumber: number,
  feedbackList: GuessFeedback[],
  streak: number
): string {
  const feedbackLines = feedbackList.map(feedback => {
    const played = feedback.playedInGame ? '🟢' : '🔴';
    const team = feedback.sameTeam ? '🟢' : '🔴';
    const role = feedback.sameRole ? '🟢' : '🔴';
    const motm = feedback.isMVP ? '🏆' : '🔴';
    return played + team + role + motm;
  });

  const gridPattern = feedbackLines.join('\n');
  const streakText = streak > 1 ? '🔥' + streak : '';

  return '🏏 Bowldem #' + puzzleNumber + '\n\n' + gridPattern + (streakText ? '\n\n' + streakText : '') + '\n\nPlay on Reddit!';
}
