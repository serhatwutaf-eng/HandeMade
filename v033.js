/* HandeMade v0.33 - tum mutfaklara ortak 232K mega tarif havuzu */

const HM33_VERSION='0.33';
const HM33_DATASET='jojogo9/Food_Recipes';
const HM33_DATASET_PAGE='https://huggingface.co/datasets/jojogo9/Food_Recipes';
const HM33_DATASET_ROWS=231637;
const HM33_PAGE=100;
const HM33_WINDOWS_SPECIFIC=6;
const HM33_WINDOWS_WORLD=8;

const HM33_TAGS={
  'türk':['turkish'],
  'italyan':['italian'],
  'japon':['japanese'],
  'meksika':['mexican'],
  'hint':['indian'],
  'tay':['thai'],
  'kore':['korean'],
  'fransız':['french'],
  'ispanyol':['spanish'],
  'yunan':['greek'],
  'orta doğu':['middle-eastern'],
  'fas':['moroccan'],
  'çin':['chinese'],
  'vietnam':['vietnamese'],
  'endonezya':['indonesian'],
  'filipin':['filipino'],
  'peru':['peruvian'],
  'brezilya':['brazilian'],
  'alman':['german'],
  'ingiliz':['english'],
  'amerikan':['american'],
  'portekiz':['portuguese'],
  'rus':['russian'],
  'karayip':['caribbean'],
  'batı afrika':['west-african']
};

const HM33_WORLD_IDS=Object.keys(HM33_TAGS).filter(id=>id!=='türk');
const HM33_CACHE={search:new Map()};

