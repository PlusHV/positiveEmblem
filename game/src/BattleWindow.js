import React from 'react';
import './App.css';
import heroData from './heroInfo.json';
import { GetDamageType, GetAttackCount, GetAttackOrder, CalculateDamage} from './Battle.js';

export default class BattleWindow extends React.Component{

	render(){
    	
	    let tbody = [];
	    let cells = [];

	    let attacker = this.props.gameState.draggedHero; 
	    let defender = this.props.gameState.draggedOver;



		let aArt = "Blank";
		let dArt = "Blank";
		let aClass = "forecastHero";
		let dClass = "forecastHero";
		let aOrgHP = 0;
		let aNewHP = 0;
		let dOrgHP = 0;
		let dNewHP = 0;
		let aDmg = "-";
		let aCount = 0;
		let dDmg = "-";
		let dCount = 0;


	    if (attacker !== null && defender !== null && attacker.side !== defender.side){
	    	aArt = heroData[attacker.heroID.value].art;
	    	dArt = heroData[defender.heroID.value].art;


	    	aOrgHP =  aNewHP = attacker.currentHP;
	    	dOrgHP =  dNewHP = defender.currentHP;

		    let attackerType = GetDamageType(heroData[attacker.heroID.value].weapontype);
		    let defenderType = GetDamageType(heroData[defender.heroID.value].weapontype);
		    //aDmgType = 

		    let attackCount = GetAttackCount(attacker, defender);
		    aCount = attackCount[0];
		    dCount = attackCount[1];


		    let attackStack = GetAttackOrder(attackCount);


		    if (aCount > 0){
		    	aDmg = CalculateDamage(attacker, defender, attackerType);
			}

			if (dCount > 0) {
		    	dDmg = CalculateDamage(defender, attacker, defenderType);
		    }



		    while (attackStack.length > 0 && aNewHP > 0 && dNewHP > 0){
		      let temp = attackStack.shift();

		      if (temp === 1){

		        dNewHP = Math.max(0, dNewHP - aDmg);

		      } else if (temp === 2){

		        aNewHP = Math.max(0, aNewHP - dDmg);
		      }

		    }

		    if (aNewHP === 0 ){
		    	aClass = "forecastHeroGrey";
		    }

		    if (dNewHP === 0 ){
		    	dClass = "forecastHeroGrey";
		    }



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


	    cells = [];

	    cells.push(<td align = "center" key = "aDamage">
	    	{aDmg + GetDoubleText(aCount)}
	    	</td>);
	    cells.push(<td key = "DamageLabel">
	    	DMG
	    	</td>);


	    cells.push(<td align = "center" key = "dDamage">
	    	{dDmg + GetDoubleText(dCount)}
	    	</td>);


	    tbody.push(<tr key= "battleRow2" >{cells}</tr>);

    	return(
	        <table key = "Battle">
	        <tbody>

	        {tbody}
	        </tbody>
	        </table>
	    );
    }
}

function GetDoubleText(count){
	if (count === 2){
		return "x2";
	} else{
		return "";
	}
}