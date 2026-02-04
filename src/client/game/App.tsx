import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../hooks/useGame';
import type { Player, GuessFeedback } from '../../shared/types/game';

export const App = () => {
  const {
    loading,
    error,
    username,
    puzzleNumber,
    puzzle,
    feedbackList,
    players,
    stats,
    gameStatus,
    guessesUsed,
    guessesRemaining,
    maxGuesses,
    isGameOver,
    usedPlayerIds,
    isSubmitting,
    submitGuess
  } = useGame();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [countdown, setCountdown] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter players for autocomplete (deduplicated by name, more results)
  const filteredPlayers = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    const seenNames = new Set<string>();
    return players
      .filter(p => {
        if (!p.fullName.toLowerCase().includes(query)) return false;
        if (usedPlayerIds.has(p.id)) return false;
        // Deduplicate by name (case-insensitive)
        const nameLower = p.fullName.toLowerCase();
        if (seenNames.has(nameLower)) return false;
        seenNames.add(nameLower);
        return true;
      })
      .slice(0, 12);
  }, [searchQuery, players, usedPlayerIds]);

  // Reverse feedback list for newest-first display (memoized)
  const reversedFeedback = useMemo(() => [...feedbackList].reverse(), [feedbackList]);

  // Reset selected index when filtered players change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredPlayers]);

  // Countdown timer for next puzzle
  useEffect(() => {
    if (!isGameOver) return;

    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0); // Midnight UTC
      const diff = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isGameOver]);

  // Handle player selection
  const handleSelectPlayer = useCallback(async (player: Player) => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    await submitGuess(player.id);
  }, [submitGuess]);

  // Generate share emoji grid
  const generateShareText = useCallback(() => {
    const header = `🏏 Bowldem #${puzzleNumber} ${gameStatus === 'won' ? guessesUsed : 'X'}/${maxGuesses}`;
    const streak = stats?.currentStreak && stats.currentStreak > 1 ? `🔥 ${stats.currentStreak}` : '';

    const grid = feedbackList.map(fb => {
      const p = fb.playedInGame ? '🟩' : '⬛';
      const t = fb.sameTeam ? '🟩' : '⬛';
      const r = fb.sameRole ? '🟩' : '⬛';
      const m = fb.isMVP ? '🎯' : '⬛';
      return `${p}${t}${r}${m}`;
    }).join('\n');

    return `${header}${streak ? ' ' + streak : ''}\n\n${grid}\n\nhttps://reddit.com/r/playbowldem`;
  }, [puzzleNumber, gameStatus, guessesUsed, maxGuesses, feedbackList, stats]);

  // Handle share
  const handleShare = useCallback(() => {
    const shareText = generateShareText();
    navigator.clipboard.writeText(shareText).then(() => {
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    });
  }, [generateShareText]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredPlayers.length === 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredPlayers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredPlayers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredPlayers.length) {
          handleSelectPlayer(filteredPlayers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, filteredPlayers, selectedIndex, handleSelectPlayer]);

  // Close dropdown when clicking outside
  const handleBackdropClick = useCallback(() => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-2xl mb-2">🏏</div>
        <div className="text-gray-600">Loading Bowldem...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-red-500 text-lg mb-2">Error</div>
        <div className="text-gray-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Compact Header - 50px */}
      <header className="bg-white border-b border-gray-200 px-3 py-2 shrink-0">
        <div className="max-w-lg mx-auto flex items-center justify-between h-[34px]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏏</span>
            <h1 className="text-base font-bold text-gray-900">Bowldem #{puzzleNumber}</h1>
          </div>
          <div className="flex items-center gap-1">
            {/* Guesses remaining badge */}
            <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              {guessesUsed}/{maxGuesses}
            </span>
            {/* Stats button */}
            <button
              onClick={() => setShowStats(true)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              title="Stats"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            {/* Help button */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              title="Help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - fills remaining space */}
      <main className="flex-1 px-3 py-3 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Compact Scorecard - hide team details until won */}
        {puzzle && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
            <div className="flex items-center justify-center gap-1 text-gray-600 text-sm mb-2">
              <span>📍</span>
              <span className="font-medium truncate">{puzzle.venue}</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-center">
              <div className="flex-1 text-right">
                <span className="font-semibold text-gray-900">
                  {gameStatus === 'won' ? puzzle.team1Score : '???'}
                </span>
              </div>
              <div className="text-gray-400 text-xs">vs</div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-gray-900">
                  {gameStatus === 'won' ? puzzle.team2Score : '???'}
                </span>
              </div>
            </div>
            {gameStatus === 'won' && (
              <div className="text-center text-xs text-gray-500 mt-2">
                T20 World Cup Match
              </div>
            )}
          </div>
        )}

        {/* Player Input - visible without scrolling */}
        {!isGameOver && (
          <div className="mb-3 relative">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length >= 2);
                }}
                onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
                onKeyDown={handleKeyDown}
                placeholder="Type a player name..."
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            {/* Dropdown with backdrop */}
            {showSuggestions && searchQuery.length >= 2 && (
              <>
                {/* Backdrop overlay */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={handleBackdropClick}
                />
                {/* Dropdown - compact items to show more */}
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[280px] overflow-auto">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player, index) => (
                      <button
                        key={player.id}
                        onClick={() => handleSelectPlayer(player)}
                        className={`w-full px-3 py-1.5 text-left border-b border-gray-100 last:border-0 ${
                          index === selectedIndex ? 'bg-orange-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 text-xs">{player.fullName}</span>
                          <span className="text-xs text-gray-400 ml-2">{player.country}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                      No players found
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Game Over Result - replaces input when game ends */}
        {isGameOver && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-3 text-center">
            <div className="text-3xl mb-2">
              {gameStatus === 'won' ? '🎉' : '😔'}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {gameStatus === 'won' ? 'Correct!' : 'Game Over'}
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              {gameStatus === 'won'
                ? `Solved in ${guessesUsed}/${maxGuesses} guesses!`
                : 'Better luck tomorrow!'}
            </p>
            {stats && stats.currentStreak > 1 && (
              <div className="text-orange-500 font-medium text-sm mb-3">
                🔥 {stats.currentStreak} day streak!
              </div>
            )}
            <button
              onClick={handleShare}
              className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors text-sm ${
                copyState === 'copied'
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {copyState === 'copied' ? '✓ Copied!' : '📤 Share Result'}
            </button>
            {countdown && (
              <div className="mt-3 text-xs text-gray-500">
                Next puzzle in {countdown}
              </div>
            )}
          </div>
        )}

        {/* Feedback Display - Dynamic with column headers */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header with count */}
          <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Guesses</span>
            <span className="text-xs text-gray-500">{guessesUsed}/{maxGuesses}</span>
          </div>

          {/* Column headers - serve as legend */}
          <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
            <div className="flex-1">Player</div>
            <div className="w-10 text-center" title="Played in match">P</div>
            <div className="w-10 text-center" title="Same Team">T</div>
            <div className="w-10 text-center" title="Same Role">R</div>
            <div className="w-10 text-center" title="Is MVP">M</div>
          </div>

          {/* Feedback rows - newest first */}
          {reversedFeedback.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {reversedFeedback.map((feedback, index) => (
                <FeedbackRow
                  key={feedbackList.length - 1 - index}
                  feedback={feedback}
                  isNew={index === 0 && !isSubmitting}
                />
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-gray-400 text-sm">
              No guesses yet
            </div>
          )}
        </div>
      </main>

      {/* Stats Modal */}
      {showStats && stats && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowStats(false)}
        >
          <div
            className="bg-white rounded-xl p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your Stats</h2>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center mb-5">
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.gamesPlayed}</div>
                <div className="text-xs text-gray-500">Played</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {stats.gamesPlayed > 0
                    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-gray-500">Win %</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.currentStreak}</div>
                <div className="text-xs text-gray-500">Streak</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.maxStreak}</div>
                <div className="text-xs text-gray-500">Best</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-700 mb-2">Guess Distribution</div>
              {stats.guessDistribution.map((count, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 text-sm text-gray-600">{index + 1}</div>
                  <div className="flex-1 bg-gray-100 rounded h-5">
                    <div
                      className="bg-orange-500 h-full rounded text-white text-xs flex items-center justify-end px-2"
                      style={{
                        width: `${Math.max(
                          10,
                          (count / Math.max(...stats.guessDistribution, 1)) * 100
                        )}%`
                      }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white rounded-xl p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">How to Play</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>Guess the <strong>Man of the Match</strong> from a T20 World Cup game in 5 tries!</p>
              <div className="space-y-2">
                <div className="font-medium text-gray-800">Column Guide:</div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-6 bg-green-100 text-green-800 rounded flex items-center justify-center text-xs font-medium">P</span>
                  <span>Player played in the match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-6 bg-green-100 text-green-800 rounded flex items-center justify-center text-xs font-medium">T</span>
                  <span>Same team as the MVP</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-6 bg-green-100 text-green-800 rounded flex items-center justify-center text-xs font-medium">R</span>
                  <span>Same role as the MVP</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-6 bg-yellow-100 text-yellow-800 rounded flex items-center justify-center text-xs font-medium">M</span>
                  <span>Is the Man of the Match!</span>
                </div>
              </div>
              <p className="text-gray-500">A new puzzle is available every day!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact Feedback Row Component - flexbox layout matching headers
function FeedbackRow({ feedback, isNew }: { feedback: GuessFeedback; isNew: boolean }) {
  return (
    <div className={`flex items-center px-3 py-2 ${isNew ? 'bg-orange-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{feedback.playerName}</div>
        <div className="text-xs text-gray-500 truncate">{feedback.country}</div>
      </div>
      <div className="w-10 flex justify-center"><FeedbackIndicator value={feedback.playedInGame} /></div>
      <div className="w-10 flex justify-center"><FeedbackIndicator value={feedback.sameTeam} /></div>
      <div className="w-10 flex justify-center"><FeedbackIndicator value={feedback.sameRole} /></div>
      <div className="w-10 flex justify-center"><FeedbackIndicator value={feedback.isMVP} highlight /></div>
    </div>
  );
}

// Compact Feedback Indicator
function FeedbackIndicator({ value, highlight = false }: { value: boolean; highlight?: boolean }) {
  return (
    <div
      className={`w-8 h-6 rounded flex items-center justify-center text-xs font-bold ${
        value
          ? highlight
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {value ? '✓' : '✗'}
    </div>
  );
}
