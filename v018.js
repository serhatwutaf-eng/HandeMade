/* HandeMade v0.18 — canlı kaynaklar sonuç vermezse tarayıcı aramasına geç */

function hmBrowserSearchQuery(){
  const parts=[];
  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele'){
    parts.push(cuisineName()+' mutfağı');
  }else if(S.selectedCuisine==='rastgele'){
    parts.push('dünya mutfağı');
  }

  const typeLabel={
    yemek:'yemek',
    kahvaltı:'kahvaltı',
    tatlı:'tatlı',
    içecek:'içecek',
    atıştırmalık:'atıştırmalık',
    sürpriz:'yemek'
  }[S.selectedType]||'yemek';

  parts.push(typeLabel,'tarifi');

  // Sağlık verisi olan alerjenleri arama motoruna göndermiyoruz.
  // Yalnızca kullanıcının sevmediği yiyecekler arama sorgusuna eklenir.
  const dislikes=(Array.isArray(S.dislikes)?S.dislikes:[])
    .map(x=>String(x||'').trim())
    .filter(Boolean)
    .slice(0,6);
  dislikes.forEach(x=>parts.push(x+' içermeyen'));

  parts.push('malzemeler','hazırlanışı');
  return parts.join(' ');
}

function hmOpenBrowserSearch(){
  if(!navigator.onLine){
    const target=document.getElementById('recipe');
    if(target){
      target.innerHTML='<div class="card"><h2>İnternet bağlantısı yok</h2><p>Canlı kaynaklarda tarif bulunamadı ve web araması için internet bağlantısı gerekiyor.</p><button class="secondary" onclick="go(\'home\')">Seçime dön</button></div>';
    }
    return;
  }

  const q=hmBrowserSearchQuery();
  const target=document.getElementById('recipe');
  if(target){
    target.innerHTML='<div class="card loading"><div class="spinner"></div><strong>Web\'de daha geniş aranıyor…</strong><p>Canlı tarif kaynaklarında uygun sonuç bulunamadı. Tarayıcıda daha geniş bir arama açılıyor. Alerjen bilgilerin arama motoruna gönderilmiyor.</p></div>';
  }

  setTimeout(()=>{
    location.href='https://www.google.com/search?q='+encodeURIComponent(q);
  },450);
}

function hmRecipeFailureVisible(){
  const target=document.getElementById('recipe');
  if(!target)return false;
  const text=n(target.textContent||'');
  return [
    'uygun eşleşme bulamadım',
    'bu seçimlerde başka demo tarif kalmadı',
    'tarif güvenlik filtresinde durduruldu',
    'mutfak filtresi sonucu durdurdu',
    'hazırlanış eksik bulundu',
    'tarif türkçe filtresinde durduruldu'
  ].some(x=>text.includes(n(x)));
}

const hmGenerateV018=window.generateRecipe;
window.generateRecipe=async function(retry=false){
  await hmGenerateV018(retry);
  // Ücretsiz canlı kaynak + yerel yedek zinciri sonuç vermezse tarayıcıya geç.
  if(hmRecipeFailureVisible())hmOpenBrowserSearch();
};

const v018Version=document.querySelector('.brand>.mini');
if(v018Version)v018Version.textContent='beta • v0.18';
