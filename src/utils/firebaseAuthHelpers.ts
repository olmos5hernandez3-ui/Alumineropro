export interface FirebaseAuthErrorInfo {
  code: string;
  message: string;
  isUnauthorizedDomain: boolean;
  shouldFallbackToRedirect: boolean;
}

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
]);

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
      message: `El dominio "${host}" aún no está autorizado en Firebase Authentication. Agrégalo en Firebase Console → Authentication → Settings → Authorized domains.`,
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

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
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
      message: 'Sin conexión a internet para conectar con Google. Revisa tu red e intenta de nuevo.',
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      code,
      isUnauthorizedDomain: false,
      shouldFallbackToRedirect: false,
      message: 'El inicio de sesión con Google no está habilitado en Firebase Authentication.',
    };
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return {
      code,
      isUnauthorizedDomain: false,
      shouldFallbackToRedirect: false,
      message: 'Ya existe una cuenta registrada con este correo usando otro método de acceso.',
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
      message: `El dominio "${host}" aún no está autorizado en Firebase Authentication. Agrégalo en Firebase Console → Authentication → Settings → Authorized domains.`,
    };
  }

  return {
    code: code || 'auth/unknown',
    isUnauthorizedDomain: false,
    shouldFallbackToRedirect: false,
    message: code
      ? `No se pudo conectar con Google (${code}). Intenta nuevamente.`
      : 'No se pudo conectar con Google. Verifica tu conexión o intenta nuevamente.',
  };
}
