const HM_AREA_MAP={
  'türk':['Turkish'],
  'italyan':['Italian'],
  'japon':['Japanese'],
  'meksika':['Mexican'],
  'hint':['Indian'],
  'tay':['Thai'],
  'kore':['South Korean'],
  'fransız':['French'],
  'ispanyol':['Spanish'],
  'yunan':['Greek'],
  'orta doğu':['Lebanese','Palestinian','Syrian','Jordanian','Iraqi','Israeli','Saudi Arabian','Yemeni'],
  'fas':['Moroccan']
};

const HM_FORBIDDEN_EN={
  'süt':['milk','buttermilk','evaporated milk','condensed milk'],
  'yoğurt':['yogurt','yoghurt'],
  'peynir':['cheese','parmesan','mozzarella','feta','cheddar','ricotta','mascarpone'],
  'tereyağı':['butter','ghee'],
  'krema':['cream','double cream','single cream','sour cream','crème fraîche'],
  'whey':['whey'],'casein':['casein'],'kazein':['casein'],'laktoz':['lactose'],
  'yumurta':['egg','eggs'],'mayonez':['mayonnaise','mayo'],
  'yer fıstığı':['peanut','peanuts'],'fıstık ezmesi':['peanut butter'],
  'badem':['almond','almonds'],'ceviz':['walnut','walnuts'],'fındık':['hazelnut','hazelnuts'],
  'kaju':['cashew','cashews'],'antep fıstığı':['pistachio','pistachios'],
  'buğday':['wheat'],'un':['flour'],'ekmek':['bread','breadcrumbs'],'makarna':['pasta','spaghetti','noodles'],
  'bulgur':['bulgur','bulghur'],'gluten':['gluten'],'kuskus':['couscous'],
  'soya':['soy','soya'],'tofu':['tofu'],'soya sosu':['soy sauce','soya sauce'],'miso':['miso'],
  'susam':['sesame'],'tahin':['tahini'],'susam yağı':['sesame oil'],
  'balık':['fish'],'somon':['salmon'],'hamsi':['anchovy','anchovies'],'ton balığı':['tuna'],'sardalya':['sardine','sardines'],
  'karides':['shrimp','prawn','prawns'],'midye':['mussel','mussels'],'kalamar':['squid','calamari'],
  'ıstakoz':['lobster'],'yengeç':['crab'],
  'hardal':['mustard'],'kereviz':['celery'],'karabiber':['black pepper','pepper'],
  'mantar':['mushroom','mushrooms'],'patlıcan':['aubergine','eggplant'],'kabak':['courgette','zucchini'],
  'soğan':['onion','onions'],'sarımsak':['garlic'],'domates':['tomato','tomatoes'],
  'havuç':['carrot','carrots'],'nohut':['chickpea','chickpeas'],'mercimek':['lentil','lentils']
};

const HM_ING_TR={
  'olive oil':'zeytinyağı','vegetable oil':'bitkisel yağ','sunflower oil':'ayçiçek yağı','water':'su','salt':'tuz','black pepper':'karabiber',
  'garlic':'sarımsak','onion':'soğan','red onion':'kırmızı soğan','tomato':'domates','tomatoes':'domates','potato':'patates','potatoes':'patates',
  'carrot':'havuç','carrots':'havuç','celery':'kereviz','mushrooms':'mantar','mushroom':'mantar','aubergine':'patlıcan','eggplant':'patlıcan',
  'courgette':'kabak','zucchini':'kabak','red pepper':'kırmızı biber','green pepper':'yeşil biber','bell pepper':'dolmalık biber',
  'chickpeas':'nohut','chickpea':'nohut','lentils':'mercimek','lentil':'mercimek','rice':'pirinç','parsley':'maydanoz','coriander':'kişniş',
  'cilantro':'kişniş','cumin':'kimyon','paprika':'toz biber','turmeric':'zerdeçal','cinnamon':'tarçın','lemon':'limon','lime':'lime',
  'spinach':'ıspanak','green beans':'taze fasulye','peas':'bezelye','sweetcorn':'mısır','corn':'mısır','beans':'fasulye','white beans':'beyaz fasulye',
  'black beans':'siyah fasulye','kidney beans':'kırmızı fasulye','chicken':'tavuk','chicken breast':'tavuk göğsü','beef':'dana eti','lamb':'kuzu eti',
  'fish':'balık','salmon':'somon','tuna':'ton balığı','shrimp':'karides','prawns':'karides','egg':'yumurta','eggs':'yumurta',
  'milk':'süt','butter':'tereyağı','cheese':'peynir','flour':'un','bread':'ekmek','breadcrumbs':'galeta unu','pasta':'makarna','spaghetti':'spagetti'
};

