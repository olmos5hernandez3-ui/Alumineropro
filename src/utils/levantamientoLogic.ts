import {
  AperturaVentanaId,
  CategoriaTrabajo,
  ColorId,
  getColorCorto,
  getRellenoItem,
  LineaId,
  normalizeColorId,
} from './alumineroLogic';
import { ModulacionCategoria, ModulacionModeloId } from './modulacionLogic';

export const LEV_KEYS = {
  draft: 'aluminero_levantamiento_borrador_v1',
  saved: 'aluminero_levantamientos_v1',
  activo: 'aluminero_lev_activo_v1',
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
  colorAluminio?: ColorId;
  colorAluminioCustom?: string;
  colorVidrio?: string;
  colorVidrioCustom?: string;
  notas: string;
  foto: string;
}

export interface LevantamientoDraft {
  id: string;
  cliente: string;
  telefono?: string;
  direccion?: string;
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
  color?: ColorId;
  colorCustom?: string;
  colorVidrio?: string;
  colorVidrioCustom?: string;
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
    telefono: '',
    direccion: '',
    ref: '',
    fecha: formatHoyEsMx(),
    piezas: [],
  };
}

export function normalizeLevantamientoDraft(raw: unknown): LevantamientoDraft {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createEmptyLevantamiento();
  }
  const obj = raw as Record<string, unknown>;
  const legacyRef = typeof obj.ref === 'string' ? obj.ref.trim() : '';
  const rawDir = typeof obj.direccion === 'string' ? obj.direccion.trim() : '';
  const direccion = rawDir || legacyRef;
  const telefono = typeof obj.telefono === 'string' ? obj.telefono.trim() : '';
  const piezasRaw = Array.isArray(obj.piezas) ? obj.piezas : [];
  const piezas: LevantamientoPieza[] = piezasRaw
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === 'object')
    .map((p) => ({
      id: typeof p.id === 'string' && p.id ? p.id : `p-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      tipo: typeof p.tipo === 'string' && p.tipo ? p.tipo : 'Ventana Corrediza',
      area: typeof p.area === 'string' ? p.area : '',
      anchoCm: Number(p.anchoCm) > 0 ? Number(p.anchoCm) : 0,
      altoCm: Number(p.altoCm) > 0 ? Number(p.altoCm) : 0,
      cant: Math.max(1, Math.round(Number(p.cant) || 1)),
      colorAluminio: typeof p.colorAluminio === 'string' ? normalizeColorId(p.colorAluminio) : undefined,
      colorAluminioCustom: typeof p.colorAluminioCustom === 'string' ? p.colorAluminioCustom : undefined,
      colorVidrio: typeof p.colorVidrio === 'string' ? p.colorVidrio : undefined,
      colorVidrioCustom: typeof p.colorVidrioCustom === 'string' ? p.colorVidrioCustom : undefined,
      notas: typeof p.notas === 'string' ? p.notas : '',
      foto: typeof p.foto === 'string' ? p.foto : '',
    }))
    .filter((p) => p.anchoCm > 0 && p.altoCm > 0);

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : createLevantamientoId(),
    cliente: typeof obj.cliente === 'string' ? obj.cliente : '',
    telefono,
    direccion,
    ref: typeof obj.ref === 'string' ? obj.ref : direccion,
    fecha: typeof obj.fecha === 'string' && obj.fecha ? obj.fecha : formatHoyEsMx(),
    piezas,
    guardado: typeof obj.guardado === 'boolean' ? obj.guardado : undefined,
  };
}

export function normalizeLevantamientoList(raw: unknown): LevantamientoDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeLevantamientoDraft(item));
}

export function mergeLevantamientosBackup(
  existing: LevantamientoDraft[],
  importedRaw: unknown
): { merged: LevantamientoDraft[]; addedCount: number; updatedCount: number } {
  const incoming = normalizeLevantamientoList(
    Array.isArray(importedRaw)
      ? importedRaw
      : importedRaw && typeof importedRaw === 'object' && Array.isArray((importedRaw as Record<string, unknown>).levantamientos)
        ? (importedRaw as Record<string, unknown>).levantamientos
        : []
  );
  const byId = new Map<string, LevantamientoDraft>();
  const order: string[] = [];

  for (const item of existing.map((x) => normalizeLevantamientoDraft(x))) {
    byId.set(item.id, item);
    order.push(item.id);
  }

  let addedCount = 0;
  let updatedCount = 0;
  for (const item of incoming) {
    if (byId.has(item.id)) {
      byId.set(item.id, { ...item, guardado: true });
      updatedCount += 1;
    } else {
      byId.set(item.id, { ...item, guardado: true });
      order.unshift(item.id);
      addedCount += 1;
    }
  }

  return {
    merged: order.map((id) => byId.get(id)!).filter(Boolean),
    addedCount,
    updatedCount,
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
  const norm = normalizeLevantamientoDraft(draft);
  const lines: string[] = ['*LEVANTAMIENTO DE MEDIDAS*', `Cliente: ${norm.cliente}`];
  if (norm.telefono) lines.push(`Teléfono: ${norm.telefono}`);
  if (norm.direccion) lines.push(`Dirección: ${norm.direccion}`);
  lines.push(`Fecha: ${norm.fecha}`, '');
  norm.piezas.forEach((p, idx) => {
    const alumTxt = p.colorAluminio ? ` · Alum: ${getColorCorto(p.colorAluminio, p.colorAluminioCustom)}` : '';
    const vidTxt = p.colorVidrio
      ? ` · Vidrio: ${
          p.colorVidrio === 'flot-otro' && p.colorVidrioCustom?.trim()
            ? p.colorVidrioCustom.trim()
            : getRellenoItem(p.colorVidrio).nombre
        }`
      : '';
    lines.push(
      `${idx + 1}) ${p.tipo}${p.area ? ` (${p.area})` : ''}: ${formatMedidaText(p)} · Cant: ${p.cant}${alumTxt}${vidTxt}${
        p.notas ? ` · ${p.notas}` : ''
      }`
    );
  });
  lines.push('', resumenLevantamiento(norm.piezas));
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
      color: pieza.colorAluminio,
      colorCustom: pieza.colorAluminioCustom,
      colorVidrio: pieza.colorVidrio,
      colorVidrioCustom: pieza.colorVidrioCustom,
      cliente: String(cliente || '').trim(),
      area: String(pieza.area || '').trim(),
      etiqueta: '',
    },
  };
}
