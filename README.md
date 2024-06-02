You can play online with this chess engine using the following link: https://vir1on.github.io/

Engine settings:
- You may want to **increase the difficulty** (engine depth) up to 3 to get a decent competition
- Consider **turning off the quiescence search** if the engine thinks too long in complex positions

- You can also scale the web page to 125% for better UX

This implementation is based on vanilla JavaScript and uses chess.js and chessboard.js utility libraries for moves generation & visualization.
Because of this, the **performance may be quite poor** with higher depth (difficulty) and quiescence search on.
**TODO** Solution: carry the moves calculation logic over to the back-end API.

The engine was built as my course project during the last year of my bachelor's degree at the LPNU.
