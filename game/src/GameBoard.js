

import React from 'react';

import { calculateStats, calculateVisibleStats, calculateCombatStats} from './StatCalculation.js';
import { doBattle, getDistance, positionToRowColumn, rowColumnToPosition, calculateMovementEffect, checkValidMovement, getDamageType, checkCondition, getDistantHeroes, 
  calculateVariableEffect, calculateVariableCombat, getConditionalSpecial, removeConditionalSpecial, getSpecialDamage, heroValid, applyBuffList, heroReqCheck, checkCardinal, calculateReductionEffects} from './Battle.js';

import './App.css';


import TeamElement from './TeamElement.js';
import Stats from './Stats.js';
import Skills from './Skills.js';
import Field from './Field.js';
import BattleWindow from './BattleWindow.js';
import Map from './Map.js';

//Json imports
import heroData from './heroInfo.json';
import weapons from './weapons.js';
import specials from './skills/special.json';
import assists from './skills/assist.json';
import skills from './skillList.js';

var heroStruct = makeHeroStruct();

export const statusBuffs = { "airOrders": 0, "bonusDouble": 0, "dragonEffective": 0, "fallenStar": 0, "mobility+": 0 };

export const statusDebuffs = {"counterDisrupt": 0, "deepWounds": 0, "gravity": 0, "guard": 0, "isolation": 0, "panic": 0, "triangleAdept": 0};



//handles the gameboard as well as the heroes which
class GameBoard extends React.Component{

	

