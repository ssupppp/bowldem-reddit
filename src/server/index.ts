import express from 'express';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import type {
  InitResponse,
  GuessResponse,
  LeaderboardResponse,
  LeaderboardEntry,
  GameState,
  UserStats,
  Player
} from '../shared/types/game';
import {
  getTodayUTC,
  getPuzzleForDate,
  generateFeedback,
  createDefaultGameState,
  createDefaultStats,
  updateStats,
  MAX_GUESSES
} from '../shared/gameLogic';

// Import data
import allPlayersData from '../shared/data/all_players.json';
import matchPuzzlesData from '../shared/data/match_puzzles_t20wc.json';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

// Build player lookup map
const playersLookup: Record<string, Player> = {};
(allPlayersData as { players: Player[] }).players.forEach(player => {
  playersLookup[player.id] = player;
});

const PUZZLES = (matchPuzzlesData as { puzzles: any[] }).puzzles || [];

// Redis key helpers
const getGameStateKey = (userId: string, puzzleDate: string) =>
  `bowldem:game:${userId}:${puzzleDate}`;
const getStatsKey = (userId: string) =>
  `bowldem:stats:${userId}`;
const getLeaderboardKey = (puzzleDate: string) =>
  `bowldem:leaderboard:${puzzleDate}`;

// Initialize game - get puzzle and user state
router.get<object, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const username = await reddit.getCurrentUsername() ?? 'anonymous';
      const puzzleDate = getTodayUTC();
      const { puzzle, puzzleNumber } = getPuzzleForDate(PUZZLES, puzzleDate);

      // Get or create game state
      const gameStateKey = getGameStateKey(username, puzzleDate);
      const statsKey = getStatsKey(username);

      const [gameStateJson, statsJson] = await Promise.all([
        redis.get(gameStateKey),
        redis.get(statsKey)
      ]);

      let gameState: GameState | null = null;
      if (gameStateJson) {
        gameState = JSON.parse(gameStateJson);
      }

      let stats: UserStats = createDefaultStats();
      if (statsJson) {
        stats = { ...stats, ...JSON.parse(statsJson) };
      }

      res.json({
        type: 'init',
        postId,
        username,
        puzzleNumber,
        puzzleDate,
        puzzle: {
          id: puzzle.id,
          venue: puzzle.matchData.scorecard.venue,
          team1Score: puzzle.matchData.scorecard.team1Score,
          team2Score: puzzle.matchData.scorecard.team2Score,
        },
        gameState,
        stats
      });
    } catch (error) {
      console.error(`API Init Error:`, error);
      res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Submit a guess
router.post<object, GuessResponse | { status: string; message: string }>(
  '/api/guess',
  async (req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({ status: 'error', message: 'postId is required' });
      return;
    }

    try {
      const { playerKey } = req.body as { playerKey: string };
      if (!playerKey) {
        res.status(400).json({ status: 'error', message: 'playerKey is required' });
        return;
      }

      const username = await reddit.getCurrentUsername() ?? 'anonymous';
      const puzzleDate = getTodayUTC();
      const { puzzle, puzzleNumber } = getPuzzleForDate(PUZZLES, puzzleDate);

      const gameStateKey = getGameStateKey(username, puzzleDate);
      const statsKey = getStatsKey(username);

      // Get current game state
      const gameStateJson = await redis.get(gameStateKey);
      let gameState: GameState;

      if (gameStateJson) {
        gameState = JSON.parse(gameStateJson);
        // Check if game already completed
        if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
          res.status(400).json({ status: 'error', message: 'Game already completed' });
          return;
        }
        // Check for duplicate guess
        if (gameState.guesses.includes(playerKey)) {
          res.status(400).json({ status: 'error', message: 'Player already guessed' });
          return;
        }
      } else {
        gameState = createDefaultGameState(puzzleNumber, puzzleDate);
      }

      // Generate feedback
      const feedback = generateFeedback(playerKey, puzzle, playersLookup);
      if (!feedback) {
        res.status(400).json({ status: 'error', message: 'Invalid player' });
        return;
      }

      // Update game state
      gameState.guesses.push(playerKey);

      const isWin = feedback.isMVP;
      const isLoss = !isWin && gameState.guesses.length >= MAX_GUESSES;

      if (isWin) {
        gameState.gameStatus = 'won';
      } else if (isLoss) {
        gameState.gameStatus = 'lost';
      }

      // Get and update stats if game ended
      let stats: UserStats = createDefaultStats();
      const statsJson = await redis.get(statsKey);
      if (statsJson) {
        stats = { ...stats, ...JSON.parse(statsJson) };
      }

      if (isWin || isLoss) {
        stats = updateStats(stats, isWin, gameState.guesses.length, puzzleDate);
        await redis.set(statsKey, JSON.stringify(stats));

        // Add to leaderboard if won
        if (isWin) {
          const leaderboardKey = getLeaderboardKey(puzzleDate);
          const score = gameState.guesses.length; // Lower is better
          await redis.zAdd(leaderboardKey, { member: username, score });
        }
      }

      // Save game state
      await redis.set(gameStateKey, JSON.stringify(gameState));

      res.json({
        type: 'guess',
        feedback,
        gameState,
        stats
      });
    } catch (error) {
      console.error(`API Guess Error:`, error);
      res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get leaderboard
router.get<object, LeaderboardResponse | { status: string; message: string }>(
  '/api/leaderboard',
  async (_req, res): Promise<void> => {
    try {
      const username = await reddit.getCurrentUsername() ?? 'anonymous';
      const puzzleDate = getTodayUTC();
      const { puzzleNumber } = getPuzzleForDate(PUZZLES, puzzleDate);
      const leaderboardKey = getLeaderboardKey(puzzleDate);

      // Get top 20 entries (sorted by score ascending - lower guesses is better)
      const entries = await redis.zRange(leaderboardKey, 0, 19, { by: 'score' });

      const leaderboardEntries: LeaderboardEntry[] = entries.map((entry: { member: string; score: number }, index: number) => ({
        rank: index + 1,
        username: entry.member,
        guessCount: entry.score,
        won: true, // Only winners are on leaderboard
        timestamp: Date.now() // We don't store timestamp, could enhance later
      }));

      // Get user's rank if they're on the leaderboard
      const userRank = await redis.zRank(leaderboardKey, username);
      let userEntry: LeaderboardEntry | undefined = undefined;
      if (userRank !== null && userRank !== undefined) {
        const userScore = await redis.zScore(leaderboardKey, username);
        userEntry = {
          rank: userRank + 1,
          username,
          guessCount: userScore || 0,
          won: true,
          timestamp: Date.now()
        };
      }

      res.json({
        type: 'leaderboard',
        puzzleNumber,
        entries: leaderboardEntries,
        userEntry
      });
    } catch (error) {
      console.error(`API Leaderboard Error:`, error);
      res.status(400).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Get all players (for autocomplete on client)
router.get('/api/players', async (_req, res): Promise<void> => {
  res.json({
    type: 'players',
    players: (allPlayersData as { players: Player[] }).players
  });
});

// Internal: Create post on app install
router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  // For now, just acknowledge the install without auto-creating a post
  // Users can create posts manually via the menu action
  res.json({
    status: 'success',
    message: 'Bowldem installed successfully! Use the menu to create a puzzle post.',
  });
});

// Internal: Menu action to create post
router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: post.url,
    });
  } catch (error) {
    console.error(`Error creating post:`, error);
    res.status(400).json({
      status: 'error',
      message: `Failed to create post: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

app.use(router);

const port = getServerPort();
const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
