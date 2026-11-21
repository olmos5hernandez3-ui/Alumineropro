import {
  AperturaVentanaId,
  CategoriaTrabajo,
  ColorId,
  LineaId,
  PanelRellenoSelection,
  VidrioId,
} from './alumineroLogic';
import {
  ModulacionCategoria,
  ModulacionModeloId,
  ModulacionSerieId,
} from './modulacionLogic';

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

export type LevLineaId =
  | '3'
  | '2'
  | 'europea'
  | 'batiente-alumer'
  | 'cancel-mosq'
  | 'otra';

export type LevColorAluminioId =
  | 'natural'
  | 'blanco'
  | 'negro'
  | 'bronce'
  | 'madera'
  | 'otro';

export type LevColorVidrioId =
  | 'claro'
  | 'filtrasol'
  | 'tintex'
  | 'esmerilado'
  | 'reflecta'
  | 'sin-vidrio';

export interface LevLineaOption {
  id: LevLineaId;
  label: string;
}

export interface LevColorOption<TId extends string> {
  id: TId;
  label: string;
  swatch: string;
}

export const LEV_LINEAS_OPCIONES: ReadonlyArray<LevLineaOption> = [
  { id: '3', label: 'Línea 3"' },
  { id: '2', label: 'Línea 2"' },
  { id: 'europea', label: 'Línea Europea' },
  { id: 'batiente-alumer', label: 'Batiente Alumer' },
  { id: 'cancel-mosq', label: 'Cancel / Mosquitero' },
  { id: 'otra', label: 'Otra' },
];

export const LEV_COLORES_ALUMINIO_OPCIONES: ReadonlyArray<LevColorOption<LevColorAluminioId>> = [
  { id: 'natural', label: 'Natural', swatch: '#C0C5CE' },
  { id: 'blanco', label: 'Blanco', swatch: '#F8FAFC' },
  { id: 'negro', label: 'Negro', swatch: '#1E293B' },
  { id: 'bronce', label: 'Bronce / Champagne', swatch: '#8C6D46' },
  { id: 'madera', label: 'Madera', swatch: '#7C4A27' },
  { id: 'otro', label: 'Otro', swatch: '#94A3B8' },
];

export const LEV_COLORES_VIDRIO_OPCIONES: ReadonlyArray<LevColorOption<LevColorVidrioId>> = [
  { id: 'claro', label: 'Claro', swatch: '#E0F2FE' },
  { id: 'filtrasol', label: 'Filtrasol', swatch: '#64748B' },
  { id: 'tintex', label: 'Tintex', swatch: '#34D399' },
  { id: 'esmerilado', label: 'Esmerilado', swatch: '#CBD5E1' },
  { id: 'reflecta', label: 'Reflecta', swatch: '#38BDF8' },
  { id: 'sin-vidrio', label: 'Sin vidrio / Otro', swatch: 'transparent' },
];

const VALID_LEV_LINEAS = new Set<string>(LEV_LINEAS_OPCIONES.map((o) => o.id));
const VALID_LEV_COLORES_ALUM = new Set<string>(LEV_COLORES_ALUMINIO_OPCIONES.map((o) => o.id));
const VALID_LEV_COLORES_VIDRIO = new Set<string>(LEV_COLORES_VIDRIO_OPCIONES.map((o) => o.id));

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
  lineaAluminio?: LevLineaId;
  lineaAluminioOtra?: string;
  colorAluminio?: LevColorAluminioId;
  colorAluminioOtro?: string;
  colorVidrio?: LevColorVidrioId;
  colorVidrioOtro?: string;
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
  serieId?: ModulacionSerieId;
  color?: ColorId;
  vidrio?: VidrioId;
  relleno?: PanelRellenoSelection;
  lineaLabel?: string;
  colorLabel?: string;
  vidrioLabel?: string;
  notasSpec?: string;
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

