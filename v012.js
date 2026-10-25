const DEMO_AMOUNTS={
  'Zeytinyağlı Ratatouille':['1 orta boy patlıcan','1 orta boy kabak','3 orta boy domates','1 adet kırmızı biber','1 orta boy soğan','2 diş sarımsak','3 yemek kaşığı zeytinyağı','1 çay kaşığı kekik','1/2 çay kaşığı tuz'],
  'Aloo Gobi':['2 orta boy patates','1 küçük karnabahar','2 orta boy domates','1 orta boy soğan','1 tatlı kaşığı rendelenmiş taze zencefil','1 çay kaşığı zerdeçal','1 çay kaşığı kimyon','2 yemek kaşığı zeytinyağı','1/2 çay kaşığı tuz'],
  'Domatesli Pirinç Kasesi':['1 su bardağı pirinç','2 orta boy domates','1 adet kırmızı biber','1 küçük soğan','2 diş sarımsak','2 yemek kaşığı zeytinyağı','1/2 demet maydanoz','1/2 çay kaşığı tuz','1,5 su bardağı su'],
  'Meksika Usulü Pico Kahvaltı Kasesi':['1,5 su bardağı haşlanmış siyah fasulye','2 orta boy domates','1/2 küçük soğan','1 adet avokado','1 adet lime','2 yemek kaşığı doğranmış kişniş','1/2 çay kaşığı tuz'],
  'Akdeniz Nohut Kahvaltısı':['1,5 su bardağı haşlanmış nohut','2 orta boy domates','1 orta boy salatalık','1/2 demet maydanoz','1 adet limonun suyu','2 yemek kaşığı zeytinyağı','1/2 çay kaşığı tuz'],
  'Mango Sticky Rice Esintisi':['3/4 su bardağı yasemin pirinci','1 büyük mango','1 su bardağı hindistan cevizi sütü','2 yemek kaşığı şeker','1/4 çay kaşığı tuz','1 su bardağı su'],
  'Fırın Elma ve Kakao Kırıntısı':['2 orta boy elma','1 yemek kaşığı kakao','1/2 su bardağı yulaf','1 yemek kaşığı hindistan cevizi yağı','1 yemek kaşığı akçaağaç şurubu'],
  'Agua Fresca':['3 su bardağı küp doğranmış karpuz','1 adet lime suyu','1 su bardağı soğuk su','1 su bardağı buz'],
  'Zencefilli Elma Serinliği':['2 orta boy elma','1 tatlı kaşığı rendelenmiş taze zencefil','1/2 adet limonun suyu','1 su bardağı soğuk su','1 su bardağı buz'],
  'Patatas Bravas Esintisi':['4 orta boy patates','2 orta boy domates','2 diş sarımsak','2 yemek kaşığı zeytinyağı','1 çay kaşığı toz biber','1/2 çay kaşığı tuz'],
  'Baharatlı Çıtır Nohut':['2 su bardağı haşlanmış nohut','1,5 yemek kaşığı zeytinyağı','1 çay kaşığı kimyon','1 çay kaşığı toz biber','1/2 çay kaşığı tuz'],
  'İmam Bayıldı':['3 orta boy patlıcan','2 orta boy soğan','3 orta boy domates','4 diş sarımsak','4 yemek kaşığı zeytinyağı','1/2 demet maydanoz','1 çay kaşığı tuz'],
  'Polenta ai Funghi':['1 su bardağı mısır irmiği','300 g mantar','2 diş sarımsak','2 yemek kaşığı zeytinyağı','2 yemek kaşığı doğranmış maydanoz','4 su bardağı su','1 çay kaşığı tuz'],
  'Sebzeli Onigiri':['1 su bardağı Japon pirinci','1/2 küçük salatalık','1/2 küçük havuç','2 yaprak nori','1 yemek kaşığı pirinç sirkesi','1/2 çay kaşığı tuz','1,25 su bardağı su'],
  'Limonlu Fırın Patates':['5 orta boy patates','1 büyük limonun suyu','3 yemek kaşığı zeytinyağı','3 diş sarımsak','1 çay kaşığı kekik','1/2 su bardağı su','1 çay kaşığı tuz'],
  'Mujadara':['1 su bardağı yeşil mercimek','3/4 su bardağı pirinç','2 büyük soğan','3 yemek kaşığı zeytinyağı','1 çay kaşığı kimyon','1 çay kaşığı tuz','3 su bardağı su'],
  'Bibimbap Esintili Sebze Kasesi':['1 su bardağı pirinç','2 su bardağı ıspanak','1 orta boy havuç','1 küçük kabak','200 g mantar','2 diş sarımsak','1 yemek kaşığı pirinç sirkesi','1/2 çay kaşığı tuz','1,5 su bardağı su']
};

function applyDemoAmounts(recipe){
  if(!recipe)return recipe;
  const measured=DEMO_AMOUNTS[recipe.name];
  if(measured)recipe.ingredients=measured.slice();
  return recipe;
}

R.forEach(applyDemoAmounts);
if(S.lastRecipe)applyDemoAmounts(S.lastRecipe);
if(Array.isArray(S.favorites))S.favorites.forEach(applyDemoAmounts);
save();

const v012BaseRenderRecipe=window.renderRecipe;
window.renderRecipe=function(){
  if(S.lastRecipe)applyDemoAmounts(S.lastRecipe);
  v012BaseRenderRecipe();
  const e=document.getElementById('recipe');
  if(!e||!S.lastRecipe)return;
  const ingredientCard=[...e.querySelectorAll('.card')].find(card=>card.querySelector('h3')?.textContent.trim()==='Malzemeler');
  if(ingredientCard&&!ingredientCard.querySelector('.measure-note-v012')){
    const note=document.createElement('div');
    note.className='measure-note-v012';
    note.style.cssText='margin:10px 0 0;font-size:12px;color:var(--muted);line-height:1.5';
    note.textContent='Ölçüler tarifteki porsiyon sayısına göredir. 1 su bardağı ≈ 200 ml, 1 yemek kaşığı ≈ 15 ml, 1 tatlı kaşığı ≈ 10 ml, 1 çay kaşığı ≈ 5 ml.';
    ingredientCard.appendChild(note);
  }
};

const v012Version=document.querySelector('.brand>.mini');
if(v012Version)v012Version.textContent='beta • v0.12';
