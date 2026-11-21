import { sanitizeWhatsappNumber } from './storageHelpers';

export type CotizacionReminderStatus = 'pendiente' | 'seguimiento' | 'aprobada' | 'descartada';

export type ReminderPresetKey = '15m' | '1h' | '24h' | '3d' | '7d';

export interface CotizacionReminder {
  id: string;
  proyecto: string;
  total: number;
  partidasCount: number;
  telefonoCliente?: string;
  nota?: string;
  createdAt: number;
  dueAt: number;
  status: CotizacionReminderStatus;
  lastNotifiedAt: number | null;
  snoozeCount: number;
}

export interface CreateReminderInput {
  id?: string;
  proyecto: string;
  total: number;
  partidasCount: number;
  telefonoCliente?: string;
  nota?: string;
  dueAt: number;
  now?: number;
}

export interface SwNotificationActionButton {
  action: 'open-quote' | 'snooze-1d';
  title: string;
}

export interface SwNotificationPayload {
  title: string;
  body: string;
  tag: string;
  renotify: boolean;
  icon: string;
  badge: string;
  requireInteraction: boolean;
  actions: SwNotificationActionButton[];
  data: {
    type: 'quote-followup';
    reminderId: string;
    url: string;
    proyecto: string;
  };
}

export interface NotificationCapabilityState {
  supported: boolean;
  swSupported: boolean;
  pushSupported: boolean;
  permission: NotificationPermission | 'unsupported';
}

export type PushPermissionGuideStatus = 'granted' | 'default' | 'denied' | 'unsupported';

export interface PushPermissionGuide {
  status: PushPermissionGuideStatus;
  needsAction: boolean;
  canRequestDirectly: boolean;
  badgeLabel: string;
  headline: string;
  description: string;
  steps: string[];
  ctaLabel: string | null;
  swStatusLabel: string;
}

export function detectAppleMobileAndStandalone(): {
  isAppleMobile: boolean;
  isStandalone: boolean;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isAppleMobile: false, isStandalone: false };
  }
  const ua = navigator.userAgent || '';
  const isAppleMobile =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
  const navStandalone = Boolean((navigator as { standalone?: boolean }).standalone);
  const mediaStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  return {
    isAppleMobile,
    isStandalone: navStandalone || mediaStandalone,
  };
}

