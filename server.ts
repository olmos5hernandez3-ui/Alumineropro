import crypto from 'crypto';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  computeUsageStats30d,
  isEligibleForCloudBackup,
  isUnassignedAutoTrialDevice,
  normalizeDeviceIdInput,
  validateActivationKey,
  verifyAdminPassword,
  verifyRecoveryPin,
  type CloudDeviceRecord,
} from './src/utils/alumineroLogic.ts';
import { normalizeScannedSketchResult } from './src/utils/levantamientoLogic.ts';

interface AdminKeyCloudRecord {
  id: string;
  cliente: string;
  deviceId: string;
  planLabel: string;
  dias: number | null;
  key: string;
  createdAt: number;
  expiresAt: number | null;
  revoked?: boolean;
  revokedAt?: number | null;
  linkedEmail?: string;
}

interface CloudLicensePayload {
  active: boolean;
  planCode: string;
  planLabel: string;
  expiresAt: number | null;
  activatedAt: number;
}

interface CloudAccountRecord {
  email: string;
  passwordSalt: string;
  passwordHash: string;
  activeDeviceId: string;
  activeSessionToken: string | null;
  licencia: CloudLicensePayload | null;
  backup: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
  lastBackedUpAt: number | null;
}

interface PushSubscriptionRecord {
  deviceId: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  updatedAt: number;
}

interface CloudDbShape {
  devices: Record<string, CloudDeviceRecord>;
  adminKeys: AdminKeyCloudRecord[];
  accounts: Record<string, CloudAccountRecord>;
  revokedKeys: Record<string, number>;
  blockedDevices: Record<string, number>;
  adminPasswordOverride?: string;
  pushVapidKeys?: {
    publicKey: string;
    privateKeyPem: string;
  };
  pushSubscriptions?: Record<string, PushSubscriptionRecord>;
  quoteReminders?: Record<string, unknown[]>;
  catalogVigenciaLabel?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'devices-db.json');
const PORT = Number(process.env.PORT) || 3000;

function loadDb(): CloudDbShape {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<CloudDbShape>;
      const rawOverride = typeof parsed.adminPasswordOverride === 'string' ? parsed.adminPasswordOverride.trim() : '';
      const cleanOverride =
        rawOverride &&
        rawOverride !== 'TU_CONTRASEÑA_AQUI' &&
        rawOverride !== 'Olmos5Hernandes32026' &&
        rawOverride !== 'Olmos5hernandes32026'
          ? rawOverride
          : undefined;
      const adminKeys = Array.isArray(parsed.adminKeys) ? parsed.adminKeys : [];
      const revokedKeys: Record<string, number> =
        parsed.revokedKeys && typeof parsed.revokedKeys === 'object' ? { ...parsed.revokedKeys } : {};
      for (const k of adminKeys) {
        if (k && k.revoked && k.key) {
          const nk = String(k.key).trim().toUpperCase();
          if (nk && !revokedKeys[nk]) {
            revokedKeys[nk] = k.revokedAt || Date.now();
          }
        }
      }
      const blockedDevices: Record<string, number> =
        parsed.blockedDevices && typeof parsed.blockedDevices === 'object' ? { ...parsed.blockedDevices } : {};
      const devicesObj = parsed.devices && typeof parsed.devices === 'object' ? { ...parsed.devices } : {};
      let cleanedAutoTrials = false;
      for (const [devKey, devRec] of Object.entries(devicesObj)) {
        if (devRec && (devRec.blocked || devRec.planCode === 'BLOCKED')) {
          const normId = normalizeDeviceIdInput(devRec.deviceId || devKey);
          if (normId && !blockedDevices[normId]) {
            blockedDevices[normId] = devRec.blockedAt || devRec.updatedAt || Date.now();
          }
        } else if (devRec && !devRec.revoked && isUnassignedAutoTrialDevice(devRec)) {
          devicesObj[devKey] = {
            ...devRec,
            proActive: false,
            planCode: 'FREE',
            planLabel: 'Versión Gratuita',
            expiresAt: null,
            trialActive: false,
            adminAssigned: false,
          };
          cleanedAutoTrials = true;
        }
      }
      const loadedShape: CloudDbShape = {
        devices: devicesObj,
        adminKeys,
        accounts: parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {},
        revokedKeys,
        blockedDevices,
        ...(cleanOverride ? { adminPasswordOverride: cleanOverride } : {}),
        ...(parsed.pushVapidKeys && parsed.pushVapidKeys.publicKey ? { pushVapidKeys: parsed.pushVapidKeys } : {}),
        pushSubscriptions:
          parsed.pushSubscriptions && typeof parsed.pushSubscriptions === 'object' ? parsed.pushSubscriptions : {},
        quoteReminders:
          parsed.quoteReminders && typeof parsed.quoteReminders === 'object' ? parsed.quoteReminders : {},
        ...(typeof parsed.catalogVigenciaLabel === 'string' && parsed.catalogVigenciaLabel.trim()
          ? { catalogVigenciaLabel: parsed.catalogVigenciaLabel.trim().slice(0, 140) }
          : {}),
      };
      if (cleanedAutoTrials) {
        try {
          saveDb(loadedShape);
        } catch {
          // ignore write failures during initial load
        }
      }
      return loadedShape;
    }
  } catch {
    // fallback to clean initial store if corrupted
  }
  return {
    devices: {},
    adminKeys: [],
    accounts: {},
    revokedKeys: {},
    blockedDevices: {},
    pushSubscriptions: {},
    quoteReminders: {},
  };
}

let dbFileExisted = fs.existsSync(DB_FILE);

function saveDb(dbToSave: CloudDbShape): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(dbToSave, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
  dbFileExisted = true;
}

const db: CloudDbShape = loadDb();

function syncExternalDbDeletion(): void {
  if (dbFileExisted && !fs.existsSync(DB_FILE)) {
    db.devices = {};
    db.adminKeys = [];
    db.accounts = {};
    db.revokedKeys = {};
    db.blockedDevices = {};
    delete db.adminPasswordOverride;
    dbFileExisted = false;
  }
}
const sseClients = new Set<Response>();

function normalizeEmail(raw: unknown): string {
  return String(raw || '').trim().toLowerCase();
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 160;
}

function hashAccountPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyAccountPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function buildEmailByDeviceMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const acc of Object.values(db.accounts)) {
    if (acc && acc.activeDeviceId && acc.email) {
      map.set(acc.activeDeviceId.trim().toUpperCase(), acc.email);
    }
  }
  return map;
}

