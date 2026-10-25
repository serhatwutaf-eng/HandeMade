const CACHE='handemade-v033';
const ASSETS=[
  './','./index.html','./app.css','./app.js','./cuisine.js',
  './v011.js','./v012.js','./v013.js','./v014.js','./v015.js','./v016.js','./v017.js',
  './engine-v030.js','./engine-v030-tune.js','./source-turkish-v031.js','./v032.js','./v033.js',
  './manifest.webmanifest','./handemade-logo.webp','./handemade-bg.webp','./apple-touch-icon.png'
];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  ]));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);

  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req,{cache:'no-store'})
        .then(r=>{
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put('./index.html',copy));
          return r;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  const freshAsset=url.origin===self.location.origin && /\.(?:js|css|webmanifest)$/.test(url.pathname);
  if(freshAsset){
    e.respondWith(
      fetch(req,{cache:'no-store'})
        .then(r=>{
          const copy=r.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
          return r;
        })
        .catch(()=>caches.match(req))
    );
    return;
  }

  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
