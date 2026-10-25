/* HandeMade v0.20 */

window.hmBrowserSearchQuery=function(){
  const parts=[];
  if(S.selectedCuisine!=='tümü'&&S.selectedCuisine!=='rastgele')parts.push(cuisineName()+' mutfağı');
  else if(S.selectedCuisine==='rastgele')parts.push('dünya mutfağı');

  const typeLabel={yemek:'yemek',kahvaltı:'kahvaltı',tatlı:'tatlı',içecek:'içecek',atıştırmalık:'atıştırmalık',sürpriz:'yemek'}[S.selectedType]||'yemek';
  parts.push(typeLabel,'tarifi');

  const summary=document.getElementById('profileSummary');
  const active=summary?[...summary.querySelectorAll('.chip')]
    .map(x=>String(x.textContent||'').replace(/^[⚠🚫]\s*/,'').trim())
    .filter(Boolean):[];
  [...new Set(active)].slice(0,12).forEach(x=>parts.push(x+' içermeyen'));

  parts.push('malzemeler','hazırlanışı');
  return parts.join(' ');
};

const v020Version=document.querySelector('.brand>.mini');
if(v020Version)v020Version.textContent='beta • v0.20';
