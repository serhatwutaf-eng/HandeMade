/* HandeMade v0.34 - yabancı mutfaklarda doğrudan satır örnekleme + toplu çeviri */

const HM34_VERSION='0.34';
const HM34_ROWS_CACHE=new Map();
const HM34_TRANSLATE_CACHE=new Map();

Object.assign(HM33_TAGS,{
  'türk':['turkish'],'italyan':['italian'],'japon':['japanese'],'meksika':['mexican'],'hint':['indian'],'tay':['thai'],'kore':['korean'],'fransız':['french'],'ispanyol':['spanish'],'yunan':['greek'],'orta doğu':['middle-eastern','lebanese','iranian-persian'],'fas':['moroccan'],'çin':['chinese'],'vietnam':['vietnamese'],'endonezya':['indonesian'],'filipin':['filipino'],'peru':['peruvian'],'brezilya':['brazilian'],'alman':['german'],'ingiliz':['english','scottish','welsh'],'amerikan':['american'],'portekiz':['portuguese'],'rus':['russian'],'karayip':['caribbean','jamaican','cuban','puerto-rican'],'batı afrika':['west-african','nigerian','african']
});

function hm34RowsUrl(offset,length=100){
  const p=new URLSearchParams({dataset:HM33_DATASET,config:'default',split:'train',offset:String(Math.max(0,offset)),length:String(Math.min(100,length))});
  return 'https://datasets-server.huggingface.co/rows?'+p.toString();
}

async function hm34RowsPage(offset){
  const key=Number(offset||0);
  if(HM34_ROWS_CACHE.has(key))return HM34_ROWS_CACHE.get(key);
  try{
    const r=await fetch(hm34RowsUrl(key),{cache:'no-store'});
    if(!r.ok)return [];
    const d=await r.json();
    const rows=Array.isArray(d?.rows)?d.rows.map(x=>x?.row||x).filter(Boolean):[];
    HM34_ROWS_CACHE.set(key,rows);
    return rows;
  }catch(e){console.warn('232K satır örneklemesi alınamadı',e);return []}
}

function hm34Offsets(count){
  const max=Math.max(0,HM33_DATASET_ROWS-100);const set=new Set();
  while(set.size<count)set.add(Math.floor(Math.random()*(max+1)));
  return [...set];
}

async function hm34FetchRandomRows(count){
  const offsets=hm34Offsets(count);const out=[];
  for(let i=0;i<offsets.length;i+=6){const batch=await Promise.all(offsets.slice(i,i+6).map(hm34RowsPage));out.push(...batch.flat())}
  return out;
}

function hm34CuisineFromRow(row){return hm33CuisineFromTags(hm33Tags(row))}

async function hm34DirectCuisineCandidates(cuisineId,filter,previousName=''){
  let rows=await hm34FetchRandomRows(14);let items=[];
  const collect=sourceRows=>{for(const row of sourceRows){if(!hm33ExactTagCuisine(row,cuisineId))continue;if(!hm33FoodSafe(row,filter,previousName))continue;items.push({kind:'food232',cuisineId,title:String(row.name||'').trim(),raw:row,sourceName:'Food.com 232K açık tarif havuzu',sourceUrl:HM33_DATASET_PAGE})}};
  collect(rows);
  if(items.length<6){const more=await hm34FetchRandomRows(22);rows=rows.concat(more);collect(more)}
  if(items.length<3){const more=await hm34FetchRandomRows(24);rows=rows.concat(more);collect(more)}
  const seen=new Set();items=hm30Shuffle(items).filter(x=>{const k=n(x.title);if(!k||seen.has(k))return false;seen.add(k);return true});
  return {items,available:HM33_DATASET_ROWS,scanned:rows.length};
}

async function hm34DirectWorldCandidates(filter,previousName=''){
  const rows=await hm34FetchRandomRows(18);let items=[];
  for(const row of rows){const cuisineId=hm34CuisineFromRow(row);if(!cuisineId||!hm33ExactTagCuisine(row,cuisineId))continue;if(!hm33FoodSafe(row,filter,previousName))continue;items.push({kind:'food232',cuisineId,title:String(row.name||'').trim(),raw:row,sourceName:'Food.com 232K açık tarif havuzu',sourceUrl:HM33_DATASET_PAGE})}
  const seen=new Set();items=hm30Shuffle(items).filter(x=>{const k=n(x.title);if(!k||seen.has(k))return false;seen.add(k);return true});
  return {items,available:HM33_DATASET_ROWS,scanned:rows.length};
}

