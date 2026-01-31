// Bowldem Game Types

export interface Player {
  id: string;
  fullName: string;
  country: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
}

export interface Scorecard {
  venue: string;
  team1Name: string;
  team2Name: string;
  team1Score: string;
  team2Score: string;
  result: string;
}

export interface MatchData {
  scorecard: Scorecard;
  playersInMatch: string[];
  targetPlayerTeam: string;
  targetPlayerRole: string;
}

export interface Puzzle {
  id: number;
  targetPlayer: string;
  cricinfoUrl?: string;
  matchData: MatchData;
}

export interface GuessFeedback {
  playerName: string;
  country: string;
  role: string;
  playedInGame: boolean;
  sameTeam: boolean;
  sameRole: boolean;
  isMVP: boolean;
}

export interface GameState {
  puzzleNumber: number;
  puzzleDate: string;
  guesses: string[];
  gameStatus: 'not_started' | 'in_progress' | 'won' | 'lost';
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  lastWinDate: string | null;
}

// API Types
export interface InitResponse {
  type: 'init';
  postId: string;
  username: string;
  puzzleNumber: number;
  puzzleDate: string;
  puzzle: {
    id: number;
    venue: string;
    team1Score: string;
    team2Score: string;
  };
  gameState: GameState | null;
  stats: UserStats;
}

export interface GuessRequest {
  playerKey: string;
}

export interface GuessResponse {
  type: 'guess';
  feedback: GuessFeedback;
  gameState: GameState;
  stats: UserStats;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  guessCount: number;
  won: boolean;
  timestamp: number;
}

export interface LeaderboardResponse {
  type: 'leaderboard';
  puzzleNumber: number;
  entries: LeaderboardEntry[];
  userEntry?: LeaderboardEntry | undefined;
}
