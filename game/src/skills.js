
import React from 'react';
import Select from 'react-select-v2';

import './App.css';

// import heroData from './heroInfo.json';
// import weapons from './weapons.js';
import specials from './skills/special.json';
import assists from './skills/assist.json';
import skills from './skillList.js';

export default class Skills extends React.Component{

  render(){

const dropDownStyle = {

  control: base => ({
    ...base,
    height: '20px',
    minHeight: '20px'
  }),
  container: base => ({
    ...base,
    height: '20px',
    minHeight: '20px'
  }),
  input: base => ({
    ...base,
    height: '30px',
    minHeight: '30px',
    top: '0%',
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 0,
    marginTop: 0,
    position: 'relative',
    transform: 'translateY(-25%)'
  }),
  singleValue: base => ({
    ...base,
    height: '20px',
    minHeight: '20px',
    top: '0%',
    position: 'relative',

  }),
  dropdownIndicator: base => ({
    ...base,
    height: '20px',
    minHeight: '20px',
    paddingTop: 1,
    paddingBottom: 1,
    paddingRight: 1,
    paddingLeft: 1
  }),
  indicatorSeparator: base => ({
    ...base,
    height: '15px',
    minHeight: '15px',
    marginBottom: 0,
    marginTop: 0,
    alignSelf: 'center'
  }),
  clearIndicator: base => ({
    ...base,
    height: '20px',
    minHeight: '20px'
  }),
  valueContainer: base => ({
    ...base,
    height: '20px',
    minHeight: '20px',

  }),

  indicatorsContainer: base => ({
    ...base,
    height: '20px',
    minHeight: '20px'

  }),
  group: base => ({
    ...base,
    height: '20px',
    minHeight: '20px'
  }),
  groupHeading: base => ({
    ...base,
    height: '20px',
    minHeight: '20px'
  }),
  menuPortal: base => ({
    ...base,
    height: '20px',
    minHeight: '20px'
  })

};
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
    console.log(dropDownTheme);
    let tbody = [];

    const equipText = ["weapon", "assist", "special", "a", "b", "c", "seal"];
    const equippedSkill = [ this.props.gameState.weaponList[this.props.gameState.selectedMember.heroSkills["weapon"].value], 
                            assists[this.props.gameState.selectedMember.heroSkills["assist"].value], 
                            specials[this.props.gameState.selectedMember.heroSkills["special"].value],
                            skills.a[this.props.gameState.selectedMember.heroSkills["a"].value], skills.b[this.props.gameState.selectedMember.heroSkills["b"].value], 
                            skills.c[this.props.gameState.selectedMember.heroSkills["c"].value], skills.seal[this.props.gameState.selectedMember.heroSkills["seal"].value]
    ];     



    for (let i = 0; i < equipText.length; i++) { //rows
        let cells = [];

        cells.push(<td className = "equipText" key = {equipText[i]} >{equipText[i]}</td>);



        cells.push(<td className = "equippedSkill" key = {"equip:" + equippedSkill[i]} >
          
            <Select

              styles = {dropDownStyle}
              theme = {dropDownTheme} 
              options={this.props.gameState.skillDropdowns[equipText[i]].list}
              value={this.props.gameState.selectedMember.heroSkills[equipText[i]]}
            onChange = {(e, index) => this.props.skillChange(e,equipText[i])} 
            /> 
          </td>);


        tbody.push(<tr key={"skill row"+i}>{cells}</tr>);
    }

    tbody.push(
      <tr key = {"checkbox row"}> 
        <td className = "equippedSkill" key = {"maxFilter"}>
            Only Max Skills<input 
            type = "checkbox"
            value = {this.props.gameState.maxFilter}
            onChange = {(e) => this.props.maxFilterChange(e)}
              />
            
        </td>
      </tr>
    );

    return(

        <div>
        <table id = "Skills" align = 'left'>
        <tbody>

        {tbody}
        </tbody>
        </table>
        </div>



    );
  }
}