/* HandeMade v0.19 — canlı kaynaklar sonuç vermezse web aramasını yeni sekmede aç */

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
  const dislikes=(Array.isArray(S.dislikes)?S.dislikes:[])
    .map(x=>String(x||'').trim())
    .filter(Boolean)
    .slice(0,6);
  dislikes.forEach(x=>parts.push(x+' içermeyen'));

  parts.push('malzemeler','hazırlanışı');
  return parts.join(' ');
}

function hmBrowserSearchUrl(){
  return 'https://www.google.com/search?q='+encodeURIComponent(hmBrowserSearchQuery());
}

function hmLaunchBrowserSearch(){
  const url=hmBrowserSearchUrl();
  const opened=window.open(url,'_blank','noopener,noreferrer');
  return !!opened;
}

function hmOpenBrowserSearch(){
  if(!navigator.onLine){
    const target=document.getElementById('recipe');
    if(target){
      target.innerHTML='<div class="card"><h2>İnternet bağlantısı yok</h2><p>Canlı kaynaklarda tarif bulunamadı ve web araması için internet bağlantısı gerekiyor.</p><button class="secondary" onclick="go(\'home\')">Seçime dön</button></div>';
    }
    return;
  }

  const target=document.getElementById('recipe');
  if(target){
    target.innerHTML='<div class="card"><h2>Web\'de daha geniş arama</h2><p>Canlı tarif kaynaklarında uygun sonuç bulunamadı. Arama yeni bir tarayıcı sekmesinde açılacak; HandeMade burada açık kalacak. Alerjen bilgilerin arama motoruna gönderilmiyor.</p><button class="primary" id="hmBrowserSearchBtn">🌐 Tarayıcıda ara</button><button class="secondary" style="margin-top:10px" onclick="go(\'home\')">HandeMade\'de kal</button></div>';
    const btn=document.getElementById('hmBrowserSearchBtn');
    if(btn)btn.onclick=()=>hmLaunchBrowserSearch();
  }

  // Masaüstü ve çoğu mobil tarayıcıda otomatik yeni sekme denemesi.
  // iOS PWA bunu engellerse yukarıdaki kullanıcı tıklamalı düğme her zaman hazır kalır.
  setTimeout(()=>hmLaunchBrowserSearch(),250);
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
  if(hmRecipeFailureVisible())hmOpenBrowserSearch();
};

const v018Version=document.querySelector('.brand>.mini');
if(v018Version)v018Version.textContent='beta • v0.19';
