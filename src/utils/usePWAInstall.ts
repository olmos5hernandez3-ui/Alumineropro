import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __alumineroDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
    __alumineroPwaInstalled?: boolean;
  }
}

export const PWA_INSTALLED_STORAGE_KEY = 'aluminero_pwa_installed_v1';

export function clearPersistedPwaInstalled(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PWA_INSTALLED_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function savePersistedPwaInstalled(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, '1');
  } catch {
    // ignore storage errors in private mode
  }
}

export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const matchStandalone =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches);
  const iosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const androidAppReferrer =
    typeof document !== 'undefined' && document.referrer.startsWith('android-app://');
  return Boolean(matchStandalone || iosStandalone || androidAppReferrer);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.__alumineroDeferredInstallPrompt ?? null : null
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(
    () =>
      checkIsStandalone() ||
      (typeof window !== 'undefined' && Boolean(window.__alumineroPwaInstalled))
  );
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standaloneNow = checkIsStandalone();
    if (standaloneNow || window.__alumineroPwaInstalled) {
      savePersistedPwaInstalled();
      setIsInstalled(true);
      setDeferredPrompt(null);
    } else {
      clearPersistedPwaInstalled();
      setIsInstalled(false);
      if (window.__alumineroDeferredInstallPrompt) {
        setDeferredPrompt(window.__alumineroDeferredInstallPrompt);
      }
    }

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(display-mode: standalone)')
        : null;

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches || checkIsStandalone()) {
        window.__alumineroPwaInstalled = true;
        window.__alumineroDeferredInstallPrompt = null;
        savePersistedPwaInstalled();
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__alumineroDeferredInstallPrompt = promptEvent;
      window.__alumineroPwaInstalled = false;
      clearPersistedPwaInstalled();
      setIsInstalled(false);
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      window.__alumineroPwaInstalled = true;
      window.__alumineroDeferredInstallPrompt = null;
      savePersistedPwaInstalled();
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    if (mediaQuery && typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery && typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptEvent = deferredPrompt || window.__alumineroDeferredInstallPrompt || null;
    if (!promptEvent) return 'unavailable';
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      window.__alumineroDeferredInstallPrompt = null;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        window.__alumineroPwaInstalled = true;
        savePersistedPwaInstalled();
        setIsInstalled(true);
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      window.__alumineroDeferredInstallPrompt = null;
      setDeferredPrompt(null);
      return 'unavailable';
    }
  };

  return {
    canPromptNative: Boolean(deferredPrompt || (typeof window !== 'undefined' && window.__alumineroDeferredInstallPrompt)),
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return isOnline;
}
