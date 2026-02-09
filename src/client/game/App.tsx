import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useGame } from '../hooks/useGame';
import type { Player, GuessFeedback, LeaderboardEntry } from '../../shared/types/game';

// Country abbreviation aliases
const COUNTRY_ALIASES: Record<string, string> = {
  'usa': 'United States of America', 'us': 'United States of America',
  'united states': 'United States of America', 'america': 'United States of America',
  'uae': 'United Arab Emirates', 'nz': 'New Zealand',
  'sa': 'South Africa', 'wi': 'West Indies', 'windies': 'West Indies',
  'png': 'Papua New Guinea', 'sl': 'Sri Lanka',
  'pak': 'Pakistan', 'aus': 'Australia', 'eng': 'England',
  'ind': 'India', 'ban': 'Bangladesh', 'afg': 'Afghanistan',
  'zim': 'Zimbabwe', 'ire': 'Ireland', 'sco': 'Scotland',
  'ned': 'Netherlands', 'nam': 'Namibia', 'oma': 'Oman',
  'nep': 'Nepal', 'uga': 'Uganda', 'can': 'Canada',
};

// Role aliases
const ROLE_ALIASES: Record<string, string> = {
  'bat': 'Batsman', 'batter': 'Batsman', 'batsman': 'Batsman', 'batting': 'Batsman',
  'bowl': 'Bowler', 'bowler': 'Bowler', 'bowling': 'Bowler',
  'all': 'All-rounder', 'allrounder': 'All-rounder', 'all rounder': 'All-rounder',
  'all-rounder': 'All-rounder', 'ar': 'All-rounder',
  'wk': 'Wicketkeeper', 'keeper': 'Wicketkeeper',
  'wicketkeeper': 'Wicketkeeper', 'wicket keeper': 'Wicketkeeper',
};

