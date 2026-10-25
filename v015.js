/* HandeMade v0.15 — geniş ücretsiz canlı tarif taraması */

const HM_EXTRA_CUISINES=[
  {id:'çin',label:'🇨🇳 Çin',terms:['çin','chinese','china'],areas:['Chinese'],textual:['Chinese']},
  {id:'vietnam',label:'🇻🇳 Vietnam',terms:['vietnam','vietnamese'],areas:['Vietnamese'],textual:['Vietnamese']},
  {id:'endonezya',label:'🇮🇩 Endonezya',terms:['endonezya','indonesian','indonesia'],areas:[],textual:['Indonesian']},
  {id:'filipin',label:'🇵🇭 Filipin',terms:['filipin','filipino','philippines'],areas:['Filipino'],textual:['Filipino']},
  {id:'peru',label:'🇵🇪 Peru',terms:['peru','peruvian'],areas:[],textual:['Peruvian']},
  {id:'brezilya',label:'🇧🇷 Brezilya',terms:['brezilya','brazilian','brazil'],areas:[],textual:['Brazilian']},
  {id:'alman',label:'🇩🇪 Alman',terms:['alman','german','germany'],areas:[],textual:['German']},
  {id:'ingiliz',label:'🇬🇧 İngiliz',terms:['ingiliz','british','england','uk'],areas:['British'],textual:['British']},
  {id:'amerikan',label:'🇺🇸 Amerikan',terms:['amerikan','american','usa'],areas:['American'],textual:['American','Southern American']},
  {id:'portekiz',label:'🇵🇹 Portekiz',terms:['portekiz','portuguese','portugal'],areas:['Portuguese'],textual:['Portuguese']},
  {id:'rus',label:'🇷🇺 Rus',terms:['rus','russian','russia'],areas:['Russian'],textual:['Russian']},
  {id:'karayip',label:'🏝️ Karayip',terms:['karayip','caribbean'],areas:[],textual:['Caribbean']},
  {id:'batı afrika',label:'🌍 Batı Afrika',terms:['batı afrika','west african'],areas:[],textual:['West African']}
];

HM_EXTRA_CUISINES.forEach(c=>{
  if(!CUISINES.some(x=>x.id===c.id))CUISINES.push({id:c.id,label:c.label});
  CUISINE_TERMS[c.id]=c.terms;
  if(c.areas.length)HM_AREA_MAP[c.id]=c.areas;
});

Object.assign(HM_AREA_TR,{
  'Indonesian':'Endonezya','Peruvian':'Peru','Brazilian':'Brezilya','German':'Alman','Caribbean':'Karayip','West African':'Batı Afrika',
  'Middle Eastern':'Orta Doğu','Southern American':'Güney Amerika','Italian-American':'İtalyan-Amerikan','Portuguese':'Portekiz'
});

const HM_TEXTUAL_CUISINES={
  'türk':['Turkish'],'italyan':['Italian'],'japon':['Japanese'],'meksika':['Mexican'],'hint':['Indian'],'tay':['Thai'],'kore':['Korean'],
  'fransız':['French'],'ispanyol':['Spanish'],'yunan':['Greek'],'orta doğu':['Middle Eastern'],'fas':['Moroccan'],
  ...Object.fromEntries(HM_EXTRA_CUISINES.map(c=>[c.id,c.textual]))
};

let hmTextualIndexCache=null;
const hmTranslationCache=new Map();

function hmDecodeHtml(s){
  const t=document.createElement('textarea');
  t.innerHTML=String(s||'');
  return t.value;
}

async function hmTranslateCached(text){
  const key=String(text||'').trim();
  if(!key)return '';
  if(hmTranslationCache.has(key))return hmTranslationCache.get(key);
  const t=await hmTranslateChunk(key);
  const out=t?hmDecodeHtml(t).trim():null;
  if(out)hmTranslationCache.set(key,out);
  return out;
}

function hmNumberValue(raw){
  const s=String(raw).trim();
  if(/^\d+\s+\d+\/\d+$/.test(s)){
    const [whole,f]=s.split(/\s+/);const [a,b]=f.split('/').map(Number);return Number(whole)+a/b;
  }
  if(/^\d+\/\d+$/.test(s)){const [a,b]=s.split('/').map(Number);return a/b}
  return Number(s.replace(',','.'));
}

