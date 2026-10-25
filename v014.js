const HM_AREA_TR={
  'Turkish':'Türk','Italian':'İtalyan','Japanese':'Japon','Mexican':'Meksika','Indian':'Hint','Thai':'Tay','South Korean':'Kore','French':'Fransız','Spanish':'İspanyol','Greek':'Yunan','Moroccan':'Fas',
  'Lebanese':'Lübnan','Palestinian':'Filistin','Syrian':'Suriye','Jordanian':'Ürdün','Iraqi':'Irak','Israeli':'İsrail','Saudi Arabian':'Suudi Arabistan','Yemeni':'Yemen',
  'American':'Amerikan','British':'İngiliz','Canadian':'Kanada','Chinese':'Çin','Croatian':'Hırvat','Dutch':'Hollanda','Egyptian':'Mısır','Filipino':'Filipin','Irish':'İrlanda','Jamaican':'Jamaika','Kenyan':'Kenya','Malaysian':'Malezya','Polish':'Polonya','Portuguese':'Portekiz','Russian':'Rus','Tunisian':'Tunus','Ukrainian':'Ukrayna','Vietnamese':'Vietnam'
};

const HM_MEASURE_TR={
  'cup':'su bardağı','cups':'su bardağı','tbsp':'yemek kaşığı','tbs':'yemek kaşığı','tablespoon':'yemek kaşığı','tablespoons':'yemek kaşığı',
  'tsp':'çay kaşığı','teaspoon':'çay kaşığı','teaspoons':'çay kaşığı','dessert spoon':'tatlı kaşığı','ml':'ml','g':'g','kg':'kg','oz':'g','lb':'g',
  'pinch':'tutam','handful':'avuç','clove':'diş','cloves':'diş','slice':'dilim','slices':'dilim','can':'kutu','cans':'kutu','packet':'paket','pack':'paket',
  'bunch':'demet','sprig':'dal','sprigs':'dal','large':'büyük','medium':'orta boy','small':'küçük','to taste':'damak tadına göre','as needed':'gerektiği kadar'
};

const HM_ING_EXTRA_TR={
  'spring onions':'taze soğan','spring onion':'taze soğan','scallions':'taze soğan','leek':'pırasa','leeks':'pırasa','cabbage':'lahana','red cabbage':'kırmızı lahana',
  'cauliflower':'karnabahar','broccoli':'brokoli','cucumber':'salatalık','lettuce':'marul','rocket':'roka','arugula':'roka','mint':'nane','basil':'fesleğen','thyme':'kekik','oregano':'kekik',
  'rosemary':'biberiye','bay leaf':'defne yaprağı','bay leaves':'defne yaprağı','ginger':'zencefil','chilli':'acı biber','chili':'acı biber','chilli powder':'acı toz biber',
  'red chilli':'kırmızı acı biber','green chilli':'yeşil acı biber','cayenne pepper':'acı kırmızı biber','sweet potato':'tatlı patates','pumpkin':'bal kabağı','butternut squash':'bal kabağı',
  'coconut milk':'hindistan cevizi sütü','coconut cream':'hindistan cevizi kreması','coconut':'hindistan cevizi','sugar':'şeker','brown sugar':'esmer şeker','honey':'bal','maple syrup':'akçaağaç şurubu',
  'vinegar':'sirke','white wine vinegar':'beyaz şarap sirkesi','red wine vinegar':'kırmızı şarap sirkesi','apple cider vinegar':'elma sirkesi','rice vinegar':'pirinç sirkesi',
  'lemon juice':'limon suyu','lime juice':'lime suyu','orange':'portakal','orange juice':'portakal suyu','apple':'elma','apples':'elma','banana':'muz','bananas':'muz','strawberry':'çilek','strawberries':'çilek',
  'mango':'mango','avocado':'avokado','olives':'zeytin','green olives':'yeşil zeytin','black olives':'siyah zeytin','capers':'kapari','tomato puree':'domates püresi','tomato paste':'domates salçası',
  'chopped tomatoes':'doğranmış domates','passata':'domates püresi','stock':'et suyu','chicken stock':'tavuk suyu','beef stock':'et suyu','vegetable stock':'sebze suyu','stock cube':'bulyon',
  'ground cumin':'öğütülmüş kimyon','ground coriander':'öğütülmüş kişniş','ground cinnamon':'öğütülmüş tarçın','ground turmeric':'öğütülmüş zerdeçal','ground ginger':'öğütülmüş zencefil',
  'chicken thighs':'tavuk but','chicken thigh':'tavuk but','chicken legs':'tavuk baget','minced beef':'dana kıyma','ground beef':'dana kıyma','minced lamb':'kuzu kıyma','pork':'domuz eti',
  'pork belly':'domuz göbeği','bacon':'domuz pastırması','sausage':'sosis','sausages':'sosis','cod':'morina','haddock':'mezgit','mackerel':'uskumru','sardines':'sardalya',
  'plain flour':'un','self-raising flour':'kendiliğinden kabaran un','cornflour':'mısır nişastası','cornstarch':'mısır nişastası','oats':'yulaf','rolled oats':'yulaf ezmesi','breadcrumbs':'galeta unu',
  'basmati rice':'basmati pirinci','jasmine rice':'yasemin pirinci','long grain rice':'uzun taneli pirinç','short grain rice':'kısa taneli pirinç','noodles':'erişte','rice noodles':'pirinç eriştesi',
  'dark chocolate':'bitter çikolata','chocolate':'çikolata','cocoa powder':'kakao','vanilla extract':'vanilya özütü','baking powder':'kabartma tozu','bicarbonate of soda':'karbonat'
};