	constructor(props){
    super(props);

    let initDropdowns = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weapons["sword"]},
                         "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                         "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                         "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal},
                         "o":{list: [], info: skills.o}
                        };

    let blessings = { //the buffs each season will give a team - one for each team
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
    }

    let cells = Array(48).fill(null);
    let fortLevel = 0;
    let season = {"L1": "Water", "L2": "Earth", "M1": "Light", "M2": "Dark"};

    let heroList = {"1":[new heroStruct(0, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(1, {"value": "92", "label": "Eirika: Restoration Lady"}), new heroStruct(2, {"value": "166", "label": "Innes: Flawless Form"}), new heroStruct(3), new heroStruct(4), new heroStruct(5)],
        "2": [new heroStruct(7, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(8, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(9, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(10), new heroStruct(11), new heroStruct(12), new heroStruct(13)]};
     //skips id 5 for listIndex  

    for (let team in heroList){
      for (let teammate of heroList[team]){
        setHero(teammate, blessings, cells); //initialize heroes
      }

    }

    for (let team in heroList){
      for (let teammate of heroList[team]){
        teammate.stats = calculateStats(teammate, fortLevel, blessings, season); //initialize heroes
        teammate.visibleStats = calculateVisibleStats(teammate);
        teammate.currentHP = teammate.stats.hp;
      }//alculateStats(hero, fort, blessings, seasons

    }

    // eslint-disable-next-line
    for (var [key, value] of Object.entries(initDropdowns)) {

      fillDropdown(value.list, value.info, heroList["1"][0]);
    }                
    let initialHero = heroList["1"][0];
    let initialHeroData = heroData[initialHero.heroID.value];

    this.state = {
      "heroList": heroList,
      "heroIndex": 0, //The index of the hero in the heroList
      "playerSide": "1", //The side of the hero. 1 means player, 2 means enemy
      "skillDropdowns": initDropdowns,
      "selectedMember": initialHero, //The current struct in heroList
      "weaponList": weapons[initialHeroData.weapontype],
      "selectedHeroInfo": initialHeroData, //The current hero's info
      "maxFilter": false,
      "currentTurn": 0,
      "fortLevel": fortLevel,
      "blessingBuffs": blessings,
      "season": season,
      "availableMovement": [],
      "availableAssist": [],
      "availableAttack": [],
      "availableWarp": [],
      "draggedHero": null,
      "draggedHeroOrg": null,
      "draggedOver": null,
      "preBattleDamage": -1,
      "draggedOverOriginalHP": 0,
      "selectedStatusBuff": "airOrders",
      "selectedStatusEffect": "counterDisrupt",
      "cells": cells 

    }

    this.selectNewMember = this.selectNewMember.bind(this);
    this.onLevelsChange = this.onLevelsChange.bind(this);
    this.onHeroChange = this.onHeroChange.bind(this);
    this.onSkillChange = this.onSkillChange.bind(this);
    this.onMaxFilterChange = this.onMaxFilterChange.bind(this);
    this.onBuffChange = this.onBuffChange.bind(this);
    this.onBonusChange = this.onBonusChange.bind(this);
    this.onEndChange = this.onEndChange.bind(this);
    this.onIVChange = this.onIVChange.bind(this);
    this.onSupportLevelChange = this.onSupportLevelChange.bind(this);
    this.onAllySupportChange = this.onAllySupportChange.bind(this);
    this.onFortLevelChange = this.onFortLevelChange.bind(this);
    this.onTurnChange = this.onTurnChange.bind(this);

    this.onSeasonChange = this.onSeasonChange.bind(this);
    this.onHPChange = this.onHPChange.bind(this);
    this.onSpecialChargeChange = this.onSpecialChargeChange.bind(this);

    this.onSelectedStatusChange = this.onSelectedStatusChange.bind(this);
    this.onStatusChange = this.onStatusChange.bind(this);

    this.getFilledPositions = this.getFilledPositions.bind(this);


    this.dragBoardMember = this.dragBoardMember.bind(this);
    this.dragOverBoard = this.dragOverBoard.bind(this);
    this.dropBoardMember = this.dropBoardMember.bind(this);
    this.dragEnd = this.dragEnd.bind(this);

    this.dragTeamMember = this.dragTeamMember.bind(this);
    this.dragOverTeamMember = this.dragOverTeamMember.bind(this);
    this.dropTeamMember = this.dropTeamMember.bind(this);

    this.startTurn = this.startTurn.bind(this);
    this.endTurn = this.endTurn.bind(this);
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
                         "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal},
                         "o":{list: [], info: skills.o}
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
        ( !('users' in value1) || value1.users.includes(newHero.name ) )  
        ){ //if it has a user key (temp until those are added to skills) or if the users key has the id
          
          if (!newMax || (  !('max' in value1) || value1.max  ) ){ //if newMax toggle is set to false or the skill has no max value/ is max
            dropdownList.push({value: key, label: value1.name});
          }
      }
    }
    dropdownList.sort(compareLabels);

  }





  selectNewMember(side, i){ // selecting new member

    this.updateHero(side, i);

    this.setState({heroIndex: i});
    this.setState({playerSide: side})
  }

  //Changing of levels affecting stats - includes level, merge, flower and rarity
  onLevelsChange(e, type){ 

    let temp = this.state.heroList;

    let hero = temp[this.state.playerSide][this.state.heroIndex];

    let max = 0;
    let min = 0;

    if (type === "level"){
      max = 40;
      min = 1;
    } else if (type === "merge" || type === "dragonflower"){
      max = 10;
      min = 0;
    } else if (type === "rarity"){
      max = 5;
      min = 1;
    }

    hero[type] = Math.max(min, Math.min(Number(e.target.value), max) );

    let oldMaxHP = hero.stats.hp;

    hero.stats = calculateStats(hero, this.state.fortLevel,
       this.state.blessingBuffs[this.state.playerSide], this.state.season);
    hero.visibleStats = calculateVisibleStats(hero);

    hero.currentHP = this.adjustHP(oldMaxHP, hero);




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

    tSkills["weapon"] = updatedDropdowns["weapon"].list.find(findSkillWithName, newHero.weapon);
    tSkills["assist"] = updatedDropdowns["assist"].list.find(findSkillWithName, newHero.assist);
    tSkills["special"] = updatedDropdowns["special"].list.find(findSkillWithName, newHero.special);
    tSkills["a"] = updatedDropdowns["a"].list.find(findSkillWithName, newHero.askill);
    tSkills["b"] = updatedDropdowns["b"].list.find(findSkillWithName, newHero.bskill);
    tSkills["c"] = updatedDropdowns["c"].list.find(findSkillWithName, newHero.cskill);
    tSkills["seal"] = updatedDropdowns["seal"].list.find(findSkillWithName, newHero.sseal);

    hero.heroSkills = tSkills; //update the new heroes default skills

    //Passives/weapons only currently
    //Add the effects of the skills to the hero
    Object.keys(tSkills).forEach((key, i) => { //need to clear old effects
       hero = getSkillEffect(tSkills[key].value , key, hero, updatedDropdowns);
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


    
    hero.stats = calculateStats(hero, this.state.fortLevel, tempBlessings[this.state.playerSide], this.state.season); //recalculate stats
    hero.visibleStats = calculateVisibleStats(hero);
    hero.currentHP = hero.stats.hp;

    let newCells = this.state.cells;

    //Sets the initial position of the on the board 
    if (hero.position < 0 && e.value !== "0"){ //if hero was blank
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
          newCells[y+x] = hero;
        } else if (x <5){ //move to next column
          x+=1;
        } else if (x>=5){ //end of row, start at first column and increment row
          x= 0;
          y+=inc;
        } 

      }

    } else{ //put new hero in the old position
      
      if (e.value === "0"){ //if blank hero, take it off the board
        newCells[hero.position] = null;
        hero.position = -1;
      } else {

        newCells[hero.position] = hero;
      }

    }

    temp[this.state.playerSide][this.state.heroIndex] = hero;


    //if old or new heroes were legendary/mythic, calculate stats for the team
    if (calcAll){
      temp[this.state.playerSide] = this.recalculateTeamHeroStats(temp[this.state.playerSide], tempBlessings[this.state.playerSide]);
    }

    this.calculateAuraStats(temp, this.state.currentTurn); //recalculate aura stats


    this.setState({heroList: temp});
    this.setState({selectedMember: hero });

    this.setState({blessingBuffs: tempBlessings});

    this.setState({selectedHeroInfo: heroData[newHero.id]});


    this.setState({weaponList: weapons[heroData[newHero.id].weapontype]});
    this.setState({cells: newCells});


  }



  checkLabelExists(item){
    return item.name === this;
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
    hero = getSkillEffect(e.value, index, hero, this.state.skillDropdowns); //need to clear old effects

    //TODO - add other types of skills 
    let oldMaxHP = hero.stats.hp;

    hero.stats = calculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);

    hero.visibleStats = calculateVisibleStats(hero);

    hero.currentHP = this.adjustHP(oldMaxHP, hero);


    
    tempHeroList[this.state.playerSide][this.state.heroIndex] = hero; //update the heroList with the updated hero

    this.calculateAuraStats(tempHeroList, this.state.currentTurn); //recalculate aura stats

    //update states
    this.setState({heroList: tempHeroList}); 
    this.setState({selectedMember: hero });


  }


  removeSkillEffect(id, skillType, currentHero){
    let updatedHero = currentHero; //copy of current hero

    let effect = this.state.skillDropdowns[skillType].info[id].effect;
    let cdTriggerOrg = updatedHero.effects.cdTrigger;

    //let emptySkill =   Object.assign({}, this.state.skillDropdowns [skillType].info["0"]);

    if (skillType === "weapon"){
      let pTemp = updatedHero.passive;
      pTemp["atk"] -= this.state.weaponList[id]["might"]; //remove the weapon's attack


      //Add the passive stats from the weapon
      let passiveStats = this.state.weaponList[id].passive;

      for (let key in passiveStats){
        pTemp[key] -= passiveStats[key];

      }

      if ("effect" in this.state.skillDropdowns[skillType].info[id]){
        removeEffect(updatedHero, effect);
      }


      updatedHero.passive = pTemp;
      updatedHero.range = 0;

    } else if (skillType === "assist"){

      updatedHero.assist = {};

    } else if (skillType === "special"){
      updatedHero.special = {};
      updatedHero.special.cd = -10;
      updatedHero.special.charge = -10;

    } else if (this.state.skillDropdowns[skillType].info[id].type  === "passive") {
      let statMods = effect; //effect should contain the list of stats to buff
      let pTemp = updatedHero.passive;


      for (let key in statMods){
        pTemp[key] -= statMods[key];
      }


      updatedHero.passive = pTemp;


    } else if (this.state.skillDropdowns[skillType].info[id].type === "battle-movement"){
      updatedHero.battleMovement = {};

    } else if (this.state.skillDropdowns[skillType].info[id].type === "effect"){
      
      removeEffect(updatedHero, effect);
    } //end add effect



    if ('skills' in this.state.skillDropdowns[skillType].info[id]) { // if the skill has additional skills
      for (var x of this.state.skillDropdowns[skillType].info[id].skills) {

        var additionalSkill  = this.state.skillDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;

        updatedHero = this.removeSkillEffect(additionalSkill, x[0], updatedHero); //remove the extra skills as well
      }

    }

    //when removing the skill, a new special will be added, so it will adjust there
    if ('cdTrigger' in this.state.skillDropdowns[skillType].info[id]){
      updatedHero.effects.cdTrigger-= this.state.skillDropdowns[skillType].info[id].cdTrigger;

    }

    if (updatedHero.effects.cdTrigger !== cdTriggerOrg){ //check if 

      //get base cd of special and use modified value
      var newCharge = this.state.skillDropdowns["special"].info[updatedHero.heroSkills.special.value].cd + updatedHero.effects.cdTrigger;

      updatedHero.special.cd = newCharge;
      updatedHero.special.charge = newCharge;

    }

    return updatedHero; //hero with new skills

  }




  onMaxFilterChange(e){

    this.updateDropdowns(this.state.selectedHeroInfo, e.target.checked);
    this.setState({maxFilter: e.target.checked});
  }

  //index is the type of buff -> buff, debuff, combat buff
  //stat, the stat being changed
  onBuffChange(e, index, stat){ //also handles debuffs and combat modifiers
    let temp = this.state.heroList;


    let buffList =  Object.assign({}, temp[this.state.playerSide][this.state.heroIndex][index]); //get the corresponding buff list
    

    buffList[stat] = Number(e.target.value);

    temp[this.state.playerSide][this.state.heroIndex][index] = buffList;
    temp[this.state.playerSide][this.state.heroIndex].visibleStats = calculateVisibleStats(temp[this.state.playerSide][this.state.heroIndex]);

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });

  }

  onBonusChange(e){
    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex]; 
    

    hero.bonus = e.target.checked;

    let oldMaxHP = hero.stats.hp;

    hero.stats =  calculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);
    hero.visibleStats = calculateVisibleStats(hero);
    
    hero.currentHP = this.adjustHP(oldMaxHP, hero);

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: hero});


  }

  onEndChange(e){
    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex]; 
    

    hero.end = e.target.checked;

    //only reset if unit has used their action
    if (e.target.checked){
      hero.debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
      hero.statusEffect = JSON.parse(JSON.stringify(statusDebuffs));//{"guard": 0, "panic": 0}; 
    }

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

    hero.stats = calculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);
    hero.visibleStats = calculateVisibleStats(hero);
    
    hero.currentHP = this.adjustHP(oldMaxHP, hero);

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

    hero.stats = calculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);
    hero.visibleStats = calculateVisibleStats(hero);

    hero.currentHP = this.adjustHP(oldMaxHP, hero);

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });


  }

  onAllySupportChange(e){
    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex];

    hero.allySupport = e;

    hero.stats = calculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season); //might not need a stat calc since it is combat buff

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });


  }

  onFortLevelChange(e){

    this.setState({fortLevel: Math.max(-20, Math.min(Number(e.target.value), 20 ) ) }); 

    let updateHeroList = this.state.heroList;

    updateHeroList = this.recalculateAllHeroStats(updateHeroList,  Number(e.target.value), this.state.blessingBuffs, this.state.season);


    this.setState({heroList: updateHeroList});
    
    this.setState({selectedMember: updateHeroList[this.state.playerSide][this.state.heroIndex] }); //update the selectedHero according to changed level //todo

  }

  onTurnChange(e){
    let temp = this.state.heroList;
    this.calculateAuraStats(temp, Number(e.target.value)); //recalculate aura stats


    this.setState({heroList: temp});
    this.setState({currentTurn: Number(e.target.value)  }); 


  }

  onSeasonChange(e, type){
    var temp = this.state.season;
    temp[type] = e.target.value;
    
    this.setState({season: temp});

    let seasonHeroList = this.state.heroList;


    seasonHeroList = this.recalculateAllHeroStats(seasonHeroList, this.state.fortLevel, this.state.blessingBuffs, temp); //update all heroes with new seasons

    this.setState({heroList: seasonHeroList });
    this.setState({selectedMember: seasonHeroList[this.state.playerSide][this.state.heroIndex] });


  }


  onHPChange(e){

    let temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].currentHP = Math.min(Number(e.target.value),  temp[this.state.playerSide][this.state.heroIndex].stats.hp) ;
    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] }); //update the selectedHero according to changed level //todo

  }

  onSpecialChargeChange(e){
    let temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].special.charge = Math.min(Number(e.target.value), temp[this.state.playerSide][this.state.heroIndex].special.cd);
    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] }); 

  }

  onSelectedStatusChange(e, type){

    if (type === "statusBuff"){
      this.setState({selectedStatusBuff: e.target.value});
    } else if (type === "statusEffect"){
      this.setState({selectedStatusEffect: e.target.value});
    }

  }

  onStatusChange(e, type){

    let temp = this.state.heroList;
    

    let statusValue = 0;
    if (e.target.checked){ //if box is checked
      statusValue = 1;
    }


    if (type === "statusBuff"){
      temp[this.state.playerSide][this.state.heroIndex].statusBuff[this.state.selectedStatusBuff] = statusValue;
    } else if (type === "statusEffect"){
      temp[this.state.playerSide][this.state.heroIndex].statusEffect[this.state.selectedStatusEffect] = statusValue;
    }

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] }); 

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
    ev.dataTransfer.setData("text", ev.target.id ); //Gets the id, which should be holding the hero struct

    let dragData = JSON.parse(ev.target.id); //convert the target's text to an hero object
    this.setState({draggedHero: dragData});
    this.setState({draggedHeroOrg: JSON.parse(ev.target.id) }); //make a second deep copy
  }
  dragOverTeamMember(ev){
    ev.preventDefault();
  }

  //This handles dropping team members on the side panel. Dropping members on another will swap them
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

    this.dragEnd(ev);
  }




  //the board elements
  dragBoardMember(ev){

    ev.dataTransfer.setData("text", ev.target.id ); //id is the hero struct 

    let dragData = JSON.parse(ev.target.id); //convert the target's text to an hero object (copy rather than a reference so we can add temporary effects to it)
    dragData.initiating = true;

    let oldHero = heroData[dragData.heroID.value];
    let move = this.getMovement(oldHero.movetype);

    //increase movement by one if they have mobility buff
    if (dragData.statusBuff["mobility+"] > 0){
      move++; 
    }

    if (dragData.statusEffect["gravity"] > 0){
      move = 1;
    }

    let assist = -1;


    if (dragData.assist.range !== null)
      assist = dragData.assist.range;


    let pos = dragData.position;

    //these lists contain positions that have those actions available
    let movementList = [];
    let assistList = [];
    let attackList = [];
    let warpList = []; //contains positions that can be warped to
    let obstructList = [];

    //Obstruct is calculated the same way as a warp - it only takes away from normal movement though


    //Currently loops through each space which doesn't allow for path finding
    //Instead should do some kind of adjacency check
    //Movement starts at 1 and increments until over movement range
    //Have 2 lists, mList, and mList done - mList is current adjacency checks to do, Done version has positions already done the checl
    //Start with mlist with just original space
    //a. For each space in mList, get adjacent spaces - for spaces that have already done adjacency checks skip e.g. First pass checks adjacent spots around initial space, but not for the second pass
    //loop through list of adjacent spaces and add accordingly. If added to movementList OR space is occupied by an ally, then add to mList

    //Pass does two things
      //spaces will be added  to mList if they are occupied by an enemy too
      //obstruct can't disqualify spaces 


    if (dragData.statusBuff.airOrders > 0){
      dragData.warp.push({"type": "warp", "subtype": "warpReq", "allyReq": [["distanceCheck", 2] ] });

    }

    let warpInfo = this.getWarpEffects(dragData, this.state.heroList);
    //let warpTargets = this.getWarpTargets(this.state.heroList[dragData.side], dragData); //get the heroes you can warp to (as positions)
    let warpTargets = warpInfo.warpList;
    let obstructTargets = warpInfo.obstructList;
    let pathfinderList = warpInfo.pathfinderList;
    let pass = warpInfo.pass;


    obstructList = this.getAdjacentSpaces(obstructTargets);

    //Movement Calculation

    let movementCheck = this.getAdjacentSpaces([dragData.position]); //spaces to check for adjacency
    let movementCheckDone = []; //spaces that have already been checked for adjacency

    let currentMovement = 0;
    let newCells = this.state.cells;
    while (currentMovement < move){


      let nextMovementCheck = [];
      for (let pos of movementCheck) { //loop through positions to check


        //if this position has already been checked, move to next position
        if (movementCheckDone.includes(pos)){ continue;}

        //Add to next movement check list if 
        //is empty and (have pass or space is not obstructed) 
        //or
        //ally in spot 
        //or 
        //if pass is active and enemy is in the pos
        //if (  (newCells[pos] === null && (pass > 0 || !obstructList.includes(pos))) || newCells[pos].side === dragData.side || (pass > 0 && newCells[pos].side !== dragData.side) ){
        if (  (newCells[pos] === null) || newCells[pos].side === dragData.side || (pass > 0 && newCells[pos].side !== dragData.side) ){

          if (newCells[pos] === null && (pass < 1 && obstructList.includes(pos)) ){ //obstructed
            movementCheckDone.push(pos);
            continue;
          } 

          nextMovementCheck.push(pos); //position can be moved to, add it for the next check


          if (pathfinderList.includes(pos)){
            let extraSpaces = this.getAdjacentSpaces([pos]);

            for (let extra of extraSpaces){
              movementCheck.push(extra);
            }

          }

          if (newCells[pos] === null){ //add to movementList if no hero is occupying it
            
            movementList.push(pos);
          }
          
          

        }
        
        movementCheckDone.push(pos); //space has been checked and add it to list
        

      } //end for

      movementCheck = this.getAdjacentSpaces(nextMovementCheck);



      currentMovement++;
    }

    

    //Warp space calculation

    let warpSpaces = this.getAdjacentSpaces(warpTargets); //set the warpspaces as the spaces adjacent to the warp targets

    //adds the warp spaces that are empty to the warp list 
    for (let x of warpSpaces){

      if (newCells[x] === null && !movementList.includes(x) ){//space is empty and is not already a movement position
        warpList.push(x);
      }

    }


    //Assist space calculation

    if (assist > 0 && dragData.statusEffect.isolation < 1){ //check for assist ability and for no isolation status


      let assistSpaces = this.getSpacesInRange(pos, assist);

      for (let s of assistSpaces){
        if (newCells[s] !== null && newCells[s].side === dragData.side && newCells[s].statusEffect.isolation < 1 ){ //check for same team and isolationhave



          //loop through assist effects and see if they will be activatable
          let assistValid = false;
          for (let assistType of dragData.assist.type){

            if (assistType === "movement"){

              assistValid = this.checkMovementAssist(this.state.heroList, dragData, newCells[s], dragData.assist.effect); 


            } else if (assistType === "rally"){
              assistValid = this.checkRallyAssist(this.state.heroList, dragData, newCells[s], dragData.assist.effect);


            } else if (assistType === "health"){
              assistValid = this.checkHealthAssist(this.state.heroList, dragData, newCells[s], dragData.assist.effect);
              
            } else if (assistType === "heal"){
              assistValid = this.checkHealAssist(this.state.heroList, dragData, newCells[s], dragData.assist.effect);
              
            } else if (assistType === "dance"){
              assistValid = this.checkDanceAssist(this.state.heroList, dragData, newCells[s]);
            } else if (assistType === "neutralize"){
              assistValid = this.checkNeutralizeAssist(this.state.heroList, dragData, newCells[s], dragData.assist.effect);
            }

            if (assistValid){
              assistList.push(s);
              break;  
            }

          } //end for



          
        
        } //end check space
      } //end check assist spaces

    } //end assist space calculation

    //Attack space calculation
    if (dragData.range > 0){


      let attackSpaces = this.getSpacesInRange(pos, dragData.range);

      for (let s of attackSpaces){
        if (newCells[s] !== null && newCells[s].side !== dragData.side){
          attackList.push(s);
        }
      }

    }



    this.setState({draggedHero: dragData});
    this.setState({draggedHeroOrg: Object.assign({}, dragData) });
    this.setState({availableWarp: warpList});
    this.setState({availableMovement: movementList});
    this.setState({availableAssist: assistList});
    this.setState({availableAttack: attackList});
    this.setState({cells: newCells});    


  }

  //Given a list of positions, get all the spaces adjacent to it
  getAdjacentSpaces(warpPositions){

    let spaces = [];

    for (let x of warpPositions){

      //left
      if ( (x % 6) - 1 >= 0 && !spaces.includes(x - 1) ){ //get the column number and check if it is not the left-most column
        spaces.push(x - 1);
      }
      //right
      if ( (x % 6) + 1 <= 5 && !spaces.includes(x + 1) ){ //get the column number and check if it is not the right-most column
        spaces.push(x + 1);
      }
      //up
      if ( Math.floor(x / 6) - 1 >= 0 && !spaces.includes(x -6) ){ //get the row number and check if it is not the top-most column
        spaces.push(x - 6);
      }
      //down
      if ( Math.floor(x / 6) + 1 <= 7 && !spaces.includes(x + 6) ){ //get the row number and check if it is not the bottom-most column
        spaces.push(x + 6);
      }
    }
    return spaces;



  }


  //Given a position, get spaces that are exactly at that range
  getSpacesInRange(origin, range){

    let checkSpaces = [origin];
    let checkedSpaces = [origin];
    let counter = 0;

    while (counter < range){

      let adjacent = this.getAdjacentSpaces(checkSpaces);
      checkSpaces = []; //reset

      for (let x of adjacent){ //loop through adjacent spaces add them to checkSpaces if not already checked

        if (!checkedSpaces.includes(x)){
          checkSpaces.push(x);
          checkedSpaces.push(x);
        }

      } //end for

      counter++;
    }


    return checkSpaces;



  }

  getWarpEffects(owner, heroList){

    //provides a couple of things
    //pass (just a 1 or 0 for pass effect)
    //warp list - target that can be warped to
    //obstruct list

    let warpList = [];
    let obstructList = [];
    let pathfinderList = [];
    let pass = 0;

    for (let team in heroList){ //loop through each team
      for (let hero of heroList[team]){ //loop through each hero on team

        if (hero.position < 0 || hero.currentHP <= 0){ continue;} //skip if hero is dead or not on the board


        let warpEffects = hero.warp;
        if (hero.id === owner.id){
          warpEffects = owner.warp;
        }

        for (let effect of warpEffects){ //loop through loop effects
          if (effect === null || effect === undefined) {continue;}
        

          if ("condition" in effect && !checkCondition(heroList, effect.condition, hero, hero, this.state.currentTurn) ){ //check if condition has not been met to skip
              continue;
          }

          if (effect.subtype === "warpReq"){
            //warp reqs - check team for allies that pass req to warp to -- only applies to self
            if (hero.id === owner.id){
              this.getWarpTargets(effect, heroList, owner, warpList);
            }

          } else if (effect.subtype === "warpTarget"){

            if ("effectReq" in effect && checkCondition(heroList, effect.effectReq, hero, owner, this.state.currentTurn)){


              if (effect.effect === "obstruct"){


                if (!obstructList.includes(hero.position) && hero.side !== owner.side){
                  obstructList.push(hero.position);
                }  

              } else if (effect.effect === "warp"){

                if (!warpList.includes(hero.position)){
                  warpList.push(hero.position);
                }  


              } else if (effect.effect === "pathfinder"){
                if (!pathfinderList.includes(hero.position) && hero.side === owner.side){
                  pathfinderList.push(hero.position);
                }  
              }
            } //end check condition

          } else if (effect.subtype === "pass"){
            pass++;
          }
        } //end warp loop
        //"effect": [{"type": "warp", "subtype": "warpReq", "condition": [["hp", "greater", 0.5]], "allyReq": [["heroInfoCheck", "movetype", ["Flying"]], ["distanceCheck", 2] ] }], 
        //"effect": [{"type": "warp", "condition": [["hp", "greater", 0.25]], "subtype": "pass"}],
        //"effect": [{"type": "warp", "condition": [["hp", "greater", 0.5]], "subtype": "warpTarget", "effectReq": [["always"]], "effect" : "obstruct"}],


      }
    } //end heroList loop

    return {"warpList": warpList, "obstructList": obstructList, "pathfinderList": pathfinderList, "pass": pass};

  }

    //"effect": {"condition": [["hp", "greater", 1]], "range": 2, "allyReq": {"type": "allyInfo", "key": "movetype", "req": ["Infantry", "Cavalry", "Armored"] } },
  getWarpTargets(effect, heroList, owner, warpList){
    

    let allyListValid = []; //copy of list that only has valid heroes (not dead and on the board)
    let allyList = heroList[owner.side];
    for (let x in allyList){
      if (allyList[x].position >= 0 && allyList[x].currentHP > 0 && allyList[x].id !== owner.id){
        allyListValid.push(allyList[x]);
      }
    } 


        let allyReq = effect.allyReq;

        let passedAllyList = this.heroReqCheck(owner, allyListValid, allyReq); //Get the list of allies that pass the req check


        for (let y of passedAllyList){

          if (!warpList.includes(y.position)){
            warpList.push(y.position);
          }

        }



  }


  //given an list of allies and a requirement object, return a list of heroes that meet the requirements
  //loop through given list of allies, and remove/filter any that do that pass the requirement
  //do we want to do it by hero references or 
  heroReqCheck(owner, teamList, heroReq){

    let filteredList = [];//[...allyList]; //copy of allyList

    //for (let x of allyReq){ //loop through conditional list, then for each hero, if hero passes conditional 
      //console.log(x);
    filteredList = teamList.filter(checkConditionHero(owner, heroReq, this.state.heroList, this.state.currentTurn) ); //filter out 
      //console.log(filteredList);
    //}

    //checkCondition(heroList, x.condition, owner, enemy, this.state.currentTurn);

    return filteredList;
  }


  dragOverBoard(ev){
    ev.preventDefault();


    let dropPosition = ev.target.id;


    if (dropPosition === null){
      return;
    
    //if the spot has a hero, convert that hero to an ID

    } else if (Number.isNaN(parseInt(dropPosition)) ){

      dropPosition = JSON.parse(dropPosition).position;
    } else{
      dropPosition = parseInt(dropPosition);
    }

    let newCells = this.state.cells;
    let cellContent = newCells[dropPosition];


    //check if cell has a hero and if it is on opposite side
    if (cellContent !==null && this.state.draggedHero.side !== cellContent.side){

      //if it is not the same draggedOver as before or if there was none before for battle forecast
      if ( (this.state.draggedOver !== null && this.state.draggedOver.position !== dropPosition) || this.state.draggedOver === null ) {

        let draggedOverHero = JSON.parse(JSON.stringify(newCells[dropPosition]) ); // copies hero - non-reference copy so this copy can have temporary effects
        let draggedHero = JSON.parse(JSON.stringify(this.state.draggedHeroOrg)); //get the original dragged hero


        let preBattleDamage = -1;
        let orgHP = draggedOverHero.currentHP;

        //check if attacker is using an aoe special and if it is charged
        if (draggedHero.special.type === "pre-battle" && draggedHero.special.charge === 0){
          //do aoe

          let damageType = getDamageType(heroData[draggedHero.heroID.value].weapontype, draggedHero, draggedOverHero);

          ///// special trigger effects
          //check 
          //let oldSpecialTrigger =  Object.assign({}, draggedHero.combatEffects.specialTrigger); //get copy of the special trigger effects

          this.getConditionalEffects(draggedHero, draggedOverHero, "preCombatConditionalEffects");
          this.getConditionalEffects(draggedOverHero, draggedHero, "preCombatConditionalEffects");
            
          this.getVariablePreCombat(draggedHero, draggedOverHero);
          this.getVariablePreCombat(draggedOverHero, draggedHero);

          let onSpecialDamage = 0;
          let trueDamage = 0;

          for (let i of draggedHero.onSpecial){ //loop through each on move assist effect on the assister
            if (i !== null){

              for (let j in i){
                if (j === "damage"){


                  let extraDamage = getSpecialDamage(i, draggedHero, draggedOverHero, this.state.heroList, damageType);


                  if (i.damage[3] === "trueDamage"){
                    trueDamage+= extraDamage;
                  } else if (i.damage[3] === "specialDamage" ){
                    onSpecialDamage+= extraDamage
                  }


                } //end for damage
              } //end for i



            }

          } //end for onSpecial

          getConditionalSpecial(draggedHero, draggedOverHero, this.state.heroList);

          trueDamage+= draggedHero.combatEffects.specialTrueDamage; 
          //draggedHero.combatEffects.specialTrigger = oldSpecialTrigger; //revert to original


          let damageReduction = calculateReductionEffects(draggedOverHero.combatEffects.preBattleReduction, 1.0); //no reduce reduction for pre battle


          preBattleDamage = Math.trunc(  (draggedHero.visibleStats.atk - draggedOverHero.visibleStats[damageType]) * draggedHero.special.effect.factor) + onSpecialDamage + trueDamage;

          preBattleDamage = preBattleDamage - Math.trunc( preBattleDamage - preBattleDamage * damageReduction );

          //remove any effects from conditional specials (before any changes to the dragged hero is applied so that the same conditions pass)
          removeConditionalSpecial(draggedHero, draggedOverHero, this.state.heroList);

          draggedOverHero.currentHP = Math.max(1, draggedOverHero.currentHP - preBattleDamage); 

          draggedHero.special.charge = draggedHero.special.cd;
          draggedHero.specialActivated = true;

        } //end prebattle



        // Object.keys(draggedHero.combatEffects.statBuff).forEach((key, i) => {
        //   draggedHero.combatEffects.statBuff[key]+= Math.trunc(draggedHero.buff[key] * draggedHero.combatEffects.bonusDouble);
        // });


        let saviorHero = this.getSaviorHero(this.state.heroList, draggedHero, draggedOverHero);

        if (saviorHero !== null){
          draggedOverHero = saviorHero;
        }

        //"effect": [{"type": "conditionalEffects", "condition": [["phase", "enemy"], ["combatCount", 0] ], "firstReduction": 0.5 }],
        if (draggedHero.statusBuff.fallenStar > 0){
          draggedHero.conditionalEffects.push({"type": "conditionalEffects", "condition": [["combatCount", 0]], "firstReduction": 0.2 }); //Add conditional effect of fallen star

        }

        if (draggedOverHero.statusBuff.fallenStar > 0){
          draggedOverHero.conditionalEffects.push({"type": "conditionalEffects", "condition": [["combatCount", 0]], "firstReduction": 0.2 }); //Add conditional effect of fallen star

        }

        
        //Aura effects are effects granted by auras 
        this.getAuraEffects(draggedHero, draggedOverHero, this.state.heroList);
        this.getAuraEffects(draggedOverHero, draggedHero, this.state.heroList);


        //Regular conditional effects that do not depend on effects on other skills
        this.getConditionalEffects(draggedHero, draggedOverHero, "conditionalEffects");
        this.getConditionalEffects(draggedOverHero, draggedHero, "conditionalEffects");

        //For conditional effects that check for buff/debuffs and also provide neutralzing effects - These must be after conditional effects as neutralizers from there can falsify the condition - This is basically for idunn and brunnya's weapons
        this.getConditionalEffects(draggedHero, draggedOverHero, "conditionalBonusPenaltyNeutralizers");
        this.getConditionalEffects(draggedOverHero, draggedHero, "conditionalBonusPenaltyNeutralizers");

        //Here all neutralizations should be added

        //Combat effects that provide stats but need buff/debuff neutralizations -
        this.getConditionalEffects(draggedHero, draggedOverHero, "conditionalCombatStats");
        this.getConditionalEffects(draggedOverHero, draggedHero, "conditionalCombatStats");

        //Get stats buffs that have variable amounts of stats provided - this requires buffs/debuffs to be calculated
        this.getVariableStats(draggedHero, draggedOverHero);
        this.getVariableStats(draggedOverHero, draggedHero);

        //calulcating aura stats based on battling heroes
        this.calculateBattlingAuraStats(this.state.heroList, draggedHero, draggedOverHero);



        //At this point stats should be finalized and will be calculated.

        draggedHero.combatStats = calculateCombatStats(draggedHero, draggedOverHero);
        draggedOverHero.combatStats = calculateCombatStats(draggedOverHero, draggedHero);

        //Conditional effects that need final combat stats
        this.getConditionalEffects(draggedHero, draggedOverHero, "conditionalCombat");
        this.getConditionalEffects(draggedOverHero, draggedHero, "conditionalCombat");

        //Variable effects that need final combat stats
        this.getVariableCombat(draggedHero, draggedOverHero);
        this.getVariableCombat(draggedOverHero, draggedHero);


        //currently brash assault's double is calculated in getAttack count (which is used for conditional follow ups) - can make a conditional type for conditonalCounter (checks if enemy can counter which must occur after the sweeps in conditional combat)
        // specifically for brash assault but will keep it in getattack count for now

        //Conditional effects that check for followups which requires final stats (for speed check) and conditionalCombat effects (in particular, wind/water/myhrr sweep effects are conditionalcombat effects which affect followups)
        this.getConditionalEffects(draggedHero, draggedOverHero, "conditionalFollowUp");
        this.getConditionalEffects(draggedOverHero, draggedHero, "conditionalFollowUp");

        console.log(draggedHero);

        this.setState({draggedHero: draggedHero});
        this.setState({draggedOverOriginalHP: orgHP});
        this.setState({preBattleDamage: preBattleDamage});

        this.setState({draggedOver: draggedOverHero}); //setting dragedOver will activate the battlewindow to calculate battle forecast


        //TODO add an extra state that is a list of spaces if aoe special would be activated - and a sub list of those spaces of the new hp values of any heroes that would be affected
        //e.g. have a list of numbers indicating spaces affected. for each space, also have a corresponding text which will be "" if no hero is there and their new hp if otherwise
      }


    }

  }


  getSaviorHero(heroList, attacker, defender){


    //loop through the defender's team for their conditionalSavior effects
    let saviorID = -1;
    let saviorHero = null;


    for (let ally of heroList[defender.side]){ //loop through allies of defender

      if (ally.id === defender.id){ //cannot saviour themselves
        continue;
      }

      for (let effect of ally.conditionalSavior){

        if (effect === null || effect === undefined) {continue;}
        //"effect": [{"type": "conditionalSavior", "allyCondition": [["distanceCheck", 2]], "enemyReq": [["heroInfoCheck", "weapontype", ["redtome", "bluetome", "greentome", "colorlesstome", "bow", "dagger", "staff"]]]  "statBuff": {"atk": 4, "res": 4} }],
        
        if ("allyCondition" in effect && !checkCondition(heroList, effect.allyCondition, ally, defender, this.state.currentTurn)){
          continue;
        }

        if ("enemyCondition" in effect && !checkCondition(heroList, effect.enemyCondition, ally, attacker, this.state.currentTurn)){
          continue;
        }

        if (saviorID < 0){
          saviorID = ally.id;
        } else {
          return null; //another savior has been found so no saving occurs
        }

        saviorHero = JSON.parse(JSON.stringify(ally)); //copy of the savior - will be returned so it can become the new defender
        addEffect(saviorHero, effect); //add any effects connected to the savior effect
        //saviorHero.savingPosition = saviorHero.position //The position the savior will return to after combat
        saviorHero.position = defender.position; //move the savior
        saviorHero.saveID = defender.id;
        saviorHero.saving = true;
        

      } //end for conditional savior



    } //end loop allies

    return saviorHero;
    //if their savior condition is met, we then make sure their movement is valid (which is should be always since we have no terrain)
    //if they are a savior, then set them as a hero to return

    //loop through the rest, and if another is found, return null
    //else return the saviour

  }

  //For the given hero, get all of the aura effects from every other hero
  //do not need to loop through enemies as there are not any aura debuffs yet?
  //Examples include close guard, infantry rush etc.
  getAuraEffects(hero, enemy, heroList){


    let nihilCheck = false;
    if (enemy.combatEffects.teamNihil > 0){
      nihilCheck = true;
    }

    for (let teammate of heroList[hero.side]){ //loop through teammates

      if (nihilCheck && teammate.id !== hero.id){ //if enemy has teamNihil effects, then only the hero's auras are used so will skip the others
        continue;
      }

      for (let effect of teammate.auraEffects){ //loop through teammate's aura effects

        if (effect === null || effect === undefined) {continue;}

        if ("condition" in effect && !checkCondition(heroList, effect.condition, teammate, teammate, this.state.currentTurn) ){ //make sure teammate has met condition to provide the uara
          continue;
        }

        if ("effectReq" in effect && checkCondition(heroList, effect.effectReq, teammate, hero, this.state.currentTurn) && teammate.id !== hero.id  ){ //check if the hero meets the allyReq to gain the aura effects - Also check if its not themselves

          addEffect(hero, effect.auraEffect); //adds the effects to the hero

        } else if ("selfReq" in effect && checkCondition(heroList, effect.selfReq, teammate, hero, this.state.currentTurn) && teammate.id === hero.id ){

          addEffect(hero, effect.auraEffect);
        }

        

      } //end effect


    } //end teammate loop



  }

  getConditionalEffects(owner, enemy, type){

    for (let effect of owner[type]){

      if (effect !== null && checkCondition(this.state.heroList, effect.condition, owner, enemy, this.state.currentTurn)){ //if condition is true, then provide the rest of the effects
          addEffect(owner, effect);


      } //end if condition true

    } //end for 
  }




  //Blade sessions, atk/spd form etc

  getVariableStats(owner, enemy){

    for (let x of owner.variableStats){

      if (x !== null  ){ //if condition is true, then provide the rest of the effects

        if ("condition" in x && !checkCondition(this.state.heroList, x.condition, owner, enemy, this.state.currentTurn) ){ //check if condition has not been met to skip
          continue;
        }

        let buffs =  calculateVariableEffect(this.state.heroList, x, owner, enemy, this.state.currentTurn);

        addEffect(owner, buffs);

      } //end if condition true

    } //end for 
  }


  //Not neccessarily a conditional but provides a variable combat effect depending on the state of the board.
  //E.g. repel, pegasus flight, scendscale.
  //These can be conditionally added (in the case of pegagus flight) so need to occur after conditional effect check

  getVariableCombat(owner, enemy){

    for (let effect of owner.variableCombat){

      if (effect !== null ){ //if condition is true, then provide the rest of the effects

        if ("condition" in effect && !checkCondition(this.state.heroList, effect.condition, owner, enemy, this.state.currentTurn) ){ //check if condition has not been met to skip
          continue;
        }

        let effectList = calculateVariableCombat(this.state.heroList, effect, owner, enemy);

        addEffect(owner, effectList);


      } //end if condition true

    } //end for 
  }

  //Same as variable combat, but occurs before combat is initiated
  getVariablePreCombat(owner, enemy){



    for (let effect of owner.variablePreCombat){

      if (effect !== null ){ //if there is an effect

        if ("condition" in effect && !checkCondition(this.state.heroList, effect.condition, owner, enemy, this.state.currentTurn) ){ //check if condition has not been met to skip
          continue;
        }

        let effectList = calculateVariableCombat(this.state.heroList, effect, owner, enemy);
        //Object.keys(effectList).forEach((key, i) => {

        addEffect(owner, effectList)


      } //end if condition true

    } //end for 
  }

  dragEnd(ev){
    ev.dataTransfer.clearData();
    this.setState({availableMovement: []});
    this.setState({availableWarp: []});
    this.setState({availableAssist: []});
    this.setState({availableAttack: []});

    this.setState({draggedOver: null});
    this.setState({draggedHero: null});
    this.setState({draggedHeroOrg: null});
    this.setState({draggedOverOriginalHP: 0});
    this.setState({preBattleDamage: -1});



  }

  dropBoardMember(ev){
    ev.preventDefault();

    let dragData = this.state.draggedHero;//JSON.parse(ev.dataTransfer.getData("text"));
    //dragData.initiating = true; //held heroes are initiating
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

    let newCells = this.state.cells;


    //if spot is already filled then start an assist or attack
    if (newCells[dropPosition] !==null){

      //at this point, we should probably use this.state.draggedOver over newCells since the position is confirmed to have a hero.
      //the cells version should not have any temporary effects which don't really matter for assists and movements (only battles)
      let dropIndex = newCells[dropPosition].listIndex;
      let dropSide = newCells[dropPosition].side;


      //let tempOrg = temp;


      //if (this.CheckAdjacent(dragData.position, newCells[dropPosition].position )){
        //Check if in range for assist and they are on the same side
      if ( this.state.availableAssist.includes(newCells[dropPosition].position) && dragData.side === newCells[dropPosition].side && dragData.statusEffect.isolation < 1 && newCells[dropPosition].statusEffect.isolation < 1){


        //Note - These apply functions currently use a copy of the the assister (drag data) and assistee (dropPosition in cell list) 
        //Only one change is done at a time for the most part so this is fine, but for movement heal, it applies two effects, so the applyHealAssist portion uses the updated assister

        if (dragData.assist.range > 0){ //range 
          for (let assistType of dragData.assist.type){

            if (assistType === "movement"){

              let orgAssisterPos = temp[dragSide][dragIndex].position;
              let orgAssisteePos = temp[dropSide][dropIndex].position;
              temp = this.applyMovementAssist(temp, dragData, newCells[dropPosition], dragData.assist.effect); //should update temp accordingly

              

              //clear initial positions of assister/assistee
              newCells[orgAssisterPos] = null;
              newCells[orgAssisteePos] = null;

              //move the assistee/assister to their new positions 
              newCells[temp[dragSide][dragIndex].position] = temp[dragSide][dragIndex];
              newCells[temp[dropSide][dropIndex].position] = temp[dropSide][dropIndex];
              dropPosition = temp[dropSide][dropIndex].position;


            } else if (assistType === "rally"){
              temp = this.applyRallyAssist(temp, dragData, newCells[dropPosition], dragData.assist.effect, this.state.currentTurn);


            } else if (assistType === "health"){
              temp = this.applyHealthAssist(temp, dragData, newCells[dropPosition], dragData.assist.effect);
              
            } else if (assistType === "heal"){
              temp = this.applyHealAssist(temp, dragData, newCells[dropPosition], dragData.assist.effect);
              
            } else if (assistType === "dance"){
              temp = this.applyDanceAssist(temp, dragData, newCells[dropPosition]);
            } else if (assistType === "neutralize"){
              temp = this.applyNeutralizeAssist(temp, dragData, newCells[dropPosition], dragData.assist.effect);
            }



          } //end loop assist types


        }


      //Check if in range for attack and if they are on the same side
      } else if (getDistance(dragData.position, newCells[dropPosition].position) === dragData.range && dragData.side !== newCells[dropPosition].side ){
        let orgAttackerPos = temp[dragSide][dragIndex].position;
        let orgDefenderPos = temp[dropSide][dropIndex].position;


        //temp = DoBattle(temp, dragData, newCells[dropPosition]);
        temp = doBattle(temp, dragData, this.state.draggedOver, newCells); //do battle has to use the combat versions of drag and draggedOver heroes

        //clear initial positions of assister/assistee
        newCells[orgAttackerPos] = null;
        newCells[orgDefenderPos] = null;

        //move the assistee/assister to their new positions 
        newCells[temp[dragSide][dragIndex].position] = temp[dragSide][dragIndex];
        newCells[temp[dropSide][dropIndex].position] = temp[dropSide][dropIndex];

      }




      //An action has occured which is either an assist or battle. Buffs/debuffs usually go off after these actions so visible stats should be recalculated

      temp = this.recalculateAllVisibleStats(temp);

      // this.setState({heroList: temp});
      // this.selectNewMember(dragSide, dragIndex);

      //this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] }); 



    } else { //regular movement



      //remove old from board
      newCells[temp[dragSide][dragIndex].position] = null;
      

      //update for new position
      newCells[dropPosition] = temp[dragSide][dragIndex]; //update in gameboard
      temp[dragSide][dragIndex].position = dropPosition; //update in team list


      // this.setState({heroList: temp});
      // this.selectNewMember(dragSide, dragIndex);
      //this.updateHero(dropSide, dropData);
      //this.setState({selectedMember: temp[dragSide][dragIndex] });
    }

    this.calculateAuraStats(temp,this.state.currentTurn);



    this.setState({heroList: temp});
    this.selectNewMember(dragSide, dragIndex);

    this.dragEnd(ev);
    this.setState({cells: newCells});
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


  //Calulcate aura stats between two battling heroes
  calculateBattlingAuraStats(heroList, hero1, hero2){

    let hero1Team = hero1.side;
    let hero2Team = hero2.side;

    if (hero1Team === hero2Team){
      console.log("Error, function should not have heroes on the same team ");
    }

    //Reset auras on both heroes
    hero1.aura = {"atk": 0, "spd": 0, "def": 0, "res": 0}; 
    hero2.aura = {"atk": 0, "spd": 0, "def": 0, "res": 0}; 

    let refList = JSON.parse(JSON.stringify(heroList)); //deep copy of heroList for reference (so that calculations are done at the same time)

    for (let team in heroList){ //loop both teams



      //This value will disable auras from team members that are not the battling heroes
      let teamNihil = false; 

      //Team nihil is activated from opposite team
      if (getEnemySide(hero1Team) === team  && hero1.combatEffects.teamNihil > 0){
        teamNihil = true;
      } else if (getEnemySide(hero2Team) === team  && hero2.combatEffects.teamNihil > 0){
        teamNihil = true;

      }

      for (let hero of heroList[team]){ //loop through each member

        if (!heroValid(hero) || (teamNihil && hero.id !== hero1.id && hero.id !== hero2.id) ){ continue;} //skip if hero is dead or not on the board - also skip team nihil is on and are not battling


        this.getBattlingAuraStats(refList, heroList, hero, hero1, hero2);


      }
    } //end for heroList loop

  }

  getBattlingAuraStats(refList, heroList, hero, hero1, hero2){

    //hero1/2 are the heroes in the battle
    //hero is the hero which has the auras we are looking for.

    for (let effect of hero.auraStats){ //loop through aura stat effects
      if (effect === null || effect === undefined) {continue;}

      if ("condition" in effect && !checkCondition(refList, effect.condition, hero, hero, this.state.currentTurn) ){ //check if condition has not been met to skip
        continue;
      }

      let currentSide;

      if (effect.team === "owner"){
        currentSide = hero.side;
      } else if (effect.team === "enemy"){
        currentSide = getEnemySide(hero.side);
      }


      //for status buff, we can then buff those heroes instead
      //let checkList = refList[currentSide];

      let heroListValid = []; //copy of list that only has valid heroes (not dead and on the board)


      //Check battling hero sides to see if they are valid for the effect req
      if (hero1.side === currentSide && hero.id !== hero1.id){
        heroListValid.push(hero1); 
      }

      if (hero2.side === currentSide && hero.id !== hero2.id){
        heroListValid.push(hero2);
      }




      let passedHeroList = [];

      if ("effectReq" in effect){
        passedHeroList = this.heroReqCheck(hero, heroListValid, effect.effectReq); //Get the list of allies that pass the req check


        for (let affectedHero of passedHeroList){
          this.applyAuraStats(affectedHero, effect);

        }

        //this.applyAuraStats(heroList, passedHeroList, effect);

      } //end ally req
      


      //check if the current hero is either battling hero and do selfReq checks
      if ("selfReq" in effect && hero.id === hero1.id && checkCondition(refList, effect.selfReq, hero1, hero1)){ 
        this.applyAuraStats(hero1, effect);

      }

      if ("selfReq" in effect && hero.id === hero2.id && checkCondition(refList, effect.selfReq, hero2, hero2)){ 
        this.applyAuraStats(hero2, effect);

      }      

      



    } //end effect

  }

  //Calulcate aura stats for every hero
  calculateAuraStats(heroList, turn){


    for (let team in heroList){ //loop both teams
      for (let hero of heroList[team]){ //loop through each member
        //These effects last for 1 turn which means there are reset at the start of the turnstart

        hero.aura = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //reset buffs

      }
    }

    let refList = JSON.parse(JSON.stringify(heroList)); //deep copy of heroList for reference (so that calculations are done at the same time)

    for (let team in heroList){ //loop through each team
      for (let hero of heroList[team]){

        if (hero.position < 0 || hero.currentHP <= 0){ continue;} //skip if hero is dead or not on the board
        //may need  to apply the auras 
        this.getAuraStats(refList, heroList, hero, turn);


      } //end hero
    } //end 





  }

  getAuraStats(refList, heroList, hero, turn){

    for (let effect of hero.auraStats){ //loop through aura stat effects
      if (effect === null || effect === undefined) {continue;}

      if ("condition" in effect && !checkCondition(refList, effect.condition, hero, hero, turn) ){ //check if condition has not been met to skip
        continue;
      }

      let currentSide;

      if (effect.team === "owner"){
        currentSide = hero.side;
      } else if (effect.team === "enemy"){
        currentSide = getEnemySide(hero.side);
      }


      //for status buff, we can then buff those heroes instead
      let checkList = refList[currentSide];

      let heroListValid = []; //copy of list that only has valid heroes (not dead and on the board)
      for (let x in checkList){
        if (checkList[x].position >= 0 && checkList[x].currentHP > 0 && checkList[x].id !== hero.id ){ //exclude themselves, self buff req is done separately
          heroListValid.push(checkList[x]);
        }
      } 




      let passedHeroList = [];

      if ("effectReq" in effect){
        passedHeroList = this.heroReqCheck(hero, heroListValid, effect.effectReq); //Get the list of allies that pass the req check

        for (let affectedHero of passedHeroList){
          this.applyAuraStats(heroList[affectedHero.side][affectedHero.listIndex], effect, turn);

        }

        //this.applyAuraStats(heroList, passedHeroList, effect);

      } //end ally req
      


      //if there is a requirement for the buff to apply to themselves
      if ("selfReq" in effect && checkCondition(refList, effect.selfReq, hero, hero)){ 
        
        this.applyAuraStats(hero, effect, turn);
        
      } 



    } //end effect

  }


  applyAuraStats(hero, effect, turn){

    let value = effect.value;

    if ("varValue" in effect){
      if (effect.varValue === "turn"){
        value+= turn;
      }

    }

    for (let currentStat of effect.stats){

      if (effect.subtype === "buff"){
        hero.aura[currentStat]+= value;
      } else if (effect.subtype === "debuff"){
        hero.aura[currentStat]-= value;
      }

    } //end looping through affected stats

    

  }
  //update the stats of the given team list - should be with new blessing buffs
  recalculateTeamHeroStats(currentTeamList, newblessingBuffs){ //newFortLevel, newblessingBuffs, newSeasons){
    let tempTeam = currentTeamList;
    Object.keys(tempTeam).forEach((memberKey, j) => { //for each member

      let oldMaxHP = tempTeam[memberKey].stats.hp;

      tempTeam[memberKey].stats = calculateStats(tempTeam[memberKey], this.state.fortLevel, newblessingBuffs, this.state.season); //new stats 

      tempTeam[memberKey].currentHP = this.adjustHP(oldMaxHP, tempTeam[memberKey]);

      tempTeam[memberKey].visibleStats = calculateVisibleStats(tempTeam[memberKey]); //recalculate visible stats

    });
    return tempTeam;

  }

  //get an updated list of heroes and update all of their stats
  recalculateAllHeroStats(currentHeroList, newFortLevel, newblessingBuffs, newSeasons){ 
    let tempList = currentHeroList;

    Object.keys(tempList).forEach((key, i) => { //for each team
        let tempTeam = tempList[key]; //copy of team to be modified

        Object.keys(tempTeam).forEach((memberKey, j) => { //for each member

          let oldMaxHP = tempTeam[memberKey].stats.hp;
          tempTeam[memberKey].stats = calculateStats(tempTeam[memberKey], newFortLevel, newblessingBuffs[key], newSeasons); //new stats 

          tempTeam[memberKey].currentHP = this.adjustHP(oldMaxHP, tempTeam[memberKey]);

          tempTeam[memberKey].visibleStats = calculateVisibleStats(tempTeam[memberKey]); //recalculate visible stats

        });

        tempList[key] = tempTeam; //update the team list
    });

    
    return tempList; //the heroList with stats recalculated
  }

  recalculateAllVisibleStats(currentHeroList){

    let tempList = currentHeroList;

    Object.keys(tempList).forEach((key, i) => { //for each team
        let tempTeam = tempList[key]; //copy of team to be modified

        Object.keys(tempTeam).forEach((memberKey, j) => { //for each member

          tempTeam[memberKey].visibleStats = calculateVisibleStats(tempTeam[memberKey]); //recalculate visible stats

        });
        tempList[key] = tempTeam;
    });

    return tempList;
  }


  checkMovementAssist(heroList, assister, assistee, effect){


    let participantIDs = [assister.id, assistee.id]; //their ids (to uniquely identify them)
    //original location of both heroes
    // let assisterPos = positionToRowColumn(assister.position);
    // let assisteePos = positionToRowColumn(assistee.position);


    //Calculate row column positions from assist
    let newPositions = calculateMovementEffect(assister, assistee, effect);

    let assisterPos = newPositions.owner;
    let assisteePos = newPositions.other;
    let assisteeAlt = newPositions.otherAlt;
    
    //The above values can still be invalid if out of bounds
    let cells = this.state.cells
    if (checkValidMovement(assisterPos, assisteePos, assisteeAlt, participantIDs, cells) || checkValidMovement(assisterPos, assisteeAlt, [-1, -1], participantIDs, cells)  ){ //no issues with given movement positions
      return true;
    } else{
      return false;
    }

  }


  applyMovementAssist(updatedHeroList, assister, assistee, effect){

    let list = updatedHeroList;

    let participantIDs = [assister.id, assistee.id]; //their ids (to uniquely identify them)
    //original location of both heroes
    // let assisterPos = positionToRowColumn(assister.position);
    // let assisteePos = positionToRowColumn(assistee.position);


    //Calculate row column positions from assist
    let newPositions = calculateMovementEffect(assister, assistee, effect);

    let assisterPos = newPositions.owner;
    let assisteePos = newPositions.other;
    let assisteeAlt = newPositions.otherAlt;
    

    //convert back to positions
    let newAssisterPos = rowColumnToPosition(newPositions.owner);
    let newAssisteePos = rowColumnToPosition(newPositions.other);

    //The above values can still be invalid if out of bounds
    //Battle does not have access to the board, but does it need it?

    let cells = this.state.cells;


    if (checkValidMovement(assisterPos, assisteePos, assisteeAlt, participantIDs, cells) || checkValidMovement(assisterPos, assisteeAlt, [-1, -1], participantIDs, cells)  ){ //no issues with given movement positions

      if (!checkValidMovement(assisterPos, assisteePos, assisteeAlt, participantIDs, cells)) { //if only alt space was balid
        newAssisteePos = rowColumnToPosition(assisteeAlt); //use the alt position
      } 

      list[assister.side][assister.listIndex].position = newAssisterPos;
      list[assistee.side][assistee.listIndex].position = newAssisteePos;

      for (let effect of assister.onAssist){ //loop through each on move assist effect on the assister
        if (effect !== null && effect["assistType"] === "movement"){

          let side = 0;
          let range = effect.range;

          if (effect.team === "owner"){
            side = assister.side;
          } else if (effect.team === "enemy") {
            side = getEnemySide(assister.side);

          }


            //let buffs = i.buff;
            

          let heroesInRange = [];

          if (range > 0){
            if (effect["from"].includes("assister") ){
              heroesInRange = getDistantHeroes(list[side],  list[assister.side][assister.listIndex], [assistee.id], range);
            }

            if (effect["from"].includes("assistee") ){
              heroesInRange = heroesInRange.concat(getDistantHeroes(list[side], list[assistee.side][assistee.listIndex], [assister.id], range)); 
            }
         
          }

          if ("exclude" in effect){ //if there is an exclude keyword, check to see if participants will be affected - should only really be for buffs, debuffs will exclude them automatically
            if (!effect.exclude.includes("owner")){
              heroesInRange.push(list[assister.side][assister.listIndex]);
              //assister.buff[key] = Math.max( assister.buff[key], buffs[key]); //apply highest buff
            }

            if (!effect.exclude.includes("other")){
              heroesInRange.push(list[assistee.side][assistee.listIndex]);
              //assistee.buff[key] = Math.max( assistee.buff[key], buffs[key]); 
            }
          } else if (effect.subtype === "buff") { //buffs effects participants
            heroesInRange.push(list[assister.side][assister.listIndex]);
            heroesInRange.push(list[assistee.side][assistee.listIndex]);
          }
          applyBuffList(list, heroesInRange, effect, assister); //postTeam, postSpecial); // these shouldn't effect postteam/specials so can be undefefined




        }

      } //end for assister moveAssist

      for (let effect of assistee.onAssist){ //loop through each on move assist effect on the assistee
        if (effect !== null && effect["assistType"] === "movement"){


          let side = 0;
          let range = effect.range;

          if (effect.team === "owner"){
            side = assister.side;
          } else if (effect.team === "enemy") {
            side = getEnemySide(assister.side);

          }


          let heroesInRange = [];


          if (range > 0){
            if (effect["from"].includes("assister") ){
              heroesInRange = getDistantHeroes(list[side], list[assister.side][assister.listIndex], [assistee.id], range);
            }

            if (effect["from"].includes("assistee") ){
              heroesInRange = heroesInRange.concat(getDistantHeroes(list[side], list[assistee.side][assistee.listIndex], [assister.id], range)); 
            }
         
          }


          if ("exclude" in effect){
            if (!effect.exclude.includes("other")){
              heroesInRange.push(list[assister.side][assister.listIndex]);
              //assister.buff[key] = Math.max( assister.buff[key], buffs[key]); //apply highest buff
            }

            if (!effect.exclude.includes("owner")){
              heroesInRange.push(list[assistee.side][assistee.listIndex]);
              //assistee.buff[key] = Math.max( assistee.buff[key], buffs[key]); 
            }
          } else if (effect.subtype === "buff") {
            heroesInRange.push(list[assister.side][assister.listIndex]);
            heroesInRange.push(list[assistee.side][assistee.listIndex]);
          }


          applyBuffList(list, heroesInRange, effect, assistee);





        }

      } //end for assistee moveAssist

      // list[assister.side][assister.listIndex].buff = assister.buff;
      // list[assistee.side][assistee.listIndex].buff = assistee.buff;

      return list;

    } else { //invalid movemnt, return original list
      return list;
    }


  }


  checkRallyAssist(heroList, assister, assistee, effect){
    let aoe = false;
    let buffs = {"atk": 0, "spd": 0, "def": 0, "res": 0};

    let rallyObject = effect.rally;

    let rallyKeys = Object.keys(rallyObject);

    //get the rally buff that will be applied
    for (var i = 0; i< rallyKeys.length; i++ ){
      if (rallyKeys[i] === "up" && rallyObject["up"] === 1){
        aoe = true;

      } else {
        buffs[rallyKeys[i]] =  rallyObject[rallyKeys[i]]; //apply number to the stat
      }

    }

    //apply buff to assistee

    for (let key in buffs) {

      if (assistee.buff[key] < buffs[key]){ //if the buff will be overwritten
        return true;
      }

    }

    //apply the rally to 
    if (aoe){
      let inRangeAllies = getDistantHeroes(heroList[assistee.side.toString()], assistee, [assister.id], 2);

      //apply buff to all allies in range
      for (let x of inRangeAllies){
        for (let key in buffs){

          if (x.buff[key] < buffs[key]){
            return true;
          }
        }
        
      }
      
    }



    for (let i of assister.onAssist){ //loop through each on rally effect on the assister
      if (i !== null && i["assistType"] === "rally"){
        
        return true;

      }

    } //end for assister onRally

    for (let i of assistee.onAssist){ //loop through each on rally effect on the assistee
      if (i !== null && i["assistType"] === "rally"){

        return true;

      }

    } //end for assistee onRally

    return false;

  }

  applyRallyAssist(updatedHeroList, assister, assistee, effect, currentTurn){
    //rally effects are lists whose elements are two element lists. For those two elements lists, the first is the stat buffed and the second is the amount of the buff
    //if the first element is just up, then the buff is applied to units around the assistee as well
    //let cells = this.state.cells;
    let list = updatedHeroList;
    let refList = JSON.parse(JSON.stringify(list));
    let aoe = false;
    let buffs = {"atk": 0, "spd": 0, "def": 0, "res": 0};

    let rallyObject = effect.rally;

    let rallyKeys = Object.keys(rallyObject);


    //get the rally buff that will be applied
    for (var i = 0; i< rallyKeys.length; i++ ){
      if (rallyKeys[i] === "up" && rallyObject["up"] === 1){
        aoe = true;

      } else {
        buffs[rallyKeys[i]] =  rallyObject[rallyKeys[i]]; //apply number to the stat
      }

    }

    //apply buff to assistee

    for (let key in buffs) {

      assistee.buff[key] = Math.max( assistee.buff[key] ,buffs[key]); //apply highest buff
    }

    //apply the rally to 
    if (aoe){
      let inRangeAllies = getDistantHeroes(list[assistee.side.toString()], assistee, [assister.id], 2);

      //apply buff to all allies in range
      for (let x of inRangeAllies){
        for (let key in buffs){
          x.buff[key] = Math.max( x.buff[key] ,buffs[key]); //apply highest buff
        }
        

        list[x.side][x.listIndex] = x;
      }
      

    }

    list[assistee.side][assistee.listIndex] = assistee; //apply to list

    //list[assister.side][assister.listIndex].assistSuccess = true; //at this point, assist has succeeded - Note - still need to check if assist made a difference for assist success

    for (let i of assister.onAssist){ //loop through each on rally effect on the assister
      if (i !== null && i["assistType"] === "rally"){
        

        let affectedHeroes = [];

        let side = "1";


        if (i.team === "owner"){
          side = assister.side;

        } else if (i.team === "enemy") {
          side = getEnemySide(assister.side);
        }



        if (i.range === "cardinal"){ //if range is cardinal rather than a number, then we get the heroes cardinal to the assister and ally ()

            if (i["from"].includes("owner") ){
              affectedHeroes = getCardinalHeroes(list[side], assister, [assister]);
            }

            if (i["from"].includes("ally") ){
              affectedHeroes = affectedHeroes.concat( getCardinalHeroes(list[side], assistee, [...affectedHeroes, assistee]) );
            }

        } else {
          //export function getDistantHeroes(hList, hero, excluded, distance){
          affectedHeroes = getDistantHeroes(list[side], assister, [assister.id], i.range); 
        }


        if ("assistee" in i && i["assistee"]){ //only do this assistee check for the assister's effect so extra buffs can be added to the rally. The assistee who is being rallied shouldn't have an effect that causes it to gain extra rally effects.
          affectedHeroes.push(assistee);
        }


        if ("effectReq" in i){
          affectedHeroes = heroReqCheck(assister, affectedHeroes, i.effectReq, refList, currentTurn); //Get the list of allies that pass the req check
        }
        applyBuffList(list, affectedHeroes, i, assister);

      }

    } //end for assister onRally

    for (let i of assistee.onAssist){ //loop through each on rally effect on the assistee
      if (i !== null && i["assistType"] === "rally"){

        let affectedHeroes = [];

        let side = "1";


        if (i.team === "owner"){
          side = assistee.side;

        } else if (i.team === "enemy") {
          side = getEnemySide(assistee.side);
        }



        if (i.range === "cardinal"){ //if range is cardinal rather than a number, then we get the heroes cardinal to the assister and ally ()

            if (i["from"].includes("owner") ){
              console.log(list[side]);
              affectedHeroes = getCardinalHeroes(list[side], assistee, [assistee]);
            }

            if (i["from"].includes("ally") ){
              affectedHeroes = affectedHeroes.concat( getCardinalHeroes(list[side], assister, [...affectedHeroes, assister]) );
            }

        } else {
          //export function getDistantHeroes(hList, hero, excluded, distance){
          affectedHeroes = getDistantHeroes(list[side], assistee, [assistee.id], i.range); 
        }

        if ("effectReq" in i){
          affectedHeroes = heroReqCheck(assistee, affectedHeroes, i.effectReq, refList, currentTurn); //Get the list of allies that pass the req check
        }

        applyBuffList(list, affectedHeroes, i, assistee);





      }

    } //end for assistee onRally


    list[assistee.side][assistee.listIndex] = assistee;

    return list;


  }




  //from a position, get a list of heroes that are cardinal to the position (and get their positions)
  //export function getDistantHeroes(hList, hero, excluded, distance){
  getCardinalHeroPositions(position, excluded){

    let cardinalList = [];

    let col = position; //start from position

    let cells = this.state.cells;
    //checking west
    while ( (col % 6) - 1 >= 0){ //get col and reduce by and 
      col--;
      if (cells[col] !== null && !excluded.includes(cells[col].position) ){ //if a hero is in that space
        cardinalList.push(col);
      }

    }

    col = position;
    //checking east
    while ( (col % 6) + 1 <= 5){ //get col and reduce by and 
      col++;
      if (cells[col] !== null && !excluded.includes(cells[col].position) ){ //if a hero is in that space
        cardinalList.push(col);
      }

    }


    let row = position;

    //checking north
    while ( Math.floor(row / 6) - 1 >= 0){ //get col and reduce by and 
      row+= -6;

      if (cells[row] !== null && !excluded.includes(cells[row].position) ){ //if a hero is in that space
        cardinalList.push(row);
      }

    }

    row = position;
    //checking south
    while ( Math.floor(row / 6) + 1 <= 7){ //get col and reduce by and 
      row+= 6;

      if (cells[row] !== null && !excluded.includes(cells[row].position) ){ //if a hero is in that space
        cardinalList.push(row);
      }

    }
    //get left to right spaces

    return cardinalList;



  }




  checkHealthAssist(heroList, assister, assistee, effect){

    let newAssisterHP = assister.currentHP;
    let newAssisteeHP = assistee.currentHP;

    if (effect.healthType === "swap"){ //reciprocal aid

      //set hp for assister
      newAssisterHP = Math.min(assistee.currentHP, assister.stats.hp); //keep hp below max

      //set hp for assistee
      newAssisteeHP = Math.min(assister.currentHP, assistee.stats.hp); //keep hp below max


      if ( (newAssisteeHP > assistee.currentHP && assistee.statusEffect.deepWounds > 0) || (newAssisterHP > assister.currentHP && assister.statusEffect.deepWounds > 0) ) { //if a unit is gaining hp and they have deep wounds, then assist will not happen (unit deepwounds can still heal others)
        return false;
      }

      if ( (newAssisterHP <= assister.currentHP && newAssisteeHP <= assistee.currentHP)){ //if neither participant will gain hp from the swap, then the assist will not happen
        return false;
      }
      return true;

    } else if(effect.healthType === "sacrifice"){



      let maxHeal = effect.healMax; //the amount transferred is capped



      let maxGive = assister.currentHP - 1; //can transfer until HP reaches 1
      let maxGet = assistee.stats.hp - assistee.currentHP; //can only transfer amount to fully heal

      let healAmount = Math.min(maxHeal, maxGive, maxGet); //the amount healed is the least of these three numbers - This ensures that hp gained is always less than the max heal, less than the amount that can be transferred, and less than the assistee's max hp

      //if the hp that can be transferred is less than the minimum heal, then do not apply assist and return list -or if the assistee is not being healed any ammount of hp
      //Also if assistee has deepwounds, assist does not work

      if ( maxGive < effect.transferMin || healAmount === 0 || assistee.statusAffect.deepWounds > 0 ){ 
        return false;
      } 

      return true;




    }
    return false;

  }


  applyHealthAssist(updatedHeroList, assister, assistee, effect){
    let list = updatedHeroList;

    let newAssisterHP = assister.currentHP;
    let newAssisteeHP = assistee.currentHP;

    if (effect.healthType === "swap"){ //reciprocal aid

      //set hp for assister
      newAssisterHP = Math.min(assistee.currentHP, assister.stats.hp); //keep hp below max

      //set hp for assistee
      newAssisteeHP = Math.min(assister.currentHP, assistee.stats.hp); //keep hp below max

      if ( (newAssisteeHP > assistee.currentHP && assistee.statusEffect.deepWounds > 0) || (newAssisterHP > assister.currentHP && assister.statusEffect.deepWounds > 0) ) { //if a unit is gaining hp and they have deep wounds, then assist will not happen (unit deepwounds can still heal others)
        return list;
      }

      if (newAssisterHP <= assister.currentHP && newAssisteeHP <= assistee.currentHP){ //if neither participant will gain hp from the swap, then the assist will not happen
        return list;
      }

    } else if(effect.healthType === "sacrifice"){

      //there are two things with sacrifice assists, the amount transferred and the amount healed.

      //transfer is hp loss
      //heal is amount gained

      let maxHeal = effect.healMax; //the amount transferred is capped



      let maxGive = assister.currentHP - 1; //can transfer until HP reaches 1
      let maxGet = assistee.stats.hp - assistee.currentHP; //can only transfer amount to fully heal

      let healAmount = Math.min(maxHeal, maxGive, maxGet); //the amount healed is the least of these three numbers - This ensures that hp gained is always less than the max heal, less than the amount that can be transferred, and less than the assistee's max hp
      let transferAmount = Math.max(healAmount, effect.transferMin); //amount transferred is the amount healed, or the minimum transferMin (because ardent sacrifice will make you lose 10 hp even if healing less than that)  

      if ( maxGive < effect.transferMin || healAmount === 0 || assistee.statusAffect.deepWounds > 0 ){ //if the hp that can be transferred is less than the minimum heal, then do not apply assist and return list -or if the assistee is not being healed any ammount of hp
        return list;
      }


      newAssisterHP = assister.currentHP - transferAmount;
      newAssisteeHP = assistee.currentHP + healAmount;


    }

    list[assistee.side][assistee.listIndex].currentHP = newAssisteeHP;
    list[assister.side][assister.listIndex].currentHP = newAssisterHP;

    return list;

  }

  checkHealAssist(heroList, assister, assistee, effect){


    if (effect.modifiers.includes("restore")){ //Reset debuffs and status effects.

      if (checkCondition(heroList, [["penalty", "enemy", "battleStart"]], assister, assistee )){ //First check if assistee has a penalty on them before restoring

        return true;
       
      }

    }

    //full hp, assist does not go through. 
    //if no deepwounds, assist will not go through
    if (assistee.currentHP === assistee.stats.hp || assistee.statusEffect.deepWounds > 0){ 

      return false;
    } 
    return true;

  }

  applyHealAssist(updatedHeroList, assister, assistee, effect){
    let list = updatedHeroList;

    if (effect.modifiers.includes("restore")){ //Reset debuffs and status effects.
      //(heroList, condition, owner, enemy, turn)
      if (checkCondition(list, [["penalty", "enemy", "battleStart"]], assister, assistee )){ //First check if assistee has a penalty on them before restoring
        list[assistee.side][assistee.listIndex].debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
        list[assistee.side][assistee.listIndex].statusEffect = JSON.parse(JSON.stringify(statusDebuffs));
      }


    }
    //full hp, assist does not go through. 
    //Also checks if has done a movement assist (e.g. rescue) in which case, the assist will go through (no healing should still occur in this case but special will activate)
    // if (assistee.currentHP === assistee.stats.hp && !restoreCheck){ 

    //   return list;
    // }


    let newAssisterHP = assister.currentHP;
    let newAssisteeHP = assistee.currentHP;


    //actual heal values to apply
    let assisterHeal = 0;
    let assisteeHeal = 0;


    //minimum that will be healed
    let min = effect.min;
    //calculated healing amount
    let selfHeal = effect.selfHeal;

    let healCalc = Math.floor(assister.stats.atk * effect.atk) + effect.mod;


    if (effect.modifiers.includes("martyr")){
      healCalc += assister.stats.hp - assister.currentHP; //add to calculated healing amount, the damage on assister
      selfHeal = Math.floor( (assister.stats.hp - assister.currentHP)/2); //heal for half of damage on assister


    }

    assisteeHeal = Math.max(min, healCalc); //Get the highest of the two
    assisterHeal = selfHeal;

    // 20 /41 -> qualifies 
    // 40- 40
    if (effect.modifiers.includes("rehab")){ //rehab's bonus is applied after the maximum is found
      if (assistee.currentHP <= Math.trunc(assistee.stats.hp) * 0.5 ){ //hp must be <= 50%
        assisteeHeal += assistee.stats.hp - (2 * assistee.currentHP);
      }
    }







    let assisterSpecial = assister.special;

    let participantIDs = [assister.id, assistee.id];


    if (assisterSpecial.charge === 0 && assisterSpecial.type === "heal"){ //activate special

      //add flat healing amount from special (currently only imbue)
      if ("flatHeal" in assisterSpecial.effect){
        assisteeHeal+= assisterSpecial.effect.flatHeal;
      }

      if ("teamHeal" in assisterSpecial.effect){ //heal everyone in team except assister and assistee
        let side = assistee.side;

        for (let x of list[side]){ //for each member of side
          if (!participantIDs.includes(x.id) ){ //if x is not an assister/assistee


            if (x.statusEffect.deepWounds < 1){
            //heal team according special
            list[side][x.listIndex].currentHP = Math.min(list[side][x.listIndex].currentHP + assisterSpecial.effect.teamHeal, list[side][x.listIndex].stats.hp);
            }
          }
        } //end for
      } //end teamHeal


      if ("partyBuff" in assisterSpecial.effect){
        let side = assistee.side;
        let buffs = assisterSpecial.effect.partyBuff;
        for (let x of list[side]){ //for each member of side

          Object.keys(buffs).forEach((key, i) => {
            x.buff[key] = Math.max( x.buff[key] ,buffs[key]); //apply highest buff
          });

          list[side][x.listIndex] = x;

        }

      } //end buff

      assisterSpecial.charge = assisterSpecial.cd; //reset special
    } else{ //special not activated

      //special not fully charged and does not have nullCharge modifier
      if (assisterSpecial.charge >= 0 && !effect.modifiers.includes("nullCharge") ){
        assisterSpecial.charge = Math.max(0, assisterSpecial.charge - 1);
      }
    }



    //cut off healing  from going over max hp
    if (assistee.currentHP + assisteeHeal > assistee.stats.hp){
      assisteeHeal = assistee.stats.hp - assistee.currentHP;
    }

    //At this point healing on assistee is done being calculated
    if (assistee.statusEffect.deepWounds > 0){ //deep wounds will reduce to 0
      assisteeHeal = 0;
    }

    for (let i of assister.onAssist){ //loop through each dance effect
      if (i !== null && i["assistType"] === "heal"){

        for (let j in i){ //
          if (j === "selfHeal"){
            assisterHeal+= Math.trunc(i[j] * assisteeHeal); //live to serve effect (heal assister according to the assistee's heal)

          }
        }


      }

    } //end for assister heal assist

    //cut off healing  from going over max hp
    if (assister.currentHP + assisterHeal > assister.stats.hp){
      assisterHeal = assister.stats.hp - assister.currentHP;
    }


    //at this point assister heal is done being calculated
    if (assister.statusEffect.deepWounds > 0){ //deep wounds will reduce to 0
      assisterHeal = 0;
    }


    //set new HP values - Keep hp below max;
    newAssisteeHP = assistee.currentHP + assisteeHeal;
    newAssisterHP = assister.currentHP + assisterHeal;
    
    
   
    list[assister.side][assister.listIndex].special.charge = assisterSpecial.charge;

    list[assistee.side][assistee.listIndex].currentHP = newAssisteeHP;
    list[assister.side][assister.listIndex].currentHP = newAssisterHP;

    return list;

  }

  checkDanceAssist(heroList, assister, assistee){
    
    if (assistee.end === true){
      return true;
    }
    return false;

  }

  applyDanceAssist(updatedHeroList, assister, assistee){
    let list = updatedHeroList;

    if (assistee.end === true){
      list[assistee.side][assistee.listIndex].end = false;
    } else {
      return list;
    }

    let buffSpread = false;

    for (let i of assister.onAssist){ //loop through each dance effect
      if (i !== null && i["assistType"] === "dance"){

        for (let j in i){ //
          if (j === "buff"){

            let buffs = i.buff;
            
            for (let key in buffs){

              if (key === "spread"){
                buffSpread = true;
              } else {
                assistee.buff[key] = Math.max( assistee.buff[key], buffs[key]); //apply buff to assistee
              }
            }

          } else if (j === "debuff"){

              let range = i.range;
              let debuff = i.debuff;

              let heroesInRange = [];


              if (i["from"].includes("assister") ){
                heroesInRange = getDistantHeroes(updatedHeroList[getEnemySide(assister.side)], assister, [], range);
              }

              if (i["from"].includes("assistee") ){
                heroesInRange = heroesInRange.concat(getDistantHeroes(updatedHeroList[getEnemySide(assistee.side)], assistee, [], range)); 
              }

              
              //loop through heroes
              for (let hero of heroesInRange){

                //loop through debuff values
                for (let key in debuff){

                  list[hero.side][hero.listIndex].debuff[key] = Math.max( list[hero.side][hero.listIndex].debuff[key], debuff[key]); //apply highest debuff

                }

              } //end hero in range


            }
        }



      }

    } //end for assister dance assist

    if (buffSpread){ 
      let maxBuff = 0;

      for (let key in assistee.buff){ //loop through buffs and get largest buff
        maxBuff = Math.max(assistee.buff[key], maxBuff);
      }

      for (let key in assistee.buff){ //second pass to set the buffs.
        assistee.buff[key] = maxBuff;
      }

    }

    return list;


  }

  checkNeutralizeAssist(heroList, assister, assistee, effect){

    if (effect.neutralize.includes("harsh")){
      let buffs =  Object.assign({}, assistee.debuff); //create copy of the debuff on the assistee

      for (let stat in buffs) {

        if (assistee.buff[stat] < buffs[stat]){ //if the buff will be overwritten
          return true;
        }
      }


      if (checkCondition(heroList, [["statPenalty", "enemy", "battleStart"]], assister, assistee )){ //if enemy has a statPenalty
        return true;
      }
    //
      
    } 

    if (effect.neutralize.includes("restore")){

      if (checkCondition(heroList, [["penalty", "enemy", "battleStart"]], assister, assistee )){ //First check if assistee has a penalty on them before restoring
        
        return true;
      }
    }

    return false;    

  }

  applyNeutralizeAssist(updatedHeroList, assister, assistee, effect){
    let list = updatedHeroList;


    if (effect.neutralize.includes("harsh")){
      let buffs =  Object.assign({}, assistee.debuff); //create copy of the debuff on the assistee

      for (let stat in buffs) {

        list[assistee.side][assistee.listIndex].buff[stat] = Math.max( assistee.buff[stat] ,buffs[stat]); //apply highest buff

      }

      if (checkCondition(list, [["statPenalty", "enemy", "battleStart"]], assister, assistee )){ //if enemy has a statPenalty
        list[assistee.side][assistee.listIndex].debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //clear debuffs

      }
    //
      
    } 

    if (effect.neutralize.includes("restore")){

      if (checkCondition(list, [["penalty", "enemy", "battleStart"]], assister, assistee )){ //First check if assistee has a penalty on them before restoring
        
        list[assistee.side][assistee.listIndex].statusEffect = JSON.parse(JSON.stringify(statusDebuffs));
        list[assistee.side][assistee.listIndex].debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
        
      }


    }
    return list;
  }

  //Check if two positions are adjacent
  checkAdjacent(first, second){
   let firstRC = positionToRowColumn(first);
   let secondRC = positionToRowColumn(second);


    //if rows are the same, and column difference is one
    if (firstRC[0] === secondRC[0] && Math.abs(firstRC[1] - secondRC[1]) === 1){
      return true;
    } else if (firstRC[1] === secondRC[1] && Math.abs(firstRC[0] - secondRC[0]) === 1)
      return true;
    
    return false;

  }


  //






  //When max HP is changed, adjust current HP the same amount. Do not bring it below 0 though
  adjustHP(oldMax, updatedHero){

    let newHP = updatedHero.currentHP + updatedHero.stats.hp - oldMax;

    if (newHP < 0)
      return 0;
    else
      return newHP; 

  }

  getMovement(moveType){

    if (moveType === "Cavalry")
      return 3;
    else if (moveType === "Infantry" || moveType === "Flying")
      return 2;
    else if (moveType === "Armored")
      return 1;
    else
      return 0;
  }

  getEnemySide(side){

    if (side === "1"){
      return "2";
    } else {
      return "1";
    }
  }



  startTurn(){
    let side = this.state.playerSide;
    let tempList = this.state.heroList; //this is the copy that will be modified



    let enemySide = getEnemySide(side);
    // this["buff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //visible buffs
    // this["statusBuff"] = {};
    for (let i of tempList[side]){ 

      //These effects last for 1 turn which means there are reset at the start of the turn
      tempList[side][i.listIndex].buff = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //reset buffs
      tempList[side][i.listIndex].statusBuff = JSON.parse(JSON.stringify(statusBuffs)); //{"bonusDouble": 0, "airOrders": 0, "mobility+": 0}; //reset status buffs

    }
    tempList = this.recalculateAllVisibleStats(tempList);//get most up to date visible stats for all heroes

    let allyTeamPost = new Array(7).fill(0);
    let enemyTeamPost = new Array(7).fill(0);

    let allyTeamSpecial = new Array(7).fill(0);
    let enemyTeamSpecial = new Array(7).fill(0);

    let heroList = JSON.parse(JSON.stringify(this.state.heroList)); //deep copy of heroList for reference (so that calculations are done at the same time)

    for (let i of heroList[side]){ //this.state.heroList[side]){ //loop through each hero


      if (i.position < 0 || i.currentHP <= 0){ continue;} //skip if hero is dead or not on the board

      //Turn Start skills

      for (let effect of i.turnStart){ //loop through each turnstart abilities
        if (effect === null || effect === undefined) {continue;}

        if ( "condition" in effect && !checkCondition(heroList, effect.condition, i, i, this.state.currentTurn) ){ //check if condition has not been met skip
          continue;
        }

        calculateBuffEffect(tempList, heroList,  i, effect, this.state.currentTurn, allyTeamPost, allyTeamSpecial, enemyTeamPost, enemyTeamSpecial);




      } //end effects


    } //end i

    for (let x of tempList[side]){ //for each member of side
      if (heroValid(tempList[x.side][x.listIndex])){

        tempList[x.side][x.listIndex].currentHP = Math.min(Math.max(1,tempList[x.side][x.listIndex].currentHP - allyTeamPost[x.listIndex]), tempList[x.side][x.listIndex].stats.hp);

        if (allyTeamSpecial[x.listIndex] === "reset"){
          tempList[x.side][x.listIndex].special.charge = tempList[x.side][x.listIndex].special.cd;
        } else {
          tempList[x.side][x.listIndex].special.charge = Math.min(Math.max(0, tempList[x.side][x.listIndex].special.charge - allyTeamSpecial[x.listIndex]), tempList[x.side][x.listIndex].special.cd);
        }

      }
    }

    for (let x of tempList[enemySide]){ //for each member of side
      if (heroValid(tempList[x.side][x.listIndex])){
        tempList[x.side][x.listIndex].currentHP = Math.min(Math.max(1,tempList[x.side][x.listIndex].currentHP - enemyTeamPost[x.listIndex]), tempList[x.side][x.listIndex].stats.hp);

        if (enemyTeamSpecial[x.listIndex] === "reset"){
          tempList[x.side][x.listIndex].special.charge = tempList[x.side][x.listIndex].special.cd;
        } else {
          tempList[x.side][x.listIndex].special.charge = Math.min(Math.max(0, tempList[x.side][x.listIndex].special.charge - enemyTeamSpecial[x.listIndex]), tempList[x.side][x.listIndex].special.cd);
        }


      }
    }

    tempList = this.recalculateAllVisibleStats(tempList); //recalc visibleStats again

    this.setState({heroList: tempList }); //updates the hero list state

  } //end startTurn

  endTurn(){
    let tempList = this.state.heroList;

    //loop through each team
    for (let i in tempList){

      //loop through each hero on team
      for (let j of tempList[i]){

        tempList[i][j.listIndex].combatCount = 0; //reset their combat counts

        if (j.side === this.state.playerSide && !j.end){ //if on current side and has not finished their action yet
          tempList[i][j.listIndex].debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
          tempList[i][j.listIndex].statusEffect = JSON.parse(JSON.stringify(statusDebuffs));// {"guard": 0, "panic": 0}; 

        }


      }

    } //end i

    //TODO
    //Loop through current team and check for heroes that have not waited yet
    //These heroes will need to reset their debuffs. 
    //Also change selected hero to first of the opposite side


    this.setState({heroList: tempList});
  }





  render() {


    //console.log(this.state.heroList);
    console.log(this.state.heroList[this.state.playerSide][this.state.heroIndex]);
    

    return (

      <div>
      <table align = 'center' >
      <tbody>
      <tr valign = 'top'>
        <td><TeamElement 
            name = "1" 
            gameState = {this.state} 
            selector = {this.selectNewMember}
            drag = {this.dragTeamMember}
            dragOver = {this.dragOverTeamMember}
            drop = {this.dropTeamMember}
            dragEnd = {this.dragEnd} />
        </td>

        <td colSpan = "3">
          <Stats 
              gameState = {this.state} 
              levelChange = {this.onLevelsChange}
              heroChange = {this.onHeroChange}  
              buffChange = {this.onBuffChange}
              ivChange = {this.onIVChange}
              hpChange = {this.onHPChange}
              specialChargeChange = {this.onSpecialChargeChange}
              selectedStatusChange = {this.onSelectedStatusChange}
              statusChange = {this.onStatusChange} />
        </td>
        <td rowSpan = "2">
          <table className= "boardStyle" id="board" align = 'center'>
          <tbody>
            <Map
                gameState = {this.state}
                G = {this.props.G}
                filledPositions = {this.getFilledPositions}
                selectNewMember = {this.selectNewMember}
                dragOver = {this.dragOverBoard}
                dragStart = {this.dragBoardMember}
                drop = {this.dropBoardMember}
                dragEnd = {this.dragEnd} />


          </tbody>
          </table>
        </td>
      </tr>
      <tr valign = 'top'>
        
        <td><TeamElement 
            name = "2" 
            gameState = {this.state} 
            selector = {this.selectNewMember}
            drag = {this.dragTeamMember}
            dragOver = {this.dragOverTeamMember}
            drop = {this.dropTeamMember}
            dragEnd = {this.dragEnd} />            
        </td>
        
        <td>
          <Skills
            gameState = {this.state}
            skillChange = {this.onSkillChange}
            maxFilterChange = {this.onMaxFilterChange}
            supportLevelChange = {this.onSupportLevelChange}
            allySupportChange = {this.onAllySupportChange}
            bonusChange = {this.onBonusChange}
            endChange = {this.onEndChange} />

        </td>

        <td>
          <Field  
            gameState = {this.state}
            fortChange = {this.onFortLevelChange}
            turnChange = {this.onTurnChange}
            seasonChange = {this.onSeasonChange} 
            startTurn = {this.startTurn}
            endTurn = {this.endTurn} />
          
        </td>

        <td>
          <BattleWindow
          gameState = {this.state}

          />

        </td>
      </tr>

      </tbody>
      </table>


      </div>
    );
  }



} //end board

