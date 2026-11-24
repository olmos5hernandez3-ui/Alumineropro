import {
  AdminMessageItem,
  AjusteDescuentosConfig,
  AperturaVentanaId,
  cloneHomeMenuLayout,
  ColorId,
  DEFAULT_HOME_MENU_LAYOUT,
  HomeMenuLayout,
  LineaId,
  normalizeDeviceIdInput,
  normalizeHomeMenuLayout,
  OptimizadorConfig,
  PartidaObra,
  PerfilCatalogoId,
  ReferencePricesDoc,
} from './alumineroLogic';
import type { CotizacionReminder } from './pushReminders';

export const KEYS = {
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
  ADMIN_KEYS_DELETED: 'aluminero_deleted_admin_keys_v1',
  REVOKED_DEVICES: 'aluminero_revoked_devices_v1',
  CLOUD_ACCOUNT: 'aluminero_cloud_account_v1',
  THEME: 'aluminero_theme_v1',
  ADMIN_PWD_OVERRIDE: 'aluminero_admin_pwd_v2',
  SUGERENCIAS_WA: 'aluminero_wa_sugerencias_v1',
  TRABAJOS_ANTES_DESPUES: 'aluminero_antes_despues_v1',
  TRIAL_START: 'aluminero_trial_start_v1',
  TRIAL_REVOKED: 'aluminero_trial_revoked_v1',
  ACCESS_BLOCKED: 'aluminero_access_blocked_v1',
  INVENTARIO_VIDRIOS: 'aluminero_inv_vidrios_v1',
  CONTRATO_CLIENTE: 'aluminero_contrato_cliente_v1',
  CONTRATO_FOLIO: 'aluminero_contrato_folio_v1',
  COT_COUNTER: 'aluminero_cot_counter_v1',
  COT_ACTUAL: 'aluminero_cot_actual_v1',
  COTIZACIONES_HISTORIAL: 'aluminero_cotizaciones_v1',
  CLIENTES: 'aluminero_clientes_v1',
  REFERRAL_SENDER_NAME: 'aluminero_ref_sender_v1',
  SAVED_COLLEAGUE_REFERRAL: 'aluminero_saved_referral_v1',
  PROMO_COUNT_CACHE: 'aluminero_promo_count_cache_v1',
  RECORDATORIOS: 'aluminero_recordatorios_cotizacion_v1',
  REFERRALS_HISTORY: 'aluminero_referrals_history_v1',
  SKIN: 'aluminero_skin_v1',
  PROMO_COLEGA_USAGE: 'aluminero_promo_colega_usage_v1',
  TUTORIAL_SEEN: 'aluminero_guided_tutorial_seen_v1',
  ASSISTANT_QUOTA: 'aluminero_assistant_daily_quota_v1',
  TUTORIAL_VIDEOS_CACHE: 'aluminero_tutorial_videos_cache_v1',
  TERMS_ACCEPTED_AT: 'aluminero_terms_accepted_at_v1',
  READ_ADMIN_MESSAGES: 'aluminero_read_admin_messages_v1',
  REFERENCE_PRICES_CACHE: 'aluminero_reference_prices_cache_v1',
  ADMIN_MESSAGES_CACHE: 'aluminero_admin_messages_cache_v1',
  HOME_MENU_LAYOUT: 'aluminero_home_menu_layout_v1',
};

export const REFERRED_BY_ID_STORAGE_KEY = 'referred_by_id';

export type AppTheme = 'light' | 'dark';

export interface LicenciaState {
  active: boolean;
  planCode: string;
  planLabel: string;
  expiresAt: number | null;
  activatedAt: number;
  activatedKey?: string;
  adminAssigned?: boolean;
  linkedEmail?: string;
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
  revoked?: boolean;
  revokedAt?: number | null;
  linkedEmail?: string;
}

export interface CloudAccountSession {
  email: string;
  sessionToken: string;
  linkedDeviceId: string;
  lastBackedUpAt: number | null;
}

export interface CloudAccountBackupPayload {
  licencia: LicenciaState | null;
  hoja: HojaState;
  historial: HistorialItem[];
  contratoCliente?: ContratoClienteInfo;
  inventario: Record<string, number>;
  inventarioHerrajes: Record<string, number>;
  sobrantes: SobranteItem[];
  hojasVidrio: HojaVidrioItem[];
  obrasAprobadas: ObraAprobadaApartado[];
  notas?: NotaObra[];
  formulas?: FormulaPersonalizada[];
  homeMenuLayout?: HomeMenuLayout;
  updatedAt: number;
}

export type PdfHeaderColorId = 'navy' | 'blue' | 'slate' | 'emerald' | 'charcoal';
export type PdfLogoAlign = 'left' | 'center' | 'right';

export interface PdfHeaderConfig {
  mostrarLogo?: boolean;
  mostrarContacto?: boolean;
  eslogan?: string;
  email?: string;
  sitioWeb?: string;
  rfc?: string;
  colorTema?: PdfHeaderColorId;
  tituloCotizacion?: string;
  logoZoomPct?: number;
  logoAlign?: PdfLogoAlign;
}

export interface TallerConfig {
  nombre: string;
  responsable?: string;
  tel: string;
  ubicacion?: string;
  clienteDefault: string;
  logoDataUrl: string;
  descDistribuidorPct: number;
  precioListaTramo: number;
  tarifasBase: Partial<Record<LineaId, number>>;
  rellenoPreciosM2?: Record<string, number>;
  herrajesPrecios?: Record<string, number>;
  ajusteDescuentos?: Partial<AjusteDescuentosConfig>;
  optimizador?: Partial<OptimizadorConfig>;
  ivaPorDefecto?: boolean;
  termsAcceptedAt?: number | null;
  pdfHeader?: PdfHeaderConfig;
}

