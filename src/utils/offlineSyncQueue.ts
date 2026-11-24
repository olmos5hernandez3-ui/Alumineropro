export const OFFLINE_COTIZACIONES_QUEUE_KEY = 'aluminero_cotizaciones_sync_queue_v1';
export const OFFLINE_SYNC_QUEUE_EVENT = 'aluminero:sync-queue-updated';

export type OfflineCotizacionAction = 'save_cotizacion' | 'update_estado' | 'save_hoja_draft';

export interface OfflineCotizacionQueueItem {
  /** Stable dedup key (e.g. "cotizacion:COT-0001" or "hoja:draft") */
  key: string;
  action: OfflineCotizacionAction;
  cotizacionId?: string;
  folio?: string;
  cliente?: string;
  total?: number;
  estado?: string;
  queuedAt: number;
  updatedAt: number;
  attempts: number;
  lastAttemptAt?: number | null;
  lastError?: string | null;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return null;
}

function dispatchQueueUpdatedEvent(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_QUEUE_EVENT));
  }
}

export function loadOfflineCotizacionesQueue(
  storage?: StorageLike
): OfflineCotizacionQueueItem[] {
  const store = resolveStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(OFFLINE_COTIZACIONES_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is OfflineCotizacionQueueItem =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as OfflineCotizacionQueueItem).key === 'string' &&
          (item as OfflineCotizacionQueueItem).key.trim().length > 0
      )
      .map((item): OfflineCotizacionQueueItem => ({
        key: item.key.trim(),
        action:
          item.action === 'update_estado' || item.action === 'save_hoja_draft'
            ? item.action
            : 'save_cotizacion',
        cotizacionId: typeof item.cotizacionId === 'string' ? item.cotizacionId : undefined,
        folio: typeof item.folio === 'string' ? item.folio : undefined,
        cliente: typeof item.cliente === 'string' ? item.cliente : undefined,
        total: typeof item.total === 'number' && Number.isFinite(item.total) ? item.total : undefined,
        estado: typeof item.estado === 'string' ? item.estado : undefined,
        queuedAt: typeof item.queuedAt === 'number' && Number.isFinite(item.queuedAt) ? item.queuedAt : Date.now(),
        updatedAt: typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
        attempts: typeof item.attempts === 'number' && item.attempts >= 0 ? Math.floor(item.attempts) : 0,
        lastAttemptAt: typeof item.lastAttemptAt === 'number' ? item.lastAttemptAt : null,
        lastError: typeof item.lastError === 'string' ? item.lastError : null,
      }))
      .slice(0, 150);
  } catch {
    return [];
  }
}

export function saveOfflineCotizacionesQueue(
  queue: OfflineCotizacionQueueItem[],
  storage?: StorageLike
): OfflineCotizacionQueueItem[] {
  const clean = queue.slice(0, 150);
  const store = resolveStorage(storage);
  if (store) {
    try {
      store.setItem(OFFLINE_COTIZACIONES_QUEUE_KEY, JSON.stringify(clean));
    } catch {
      // ignore storage quota errors
    }
  }
  if (!storage) {
    dispatchQueueUpdatedEvent();
  }
  return clean;
}

export function enqueueOfflineCotizacion(
  entry: {
    key: string;
    action: OfflineCotizacionAction;
    cotizacionId?: string;
    folio?: string;
    cliente?: string;
    total?: number;
    estado?: string;
    now?: number;
  },
  storage?: StorageLike
): OfflineCotizacionQueueItem[] {
  const now = typeof entry.now === 'number' ? entry.now : Date.now();
  const normKey = entry.key.trim();
  if (!normKey) return loadOfflineCotizacionesQueue(storage);

  const current = loadOfflineCotizacionesQueue(storage);
  const existingIdx = current.findIndex((item) => item.key === normKey);

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const updated: OfflineCotizacionQueueItem = {
      ...existing,
      action: entry.action,
      cotizacionId: entry.cotizacionId ?? existing.cotizacionId,
      folio: entry.folio ?? existing.folio,
      cliente: entry.cliente ?? existing.cliente,
      total: entry.total ?? existing.total,
      estado: entry.estado ?? existing.estado,
      updatedAt: now,
      lastError: null,
    };
    const next = [...current];
    next[existingIdx] = updated;
    return saveOfflineCotizacionesQueue(next, storage);
  }

  const nextItem: OfflineCotizacionQueueItem = {
    key: normKey,
    action: entry.action,
    cotizacionId: entry.cotizacionId,
    folio: entry.folio,
    cliente: entry.cliente,
    total: entry.total,
    estado: entry.estado,
    queuedAt: now,
    updatedAt: now,
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
  };

  return saveOfflineCotizacionesQueue([nextItem, ...current], storage);
}