export function getPushPermissionGuide(
  cap: NotificationCapabilityState,
  options?: {
    swReady?: boolean;
    pendingCount?: number;
    isAppleMobile?: boolean;
    isStandalone?: boolean;
  }
): PushPermissionGuide {
  const swReady = Boolean(options?.swReady);
  const pendingCount = Math.max(0, Math.round(Number(options?.pendingCount) || 0));
  const isAppleMobile = Boolean(options?.isAppleMobile);
  const isStandalone = Boolean(options?.isStandalone);
  const swStatusLabel = !cap.swSupported
    ? 'Sin soporte de Service Worker'
    : swReady
      ? 'Service Worker activo'
      : 'Service Worker registrándose';

  if (!cap.supported || cap.permission === 'unsupported') {
    if (isAppleMobile && !isStandalone) {
      return {
        status: 'unsupported',
        needsAction: true,
        canRequestDirectly: false,
        badgeLabel: 'Instala la app en iPhone/iPad',
        headline: 'En iOS, instala Aluminero Pro para activar Push',
        description:
          'Safari en iPhone y iPad solo permite notificaciones Push cuando agregas la app a tu pantalla de inicio.',
        steps: [
          'Toca el botón Compartir (cuadro con flecha hacia arriba) en Safari.',
          'Elige "Agregar a inicio" y confirma con "Agregar".',
          'Abre Aluminero Pro desde el ícono instalado y toca "Activar notificaciones".',
        ],
        ctaLabel: null,
        swStatusLabel,
      };
    }

    return {
      status: 'unsupported',
      needsAction: false,
      canRequestDirectly: false,
      badgeLabel: 'No compatible',
      headline: 'Tu navegador actual no soporta notificaciones Push',
      description:
        'Aún puedes administrar tus seguimientos desde aquí. Para recibir alertas automáticas del sistema, abre la app en Chrome, Edge, Firefox o Safari actualizado.',
      steps: [],
      ctaLabel: null,
      swStatusLabel,
    };
  }

  if (cap.permission === 'granted') {
    return {
      status: 'granted',
      needsAction: false,
      canRequestDirectly: false,
      badgeLabel: swReady ? 'Push SW Activo ✓' : 'Permiso Activo ✓',
      headline: 'Notificaciones Push activadas correctamente',
      description:
        pendingCount > 0
          ? `Tu navegador enviará avisos automáticos para tus ${pendingCount} seguimiento(s) pendiente(s), incluso en segundo plano.`
          : 'Tu navegador está listo para avisarte cuando venza un seguimiento de cotización.',
      steps: [],
      ctaLabel: null,
      swStatusLabel,
    };
  }

  if (cap.permission === 'denied') {
    return {
      status: 'denied',
      needsAction: true,
      canRequestDirectly: false,
      badgeLabel: 'Bloqueadas en navegador',
      headline:
        pendingCount > 0
          ? `Tienes ${pendingCount} seguimiento(s) pendiente(s) pero las alertas están bloqueadas`
          : 'Las notificaciones están bloqueadas para este sitio',
      description:
        'El navegador no puede volver a mostrar la ventana automática mientras el permiso siga bloqueado. Habilítalo manualmente en 3 pasos:',
      steps: [
        'Toca el ícono de candado o configuración (🔒 / ⚙) junto a la dirección web arriba.',
        'Busca "Notificaciones" y cámbialo de "Bloquear" a "Permitir".',
        'Presiona el botón "Verificar permiso ahora" en esta tarjeta para conectar el Service Worker.',
      ],
      ctaLabel: 'Verificar permiso ahora',
      swStatusLabel,
    };
  }

  // cap.permission === 'default'
  return {
    status: 'default',
    needsAction: true,
    canRequestDirectly: true,
    badgeLabel: 'Pendiente de activar',
    headline:
      pendingCount > 0
        ? `Activa los avisos Push para tus ${pendingCount} cotización(es) pendiente(s)`
        : 'Activa las notificaciones Push de seguimiento',
    description:
      'Autoriza el permiso de tu navegador en 2 pasos para recibir recordatorios cuando toque dar seguimiento al cliente:',
    steps: [
      'Presiona el botón azul "Activar notificaciones Push" en esta tarjeta.',
      'Cuando aparezca el aviso de tu navegador en la parte superior, selecciona "Permitir".',
      'Listo: usaremos el Service Worker para avisarte y podrás probarlo al instante.',
    ],
    ctaLabel: 'Activar notificaciones Push',
    swStatusLabel,
  };
}

export const REMINDER_DEFAULT_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 horas entre recordatorios automáticos
export const REMINDER_SNOOZE_1D_MS = 24 * 60 * 60 * 1000;

export const REMINDER_PRESET_MS: Record<ReminderPresetKey, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

export const REMINDER_PRESET_LABELS: Record<ReminderPresetKey, string> = {
  '15m': 'En 15 min',
  '1h': 'En 1 hora',
  '24h': 'Mañana (24 h)',
  '3d': 'En 3 días',
  '7d': 'En 7 días',
};

export function computeReminderDueAt(preset: ReminderPresetKey, now = Date.now()): number {
  const delta = REMINDER_PRESET_MS[preset] ?? REMINDER_PRESET_MS['24h'];
  return Math.round(now + delta);
}

