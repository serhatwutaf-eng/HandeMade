/* HandeMade v0.35 - yabancı mutfaklarda çeviri darboğazını kaldır */

const HM35_VERSION='0.35';
const HM35_TRANSLATION_CACHE=new Map();

const HM35_ING_EN=/\b(fresh|dried|ground|chopped|diced|sliced|grated|minced|crushed|peeled|boneless|skinless|canned|drained|rinsed|tablespoons?|teaspoons?|cups?|ounces?|pounds?|cloves?|sprigs?|stock|broth|flour|butter|milk|cheese|onion|garlic|chicken|beef|lamb|celery|pepper|salt|sugar|oil|rice|water)\b/i;
const HM35_STEP_EN=/\b(the|and|with|until|then|heat|add|stir|cook|bake|serve|mix|place|minutes?|water|pan|oven|bowl|saucepan|remove|pour|boil|simmer|season|combine|cover|reduce|bring|cut|slice|chop|fry|roast)\b/i;

function hm35GoogleUrl(text){
  const p=new URLSearchParams({client:'gtx',sl:'en',tl:'tr',dt:'t',dj:'1',q:String(text||'')});
  return 'https://translate.googleapis.com/translate_a/single?'+p.toString();
}

async function hm35GoogleTranslate(text){
  const src=String(text||'').trim();
  if(!src)return '';
  const key='g:'+src;
  if(HM35_TRANSLATION_CACHE.has(key))return HM35_TRANSLATION_CACHE.get(key);
  try{
    const r=await fetch(hm35GoogleUrl(src),{cache:'no-store'});
    if(!r.ok)throw new Error('google '+r.status);
    const d=await r.json();
    let out='';
    if(Array.isArray(d?.sentences))out=d.sentences.map(x=>String(x?.trans||'')).join('').trim();
    if(!out&&Array.isArray(d)){
      const first=d[0];
      if(Array.isArray(first))out=first.map(x=>Array.isArray(x)?String(x[0]||''):'').join('').trim();
    }
    HM35_TRANSLATION_CACHE.set(key,out);
    return out;
  }catch(e){
    console.warn('Google çeviri yolu başarısız',e);
    HM35_TRANSLATION_CACHE.set(key,'');
    return '';
  }
}

async function hm35MyMemoryTranslate(text){
  const src=String(text||'').trim();
  if(!src||typeof hmTranslateCached!=='function')return '';
  const key='m:'+src;
  if(HM35_TRANSLATION_CACHE.has(key))return HM35_TRANSLATION_CACHE.get(key);
  try{
    const out=String(await hmTranslateCached(src)||'').trim();
    HM35_TRANSLATION_CACHE.set(key,out);
    return out;
  }catch(e){HM35_TRANSLATION_CACHE.set(key,'');return ''}
}

async function hm35TranslateOne(text){
  const src=String(text||'').trim();
  if(!src)return '';
  let out=await hm35GoogleTranslate(src);
  if(!out)out=await hm35MyMemoryTranslate(src);
  return hmDecodeHtml(out||'').replace(/\s+/g,' ').trim();
}

async function hm35MapLimit(items,limit,fn){
  const out=new Array(items.length);let next=0;
  async function worker(){
    while(true){
      const i=next++;if(i>=items.length)return;
      out[i]=await fn(items[i],i);
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length)},()=>worker()));
  return out;
}

function hm35IngredientPrep(src){
  let x=String(src||'').trim();
  if(typeof hmMetricizeEnglish==='function')x=hmMetricizeEnglish(x);
  if(typeof hmIngredientPreTranslate==='function')x=hmIngredientPreTranslate(x);
  return x;
}

function hm35IngredientFinish(src,out){
  let x=String(out||'').trim();
  if(typeof hmIngredientPreTranslate==='function')x=hmIngredientPreTranslate(x);
  if(typeof hmMeasureTr==='function')x=hmMeasureTr(x);
  x=x.replace(/\bto taste\b/gi,'damak tadına göre').replace(/\bas needed\b/gi,'gerektiği kadar').replace(/\s+/g,' ').trim();
  if(!x||HM35_ING_EN.test(x))return null;
  return x;
}

async function hm35TranslateIngredients(lines){
  const src=lines.map(x=>String(x||'').trim()).filter(Boolean).slice(0,28);
  const prepared=src.map(hm35IngredientPrep);
  const out=await hm35MapLimit(prepared,5,hm35TranslateOne);
  const fixed=[];
  for(let i=0;i<out.length;i++){
    const v=hm35IngredientFinish(src[i],out[i]||prepared[i]);
    if(!v)return null;
    fixed.push(v);
  }
  return fixed;
}

async function hm35TranslateSteps(lines){
  const src=lines.map(x=>String(x||'').trim()).filter(Boolean).slice(0,24);
  const out=await hm35MapLimit(src,4,hm35TranslateOne);
  const fixed=[];
  for(let i=0;i<out.length;i++){
    const v=String(out[i]||'').replace(/\s+/g,' ').trim();
    if(!v||HM35_STEP_EN.test(v))return null;
    fixed.push(v);
  }
  return fixed;
}

