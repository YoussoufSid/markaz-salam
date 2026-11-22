const C="salam-v81",LIB="salam-libs";
const F=["./","./index.html","./i18n.js","./qr.js","./jsqr.js","./app2.js","./app3.js","./app4.js","./manifest.json","./firebase-config.js","./icon-192.png","./icon-512.png","./building.jpg","./gate.jpg","./xlsx.mini.min.js"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>fetch(u,{cache:"no-store"}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))))});
self.addEventListener("message",e=>{if(e.data==="skip")self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==LIB).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(u.origin===location.origin){ // network first: updates arrive immediately
    e.respondWith(fetch(e.request,{cache:"no-cache"}).then(n=>{if(n.ok){const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp))}return n})
      .catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));return;
  }
  if(u.hostname==="www.gstatic.com"||u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){ // libraries & fonts: cache first
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok||n.type==="opaque"){const cp=n.clone();caches.open(LIB).then(c=>c.put(e.request,cp))}return n})));
  }
  // everything else (database traffic) is not intercepted
});
