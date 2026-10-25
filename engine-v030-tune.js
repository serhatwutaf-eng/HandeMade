/* HandeMade v0.30 category tuning: avoid false dessert matches such as sweet pepper */

hm30TypeOk=function(title,body=''){
  const text=(String(title||'')+' '+String(body||'')).slice(0,12000);
  const dessert=/\b(dessert|sweetmeat|cake|cookie|cookies|pudding|custard|ice cream|sorbet|pastry|pie|tart|baklava|halva|helva|candy|jam|jelly|marmalade|confection)\b/i;
  const drink=/\b(drink|beverage|coffee|tea|lemonade|juice|cocktail|punch|sherbet|sharbat|smoothie)\b/i;
  const breakfast=/\b(breakfast|brunch|omelette|omelet|scrambled eggs|pancake|waffle)\b/i;
  const snack=/\b(appetizer|starter|snack|dip|spread|fritter|finger food|hors d'oeuvre|side dish)\b/i;
  if(S.selectedType==='sürpriz')return true;
  if(S.selectedType==='tatlı')return dessert.test(text);
  if(S.selectedType==='içecek')return drink.test(text);
  if(S.selectedType==='kahvaltı')return breakfast.test(text)&&!dessert.test(text);
  if(S.selectedType==='atıştırmalık')return snack.test(text)&&!dessert.test(text)&&!drink.test(text);
  return !dessert.test(text)&&!drink.test(text)&&!breakfast.test(text);
};
