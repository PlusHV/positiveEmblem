import heroData from './heroInfo.json';


export function DoBattle(updatedHeroList, attacker, defender){
    let list = updatedHeroList;

    let newAttacker = attacker;
    let newDefender = defender;

    //get specials
    let attackerSpecial = attacker.special;
    let defenderSpecial = defender.special;


    //TODO - prebattle specials if charged (these also effect other units (using heroList) due to aoe)  

    //check if attacker is using an aoe special and if it is charged
    if (attackerSpecial.type === "pre-battle" && attackerSpecial.charge === 0){
      //do aoe
      attackerSpecial.charge = attackerSpecial.cd;
    } 

    
    //TODO - apply all combat buffs beforehand

    //target def or res
    let attackerType = GetDamageType(heroData[attacker.heroID.value].weapontype);
    let defenderType = GetDamageType(heroData[defender.heroID.value].weapontype);
    //aDmgType = 

    //get the amount of attacks from each unit
    let attackCount = GetAttackCount(attacker, defender);

    let attackStack = GetAttackOrder(attackCount);

    let attackerPartyBuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};
    let defenderPartyBuff = {"atk": 0, "spd": 0, "def": 0, "res": 0};

    let attackerPartyHeal = 0;
    let defenderPartyHeal = 0;


    while (attackStack.length > 0 && newAttacker.currentHP > 0 && newDefender.currentHP > 0){ //do attacks as long as the attack stack is not empty and both heroes are alive
      let temp = attackStack.shift(); //get the front of the stack
      let damageInfo = {};

      //TODO
      //check if special is active and 

      if (temp === 1){ //attacker hits defender
        damageInfo = CalculateDamage(newAttacker, newDefender, attackerType, attackerSpecial, defenderSpecial); //calculate damage probably needs to send the speicals of both too

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
        damageInfo = CalculateDamage(newDefender, newAttacker, defenderType, defenderSpecial, attackerSpecial);

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

export function GetDamageType(weaponType){
    if (["sword", "lance", "axe", "bow", "dagger", "beast"].includes(weaponType) ){
      return "def";
    } else if (["redtome", "bluetome", "greentome", "breath", "staff", "colorlesstome"].includes(weaponType)){
      return "res";
    }
    return "error";


  }
  //Get the number of attacks for each unit (e.g. doubling)
export function GetAttackCount(attacker, defender){
    let attackerCount = 1; //Has at least one
    let defenderCount = 0;

    //determine if defender gets to attack at all
    if (defender.range === attacker.range){ //to do - or if distant counter/close counter, 
      defenderCount = 1;
    }

    //if outspeed (or if have double granting effect)
    if ( (attacker.stats.spd - defender.stats.spd) >= 5 ) {

      attackerCount++;

    } else if ( (defender.stats.spd - attacker.stats.spd) >= 5  && defenderCount > 0) {
      defenderCount++;

    }

    return [attackerCount, defenderCount];
  }
  //Given the attack counts, return the order in the form of a stack list
export function GetAttackOrder(stack){
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


export function CalculateDamage(attacker, defender, damageType, attackerSpecial, defenderSpecial){

  let WTA = CalculateWeaponTriangleAdvantage(heroData[attacker.heroID.value].color, heroData[defender.heroID.value].color ); //get the WTA multiplier

  let baseDamage = Math.max(attacker.stats.atk + Math.floor(attacker.stats.atk * WTA) - defender.stats[damageType], 0) ; //no negative damage

  let attackerSpecialCharge = attackerSpecial.charge;
  let defenderSpecialCharge = defenderSpecial.charge;

  let specialDamage = 0;

  
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

      if (stat === "flat"){
        specialDamage = factor; //special damage is flat
      } else if (stat === "hp"){ //HP specials are based on missing hp and only for attackers
        specialDamage = Math.floor( (attacker.stats.hp - attacker.currentHP) * factor);


      } else{
        specialDamage = Math.floor(hero.stats[stat] * factor);
      }

    } //end special damage calc



    specialDamage = specialDamage + Math.floor( (baseDamage +  specialDamage) * specialEffect.amplify);


    attackerSpecialCharge = attackerSpecial.cd; 

    if ("partyHeal" in specialEffect){
      partyHeal = specialEffect.partyHeal;

    }

    if ("partyBuff" in specialEffect){
      partyBuff = specialEffect.partyBuff;
    }

  } else{ //special not activated, increment normally

    if (attackerSpecialCharge >= 0){
      attackerSpecialCharge = Math.max(0, attackerSpecialCharge - 1); //unit attacking
    }

  } //end offensive special check 

  specialDamage+= attacker.effects.reflect; //adding the reflect damage

  let damageReduction = 1.0; //damage reduction is multiplicative
  let miracle = false;
  let reflect = false;
  let reflectDamage = 0;

  if (defenderSpecialCharge === 0 && defenderSpecial.type === "defend-battle" && 
    (defenderSpecial.range === 0 || defenderSpecial.range === GetDistance(attacker.position, defender.position)  ) ){
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

  } else{
    if (defenderSpecialCharge >= 0){
      defenderSpecialCharge = Math.max(0, defenderSpecialCharge - 1);
    }
  }



  if (reflect){
    reflectDamage =  Math.floor( (baseDamage + specialDamage) *  (1 - damageReduction) ); //the amount of reflected damage is the damage reduced by damage reduction

  }

  //12 - 1.5 = 10.5



  //damage reduction is done by reducing by a percent which is done by  DR = damage * (1.00-percent)
  //so the actual calculation is done as a orgDamage - DR. This resulting value is then floored.
  //I apply the damage reduction directly so the resulting damage is essentially ceiled.

  let totalDamage = Math.ceil( (baseDamage + specialDamage) * damageReduction); 
  //apply damgage reductions
  baseDamage = baseDamage * damageReduction;
  specialDamage = specialDamage * damageReduction;



  // if (applyAmplify){ //amplify damage if special activated
  //       //the base and special damgage should be reduced if there is reduction
  //   let amplifyDamage =  Math.floor( (totalDamage) * specialEffect.amplify) ; //get the amount of damage added from amplification
    

  //   //get reflected damage from amplified damage as well
  //   if (reflect){
  //     reflectDamage+= Math.floor( amplifyDamage * (1- damageReduction) );
  //   }

  //   //apply reduction if needed
  //   amplifyDamage = Math.ceil(amplifyDamage * damageReduction) ;
  //   specialDamage+= amplifyDamage;

  //   totalDamage+= amplifyDamage;

  // } //end amplified damage



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

export function CalculateWeaponTriangleAdvantage(colorAttack, colorDefend){
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
export function GetDistance(first, second){
  let firstRC = PositionToRowColumn(first);
  let secondRC = PositionToRowColumn(second);

  let distance = 0;

  distance += Math.abs(firstRC[1] - secondRC[1]); //difference in columns
  distance += Math.abs(firstRC[0] - secondRC[0]); //difference in rows

  return distance;

}
export function PositionToRowColumn(position){

  let row = Math.floor(position/6);
  let column = position%6;

  return [row, column];
}