export interface PartidaObraExtended extends PartidaObra {
  notas?: string;
  fotoDataUrl?: string;
}

export interface HojaState {
  proyecto: string;
  clienteTel?: string;
  clienteDir?: string;
  partidas: PartidaObraExtended[];
  descuentoPct: number;
  incluirIva: boolean;
  vigenciaDias?: number;
  anticipoPct?: number;
  tiempoEntrega?: string;
  incluirFotosPdf?: boolean;
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
  recordatorios?: CotizacionReminder[];
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

export function clearTrialStart(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(KEYS.TRIAL_START);
  } catch {
    // ignorar si localStorage no permite escritura
  }
}

export const DEFAULT_PDF_HEADER: Required<PdfHeaderConfig> = {
  mostrarLogo: true,
  mostrarContacto: true,
  eslogan: '',
  email: '',
  sitioWeb: '',
  rfc: '',
  colorTema: 'navy',
  tituloCotizacion: '',
  logoZoomPct: 100,
  logoAlign: 'left',
};

export const DEFAULT_TALLER: TallerConfig = {
  nombre: '',
  responsable: '',
  tel: '',
  ubicacion: '',
  clienteDefault: '',
  logoDataUrl: '',
  descDistribuidorPct: 15,
  precioListaTramo: 850,
  tarifasBase: {},
  rellenoPreciosM2: {},
  herrajesPrecios: {},
  ajusteDescuentos: {},
  optimizador: {},
  ivaPorDefecto: false,
  termsAcceptedAt: null,
  pdfHeader: { ...DEFAULT_PDF_HEADER },
};

export function loadTaller(): TallerConfig {
  const saved = safeJsonParse<Partial<TallerConfig>>(localStorage.getItem(KEYS.TALLER), {});
  return {
    ...DEFAULT_TALLER,
    ...saved,
    pdfHeader: {
      ...DEFAULT_PDF_HEADER,
      ...(saved.pdfHeader && typeof saved.pdfHeader === 'object' ? saved.pdfHeader : {}),
    },
  };
}

export function saveTaller(t: TallerConfig): void {
  localStorage.setItem(KEYS.TALLER, JSON.stringify(t));
}

export const DEFAULT_HOJA_CONDITIONS = {
  vigenciaDias: 8,
  anticipoPct: 50,
  tiempoEntrega: '5 a 7 días hábiles',
};

