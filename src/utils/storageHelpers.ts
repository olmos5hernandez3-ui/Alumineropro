import {
  AperturaVentanaId,
  ColorId,
  LineaId,
  PartidaObra,
  PerfilCatalogoId,
} from './alumineroLogic';

const KEYS = {
  DEVICE_ID: 'aluminero_device_id_v1',
  LICENCIA: 'aluminero_licencia_v1',
  TALLER: 'aluminero_taller_v1',
  HOJA: 'aluminero_hoja_v1',
  INVENTARIO: 'aluminero_inventario_v1',
  INVENTARIO_HERRAJES: 'aluminero_inv_herrajes_v1',
  INVENTARIO_SOBRANTES: 'aluminero_sobrantes_v1',
  COMPROMETIDOS: 'aluminero_comprometidos_v1',
  OBRAS_APROBADAS: 'aluminero_obras_aprobadas_v1',
  NOTAS: 'aluminero_notas_v1',
  HISTORIAL: 'aluminero_historial_v1',
  FORMULAS: 'aluminero_formulas_v1',
  PERFIL_FOTOS: 'aluminero_perfil_fotos_v1',
  ADMIN_KEYS: 'aluminero_admin_keys_v1',
  THEME: 'aluminero_theme_v1',
  ADMIN_PWD_OVERRIDE: 'aluminero_admin_pwd_v2',
  SUGERENCIAS_WA: 'aluminero_wa_sugerencias_v1',
  TRABAJOS_ANTES_DESPUES: 'aluminero_antes_despues_v1',
  TRIAL_START: 'aluminero_trial_start_v1',
  INVENTARIO_VIDRIOS: 'aluminero_inv_vidrios_v1',
  CONTRATO_CLIENTE: 'aluminero_contrato_cliente_v1',
  CONTRATO_FOLIO: 'aluminero_contrato_folio_v1',
};

export type AppTheme = 'light' | 'dark';

export interface LicenciaState {
  active: boolean;
  planCode: string;
  planLabel: string;
  expiresAt: number | null;
  activatedAt: number;
}

export interface AdminKeyRecord {
  id: string;
  cliente: string;
  deviceId: string;
  planLabel: string;
  dias: number | null;
  key: string;
  createdAt: number;
  expiresAt: number | null;
}

export interface TallerConfig {
  nombre: string;
  tel: string;
  ubicacion?: string;
  clienteDefault: string;
  logoDataUrl: string;
  descDistribuidorPct: number;
  precioListaTramo: number;
  tarifasBase: Partial<Record<LineaId, number>>;
  rellenoPreciosM2?: Record<string, number>;
}

export interface HojaState {
  proyecto: string;
  partidas: PartidaObra[];
  descuentoPct: number;
  incluirIva: boolean;
}

export interface NotaObra {
  id: string;
  titulo: string;
  texto: string;
  fecha: string;
  fotoDataUrl?: string;
  lineaHint?: LineaId;
  aperturaHint?: AperturaVentanaId;
  anchoCm?: number;
  altoCm?: number;
}

export interface HistorialItem {
  id: string;
  referencia: string;
  fecha: string;
  linea: LineaId;
  anchoCm: number;
  altoCm: number;
  color: ColorId;
  cantidad: number;
  total: number;
}

export interface FormulaPersonalizada {
  id: string;
  nombre: string;
  linea: LineaId;
  tolerancias: {
    marcoH: number;
    hojaV: number;
    hojaH: number;
    vidAncho: number;
    vidAlto: number;
  };
}

export interface ObraAprobadaApartado {
  id: string;
  proyecto: string;
  key: string;
  linea: LineaId;
  perfilId: PerfilCatalogoId;
  color: ColorId;
  tramos: number;
  fecha: string;
}

export interface SobranteItem {
  id: string;
  marca?: string;
  linea: LineaId;
  perfilId: PerfilCatalogoId;
  color: ColorId;
  largoM: number;
  cantidad: number;
  nota?: string;
  fecha: string;
}

export type HojaCategoriaId = 'vidrio' | 'templado' | 'espejo' | 'plastico';

export interface HojaVidrioItem {
  id: string;
  categoria?: HojaCategoriaId;
  tono?: string;
  tipoNombre: string;
  espesorMm: number;
  anchoCm: number;
  altoCm: number;
  cantidad: number;
  nota?: string;
  fecha: string;
}

