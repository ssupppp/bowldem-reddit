# Bowldem Reddit Migration Plan

**Last Updated:** Jan 31, 2026
**Deadline:** Feb 13, 2026 (13 days remaining)
**Prize Target:** Best Daily Game ($15,000)

---

## Executive Summary

| Aspect | Status |
|--------|--------|
| **Source** | bowldem.com (React/Vite + Supabase) |
| **Target** | Reddit Devvit Web App |
| **Blocker** | `submitCustomPost` ValidationErrors |
| **Completion** | ~70% (logic done, post creation broken) |

---

## Phase Status Overview

| Phase | Description | Status | Priority |
|-------|-------------|--------|----------|
| 1 | Foundation Setup | COMPLETE | - |
| 2 | Data Layer Migration | COMPLETE | - |
| 3 | Core Game Logic | COMPLETE | - |
| 4 | UI Components | COMPLETE | - |
| 5 | Devvit Integration | BLOCKED | P0 |
| 6 | Testing & Polish | NOT STARTED | P1 |
| 7 | Launch | NOT STARTED | P2 |

---

## PHASE 1: Foundation Setup - COMPLETE

- [x] Clone/create bowldem-reddit repository
- [x] Configure `devvit.json` with app metadata
- [x] Set up client/server/shared folder structure
- [x] Configure TypeScript, ESLint, Tailwind
- [x] Basic build working (`npm run build`)
- [x] App uploaded to Reddit (v0.0.6)

---

## PHASE 2: Data Layer Migration - COMPLETE

- [x] Port `all_players.json` (569 players, 22 countries)
- [x] Port `match_puzzles_t20wc.json` (60 puzzles)
- [x] Define Redis key schema:
  ```
  bowldem:game:{userId}:{puzzleDate}   → GameState JSON
  bowldem:stats:{userId}               → UserStats JSON
  bowldem:leaderboard:{puzzleDate}     → Sorted set
  ```
- [x] TypeScript types defined (`src/shared/types/game.ts`)

---

## PHASE 3: Core Game Logic - COMPLETE

- [x] `EPOCH_DATE = '2026-01-15'` configured
- [x] `MAX_GUESSES = 5` (changed from 4 on web)
- [x] `getPuzzleNumber()` - Epoch-based calculation
- [x] `getPuzzleForDate()` - Daily puzzle selection
- [x] `generateFeedback()` - 4-attribute feedback (P/T/R/M)
- [x] `updateStats()` - Win/loss tracking
- [x] `generateShareText()` - Emoji grid for sharing

**File:** `src/shared/gameLogic.ts`

---

## PHASE 4: UI Components - COMPLETE

- [x] ScoreCard (venue, team scores - teams hidden)
- [x] PlayerAutocomplete (min 3 chars, fuzzy search)
- [x] Feedback display (Played/Team/Role/MVP badges)
- [x] Win/Lose modals
- [x] Stats modal
- [x] Share button
- [x] Loading/error states

**File:** `src/client/game/App.tsx`

---

## PHASE 5: Devvit Integration - BLOCKED

### Completed
- [x] Server endpoints defined:
  - `/api/init` - Get puzzle & user state
  - `/api/guess` - Submit guess
  - `/api/leaderboard` - Get rankings
  - `/api/players` - Autocomplete data
- [x] Menu action configured in `devvit.json`
- [x] Redis integration code written

### BLOCKING BUG: submitCustomPost

**Error:**
```
ValidationErrors({Errors:[ValidationError({Reason:0xc1039de7f0 Field:0xc1039de800...})]})
```

**Attempts (all failed):**
1. Pass `subredditName` explicitly
2. Let it default from context
3. Add `textFallback` option
4. Simplify title (remove special chars)
5. Match official template exactly
6. Add permissions to devvit.json

**Root Cause (Suspected):**
SDK internally makes request to `https://oauth.reddit.com/r//about/moderators` with EMPTY subreddit.
Our code passes `subredditName` correctly, but SDK loses it in the call chain.

**Next debugging steps:**
- [x] Add Devvit MCP for debugging - DONE, restart required
- [ ] Use Devvit MCP to search docs for post creation patterns
- [ ] Post question to r/Devvit or Discord
- [ ] Try hybrid approach (Blocks for posts, Web for game UI)
- [ ] Check app dashboard for warnings
- [ ] Try production deploy (not just playtest)

