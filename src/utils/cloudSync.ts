import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  isFirestoreOfflineError,
  OperationType,
} from '../firebase';
import {
  computeUsageStats30d,
  DEFAULT_REFERENCE_PRICES,
  isColleaguePromoPlan,
  isEligibleForCloudBackup,
  isUnassignedAutoTrialDevice,
  normalizeDeviceIdInput,
  PROMO_COLEGA_ALREADY_USED_ERROR,
  validateActivationKey,
  verifyAdminPassword,
  verifyRecoveryPin,
  type AdminMessageItem,
  type AdminMessageType,
  type CloudDeviceRecord,
  type ReferencePriceItem,
  type ReferencePricesDoc,
  type UsageStats30d,
} from './alumineroLogic';
import {
  loadAdminMessagesCache,
  loadCachedPromoCount,
  loadReferencePricesCache,
  loadTutorialVideosCache,
  saveAdminMessagesCache,
  saveCachedPromoCount,
  saveReferencePricesCache,
  saveTutorialVideosCache,
  type AdminKeyRecord,
  type AppSkin,
  type AppTheme,
  type CloudAccountBackupPayload,
  type LicenciaState,
  type TutorialVideoCategory,
  type TutorialVideoItem,
} from './storageHelpers';
import {
  activateKeyRtdb,
  checkCloudAccountSessionRtdb,
  deleteAdminKeyRtdb,
  fetchPromocionesEnviadasRtdb,
  fetchRtdbSnapshot,
  incrementPromocionesEnviadasRtdb,
  loginCloudAccountRtdb,
  logoutCloudAccountRtdb,
  registerCloudAccountRtdb,
  resetAdminPasswordRtdb,
  subscribeRtdbDevices,
  syncDeviceRtdb,
  updateDeviceLicenseRtdb,
  uploadCloudAccountBackupRtdb,
  verifyAdminPasswordRtdb,
  verifyDeviceRtdb,
} from './rtdbRestSync';

// Pega aquí tu URL de Firebase Realtime Database (ej. "https://tu-proyecto-default-rtdb.firebaseio.com")
// para usar API REST directa (GET / PUT / PATCH / DELETE sobre /dispositivos/{deviceId}.json y /claves/{clave}.json).
// Si queda vacío (''), Aluminero Pro usa automáticamente Firebase Firestore ya configurado y activo.
export const FIREBASE_DB_URL = '';

export interface CloudSyncSnapshot {
  devices: CloudDeviceRecord[];
  adminKeys: AdminKeyRecord[];
  revokedKeys?: string[];
  stats: UsageStats30d;
  serverTime: number;
  device?: CloudDeviceRecord | null;
}