export function loadHoja(): HojaState {
  const saved = safeJsonParse<Partial<HojaState>>(localStorage.getItem(KEYS.HOJA), {});
  return {
    proyecto: typeof saved.proyecto === 'string' ? saved.proyecto : '',
    clienteTel: typeof saved.clienteTel === 'string' ? saved.clienteTel : '',
    clienteDir: typeof saved.clienteDir === 'string' ? saved.clienteDir : '',
    partidas: Array.isArray(saved.partidas) ? (saved.partidas as PartidaObraExtended[]) : [],
    descuentoPct: Number.isFinite(Number(saved.descuentoPct)) ? Number(saved.descuentoPct) : 0,
    incluirIva: Boolean(saved.incluirIva),
    vigenciaDias:
      typeof saved.vigenciaDias === 'number' && Number.isFinite(saved.vigenciaDias)
        ? saved.vigenciaDias
        : DEFAULT_HOJA_CONDITIONS.vigenciaDias,
    anticipoPct:
      typeof saved.anticipoPct === 'number' && Number.isFinite(saved.anticipoPct)
        ? saved.anticipoPct
        : DEFAULT_HOJA_CONDITIONS.anticipoPct,
    tiempoEntrega:
      typeof saved.tiempoEntrega === 'string' && saved.tiempoEntrega.trim()
        ? saved.tiempoEntrega
        : DEFAULT_HOJA_CONDITIONS.tiempoEntrega,
    incluirFotosPdf: Boolean(saved.incluirFotosPdf),
  };
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

// ==================== FOLIO DE COTIZACIÓN (COT-AAAA-NNN) ====================
export function formatCotizacionFolio(seq: number, year: number = new Date().getFullYear()): string {
  const n = Math.max(1, Math.round(seq));
  return `COT-${year}-${String(n).padStart(3, '0')}`;
}

export function peekNextCotizacionFolio(
  year: number = new Date().getFullYear(),
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): string {
  try {
    const raw = storage ? storage.getItem(KEYS.COT_COUNTER) : null;
    const parsed = raw ? safeJsonParse<{ year?: number; seq?: number }>(raw, {}) : {};
    const nextSeq = parsed.year === year && typeof parsed.seq === 'number' ? parsed.seq + 1 : 1;
    return formatCotizacionFolio(nextSeq, year);
  } catch {
    return formatCotizacionFolio(1, year);
  }
}

export function getSavedCurrentCotizacionFolio(
  year: number = new Date().getFullYear(),
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): string {
  try {
    const saved = storage ? (storage.getItem(KEYS.COT_ACTUAL) || '').trim() : '';
    if (saved) return saved;
  } catch {
    // ignorar
  }
  return peekNextCotizacionFolio(year, storage);
}

export function issueNextCotizacionFolio(
  year: number = new Date().getFullYear(),
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): string {
  try {
    const raw = storage ? storage.getItem(KEYS.COT_COUNTER) : null;
    const parsed = raw ? safeJsonParse<{ year?: number; seq?: number }>(raw, {}) : {};
    const nextSeq = parsed.year === year && typeof parsed.seq === 'number' ? parsed.seq + 1 : 1;
    const folio = formatCotizacionFolio(nextSeq, year);
    if (storage) {
      storage.setItem(KEYS.COT_COUNTER, JSON.stringify({ year, seq: nextSeq }));
      storage.setItem(KEYS.COT_ACTUAL, folio);
    }
    return folio;
  } catch {
    return formatCotizacionFolio(1, year);
  }
}

// ==================== LIBRETA DE CLIENTES ====================
export interface ClienteGuardado {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  updatedAt: number;
}

export function loadClientes(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): ClienteGuardado[] {
  if (!storage) return [];
  const raw = safeJsonParse<unknown>(storage.getItem(KEYS.CLIENTES), []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is ClienteGuardado =>
      Boolean(c) && typeof c === 'object' && typeof (c as ClienteGuardado).nombre === 'string' && Boolean((c as ClienteGuardado).nombre.trim())
  );
}

export function saveClientes(
  list: ClienteGuardado[],
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): void {
  if (!storage) return;
  try {
    storage.setItem(KEYS.CLIENTES, JSON.stringify(list.slice(0, 200)));
  } catch {
    // ignorar si cuota llena
  }
}

export function upsertCliente(
  input: { nombre: string; telefono?: string; direccion?: string },
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): ClienteGuardado[] {
  const nombre = String(input.nombre || '').trim();
  if (!nombre || nombre.toLowerCase() === 'cliente general') {
    return loadClientes(storage);
  }
  const tel = String(input.telefono || '').trim();
  const dir = String(input.direccion || '').trim();
  const current = loadClientes(storage);
  const normKey = nombre.toLowerCase();
  const idx = current.findIndex((c) => c.nombre.trim().toLowerCase() === normKey);
  const now = Date.now();
  let next: ClienteGuardado[];
  if (idx >= 0) {
    const prev = current[idx];
    const updated: ClienteGuardado = {
      ...prev,
      nombre,
      telefono: tel || prev.telefono,
      direccion: dir || prev.direccion,
      updatedAt: now,
    };
    next = [updated, ...current.filter((_, i) => i !== idx)];
  } else {
    const created: ClienteGuardado = {
      id: `cli-${now}-${Math.floor(Math.random() * 9999)}`,
      nombre,
      telefono: tel,
      direccion: dir,
      updatedAt: now,
    };
    next = [created, ...current];
  }
  saveClientes(next, storage);
  return next;
}

// ==================== HISTORIAL DE COTIZACIONES (PDF FINAL) ====================
export type CotizacionEstado = 'enviada' | 'aprobada' | 'rechazada';

export interface CotizacionMaterialResumen {
  id?: string;
  nombre: string;
  codigo?: string;
  linea?: string;
  cantidad: number;
  unidad?: string;
}

export interface CotizacionGuardada {
  id: string;
  folio: string;
  fecha: string;
  cliente: string;
  telefono?: string;
  direccion?: string;
  total: number;
  piezasCount?: number;
  materiales?: CotizacionMaterialResumen[];
  estado: CotizacionEstado;
  createdAt: number;
}

export function loadCotizacionesGuardadas(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): CotizacionGuardada[] {
  if (!storage) return [];
  const raw = safeJsonParse<unknown>(storage.getItem(KEYS.COTIZACIONES_HISTORIAL), []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is CotizacionGuardada =>
      Boolean(c) && typeof c === 'object' && typeof (c as CotizacionGuardada).folio === 'string'
  );
}

export function saveCotizacionesGuardadas(
  list: CotizacionGuardada[],
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): void {
  if (!storage) return;
  try {
    storage.setItem(KEYS.COTIZACIONES_HISTORIAL, JSON.stringify(list.slice(0, 300)));
  } catch {
    // ignorar si cuota llena
  }
}

export function recordCotizacionGuardada(
  entry: Omit<CotizacionGuardada, 'id' | 'estado' | 'createdAt'> & { estado?: CotizacionEstado },
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): CotizacionGuardada[] {
  const list = loadCotizacionesGuardadas(storage);
  const existingIdx = list.findIndex((c) => c.folio === entry.folio);
  const nextEntry: CotizacionGuardada = {
    id: existingIdx >= 0 ? list[existingIdx].id : `cot-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    folio: entry.folio,
    fecha: entry.fecha,
    cliente: entry.cliente.trim() || 'Cliente General',
    telefono: entry.telefono?.trim() || undefined,
    direccion: entry.direccion?.trim() || undefined,
    total: Number.isFinite(entry.total) ? entry.total : 0,
    piezasCount: entry.piezasCount,
    materiales:
      Array.isArray(entry.materiales) && entry.materiales.length > 0
        ? entry.materiales
        : existingIdx >= 0
          ? list[existingIdx].materiales
          : undefined,
    estado: entry.estado || (existingIdx >= 0 ? list[existingIdx].estado : 'enviada'),
    createdAt: Date.now(),
  };
  const next = [nextEntry, ...list.filter((c) => c.folio !== entry.folio)];
  saveCotizacionesGuardadas(next, storage);
  return next;
}

export function updateCotizacionEstado(
  id: string,
  estado: CotizacionEstado,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null
): CotizacionGuardada[] {
  const next = loadCotizacionesGuardadas(storage).map((c) => (c.id === id ? { ...c, estado } : c));
  saveCotizacionesGuardadas(next, storage);
  return next;
}

export function filterCotizacionesByEstado(
  list: CotizacionGuardada[],
  filter: 'todas' | CotizacionEstado
): CotizacionGuardada[] {
  if (filter === 'todas') return list;
  return list.filter((c) => c.estado === filter);
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

export function loadCotizacionReminders(): CotizacionReminder[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = safeJsonParse<unknown>(localStorage.getItem(KEYS.RECORDATORIOS), []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is CotizacionReminder =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as CotizacionReminder).id === 'string' &&
      typeof (item as CotizacionReminder).proyecto === 'string' &&
      Number.isFinite(Number((item as CotizacionReminder).dueAt))
  );
}

export function saveCotizacionReminders(list: CotizacionReminder[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEYS.RECORDATORIOS, JSON.stringify(list.slice(0, 100)));
  } catch {
    // ignorar si localStorage está lleno
  }
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

export function buildAdminKeySignature(rec: Pick<AdminKeyRecord, 'deviceId' | 'key'>): string {
  const normDev = normalizeDeviceIdInput(String(rec.deviceId || ''));
  const normKey = String(rec.key || '').trim().toUpperCase();
  return `${normDev}::${normKey}`;
}

export function loadDeletedAdminKeySigs(): string[] {
  const raw = safeJsonParse<unknown>(localStorage.getItem(KEYS.ADMIN_KEYS_DELETED), []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.includes('::')).slice(0, 200);
}

export function saveDeletedAdminKeySigs(sigs: string[]): void {
  const unique = Array.from(new Set(sigs.filter((s) => typeof s === 'string' && s.includes('::')))).slice(0, 200);
  localStorage.setItem(KEYS.ADMIN_KEYS_DELETED, JSON.stringify(unique));
}

export function loadTrialRevoked(): boolean {
  return localStorage.getItem(KEYS.TRIAL_REVOKED) === '1';
}

export function saveTrialRevoked(revoked: boolean): void {
  if (revoked) {
    localStorage.setItem(KEYS.TRIAL_REVOKED, '1');
  } else {
    localStorage.removeItem(KEYS.TRIAL_REVOKED);
  }
}

export function loadAccessBlocked(): boolean {
  return localStorage.getItem(KEYS.ACCESS_BLOCKED) === '1';
}

export function saveAccessBlocked(blocked: boolean): void {
  if (blocked) {
    localStorage.setItem(KEYS.ACCESS_BLOCKED, '1');
  } else {
    localStorage.removeItem(KEYS.ACCESS_BLOCKED);
  }
}

export function loadRevokedDevicesMap(): Record<string, number> {
  const raw = safeJsonParse<unknown>(localStorage.getItem(KEYS.REVOKED_DEVICES), {});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const norm = k.trim().toUpperCase();
    const ts = Number(v);
    if (norm && Number.isFinite(ts) && ts > 0) {
      clean[norm] = ts;
    }
  }
  return clean;
}

export function saveRevokedDevicesMap(map: Record<string, number>): void {
  localStorage.setItem(KEYS.REVOKED_DEVICES, JSON.stringify(map));
}

export function loadCloudAccountSession(): CloudAccountSession | null {
  const raw = safeJsonParse<CloudAccountSession | null>(localStorage.getItem(KEYS.CLOUD_ACCOUNT), null);
  if (!raw || typeof raw !== 'object' || !raw.email || !raw.sessionToken) return null;
  return raw;
}

export function saveCloudAccountSession(session: CloudAccountSession | null): void {
  if (!session) {
    localStorage.removeItem(KEYS.CLOUD_ACCOUNT);
  } else {
    localStorage.setItem(KEYS.CLOUD_ACCOUNT, JSON.stringify(session));
  }
}

export function compressImageToDataUrl(
  file: File,
  maxDim = 600,
  quality = 0.78,
  preservePngAlpha = false
): Promise<string> {
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
        const keepPng = preservePngAlpha && file.type === 'image/png';
        if (!keepPng) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(keepPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality));
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
      'trabajosAntesDespues' in obj ||
      'recordatorios' in obj;

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
        typeof obj.sugerenciasWhatsapp === 'string'
          ? sanitizeWhatsappNumber(obj.sugerenciasWhatsapp) || undefined
          : undefined,
      trabajosAntesDespues: Array.isArray(obj.trabajosAntesDespues)
        ? (obj.trabajosAntesDespues as TrabajoAntesDespuesItem[])
        : undefined,
      recordatorios: Array.isArray(obj.recordatorios)
        ? (obj.recordatorios as CotizacionReminder[])
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

const LEGACY_DEFAULT_ADMIN_PASSWORDS = new Set([
  'TU_CONTRASEÑA_AQUI',
  'Olmos5Hernandes32026',
  'Olmos5hernandes32026',
]);

export function clearLegacyAdminKeys(): void {
  if (typeof localStorage === 'undefined') return;
  for (const k of LEGACY_ADMIN_STORAGE_KEYS) {
    localStorage.removeItem(k);
  }
  const current = localStorage.getItem(KEYS.ADMIN_PWD_OVERRIDE);
  if (current && LEGACY_DEFAULT_ADMIN_PASSWORDS.has(current.trim())) {
    localStorage.removeItem(KEYS.ADMIN_PWD_OVERRIDE);
  }
}

export function loadAdminPasswordOverride(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const val = localStorage.getItem(KEYS.ADMIN_PWD_OVERRIDE);
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || LEGACY_DEFAULT_ADMIN_PASSWORDS.has(trimmed)) {
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

export interface WhatsappValidationResult {
  valid: boolean;
  digits: string;
  error?: string;
}

export function validateWhatsappNumber(raw: string): WhatsappValidationResult {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) {
    return {
      valid: false,
      digits: '',
      error: 'Ingresa un número de WhatsApp obligatorio de 10 dígitos (ej. 5512345678).',
    };
  }
  if (/[^\d\s().-]/.test(trimmed)) {
    return {
      valid: false,
      digits: '',
      error: 'Formato inválido: usa solo 10 dígitos sin letras, símbolo + ni lada internacional.',
    };
  }
  const digits = trimmed.replace(/\D+/g, '');
  if (digits.length < 10) {
    return {
      valid: false,
      digits: '',
      error: `Faltan dígitos: ingresaste ${digits.length} y deben ser exactamente 10 dígitos.`,
    };
  }
  if (digits.length > 10) {
    return {
      valid: false,
      digits: '',
      error: `Sobran dígitos: ingresaste ${digits.length}. Ingresa solo los 10 dígitos locales (sin 52 ni 521).`,
    };
  }
  return {
    valid: true,
    digits,
  };
}

export function sanitizeWhatsappNumber(raw: string): string {
  const res = validateWhatsappNumber(raw);
  return res.valid ? res.digits : '';
}

export function formatWhatsappUrlDigits(raw: string): string {
  const digits = sanitizeWhatsappNumber(raw);
  return digits ? `52${digits}` : '';
}

export function loadSugerenciasWhatsapp(): string {
  if (typeof localStorage === 'undefined') return '';
  return sanitizeWhatsappNumber(localStorage.getItem(KEYS.SUGERENCIAS_WA) || '');
}

export interface SaveWhatsappResult {
  ok: boolean;
  digits: string;
  error?: string;
}

export function saveSugerenciasWhatsappValidated(phone: string): SaveWhatsappResult {
  const validation = validateWhatsappNumber(phone);
  if (!validation.valid) {
    return {
      ok: false,
      digits: loadSugerenciasWhatsapp(),
      error: validation.error,
    };
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEYS.SUGERENCIAS_WA, validation.digits);
  }
  return {
    ok: true,
    digits: validation.digits,
  };
}

export function clearSugerenciasWhatsapp(): string {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(KEYS.SUGERENCIAS_WA);
  }
  return '';
}

export function saveSugerenciasWhatsapp(phone: string): string {
  const trimmed = String(phone ?? '').trim();
  if (!trimmed) {
    return clearSugerenciasWhatsapp();
  }
  const result = saveSugerenciasWhatsappValidated(trimmed);
  return result.digits;
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

export interface SavedColleagueReferral {
  refName: string;
  promoNumber: number;
  savedAt: number;
}

export function loadReferralSenderName(): string {
  if (typeof localStorage === 'undefined') return '';
  try {
    return (localStorage.getItem(KEYS.REFERRAL_SENDER_NAME) || '').trim().slice(0, 60);
  } catch {
    return '';
  }
}

export function saveReferralSenderName(name: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const clean = String(name || '').trim().slice(0, 60);
    if (clean) {
      localStorage.setItem(KEYS.REFERRAL_SENDER_NAME, clean);
    } else {
      localStorage.removeItem(KEYS.REFERRAL_SENDER_NAME);
    }
  } catch {
    // ignorar si localStorage no permite escritura
  }
}

export function loadSavedColleagueReferral(): SavedColleagueReferral | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = safeJsonParse<SavedColleagueReferral | null>(
    localStorage.getItem(KEYS.SAVED_COLLEAGUE_REFERRAL),
    null
  );
  if (!raw || typeof raw !== 'object' || typeof raw.refName !== 'string' || !raw.refName.trim()) {
    return null;
  }
  const promoNum = Math.max(1, Math.round(Number(raw.promoNumber) || 1));
  return {
    refName: raw.refName.trim().slice(0, 60),
    promoNumber: promoNum,
    savedAt: Number(raw.savedAt) || Date.now(),
  };
}

export function saveColleagueReferral(referral: SavedColleagueReferral | null): void {
  if (typeof localStorage === 'undefined') return;
  try {
    if (!referral) {
      localStorage.removeItem(KEYS.SAVED_COLLEAGUE_REFERRAL);
    } else {
      localStorage.setItem(KEYS.SAVED_COLLEAGUE_REFERRAL, JSON.stringify(referral));
    }
  } catch {
    // ignorar si localStorage no permite escritura
  }
}

export function loadCachedPromoCount(): number {
  if (typeof localStorage === 'undefined') return 1;
  try {
    const val = parseInt(localStorage.getItem(KEYS.PROMO_COUNT_CACHE) || '1', 10);
    return Number.isFinite(val) && val >= 1 ? val : 1;
  } catch {
    return 1;
  }
}

export function saveCachedPromoCount(total: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const safe = Math.max(1, Math.round(Number(total) || 1));
    localStorage.setItem(KEYS.PROMO_COUNT_CACHE, String(safe));
  } catch {
    // ignorar si localStorage no permite escritura
  }
}

export interface ReferralHistoryRecord {
  id: string;
  referrerId: string;
  referredDeviceId: string;
  referredName?: string;
  planCode: string;
  planLabel: string;
  amountLabel?: string;
  createdAt: number;
}

export function sanitizeReferredById(raw: string | null | undefined): string | null {
  const clean = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return clean || null;
}

export function loadReferredById(currentDeviceId?: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const saved = sanitizeReferredById(localStorage.getItem(REFERRED_BY_ID_STORAGE_KEY));
    if (!saved) return null;
    if (
      currentDeviceId &&
      saved.toUpperCase() === String(currentDeviceId).trim().toUpperCase()
    ) {
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

export function saveReferredById(
  refId: string | null | undefined,
  currentDeviceId?: string
): string | null {
  if (typeof localStorage === 'undefined') return null;
  const clean = sanitizeReferredById(refId);
  if (!clean) return loadReferredById(currentDeviceId);
  const normSelf = String(currentDeviceId || '').trim().toUpperCase();
  if (normSelf && clean.toUpperCase() === normSelf) {
    return loadReferredById(currentDeviceId);
  }
  try {
    localStorage.setItem(REFERRED_BY_ID_STORAGE_KEY, clean);
  } catch {
    // ignorar si localStorage no permite escritura
  }
  return clean;
}

export function captureReferredByFromSearch(
  search: string,
  currentDeviceId: string
): string | null {
  try {
    const cleanSearch = String(search || '').trim();
    if (cleanSearch) {
      const params = new URLSearchParams(
        cleanSearch.startsWith('?') ? cleanSearch.slice(1) : cleanSearch
      );
      const rawRef = sanitizeReferredById(params.get('ref'));
      const normSelf = String(currentDeviceId || '').trim().toUpperCase();
      if (rawRef && (!normSelf || rawRef.toUpperCase() !== normSelf)) {
        return saveReferredById(rawRef, currentDeviceId);
      }
    }
  } catch {
    // ignorar errores de parsing de query string
  }
  return loadReferredById(currentDeviceId);
}

const REFERRED_BY_NAME_STORAGE_KEY = 'referred_by_name';

export function loadReferredByName(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = (localStorage.getItem(REFERRED_BY_NAME_STORAGE_KEY) || '').trim().slice(0, 80);
    return raw || null;
  } catch {
    return null;
  }
}

export function saveReferredByName(name: string | null): string | null {
  const clean = String(name || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80);
  if (typeof localStorage === 'undefined') return clean || null;
  try {
    if (!clean) {
      localStorage.removeItem(REFERRED_BY_NAME_STORAGE_KEY);
      return null;
    }
    localStorage.setItem(REFERRED_BY_NAME_STORAGE_KEY, clean);
  } catch {
    // ignore storage quota errors
  }
  return clean || null;
}

export function captureReferredByNameFromSearch(
  search: string,
  currentDeviceId: string
): string | null {
  try {
    const cleanSearch = String(search || '').trim();
    if (cleanSearch) {
      const params = new URLSearchParams(
        cleanSearch.startsWith('?') ? cleanSearch.slice(1) : cleanSearch
      );
      const rawRef = sanitizeReferredById(params.get('ref'));
      const normSelf = String(currentDeviceId || '').trim().toUpperCase();
      if (rawRef && (!normSelf || rawRef.toUpperCase() !== normSelf)) {
        const rawName = (params.get('refName') || params.get('taller') || '').trim();
        if (rawName) {
          return saveReferredByName(rawName);
        }
      }
    }
  } catch {
    // ignore
  }
  return loadReferredByName();
}

export function loadReferralHistory(): ReferralHistoryRecord[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = safeJsonParse<unknown>(localStorage.getItem(KEYS.REFERRALS_HISTORY), []);
  if (!Array.isArray(raw)) return [];
  const out: ReferralHistoryRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Partial<ReferralHistoryRecord>;
    const referrerId = sanitizeReferredById(obj.referrerId);
    const referredDeviceId = sanitizeReferredById(obj.referredDeviceId);
    if (!referrerId || !referredDeviceId) continue;
    out.push({
      id:
        typeof obj.id === 'string' && obj.id.trim()
          ? obj.id.trim()
          : `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      referrerId,
      referredDeviceId,
      referredName: typeof obj.referredName === 'string' ? obj.referredName.trim().slice(0, 80) : '',
      planCode: typeof obj.planCode === 'string' && obj.planCode.trim() ? obj.planCode.trim() : 'PRO',
      planLabel:
        typeof obj.planLabel === 'string' && obj.planLabel.trim()
          ? obj.planLabel.trim()
          : 'Licencia PRO',
      amountLabel: typeof obj.amountLabel === 'string' ? obj.amountLabel.trim().slice(0, 40) : '',
      createdAt:
        typeof obj.createdAt === 'number' && Number.isFinite(obj.createdAt)
          ? obj.createdAt
          : Date.now(),
    });
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export function saveReferralHistory(items: ReferralHistoryRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const safe = Array.isArray(items) ? items.slice(0, 300) : [];
    localStorage.setItem(KEYS.REFERRALS_HISTORY, JSON.stringify(safe));
  } catch {
    // ignorar si localStorage no permite escritura
  }
}