export function defaultLevLineaForTipo(tipo: string): LevLineaId {
  switch (tipo) {
    case 'Ventana Abatible / Proyección':
      return 'europea';
    case 'Puerta':
      return 'batiente-alumer';
    case 'Cancel / Otro':
      return 'cancel-mosq';
    default:
      return '3';
  }
}

export function resolvePiezaLineaId(
  pieza: Pick<LevantamientoPieza, 'tipo' | 'lineaAluminio'>
): LineaId {
  const mapa = LEV_MAPA[pieza.tipo] || LEV_MAPA['Cancel / Otro'];
  switch (pieza.lineaAluminio) {
    case '3':
      return '3';
    case '2':
      return pieza.tipo === 'Puerta' ? 'puerta-2' : '2';
    case 'europea':
      return pieza.tipo === 'Puerta' ? 'puerta-europea' : 'europea';
    case 'batiente-alumer':
      return 'puerta-abatible';
    case 'cancel-mosq':
      return 'cancel-bano';
    default:
      return mapa.linea;
  }
}

export function resolvePiezaLineaLabel(
  pieza: Pick<LevantamientoPieza, 'tipo' | 'lineaAluminio' | 'lineaAluminioOtra'>
): string {
  const sel = pieza.lineaAluminio || defaultLevLineaForTipo(pieza.tipo);
  if (sel === 'otra') {
    const custom = String(pieza.lineaAluminioOtra || '').trim();
    return custom || 'Otra línea';
  }
  return LEV_LINEAS_OPCIONES.find((o) => o.id === sel)?.label || 'Línea 3"';
}

export function resolvePiezaModulacionSerieId(
  pieza: Pick<LevantamientoPieza, 'tipo' | 'lineaAluminio'>
): ModulacionSerieId {
  if (pieza.lineaAluminio === '2') return 'linea-2';
  if (pieza.lineaAluminio === 'europea') return 'serie-70';
  if (pieza.lineaAluminio === '3' || pieza.lineaAluminio === 'batiente-alumer') return 'linea-3';
  const linea = resolvePiezaLineaId(pieza);
  if (linea === '2' || linea === 'puerta-2') return 'linea-2';
  if (linea === 'europea' || linea === 'puerta-europea') return 'serie-70';
  return 'linea-3';
}

export function resolvePiezaColorAluminio(
  pieza: Pick<LevantamientoPieza, 'colorAluminio' | 'colorAluminioOtro'>
): { colorId: ColorId; label: string; swatch: string; extraNote?: string } {
  const sel = pieza.colorAluminio || 'natural';
  if (sel === 'natural') {
    return { colorId: 'natural', label: 'Natural', swatch: '#C0C5CE' };
  }
  if (sel === 'blanco') {
    return { colorId: 'blanco', label: 'Blanco', swatch: '#F8FAFC' };
  }
  if (sel === 'negro') {
    return { colorId: 'negro', label: 'Negro', swatch: '#1E293B' };
  }
  if (sel === 'madera') {
    return { colorId: 'madera', label: 'Madera', swatch: '#7C4A27' };
  }
  if (sel === 'bronce') {
    return {
      colorId: 'natural',
      label: 'Bronce / Champagne',
      swatch: '#8C6D46',
      extraNote: 'Aluminio: Bronce / Champagne',
    };
  }
  const custom = String(pieza.colorAluminioOtro || '').trim();
  return {
    colorId: 'natural',
    label: custom || 'Otro',
    swatch: '#94A3B8',
    extraNote: custom ? `Aluminio: ${custom}` : 'Aluminio: Otro',
  };
}

