const CACHE="minjeong-money-recovery1";
const ASSETS=["./","./index.html","./style.css?v=recovery1","./app.js?v=recovery1","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match(e.request))));
