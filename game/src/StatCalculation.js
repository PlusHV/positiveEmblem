import heroData from './heroInfo.json';
import {object} from 'underscore';
import growthVectors from './growthVectors.json';

const statName = ["hp", "atk", "spd", "def", "res"];

function CalculateMinMaxStat(level, rarity, growth, base){
		

		if (level === 1){
			return base;
			
		} else if (level === 40){
			
			let calculatedGrowthRate = Math.trunc(growth * (0.07 * rarity + 0.79)) /100.0 ;
			return base + Math.trunc(calculatedGrowthRate * (39));
		} 

}

function CalculateMidStat(level, rarity, growth, base, bvid, offset, orgBase){

	let growthID = ((3 * orgBase) + offset + Math.trunc(growth * (0.07 * rarity + 0.79))  + bvid) % 64;
	let growthValue = Math.trunc( Math.trunc(growth * (0.07 * rarity + 0.79)) /100.0  * (39));
	var levelup = ConvertGrowthVector(growthVectors[growthValue][growthID.toString()], level );
	
	return base + levelup;
}

function ConvertGrowthVector(vect, level){
	return (vect.substring(0, level-1).match(/1/g)|| []).length;
}

export function CalculateStats(hero, fort, blessings, seasons){
	var statArray = {};

	var heroInfo = heroData[hero.heroID.value];

  	var bases = [heroInfo.basehp, heroInfo.baseatk, heroInfo.basespd, heroInfo.basedef, heroInfo.baseres];
  	var orgBases = [...bases];
  	var growths = [heroInfo.growthhp, heroInfo.growthatk, heroInfo.growthspd, heroInfo.growthdef, heroInfo.growthres];

  	const growthOffset = [-35, -28, -21, -14, -7];

  	var statOrder = StatOrder(object(statName, bases) ); 

  	//rarity calculation
  	var rarityMods = RarityMods(hero.rarity, statOrder);
  	

  	//iv calculation
  	var ivMods = IVMods(hero.iv.asset, hero.iv.flaw);
  	bases = ApplyMods(bases, ivMods.base);
  	growths = ApplyMods(growths, ivMods.growth);


  	statOrder = StatOrder(object(statName,bases)); //recalculate with ivs applied

  	//merge calculation
  	var mergeMods = MergeMods(hero.merge, statOrder, hero.iv.flaw);

  	//dragonflower calculation
  	var flowerMods =FlowerMods(hero.dragonflower, statOrder);

  	//fort calculation

  	//summoner support calculation

  	

  	//apply mods

  	bases = ApplyMods(bases, flowerMods);
  	bases = ApplyMods(bases, mergeMods.base);
  	growths = ApplyMods(growths, mergeMods.growth);
  	bases = ApplyMods(bases, rarityMods); //apply rarityMods at end to not effect merge/dragonflower calc
  	bases = ApplyMods(bases, hero.passive);

  	for (let i = 0; i < bases.length; i++) {
		if (hero.level === 1 || hero.level === 40){
  			statArray[statName[i]] = CalculateMinMaxStat(hero.level, hero.rarity, growths[i], bases[i]);
  		} else{
  			statArray[statName[i]] = CalculateMidStat(hero.level, hero.rarity, growths[i], bases[i], heroInfo.bvid, growthOffset[i], orgBases[i]);
  		}
  	}


	return statArray;
}


function ApplyMods(base, mod){
	let newBase = [];
	for (let i =0; i < base.length; i++){
		newBase[i] = base[i] + mod[statName[i]];
	}
	return newBase;

}

function IVMods(asset, flaw){
	let statMods = object(statName,[0, 0, 0, 0, 0]);
	let growthMods = object(statName,[0, 0, 0, 0, 0]);
	if ( !(asset === "neutral") && !(flaw === "neutral") ){
		statMods[asset] = 1;
		statMods[flaw] = -1;

		growthMods[asset] = 5;
		growthMods[flaw] = -5;		
	}

	return {base: statMods, growth: growthMods} ;

}

//Gets the modification to base stats depending on rarity (starting from rarity 5)
function RarityMods(rarity, order){
	//let dict = object(rest(statName), bases);
	let mods = object(statName,[0, 0, 0, 0, 0]);


	let stack = [...order];

	for (let i = 5; i > rarity; i--){

		if (i%2 === 1){ //going from 5-4 or 3-2 reduces hp by one
			stack = [...order]; //reset stack
			mods["hp"] -= 1;
		}

		let val = stack.pop();

		if (val === "hp")
			val = stack.pop();

		mods[val] -=1;

		val = stack.pop();

		if (val === "hp")
			val = stack.pop();

		mods[val] -=1;

	}

	return mods;
}

function MergeMods(merge, order, flaw){
	let statMods = object(statName,[0, 0, 0, 0, 0]);
	let growthMods = object(statName,[0, 0, 0, 0, 0]);


	let stack = [...order];

	for (let i = 1; i < merge+1; i++){

		if (i === 1){

			//First merge bonus
			if (flaw === 'Neutral'){
				statMods[order[0]] +=1;
				statMods[order[1]] +=1;
				statMods[order[2]] +=1;

			} else{
				statMods[flaw] +=1;
				growthMods[flaw] += 5 
			}
		}
			
		//on 6th merge, stack is reset
		if (i === 6){
			stack = [...order];
		}


		let val = stack.shift();
		statMods[val] +=1;

		//if on 3rd or 8th merge, reset stack
		if (i%5  === 3){
			stack = [...order];
		}

		val = stack.shift();
		statMods[val] +=1;


		

	}

	return {base: statMods, growth: growthMods} ;
}


function FlowerMods(flowers, order){
	//let dict = object(rest(statName), bases);
	let mods = object(statName,[0, 0, 0, 0, 0]);


	let stack = [...order];

	for (let i = 1; i < flowers+1; i++){

		if (i === 6){ 
			stack = [...order]; //reset stack
		}

		let val = stack.shift();

		mods[val] +=1;

	}

	return mods;
}

//returns an array of stats from highest to lowest
function StatOrder(stats){

	let order = [];
    let statStack = stats;
    
    while (Object.keys(statStack).length > 0){

    	let max  = -10;
    	let high = "";

	    for (var [key, value] of Object.entries(statStack)) {
	    	if (value > max){
	    		high = key;
	    		max = value;
	    	}
	    }                

  		order.push(high);
  		delete statStack[high];	
  	}	


	return order;

}


