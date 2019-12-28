import { Client } from 'boardgame.io/react';
//import { Game } from 'boardgame.io/core';
import React from 'react';
import { CalculateStats } from './StatCalculation.js';
import './App.css';



import TeamElement from './TeamElement.js';
import Stats from './Stats.js';
import Skills from './Skills.js';
import Field from './Field.js';

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
        "2": [new heroStruct(6), new heroStruct(7), new heroStruct(8), new heroStruct(9), new heroStruct(10), new heroStruct(11)]
      },
      "heroIndex": 0, //The index of the hero in the heroList
      "playerSide": "1", //The side of the hero. 1 means player, 2 means enemy
      "skillDropdowns": initDropdowns,
      "selectedMember": new heroStruct(0), //The current struct in heroList
      "weaponList": weapons["sword"],
      "selectedHeroInfo": heroData["0"], //The current hero's info
      "maxFilter": false,
      "fortLevel": 0,
      "blessingBuffs": { //the buffs each season will give a team - one for each team
        "1": {
          "Water": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Earth": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Wind": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Fire": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Light": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Dark": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Astra": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Anima": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0}
        } ,
        "2": {
          "Water": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Earth": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Wind": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Fire": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Light": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Dark": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Astra": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0},
          "Anima": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0}
        }
      },
      "season": {"L1": "Water", "L2": "Earth", "M1": "Light", "M2": "Dark"},
      "availableMovement": []
    }

    this.selectNewMember = this.selectNewMember.bind(this);
    this.onLevelsChange = this.onLevelsChange.bind(this);
    this.onHeroChange = this.onHeroChange.bind(this);
    this.onSkillChange = this.onSkillChange.bind(this);
    this.onMaxFilterChange = this.onMaxFilterChange.bind(this);
    this.onBuffChange = this.onBuffChange.bind(this);
    this.onBonusChange = this.onBonusChange.bind(this);
    this.onIVChange = this.onIVChange.bind(this);
    this.onSupportLevelChange = this.onSupportLevelChange.bind(this);
    this.onAllySupportChange = this.onAllySupportChange.bind(this);
    this.onFortLevelChange = this.onFortLevelChange.bind(this);
    this.onSeasonChange = this.onSeasonChange.bind(this);
    this.onHPChange = this.onHPChange.bind(this);

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

    let hero = temp[this.state.playerSide][this.state.heroIndex];
    hero[type] = Number(e.target.value);

    let oldMaxHP = hero.stats.hp;

    hero.stats = CalculateStats(hero, this.state.fortLevel,
       this.state.blessingBuffs[this.state.playerSide], this.state.season);

    hero.currentHP = this.AdjustHP(oldMaxHP, hero);




    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: hero }); //update the selectedHero according to changed level //todo
  }

  onHeroChange(e){    //Changing a hero will need to update the states of the board for stat display

    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex]; //the current hero


    let tempBlessings = this.state.blessingBuffs; //copy the blessing buffs

    let calcAll = false;

    //the heroInfo of replaced hero
    let oldHero = heroData[hero.heroID.value];

    //Removing old blessing buffs
    if ('type' in oldHero &&   (oldHero.type === "legendary" || oldHero.type === "mythic") ){

      //Loop through each stat for current team and the element and subtract the oldHero's buff from the team buff pool
      Object.keys(tempBlessings[this.state.playerSide][oldHero.blessing]).forEach((key, i) => {
        tempBlessings[this.state.playerSide][oldHero.blessing][key] -= oldHero.buff[key];
      });
      calcAll = true;
    }
    


    hero.heroID = e; //change the heroId of the current hero




    var newHero = heroData[e.value]; //get the heroData from heroInfo.json


    var updatedDropdowns = this.updateDropdowns(newHero, this.state.maxFilter); //only really updates the weaponlist for now


    //hero skill updating
    let tSkills = hero.heroSkills; //Object.assign({}, this.state.heroSkills);


    Object.keys(tSkills).forEach((key, i) => { //clear the skills on the hero for the new defaults that will be set
       hero = this.removeSkillEffect(tSkills[key].value , key, hero);
    });


    
    tSkills["weapon"] = updatedDropdowns["weapon"].list.find(this.findMatchingValue, newHero.weapon);
    tSkills["assist"] = updatedDropdowns["assist"].list.find(this.findMatchingValue, newHero.assist);
    tSkills["special"] = updatedDropdowns["special"].list.find(this.findMatchingValue, newHero.special);
    tSkills["a"] = updatedDropdowns["a"].list.find(this.findMatchingValue, newHero.askill);
    tSkills["b"] = updatedDropdowns["b"].list.find(this.findMatchingValue, newHero.bskill);
    tSkills["c"] = updatedDropdowns["c"].list.find(this.findMatchingValue, newHero.cskill);
    tSkills["seal"] = updatedDropdowns["seal"].list.find(this.findMatchingValue, newHero.sseal);

    hero.heroSkills = tSkills; //update the new heroes default skills


    //Passives/weapons only currently
    //Add the effects of the skills to the hero
    Object.keys(tSkills).forEach((key, i) => { //need to clear old effects
       hero = this.getSkillEffect(tSkills[key].value , key, hero, updatedDropdowns);
    });



    //Assign the hero's blessing if appropriate -> Otherwise, it will just have any blessing it had previously.
    //Also add the buff to that team
    if (newHero.type === "legendary" || newHero.type === "mythic"){
      hero.blessing = newHero.blessing;
      Object.keys(tempBlessings[this.state.playerSide][newHero.blessing]).forEach((key, i) => {
        tempBlessings[this.state.playerSide][newHero.blessing][key] += newHero.buff[key];
      });      
      calcAll = true;

    }


    
    hero.stats = CalculateStats(hero, this.state.fortLevel, tempBlessings[this.state.playerSide], this.state.season); //recalculate stats
    hero.currentHP = hero.stats.hp;

    //Sets the initial position of the on the board 
    if (hero.position === -1 && e.value !== "0"){ //if hero was blank
      hero.side = this.state.playerSide;
      let pos = this.getFilledPositions();
      let x = 0; //check column - always goes from left to right
      let y = 42; //row -> player one starts at bottom row
      let inc = -6; //going up a row requires -6
      if (this.state.playerSide === "2"){
        y = 0; //player 2 starts at top row
        inc = 6; //going down a row is 6
      }
      
      while (hero.position === -1 && (y >=0 && y<=42) ){ //not filled and rows are not out of bound
        if (! (pos.includes(y+x)) ){ //space is free
          hero.position = y+x;
          this.props.G.cells[y+x] = hero;
        } else if (x <5){ //move to next column
          x+=1;
        } else if (x>=5){ //end of row, start at first column and increment row
          x= 0;
          y+=inc;
        } 

      }

    } else{
      this.props.G.cells[hero.position] = hero;
    }

    temp[this.state.playerSide][this.state.heroIndex] = hero;


    //if old or new heroes were legendary/mythic, calculate stats for the team
    if (calcAll){
      temp[this.state.playerSide] = this.RecalculateTeamHeroStats(temp[this.state.playerSide], tempBlessings[this.state.playerSide]);
    }


    this.setState({heroList: temp});
    this.setState({selectedMember: hero });

    this.setState({blessingBuffs: tempBlessings});

    this.setState({selectedHeroInfo: heroData[newHero.id]});


    this.setState({weaponList: weapons[heroData[newHero.id].weapontype]});


  }

  findMatchingValue(item){
    return item.value === this;
  }

  onSkillChange(e, index){ //e is the new value, index is the key 
    let tempHeroList = this.state.heroList;
    let hero = this.state.heroList[this.state.playerSide][this.state.heroIndex]; //copy of heroList


    let skillList =  Object.assign({}, hero.heroSkills); //copy of hero's skill list

    hero = this.removeSkillEffect(skillList[index].value, index, hero);

    skillList[index] = e; //replace skill
    hero.heroSkills = skillList; //update the temp copy of heroList
    
    //TODO - implement skills  - weapons first
    //Add skill effect to the hero
    hero = this.getSkillEffect(e.value, index, hero, this.state.skillDropdowns); //need to clear old effects

    //TODO - add other types of skills 
    let oldMaxHP = hero.stats.hp;

    hero.stats = CalculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);

    hero.currentHP = this.AdjustHP(oldMaxHP, hero);
    
    tempHeroList[this.state.playerSide][this.state.heroIndex] = hero; //update the heroList with the updated hero
    //update states
    this.setState({heroList: tempHeroList}); 
    this.setState({selectedMember: hero });


  }

  getSkillEffect(id, skillType, currentHero, skillDropdowns){ //skilltype refers to the slot the skill originates from

    //TODO: Except for weapons and assists (maybe specials), the type of the skill should always key into the same key of the hero and then add their effect


    let updatedHero = currentHero;
    if (skillType === "weapon"){
      let pTemp = updatedHero.passive;
      pTemp["atk"] += skillDropdowns["weapon"].info[id].might; 
      updatedHero.passive = pTemp;

    } else if (skillDropdowns[skillType].info[id].type  === "passive") {
      let statMods = skillDropdowns[skillType].info[id].effect; //effect should contain the list of stats to buff
      let pTemp = updatedHero.passive;


      Object.keys(statMods).forEach((key, i) => {
        pTemp[key] += statMods[key];
      });

      updatedHero.passive = pTemp;
    } else if(skillDropdowns[skillType].info[id].type === "movement"){

      updatedHero.assist.type = "movement";
      updatedHero.assist.effect = skillDropdowns[skillType].info[id].effect;
      updatedHero.assist.range = skillDropdowns[skillType].info[id].range;
    }

    if ('skills' in skillDropdowns[skillType].info[id]) { // if the skill has additional skills
      for (var x of skillDropdowns[skillType].info[id].skills) {

        updatedHero = this.getSkillEffect(x[1], x[0], updatedHero, skillDropdowns); //add the extra skills as well
      }

    }

    return updatedHero; //hero with new skills

  }

  removeSkillEffect(id, skillType, currentHero){
    let updatedHero = currentHero; //copy of current hero

    if (skillType === "weapon"){
      let pTemp = updatedHero.passive;
      pTemp["atk"] -= this.state.weaponList[id]["might"]; //remove the weapon's attack
      updatedHero.passive = pTemp;

    } else if (this.state.skillDropdowns[skillType].info[id].type  === "passive") {
      let statMods = this.state.skillDropdowns[skillType].info[id].effect; //effect should contain the list of stats to buff
      let pTemp = updatedHero.passive;


      Object.keys(statMods).forEach((key, i) => {
        pTemp[key] -= statMods[key];
      });


      updatedHero.passive = pTemp;
    } else if(this.state.skillDropdowns[skillType].info[id].type === "movement"){
      updatedHero.assist = {};
    }


    if ('skills' in this.state.skillDropdowns[skillType].info[id]) { // if the skill has additional skills
      for (var x of this.state.skillDropdowns[skillType].info[id].skills) {
        updatedHero = this.removeSkillEffect(x[1], x[0], updatedHero); //remove the extra skills as well
      }

    }

    return updatedHero; //hero with new skills

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

  onBonusChange(e){
    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex]; 
    

    hero.bonus = e.target.checked;

    let oldMaxHP = hero.stats.hp;

    hero.stats =  CalculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);
    
    hero.currentHP = this.AdjustHP(oldMaxHP, hero);

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: hero});


  }

  onIVChange(e, type){
    let temp = this.state.heroList;

    let hero = temp[this.state.playerSide][this.state.heroIndex];
    let ivList =  Object.assign({}, hero.iv);
    

    //if either iv is set to neutral, set the other one to neutral as well.
    if (e.target.value === "neutral"){
      ivList.asset = "neutral";
      ivList.flaw = "neutral";
    } else{
    ivList[type] = e.target.value;
    }

    hero.iv = ivList;

    let oldMaxHP = hero.stats.hp;

    hero.stats = CalculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);
    
    hero.currentHP = this.AdjustHP(oldMaxHP, hero);

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });

  }

  //When support levels or blessings change
  onSupportLevelChange(e, type){
    let temp = this.state.heroList;

    let hero = temp[this.state.playerSide][this.state.heroIndex];

    hero[type] = e.target.value;

    let oldMaxHP = hero.stats.hp;

    hero.stats = CalculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);

    hero.currentHP = this.AdjustHP(oldMaxHP, hero);

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });


  }

  onAllySupportChange(e){
    var temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].allySupport = e;

    temp[this.state.playerSide][this.state.heroIndex].stats = CalculateStats(temp[this.state.playerSide][this.state.heroIndex], this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });


  }

  onFortLevelChange(e){

    this.setState({fortLevel: Number(e.target.value) });

    let updateHeroList = this.state.heroList;

    updateHeroList = this.RecalculateAllHeroStats(updateHeroList,  Number(e.target.value), this.state.blessingBuffs, this.state.season);


    this.setState({heroList: updateHeroList});
    
    this.setState({selectedMember: updateHeroList[this.state.playerSide][this.state.heroIndex] }); //update the selectedHero according to changed level //todo

  }

  onSeasonChange(e, type){
    var temp = this.state.season;
    temp[type] = e.target.value;
    
    this.setState({season: temp});

    let seasonHeroList = this.state.heroList;


    seasonHeroList = this.RecalculateAllHeroStats(seasonHeroList, this.state.fortLevel, this.state.blessingBuffs, temp); //update all heroes with new seasons

    this.setState({heroList: seasonHeroList });
    this.setState({selectedMember: seasonHeroList[this.state.playerSide][this.state.heroIndex] });


  }


  onHPChange(e){

    let temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].currentHP = Number(e.target.value);
    this.setState({heroList: temp});
    this.setState({selectedMember: this.state.heroList[this.state.playerSide][this.state.heroIndex] }); //update the selectedHero according to changed level //todo

  }

  getFilledPositions(){ //get positions that are occupied by a hero
    let positions = [];
    let temp = this.state.heroList["1"].concat(this.state.heroList["2"]); //merge two lists
    
    // eslint-disable-next-line
    for (let x of temp){
      if (x.position>=0)
        positions.push(x.position);
    }


    return positions
  }


  //drag Team member - the team elements
  dragTeamMember(ev){
    ev.dataTransfer.setData("text", ev.target.id ); //Gets the id, which is the index in heroList

  }
  dragOverTeamMember(ev){
    ev.preventDefault();
  }

  dropTeamMember(ev){
    ev.preventDefault();
    let dragData = JSON.parse(ev.dataTransfer.getData("text"));

   // let drag = this.indexToSideIndex(dragData.listIndex);

    let dragIndex = dragData.listIndex;
    let dragSide = dragData.side;

    let dropData = JSON.parse(ev.target.id);

    //let drop = this.indexToSideIndex(dropData.listIndex);

    let dropIndex = dropData.listIndex;
    let dropSide = dropData.side;

    let temp = this.state.heroList;

    //temp to hold the dragged member
    let dragTemp = temp[dragSide][dragIndex];

    //replace the dragged member with the member in dropped location
    temp[dragSide][dragIndex] = temp[dropSide][dropIndex];

    //put the dragged member into the dropped location
    temp[dropSide][dropIndex] = dragTemp;

    //they have swapped and need their listIndex updated - they are the same because they have swapped
    temp[dragSide][dragIndex].listIndex = dragData.listIndex;
    temp[dropSide][dropIndex].listIndex = dropData.listIndex;

    //also update sides
    temp[dragSide][dragIndex].side = dragData.side;
    temp[dropSide][dropIndex].side = dropData.side;

    this.setState({heroList: temp});

    this.updateHero(dropSide, dropIndex);
    this.setState({heroIndex: dropIndex});
    this.setState({playerSide: dropSide})

  }