function hmMetricizeEnglish(text){
  let s=String(text||'');
  const num='(\\d+(?:[.,]\\d+)?|\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+)';
  s=s.replace(new RegExp(num+'\\s*(?:fl\\.?\\s*oz|fluid ounces?)\\b','gi'),(_,x)=>`${Math.round(hmNumberValue(x)*29.5735)} ml`);
  s=s.replace(new RegExp(num+'\\s*(?:lbs?|pounds?)\\b','gi'),(_,x)=>`${Math.round(hmNumberValue(x)*453.592)} g`);
  s=s.replace(new RegExp(num+'\\s*(?:oz|ounces?)\\b','gi'),(_,x)=>`${Math.round(hmNumberValue(x)*28.3495)} g`);
  s=s.replace(new RegExp(num+'\\s*cups?\\b','gi'),(_,x)=>`${Math.round(hmNumberValue(x)*240)} ml`);
  s=s.replace(/(-?\d+(?:\.\d+)?)\s*°?F\b/gi,(_,x)=>`${Math.round((Number(x)-32)*5/9)} °C`);
  s=s.replace(new RegExp(num+'\\s*inches?\\b','gi'),(_,x)=>`${(hmNumberValue(x)*2.54).toFixed(1).replace('.0','')} cm`);
  return s;
}

function hmTextualList(raw){
  if(Array.isArray(raw))return raw;
  if(Array.isArray(raw?.recipes))return raw.recipes;
  if(Array.isArray(raw?.items))return raw.items;
  if(Array.isArray(raw?.data))return raw.data;
  return [];
}

async function hmLoadTextualIndex(){
  if(hmTextualIndexCache)return hmTextualIndexCache;
  try{
    const r=await fetch('https://textualchef.com/recipes.json',{cache:'force-cache'});
    if(!r.ok)return [];
    const raw=await r.json();
    hmTextualIndexCache=hmTextualList(raw);
    return hmTextualIndexCache;
  }catch(e){
    console.warn('Textual Chef dizinine ulaşılamadı',e);
    return [];
  }
}

function hmEntryCuisine(x){return String(x?.cuisine||x?.area||x?.region||'').trim()}
function hmEntryMeal(x){return String(x?.meal||x?.mealType||x?.course||x?.category||'').trim()}
function hmEntryName(x){return String(x?.name||x?.title||'').trim()}
function hmEntryUrl(x){return String(x?.url||x?.page||'').trim()}
function hmEntryText(x){
  const direct=String(x?.text||x?.markdown||x?.recipeMd||x?.recipe_md||'').trim();
  if(direct)return direct;
  const url=hmEntryUrl(x);
  if(url)return url.replace(/\/?$/,'/')+'recipe.md';
  const id=String(x?.id||x?.slug||'').trim();
  return id?`https://textualchef.com/recipes/${encodeURIComponent(id)}/recipe.md`:'';
}

function hmTextualMealOk(entry){
  if(S.selectedType==='sürpriz')return true;
  const m=n(hmEntryMeal(entry));
  if(!m)return true;
  if(S.selectedType==='kahvaltı')return /breakfast|brunch/.test(m);
  if(S.selectedType==='tatlı')return /dessert|sweet/.test(m);
  if(S.selectedType==='içecek')return /drink|beverage/.test(m);
  if(S.selectedType==='atıştırmalık')return /snack|appetizer|starter|side/.test(m);
  return /dinner|lunch|soup|salad|main|stew|meal/.test(m)||!/breakfast|brunch|dessert|sweet|drink|beverage|snack/.test(m);
}

function hmTextualCuisineOk(entry){
  if(S.selectedCuisine==='tümü'||S.selectedCuisine==='rastgele')return true;
  const wanted=HM_TEXTUAL_CUISINES[S.selectedCuisine]||[];
  const got=n(hmEntryCuisine(entry));
  return wanted.some(x=>got.includes(n(x)));
}