function makeHeroStruct(){

  function hero( idNumber, hero = {value: 0, label: ""} ){
    this["id"] = idNumber;
    this["listIndex"] = idNumber % 7; //index of the hero for the list of heroes
    this["level"] = 40;
    this["merge"] = 0;
    this["dragonflower"] = 0;

    this["heroID"] = hero;
    this["iv"] = {asset: "neutral", flaw: "neutral"};
    this["heroSkills"] = {"weapon": {value: "0", label: ""}, "assist": {value: "0", label: ""}, "special": {value: "0", label: ""}, 
                          "a": {value: "0", label: ""}, "b": {value: "0", label: ""}, "c": {value: "0", label: ""}, "seal": {value: "0", label: ""} //hero skills equipped
                        };

    this["side"] = (Math.floor(idNumber / 7) + 1).toString();
    // these are reset at the start of the hero's turn
    this["buff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //visible buffs
    this["statusBuff"] =  JSON.parse(JSON.stringify(statusBuffs));//{"bonusDouble": 0, "airOrders": 0, "mobility+": 0, "dragonEffective": 0};

    //these are reset when the hero's action is taken (action is also considered taken if action was available but their turn ended)
    this["debuff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["statusEffect"] =  JSON.parse(JSON.stringify(statusDebuffs));//{"guard": 0, "panic": 0}; //


    this["aura"] = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //stats changed by auras
    this["auraEffects"] = []; //auras that grant some kind of effect or conditional effect
    this["auraStats"] = []; //auras that provide only stats (and can be calculated in )
    this["auraWarps"] = [];

    this["rarity"] = 5;
    this["stats"] = {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0}; //the actual stats of the hero
    this["visibleStats"] = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //the stats of the hero that is shown to the player in the actual game (stats + buffs/debuffs)
    this["combatStats"] = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //the stats of the hero used for battle calculation (visibleStats + combat buffs/debuffs)


    this["summonerSupport"] = "None";
    this["allySupportLevel"] = "None";
    this["allySupport"] = {value: 0, label: ""};
    this["blessing"] = "None";
    this["position"] = -1;
    this["currentHP"] = 0;
    this["passive"] = {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0}; //set of stats from skills
    this["assist"] = {};
    this["special"] = {"cd": -10, "charge": -10}; //cd is the max cd and charge is the current special charge
    this["range"] = -1;
    this["bonus"] = false;
    this["end"] = false;
    this["effects"] = {"cdTrigger": 0};

    this["combatEffects"] = {"counter": 0, "double": 0, "enemyDouble": 0, "stopDouble": 0, "attackCharge": 1, "defenseCharge": 1, "guard": 0, "trueDamage": 0, "adaptive": 0, "nullAdaptive": 0, "sweep": 0, "selfSweep": 0,
    //enemyDouble stops enemy from double, stopDouble stops your own double
      "brashAssault": 0, "desperation": 0, "vantage": 0, "hardyBearing": 0,
      "nullC": 0, "nullEnemyFollowUp": 0, "nullStopFollowUp": 0, "nullGuard": 0, "nullCharge": 0,
      "brave": 0,
      "galeforce": 0,
      "wrathful": 0,
      "reflect": 0,
      "absorb": 0,
      "recoil": 0, "postHeal": 0, "burn": 0,
      "onHitHeal": 0,
      "specialTrueDamage": 0, "specialFlatReduction": 0, "specialHeal": 0.0,
      "spiral": 0,
      "statBuff": {"atk": 0, "spd": 0, "def": 0, "res": 0},
      "lull": {"atk": 0, "spd": 0, "def": 0, "res": 0},
      //"damageReduction": 1.0, "consecutiveReduction": 1.0, "firstReduction": 1.0, "preBattleReduction": 1.0, "followUpReduction": 1.0, "reduceReduction": 1.0,
      "damageReduction": [], "consecutiveReduction": [], "firstReduction": [], "preBattleReduction": [], "followUpReduction": [], "reduceReduction": [],
      "penaltyNeutralize": {"atk": 0, "spd": 0, "def": 0, "res": 0}, "buffNeutralize": {"atk": 0, "spd": 0, "def": 0, "res": 0}, "penaltyReverse": {"atk": 0, "spd": 0, "def": 0, "res": 0},
      "penaltyDouble": {"atk": 0, "spd": 0, "def": 0, "res": 0}, "buffReverse": {"atk": 0, "spd": 0, "def": 0, "res": 0},
      "defenseTarget": {"def": 0, "res": 0}, //if stat is active, then the defensive stat checked against will be the activated stat (can't test, but adaptive damage should/will override this) - can also target speed/attack if that is ever implemented
      "bonusCopy": {"atk": 0, "spd": 0, "def": 0, "res": 0}, "bonusNull": {"atk": 0, "spd": 0, "def": 0, "res": 0},
      "bonusDouble": 0,
      "teamNihil": 0,
      "minimumDamage": 0,
      "raven": 0,
      "triangleAdept": [0], "cancelAffinity": [0],
      "miracle": 0 }; //effects the change during battle
    this["variableStats"] = [];
    this["variableCombat"] = [];
    this["variablePreCombat"] = [];
    this["conditionalEffects"] = []; //conditional effects which occur at the start of combat
    this["preCombatConditionalEffects"] = [];
    this["conditionalBonusPenaltyNeutralizers"] = []; //conditionals that depend on bonus/penalties and neutralize them at the same time
    this["conditionalCombatStats"] = [];
    this["conditionalCombat"] = []; //conditional effects which occur during combat and will need to use combat stats
    this["conditionalFollowUp"] = []; //conditional effects that check for followups
    this["conditionalSpecial"] = [];
    this["initiating"] = false;

    this["saving"] = false;
    this["saved"] = false;
    this["saveID"] = -1;
    this["conditionalSavior"] = [];
    

    this["warp"] = [];
    this["onAssist"] = [];
    this["onSpecial"] = [];
    this["turnStart"] = [];
    this["battleMovement"] = {};
    this["onAttack"] = [];
    this["postCombat"] = [];
    this["specialActivated"] = false;
    this["combatCount"] = 0;
    this["postCombatBuffDebuff"] = [];

    this["effectiveCondition"] = [];
    this["addedEffective"] = [];
    this["negateEffective"] = [];

  }  
  return hero;
}



export default GameBoard;

export function addEffect(hero, effect){

  if (Array.isArray(effect) ){ //a list of effects will push each element to the hero depending on the type of effect - E.g. effects to be applied at certain times (conditionals for example), will be in a list with their subtype to put them in appropriate place

    for (let elementEffect of effect){
      
      //If combat effect in list, then add effect
      if (elementEffect.type === "combatEffect"){
        
        applyCombatEffect(hero, elementEffect); 
      } else {

        hero[elementEffect.type].push(elementEffect);
      }

    }

  } else if (typeof effect === 'object' && effect !== null){ //if the effect is just an object, then it will apply effects by looping through keys

    applyCombatEffect(hero, effect);


  }

}

function removeEffect(hero, effect){

  if (Array.isArray(effect) ){ //list effects

    for (let elementEffect of effect){

      if (elementEffect.type === "combatEffect"){
        removeCombatEffect(hero, elementEffect);
      } else {

        let elementEffectCopy = JSON.stringify(elementEffect); //copy of the effect in string form
        let copyIndex = hero[elementEffect.type].findIndex(findMatchingEffect, elementEffectCopy);

        hero[elementEffect.type].splice(copyIndex, 1);
      }

    }

  } else if (typeof effect === 'object' && effect !== null){ //for combat effects which is directly added

    removeCombatEffect(hero, effect);


  }

}


export function applyCombatEffect(hero, effect){ //aply combat effect (an object)
  for (let key in effect){

    if (key ===  "condition" || key === "type" || key === "allyCondition" || key === "enemyCondition"){
      continue; 

    } else if (key === "subEffect"){
      addEffect(hero, effect.subEffect);



    } else if (Array.isArray(effect[key])){ 
    //list value - add an effect  - actually not sure what should use this but neutralizers used this before e.g ("buffNeutralize": ["atk", "def"]) would add one stack for each stat. we now specify the stack amount in an object (below this if)
    //keeping this in case it is needed
      for (let subkey of effect[key]){
        hero.combatEffects[key][subkey]++;
    
      }
    } else if (typeof effect[key] === 'object' && effect[key] !== null){ //object values - will need to apply their effect for each subkey (e.g lulls, statBuff, neutralizers)

      for (let subkey in effect[key]){
        hero.combatEffects[key][subkey]+= effect[key][subkey];

      }


    // } else if (["damageReduction", "consecutiveReduction", "firstReduction", "preBattleReduction", "followUpReduction"].includes(key) ){ //effects that are multipied rather than just added
    //   hero.combatEffects[key]*= effect[key];


    } else if (["damageReduction", "consecutiveReduction", "firstReduction", "preBattleReduction", "followUpReduction", "reduceReduction", "triangleAdept", "cancelAffinity"].includes(key) ){ //effects added as an element of a list 
      hero.combatEffects[key].push(effect[key])


    } else {

      hero.combatEffects[key] += effect[key];
    }

  }


}


function findMatchingEffect(item){
  return JSON.stringify(item) === this;
}





// function findMatchingValue(item){
//   return item.value === this;
// }

function removeCombatEffect(hero, effect){ //aply combat effect (an object)
  for (let key in effect){



    if (Array.isArray(effect[key])){ //list value - will loop and add stack of effect for each subkey (neutralizers)

      for (let subkey of effect[key]){
        hero.combatEffects[key][subkey]--;
    
      }
    } else if (typeof effect[key] === 'object' && effect[key] !== null){ //object values - will need to apply their effect for each subkey (e.g lulls)

      for (let subkey in effect[key]){
        hero.combatEffects[key][subkey]-= effect[key][subkey];

      }

    // } else if (["damageReduction", "consecutiveReduction", "firstReduction", "preBattleReduction", "followUpReduction"].includes(key) ){ //effects that are multipied rather than just added
    //   hero.combatEffects[key]*=  (1.0 / effect[key]); //multiply by the reciprocal of the reduction to remove the reduction

    } else if (["damageReduction", "consecutiveReduction", "firstReduction", "preBattleReduction", "followUpReduction", "reduceReduction", "triangleAdept", "cancelAffinity"].includes(key) ){ //effects added as an element of a list

      let index = hero.combatEffects[key].indexOf(effect[key]);
      hero.combatEffects[key].splice(index, 1);



    } else {

      hero.combatEffects[key]-= effect[key];
    }

  }



} //

export function getEnemySide(side){

  if (side === "1"){
    return "2";
  } else {
    return "1";
  }
}



export function checkConditionHero(owner, condition, heroList, turn){
  return function(other){

      return checkCondition(heroList, condition, owner, other, turn);
  }
}

function setHero(hero, blessingBuffs, cells){    //Initial setup of hero

  //let tempBlessings = this.state.blessingBuffs; //copy the blessing buffs




  var newHero = heroData[hero.heroID.value]; //get the heroData from heroInfo.json

  var updatedDropdowns = updateDropdowns(newHero, false); //only really updates the weaponlist for now



  let tSkills = {};


  tSkills["weapon"] = updatedDropdowns["weapon"].list.find(findSkillWithName, newHero.weapon);
  tSkills["assist"] = updatedDropdowns["assist"].list.find(findSkillWithName, newHero.assist);
  tSkills["special"] = updatedDropdowns["special"].list.find(findSkillWithName, newHero.special);
  tSkills["a"] = updatedDropdowns["a"].list.find(findSkillWithName, newHero.askill);
  tSkills["b"] = updatedDropdowns["b"].list.find(findSkillWithName, newHero.bskill);
  tSkills["c"] = updatedDropdowns["c"].list.find(findSkillWithName, newHero.cskill);
  tSkills["seal"] = updatedDropdowns["seal"].list.find(findSkillWithName, newHero.sseal);

  hero.heroSkills = tSkills; //update the new heroes default skills

  //Passives/weapons only currently
  //Add the effects of the skills to the hero
  Object.keys(tSkills).forEach((key, i) => { //need to clear old effects
     hero = getSkillEffect(tSkills[key].value , key, hero, updatedDropdowns);
  });



  if (newHero.type === "legendary" || newHero.type === "mythic"){
    hero.blessing = newHero.blessing; //set blessing

    for (let stat in blessingBuffs[hero.side][hero.blessing]){  //loop through stats of the corresponding blessing
      blessingBuffs[hero.side][hero.blessing][stat] += newHero.buff[stat];
    }     

  }

  hero.currentHP = hero.stats.hp;

  if (hero.heroID.value === 0){ //default empty hero has no 
    hero.position = -1;
  } else {

    let position = hero.listIndex;

    if (hero.side === "1"){
      position = position + 42; //
    }
    hero.position = position;

    cells[position] = hero;

  }

    
  //   if (e.value === "0"){ //if blank hero, take it off the board
  //     newCells[hero.position] = null;
  //     hero.position = -1;
  //   } else {

  //     newCells[hero.position] = hero;
  //   }

  // }


}

function updateDropdowns(newHero, newMax){
  let dropTemp = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weapons[newHero.weapontype]},
                       "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                       "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                       "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal},
                       "o":{list: [], info: skills.o}
                 };



  // eslint-disable-next-line               
  for (let [key, value] of Object.entries(dropTemp)) {
    fillDropdown(value.list, value.info, newHero, newMax);
  }
  

  return dropTemp;
}

