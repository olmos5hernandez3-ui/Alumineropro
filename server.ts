import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  computeUsageStats30d,
  verifyAdminPassword,
  verifyRecoveryPin,
  type CloudDeviceRecord,
} from './src/utils/alumineroLogic.ts';

interface AdminKeyCloudRecord {
  id: string;
  cliente: string;
  deviceId: string;
  planLabel: string;
  dias: number | null;
  key: string;
  createdAt: number;
  expiresAt: number | null;
}

interface CloudDbShape {
  devices: Record<string, CloudDeviceRecord>;
  adminKeys: AdminKeyCloudRecord[];
  adminPasswordOverride?: string;
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
      const cleanOverride = rawOverride && rawOverride !== 'TU_CONTRASEÑA_AQUI' ? rawOverride : undefined;
      return {
        devices: parsed.devices && typeof parsed.devices === 'object' ? parsed.devices : {},
        adminKeys: Array.isArray(parsed.adminKeys) ? parsed.adminKeys : [],
        ...(cleanOverride ? { adminPasswordOverride: cleanOverride } : {}),
      };
    }
  } catch {
    // fallback to clean initial store if corrupted
  }
  return { devices: {}, adminKeys: [] };
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
    delete db.adminPasswordOverride;
    dbFileExisted = false;
  }
}
const sseClients = new Set<Response>();

function normalizeDevicesSnapshot(now = Date.now()) {
  const list: CloudDeviceRecord[] = Object.values(db.devices).map((d) => {
    const expired = d.proActive && d.expiresAt !== null && d.expiresAt <= now;
    return expired
      ? {
          ...d,
          proActive: false,
        }
      : d;
  });
  list.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  const stats = computeUsageStats30d(list, now);
  return {
    devices: list,
    adminKeys: db.adminKeys.slice(0, 100),
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
  app.use(express.json({ limit: '1mb' }));

  app.options('/api/{*splat}', (_req: Request, res: Response) => {
    setNoCacheHeaders(res);
    res.status(204).end();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    setNoCacheHeaders(res);
    res.json({ ok: true, serverTime: Date.now(), connectedListeners: sseClients.size });
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

  app.post('/api/devices/register', (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    const body = (req.body || {}) as {
      deviceId?: string;
      cliente?: string;
      deviceLabel?: string;
      eventType?: 'open' | 'heartbeat' | 'license_sync';
      minutesDelta?: number;
      licencia?: {
        active?: boolean;
        planCode?: string;
        planLabel?: string;
        expiresAt?: number | null;
        activatedAt?: number;
      } | null;
    };

    const deviceId = String(body.deviceId || '').trim().toUpperCase();
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
    let planLabel = existing?.planLabel ?? 'Gratuito';
    let expiresAt: number | null = existing?.expiresAt ?? null;
    let updatedAt = existing?.updatedAt ?? now;

    if (eventType === 'license_sync') {
      if (body.licencia && body.licencia.active) {
        proActive = body.licencia.expiresAt === null || body.licencia.expiresAt === undefined || body.licencia.expiresAt > now;
        planCode = String(body.licencia.planCode || 'M');
        planLabel = String(body.licencia.planLabel || 'PRO');
        expiresAt = body.licencia.expiresAt ?? null;
      } else {
        proActive = false;
        planCode = 'FREE';
        planLabel = 'Gratuito';
        expiresAt = null;
      }
      updatedAt = now;
    } else if (body.licencia && body.licencia.active) {
      const clientActivatedAt = Number(body.licencia.activatedAt || 0);
      const serverHasNewerDecision = existing && existing.updatedAt > clientActivatedAt + 1000;
      if (!serverHasNewerDecision) {
        proActive = body.licencia.expiresAt === null || body.licencia.expiresAt === undefined || body.licencia.expiresAt > now;
        planCode = String(body.licencia.planCode || 'M');
        planLabel = String(body.licencia.planLabel || 'PRO');
        expiresAt = body.licencia.expiresAt ?? null;
        updatedAt = Math.max(updatedAt, clientActivatedAt || now);
      }
    } else if (!existing) {
      proActive = false;
      planCode = 'FREE';
      planLabel = 'Gratuito';
      expiresAt = null;
      updatedAt = now;
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
      lastKey: existing?.lastKey || '',
      updatedAt,
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
    const deviceId = String(req.params.deviceId || '').trim().toUpperCase();
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

    if (body.key) {
      const keyRec: AdminKeyCloudRecord = {
        id: `ak-${now}-${Math.random().toString(36).slice(2, 6)}`,
        cliente: clienteClean,
        deviceId,
        planLabel: String(body.planLabel || 'PRO'),
        dias: body.dias ?? null,
        key: String(body.key),
        createdAt: now,
        expiresAt: body.expiresAt ?? null,
      };
      db.adminKeys = [keyRec, ...db.adminKeys.filter((k) => k.key !== keyRec.key || k.deviceId !== deviceId)].slice(0, 100);
    }

    if (!body.recordKeyOnly) {
      const isRevoke = Boolean(body.revoke);
      db.devices[deviceId] = {
        deviceId,
        cliente: clienteClean === 'Cliente sin nombre' && existing?.cliente ? existing.cliente : clienteClean,
        deviceLabel: existing?.deviceLabel || 'Equipo Remoto',
        firstSeenAt: existing?.firstSeenAt ?? now,
        lastSeenAt: existing?.lastSeenAt ?? now,
        totalSessions: existing?.totalSessions ?? 0,
        totalMinutes: existing?.totalMinutes ?? 0,
        activeDays: Array.from(activeDaysSet).sort().slice(-60),
        proActive: !isRevoke,
        planCode: isRevoke ? 'FREE' : String(body.planCode || 'M'),
        planLabel: isRevoke ? 'Gratuito' : String(body.planLabel || 'PRO'),
        expiresAt: isRevoke ? null : (body.expiresAt ?? null),
        lastKey: body.key ? String(body.key) : (existing?.lastKey || ''),
        updatedAt: now,
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
        planLabel: 'Gratuito',
        expiresAt: null,
        lastKey: body.key ? String(body.key) : '',
        updatedAt: now,
      };
    } else if (body.key) {
      db.devices[deviceId] = {
        ...existing,
        cliente: clienteClean !== 'Cliente sin nombre' ? clienteClean : existing.cliente,
        lastKey: String(body.key),
      };
    }

    saveDb(db);
    broadcastSync();

    res.json({
      device: db.devices[deviceId] || null,
      ...normalizeDevicesSnapshot(now),
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
