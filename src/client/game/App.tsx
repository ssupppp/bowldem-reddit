import { useState, useMemo, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import type { Player, GuessFeedback } from '../../shared/types/game';
import { generateShareText } from '../../shared/gameLogic';

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
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  // Filter players for autocomplete
  const filteredPlayers = useMemo(() => {
    if (searchQuery.length < 3) return [];
    const query = searchQuery.toLowerCase();
    return players
      .filter(p =>
        p.fullName.toLowerCase().includes(query) &&
        !usedPlayerIds.has(p.id)
      )
      .slice(0, 8);
  }, [searchQuery, players, usedPlayerIds]);

  // Handle player selection
  const handleSelectPlayer = useCallback(async (player: Player) => {
    setSearchQuery('');
    setShowSuggestions(false);
    await submitGuess(player.id);
  }, [submitGuess]);

  // Handle share
  const handleShare = useCallback(() => {
    const shareText = generateShareText(
      puzzleNumber,
      feedbackList,
      stats?.currentStreak || 0
    );
    navigator.clipboard.writeText(shareText).then(() => {
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    });
  }, [puzzleNumber, feedbackList, stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-2xl mb-2">🏏</div>
        <div className="text-gray-600">Loading Bowldem...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-red-500 text-lg mb-2">Error</div>
        <div className="text-gray-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <h1 className="text-xl font-bold text-gray-900">Bowldem</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">#{puzzleNumber}</span>
            <button
              onClick={() => setShowStats(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Stats"
            >
              📊
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
        {/* Scorecard */}
        {puzzle && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="text-center mb-3">
              <div className="text-sm text-gray-500 mb-1">Puzzle #{puzzleNumber}</div>
              <div className="flex items-center justify-center gap-1 text-gray-700">
                <span>📍</span>
                <span className="font-medium">{puzzle.venue}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-center">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Team 1</div>
                <div className="font-semibold text-gray-900">{puzzle.team1Score}</div>
              </div>
              <div className="text-gray-400 text-sm">vs</div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Team 2</div>
                <div className="font-semibold text-gray-900">{puzzle.team2Score}</div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        {!isGameOver && (
          <div className="mb-4">
            <div className="text-center text-gray-700 mb-2 font-medium">
              Who's the Man of the Match?
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length >= 3);
                }}
                onFocus={() => setShowSuggestions(searchQuery.length >= 3)}
                placeholder="Type a player name (min 3 chars)..."
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
              />
              {showSuggestions && filteredPlayers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                  {filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSelectPlayer(player)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-900">{player.fullName}</div>
                      <div className="text-sm text-gray-500">{player.country} • {player.role}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
              {guessesRemaining} guesses remaining
            </div>
          </div>
        )}

        {/* Feedback List */}
        {feedbackList.length > 0 && (
          <div className="space-y-2 mb-4">
            {feedbackList.map((feedback, index) => (
              <FeedbackRow key={index} feedback={feedback} isNew={index === feedbackList.length - 1 && isSubmitting === false} />
            ))}
          </div>
        )}

        {/* Game Over State */}
        {isGameOver && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">
              {gameStatus === 'won' ? '🏆' : '😔'}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {gameStatus === 'won' ? 'You Got It!' : 'Game Over'}
            </h2>
            <p className="text-gray-600 mb-4">
              {gameStatus === 'won'
                ? `Solved in ${guessesUsed}/${maxGuesses} guesses!`
                : 'Better luck tomorrow!'}
            </p>
            {stats && stats.currentStreak > 1 && (
              <div className="text-orange-500 font-medium mb-4">
                🔥 {stats.currentStreak} day streak!
              </div>
            )}
            <button
              onClick={handleShare}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                copyState === 'copied'
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {copyState === 'copied' ? '✓ Copied!' : 'Share Result'}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-sm text-gray-500">
        {username !== 'anonymous' && (
          <span>Playing as u/{username}</span>
        )}
      </footer>

      {/* Stats Modal */}
      {showStats && stats && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowStats(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Stats</h2>
              <button
                onClick={() => setShowStats(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center mb-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.gamesPlayed}</div>
                <div className="text-xs text-gray-500">Played</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.gamesPlayed > 0
                    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-gray-500">Win %</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.currentStreak}</div>
                <div className="text-xs text-gray-500">Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.maxStreak}</div>
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
    </div>
  );
};

// Feedback Row Component
function FeedbackRow({ feedback, isNew }: { feedback: GuessFeedback; isNew: boolean }) {
  return (
    <div className={`bg-white rounded-lg p-3 shadow-sm ${isNew ? 'animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-medium text-gray-900">{feedback.playerName}</div>
          <div className="text-sm text-gray-500">{feedback.country}</div>
        </div>
        {feedback.isMVP && <span className="text-2xl">🏆</span>}
      </div>
      <div className="flex gap-2">
        <FeedbackBadge label="Played" value={feedback.playedInGame} />
        <FeedbackBadge label="Team" value={feedback.sameTeam} />
        <FeedbackBadge label="Role" value={feedback.sameRole} />
        <FeedbackBadge label="MVP" value={feedback.isMVP} highlight />
      </div>
    </div>
  );
}

// Feedback Badge Component
function FeedbackBadge({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex-1 text-center py-1 px-2 rounded text-sm font-medium ${
        value
          ? highlight
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      <div className="text-xs opacity-70">{label}</div>
      <div>{value ? 'Y' : 'N'}</div>
    </div>
  );
}