export function detectDeviceLabel(): string {
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

function toSafeDocId(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  if (cleaned.length >= 3) return cleaned;
  return `ID-${cleaned || 'DEV'}`.slice(0, 64);
}

function toSafeKeyRecordId(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  if (cleaned.length >= 3) return cleaned;
  return `ak-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function cleanForFirestore<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== undefined) {
      out[k] = cleanForFirestore(v);
    }
  }
  return out as T;
}

function buildSafeDeviceRecord(
  input: Partial<CloudDeviceRecord> & { deviceId: string },
  existing: CloudDeviceRecord | null,
  now: number
): CloudDeviceRecord {
  const safeId = toSafeDocId(input.deviceId);
  const activeDaysRaw = Array.isArray(input.activeDays)
    ? input.activeDays
    : Array.isArray(existing?.activeDays)
      ? existing.activeDays
      : [];
  const activeDays = Array.from(
    new Set(
      activeDaysRaw
        .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
        .map((d) => d.trim().slice(0, 16))
    )
  )
    .sort()
    .slice(-60);

  const firstSeenAt = existing?.firstSeenAt && Number.isFinite(existing.firstSeenAt)
    ? existing.firstSeenAt
    : input.firstSeenAt && Number.isFinite(input.firstSeenAt)
      ? input.firstSeenAt
      : now;

  const planCodeClean = String(input.planCode || 'FREE').trim().slice(0, 24) || 'FREE';
  const blockedVal = Boolean(input.blocked);
  const proVal = Boolean(input.proActive);
  const derivedStatus: 'free' | 'pro' | 'blocked' =
    input.status === 'blocked' || input.status === 'pro' || input.status === 'free'
      ? input.status
      : blockedVal || planCodeClean === 'BLOCKED'
        ? 'blocked'
        : proVal && !input.revoked && planCodeClean !== 'FREE' && planCodeClean !== 'REVOKED'
          ? 'pro'
          : 'free';

  const base: CloudDeviceRecord = {
    deviceId: safeId,
    cliente: String(input.cliente ?? existing?.cliente ?? '')
      .trim()
      .slice(0, 120),
    deviceLabel: String(input.deviceLabel ?? existing?.deviceLabel ?? 'Navegador Web')
      .trim()
      .slice(0, 80) || 'Navegador Web',
    firstSeenAt,
    lastSeenAt: Math.max(firstSeenAt, Number(input.lastSeenAt ?? now) || now),
    totalSessions: Math.max(0, Math.min(1_000_000, Math.round(Number(input.totalSessions ?? existing?.totalSessions ?? 0) || 0))),
    totalMinutes: Math.max(0, Math.min(100_000_000, Math.round(Number(input.totalMinutes ?? existing?.totalMinutes ?? 0) || 0))),
    activeDays,
    proActive: proVal,
    planCode: planCodeClean,
    planLabel: String(input.planLabel || 'Versión Gratuita').trim().slice(0, 120) || 'Versión Gratuita',
    status: derivedStatus,
    expiresAt: input.expiresAt === undefined ? null : input.expiresAt,
    lastKey: String(input.lastKey ?? existing?.lastKey ?? '').trim().toUpperCase().slice(0, 40),
    updatedAt: Number(input.updatedAt ?? now) || now,
    revoked: Boolean(input.revoked),
    revokedAt: input.revokedAt === undefined ? (existing?.revokedAt ?? null) : input.revokedAt,
    blocked: blockedVal,
    blockedAt: input.blockedAt === undefined ? (existing?.blockedAt ?? null) : input.blockedAt,
    trialActive: Boolean(input.trialActive),
    adminAssigned: Boolean(input.adminAssigned),
    promo_colega_usada:
      input.promo_colega_usada !== undefined
        ? Boolean(input.promo_colega_usada)
        : Boolean(existing?.promo_colega_usada),
    fecha_activacion_colega:
      input.fecha_activacion_colega !== undefined
        ? input.fecha_activacion_colega
        : existing?.fecha_activacion_colega ?? null,
    ...(input.linkedEmail || existing?.linkedEmail
      ? {
          linkedEmail: String(input.linkedEmail ?? existing?.linkedEmail ?? '')
            .trim()
            .toLowerCase()
            .slice(0, 160),
        }
      : {}),
    ...(input.tallerNombre !== undefined || existing?.tallerNombre
      ? {
          tallerNombre: String(input.tallerNombre ?? existing?.tallerNombre ?? '')
            .trim()
            .slice(0, 120),
        }
      : {}),
    ...(input.tallerResponsable !== undefined || existing?.tallerResponsable
      ? {
          tallerResponsable: String(input.tallerResponsable ?? existing?.tallerResponsable ?? '')
            .trim()
            .slice(0, 120),
        }
      : {}),
    ...(input.tallerWhatsapp !== undefined || existing?.tallerWhatsapp
      ? {
          tallerWhatsapp: String(input.tallerWhatsapp ?? existing?.tallerWhatsapp ?? '')
            .trim()
            .slice(0, 40),
        }
      : {}),
    ...(input.termsAcceptedAt !== undefined || existing?.termsAcceptedAt !== undefined
      ? {
          termsAcceptedAt:
            input.termsAcceptedAt !== undefined
              ? input.termsAcceptedAt
              : existing?.termsAcceptedAt ?? null,
        }
      : {}),
    ...(input.preferredTheme || existing?.preferredTheme
      ? {
          preferredTheme:
            input.preferredTheme === 'light' || input.preferredTheme === 'dark'
              ? input.preferredTheme
              : existing?.preferredTheme,
        }
      : {}),
    ...(input.preferredSkin || existing?.preferredSkin
      ? {
          preferredSkin:
            input.preferredSkin === 'basica' ||
            input.preferredSkin === 'ejecutiva' ||
            input.preferredSkin === 'industrial'
              ? input.preferredSkin
              : existing?.preferredSkin,
        }
      : {}),
  };

  return cleanForFirestore(base);
}

function buildSafeAdminKeyRecord(rec: AdminKeyRecord): AdminKeyRecord {
  const cleanId = toSafeKeyRecordId(rec.id);
  const cleanDeviceId = toSafeDocId(rec.deviceId);
  const base: AdminKeyRecord = {
    id: cleanId,
    cliente: String(rec.cliente || 'Cliente sin nombre').trim().slice(0, 120) || 'Cliente sin nombre',
    deviceId: cleanDeviceId,
    planLabel: String(rec.planLabel || 'PRO').trim().slice(0, 120) || 'PRO',
    dias:
      typeof rec.dias === 'number' && Number.isFinite(rec.dias)
        ? Math.max(0, Math.min(3650, Math.round(rec.dias)))
        : null,
    key: String(rec.key || '').trim().toUpperCase().slice(0, 40),
    createdAt: Number(rec.createdAt) || Date.now(),
    expiresAt: rec.expiresAt === undefined ? null : rec.expiresAt,
    revoked: Boolean(rec.revoked),
    revokedAt: rec.revokedAt === undefined ? null : rec.revokedAt,
    ...(rec.linkedEmail
      ? { linkedEmail: String(rec.linkedEmail).trim().toLowerCase().slice(0, 160) }
      : {}),
  };
  return cleanForFirestore(base);
}

function normalizeEmail(raw: unknown): string {
  return String(raw || '').trim().toLowerCase();
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 160;
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
  // Fallback determinista de 64 hex para entornos HTTP locales sin crypto.subtle
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

function buildNormalizedSnapshot(params: {
  rawDevices: CloudDeviceRecord[];
  rawAdminKeys: AdminKeyRecord[];
  revokedKeysList: string[];
  blockedDeviceIds: Set<string>;
  now?: number;
  device?: CloudDeviceRecord | null;
}): CloudSyncSnapshot {
  const now = params.now ?? Date.now();
  const revokedKeysSet = new Set(
    params.revokedKeysList.map((k) => k.trim().toUpperCase()).filter(Boolean)
  );
  for (const k of params.rawAdminKeys) {
    if (k.revoked && k.key) {
      revokedKeysSet.add(k.key.trim().toUpperCase());
    }
  }

  const devicesMap = new Map<string, CloudDeviceRecord>();
  for (const d of params.rawDevices) {
    if (!d || !d.deviceId) continue;
    const normId = toSafeDocId(normalizeDeviceIdInput(d.deviceId));
    const isBlocked = Boolean(d.blocked || d.planCode === 'BLOCKED' || params.blockedDeviceIds.has(normId));
    const unassignedTrial = !isBlocked && !d.revoked && isUnassignedAutoTrialDevice(d);
    const expired = Boolean(d.proActive && d.expiresAt !== null && d.expiresAt !== undefined && d.expiresAt <= now);
    const lastKeyUpper = String(d.lastKey || '').trim().toUpperCase();
    const keyIsRevoked = Boolean(lastKeyUpper && revokedKeysSet.has(lastKeyUpper));
    const isRevoked = Boolean(d.revoked || d.planCode === 'REVOKED' || keyIsRevoked);
    const isNonProPlan =
      isBlocked ||
      unassignedTrial ||
      isRevoked ||
      d.planCode === 'FREE' ||
      d.planCode === 'REVOKED' ||
      d.planCode === 'BLOCKED' ||
      d.planCode === 'SESSION_MOVED';

    const effectivePro = isNonProPlan || expired ? false : Boolean(d.proActive);
    const normalized: CloudDeviceRecord = {
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
    };
    devicesMap.set(normId, normalized);
  }

  const devices = Array.from(devicesMap.values()).sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  const adminKeys = params.rawAdminKeys
    .filter((k) => k && k.deviceId)
    .map((k) => {
      const normDev = toSafeDocId(normalizeDeviceIdInput(k.deviceId));
      const devRec = devicesMap.get(normDev);
      const nk = String(k.key || '').trim().toUpperCase();
      const mergedRevoked = Boolean(k.revoked || (nk && revokedKeysSet.has(nk)));
      return {
        ...k,
        deviceId: normDev,
        revoked: mergedRevoked,
        ...(devRec?.linkedEmail && !k.linkedEmail ? { linkedEmail: devRec.linkedEmail } : {}),
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 100);

  const stats = computeUsageStats30d(devices, now);
  return {
    devices,
    adminKeys,
    revokedKeys: Array.from(revokedKeysSet),
    stats,
    serverTime: now,
    ...(params.device !== undefined ? { device: params.device } : {}),
  };
}

async function fetchAllCollectionsSnapshot(
  now = Date.now(),
  device?: CloudDeviceRecord | null
): Promise<CloudSyncSnapshot> {
  let rawDevices: CloudDeviceRecord[] = [];
  let rawAdminKeys: AdminKeyRecord[] = [];
  let revokedKeysList: string[] = [];
  const blockedDeviceIds = new Set<string>();

  try {
    const snap = await getDocs(query(collection(db, 'devices'), limit(500)));
    rawDevices = snap.docs.map((d) => d.data() as CloudDeviceRecord);
  } catch (err) {
    if (isFirestoreOfflineError(err)) throw err;
    handleFirestoreError(err, OperationType.LIST, 'devices');
  }

  try {
    const snap = await getDocs(query(collection(db, 'adminKeys'), limit(500)));
    rawAdminKeys = snap.docs.map((d) => d.data() as AdminKeyRecord);
  } catch (err) {
    if (isFirestoreOfflineError(err)) throw err;
    handleFirestoreError(err, OperationType.LIST, 'adminKeys');
  }

  try {
    const snap = await getDocs(query(collection(db, 'revokedKeys'), limit(500)));
    revokedKeysList = snap.docs
      .map((d) => String((d.data() as { key?: string }).key || d.id || '').trim().toUpperCase())
      .filter(Boolean);
  } catch (err) {
    if (isFirestoreOfflineError(err)) throw err;
    handleFirestoreError(err, OperationType.LIST, 'revokedKeys');
  }

  try {
    const snap = await getDocs(query(collection(db, 'blockedDevices'), limit(500)));
    for (const d of snap.docs) {
      const id = toSafeDocId(String((d.data() as { deviceId?: string }).deviceId || d.id || ''));
      if (id) blockedDeviceIds.add(id);
    }
  } catch (err) {
    if (isFirestoreOfflineError(err)) throw err;
    handleFirestoreError(err, OperationType.LIST, 'blockedDevices');
  }

  return buildNormalizedSnapshot({
    rawDevices,
    rawAdminKeys,
    revokedKeysList,
    blockedDeviceIds,
    now,
    device,
  });
}

async function readServerDoc<T>(colName: string, docId: string): Promise<T | null> {
  const path = `${colName}/${docId}`;
  const ref = doc(db, colName, docId);
  try {
    const snap = await getDocFromServer(ref);
    return snap.exists() ? (snap.data() as T) : null;
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      try {
        const cached = await getDoc(ref);
        return cached.exists() ? (cached.data() as T) : null;
      } catch {
        throw err;
      }
    }
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function fetchCloudDevicesState(): Promise<CloudSyncSnapshot | null> {
  if (FIREBASE_DB_URL.trim()) {
    return await fetchRtdbSnapshot(FIREBASE_DB_URL, Date.now());
  }
  try {
    return await fetchAllCollectionsSnapshot(Date.now());
  } catch (err) {
    if (isFirestoreOfflineError(err)) return null;
    throw err;
  }
}

export async function syncDeviceToCloud(params: {
  deviceId: string;
  cliente?: string;
  deviceLabel?: string;
  eventType?: 'open' | 'heartbeat' | 'license_sync';
  minutesDelta?: number;
  trialActive?: boolean;
  trialExpiresAt?: number | null;
  licencia?: LicenciaState | null;
  tallerNombre?: string;
  tallerResponsable?: string;
  tallerWhatsapp?: string;
}): Promise<CloudSyncSnapshot | null> {
  if (FIREBASE_DB_URL.trim()) {
    return await syncDeviceRtdb(FIREBASE_DB_URL, params);
  }
  const normId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  if (!normId) return null;

  try {
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const eventType = params.eventType || 'open';

    const existing = await readServerDoc<CloudDeviceRecord>('devices', normId);
    const blockedDoc = await readServerDoc<{ deviceId: string; blockedAt: number }>('blockedDevices', normId);

    const cleanLicKey = String(params.licencia?.activatedKey || '').trim().toUpperCase();
    const safeLicKey = cleanLicKey ? toSafeDocId(cleanLicKey) : '';
    const revokedKeyDoc = safeLicKey
      ? await readServerDoc<{ key: string; revokedAt: number }>('revokedKeys', safeLicKey)
      : null;

    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    activeDaysSet.add(today);
    const activeDays = Array.from(activeDaysSet).sort().slice(-60);

    const minsDelta = Math.max(
      0,
      Math.min(15, Number(params.minutesDelta ?? (eventType === 'open' ? 1 : 0)) || 0)
    );
    const sessionsDelta = eventType === 'open' ? 1 : 0;

    let proActive = existing?.proActive ?? false;
    let planCode = existing?.planCode ?? 'FREE';
    let planLabel = existing?.planLabel ?? 'Versión Gratuita';
    let expiresAt: number | null = existing?.expiresAt ?? null;
    let updatedAt = existing?.updatedAt ?? now;
    let revoked = Boolean(existing?.revoked || existing?.planCode === 'REVOKED');
    let revokedAt: number | null = existing?.revokedAt ?? null;
    let blocked = Boolean(existing?.blocked || existing?.planCode === 'BLOCKED' || blockedDoc);
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
      blocked = true;
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
    } else if (existing?.planCode === 'SESSION_MOVED' && clientActivatedAt <= (existing.updatedAt ?? 0)) {
      proActive = false;
      planCode = 'SESSION_MOVED';
      planLabel = existing.planLabel;
      expiresAt = null;
      trialActive = false;
      adminAssigned = false;
    } else if (eventType === 'license_sync') {
      if (params.licencia && params.licencia.active && (hasValidNonRevokedKey || adminAssigned)) {
        proActive =
          params.licencia.expiresAt === null ||
          params.licencia.expiresAt === undefined ||
          params.licencia.expiresAt > now;
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
    } else if (params.licencia && params.licencia.active) {
      const serverHasNewerDecision = existing && existing.updatedAt > clientActivatedAt + 1000;
      if (!serverHasNewerDecision && hasValidNonRevokedKey && (!existing || !existing.revoked)) {
        proActive =
          params.licencia.expiresAt === null ||
          params.licencia.expiresAt === undefined ||
          params.licencia.expiresAt > now;
        planCode = String(params.licencia.planCode || 'M');
        planLabel = String(params.licencia.planLabel || 'PRO');
        expiresAt = params.licencia.expiresAt ?? null;
        updatedAt = Math.max(updatedAt, clientActivatedAt || now);
        revoked = false;
        revokedAt = null;
        trialActive = planCode === 'G';
        lastKey = cleanLicKey;
      }
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
    } else if (existing.trialActive && existing.expiresAt !== null && existing.expiresAt <= now) {
      proActive = false;
      planCode = 'FREE';
      planLabel = 'Versión Gratuita';
      expiresAt = null;
      trialActive = false;
    }

    if (proActive && expiresAt !== null && expiresAt <= now) {
      proActive = false;
    }

    const clienteClean =
      typeof params.cliente === 'string' && params.cliente.trim()
        ? params.cliente.trim().slice(0, 120)
        : existing?.cliente || '';

    const labelClean =
      typeof params.deviceLabel === 'string' && params.deviceLabel.trim()
        ? params.deviceLabel.trim().slice(0, 80)
        : existing?.deviceLabel || 'Navegador Web';

    const nextRecord = buildSafeDeviceRecord(
      {
        deviceId: normId,
        cliente: clienteClean,
        deviceLabel: labelClean,
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastSeenAt: now,
        totalSessions: (existing?.totalSessions ?? 0) + sessionsDelta,
        totalMinutes: (existing?.totalMinutes ?? 0) + minsDelta,
        activeDays,
        proActive,
        planCode,
        planLabel,
        expiresAt,
        lastKey,
        updatedAt,
        revoked,
        revokedAt,
        blocked,
        blockedAt,
        trialActive,
        adminAssigned,
        promo_colega_usada:
          Boolean(existing?.promo_colega_usada) || isColleaguePromoPlan(planCode, null, lastKey),
        fecha_activacion_colega:
          existing?.fecha_activacion_colega ??
          (isColleaguePromoPlan(planCode, null, lastKey)
            ? params.licencia?.activatedAt ?? now
            : null),
        linkedEmail:
          params.licencia?.linkedEmail && isValidEmailFormat(normalizeEmail(params.licencia.linkedEmail))
            ? normalizeEmail(params.licencia.linkedEmail)
            : existing?.linkedEmail,
        tallerNombre:
          typeof params.tallerNombre === 'string' && params.tallerNombre.trim()
            ? params.tallerNombre.trim().slice(0, 120)
            : existing?.tallerNombre,
        tallerResponsable:
          typeof params.tallerResponsable === 'string' && params.tallerResponsable.trim()
            ? params.tallerResponsable.trim().slice(0, 120)
            : existing?.tallerResponsable,
        tallerWhatsapp:
          typeof params.tallerWhatsapp === 'string' && params.tallerWhatsapp.trim()
            ? params.tallerWhatsapp.trim().slice(0, 40)
            : existing?.tallerWhatsapp,
      },
      existing,
      now
    );

    const devPath = `devices/${normId}`;
    try {
      await setDoc(doc(db, 'devices', normId), nextRecord);
    } catch (err) {
      if (isFirestoreOfflineError(err)) return null;
      handleFirestoreError(err, existing ? OperationType.UPDATE : OperationType.CREATE, devPath);
    }

    return await fetchAllCollectionsSnapshot(now, nextRecord);
  } catch (err) {
    if (isFirestoreOfflineError(err)) return null;
    throw err;
  }
}

export interface DeviceStatusVerifyResult {
  ok: boolean;
  offline?: boolean;
  existsInCloud?: boolean;
  hasValidAssignment?: boolean;
  adminAssigned?: boolean;
  revoked?: boolean;
  keyRevoked?: boolean;
  blocked?: boolean;
  expired?: boolean;
  sessionMoved?: boolean;
  proActive?: boolean;
  planCode?: string;
  planLabel?: string;
  expiresAt?: number | null;
  revokedKeys?: string[];
  device?: CloudDeviceRecord | null;
  devices?: CloudDeviceRecord[];
  adminKeys?: AdminKeyRecord[];
  stats?: UsageStats30d;
  serverTime?: number;
}

export async function verifyDeviceStatusInCloud(params: {
  deviceId: string;
  activatedKey?: string;
}): Promise<DeviceStatusVerifyResult> {
  if (FIREBASE_DB_URL.trim()) {
    return await verifyDeviceRtdb(FIREBASE_DB_URL, params);
  }
  const normId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  if (!normId) {
    return { ok: false, offline: true };
  }

  try {
    const now = Date.now();
    const cleanKey = String(params.activatedKey || '').trim().toUpperCase();
    const safeKey = cleanKey ? toSafeDocId(cleanKey) : '';

    const [existing, blockedDoc, revokedKeyDoc] = await Promise.all([
      readServerDoc<CloudDeviceRecord>('devices', normId),
      readServerDoc<{ deviceId: string; blockedAt: number }>('blockedDevices', normId),
      safeKey
        ? readServerDoc<{ key: string; revokedAt: number }>('revokedKeys', safeKey)
        : Promise.resolve(null),
    ]);

    const existsInCloud = Boolean(existing);
    const keyRevoked = Boolean(revokedKeyDoc);
    const isBlocked = Boolean(existing?.blocked || existing?.planCode === 'BLOCKED' || blockedDoc);
    const deviceRevoked = Boolean(existing?.revoked || existing?.planCode === 'REVOKED');
    const sessionMoved = existing?.planCode === 'SESSION_MOVED';
    const expired = Boolean(existing && existing.expiresAt !== null && existing.expiresAt !== undefined && existing.expiresAt <= now);

    let latestDevice = existing;

    if (isBlocked && existing && (!existing.blocked || existing.planCode !== 'BLOCKED')) {
      const updated = buildSafeDeviceRecord(
        {
          ...existing,
          deviceId: normId,
          proActive: false,
          planCode: 'BLOCKED',
          planLabel: 'Bloqueado',
          expiresAt: null,
          revoked: true,
          revokedAt: existing.revokedAt ?? now,
          blocked: true,
          blockedAt: existing.blockedAt ?? blockedDoc?.blockedAt ?? now,
          trialActive: false,
          adminAssigned: false,
          updatedAt: now,
        },
        existing,
        now
      );
      try {
        await setDoc(doc(db, 'devices', normId), updated);
        latestDevice = updated;
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, `devices/${normId}`);
        }
      }
    } else if (keyRevoked && existing && !existing.revoked) {
      const updated = buildSafeDeviceRecord(
        {
          ...existing,
          deviceId: normId,
          proActive: false,
          planCode: 'FREE',
          planLabel: 'Versión Gratuita',
          status: 'free',
          expiresAt: null,
          revoked: true,
          revokedAt: now,
          trialActive: false,
          adminAssigned: false,
          updatedAt: now,
        },
        existing,
        now
      );
      try {
        await setDoc(doc(db, 'devices', normId), updated);
        latestDevice = updated;
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, `devices/${normId}`);
        }
      }
    } else if (existing && !deviceRevoked && isUnassignedAutoTrialDevice(existing)) {
      const updated = buildSafeDeviceRecord(
        {
          ...existing,
          deviceId: normId,
          proActive: false,
          planCode: 'FREE',
          planLabel: 'Versión Gratuita',
          expiresAt: null,
          trialActive: false,
          adminAssigned: false,
          updatedAt: now,
        },
        existing,
        now
      );
      try {
        await setDoc(doc(db, 'devices', normId), updated);
        latestDevice = updated;
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, `devices/${normId}`);
        }
      }
    } else if (existing && existing.trialActive && expired && existing.proActive) {
      const updated = buildSafeDeviceRecord(
        {
          ...existing,
          deviceId: normId,
          proActive: false,
          planCode: 'FREE',
          planLabel: 'Versión Gratuita',
          expiresAt: null,
          trialActive: false,
          updatedAt: now,
        },
        existing,
        now
      );
      try {
        await setDoc(doc(db, 'devices', normId), updated);
        latestDevice = updated;
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, `devices/${normId}`);
        }
      }
    }

    const hasValidAssignment = Boolean(
      latestDevice && (String(latestDevice.lastKey || '').trim() || latestDevice.adminAssigned)
    );
    const effectivePro = Boolean(
      latestDevice &&
        hasValidAssignment &&
        !isBlocked &&
        !keyRevoked &&
        !deviceRevoked &&
        !sessionMoved &&
        !expired &&
        latestDevice.planCode !== 'FREE' &&
        latestDevice.proActive
    );

    const snapshot = await fetchAllCollectionsSnapshot(now, latestDevice);

    return {
      ok: true,
      existsInCloud,
      hasValidAssignment,
      adminAssigned: Boolean(latestDevice?.adminAssigned),
      blocked: isBlocked,
      revoked: keyRevoked || deviceRevoked || isBlocked,
      keyRevoked,
      expired,
      sessionMoved,
      proActive: effectivePro,
      planCode: isBlocked ? 'BLOCKED' : latestDevice?.planCode || 'FREE',
      planLabel: isBlocked ? 'Bloqueado' : latestDevice?.planLabel || 'Versión Gratuita',
      expiresAt: isBlocked ? null : latestDevice?.expiresAt ?? null,
      device: latestDevice,
      devices: snapshot.devices,
      adminKeys: snapshot.adminKeys,
      revokedKeys: snapshot.revokedKeys,
      stats: snapshot.stats,
      serverTime: snapshot.serverTime,
    };
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return { ok: false, offline: true };
    }
    throw err;
  }
}

export interface ActivateKeyCloudResult {
  ok: boolean;
  offline?: boolean;
  revoked?: boolean;
  error?: string;
  device?: CloudDeviceRecord | null;
  devices?: CloudDeviceRecord[];
  adminKeys?: AdminKeyRecord[];
  revokedKeys?: string[];
  stats?: UsageStats30d;
  serverTime?: number;
}

export async function activateKeyInCloud(params: {
  deviceId: string;
  key: string;
  planCode: string;
  planLabel: string;
  expiresAt: number | null;
  cliente?: string;
  deviceLabel?: string;
  linkedEmail?: string;
}): Promise<ActivateKeyCloudResult> {
  if (FIREBASE_DB_URL.trim()) {
    return await activateKeyRtdb(FIREBASE_DB_URL, params);
  }
  const normId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  const cleanKey = String(params.key || '').trim().toUpperCase();
  if (!normId || !cleanKey) {
    return { ok: false, error: 'Clave o ID de equipo inválido.' };
  }

  try {
    const safeKey = toSafeDocId(cleanKey);
    const revokedDoc = await readServerDoc<{ key: string }>('revokedKeys', safeKey);
    if (revokedDoc) {
      return {
        ok: false,
        revoked: true,
        error: 'Este código de activación fue revocado por el administrador y ya no puede utilizarse.',
      };
    }

    const adminKeysSnap = await getDocs(query(collection(db, 'adminKeys'), limit(500)));
    const matchingKeyRevoked = adminKeysSnap.docs.some((d) => {
      const k = d.data() as AdminKeyRecord;
      return String(k.key || '').trim().toUpperCase() === cleanKey && Boolean(k.revoked);
    });
    if (matchingKeyRevoked) {
      return {
        ok: false,
        revoked: true,
        error: 'Este código de activación fue revocado por el administrador y ya no puede utilizarse.',
      };
    }

    const keyValidation = validateActivationKey(normId, cleanKey);
    if (!keyValidation.ok) {
      return {
        ok: false,
        error: keyValidation.error || 'La clave no corresponde a este ID de equipo.',
      };
    }

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const existing = await readServerDoc<CloudDeviceRecord>('devices', normId);
    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    activeDaysSet.add(today);

    const planCode = String(params.planCode || 'M');
    const planLabel = String(params.planLabel || 'PRO');
    const expiresAt = params.expiresAt ?? null;
    const valid = expiresAt === null || expiresAt > now;
    const isColleague3d = isColleaguePromoPlan(planCode, keyValidation.customDays, cleanKey);

    // Validación estricta de uso único: si el ID ya usó su promoción Colega de 3 días, rechazar inmediatamente
    if (isColleague3d && Boolean(existing?.promo_colega_usada)) {
      return {
        ok: false,
        error: PROMO_COLEGA_ALREADY_USED_ERROR,
      };
    }

    const cleanLinkedEmail =
      typeof params.linkedEmail === 'string' && isValidEmailFormat(normalizeEmail(params.linkedEmail))
        ? normalizeEmail(params.linkedEmail)
        : '';

    const promoColegaUsedNext = Boolean(existing?.promo_colega_usada) || isColleague3d;
    const fechaActivacionColegaNext = isColleague3d
      ? existing?.fecha_activacion_colega ?? now
      : existing?.fecha_activacion_colega ?? null;

    const nextDevice = buildSafeDeviceRecord(
      {
        deviceId: normId,
        cliente:
          typeof params.cliente === 'string' && params.cliente.trim()
            ? params.cliente.trim()
            : existing?.cliente || '',
        deviceLabel:
          typeof params.deviceLabel === 'string' && params.deviceLabel.trim()
            ? params.deviceLabel.trim()
            : existing?.deviceLabel || 'Navegador Web',
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastSeenAt: now,
        totalSessions: existing?.totalSessions ?? 1,
        totalMinutes: existing?.totalMinutes ?? 1,
        activeDays: Array.from(activeDaysSet).sort().slice(-60),
        proActive: valid,
        planCode,
        planLabel,
        expiresAt,
        lastKey: cleanKey,
        updatedAt: now,
        revoked: false,
        revokedAt: null,
        blocked: false,
        blockedAt: null,
        trialActive: planCode === 'G',
        adminAssigned: Boolean(existing?.adminAssigned),
        promo_colega_usada: promoColegaUsedNext,
        fecha_activacion_colega: fechaActivacionColegaNext,
        linkedEmail: cleanLinkedEmail || existing?.linkedEmail,
      },
      existing,
      now
    );

    const devPath = `devices/${normId}`;
    try {
      await setDoc(doc(db, 'devices', normId), nextDevice);
    } catch (err) {
      if (isFirestoreOfflineError(err)) return { ok: false, offline: true };
      handleFirestoreError(err, existing ? OperationType.UPDATE : OperationType.CREATE, devPath);
    }

    if (cleanLinkedEmail) {
      for (const d of adminKeysSnap.docs) {
        const kRec = d.data() as AdminKeyRecord;
        const kCode = String(kRec.key || '').trim().toUpperCase();
        const kDev = toSafeDocId(normalizeDeviceIdInput(kRec.deviceId || ''));
        if (kCode === cleanKey || kDev === normId) {
          try {
            await updateDoc(doc(db, 'adminKeys', d.id), { linkedEmail: cleanLinkedEmail });
          } catch {
            // no bloquear activación si algún registro histórico no admite update
          }
        }
      }
    }

    const snapshot = await fetchAllCollectionsSnapshot(now, nextDevice);
    return {
      ok: true,
      device: nextDevice,
      devices: snapshot.devices,
      adminKeys: snapshot.adminKeys,
      revokedKeys: snapshot.revokedKeys,
      stats: snapshot.stats,
      serverTime: snapshot.serverTime,
    };
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return { ok: false, offline: true };
    }
    throw err;
  }
}

export async function updateDeviceLicenseInCloud(params: {
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
  resetPromoColega?: boolean;
}): Promise<CloudSyncSnapshot | null> {
  if (FIREBASE_DB_URL.trim()) {
    return await updateDeviceLicenseRtdb(FIREBASE_DB_URL, params);
  }
  const normId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  if (!normId) return null;

  try {
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const existing = await readServerDoc<CloudDeviceRecord>('devices', normId);
    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    if (!existing) activeDaysSet.add(today);

    const clienteClean =
      typeof params.cliente === 'string' && params.cliente.trim()
        ? params.cliente.trim().slice(0, 120)
        : existing?.cliente || 'Cliente sin nombre';

    const existingEmail = existing?.linkedEmail;
    const isBlock = Boolean(params.block);
    const isRevoke = Boolean(params.revoke);
    const bodyKeyClean = params.key ? String(params.key).trim().toUpperCase().slice(0, 40) : '';

    const adminKeysSnap = await getDocs(query(collection(db, 'adminKeys'), limit(500)));
    const allAdminKeyEntries = adminKeysSnap.docs.map((d) => ({
      docId: d.id,
      data: d.data() as AdminKeyRecord,
    }));

    if (isBlock || isRevoke) {
      const keysToRevoke = new Set<string>();
      if (bodyKeyClean) keysToRevoke.add(bodyKeyClean);
      if (existing?.lastKey) {
        const prevKey = existing.lastKey.trim().toUpperCase();
        if (prevKey) keysToRevoke.add(prevKey);
      }

      for (const entry of allAdminKeyEntries) {
        const kRec = entry.data;
        const recDevId = toSafeDocId(normalizeDeviceIdInput(kRec.deviceId));
        const recKeyUpper = String(kRec.key || '').trim().toUpperCase();
        if (recDevId === normId || (bodyKeyClean && recKeyUpper === bodyKeyClean)) {
          if (recKeyUpper) keysToRevoke.add(recKeyUpper);
          try {
            const updatedKeyDoc = buildSafeAdminKeyRecord({
              ...kRec,
              id: entry.docId,
              revoked: true,
              revokedAt: now,
            });
            await setDoc(doc(db, 'adminKeys', entry.docId), updatedKeyDoc);
          } catch (err) {
            if (isFirestoreOfflineError(err)) return null;
            console.warn(`No se pudo actualizar adminKeys/${entry.docId} al revocar:`, err);
          }
        }
      }

      for (const rk of keysToRevoke) {
        const safeKeyId = toSafeDocId(rk).slice(0, 40);
        if (safeKeyId.length < 4) continue;
        try {
          await setDoc(doc(db, 'revokedKeys', safeKeyId), {
            key: safeKeyId,
            deviceId: normId,
            revokedAt: now,
          });
        } catch (err) {
          if (isFirestoreOfflineError(err)) return null;
          console.warn(`No se pudo registrar revokedKeys/${safeKeyId}:`, err);
        }
      }

      if (isBlock) {
        try {
          await setDoc(doc(db, 'blockedDevices', normId), {
            deviceId: normId,
            blockedAt: now,
          });
        } catch (err) {
          if (isFirestoreOfflineError(err)) return null;
          console.warn(`No se pudo registrar blockedDevices/${normId}:`, err);
        }

        const blockedDevice = buildSafeDeviceRecord(
          {
            deviceId: normId,
            cliente:
              clienteClean === 'Cliente sin nombre' && existing?.cliente
                ? existing.cliente
                : clienteClean,
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
            linkedEmail: existingEmail,
          },
          existing,
          now
        );
        try {
          await setDoc(doc(db, 'devices', normId), blockedDevice);
        } catch (err) {
          if (isFirestoreOfflineError(err)) return null;
          handleFirestoreError(err, existing ? OperationType.UPDATE : OperationType.CREATE, `devices/${normId}`);
        }
        return await fetchAllCollectionsSnapshot(now, blockedDevice);
      } else {
        try {
          const existingBlocked = await readServerDoc<{ deviceId: string }>('blockedDevices', normId);
          if (existingBlocked) {
            await deleteDoc(doc(db, 'blockedDevices', normId));
          }
        } catch (err) {
          if (isFirestoreOfflineError(err)) return null;
          console.warn(`No se pudo limpiar blockedDevices/${normId}:`, err);
        }

        const revokedDevice = buildSafeDeviceRecord(
          {
            deviceId: normId,
            cliente:
              clienteClean === 'Cliente sin nombre' && existing?.cliente
                ? existing.cliente
                : clienteClean,
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
            linkedEmail: existingEmail,
          },
          existing,
          now
        );
        try {
          await setDoc(doc(db, 'devices', normId), revokedDevice);
        } catch (err) {
          if (isFirestoreOfflineError(err)) return null;
          handleFirestoreError(err, existing ? OperationType.UPDATE : OperationType.CREATE, `devices/${normId}`);
        }
        return await fetchAllCollectionsSnapshot(now, revokedDevice);
      }
    }

    // Activación o registro de clave
    if (bodyKeyClean) {
      const safeKeyId = toSafeDocId(bodyKeyClean).slice(0, 40);
      if (safeKeyId.length >= 4) {
        try {
          const existingRevKey = await readServerDoc<{ key: string }>('revokedKeys', safeKeyId);
          if (existingRevKey) {
            await deleteDoc(doc(db, 'revokedKeys', safeKeyId));
          }
        } catch (err) {
          if (!isFirestoreOfflineError(err)) {
            console.warn(`No se pudo limpiar revokedKeys/${safeKeyId}:`, err);
          }
        }
      }

      // Evita duplicados en adminKeys con la misma clave y equipo
      for (const entry of allAdminKeyEntries) {
        const oldRec = entry.data;
        if (
          toSafeDocId(normalizeDeviceIdInput(oldRec.deviceId)) === normId &&
          String(oldRec.key || '').trim().toUpperCase() === bodyKeyClean
        ) {
          try {
            await deleteDoc(doc(db, 'adminKeys', entry.docId));
          } catch (err) {
            if (!isFirestoreOfflineError(err)) {
              handleFirestoreError(err, OperationType.DELETE, `adminKeys/${entry.docId}`);
            }
          }
        }
      }

      const keyRecId = toSafeKeyRecordId(`ak-${now}-${Math.random().toString(36).slice(2, 6)}`);
      const safeKeyRec = buildSafeAdminKeyRecord({
        id: keyRecId,
        cliente: clienteClean,
        deviceId: normId,
        planLabel: String(params.planLabel || 'PRO'),
        dias: params.dias ?? null,
        key: bodyKeyClean,
        createdAt: now,
        expiresAt: params.expiresAt ?? null,
        revoked: false,
        revokedAt: null,
        ...(existingEmail ? { linkedEmail: existingEmail } : {}),
      });
      try {
        await setDoc(doc(db, 'adminKeys', keyRecId), safeKeyRec);
      } catch (err) {
        if (isFirestoreOfflineError(err)) return null;
        handleFirestoreError(err, OperationType.CREATE, `adminKeys/${keyRecId}`);
      }
    }

    let nextDevice: CloudDeviceRecord | null = existing;

    if (!params.recordKeyOnly) {
      try {
        const existingBlocked = await readServerDoc<{ deviceId: string }>('blockedDevices', normId);
        if (existingBlocked) {
          await deleteDoc(doc(db, 'blockedDevices', normId));
        }
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          console.warn(`No se pudo limpiar blockedDevices/${normId}:`, err);
        }
      }

      if (params.resetPromoColega && !params.planCode && !params.key) {
        nextDevice = buildSafeDeviceRecord(
          {
            ...(existing || {
              deviceId: normId,
              cliente: clienteClean,
              deviceLabel: 'Equipo Remoto',
              firstSeenAt: now,
              lastSeenAt: now,
              totalSessions: 0,
              totalMinutes: 0,
              activeDays: Array.from(activeDaysSet).sort().slice(-60),
              proActive: false,
              planCode: 'FREE',
              planLabel: 'Versión Gratuita',
              status: 'free',
              expiresAt: null,
              lastKey: '',
              revoked: false,
              revokedAt: null,
              blocked: false,
              blockedAt: null,
              trialActive: false,
              adminAssigned: false,
            }),
            deviceId: normId,
            promo_colega_usada: false,
            fecha_activacion_colega: null,
            updatedAt: now,
          },
          existing,
          now
        );
      } else {
        const planCode = String(params.planCode || 'M');
        const isColleague3d = isColleaguePromoPlan(planCode, params.dias ?? null, bodyKeyClean);
        const promoColegaUsedNext = params.resetPromoColega
          ? false
          : Boolean(existing?.promo_colega_usada) || isColleague3d;
        const fechaActivacionColegaNext = params.resetPromoColega
          ? null
          : isColleague3d
            ? existing?.fecha_activacion_colega ?? now
            : existing?.fecha_activacion_colega ?? null;

        nextDevice = buildSafeDeviceRecord(
          {
            deviceId: normId,
            cliente:
              clienteClean === 'Cliente sin nombre' && existing?.cliente
                ? existing.cliente
                : clienteClean,
            deviceLabel: existing?.deviceLabel || 'Equipo Remoto',
            firstSeenAt: existing?.firstSeenAt ?? now,
            lastSeenAt: existing?.lastSeenAt ?? now,
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
            promo_colega_usada: promoColegaUsedNext,
            fecha_activacion_colega: fechaActivacionColegaNext,
            linkedEmail: existingEmail,
          },
          existing,
          now
        );
      }
      try {
        await setDoc(doc(db, 'devices', normId), nextDevice);
      } catch (err) {
        if (isFirestoreOfflineError(err)) return null;
        handleFirestoreError(err, existing ? OperationType.UPDATE : OperationType.CREATE, `devices/${normId}`);
      }
    } else if (!existing) {
      nextDevice = buildSafeDeviceRecord(
        {
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
          linkedEmail: existingEmail,
        },
        null,
        now
      );
      try {
        await setDoc(doc(db, 'devices', normId), nextDevice);
      } catch (err) {
        if (isFirestoreOfflineError(err)) return null;
        handleFirestoreError(err, OperationType.CREATE, `devices/${normId}`);
      }
    } else if (bodyKeyClean) {
      nextDevice = buildSafeDeviceRecord(
        {
          ...existing,
          deviceId: normId,
          cliente: clienteClean !== 'Cliente sin nombre' ? clienteClean : existing.cliente,
          lastKey: bodyKeyClean,
          revoked: false,
          revokedAt: null,
          updatedAt: now,
          linkedEmail: existingEmail,
        },
        existing,
        now
      );
      try {
        await setDoc(doc(db, 'devices', normId), nextDevice);
      } catch (err) {
        if (isFirestoreOfflineError(err)) return null;
        handleFirestoreError(err, OperationType.UPDATE, `devices/${normId}`);
      }
    }

    return await fetchAllCollectionsSnapshot(now, nextDevice);
  } catch (err) {
    if (isFirestoreOfflineError(err)) return null;
    throw err;
  }
}

export async function deleteAdminKeyInCloud(params: {
  id?: string;
  deviceId: string;
  key?: string;
  deleteDevice?: boolean;
}): Promise<CloudSyncSnapshot | null> {
  if (FIREBASE_DB_URL.trim()) {
    return await deleteAdminKeyRtdb(FIREBASE_DB_URL, params);
  }
  const idClean = typeof params.id === 'string' ? params.id.trim() : '';
  const deviceClean = toSafeDocId(normalizeDeviceIdInput(String(params.deviceId || '')));
  const keyClean = typeof params.key === 'string' ? params.key.trim().toUpperCase() : '';
  const deleteDevice = Boolean(params.deleteDevice);

  if (!idClean && !deviceClean) return null;

  try {
    const adminKeysSnap = await getDocs(query(collection(db, 'adminKeys'), limit(500)));
    for (const d of adminKeysSnap.docs) {
      const item = d.data() as AdminKeyRecord;
      const itemDev = toSafeDocId(normalizeDeviceIdInput(item.deviceId));
      const itemKey = String(item.key || '').trim().toUpperCase();
      const shouldDelete =
        (idClean && (d.id === idClean || item.id === idClean)) ||
        (deleteDevice && deviceClean && itemDev === deviceClean) ||
        (deviceClean && keyClean && itemDev === deviceClean && itemKey === keyClean);
      if (shouldDelete) {
        try {
          await deleteDoc(doc(db, 'adminKeys', d.id));
        } catch (err) {
          if (!isFirestoreOfflineError(err)) {
            handleFirestoreError(err, OperationType.DELETE, `adminKeys/${d.id}`);
          }
        }
      }
    }

    if (deleteDevice && deviceClean) {
      try {
        await deleteDoc(doc(db, 'devices', deviceClean));
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.DELETE, `devices/${deviceClean}`);
        }
      }
      try {
        await deleteDoc(doc(db, 'blockedDevices', deviceClean));
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.DELETE, `blockedDevices/${deviceClean}`);
        }
      }
    }

    return await fetchAllCollectionsSnapshot(Date.now());
  } catch (err) {
    if (isFirestoreOfflineError(err)) return null;
    throw err;
  }
}

export function subscribeCloudDevices(
  onSync: (snapshot: CloudSyncSnapshot) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  if (FIREBASE_DB_URL.trim()) {
    return subscribeRtdbDevices(FIREBASE_DB_URL, onSync, onStatusChange);
  }
  if (typeof window === 'undefined') {
    onStatusChange?.(false);
    return () => {};
  }

  let closed = false;
  let rawDevices: CloudDeviceRecord[] = [];
  let rawAdminKeys: AdminKeyRecord[] = [];
  let revokedKeysList: string[] = [];
  let blockedDeviceIds = new Set<string>();
  let emitTimer: number | null = null;

  const scheduleEmit = () => {
    if (closed) return;
    if (emitTimer !== null) window.clearTimeout(emitTimer);
    emitTimer = window.setTimeout(() => {
      if (closed) return;
      onStatusChange?.(true);
      onSync(
        buildNormalizedSnapshot({
          rawDevices,
          rawAdminKeys,
          revokedKeysList,
          blockedDeviceIds,
          now: Date.now(),
        })
      );
    }, 60);
  };

  const unsubDevices = onSnapshot(
    query(collection(db, 'devices'), limit(500)),
    (snap) => {
      rawDevices = snap.docs.map((d) => d.data() as CloudDeviceRecord);
      scheduleEmit();
    },
    (error) => {
      onStatusChange?.(false);
      handleFirestoreError(error, OperationType.LIST, 'devices');
    }
  );

  const unsubKeys = onSnapshot(
    query(collection(db, 'adminKeys'), limit(500)),
    (snap) => {
      rawAdminKeys = snap.docs.map((d) => d.data() as AdminKeyRecord);
      scheduleEmit();
    },
    (error) => {
      onStatusChange?.(false);
      handleFirestoreError(error, OperationType.LIST, 'adminKeys');
    }
  );

  const unsubRevoked = onSnapshot(
    query(collection(db, 'revokedKeys'), limit(500)),
    (snap) => {
      revokedKeysList = snap.docs
        .map((d) => String((d.data() as { key?: string }).key || d.id || '').trim().toUpperCase())
        .filter(Boolean);
      scheduleEmit();
    },
    (error) => {
      onStatusChange?.(false);
      handleFirestoreError(error, OperationType.LIST, 'revokedKeys');
    }
  );

  const unsubBlocked = onSnapshot(
    query(collection(db, 'blockedDevices'), limit(500)),
    (snap) => {
      blockedDeviceIds = new Set(
        snap.docs
          .map((d) => toSafeDocId(String((d.data() as { deviceId?: string }).deviceId || d.id || '')))
          .filter(Boolean)
      );
      scheduleEmit();
    },
    (error) => {
      onStatusChange?.(false);
      handleFirestoreError(error, OperationType.LIST, 'blockedDevices');
    }
  );

  return () => {
    closed = true;
    if (emitTimer !== null) window.clearTimeout(emitTimer);
    unsubDevices();
    unsubKeys();
    unsubRevoked();
    unsubBlocked();
  };
}

export async function verifyAdminPasswordWithServer(
  password: string
): Promise<{ ok: boolean; offline?: boolean; error?: string }> {
  if (FIREBASE_DB_URL.trim()) {
    return await verifyAdminPasswordRtdb(FIREBASE_DB_URL, password);
  }
  const candidate = password.trim();
  if (!candidate) {
    return { ok: false, error: 'Contraseña incorrecta' };
  }
  try {
    const cfg = await readServerDoc<{
      adminPasswordSalt?: string;
      adminPasswordHash?: string;
    }>('config', 'admin');
    if (cfg && cfg.adminPasswordSalt && cfg.adminPasswordHash) {
      const candidateHash = await sha256Hex(`${cfg.adminPasswordSalt}:${candidate}`);
      if (candidateHash === cfg.adminPasswordHash) {
        return { ok: true };
      }
      return { ok: false, error: 'Contraseña incorrecta' };
    }
    if (verifyAdminPassword(candidate)) {
      return { ok: true };
    }
    return { ok: false, error: 'Contraseña incorrecta' };
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return { ok: false, offline: true };
    }
    throw err;
  }
}

export async function resetAdminPasswordWithServer(
  pin: string,
  newPassword: string
): Promise<{ ok: boolean; offline?: boolean; error?: string }> {
  if (FIREBASE_DB_URL.trim()) {
    return await resetAdminPasswordRtdb(FIREBASE_DB_URL, pin, newPassword);
  }
  const cleanPin = pin.trim();
  const cleanNew = newPassword.trim();
  if (!verifyRecoveryPin(cleanPin)) {
    return { ok: false, error: 'PIN de recuperación incorrecto' };
  }
  if (cleanNew.length < 4) {
    return { ok: false, error: 'La nueva contraseña debe tener al menos 4 caracteres' };
  }

  try {
    const salt = randomHex(16);
    const hash = await sha256Hex(`${salt}:${cleanNew}`);
    await setDoc(doc(db, 'config', 'admin'), {
      adminPasswordSalt: salt,
      adminPasswordHash: hash,
      updatedAt: Date.now(),
    });
    return { ok: true };
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return { ok: false, offline: true };
    }
    handleFirestoreError(err, OperationType.WRITE, 'config/admin');
  }
}

export interface CloudAccountAuthResult {
  ok: boolean;
  offline?: boolean;
  sessionExpired?: boolean;
  error?: string;
  email?: string;
  sessionToken?: string;
  licencia?: LicenciaState | null;
  backup?: CloudAccountBackupPayload | null;
  lastBackedUpAt?: number | null;
  replacedPreviousDevice?: boolean;
  snapshot?: CloudSyncSnapshot;
}

export interface CloudAccountBackupResult {
  ok: boolean;
  offline?: boolean;
  sessionExpired?: boolean;
  error?: string;
  updatedAt?: number;
}

interface FirestoreCloudAccountDoc {
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
  backup: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
  lastBackedUpAt: number | null;
}

function sanitizeBackupForFirestore(
  backup: CloudAccountBackupPayload | null | undefined
): Record<string, unknown> | null {
  if (!backup || typeof backup !== 'object') return null;
  const cleaned = cleanForFirestore(backup) as unknown as Record<string, unknown>;
  try {
    const size = JSON.stringify(cleaned).length;
    if (size > 850_000 && Array.isArray(cleaned.notas)) {
      cleaned.notas = (cleaned.notas as Array<Record<string, unknown>>).map((n) => {
        const copy = { ...n };
        delete copy.fotoDataUrl;
        return copy;
      });
    }
  } catch {
    // ignorar estimación de tamaño
  }
  return cleaned;
}

export async function registerCloudAccount(params: {
  email: string;
  password: string;
  deviceId: string;
  licencia: LicenciaState | null;
  backup: CloudAccountBackupPayload;
}): Promise<CloudAccountAuthResult> {
  if (FIREBASE_DB_URL.trim()) {
    return await registerCloudAccountRtdb(FIREBASE_DB_URL, params);
  }
  const email = normalizeEmail(params.email);
  const password = String(params.password || '');
  const deviceId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  const now = Date.now();

  if (!isValidEmailFormat(email)) {
    return { ok: false, error: 'Ingresa un correo electrónico válido.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }
  if (!deviceId) {
    return { ok: false, error: 'ID de dispositivo requerido.' };
  }

  try {
    const accountId = await sha256Hex(email);
    const existingAcc = await readServerDoc<FirestoreCloudAccountDoc>('accounts', accountId);
    if (existingAcc) {
      return {
        ok: false,
        error: 'Este correo ya tiene una cuenta registrada. Usa "Iniciar sesión" para recuperar tu respaldo.',
      };
    }

    const lic = params.licencia ?? null;
    if (!isEligibleForCloudBackup(lic, false, now)) {
      return {
        ok: false,
        error: 'El respaldo en la nube es un beneficio exclusivo de los planes PRO de 90 días y 1 año.',
      };
    }

    const salt = randomHex(16);
    const hash = await sha256Hex(`${salt}:${password}`);
    const sessionToken = randomHex(24);
    const cleanLic = {
      active: true,
      planCode: String(lic!.planCode),
      planLabel: String(lic!.planLabel),
      expiresAt: lic!.expiresAt ?? null,
      activatedAt: Number(lic!.activatedAt || now),
    };
    const safeBackup = sanitizeBackupForFirestore(params.backup);

    const newAccount: FirestoreCloudAccountDoc = cleanForFirestore({
      email,
      passwordSalt: salt,
      passwordHash: hash,
      activeDeviceId: deviceId,
      activeSessionToken: sessionToken,
      licencia: cleanLic,
      backup: safeBackup,
      createdAt: now,
      updatedAt: now,
      lastBackedUpAt: safeBackup ? now : null,
    });

    try {
      await setDoc(doc(db, 'accounts', accountId), newAccount);
    } catch (err) {
      if (isFirestoreOfflineError(err)) {
        return {
          ok: false,
          offline: true,
          error: 'Sin conexión con la base de datos en la nube.',
        };
      }
      handleFirestoreError(err, OperationType.CREATE, `accounts/${accountId}`);
    }

    const existingDev = await readServerDoc<CloudDeviceRecord>('devices', deviceId);
    const today = new Date(now).toISOString().slice(0, 10);
    const updatedDev = buildSafeDeviceRecord(
      {
        deviceId,
        cliente: existingDev?.cliente || '',
        deviceLabel: existingDev?.deviceLabel || detectDeviceLabel(),
        firstSeenAt: existingDev?.firstSeenAt ?? now,
        lastSeenAt: now,
        totalSessions: existingDev?.totalSessions ?? 1,
        totalMinutes: existingDev?.totalMinutes ?? 1,
        activeDays:
          Array.isArray(existingDev?.activeDays) && existingDev.activeDays.length > 0
            ? existingDev.activeDays
            : [today],
        proActive: true,
        planCode: cleanLic.planCode,
        planLabel: cleanLic.planLabel,
        expiresAt: cleanLic.expiresAt,
        lastKey: existingDev?.lastKey || '',
        updatedAt: now,
        revoked: false,
        revokedAt: null,
        blocked: false,
        blockedAt: null,
        trialActive: false,
        adminAssigned: true,
        linkedEmail: email,
      },
      existingDev,
      now
    );

    try {
      await setDoc(doc(db, 'devices', deviceId), updatedDev);
    } catch (err) {
      if (!isFirestoreOfflineError(err)) {
        handleFirestoreError(err, existingDev ? OperationType.UPDATE : OperationType.CREATE, `devices/${deviceId}`);
      }
    }

    const adminKeysSnap = await getDocs(query(collection(db, 'adminKeys'), limit(500)));
    for (const d of adminKeysSnap.docs) {
      const k = d.data() as AdminKeyRecord;
      if (toSafeDocId(normalizeDeviceIdInput(k.deviceId)) === deviceId) {
        try {
          await updateDoc(doc(db, 'adminKeys', d.id), { linkedEmail: email });
        } catch (err) {
          if (!isFirestoreOfflineError(err)) {
            handleFirestoreError(err, OperationType.UPDATE, `adminKeys/${d.id}`);
          }
        }
      }
    }

    const snapshot = await fetchAllCollectionsSnapshot(now, updatedDev);

    return {
      ok: true,
      email,
      sessionToken,
      licencia: cleanLic,
      lastBackedUpAt: newAccount.lastBackedUpAt,
      snapshot,
    };
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return {
        ok: false,
        offline: true,
        error: 'Sin conexión con el servidor de respaldo en la nube.',
      };
    }
    throw err;
  }
}

export async function loginCloudAccount(params: {
  email: string;
  password: string;
  deviceId: string;
  licencia: LicenciaState | null;
}): Promise<CloudAccountAuthResult> {
  if (FIREBASE_DB_URL.trim()) {
    return await loginCloudAccountRtdb(FIREBASE_DB_URL, params);
  }
  const email = normalizeEmail(params.email);
  const password = String(params.password || '');
  const deviceId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  const now = Date.now();

  if (!isValidEmailFormat(email) || !password || !deviceId) {
    return { ok: false, error: 'Ingresa tu correo y contraseña completos.' };
  }

  try {
    const accountId = await sha256Hex(email);
    const acc = await readServerDoc<FirestoreCloudAccountDoc>('accounts', accountId);
    if (!acc) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }

    const expectedHash = await sha256Hex(`${acc.passwordSalt}:${password}`);
    if (expectedHash !== acc.passwordHash) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }

    const accountLicValid = isEligibleForCloudBackup(acc.licencia, false, now);
    const clientLicValid = isEligibleForCloudBackup(params.licencia ?? null, false, now);
    const effectiveLic = accountLicValid
      ? acc.licencia
      : clientLicValid
        ? {
            active: true,
            planCode: String(params.licencia!.planCode),
            planLabel: String(params.licencia!.planLabel),
            expiresAt: params.licencia!.expiresAt ?? null,
            activatedAt: Number(params.licencia!.activatedAt || now),
          }
        : null;

    if (!effectiveLic) {
      return {
        ok: false,
        error: 'Tu plan PRO de 90 días o 1 año expiró o fue revocado. Activa un plan vigente para recuperar tu cuenta.',
      };
    }

    const prevDeviceId =
      acc.activeDeviceId && toSafeDocId(normalizeDeviceIdInput(acc.activeDeviceId)) !== deviceId
        ? toSafeDocId(normalizeDeviceIdInput(acc.activeDeviceId))
        : null;

    if (prevDeviceId) {
      const prevDev = await readServerDoc<CloudDeviceRecord>('devices', prevDeviceId);
      const movedRecord = buildSafeDeviceRecord(
        {
          deviceId: prevDeviceId,
          cliente: prevDev?.cliente || 'Cliente sin nombre',
          deviceLabel: prevDev?.deviceLabel || 'Equipo anterior',
          firstSeenAt: prevDev?.firstSeenAt ?? now,
          lastSeenAt: prevDev?.lastSeenAt ?? now,
          totalSessions: prevDev?.totalSessions ?? 1,
          totalMinutes: prevDev?.totalMinutes ?? 1,
          activeDays: Array.isArray(prevDev?.activeDays) ? prevDev.activeDays : [],
          proActive: false,
          planCode: 'SESSION_MOVED',
          planLabel: 'Sesión cerrada (iniciada en otro celular)',
          expiresAt: null,
          lastKey: '',
          updatedAt: now,
          revoked: false,
          blocked: false,
          trialActive: false,
          adminAssigned: false,
        },
        prevDev,
        now
      );
      try {
        await setDoc(doc(db, 'devices', prevDeviceId), movedRecord);
      } catch (err) {
        if (!isFirestoreOfflineError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, `devices/${prevDeviceId}`);
        }
      }
    }

    const sessionToken = randomHex(24);
    try {
      await updateDoc(doc(db, 'accounts', accountId), cleanForFirestore({
        activeDeviceId: deviceId,
        activeSessionToken: sessionToken,
        licencia: effectiveLic,
        updatedAt: now,
      }));
    } catch (err) {
      if (isFirestoreOfflineError(err)) {
        return {
          ok: false,
          offline: true,
          error: 'Sin conexión con la base de datos en la nube.',
        };
      }
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${accountId}`);
    }

    const existingDev = await readServerDoc<CloudDeviceRecord>('devices', deviceId);
    const today = new Date(now).toISOString().slice(0, 10);
    const nextDev = buildSafeDeviceRecord(
      {
        deviceId,
        cliente: existingDev?.cliente || '',
        deviceLabel: existingDev?.deviceLabel || detectDeviceLabel(),
        firstSeenAt: existingDev?.firstSeenAt ?? now,
        lastSeenAt: now,
        totalSessions: existingDev?.totalSessions ?? 1,
        totalMinutes: existingDev?.totalMinutes ?? 1,
        activeDays:
          Array.isArray(existingDev?.activeDays) && existingDev.activeDays.length > 0
            ? existingDev.activeDays
            : [today],
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
      },
      existingDev,
      now
    );

    try {
      await setDoc(doc(db, 'devices', deviceId), nextDev);
    } catch (err) {
      if (!isFirestoreOfflineError(err)) {
        handleFirestoreError(err, existingDev ? OperationType.UPDATE : OperationType.CREATE, `devices/${deviceId}`);
      }
    }

    const snapshot = await fetchAllCollectionsSnapshot(now, nextDev);

    return {
      ok: true,
      email,
      sessionToken,
      licencia: effectiveLic,
      backup: (acc.backup as CloudAccountBackupPayload | null) ?? null,
      lastBackedUpAt: acc.lastBackedUpAt,
      replacedPreviousDevice: Boolean(prevDeviceId),
      snapshot,
    };
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return {
        ok: false,
        offline: true,
        error: 'Sin conexión con el servidor de respaldo en la nube.',
      };
    }
    throw err;
  }
}

