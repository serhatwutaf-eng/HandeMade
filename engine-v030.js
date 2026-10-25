/* HandeMade v0.30 - tek motor, buyuk ucretsiz kaynak havuzu */

const HM30_VERSION='0.30';
const HM30_ARCHIVE_MANIFEST='https://raw.githubusercontent.com/AdamBouhmad/open-recipe-archive/main/index/collections.json';
const HM30_ARCHIVE_BASE='https://raw.githubusercontent.com/AdamBouhmad/open-recipe-archive/main/collections/';
const HM30_DP_BASE='https://raw.githubusercontent.com/dpapathanasiou/recipes/master/';

const HM30_CULTURES={
  'türk':['turkey'], 'italyan':['italy'], 'japon':['japan'], 'meksika':['mexico'], 'hint':['india'],
  'fransız':['france'], 'ispanyol':['spain'], 'yunan':['greece'], 'çin':['china'], 'filipin':['philippines'],
  'brezilya':['brazil'], 'alman':['germany'], 'ingiliz':['united-kingdom'], 'portekiz':['portugal'],
  'amerikan':['american-historical','us-louisiana'], 'karayip':['west-indies']
};

const HM30_DP_KEYWORDS={
  'türk':['turkish','ottoman','anatolian'], 'italyan':['italian'], 'japon':['japanese'], 'meksika':['mexican'],
  'hint':['indian'], 'tay':['thai'], 'kore':['korean'], 'fransız':['french'], 'ispanyol':['spanish'],
  'yunan':['greek'], 'orta doğu':['middle-eastern','lebanese'], 'fas':['moroccan'], 'çin':['chinese'],
  'vietnam':['vietnamese'], 'endonezya':['indonesian'], 'filipin':['filipino'], 'peru':['peruvian'],
  'brezilya':['brazilian'], 'alman':['german'], 'ingiliz':['british'], 'amerikan':['american'],
  'portekiz':['portuguese'], 'rus':['russian'], 'karayip':['caribbean'], 'batı afrika':['west-african','african']
};

const HM30_AREAS={
  'türk':['Turkish'], 'italyan':['Italian'], 'japon':['Japanese'], 'meksika':['Mexican'], 'hint':['Indian'],
  'tay':['Thai'], 'kore':['South Korean'], 'fransız':['French'], 'ispanyol':['Spanish'], 'yunan':['Greek'],
  'orta doğu':['Lebanese','Palestinian','Syrian','Jordanian','Iraqi','Saudi Arabian','Yemeni'], 'fas':['Moroccan'],
  'çin':['Chinese'], 'vietnam':['Vietnamese'], 'filipin':['Filipino'], 'ingiliz':['British'],
  'amerikan':['American'], 'portekiz':['Portuguese'], 'rus':['Russian']
};

const HM30_LABELS={
  'türk':'Türk','italyan':'İtalyan','japon':'Japon','meksika':'Meksika','hint':'Hint','tay':'Tay','kore':'Kore',
  'fransız':'Fransız','ispanyol':'İspanyol','yunan':'Yunan','orta doğu':'Orta Doğu','fas':'Fas','çin':'Çin',
  'vietnam':'Vietnam','endonezya':'Endonezya','filipin':'Filipin','peru':'Peru','brezilya':'Brezilya',
  'alman':'Alman','ingiliz':'İngiliz','amerikan':'Amerikan','portekiz':'Portekiz','rus':'Rus','karayip':'Karayip','batı afrika':'Batı Afrika'
};

if(typeof HM_FORBIDDEN_EN!=='undefined'){
  HM_FORBIDDEN_EN['karabiber']=['black pepper','ground black pepper','black peppercorn','black peppercorns','peppercorn','peppercorns'];
}

const HM30_CACHE={manifest:null,archive:new Map(),dpIndex:new Map(),dpRecipe:new Map(),mealList:new Map(),meal:new Map(),filterTr:new Map()};

