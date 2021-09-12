import heroData from './heroInfo.json';
import {calculateCombatStats} from './StatCalculation.js'

import {addEffect, applyCombatEffect, statusDebuffs, getEnemySide, checkConditionHero, heroStruct} from './GameBoard.js'



export function doBattle(updatedHeroList, attacker, defender, board){
    let list = updatedHeroList;

    let newAttacker = attacker;
    let newDefender = defender;
    console.log(attacker);
    //get specials
    let attackerSpecial = attacker.special;
    let defenderSpecial = defender.special;


    //after call combat buffs are calculated, recalculate their combat stats to use in damage calculation
    newAttacker.combatStats = calculateCombatStats(newAttacker, newDefender);
    newDefender.combatStats = calculateCombatStats(newDefender, newAttacker);

    //target def or res
    let attackerType = getDamageType(heroData[attacker.heroID.value].weapontype, attacker, defender);
    let defenderType = getDamageType(heroData[defender.heroID.value].weapontype, defender, attacker);
    //aDmgType = 

    //get the amount of attacks from each unit
    let attackCount = getAttackCount(attacker, defender);

    let attackStack = getAttackOrder(attackCount, attacker, defender);


    let attackerAttacked = false;
    let defenderAttacked = false;
    let attackerSpecialActivated = false;
    let defenderSpecialActivated = false;

    let attackerMiracle = false;
    let defenderMiracle = false;

    let attackerSubEffect = [];
    let defenderSubEffect = [];

    if (attacker.specialActivated){ //check if pre battle special was used
      attackerSpecialActivated = true;
    }

    //At this point, battle has started
    let attackIndex = 0;

    while (attackIndex < attackStack.length  && newAttacker.currentHP > 0 && newDefender.currentHP > 0){ //do attacks as long as the attack stack is not empty and both heroes are alive
      let temp = attackStack[attackIndex]; 
      let damageInfo = {};


      if (temp === 1){ //attacker hits defender
        damageInfo = calculateDamage(newAttacker, newDefender, attackerType, attackerSpecial, defenderSpecial, list, attackStack, attackIndex, defenderMiracle);

        attackerSpecial.charge = damageInfo.attackerSpecialCharge;

        defenderSpecial.charge =  damageInfo.defenderSpecialCharge;


        if (damageInfo.miracleActivated){ //only copy the miracle activated if it is true
          defenderMiracle = damageInfo.miracleActivated;
        }


        newDefender.currentHP = Math.max(0, newDefender.currentHP - damageInfo.damage);

        if (newAttacker.statusEffect.deepWounds < 1){ //in calculate damage, deepwounds is already accounted for so this check is not really neccessary
          newAttacker.currentHP = Math.min(newAttacker.stats.hp, newAttacker.currentHP + damageInfo.heal); //heal hp from attack
        }

        //the only reflecting special is currently ice mirror (range = 2), so can only be activated  by a melee defender (og fjorm) that is initated on  

        if (newDefender.combatEffects.reflect === 0){ //only get reflect damage if it is currently not set (so can't get overwritten from stuff like brave attacks)
          newDefender.combatEffects.reflect = damageInfo.reflect; 
        }


        if (newAttacker.combatEffects.reflect !== 0){ //The attacker has just attacked, so its reflect boost is now reset
          newAttacker.combatEffects.reflect = 0;
        }

        console.log(damageInfo);


        attackerAttacked = true;


        if (damageInfo.attackerSpecialActivated){
          attackerSubEffect = damageInfo.subEffect;
          attackerSpecialActivated = true;

        }

        if (damageInfo.defenderSpecialActivated){
          defenderSpecialActivated = true;
        }

      } else if (temp === 2){ //defender hits attacker

        //Note - CalculateDamage defines attacker as the one attacking, and defender as the one getting hit for the current attack, not by initiator/enemy phase heroes 
        damageInfo = calculateDamage(newDefender, newAttacker, defenderType, defenderSpecial, attackerSpecial, list, attackStack, attackIndex, attackerMiracle);

        defenderSpecial.charge = damageInfo.attackerSpecialCharge; //defender is iniated on, but uses attacker key since they are the one attacking here
        attackerSpecial.charge = damageInfo.defenderSpecialCharge;

        if (damageInfo.miracleActivated){ //only copy the miracle activated if it is true
          attackerMiracle = damageInfo.miracleActivated;
        }


        newAttacker.currentHP = Math.max(0, newAttacker.currentHP - damageInfo.damage);

        if (newDefender.statusEffect.deepWounds < 1){
          newDefender.currentHP = Math.min(newDefender.stats.hp, newDefender.currentHP + damageInfo.heal);
        }

        if (newAttacker.combatEffects.reflect === 0){ 
          newAttacker.combatEffects.reflect = damageInfo.reflect;
        }


        if (newDefender.combatEffects.reflect !== 0){ //The defender has just attacked, so its reflect is now reset
          newDefender.combatEffects.reflect = 0;
        }



        defenderAttacked = true;

        if (damageInfo.attackerSpecialActivated){
          defenderSubEffect = damageInfo.subEffect;
          defenderSpecialActivated = true;
        }

        if (damageInfo.defenderSpecialActivated){
          attackerSpecialActivated = true;
        }
      }

      attackIndex++;

    }

    //set new special charges before any post combat changes to it
    list[attacker.side][attacker.listIndex].special = attackerSpecial;
    list[defender.side][defender.listIndex].special = defenderSpecial;

    addEffect(attacker, attackerSubEffect);
    addEffect(defender, defenderSubEffect);

    //combat has now ended, post combat effects activate
//{"type": "onAttack", "subEffect": [{"type": "postCombatBuffDebuff", "subtype": "buff", "checkType": "distance", "list": ["stats"], "value": 4, "stats": ["atk", "spd", "def", "res"], "range": 2, "reference": true, "team": "owner", "from": "owner"}]  }


    let postCombatInfo = postCombat(list, attacker, defender, board, attackerAttacked, defenderAttacked, attackerSpecialActivated, defenderSpecialActivated);

    let attackerTeamPost = postCombatInfo.attackerTeamPost;
    let defenderTeamPost = postCombatInfo.defenderTeamPost;

    let attackerTeamSpecial = postCombatInfo.attackerTeamSpecial;
    let defenderTeamSpecial = postCombatInfo.defenderTeamSpecial;


    //The damage for the attacker/defender is done separately
    let attackerPostDamage = postCombatInfo.attackerPostDamage;
    let defenderPostDamage = postCombatInfo.defenderPostDamage;

    //apply post combat damage to both teams

    for (let x of list[attacker.side]){ //for each member of side
      if (heroValid(list[attacker.side][x.listIndex])){



        //hp
        list[attacker.side][x.listIndex].currentHP = Math.min(Math.max(1,list[attacker.side][x.listIndex].currentHP - attackerTeamPost[x.listIndex]), list[attacker.side][x.listIndex].stats.hp);

        //specials
        if (attackerTeamSpecial[x.listIndex] === "reset"){
          list[attacker.side][x.listIndex].special.charge = list[attacker.side][x.listIndex].special.cd; //reset charge
        } else {
          list[attacker.side][x.listIndex].special.charge = Math.min(Math.max(0, list[attacker.side][x.listIndex].special.charge - attackerTeamSpecial[x.listIndex]),list[attacker.side][x.listIndex].special.cd);
        }


      }
    }

    for (let x of list[defender.side]){ //for each member of side
      if (heroValid(list[defender.side][x.listIndex])){
        //hp
        list[defender.side][x.listIndex].currentHP = Math.min(Math.max(1,list[defender.side][x.listIndex].currentHP - defenderTeamPost[x.listIndex]), list[defender.side][x.listIndex].stats.hp);
        
        //specials

        if (defenderTeamSpecial[x.listIndex] === "reset"){
          list[defender.side][x.listIndex].special.charge = list[defender.side][x.listIndex].special.cd; //reset charge
        } else {
          list[defender.side][x.listIndex].special.charge = Math.min(Math.max(0, list[defender.side][x.listIndex].special.charge - defenderTeamSpecial[x.listIndex]),list[defender.side][x.listIndex].special.cd);
        }



      }
    }

    //apply post combat damage to defender/attacker

    if (newDefender.currentHP > 0){
      newDefender.currentHP = Math.min(Math.max(1, newDefender.currentHP - defenderPostDamage), newDefender.stats.hp); //cannot go below 0 from post battle damage and hp is capped
    }

    if (newAttacker.currentHP > 0){
      newAttacker.currentHP = Math.min(Math.max(1, newAttacker.currentHP - attackerPostDamage), newAttacker.stats.hp); //cannot go below 0
    }
    //set new current hp values
    list[attacker.side][attacker.listIndex].currentHP = newAttacker.currentHP;
    list[defender.side][defender.listIndex].currentHP = newDefender.currentHP;



    //increase combat Count
    list[attacker.side][attacker.listIndex].combatCount++;
    list[defender.side][defender.listIndex].combatCount++;

    return list;
  }

//applies effects done post combat.
//Returns the post hp/charge numbers




export function waitHero(hero){
    hero.debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    hero.statusEffect = JSON.parse(JSON.stringify(statusDebuffs));
    hero.anchorPosition = hero.position;
    hero.end = true;
}


