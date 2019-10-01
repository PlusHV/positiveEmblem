import React from 'react';
import Select from 'react-select-v2';

import {capitalize} from 'underscore.string';
import './App.css';

export default class Stats extends React.Component{

  render(){
  	console.log(this.props.gameState.selectedMember);
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


    	for (let i = 0; i < statText.length; i++) { //rows
	        let cells = [];

	        cells.push(<td className = "statText" key = {statText[i]} >{capitalize(statText[i], true)}</td>);
	       
	        cells.push(<td className ="statNum" key = {statText[i] + " value"}>
	                    {this.props.gameState.selectedMember.stats[statText[i]]}  
	                  </td>);

	        cells.push(<td className= "spacing" key = {"space" + i}></td>);

	        //Boon drop bane drop
	        //CurrentHP input Dragonflowers input
	        // buff, debuff, drives/spur

	        let modifiers = ["buff", "debuff", "combat"];

	        if ( statText[i] === "hp"){

	        	for (let j = 0; j < modifiers.length; j++){
	        		cells.push(<td key = {modifiers[j]} className= "statText">{capitalize(modifiers[j], true)}</td>);
	        	}

	        } else{

	        	for (let j = 0; j < modifiers.length; j++){
			        cells.push(<td key = {statText[i] + modifiers[j]} className= "inputNum">
			        	<input
	            		className = "numberInput"
	            		value = {this.props.gameState.selectedMember[modifiers[j]][statText[i]]} 
	            		type = "number" 
	            		onChange = {(e, index, stat) => this.props.buffChange(e, modifiers[j], statText[i])} 
	            		/>  

			        	</td>);
			    }
	    	}

	    	if (statText[i] === "atk"){
	    		cells.push(<td key = "assetLabel" className= "statText">Asset</td>);

	    		let options = [];
	    		options.push(<option value = "neutral">Neutral</option>);
	    		for (let j = 0; j < statText.length; j++){


	    			if (this.props.gameState.selectedMember.iv.flaw === statText[j])
	    				options.push(<option value = {statText[j]} disabled>{capitalize(statText[j], true)}</option>);
	    			else
	    				options.push(<option value = {statText[j]}>{capitalize(statText[j], true)}</option>);

	    		}
	    		cells.push(<td key = "assetValue"> 
	    				<select value = {this.props.gameState.selectedMember.iv.asset}
	    						onChange = {(e, type) => this.props.ivChange(e, "asset")} >
	    					{options}
	    				</select>
	    				</td>);




	    	} else if (statText[i] === "def"){
	    		cells.push(<td key = "flawLabel" className= "statText">Flaw</td>);

	    		let options = [];
	    		options.push(<option value = "neutral">Neutral</option>);
	    		for (let j = 0; j < statText.length; j++){


	    			if (this.props.gameState.selectedMember.iv.asset === statText[j])
	    				options.push(<option value = {statText[j]} disabled>{capitalize(statText[j], true)}</option>);
	    			else
	    				options.push(<option value = {statText[j]}>{capitalize(statText[j], true)}</option>);


	    		}
	    		cells.push(<td key = "flawValue"> 
	    				<select value = {this.props.gameState.selectedMember.iv.flaw} 
	    						onChange = {(e, type) => this.props.ivChange(e, "flaw")} >>
	    					{options}
	    				</select>
	    				</td>);


	    	} else{
	    		cells.push(<td className= "spacing" key = {"space1" + i}></td>);
	    		cells.push(<td className= "spacing" key = {"space2" + i}></td>);
	    	}

// cells.push(<td className = "inputNum" key = {levelText[i] + " value"}>
//             
	        tbody.push(<tr key={"row"+i}>{cells}</tr>);
      	}


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