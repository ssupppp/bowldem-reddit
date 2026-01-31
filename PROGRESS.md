# Bowldem Reddit - Progress & Debug Log

## Current Status
**Version:** v0.0.6 (uploaded), playtest v0.0.3.14
**Last Updated:** Jan 31, 2026

---

## BLOCKING BUG: submitCustomPost ValidationErrors

### Error Message
```
Error: post submission failed: rpc error: code = Unknown desc = ValidationErrors({Errors:[ValidationError({Reason:0xc1039de7f0 Field:0xc1039de800 ShortName:0xc1039de810 Code:<nil>})]})
```

### Secondary Error (SDK internal)
```
HTTP request to URL: https://oauth.reddit.com/r//about/moderators (empty subreddit)
```

### Current Code
```typescript
// src/server/core/post.ts
import { reddit } from '@devvit/web/server';

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: 'Bowldem Daily Puzzle',
  });
};
```

### What We Tried (ALL FAILED)
1. Pass `subredditName` explicitly - same error
2. Let it default from context - same error
3. Add `textFallback` option - same error
4. Simplify title (remove special chars) - same error
5. Match official template exactly - same error
6. Add permissions to devvit.json - schema validation error

### Confirmed Working
- `context.subredditName` = "bowldem_dev" (correct)
- Menu action triggers correctly
- Server endpoint receives request
- Build and upload successful
- Official template has identical code structure

### Next Steps
1. Use Devvit MCP for debugging
2. Post question to r/Devvit community
3. Check developers.reddit.com/apps/bowldem for warnings
4. Try production deploy (maybe playtest has limitations)

---

## What's Complete

### Game Logic (src/shared/gameLogic.ts)
- EPOCH_DATE = '2026-01-15'
- MAX_GUESSES = 5
- getPuzzleNumber(), getPuzzleForDate(), generateFeedback()
- updateStats(), generateShareText()

### Server Endpoints
| Endpoint | Method | Status |
|----------|--------|--------|
| /api/init | GET | Ready |
| /api/guess | POST | Ready |
| /api/leaderboard | GET | Ready |
| /api/players | GET | Ready |
| /internal/menu/post-create | POST | BROKEN |

### React UI (src/client/game/App.tsx)
- Scorecard display
- Player autocomplete
- Feedback display (country, role, team matching)
- Win/lose states
- Stats modal
- Share button

---

## r/Devvit Post (ready to submit)

**Title:** submitCustomPost ValidationErrors in Devvit Web app

**Body:**
Building a Devvit Web app for the hackathon. `reddit.submitCustomPost({ title: 'Test' })` fails with:
```
ValidationErrors({Errors:[ValidationError({Reason:0xc1039de7f0 Field:0xc1039de800...})]})
```
Using the standard template structure. `context.subredditName` is set correctly. Tried with/without `subredditName` and `textFallback` options - same error.

The error shows memory addresses instead of field names, so I can't tell what's failing validation.

What am I missing? Any required fields or permissions for Devvit Web post creation?

---

## Session Log

### Jan 31, 2026
- Debugged submitCustomPost error extensively
- Confirmed code matches official Reddit template
- Added Devvit MCP for debugging
- Pushed code to GitHub repository
- Created CLAUDE.md and PROGRESS.md