export function postCombat(list, attacker, defender, board, attackerAttacked, defenderAttacked, attackerSpecialActivated, defenderSpecialActivated){ 



    //Deep wounds gets cleared post combat, but will still reduce healing effects before it is cleared
    let attackerWounds = attacker.statusEffect.deepWounds;
    let defenderWounds = defender.statusEffect.deepWounds;



    waitHero(list[attacker.side][attacker.listIndex]);
    //First, the attacker needs to be waited and clear debuffs/status effects
    // list[attacker.side][attacker.listIndex].debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    // list[attacker.side][attacker.listIndex].statusEffect = JSON.parse(JSON.stringify(statusDebuffs));
    // list[attacker.side][attacker.listIndex].end = true;




    //Apply battle-movement abilities
    //Check if attacker has a battle movement effect and both battlers are not saving someone currently (attacker can't really be saving currentlyit)
    if (Object.keys(attacker.battleMovement).length > 0  && !defender.saving && !attacker.saving){
      let participantIDs = [attacker.id, defender.id]; //their ids (to uniquely identify them)

      let newPositions =  calculateMovementEffect(attacker, defender, attacker.battleMovement);

      let attackerPos = newPositions.owner;
      let defenderPos = newPositions.other;
      


      //convert back to positions
      let newAttackerPos = rowColumnToPosition(newPositions.owner);
      let newDefenderPos = rowColumnToPosition(newPositions.other);


      if (checkValidMovement(attackerPos, defenderPos, [-1, -1], participantIDs, board)){ //no issues with given movement positions;
        //this changes the list version, the temporary version do not move for reference purposes
        list[attacker.side][attacker.listIndex].position = newAttackerPos;
        list[defender.side][defender.listIndex].position = newDefenderPos;

        //also update their anchor positions
        list[attacker.side][attacker.listIndex].anchorPosition = newAttackerPos
        list[defender.side][defender.listIndex].anchorPosition = newDefenderPos;

      }

    } else if (attacker.combatEffects.allySwap !== null){ //check if attack has an allySwap effect

        let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)

        let teamList = list[attacker.side];

        for (let x in teamList){
          if (heroValid(teamList[x]) && teamList[x].id !== attacker.id ){ //exclude themselves
            teamListValid.push(teamList[x]);
          }
        } 
        let passedHeroList = [];

        passedHeroList = heroReqCheck(attacker, teamListValid, attacker.combatEffects.allySwap.allyReq, list, 0) ; //Get the list of allies that pass the req check, turn is set to 0 since it should not be needed
        

        if (passedHeroList.length === 1){ //if only one hero found, then perform swap, otherwise nothing happens

          let ally = passedHeroList[0];

          let attackerPos = ally.position;
          let allyPos = attacker.position;


          if (checkValidMovement(positionToRowColumn(attackerPos), positionToRowColumn(allyPos), [-1, -1], [attacker.id, ally.id], board)){ //no issues with given movement positions;
            //this changes the list version, the temporary version do not move for reference purposes
            list[attacker.side][attacker.listIndex].position = attackerPos;
            list[ally.side][ally.listIndex].position = allyPos;

            //also update their anchor positions
            list[attacker.side][attacker.listIndex].anchorPosition = attackerPos;
            list[ally.side][ally.listIndex].anchorPosition = allyPos;

            list[attacker.side][attacker.listIndex].swapAllyPosition = attackerPos; //save the position the attacker moved to for updating the cells after doBattle

          }

        }


    }




    //on attack combatEffects (strike effects) should just be recoil and stuff (and some debuff stuff)

    //stuff like recoil should wear off and this works fine - combat effects fine
    //buffs or status buffs need to be applied to the list version tho

    if (attackerAttacked){
        for (let effectElement of attacker.onAttack){ //loops through list of onAttack effects

          applyCombatEffect(attacker, effectElement);


        } //for m

    }

    if (defenderAttacked){
        for (let effectElement of defender.onAttack){

          applyCombatEffect(defender, effectElement);

        } //

    }


    //Post combat effects (requires owner to survive)
    if (attacker.currentHP > 0){
       for (let effectElement of attacker.postCombat){ //loop through post combat effects
          applyCombatEffect(attacker, effectElement);



       } //end for post combat

    }

    if (defender.currentHP > 0){

       for (let effectElement of defender.postCombat){ //loop through post combat effects
          applyCombatEffect(defender, effectElement);

       } //end for post combat

    }




    //include burn
    let attackerPostDamage = attacker.combatEffects.recoil - attacker.combatEffects.postHeal + defender.combatEffects.burn;
    let defenderPostDamage = defender.combatEffects.recoil - defender.combatEffects.postHeal + attacker.combatEffects.burn;

    if (attackerWounds > 0 || attacker.combatEffects.nullHeal > 0){ //deep wounds or null heal will remove post heals
      attackerPostDamage+= attacker.combatEffects.postHeal;
    }

    if (defenderWounds > 0 || defender.combatEffects.nullHeal > 0){
      defenderPostDamage+= defender.combatEffects.postHeal;
    }

    //null post negates any recoil damage
    if (attacker.combatEffects.nullPost > 0){ 
      attackerPostDamage-= (attacker.combatEffects.recoil + defender.combatEffects.burn);
    }

    if (defender.combatEffects.nullPost > 0){
      defenderPostDamage-= (defender.combatEffects.recoil + attacker.combatEffects.burn);
    }


    //set initial recoil values - theese will have values for the attacker and defender but those values will be overwritten by the above values
    let attackerTeamPost = new Array(7).fill(0);
    let defenderTeamPost = new Array(7).fill(0);


    let attackerTeamSpecial = new Array(7).fill(0);
    let defenderTeamSpecial = new Array(7).fill(0);



    if (attackerSpecialActivated && attacker.combatEffects.spiral > 0){ //should also check for not postbattle special i guess
      attackerTeamSpecial[attacker.listIndex]+= attacker.combatEffects.spiral;
      //attackerSpecial.charge = Math.max(0, attackerSpecial.charge - attacker.combatEffects.spiral);
    }

    if (defenderSpecialActivated && defender.combatEffects.spiral > 0){
      defenderTeamSpecial[defender.listIndex]+= defender.combatEffects.spiral;
      //defenderSpecial.charge = Math.max(0, defenderSpecial.charge - defender.combatEffects.spiral);
    }


    for (let element of attacker.postCombatBuffDebuff){

        //calculateBuffEffect(tempList, heroList,  i, effect, this.state.currentTurn, allyTeamPost, allyTeamSpecial, enemyTeamPost, enemyTeamSpecial);
        let reference;


        if (element.from === "owner"){
          reference = attacker
        } else if (element.from === "enemy"){
          reference = defender
        }


        let side = 0;
        let postSide;
        let specialSide;

        if (element.team === "owner"){
          side = attacker.side;
          postSide = attackerTeamPost;
          specialSide = attackerTeamSpecial;
        } else if (element.team === "enemy") {
          side = defender.side;
          postSide = defenderTeamPost;
          specialSide = defenderTeamSpecial;
        }

        //We specifically use getDistantHeroes rather than an effect req here because these postcombat effects can use the enemy as a reference point (which effectReq cannot do since it does the condition based on the owner)
        let heroesInRange = [];
        heroesInRange = getDistantHeroes(list[side], reference, [attacker.saveID, defender.saveID], element.range); //excludes hero that is saved



        if ("effectReq" in element){
          //this does not have access to the turn and would have to be pass along a lot. Maybe we can pass along the current state so we can refernce those values easily
          heroesInRange = heroReqCheck(attacker, heroesInRange, element.effectReq, list, 0) ; //Get the list of allies that pass the req check, 

        }

        if (element.checkType === "distance"){
          //get heroes in range

          if (element.reference){ //just get reference if specified

            if ( !("effectReq" in element) || checkCondition(list, element.effectReq, reference, reference)  ){ //if no effectReq or passes the effect req
              heroesInRange = heroesInRange.concat([reference]);
            }
          }

          applyBuffList(list, heroesInRange, element, attacker, postSide, specialSide);
        } else if (element.checkType === "minDistance"){ //minDistance effects have 999 range but still use heroes in range for the excluded heroes
          //Although this is looking for a peak, we redo this here since these get distance with respect to a reference position
          let minDistance = 999;
          let affectedList = [];

          for (let h of heroesInRange){
            let distance = getDistance(h.position, reference.position);

            if (distance === minDistance){
              affectedList.push(h);
            } else if (distance < minDistance){
              affectedList = [];
              affectedList.push(h);
              minDistance = distance;

            }
          }
          applyBuffList(list, affectedList, element, attacker, postSide, specialSide);

        }

    }

    for (let element of defender.postCombatBuffDebuff){


        let reference;


        if (element.from === "owner"){
          reference = defender;
        } else if (element.from === "enemy"){
          reference = attacker;
        }


        let side = 0;
        let postSide;
        let specialSide;

        if (element.team === "owner"){
          side = defender.side;
          postSide = defenderTeamPost;
          specialSide = defenderTeamSpecial;
        } else if (element.team === "enemy") {
          side = attacker.side;
          postSide = attackerTeamPost;
          specialSide = attackerTeamSpecial;
        }


        //get heroes in range
        let heroesInRange = [];
        heroesInRange = getDistantHeroes(list[side], reference, [attacker.saveID, defender.saveID], element.range);

        if ("effectReq" in element){
          //this does not have access to the turn and would have to be pass along a lot. Maybe we can pass along the current state so we can refernce those values easily
          heroesInRange = heroReqCheck(defender, heroesInRange, element.effectReq, list, 0) ; //Get the list of allies that pass the req check, 

        }


        if (element.checkType === "distance"){
          if (element.reference){
            if ( !("effectReq" in element) || checkCondition(list, element.effectReq, reference, reference)  ){ //if no effectReq or passes the effect req
              heroesInRange = heroesInRange.concat([reference]);
            }
          }
          applyBuffList(list, heroesInRange, element, defender, postSide, specialSide);

        } else if (element.checkType === "minDistance"){
          
          let minDistance = 999;
          let affectedList = [];

          for (let h of heroesInRange){
            let distance = getDistance(h.position, reference.position);

            if (distance === minDistance){
              affectedList.push(h);
            } else if (distance < minDistance){
              affectedList = [];
              affectedList.push(h);
              minDistance = distance;

            }
          }
          applyBuffList(list, affectedList, element, defender, postSide, specialSide);

        }
       

    }


    return {"attackerTeamPost": attackerTeamPost, "defenderTeamPost": defenderTeamPost, "attackerTeamSpecial": attackerTeamSpecial, "defenderTeamSpecial": defenderTeamSpecial, "attackerPostDamage": attackerPostDamage, "defenderPostDamage": defenderPostDamage };


}

function getAdaptiveDamage(enemy){
  if (enemy.combatStats.def <= enemy.combatStats.res){ // if def is lower
    return "def";
  } else {
    return "res";
  }
}

export function getDamageType(weaponType, owner, enemy){
    if (owner.combatEffects.adaptive > 0 && enemy.combatEffects.nullAdaptive <= 0){
      return getAdaptiveDamage(enemy);

    }


    for (let stat in owner.combatEffects.defenseTarget){ //defense  target contains list of stats - if a stat is on, then that stat will be returned
      if (owner.combatEffects.defenseTarget[stat] > 0){
        return stat;
      }

    }

    if (["sword", "lance", "axe", "bow", "dagger", "beast"].includes(weaponType) ){
      return "def";
    } else if (["redtome", "bluetome", "greentome", "breath", "staff", "colorlesstome"].includes(weaponType)){
      return "res";
    }
    return "error";


  }
  //Get the number of attacks for each unit (e.g. doubling)
export function getAttackCount(attacker, defender){
    let attackerCount = 1; //Has at least one
    let defenderCount = 0;

    //determine if defender gets to attack at all - first check for range -             Check for sweeps and counter disrupt which stop counter                                                                     nullC will negate other effects stopping counter
    if ( (defender.range === attacker.range || defender.combatEffects.counter > 0) && ( (attacker.combatEffects.sweep <= 0 && defender.combatEffects.selfSweep <= 0 && defender.statusEffect.counterDisrupt <= 0) || defender.combatEffects.nullC > 0 ) ){ 
      defenderCount = 1;
    }



    //add up effects that guarantee doubles and prevents doubles
    let attackerDouble = attacker.combatEffects["double"] - defender.combatEffects.enemyDouble - attacker.combatEffects.stopDouble;
    let defenderDouble = defender.combatEffects["double"] - attacker.combatEffects.enemyDouble - defender.combatEffects.stopDouble;


    //Brash assault checks if enemy is able to attack to grant the extra double stack for attacker
    if (attacker.combatEffects.brashAssault > 0 && defenderCount > 0){
      attackerDouble++;
      attacker.combatEffects["double"]++;
    }

    //out speeding gives an extra double stack
    if ( (attacker.combatStats.spd - defender.combatStats.spd) >= 5) {
      attackerDouble++;
    }

    if ( (defender.combatStats.spd - attacker.combatStats.spd) >= 5) {
      defenderDouble++;
    }



    if (attacker.combatEffects.nullEnemyFollowUp > 0){
      defenderDouble-= defender.combatEffects["double"]; //neutralize enemy effects that guarantee their follow up
    }

    if (attacker.combatEffects.nullStopFollowUp > 0){

      attackerDouble+= defender.combatEffects.enemyDouble; // neutralize enemy effects that prevent follow ups
      attackerDouble+= attacker.combatEffects.stopDouble; //neutralize own effects that prevent follow ups

    }

    if (defender.combatEffects.nullEnemyFollowUp > 0){
      attackerDouble-= attacker.combatEffects["double"]; //neutralize enemy effects that guarantee follow ups
    }

    if (defender.combatEffects.nullStopFollowUp > 0){
      defenderDouble+= attacker.combatEffects.enemyDouble; // neutralize enemy effects that prevent follow ups
      defenderDouble+= defender.combatEffects.stopDouble; //neutralize own effects that prevent follow ups

    }

    //if double stack is at least 1, give an extra attack
    if (attackerDouble > 0){
      attackerCount++;
    }

    if (attacker.combatEffects.brave > 0){ //if brave effect, attack is doubled
      attackerCount = attackerCount * 2;
    }

    if (defenderDouble > 0 && defenderCount > 0){
      defenderCount++;
    }

    if (defender.combatEffects.brave > 0){
      defenderCount = defenderCount * 2;
    }

    return [attackerCount, defenderCount];
  }
  //Given the attack counts, return the order in the form of a stack list
export function getAttackOrder(stack, attacker, defender){
    //basic attack order without extra skills
    //
    //the number of attacks from each hero
    let attackerHits = stack[0];
    let defenderHits = stack[1];


    //The amount of hits performed at a time - for brave effects
    let attackerRoundHits = 1;
    let defenderRoundHits = 1;

    if (attacker.combatEffects.brave > 0){
      attackerRoundHits = 2;
    }

    if (defender.combatEffects.brave > 0){
      defenderRoundHits = 2;
    }

    let attackStack = [];

    let hardyBearing = Math.max(attacker.combatEffects.hardyBearing, defender.combatEffects.hardyBearing); //either hero having it will enable it for all attack order changes (basically vantage and desperation)

    //vantage attack
    if (defenderHits > 0 && defender.combatEffects.vantage > 0 && hardyBearing <= 0){
      
      for (let i = 0; i < defenderRoundHits; i++){
        attackStack.push(2);
      }

      defenderHits-= defenderRoundHits;

      if (defenderHits > 0 && (defender.combatEffects.desperation > 0 || attacker.combatEffects.grantDesperation > 0) && hardyBearing <= 0){ //if desperation is active get follow up attack immediately
        
        for (let j = 0; j < defenderRoundHits; j++){
          attackStack.push(2);
        }

        defenderHits-= defenderRoundHits;

      }

    }



    //first attacker attack
    if (attackerHits > 0){

      for (let i = 0; i < attackerRoundHits; i++){
        attackStack.push(1);
      }

      attackerHits-= attackerRoundHits;

      //if desperation and can double, attack does their second before defender 
      if (attackerHits > 0 && (attacker.combatEffects.desperation > 0 || defender.combatEffects.grantDesperation > 0) && hardyBearing <= 0){

        for (let j = 0; j < attackerRoundHits; j++){
          attackStack.push(1);
        }

        attackerHits-= attackerRoundHits;

      }

    }



    //first defender attack

    if (defenderHits > 0){
      
      for (let i = 0; i < defenderRoundHits; i++){
        attackStack.push(2);
      }

      defenderHits-= defenderRoundHits;

      if (defenderHits > 0 && (defender.combatEffects.desperation > 0 || attacker.combatEffects.grantDesperation > 0) && hardyBearing <= 0){ //if desperation is active get follow up attack immediately 
        
        for (let j = 0; j < defenderRoundHits; j++){
          attackStack.push(2);
        }

        defenderHits-= defenderRoundHits;

      }
    }



    //if there are still follow up attacks to occur, then do remaining attacks
    if (attackerHits > 0){

      for (let i = 0; i < attackerRoundHits; i++){
        attackStack.push(1);
      }

      attackerHits-= attackerRoundHits;

    }


    if (defenderHits > 0){
      
      for (let i = 0; i < defenderRoundHits; i++){
        attackStack.push(2);
      }

      defenderHits-= defenderRoundHits;
    }



    //}

    return attackStack;
  }


