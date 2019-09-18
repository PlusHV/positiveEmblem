import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';
import React from 'react';
import Select from 'react-select';
import './App.css';
import heroes from './heroInfo.json';
import { CalculateStat } from './StatCalculation.js';

class Stats extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      level: 1,
      merge: 10,
      heroName: "",
      weapon: "",
      assist: "",
      special: "",
      askill: "",
      bskill: "",
      cskill: "",
      sseal: ""
      //
    };
    //this.level = 1;  
   //this.onLevelChange = this.onLevelChange.bind(this);
 }  
 onLevelChange(e){
  this.setState({level: e.target.value});

    //this.forceUpdate();

  }
  onHeroChange(e){
    this.setState({heroName: e});
    //console.log(this.state.heroName);
    //this.forceUpdate();

  }
  render(){
    var  heroText = heroes.Items;

    var heroData = {}; //list of objects
    //var test =JSON.parse(heroText[20]);
    
    for (let i = 0; i < heroText.length; i++){
      heroData[heroText[i].name] = heroText[i]; //set up object for hero
      //heroData[heroText[i].name] = JSON.parse(heroText[i]);

    }

    var heroList = Object.keys(heroData);

    var heroList2 = [];

    for (var key of heroList){
      heroList2.push({value: key, label: key});
    }

    const spacing = {
     border: '2px solid #555',
     width: '50px',
     height: '10px',
     lineHeight: '10px',
     textAlign: 'center',
   };   


   var hero = this.state.heroName.value;

   if (heroData[hero] == null){
    hero = "";
    
  }

  const statText = ["Level", "Merge", "HP", "Atk", "Spd", "Def", "Res" ];
  const statNumbers = [40, 10, heroData[hero].basehp, heroData[hero].baseatk, heroData[hero].basespd, heroData[hero].basedef, heroData[hero].baseres];
  const statGrowths = [5, 10, heroData[hero].growthhp, heroData[hero].growthatk, heroData[hero].growthspd, heroData[hero].growthdef, heroData[hero].growthres];

  const equipText = ["Weapon", "Assist", "Special", "A Skill", "B Skill", "C Skill", "S Seal"];
  const equippedSkill = ["Wo Dao (Def)", "Reposition", "Aether", "Distant Counter", "Wrath 3", "Attack Tactics 3", "Brazen Atk/Spd 3"];

  // console.log(CalculateStat(this.level, statGrowths[0], statGrowths[2], statNumbers[2] ));



  let tbody = [];
  tbody.push(<tr><td>Hero</td> <td colspan = "4"> 
    <Select 
    options={heroList2}
    value={this.state.heroName}
  onChange = {(e) => this.onHeroChange(e)  /* {(e) => this.onHeroChange(e)*/ } 
  /> </td></tr> );


  console.log(this.state.heroName);


    	for (let i = 0; i < statText.length; i++) { //rows
        let cells = [];

        cells.push(<td className = "statText">{statText[i]}</td>);

        if (i === 0){
          cells.push(<td className = "statNum"><input 
            value = {this.state.level} 
            type = "number" 
            min = "1" 
            max = "40" 
            
            onChange = {(e) => this.onLevelChange(e)} 
            />  </td>);
        } else{
          cells.push(<td className ="statNum">{CalculateStat(this.state.level, statGrowths[0], statGrowths[i], statNumbers[i] )}  </td>);
        }
        cells.push(<td style= {spacing}></td>);
        cells.push(<td className = "equipText">{equipText[i]}</td>);
        cells.push(<td className = "equippedSkill">{equippedSkill[i]}</td>);

        tbody.push(<tr key={i}>{cells}</tr>);
      }


      return (

        <div>
        <table id = "Stats" align = 'left'>
        <tbody>

        {tbody}
        </tbody>
        </table>

        </div>

        );
    }

} //end stats

class TicTacToeBoard extends React.Component {
  onClick(id) {
    if (this.isActive(id)) {
      this.props.moves.clickCell(id);
      this.props.events.endTurn();
    }
  }

  isActive(id) {
    if (!this.props.isActive) return false;
    if (this.props.G.cells[id] !== null) return false;
    return true;
  }

  render() {


    const cellStyle = {
      border: '1px solid #555',
      width: '50px',
      height: '50px',
      lineHeight: '50px',
      textAlign: 'center',
    };

    let tbody = [];
    for (let i = 0; i < 8; i++) { //rows
      let cells = [];
      for (let j = 0; j < 6; j++) { //columns
        const id = 6 * i + j;
        cells.push(
          <td style={cellStyle} key={id} onClick={() => this.onClick(id)}>
          {this.props.G.cells[id]}
          </td>
          );
      }
      tbody.push(<tr key={i}>{cells}</tr>);
    }

    return (

      <div>
      <table align = 'center'>
      <tbody>
      <tr>
      <td>
      <Stats/>
      </td>
      <td>
      <table id="board" align = 'center'>
      <tbody>{tbody}</tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>


      </div>
      );
  }
} //end board

const TicTacToe = Game({
  setup: () => ({ cells: Array(48).fill(null) }),

  moves: {
    clickCell(G, ctx, id) {
      G.cells[id] = ctx.currentPlayer;
    },
  },
});

const App = Client({
  game: TicTacToe,
  board: TicTacToeBoard,
});

export default App;
