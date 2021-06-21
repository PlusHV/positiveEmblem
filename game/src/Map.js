import React from 'react';
import './App.css';
import heroData from './heroInfo.json';

export default class Map extends React.Component{
	
	render(){

    let highLightedCell = this.props.gameState.heroList[this.props.gameState.playerSide][this.props.gameState.heroIndex].position; 


    // rename  this to a map

    let tbody = [];
    for (let i = 0; i < 8; i++) { //rows
      let cells = [];
        for (let j = 0; j < 6; j++) { //columns
          const id = 6 * i + j;
          //if (this.props.gameState.cells[id] != null){
            let cellClass = "cellStyle";

            if ( this.props.gameState.anchorPosition === id && !this.props.gameState.freeMove){
              cellClass = "anchorPositionCellStyle";
            } else if ( this.props.gameState.availableMovement.includes(id) && !this.props.gameState.freeMove){
              cellClass = "movementCellStyle";
            } else if (id  === highLightedCell){
				      cellClass = "highlightedCellStyle";
            } else if ( this.props.gameState.availableAssist.includes(id)){
				      cellClass =  "assistCellStyle";
            } else if ( this.props.gameState.availableAttack.includes(id)){
				      cellClass =  "attackCellStyle";
            } else if ( this.props.gameState.availableWarp.includes(id) && !this.props.gameState.freeMove){
            	cellClass = "warpCellStyle";
            }
            
            let positions = this.props.filledPositions();

            if (positions.includes(id)){ //if it has a person in the cell
              //onDrop = {(e) => this.dropBoardMember(e)} >
              var imgClass = "heroFace";
              if (this.props.gameState.cells[id].end === true){
                imgClass = "waitHeroFace";
              }


              var currentCharge = this.props.gameState.cells[id].special.charge;
              if (currentCharge < 0){
              	currentCharge = "";
              }


              cells.push(
                <td className= {cellClass} key={id} onClick={() => this.props.selectNewMember(this.props.gameState.cells[id].side, (this.props.gameState.cells[id].listIndex))} 
                  id = {id}
                  onDragOver = {(e) => this.props.dragOver(e)}>

                  <span className = "healthText" 
                  		id =  {JSON.stringify(this.props.gameState.cells[id])}
                  		onDrop = {(e) => this.props.drop(e)}
                  		>
                  	{this.props.gameState.cells[id].currentHP}
                  </span>

                  <span className = "specialText" 
                  		id =  {JSON.stringify(this.props.gameState.cells[id])}
                  		onDrop = {(e) => this.props.drop(e)}
                  		>
                  	{currentCharge}
                  </span>

                <img src= {require('./art/' +  heroData[this.props.gameState.cells[id].heroID.value].art + '/Face_FC.png') } 
                    className = {imgClass} 
                    alt = {heroData[this.props.gameState.cells[id].heroID.value].name}
                    draggable = "true"
                    id =  {JSON.stringify(this.props.gameState.cells[id])}
                    onDragStart = {(e) => this.props.dragStart(e)}
                    onDrop = {(e) => this.props.drop(e)}
                     />

               
                    


                </td>
                );

              //onDragEnd = {(e) => this.props.dragEnd(e)}
// onDragEnd = {(e) => this.props.dragEnd(e)}
// onDragEnd = {(e) => this.props.dragEnd(e)}

            } else{ //nobody in cell
              cells.push(
                <td className= {cellClass} key={id} 
                  id = {id}
                  onDragOver = {(e) => this.props.dragOver(e)}
                  onDrop = {(e) => this.props.drop(e)} >
                </td>
                );              
            }


          // } else{
          //    cells.push(
          //   <td className= "cellStyle" key={id}
          //     id = {id}
          //     onDragOver = {(e) => this.dragOverBoard(e)}
          //     onDrop = {(e) => this.dropBoardMember(e)} >


          //   </td>
          //   );
          // }
          ////{this.props.gameState.cells[id]}
        }
      tbody.push(<tr key={i}>{cells}</tr>);
    }




	return (tbody

		);

	}

}