function hm34SplitForTranslation(text,maxChars=430){
  const source=String(text||'').replace(/\r/g,'').trim();if(!source)return [];
  const sentences=source.match(/[^.!?\n]+(?:[.!?]+|\n|$)/g)?.map(x=>x.trim()).filter(Boolean)||[source];
  const out=[];let cur='';
  for(const s of sentences){const next=(cur+' '+s).trim();if(cur&&next.length>maxChars){out.push(cur);cur=s}else cur=next}
  if(cur)out.push(cur);return out;
}

async function hm34TranslateText(text){
  const src=String(text||'').trim();if(!src)return '';
  if(HM34_TRANSLATE_CACHE.has(src))return HM34_TRANSLATE_CACHE.get(src);
  const parts=hm34SplitForTranslation(src);const translated=[];
  for(const part of parts){let tr='';try{tr=String(await hmTranslateCached(part)||'').trim()}catch(e){}if(!tr){HM34_TRANSLATE_CACHE.set(src,'');return ''}translated.push(hmDecodeHtml(tr))}
  const out=translated.join(' ').replace(/\s+/g,' ').trim();HM34_TRANSLATE_CACHE.set(src,out);return out;
}

function hm34BatchPack(lines,maxChars=420){
  const batches=[];let batch=[];let size=0;
  lines.forEach((line,idx)=>{const marked=`§${idx+1}§ ${line}`;if(batch.length&&size+marked.length+1>maxChars){batches.push(batch);batch=[];size=0}batch.push({idx,line,marked});size+=marked.length+1});
  if(batch.length)batches.push(batch);return batches;
}

function hm34ParseMarked(text,batch){
  const raw=String(text||'');const found=new Map();const re=/§\s*(\d+)\s*§\s*([\s\S]*?)(?=§\s*\d+\s*§|$)/g;let m;
  while((m=re.exec(raw)))found.set(Number(m[1])-1,String(m[2]||'').trim());
  if(found.size!==batch.length)return null;return batch.map(x=>found.get(x.idx)||'');
}

async function hm34TranslateList(lines,kind){
  const source=lines.map(x=>String(x||'').trim()).filter(Boolean);
  const prepared=source.map(x=>{let y=typeof hmMetricizeEnglish==='function'?hmMetricizeEnglish(x):x;if(kind==='ingredient'&&typeof hmIngredientPreTranslate==='function')y=hmIngredientPreTranslate(y);return y});
  const result=new Array(source.length).fill('');const batches=hm34BatchPack(prepared);
  for(const batch of batches){const block=batch.map(x=>x.marked).join('\n');let tr=await hm34TranslateText(block);let parsed=hm34ParseMarked(tr,batch);if(!parsed){parsed=[];for(const item of batch)parsed.push(await hm34TranslateText(item.line))}for(let j=0;j<batch.length;j++)result[batch[j].idx]=parsed[j]||''}
  for(let i=0;i<result.length;i++){
    let out=hmDecodeHtml(result[i]||'').replace(/\s+/g,' ').trim();
    if(kind==='ingredient'){
      if(typeof hmIngredientPreTranslate==='function')out=hmIngredientPreTranslate(out);
      if(typeof hmMeasureTr==='function')out=hmMeasureTr(out);
      out=out.replace(/\bto taste\b/gi,'damak tadına göre').replace(/\bas needed\b/gi,'gerektiği kadar').replace(/\s+/g,' ').trim();
      if(typeof hmHasForeignResidue==='function'&&hmHasForeignResidue(source[i],out))return null;if(HM30_ING_EN.test(out))return null;
    }else if(HM30_STEP_EN.test(out))return null;
    if(!out)return null;result[i]=out;
  }
  return result;
}

hm33FoodToRecipe=async function(candidate,poolCount){
  const row=candidate.raw||{};const srcIngredients=hm33PyList(row.ingredients).slice(0,24);const srcSteps=hm33PyList(row.steps).slice(0,20);
  if(srcIngredients.length<3||srcSteps.length<2)return null;
  const ingredients=await hm34TranslateList(srcIngredients,'ingredient');if(!ingredients||ingredients.length<3)return null;
  const steps=await hm34TranslateList(srcSteps,'step');if(!steps||steps.length<2||steps.join(' ').length<120)return null;
  const cuisine=hm30CuisineLabel(candidate.cuisineId);const mins=Number(row.minutes||0);
  const recipe={name:String(row.name||candidate.title||'').trim(),cuisine,type:S.selectedType==='sürpriz'?'yemek':S.selectedType,time:mins>0&&mins<1440?`yaklaşık ${mins} dk`:'Kaynakta belirtilmemiş',servings:'Kaynakta belirtilmemiş',sourceType:'world',inspiration:`${cuisine} mutfağı etiketi taşıyan gerçek tarif`,ingredients,steps,ai:false,remote:true,sourceName:candidate.sourceName||'Food.com 232K açık tarif havuzu',sourceUrl:HM33_DATASET_PAGE,poolCount:Number(poolCount||0),engineVersion:HM34_VERSION};
  if(unsafeRecipe(recipe))return null;return recipe;
};