export function createCotizacionReminder(
  input: CreateReminderInput
): { ok: true; reminder: CotizacionReminder } | { ok: false; error: string } {
  const now = Number.isFinite(input.now) ? Number(input.now) : Date.now();
  const proyecto = String(input.proyecto || '').trim().slice(0, 120);
  if (!proyecto) {
    return {
      ok: false,
      error: 'Ingresa el nombre del cliente o proyecto para programar el recordatorio.',
    };
  }

  const dueAt = Number(input.dueAt);
  if (!Number.isFinite(dueAt) || dueAt <= 0) {
    return {
      ok: false,
      error: 'Selecciona una fecha y hora válida para el recordatorio.',
    };
  }

  const total = Math.max(0, Number(input.total) || 0);
  const partidasCount = Math.max(0, Math.round(Number(input.partidasCount) || 0));
  const rawPhone = String(input.telefonoCliente || '').trim();
  const cleanPhone = rawPhone ? sanitizeWhatsappNumber(rawPhone) : '';
  if (rawPhone && !cleanPhone) {
    return {
      ok: false,
      error: 'El teléfono opcional del cliente debe tener exactamente 10 dígitos.',
    };
  }
  const nota = String(input.nota || '').trim().slice(0, 200);

  const id =
    input.id && input.id.trim()
      ? input.id.trim()
      : `rem-${now}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    ok: true,
    reminder: {
      id,
      proyecto,
      total: Math.round(total * 100) / 100,
      partidasCount,
      ...(cleanPhone ? { telefonoCliente: cleanPhone } : {}),
      ...(nota ? { nota } : {}),
      createdAt: now,
      dueAt,
      status: 'pendiente',
      lastNotifiedAt: null,
      snoozeCount: 0,
    },
  };
}

export function getDueCotizacionReminders(
  reminders: CotizacionReminder[],
  now = Date.now(),
  cooldownMs = REMINDER_DEFAULT_COOLDOWN_MS
): CotizacionReminder[] {
  return reminders
    .filter((r) => {
      if (r.status !== 'pendiente') return false;
      if (!Number.isFinite(r.dueAt) || r.dueAt > now) return false;
      if (r.lastNotifiedAt !== null && Number.isFinite(r.lastNotifiedAt)) {
        return now - r.lastNotifiedAt >= cooldownMs;
      }
      return true;
    })
    .sort((a, b) => a.dueAt - b.dueAt);
}

export function partitionCotizacionReminders(
  reminders: CotizacionReminder[],
  now = Date.now()
): {
  due: CotizacionReminder[];
  upcoming: CotizacionReminder[];
  completed: CotizacionReminder[];
} {
  const due: CotizacionReminder[] = [];
  const upcoming: CotizacionReminder[] = [];
  const completed: CotizacionReminder[] = [];

  for (const r of reminders) {
    if (r.status !== 'pendiente') {
      completed.push(r);
    } else if (r.dueAt <= now) {
      due.push(r);
    } else {
      upcoming.push(r);
    }
  }

  due.sort((a, b) => a.dueAt - b.dueAt);
  upcoming.sort((a, b) => a.dueAt - b.dueAt);
  completed.sort((a, b) => b.createdAt - a.createdAt);

  return { due, upcoming, completed };
}

export function snoozeCotizacionReminder(
  reminder: CotizacionReminder,
  addMs = REMINDER_SNOOZE_1D_MS,
  now = Date.now()
): CotizacionReminder {
  const base = Math.max(now, reminder.dueAt || now);
  return {
    ...reminder,
    status: 'pendiente',
    dueAt: Math.round(base + Math.max(60_000, addMs)),
    lastNotifiedAt: null,
    snoozeCount: (reminder.snoozeCount || 0) + 1,
  };
}

export function updateCotizacionReminderStatus(
  reminder: CotizacionReminder,
  status: CotizacionReminderStatus
): CotizacionReminder {
  return {
    ...reminder,
    status,
  };
}

export function markReminderNotified(
  reminder: CotizacionReminder,
  now = Date.now()
): CotizacionReminder {
  return {
    ...reminder,
    lastNotifiedAt: now,
  };
}

function formatMoneySimple(total: number): string {
  return `$${Number(total || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildQuoteReminderNotificationPayload(
  reminder: CotizacionReminder
): SwNotificationPayload {
  const amountText = formatMoneySimple(reminder.total);
  const partsText =
    reminder.partidasCount > 0
      ? `${reminder.partidasCount} ${reminder.partidasCount === 1 ? 'partida' : 'partidas'}`
      : 'Cotización pendiente';
  const noteSuffix = reminder.nota ? ` · ${reminder.nota}` : '';
  const body = `Cotización pendiente (${partsText}) por ${amountText}. Toca para dar seguimiento al cliente.${noteSuffix}`;

  return {
    title: `Seguimiento pendiente: ${reminder.proyecto}`,
    body,
    tag: `aluminero-quote-${reminder.id}`,
    renotify: true,
    icon: './pwa-192x192.png',
    badge: './pwa-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'open-quote', title: 'Abrir cotización' },
      { action: 'snooze-1d', title: 'Posponer 1 día' },
    ],
    data: {
      type: 'quote-followup',
      reminderId: reminder.id,
      url: `./?view=hoja&reminderId=${encodeURIComponent(reminder.id)}`,
      proyecto: reminder.proyecto,
    },
  };
}

export function parseSwPushPayload(rawData: unknown): SwNotificationPayload {
  const fallback: SwNotificationPayload = {
    title: 'Recordatorio de Cotización · Aluminero Pro',
    body: 'Tienes una cotización pendiente por dar seguimiento al cliente.',
    tag: 'aluminero-quote-push',
    renotify: true,
    icon: './pwa-192x192.png',
    badge: './pwa-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'open-quote', title: 'Abrir cotización' },
      { action: 'snooze-1d', title: 'Posponer 1 día' },
    ],
    data: {
      type: 'quote-followup',
      reminderId: '',
      url: './?view=hoja',
      proyecto: 'Cotización pendiente',
    },
  };

  if (typeof rawData === 'string') {
    const trimmed = rawData.trim();
    if (!trimmed) return fallback;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return parseSwPushPayload(parsed);
    } catch {
      return {
        ...fallback,
        body: trimmed.slice(0, 240),
      };
    }
  }

  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    return fallback;
  }

  const obj = rawData as Record<string, unknown>;
  const dataObj =
    obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : {};
  const reminderId = String(obj.reminderId || dataObj.reminderId || '').trim();
  const proyecto = String(obj.proyecto || dataObj.proyecto || 'Cotización pendiente').trim();

  return {
    title: typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : fallback.title,
    body: typeof obj.body === 'string' && obj.body.trim() ? obj.body.trim() : fallback.body,
    tag:
      typeof obj.tag === 'string' && obj.tag.trim()
        ? obj.tag.trim()
        : reminderId
          ? `aluminero-quote-${reminderId}`
          : fallback.tag,
    renotify: obj.renotify !== false,
    icon: typeof obj.icon === 'string' && obj.icon.trim() ? obj.icon : fallback.icon,
    badge: typeof obj.badge === 'string' && obj.badge.trim() ? obj.badge : fallback.badge,
    requireInteraction: obj.requireInteraction !== false,
    actions: Array.isArray(obj.actions) && obj.actions.length > 0
      ? (obj.actions as SwNotificationActionButton[])
      : fallback.actions,
    data: {
      type: 'quote-followup',
      reminderId,
      url:
        typeof dataObj.url === 'string' && dataObj.url.trim()
          ? dataObj.url
          : reminderId
            ? `./?view=hoja&reminderId=${encodeURIComponent(reminderId)}`
            : fallback.data.url,
      proyecto,
    },
  };
}

