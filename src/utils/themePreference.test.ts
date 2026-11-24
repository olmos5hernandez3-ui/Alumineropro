import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KEYS,
  loadTheme,
  resolveAppTheme,
  saveTheme,
  type AppTheme,
} from './storageHelpers';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

test('resolveAppTheme resolves dark, light, and system preferences accurately', () => {
  assert.equal(resolveAppTheme('dark', false), 'dark');
  assert.equal(resolveAppTheme('dark', true), 'dark');
  assert.equal(resolveAppTheme('light', true), 'light');
  assert.equal(resolveAppTheme('light', false), 'light');
  assert.equal(resolveAppTheme('system', true), 'dark');
  assert.equal(resolveAppTheme('system', false), 'light');
});

test('saveTheme and loadTheme persist dark, light, and system in localStorage', () => {
  const storage = createMemoryStorage();
  assert.equal(loadTheme(storage), 'dark', 'defaults to dark when unset');

  const options: AppTheme[] = ['light', 'system', 'dark'];
  for (const pref of options) {
    saveTheme(pref, storage);
    assert.equal(storage.getItem(KEYS.THEME), pref);
    assert.equal(loadTheme(storage), pref);
  }

  storage.setItem(KEYS.THEME, 'invalid-value');
  assert.equal(loadTheme(storage), 'dark', 'falls back safely on invalid value');
});
