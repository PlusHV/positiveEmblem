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
      let cellClass = "teamMember";
      if (this.props.name === this.props.gameState.playerSide && i === this.props.gameState.heroIndex){
        cellClass = "highlightedTeamMember";
      }

      cells.push(
          <td className= {cellClass} key={i} onClick={(side) => this.props.selector(this.props.name, i)}>
          
          {this.state.team[i].id}
          </td>
          );
      
      tbody.push(<tr key={i}>{cells}</tr>);
    }
//{heroData[this.state.team[i].heroID.value].name}


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


  render(){



  let currentHeroInfo = heroData[this.props.gameState.selectedMember.heroID.value];


  const statText = ["Level", "Merge", "HP", "Atk", "Spd", "Def", "Res" ];
  const statNumbers = [40, 10, currentHeroInfo.basehp, currentHeroInfo.baseatk, currentHeroInfo.basespd, currentHeroInfo.basedef, currentHeroInfo.baseres];
  const statGrowths = [5, 10, currentHeroInfo.growthhp, currentHeroInfo.growthatk, currentHeroInfo.growthspd, currentHeroInfo.growthdef, currentHeroInfo.growthres];


  let tbody = [];
  tbody.push(<tr key = "hero"><td key = "heroText">Hero</td>
    <td colSpan = "4" key = "selectedHero"> 
    <Select
    theme = {dropDownTheme} 
    options={this.props.gameState.skillDropdowns["hero"].list}
    value={this.props.gameState.selectedMember.heroID}
  onChange = {(e) => this.props.heroChange(e)  } /> 
  </td></tr> );


    	for (let i = 0; i < statText.length; i++) { //rows
        let cells = [];

        cells.push(<td className = "statText" key = {statText[i]} >{statText[i]}</td>);

        if (i === 0){
          cells.push(<td className = "statNum" key = {"stat" +statText[i]}>
            <input
            className = "numberInput"
            value = {this.props.gameState.selectedMember.level} 
            type = "number" 
            min = "1" 
            max = "40" 
            onChange = {(e) => this.props.levelChange(e)} 
            />  
            </td>);
        } else{
          cells.push(<td className ="statNum" key = {"stat" + statNumbers[i]}>{CalculateStat(this.props.gameState.selectedMember.level, statGrowths[0], statGrowths[i], statNumbers[i] )}  </td>);
        }

        cells.push(<td className= "spacing" key = {i}></td>);

        //Boon drop bane drop
        //CurrentHP input Dragonflowers input
        // buff, debuff, drives/spur 
        cells.push(<td className= "spacing"></td>);
        cells.push(<td className= "spacing"></td>);
        cells.push(<td className= "spacing"></td>);


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

class Skills extends React.Component{

  render(){

    let tbody = [];

    const equipText = ["weapon", "assist", "special", "a", "b", "c", "seal"];
    const equippedSkill = [ this.props.gameState.weaponList[this.props.gameState.selectedMember.heroSkills["weapon"].value], 
                            assists[this.props.gameState.selectedMember.heroSkills["assist"].value], 
                            specials[this.props.gameState.selectedMember.heroSkills["special"].value],
                            skills.a[this.props.gameState.selectedMember.heroSkills["a"].value], skills.a[this.props.gameState.selectedMember.heroSkills["b"].value], 
                            skills.c[this.props.gameState.selectedMember.heroSkills["c"].value], skills.seal[this.props.gameState.selectedMember.heroSkills["seal"].value]
    ];     



    for (let i = 0; i < equipText.length; i++) { //rows
        let cells = [];

        cells.push(<td className = "equipText" key = {equipText[i]} >{equipText[i]}</td>);



        cells.push(<td className = "equippedSkill" key = {"equip:" + equippedSkill[i]} >
          
            <Select
              theme = {dropDownTheme} 
              options={this.props.gameState.skillDropdowns[equipText[i]].list}
              value={this.props.gameState.selectedMember.heroSkills[equipText[i]]}
            onChange = {(e, index) => this.props.skillChange(e,equipText[i])} 
            /> 
          </td>);


        tbody.push(<tr key={"skill row"+i}>{cells}</tr>);
    }

    tbody.push(
      <tr key = {"checkbox row"}> 
        <td className = "equippedSkill" key = {"maxFilter"}>
            Only Max Skills<input 
            type = "checkbox"
            value = {this.props.gameState.maxFilter}
            onChange = {(e) => this.props.maxFilterChange(e)}
              />
            
        </td>
      </tr>
    );

    return(

        <div>
        <table id = "Skills" align = 'left'>
        <tbody>

        {tbody}
        </tbody>
        </table>
        </div>



    );
  }
}


class TicTacToeBoard extends React.Component{
  constructor(props){
    super(props);

    let initDropdowns = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weapons["sword"]},
                         "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                         "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                         "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal}
                        };

    // eslint-disable-next-line
    for (var [key, value] of Object.entries(initDropdowns)) {

      this.fillDropdown(value.list, value.info, new heroStruct(0));
    }                

    this.state = {
      "heroList": { 
        "1":[new heroStruct(0), new heroStruct(1), new heroStruct(2), new heroStruct(3), new heroStruct(4)],
        "2": [new heroStruct(5), new heroStruct(6), new heroStruct(7), new heroStruct(8), new heroStruct(9), new heroStruct(10)]
      },
      "heroIndex": 0, //The index of the hero in the heroList
      "playerSide": "1", //The side of the hero. 1 means player, 2 means enemy
      "skillDropdowns": initDropdowns,
      "selectedMember": new heroStruct(0), //The current struct in heroList
      "weaponList": weapons["sword"],
      "selectedHeroInfo": heroData["0"], //The current hero's info
      "maxFilter": false
    }

    this.selectNewMember = this.selectNewMember.bind(this);
    this.onLevelChange = this.onLevelChange.bind(this);
    this.onHeroChange = this.onHeroChange.bind(this);
    this.onSkillChange = this.onSkillChange.bind(this);
    this.onMaxFilterChange = this.onMaxFilterChange.bind(this);
  } //end constructor



  updateHero(side, newIndex){ 
    //updates the selectedHero according to playerSide and currentHero values and other values dependent on it

    let newSelected = this.state.heroList[side][newIndex];
    this.setState({selectedMember: newSelected }); //updates the select member with the new hero in heroList


    this.setState({selectedHeroInfo: heroData[newSelected.heroID.value]});


    this.setState({weaponlist: weapons[heroData[newSelected.heroID.value].weapontype]});


    this.updateDropdowns(heroData[newSelected.heroID.value], this.state.maxFilter);//weapons[heroData[newSelected.heroID.value].weapontype]);

  }

  updateDropdowns(newHero, newMax){
    let dropTemp = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weapons[newHero.weapontype]},
                         "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                         "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                         "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal}
                   };



    // eslint-disable-next-line               
    for (let [key, value] of Object.entries(dropTemp)) {
      this.fillDropdown(value.list, value.info, newHero, newMax);
    }
    
    this.setState({skillDropdowns: dropTemp});
    return dropTemp;
  }

  fillDropdown(dropdownList, info, newHero, newMax){
    // eslint-disable-next-line
    for (let [key, value1] of Object.entries(info)) {
      if ( !('prf' in value1) || //if the object has no prf key (e.g. heroInfo) then just push to the list 
        value1.prf === false || //if the prf key says false, then push to the list
        ( !('users' in value1) || value1.users.includes( parseInt(newHero.id) ) )  
        ){ //if it has a user key (temp until those are added to skills) or if the users key has the id
          
          if (!newMax || (  !('max' in value1) || value1.max  ) ){
            dropdownList.push({value: key, label: value1.name});
          }
      }
    }

  }



  selectNewMember(side, i){ // selecting new member

    this.updateHero(side, i);

    this.setState({heroIndex: i});
    this.setState({playerSide: side})
  }

  onLevelChange(e){ 

    let temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].level = e.target.value;

    this.setState({heroList: temp});
    this.setState({selectedMember: this.state.heroList[this.state.playerSide][this.state.heroIndex] }); //update the selectedHero according to changed level //todo
  }

  onHeroChange(e){    //Changing a hero will need to update the states of the board for stat display

    var temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].heroID = e;


    var newHero = heroData[e.value];


    var updatedDropdowns = this.updateDropdowns(newHero, this.state.maxFilter); //only really updates the weaponlist for now



    let tSkills = {}; //Object.assign({}, this.state.heroSkills);
    tSkills["weapon"] = updatedDropdowns["weapon"].list.find(this.findMatchingValue, newHero.weapon);
    tSkills["assist"] = updatedDropdowns["assist"].list.find(this.findMatchingValue, newHero.assist);
    tSkills["special"] = updatedDropdowns["special"].list.find(this.findMatchingValue, newHero.special);
    tSkills["a"] = updatedDropdowns["a"].list.find(this.findMatchingValue, newHero.askill);
    tSkills["b"] = updatedDropdowns["b"].list.find(this.findMatchingValue, newHero.bskill);
    tSkills["c"] = updatedDropdowns["c"].list.find(this.findMatchingValue, newHero.cskill);
    tSkills["seal"] = updatedDropdowns["seal"].list.find(this.findMatchingValue, newHero.sseal);

    temp[this.state.playerSide][this.state.heroIndex].heroSkills = tSkills;


    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });



    this.setState({selectedHeroInfo: heroData[newHero.id]});


    this.setState({weaponlist: weapons[heroData[newHero.id].weapontype]});

  }

  findMatchingValue(item){
    return item.value === this;
  }

  onSkillChange(e, index){
    let temp = this.state.heroList;


    let skillList =  Object.assign({}, temp[this.state.playerSide][this.state.heroIndex].heroSkills);
    skillList[index] = e;

    temp[this.state.playerSide][this.state.heroIndex].heroSkills = skillList;
    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });
    //heroList[playerSide][heroIndex] = this.state;


  }
  onMaxFilterChange(e){

    this.updateDropdowns(this.state.selectedHeroInfo, e.target.checked);
    this.setState({maxFilter: e.target.checked});
  }



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
        <td><TeamElement 
            name = "1" 
            gameState = {this.state} 
            selector = {this.selectNewMember} />
        </td>

        <td colSpan = "2">
          <Stats 
              gameState = {this.state} 
              levelChange = {this.onLevelChange}
              heroChange = {this.onHeroChange}  />
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
            selector = {this.selectNewMember} />
        </td>
        
        <td>
          <Skills
            gameState = {this.state}
            skillChange = {this.onSkillChange}
            maxFilterChange = {this.onMaxFilterChange} />
        </td>
        <td>"Extra Info"</td>
      </tr>

      </tbody>
      </table>


      </div>
    );
  }
}


 //end board


//Globals
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