async function hm34SpecificPool(cuisineId,filter,previousName=''){
  let fast={items:[],available:0,scanned:0};try{fast=await hm33FoodCandidates(cuisineId,filter,previousName)}catch(e){}
  if((fast.items||[]).length>=8)return fast;
  const direct=await hm34DirectCuisineCandidates(cuisineId,filter,previousName);const seen=new Set();
  const items=hm30Shuffle([...(fast.items||[]),...(direct.items||[])]).filter(x=>{const k=n(x.title);if(!k||seen.has(k))return false;seen.add(k);return true});
  return {items,available:Math.max(Number(fast.available||0),Number(direct.available||0)),scanned:Number(fast.scanned||0)+Number(direct.scanned||0)};
}

const hm34OfflineGenerate=window.generateRecipe;
window.generateRecipe=async function(retry=false){
  if(!navigator.onLine)return hm34OfflineGenerate(retry);
  if(S.selectedCuisine==='türk')return hm34OfflineGenerate(retry);
  go('recipe');const target=document.getElementById('recipe');const previous=retry&&S.lastRecipe?S.lastRecipe.name:'';const filter=await hm30BuildFilter();
  if(filter.unknown.length){hm30FailureCard('Bazı özel filtrelerin yabancı kaynak karşılığı güvenli biçimde çözülemedi: '+filter.unknown.join(', ')+'.');return}
  if(S.selectedCuisine==='tümü'){
    target.innerHTML='<div class="card loading"><div class="spinner"></div><strong>232 binlik dünya havuzu doğrudan taranıyor…</strong><p>Arama indeksine bağlı kalmadan rastgele satır dilimleri çekilip mutfak etiketleri cihazda doğrulanıyor.</p></div>';
    const direct=await hm34DirectWorldCandidates(filter,previous);
    target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${direct.items.length} güvenli dünya adayı bulundu</strong><p>${direct.scanned} rastgele kayıt kontrol edildi. Seçilen tarif toplu olarak Türkçeleştiriliyor.</p></div>`;
    const recipe=await hm33TryCandidates(direct.items,direct.items.length,28);if(recipe){S.lastRecipe=recipe;save();renderRecipe();return}return hm34OfflineGenerate(retry);
  }
  if(S.selectedCuisine==='rastgele'){
    const ids=hm30Shuffle(Object.keys(HM33_TAGS).filter(x=>x!=='türk'));
    for(const cid of ids.slice(0,5)){target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${hm30CuisineLabel(cid)} mutfağında geniş havuz taranıyor…</strong></div>`;const pool=await hm34SpecificPool(cid,filter,previous);const recipe=await hm33TryCandidates(pool.items,pool.items.length,24);if(recipe){S.lastRecipe=recipe;save();renderRecipe();return}}
    return hm34OfflineGenerate(retry);
  }
  const cid=S.selectedCuisine;target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${hm30CuisineLabel(cid)} mutfağı için 232 binlik havuz taranıyor…</strong><p>Önce indeks, ardından doğrudan rastgele satır örneklemesi kullanılıyor.</p></div>`;
  const pool=await hm34SpecificPool(cid,filter,previous);target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${pool.items.length} güvenli ${hm30CuisineLabel(cid)} adayı bulundu</strong><p>${pool.scanned} kayıt kontrol edildi. Tarif Türkçeleştiriliyor.</p></div>`;
  const recipe=await hm33TryCandidates(pool.items,pool.items.length,28);if(recipe&&hm32ExactCuisineMatch(recipe,cid)){S.lastRecipe=recipe;save();renderRecipe();return}
  const fallback=await hm32TryCuisine(cid,filter,previous);if(fallback.recipe&&hm32ExactCuisineMatch(fallback.recipe,cid)){S.lastRecipe=fallback.recipe;save();renderRecipe();return}
  hm30FailureCard(`${hm30CuisineLabel(cid)} mutfağında ${pool.scanned+Number(fallback.scanned||0)} kayıt kontrol edildi; bu turda filtrelerine uyan ve Türkçe doğrulamayı geçen tarif çıkmadı.`,pool.items.length+Number(fallback.pool||0));
};

(function hm34Init(){const v=document.querySelector('.brand>.mini');if(v)v.textContent='beta • v0.34';const badge=document.getElementById('aiBadge');const status=document.getElementById('aiStatus');if(badge)badge.textContent='500 bin+ ham kaynak kaydı';if(status)status.textContent='Türk: 174.975 doğrudan Türkçe • Diğer mutfaklar: 231.637 ortak mega havuz + açık arşivler';})();
