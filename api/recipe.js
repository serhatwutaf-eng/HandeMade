module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'POST required'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'OPENAI_API_KEY is not configured'});

  const body=req.body||{};
  const type=String(body.type||'yemek').slice(0,40);
  const cuisine=String(body.cuisine||'tümü').slice(0,60).toLocaleLowerCase('tr-TR');
  const avoidRecipe=String(body.avoidRecipe||'').slice(0,140).trim();
  const allergens=Array.isArray(body.allergens)?body.allergens.slice(0,30).map(String):[];
  const allergenTerms=Array.isArray(body.allergenTerms)?body.allergenTerms.slice(0,100).map(String):[];
  const dislikes=Array.isArray(body.dislikes)?body.dislikes.slice(0,50).map(String):[];
  const forbidden=[...new Set([...allergenTerms,...dislikes].map(x=>x.toLocaleLowerCase('tr-TR').trim()).filter(Boolean))];

  const cuisineRule=cuisine==='tümü'
    ?'Dünya mutfaklarını geniş biçimde araştır. Tek bir popüler tarife saplanma; farklı ülkelerden ve yemek ailelerinden birden çok aday değerlendir.'
    :cuisine==='rastgele'
      ?'Her istekte mümkün olduğunca farklı bir dünya mutfağı seç; seçtiğin mutfağın gerçek yemeklerinden geniş bir aday havuzu araştır.'
      :`Öncelikle ${cuisine} mutfağını web aramasıyla geniş biçimde araştır. Bu mutfakta yalnızca birkaç popüler tarife bakma; farklı bölgelerden ve yemek ailelerinden en az 8 farklı gerçek yemek adayını zihninde değerlendir. Profil filtreleriyle çakışan adayları ele. Güvenli gerçek bir tarif bulabiliyorsan onu seç. Uygun geleneksel seçenek kalmazsa bu mutfaktan esinlenen güvenli bir HandeMade tarifi üret.`;

  const retryRule=avoidRecipe
    ?`Kullanıcı aynı seçimlerle yeniden deniyor. Önceki tarif "${avoidRecipe}" idi. Bu tarifi veya belirgin biçimde aynı tarifin küçük varyasyonunu tekrar verme; aday havuzunda başka yemek ailelerine yönel.`
    :'';

  const instructions=`Sen HandeMade adlı tarif uygulamasının tarif motorusun. Kullanıcıya Türkçe cevap ver.
ÖNCELİK SIRASI: 1) alerjen güvenliği, 2) sevmediği yiyecekleri dışlama, 3) kullanıcının mutfak tercihi, 4) çeşitlilik, 5) lezzet ve uygulanabilirlik.
${cuisineRule}
${retryRule}
Her istekte web_search aracını kullan. Seçilen mutfak için mümkün olduğunda birden çok güvenilir kaynak ve farklı yemek adları üzerinden geniş arama yap. İlk bulduğun uygun tarifi hemen seçme. Önce farklı adayları karşılaştır, yasaklı içeriklerle çakışanları ele, sonra en iyi adayı seç.
Geleneksel bir tarif seçiyorsan kaynak mutfağa sadık kal ama yasaklı içerikleri asla gizleme veya isteğe bağlı olarak bile önerme. Güvenli biçimde uyarlanamıyorsa o yemeği seçme ve başka bir tarif ara.
Yasaklı terimleri tarif adı, malzeme, sos, garnitür, alternatif, hazırlama adımı veya 'isteğe bağlı' öneride KULLANMA. Bir alerjeni ikame ederken de başka yasaklı terim kullanma. Paketli ürünlerde kesin güvenlik iddiasında bulunma.
MALZEME ÖLÇÜLERİ ZORUNLU: ingredients dizisindeki HER satır miktarla başlamalı. Türk ev tipi ölçülerini tercih et: su bardağı, yemek kaşığı, tatlı kaşığı, çay kaşığı, adet, diş, demet, dilim. Gerektiğinde g veya ml kullan. Örnek: "1 su bardağı pirinç", "2 yemek kaşığı zeytinyağı", "1/2 çay kaşığı tuz", "2 orta boy domates". Sadece "pirinç" veya "zeytinyağı" gibi miktarsız satır döndürme. Miktarlar servings alanındaki porsiyon sayısıyla uyumlu olsun.
Hazırlanış kısmı kısa özet olmasın. 5 ila 9 ayrı adım üret. Her adım uygulanabilir ve yeterince ayrıntılı olsun; gerektiğinde yaklaşık dakika, ateş/ısı derecesi, kıvam, renk veya pişme işareti belirt. Adımlarda malzeme listesinde olmayan yeni ana malzeme ekleme.
sourceType yalnızca "world" veya "original" olsun. world ise cuisine gerçek mutfak/bölgeyi, inspiration kısa köken bilgisini anlatsın. original ise cuisine "HandeMade" ve inspiration hangi mutfaktan esinlendiğini anlatsın.`;

  const schema={
    type:'object',
    additionalProperties:false,
    properties:{
      name:{type:'string'},
      cuisine:{type:'string'},
      type:{type:'string'},
      time:{type:'string'},
      servings:{type:'string'},
      sourceType:{type:'string',enum:['world','original']},
      inspiration:{type:'string'},
      ingredients:{type:'array',items:{type:'string'},minItems:3,maxItems:20},
      steps:{type:'array',items:{type:'string'},minItems:5,maxItems:9}
    },
    required:['name','cuisine','type','time','servings','sourceType','inspiration','ingredients','steps']
  };

  try{
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{
        Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model:'gpt-6-luna',
        instructions,
        tools:[{type:'web_search',search_context_size:'medium'}],
        input:`Kategori: ${type}
Mutfak tercihi: ${cuisine}
Alerjenler: ${allergens.join(', ')||'yok'}
Kesinlikle yasaklı terimler: ${forbidden.join(', ')||'yok'}
Sevmedikleri: ${dislikes.join(', ')||'yok'}
Kaçınılacak önceki tarif: ${avoidRecipe||'yok'}
Geniş bir aday havuzu taradıktan sonra bir adet uygulanabilir, miktarları net ve ayrıntılı tarif döndür.`,
        text:{format:{type:'json_schema',name:'handemade_recipe',strict:true,schema}},
        max_output_tokens:2600
      })
    });

    const data=await response.json();
    if(!response.ok)return res.status(response.status).json({error:data?.error?.message||'OpenAI request failed'});

    const text=(data.output||[]).flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text;
    if(!text)return res.status(502).json({error:'No recipe returned'});

    const recipe=JSON.parse(text);
    const haystack=[recipe.name,recipe.cuisine,recipe.inspiration,...(recipe.ingredients||[]),...(recipe.steps||[])].join(' | ').toLocaleLowerCase('tr-TR');
    const hit=forbidden.find(term=>haystack.includes(term));
    if(hit)return res.status(422).json({error:`Safety filter blocked forbidden term: ${hit}`});

    const unmeasured=(recipe.ingredients||[]).find(item=>!/^\s*\d/.test(String(item)));
    if(unmeasured)return res.status(422).json({error:`Ingredient measurement missing: ${unmeasured}`});

    if(avoidRecipe && recipe.name && recipe.name.toLocaleLowerCase('tr-TR').trim()===avoidRecipe.toLocaleLowerCase('tr-TR').trim()){
      return res.status(409).json({error:'Repeated recipe blocked'});
    }

    return res.status(200).json(recipe);
  }catch(err){
    console.error(err);
    return res.status(500).json({error:'Recipe generation failed'});
  }
};