export function addReferralHistoryRecord(
  rec: Omit<ReferralHistoryRecord, 'id' | 'createdAt'>
): ReferralHistoryRecord[] {
  const existing = loadReferralHistory();
  const cleanReferrer = sanitizeReferredById(rec.referrerId);
  const cleanReferred = sanitizeReferredById(rec.referredDeviceId);
  if (!cleanReferrer || !cleanReferred) return existing;
  const nextEntry: ReferralHistoryRecord = {
    id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    referrerId: cleanReferrer,
    referredDeviceId: cleanReferred,
    referredName: (rec.referredName || '').trim().slice(0, 80),
    planCode: (rec.planCode || 'PRO').trim(),
    planLabel: (rec.planLabel || 'Licencia PRO').trim(),
    amountLabel: (rec.amountLabel || '').trim().slice(0, 40),
    createdAt: Date.now(),
  };
  const next = [nextEntry, ...existing].slice(0, 300);
  saveReferralHistory(next);
  return next;
}

// ==================== CARÁTULAS / APARIENCIA GLOBAL (3 TEMAS) ====================
export type AppSkin = 'basica' | 'ejecutiva' | 'industrial';

export function loadSkin(): AppSkin {
  if (typeof localStorage === 'undefined') return 'basica';
  const stored = localStorage.getItem(KEYS.SKIN);
  if (stored === 'basica' || stored === 'ejecutiva' || stored === 'industrial') {
    return stored;
  }
  return 'basica';
}

