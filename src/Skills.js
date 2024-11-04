
import React from 'react';
import Select from 'react-select-v2';

import './App.css';
import {capitalize} from 'underscore.string';

// import heroData from './heroInfo.json';
// import weapons from './weapons.js';
//import specials from './skills/special.json';
//import assists from './skills/assist.json';
//import skills from './skillList.js';

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
    let tbody = [];

    const equipText = ["weapon", "refine", "assist", "special", "a", "b", "c", "seal", "summoner", "ally", "blessing" ];
    const equipKey = ["weapon", "refine", "assist", "special", "a", "b", "c", "seal", "summonerSupport", "allySupport", "blessing" ];
    const equippedValue = [ this.props.gameState.selectedMember.heroSkills["weapon"], 
                            this.props.gameState.selectedMember.heroSkills["refine"], 
                            this.props.gameState.selectedMember.heroSkills["assist"], 
                            this.props.gameState.selectedMember.heroSkills["special"],
                            this.props.gameState.selectedMember.heroSkills["a"], this.props.gameState.selectedMember.heroSkills["b"], 
                            this.props.gameState.selectedMember.heroSkills["c"], this.props.gameState.selectedMember.heroSkills["seal"],
                            this.props.gameState.selectedMember.summonerSupport,
                            this.props.gameState.selectedMember.allySupport, this.props.gameState.selectedMember.blessing
    ];     
    

