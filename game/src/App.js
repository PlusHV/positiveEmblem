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


class TeamElement extends React.Component{
  constructor(props){
    super(props);
    this.state = {"team": this.props.gameState.heroList[this.props.name]};
  }


  render(){
    let tbody = [];
    for (let i = 0; i < this.state.team.length; i++) { //rows
      let cells = [];
      cells.push(
          <td className= "teamMember" key={i} onClick={(side) => this.props.selector(this.props.name, i)}>
          {this.state.team[i].id}
          </td>
          );
      
      tbody.push(<tr key={i}>{cells}</tr>);
    }



    return(
        <table id = "Team" >
        <tbody>

        {tbody}
        </tbody>
        </table>
      );
  }
}

class Stats extends React.Component{
  constructor(props){
  super(props);


  //this.state = heroList[playerSide][heroIndex];//heroList[currentHero];
  }





  render(){


  //var info =  "hero": heroData, "weapon": weaponList, "assist": assists, "special":specials, "a":skills["a"], "b":skills["b"], "c":skills["c", "seal":skills["seal"]};

    // for (const [key, value] of Object.entries(skillDropdowns)) {
    //  this.fillDropdown(value.list, value.info);
    // }


  let currentHeroInfo = heroData[this.props.gameState.selectedHero.heroID.value];


  const statText = ["Level", "Merge", "HP", "Atk", "Spd", "Def", "Res" ];
  const statNumbers = [40, 10, currentHeroInfo.basehp, currentHeroInfo.baseatk, currentHeroInfo.basespd, currentHeroInfo.basedef, currentHeroInfo.baseres];
  const statGrowths = [5, 10, currentHeroInfo.growthhp, currentHeroInfo.growthatk, currentHeroInfo.growthspd, currentHeroInfo.growthdef, currentHeroInfo.growthres];

  const equipText = ["weapon", "assist", "special", "a", "b", "c", "seal"];
  const equippedSkill = [ this.props.gameState.weaponList[this.props.gameState.selectedHero.heroSkills["weapon"].value], 
  assists[this.props.gameState.selectedHero.heroSkills["assist"].value], 
  specials[this.props.gameState.selectedHero.heroSkills["special"].value],
  skills.a[this.props.gameState.selectedHero.heroSkills["a"].value], skills.a[this.props.gameState.selectedHero.heroSkills["b"].value], 
  skills.c[this.props.gameState.selectedHero.heroSkills["c"].value], skills.seal[this.props.gameState.selectedHero.heroSkills["seal"].value]
  ];



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
    options={this.props.gameState.skillDropdowns["hero"].list}
    value={this.props.gameState.selectedHero.heroID}
  onChange = {(e) => this.props.heroChange(e)  /* {(e) => this.onHeroChange(e)*/ } 
  /> </td></tr> );




    	for (let i = 0; i < statText.length; i++) { //rows
        let cells = [];

        cells.push(<td className = "statText" key = {statText[i]} >{statText[i]}</td>);

        if (i === 0){
          cells.push(<td className = "statNum" key = {"stat" +statText[i]}>
            <input
            className = "numberInput"
            value = {this.props.gameState.selectedHero.level} 
            type = "number" 
            min = "1" 
            max = "40" 
            onChange = {(e) => this.props.levelChange(e)} 
            />  
            </td>);
        } else{
          cells.push(<td className ="statNum" key = {"stat" + statNumbers[i]}>{CalculateStat(this.props.gameState.selectedHero.level, statGrowths[0], statGrowths[i], statNumbers[i] )}  </td>);
        }

        cells.push(<td className= "spacing" key = {i}></td>);
        cells.push(<td className = "equipText" key = {equipText[i]}>{equipText[i]}</td>);



        cells.push(<td className = "equippedSkill" key = {"equip:" + equippedSkill[i]} >
          
            <Select
              theme = {dropDownTheme} 
              options={this.props.gameState.skillDropdowns[equipText[i]].list}
              value={this.props.gameState.selectedHero.heroSkills[equipText[i]]}
            onChange = {(e, index) => this.props.skillChange(e,equipText[i])  /* {(e) => this.onHeroChange(e)*/ } 
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
  constructor(props){
    super(props);


    let initDropdowns = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weapons["sword"]},
                         "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                         "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                         "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal}
                        };

    for (var [key, value] of Object.entries(initDropdowns)) {
      this.fillDropdown(value.list, value.info);
    }                

    this.state = {
      "heroList": { 
        "1":[new heroStruct(0), new heroStruct(1), new heroStruct(2), new heroStruct(3), new heroStruct(4)],
        "2": [new heroStruct(5), new heroStruct(6), new heroStruct(7), new heroStruct(8), new heroStruct(9), new heroStruct(10)]
      },
      "heroIndex": 0, //The index of the hero in the heroList
      "playerSide": "1", //The side of the hero. 1 means player, 2 means enemy
      "skillDropdowns": initDropdowns,
      "selectedHero": new heroStruct(0), //The current struct in heroList
      "weaponList": weapons["sword"],
      "selectedHeroInfo": heroData["0"] //The current hero's info


    }
    this.selectNewHero = this.selectNewHero.bind(this);
    this.onLevelChange = this.onLevelChange.bind(this);
    this.onHeroChange = this.onHeroChange.bind(this);
    this.onSkillChange = this.onSkillChange.bind(this);



  }//end constructor



