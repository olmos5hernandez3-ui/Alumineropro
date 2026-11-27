const APP_VERSION = '1.0.8';
const CACHE_NAME = `aluminero-pro-v${APP_VERSION}`;
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/avatars/robot.png',
  '/avatars/castor.png',
  '/avatars/buho.png',
  '/avatars/gatito.png',
  '/avatars/perrito.png',
  '/avatars/puerquito.png',
  '/avatars/gallito.png',
];

function normalizePushPayload(raw) {
  const fallback = {
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
    },
  };

  if (!raw || typeof raw !== 'object') return fallback;
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
  const reminderId = String(raw.reminderId || data.reminderId || '').trim();
  return {
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : fallback.title,
    body: typeof raw.body === 'string' && raw.body.trim() ? raw.body.trim() : fallback.body,
    tag: typeof raw.tag === 'string' && raw.tag.trim() ? raw.tag.trim() : fallback.tag,
    renotify: raw.renotify !== false,
    icon: typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon : fallback.icon,
    badge: typeof raw.badge === 'string' && raw.badge.trim() ? raw.badge : fallback.badge,
    requireInteraction: raw.requireInteraction !== false,
    actions: Array.isArray(raw.actions) && raw.actions.length > 0 ? raw.actions : fallback.actions,
    data: {
      type: 'quote-followup',
      reminderId,
      url:
        typeof data.url === 'string' && data.url.trim()
          ? data.url
          : reminderId
            ? `./?view=hoja&reminderId=${encodeURIComponent(reminderId)}`
            : fallback.data.url,
    },
  };
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        APP_SHELL_ASSETS.map((asset) =>
          cache.add(new Request(asset, { cache: 'reload' })).catch(() => {})
        )
      )
    )
  );
  // NO llamar self.skipWaiting() aquí: el nuevo Service Worker debe permanecer en estado "waiting"
  // hasta que el usuario confirme "Actualizar ahora" enviando { type: 'SKIP_WAITING' }.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (msg.type === 'SHOW_QUOTE_REMINDER') {
    const payload = normalizePushPayload(msg.payload || {});
    event.waitUntil(
      self.registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        renotify: payload.renotify,
        icon: payload.icon,
        badge: payload.badge,
        requireInteraction: payload.requireInteraction,
        actions: payload.actions,
        data: payload.data,
      })
    );
  }
});

self.addEventListener('push', (event) => {
  let raw = {};
  if (event.data) {
    try {
      raw = event.data.json();
    } catch {
      try {
        const text = event.data.text();
        raw = text ? { body: text } : {};
      } catch {
        raw = {};
      }
    }
  }
  const payload = normalizePushPayload(raw);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      renotify: payload.renotify,
      icon: payload.icon,
      badge: payload.badge,
      requireInteraction: payload.requireInteraction,
      actions: payload.actions,
      data: payload.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action || 'open-quote';
  const data = (notification && notification.data) || {};
  const reminderId = typeof data.reminderId === 'string' ? data.reminderId : '';
  notification.close();

  const targetUrl =
    action === 'snooze-1d'
      ? `./?reminderAction=snooze-1d&reminderId=${encodeURIComponent(reminderId)}`
      : typeof data.url === 'string' && data.url.trim()
        ? data.url
        : `./?view=hoja&reminderId=${encodeURIComponent(reminderId)}`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus().catch(() => {});
          client.postMessage({
            type: 'SW_REMINDER_ACTION',
            action,
            reminderId,
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No cachear rutas de API en tiempo real, SSE, descarga standalone ni rutas internas de dev Vite
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/api/') ||
      url.pathname === '/__aluminero_single.html' ||
      url.pathname.startsWith('/@vite') ||
      url.pathname.startsWith('/@react-refresh') ||
      url.pathname.startsWith('/@fs/') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/node_modules/'))
  ) {
    return;
  }

  // Fuentes de Google y CDN de JSZip: Cache-first con respaldo de red
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'cdn.jsdelivr.net'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Navegación SPA y index.html: Network-First con respaldo offline
  // Usar request.url (no Request con mode:'navigate' + init) para evitar TypeError en Chromium
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request.url, { cache: 'no-store', credentials: 'same-origin' })
        .then((response) => {
          if (response && response.ok && url.origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(request)) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/'))
          );
        })
    );
    return;
  }

  // Todos los recursos de la app del mismo origen (.js, .css, assets, imágenes): Network-First con fallback offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          return cached || Response.error();
        })
    );
  }
});
