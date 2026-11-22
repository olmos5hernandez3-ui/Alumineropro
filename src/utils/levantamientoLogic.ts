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
