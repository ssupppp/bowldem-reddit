# Bowldem - Daily Cricket Puzzle

**Guess the Man of the Match in 5 tries!**

Bowldem brings the thrill of T20 World Cup cricket to Reddit. Every day, cricket fans are challenged to identify the Man of the Match from a classic T20 World Cup game using only the venue and scorecard as clues.

## For Cricket Enthusiasts & Trivia Lovers

Remember that nail-biting finish at the MCG? That stunning spell at Eden Gardens? Bowldem is a daily trip down memory lane for cricket fans who lived through these iconic moments. Each puzzle is a chance to relive the glory days of T20 World Cup cricket.

**Perfect for:**
- Cricket fans who remember the legends
- Trivia enthusiasts who love a daily challenge
- Reddit communities passionate about the sport
- Anyone who wants a quick, satisfying puzzle break

## How to Play

1. **See the Clues** - View the match venue and scorecard (team names hidden)
2. **Make Your Guess** - Search for a player you think was Man of the Match
3. **Get Feedback** - Each guess reveals:
   - **P** - Did this player play in the match?
   - **T** - Same team as the MVP?
   - **R** - Same role (Batsman/Bowler/All-rounder/Wicketkeeper)?
   - **M** - Is this the Man of the Match?
4. **Share Your Result** - Post your emoji grid to the community!

```
🏏 Bowldem #22 3/5

🟩⬛⬛⬛
🟩🟩⬛⬛
🟩🟩🟩🎯

https://reddit.com/r/playbowldem
```

## Features

- **Daily Puzzles** - New puzzle every day at midnight UTC
- **60 Classic Matches** - Curated T20 World Cup moments
- **Leaderboard** - Compete with fellow Redditors
- **Stats Tracking** - Track your streaks and guess distribution
- **Mobile Optimized** - Play seamlessly on any device
- **Share Results** - One-tap sharing to Reddit comments

## Installation (For Moderators)

1. Visit the [Bowldem App Page](https://developers.reddit.com/apps/playbowldem)
2. Click "Install" and select your subreddit
3. Use the mod menu to create your first puzzle post

**Requirements:**
- Subreddit you moderate
- No additional configuration needed

## Playing on r/playbowldem

Join the official community at [r/playbowldem](https://www.reddit.com/r/playbowldem/) to:
- Play the daily puzzle
- Discuss cricket memories
- Share your results
- Compete on the leaderboard

## About the Game

Bowldem was created for cricket fans who cherish the memories of T20 World Cup cricket. The game taps into nostalgia - each puzzle is a moment frozen in time, waiting to be remembered.

Whether you watched Yuvraj Singh's six sixes live or discovered cricket through highlights, Bowldem connects generations of fans through shared trivia.

## Technical Details

Built on Reddit's [Devvit](https://developers.reddit.com/) platform using:
- React + Tailwind CSS (Frontend)
- Express.js (Backend)
- Redis (Stats & Leaderboard)
- TypeScript (Full stack)

## Development

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start local playtest
npx devvit playtest <your-subreddit>

# Upload to Reddit
npx devvit upload
```

## Links

- **Play Now:** [r/playbowldem](https://www.reddit.com/r/playbowldem/)
- **Source Code:** [GitHub](https://github.com/ssupppp/bowldem-reddit)
- **Original Web Version:** [bowldem.com](https://bowldem.com)

## Changelog

### v0.0.6 (Feb 2026)
- Leaderboard UI
- Feedback history restored on reload
- Improved share preview
- Mobile layout optimizations
- Loading indicators and error handling

### v0.0.5 (Jan 2026)
- Initial Reddit release
- 60 T20 World Cup puzzles
- Stats tracking
- Share functionality

## License

MIT

---

*Built for the Reddit Games & Puzzles Hackathon 2026*
