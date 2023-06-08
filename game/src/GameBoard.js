

import React from 'react';

import { calculateStats, calculateVisibleStats, calculateCombatStats} from './StatCalculation.js';
import { doBattle, getDistance, positionToRowColumn, rowColumnToPosition, calculateMovementEffect, checkValidMovement, getDamageType, checkCondition, getDistantHeroes, 
  calculateVariableEffect, calculateVariableCombat, getConditionalSpecial, removeConditionalSpecial, getSpecialValue, heroValid, applyBuffList, heroReqCheck, checkCardinal, calculateReductionEffects, waitHero} from './Battle.js';

import './App.css';


import TeamElement from './TeamElement.js';
import Stats from './Stats.js';
import Skills from './Skills.js';
import Field from './Field.js';
import Terrain from './Terrain.js';
import Structure from './Structure.js';
import structureInfo from './structureInfo.json';
import BattleWindow from './BattleWindow.js';
import Map from './Map.js';
import mapData from './UI/Maps/mapData.json';

//Json imports
import heroData from './heroInfo.json';
import weapons from './weapons.js';
import refines from './refines.js';
import specials from './skills/special.json';
import assists from './skills/assist.json';
import skills from './skillList.js';

export const heroStruct = makeHeroStruct();

export const statusBuffs = { "airOrders": 0, "bonusDouble": 0, "cancelAffinity": 0, "dragonEffective": 0, "fallenStar": 0, "mobility+": 0, "nullPanic": 0, "triangleAttack": 0 };

export const statusDebuffs = {"counterDisrupt": 0, "deepWounds": 0, "gravity": 0, "guard": 0, "isolation": 0, "panic": 0, "stall": 0, "triangleAdept": 0};



//handles the gameboard as well as the heroes which
class GameBoard extends React.Component{

	

	constructor(props){
    super(props);

    let initDropdowns = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weapons["sword"]}, "refine": {list: [{value: "0", label: ""}], info: refines["sword"]},
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
    let terrainCells = new Array(48);

    for (let i = 0; i < terrainCells.length; i++){
      terrainCells[i] =  {"terrain": "Plains", "defensive": false};
    }

    let fortLevel = 0;
    let season = {"L1": "Water", "L2": "Earth", "M1": "Light", "M2": "Dark"};

    let heroList = {"1":[new heroStruct(0, {"value": "605", "label": "Lilina: Firelight Leader"}), new heroStruct(1, {"value": "92", "label": "Eirika: Restoration Lady"}), new heroStruct(2, {"value": "166", "label": "Innes: Flawless Form"}), new heroStruct(3), new heroStruct(4), new heroStruct(5)],
        "2": [new heroStruct(7, {"value": "580", "label": "Nemesis: King of Liberation"}), new heroStruct(8, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(9, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(10), new heroStruct(11), new heroStruct(12), new heroStruct(13)]};
    //let heroList = {"1":[new heroStruct(0, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(1, {"value": "92", "label": "Eirika: Restoration Lady"}), new heroStruct(2, {"value": "166", "label": "Innes: Flawless Form"}), new heroStruct(3), new heroStruct(4), new heroStruct(5)],
    //    "2": [new heroStruct(7, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(8, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(9, {"value": "2", "label": "Alfonse: Prince of Askr"}), new heroStruct(10), new heroStruct(11), new heroStruct(12), new heroStruct(13)]};
    
    let structureList = {"1": [], "2": [], "3": []};

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

    let initialHero = heroList["1"][0];
    let initialHeroData = heroData[initialHero.heroID.value];
    
    initDropdowns.weapon.info = weapons[initialHeroData.weapontype]; //set the initial weapon to the first hero's weapon type

    // eslint-disable-next-line
    for (var [key, value] of Object.entries(initDropdowns)) {

      fillDropdown(key, value.list, value.info, initialHeroData, false, initialHero.heroSkills.weapon.label, initDropdowns );
    }                




    this.state = {
      "heroList": heroList,
      "heroIndex": 0, //The index of the hero in the heroList
      "playerSide": "1", //The side of the hero. 1 means player, 2 means enemy
      "skillDropdowns": initDropdowns,
      "selectedPosition": 42,
      "selectedMember": initialHero, //The current struct in heroList
      "selectedHeroInfo": initialHeroData, //The current hero's info
      "maxFilter": false,
      "freeMove": true,
      "currentTurn": 0,
      "fortLevel": fortLevel,
      "blessingBuffs": blessings,
      "season": season,
      "movementCheck": -1, //Movement check tells us if movement has been calculated and who was last movement was calculated for (by id)
      "anchorPosition": -1,
      "availableMovement": [],
      "availableAssist": [],
      "availableAttack": [],
      "availableWarp": [],
      "spaceRemainders": {},
      "draggedHero": null,
      "draggedHeroOrg": null,
      "draggedOver": null,
      "battleHeroList": null,
      "preBattleDamage": -1,
      "preBattleDamageList": [],
      "preBattleDamagePositions": [],
      "draggedOverOriginalHP": 0,
      "selectedStatusBuff": "airOrders",
      "selectedStatusEffect": "counterDisrupt",
      "cells": cells,
      "terrainCells": JSON.parse(JSON.stringify(mapData["Custom"].terrainMap)),
      "map": "Custom",
      "structureList": structureList //List containing structures for each team (as well as neutral team)

    }

    this.selectNewPosition = this.selectNewPosition.bind(this);
    this.terrainChange = this.terrainChange.bind(this);
    this.terrainDefensiveChange = this.terrainDefensiveChange.bind(this);
    this.mapChange = this.mapChange.bind(this);

    this.addStructure = this.addStructure.bind(this);
    this.structureChange = this.structureChange.bind(this);    

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
    this.onFreeMoveChange = this.onFreeMoveChange.bind(this);

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

    //Don't update selected position if they are not on the map
    if (newSelected.position >= 0){
      this.setState({selectedPosition: newSelected.position});
    }
    this.updateDropdowns(heroData[newSelected.heroID.value], this.state.maxFilter, newSelected.heroSkills.weapon.label);//weapons[heroData[newSelected.heroID.value].weapontype]);

  }

  //given a hero and max value, return dropdown lists with approriate skills
  updateDropdowns(newHero, newMax, currentWeapon){ 
    let dropTemp = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weapons[newHero.weapontype]}, "refine": {list: [{value: "0", label: ""}], info: refines[newHero.weapontype]},
                         "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                         "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                         "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal},
                         "o":{list: [], info: skills.o}
                   };



    // eslint-disable-next-line               
    for (let [key, value] of Object.entries(dropTemp)) {
      this.fillDropdown( key, value.list, value.info, newHero, newMax, currentWeapon, dropTemp);
    }
    