export async function uploadCloudAccountBackup(params: {
  email: string;
  sessionToken: string;
  deviceId: string;
  licencia: LicenciaState | null;
  backup: CloudAccountBackupPayload;
}): Promise<CloudAccountBackupResult> {
  if (FIREBASE_DB_URL.trim()) {
    return await uploadCloudAccountBackupRtdb(FIREBASE_DB_URL, params);
  }
  const email = normalizeEmail(params.email);
  const deviceId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  const now = Date.now();

  if (!email || !params.sessionToken || !deviceId) {
    return { ok: false, error: 'Datos de sesión incompletos.' };
  }

  try {
    const accountId = await sha256Hex(email);
    const acc = await readServerDoc<FirestoreCloudAccountDoc>('accounts', accountId);
    if (
      !acc ||
      acc.activeSessionToken !== params.sessionToken ||
      toSafeDocId(normalizeDeviceIdInput(acc.activeDeviceId)) !== deviceId
    ) {
      return {
        ok: false,
        sessionExpired: true,
        error: 'Tu sesión se cerró porque iniciaste sesión en otro dispositivo.',
      };
    }

    const safeBackup = sanitizeBackupForFirestore(params.backup);
    await updateDoc(doc(db, 'accounts', accountId), cleanForFirestore({
      backup: safeBackup,
      updatedAt: now,
      lastBackedUpAt: now,
      ...(params.licencia && isEligibleForCloudBackup(params.licencia, false, now)
        ? {
            licencia: {
              active: true,
              planCode: String(params.licencia.planCode),
              planLabel: String(params.licencia.planLabel),
              expiresAt: params.licencia.expiresAt ?? null,
              activatedAt: Number(params.licencia.activatedAt || now),
            },
          }
        : {}),
    }));

    return { ok: true, updatedAt: now };
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return { ok: false, offline: true };
    }
    handleFirestoreError(err, OperationType.UPDATE, `accounts/${email}`);
  }
}

