import { Client } from 'boardgame.io/react';


import GameBoard from './GameBoard.js';








//Globals


//var heroStruct = makeHeroStruct();



const Game = {
  setup: () => ({ cells: Array(48).fill(null) }),

  moves: {
    clickCell(G, ctx, id) {
      G.cells[id] = ctx.currentPlayer;
      
    },
  },
};

const App = Client({
  game: Game,
  board: GameBoard,
  debug: false,
});

export default App;