export function saveSkin(skin: AppSkin): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEYS.SKIN, skin);
  } catch {
    // ignorar si localStorage no permite escritura
  }
}

export function getUnlockedSkinsForLicense(
  licencia: LicenciaState | null | undefined,
  proActive: boolean
): AppSkin[] {
  if (!proActive || !licencia || !licencia.active) {
    return ['basica'];
  }
  const code = String(licencia.planCode || '').trim().toUpperCase();
  const key = String(licencia.activatedKey || '').trim().toUpperCase();
  // Prueba PRO / Promo Colega (3 días) desbloquea Azul Básico + Verde PRO (Industrial Pro)
  if (code === 'G' || code === 'D3' || /^AP-G-/i.test(key) || /^AP-D3-/i.test(key)) {
    return ['basica', 'industrial'];
  }
  // Planes PRO de pago (30 días, 90 días, 1 Año, Vitalicio o custom >= 7d) desbloquean todas incluyendo Verde PRO
  return ['basica', 'ejecutiva', 'industrial'];
}

export function isSkinUnlockedForLicense(
  skin: AppSkin,
  licencia: LicenciaState | null | undefined,
  proActive: boolean
): boolean {
  return getUnlockedSkinsForLicense(licencia, proActive).includes(skin);
}

export function getSkinPlanRequirementLabel(skin: AppSkin): string {
  if (skin === 'ejecutiva') return 'Plan PRO (30d, 90d o 1 Año)';
  if (skin === 'industrial') return 'Prueba PRO (3 días) o Plan PRO';
  return 'Versión Gratuita y PRO';
}

