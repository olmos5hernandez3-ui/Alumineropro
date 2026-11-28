import { HojaState } from './storageHelpers';

export type MarginStatus = 'rojo' | 'amarillo' | 'verde';

export interface MarginTrafficLightInput {
  costoBase: number;
  flete?: number;
  herrajesExtra?: number;
  precioCliente: number;
}

export interface MarginTrafficLightResult {
  costoBase: number;
  flete: number;
  herrajesExtra: number;
  costoTotal: number;
  precioCliente: number;
  gananciaNeta: number;
  margenPct: number;
  status: MarginStatus;
  label: string;
  shortHint: string;
  colorHex: string;
}

function sanitizeMoney(n: number | undefined): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

export const MARGIN_TRAFFIC_LIGHT_LEGEND = '<18% Bajo · 18–29% Justo · ≥30% Óptimo';

/**
 * Calcula el Semáforo de Margen PRO de una cotización o precio rápido.
 * Umbrales estrictos sin huecos:
 *  - Rojo (< 18% o pérdida): "Muy por debajo del margen"
 *  - Amarillo (18% a 29.9%): "Un poco por debajo" (foco amber-400)
 *  - Verde (>= 30%): "Cumples tu margen"
 */
export function computeMarginTrafficLight(
  input: MarginTrafficLightInput
): MarginTrafficLightResult {
  const costoBase = sanitizeMoney(input.costoBase);
  const flete = sanitizeMoney(input.flete);
  const herrajesExtra = sanitizeMoney(input.herrajesExtra);
  const precioCliente = sanitizeMoney(input.precioCliente);
  const costoTotal = Math.round((costoBase + flete + herrajesExtra) * 100) / 100;
  const gananciaNeta = Math.round((precioCliente - costoTotal) * 100) / 100;

  let margenPct = 0;
  if (precioCliente > 0) {
    margenPct = Math.round(((gananciaNeta / precioCliente) * 100) * 10) / 10;
  } else if (costoTotal > 0) {
    margenPct = -100;
  }

  let status: MarginStatus;
  let label: string;
  let shortHint: string;
  let colorHex: string;

  if (gananciaNeta <= 0 || margenPct < 18) {
    status = 'rojo';
    label = 'Muy por debajo del margen';
    shortHint =
      gananciaNeta < 0
        ? 'Estás perdiendo dinero en este presupuesto. Revisa tus costos antes de enviar.'
        : 'Margen menor a 18%. Considera ajustar el precio o revisar flete y herrajes.';
    colorHex = '#ef4444';
  } else if (margenPct < 30) {
    status = 'amarillo';
    label = 'Un poco por debajo';
    shortHint = 'Margen justo (18% a 29.9%). Aceptable en volumen, pero debajo del objetivo óptimo (≥30%).';
    colorHex = '#fbbf24';
  } else {
    status = 'verde';
    label = 'Cumples tu margen';
    shortHint = 'Margen óptimo (≥30%) cubriendo material, flete y herrajes extra.';
    colorHex = '#10b981';
  }

  return {
    costoBase,
    flete,
    herrajesExtra,
    costoTotal,
    precioCliente,
    gananciaNeta,
    margenPct,
    status,
    label,
    shortHint,
    colorHex,
  };
}

/**
 * Estima el costo base directo (material + vidrio + accesorios sin utilidad)
 * a partir de las partidas de la Hoja de Cotización (~62% del subtotal por defecto, editable).
 */
export function estimateHojaBaseCost(hoja: HojaState): number {
  if (!hoja || !Array.isArray(hoja.partidas) || hoja.partidas.length === 0) {
    return 0;
  }
  let totalBase = 0;
  for (const p of hoja.partidas) {
    const lineTotal = Number(p.totalLinea) || 0;
    totalBase += lineTotal * 0.62;
  }
  return Math.round(totalBase * 100) / 100;
}

export interface HourlyActivityBucket {
  hourIndex: number;
  hourLabel: string;
  count: number;
  heightPct: number;
}

export interface ActiveDevicesMetrics {
  activos15m: number;
  activos24h: number;
  activos7d: number;
  activos30d: number;
  hourly24: HourlyActivityBucket[];
}

export interface DeviceActivityLike {
  lastSeenAt?: number | null;
  firstSeenAt?: number | null;
}

/**
 * Calcula las métricas en tiempo real para la tarjeta "Activos ahora" del Panel Admin:
 *  - Activos en los últimos 15 minutos
 *  - Hoy (24 h), 7 días, 30 días
 *  - Mini-gráfica de 24 barras (1 por hora, derecha = hora actual, altura mínima 6%)
 */
export function computeActiveDevicesMetrics(
  devices: DeviceActivityLike[],
  nowMs: number = Date.now()
): ActiveDevicesMetrics {
  const MS_15M = 15 * 60 * 1000;
  const MS_HOUR = 60 * 60 * 1000;
  const MS_24H = 24 * MS_HOUR;
  const MS_7D = 7 * MS_24H;
  const MS_30D = 30 * MS_24H;

  let activos15m = 0;
  let activos24h = 0;
  let activos7d = 0;
  let activos30d = 0;

  // Alinear la cubeta derecha (índice 23) a la hora actual
  const currentHourDate = new Date(nowMs);
  currentHourDate.setMinutes(0, 0, 0);
  const currentHourStartMs = currentHourDate.getTime();
  const oldestHourStartMs = currentHourStartMs - 23 * MS_HOUR;

  const counts = new Array<number>(24).fill(0);

  for (const dev of devices) {
    const rawTs = typeof dev.lastSeenAt === 'number' && Number.isFinite(dev.lastSeenAt)
      ? dev.lastSeenAt
      : typeof dev.firstSeenAt === 'number' && Number.isFinite(dev.firstSeenAt)
        ? dev.firstSeenAt
        : 0;
    if (rawTs <= 0) continue;

    const age = nowMs - rawTs;
    if (age >= -60_000 && age <= MS_15M) activos15m += 1;
    if (age >= -60_000 && age <= MS_24H) activos24h += 1;
    if (age >= -60_000 && age <= MS_7D) activos7d += 1;
    if (age >= -60_000 && age <= MS_30D) activos30d += 1;

    if (rawTs >= oldestHourStartMs && rawTs <= currentHourStartMs + MS_HOUR) {
      const idx = Math.floor((rawTs - oldestHourStartMs) / MS_HOUR);
      if (idx >= 0 && idx < 24) {
        counts[idx] += 1;
      }
    }
  }

  const maxCount = Math.max(1, ...counts);
  const hourly24: HourlyActivityBucket[] = counts.map((count, i) => {
    const bucketDate = new Date(oldestHourStartMs + i * MS_HOUR);
    const hh = String(bucketDate.getHours()).padStart(2, '0');
    const rawPct = count > 0 ? Math.round((count / maxCount) * 100) : 0;
    const heightPct = Math.max(6, rawPct);
    return {
      hourIndex: i,
      hourLabel: `${hh}:00`,
      count,
      heightPct,
    };
  });

  return {
    activos15m,
    activos24h,
    activos7d,
    activos30d,
    hourly24,
  };
}