//Last Column
    let supportLevels = ["S", "A", "B", "C", "None"];
    let blessings = ["None", "Water", "Earth", "Wind", "Fire", "Light", "Dark", "Astra", "Anima"];

    for (let i = 0; i < equipText.length; i++) { //rows
        let cells = [];
        //column text
        cells.push(<td className = "equipText" key = {equipText[i]} >{capitalize(equipText[i], true) }</td>);
        //the first 7 are the equipped skills/seals etc
        if (i < 8){


          let disableValue = false;
          if (equipKey[i] === "refine"){

            disableValue = !this.props.gameState.skillDropdowns.weapon.info[this.props.gameState.selectedMember.heroSkills["weapon"].value].refinable;
            
          }

          //drop down menu for skill
          cells.push(<td className = "equippedSkill" key = {"equip:" + equipText[i]} colSpan = "3">
            
              <Select
                isDisabled = {disableValue}
                styles = {dropDownStyle}
                theme = {dropDownTheme} 
                options={this.props.gameState.skillDropdowns[equipKey[i]].list}
                value={equippedValue[i]}
              onChange = {(e, index) => this.props.skillChange(e,equipKey[i])} 
              /> 
            </td>);

          //value={this.props.gameState.selectedMember.heroSkills[equipText[i]]}
        } else if (equipText[i] === "ally"){ //allies need use the Select dropdown so its value its onChange function is different

            cells.push(<td className = "equippedSkill" key = {"equip:" + equipText[i]} colSpan = "3" >
            <Select
              styles = {dropDownStyle}
              theme = {dropDownTheme} 
              options={this.props.gameState.skillDropdowns["hero"].list}
              value={equippedValue[i]}
              onChange = {(e) => this.props.allySupportChange(e)  } />
              </td>
              );

        } else { //regular dropdown levels for blessings and support levels
          let optionList = supportLevels;

          if (equipText[i] === "blessing"){
            optionList = blessings;
          }


          let options = [];
          for (let j = 0; j < optionList.length; j++){

            options.push(<option key = {equipText[i] + optionList[j]} value = {optionList[j]}>{optionList[j]}</option>);
          }



          //for the blessing input, legendary and mythic heroes will display their blessing and disable it
          if (equipText[i] === "blessing" && (this.props.gameState.selectedHeroInfo.type === "legendary" || this.props.gameState.selectedHeroInfo.type === "mythic")  ){
            cells.push(<td key = {equipText[i] + "Value"}>  
              <select disabled value = {capitalize(this.props.gameState.selectedHeroInfo.blessing, true)}
                   >
                {options}
              </select>
              </td>);
          } else{ //regular heroes blessing dropdown

            if (equipText[i] === "summoner"){

              cells.push(<td key = {equipText[i] + "Value"} >  
                  <select value = {equippedValue[i]}
                      onChange = {(e, type) => this.props.supportLevelChange(e, equipKey[i])} >
                    {options}
                  </select>
                  </td>);

              cells.push(<td className = "equipText" key = {"ally lvl"}>Ally Lvl</td>);

              cells.push(<td key = {"ally lvlValue"} >  
                  <select value = {this.props.gameState.selectedMember.allySupportLevel}
                      onChange = {(e, type) => this.props.supportLevelChange(e, "allySupportLevel")} >
                    {options}
                  </select>
                  </td>);

              //this.props.gameState.selectedMember.allySupportLevel

            } else{
              cells.push(<td key = {equipText[i] + "Value"}  colSpan = "3">  
                  <select value = {equippedValue[i]}
                      onChange = {(e, type) => this.props.supportLevelChange(e, equipKey[i])} >
                    {options}
                  </select>
                  </td>);
            }
          }

        }

        tbody.push(<tr key={"skill row"+i}>{cells}</tr>);
    }

    tbody.push( //Checkbox for max row
      <tr key = {"checkbox row"}> 
        <td className = "equipText" key = {"maxFilter"}>
            Max 
        </td>

        <td className = "equippedSkill" key = {"maxCheckbox"}>
            <input 
            type = "checkbox"
            value = {this.props.gameState.maxFilter}
            checked = {this.props.gameState.maxFilter}
            onChange = {(e) => this.props.maxFilterChange(e)}
              />
        </td>
     
        <td className = "equipText" key = {"bonus"}>
            Bonus
        </td>

        <td className = "equippedSkill" key = {"bonusCheckbox"}>
            <input 
            type = "checkbox"
            value = {this.props.gameState.selectedMember.bonus}
            checked = {this.props.gameState.selectedMember.bonus}
            onChange = {(e) => this.props.bonusChange(e, "bonus")}
              />
        </td>
            
        
      </tr>
    );  

    tbody.push(
        <tr key = {"wait row"}> 
        <td className = "equipText" key = {"wait"}>
            Wait
        </td>

        <td className = "equippedSkill" key = {"waitCheckbox"}>
            <input 
            type = "checkbox"
            value = {this.props.gameState.selectedMember.end}
            checked = {this.props.gameState.selectedMember.end}
            onChange = {(e) => this.props.endChange(e)}
              />
        </td>

        <td className = "equipText" key = {"freeMove"}>
            FreeMove
        </td>

        <td className = "equippedSkill" key = {"freeMoveCheckbox"}>
            <input 
            type = "checkbox"
            value = {this.props.gameState.freeMove}
            checked = {this.props.gameState.freeMove}
            onChange = {(e) => this.props.freeMoveChange(e)}
              />
        </td>

      </tr>
    );

    tbody.push( //Checkbox for resplendent/transformed row
      <tr key = {"resplendent row"}> 
        <td className = "equipText" key = {"resplendent"}>
            Resplendent
        </td>

        <td className = "equippedSkill" key = {"resplendentCheckbox"}>
            <input 
            type = "checkbox"
            value = {this.props.gameState.selectedMember.resplendent}
            checked = {this.props.gameState.selectedMember.resplendent}
            onChange = {(e) => this.props.bonusChange(e, "resplendent")}
              />
        </td>
     
        <td className = "equipText" key = {"transformed"}>
            Transformed
        </td>

        <td className = "equippedSkill" key = {"transformedCheckbox"}>
            <input 
            type = "checkbox"
            value = {this.props.gameState.selectedMember.transformed}
            checked = {this.props.gameState.selectedMember.transformed}
            onChange = {(e) => this.props.bonusChange(e, "transformed")}
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
