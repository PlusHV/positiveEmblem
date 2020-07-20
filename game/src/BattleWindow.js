import React from 'react';
import './App.css';
import heroData from './heroInfo.json';
import { GetDamageType, GetAttackCount, GetAttackOrder, CalculateDamage} from './Battle.js';
import {CalculateCombatStats} from './StatCalculation.js';

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

		    let attackerType = GetDamageType(heroData[attacker.heroID.value].weapontype);
		    let defenderType = GetDamageType(heroData[defender.heroID.value].weapontype);
		    //aDmgType = 

		    let attackCount = GetAttackCount(attacker, defender);
		    aCount = attackCount[0];
		    dCount = attackCount[1];


		    let attackStack = GetAttackOrder(attackCount);


		    if (aCount > 0){
		    	
			}

			if (dCount > 0) {
		    	
		    }


		    if (preBattleDmg >= 0){
		    	aDmgHits.push(preBattleDmg);
		    }

		    attacker.combatStats = CalculateCombatStats(attacker);
		    defender.combatStats = CalculateCombatStats(defender);


		    while (attackStack.length > 0 && attacker.currentHP > 0 && defender.currentHP > 0){
		      let temp = attackStack.shift();

		      if (temp === 1){

		      	aDmg = CalculateDamage(attacker, defender, attackerType, aSpecial, dSpecial);

		      	aSpecial.charge = aDmg.attackerSpecialCharge;

		      	dSpecial.charge = aDmg.defenderSpecialCharge;



		        defender.currentHP = Math.max(0, defender.currentHP - aDmg.damage);
		        aDmgHits.push(aDmg.damage);

		      } else if (temp === 2){
		      	dDmg = CalculateDamage(defender, attacker, defenderType, dSpecial, aSpecial);

		      	dSpecial.charge = dDmg.attackerSpecialCharge;

		      	aSpecial.charge = dDmg.defenderSpecialCharge;


		        attacker.currentHP = Math.max(0, attacker.currentHP - dDmg.damage);
		        dDmgHits.push(dDmg.damage);

		      }

		    }

		    if (attacker.currentHP === 0 ){
		    	aClass = "forecastHeroGrey";
		    }

		    if (defender.currentHP === 0 ){
		    	dClass = "forecastHeroGrey";
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

// function GetDoubleText(count){
// 	if (count === 2){
// 		return "x2";
// 	} else{
// 		return "";
// 	}
// }