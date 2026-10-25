/* HandeMade v0.17 — hazırlanışı eksiksiz ve ayrıntılı göster */

function hmInstructionSentences(text){
  return String(text||'')
    .replace(/\r/g,' ')
    .replace(/\n+/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .match(/[^.!?]+(?:[.!?]+|$)/g)?.map(x=>x.trim()).filter(Boolean)||[];
}

function hmGroupInstructionSentences(sentences,maxChars=380){
  const groups=[];
  let cur='';
  for(const sentence of sentences){
    const next=(cur+' '+sentence).trim();
    if(cur&&next.length>maxChars){groups.push(cur);cur=sentence.trim()}
    else cur=next;
  }
  if(cur)groups.push(cur);
  return groups;
}

function hmSplitTranslatedStep(text){
  const s=String(text||'').replace(/\s+/g,' ').trim();
  if(!s)return [];
  const parts=s.match(/[^.!?]+(?:[.!?]+|$)/g)?.map(x=>x.trim()).filter(Boolean)||[s];
  const out=[];
  for(const p of parts){
    if(p.length<=300){out.push(p);continue}
    const clauses=p.split(/(?<=[,;:])\s+/).map(x=>x.trim()).filter(Boolean);
    if(clauses.length>1)out.push(...clauses);
    else out.push(p);
  }
  return out;
}

async function hmTranslateInstructionFull(text){
  const sourceSentences=hmInstructionSentences(text);
  if(!sourceSentences.length)return [];
  const groups=hmGroupInstructionSentences(sourceSentences);
  const translated=[];
  for(const group of groups){
    const metric=hmMetricizeEnglish(group);
    const tr=await hmTranslateCached(metric);
    if(!tr)return [];
    translated.push(...hmSplitTranslatedStep(hmDecodeHtml(tr)));
  }
  return translated.filter(Boolean);
}

// TheMealDB: kaynak hazırlanışın tamamı çevrilir. Önceki 8 adım sınırı kaldırıldı.
hmTranslateInstructions=async function(text){
  return hmTranslateInstructionFull(text);
};

// Textual Chef: hazırlanış bölümündeki tüm numaralı/maddeli adımları ve devam satırlarını koru.
hmParseTextualMarkdown=function(md){
  const lines=String(md||'').replace(/\r/g,'').split('\n');
  let mode='';
  const ingredients=[];
  const steps=[];
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
      continue;
    }
    if(mode==='steps'){
      const m=line.match(/^(?:\d+[.)]|[-*+])\s+(.+)$/);
      if(m){steps.push(hmStripMarkdown(m[1]));continue}
      if(steps.length&&line.length>2)steps[steps.length-1]+=' '+hmStripMarkdown(line);
    }
  }
  return {ingredients:ingredients.filter(Boolean).slice(0,30),steps:steps.filter(Boolean)};
};

// Textual Chef: 9 adım sınırı kaldırıldı; her kaynak adım tam çevrilip gerekiyorsa okunabilir alt adımlara ayrılır.
hmTextualToRecipe=async function(entry,md){
  const parsed=hmParseTextualMarkdown(md);
  if(parsed.ingredients.length<3||parsed.steps.length<2)return null;
  const ingredients=[];
  for(const line of parsed.ingredients){
    const tr=await hmTranslateIngredientLine(line);
    if(!tr)return null;
    ingredients.push(tr);
  }
  const steps=[];
  for(const sourceStep of parsed.steps){
    const translated=await hmTranslateInstructionFull(sourceStep);
    if(!translated.length)return null;
    steps.push(...translated);
  }
  if(steps.length<3)return null;
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
    ingredients,
    steps,
    ai:false,
    remote:true,
    sourceName:'Textual Chef',
    sourceUrl:hmEntryUrl(entry)
  };
};

function hmStepsLookComplete(recipe){
  if(!recipe?.remote)return true;
  const steps=Array.isArray(recipe.steps)?recipe.steps:[];
  if(steps.length<3)return false;
  const total=steps.join(' ').trim().length;
  const short=steps.filter(x=>String(x).trim().length<18).length;
  return total>=180 && short<=Math.ceil(steps.length/2);
}

const hmRenderV017=window.renderRecipe;
window.renderRecipe=function(){
  const r=S.lastRecipe;
  if(r?.remote&&!hmStepsLookComplete(r)){
    const target=document.getElementById('recipe');
    if(target){
      target.classList.remove('hidden');
      target.innerHTML='<div class="card"><h2>Hazırlanış eksik bulundu</h2><p>Kaynak tarifin hazırlanış bilgisi yeterince ayrıntılı olmadığı için bu tarif gösterilmedi.</p><button class="primary" onclick="generateRecipe(true)">Başka tarif bul</button></div>';
    }
    return;
  }
  hmRenderV017();
};

const v017Version=document.querySelector('.brand>.mini');
if(v017Version)v017Version.textContent='beta • v0.17';
