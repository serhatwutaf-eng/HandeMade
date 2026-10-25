import json, os, re, unicodedata, random
from pathlib import Path
from datasets import load_dataset

OUT=Path('generated/cuisines')
SHARD_SIZE=250

# Yalnızca başlık/açıklama/kategori/etiket üzerinden sınıflandırılır.
# Malzeme kelimeleri mutfak sınıflandırmasında kullanılmaz.
CUES={
 'italyan': ['italyan','italya','pizza','risotto','lazanya','lasagna','ravioli','gnocchi','tiramisu','panna cotta','focaccia','bruschetta','carbonara','bolognese','arancini'],
 'japon': ['japon','japonya','sushi','ramen','onigiri','tempura','teriyaki','udon','soba','yakitori','okonomiyaki','katsu','mochi'],
 'meksika': ['meksika','meksikalı','taco','burrito','quesadilla','enchilada','guacamole','fajita','nachos','chimichanga'],
 'hint': ['hint mutfağı','hint usulü','hindistan','tikka','masala','biryani','naan','samosa','pakora','vindaloo','korma','paneer','tandoori','dhal','dal makhani'],
 'tay': ['tay mutfağı','tayland','pad thai','tom yum','tom kha','som tam','massaman','panang'],
 'kore': ['kore mutfağı','kore usulü','kore yemeği','kimchi','bibimbap','bulgogi','tteokbokki','japchae','gochujang','kimbap'],
 'fransız': ['fransız','fransa','ratatouille','quiche','kiş lorraine','croissant','kruvasan','creme brulee','crème brûlée','bouillabaisse','coq au vin','souffle','sufle'],
 'ispanyol': ['ispanyol','ispanya','paella','gazpacho','patatas bravas','churros','tapas','tortilla espanola','tortilla española'],
 'yunan': ['yunan','yunanistan','souvlaki','tzatziki','spanakopita','gyros','gyro'],
 'orta doğu': ['orta doğu','levant','lübnan','lübnanlı','filistin','ürdün','suriye','shakshuka','şakşuka','tabbouleh','tabule','falafel'],
 'fas': ['fas mutfağı','fas usulü','marakeş','moroccan','tagine','tajin','harira','pastilla'],
 'çin': ['çin mutfağı','çin usulü','çin yemeği','kung pao','chow mein','wonton','dim sum','mapo tofu','bao bun','pekin ördeği'],
 'vietnam': ['vietnam','pho çorbası','banh mi','bánh mì','bun cha','bún chả','goi cuon','gỏi cuốn'],
 'endonezya': ['endonezya','nasi goreng','mie goreng','rendang','gado gado'],
 'filipin': ['filipin','sinigang','pancit','lumpia','sisig'],
 'peru': ['peru mutfağı','peru usulü','perulu','lomo saltado','aji de gallina','ají de gallina'],
 'brezilya': ['brezilya','brezilyalı','feijoada','brigadeiro','pao de queijo','pão de queijo'],
 'alman': ['alman mutfağı','alman usulü','almanya','schnitzel','şinitzel','sauerbraten','spatzle','spätzle','currywurst'],
 'ingiliz': ['ingiliz mutfağı','ingiliz usulü','britanya','shepherds pie','shepherd’s pie','fish and chips','yorkshire pudding','bangers and mash'],
 'amerikan': ['amerikan mutfağı','amerikan usulü','abd mutfağı','buffalo wings','mac and cheese','new york cheesecake','texas barbecue','texas bbq','new orleans'],
 'portekiz': ['portekiz','portekizli','pastel de nata','bacalhau','caldo verde'],
 'rus': ['rus mutfağı','rus usulü','rusya','stroganoff','borscht','borş','pelmeni','blini','olivier salatası'],
 'karayip': ['karayip','jamaika','jamaican','jerk chicken','jerk tavuk','rice and peas','küba mutfağı','cuban'],
 'batı afrika': ['batı afrika','nijerya','nijeryalı','jollof','egusi','suya','fufu']
}

