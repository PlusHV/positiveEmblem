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
  tbody.push(<tr key = "hero"><td key = "heroText">Hero</td>
    <td colSpan = "5" key = "selectedHero"> 
    <Select
    theme = {dropDownTheme} 
    options={this.props.gameState.skillDropdowns["hero"].list}
    value={this.props.gameState.selectedMember.heroID}
  onChange = {(e) => this.props.heroChange(e)  } /> 
  </td></tr> );



  const levelText = ["level", "merge", "dragonflower", "rarity"];
  let cells = [];
    for (let i = 0; i < levelText.length; i++) { //rows
      cells.push(<td key = {levelText[i] + " label"}> {capitalize(levelText[i], true)} </td>);
      cells.push(<td className = "statNum" key = {levelText[i] + " value"}>
            <input
            className = "numberInput"
            value = {this.props.gameState.selectedMember[levelText[i]]} 
            type = "number" 
            min = "0" 
            max = "40" 
            onChange = {(e) => this.props.levelChange(e, levelText[i])} 
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

        cells.push(<td className= "spacing" key = {i}></td>);

        //Boon drop bane drop
        //CurrentHP input Dragonflowers input
        // buff, debuff, drives/spur 
        cells.push(<td key = "123" className= "spacing"></td>);
        cells.push(<td key = "234" className= "spacing"></td>);
        cells.push(<td key = "345" className= "spacing"></td>);


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