export async function checkCloudAccountSession(params: {
  email: string;
  sessionToken: string;
  deviceId: string;
}): Promise<CloudAccountBackupResult> {
  if (FIREBASE_DB_URL.trim()) {
    return await checkCloudAccountSessionRtdb(FIREBASE_DB_URL, params);
  }
  const email = normalizeEmail(params.email);
  const deviceId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  if (!email || !params.sessionToken || !deviceId) {
    return { ok: false, sessionExpired: true };
  }

  try {
    const accountId = await sha256Hex(email);
    const acc = await readServerDoc<FirestoreCloudAccountDoc>('accounts', accountId);
    if (
      !acc ||
      acc.activeSessionToken !== params.sessionToken ||
      toSafeDocId(normalizeDeviceIdInput(acc.activeDeviceId)) !== deviceId
    ) {
      return {
        ok: false,
        sessionExpired: true,
        error: 'Tu sesión se cerró porque iniciaste sesión en otro celular.',
      };
    }
    return { ok: true, updatedAt: acc.lastBackedUpAt ?? acc.updatedAt };
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return { ok: false, offline: true };
    }
    throw err;
  }
}

export async function logoutCloudAccount(params: {
  email: string;
  sessionToken: string;
  deviceId: string;
}): Promise<void> {
  if (FIREBASE_DB_URL.trim()) {
    await logoutCloudAccountRtdb(FIREBASE_DB_URL, params);
    return;
  }
  const email = normalizeEmail(params.email);
  const deviceId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  if (!email || !params.sessionToken || !deviceId) return;

  try {
    const accountId = await sha256Hex(email);
    const acc = await readServerDoc<FirestoreCloudAccountDoc>('accounts', accountId);
    if (
      acc &&
      acc.activeSessionToken === params.sessionToken &&
      toSafeDocId(normalizeDeviceIdInput(acc.activeDeviceId)) === deviceId
    ) {
      await updateDoc(doc(db, 'accounts', accountId), {
        activeSessionToken: null,
        updatedAt: Date.now(),
      });
    }
  } catch {
    // ignorar si está sin conexión
  }
}

