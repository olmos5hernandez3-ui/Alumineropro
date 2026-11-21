export interface ExitGuardHistoryState {
  internalStep: false;
  view: 'root';
  app: 'aluminero-pro';
  depth: 0;
  guard: 1;
}

export interface InstallExitGuardOptions {
  showToast?: (msg: string, topSuccess?: boolean, durationMs?: number) => void;
  isAtRoot?: () => boolean;
}

export const EXIT_GUARD_STATE: ExitGuardHistoryState = {
  internalStep: false,
  view: 'root',
  app: 'aluminero-pro',
  depth: 0,
  guard: 1,
};

const SWIPE_WINDOW_MS = 2000;
const REPUSH_DELAY_MS = 2100;
const TAP_WINDOW_MS = 2000;
const ARROW_SUPPRESS_MS = 12000;

let installed = false;
let interactionBound = false;
let toastHandler: ((msg: string, topSuccess?: boolean, durationMs?: number) => void) | null = null;
let isAtRootCheck: () => boolean = () => true;

let swipeArmedUntil = 0;
let tapArmedUntil = 0;
let guardSuppressedUntil = 0;
let repushTimerId: number | null = null;
let programmaticBackCount = 0;
let fallbackToastEl: HTMLDivElement | null = null;
let fallbackToastTimerId: number | null = null;

function notifyToast(msg: string, durationMs: number = 2200): void {
  if (toastHandler) {
    toastHandler(msg, false, durationMs);
    return;
  }
  if (typeof document === 'undefined') return;
  if (!fallbackToastEl) {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.style.cssText =
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:10000;' +
      'padding:10px 16px;border-radius:12px;background:#0f172a;color:#ffffff;' +
      'border:1px solid #475569;font-size:13.5px;font-weight:700;text-align:center;' +
      'max-width:90vw;box-shadow:0 16px 36px rgba(0,0,0,0.45);pointer-events:none;';
    document.body.appendChild(el);
    fallbackToastEl = el;
  }
  fallbackToastEl.textContent = msg;
  fallbackToastEl.style.display = 'block';
  if (fallbackToastTimerId !== null) {
    window.clearTimeout(fallbackToastTimerId);
  }
  fallbackToastTimerId = window.setTimeout(() => {
    fallbackToastTimerId = null;
    if (fallbackToastEl) {
      fallbackToastEl.style.display = 'none';
    }
  }, durationMs);
}

export function hasGuardState(state: unknown): boolean {
  return Boolean(state && typeof state === 'object' && (state as { guard?: unknown }).guard);
}

export function isExitGuardSuppressed(): boolean {
  return Date.now() < guardSuppressedUntil;
}

export function cancelPendingExitGuardRepush(): void {
  if (repushTimerId !== null) {
    window.clearTimeout(repushTimerId);
    repushTimerId = null;
  }
}

export function resetExitGuardArmed(): void {
  swipeArmedUntil = 0;
  tapArmedUntil = 0;
  cancelPendingExitGuardRepush();
}

export function consumeProgrammaticExitBack(): boolean {
  if (programmaticBackCount > 0) {
    programmaticBackCount -= 1;
    return true;
  }
  return false;
}

export function pushExitGuardState(): boolean {
  if (typeof window === 'undefined' || !window.history?.pushState) return false;
  if (isExitGuardSuppressed()) return false;
  if (hasGuardState(window.history.state)) return false;
  try {
    window.history.pushState({ ...EXIT_GUARD_STATE }, '');
    return true;
  } catch {
    return false;
  }
}

const INTERACTION_EVENTS = ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll'] as const;

function removeInteractionListeners(): void {
  if (!interactionBound || typeof window === 'undefined') return;
  interactionBound = false;
  for (const evt of INTERACTION_EVENTS) {
    window.removeEventListener(evt, handleFirstUserInteraction, true);
  }
}

function handleFirstUserInteraction(): void {
  if (typeof window === 'undefined') return;
  if (isExitGuardSuppressed()) return;
  if (!isAtRootCheck()) {
    removeInteractionListeners();
    return;
  }
  if (!hasGuardState(window.history.state) && window.history.state?.internalStep !== true) {
    pushExitGuardState();
  }
  removeInteractionListeners();
}

