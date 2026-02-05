import '../index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { context } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-orange-50 to-white p-4">
      {/* Logo */}
      <div className="text-6xl mb-2">🏏</div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Bowldem</h1>
      <p className="text-sm text-orange-600 font-medium mb-4">Daily Cricket Puzzle</p>

      {/* Description */}
      <div className="text-center mb-6 max-w-xs">
        <p className="text-gray-600 text-sm">
          Guess the <span className="font-semibold">Man of the Match</span> from T20 World Cup classics in 5 tries!
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-6 max-w-xs w-full">
        <div className="text-xs text-gray-500 text-center mb-2">Each guess reveals:</div>
        <div className="flex justify-center gap-2 text-xs">
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 bg-green-200 rounded flex items-center justify-center font-bold text-green-800">P</span>
            <span className="text-gray-500 mt-1">Played</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 bg-green-200 rounded flex items-center justify-center font-bold text-green-800">T</span>
            <span className="text-gray-500 mt-1">Team</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 bg-green-200 rounded flex items-center justify-center font-bold text-green-800">R</span>
            <span className="text-gray-500 mt-1">Role</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 bg-amber-300 rounded flex items-center justify-center font-bold text-amber-900">M</span>
            <span className="text-gray-500 mt-1">MVP!</span>
          </div>
        </div>
      </div>

      {/* Play Button */}
      <button
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all transform hover:scale-105"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Play Now
      </button>

      {/* Username greeting */}
      {context.username && (
        <p className="mt-4 text-xs text-gray-400">
          Playing as u/{context.username}
        </p>
      )}

      {/* Footer */}
      <footer className="absolute bottom-3 text-xs text-gray-400">
        For cricket fans & trivia lovers
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
