import {Evaluator} from "../Evaluator";
import {orderMoves} from "../"

export class Engine {
  constructor(game, isWhite, depth = 1,
              alphaBeta = true,
              quiescence = false,
              moveOrdering = true) {
    this.depth = depth;
    this.game = game;
    this.evaluator = new Evaluator(0.01, game);

    this.isWhite = isWhite;
    this.alphaBeta = alphaBeta;
    this.moveOrdering = moveOrdering;
    this.quiescence = quiescence;
  }


  minimaxSearch(isWhite, depth = this.depth) {
    const currentEval = this.evaluator.getCurrentEval();
    const currentPieceCounts = this.evaluator.getPieceCounts();

    // If there is no depth left, return evaluation of the position,
    // or continue the search using Quiescence Search, depending on the engine configuration
    if (depth === 0) {
      if (this.quiescence) {
        return this.quiescenceSearch(isWhite);
      }

      return currentEval;
    }

    // initialize best move evaluation, so that it gets updated on the first loop iteration
    let bestMoveEval = isWhite ? -Infinity : Infinity;
    let bestMove = null;

    // generate all the legal moves, using chess.js
    const possibleMoves = this.game.moves({verbose: true});
    if (!possibleMoves.length) {
      return currentEval;
    }
    // loop over all legal moves
    for (const currentMove of possibleMoves) {
      // make the current move on the board
      this.game.move(currentMove);
      // (lazy) update the evaluation according to the latest move
      this.evaluator.updateEval(currentMove, isWhite);

      // continue the search after making the current move (one node below)
      // and get the move evaluation as the return value
      let moveEval = this.minimaxSearch(!isWhite, depth - 1);

      // if the side to move is white, find the move with the highest evaluation
      if (isWhite && moveEval > bestMoveEval) {
        bestMoveEval = moveEval;
        bestMove = currentMove;
      // otherwise, find the move with the lowest evaluation
      } else if (!isWhite && moveEval < bestMoveEval) {
        bestMoveEval = moveEval;
        bestMove = currentMove;
      }

      // undo the board and evaluation updates, to continue the search at the next children node (next legal move)
      this.game.undo();
      this.evaluator.setCurrentEval(currentEval);
      // reset the piece counts
      this.evaluator.setPieceCounts(currentPieceCounts);
    }
    // if this is a top-level call, return the best move
    if (depth === this.depth) {
      return bestMove;
    }
    // otherwise, we are only interested in the move evaluation
    return bestMoveEval;
  }

  quiescenceSearch(isWhite) {
    let captureMoves = this.game.moves({verbose: true})
      .filter(move => move.captured);
    const currentEval = this.evaluator.getCurrentEval();
    const currentPieceCounts = this.evaluator.getPieceCounts();

    if (!captureMoves.length) {
      return currentEval;
    }

    let bestMoveEval = isWhite ? -Infinity : Infinity;

    for (const currentMove of captureMoves) {
      this.game.move(currentMove);
      this.evaluator.updateEval(currentMove, isWhite);

      let moveEval = this.quiescenceSearch(!isWhite);

      if (isWhite && moveEval > bestMoveEval) {
        bestMoveEval = moveEval;
      } else if (!isWhite && moveEval < bestMoveEval) {
        bestMoveEval = moveEval;
      }

      this.game.undo();
      this.evaluator.setCurrentEval(currentEval);
      this.evaluator.setPieceCounts(currentPieceCounts);
    }

    return bestMoveEval;
  }

