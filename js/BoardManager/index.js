export class BoardManager {
  constructor(isPlayerWhite, game, engine) {
    this.isPlayerWhite = isPlayerWhite;
    this.game = game;
    this.engine = engine;
    this.resultsElement = document.querySelector('#game-results');

    const orientation = isPlayerWhite ? 'white' : 'black';
    const config = {
      draggable: true,
      orientation: orientation,
      position: 'start',
      onDragStart: this.onDragStart,
      onDrop: this.onDrop,
      onSnapEnd: this.onSnapEnd
    }

    this.board = Chessboard('myBoard', config);
    if (!isPlayerWhite) {
      window.setTimeout(this.computerMove, 0);
    }
  }

  onDragStart = (source, piece, position, orientation) => {
    // do not pick up pieces if the game is over
    if (this.game.game_over()) {
      return false;
    }

    // if the player is white, they can drag only white pieces
    if (this.isPlayerWhite && piece.search(/^b/) !== -1) return false;
    // if the player is black, they can drag only black pieces
    if (!this.isPlayerWhite && piece.search(/^w/) !== -1) return false;
  }

  computerMove = () => {
    const moveResult = this.engine.makeMove();

    // If the game is over before or after the computer move, display game results
    if (this.game.in_draw() || this.game.in_threefold_repetition() || this.game.in_stalemate()) {
      this.showGameResults('Draw');
    } else if (this.game.in_checkmate()) {
      const winner = this.getWinner();
      this.showGameResults(`${winner} won`);
    }

    if (moveResult) {
      this.board.position(this.game.fen());
      this.engine.logMove('Computer');
    }
  }

  // Player move handler
  onDrop = (source, target) => {
    // see if the move is legal
    const move = this.game.move({
      from: source,
      to: target,
      promotion: 'q' // always promote to a queen
    });
    // illegal move
    if (move === null) return 'snapback';

    this.engine.updateEval(move, true);
    this.engine.logMove('Player');
  }

  onSnapEnd = () => {
    this.board.position(this.game.fen());

    window.setTimeout(this.computerMove, 0);
  }

  showGameResults(result) {
    this.resultsElement.innerHTML = `<h1>${result}.</h1>
                                     <h3>Game PGN:</h3>
                                     <p>${this.game.pgn()}</p>`
    this.resultsElement.style.display = 'block';
  }

  getWinner() {
    if (this.game.history().length % 2 === 0) {
      return 'Black';
    } else {
      return 'White';
    }
  }

  hideGameResults() {
    this.resultsElement.style.display = 'none';
  }
}