function hmAreaTr(x){return HM_AREA_TR[String(x||'').trim()]||String(x||'').trim()}

function hmMeasureTr(text){
  let s=String(text||'').trim();
  Object.entries(HM_MEASURE_TR).sort((a,b)=>b[0].length-a[0].length).forEach(([en,tr])=>{
    const re=new RegExp('\\b'+en.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\b','gi');
    s=s.replace(re,tr);
  });
  s=s.replace(/\s+/g,' ').trim();
  return s;
}

async function hmIngredientTr(name){
  const key=n(name);
  if(HM_ING_TR[key])return HM_ING_TR[key];
  if(HM_ING_EXTRA_TR[key])return HM_ING_EXTRA_TR[key];
  const t=await hmTranslateChunk(name);
  if(!t)return null;
  const cleaned=String(t).replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
  if(!cleaned||n(cleaned)===key)return null;
  return cleaned;
}

async function hmFindWorldRecipe(previousName=''){
  if(!navigator.onLine||S.selectedType==='içecek')return null;
  const f=hmRemoteForbidden();
  if(f.unknown.length)return null;
  let areas=hmShuffle(hmAreas());
  if(!areas.length)return null;
  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele')areas=areas.slice(0,Math.min(areas.length,4));
  else areas=areas.slice(0,7);

  for(const area of areas){
    try{
      const response=await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?a='+encodeURIComponent(area),{cache:'no-store'});
      if(!response.ok)continue;
      const data=await response.json();
      const list=hmShuffle(data?.meals||[]).filter(x=>!previousName||n(x.strMeal)!==n(previousName)).slice(0,16);
      for(let i=0;i<list.length;i+=4){
        const batch=await Promise.all(list.slice(i,i+4).map(x=>hmLookup(x.idMeal)));
        const candidates=batch.filter(Boolean).filter(hmCategoryOk).filter(x=>!hmRemoteUnsafe(x,f.terms));
        for(const meal of candidates){
          const steps=await hmTranslateInstructions(meal.strInstructions);
          if(!steps||steps.length<3)continue;
          const ingredients=[];
          let failed=false;
          for(const row of hmMealIngredients(meal)){
            const trName=await hmIngredientTr(row.ingredient);
            if(!trName){failed=true;break}
            ingredients.push(`${row.measure?hmMeasureTr(row.measure)+' ':''}${trName}`.trim());
          }
          if(failed||!ingredients.length)continue;
          const areaTr=hmAreaTr(meal.strArea||area);
          const recipe={
            name:meal.strMeal,
            cuisine:areaTr,
            type:S.selectedType==='sürpriz'?'yemek':S.selectedType,
            time:'yaklaşık 30-60 dk',
            servings:'2-4 kişilik',
            sourceType:'world',
            inspiration:`${areaTr} mutfağından gerçek tarif`,
            ingredients,
            steps,
            ai:false,
            remote:true,
            sourceName:'TheMealDB',
            sourceUrl:meal.strSource||''
          };
          if(!unsafeRecipe(recipe))return recipe;
        }
      }
    }catch(e){console.warn('Dünya tarif kaynağına ulaşılamadı',e)}
  }
  return null;
}

const hmRenderV014=window.renderRecipe;
window.renderRecipe=function(){
  const r=S.lastRecipe;
  if(r&&r.remote){
    r.cuisine=hmAreaTr(r.cuisine);
    if(r.inspiration)r.inspiration=r.inspiration.replace(/^([A-Za-z ]+) mutfağından/,m=>hmAreaTr(m.replace(' mutfağından',''))+' mutfağından');
  }
  hmRenderV014();
};

const v014Version=document.querySelector('.brand>.mini');
if(v014Version)v014Version.textContent='beta • v0.14';
