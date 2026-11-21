export function easeInOutQuad(x: number): number {
  const clamped = Math.max(0, Math.min(1, x));
  return clamped < 0.5
    ? 2 * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 2) / 2;
}

export const SIM_OPEN_MS = 3000;
export const SIM_PAUSE_OPEN_MS = 1250;
export const SIM_CLOSE_MS = 3000;
export const SIM_PAUSE_CLOSED_MS = 600;
export const SIM_CYCLE_MS =
  SIM_OPEN_MS + SIM_PAUSE_OPEN_MS + SIM_CLOSE_MS + SIM_PAUSE_CLOSED_MS;

/**
 * Calcula el progreso [0..100] de la simulación rAF en función del tiempo
 * transcurrido dentro del ciclo: 3s abriendo, 1.25s abierta, 3s cerrando, 0.6s cerrada.
 */
export function computeSimProgressFromElapsed(elapsedMs: number): number {
  const safe = Math.max(0, elapsedMs);
  const t = safe % SIM_CYCLE_MS;
  if (t < SIM_OPEN_MS) {
    return Math.round(easeInOutQuad(t / SIM_OPEN_MS) * 1000) / 10;
  }
  const tAfterOpen = t - SIM_OPEN_MS;
  if (tAfterOpen < SIM_PAUSE_OPEN_MS) {
    return 100;
  }
  const tAfterPauseOpen = tAfterOpen - SIM_PAUSE_OPEN_MS;
  if (tAfterPauseOpen < SIM_CLOSE_MS) {
    const closeRatio = 1 - easeInOutQuad(tAfterPauseOpen / SIM_CLOSE_MS);
    return Math.round(closeRatio * 1000) / 10;
  }
  return 0;
}

/**
 * Calcula el desplazamiento X en unidades SVG de cada hoja corrediza.
 * Para 2 y 3 hojas recorre el 100% del ancho de una hoja (`leafW`) hasta quedar
 * alineada completamente sobre la hoja fija (tanto normal como invertida).
 * Para 4 hojas conserva el desplazamiento original.
 */
export function computeCorredizaLeafTranslateX(options: {
  numHojas: number;
  idx: number;
  leafW: number;
  t: number;
  invertido: boolean;
  slideOffset: number;
}): number {
  const { numHojas, idx, leafW, t, invertido, slideOffset } = options;
  const isMovil =
    (numHojas === 2 && (invertido ? idx === 0 : idx === 1)) ||
    (numHojas === 3 && idx === 1) ||
    (numHojas === 4 && (idx === 1 || idx === 2));

  if (!isMovil) return 0;

  if (numHojas === 2 || numHojas === 3) {
    return (invertido ? 1 : -1) * t * leafW;
  }

  return slideOffset * (idx === 2 ? -0.6 : 0.6);
}