export function resolvePiezaVidrioSpec(
  pieza: Pick<LevantamientoPieza, 'colorVidrio' | 'colorVidrioOtro'>
): {
  vidrio: VidrioId;
  relleno: PanelRellenoSelection;
  label: string;
  swatch: string;
  extraNote?: string;
} {
  const sel = pieza.colorVidrio || 'claro';
  if (sel === 'filtrasol') {
    return {
      vidrio: 'filtrasol6',
      relleno: { categoria: 'flotado', materialId: 'flot-filtrasol', espesorMm: 6 },
      label: 'Filtrasol',
      swatch: '#64748B',
    };
  }
  if (sel === 'tintex') {
    return {
      vidrio: 'tintex6',
      relleno: { categoria: 'flotado', materialId: 'flot-tintex', espesorMm: 6 },
      label: 'Tintex',
      swatch: '#34D399',
    };
  }
  if (sel === 'esmerilado') {
    return {
      vidrio: 'claro6',
      relleno: { categoria: 'templado', materialId: 'temp-esmerilado', espesorMm: 6 },
      label: 'Esmerilado',
      swatch: '#CBD5E1',
    };
  }
  if (sel === 'reflecta') {
    return {
      vidrio: 'claro6',
      relleno: { categoria: 'flotado', materialId: 'flot-reflecta-azul', espesorMm: 6 },
      label: 'Reflecta',
      swatch: '#38BDF8',
    };
  }
  if (sel === 'sin-vidrio') {
    const custom = String(pieza.colorVidrioOtro || '').trim();
    return {
      vidrio: 'claro6',
      relleno: { categoria: 'flotado', materialId: 'flot-claro', espesorMm: 6 },
      label: custom || 'Sin vidrio',
      swatch: 'transparent',
      extraNote: custom ? `Vidrio: ${custom}` : 'Sin vidrio',
    };
  }
  return {
    vidrio: 'claro6',
    relleno: { categoria: 'flotado', materialId: 'flot-claro', espesorMm: 6 },
    label: 'Claro',
    swatch: '#E0F2FE',
  };
}

export function buildPiezaSpecNotes(
  pieza: Pick<
    LevantamientoPieza,
    | 'tipo'
    | 'notas'
    | 'lineaAluminio'
    | 'lineaAluminioOtra'
    | 'colorAluminio'
    | 'colorAluminioOtro'
    | 'colorVidrio'
    | 'colorVidrioOtro'
  >
): string {
  const parts: string[] = [];
  if (pieza.lineaAluminio === 'otra' && pieza.lineaAluminioOtra?.trim()) {
    parts.push(`Línea: ${pieza.lineaAluminioOtra.trim()}`);
  }
  const colorSpec = resolvePiezaColorAluminio(pieza);
  if (colorSpec.extraNote) parts.push(colorSpec.extraNote);
  const vidrioSpec = resolvePiezaVidrioSpec(pieza);
  if (vidrioSpec.extraNote) parts.push(vidrioSpec.extraNote);
  const userNotas = String(pieza.notas || '').trim();
  if (userNotas) parts.push(userNotas);
  return parts.join(' · ');
}