export function calculateDamage(attacker, defender, damageType, attackerSpecial, defenderSpecial, heroList, attackStack, attackIndex, defenderMiracle){

  let WTA = calculateWeaponTriangleAdvantage(attacker, defender); //get the WTA multiplier


  let effective = getEffectiveDamage(heroList, attacker, defender);

  //let baseDamage = attacker.combatStats.atk + Math.trunc(attacker.combatStats.atk * WTA) - defender.combatStats[damageType] ; //damage can be negative here

  let WTAattack = attacker.combatStats.atk + Math.trunc(attacker.combatStats.atk * WTA); //first add the WTA to the attack stat
  let effectiveAttack = WTAattack + Math.trunc(WTAattack * effective); //then add the effective to the attack stat - this stacks with the WTA bonus. 

  //The order here doesn't matter since WTA and effectiveness both stack off each other.

  let baseDamage = effectiveAttack - defender.combatStats[damageType] ; //damage can be negative here
  //let baseDamage = Math.trunc(attacker.combatStats.atk * WTA * effective) - defender.combatStats[damageType] ; //damage can be negative here

  //staff damage reduction - Check if using staff, wrathful is not active or defender is nulling wrathful 
  if (heroData[attacker.heroID.value].weapontype === "staff" && (attacker.combatEffects.wrathful === 0 || defender.combatEffects.nullWrathful === 1) ){
    baseDamage = Math.trunc(baseDamage / 2); 
  }


  let attackerSpecialCharge = attackerSpecial.charge;
  let defenderSpecialCharge = defenderSpecial.charge;

  let specialDamage = 0;

  let trueDamage = attacker.combatEffects.trueDamage;

  
  let specialEffect = attackerSpecial.effect;

  let onHitHeal = attacker.combatEffects.onHitHeal;

  let reduceReduction = calculateReductionEffects(attacker.combatEffects.reduceReduction, 1.0);  

  // let partyHeal = 0;
  // let partyBuff = {};
  let subEffect = [];

  let attackerSpecialActivated = false;
  let defenderSpecialActivated = false;

  if (attackerSpecialCharge === 0 && attackerSpecial.type === "attack-battle"){ //if charged and an offsensive battle special

    if ("adaptive" in specialEffect){
      
      damageType = getAdaptiveDamage(defender);
      baseDamage = attacker.combatStats.atk + Math.trunc(attacker.combatStats.atk * WTA) - defender.combatStats[damageType] ; //recalc base damage
      
    }

    if ("reduceReduction" in specialEffect){ //specials have effects that can reduce damage reductions (nullify in most cases)
      reduceReduction = calculateReductionEffects([reduceReduction, specialEffect.reduceReduction] , 1.0);   
    }

    if ( Array.isArray(specialEffect.damage) ){ //if the damage value is a list - get the special damage 
      
      specialDamage = getSpecialValue(specialEffect, attacker, defender, heroList, damageType, "damage");

    }
    for (let i of attacker.onSpecial){ //loop through effects that activate on special
      if (i !== null){

        for (let j in i){ 
          if (j === "damage"){
            //let onSpecialDamage = i.damage;
            let extraDamage = getSpecialValue(i, attacker, defender, heroList, damageType, j);
            // let sHero;



            if (i.damage[3] === "trueDamage"){
              trueDamage+= extraDamage;
            } else if (i.damage[3] === "specialDamage" ){
              specialDamage+= extraDamage
            }


          } else if (j === "heal"){


            onHitHeal+= getSpecialValue(i, attacker, defender, heroList, damageType, j);


          } else if (j === "reduceReduction") {
            reduceReduction = calculateReductionEffects([reduceReduction, i.reduceReduction] , 1.0);  
          } //end if heal
        } //end for i



      }

    } //end for onSpecial



    getConditionalSpecial(attacker, defender, heroList); 

    trueDamage+= attacker.combatEffects.specialTrueDamage; 

    removeConditionalSpecial(attacker, defender, heroList);



    //add the amplify special damage (astra, glimmer etc.)
    specialDamage = specialDamage + Math.trunc( (baseDamage +  specialDamage) * specialEffect.amplify); //amplify is not applied to true damage


    attackerSpecialCharge = attackerSpecial.cd;  //reset cd


    if ("subEffect" in specialEffect){

      subEffect =  specialEffect.subEffect;

    }




    attackerSpecialActivated = true;

  } else{ //special not activated, increment normally

    if (attackerSpecialCharge >= 0){

      let chargeValue = 1; //by default 1

      if (defender.combatEffects.nullCharge < 1){ //check if defender is nulling charge effects
        chargeValue = Math.min(attacker.combatEffects.attackCharge, 2); //max charge value is 2
      }

      let guardValue = 0;

      if (attacker.combatEffects.nullGuard < 1){
        guardValue = Math.min(defender.combatEffects.guard + attacker.statusEffect.guard, 1);
      }

      //charge will not go below 0. attack charge will be at least 1 but maxes out a 2. Guard will be at least 0 but maxes out at 1.
      attackerSpecialCharge = Math.max(0, attackerSpecialCharge - chargeValue + guardValue); //- Math.min(attacker.combatEffects.attackCharge, 2) + Math.min(defender.combatEffects.guard + attacker.statusEffect.guard, 1) ); //unit attacking
    }

  } //end offensive special check 

  specialDamage+= attacker.combatEffects.reflect; //adding the reflect damage


  


  //all damage reduction values are 1 - percent reduced by. 0 damage reduction is thus 1 - 0 = 1.0
  //When used in calculations, 1 - damage reduction is used 
  let damageReduction = calculateReductionEffects(defender.combatEffects.damageReduction, reduceReduction);


  let currentAttacker = attackStack[attackIndex];

  //if adding the first damage reduction

  let indexCounter = attackIndex - 1;
  let previousAttacks = 0; //the number of attacks from current attacker before this attack
  while (indexCounter >= 0){ //loop back until start of stack is reached

    //an attack from the current attacker has been found, increment previous attack counter
    if (attackStack[indexCounter] === currentAttacker){
      previousAttacks++;
    }
    indexCounter--;

  }

  //first attack damage reduction
  if (previousAttacks === 0){
    damageReduction = damageReduction * calculateReductionEffects(defender.combatEffects.firstReduction, reduceReduction);
  }

  //if adding the consecutive damage reduction 
  //check if an attack has been made before this, then check if it was the current attacker (thus a consecutive attkack)

  if (attackIndex - 1 >= 0 && attackStack[attackIndex - 1] === currentAttacker){ 
    damageReduction = damageReduction * calculateReductionEffects(defender.combatEffects.consecutiveReduction, reduceReduction);
  }

  //Follow-up reduction - if not brave then just check second attack, otherwise check 3rd and 4th
  if (attacker.combatEffects.brave > 0 && previousAttacks >= 2){ //if brave, check if 2 other attacks have been made (so it is now the 3rd or 4th)
     damageReduction = damageReduction * calculateReductionEffects(defender.combatEffects.followUpReduction, reduceReduction);

  } else if (previousAttacks >= 1) { //not brave attack, check if they have done at least one attack (should only 1 since no brave effect)
    damageReduction = damageReduction * calculateReductionEffects(defender.combatEffects.followUpReduction, reduceReduction);
  }

  let miracle = false;
  let reflect = false;
  let reflectDamage = 0;
  let flatReduction = 0;


  if (defender.combatEffects.mirror >= 1){
    reflect = true;
  }

  if (defenderSpecialCharge === 0 && defenderSpecial.type === "defend-battle" && 
    (defenderSpecial.range === 0 || defenderSpecial.range === getDistance(attacker.position, defender.position)  ) ){
    if (defenderSpecial.effect.factor === "miracle"){
      miracle = true;
    } else{
      damageReduction = damageReduction * calculateReductionEffects([defenderSpecial.effect.factor], 1.0); //special reductions are not affected by reduce reductions
    }

    if ("reflect" in defenderSpecial.effect){

      if (defenderSpecial.effect.reflect["damage"].includes("mirror")){ //if the damage key of the reflect effect is a mirror image
        reflect = true; //reflect damage is calculated later
      } else {
        reflectDamage = getSpecialValue(defenderSpecial.effect.reflect, defender, attacker, heroList, damageType, "damage"); 
      }
      
    }


    if (!miracle){
      defenderSpecialCharge = defenderSpecial.cd;

      defenderSpecialActivated = true; //if its not miracle, then it is activated
      flatReduction = defender.combatEffects.specialFlatReduction; //flat reduction does not apply to miracle
    }


    //getConditionalSpecial(defender, attacker, heroList);


  } else{
    if (defenderSpecialCharge >= 0){


      let chargeValue = 1; //by default 1

      if (attacker.combatEffects.nullCharge < 1){ //check if attacker is nulling charge effects
        chargeValue = Math.min(defender.combatEffects.defenseCharge, 2); //max charge value is 2
      }

      let guardValue = 0;

      if (defender.combatEffects.nullGuard < 1){
        guardValue = Math.min(attacker.combatEffects.guard + defender.statusEffect.guard, 1);
      }
      
      defenderSpecialCharge = Math.max(0, defenderSpecialCharge - chargeValue  + guardValue); //Math.min(defender.combatEffects.defenseCharge, 2) + Math.min(attacker.combatEffects.guard + defender.statusEffect.guard, 1) );



    }
  }


  //Base damage can end up being calculated to be below 0 and special damage adds upon the base (so special damage will be reduced by negative damage). The amount dealt by base+special has to be at least 0.
  //True damage is added to total damage and is added as is regardless of the value of the negative damage
  let totalDamage = Math.max(0, baseDamage + specialDamage) + trueDamage; //total damage before reductions 

  if (reflect){
    reflectDamage =  Math.trunc( totalDamage - totalDamage * damageReduction ) + flatReduction; //the amount of reflected damage is the damage reduced by damage reduction

  }




  //[Damage Including Extra Damage] – ([Damage Including Extra Damage] x [Effect of Damage-Mitigating Skill or Special]) = Final Damage After Mitigation


  totalDamage = totalDamage - Math.trunc( totalDamage - totalDamage * damageReduction ) - flatReduction; //total damage after reductions


  //if damage dealt is less than minimum (will be 0 for the most part), then set damage to minimum damage
  if (totalDamage < attacker.combatEffects.minimumDamage){ 
    totalDamage = attacker.combatEffects.minimumDamage;
  }

  //calculate separately for base and special damage for additional info
  baseDamage = baseDamage - Math.trunc( baseDamage - baseDamage * damageReduction);
  specialDamage = specialDamage - Math.trunc( specialDamage - specialDamage * damageReduction);

  let miracleActivated = false;

  if ( (miracle || defender.combatEffects.miracle > 0) && !defenderMiracle ){ //check if miracle has been active from specials or combat effect and defender has not used the miracle effect yet
    if (defender.currentHP > 1 && totalDamage >= defender.currentHP){ //if hp > 1 and their hp would go to 0, activate miracle
      totalDamage =  defender.currentHP - 1; //leave 1 hp

      if (defender.combatEffects.miracle < 1){
        defenderSpecialCharge = defenderSpecial.cd;
        defenderSpecialActivated = true;
      }


      //This only effects the temporary combat version of the defender, so does not need to be reset after battle.
      miracleActivated = true;

      
    }
  }


  if (defender.combatEffects.damageNull > 0){
    //set all damage to 0
    baseDamage = 0;
    specialDamage = 0;
    totalDamage = 0;
  }

  let damageDealt = Math.min(defender.currentHP, totalDamage); //damage dealt maxes out at the current HP of defender (for healing purposes)

  let heal = 0;

  if (attacker.statusEffect.deepWounds < 1){
    heal+= onHitHeal;//attacker.combatEffects.onHitHeal;
  }

  console.log(attacker);
  if (attackerSpecialActivated && attacker.statusEffect.deepWounds < 1){ //special healing
    heal+= Math.trunc(attacker.combatEffects.specialHeal * damageDealt);
    if ("heal" in specialEffect){
      heal+= Math.trunc(specialEffect.heal * damageDealt); 
    }
  } 

  if (attacker.combatEffects.absorb > 0 && attacker.statusEffect.deepWounds < 1){

    heal+= Math.trunc(attacker.combatEffects.absorb * damageDealt);

  }

  if (attacker.combatEffects.nullHeal > 0){
    heal = 0;
  }

  return {"damage": totalDamage, "reflect": reflectDamage, "base": baseDamage, "special": specialDamage, "heal": heal, "subEffect": subEffect,
  "attackerSpecialCharge": attackerSpecialCharge, "defenderSpecialCharge": defenderSpecialCharge,
  "attackerSpecialActivated": attackerSpecialActivated, "defenderSpecialActivated": defenderSpecialActivated, "miracleActivated": miracleActivated  } ; ///glimmer interacts with damage reduction

}

