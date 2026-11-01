const CACHE='math-stars-v4';
const withTimeout=(p,ms)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>
    fetch(u,{cache:'reload'}).then(r=>{if(r.ok)return c.put(u,r)}).catch(()=>{})
  ))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  const url=new URL(r.url);
  if(url.origin===location.origin){
    e.respondWith(caches.open(CACHE).then(async c=>{
      let hit=await c.match(r,{ignoreSearch:true});
      if(!hit&&r.mode==='navigate')hit=await c.match('index.html')||await c.match('./');
      const net=fetch(r).then(res=>{if(res.ok&&res.type==='basic')c.put(r.mode==='navigate'?'index.html':r,res.clone());return res}).catch(()=>null);
      if(hit){e.waitUntil(net);return hit}
      return (await withTimeout(net,8000).catch(()=>null))||new Response('<h1 dir="rtl">ما في نت، افتح التطبيق مرة مع النت أول</h1>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}});
    }));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(r); if(hit)return hit;
      try{const res=await withTimeout(fetch(r),3000);c.put(r,res.clone());return res}catch(_){return new Response('',{status:504})}
    }));
  }
});