function fillDropdown(dropdownList, info, newHero, newMax){

  
  // eslint-disable-next-line
  for (let [key, value1] of Object.entries(info)) {

    if ( !('prf' in value1) || //if the object has no prf key (e.g. heroInfo) then just push to the list 
      value1.prf === false || //if the prf key says false, then push to the list
      ( !('users' in value1) || value1.users.includes(newHero.name ) )  
      ){ //if it has a user key (temp until those are added to skills) or if the users key has the id
        
        if (!newMax || (  !('max' in value1) || value1.max  ) ){ //if newMax toggle is set to false or the skill has no max value/ is max
          dropdownList.push({value: key, label: value1.name});
        }
    }
  }
  dropdownList.sort(compareLabels);

}


function compareLabels(a, b){
  return a.label > b.label ? 1 : b.label > a.label ? -1 : 0;
}
function findSkillWithName(item){
  return item.label === this;
}

function getSkillEffect(id, skillType, currentHero, skillDropdowns){ //skilltype refers to the slot the skill originates from


  let updatedHero = currentHero;

  let cdTriggerOrg = updatedHero.effects.cdTrigger;


  let effect = skillDropdowns[skillType].info[id].effect;

  if (skillType === "weapon"){

    let pTemp = updatedHero.passive;


    pTemp["atk"] += skillDropdowns["weapon"].info[id].might; //add the might of the weapon


    //Add the passive stats from the weapon
    let passiveStats = skillDropdowns[skillType].info[id].passive

    for (let key in passiveStats){
      pTemp[key] += passiveStats[key];

    }


    if ("effect" in skillDropdowns[skillType].info[id]){
      addEffect(updatedHero, effect);
    }

    updatedHero.passive = pTemp;
    updatedHero.range = skillDropdowns["weapon"].info[id].range;


  } else if (skillType === "assist"){

    updatedHero.assist = Object.assign({}, skillDropdowns[skillType].info[id] );

  } else if (skillType === "special"){

    //updatedHero.special.type = skillDropdowns[skillType].info[id].type;

    updatedHero.special = Object.assign({}, skillDropdowns[skillType].info[id]);

    var initialCharge = skillDropdowns[skillType].info[id].cd + updatedHero.effects.cdTrigger;

    updatedHero.special.cd = initialCharge;
    updatedHero.special.charge = initialCharge;
    //updatedHero.special.effect = skillDropdowns[skillType].info[id].effect;


  } else if (skillDropdowns[skillType].info[id].type  === "passive") {
    let statMods = effect; //effect should contain the list of stats to buff
    let pTemp = updatedHero.passive;

    for (let key in statMods){
      pTemp[key] += statMods[key];
    }

    updatedHero.passive = pTemp;

  } else if (skillDropdowns[skillType].info[id].type === "battle-movement"){
    updatedHero.battleMovement = Object.assign({}, effect);

  } else if (skillDropdowns[skillType].info[id].type === "effect"){

    addEffect(updatedHero, effect);

  } //end effect




  if ('skills' in skillDropdowns[skillType].info[id]) { // if the skill has additional skills
    for (var x of skillDropdowns[skillType].info[id].skills) {


      var additionalSkill  = skillDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;

      updatedHero = getSkillEffect(additionalSkill, x[0], updatedHero, skillDropdowns); //add the extra skills as well
    }

  }


  //Check if skill has a cdtrigger effect cdTriggers
  if ('cdTrigger' in skillDropdowns[skillType].info[id]){
    updatedHero.effects.cdTrigger+= skillDropdowns[skillType].info[id].cdTrigger;

  }

  //if the hero's cdTrigger stat has been changed, recalculate special cd.
  if (updatedHero.effects.cdTrigger !== cdTriggerOrg){ //check if 

    //get base cd of special and use modified value
    var newCharge = skillDropdowns["special"].info[updatedHero.heroSkills.special.value].cd + updatedHero.effects.cdTrigger;

    updatedHero.special.cd = newCharge;
    updatedHero.special.charge = newCharge;

  }

  return updatedHero; //hero with new skills

}