export function calculateReductionEffects(reductionList, reduceReduction){//Given a list of reduction effects, get the total reductions

  let totalReduction = 1.0; //default of no reduction at 1.0

  for (let reduction of reductionList){

    let actualReduction = 1.0 - reduction; //the actual damage reduction is 1- reduction

    let reducedAmount = Math.trunc( (actualReduction - (actualReduction * reduceReduction)) * 100) / 100; //multiplied by 100 for truncation and divided to bring back to percent

    let reduce = reduction +  reducedAmount; //add the reduce reduction to the damage reduction

    totalReduction*= (reduce); //add to total reduction

  }

  return totalReduction;
}

export function getSpecialValue(effect, owner, enemy, heroList, damageType, key){
    let specialValue = 0;
    let hero; //which hero to base the damage off of
    if (effect[key][0] === "attacker"){
      hero = owner;
    } else if (effect[key][0] === "defender"){
      hero = enemy;
    }

    let stat = effect[key][1];
    if (stat === "defensive"){
      stat = damageType;
    }

    console.log(effect);

    let factor = effect[key][2];

    if (factor === "variable"){ //if factor is variable, the variable factors will be in the 5th element.
      factor = getVariableValue(heroList, effect[key][4], owner, 0);
    }

    if ("condition" in effect && checkCondition(heroList, effect.condition, owner, enemy) ){

      factor = effect["alt"];
      console.log(factor);
      console.log(effect["alt"]);
    }

    if (stat === "flat"){
      specialValue = factor; //special damage is flat
    } else if (stat === "missingHP"){ //HP specials are based on missing hp and only for attackers
      specialValue = Math.trunc( (owner.stats.hp - owner.currentHP) * factor);

    } else if (stat === "hp"){
      specialValue = Math.trunc(hero.stats[stat] * factor);  

    } else{
      specialValue = Math.trunc(hero.combatStats[stat] * factor);
    }

    return specialValue;
}

export function getWeaponTriangleAdvantage(attacker, defender){ //tells us if there is a WTA advange or not (not the actual advantage that would happen in combat which is in calculateWeaponTriangleAdvantage)
	let advantage = 0.0; //0 is no advange. > 0 is advantage , < 0 is disadvantage

  let colorAttack = heroData[attacker.heroID.value].color;
  let colorDefend = heroData[defender.heroID.value].color; //get the WTA multiplier


  if (colorAttack === "red"){
    if (colorDefend === "blue"){
      advantage = -1;
    } else if (colorDefend === "green"){
      advantage = 1;
    } else if (colorDefend === "colorless" && attacker.combatEffects.raven > 0){
      advantage = 1;

    }

  } else if (colorAttack === "blue"){
    if (colorDefend === "green"){
      advantage = -1;
    } else if (colorDefend === "red"){
      advantage = 1;
    } else if (colorDefend === "colorless" && attacker.combatEffects.raven > 0){
      advantage = 1; //to do, add raven effect
    }

  } else if (colorAttack === "green"){
    if (colorDefend === "red"){
      advantage = -1;
    } else if (colorDefend === "blue"){
      advantage = 1;
    } else if (colorDefend === "colorless" && attacker.combatEffects.raven > 0){
      advantage = 1; //to do, add raven effect
    }

  } else if (colorAttack === "colorless"){ 
    if (defender.combatEffects.raven > 0){ //if defender has raven effect, get disadvantaged
      advantage = -1;
    }

    //technically, if you have advantage and disadvantage but have cancel affinity vs TA, the CA will reverse the TA's bonuses and still gain the advantage,  we can make it a special case if ever implemented
    if (attacker.combatEffects.raven > 0 && colorDefend === "colorless"){ //colorless don't have a way to get the raven effect but they would theoretically be able to get the advantage boost against other colorless (and would cancel out with another raven colorless)
    
      if (advantage < 0){ //already have disadvantage
        advantage = "doubleAdvantage";
      } else { //just give advantage regularly
        advantage = 1;
      }

    }

  }
  return advantage;
} //end get WTA 

export function calculateWeaponTriangleAdvantage(attacker, defender) { //calculates the multiplier granted by WTA

  let advantage = getWeaponTriangleAdvantage(attacker, defender);
//triangle adept increases these values by their specified amount (on both sides even though the wording on it suggests that it would not provide the extra attack to enemies
//uses the highest one and does not stack

//CA 1 - will cancel out all TA effects
//CA 2 - firstly, cancels out your own TA effects. cancel enemy TA effects only if owner is at disadvantage. If at advantage, TA will still be in effect
//CA 3 - firstly, cancels out your own TA effects. If at advantage TA effect will still be in effect. If at disadvantage TA effects will be be reversed (neutralizing the regular WTA)

  let affinity = 1.0; //default affinity

  let attackerTA = Math.max(...attacker.combatEffects.triangleAdept);
  let attackerCA = Math.max(...attacker.combatEffects.cancelAffinity);


  let defenderTA = Math.max(...defender.combatEffects.triangleAdept);
  let defenderCA = Math.max(...defender.combatEffects.cancelAffinity);



  if (attackerCA > 0 || defenderCA === 1) { //all tier of CA neutralize self triangleAdept, CA on defender will cancel it
    attackerTA = 0.0;
  }

  if (defenderCA > 0 || attackerCA === 1) { //all tier of CA neutralize self triangleAdept, CA 1 on attacker will cancel it
    defenderTA = 0.0;
  }

  let TAEffect = Math.max(attackerTA, defenderTA); //Get the larger TA

  
  if (advantage < 0) { //if attacker is at disadvantage,

    if (attackerCA === 2){ //CA 2 neutralizes TA
        TAEffect = 0.0;
    } else if (attackerCA === 3){ //CA 3 reverse TA
      TAEffect = -TAEffect; //reverse the affiniy
    }
    
  } else if (advantage > 0){ //if attacker is at defender (which means defender is at disadvantage)
    if (defenderCA === 2){ //CA 2 neutralizes TA
      TAEffect = 0.0;
    } else if (defenderCA === 3){ //CA 3 reverses TA
      TAEffect = -TAEffect;
    }

  } else if (advantage === "doubleAdvantage"){ //theoretical situation where attacker has advantage and disadvantage at the same time - would cancel out eachother out normally but CA can swing it in a different dirrection

    let TA1, TA2 = TAEffect;

    //disadvantage portion
    if (attackerCA === 2){
      TA1 = 0.0;
    } else if (attackerCA === 3) {
      TA1 = -TA1
    }
    

    //advantage
    if (defenderCA === 2){ //CA 2 neutralizes TA
      TA2 = 0.0;
    } else if (defenderCA === 3){ //CA 3 reverses TA
      TA2 = -TA2;
    }

    let affinity1 = (TA1 + 20.0) / 20.0;
    let affinity2 = (TA2 + 20.0) / 20.0;

    return ( (0.2 * affinity1 * -1) + (0.2 * affinity2 * 1)  );


  }
  affinity = (TAEffect + 20.0) / 20.0;

  //0.2 base WTA, affinity is multiplier to affinity, and advantage determines which way the TA values goes
  let TAValue = 0.2 * affinity * advantage;


  return TAValue;


	//affinity (x + 20)/20 where x is the TA amount - The WTA is multplied by affinity
  //at 10 would be 30 /20 = 1.5
  //at 15 would be 1.75
  //at 20 would be  2.0

	//CA 1/2 will remove the x depending on situation, and at CA 3, the x will be reversed

	//return val;

}


export function getEffectiveDamage(heroList, attacker, defender){


    let effectiveDamage = 0.0;

    let addedEffective = effectListToConditionList(defender.addedEffective);
    let negateEffective = effectListToConditionList(defender.negateEffective);
    //console.log(addedEffective);
    //console.log(negateEffective);

    if (attacker.statusBuff.dragonEffective >= 1){ 

      let dragonCondition = [["heroInfoCheck", "weapontype", ["breath"]]]; //the condition that checks if the enemy is a dragon

      if ( (checkCondition(heroList, dragonCondition, attacker, defender) || addedEffective.findIndex(conditionMatch, dragonCondition) >= 0) && negateEffective.findIndex(conditionMatch, dragonCondition) < 0 ) { 
        effectiveDamage = 0.5;
      }

    }


    for (let effect of attacker.effectiveCondition){ //loop through effective conditions


      let condition = effect.condition;
      if ("condition" in effect){
        //check if enemy meets condition for effectiveness or the enemy has an effect that makes them pass the effectiveness condition anyways and that effectiveness condition is not being negated 
        if ( (checkCondition(heroList, condition, attacker, defender) || addedEffective.findIndex(conditionMatch, condition) >= 0) && negateEffective.findIndex(conditionMatch, condition) < 0 ) { 
          effectiveDamage = 0.5;
        }
      }


    }

  return effectiveDamage;

}

//Get the amount of spaces from first position to the second position
export function getDistance(first, second){

  if (first < 0 || second < 0){
    return -1;
  }

  let firstRC = positionToRowColumn(first);
  let secondRC = positionToRowColumn(second);

  let distance = 0;


  distance += Math.abs(firstRC[1] - secondRC[1]); //difference in columns
  distance += Math.abs(firstRC[0] - secondRC[0]); //difference in rows

  return distance;

}
export function positionToRowColumn(position){

  let row = Math.floor(position/6);
  let column = position%6;

  return [row, column];
}

export function rowColumnToPosition(rc){
    return rc[0] * 6 + rc[1];
}

  //Return list of adjacent allies 
export function getAdjacentAllies(hList, hero){
  let adjacentList = [];
  let position = hero.position;

  for (let x of hList){

    let distance = getDistance(x.position, position);

    if (x.id !== hero.id && distance >= 0 && distance <= 1 ){
      adjacentList.push(x);
    }

  }

  return adjacentList;
}

//Get heroes within a distance from a position. Does not include the hero in position
export function getDistantHeroes(hList, hero, excluded, distance){
  let distantList = [];

  let position = hero.position;

  for (let x of hList){

    let allyDistance = getDistance(x.position, position); 

    if (x.id !== hero.id && !excluded.includes(x.id) && allyDistance <= distance && allyDistance >= 0  && heroValid(x)){
      distantList.push(x);
    }

  }    
  return distantList;
}

//main function that checks if a condition has been met to grant extra effects
//heroList - the state of the board
//conditionType - keyword for the type of condition
//owner - the hero that is the owner of the conditional
//enemy - the other hero in battle with the owner.

