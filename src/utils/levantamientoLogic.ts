import {
  AperturaVentanaId,
  CategoriaTrabajo,
  ColorId,
  getDefaultRellenoFromVidrio,
  LineaId,
  PanelRellenoSelection,
  VidrioId,
} from './alumineroLogic';
import { ModulacionCategoria, ModulacionModeloId, ModulacionSerieId } from './modulacionLogic';

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
  'Mosquitero abatible',
  'Puerta',
  'Cancel / Otro',
] as const;

export const LEV_LINEA_PERFIL_OPTS = [
  { id: 'linea-3', label: 'Línea 3"' },
  { id: 'linea-2', label: 'Línea 2"' },
  { id: 'europea', label: 'Línea Europea' },
  { id: 'batiente-alumer', label: 'Batiente Alumer' },
  { id: 'cancel-mosq', label: 'Cancel / Mosq.' },
  { id: 'otra', label: 'Otra' },
] as const;

export const LEV_COLOR_ALUMINIO_OPTS = [
  { id: 'natural', label: 'Natural', hex: '#C0C5CE' },
  { id: 'blanco', label: 'Blanco', hex: '#F8FAFC' },
  { id: 'negro', label: 'Negro', hex: '#1E293B' },
  { id: 'bronce', label: 'Bronce / Champagne', hex: '#8C6D46' },
  { id: 'madera', label: 'Madera', hex: '#7C4A27' },
  { id: 'otro', label: 'Otro', hex: null },
] as const;

export const LEV_COLOR_VIDRIO_OPTS = [
  { id: 'claro', label: 'Vidrio claro', hex: '#E0F2FE' },
  { id: 'filtrasol', label: 'Filtrasol', hex: '#64748B' },
  { id: 'tintex', label: 'Tintex', hex: '#34D399' },
  { id: 'esmerilado', label: 'Esmerilado', hex: '#CBD5E1' },
  { id: 'reflecta', label: 'Reflecta', hex: '#38BDF8' },
  { id: 'sin-vidrio', label: 'Sin vidrio', hex: null },
] as const;

export const LEV_MOSQUITERO_OPTS = [
  { id: 'sin', label: 'Sin mosquitero' },
  { id: 'fijo', label: 'Mosquitero Fijo' },
  { id: 'corredizo', label: 'Mosquitero Corredizo' },
  { id: 'abatible', label: 'Mosquitero abatible' },
] as const;