export interface ContratoClienteInfo {
  nombre: string;
  telefono: string;
  direccion: string;
  vigenciaDias: number;
  anticipoPct: number;
  anticipoRecibido?: number;
  fechaEntregaEstimada?: string;
  folio?: string;
  clausulaVigencia?: string;
  clausulaAnticipo?: string;
  clausulaEntrega?: string;
  clausulaCondicionesVano?: string;
  clausulaGarantia?: string;
}

export type PerfilFotosMap = Record<string, string>;

export interface TrabajoAntesDespuesItem {
  id: string;
  titulo: string;
  descripcion: string;
  lineaNombre: string;
  autor?: string;
  antesImgUrl?: string;
  despuesImgUrl?: string;
  presetVariant?: 'ventana3' | 'puerta-europea' | 'cancel-bano';
  fecha: string;
  aprobado: boolean;
  esPersonal?: boolean;
}

export interface AlumineroBackupPayload {
  app: 'Aluminero Pro';
  version: number;
  exportedAt: string;
  perfilFotos: PerfilFotosMap;
  notas?: NotaObra[];
  taller?: TallerConfig;
  formulas?: FormulaPersonalizada[];
  inventario?: Record<string, number>;
  inventarioHerrajes?: Record<string, number>;
  sobrantes?: SobranteItem[];
  hojasVidrio?: HojaVidrioItem[];
  obrasAprobadas?: ObraAprobadaApartado[];
  historial?: HistorialItem[];
  sugerenciasWhatsapp?: string;
  trabajosAntesDespues?: TrabajoAntesDespuesItem[];
}

export function makePerfilFotoKey(perfilId: PerfilCatalogoId, lineaId?: LineaId | 'all'): string {
  if (lineaId && lineaId !== 'all') {
    return `${lineaId}__${perfilId}`;
  }
  return perfilId;
}

export function getPerfilFotoUrl(
  fotos: PerfilFotosMap,
  perfilId: PerfilCatalogoId,
  lineaId?: LineaId
): string | undefined {
  if (lineaId) {
    const specific = fotos[`${lineaId}__${perfilId}`];
    if (specific) return specific;
  }
  if (fotos[perfilId]) return fotos[perfilId];
  const prefixMatch = Object.entries(fotos).find(([k]) => k.endsWith(`__${perfilId}`));
  return prefixMatch ? prefixMatch[1] : undefined;
}

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getOrCreateDeviceId(): string {
  const existing = typeof localStorage !== 'undefined' ? localStorage.getItem(KEYS.DEVICE_ID) : null;
  if (existing) return existing;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  const id = `ALM-${suffix}`;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEYS.DEVICE_ID, id);
  }
  return id;
}

export function loadLicencia(): LicenciaState | null {
  return safeJsonParse<LicenciaState | null>(localStorage.getItem(KEYS.LICENCIA), null);
}

export function saveLicencia(lic: LicenciaState | null): void {
  if (!lic) {
    localStorage.removeItem(KEYS.LICENCIA);
  } else {
    localStorage.setItem(KEYS.LICENCIA, JSON.stringify(lic));
  }
}

export function getOrInitTrialStart(now: number = Date.now()): number {
  if (typeof localStorage === 'undefined') return now;
  const raw = localStorage.getItem(KEYS.TRIAL_START);
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  try {
    localStorage.setItem(KEYS.TRIAL_START, String(now));
  } catch {
    // ignorar si localStorage no permite escritura
  }
  return now;
}

export const DEFAULT_TALLER: TallerConfig = {
  nombre: '',
  tel: '',
  ubicacion: '',
  clienteDefault: '',
  logoDataUrl: '',
  descDistribuidorPct: 15,
  precioListaTramo: 850,
  tarifasBase: {},
  rellenoPreciosM2: {},
};

export function loadTaller(): TallerConfig {
  return { ...DEFAULT_TALLER, ...safeJsonParse<Partial<TallerConfig>>(localStorage.getItem(KEYS.TALLER), {}) };
}

export function saveTaller(t: TallerConfig): void {
  localStorage.setItem(KEYS.TALLER, JSON.stringify(t));
}

export function loadHoja(): HojaState {
  return safeJsonParse<HojaState>(localStorage.getItem(KEYS.HOJA), {
    proyecto: '',
    partidas: [],
    descuentoPct: 0,
    incluirIva: false,
  });
}

export function saveHoja(h: HojaState): void {
  localStorage.setItem(KEYS.HOJA, JSON.stringify(h));
}

