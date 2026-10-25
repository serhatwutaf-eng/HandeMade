/* HandeMade v0.32 - mutfak seçimini kesinleştir, Dünya aramasını güçlendir */

const HM32_VERSION='0.32';
const HM32_WORLD_IDS=['italyan','meksika','hint','fransız','ispanyol','japon','çin','türk','ingiliz','amerikan','alman','portekiz','brezilya','filipin','yunan'];

function hm32ExactCuisineMatch(recipe,id=S.selectedCuisine){
  if(!recipe||id==='tümü'||id==='rastgele')return true;
  const expected=n(hm30CuisineLabel(id));
  const got=n(recipe.cuisine||'');
  return !!expected && got===expected;
}

async function hm32TryCuisine(cid,filter,previousName=''){
  let totalPool=0;
  let totalAvailable=0;
  let totalScanned=0;

  // Türk mutfağı için önce büyük, doğrudan Türkçe havuzu kullan.
  if(cid==='türk'&&typeof hm31FindNativeTurkish==='function'){
    const native=await hm31FindNativeTurkish(previousName);
    totalPool+=Number(native.pool||0);
    totalAvailable+=Number(native.available||0);
    totalScanned+=Number(native.scanned||0);
    if(native.recipe&&hm32ExactCuisineMatch(native.recipe,cid)&&!unsafeRecipe(native.recipe)){
      native.recipe.poolCount=Math.max(Number(native.recipe.poolCount||0),totalPool);
      return {recipe:native.recipe,pool:totalPool,available:totalAvailable,scanned:totalScanned};
    }
  }

  const settled=await Promise.allSettled([
    hm30ArchiveCandidates(cid,filter,previousName),
    hm30DpCandidates(cid,filter,previousName),
    hm30MealCandidates(cid,filter,previousName)
  ]);
  let candidates=[];
  for(const r of settled){
    if(r.status!=='fulfilled')continue;
    candidates.push(...(r.value.items||[]));
    totalAvailable+=Number(r.value.available||0);
    totalScanned+=Number(r.value.scanned||0);
  }
  const seen=new Set();
  candidates=hm30Shuffle(candidates).filter(c=>{
    const key=n(c.title);
    if(!key||seen.has(key)||c.cuisineId!==cid)return false;
    seen.add(key);return true;
  });
  totalPool+=candidates.length;

  for(const candidate of candidates.slice(0,18)){
    const recipe=await hm30CandidateToRecipe(candidate,totalPool);
    if(!recipe||unsafeRecipe(recipe)||!hm32ExactCuisineMatch(recipe,cid))continue;
    return {recipe,pool:totalPool,available:totalAvailable,scanned:totalScanned};
  }
  return {recipe:null,pool:totalPool,available:totalAvailable,scanned:totalScanned};
}

// Rastgele seçim yalnızca gerçekten bağlı kaynağı olan mutfaklardan yapılsın.
hm30TargetCuisineIds=function(){
  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele')return [S.selectedCuisine];
  const pool=hm30Shuffle(HM32_WORLD_IDS.filter(id=>CUISINES.some(c=>c.id===id)));
  if(S.selectedCuisine==='rastgele')return pool.length?[pool[0]]:['türk'];
  return pool;
};

const hm32BaseGenerate=window.generateRecipe;
window.generateRecipe=async function(retry=false){
  // Belirli bir mutfakta mevcut v0.31 motorunu kullan; sonuç render aşamasında da doğrulanır.
  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele')return hm32BaseGenerate(retry);
  if(!navigator.onLine)return hm32BaseGenerate(retry);

  go('recipe');
  const target=document.getElementById('recipe');
  const previous=retry&&S.lastRecipe?S.lastRecipe.name:'';
  const isRandom=S.selectedCuisine==='rastgele';
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${isRandom?'Rastgele bir dünya mutfağı seçiliyor…':'Dünya mutfakları taranıyor…'}</strong><p>Yalnızca gerçek veri kaynağı bağlı mutfaklar deneniyor.</p></div>`;

  const filter=await hm30BuildFilter();
  if(filter.unknown.length){
    hm30FailureCard('Bazı özel filtrelerin yabancı kaynak karşılığı güvenli biçimde çözülemedi: '+filter.unknown.join(', ')+'.');
    return;
  }

  const targets=hm30TargetCuisineIds();
  let totalPool=0,totalAvailable=0,totalScanned=0;
  const limit=isRandom?1:Math.min(8,targets.length);
  for(const cid of targets.slice(0,limit)){
    target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${hm30CuisineLabel(cid)} mutfağı taranıyor…</strong><p>${isRandom?'Rastgele seçilen mutfakta':'Dünya aramasında'} uygun tarif aranıyor.</p></div>`;
    const found=await hm32TryCuisine(cid,filter,previous);
    totalPool+=Number(found.pool||0);totalAvailable+=Number(found.available||0);totalScanned+=Number(found.scanned||0);
    if(found.recipe){
      found.recipe.poolCount=Math.max(Number(found.recipe.poolCount||0),totalPool);
      S.lastRecipe=found.recipe;save();renderRecipe();return;
    }
  }

  hm30FailureCard(`Dünya aramasında ${totalScanned} kayıt kontrol edildi; bu turda filtrelerine uygun, eksiksiz Türkçe bir tarif çıkaramadım. Tekrar taramada farklı mutfaklar ve adaylar denenecek.`,totalPool);
};

const hm32BaseRender=window.renderRecipe;
window.renderRecipe=function(){
  const r=S.lastRecipe;
  if(r&&S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'&&!hm32ExactCuisineMatch(r,S.selectedCuisine)){
    const e=document.getElementById('recipe');
    if(e)e.innerHTML=`<div class="card"><h2>Mutfak eşleşmesi doğrulanamadı</h2><p><strong>${hm30Esc(hm30CuisineLabel(S.selectedCuisine))}</strong> seçildi, fakat gelen tarif <strong>${hm30Esc(r.cuisine||'başka bir mutfak')}</strong> olarak etiketli. Sonuç güvenlik için gösterilmedi.</p><button class="primary" onclick="generateRecipe(true)">Aynı mutfakta tekrar ara</button></div>${hm30SourceButtons()}`;
    return;
  }
  hm32BaseRender();
  if(!r)return;
  const badge=document.querySelector('#recipe .badge.world');
  if(badge)badge.textContent=`🌍 ${r.cuisine||'Dünya'} mutfağı`;
};

(function hm32Init(){
  const all=CUISINES.find(x=>x.id==='tümü');
  if(all)all.label='🌎 Dünya';
  if(typeof renderCuisineOptions==='function')renderCuisineOptions();
  const v=document.querySelector('.brand>.mini');if(v)v.textContent='beta • v0.32';
  const status=document.getElementById('aiStatus');
  if(status)status.textContent='Dünya: kaynaklı mutfaklar sırayla taranır • Türk: 174.975 Türkçe tarif + açık kaynaklar';
})();
