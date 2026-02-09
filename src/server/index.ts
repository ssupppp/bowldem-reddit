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
  Player,
  MatchSummary
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

// Build set of active player IDs (appeared in any T20 WC match)
const activePlayerIds = new Set<string>();
PUZZLES.forEach((p: any) => {
  p.matchData.playersInMatch.forEach((id: string) => activePlayerIds.add(id));
});

// Derive team names from player data when scorecard is missing them
function getTeamNames(puzzle: any): { team1Name: string; team2Name: string } {
  const sc = puzzle.matchData.scorecard;
  if (sc.team1Name && sc.team2Name) return { team1Name: sc.team1Name, team2Name: sc.team2Name };

  // Infer from players in match — find the two distinct countries
  const teams = new Set<string>();
  for (const pid of puzzle.matchData.playersInMatch) {
    const p = playersLookup[pid];
    if (p) teams.add(p.country);
    if (teams.size >= 2) break;
  }
  const teamArr = [...teams];
  // targetPlayerTeam is team1 by convention in puzzles where "Team 1" won/lost
  const mvpTeam = puzzle.matchData.targetPlayerTeam;
  const team1 = mvpTeam && teamArr.includes(mvpTeam) ? mvpTeam : (teamArr[0] || 'Team 1');
  const team2 = teamArr.find(t => t !== team1) || 'Team 2';
  return { team1Name: team1, team2Name: team2 };
}

// Build match summary for game-over reveal
function buildMatchSummary(puzzle: any): MatchSummary {
  const mvp = playersLookup[puzzle.targetPlayer];
  const sc = puzzle.matchData.scorecard;
  const { team1Name, team2Name } = getTeamNames(puzzle);
  // Replace "Team 1"/"Team 2" in result with actual team names
  let result = sc.result as string;
  result = result.replace('Team 1', team1Name).replace('Team 2', team2Name);
  return {
    result,
    team1Name,
    team2Name,
    team1Score: sc.team1Score,
    team2Score: sc.team2Score,
    mvpName: mvp?.fullName ?? puzzle.targetPlayer,
    mvpCountry: mvp?.country ?? puzzle.matchData.targetPlayerTeam,
    mvpRole: mvp?.role ?? puzzle.matchData.targetPlayerRole,
    cricinfoUrl: puzzle.cricinfoUrl,
  };
}

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
      let feedbackHistory: any[] = [];
      if (gameStateJson) {
        gameState = JSON.parse(gameStateJson);
        // Rebuild feedback history from saved guesses
        if (gameState && gameState.guesses && gameState.guesses.length > 0) {
          feedbackHistory = gameState.guesses
            .map(playerKey => generateFeedback(playerKey, puzzle, playersLookup))
            .filter(fb => fb !== null);
        }
      }

      let stats: UserStats = createDefaultStats();
      if (statsJson) {
        stats = { ...stats, ...JSON.parse(statsJson) };
      }

      // Include match summary if game is over
      const isWon = gameState?.gameStatus === 'won';

      const { team1Name, team2Name } = getTeamNames(puzzle);

      res.json({
        type: 'init',
        postId,
        username,
        puzzleNumber,
        puzzleDate,
        puzzle: {
          id: puzzle.id,
          venue: puzzle.matchData.scorecard.venue,
          team1Name,
          team2Name,
          team1Score: puzzle.matchData.scorecard.team1Score,
          team2Score: puzzle.matchData.scorecard.team2Score,
        },
        gameState,
        stats,
        feedbackHistory,
        ...(isWon ? { matchSummary: buildMatchSummary(puzzle) } : {})
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
        stats,
        ...(isWin ? { matchSummary: buildMatchSummary(puzzle) } : {})
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

// Debug: reset game state for current user (dev only)
router.post('/api/debug/reset', async (_req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername() ?? 'anonymous';
    const puzzleDate = getTodayUTC();
    const gameStateKey = getGameStateKey(username, puzzleDate);
    await redis.del(gameStateKey);
    res.json({ status: 'ok', message: `Reset game for ${username} on ${puzzleDate}` });
  } catch (error) {
    res.status(500).json({ status: 'error', message: String(error) });
  }
});

// Get all players (for autocomplete on client)
router.get('/api/players', async (_req, res): Promise<void> => {
  const players = (allPlayersData as { players: Player[] }).players.map(p => ({
    ...p,
    active: activePlayerIds.has(p.id)
  }));
  res.json({ type: 'players', players });
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