/**
 * Instala la protección de salida por interacción de usuario una sola vez al montar App.
 * Android ignora entradas empujadas sin gesto del usuario, por eso se empuja
 * `{ internalStep:false, view:'root', app:'aluminero-pro', depth:0, guard:1 }`
 * en la primera interacción (fase de captura) y luego se retiran los listeners.
 */
export function installExitGuard(options?: InstallExitGuardOptions): () => void {
  if (options?.showToast) {
    toastHandler = options.showToast;
  }
  if (options?.isAtRoot) {
    isAtRootCheck = options.isAtRoot;
  }

  if (typeof window !== 'undefined' && !installed) {
    installed = true;
    if (!hasGuardState(window.history.state) && !interactionBound) {
      interactionBound = true;
      for (const evt of INTERACTION_EVENTS) {
        window.addEventListener(evt, handleFirstUserInteraction, {
          capture: true,
          passive: true,
        });
      }
    }
  }

  return () => {
    cancelPendingExitGuardRepush();
  };
}

/**
 * Maneja el gesto de regreso (`popstate`) cuando el usuario ya está en la raíz (`menu`)
 * sin vistas ni modales abiertos:
 * - Si el estado al que se aterrizó ya trae `guard`, no vuelve a empujar.
 * - Si el segundo gesto llega en menos de 2 s, NO vuelve a empujar historial para que la app salga.
 * - Si es el primer gesto, muestra "Desliza de nuevo para salir" y programa el re-empuje a los 2.1 s
 *   solo si sigue en la raíz, sin `guard` y sin haber navegado.
 */
export function handleRootExitPopState(eventState: unknown): void {
  if (typeof window === 'undefined') return;
  if (isExitGuardSuppressed()) {
    cancelPendingExitGuardRepush();
    swipeArmedUntil = 0;
    return;
  }
  if (hasGuardState(eventState)) {
    return;
  }

  const now = Date.now();
  if (now < swipeArmedUntil) {
    // Segundo gesto dentro de 2 segundos: cancelar re-empuje y permitir salir sin empujar historial
    swipeArmedUntil = 0;
    cancelPendingExitGuardRepush();
    return;
  }

  // Primer gesto: avisar y programar re-empuje a los 2.1 s
  swipeArmedUntil = now + SWIPE_WINDOW_MS;
  notifyToast('Desliza de nuevo para salir', SWIPE_WINDOW_MS);
  cancelPendingExitGuardRepush();
  repushTimerId = window.setTimeout(() => {
    repushTimerId = null;
    swipeArmedUntil = 0;
    if (
      !isExitGuardSuppressed() &&
      isAtRootCheck() &&
      !hasGuardState(window.history.state) &&
      window.history.state?.internalStep !== true
    ) {
      pushExitGuardState();
    }
  }, REPUSH_DELAY_MS);
}

/**
 * Acción para el botón flecha izquierda (`btn-top-back`) en la pantalla principal (`menu`):
 * - Primer toque: toast "Toca la flecha de nuevo para salir".
 * - Segundo toque dentro de 2 s: intenta `window.close()`, quita la protección con
 *   `history.go(-1)` si el estado actual trae `guard`, desactiva el re-empuje automático
 *   durante 12 segundos y muestra "Listo: desliza una vez más (izquierda o derecha) para salir".
 */
export function exitTap(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();

  if (now < tapArmedUntil) {
    tapArmedUntil = 0;
    swipeArmedUntil = 0;
    cancelPendingExitGuardRepush();
    guardSuppressedUntil = now + ARROW_SUPPRESS_MS;

    try {
      window.close();
    } catch {
      // Ignorar si el navegador bloquea window.close()
    }

    if (hasGuardState(window.history.state)) {
      try {
        programmaticBackCount += 1;
        window.history.go(-1);
      } catch {
        programmaticBackCount = Math.max(0, programmaticBackCount - 1);
      }
    }

    notifyToast('Listo: desliza una vez más (izquierda o derecha) para salir', 3500);
    return;
  }

  tapArmedUntil = now + TAP_WINDOW_MS;
  notifyToast('Toca la flecha de nuevo para salir', TAP_WINDOW_MS);
}
