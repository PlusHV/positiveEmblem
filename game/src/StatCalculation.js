export function CalculateStat(level, rarity, growth, base){
	
		var calculatedGrowthRate = Math.trunc(growth * (0.07 * rarity + 0.79)) /100.0 ;
		return base + Math.trunc(calculatedGrowthRate * (level-1));

};


//1.14*0.05 * 39