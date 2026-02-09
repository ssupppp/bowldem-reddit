# Bowldem Reddit - Claude Context

## Project Overview
Bowldem is a Wordle-style daily cricket puzzle game being ported to Reddit's Devvit Web platform for the Reddit Games & Puzzles Hackathon.

**Deadline:** Feb 13, 2026
**Prize Target:** Best Daily Game ($15,000)
**Repository:** https://github.com/ssupppp/bowldem-reddit

## Tech Stack
- **Platform:** Reddit Devvit Web
- **Frontend:** React 19 + Tailwind CSS + Vite
- **Backend:** Express.js on Devvit server
- **Storage:** Redis (Devvit KV store)
- **Language:** TypeScript

## Project Structure
```
src/
├── client/              # React frontend
│   ├── game/App.tsx     # Main game UI
│   ├── hooks/useGame.ts # Game state hook
│   ├── game.html        # Game entry
│   └── splash.html      # Default/splash entry
├── server/
│   ├── index.ts         # Express API endpoints
│   └── core/post.ts     # Post creation logic
└── shared/
    ├── data/            # JSON data files
    │   ├── all_players.json (569 players)
    │   └── match_puzzles_t20wc.json (60 puzzles)
    ├── types/game.ts    # TypeScript types
    └── gameLogic.ts     # Core game logic
```

## Key Commands
```bash
npm run build              # Build client + server
npx devvit upload          # Upload to Reddit
npx devvit playtest playbowldem_dev  # Start playtest (app: playbowldem)
```

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/init | GET | Get puzzle & user state |
| /api/guess | POST | Submit a guess |
| /api/leaderboard | GET | Get daily leaderboard |
| /api/players | GET | Get all players for autocomplete |
| /internal/menu/post-create | POST | Create new puzzle post |

## Game Logic Constants
- `EPOCH_DATE = '2026-01-15'` - Puzzle numbering starts here
- `MAX_GUESSES = 5` - Guesses per puzzle
- Puzzles cycle through 60 T20 World Cup matches

## Redis Key Patterns
```
bowldem:game:{userId}:{puzzleDate}   # Game state
bowldem:stats:{userId}               # User statistics
bowldem:leaderboard:{puzzleDate}     # Daily leaderboard
```

## App Status (Feb 7, 2026)
- **Version:** 0.0.12
- **Status:** Published, awaiting Reddit review
- All core features working (post creation, feedback restore, leaderboard)

## CRITICAL: Playtest Workflow

**After `devvit upload`, you MUST restart playtest to see changes!**

Old playtest sessions cache the old version. This causes confusion where you upload new code but still see old behavior.

### Correct workflow:
```bash
# 1. Build and upload
npm run build && npx devvit upload

# 2. Kill existing playtest (find PID on port 5678)
netstat -ano | findstr ":5678"
powershell "Stop-Process -Id <PID> -Force"

# 3. Start fresh playtest
npx devvit playtest playbowldem_dev
```

### To test a fresh puzzle (bypass saved game state):
Temporarily edit `src/shared/gameLogic.ts`:
```ts
export function getTodayUTC(): string {
  return '2026-03-15'; // Hardcode future date
}
```
Then build, upload, restart playtest. **Remember to revert after testing!**

## Current Bugs & Features
**See:** `todo/BUGS_AND_FEATURES.md` for the full tracker.

### Open Bugs
- Countdown timer inaccurate when tab inactive (low priority)
- Duplicate share text implementations (tech debt)

### Priority Features (Hackathon)
- Show username ("Playing as u/username")
- First-time help modal (auto-show on first visit)
- Accessibility (ARIA labels)
- Country flags next to player names
- Third umpire animation for guess processing
- Polish animations & styling

## MCP Integration
Devvit MCP is configured:
```
claude mcp add devvit -- npx -y @devvit/mcp
```

## Important Links
- **Production Subreddit:** https://www.reddit.com/r/playbowldem/
- **Dev/Test Subreddit:** https://www.reddit.com/r/playbowldem_dev/
- **Playtest URL:** https://www.reddit.com/r/playbowldem_dev/?playtest=playbowldem
- **App Dashboard:** https://developers.reddit.com/apps/playbowldem
- **Original Web Version:** https://github.com/ssupppp/bowldem
- **Devvit Docs:** https://developers.reddit.com/docs

## Code Style
- Keep Reddit and web versions completely separate
- Use Devvit Web patterns (not Blocks)
- Express.js for server, React for client
- All game logic in shared/ for reusability
