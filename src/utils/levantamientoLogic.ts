import { AperturaVentanaId, CategoriaTrabajo, LineaId } from './alumineroLogic';
import { ModulacionCategoria, ModulacionModeloId } from './modulacionLogic';

export const LEV_KEYS = {
  draft: 'aluminero_levantamiento_borrador_v1',
  saved: 'aluminero_levantamientos_v1',
  hoja: 'aluminero_hoja_v1',
} as const;

export const LEV_TIPOS = [
  'Ventana Corrediza',
  'Ventana Fija',
  'Ventana Abatible / Proyección',
  'Puerta',
  'Cancel / Otro',
] as const;

export type LevantamientoTipo = (typeof LEV_TIPOS)[number];
export type LevantamientoUnidad = 'cm' | 'm';
export type LevantamientoDestino = 'modulacion' | 'cortes' | 'cotizacion';

export interface LevantamientoMapaItem {
  linea: LineaId;
  apertura?: AperturaVentanaId;
  modelo?: ModulacionModeloId;
  cat?: ModulacionCategoria;
}

export const LEV_MAPA: Record<string, LevantamientoMapaItem> = {
  'Ventana Corrediza': {
    linea: '3',
    apertura: 'corrediza',
    modelo: 'win-corrediza',
    cat: 'ventanas',
  },
  'Ventana Fija': {
    linea: '3',
    apertura: 'fija',
    modelo: 'win-fija',
    cat: 'ventanas',
  },
  'Ventana Abatible / Proyección': {
    linea: 'europea',
    modelo: 'win-proyeccion',
    cat: 'ventanas',
  },
  Puerta: {
    linea: 'puerta-abatible',
    modelo: 'door-batiente',
    cat: 'puertas',
  },
  'Cancel / Otro': {
    linea: 'cancel-bano',
  },
};

export interface LevantamientoPieza {
  id: string;
  tipo: string;
  area: string;
  anchoCm: number;
  altoCm: number;
  cant: number;
  notas: string;
  foto: string;
}

export interface LevantamientoDraft {
  id: string;
  cliente: string;
  ref: string;
  fecha: string;
  piezas: LevantamientoPieza[];
  guardado?: boolean;
}

export interface AlumBridgePayload {
  destino: LevantamientoDestino;
  linea: LineaId;
  apertura?: AperturaVentanaId;
  modelo?: ModulacionModeloId;
  cat?: ModulacionCategoria | CategoriaTrabajo;
  ancho: number;
  alto: number;
  cant: number;
  cliente?: string;
  area?: string;
  etiqueta?: string;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function createLevantamientoId(): string {
  return `lv-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function formatHoyEsMx(date: Date = new Date()): string {
  const d = `0${date.getDate()}`.slice(-2);
  const m = `0${date.getMonth() + 1}`.slice(-2);
  return `${d}/${m}/${date.getFullYear()}`;
}

export function createEmptyLevantamiento(): LevantamientoDraft {
  return {
    id: createLevantamientoId(),
    cliente: '',
    ref: '',
    fecha: formatHoyEsMx(),
    piezas: [],
  };
}

export function parsePositiveNumber(v: string | number): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function cmFromUnit(v: string | number, unit: LevantamientoUnidad): number {
  const n = parsePositiveNumber(v);
  return unit === 'm' ? Math.round(n * 10000) / 100 : n;
}

export function formatMedida(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export function formatMedidaText(p: Pick<LevantamientoPieza, 'anchoCm' | 'altoCm'>): string {
  return `${formatMedida(p.anchoCm)} × ${formatMedida(p.altoCm)} cm`;
}

export function resumenLevantamiento(piezas: LevantamientoPieza[]): string {
  let total = 0;
  let ventanas = 0;
  let puertas = 0;
  let otros = 0;
  for (const p of piezas) {
    const qty = Math.max(1, Number(p.cant) || 1);
    total += qty;
    if (p.tipo.indexOf('Ventana') === 0) ventanas += qty;
    else if (p.tipo === 'Puerta') puertas += qty;
    else otros += qty;
  }
  const base = `Total: ${total} pieza${total === 1 ? '' : 's'}`;
  if (!total) return base;
  const ventPart = `${ventanas} ventana${ventanas === 1 ? '' : 's'}`;
  const puerPart = `${puertas} puerta${puertas === 1 ? '' : 's'}`;
  const otroPart = otros ? `, ${otros} otro${otros === 1 ? '' : 's'}` : '';
  return `${base} — ${ventPart}, ${puerPart}${otroPart}`;
}

export function buildLevantamientoWhatsappText(draft: LevantamientoDraft): string {
  const lines: string[] = ['*LEVANTAMIENTO DE MEDIDAS*', `Cliente: ${draft.cliente}`];
  if (draft.ref) lines.push(`Tel./Ubicación: ${draft.ref}`);
  lines.push(`Fecha: ${draft.fecha}`, '');
  draft.piezas.forEach((p, idx) => {
    lines.push(
      `${idx + 1}) ${p.tipo}${p.area ? ` (${p.area})` : ''}: ${formatMedidaText(p)} · Cant: ${p.cant}${
        p.notas ? ` · ${p.notas}` : ''
      }`
    );
  });
  lines.push('', resumenLevantamiento(draft.piezas));
  return lines.join('\n');
}

/**
 * Sobrescribe `proyecto` en `aluminero_hoja_v1` dentro de localStorage con el nombre
 * del cliente del levantamiento, reemplazando cualquier valor previo o por defecto
 * sin perder las partidas, descuento ni IVA ya capturados.
 */
export function overwriteHojaProyectoInStorage(
  cliente: string,
  storage: StorageLike | null = typeof window !== 'undefined' ? window.localStorage : null
): boolean {
  const nombreCliente = String(cliente || '').trim();
  if (!storage || !nombreCliente) return false;
  try {
    const raw = storage.getItem(LEV_KEYS.hoja);
    let parsed: Record<string, unknown> = {};
    if (raw) {
      const dec = JSON.parse(raw);
      if (dec && typeof dec === 'object' && !Array.isArray(dec)) {
        parsed = dec as Record<string, unknown>;
      }
    }
    const nextHoja = {
      partidas: Array.isArray(parsed.partidas) ? parsed.partidas : [],
      descuentoPct: typeof parsed.descuentoPct === 'number' ? parsed.descuentoPct : 0,
      incluirIva: Boolean(parsed.incluirIva),
      ...parsed,
      proyecto: nombreCliente,
    };
    storage.setItem(LEV_KEYS.hoja, JSON.stringify(nextHoja));
    return true;
  } catch {
    return false;
  }
}

export function buildBridgePayloadFromPieza(
  pieza: LevantamientoPieza,
  cliente: string,
  destino: LevantamientoDestino
): { payload: AlumBridgePayload | null; unsupportedInModulacion: boolean } {
  const mapa = LEV_MAPA[pieza.tipo] || LEV_MAPA['Cancel / Otro'];
  if (destino === 'modulacion' && !mapa.modelo) {
    return { payload: null, unsupportedInModulacion: true };
  }
  return {
    unsupportedInModulacion: false,
    payload: {
      destino,
      linea: mapa.linea,
      apertura: mapa.apertura,
      modelo: mapa.modelo,
      cat: mapa.cat,
      ancho: pieza.anchoCm,
      alto: pieza.altoCm,
      cant: Math.max(1, Number(pieza.cant) || 1),
      cliente: String(cliente || '').trim(),
      area: String(pieza.area || '').trim(),
      etiqueta: '',
    },
  };
}
