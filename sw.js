// Guarda a casca do app para abrir rápido e sem internet. Os dados vêm sempre do Supabase.
const CACHE = "financas-v42";
const CASCA = [
  "./", "index.html", "app.js", "config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/favicon.svg", "icons/favicon-32.png", "icons/badge-96.png",
  "fonts/manrope-latin-wght.woff2",
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
    // no-cache: confere com o servidor (o GitHub Pages manda guardar por 10 minutos).
    fetch(e.request, url.origin === location.origin ? { cache: "no-cache" } : undefined)
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// Lembretes de contas enviados pela função "lembretes" do Supabase.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Finanças da Casa", {
    body: d.body || "", icon: "icons/icon-192.png", badge: "icons/badge-96.png", tag: "lembrete-contas", renotify: true, data: { url: d.url || "./" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const alvo = e.notification.data?.url || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((abertas) => {
    const aberta = abertas.find((c) => c.url.startsWith(self.registration.scope));
    return aberta ? aberta.focus() : self.clients.openWindow(alvo);
  }));
});
