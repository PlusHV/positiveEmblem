import heroData from './heroInfo.json';
import {calculateCombatStats} from './StatCalculation.js'

export function doBattle(updatedHeroList, attacker, defender){
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

    let attackStack = getAttackOrder(attackCount);

    let attackerPartyBuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    let defenderPartyBuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};

    let attackerPartyHeal = 0;
    let defenderPartyHeal = 0;




    //At this point, battle has started


    while (attackStack.length > 0 && newAttacker.currentHP > 0 && newDefender.currentHP > 0){ //do attacks as long as the attack stack is not empty and both heroes are alive
      let temp = attackStack.shift(); //get the front of the stack
      let damageInfo = {};

      //TODO
      //check if special is active and 

      if (temp === 1){ //attacker hits defender
        damageInfo = calculateDamage(newAttacker, newDefender, attackerType, attackerSpecial, defenderSpecial, list); //calculate damage probably needs to send the speicals of both too

        attackerSpecial.charge = damageInfo.attackerSpecialCharge;

        defenderSpecial.charge =  damageInfo.defenderSpecialCharge;


        newDefender.currentHP = Math.max(0, newDefender.currentHP - damageInfo.damage);


        newAttacker.currentHP = Math.min(newAttacker.stats.hp, newAttacker.currentHP + damageInfo.heal); //heal hp from attack

        //the only reflecting special is currently ice mirror (range = 2), so can only be activated  by a melee defender (og fjorm) that is initated on  
        if (newDefender.effects.reflect === 0){ //only get reflect damage if it is currently not set (so can't get overwritten)
          newDefender.effects.reflect = damageInfo.reflect; 
        }

        let buffs = damageInfo.partyBuff;
        Object.keys(buffs).forEach((key, i) => {
          attackerPartyBuff[key] = Math.max( attackerPartyBuff[key] ,buffs[key]); //apply highest buff
        });

        attackerPartyHeal = Math.max(damageInfo.partyHeal, attackerPartyHeal ); //take the higher heal so it doesn't get overwritten

      } else if (temp === 2){ //defender hits attacker

        //Note - CalculateDamage defines attacker as the one attacking, and defender as the one getting hit for the current attack, not by initiator/enemy phase heroes 
        damageInfo = calculateDamage(newDefender, newAttacker, defenderType, defenderSpecial, attackerSpecial, list);

        defenderSpecial.charge = damageInfo.attackerSpecialCharge; //defender is iniated on, but uses attacker key since they are the one attacking here
        attackerSpecial.charge = damageInfo.defenderSpecialCharge;

        newAttacker.currentHP = Math.max(0, newAttacker.currentHP - damageInfo.damage);

        newDefender.currentHP = Math.min(newDefender.stats.hp, newDefender.currentHP + damageInfo.heal);

        newDefender.effects.reflect = 0; //defender's reflect damage is cleared since they have attacked

        let buffs = damageInfo.partyBuff;
        Object.keys(buffs).forEach((key, i) => {
          defenderPartyBuff[key] = Math.max( defenderPartyBuff[key] ,buffs[key]); //apply highest buff
        });
        defenderPartyHeal = Math.max(damageInfo.partyHeal, defenderPartyHeal ); //take the higher heal 
      }

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

    //set new current hp values
    list[attacker.side][attacker.listIndex].currentHP = newAttacker.currentHP;
    list[defender.side][defender.listIndex].currentHP = newDefender.currentHP;

    //set new special charges
    list[attacker.side][attacker.listIndex].special = attackerSpecial;
    list[defender.side][defender.listIndex].special = defenderSpecial;
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
    if (defender.range === attacker.range || defender.combatEffects.counter > 0){ 
      defenderCount = 1;
    }

    let attackerDouble = attacker.combatEffects["double"] - defender.combatEffects.enemyDouble;
    let defenderDouble = defender.combatEffects["double"] - attacker.combatEffects.enemyDouble;

    //out speeding gives and extra double stack
    if ( (attacker.stats.spd - defender.stats.spd) >= 5) {
      attackerDouble++;


    }

    if ( (defender.stats.spd - attacker.stats.spd) >= 5) {
      defenderDouble++;


    }

    //if double stack is at least 1, give an extra attack
    if (attackerDouble > 0){
      attackerCount++;
    }

    if (defenderDouble > 0 && defenderCount > 0){
      defenderCount++;
    }

    return [attackerCount, defenderCount];
  }
  //Given the attack counts, return the order in the form of a stack list