function isKeyRevokedInDb(keyRaw?: string | null): boolean {
  const cleanKey = String(keyRaw || '').trim().toUpperCase();
  if (!cleanKey) return false;
  if (db.revokedKeys[cleanKey]) return true;
  return db.adminKeys.some((k) => k.key.trim().toUpperCase() === cleanKey && Boolean(k.revoked));
}

function normalizeDevicesSnapshot(now = Date.now()) {
  const emailByDevice = buildEmailByDeviceMap();
  const list: CloudDeviceRecord[] = Object.values(db.devices).map((d) => {
    const normId = normalizeDeviceIdInput(d.deviceId);
    const linkedEmail = emailByDevice.get(normId) || d.linkedEmail;
    const isBlocked = Boolean(d.blocked || d.planCode === 'BLOCKED' || db.blockedDevices[normId]);
    const unassignedTrial = !isBlocked && !d.revoked && isUnassignedAutoTrialDevice(d);
    const expired = d.proActive && d.expiresAt !== null && d.expiresAt <= now;
    const isNonProPlan =
      isBlocked ||
      unassignedTrial ||
      Boolean(d.revoked) ||
      d.planCode === 'FREE' ||
      d.planCode === 'REVOKED' ||
      d.planCode === 'BLOCKED' ||
      d.planCode === 'SESSION_MOVED';
    return {
      ...d,
      ...(linkedEmail ? { linkedEmail } : {}),
      blocked: isBlocked,
      ...(isBlocked
        ? { planCode: 'BLOCKED', planLabel: 'Bloqueado', expiresAt: null }
        : unassignedTrial
          ? {
              planCode: 'FREE',
              planLabel: 'Versión Gratuita',
              expiresAt: null,
              trialActive: false,
              adminAssigned: false,
            }
          : {}),
      proActive: isNonProPlan || expired ? false : d.proActive,
    };
  });
  list.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  const adminKeysWithEmail = db.adminKeys.slice(0, 100).map((k) => {
    const normId = k.deviceId.trim().toUpperCase();
    const linkedEmail = emailByDevice.get(normId) || db.devices[normId]?.linkedEmail || k.linkedEmail;
    return linkedEmail ? { ...k, linkedEmail } : k;
  });
  const stats = computeUsageStats30d(list, now);
  return {
    devices: list,
    adminKeys: adminKeysWithEmail,
    revokedKeys: Object.keys(db.revokedKeys),
    stats,
    serverTime: now,
  };
}