export function checkCondition(heroList, condition, owner, enemy, turn){

  //let keyWordList = ["phase"];  //this contains the list of keywords that denote at start of a condition

  let result = true;

  for (let i = 0; i < condition.length; i++){ //outer list - all condition lists in this list must be true - and conditions

    let innerCondition = condition[i]; //loop through the lists in the lists
    let innerResult = false;


    for (let j = 0; j < innerCondition.length; j++){ //inner list - at least one condition in this list must be true - or conditions

      let keyWord = innerCondition[j];


      if (Array.isArray(keyWord)){
        console.log(keyWord);

        if (checkCondition(heroList, keyWord, owner, enemy, turn) ){ //if the condition within the innercondition is true, set to true
          innerResult = true;
        }
      //so always on effects can be mixed with conditional effects easily
      } else if (keyWord === "always"){
        innerResult = true;
        
      } else if (keyWord === "phase"){ //owner must be on the correct phase 

        if (innerCondition[j+1] === "player" && owner.initiating){ //initiating condition
          innerResult = true;
        } else if (innerCondition[j+1] === "enemy" && !owner.initiating){ //initiated on condition
          innerResult = true;
        } 
        j = j + 1; //Skip one element
      } else if (keyWord === "adjacent"){
        if (innerCondition[j+1] && getAdjacentAllies(heroList[owner.side], owner).length > 0  ){ //adjacent to at least one ally
          innerResult = true;
        } else if (!innerCondition[j+1] && getAdjacentAllies(heroList[owner.side], owner).length === 0  ){ //adjacent to no allies
          innerResult = true;
        }

        j = j + 1;

      } else if (keyWord === "enemyAdjacent"){
        if (innerCondition[j+1] && getAdjacentAllies(heroList[enemy.side], enemy).length > 0  ){ //adjacent to at least one ally
          innerResult = true;
        } else if (!innerCondition[j+1] && getAdjacentAllies(heroList[enemy.side], enemy).length === 0  ){ //adjacent to no allies
          innerResult = true;
        }

        j = j + 1;

      } else if (keyWord === "hp"){ //if hp must be at a ceretain threshold

        let hpThreshold =  Math.trunc(innerCondition[j+2] * owner.stats.hp);


        if (innerCondition[j+1] === "greater" && owner.currentHP >= hpThreshold ){ ///
          innerResult = true;
        } else if (innerCondition[j+1] === "less" && owner.currentHP <= hpThreshold ){
          innerResult = true;
        }



        j = j + 2;

      } else if (keyWord === "enemyhp"){ //if hp must be at a ceretain threshold

        let hpThreshold =  Math.trunc(innerCondition[j+2] * enemy.stats.hp);
        if (innerCondition[j+1] === "greater" && enemy.currentHP >= hpThreshold ){
          innerResult = true;
        } else if (innerCondition[j+1] === "less" && enemy.currentHP <= hpThreshold ){
          innerResult = true;
        }



        j = j + 2;

      } else if (keyWord === "heroInfoCheck"){ //needs to check value of the other  hero (e.g. weapon type, movement type etc)

        let info = heroData[enemy.heroID.value];
        
        if (innerCondition[j+2].includes(info[innerCondition[j+1]])){
          innerResult = true;
        }

        j = j + 2;

      } else if (keyWord === "distanceCheck"){


        if (getDistance(owner.position, enemy.position) <= innerCondition[j+1]){
          innerResult = true;
        }

        j = j + 1;
      } else if (keyWord === "specialType"){ //needs to check value of enemy hero (e.g. weapon type, movement type etc)

        

        if (innerCondition[j+1].includes(owner.special.type) ){
          innerResult = true;
        }

        j = j + 1;
      } else if (keyWord === "statCompare"){ //compare stat values between owner and enemy

        let statCheck = innerCondition[j+2];
        let statType = innerCondition[j+1];
        let ownerStat = 0;
        let enemyStat = 0;

        //get appropriate values to compare
        if (statCheck === "HP"){
          ownerStat = owner.currentHP;
          enemyStat = enemy.currentHP;
        } else if (statType === "visible") {
          ownerStat = owner.visibleStats[statCheck];
          enemyStat = enemy.visibleStats[statCheck];
        } else if (statType === "combat") {
          ownerStat = owner.combatStats[statCheck];
          enemyStat = enemy.combatStats[statCheck];
        }

        ownerStat+= owner.combatEffects.phantomStats[statCheck];
        enemyStat+= enemy.combatEffects.phantomStats[statCheck];

        if (innerCondition[j+3] === "greater" &&  (ownerStat - enemyStat) >= innerCondition[j+4]  ){
          innerResult = true;
        } else if (innerCondition[j+3] === "less" &&  (enemyStat - ownerStat) >= innerCondition[j+4]  ){
          innerResult = true;
        }


        j = j + 4;

      } else if (keyWord === "statCompare2"){ //compare different stat values, specifying a hero for both - statCompare can be converted to use this too
        //"effect": [{"type": "conditionalCombat", "condition": [["statCompare2", "combat", "owner", "atk", "enemy", "def", "greater", 1]], 
        let statCheck1 = innerCondition[j+3];
        let statCheck2 = innerCondition[j+5]
        let statType = innerCondition[j+1];
        let stat1 = 0;
        let stat2 = 0;


        let hero1;
        let hero2;

        if (innerCondition[j+2] === "owner"){
          hero1 = owner;
        } else if (innerCondition[j+2] === "enemy"){
          hero1 = enemy;
        }

        if (innerCondition[j+4] === "owner"){
          hero2 = owner;
        } else if (innerCondition[j+4] === "enemy"){
          hero2 = enemy;
        }

        // //get appropr  iate values to compare
        if (statCheck1 === "HP"){
          stat1 = hero1.currentHP;

        } else if (statType === "visible") {
          stat1 = hero1.visibleStats[statCheck1];

        } else if (statType === "combat") {
          stat1 = hero1.combatStats[statCheck1];
        }

        stat1+= hero1.combatEffects.phantomStats[statCheck1];

        if (statCheck2 === "HP"){
          stat2 = hero2.currentHP;
        } else if (statType === "visible") {
          stat2 = hero2.visibleStats[statCheck2];
        } else if (statType === "combat") {
          stat2 = hero2.combatStats[statCheck2];
        }

        stat2+= hero2.combatEffects.phantomStats[statCheck2];

        if (innerCondition[j+6] === "greater" &&  (stat1 - stat2) >= innerCondition[j+7]  ){
          innerResult = true;
        } else if (innerCondition[j+6] === "less" &&  (stat2 - stat1) >= innerCondition[j+7]  ){
          innerResult = true;
        }

        j = j + 7;

      } else if (keyWord === "statCheck"){ //checks if a stat passes a threshold (brammimond weapon)

        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        let statCheck = innerCondition[j+3];
        let statType = innerCondition[j+2];
        let statVal = 0;

        //get appropriate values to compare
        if (statCheck === "HP"){
          statVal = check.currentHP;
          
        } else if (statType === "visible") {
          statVal = check.visibleStats[statCheck];
          
        } else if (statType === "combat") {
          statVal = check.combatStats[statCheck];
          
        }

        if (innerCondition[j+4] === "greater" && statVal >= innerCondition[j+5]  ){
          innerResult = true;
        } else if (innerCondition[j+4] === "less" &&  statVal >= innerCondition[j+5]  ){
          innerResult = true;
        }

        j = j + 5



      } else if (keyWord === "distantAllies"){ //check if a certain number of allies within the range given range

        let distantAllies = getDistantHeroes(heroList[owner.side], owner, [], innerCondition[j+1]); //get the allies within the range

        if (innerCondition[j+2] === "greater" && distantAllies.length >= innerCondition[j+3]){
          innerResult = true;
        } else if (innerCondition[j+2] === "less" && distantAllies.length <= innerCondition[j+3]){
          innerResult = true;
        }

        j = j + 3;


      } else if (keyWord === "distantEnemies"){ //check if a certain number of enemies are within the range given range 


        //enemyside has to be calculated since the enemy might be a placeholder (which is sometimes themsel)
        let enemySide = getEnemySide(owner.side); //

        let distantEnemies = getDistantHeroes(heroList[enemySide], owner, [], innerCondition[j+1]); //get the allies within the range

        if (innerCondition[j+2] === "greater" && distantEnemies.length >= innerCondition[j+3]){ //chec for amount
          innerResult = true;
        } else if (innerCondition[j+2] === "less" && distantEnemies.length <= innerCondition[j+3]){
          innerResult = true;
        }

        j = j + 3;

      } else if (keyWord === "distantAllyCompare"){ //compare number of allies within range for owner and enemy



        let distantAllies = getDistantHeroes(heroList[owner.side], owner, [], innerCondition[j+1]).length; //get the allies within the range
        let distantEnemies = getDistantHeroes(heroList[enemy.side], enemy, [], innerCondition[j+1]).length; //get the allies within the range

        if (innerCondition[j+2] === "greater" && (distantAllies - distantEnemies) >= innerCondition[j+3]){ //chec for amount
          innerResult = true;
        } else if (innerCondition[j+2] === "less" && (distantEnemies - distantAllies) >= innerCondition[j+3] ) {
          innerResult = true;
        }

        j = j + 3;


      } else if (keyWord === "allyInfo"){ //check if there are enough allies within range are of certain types - this is separate from allyReq since it allows the all check on the distant allies

        //j+1 is range
        //j+2 is the allyInfo type
        //j+3 is the acceptable allyInfo values
        //j+4 minimum needed
        //j+5 greater/less 

        let distantAllies = getDistantHeroes(heroList[owner.side], owner, [], innerCondition[j+1]); //get the allies within the range

        let validAlliesCount = 0;

        for (let x of distantAllies){
          let info = heroData[x.heroID.value];



          if (innerCondition[j+3].includes(info[innerCondition[j+2]])){
            validAlliesCount++;

          }


        }


        if (innerCondition[j+4] === "all"){ //if all, then j+5 will be a blank placeholder value
          if (validAlliesCount === distantAllies.length){ //if all allies in range meet the condition
            innerResult = true;
          }

        } else if (validAlliesCount >= innerCondition[j+4] && innerCondition[j+5] === "greater"){ //sufficient allies that are in range meet the condition

          innerResult = true;
        } else if (validAlliesCount <= innerCondition[j+4] && innerCondition[j+5] === "less"){ //sufficient allies that are in range meet the condition

          innerResult = true;
        } 

        j = j + 5;

      } else if (keyWord === "teamInfo"){ //checks for info on team. Different from allyreq as it includes the owner too

        let validAlliesCount = 0;

        for (let ally of heroList[owner.side]){
          let info = heroData[ally.heroID.value];


          if (innerCondition[j+2].includes(info[innerCondition[j+1]])){
            validAlliesCount++;
          }

        } //end for loop team

        if (validAlliesCount >= innerCondition[j+3] && innerCondition[j+4] === "greater"){ //sufficient allies  meet the condition

          innerResult = true;
        } else if (validAlliesCount <= innerCondition[j+3] && innerCondition[j+4] === "less"){ //sufficient allies  meet the condition

          innerResult = true;
        } 

        j = j + 4;

      } else if (keyWord === "turn"){ //check turn

        let factor = innerCondition[j+1];

        let mod = innerCondition[j+2];

        let check = (turn - 1) + mod;

        if (factor === 0 && turn === mod){ //no factor, asking for a specific turn
          innerResult = true;
        } else if ( (check) % factor === 0){ //check if nth turn has been reached
          innerResult = true;
        }


        j = j + 2;

      } else if (keyWord === "turnRange"){

        //j+1 is the lower bound
        //j+2 is the upper bound
        //bounds are inclusive
        //j+3 asks if you want to be within the range or out of range

        if (turn >= innerCondition[j+1] && turn <= innerCondition[j+2] && innerCondition[j+3]){
          innerResult = true;
        } else if ( (turn < innerCondition[j+1] || turn > innerCondition[j+2]) && !innerCondition[j+3]){
          innerResult = true;
        }

        j = j + 3;


      } else if (keyWord === "statPenalty"){ //only for harsh command basically

        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        let type = innerCondition[j+2];

        for (let s in check.debuff){
          if (check.debuff[s] > 0 && (check.combatEffects.penaltyNeutralize[s] < 1 || type === "battleStart") ){ //check if that stat is debuffed and if that debuff is not neutralized or if check is at battleStart (so before neutralizers come in)
            innerResult = true;
          }

          //check if buffs are reversed to penalties through panic.
          if ( check.statusEffect.panic > 0 && check.buff[s] > 0 && check.statusBuff.nullPanic <=0 && (check.combatEffects.penaltyNeutralize[s] < 1 || type === "battleStart")  ){ 
            innerResult = true;
          }

        }

        j = j + 2;

      } else if (keyWord === "penalty"){
        
        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        let type = innerCondition[j+2];
        //This value will be either
        //battleStart - before combat effects activate so neutralizers are not used for the check
        //combat - during combat so needs to check for neutralizers

        for (let s in check.debuff){

          if (check.debuff[s] > 0 && (check.combatEffects.penaltyNeutralize[s] < 1 || type === "battleStart") ){ //check if that stat is debuffed and if that debuff is not neutralized or if check is at battleStart (so before neutralizers come in)
            innerResult = true;
          }

          //check if buffs are reversed to penalties through panic. With panic status, this will return true anyways but this is just here for completeness
          //null panic will prevent stat penalties on the unit but the panic status will still be active. The check here is also just here for completeness
          if (check.statusEffect.panic > 0 && check.buff[s] > 0 && check.statusBuff.nullPanic < 1 && (check.combatEffects.penaltyNeutralize[s] < 1 || type === "battleStart")  ){ 
            innerResult = true;
          }

        }

        if (Object.keys(check.statusEffect).filter(m =>  check.statusEffect[m] >= 1).length >= 1  ){//if any statusEffect on check
          innerResult = true;
        }

        j = j + 2;


      } else if (keyWord === "statBonus"){

        let check = {};
        let other;
        if (innerCondition[j+1] === "player"){
          check = owner;
          other = enemy;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
          other = owner;
        }

        let type = innerCondition[j+2];

        let statBonusCheck = false; //check to see if a stat bonus is active

        for (let s in check.buff){

          if (check.buff[s] > 0 && (check.statusEffect.panic < 1 || check.statusBuff.nullPanic > 0) &&  (other.combatEffects.buffNeutralize[s] < 1 || type === "battleStart") ){ //check if stat is buffed, not panicked and  not neutralized (if battle start, then neutralize is not counted)
            statBonusCheck = true;
          }


        }


        if (statBonusCheck  && innerCondition[j+3]){
          innerResult = true;
        } else if (!statBonusCheck  && !innerCondition[j+3]){
          innerResult = true;
        }


        j = j + 3;

      } else if (keyWord === "bonus"){

        let check = {};
        let other;
        if (innerCondition[j+1] === "player"){
          check = owner;
          other = enemy;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
          other = owner;
        }

        let type = innerCondition[j+2];

        for (let s in check.buff){

          if (check.buff[s] > 0 && (check.statusEffect.panic < 1 || check.statusBuff.nullPanic > 0) &&  (other.combatEffects.buffNeutralize[s] < 1 || type === "battleStart") ){ //check if stat is buffed, not panicked and  not neutralized (if battle start, then neutralize is not counted)
            innerResult = true;
          }


        }

        if (Object.keys(check.statusBuff).filter(m =>  check.statusBuff[m] >= 1).length >= 1  ){ //check for status buffs
          innerResult = true;
        }


        j = j + 2;
      } else if (keyWord === "combatCount"){ //

        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        if (innerCondition[j+2] === "greater" && check.combatCount >= innerCondition[j+3] ){
          innerResult = true;
        } else if (innerCondition[j+2] === "less" && check.combatCount <= innerCondition[j+3]){
          innerResult = true;
        }

        j = j + 3;
      } else if (keyWord === "cardinal"){

        if (innerCondition[j+1] && checkCardinal(owner, enemy)){ //condition requires cardinal and they are cardinal
          innerResult = true;
        } else if (!innerCondition[j+1] && !checkCardinal(owner, enemy)){ //condition requires not cardinal and they are not cardinal
          innerResult = true
        }

        j = j + 1;

      } else if (keyWord === "cardinalRC"){

        if (innerCondition[j+1] && checkCardinalRowColumn(owner, enemy, innerCondition[j+2], innerCondition[j+3])){ //condition requires cardinal and they are cardinal
          innerResult = true;
        } else if (!innerCondition[j+1] && !checkCardinalRowColumn(owner, enemy, innerCondition[j+2], innerCondition[j+3])){ //condition requires not cardinal and they are not cardinal
          innerResult = true
        }

        j = j + 3;

      } else if (keyWord === "tactic"){

        if (innerCondition[j+1] && checkTactic(enemy, heroList)){ 
          innerResult = true;
        } else if (!innerCondition[j+1] && !checkTactic(enemy, heroList)){ 
          innerResult = true
        }



        j = j + 1;
      } else if (keyWord === "specialReady"){


        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        //check if their special is charged
        //Note - if an aoe special is used, it is reset and at the start of combat will be considered not ready (tested with duo alfonse)
        if (innerCondition[j+2] && check.special.charge === 0){ 
          innerResult = true;
        } else if (!innerCondition[j+2] && check.special.charge !== 0){ 
          innerResult = true
        }

        j = j + 2;
      } else if (keyWord === "specialMax"){

        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        //check if their special is charged
        if (innerCondition[j+2] && check.special.charge === check.special.cd){ 
          innerResult = true;
        } else if (!innerCondition[j+2] && check.special.charge !== check.special.cd){ 
          innerResult = true
        }

        j = j + 2;
      } else if (keyWord === "followUp"){


        let check = {};
        let other;
        //determine who's followup to check
        if (innerCondition[j+1] === "player"){
          check = owner;
          other = enemy;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
          other = owner;
        }

        let checkAttackCount = 0;


        //Get check's attack count. the getAttackCount check depends on initiation
        if (check.initiating){
          checkAttackCount = getAttackCount(check, other)[0];
        } else {
          checkAttackCount = getAttackCount(other, check)[1];
        }

        let followUpReq = 2; //attacks required to be a followup by default 
        if(check.combatEffects.brave > 0){
          followUpReq = 4; //if brave effect is active, then 4 attacks are required.
        }


        if (checkAttackCount >= followUpReq && innerCondition[j+2]){ //checking for if followup is possible
          innerResult = true;
        } else if (checkAttackCount < followUpReq && !innerCondition[j+2]){ //checking if followup is not possible
          innerResult = true;
        }

        


        j = j + 2;
      } else if (keyWord === "allyReq"){ //general allyReq that allows for checking allies against a condition
        //j + 1 is the team
        // j + 2 is the condition
        // 
        //j+3 minimum needed - can also be all if all allies are requied
        //j+4 greater/less 
        let passCount = 0;

        let side = 0;

        if (innerCondition[j+1] === "owner"){
          side = owner.side;
        } else if (innerCondition[j+1] === "enemy"){
          side = getEnemySide(owner.side);
        }


        let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)

        let teamList = heroList[side];

        for (let x in teamList){
          if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves, self buff req is done separately
            teamListValid.push(teamList[x]);
          }
        } 
        let passedHeroList = [];


        passedHeroList = heroReqCheck(owner, teamListValid, innerCondition[j+2], heroList, turn) ; //Get the list of allies that pass the req che
        

        passCount = passedHeroList.length;
        
        if (innerCondition[j+3] === "all"){
          if (passCount === teamListValid.length){ //if all allies meet the condition   - not used yet
            innerResult = true;
          }

        } else if (passCount >= innerCondition[j+3] && innerCondition[j+4] === "greater"){ //sufficient allies that are in range meet the condition

          innerResult = true;
        } else if (passCount <= innerCondition[j+3] && innerCondition[j+4] === "less"){ //sufficient allies that are in range meet the condition

          innerResult = true;
        } 

        j = j + 4;
      } else if (keyWord === "heroEnd"){ //check if hero has ended their turn - used with allyReq above


        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }


        if (check.end && innerCondition[j+2]){ //if check unit has ended their turn and condition requires them to end their turn
          innerResult = true;
        } else if (!check.end && !innerCondition[j+2]){ //if check unit has not ended their turn and condition requires them to not have ended their turn
          innerResult = true;
        }
        j = j + 2;

      } else if (keyWord === "statusCheck"){ //check status on owner 

        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        //j+2 is statusBuff or statusEffect
        //j+3 is the status to check

        if (check[innerCondition[j+2]][innerCondition[j+3]] > 0){
          innerResult = true;
        }


        j = j + 3;


      } else if (keyWord === "supportAlly"){ //checks if the other ally is a support ally - does not check if the owner is the support ally of the other ally

        let support = owner.allySupport;
        let allyHero = enemy.heroID;


        let allySupport = enemy.allySupport;
        let ownerHero = owner.heroID;

        if (support.value === allyHero.value && support.label === allyHero.label && 
          allySupport.value === ownerHero.value && allySupport.label === ownerHero.label && innerCondition[j+1]){ //if they are the support ally

          innerResult = true;
        } else if ( (support.value !== allyHero.value || support.label !== allyHero.label || allySupport.value !== ownerHero.value || allySupport.label !== ownerHero.label) && !innerCondition[j+1]){ //if not support ally and asking for not support ally
          innerResult = true;
        }

        j = j + 1;

      } else if (keyWord === "supportPairReq"){ //a certain number of support pairs must meet the requirement


        let passCount = 0;


        let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)

        let teamList = heroList[owner.side]; //get teamlist of owner

        for (let x in teamList){
          if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves, 
            teamListValid.push(teamList[x]);
          }
        } 
        let passedHeroList = [];


        passedHeroList = heroReqCheck(owner, teamListValid, innerCondition[j+1], heroList, turn) ; //Get the list of allies that pass the req che
        
        let supportPartnerList = []; //list of heroes with a support partner
        let supportNameList = []; //list of support partners




        for (let x of passedHeroList){ //loop through heros matching the req and add them to the support partner lsit/name list

          if (x.allySupport.value !== 0){ //only add to list if they have a support partner
            supportPartnerList.push(x);

            if (!supportNameList.includes(x.heroID.value) ){ //add themselves
              supportNameList.push(x.heroID.value);
            }
          }

        }



        for (let x of supportPartnerList){ //loop through heroes with a support partner
          if (supportNameList.includes(x.allySupport.value) ){ //if their support partner is in the list, then a pair is counted
            passCount++;
          }

        }

        
        if (passCount > 0 && innerCondition[j+2]){ //asking for a pair and at least one pair passes the req

          innerResult = true;
        } else if (passCount <= 0 && !innerCondition[j+2]){ //asking for no pairs and no pairs pass the req

          innerResult = true;
        } 


        j = j + 2;

      } else if (keyWord === "rangeCheck"){

        //j + 1 = range to match
        // j + 2 = if we need range to match or not
        let rangeCheck = enemy.range;

        if (rangeCheck === 0){ //if no weapon, then we need to get range from weapontype

          let info = heroData[enemy.heroID.value];
          
          if (["sword", "lance", "axe", "breath", "beast"].includes(info.weapontype)){
            rangeCheck = 1;
          } else if (["redtome", "bluetome", "greentome", "colorlesstome", "bow", "dagger", "staff"].includes(info.weapontype)){
            rangeCheck = 2;
          }

        }


        if (rangeCheck === innerCondition[j+1] && innerCondition[j+2]){
          innerResult = true;
        } else if (rangeCheck !== innerCondition[j+1] && !innerCondition[j+2]){
          innerResult = true;
        }

        j = j + 2;

      } else if (keyWord === "effectiveCheck"){

        //always check enemy
        // j + 1 //check effective type
        // j + 2 true/false

        let effectiveCheck = false; //assume not effectiveness by default

        //if enemy has dragonEffective status, then do a condition match against that separately
        if (enemy.statusBuff.dragonEffective >= 1){ 
          if (conditionMatch([["heroInfoCheck", "weapontype", ["breath"]]], innerCondition[j+1] )){
            effectiveCheck = true;
          }


        }

        for (let effect of enemy.effectiveCondition){
          if ("condition" in effect){
            if (conditionMatch(effect.condition, innerCondition[j+1])){ //the condition has been found
              effectiveCheck = true;
            } 

          } //end condition


        }

        //now know if they have the effectiveness

        if (effectiveCheck && innerCondition[j+2]){ //has efectiveness
          innerResult = true;
        } else if (!effectiveCheck && !innerCondition[j+2]){ //does not have the effectivenes
          innerResult = true;
        }

        j = j + 2;
      } else if (keyWord === "dragonflower"){


        if (innerCondition[j+1] === "greater" && owner.dragonflower >= innerCondition[j+2] ){ ///
          innerResult = true;
        } else if (innerCondition[j+1] === "less" && owner.dragonflower <= innerCondition[j+2] ){
          innerResult = true;
        }

        j = j + 2;


      } else if (keyWord === "transformed"){


        //always check self
        //  j + 1 true/ false
        if (innerCondition[j+1] && owner.transformed  ){ //transformed and checking for transformed
          innerResult = true;
        } else if (!innerCondition[j+1] && !owner.transformed  ){ // not transformed and checking for not transformed
          innerResult = true;
        }
        j = j + 1;  

      } else if (keyWord === "bonusPenaltyTotal"){

        //adds up total buffs on owner, and total debuffs on enemy
        let total = 0;


        if (owner.statusEffect.panic < 1 || owner.statusEffect.nullPanic > 0){ //if check for panic to see if buffs are not debuffs - or null panic active

          for (let s in enemy.combatEffects.buffNeutralize){ //loop through stats
            if (enemy.combatEffects.buffNeutralize[s] <= 0){ //if enemy is not neutralizing buffs, add to the total
              total+= owner.buff[s];
            }
          }
        }

        for (let s in enemy.combatEffects.penaltyNeutralize){ //loop through stats
          if (enemy.combatEffects.penaltyNeutralize[s] <= 0){ //if the enemy is not neutralizing penalties add it to the total value
            total+= enemy.debuff[s];

            if (owner.statusEffect.panic > 0 && owner.statusEffect.nullPanic < 1){ //if panicked (and panic not nulled) then also add the buff values
              total+= enemy.buff[s];
            }

          }
        }



        if (innerCondition[j+1] === "greater" && total >= innerCondition[j+2]){
          innerResult = true;
        } else if (innerCondition[j+1] === "less" && total <= innerCondition[j+2]){
          innerResult = true;
        }

        j = j + 2;
      } else if (keyWord === "sideCheck"){ //check which side the unit is on

        //"1" is player's control
        //"2" is the enemy's control

        if (owner.side === innerCondition[j+1]){
          innerResult = true;
        }

        j = j + 1;
      } else if (keyWord === "wta"){
       //check if wta is giving
       // 1 - an advantage
       // 0 - nothing granted
       // -1 - a disadvantage

       let wta = getWeaponTriangleAdvantage(owner, enemy); //get the 

       if (innerCondition[j+1] === wta){ //inner condition is the wta value it wants
        innerResult = true;
       } else if (Math.abs(innerCondition[j+1]) === 1 && wta === "doubleAdvantage"){
        //There is a theoretical situation where 2 colorless units have the raven effect in which the unit has advantage and disadvantage at the same time (doubleAdvantage). This would satisfy the advantage/disadvantage values here
        innerResult = true;
       }


        j = j + 1;
      } else if (keyWord === "bonusTotalCheck"){ //checks if a bonus total on someone passes a check (this specifically does not check for neutralizations)

        //adds up total buffs on either the owner, enemy
        let total = 0;

        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        if (check.statusEffect.panic < 1 || check.statusEffect.nullPanic > 0){ //if check for panic to see if buffs are not debuffs - or null panic active

          for (let s in check.buff){ //loop through stats
            
            total+= check.buff[s];
            
          }
        }

        if (innerCondition[j+2] === "greater" && total >= innerCondition[j+3]){
          innerResult = true;
        } else if (innerCondition[j+2] === "less" && total <= innerCondition[j+3]){
          innerResult = true;
        }

        j = j + 3;
      } else if (keyWord === "teamBonusTotalCheck"){ //a check for bonusTotals on team (excluding owner) (only for genesis falchion currently) - Also allows for doing top X bonuses too
        //["bonusTotalCheck", "enemy", "greater", 10]
        //["teamBonusTotalCheck", "player" "greater", 10, 999]
        let side = "0";

        if (innerCondition[j+1] === "owner"){
          side = owner.side;
        } else if (innerCondition[j+1] === "enemy"){
          side = getEnemySide(owner.side);
        }


        let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)

        let teamList = heroList[side];

        for (let x in teamList){
          if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves, self buff req is done separately
            teamListValid.push(teamList[x]);
          }
        } 

        let bonusTotal = 0;
        let bonusTotalList = [];

        console.log(teamListValid);
        for (let x of teamListValid){ //loop through valid allies
          let bonusValue = 0;
          if (x.statusEffect.panic < 1 || x.statusEffect.nullPanic > 0){ //if check for panic to see if buffs are not debuffs - or null panic active
            for (let s in x.buff){ //loop through stats
              bonusValue+= x.buff[s];
            }
          }

          console.log(bonusTotalList.length);
          console.log(innerCondition[j+4]);
          console.log(bonusValue);

          if (bonusTotalList.length < innerCondition[j+4]){ //haven't reached the top x amount of units, add it to the total
            bonusTotal+= bonusValue;
            bonusTotalList.push(bonusValue);
          } else { // top x units reached, evaluate if the total is in the top x
            bonusTotalList.sort(function(a, b){return a-b}); //sort from lowest to greatest
            if (bonusTotalList[0] < bonusValue){
              bonusTotal = bonusTotal - bonusTotalList[0] + bonusValue; //remove previous lowest value and add new value 
              bonusTotalList[0] = bonusValue; //replace lowest value with new value
            }
          } //end fi


        }
        console.log(bonusTotal);
        console.log(bonusTotalList);
        
        if (bonusTotal >= innerCondition[j+3] && innerCondition[j+2] === "greater"){ //sufficient allies that are in range meet the condition

          innerResult = true;
        } else if (bonusTotal <= innerCondition[j+3] && innerCondition[j+2] === "less"){ //sufficient allies that are in range meet the condition

          innerResult = true;
        } 

        j = j + 4;
      }

    } //end for j

    if (!innerResult){ //if the innerResult false, then result becomes false
      result = false;
    }


  } //end for i



  return result;
} //end CheckCondition

