import React from 'react';
import './App.css';
import heroData from './heroInfo.json';
import { getDamageType, getAttackCount, getAttackOrder, calculateDamage} from './Battle.js';
import {calculateCombatStats} from './StatCalculation.js';

export default class BattleWindow extends React.Component{

	render(){
    	
	    let tbody = [];
	    let cells = [];

	    let dragged = this.props.gameState.draggedHero; //the attacker
	    let draggedOver = this.props.gameState.draggedOver; // the defender




		let aArt = "Blank";
		let dArt = "Blank";
		let aClass = "forecastHero";
		let dClass = "forecastHero";
		let aOrgHP = 0;
		let aNewHP = 0;
		let aOrgSpecial = -10;
		let aNewSpecial = -10;

		let dOrgHP = 0;
		let dNewHP = 0;
		let dOrgSpecial = -10;
		let dNewSpecial = -10;

		let aDmg = {"damage": "-"};
		let aDmgHits = [];
		let aCount = 0;
		let aSpecial = {};

		let dDmg = {"damage": "-"};
		let dCount = 0;
	   	let dDmgHits = [];
	   	let dSpecial = {};

	   	let preBattleDmg = this.props.gameState.preBattleDamage;

	    //TODO - Show aoe damage(on defender in the forecast) and needs to show markings on board?


	    if (dragged !== null && draggedOver !== null && dragged.side !== draggedOver.side){

	    	let attacker = Object.assign({}, dragged);
	    	let defender = Object.assign({}, draggedOver);

	    	aArt = heroData[attacker.heroID.value].art;
	    	dArt = heroData[defender.heroID.value].art;


	    	aOrgHP =  aNewHP = attacker.currentHP;

	    	dOrgHP =  this.props.gameState.draggedOverOriginalHP;
	    	dNewHP = defender.currentHP;

	    	aSpecial = Object.assign({}, attacker.special);
	    	dSpecial = Object.assign({}, defender.special);

	    	aOrgSpecial = aSpecial.charge;
	    	dOrgSpecial = dSpecial.charge;

		    let attackerType = getDamageType(heroData[attacker.heroID.value].weapontype, attacker, defender);
		    let defenderType = getDamageType(heroData[defender.heroID.value].weapontype, defender, attacker);


		    let attackCount = getAttackCount(attacker, defender);
		    aCount = attackCount[0];
		    dCount = attackCount[1];

		    let attackerSpecialActivated = false;
		    let defenderSpecialActivated = false;

		    if (attacker.specialActivated){ //check if pre battle special used
		    	attackerSpecialActivated = true;
		    }

		    let attackStack = getAttackOrder(attackCount, attacker, defender);


		    if (aCount > 0){
		    	
			}

			if (dCount > 0) {
		    	
		    }


		    if (preBattleDmg >= 0){
		    	aDmgHits.push(preBattleDmg);
		    }

		    attacker.combatStats = calculateCombatStats(attacker, defender);
		    defender.combatStats = calculateCombatStats(defender, attacker);

		    let attackIndex = 0;
		    while (attackIndex < attackStack.length && attacker.currentHP > 0 && defender.currentHP > 0){
		      let temp = attackStack[attackIndex];

		      if (temp === 1){

		      	aDmg = calculateDamage(attacker, defender, attackerType, aSpecial, dSpecial, this.props.gameState.heroList, attackStack, attackIndex);

		      	aSpecial.charge = aDmg.attackerSpecialCharge;

		      	dSpecial.charge = aDmg.defenderSpecialCharge;



		        defender.currentHP = Math.max(0, defender.currentHP - aDmg.damage);


		        attacker.currentHP = Math.min(attacker.stats.hp, attacker.currentHP + aDmg.heal);

		        if (defender.effects.reflect === 0){ //only get reflect damage if it is not currently set so it can't be overwritten
		        	defender.effects.reflect = aDmg.reflect;
		        }

		        aDmgHits.push(aDmg.damage);

		        if (aDmg.attackerSpecialActivated){
		          attackerSpecialActivated = true;
		        }

		        if (aDmg.defenderSpecialActivated){
		          defenderSpecialActivated = true;
		        }

		      } else if (temp === 2){
		      	dDmg = calculateDamage(defender, attacker, defenderType, dSpecial, aSpecial, this.props.gameState.heroList, attackStack, attackIndex);

		      	dSpecial.charge = dDmg.attackerSpecialCharge;

		      	aSpecial.charge = dDmg.defenderSpecialCharge;


		        attacker.currentHP = Math.max(0, attacker.currentHP - dDmg.damage);

		        defender.currentHP = Math.min(defender.stats.hp, defender.currentHP + dDmg.heal);

		        defender.effects.reflect = 0; //they have attacked, so any reflect damage should be cleared

		        dDmgHits.push(dDmg.damage);

		        if (dDmg.attackerSpecialActivated){
		          defenderSpecialActivated = true;
		        }

		        if (dDmg.defenderSpecialActivated){
		          attackerSpecialActivated = true;
		        }

		      }
		      attackIndex++;

		    }

		    if (attacker.currentHP === 0 ){
		    	aClass = "forecastHeroGrey";
		    }

		    if (defender.currentHP === 0 ){
		    	dClass = "forecastHeroGrey";
		    }


		    if (attackerSpecialActivated && attacker.combatEffects.spiral > 0){ //should also check for not postbattle special i guess
		      aSpecial.charge = Math.max(0, aSpecial.charge - attacker.combatEffects.spiral);
		    }

		    if (defenderSpecialActivated && defender.combatEffects.spiral > 0){
		      dSpecial.charge = Math.max(0, dSpecial.charge - defender.combatEffects.spiral);
		    }


		    aNewHP = attacker.currentHP;
		    dNewHP = defender.currentHP;

		    aNewSpecial = aSpecial.charge;
		    dNewSpecial = dSpecial.charge;



	    }




	    //portrait
	    cells.push(<td rowSpan = "2" key = "aPortrait"> 
                <img src= {require('./art/' +  aArt + '/Face_FC.png') } 
                    className = {aClass} 
                    alt = {aArt}
                    draggable = "false"/>
	    	</td>);


	    cells.push(<td align = "center" key = "aHP">
	    	{aOrgHP} -> {aNewHP}
	    	</td>);

	    cells.push(<td align = "center" key = "HPLabel">
	    	HP
	    	</td>);


	    cells.push(<td align = "center" key = "dHP">
	    	{dOrgHP} -> {dNewHP}
	    	</td>);



	    //portrait
	    cells.push(<td rowSpan = "2" align = "center" key = "dPortait">
                <img src= {require('./art/' +  dArt + '/Face_FC.png') } 
                    className = {dClass}
                    alt = {dArt}
                    draggable = "false"/>
	    	</td>);

	    tbody.push(<tr key= "battleRow1" >{cells}</tr>);


	    //Might put special charges here?
	    cells = [];

	    let aSpecialText = "-";
	    let dSpecialText = "-";

	    if (aOrgSpecial >= 0 && aNewSpecial >= 0){
	    	aSpecialText = aOrgSpecial + " -> " + aNewSpecial;
	    }

	    if (dOrgSpecial >= 0 && dNewSpecial >= 0){
	    	dSpecialText = dOrgSpecial + " -> " + dNewSpecial;
	    }

	    cells.push(<td align = "center" key = "aSpecial">
	    	{aSpecialText}
	    	</td>);
	    cells.push(<td align = "center" key = "SpecialLabel">
	    	SPEC
	    	</td>);


	    cells.push(<td align = "center" key = "dSpecial">
	    	{dSpecialText}
	    	</td>);


	    tbody.push(<tr key= "battleRow2" >{cells}</tr>);


	    //show damage from each hit
	    cells = [];

	    let aDmgText = "-";
	    let dDmgText = "-";

	    //list the damage hits
	    for (let i =0; i < aDmgHits.length; i++){
	    	
	    	if (i === 0){
	    		aDmgText = aDmgHits[i];
	    	} else {
	    		aDmgText = aDmgText + "+" + aDmgHits[i];
	    	}

	    }

	    for (let i=0; i < dDmgHits.length; i++){
	    	
	    	if (i === 0){
	    		dDmgText = dDmgHits[i];
	    	} else {
	    		dDmgText = dDmgText + "+" + dDmgHits[i];
	    	}

	    }


	    cells.push(<td colSpan = "2" align = "center" key = "aDamage">
	    	{aDmgText}
	    	</td>);

	    cells.push(<td align = "center" key = "DamageLabel">
			DMG
	    	</td>);


	    cells.push(<td colSpan = "2" align = "center" key = "dDamage">
	    	{dDmgText}
	    	</td>);

	    tbody.push(<tr key = "battleRow3" >{cells}</tr>);

    	return(
	        <table key = "Battle">
	        <tbody>

	        {tbody}
	        </tbody>
	        </table>
	    );
    }
}

