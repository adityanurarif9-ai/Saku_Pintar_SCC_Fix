import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

async function collect(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await collect(`${dir}/${entry.name}`, name));
    else if (entry.name !== 'sw.js') result.push(name);
  }
  return result.sort();
}
const files = await collect('dist');
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(`dist${file}`));
const cacheName = `sakupintar-${hash.digest('hex').slice(0, 16)}`;
await writeFile('dist/sw.js', `
const CACHE = ${JSON.stringify(cacheName)};
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('sakupintar-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    // An online visit must receive the current deployment, including new build-time config.
    // The version-matched precache remains the fallback when offline or the server fails.
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (response.ok) return response;
        const fallback = await (await caches.open(CACHE)).match('/index.html');
        return fallback || response;
      } catch (error) {
        const fallback = await (await caches.open(CACHE)).match('/index.html');
        if (fallback) return fallback;
        throw error;
      }
    })());
  } else if (FILES.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname)).then(response => response || fetch(event.request)));
  }
});
`);
console.log(`Offline cache ready: ${files.length} files (${cacheName})`);