export function formatReminderRelativeTime(
  dueAt: number,
  now = Date.now()
): { label: string; isOverdue: boolean } {
  const diffMs = dueAt - now;
  const isOverdue = diffMs <= 0;
  const absMins = Math.round(Math.abs(diffMs) / 60_000);

  if (absMins < 1) {
    return {
      label: isOverdue ? 'Vence ahora' : 'En menos de 1 min',
      isOverdue,
    };
  }
  if (absMins < 60) {
    return {
      label: isOverdue ? `Vencido hace ${absMins} min` : `En ${absMins} min`,
      isOverdue,
    };
  }
  const absHours = Math.round(absMins / 60);
  if (absHours < 48) {
    return {
      label: isOverdue ? `Vencido hace ${absHours} h` : `En ${absHours} h`,
      isOverdue,
    };
  }
  const absDays = Math.round(absHours / 24);
  return {
    label: isOverdue ? `Vencido hace ${absDays} d` : `En ${absDays} días`,
    isOverdue,
  };
}

export function buildFollowupWhatsappMessage(
  reminder: CotizacionReminder,
  tallerNombre?: string
): string {
  const prefix = tallerNombre?.trim() ? `*${tallerNombre.trim()}* · ` : '';
  return `${prefix}Hola, le damos seguimiento a su cotización pendiente para *${reminder.proyecto}* por ${formatMoneySimple(reminder.total)}. ¿Tiene alguna duda o le gustaría agendar visita/fabricación?`;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const clean = String(base64String || '').trim();
  const padding = '='.repeat((4 - (clean.length % 4)) % 4);
  const base64 = (clean + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData =
    typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getNotificationCapability(): NotificationCapabilityState {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      swSupported: false,
      pushSupported: false,
      permission: 'unsupported',
    };
  }
  const supported = 'Notification' in window;
  const swSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const pushSupported = swSupported && 'PushManager' in window;
  const permission: NotificationPermission | 'unsupported' = supported
    ? Notification.permission
    : 'unsupported';

  return {
    supported,
    swSupported,
    pushSupported,
    permission,
  };
}

