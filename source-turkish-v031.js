/* HandeMade v0.31 - native Turkish mega source */

const HM31_HF_DATASET='mmkocak/turkish-recipes-175K';
const HM31_HF_ROWS=153978;
const HM31_HF_PAGE=100;
const HM31_HF_WINDOWS=6;
const HM31_STRUCTURED_URL='https://huggingface.co/datasets/104bit/turkish-recipe-dataset/resolve/main/recipes_groq_cleaned.json';
const HM31_STRUCTURED_PAGE='https://huggingface.co/datasets/104bit/turkish-recipe-dataset';
const HM31_MEGA_PAGE='https://huggingface.co/datasets/mmkocak/turkish-recipes-175K';
let hm31StructuredCache=null;

function hm31TurkishText(row){
  return [
    row?.title||row?.tarif_adi||'',
    row?.description||'',
    row?.category||row?.kategori||'',
    ...(Array.isArray(row?.tags)?row.tags:[]),
    ...(Array.isArray(row?.ingredients)?row.ingredients:[]),
    ...(Array.isArray(row?.instructions)?row.instructions:[]),
    ...(Array.isArray(row?.malzemeler)?row.malzemeler.map(x=>typeof x==='string'?x:[x?.miktar,x?.birim,x?.isim].filter(v=>v!==null&&v!==undefined&&String(v).trim()).join(' ')):[]),
    ...(Array.isArray(row?.yapilis_adimlari)?row.yapilis_adimlari:[])
  ].join(' | ');
}

function hm31OtherCuisineHint(row){
  const text=n([
    row?.title||row?.tarif_adi||'',
    row?.category||row?.kategori||'',
    ...(Array.isArray(row?.tags)?row.tags:[])
  ].join(' '));
  return /\b(italyan|japon|meksika|hint|tay|kore|fransız|ispanyol|yunan|çin|vietnam|endonezya|filipin|peru|brezilya|alman|ingiliz|amerikan|portekiz|rus|fas|lübnan|italian|japanese|mexican|thai|korean|french|spanish|greek|chinese|vietnamese|pizza|sushi|ramen|taco|quesadilla|risotto|paella|bibimbap|tempura|nachos|burrito)\b/i.test(text);
}

function hm31TypeOk(row){
  const text=n([
    row?.category||row?.kategori||'',
    row?.title||row?.tarif_adi||'',
    ...(Array.isArray(row?.tags)?row.tags:[])
  ].join(' '));
  const dessert=/tatlı|pasta|kek|kurabiye|şerbet|helva|baklava|lokum|dondurma|çikolata/;
  const drink=/içecek|şurup|kahve|çay|limonata|smoothie|meyve suyu/;
  const breakfast=/kahvalt/;
  const snack=/atıştırmalık|meze|salata|aperatif|börek|hamur işi|sandviç/;
  if(S.selectedType==='sürpriz')return true;
  if(S.selectedType==='tatlı')return dessert.test(text);
  if(S.selectedType==='içecek')return drink.test(text);
  if(S.selectedType==='kahvaltı')return breakfast.test(text)&&!dessert.test(text);
  if(S.selectedType==='atıştırmalık')return snack.test(text)&&!dessert.test(text)&&!drink.test(text);
  return !dessert.test(text)&&!drink.test(text)&&!breakfast.test(text)&&!(/turşu/.test(text));
}

function hm31SafeTurkishRow(row,previousName=''){
  const title=String(row?.title||row?.tarif_adi||'').trim();
  if(!title)return false;
  if(previousName&&n(title)===n(previousName))return false;
  if(hm31OtherCuisineHint(row))return false;
  if(!hm31TypeOk(row))return false;
  const text=hm31TurkishText(row);
  if(unsafeText(text))return false;
  return true;
}

