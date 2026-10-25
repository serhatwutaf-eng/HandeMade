/* HandeMade v0.16 — malzemelerde yabancı kelime bırakma */

const HM_ING_PHRASE_TR={
  'extra virgin olive oil':'sızma zeytinyağı',
  'olive oil':'zeytinyağı',
  'vegetable oil':'bitkisel yağ',
  'sunflower oil':'ayçiçek yağı',
  'fresh parsley':'taze maydanoz',
  'fresh coriander':'taze kişniş',
  'fresh cilantro':'taze kişniş',
  'fresh basil':'taze fesleğen',
  'fresh mint':'taze nane',
  'fresh thyme':'taze kekik',
  'fresh rosemary':'taze biberiye',
  'ground black pepper':'öğütülmüş karabiber',
  'black pepper':'karabiber',
  'white pepper':'beyaz biber',
  'sea salt':'deniz tuzu',
  'kosher salt':'tuz',
  'chicken broth':'tavuk suyu',
  'chicken stock':'tavuk suyu',
  'vegetable broth':'sebze suyu',
  'vegetable stock':'sebze suyu',
  'beef broth':'et suyu',
  'beef stock':'et suyu',
  'tomato paste':'domates salçası',
  'tomato puree':'domates püresi',
  'coconut milk':'hindistan cevizi sütü',
  'coconut cream':'hindistan cevizi kreması',
  'brown sugar':'esmer şeker',
  'powdered sugar':'pudra şekeri',
  'icing sugar':'pudra şekeri',
  'all purpose flour':'un',
  'all-purpose flour':'un',
  'plain flour':'un',
  'baking powder':'kabartma tozu',
  'baking soda':'karbonat',
  'soy sauce':'soya sosu',
  'sesame oil':'susam yağı',
  'rice vinegar':'pirinç sirkesi',
  'apple cider vinegar':'elma sirkesi',
  'lemon juice':'limon suyu',
  'lime juice':'lime suyu',
  'orange juice':'portakal suyu',
  'spring onion':'taze soğan',
  'spring onions':'taze soğan',
  'green onion':'taze soğan',
  'green onions':'taze soğan',
  'bell pepper':'dolmalık biber',
  'red pepper':'kırmızı biber',
  'green pepper':'yeşil biber',
  'chili pepper':'acı biber',
  'chilli pepper':'acı biber',
  'sweet potato':'tatlı patates',
  'green beans':'taze fasulye',
  'white beans':'beyaz fasulye',
  'black beans':'siyah fasulye',
  'kidney beans':'kırmızı fasulye',
  'chicken breast':'tavuk göğsü',
  'chicken breasts':'tavuk göğsü',
  'chicken thigh':'tavuk but',
  'chicken thighs':'tavuk but',
  'ground beef':'dana kıyma',
  'minced beef':'dana kıyma',
  'ground lamb':'kuzu kıyma',
  'minced lamb':'kuzu kıyma',
  'basmati rice':'basmati pirinci',
  'jasmine rice':'yasemin pirinci',
  'long grain rice':'uzun taneli pirinç',
  'short grain rice':'kısa taneli pirinç',
  'rice noodles':'pirinç eriştesi',
  'dark chocolate':'bitter çikolata',
  'cocoa powder':'kakao',
  'vanilla extract':'vanilya özütü'
};

const HM_ING_WORD_TR={
  fresh:'taze', dried:'kurutulmuş', dry:'kuru', ground:'öğütülmüş', chopped:'doğranmış', finely:'ince', roughly:'iri', diced:'küp doğranmış', sliced:'dilimlenmiş', grated:'rendelenmiş', shredded:'ince doğranmış', minced:'kıyılmış', crushed:'ezilmiş', peeled:'soyulmuş', seeded:'çekirdekleri çıkarılmış', seedless:'çekirdeksiz', boneless:'kemiksiz', skinless:'derisiz', cooked:'pişmiş', uncooked:'çiğ', canned:'konserve', drained:'suyu süzülmüş', rinsed:'yıkanmış', optional:'isteğe bağlı', divided:'ayrılmış', softened:'yumuşamış', melted:'eritilmiş', frozen:'dondurulmuş', thawed:'çözündürülmüş', warm:'ılık', hot:'sıcak', cold:'soğuk', large:'büyük', medium:'orta boy', small:'küçük', whole:'bütün', half:'yarım', halves:'yarım', quartered:'dörde bölünmüş', thinly:'ince', thickly:'kalın', packed:'sıkıştırılmış', heaped:'tepeleme', level:'silme', pinch:'tutam', handful:'avuç', clove:'diş', cloves:'diş', bunch:'demet', sprig:'dal', sprigs:'dal', slice:'dilim', slices:'dilim', can:'kutu', cans:'kutu', packet:'paket', pack:'paket', cup:'su bardağı', cups:'su bardağı', tablespoon:'yemek kaşığı', tablespoons:'yemek kaşığı', tbsp:'yemek kaşığı', teaspoon:'çay kaşığı', teaspoons:'çay kaşığı', tsp:'çay kaşığı', pound:'g', pounds:'g', ounce:'g', ounces:'g'
};

