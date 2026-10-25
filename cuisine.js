const CUISINES=[
  {id:'tümü',label:'🌎 Tümü'},
  {id:'rastgele',label:'🎲 Rastgele'},
  {id:'türk',label:'🇹🇷 Türk'},
  {id:'italyan',label:'🇮🇹 İtalyan'},
  {id:'japon',label:'🇯🇵 Japon'},
  {id:'meksika',label:'🇲🇽 Meksika'},
  {id:'hint',label:'🇮🇳 Hint'},
  {id:'tay',label:'🇹🇭 Tay'},
  {id:'kore',label:'🇰🇷 Kore'},
  {id:'fransız',label:'🇫🇷 Fransız'},
  {id:'ispanyol',label:'🇪🇸 İspanyol'},
  {id:'yunan',label:'🇬🇷 Yunan'},
  {id:'orta doğu',label:'🧆 Orta Doğu'},
  {id:'fas',label:'🇲🇦 Fas'}
];

const CUISINE_TERMS={
  'türk':['türk','turkish','anadolu','osmanlı'],
  'italyan':['italyan','italy','italian'],
  'japon':['japon','japan','japanese'],
  'meksika':['meksika','mexico','mexican'],
  'hint':['hint','india','indian'],
  'tay':['tay','thai','thailand'],
  'kore':['kore','korean','korea'],
  'fransız':['fransız','french','france','provence'],
  'ispanyol':['ispanyol','spanish','spain'],
  'yunan':['yunan','greek','greece'],
  'orta doğu':['orta doğu','middle east','levant','levantin','lübnan','lebanese'],
  'fas':['fas','moroccan','morocco']
};

if(!S.selectedCuisine)S.selectedCuisine='tümü';

function addRecipeOnce(recipe){
  if(!R.some(x=>x.name===recipe.name))R.push(recipe);
}

[
  {name:'İmam Bayıldı',cuisine:'Türk',type:'yemek',time:'55 dk',servings:'3 kişilik',sourceType:'world',inspiration:'Ege ve Osmanlı zeytinyağlı geleneği',ingredients:['patlıcan','soğan','domates','sarımsak','zeytinyağı','maydanoz','tuz'],steps:['Patlıcanları yumuşayana kadar fırınla.','Soğan, sarımsak ve domatesi zeytinyağında pişir.','İç harcı patlıcanlara doldurup kısa süre daha fırınla.']},
  {name:'Polenta ai Funghi',cuisine:'İtalyan',type:'yemek',time:'35 dk',servings:'2 kişilik',sourceType:'world',inspiration:'Kuzey İtalya polenta geleneği',ingredients:['mısır irmiği','mantar','sarımsak','zeytinyağı','maydanoz','su','tuz'],steps:['Mısır irmiğini suda karıştırarak koyulaştır.','Mantar ve sarımsağı zeytinyağında sotele.','Mantarı sıcak polentanın üzerine ekleyip maydanozla servis et.']},
  {name:'Sebzeli Onigiri',cuisine:'Japon',type:'atıştırmalık',time:'30 dk',servings:'4 adet',sourceType:'world',inspiration:'Japon pirinç topları',ingredients:['Japon pirinci','salatalık','havuç','nori','pirinç sirkesi','tuz'],steps:['Pirinci pişirip hafifçe soğut.','İnce doğranmış sebzeleri pirince ekle.','Ellerini ıslatıp üçgen şekil ver ve nori ile sar.']},
  {name:'Limonlu Fırın Patates',cuisine:'Yunan',type:'yemek',time:'50 dk',servings:'3 kişilik',sourceType:'world',inspiration:'Yunan limonlu fırın patatesleri',ingredients:['patates','limon','zeytinyağı','sarımsak','kekik','su','tuz'],steps:['Patatesleri iri dilimle.','Limon, zeytinyağı, sarımsak ve kekikle harmanla.','Az su ekleyip kenarları kızarana kadar fırınla.']},
  {name:'Mujadara',cuisine:'Orta Doğu',type:'yemek',time:'40 dk',servings:'3 kişilik',sourceType:'world',inspiration:'Levant mercimek ve pirinç yemeği',ingredients:['yeşil mercimek','pirinç','soğan','zeytinyağı','kimyon','tuz'],steps:['Mercimeği yarı yumuşayana kadar haşla.','Pirinç ve kimyonu ekleyip birlikte pişir.','Soğanları zeytinyağında koyulaştırıp üzerine ekle.']},
  {name:'Bibimbap Esintili Sebze Kasesi',cuisine:'Kore',type:'yemek',time:'30 dk',servings:'2 kişilik',sourceType:'world',inspiration:'Kore bibimbap sunumundan uyarlanmış sebze kasesi',ingredients:['pirinç','ıspanak','havuç','kabak','mantar','sarımsak','pirinç sirkesi','tuz'],steps:['Pirinci pişir.','Sebzeleri ayrı ayrı kısa süre sotele.','Sebzeleri pirincin üzerinde bölümler halinde düzenleyip pirinç sirkesiyle servis et.']}
].forEach(addRecipeOnce);

