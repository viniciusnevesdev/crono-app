/* Cache somente dos recursos do Crono simplificado. */
const CACHE='crono-simples-v3.2.0';
const ASSETS=['./','./index.html','./styles.css?v=3.2.0','./app.js?v=3.2.0','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.jpg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('crono-simples-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  // Versões novas dos scripts e estilos devem ganhar prioridade sobre cópias antigas.
  // Em modo offline, a última versão guardada continua disponível.
  if (/\/(?:app\.js|styles\.css)$/.test(new URL(req.url).pathname)) {
    event.respondWith(fetch(req).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
      return response;
    }).catch(()=>caches.match(req,{ignoreSearch:true})));
    return;
  }
  event.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req)));
});