function hmStripMarkdown(s){
  return String(s||'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*_`>#]/g,'').trim();
}

function hmParseTextualMarkdown(md){
  const lines=String(md||'').replace(/\r/g,'').split('\n');
  let mode=''; const ingredients=[]; const steps=[];
  for(const raw of lines){
    const line=raw.trim();
    if(!line)continue;
    const heading=line.match(/^#{1,6}\s+(.+)$/);
    if(heading){
      const h=n(heading[1]);
      if(/ingredients|malzemeler/.test(h))mode='ingredients';
      else if(/instructions|method|directions|preparation|hazırlanış|yapılış/.test(h))mode='steps';
      else if(mode)mode='';
      continue;
    }
    if(mode==='ingredients'){
      const m=line.match(/^[-*+]\s+(.+)$/);
      if(m)ingredients.push(hmStripMarkdown(m[1]));
    }else if(mode==='steps'){
      const m=line.match(/^(?:\d+[.)]|[-*+])\s+(.+)$/);
      if(m)steps.push(hmStripMarkdown(m[1]));
      else if(steps.length&&line.length>20)steps[steps.length-1]+=' '+hmStripMarkdown(line);
    }
  }
  return {ingredients:ingredients.filter(Boolean).slice(0,24),steps:steps.filter(Boolean).slice(0,12)};
}

async function hmTranslateIngredientLine(line){
  const metric=hmMetricizeEnglish(line);
  const translated=await hmTranslateCached(metric);
  if(!translated)return null;
  return translated.replace(/\b tablespoons?\b/gi,' yemek kaşığı').replace(/\b teaspoons?\b/gi,' çay kaşığı').replace(/\s+/g,' ').trim();
}

async function hmTextualToRecipe(entry,md){
  const parsed=hmParseTextualMarkdown(md);
  if(parsed.ingredients.length<3||parsed.steps.length<3)return null;
  const ingredients=[];
  for(const line of parsed.ingredients){
    const tr=await hmTranslateIngredientLine(line);
    if(!tr)return null;
    ingredients.push(tr);
  }
  const steps=[];
  for(const step of parsed.steps.slice(0,9)){
    const tr=await hmTranslateCached(hmMetricizeEnglish(step));
    if(!tr)return null;
    steps.push(tr);
  }
  const cuisineEn=hmEntryCuisine(entry);
  const cuisineTr=hmAreaTr(cuisineEn)||cuisineEn||'Dünya';
  const mins=Number(entry?.time?.totalMinutes||entry?.totalMinutes||entry?.minutes||0);
  const servings=Number(entry?.servings||0);
  return {
    name:hmEntryName(entry),
    cuisine:cuisineTr,
    type:S.selectedType==='sürpriz'?'yemek':S.selectedType,
    time:mins?`yaklaşık ${mins} dk`:'yaklaşık 30-60 dk',
    servings:servings?`${servings} kişilik`:'2-4 kişilik',
    sourceType:'world',
    inspiration:`${cuisineTr} mutfağından gerçek tarif`,
    ingredients,steps,ai:false,remote:true,
    sourceName:'Textual Chef',sourceUrl:hmEntryUrl(entry)
  };
}

async function hmFindTextualRecipe(previousName=''){
  const f=hmRemoteForbidden();
  if(f.unknown.length)return null;
  const index=await hmLoadTextualIndex();
  if(!index.length)return null;
  let pool=index.filter(hmTextualMealOk).filter(hmTextualCuisineOk).filter(x=>!previousName||n(hmEntryName(x))!==n(previousName));
  if(!pool.length)return null;
  pool=hmShuffle(pool);
  // Geniş katalogdan en çok 36 ayrıntılı tarifi aç; çoğu istekte ilk birkaç adayda sonuç çıkar.
  for(const entry of pool.slice(0,36)){
    const textUrl=hmEntryText(entry);
    if(!textUrl)continue;
    try{
      const r=await fetch(textUrl,{cache:'force-cache'});
      if(!r.ok)continue;
      const md=await r.text();
      const hay=(hmEntryName(entry)+' | '+hmEntryCuisine(entry)+' | '+md).toLowerCase();
      if(f.terms.some(t=>t&&hay.includes(t)))continue;
      const recipe=await hmTextualToRecipe(entry,md);
      if(recipe&&!unsafeRecipe(recipe))return recipe;
    }catch(e){console.warn('Textual Chef tarifine ulaşılamadı',e)}
  }
  return null;
}

async function hmFindMealDbWide(previousName=''){
  if(S.selectedType==='içecek')return null;
  const f=hmRemoteForbidden();
  if(f.unknown.length)return null;
  let areas=hmShuffle(hmAreas());
  if(!areas.length)return null;
  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele')areas=areas.slice(0,Math.min(areas.length,6));
  else areas=areas.slice(0,14);
  for(const area of areas){
    try{
      const r=await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?a='+encodeURIComponent(area),{cache:'force-cache'});
      if(!r.ok)continue;
      const d=await r.json();
      const list=hmShuffle(d?.meals||[]).filter(x=>!previousName||n(x.strMeal)!==n(previousName));
      // v0.14'teki 16 tarif sınırı kaldırıldı: bu mutfaktaki tüm adaylar gerektiği kadar taranır.
      for(let i=0;i<list.length;i+=5){
        const batch=await Promise.all(list.slice(i,i+5).map(x=>hmLookup(x.idMeal)));
        const candidates=batch.filter(Boolean).filter(hmCategoryOk).filter(x=>!hmRemoteUnsafe(x,f.terms));
        for(const meal of candidates){
          const steps=await hmTranslateInstructions(meal.strInstructions);
          if(!steps||steps.length<3)continue;
          const ingredients=[];let failed=false;
          for(const row of hmMealIngredients(meal)){
            const trName=await hmIngredientTr(row.ingredient);
            if(!trName){failed=true;break}
            ingredients.push(`${row.measure?hmMeasureTr(row.measure)+' ':''}${trName}`.trim());
          }
          if(failed||!ingredients.length)continue;
          const areaTr=hmAreaTr(meal.strArea||area);
          const recipe={name:meal.strMeal,cuisine:areaTr,type:S.selectedType==='sürpriz'?'yemek':S.selectedType,time:'yaklaşık 30-60 dk',servings:'2-4 kişilik',sourceType:'world',inspiration:`${areaTr} mutfağından gerçek tarif`,ingredients,steps,ai:false,remote:true,sourceName:'TheMealDB',sourceUrl:meal.strSource||''};
          if(!unsafeRecipe(recipe))return recipe;
        }
      }
    }catch(e){console.warn('TheMealDB kaynağına ulaşılamadı',e)}
  }
  return null;
}

hmFindWorldRecipe=async function(previousName=''){
  if(!navigator.onLine)return null;
  // Büyük katalog önce, ikinci yapılandırılmış kaynak sonra. Yerel tarifler en son v0.11/v0.13 akışında devreye girer.
  const textual=await hmFindTextualRecipe(previousName);
  if(textual)return textual;
  return hmFindMealDbWide(previousName);
};

const hmRenderV015=window.renderRecipe;
window.renderRecipe=function(){
  hmRenderV015();
  const e=document.getElementById('recipe');
  const r=S.lastRecipe;
  if(!e||!r)return;
  const old=e.querySelector('.world-source-v013');
  if(old)old.remove();
  if(r.remote){
    const first=e.querySelector('.card');
    if(first){
      const s=document.createElement('div');
      s.className='world-source-v015';
      s.style.cssText='margin-top:10px;font-size:12px;color:var(--muted);line-height:1.5';
      s.innerHTML=`<strong>🌐 Canlı tarif kaynağı:</strong> ${r.sourceName||'Dünya tarif veritabanı'} • Profil filtrelerinden geçirildi ve Türkçeleştirildi.`;
      first.appendChild(s);
    }
  }
};

(function hmV015Ui(){
  renderCuisineOptions();
  const badge=document.getElementById('aiBadge');
  const status=document.getElementById('aiStatus');
  if(badge){badge.className='badge live';badge.textContent='Canlı çok kaynaklı tarama'}
  if(status)status.textContent='4.600+ katalog + TheMealDB + güvenli yerel yedek';
  const v=document.querySelector('.brand>.mini');
  if(v)v.textContent='beta • v0.15';
})();
