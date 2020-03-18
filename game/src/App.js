import { Client } from 'boardgame.io/react';
//import { Game } from 'boardgame.io/core';
// import React from 'react';
// import { CalculateStats } from './StatCalculation.js';
// import { DoBattle } from './Battle.js';
// import { makeHeroStruct } from './Hero.js';
// import './App.css';


import GameBoard from './GameBoard.js';
// import TeamElement from './TeamElement.js';
// import Stats from './Stats.js';
// import Skills from './Skills.js';
// import Field from './Field.js';
// import BattleWindow from './BattleWindow.js';

// //Json imports
// import heroData from './heroInfo.json';
// import weapons from './weapons.js';
// import specials from './skills/special.json';
// import assists from './skills/assist.json';
// import skills from './skillList.js';







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
