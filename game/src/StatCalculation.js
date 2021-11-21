import heroData from './heroInfo.json';
import {object} from 'underscore';
import growthVectors from './growthVectors.json';

const statName = ["hp", "atk", "spd", "def", "res"];

function calculateMinMaxStat(level, rarity, growth, base){
		

		if (level === 1){
			return base;
			
		} else if (level === 40){
			
			let calculatedGrowthRate = Math.trunc(growth * (0.07 * rarity + 0.79)) /100.0 ;
			return base + Math.trunc(calculatedGrowthRate * (39));
		} 

}

function calculateMidStat(level, rarity, growth, base, bvid, offset, orgBase){

	let growthID = ((3 * orgBase) + offset + Math.trunc(growth * (0.07 * rarity + 0.79))  + bvid) % 64;
	let growthValue = Math.trunc( Math.trunc(growth * (0.07 * rarity + 0.79)) /100.0  * (39));

	//empty hero with 0 stats was causing issues when they were leveled up.
	if (growthID <= 0){
		growthID = 1;
	}
	if (growthValue <= 0){
		growthValue = 1;
	}

	var levelup = convertGrowthVector(growthVectors[growthValue][growthID.toString()], level );
	
	return base + levelup;
}

function convertGrowthVector(vect, level){

	return (vect.substring(0, level-1).match(/1/g)|| []).length;
}


// hero - ?
// fort - the fort level
// blessings - the list of buffs for each season for the side the hero is on
// seasons - the list of current seasons
export function calculateStats(hero, fort, blessings, seasons){
	var statArray = {};

	var heroInfo = heroData[hero.heroID.value];

  	var bases = [heroInfo.basehp, heroInfo.baseatk, heroInfo.basespd, heroInfo.basedef, heroInfo.baseres];
  	var orgBases = [...bases];
  	var growths = [heroInfo.growthhp, heroInfo.growthatk, heroInfo.growthspd, heroInfo.growthdef, heroInfo.growthres];

  	const growthOffset = [-35, -28, -21, -14, -7];

  	var statOrder = getStatOrder(object(statName, bases) ); 

  	//rarity calculation
  	var rarityMods = getRarityMods(hero.rarity, statOrder);
  	

  	//iv calculation
  	var ivMods = getIVMods(hero.iv.asset, hero.iv.flaw, hero.iv.ascended);
  	bases = applyMods(bases, ivMods.base);
  	growths = applyMods(growths, ivMods.growth);


  	statOrder = getStatOrder(object(statName,bases)); //recalculate with ivs applied

  	//merge calculation
  	var mergeMods = getMergeMods(hero.merge, statOrder, hero.iv.flaw, hero.iv.ascended);

  	//dragonflower calculation
  	var flowerMods = getFlowerMods(hero.dragonflower, statOrder);

  	//fort calculation
  	var fortMods = getFortMods(hero.side, fort);

  	//summoner support calculation

  	var summonerSupportMods = getSummonerSupportMods(hero.summonerSupport);


  	//blessing buff calculation

  	var blessingMods = object(statName,[0, 0, 0, 0, 0]); //default
	//First we check if legendary/mythic



	//first check if they are in season
	if (Object.values(seasons).includes(hero.blessing)){

		//if legendary, add in the in season mythic buffs
		if (heroInfo.type === "legendary"){

			blessingMods = getBlessingMods(blessingMods, blessings[seasons["M1"]]);

			blessingMods = getBlessingMods(blessingMods, blessings[seasons["M2"]]);

		//if mythic, add in the in season legendary buffs - > mythics don't get legendary buffs in AR
		} else if (heroInfo.type === "mythic"){
			//blessingMods = BlessingMods(blessingMods, blessings[seasons["L1"]]);
			//blessingMods = BlessingMods(blessingMods, blessings[seasons["L2"]]);
			blessingMods = object(statName,[0, 0, 0, 0, 0]); //mythics can't get blessing buffs

		//if regular unit add in the appropriate blessing buff
		} else{
			blessingMods = getBlessingMods(blessingMods, blessings[hero.blessing]);
		}

	
	}



  	//apply mods - no more mod calculations should be done below here

  	bases = applyMods(bases, flowerMods);
  	bases = applyMods(bases, mergeMods.base);
  	growths = applyMods(growths, mergeMods.growth); //growth is change because first merge removes the bane
  	bases = applyMods(bases, rarityMods); //apply rarityMods at end to not effect merge/dragonflower calc
  	bases = applyMods(bases, hero.passive);
  	bases = applyMods(bases, summonerSupportMods);
  	bases = applyMods(bases, fortMods);
  	bases = applyMods(bases, blessingMods);

  	if (hero.bonus){ //if hero is set as a bonus, they will get the extra stats
  		bases = applyMods(bases, object(statName,[10, 4, 4, 4, 4]));
  	}

  	if (hero.resplendent){ //if hero is set as resplendent, they get 2 in every stats
  		bases = applyMods(bases, object(statName,[2, 2, 2, 2, 2]));
  	}


  	for (let i = 0; i < bases.length; i++) {
		if (hero.level === 1 || hero.level === 40){
  			statArray[statName[i]] = calculateMinMaxStat(hero.level, hero.rarity, growths[i], bases[i]);
  		} else{
  			statArray[statName[i]] = calculateMidStat(hero.level, hero.rarity, growths[i], bases[i], heroInfo.bvid, growthOffset[i], orgBases[i]);
  		}
  	}


	return statArray;
}