function hm30Shuffle(a){
  const x=a.slice();
  for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}
  return x;
}

function hm30Esc(s){
  return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function hm30SafeUrl(s){
  try{const u=new URL(String(s||''));return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return ''}
}

function hm30NormEn(s){return String(s||'').toLowerCase().replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim()}
function hm30EscRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}

function hm30HasBlackPepper(text){
  const t=hm30NormEn(text);
  if(/\bblack\s+pepper\b|\bpeppercorns?\b/.test(t))return true;
  const words=t.split(' ');
  const safePrev=new Set(['red','green','bell','chili','chilli','cayenne','sweet','hot','white','banana','poblano','jalapeno','serrano']);
  for(let i=0;i<words.length;i++){
    if(words[i]==='pepper'&&!safePrev.has(words[i-1]||''))return true;
  }
  return false;
}

function hm30ContainsTerm(text,term){
  const hay=' '+hm30NormEn(text)+' ';
  const needle=hm30NormEn(term);
  if(!needle)return false;
  return new RegExp('(^|[^a-z0-9])'+hm30EscRe(needle)+'([^a-z0-9]|$)','i').test(hay);
}

async function hm30TranslateFilterToEnglish(term){
  const key=String(term||'').trim();
  if(!key)return null;
  if(HM30_CACHE.filterTr.has(key))return HM30_CACHE.filterTr.get(key);
  try{
    const r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(key)+'&langpair=tr|en',{cache:'force-cache'});
    if(!r.ok)return null;
    const d=await r.json();
    const out=String(d?.responseData?.translatedText||'').trim().toLowerCase();
    if(!out||n(out)===n(key))return null;
    HM30_CACHE.filterTr.set(key,out);
    return out;
  }catch(e){return null}
}

