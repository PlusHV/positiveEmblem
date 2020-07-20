

import React from 'react';
import { CalculateStats, CalculateVisibleStats} from './StatCalculation.js'; // CalculateCombatStats 
import { DoBattle, GetDistance, PositionToRowColumn, GetDamageType, CheckCondition } from './Battle.js';

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




//handles the gameboard as well as the heroes which
class GameBoard extends React.Component{

	

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
      }, //skips id 5 for listIndex  
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
      "availableMovement": [],
      "availableAssist": [],
      "availableAttack": [],
      "draggedHero": null,
      "draggedHeroOrg": null,
      "draggedOver": null,
      "preBattleDamage": -1,
      "draggedOverOriginalHP": 0

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
    this.onSeasonChange = this.onSeasonChange.bind(this);
    this.onHPChange = this.onHPChange.bind(this);
    this.onSpecialChargeChange = this.onSpecialChargeChange.bind(this);


    this.getFilledPositions = this.getFilledPositions.bind(this);


    this.dragBoardMember = this.dragBoardMember.bind(this);
    this.dragOverBoard = this.dragOverBoard.bind(this);
    this.dropBoardMember = this.dropBoardMember.bind(this);
    this.dragEnd = this.dragEnd.bind(this);

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
        ( !('users' in value1) || value1.users.includes(newHero.name ) )  
        ){ //if it has a user key (temp until those are added to skills) or if the users key has the id
          
          if (!newMax || (  !('max' in value1) || value1.max  ) ){
            dropdownList.push({value: key, label: value1.name});
          }
      }
    }
    dropdownList.sort(this.compareLabels);

  }

  compareLabels(a, b){
    return a.label > b.label ? 1 : b.label > a.label ? -1 : 0;
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

    hero.stats = CalculateStats(hero, this.state.fortLevel,
       this.state.blessingBuffs[this.state.playerSide], this.state.season);
    hero.visibleStats = CalculateVisibleStats(hero);

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

    tSkills["weapon"] = updatedDropdowns["weapon"].list.find(this.findSkillWithName, newHero.weapon);
    tSkills["assist"] = updatedDropdowns["assist"].list.find(this.findSkillWithName, newHero.assist);
    tSkills["special"] = updatedDropdowns["special"].list.find(this.findSkillWithName, newHero.special);
    tSkills["a"] = updatedDropdowns["a"].list.find(this.findSkillWithName, newHero.askill);
    tSkills["b"] = updatedDropdowns["b"].list.find(this.findSkillWithName, newHero.bskill);
    tSkills["c"] = updatedDropdowns["c"].list.find(this.findSkillWithName, newHero.cskill);
    tSkills["seal"] = updatedDropdowns["seal"].list.find(this.findSkillWithName, newHero.sseal);

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
    hero.visibleStats = CalculateVisibleStats(hero);
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

  findMatchingCondition(item){
    return JSON.stringify(item) === this;
  }

  findMatchingValue(item){
    return item.value === this;
  }
  findSkillWithName(item){
    return item.label === this;
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
    hero = this.getSkillEffect(e.value, index, hero, this.state.skillDropdowns); //need to clear old effects

    //TODO - add other types of skills 
    let oldMaxHP = hero.stats.hp;

    hero.stats = CalculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);

    hero.visibleStats = CalculateVisibleStats(hero);

    hero.currentHP = this.AdjustHP(oldMaxHP, hero);
    
    tempHeroList[this.state.playerSide][this.state.heroIndex] = hero; //update the heroList with the updated hero
    //update states
    this.setState({heroList: tempHeroList}); 
    this.setState({selectedMember: hero });


  }

  getSkillEffect(id, skillType, currentHero, skillDropdowns){ //skilltype refers to the slot the skill originates from

    //TODO: Except for weapons and assists (maybe specials), the type of the skill should always key into the same key of the hero and then add their effect


    let updatedHero = currentHero;

    let cdTriggerOrg = updatedHero.effects.cdTrigger;


    let effect = skillDropdowns[skillType].info[id].effect;

    if (skillType === "weapon"){
      let pTemp = updatedHero.passive;
      pTemp["atk"] += skillDropdowns["weapon"].info[id].might; 
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


      Object.keys(statMods).forEach((key, i) => {
        pTemp[key] += statMods[key];
      });

      updatedHero.passive = pTemp;
    } else if (skillDropdowns[skillType].info[id].type === "conditional"){

      for (let x of effect){ //conditional effect list of conditional effects
        updatedHero.conditionalEffects.push(x); //effect should contain the conditional list
      }
    }


    if ('skills' in skillDropdowns[skillType].info[id]) { // if the skill has additional skills
      for (var x of skillDropdowns[skillType].info[id].skills) {


        var additionalSkill  = skillDropdowns[x[0]].list.find(this.findSkillWithName, x[1]).value;

        updatedHero = this.getSkillEffect(additionalSkill, x[0], updatedHero, skillDropdowns); //add the extra skills as well
      }

    }


    //Check if skill has a cdtrigger effect cdTriggers
    if ('effect' in skillDropdowns[skillType].info[id] && 'cdTrigger' in effect){
      updatedHero.effects.cdTrigger+= effect.cdTrigger;

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

  removeSkillEffect(id, skillType, currentHero){
    let updatedHero = currentHero; //copy of current hero

    let effect = this.state.skillDropdowns[skillType].info[id].effect;
    let cdTriggerOrg = updatedHero.effects.cdTrigger;

    //let emptySkill =   Object.assign({}, this.state.skillDropdowns [skillType].info["0"]);

    if (skillType === "weapon"){
      let pTemp = updatedHero.passive;
      pTemp["atk"] -= this.state.weaponList[id]["might"]; //remove the weapon's attack
      updatedHero.passive = pTemp;
      updatedHero.range = -1;

    } else if (skillType === "assist"){

      updatedHero.assist = {};

    } else if (skillType === "special"){
      updatedHero.special = {};
      updatedHero.special.cd = -10;
      updatedHero.special.charge = -10;

    } else if (this.state.skillDropdowns[skillType].info[id].type  === "passive") {
      let statMods = effect; //effect should contain the list of stats to buff
      let pTemp = updatedHero.passive;


      Object.keys(statMods).forEach((key, i) => {
        pTemp[key] -= statMods[key];
      });


      updatedHero.passive = pTemp;
    } else if (this.state.skillDropdowns[skillType].info[id].type === "conditional"){
      for (let x of effect){
        let condition = JSON.stringify(x); //the conditional in string form

        let conditionIndex = updatedHero.conditionalEffects.findIndex(this.findMatchingCondition , condition);

        updatedHero.conditionalEffects.splice(conditionIndex, 1); //remove the matched condition
      }

    }

    if ('skills' in this.state.skillDropdowns[skillType].info[id]) { // if the skill has additional skills
      for (var x of this.state.skillDropdowns[skillType].info[id].skills) {

        var additionalSkill  = this.state.skillDropdowns[x[0]].list.find(this.findSkillWithName, x[1]).value;

        updatedHero = this.removeSkillEffect(additionalSkill, x[0], updatedHero); //remove the extra skills as well
      }

    }



    //when removing the skill, a new special will be added, so it will adjust there
    if ('effect' in this.state.skillDropdowns[skillType].info[id] && 'cdTrigger' in effect){
      updatedHero.effects.cdTrigger-= effect.cdTrigger;

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
    temp[this.state.playerSide][this.state.heroIndex].visibleStats = CalculateVisibleStats(temp[this.state.playerSide][this.state.heroIndex]);

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });

  }

  onBonusChange(e){
    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex]; 
    

    hero.bonus = e.target.checked;

    let oldMaxHP = hero.stats.hp;

    hero.stats =  CalculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season);
    hero.visibleStats = CalculateVisibleStats(hero);
    
    hero.currentHP = this.AdjustHP(oldMaxHP, hero);

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: hero});


  }

  onEndChange(e){
    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex]; 
    

    hero.end = e.target.checked;

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
    hero.visibleStats = CalculateVisibleStats(hero);
    
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
    hero.visibleStats = CalculateVisibleStats(hero);

    hero.currentHP = this.AdjustHP(oldMaxHP, hero);

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });


  }

  onAllySupportChange(e){
    var temp = this.state.heroList;
    let hero = temp[this.state.playerSide][this.state.heroIndex];

    hero.allySupport = e;

    hero.stats = CalculateStats(hero, this.state.fortLevel, this.state.blessingBuffs[this.state.playerSide], this.state.season); //might not need a stat calc since it is combat buff

    temp[this.state.playerSide][this.state.heroIndex] = hero;

    this.setState({heroList: temp});
    this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] });


  }

  onFortLevelChange(e){

    this.setState({fortLevel: Math.max(-20, Math.min(Number(e.target.value), 20 ) ) }); 

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
    temp[this.state.playerSide][this.state.heroIndex].currentHP = Math.min(Number(e.target.value),  temp[this.state.playerSide][this.state.heroIndex].stats.hp) ;
    this.setState({heroList: temp});
    this.setState({selectedMember: this.state.heroList[this.state.playerSide][this.state.heroIndex] }); //update the selectedHero according to changed level //todo

  }

  onSpecialChargeChange(e){
    let temp = this.state.heroList;
    temp[this.state.playerSide][this.state.heroIndex].special.charge = Math.min(Number(e.target.value), temp[this.state.playerSide][this.state.heroIndex].special.cd);
    this.setState({heroList: temp});
    this.setState({selectedMember: this.state.heroList[this.state.playerSide][this.state.heroIndex] }); 

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

  }




  //the board elements
  dragBoardMember(ev){

    ev.dataTransfer.setData("text", ev.target.id ); //id is the hero struct 

    let dragData = JSON.parse(ev.target.id); //convert the target's text to an hero object
    dragData.initiating = true;

    let oldHero = heroData[dragData.heroID.value];
    let move = this.GetMovement(oldHero.movetype);


    let assist = -1;


    if (dragData.assist.range !== null)
      assist = dragData.assist.range;


    let pos = dragData.position;
    let movementList = [];
    let assistList = [];
    let attackList = [];


    for (let i = 0; i < 48; i++) { //rows
      if (GetDistance(pos, i) <= move && this.props.G.cells[i] == null ){
        movementList.push(i);
      } else if (this.props.G.cells[i] !== null && dragData.position !== i){ //if there is a hero and is not themselves
        if (GetDistance(pos,i) === assist && this.props.G.cells[i].side === dragData.side) //in range of assist and same side
          assistList.push(i);
        else if (GetDistance(pos,i) === dragData.range && this.props.G.cells[i].side !== dragData.side) //in range of attack and opposite sides
          attackList.push(i);
      }
    }


    this.setState({draggedHero: dragData});
    this.setState({draggedHeroOrg: Object.assign({}, dragData) });
    this.setState({availableMovement: movementList});
    this.setState({availableAssist: assistList});
    this.setState({availableAttack: attackList});



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


    let cellContent = this.props.G.cells[dropPosition];


    //check if cell has a hero and if it is on opposite side
    if (cellContent !==null && this.state.draggedHero.side !== cellContent.side){

      //if it is not the same draggedOver as before or if there was none before for battle forecast
      if ( (this.state.draggedOver !== null && this.state.draggedOver.position !== dropPosition) || this.state.draggedOver === null ) {

        let draggedOverHero = JSON.parse(JSON.stringify(this.props.G.cells[dropPosition]) ); // copies hero
        let draggedHero = JSON.parse(JSON.stringify(this.state.draggedHeroOrg)); //get the original dragged hero
        console.log(draggedHero);
        console.log(this.state);

        let preBattleDamage = -1;
        let orgHP = draggedOverHero.currentHP;

        //check if attacker is using an aoe special and if it is charged
        if (draggedHero.special.type === "pre-battle" && draggedHero.special.charge === 0){
          //do aoe

          let damageType = GetDamageType(heroData[draggedHero.heroID.value].weapontype);

          preBattleDamage =  Math.trunc(draggedHero.visibleStats.atk * draggedHero.special.effect.factor) - draggedOverHero.visibleStats[damageType] ;

          draggedOverHero.currentHP = Math.max(1, draggedOverHero.currentHP - preBattleDamage); 

          draggedHero.special.charge = draggedHero.special.cd;
        } 

        //TODO - aoe special

        //Conditionals
        for (let x of draggedHero.conditionalEffects){

          if (x !== null && CheckCondition(this.state.heroList, x.condition, draggedHero, draggedOverHero)){ //if condition is true, then provide the rest of the effects

            for (let y in x){ //loop through 
              if (y === "statBuff"){

                let buffs = x.statBuff;
                Object.keys(buffs).forEach((key, i) => {
                  draggedHero.combatEffects.stats[key]+= buffs[key]; //apply highest buff
                });


              } //stat buffs


            } //end loop through gained effects



          } //end if condition true

        } //end for 


        this.setState({draggedHero: draggedHero});
        this.setState({draggedOverOriginalHP: orgHP});
        this.setState({preBattleDamage: preBattleDamage});

        this.setState({draggedOver: draggedOverHero}); //setting dragedOver will activate the battlewindow to calculate battle forecast


        //TODO add an extra state that is a list of spaces if aoe special would be activated - and a sub list of those spaces of the new hp values of any heroes that would be affected
        //e.g. have a list of numbers indicating spaces affected. for each space, also have a corresponding text which will be "" if no hero is there and their new hp if otherwise
      }


    }

  }

  dragEnd(ev){
    ev.dataTransfer.clearData();
    this.setState({availableMovement: []});
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




    //if spot is already filled initiate assist and later battle
    if (this.props.G.cells[dropPosition] !==null){


      let dropIndex = this.props.G.cells[dropPosition].listIndex;
      let dropSide = this.props.G.cells[dropPosition].side;
      //todo initiate battle if in proper range and it is opposite side as dragged

      //todo use assist skills if in proper range and it is on same side
      let tempOrg = temp;


      //if (this.CheckAdjacent(dragData.position, this.props.G.cells[dropPosition].position )){
        //Check if in range for assist and they are on the same side
      if (GetDistance(dragData.position, this.props.G.cells[dropPosition].position) === dragData.assist.range && dragData.side === this.props.G.cells[dropPosition].side ){


        if (dragData.assist.type === "movement"){
          temp = this.ApplyMovementAssist(temp, dragData, this.props.G.cells[dropPosition], dragData.assist.effect); //should update temp accordingly


          //clear initial positions of assister/assistee
          this.props.G.cells[tempOrg[dragSide][dragIndex].position] = null;
          this.props.G.cells[dropPosition] = null;

          //move the assistee/assister to their new positions 
          this.props.G.cells[temp[dragSide][dragIndex].position] = temp[dragSide][dragIndex];
          this.props.G.cells[temp[dropSide][dropIndex].position] = temp[dropSide][dropIndex];

        } else if (dragData.assist.type === "rally"){
          temp = this.ApplyRallyAssist(temp, dragData, this.props.G.cells[dropPosition], dragData.assist.effect);


        } else if (dragData.assist.type === "health"){
          temp = this.ApplyHealthAssist(temp, dragData, this.props.G.cells[dropPosition], dragData.assist.effect);
          
        } else if (dragData.assist.type === "heal"){
          temp = this.ApplyHealAssist(temp, dragData, this.props.G.cells[dropPosition], dragData.assist.effect);
          
        } else if (dragData.assist.type === "dance"){
          temp = this.ApplyDanceAssist(temp, dragData, this.props.G.cells[dropPosition]);
        }

      //Check if in range for attack and if they are on the same side
      } else if (GetDistance(dragData.position, this.props.G.cells[dropPosition].position) === dragData.range && dragData.side !== this.props.G.cells[dropPosition].side ){

        //temp = DoBattle(temp, dragData, this.props.G.cells[dropPosition]);
        temp = DoBattle(temp, dragData, this.state.draggedOver);

      }




      //An action has occured which is either an assist or battle. Buffs/debuffs usually go off after these actions so visible stats should be recalculated

      temp = this.RecalculateAllVisibleStats(temp);

      this.setState({heroList: temp});
      this.selectNewMember(dragSide, dragIndex);

      //this.setState({selectedMember: temp[this.state.playerSide][this.state.heroIndex] }); 



    } else { //regular movement



      //remove old from board
      this.props.G.cells[temp[dragSide][dragIndex].position] = null;
      

      //update for new position
      this.props.G.cells[dropPosition] = temp[dragSide][dragIndex]; //update in gameboard
      temp[dragSide][dragIndex].position = dropPosition; //update in team list


      this.setState({heroList: temp});
      this.selectNewMember(dragSide, dragIndex);
      //this.updateHero(dropSide, dropData);
      //this.setState({selectedMember: temp[dragSide][dragIndex] });
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

      tempTeam[memberKey].visibleStats = CalculateVisibleStats(tempTeam[memberKey]); //recalculate visible stats

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

          tempTeam[memberKey].visibleStats = CalculateVisibleStats(tempTeam[memberKey]); //recalculate visible stats

        });

        tempList[key] = tempTeam; //update the team list
    });

    
    return tempList; //the heroList with stats recalculated
  }

  RecalculateAllVisibleStats(currentHeroList){

    let tempList = currentHeroList;

    Object.keys(tempList).forEach((key, i) => { //for each team
        let tempTeam = tempList[key]; //copy of team to be modified

        Object.keys(tempTeam).forEach((memberKey, j) => { //for each member

          tempTeam[memberKey].visibleStats = CalculateVisibleStats(tempTeam[memberKey]); //recalculate visible stats

        });
        tempList[key] = tempTeam;
    });

    return tempList;
  }


  ApplyMovementAssist(updatedHeroList, assister, assistee, effect){

    let list = updatedHeroList;
    let assisterPos = PositionToRowColumn(assister.position);
    let assisteePos = PositionToRowColumn(assistee.position);

    let participantIDs = [assister.id, assistee.id];
 
    if (assisterPos[0] === assisteePos[0]){ //same row, move along the row so change column

      let factor = assisteePos[1] - assisterPos[1];

      assisterPos[1]+= factor * effect.assister;

      assisteePos[1]+= factor * effect.assistee;
    } else if (assisterPos[1] === assisteePos[1]){ //same column, move along the column, so change row

      let factor = assisteePos[0] - assisterPos[0];
      assisterPos[0]+= factor * effect.assister;
      assisteePos[0]+= factor * effect.assistee;

    }

    let newAssisterPos = this.RowColumnToPosition(assisterPos);
    let newAssisteePos = this.RowColumnToPosition(assisteePos);

    //TODO - needs to make sure space is not occupied by someone else too
    if (assisterPos[1] > 5 || assisterPos[1] < 0 || assisteePos[1] > 5 || assisteePos[1] < 0 //column out of bounds
      || assisterPos[0] > 7 || assisterPos[0] < 0 || assisteePos[0] > 7 || assisteePos[0] < 0) { //row out of bounds


      return updatedHeroList; //return original list

    } else if (this.props.G.cells[newAssisteePos] !== null &&  !participantIDs.includes(this.props.G.cells[newAssisteePos].id) ){ //new assistee position is occupied by other hero
      return updatedHeroList;

    } else if (this.props.G.cells[newAssisterPos] !== null &&  !participantIDs.includes(this.props.G.cells[newAssisterPos].id) ){ //new assister position is occupied by other hero
      return updatedHeroList;

    } else{

      list[assister.side][assister.listIndex].position = newAssisterPos;
      list[assistee.side][assistee.listIndex].position = newAssisteePos;

      return list;
    }


  }

  ApplyRallyAssist(updatedHeroList, assister, assistee, effect){
    //rally effects are lists whose elements are two element lists. For those two elements lists, the first is the stat buffed and the second is the amount of the buff
    //if the first element is just up, then the buff is applied to units around the assistee as well

    let list = updatedHeroList;
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

    Object.keys(buffs).forEach((key, i) => {
      assistee.buff[key] = Math.max( assistee.buff[key] ,buffs[key]); //apply highest buff
    });

    //apply the rally to 
    if (aoe){
      let inRangeAllies = this.GetDistantAllies(list[assistee.side.toString()], assistee.position, assister.position, 2);

      //apply buff to all allies in range
      for (let x of inRangeAllies){
        Object.keys(buffs).forEach((key, i) => {
          x.buff[key] = Math.max( x.buff[key] ,buffs[key]); //apply highest buff
        });

        list[x.side][x.listIndex] = x;
      }
      

    }

    list[assistee.side][assistee.listIndex] = assistee;

    return list;


  }

  ApplyHealthAssist(updatedHeroList, assister, assistee, effect){
    let list = updatedHeroList;

    let newAssisterHP = assister.currentHP;
    let newAssisteeHP = assistee.currentHP;

    if (effect.type === "swap"){ //reciprocal aid


      //set hp for assister
      newAssisterHP = Math.min(assistee.currentHP, assister.stats.hp); //keep hp below max

      //set hp for assistee
      newAssisteeHP = Math.min(assister.currentHP, assistee.stats.hp); //keep hp below max
      

    } else if(effect.type === "sacrifice"){

      //there are two things with sacrifice assists, the amount transferred and the amount healed.

      //transfer is hp loss
      //heal is amount gained

      let maxHeal = effect.healMax; //the amount transferred is capped



      let maxGive = assister.currentHP - 1; //can transfer until HP reaches 1
      let maxGet = assistee.stats.hp - assistee.currentHP; //can only transfer amount to fully heal

      let healAmount = Math.min(maxHeal, maxGive, maxGet); //the amount healed is the least of these three numbers
      let transferAmount = Math.max(healAmount, effect.transferMin); //amount transferred is the amount healed, or the minimum transferMin (because ardent sacrifice)

      if (maxGive < effect.transferMin){ //if the hp that can be transferred is less than the minimum heal, then do not apply assist and return list
        return list;
      }

      newAssisterHP = assister.currentHP - transferAmount;
      newAssisteeHP = assistee.currentHP + healAmount;


    }

    list[assistee.side][assistee.listIndex].currentHP = newAssisteeHP;
    list[assister.side][assister.listIndex].currentHP = newAssisterHP;

    return list;

  }

  ApplyHealAssist(updatedHeroList, assister, assistee, effect){
    let list = updatedHeroList;

    let newAssisterHP = assister.currentHP;
    let newAssisteeHP = assistee.currentHP;


    //actual heal values to apply
    let assisterHeal = 0;
    let assisteeHeal = 0;
    // "effect": {"atk": 0.5, "min": 7, "mod": 0, "self": "martyr", "mod2": "martyr"},

    //minimum that will be healed
    let min = effect.min;
    //calculated healing amount
    let selfHeal = effect.selfHeal;

    let healCalc = Math.floor(assister.stats.atk * effect.atk) + effect.mod;


    if (effect.mod2 === "martyr"){
      healCalc += assister.stats.hp - assister.currentHP; //add to calculated healing amount, the damage on assister
      selfHeal = Math.floor( (assister.stats.hp - assister.currentHP)/2); //heal for half of damage on assister


    }

    assisteeHeal = Math.max(min, healCalc); //Get the highest of the two
    assisterHeal = selfHeal;


    if (effect.mod2 === "rehab"){ //rehab's bonus is applied after the maximum is found
      assisteeHeal += assistee.stats.hp - (2 * assistee.currentHP);
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

            //heal team according special
            list[side][x.listIndex].currentHP = Math.min(list[side][x.listIndex].currentHP + assisterSpecial.effect.teamHeal, list[side][x.listIndex].stats.hp);

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
    } else{

      if (assisterSpecial.charge >= 0){
        assisterSpecial.charge = Math.max(0, assisterSpecial.charge - 1);
      }
    }

    //set new HP values - Keep hp below max;
    newAssisteeHP = Math.min(assistee.stats.hp, assistee.currentHP + assisteeHeal);
    newAssisterHP = Math.min(assister.stats.hp, assister.currentHP + assisterHeal);
    
    
   
    list[assister.side][assister.listIndex].special.charge = assisterSpecial.charge;

    list[assistee.side][assistee.listIndex].currentHP = newAssisteeHP;
    list[assister.side][assister.listIndex].currentHP = newAssisterHP;

    return list;

  }

  ApplyDanceAssist(updatedHeroList, assister, assistee){
    let list = updatedHeroList;

    if (assistee.end === true){
      list[assistee.side][assistee.listIndex].end = false;
    }

    

    return list;


  }





  CheckAdjacent(first, second){
   let firstRC = PositionToRowColumn(first);
   let secondRC = PositionToRowColumn(second);


    //if rows are the same, and column difference is one
    if (firstRC[0] === secondRC[0] && Math.abs(firstRC[1] - secondRC[1]) === 1){
      return true;
    } else if (firstRC[1] === secondRC[1] && Math.abs(firstRC[0] - secondRC[0]) === 1)
      return true;
    
    return false;

  }


  GetAdjacentAllies(hList, position, excluded){
    let adjacentList = [];

    for (let x of hList){
      if (x.position !== position && x.position !== excluded && GetDistance(x.position, position) === 1 ){
        adjacentList.push(x);
      }

    }    
    return adjacentList;
  }

  GetDistantAllies(hList, position, excluded, distance){
    let distantList = [];

    for (let x of hList){
      if (x.position !== position && x.position !== excluded && GetDistance(x.position, position) <= distance ){
        distantList.push(x);
      }

    }    
    return distantList;
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


    //console.log(this.state.heroList);
    //console.log(this.state.heroList[this.state.playerSide][this.state.heroIndex]);


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
            drop = {this.dropTeamMember} />
        </td>

        <td colSpan = "3">
          <Stats 
              gameState = {this.state} 
              levelChange = {this.onLevelsChange}
              heroChange = {this.onHeroChange}  
              buffChange = {this.onBuffChange}
              ivChange = {this.onIVChange}
              hpChange = {this.onHPChange}
              specialChargeChange = {this.onSpecialChargeChange} />
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
            drop = {this.dropTeamMember} />            
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
            seasonChange = {this.onSeasonChange} />
          
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

  function hero(){
    this["id"] = arguments[0];
    this["listIndex"] = arguments[0] % 6; //index of the hero for the list of heroes
    this["level"] = 40;
    this["merge"] = 0;
    this["dragonflower"] = 0;
    this["heroID"] = {value: 0, label: ""};
    this["iv"] = {asset: "neutral", flaw: "neutral"};
    this["heroSkills"] = {"weapon": {value: "0", label: ""}, "assist": {value: "0", label: ""}, "special": {value: "0", label: ""}, 
                          "a": {value: "0", label: ""}, "b": {value: "0", label: ""}, "c": {value: "0", label: ""}, "seal": {value: "0", label: ""} //hero skills equipped
                        };

    this["side"] = (Math.floor(arguments[0] / 6) + 1).toString();

    this["buff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["debuff"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    this["combat"] = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    
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
    this["special"] = {"cd": -10, "charge": -10};
    this["range"] = -1;
    this["bonus"] = false;
    this["end"] = false;
    this["effects"] = {"cdTrigger": 0, "reflect": 0};
    this["combatEffects"] = {"counter": false, "double": 0, "enemyDouble": 0, "stats": {"atk": 0, "spd": 0, "def": 0, "res": 0} }; //effects the change during battle
    this["initiating"] = false; 
    this["conditionalEffects"] = []; //list of conditional effects

  }  
  return hero;
}


export default GameBoard;
