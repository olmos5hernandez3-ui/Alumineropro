export interface WindowLike {
  self?: unknown;
  top?: unknown;
  history?: {
    pushState?: (data: unknown, unused: string, url?: string | URL | null) => void;
    replaceState?: (data: unknown, unused: string, url?: string | URL | null) => void;
    back?: () => void;
    go?: (delta?: number) => void;
    state?: unknown;
  };
  addEventListener?: Window['addEventListener'];
  removeEventListener?: Window['removeEventListener'];
}

export interface NavigatorLike {
  serviceWorker?: unknown;
}

/**
 * Detecta de forma segura si la aplicación corre dentro de un iframe
 * (como la vista previa de AI Studio). Si acceder a window.top lanza
 * SecurityError por origen cruzado, asume que está en un iframe (true).
 */
export function isRunningInIframe(win?: WindowLike | null): boolean {
  const target =
    win !== undefined ? win : typeof window !== 'undefined' ? (window as unknown as WindowLike) : null;
  if (!target) return false;
  try {
    return target.self !== target.top;
  } catch {
    return true;
  }
}

export function canUseBrowserHistory(win?: WindowLike | null): boolean {
  const target =
    win !== undefined ? win : typeof window !== 'undefined' ? (window as unknown as WindowLike) : null;
  if (!target || isRunningInIframe(target)) return false;
  try {
    return Boolean(target.history && typeof target.history.pushState === 'function');
  } catch {
    return false;
  }
}

export function canUseServiceWorker(
  win?: WindowLike | null,
  nav?: NavigatorLike | null
): boolean {
  const targetWin =
    win !== undefined ? win : typeof window !== 'undefined' ? (window as unknown as WindowLike) : null;
  if (!targetWin || isRunningInIframe(targetWin)) return false;
  const targetNav =
    nav !== undefined ? nav : typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorLike) : null;
  if (!targetNav) return false;
  try {
    return 'serviceWorker' in targetNav && Boolean(targetNav.serviceWorker);
  } catch {
    return false;
  }
}

export function safeHistoryPushState(
  state: unknown,
  title = '',
  url?: string | URL | null
): boolean {
  if (!canUseBrowserHistory()) return false;
  try {
    if (url !== undefined) {
      window.history.pushState(state, title, url);
    } else {
      window.history.pushState(state, title);
    }
    return true;
  } catch {
    return false;
  }
}

export function safeHistoryReplaceState(
  state: unknown,
  title = '',
  url?: string | URL | null
): boolean {
  if (!canUseBrowserHistory()) return false;
  try {
    if (typeof window.history?.replaceState !== 'function') return false;
    if (url !== undefined) {
      window.history.replaceState(state, title, url);
    } else {
      window.history.replaceState(state, title);
    }
    return true;
  } catch {
    return false;
  }
}

export function safeHistoryBack(): boolean {
  if (!canUseBrowserHistory()) return false;
  try {
    if (typeof window.history?.back !== 'function') return false;
    window.history.back();
    return true;
  } catch {
    return false;
  }
}

export function safeHistoryGo(delta: number): boolean {
  if (!canUseBrowserHistory()) return false;
  try {
    if (typeof window.history?.go !== 'function') return false;
    window.history.go(delta);
    return true;
  } catch {
    return false;
  }
}

export function safeGetHistoryState<T = Record<string, unknown>>(): T | null {
  if (!canUseBrowserHistory()) return null;
  try {
    return (window.history?.state as T) ?? null;
  } catch {
    return null;
  }
}

export function safeAddPopStateListener(
  handler: (event: PopStateEvent) => void,
  capture = false
): () => void {
  if (!canUseBrowserHistory()) {
    return () => {};
  }
  const wrapped = (event: PopStateEvent) => {
    try {
      handler(event);
    } catch {
      // Evitar que un error en popstate bloquee la vista
    }
  };
  try {
    window.addEventListener('popstate', wrapped, capture);
  } catch {
    return () => {};
  }
  return () => {
    try {
      window.removeEventListener('popstate', wrapped, capture);
    } catch {
      // Ignorar si removeEventListener falla
    }
  };
}
