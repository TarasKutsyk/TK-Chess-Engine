import {PieceSquareTables, PieceValues} from '../index.js';

export class Evaluator {
  constructor(pieceActivityFactor, game) {
    this.game = game;
    this.currentEval = 0;

    this.pieceSquareTable = this.normalizeSquareTables(pieceActivityFactor);
    this.pieceCounts = this.initializePieceCounts();

    // store for performance
    this.letter_a_ascii = 'a'.charCodeAt(0);
  }

  initializePieceCounts() {
    //object format: {[piece]: [whiteCount, blackCount]}
    return {
      n: [2, 2],  // knights
      b: [2, 2],  // bishops
      r: [2, 2],  // rooks
      q: [1, 1],  // queens
    }
  }

  getPieceCounts(copy = true) {
    if (!copy) {
      return this.pieceCounts;
    }

    return {
      n: [...this.pieceCounts.n],
      b: [...this.pieceCounts.b],
      r: [...this.pieceCounts.r],
      q: [...this.pieceCounts.q],
    }
  }

  normalizeSquareTables(normFactor) {
    function normalizeSquareTable(table) {
      // iterate through all the square values of the 8x8 chess grid
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          table[i][j] = table[i][j] * normFactor;
        }
      }
    }

    for (const piece in PieceSquareTables) {
      const currentTable = PieceSquareTables[piece];
      if (piece === 'k') {
        // the king piece has two tables: one for midgame, one for endgame
        normalizeSquareTable(currentTable.midgame);
        normalizeSquareTable(currentTable.endgame);
        continue;
      }

      normalizeSquareTable(currentTable);
    }

    return PieceSquareTables;
  }

  getCurrentEval(relativeToSide2Move = false, isWhite = true) {
    if (relativeToSide2Move) {
      const sign = isWhite ? 1 : -1;
      return this.currentEval * sign;
    }

    return this.currentEval;
  }

  setCurrentEval(value) {
    this.currentEval = value;
  }

  setPieceCounts(newPieceCounts) {
    // deep copy
    this.pieceCounts = {
      n: [...newPieceCounts.n],
      b: [...newPieceCounts.b],
      r: [...newPieceCounts.r],
      q: [...newPieceCounts.q],
    };
  }

  updateEval(lastMove, isWhite) {
    // check if the game is a draw
    if (this.isDraw()) {
      this.currentEval = 0;
      return this.currentEval;
    }
    // check for checkmate
    if (this.game.in_checkmate()) {
      this.currentEval = (isWhite ? 1: -1) * PieceValues.k;
      return this.currentEval;
    }

    // account for the gain from moving the last piece to its square (using piece-square tables)
    let evalChange = this.pieceActivityGain(lastMove, isWhite);

    // check for pawn promotion
    if (lastMove.promotion) {
      evalChange += PieceValues[lastMove.promotion];

      this.pieceCounts[lastMove.promotion][this.getSideIndex(isWhite)] += 1;
    }

    if (lastMove.captured) {
      // update eval based on the captured piece
      evalChange += PieceValues[lastMove.captured];
      // update piece counts (for the opponent)
      if (lastMove.captured !== 'p') {
        this.pieceCounts[lastMove.captured][this.getSideIndex(!isWhite)] -= 1;
      }
      // account for piece activity when capturing pieces
      evalChange += this.getSquareValue(lastMove.captured, lastMove.to, !isWhite);
    }

    // update the evaluation from the white's perspective
    if (isWhite) {
      this.currentEval = this.currentEval + evalChange;
    } else {
      this.currentEval = this.currentEval - evalChange;
    }

    return this.currentEval;
  }

  pieceActivityGain(move, isWhite) {
    const {from, to, piece} = move;

    const startingSquareValue = this.getSquareValue(piece, from, isWhite);
    const destinationSquareValue = this.getSquareValue(piece, to, isWhite);

    return destinationSquareValue - startingSquareValue;
  }

  getSquareValue(piece, square, isWhite) {
    const {i, j} = this.squareToIndex(square);

    let pieceTable = this.pieceSquareTable[piece];
    if (piece === 'k') {
      // determine, what piece table for the king to use, depending on how many pieces there are on the board
      pieceTable = this.isEndgame() ? pieceTable.endgame : pieceTable.midgame;
    }

    if (isWhite) {
      return pieceTable[8 - i - 1][j];
    }
    // get mirrored value for black
    return pieceTable[i][j];
  }

  squareToIndex(square) {
    const columnLetter = square[0];
    const rowNumber = square[1];

    const columnIndex = columnLetter.charCodeAt(0) - this.letter_a_ascii;
    const rowIndex = rowNumber - 1;

    return {i: rowIndex, j: columnIndex};
  }

  // returns 0 if side is true (white), else 1 (black)
  getSideIndex(side) {
    return Number(!side)
  }

  isEndgame() {
    const noQueens = this.pieceCounts.q.every(count => count === 0) // each player has no queens
    if (noQueens) {
      return true;
    }

    const minorPiecesCount = Object.entries(this.pieceCounts)
      .filter(([piece, count]) => piece !== 'q')
      .map(([piece, count]) => count);

    // count how many minor pieces each side has
    let whitePiecesTotal, blackPiecesTotal;

    if (this.pieceCounts.q[0] > 0) { // white has a queen
      const whiteMinorPiecesCount = minorPiecesCount.map(count => count[0]);
      whitePiecesTotal = whiteMinorPiecesCount.reduce((partialSum, a) => partialSum + a, 0);

      if (whitePiecesTotal > 1) {
        return false;
      }
    }

    if (this.pieceCounts.q[1] > 0) { // black has a queen
      const blackMinorPiecesCount = minorPiecesCount.map(count => count[1]);
      blackPiecesTotal = blackMinorPiecesCount.reduce((partialSum, a) => partialSum + a, 0);

      if (blackPiecesTotal > 1) {
        return false;
      }
    }

    return true;
  }

  isDraw() {
    return this.game.in_draw() || this.game.in_threefold_repetition() || this.game.in_stalemate();
  }
}