// ==================== USO ÚNICO PROMO COLEGA (3 DÍAS GRATIS) ====================
export interface PromoColegaUsageRecord {
  deviceId: string;
  promo_colega_usada: boolean;
  fecha_activacion_colega: number | null;
}

export function loadPromoColegaUsage(deviceId: string): PromoColegaUsageRecord {
  const normId = normalizeDeviceIdInput(deviceId) || String(deviceId || '').trim().toUpperCase();
  const fallback: PromoColegaUsageRecord = {
    deviceId: normId,
    promo_colega_usada: false,
    fecha_activacion_colega: null,
  };
  if (typeof localStorage === 'undefined') return fallback;
  const raw = safeJsonParse<Partial<PromoColegaUsageRecord> | Record<string, Partial<PromoColegaUsageRecord>> | null>(
    localStorage.getItem(KEYS.PROMO_COLEGA_USAGE),
    null
  );
  if (!raw || typeof raw !== 'object') return fallback;
  // Soporta almacenamiento por mapa de deviceId o registro directo
  const byMap = (raw as Record<string, Partial<PromoColegaUsageRecord>>)[normId];
  const rec = byMap && typeof byMap === 'object' ? byMap : (raw as Partial<PromoColegaUsageRecord>);
  if (rec.deviceId && normalizeDeviceIdInput(rec.deviceId) !== normId && !byMap) {
    return fallback;
  }
  const used = Boolean(rec.promo_colega_usada);
  const ts =
    typeof rec.fecha_activacion_colega === 'number' && Number.isFinite(rec.fecha_activacion_colega)
      ? rec.fecha_activacion_colega
      : null;
  return {
    deviceId: normId,
    promo_colega_usada: used,
    fecha_activacion_colega: used ? ts : null,
  };
}

