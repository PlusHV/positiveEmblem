import React from 'react';
import './App.css';


export default class Field extends React.Component{


  render(){
    let tbody = [];
    let cells = [];

    //Fort level
	cells.push(<td className = "statText" key = "fortLabel">Fort</td>);
	cells.push(<td className = "inputNum" key = "fortValue">
	            <input
	            className = "numberInput"
	            value = {this.props.gameState.fortLevel} 
	            type = "number" 
	            min = '-10'
	            max = '10' 
	            onChange = {(e) => this.props.fortChange(e)} 
	            />  
	      </td>);

    tbody.push(<tr key= "fortRow" >{cells}</tr>);

    let seasons = ["L1", "L2", "M1", "M2"];
    let legendary = ["Water", "Earth", "Wind", "Fire"];
    let mythic = ["Light", "Dark", "Astra", "Anima"];
    //Season Settings


    for (let i = 0; i < seasons.length; i++) {
    	cells = [];
		cells.push(<td className = "statText" key = {seasons[i]} >{seasons[i]}</td>);

		//TODO - Make it so you cannot have duplicate seasons
		let optionList = legendary;

		//for last two inputs, use mythic list
		if (i >= 2){
		   	optionList = mythic;
		}

	    let options = [];

	    for (let j = 0; j < optionList.length; j++){

	    		//Getting the list of seasons to use for the dropdowns

	    		//Checks if this season is in the list of seasons and if it is the dropdown for that found season -> if not, then disable this option to prevent dupes
	    		if (Object.values(this.props.gameState.season).includes(optionList[j]) && this.props.gameState.season[seasons[i]] !== optionList[j]) {
	            	options.push(<option disabled key = {seasons[i] + optionList[j]} value = {optionList[j]}>{optionList[j]}</option>);
	            } else {
	            	options.push(<option key = {seasons[i] + optionList[j]} value = {optionList[j]}>{optionList[j]}</option>);
	            }

		}

        cells.push(<td key = {seasons[i] + "Value"} >  
              <select value = {this.props.gameState.season[seasons[i]]}
                onChange = {(e, key) => this.props.seasonChange(e, seasons[i])} >
                {options}
              </select>
              </td>);

	    tbody.push(<tr key= {seasons[i] + "Row"} >{cells}</tr>);  
    }

    
//{this.state.team[i].id}

    return(
        <table id = "Field">
        <tbody>

        {tbody}
        </tbody>
        </table>
      );
  }
}