import {Engine, BoardManager} from './js/index'

let form = document.forms.UserPrefs;
form.onsubmit = init;

function init(e) {
  e.preventDefault();

  const depth = Number(form[0].value);
  const isPlayerWhite = form[2].checked;

  const [minimaxRadioBtn, alphaBetaRadioBtn] =  form['algorithm'];
  const useAlphaBeta = alphaBetaRadioBtn.checked;

  const quiescenceCheckBox = form['quiescence'];
  const useQuiescence =  quiescenceCheckBox.checked;

  const game = new Chess();
  const engine = new Engine(game, !isPlayerWhite, depth, useAlphaBeta, useQuiescence);

  const boardManager = new BoardManager(isPlayerWhite, game, engine);
  boardManager.hideGameResults();
}
