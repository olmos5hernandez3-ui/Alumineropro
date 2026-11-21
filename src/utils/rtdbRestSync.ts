import {
  computeUsageStats30d,
  isEligibleForCloudBackup,
  isUnassignedAutoTrialDevice,
  normalizeDeviceIdInput,
  validateActivationKey,
  verifyAdminPassword,
  verifyRecoveryPin,
  type CloudDeviceRecord,
} from './alumineroLogic';
import type {
  AdminKeyRecord,
  CloudAccountBackupPayload,
  LicenciaState,
} from './storageHelpers';
import type {
  ActivateKeyCloudResult,
  CloudAccountAuthResult,
  CloudAccountBackupResult,
  CloudSyncSnapshot,
  DeviceStatusVerifyResult,
} from './cloudSync';

type RtdbMethod = 'GET' | 'PUT' | 'PATCH' | 'DELETE';

function normalizeBaseUrl(rawUrl: string): string {
  return String(rawUrl || '')
    .trim()
    .replace(/\/+$/, '');
}

function toSafeKey(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  if (cleaned.length >= 3) return cleaned;
  return `ID-${cleaned || 'DEV'}`.slice(0, 64);
}

function toSafeRecordKey(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  if (cleaned.length >= 3) return cleaned;
  return `ak-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function detectLabel(): string {
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'Teléfono Android';
  if (/iphone/i.test(ua)) return 'iPhone (iOS)';
  if (/ipad/i.test(ua)) return 'iPad';
  if (/windows/i.test(ua)) return 'PC Windows';
  if (/macintosh|mac os/i.test(ua)) return 'Mac';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Navegador Web';
}

function randomHex(byteLen = 16): string {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const arr = new Uint8Array(byteLen);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let out = '';
  for (let i = 0; i < byteLen * 2; i++) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

async function sha256Hex(text: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle !== 'undefined') {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x85ebca6b;
  let h4 = 0xc2b2ae35;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b) >>> 0;
    h3 = Math.imul(h3 ^ (ch * 31), 0xc2b2ae35) >>> 0;
    h4 = Math.imul(h4 ^ (ch ^ (i << 3)), 0x27d4eb2f) >>> 0;
  }
  return (
    h1.toString(16).padStart(8, '0') +
    h2.toString(16).padStart(8, '0') +
    h3.toString(16).padStart(8, '0') +
    h4.toString(16).padStart(8, '0') +
    (h1 ^ h3).toString(16).padStart(8, '0') +
    (h2 ^ h4).toString(16).padStart(8, '0') +
    (h1 ^ h4).toString(16).padStart(8, '0') +
    (h2 ^ h3).toString(16).padStart(8, '0')
  );
}

async function rtdbFetch<T>(
  baseUrl: string,
  path: string,
  method: RtdbMethod,
  body?: unknown
): Promise<T | null> {
  const cleanBase = normalizeBaseUrl(baseUrl);
  if (!cleanBase) return null;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${cleanBase}${cleanPath}.json`;

  const init: RequestInit = {
    method,
    cache: 'no-store',
  };
  if (body !== undefined && (method === 'PUT' || method === 'PATCH')) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`RTDB ${method} ${cleanPath}.json -> HTTP ${res.status}`);
  }
  if (method === 'DELETE') return null;
  const text = await res.text();
  if (!text || text === 'null') return null;
  return JSON.parse(text) as T;
}

function objectValues<T>(mapObj: Record<string, T> | null | undefined): T[] {
  if (!mapObj || typeof mapObj !== 'object') return [];
  return Object.values(mapObj).filter((v): v is T => Boolean(v && typeof v === 'object'));
}

