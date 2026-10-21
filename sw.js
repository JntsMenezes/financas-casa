// Guarda a casca do app para abrir rápido e sem internet. Os dados vêm sempre do Supabase.
const CACHE = "financas-v6";
const CASCA = [
  "./", "index.html", "app.js", "config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "fonts/inter-latin-wght.woff2",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Rede primeiro (para pegar atualizações), cache se estiver sem internet.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const ehCasa = url.origin === location.origin || url.hostname === "cdn.jsdelivr.net";
  if (e.request.method !== "GET" || !ehCasa) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