export function getAttackOrder(stack){
    //basic attack order without extra skills
    let attackerHits = stack[0];
    let defenderHits = stack[1];

    let attackStack = [];

    //todo - add brave effect here where pushes will occur twice in a row

    while (attackerHits > 0 ||  defenderHits > 0){

      if (attackerHits > 0){
        attackStack.push(1);
        attackerHits--;
      }

      if (defenderHits > 0){
        attackStack.push(2);
        defenderHits--;
      }


    }

    return attackStack;
  }


export function calculateDamage(attacker, defender, damageType, attackerSpecial, defenderSpecial, heroList){

  let WTA = calculateWeaponTriangleAdvantage(heroData[attacker.heroID.value].color, heroData[defender.heroID.value].color ); //get the WTA multiplier

  let baseDamage = attacker.combatStats.atk + Math.trunc(attacker.combatStats.atk * WTA) - defender.combatStats[damageType] ; //damage can be negative here

  let attackerSpecialCharge = attackerSpecial.charge;
  let defenderSpecialCharge = defenderSpecial.charge;

  let specialDamage = 0;

  let trueDamage = attacker.combatEffects.trueDamage;

  
  let specialEffect = attackerSpecial.effect;

  let partyHeal = 0;
  let partyBuff = {};

  if (attackerSpecialCharge === 0 && attackerSpecial.type === "attack-battle"){ //if charged and an offsensive battle special



    if ( Array.isArray(specialEffect.damage) ){ //if the damage value is a list
      

      let hero; //which hero to base the damage off of
      if (specialEffect.damage[0] === "attacker"){
        hero = attacker;
      } else if (specialEffect.damage[0] === "defender"){
        hero = defender;
      }

      let stat = specialEffect.damage[1];
      if (stat === "defensive"){
        stat = damageType;
      }


      let factor = specialEffect.damage[2];

      if ("condition" in specialEffect && checkCondition(heroList, specialEffect.condition, attacker, defender) ){

        factor = specialEffect["alt"];

      }

      if (stat === "flat"){
        specialDamage = factor; //special damage is flat
      } else if (stat === "hp"){ //HP specials are based on missing hp and only for attackers
        specialDamage = Math.trunc( (attacker.stats.hp - attacker.currentHP) * factor);


      } else{
        specialDamage = Math.trunc(hero.combatStats[stat] * factor);
      }


      //check 
      let oldSpecialTrigger =  Object.assign({}, attacker.combatEffects.specialTrigger); //get copy of the special trigger effects

      getConditionalSpecial(attacker, defender, heroList);

      trueDamage = attacker.combatEffects.specialTrigger.trueDamage; 

      attacker.combatEffects.specialTrigger = oldSpecialTrigger; //revert to original

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

  } else{ //special not activated, increment normally

    if (attackerSpecialCharge >= 0){

      //charge will not go below 0. attack charge will be at least 1 but maxes out a 2. Guard will be at least 0 but maxes out at 1.
      attackerSpecialCharge = Math.max(0, attackerSpecialCharge - Math.min(attacker.combatEffects.attackCharge, 2) + Math.min(defender.combatEffects.guard, 1) ); //unit attacking
    }

  } //end offensive special check 

  specialDamage+= attacker.effects.reflect; //adding the reflect damage


  //all damage reduction values are 1 - percent reduced by. 0 damage reduction is thus 1 - 0 = 1.0
  //When used in calculations, 1 - damage reduction is used 
  let damageReduction = 1.0; 


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

    if (defenderSpecial.effect.reflect){
      reflect = true;
    }

    if (!miracle){
      defenderSpecialCharge = defenderSpecial.cd;
    }

    //check 
    let oldSpecialTrigger =  Object.assign({}, defender.combatEffects.specialTrigger); //get copy of the special trigger effects

    getConditionalSpecial(defender, attacker, heroList);

    flatReduction = defender.combatEffects.specialTrigger.flatReduction; 

    defender.combatEffects.specialTrigger = oldSpecialTrigger; //revert to original

  } else{
    if (defenderSpecialCharge >= 0){
      defenderSpecialCharge = Math.max(0, defenderSpecialCharge - Math.min(defender.combatEffects.defenseCharge, 2) + Math.min(attacker.combatEffects.guard, 1) );



    }
  }

  let totalDamage = Math.max(0, baseDamage + specialDamage) + trueDamage;

  if (reflect){
    reflectDamage =  Math.trunc( totalDamage - totalDamage * damageReduction ) + flatReduction; //the amount of reflected damage is the damage reduced by damage reduction

  }




  //[Damage Including Extra Damage] – ([Damage Including Extra Damage] x [Effect of Damage-Mitigating Skill or Special]) = Final Damage After Mitigation


  totalDamage = totalDamage - Math.trunc( totalDamage - totalDamage * damageReduction ) - flatReduction;

  //calculate separately for base and special damage for additional info
  baseDamage = baseDamage - Math.trunc( baseDamage - baseDamage * damageReduction);
  specialDamage = specialDamage - Math.trunc( specialDamage - specialDamage * damageReduction);




  if (miracle){
    if (defender.currentHP > 1 && baseDamage + specialDamage >= defender.currentHP){ //if hp > 1 and their hp would go to 0, activate miracle
      totalDamage =  defender.currentHP - 1; //leave 1 hp
      defenderSpecialCharge = defenderSpecial.cd;
    }
  }

  let heal = 0;

  if ("heal" in specialEffect){
    heal = Math.trunc(specialEffect.heal * totalDamage) ; 
  }

  return {"damage": totalDamage, "reflect": reflectDamage, "base": baseDamage, "special": specialDamage, "heal": heal, "partyBuff": partyBuff, "partyHeal": partyHeal,
  "attackerSpecialCharge": attackerSpecialCharge, "defenderSpecialCharge": defenderSpecialCharge } ; ///glimmer interacts with damage reduction

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

export function getDistantAllies(hList, position, excluded, distance){
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

export function checkCondition(heroList, condition, owner, enemy){

  //let keyWordList = ["phase"];  //this contains the list of keywords that denote at start of a condition

  let result = true;

  for (let i = 0; i < condition.length; i++){ //outer list - all condition lists in this list must be true

    let innerCondition = condition[i]; //loop through the lists in the lists
    let innerResult = false;

    for (let j = 0; j < innerCondition.length; j++){ //inner list - at least one condition in this list must be true

      let keyWord = innerCondition[j];

      if (keyWord === "phase"){ //owner must be on the correct phase 

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
      } else if (keyWord === "enemyInfo"){ //needs to check value of enemy hero (e.g. weapon type, movement type etc)

        let info = heroData[enemy.heroID.value];

        if (innerCondition[j+2].includes(info[innerCondition[j+1]])){
          innerResult = true;
        }

        j = j + 2;
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

        let distantAllies = getDistantAllies(heroList[owner.side], owner.position, [], innerCondition[j+1]); //get the allies within the range

        if (innerCondition[j+2] === "greater" && distantAllies.length >= innerCondition[j+3]){
          innerResult = true;
        } else if (innerCondition[j+2] === "less" && distantAllies.length <= innerCondition[j+3]){
          innerResult = true;
        }

        j = j + 3;

      } else if (keyWord === "allyInfo"){ //check if allies within range are of certain types
        //    "effect": [{"condition": [["phase", "enemy"], ["allyInfo", 1, "weapontype", ["redtome", "bluetome", "greentome", "colorlesstome"], 1]], "statBuff": {"atk": 4, "spd": 4, "def": 4, "res": 4} }],

        let distantAllies = getDistantAllies(heroList[owner.side], owner.position, [], innerCondition[j+1]); //get the allies within the range

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
      }


    }//end for j

    if (!innerResult){ //if the innerResult false, then result becomes false
      result = false;
    }


  } //end for i



  return result;
} //end CheckCondition

export function calculateVariableEffect(heroList, variableEffect, owner, enemy){

  if (variableEffect.type === "allyDistance"){
    let distantAllies = Math.min(getDistantAllies(heroList[owner.side], owner.position, [] , variableEffect.distance).length, variableEffect.maxAllies);

    let buff = (variableEffect.multiplier * distantAllies + variableEffect.constant);


    if (distantAllies < variableEffect.minAllies){
      buff = 0;
    }

    let statBuff = {};
    for (let x of variableEffect.stats){
      statBuff[x] = buff;
    }

    return statBuff;
  } else if (variableEffect.type === "session"){
    //    "effect": {"stats": ["def", "res"], "type": "session", "phase": "enemy", "multiplier": 2, "constant": 6, "min": 2},
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

  if (variableEffect.type === "bonusDamage"){
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
  }


}

export function getConditionalSpecial(owner, enemy, heroList){

  //Conditionals
  for (let x of owner.conditionalSpecial){

    if (x !== null && checkCondition(heroList, x.condition, owner, enemy)){ //if condition is true, then provide the rest of the effects

      for (let y in x){ //loop through 
        if (y !== "condition"){ //everything else should be combat effects
          owner.combatEffects.specialTrigger[y]+= x[y]; //conditional specials should give effects changing specialTrigger effects
        }


      } //end loop through gained effects



    } //end if condition true

  } //end for 


}