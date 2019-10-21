import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';
import React from 'react';
import { CalculateStats } from './StatCalculation.js';
import './App.css';



import TeamElement from './TeamElement.js';
import Stats from './Stats.js';
import Skills from './Skills.js';

//Json imports
import heroData from './heroInfo.json';
import weapons from './weapons.js';
import specials from './skills/special.json';
import assists from './skills/assist.json';
import skills from './skillList.js';





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
      "maxFilter": false,
      "fortLevel": 0,
      "blessing": "None"
    }

    this.selectNewMember = this.selectNewMember.bind(this);
    this.onLevelsChange = this.onLevelsChange.bind(this);
    this.onHeroChange = this.onHeroChange.bind(this);
    this.onSkillChange = this.onSkillChange.bind(this);
    this.onMaxFilterChange = this.onMaxFilterChange.bind(this);
    this.onBuffChange = this.onBuffChange.bind(this);
    this.onIVChange = this.onIVChange.bind(this);

    this.dragTeamMember = this.dragTeamMember.bind(this);
    this.dragOverTeamMember = this.dragOverTeamMember.bind(this);
    this.dropTeamMember = this.dropTeamMember.bind(this);
  } //end constructor



  updateHero(side, newIndex){ 
    //updates the selectedHero according to playerSide and currentHero values and other values dependent on it

    let newSelected = this.state.heroList[side][newIndex];
    this.setState({selectedMember: newSelected }); //updates the select member with the new hero in heroList


    this.setState({selectedHeroInfo: heroData[newSelected.heroID.value]});


    this.setState({weaponList: weapons[heroData[newSelected.heroID.value].weapontype]});


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

  onLevelsChange(e, type){ 

    let temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex][type] = Number(e.target.value);
    temp[this.state.playerSide][this.state.heroIndex].stats = CalculateStats(temp[this.state.playerSide][this.state.heroIndex]);

    this.setState({heroList: temp});
    this.setState({selectedMember: this.state.heroList[this.state.playerSide][this.state.heroIndex] }); //update the selectedHero according to changed level //todo
  }

  onHeroChange(e){    //Changing a hero will need to update the states of the board for stat display

    var temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].heroID = e;


    //Sets the initial position of the on the board 
    if (temp[this.state.playerSide][this.state.heroIndex].position === -1 && e.value !== "0"){
      
      let pos = this.getFilledPositions();
      let x = 0;
      let y = 42;
      let inc = -6;
      if (this.state.playerSide === "2"){
        y = 0;
        inc = 6;
      }
      
      while (temp[this.state.playerSide][this.state.heroIndex].position === -1 && (y >=0 && y<=42) ){
        if (! (pos.includes(y+x)) ){
          temp[this.state.playerSide][this.state.heroIndex].position = y+x;
          this.props.G.cells[y+x] = {"hero":heroData[e.value], "side": this.state.playerSide, "index": this.state.heroIndex};
        } else if (x <5){
          x+=1;
        } else if (x>=5){
          x= 0;
          y+=inc;
        } 

      }

    } else{
      this.props.G.cells[temp[this.state.playerSide][this.state.heroIndex].position] = {"hero":heroData[e.value], "side": this.state.playerSide, "index": this.state.heroIndex};
    }

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

    temp[this.state.playerSide][this.state.heroIndex].heroSkills = tSkills; //update the new heroes default skills
    temp[this.state.playerSide][this.state.heroIndex].stats = CalculateStats(temp[this.state.playerSide][this.state.heroIndex]); //recalculate stats

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });



    this.setState({selectedHeroInfo: heroData[newHero.id]});


    this.setState({weaponList: weapons[heroData[newHero.id].weapontype]});


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

  onBuffChange(e, index, stat){ //also handles debuffs and combat modifiers
    let temp = this.state.heroList;


    let buffList =  Object.assign({}, temp[this.state.playerSide][this.state.heroIndex][index]);
    

    buffList[stat] = e.target.value;

    temp[this.state.playerSide][this.state.heroIndex][index] = buffList;
    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });

  }

  onIVChange(e, type){
    let temp = this.state.heroList;


    let ivList =  Object.assign({}, temp[this.state.playerSide][this.state.heroIndex].iv);
    

    //if either iv is set to neutral, set the other one to neutral as well.
    if (e.target.value === "neutral"){
      ivList.asset = "neutral";
      ivList.flaw = "neutral";
    } else{
    ivList[type] = e.target.value;
    }

    temp[this.state.playerSide][this.state.heroIndex].iv = ivList;

    temp[this.state.playerSide][this.state.heroIndex].stats = CalculateStats(temp[this.state.playerSide][this.state.heroIndex]);
    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });

  }

  getFilledPositions(){
    let positions = [];
    let temp = this.state.heroList["1"].concat(this.state.heroList["2"]);
    
    // eslint-disable-next-line
    for (let x of temp){
      if (x.position>=0)
        positions.push(x.position);
    }


    return positions
  }

  // onClick(id) {
  //   if (this.isActive(id)) {
  //     this.props.moves.clickCell(id);
  //     this.props.events.endTurn();
  //   }
  // }

  // isActive(id) {
  //   if (!this.props.isActive) return false;
  //   if (this.props.G.cells[id] !== null) return false;
  //   return true;
  // }
  dragTeamMember(ev){
    ev.dataTransfer.setData("index", parseInt(ev.target.id) ); //Gets the id, which is the index in heroList

  }
  dragOverTeamMember(ev){
    ev.preventDefault();
  }

  dropTeamMember(ev){
    ev.preventDefault();
    let dragData = ev.dataTransfer.getData("index");
    let dragSide = "";
    if (dragData>=5){
      dragData -=5;
      dragSide = "2"; 
    } else{
      dragSide = "1";
    }

    let dropData = parseInt(ev.target.id);
    let dropSide = "";
    if (dropData>=5){
      dropData -=5;
      dropSide = "2"; 
    } else{
      dropSide = "1";
    }

    let temp = this.state.heroList;
    let dragTemp = temp[dragSide][dragData];
    temp[dragSide][dragData] = temp[dropSide][dropData];
    temp[dropSide][dropData] = dragTemp;

    this.setState({heroList: temp});

    this.updateHero(dropSide, dropData);
    this.setState({heroIndex: dropData});
    this.setState({playerSide: dropSide})

  }



  dragBoardMember(ev){
    ev.dataTransfer.setData("text", ev.target.id ); 
  }
  dragOverBoard(ev){
    ev.preventDefault();
  }

  dropBoardMember(ev){
    ev.preventDefault();
    let dragData = JSON.parse(ev.dataTransfer.getData("text"));

    let dragIndex = dragData.index;
    let dragSide = dragData.side;

    let dropPosition = parseInt(ev.target.id);



    //if spot is already filled and don't do anything (for now)
    if (this.props.G.cells[dropPosition] !==null){

      //todo initiate battle if in proper range and it is opposite side as dragged

      //todo use assist skills if in proper range and it is on same side



      return;
    }

    let temp = this.state.heroList;


    //remove old from board
    this.props.G.cells[temp[dragSide][dragIndex].position] = null;
    

    //update for new position
    this.props.G.cells[dropPosition] = dragData;
    temp[dragSide][dragIndex].position = dropPosition;


    this.setState({heroList: temp});
    //this.updateHero(dropSide, dropData);
    this.setState({selectedMember: temp[dragSide][dragIndex] });


  }


  render() {

    let highLightedCell = this.state.heroList[this.state.playerSide][this.state.heroIndex].position; 

    let tbody = [];
    for (let i = 0; i < 8; i++) { //rows
      let cells = [];
        for (let j = 0; j < 6; j++) { //columns
          const id = 6 * i + j;
          if (this.props.G.cells[id] != null){
            let cellClass = "cellStyle";

            if (id  === highLightedCell){
              cellClass = "highlightedCellStyle"
            }

            let positions = this.getFilledPositions();


            if (positions.includes(id)){
              cells.push(
                <td className= {cellClass} key={id} onClick={(side) => this.selectNewMember(this.props.name, i)}
                  id = {id}
                  onDragOver = {(e) => this.dragOverBoard(e)}
                  onDrop = {(e) => this.dropBoardMember(e)} >

                <img src= {require('./art/' +  this.props.G.cells[id].hero.art + '/Face_FC.png') } 
                    className = "heroFace" 
                    alt = {this.props.G.cells[id].hero.name}
                    draggable = "true"
                    id =  {JSON.stringify(this.props.G.cells[id])}
                    onDragStart = {(e) => this.dragBoardMember(e)} />
                </td>
                );

            } else{
              cells.push(
                <td className= {cellClass} key={id} 
                  id = {id}
                  onDragOver = {(e) => this.dragOverBoard(e)}
                  onDrop = {(e) => this.dropBoardMember(e)} >
                  11111
                </td>
                );              
            }


          } else{
             cells.push(
            <td className= "cellStyle" key={id}
              id = {id}
              onDragOver = {(e) => this.dragOverBoard(e)}
              onDrop = {(e) => this.dropBoardMember(e)} >


            </td>
            );
          }
          ////{this.props.G.cells[id]}
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
            selector = {this.selectNewMember}
            drag = {this.dragTeamMember}
            dragOver = {this.dragOverTeamMember}
            drop = {this.dropTeamMember} />
        </td>

        <td colSpan = "2">
          <Stats 
              gameState = {this.state} 
              levelChange = {this.onLevelsChange}
              heroChange = {this.onHeroChange}  
              buffChange = {this.onBuffChange}
              ivChange = {this.onIVChange} />
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
            selector = {this.selectNewMember}
            drag = {this.dragTeamMember}
            dragOver = {this.dragOverTeamMember}
            drop = {this.dropTeamMember} />            
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
    this["dragonflower"] = 0;
    this["heroID"] = {value: "0", label: ""};
    this["iv"] = {asset: "Neutral", flaw: "Neutral"};
    this["heroSkills"] = {"weapon": {value: "0", label: ""}, "assist": {value: "0", label: ""}, "special": {value: "0", label: ""}, 
                          "a": {value: "0", label: ""}, "b": {value: "0", label: ""}, "c": {value: "0", label: ""}, "seal": {value: "0", label: ""} 
                        };
    this["buff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["debuff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["combat"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["rarity"] = 5;
    this["stats"] = {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0}
    this["summonerSupport"] = "None";
    this["allySupport"] = {"hero": "0", "level": "None" };
    this["blessing"] = "None";
    this["position"] = -1;
  }  
  return hero;
}

var heroStruct = makeHeroStruct();



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