export function loadInventario(): Record<string, number> {
  return safeJsonParse<Record<string, number>>(localStorage.getItem(KEYS.INVENTARIO), {});
}

export function saveInventario(inv: Record<string, number>): void {
  localStorage.setItem(KEYS.INVENTARIO, JSON.stringify(inv));
}

export function loadInventarioHerrajes(): Record<string, number> {
  return safeJsonParse<Record<string, number>>(localStorage.getItem(KEYS.INVENTARIO_HERRAJES), {});
}

export function saveInventarioHerrajes(inv: Record<string, number>): void {
  localStorage.setItem(KEYS.INVENTARIO_HERRAJES, JSON.stringify(inv));
}

export function loadSobrantes(): SobranteItem[] {
  return safeJsonParse<SobranteItem[]>(localStorage.getItem(KEYS.INVENTARIO_SOBRANTES), []);
}

export function saveSobrantes(list: SobranteItem[]): void {
  localStorage.setItem(KEYS.INVENTARIO_SOBRANTES, JSON.stringify(list));
}

export function loadHojasVidrio(): HojaVidrioItem[] {
  return safeJsonParse<HojaVidrioItem[]>(localStorage.getItem(KEYS.INVENTARIO_VIDRIOS), []);
}

export function saveHojasVidrio(list: HojaVidrioItem[]): void {
  localStorage.setItem(KEYS.INVENTARIO_VIDRIOS, JSON.stringify(list));
}

export const DEFAULT_CONTRATO_CLAUSES = {
  anticipo:
    'El anticipo se destina a la compra de material a medida; una vez iniciado el corte no aplican cancelaciones ni cambios de medida sin costo adicional.',
  entrega:
    'La fecha de entrega corre a partir del pago del anticipo y verificación de medidas finales en obra.',
  condicionesVano:
    'El cliente deberá entregar los vanos terminados y libres; trabajos de albañilería o electricidad no están incluidos.',
  garantia:
    'Garantía en mano de obra, sellado hermético y herrajes por uso normal (no cubre rotura de cristales posterior a la entrega).',
};

export const DEFAULT_CONTRATO_CLIENTE: ContratoClienteInfo = {
  nombre: '',
  telefono: '',
  direccion: '',
  vigenciaDias: 15,
  anticipoPct: 50,
  anticipoRecibido: 0,
  fechaEntregaEstimada: '',
  clausulaAnticipo: DEFAULT_CONTRATO_CLAUSES.anticipo,
  clausulaEntrega: DEFAULT_CONTRATO_CLAUSES.entrega,
  clausulaCondicionesVano: DEFAULT_CONTRATO_CLAUSES.condicionesVano,
  clausulaGarantia: DEFAULT_CONTRATO_CLAUSES.garantia,
};

export function loadContratoCliente(): ContratoClienteInfo {
  const saved = safeJsonParse<Partial<ContratoClienteInfo>>(localStorage.getItem(KEYS.CONTRATO_CLIENTE), {});
  return {
    ...DEFAULT_CONTRATO_CLIENTE,
    ...saved,
    clausulaAnticipo: saved.clausulaAnticipo?.trim() || DEFAULT_CONTRATO_CLAUSES.anticipo,
    clausulaEntrega: saved.clausulaEntrega?.trim() || DEFAULT_CONTRATO_CLAUSES.entrega,
    clausulaCondicionesVano:
      saved.clausulaCondicionesVano?.trim() || DEFAULT_CONTRATO_CLAUSES.condicionesVano,
    clausulaGarantia: saved.clausulaGarantia?.trim() || DEFAULT_CONTRATO_CLAUSES.garantia,
  };
}

export function saveContratoCliente(info: ContratoClienteInfo): void {
  localStorage.setItem(KEYS.CONTRATO_CLIENTE, JSON.stringify(info));
}

export function formatContratoFolio(seq: number, year: number = new Date().getFullYear()): string {
  const n = Math.max(1, Math.round(seq));
  return `CONT-${year}-${String(n).padStart(3, '0')}`;
}

export function peekNextContratoFolio(year: number = new Date().getFullYear()): string {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEYS.CONTRATO_FOLIO) : null;
    const parsed = raw ? safeJsonParse<{ year?: number; seq?: number }>(raw, {}) : {};
    const nextSeq = parsed.year === year && typeof parsed.seq === 'number' ? parsed.seq + 1 : 1;
    return formatContratoFolio(nextSeq, year);
  } catch {
    return formatContratoFolio(1, year);
  }
}