function applyMods(base, mod){
	let newBase = [];
	for (let i =0; i < base.length; i++){
		newBase[i] = base[i] + mod[statName[i]];
	}
	return newBase;

}

function getIVMods(asset, flaw, ascended){
	let statMods = object(statName,[0, 0, 0, 0, 0]);
	let growthMods = object(statName,[0, 0, 0, 0, 0]);
	if ( !(asset === "neutral") && !(flaw === "neutral") ){ //requires neither asset/flaw to be neutral
		statMods[asset] = 1;
		statMods[flaw] = -1;

		growthMods[asset] = 5;
		growthMods[flaw] = -5;		
	}

	//Add the ascended asset. Here we add since he asset will stack with the flaw 
	if (ascended !== "neutral"){
		statMods[ascended]+= 1;
		growthMods[ascended]+= 5;
	}

	return {base: statMods, growth: growthMods} ;

}

//Gets the modification to base stats depending on rarity (starting from rarity 5)
function getRarityMods(rarity, order){
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

function getMergeMods(merge, order, flaw, ascended){
	let statMods = object(statName,[0, 0, 0, 0, 0]);
	let growthMods = object(statName,[0, 0, 0, 0, 0]);

	console.log(order);
	let stack = [...order];

	for (let i = 1; i < merge+1; i++){

		if (i === 1){

			//First merge bonus
			if (flaw === 'neutral'){
				let counter = 0; //counter so that 3 stats are affected
				let index = 0; //current index for the order
				while (counter < 3){ //raise 3 stats 

					if (order[index] !== ascended){ //if the current stat is not ascended, then we raise the counter and give the merge bonus to the stat
						statMods[order[index]] +=1;
						counter++;
					}

					index++; //the index in the order is always incremented
				}
			} else{
				statMods[flaw] +=1;
				growthMods[flaw] += 5;
			}
		}
		
		//Each merge raises two different stats, each time going through the stat order.
		//The below stack resets occur when the stack reaches the end

		//First stat gain
		//on 6th merge, stack is reset on for the first stat gain
		//if (i === 6){
		
		if (stack.length <= 0){
			stack = [...order];
		
		}


		let val = stack.shift();
		statMods[val] +=1;


		//Second stat gain

		//if on 3rd or 8th merge, the stack is reset on the second stat gain
		//if (i%5  === 3){

		if (stack.length <= 0){
			stack = [...order];
		}

		val = stack.shift();
		statMods[val] +=1;


		

	}

	return {base: statMods, growth: growthMods} ;
}


function getFlowerMods(flowers, order){
	//let dict = object(rest(statName), bases);
	let mods = object(statName,[0, 0, 0, 0, 0]);


	let stack = [...order];

	for (let i = 1; i < flowers+1; i++){

		if (i % 5 === 1){  //reset stat order every 5 flowers
			stack = [...order]; //reset stack
		}

		let val = stack.shift();

		mods[val] +=1;

	}

	return mods;
}

function getFortMods(side, level){


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

function getBlessingMods(orgBuffs, addBuffs){

    let newBuffs = object(statName,[0, 0, 0, 0, 0]);

    Object.keys(orgBuffs).forEach((key, i) => {
		newBuffs[key] = orgBuffs[key] + addBuffs[key];
	});

	return newBuffs;

}

function getSummonerSupportMods(level){
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
function getStatOrder(stats){

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


//calculate the visible stats on a hero
export function calculateVisibleStats(hero){
	let stats = object(statName.slice(1), [0, 0, 0, 0]);


	//for panic, probably have a check and reverse buffs
    Object.keys(stats).forEach((key, i) => {

		let panicFactor = 1; //buff is multipied by this factor, if panicked, then the factor will turn the buff into a penalty

		if (hero.statusEffect.panic > 0 && hero.statusBuff.nullPanic <= 0){ //check for panic status and null panic
			panicFactor = -1;
		}

		stats[key] = hero.stats[key] + (panicFactor * hero.buff[key]) - hero.debuff[key];
	});

    return stats;
}

export function calculateCombatStats(hero, enemy){
	let combatStats = object(statName.slice(1), [0, 0, 0, 0]);

	let visibleStats = calculateVisibleStats(hero);


	for (let stat in combatStats){
		combatStats[stat] = visibleStats[stat] +  hero.aura[stat] + calculateCombatStatModifier(hero, enemy, stat);
	}


    return combatStats;

}

export function calculateCombatStatModifier(hero, enemy, stat){
	let modifier = 0;

	//Hero effects that affect stats
	let penaltyNeutralize = hero.combatEffects.penaltyNeutralize;
	let penaltyReverse = hero.combatEffects.penaltyReverse;
	let bonusCopy = hero.combatEffects.bonusCopy;
	let bonusDoubleCombatEffect = hero.combatEffects.bonusDouble;
	let bonusDoubleStatus = hero.statusEffect.bonusDouble;

	let penaltyCopy = hero.combatEffects.penaltyCopy;
	

	//Enemy effects that affect stats
	let buffNeutralize = enemy.combatEffects.buffNeutralize;
	let bonusNull = enemy.combatEffects.bonusNull;
	let penaltyDouble = enemy.combatEffects.penaltyDouble;
	let buffReflect = enemy.combatEffects.buffReflect; 

	let buffReverse = enemy.combatEffects.buffReverse;

	let panicFactor = 1; //buff is multipied by this factor, if panicked, then the factor will turn the buff into a penalty


	//Panic checks later are based on the panic factor, so null panic does not need to be checked again
	if (hero.statusEffect.panic > 0 && hero.statusBuff.nullPanic <= 0 ){
		panicFactor = -1;
	}

	let enemyPanicFactor = 1;

	if (enemy.statusEffect.panic > 0 && enemy.statusBuff.nullPanic <= 0 ){
		enemyPanicFactor = -1;
	}

	let penaltyNeutralizer = 0; //set neutralizer that will cancel out debuffs
	if (penaltyNeutralize[stat] > 0){
		penaltyNeutralizer = hero.debuff[stat]; //neutralizer will have same value as debuff to cancel it out

		if (panicFactor < 0 ){ //also if panicked, then neutralizer will also neutralize the panicked stat 
			penaltyNeutralizer+= hero.buff[stat];
		}

	}


	let penaltyReverser = 0; //penalty reverser is buff that is double the value of penalties on hero - This is unaffected by penalty neutralizers <- no longer true
	//After version 4.6, neutralized stats are no longer used for this effect
	if (penaltyReverse[stat] > 0 && penaltyNeutralize[stat] <= 0){ //also check if those penalties are neutralized
		penaltyReverser = hero.debuff[stat]  * 2;

		if (panicFactor < 0){ //if panicked, also add a buff that is double of that to reverse it
			penaltyReverser += hero.buff[stat] * 2;
		}
	}

	let bonusCopier = 0;

	if (bonusCopy[stat] > 0 && hero.combatEffects.buffNeutralize[stat] <= 0 && (enemy.statusEffect.panic <= 0 || (enemy.statusEffect.panic > 0 && enemy.statusBuff.nullPanic > 0)) ){ //copy buffs from enemy - cannot copy buffs if hero is neutralizing enemy or enemy is panicked
		bonusCopier = enemy.buff[stat];
	}

	let bonusDoublerCombat = 0;

	if (bonusDoubleCombatEffect[stat] > 0 && buffNeutralize[stat] <= 0 && panicFactor > 0){ //double buffs - cannot double if neutralized or panicked
		bonusDoublerCombat = Math.trunc(hero.buff[stat] * bonusDoubleCombatEffect[stat]);

	}

	let bonusDoublerStatus = 0;

	if (bonusDoubleStatus > 0 && buffNeutralize[stat] <= 0 && panicFactor > 0){ //double buffs - cannot double if neutralized or panicked
		bonusDoublerStatus = hero.buff[stat];

	}

	let penaltyCopier = 0;

	if (penaltyCopy[stat] > 0 && penaltyNeutralize[stat] <= 0){ //check if penalty copy is active and penalties aren't neutralized
		penaltyCopier = enemy.debuff[stat];
		if (enemyPanicFactor < 0){ //if panicked, also include that
			penaltyCopier += enemy.buff[stat];
		}
	}

	//effects from the enemy\

	let buffNeutralizer = 0; //set neutralizer that will cancel out buffs
	if (buffNeutralize[stat] > 0 && panicFactor > 0){ //only neutralize buffs if not panicked.
		buffNeutralizer = hero.buff[stat];
	}

	let bonusNuller = 0; //enemy nulls buffs on owner by debuffing by same amount - kinda does the same thing as buff neutralize but it also allows bonusCopy to work as well

	if (bonusNull[stat] > 0 && buffNeutralize[stat] <= 0 && panicFactor > 0){ //to null your bonuses, the enemy must not be already neutralizing your bonus and you must not be panicked 
		bonusNuller = hero.buff[stat];
	}


	let penaltyDoubler = 0;

	if (penaltyDouble[stat] > 0 && penaltyNeutralize[stat] <= 0){ //check if penalty double is active and penalties aren't neutralized
		penaltyDoubler = hero.debuff[stat];
		if (panicFactor < 0){ //if panicked, also add a buff that is double of that to reverse it
			penaltyDoubler += hero.buff[stat];
		}
	}


	let buffReverser = 0;

	if (buffReverse[stat] > 0 && panicFactor > 0 && buffNeutralize[stat] <= 0){ //check if buff reverse is acive, if not panicked and buffs are not neutralized.
		buffReverser = hero.buff[stat] * 2;

	}

	let buffReflecter = 0; //Reflects the enemies buffs into debuffs

	if (buffReflect[stat] > 0 && enemyPanicFactor > 0 &&  hero.combatEffects.buffNeutralize[stat] <= 0){ //enemy will only reflect if not panicked and current hero is not neutralizing buffs
		buffReflecter = enemy.buff[stat] * buffReflect[stat];
	}


	//
	modifier = /*(panicFactor * hero.buff[stat]) - hero.debuff[stat] + hero.aura[stat] + */hero.combatEffects.statBuff[stat] - enemy.combatEffects.lull[stat]
	 + penaltyNeutralizer + penaltyReverser + bonusCopier + bonusDoublerCombat + bonusDoublerStatus + penaltyCopier - bonusNuller - buffNeutralizer - penaltyDoubler - buffReverser - buffReflecter; 


	return modifier;
}



