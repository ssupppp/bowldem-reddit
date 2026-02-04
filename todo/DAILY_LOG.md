# Bowldem Reddit - Daily Progress Log

---

## Jan 31, 2026

### Session 1 - Morning
- Audited both codebases (bowldem.com + bowldem-reddit)
- Researched Devvit platform architecture
- Created migration plan in `/todo/MIGRATION_PLAN.md`
- Set up task tracking (6 tasks created)

### Session 2 - Afternoon (Context Resumed)

**Key Discovery:** Devvit MCP was NOT connected. Only Supabase MCP was active.

**Actions Taken:**
1. Created bowldem-test project for minimal hello world testing
2. Tried `submitCustomPost()` - FAILED with ValidationErrors
3. Tried `submitPost()` - FAILED with same errors
4. Tried manual post creation - Post created but Devvit app didn't render
5. Researched GitHub issues - No matching bugs found
6. Searched for working examples - Limited documentation available
7. **Added Devvit MCP:** `claude mcp add devvit -- npx -y @devvit/mcp`

**Root Cause Identified:**
- Logs show SDK makes request to `https://oauth.reddit.com/r//about/moderators`
- Empty subreddit `/r//` = SDK is losing the subredditName internally
- Our code correctly passes subredditName, but SDK drops it

**Resources Found:**
- Hackathon page: https://redditfunandgames.devpost.com/resources
- Discord support: https://discord.com/invite/Cd43ExtEFS
- Template library: https://developers.reddit.com/docs/examples/template-library

### Current Status
- **Completion:** ~70%
- **Blocker:** `submitCustomPost` ValidationErrors (SDK bug suspected)
- **Days to Deadline:** 13

### What's Complete
| Component | Status |
|-----------|--------|
| Game Logic (`gameLogic.ts`) | Done |
| TypeScript Types | Done |
| Player Data (569 players) | Done |
| Puzzle Data (60 puzzles) | Done |
| Server Endpoints (4 API + 2 internal) | Done |
| React UI (App.tsx) | Done |
| useGame Hook | Done |
| Build/Deploy Pipeline | Done |
| Devvit Configuration | Done |
| Devvit MCP Setup | Done |

### What's Broken
- `reddit.submitCustomPost()` fails with obfuscated ValidationErrors:
  ```
  ValidationErrors({Errors:[ValidationError({Reason:0xc1039de7f0...})]})
  ```
- `reddit.submitPost()` also fails with same error
- Manual posts don't render the Devvit app
- Memory addresses shown instead of field names

### Debugging Attempted
1. Pass `subredditName` explicitly - FAILED
2. Let it default from context - FAILED
3. Add `textFallback` option - FAILED
4. Simplify title - FAILED
5. Match official template exactly - FAILED
6. Add permissions to devvit.json - FAILED
7. Try `submitPost()` instead of `submitCustomPost()` - FAILED
8. Try manual post creation - FAILED (app doesn't render)

### Next Actions (After Restart with Devvit MCP)
1. **Use Devvit MCP** to search documentation for post creation
2. **Ask MCP** about known issues with submitCustomPost
3. **Post to r/Devvit or Discord** with error details
4. **Try hybrid approach** - Blocks for post creation, Web for game UI

### Task List
- #1 [in_progress] Fix submitCustomPost ValidationErrors blocker
- #2 [pending] Test full game flow end-to-end (blocked by #1)
- #3 [pending] Polish UI for mobile Reddit app
- #4 [pending] Add countdown timer and daily reset
- #5 [pending] Implement leaderboard with Reddit usernames
- #6 [pending] Submit app for Reddit review and launch

### Notes
- Devvit MCP now configured: `claude mcp add devvit -- npx -y @devvit/mcp`
- **RESTART CLAUDE CODE** to connect Devvit MCP
- Playtest URL: https://www.reddit.com/r/bowldem_dev/?playtest=bowldem
- Test project: bowldem-test (in C:\Users\Vikas\bowldem-test)
- App version: v0.0.6

---

## Template for Future Entries

```markdown
## [Date]

### Session Summary
[Brief description of what was accomplished]

### Completed
- [ ] Task 1
- [ ] Task 2

### Blockers
- [Description of any blockers]

### Next Actions
1. [Priority action]
2. [Secondary action]

### Notes
[Any relevant observations]
```