function hmRemoteForbidden(){
  const out=[];
  const unknown=[];
  forbidden().forEach(term=>{
    const t=n(term);
    if(HM_FORBIDDEN_EN[t]) out.push(...HM_FORBIDDEN_EN[t]);
    else if(/^[a-z0-9 .'-]+$/i.test(t)) out.push(t);
    else unknown.push(t);
  });
  return {terms:[...new Set(out.map(x=>x.toLowerCase()))],unknown};
}

function hmAreas(){
  if(S.selectedCuisine==='tümü'||S.selectedCuisine==='rastgele'){
    return Object.values(HM_AREA_MAP).flat();
  }
  return HM_AREA_MAP[S.selectedCuisine]||[];
}

function hmCategoryOk(meal){
  const c=n(meal.strCategory);
  if(S.selectedType==='sürpriz')return true;
  if(S.selectedType==='tatlı')return c==='dessert';
  if(S.selectedType==='kahvaltı')return c==='breakfast';
  if(S.selectedType==='atıştırmalık')return c==='starter'||c==='side';
  if(S.selectedType==='içecek')return false;
  return !['dessert','breakfast','starter'].includes(c);
}

function hmMealIngredients(meal){
  const rows=[];
  for(let i=1;i<=20;i++){
    const ingredient=(meal['strIngredient'+i]||'').trim();
    const measure=(meal['strMeasure'+i]||'').trim();
    if(ingredient)rows.push({ingredient,measure});
  }
  return rows;
}

function hmRemoteUnsafe(meal,terms){
  const hay=[meal.strMeal,meal.strCategory,meal.strArea,...hmMealIngredients(meal).map(x=>x.ingredient)].join(' | ').toLowerCase();
  return terms.some(t=>t&&hay.includes(t));
}

function hmShuffle(a){
  const x=a.slice();
  for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}
  return x;
}

function hmTranslateIngredient(name){
  const key=n(name);
  return HM_ING_TR[key]||name;
}

function hmSplitText(text,max=430){
  const sentences=String(text||'').replace(/\s+/g,' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];
  const chunks=[];let cur='';
  sentences.forEach(s=>{
    const next=(cur+' '+s).trim();
    if(next.length>max&&cur){chunks.push(cur);cur=s.trim()}else cur=next;
  });
  if(cur)chunks.push(cur);
  return chunks.slice(0,8);
}

async function hmTranslateChunk(text){
  try{
    const u='https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair=en|tr';
    const r=await fetch(u,{cache:'no-store'});
    if(!r.ok)return null;
    const d=await r.json();
    return d?.responseData?.translatedText||null;
  }catch(e){return null}
}

async function hmTranslateInstructions(text){
  const chunks=hmSplitText(text);
  if(!chunks.length)return null;
  const translated=[];
  for(const c of chunks){
    const t=await hmTranslateChunk(c);
    if(!t)return null;
    translated.push(t);
  }
  const merged=translated.join(' ');
  return (merged.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[merged]).map(x=>x.trim()).filter(Boolean).slice(0,9);
}

async function hmLookup(id){
  try{
    const r=await fetch('https://www.themealdb.com/api/json/v1/1/lookup.php?i='+encodeURIComponent(id),{cache:'no-store'});
    if(!r.ok)return null;
    const d=await r.json();
    return d?.meals?.[0]||null;
  }catch(e){return null}
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
      const r=await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?a='+encodeURIComponent(area),{cache:'no-store'});
      if(!r.ok)continue;
      const d=await r.json();
      const list=hmShuffle(d?.meals||[]).filter(x=>!previousName||n(x.strMeal)!==n(previousName)).slice(0,14);
      for(let i=0;i<list.length;i+=4){
        const batch=await Promise.all(list.slice(i,i+4).map(x=>hmLookup(x.idMeal)));
        const candidates=batch.filter(Boolean).filter(hmCategoryOk).filter(x=>!hmRemoteUnsafe(x,f.terms));
        for(const meal of candidates){
          const steps=await hmTranslateInstructions(meal.strInstructions);
          if(!steps||steps.length<3)continue;
          const ingredients=hmMealIngredients(meal).map(x=>`${x.measure?x.measure+' ':''}${hmTranslateIngredient(x.ingredient)}`.trim());
          const recipe={
            name:meal.strMeal,
            cuisine:meal.strArea||area,
            type:S.selectedType==='sürpriz'?'yemek':S.selectedType,
            time:'yaklaşık 30-60 dk',
            servings:'2-4 kişilik',
            sourceType:'world',
            inspiration:`${meal.strArea||area} mutfağından gerçek tarif`,
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
    }catch(e){console.warn('World recipe source unavailable',e)}
  }
  return null;
}

const hmBaseRenderV013=window.renderRecipe;
window.renderRecipe=function(){
  hmBaseRenderV013();
  const e=document.getElementById('recipe');
  const r=S.lastRecipe;
  if(!e||!r)return;
  if(r.remote){
    const first=e.querySelector('.card');
    if(first&&!first.querySelector('.world-source-v013')){
      const s=document.createElement('div');
      s.className='world-source-v013';
      s.style.cssText='margin-top:10px;font-size:12px;color:var(--muted);line-height:1.5';
      s.innerHTML='<strong>🌐 Canlı dünya tarif veritabanı:</strong> TheMealDB kaynağından bulundu, HandeMade profil filtresinden geçirildi.';
      first.appendChild(s);
    }
  }
};

const hmOldGenerateV013=window.generateRecipe;
window.generateRecipe=async function(retry=false){
  const previousName=retry&&S.lastRecipe?S.lastRecipe.name:'';
  go('recipe');
  const target=document.getElementById('recipe');
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${retry?'Aynı seçimlerle yeni tarif aranıyor':'Dünya mutfağı taranıyor'}…</strong><p>Önce geniş canlı tarif kaynağında, sonra AI/yerel yedekte aranıyor.</p></div>`;

  const remote=await hmFindWorldRecipe(previousName);
  if(remote){
    ensureDetailedSteps(remote);
    if(!unsafeRecipe(remote)){
      S.lastRecipe=remote;
      save();
      renderRecipe();
      return;
    }
  }

  return hmOldGenerateV013(retry);
};

(function(){
  const badge=document.getElementById('aiBadge');
  const status=document.getElementById('aiStatus');
  if(badge&&location.hostname.endsWith('github.io')){
    badge.className='badge live';
    badge.textContent='Dünya taraması açık';
    if(status)status.textContent='Canlı tarif veritabanı + güvenli yerel yedek';
  }
  const v=document.querySelector('.brand>.mini');
  if(v)v.textContent='beta • v0.13';
})();