export function formatPiezaSpecsSummary(
  pieza: Pick<
    LevantamientoPieza,
    | 'tipo'
    | 'lineaAluminio'
    | 'lineaAluminioOtra'
    | 'colorAluminio'
    | 'colorAluminioOtro'
    | 'colorVidrio'
    | 'colorVidrioOtro'
  >
): string {
  const hasAny =
    Boolean(pieza.lineaAluminio) || Boolean(pieza.colorAluminio) || Boolean(pieza.colorVidrio);
  if (!hasAny) return '';
  const parts: string[] = [];
  if (pieza.lineaAluminio) parts.push(resolvePiezaLineaLabel(pieza));
  if (pieza.colorAluminio) parts.push(`Alum. ${resolvePiezaColorAluminio(pieza).label}`);
  if (pieza.colorVidrio) parts.push(`Vidrio ${resolvePiezaVidrioSpec(pieza).label}`);
  return parts.join(' · ');
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
      const lineaRaw = typeof p.lineaAluminio === 'string' ? p.lineaAluminio : undefined;
      const colorAlumRaw = typeof p.colorAluminio === 'string' ? p.colorAluminio : undefined;
      const colorVidrioRaw = typeof p.colorVidrio === 'string' ? p.colorVidrio : undefined;
      return {
        id:
          typeof p.id === 'string' && p.id
            ? p.id
            : `p-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
        tipo: typeof p.tipo === 'string' && p.tipo ? p.tipo : 'Ventana Corrediza',
        area: typeof p.area === 'string' ? p.area : '',
        anchoCm: Number(p.anchoCm) > 0 ? Number(p.anchoCm) : 0,
        altoCm: Number(p.altoCm) > 0 ? Number(p.altoCm) : 0,
        cant: Math.max(1, Math.round(Number(p.cant) || 1)),
        notas: typeof p.notas === 'string' ? p.notas : '',
        foto: typeof p.foto === 'string' ? p.foto : '',
        ...(lineaRaw && VALID_LEV_LINEAS.has(lineaRaw)
          ? { lineaAluminio: lineaRaw as LevLineaId }
          : {}),
        ...(typeof p.lineaAluminioOtra === 'string' && p.lineaAluminioOtra.trim()
          ? { lineaAluminioOtra: p.lineaAluminioOtra.trim() }
          : {}),
        ...(colorAlumRaw && VALID_LEV_COLORES_ALUM.has(colorAlumRaw)
          ? { colorAluminio: colorAlumRaw as LevColorAluminioId }
          : {}),
        ...(typeof p.colorAluminioOtro === 'string' && p.colorAluminioOtro.trim()
          ? { colorAluminioOtro: p.colorAluminioOtro.trim() }
          : {}),
        ...(colorVidrioRaw && VALID_LEV_COLORES_VIDRIO.has(colorVidrioRaw)
          ? { colorVidrio: colorVidrioRaw as LevColorVidrioId }
          : {}),
        ...(typeof p.colorVidrioOtro === 'string' && p.colorVidrioOtro.trim()
          ? { colorVidrioOtro: p.colorVidrioOtro.trim() }
          : {}),
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
      : importedRaw &&
          typeof importedRaw === 'object' &&
          Array.isArray((importedRaw as Record<string, unknown>).levantamientos)
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
    const specSummary = formatPiezaSpecsSummary(p);
    lines.push(
      `${idx + 1}) ${p.tipo}${p.area ? ` (${p.area})` : ''}: ${formatMedidaText(p)} · Cant: ${p.cant}${
        specSummary ? ` · ${specSummary}` : ''
      }${p.notas ? ` · ${p.notas}` : ''}`
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
  const isBatienteOverride = pieza.lineaAluminio === 'batiente-alumer';
  const modelo: ModulacionModeloId | undefined = isBatienteOverride
    ? 'door-batiente'
    : mapa.modelo;
  const cat: ModulacionCategoria | undefined = isBatienteOverride ? 'puertas' : mapa.cat;

  if (destino === 'modulacion' && !modelo) {
    return { payload: null, unsupportedInModulacion: true };
  }

  const linea = resolvePiezaLineaId(pieza);
  const serieId = resolvePiezaModulacionSerieId(pieza);
  const colorSpec = resolvePiezaColorAluminio(pieza);
  const vidrioSpec = resolvePiezaVidrioSpec(pieza);
  const lineaLabel = resolvePiezaLineaLabel(pieza);
  const notasSpec = buildPiezaSpecNotes(pieza);

  return {
    unsupportedInModulacion: false,
    payload: {
      destino,
      linea,
      apertura: isBatienteOverride ? 'abatible' : mapa.apertura,
      modelo,
      cat,
      serieId,
      color: colorSpec.colorId,
      vidrio: vidrioSpec.vidrio,
      relleno: vidrioSpec.relleno,
      lineaLabel,
      colorLabel: colorSpec.label,
      vidrioLabel: vidrioSpec.label,
      notasSpec,
      ancho: pieza.anchoCm,
      alto: pieza.altoCm,
      cant: Math.max(1, Number(pieza.cant) || 1),
      cliente: String(cliente || '').trim(),
      area: String(pieza.area || '').trim(),
      etiqueta: '',
    },
  };
}