    this.setState({skillDropdowns: dropTemp});
    return dropTemp;
  }

  fillDropdown(category, dropdownList, info, newHero, newMax, currentWeapon, dropDowns){
    //dropdownList - empty list that will be filled with skills
    //info - the json file that holds the unfiltered list of skills
    //newHero - the hero data of the current hero
    //currentWeapon - the name of weapon the current hero is using
    
    let weaponList;
    let refineWeapon;

    if (category === "refine"){

      weaponList = dropDowns.weapon.list; //weapon dropdown should be set first
      refineWeapon = weaponList.find(findSkillWithName, currentWeapon); //get the list value of the weapon
      refineWeapon = dropDowns.weapon.info[refineWeapon.value]; //get the weapons info using its name

      //if the weapon is unrefinable then skip filling this dropdown (if the weapon has no refinable key, then we assume that it is not refinable)
      if (!("refinable" in refineWeapon) || !refineWeapon.refinable){

        return;
      }

    }

    // eslint-disable-next-line
    for (let [key, value1] of Object.entries(info)) {


      //skip to next entry if the skill is a PRF and hero is not in the skills users list (if there is no users value, then we assume no wielders and skip)

      //First we check for prf keys. If none are found or the value is false then we would add the skill.
      //Next we check for a users key. Only if there is a users key and the newhero is in that user list, we add the skill
      if ('prf' in value1 && value1.prf && (!('users' in value1) || !value1.users.includes(newHero.name) ) ){
        continue;

      } 

      //skip to next entry if we are only adding max skills and max value of the skill is false
      if (newMax && 'max' in value1 && !value1.max ){

        continue;
      }

      if (category === "refine"){

              //skip to next entry if the skill is refinable and the current weapon is not in the refines list



          if (!("refines" in refineWeapon) || !refineWeapon.refines.includes(value1.name) ){
            continue;
          }

        
      } 


      dropdownList.push({value: key, label: value1.name});

    } //end for
    dropdownList.sort(compareLabels);

  }



  selectNewPosition(newPos){
    this.setState({selectedPosition: newPos});
  }

  terrainChange(e, position){

    let tCells = this.state.terrainCells;
    tCells[position].terrain = e.target.value;
    this.setState({terrainCells: tCells});

  }

  terrainDefensiveChange(e, position){

    let tCells = this.state.terrainCells;    
    tCells[position].defensive = e.target.checked;
    this.setState({terrainCells: tCells});

  }

  mapChange(e){


    this.setState({terrainCells: JSON.parse(JSON.stringify(mapData[e.target.value].terrainMap))});
    this.setState({map: e.target.value});
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
    } else if (type === "merge"){
      max = 10;
      min = 0;
    } else if (type === "dragonflower"){
      max = 20;
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


  addStructure(e, selectedPosition){
    let newCells = this.state.cells;

    let newStructure = JSON.parse(JSON.stringify(structureInfo[e.target.value]));
    
    newStructure.side = "1";
    newStructure.position = selectedPosition;
    newStructure.currentHP = newStructure.maxHP;
    newStructure.level = newStructure.maxLevel;


    let structList = this.state.structureList;



    newStructure.listIndex = structList["1"].push(newStructure) - 1; //The listIndex of the structure is the length of new array - 1


    newCells[selectedPosition] = newStructure;
    
    this.setState({structureList: structList});
    this.setState({cells: newCells});
  }

  removeStructure(position){
    let newCells = this.state.cells;
    let structList = this.state.structureList;
    let removedStructure = newCells[position];


    let side = removedStructure.side
    let index = removedStructure.listIndex;


    for (let i = index + 1; i < structList[side].length; i++){
      structList[side][i].listIndex-= 1;

    }

    newCells[position] = null; //remove from cell list
    structList[side].splice(index, 1); //remove 
    this.setState({structureList: structList});
    this.setState({cells: newCells});


  }

  structureChange(e, type, selectedPosition){

    let newCells = this.state.cells;
    let structList = this.state.structureList;
    let changedStructure = newCells[selectedPosition];
    let side = changedStructure.side
    let index = changedStructure.listIndex;
    //if side, then we need to update structurelist too
    //if structure type, then we need to reset the structure (see add structure)
    //if structure type is set to empty version, we remove the structure (see removestructure)
    if (type === "structureType"){ //change in structure type

      if (e.target.value === "0"){

        for (let i = index + 1; i < structList[side].length; i++){
          structList[side][i].listIndex-= 1;

        }

        newCells[selectedPosition] = null; //remove from cell list
        structList[side].splice(index, 1); //remove 

      } else {

        let newStructure = JSON.parse(JSON.stringify(structureInfo[e.target.value]));

        newStructure.side = changedStructure.side;
        newStructure.position = changedStructure.position;
        newStructure.currentHP = newStructure.maxHP;
        newStructure.level = newStructure.maxLevel;
        newStructure.listIndex = changedStructure.listIndex;

        
        structList[newStructure.side].splice(newStructure.listIndex, 1, newStructure); //remove previous structure and add new one 
        newCells[selectedPosition] = newStructure;
      }

    } else if (type === "side"){ //when changing sides, we also need to update the structure list
      //first we push up each structure on the side the structure is changing from
      
      
      for (let i = index + 1; i < structList[side].length; i++){
        structList[side][i].listIndex-= 1;
      }


      //remove it from its original side and push it to its new list. Update the structure's values
      structList[side].splice(index, 1);// remove from struct list
      changedStructure.listIndex = structList[e.target.value.toString()].push(changedStructure  ) - 1; //
      newCells[selectedPosition].side = e.target.value;

    } else {
      newCells[selectedPosition][type] = Number(e.target.value);
    }
    this.setState({structureList: structList});
    this.setState({cells: newCells});
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

    var updatedDropdowns = this.updateDropdowns(newHero, this.state.maxFilter, newHero.weapon);//weapons[newHero.weapontype].find(findSkillWithName, newHero.weapon)); //only really updates the weaponlist for now


    if (hero.transformed){ //if hero is transformed, remove their transformation effects (even if new hero is also a beast)


      var heroDropdowns = getDropdowns(oldHero, false, hero.heroSkills.weapon.label); //get dropdowns from the previous hero

      let transformSkills = getTransformationSkills(hero);

      if (transformSkills.length > 0){ //check if there are any skills to add/remove


        for (let x of transformSkills) {
          let additionalSkill  = heroDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;
          hero = this.removeSkillEffect(additionalSkill , x[0], hero); //remove the transform effect
        }


      }
      hero.transformed = false; //remove the transformation
    } //end if transformed


    //hero skill updating
    let tSkills = hero.heroSkills; //Object.assign({}, this.state.heroSkills);

    Object.keys(tSkills).forEach((key, i) => { //clear the skills on the hero for the new defaults that will be set
      
      if (key !== "weapon" || tSkills.refine.value === "0"){ //do no remove the skill effect if it is a weapon effect and a refine is equipped (since the weapon will not be equipped)
        hero = this.removeSkillEffect(tSkills[key].value , key, hero);
      }

       
      
    });

    tSkills["weapon"] = updatedDropdowns["weapon"].list.find(findSkillWithName, newHero.weapon);
    tSkills["refine"] = updatedDropdowns["refine"].list.find(findSkillWithName, ""); //No refine by default
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

        if (key !== "refine" || tSkills.refine.value !== "0" ){ //for refines, check if the refine is not the empty one before adding it - if refine is not the empty refine, it shouuld also remove the weapon before

          if (key === "refine"){ //if we are adding the non-empty refine, remove the weapon first (currently, refines are blank by default so this will not occur)
            hero = this.removeSkillEffect(tSkills.weapon.value, "weapon", hero);

          } 

  

          hero = getSkillEffect(tSkills[key].value , key, hero, updatedDropdowns);
        
        }
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

    //Sets the initial position of the hero if they were not on the board 
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
          this.setState({selectedPosition: y+x}); //set the selected position to the newly placed hero

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
    hero.anchorPosition = hero.position; //set the inital anchorPosition too


    temp[this.state.playerSide][this.state.heroIndex] = hero;





    //if old or new heroes were legendary/mythic, calculate stats for the team
    if (calcAll){
      temp[this.state.playerSide] = this.recalculateTeamHeroStats(temp[this.state.playerSide], tempBlessings[this.state.playerSide]);
    }

    calculateAuraStats(temp, this.state); //recalculate aura stats


    this.setState({heroList: temp});
    this.setState({selectedMember: hero });

    this.setState({blessingBuffs: tempBlessings});

    this.setState({selectedHeroInfo: heroData[newHero.id]});



    this.setState({cells: newCells});


  }



  checkLabelExists(item){
    return item.name === this;
  }

  onSkillChange(e, index){ //e is the new value, index is the key/skill type for the heroSkills object
    let tempHeroList = this.state.heroList;
    let hero = this.state.heroList[this.state.playerSide][this.state.heroIndex]; //copy of heroList


    let skillList =  Object.assign({}, hero.heroSkills); //copy of hero's skill list
    //if hero is transformed, we need to remove their transform effects first (even if the transform skill is not being removed)
    //later on we will redo the tranformation
    if (hero.transformed && getTransformationSkills(hero).length > 0){ 

      for (let x of getTransformationSkills(hero)) {


        let additionalSkill = this.state.skillDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;
        hero = this.removeSkillEffect(additionalSkill , x[0], hero);
      }



    }


    //situation when changing refines
    //1. weapon and no refine - remove weapon and add refine)
    //2. weapon and refine - remove refine, then add refine. If the new refine is the empty refine, add the weapon instead
    //3. 

    //Adding new refine while one hasn't been equipped before
    //Remove weapon first
    if (index === "refine" && skillList.refine.value === "0"){ 
      hero = this.removeSkillEffect(skillList.weapon.value, "weapon", hero);

    } 


    //Changing the weapon while a refine is equipped
    //remove the current skill effect that is to be reaplced
    if (index === "weapon" && skillList.refine.value !== "0"){ //if we are adding a new weapon and there is already a refine on the unit, we remove the refine weapon from the unit instead. We also set the refine weapon to the empty weapon
    
      hero = this.removeSkillEffect(skillList.refine.value, "refine", hero);
      skillList.refine = {value: "0", label: ""};
    } else {
      hero = this.removeSkillEffect(skillList[index].value, index, hero);
    }


    //refine is already equipped and is being removed
    if (index === "refine" && e.value === "0" && skillList.refine.value !== "0"){ //if changing to the blank refine (and it is not already the  blank refine), then add base weapon to the hero

      hero = getSkillEffect(skillList.weapon.value, "weapon", hero, this.state.skillDropdowns); //need to clear old effects  
    }

    skillList[index] = e; //replace skill
    hero.heroSkills = skillList; //update the temp copy of heroList

    this.updateDropdowns(heroData[hero.heroID.value], this.state.maxFilter, hero.heroSkills.weapon.label); //update dropdowns since weapon changes will updated refine list
    


    //If adding the blank refine weapon, then we should have already added the original weapon
    if (index !== "refine" || e.value !== "0"){
      hero = getSkillEffect(e.value, index, hero, this.state.skillDropdowns); //need to clear old effects
    }

    if (hero.transformed && getTransformationSkills(hero).length > 0){ //redo the transformation
      for (let x of getTransformationSkills(hero)) {
        let additionalSkill = this.state.skillDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;
        hero = getSkillEffect(additionalSkill, x[0], hero, this.state.skillDropdowns); //add the extra skills as well
      }
    }
    //TODO - add other types of skills 
    let oldMaxHP = hero.stats.hp;

    hero.stats = calculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);

    hero.visibleStats = calculateVisibleStats(hero);

    hero.currentHP = this.adjustHP(oldMaxHP, hero);


    
    tempHeroList[this.state.playerSide][this.state.heroIndex] = hero; //update the heroList with the updated hero

    calculateAuraStats(tempHeroList, this.state); //recalculate aura stats

    //update states
    this.setState({heroList: tempHeroList}); 
    this.setState({selectedMember: hero });


  }


  removeSkillEffect(id, skillType, currentHero){
    let updatedHero = currentHero; //copy of current hero

    let effect = this.state.skillDropdowns[skillType].info[id].effect;
    let cdTriggerOrg = updatedHero.effects.cdTrigger;

    //let emptySkill =   Object.assign({}, this.state.skillDropdowns [skillType].info["0"]);

    if (skillType === "weapon" || skillType === "refine"){
      let pTemp = updatedHero.passive;
      pTemp["atk"] -= this.state.skillDropdowns[skillType].info[id].might; //remove the weapon's attack
      //pTemp["atk"] -= this.state.weaponList[id]["might"]; //remove the weapon's attack

      //Add the passive stats from the weapon
      let passiveStats = this.state.skillDropdowns[skillType].info[id].passive;

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

    this.updateDropdowns(this.state.selectedHeroInfo, e.target.checked, this.state.selectedMember.heroSkills.weapon.label);
    this.setState({maxFilter: e.target.checked});
  }


  onFreeMoveChange(e){
    this.clearMovement();

    let temp = this.state.heroList;

    //When this is changed, should reset any movement
    let resetHero = this.idToHero(this.state.movementCheck, temp);
    
    if (resetHero !== null){
      resetHero.cantoActive = false;
      resetHero.canto = false;
      resetHero.anchorPosition = resetHero.position;

      temp[resetHero.side][resetHero.listIndex] = resetHero;
    }
    this.setState({movementCheck: -1}); //reset movement check so that movement can be recalculated
    

    this.setState({freeMove: e.target.checked});

    this.setState({heroList: temp});

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

  //bonus is either being a bonus unit, resplendent unit, or transformed
  onBonusChange(e, bonusType){
    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex]; 
    
    if (bonusType === "bonus"){
      hero.bonus = e.target.checked;
    } else if (bonusType === "resplendent"){
      hero.resplendent = e.target.checked;
    } else if (bonusType === "transformed"){

      //set up dropdowns
      var currentHero = heroData[hero.heroID.value]; //get the heroData from heroInfo.json
      var heroDropdowns = getDropdowns(currentHero, this.state.maxFilter, hero.heroSkills.weapon.label); //get dropdown list

      let transformSkills = getTransformationSkills(hero);

      if (transformSkills.length > 0){ //check if there are any skills to add/remove
        if (e.target.checked){ //transform hero, add effects

          for (let x of transformSkills) {
            let additionalSkill  = heroDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;
            hero = getSkillEffect(additionalSkill, x[0], hero, heroDropdowns); //add the extra skills as well
          }

        } else{ //detransform, remove effects

          for (let x of transformSkills) {
            let additionalSkill  = heroDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;
            hero = this.removeSkillEffect(additionalSkill , x[0], hero);
          }


        }


      }

      hero.transformed = e.target.checked; //update the transform value

    } //end if transformed changing





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
      this.endHeroTurn(hero);
      // hero.debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
      // hero.statusEffect = JSON.parse(JSON.stringify(statusDebuffs));//{"guard": 0, "panic": 0}; 
      if (hero.cantoActive){
        hero.cantoActive = false;
      }

    }

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: hero});


  }

  endHeroTurn(hero){ //wait the hero and run other functions that occur when their turn ends (through waiting or an action)
      
      waitHero(hero);

      if (hero.id === this.state.movementCheck){ //only clear movement if the movement check if for the current hero
        this.clearMovement();
        this.setState({movementCheck: -1});
        this.setState({anchorPosition: -1 });
      }


  }

  onIVChange(e, type){
    let temp = this.state.heroList;

    let hero = temp[this.state.playerSide][this.state.heroIndex];
    let ivList =  Object.assign({}, hero.iv);
    

    //if either iv is set to neutral, set the other one to neutral as well if we are not changing an ascended IV
    if (e.target.value === "neutral" && (type === "asset" || type === "flaw") ){
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

  //When support levels or blessings change, update the hero's stats
  onSupportLevelChange(e, type){
    let temp = this.state.heroList;

    let hero = temp[this.state.playerSide][this.state.heroIndex];



    if (type === "allySupportLevel"){
      //Remove old previous support skill
      var updatedDropdowns = getDropdowns(heroData[hero.heroID.value], false, ""); //we are only interacting with o skills here so the weapon does not matter
      var supportSkill;
      if (hero.allySupportLevel !== "None"){ //no support level, do not need to remove

     // let additionalSkill  = heroDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;
     //            i = this.removeSkillEffect(additionalSkill , x[0], i);
                
        supportSkill  = updatedDropdowns["o"].list.find(findSkillWithName, "Ally Support " + hero.allySupportLevel + " 1").value;

        hero = this.removeSkillEffect(supportSkill, "o", hero); //add the extra skills as well

        supportSkill  = updatedDropdowns["o"].list.find(findSkillWithName, "Ally Support " + hero.allySupportLevel + " 2").value;

        hero = this.removeSkillEffect(supportSkill, "o", hero); //add the extra skills as well
      }


      //Add new support skill
      if (e.target.value !== "None"){
        supportSkill  = updatedDropdowns["o"].list.find(findSkillWithName, "Ally Support " + e.target.value + " 1").value;

        hero = getSkillEffect(supportSkill, "o", hero, updatedDropdowns); //add the extra skills as well

        supportSkill  = updatedDropdowns["o"].list.find(findSkillWithName, "Ally Support " + e.target.value + " 2").value;

        hero = getSkillEffect(supportSkill, "o", hero, updatedDropdowns); //add the extra skills as well
      }


      calculateAuraStats(temp, this.state); //recalculate aura stats




  }

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
    calculateAuraStats(temp, Number(e.target.value)); //recalculate aura stats


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
    temp = temp.concat(this.state.structureList["1"], this.state.structureList["2"], this.state.structureList["3"]);
    // eslint-disable-next-line
    for (let x of temp){
      if (x.position>=0)
        positions.push(x.position);
    }


    return positions;
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

  //This handles dropping team members on the side panel. Dropping members on another will swap them. This will change their list indices but not affect their id.
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

    //they have swapped and need their listIndex updated - they are the same because they have been swapped but the dragData/dropData have the correct listIndices
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
    
    if (dragData.type === "structure"){

      this.setState({draggedHero: dragData}); //We just update the dragged hero to the structure and ignore any hero movement changes
      return;
    }

    dragData.initiating = true;

    
    let temp = this.state.heroList;
    let newCells = this.state.cells;
    //1. Dragging another hero while the last hero has been moved (but no action has been completed) should move back the last hero back to its anchor position (which should also recalculate some aura stats too)
      //This does not occur while in freemove
      //This will modify the hero/cells

    //2. If canto movement is on, we will either stop canto movement or disable the drag

    //This handles the resetting a unit back to its anchor when another unit is dragged
    if (!this.state.freeMove && this.state.movementCheck >= 0 && dragData.id !== this.state.movementCheck) {

      let previousHero = this.idToHero(this.state.movementCheck, temp); //get the previous hero that was movement checked

      //previousHero.position = previousHero.anchorPosition;

      newCells[previousHero.position] = null;
      newCells[previousHero.anchorPosition] = previousHero;

      //update for new position
      previousHero.position = previousHero.anchorPosition;


    }
    // let oldHero = heroData[dragData.heroID.value];

    let actionLists = getActionLists(dragData, temp, newCells, this.state);


    
    //let pos = dragData.position;



    let assistList = this.getAssistList(dragData, temp, newCells);
    let attackList = getAttackList(dragData, newCells);


    this.setState({draggedHero: dragData});
    this.setState({draggedHeroOrg: Object.assign({}, dragData) });


    // We do a check on the previous hero's canto status. If they are in their canto movement, then we need to finish their canto movement
    // before we allow the movement of other heroes.
    let cantoCheck = false; 
    if (this.state.movementCheck >=  0) { //make sure that a previous movement check is active
      cantoCheck = this.idToHero(this.state.movementCheck, temp).cantoActive; //get the previous hero's canto status

    }


    if (!cantoCheck && !dragData.end){ //only set movement if unit's turn has not ended and a unit is not asking for a canto action

      if (this.state.movementCheck !== dragData.id ){ //movement hasn't been calculated yet and update movement with new dragged unit
        this.setState({anchorPosition: dragData.anchorPosition });
        this.setState({availableWarp: actionLists.warpList});
        this.setState({availableMovement: actionLists.movementList});
        this.setState({movementCheck: dragData.id});
        this.setState({spaceRemainders : actionLists.spaceRemainders});
      }


      this.setState({availableAssist: assistList});
      this.setState({availableAttack: attackList});
      
    }


    this.setState({heroList: temp});
    this.setState({cells: newCells});    
    

  }


  idToHero(id, heroList){ //Given an id and herolist,  return the hero


    for (let team in heroList){ //loop both teams
      for (let hero of heroList[team]){ //loop through each member
        
        if (hero.id === id){
          return hero;
        }


      }
    }

    return null;

  }

  //Assist list is seperate from other actions beause it needs to check that the assists will work
  getAssistList(hero, heroList, newCells){
    let assist = -1;


    if (hero.assist.range !== null)
      assist = hero.assist.range;

    let assistList = [];

    //Assist space calculation

    if (assist > 0 && hero.statusEffect.isolation < 1){ //check for assist ability and for no isolation status


      let assistSpaces = getSpacesInExactRange(hero.position, assist);

      for (let s of assistSpaces){
        if (newCells[s] !== null && newCells[s].type === "hero" && newCells[s].side === hero.side && newCells[s].statusEffect.isolation < 1 ){ //check for same team and isolationhave



          //loop through assist effects and see if they will be activatable
          let assistValid = false;
          for (let assistType of hero.assist.type){

            if (assistType === "movement"){

              assistValid = this.checkMovementAssist(heroList, hero, newCells[s], hero.assist.effect); 


            } else if (assistType === "rally"){
              assistValid = this.checkRallyAssist(heroList, hero, newCells[s], hero.assist.effect);


            } else if (assistType === "health"){
              assistValid = this.checkHealthAssist(heroList, hero, newCells[s], hero.assist.effect);
              
            } else if (assistType === "heal"){
              assistValid = this.checkHealAssist(heroList, hero, newCells[s], hero.assist.effect);
              
            } else if (assistType === "dance"){
              assistValid = this.checkDanceAssist(heroList, hero, newCells[s]);
            } else if (assistType === "neutralize"){
              assistValid = this.checkNeutralizeAssist(heroList, hero, newCells[s], hero.assist.effect);
            }

            if (assistValid){
              assistList.push(s);
              break;  
            }

          } //end for



          
        
        } //end check space
      } //end check assist spaces

    } //end assist space calculation

    return assistList;

  }





  //given an list of allies and a requirement object, return a list of heroes that meet the requirements
  //loop through given list of allies, and remove/filter any that do that pass the requirement
  //do we want to do it by hero references or 
  heroReqCheck(owner, teamList, heroReq){

    let filteredList = [];//[...allyList]; //copy of allyList


    filteredList = teamList.filter(checkConditionHero(owner, heroReq, this.state.heroList, this.state) ); //filter out 


    //checkCondition(heroList, x.condition, owner, enemy, this.state.currentTurn);

    return filteredList;
  }


  dragOverBoard(ev){
    ev.preventDefault();


    let dropPosition = ev.target.id;



    //When dragging over empty spaces, do not update. Structures also do not do anything when dragged over anything
    if (dropPosition === null ||  this.state.draggedHero.type === "structure"){
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
    if (cellContent !==null && this.state.draggedHero.side !== cellContent.side && cellContent.type === "hero"){

      //if it is not the same draggedOver as before or if there was none before for battle forecast
      if ( this.state.draggedOver === null ||   this.state.draggedOver.position !== dropPosition) {

        //Restore AOE HP values here


        let draggedOverHero = JSON.parse(JSON.stringify(newCells[dropPosition]) ); // copies hero - non-reference copy so this copy can have temporary effects
        let draggedHero = JSON.parse(JSON.stringify(this.state.draggedHeroOrg)); //get the original dragged hero


        let preBattleDamage = -1;

        let orgHP = draggedOverHero.currentHP;

        let preBattleDamageList = [];
        let aoePositions = [];
        let orgAOEHP = [];

        //check if attacker is using an aoe special and if it is charged
        if (draggedHero.special.type === "pre-battle" && draggedHero.special.charge === 0){
          //do aoe
          preBattleDamageList = new Array(draggedHero.special.effect.pattern.length).fill(0); //fill up damage list
          aoePositions = getAOEPositions(draggedOverHero.position, draggedHero.special.effect.pattern);
          orgAOEHP = new Array(draggedHero.special.effect.pattern.length).fill(0); //fill up damage list

          //loop through the aoe'd positions to get preBattle damage
          for (let i = 0; i < aoePositions.length; i++){

            //check for position out of bounds, empty cell, or if on same team
            if (aoePositions[i] >= 0 && newCells[aoePositions[i]] !== null && draggedHero.side !== newCells[aoePositions[i]].side ){

              let draggedCopy = JSON.parse(JSON.stringify(draggedHero));
              let aoeTargetCopy = JSON.parse(JSON.stringify(newCells[aoePositions[i]]));

              let aoeDamage = calculatePreBattleDamage (draggedCopy, aoeTargetCopy, this.state.heroList, this.state); 
              preBattleDamageList[i] = aoeDamage;
              orgAOEHP[i] = aoeTargetCopy.currentHP; 
            } else { //out of bounds or no hero found
              preBattleDamageList[i] = -1;
            }

          }


          //Loop through each aoe position, if a hero is found, else set that aoe value in list to -1
          //if hero is found, we need to create another copy of the dragged hero and the hero in the aoe
            //We need deep copies as we need to recalculate the precombatconditionalEffects and variable precombat abilities for each hero they hit
          preBattleDamage =  calculatePreBattleDamage (draggedHero, draggedOverHero, this.state.heroList, this.state);


          //remove any effects from conditional specials (before any changes to the dragged hero is applied so that the same conditions pass)
          removeConditionalSpecial(draggedHero, draggedOverHero, this.state.heroList, this.state);

          draggedOverHero.currentHP = Math.max(1, draggedOverHero.currentHP - preBattleDamage); 

          draggedHero.special.charge = draggedHero.special.cd;
          draggedHero.specialActivated = true;




        } //end prebattle

        //A copy of the hero list that is a temporary battle version of the list (main difference is different HP values due to AOE specials)
        let heroListCopy = JSON.parse(JSON.stringify(this.state.heroList));


        //apply aoe damage
        for (let i = 0; i < aoePositions.length; i++){
          if (preBattleDamageList[i] >= 0){ //if the position is confirmed hit a hero
            let hitHero = newCells[aoePositions[i]]; //get the hit hero

            heroListCopy[hitHero.side][hitHero.listIndex].currentHP = Math.max(1, hitHero.currentHP - preBattleDamageList[i]);
          }

        }


        // Object.keys(draggedHero.combatEffects.statBuff).forEach((key, i) => {
        //   draggedHero.combatEffects.statBuff[key]+= Math.trunc(draggedHero.buff[key] * draggedHero.combatEffects.bonusDouble);
        // });


        let saviorHero = this.getSaviorHero(heroListCopy, draggedHero, draggedOverHero);


        //when there is a savior hero, overwrite the dragged over hero with the savior
        if (saviorHero !== null){
          heroListCopy[draggedOverHero.side][draggedOverHero.listIndex].currentHP = draggedOverHero.currentHP; //since the dragged over hero will be replaced with the savior, we will set their HP in the heroList copy (so their aoe damage is applied to them)

          draggedOverHero = saviorHero;

          let saviorIndex = aoePositions.indexOf(this.state.heroList[saviorHero.side][saviorHero.listIndex].position);
                    //if the savior was hit by the AOE, then replace battle window info with the savior hero's
          if (saviorIndex >= 0){  

            orgHP = orgAOEHP[saviorIndex];
            preBattleDamage = preBattleDamageList[saviorIndex];
          } else { //savior not hit by AOE
            orgHP = saviorHero.currentHP
            preBattleDamage = -1; 
          }



        }

        //"effect": [{"type": "conditionalEffects", "condition": [["phase", "enemy"], ["combatCount", 0] ], "firstReduction": 0.5 }],
        if (draggedHero.statusBuff.fallenStar > 0){
          draggedHero.conditionalEffects.push({"type": "conditionalEffects", "condition": [["combatCount", 0]], "firstReduction": 0.2 }); //Add conditional effect of fallen star

        }

        if (draggedOverHero.statusBuff.fallenStar > 0){
          draggedOverHero.conditionalEffects.push({"type": "conditionalEffects", "condition": [["combatCount", 0]], "firstReduction": 0.2 }); //Add conditional effect of fallen star

        }


        if (draggedHero.statusBuff.triangleAttack > 0){
          draggedHero.conditionalEffects.push({"type": "conditionalEffects", "condition": [["allyReq", "owner", [["distanceCheck", 2], ["statusCheck", "player", "statusBuff", "triangleAttack"]], 2, "greater"]], "brave": 1} ); //Add conditional effect of fallen star
        }

        
        //Aura effects are effects granted by auras 
        this.getAuraEffects(draggedHero, draggedOverHero, heroListCopy);
        this.getAuraEffects(draggedOverHero, draggedHero, heroListCopy);



        //For conditional effects that check for buff/debuffs and also provide neutralzing effects 
        //These have priority as they will activate before other neutralizers This is basically for idunn and brunnya's weapons
        //No longer true- These must be after conditional effects as neutralizers from there can falsify the condition - 
        getConditionalEffects(draggedHero, draggedOverHero, "conditionalBonusPenaltyNeutralizers", heroListCopy, this.state);
        getConditionalEffects(draggedOverHero, draggedHero, "conditionalBonusPenaltyNeutralizers", heroListCopy, this.state);



        //Regular conditional effects that do not depend on effects on other skills
        //An exception to this is idunn's zephyr breath which will reside here.
          //As the initiator, zephyr breath will activate before the enemy's neutralizers can come into play
          //As the defender, enemy neutralizations will come first and can cancel out this ability
        getConditionalEffects(draggedHero, draggedOverHero, "conditionalEffects", heroListCopy, this.state);
        getConditionalEffects(draggedOverHero, draggedHero, "conditionalEffects", heroListCopy, this.state);


        //Here all neutralizations should be added

        //Combat effects that provide stats but need buff/debuff neutralizations -
        getConditionalEffects(draggedHero, draggedOverHero, "conditionalCombatStats", heroListCopy, this.state);
        getConditionalEffects(draggedOverHero, draggedHero, "conditionalCombatStats", heroListCopy, this.state);

        //Get stats buffs that have variable amounts of stats provided - this requires buffs/debuffs to be calculated
        getVariableStats(draggedHero, draggedOverHero, heroListCopy, this.state);
        getVariableStats(draggedOverHero, draggedHero, heroListCopy, this.state);

        //calulcating aura stats based on battling heroes
        calculateBattlingAuraStats(heroListCopy, draggedHero, draggedOverHero);



        //At this point combat stats should be mostly finalized .

        draggedHero.combatStats = calculateCombatStats(draggedHero, draggedOverHero);
        draggedOverHero.combatStats = calculateCombatStats(draggedOverHero, draggedHero);


        //conditionalPreCombatStats

        //Conditional effects that need mostly finalized combat stats, The initator gets priority here and the stat changes from the initator here can affect the defender's initation of these skills 
        getConditionalEffects(draggedHero, draggedOverHero, "conditionalPreCombatStats", heroListCopy, this.state);
        //Recalculate for defender's check
        draggedHero.combatStats = calculateCombatStats(draggedHero, draggedOverHero);
        draggedOverHero.combatStats = calculateCombatStats(draggedOverHero, draggedHero);

        getConditionalEffects(draggedOverHero, draggedHero, "conditionalPreCombatStats", heroListCopy, this.state);


        //Now combat stats should be fully finalized
        draggedHero.combatStats = calculateCombatStats(draggedHero, draggedOverHero);
        draggedOverHero.combatStats = calculateCombatStats(draggedOverHero, draggedHero);


        //Conditional effects that need final combat stats
        getConditionalEffects(draggedHero, draggedOverHero, "conditionalCombat", heroListCopy, this.state);
        getConditionalEffects(draggedOverHero, draggedHero, "conditionalCombat", heroListCopy, this.state);




        //currently brash assault's double is calculated in getAttack count (which is used for conditional follow ups) - can make a conditional type for conditonalCounter (checks if enemy can counter which must occur after the sweeps in conditional combat)
        // specifically for brash assault but will keep it in getattack count for now

        //Conditional effects that check for followups which requires final stats (for speed check) and conditionalCombat effects (in particular, wind/water/myhrr sweep effects are conditionalcombat effects which affect followups)
        getConditionalEffects(draggedHero, draggedOverHero, "conditionalFollowUp", heroListCopy, this.state);
        getConditionalEffects(draggedOverHero, draggedHero, "conditionalFollowUp", heroListCopy, this.state);

        //Variable effects that need final combat stats - Must be after conditionalfollowup as they can grant these effects
        getVariableCombat(draggedHero, draggedOverHero, heroListCopy, this.state);
        getVariableCombat(draggedOverHero, draggedHero, heroListCopy, this.state);


        this.setState({battleHeroList: heroListCopy});

        this.setState({draggedHero: draggedHero});
        this.setState({draggedOverOriginalHP: orgHP});
        this.setState({preBattleDamage: preBattleDamage});


        this.setState({preBattleDamageList: preBattleDamageList});
        this.setState({preBattleDamagePositions: aoePositions});

        this.setState({draggedOver: draggedOverHero}); //setting dragedOver will activate the battlewindow to calculate battle forecast


        //TODO add an extra state that is a list of spaces if aoe special would be activated - and a sub list of those spaces of the new hp values of any heroes that would be affected
        //e.g. have a list of numbers indicating spaces affected. for each space, also have a corresponding text which will be "" if no hero is there and their new hp if otherwise
      }


    } else if (cellContent !==null && this.state.draggedHero.side !== cellContent.side && cellContent.type === "structure"){


      if ( this.state.draggedOver === null ||   this.state.draggedOver.position !== dropPosition) {
        let draggedOverHero = JSON.parse(JSON.stringify(newCells[dropPosition]) ); // copies hero - non-reference copy so this copy can have temporary effects
        let draggedHero = JSON.parse(JSON.stringify(this.state.draggedHeroOrg)); //get the original dragged hero


        //let preBattleDamage = -1;

        let orgHP = draggedOverHero.currentHP;



        this.setState({draggedHero: draggedHero});
        this.setState({draggedOverOriginalHP: orgHP});
        this.setState({draggedOver: draggedOverHero});

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
        
        if ("allyCondition" in effect && !checkCondition(heroList, effect.allyCondition, ally, defender, this.state)){
          continue;
        }

        if ("enemyCondition" in effect && !checkCondition(heroList, effect.enemyCondition, ally, attacker, this.state)){
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
  //For the given hero,  loop through their team for aura effects 
  //do not need to loop through enemies as there are not any aura debuffs yet?
    //Update - Aura debuffs introduced with Thunderhead Eff+
  //Examples include close guard, infantry rush etc.
  getAuraEffects(hero, enemy, heroList){


    let nihilCheck = false;
    if (enemy.combatEffects.teamNihil > 0){
      nihilCheck = true;
    }
    // //right now it loops through the hero's team and applies aura effects to them
    // we have 2 options for enemy aura effects
    //  1.  Instead of only looping your team's auras, also loop through the enemies auras
          //this also requires that we have a check the that aura is applied to their team
    // 2. We keep the loop and apply aura effects depending on team --
    //  So we loop through team 1's aura's and apply to hero/enemy depending on team

    //i think we got with 2 because it's less team loops and is simpler
    //like with 1,  we will 

    //   let teamNihil = false; 

    //   //Team nihil is activated from opposite team
    //   if (getEnemySide(hero1Team) === team  && hero1.combatEffects.teamNihil > 0){
    //     teamNihil = true;
    //   } else if (getEnemySide(hero2Team) === team  && hero2.combatEffects.teamNihil > 0){
    //     teamNihil = true;

    //   }


    for (let teammate of heroList[hero.side]){ //loop through teammates

      if (nihilCheck && teammate.id !== hero.id){ //if enemy has teamNihil effects, then only the hero's auras are used so will skip the others
        continue;
      }

      for (let effect of teammate.auraEffects){ //loop through teammate's aura effects

        if (effect === null || effect === undefined) {continue;}

        if ("condition" in effect && !checkCondition(heroList, effect.condition, teammate, teammate, this.state) ){ //make sure teammate has met condition to provide the uara
          continue;
        }

        let targetedHero = hero; // by default, hit the hero
        if (effect.team === "owner"){
          targetedHero = hero;
        } else if (effect.team === "enemy"){
          targetedHero = enemy;
        }


        //if aura is from another hero, use effectReq, otherwise use selfReq
        if ("effectReq" in effect && checkCondition(heroList, effect.effectReq, teammate, targetedHero, this.state) && teammate.id !== targetedHero.id  ){ //check if the hero meets the allyReq to gain the aura effects - Also check if its not themselves

          addEffect(targetedHero, effect.auraEffects); //adds the effects to the hero

        } else if ("selfReq" in effect && checkCondition(heroList, effect.selfReq, teammate, targetedHero, this.state) && teammate.id === targetedHero.id ){ //if selfReq is being used, the targeted hero should be the hero. Otherwise, it would use the effectReq

          addEffect(targetedHero, effect.auraEffects);
        }

        

      } //end effect


    } //end teammate loop



  }







  //Same as variable combat, but occurs before combat is initiated


  dragEnd(ev){
    ev.dataTransfer.clearData();
    //this.setState({anchorPosition: -1 });

    this.setState({draggedOver: null});
    this.setState({draggedHero: null});
    this.setState({draggedHeroOrg: null});
    this.setState({battleHeroList: null});
    this.setState({draggedOverOriginalHP: 0});
    this.setState({preBattleDamage: -1});
    
    this.setState({preBattleDamageList: []});
    this.setState({preBattleDamagePositions: []});


  }


  clearMovement(){
    this.setState({anchorPosition: -1 });
    this.setState({availableMovement: []});
    this.setState({availableWarp: []});
    this.setState({availableAssist: []});
    this.setState({availableAttack: []});


  }

  //Action Function - This function handles actions on heroes (movement, assists, attacks etc)
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
    let tempStructures = this.state.structureList;

    let newCells = this.state.cells;


    let cantoCheck = false; //canto does not occur by default - this is a check that tells us if canto has been activated so movement should be calculated

    let actionSuccess = false; //check to see if an action has successfully been done


    //if spot is already filled then start an assist or attack
    if (newCells[dropPosition] !==null) {




      //at this point, we should probably use this.state.draggedOver over newCells since the position is confirmed to have a hero.
      //the cells version should not have any temporary effects which don't really matter for assists and movements (only battles)
      let dropIndex = newCells[dropPosition].listIndex;
      let dropSide = newCells[dropPosition].side;


      //let tempOrg = temp;

      //Assist
      //Check if in range for assist and they are on the same side

      if (dragData.type === "structure"){
        //do nothing
      } else if ( this.state.availableAssist.includes(newCells[dropPosition].position) && dragData.side === newCells[dropPosition].side && dragData.statusEffect.isolation < 1 && newCells[dropPosition].statusEffect.isolation < 1){
        //restore AOE HP values here

        //Note - These apply functions currently use a copy of the the assister (drag data) and assistee (dropPosition in cell list) 
        //Only one change is done at a time for the most part so this is fine, but for movement heal, it applies two effects, so the applyHealAssist portion uses the updated assister

        if (dragData.assist.range > 0){ //first check if there is a valid range value on the assist 




          for (let assistType of dragData.assist.type){

            //Get conditional effects for the assister - This is mainly so that we can conditional canto effects for stuff like regin's sword, which activates on assists
            //This will also activate other abilities such as swift sparrow but this should not effect assists since they do not use combat effects/stats
            getConditionalEffects(dragData, newCells[dropPosition], "conditionalEffects", this.state.heroList, this.state); 
            

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
              temp = this.applyRallyAssist(temp, dragData, newCells[dropPosition], dragData.assist.effect);


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

        //The check on availableAssist spaces means that the assist will be sucessful, thus the action is successful
        this.endHeroTurn(temp[dragSide][dragIndex]);

        let refList = JSON.parse(JSON.stringify(temp)); //deep copy for reference 

        //Assist actions are for effects that specifically only occur once per turn
        //Other effects that activate on assist will be added as O skills

        if ("subeffect" in temp[dragSide][dragIndex].assist.effect){

          for (let effect of temp[dragSide][dragIndex].assist.effect.subeffect ){ //loop through subeffect under assist for 
            if (effect === null || effect === undefined) {continue;}

            if ( "condition" in effect && !checkCondition(temp, effect.condition, temp[dragSide][dragIndex], temp[dragSide][dragIndex], this.state) ){ //check if condition has not been met skip
              continue;
            }

            //assist actions are assaction effects that grant can only occur once per turn (usually, gives extra actions)
            if (effect.type === "assistAction" &&  !temp[dragSide][dragIndex].assistAction){ 

              calculateBuffEffect(temp, refList, temp[dragSide][dragIndex], effect, this.state);  
              temp[dragSide][dragIndex].assistAction = true; //set this value to true so 
            } else if (effect.type === "assistEffect"){ 
              //assistEffects occur any time the assist is used as many times as possible per turn
              //Most effects attached to assists will use O skills to do this but activating the effect here will trigger the effect at after the assist activates. This allows self debuffs to not be immediately cleared
              calculateBuffEffect(temp, refList, temp[dragSide][dragIndex], effect, this.state);  
            }
            //I don't think assists do any postdamage/special reductions//, allyTeamPost, allyTeamSpecial, enemyTeamPost, enemyTeamSpecial);

          } //end effects

          
        }
        
        actionSuccess = true;


      //Attack
      //Check if in range for attack and if they are on the same side
      } else if ( this.state.availableAttack.includes(newCells[dropPosition].position) && getDistance(dragData.position, newCells[dropPosition].position) === dragData.range && dragData.side !== newCells[dropPosition].side ){



        for (let i = 0; i < this.state.preBattleDamagePositions.length; i++){ //attack has been confirmed, apply the aoe damage
          if (this.state.preBattleDamageList[i] >= 0){ //if the position is confirmed hit a hero
            let hitHero = newCells[this.state.preBattleDamagePositions[i]]; //get the hit hero

            temp[hitHero.side][hitHero.listIndex].currentHP = Math.max(1, hitHero.currentHP - this.state.preBattleDamageList[i]);
          }

        }

        if (newCells[dropPosition].type === "structure"){
          getConditionalEffects(dragData, dragData, "conditionalEffects", this.state.heroList, this.state); 

          newCells[dropPosition].currentHP = Math.max(newCells[dropPosition].currentHP - 1, 0);
          if (newCells[dropPosition].currentHP <= 0){
            this.removeStructure(dropPosition);
          }

          this.endHeroTurn(temp[dragSide][dragIndex]);
        }

        else {
          let orgAttackerPos = temp[dragSide][dragIndex].position;
          let orgDefenderPos = temp[dropSide][dropIndex].position;
          temp = doBattle(temp, dragData, this.state.draggedOver, newCells, this.state); //do battle has to use the combat versions of drag and draggedOver heroes

          //clear initial positions of attacker/defender
          newCells[orgAttackerPos] = null;
          newCells[orgDefenderPos] = null;


          if ( temp[dragSide][dragIndex].swapAllyPosition >= 0){

            let swapAllyPosition = temp[dragSide][dragIndex].swapAllyPosition;

            let swapAllySide = newCells[swapAllyPosition].side;
            let swapAllyIndex = newCells[swapAllyPosition].listIndex;
            
            //clear initial position of swapAlly
            newCells[swapAllyPosition] = null;

            newCells[temp[swapAllySide][swapAllyIndex].position] = temp[swapAllySide][swapAllyIndex]; //move swap ally to their new position
            temp[dragSide][dragIndex].swapAllyPosition = -1; //reset
          }

          


          //move the attacker/defender to their new positions
          newCells[temp[dragSide][dragIndex].position] = temp[dragSide][dragIndex];
          newCells[temp[dropSide][dropIndex].position] = temp[dropSide][dropIndex];




          this.endHeroTurn(temp[dragSide][dragIndex]);


          //after all post combat stuff is done, post combat specials activate (galeforce, requiem dance etc)

          //currently, post combat specials only occur when initiating
          let refList = JSON.parse(JSON.stringify(temp)); //deep copy for reference 

          if (temp[dragSide][dragIndex].special.charge === 0 && temp[dragSide][dragIndex].special.type === "post-battle" && !temp[dragSide][dragIndex].galeforce){
            for (let effect of temp[dragSide][dragIndex].special.effect){

              if (effect === null || effect === undefined) {continue;}

              if ( "condition" in effect && !checkCondition(temp, effect.condition, temp[dragSide][dragIndex], temp[dragSide][dragIndex], this.state) ){ //check if condition has not been met skip
                continue;
              }

              calculateBuffEffect(temp, refList, temp[dragSide][dragIndex], effect, this.state);  //I don't think assists do any postdamage/special reductions//, allyTeamPost, allyTeamSpecial, enemyTeamPost, enemyTeamSpecial);

            }

            temp[dragSide][dragIndex].special.charge = temp[dragSide][dragIndex].special.cd; //reset charge
            temp[dragSide][dragIndex].galeforce = true;
          }

        }
        actionSuccess = true;
      }



      //Post action
      //An action has occured which is either an assist or battle. Buffs/debuffs usually go off after these actions so visible stats should be recalculated
      if (actionSuccess){
        temp = this.recalculateAllVisibleStats(temp);



        if (!dragData.canto){ //canto has not been used this turn by the unit

          //check for flat canto values and remainder value

          let max = -1; //current highest canto value
          for (let cantoEffect of dragData.combatEffects.canto){ // loop through canto effects

            if (cantoEffect.flatCanto > 0 || (cantoEffect.cantoRemainder > 0 && dragData.remainder > 0 )){ //first check if this canto effect will activate
              let value = cantoEffect.flatCanto;

              if (cantoEffect.cantoRemainder > 0){
                value+= dragData.remainder;
              }

              max = Math.max(value, max); //get the highest value
            }
          }

          if (max >= 0 ) { //canto value is at least 0
            cantoCheck = true;
            temp[dragSide][dragIndex].end = false;
            temp[dragSide][dragIndex].canto = true; //set canto value  to true so it does not activate again
            temp[dragSide][dragIndex].cantoActive = true;


            // let cantoValue = dragData.combatEffects.flatCanto;

            // if (dragData.combatEffects.cantoRemainder > 0){
            //   cantoValue+= dragData.remainder;
            // }

            temp[dragSide][dragIndex].cantoMovement = max; //cantoValue;


          } //end check if canto will activate.



        } ///end check if canto has been used
      } //end check if action has succeeded

    } else { //regular movement or structure
      //reset hp
      if (dragData.position === this.state.selectedPosition){ 
        this.setState({selectedPosition: dropPosition});
      }

      if (dragData.type === "structure"){

        newCells[dragData.position] = null;
        newCells[dropPosition] = dragData;
        newCells[dropPosition].position = dropPosition;
        tempStructures[dragSide][dragIndex] = dragData;

        this.setState({structureList: tempStructures});
        
      //check if movement is valid and update the game with the new positions
      //with freemove active, the movement will always be active
      //With freemove off, it needs to check if it is valid warp or move position
      } else if ( (this.state.freeMove ||   this.state.availableMovement.includes(dropPosition) || this.state.availableWarp.includes(dropPosition)) && (this.state.freeMove || dragData.id === this.state.movementCheck) ){
      //for regular movement an action hasn't been successful yet 
      //remove old from board


        //if the selected position was the dragged hero's position, also move the selected position since the selected position not following the selected does not feel right

        newCells[temp[dragSide][dragIndex].position] = null;
        

        //update for new position
        newCells[dropPosition] = temp[dragSide][dragIndex]; //update in gameboard
        temp[dragSide][dragIndex].position = dropPosition; //update in team list



        if (dropPosition in this.state.spaceRemainders){ //check if the spot has a remainder value before assigning it

          temp[dragSide][dragIndex].remainder = this.state.spaceRemainders[dropPosition]; //remainder needs to be calculated when movement is done
        }



        if (!temp[dragSide][dragIndex].cantoActive) { //canto is not active, recalculate attack/assists


          let assistList = this.getAssistList(temp[dragSide][dragIndex], temp, newCells);
          let attackList = getAttackList(temp[dragSide][dragIndex], newCells);

          this.setState({availableAssist: assistList});
          this.setState({availableAttack: attackList});

          if (this.state.freeMove){
            temp[dragSide][dragIndex].anchorPosition = dropPosition; //update in team list
          }


        }



      } //end check freemove


    } //end regular movement


    //a check for an action occurring needs to occur




    calculateAuraStats(temp, this.state);

    if (dragSide !== this.state.playerSide || dragIndex !== this.state.heroIndex){ //if moved hero is not the currently selected hero, reset that hero's remainder value
      temp[this.state.playerSide][this.state.heroIndex].remainder = getHeroMovement(this.state.selectedMember);

    }




    //this reset all tiles ( but should it?)
    if (!dragData.cantoActive){
      
    }
    this.dragEnd(ev); //reset the prediction menu 

    if (cantoCheck){ //canto has been activated

      let tempCantoHero = JSON.parse(JSON.stringify(temp[dragSide][dragIndex]) ); //create a temporary version of the hero with canto so that we can add temporary effects.


      let actionLists = getActionLists(tempCantoHero, temp, newCells, this.state);


      this.setState({availableWarp: actionLists.warpList});
      this.setState({availableMovement: actionLists.movementList});
      

      //When the action is done, movementcheck/anchors are cleared, so we need to set new ones
      this.setState({movementCheck: temp[dragSide][dragIndex].id });  
      this.setState({anchorPosition: temp[dragSide][dragIndex].position });

    }



    //actions (attack/assist), will mark canto so that canto movement is then calculated and set
      //at this point, moving the selected unit will also end their turn
      //if any other unit is dragged, then the canto unit will have their turn ended. Can still select other units tho.

    // update hero list
    this.setState({heroList: temp});

    //make the hero that did the last action the new selected member
    //this.selectNewMember(dragSide, dragIndex);


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

          if ("assistExclude" in effect && effect.assistExclude.includes("assister")){
              continue; //on assist effect does not activate as the assister
          }

          let side = 0;
          let range = effect.range;

          if (effect.team === "owner"){
            side = assister.side;
          } else if (effect.team === "enemy") {
            side = getEnemySide(assister.side);

          }


            //let buffs = i.buff;
            

          let heroesInRange = [];
              //"effect": [{"type": "onAssist", "assistType": "movement", "subtype": "debuff", "checkType": "targeting", "list": ["stats"], "value": 6, "stats": ["atk", "def"], "checkStats": ["distance"], "team": "enemy", "range": 4, "from": ["assister", "assistee"], "targetReq": [["distanceCheck", 4]], "peak": "min"}],

          //if effect is targeting, get heroes using peakList e.g. snags
          if ("checkType" in effect && effect.checkType === "targeting"){ 

            if (effect["from"].includes("assister") ){
              heroesInRange = getPeakList(effect.checkStats, list[assister.side][assister.listIndex], list[side], list[side], effect.peak, effect.targetReq, this.state);
            }

            if (effect["from"].includes("assistee") ){
              heroesInRange = heroesInRange.concat(getPeakList(effect.checkStats, list[assistee.side][assistee.listIndex], list[side], list[side], effect.peak, effect.targetReq, this.state));
            }

          } else if (range > 0){ //effect does not target and takes heroes within a range instead e.g. sabertooth fang/laslow blade
            //if range is 0, then it won't effect other heroes instead
            if (effect["from"].includes("assister") ){
              heroesInRange = getDistantHeroes(list[side],  list[assister.side][assister.listIndex], [assistee.id], range);
            }

            if (effect["from"].includes("assistee") ){
              heroesInRange = heroesInRange.concat(getDistantHeroes(list[side], list[assistee.side][assistee.listIndex], [assister.id], range)); 
            }
         
          }

          if ("exclude" in effect){ //if there is an exclude keyword, check to see if participants will be affected - should only really be for buffs, debuffs will exclude them automatically
          //This can also be used to apply debuffs to the assister/assistee
          //e.g. to change fate is a debuff and excludes the other so that it applies to themselves
          //theoretically, we can have an empty exclude on a debuff to make it apply to assister/assistee


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



          applyBuffList(list, heroesInRange, effect, assister, this.state); //postTeam, postSpecial); // these shouldn't effect postteam/specials so can be undefefined




        }

      } //end for assister moveAssist

      for (let effect of assistee.onAssist){ //loop through each on move assist effect on the assistee

        //check if the onAssist effect is for movement assists and that 
        if (effect !== null && effect["assistType"] === "movement"){


          if ("assistExclude" in effect && effect.assistExclude.includes("assistee")){
              continue; //on assist effect does not activate as the assistee
          }

          let side = 0;
          let range = effect.range;

          if (effect.team === "owner"){
            side = assister.side;
          } else if (effect.team === "enemy") {
            side = getEnemySide(assister.side);

          }


          let heroesInRange = [];


          if ("checkType" in effect && effect.checkType === "targeting"){ 

            if (effect["from"].includes("assister") ){
              heroesInRange = getPeakList(effect.checkStats, list[assister.side][assister.listIndex], list[side], list[side], effect.peak, effect.targetReq, this.state);
            }

            if (effect["from"].includes("assistee") ){
              heroesInRange = heroesInRange.concat(getPeakList(effect.checkStats, list[assistee.side][assistee.listIndex], list[side], list[side], effect.peak, effect.targetReq, this.state));
            }

          } else if (range > 0){
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
          } else if (effect.subtype === "buff") { //if no excluding occurs and effect provides a buff, then apply the buff to assist and assistee 
            heroesInRange.push(list[assister.side][assister.listIndex]);
            heroesInRange.push(list[assistee.side][assistee.listIndex]);
          }


          applyBuffList(list, heroesInRange, effect, assistee, this.state);





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

  applyRallyAssist(updatedHeroList, assister, assistee, effect){
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

         //only do this assistee check for the assister's effect so extra buffs can be added to the rally. The assistee who is being rallied shouldn't have an effect that causes it to gain extra rally effects.
         //The assistee key in the effect determines if the on rally assist applies to the assistee as well (they need to also pass the effectreq still)
        if ("assistee" in i && i["assistee"]){
          affectedHeroes.push(assistee);
        }


        if ("effectReq" in i){
          affectedHeroes = heroReqCheck(assister, affectedHeroes, i.effectReq, refList, this.state); //Get the list of allies that pass the req check
        }
        applyBuffList(list, affectedHeroes, i, assister, this.state);

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
          affectedHeroes = heroReqCheck(assistee, affectedHeroes, i.effectReq, refList, this.state); //Get the list of allies that pass the req check
        }

        applyBuffList(list, affectedHeroes, i, assistee, this.state);





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


      if ( (newAssisteeHP > assistee.currentHP && (assistee.statusEffect.deepWounds > 0 || assistee.combatEffects.nullHeal > 0)) || 
          (newAssisterHP > assister.currentHP && (assister.statusEffect.deepWounds > 0 || assister.combatEffects.nullHeal > 0)) ) {
      //if a unit is gaining hp and they have deep wounds or nullHeal, then assist will not happen (unit with deepwounds/nullheal can still heal others)
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

      if ( maxGive < effect.transferMin || healAmount === 0 || assistee.statusAffect.deepWounds > 0 || assistee.combatEffects.nullHeal > 0 ){ 
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

      if ( (newAssisteeHP > assistee.currentHP &&  (assistee.statusEffect.deepWounds > 0 || assistee.combatEffects.nullHeal > 0)) || 
        (newAssisterHP > assister.currentHP &&  (assister.statusEffect.deepWounds > 0 || assister.combatEffects.nullHeal > 0)) ) { //if a unit is gaining hp and they have deep wounds, then assist will not happen (unit with deepwounds can still heal others)
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

      if ( maxGive < effect.transferMin || healAmount === 0 || assistee.statusAffect.deepWounds > 0 || assistee.combatEffects.nullHeal > 0){ //if the hp that can be transferred is less than the minimum heal, then do not apply assist and return list -or if the assistee is not being healed any ammount of hp
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

      if (checkCondition(heroList, [["penalty", "enemy", "battleStart"]], assister, assistee, this.state )){ //First check if assistee has a penalty on them before restoring

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


            if (x.statusEffect.deepWounds < 1 && x.combatEffects.nullHeal < 1){
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
    if (assistee.statusEffect.deepWounds > 0 || assistee.combatEffects.nullHeal > 0){ //deep wounds will reduce to 0
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
    if (assister.statusEffect.deepWounds > 0 || assister.combatEffects.nullHeal > 0){ //deep wounds will reduce to 0
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

    let refList = JSON.parse(JSON.stringify(list));
    let teamList = refList[assister.side];


    for (let effect of assister.onAssist){ //loop through each dance effect
      if (effect !== null && effect["assistType"] === "dance"){


        if (effect.team === "owner"){
          teamList = list[assister.side];
        } else if (effect.team === "enemy"){
          teamList = list[getEnemySide(assister.side)];
        }

        if (effect.checkType === "reqCheck"){

          let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)
          for (let x in teamList){
            if (heroValid(teamList[x]) && teamList[x].id !== assister.id && teamList[x].id !== assistee.id  ){ //exclude assister and assistee, they have their own reqs to be included
              teamListValid.push(teamList[x]);
            }
          } 


          let passedHeroList = [];
          if ("effectReq" in effect){
            passedHeroList = heroReqCheck(assister, teamListValid, effect.effectReq, refList, this.state); //Get the list of allies that pass the req check

            applyBuffList(list, passedHeroList, effect, assister, this.state);

          } //end ally req


          if ("assisteeRefReq" in effect && effect.assisteeRef){ //if assisteeRef is true, then we also check witht the assisteRefReq with respect to the assistee
            passedHeroList = heroReqCheck(assistee, teamListValid, effect.assisteeRefReq, refList, this.state); //Get the list of allies that pass the req check


            applyBuffList(list, passedHeroList, effect, assistee, this.state);

          }

          if ("assisteeReq" in effect && checkCondition(list, effect.assisteeReq, assistee, assistee, this.state)) { //if assistee key is true, then also check it against effectReq
            applyBuffList(list, [assistee], effect, assister, this.state);
          }
          
          //if there is a requirement for the buff to apply to themselves
          if ("selfReq" in effect && checkCondition(list, effect.selfReq, assister, assister, this.state)) {

            applyBuffList(list, [assister], effect, assister, this.state);
          } 



        } else if (effect.checkType === "targeting"){
          let heroesInRange = [];

          if ("targetReference" in effect && effect.targetReference === "assistee"){ //targetReference allows you to specify the reference for the peak list (which can check for distance)
            heroesInRange = getPeakList(effect.checkStats, assistee, teamList, refList, effect.peak, effect.targetReq, this.state);

          } else { //by default, use assister which cantrips use
            heroesInRange = getPeakList(effect.checkStats, assister, teamList, refList, effect.peak, effect.targetReq, this.state);
          }
          applyBuffList(list, heroesInRange, effect, assister, this.state);

        } else if (effect.checkType === "targetingReqCheck"){
          let heroesInRange = [];

          if ("targetReference" in effect && effect.targetReference === "assistee"){ //targetReference allows you to specify the reference for the peak list (which can check for distance)
            heroesInRange = getPeakList(effect.checkStats, assistee, teamList, refList, effect.peak, effect.targetReq, this.state);

          } else { //by default, use assister which cantrips use
            heroesInRange = getPeakList(effect.checkStats, assister, teamList, refList, effect.peak, effect.targetReq, this.state);
          }



          for (let refHero of heroesInRange){

            let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)
            for (let x in teamList){
              if (heroValid(teamList[x]) && teamList[x].id !== refHero.id ){ //exclude themselves, self buff req is done separately
                teamListValid.push(teamList[x]);
              }
            } 


            let passedHeroList = [];
            //owner, teamList, heroReq, heroList, turn){
            if ("effectReq" in effect){

              passedHeroList = heroReqCheck(refHero, teamListValid, effect.effectReq, refList, this.state); //Get the list of allies that pass the req check


              applyBuffList(list, passedHeroList, effect, refHero, this.state);


            } //end ally req
            


          }//end loop through each refhero


        } //end targetingReqCheck



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


      if (checkCondition(heroList, [["statPenalty", "enemy", "battleStart"]], assister, assistee, this.state )){ //if enemy has a statPenalty
        return true;
      }
    //
      
    } 

    if (effect.neutralize.includes("restore")){

      if (checkCondition(heroList, [["penalty", "enemy", "battleStart"]], assister, assistee, this.state )){ //First check if assistee has a penalty on them before restoring
        
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

      if (checkCondition(list, [["statPenalty", "enemy", "battleStart"]], assister, assistee, this.state )){ //if enemy has a statPenalty
        list[assistee.side][assistee.listIndex].debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //clear debuffs

      }
    //
      
    } 

    if (effect.neutralize.includes("restore")){

      if (checkCondition(list, [["penalty", "enemy", "battleStart"]], assister, assistee, this.state )){ //First check if assistee has a penalty on them before restoring
        
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

    //let tempStructureList = this.state.structureList;


    let enemySide = getEnemySide(side);
    // this["buff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //visible buffs
    // this["statusBuff"] = {};
    for (let i of tempList[side]){ 

      //These effects last for 1 turn which means these are reset at the start of the turn
      tempList[side][i.listIndex].buff = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //reset buffs
      tempList[side][i.listIndex].statusBuff = JSON.parse(JSON.stringify(statusBuffs)); //{"bonusDouble": 0, "airOrders": 0, "mobility+": 0}; //reset status buffs
      tempList[side][i.listIndex].end = false;
      tempList[side][i.listIndex].canto = false; //reset canto value
      tempList[side][i.listIndex].assistAction = false;
      tempList[side][i.listIndex].extraAction = false; //reset extra action value
      tempList[side][i.listIndex].galeforce = false; //reset galeforce value
      //tempList[side][i.listIndex].transformed = false;
    }

    tempList = this.recalculateAllVisibleStats(tempList);//get most up to date visible stats for all heroes

    let allyTeamPost = new Array(7 + this.state.structureList["1"].length).fill(0);
    let enemyTeamPost = new Array(7 + this.state.structureList["1"].length).fill(0);

    let allyTeamSpecial = new Array(7).fill(0);
    let enemyTeamSpecial = new Array(7).fill(0);

    

    //first loop through heroes and their transform checks - These all occur before turn start effects

    //loop through heroes and their transform checks
    for (let i of tempList[side]){ //this.state.heroList[side]){ //loop through each hero


      if (i.position < 0 || i.currentHP <= 0){ continue;} //skip if hero is dead or not on the board

      //Turn Start skills

      let previousTransform = i.transformed; //get previous transform status to know if transform status changes
      let newTransform = false; //by default, untransform
      let transformSkills = [];

      for (let effect of i.transformationEffect){ //loop through each transformation effects , should only have one transformation effect but we will just a list and have the last one overwrite use .
        if (effect === null || effect === undefined) {continue;}

        if (!("condition" in effect)){ //if there is no condition given, then ignore the effect
          continue;
        }


        newTransform = checkCondition(tempList, effect.condition, i, i, this.state);
        transformSkills = effect.transformSkills;

      } //end loop through transformation effects

      if (previousTransform !== newTransform){ //apply a transformation

        var currentHero = heroData[i.heroID.value]; //get the heroData from heroInfo.json
        var heroDropdowns = getDropdowns(currentHero, false, ""); //should only be using "o" skills here so weapon name does not matter

        if (newTransform){ //transforming, add effects

          for (let x of transformSkills) {
            let additionalSkill  = heroDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;
            i = getSkillEffect(additionalSkill, x[0], i, heroDropdowns); //add the extra skills as well

          }




        } else{ //detransform, remove effects


          for (let x of transformSkills) {

            let additionalSkill  = heroDropdowns[x[0]].list.find(findSkillWithName, x[1]).value;
            i = this.removeSkillEffect(additionalSkill , x[0], i);
            //i = getSkillEffect(additionalSkill, x[0], i, heroDropdowns); //add the extra skills as well

          }


        }

        //recalculate stats for unit
        let oldMaxHP = i.stats.hp;
        i.stats =  calculateStats(i, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);
        i.currentHP = this.adjustHP(oldMaxHP, i);
        i.transformed = newTransform;
        tempList[i.side][i.listIndex] = i;


      } //end if transformation state changes, else nothing occurs

    } //end i


    tempList = this.recalculateAllVisibleStats(tempList); //recalc visiblestats after transformation for turnstart effects
    let heroList = JSON.parse(JSON.stringify(this.state.heroList)); //deep copy of heroList for reference (so that calculations are done at the same time)

    //loop through structures
    for (let i of this.state.structureList[side]){

      for (let effect of i.effect[i.level - 1]){
        if (effect === null || effect === undefined) {continue;}

        if ( "condition" in effect && !checkCondition(heroList, effect.condition, i, i, this.state) ){ //check if condition has not been met skip
          continue;
        }
        
        calculateBuffEffect(tempList, heroList,  i, effect, this.state, allyTeamPost, allyTeamSpecial, enemyTeamPost, enemyTeamSpecial);
      }

    }

    for (let i of heroList[side]){ //this.state.heroList[side]){ //loop through each hero for turn start effects


      if (i.position < 0 || i.currentHP <= 0){ continue;} //skip if hero is dead or not on the board

      //Turn Start skills

      for (let effect of i.turnStart){ //loop through each turnstart abilities
        if (effect === null || effect === undefined) {continue;}

        if ( "condition" in effect && !checkCondition(heroList, effect.condition, i, i, this.state) ){ //check if condition has not been met skip
          continue;
        }

        calculateBuffEffect(tempList, heroList,  i, effect, this.state, allyTeamPost, allyTeamSpecial, enemyTeamPost, enemyTeamSpecial);




      } //end effects


    } //end i

    let structList = this.state.structureList;    
    let removeStructurePos = [];

    //update heroes with new calculated values
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

    for (let x of structList[side]){
      if (structList[x.side][x.listIndex].currentHP - allyTeamPost[7 + x.listIndex] <= 0){
        removeStructurePos.push(x.position);
      } 
    }

    for (let x of structList[enemySide]){
      if (structList[x.side][x.listIndex].currentHP - enemyTeamPost[7 + x.listIndex] <= 0){
        removeStructurePos.push(x.position);
      } 
    }

    for (let x of removeStructurePos){
      this.removeStructure(x);
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

    console.log(this.state.heroList[this.state.playerSide][this.state.heroIndex]);
    console.log(this.state.structureList);
    let mapBackDrop = mapData[this.state.map].backDrop;
    let backDropStyle = " ";
    if (mapBackDrop !== "blank"){
      backDropStyle = require('./UI/Maps/' + mapBackDrop + ".jpg");
    }

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
        <td rowSpan = "2" background = {backDropStyle}>
          <table className= "boardStyle" id="board" align = 'center'
            background = {require('./UI/Maps/' + this.state.map + '.png') }>
          <tbody>
            <Map
                gameState = {this.state}
                G = {this.props.G}
                filledPositions = {this.getFilledPositions}
                selectNewPosition = {this.selectNewPosition}
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
            endChange = {this.onEndChange}
            freeMoveChange = {this.onFreeMoveChange} />

        </td>

        <td>
          <Field  
            gameState = {this.state}
            fortChange = {this.onFortLevelChange}
            turnChange = {this.onTurnChange}
            seasonChange = {this.onSeasonChange} 
            mapChange = {this.mapChange}
            startTurn = {this.startTurn}
            endTurn = {this.endTurn} />

          <Terrain  
            gameState = {this.state}

            terrainChange = {this.terrainChange}
            terrainDefensiveChange = {this.terrainDefensiveChange} />

          <Structure  
            gameState = {this.state}

            structureChange = {this.structureChange}
            addStructure = {this.addStructure} />
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
    this["iv"] = {asset: "neutral", flaw: "neutral", ascended: "neutral"};
    this["heroSkills"] = {"weapon": {value: "0", label: ""}, "refine": {value: "0", label: ""}, "assist": {value: "0", label: ""}, "special": {value: "0", label: ""}, 
                          "a": {value: "0", label: ""}, "b": {value: "0", label: ""}, "c": {value: "0", label: ""}, "seal": {value: "0", label: ""} //hero skills equipped
                        };

    this["side"] = (Math.floor(idNumber / 7) + 1).toString();
    // these are reset at the start of the hero's turn
    this["buff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0}; //visible buffs
    this["statusBuff"] =  JSON.parse(JSON.stringify(statusBuffs));//{"bonusDouble": 0, "airOrders": 0, "mobility+": 0, "dragonEffective": 0};

    //these are reset when the hero's action is taken (action is also considered taken if action was available but their turn ended)
    this["debuff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["statusEffect"] =  JSON.parse(JSON.stringify(statusDebuffs));//{"guard": 0, "panic": 0}; //

    this["transformed"] = false;
    this["resplendent"] = false;


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
    this["anchorPosition"] = -1;
    this["remainder"] = 0;
    this["canto"] = false; //checks if canto has been used this turn
    this["cantoActive"] = false; //indicates if canto is movement is being done
    this["cantoMovement"] = 0;

    this["assistAction"] = false; //denotes if extra action from assist has occured
    this["extraAction"] = false; //denotes if an extra action has been granted by skill this turn, this turns on before galeforce - Currently, only edelgard's b skill allows for this so no conflicts, but more can cause issues
    this["galeforce"] = false; //if an extra action has been granted by a special this turn 


    this["currentHP"] = 0;
    this["passive"] = {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0}; //set of stats from skills
    this["assist"] = {};
    this["special"] = {"cd": -10, "charge": -10}; //cd is the max cd and charge is the current special charge
    this["range"] = -1;
    this["bonus"] = false;
    this["end"] = false;
    this["effects"] = {"cdTrigger": 0};

    this["combatEffects"] = {"counter": 0, "double": 0, "enemyDouble": 0, "stopDouble": 0, "attackCharge": 1, "defenseCharge": 1, "guard": 0, "trueDamage": 0, "firstTrueDamage": 0, "adaptive": 0, "nullAdaptive": 0, "sweep": 0, "selfSweep": 0,
      "preBattleTrueDamage": 0,
      "phantomStats": {"hp": 0, "atk": 0, "spd": 0, "def": 0, "res": 0}, //extra stats used for stat comparisons
    //enemyDouble stops enemy from double, stopDouble stops your own double
      "brashAssault": 0, "desperation": 0, "vantage": 0, "hardyBearing": 0, "grantDesperation": 0,
      "nullC": 0, "nullEnemyFollowUp": 0, "nullStopFollowUp": 0, "nullGuard": 0, "nullCharge": 0,
      "brave": 0,
      "galeforce": 0,
      "wrathful": 0, "nullWrathful": 0,
      "reflect": 0, "mirror": 0, //reflect is the amount of damage to reflect. Mirror is an effect that indicates 
      "absorb": 0,
      "recoil": 0, "postHeal": 0, "burn": 0,
      "onHitHeal": 0,
      "specialTrueDamage": 0, "specialFlatReduction": 0, "specialHeal": 0.0,
      "spiral": 0,
      "statBuff": {"atk": 0, "spd": 0, "def": 0, "res": 0},
      "lull": {"atk": 0, "spd": 0, "def": 0, "res": 0},
      //"damageReduction": 1.0, "consecutiveReduction": 1.0, "firstReduction": 1.0, "preBattleReduction": 1.0, "followUpReduction": 1.0, "reduceReduction": 1.0,
      "damageReduction": [], "consecutiveReduction": [], "firstReduction": [], "preBattleReduction": [], "followUpReduction": [], "reduceReduction": [],
      "penaltyNeutralize": {"atk": 0, "spd": 0, "def": 0, "res": 0}, "buffNeutralize": {"atk": 0, "spd": 0, "def": 0, "res": 0}, 
      "penaltyReverse": {"atk": 0, "spd": 0, "def": 0, "res": 0}, //takes penalties and provides a buff that is double the penalty's value 
      "penaltyDouble": {"atk": 0, "spd": 0, "def": 0, "res": 0}, //adds a debuff equal to the current penalty value
      "buffReverse": {"atk": 0, "spd": 0, "def": 0, "res": 0}, //takes buffs and applies a debuff that is double that buff's value
      "defenseTarget": {"def": 0, "res": 0}, //if stat is active, then the defensive stat checked against will be the activated stat (can't test, but adaptive damage should/will override this) - can also target speed/attack if that is ever implemented
      "bonusCopy": {"atk": 0, "spd": 0, "def": 0, "res": 0}, //grants buffs equal to the buffs on the enemy 
      "bonusNull": {"atk": 0, "spd": 0, "def": 0, "res": 0}, //applies a debuff that is equal to the enemy's bonus
      "bonusDouble": {"atk": 0, "spd": 0, "def": 0, "res": 0}, //doubles any bonuses on unit
      "penaltyCopy": {"atk": 0, "spd": 0, "def": 0, "res": 0}, //takes a penalty on an enemy, and gives a buff based on that
      "buffReflect": {"atk": 0, "spd": 0, "def": 0, "res": 0}, //takes bonus values on unit and applies those values as a debuff on the enemy - misunderstood an effect and implemented this 
      "teamNihil": 0,
      "minimumDamage": 0, "nullHeal": 0, "nullPost": 0, //nullHeal and nullPost prevent healing and post combat damage on themselves
      "nullEnemyHeal": 0, 
      "damageNull": 0,
      "raven": 0,
      "triangleAdept": [0], "cancelAffinity": [0],
      "miracle": 0,
      "canto": [{"flatCanto": 0, "cantoRemainder": 0}],
      "allySwap": null
      //"flatCanto": 0, "cantoRemainder": 0 //flat canto is a flat canto amount that will always be used, cantoRemainder is true/false effect that checks if remainder value will be added to flat canto
       }; //effects the change during battle
    this["variableStats"] = [];
    this["variableCombat"] = [];
    this["variablePreCombat"] = [];
    this["conditionalEffects"] = []; //conditional effects which occur at the start of combat
    this["preCombatConditionalEffects"] = [];
    this["conditionalBonusPenaltyNeutralizers"] = []; //conditionals that depend on bonus/penalties and neutralize them at the same time



    this["conditionalPreCombatStats"] = []; //specific conditional that provides stats using (mostly) finalized stats, the difference is that these will be applied for the initiator first, stats will be recalculated againm then the defender will do these conditionals
    //Basically, a check on final combat stats that will also modify those combat stats but gives initator priority ()


    this["conditionalCombatStats"] = [];
    this["conditionalCombat"] = []; //conditional effects which occur during combat and will need to use combat stats
    this["conditionalFollowUp"] = []; //conditional effects that check for followups
    this["conditionalSpecial"] = [];
    this["initiating"] = false;

    this["swapAllyPosition"] = -1; //if an ally swap occurs, the position of the ally will be saved here so the cells can be updated too

    this["saving"] = false;
    this["saved"] = false;
    this["saveID"] = -1;
    this["conditionalSavior"] = [];
    
    this["transformationEffect"] = [];

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
    this["onSpecialEffect"] = []; //effects that are gained if special was activated

    this["perMapList"] = []; //contains a list of per map conditions that have activated;
    this["actionConditionList"] = []; //contains a list of per map conditions that are true for the current action. This gets added to the perMapList at the end of action.
    //We can potentially have a perTurnList. The actionConditionList would get added to the perTurnList at the end of action and the only difference is that at the start of the turn the perTurnList is reset.

    this["effectiveCondition"] = [];
    this["addedEffective"] = [];
    this["negateEffective"] = [];
    this["type"] = "hero";
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


        //only remove effect if an appropriate index value is found
        if (copyIndex >= 0){

          hero[elementEffect.type].splice(copyIndex, 1);
        }

      }

    }

  } else if (typeof effect === 'object' && effect !== null){ //for combat effects which is directly added

    removeCombatEffect(hero, effect);


  }

}


export function applyCombatEffect(hero, effect){ //aply combat effect (an object)

  for (let key in effect){

    if (key ===  "condition" || key === "type" || key === "allyCondition" || key === "enemyCondition" || key === "variableCheck"){
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



      if (key === "allySwap"){
        hero.combatEffects[key] = effect[key]; //doubt additional allyswap effects will be added but if they did, it would prioritize one or cancel them all

      } else if (key === "canto"){ //canto adds its objects to its list (so we can have multiple canto effects and take highest one)
        hero.combatEffects[key].push(effect[key]);
      } else { //adding values by subkey

        for (let subkey in effect[key]){
          hero.combatEffects[key][subkey]+= effect[key][subkey];

        }
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


      if (key === "canto"){
        let index = hero.combatEffects[key].indexOf(effect[key]);
        hero.combatEffects[key].splice(index, 1);

      } else {
        for (let subkey in effect[key]){
          hero.combatEffects[key][subkey]-= effect[key][subkey];

        }

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



export function checkConditionHero(owner, condition, heroList, gameState){
  return function(other){

      return checkCondition(heroList, condition, owner, other, gameState);
  }
}

function setHero(hero, blessingBuffs, cells){    //Initial setup of hero

  //let tempBlessings = this.state.blessingBuffs; //copy the blessing buffs




  var newHero = heroData[hero.heroID.value]; //get the heroData from heroInfo.json

  var updatedDropdowns = getDropdowns(newHero, false, newHero.weapon); //get default skills of the hero



  let tSkills = {};

  //this adds the default skills of the hero
  tSkills["weapon"] = updatedDropdowns["weapon"].list.find(findSkillWithName, newHero.weapon);
  tSkills["refine"] = updatedDropdowns["refine"].list.find(findSkillWithName, ""); //No refine by default
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

    if (key !== "refine" || tSkills.refine.value !== "0" ){ //for refines, check if the refine is not the empty one before adding it - if refine is not the empty refine, it shouuld also remove the weapon before
     hero = getSkillEffect(tSkills[key].value , key, hero, updatedDropdowns);
    }

  });

  if (hero.allySupportLevel !== "None"){
    var supportSkill  = updatedDropdowns["o"].list.find(findSkillWithName, "Ally Support " + hero.allySupportLevel + " 1").value;
    hero = getSkillEffect(supportSkill, "o", hero, updatedDropdowns); //add the extra skills as well

    supportSkill  = updatedDropdowns["o"].list.find(findSkillWithName, "Ally Support " + hero.allySupportLevel + " 2").value;
    hero = getSkillEffect(supportSkill, "o", hero, updatedDropdowns); //add the extra skills as well
  }


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
    hero.anchorPosition = position;
    cells[position] = hero;

  }

  //Initializing remainder to the movement of the hero
  hero.remainder = getMovement(newHero.movetype);

    
  //   if (e.value === "0"){ //if blank hero, take it off the board
  //     newCells[hero.position] = null;
  //     hero.position = -1;
  //   } else {

  //     newCells[hero.position] = hero;
  //   }

  // }


}


//This is different from updateDropdowns which sets the skillDropdowns state.
//This function is used to get a temporary set of dropdowns that is used for removing skills from a unit
function getDropdowns(newHero, newMax, weaponName){
  let dropTemp = { "hero":{list: [], info: heroData}, "weapon":{list: [], info: weapons[newHero.weapontype]}, "refine":{list: [{value: "0", label: ""}], info: refines[newHero.weapontype]},
                       "assist":{list: [], info: assists}, "special":{list: [], info: specials},
                       "a":{list: [], info: skills.a}, "b":{list: [], info: skills.b}, 
                       "c":{list: [], info: skills.c}, "seal":{list: [], info: skills.seal},
                       "o":{list: [], info: skills.o}
                 };



  // eslint-disable-next-line               
  for (let [key, value] of Object.entries(dropTemp)) {
    fillDropdown(key, value.list, value.info, newHero, newMax, weaponName, dropTemp);
  }
  

  return dropTemp;
}

function fillDropdown(category, dropdownList, info, newHero, newMax, weaponName, dropDowns){

  let weaponList;
  let refineWeapon;

  if (category === "refine"){

    weaponList = dropDowns.weapon.list; //weapon dropdown should be set first
    refineWeapon = weaponList.find(findSkillWithName, weaponName); //get the list value of the weapon
    refineWeapon = dropDowns.weapon.info[refineWeapon.value]; //get the weapons info using its name

    //if the weapon is unrefinable then skip filling this dropdown (if the weapon has no refinable key, then we assume that it is not refinable)
    if (!("refinable" in refineWeapon) || !refineWeapon.refinable){

      return;
    }

  }

  // eslint-disable-next-line
  for (let [key, value1] of Object.entries(info)) {

    //skip to next entry if the skill is a PRF and hero is not in the skills users list 
    if ('prf' in value1 && value1.prf && 'users' in value1 && !value1.users.includes(newHero.name) ){
      continue;

    } 

    //skip to next entry if we are only adding max skills and max value of the skill is false
    if (newMax && 'max' in value1 && !value1.max ){

      continue;
    }

    if (category === "refine"){


        if (!("refines" in refineWeapon) || !refineWeapon.refines.includes(value1.name) ){
          continue;
        }

      
    } 



    dropdownList.push({value: key, label: value1.name});


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

  if (skillType === "weapon" || skillType === "refine"){

    let pTemp = updatedHero.passive;


    pTemp["atk"] += skillDropdowns[skillType].info[id].might; //add the might of the weapon


    //Add the passive stats from the weapon
    let passiveStats = skillDropdowns[skillType].info[id].passive

    for (let key in passiveStats){
      pTemp[key] += passiveStats[key];

    }


    if ("effect" in skillDropdowns[skillType].info[id]){
      addEffect(updatedHero, effect);
    }

    updatedHero.passive = pTemp;
    updatedHero.range = skillDropdowns[skillType].info[id].range;


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


function calculateBuffEffect(heroList, refList, owner, effect, gameState, allyTeamPost, allyTeamSpecial, enemyTeamPost, enemyTeamSpecial){

  //lets say the enemy can now be owner it will work for positions but would be using the other for everything else
  let postSpecial;
  let postTeam;

  let teamList;
  let side = 0;

  if (effect.team === "owner"){
    side = owner.side;
    //teamList = refList[owner.side];
    postTeam = allyTeamPost;
    postSpecial = allyTeamSpecial;

  } else if (effect.team === "enemy") {
    side = getEnemySide(owner.side);
    //teamList = refList[getEnemySide(owner.side)];
    postTeam = enemyTeamPost;
    postSpecial = enemyTeamSpecial;
  }


  if ("structure" in effect && effect.structure){
    teamList = gameState.structureList[side];
  } else {
    teamList = refList[side];

    let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)
    for (let x in teamList){
      if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves, self buff req is done separately
        teamListValid.push(teamList[x]);
      }
    } 
    teamList = teamListValid;
  }

  if (effect.checkType === "reqCheck"){ //buff eligibility is by some kind of req/condition

    //for status buff, we can then buff those heroes instead


    // let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)
    // for (let x in teamList){
    //   if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves, self buff req is done separately
    //     teamListValid.push(teamList[x]);
    //   }
    // } 

   // for (let m of heroList[side]){ //loop through friendly heroes

    let passedHeroList = [];
    //owner, teamList, heroReq, heroList, turn){
    if ("effectReq" in effect){
      passedHeroList = heroReqCheck(owner, teamList, effect.effectReq, refList, gameState); //Get the list of allies that pass the req check


      applyBuffList(heroList, passedHeroList, effect, owner, postTeam, postSpecial, gameState);

    } //end ally req
    

    
    //if there is a requirement for the buff to apply to themselves
    if ("selfReq" in effect && checkCondition(heroList, effect.selfReq, owner, owner, gameState)) {

      applyBuffList(heroList, [owner], effect, owner, postTeam, postSpecial, gameState);
    } 



  } else if (effect.checkType === "targeting"){ //targets a unit, usually for having the highest or lowest of a stat


    let affectedList = getPeakList(effect.checkStats, owner, teamList, refList, effect.peak, effect.targetReq, gameState);


    
    applyBuffList(heroList, affectedList, effect, owner, postTeam, postSpecial, gameState);

  } else if (effect.checkType === "targetingReqCheck"){ //targets a unit then uses it as a refeerence - only ussed by chilling seal II currently
    //{"type": "turnStart", "subtype": "debuff", "checkType": "targetingReqCheck", "list": ["stats"], "value": 7, "stats": ["atk","res"], "checkStats": ["def"], "team": "enemy", "peak": "min" ,  "effectReq": [["distanceCheck", 2]] }],
    let affectedList = getPeakList(effect.checkStats, owner, teamList, refList, effect.peak, effect.targetReq, gameState);

    //found targeted units

    //We now have a list of units to use as a reference and will run the effectreq through each one


    for (let refHero of affectedList){

      let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)
      for (let x in teamList){
        if (heroValid(teamList[x]) && teamList[x].id !== refHero.id ){ //exclude themselves, self buff req is done separately
          teamListValid.push(teamList[x]);
        }
      } 


      let passedHeroList = [];
      //owner, teamList, heroReq, heroList, turn){
      if ("effectReq" in effect){


        passedHeroList = heroReqCheck(refHero, teamListValid, effect.effectReq, refList, gameState); //Get the list of allies that pass the req check


        applyBuffList(heroList, passedHeroList, effect, refHero, postTeam, postSpecial, gameState);


      } //end ally req
      

      
      //if there is a requirement for the buff to apply to themselves
      if ("selfReq" in effect && checkCondition(heroList, effect.selfReq, refHero, refHero, gameState)) {

        applyBuffList(heroList, [refHero], effect, refHero, postTeam, postSpecial, gameState);
      } 

    }//end loop through each refhero

  }


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

function getMovement(moveType){

  if (moveType === "Cavalry")
    return 3;
  else if (moveType === "Infantry" || moveType === "Flying")
    return 2;
  else if (moveType === "Armored")
    return 1;
  else
    return 0;
}


function getHeroMovement(hero){ //give a hero get the movement value
    let heroInfo = heroData[hero.heroID.value];
    let move = getMovement(heroInfo.movetype); //the default movement given move type

    //increase movement by one if they have mobility buff
    if (hero.statusBuff["mobility+"] > 0){
      move++; 
    }

    //set movement to 1 if they are affected by gravity
    if (hero.statusEffect["gravity"] > 0){ 
      move = 1;
    }

    return move;
}



function getActionLists(hero, heroList, newCells, gameState){

  // let oldHero = heroData[dragData.heroID.value];
  //hero should be a temporary copy of the hero being moved 

  //list hero is the most updated version of the dragData so we use that version for most of this function. It only doesn't have combat effects which hero should have

  let move = getHeroMovement(hero);
  


  if (hero.cantoActive){ //if canto is active, movement is limited to the canto movement calculated when canto activated.
    move = hero.cantoMovement;

  }





  let pos = hero.position; //get the most recent position from the heroList

  //these lists contain positions that have those actions available
  let movementList = [pos]; //the initial position can always be moved to
  
  let warpList = []; //contains positions that can be warped to

  //let obstructList = []; //This is more of a negative list, which will prevent spaces from being added to the movement list


  if (hero.statusBuff.airOrders > 0){
    hero.warp.push({"type": "warp", "subtype": "warpReq", "allyReq": [["distanceCheck", 2]], "range": 1 });

  }

  //warp info finds the spaces for warping, obstructors and pathfinders. It also checks if the unit has the pass effect active.
  let warpInfo = getWarpEffects(hero, heroList, gameState);

  let warpTargets = warpInfo.warpList;
  let warpTargetRanges = warpInfo.warpRangeList;

  let obstructTargets = warpInfo.obstructList;
  let obstructTargetRanges = warpInfo.obstructRangeList;
  
  let obstructWarpTargets = warpInfo.obstructWarpList;
  let obstructWarpTargetRanges = warpInfo.obstructWarpRangeList;

  let pathfinderList = warpInfo.pathfinderList;
  let pass = warpInfo.pass;
  //let terrainPass = warpInfo.terrainPass;


  let spaceRemainders = {}; //object list to hold the costs of each movement space (to calculate remainders)

  spaceRemainders[pos] = move; //position of hero's remainder is the movement stat


  //Obstruct space calculation space calculation
  let obstructSpaces = [];
  for (let i = 0; i < obstructTargets.length; i++){
    let checkSpaces = getSpacesInRange(obstructTargets[i], obstructTargetRanges[i]);

    for (let x of checkSpaces){
      if (!obstructSpaces.includes(x)){
        obstructSpaces.push(x);
      }  
    }
    
  }



  //obstructList = getAdjacentSpaces(obstructTargets);

  //Movement Calculation

  let movementCheck = getAdjacentSpaces([hero.position]); //spaces to check for adjacency
  let movementCheckDone = []; //spaces that have already been checked for adjacency

  let currentMovement = 0;
  while (currentMovement < move){


    let nextMovementCheck = [];
    for (let currentPos of movementCheck) { //loop through positions to check

      //current movement tracks the amount of movement has been used


      //if this position has already been checked, move to next position
      if (movementCheckDone.includes(currentPos)){ continue;}


      //if pass is active and enemy is in the pos
      //if (  (newCells[pos] === null && (pass > 0 || !obstructList.includes(pos))) || newCells[pos].side === dragData.side || (pass > 0 && newCells[pos].side !== dragData.side) ){



      //Check for if the space can be moved to/through
      //Check if empty OR ally (can move through) OR  is enemy and pass is active 
      if (  (newCells[currentPos] === null) || newCells[currentPos].side === hero.side || (pass > 0 && newCells[currentPos].side !== hero.side) ){



        if (newCells[currentPos] === null && (pass < 1 && obstructSpaces.includes(currentPos)) ){ //obstructed, do not add 
          movementCheckDone.push(currentPos);
          continue;
        } 

        nextMovementCheck.push(currentPos); //position can be moved to/through, add it for the next check

        //if unit has pathfinder, then adds its space to the movement check
        if (pathfinderList.includes(currentPos)){
          let extraSpaces = getAdjacentSpaces([currentPos]);

          for (let extra of extraSpaces){
            movementCheck.push(extra);
          }

        }

        if (newCells[currentPos] === null){ //add to movementList if no hero is occupying it
          
          movementList.push(currentPos);
          spaceRemainders[currentPos] = move - (currentMovement + 1);
        }
        
        

      }
      
      movementCheckDone.push(currentPos); //space has been checked and add it to list
      

    } //end for

    movementCheck = getAdjacentSpaces(nextMovementCheck);



    currentMovement++;
  }

  let obstructWarpSpaces = [];
  for (let i = 0; i < obstructWarpTargets.length; i++){
    let checkSpaces = getSpacesInRange(obstructWarpTargets[i], obstructWarpTargetRanges[i]);

    for (let x of checkSpaces){
      if (!obstructWarpSpaces.includes(x)){
        obstructWarpSpaces.push(x);
      }  
    }
    
  }


  //Warp space calculation - this checks for all possible warps including spaces that can be moved to 
  let warpSpaces = [];
  for (let i = 0; i < warpTargets.length; i++){
    let checkSpaces = getSpacesInRange(warpTargets[i], warpTargetRanges[i]);

    for (let x of checkSpaces){
      if (!warpSpaces.includes(x) && (pass >= 1 || !obstructWarpSpaces.includes(x)) ){ //add warp space if not already in warp space and not warp obstructed (or pass is active)
        warpSpaces.push(x);
      }  
    }
    
  }




  //let warpSpaces = //getAdjacentSpaces(warpTargets); //set the warpspaces as the spaces adjacent to the warp targets

  //adds the warp spaces that are empty to the warp list 
  for (let x of warpSpaces){

    if (newCells[x] === null && !movementList.includes(x) ){//space is empty and is not already a movement position

      //if canto is not active, add the warp, if it is active, then only add the warp if it is within movement range (which would be modified by canto)
      if (!hero.cantoActive || getDistance(x, pos) <= move){

        warpList.push(x);
        spaceRemainders[x] = 0; //set the remainder to 0
      }

    }

  }



  return {"movementList": movementList, "warpList": warpList, "spaceRemainders": spaceRemainders };


}

function getAttackList(hero, newCells){

  let attackList = [];

  //Attack space calculation
  if (hero.range > 0){


    let attackSpaces = getSpacesInExactRange(hero.position, hero.range);

    for (let s of attackSpaces){
      if (newCells[s] !== null && newCells[s].side !== hero.side && heroValid(newCells[s]) ){
        attackList.push(s);
      }
    }

  }

  return attackList;

}


function getWarpEffects(owner, heroList, gameState){

  //provides a couple of things
  //pass (just a 1 or 0 for pass effect)
  //warp list - target that can be warped to
  //obstruct list

  let warpList = [];
  let warpRangeList = [];


  //Obstruct regular movement
  let obstructList = [];
  let obstructRangeList = [];
  
  //Obstruct warp movement
  let obstructWarpList = [];
  let obstructWarpRangeList = [];

  let pathfinderList = [];
  let pass = 0;
  let terrainPass = 0;

  for (let team in heroList){ //loop through each team
    for (let hero of heroList[team]){ //loop through each hero on team

      if (hero.position < 0 || hero.currentHP <= 0){ continue;} //skip if hero is dead or not on the board


      let warpEffects = hero.warp;
      if (hero.id === owner.id){
        warpEffects = owner.warp;
      }


      for (let effect of warpEffects){ //loop through loop effects
        if (effect === null || effect === undefined) {continue;}
      

        if ("condition" in effect && !checkCondition(heroList, effect.condition, hero, hero, gameState) ){ //check if condition has not been met to skip
            continue;
        }

        if (effect.subtype === "warpReq"){ //
          //warp reqs - check team for allies that pass req to warp to -- only applies to self
          if (hero.id === owner.id){

            let tempWarp = getWarpTargets(effect, heroList, owner, warpList, warpRangeList);  
            warpList = tempWarp.warpList;
            warpRangeList = tempWarp.rangeList;
          }

        } else if (effect.subtype === "warpTarget"){ //warp effects that are granted by others to allow unit to do something like warp to them (e.g. guidance)

          if ("effectReq" in effect && checkCondition(heroList, effect.effectReq, hero, owner, gameState)){


            if (effect.effect === "obstruct"){


              if (!obstructList.includes(hero.position) && hero.side !== owner.side){
                obstructList.push(hero.position);
                obstructRangeList.push(effect.range);
              }  

            } else if (effect.effect === "warp"){

            
              if (!warpList.includes(hero.position)){
                warpList.push(hero.position);
                warpRangeList.push(effect.range);
              }  

            } else if (effect.effect === "obstructWarp"){

              if (!obstructWarpList.includes(hero.position) && hero.side !== owner.side){
                obstructWarpList.push(hero.position);
                obstructWarpRangeList.push(effect.range);
              }  


            } else if (effect.effect === "pathfinder"){
              if (!pathfinderList.includes(hero.position) && hero.side === owner.side){
                pathfinderList.push(hero.position);
              }  
            }
          } //end check condition

        } else if (effect.subtype === "pass"){
          pass++;
        } else if (effect.subtype === "terrainPass"){
          terrainPass++;
        }
      } //end warp loop
      //"effect": [{"type": "warp", "subtype": "warpReq", "condition": [["hp", "greater", 0.5]], "allyReq": [["heroInfoCheck", "movetype", ["Flying"]], ["distanceCheck", 2] ] }], 
      //"effect": [{"type": "warp", "condition": [["hp", "greater", 0.25]], "subtype": "pass"}],
      //"effect": [{"type": "warp", "condition": [["hp", "greater", 0.5]], "subtype": "warpTarget", "effectReq": [["always"]], "effect" : "obstruct"}],


    }
  } //end heroList loop

  return {"warpList": warpList, "warpRangeList": warpRangeList, "obstructList": obstructList, "obstructRangeList": obstructRangeList, "obstructWarpList": obstructWarpList, "obstructWarpRangeList": obstructWarpRangeList,  "pathfinderList": pathfinderList, "pass": pass, "terrainPass": terrainPass};

}

  //"effect": {"condition": [["hp", "greater", 1]], "range": 2, "allyReq": {"type": "allyInfo", "key": "movetype", "req": ["Infantry", "Cavalry", "Armored"] } },
function getWarpTargets(effect, heroList, owner, warpList, rangeList){
  

  let allyListValid = []; //copy of list that only has valid heroes (not dead and on the board)
  let allyList = heroList[owner.side];
  for (let x in allyList){
    if (allyList[x].position >= 0 && allyList[x].currentHP > 0 && allyList[x].id !== owner.id){
      allyListValid.push(allyList[x]);
    }
  } 


      let allyReq = effect.allyReq;

      let passedAllyList = heroReqCheck(owner, allyListValid, allyReq); //Get the list of allies that pass the req check


      for (let y of passedAllyList){

        if (!warpList.includes(y.position)){
          warpList.push(y.position);
          rangeList.push(effect.range);
        }

      }


    return {"warpList": warpList, "rangeList": rangeList};
}


  

//Given a list of positions, get all the spaces adjacent to it
function getAdjacentSpaces(positions){

  let spaces = [];

  for (let x of positions){

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
function getSpacesInExactRange(origin, range){

  let checkSpaces = [origin];
  let checkedSpaces = [origin];
  let counter = 0;

  while (counter < range){

    let adjacent = getAdjacentSpaces(checkSpaces);
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

//Given a position, get spaces that are within that range
function getSpacesInRange(origin, range){

  let checkSpaces = [origin]; //spaces to check around
  let checkedSpaces = []; //spaces that haven been checked
  let counter = 0;

  while (counter < range){

    let adjacent = getAdjacentSpaces(checkSpaces);
    checkSpaces = []; //reset

    for (let x of adjacent){ //loop through adjacent spaces add them to checkSpaces if not already checked

      if (!checkedSpaces.includes(x) && x!==origin){
        checkSpaces.push(x);
        checkedSpaces.push(x);
      }

    } //end for

    counter++;
  }


  return checkedSpaces;


}



//gets the peak (min or max depending on parameters given)
export function getPeakList(checkStats, owner, teamList, refList, peakType, targetReq, gameState){
    //let checkStats = effect.checkStats;

    let affectedList = [];

    let peak;

    if (peakType === "max"){
      peak = 0;
    } else if (peakType === "min"){
      peak = 999;
    }



    for (let hero of teamList){

      if (typeof targetReq !== 'undefined' && !checkCondition(refList, targetReq, owner, hero, gameState) ){ //if there is a requirement to be targeted, the reflist is used instead
        continue; //if there is a target req and they don't meeet that requirement skip them
      }

      if (owner.id === hero.id || !heroValid(hero) ){
        continue; //cannot target themselves
      }

      let sum = 0;

      for (let stat of checkStats){

        if (stat === "hp"){
          sum+= hero.currentHP;

        } else if (stat === "damage"){ //the amount of damage on the ally1
          sum+= hero.stats.hp - hero.currentHP;

        } else if (stat === "distance"){
          sum+= getDistance(hero.position, owner.position);

        } else {
          sum+= hero.visibleStats[stat];  
        }

        
      }

      if (sum === peak){ //same as peak, add to list
        affectedList.push(hero);
      } else if ((sum > peak && peakType === "max") || (sum < peak && peakType === "min")){

        if (heroValid(hero)){
          affectedList = []; //reset list
          affectedList.push(hero);
          peak = sum; //set new peak
        }

      } 


    } //loop through team
    
 

    return affectedList;

}


//given a hero, loop through their transformation effect and retrieve a list of transformSkills
//transformationEffect is a list but a unit should only have one transformation effect. If there are multiple, the last one will overwrite the others

function getTransformationSkills(hero){

  let transformSkills = [];

  for (let effect of hero.transformationEffect){ //loop through each transformation effects to get transformation skills
    if (effect === null || effect === undefined) {continue;}

    if (!("condition" in effect) ){ //if there is no condition given, then ignore the effect, here we don't check if condition is met for transformation but we still require a condition for consistency 
      continue;
    }

    transformSkills = effect.transformSkills;

  } //end loop through transformation effects


  return transformSkills;

}


//position is the initial position the AOE comes from
//pattern list is the list of row column differentials from the initial position 
function getAOEPositions(position, patternList){

  //positionToRowColumn
//rowColumnToPosition
  let aoePositions = new Array(patternList.length).fill(-1); //fill the positions with invalid positions first
  let initialRC = positionToRowColumn(position); //convert to RC

  for (let i = 0; i < patternList.length; i++) {
    let positionHit = -1;

    let areaHit = patternList[i];
    let rcMod = [initialRC[0] + areaHit[0], initialRC[1] + areaHit[1]];

    if (rcMod[1] > 5 || rcMod[1] < 0 || rcMod[0] > 7 || rcMod[0] < 0){
      positionHit = -1;
    } else {
      positionHit = rowColumnToPosition(rcMod);      
    }


    aoePositions[i] = positionHit;

  }

  return aoePositions;

}


function calculatePreBattleDamage(attacker, defender, list, gameState){

  let damageType = getDamageType(heroData[attacker.heroID.value].weapontype, attacker, defender);

  ///// special trigger effects
  //check 
  //let oldSpecialTrigger =  Object.assign({}, attacker.combatEffects.specialTrigger); //get copy of the special trigger effects

  getConditionalEffects(attacker, defender, "preCombatConditionalEffects", list, gameState);
  getConditionalEffects(defender, attacker, "preCombatConditionalEffects", list, gameState);
    
  getVariablePreCombat(attacker, defender, list, gameState);
  getVariablePreCombat(defender, attacker, list, gameState);

  let onSpecialDamage = 0;
  let trueDamage = 0;

  for (let i of attacker.onSpecial){ //loop through each on move assist effect on the assister
    if (i !== null){

      for (let j in i){
        if (j === "damage"){
          //damage": ["defender", "def", "variable", "trueDamage", {"key": "specialCD", "factor": 0.1, "constant": 0.20, "max": 10}]}

          let extraDamage = getSpecialValue(i, attacker, defender, list, damageType, j, "preCombat");

          if (i.damage[3] === "trueDamage"){
            trueDamage+= extraDamage;
          } else if (i.damage[3] === "specialDamage" ){
            onSpecialDamage+= extraDamage
          }


        } //end for damage
      } //end for i



    }

  } //end for onSpecial

  getConditionalSpecial(attacker, defender, list, gameState);

  trueDamage+= attacker.combatEffects.specialTrueDamage; 
  trueDamage+= attacker.combatEffects.preBattleTrueDamage;
  //attacker.combatEffects.specialTrigger = oldSpecialTrigger; //revert to original


  let damageReduction = calculateReductionEffects(defender.combatEffects.preBattleReduction, 1.0); //no reduce reduction for pre battle

  //The calculated damage portion stops at 0 (so you don't get negative damage) 
  let preBattleDamage = Math.max(0, Math.trunc(  (attacker.visibleStats.atk - defender.visibleStats[damageType]) * attacker.special.effect.factor) + onSpecialDamage) + trueDamage;

  preBattleDamage = preBattleDamage - Math.trunc( preBattleDamage - preBattleDamage * damageReduction );


  preBattleDamage = Math.max(preBattleDamage, 0); //pre battle damage does not go below 0 so that battle window can still identify that a prebattle special occured   

  return preBattleDamage;


}



function getConditionalEffects(owner, enemy, type, heroList, gameState){

  for (let effect of owner[type]){

    if (effect !== null && checkCondition(heroList, effect.condition, owner, enemy, gameState)){ //if condition is true, then provide the rest of the effects
        addEffect(owner, effect);


    } //end if condition true

  } //end for 
}

function getVariablePreCombat(owner, enemy, heroList, gameState){



  for (let effect of owner.variablePreCombat){

    if (effect !== null ){ //if there is an effect

      if ("condition" in effect && !checkCondition(heroList, effect.condition, owner, enemy, gameState) ){ //check if condition has not been met to skip
        continue;
      }

      let effectList = calculateVariableCombat(heroList, effect, owner, enemy, gameState);
      //Object.keys(effectList).forEach((key, i) => {

      addEffect(owner, effectList)


    } //end if condition true

  } //end for 
}
function getVariableStats(owner, enemy, heroList, gameState){

  for (let x of owner.variableStats){

    if (x !== null  ){ //if condition is true, then provide the rest of the effects

      if ("condition" in x && !checkCondition(heroList, x.condition, owner, enemy, gameState) ){ //check if condition has not been met to skip
        continue;
      }

      let buffs =  calculateVariableEffect(heroList, x, owner, enemy, gameState);

      addEffect(owner, buffs);

    } //end if condition true

  } //end for 
}


//Calulcate aura stats between two battling heroes
function calculateBattlingAuraStats(heroList, hero1, hero2, gameState){

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


      getBattlingAuraStats(refList, heroList, hero, hero1, hero2, gameState);


    }
  } //end for heroList loop

}

//for a given hero, apply its auras to the other 2 heroes
function getBattlingAuraStats(refList, heroList, hero, hero1, hero2, gameState){

  //hero1/2 are the heroes in the battle
  //hero is the hero which has the auras we are looking for.

  for (let effect of hero.auraStats){ //loop through aura stat effects
    if (effect === null || effect === undefined) {continue;}

    if ("condition" in effect && !checkCondition(refList, effect.condition, hero, hero, gameState) ){ //check if condition has not been met to skip
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
      passedHeroList = heroReqCheck(hero, heroListValid, effect.effectReq, gameState); //Get the list of allies that pass the req check


      for (let affectedHero of passedHeroList){
        applyAuraStats(affectedHero, effect, hero, gameState);

      }

      //this.applyAuraStats(heroList, passedHeroList, effect);

    } //end ally req
    


    //check if the current hero is either battling hero and do selfReq checks
    if ("selfReq" in effect && hero.id === hero1.id && checkCondition(refList, effect.selfReq, hero1, hero1, gameState)){ 
      applyAuraStats(hero1, effect, hero, gameState);

    }

    if ("selfReq" in effect && hero.id === hero2.id && checkCondition(refList, effect.selfReq, hero2, hero2, gameState)){ 
      applyAuraStats(hero2, effect, hero, gameState);

    }      

    



  } //end effect

}

//Calulcate aura stats for every hero
function calculateAuraStats(heroList, gameState){


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
      getAuraStats(refList, heroList, hero, gameState);


    } //end hero
  } //end 





}

function getAuraStats(refList, heroList, hero, gameState){

  for (let effect of hero.auraStats){ //loop through aura stat effects
    if (effect === null || effect === undefined) {continue;}

    if ("condition" in effect && !checkCondition(refList, effect.condition, hero, hero, gameState) ){ //check if condition has not been met to skip
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
      passedHeroList = heroReqCheck(hero, heroListValid, effect.effectReq); //Get the list of allies that pass the req check

      for (let affectedHero of passedHeroList){
        applyAuraStats(heroList[affectedHero.side][affectedHero.listIndex], effect, hero, gameState);

      }

      //this.applyAuraStats(heroList, passedHeroList, effect);

    } //end ally req
    


    //if there is a requirement for the buff to apply to themselves
    if ("selfReq" in effect && checkCondition(refList, effect.selfReq, hero, hero, gameState)){ 
      
      applyAuraStats(hero, effect, hero, gameState);
      
    } 



  } //end effect

}


function applyAuraStats(hero, effect, owner, gameState){

  let value = effect.value;

  if ("varValue" in effect){
    if (effect.varValue === "turn"){
      value+= gameState.currentTurn;
    }

    

  }

  for (let currentStat of effect.stats){

    let varValue = 0;

    
    if ("varValue" in effect && effect.varValue === "bonusValue"){ //bonus value provides stats that is equal to the owner's bonuses (for each stat individually)

      if (owner.statusEffect.panic < 1 || owner.statusBuff.nullPanic > 0){ //check for no panic or null panic on before adding the value
        varValue = owner.buff[currentStat];
      }
    }


    if (effect.subtype === "buff"){
      hero.aura[currentStat]+= value + varValue;
    } else if (effect.subtype === "debuff"){
      hero.aura[currentStat]-= value + varValue;
    }

  } //end looping through affected stats

  

}


  //Blade sessions, atk/spd form etc



//Not neccessarily a conditional but provides a variable combat effect depending on the state of the board.
//E.g. repel, pegasus flight, scendscale.
//These can be conditionally added (in the case of pegagus flight) so need to occur after conditional effect check

function getVariableCombat(owner, enemy, heroList, gameState){

  for (let effect of owner.variableCombat){

    if (effect !== null ){ //if condition is true, then provide the rest of the effects

      if ("condition" in effect && !checkCondition(heroList, effect.condition, owner, enemy, gameState) ){ //check if condition has not been met to skip
        continue;
      }

      let effectList = calculateVariableCombat(heroList, effect, owner, enemy);

      addEffect(owner, effectList);


    } //end if condition true

  } //end for 
}