import React from 'react';
import './App.css';
import heroData from './heroInfo.json';
import { getDamageType, getAttackCount, getAttackOrder, postCombat, calculateDamage} from './Battle.js';
import {calculateCombatStats} from './StatCalculation.js';
import {addEffect} from './GameBoard.js'

export default class BattleWindow extends React.Component{

	render(){
    	
	    let tbody = [];
	    let cells = [];

	    let dragged =  JSON.parse(JSON.stringify(this.props.gameState.draggedHero));// this.props.gameState.draggedHero; //the attacker
	    let draggedOver = JSON.parse(JSON.stringify(this.props.gameState.draggedOver)); // this.props.gameState.draggedOver; // the defender

	    let battleList = JSON.parse(JSON.stringify(this.props.gameState.heroList));
	    let board = JSON.parse(JSON.stringify(this.props.gameState.cells));

		let aArt = './art/Blank/Face_FC.png';
		let dArt = './art/Blank/Face_FC.png';
		let aClass = "forecastHero";
		let dClass = "forecastHero";

		let aOrgHP = 0;
		let aNewHP = 0;
		let aPostHP = 0;
		let aOrgSpecial = -10;
		let aNewSpecial = -10;


		let dOrgHP = 0;
		let dNewHP = 0;
		let dPostHP = 0;
		let dOrgSpecial = -10;
		let dNewSpecial = -10;

		let aDmg = {"damage": "-"};
		let aDmgHits = [];
		let aCount = 0;
		let aSpecial = {};
		let aMiracle = false;
		let aPostDamage = 0;

		let dDmg = {"damage": "-"};
		let dCount = 0;
	   	let dDmgHits = [];
	   	let dSpecial = {};
	   	let dMiracle = false;
	   	let dPostDamage = 0;

	   	let preBattleDmg = this.props.gameState.preBattleDamage;

	   	let preBattleMod = 0; //uses dmg hits to check for attacks, this is an extra value to check if prebattle damage is done so it can be discounted in the attack check
	    //TODO - Show aoe damage(on defender in the forecast) and needs to show markings on board?

	    if (dragged !== null && draggedOver !== null && dragged.side !== draggedOver.side) {
		    if (draggedOver.type === "hero"){

		    	let attacker = dragged;//Object.assign({}, dragged);
		    	let defender = draggedOver;//Object.assign({}, draggedOver);

		    	aArt = './art/' + heroData[attacker.heroID.value].art + '/Face_FC.png';

	
			    dArt = './art/' + heroData[defender.heroID.value].art + '/Face_FC.png';
	

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

			    let aSubEffect = [];
			    let dSubEffect = [];

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
			    	preBattleMod = 1;
			    }

			    attacker.combatStats = calculateCombatStats(attacker, defender);
			    defender.combatStats = calculateCombatStats(defender, attacker);

			    let attackIndex = 0;
			    while (attackIndex < attackStack.length && attacker.currentHP > 0 && defender.currentHP > 0){
			      let temp = attackStack[attackIndex];

			      if (temp === 1){

			      	aDmg = calculateDamage(attacker, defender, attackerType, aSpecial, dSpecial, this.props.gameState.heroList, attackStack, attackIndex, dMiracle, this.props.gameState);

			      	aSpecial.charge = aDmg.attackerSpecialCharge;

			      	dSpecial.charge = aDmg.defenderSpecialCharge;

			      	if (aDmg.miracleActivated){
			      		dMiracle = aDmg.miracleActivated;
			      	}
			        defender.currentHP = Math.max(0, defender.currentHP - aDmg.damage);

			        if (attacker.statusEffect.deepWounds < 1){
			        	attacker.currentHP = Math.min(attacker.stats.hp, attacker.currentHP + aDmg.heal);
			        }

			        if (defender.combatEffects.reflect === 0){ //only get reflect damage if it is not currently set so it can't be overwritten
			        	defender.combatEffects.reflect = aDmg.reflect;
			        }

			        if (attacker.combatEffects.reflect !== 0){
			        	attacker.combatEffects.reflect = 0;
			        }

			        aDmgHits.push(aDmg.damage);

			        if (aDmg.attackerSpecialActivated){
			        	aSubEffect = aDmg.subEffect;
			        	attackerSpecialActivated = true;
			        }

			        if (aDmg.defenderSpecialActivated){
						defenderSpecialActivated = true;
			        }

			      } else if (temp === 2){
			      	dDmg = calculateDamage(defender, attacker, defenderType, dSpecial, aSpecial, this.props.gameState.heroList, attackStack, attackIndex, aMiracle, this.props.gameState);

			      	dSpecial.charge = dDmg.attackerSpecialCharge;

			      	aSpecial.charge = dDmg.defenderSpecialCharge;


			      	if (dDmg.miracleActivated){
			      		aMiracle = dDmg.miracleActivated;
			      	}

			        attacker.currentHP = Math.max(0, attacker.currentHP - dDmg.damage);


			        if (defender.statusEffect.deepWounds < 1){
			        	defender.currentHP = Math.min(defender.stats.hp, defender.currentHP + dDmg.heal);
			        }


			        if (attacker.combatEffects.reflect === 0){ //only get reflect damage if it is not currently set so it can't be overwritten
			        	attacker.combatEffects.reflect = dDmg.reflect;
			        }

			        if (defender.combatEffects.reflect !== 0){
			        	defender.combatEffects.reflect = 0;
			        }
			        dDmgHits.push(dDmg.damage);

			        if (dDmg.attackerSpecialActivated){
			        	dSubEffect = dDmg.subEffect;
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




			    //damage after battles
			    aNewHP = attacker.currentHP;
			    dNewHP = defender.currentHP;

			    aNewSpecial = aSpecial.charge;
			    dNewSpecial = dSpecial.charge;


			    addEffect(attacker, aSubEffect);
	    		addEffect(defender, dSubEffect);

	    		//combat has now ended, post combat effects activate
	    		let attackerAttacked = false;
	    		let defenderAttacked = false;

			    if (aDmgHits.length >= 1 + preBattleMod){ //at least one attack was done, if pre battle damage was done, then require another attack
			    	attackerAttacked = true;

			    }

			    if (dDmgHits.length >= 1){
			    	defenderAttacked = true;

			    }


	    		let postCombatInfo = postCombat(battleList, attacker, defender, board, attackerAttacked, defenderAttacked, attackerSpecialActivated, defenderSpecialActivated, this.props.gameState.currentTurn, this.props.gameState.structureList);

			    //let attackerTeamPost = postCombatInfo.attackerTeamPost;
			    //let defenderTeamPost = postCombatInfo.defenderTeamPost;

			    let attackerTeamSpecial = postCombatInfo.attackerTeamSpecial;
			    let defenderTeamSpecial = postCombatInfo.defenderTeamSpecial;

			    let attackerPostDamage = postCombatInfo.attackerPostDamage;
			    let defenderPostDamage = postCombatInfo.defenderPostDamage;


	    		if (attackerPostDamage !== 0){
	    			aPostDamage = attackerPostDamage;
	    		}

	    		if (defenderPostDamage !== 0){
	    			dPostDamage = defenderPostDamage;
	    		}


	    		if (attackerTeamSpecial[attacker.listIndex] === "reset"){
	    			aNewSpecial = attacker.special.cd;
	    		} else {
	    			aNewSpecial = Math.min(Math.max(0, aNewSpecial - attackerTeamSpecial[attacker.listIndex]), attacker.special.cd);
	    		}

	    		if (defenderTeamSpecial[defender.listIndex] === "reset"){
	    			dNewSpecial = defender.special.cd;
	    		} else {
	    			dNewSpecial = Math.min(Math.max(0, dNewSpecial - defenderTeamSpecial[attacker.listIndex]), defender.special.cd);
	    		}



			    if (aNewHP > 0){
			      aPostHP = Math.min(Math.max(1, aNewHP - aPostDamage), attacker.stats.hp); //cannot go below 0 from post battle damage and hp is capped
			    }
			    if (dNewHP > 0){
			      dPostHP = Math.min(Math.max(1, dNewHP - dPostDamage), defender.stats.hp); //cannot go below 0 from post battle damage and hp is capped
			    }

		    } else if (draggedOver.type === "structure"){

		    	let attacker = dragged;//Object.assign({}, dragged);
		    	let defender = draggedOver;//Object.assign({}, draggedOver);

		    	aArt = './art/' + heroData[attacker.heroID.value].art + '/Face_FC.png';;
		    	dArt = './UI/Structures/' + defender.art + '/Default.png';

				aOrgHP =  aNewHP = attacker.currentHP;

		    	dOrgHP =  defender.currentHP
		    	dNewHP = Math.max(defender.currentHP - 1, 0); //shouldn't be able to attack if 0 hp but we'll still prevent it going negative

		    	aNewSpecial = aOrgSpecial = aSpecial.charge;
		    	dNewSpecial = dOrgSpecial = dSpecial.charge;

		    	
			    dCount = 0;
			    if (dOrgHP > 0){
			    	aCount = 1;
			    	aDmgHits.push(1);
				}
				
			    if (attacker.currentHP === 0 ){
			    	aClass = "forecastHeroGrey";
			    }

			    if (defender.currentHP === 0 ){
			    	dClass = "forecastHeroGrey";
			    }
			    aPostHP = aNewHP;
			    dPostHP = dNewHP;

		    }
		}



	    //portrait
	    cells.push(<td rowSpan = "2" key = "aPortrait"> 
                <img src= {require('' + aArt) } 
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
                <img src= {require('' + dArt) } 
                    className = {dClass}
                    alt = {dArt}
                    draggable = "false"/>
	    	</td>);

	    tbody.push(<tr key= "battleRow1" >{cells}</tr>);


	    //Specials
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


	    //show post damage
	    cells = [];

	    let aPostDmgText = "-";
	    let dPostDmgText = "-";


	    if (aPostDamage !== 0){
	    	aPostDmgText = aPostDamage;
	    }

	    if (dPostDamage !==0){
	    	dPostDmgText = dPostDamage;
	    }


	    cells.push(<td colSpan = "2" align = "center" key = "aPostDamage">
	    	{aPostDmgText}
	    	</td>);

	    cells.push(<td align = "center" key = "PostLabel">
			POST
	    	</td>);


	    cells.push(<td colSpan = "2" align = "center" key = "dPostDamage">
	    	{dPostDmgText}
	    	</td>);

	    tbody.push(<tr key = "battleRow4" >{cells}</tr>);

	    //show post hp
	    cells = [];

	    let aPostHPText = "-";
	    if (aPostHP !== aNewHP){
	    	aPostHPText = aNewHP + " -> " + aPostHP;
	    }

	    let dPostHPText = "-";
	    if (dPostHP !== dNewHP){
	    	dPostHPText = dNewHP + " -> " + dPostHP;
	    }

	    if (aPostDamage !== 0){
	    	aPostDmgText = aPostDamage;
	    }

	    if (dPostDamage !==0){
	    	dPostDmgText = dPostDamage;
	    }


	    cells.push(<td colSpan = "2" align = "center" key = "aPostHP">
	    	{aPostHPText}
	    	</td>);

	    cells.push(<td align = "center" key = "HPPostLabel">
			HPPOST
	    	</td>);


	    cells.push(<td colSpan = "2" align = "center" key = "dPostHP">
	    	{dPostHPText}
	    	</td>);

	    tbody.push(<tr key = "battleRow5" >{cells}</tr>);

    	return(
	        <table key = "Battle">
	        <tbody>

	        {tbody}
	        </tbody>
	        </table>
	    );
    }
}

