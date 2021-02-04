import React from 'react';
import './App.css';

import heroData from './heroInfo.json';


export default class TeamElement extends React.Component{
  constructor(props){
    super(props);
    this.state = {"team": this.props.gameState.heroList[this.props.name]}; //the heroList for this team
  }


  render(){

    let idIndex = 0;
    if (this.props.name === "2"){
      idIndex = 7;
    }


    let tbody = [];
    for (let i = 0; i < this.state.team.length; i++) { //rows
      let cells = [];
      let cellClass = "teamMember";
      if (this.props.name === this.props.gameState.playerSide && i === this.props.gameState.heroIndex){
        cellClass = "highlightedTeamMember";
      }
      
      cells.push(
          <td className= {cellClass} key={i} onClick={(side) => this.props.selector(this.props.name, i)}
          onDragOver = {(e) => this.props.dragOver(e)}
          onDrop = {(e) => this.props.drop(e)}
          onDragEnd = {(e) => this.props.dragEnd(e)}
          id = {idIndex + i}
          >
            <img src= {require('./art/' +  heroData[this.state.team[i].heroID.value].art + '/Face_FC.png') } 
                className = "heroFace" 
                alt = {heroData[this.state.team[i].heroID.value].name}
                draggable  = "true"
                id = {JSON.stringify(this.state.team[i]) }
                onDragEnd = {(e) => this.props.dragEnd(e)}
                onDragStart = {(e) => this.props.drag(e)} />
                  
          </td>
          );
      
      tbody.push(<tr key={i}>{cells}</tr>);
    }

//{this.state.team[i].id}

    return(
        <table id = "Team" >
        <tbody>

        {tbody}
        </tbody>
        </table>
      );
  }
}