  updateHero(side, newIndex){ 
    //updates the selectedHero according to playerSide and currentHero values and other values dependent on it
    //this.setState({level: e.target.value});
    let newSelected = this.state.heroList[side][newIndex];
    this.setState({selectedHero: newSelected }); //updates the select hero
    //this.state.selectedHero = this.state.heroList[this.state.playerSide][this.state.heroIndex];

    this.setState({selectedHeroInfo: heroData[newSelected.heroID.value]});
    //this.state.selectedHeroInfo = heroData[selectedHero.id];

    //set weaponlist and update dropdown

    this.setState({weaponlist: weapons[heroData[newSelected.heroID.value].weapontype]});
    //weaponList = weapons[selectedHeroInfo.weapontype];

    //skillDropdowns[weapon].info = weaponList;
    //later should update all other dropdowns

    this.updateDropdowns(weapons[heroData[newSelected.heroID.value].weapontype]);


  }

  updateDropdowns(newWeaponList){
    console.log(newWeaponList);
    let dropTemp = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: newWeaponList},
                         "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                         "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                         "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal}
                   };

    // this.setState({heroSkills: temp});


    for (var [key, value] of Object.entries(dropTemp)) {
      this.fillDropdown(value.list, value.info);
    }
    
    this.setState({skillDropdowns: dropTemp});
    return dropTemp;
  }

  fillDropdown(dropdownList, info){
    for (let [key, value] of Object.entries(info)) {
      dropdownList.push({value: key, label: value.name});
    }

  }

  selectNewHero(side, i){

    this.updateHero(side, i);

    this.setState({heroIndex: i});
    this.setState({playerSide: side})
  }

  onLevelChange(e){ //only selectedHero and heroList should be updated
    //this.setState({level: e.target.value});

    let temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].level = e.target.value;

    this.setState({heroList: temp});
    this.setState({selectedHero: this.state.heroList[this.state.playerSide][this.state.heroIndex] }); //update the selectedHero according to changed level
  }

  onHeroChange(e){    //Changing a hero will need to update the heroList, update skillsdropdowns, weapon list, and selectedHeroInfo - selected Hero will change but not its reference?

    var temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].heroID = e;

    //updates the id
   // this.setState({heroID: e});

    var newHero = heroData[e.value];

    //update the weaponList according to new hero selected
    //let newWeaponList = weapons[newHero.weapontype];
    var updatedDropdowns = this.updateDropdowns(weapons[newHero.weapontype]); //only really updates the weaponlist for now

    let tSkills = {}; //Object.assign({}, this.state.heroSkills);
    tSkills["weapon"] = updatedDropdowns["weapon"].list[newHero.weapon];
    tSkills["assist"] = updatedDropdowns["assist"].list[newHero.assist];
    tSkills["special"] = updatedDropdowns["special"].list[newHero.special];
    tSkills["a"] = updatedDropdowns["a"].list[newHero.askill];
    tSkills["b"] = updatedDropdowns["b"].list[newHero.bskill];
    tSkills["c"] = updatedDropdowns["c"].list[newHero.cskill];
    tSkills["seal"] = updatedDropdowns["seal"].list[newHero.sseal];

    temp[this.state.playerSide][this.state.heroIndex].heroSkills = tSkills;


    this.setState({heroList: temp});
    this.setState({selectedHero: temp[this.state.playerSide][this.state.heroIndex] });

  }

  onSkillChange(e, index){
    let temp = this.state.heroList;


    

    let skillList =  Object.assign({}, temp[this.state.playerSide][this.state.heroIndex].heroSkills);
    skillList[index] = e;


    temp[this.state.playerSide][this.state.heroIndex].heroSkills = skillList;
    this.setState({heroList: temp});
    this.setState({selectedHero: temp[this.state.playerSide][this.state.heroIndex] });
    //heroList[playerSide][heroIndex] = this.state;


  }


//updateHero();

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



    //this.updateHero();

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
      <td><TeamElement 
          name = "1" 
          gameState = {this.state} 
          selector = {this.selectNewHero} />
      </td>

      <td colSpan = "2">
        <Stats 
            gameState = {this.state} 
            levelChange = {this.onLevelChange}
            heroChange = {this.onHeroChange}
            skillChange = {this.onSkillChange}  />
      </td>
      <td rowSpan = "2">
        <table id="board" align = 'center'>
        <tbody>{tbody}</tbody>
        </table>
      </td>
    </tr>
    <tr>
      
      <td><TeamElement 
          name = "2" 
          gameState = {this.state} 
          selector = {this.selectNewHero} />
      </td>
      
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
    this["heroID"] = {value: "0", label: ""}
    this["heroSkills"] = {"weapon": {value: "0", label: ""}, "assist": {value: "0", label: ""}, "special": {value: "0", label: ""}, 
                          "a": {value: "0", label: ""}, "b": {value: "0", label: ""}, "c": {value: "0", label: ""}, "seal": {value: "0", label: ""} 
                        };
  }  
  return hero;
}

var heroStruct = makeHeroStruct();


//should have 3 things
//1. The coordinates to get the hero struct - have
//2. That heroInfo - don't have


//var info =  "hero": heroData, "weapon": weaponList, "assist": assists, "special":specials, "a":skills["a"], "b":skills["b"], "c":skills["c", "seal":skills["seal"]};



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
