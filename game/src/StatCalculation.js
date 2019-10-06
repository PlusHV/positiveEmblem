import heroData from './heroInfo.json';
import {object} from 'underscore';

const statName = ["hp", "atk", "spd", "def", "res"];

export function CalculateStat(level, rarity, growth, base){
	
		var calculatedGrowthRate = Math.trunc(growth * (0.07 * rarity + 0.79)) /100.0 ;
		return base + Math.trunc(calculatedGrowthRate * (level-1));

};

export function CalculateStats(hero){
	var statArray = {};

	var heroInfo = heroData[hero.heroID.value];

  	var bases = [heroInfo.basehp, heroInfo.baseatk, heroInfo.basespd, heroInfo.basedef, heroInfo.baseres];
  	var growths = [heroInfo.growthhp, heroInfo.growthatk, heroInfo.growthspd, heroInfo.growthdef, heroInfo.growthres];
  	//todo - modify these depending on boon/bane

  	//todo - merge bonuses

  	//order is rarity mods - > ivs -> merges/dragonflowers
  	//
  	var statOrder = StatOrder(object(statName, bases) ); 


  	//rarity calculation
  	var rarityMods = RarityMods(hero.rarity, statOrder);
  	bases = ApplyMods(bases, rarityMods);

  	console.log(bases);
  	//iv calculation
  	var ivMods = IVMods(hero.iv.asset, hero.iv.flaw);
  	bases = ApplyMods(bases, ivMods.base);
  	growths = ApplyMods(growths, ivMods.growth);

  	console.log(bases);
  	statOrder = StatOrder(object(statName,bases)); //recalculate with ivs applied
  	//merge calculaion

  	//dragonflower calculation

  	for (let i = 0; i < bases.length; i++) {

  		statArray[statName[i]] = CalculateStat(hero.level, hero.rarity, growths[i], bases[i]);
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


