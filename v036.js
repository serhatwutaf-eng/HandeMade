/* HandeMade v0.36 - derleme zamanında hazırlanan Türkçe dünya mutfağı katalogları */

const HM36_VERSION='0.36';
const HM36_BASE='./generated/cuisines/';
const HM36_CACHE={world:null,manifest:new Map(),shard:new Map()};
const HM36_SOURCE_PAGE='https://huggingface.co/datasets/mmkocak/turkish-recipes-175K';

async function hm36Json(url){
  try{
    const r=await fetch(url,{cache:'no-store'});
    if(!r.ok)return null;
    return await r.json();
  }catch(e){
    console.warn('Türkçe mutfak kataloğu alınamadı',url,e);
    return null;
  }
}

async function hm36WorldManifest(){
  if(HM36_CACHE.world)return HM36_CACHE.world;
  HM36_CACHE.world=await hm36Json(HM36_BASE+'manifest.json');
  return HM36_CACHE.world;
}

async function hm36Manifest(cid){
  if(HM36_CACHE.manifest.has(cid))return HM36_CACHE.manifest.get(cid);
  const m=await hm36Json(HM36_BASE+encodeURIComponent(cid)+'/manifest.json');
  if(m)HM36_CACHE.manifest.set(cid,m);
  return m;
}

async function hm36Shard(cid,file){
  const key=cid+'|'+file;
  if(HM36_CACHE.shard.has(key))return HM36_CACHE.shard.get(key);
  const rows=await hm36Json(HM36_BASE+encodeURIComponent(cid)+'/'+encodeURIComponent(file));
  const out=Array.isArray(rows)?rows:[];
  HM36_CACHE.shard.set(key,out);
  return out;
}

function hm36RowText(row){
  return [
    row?.title||'',row?.description||'',row?.category||'',
    ...(Array.isArray(row?.tags)?row.tags:[]),
    ...(Array.isArray(row?.ingredients)?row.ingredients:[]),
    ...(Array.isArray(row?.instructions)?row.instructions:[])
  ].join(' | ');
}

function hm36TypeOk(row){
  if(typeof hm31TypeOk==='function')return hm31TypeOk(row);
  return true;
}

function hm36SafeRow(row,previousName=''){
  const title=String(row?.title||'').trim();
  if(!title)return false;
  if(previousName&&n(title)===n(previousName))return false;
  if(!Array.isArray(row?.ingredients)||row.ingredients.length<3)return false;
  if(!Array.isArray(row?.instructions)||row.instructions.length<2)return false;
  if(!hm36TypeOk(row))return false;
  if(unsafeText(hm36RowText(row)))return false;
  return true;
}

function hm36Minutes(row){
  if(typeof hm31IsoMinutes==='function'){
    const total=hm31IsoMinutes(row?.total_time);
    if(total)return total;
    const prep=hm31IsoMinutes(row?.prep_time)||0;
    const cook=hm31IsoMinutes(row?.cook_time)||0;
    if(prep+cook)return prep+cook;
  }
  return null;
}

function hm36ToRecipe(row,cid,safeCount,catalogCount){
  const ingredients=(row.ingredients||[]).map(x=>String(x||'').trim()).filter(Boolean);
  const steps=(row.instructions||[]).map(x=>String(x||'').replace(/\s+/g,' ').trim()).filter(Boolean);
  if(ingredients.length<3||steps.length<2)return null;
  const cuisine=hm30CuisineLabel(cid);
  const mins=hm36Minutes(row);
  const servings=String(row?.servings||'').trim();
  const recipe={
    name:String(row.title||'').trim(),
    cuisine,
    type:S.selectedType==='sürpriz'?'yemek':S.selectedType,
    time:mins?`yaklaşık ${mins} dk`:'Kaynakta belirtilmemiş',
    servings:servings?(/^\d+$/.test(servings)?`${servings} kişilik`:servings):'Kaynakta belirtilmemiş',
    sourceType:'world',
    inspiration:`${cuisine} mutfağı olarak sınıflandırılmış Türkçe tarif`,
    ingredients,steps,ai:false,remote:true,
    sourceName:'Türkçe Dünya Tarif Kataloğu',
    sourceUrl:HM36_SOURCE_PAGE,
    poolCount:Number(safeCount||0),
    catalogCount:Number(catalogCount||0),
    engineVersion:HM36_VERSION
  };
  if(unsafeRecipe(recipe))return null;
  return recipe;
}

