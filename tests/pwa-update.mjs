import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const script = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
const stores = new Map([['sakupintar-old', new Map()], ['another-app', new Map()]]);
const handlers = {};
let online = true, failedServer = false, activated = false, claimed = false, fetchOptions;
const caches = {
  async open(key) {
    if (!stores.has(key)) stores.set(key, new Map());
    const store = stores.get(key);
    return {
      async addAll(paths) { for (const path of paths) store.set(path, new Response(path === '/index.html' ? 'CACHED-VERSION' : 'ASSET')); },
      async match(path) { return store.get(path)?.clone(); },
    };
  },
  async keys() { return [...stores.keys()]; },
  async delete(key) { return stores.delete(key); },
};
vm.runInNewContext(script, {
  caches, URL,
  fetch: async (_request, options) => {
    fetchOptions = options;
    if (!online) throw new Error('offline');
    return new Response(failedServer ? 'SERVER ERROR' : 'LATEST-DEPLOYMENT', { status: failedServer ? 503 : 200 });
  },
  self: {
    location: { origin: 'https://example.test' },
    skipWaiting: async () => { activated = true; },
    clients: { claim: async () => { claimed = true; } },
    addEventListener: (name, callback) => { handlers[name] = callback; },
  },
});
let pending;
handlers.install({ waitUntil: promise => { pending = promise; } }); await pending;
assert(activated, 'New worker must activate without waiting for old tabs to close');
handlers.activate({ waitUntil: promise => { pending = promise; } }); await pending;
assert(claimed); assert(!stores.has('sakupintar-old')); assert(stores.has('another-app'));
async function request(path, mode = 'navigate') {
  let result;
  handlers.fetch({ request: { url: `https://example.test${path}`, method: 'GET', mode }, respondWith: response => { result = response; } });
  return result ? await result : undefined;
}
assert.equal(await (await request('/')).text(), 'LATEST-DEPLOYMENT');
assert.equal(fetchOptions.cache, 'no-store');
online = false;
assert.equal(await (await request('/')).text(), 'CACHED-VERSION');
assert.equal(await (await request('/icons/icon-192.png', 'cors')).text(), 'ASSET');
online = true; failedServer = true;
assert.equal(await (await request('/')).text(), 'CACHED-VERSION');
assert.equal(await request('/rest/v1/profiles', 'cors'), undefined, 'Private API requests must not be cached');
console.log('PASS: latest online deployment, immediate activation, offline and server-error fallback, static assets, private API exclusion, scoped cache cleanup');