interface PromoStatsDoc {
  total: number;
  updatedAt: number;
}

export async function fetchPromocionesEnviadasCount(): Promise<number> {
  if (FIREBASE_DB_URL.trim()) {
    try {
      const total = await fetchPromocionesEnviadasRtdb(FIREBASE_DB_URL);
      saveCachedPromoCount(total);
      return total;
    } catch {
      return loadCachedPromoCount();
    }
  }

  const ref = doc(db, 'stats', 'promociones_enviadas');
  try {
    const snap = await getDocFromServer(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<PromoStatsDoc>;
      const total = typeof data.total === 'number' && Number.isFinite(data.total) && data.total >= 1
        ? Math.round(data.total)
        : 1;
      saveCachedPromoCount(total);
      return total;
    }

    // Inicializar en 1 si aún no existe en Firebase
    const initializedTotal = await runTransaction(db, async (tx) => {
      const txSnap = await tx.get(ref);
      if (txSnap.exists()) {
        const existingData = txSnap.data() as Partial<PromoStatsDoc>;
        if (typeof existingData.total === 'number' && existingData.total >= 1) {
          return Math.round(existingData.total);
        }
      }
      const now = Date.now();
      tx.set(ref, { total: 1, updatedAt: now });
      return 1;
    });
    saveCachedPromoCount(initializedTotal);
    return initializedTotal;
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      try {
        const cached = await getDoc(ref);
        if (cached.exists()) {
          const data = cached.data() as Partial<PromoStatsDoc>;
          if (typeof data.total === 'number' && data.total >= 1) {
            return Math.round(data.total);
          }
        }
      } catch {
        // fallback a caché local
      }
      return loadCachedPromoCount();
    }
    console.warn('No se pudo leer stats/promociones_enviadas:', err);
    return loadCachedPromoCount();
  }
}

