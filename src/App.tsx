import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Pause, 
  Settings2, 
  CheckCircle2, 
  Eraser,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Timer as TimerIcon
} from 'lucide-react';
import { 
  generateFullBoard, 
  createPuzzle, 
  isBoardComplete, 
  Board, 
  Difficulty, 
  SUDOKU_SIZE, 
  BOX_SIZE 
} from './utils/sudoku';

// --- Components ---

const Timer = ({ isActive, reset }: { isActive: boolean; reset: boolean }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (reset) setSeconds(0);
  }, [reset]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 font-mono text-lg font-medium text-zinc-600">
      <TimerIcon size={18} />
      <span>{formatTime(seconds)}</span>
    </div>
  );
};

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [solution, setSolution] = useState<Board>([]);
  const [initialBoard, setInitialBoard] = useState<Board>([]);
  const [currentBoard, setCurrentBoard] = useState<Board>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [resetTimer, setResetTimer] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [notes, setNotes] = useState<boolean[][][]>([]); // [row][col][number 1-9]
  const [isNoteMode, setIsNoteMode] = useState(false);

  // Initialize game
  const startNewGame = useCallback((diff: Difficulty = difficulty) => {
    const full = generateFullBoard();
    const puzzle = createPuzzle(full, diff);
    
    setSolution(full);
    setInitialBoard(puzzle.map(row => [...row]));
    setCurrentBoard(puzzle.map(row => [...row]));
    setDifficulty(diff);
    setSelectedCell(null);
    setIsPaused(false);
    setIsGameWon(false);
    setResetTimer(true);
    setMistakes(0);
    setNotes(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => Array(10).fill(false))));
    
    setTimeout(() => setResetTimer(false), 100);
  }, [difficulty]);

  useEffect(() => {
    startNewGame();
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (isPaused || isGameWon) return;
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isPaused || isGameWon) return;
    const [r, c] = selectedCell;

    // Don't allow changing initial numbers
    if (initialBoard[r][c] !== null) return;

    if (isNoteMode) {
      const newNotes = [...notes];
      newNotes[r][c][num] = !newNotes[r][c][num];
      setNotes(newNotes);
      return;
    }

    const newBoard = currentBoard.map(row => [...row]);
    
    if (num === solution[r][c]) {
      newBoard[r][c] = num;
      setCurrentBoard(newBoard);
      
      // Clear notes for this cell and its neighbors
      const updatedNotes = [...notes];
      updatedNotes[r][c] = Array(10).fill(false);
      setNotes(updatedNotes);

      if (isBoardComplete(newBoard, solution)) {
        setIsGameWon(true);
        setIsPaused(false);
      }
    } else {
      setMistakes(prev => prev + 1);
      // Optional: Visual feedback for mistake
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isPaused || isGameWon) return;

    if (e.key >= '1' && e.key <= '9') {
      handleNumberInput(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedCell) {
        const [r, c] = selectedCell;
        if (initialBoard[r][c] === null) {
          const newBoard = currentBoard.map(row => [...row]);
          newBoard[r][c] = null;
          setCurrentBoard(newBoard);
        }
      }
    } else if (e.key.startsWith('Arrow')) {
      if (!selectedCell) {
        setSelectedCell([0, 0]);
        return;
      }
      const [r, c] = selectedCell;
      if (e.key === 'ArrowUp') setSelectedCell([Math.max(0, r - 1), c]);
      if (e.key === 'ArrowDown') setSelectedCell([Math.min(8, r + 1), c]);
      if (e.key === 'ArrowLeft') setSelectedCell([r, Math.max(0, c - 1)]);
      if (e.key === 'ArrowRight') setSelectedCell([r, Math.min(8, c + 1)]);
    }
  };

  const getCellClasses = (r: number, c: number) => {
    const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
    const isInitial = initialBoard[r][c] !== null;
    const isSameValue = selectedCell && currentBoard[r][c] !== null && currentBoard[r][c] === currentBoard[selectedCell[0]][selectedCell[1]];
    const isInSameRowCol = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
    const isInSameBox = selectedCell && (
      Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
      Math.floor(selectedCell[1] / 3) === Math.floor(c / 3)
    );

    let base = "relative flex items-center justify-center text-2xl sm:text-3xl font-light cursor-pointer transition-all duration-150 aspect-square border-zinc-200 ";
    
    // Borders for 3x3 grid
    if (c % 3 === 0 && c !== 0) base += "border-l-2 border-l-zinc-400 ";
    else if (c !== 0) base += "border-l ";
    
    if (r % 3 === 0 && r !== 0) base += "border-t-2 border-t-zinc-400 ";
    else if (r !== 0) base += "border-t ";

    if (isSelected) base += "bg-zinc-800 text-white z-10 shadow-lg scale-105 rounded-sm ";
    else if (isSameValue) base += "bg-zinc-200 text-zinc-900 ";
    else if (isInSameRowCol || isInSameBox) base += "bg-zinc-50 text-zinc-700 ";
    else base += "bg-white text-zinc-800 ";

    if (isInitial && !isSelected) base += "font-semibold ";

    return base;
  };

  return (
    <div 
      className="min-h-screen bg-zinc-100 text-zinc-900 font-sans selection:bg-zinc-200 p-4 sm:p-8 flex flex-col items-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-4xl font-light tracking-tighter text-zinc-900">ZEN SUDOKU</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">Difficulty:</span>
              <select 
                value={difficulty} 
                onChange={(e) => startNewGame(e.target.value as Difficulty)}
                className="text-xs uppercase tracking-widest font-bold text-zinc-600 bg-transparent border-none focus:ring-0 cursor-pointer hover:text-zinc-900 transition-colors"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Mistakes</span>
              <span className={`text-sm font-mono font-bold ${mistakes > 3 ? 'text-red-500' : 'text-zinc-600'}`}>
                {mistakes}/3
              </span>
            </div>
            <Timer isActive={!isPaused && !isGameWon} reset={resetTimer} />
          </div>
        </header>

        {/* Game Board Container */}
        <main className="relative group">
          <div className="bg-white p-1 sm:p-2 rounded-xl shadow-2xl shadow-zinc-200 border border-zinc-200 overflow-hidden">
            <div className="grid grid-cols-9 w-full max-w-[500px] mx-auto">
              {currentBoard.map((row, r) => 
                row.map((cell, c) => (
                  <div 
                    key={`${r}-${c}`}
                    className={getCellClasses(r, c)}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {isPaused ? (
                      <div className="w-1 h-1 bg-zinc-200 rounded-full" />
                    ) : (
                      <>
                        {cell !== null ? (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            {cell}
                          </motion.span>
                        ) : (
                          <div className="grid grid-cols-3 w-full h-full p-0.5">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <div key={i} className="flex items-center justify-center text-[8px] sm:text-[10px] text-zinc-400 leading-none">
                                {notes[r]?.[c]?.[i + 1] ? i + 1 : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl"
              >
                <button 
                  onClick={() => setIsPaused(false)}
                  className="w-20 h-20 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                >
                  <Play size={32} fill="currentColor" />
                </button>
                <p className="mt-4 text-sm uppercase tracking-widest font-bold text-zinc-400">Game Paused</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Win Overlay */}
          <AnimatePresence>
            {isGameWon && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-30 bg-zinc-900/95 flex flex-col items-center justify-center rounded-xl text-white p-8 text-center"
              >
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <Trophy size={48} />
                </div>
                <h2 className="text-4xl font-light tracking-tighter mb-2">EXCELLENT WORK</h2>
                <p className="text-zinc-400 text-sm uppercase tracking-widest mb-8">You solved the {difficulty} puzzle!</p>
                <button 
                  onClick={() => startNewGame()}
                  className="px-8 py-3 bg-white text-zinc-900 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Play Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Controls */}
        <div className="flex flex-col gap-6">
          
          {/* Number Pad */}
          <div className="grid grid-cols-9 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                className="aspect-square flex items-center justify-center text-xl font-light rounded-lg bg-white border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all shadow-sm active:scale-95"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-zinc-200 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center group-hover:border-zinc-400 transition-colors">
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button 
              onClick={() => setIsNoteMode(!isNoteMode)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors group ${isNoteMode ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-200'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isNoteMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200 group-hover:border-zinc-400'}`}>
                <Settings2 size={18} />
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${isNoteMode ? 'text-zinc-300' : 'text-zinc-500'}`}>Notes: {isNoteMode ? 'ON' : 'OFF'}</span>
            </button>

            <button 
              onClick={() => {
                if (selectedCell) {
                  const [r, c] = selectedCell;
                  if (initialBoard[r][c] === null) {
                    const newBoard = currentBoard.map(row => [...row]);
                    newBoard[r][c] = null;
                    setCurrentBoard(newBoard);
                  }
                }
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-zinc-200 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center group-hover:border-zinc-400 transition-colors">
                <Eraser size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Erase</span>
            </button>

            <button 
              onClick={() => startNewGame()}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-zinc-200 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center group-hover:border-zinc-400 transition-colors">
                <RotateCcw size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">New Game</span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-8 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-400">
          <p className="text-xs uppercase tracking-widest font-medium">Use keyboard arrows to navigate & numbers to fill</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-900 transition-colors"><ChevronLeft size={20} /></a>
            <span className="text-[10px] uppercase tracking-widest font-bold">Zen Sudoku v1.0</span>
            <a href="#" className="hover:text-zinc-900 transition-colors"><ChevronRight size={20} /></a>
          </div>
        </footer>

      </div>
    </div>
  );
}
