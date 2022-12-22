import {PieceValues} from '../'

export const orderMoves = (moves) => {
  const compareMoves = (a, b) => {
    if (a.promotion) {
      return -1;
    }
    if (b.promotion) {
      return 1;
    }

    if (a.captured && !b.captured) {
      const capture_A_gain = PieceValues[a.captured] - PieceValues[a.piece];

      // if gain is at least 0, look at move A before B
      return -(capture_A_gain + 1);
    }
    if (!a.captured && b.captured) {
      const capture_B_gain = PieceValues[b.captured] - PieceValues[b.piece];

      // if gain is at least 0, look at move B before A
      return capture_B_gain + 1;
    }
    if (a.captured && b.captured) {
      const capture_A_gain = PieceValues[a.captured] - PieceValues[a.piece];
      const capture_B_gain = PieceValues[b.captured] - PieceValues[b.piece];

      // between two capture moves, look at the one with the most gain first
      return capture_B_gain - capture_A_gain;
    }

    // if both moves are non-captures, look for checks
    if (a.san.includes('+')) {
      return -1;
    }
    if (b.san.includes('+')) {
      return 1;
    }

    return 0;
  }

  return moves.sort(compareMoves);
}
