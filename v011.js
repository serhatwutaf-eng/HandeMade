function detailedCue(step){
  const s=n(step);
  if(s.includes('fırın')) return 'Fırını önceden ısıt; kenarlar belirgin şekilde renk alıp iç kısım yumuşayana kadar pişme durumunu kontrol et.';
  if(s.includes('sotele')||s.includes('çevir')) return 'Orta ateşte yaklaşık 3-5 dakika çalış; malzemeler yumuşayıp kokusu belirginleşince sonraki adıma geç.';
  if(s.includes('blender')) return 'Yaklaşık 30-45 saniye, karışım belirgin parçalar kalmayacak kadar pürüzsüz olana dek çalıştır.';
  if(s.includes('haşla')) return 'Orta ateşte kontrollü kaynat; malzeme tamamen dağılmadan, çatal kolayca girecek kıvama geldiğinde ocaktan al.';
  if(s.includes('pişir')) return 'Ateşi orta-kısık seviyede tut; kıvamı ve yumuşaklığı birkaç dakikada bir kontrol ederek fazla pişirmemeye dikkat et.';
  if(s.includes('karıştır')) return 'Malzemeler eşit şekilde dağılana ve karışım homojen görünene kadar nazikçe karıştır.';
  if(s.includes('ısıt')) return 'Orta-kısık ateşte birkaç dakika, tamamı eşit biçimde ısınana kadar karıştırarak devam et.';
  if(s.includes('doğra')||s.includes('dilim')) return 'Parçaları birbirine yakın boyda tut; bu, sonraki aşamada daha dengeli sonuç verir.';
  if(s.includes('servis')) return 'Servisten önce 3-5 dakika dinlendir; sıcaklık ve kıvamın dengelenmesine izin ver.';
  return 'Bu aşamada görünüm ve kıvamı takip et; malzemeler dengeli birleştiğinde sonraki adıma geç.';
}

function ensureDetailedSteps(recipe){
  if(!recipe||!Array.isArray(recipe.steps)||recipe.steps.length>=5)return recipe;
  const original=recipe.steps.slice();
  const expanded=[
    `Hazırlığa başlamadan önce tüm malzemeleri tezgâha çıkar. Sebze ve diğer malzemeleri tarifteki sıraya göre hazırla; benzer parçaları yakın boyda tutarak pişmenin dengeli olmasını sağla.`
  ];
  original.forEach(step=>{
    expanded.push(`${step} ${detailedCue(step)}`);
  });
  expanded.push('Son kıvamı kontrol et. Tarif sıcak servis edilecekse 3-5 dakika dinlendir; ardından porsiyonlayıp bekletmeden servis et.');
  recipe.steps=expanded.slice(0,9);
  return recipe;
}

const v011BaseRenderRecipe=window.renderRecipe;
window.renderRecipe=function(){
  if(S.lastRecipe)ensureDetailedSteps(S.lastRecipe);
  v011BaseRenderRecipe();

  const e=document.getElementById('recipe');
  if(!e||!S.lastRecipe)return;

  const ol=e.querySelector('ol');
  if(ol){
    ol.classList.add('detailed-steps-v011');
    ol.querySelectorAll('li').forEach(li=>{
      li.style.marginBottom='12px';
      li.style.lineHeight='1.62';
    });
  }

  const retryButton=[...e.querySelectorAll('button')].find(b=>b.textContent.includes('Başka bir tarif bul'));
  if(retryButton){
    retryButton.textContent='🎲 Şansını tekrar dene';
    retryButton.onclick=()=>window.generateRecipe(true);
    if(!e.querySelector('.retry-note-v011')){
      const note=document.createElement('div');
      note.className='retry-note-v011';
      note.style.cssText='text-align:center;margin:9px 6px 0;font-size:12px;color:var(--muted)';
      note.textContent='Aynı kategori, mutfak ve profil filtreleriyle farklı bir tarif dener.';
      retryButton.insertAdjacentElement('afterend',note);
    }
  }
};

window.generateRecipe=async function(retry=false){
  const previousName=retry&&S.lastRecipe?S.lastRecipe.name:'';
  go('recipe');
  const target=document.getElementById('recipe');
  target.innerHTML=`<div class="card loading"><div class="spinner"></div><strong>${retry?'Şans yeniden deneniyor':(S.selectedCuisine==='tümü'?'Uygun tarif aranıyor':cuisineLabel()+' mutfağında tarif aranıyor')}…</strong><p>${retry?'Aynı seçimler korunuyor ve önceki tarif dışlanıyor.':'Seçtiğin mutfak, alerjenlerin ve sevmediklerin birlikte filtreleniyor.'}</p></div>`;

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
          dislikes:S.dislikes,
          avoidRecipe:previousName
        })
      });
      if(res.ok)r=await res.json();
      if(r&&S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'&&!recipeMatchesCuisine(r,S.selectedCuisine)){
        console.warn('Cuisine mismatch blocked',r);
        r=null;
      }
      if(r&&previousName&&n(r.name)===n(previousName)){
        console.warn('Repeated recipe blocked',r.name);
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

    if(previousName){
      const alternatives=c.filter(x=>n(x.name)!==n(previousName));
      if(alternatives.length){
        c=alternatives;
      }else{
        target.innerHTML=`<div class="card"><h2>Bu seçimlerde başka demo tarif kalmadı</h2><p>Aynı kategori, mutfak ve profil filtrelerini korudum; fakat demo havuzunda <strong>${previousName}</strong> dışında başka eşleşme yok.</p><button class="secondary" onclick="go('home')">Seçime dön</button></div>`;
        return;
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

  ensureDetailedSteps(r);

  if(unsafeRecipe(r)){
    target.innerHTML='<div class="card"><h2>Tarif güvenlik filtresinde durduruldu</h2><p>Üretilen tarif profilindeki bir yasaklı içerikle çakıştı.</p><button class="primary" onclick="generateRecipe(true)">🎲 Şansını tekrar dene</button></div>';
    return;
  }

  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'&&!recipeMatchesCuisine(r,S.selectedCuisine)){
    target.innerHTML=`<div class="card"><h2>Mutfak filtresi sonucu durdurdu</h2><p>${cuisineLabel()} seçtin ama gelen sonuç başka bir mutfağa ait. Sonuç gösterilmedi.</p><button class="primary" onclick="generateRecipe(true)">🎲 Şansını tekrar dene</button></div>`;
    return;
  }

  S.lastRecipe=r;
  save();
  renderRecipe();
};

const v011Version=document.querySelector('.brand>.mini');
if(v011Version)v011Version.textContent='beta • v0.11';
