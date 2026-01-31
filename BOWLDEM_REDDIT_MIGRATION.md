# Bowldem Reddit Migration - Progress & Documentation

## Overview
Migrating Bowldem (daily cricket puzzle game) from web (bowldem.com) to Reddit's Devvit platform for the Reddit Games Hackathon.

**Deadline:** Feb 13, 2026
**Prize Target:** Best Daily Game ($15,000)

---

## Project Structure

```
C:\Users\Vikas\Documents\Projects\bowldem-reddit\bowldem\
├── src/
│   ├── client/           # React frontend (runs in Reddit post)
│   │   ├── game/
│   │   │   └── App.tsx   # Main game component
│   │   ├── hooks/
│   │   │   └── useGame.ts # Game state hook
│   │   ├── splash/       # Loading splash screen
│   │   ├── game.html     # Game entry point
│   │   └── splash.html   # Splash entry point
│   ├── server/           # Express.js backend
│   │   ├── index.ts      # API endpoints
│   │   └── core/
│   │       └── post.ts   # Post creation helper
│   └── shared/           # Shared code
│       ├── data/
│       │   ├── all_players.json      # 569 players
│       │   └── match_puzzles_t20wc.json  # 60 puzzles
│       ├── types/
│       │   └── game.ts   # TypeScript types
│       └── gameLogic.ts  # Core game logic
├── assets/               # Images, icons
├── devvit.json          # Devvit configuration
└── package.json
```

---

## What's Been Implemented

### 1. Data Layer (Complete)
- **Players:** 569 cricketers with id, fullName, country, role
- **Puzzles:** 60 T20 World Cup match puzzles with:
  - Target player (MOTM)
  - Venue, scores
  - Players in match list

### 2. Game Logic (Complete)
File: `src/shared/gameLogic.ts`

- `EPOCH_DATE = '2026-01-15'` - First puzzle date
- `MAX_GUESSES = 5` - Attempts per puzzle
- `getPuzzleNumber(date)` - Calculate puzzle # from date
- `getPuzzleForDate(puzzles, date)` - Get today's puzzle
- `generateFeedback(playerKey, puzzle, playersLookup)` - Y/N feedback
- `updateStats(stats, won, guessCount, date)` - Update user stats
- `generateShareText(puzzleNumber, feedbackList, streak)` - Share emoji grid

### 3. Server API Endpoints (Complete)
File: `src/server/index.ts`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/init` | GET | Get puzzle, user state, stats |
| `/api/guess` | POST | Submit guess, get feedback |
| `/api/leaderboard` | GET | Get daily leaderboard |
| `/api/players` | GET | Get all players for autocomplete |
| `/internal/menu/post-create` | POST | Create game post (menu action) |
| `/internal/on-app-install` | POST | Handle app install |

### 4. Redis Keys Structure
```
bowldem:game:{userId}:{puzzleDate}  -> GameState JSON
bowldem:stats:{userId}              -> UserStats JSON
bowldem:leaderboard:{puzzleDate}    -> Sorted set (score = guess count)
```

### 5. React UI (Complete)
File: `src/client/game/App.tsx`

Features implemented:
- Scorecard display (venue, team scores)
- Player autocomplete (min 3 chars)
- Feedback display (Played/Team/Role/MVP badges)
- Game over states (win/lose)
- Stats modal
- Share button (copy to clipboard)
- Loading/error states

### 6. TypeScript Types (Complete)
File: `src/shared/types/game.ts`

```typescript
interface Player { id, fullName, country, role }
interface Puzzle { id, targetPlayer, matchData }
interface GuessFeedback { playerName, country, role, playedInGame, sameTeam, sameRole, isMVP }
interface GameState { puzzleNumber, puzzleDate, guesses, gameStatus }
interface UserStats { gamesPlayed, gamesWon, currentStreak, maxStreak, guessDistribution, lastWinDate }
```

---

## Devvit Configuration

File: `devvit.json`
```json
{
  "$schema": "https://developers.reddit.com/schema/config-file.v1.json",
  "name": "bowldem",
  "post": {
    "dir": "dist/client",
    "entrypoints": {
      "default": { "inline": true, "entry": "splash.html" },
      "game": { "entry": "game.html" }
    }
  },
  "server": {
    "dir": "dist/server",
    "entry": "index.cjs"
  },
  "media": { "dir": "assets" },
  "menu": {
    "items": [{
      "label": "Create Bowldem Puzzle",
      "description": "Create a daily cricket puzzle post",
      "location": "subreddit",
      "forUserType": "moderator",
      "endpoint": "/internal/menu/post-create"
    }]
  },
  "dev": { "subreddit": "bowldem_dev" }
}
```

---

## Commands

```bash
# Navigate to project
cd C:\Users\Vikas\Documents\Projects\bowldem-reddit\bowldem

