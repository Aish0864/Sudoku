/**
 * Sudoku Utility Functions
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export const SUDOKU_SIZE = 9;
export const BOX_SIZE = 3;

export type Board = (number | null)[][];

/**
 * Checks if a value can be placed at a specific position
 */
export function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < SUDOKU_SIZE; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < SUDOKU_SIZE; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = row - (row % BOX_SIZE);
  const startCol = col - (col % BOX_SIZE);

  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

/**
 * Solves the Sudoku board using backtracking
 */
export function solveSudoku(board: Board): boolean {
  for (let row = 0; row < SUDOKU_SIZE; row++) {
    for (let col = 0; col < SUDOKU_SIZE; col++) {
      if (board[row][col] === null) {
        for (let num = 1; num <= SUDOKU_SIZE; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Generates a full valid Sudoku board
 */
export function generateFullBoard(): Board {
  const board: Board = Array.from({ length: SUDOKU_SIZE }, () => Array(SUDOKU_SIZE).fill(null));
  
  // Fill diagonal boxes first to speed up generation
  for (let i = 0; i < SUDOKU_SIZE; i += BOX_SIZE) {
    fillBox(board, i, i);
  }
  
  solveSudoku(board);
  return board;
}

function fillBox(board: Board, row: number, col: number) {
  let num;
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      do {
        num = Math.floor(Math.random() * SUDOKU_SIZE) + 1;
      } while (!isUnusedInBox(board, row, col, num));
      board[row + i][col + j] = num;
    }
  }
}

function isUnusedInBox(board: Board, rowStart: number, colStart: number, num: number): boolean {
  for (let i = 0; i < BOX_SIZE; i++) {
    for (let j = 0; j < BOX_SIZE; j++) {
      if (board[rowStart + i][colStart + j] === num) return false;
    }
  }
  return true;
}

/**
 * Creates a puzzle by removing numbers from a full board
 */
export function createPuzzle(fullBoard: Board, difficulty: Difficulty): Board {
  const puzzle: Board = fullBoard.map(row => [...row]);
  let attempts = 0;
  
  const cellsToRemove = {
    easy: 35,
    medium: 45,
    hard: 55
  }[difficulty];

  while (attempts < cellsToRemove) {
    const row = Math.floor(Math.random() * SUDOKU_SIZE);
    const col = Math.floor(Math.random() * SUDOKU_SIZE);
    
    if (puzzle[row][col] !== null) {
      puzzle[row][col] = null;
      attempts++;
    }
  }
  
  return puzzle;
}

/**
 * Checks if the board is completely and correctly filled
 */
export function isBoardComplete(board: Board, solution: Board): boolean {
  for (let r = 0; r < SUDOKU_SIZE; r++) {
    for (let c = 0; c < SUDOKU_SIZE; c++) {
      if (board[r][c] === null || board[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}
