import React from 'react';
import './App.css';

export default class TeamElement extends React.Component{
  constructor(props){
    super(props);
    this.state = {"team": this.props.gameState.heroList[this.props.name]};
  }


  render(){
    let tbody = [];
    for (let i = 0; i < this.state.team.length; i++) { //rows
      let cells = [];
      let cellClass = "teamMember";
      if (this.props.name === this.props.gameState.playerSide && i === this.props.gameState.heroIndex){
        cellClass = "highlightedTeamMember";
      }

      cells.push(
          <td className= {cellClass} key={i} onClick={(side) => this.props.selector(this.props.name, i)}>
          
          {this.state.team[i].id}
          </td>
          );
      
      tbody.push(<tr key={i}>{cells}</tr>);
    }



    return(
        <table id = "Team" >
        <tbody>

        {tbody}
        </tbody>
        </table>
      );
  }
}