export function heroReqCheck(owner, teamList, heroReq, heroList, turn){

  let filteredList = [];//[...allyList]; //copy of allyList


  filteredList = teamList.filter(checkConditionHero(owner, heroReq, heroList, turn) ); //filter out 

  console.log(filteredList);
  return filteredList;
}

export function calculateVariableEffect(heroList, variableEffect, owner, enemy, turn){

  if (variableEffect.key === "allyReq"){
    //let distantAllies = Math.min(getDistantHeroes(heroList[owner.side], owner, [] , variableEffect.distance).length, variableEffect.maxAllies);

    let distantAllies = 0;


    let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)

    let teamList = heroList[owner.side];

    for (let x in teamList){
      if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves, self buff req is done separately
        teamListValid.push(teamList[x]);
      }
    } 
    let passedHeroList = [];

    if ("allyReq" in variableEffect){
      passedHeroList = heroReqCheck(owner, teamListValid, variableEffect.allyReq, heroList, turn) ; //Get the list of allies that pass the req che

    } //end ally req

    distantAllies = Math.min(passedHeroList.length, variableEffect.maxAllies);


    let buff = (variableEffect.multiplier * distantAllies + variableEffect.constant);


    if (distantAllies < variableEffect.minAllies){
      buff = 0;
    }

    let statBuff = {};
    for (let x of variableEffect.stats){
      statBuff[x] = buff;
    }

    return {"statBuff": statBuff}; //return as combat effect object
  } else if (variableEffect.key === "session"){

    let buffValue = 0;

    if (variableEffect.phase === "enemy" && !owner.initiating){

      let enemies = heroList[enemy.side];
      let enemiesActed = 0;

      for (let y of enemies){
        if (y.end){
          enemiesActed++;
        }

      } 

      buffValue = Math.max( variableEffect.min, variableEffect.constant - (variableEffect.multiplier * enemiesActed) );
    } else if (variableEffect.phase === "player" && owner.initiating){

      let allies = heroList[owner.side];
      let alliesActed = 0;

      for (let y of allies){
        if (y.end){
          alliesActed++;
        }

      } 

      buffValue = Math.min( variableEffect.max, variableEffect.constant + (variableEffect.multiplier * alliesActed) );


    }

    let statBuff = {};
    for (let x of variableEffect.stats){
      statBuff[x] = buffValue;
    }
    return {"statBuff": statBuff}; //return as combat effect object

  } else if (variableEffect.key === "bonusPenaltyBuffs"){ //buffs that depend on bonus or penalties on a unit

    let buffValue = 0;
    let reference;
    let other;

    let statList = ["atk", "spd", "def", "res"];

    if ("statList" in variableEffect){
      statList = variableEffect.statList;
    }

    if (variableEffect.reference === "owner" || variableEffect.reference === "both"){
      reference = owner;
      other = enemy;
    } else if (variableEffect.reference === "enemy"){
      reference = enemy;
      other = owner;
    } else if (variableEffect.reference === "maxAlly"){//specifically for order's sentence
      reference = new heroStruct(0);
      let max = 0;

      //loop through allies
      for (let hero of heroList[owner.side]){

        if ("allyReq" in variableEffect && !checkCondition(heroList, variableEffect.allyReq, owner, hero) ){
          continue; //if they don't meet ally req, skip
        }

        if (owner.id === hero.id || !heroValid(hero) ){
          continue; //cannot target themselves
        }

        let sum = 0;

        //get the sum of their buffs
        if (hero.statusEffect.panic < 1 || hero.statusEffect.nullPanic > 0){ //if check for panic to see if buffs are not debuffs - or null panic active

          for (let s of statList){ //loop through buffs and add them up
            sum+= hero.buff[s];
          }
        }

        //check if they have a higher sum of buffs then previous max
        if (sum > max){

          if (heroValid(hero)){
            reference = hero;
            max = sum; //set new max
          }

        } 


      } //loop through team

      other = new heroStruct(0); //empty hero that won't affect the calculation
    } //end max ally

    if (variableEffect.subtype === "buff"){

      if (reference.statusEffect.panic < 1 || reference.statusEffect.nullPanic > 0){ //if check for panic to see if buffs are not debuffs - or null panic active

        for (let s of statList){ //loop through stats
          if (other.combatEffects.buffNeutralize[s] <= 0){ //if other is not neutralizing the stat, add it to buff value
            buffValue+= reference.buff[s];
          }
        }


      }

      if (variableEffect.reference === "both"){ //if referencing both then apply get value from the other hero as well
        if (other.statusEffect.panic < 1 || other.statusEffect.nullPanic > 0){ //if check for panic to see if buffs are not debuffs - or null panic active

          for (let s of statList){ //loop through stats
            if (reference.combatEffects.buffNeutralize[s] <= 0){ //if other is not neutralizing the stat, add it to buff value
              buffValue+= other.buff[s];
            }
          }


        }


      } //end adding buff value from other hero as well


    } else if(variableEffect.subtype === "debuff"){

      for (let s of statList){ //loop through stats
        if (reference.combatEffects.penaltyNeutralize[s] <= 0){ //if the reference is not neutralizing penalties add it to the buff value
          buffValue+= reference.debuff[s];

          if (reference.statusEffect.panic > 0 && reference.statusEffect.nullPanic < 1){ //if panicked (and panic not nulled) then also add the buff values
            buffValue+= reference.buff[s];
          }

        } //check reference

        if (variableEffect.reference === "both"){
          if (other.combatEffects.penaltyNeutralize[s] <= 0){ //if the reference is not neutralizing penalties add it to the buff value
            buffValue+= other.debuff[s];

            if (other.statusEffect.panic > 0 && other.statusEffect.nullPanic < 1){ //if panicked (and panic not nulled) then also add the buff values
              buffValue+= other.buff[s];
            }

          }


        } //check other if both


      }

    } 

    buffValue = Math.trunc(buffValue * variableEffect.multiplier);

    if ("max" in variableEffect){ //if there is a max to the buff,
      buffValue = Math.min(variableEffect.max, buffValue);
    }

    let statBuff = {};
    for (let x of variableEffect.stats){
      statBuff[x] = buffValue;
    }
    return {"statBuff": statBuff}; //return as combat effect object



 
  } else if (variableEffect.key === "heroStats"){

    let statCheck = variableEffect.stat;
    let factor = variableEffect.factor;

    let reference;

    if (variableEffect.reference === "owner"){
      reference = owner;

    } else if (variableEffect.reference === "enemy"){
      reference = enemy;

    } 

    let value = 0;

    if (variableEffect.stattype === "visible"){
      value = Math.trunc(reference.visibleStats[statCheck] * factor);
    } else if (variableEffect.stattype === "combat"){
      value = Math.trunc(reference.combatStats[statCheck] * factor);
    }


    let statValues = {};
    for (let x of variableEffect.stats){
      statValues[x] = value;
    }

    if (variableEffect.subtype === "statBuff"){
      return {"statBuff": statValues}; //return as combat effect object
    } else if (variableEffect.subtype === "lull"){
      return {"lull": statValues}; //return as combat effect object
    }







  } else if (variableEffect.key === "statCopy"){ 
    let statValues = {};

    let passedHeroList = [];
    //get list of heroes that pass the allyReq
    for (let hero of heroList[owner.side]){

      if ("allyReq" in variableEffect && !checkCondition(heroList, variableEffect.allyReq, owner, hero) ){
        continue; //if they don't meet ally req, skip
      }

      if (owner.id === hero.id || !heroValid(hero) ){
        continue; //cannot target themselves
      }
      passedHeroList.push(hero);


    } //loop through team


    for (let stat of variableEffect.stats){
      let statVal = 0;

      for (let hero of passedHeroList){

        let currentVal = hero.visibleStats[stat];

        if (currentVal > statVal){

          statVal = currentVal; //set new max
        }

      } // looop through heroes

      statValues[stat] = statVal - owner.visibleStats[stat]; //the buff (or debuff if lower than the owner's stat) will be the difference between the two

    } //loop through stats

    return {"statBuff": statValues};
  } else if (variableEffect.key === "bonusCopy"){ 
    let statValues = {};

    let passedHeroList = [];
    //get list of heroes that pass the allyReq
    for (let hero of heroList[owner.side]){

      if ("allyReq" in variableEffect && !checkCondition(heroList, variableEffect.allyReq, owner, hero) ){
        continue; //if they don't meet ally req, skip
      }

      if (owner.id === hero.id || !heroValid(hero) ){
        continue; //cannot target themselves
      }
      passedHeroList.push(hero);


    } //loop through team


    for (let stat of variableEffect.stats){
      let statVal = 0;

      for (let hero of passedHeroList){
        if (hero.statusEffect.panic < 1 || hero.statusEffect.nullPanic > 0){
          let currentVal = hero.buff[stat];

          if (currentVal > statVal){

            statVal = currentVal; //set new max
          }
        }
      } // looop through heroes

      statValues[stat] = statVal; //statBuff will copy the buff value

    } //loop through stats

    return {"statBuff": statValues};
  } //end bonusCopy


}

