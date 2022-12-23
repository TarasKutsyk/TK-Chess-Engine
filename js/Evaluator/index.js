import {PieceSquareTables, PieceValues} from '../';

export class Evaluator {
  constructor(pieceActivityFactor) {
    this.currentEval = 0;

    this.pieceSquareTable = this.normalizeSquareTables(pieceActivityFactor);
    console.log(this.pieceSquareTable)

    this.letter_a_ascii = 'a'.charCodeAt(0);
  }

  normalizeSquareTables(normFactor) {
    for (const piece in PieceSquareTables) {
      const currentTable = PieceSquareTables[piece];

      // iterate through all the square values of the 8x8 chess grid
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          currentTable[i][j] = currentTable[i][j] * normFactor;
        }
      }
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

  updateEval(lastMove, isWhite) {
    // start with accounting the gain from moving the last piece to its square
    let evalChange = this.pieceActivityGain(lastMove, isWhite);

    // check for checkmate
    if (lastMove.san.includes('#'))
    {
      evalChange += PieceValues.k;
    } else {
      // check for pawn promotion
      if (lastMove.promotion) {
        evalChange += PieceValues[lastMove.promotion];
      }

      if (lastMove.captured) {
        // update eval based on the captured piece
        evalChange += PieceValues[lastMove.captured];
        // account for piece activity when capturing pieces
        evalChange += this.getSquareValue(lastMove.captured, lastMove.to, !isWhite);
      }
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

    if (isWhite) {
      return this.pieceSquareTable[piece][8 - i - 1][j];
    }
    // get mirrored value for black
    return this.pieceSquareTable[piece][i][j];
  }

  squareToIndex(square) {
    const columnLetter = square[0];
    const rowNumber = square[1];

    const columnIndex = columnLetter.charCodeAt(0) - this.letter_a_ascii;
    const rowIndex = rowNumber - 1;

    return {i: rowIndex, j: columnIndex};
  }
}