export function savePromoColegaUsage(
  deviceId: string,
  used: boolean,
  activatedAt: number | null
): PromoColegaUsageRecord {
  const normId = normalizeDeviceIdInput(deviceId) || String(deviceId || '').trim().toUpperCase();
  const nextRec: PromoColegaUsageRecord = {
    deviceId: normId,
    promo_colega_usada: Boolean(used),
    fecha_activacion_colega: used && typeof activatedAt === 'number' && Number.isFinite(activatedAt) ? activatedAt : null,
  };
  if (typeof localStorage === 'undefined') return nextRec;
  try {
    const existingRaw = safeJsonParse<Record<string, PromoColegaUsageRecord>>(
      localStorage.getItem(KEYS.PROMO_COLEGA_USAGE),
      {}
    );
    const nextMap: Record<string, PromoColegaUsageRecord> =
      existingRaw && typeof existingRaw === 'object' && !Array.isArray(existingRaw)
        ? { ...existingRaw }
        : {};
    nextMap[normId] = nextRec;
    localStorage.setItem(KEYS.PROMO_COLEGA_USAGE, JSON.stringify(nextMap));
  } catch {
    // ignorar si localStorage no permite escritura
  }
  return nextRec;
}

export function formatDateTimeExact(ts: number | null | undefined): string {
  if (typeof ts !== 'number' || !Number.isFinite(ts) || ts <= 0) return '—';
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

// ==================== TUTORIAL GUIADO & CUOTA ASISTENTE & VIDEO TUTORIALES ====================

export function loadGuidedTutorialSeen(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(KEYS.TUTORIAL_SEEN) === '1';
}

export function saveGuidedTutorialSeen(seen: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEYS.TUTORIAL_SEEN, seen ? '1' : '0');
  } catch {
    // ignorar
  }
}