  alphaBetaSearch(isWhite, alpha = -Infinity, beta = Infinity, depth = this.depth) {
    const currentEval = this.evaluator.getCurrentEval();
    const currentPieceCounts = this.evaluator.getPieceCounts();

    if (depth === 0) {
      if (this.quiescence) {
        return this.quiescenceSearchAlphaBeta(isWhite, alpha, beta);
      }
      return currentEval;
    }

    let bestMoveEval = isWhite ? -Infinity : Infinity;
    let bestMove = null;

    let possibleMoves = this.game.moves({verbose: true});

    if (!possibleMoves.length) {
      return currentEval;
    }
    // Use move ordering (by default) to order moves from more likely to be good, to less likely
    if (this.moveOrdering) {
      possibleMoves = orderMoves(possibleMoves);
    }

    for (const currentMove of possibleMoves) {
      this.game.move(currentMove);
      this.evaluator.updateEval(currentMove, isWhite);

      let moveEval = this.alphaBetaSearch(!isWhite, alpha, beta, depth - 1);

      // undo the last move
      this.game.undo();
      // undo evaluation change
      this.evaluator.setCurrentEval(currentEval);
      // reset the piece counts
      this.evaluator.setPieceCounts(currentPieceCounts);

      if (isWhite) {
        if (moveEval > bestMoveEval) {
          bestMoveEval = moveEval;
          bestMove = currentMove;
        }
        if (moveEval > alpha) {
          alpha = moveEval;
        }
        if (beta <= alpha) {
          // black has a better move
          break;
        }
      } else { // black's move
        if (moveEval < bestMoveEval) {
          bestMoveEval = moveEval;
          bestMove = currentMove;
        }
        if (moveEval < beta) {
          beta = moveEval;
        }
        if (beta <= alpha) {
          // white has a better move
          break;
        }
      }
    }

    if (depth === this.depth) {
      return bestMove;
    }

    return bestMoveEval;
  }

  // function for calculating moves evaluation
  alphaBetaScore(isWhite, depth, alpha, beta)  {
    let currentWhiteEval = this.evaluator.getCurrentEval();
    const currentPieceCounts = this.evaluator.getPieceCounts();

    if (depth === 0) {
      if (this.quiescence) {
        return this.quiescenceSearchAlphaBeta(isWhite, alpha, beta);
      }

      const sign = isWhite ? 1 : -1;
      // return evaluation relative to side to move
      return currentWhiteEval * sign;
    }

    let possibleMoves = this.game.moves({verbose: true});

    if (!possibleMoves.length) {
      return (isWhite ? 1 : -1) * currentWhiteEval;
    }
    // Use move ordering (by default) to order moves from more likely to be good, to less likely
    if (this.moveOrdering) {
      possibleMoves = orderMoves(possibleMoves);
    }

    for (const move of possibleMoves) {
      // make the current move on the board
      this.game.move(move);
      // (lazy) update the evaluation according to the latest move
      this.evaluator.updateEval(move, isWhite);

      // because of the relative evaluation being used, the win for one player is negative the win for other player
      // similarly, the alpha and beta parameters change signs for other player
      // moreover,  the lowest guaranteed result for one player is the best result for the other player,
      // and vice versa, so the alpha and beta params are switched
      const score = -this.alphaBetaScore(!isWhite, depth - 1, -beta, -alpha);

      // undo the last move
      this.game.undo();
      // undo evaluation change
      this.evaluator.setCurrentEval(currentWhiteEval);
      // reset the piece counts
      this.evaluator.setPieceCounts(currentPieceCounts);

      if (score >= beta ) {
        // if this condition is met, the other player already has a better move, so this branch is useless to calculate
        return beta;
      }
      if (score > alpha ) {
        // update the best result found so far
        alpha = score; // alpha acts like max in MiniMax
      }
    }

    // at this point, alpha is the evaluation of the best move found so far
    return alpha;
  }