export function calculateVariableCombat(heroList, variableEffect, owner, enemy, turn){

  
  //combatEffect contains a list of combat effects that will be granted
  //The value of the combat effect is then calculated depending on the key


  //bonus damage uses stats and factor
  if (variableEffect.key === "bonusDamage"){
    let unit = variableEffect.unit;
    let value = 0;


    if (variableEffect.stat === "specialCD"){ //not currently used but implemented because I thought surge sparrow added a heal based on damage dealt rather than based on max hp
      value = Math.trunc( (owner.special.cd * variableEffect.factor + variableEffect.constant) * 100.0 ); //uses the cd, if there is no special (which means below 0 cd) then set to 0
      value = value / 100.0;
      if (owner.special.cd < 0){
        value = 0; //set to 0 if there is no special
      }

    } else if (variableEffect.stat === "flat") {
      value = variableEffect.factor;
    } else if (unit === "owner"){
      value = Math.trunc(owner.combatStats[variableEffect.stat] * variableEffect.factor);  
    } else if (unit === "enemy"){
      value = Math.trunc(enemy.combatStats[variableEffect.stat] * variableEffect.factor); 
    } else if (unit === "difference"){
      value = Math.trunc(owner.combatStats[variableEffect.stat] - enemy.combatStats[variableEffect.stat] * variableEffect.factor); //not used yet, will probably be used for speed diff weapons
    }

    if ("max" in variableEffect){
      value = Math.min(variableEffect.max, value); //variable effect is capped
    }


    let combatEffectList = {};
    for (let x of variableEffect.combatEffects){
      combatEffectList[x] = value;
    }
    console.log(combatEffectList);
    return combatEffectList;

  } else if (variableEffect.key === "statDifferenceEffect"){

    let statCheck = variableEffect.stat;
    let enemyStatCheck = variableEffect.stat;
    let factor = variableEffect.factor;
    let max = variableEffect.max;

    if ("enemyStat" in variableEffect){
      enemyStatCheck = variableEffect.enemyStat;
    }



    let visibleDifference = owner.visibleStats[statCheck] - enemy.visibleStats[enemyStatCheck];
    let combatDifference = owner.combatStats[statCheck] - enemy.combatStats[enemyStatCheck];

    let visibleValue = Math.trunc(visibleDifference * factor);
    let combatValue = Math.trunc(combatDifference * factor);



    visibleValue = Math.min(max, visibleValue );

    combatValue = Math.min(max, combatValue );

    let combatEffectList = {};
    for (let x of variableEffect.combatEffects){
      
      if (x.includes("Reduction")){ //damage reduction effects 

        //prebattle reductions use visible, every other uses combat values
        if (x === "preBattleReduction" && visibleValue > 0){
          combatEffectList[x] = 1 - (visibleValue / 100.0 );
        } else if (combatValue > 0) {
          combatEffectList[x] = 1 - (combatValue / 100.0 );
        }

      } else if (visibleValue > 0 && "stats" in variableEffect){ //if it has a stats key, then make a combat object for it (for stuff like lulls) - visible value has to be > 0 because it will have no effect otherwise

          let statList = variableEffect.stats;
          combatEffectList[x] = {};


          for (let m of statList){
            combatEffectList[x][m]= visibleValue;
          }

      } else if (combatValue > 0) { //just add to effect list using combat value
        combatEffectList[x] = combatValue;
      }

    } //end for

    return combatEffectList;
  } else if (variableEffect.key === "allyReq"){


    let allyCount = 0;


    let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)

    let teamList = heroList[owner.side];

    for (let x in teamList){
      if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves, self buff req is done separately
        teamListValid.push(teamList[x]);
      }
    } 
    let passedHeroList = [];

    if ("allyReq" in variableEffect){
      passedHeroList = heroReqCheck(owner, teamListValid, variableEffect.allyReq, heroList, turn) ; //Get the list of allies that pass the req che

    } //end ally req

    allyCount = Math.min(passedHeroList.length, variableEffect.maxAllies);


    let value = (variableEffect.multiplier * allyCount + variableEffect.constant);


    if (allyCount < variableEffect.minAllies){
      value = 0;
    }


    let combatEffectList = {};
    for (let x of variableEffect.combatEffects){
      
      if (x.includes("Reduction")){ //damage reduction effects 


        combatEffectList[x] = 1 - (value / 100.0 );


      } else if (value > 0 && "stats" in variableEffect){ //if it has a stats key, then make a combat object for it (for stuff like lulls) - visible value has to be > 0 because it will have no effect otherwise

          let statList = variableEffect.stats;
          combatEffectList[x] = {};


          for (let m of statList){
            combatEffectList[x][m]= value;
          }

      } else { //just add to effect list using combat value
        combatEffectList[x] = value;
      }

    } //end for
    return combatEffectList;


  } 

}

