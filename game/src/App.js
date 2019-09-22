import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';
import React from 'react';
import Select from 'react-select-v2';
import './App.css';

import { CalculateStat } from './StatCalculation.js';


//Json imports
import heroData from './heroInfo.json';
import weapons from './weapons.js';
import specials from './skills/special.json';
import assists from './skills/assist.json';
import skills from './skills.js';


class Stats extends React.Component{
  constructor(props){
    super(props);
    this.state = playerHeroes[0];

}  
onLevelChange(e){
  this.setState({level: e.target.value});


}
onHeroChange(e){
  this.setState({heroID: e});
  var newHero = heroData[e.value];
  var weaponList = weapons[newHero.weapontype];
  console.log(newHero);
  var skillDropdowns = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weaponList},
                       "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                       "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                       "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal}
                     };
//var info =  "hero": heroData, "weapon": weaponList, "assist": assists, "special":specials, "a":skills["a"], "b":skills["b"], "c":skills["c", "seal":skills["seal"]};

for (const [key, value] of Object.entries(skillDropdowns)) {
 this.fillDropdown(value.list, value.info);
}

  let temp = Object.assign({}, this.state.heroSkills);
  temp["weapon"] = skillDropdowns["weapon"].list[newHero.weapon];
  temp["assist"] = skillDropdowns["assist"].list[newHero.assist];
  temp["special"] = skillDropdowns["special"].list[newHero.special];
  temp["a"] = skillDropdowns["a"].list[newHero.askill];
  temp["b"] = skillDropdowns["b"].list[newHero.bskill];
  temp["c"] = skillDropdowns["c"].list[newHero.cskill];
  temp["seal"] = skillDropdowns["seal"].list[newHero.sseal];

  this.setState({heroSkills: temp});

  playerHeroes[currentHero] = this.state;
}

onSkillChange(e, index){
  let temp = Object.assign({}, this.state.heroSkills);
  temp[index] = e;
  this.setState({heroSkills: temp});

}

fillDropdown(dropdownList, info){
  for (const [key, value] of Object.entries(info)) {
    dropdownList.push({value: key, label: value.name});
  }

}

render(){

  var hero = this.state.heroID.value;

  if (heroData[hero] == null){
    hero = "0";

  }
  var selectedHero = heroData[hero];

  var weaponList = weapons[selectedHero.weapontype]; 



var skillDropdowns = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weaponList},
                       "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                       "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                       "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal}
                     };
//var info =  "hero": heroData, "weapon": weaponList, "assist": assists, "special":specials, "a":skills["a"], "b":skills["b"], "c":skills["c", "seal":skills["seal"]};

for (const [key, value] of Object.entries(skillDropdowns)) {
 this.fillDropdown(value.list, value.info);
}

//console.log(selectedHero.weapon);

const statText = ["Level", "Merge", "HP", "Atk", "Spd", "Def", "Res" ];
const statNumbers = [40, 10, selectedHero.basehp, selectedHero.baseatk, selectedHero.basespd, selectedHero.basedef, selectedHero.baseres];
const statGrowths = [5, 10, selectedHero.growthhp, selectedHero.growthatk, selectedHero.growthspd, selectedHero.growthdef, selectedHero.growthres];

const equipText = ["weapon", "assist", "special", "a", "b", "c", "seal"];
const equippedSkill = [ weaponList[this.state.heroSkills["weapon"].value], assists[this.state.heroSkills["assist"].value], 
specials[this.state.heroSkills["special"].value],
skills.a[this.state.heroSkills["a"].value], skills.a[this.state.heroSkills["b"].value], 
skills.c[this.state.heroSkills["c"].value], skills.seal[this.state.heroSkills["seal"].value]
];

// console.log(CalculateStat(this.level, statGrowths[0], statGrowths[2], statNumbers[2] ));

const dropDownTheme = theme => ({
      ...theme,
      borderRadius: 0,
      colors: {
        ...theme.colors,
        primary25: 'black', // hovering 
        primary: 'royalblue', //already selected
        primary50: 'navy',
        neutral0: '#212C37', //background
        neutral80: 'silver', // text in text box
      },
    });
