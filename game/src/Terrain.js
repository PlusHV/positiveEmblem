import React from 'react';
import './App.css';


export default class Terrain extends React.Component{


  render(){
    let tbody = [];
    let cells = [];
    let terrainCells = this.props.gameState.terrainCells;

    let terrainOptions = ["Plains", "Forests", "Mountains", "Water", "Wall", "Trenches"];
    let selectedPosition = this.props.gameState.selectedPosition;
    let currentTerrain = terrainCells[selectedPosition];


	 let options = [];

    for (let i = 0; i < terrainOptions.length; i++){

    		//Getting the list of seasons to use for the dropdowns

			options.push(<option key = {terrainOptions[i]} value = {terrainOptions[i]}>{terrainOptions[i]}</option>);


		}

		cells.push(<td className = "statText" key = "terrainLabel">Terrain</td>);
	// cells.push(<td className = "inputNum" key = "terrainValue">
	//             <input
	//             className = "numberInput"
	//             value = {terrainCells[this.props.gameState.selectedPosition].terrain} 
	//             type = "number" 
	//             min = '-10'
	//             max = '10' 
	//             onChange = {(e) => this.props.fortChange(e)} 
	//             />  
	//       </td>);



    cells.push(<td key = {"terrainValue"} >  
          <select value = {currentTerrain.terrain}
            onChange = {(e, position) => this.props.terrainChange(e, selectedPosition)} >
            {options}
          </select>
          </td>);

	  tbody.push(<tr key= {"terrainRow"} >{cells}</tr>);  
    

    tbody.push( //Checkbox for resplendent/transformed row
      <tr key = {"defensiveRow"}> 
        <td className = "equipText" key = {"defensive"}>
            Defensive
        </td>

        <td className = "equippedSkill" key = {"defensiveCheckbox"}>
            <input 
            type = "checkbox"
            value = {currentTerrain.defensive}
            checked = {currentTerrain.defensive}
            onChange = {(e) => this.props.terrainDefensiveChange(e, selectedPosition)}
              />
        </td>
     

            
        
      </tr>
    );  

    //Fort level


    return(
        <table id = "Terrain">
        <tbody>

        {tbody}
        </tbody>
        </table>
      );
  }
}