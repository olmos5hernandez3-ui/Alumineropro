export interface FirebaseAuthErrorInfo {
  code: string;
  message: string;
  isUnauthorizedDomain: boolean;
  shouldFallbackToRedirect: boolean;
}

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
]);

const NON_POPUP_FIREBASE_BLOCK_CODES = new Set([
  'auth/unauthorized-domain',
  'auth/operation-not-allowed',
  'auth/network-request-failed',
  'auth/account-exists-with-different-credential',
  'auth/user-disabled',
  'auth/too-many-requests',
  'auth/invalid-api-key',
  'auth/app-not-authorized',
  'auth/popup-closed-by-user',
]);

export function isMobileOrStandalonePwa(
  userAgent?: string,
  isStandaloneOverride?: boolean
): boolean {
  if (typeof isStandaloneOverride === 'boolean' && isStandaloneOverride) return true;
  if (typeof window !== 'undefined') {
    const standaloneMedia =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone =
      typeof navigator !== 'undefined' &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (standaloneMedia || iosStandalone) return true;
  }
  const ua =
    typeof userAgent === 'string'
      ? userAgent
      : typeof navigator !== 'undefined'
        ? navigator.userAgent || ''
        : '';
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);
}

export function extractFirebaseAuthCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const maybe = error as { code?: unknown; message?: unknown };
  if (typeof maybe.code === 'string' && maybe.code.trim()) {
    return maybe.code.trim().toLowerCase();
  }
  const msg = typeof maybe.message === 'string' ? maybe.message : '';
  const match = msg.match(/\((auth\/[a-z0-9-]+)\)/i);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Determina si el botón "Conectar Google" del Panel de Administrador debe
 * cambiar automáticamente de signInWithPopup a signInWithRedirect.
 */
export function shouldAdminFallbackToRedirect(
  error: unknown,
  options?: { isMobileOrPwa?: boolean }
): boolean {
  const code = extractFirebaseAuthCode(error);
  if (POPUP_FALLBACK_CODES.has(code)) {
    return true;
  }
  const mobileOrPwa =
    typeof options?.isMobileOrPwa === 'boolean'
      ? options.isMobileOrPwa
      : isMobileOrStandalonePwa();
  if (mobileOrPwa) {
    if (!code || !NON_POPUP_FIREBASE_BLOCK_CODES.has(code)) {
      return true;
    }
  }
  return false;
}

export interface AdminAuthDiagnostic {
  code: string;
  hostname: string;
  isUnauthorizedDomain: boolean;
  summary: string;
  detail: string;
  fullMessage: string;
}

/**
 * Construye un diagnóstico exacto con `error.code` y `window.location.hostname`
 * cuando falla la autenticación de Firebase por un motivo distinto al bloqueo de popup.
 */
export function formatAdminAuthDiagnostic(
  error: unknown,
  currentHostname?: string
): AdminAuthDiagnostic {
  const extracted = extractFirebaseAuthCode(error);
  const rawMsg =
    error instanceof Error && error.message
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  const code =
    extracted ||
    (rawMsg.toLowerCase().includes('unauthorized-domain')
      ? 'auth/unauthorized-domain'
      : 'auth/unknown');
  const hostname =
    (currentHostname && currentHostname.trim()) ||
    (typeof window !== 'undefined' && window.location?.hostname) ||
    'desconocido';

  const isUnauthorizedDomain = code === 'auth/unauthorized-domain';

  if (isUnauthorizedDomain) {
    const summary = `Dominio no autorizado en Firebase (${code})`;
    const detail = `Dominio actual: ${hostname}. Agrégalo en Firebase Console → Authentication → Settings → Authorized domains.`;
    return {
      code,
      hostname,
      isUnauthorizedDomain: true,
      summary,
      detail,
      fullMessage: `${summary} · ${detail}`,
    };
  }

  if (code === 'auth/network-request-failed') {
    const summary = `Error de red al conectar con Google (${code})`;
    const detail = `Dominio: ${hostname}. Verifica tu conexión a internet e intenta de nuevo.`;
    return {
      code,
      hostname,
      isUnauthorizedDomain: false,
      summary,
      detail,
      fullMessage: `${summary} · ${detail}`,
    };
  }

  if (code === 'auth/operation-not-allowed') {
    const summary = `Proveedor de Google deshabilitado (${code})`;
    const detail = `Dominio: ${hostname}. Habilita Google en Firebase Console → Authentication → Sign-in method.`;
    return {
      code,
      hostname,
      isUnauthorizedDomain: false,
      summary,
      detail,
      fullMessage: `${summary} · ${detail}`,
    };
  }

  const summary = `Error de autenticación de Firebase (${code})`;
  const detail = `Dominio: ${hostname}${rawMsg ? ` · ${rawMsg}` : ''}`;
  return {
    code,
    hostname,
    isUnauthorizedDomain: false,
    summary,
    detail,
    fullMessage: `${summary} · ${detail}`,
  };
}

export function formatFirebaseAuthError(
  error: unknown,
  currentHostname?: string
): FirebaseAuthErrorInfo {
  const code = extractFirebaseAuthCode(error);
  const host =
    (currentHostname && currentHostname.trim()) ||
    (typeof window !== 'undefined' && window.location?.hostname) ||
    'este dominio';

  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      isUnauthorizedDomain: true,
      shouldFallbackToRedirect: false,
      message: `El dominio "${host}" aún no está autorizado en Firebase Authentication (${code}). Agrégalo en Firebase Console → Authentication → Settings → Authorized domains.`,
    };
  }

  if (POPUP_FALLBACK_CODES.has(code)) {
    return {
      code,
      isUnauthorizedDomain: false,
      shouldFallbackToRedirect: true,
      message: 'El navegador bloqueó la ventana emergente de Google. Redirigiendo de forma segura...',
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      code,
      isUnauthorizedDomain: false,
      shouldFallbackToRedirect: false,
      message: 'Se cerró la ventana de Google antes de completar el inicio de sesión. Intenta nuevamente.',
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code,
      isUnauthorizedDomain: false,
      shouldFallbackToRedirect: false,
      message: `Sin conexión a internet para conectar con Google (${code}). Revisa tu red e intenta de nuevo.`,
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code,
      isUnauthorizedDomain: false,
      shouldFallbackToRedirect: false,
      message: `El inicio de sesión con Google no está habilitado en Firebase Authentication (${code}).`,
    };
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return {
      code,
      isUnauthorizedDomain: false,
      shouldFallbackToRedirect: false,
      message: `Ya existe una cuenta registrada con este correo usando otro método de acceso (${code}).`,
    };
  }

  const rawMsg =
    error instanceof Error && error.message
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  if (rawMsg.toLowerCase().includes('unauthorized-domain')) {
    return {
      code: 'auth/unauthorized-domain',
      isUnauthorizedDomain: true,
      shouldFallbackToRedirect: false,
      message: `El dominio "${host}" aún no está autorizado en Firebase Authentication (auth/unauthorized-domain). Agrégalo en Firebase Console → Authentication → Settings → Authorized domains.`,
    };
  }

  return {
    code: code || 'auth/unknown',
    isUnauthorizedDomain: false,
    shouldFallbackToRedirect: false,
    message: code
      ? `No se pudo conectar con Google (${code} · Dominio: ${host}). Intenta nuevamente.`
      : `No se pudo conectar con Google (Dominio: ${host}). Verifica tu conexión o intenta nuevamente.`,
  };
}
