import React from 'react';
import Select from 'react-select-v2';

import {capitalize} from 'underscore.string';
import './App.css';

export default class Stats extends React.Component{

  render(){

	const dropDownTheme = theme => ({
	  ...theme,
	  borderRadius: 0,
	  colors: {
	    ...theme.colors,
	          primary25: 'black', // hovering 
	          primary: 'royalblue', //already selected
	          primary50: 'navy',
	          neutral0: '#212C37', //background
	          neutral80: 'silver', // text in text box
	        },
	});


  //let currentHeroInfo = heroData[this.props.gameState.selectedMember.heroID.value];


  const statText = ["hp", "atk", "spd", "def", "res" ];
  // const statNumbers = [currentHeroInfo.basehp, currentHeroInfo.baseatk, currentHeroInfo.basespd, currentHeroInfo.basedef, currentHeroInfo.baseres];
  // const statGrowths = [currentHeroInfo.growthhp, currentHeroInfo.growthatk, currentHeroInfo.growthspd, currentHeroInfo.growthdef, currentHeroInfo.growthres];


  let tbody = [];
  tbody.push(<tr key = "hero"><td colSpan = "2" className = "heroText" key = "heroText">Hero</td>
    <td colSpan = "6" key = "selectedHero"> 
    <Select
    theme = {dropDownTheme} 
    options={this.props.gameState.skillDropdowns["hero"].list}
    value={this.props.gameState.selectedMember.heroID}
  onChange = {(e) => this.props.heroChange(e)  } /> 
  </td></tr> );



  const levelText = ["level", "merge", "flower", "rarity"];
  const levelKey = ["level", "merge", "dragonflower", "rarity"];
  const min = ["1", "0", "0", "1"];
  const max = ["40", "10", "10", "5"];
  let cells = [];
  	

  	//top row containing levels for the unit
    for (let i = 0; i < levelText.length; i++) { //rows
      cells.push(<td className = "statText" key = {levelText[i] + " label"}> {capitalize(levelText[i], true)} </td>);
      cells.push(<td className = "inputNum" key = {levelText[i] + " value"}>
            <input
            className = "numberInput"
            value = {this.props.gameState.selectedMember[levelKey[i]]} 
            type = "number" 
            min = {min[i]}
            max = {max[i]} 
            onChange = {(e) => this.props.levelChange(e, levelKey[i])} 
            />  
      </td>);

    }

    tbody.push(<tr key = "levels">{cells}</tr>);


    	//stats
    	for (let i = 0; i < statText.length; i++) { //rows
	        let cells = [];

	        cells.push(<td className = "statText" key = {statText[i]} >{capitalize(statText[i], true)}</td>); //get Stat name
	       	

	        //if its hp, add the current hp input too
	       	if ( statText[i] === "hp"){

			    cells.push(<td key = "currentHP" className= "inputNum">
			        <input
	            	className = "numberInput"
	            	value = {this.props.gameState.selectedMember.currentHP} 
	            	type = "number"
	            	min = "0"
	            	max = {this.props.gameState.selectedMember.stats["hp"]}
	            	onChange = {(e) => this.props.hpChange(e)} 
	            	/>  

			       	</td>);
			    //get maxHP value
		        cells.push(<td className ="statNum" key = {statText[i] + " value"}> 
		                    {this.props.gameState.selectedMember.stats[statText[i]]}  
		                  </td>);
	       	} else { //otherwise, just leave a space after the stats
	       		//get stat value
		        cells.push(<td className ="statNum" key = {statText[i] + " value"}> 
		                    {this.props.gameState.selectedMember.stats[statText[i]]}  
		                  </td>);

		        cells.push(<td className= "spacing" key = {"space" + i}></td>);
	    	}
	        //Boon drop bane drop
	        //CurrentHP input Dragonflowers input
	        // buff, debuff, drives/spur

	        let modifiers = ["buff", "debuff", "aura", "combat"];


	        //if hp row, get modifier headers
	        if ( statText[i] === "hp"){

	        	for (let j = 0; j < modifiers.length; j++){
	        		cells.push(<td key = {modifiers[j]} className= "statText">{capitalize(modifiers[j], true)}</td>);
	        	}

	        //for rest, give corresponding modifier - buffs, debuffs, combat
	        } else{

	        	for (let j = 0; j < modifiers.length - 1; j++){
			        cells.push(<td key = {statText[i] + modifiers[j]} className= "inputNum">
			        	<input
	            		className = "numberInput"
	            		value = {this.props.gameState.selectedMember[modifiers[j]][statText[i]]} 
	            		type = "number" 
	            		onChange = {(e, index, stat) => this.props.buffChange(e, modifiers[j], statText[i])} 
	            		/>  

			        	</td>);
			    }

			    //get combat stats if hero is being dragged or dragged over
			    let combatText = "-";
			    if (this.props.gameState.draggedHero !== null && this.props.gameState.selectedMember.position === this.props.gameState.draggedHero.position){
			    	combatText = this.props.gameState.draggedHero.combatEffects.stats[statText[i]];


			    } else if (this.props.gameState.draggedOver !== null && this.props.gameState.selectedMember.position === this.props.gameState.draggedOver.position){
			    	combatText = this.props.gameState.draggedOver.combatEffects.stats[statText[i]];
			    }


			    cells.push(<td key = {statText[i] + modifiers[3]} className= "statNum">

	            	{combatText}

			        </td>);


	    	}



	    	//Assets
	    	if (statText[i] === "atk"){
	    		cells.push(<td key = "assetLabel" className= "statText">Asset</td>);

	    		let options = [];
	    		options.push(<option key = "assetNeutral" value = "neutral">Neutral</option>);
	    		for (let j = 0; j < statText.length; j++){


	    			if (this.props.gameState.selectedMember.iv.flaw === statText[j])
	    				options.push(<option key =  {"asset" + statText[j]} value = {statText[j]} disabled>{capitalize(statText[j], true)}</option>);
	    			else
	    				options.push(<option key = {"asset" + statText[j]} value = {statText[j]}>{capitalize(statText[j], true)}</option>);

	    		}
	    		cells.push(<td key = "assetValue"> 
	    				<select value = {this.props.gameState.selectedMember.iv.asset}
	    						onChange = {(e, type) => this.props.ivChange(e, "asset")} >
	    					{options}
	    				</select>
	    				</td>);



	    		//Flaw
	    	} else if (statText[i] === "def"){
	    		cells.push(<td key = "flawLabel" className= "statText">Flaw</td>);

	    		let options = [];
	    		options.push(<option key = "flawNeutral" value = "neutral">Neutral</option>);
	    		for (let j = 0; j < statText.length; j++){


	    			if (this.props.gameState.selectedMember.iv.asset === statText[j])
	    				options.push(<option key = {"flaw" + statText[j]} value = {statText[j]} disabled>{capitalize(statText[j], true)}</option>);
	    			else
	    				options.push(<option key = {"flaw" + statText[j]} value = {statText[j]}>{capitalize(statText[j], true)}</option>);


	    		}
	    		cells.push(<td key = "flawValue"> 
	    				<select value = {this.props.gameState.selectedMember.iv.flaw} 
	    						onChange = {(e, type) => this.props.ivChange(e, "flaw")} >>
	    					{options}
	    				</select>
	    				</td>);

	    		//Special
	    	} else if (statText[i] === "res"){
	    		cells.push(<td key = "specialChargeLabel" className= "statText">Special</td>);


	    		if (this.props.gameState.selectedMember.special.cd >= 0){
			    cells.push(<td key = "specialCharge" className= "inputNum">
			        <input
	            	className = "numberInput"
	            	value = {this.props.gameState.selectedMember.special.charge} 
	            	type = "number"
	            	min = "0"
	            	max = {this.props.gameState.selectedMember.special.cd}
	            	onChange = {(e) => this.props.specialChargeChange(e)} 
	            	/>  

			       	</td>);
				} else{
					cells.push(<td className= "spacing" key = {"space2" + i}></td>);
				}

	    	} else{
	    		cells.push(<td className= "spacing" key = {"doubleSpace" + i} colSpan = "2"></td>);
	    		//cells.push(<td className= "spacing" key = {"space2" + i}></td>);
	    	}

// cells.push(<td className = "inputNum" key = {levelText[i] + " value"}>
//             
	        tbody.push(<tr key={"row"+i}>{cells}</tr>);





      	}

        cells = [];
        cells.push(<td className= "spacing" key = "StatusBuffText">Status Buff</td>);

 		let options = [];
 		for (let i of Object.keys(this.props.gameState.selectedMember.statusBuff)){
 			options.push(<option key = {i} value = {i}>{capitalize(i, true)}</option>);

 		}


        cells.push(<td className= "spacing" key = "StatusBuffDrop">
					<select
							onChange = {(e, type) => this.props.selectedStatusChange(e, "statusBuff")} >>
						{options}
					</select>
        		</td>);


        let statusVal = false;

        if (this.props.gameState.selectedMember.statusBuff[this.props.gameState.selectedStatusBuff] > 0){
        	statusVal = true;
        }

        cells.push(<td className= "spacing" key = "StatusBuffCheck">
		            <input 
		            type = "checkbox"
		            value = {statusVal}
		            checked = {statusVal}
		            onChange = {(e, type) => this.props.statusChange(e, "statusBuff")}
		              />


        		</td>);

		cells.push(<td className= "spacing" key = "statusSpace1" ></td>);

        cells.push(<td className= "spacing" key = "StatusEffectText">Status Effect</td>);

        options = [];
 		for (let i of Object.keys(this.props.gameState.selectedMember.statusEffect)){
 			options.push(<option key = {i} value = {i}>{capitalize(i, true)}</option>);

 		}


        cells.push(<td className= "spacing" key = "StatusEffectDrop">
					<select
							onChange = {(e, type) => this.props.selectedStatusChange(e, "statusEffect")} >>
						{options}
					</select>
        		</td>);

		statusVal = false;

        if (this.props.gameState.selectedMember.statusEffect[this.props.gameState.selectedStatusEffect] > 0){
        	statusVal = true;
        }

        cells.push(<td className= "spacing" key = "StatusEffectCheck">
		            <input 
		            type = "checkbox"
		            value = {statusVal}
		            checked = {statusVal}
		            onChange = {(e, type) => this.props.statusChange(e, "statusEffect")}
		              />

        		</td>);
        cells.push(<td className= "spacing" key = {"statusSpace2"} colSpan = "2"></td>);

        tbody.push(<tr key={"statusRow"}>{cells}</tr>);


        cells = [];
        let status = this.props.gameState.selectedMember.statusBuff;
        let statusBuffList = [];

        for (let i in status){
        	if (status[i] > 0){
        		statusBuffList.push(capitalize(i, true));
        	}

        }

        status = this.props.gameState.selectedMember.statusEffect;
        let statusEffectList = [];

        for (let i in status){

        	//console.log(status.i);
        	if (status[i] > 0){
        		statusEffectList.push(capitalize(i, true));
        	}
        }



        cells.push(<td className= "statusText" key = {"activeStatusBuffs"} colSpan = "4">Status Buffs: {statusBuffList.toString()}</td>);
        cells.push(<td className= "statusText" key = {"activeStatusEffects"} colSpan = "5">Status Effects: {statusEffectList.toString()}</td>);


        tbody.push(<tr key={"activeStatusRow"}>{cells}</tr>);

      return (

        <div>
        <table id = "Stats" align = 'left'>
        <tbody>

        {tbody}
        </tbody>
        </table>

        </div>

        );
    }

} //end stats