function hm33PyList(value){
  if(Array.isArray(value))return value.map(x=>String(x||'').trim()).filter(Boolean);
  const s=String(value||'').trim();
  if(!s)return [];
  try{
    const parsed=JSON.parse(s);
    if(Array.isArray(parsed))return parsed.map(x=>String(x||'').trim()).filter(Boolean);
  }catch(e){}
  const out=[];
  const single=/'((?:\\.|[^'])*)'/g;
  let m;
  while((m=single.exec(s)))out.push(m[1].replace(/\\'/g,"'").replace(/\\\\/g,'\\').trim());
  if(out.length)return out.filter(Boolean);
  const dbl=/"((?:\\.|[^"])*)"/g;
  while((m=dbl.exec(s)))out.push(m[1].replace(/\\"/g,'"').replace(/\\\\/g,'\\').trim());
  return out.filter(Boolean);
}

function hm33NormTag(x){return String(x||'').trim().toLowerCase().replace(/_/g,'-').replace(/\s+/g,'-')}

function hm33Tags(row){return hm33PyList(row?.tags).map(hm33NormTag)}

function hm33CuisineFromTags(tags){
  const set=new Set(tags.map(hm33NormTag));
  // Daha özgül mutfaklar önce, Amerikan etiketi çakışmalarda en sona bırakılır.
  const order=HM33_WORLD_IDS.filter(x=>x!=='amerikan').concat(['amerikan','türk']);
  for(const id of order){
    if((HM33_TAGS[id]||[]).some(t=>set.has(hm33NormTag(t))))return id;
  }
  return null;
}

function hm33ExactTagCuisine(row,cuisineId){
  const set=new Set(hm33Tags(row));
  return (HM33_TAGS[cuisineId]||[]).some(t=>set.has(hm33NormTag(t)));
}

function hm33TypeOk(row){
  const tags=new Set(hm33Tags(row));
  const title=String(row?.name||'').toLowerCase();
  const has=(...xs)=>xs.some(x=>tags.has(x));
  const dessert=has('desserts','cakes','cookies-and-brownies','pies','puddings-and-mousses','frozen-desserts','candy','cheesecake')||/\b(cake|cookie|dessert|pudding|pie|tart|brownie|cheesecake|ice cream|sorbet)\b/i.test(title);
  const drink=has('beverages','smoothies','shakes','non-alcoholic','cocktails')||/\b(drink|smoothie|shake|lemonade|juice|tea|coffee)\b/i.test(title);
  const breakfast=has('breakfast','brunch')||/\b(breakfast|brunch|omelet|omelette|pancake|waffle)\b/i.test(title);
  const snack=has('appetizers','snacks','dips','finger-food','side-dishes')||/\b(appetizer|snack|dip|fritter)\b/i.test(title);
  if(S.selectedType==='sürpriz')return true;
  if(S.selectedType==='tatlı')return dessert;
  if(S.selectedType==='içecek')return drink;
  if(S.selectedType==='kahvaltı')return breakfast&&!dessert;
  if(S.selectedType==='atıştırmalık')return snack&&!dessert&&!drink;
  return !dessert&&!drink&&!breakfast;
}

function hm33FoodRaw(row){
  return [
    row?.name||'',row?.description||'',row?.tags||'',row?.ingredients||'',row?.steps||''
  ].join(' | ');
}

function hm33FoodSafe(row,filter,previousName=''){
  const name=String(row?.name||'').trim();
  if(!name)return false;
  if(previousName&&n(name)===n(previousName))return false;
  if(!hm33TypeOk(row))return false;
  if(hm30RawUnsafe(hm33FoodRaw(row),filter))return false;
  const ing=hm33PyList(row?.ingredients),steps=hm33PyList(row?.steps);
  if(ing.length<3||steps.length<2)return false;
  return true;
}

function hm33SearchUrl(query,offset,length=HM33_PAGE){
  const p=new URLSearchParams({dataset:HM33_DATASET,config:'default',split:'train',query,offset:String(Math.max(0,offset)),length:String(Math.min(HM33_PAGE,length))});
  return 'https://datasets-server.huggingface.co/search?'+p.toString();
}

async function hm33SearchPage(query,offset=0,length=HM33_PAGE){
  const key=[query,offset,length].join('|');
  if(HM33_CACHE.search.has(key))return HM33_CACHE.search.get(key);
  try{
    const r=await fetch(hm33SearchUrl(query,offset,length),{cache:'no-store'});
    if(!r.ok)return {rows:[],total:0};
    const d=await r.json();
    const rows=Array.isArray(d?.rows)?d.rows.map(x=>x?.row||x).filter(Boolean):[];
    const out={rows,total:Number(d?.num_rows_total||rows.length||0)};
    HM33_CACHE.search.set(key,out);
    return out;
  }catch(e){
    console.warn('232K dünya tarif havuzu alınamadı',e);
    return {rows:[],total:0};
  }
}

function hm33RandomOffsets(total,count){
  const max=Math.max(0,total-HM33_PAGE);
  const set=new Set([0]);
  while(set.size<count&&max>0)set.add(Math.floor(Math.random()*(max+1)));
  return [...set];
}

async function hm33FoodCandidates(cuisineId,filter,previousName=''){
  const tags=HM33_TAGS[cuisineId]||[];
  if(!tags.length)return {items:[],available:0,scanned:0};
  let all=[];let totalAvailable=0;let scanned=0;
  for(const tag of tags){
    const first=await hm33SearchPage(tag,0,HM33_PAGE);
    totalAvailable+=first.total;
    const offsets=hm33RandomOffsets(first.total,HM33_WINDOWS_SPECIFIC);
    const pages=[first];
    const rest=offsets.filter(x=>x!==0);
    if(rest.length)pages.push(...await Promise.all(rest.map(x=>hm33SearchPage(tag,x,HM33_PAGE))));
    for(const page of pages){
      scanned+=page.rows.length;
      for(const row of page.rows){
        if(!hm33ExactTagCuisine(row,cuisineId))continue;
        if(!hm33FoodSafe(row,filter,previousName))continue;
        all.push({kind:'food232',cuisineId,title:String(row.name||'').trim(),raw:row,sourceName:'Food.com 232K açık tarif havuzu',sourceUrl:HM33_DATASET_PAGE});
      }
    }
  }
  const seen=new Set();
  all=hm30Shuffle(all).filter(x=>{const k=n(x.title);if(!k||seen.has(k))return false;seen.add(k);return true});
  return {items:all,available:totalAvailable,scanned};
}

async function hm33WorldCandidates(filter,previousName=''){
  // Food.com kayıtlarında mutfak sınıflandırılmış satırlarda "cuisine" etiketi bulunur.
  const first=await hm33SearchPage('cuisine',0,HM33_PAGE);
  const offsets=hm33RandomOffsets(first.total,HM33_WINDOWS_WORLD);
  const pages=[first];
  const rest=offsets.filter(x=>x!==0);
  if(rest.length)pages.push(...await Promise.all(rest.map(x=>hm33SearchPage('cuisine',x,HM33_PAGE))));
  let items=[];let scanned=0;
  for(const page of pages){
    scanned+=page.rows.length;
    for(const row of page.rows){
      const cuisineId=hm33CuisineFromTags(hm33Tags(row));
      if(!cuisineId||!hm33ExactTagCuisine(row,cuisineId))continue;
      if(!hm33FoodSafe(row,filter,previousName))continue;
      items.push({kind:'food232',cuisineId,title:String(row.name||'').trim(),raw:row,sourceName:'Food.com 232K açık tarif havuzu',sourceUrl:HM33_DATASET_PAGE});
    }
  }
  const seen=new Set();
  items=hm30Shuffle(items).filter(x=>{const k=n(x.title);if(!k||seen.has(k))return false;seen.add(k);return true});
  return {items,available:first.total,scanned};
}

async function hm33FoodToRecipe(candidate,poolCount){
  const row=candidate.raw||{};
  const srcIngredients=hm33PyList(row.ingredients);
  const srcSteps=hm33PyList(row.steps);
  if(srcIngredients.length<3||srcSteps.length<2)return null;

  const ingredients=[];
  for(const src of srcIngredients.slice(0,24)){
    const tr=await hm30TranslateIngredient(src);
    if(!tr||HM30_ING_EN.test(tr))return null;
    ingredients.push(String(tr).trim());
  }

  const steps=[];
  for(const src of srcSteps.slice(0,20)){
    const parts=await hm30TranslateStep(src);
    if(!parts.length)return null;
    for(const part of parts){
      const clean=String(part||'').replace(/\s+/g,' ').trim();
      if(!clean||HM30_STEP_EN.test(clean))return null;
      steps.push(clean);
    }
  }
  if(steps.length<3||steps.join(' ').length<140)return null;

  const cuisine=hm30CuisineLabel(candidate.cuisineId);
  const mins=Number(row.minutes||0);
  const recipe={
    name:String(row.name||candidate.title||'').trim(),
    cuisine,
    type:S.selectedType==='sürpriz'?'yemek':S.selectedType,
    time:mins>0&&mins<1440?`yaklaşık ${mins} dk`:'Kaynakta belirtilmemiş',
    servings:'Kaynakta belirtilmemiş',
    sourceType:'world',
    inspiration:`${cuisine} mutfağı etiketi taşıyan gerçek tarif`,
    ingredients,steps,ai:false,remote:true,
    sourceName:candidate.sourceName,
    sourceUrl:HM33_DATASET_PAGE,
    poolCount:Number(poolCount||0),engineVersion:HM33_VERSION
  };
  if(unsafeRecipe(recipe))return null;
  return recipe;
}

async function hm33TryCandidates(candidates,poolCount,limit=20){
  for(const candidate of candidates.slice(0,limit)){
    const recipe=await hm33FoodToRecipe(candidate,poolCount);
    if(!recipe||unsafeRecipe(recipe))continue;
    if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'&&!hm32ExactCuisineMatch(recipe,S.selectedCuisine))continue;
    return recipe;
  }
  return null;
}

async function hm33TryCuisine(cuisineId,filter,previousName=''){
  let pool=0,available=0,scanned=0;

  // Türk seçiliyken doğrudan Türkçe mega havuz hâlâ en güçlü ilk kaynak.
  if(cuisineId==='türk'&&typeof hm31FindNativeTurkish==='function'){
    const native=await hm31FindNativeTurkish(previousName);
    pool+=Number(native.pool||0);available+=Number(native.available||0);scanned+=Number(native.scanned||0);
    if(native.recipe&&!unsafeRecipe(native.recipe)&&hm32ExactCuisineMatch(native.recipe,cuisineId)){
      native.recipe.poolCount=Math.max(Number(native.recipe.poolCount||0),pool);
      return {recipe:native.recipe,pool,available,scanned};
    }
  }

  const mega=await hm33FoodCandidates(cuisineId,filter,previousName);
  pool+=mega.items.length;available+=mega.available;scanned+=mega.scanned;
  const megaRecipe=await hm33TryCandidates(mega.items,pool,22);
  if(megaRecipe){megaRecipe.poolCount=pool;return {recipe:megaRecipe,pool,available,scanned}}

  // Büyük ortak havuz sonuç vermezse mevcut üç açık kaynak katmanı devreye girer.
  if(typeof hm32TryCuisine==='function'){
    const fallback=await hm32TryCuisine(cuisineId,filter,previousName);
    pool+=Number(fallback.pool||0);available+=Number(fallback.available||0);scanned+=Number(fallback.scanned||0);
    if(fallback.recipe&&!unsafeRecipe(fallback.recipe)&&hm32ExactCuisineMatch(fallback.recipe,cuisineId)){
      fallback.recipe.poolCount=Math.max(Number(fallback.recipe.poolCount||0),pool);
      return {recipe:fallback.recipe,pool,available,scanned};
    }
  }
  return {recipe:null,pool,available,scanned};
}

const hm33OfflineGenerate=window.generateRecipe;
window.generateRecipe=async function(retry=false){
  if(!navigator.onLine)return hm33OfflineGenerate(retry);

  go('recipe');
  const target=document.getElementById('recipe');
  const previous=retry&&S.lastRecipe?S.lastRecipe.name:'';
  const filter=await hm30BuildFilter();

  if(S.selectedCuisine!=='türk'&&filter.unknown.length){
    hm30FailureCard('Bazı özel filtrelerin yabancı kaynak karşılığı güvenli biçimde çözülemedi: '+filter.unknown.join(', ')+'. Güvenlik için yabancı kaynak sonucu göstermedim.');
    return;
  }

  if(S.selectedCuisine==='tümü'){
    target.innerHTML='<div class="card loading"><div class="spinner"></div><strong>232 binlik dünya havuzu taranıyor…</strong><p>Mutfak etiketi taşıyan gerçek tariflerden geniş ve rastgele örnekler alınıyor.</p></div>';
    const world=await hm33WorldCandidates(filter,previous);
    target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${world.items.length} güvenli dünya adayı bulundu</strong><p>${world.available} mutfak etiketli kayıt erişilebilir; seçilen tarif Türkçeleştirilip tekrar doğrulanıyor.</p></div>`;
    const recipe=await hm33TryCandidates(world.items,world.items.length,28);
    if(recipe){S.lastRecipe=recipe;save();renderRecipe();return}

    // Mega dünya havuzu bu turda çevrilemezse güçlü mutfakları tek tek tara.
    let totalPool=world.items.length,totalScanned=world.scanned;
    const ids=hm30Shuffle(HM33_WORLD_IDS.concat(['türk']));
    for(const cid of ids.slice(0,12)){
      target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${hm30CuisineLabel(cid)} mutfağı geniş havuzda taranıyor…</strong><p>Dünya seçimi için sıradaki büyük kaynak deneniyor.</p></div>`;
      const found=await hm33TryCuisine(cid,filter,previous);
      totalPool+=Number(found.pool||0);totalScanned+=Number(found.scanned||0);
      if(found.recipe){found.recipe.poolCount=Math.max(Number(found.recipe.poolCount||0),totalPool);S.lastRecipe=found.recipe;save();renderRecipe();return}
    }
    hm30FailureCard(`Dünya havuzunda ${totalScanned} kayıt örneği kontrol edildi; bu turda eksiksiz Türkçe sunulabilen güvenli tarif çıkmadı. Tekrar taramada farklı örnekler seçilecek.`,totalPool);
    return;
  }

  let cuisineId=S.selectedCuisine;
  if(cuisineId==='rastgele'){
    const choices=hm30Shuffle(HM33_WORLD_IDS.concat(['türk']));
    cuisineId=choices[0]||'türk';
  }

  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${hm30CuisineLabel(cuisineId)} mutfağının büyük havuzu taranıyor…</strong><p>232 binlik ortak kaynak ve bu mutfağa özel kaynaklar birlikte kullanılıyor.</p></div>`;
  const found=await hm33TryCuisine(cuisineId,filter,previous);
  if(found.recipe){
    found.recipe.poolCount=Math.max(Number(found.recipe.poolCount||0),Number(found.pool||0));
    S.lastRecipe=found.recipe;save();renderRecipe();return;
  }
  hm30FailureCard(`${hm30CuisineLabel(cuisineId)} mutfağında ${found.scanned} kayıt örneği kontrol edildi. Bu turda filtrelerine uyan ve Türkçe doğrulamayı geçen tarif çıkmadı; tekrar taramada farklı yüzlerce kayıt denenecek.`,found.pool);
};

(function hm33Init(){
  const v=document.querySelector('.brand>.mini');if(v)v.textContent='beta • v0.33';
  const badge=document.getElementById('aiBadge');
  const status=document.getElementById('aiStatus');
  if(badge){badge.className='badge live';badge.textContent='500 bin+ ham kaynak kaydı'}
  if(status)status.textContent='Her mutfak: 232 binlik ortak dünya havuzu + özel açık kaynaklar • Türk: ayrıca 174.975 Türkçe tarif';
})();
