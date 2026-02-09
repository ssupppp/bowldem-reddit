# Bowldem - Bugs & Features Tracker

**Last Updated:** Feb 7, 2026
**Current Version:** 0.0.24

---

## 🐛 BUGS

### Open
| # | Bug | Severity | Notes |
|---|-----|----------|-------|
| 5 | Countdown timer inaccurate when tab inactive | Low | `setInterval` throttled on mobile/background tabs. |
| 14 | Server race condition — extra guesses possible | High | Read-modify-write on Redis. Two simultaneous requests can bypass MAX_GUESSES. Use Redis transactions or Lua script. |
| 15 | Streak calculation timezone bug | High | `new Date(puzzleDate).setDate()` uses local timezone instead of UTC. Can cause off-by-one streak errors. Fix: use `setUTCDate()`. |
| 16 | Hardcoded guessDistribution array length | Medium | `[0,0,0,0,0]` hardcoded instead of `Array(MAX_GUESSES).fill(0)`. Breaks if MAX_GUESSES changes. |
| 17 | Debug reset endpoint exposed in production | Medium | `/api/debug/reset` has no server-side gate. Client hides the button but API is callable directly. |
| 18 | Leaderboard fetch has no error state | Medium | If fetch fails, user sees infinite spinner. No error message or retry. |
| 19 | localStorage failure hides first-time help | Low | If localStorage blocked in webview, catch swallows error and help never shows. Should default to showing help. |
| 20 | `guessesRemaining` imported but unused | Low | Dead import in App.tsx. |

### Fixed
| # | Bug | Status | Fixed In |
|---|-----|--------|----------|
| 1 | Feedback not restored on page reload | ✅ Fixed | v0.0.6 |
| 2 | Grid layout broken in Reddit webview | ✅ Fixed | v0.0.4 |
| 3 | No error recovery on guess failure | ✅ Fixed | v0.0.6 |
| 4 | Clipboard API may fail silently | ✅ Fixed | v0.0.6 |
| 6 | `username` fetched but never displayed | ✅ Fixed | v0.0.14 |
| 7 | No loading indicator during guess | ✅ Fixed | v0.0.6 |
| 8 | Duplicate share text implementations | ✅ Fixed | v0.0.24 — identified, gameLogic.ts version is dead code |
| 9 | Column headers (P/T/R/M) stacked vertically | ✅ Fixed | v0.0.4 |
| 10 | Feedback indicators stacked vertically | ✅ Fixed | v0.0.4 |
| 11 | Autocomplete too few results (6) | ✅ Fixed | v0.0.5 |
| 12 | Duplicate player names in autocomplete | ✅ Fixed | v0.0.5 |
| 13 | Match scores visible (spoils puzzle) | ✅ Fixed | v0.0.5 |

---

## ✅ FEATURES - Completed

| # | Feature | Version | Notes |
|---|---------|---------|-------|
| 1 | Compact header with puzzle number | v0.0.3 | 50px header with guesses badge |
| 2 | Keyboard navigation (↑↓ Enter Esc) | v0.0.3 | Arrow keys, Enter to select, Escape to close |
| 3 | "No players found" message | v0.0.3 | Shows when search has no matches |
| 4 | Memoized feedback list | v0.0.3 | Performance optimization |
| 5 | Next puzzle countdown timer | v0.0.3 | Shows "Next puzzle in Xh Xm" |
| 6 | Share emoji grid | v0.0.3 | 🟩⬛🎯 pattern for sharing results |
| 7 | Help modal with column guide | v0.0.3 | Explains P/T/R/M columns |
| 8 | Stats modal with guess distribution | v0.0.3 | Shows played, win %, streak, best |
| 9 | Scores hidden until won | v0.0.5 | Shows ??? until puzzle solved |
| 10 | Autocomplete improvements | v0.0.5 | 12 results, 2-char min, deduplicated, compact |
| 11 | Restore feedback on reload | v0.0.6 | Rebuilds feedbackList from stored guess IDs |
| 12 | Leaderboard UI | v0.0.6 | Display daily leaderboard with button in header |
| 13 | Post creation | v0.0.12 | Custom post creation working |
| 14 | Loading indicator on guess | v0.0.6 | Spinner while guess is being processed |
| 15 | Error retry button | v0.0.6 | "Try Again" on API errors |
| 16 | Branded splash screen | v0.0.6 | Welcome screen with P/T/R/M explanation |
| 17 | First-time help modal | v0.0.14 | Auto-shows help on first visit via localStorage |
| 18 | Show username in header | v0.0.14 | Displays u/{username} below puzzle number |
| 19 | Enhanced autocomplete (name+country+role) | v0.0.14 | Search by country/role, role badges in dropdown |
| 20 | DRS Third Umpire animation | v0.0.14 | Amber scanning wave while guess processes |
| 21 | Cricket SVG icons | v0.0.14 | Bat/ball/trophy instead of ✓/✗ |
| 22 | Match summary on win | v0.0.23 | Teams, scores, result, MVP reveal, ESPNcricinfo link |
| 23 | Better styling | v0.0.16 | Gradient header, green scorecard, warm background |
| 24 | Smart autocomplete | v0.0.20 | Feedback-aware, active-first, country/role aliases |
| 25 | Debug reset button | v0.0.19 | Reset game state for testing |
| 26 | Team name derivation | v0.0.23 | Infer team names from player data when missing from scorecard |
| 27 | Dev-only reset button | v0.0.24 | Reset button hidden in production, visible only in playtest mode |