function setNoCacheHeaders(res: Response): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function broadcastSync(): void {
  if (sseClients.size === 0) return;
  const payload = JSON.stringify({ type: 'sync', ...normalizeDevicesSnapshot() });
  const frame = `event: sync\ndata: ${payload}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(frame);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.options('/api/{*splat}', (_req: Request, res: Response) => {
    setNoCacheHeaders(res);
    res.status(204).end();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    setNoCacheHeaders(res);
    res.json({ ok: true, serverTime: Date.now(), connectedListeners: sseClients.size });
  });

  app.post('/api/scan-sketch', async (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    try {
      const body = (req.body || {}) as {
        imageBase64?: unknown;
        mimeType?: unknown;
      };
      const rawData = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
      if (!rawData) {
        res.status(400).json({
          ok: false,
          errorCode: 'MISSING_IMAGE',
          error: 'No se recibió ninguna imagen del croquis.',
        });
        return;
      }

      // Aceptar tanto cadena base64 limpia como data URL (removiendo el prefijo data:image/...;base64,)
      let mimeType =
        typeof body.mimeType === 'string' && body.mimeType.trim()
          ? body.mimeType.trim().toLowerCase()
          : 'image/jpeg';
      let base64Clean = rawData;
      const dataUrlMatch = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(rawData);
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1].toLowerCase();
        base64Clean = dataUrlMatch[2].trim();
      }
      base64Clean = base64Clean.replace(/\s+/g, '');

      const allowedMimes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
      if (!allowedMimes.has(mimeType)) {
        res.status(400).json({
          ok: false,
          errorCode: 'UNSUPPORTED_MIME',
          error: 'Formato de imagen no compatible. Usa JPG, PNG o WEBP.',
        });
        return;
      }
      if (mimeType === 'image/jpg') mimeType = 'image/jpeg';

      // Validar tamaño aproximado (máximo ~10 MB en base64)
      if (base64Clean.length > 14_000_000) {
        res.status(413).json({
          ok: false,
          errorCode: 'PAYLOAD_TOO_LARGE',
          error: 'La foto es demasiado pesada. Intenta tomarla más cerca o reducirla.',
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        console.error('[scan-sketch] GEMINI_API_KEY no configurada en el servidor.');
        res.status(503).json({
          ok: false,
          errorCode: 'MISSING_API_KEY',
          error: 'El servicio de escáner IA no tiene configurada la API Key de Gemini en el servidor.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      const systemInstruction =
        'Eres un experto maestro aluminiero y cancelero en México. Analizas fotografías de croquis dibujados a mano o fotos de ventanas, puertas y canceles de aluminio/vidrio. ' +
        'Reglas estrictas de taller: una "X" o flecha horizontal (↔, →, ←) dentro de un módulo indica hoja CORREDIZA ("X"); una "O", círculo o letra "F" indica hoja FIJA ("O"). ' +
        'Lee las cotas de ANCHO total (horizontal) y ALTO total (vertical) escritas en el croquis. ' +
        'Devuelve SIEMPRE ancho y alto en MILÍMETROS enteros (convierte automáticamente si el dibujo está en cm o metros: ej. 1.50 m -> 1500, 150 cm -> 1500, 1500 mm -> 1500). ' +
        'Devuelve hojas como distribución separada por guiones usando X y O (ej. "O-X", "X-O", "O-X-O", "X-X", "O"). ' +
        'Si alguna medida no es legible en la imagen, devuelve 0 en ese campo y confianza "baja".';

      const promptText =
        'Analiza este croquis/foto de cancelería de aluminio y devuelve estrictamente un objeto JSON válido con: ' +
        '1) tipo: tipo detectado ("Ventana Corrediza", "Puerta", "Fijo", "Ventana Abatible / Proyección", "Mosquitero abatible", o "Cancel / Otro"), ' +
        '2) ancho: medida horizontal total en MILÍMETROS (número entero, convierte automáticamente desde cm o m si aplica), ' +
        '3) alto: medida vertical total en MILÍMETROS (número entero, convierte automáticamente desde cm o m si aplica), ' +
        '4) hojas: distribución de hojas de izquierda a derecha usando X (corrediza) y O (fija) separadas por guion, por ejemplo "O-X", "X-O", "O-X-O", "X-X", "O", ' +
        '5) area: habitación/área si aparece escrita (ej. "Sala", "Baño", o ""), ' +
        '6) notas: observaciones breves de taller, y ' +
        '7) confianza: "alta", "media" o "baja".';

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          tipo: { type: Type.STRING },
          ancho: { type: Type.NUMBER },
          alto: { type: Type.NUMBER },
          hojas: { type: Type.STRING },
          area: { type: Type.STRING },
          notas: { type: Type.STRING },
          confianza: { type: Type.STRING },
        },
        required: ['tipo', 'ancho', 'alto', 'hojas'],
      };

      const contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Clean,
            },
          },
          {
            text: promptText,
          },
        ],
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contentsPayload,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
      } catch (primaryErr) {
        const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr || '');
        const primaryStatus = (primaryErr as { status?: number } | null)?.status;
        const isNotFound = primaryStatus === 404 || /NOT_FOUND|404|model.*not.*found/i.test(primaryMsg);
        if (!isNotFound) throw primaryErr;
        console.warn('[scan-sketch] gemini-2.5-flash no disponible en este proyecto (404), reintentando con gemini-4-hydrogen...');
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: contentsPayload,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
      }

      const rawText = (response.text || '').trim();
      const textOutput = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      if (!textOutput) {
        res.status(502).json({
          ok: false,
          errorCode: 'EMPTY_MODEL_RESPONSE',
          error: 'La IA no devolvió datos legibles del croquis. Intenta con una foto más clara o captura las medidas manualmente.',
        });
        return;
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(textOutput) as Record<string, unknown>;
      } catch (parseErr) {
        console.error('[scan-sketch] Respuesta JSON inválida de Gemini:', textOutput.slice(0, 300), parseErr);
        res.status(502).json({
          ok: false,
          errorCode: 'INVALID_JSON_RESPONSE',
          error: 'La IA devolvió un formato inesperado al leer el croquis. Intenta con otra foto o captura manualmente.',
        });
        return;
      }

      const normalized = normalizeScannedSketchResult({
        ...parsed,
        anchoMm: parsed.ancho,
        altoMm: parsed.alto,
        unidadDetectada: 'mm',
      });

      res.json({
        ok: true,
        raw: {
          tipo: parsed.tipo,
          ancho: parsed.ancho,
          alto: parsed.alto,
          hojas: parsed.hojas,
        },
        result: normalized,
      });
    } catch (err) {
      const errObj = err as { status?: number; code?: string; message?: string } | null;
      const errMsg = err instanceof Error ? err.message : String(err || 'Error desconocido');
      const errCode = String(errObj?.status || errObj?.code || 'UPSTREAM_ERROR');
      console.error('[scan-sketch] Error al analizar croquis:', errCode, errMsg);

      let userMessage = `Error al analizar el croquis (${errCode}). Verifica tu conexión o captura las medidas manualmente.`;
      let httpStatus = 502;
      if (/API_KEY_INVALID|PERMISSION_DENIED|403|401|API key not valid/i.test(errMsg) || errObj?.status === 403 || errObj?.status === 401) {
        httpStatus = 502;
        userMessage = 'Error de API Key de Gemini en el servidor (clave inválida o sin permisos). Puedes seguir capturando tus medidas manualmente.';
      } else if (/RESOURCE_EXHAUSTED|429|quota/i.test(errMsg) || errObj?.status === 429) {
        httpStatus = 429;
        userMessage = 'Se alcanzó el límite temporal de solicitudes de la IA (cuota 429). Intenta en unos momentos o captura las medidas manualmente.';
      } else if (/fetch failed|ENOTFOUND|ETIMEDOUT|ECONNRESET|network/i.test(errMsg)) {
        httpStatus = 504;
        userMessage = 'Error de red al conectar con Gemini Vision. Verifica tu conexión o captura las medidas manualmente.';
      }

      res.status(httpStatus).json({
        ok: false,
        errorCode: errCode,
        detail: errMsg.slice(0, 260),
        error: userMessage,
      });
    }
  });

  function ensureVapidPublicKey(): string {
    if (db.pushVapidKeys?.publicKey && db.pushVapidKeys?.privateKeyPem) {
      return db.pushVapidKeys.publicKey;
    }
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const jwk = publicKey.export({ format: 'jwk' }) as { x?: string; y?: string };
    const xBuf = Buffer.from(String(jwk.x || ''), 'base64url');
    const yBuf = Buffer.from(String(jwk.y || ''), 'base64url');
    const rawUncompressed = Buffer.concat([Buffer.from([0x04]), xBuf, yBuf]);
    const publicKeyBase64Url = rawUncompressed.toString('base64url');
    const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    db.pushVapidKeys = { publicKey: publicKeyBase64Url, privateKeyPem };
    saveDb(db);
    return publicKeyBase64Url;
  }

  app.get('/api/push/vapid-public-key', (_req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const publicKey = ensureVapidPublicKey();
    res.json({ ok: true, publicKey });
  });

  app.post('/api/push/subscribe', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      deviceId?: string;
      subscription?: PushSubscriptionRecord['subscription'];
    };
    const deviceId = normalizeDeviceIdInput(String(body.deviceId || ''));
    const endpoint = String(body.subscription?.endpoint || '').trim();
    if (!deviceId || !endpoint) {
      res.status(400).json({ ok: false, error: 'deviceId y subscription.endpoint requeridos' });
      return;
    }
    if (!db.pushSubscriptions) db.pushSubscriptions = {};
    db.pushSubscriptions[deviceId] = {
      deviceId,
      subscription: {
        endpoint,
        expirationTime: body.subscription?.expirationTime ?? null,
        keys: body.subscription?.keys,
      },
      updatedAt: Date.now(),
    };
    saveDb(db);
    res.json({ ok: true });
  });

  app.post('/api/push/unsubscribe', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as { deviceId?: string };
    const deviceId = normalizeDeviceIdInput(String(body.deviceId || ''));
    if (deviceId && db.pushSubscriptions && deviceId in db.pushSubscriptions) {
      delete db.pushSubscriptions[deviceId];
      saveDb(db);
    }
    res.json({ ok: true });
  });

  app.post('/api/push/reminders', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as { deviceId?: string; reminders?: unknown[] };
    const deviceId = normalizeDeviceIdInput(String(body.deviceId || ''));
    if (!deviceId || !Array.isArray(body.reminders)) {
      res.status(400).json({ ok: false, error: 'deviceId y reminders requeridos' });
      return;
    }
    if (!db.quoteReminders) db.quoteReminders = {};
    db.quoteReminders[deviceId] = body.reminders.slice(0, 100);
    saveDb(db);
    res.json({ ok: true, count: db.quoteReminders[deviceId].length });
  });

  app.get('/api/devices/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    sseClients.add(res);

    const initialPayload = JSON.stringify({ type: 'sync', ...normalizeDevicesSnapshot() });
    res.write(`event: sync\ndata: ${initialPayload}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25_000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  app.get('/api/devices', (_req: Request, res: Response) => {
    setNoCacheHeaders(res);
    res.json(normalizeDevicesSnapshot());
  });

  app.get('/api/devices/:deviceId', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    const id = String(req.params.deviceId || '').trim().toUpperCase();
    const now = Date.now();
    const found = db.devices[id] || null;
    const device = found && found.proActive && found.expiresAt !== null && found.expiresAt <= now
      ? { ...found, proActive: false }
      : found;
    res.json({
      device,
      ...normalizeDevicesSnapshot(now),
    });
  });

  app.post('/api/devices/verify-status', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      deviceId?: string;
      activatedKey?: string;
    };
    const deviceId = normalizeDeviceIdInput(String(body.deviceId || ''));
    if (!deviceId) {
      res.status(400).json({ ok: false, error: 'deviceId requerido' });
      return;
    }

    const now = Date.now();
    const cleanKey = String(body.activatedKey || '').trim().toUpperCase();
    const existing = db.devices[deviceId] || null;
    const existsInCloud = Boolean(existing);
    const keyRevoked = isKeyRevokedInDb(cleanKey);
    const isBlocked = Boolean(existing?.blocked || existing?.planCode === 'BLOCKED' || db.blockedDevices[deviceId]);
    const deviceRevoked = Boolean(existing?.revoked || existing?.planCode === 'REVOKED');
    const sessionMoved = existing?.planCode === 'SESSION_MOVED';
    const expired = Boolean(existing && existing.expiresAt !== null && existing.expiresAt <= now);

    if (isBlocked && existing && (!existing.blocked || existing.planCode !== 'BLOCKED')) {
      db.devices[deviceId] = {
        ...existing,
        proActive: false,
        planCode: 'BLOCKED',
        planLabel: 'Bloqueado',
        expiresAt: null,
        revoked: true,
        revokedAt: existing.revokedAt ?? now,
        blocked: true,
        blockedAt: existing.blockedAt ?? db.blockedDevices[deviceId] ?? now,
        trialActive: false,
        updatedAt: now,
      };
      saveDb(db);
      broadcastSync();
    } else if (keyRevoked && existing && !existing.revoked) {
      db.devices[deviceId] = {
        ...existing,
        proActive: false,
        planCode: 'FREE',
        planLabel: 'Promoción revocada / Versión Gratuita',
        expiresAt: null,
        revoked: true,
        revokedAt: now,
        trialActive: false,
        updatedAt: now,
      };
      saveDb(db);
      broadcastSync();
    } else if (existing && !deviceRevoked && isUnassignedAutoTrialDevice(existing)) {
      db.devices[deviceId] = {
        ...existing,
        proActive: false,
        planCode: 'FREE',
        planLabel: 'Versión Gratuita',
        expiresAt: null,
        trialActive: false,
        adminAssigned: false,
        updatedAt: now,
      };
      saveDb(db);
      broadcastSync();
    } else if (existing && existing.trialActive && expired && existing.proActive) {
      db.devices[deviceId] = {
        ...existing,
        proActive: false,
        planCode: 'FREE',
        planLabel: 'Versión Gratuita',
        expiresAt: null,
        trialActive: false,
        updatedAt: now,
      };
      saveDb(db);
      broadcastSync();
    }

    const latestDevice = db.devices[deviceId] || null;
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

    res.json({
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
      ...normalizeDevicesSnapshot(now),
    });
  });

  app.post('/api/devices/:deviceId/activate-key', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const deviceId = normalizeDeviceIdInput(String(req.params.deviceId || ''));
    if (!deviceId) {
      res.status(400).json({ ok: false, error: 'deviceId requerido' });
      return;
    }

    const body = (req.body || {}) as {
      key?: string;
      planCode?: string;
      planLabel?: string;
      expiresAt?: number | null;
      cliente?: string;
      deviceLabel?: string;
    };

    const cleanKey = String(body.key || '').trim().toUpperCase();
    if (!cleanKey) {
      res.status(400).json({ ok: false, error: 'Clave requerida' });
      return;
    }

    if (isKeyRevokedInDb(cleanKey)) {
      res.status(403).json({
        ok: false,
        revoked: true,
        error: 'Este código de activación fue revocado por el administrador y ya no puede utilizarse.',
      });
      return;
    }

    const keyValidation = validateActivationKey(deviceId, cleanKey);
    if (!keyValidation.ok) {
      res.status(400).json({
        ok: false,
        error: keyValidation.error || 'La clave no corresponde a este ID de equipo.',
      });
      return;
    }

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const existing = db.devices[deviceId];
    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    activeDaysSet.add(today);

    const emailByDevice = buildEmailByDeviceMap();
    const linkedEmail = emailByDevice.get(deviceId) || existing?.linkedEmail;
    const planCode = String(body.planCode || 'M');
    const planLabel = String(body.planLabel || 'PRO');
    const expiresAt = body.expiresAt ?? null;
    const valid = expiresAt === null || expiresAt > now;

    db.devices[deviceId] = {
      deviceId,
      cliente: typeof body.cliente === 'string' && body.cliente.trim()
        ? body.cliente.trim().slice(0, 80)
        : existing?.cliente || '',
      deviceLabel: typeof body.deviceLabel === 'string' && body.deviceLabel.trim()
        ? body.deviceLabel.trim().slice(0, 60)
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
      trialActive: planCode === 'G',
      adminAssigned: Boolean(existing?.adminAssigned),
      ...(linkedEmail ? { linkedEmail } : {}),
    };

    saveDb(db);
    broadcastSync();

    res.json({
      ok: true,
      device: db.devices[deviceId],
      ...normalizeDevicesSnapshot(now),
    });
  });

  app.post('/api/devices/register', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      deviceId?: string;
      cliente?: string;
      deviceLabel?: string;
      eventType?: 'open' | 'heartbeat' | 'license_sync';
      minutesDelta?: number;
      trialActive?: boolean;
      trialExpiresAt?: number | null;
      licencia?: {
        active?: boolean;
        planCode?: string;
        planLabel?: string;
        expiresAt?: number | null;
        activatedAt?: number;
        activatedKey?: string;
      } | null;
    };

    const deviceId = normalizeDeviceIdInput(String(body.deviceId || ''));
    if (!deviceId) {
      res.status(400).json({ error: 'deviceId requerido' });
      return;
    }

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const existing = db.devices[deviceId];
    const eventType = body.eventType || 'open';

    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    activeDaysSet.add(today);
    const activeDays = Array.from(activeDaysSet).sort().slice(-60);

    const minsDelta = Math.max(0, Math.min(15, Number(body.minutesDelta ?? (eventType === 'open' ? 1 : 0)) || 0));
    const sessionsDelta = eventType === 'open' ? 1 : 0;

    let proActive = existing?.proActive ?? false;
    let planCode = existing?.planCode ?? 'FREE';
    let planLabel = existing?.planLabel ?? 'Versión Gratuita';
    let expiresAt: number | null = existing?.expiresAt ?? null;
    let updatedAt = existing?.updatedAt ?? now;
    let revoked = Boolean(existing?.revoked || existing?.planCode === 'REVOKED');
    let revokedAt: number | null = existing?.revokedAt ?? null;
    let blocked = Boolean(existing?.blocked || existing?.planCode === 'BLOCKED' || db.blockedDevices[deviceId]);
    let blockedAt: number | null = existing?.blockedAt ?? db.blockedDevices[deviceId] ?? null;
    let trialActive = Boolean(existing?.trialActive);
    let adminAssigned = Boolean(existing?.adminAssigned);
    let lastKey = existing?.lastKey || '';

    const cleanLicKey = String(body.licencia?.activatedKey || '').trim().toUpperCase();
    const submittedKeyRevoked = isKeyRevokedInDb(cleanLicKey);
    const hasValidNonRevokedKey = Boolean(
      cleanLicKey && !submittedKeyRevoked && validateActivationKey(deviceId, cleanLicKey).ok
    );
    const clientActivatedAt = Number(body.licencia?.activatedAt || 0);
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
      planLabel = 'Promoción revocada / Versión Gratuita';
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
      if (body.licencia && body.licencia.active && (hasValidNonRevokedKey || adminAssigned)) {
        proActive = body.licencia.expiresAt === null || body.licencia.expiresAt === undefined || body.licencia.expiresAt > now;
        planCode = String(body.licencia.planCode || 'M');
        planLabel = String(body.licencia.planLabel || 'PRO');
        expiresAt = body.licencia.expiresAt ?? null;
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
    } else if (body.licencia && body.licencia.active) {
      const serverHasNewerDecision = existing && existing.updatedAt > clientActivatedAt + 1000;
      if (!serverHasNewerDecision && hasValidNonRevokedKey && (!existing || !existing.revoked)) {
        proActive = body.licencia.expiresAt === null || body.licencia.expiresAt === undefined || body.licencia.expiresAt > now;
        planCode = String(body.licencia.planCode || 'M');
        planLabel = String(body.licencia.planLabel || 'PRO');
        expiresAt = body.licencia.expiresAt ?? null;
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

    const clienteClean = typeof body.cliente === 'string' && body.cliente.trim()
      ? body.cliente.trim().slice(0, 80)
      : existing?.cliente || '';

    const labelClean = typeof body.deviceLabel === 'string' && body.deviceLabel.trim()
      ? body.deviceLabel.trim().slice(0, 60)
      : existing?.deviceLabel || 'Navegador Web';

    const emailByDevice = buildEmailByDeviceMap();
    const linkedEmail = emailByDevice.get(deviceId) || existing?.linkedEmail;

    const nextRecord: CloudDeviceRecord = {
      deviceId,
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
      ...(linkedEmail ? { linkedEmail } : {}),
    };

    db.devices[deviceId] = nextRecord;
    saveDb(db);
    broadcastSync();

    res.json({
      device: nextRecord,
      ...normalizeDevicesSnapshot(now),
    });
  });

  app.post('/api/devices/:deviceId/license', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const deviceId = normalizeDeviceIdInput(String(req.params.deviceId || ''));
    if (!deviceId) {
      res.status(400).json({ error: 'deviceId requerido' });
      return;
    }

    const body = (req.body || {}) as {
      cliente?: string;
      planCode?: string;
      planLabel?: string;
      expiresAt?: number | null;
      key?: string;
      dias?: number | null;
      revoke?: boolean;
      block?: boolean;
      recordKeyOnly?: boolean;
    };

    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const existing = db.devices[deviceId];
    const activeDaysSet = new Set<string>(Array.isArray(existing?.activeDays) ? existing.activeDays : []);
    if (!existing) activeDaysSet.add(today);

    const clienteClean = typeof body.cliente === 'string' && body.cliente.trim()
      ? body.cliente.trim().slice(0, 80)
      : existing?.cliente || 'Cliente sin nombre';

    const existingEmail = buildEmailByDeviceMap().get(deviceId) || existing?.linkedEmail;
    const isBlock = Boolean(body.block);
    const isRevoke = Boolean(body.revoke);
    const bodyKeyClean = body.key ? String(body.key).trim().toUpperCase() : '';

    if (isBlock) {
      db.blockedDevices[deviceId] = now;
      if (bodyKeyClean) {
        db.revokedKeys[bodyKeyClean] = now;
      }
      if (existing?.lastKey) {
        const prevKey = existing.lastKey.trim().toUpperCase();
        if (prevKey) db.revokedKeys[prevKey] = now;
      }
      db.adminKeys = db.adminKeys.map((k) => {
        if (normalizeDeviceIdInput(k.deviceId) === deviceId || (bodyKeyClean && k.key.trim().toUpperCase() === bodyKeyClean)) {
          const nk = k.key.trim().toUpperCase();
          if (nk) db.revokedKeys[nk] = now;
          return { ...k, revoked: true, revokedAt: now };
        }
        return k;
      });
      for (const acc of Object.values(db.accounts)) {
        if (acc && normalizeDeviceIdInput(acc.activeDeviceId) === deviceId) {
          acc.licencia = null;
          acc.updatedAt = now;
        }
      }
      db.devices[deviceId] = {
        deviceId,
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
        expiresAt: null,
        lastKey: bodyKeyClean || existing?.lastKey || '',
        updatedAt: now,
        revoked: true,
        revokedAt: now,
        blocked: true,
        blockedAt: now,
        trialActive: false,
        adminAssigned: false,
        ...(existingEmail ? { linkedEmail: existingEmail } : {}),
      };
    } else if (isRevoke) {
      delete db.blockedDevices[deviceId];
      // Marcar el código pasado, el último código del dispositivo y cualquier código en historial de ese dispositivo como revocados en db.revokedKeys
      if (bodyKeyClean) {
        db.revokedKeys[bodyKeyClean] = now;
      }
      if (existing?.lastKey) {
        const prevKey = existing.lastKey.trim().toUpperCase();
        if (prevKey) db.revokedKeys[prevKey] = now;
      }
      db.adminKeys = db.adminKeys.map((k) => {
        if (normalizeDeviceIdInput(k.deviceId) === deviceId || (bodyKeyClean && k.key.trim().toUpperCase() === bodyKeyClean)) {
          const nk = k.key.trim().toUpperCase();
          if (nk) db.revokedKeys[nk] = now;
          return { ...k, revoked: true, revokedAt: now };
        }
        return k;
      });
      for (const acc of Object.values(db.accounts)) {
        if (acc && normalizeDeviceIdInput(acc.activeDeviceId) === deviceId) {
          acc.licencia = null;
          acc.updatedAt = now;
        }
      }
      db.devices[deviceId] = {
        deviceId,
        cliente: clienteClean === 'Cliente sin nombre' && existing?.cliente ? existing.cliente : clienteClean,
        deviceLabel: existing?.deviceLabel || 'Equipo Remoto',
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastSeenAt: existing?.lastSeenAt ?? now,
        totalSessions: existing?.totalSessions ?? 0,
        totalMinutes: existing?.totalMinutes ?? 0,
        activeDays: Array.from(activeDaysSet).sort().slice(-60),
        proActive: false,
        planCode: 'FREE',
        planLabel: 'Promoción revocada / Versión Gratuita',
        expiresAt: null,
        lastKey: bodyKeyClean || existing?.lastKey || '',
        updatedAt: now,
        revoked: true,
        revokedAt: now,
        blocked: false,
        blockedAt: null,
        trialActive: false,
        adminAssigned: false,
        ...(existingEmail ? { linkedEmail: existingEmail } : {}),
      };
    } else {
      if (bodyKeyClean) {
        delete db.revokedKeys[bodyKeyClean];
        const keyRec: AdminKeyCloudRecord = {
          id: `ak-${now}-${Math.random().toString(36).slice(2, 6)}`,
          cliente: clienteClean,
          deviceId,
          planLabel: String(body.planLabel || 'PRO'),
          dias: body.dias ?? null,
          key: bodyKeyClean,
          createdAt: now,
          expiresAt: body.expiresAt ?? null,
          revoked: false,
          revokedAt: null,
          ...(existingEmail ? { linkedEmail: existingEmail } : {}),
        };
        db.adminKeys = [keyRec, ...db.adminKeys.filter((k) => k.key !== keyRec.key || k.deviceId !== deviceId)].slice(0, 100);
      }

      if (!body.recordKeyOnly) {
        delete db.blockedDevices[deviceId];
        const planCode = String(body.planCode || 'M');
        db.devices[deviceId] = {
          deviceId,
          cliente: clienteClean === 'Cliente sin nombre' && existing?.cliente ? existing.cliente : clienteClean,
          deviceLabel: existing?.deviceLabel || 'Equipo Remoto',
          firstSeenAt: existing?.firstSeenAt ?? now,
          lastSeenAt: existing?.lastSeenAt ?? now,
          totalSessions: existing?.totalSessions ?? 0,
          totalMinutes: existing?.totalMinutes ?? 0,
          activeDays: Array.from(activeDaysSet).sort().slice(-60),
          proActive: true,
          planCode,
          planLabel: String(body.planLabel || 'PRO'),
          expiresAt: body.expiresAt ?? null,
          lastKey: bodyKeyClean || existing?.lastKey || '',
          updatedAt: now,
          revoked: false,
          revokedAt: null,
          blocked: false,
          blockedAt: null,
          trialActive: planCode === 'G',
          adminAssigned: true,
          ...(existingEmail ? { linkedEmail: existingEmail } : {}),
        };
      } else if (!existing) {
        db.devices[deviceId] = {
          deviceId,
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
          ...(existingEmail ? { linkedEmail: existingEmail } : {}),
        };
      } else if (bodyKeyClean) {
        db.devices[deviceId] = {
          ...existing,
          cliente: clienteClean !== 'Cliente sin nombre' ? clienteClean : existing.cliente,
          lastKey: bodyKeyClean,
          revoked: false,
          revokedAt: null,
          ...(existingEmail ? { linkedEmail: existingEmail } : {}),
        };
      }
    }

    saveDb(db);
    broadcastSync();

    res.json({
      device: db.devices[deviceId] || null,
      ...normalizeDevicesSnapshot(now),
    });
  });

  app.post('/api/admin-keys/delete', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      id?: string;
      deviceId?: string;
      key?: string;
      deleteDevice?: boolean;
    };
    const idClean = typeof body.id === 'string' ? body.id.trim() : '';
    const deviceClean = normalizeDeviceIdInput(String(body.deviceId || ''));
    const keyClean = typeof body.key === 'string' ? body.key.trim().toUpperCase() : '';
    const deleteDevice = Boolean(body.deleteDevice);

    if (!idClean && !deviceClean) {
      res.status(400).json({ error: 'Se requiere id o deviceId' });
      return;
    }

    let changed = false;
    const beforeLen = db.adminKeys.length;
    db.adminKeys = db.adminKeys.filter((item) => {
      if (idClean && item.id === idClean) return false;
      if (deleteDevice && deviceClean && normalizeDeviceIdInput(item.deviceId) === deviceClean) {
        return false;
      }
      if (
        deviceClean &&
        keyClean &&
        normalizeDeviceIdInput(item.deviceId) === deviceClean &&
        item.key.trim().toUpperCase() === keyClean
      ) {
        return false;
      }
      return true;
    });
    if (db.adminKeys.length !== beforeLen) {
      changed = true;
    }

    if (deleteDevice && deviceClean) {
      if (deviceClean in db.devices) {
        delete db.devices[deviceClean];
        changed = true;
      }
      if (deviceClean in db.blockedDevices) {
        delete db.blockedDevices[deviceClean];
        changed = true;
      }
    }

    if (changed) {
      saveDb(db);
      broadcastSync();
    }

    res.json({
      ok: true,
      ...normalizeDevicesSnapshot(Date.now()),
    });
  });

  app.post('/api/admin/verify', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as { password?: string };
    const candidate = String(body.password || '').trim();
    if (!verifyAdminPassword(candidate, db.adminPasswordOverride)) {
      res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/reset-password', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as { pin?: string; newPassword?: string };
    const pin = String(body.pin || '').trim();
    const newPassword = String(body.newPassword || '').trim();
    if (!verifyRecoveryPin(pin)) {
      res.status(403).json({ ok: false, error: 'PIN de recuperación incorrecto' });
      return;
    }
    if (newPassword.length < 4) {
      res.status(400).json({ ok: false, error: 'La nueva contraseña debe tener al menos 4 caracteres' });
      return;
    }
    db.adminPasswordOverride = newPassword;
    saveDb(db);
    res.json({ ok: true });
  });

  app.post('/api/account/register', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      email?: string;
      password?: string;
      deviceId?: string;
      licencia?: CloudLicensePayload | null;
      backup?: Record<string, unknown> | null;
    };

    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const deviceId = String(body.deviceId || '').trim().toUpperCase();
    const now = Date.now();

    if (!isValidEmailFormat(email)) {
      res.status(400).json({ ok: false, error: 'Ingresa un correo electrónico válido.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (!deviceId) {
      res.status(400).json({ ok: false, error: 'ID de dispositivo requerido.' });
      return;
    }
    if (db.accounts[email]) {
      res.status(409).json({
        ok: false,
        error: 'Este correo ya tiene una cuenta registrada. Usa "Iniciar sesión" para recuperar tu respaldo.',
      });
      return;
    }

    const lic = body.licencia ?? null;
    if (!isEligibleForCloudBackup(lic, false, now)) {
      res.status(403).json({
        ok: false,
        error: 'El respaldo en la nube es un beneficio exclusivo de los planes PRO de 90 días y 1 año.',
      });
      return;
    }

    const { salt, hash } = hashAccountPassword(password);
    const sessionToken = crypto.randomBytes(24).toString('hex');
    const cleanLic: CloudLicensePayload = {
      active: true,
      planCode: String(lic!.planCode),
      planLabel: String(lic!.planLabel),
      expiresAt: lic!.expiresAt ?? null,
      activatedAt: Number(lic!.activatedAt || now),
    };

    db.accounts[email] = {
      email,
      passwordSalt: salt,
      passwordHash: hash,
      activeDeviceId: deviceId,
      activeSessionToken: sessionToken,
      licencia: cleanLic,
      backup: body.backup && typeof body.backup === 'object' ? body.backup : null,
      createdAt: now,
      updatedAt: now,
      lastBackedUpAt: body.backup ? now : null,
    };

    const existingDev = db.devices[deviceId];
    const today = new Date(now).toISOString().slice(0, 10);
    db.devices[deviceId] = {
      deviceId,
      cliente: existingDev?.cliente || '',
      deviceLabel: existingDev?.deviceLabel || 'Navegador Web',
      firstSeenAt: existingDev?.firstSeenAt ?? now,
      lastSeenAt: now,
      totalSessions: existingDev?.totalSessions ?? 1,
      totalMinutes: existingDev?.totalMinutes ?? 1,
      activeDays: Array.isArray(existingDev?.activeDays) && existingDev.activeDays.length > 0
        ? existingDev.activeDays
        : [today],
      proActive: true,
      planCode: cleanLic.planCode,
      planLabel: cleanLic.planLabel,
      expiresAt: cleanLic.expiresAt,
      lastKey: existingDev?.lastKey || '',
      updatedAt: now,
      revoked: false,
      adminAssigned: true,
      linkedEmail: email,
    };

    db.adminKeys = db.adminKeys.map((k) =>
      k.deviceId.trim().toUpperCase() === deviceId ? { ...k, linkedEmail: email } : k
    );

    saveDb(db);
    broadcastSync();

    res.json({
      ok: true,
      email,
      sessionToken,
      licencia: cleanLic,
      lastBackedUpAt: db.accounts[email].lastBackedUpAt,
      snapshot: normalizeDevicesSnapshot(now),
    });
  });

  app.post('/api/account/login', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      email?: string;
      password?: string;
      deviceId?: string;
      licencia?: CloudLicensePayload | null;
    };

    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const deviceId = String(body.deviceId || '').trim().toUpperCase();
    const now = Date.now();

    if (!isValidEmailFormat(email) || !password || !deviceId) {
      res.status(400).json({ ok: false, error: 'Ingresa tu correo y contraseña completos.' });
      return;
    }

    const acc = db.accounts[email];
    if (!acc || !verifyAccountPassword(password, acc.passwordSalt, acc.passwordHash)) {
      res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' });
      return;
    }

    const accountLicValid = isEligibleForCloudBackup(acc.licencia, false, now);
    const clientLicValid = isEligibleForCloudBackup(body.licencia ?? null, false, now);
    const effectiveLic: CloudLicensePayload | null = accountLicValid
      ? acc.licencia
      : clientLicValid
        ? {
            active: true,
            planCode: String(body.licencia!.planCode),
            planLabel: String(body.licencia!.planLabel),
            expiresAt: body.licencia!.expiresAt ?? null,
            activatedAt: Number(body.licencia!.activatedAt || now),
          }
        : null;

    if (!effectiveLic) {
      res.status(403).json({
        ok: false,
        error: 'Tu plan PRO de 90 días o 1 año expiró o fue revocado. Activa un plan vigente para recuperar tu cuenta.',
      });
      return;
    }

    const prevDeviceId =
      acc.activeDeviceId && acc.activeDeviceId.trim().toUpperCase() !== deviceId
        ? acc.activeDeviceId.trim().toUpperCase()
        : null;

    if (prevDeviceId) {
      const prevDev = db.devices[prevDeviceId];
      db.devices[prevDeviceId] = {
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
      };
    }

    const sessionToken = crypto.randomBytes(24).toString('hex');
    const restoredLic: CloudLicensePayload = {
      ...effectiveLic,
      activatedAt: now,
    };
    acc.activeDeviceId = deviceId;
    acc.activeSessionToken = sessionToken;
    acc.licencia = restoredLic;
    acc.updatedAt = now;

    const currentDev = db.devices[deviceId];
    const today = new Date(now).toISOString().slice(0, 10);
    db.devices[deviceId] = {
      deviceId,
      cliente: currentDev?.cliente || '',
      deviceLabel: currentDev?.deviceLabel || 'Navegador Web',
      firstSeenAt: currentDev?.firstSeenAt ?? now,
      lastSeenAt: now,
      totalSessions: currentDev?.totalSessions ?? 1,
      totalMinutes: currentDev?.totalMinutes ?? 1,
      activeDays: Array.isArray(currentDev?.activeDays) && currentDev.activeDays.length > 0
        ? currentDev.activeDays
        : [today],
      proActive: true,
      planCode: restoredLic.planCode,
      planLabel: restoredLic.planLabel,
      expiresAt: restoredLic.expiresAt,
      lastKey: currentDev?.lastKey || '',
      updatedAt: now,
      revoked: false,
      adminAssigned: true,
      linkedEmail: email,
    };

    db.adminKeys = db.adminKeys.map((k) =>
      k.deviceId.trim().toUpperCase() === deviceId ? { ...k, linkedEmail: email } : k
    );

    saveDb(db);
    broadcastSync();

    res.json({
      ok: true,
      email,
      sessionToken,
      licencia: restoredLic,
      backup: acc.backup,
      lastBackedUpAt: acc.lastBackedUpAt,
      replacedPreviousDevice: Boolean(prevDeviceId),
      snapshot: normalizeDevicesSnapshot(now),
    });
  });

  app.post('/api/account/backup', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      email?: string;
      sessionToken?: string;
      deviceId?: string;
      licencia?: CloudLicensePayload | null;
      backup?: Record<string, unknown> | null;
    };

    const email = normalizeEmail(body.email);
    const sessionToken = String(body.sessionToken || '').trim();
    const deviceId = String(body.deviceId || '').trim().toUpperCase();
    const now = Date.now();

    const acc = db.accounts[email];
    if (!acc || !acc.activeSessionToken || acc.activeSessionToken !== sessionToken || acc.activeDeviceId !== deviceId) {
      res.status(401).json({
        ok: false,
        sessionExpired: true,
        error: 'Tu sesión se cerró porque iniciaste sesión en otro celular.',
      });
      return;
    }

    const effectiveValid =
      isEligibleForCloudBackup(acc.licencia, false, now) ||
      isEligibleForCloudBackup(body.licencia ?? null, false, now);
    if (!effectiveValid) {
      res.status(403).json({
        ok: false,
        error: 'Tu plan de 90 días o 1 año no está vigente.',
      });
      return;
    }

    if (body.backup && typeof body.backup === 'object') {
      acc.backup = body.backup;
      acc.lastBackedUpAt = now;
    }
    if (body.licencia && isEligibleForCloudBackup(body.licencia, false, now)) {
      acc.licencia = body.licencia;
    }
    acc.updatedAt = now;
    saveDb(db);

    res.json({ ok: true, updatedAt: now });
  });

  app.post('/api/account/session-check', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      email?: string;
      sessionToken?: string;
      deviceId?: string;
    };
    const email = normalizeEmail(body.email);
    const sessionToken = String(body.sessionToken || '').trim();
    const deviceId = String(body.deviceId || '').trim().toUpperCase();

    const acc = db.accounts[email];
    if (!acc || !acc.activeSessionToken || acc.activeSessionToken !== sessionToken || acc.activeDeviceId !== deviceId) {
      res.status(401).json({
        ok: false,
        sessionExpired: true,
        error: 'Tu sesión se cerró porque abriste tu cuenta en otro dispositivo.',
      });
      return;
    }

    res.json({ ok: true, lastBackedUpAt: acc.lastBackedUpAt });
  });

  app.post('/api/account/logout', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    syncExternalDbDeletion();
    const body = (req.body || {}) as {
      email?: string;
      sessionToken?: string;
      deviceId?: string;
    };
    const email = normalizeEmail(body.email);
    const sessionToken = String(body.sessionToken || '').trim();
    const deviceId = String(body.deviceId || '').trim().toUpperCase();

    const acc = db.accounts[email];
    if (acc && acc.activeSessionToken === sessionToken && acc.activeDeviceId === deviceId) {
      acc.activeSessionToken = null;
      acc.updatedAt = Date.now();
      saveDb(db);
    }

    res.json({ ok: true });
  });

  const DEFAULT_CATALOG_VIGENCIA =
    'Catálogos Oficiales Vigentes 2026 • Próxima Actualización Anual: 2027';

  app.get('/api/config/catalog-vigencia', (_req: Request, res: Response) => {
    syncExternalDbDeletion();
    res.json({
      ok: true,
      label: db.catalogVigenciaLabel?.trim() || DEFAULT_CATALOG_VIGENCIA,
    });
  });

  app.post('/api/config/catalog-vigencia', (req: Request, res: Response) => {
    syncExternalDbDeletion();
    const raw = typeof req.body?.label === 'string' ? req.body.label.trim().slice(0, 140) : '';
    const finalLabel = raw || DEFAULT_CATALOG_VIGENCIA;
    db.catalogVigenciaLabel = finalLabel;
    saveDb(db);
    res.json({ ok: true, label: finalLabel });
  });

  for (const zipName of [
    'aluminero-pro-v2.zip',
    'aluminero-pro-netlify-cloudflare-v4.zip',
    'aluminero-pro-netlify-cloudflare-v5.zip',
    'aluminero-pro-netlify-cloudflare-v6.zip',
    'aluminero-pro-netlify-cloudflare-v7.zip',
    'aluminero-pro-netlify-cloudflare-v8.zip',
    'aluminero-pro-netlify-cloudflare-v9.zip',
    'aluminero-pro-netlify-cloudflare-v10.zip',
    'aluminero-pro-netlify-cloudflare-v11.zip',
    'aluminero-pro-netlify-cloudflare-v12.zip',
    'aluminero-pro-netlify-cloudflare-v13.zip',
    'aluminero-pro-netlify-cloudflare-v14.zip',
    'aluminero-pro-netlify-cloudflare-v15.zip',
    'aluminero-pro-netlify-cloudflare-v16.zip',
  ]) {
    app.get(`/${zipName}`, (_req: Request, res: Response) => {
      const publicZip = path.join(__dirname, 'public', zipName);
      const distZip = path.join(__dirname, 'dist', zipName);
      const zipPath = fs.existsSync(publicZip) ? publicZip : fs.existsSync(distZip) ? distZip : null;
      if (!zipPath) {
        res.status(404).send(`Archivo ${zipName} no encontrado`);
        return;
      }
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(zipPath);
    });
  }

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(__dirname, 'dist');
    const distIndex = path.join(distDir, 'index.html');
    app.get('/__aluminero_single.html', (_req: Request, res: Response) => {
      if (fs.existsSync(distIndex)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Aluminero-Single', '1');
        res.setHeader('Cache-Control', 'no-store');
        res.sendFile(distIndex);
      } else {
        res.status(404).send('Build no encontrado');
      }
    });
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.status(404).send('dist/index.html no encontrado');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aluminero Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
