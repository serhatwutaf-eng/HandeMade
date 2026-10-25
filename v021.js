/* HandeMade v0.21 — Türk mutfağı kapsamını genişlet ve web fallback'i sağlamlaştır */

HM_AREA_MAP['türk']=['Turkish'];

let hmOttomanArchiveCache=null;

async function hmLoadOttomanArchive(){
  if(hmOttomanArchiveCache)return hmOttomanArchiveCache;
  try{
    const url='https://raw.githubusercontent.com/AdamBouhmad/open-recipe-archive/main/collections/ottoman-turkish/recipes.jsonl';
    const r=await fetch(url,{cache:'force-cache'});
    if(!r.ok)return [];
    const text=await r.text();
    hmOttomanArchiveCache=text.split('\n').map(x=>x.trim()).filter(Boolean).map(line=>{
      try{return JSON.parse(line)}catch(e){return null}
    }).filter(Boolean);
    return hmOttomanArchiveCache;
  }catch(e){
    console.warn('Açık Türk tarif arşivine ulaşılamadı',e);
    return [];
  }
}

function hmArchiveTypeOk(entry){
  if(S.selectedType==='sürpriz')return true;
  const hay=n((entry?.title||'')+' '+(entry?.body||''));
  const dessert=/baklaw|baklava|pudding|sweet|cake|pastry|sherbet|syrup|jam|jelly|custard|compote|helva|halva|lokum/;
  const drink=/drink|beverage|coffee|tea|sherbet|şerbet/;
  const breakfast=/omelette|egg|breakfast/;
  if(S.selectedType==='tatlı')return dessert.test(hay);
  if(S.selectedType==='içecek')return drink.test(hay);
  if(S.selectedType==='kahvaltı')return breakfast.test(hay);
  if(S.selectedType==='atıştırmalık')return /bread|pastry|börek|borek|fritter|dolma|stuffed/.test(hay)&&!dessert.test(hay);
  return !dessert.test(hay)&&!drink.test(hay);
}

async function hmFindOttomanRecipe(previousName=''){
  if(S.selectedCuisine!=='türk')return null;
  const f=hmRemoteForbidden();
  if(f.unknown.length)return null;
  const archive=await hmLoadOttomanArchive();
  if(!archive.length)return null;

  const pool=hmShuffle(archive.filter(hmArchiveTypeOk).filter(x=>!previousName||n(x.title)!==n(previousName)));
  for(const entry of pool.slice(0,120)){
    const source=String(entry.body||'');
    if(!source)continue;
    const hay=(String(entry.title||'')+' | '+source).toLowerCase();
    if(f.terms.some(t=>t&&hay.includes(String(t).toLowerCase())))continue;

    const recipe=await hmTextualToRecipe({
      name:entry.title,
      cuisine:'Turkish',
      meal:'Dinner',
      servings:4,
      url:entry.source_url||''
    },source);
    if(!recipe)continue;
    recipe.cuisine='Türk';
    recipe.inspiration='Osmanlı/Türk mutfağından açık arşiv tarifi';
    recipe.sourceName='Open Recipe Archive';
    recipe.sourceUrl=entry.source_url||'';
    recipe.remote=true;
    recipe.ai=false;
    if(hmRecipeIngredientsAreTurkish(recipe)&&hmStepsLookComplete(recipe)&&!unsafeRecipe(recipe))return recipe;
  }
  return null;
}

const hmFindWorldRecipeV020=hmFindWorldRecipe;
hmFindWorldRecipe=async function(previousName=''){
  if(!navigator.onLine)return null;
  const normal=await hmFindWorldRecipeV020(previousName);
  if(normal)return normal;
  const archive=await hmFindOttomanRecipe(previousName);
  if(archive)return archive;
  return null;
};

function hmWebSearchCard(){
  const target=document.getElementById('recipe');
  if(!target)return;
  const url=hmBrowserSearchUrl();
  target.classList.remove('hidden');
  target.innerHTML=`<div class="card"><h2>Web'de daha geniş ara</h2><p>Uygulama içindeki kaynaklarda uygun tarif bulunamadı. Arama HandeMade'i kapatmadan ayrı bir tarayıcı sekmesinde açılır.</p><a class="primary" style="display:block;text-align:center;text-decoration:none" href="${url}" target="_blank" rel="noopener noreferrer">🌐 Tarayıcıda ara</a><button class="secondary" style="margin-top:10px" onclick="go('home')">HandeMade'de kal</button><div class="warn" style="margin-top:12px"><strong>Not:</strong> Web sonuçları HandeMade'in güvenlik filtresinden geçmez. Alerjen ve içerik kontrolünü tarif sayfasında ayrıca yap.</div></div>`;
}

hmOpenBrowserSearch=function(){
  if(!navigator.onLine){
    const target=document.getElementById('recipe');
    if(target)target.innerHTML='<div class="card"><h2>İnternet bağlantısı yok</h2><p>Web araması için internet bağlantısı gerekiyor.</p><button class="secondary" onclick="go(\'home\')">Seçime dön</button></div>';
    return;
  }
  hmWebSearchCard();
};

const v021Version=document.querySelector('.brand>.mini');
if(v021Version)v021Version.textContent='beta • v0.21';
