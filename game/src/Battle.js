import heroData from './heroInfo.json';

export function DoBattle(updatedHeroList, attacker, defender){
    let list = updatedHeroList;

    let newAttacker = attacker.currentHP;
    let newDefender = defender.currentHP;

    let attackerType = GetDamageType(heroData[attacker.heroID.value].weapontype);
    let defenderType = GetDamageType(heroData[defender.heroID.value].weapontype);
    //aDmgType = 

    let attackCount = GetAttackCount(attacker, defender);

    let attackStack = GetAttackOrder(attackCount);


    while (attackStack.length > 0 && newAttacker > 0 && newDefender > 0){
      let temp = attackStack.shift();
      let damage = 0;
      if (temp === 1){
        damage = CalculateDamage(attacker, defender, attackerType);

        newDefender = Math.max(0, newDefender - damage);

      } else if (temp === 2){
        damage = CalculateDamage(defender, attacker, defenderType);

        newAttacker = Math.max(0, newAttacker - damage);
      }

    }

    list[attacker.side][attacker.listIndex].currentHP = newAttacker;
    list[defender.side][defender.listIndex].currentHP = newDefender;
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

export function CalculateDamage(attacker, defender, damageType){

	let WTA = CalculateWeaponTriangleAdvantage(heroData[attacker.heroID.value].color, heroData[defender.heroID.value].color );

    return attacker.stats.atk + Math.floor(attacker.stats.atk * WTA) - defender.stats[damageType];


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