function buildSnapshotFromRtdb(params: {
  devicesMap: Record<string, CloudDeviceRecord> | null;
  clavesMap: Record<string, AdminKeyRecord> | null;
  revocadasMap: Record<string, { key?: string }> | null;
  bloqueadosMap: Record<string, { deviceId?: string }> | null;
  now?: number;
  device?: CloudDeviceRecord | null;
}): CloudSyncSnapshot {
  const now = params.now ?? Date.now();
  const rawDevices = objectValues(params.devicesMap);
  const rawAdminKeys = objectValues(params.clavesMap);

  const revokedSet = new Set<string>();
  if (params.revocadasMap && typeof params.revocadasMap === 'object') {
    for (const [kId, val] of Object.entries(params.revocadasMap)) {
      const code = String(val?.key || kId || '').trim().toUpperCase();
      if (code) revokedSet.add(code);
    }
  }
  for (const k of rawAdminKeys) {
    if (k.revoked && k.key) {
      revokedSet.add(String(k.key).trim().toUpperCase());
    }
  }

  const blockedSet = new Set<string>();
  if (params.bloqueadosMap && typeof params.bloqueadosMap === 'object') {
    for (const [bId, val] of Object.entries(params.bloqueadosMap)) {
      const id = toSafeKey(String(val?.deviceId || bId || ''));
      if (id) blockedSet.add(id);
    }
  }

  const devicesById = new Map<string, CloudDeviceRecord>();
  for (const d of rawDevices) {
    if (!d || !d.deviceId) continue;
    const normId = toSafeKey(normalizeDeviceIdInput(d.deviceId));
    const isBlocked = Boolean(d.blocked || d.planCode === 'BLOCKED' || blockedSet.has(normId));
    const unassignedTrial = !isBlocked && !d.revoked && isUnassignedAutoTrialDevice(d);
    const expired = Boolean(d.proActive && d.expiresAt !== null && d.expiresAt !== undefined && d.expiresAt <= now);
    const lastKeyUpper = String(d.lastKey || '').trim().toUpperCase();
    const isRevoked = Boolean(
      d.revoked || d.planCode === 'REVOKED' || (lastKeyUpper && revokedSet.has(lastKeyUpper))
    );
    const isNonPro =
      isBlocked ||
      unassignedTrial ||
      isRevoked ||
      d.planCode === 'FREE' ||
      d.planCode === 'REVOKED' ||
      d.planCode === 'BLOCKED' ||
      d.planCode === 'SESSION_MOVED';

    const effectivePro = isNonPro || expired ? false : Boolean(d.proActive);
    devicesById.set(normId, {
      ...d,
      deviceId: normId,
      blocked: isBlocked,
      revoked: isBlocked || isRevoked,
      status: isBlocked ? 'blocked' : effectivePro ? 'pro' : 'free',
      ...(isBlocked
        ? { planCode: 'BLOCKED', planLabel: 'Bloqueado', expiresAt: null }
        : isRevoked && d.planCode !== 'FREE' && d.planCode !== 'REVOKED'
          ? {
              planCode: 'FREE',
              planLabel: 'Versión Gratuita',
              expiresAt: null,
              trialActive: false,
              adminAssigned: false,
            }
          : unassignedTrial
            ? {
                planCode: 'FREE',
                planLabel: 'Versión Gratuita',
                expiresAt: null,
                trialActive: false,
                adminAssigned: false,
              }
            : {}),
      proActive: effectivePro,
    });
  }

  const devices = Array.from(devicesById.values()).sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  const adminKeys = rawAdminKeys
    .filter((k) => k && k.deviceId)
    .map((k) => {
      const normDev = toSafeKey(normalizeDeviceIdInput(k.deviceId));
      const devRec = devicesById.get(normDev);
      const nk = String(k.key || '').trim().toUpperCase();
      return {
        ...k,
        deviceId: normDev,
        revoked: Boolean(k.revoked || (nk && revokedSet.has(nk))),
        ...(devRec?.linkedEmail && !k.linkedEmail ? { linkedEmail: devRec.linkedEmail } : {}),
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 100);

  return {
    devices,
    adminKeys,
    revokedKeys: Array.from(revokedSet),
    stats: computeUsageStats30d(devices, now),
    serverTime: now,
    ...(params.device !== undefined ? { device: params.device } : {}),
  };
}

export async function fetchRtdbSnapshot(
  baseUrl: string,
  now = Date.now(),
  device?: CloudDeviceRecord | null
): Promise<CloudSyncSnapshot | null> {
  try {
    const [devicesMap, clavesMap, revocadasMap, bloqueadosMap] = await Promise.all([
      rtdbFetch<Record<string, CloudDeviceRecord>>(baseUrl, '/dispositivos', 'GET'),
      rtdbFetch<Record<string, AdminKeyRecord>>(baseUrl, '/claves', 'GET'),
      rtdbFetch<Record<string, { key?: string }>>(baseUrl, '/claves_revocadas', 'GET'),
      rtdbFetch<Record<string, { deviceId?: string }>>(baseUrl, '/bloqueados', 'GET'),
    ]);
    return buildSnapshotFromRtdb({
      devicesMap,
      clavesMap,
      revocadasMap,
      bloqueadosMap,
      now,
      device,
    });
  } catch {
    return null;
  }
}

export async function syncDeviceRtdb(
  baseUrl: string,
  params: {
    deviceId: string;
    cliente?: string;
    deviceLabel?: string;
    eventType?: 'open' | 'heartbeat' | 'license_sync';
    minutesDelta?: number;
    trialActive?: boolean;
    trialExpiresAt?: number | null;
    licencia?: LicenciaState | null;
  }
): Promise<CloudSyncSnapshot | null> {
  const normId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  if (!normId) return null;
  try {
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const eventType = params.eventType || 'open';

    const existing = await rtdbFetch<CloudDeviceRecord>(baseUrl, `/dispositivos/${normId}`, 'GET');
    const blockedDoc = await rtdbFetch<{ deviceId: string; blockedAt: number }>(
      baseUrl,
      `/bloqueados/${normId}`,
      'GET'
    );
    const cleanLicKey = String(params.licencia?.activatedKey || '').trim().toUpperCase();
    const safeLicKey = cleanLicKey ? toSafeKey(cleanLicKey) : '';
    const revokedKeyDoc = safeLicKey
      ? await rtdbFetch<{ key: string; revokedAt: number }>(baseUrl, `/claves_revocadas/${safeLicKey}`, 'GET')
      : null;

    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    activeDaysSet.add(today);
    const activeDays = Array.from(activeDaysSet).sort().slice(-60);
    const minsDelta = Math.max(0, Math.min(15, Number(params.minutesDelta ?? (eventType === 'open' ? 1 : 0)) || 0));
    const sessionsDelta = eventType === 'open' ? 1 : 0;

    let proActive = existing?.proActive ?? false;
    let planCode = existing?.planCode ?? 'FREE';
    let planLabel = existing?.planLabel ?? 'Versión Gratuita';
    let expiresAt: number | null = existing?.expiresAt ?? null;
    let updatedAt = existing?.updatedAt ?? now;
    let revoked = Boolean(existing?.revoked || existing?.planCode === 'REVOKED');
    let revokedAt: number | null = existing?.revokedAt ?? null;
    const blocked = Boolean(existing?.blocked || existing?.planCode === 'BLOCKED' || blockedDoc);
    let blockedAt: number | null = existing?.blockedAt ?? blockedDoc?.blockedAt ?? null;
    let trialActive = Boolean(existing?.trialActive);
    let adminAssigned = Boolean(existing?.adminAssigned);
    let lastKey = existing?.lastKey || '';

    const submittedKeyRevoked = Boolean(revokedKeyDoc);
    const hasValidNonRevokedKey = Boolean(
      cleanLicKey && !submittedKeyRevoked && validateActivationKey(normId, cleanLicKey).ok
    );
    const clientActivatedAt = Number(params.licencia?.activatedAt || 0);
    const deviceLockedByRevocation =
      revoked && (submittedKeyRevoked || !cleanLicKey || (revokedAt ?? updatedAt) >= clientActivatedAt);

    if (blocked) {
      proActive = false;
      planCode = 'BLOCKED';
      planLabel = 'Bloqueado';
      expiresAt = null;
      revoked = true;
      revokedAt = revokedAt ?? now;
      blockedAt = blockedAt ?? now;
      trialActive = false;
      adminAssigned = false;
    } else if (submittedKeyRevoked || deviceLockedByRevocation) {
      proActive = false;
      planCode = 'FREE';
      planLabel = 'Versión Gratuita';
      expiresAt = null;
      revoked = true;
      revokedAt = revokedAt ?? now;
      trialActive = false;
      adminAssigned = false;
      if (cleanLicKey && !lastKey) lastKey = cleanLicKey;
    } else if (eventType === 'license_sync') {
      if (params.licencia?.active && (hasValidNonRevokedKey || adminAssigned)) {
        proActive = params.licencia.expiresAt === null || params.licencia.expiresAt === undefined || params.licencia.expiresAt > now;
        planCode = String(params.licencia.planCode || 'M');
        planLabel = String(params.licencia.planLabel || 'PRO');
        expiresAt = params.licencia.expiresAt ?? null;
        revoked = false;
        revokedAt = null;
        trialActive = planCode === 'G';
        if (cleanLicKey) lastKey = cleanLicKey;
      } else {
        proActive = false;
        planCode = 'FREE';
        planLabel = 'Versión Gratuita';
        expiresAt = null;
        trialActive = false;
        adminAssigned = false;
      }
      updatedAt = now;
    } else if (!existing) {
      proActive = false;
      planCode = 'FREE';
      planLabel = 'Versión Gratuita';
      expiresAt = null;
      updatedAt = now;
      revoked = false;
      revokedAt = null;
      trialActive = false;
      adminAssigned = false;
    } else if (isUnassignedAutoTrialDevice({ lastKey, adminAssigned, trialActive, planCode, proActive })) {
      proActive = false;
      planCode = 'FREE';
      planLabel = 'Versión Gratuita';
      expiresAt = null;
      trialActive = false;
      adminAssigned = false;
    }

    if (proActive && expiresAt !== null && expiresAt <= now) {
      proActive = false;
    }

    const nextRecord: CloudDeviceRecord = {
      deviceId: normId,
      cliente: typeof params.cliente === 'string' && params.cliente.trim() ? params.cliente.trim().slice(0, 120) : existing?.cliente || '',
      deviceLabel: typeof params.deviceLabel === 'string' && params.deviceLabel.trim() ? params.deviceLabel.trim().slice(0, 80) : existing?.deviceLabel || 'Navegador Web',
      firstSeenAt: existing?.firstSeenAt ?? now,
      lastSeenAt: now,
      totalSessions: (existing?.totalSessions ?? 0) + sessionsDelta,
      totalMinutes: (existing?.totalMinutes ?? 0) + minsDelta,
      activeDays,
      proActive,
      planCode,
      planLabel,
      status: blocked ? 'blocked' : proActive && !revoked && planCode !== 'FREE' ? 'pro' : 'free',
      expiresAt,
      lastKey,
      updatedAt,
      revoked,
      revokedAt,
      blocked,
      blockedAt,
      trialActive,
      adminAssigned,
      ...(existing?.linkedEmail ? { linkedEmail: existing.linkedEmail } : {}),
    };

    await rtdbFetch(
      baseUrl,
      `/dispositivos/${normId}`,
      existing ? 'PATCH' : 'PUT',
      nextRecord
    );
    return await fetchRtdbSnapshot(baseUrl, now, nextRecord);
  } catch {
    return null;
  }
}

export async function verifyDeviceRtdb(
  baseUrl: string,
  params: { deviceId: string; activatedKey?: string }
): Promise<DeviceStatusVerifyResult> {
  const normId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  if (!normId) return { ok: false, offline: true };
  try {
    const now = Date.now();
    const cleanKey = String(params.activatedKey || '').trim().toUpperCase();
    const safeKey = cleanKey ? toSafeKey(cleanKey) : '';

    const [existing, blockedDoc, revokedKeyDoc] = await Promise.all([
      rtdbFetch<CloudDeviceRecord>(baseUrl, `/dispositivos/${normId}`, 'GET'),
      rtdbFetch<{ deviceId: string; blockedAt: number }>(baseUrl, `/bloqueados/${normId}`, 'GET'),
      safeKey ? rtdbFetch<{ key: string }>(baseUrl, `/claves_revocadas/${safeKey}`, 'GET') : Promise.resolve(null),
    ]);

    const existsInCloud = Boolean(existing);
    const keyRevoked = Boolean(revokedKeyDoc);
    const isBlocked = Boolean(existing?.blocked || existing?.planCode === 'BLOCKED' || blockedDoc);
    const deviceRevoked = Boolean(existing?.revoked || existing?.planCode === 'REVOKED');
    const sessionMoved = existing?.planCode === 'SESSION_MOVED';
    const expired = Boolean(existing && existing.expiresAt !== null && existing.expiresAt !== undefined && existing.expiresAt <= now);

    const hasValidAssignment = Boolean(
      existing && (String(existing.lastKey || '').trim() || existing.adminAssigned)
    );
    const effectivePro = Boolean(
      existing &&
        hasValidAssignment &&
        !isBlocked &&
        !keyRevoked &&
        !deviceRevoked &&
        !sessionMoved &&
        !expired &&
        existing.planCode !== 'FREE' &&
        existing.proActive
    );

    const snapshot = await fetchRtdbSnapshot(baseUrl, now, existing);
    return {
      ok: true,
      existsInCloud,
      hasValidAssignment,
      adminAssigned: Boolean(existing?.adminAssigned),
      blocked: isBlocked,
      revoked: keyRevoked || deviceRevoked || isBlocked,
      keyRevoked,
      expired,
      sessionMoved,
      proActive: effectivePro,
      planCode: isBlocked ? 'BLOCKED' : existing?.planCode || 'FREE',
      planLabel: isBlocked ? 'Bloqueado' : existing?.planLabel || 'Versión Gratuita',
      expiresAt: isBlocked ? null : existing?.expiresAt ?? null,
      device: existing,
      devices: snapshot?.devices || [],
      adminKeys: snapshot?.adminKeys || [],
      revokedKeys: snapshot?.revokedKeys || [],
      stats: snapshot?.stats,
      serverTime: now,
    };
  } catch {
    return { ok: false, offline: true };
  }
}

export async function activateKeyRtdb(
  baseUrl: string,
  params: {
    deviceId: string;
    key: string;
    planCode: string;
    planLabel: string;
    expiresAt: number | null;
    cliente?: string;
    deviceLabel?: string;
    linkedEmail?: string;
  }
): Promise<ActivateKeyCloudResult> {
  const normId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  const cleanKey = String(params.key || '').trim().toUpperCase();
  if (!normId || !cleanKey) return { ok: false, error: 'Clave o ID de equipo inválido.' };

  try {
    const safeKey = toSafeKey(cleanKey);
    const revokedDoc = await rtdbFetch<{ key: string }>(baseUrl, `/claves_revocadas/${safeKey}`, 'GET');
    if (revokedDoc) {
      return { ok: false, revoked: true, error: 'Este código de activación fue revocado por el administrador y ya no puede utilizarse.' };
    }
    const keyNode = await rtdbFetch<AdminKeyRecord>(baseUrl, `/claves/${safeKey}`, 'GET');
    if (keyNode?.revoked) {
      return { ok: false, revoked: true, error: 'Este código de activación fue revocado por el administrador y ya no puede utilizarse.' };
    }

    const keyValidation = validateActivationKey(normId, cleanKey);
    if (!keyValidation.ok) {
      return { ok: false, error: keyValidation.error || 'La clave no corresponde a este ID de equipo.' };
    }

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const existing = await rtdbFetch<CloudDeviceRecord>(baseUrl, `/dispositivos/${normId}`, 'GET');
    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    activeDaysSet.add(today);

    const planCode = String(params.planCode || 'M');
    const expiresAt = params.expiresAt ?? null;
    const valid = expiresAt === null || expiresAt > now;

    const nextDevice: CloudDeviceRecord = {
      deviceId: normId,
      cliente: typeof params.cliente === 'string' && params.cliente.trim() ? params.cliente.trim() : existing?.cliente || '',
      deviceLabel: typeof params.deviceLabel === 'string' && params.deviceLabel.trim() ? params.deviceLabel.trim() : existing?.deviceLabel || 'Navegador Web',
      firstSeenAt: existing?.firstSeenAt ?? now,
      lastSeenAt: now,
      totalSessions: existing?.totalSessions ?? 1,
      totalMinutes: existing?.totalMinutes ?? 1,
      activeDays: Array.from(activeDaysSet).sort().slice(-60),
      proActive: valid,
      planCode,
      planLabel: String(params.planLabel || 'PRO'),
      expiresAt,
      lastKey: cleanKey,
      updatedAt: now,
      revoked: false,
      revokedAt: null,
      blocked: false,
      blockedAt: null,
      trialActive: planCode === 'G',
      adminAssigned: Boolean(existing?.adminAssigned),
      ...(params.linkedEmail?.trim() || existing?.linkedEmail
        ? {
            linkedEmail: String(params.linkedEmail || existing?.linkedEmail || '')
              .trim()
              .toLowerCase()
              .slice(0, 160),
          }
        : {}),
    };

    await rtdbFetch(baseUrl, `/dispositivos/${normId}`, existing ? 'PATCH' : 'PUT', nextDevice);
    if (nextDevice.linkedEmail && keyNode) {
      await rtdbFetch(baseUrl, `/claves/${safeKey}`, 'PATCH', {
        linkedEmail: nextDevice.linkedEmail,
      }).catch(() => {});
    }
    const snapshot = await fetchRtdbSnapshot(baseUrl, now, nextDevice);
    return {
      ok: true,
      device: nextDevice,
      devices: snapshot?.devices || [],
      adminKeys: snapshot?.adminKeys || [],
      revokedKeys: snapshot?.revokedKeys || [],
      stats: snapshot?.stats,
      serverTime: now,
    };
  } catch {
    return { ok: false, offline: true };
  }
}

export async function updateDeviceLicenseRtdb(
  baseUrl: string,
  params: {
    deviceId: string;
    cliente?: string;
    planCode?: string;
    planLabel?: string;
    expiresAt?: number | null;
    key?: string;
    dias?: number | null;
    revoke?: boolean;
    block?: boolean;
    recordKeyOnly?: boolean;
  }
): Promise<CloudSyncSnapshot | null> {
  const normId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  if (!normId) return null;

  try {
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const existing = await rtdbFetch<CloudDeviceRecord>(baseUrl, `/dispositivos/${normId}`, 'GET');
    const clavesMap = await rtdbFetch<Record<string, AdminKeyRecord>>(baseUrl, '/claves', 'GET');
    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    if (!existing) activeDaysSet.add(today);

    const clienteClean =
      typeof params.cliente === 'string' && params.cliente.trim()
        ? params.cliente.trim().slice(0, 120)
        : existing?.cliente || 'Cliente sin nombre';

    const isBlock = Boolean(params.block);
    const isRevoke = Boolean(params.revoke);
    const bodyKeyClean = params.key ? String(params.key).trim().toUpperCase().slice(0, 40) : '';

    if (isBlock || isRevoke) {
      const keysToRevoke = new Set<string>();
      if (bodyKeyClean) keysToRevoke.add(bodyKeyClean);
      if (existing?.lastKey) keysToRevoke.add(existing.lastKey.trim().toUpperCase());

      if (clavesMap) {
        for (const [nodeKey, kRec] of Object.entries(clavesMap)) {
          if (!kRec) continue;
          const recDevId = toSafeKey(normalizeDeviceIdInput(kRec.deviceId));
          const recKeyUpper = String(kRec.key || '').trim().toUpperCase();
          if (recDevId === normId || (bodyKeyClean && recKeyUpper === bodyKeyClean)) {
            if (recKeyUpper) keysToRevoke.add(recKeyUpper);
            await rtdbFetch(baseUrl, `/claves/${nodeKey}`, 'PATCH', {
              revoked: true,
              revokedAt: now,
            });
          }
        }
      }

      for (const rk of keysToRevoke) {
        if (!rk) continue;
        const safeKeyId = toSafeKey(rk);
        await rtdbFetch(baseUrl, `/claves_revocadas/${safeKeyId}`, 'PUT', {
          key: safeKeyId,
          deviceId: normId,
          revokedAt: now,
        });
      }

      if (isBlock) {
        await rtdbFetch(baseUrl, `/bloqueados/${normId}`, 'PUT', {
          deviceId: normId,
          blockedAt: now,
        });
        const blockedDev: CloudDeviceRecord = {
          deviceId: normId,
          cliente: clienteClean === 'Cliente sin nombre' && existing?.cliente ? existing.cliente : clienteClean,
          deviceLabel: existing?.deviceLabel || 'Equipo Remoto',
          firstSeenAt: existing?.firstSeenAt ?? now,
          lastSeenAt: existing?.lastSeenAt ?? now,
          totalSessions: existing?.totalSessions ?? 0,
          totalMinutes: existing?.totalMinutes ?? 0,
          activeDays: Array.from(activeDaysSet).sort().slice(-60),
          proActive: false,
          planCode: 'BLOCKED',
          planLabel: 'Bloqueado',
          status: 'blocked',
          expiresAt: null,
          lastKey: bodyKeyClean || existing?.lastKey || '',
          updatedAt: now,
          revoked: true,
          revokedAt: now,
          blocked: true,
          blockedAt: now,
          trialActive: false,
          adminAssigned: false,
          ...(existing?.linkedEmail ? { linkedEmail: existing.linkedEmail } : {}),
        };
        await rtdbFetch(baseUrl, `/dispositivos/${normId}`, existing ? 'PATCH' : 'PUT', blockedDev);
        return await fetchRtdbSnapshot(baseUrl, now, blockedDev);
      } else {
        await rtdbFetch(baseUrl, `/bloqueados/${normId}`, 'DELETE');
        const revokedDev: CloudDeviceRecord = {
          deviceId: normId,
          cliente: clienteClean === 'Cliente sin nombre' && existing?.cliente ? existing.cliente : clienteClean,
          deviceLabel: existing?.deviceLabel || 'Equipo Remoto',
          firstSeenAt: existing?.firstSeenAt ?? now,
          lastSeenAt: existing?.lastSeenAt ?? now,
          totalSessions: existing?.totalSessions ?? 0,
          totalMinutes: existing?.totalMinutes ?? 0,
          activeDays: Array.from(activeDaysSet).sort().slice(-60),
          proActive: false,
          planCode: 'FREE',
          planLabel: 'Versión Gratuita',
          status: 'free',
          expiresAt: null,
          lastKey: bodyKeyClean || existing?.lastKey || '',
          updatedAt: now,
          revoked: true,
          revokedAt: now,
          blocked: false,
          blockedAt: null,
          trialActive: false,
          adminAssigned: false,
          ...(existing?.linkedEmail ? { linkedEmail: existing.linkedEmail } : {}),
        };
        await rtdbFetch(baseUrl, `/dispositivos/${normId}`, existing ? 'PATCH' : 'PUT', revokedDev);
        return await fetchRtdbSnapshot(baseUrl, now, revokedDev);
      }
    }

    if (bodyKeyClean) {
      const safeKeyId = toSafeKey(bodyKeyClean);
      await rtdbFetch(baseUrl, `/claves_revocadas/${safeKeyId}`, 'DELETE');
      const keyRec: AdminKeyRecord = {
        id: safeKeyId,
        cliente: clienteClean,
        deviceId: normId,
        planLabel: String(params.planLabel || 'PRO'),
        dias: params.dias ?? null,
        key: bodyKeyClean,
        createdAt: now,
        expiresAt: params.expiresAt ?? null,
        revoked: false,
        revokedAt: null,
        ...(existing?.linkedEmail ? { linkedEmail: existing.linkedEmail } : {}),
      };
      await rtdbFetch(baseUrl, `/claves/${safeKeyId}`, 'PUT', keyRec);
    }

    let nextDevice: CloudDeviceRecord | null = existing;
    if (!params.recordKeyOnly) {
      await rtdbFetch(baseUrl, `/bloqueados/${normId}`, 'DELETE');
      const planCode = String(params.planCode || 'M');
      nextDevice = {
        deviceId: normId,
        cliente: clienteClean === 'Cliente sin nombre' && existing?.cliente ? existing.cliente : clienteClean,
        deviceLabel: existing?.deviceLabel || 'Equipo Remoto',
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastSeenAt: now,
        totalSessions: existing?.totalSessions ?? 0,
        totalMinutes: existing?.totalMinutes ?? 0,
        activeDays: Array.from(activeDaysSet).sort().slice(-60),
        proActive: true,
        planCode,
        planLabel: String(params.planLabel || 'PRO'),
        status: 'pro',
        expiresAt: params.expiresAt ?? null,
        lastKey: bodyKeyClean || existing?.lastKey || '',
        updatedAt: now,
        revoked: false,
        revokedAt: null,
        blocked: false,
        blockedAt: null,
        trialActive: planCode === 'G',
        adminAssigned: true,
        ...(existing?.linkedEmail ? { linkedEmail: existing.linkedEmail } : {}),
      };
      await rtdbFetch(baseUrl, `/dispositivos/${normId}`, existing ? 'PATCH' : 'PUT', nextDevice);
    } else if (!existing) {
      nextDevice = {
        deviceId: normId,
        cliente: clienteClean,
        deviceLabel: 'Pendiente de conexión',
        firstSeenAt: now,
        lastSeenAt: now,
        totalSessions: 0,
        totalMinutes: 0,
        activeDays: [today],
        proActive: false,
        planCode: 'FREE',
        planLabel: 'Versión Gratuita',
        expiresAt: null,
        lastKey: bodyKeyClean,
        updatedAt: now,
        revoked: false,
        revokedAt: null,
        blocked: false,
        blockedAt: null,
        trialActive: false,
        adminAssigned: false,
      };
      await rtdbFetch(baseUrl, `/dispositivos/${normId}`, 'PUT', nextDevice);
    } else if (bodyKeyClean) {
      nextDevice = {
        ...existing,
        cliente: clienteClean !== 'Cliente sin nombre' ? clienteClean : existing.cliente,
        lastKey: bodyKeyClean,
        revoked: false,
        revokedAt: null,
        updatedAt: now,
      };
      await rtdbFetch(baseUrl, `/dispositivos/${normId}`, 'PATCH', nextDevice);
    }

    return await fetchRtdbSnapshot(baseUrl, now, nextDevice);
  } catch {
    return null;
  }
}

export async function deleteAdminKeyRtdb(
  baseUrl: string,
  params: { id?: string; deviceId: string; key?: string; deleteDevice?: boolean }
): Promise<CloudSyncSnapshot | null> {
  const idClean = typeof params.id === 'string' ? params.id.trim() : '';
  const deviceClean = toSafeKey(normalizeDeviceIdInput(String(params.deviceId || '')));
  const keyClean = typeof params.key === 'string' ? params.key.trim().toUpperCase() : '';
  const deleteDevice = Boolean(params.deleteDevice);
  if (!idClean && !deviceClean) return null;

  try {
    const clavesMap = await rtdbFetch<Record<string, AdminKeyRecord>>(baseUrl, '/claves', 'GET');
    if (clavesMap) {
      for (const [nodeKey, item] of Object.entries(clavesMap)) {
        if (!item) continue;
        const itemDev = toSafeKey(normalizeDeviceIdInput(item.deviceId));
        const itemKey = String(item.key || '').trim().toUpperCase();
        const shouldDelete =
          (idClean && (nodeKey === idClean || item.id === idClean)) ||
          (deleteDevice && deviceClean && itemDev === deviceClean) ||
          (deviceClean && keyClean && itemDev === deviceClean && itemKey === keyClean);
        if (shouldDelete) {
          await rtdbFetch(baseUrl, `/claves/${nodeKey}`, 'DELETE');
        }
      }
    }
    if (keyClean) {
      await rtdbFetch(baseUrl, `/claves/${toSafeKey(keyClean)}`, 'DELETE');
    }
    if (deleteDevice && deviceClean) {
      await rtdbFetch(baseUrl, `/dispositivos/${deviceClean}`, 'DELETE');
      await rtdbFetch(baseUrl, `/bloqueados/${deviceClean}`, 'DELETE');
    }
    return await fetchRtdbSnapshot(baseUrl, Date.now());
  } catch {
    return null;
  }
}

export function subscribeRtdbDevices(
  baseUrl: string,
  onSync: (snapshot: CloudSyncSnapshot) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    onStatusChange?.(false);
    return () => {};
  }
  let closed = false;
  const poll = async () => {
    if (closed) return;
    const snap = await fetchRtdbSnapshot(baseUrl, Date.now());
    if (closed) return;
    onStatusChange?.(Boolean(snap));
    if (snap) onSync(snap);
  };
  void poll();
  const id = window.setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    void poll();
  }, 15_000);
  return () => {
    closed = true;
    window.clearInterval(id);
  };
}