---

## PHASE 6: Testing & Polish - NOT STARTED

- [ ] Test all 60 puzzles playable
- [ ] Verify feedback accuracy
- [ ] Test midnight rollover / timezone handling
- [ ] Test state persistence (app close/reopen)
- [ ] Test leaderboard rankings
- [ ] Mobile responsiveness
- [ ] Touch interactions
- [ ] Performance (<2s load time)
- [ ] Animation polish
- [ ] Countdown timer to next puzzle
- [ ] Archive mode (past puzzles)

---

## PHASE 7: Launch - NOT STARTED

- [ ] Create production subreddit (r/bowldem)
- [ ] Submit app for Reddit review
- [ ] Deploy production version
- [ ] Configure daily scheduler
- [ ] Seed initial puzzles
- [ ] Create demo/tutorial post
- [ ] Cross-post to cricket communities
- [ ] Submit to hackathon

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DEVVIT WEB APP                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   CLIENT    │    │   SERVER    │    │   SHARED    │ │
│  │  (React)    │◄──►│  (Express)  │◄──►│  (Logic)    │ │
│  │             │    │             │    │             │ │
│  │  App.tsx    │    │  index.ts   │    │ gameLogic   │ │
│  │  useGame.ts │    │  post.ts    │    │ types       │ │
│  │             │    │             │    │ data/*.json │ │
│  └─────────────┘    └──────┬──────┘    └─────────────┘ │
│         │                  │                            │
│         │           ┌──────▼──────┐                    │
│         │           │   REDIS     │                    │
│         │           │  (Devvit)   │                    │
│         │           └─────────────┘                    │
│         │                                               │
│  ┌──────▼──────────────────────────────────────────┐   │
│  │              REDDIT POST                         │   │
│  │  - Embedded in subreddit                        │   │
│  │  - User auth via Reddit                         │   │
│  │  - Share to Reddit directly                     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `devvit.json` | App configuration | Complete |
| `src/shared/gameLogic.ts` | Core game logic | Complete |
| `src/shared/types/game.ts` | TypeScript types | Complete |
| `src/shared/data/all_players.json` | 569 players | Complete |
| `src/shared/data/match_puzzles_t20wc.json` | 60 puzzles | Complete |
| `src/server/index.ts` | API endpoints | Complete |
| `src/server/core/post.ts` | Post creation | BROKEN |
| `src/client/game/App.tsx` | Main UI | Complete |
| `src/client/hooks/useGame.ts` | Game state hook | Complete |

---

## Commands

```bash
# Development
cd C:\Users\Vikas\bowldem-reddit
npm install
npm run build
npm run type-check

# Devvit
npx devvit upload          # Upload new version
npx devvit playtest bowldem_dev  # Start playtest

# Testing
# Visit: https://www.reddit.com/r/bowldem_dev/?playtest=bowldem
```

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| submitCustomPost stays broken | CRITICAL | Medium | Post to r/Devvit, try alternative methods |
| Deadline pressure (13 days) | HIGH | High | Focus on MVP, cut scope if needed |
| Reddit review delays | HIGH | Medium | Submit early, follow guidelines |
| Redis size limits | Medium | Low | Keep data minimal |
| Timezone issues | Medium | Medium | Use UTC everywhere |

---

## Scope Decisions

### Must Have (MVP)
- Daily puzzle (auto-rotating)
- 4-attribute feedback
- Win/lose states
- Share results
- Basic leaderboard

### Should Have
- Stats tracking
- Streak display
- Mobile optimization
- Countdown timer

### Nice to Have (Cut if needed)
- Archive mode
- Animations/polish
- Tutorial overlay
- Multiple puzzle types

---

## Links

- **Playtest:** https://www.reddit.com/r/bowldem_dev/?playtest=bowldem
- **App Dashboard:** https://developers.reddit.com/apps/bowldem
- **Original Web:** https://bowldem.com
- **GitHub (web):** https://github.com/ssupppp/bowldem
- **GitHub (reddit):** https://github.com/ssupppp/bowldem-reddit
- **Hackathon:** https://redditfunandgames.devpost.com/

---

*Next update: After resolving submitCustomPost blocker*