export function removeSyncedOfflineQueueKeys(
  keys: string[],
  storage?: StorageLike
): OfflineCotizacionQueueItem[] {
  const removeSet = new Set(keys.map((k) => k.trim()).filter(Boolean));
  const current = loadOfflineCotizacionesQueue(storage);
  if (removeSet.size === 0) return current;
  const next = current.filter((item) => !removeSet.has(item.key));
  return saveOfflineCotizacionesQueue(next, storage);
}

export function markOfflineQueueItemsFailed(
  keys: string[],
  errorMessage: string,
  storage?: StorageLike,
  now = Date.now()
): OfflineCotizacionQueueItem[] {
  const targetSet = new Set(keys.map((k) => k.trim()).filter(Boolean));
  const current = loadOfflineCotizacionesQueue(storage);
  if (targetSet.size === 0) return current;
  const next = current.map((item) =>
    targetSet.has(item.key)
      ? {
          ...item,
          attempts: item.attempts + 1,
          lastAttemptAt: now,
          lastError: errorMessage,
        }
      : item
  );
  return saveOfflineCotizacionesQueue(next, storage);
}

export function isCotizacionPendingSync(
  queue: OfflineCotizacionQueueItem[],
  cotizacion: { id?: string; folio?: string }
): boolean {
  if (queue.length === 0) return false;
  const id = cotizacion.id?.trim();
  const folio = cotizacion.folio?.trim();
  return queue.some(
    (item) =>
      (id && (item.cotizacionId === id || item.key === `cotizacion:${id}`)) ||
      (folio && (item.folio === folio || item.key === `cotizacion:${folio}`))
  );
}

export interface FlushOfflineQueueResult {
  flushedCount: number;
  remainingCount: number;
  ok: boolean;
  offline?: boolean;
  needsAuth?: boolean;
  error?: string;
}

export async function flushOfflineCotizacionesQueue(
  executor: (items: OfflineCotizacionQueueItem[]) => Promise<{
    ok: boolean;
    offline?: boolean;
    needsAuth?: boolean;
    error?: string;
  }>,
  storage?: StorageLike
): Promise<FlushOfflineQueueResult> {
  const pending = loadOfflineCotizacionesQueue(storage);
  if (pending.length === 0) {
    return { flushedCount: 0, remainingCount: 0, ok: true };
  }

  const keys = pending.map((p) => p.key);
  try {
    const res = await executor(pending);
    if (res.ok) {
      const remaining = removeSyncedOfflineQueueKeys(keys, storage);
      return {
        flushedCount: pending.length,
        remainingCount: remaining.length,
        ok: true,
      };
    }

    const errMsg = res.error || (res.offline ? 'Sin conexión' : 'Pendiente de sincronización');
    const remaining = markOfflineQueueItemsFailed(keys, errMsg, storage);
    return {
      flushedCount: 0,
      remainingCount: remaining.length,
      ok: false,
      offline: res.offline,
      needsAuth: res.needsAuth,
      error: errMsg,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Error al sincronizar cotizaciones';
    const remaining = markOfflineQueueItemsFailed(keys, errMsg, storage);
    return {
      flushedCount: 0,
      remainingCount: remaining.length,
      ok: false,
      error: errMsg,
    };
  }
}