async function hm36FindCuisine(cid,previousName='',progressEl=null){
  const manifest=await hm36Manifest(cid);
  if(!manifest||!Number(manifest.count)||!Array.isArray(manifest.shards)||!manifest.shards.length){
    return {recipe:null,count:0,checked:0,safe:0};
  }
  const shards=hm30Shuffle(manifest.shards);
  let checked=0,safeTotal=0;
  for(let i=0;i<shards.length;i++){
    const sh=shards[i];
    if(progressEl){
      progressEl.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${hm30CuisineLabel(cid)} kataloğu taranıyor…</strong><p>${Number(manifest.count).toLocaleString('tr-TR')} Türkçe tarif • parça ${i+1}/${shards.length}</p></div>`;
    }
    const rows=await hm36Shard(cid,sh.file);
    checked+=rows.length;
    const safe=hm30Shuffle(rows.filter(r=>hm36SafeRow(r,previousName)));
    safeTotal+=safe.length;
    for(const row of safe){
      const recipe=hm36ToRecipe(row,cid,safeTotal,manifest.count);
      if(recipe)return {recipe,count:manifest.count,checked,safe:safeTotal};
    }
  }
  return {recipe:null,count:manifest.count,checked,safe:safeTotal};
}

async function hm36WorldTargets(randomOnly=false){
  const world=await hm36WorldManifest();
  if(!world?.cuisines)return [];
  const ids=Object.entries(world.cuisines)
    .filter(([id,x])=>Number(x?.count||0)>0 && CUISINES.some(c=>c.id===id))
    .map(([id])=>id);
  const shuffled=hm30Shuffle(ids);
  return randomOnly?shuffled.slice(0,1):shuffled;
}

const hm36PreviousGenerate=window.generateRecipe;
window.generateRecipe=async function(retry=false){
  if(!navigator.onLine)return hm36PreviousGenerate(retry);
  if(S.selectedCuisine==='türk')return hm36PreviousGenerate(retry);

  go('recipe');
  const target=document.getElementById('recipe');
  const previous=retry&&S.lastRecipe?S.lastRecipe.name:'';

  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'){
    const cid=S.selectedCuisine;
    const manifest=await hm36Manifest(cid);
    if(manifest&&Number(manifest.count)>0){
      target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${hm30CuisineLabel(cid)} Türkçe kataloğu açılıyor…</strong><p>${Number(manifest.count).toLocaleString('tr-TR')} tarif hazır. Harici çeviri servisi kullanılmıyor.</p></div>`;
      const found=await hm36FindCuisine(cid,previous,target);
      if(found.recipe){
        found.recipe.poolCount=Math.max(found.safe,1);
        S.lastRecipe=found.recipe;save();renderRecipe();return;
      }
      // Statik Türkçe katalog kategori/filtre nedeniyle sonuç vermezse eski geniş kaynak zinciri son yedek olarak denenir.
      return hm36PreviousGenerate(retry);
    }
    return hm36PreviousGenerate(retry);
  }

  const isRandom=S.selectedCuisine==='rastgele';
  const targets=await hm36WorldTargets(isRandom);
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${isRandom?'Rastgele mutfak seçiliyor…':'Türkçe dünya katalogları taranıyor…'}</strong><p>Tarifler önceden sınıflandırılmış Türkçe kataloglardan seçiliyor.</p></div>`;
  let attempted=0;
  const limit=isRandom?1:Math.min(targets.length,12);
  for(const cid of targets.slice(0,limit)){
    attempted++;
    const found=await hm36FindCuisine(cid,previous,target);
    if(found.recipe){
      found.recipe.poolCount=Math.max(found.safe,1);
      S.lastRecipe=found.recipe;save();renderRecipe();return;
    }
  }

  // Dünya seçeneğinde yabancı kataloglar bu kategori/filtreyle boşsa çalışan Türk mega havuzunu da dene.
  if(!isRandom&&typeof hm31FindNativeTurkish==='function'){
    target.innerHTML='<div class="card loading"><div class="spinner"></div><strong>Dünya kataloglarında bu tur sonuç çıkmadı</strong><p>Türkçe mega havuz da kontrol ediliyor.</p></div>';
    const native=await hm31FindNativeTurkish(previous);
    if(native.recipe){S.lastRecipe=native.recipe;save();renderRecipe();return}
  }

  // Son yedek eski açık kaynak motoru.
  if(attempted)return hm36PreviousGenerate(retry);
  hm30FailureCard('Hazır Türkçe dünya kataloğu bulunamadı.');
};

const hm36BaseRender=window.renderRecipe;
window.renderRecipe=function(){
  hm36BaseRender();
  const r=S.lastRecipe;
  if(!r||r.engineVersion!==HM36_VERSION)return;
  const proof=document.querySelector('#recipe .selection-proof');
  if(proof&&r.catalogCount){
    proof.innerHTML=`<strong>🔎 Katalog:</strong> ${Number(r.catalogCount).toLocaleString('tr-TR')} ${hm30Esc(r.cuisine)} tarifi içinden aktif filtrelerle seçildi.`;
  }
};

(function hm36Init(){
  const v=document.querySelector('.brand>.mini');if(v)v.textContent='beta • v0.36';
  const status=document.getElementById('aiStatus');
  if(status)status.textContent='Türk: 174.975 Türkçe • Dünya: derleme sırasında hazırlanmış mutfak katalogları, çeviri servisi yok';
})();