export async function incrementPromocionesEnviadasCount(): Promise<number> {
  if (FIREBASE_DB_URL.trim()) {
    try {
      const next = await incrementPromocionesEnviadasRtdb(FIREBASE_DB_URL);
      saveCachedPromoCount(next);
      return next;
    } catch {
      const fallback = loadCachedPromoCount() + 1;
      saveCachedPromoCount(fallback);
      return fallback;
    }
  }

  const ref = doc(db, 'stats', 'promociones_enviadas');
  try {
    const nextTotal = await runTransaction(db, async (tx) => {
      const txSnap = await tx.get(ref);
      const now = Date.now();
      if (!txSnap.exists()) {
        tx.set(ref, { total: 2, updatedAt: now });
        return 2;
      }
      const data = txSnap.data() as Partial<PromoStatsDoc>;
      const current =
        typeof data.total === 'number' && Number.isFinite(data.total) && data.total >= 1
          ? Math.round(data.total)
          : 1;
      const updated = current + 1;
      tx.update(ref, { total: updated, updatedAt: now });
      return updated;
    });
    saveCachedPromoCount(nextTotal);
    return nextTotal;
  } catch (err) {
    if (!isFirestoreOfflineError(err)) {
      console.warn('No se pudo incrementar stats/promociones_enviadas:', err);
    }
    const fallback = loadCachedPromoCount() + 1;
    saveCachedPromoCount(fallback);
    return fallback;
  }
}