//the board elements
  dragBoardMember(ev){

    ev.dataTransfer.setData("text", ev.target.id ); //id is the hero struct 

    let dragData = JSON.parse(ev.target.id);

    let oldHero = heroData[dragData.heroID.value];
    let move = this.GetMovement(oldHero.movetype);

    let pos = dragData.position;
    let movementList = [];

    for (let i = 0; i < 48; i++) { //rows
      if (this.GetDistance(pos, i) <= move)
        movementList.push(i);
    }

    this.setState({availableMovement: movementList});




  }
  dragOverBoard(ev){
    ev.preventDefault();
  }

  dragEnd(ev){
    ev.dataTransfer.clearData();

    this.setState({availableMovement: []});
  }

  dropBoardMember(ev){
    ev.preventDefault();

    let dragData = JSON.parse(ev.dataTransfer.getData("text"));

    //let drag = this.indexToSideIndex(dragData.listIndex);

    let dragIndex = dragData.listIndex; //the index of that team
    let dragSide = dragData.side; //the team dragged is on

    // let dragIndex = dragData.index;
    // let dragSide = dragData.side;

    let dropPosition = ev.target.id;

    //if the spot has a hero, convert that hero to an ID
    if (Number.isNaN(parseInt(dropPosition)) ){

      dropPosition = JSON.parse(dropPosition).position;
    } else{
      dropPosition = parseInt(dropPosition);
    }

    let temp = this.state.heroList;




    //if spot is already filled initiate assist and later battle
    if (this.props.G.cells[dropPosition] !==null){


      let dropIndex = this.props.G.cells[dropPosition].listIndex;
      let dropSide = this.props.G.cells[dropPosition].side;
      //todo initiate battle if in proper range and it is opposite side as dragged

      //todo use assist skills if in proper range and it is on same side
      let tempOrg = temp;


      //if (this.CheckAdjacent(dragData.position, this.props.G.cells[dropPosition].position )){
        //Check if in range for assist and they are on the same side
      if (this.GetDistance(dragData.position, this.props.G.cells[dropPosition].position) === dragData.assist.range && dragData.side === this.props.G.cells[dropPosition].side ){


        if (dragData.assist.type === "movement"){
          temp = this.ApplyMovementAssist(temp, dragData, this.props.G.cells[dropPosition], dragData.assist.effect); //should update temp accordingly
        }

        //TODO, implement other assist types as well

      }


      //need to clear the old ones, and add the new ones
        this.props.G.cells[tempOrg[dragSide][dragIndex].position] = null;
        this.props.G.cells[dropPosition] = null;

        this.props.G.cells[temp[dragSide][dragIndex].position] = temp[dragSide][dragIndex];
        this.props.G.cells[temp[dropSide][dropIndex].position] = temp[dropSide][dropIndex];

        this.setState({heroList: temp});
        this.setState({selectedMember: temp[dragSide][dragIndex] });



    } else { //regular movement



      //remove old from board
      this.props.G.cells[temp[dragSide][dragIndex].position] = null;
      

      //update for new position
      this.props.G.cells[dropPosition] = temp[dragSide][dragIndex]; //update in gameboard
      temp[dragSide][dragIndex].position = dropPosition; //update in team list


      this.setState({heroList: temp});
      //this.updateHero(dropSide, dropData);
      this.setState({selectedMember: temp[dragSide][dragIndex] });
    }

    this.dragEnd(ev);

  }

  //Given an index, get the side and index (for that side)
  indexToSideIndex(listIndex){

    let newIndex = 0;
    let newSide = "";

    if (listIndex>=5){
      newIndex = listIndex - 5;
      newSide = "2"; 
    } else{
      newIndex = listIndex;
      newSide = "1";
    }


    return {side:  newSide, teamIndex: newIndex};

  }

  //update the stats of the given team list - should be with new blessing buffs
  RecalculateTeamHeroStats(currentTeamList, newblessingBuffs){ //newFortLevel, newblessingBuffs, newSeasons){
    let tempTeam = currentTeamList;
    Object.keys(tempTeam).forEach((memberKey, j) => { //for each member

      let oldMaxHP = tempTeam[memberKey].stats.hp;

      tempTeam[memberKey].stats = CalculateStats(tempTeam[memberKey], this.state.fortLevel, newblessingBuffs, this.state.season); //new stats 

      tempTeam[memberKey].currentHP = this.AdjustHP(oldMaxHP, tempTeam[memberKey]);


    });
    return tempTeam;

  }

  //get an updated list of heroes and update all of their stats
  RecalculateAllHeroStats(currentHeroList, newFortLevel, newblessingBuffs, newSeasons){ 
    let tempList = currentHeroList;

    Object.keys(tempList).forEach((key, i) => { //for each team
        let tempTeam = tempList[key]; //copy of team to be modified

        Object.keys(tempTeam).forEach((memberKey, j) => { //for each member

          let oldMaxHP = tempTeam[memberKey].stats.hp;
          tempTeam[memberKey].stats = CalculateStats(tempTeam[memberKey], newFortLevel, newblessingBuffs[key], newSeasons); //new stats 

          tempTeam[memberKey].currentHP = this.AdjustHP(oldMaxHP, tempTeam[memberKey]);


        });

        tempList[key] = tempTeam; //update the team list
    });

    
    return tempList; //the heroList with stats recalculated
  }

  ApplyMovementAssist(updatedHeroList, assister, assistee, effect){

  let list = updatedHeroList;
  let assisterPos = this.PositionToRowColumn(assister.position);
  let assisteePos = this.PositionToRowColumn(assistee.position);


  if (assisterPos[0] === assisteePos[0]){ //same row, move along the row so change column

    let factor = assisteePos[1] - assisterPos[1];

    assisterPos[1]+= factor * effect[0];

    assisteePos[1]+= factor * effect[1];
  } else if (assisterPos[1] === assisteePos[1]){ //same column, move along the column, so change row

    let factor = assisteePos[0] - assisterPos[0];
    assisterPos[0]+= factor * effect[0];
    assisteePos[0]+= factor * effect[1];

  }



  //TODO - needs to make sure space is not occupied by someone else too
  if (assisterPos[1] > 5 || assisterPos[1] < 0 || assisteePos[1] > 5 || assisteePos[1] < 0 //column out of bounds
    || assisterPos[0] > 7 || assisterPos[0] < 0 || assisteePos[0] > 7 || assisteePos[0] < 0) { //row out of bounds


    return updatedHeroList; //return original list
  } else{

    list[assister.side][assister.listIndex].position = this.RowColumnToPosition(assisterPos);
    list[assistee.side][assistee.listIndex].position = this.RowColumnToPosition(assisteePos);

    return list;
  }


  }

  CheckAdjacent(first, second){
   let firstRC = this.PositionToRowColumn(first);
   let secondRC = this.PositionToRowColumn(second);


    //if rows are the same, and column difference is one
    if (firstRC[0] === secondRC[0] && Math.abs(firstRC[1] - secondRC[1]) === 1){
      return true;
    } else if (firstRC[1] === secondRC[1] && Math.abs(firstRC[0] - secondRC[0]) === 1)
      return true;
    
    return false;

  }

  //Get the amount of spaces from first position to the second position
  GetDistance(first, second){
    let firstRC = this.PositionToRowColumn(first);
    let secondRC = this.PositionToRowColumn(second);

    let distance = 0;

    distance += Math.abs(firstRC[1] - secondRC[1]); //difference in columns
    distance += Math.abs(firstRC[0] - secondRC[0]); //difference in rows

    return distance;

  }

  PositionToRowColumn(position){

    let row = Math.floor(position/6);
    let column = position%6;

    return [row, column];
  }

  RowColumnToPosition(rc){
    return rc[0] * 6 + rc[1];
  }

  //When max HP is changed, adjust current HP the same amount. Do not bring it below 0 though
  AdjustHP(oldMax, updatedHero){

    let newHP = updatedHero.currentHP + updatedHero.stats.hp - oldMax;

    if (newHP < 0)
      return 0;
    else
      return newHP; 

  }

  GetMovement(moveType){

    if (moveType === "Cavalry")
      return 3;
    else if (moveType === "Infantry" || moveType === "Flying")
      return 2;
    else if (moveType === "Armored")
      return 1;
    else
      return 0;
  }

  render() {

    let highLightedCell = this.state.heroList[this.state.playerSide][this.state.heroIndex].position; 

    let tbody = [];
    for (let i = 0; i < 8; i++) { //rows
      let cells = [];
        for (let j = 0; j < 6; j++) { //columns
          const id = 6 * i + j;
          //if (this.props.G.cells[id] != null){
            let cellClass = "cellStyle";

            if (id  === highLightedCell){
              cellClass = "highlightedCellStyle";
            } else if (this.state.availableMovement.includes(id)){
              cellClass = "movementCellStyle";
            }
            
            let positions = this.getFilledPositions();

            if (positions.includes(id)){ //if it has a person in the cell
              //onDrop = {(e) => this.dropBoardMember(e)} >
              cells.push(
                <td className= {cellClass} key={id} onClick={() => this.selectNewMember(this.props.G.cells[id].side, (this.props.G.cells[id].listIndex))} 
                  id = {id}
                  onDragOver = {(e) => this.dragOverBoard(e)}>
                  

                <img src= {require('./art/' +  heroData[this.props.G.cells[id].heroID.value].art + '/Face_FC.png') } 
                    className = "heroFace" 
                    alt = {heroData[this.props.G.cells[id].heroID.value].name}
                    draggable = "true"
                    id =  {JSON.stringify(this.props.G.cells[id])}
                    onDragStart = {(e) => this.dragBoardMember(e)}
                    onDrop = {(e) => this.dropBoardMember(e)}
                    onDragEnd = {(e) => this.dragEnd(e)} />
                </td>
                );

            } else{ //nobody in cell
              cells.push(
                <td className= {cellClass} key={id} 
                  id = {id}
                  onDragOver = {(e) => this.dragOverBoard(e)}
                  onDrop = {(e) => this.dropBoardMember(e)} >
                </td>
                );              
            }


          // } else{
          //    cells.push(
          //   <td className= "cellStyle" key={id}
          //     id = {id}
          //     onDragOver = {(e) => this.dragOverBoard(e)}
          //     onDrop = {(e) => this.dropBoardMember(e)} >


          //   </td>
          //   );
          // }
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
              ivChange = {this.onIVChange}
              hpChange = {this.onHPChange} />
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
            maxFilterChange = {this.onMaxFilterChange}
            supportLevelChange = {this.onSupportLevelChange}
            allySupportChange = {this.onAllySupportChange}
            bonusChange = {this.onBonusChange} />
          <Field  
            gameState = {this.state}
            fortChange = {this.onFortLevelChange}
            seasonChange = {this.onSeasonChange} />
          
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
    this["listIndex"] = arguments[0] % 6; //index of the hero for the list of heroes
    this["level"] = 1;
    this["merge"] = 0;
    this["dragonflower"] = 0;
    this["heroID"] = {value: "0", label: ""};
    this["iv"] = {asset: "Neutral", flaw: "Neutral"};
    this["heroSkills"] = {"weapon": {value: "0", label: ""}, "assist": {value: "0", label: ""}, "special": {value: "0", label: ""}, 
                          "a": {value: "0", label: ""}, "b": {value: "0", label: ""}, "c": {value: "0", label: ""}, "seal": {value: "0", label: ""} //hero skills equipped
                        };

    this["side"] = (Math.floor(arguments[0] / 6) + 1).toString();

    this["buff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["debuff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["combat"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    
    this["rarity"] = 5;
    this["stats"] = {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0}
    this["summonerSupport"] = "None";
    this["allySupportLevel"] = "None";
    this["allySupport"] = {value: "0", label: ""};
    this["blessing"] = "None";
    this["position"] = -1;
    this["currentHP"] = 0;
    this["passive"] = {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0} //set of stats from skills
    this["assist"] = {}
    this["range"] = 1;
    this["bonus"] = false;


  }  
  return hero;
}

var heroStruct = makeHeroStruct();



const TicTacToe = {
  setup: () => ({ cells: Array(48).fill(null) }),

  moves: {
    clickCell(G, ctx, id) {
      G.cells[id] = ctx.currentPlayer;
      
    },
  },
};

const App = Client({
  game: TicTacToe,
  board: TicTacToeBoard,
  debug: false,
});

export default App;
