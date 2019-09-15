export function CalculateStat(level, rarity, growth, base){
	
		var calculatedGrowthRate = Math.trunc(GrowthRateConversion(growth) * (0.07 * rarity + 0.79)) /100.0 ;
		return base + Math.trunc(calculatedGrowthRate * (level-1)) ;

};

export function GrowthRateConversion(num){
	return num*5 + 20;
};