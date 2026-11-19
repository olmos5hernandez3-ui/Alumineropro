import type { CloudDeviceRecord, UsageStats30d } from './alumineroLogic';
import type { AdminKeyRecord, LicenciaState } from './storageHelpers';

export interface CloudSyncSnapshot {
  devices: CloudDeviceRecord[];
  adminKeys: AdminKeyRecord[];
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

export async function fetchCloudDevicesState(): Promise<CloudSyncSnapshot | null> {
  try {
    const res = await fetch(`/api/devices?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok || !(res.headers.get('content-type') || '').toLowerCase().includes('application/json')) return null;
    return (await res.json()) as CloudSyncSnapshot;
  } catch {
    return null;
  }
}

export async function syncDeviceToCloud(params: {
  deviceId: string;
  cliente?: string;
  deviceLabel?: string;
  eventType?: 'open' | 'heartbeat' | 'license_sync';
  minutesDelta?: number;
  licencia?: LicenciaState | null;
}): Promise<CloudSyncSnapshot | null> {
  try {
    const res = await fetch(`/api/devices/register?t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        deviceId: params.deviceId,
        cliente: params.cliente || '',
        deviceLabel: params.deviceLabel || detectDeviceLabel(),
        eventType: params.eventType || 'open',
        minutesDelta: params.minutesDelta,
        licencia: params.licencia ?? null,
      }),
    });
    if (!res.ok || !(res.headers.get('content-type') || '').toLowerCase().includes('application/json')) return null;
    return (await res.json()) as CloudSyncSnapshot;
  } catch {
    return null;
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
  recordKeyOnly?: boolean;
}): Promise<CloudSyncSnapshot | null> {
  try {
    const res = await fetch(`/api/devices/${encodeURIComponent(params.deviceId)}/license?t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(params),
    });
    if (!res.ok || !(res.headers.get('content-type') || '').toLowerCase().includes('application/json')) return null;
    return (await res.json()) as CloudSyncSnapshot;
  } catch {
    return null;
  }
}

export function subscribeCloudDevices(
  onSync: (snapshot: CloudSyncSnapshot) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    onStatusChange?.(false);
    return () => {};
  }

  let closed = false;
  let es: EventSource | null = null;
  let reconnectTimer: number | null = null;

  const connect = () => {
    if (closed) return;
    try {
      es = new EventSource(`/api/devices/stream?t=${Date.now()}`);
      es.addEventListener('open', () => {
        if (!closed) onStatusChange?.(true);
      });
      es.addEventListener('sync', (ev) => {
        if (closed) return;
        try {
          const parsed = JSON.parse((ev as MessageEvent).data) as CloudSyncSnapshot;
          onStatusChange?.(true);
          onSync(parsed);
        } catch {
          // ignore malformed event frames
        }
      });
      es.addEventListener('error', () => {
        if (closed) return;
        onStatusChange?.(false);
        es?.close();
        es = null;
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(connect, 3500);
      });
    } catch {
      onStatusChange?.(false);
    }
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    if (es) {
      es.close();
      es = null;
    }
  };
}

export async function verifyAdminPasswordWithServer(
  password: string
): Promise<{ ok: boolean; offline?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/verify?t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ password: password.trim() }),
    });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return { ok: false, offline: true };
    }
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) {
      return { ok: true };
    }
    if (res.status === 401) {
      return { ok: false, error: data.error || 'Contraseña incorrecta' };
    }
    return { ok: false, offline: true };
  } catch {
    return { ok: false, offline: true };
  }
}

export async function resetAdminPasswordWithServer(
  pin: string,
  newPassword: string
): Promise<{ ok: boolean; offline?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/reset-password?t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        pin: pin.trim(),
        newPassword: newPassword.trim(),
      }),
    });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return { ok: false, offline: true };
    }
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) {
      return { ok: true };
    }
    if (res.status === 400 || res.status === 403) {
      return { ok: false, error: data.error || 'PIN de recuperación incorrecto' };
    }
    return { ok: false, offline: true };
  } catch {
    return { ok: false, offline: true };
  }
}