function getRoleBadge(role: string): { label: string; color: string } {
  switch (role) {
    case 'Batsman': return { label: 'BAT', color: 'bg-blue-100 text-blue-700' };
    case 'Bowler': return { label: 'BOWL', color: 'bg-red-100 text-red-700' };
    case 'All-rounder': return { label: 'AR', color: 'bg-purple-100 text-purple-700' };
    case 'Wicketkeeper': return { label: 'WK', color: 'bg-green-100 text-green-700' };
    default: return { label: role.substring(0, 3).toUpperCase(), color: 'bg-gray-100 text-gray-700' };
  }
}

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
    submitGuess,
    matchSummary
  } = useGame();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{ entries: LeaderboardEntry[]; userEntry?: LeaderboardEntry } | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [countdown, setCountdown] = useState('');
  const [pendingGuess, setPendingGuess] = useState<Player | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPlaytest = typeof window !== 'undefined' && window.location.search.includes('playtest');

  // First-time help modal
  useEffect(() => {
    try {
      if (!localStorage.getItem('bowldem_help_shown')) {
        setShowHelp(true);
        localStorage.setItem('bowldem_help_shown', 'true');
      }
    } catch (_) { /* localStorage may be blocked in webview */ }
  }, []);

  // Derive confirmed role from feedback (if any guess matched role)
  const confirmedRole = useMemo(() => {
    const match = feedbackList.find(fb => fb.sameRole);
    return match?.role || null;
  }, [feedbackList]);

  // Smart autocomplete with aliases, feedback-awareness, active-first
  const filteredPlayers = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase().trim();
    const seenNames = new Set<string>();

    const aliasedCountry = COUNTRY_ALIASES[query]?.toLowerCase();
    const aliasedRole = ROLE_ALIASES[query];

    return players
      .filter(p => {
        const matchesName = p.fullName.toLowerCase().includes(query);
        const matchesCountry = p.country.toLowerCase().includes(query) ||
          (aliasedCountry && p.country.toLowerCase() === aliasedCountry);
        const matchesRole = p.role.toLowerCase().includes(query) ||
          (aliasedRole && p.role === aliasedRole);
        if (!matchesName && !matchesCountry && !matchesRole) return false;
        if (usedPlayerIds.has(p.id)) return false;
        const nameLower = p.fullName.toLowerCase();
        if (seenNames.has(nameLower)) return false;
        seenNames.add(nameLower);
        return true;
      })
      .sort((a, b) => {
        // Active players first
        const activeA = (a as any).active ? 1 : 0;
        const activeB = (b as any).active ? 1 : 0;
        if (activeA !== activeB) return activeB - activeA;

        // Confirmed role first
        if (confirmedRole) {
          const roleMatchA = a.role === confirmedRole ? 1 : 0;
          const roleMatchB = b.role === confirmedRole ? 1 : 0;
          if (roleMatchA !== roleMatchB) return roleMatchB - roleMatchA;
        }

        // Name match before country/role match
        const nameA = a.fullName.toLowerCase().includes(query) ? 1 : 0;
        const nameB = b.fullName.toLowerCase().includes(query) ? 1 : 0;
        if (nameA !== nameB) return nameB - nameA;

        return a.fullName.localeCompare(b.fullName);
      })
      .slice(0, 12);
  }, [searchQuery, players, usedPlayerIds, confirmedRole]);

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
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [isGameOver]);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    if (leaderboardLoading) return;
    setLeaderboardLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData({ entries: data.entries, userEntry: data.userEntry });
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [leaderboardLoading]);

  // Open leaderboard modal
  const handleOpenLeaderboard = useCallback(() => {
    setShowLeaderboard(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Handle player selection
  const handleSelectPlayer = useCallback(async (player: Player) => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setPendingGuess(player);
    await submitGuess(player.id);
    setPendingGuess(null);
  }, [submitGuess]);

  // Generate share emoji grid
  const generateShareText = useCallback(() => {
    const header = `\u{1F3CF} Bowldem #${puzzleNumber} ${gameStatus === 'won' ? guessesUsed : 'X'}/${maxGuesses}`;
    const streak = stats?.currentStreak && stats.currentStreak > 1 ? `\u{1F525} ${stats.currentStreak}` : '';

    const grid = feedbackList.map(fb => {
      const p = fb.playedInGame ? '\u{1F7E9}' : '\u2B1B';
      const t = fb.sameTeam ? '\u{1F7E9}' : '\u2B1B';
      const r = fb.sameRole ? '\u{1F7E9}' : '\u2B1B';
      const m = fb.isMVP ? '\u{1F3AF}' : '\u2B1B';
      return `${p}${t}${r}${m}`;
    }).join('\n');

    return `${header}${streak ? ' ' + streak : ''}\n\n${grid}\n\nhttps://reddit.com/r/playbowldem`;
  }, [puzzleNumber, gameStatus, guessesUsed, maxGuesses, feedbackList, stats]);

  // Handle share with clipboard fallback
  const handleShare = useCallback(async () => {
    const shareText = generateShareText();
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyState('copied');
    } catch (err) {
      console.warn('Clipboard API failed:', err);
      setCopyState('copied');
    }
    setTimeout(() => setCopyState('idle'), 5000);
  }, [generateShareText]);

  // Debug reset (dev only)
  const handleDebugReset = useCallback(async () => {
    try {
      await fetch('/api/debug/reset', { method: 'POST' });
      window.location.reload();
    } catch (e) {
      console.error('Reset failed:', e);
    }
  }, []);

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
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-gray-100">
        <div className="text-2xl mb-2">{'\u{1F3CF}'}</div>
        <div className="text-gray-600">Loading Bowldem...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-gray-100 p-4">
        <div className="text-red-500 text-lg mb-2">Error</div>
        <div className="text-gray-600 text-center mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-gray-100 flex flex-col overflow-hidden">
      {/* DRS scanning animation keyframes */}
      <style>{`
        @keyframes drs-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Gradient Header */}
      <header className="bg-gradient-to-r from-orange-600 to-amber-500 px-3 py-2 shrink-0 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between h-[34px]">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{'\u{1F3CF}'}</span>
            <div>
              <h1 className="text-sm font-bold text-white">#{puzzleNumber}</h1>
              {username && (
                <div className="text-[10px] text-orange-100">u/{username}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Guesses remaining badge */}
            <span className="text-xs font-medium bg-white/20 text-white px-2 py-1 rounded-full">
              {guessesUsed}/{maxGuesses}
            </span>
            {/* Dev-only reset button */}
            {isPlaytest && (
              <button
                onClick={handleDebugReset}
                className="p-1.5 hover:bg-red-500/30 rounded-full text-red-100"
                title="Reset (Dev)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            {/* Leaderboard button */}
            <button
              onClick={handleOpenLeaderboard}
              className="p-2 hover:bg-white/10 rounded-full text-white"
              title="Leaderboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </button>
            {/* Stats button */}
            <button
              onClick={() => setShowStats(true)}
              className="p-2 hover:bg-white/10 rounded-full text-white"
              title="Stats"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            {/* Help button */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-white/10 rounded-full text-white"
              title="Help"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 py-3 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Scorecard - green cricket-pitch gradient */}
        {puzzle && (
          <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-lg shadow-sm p-3 mb-3 text-white">
            <div className="flex items-center justify-center gap-1 text-green-200 text-xs mb-2">
              <span className="shrink-0">{'\u{1F4CD}'}</span>
              <span className="font-medium truncate">{puzzle.venue}</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-center">
              <div className="flex-1 text-right">
                <div className="text-xs text-green-300 mb-0.5">
                  {gameStatus === 'won' ? puzzle.team1Name : 'Team 1'}
                </div>
                <span className="font-semibold text-white">{puzzle.team1Score}</span>
              </div>
              <div className="text-green-400 text-sm font-medium">vs</div>
              <div className="flex-1 text-left">
                <div className="text-xs text-green-300 mb-0.5">
                  {gameStatus === 'won' ? puzzle.team2Name : 'Team 2'}
                </div>
                <span className="font-semibold text-white">{puzzle.team2Score}</span>
              </div>
            </div>
            <div className="text-center text-xs text-green-400 mt-2">
              T20 World Cup
            </div>
          </div>
        )}

        {/* Player Input */}
        {!isGameOver && (
          <div className="mb-3 relative">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {isSubmitting ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
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
                placeholder={isSubmitting ? "Checking..." : "Type a player name..."}
                disabled={isSubmitting}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white ${isSubmitting ? 'opacity-60' : ''}`}
              />
            </div>

            {/* Dropdown with backdrop */}
            {showSuggestions && searchQuery.length >= 2 && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={handleBackdropClick}
                />
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[280px] overflow-auto">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player, index) => {
                      const badge = getRoleBadge(player.role);
                      return (
                        <button
                          key={player.id}
                          onClick={() => handleSelectPlayer(player)}
                          className={`w-full px-3 py-1.5 text-left border-b border-gray-100 last:border-0 ${
                            index === selectedIndex ? 'bg-orange-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 text-xs truncate">{player.fullName}</span>
                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.color}`}>
                                {badge.label}
                              </span>
                              <span className="text-xs text-gray-400">{player.country}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })
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

        {/* Match Summary - win only */}
        {gameStatus === 'won' && matchSummary && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm p-3 mb-2 border border-green-200">
            <h3 className="text-sm font-bold text-green-800 mb-2">Match Summary</h3>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-right flex-1">
                <div className="text-xs font-medium text-gray-700">{matchSummary.team1Name}</div>
                <div className="text-sm font-bold text-gray-900">{matchSummary.team1Score}</div>
              </div>
              <div className="text-gray-400 text-xs">vs</div>
              <div className="text-left flex-1">
                <div className="text-xs font-medium text-gray-700">{matchSummary.team2Name}</div>
                <div className="text-sm font-bold text-gray-900">{matchSummary.team2Score}</div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-600 mb-2">{matchSummary.result}</div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-0.5">Man of the Match</div>
              <div className="text-sm font-bold text-amber-700">{'\u2B50'} {matchSummary.mvpName}</div>
              <div className="text-xs text-gray-500">{matchSummary.mvpCountry} {'\u00B7'} {matchSummary.mvpRole}</div>
            </div>
            {matchSummary.cricinfoUrl && (
              <a
                href={matchSummary.cricinfoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-blue-600 hover:underline mt-2"
              >
                View on ESPNcricinfo {'\u2192'}
              </a>
            )}
          </div>
        )}

        {/* Game Over Result */}
        {isGameOver && (
          <div className={`rounded-lg shadow-sm p-3 mb-2 text-center ${
            gameStatus === 'won'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">{gameStatus === 'won' ? '\u{1F389}' : '\u{1F614}'}</span>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {gameStatus === 'won' ? 'Correct!' : 'Game Over'}
                </h2>
                <p className="text-gray-600 text-xs">
                  {gameStatus === 'won'
                    ? `Solved in ${guessesUsed}/${maxGuesses} guesses!`
                    : 'Better luck tomorrow!'}
                  {stats && stats.currentStreak > 1 && ` \u{1F525} ${stats.currentStreak} streak`}
                </p>
              </div>
            </div>

            {/* Share Preview */}
            <div className="bg-gray-50 rounded p-2 mb-2">
              <div className="flex flex-col items-center gap-0.5">
                {feedbackList.map((fb, i) => {
                  const p = fb.playedInGame ? '\u{1F7E9}' : '\u2B1B';
                  const t = fb.sameTeam ? '\u{1F7E9}' : '\u2B1B';
                  const r = fb.sameRole ? '\u{1F7E9}' : '\u2B1B';
                  const m = fb.isMVP ? '\u{1F3AF}' : '\u2B1B';
                  return <span key={i} className="text-sm leading-tight">{p}{t}{r}{m}</span>;
                })}
              </div>
            </div>

            <button
              onClick={handleShare}
              className={`w-full px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                copyState === 'copied'
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {copyState === 'copied' ? '\u2713 Copied!' : '\u{1F4E4} Copy & Share'}
            </button>
            {countdown && (
              <div className="mt-2 text-xs text-gray-400">
                Next puzzle in {countdown}
              </div>
            )}
            {/* Dev-only reset in game over */}
            {isPlaytest && (
              <button
                onClick={handleDebugReset}
                className="w-full px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors mt-1"
              >
                Reset (Dev Only)
              </button>
            )}
          </div>
        )}

        {/* Feedback Display */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header with gradient */}
          <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-100 to-amber-50">
            <span className="text-sm font-medium text-gray-700">Guesses</span>
            <span className="text-xs font-medium bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">{guessesUsed}/{maxGuesses}</span>
          </div>

          {/* Column headers */}
          <div className="flex items-center px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500">
            <div className="flex-1">Player</div>
            <div className="w-8 sm:w-10 text-center" title="Played in match">P</div>
            <div className="w-8 sm:w-10 text-center" title="Same Team">T</div>
            <div className="w-8 sm:w-10 text-center" title="Same Role">R</div>
            <div className="w-8 sm:w-10 text-center" title="Is MVP">M</div>
          </div>

          {/* Feedback rows */}
          {(reversedFeedback.length > 0 || pendingGuess) ? (
            <div className="divide-y divide-gray-100">
              {/* DRS pending guess row */}
              {pendingGuess && (
                <div className="flex items-center px-3 py-2 bg-amber-50 border-l-4 border-amber-400">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{pendingGuess.fullName}</div>
                    <div className="text-xs text-amber-600 truncate">DRS Review...</div>
                  </div>
                  <div className="w-8 sm:w-10 flex justify-center"><DRSCell delay={0} /></div>
                  <div className="w-8 sm:w-10 flex justify-center"><DRSCell delay={150} /></div>
                  <div className="w-8 sm:w-10 flex justify-center"><DRSCell delay={300} /></div>
                  <div className="w-8 sm:w-10 flex justify-center"><DRSCell delay={450} /></div>
                </div>
              )}
              {reversedFeedback.map((feedback, index) => (
                <FeedbackRow
                  key={feedbackList.length - 1 - index}
                  feedback={feedback}
                  isNew={index === 0 && !pendingGuess && !isSubmitting}
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

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowLeaderboard(false)}
        >
          <div
            className="bg-white rounded-xl p-5 max-w-sm w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">{'\u{1F3C6}'} Today's Leaderboard</h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="w-6 h-6 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : leaderboardData && leaderboardData.entries.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center px-2 py-1 text-xs text-gray-500 font-medium border-b">
                    <div className="w-8">#</div>
                    <div className="flex-1">Player</div>
                    <div className="w-16 text-center">Guesses</div>
                  </div>
                  {leaderboardData.entries.map((entry) => (
                    <div
                      key={entry.username}
                      className={`flex items-center px-2 py-2 rounded ${
                        leaderboardData.userEntry?.username === entry.username
                          ? 'bg-orange-50 border border-orange-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-8 text-sm font-medium text-gray-600">
                        {entry.rank === 1 ? '\u{1F947}' : entry.rank === 2 ? '\u{1F948}' : entry.rank === 3 ? '\u{1F949}' : entry.rank}
                      </div>
                      <div className="flex-1 text-sm text-gray-900 truncate">
                        u/{entry.username}
                      </div>
                      <div className="w-16 text-center text-sm font-medium text-gray-700">
                        {entry.guessCount}/5
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No winners yet today. Be the first!
                </div>
              )}
            </div>

            {/* User's rank if not in top 20 */}
            {leaderboardData?.userEntry && !leaderboardData.entries.find(e => e.username === leaderboardData.userEntry?.username) && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500 mb-1">Your rank</div>
                <div className="flex items-center px-2 py-2 bg-orange-50 rounded border border-orange-200">
                  <div className="w-8 text-sm font-medium text-gray-600">{leaderboardData.userEntry.rank}</div>
                  <div className="flex-1 text-sm text-gray-900">u/{leaderboardData.userEntry.username}</div>
                  <div className="w-16 text-center text-sm font-medium text-gray-700">
                    {leaderboardData.userEntry.guessCount}/5
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Feedback Row with cricket icons
function FeedbackRow({ feedback, isNew }: { feedback: GuessFeedback; isNew: boolean }) {
  return (
    <div className={`flex items-center px-3 py-2 ${isNew ? 'bg-amber-100 border-l-4 border-amber-400' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm truncate">{feedback.playerName}</div>
        <div className="text-xs text-gray-500 truncate">{feedback.country}</div>
      </div>
      <div className="w-8 sm:w-10 flex justify-center"><FeedbackIndicator value={feedback.playedInGame} /></div>
      <div className="w-8 sm:w-10 flex justify-center"><FeedbackIndicator value={feedback.sameTeam} /></div>
      <div className="w-8 sm:w-10 flex justify-center"><FeedbackIndicator value={feedback.sameRole} /></div>
      <div className="w-8 sm:w-10 flex justify-center"><FeedbackIndicator value={feedback.isMVP} highlight /></div>
    </div>
  );
}

// Cricket-themed feedback indicator
function FeedbackIndicator({ value, highlight = false }: { value: boolean; highlight?: boolean }) {
  if (value && highlight) {
    // MVP match - trophy
    return (
      <div className="w-8 h-6 rounded bg-amber-300 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-900" fill="currentColor">
          <path d="M7 4h10v5a5 5 0 01-10 0V4z" />
          <path d="M5 4H7V7C5.5 7 4 5.5 5 4zM17 4h2c1 1.5-.5 3-2 3V4z" />
          <rect x="11" y="14" width="2" height="3" />
          <rect x="8" y="17" width="8" height="2" rx="1" />
        </svg>
      </div>
    );
  }
  if (value) {
    // Correct - cricket bat
    return (
      <div className="w-8 h-6 rounded bg-green-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-green-900" fill="currentColor">
          <rect x="10" y="2" width="4" height="12" rx="1" />
          <rect x="11" y="14" width="2" height="6" rx="0.5" />
          <line x1="9" y1="20" x2="15" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // Incorrect - cricket ball
  return (
    <div className="w-8 h-6 rounded bg-red-200 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-red-900">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path d="M6 6c3 3 3 9 0 12M18 6c-3 3-3 9 0 12" stroke="white" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

// DRS scanning cell for pending guess
function DRSCell({ delay = 0 }: { delay?: number }) {
  return (
    <div className="w-8 h-6 rounded bg-amber-100 overflow-hidden relative">
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
        style={{
          animation: 'drs-scan 1.5s ease-in-out infinite',
          animationDelay: `${delay}ms`
        }}
      />
    </div>
  );
}