const customStyles = {
              container: (base) => ({
                ...base,
                display:'inline-block',
                width: 40,
            }),
            valueContainer: (base) => ({
                ...base,
                minHeight: 10,
            })
}
let tbody = [];
tbody.push(<tr key = "hero"><td key = "heroText">Hero</td>
  <td colSpan = "4" key = "selectedHero"> 
  <Select
  theme = {dropDownTheme} 
  options={skillDropdowns["hero"].list}
  value={this.state.heroID}
onChange = {(e) => this.onHeroChange(e)  /* {(e) => this.onHeroChange(e)*/ } 
/> </td></tr> );


//console.log(this.state.heroName);


  	for (let i = 0; i < statText.length; i++) { //rows
      let cells = [];

      cells.push(<td className = "statText" key = {statText[i]} >{statText[i]}</td>);

      if (i === 0){
        cells.push(<td className = "statNum" key = {statNumbers[i]}>
          <input
          className = "numberInput"
          value = {this.state.level} 
          type = "number" 
          min = "1" 
          max = "40" 
          onChange = {(e) => this.onLevelChange(e)} 
          />  
          </td>);
      } else{
        cells.push(<td className ="statNum" key = {statNumbers[i]}>{CalculateStat(this.state.level, statGrowths[0], statGrowths[i], statNumbers[i] )}  </td>);
      }

      cells.push(<td className= "spacing" key = {i}></td>);
      cells.push(<td className = "equipText" key = {equipText[i]}>{equipText[i]}</td>);



      cells.push(<td className = "equippedSkill" key = {equipText[i] + equippedSkill[i]} >
        
          <Select
            theme = {dropDownTheme} 
            options={skillDropdowns[equipText[i]].list}
            value={this.state.heroSkills[equipText[i]]}
          onChange = {(e, index) => this.onSkillChange(e,equipText[i])  /* {(e) => this.onHeroChange(e)*/ } 
          /> 
        </td>);

      tbody.push(<tr key={"row"+i}>{cells}</tr>);
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




    let tbody = [];
  for (let i = 0; i < 8; i++) { //rows
    let cells = [];
    for (let j = 0; j < 6; j++) { //columns
      const id = 6 * i + j;
      cells.push(
        <td className= "cellStyle" key={id} onClick={() => this.onClick(id)}>
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
      <td>"Player"</td>
      <td colSpan = "2">
        <Stats/>
      </td>
      <td rowSpan = "2">
        <table id="board" align = 'center'>
        <tbody>{tbody}</tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>"Enemy"</td>
      <td>"Skills"</td>
      <td>"Extra Info"</td>
    </tr>

    </tbody>
    </table>


    </div>
    );
}
} //end board

function makeHeroStruct(){

  function hero(){
    this["id"] = arguments[0];
    this["level"] = 1;
    this["merge"] = 0;
    this["heroID"] = "0";
    this["heroSkills"] = {"weapon": "0", "assist": "0", "special": "0", "a": "0", "b": "0", "c": "0", "seal": "0"};
  }  
  return hero;
}

var heroStruct = makeHeroStruct();



var playerHeroes =[new heroStruct(0), new heroStruct(1), new heroStruct(2), new heroStruct(3), new heroStruct(4)];

var currentHero = 0;
//console.log(playerHeroes);
// var skillDropdowns = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weaponList},
//                        "assist":{list: [], info: assists}, "special":{list: [], info: specials},
//                        "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
//                        "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal}
//                      };
// //var info =  "hero": heroData, "weapon": weaponList, "assist": assists, "special":specials, "a":skills["a"], "b":skills["b"], "c":skills["c", "seal":skills["seal"]};

// for (const [key, value] of Object.entries(skillDropdowns)) {
//  this.fillDropdown(value.list, value.info);
// }

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
  debug: false,
});

export default App;
