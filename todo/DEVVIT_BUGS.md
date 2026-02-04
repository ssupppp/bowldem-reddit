# Devvit Platform Bugs & Issues

**Last Updated:** Jan 31, 2026

---

## Resume Instructions

After restarting Claude Code with Devvit MCP connected, say:

> "Continue debugging the submitCustomPost bug. Devvit MCP should now be connected. Check the todo folder for context."

Claude will:
1. Read these bug notes
2. Use Devvit MCP to search documentation
3. Look for known issues or alternative approaches

---

## BUG-001: submitCustomPost ValidationErrors (BLOCKING)

**Status:** Unresolved
**Severity:** Critical
**Affected:** Devvit Web apps using menu actions

### Description
`reddit.submitCustomPost()` fails with obfuscated ValidationErrors when called from a Devvit Web server endpoint.

### Error
```
ValidationErrors({Errors:[ValidationError({Reason:0xc00a2b6f70 Field:0xc00a2b6f80 ShortName:0xc00a2b6fa0 Code:<nil>})]})
```

### Secondary Error (SDK internal)
```
HTTP request to URL: https://oauth.reddit.com/r//about/moderators
```
Note: Empty subreddit name `/r//` indicates internal SDK issue.

### Reproduction
1. Create Devvit Web app with menu action
2. Menu action calls `reddit.submitCustomPost({ subredditName, title })`
3. Error occurs even with all parameters provided correctly

### What We Tried
- [x] Explicit `subredditName` parameter
- [x] Default from context
- [x] Added `textFallback` option
- [x] Simplified title (no special chars)
- [x] Added `permissions.reddit.enable: true`
- [x] Fresh playtest session
- [x] Multiple app versions (v0.0.1 - v0.0.5)

### Environment
- Devvit CLI: 0.12.10
- @devvit/web: 0.12.10
- Node.js: 22.22.0
- Platform: Windows

### Logs
Full logs show:
- `context.subredditName` is correctly set to `bowldem_test_dev`
- `submitCustomPost` receives correct parameters
- Internal SDK makes request to empty subreddit `/r//about/moderators`

### Workaround
Testing `submitPost()` (regular post) instead of `submitCustomPost()` (custom post).

---

## BUG-002: Playtest Status Code 36

**Status:** Related to BUG-001
**Severity:** High

### Description
Browser shows `status code from server: 36` error when menu action fails. Error is at gRPC level, provides no useful debugging info.

### Error
```
ClientError: /devvit.actor.reddit.ContextAction/OnAction INTERNAL: Received invalid status code from server: 36
```

---

## Notes

- Most errors in browser console are Reddit's internal errors (CUJ Tracker, lockdown.js) - unrelated to our app
- `ERR_BLOCKED_BY_CLIENT` errors are from ad blockers - safe to ignore
- Devvit logs via CLI (`devvit logs <subreddit> <app>`) provide more detail than browser console

---

## To Report to r/Devvit

**Title:** submitCustomPost ValidationErrors in Devvit Web app - internal SDK uses empty subreddit

**Body:**
Building a Devvit Web app for the hackathon. `reddit.submitCustomPost()` fails from server endpoint with:

```
ValidationErrors({Errors:[ValidationError({Reason:0xc00a2b6f70 Field:0xc00a2b6f80...})]})
```

Logs show our code correctly passes `subredditName: 'bowldem_test_dev'`, but SDK makes internal request to `https://oauth.reddit.com/r//about/moderators` (empty subreddit).

Using @devvit/web 0.12.10. Tried: explicit subredditName, textFallback, permissions config, fresh playtest. Same error.

Is there a different approach for post creation in Devvit Web apps?

---

## Research Findings (Jan 31, 2026)

### GitHub Investigation
- Checked [reddit/devvit](https://github.com/reddit/devvit) - No matching issues found
- Checked [reddit/devvit-examples](https://github.com/reddit/devvit-examples) - Only svelte/trpc examples, no post creation examples
- RedditAPIClient.ts shows `submitPost()` exists but `submitCustomPost()` appears to be Devvit Web specific

### Root Cause Hypothesis
The `@devvit/web/server` reddit client may not be correctly propagating the subreddit context when making internal API calls. The empty `/r//` path in error logs confirms the SDK is losing the subredditName somewhere in the call chain.

### Next Steps
1. Post bug report to r/Devvit
2. Try alternative: Use Blocks API for post creation, Devvit Web only for the game UI
3. Check if there's a version mismatch between @devvit/web and Devvit CLI
