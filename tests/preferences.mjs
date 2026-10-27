import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPreferences, savePreference } from '../src/preferences.js';

test('onboarding and privacy preferences are isolated per user and merged', () => {
  const entries = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: key => entries.get(key) || null, setItem: (key, value) => entries.set(key, value) };
  try {
    assert.deepEqual(readPreferences('user-a'), {});
    assert(savePreference('user-a', 'onboarded', true));
    assert(savePreference('user-a', 'hidden', true));
    assert.deepEqual(readPreferences('user-a'), { onboarded: true, hidden: true });
    assert.deepEqual(readPreferences('user-b'), {});
    assert(savePreference('user-a', 'hidden', false));
    assert.equal(readPreferences('user-a').onboarded, true);
    assert.equal(readPreferences('user-a').hidden, false);
  } finally { globalThis.localStorage = previous; }
});
test('blocked or corrupted browser storage does not break sign-in or the tutorial', () => {
  const previous = globalThis.localStorage;
  try {
    globalThis.localStorage = { getItem: () => '{broken', setItem: () => { throw new Error('quota'); } };
    assert.deepEqual(readPreferences('user-a'), {});
    assert.equal(savePreference('user-a', 'onboarded', true), false);
    globalThis.localStorage = { getItem: () => '[]' };
    assert.deepEqual(readPreferences('user-a'), {});
  } finally { globalThis.localStorage = previous; }
});
