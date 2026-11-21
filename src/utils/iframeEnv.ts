/**
 * Detecta si la aplicación se está ejecutando embebida dentro de un iframe
 * (por ejemplo, el Preview de Google AI Studio).
 * Si el acceso cross-origin a `window.top` lanza SecurityError, asume `true`.
 */
export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
