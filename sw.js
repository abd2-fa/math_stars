const CACHE='math-stars-v1';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const url=new URL(r.url);
  if(url.origin===location.origin){
    // show the saved copy right away, refresh it in the background when online
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await c.match('index.html'):null);
      const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>null);
      return hit||(await net)||new Response('',{status:504});
    }));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(r); if(hit)return hit;
      try{const res=await fetch(r);c.put(r,res.clone());return res}catch(_){return new Response('',{status:504})}
    }));
  }
});
