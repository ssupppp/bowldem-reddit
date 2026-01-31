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
npx devvit playtest bowldem_dev  # Start playtest
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

## Current Blocking Issue
`reddit.submitCustomPost()` fails with obfuscated ValidationErrors. The error shows memory addresses instead of field names. See PROGRESS.md for full debug history.

## MCP Integration
Devvit MCP is available for debugging:
```
claude mcp add devvit -- npx -y @devvit/mcp
```

## Important Links
- **Playtest:** https://www.reddit.com/r/bowldem_dev/?playtest=bowldem
- **App Dashboard:** https://developers.reddit.com/apps/bowldem
- **Original Web Version:** https://github.com/ssupppp/bowldem
- **Devvit Docs:** https://developers.reddit.com/docs

## Code Style
- Keep Reddit and web versions completely separate
- Use Devvit Web patterns (not Blocks)
- Express.js for server, React for client
- All game logic in shared/ for reusability
