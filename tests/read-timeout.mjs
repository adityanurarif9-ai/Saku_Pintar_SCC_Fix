import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readWithTimeout } from '../src/read-timeout.js';

test('a stalled read rejects and aborts the request so the caller can show retry', async () => {
  let signal;
  await assert.rejects(readWithTimeout(next => { signal = next; return new Promise(() => {}); }, 10), { code: 'READ_TIMEOUT' });
  assert.equal(signal.aborted, true);
});

test('reads preserve successful data and original failures', async () => {
  const data = { balance: 100 };
  assert.equal(await readWithTimeout(() => Promise.resolve(data)), data);
  const error = new Error('offline');
  await assert.rejects(readWithTimeout(() => Promise.reject(error)), candidate => candidate === error);
  await assert.rejects(readWithTimeout(() => { throw error; }), candidate => candidate === error);
});

test('an abort-aware read reports a timeout and a late response does not replace it', async () => {
  let finish;
  await assert.rejects(readWithTimeout(signal => new Promise((resolve, reject) => {
    finish = resolve;
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }), 10), { code: 'READ_TIMEOUT' });
  finish('late result');
});
