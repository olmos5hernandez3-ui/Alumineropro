import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enqueueOfflineCotizacion,
  flushOfflineCotizacionesQueue,
  isCotizacionPendingSync,
  loadOfflineCotizacionesQueue,
  OFFLINE_COTIZACIONES_QUEUE_KEY,
  type StorageLike,
} from './offlineSyncQueue';
import { formatFirebaseAuthError } from './firebaseAuthHelpers';

function createMemoryStorage(): StorageLike & { dump: () => Record<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    dump: () => Object.fromEntries(map.entries()),
  };
}

test('enqueueOfflineCotizacion persists items and deduplicates by key preserving queuedAt', () => {
  const storage = createMemoryStorage();

  const q1 = enqueueOfflineCotizacion(
    {
      key: 'cotizacion:COT-0001',
      action: 'save_cotizacion',
      cotizacionId: 'cot-1',
      folio: 'COT-0001',
      cliente: 'Juan Pérez',
      total: 12500,
      estado: 'enviada',
      now: 1700000000000,
    },
    storage
  );
  assert.equal(q1.length, 1);
  assert.equal(q1[0].queuedAt, 1700000000000);
  assert.equal(q1[0].estado, 'enviada');

  // Re-enqueue same folio with updated estado
  const q2 = enqueueOfflineCotizacion(
    {
      key: 'cotizacion:COT-0001',
      action: 'update_estado',
      cotizacionId: 'cot-1',
      folio: 'COT-0001',
      estado: 'aprobada',
      now: 1700000060000,
    },
    storage
  );
  assert.equal(q2.length, 1, 'should deduplicate by key');
  assert.equal(q2[0].queuedAt, 1700000000000, 'should preserve initial queuedAt');
  assert.equal(q2[0].updatedAt, 1700000060000);
  assert.equal(q2[0].estado, 'aprobada');
  assert.equal(q2[0].cliente, 'Juan Pérez', 'should preserve previous cliente metadata');

  // Reload from persistent storage
  const reloaded = loadOfflineCotizacionesQueue(storage);
  assert.equal(reloaded.length, 1);
  assert.equal(reloaded[0].folio, 'COT-0001');
  assert.ok(storage.getItem(OFFLINE_COTIZACIONES_QUEUE_KEY));
  assert.equal(isCotizacionPendingSync(reloaded, { folio: 'COT-0001' }), true);
  assert.equal(isCotizacionPendingSync(reloaded, { folio: 'COT-9999' }), false);
});

test('flushOfflineCotizacionesQueue retains items on failure and clears on success', async () => {
  const storage = createMemoryStorage();
  enqueueOfflineCotizacion(
    {
      key: 'cotizacion:COT-0002',
      action: 'save_cotizacion',
      folio: 'COT-0002',
      cliente: 'Obra Norte',
      total: 8400,
    },
    storage
  );

  // Failed attempt (still offline)
  const failRes = await flushOfflineCotizacionesQueue(
    async () => ({ ok: false, offline: true, error: 'Sin conexión' }),
    storage
  );
  assert.equal(failRes.ok, false);
  assert.equal(failRes.flushedCount, 0);
  assert.equal(failRes.remainingCount, 1);
  const afterFail = loadOfflineCotizacionesQueue(storage);
  assert.equal(afterFail.length, 1);
  assert.equal(afterFail[0].attempts, 1);
  assert.equal(afterFail[0].lastError, 'Sin conexión');

  // Successful attempt when back online
  let receivedCount = 0;
  const okRes = await flushOfflineCotizacionesQueue(async (items) => {
    receivedCount = items.length;
    return { ok: true };
  }, storage);
  assert.equal(receivedCount, 1);
  assert.equal(okRes.ok, true);
  assert.equal(okRes.flushedCount, 1);
  assert.equal(okRes.remainingCount, 0);
  assert.equal(loadOfflineCotizacionesQueue(storage).length, 0);
});

test('formatFirebaseAuthError detects popup fallback codes and unauthorized domain clearly', () => {
  const blocked = formatFirebaseAuthError({ code: 'auth/popup-blocked' }, 'alumineropro.pages.dev');
  assert.equal(blocked.shouldFallbackToRedirect, true);
  assert.equal(blocked.isUnauthorizedDomain, false);

  const unsupported = formatFirebaseAuthError(
    { code: 'auth/operation-not-supported-in-this-environment' },
    'alumineropro.pages.dev'
  );
  assert.equal(unsupported.shouldFallbackToRedirect, true);

  const unauth = formatFirebaseAuthError(
    { code: 'auth/unauthorized-domain' },
    'mi-taller.netlify.app'
  );
  assert.equal(unauth.isUnauthorizedDomain, true);
  assert.equal(unauth.shouldFallbackToRedirect, false);
  assert.match(unauth.message, /mi-taller\.netlify\.app/);
  assert.match(unauth.message, /Authorized domains/i);

  const closed = formatFirebaseAuthError({ code: 'auth/popup-closed-by-user' });
  assert.equal(closed.shouldFallbackToRedirect, false);
  assert.equal(closed.isUnauthorizedDomain, false);
  assert.match(closed.message, /ventana de Google/i);
});
