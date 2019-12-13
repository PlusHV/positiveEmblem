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


// hero - ?
// fort - the fort level
// blessings - the list of buffs for each season for the side the hero is on
// seasons - the list of current seasons
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
  	var fortMods = FortMods(hero.side, fort);

  	//summoner support calculation

  	var summonerSupportMods = SummonerSupportMods(hero.summonerSupport);


  	//blessing buff calculation

  	var blessingMods = object(statName,[0, 0, 0, 0, 0]); //default
	//First we check if legendary/mythic



	//first check if they are in season
	if (Object.values(seasons).includes(hero.blessing)){

		//if legendary, add in the in season mythic buffs
		if (heroInfo.type === "legendary"){

			blessingMods = BlessingMods(blessingMods, blessings[seasons["M1"]]);

			blessingMods = BlessingMods(blessingMods, blessings[seasons["M2"]]);

		//if mythic, add in the in season legendary buffs - > mythics don't get legendary buffs in AR
		} else if (heroInfo.type === "mythic"){
			//blessingMods = BlessingMods(blessingMods, blessings[seasons["L1"]]);
			//blessingMods = BlessingMods(blessingMods, blessings[seasons["L2"]]);
			blessingMods = object(statName,[0, 0, 0, 0, 0]); //mythics can't get blessing buffs

		//if regular unit add in the appropriate blessing buff
		} else{
			blessingMods = BlessingMods(blessingMods, blessings[hero.blessing]);
		}

	
	}



  	//apply mods - no more mod calculations should be done below here

  	bases = ApplyMods(bases, flowerMods);
  	bases = ApplyMods(bases, mergeMods.base);
  	growths = ApplyMods(growths, mergeMods.growth); //growth is change because first merge removes the bane
  	bases = ApplyMods(bases, rarityMods); //apply rarityMods at end to not effect merge/dragonflower calc
  	bases = ApplyMods(bases, hero.passive);
  	bases = ApplyMods(bases, summonerSupportMods);
  	bases = ApplyMods(bases, fortMods);
  	bases = ApplyMods(bases, blessingMods);

  	if (hero.bonus){ //if hero is set as a bonus, they will get the extra stats
  		bases = ApplyMods(bases, object(statName,[10, 4, 4, 4, 4]));
  	}

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

function FortMods(side, level){


	let buff = 4 * level;

	if (side === "2"){
		buff = -buff; //enemy's buff needs the negative version of the buff
	}

	if (buff <= 0){ //if buff is negative/0, then no buff is granted - same if hero is not assigned
		return object(statName,[0, 0, 0, 0, 0]);
	} else{
		return object(statName,[0, buff, buff, buff, buff]); //give buff in all stats but HP
	}



}

function BlessingMods(orgBuffs, addBuffs){

    let newBuffs = object(statName,[0, 0, 0, 0, 0]);

    Object.keys(orgBuffs).forEach((key, i) => {
		newBuffs[key] = orgBuffs[key] + addBuffs[key];
	});

	return newBuffs;

}

function SummonerSupportMods(level){
	let statBuffs = object(statName,[0, 0, 0, 0, 0]);

	if (level === "C")
		statBuffs = object(statName,[3, 0, 0, 0, 2]);
	else if (level === "B")
		statBuffs = object(statName,[4, 0, 0, 2, 2]);
	else if (level === "A")
		statBuffs = object(statName,[4, 0, 2, 2, 2]);
	else if (level === "S")
		statBuffs = object(statName,[5, 2, 2, 2, 2]);

	return statBuffs;
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