// ==================== PERFIL DE MI TALLER EN FIRESTORE ====================

export async function syncTallerProfileToCloud(params: {
  deviceId: string;
  nombre: string;
  responsable: string;
  tel: string;
  termsAcceptedAt?: number | null;
  preferredTheme?: AppTheme;
  preferredSkin?: AppSkin;
}): Promise<void> {
  const normId = toSafeDocId(normalizeDeviceIdInput(params.deviceId));
  if (!normId) return;
  const nombre = String(params.nombre || '').trim().slice(0, 120);
  const responsable = String(params.responsable || '').trim().slice(0, 120);
  const tel = String(params.tel || '').trim().slice(0, 40);
  const now = Date.now();

  try {
    const existing = await readServerDoc<CloudDeviceRecord>('devices', normId);
    const nextRecord = buildSafeDeviceRecord(
      {
        ...(existing || { deviceId: normId }),
        deviceId: normId,
        cliente: nombre || existing?.cliente || '',
        tallerNombre: nombre,
        tallerResponsable: responsable,
        tallerWhatsapp: tel,
        ...(params.termsAcceptedAt !== undefined ? { termsAcceptedAt: params.termsAcceptedAt } : {}),
        ...(params.preferredTheme ? { preferredTheme: params.preferredTheme } : {}),
        ...(params.preferredSkin ? { preferredSkin: params.preferredSkin } : {}),
        lastSeenAt: now,
        updatedAt: existing?.updatedAt ?? now,
      },
      existing,
      now
    );
    await setDoc(doc(db, 'devices', normId), nextRecord);
  } catch (err) {
    if (isFirestoreOfflineError(err)) return;
    console.warn('No se pudo sincronizar perfil de Mi Taller:', err);
  }
}

// ==================== VIDEO TUTORIALES EN FIRESTORE ====================

const VALID_VIDEO_CATS = new Set<TutorialVideoCategory>([
  'primeros-pasos',
  'ventanas-puertas',
  'optimizacion-vidrio',
  'cotizaciones-pdf',
]);