export function issueNextContratoFolio(year: number = new Date().getFullYear()): string {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEYS.CONTRATO_FOLIO) : null;
    const parsed = raw ? safeJsonParse<{ year?: number; seq?: number }>(raw, {}) : {};
    const nextSeq = parsed.year === year && typeof parsed.seq === 'number' ? parsed.seq + 1 : 1;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEYS.CONTRATO_FOLIO, JSON.stringify({ year, seq: nextSeq }));
    }
    return formatContratoFolio(nextSeq, year);
  } catch {
    return formatContratoFolio(1, year);
  }
}

export function loadObrasAprobadas(): ObraAprobadaApartado[] {
  return safeJsonParse<ObraAprobadaApartado[]>(localStorage.getItem(KEYS.OBRAS_APROBADAS), []);
}

export function saveObrasAprobadas(list: ObraAprobadaApartado[]): void {
  localStorage.setItem(KEYS.OBRAS_APROBADAS, JSON.stringify(list));
}

export function loadNotas(): NotaObra[] {
  return safeJsonParse<NotaObra[]>(localStorage.getItem(KEYS.NOTAS), []);
}

export function saveNotas(notas: NotaObra[]): void {
  localStorage.setItem(KEYS.NOTAS, JSON.stringify(notas));
}

export function loadHistorial(): HistorialItem[] {
  return safeJsonParse<HistorialItem[]>(localStorage.getItem(KEYS.HISTORIAL), []);
}

export function saveHistorial(hist: HistorialItem[]): void {
  localStorage.setItem(KEYS.HISTORIAL, JSON.stringify(hist));
}

export function loadFormulas(): FormulaPersonalizada[] {
  return safeJsonParse<FormulaPersonalizada[]>(localStorage.getItem(KEYS.FORMULAS), []);
}

export function saveFormulas(list: FormulaPersonalizada[]): void {
  localStorage.setItem(KEYS.FORMULAS, JSON.stringify(list));
}

export function loadPerfilFotos(): PerfilFotosMap {
  return safeJsonParse<PerfilFotosMap>(localStorage.getItem(KEYS.PERFIL_FOTOS), {});
}

export function savePerfilFotos(fotos: PerfilFotosMap): void {
  localStorage.setItem(KEYS.PERFIL_FOTOS, JSON.stringify(fotos));
}

export function loadAdminKeys(): AdminKeyRecord[] {
  return safeJsonParse<AdminKeyRecord[]>(localStorage.getItem(KEYS.ADMIN_KEYS), []);
}

export function saveAdminKeys(list: AdminKeyRecord[]): void {
  localStorage.setItem(KEYS.ADMIN_KEYS, JSON.stringify(list.slice(0, 60)));
}

