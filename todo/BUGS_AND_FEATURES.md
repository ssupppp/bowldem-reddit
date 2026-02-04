# Bowldem - Bugs & Features Tracker

**Last Updated:** Feb 4, 2026
**Current Version:** 0.0.5

---

## 🐛 BUGS

### Critical
| # | Bug | Status | Notes |
|---|-----|--------|-------|
| 1 | Feedback not restored on page reload | 🔴 Open | `useGame.ts:72` sets `feedbackList: []` even when `gameState` has previous guesses. User loses visual history on refresh. |
| 2 | Grid layout broken in Reddit webview | ✅ Fixed (v0.0.4) | Tailwind arbitrary grid syntax didn't work. Switched to flexbox. |

### Medium
| # | Bug | Status | Notes |
|---|-----|--------|-------|
| 3 | No error recovery on guess failure | 🔴 Open | If API fails, error is set but no retry option. |
| 4 | Clipboard API may fail silently | 🔴 Open | No handling for permission denial or unsupported browsers. |
| 5 | Countdown timer inaccurate when tab inactive | 🟡 Low | `setInterval` throttled on mobile/background tabs. |
| 6 | `username` fetched but never displayed | 🟡 Low | Could show "Playing as u/username" |
| 7 | No loading indicator during guess | 🔴 Open | Input disabled but no spinner/visual feedback. |
| 8 | Duplicate share text implementations | 🟡 Tech Debt | `App.tsx` and `gameLogic.ts` have different emoji patterns. |

### Fixed
| # | Bug | Status | Fixed In |
|---|-----|--------|----------|
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

---

## 📋 FEATURES - Backlog

### High Priority (Hackathon Must-Have)
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 1 | Restore feedback on reload | Rebuild `feedbackList` from stored guess IDs when page reloads | Medium |
| 2 | Leaderboard UI | Display `/api/leaderboard` data. Add leaderboard button to header. | Medium |
| 3 | Post creation fix | `createPost()` has Devvit SDK bug - context lost. See DEVVIT_BUGS.md | High |
| 4 | Loading indicator on guess | Show spinner/animation while guess is being processed | Low |

### Medium Priority (Polish)
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 5 | Show username | Display "Playing as u/username" somewhere | Low |
| 6 | Error retry button | Add "Try Again" button when API errors occur | Low |
| 7 | First-time help modal | Auto-show help on first visit (localStorage check) | Low |
| 8 | Accessibility (ARIA) | Add role="listbox", aria-activedescendant to dropdown | Medium |
| 9 | Loading skeleton | Placeholder UI while loading instead of spinner | Medium |

### Nice-to-Have (Future)
| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| 10 | 🏳️ Country flags | Show flag emoji/image next to player names | Low |
| 11 | 🎬 Third umpire animation | Processing animation when submitting guess (like DRS review) | High |
| 12 | 🏏 Cricket icons | Use cricket ball/stumps instead of ✓/✗ | Medium |
| 13 | 🖼️ Splash page | Welcome screen with "Play" button before game | Medium |
| 14 | 🎨 Better styling | Color gradients, themed backgrounds, not all white | Medium |
| 15 | 📊 Full match summary | Show complete match details after winning | Low |
| 16 | 🎵 Sound effects | Audio feedback on correct/incorrect guess | Medium |
| 17 | 🌙 Dark mode | Respect system preference, toggle option | Medium |
| 18 | 📱 Share to Reddit | Direct share as comment instead of clipboard | High |
| 19 | 🔄 Offline caching | Cache players list for faster subsequent loads | Medium |
| 20 | 📈 Analytics | Track guess patterns, popular wrong answers | High |

---

## 🔧 Tech Debt

| # | Issue | Priority |
|---|-------|----------|
| 1 | Consolidate duplicate share text logic | Medium |
| 2 | Extract magic numbers to constants (12 players, 280px height) | Low |
| 3 | Add TypeScript strict mode | Low |
| 4 | Add unit tests for gameLogic.ts | Medium |
| 5 | Remove unused `inputRef` in App.tsx | Low |

---

## 📝 Design Decisions

1. **Stay with Web, not Blocks** - Autocomplete requires native HTML input which Blocks can't support well.
2. **Hide scores until won** - Game is a puzzle; revealing scores would give hints.
3. **Don't reveal MVP on loss** - Maintains mystery, encourages replay next day.
4. **Newest guess at top** - Reverse chronological order in feedback list.
5. **2-char autocomplete minimum** - Balance between showing results early and too many matches.

---

## 🎯 Hackathon Checklist

**Deadline: Feb 13, 2026**

- [x] Core gameplay working
- [x] Mobile-responsive layout
- [x] Stats tracking (Redis)
- [x] Share functionality
- [ ] Leaderboard UI
- [ ] Post creation working
- [ ] Feedback restored on reload
- [ ] Polish animations
- [ ] Submit to hackathon