const HM_TURKISH_SHARED_WORDS=new Set([
  'mango','avokado','lime','brokoli','makarna','spagetti','pizza','kakao','vanilya','basmati','mozzarella','parmesan','feta','tofu','miso','tahin','kimyon','paprika','köri','curry','ramen','nori','wasabi','sushi','tortilla','taco','quinoa','chia'
]);

function hmEscapeRe(x){return String(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}

function hmIngredientPreTranslate(text){
  let s=String(text||'').trim();
  Object.entries(HM_ING_PHRASE_TR).sort((a,b)=>b[0].length-a[0].length).forEach(([en,tr])=>{
    s=s.replace(new RegExp('\\b'+hmEscapeRe(en)+'\\b','gi'),tr);
  });
  Object.entries(HM_ING_WORD_TR).forEach(([en,tr])=>{
    s=s.replace(new RegExp('\\b'+hmEscapeRe(en)+'\\b','gi'),tr);
  });
  return s.replace(/\s+/g,' ').trim();
}

function hmSourceEnglishTokens(text){
  return [...new Set((String(text||'').toLowerCase().match(/[a-z]{3,}/g)||[])
    .filter(x=>!HM_TURKISH_SHARED_WORDS.has(x))
    .filter(x=>!['and','with','for','the','into','from','about','approximately','taste'].includes(x)))];
}

function hmHasForeignResidue(source,translated){
  const out=n(String(translated||''));
  const leftovers=hmSourceEnglishTokens(source).filter(token=>new RegExp('\\b'+hmEscapeRe(token)+'\\b','i').test(out));
  return leftovers.length?leftovers:false;
}

async function hmStrictIngredientLine(source){
  const metric=hmMetricizeEnglish(source);
  const pre=hmIngredientPreTranslate(metric);
  let translated=pre;
  // Satırda hâlâ İngilizce kaynak kelimeler bulunuyorsa çeviri servisine ver.
  if(hmHasForeignResidue(source,pre)){
    translated=await hmTranslateCached(pre);
    if(!translated)return null;
  }
  translated=hmIngredientPreTranslate(hmDecodeHtml(translated));
  translated=hmMeasureTr(translated)
    .replace(/\bto taste\b/gi,'damak tadına göre')
    .replace(/\bas needed\b/gi,'gerektiği kadar')
    .replace(/\s+/g,' ').trim();
  const residue=hmHasForeignResidue(source,translated);
  if(residue){
    console.warn('Yabancı malzeme kelimesi engellendi',residue,source,translated);
    return null;
  }
  return translated;
}

// Textual Chef malzeme satırları tamamen Türkçe değilse tarif reddedilir.
hmTranslateIngredientLine=async function(line){
  return hmStrictIngredientLine(line);
};

// TheMealDB tekil malzeme isimleri de aynı katı filtreden geçer.
hmIngredientTr=async function(name){
  const key=n(name);
  let tr=HM_ING_TR[key]||HM_ING_EXTRA_TR[key]||HM_ING_PHRASE_TR[key]||null;
  if(!tr){
    tr=await hmStrictIngredientLine(name);
  }else{
    tr=hmIngredientPreTranslate(tr);
  }
  if(!tr)return null;
  if(hmHasForeignResidue(name,tr))return null;
  return tr;
};

function hmRecipeIngredientsAreTurkish(recipe){
  if(!recipe||!Array.isArray(recipe.ingredients))return true;
  return recipe.ingredients.every(line=>{
    // Önceden kaydedilmiş canlı tariflerde sık görülen İngilizce sıfat/birimleri de yakala.
    return !/\b(fresh|dried|ground|chopped|diced|sliced|grated|minced|crushed|peeled|boneless|skinless|canned|drained|rinsed|tablespoons?|teaspoons?|cups?|ounces?|pounds?|cloves?|sprigs?|stock|broth)\b/i.test(String(line));
  });
}

const hmRenderV016=window.renderRecipe;
window.renderRecipe=function(){
  const r=S.lastRecipe;
  if(r?.remote&&!hmRecipeIngredientsAreTurkish(r)){
    const target=document.getElementById('recipe');
    if(target){
      target.classList.remove('hidden');
      target.innerHTML='<div class="card"><h2>Tarif Türkçe filtresinde durduruldu</h2><p>Malzeme listesinde yabancı bir ifade kaldığı için bu tarif gösterilmedi.</p><button class="primary" onclick="generateRecipe(true)">Başka tarif bul</button></div>';
    }
    return;
  }
  hmRenderV016();
};

const v016Version=document.querySelector('.brand>.mini');
if(v016Version)v016Version.textContent='beta • v0.16';
