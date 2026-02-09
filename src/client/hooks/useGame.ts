import { useState, useEffect, useCallback } from 'react';
import type {
  InitResponse,
  GuessResponse,
  GameState,
  UserStats,
  GuessFeedback,
  Player,
  MatchSummary
} from '../../shared/types/game';
import { MAX_GUESSES } from '../../shared/gameLogic';

interface GameHookState {
  loading: boolean;
  error: string | null;
  username: string;
  puzzleNumber: number;
  puzzleDate: string;
  puzzle: {
    id: number;
    venue: string;
    team1Name: string;
    team2Name: string;
    team1Score: string;
    team2Score: string;
  } | null;
  gameState: GameState | null;
  stats: UserStats | null;
  feedbackList: GuessFeedback[];
  players: Player[];
  isSubmitting: boolean;
  matchSummary: MatchSummary | null;
}

export function useGame() {
  const [state, setState] = useState<GameHookState>({
    loading: true,
    error: null,
    username: '',
    puzzleNumber: 0,
    puzzleDate: '',
    puzzle: null,
    gameState: null,
    stats: null,
    feedbackList: [],
    players: [],
    isSubmitting: false,
    matchSummary: null
  });

  // Initialize game
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch init data and players in parallel
        const [initRes, playersRes] = await Promise.all([
          fetch('/api/init'),
          fetch('/api/players')
        ]);

        if (!initRes.ok) throw new Error(`Init failed: ${initRes.status}`);
        if (!playersRes.ok) throw new Error(`Players failed: ${playersRes.status}`);

        const initData: InitResponse = await initRes.json();
        const playersData = await playersRes.json();

        setState(prev => ({
          ...prev,
          loading: false,
          username: initData.username,
          puzzleNumber: initData.puzzleNumber,
          puzzleDate: initData.puzzleDate,
          puzzle: initData.puzzle,
          gameState: initData.gameState,
          stats: initData.stats,
          players: playersData.players || [],
          feedbackList: initData.feedbackHistory || [], // Restore from server
          matchSummary: initData.matchSummary || null
        }));
      } catch (err) {
        console.error('Init error:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to initialize'
        }));
      }
    };

    void init();
  }, []);

  // Submit a guess
  const submitGuess = useCallback(async (playerKey: string): Promise<GuessFeedback | null> => {
    if (state.isSubmitting) return null;

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerKey })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Guess failed');
      }

      const data: GuessResponse = await res.json();

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        gameState: data.gameState,
        stats: data.stats,
        feedbackList: [...prev.feedbackList, data.feedback],
        matchSummary: data.matchSummary || prev.matchSummary
      }));

      return data.feedback;
    } catch (err) {
      console.error('Guess error:', err);
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: err instanceof Error ? err.message : 'Guess failed'
      }));
      return null;
    }
  }, [state.isSubmitting]);

  // Computed values
  const gameStatus = state.gameState?.gameStatus || 'not_started';
  const guessesUsed = state.feedbackList.length;
  const guessesRemaining = MAX_GUESSES - guessesUsed;
  const isGameOver = gameStatus === 'won' || gameStatus === 'lost';
  const usedPlayerIds = new Set(state.gameState?.guesses || []);

  return {
    ...state,
    gameStatus,
    guessesUsed,
    guessesRemaining,
    maxGuesses: MAX_GUESSES,
    isGameOver,
    usedPlayerIds,
    submitGuess
  };
}
