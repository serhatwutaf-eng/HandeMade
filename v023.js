/* HandeMade v0.23 — Türk API alanını düzelt, web aramasını kalıcı yap */

// TheMealDB tarif kayıtlarında ülke alanı strArea: "Turkish" olarak geliyor.
HM_AREA_MAP['türk']=['Turkish'];

// Karabiber seçiliyse yalnızca gerçek karabiber ifadelerini engelle.
HM_FORBIDDEN_EN['karabiber']=[
  'black pepper','ground black pepper','black peppercorn','black peppercorns','peppercorn','peppercorns'
];

function hmHasBlackPepperFilter(){
  return forbidden().some(x=>n(x)==='karabiber');
}

function hmIngredientIsPlainPepper(name){
  const x=String(name||'').toLowerCase().replace(/[^a-z\s-]/g,' ').replace(/\s+/g,' ').trim();
  return x==='pepper'||x==='ground pepper'||x==='pepper to taste';
}

// Kaynak yalnızca "Pepper" diyorsa bunu karabiber kabul et; ama red/green/chilli/bell pepper tariflerini eleme.
const hmRemoteUnsafeV023=hmRemoteUnsafe;
hmRemoteUnsafe=function(meal,terms){
  if(hmRemoteUnsafeV023(meal,terms))return true;
  if(hmHasBlackPepperFilter()&&hmMealIngredients(meal).some(x=>hmIngredientIsPlainPepper(x.ingredient)))return true;
  return false;
};

function hmPrepareExternalLink(el,kind){
  if(!el)return false;
  el.href=kind==='nefisyemek'?hmNefisSearchUrl():hmBrowserSearchUrl();
  return true;
}

function hmRefreshHomeSearchLinks(){
  const web=document.getElementById('hmHomeWebSearch');
  const nefis=document.getElementById('hmHomeNefisSearch');
  if(web)web.href=hmBrowserSearchUrl();
  if(nefis)nefis.href=hmNefisSearchUrl();
}

const hmGoV023=window.go;
window.go=function(page){
  const out=hmGoV023(page);
  if(page==='home')setTimeout(hmRefreshHomeSearchLinks,0);
  return out;
};

// Tarif ekranındaki dış arama kartını her render sonrası yeniden güncelle.
const hmRenderV023=window.renderRecipe;
window.renderRecipe=function(){
  hmRenderV023();
  setTimeout(()=>{
    hmEnsureExternalSearchCard();
    const card=document.querySelector('.hm-external-search-v022');
    if(!card)return;
    const links=card.querySelectorAll('a[target="_blank"]');
    if(links[0])links[0].href=hmBrowserSearchUrl();
    if(links[1])links[1].href=hmNefisSearchUrl();
  },0);
};

(function hmV023Ui(){
  HM_AREA_MAP['türk']=['Turkish'];
  const badge=document.getElementById('aiBadge');
  const status=document.getElementById('aiStatus');
  if(badge){badge.className='badge live';badge.textContent='Geniş ücretsiz tarama'}
  if(status)status.textContent='TheMealDB Türk koleksiyonu + açık Türk arşivi + web/Nefis araması';
  const v=document.querySelector('.brand>.mini');
  if(v)v.textContent='beta • v0.23';
  setTimeout(hmRefreshHomeSearchLinks,0);
})();
