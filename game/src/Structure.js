import React from 'react';
import './App.css';
import structureInfo from './structureInfo.json';

export default class Structure extends React.Component{


  render(){
    let tbody = [];
    let cells = [];
    let mapCells = this.props.gameState.cells;

    let selectedPosition = this.props.gameState.selectedPosition;
    let currentlySelected = mapCells[selectedPosition];

    let structureDisabled = true;

    let currentStructure = JSON.parse(JSON.stringify(structureInfo["0"])); //use default values


    if (currentlySelected === null ){ //if empty then selecting a structure will fill the space with one
      structureDisabled = false; //we still use default structure
    } else if (currentlySelected.type !== "hero") { //if a structure is already in the space, then we can edit the currently selected structure
      structureDisabled = false; 
      currentStructure = JSON.parse(JSON.stringify(currentlySelected)); //copy the structure
    }




	   let options = [];

    for (let i = 0; i < Object.keys(structureInfo).length; i++){

    		//Getting the list of seasons to use for the dropdowns

			options.push(<option key = {"structure " + i} value = {i.toString()}>{structureInfo[i].name}</option>);


		}

		cells.push(<td className = "statText" key = "structureLabel">Structure</td>);

    if (currentlySelected === null){ //no structure
    cells.push(<td key = {"structureValue"} >  
          <select value = {currentStructure.id.toString()}
            onChange = {(e, position) => this.props.addStructure(e, selectedPosition)} >
            {options}
          </select>
          </td>);

    } else if (structureDisabled){ //hero is in space - disable structure options
    cells.push(<td key = {"structureValue"} >  
          <select disabled value = {currentStructure.id.toString()}>
            {options}
          </select>
          </td>);

    } else {  //structure in space, allow changes
    cells.push(<td key = {"structureValue"} > 
          <select value = {currentStructure.id.toString()}
            onChange = {(e, position) => this.props.structureChange(e, "structureType", selectedPosition)} >
            {options}
          </select>
          </td>);
    } 

	  tbody.push(<tr key= {"structureRow"} >{cells}</tr>);  
    
    cells = [];

  cells.push(<td className = "statText" key = "structureLevelLabel">Level</td>);

  if (currentlySelected === null || structureDisabled){ 
    cells.push(<td className = "inputNum" key = "structureLevelValue">
              <input
              disabled
              className = "numberInput"
              value = {currentStructure.level} 
              type = "number" 
              min = '0' 
              />  
        </td>);
  } else {
    cells.push(<td className = "inputNum" key = "structureLevelValue">
                <input
                className = "numberInput"
                value = {currentStructure.level} 
                type = "number" 
                min = '0'
                max = {currentStructure.maxLevel.toString()}
                onChange = {(e) => this.props.structureChange(e, "level", selectedPosition)} 
                />  
          </td>);
  }


  tbody.push(<tr key= {"structureLevelRow"} >{cells}</tr>);  


    cells = [];

  cells.push(<td className = "statText" key = "structureSideLabel">Side</td>);

  if (currentlySelected === null || structureDisabled || currentStructure.neutral){ 
    cells.push(<td className = "inputNum" key = "structureSideValue">
                <input
                disabled
                className = "numberInput"
                value = {parseInt(currentStructure.side) } 
                type = "number" 
                min = '0' 
                max = '3'
                onChange = {(e) => this.props.structureChange(e, "side", selectedPosition)} 
                />  
          </td>);

  } else {
    cells.push(<td className = "inputNum" key = "structureSideValue">
                <input
                className = "numberInput"
                value = {parseInt(currentStructure.side) } 
                type = "number" 
                min = '1' 
                max = '2'
                onChange = {(e) => this.props.structureChange(e, "side", selectedPosition)} 
                />  
          </td>);
  }

  tbody.push(<tr key= {"structureSideRow"} >{cells}</tr>);  
    cells = [];

  cells.push(<td className = "statText" key = "structureHPLabel">HP</td>);

  if (currentlySelected === null || structureDisabled){

    cells.push(<td className = "inputNum" key = "strucutureHPValue">
                <input
                disabled
                className = "numberInput"
                value = {currentStructure.currentHP} 
                type = "number" 
                min = '0' 
                max = {currentStructure.maxHP}
                onChange = {(e) => this.props.structureChange(e, "currentHP", selectedPosition)} 
                />  
          </td>);
  } else {
    cells.push(<td className = "inputNum" key = "strucutureHPValue">
                <input
                className = "numberInput"
                value = {currentStructure.currentHP} 
                type = "number" 
                min = '0' 
                max = {currentStructure.maxHP}
                onChange = {(e) => this.props.structureChange(e, "currentHP", selectedPosition)} 
                />  
          </td>);
  }

  tbody.push(<tr key= {"structureHPRow"} >{cells}</tr>);  
    //Fort level


    return(
        <table id = "Structure">
        <tbody>

        {tbody}
        </tbody>
        </table>
      );
  }
}