function calculateBuffEffect(heroList, refList, owner, effect, currentTurn, allyTeamPost, allyTeamSpecial, enemyTeamPost, enemyTeamSpecial){

  //lets say the enemy can now be owner it will work for positions but would be using the other for everything else
  let postSpecial;
  let postTeam;

  let teamList;

  if (effect.team === "owner"){
    teamList = refList[owner.side];
    postTeam = allyTeamPost;
    postSpecial = allyTeamSpecial;

  } else if (effect.team === "enemy") {
    teamList = refList[getEnemySide(owner.side)];
    postTeam = enemyTeamPost;
    postSpecial = enemyTeamSpecial;
  }


  if (effect.checkType === "reqCheck"){ //buff eligibility is by some kind of req/condition

    //for status buff, we can then buff those heroes instead


    let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)
    for (let x in teamList){
      if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves, self buff req is done separately
        teamListValid.push(teamList[x]);
      }
    } 

   // for (let m of heroList[side]){ //loop through friendly heroes

    let passedHeroList = [];
    //owner, teamList, heroReq, heroList, turn){
    if ("effectReq" in effect){
      passedHeroList = heroReqCheck(owner, teamListValid, effect.effectReq, refList, currentTurn); //Get the list of allies that pass the req check


      applyBuffList(heroList, passedHeroList, effect, owner, postTeam, postSpecial);

    } //end ally req
    

    
    //if there is a requirement for the buff to apply to themselves
    if ("selfReq" in effect && checkCondition(heroList, effect.selfReq, owner, owner, currentTurn)) {

      applyBuffList(heroList, [owner], effect, owner, postTeam, postSpecial);
    } 



  } else if (effect.checkType === "targeting"){ //targets a unit, usually for having the highest or lowest of a stat

    let checkStats = effect.checkStats;

    let affectedList = [];

    let peak;

    if (effect.peak === "max"){
      peak = 0;
    } else if (effect.peak === "min"){
      peak = 999;
    }



    for (let hero of teamList){

      if ("targetReq" in effect && !checkCondition(refList, effect.targetReq, owner, hero) ){
        continue; //if there is a target req and they don't meeet that requirement skip them
      }

      if (owner.id === hero.id || !heroValid(hero) ){
        continue; //cannot target themselves
      }

      let sum = 0;

      for (let stat of checkStats){

        if (stat === "hp"){
          sum+= hero.currentHP;

        } else if (stat === "damage"){ //the amount of damage on the ally
          sum+= hero.stats.hp - hero.currentHP;

        } else if (stat === "distance"){
          sum+= getDistance(hero.position, owner.position);

        } else {
          sum+= hero.visibleStats[stat];  
        }

        
      }

      if (sum === peak){ //same as peak, add to list
        affectedList.push(hero);
      } else if ((sum > peak && effect.peak === "max") || (sum < peak && effect.peak === "min")){

        if (heroValid(hero)){
          affectedList = []; //reset list
          affectedList.push(hero);
          peak = sum; //set new peak
        }

      } 


    } //loop through team
    
    applyBuffList(heroList, affectedList, effect, owner, postTeam, postSpecial);

  } //end targeting type
}

//hList, list to read from
//hero - the hero to check for cardinal
//excluded, list of hero ids to exclude
function getCardinalHeroes(hList, hero, excluded){ 

  let cardinalList = [];

  //get list of ids to exclude
  let idList = [];
  for (let x of excluded){
    idList.push(x.id);
  }


  for (let checkHero of hList){

    if (checkCardinal(hero, checkHero) && !idList.includes(checkHero.id)){ //if cardinal and not in excluded list
      cardinalList.push(checkHero);
    }

  } //end for loop through hero list

  return cardinalList;



}


