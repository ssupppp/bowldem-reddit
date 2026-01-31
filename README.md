# Bowldem - Daily Cricket Puzzle for Reddit

A Wordle-style daily cricket puzzle game built on Reddit's Devvit Web platform.

**Guess the Man of the Match from T20 World Cup games in 5 tries!**

## How to Play
1. View the match scorecard (venue, scores)
2. Guess which player was Man of the Match
3. Get feedback on each guess (country, role, team, etc.)
4. Share your results with the Reddit community

## Tech Stack
- [Devvit Web](https://developers.reddit.com/) - Reddit's developer platform
- [React](https://react.dev/) - UI framework
- [Express](https://expressjs.com/) - Backend API
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## Development

### Prerequisites
- Node.js 22+
- Reddit account connected to [Reddit Developers](https://developers.reddit.com)

### Commands
```bash
npm install              # Install dependencies
npm run build            # Build client + server
npx devvit upload        # Upload to Reddit
npx devvit playtest bowldem_dev  # Start playtest
```

### Project Structure
```
src/
├── client/          # React frontend
├── server/          # Express backend
└── shared/          # Game logic & data
```

## Links
- **Play:** https://www.reddit.com/r/bowldem_dev/?playtest=bowldem
- **Original Web Version:** https://bowldem.com
- **Progress:** See [PROGRESS.md](./PROGRESS.md)

## Hackathon
Built for the [Reddit Games & Puzzles Hackathon](https://redditfunandgames.devpost.com/) (Deadline: Feb 13, 2026)

## MCP Integration
For Claude Code users, add the Devvit MCP:
```
claude mcp add devvit -- npx -y @devvit/mcp
```

## License
MIT