export async function requestPushNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    await getReadyServiceWorkerRegistration();
    return 'granted';
  }
  try {
    const result = await new Promise<NotificationPermission>((resolve) => {
      let settled = false;
      const finish = (perm: NotificationPermission) => {
        if (settled) return;
        settled = true;
        resolve(perm);
      };
      try {
        const maybePromise = Notification.requestPermission((perm) => finish(perm));
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(finish, () => finish(Notification.permission));
        }
      } catch {
        finish(Notification.permission);
      }
    });
    if (result === 'granted') {
      await getReadyServiceWorkerRegistration();
    }
    return result;
  } catch {
    return Notification.permission;
  }
}

export async function getReadyServiceWorkerRegistration(
  timeoutMs = 3500
): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    let existing = await navigator.serviceWorker.getRegistration();
    if (!existing && typeof window !== 'undefined' && /^https?:$/i.test(window.location.protocol)) {
      existing = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none',
      });
    }

    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<ServiceWorkerRegistration | null>((resolve) => {
      window.setTimeout(() => resolve(existing || null), timeoutMs);
    });
    const reg = await Promise.race([readyPromise, timeoutPromise]);
    return reg || existing || null;
  } catch {
    return null;
  }
}

export async function subscribeBrowserPushOptional(
  deviceId: string
): Promise<{ subscribed: boolean; endpoint?: string; reason?: string }> {
  const cap = getNotificationCapability();
  if (!cap.pushSupported || cap.permission !== 'granted') {
    return { subscribed: false, reason: 'Permiso o PushManager no disponible' };
  }

  try {
    const reg = await getReadyServiceWorkerRegistration();
    if (!reg || !reg.pushManager) {
      return { subscribed: false, reason: 'Service Worker PushManager no listo' };
    }

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const keyRes = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
      if (!keyRes.ok) {
        return { subscribed: false, reason: 'Sin clave pública VAPID del servidor' };
      }
      const keyData = (await keyRes.json()) as { ok?: boolean; publicKey?: string };
      if (!keyData.ok || !keyData.publicKey) {
        return { subscribed: false, reason: 'Clave VAPID inválida' };
      }

      const appServerKey = urlBase64ToUint8Array(keyData.publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });
    }

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        subscription: subscription.toJSON(),
      }),
    }).catch(() => {});

    return { subscribed: true, endpoint: subscription.endpoint };
  } catch (err) {
    return {
      subscribed: false,
      reason: err instanceof Error ? err.message : 'Push service no disponible en este entorno',
    };
  }
}

export async function dispatchQuoteReminderNotification(
  reminder: CotizacionReminder
): Promise<{ ok: boolean; via: 'service-worker' | 'window-notification' | 'none'; error?: string }> {
  const cap = getNotificationCapability();
  if (!cap.supported) {
    return { ok: false, via: 'none', error: 'Este navegador no soporta notificaciones.' };
  }
  if (cap.permission !== 'granted') {
    return {
      ok: false,
      via: 'none',
      error:
        cap.permission === 'denied'
          ? 'Las notificaciones están bloqueadas en la configuración del navegador.'
          : 'Activa el permiso de notificaciones primero.',
    };
  }

  const payload = buildQuoteReminderNotificationPayload(reminder);
  const reg = await getReadyServiceWorkerRegistration();

  if (reg && typeof reg.showNotification === 'function') {
    try {
      await reg.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        renotify: payload.renotify,
        icon: payload.icon,
        badge: payload.badge,
        requireInteraction: payload.requireInteraction,
        actions: payload.actions,
        data: payload.data,
      } as NotificationOptions);
      return { ok: true, via: 'service-worker' };
    } catch {
      if (reg.active) {
        reg.active.postMessage({ type: 'SHOW_QUOTE_REMINDER', payload });
        return { ok: true, via: 'service-worker' };
      }
    }
  }

  try {
    new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: payload.icon,
      data: payload.data,
    });
    return { ok: true, via: 'window-notification' };
  } catch (err) {
    return {
      ok: false,
      via: 'none',
      error: err instanceof Error ? err.message : 'No se pudo mostrar la notificación.',
    };
  }
}

export async function syncRemindersToServer(
  deviceId: string,
  reminders: CotizacionReminder[]
): Promise<void> {
  if (!deviceId || typeof fetch !== 'function') return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  try {
    await fetch('/api/push/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, reminders: reminders.slice(0, 100) }),
    });
  } catch {
    // Silencioso en modo offline
  }
}
