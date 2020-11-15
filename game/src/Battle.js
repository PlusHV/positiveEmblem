import heroData from './heroInfo.json';
import {calculateCombatStats} from './StatCalculation.js'

export function doBattle(updatedHeroList, attacker, defender, board){
    let list = updatedHeroList;

    let newAttacker = attacker;
    let newDefender = defender;

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

    let attackerPartyBuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    let defenderPartyBuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};

    let attackerPartyHeal = 0;
    let defenderPartyHeal = 0;

    let attackerAttacked = false;
    let defenderAttacked = false;
    let attackerSpecialActivated = false;
    let defenderSpecialActivated = false;

    if (attacker.specialActivated){ //check if pre battle special was used
      attackerSpecialActivated = true;
    }

    //At this point, battle has started
    let attackIndex = 0;

    while (attackIndex < attackStack.length  && newAttacker.currentHP > 0 && newDefender.currentHP > 0){ //do attacks as long as the attack stack is not empty and both heroes are alive
      let temp = attackStack[attackIndex]; 
      let damageInfo = {};


      if (temp === 1){ //attacker hits defender
        damageInfo = calculateDamage(newAttacker, newDefender, attackerType, attackerSpecial, defenderSpecial, list, attackStack, attackIndex);

        attackerSpecial.charge = damageInfo.attackerSpecialCharge;

        defenderSpecial.charge =  damageInfo.defenderSpecialCharge;


        newDefender.currentHP = Math.max(0, newDefender.currentHP - damageInfo.damage);


        newAttacker.currentHP = Math.min(newAttacker.stats.hp, newAttacker.currentHP + damageInfo.heal); //heal hp from attack

        //the only reflecting special is currently ice mirror (range = 2), so can only be activated  by a melee defender (og fjorm) that is initated on  

        if (newDefender.combatEffects.reflect === 0){ //only get reflect damage if it is currently not set (so can't get overwritten from stuff like brave attacks)
          newDefender.combatEffects.reflect = damageInfo.reflect; 
        }


        if (newAttacker.combatEffects.reflect !== 0){ //The attacker has just attacked, so its reflect boost is now reset
          newAttacker.combatEffects.reflect = 0;
        }

        let buffs = damageInfo.partyBuff;
        Object.keys(buffs).forEach((key, i) => {
          attackerPartyBuff[key] = Math.max( attackerPartyBuff[key] ,buffs[key]); //apply highest buff
        });

        attackerPartyHeal = Math.max(damageInfo.partyHeal, attackerPartyHeal ); //take the higher heal so it doesn't get overwritten

        attackerAttacked = true;


        if (damageInfo.attackerSpecialActivated){
          attackerSpecialActivated = true;
        }

        if (damageInfo.defenderSpecialActivated){
          defenderSpecialActivated = true;
        }

      } else if (temp === 2){ //defender hits attacker

        //Note - CalculateDamage defines attacker as the one attacking, and defender as the one getting hit for the current attack, not by initiator/enemy phase heroes 
        damageInfo = calculateDamage(newDefender, newAttacker, defenderType, defenderSpecial, attackerSpecial, list, attackStack, attackIndex);

        defenderSpecial.charge = damageInfo.attackerSpecialCharge; //defender is iniated on, but uses attacker key since they are the one attacking here
        attackerSpecial.charge = damageInfo.defenderSpecialCharge;

        newAttacker.currentHP = Math.max(0, newAttacker.currentHP - damageInfo.damage);

        newDefender.currentHP = Math.min(newDefender.stats.hp, newDefender.currentHP + damageInfo.heal);

        if (newAttacker.combatEffects.reflect === 0){ 
          newAttacker.combatEffects.reflect = damageInfo.reflect;
        }


        if (newDefender.combatEffects.reflect !== 0){ //The defender has just attacked, so its reflect is now reset
          newDefender.combatEffects.reflect = 0;
        }

        let buffs = damageInfo.partyBuff;
        Object.keys(buffs).forEach((key, i) => {
          defenderPartyBuff[key] = Math.max( defenderPartyBuff[key] ,buffs[key]); //apply highest buff
        });
        defenderPartyHeal = Math.max(damageInfo.partyHeal, defenderPartyHeal ); //take the higher heal 

        defenderAttacked = true;

        if (damageInfo.attackerSpecialActivated){
          defenderSpecialActivated = true;
        }

        if (damageInfo.defenderSpecialActivated){
          attackerSpecialActivated = true;
        }
      }

      attackIndex++;

    }

    for (let x of list[attacker.side]){

      Object.keys(attackerPartyBuff).forEach((key, i) => {
        x.buff[key] = Math.max(x.buff[key], attackerPartyBuff[key]);
      });

    }

    for (let x of list[defender.side]){

      Object.keys(defenderPartyBuff).forEach((key, i) => {
        x.buff[key] = Math.max(x.buff[key], defenderPartyBuff[key]);
      });

    }


    if (attackerPartyHeal > 0){
      for (let x of list[attacker.side]){ //for each member of side
        list[attacker.side][x.listIndex].currentHP = Math.min(list[attacker.side][x.listIndex].currentHP + attackerPartyHeal, list[attacker.side][x.listIndex].stats.hp);
      }
      newAttacker.currentHP = Math.min(attacker.stats.hp, newAttacker.currentHP + attackerPartyHeal); //apply heal to this version too
    }


    if (defenderPartyHeal > 0){
      for (let x of list[defender.side]){ //for each member of side
        list[defender.side][x.listIndex].currentHP = Math.min(list[defender.side][x.listIndex].currentHP + defenderPartyHeal, list[defender.side][x.listIndex].stats.hp);
      }
      newDefender.currentHP = Math.min(defender.stats.hp, newDefender.currentHP + defenderPartyHeal);
    }


    //Apply battle-movement abilities
    //Check if attacker has a battle movement effect
    if (Object.keys(attacker.battleMovement).length > 0 ){
      let participantIDs = [attacker.id, defender.id]; //their ids (to uniquely identify them)

      let newPositions =  calculateMovementEffect(attacker, defender, attacker.battleMovement);

      let attackerPos = newPositions.owner;
      let defenderPos = newPositions.other;
      


      //convert back to positions
      let newAttackerPos = rowColumnToPosition(newPositions.owner);
      let newDefenderPos = rowColumnToPosition(newPositions.other);


      if (checkValidMovement(attackerPos, defenderPos, [-1, -1], participantIDs, board)){ //no issues with given movement positions;
        list[attacker.side][attacker.listIndex].position = newAttackerPos;
        list[defender.side][defender.listIndex].position = newDefenderPos;
      }

    }


    if (attackerSpecialActivated && attacker.combatEffects.spiral > 0){ //should also check for not postbattle special i guess
      attackerSpecial.charge = Math.max(0, attackerSpecial.charge - attacker.combatEffects.spiral);
    }

    if (defenderSpecialActivated && defender.combatEffects.spiral > 0){
      defenderSpecial.charge = Math.max(0, defenderSpecial.charge - defender.combatEffects.spiral);
    }


    //on attack combatEffects should just be recoil and stuff (and some debuff stuff)
    if (attackerAttacked){
        for (let m of attacker.onAttack){
          for (let n in m){
            attacker.combatEffects[n] += m[n];
          } //for n
        } //for m

    }

    if (defenderAttacked){
        for (let m of defender.onAttack){
          for (let n in m){
            defender.combatEffects[n] += m[n];
          } //for n
        } //for m

    }

    let attackerPostDamage = attacker.combatEffects.recoil;
    let defenderPostDamage = defender.combatEffects.recoil;

    if (newAttacker.currentHP > 0 && attacker.combatEffects.poison > 0){ //poison strike effect requires user to be alive
      defenderPostDamage+= attacker.combatEffects.poison //cannot go below 0
    }

    if (newDefender.currentHP > 0 && defender.combatEffects.poison > 0){
      attackerPostDamage+= defender.combatEffects.poison;
    }


    if (newAttacker.currentHP > 0 && newDefender.currentHP > 0){ //both users are alive are required for seals to activate

      if (attacker.combatEffects.seal.length > 0){

        for (let x of attacker.combatEffects.seal){
          for (let y in x){

            list[defender.side][defender.listIndex].debuff[y] = Math.max(defender.debuff[y], x[y]); 

          }

        } //for x

      }

      if (defender.combatEffects.seal.length > 0){

        for (let x of defender.combatEffects.seal){
          for (let y in x){

            list[attacker.side][attacker.listIndex].debuff[y] = Math.max(attacker.debuff[y], x[y]); 

          }

        } //for x

      }

    } //end if both are alive

    if (newDefender.currentHP > 0){
      newDefender.currentHP = Math.max(1, newDefender.currentHP - defenderPostDamage); //cannot go below 0 from post battle damage
    }

    if (newAttacker.currentHP > 0){
      newAttacker.currentHP = Math.max(1, newAttacker.currentHP - attackerPostDamage); //cannot go below 0
    }
    //set new current hp values
    list[attacker.side][attacker.listIndex].currentHP = newAttacker.currentHP;
    list[defender.side][defender.listIndex].currentHP = newDefender.currentHP;

    //set new special charges
    list[attacker.side][attacker.listIndex].special = attackerSpecial;
    list[defender.side][defender.listIndex].special = defenderSpecial;

    //increase combat Count
    list[attacker.side][attacker.listIndex].combatCount++;
    list[defender.side][defender.listIndex].combatCount++;
    return list;
  }