EXPLICIT={k:[x for x in v if ('mutfağı' in x or 'usulü' in x or x in ['italyan','italya','japon','japonya','meksika','hindistan','tayland','brezilya','portekiz','vietnam','endonezya','filipin','karayip','nijerya','rusya','ispanyol','ispanya','yunan','yunanistan'])] for k,v in CUES.items()}

def norm(s):
    s=str(s or '').lower().replace('’',"'")
    s=unicodedata.normalize('NFKC',s)
    s=re.sub(r'\s+',' ',s)
    return s.strip()

def text_for(row):
    parts=[row.get('title',''),row.get('description',''),row.get('category','')]
    tags=row.get('tags') or []
    if isinstance(tags,list): parts.extend(tags)
    return norm(' | '.join(str(x) for x in parts if x))

def cue_score(text,cuisine):
    score=0
    for cue in CUES[cuisine]:
        c=norm(cue)
        if not c: continue
        if c in text:
            score += 6 if c in EXPLICIT[cuisine] else 3
    return score

def classify(row):
    t=text_for(row)
    scores=[(cue_score(t,c),c) for c in CUES]
    scores.sort(reverse=True)
    top_score, top=scores[0]
    second=scores[1][0] if len(scores)>1 else 0
    # Yanlış mutfak etiketini önlemek için en az bir güçlü sinyal ve anlamlı fark iste.
    if top_score < 3: return None
    if top_score==second and top_score<6: return None
    return top

def clean_row(row):
    return {
      'title': row.get('title'),
      'description': row.get('description'),
      'ingredients': row.get('ingredients') or [],
      'instructions': row.get('instructions') or [],
      'category': row.get('category'),
      'tags': row.get('tags') or [],
      'servings': row.get('servings'),
      'prep_time': row.get('prep_time'),
      'cook_time': row.get('cook_time'),
      'total_time': row.get('total_time'),
    }

def valid(row):
    return bool(str(row.get('title') or '').strip() and len(row.get('ingredients') or [])>=3 and len(row.get('instructions') or [])>=2)

def main():
    if OUT.exists():
        for p in sorted(OUT.rglob('*'), reverse=True):
            if p.is_file(): p.unlink()
            elif p.is_dir(): p.rmdir()
    OUT.mkdir(parents=True,exist_ok=True)

    ds=load_dataset('mmkocak/turkish-recipes-175K')
    buckets={k:[] for k in CUES}
    total=0
    for split in ds:
        for row in ds[split]:
            total+=1
            if not valid(row): continue
            cuisine=classify(row)
            if cuisine: buckets[cuisine].append(clean_row(row))

    random.seed(42)
    world={'source_total':total,'cuisines':{}}
    for cuisine, rows in buckets.items():
        # Aynı başlık + ilk malzeme üzerinden kaba dedup.
        seen=set(); unique=[]
        for r in rows:
            key=(norm(r['title']), norm((r['ingredients'] or [''])[0]))
            if key in seen: continue
            seen.add(key); unique.append(r)
        random.shuffle(unique)
        d=OUT/cuisine
        d.mkdir(parents=True,exist_ok=True)
        shards=[]
        for i in range(0,len(unique),SHARD_SIZE):
            part=unique[i:i+SHARD_SIZE]
            name=f'{i//SHARD_SIZE:03d}.json'
            (d/name).write_text(json.dumps(part,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
            shards.append({'file':name,'count':len(part)})
        manifest={'cuisine':cuisine,'count':len(unique),'shard_size':SHARD_SIZE,'shards':shards}
        (d/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        world['cuisines'][cuisine]={'count':len(unique),'shards':len(shards)}
        print(f'{cuisine}: {len(unique)}')

    (OUT/'manifest.json').write_text(json.dumps(world,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print('source total:',total)

if __name__=='__main__': main()