function normalizeTutorialVideoDoc(raw: Partial<TutorialVideoItem>, docId: string): TutorialVideoItem {
  const now = Date.now();
  const safeId = toSafeKeyRecordId(raw.id || docId);
  const cat = VALID_VIDEO_CATS.has(raw.categoria as TutorialVideoCategory)
    ? (raw.categoria as TutorialVideoCategory)
    : 'primeros-pasos';
  return {
    id: safeId,
    titulo: String(raw.titulo || 'Video Tutorial').trim().slice(0, 140) || 'Video Tutorial',
    categoria: cat,
    descripcion: String(raw.descripcion || '').trim().slice(0, 500),
    url: String(raw.url || '').trim().slice(0, 500),
    orden: Math.max(0, Math.min(10000, Math.round(Number(raw.orden) || 0))),
    createdAt: Number(raw.createdAt) || now,
    updatedAt: Number(raw.updatedAt) || now,
  };
}

export async function fetchTutorialVideosCloud(): Promise<TutorialVideoItem[]> {
  try {
    const snap = await getDocs(query(collection(db, 'tutorial_videos'), limit(200)));
    const list = snap.docs
      .map((d) => normalizeTutorialVideoDoc(d.data() as Partial<TutorialVideoItem>, d.id))
      .filter((v) => v.url.length >= 8)
      .sort((a, b) => a.orden - b.orden || b.updatedAt - a.updatedAt);
    saveTutorialVideosCache(list);
    return list;
  } catch (err) {
    if (isFirestoreOfflineError(err)) {
      return loadTutorialVideosCache();
    }
    console.warn('No se pudo leer tutorial_videos:', err);
    return loadTutorialVideosCache();
  }
}

export function subscribeTutorialVideos(
  onUpdate: (videos: TutorialVideoItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, 'tutorial_videos'), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => normalizeTutorialVideoDoc(d.data() as Partial<TutorialVideoItem>, d.id))
        .filter((v) => v.url.length >= 8)
        .sort((a, b) => a.orden - b.orden || b.updatedAt - a.updatedAt);
      saveTutorialVideosCache(list);
      onUpdate(list);
    },
    (err) => {
      if (!isFirestoreOfflineError(err)) {
        console.warn('Error en suscripción tutorial_videos:', err);
      }
      onError?.(err);
    }
  );
}

export async function saveTutorialVideoCloud(input: {
  id?: string;
  titulo: string;
  categoria: TutorialVideoCategory;
  descripcion: string;
  url: string;
  orden?: number;
  createdAt?: number;
}): Promise<TutorialVideoItem> {
  const now = Date.now();
  const safeId = toSafeKeyRecordId(
    input.id || `vid-${now}-${Math.random().toString(36).slice(2, 6)}`
  );
  const cat: TutorialVideoCategory = VALID_VIDEO_CATS.has(input.categoria)
    ? input.categoria
    : 'primeros-pasos';

  const payload: TutorialVideoItem = {
    id: safeId,
    titulo: String(input.titulo || '').trim().slice(0, 140),
    categoria: cat,
    descripcion: String(input.descripcion || '').trim().slice(0, 500),
    url: String(input.url || '').trim().slice(0, 500),
    orden: Math.max(0, Math.min(10000, Math.round(Number(input.orden) || 0))),
    createdAt: Number(input.createdAt) || now,
    updatedAt: now,
  };

  const path = `tutorial_videos/${safeId}`;
  try {
    await setDoc(doc(db, 'tutorial_videos', safeId), payload);
  } catch (err) {
    if (!isFirestoreOfflineError(err)) {
      handleFirestoreError(err, input.id ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  }
  return payload;
}

export async function deleteTutorialVideoCloud(videoId: string): Promise<void> {
  const safeId = toSafeKeyRecordId(videoId);
  if (!safeId) return;
  const path = `tutorial_videos/${safeId}`;
  try {
    await deleteDoc(doc(db, 'tutorial_videos', safeId));
  } catch (err) {
    if (!isFirestoreOfflineError(err)) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

// ==================== PRECIOS DE REFERENCIA SEMANALES (FIRESTORE) ====================

function normalizeReferencePricesDoc(
  raw: Partial<ReferencePricesDoc> | null | undefined
): ReferencePricesDoc {
  const now = Date.now();
  const items: ReferencePriceItem[] =
    Array.isArray(raw?.items) && raw.items.length > 0
      ? raw.items.slice(0, 100).map((it, idx) => ({
          id: String(it?.id || `ref-${idx}`).slice(0, 60),
          categoria:
            it?.categoria === 'vidrio' || it?.categoria === 'herrajes' ? it.categoria : 'aluminio',
          nombre: String(it?.nombre || 'Concepto').trim().slice(0, 100),
          unidad: String(it?.unidad || 'm²').trim().slice(0, 24),
          precioSugerido: Math.max(0, Math.round(Number(it?.precioSugerido) || 0)),
          ...(it?.lineaId ? { lineaId: it.lineaId } : {}),
          ...(it?.rellenoKey ? { rellenoKey: String(it.rellenoKey).slice(0, 60) } : {}),
        }))
      : DEFAULT_REFERENCE_PRICES.items;

  return {
    updatedAt: Number(raw?.updatedAt) || now,
    updatedLabel:
      String(raw?.updatedLabel || '').trim().slice(0, 80) ||
      `Actualizado ${new Date(now).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    nota: String(raw?.nota || DEFAULT_REFERENCE_PRICES.nota).trim().slice(0, 500),
    items,
  };
}

export async function saveReferencePricesCloud(input: {
  updatedLabel: string;
  nota?: string;
  items: ReferencePriceItem[];
}): Promise<ReferencePricesDoc> {
  const now = Date.now();
  const payload: ReferencePricesDoc = normalizeReferencePricesDoc({
    updatedAt: now,
    updatedLabel: input.updatedLabel,
    nota: input.nota || DEFAULT_REFERENCE_PRICES.nota,
    items: input.items,
  });
  saveReferencePricesCache(payload);
  try {
    await setDoc(
      doc(db, 'reference_prices', 'master'),
      cleanForFirestore({ id: 'master', ...payload })
    );
  } catch (err) {
    if (!isFirestoreOfflineError(err)) {
      handleFirestoreError(err, OperationType.UPDATE, 'reference_prices/master');
    }
  }
  return payload;
}

export function subscribeReferencePrices(
  onUpdate: (docData: ReferencePricesDoc) => void,
  onError?: (err: unknown) => void
): () => void {
  const ref = doc(db, 'reference_prices', 'master');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const normalized = normalizeReferencePricesDoc(snap.data() as Partial<ReferencePricesDoc>);
        saveReferencePricesCache(normalized);
        onUpdate(normalized);
      } else {
        const fallback = loadReferencePricesCache() || normalizeReferencePricesDoc(null);
        onUpdate(fallback);
      }
    },
    (err) => {
      if (!isFirestoreOfflineError(err)) {
        console.warn('Error en suscripción reference_prices:', err);
      }
      const fallback = loadReferencePricesCache() || normalizeReferencePricesDoc(null);
      onUpdate(fallback);
      onError?.(err);
    }
  );
}

// ==================== MENSAJES / AVISOS DEL ADMINISTRADOR (FIRESTORE) ====================

function normalizeAdminMessage(raw: Partial<AdminMessageItem>, docId: string): AdminMessageItem {
  const now = Date.now();
  const safeId = toSafeKeyRecordId(raw.id || docId);
  const tipo: AdminMessageType =
    raw.tipo === 'promo' || raw.tipo === 'soporte' ? raw.tipo : 'aviso';
  const targetMode = raw.targetMode === 'individual' ? 'individual' : 'all';
  const result: AdminMessageItem = {
    id: safeId,
    titulo: String(raw.titulo || 'Aviso de Aluminero Pro').trim().slice(0, 120) || 'Aviso de Aluminero Pro',
    cuerpo: String(raw.cuerpo || '').trim().slice(0, 1000),
    tipo,
    targetMode,
    createdAt: Number(raw.createdAt) || now,
  };
  if (targetMode === 'individual' && raw.targetDeviceId) {
    result.targetDeviceId = normalizeDeviceIdInput(String(raw.targetDeviceId)).slice(0, 64);
  }
  if (raw.targetLabel) {
    result.targetLabel = String(raw.targetLabel).trim().slice(0, 120);
  }
  return result;
}

export async function sendAdminMessageCloud(input: {
  titulo: string;
  cuerpo: string;
  tipo: AdminMessageType;
  targetMode: 'all' | 'individual';
  targetDeviceId?: string;
  targetLabel?: string;
}): Promise<AdminMessageItem> {
  const now = Date.now();
  const safeId = toSafeKeyRecordId(`msg-${now}-${Math.random().toString(36).slice(2, 6)}`);
  const payload = normalizeAdminMessage(
    {
      id: safeId,
      titulo: input.titulo,
      cuerpo: input.cuerpo,
      tipo: input.tipo,
      targetMode: input.targetMode,
      targetDeviceId: input.targetMode === 'individual' ? input.targetDeviceId || '' : undefined,
      targetLabel: input.targetLabel || undefined,
      createdAt: now,
    },
    safeId
  );
  try {
    await setDoc(doc(db, 'admin_messages', safeId), cleanForFirestore(payload));
  } catch (err) {
    if (!isFirestoreOfflineError(err)) {
      handleFirestoreError(err, OperationType.CREATE, `admin_messages/${safeId}`);
    }
  }
  return payload;
}

export async function deleteAdminMessageCloud(messageId: string): Promise<void> {
  const safeId = toSafeKeyRecordId(messageId);
  if (!safeId) return;
  try {
    await deleteDoc(doc(db, 'admin_messages', safeId));
  } catch (err) {
    if (!isFirestoreOfflineError(err)) {
      handleFirestoreError(err, OperationType.DELETE, `admin_messages/${safeId}`);
    }
  }
}

export function subscribeAdminMessages(
  onUpdate: (messages: AdminMessageItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, 'admin_messages'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => normalizeAdminMessage(d.data() as Partial<AdminMessageItem>, d.id))
        .filter((m) => m.cuerpo.length > 0)
        .sort((a, b) => b.createdAt - a.createdAt);
      saveAdminMessagesCache(list);
      onUpdate(list);
    },
    (err) => {
      if (!isFirestoreOfflineError(err)) {
        console.warn('Error en suscripción admin_messages:', err);
      }
      onUpdate(loadAdminMessagesCache());
      onError?.(err);
    }
  );
}