export function getDamageType(weaponType, owner, enemy){
    if (owner.combatEffects.adaptive > 0){
      if (enemy.combatStats.def <= enemy.combatStats.res){ // if def is lower
        return "def";
      } else {
        return "res";
      }

    } else if (["sword", "lance", "axe", "bow", "dagger", "beast"].includes(weaponType) ){
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

    //determine if defender gets to attack at all
    if ( (defender.range === attacker.range || defender.combatEffects.counter > 0) && (attacker.combatEffects.sweep <= 0 || defender.combatEffects.nullC > 0 ) ){ 
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

    if (defender.combatEffects.enemyBrave > 0){
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

    if (defender.combatEffects.enemyBrave > 0){
      defenderRoundHits = 2;
    }

    let attackStack = [];


    //vantage attack
    if (defenderHits > 0 && defender.combatEffects.vantage > 0){
      
      for (let i = 0; i < defenderRoundHits; i++){
        attackStack.push(2);
      }

      defenderHits-= defenderRoundHits;

      if (defenderHits > 0 && defender.combatEffects.desperation > 0){ //if desperation is active get follow up attack immediately
        
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
      if (attackerHits > 0 && attacker.combatEffects.desperation > 0){

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

      if (defenderHits > 0 && defender.combatEffects.desperation > 0){ //if desperation is active get follow up attack immediately 
        
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
      
      for (let i = 0; i < attackerRoundHits; i++){
        attackStack.push(2);
      }

      defenderHits-= defenderRoundHits;
    }



    //}

    return attackStack;
  }


export function calculateDamage(attacker, defender, damageType, attackerSpecial, defenderSpecial, heroList, attackStack, attackIndex){

  let WTA = calculateWeaponTriangleAdvantage(heroData[attacker.heroID.value].color, heroData[defender.heroID.value].color ); //get the WTA multiplier

  let baseDamage = attacker.combatStats.atk + Math.trunc(attacker.combatStats.atk * WTA) - defender.combatStats[damageType] ; //damage can be negative here


  //staff damage reduction 
  if (heroData[attacker.heroID.value].weapontype === "staff" && attacker.combatEffects.wrathful === 0){
    baseDamage = Math.trunc(baseDamage / 2); 
  }


  let attackerSpecialCharge = attackerSpecial.charge;
  let defenderSpecialCharge = defenderSpecial.charge;

  let specialDamage = 0;

  let trueDamage = attacker.combatEffects.trueDamage;

  
  let specialEffect = attackerSpecial.effect;

  let partyHeal = 0;
  let partyBuff = {};

  let attackerSpecialActivated = false;
  let defenderSpecialActivated = false;

  if (attackerSpecialCharge === 0 && attackerSpecial.type === "attack-battle"){ //if charged and an offsensive battle special



    if ( Array.isArray(specialEffect.damage) ){ //if the damage value is a list
      
      specialDamage = getSpecialDamage(specialEffect, attacker, defender, heroList, damageType);
      // let hero; //which hero to base the damage off of
      // if (specialEffect.damage[0] === "attacker"){
      //   hero = attacker;
      // } else if (specialEffect.damage[0] === "defender"){
      //   hero = defender;
      // }

      // let stat = specialEffect.damage[1];
      // if (stat === "defensive"){
      //   stat = damageType;
      // }


      // let factor = specialEffect.damage[2];

      // if ("condition" in specialEffect && checkCondition(heroList, specialEffect.condition, attacker, defender) ){

      //   factor = specialEffect["alt"];

      // }

      // if (stat === "flat"){
      //   specialDamage = factor; //special damage is flat
      // } else if (stat === "hp"){ //HP specials are based on missing hp and only for attackers
      //   specialDamage = Math.trunc( (attacker.stats.hp - attacker.currentHP) * factor);


      // } else{
      //   specialDamage = Math.trunc(hero.combatStats[stat] * factor);
      // }


      for (let i of attacker.onSpecial){ //loop through effects that activate on special
        if (i !== null){

          for (let j in i){ 
            if (j === "damage"){
              //let onSpecialDamage = i.damage;
              let extraDamage = getSpecialDamage(i, attacker, defender, heroList, damageType);
              // let sHero;

              // if (i.damage[0] === "attacker"){
              //   sHero = attacker;
              // } else if (i.damage[0] === "defender"){
              //   sHero = defender;
              // }


              // let sStat = i.damage[1];
              // if (sStat === "defensive"){
              //   sStat = damageType;
              // }


              // let sFactor = i.damage[2];

              // if ("condition" in i && checkCondition(heroList, i.condition, attacker, defender) ){

              //   sFactor = i["alt"];

              // }

              // let extraDamage = 0;

              // if (sStat === "flat"){
              //   extraDamage+= sFactor; //special damage is flat
              // } else if (sStat === "hp"){ //HP specials are based on missing hp and only for attackers

              //   extraDamage+= Math.trunc( (attacker.stats.hp - attacker.currentHP) * sFactor);

              // } else{

              //   extraDamage+= Math.trunc(sHero.combatStats[sStat] * sFactor);
              // }

              if (i.damage[3] === "trueDamage"){
                trueDamage+= extraDamage;
              } else if (i.damage[3] === "specialDamage" ){
                specialDamage+= extraDamage
              }


            } //end for damage
          } //end for i



        }

      } //end for onSpecial



      getConditionalSpecial(attacker, defender, heroList); 

      trueDamage+= attacker.combatEffects.specialTrueDamage; 

      removeConditionalSpecial(attacker, defender, heroList);
    } //end special damage calc



    //add the amplify special damage (astra, glimmer etc.)
    specialDamage = specialDamage + Math.trunc( (baseDamage +  specialDamage) * specialEffect.amplify); //amplify is not applied to true damage


    attackerSpecialCharge = attackerSpecial.cd;  //reset cd


    if ("partyHeal" in specialEffect){
      partyHeal = specialEffect.partyHeal;

    }

    if ("partyBuff" in specialEffect){
      partyBuff = specialEffect.partyBuff;
    }

    attackerSpecialActivated = true;

  } else{ //special not activated, increment normally

    if (attackerSpecialCharge >= 0){

      //charge will not go below 0. attack charge will be at least 1 but maxes out a 2. Guard will be at least 0 but maxes out at 1.
      attackerSpecialCharge = Math.max(0, attackerSpecialCharge - Math.min(attacker.combatEffects.attackCharge, 2) + Math.min(defender.combatEffects.guard + attacker.statusEffect.guard, 1) ); //unit attacking
    }

  } //end offensive special check 

  specialDamage+= attacker.combatEffects.reflect; //adding the reflect damage


  //all damage reduction values are 1 - percent reduced by. 0 damage reduction is thus 1 - 0 = 1.0
  //When used in calculations, 1 - damage reduction is used 
  let damageReduction = defender.combatEffects.damageReduction;


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
    damageReduction = damageReduction * defender.combatEffects.firstReduction;
  }

  //if adding the consecutive damage reduction 
  //check if an attack has been made before this, then check if it was the current attacker (thus a consecutive attkack)

  if (attackIndex - 1 >= 0 && attackStack[attackIndex - 1] === currentAttacker){ 
    damageReduction = damageReduction * defender.combatEffects.consecutiveReduction;
  }

  //Follow-up reduction - if not brave then just check second attack, otherwise check 3rd and 4th
  if (attacker.combatEffects.brave > 0 && previousAttacks >= 2){ //if brave, check if 2 other attacks have been made (so it is now the 3rd or 4th)
     damageReduction = damageReduction * defender.combatEffects.followUpReduction;

  } else if (previousAttacks >= 1) { //not brave attack, check if they have done at least one attack (should only 1 since no brave effect)
    damageReduction = damageReduction * defender.combatEffects.followUpReduction;
  }

  let miracle = false;
  let reflect = false;
  let reflectDamage = 0;
  let flatReduction = 0;


  if (defenderSpecialCharge === 0 && defenderSpecial.type === "defend-battle" && 
    (defenderSpecial.range === 0 || defenderSpecial.range === getDistance(attacker.position, defender.position)  ) ){
    if (defenderSpecial.effect.factor === "miracle"){
      miracle = true;
    } else{
      damageReduction = damageReduction * defenderSpecial.effect.factor;
    }

    if ("reflect" in defenderSpecial.effect){

      if (defenderSpecial.effect.reflect["damage"].includes("mirror")){ //if the damage key of the reflect effect is a mirror image
        reflect = true; //reflect damage is calculated later
      } else {
        reflectDamage = getSpecialDamage(defenderSpecial.effect.reflect, defender, attacker, heroList, damageType); 
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
      defenderSpecialCharge = Math.max(0, defenderSpecialCharge - Math.min(defender.combatEffects.defenseCharge, 2) + Math.min(attacker.combatEffects.guard + defender.statusEffect.guard, 1) );



    }
  }

  let totalDamage = Math.max(0, baseDamage + specialDamage) + trueDamage; //total damage before reductions

  if (reflect){
    reflectDamage =  Math.trunc( totalDamage - totalDamage * damageReduction ) + flatReduction; //the amount of reflected damage is the damage reduced by damage reduction

  }




  //[Damage Including Extra Damage] – ([Damage Including Extra Damage] x [Effect of Damage-Mitigating Skill or Special]) = Final Damage After Mitigation


  totalDamage = totalDamage - Math.trunc( totalDamage - totalDamage * damageReduction ) - flatReduction; //total damage after reductions

  //calculate separately for base and special damage for additional info
  baseDamage = baseDamage - Math.trunc( baseDamage - baseDamage * damageReduction);
  specialDamage = specialDamage - Math.trunc( specialDamage - specialDamage * damageReduction);


  if (miracle){
    if (defender.currentHP > 1 && baseDamage + specialDamage >= defender.currentHP){ //if hp > 1 and their hp would go to 0, activate miracle
      totalDamage =  defender.currentHP - 1; //leave 1 hp
      defenderSpecialCharge = defenderSpecial.cd;

      defenderSpecialActivated = true;
    }
  }

  let damageDealt = Math.min(defender.currentHP, totalDamage); //damage dealt maxes out at the current HP of defender (for healing purposes)

  let heal = 0;
  heal = Math.trunc(attacker.combatEffects.specialHeal * damageDealt);
  if ("heal" in specialEffect){
    heal+= Math.trunc(specialEffect.heal * damageDealt); 
  }

  return {"damage": totalDamage, "reflect": reflectDamage, "base": baseDamage, "special": specialDamage, "heal": heal, "partyBuff": partyBuff, "partyHeal": partyHeal,
  "attackerSpecialCharge": attackerSpecialCharge, "defenderSpecialCharge": defenderSpecialCharge,
  "attackerSpecialActivated": attackerSpecialActivated, "defenderSpecialActivated": defenderSpecialActivated } ; ///glimmer interacts with damage reduction

}

export function getSpecialDamage(effect, owner, enemy, heroList, damageType){
    let specialDamage = 0;
    let hero; //which hero to base the damage off of
    if (effect.damage[0] === "attacker"){
      hero = owner;
    } else if (effect.damage[0] === "defender"){
      hero = enemy;
    }

    let stat = effect.damage[1];
    if (stat === "defensive"){
      stat = damageType;
    }


    let factor = effect.damage[2];

    if ("condition" in effect && checkCondition(heroList, effect.condition, owner, enemy) ){

      factor = effect["alt"];

    }

    if (stat === "flat"){
      specialDamage = factor; //special damage is flat
    } else if (stat === "hp"){ //HP specials are based on missing hp and only for attackers
      specialDamage = Math.trunc( (owner.stats.hp - owner.currentHP) * factor);

    } else{
      specialDamage = Math.trunc(hero.combatStats[stat] * factor);
    }

    return specialDamage;
}

export function calculateWeaponTriangleAdvantage(colorAttack, colorDefend){
	let val = 0.0;

	if (colorAttack === "red"){
		if (colorDefend === "blue"){
			val = -0.2;
		} else if (colorDefend === "green"){
			val = 0.2;
		} else if (colorDefend === "colorless"){
			val = 0.0; //to do, add raven effect
		}

	} else if (colorAttack === "blue"){
		if (colorDefend === "green"){
			val = -0.2;
		} else if (colorDefend === "red"){
			val = 0.2;
		} else if (colorDefend === "colorless"){
			val = 0.0; //to do, add raven effect
		}

	} else if (colorAttack === "green"){
		if (colorDefend === "red"){
			val = -0.2;
		} else if (colorDefend === "blue"){
			val = 0.2;
		} else if (colorDefend === "colorless"){
			val = 0.0; //to do, add raven effect
		}

	}
	//TODO
	//add colorless difference if raven effect
	//Add check for triangle adept and cancel affinity

	//affinity (x + 20)/20 where x is the TA amount
	//CA 1/2 will remove the x depending on situation, and at CA 3, the x will be reversed

	return val;

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
export function getAdjacentAllies(hList, position){
  let adjacentList = [];

  for (let x of hList){
    if (x.position !== position && getDistance(x.position, position) === 1 ){
      adjacentList.push(x);
    }

  }

  return adjacentList;
}

export function getDistantHeroes(hList, position, excluded, distance){
  let distantList = [];

  for (let x of hList){

    let allyDistance = getDistance(x.position, position); 

    if (x.position !== position && !excluded.includes(x.position) && allyDistance <= distance && allyDistance > 0 ){
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


      //so always on effects can be mixed with conditional effects easily
      if (keyWord === "always"){
        innerResult = true;
        
      } else if (keyWord === "phase"){ //owner must be on the correct phase 

        if (innerCondition[j+1] === "player" && owner.initiating){ //initiating condition
          innerResult = true;
        } else if (innerCondition[j+1] === "enemy" && !owner.initiating){ //initiated on condition
          innerResult = true;
        } 
        j = j + 1; //Skip one element
      } else if (keyWord === "adjacent"){
        if (innerCondition[j+1] && getAdjacentAllies(heroList[owner.side], owner.position).length > 0  ){ //adjacent to at least one ally
          innerResult = true;
        } else if (!innerCondition[j+1] && getAdjacentAllies(heroList[owner.side], owner.position).length === 0  ){ //adjacent to no allies
          innerResult = true;
        }

        j = j + 1;

      } else if (keyWord === "hp"){ //if hp must be at a ceretain threshold

        let hpThreshold =  Math.trunc(innerCondition[j+2] * owner.stats.hp);

        if (innerCondition[j+1] === "greater" && owner.currentHP >= hpThreshold ){
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

      } else if (keyWord === "enemyInfo"){ //needs to check value of enemy hero (e.g. weapon type, movement type etc)

        let info = heroData[enemy.heroID.value];

        if (innerCondition[j+2].includes(info[innerCondition[j+1]])){
          innerResult = true;
        }

        j = j + 2;


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

        if (innerCondition[j+3] === "greater" &&  (ownerStat - enemyStat) >= innerCondition[j+4]  ){
          innerResult = true;
        } else if (innerCondition[j+3] === "less" &&  (enemyStat - ownerStat) >= innerCondition[j+4]  ){
          innerResult = true;
        }


        j = j + 4;
      } else if (keyWord === "distantAllies"){ //check if a certain number of allies within the range given range

        let distantAllies = getDistantHeroes(heroList[owner.side], owner.position, [], innerCondition[j+1]); //get the allies within the range

        if (innerCondition[j+2] === "greater" && distantAllies.length >= innerCondition[j+3]){
          innerResult = true;
        } else if (innerCondition[j+2] === "less" && distantAllies.length <= innerCondition[j+3]){
          innerResult = true;
        }

        j = j + 3;

      } else if (keyWord === "allyInfo"){ //check if allies within range are of certain types

        let distantAllies = getDistantHeroes(heroList[owner.side], owner.position, [], innerCondition[j+1]); //get the allies within the range

        let validAlliesCount = 0;

        for (let x of distantAllies){
          let info = heroData[x.heroID.value];

          if (innerCondition[j+3].includes(info[innerCondition[j+2]])){
            validAlliesCount++;

          }


        }


        if (innerCondition[j+4] === "all"){
          if (validAlliesCount === distantAllies.length){ //if all allies in range meet the condition
            innerResult = true;
          }

        } else if (validAlliesCount >= innerCondition[j+4]){ //sufficient allies that are in range meet the condition

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
      } else if (keyWord === "penalty"){
        
        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        if (check.debuff.atk > 0 || check.debuff.spd > 0 ||  check.debuff.def > 0 || check.debuff.res > 0
         || check.statusEffect.guard > 0 || check.statusEffect.panic > 0){
          innerResult = true;
        }

        j = j + 1;
      } else if (keyWord === "bonus"){

        let check = {};
        if (innerCondition[j+1] === "player"){
          check = owner;
        } else if (innerCondition[j+1] === "enemy"){
          check = enemy;
        }

        if (check.buff.atk > 0 || check.buff.spd > 0 ||  check.buff.def > 0 || check.buff.res > 0){
          innerResult = true;
        }


        j = j + 1;
      } else if (keyWord === "combatCount"){ //

        if (owner.combatCount === innerCondition[j+1] ){
          innerResult = true;
        }

        j = j + 1;
      }


    }//end for j

    if (!innerResult){ //if the innerResult false, then result becomes false
      result = false;
    }


  } //end for i



  return result;
} //end CheckCondition

export function calculateVariableEffect(heroList, variableEffect, owner, enemy){

  if (variableEffect.key === "allyDistance"){
    let distantAllies = Math.min(getDistantHeroes(heroList[owner.side], owner.position, [] , variableEffect.distance).length, variableEffect.maxAllies);

    let buff = (variableEffect.multiplier * distantAllies + variableEffect.constant);


    if (distantAllies < variableEffect.minAllies){
      buff = 0;
    }

    let statBuff = {};
    for (let x of variableEffect.stats){
      statBuff[x] = buff;
    }

    return statBuff;
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
    return statBuff;

  }


}

export function calculateVariableCombat(heroList, variableEffect, owner, enemy){
//    "effect": {"combatEffects": ["trueDamage"], "type": "bonusDamage", "unit": "owner", "stat": "atk", "factor": 0.25, "max": 999},
  if (variableEffect.key === "bonusDamage"){
    let unit = variableEffect.unit;
    let value = 0;

    if (unit === "owner"){
      value = Math.trunc(owner.combatStats[variableEffect.stat] * variableEffect.factor);  
    } else if (unit === "enemy"){
      value = Math.trunc(enemy.combatStats[variableEffect.stat] * variableEffect.factor); 
    } else if (unit === "difference"){
      value = Math.trunc(owner.combatStats[variableEffect.stat] - enemy.combatStats[variableEffect.stat] * variableEffect.factor); 
    }


    value = Math.min(variableEffect.max, value); //variable effect is capped

    let combatEffectList = {};
    for (let x of variableEffect.combatEffects){
      combatEffectList[x] = value;
    }
    return combatEffectList;
  } else if (variableEffect.key === "statDifferenceEffect"){

    let statCheck = variableEffect.stat;
    let factor = variableEffect.factor;
    let max = variableEffect.max;

    let visibleDifference = owner.visibleStats[statCheck] - enemy.visibleStats[statCheck];
    let combatDifference = owner.combatStats[statCheck] - enemy.combatStats[statCheck];

    let visibleValue = Math.trunc(visibleDifference * factor);
    let combatValue = Math.trunc(combatDifference * factor);



    visibleValue = Math.min(max, visibleValue );

    combatValue = Math.min(max, combatValue );

    let combatEffectList = {};
    for (let x of variableEffect.combatEffects){
      
      if (x.includes("Reduction")){

        if (x === "preBattleReduction" && visibleValue > 0){
          combatEffectList[x] = 1 - (visibleValue / 100.0 );
        } else if (combatValue > 0) {
          combatEffectList[x] = 1 - (combatValue / 100.0 );
        }

      } else if (x === "lull" && visibleValue > 0){

          let lullStats = variableEffect.debuffStats;
          combatEffectList.lull = {};


          for (let m of lullStats){
            combatEffectList.lull[m]= visibleValue;
          }

      } else {
        combatEffectList[x] = combatValue;
      }

    } //end for

    return combatEffectList;
  }


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