export function compressImageToDataUrl(file: File, maxDim = 600, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Archivo de imagen inválido.'));
      img.onload = () => {
        const clampedMax = Math.min(600, Math.max(64, maxDim));
        const ratio = Math.min(1, clampedMax / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || clampedMax) * ratio));
        const h = Math.max(1, Math.round((img.height || clampedMax) * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el compresor de imagen.'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function parseBackupPayload(rawText: string): AlumineroBackupPayload | null {
  try {
    const parsed = JSON.parse(rawText) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const obj = parsed as Record<string, unknown>;
    const rawFotos =
      obj.perfilFotos && typeof obj.perfilFotos === 'object' && !Array.isArray(obj.perfilFotos)
        ? (obj.perfilFotos as Record<string, unknown>)
        : {};
    const perfilFotos: PerfilFotosMap = {};
    for (const [k, v] of Object.entries(rawFotos)) {
      if (typeof v === 'string' && v.startsWith('data:image/')) {
        perfilFotos[k] = v;
      }
    }

    const hasAnyBackupField =
      'perfilFotos' in obj ||
      'notas' in obj ||
      'taller' in obj ||
      'formulas' in obj ||
      'inventario' in obj ||
      'inventarioHerrajes' in obj ||
      'sobrantes' in obj ||
      'hojasVidrio' in obj ||
      'obrasAprobadas' in obj ||
      'historial' in obj ||
      'trabajosAntesDespues' in obj;

    if (!hasAnyBackupField) return null;

    return {
      app: 'Aluminero Pro',
      version: Number(obj.version) || 1,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      perfilFotos,
      notas: Array.isArray(obj.notas) ? (obj.notas as NotaObra[]) : undefined,
      taller: obj.taller && typeof obj.taller === 'object' ? (obj.taller as TallerConfig) : undefined,
      formulas: Array.isArray(obj.formulas) ? (obj.formulas as FormulaPersonalizada[]) : undefined,
      inventario:
        obj.inventario && typeof obj.inventario === 'object' && !Array.isArray(obj.inventario)
          ? (obj.inventario as Record<string, number>)
          : undefined,
      inventarioHerrajes:
        obj.inventarioHerrajes &&
        typeof obj.inventarioHerrajes === 'object' &&
        !Array.isArray(obj.inventarioHerrajes)
          ? (obj.inventarioHerrajes as Record<string, number>)
          : undefined,
      sobrantes: Array.isArray(obj.sobrantes) ? (obj.sobrantes as SobranteItem[]) : undefined,
      hojasVidrio: Array.isArray(obj.hojasVidrio) ? (obj.hojasVidrio as HojaVidrioItem[]) : undefined,
      obrasAprobadas: Array.isArray(obj.obrasAprobadas)
        ? (obj.obrasAprobadas as ObraAprobadaApartado[])
        : undefined,
      historial: Array.isArray(obj.historial) ? (obj.historial as HistorialItem[]) : undefined,
      sugerenciasWhatsapp:
        typeof obj.sugerenciasWhatsapp === 'string' ? obj.sugerenciasWhatsapp : undefined,
      trabajosAntesDespues: Array.isArray(obj.trabajosAntesDespues)
        ? (obj.trabajosAntesDespues as TrabajoAntesDespuesItem[])
        : undefined,
    };
  } catch {
    return null;
  }
}

export function formatMXN(val: number): string {
  return `$${Number(val || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function loadTheme(): AppTheme {
  if (typeof localStorage === 'undefined') return 'dark';
  const stored = localStorage.getItem(KEYS.THEME);
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
}

export function saveTheme(theme: AppTheme): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEYS.THEME, theme);
}

const LEGACY_ADMIN_STORAGE_KEYS = [
  'admin_password',
  'admin_pass',
  'admin_clave',
  'admin_auth',
  'admin_session',
  'admin_logged_in',
  'aluminero_admin_pass',
  'aluminero_admin_pass_v1',
  'aluminero_admin_password',
  'aluminero_admin_password_v1',
  'aluminero_admin_session',
  'aluminero_admin_auth',
];

export function clearLegacyAdminKeys(): void {
  if (typeof localStorage === 'undefined') return;
  for (const k of LEGACY_ADMIN_STORAGE_KEYS) {
    localStorage.removeItem(k);
  }
  const current = localStorage.getItem(KEYS.ADMIN_PWD_OVERRIDE);
  if (current && current.trim() === 'TU_CONTRASEÑA_AQUI') {
    localStorage.removeItem(KEYS.ADMIN_PWD_OVERRIDE);
  }
}

export function loadAdminPasswordOverride(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const val = localStorage.getItem(KEYS.ADMIN_PWD_OVERRIDE);
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'TU_CONTRASEÑA_AQUI') {
    localStorage.removeItem(KEYS.ADMIN_PWD_OVERRIDE);
    return null;
  }
  return trimmed;
}

export function saveAdminPasswordOverride(newPassword: string | null): void {
  if (typeof localStorage === 'undefined') return;
  const clean = typeof newPassword === 'string' ? newPassword.trim() : '';
  if (!clean) {
    localStorage.removeItem(KEYS.ADMIN_PWD_OVERRIDE);
  } else {
    localStorage.setItem(KEYS.ADMIN_PWD_OVERRIDE, clean);
  }
}

export function sanitizeWhatsappNumber(raw: string): string {
  return String(raw || '').replace(/\D+/g, '');
}

export function loadSugerenciasWhatsapp(): string {
  if (typeof localStorage === 'undefined') return '';
  return (localStorage.getItem(KEYS.SUGERENCIAS_WA) || '').trim();
}

export function saveSugerenciasWhatsapp(phone: string): string {
  const clean = sanitizeWhatsappNumber(phone);
  if (typeof localStorage !== 'undefined') {
    if (!clean) {
      localStorage.removeItem(KEYS.SUGERENCIAS_WA);
    } else {
      localStorage.setItem(KEYS.SUGERENCIAS_WA, clean);
    }
  }
  return clean;
}

export const DEFAULT_TRABAJOS_ANTES_DESPUES: TrabajoAntesDespuesItem[] = [
  {
    id: 'ad-preset-1',
    titulo: 'Ventanal Corredizo 240 × 150 cm',
    descripcion: 'Reemplazo de vano en obra gris por ventana corrediza Línea Nacional 3" en aluminio Negro Mate con vidrio Filtrasol 6 mm.',
    lineaNombre: 'Línea Nacional 3"',
    autor: 'Obra aprobada · Referencia Alumer',
    presetVariant: 'ventana3',
    fecha: 'Aprobado',
    aprobado: true,
  },
  {
    id: 'ad-preset-2',
    titulo: 'Puerta Principal Línea Europea 100 × 215 cm',
    descripcion: 'Cambio de puerta metálica oxidada por Puerta Línea Europea corte 45° con 6 escuadras, cerradura multipunto y vidrio claro 6 mm.',
    lineaNombre: 'Puerta Línea Europea',
    autor: 'Obra aprobada · Referencia Taller',
    presetVariant: 'puerta-europea',
    fecha: 'Aprobado',
    aprobado: true,
  },
  {
    id: 'ad-preset-3',
    titulo: 'Cancel para Baño Semilujo 145 × 190 cm',
    descripcion: 'Instalación sobre tina/regadera abierta con riel Alumer 11174, guía 11387 y acabado Blanco con vidrio Tintex.',
    lineaNombre: 'Cancel para Baño (Alumer)',
    autor: 'Obra aprobada · Referencia Baño',
    presetVariant: 'cancel-bano',
    fecha: 'Aprobado',
    aprobado: true,
  },
];

export function loadTrabajosAntesDespues(): TrabajoAntesDespuesItem[] {
  if (typeof localStorage === 'undefined') return DEFAULT_TRABAJOS_ANTES_DESPUES;
  const saved = safeJsonParse<TrabajoAntesDespuesItem[] | null>(
    localStorage.getItem(KEYS.TRABAJOS_ANTES_DESPUES),
    null
  );
  if (!Array.isArray(saved) || saved.length === 0) {
    return DEFAULT_TRABAJOS_ANTES_DESPUES;
  }
  return saved;
}

export function saveTrabajosAntesDespues(list: TrabajoAntesDespuesItem[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEYS.TRABAJOS_ANTES_DESPUES, JSON.stringify(list.slice(0, 40)));
}

export function dataUrlToJpegFile(dataUrl: string, filename: string): File {
  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const b64 = parts[1] || '';
  const mimeMatch = header.match(/data:([^;]+);base64/i);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

export function openExternalLinkSafe(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function triggerFileDownload(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1800);
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar imagen para collage.'));
    img.src = src;
  });
}

export async function buildBeforeAfterCollageFile(
  antesDataUrl: string,
  despuesDataUrl: string,
  filename = 'trabajo-antes-y-despues.jpg'
): Promise<File> {
  const [imgAntes, imgDespues] = await Promise.all([
    loadImageElement(antesDataUrl),
    loadImageElement(despuesDataUrl),
  ]);

  const panelW = 540;
  const panelH = 440;
  const gap = 16;
  const headerH = 56;
  const pad = 16;
  const totalW = pad * 2 + panelW * 2 + gap;
  const totalH = pad * 2 + headerH + panelH;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return dataUrlToJpegFile(despuesDataUrl, filename);
  }

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, totalW, totalH);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('ALUMINERO PRO · ANTES Y DESPUÉS', pad, pad + 32);

  const drawContain = (img: HTMLImageElement, x: number, y: number, w: number, h: number, badge: string, badgeColor: string) => {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x, y, w, h);
    const scale = Math.min(w / Math.max(1, img.width), h / Math.max(1, img.height));
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);

    ctx.fillStyle = badgeColor;
    ctx.fillRect(x + 12, y + 12, 130, 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(badge, x + 26, y + 35);
  };

  const yStart = pad + headerH;
  drawContain(imgAntes, pad, yStart, panelW, panelH, 'ANTES', '#D97706');
  drawContain(imgDespues, pad + panelW + gap, yStart, panelW, panelH, 'DESPUÉS', '#059669');

  return dataUrlToJpegFile(canvas.toDataURL('image/jpeg', 0.84), filename);
}