function cuisineEntry(id=S.selectedCuisine){
  return CUISINES.find(x=>x.id===id)||CUISINES[0];
}

function cuisineName(id=S.selectedCuisine){
  return cuisineEntry(id).label.replace(/^\S+\s/,'');
}

function cuisineLabel(id=S.selectedCuisine){
  return cuisineEntry(id).label;
}

function recipeMatchesCuisine(r,id=S.selectedCuisine){
  if(id==='tümü'||id==='rastgele')return true;
  const hay=n(`${r?.cuisine||''} ${r?.inspiration||''}`);
  const terms=CUISINE_TERMS[id]||[id];
  return terms.some(term=>hay.includes(n(term)));
}

(function setupCuisineUI(){
  const style=document.createElement('style');
  style.textContent=`
    .cuisine-wrap{margin-top:18px}
    .cuisine-title{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:9px}
    .cuisine-title h3{margin:0}
    .cuisine-scroll{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
    .cuisine-scroll::-webkit-scrollbar{display:none}
    .cuisine-chip{flex:0 0 auto;border:1px solid var(--line);background:rgba(255,255,255,.9);border-radius:999px;padding:10px 13px;font-weight:750;color:var(--ink);white-space:nowrap}
    .cuisine-chip.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 6px 16px rgba(71,112,92,.16)}
    .choice-summary{margin-top:5px;font-size:12px;color:var(--muted)}
    .selection-proof{margin:10px 0 0;padding:10px 12px;border-radius:14px;background:rgba(237,246,239,.9);font-size:13px}
  `;
  document.head.appendChild(style);
  const grid=document.getElementById('typeGrid');
  if(grid&&!document.getElementById('cuisineGrid')){
    const w=document.createElement('div');
    w.className='cuisine-wrap';
    w.innerHTML='<div class="cuisine-title"><h3>Hangi mutfaktan?</h3><span class="mini">yana kaydır →</span></div><div id="cuisineGrid" class="cuisine-scroll"></div><div id="cuisineSummary" class="choice-summary"></div>';
    grid.insertAdjacentElement('afterend',w);
  }
  const v=document.querySelector('.brand>.mini');
  if(v)v.textContent='beta • v0.10.1';
  renderCuisineOptions();
})();

function renderCuisineOptions(){
  const e=document.getElementById('cuisineGrid');
  if(!e)return;
  e.innerHTML='';
  CUISINES.forEach(c=>{
    const b=document.createElement('button');
    b.className='cuisine-chip '+(S.selectedCuisine===c.id?'active':'');
    b.textContent=c.label;
    b.onclick=()=>{
      S.selectedCuisine=c.id;
      save();
      renderCuisineOptions();
      toast(c.id==='tümü'?'Tüm mutfaklar seçildi':c.id==='rastgele'?'Rastgele mutfak seçildi':`${c.label} mutfağı seçildi`);
    };
    e.appendChild(b);
  });
  const sm=document.getElementById('cuisineSummary');
  if(sm)sm.textContent=S.selectedCuisine==='tümü'
    ?'Tüm dünya mutfaklarında ara'
    :S.selectedCuisine==='rastgele'
      ?'Uygun bir mutfağı HandeMade seçsin'
      :`Sadece ${cuisineName()} mutfağında ara`;
}

const baseGo=go;
window.go=function(id){
  baseGo(id);
  if(id==='home')renderCuisineOptions();
};