//this allows us to give effects with variable values easier
export function getVariableValue(heroList, effect, owner, turn){


  //this gives a value depending on the amount of allies with hero info within the teamInfoList
  if (effect.key === "teamInfo"){

    let validAlliesCount = 0;

    for (let ally of heroList[owner.side]){
      let info = heroData[ally.heroID.value];



      if (effect["teamInfoList"].includes(info[effect.type] )){
        validAlliesCount++;
      }

    } //end for loop team

    return validAlliesCount;

  } else if (effect.key === "effectReq"){


    let side = "0";

    if (effect.side === "owner"){
      side = owner.side;
    } else if (effect.side === "other"){
      side = getEnemySide(owner.side);
    }

    let teamListValid = []; //copy of list that only has valid heroes (not dead and on the board)

    let teamList = heroList[side];

    for (let x in teamList){
      if (heroValid(teamList[x]) && teamList[x].id !== owner.id ){ //exclude themselves
        teamListValid.push(teamList[x]);
      }
    } 


    let passList = heroReqCheck(owner, teamListValid, effect.effectReq, heroList, turn) ;

    return Math.floor(effect.factor * passList.length);



  } else if (effect.key === "specialCD"){

    let value = Math.trunc( (owner.special.cd * effect.factor + effect.constant) * 100.0 ); //uses the cd, if there is no special (which means below 0 cd) then set to 0
    value = value / 100.0;
    if (owner.special.cd < 0){
      value = 0; //set to 0 if there is no special
    }
    return value;

  }



  return 0; 


}

//This function is for combat effects where the condition check occurs at the time the special activates (e.g. wrath)
export function getConditionalSpecial(owner, enemy, heroList){

  //Conditionals
  for (let x of owner.conditionalSpecial){

    if (x !== null && checkCondition(heroList, x.condition, owner, enemy)){ //if condition is true, then provide the rest of the effects

      for (let y in x){ //loop through 
        if (y !== "condition" && y !== "type"){ //everything else should be combat effects
          owner.combatEffects[y]+= x[y]; //conditional specials should give effects changing specialTrigger effects
        }


      } //end loop through gained effects



    } //end if condition true

  } //end for 


}

export function removeConditionalSpecial(owner, enemy, heroList){

  //Conditionals
  for (let x of owner.conditionalSpecial){

    //this check should be done before any changes to either hero, such that it passes the same conditons as when the getConditionalSpecial function is used
    if (x !== null && checkCondition(heroList, x.condition, owner, enemy)){ 

      for (let y in x){ //loop through 
        if (y !== "condition" && y !== "type"){ //everything else should be combat effects
          owner.combatEffects[y]-= x[y]; //remove the effects
        }


      } //end loop through gained effects



    } //end if condition true

  } //end for 


}

export function checkValidMovement(owner, other, otherAlt, participantIDs, board){


    //Invalid position
    if (other[0] === -1 || other[1] === -1){
      return false;
    }

    //otherAlt needs to be checked for trepassable terrain (e.g. not a wall) and if it is an actual space (not [-1, -1])

    if (owner[1] > 5 || owner[1] < 0 || other[1] > 5 || other[1] < 0 //column out of bounds
      || owner[0] > 7 || owner[0] < 0 || other[0] > 7 || other[0] < 0) { //row out of bounds


      return false; 

    }
    //convert to positions to check if board space is available
    let newOwnerPosition = rowColumnToPosition(owner);
    let newOtherPosition = rowColumnToPosition(other);

    if (board[newOwnerPosition] !== null &&  !participantIDs.includes(board[newOwnerPosition].id) ){ //new assistee position is occupied by other hero
      return false;

    }

    if (board[newOtherPosition] !== null &&  !participantIDs.includes(board[newOtherPosition].id) ){ //new assister position is occupied by other hero
      return false;
    }

    return true; //no issues found, movement is valid
}

//Get new positions (as row columns)
export function calculateMovementEffect(owner, other, effect){

  let ownerPos = positionToRowColumn(owner.position);
  let otherPos = positionToRowColumn(other.position);

  let otherAlt = [-1, -1];


  if (ownerPos[0] === otherPos[0]){ //same row, move along the row so change column

    let factor = otherPos[1] - ownerPos[1]; //factor determines how the participants are positioned and which way the assist applies 

    ownerPos[1]+= factor * effect.owner;

    //the other hero is moving away 2 spaces from the owner (only occurs with smite currently). Need to also get the position in between
    //This position will be used instead if the other hero cannot occupy the new position (short stop).
    //This position will also be checked if it can be occupied (e.g. if it is a wall) which would prevent the assist from working at all.
    //If movement effects are added that such that more than 1 space will have to be checked for short stopping and walls, this will have to be modified
    if (effect.other >= 2){ 
      otherAlt[0] = otherPos[0];
      otherAlt[1] = otherPos[1] + factor * (effect.other - 1);
    }

    otherPos[1]+= factor * effect.other;



  } else if (ownerPos[1] === otherPos[1]){ //same column, move along the column, so change row

    let factor = otherPos[0] - ownerPos[0];

    ownerPos[0]+= factor * effect.owner;

    if (effect.other >= 2){ 
      otherAlt[1] = otherPos[0];
      otherAlt[0] = otherPos[0] + factor * (effect.other - 1);
    }

    
    otherPos[0]+= factor * effect.other;

  }
  return {"owner": ownerPos, "other": otherPos, "otherAlt": otherAlt};

}

//given heroes, check if they are cardinal to eachother
export function checkCardinal(hero1, hero2){
  let pos1 = positionToRowColumn(hero1.position);
  let pos2 = positionToRowColumn(hero2.position);

  if (pos1[0] === pos2[0] || pos1[1] === pos2[1]){
    return true;
  } else {
    return false;
  }

}
//given heroes, check if they are cardinal to eachother OR if hero2 is within a certain amount of colums/rows hero1
export function checkCardinalRowColumn(hero1, hero2, width, height){
  let pos1 = positionToRowColumn(hero1.position);
  let pos2 = positionToRowColumn(hero2.position);


  //For effects that require unit to be within rows OR columns, use two conditionals with 0 width/height value

  //width = 0 means ignore column and only check row
  if (width === 0){

    if (Math.abs(pos1[0] - pos2[0]) <= height){
      return true;
    } else {
      return false;
    }

  }

  //height = 0 means ignore row and only check column
  if (height === 0){

    if (Math.abs(pos1[1] - pos2[1]) <= width){
      return true;
    } else {
      return false;
    }

  }

  //within both required columns and rows - NOTE - don't think any skills would use this - plumeria's weapon uses this
  if (Math.abs(pos1[1] - pos2[1]) <= width && Math.abs(pos1[0] - pos2[0]) <= height){
    return true;
  } else {
    return false;
  }



}


//tactic requirement is always <= 2 
export function checkTactic(hero, heroList){
  let allyCount = 0;  
  let moveTypeCheck = heroData[hero.heroID.value].movetype;

  for (let x of heroList[hero.side]){


    if (heroData[x.heroID.value].movetype === moveTypeCheck && heroValid(x)){ //movetype is the same and different ally
      allyCount++;
    }

  }


  if (allyCount <= 2){
    return true;
  } else {
    return false;
  }

}


//given a list of heroes and an effect (which should contain a buffList and other corresponding keys) and apply buffs in the list to list of heroes
export function applyBuffList(heroList, affectedHeroes, effect, owner, teamPost, specialPost, turn){

  //Single targets effects only allow a single hero
  if ("singleTarget" in effect && effect.singleTarget){
    if (affectedHeroes.length > 1){
      return;
    }
  }

  let value = effect.value;
  if (value === "variable"){

    value = getVariableValue(heroList, effect.variableCheck, owner, turn);
  }


  for (let y of affectedHeroes){
    for (let x of effect.list){ //loop through status buffs to apply

      if (x === "stats"){



        for (let z of effect.stats){ //loop through the stats list


          if (z === "highest"){

            //get the highest stats 
            let max = 0;
            let highestStat = [];
            for (let stat in effect.highMod){

              let val  = y.visibleStats[stat] + effect.highMod[stat];
              if (val === max){
                highestStat.push(stat);
              } else if (val > max){
                highestStat = [];
                highestStat.push(stat);
                max = val;
              }
            }

            //apply debuff to highest stats
            for (let i of highestStat){

              heroList[y.side][y.listIndex][effect.subtype][i] = Math.max(heroList[y.side][y.listIndex][effect.subtype][i], value); 
            }


          } else if (z === "hp"){ //special case - effects that 

              if (effect.subtype === "buff"){

                if (y.statusEffect.deepWounds < 1 && y.combatEffects.nullHeal < 1){                
                  teamPost[y.listIndex]-=  value; //lowers the amount of post damage
                }
              } else if (effect.subtype === "debuff"){

                if (y.combatEffects.nullPost < 1){
              
                  teamPost[y.listIndex]+=  value; //raises the amount of post damage
                }
              }

          } else if (z === "special"){

              if (specialPost[y.listIndex] !== "reset"){

                if (value === "reset"){
                  specialPost[y.listIndex] = value;

                } else if (effect.subtype === "buff"){
                  specialPost[y.listIndex]+= value; //raises the amount special is reduced
                } else if (effect.subtype === "debuff"){
                  specialPost[y.listIndex]-= value; //raises the amount special is increased
                }

              }

          } else {

            heroList[y.side][y.listIndex][effect.subtype][z] = Math.max(heroList[y.side][y.listIndex][effect.subtype][z], value); 
          }

          
        }

      } else if (x === "restore"){ //restore the unit (remove debuffs and status effects)

        heroList[y.side][y.listIndex].debuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
        heroList[y.side][y.listIndex].statusEffect = JSON.parse(JSON.stringify(statusDebuffs));

      } else if (x === "galeforce"){
        heroList[y.side][y.listIndex].end = false;

      } else { //otherwise, it should be a status buff

        if (effect.subtype === "buff"){

          heroList[y.side][y.listIndex].statusBuff[x]++; //give the status buff
        } else if (effect.subtype === "debuff"){
          heroList[y.side][y.listIndex].statusEffect[x]++; //give the status buff
        }

      }


    }
  }

}


//checks if hero is on the board and not dead
export function heroValid(hero){
  if (hero.position >= 0 && hero.currentHP > 0){
    return true;
  } else {
    return false;
  }

}

//given two conditional lists
function conditionMatch(c1, other){
  let c2 = this;
  if (this === undefined){
    c2 = other;
  }

  //true when both are array
  //false if either is string or both are string
  if (c1 === c2){
    return true;
  }

  if (c1 === null || c2 === null){

    return false;
  }

  if (c1.length !== c2.length ){ 

    return false;
  }



  for (let i =0; i < c1.length; i++){


    if ( Array.isArray(c1[i]) && Array.isArray(c2[i])) { //if either are arrays, check if the arrays are matching

      if (!conditionMatch(c1[i], c2[i])){
        return false;
      }

      //return false; //if the arrays don't match, then condition match fails

    } else if (c1[i] !== c2[i]) { //both a strings/ints, do comparison

      return false;
    }

  } //end for


  return true;
}

//returns a list of conditions give a list of effects (for )

function effectListToConditionList(effectList){

  let conditionList = [];

  for (let effect of effectList){
    if ("condition" in effect){
      conditionList.push(effect.condition);
    }
  }

  return conditionList;

}