export async function verifyAdminPasswordRtdb(
  baseUrl: string,
  password: string
): Promise<{ ok: boolean; offline?: boolean; error?: string }> {
  const candidate = password.trim();
  if (!candidate) return { ok: false, error: 'Contraseña incorrecta' };
  try {
    const cfg = await rtdbFetch<{ adminPasswordSalt?: string; adminPasswordHash?: string }>(
      baseUrl,
      '/config/admin',
      'GET'
    );
    if (cfg && cfg.adminPasswordSalt && cfg.adminPasswordHash) {
      const hash = await sha256Hex(`${cfg.adminPasswordSalt}:${candidate}`);
      return hash === cfg.adminPasswordHash ? { ok: true } : { ok: false, error: 'Contraseña incorrecta' };
    }
    return verifyAdminPassword(candidate) ? { ok: true } : { ok: false, error: 'Contraseña incorrecta' };
  } catch {
    return { ok: false, offline: true };
  }
}

export async function resetAdminPasswordRtdb(
  baseUrl: string,
  pin: string,
  newPassword: string
): Promise<{ ok: boolean; offline?: boolean; error?: string }> {
  if (!verifyRecoveryPin(pin.trim())) return { ok: false, error: 'PIN de recuperación incorrecto' };
  if (newPassword.trim().length < 4) return { ok: false, error: 'La nueva contraseña debe tener al menos 4 caracteres' };
  try {
    const salt = randomHex(16);
    const hash = await sha256Hex(`${salt}:${newPassword.trim()}`);
    await rtdbFetch(baseUrl, '/config/admin', 'PUT', {
      adminPasswordSalt: salt,
      adminPasswordHash: hash,
      updatedAt: Date.now(),
    });
    return { ok: true };
  } catch {
    return { ok: false, offline: true };
  }
}