async function hm30BuildFilter(){
  const original=[...new Set(forbidden().map(x=>n(x)).filter(Boolean))];
  const aliases=[];
  const unknown=[];
  for(const term of original){
    if(term==='karabiber')continue;
    const mapped=(typeof HM_FORBIDDEN_EN!=='undefined'&&HM_FORBIDDEN_EN[term])||null;
    if(mapped){aliases.push(...mapped);continue}
    if(/^[a-z0-9 .'-]+$/i.test(term)){aliases.push(term);continue}
    const tr=await hm30TranslateFilterToEnglish(term);
    if(tr)aliases.push(tr);else unknown.push(term);
  }
  return {original,aliases:[...new Set(aliases.map(hm30NormEn).filter(Boolean))],unknown,blackPepper:original.includes('karabiber')};
}

function hm30RawUnsafe(text,filter){
  if(filter.blackPepper&&hm30HasBlackPepper(text))return true;
  return filter.aliases.some(a=>hm30ContainsTerm(text,a));
}

const HM30_DESSERT=/\b(dessert|sweet|cake|cookie|cookies|pudding|custard|ice cream|sorbet|pastry|pie|tart|baklava|halva|helva|candy|jam|jelly|marmalade|syrup|confection|punch)\b/i;
const HM30_DRINK=/\b(drink|beverage|coffee|tea|lemonade|juice|cocktail|sherbet|sharbat|smoothie)\b/i;
const HM30_BREAKFAST=/\b(breakfast|brunch|omelette|omelet|scrambled eggs|pancake|waffle)\b/i;
const HM30_SNACK=/\b(appetizer|starter|snack|dip|spread|fritter|finger food|hors d'oeuvre|side dish)\b/i;

function hm30TypeOk(title,body=''){
  const text=(String(title||'')+' '+String(body||'')).slice(0,12000);
  if(S.selectedType==='sürpriz')return true;
  if(S.selectedType==='tatlı')return HM30_DESSERT.test(text);
  if(S.selectedType==='içecek')return HM30_DRINK.test(text);
  if(S.selectedType==='kahvaltı')return HM30_BREAKFAST.test(text)&&!HM30_DESSERT.test(text);
  if(S.selectedType==='atıştırmalık')return HM30_SNACK.test(text)&&!HM30_DESSERT.test(text)&&!HM30_DRINK.test(text);
  return !HM30_DESSERT.test(text)&&!HM30_DRINK.test(text)&&!HM30_BREAKFAST.test(text);
}

function hm30CuisinePool(){
  return CUISINES.map(x=>x.id).filter(id=>!['tümü','rastgele'].includes(id));
}

function hm30TargetCuisineIds(){
  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele')return [S.selectedCuisine];
  const pool=hm30CuisinePool();
  if(!pool.length)return ['türk'];
  if(S.selectedCuisine==='rastgele')return [pool[Math.floor(Math.random()*pool.length)]];
  return hm30Shuffle(pool).slice(0,2);
}

function hm30CuisineLabel(id){return HM30_LABELS[id]||cuisineName(id)||id}

async function hm30Manifest(){
  if(HM30_CACHE.manifest)return HM30_CACHE.manifest;
  try{
    const r=await fetch(HM30_ARCHIVE_MANIFEST,{cache:'force-cache'});
    if(!r.ok)return [];
    HM30_CACHE.manifest=await r.json();
    return HM30_CACHE.manifest;
  }catch(e){console.warn('Open Recipe Archive manifest alınamadı',e);return []}
}

async function hm30ArchiveCollection(slug){
  if(HM30_CACHE.archive.has(slug))return HM30_CACHE.archive.get(slug);
  try{
    const r=await fetch(HM30_ARCHIVE_BASE+encodeURIComponent(slug)+'/recipes.jsonl',{cache:'force-cache'});
    if(!r.ok)return [];
    const text=await r.text();
    const rows=text.split('\n').map(x=>x.trim()).filter(Boolean).map(line=>{try{return JSON.parse(line)}catch(e){return null}}).filter(Boolean);
    HM30_CACHE.archive.set(slug,rows);
    return rows;
  }catch(e){console.warn('Açık tarif koleksiyonu alınamadı',slug,e);return []}
}

async function hm30ArchiveCandidates(cuisineId,filter,previousName){
  const cultures=HM30_CULTURES[cuisineId]||[];
  if(!cultures.length)return {items:[],scanned:0,available:0};
  const manifest=await hm30Manifest();
  const cols=manifest.filter(c=>cultures.includes(String(c.culture||'').toLowerCase()));
  let items=[];let scanned=0;let available=0;
  for(const col of cols){
    available+=Number(col.recipe_count||0);
    const rows=await hm30ArchiveCollection(col.slug);
    scanned+=rows.length;
    const safe=rows.filter(x=>!previousName||n(x.title)!==n(previousName)).filter(x=>hm30TypeOk(x.title,x.body)).filter(x=>!hm30RawUnsafe((x.title||'')+' '+(x.body||''),filter));
    items.push(...hm30Shuffle(safe).slice(0,160).map(x=>({kind:'archive',cuisineId,title:x.title,raw:x,sourceName:'Open Recipe Archive',sourceUrl:x.source_url||'',collection:col.name})));
  }
  return {items:hm30Shuffle(items),scanned,available};
}

function hm30DpIndexUrl(keyword){return HM30_DP_BASE+'index/'+keyword[0].toLowerCase()+'/'+encodeURIComponent(keyword)+'.md'}

async function hm30DpIndex(keyword){
  if(HM30_CACHE.dpIndex.has(keyword))return HM30_CACHE.dpIndex.get(keyword);
  try{
    const r=await fetch(hm30DpIndexUrl(keyword),{cache:'force-cache'});
    if(!r.ok){HM30_CACHE.dpIndex.set(keyword,[]);return []}
    const md=await r.text();
    const paths=[];
    for(const m of md.matchAll(/\]\(([^)]+\.json)\)/g)){
      let p=m[1].replace(/^\.\.\/\.\.\//,'').replace(/^\.\//,'');
      if(p.startsWith('index/'))paths.push(p);
    }
    const unique=[...new Set(paths)];
    HM30_CACHE.dpIndex.set(keyword,unique);
    return unique;
  }catch(e){HM30_CACHE.dpIndex.set(keyword,[]);return []}
}

async function hm30DpRecipe(path){
  if(HM30_CACHE.dpRecipe.has(path))return HM30_CACHE.dpRecipe.get(path);
  try{
    const r=await fetch(HM30_DP_BASE+path,{cache:'force-cache'});
    if(!r.ok)return null;
    const d=await r.json();
    HM30_CACHE.dpRecipe.set(path,d);
    return d;
  }catch(e){return null}
}

async function hm30DpCandidates(cuisineId,filter,previousName){
  const keywords=HM30_DP_KEYWORDS[cuisineId]||[];
  if(!keywords.length)return {items:[],scanned:0,available:0};
  let paths=[];
  for(const key of keywords)paths.push(...await hm30DpIndex(key));
  paths=[...new Set(paths)];
  const available=paths.length;
  const sample=hm30Shuffle(paths).slice(0,60);
  const items=[];let scanned=0;
  for(let i=0;i<sample.length;i+=6){
    const batch=await Promise.all(sample.slice(i,i+6).map(hm30DpRecipe));
    for(const d of batch){
      if(!d)continue;scanned++;
      const title=String(d.title||'').trim();
      if(!title||previousName&&n(title)===n(previousName))continue;
      const ingredients=Array.isArray(d.ingredients)?d.ingredients:[];
      const directions=Array.isArray(d.directions)?d.directions:[];
      const raw=[title,...ingredients,...directions,...(Array.isArray(d.tags)?d.tags:[])].join(' | ');
      if(!hm30TypeOk(title,raw)||hm30RawUnsafe(raw,filter))continue;
      items.push({kind:'dp',cuisineId,title,raw:d,sourceName:d.source||'Açık JSON tarif koleksiyonu',sourceUrl:d.url||''});
    }
  }
  return {items:hm30Shuffle(items),scanned,available};
}

async function hm30MealList(area){
  if(HM30_CACHE.mealList.has(area))return HM30_CACHE.mealList.get(area);
  try{
    const r=await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?a='+encodeURIComponent(area),{cache:'force-cache'});
    if(!r.ok)return [];
    const d=await r.json();const list=d?.meals||[];HM30_CACHE.mealList.set(area,list);return list;
  }catch(e){return []}
}

async function hm30Meal(id){
  if(HM30_CACHE.meal.has(id))return HM30_CACHE.meal.get(id);
  try{
    const r=await fetch('https://www.themealdb.com/api/json/v1/1/lookup.php?i='+encodeURIComponent(id),{cache:'force-cache'});
    if(!r.ok)return null;
    const d=await r.json();const meal=d?.meals?.[0]||null;if(meal)HM30_CACHE.meal.set(id,meal);return meal;
  }catch(e){return null}
}

function hm30MealTypeOk(meal){
  const c=n(meal?.strCategory||'');
  if(S.selectedType==='sürpriz')return true;
  if(S.selectedType==='tatlı')return c==='dessert';
  if(S.selectedType==='kahvaltı')return c==='breakfast';
  if(S.selectedType==='atıştırmalık')return ['starter','side'].includes(c);
  if(S.selectedType==='içecek')return false;
  return !['dessert','breakfast','starter'].includes(c);
}

function hm30MealRaw(meal){
  const ing=[];
  for(let i=1;i<=20;i++)if(meal['strIngredient'+i])ing.push(meal['strIngredient'+i]);
  return [meal.strMeal,meal.strCategory,meal.strArea,...ing,meal.strInstructions].join(' | ');
}

async function hm30MealCandidates(cuisineId,filter,previousName){
  const areas=HM30_AREAS[cuisineId]||[];
  if(!areas.length)return {items:[],scanned:0,available:0};
  let items=[];let scanned=0;let available=0;
  for(const area of areas){
    const list=await hm30MealList(area);available+=list.length;
    const sample=hm30Shuffle(list).filter(x=>!previousName||n(x.strMeal)!==n(previousName)).slice(0,60);
    for(let i=0;i<sample.length;i+=6){
      const batch=await Promise.all(sample.slice(i,i+6).map(x=>hm30Meal(x.idMeal)));
      for(const meal of batch){
        if(!meal)continue;scanned++;
        if(!hm30MealTypeOk(meal)||hm30RawUnsafe(hm30MealRaw(meal),filter))continue;
        items.push({kind:'mealdb',cuisineId,title:meal.strMeal,raw:meal,sourceName:'TheMealDB',sourceUrl:meal.strSource||''});
      }
    }
  }
  return {items:hm30Shuffle(items),scanned,available};
}

function hm30ParseArchive(body){
  const lines=String(body||'').replace(/\r/g,'').split('\n');
  let mode='';const ingredients=[];const steps=[];
  for(const raw of lines){
    const line=raw.trim();if(!line)continue;
    const h=line.match(/^#{1,6}\s+(.+)$/);
    if(h){const x=h[1].toLowerCase();if(/ingredient/.test(x))mode='ing';else if(/direction|method|instruction|preparation/.test(x))mode='step';else mode='';continue}
    if(mode==='ing'){
      const m=line.match(/^[-*+]\s+(.+)$/);if(m)ingredients.push(m[1].trim());
    }else if(mode==='step'){
      const m=line.match(/^(?:\d+[.)]|[-*+])\s+(.+)$/);if(m)steps.push(m[1].trim());else if(steps.length)steps[steps.length-1]+=' '+line;
    }
  }
  return {ingredients,steps};
}

function hm30SourceLines(candidate){
  if(candidate.kind==='archive')return hm30ParseArchive(candidate.raw.body);
  if(candidate.kind==='dp')return {ingredients:Array.isArray(candidate.raw.ingredients)?candidate.raw.ingredients:[],steps:Array.isArray(candidate.raw.directions)?candidate.raw.directions:[]};
  if(candidate.kind==='mealdb'){
    const ingredients=[];
    for(let i=1;i<=20;i++){
      const ing=String(candidate.raw['strIngredient'+i]||'').trim();const measure=String(candidate.raw['strMeasure'+i]||'').trim();
      if(ing)ingredients.push((measure?measure+' ':'')+ing);
    }
    const steps=hmInstructionSentences(candidate.raw.strInstructions||'');
    return {ingredients,steps};
  }
  return {ingredients:[],steps:[]};
}

const HM30_ING_EN=/\b(fresh|dried|ground|chopped|diced|sliced|grated|minced|crushed|peeled|boneless|skinless|canned|drained|rinsed|tablespoons?|teaspoons?|cups?|ounces?|pounds?|cloves?|sprigs?|stock|broth|flour|butter|milk|cheese|onion|garlic|chicken|beef|lamb|celery|pepper)\b/i;
const HM30_STEP_EN=/\b(the|and|with|until|then|heat|add|stir|cook|bake|serve|mix|place|minutes?|water|pan|oven|bowl|saucepan|remove|pour|boil|simmer|season)\b/i;

async function hm30TranslateIngredient(source){
  if(typeof hmStrictIngredientLine==='function')return await hmStrictIngredientLine(source);
  if(typeof hmTranslateIngredientLine==='function')return await hmTranslateIngredientLine(source);
  return null;
}

async function hm30TranslateStep(source){
  if(typeof hmTranslateInstructionFull==='function')return await hmTranslateInstructionFull(source);
  if(typeof hmTranslateCached==='function'){
    const tr=await hmTranslateCached(typeof hmMetricizeEnglish==='function'?hmMetricizeEnglish(source):source);
    return tr?[String(tr).trim()]:[];
  }
  return [];
}

async function hm30CandidateToRecipe(candidate,poolCount){
  const parsed=hm30SourceLines(candidate);
  if(parsed.ingredients.length<3||parsed.steps.length<2)return null;
  const ingredients=[];
  for(const src of parsed.ingredients){
    const tr=await hm30TranslateIngredient(src);
    if(!tr||HM30_ING_EN.test(tr))return null;
    ingredients.push(String(tr).trim());
  }
  const steps=[];
  for(const src of parsed.steps){
    const trParts=await hm30TranslateStep(src);
    if(!trParts.length)return null;
    for(const part of trParts){
      const clean=String(part).replace(/\s+/g,' ').trim();
      if(!clean||HM30_STEP_EN.test(clean))return null;
      steps.push(clean);
    }
  }
  if(steps.length<3||steps.join(' ').length<160)return null;
  const cuisine=hm30CuisineLabel(candidate.cuisineId);
  return {
    name:candidate.title,
    cuisine,
    type:S.selectedType==='sürpriz'?'yemek':S.selectedType,
    time:'Kaynakta belirtilmemiş',
    servings:'Kaynakta belirtilmemiş',
    sourceType:'world',
    inspiration:`${cuisine} mutfağından gerçek tarif`,
    ingredients,steps,ai:false,remote:true,
    sourceName:candidate.sourceName||'Açık tarif kaynağı',
    sourceUrl:hm30SafeUrl(candidate.sourceUrl),
    poolCount:Number(poolCount||0),
    engineVersion:HM30_VERSION
  };
}

function hm30FilterLabels(){
  const allergens=defs().filter(a=>S.allergens.includes(a.id)).map(a=>a.label);
  return [...new Set([...allergens,...(Array.isArray(S.dislikes)?S.dislikes:[])].map(x=>String(x||'').trim()).filter(Boolean))];
}

function hm30SearchQuery(){
  const p=[];
  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele')p.push(hm30CuisineLabel(S.selectedCuisine)+' mutfağı');
  else p.push('yemek tarifi');
  const type={yemek:'yemek',kahvaltı:'kahvaltı',tatlı:'tatlı',içecek:'içecek',atıştırmalık:'atıştırmalık',sürpriz:'yemek'}[S.selectedType]||'yemek';
  p.push(type,'tarifi');
  hm30FilterLabels().slice(0,12).forEach(x=>p.push(x+' içermeyen'));
  return p.join(' ');
}

function hm30GoogleUrl(){return 'https://www.google.com/search?q='+encodeURIComponent(hm30SearchQuery())}
function hm30NefisUrl(){return 'https://www.nefisyemektarifleri.com/?s='+encodeURIComponent(hm30SearchQuery())}

window.hmPrepareExternalLink=function(el,kind){
  if(!el)return true;
  el.href=kind==='nefisyemek'?hm30NefisUrl():hm30GoogleUrl();
  return true;
};

function hm30RefreshExternalLinks(){
  const w=document.getElementById('hmHomeWebSearch');const nfy=document.getElementById('hmHomeNefisSearch');
  if(w){w.href=hm30GoogleUrl();w.textContent='🔎 Google’da ara'}
  if(nfy){nfy.href=hm30NefisUrl();nfy.textContent='🍲 Nefis Yemek Tarifleri’nde ara'}
}

function hm30SourceButtons(){
  return `<div class="card"><h3>Daha geniş kaynaklar</h3><p class="mini">Aynı mutfak, kategori, alerjen ve sevmediğin malzemelerle dış kaynakta ara.</p><a class="secondary" style="display:block;text-align:center;text-decoration:none" href="${hm30Esc(hm30NefisUrl())}" target="_blank" rel="noopener noreferrer">🍲 Nefis Yemek Tarifleri’nde ara</a><a class="secondary" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="${hm30Esc(hm30GoogleUrl())}" target="_blank" rel="noopener noreferrer">🔎 Google’da ara</a><div class="warn" style="margin-top:12px"><strong>Güvenlik:</strong> Dış sitelerdeki tarifler HandeMade filtresinden geçmez. İçeriği ve çapraz bulaşma uyarılarını ayrıca kontrol et.</div></div>`;
}

window.renderRecipe=function(){
  const e=document.getElementById('recipe');const r=S.lastRecipe;
  if(!e)return;
  if(!r){e.innerHTML='<div class="card empty">Henüz tarif seçmedin.</div>'+hm30SourceButtons();return}
  if(unsafeRecipe(r)){
    e.innerHTML='<div class="card"><h2>Tarif güvenlik filtresinde durduruldu</h2><p>Tarif aktif filtrelerinden biriyle çakıştı.</p><button class="primary" onclick="generateRecipe(true)">Başka tarif bul</button></div>'+hm30SourceButtons();return;
  }
  const fav=S.favorites.some(x=>x.name===r.name);
  const sourceUrl=hm30SafeUrl(r.sourceUrl);
  e.innerHTML=`<div class="card"><div class="recipe-head"><div><div class="origin">${hm30Esc(r.cuisine||'Dünya')} • ${hm30Esc(r.inspiration||'')}</div><h1>${hm30Esc(r.name)}</h1></div><span class="badge world">🌍 Dünya mutfağı</span></div><div class="meta"><span>⏱ ${hm30Esc(r.time||'Kaynakta belirtilmemiş')}</span><span>👥 ${hm30Esc(r.servings||'Kaynakta belirtilmemiş')}</span><span>Kaynak: ${hm30Esc(r.sourceName||'Açık tarif kaynağı')}</span></div><div class="safe"><strong>🛡 Profil kontrolü:</strong> Kaynak metin ve Türkçe çıktı aktif alerjenler ve sevmediklerin için kontrol edildi.</div>${r.poolCount?`<div class="selection-proof"><strong>🔎 Bu aramada:</strong> ${Number(r.poolCount)} güvenli ham aday arasından seçildi.</div>`:''}${sourceUrl?`<a class="small" style="display:inline-block;margin-top:10px;text-decoration:none" href="${hm30Esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">Kaynağı aç ↗</a>`:''}</div><div class="card"><h3>Malzemeler</h3><ul>${(r.ingredients||[]).map(x=>`<li>${hm30Esc(x)}</li>`).join('')}</ul></div><div class="card"><h3>Hazırlanışı</h3><ol>${(r.steps||[]).map(x=>`<li>${hm30Esc(x)}</li>`).join('')}</ol></div><div class="warn"><strong>Etiket kontrolü:</strong> Paketli ürünlerin içerik ve çapraz bulaşma uyarılarını ayrıca kontrol et.</div><button class="${fav?'secondary':'primary'}" style="margin-top:12px" onclick="toggleFavorite()">${fav?'♥ Favorilerde':'♡ Favoriye ekle'}</button><button class="secondary" style="margin-top:10px" onclick="generateRecipe(true)">🎲 Şansını tekrar dene</button>${hm30SourceButtons()}`;
};

function hm30FailureCard(message,poolCount=0){
  const e=document.getElementById('recipe');if(!e)return;
  e.innerHTML=`<div class="card"><h2>Bu turda uygun tarif çıkaramadım</h2><p>${hm30Esc(message)}</p>${poolCount?`<div class="selection-proof"><strong>Ham aday:</strong> ${Number(poolCount)} tarif güvenlik ve kategori filtresini geçti, fakat Türkçe sunum doğrulamasını tamamlayamadı.</div>`:''}<button class="primary" style="margin-top:12px" onclick="generateRecipe(true)">Tekrar tara</button></div>${hm30SourceButtons()}`;
}

window.generateRecipe=async function(retry=false){
  go('recipe');
  const target=document.getElementById('recipe');
  const previous=retry&&S.lastRecipe?S.lastRecipe.name:'';
  target.innerHTML='<div class="card loading"><div class="spinner"></div><strong>Büyük tarif havuzu taranıyor…</strong><p>Açık arşivler, JSON tarif kataloğu ve TheMealDB birlikte filtreleniyor.</p></div>';

  if(!navigator.onLine){
    const local=hm30Shuffle(R.filter(x=>(S.selectedType==='sürpriz'||x.type===S.selectedType)&&!unsafeRecipe(x)&&(!previous||n(x.name)!==n(previous)))).find(x=>S.selectedCuisine==='tümü'||S.selectedCuisine==='rastgele'||recipeMatchesCuisine(x,S.selectedCuisine));
    if(local){S.lastRecipe=JSON.parse(JSON.stringify(local));save();renderRecipe();return}
    hm30FailureCard('İnternet bağlantısı yok ve çevrimdışı yedekte uygun tarif kalmadı.');return;
  }

  const filter=await hm30BuildFilter();
  if(filter.unknown.length){
    hm30FailureCard('Bazı özel filtrelerin yabancı kaynak karşılığı güvenli biçimde çözülemedi: '+filter.unknown.join(', ')+'. Güvenlik için canlı kaynak sonucu göstermedim.');return;
  }

  const targets=hm30TargetCuisineIds();
  const jobs=[];
  for(const cid of targets){
    jobs.push(hm30ArchiveCandidates(cid,filter,previous));
    jobs.push(hm30DpCandidates(cid,filter,previous));
    jobs.push(hm30MealCandidates(cid,filter,previous));
  }
  const results=await Promise.allSettled(jobs);
  let candidates=[];let available=0;let scanned=0;
  for(const r of results){
    if(r.status!=='fulfilled')continue;
    candidates.push(...(r.value.items||[]));available+=Number(r.value.available||0);scanned+=Number(r.value.scanned||0);
  }
  const seen=new Set();
  candidates=hm30Shuffle(candidates).filter(c=>{const k=n(c.title);if(!k||seen.has(k))return false;seen.add(k);return true});
  const poolCount=candidates.length;
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${poolCount} uygun ham aday bulundu</strong><p>${available?available+' kaynak kaydı erişilebilir. ':''}Seçilen tarif Türkçeleştiriliyor ve tekrar doğrulanıyor.</p></div>`;

  for(const candidate of candidates.slice(0,14)){
    const recipe=await hm30CandidateToRecipe(candidate,poolCount);
    if(!recipe)continue;
    if(unsafeRecipe(recipe))continue;
    if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'&&!recipeMatchesCuisine(recipe,S.selectedCuisine))continue;
    S.lastRecipe=recipe;save();renderRecipe();return;
  }

  hm30FailureCard(poolCount?'Kaynaklarda aday vardı, fakat Türkçe malzeme veya hazırlanış doğrulaması tamamlanamadı. Yeniden taramada farklı adaylar denenecek.':'Seçtiğin mutfak, kategori ve filtrelerle canlı kaynaklarda uygun ham aday bulunamadı.',poolCount);
};

const hm30GoBase=window.go;
window.go=function(page){const out=hm30GoBase(page);if(page==='home')setTimeout(hm30RefreshExternalLinks,0);return out};

(function hm30Init(){
  const v=document.querySelector('.brand>.mini');if(v)v.textContent='beta • v0.30';
  const badge=document.getElementById('aiBadge');const status=document.getElementById('aiStatus');
  if(badge){badge.className='badge live';badge.textContent='128 bin+ kaynak kaydı'}
  if(status)status.textContent='54.843 açık arşiv + 73 binlik JSON katalog + TheMealDB';
  setTimeout(hm30RefreshExternalLinks,0);
})();
