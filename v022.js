/* HandeMade v0.22 — Türk mutfağı aramasını genişlet, karabiber filtresini düzelt, Nefis web kaynağını ekle */

HM_FORBIDDEN_EN['karabiber']=[
  'black pepper',
  'ground black pepper',
  'black peppercorn',
  'black peppercorns',
  'peppercorn',
  'peppercorns'
];

function hmNormalizeEnglishText(x){
  return String(x||'').toLowerCase().replace(/[^a-z0-9çğıöşü\s-]/g,' ').replace(/\s+/g,' ').trim();
}

function hmContainsForbiddenEnglish(text,term){
  const hay=' '+hmNormalizeEnglishText(text)+' ';
  const needle=' '+hmNormalizeEnglishText(term)+' ';
  return hay.includes(needle);
}

hmRemoteUnsafe=function(meal,terms){
  const ingredientTexts=hmMealIngredients(meal).map(x=>x.ingredient);
  const meta=[meal.strMeal,meal.strCategory,meal.strArea];
  return terms.some(term=>{
    if(!term)return false;
    return ingredientTexts.some(x=>hmContainsForbiddenEnglish(x,term)) || meta.some(x=>hmContainsForbiddenEnglish(x,term));
  });
};

HM_AREA_MAP['türk']=['Turkey'];

const hmFindWorldRecipeV021=hmFindWorldRecipe;
hmFindWorldRecipe=async function(previousName=''){
  if(!navigator.onLine)return null;

  if(S.selectedCuisine==='türk'){
    const mealDb=await hmFindMealDbWide(previousName);
    if(mealDb)return mealDb;

    const archive=await hmFindOttomanRecipe(previousName);
    if(archive)return archive;

    // Türkçe mutfakta son ücretsiz kaynak olarak Textual Chef dizinini dene.
    const textual=await hmFindTextualRecipe(previousName);
    if(textual)return textual;
    return null;
  }

  return hmFindWorldRecipeV021(previousName);
};

function hmNefisSearchQuery(){
  return 'site:nefisyemektarifleri.com '+hmBrowserSearchQuery();
}

function hmNefisSearchUrl(){
  return 'https://www.google.com/search?q='+encodeURIComponent(hmNefisSearchQuery());
}

function hmEnsureExternalSearchCard(){
  const target=document.getElementById('recipe');
  if(!target)return;
  if(target.querySelector('.hm-external-search-v022'))return;

  const card=document.createElement('div');
  card.className='card hm-external-search-v022';
  card.innerHTML=`
    <h3>Daha geniş ara</h3>
    <p class="mini">Uygulama içindeki kaynaklar yetersiz kalırsa aynı mutfak ve filtrelerle web'de arayabilirsin.</p>
    <a class="primary" style="display:block;text-align:center;text-decoration:none" href="${hmBrowserSearchUrl()}" target="_blank" rel="noopener noreferrer">🌐 Web'de ara</a>
    <a class="secondary" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="${hmNefisSearchUrl()}" target="_blank" rel="noopener noreferrer">🍲 Nefis Yemek Tarifleri'nde ara</a>
    <div class="warn" style="margin-top:12px"><strong>Not:</strong> Dış web sonuçları HandeMade'in içerik doğrulamasından geçmez. Alerjen ve çapraz bulaşma kontrolünü tarif sayfasında ayrıca yap.</div>
  `;
  target.appendChild(card);
}

const hmRenderV022=window.renderRecipe;
window.renderRecipe=function(){
  hmRenderV022();
  setTimeout(hmEnsureExternalSearchCard,0);
};

hmOpenBrowserSearch=function(){
  const target=document.getElementById('recipe');
  if(!target)return;
  if(!navigator.onLine){
    target.innerHTML='<div class="card"><h2>İnternet bağlantısı yok</h2><p>Web araması için internet bağlantısı gerekiyor.</p><button class="secondary" onclick="go(\'home\')">Seçime dön</button></div>';
    return;
  }
  target.classList.remove('hidden');
  target.innerHTML=`<div class="card"><h2>Uygulama içi kaynaklarda uygun tarif bulunamadı</h2><p>Aynı seçimlerle daha geniş aramaya geçebilirsin.</p><a class="primary" style="display:block;text-align:center;text-decoration:none" href="${hmBrowserSearchUrl()}" target="_blank" rel="noopener noreferrer">🌐 Web'de ara</a><a class="secondary" style="display:block;text-align:center;text-decoration:none;margin-top:10px" href="${hmNefisSearchUrl()}" target="_blank" rel="noopener noreferrer">🍲 Nefis Yemek Tarifleri'nde ara</a><button class="secondary" style="margin-top:10px" onclick="go('home')">HandeMade'de kal</button></div>`;
};

(function hmV022Ui(){
  const badge=document.getElementById('aiBadge');
  const status=document.getElementById('aiStatus');
  if(badge){badge.className='badge live';badge.textContent='Geniş ücretsiz tarama'}
  if(status)status.textContent='TheMealDB + açık Türk arşivi + Nefis web araması';
  const v=document.querySelector('.brand>.mini');
  if(v)v.textContent='beta • v0.22';
})();