hm33FoodToRecipe=async function(candidate,poolCount){
  const row=candidate.raw||{};
  const srcIngredients=hm33PyList(row.ingredients);
  const srcSteps=hm33PyList(row.steps);
  if(srcIngredients.length<3||srcSteps.length<2)return null;

  const ingredients=await hm35TranslateIngredients(srcIngredients);
  if(!ingredients||ingredients.length<3)return null;
  const steps=await hm35TranslateSteps(srcSteps);
  if(!steps||steps.length<2||steps.join(' ').length<100)return null;

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
    sourceName:candidate.sourceName||'Food.com 232K açık tarif havuzu',
    sourceUrl:HM33_DATASET_PAGE,
    poolCount:Number(poolCount||0),engineVersion:HM35_VERSION
  };
  if(unsafeRecipe(recipe))return null;
  return recipe;
};

// Dünya aramasında doğrudan örneklem yetersiz kalırsa arama indeksini de birleştir.
async function hm35WorldPool(filter,previousName=''){
  let a={items:[],available:0,scanned:0},b={items:[],available:0,scanned:0};
  try{a=await hm34DirectWorldCandidates(filter,previousName)}catch(e){}
  try{b=await hm33WorldCandidates(filter,previousName)}catch(e){}
  const seen=new Set();
  const items=hm30Shuffle([...(a.items||[]),...(b.items||[])]).filter(x=>{const k=n(x.title);if(!k||seen.has(k))return false;seen.add(k);return true});
  return {items,available:Math.max(Number(a.available||0),Number(b.available||0)),scanned:Number(a.scanned||0)+Number(b.scanned||0)};
}

const hm35BaseGenerate=window.generateRecipe;
window.generateRecipe=async function(retry=false){
  if(!navigator.onLine||S.selectedCuisine==='türk')return hm35BaseGenerate(retry);
  go('recipe');
  const target=document.getElementById('recipe');
  const previous=retry&&S.lastRecipe?S.lastRecipe.name:'';
  const filter=await hm30BuildFilter();
  if(filter.unknown.length){hm30FailureCard('Bazı özel filtrelerin yabancı kaynak karşılığı güvenli biçimde çözülemedi: '+filter.unknown.join(', ')+'.');return}

  if(S.selectedCuisine==='tümü'){
    target.innerHTML='<div class="card loading"><div class="spinner"></div><strong>Dünya mutfağı büyük havuzu taranıyor…</strong><p>Doğrudan satır örneklemesi ve mutfak indeksi birlikte kullanılıyor.</p></div>';
    const pool=await hm35WorldPool(filter,previous);
    target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${pool.items.length} güvenli dünya adayı bulundu</strong><p>${pool.scanned} kayıt kontrol edildi. Tarif Türkçeleştiriliyor.</p></div>`;
    const recipe=await hm33TryCandidates(pool.items,pool.items.length,40);
    if(recipe){S.lastRecipe=recipe;save();renderRecipe();return}
    hm30FailureCard(`Dünya havuzunda ${pool.scanned} kayıt tarandı ve ${pool.items.length} güvenli aday bulundu; ancak çeviri doğrulamasını geçen tarif çıkmadı.`,pool.items.length);return;
  }

  if(S.selectedCuisine==='rastgele')return hm35BaseGenerate(retry);

  const cid=S.selectedCuisine;
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${hm30CuisineLabel(cid)} mutfağı geniş havuzda aranıyor…</strong><p>İndeks + doğrudan örneklem birlikte kullanılıyor.</p></div>`;
  const pool=await hm34SpecificPool(cid,filter,previous);
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${pool.items.length} güvenli ${hm30CuisineLabel(cid)} adayı bulundu</strong><p>${pool.scanned} kayıt kontrol edildi. Çoklu çeviri yolu deneniyor.</p></div>`;
  const recipe=await hm33TryCandidates(pool.items,pool.items.length,40);
  if(recipe&&hm32ExactCuisineMatch(recipe,cid)){S.lastRecipe=recipe;save();renderRecipe();return}

  const fallback=await hm32TryCuisine(cid,filter,previous);
  if(fallback.recipe&&hm32ExactCuisineMatch(fallback.recipe,cid)){S.lastRecipe=fallback.recipe;save();renderRecipe();return}
  hm30FailureCard(`${hm30CuisineLabel(cid)} mutfağında ${pool.scanned+Number(fallback.scanned||0)} kayıt kontrol edildi; ${pool.items.length+Number(fallback.pool||0)} aday filtreyi geçti fakat Türkçe çıktı doğrulamasını geçen tarif bulunamadı.`,pool.items.length+Number(fallback.pool||0));
};

(function hm35Init(){
  const v=document.querySelector('.brand>.mini');if(v)v.textContent='beta • v0.35';
  const status=document.getElementById('aiStatus');
  if(status)status.textContent='Türk: 174.975 doğrudan Türkçe • Diğer mutfaklar: 231.637 mega havuz + çoklu Türkçeleştirme yolu';
})();