const baseRenderRecipe=window.renderRecipe;
window.renderRecipe=function(){
  const r=S.lastRecipe;
  if(r&&S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'&&!recipeMatchesCuisine(r,S.selectedCuisine)){
    const e=document.getElementById('recipe');
    e.innerHTML=`<div class="card"><h2>Mutfak filtresi sonucu durdurdu</h2><p>Seçimin <strong>${cuisineLabel()}</strong>, fakat gelen tarif bu mutfakla eşleşmedi. Başka bir tarif iste.</p><button class="primary" onclick="generateRecipe()">Aynı mutfakta yeniden dene</button></div>`;
    return;
  }
  baseRenderRecipe();
  if(!r)return;
  const e=document.getElementById('recipe');
  const badge=e.querySelector('.badge.world,.badge.original');
  if(badge){
    if(r.sourceType==='original'){
      badge.textContent=S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'
        ?`✨ HandeMade • ${cuisineName()} esintili`
        :'✨ HandeMade özgün';
    }else{
      badge.textContent=`🌍 ${r.cuisine||'Dünya'} mutfağı`;
    }
  }
  const firstCard=e.querySelector('.card');
  if(firstCard&&S.selectedCuisine!=='tümü'){
    const proof=document.createElement('div');
    proof.className='selection-proof';
    proof.innerHTML=S.selectedCuisine==='rastgele'
      ?`<strong>🎲 Seçim:</strong> Rastgele mutfak → ${r.cuisine||'HandeMade'}`
      :`<strong>✓ Seçimin:</strong> ${cuisineLabel()} • Sonuç: ${r.sourceType==='original'?'HandeMade özgün':(r.cuisine||cuisineName())}`;
    firstCard.appendChild(proof);
  }
};

window.generateRecipe=async function(){
  go('recipe');
  const target=document.getElementById('recipe');
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${S.selectedCuisine==='tümü'?'Uygun tarif aranıyor':cuisineLabel()+' mutfağında tarif aranıyor'}…</strong><p>Seçtiğin mutfak, alerjenlerin ve sevmediklerin birlikte filtreleniyor.</p></div>`;

  let r=null;
  if(aiAvailable()){
    try{
      const res=await fetch('/api/recipe',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          type:S.selectedType,
          cuisine:S.selectedCuisine,
          allergens:defs().filter(a=>S.allergens.includes(a.id)).map(a=>a.label),
          allergenTerms:terms(),
          dislikes:S.dislikes
        })
      });
      if(res.ok)r=await res.json();
      if(r&&S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'&&!recipeMatchesCuisine(r,S.selectedCuisine)){
        console.warn('Cuisine mismatch blocked',r);
        r=null;
      }
    }catch(e){
      console.warn('AI unavailable',e);
    }
  }

  if(!r){
    const safe=R.filter(x=>(S.selectedType==='sürpriz'||x.type===S.selectedType)&&!unsafeRecipe(x));
    let c=safe;

    if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'){
      c=safe.filter(x=>recipeMatchesCuisine(x,S.selectedCuisine));
    }

    if(S.selectedCuisine==='rastgele'&&safe.length){
      const world=safe.filter(x=>n(x.cuisine)!=='handemade');
      const pool=world.length?world:safe;
      const names=[...new Set(pool.map(x=>n(x.cuisine)).filter(Boolean))];
      if(names.length){
        const pick=names[Math.floor(Math.random()*names.length)];
        c=pool.filter(x=>n(x.cuisine)===pick);
      }
    }

    if(!c.length){
      const msg=S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'
        ?`Bu demo havuzunda ${cuisineLabel()} + seçtiğin kategori + profil filtrelerin için eşleşme yok.`
        :'Bu demo havuzunda seçtiğin kategori ve profil filtrelerin için güvenli eşleşme yok.';
      target.innerHTML=`<div class="card"><h2>Uygun eşleşme bulamadım</h2><p>${msg}</p><button class="secondary" onclick="go('home')">Seçime dön</button></div>`;
      return;
    }

    r=JSON.parse(JSON.stringify(c[Math.floor(Math.random()*c.length)]));
    r.ai=false;
  }else{
    r.ai=true;
  }

  if(unsafeRecipe(r)){
    target.innerHTML='<div class="card"><h2>Tarif güvenlik filtresinde durduruldu</h2><p>Üretilen tarif profilindeki bir yasaklı içerikle çakıştı.</p><button class="primary" onclick="generateRecipe()">Yeniden dene</button></div>';
    return;
  }

  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'&&!recipeMatchesCuisine(r,S.selectedCuisine)){
    target.innerHTML=`<div class="card"><h2>Mutfak filtresi sonucu durdurdu</h2><p>${cuisineLabel()} seçtin ama gelen sonuç başka bir mutfağa ait. Sonuç gösterilmedi.</p><button class="primary" onclick="generateRecipe()">Aynı mutfakta yeniden dene</button></div>`;
    return;
  }

  S.lastRecipe=r;
  save();
  renderRecipe();
};

save();