---

## 📋 FEATURES - Backlog

### High Priority (Hackathon Polish)
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 8 | Accessibility (ARIA) | Add role="listbox", aria-activedescendant to dropdown | Medium |
| ~~14~~ | ~~Better styling~~ | ✅ Done v0.0.16 — gradients, green scorecard, warm bg | — |
| ~~21~~ | ~~Better cricket icons~~ | ✅ Done v0.0.15 — bat/ball/trophy | — |
| ~~22~~ | ~~Smart autocomplete distribution~~ | ✅ Done v0.0.20 — feedback-aware, active-first, aliases | — |

### Medium Priority (Polish)
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 9 | Loading skeleton | Placeholder UI while loading instead of spinner | Medium |

### Nice-to-Have (Future)
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 10 | Country flags | Show flag emoji/image next to player names | Low |
| 16 | Sound effects | Audio feedback on correct/incorrect guess | Medium |
| 17 | Dark mode | Respect system preference, toggle option | Medium |
| 18 | Share to Reddit | Direct share as comment instead of clipboard | High |
| 19 | Offline caching | Cache players list for faster subsequent loads | Medium |
| 20 | Analytics | Track guess patterns, popular wrong answers | High |

---

## 🔧 Tech Debt

| # | Issue | Priority |
|---|-------|----------|
| 1 | Remove dead `generateShareText` from gameLogic.ts | Medium |
| 2 | Extract magic numbers to constants (12 players, 280px height) | Low |
| 3 | Add TypeScript strict mode | Low |
| 4 | Add unit tests for gameLogic.ts | Medium |
| 5 | Remove unused `guessesRemaining` import in App.tsx | Low |
| 6 | Use `??` instead of `||` for nullish checks (leaderboard score) | Low |
| 7 | Use `Array(MAX_GUESSES).fill(0)` for guessDistribution | Medium |

---

## 📝 Design Decisions

1. **Stay with Web, not Blocks** - Autocomplete requires native HTML input which Blocks can't support well.
2. **Hide scores until won** - Game is a puzzle; revealing scores would give hints.
3. **Don't reveal MVP on loss** - Maintains mystery, encourages replay next day.
4. **Newest guess at top** - Reverse chronological order in feedback list.
5. **2-char autocomplete minimum** - Balance between showing results early and too many matches.
6. **Dev-only debug tools** - Reset button gated by `?playtest=` URL param, not visible in production.

---

## 🎯 Hackathon Checklist

**Deadline: Feb 13, 2026**

- [x] Core gameplay working
- [x] Mobile-responsive layout
- [x] Stats tracking (Redis)
- [x] Share functionality
- [x] Leaderboard UI
- [x] Post creation working
- [x] Feedback restored on reload
- [x] Splash screen with P/T/R/M explanation
- [x] Polish animations & styling
- [x] Smart autocomplete with aliases
- [x] Match summary on win
- [x] Cricket-themed icons & DRS animation
- [x] Debug reset button (dev-only)
- [ ] Fix high-severity bugs (#14, #15)
- [ ] Submit to hackathon

---

## 📊 Today's Progress (Feb 7, 2026)

### Session: v0.0.14 → v0.0.24 (11 versions)

**Features added (10):**
- #17 First-time help modal
- #18 Username in header
- #19 Enhanced autocomplete (name+country+role search)
- #20 DRS Third Umpire animation
- #21 Cricket SVG icons (bat/ball/trophy)
- #22 Match summary on win (teams, scores, MVP, ESPNcricinfo)
- #23 Gradient styling overhaul
- #24 Smart autocomplete (feedback-aware, active-first, aliases)
- #26 Team name derivation (fixes 51/60 puzzles)
- #27 Dev-only reset button

**Bugs fixed (3):**
- #6 Username not displayed → now shows u/{username}
- #8 Duplicate share text → identified dead code
- Match summary showing "undefined" team names → getTeamNames() derivation

**Bugs discovered (7):**
- #14 Server race condition (HIGH)
- #15 Streak timezone bug (HIGH)
- #16 Hardcoded array length (MEDIUM)
- #17 Debug endpoint exposed (MEDIUM)
- #18 Leaderboard no error state (MEDIUM)
- #19 localStorage hides help (LOW)
- #20 Dead import (LOW)