export function getTodayDateKey(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function loadAssistantDailyQuota(): { dateKey: string; count: number } {
  const today = getTodayDateKey();
  if (typeof localStorage === 'undefined') return { dateKey: today, count: 0 };
  const parsed = safeJsonParse<{ dateKey?: string; count?: number }>(
    localStorage.getItem(KEYS.ASSISTANT_QUOTA),
    {}
  );
  if (parsed.dateKey === today && typeof parsed.count === 'number' && Number.isFinite(parsed.count)) {
    return { dateKey: today, count: Math.max(0, Math.floor(parsed.count)) };
  }
  return { dateKey: today, count: 0 };
}

export function incrementAssistantDailyQuota(): { dateKey: string; count: number } {
  const cur = loadAssistantDailyQuota();
  const next = { dateKey: cur.dateKey, count: cur.count + 1 };
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(KEYS.ASSISTANT_QUOTA, JSON.stringify(next));
    } catch {
      // ignorar
    }
  }
  return next;
}

export type TutorialVideoCategory =
  | 'primeros-pasos'
  | 'ventanas-puertas'
  | 'optimizacion-vidrio'
  | 'cotizaciones-pdf';

export interface TutorialVideoItem {
  id: string;
  titulo: string;
  categoria: TutorialVideoCategory;
  descripcion: string;
  url: string;
  orden: number;
  createdAt: number;
  updatedAt: number;
  isLocalOnly?: boolean;
}

export function loadTutorialVideosCache(): TutorialVideoItem[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = safeJsonParse<unknown[]>(localStorage.getItem(KEYS.TUTORIAL_VIDEOS_CACHE), []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is TutorialVideoItem => Boolean(item && typeof item === 'object' && typeof (item as TutorialVideoItem).id === 'string'))
    .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999) || b.updatedAt - a.updatedAt);
}

export function saveTutorialVideosCache(videos: TutorialVideoItem[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEYS.TUTORIAL_VIDEOS_CACHE, JSON.stringify(videos.slice(0, 200)));
  } catch {
    // ignorar si cuota llena
  }
}

// ==================== TÉRMINOS, PRECIOS DE REFERENCIA Y MENSAJES ADMIN ====================

export function loadTermsAcceptedAt(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(KEYS.TERMS_ACCEPTED_AT);
  if (!raw) return null;
  const ts = Number(raw);
  return Number.isFinite(ts) && ts > 0 ? ts : null;
}

export function saveTermsAcceptedAt(ts: number): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEYS.TERMS_ACCEPTED_AT, String(Math.round(ts)));
  } catch {
    // ignorar
  }
}

export function loadReadAdminMessageIds(): string[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = safeJsonParse<unknown>(localStorage.getItem(KEYS.READ_ADMIN_MESSAGES), []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 300);
}

export function markAdminMessageIdRead(messageId: string): string[] {
  const cur = loadReadAdminMessageIds();
  if (!messageId || cur.includes(messageId)) return cur;
  const next = [messageId, ...cur].slice(0, 300);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(KEYS.READ_ADMIN_MESSAGES, JSON.stringify(next));
    } catch {
      // ignorar
    }
  }
  return next;
}

export function loadReferencePricesCache(): ReferencePricesDoc | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = safeJsonParse<ReferencePricesDoc | null>(
    localStorage.getItem(KEYS.REFERENCE_PRICES_CACHE),
    null
  );
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return null;
  return raw;
}

export function saveReferencePricesCache(doc: ReferencePricesDoc): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEYS.REFERENCE_PRICES_CACHE, JSON.stringify(doc));
  } catch {
    // ignorar
  }
}

export function loadAdminMessagesCache(): AdminMessageItem[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = safeJsonParse<unknown>(localStorage.getItem(KEYS.ADMIN_MESSAGES_CACHE), []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is AdminMessageItem => Boolean(item && typeof item === 'object' && typeof (item as AdminMessageItem).id === 'string'))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function saveAdminMessagesCache(list: AdminMessageItem[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEYS.ADMIN_MESSAGES_CACHE, JSON.stringify(list.slice(0, 100)));
  } catch {
    // ignorar
  }
}

export function loadHomeMenuLayout(): HomeMenuLayout {
  if (typeof localStorage === 'undefined') {
    return cloneHomeMenuLayout(DEFAULT_HOME_MENU_LAYOUT);
  }
  const raw = safeJsonParse<unknown>(localStorage.getItem(KEYS.HOME_MENU_LAYOUT), null);
  return normalizeHomeMenuLayout(raw);
}

export function saveHomeMenuLayout(layout: HomeMenuLayout): HomeMenuLayout {
  const normalized = normalizeHomeMenuLayout(layout);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(KEYS.HOME_MENU_LAYOUT, JSON.stringify(normalized));
    } catch {
      // ignorar si localStorage no permite escritura
    }
  }
  return normalized;
}