function hm31IsoMinutes(x){
  const m=String(x||'').match(/^PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if(!m)return null;
  return (Number(m[1]||0)*60)+Number(m[2]||0)||null;
}

function hm31NativeToRecipe(row,poolCount,sourceName,sourceUrl){
  const title=String(row?.title||row?.tarif_adi||'').trim();
  let ingredients=[];
  if(Array.isArray(row?.ingredients))ingredients=row.ingredients.map(x=>String(x||'').trim()).filter(Boolean);
  else if(Array.isArray(row?.malzemeler)){
    ingredients=row.malzemeler.map(x=>{
      if(typeof x==='string')return x.trim();
      return [x?.miktar,x?.birim,x?.isim].filter(v=>v!==null&&v!==undefined&&String(v).trim()).join(' ').trim();
    }).filter(Boolean);
  }
  let steps=[];
  if(Array.isArray(row?.instructions))steps=row.instructions.map(x=>String(x||'').trim()).filter(Boolean);
  else if(Array.isArray(row?.yapilis_adimlari))steps=row.yapilis_adimlari.map(x=>String(x||'').trim()).filter(Boolean);
  if(ingredients.length<3||steps.length<2)return null;
  if(steps.join(' ').length<100)return null;
  const foreignIng=/\b(fresh|dried|ground|chopped|diced|sliced|grated|minced|crushed|peeled|boneless|skinless|tablespoons?|teaspoons?|cups?|ounces?|pounds?|stock|broth)\b/i;
  const foreignStep=/\b(the|and|with|until|then|heat|add|stir|cook|bake|serve|mix|place|minutes?|water|pan|oven|bowl|saucepan|remove|pour|boil|simmer)\b/i;
  if(ingredients.some(x=>foreignIng.test(x))||steps.some(x=>foreignStep.test(x)))return null;
  let mins=hm31IsoMinutes(row?.total_time);
  if(!mins){
    const a=Number(row?.hazirlik_suresi_dk||0);const b=Number(row?.pisirme_suresi_dk||0);mins=(a+b)||null;
  }
  const servings=String(row?.servings||row?.porsiyon||'').trim();
  const recipe={
    name:title,
    cuisine:'Türk',
    type:S.selectedType==='sürpriz'?'yemek':S.selectedType,
    time:mins?`yaklaşık ${mins} dk`:'Kaynakta belirtilmemiş',
    servings:servings?`${servings}${/^\d+$/.test(servings)?' kişilik':''}`:'Kaynakta belirtilmemiş',
    sourceType:'world',
    inspiration:'Türkçe geniş tarif havuzundan gerçek tarif',
    ingredients,steps,ai:false,remote:true,
    sourceName,sourceUrl,
    poolCount:Number(poolCount||0),engineVersion:'0.31'
  };
  if(unsafeRecipe(recipe))return null;
  return recipe;
}

async function hm31FetchWindow(offset){
  const url='https://datasets-server.huggingface.co/rows?dataset='+encodeURIComponent(HM31_HF_DATASET)+'&config=default&split=train&offset='+Math.max(0,offset)+'&length='+HM31_HF_PAGE;
  try{
    const r=await fetch(url,{cache:'no-store'});
    if(!r.ok)return [];
    const d=await r.json();
    return Array.isArray(d?.rows)?d.rows.map(x=>x?.row||x).filter(Boolean):[];
  }catch(e){return []}
}

async function hm31MegaCandidates(previousName=''){
  const offsets=[];
  for(let i=0;i<HM31_HF_WINDOWS;i++)offsets.push(Math.floor(Math.random()*(HM31_HF_ROWS-HM31_HF_PAGE)));
  const chunks=await Promise.all(offsets.map(hm31FetchWindow));
  const rows=chunks.flat();
  const safe=hm30Shuffle(rows.filter(x=>hm31SafeTurkishRow(x,previousName)));
  return {rows:safe,scanned:rows.length,available:174975,sourceName:'Turkish Recipes 175K',sourceUrl:HM31_MEGA_PAGE};
}

async function hm31LoadStructured(){
  if(hm31StructuredCache)return hm31StructuredCache;
  try{
    const r=await fetch(HM31_STRUCTURED_URL,{cache:'force-cache'});
    if(!r.ok)return [];
    const d=await r.json();
    hm31StructuredCache=Array.isArray(d)?d:(Array.isArray(d?.recipes)?d.recipes:[]);
    return hm31StructuredCache;
  }catch(e){return []}
}

async function hm31StructuredCandidates(previousName=''){
  const rows=await hm31LoadStructured();
  const safe=hm30Shuffle(rows.filter(x=>hm31SafeTurkishRow(x,previousName)));
  return {rows:safe,scanned:rows.length,available:rows.length,sourceName:'Yapılandırılmış Türk Yemek Tarifleri',sourceUrl:HM31_STRUCTURED_PAGE};
}

async function hm31FindNativeTurkish(previousName=''){
  const mega=await hm31MegaCandidates(previousName);
  for(const row of mega.rows.slice(0,50)){
    const recipe=hm31NativeToRecipe(row,mega.rows.length,mega.sourceName,mega.sourceUrl);
    if(recipe)return {recipe,scanned:mega.scanned,available:mega.available,pool:mega.rows.length};
  }
  const structured=await hm31StructuredCandidates(previousName);
  for(const row of structured.rows.slice(0,80)){
    const recipe=hm31NativeToRecipe(row,structured.rows.length,structured.sourceName,structured.sourceUrl);
    if(recipe)return {recipe,scanned:structured.scanned,available:structured.available,pool:structured.rows.length};
  }
  return {recipe:null,scanned:mega.scanned+structured.scanned,available:mega.available+structured.available,pool:mega.rows.length+structured.rows.length};
}

const hm31CoreGenerate=window.generateRecipe;
window.generateRecipe=async function(retry=false){
  if(S.selectedCuisine!=='türk'||!navigator.onLine)return hm31CoreGenerate(retry);
  go('recipe');
  const target=document.getElementById('recipe');
  const previous=retry&&S.lastRecipe?S.lastRecipe.name:'';
  target.innerHTML='<div class="card loading"><div class="spinner"></div><strong>174.975 Türkçe tarif havuzu taranıyor…</strong><p>Rastgele geniş örneklem alınıyor; kereviz, karabiber, alerjenler ve sevmediklerin kaynak metinde eleniyor.</p></div>';
  const found=await hm31FindNativeTurkish(previous);
  if(found.recipe){
    found.recipe.poolCount=found.pool;
    S.lastRecipe=found.recipe;save();renderRecipe();return;
  }
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>Türkçe mega havuzda bu tur uygun sonuç çıkmadı</strong><p>${found.scanned} kayıt örneği kontrol edildi. Açık Türk arşivi ve diğer kaynaklara geçiliyor.</p></div>`;
  return hm31CoreGenerate(retry);
};

(function hm31Init(){
  const v=document.querySelector('.brand>.mini');if(v)v.textContent='beta • v0.31';
  const badge=document.getElementById('aiBadge');const status=document.getElementById('aiStatus');
  if(badge){badge.className='badge live';badge.textContent='300 bin+ ham kaynak kaydı'}
  if(status)status.textContent='174.975 Türkçe + 54.843 açık arşiv + 73.284 JSON + TheMealDB';
})();