# Install dependencies
npm install

# Build
npm run build

# Type check
npm run type-check

# Run dev server (playtest)
npm run dev

# Deploy to Reddit
npm run deploy

# Upload new version
devvit upload

# Login to Devvit
devvit login
```

---

## Current Status

### Working
- Project scaffolded and building
- All game logic ported
- Server endpoints defined
- React UI created
- App deployed to Reddit (v0.0.2)
- Playtest subreddit created: r/bowldem_dev

### Issue: Post Creation Failing
When clicking "Create Bowldem Puzzle" menu item:
```
Error: post submission failed: ValidationErrors
```

The `reddit.submitCustomPost()` call is failing with a validation error. The error details are obfuscated.

**Attempted fixes:**
1. Simplified title (removed emoji)
2. Used template's createPost function
3. Checked context.subredditName

**Possible causes to investigate:**
- Missing permissions in devvit.json
- Need to configure post preview/dimensions
- Subreddit settings issue
- API rate limiting

---

## GitHub Repository

**Original Bowldem (web):** https://github.com/ssupppp/bowldem/tree/feature/new-development

**Reddit version:** Local only (not yet pushed)
- Location: `C:\Users\Vikas\Documents\Projects\bowldem-reddit\bowldem`
- Should create new repo: `bowldem-reddit` or push to branch

---

## Key Differences: Web vs Reddit

| Aspect | Web (bowldem.com) | Reddit (Devvit) |
|--------|-------------------|-----------------|
| Backend | Supabase | Redis (built-in) |
| Auth | Device ID | Reddit User ID |
| Hosting | Vercel | Reddit (free) |
| State | localStorage | Redis |
| UI Framework | React + Vite | React + Vite |
| Leaderboard | Supabase table | Redis sorted set |

---

## Next Steps

### Immediate (Fix post creation)
1. Debug `submitCustomPost` validation error
2. Check Devvit docs for required post configuration
3. Try creating post via different method

### After post works
1. Test full game flow
2. Polish UI for mobile
3. Add countdown timer
4. Improve splash screen
5. Add leaderboard modal
6. Test on mobile Reddit app

### Before submission
1. Create r/bowldem subreddit
2. Polish app listing
3. Create demo post
4. Submit to hackathon

---

## Devvit Platform Notes

### Architecture
- **Client:** Standard web (React, Vue, etc.) in webview
- **Server:** Node.js serverless endpoints (Express, Koa)
- **Storage:** Redis only (no SQL)
- **Auth:** Automatic via Reddit

### Key APIs
```typescript
import { redis, reddit, context } from '@devvit/web/server';

// Redis
await redis.get(key);
await redis.set(key, value);
await redis.zAdd(key, { member, score });
await redis.zRange(key, start, end, { by: 'score' });

// Reddit
await reddit.getCurrentUsername();
await reddit.submitCustomPost({ title });

// Context
context.postId    // Current post
context.subredditName  // Current subreddit
```

### Limitations
- No external API calls from client (must go through server)
- 30s max request time
- 4MB max payload
- Redis only (no SQL)

---

## Files to Back Up

Critical files in `C:\Users\Vikas\Documents\Projects\bowldem-reddit\bowldem\`:

1. `src/shared/gameLogic.ts` - Core game logic
2. `src/shared/types/game.ts` - TypeScript types
3. `src/shared/data/all_players.json` - Player database
4. `src/shared/data/match_puzzles_t20wc.json` - Puzzles
5. `src/server/index.ts` - API endpoints
6. `src/client/game/App.tsx` - Main UI
7. `src/client/hooks/useGame.ts` - Game hook
8. `devvit.json` - Config
9. `package.json` - Dependencies

---

## Useful Links

- Devvit Docs: https://developers.reddit.com/docs
- Devvit Discord: https://discord.com/invite/R7yu2wh9Qz
- App Dashboard: https://developers.reddit.com/apps/bowldem
- Playtest URL: https://www.reddit.com/r/bowldem_dev/?playtest=bowldem
- Hackathon: Reddit Games & Puzzles Hackathon (Feb 13, 2026 deadline)

---

## Contact / Resources

- Original Bowldem: www.bowldem.com
- GitHub: https://github.com/ssupppp/bowldem
- Branch: feature/new-development

---

*Last updated: Jan 31, 2026*