interface RtdbCloudAccount {
  email: string;
  passwordSalt: string;
  passwordHash: string;
  activeDeviceId: string;
  activeSessionToken: string | null;
  licencia: {
    active: boolean;
    planCode: string;
    planLabel: string;
    expiresAt: number | null;
    activatedAt: number;
  } | null;
  backup: CloudAccountBackupPayload | null;
  createdAt: number;
  updatedAt: number;
  lastBackedUpAt: number | null;
}

export async function registerCloudAccountRtdb(
  baseUrl: string,
  params: {
    email: string;
    password: string;
    deviceId: string;
    licencia: LicenciaState | null;
    backup: CloudAccountBackupPayload;
  }
): Promise<CloudAccountAuthResult> {
  const email = String(params.email || '').trim().toLowerCase();
  const password = String(params.password || '');
  const deviceId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  const now = Date.now();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Ingresa un correo electrónico válido.' };
  if (password.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  if (!deviceId) return { ok: false, error: 'ID de dispositivo requerido.' };

  try {
    const accountId = await sha256Hex(email);
    const existing = await rtdbFetch<RtdbCloudAccount>(baseUrl, `/cuentas/${accountId}`, 'GET');
    if (existing) {
      return { ok: false, error: 'Este correo ya tiene una cuenta registrada. Usa "Iniciar sesión" para recuperar tu respaldo.' };
    }
    if (!isEligibleForCloudBackup(params.licencia, false, now)) {
      return { ok: false, error: 'El respaldo en la nube es un beneficio exclusivo de los planes PRO de 90 días y 1 año.' };
    }
    const salt = randomHex(16);
    const hash = await sha256Hex(`${salt}:${password}`);
    const sessionToken = randomHex(24);
    const cleanLic = {
      active: true,
      planCode: String(params.licencia!.planCode),
      planLabel: String(params.licencia!.planLabel),
      expiresAt: params.licencia!.expiresAt ?? null,
      activatedAt: Number(params.licencia!.activatedAt || now),
    };
    const accountDoc: RtdbCloudAccount = {
      email,
      passwordSalt: salt,
      passwordHash: hash,
      activeDeviceId: deviceId,
      activeSessionToken: sessionToken,
      licencia: cleanLic,
      backup: params.backup || null,
      createdAt: now,
      updatedAt: now,
      lastBackedUpAt: params.backup ? now : null,
    };
    await rtdbFetch(baseUrl, `/cuentas/${accountId}`, 'PUT', accountDoc);
    await rtdbFetch(baseUrl, `/dispositivos/${deviceId}`, 'PATCH', {
      proActive: true,
      planCode: cleanLic.planCode,
      planLabel: cleanLic.planLabel,
      expiresAt: cleanLic.expiresAt,
      adminAssigned: true,
      linkedEmail: email,
      updatedAt: now,
    });
    const snapshot = await fetchRtdbSnapshot(baseUrl, now);
    return {
      ok: true,
      email,
      sessionToken,
      licencia: cleanLic,
      lastBackedUpAt: accountDoc.lastBackedUpAt,
      snapshot: snapshot || undefined,
    };
  } catch {
    return { ok: false, offline: true, error: 'Sin conexión con el servidor de respaldo en la nube.' };
  }
}

export async function loginCloudAccountRtdb(
  baseUrl: string,
  params: { email: string; password: string; deviceId: string; licencia: LicenciaState | null }
): Promise<CloudAccountAuthResult> {
  const email = String(params.email || '').trim().toLowerCase();
  const password = String(params.password || '');
  const deviceId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  const now = Date.now();
  if (!email || !password || !deviceId) return { ok: false, error: 'Ingresa tu correo y contraseña completos.' };

  try {
    const accountId = await sha256Hex(email);
    const acc = await rtdbFetch<RtdbCloudAccount>(baseUrl, `/cuentas/${accountId}`, 'GET');
    if (!acc) return { ok: false, error: 'Correo o contraseña incorrectos.' };
    const hash = await sha256Hex(`${acc.passwordSalt}:${password}`);
    if (hash !== acc.passwordHash) return { ok: false, error: 'Correo o contraseña incorrectos.' };

    const effectiveLic = isEligibleForCloudBackup(acc.licencia, false, now)
      ? acc.licencia
      : isEligibleForCloudBackup(params.licencia ?? null, false, now)
        ? {
            active: true,
            planCode: String(params.licencia!.planCode),
            planLabel: String(params.licencia!.planLabel),
            expiresAt: params.licencia!.expiresAt ?? null,
            activatedAt: Number(params.licencia!.activatedAt || now),
          }
        : null;
    if (!effectiveLic) {
      return { ok: false, error: 'Tu plan PRO de 90 días o 1 año expiró o fue revocado.' };
    }

    const prevId = acc.activeDeviceId && toSafeKey(normalizeDeviceIdInput(acc.activeDeviceId)) !== deviceId
      ? toSafeKey(normalizeDeviceIdInput(acc.activeDeviceId))
      : null;
    if (prevId) {
      await rtdbFetch(baseUrl, `/dispositivos/${prevId}`, 'PATCH', {
        proActive: false,
        planCode: 'SESSION_MOVED',
        planLabel: 'Sesión cerrada (iniciada en otro celular)',
        expiresAt: null,
        updatedAt: now,
      });
    }
    const sessionToken = randomHex(24);
    await rtdbFetch(baseUrl, `/cuentas/${accountId}`, 'PATCH', {
      activeDeviceId: deviceId,
      activeSessionToken: sessionToken,
      licencia: effectiveLic,
      updatedAt: now,
    });
    const existingDev = await rtdbFetch<CloudDeviceRecord>(baseUrl, `/dispositivos/${deviceId}`, 'GET');
    const today = new Date(now).toISOString().slice(0, 10);
    const nextDev: CloudDeviceRecord = {
      deviceId,
      cliente: existingDev?.cliente || '',
      deviceLabel: existingDev?.deviceLabel || detectLabel(),
      firstSeenAt: existingDev?.firstSeenAt ?? now,
      lastSeenAt: now,
      totalSessions: existingDev?.totalSessions ?? 1,
      totalMinutes: existingDev?.totalMinutes ?? 1,
      activeDays: Array.isArray(existingDev?.activeDays) && existingDev.activeDays.length > 0 ? existingDev.activeDays : [today],
      proActive: true,
      planCode: effectiveLic.planCode,
      planLabel: effectiveLic.planLabel,
      expiresAt: effectiveLic.expiresAt,
      lastKey: existingDev?.lastKey || '',
      updatedAt: now,
      revoked: false,
      revokedAt: null,
      blocked: false,
      blockedAt: null,
      trialActive: false,
      adminAssigned: true,
      linkedEmail: email,
    };
    await rtdbFetch(baseUrl, `/dispositivos/${deviceId}`, existingDev ? 'PATCH' : 'PUT', nextDev);
    const snapshot = await fetchRtdbSnapshot(baseUrl, now, nextDev);
    return {
      ok: true,
      email,
      sessionToken,
      licencia: effectiveLic,
      backup: acc.backup ?? null,
      lastBackedUpAt: acc.lastBackedUpAt,
      replacedPreviousDevice: Boolean(prevId),
      snapshot: snapshot || undefined,
    };
  } catch {
    return { ok: false, offline: true, error: 'Sin conexión con el servidor de respaldo en la nube.' };
  }
}

export async function uploadCloudAccountBackupRtdb(
  baseUrl: string,
  params: {
    email: string;
    sessionToken: string;
    deviceId: string;
    licencia: LicenciaState | null;
    backup: CloudAccountBackupPayload;
  }
): Promise<CloudAccountBackupResult> {
  const email = String(params.email || '').trim().toLowerCase();
  const deviceId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  const now = Date.now();
  try {
    const accountId = await sha256Hex(email);
    const acc = await rtdbFetch<RtdbCloudAccount>(baseUrl, `/cuentas/${accountId}`, 'GET');
    if (!acc || acc.activeSessionToken !== params.sessionToken || toSafeKey(normalizeDeviceIdInput(acc.activeDeviceId)) !== deviceId) {
      return { ok: false, sessionExpired: true, error: 'Tu sesión se cerró porque iniciaste sesión en otro dispositivo.' };
    }
    await rtdbFetch(baseUrl, `/cuentas/${accountId}`, 'PATCH', {
      backup: params.backup,
      updatedAt: now,
      lastBackedUpAt: now,
    });
    return { ok: true, updatedAt: now };
  } catch {
    return { ok: false, offline: true };
  }
}

export async function checkCloudAccountSessionRtdb(
  baseUrl: string,
  params: { email: string; sessionToken: string; deviceId: string }
): Promise<CloudAccountBackupResult> {
  const email = String(params.email || '').trim().toLowerCase();
  const deviceId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  try {
    const accountId = await sha256Hex(email);
    const acc = await rtdbFetch<RtdbCloudAccount>(baseUrl, `/cuentas/${accountId}`, 'GET');
    if (!acc || acc.activeSessionToken !== params.sessionToken || toSafeKey(normalizeDeviceIdInput(acc.activeDeviceId)) !== deviceId) {
      return { ok: false, sessionExpired: true, error: 'Tu sesión se cerró porque iniciaste sesión en otro celular.' };
    }
    return { ok: true, updatedAt: acc.lastBackedUpAt ?? acc.updatedAt };
  } catch {
    return { ok: false, offline: true };
  }
}

export async function logoutCloudAccountRtdb(
  baseUrl: string,
  params: { email: string; sessionToken: string; deviceId: string }
): Promise<void> {
  const email = String(params.email || '').trim().toLowerCase();
  const deviceId = toSafeKey(normalizeDeviceIdInput(params.deviceId));
  try {
    const accountId = await sha256Hex(email);
    const acc = await rtdbFetch<RtdbCloudAccount>(baseUrl, `/cuentas/${accountId}`, 'GET');
    if (acc && acc.activeSessionToken === params.sessionToken && toSafeKey(normalizeDeviceIdInput(acc.activeDeviceId)) === deviceId) {
      await rtdbFetch(baseUrl, `/cuentas/${accountId}`, 'PATCH', {
        activeSessionToken: null,
        updatedAt: Date.now(),
      });
    }
  } catch {
    // ignorar si está sin conexión
  }
}

export async function fetchPromocionesEnviadasRtdb(baseUrl: string): Promise<number> {
  const raw = await rtdbFetch<number | { total?: number } | null>(
    baseUrl,
    '/stats/promociones_enviadas',
    'GET'
  );
  const current =
    typeof raw === 'number'
      ? raw
      : raw && typeof raw === 'object' && typeof raw.total === 'number'
        ? raw.total
        : null;
  if (current !== null && Number.isFinite(current) && current >= 1) {
    return Math.round(current);
  }
  await rtdbFetch(baseUrl, '/stats/promociones_enviadas', 'PUT', 1);
  return 1;
}

export async function incrementPromocionesEnviadasRtdb(baseUrl: string): Promise<number> {
  const current = await fetchPromocionesEnviadasRtdb(baseUrl);
  const next = Math.max(1, Math.round(current)) + 1;
  await rtdbFetch(baseUrl, '/stats/promociones_enviadas', 'PUT', next);
  return next;
}