export type LevantamientoTipo = (typeof LEV_TIPOS)[number];
export type LevantamientoLineaPerfil = (typeof LEV_LINEA_PERFIL_OPTS)[number]['label'];
export type LevantamientoColorAluminio = (typeof LEV_COLOR_ALUMINIO_OPTS)[number]['label'];
export type LevantamientoColorVidrio = (typeof LEV_COLOR_VIDRIO_OPTS)[number]['label'];
export type LevantamientoMosquitero = (typeof LEV_MOSQUITERO_OPTS)[number]['label'];
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
  'Mosquitero abatible': {
    linea: 'mosq-abatible',
    apertura: 'abatible',
    modelo: 'win-abatible',
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
  lineaPerfil?: string;
  colorAluminio?: string;
  colorVidrio?: string;
  mosquitero?: string;
  hojas?: string;
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
  serieMod?: ModulacionSerieId;
  color?: ColorId;
  vidrio?: VidrioId;
  relleno?: PanelRellenoSelection;
  conMosquitero?: boolean;
  lineaPerfil?: string;
  colorAluminio?: string;
  colorVidrio?: string;
  mosquitero?: string;
  notas?: string;
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

export function getDefaultLineaPerfilForTipo(tipo: string): LevantamientoLineaPerfil {
  if (tipo === 'Ventana Abatible / Proyección') return 'Línea Europea';
  if (tipo === 'Mosquitero abatible') return 'Cancel / Mosq.';
  if (tipo === 'Puerta') return 'Batiente Alumer';
  if (tipo === 'Cancel / Otro') return 'Cancel / Mosq.';
  return 'Línea 3"';
}

export function resolveLineaFromLevantamiento(pieza: LevantamientoPieza): {
  linea: LineaId;
  apertura?: AperturaVentanaId;
  modelo?: ModulacionModeloId;
  cat?: ModulacionCategoria;
  serieMod: ModulacionSerieId;
} {
  const mapa = LEV_MAPA[pieza.tipo] || LEV_MAPA['Cancel / Otro'];
  const lp = String(pieza.lineaPerfil || '').trim();
  const isPuerta = pieza.tipo === 'Puerta';

  let linea: LineaId = mapa.linea;
  let apertura: AperturaVentanaId | undefined = mapa.apertura;
  let modelo: ModulacionModeloId | undefined = mapa.modelo;
  let cat: ModulacionCategoria | undefined = mapa.cat;
  let serieMod: ModulacionSerieId =
    mapa.linea === 'europea' || mapa.linea === 'puerta-europea'
      ? 'serie-70'
      : mapa.linea === '2' || mapa.linea === 'puerta-2'
        ? 'linea-2'
        : 'linea-3';

  const lpLower = lp.toLowerCase();

  if (pieza.tipo === 'Mosquitero abatible') {
    linea = 'mosq-abatible';
    apertura = 'abatible';
    modelo = 'win-abatible';
    cat = 'ventanas';
    serieMod = 'linea-3';
    return { linea, apertura, modelo, cat, serieMod };
  }

  if (lp === 'Línea 3"' || lpLower.includes('nacional 3"') || lpLower.includes('nacional 4')) {
    linea = isPuerta ? 'puerta-abatible' : '3';
    serieMod = 'linea-3';
  } else if (
    lp === 'Línea 2"' ||
    lpLower.includes('nacional 2"') ||
    lpLower.includes('1 ⅜') ||
    lpLower.includes('1 ½') ||
    lpLower.includes('1 3/8') ||
    lpLower.includes('1 1/2')
  ) {
    linea = isPuerta ? 'puerta-2' : '2';
    serieMod = 'linea-2';
  } else if (
    lp === 'Línea Europea' ||
    lpLower.includes('europea') ||
    lpLower.includes('eurovent') ||
    lpLower.includes('euroalum') ||
    lpLower.includes('muro cortina') ||
    lpLower.includes('española') ||
    lpLower.includes('1400') ||
    lpLower.includes('3500') ||
    lpLower.includes('4000') ||
    lpLower.includes('4600') ||
    lpLower.includes('10000')
  ) {
    linea = isPuerta ? 'puerta-europea' : 'europea';
    serieMod = 'serie-70';
  } else if (lp === 'Batiente Alumer') {
    linea = 'puerta-abatible';
    apertura = 'abatible';
    modelo = 'door-batiente';
    cat = 'puertas';
    serieMod = 'linea-3';
  } else if (lp === 'Cancel / Mosq.') {
    if (pieza.mosquitero === 'Mosquitero Fijo') {
      linea = 'mosq-fijo';
      apertura = 'fija';
    } else if (pieza.mosquitero === 'Mosquitero Corredizo') {
      linea = 'mosq-corredizo';
      apertura = 'corrediza';
    } else if (pieza.mosquitero === 'Mosquitero abatible') {
      linea = 'mosq-abatible';
      apertura = 'abatible';
    } else {
      linea = 'cancel-bano';
      apertura = 'corrediza';
    }
    serieMod = 'linea-3';
  }

  return { linea, apertura, modelo, cat, serieMod };
}

export function resolveColorAluminioFromLevantamiento(colorAluminio?: string): ColorId {
  const clean = String(colorAluminio || '').trim().toLowerCase();
  if (clean === 'blanco') return 'blanco';
  if (clean === 'negro') return 'negro';
  if (clean === 'madera' || clean.includes('bronce') || clean.includes('champagne')) return 'madera';
  return 'natural';
}

export function resolveVidrioFromLevantamiento(colorVidrio?: string): {
  vidrio: VidrioId;
  relleno: PanelRellenoSelection;
  sinVidrio: boolean;
} {
  const clean = String(colorVidrio || '').trim().toLowerCase();
  if (clean === 'filtrasol') {
    return {
      vidrio: 'filtrasol6',
      relleno: getDefaultRellenoFromVidrio('filtrasol6'),
      sinVidrio: false,
    };
  }
  if (clean === 'tintex') {
    return {
      vidrio: 'tintex6',
      relleno: getDefaultRellenoFromVidrio('tintex6'),
      sinVidrio: false,
    };
  }
  if (clean === 'esmerilado') {
    return {
      vidrio: 'claro6',
      relleno: { categoria: 'templado', materialId: 'temp-esmerilado', espesorMm: 6 },
      sinVidrio: false,
    };
  }
  if (clean === 'reflecta') {
    return {
      vidrio: 'claro6',
      relleno: { categoria: 'flotado', materialId: 'flot-reflecta-azul', espesorMm: 6 },
      sinVidrio: false,
    };
  }
  if (clean === 'sin vidrio') {
    return {
      vidrio: 'claro6',
      relleno: getDefaultRellenoFromVidrio('claro6'),
      sinVidrio: true,
    };
  }
  // Tanto 'claro' como 'vidrio claro' mapean a Vidrio claro 6 mm
  return {
    vidrio: 'claro6',
    relleno: getDefaultRellenoFromVidrio('claro6'),
    sinVidrio: false,
  };
}

export function resolveMosquiteroFromLevantamiento(mosquitero?: string): boolean {
  const clean = String(mosquitero || '').trim().toLowerCase();
  return clean === 'mosquitero fijo' || clean === 'mosquitero corredizo';
}

export function formatPiezaSpecs(p: Pick<LevantamientoPieza, 'lineaPerfil' | 'colorAluminio' | 'colorVidrio' | 'mosquitero'>): string {
  const parts: string[] = [];
  if (p.lineaPerfil) parts.push(p.lineaPerfil);
  if (p.colorAluminio) parts.push(`Alum: ${p.colorAluminio}`);
  if (p.colorVidrio) parts.push(`Vidrio: ${p.colorVidrio}`);
  if (p.mosquitero && p.mosquitero !== 'Sin mosquitero') parts.push(p.mosquitero);
  return parts.join(' · ');
}

export function mergePiezaSpecsAndNotes(
  p: Pick<LevantamientoPieza, 'lineaPerfil' | 'colorAluminio' | 'colorVidrio' | 'mosquitero' | 'notas'>
): string {
  const specs = formatPiezaSpecs(p);
  const rawNotes = String(p.notas || '').trim();
  if (specs && rawNotes) return `${specs} · ${rawNotes}`;
  return specs || rawNotes;
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
    .map((p) => {
      const lineaPerfil = typeof p.lineaPerfil === 'string' ? p.lineaPerfil.trim() : '';
      const colorAluminio = typeof p.colorAluminio === 'string' ? p.colorAluminio.trim() : '';
      const colorVidrio = typeof p.colorVidrio === 'string' ? p.colorVidrio.trim() : '';
      const mosquitero = typeof p.mosquitero === 'string' ? p.mosquitero.trim() : '';
      return {
        id: typeof p.id === 'string' && p.id ? p.id : `p-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        tipo: typeof p.tipo === 'string' && p.tipo ? p.tipo : 'Ventana Corrediza',
        area: typeof p.area === 'string' ? p.area : '',
        anchoCm: Number(p.anchoCm) > 0 ? Number(p.anchoCm) : 0,
        altoCm: Number(p.altoCm) > 0 ? Number(p.altoCm) : 0,
        cant: Math.max(1, Math.round(Number(p.cant) || 1)),
        ...(lineaPerfil ? { lineaPerfil } : {}),
        ...(colorAluminio ? { colorAluminio } : {}),
        ...(colorVidrio ? { colorVidrio } : {}),
        ...(mosquitero ? { mosquitero } : {}),
        notas: typeof p.notas === 'string' ? p.notas : '',
        foto: typeof p.foto === 'string' ? p.foto : '',
      };
    })
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
    const extra = mergePiezaSpecsAndNotes(p);
    lines.push(
      `${idx + 1}) ${p.tipo}${p.area ? ` (${p.area})` : ''}: ${formatMedidaText(p)} · Cant: ${p.cant}${
        extra ? ` · ${extra}` : ''
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
  const resolved = resolveLineaFromLevantamiento(pieza);
  if (destino === 'modulacion' && !resolved.modelo) {
    return { payload: null, unsupportedInModulacion: true };
  }
  const color = resolveColorAluminioFromLevantamiento(pieza.colorAluminio);
  const { vidrio, relleno } = resolveVidrioFromLevantamiento(pieza.colorVidrio);
  const conMosquitero = resolveMosquiteroFromLevantamiento(pieza.mosquitero);
  const mergedNotas = mergePiezaSpecsAndNotes(pieza);

  return {
    unsupportedInModulacion: false,
    payload: {
      destino,
      linea: resolved.linea,
      apertura: resolved.apertura,
      modelo: resolved.modelo,
      cat: resolved.cat,
      serieMod: resolved.serieMod,
      color,
      vidrio,
      relleno,
      conMosquitero,
      lineaPerfil: pieza.lineaPerfil,
      colorAluminio: pieza.colorAluminio,
      colorVidrio: pieza.colorVidrio,
      mosquitero: pieza.mosquitero,
      notas: mergedNotas || undefined,
      ancho: pieza.anchoCm,
      alto: pieza.altoCm,
      cant: Math.max(1, Number(pieza.cant) || 1),
      cliente: String(cliente || '').trim(),
      area: String(pieza.area || '').trim(),
      etiqueta: '',
    },
  };
}

// ============================================================================
// Escáner de Croquis a Mano con IA (lógica pura de normalización y conversión)
// ============================================================================

export const SKETCH_SCANNER_OFFLINE_MESSAGE =
  'Sin conexión a internet: el escáner de croquis con foto requiere internet para analizar tu dibujo, pero puedes seguir capturando tus medidas manualmente sin conexión.';

export interface RawSketchScanPayload {
  tipo?: unknown;
  hojas?: unknown;
  disposicionHojas?: unknown;
  anchoMm?: unknown;
  altoMm?: unknown;
  anchoCm?: unknown;
  altoCm?: unknown;
  ancho?: unknown;
  alto?: unknown;
  unidadDetectada?: unknown;
  area?: unknown;
  notas?: unknown;
  confianza?: unknown;
}

export interface NormalizedSketchScanResult {
  tipo: LevantamientoTipo;
  hojas: number;
  hojasDistribucion: string;
  disposicionHojas: string;
  hojasCorredizas: number;
  hojasFijas: number;
  anchoMm: number | null;
  altoMm: number | null;
  anchoCm: number | null;
  altoCm: number | null;
  unidadDetectada: 'cm' | 'mm' | 'm';
  area: string;
  notasFormateadas: string;
  resumenCorto: string;
  confianza: 'alta' | 'media' | 'baja';
}

export function stripBase64DataUrlPrefix(input: string): string {
  const trimmed = String(input || '').trim();
  const match = /^data:image\/[a-z0-9.+-]+;base64,(.+)$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

export function normalizeLeafDisposition(raw: unknown): string {
  const cleaned = String(raw || '')
    .toUpperCase()
    .replace(/0/g, 'O')
    .replace(/[^XO]/g, '');
  return cleaned.slice(0, 8);
}

export function formatHojasDashed(disposition: string): string {
  const norm = normalizeLeafDisposition(disposition);
  if (!norm) return '';
  return norm.split('').join('-');
}

export function normalizeSketchUnit(raw: unknown): 'cm' | 'mm' | 'm' {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (s === 'mm' || s.startsWith('mil')) return 'mm';
  if (s === 'm' || s === 'mts' || s === 'mt' || s.startsWith('metr')) return 'm';
  return 'cm';
}

export function convertSketchDimensionToCm(
  value: unknown,
  unit: 'cm' | 'mm' | 'm' = 'cm',
  alreadyInCm = false
): number | null {
  const str = String(value ?? '')
    .trim()
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
  const num = parseFloat(str);
  if (!Number.isFinite(num) || num <= 0) return null;

  let cm = num;
  if (!alreadyInCm) {
    if (unit === 'mm') {
      cm = num / 10;
    } else if (unit === 'm') {
      cm = num * 100;
    } else if (num > 600 && num <= 6000) {
      // Probable lectura en milímetros sin etiqueta explícita
      cm = num / 10;
    } else if (num > 0 && num <= 6) {
      // Probable lectura en metros sin etiqueta explícita (ej. 1.50 x 1.20)
      cm = num * 100;
    }
  } else {
    // Incluso si el modelo dijo "anchoCm", corregir errores obvios de escala (mm o m)
    if (num > 600 && num <= 6000) {
      cm = num / 10;
    } else if (num > 0 && num <= 6) {
      cm = num * 100;
    }
  }

  const rounded = Math.round(cm * 10) / 10;
  if (rounded < 5 || rounded > 1000) return null;
  return rounded;
}

export function mapSketchTypeToLevantamientoTipo(
  rawTipo: unknown,
  disposicionHojas: string
): LevantamientoTipo {
  const t = String(rawTipo || '')
    .trim()
    .toLowerCase();

  // Coincidencia exacta primero
  for (const exact of LEV_TIPOS) {
    if (exact.toLowerCase() === t) return exact;
  }

  if (t.includes('mosquit')) return 'Mosquitero abatible';
  if (t.includes('cancel') || t.includes('baño') || t.includes('bano') || t.includes('regadera')) {
    return 'Cancel / Otro';
  }
  if (t.includes('puerta') || t.includes('plegadiz') || t.includes('batiente')) {
    return 'Puerta';
  }
  if (t.includes('proyec') || t.includes('abatible') || t.includes('oscilo')) {
    return 'Ventana Abatible / Proyección';
  }
  if (t.includes('fija') || t.includes('fijo')) {
    if (!disposicionHojas.includes('X')) return 'Ventana Fija';
  }
  if (t.includes('corrediz') || t.includes('desliz')) {
    return 'Ventana Corrediza';
  }

  // Fallback guiado por el patrón X/O del croquis
  if (disposicionHojas.includes('X')) return 'Ventana Corrediza';
  if (disposicionHojas.length > 0 && !disposicionHojas.includes('X')) return 'Ventana Fija';
  return 'Ventana Corrediza';
}

export function normalizeScannedSketchResult(
  raw: RawSketchScanPayload
): NormalizedSketchScanResult {
  // Soportar tanto `hojas: "O-X"` (string de distribución) como `disposicionHojas: "OX"` + `hojas: 2`
  const hojasFromString =
    typeof raw.hojas === 'string' && /[xXoO0]/.test(raw.hojas)
      ? normalizeLeafDisposition(raw.hojas)
      : '';
  const disposicionHojas = normalizeLeafDisposition(raw.disposicionHojas) || hojasFromString;
  const hojasDistribucion = formatHojasDashed(disposicionHojas);
  const hojasCorredizas = (disposicionHojas.match(/X/g) || []).length;
  const hojasFijas = (disposicionHojas.match(/O/g) || []).length;

  const rawHojasNum =
    typeof raw.hojas === 'number'
      ? Math.round(raw.hojas)
      : typeof raw.hojas === 'string' && /^\s*\d+\s*$/.test(raw.hojas)
        ? Math.round(Number(raw.hojas))
        : 0;
  const hojas = Math.max(
    1,
    Math.min(8, disposicionHojas.length > 0 ? disposicionHojas.length : rawHojasNum || 2)
  );

  const hasExplicitMm = raw.anchoMm !== undefined || raw.altoMm !== undefined;
  const hasExplicitCm = raw.anchoCm !== undefined || raw.altoCm !== undefined;
  const unidadDetectada = normalizeSketchUnit(
    raw.unidadDetectada ?? (hasExplicitMm ? 'mm' : undefined)
  );

  const anchoSource = hasExplicitMm ? raw.anchoMm : hasExplicitCm ? raw.anchoCm : raw.ancho;
  const altoSource = hasExplicitMm ? raw.altoMm : hasExplicitCm ? raw.altoCm : raw.alto;

  const anchoCm = convertSketchDimensionToCm(
    anchoSource,
    hasExplicitMm ? 'mm' : unidadDetectada,
    hasExplicitCm && !hasExplicitMm
  );
  const altoCm = convertSketchDimensionToCm(
    altoSource,
    hasExplicitMm ? 'mm' : unidadDetectada,
    hasExplicitCm && !hasExplicitMm
  );

  const anchoMm = anchoCm !== null ? Math.round(anchoCm * 10) : null;
  const altoMm = altoCm !== null ? Math.round(altoCm * 10) : null;

  const tipo = mapSketchTypeToLevantamientoTipo(raw.tipo, disposicionHojas);
  const area = String(raw.area || '').trim().slice(0, 60);
  const rawNotas = String(raw.notas || '').trim().slice(0, 240);

  const rawConf = String(raw.confianza || '')
    .trim()
    .toLowerCase();
  const confianza: 'alta' | 'media' | 'baja' =
    rawConf === 'alta' || rawConf === 'media' || rawConf === 'baja'
      ? rawConf
      : anchoCm && altoCm
        ? 'media'
        : 'baja';

  const layoutParts: string[] = [];
  if (disposicionHojas) {
    const dashed = hojasDistribucion;
    const detail: string[] = [];
    if (hojasCorredizas > 0) {
      detail.push(`${hojasCorredizas} corrediza${hojasCorredizas === 1 ? '' : 's'} (X)`);
    }
    if (hojasFijas > 0) {
      detail.push(`${hojasFijas} fija${hojasFijas === 1 ? '' : 's'} (O)`);
    }
    layoutParts.push(
      `Disposición ${dashed} (${hojas} hoja${hojas === 1 ? '' : 's'}${detail.length ? `: ${detail.join(', ')}` : ''})`
    );
  } else {
    layoutParts.push(`${hojas} hoja${hojas === 1 ? '' : 's'}`);
  }

  const notasSegments = [`Croquis IA: ${layoutParts.join(' · ')}`];
  if (rawNotas && !rawNotas.toLowerCase().includes(disposicionHojas.toLowerCase() || '___')) {
    notasSegments.push(rawNotas);
  } else if (rawNotas && !disposicionHojas) {
    notasSegments.push(rawNotas);
  }

  const notasFormateadas = notasSegments.join(' · ');
  const dimsSummary =
    anchoCm && altoCm
      ? `${formatMedida(anchoCm)} × ${formatMedida(altoCm)} cm (${anchoMm} × ${altoMm} mm)`
      : 'Medidas por confirmar';
  const resumenCorto = `${tipo} · ${dimsSummary}${hojasDistribucion ? ` · ${hojasDistribucion}` : ''}`;

  return {
    tipo,
    hojas,
    hojasDistribucion,
    disposicionHojas,
    hojasCorredizas,
    hojasFijas,
    anchoMm,
    altoMm,
    anchoCm,
    altoCm,
    unidadDetectada,
    area,
    notasFormateadas,
    resumenCorto,
    confianza,
  };
}

export interface AluminumLineDimensionLimits {
  lineaLabel: string;
  minAnchoCm: number;
  maxAnchoCm: number;
  minAltoCm: number;
  maxAltoCm: number;
  recommendation: string;
}

export interface AluminumLineDimensionWarning {
  hasWarning: boolean;
  anchoExceeded: boolean;
  altoExceeded: boolean;
  anchoBelowMin: boolean;
  altoBelowMin: boolean;
  limits: AluminumLineDimensionLimits;
  message: string | null;
}

export function getAluminumLineStandardLimits(
  lineaPerfil: string,
  tipo?: string
): AluminumLineDimensionLimits {
  const lp = String(lineaPerfil || '').trim().toLowerCase();
  const tp = String(tipo || '').trim().toLowerCase();

  if (
    lp.includes('línea 2') ||
    lp.includes('linea 2') ||
    lp.includes('2"') ||
    lp.includes('nacional 2') ||
    lp.includes('serie 2')
  ) {
    return {
      lineaLabel: lineaPerfil.trim() || 'Línea 2"',
      minAnchoCm: 35,
      maxAnchoCm: 200,
      minAltoCm: 35,
      maxAltoCm: 160,
      recommendation:
        'Para claros mayores a 200 × 160 cm se recomienda Línea 3" o dividir en módulos con refuerzo.',
    };
  }

  if (
    lp.includes('europea') ||
    lp.includes('española') ||
    lp.includes('espanola') ||
    lp.includes('eurovent') ||
    lp.includes('euroalum') ||
    lp.includes('serie 70') ||
    lp.includes('serie 1400') ||
    lp.includes('1400') ||
    lp.includes('2500') ||
    lp.includes('2800') ||
    lp.includes('3800')
  ) {
    return {
      lineaLabel: lineaPerfil.trim() || 'Línea Europea',
      minAnchoCm: 45,
      maxAnchoCm: 360,
      minAltoCm: 45,
      maxAltoCm: 260,
      recommendation:
        'Supera el límite estándar de hoja Europea (360 × 260 cm); verifica refuerzo o divide en módulos.',
    };
  }

  if (
    lp.includes('batiente') ||
    lp.includes('puerta') ||
    lp.includes('1750') ||
    lp.includes('4000') ||
    tp === 'puerta'
  ) {
    return {
      lineaLabel: lineaPerfil.trim() || 'Batiente Alumer',
      minAnchoCm: 65,
      maxAnchoCm: 240,
      minAltoCm: 180,
      maxAltoCm: 250,
      recommendation:
        'Revisa peso de hoja, bisagras reforzadas o fijo lateral/superior arriba de 240 × 250 cm.',
    };
  }

  if (lp.includes('mosq') && !lp.includes('cancel')) {
    return {
      lineaLabel: lineaPerfil.trim() || 'Mosquitero',
      minAnchoCm: 30,
      maxAnchoCm: 160,
      minAltoCm: 35,
      maxAltoCm: 220,
      recommendation:
        'Arriba de 160 × 220 cm considera travesaño intermedio para evitar pandeo en la malla.',
    };
  }

  if (lp.includes('cancel') || tp.includes('cancel') || tp.includes('mosquitero')) {
    return {
      lineaLabel: lineaPerfil.trim() || 'Cancel / Mosq.',
      minAnchoCm: 40,
      maxAnchoCm: 220,
      minAltoCm: 40,
      maxAltoCm: 215,
      recommendation:
        'Excede el rango estándar de cancel/mosquitero (220 × 215 cm); valida rieles o fijo adicional.',
    };
  }

  if (
    lp.includes('línea 3') ||
    lp.includes('linea 3') ||
    lp.includes('3"') ||
    lp.includes('panorámica') ||
    lp.includes('panoramica')
  ) {
    return {
      lineaLabel: lineaPerfil.trim() || 'Línea 3"',
      minAnchoCm: 40,
      maxAnchoCm: 300,
      minAltoCm: 40,
      maxAltoCm: 240,
      recommendation:
        'Para claros mayores a 300 × 240 cm considera Línea Europea/Serie 70 o incluir fijo superior.',
    };
  }

  return {
    lineaLabel: lineaPerfil.trim() || 'Línea estándar',
    minAnchoCm: 35,
    maxAnchoCm: 300,
    minAltoCm: 35,
    maxAltoCm: 240,
    recommendation:
      'Verifica resistencia de perfiles y longitud de tramo (610 cm) antes de cortar.',
  };
}

export function evaluateLevantamientoLineLimits(
  anchoCm: number,
  altoCm: number,
  lineaPerfil: string,
  tipo?: string
): AluminumLineDimensionWarning {
  const limits = getAluminumLineStandardLimits(lineaPerfil, tipo);
  const validAncho = Number.isFinite(anchoCm) && anchoCm > 0;
  const validAlto = Number.isFinite(altoCm) && altoCm > 0;

  const anchoExceeded = validAncho && anchoCm > limits.maxAnchoCm;
  const altoExceeded = validAlto && altoCm > limits.maxAltoCm;
  const anchoBelowMin = validAncho && anchoCm < limits.minAnchoCm;
  const altoBelowMin = validAlto && altoCm < limits.minAltoCm;
  const hasWarning = anchoExceeded || altoExceeded || anchoBelowMin || altoBelowMin;

  if (!hasWarning) {
    return {
      hasWarning: false,
      anchoExceeded: false,
      altoExceeded: false,
      anchoBelowMin: false,
      altoBelowMin: false,
      limits,
      message: null,
    };
  }

  const issues: string[] = [];
  if (anchoExceeded) {
    issues.push(`ancho ${formatMedida(anchoCm)} cm supera el máx. estándar (${limits.maxAnchoCm} cm)`);
  } else if (anchoBelowMin) {
    issues.push(`ancho ${formatMedida(anchoCm)} cm es menor al mín. recomendado (${limits.minAnchoCm} cm)`);
  }

  if (altoExceeded) {
    issues.push(`alto ${formatMedida(altoCm)} cm supera el máx. estándar (${limits.maxAltoCm} cm)`);
  } else if (altoBelowMin) {
    issues.push(`alto ${formatMedida(altoCm)} cm es menor al mín. recomendado (${limits.minAltoCm} cm)`);
  }

  const message = `${limits.lineaLabel}: ${issues.join(' y ')}. ${limits.recommendation}`;

  return {
    hasWarning: true,
    anchoExceeded,
    altoExceeded,
    anchoBelowMin,
    altoBelowMin,
    limits,
    message,
  };
}