  // function for searching for the best move
  alphaBetaNegamax(isWhite, alpha= -Infinity, beta= Infinity) {
    let currentWhiteEval = this.evaluator.getCurrentEval();
    const currentPieceCounts = this.evaluator.getPieceCounts();

    let bestMove = null;
    let possibleMoves = this.game.moves({verbose: true});

    // Use move ordering (by default) to order moves from more likely to be good, to less likely
    if (this.moveOrdering) {
      possibleMoves = orderMoves(possibleMoves);
    }

    for (const move of possibleMoves) {
      // make the current move on the board
      this.game.move(move);
      // (lazy) update the evaluation according to the latest move
      this.evaluator.updateEval(move, isWhite);

      // because of the relative evaluation being used, the win for one player is negative the win for other player
      // similarly, the alpha and beta parameters change signs for other player
      // moreover,  the lowest guaranteed result for one player is the best result for the other player,
      // and vice versa, so the alpha and beta params are switched
      const score = -this.alphaBetaScore(!isWhite, this.depth - 1, -beta, -alpha);

      // undo the last move
      this.game.undo();
      // undo evaluation change
      this.evaluator.setCurrentEval(currentWhiteEval);
      // reset the piece counts
      this.evaluator.setPieceCounts(currentPieceCounts);

      if (score > alpha) {
        // update the best result found so far
        alpha = score; // alpha acts like max in MiniMax
        bestMove = move;
      }
    }

    return bestMove;
}

  quiescenceSearchAlphaBeta(isWhite, alpha, beta) {
    const currentWhiteEval = this.evaluator.getCurrentEval();
    const currentPieceCounts = this.evaluator.getPieceCounts();

    const sign = isWhite ? 1 : -1;
    // standing pat: evaluate the position without any captures done
    const currentEval = currentWhiteEval * sign;
    // if the position is already worse for the other player, they won't go into it, so no need to continue the search
    if (currentEval >= beta) {
      return beta;
    }

    // The next three lines test if alpha can be improved by greatest possible material gain.
    // And even if this greatest gain is not enough to improve the score, the position is hopeless and can be abandoned
    const BIG_DELTA = 9; // queen value

    if ( currentEval < alpha - BIG_DELTA ) {
      return alpha;
    }

    if (alpha < currentEval) {
      alpha = currentEval;
    }
    // search through only capture moves
    let captureMoves = this.game.moves({verbose: true})
      .filter(move => move.captured);

    if (!captureMoves.length) {
      return (isWhite ? 1 : -1) * currentWhiteEval;
    }
    if (this.moveOrdering) {
      captureMoves = orderMoves(captureMoves);
    }

    for (const move of captureMoves) {
      // make the current move on the board
      this.game.move(move);
      // (lazy) update the evaluation according to the latest move
      this.evaluator.updateEval(move, isWhite);

      // because of the relative evaluation being used, the win for one player is negative the win for other player
      // similarly, the alpha and beta parameters change signs for other player
      // moreover,  the lowest guaranteed result for one player is the best result for the other player,
      // and vice versa, so the alpha and beta params are switched
      const score = -this.quiescenceSearchAlphaBeta(!isWhite, -beta, -alpha);

      // undo latest move
      this.game.undo();
      // undo evaluation change
      this.evaluator.setCurrentEval(currentWhiteEval);
      // reset the piece counts
      this.evaluator.setPieceCounts(currentPieceCounts);

      if (score >= beta) {
        // if this condition is met, the other player already has a better move, so this branch is useless to calculate
        return beta;   //  fail hard beta-cutoff
      }
      if (score > alpha) {
        // update the best result found so far
        alpha = score; // alpha acts like max in MiniMax
      }
    }
    // at this point, alpha is the evaluation of the best move found so far
    return alpha;
  }

  updateEval(move, isPlayerMove = false) {
    this.evaluator.updateEval(move, isPlayerMove ? !this.isWhite : this.isWhite);
  }

  makeMove = () => {
    // game over state
    if (this.game.game_over()) {
      return;
    }

    let computerMove;
    if (this.alphaBeta) {
      // computerMove = this.alphaBetaSearch(this.isWhite)
      computerMove = this.alphaBetaNegamax(this.isWhite);
    } else {
      computerMove = this.minimaxSearch(this.isWhite);
    }

    this.game.move(computerMove);
    this.updateEval(computerMove);
  }

  logMove(player) {
    console.log(`${player}: `, this.game.history().at(-1));
    console.log(`${player} Eval update: `, this.evaluator.getCurrentEval());
    console.log(`${player} Piece counts update: `, this.evaluator.getPieceCounts(false));
  }
}
