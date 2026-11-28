export type CategoriaTrabajo = 'ventanas' | 'puertas';

export type LineaId =
  | '3'
  | '2'
  | 'europea'
  | 'euroalum-2500'
  | 'euroalum-2800'
  | 'euroalum-3800'
  | 'cancel-bano'
  | 'mosq-fijo'
  | 'mosq-corredizo'
  | 'mosq-abatible'
  | 'puerta-2'
  | 'puerta-abatible'
  | 'puerta-europea';

export type ColorId = 'natural' | 'blanco' | 'negro' | 'madera';
export type VidrioId = 'claro4' | 'claro6' | 'filtrasol6' | 'tintex6';
export type AperturaVentanaId =
  | 'corrediza'
  | 'fija'
  | 'guillotina'
  | 'abatible'
  | 'banderola'
  | 'oscilobatiente'
  | 'plegable';

export type CancelEstiloId = 'economico' | 'semilujo' | 'lujo';

export type PerfilFamilia =
  | 'fijo3'
  | 'corrediza3'
  | 'nacional2'
  | 'serie1400'
  | 'espanola'
  | 'batiente'
  | 'cancel'
  | 'herralum'
  | 'perfileto'
  | 'mosquitero';

export type PerfilCatalogoId =
  // Corrediza 3" (Alumer / Nacional 3") + compartidos
  | 'cabezal'
  | 'riel'
  | 'jamba'
  | 'cerco'
  | 'traslape'
  | 'cabecero'
  | 'zoclo1v'
  | 'zoclo2v'
  | 'alumer_9382'
  | 'alumer_9382c'
  | 'alumer_7828'
  | 'chambrana'
  | 'batiente'
  // Fijo 3" (Alumer)
  | 'alumer_9135'
  | 'alumer_9112'
  | 'alumer_9136'
  | 'alumer_10235'
  | 'alumer_10237'
  | 'alumer_7316'
  | 'alumer_9114'
  | 'alumer_7315'
  | 'alumer_9115'
  // Puerta Batiente (Alumer)
  | 'alumer_9207'
  | 'alumer_9204'
  | 'alumer_5844'
  | 'alumer_5060'
  | 'alumer_9183'
  | 'alumer_9187'
  | 'alumer_8550'
  | 'alumer_6370'
  | 'alumer_9184'
  | 'alumer_12756'
  | 'alumer_11032'
  // Cancel para Baño (Alumer)
  | 'alumer_11174'
  | 'alumer_11386'
  | 'alumer_11387'
  | 'alumer_11035'
  | 'alumer_11046'
  | 'alumer_11173'
  // Línea Nacional 2"
  | 'nac2_cabezal_2401'
  | 'nac2_riel_2402'
  | 'nac2_jamba_2403'
  | 'nac2_cerco_2404'
  // Serie 1400 (Panorama / Comercial)
  | 's1400_marco_1401'
  | 's1400_hoja_1402'
  | 's1400_junquillo_1405'
  // Línea Española / Europea
  | 'esp_marco_s35'
  | 'esp_hoja_s70'
  | 'esp_riel_s80'
  // Herralum (Cristal Templado / Cancel / Herrajes)
  | 'herralum_riel_1500'
  | 'herralum_u_templado'
  | 'herralum_marco_templado'
  // Perfileto (Catálogo oficial México)
  | 'perfileto_cabezal_3'
  | 'perfileto_riel_3'
  | 'perfileto_cerco_3'
  | 'perfileto_marco_1400'
  | 'perfileto_euro_70'
  | 'perfileto_cancel_bano'
  // Mosquiteros
  | 'mosq_marco'
  | 'riel_mosq';

export interface PlanDefinicion {
  code: 'G' | 'M' | 'Q' | 'A' | 'P';
  idx: number;
  label: string;
  price: string;
  ms: number | null;
  days: number;
  adminOnly?: boolean;
}

export const PLANS: PlanDefinicion[] = [
  {
    code: 'G',
    idx: 0,
    label: 'Promoción 3 Días (Regalo)',
    price: 'Regalo',
    ms: 3 * 24 * 60 * 60 * 1000,
    days: 3,
    adminOnly: true,
  },
  {
    code: 'M',
    idx: 1,
    label: '30 Días ($329 MXN)',
    price: '$329 MXN',
    ms: 30 * 24 * 60 * 60 * 1000,
    days: 30,
    adminOnly: false,
  },
  {
    code: 'Q',
    idx: 2,
    label: '90 Días ($799 MXN)',
    price: '$799 MXN',
    ms: 90 * 24 * 60 * 60 * 1000,
    days: 90,
    adminOnly: false,
  },
  {
    code: 'A',
    idx: 3,
    label: '1 Año / 365 Días ($1,499 MXN)',
    price: '$1,499 MXN',
    ms: 365 * 24 * 60 * 60 * 1000,
    days: 365,
    adminOnly: false,
  },
];

export const APP_VERSION = '1.0.16';
export const APP_VERSION_LABEL = `v${APP_VERSION}`;

export const TRAMO_STD_CM = 610;
export const TRAMO_STD_M = 6.1;

export const PRE_CUT_WARNING_TEXT =
  '⚠️ Aviso: Las fórmulas son referenciales y varían según el extrusor. Verifica siempre todas las medidas antes de realizar cualquier corte.';

export const LEGAL_DISCLAIMER_TEXT = `AVISO LEGAL Y DESLINDE DE RESPONSABILIDAD — ALUMINERO PRO

1. Naturaleza Referencial de Cálculos y Fórmulas:
Las medidas de corte, descuentos en centímetros, optimizaciones de tramos de 6.10 m, cortes de vidrio en 2D y estimaciones de precios generadas por Aluminero Pro son estrictamente orientativas y de apoyo administrativo y técnico. Las dimensiones reales de los perfiles varían según el fabricante o extrusor (Alumer, Cuprum, Indalum, Extrusiones Metálicas, etc.), calibres, tolerancias del disco de corte, plomos de obra y tipo de herraje utilizado.

2. Obligación de Verificación Previa al Corte:
El usuario (maestro aluminero, instalador o responsable del taller) asume la responsabilidad total de verificar físicamente cada vano en obra y confirmar todas las medidas y descuentos antes de cortar aluminio, vidrio, acrílico o duela. Aluminero Pro y sus desarrolladores NO asumen responsabilidad alguna por pérdidas de material, errores de fabricación, desperdicios, retrasos de obra o reclamaciones de clientes derivadas del uso de la aplicación.

3. Precios de Referencia y Cotizaciones:
Los precios sugeridos de aluminio, vidrio y herrajes son valores promedio de mercado con carácter meramente informativo. El taller debe validar precios vigentes con su proveedor local antes de emitir o confirmar un presupuesto definitivo.

4. Propiedad de Datos y Licencias:
Los proyectos, cotizaciones, inventarios y respaldos pertenecen íntegramente al usuario y se almacenan localmente en su dispositivo (con sincronización opcional en nube según plan). El uso continuado de la aplicación implica la aceptación plena de este Aviso Legal y Deslinde.`;

export interface AjusteDescuentosConfig {
  // Línea 2"
  l2JambaAlto: number;
  l2HojaFijaAlto: number;
  l2HojaCorredizaAlto: number;
  l2Zoclo2HojasAncho: number;
  l2Zoclo3HojasAncho: number;
  // Línea 3"
  l3JambaAlto: number;
  l3RielAdicionalAncho: number;
  l3HojaFijaAlto: number;
  l3HojaCorredizaAlto: number;
  l3Zoclo2HojasAncho: number;
  l3Zoclo3HojasAncho: number;
  // Cancel Baño & Cancel Corredizo
  cancelBanoJambaAlto: number;
  cancelCorrMarcoAlto: number;
  cancelCorrHojaAlto: number;
  // Puertas Abatibles (1 hoja y 2 hojas)
  puertaJambaAlto: number;
  puertaLargueroAlto: number;
  puerta1HojaHorizAncho: number;
  puerta2HojasHorizAncho: number;
  puertaVidrioExtraAncho: number;
  duelaAnchoUtilCm: number;
}

export const DEFAULT_AJUSTE_DESCUENTOS: AjusteDescuentosConfig = {
  l2JambaAlto: 1.6,
  l2HojaFijaAlto: 2.8,
  l2HojaCorredizaAlto: 3.8,
  l2Zoclo2HojasAncho: 16.0,
  l2Zoclo3HojasAncho: 21.0,
  l3JambaAlto: 2.6,
  l3RielAdicionalAncho: 2.8,
  l3HojaFijaAlto: 2.7,
  l3HojaCorredizaAlto: 3.7,
  l3Zoclo2HojasAncho: 18.0,
  l3Zoclo3HojasAncho: 24.0,
  cancelBanoJambaAlto: 4.0,
  cancelCorrMarcoAlto: 2.6,
  cancelCorrHojaAlto: 3.6,
  puertaJambaAlto: 2.6,
  puertaLargueroAlto: 4.0,
  puerta1HojaHorizAncho: 18.0,
  puerta2HojasHorizAncho: 33.5,
  puertaVidrioExtraAncho: 1.4,
  duelaAnchoUtilCm: 10.0,
};

export interface OptimizadorConfig {
  largoBarraCm: number;
  despuntePorExtremoCm: number;
  kerfCm: number;
  umbralSobranteUsableCm: number;
}

export const DEFAULT_OPTIMIZADOR_CONFIG: OptimizadorConfig = {
  largoBarraCm: 610,
  despuntePorExtremoCm: 2.5,
  kerfCm: 0.4,
  umbralSobranteUsableCm: 60,
};

export function resolveAjusteDescuentos(
  partial?: Partial<AjusteDescuentosConfig> | null
): AjusteDescuentosConfig {
  if (!partial) return { ...DEFAULT_AJUSTE_DESCUENTOS };
  const out: AjusteDescuentosConfig = { ...DEFAULT_AJUSTE_DESCUENTOS };
  (Object.keys(DEFAULT_AJUSTE_DESCUENTOS) as Array<keyof AjusteDescuentosConfig>).forEach((k) => {
    const val = Number(partial[k]);
    if (Number.isFinite(val) && val >= 0) {
      out[k] = val;
    }
  });
  return out;
}

export function resolveOptimizadorConfig(
  partial?: Partial<OptimizadorConfig> | null
): OptimizadorConfig {
  if (!partial) return { ...DEFAULT_OPTIMIZADOR_CONFIG };
  return {
    largoBarraCm:
      Number.isFinite(Number(partial.largoBarraCm)) && Number(partial.largoBarraCm) >= 100
        ? Number(partial.largoBarraCm)
        : DEFAULT_OPTIMIZADOR_CONFIG.largoBarraCm,
    despuntePorExtremoCm:
      Number.isFinite(Number(partial.despuntePorExtremoCm)) && Number(partial.despuntePorExtremoCm) >= 0
        ? Number(partial.despuntePorExtremoCm)
        : DEFAULT_OPTIMIZADOR_CONFIG.despuntePorExtremoCm,
    kerfCm:
      Number.isFinite(Number(partial.kerfCm)) && Number(partial.kerfCm) >= 0
        ? Number(partial.kerfCm)
        : DEFAULT_OPTIMIZADOR_CONFIG.kerfCm,
    umbralSobranteUsableCm:
      Number.isFinite(Number(partial.umbralSobranteUsableCm)) && Number(partial.umbralSobranteUsableCm) >= 10
        ? Number(partial.umbralSobranteUsableCm)
        : DEFAULT_OPTIMIZADOR_CONFIG.umbralSobranteUsableCm,
  };
}

export interface LineaConfig {
  id: LineaId;
  categoria: CategoriaTrabajo;
  nombre: string;
  desc: string;
  pro: boolean;
  tarifaBaseDefault: number;
  esMosquitero?: boolean;
  esCancelBano?: boolean;
  toleranciasDefault: {
    marcoH: number;
    hojaV: number;
    hojaH: number;
    vidAncho: number;
    vidAlto: number;
  };
}

export const LINEAS_CONFIG: Record<LineaId, LineaConfig> = {
  '3': {
    id: '3',
    categoria: 'ventanas',
    nombre: 'Línea Nacional 3"',
    desc: 'Alumer 76.2 mm · Corrediza y Fijo 3"',
    pro: false,
    tarifaBaseDefault: 2850,
    toleranciasDefault: { marcoH: 6.4, hojaV: 4.5, hojaH: 7.5, vidAncho: 5.5, vidAlto: 18 },
  },
  '2': {
    id: '2',
    categoria: 'ventanas',
    nombre: 'Línea 2"',
    desc: 'Tradicional 50.8 mm',
    pro: true,
    tarifaBaseDefault: 2250,
    toleranciasDefault: { marcoH: 5.1, hojaV: 4.0, hojaH: 6.4, vidAncho: 5.0, vidAlto: 15.5 },
  },
  europea: {
    id: 'europea',
    categoria: 'ventanas',
    nombre: 'Línea Europea',
    desc: 'Perimetral corte 45°',
    pro: true,
    tarifaBaseDefault: 4100,
    toleranciasDefault: { marcoH: 0, hojaV: 5.4, hojaH: 6.0, vidAncho: 7.5, vidAlto: 11.5 },
  },
  'euroalum-2500': {
    id: 'euroalum-2500',
    categoria: 'ventanas',
    nombre: 'EuroAlum 2500 (45°)',
    desc: 'Indalum · Riel 1695 · Hoja 1699 · Traslape 1619',
    pro: false,
    tarifaBaseDefault: 3650,
    toleranciasDefault: { marcoH: 0, hojaV: 6.3, hojaH: 0.4, vidAncho: 21.5, vidAlto: 17.0 },
  },
  'euroalum-2800': {
    id: 'euroalum-2800',
    categoria: 'ventanas',
    nombre: 'EuroAlum 2800 (90°)',
    desc: 'Indalum · Riel 12150/12151 · Jamba 12152 · Cerco 12154',
    pro: false,
    tarifaBaseDefault: 3450,
    toleranciasDefault: { marcoH: 1.2, hojaV: 4.4, hojaH: 4.5, vidAncho: 14.1, vidAlto: 13.0 },
  },
  'euroalum-3800': {
    id: 'euroalum-3800',
    categoria: 'ventanas',
    nombre: 'EuroAlum 3800 (90°)',
    desc: 'Indalum · Riel 12263 · Jamba 12208 · Goterón 12301',
    pro: false,
    tarifaBaseDefault: 4250,
    toleranciasDefault: { marcoH: 2.5, hojaV: 6.8, hojaH: 10.2, vidAncho: 19.8, vidAlto: 19.1 },
  },
  'cancel-bano': {
    id: 'cancel-bano',
    categoria: 'ventanas',
    nombre: 'Cancel para Baño (Alumer)',
    desc: 'Riel 11174 · Guía 11387 · Marcos',
    pro: true,
    esCancelBano: true,
    tarifaBaseDefault: 2450,
    toleranciasDefault: { marcoH: 0.5, hojaV: 4.2, hojaH: 4.0, vidAncho: 4.5, vidAlto: 8.5 },
  },
  'mosq-fijo': {
    id: 'mosq-fijo',
    categoria: 'ventanas',
    nombre: 'Mosquitero Fijo',
    desc: 'Bastidor + Tela + Cola de rata',
    pro: true,
    esMosquitero: true,
    tarifaBaseDefault: 980,
    toleranciasDefault: { marcoH: 0, hojaV: 0, hojaH: 0, vidAncho: 2.0, vidAlto: 2.0 },
  },
  'mosq-corredizo': {
    id: 'mosq-corredizo',
    categoria: 'ventanas',
    nombre: 'Mosquitero Corredizo',
    desc: 'Con riel guía + carretillas',
    pro: true,
    esMosquitero: true,
    tarifaBaseDefault: 1280,
    toleranciasDefault: { marcoH: 0, hojaV: 3.2, hojaH: 0, vidAncho: 2.5, vidAlto: 5.2 },
  },
  'mosq-abatible': {
    id: 'mosq-abatible',
    categoria: 'ventanas',
    nombre: 'Mosquitero Abatible',
    desc: 'Marco abatible + bisagras + cierre + tela',
    pro: true,
    esMosquitero: true,
    tarifaBaseDefault: 1380,
    toleranciasDefault: { marcoH: 0, hojaV: 1.4, hojaH: 1.4, vidAncho: 3.0, vidAlto: 3.0 },
  },
  'puerta-2': {
    id: 'puerta-2',
    categoria: 'puertas',
    nombre: 'Puerta Línea 2" Pesada',
    desc: 'Canal Liso + Batiente · Cerco Chapa',
    pro: true,
    tarifaBaseDefault: 3350,
    toleranciasDefault: { marcoH: 5.0, hojaV: 3.2, hojaH: 5.6, vidAncho: 8.5, vidAlto: 23.0 },
  },
  'puerta-abatible': {
    id: 'puerta-abatible',
    categoria: 'puertas',
    nombre: 'Puerta Batiente (Alumer)',
    desc: 'Cabezal PP 9207 · Cerco 9204 · Zoclo 9187',
    pro: true,
    tarifaBaseDefault: 3900,
    toleranciasDefault: { marcoH: 6.4, hojaV: 3.5, hojaH: 7.2, vidAncho: 10.0, vidAlto: 25.0 },
  },
  'puerta-europea': {
    id: 'puerta-europea',
    categoria: 'puertas',
    nombre: 'Puerta Línea Europea',
    desc: 'Perimetral 45° · 6 escuadras · Multipunto',
    pro: true,
    tarifaBaseDefault: 4950,
    toleranciasDefault: { marcoH: 0, hojaV: 4.0, hojaH: 7.0, vidAncho: 11.0, vidAlto: 15.0 },
  },
};

export function normalizeLineaId(linea?: string | null): LineaId {
  if (linea && Object.prototype.hasOwnProperty.call(LINEAS_CONFIG, linea)) {
    return linea as LineaId;
  }
  return '3';
}

export interface ColorConfig {
  id: ColorId;
  nombre: string;
  corto: string;
  extraM2: number;
  swatch: string;
  frameStroke: string;
  frameFill: string;
}

export const COLORES_CONFIG: Record<ColorId, ColorConfig> = {
  natural: {
    id: 'natural',
    nombre: 'Anodizado Natural',
    corto: 'Natural',
    extraM2: 0,
    swatch: '#CBD5E1',
    frameStroke: '#64748B',
    frameFill: 'url(#alum-nat)',
  },
  blanco: {
    id: 'blanco',
    nombre: 'Blanco Texturizado',
    corto: 'Blanco',
    extraM2: 180,
    swatch: '#F8FAFC',
    frameStroke: '#94A3B8',
    frameFill: '#F8FAFC',
  },
  negro: {
    id: 'negro',
    nombre: 'Negro Texturizado',
    corto: 'Negro',
    extraM2: 260,
    swatch: '#1E293B',
    frameStroke: '#0F172A',
    frameFill: '#334155',
  },
  madera: {
    id: 'madera',
    nombre: 'Electroestático Madera',
    corto: 'Madera',
    extraM2: 780,
    swatch: '#8B5A2B',
    frameStroke: '#5C3A1B',
    frameFill: 'url(#alum-mad)',
  },
};

export interface VidrioConfig {
  id: VidrioId;
  nombre: string;
  extraM2: number;
  swatch: string;
  fill: string;
}

export const VIDRIOS_CONFIG: Record<VidrioId, VidrioConfig> = {
  claro4: { id: 'claro4', nombre: 'Vidrio claro 4 mm', extraM2: -150, swatch: '#DBEAFE', fill: '#DBEAFE' },
  claro6: { id: 'claro6', nombre: 'Vidrio claro 6 mm', extraM2: 0, swatch: '#BAE6FD', fill: '#BAE6FD' },
  filtrasol6: { id: 'filtrasol6', nombre: 'Filtrasol 6 mm', extraM2: 280, swatch: '#64748B', fill: '#64748B' },
  tintex6: { id: 'tintex6', nombre: 'Tintex 6 mm', extraM2: 320, swatch: '#6EE7B7', fill: '#6EE7B7' },
};

export type RellenoCategoriaId = 'flotado' | 'templado' | 'espejo' | 'plastico' | 'duela';

export interface PanelRellenoItem {
  id: string;
  categoria: RellenoCategoriaId;
  nombre: string;
  descripcion: string;
  espesoresMm: number[];
  defaultEspesorMm: number;
  precioBaseM2: number;
  espesorPreciosM2?: Record<number, number>;
  esDireccional?: boolean;
  swatch: string;
  fill: string;
  vidrioCompatId: VidrioId;
}

export interface PanelRellenoSelection {
  categoria: RellenoCategoriaId;
  materialId: string;
  espesorMm: number;
}

export const RELLENO_CATEGORIAS_META: Array<{
  id: RellenoCategoriaId;
  nombre: string;
  corto: string;
  badge: string;
}> = [
  { id: 'flotado', nombre: 'Vidrio Flotado y Control Solar', corto: 'Flotado / Solar', badge: '7 tonos' },
  { id: 'templado', nombre: 'Vidrio Templado', corto: 'Templado', badge: 'Seguridad' },
  { id: 'espejo', nombre: 'Espejos', corto: 'Espejos', badge: 'Reflejante' },
  { id: 'plastico', nombre: 'Plástico / Acrílico Baño', corto: 'Plástico Baño', badge: 'Cancel / Domo' },
  { id: 'duela', nombre: 'Duela de Aluminio', corto: 'Duela Alum.', badge: '12.7 mm' },
];

export const PANEL_RELLENO_CATALOGO: PanelRellenoItem[] = [
  // 1. Vidrio Flotado y Control Solar
  {
    id: 'flot-claro',
    categoria: 'flotado',
    nombre: 'Vidrio claro',
    descripcion: 'Cristal flotado transparente de alta claridad para ventana o puerta.',
    espesoresMm: [3, 4, 6, 9, 12],
    defaultEspesorMm: 6,
    precioBaseM2: 440,
    espesorPreciosM2: { 3: 240, 4: 290, 6: 440, 9: 680, 12: 960 },
    swatch: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 60%, #7DD3FC 100%)',
    fill: '#BAE6FD',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'flot-filtrasol',
    categoria: 'flotado',
    nombre: 'Filtrasol',
    descripcion: 'Control solar tono humo/bronce grisáceo que reduce el calor interior.',
    espesoresMm: [3, 6],
    defaultEspesorMm: 6,
    precioBaseM2: 720,
    espesorPreciosM2: { 3: 520, 6: 720 },
    swatch: 'linear-gradient(135deg, #94A3B8 0%, #64748B 55%, #334155 100%)',
    fill: '#64748B',
    vidrioCompatId: 'filtrasol6',
  },
  {
    id: 'flot-tintex',
    categoria: 'flotado',
    nombre: 'Tintex Verde',
    descripcion: 'Cristal tintado verde arquitectónico con filtración UV y fresca apariencia.',
    espesoresMm: [3, 6],
    defaultEspesorMm: 6,
    precioBaseM2: 760,
    espesorPreciosM2: { 3: 560, 6: 760 },
    swatch: 'linear-gradient(135deg, #A7F3D0 0%, #34D399 55%, #059669 100%)',
    fill: '#6EE7B7',
    vidrioCompatId: 'tintex6',
  },
  {
    id: 'flot-sollite',
    categoria: 'flotado',
    nombre: 'Sol Lite',
    descripcion: 'Control solar neutro de baja reflectividad con excelente paso de luz.',
    espesoresMm: [6],
    defaultEspesorMm: 6,
    precioBaseM2: 890,
    espesorPreciosM2: { 6: 890 },
    swatch: 'linear-gradient(135deg, #CBD5E1 0%, #94A3B8 45%, #475569 100%)',
    fill: '#94A3B8',
    vidrioCompatId: 'filtrasol6',
  },
  {
    id: 'flot-reflecta-ambar',
    categoria: 'flotado',
    nombre: 'Reflecta Ámbar',
    descripcion: 'Vidrio reflectivo bronce/ámbar tipo espejo de día para privacidad en fachadas.',
    espesoresMm: [6],
    defaultEspesorMm: 6,
    precioBaseM2: 1150,
    espesorPreciosM2: { 6: 1150 },
    swatch: 'linear-gradient(135deg, #FDE68A 0%, #D97706 42%, #FFFBEB 54%, #92400E 100%)',
    fill: 'url(#fill-reflecta-ambar)',
    vidrioCompatId: 'filtrasol6',
  },
  {
    id: 'flot-reflecta-verde',
    categoria: 'flotado',
    nombre: 'Reflecta Verde',
    descripcion: 'Vidrio reflectivo esmeralda metálico para ahorro térmico y privacidad exterior.',
    espesoresMm: [6],
    defaultEspesorMm: 6,
    precioBaseM2: 1150,
    espesorPreciosM2: { 6: 1150 },
    swatch: 'linear-gradient(135deg, #A7F3D0 0%, #059669 42%, #ECFDF5 54%, #065F46 100%)',
    fill: 'url(#fill-reflecta-verde)',
    vidrioCompatId: 'tintex6',
  },
  {
    id: 'flot-reflecta-azul',
    categoria: 'flotado',
    nombre: 'Reflecta Azul',
    descripcion: 'Vidrio reflectivo azul metálico ideal para fachadas modernas y ventanales.',
    espesoresMm: [6],
    defaultEspesorMm: 6,
    precioBaseM2: 1150,
    espesorPreciosM2: { 6: 1150 },
    swatch: 'linear-gradient(135deg, #BFDBFE 0%, #1D4ED8 42%, #EFF6FF 54%, #1E3A8A 100%)',
    fill: 'url(#fill-reflecta-azul)',
    vidrioCompatId: 'claro6',
  },
  // 2. Vidrio Templado
  {
    id: 'temp-claro',
    categoria: 'templado',
    nombre: 'Claro Templado',
    descripcion: 'Cristal de seguridad templado 4× más resistente para canceles y puertas.',
    espesoresMm: [6, 9.5, 12],
    defaultEspesorMm: 9.5,
    precioBaseM2: 1450,
    espesorPreciosM2: { 6: 1120, 9.5: 1450, 12: 1850 },
    swatch: 'linear-gradient(135deg, #F0F9FF 0%, #BAE6FD 50%, #38BDF8 100%)',
    fill: '#BAE6FD',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'temp-filtrasol',
    categoria: 'templado',
    nombre: 'Filtrasol Templado',
    descripcion: 'Cristal de seguridad templado con tinte humo solar.',
    espesoresMm: [6, 9.5],
    defaultEspesorMm: 9.5,
    precioBaseM2: 1680,
    espesorPreciosM2: { 6: 1340, 9.5: 1680 },
    swatch: 'linear-gradient(135deg, #64748B 0%, #334155 60%, #1E293B 100%)',
    fill: '#64748B',
    vidrioCompatId: 'filtrasol6',
  },
  {
    id: 'temp-tintex',
    categoria: 'templado',
    nombre: 'Tintex Templado',
    descripcion: 'Cristal templado verde para fachadas, barandales y puertas comerciales.',
    espesoresMm: [6, 9.5],
    defaultEspesorMm: 9.5,
    precioBaseM2: 1720,
    espesorPreciosM2: { 6: 1380, 9.5: 1720 },
    swatch: 'linear-gradient(135deg, #6EE7B7 0%, #10B981 55%, #047857 100%)',
    fill: '#6EE7B7',
    vidrioCompatId: 'tintex6',
  },
  {
    id: 'temp-esmerilado',
    categoria: 'templado',
    nombre: 'Esmerilado / Sandblast Templado',
    descripcion: 'Acabado satinado translúcido para privacidad total en baños y oficinas.',
    espesoresMm: [6, 9.5],
    defaultEspesorMm: 9.5,
    precioBaseM2: 1890,
    espesorPreciosM2: { 6: 1520, 9.5: 1890 },
    swatch: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #CBD5E1 100%)',
    fill: 'url(#fill-esmerilado)',
    vidrioCompatId: 'claro6',
  },
  // 3. Espejos
  {
    id: 'esp-plata',
    categoria: 'espejo',
    nombre: 'Espejo Plata',
    descripcion: 'Espejo cristalino de reflejo nítido tradicional sin distorsión.',
    espesoresMm: [3, 4, 6],
    defaultEspesorMm: 4,
    precioBaseM2: 680,
    espesorPreciosM2: { 3: 540, 4: 680, 6: 920 },
    swatch: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 36%, #FFFFFF 52%, #CBD5E1 68%, #64748B 100%)',
    fill: 'url(#fill-espejo-plata)',
    vidrioCompatId: 'claro4',
  },
  {
    id: 'esp-bronce',
    categoria: 'espejo',
    nombre: 'Espejo Bronce / Ámbar',
    descripcion: 'Espejo decorativo tono cálido bronce ideal para vestidores y puertas.',
    espesoresMm: [4, 6],
    defaultEspesorMm: 4,
    precioBaseM2: 820,
    espesorPreciosM2: { 4: 820, 6: 1090 },
    swatch: 'linear-gradient(135deg, #FDE68A 0%, #B45309 38%, #FFFBEB 52%, #D97706 72%, #78350F 100%)',
    fill: 'url(#fill-espejo-bronce)',
    vidrioCompatId: 'filtrasol6',
  },
  {
    id: 'esp-gris',
    categoria: 'espejo',
    nombre: 'Espejo Gris / Ahumado',
    descripcion: 'Espejo elegante tono humo moderno para interiores contemporáneos.',
    espesoresMm: [4, 6],
    defaultEspesorMm: 4,
    precioBaseM2: 840,
    espesorPreciosM2: { 4: 840, 6: 1120 },
    swatch: 'linear-gradient(135deg, #94A3B8 0%, #334155 38%, #E2E8F0 52%, #475569 72%, #0F172A 100%)',
    fill: 'url(#fill-espejo-gris)',
    vidrioCompatId: 'filtrasol6',
  },
  // 4. Plástico / Acrílico para Cancel de Baño
  {
    id: 'plas-gota',
    categoria: 'plastico',
    nombre: 'Acrílico Gota de Agua / Llovizna',
    descripcion: 'Lámina acrílica con textura vertical direccional para cancel de baño (no rotar).',
    espesoresMm: [2.5, 3],
    defaultEspesorMm: 3,
    precioBaseM2: 620,
    espesorPreciosM2: { 2.5: 540, 3: 620 },
    esDireccional: true,
    swatch: 'repeating-linear-gradient(90deg, #E0F2FE 0px, #E0F2FE 4px, #BAE6FD 5px, #7DD3FC 8px)',
    fill: 'url(#fill-acrilico-textura)',
    vidrioCompatId: 'claro4',
  },
  {
    id: 'plas-burbuja',
    categoria: 'plastico',
    nombre: 'Acrílico Burbuja / Cristal',
    descripcion: 'Lámina acrílica translúcida burbuja liviana e inastillable para baño.',
    espesoresMm: [2.5, 3],
    defaultEspesorMm: 3,
    precioBaseM2: 620,
    espesorPreciosM2: { 2.5: 540, 3: 620 },
    esDireccional: true,
    swatch: 'radial-gradient(circle at 30% 30%, #FFFFFF 12%, #E0F2FE 35%, #93C5FD 100%)',
    fill: 'url(#fill-acrilico-textura)',
    vidrioCompatId: 'claro4',
  },
  {
    id: 'plas-poliestireno',
    categoria: 'plastico',
    nombre: 'Poliestireno Grabado para Baño',
    descripcion: 'Lámina económica grabada para cancel de baño estándar (textura direccional).',
    espesoresMm: [2.5, 3],
    defaultEspesorMm: 2.5,
    precioBaseM2: 460,
    espesorPreciosM2: { 2.5: 460, 3: 530 },
    esDireccional: true,
    swatch: 'repeating-linear-gradient(135deg, #F1F5F9 0px, #E2E8F0 4px, #CBD5E1 8px)',
    fill: 'url(#fill-acrilico-textura)',
    vidrioCompatId: 'claro4',
  },
  {
    id: 'plas-policarbonato',
    categoria: 'plastico',
    nombre: 'Policarbonato Celular',
    descripcion: 'Lámina acanalada de alta resistencia al impacto para domos, puertas y canceles.',
    espesoresMm: [4, 6],
    defaultEspesorMm: 6,
    precioBaseM2: 540,
    espesorPreciosM2: { 4: 460, 6: 540 },
    esDireccional: true,
    swatch: 'repeating-linear-gradient(90deg, #F8FAFC 0px, #CBD5E1 2px, #E2E8F0 6px)',
    fill: 'url(#fill-policarbonato)',
    vidrioCompatId: 'claro6',
  },
  // 5. Duela de Aluminio
  {
    id: 'duela-doble',
    categoria: 'duela',
    nombre: 'Duela Doble Vista',
    descripcion: 'Duela de aluminio reforzada doble cara para puertas ciegas o tableros.',
    espesoresMm: [12.7],
    defaultEspesorMm: 12.7,
    precioBaseM2: 1280,
    espesorPreciosM2: { 12.7: 1280 },
    esDireccional: true,
    swatch: 'repeating-linear-gradient(180deg, #94A3B8 0px, #CBD5E1 5px, #475569 7px)',
    fill: 'url(#fill-duela-aluminio)',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'duela-sencilla',
    categoria: 'duela',
    nombre: 'Duela Sencilla',
    descripcion: 'Duela de aluminio ligera para zoclos, faldas de puerta o celosías cerradas.',
    espesoresMm: [12.7],
    defaultEspesorMm: 12.7,
    precioBaseM2: 980,
    espesorPreciosM2: { 12.7: 980 },
    esDireccional: true,
    swatch: 'repeating-linear-gradient(180deg, #CBD5E1 0px, #E2E8F0 5px, #64748B 7px)',
    fill: 'url(#fill-duela-aluminio)',
    vidrioCompatId: 'claro6',
  },
];

export function esMaterialDireccional(tipoNombre: string): boolean {
  const clean = String(tipoNombre || '').toLowerCase();
  return /acr[ií]lico|poliestireno|policarbonato|gota de agua|llovizna|burbuja|duela|grabado/i.test(clean);
}

export function getDefaultRellenoFromVidrio(vidrio: VidrioId = 'claro6'): PanelRellenoSelection {
  if (vidrio === 'claro4') {
    return { categoria: 'flotado', materialId: 'flot-claro', espesorMm: 4 };
  }
  if (vidrio === 'filtrasol6') {
    return { categoria: 'flotado', materialId: 'flot-filtrasol', espesorMm: 6 };
  }
  if (vidrio === 'tintex6') {
    return { categoria: 'flotado', materialId: 'flot-tintex', espesorMm: 6 };
  }
  return { categoria: 'flotado', materialId: 'flot-claro', espesorMm: 6 };
}

export function getRellenoItem(
  materialId?: string,
  vidrioFallback: VidrioId = 'claro6'
): PanelRellenoItem {
  if (materialId) {
    const found = PANEL_RELLENO_CATALOGO.find((i) => i.id === materialId);
    if (found) return found;
  }
  const def = getDefaultRellenoFromVidrio(vidrioFallback);
  return PANEL_RELLENO_CATALOGO.find((i) => i.id === def.materialId) || PANEL_RELLENO_CATALOGO[0];
}

export function getRellenoPriceKey(materialId: string, espesorMm: number): string {
  return `${materialId}__${espesorMm}`;
}

export function getRellenoPrecioM2(
  sel?: PanelRellenoSelection,
  customPrices?: Record<string, number>,
  vidrioFallback: VidrioId = 'claro6'
): number {
  const effectiveSel = sel || getDefaultRellenoFromVidrio(vidrioFallback);
  const item = getRellenoItem(effectiveSel.materialId, vidrioFallback);
  const esp = effectiveSel.espesorMm || item.defaultEspesorMm;
  const key = getRellenoPriceKey(item.id, esp);
  if (customPrices && typeof customPrices[key] === 'number' && Number.isFinite(customPrices[key]) && customPrices[key] >= 0) {
    return round2(customPrices[key]);
  }
  if (item.espesorPreciosM2 && typeof item.espesorPreciosM2[esp] === 'number') {
    return item.espesorPreciosM2[esp];
  }
  return item.precioBaseM2;
}

export function getRellenoLabel(
  sel?: PanelRellenoSelection,
  vidrioFallback: VidrioId = 'claro6'
): string {
  if (!sel) {
    return VIDRIOS_CONFIG[vidrioFallback]?.nombre || 'Claro 6 mm';
  }
  const item = getRellenoItem(sel.materialId, vidrioFallback);
  const esp = sel.espesorMm || item.defaultEspesorMm;
  return `${item.nombre} ${esp} mm`;
}

export const CATALOGO_MARCAS_MEXICO = [
  'Alumer',
  'Perfileto',
  'Cuprum',
  'Indalum',
  'Herralum',
  'Eurovent',
  'Almexa',
  'Extrusiones Metálicas',
] as const;

export interface PerfilCatalogoItem {
  id: PerfilCatalogoId;
  familia: PerfilFamilia;
  nombre: string;
  codigoRef: string;
  uso: string;
  dimensiones: string;
  pesoAprox: string;
  notasTaller: string;
  marcaCatalogo?: string;
  sistemaCatalogo?: string;
}

export const CATALOGO_PERFILES: PerfilCatalogoItem[] = [
  // ================= LÍNEA CORREDIZA 3" (ALUMER) =================
  {
    id: 'cabezal',
    familia: 'corrediza3',
    nombre: 'Cabezal (7836)',
    codigoRef: 'Alumer 7836 · Corrediza 3"',
    uso: 'Marco superior doble vía para ventanas corredizas 3"',
    dimensiones: '76.20 × 44.45 mm · Tramo 6.10 m',
    pesoAprox: '1.15 kg/m',
    notasTaller: 'Descuento típico entre jambas: 6.4 cm en 3" y 5.1 cm en 2".',
  },
  {
    id: 'riel',
    familia: 'corrediza3',
    nombre: 'Riel (7857)',
    codigoRef: 'Alumer 7857 · Corrediza 3"',
    uso: 'Marco inferior doble vía donde deslizan las carretillas',
    dimensiones: '76.20 × 36.00 mm · Tramo 6.10 m',
    pesoAprox: '1.18 kg/m',
    notasTaller: 'Perforar desagües en el canal exterior antes de armar.',
  },
  {
    id: 'jamba',
    familia: 'corrediza3',
    nombre: 'Jamba (7825)',
    codigoRef: 'Alumer 7825 · Corrediza 3"',
    uso: 'Marcos laterales verticales de ventanas corredizas',
    dimensiones: '76.20 × 25.40 mm · Tramo 6.10 m',
    pesoAprox: '0.96 kg/m',
    notasTaller: 'Se corta a la altura total en sistemas nacionales a 90°.',
  },
  {
    id: 'cerco',
    familia: 'corrediza3',
    nombre: 'Cerco (7847)',
    codigoRef: 'Alumer 7847 · Corrediza 3"',
    uso: 'Perfil vertical exterior de hoja donde se aloja jaladera o chapa',
    dimensiones: '44.00 × 28.50 mm · Tramo 6.10 m',
    pesoAprox: '0.88 kg/m',
    notasTaller: 'Troquelar o barrenar caja de jaladera a 95–105 cm del piso.',
  },
  {
    id: 'traslape',
    familia: 'corrediza3',
    nombre: 'Traslape (7848)',
    codigoRef: 'Alumer 7848 · Corrediza 3"',
    uso: 'Perfil vertical central donde empalman hoja fija y corrediza',
    dimensiones: '44.00 × 28.50 mm · Tramo 6.10 m',
    pesoAprox: '0.85 kg/m',
    notasTaller: 'Colocar felpa guardapolvo en la vena de empalme.',
  },
  {
    id: 'cabecero',
    familia: 'corrediza3',
    nombre: 'Zoclo / Cabecero (7835)',
    codigoRef: 'Alumer 7835 · Corrediza 3"',
    uso: 'Horizontales superior (cabecero) e inferior de hoja corrediza',
    dimensiones: '48.00 × 28.50 mm · Tramo 6.10 m',
    pesoAprox: '0.82 kg/m',
    notasTaller: 'Se ajusta con pija #10 × 1 1/2" directo a cercos y traslapes.',
  },
  {
    id: 'zoclo2v',
    familia: 'corrediza3',
    nombre: 'Zoclo 2 Venas (7842)',
    codigoRef: 'Alumer 7842 · Corrediza 3"',
    uso: 'Zoclo inferior reforzado de 2 venas para hojas grandes o puerta',
    dimensiones: '76.20 × 31.75 mm · Tramo 6.10 m',
    pesoAprox: '1.32 kg/m',
    notasTaller: 'Doble vena para fijación reforzada en ventanales de piso a techo.',
  },
  {
    id: 'alumer_9382',
    familia: 'corrediza3',
    nombre: 'Intermedio (9382)',
    codigoRef: 'Alumer 9382 · Corrediza 3"',
    uso: 'Divisor horizontal intermedio para hojas divididas en 3"',
    dimensiones: '44.45 × 28.50 mm · Tramo 6.10 m',
    pesoAprox: '0.86 kg/m',
    notasTaller: 'Permite dividir vidrios altos para mayor rigidez estructural.',
  },
  {
    id: 'alumer_9382c',
    familia: 'corrediza3',
    nombre: 'Intermedio Corto (9382 C)',
    codigoRef: 'Alumer 9382 C · Corrediza 3"',
    uso: 'Intermedio compacto de vista esbelta para retícula en hojas',
    dimensiones: '31.75 × 28.50 mm · Tramo 6.10 m',
    pesoAprox: '0.72 kg/m',
    notasTaller: 'Recomendado cuando se busca menor obstrucción visual de luz.',
  },
  {
    id: 'alumer_7828',
    familia: 'corrediza3',
    nombre: 'Riel Adicional (7828)',
    codigoRef: 'Alumer 7828 · Corrediza 3"',
    uso: 'Tercer carril / extensión para ventanas de 3 vías o mosquitero',
    dimensiones: '38.10 × 36.00 mm · Tramo 6.10 m',
    pesoAprox: '0.68 kg/m',
    notasTaller: 'Se acopla al cabezal/riel principal cuando se requiere una vía extra.',
  },
  {
    id: 'zoclo1v',
    familia: 'corrediza3',
    nombre: 'Zoclo 1 Vena (7835-1V)',
    codigoRef: '7835-1V / Peinazo',
    uso: 'Zoclo inferior o intermedio ligero para puertas y ventanales',
    dimensiones: '60.00 × 28.50 mm · Tramo 6.10 m',
    pesoAprox: '1.05 kg/m',
    notasTaller: 'Ideal como peinazo intermedio en puertas con vidrio dividido.',
  },
  {
    id: 'chambrana',
    familia: 'corrediza3',
    nombre: 'Chambrana / Junquillo (CH-19)',
    codigoRef: 'CH-19 / Acristalamiento',
    uso: 'Remate perimetral o junquillo para sujeción de cristal y panel',
    dimensiones: '22.00 × 16.00 mm · Tramo 6.10 m',
    pesoAprox: '0.42 kg/m',
    notasTaller: 'Cortes a 45° en esquinas visibles para acabado limpio.',
  },
  {
    id: 'batiente',
    familia: 'corrediza3',
    nombre: 'Batiente / Tope Puerta (BAT-76)',
    codigoRef: 'BAT-76 / Tope',
    uso: 'Perfil con tope y canal para felpa/empaque en marcos de puerta',
    dimensiones: '76.20 × 32.00 mm · Tramo 6.10 m',
    pesoAprox: '1.12 kg/m',
    notasTaller: 'Sella el perímetro de la hoja abatible contra corriente y polvo.',
  },

  // ================= LÍNEA FIJO 3" (ALUMER) =================
  {
    id: 'alumer_9135',
    familia: 'fijo3',
    nombre: 'Bolsa (9135)',
    codigoRef: 'Alumer 9135 · Fijo 3"',
    uso: 'Marco perimetral principal con bolsa para fijo 3"',
    dimensiones: '76.20 × 44.45 mm · Tramo 6.10 m',
    pesoAprox: '1.22 kg/m',
    notasTaller: 'Perfil base del sistema Fijo 3" para acristalamiento con junquillo 9112.',
  },
  {
    id: 'alumer_9112',
    familia: 'fijo3',
    nombre: 'Junquillo (9112)',
    codigoRef: 'Alumer 9112 · Fijo 3"',
    uso: 'Junquillo clip de cierre para sujeción del cristal en Fijo 3"',
    dimensiones: '32.11 × 19.05 mm · Tramo 6.10 m',
    pesoAprox: '0.48 kg/m',
    notasTaller: 'Se corta a 90° o 45° y presiona el vinil sobre el vidrio.',
  },
  {
    id: 'alumer_9136',
    familia: 'fijo3',
    nombre: 'Escalonado (9136)',
    codigoRef: 'Alumer 9136 · Fijo 3"',
    uso: 'Marco escalonado perimetral para canceles fijos 3"',
    dimensiones: '76.20 × 44.45 mm · Tramo 6.10 m',
    pesoAprox: '1.24 kg/m',
    notasTaller: 'Permite desahogo arquitectónico escalonado hacia el exterior.',
  },
  {
    id: 'alumer_10235',
    familia: 'fijo3',
    nombre: 'Bolsa Corta (10235)',
    codigoRef: 'Alumer 10235 · Fijo 3"',
    uso: 'Marco perimetral o intermedio compacto de bolsa corta',
    dimensiones: '76.20 × 31.75 mm · Tramo 6.10 m',
    pesoAprox: '1.08 kg/m',
    notasTaller: 'Ideal para fijos económicos y modulaciones de fachada.',
  },
  {
    id: 'alumer_10237',
    familia: 'fijo3',
    nombre: 'Tapa Chambrana (10237)',
    codigoRef: 'Alumer 10237 · Fijo 3"',
    uso: 'Tapa moldurada tipo chambrana para cerrar canal de bolsa',
    dimensiones: '72.97 × 10.39 mm · Tramo 6.10 m',
    pesoAprox: '0.52 kg/m',
    notasTaller: 'Cubre tornillería de fijación dejando vista biselada.',
  },
  {
    id: 'alumer_7316',
    familia: 'fijo3',
    nombre: 'Tapa Lisa (7316)',
    codigoRef: 'Alumer 7316 · Fijo 3"',
    uso: 'Tapa lisa de remate plano para perfiles de bolsa en Fijo 3"',
    dimensiones: '72.82 × 7.29 mm · Tramo 6.10 m',
    pesoAprox: '0.44 kg/m',
    notasTaller: 'Acabado totalmente plano y minimalista en caras visibles.',
  },
  {
    id: 'alumer_9114',
    familia: 'fijo3',
    nombre: 'Bolsa Lisa (9114)',
    codigoRef: 'Alumer 9114 · Fijo 3"',
    uso: 'Manguete o marco liso con bolsa para divisiones múltiples',
    dimensiones: '76.20 × 44.45 mm · Tramo 6.10 m',
    pesoAprox: '1.20 kg/m',
    notasTaller: 'Se combina con tapa bolsa 7315 en ventanales modulares.',
  },
  {
    id: 'alumer_7315',
    familia: 'fijo3',
    nombre: 'Tapa Bolsa (7315)',
    codigoRef: 'Alumer 7315 · Fijo 3"',
    uso: 'Tapa profunda de acoplamiento a presión para bolsa lisa',
    dimensiones: '72.82 × 21.41 mm · Tramo 6.10 m',
    pesoAprox: '0.58 kg/m',
    notasTaller: 'Asegura cierre hermético en postes verticales.',
  },
  {
    id: 'alumer_9115',
    familia: 'fijo3',
    nombre: 'Esquinero (9115)',
    codigoRef: 'Alumer 9115 · Fijo 3"',
    uso: 'Poste tubular cuadrado esquinero para uniones a 90°',
    dimensiones: '76.20 × 76.20 mm · Tramo 6.10 m',
    pesoAprox: '1.85 kg/m',
    notasTaller: 'Conecta fijos en L o esquinas estructurales de fachada.',
  },

  // ================= PUERTA BATIENTE (ALUMER) =================
  {
    id: 'alumer_9207',
    familia: 'batiente',
    nombre: 'Cabezal PP (9207)',
    codigoRef: 'Alumer 9207 · Puerta Batiente',
    uso: 'Cabezal horizontal superior de hoja en puerta batiente PP',
    dimensiones: '42.42 × 51.82 mm · Tramo 6.10 m',
    pesoAprox: '1.12 kg/m',
    notasTaller: 'Compatible con cerco curvo 9204 y junquillo PP 6370.',
  },
  {
    id: 'alumer_9204',
    familia: 'batiente',
    nombre: 'Cerco Curvo (9204)',
    codigoRef: 'Alumer 9204 · Puerta Batiente',
    uso: 'Larguero vertical curvo de hoja para cerradura y bisagras',
    dimensiones: '43.99 × 53.18 mm · Tramo 6.10 m',
    pesoAprox: '1.26 kg/m',
    notasTaller: 'Permite alojar cerraduras de barra o manija residencial.',
  },
  {
    id: 'alumer_5844',
    familia: 'batiente',
    nombre: 'Batiente Lujo PP (5844)',
    codigoRef: 'Alumer 5844 · Puerta Batiente',
    uso: 'Perfil marco batiente de lujo con tope para puerta abatible',
    dimensiones: '50.80 × 20.70 mm · Tramo 6.10 m',
    pesoAprox: '0.94 kg/m',
    notasTaller: 'Recibe felpa o empaque amortiguador en el cierre.',
  },
  {
    id: 'alumer_5060',
    familia: 'batiente',
    nombre: 'Batiente Superior Mini (5060)',
    codigoRef: 'Alumer 5060 · Puerta Batiente',
    uso: 'Batiente compacto para remates superiores y marcos ligeros',
    dimensiones: '50.80 × 31.75 mm · Tramo 6.10 m',
    pesoAprox: '0.88 kg/m',
    notasTaller: 'Útil cuando el vano tiene poca holgura superior.',
  },
  {
    id: 'alumer_9183',
    familia: 'batiente',
    nombre: 'Intermedio (9183)',
    codigoRef: 'Alumer 9183 · Puerta Batiente',
    uso: 'Peinazo o travesaño intermedio estructural de puerta PP',
    dimensiones: '42.42 × 42.42 mm · Tramo 6.10 m',
    pesoAprox: '1.05 kg/m',
    notasTaller: 'Divide vidrio superior y duela/panel inferior.',
  },
  {
    id: 'alumer_9187',
    familia: 'batiente',
    nombre: 'Zoclo PP (9187)',
    codigoRef: 'Alumer 9187 · Puerta Batiente',
    uso: 'Zoclo inferior reforzado de gran peralte para puerta batiente',
    dimensiones: '42.42 × 78.99 mm · Tramo 6.10 m',
    pesoAprox: '1.54 kg/m',
    notasTaller: 'Protege la base de la puerta contra golpes y humedad.',
  },
  {
    id: 'alumer_8550',
    familia: 'batiente',
    nombre: 'Batiente 2 Venas (8550)',
    codigoRef: 'Alumer 8550 · Puerta Batiente',
    uso: 'Marco batiente con doble vena de rigidez para puertas pesadas',
    dimensiones: '42.39 × 25.41 mm · Tramo 6.10 m',
    pesoAprox: '0.98 kg/m',
    notasTaller: 'Fijación directa a muro o premarco con taquete.',
  },
  {
    id: 'alumer_6370',
    familia: 'batiente',
    nombre: 'Junquillo PP (6370)',
    codigoRef: 'Alumer 6370 · Puerta Batiente',
    uso: 'Junquillo interior de acristalamiento para puerta PP',
    dimensiones: '14.07 × 17.07 mm · Tramo 6.10 m',
    pesoAprox: '0.28 kg/m',
    notasTaller: 'Sujeta cristal de 6 mm o duela con empaque de cuña.',
  },
  {
    id: 'alumer_9184',
    familia: 'batiente',
    nombre: 'Remate PP (9184)',
    codigoRef: 'Alumer 9184 · Puerta Batiente',
    uso: 'Perfil de remate cuadrado para encuentros y marcos PP',
    dimensiones: '42.87 × 42.87 mm · Tramo 6.10 m',
    pesoAprox: '1.02 kg/m',
    notasTaller: 'Sirve como poste de encuentro en puertas dobles abatibles.',
  },
  {
    id: 'alumer_12756',
    familia: 'batiente',
    nombre: 'Batiente Eurovent (12756)',
    codigoRef: 'Alumer 12756 · Puerta Batiente',
    uso: 'Batiente reforzado serie Eurovent con canal europeo',
    dimensiones: '56.54 × 25.40 mm · Tramo 6.10 m',
    pesoAprox: '1.16 kg/m',
    notasTaller: 'Admite bisagra europea y doble felpa perimetral.',
  },
  {
    id: 'alumer_11032',
    familia: 'batiente',
    nombre: 'Ángulo Batiente (11032)',
    codigoRef: 'Alumer 11032 · Puerta Batiente',
    uso: 'Ángulo tope auxiliar para cierre y sellado de batiente',
    dimensiones: '19.05 × 12.70 mm · Tramo 6.10 m',
    pesoAprox: '0.32 kg/m',
    notasTaller: 'Se fija con remache o pija avellanada en el marco.',
  },

  // ================= CANCEL PARA BAÑO (ALUMER) =================
  {
    id: 'alumer_11174',
    familia: 'cancel',
    nombre: 'Riel Superior Económico (11174)',
    codigoRef: 'Alumer 11174 · Cancel Baño',
    uso: 'Riel colgante superior donde ruedan las carretillas de baño',
    dimensiones: '42.09 × 50.80 mm · Tramo 6.10 m',
    pesoAprox: '0.96 kg/m',
    notasTaller: 'Soporta hojas corredizas de acrílico o cristal templado 6 mm.',
  },
  {
    id: 'alumer_11386',
    familia: 'cancel',
    nombre: 'Jamba Lateral (11386)',
    codigoRef: 'Alumer 11386 · Cancel Baño',
    uso: 'Jamba vertical fijada a muro con silicón antihongos',
    dimensiones: '37.47 × 19.05 mm · Tramo 6.10 m',
    pesoAprox: '0.54 kg/m',
    notasTaller: 'Recibe el cierre lateral de las hojas del cancel de regadera.',
  },
  {
    id: 'alumer_11387',
    familia: 'cancel',
    nombre: 'Guía Inferior (11387)',
    codigoRef: 'Alumer 11387 · Cancel Baño',
    uso: 'Guía inferior con drenaje para deslizamiento de cancel de baño',
    dimensiones: '35.43 × 19.05 mm · Tramo 6.10 m',
    pesoAprox: '0.49 kg/m',
    notasTaller: 'Sellar con silicón sanitario transparente en la base del sardinel.',
  },
  {
    id: 'alumer_11035',
    familia: 'cancel',
    nombre: 'Marco Económico (11035)',
    codigoRef: 'Alumer 11035 · Cancel Baño',
    uso: 'Bastidor ligero económico para hojas de cancel con acrílico',
    dimensiones: '14.28 × 30.99 mm · Tramo 6.10 m',
    pesoAprox: '0.41 kg/m',
    notasTaller: 'Ideal para hojas estándar de acrílico de 3 a 4 mm.',
  },
  {
    id: 'alumer_11046',
    familia: 'cancel',
    nombre: 'Marco Semilujo (11046)',
    codigoRef: 'Alumer 11046 · Cancel Baño',
    uso: 'Bastidor semilujo de mayor rigidez para cancel corredizo',
    dimensiones: '14.29 × 44.45 mm · Tramo 6.10 m',
    pesoAprox: '0.56 kg/m',
    notasTaller: 'Recomendado para claros anchos o vidrio templado 6 mm.',
  },
  {
    id: 'alumer_11173',
    familia: 'cancel',
    nombre: 'Marco Lujo (11173)',
    codigoRef: 'Alumer 11173 · Cancel Baño',
    uso: 'Bastidor serie Lujo robusto de 2 pulgadas para cancel de baño',
    dimensiones: '15.87 × 50.80 mm · Tramo 6.10 m',
    pesoAprox: '0.68 kg/m',
    notasTaller: 'Estética premium con mayor agarre en escuadras.',
  },

  // ================= LÍNEA NACIONAL 2" (CLAVES OFICIALES) =================
  {
    id: 'nac2_cabezal_2401',
    familia: 'nacional2',
    nombre: 'Cabezal / Jamba Nacional 2" (67518 / 7518)',
    codigoRef: 'Panorama-Cuprum 67518 · Perfiletto 67518/7518 · Indalum 2086',
    uso: 'Marco superior y jambas laterales para ventana corrediza nacional 2"',
    dimensiones: '50.80 × 38.10 mm · Tramo 6.10 m',
    pesoAprox: '0.78 kg/m',
    notasTaller: 'Claves oficiales 2026: Cuprum/Perfiletto 67518, Ext. Met. 7518, Indalum 2086.',
    marcaCatalogo: 'Panorama / Cuprum / Perfiletto / Indalum / Extrusiones Metálicas',
    sistemaCatalogo: 'Línea Nacional 2"',
  },
  {
    id: 'nac2_riel_2402',
    familia: 'nacional2',
    nombre: 'Riel Doble Nacional 2" (14286 / 69953 / 9953)',
    codigoRef: 'Panorama-Cuprum 14286 · Perfiletto 69953/9953 · Indalum 2094',
    uso: 'Riel inferior doble vía para carretillas simples de 2" (Herralum 2008)',
    dimensiones: '50.80 × 28.50 mm · Tramo 6.10 m',
    pesoAprox: '0.81 kg/m',
    notasTaller: 'Hacer drenes en el canal externo y calzar a nivel sobre pretil.',
    marcaCatalogo: 'Panorama / Cuprum / Perfiletto / Indalum / Extrusiones Metálicas',
    sistemaCatalogo: 'Línea Nacional 2"',
  },
  {
    id: 'nac2_jamba_2403',
    familia: 'nacional2',
    nombre: 'Bolsa / Escalonado Fijo 2" (69083 / 39084)',
    codigoRef: 'Panorama-Cuprum 69083/39084 · Perfiletto 69083/9083 · Indalum 2050',
    uso: 'Marco perimetral bolsa y escalonado de 2 pulgadas para fijo comercial',
    dimensiones: '50.80 × 22.20 mm · Tramo 6.10 m',
    pesoAprox: '0.68 kg/m',
    notasTaller: 'Compatible con junquillo oficial 9088 / 39088 y tapas 69085 / 24051.',
    marcaCatalogo: 'Panorama / Cuprum / Perfiletto / Indalum / Extrusiones Metálicas',
    sistemaCatalogo: 'Línea Nacional 2"',
  },
  {
    id: 'nac2_cerco_2404',
    familia: 'nacional2',
    nombre: 'Cerco y Traslape Nacional 2" (8320 / 67821 / 39954)',
    codigoRef: 'Panorama-Cuprum 8320/67821/39954 · Perfiletto 69954/69955 · Indalum 2098/2097',
    uso: 'Verticales de hoja corrediza de 2" para cristal 4–6 mm',
    dimensiones: '34.90 × 22.20 mm · Tramo 6.10 m',
    pesoAprox: '0.62 kg/m',
    notasTaller: 'Compatible con vinil Herralum 185/187 y cierre embutido 1280200.',
    marcaCatalogo: 'Panorama / Cuprum / Perfiletto / Indalum / Extrusiones Metálicas',
    sistemaCatalogo: 'Línea Nacional 2"',
  },

  // ================= SERIE 1400 (PANORAMA / CUPRUM OFICIAL) =================
  {
    id: 's1400_marco_1401',
    familia: 'serie1400',
    nombre: 'Cerco Liso / Pilastra Serie 1400 (73971 / 73972)',
    codigoRef: 'Panorama-Cuprum Serie 1400 · 73971 Cerco Liso / 73972 Pilastra',
    uso: 'Marco estructural perimetral y pilastra para fijos y canceles Serie 1400',
    dimensiones: '44.45 × 38.10 mm · Tramo 6.10 m',
    pesoAprox: '0.94 kg/m',
    notasTaller: 'Armado oficial con escuadra marco Herralum 204801400.',
    marcaCatalogo: 'Panorama / Cuprum',
    sistemaCatalogo: 'Serie 1400',
  },
  {
    id: 's1400_hoja_1402',
    familia: 'serie1400',
    nombre: 'Hoja Ventana / Puerta Serie 1400 (73981 / 73983)',
    codigoRef: 'Panorama-Cuprum Serie 1400 · 73981 Ventana / 73983 Puerta / 73974 Monumental',
    uso: 'Bastidor tubular perimetral de hoja abatible o puerta Serie 1400',
    dimensiones: '44.45 × 31.75 mm · Tramo 6.10 m',
    pesoAprox: '0.89 kg/m',
    notasTaller: 'Armado oficial con escuadra hoja Herralum 204901400 y chapa 1096.',
    marcaCatalogo: 'Panorama / Cuprum',
    sistemaCatalogo: 'Serie 1400',
  },
  {
    id: 's1400_junquillo_1405',
    familia: 'serie1400',
    nombre: 'Junquillos Serie 1400 (74073 / 73978 / 74634)',
    codigoRef: 'Panorama-Cuprum Serie 1400 · 74073 Redondo / 73978 Ancho / 74634-74635 Estrecho',
    uso: 'Junquillos clip oficiales Serie 1400 para cristal 6 mm a doble vidrio',
    dimensiones: '19.05 × 15.80 mm · Tramo 6.10 m',
    pesoAprox: '0.31 kg/m',
    notasTaller: 'Ajuste a presión con empaque EPDM Herralum 194 o vinil 185.',
    marcaCatalogo: 'Panorama / Cuprum',
    sistemaCatalogo: 'Serie 1400',
  },

  // ================= LÍNEA ESPAÑOLA / EUROPEA (CLAVES OFICIALES) =================
  {
    id: 'esp_marco_s35',
    familia: 'espanola',
    nombre: 'Marco Canal Europeo S-35 / S-6000 (12606 / 3501 / 6001)',
    codigoRef: 'Perfiletto S-35: 12606 · Ext. Met. S-3500: 3501 · S-6000: 6001',
    uso: 'Marco perimetral canal europeo para abatible y oscilobatiente',
    dimensiones: '45.00 × 52.00 mm · Tramo 6.10 m',
    pesoAprox: '1.28 kg/m',
    notasTaller: 'Ensamble 45° con escuadras Monticelli 1068149079 / Ext. Met. 7004-0.',
    marcaCatalogo: 'Perfiletto / Extrusiones Metálicas / EuroAlum',
    sistemaCatalogo: 'Línea Española / Europea',
  },
  {
    id: 'esp_hoja_s70',
    familia: 'espanola',
    nombre: 'Hoja Corrediza Europea S-70 / EuroAlum 2500 (628408 / 1699 / 4603)',
    codigoRef: 'Perfiletto S-70: 628408 · EuroAlum 2500: 1699 · Ext. Met. S-4600: 4603',
    uso: 'Hoja perimetral corte 45° para ventanales corredizos herméticos',
    dimensiones: '70.00 × 32.00 mm · Tramo 6.10 m',
    pesoAprox: '1.36 kg/m',
    notasTaller: 'Acepta cristal monolítico 6–10 mm o insulado (duovent) con empaque 328-10.',
    marcaCatalogo: 'Perfiletto / Indalum EuroAlum / Extrusiones Metálicas',
    sistemaCatalogo: 'Línea Española / Europea',
  },
  {
    id: 'esp_riel_s80',
    familia: 'espanola',
    nombre: 'Riel Monumental S-80 / S-100 / LE 8500 (638407 / 13614 / 68500)',
    codigoRef: 'Perfiletto S-80: 638407 · S-100: 13614 · Ext. Met. LE 8500: 68500 / S-10000: 10001',
    uso: 'Marco riel reforzado con guía inoxidable para hojas de gran peso',
    dimensiones: '80.00 × 48.00 mm · Tramo 6.10 m',
    pesoAprox: '1.72 kg/m',
    notasTaller: 'Compatible con carretillas tándem 8524-0 / 7155-0 y multipunto 7260.',
    marcaCatalogo: 'Perfiletto / Extrusiones Metálicas',
    sistemaCatalogo: 'Línea Española / Europea',
  },

  // ================= HERRALUM (CATÁLOGO OFICIAL 2026) =================
  {
    id: 'herralum_riel_1500',
    familia: 'herralum',
    nombre: 'Cancel de Baño Herralum 1300 Curvo / 1301 Río Bravo',
    codigoRef: 'Herralum 2026 · 1300 Curvo / 1301 Río Bravo / 1305 Bacalar',
    uso: 'Sistema corredizo con herrajes en acero inoxidable para cristal templado 8–10 mm',
    dimensiones: 'Kit Cancel Templado · Largo estándar 1.80–2.40 m',
    pesoAprox: 'Kit completo',
    notasTaller: 'Compatible con vinil sello baño Herralum 208 y chapas templado 1285/1298.',
    marcaCatalogo: 'Herralum',
    sistemaCatalogo: 'Herralum 2026',
  },
  {
    id: 'herralum_u_templado',
    familia: 'herralum',
    nombre: 'Escuadras Monticelli y Serie 1400 (1068149079 / 204801400)',
    codigoRef: 'Herralum 2026 · Monticelli 1068149079/1068224104 · S1400 204801400/204901400',
    uso: 'Escuadras de alineación y apriete excéntrico para series europeas y Serie 1400',
    dimensiones: 'Aleación aluminio fundido · Unidad: Pieza',
    pesoAprox: 'Pieza',
    notasTaller: 'Asegura unión hermética a 45° sin torsión en marcos y hojas pesadas.',
    marcaCatalogo: 'Herralum',
    sistemaCatalogo: 'Herralum 2026',
  },
  {
    id: 'herralum_marco_templado',
    familia: 'herralum',
    nombre: 'Cancel de Baño Herralum 1306 Cozumel / 1338 Mexicali',
    codigoRef: 'Herralum 2026 · 1306 Cozumel / 1338 Mexicali',
    uso: 'Sistemas corredizos y abatibles para baño en acero inoxidable cepillado o negro mate',
    dimensiones: 'Kit Cancel Templado 8–10 mm',
    pesoAprox: 'Kit completo',
    notasTaller: 'Incluye riel, carretillas, guías de piso, topes y jaladera toallero.',
    marcaCatalogo: 'Herralum',
    sistemaCatalogo: 'Herralum 2026',
  },

  // ================= PERFILETTO (CATÁLOGO OFICIAL MÉXICO 2026) =================
  {
    id: 'perfileto_cabezal_3',
    familia: 'perfileto',
    nombre: 'Perfiletto Cabezal / Jamba 3" (77826 / 67826 / 7826)',
    codigoRef: 'Perfiletto 77826 / 67826 / 7826 · T77826 Tubular · Línea 3"',
    uso: 'Cabezal y jamba doble vía 3" de extrusión oficial marca Perfiletto',
    dimensiones: '76.20 × 44.45 mm · Tramo 6.10 m',
    pesoAprox: '1.16 kg/m',
    notasTaller: 'Compatible 100% con riel Perfiletto 79957/9957 y herrajes Herralum 2004.',
    marcaCatalogo: 'Perfileto / Perfiletto',
    sistemaCatalogo: 'Perfiletto · Línea 3"',
  },
  {
    id: 'perfileto_riel_3',
    familia: 'perfileto',
    nombre: 'Perfiletto Riel Doble 3" (79957 / 9957)',
    codigoRef: 'Perfiletto 79957 / 9957 · Línea 3"',
    uso: 'Riel inferior 3" con vena guía reforzada para carretillas tándem',
    dimensiones: '76.20 × 36.00 mm · Tramo 6.10 m',
    pesoAprox: '1.19 kg/m',
    notasTaller: 'Desagüe en cámara externa; disponible en Natural, Blanco, Negro y Madera.',
    marcaCatalogo: 'Perfileto / Perfiletto',
    sistemaCatalogo: 'Perfiletto · Línea 3"',
  },
  {
    id: 'perfileto_cerco_3',
    familia: 'perfileto',
    nombre: 'Perfiletto Cerco y Traslape 3" (67847 / 77848)',
    codigoRef: 'Perfiletto 67847/7847 Cerco · 77848/67848/7848 Traslape · Línea 3"',
    uso: 'Perfiles verticales de hoja corrediza 3" catálogo oficial Perfiletto',
    dimensiones: '44.00 × 28.50 mm · Tramo 6.10 m',
    pesoAprox: '0.87 kg/m',
    notasTaller: 'Alojamiento limpio para cierre embutido Herralum 1280200 o chapa 1131.',
    marcaCatalogo: 'Perfileto / Perfiletto',
    sistemaCatalogo: 'Perfiletto · Línea 3"',
  },
  {
    id: 'perfileto_marco_1400',
    familia: 'perfileto',
    nombre: 'Perfiletto Bolsa Fijo 2" / 3" (69083 / 69135)',
    codigoRef: 'Perfiletto 69083/9083 (2") · 69135/9135 (3") · Junquillos 69088/69112',
    uso: 'Perfiles bolsa y escalonado oficiales Perfiletto para canceles fijos',
    dimensiones: '76.20 × 44.45 mm · Tramo 6.10 m',
    pesoAprox: '1.15 kg/m',
    notasTaller: 'Alta precisión dimensional para ensamble rápido con junquillo 69112.',
    marcaCatalogo: 'Perfileto / Perfiletto',
    sistemaCatalogo: 'Perfiletto · Fijos 2" y 3"',
  },
  {
    id: 'perfileto_euro_70',
    familia: 'perfileto',
    nombre: 'Perfiletto Serie Europea S-70 (628407 / 628408 / 22504)',
    codigoRef: 'Perfiletto S-70 · 628407 Riel / 628408 Hoja / 28411 Traslape / 22547 Junq.',
    uso: 'Sistema corredizo y abatible hermético perimetral a 45° Serie S-70 Perfiletto',
    dimensiones: '70.00 × 32.00 mm · Tramo 6.10 m',
    pesoAprox: '1.35 kg/m',
    notasTaller: 'Admite cierre multipunto y doble vidrio insulado; riel triple 662373.',
    marcaCatalogo: 'Perfileto / Perfiletto',
    sistemaCatalogo: 'Perfiletto · Europea S-70',
  },
  {
    id: 'perfileto_cancel_bano',
    familia: 'perfileto',
    nombre: 'Perfiletto C-Light / U-Light (15309 / 15310 / 9073)',
    codigoRef: 'Perfiletto U-Light 9073/49074 · C-Light 15309/15310/15311/11041',
    uso: 'Sistema ligero residencial U-Light y C-Light catálogo oficial Perfiletto',
    dimensiones: '38.10 × 25.40 mm · Tramo 6.10 m',
    pesoAprox: '0.64 kg/m',
    notasTaller: 'Excelente relación rigidez-peso para ventanería residencial económica.',
    marcaCatalogo: 'Perfileto / Perfiletto',
    sistemaCatalogo: 'Perfiletto · U-Light / C-Light',
  },

  // ================= MOSQUITEROS =================
  {
    id: 'mosq_marco',
    familia: 'mosquitero',
    nombre: 'Perfil Mosquitero 1" (MOSQ-25)',
    codigoRef: 'MOSQ-25 / Canal Cola de Rata',
    uso: 'Bastidor perimetral con canal para vinil redondo (cola de rata) y tela',
    dimensiones: '25.40 × 11.00 mm · Tramo 6.10 m',
    pesoAprox: '0.34 kg/m',
    notasTaller: 'Ensamble con escuadras plásticas o corte 45° según acabado.',
  },
  {
    id: 'riel_mosq',
    familia: 'mosquitero',
    nombre: 'Riel / Guía Mosquitero (RM-18)',
    codigoRef: 'RM-18 / Corredizo',
    uso: 'Riel superior e inferior independiente para mosquitero corredizo',
    dimensiones: '22.00 × 18.00 mm · Tramo 6.10 m',
    pesoAprox: '0.45 kg/m',
    notasTaller: 'Permite deslizamiento suave con carretillas de nylon para mosquitero.',
  },
];

// ==================== INVENTARIO DE HERRAJES, FELPAS Y TORNILLERÍA ====================
export type HerrajeCategoria =
  | 'Carretillas'
  | 'Viniles'
  | 'Felpas y Sellos'
  | 'Jaladeras y Chapas'
  | 'Tornillería y Escuadras';

export interface HerrajeInventarioCatalogoItem {
  id: string;
  categoria: HerrajeCategoria;
  nombre: string;
  unidad: string;
  modelo?: string;
  tamano?: string;
  color?: string;
}

export const HERRAJES_INVENTARIO_CATALOGO: HerrajeInventarioCatalogoItem[] = [
  // Carretillas (las 6 requeridas)
  { id: 'carr_simple_2', categoria: 'Carretillas', nombre: 'Carretilla simple 2"', unidad: 'pzas', modelo: 'Simple 2"' },
  { id: 'carr_doble_3', categoria: 'Carretillas', nombre: 'Carretilla doble/tándem 3"', unidad: 'pzas', modelo: 'Tándem 3"' },
  { id: 'carr_europea', categoria: 'Carretillas', nombre: 'Carretilla Europea', unidad: 'pzas', modelo: 'Europea' },
  { id: 'carr_reforzada_3', categoria: 'Carretillas', nombre: 'Carretilla reforzada 3" (uso rudo)', unidad: 'pzas', modelo: 'Reforzada 3"' },
  { id: 'carr_cancel_bano', categoria: 'Carretillas', nombre: 'Carretilla Cancel Baño', unidad: 'pzas', modelo: 'Colgante Baño' },
  { id: 'carr_mosquitero', categoria: 'Carretillas', nombre: 'Carretilla Mosquitero', unidad: 'pzas', modelo: 'Nylon Mosquitero' },

  // Viniles (categoría dedicada con varios modelos y tamaños)
  { id: 'vinil_pata_10', categoria: 'Viniles', nombre: 'Vinil pata / cuña #10 (vidrio 4–5 mm)', unidad: 'm', modelo: 'Cuña / Pata #10', tamano: '4–5 mm', color: 'Negro' },
  { id: 'vinil_acristalar', categoria: 'Viniles', nombre: 'Vinil pata / cuña acristalar #11 (vidrio 6 mm)', unidad: 'm', modelo: 'Cuña / Pata #11', tamano: '6 mm', color: 'Negro' },
  { id: 'vinil_pata_12', categoria: 'Viniles', nombre: 'Vinil pata / cuña #12 (vidrio 6–9 mm)', unidad: 'm', modelo: 'Cuña / Pata #12', tamano: '6–9 mm', color: 'Negro' },
  { id: 'vinil_pata_13', categoria: 'Viniles', nombre: 'Vinil pata / cuña #13 (vidrio 9–10 mm)', unidad: 'm', modelo: 'Cuña / Pata #13', tamano: '9–10 mm', color: 'Negro' },
  { id: 'cola_de_rata', categoria: 'Viniles', nombre: 'Cola de rata estándar (vinil redondo 4.0 mm)', unidad: 'm', modelo: 'Cola de rata', tamano: '4.0 mm', color: 'Negro / Gris' },
  { id: 'cola_rata_45', categoria: 'Viniles', nombre: 'Cola de rata gruesa (vinil redondo 4.5 mm)', unidad: 'm', modelo: 'Cola de rata', tamano: '4.5 mm', color: 'Negro' },
  { id: 'cola_rata_50', categoria: 'Viniles', nombre: 'Cola de rata extra gruesa (vinil redondo 5.0 mm)', unidad: 'm', modelo: 'Cola de rata', tamano: '5.0 mm', color: 'Negro' },
  { id: 'vinil_epdm_eu', categoria: 'Viniles', nombre: 'Vinil / Empaque EPDM perimetral (Línea Europea)', unidad: 'm', modelo: 'EPDM Perimetral', tamano: 'Canal Europeo', color: 'Negro' },
  { id: 'vinil_u_bano', categoria: 'Viniles', nombre: 'Vinil U / H cristal templado 6–10 mm (Cancel Baño)', unidad: 'm', modelo: 'Perfil U / H', tamano: '6–10 mm', color: 'Transparente' },
  { id: 'vinil_t_puerta', categoria: 'Viniles', nombre: 'Vinil T / Burlete sellador para puerta batiente', unidad: 'm', modelo: 'Burlete T', tamano: '12 mm', color: 'Negro / Blanco' },

  // Felpas y Sellos
  { id: 'felpa_guardapolvo', categoria: 'Felpas y Sellos', nombre: 'Felpa guardapolvo estándar (7 × 6 mm)', unidad: 'm', modelo: 'Estándar', tamano: '7×6 mm', color: 'Gris / Negro' },
  { id: 'felpa_alta', categoria: 'Felpas y Sellos', nombre: 'Felpa guardapolvo alta (7 × 9 mm)', unidad: 'm', modelo: 'Alta', tamano: '7×9 mm', color: 'Gris / Negro' },
  { id: 'felpa_fin', categoria: 'Felpas y Sellos', nombre: 'Felpa con aleta central antirruido (7 × 7 mm)', unidad: 'm', modelo: 'Con aleta', tamano: '7×7 mm', color: 'Gris' },

  // Jaladeras y Chapas (más modelos y colores)
  { id: 'jaladera_auto', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera / Seguro automático estándar (Negro)', unidad: 'pzas', modelo: 'Seguro automático', color: 'Negro' },
  { id: 'jaladera_auto_bl', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera / Seguro automático estándar (Blanco)', unidad: 'pzas', modelo: 'Seguro automático', color: 'Blanco' },
  { id: 'jaladera_auto_nat', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera / Seguro automático estándar (Natural / Plata)', unidad: 'pzas', modelo: 'Seguro automático', color: 'Natural' },
  { id: 'jaladera_embutir_neg', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera de embutir / uñero corrediza (Negro)', unidad: 'pzas', modelo: 'Embutir / Uñero', color: 'Negro' },
  { id: 'jaladera_embutir_bl', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera de embutir / uñero corrediza (Blanco)', unidad: 'pzas', modelo: 'Embutir / Uñero', color: 'Blanco' },
  { id: 'jaladera_embutir_nat', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera de embutir / uñero corrediza (Natural)', unidad: 'pzas', modelo: 'Embutir / Uñero', color: 'Natural' },
  { id: 'jaladera_toallero_cr', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera toallero Cancel Baño 45 cm (Cromo)', unidad: 'pzas', modelo: 'Toallero Baño', tamano: '45 cm', color: 'Cromo' },
  { id: 'jaladera_toallero_neg', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera toallero Cancel Baño 45 cm (Negro Mate)', unidad: 'pzas', modelo: 'Toallero Baño', tamano: '45 cm', color: 'Negro Mate' },
  { id: 'jaladera_tubular_inox', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera tubular H puerta 60 cm (Acero Inox)', unidad: 'pzas', modelo: 'Tubular H', tamano: '60 cm', color: 'Acero Inox' },
  { id: 'jaladera_tubular_neg', categoria: 'Jaladeras y Chapas', nombre: 'Jaladera tubular H puerta 60 cm (Negro Mate)', unidad: 'pzas', modelo: 'Tubular H', tamano: '60 cm', color: 'Negro Mate' },
  { id: 'chapa_batiente', categoria: 'Jaladeras y Chapas', nombre: 'Chapa / Cerradura de manija residencial (Negro)', unidad: 'jgos', modelo: 'Manija Residencial', color: 'Negro' },
  { id: 'chapa_batiente_bl', categoria: 'Jaladeras y Chapas', nombre: 'Chapa / Cerradura de manija residencial (Blanco)', unidad: 'jgos', modelo: 'Manija Residencial', color: 'Blanco' },
  { id: 'chapa_batiente_sat', categoria: 'Jaladeras y Chapas', nombre: 'Chapa / Cerradura de manija residencial (Níquel Satinado)', unidad: 'jgos', modelo: 'Manija Residencial', color: 'Níquel Satinado' },
  { id: 'chapa_batiente_bro', categoria: 'Jaladeras y Chapas', nombre: 'Chapa / Cerradura de manija residencial (Bronce)', unidad: 'jgos', modelo: 'Manija Residencial', color: 'Bronce' },
  { id: 'chapa_multipunto_neg', categoria: 'Jaladeras y Chapas', nombre: 'Chapa multipunto Línea Europea (Negro)', unidad: 'jgos', modelo: 'Multipunto Europea', color: 'Negro' },
  { id: 'chapa_multipunto_bl', categoria: 'Jaladeras y Chapas', nombre: 'Chapa multipunto Línea Europea (Blanco)', unidad: 'jgos', modelo: 'Multipunto Europea', color: 'Blanco' },
  { id: 'chapa_multipunto_sat', categoria: 'Jaladeras y Chapas', nombre: 'Chapa multipunto Línea Europea (Plata / Satinado)', unidad: 'jgos', modelo: 'Multipunto Europea', color: 'Plata' },
  { id: 'chapa_gancho_neg', categoria: 'Jaladeras y Chapas', nombre: 'Chapa de gancho / pico de loro corrediza (Negro)', unidad: 'jgos', modelo: 'Pico de loro', color: 'Negro' },
  { id: 'chapa_gancho_bl', categoria: 'Jaladeras y Chapas', nombre: 'Chapa de gancho / pico de loro corrediza (Blanco)', unidad: 'jgos', modelo: 'Pico de loro', color: 'Blanco' },
  { id: 'chapa_gancho_nat', categoria: 'Jaladeras y Chapas', nombre: 'Chapa de gancho / pico de loro corrediza (Natural)', unidad: 'jgos', modelo: 'Pico de loro', color: 'Natural' },
  { id: 'bisagra_reforzada', categoria: 'Jaladeras y Chapas', nombre: 'Bisagra reforzada puerta (Negro / Natural)', unidad: 'pzas', modelo: 'Reforzada puerta', color: 'Negro / Natural' },
  { id: 'bisagra_europea_3d', categoria: 'Jaladeras y Chapas', nombre: 'Bisagra Europea 3D regulable (Negro / Blanco)', unidad: 'pzas', modelo: 'Europea 3D', color: 'Negro / Blanco' },

  // Tornillería y Escuadras (varios modelos en escuadras)
  { id: 'escuadra_45', categoria: 'Tornillería y Escuadras', nombre: 'Escuadra alineación 45° fundida (Línea Europea)', unidad: 'pzas', modelo: 'Alineación 45°' },
  { id: 'escuadra_teton', categoria: 'Tornillería y Escuadras', nombre: 'Escuadra de tetón / botón con resorte (Europea)', unidad: 'pzas', modelo: 'Tetón / Botón' },
  { id: 'escuadra_l_pp', categoria: 'Tornillería y Escuadras', nombre: 'Escuadra en L reforzada para puerta batiente PP', unidad: 'pzas', modelo: 'En L PP' },
  { id: 'escuadra_inyectada', categoria: 'Tornillería y Escuadras', nombre: 'Escuadra inyectada con prisioneros (puerta pesada)', unidad: 'pzas', modelo: 'Inyectada 45°' },
  { id: 'escuadra_mosq_plast', categoria: 'Tornillería y Escuadras', nombre: 'Escuadra plástica esquinera mosquitero 1"', unidad: 'pzas', modelo: 'Mosquitero 1"' },
  { id: 'escuadra_cancel_bano', categoria: 'Tornillería y Escuadras', nombre: 'Escuadra esquinera marco Cancel de Baño', unidad: 'pzas', modelo: 'Cancel Baño' },
  { id: 'escuadra_ang_90', categoria: 'Tornillería y Escuadras', nombre: 'Escuadra ángulo interior 90° (Línea 2" / 3")', unidad: 'pzas', modelo: 'Ángulo 90°' },
  { id: 'pija_10_15', categoria: 'Tornillería y Escuadras', nombre: 'Pija #10 × 1 1/2" armado', unidad: 'pzas', modelo: 'Armado #10' },
  { id: 'pija_8_05', categoria: 'Tornillería y Escuadras', nombre: 'Pija #8 × 1/2" fijación', unidad: 'pzas', modelo: 'Fijación #8' },
];

export interface CortePerfil {
  perfilId: PerfilCatalogoId;
  nombre: string;
  funcion: string;
  pzas: number;
  angulo: '90°' | '45°';
  medidaCm: number;
}

export interface CorteVidrio {
  tipo: 'vidrio' | 'malla' | 'duela';
  nombre: string;
  pzas: number;
  anchoCm: number;
  altoCm: number;
  areaM2: number;
  espesorLabel: string;
  permitirRotacion?: boolean;
}

export interface HerrajeItem {
  nombre: string;
  detalle: string;
  cantidad: number;
  unidad: string;
}

export interface DespieceCalculado {
  perfiles: CortePerfil[];
  vidrios: CorteVidrio[];
  herrajes: HerrajeItem[];
  totalAluminioM: number;
  tramos610: number;
  escuadrasCount: number;
  telaMosquiteraM2: number;
  colaDeRataM: number;
  carretillasMosq: number;
}

export type PuertaRellenoModo = 'vidrio' | 'mixta_duela' | 'ciega_duela';

export interface TrabajoParams {
  linea: LineaId;
  anchoCm: number;
  altoCm: number;
  color: ColorId;
  vidrio: VidrioId;
  relleno?: PanelRellenoSelection;
  hojas: number;
  apertura: AperturaVentanaId;
  sentidoPuerta: 'izq' | 'der';
  puertaIntermedio: boolean;
  puertaEconomica: boolean;
  puertaDobleHoja?: boolean;
  puertaRellenoModo?: PuertaRellenoModo;
  duelaAnchoUtilCm?: number;
  dobleCorrediza?: boolean;
  cancelEstilo?: CancelEstiloId;
  invertido: boolean;
  cantidad: number;
  ajusteDescuentos?: Partial<AjusteDescuentosConfig>;
  tolerancias: {
    marcoH: number;
    hojaV: number;
    hojaH: number;
    vidAncho: number;
    vidAlto: number;
  };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const APP_SHARE_URL = 'https://alumineropro.pages.dev';

function isLocalOrPreviewHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) return true;
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.endsWith('.run.app') ||
    host.includes('aistudio') ||
    host.includes('googleusercontent.com') ||
    host.includes('webcontainer') ||
    host.includes('stackblitz')
  ) {
    return true;
  }
  if (/^alumineropro\d+\.pages\.dev$/i.test(host)) {
    return true;
  }
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) {
    return true;
  }
  return false;
}

export function getOfficialShareUrl(): string {
  if (typeof window === 'undefined' || !window.location) {
    return APP_SHARE_URL;
  }
  try {
    if (window.self !== window.top) {
      return APP_SHARE_URL;
    }
  } catch {
    return APP_SHARE_URL;
  }
  try {
    const { protocol, hostname, origin } = window.location;
    if (!/^https?:$/i.test(protocol) || !origin || origin === 'null') {
      return APP_SHARE_URL;
    }
    if (isLocalOrPreviewHost(hostname)) {
      return APP_SHARE_URL;
    }
    return origin.replace(/\/+$/, '');
  } catch {
    return APP_SHARE_URL;
  }
}

export function isFeatureProRequired(linea: LineaId, apertura: AperturaVentanaId, cantidad = 1): boolean {
  const freeLinea =
    linea === '3' ||
    linea === 'euroalum-2500' ||
    linea === 'euroalum-2800' ||
    linea === 'euroalum-3800';
  if (!freeLinea) return true;
  if (apertura !== 'corrediza') return true;
  if (cantidad > 1) return true;
  return false;
}

export function calcularDespiece(params: TrabajoParams): DespieceCalculado {
  const {
    linea,
    anchoCm,
    altoCm,
    vidrio,
    relleno,
    hojas,
    apertura,
    puertaIntermedio,
    puertaEconomica,
    puertaDobleHoja,
    puertaRellenoModo,
    duelaAnchoUtilCm,
    dobleCorrediza = false,
    cancelEstilo = 'semilujo',
    cantidad,
    ajusteDescuentos,
    tolerancias,
  } = params;

  const adj = resolveAjusteDescuentos(ajusteDescuentos);
  const qty = Math.max(1, Math.round(cantidad || 1));
  const A = Math.max(15, Number(anchoCm) || 120);
  const H = Math.max(15, Number(altoCm) || 100);
  const vidLabel = relleno ? getRellenoLabel(relleno, vidrio) : (VIDRIOS_CONFIG[vidrio]?.nombre || 'Claro 6 mm');
  const permitirRotacionPanel = relleno
    ? !(getRellenoItem(relleno.materialId, vidrio).esDireccional || esMaterialDireccional(vidLabel))
    : !esMaterialDireccional(vidLabel);

  const perfiles: CortePerfil[] = [];
  const vidrios: CorteVidrio[] = [];
  const herrajes: HerrajeItem[] = [];
  let escuadrasCount = 0;
  let telaMosquiteraM2 = 0;
  let colaDeRataM = 0;
  let carretillasMosq = 0;

  if (linea === 'euroalum-2500') {
    // Tabla Oficial EuroAlum 2500 (2 hojas, corte 45°) — fórmulas exactas en mm (H = ancho, V = alto)
    const Hmm = A * 10;
    const Vmm = H * 10;
    const rielH = round2(Math.max(10, Hmm / 10));
    const rielV = round2(Math.max(10, Vmm / 10));
    const hojaH = round2(Math.max(10, (Hmm - 4) / 2 / 10));
    const hojaV = round2(Math.max(10, (Vmm - 63) / 10));
    const traslapeV = round2(Math.max(10, (Vmm - 65) / 10));
    const vidW = round2(Math.max(5, (Hmm - 215) / 2 / 10));
    const vidH = round2(Math.max(5, (Vmm - 170) / 10));

    perfiles.push(
      {
        perfilId: 'esp_riel_s80',
        nombre: 'Riel Doble 1695 Horizontal (EuroAlum 2500)',
        funcion: 'Marco superior e inferior · Fórmula: H (mm) ×2',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: rielH,
      },
      {
        perfilId: 'esp_riel_s80',
        nombre: 'Riel Doble 1695 Vertical (EuroAlum 2500)',
        funcion: 'Jambas marco perimetral · Fórmula: V (mm) ×2',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: rielV,
      },
      {
        perfilId: 'esp_hoja_s70',
        nombre: 'Hoja 1699 Horizontal (EuroAlum 2500)',
        funcion: 'Horizontales 2 hojas · Fórmula: (H - 4) / 2 ×4',
        pzas: 4 * qty,
        angulo: '45°',
        medidaCm: hojaH,
      },
      {
        perfilId: 'esp_hoja_s70',
        nombre: 'Hoja 1699 Vertical (EuroAlum 2500)',
        funcion: 'Verticales 2 hojas · Fórmula: V - 63 ×4',
        pzas: 4 * qty,
        angulo: '45°',
        medidaCm: hojaV,
      },
      {
        perfilId: 'traslape',
        nombre: 'Adaptador Traslape 1619 (EuroAlum 2500)',
        funcion: 'Encuentro central 2 hojas · Fórmula: V - 65 ×2',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: traslapeV,
      }
    );

    vidrios.push({
      tipo: 'vidrio',
      nombre: `Cristal EuroAlum 2500 (${vidLabel})`,
      pzas: 2 * qty,
      anchoCm: vidW,
      altoCm: vidH,
      areaM2: round2(((vidW * vidH) / 10000) * 2 * qty),
      espesorLabel: `${vidLabel} · (H-215)/2 × (V-170) mm`,
      permitirRotacion: permitirRotacionPanel,
    });

    escuadrasCount = 12 * qty;
    herrajes.push(
      {
        nombre: 'Kit Herrajes EuroAlum 2500 (A-2501 – A-2525)',
        detalle: 'Carretillas, guías, topes y drenes oficiales Línea 2500',
        cantidad: 1 * qty,
        unidad: 'jgo',
      },
      {
        nombre: 'Escuadras de alineación 45° EuroAlum 2500',
        detalle: '4 marco 1695 + 8 hojas 1699',
        cantidad: escuadrasCount,
        unidad: 'pzas',
      },
      {
        nombre: 'Broche automático EuroAlum (F-304 AS / F-304 AT)',
        detalle: 'Cierre lateral embutido para corrediza 2500',
        cantidad: 2 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Felpa Especial EuroAlum (FELPA ESP)',
        detalle: 'Sellado en marco 1695 y traslape 1619',
        cantidad: round2((((rielH * 2 + rielV * 2 + traslapeV * 2) / 100) * 1.1) * qty),
        unidad: 'm',
      },
      {
        nombre: 'Empaque EPDM EuroAlum (328-10 / 328-11)',
        detalle: 'Acristalamiento perimetral vidrio 6 mm (2 hojas)',
        cantidad: round2((((vidW + vidH) * 4) / 100) * qty),
        unidad: 'm',
      }
    );
  } else if (linea === 'euroalum-2800') {
    // Tabla Oficial EuroAlum 2800 (2 hojas, corte 90°) — fórmulas exactas en mm
    const Hmm = A * 10;
    const Vmm = H * 10;
    const rielInf = round2(Math.max(10, (Hmm - 12) / 10));
    const rielSup = round2(Math.max(10, (Hmm - 12) / 10));
    const jambaV = round2(Math.max(10, Vmm / 10));
    const zocloH = round2(Math.max(10, (Hmm - 45) / 2 / 10));
    const cercoV = round2(Math.max(10, (Vmm - 44) / 10));
    const traslapeV = round2(Math.max(10, (Vmm - 44) / 10));
    const vidW = round2(Math.max(5, (Hmm - 141) / 2 / 10));
    const vidH = round2(Math.max(5, (Vmm - 130) / 10));

    perfiles.push(
      {
        perfilId: 'riel',
        nombre: 'Riel Inferior 12150 (EuroAlum 2800)',
        funcion: 'Base doble carril · Fórmula: H - 12 (mm) ×1',
        pzas: 1 * qty,
        angulo: '90°',
        medidaCm: rielInf,
      },
      {
        perfilId: 'cabezal',
        nombre: 'Riel Superior 12151 (EuroAlum 2800)',
        funcion: 'Cabezal superior · Fórmula: H - 12 (mm) ×1',
        pzas: 1 * qty,
        angulo: '90°',
        medidaCm: rielSup,
      },
      {
        perfilId: 'jamba',
        nombre: 'Jamba 12152 (EuroAlum 2800)',
        funcion: 'Marcos laterales · Fórmula: V (mm) ×2',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: jambaV,
      },
      {
        perfilId: 'cabecero',
        nombre: 'Zoclo / Cabecero 12153 (EuroAlum 2800)',
        funcion: 'Horizontales 2 hojas · Fórmula: (H - 45) / 2 ×4',
        pzas: 4 * qty,
        angulo: '90°',
        medidaCm: zocloH,
      },
      {
        perfilId: 'cerco',
        nombre: 'Cerco 12154 (EuroAlum 2800)',
        funcion: 'Verticales exteriores 2 hojas · Fórmula: V - 44 ×2',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: cercoV,
      },
      {
        perfilId: 'traslape',
        nombre: 'Traslape 12155 (EuroAlum 2800)',
        funcion: 'Encuentro central 2 hojas · Fórmula: V - 44 ×2',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: traslapeV,
      }
    );

    vidrios.push({
      tipo: 'vidrio',
      nombre: `Cristal EuroAlum 2800 (${vidLabel})`,
      pzas: 2 * qty,
      anchoCm: vidW,
      altoCm: vidH,
      areaM2: round2(((vidW * vidH) / 10000) * 2 * qty),
      espesorLabel: `${vidLabel} · (H-141)/2 × (V-130) mm`,
      permitirRotacion: permitirRotacionPanel,
    });

    herrajes.push(
      {
        nombre: 'Kit Herrajes EuroAlum 2800 (A-2801 – A-2807)',
        detalle: 'Carretillas, guías superiores, topes y tapas dren Línea 2800',
        cantidad: 1 * qty,
        unidad: 'jgo',
      },
      {
        nombre: 'Broche automático EuroAlum (F-304 AS / Uñero F-243i)',
        detalle: 'Cierre lateral embutido corrediza 2800',
        cantidad: 2 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Felpa Especial EuroAlum (FELPA ESP)',
        detalle: 'Sellado perimetral en marco y traslape 12155',
        cantidad: round2((((rielInf * 2 + jambaV * 2 + traslapeV * 2) / 100) * 1.1) * qty),
        unidad: 'm',
      },
      {
        nombre: 'Empaque EPDM EuroAlum (328-10 / 195-11)',
        detalle: 'Acristalamiento perimetral (2 hojas)',
        cantidad: round2((((vidW + vidH) * 4) / 100) * qty),
        unidad: 'm',
      }
    );
  } else if (linea === 'euroalum-3800') {
    // Tabla Oficial EuroAlum 3800 (Ventana 2 hojas, corte 90°) — fórmulas exactas en mm
    const Hmm = A * 10;
    const Vmm = H * 10;
    const rielH = round2(Math.max(10, (Hmm - 25) / 10));
    const jambaV = round2(Math.max(10, Vmm / 10));
    const zocloCabH = round2(Math.max(10, (Hmm - 102) / 2 / 10));
    const cercoV = round2(Math.max(10, (Vmm - 68) / 10));
    const traslapeV = round2(Math.max(10, (Vmm - 68) / 10));
    const goteronH = round2(Math.max(10, Hmm / 10));
    const vidW = round2(Math.max(5, (Hmm - 198) / 2 / 10));
    const vidH = round2(Math.max(5, (Vmm - 191) / 10));

    perfiles.push(
      {
        perfilId: 'riel',
        nombre: 'Riel Doble 12263 (EuroAlum 3800)',
        funcion: 'Superior e inferior · Fórmula: H - 25 (mm) ×2',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: rielH,
      },
      {
        perfilId: 'jamba',
        nombre: 'Jamba 12208 (EuroAlum 3800)',
        funcion: 'Marcos laterales · Fórmula: V (mm) ×2',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: jambaV,
      },
      {
        perfilId: 'cabecero',
        nombre: 'Zoclo / Cabecero 12240 (EuroAlum 3800)',
        funcion: 'Horizontales ventana 2 hojas · Fórmula: (H - 102) / 2 ×4',
        pzas: 4 * qty,
        angulo: '90°',
        medidaCm: zocloCabH,
      },
      {
        perfilId: 'cerco',
        nombre: 'Cerco Ventana 12288 (EuroAlum 3800)',
        funcion: 'Verticales exteriores 2 hojas · Fórmula: V - 68 ×2',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: cercoV,
      },
      {
        perfilId: 'traslape',
        nombre: 'Traslape Ventana 12297 (EuroAlum 3800)',
        funcion: 'Encuentro central 2 hojas · Fórmula: V - 68 ×2',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: traslapeV,
      },
      {
        perfilId: 'chambrana',
        nombre: 'Goterón 12301 (EuroAlum 3800)',
        funcion: 'Botaguas / goterón exterior · Fórmula: H (mm) ×1',
        pzas: 1 * qty,
        angulo: '90°',
        medidaCm: goteronH,
      }
    );

    vidrios.push({
      tipo: 'vidrio',
      nombre: `Cristal EuroAlum 3800 (${vidLabel})`,
      pzas: 2 * qty,
      anchoCm: vidW,
      altoCm: vidH,
      areaM2: round2(((vidW * vidH) / 10000) * 2 * qty),
      espesorLabel: `${vidLabel} · (H-198)/2 × (V-191) mm`,
      permitirRotacion: permitirRotacionPanel,
    });

    herrajes.push(
      {
        nombre: 'Kit Herrajes EuroAlum 3800 (A-3801 – A-3810)',
        detalle: 'Carretillas regulables, guías, topes y tapas dren Línea 3800',
        cantidad: 1 * qty,
        unidad: 'jgo',
      },
      {
        nombre: 'Broche automático / Uñero (F-304 AT / F-243i)',
        detalle: 'Cierre lateral embutido para ventana EuroAlum 3800',
        cantidad: 2 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Felpa Especial EuroAlum (FELPA ESP)',
        detalle: 'Sellado perimetral en riel 12263, jambas y traslape 12297',
        cantidad: round2((((rielH * 2 + jambaV * 2 + traslapeV * 2) / 100) * 1.1) * qty),
        unidad: 'm',
      },
      {
        nombre: 'Empaque EPDM EuroAlum (328-11 / E-3540/6-7)',
        detalle: 'Acristalamiento perimetral (2 hojas)',
        cantidad: round2((((vidW + vidH) * 4) / 100) * qty),
        unidad: 'm',
      }
    );
  } else if (linea === 'mosq-fijo') {
    const bastidorH = round1(Math.max(10, A - tolerancias.marcoH));
    const bastidorV = round1(Math.max(10, H - tolerancias.hojaV));
    perfiles.push(
      {
        perfilId: 'mosq_marco',
        nombre: 'Perfil Mosquitero Horiz. (MOSQ-25)',
        funcion: 'Superior e inferior del bastidor',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: bastidorH,
      },
      {
        perfilId: 'mosq_marco',
        nombre: 'Perfil Mosquitero Vert. (MOSQ-25)',
        funcion: 'Laterales del bastidor con canal',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: bastidorV,
      }
    );
    if (H >= 150) {
      perfiles.push({
        perfilId: 'chambrana',
        nombre: 'Peinazo / Refuerzo Central (CH-19)',
        funcion: 'Tenso intermedio anti-pandeo',
        pzas: 1 * qty,
        angulo: '90°',
        medidaCm: round1(Math.max(10, bastidorH - 2.4)),
      });
    }

    const mallaW = round1(Math.max(10, A - tolerancias.vidAncho));
    const mallaH = round1(Math.max(10, H - tolerancias.vidAlto));
    const mallaM2Unit = round2(((A * H) / 10000) * 1.1);
    telaMosquiteraM2 = round2(mallaM2Unit * qty);
    colaDeRataM = round2(((2 * (A + H)) / 100 + 0.2) * qty);

    vidrios.push({
      tipo: 'malla',
      nombre: 'Tela Mosquitera (Fibra / Aluminio)',
      pzas: qty,
      anchoCm: mallaW,
      altoCm: mallaH,
      areaM2: telaMosquiteraM2,
      espesorLabel: `${telaMosquiteraM2.toFixed(2)} m² (incl. 10% tensado)`,
    });

    herrajes.push(
      {
        nombre: 'Cola de rata / Vinil redondo',
        detalle: 'Cordón de sujeción perimetral en canal',
        cantidad: colaDeRataM,
        unidad: 'm',
      },
      {
        nombre: 'Tela Mosquitera',
        detalle: `Malla fibra gris/negra (${mallaW}×${mallaH} cm neto)`,
        cantidad: telaMosquiteraM2,
        unidad: 'm²',
      },
      {
        nombre: 'Escuadras esquineras mosquitero',
        detalle: '4 escuadras de unión por bastidor',
        cantidad: 4 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Clips / Mariposas giratorias',
        detalle: 'Sujeción fija al marco de ventana',
        cantidad: 4 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Pijas de fijación #8 × 1/2"',
        detalle: 'Para clips y escuadras de refuerzo',
        cantidad: 8 * qty,
        unidad: 'pzas',
      }
    );
  } else if (linea === 'mosq-corredizo') {
    const rielAncho = round1(Math.max(15, A - tolerancias.marcoH));
    const hojaAncho = round1(Math.max(15, A / 2 + 1.5 - tolerancias.hojaH));
    const hojaAlto = round1(Math.max(15, H - tolerancias.hojaV));

    perfiles.push(
      {
        perfilId: 'riel_mosq',
        nombre: 'Riel Guía Mosquitero (RM-18)',
        funcion: 'Guía superior e inferior de deslizamiento',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: rielAncho,
      },
      {
        perfilId: 'mosq_marco',
        nombre: 'Bastidor Mosq. Horiz. (MOSQ-25)',
        funcion: 'Superior e inferior de hoja corrediza',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: hojaAncho,
      },
      {
        perfilId: 'mosq_marco',
        nombre: 'Bastidor Mosq. Vert. (MOSQ-25)',
        funcion: 'Laterales de hoja corrediza',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: hojaAlto,
      }
    );

    const mallaW = round1(Math.max(10, hojaAncho - tolerancias.vidAncho));
    const mallaH = round1(Math.max(10, hojaAlto - tolerancias.vidAlto + 2.0));
    const mallaM2Unit = round2(((hojaAncho * hojaAlto) / 10000) * 1.12);
    telaMosquiteraM2 = round2(mallaM2Unit * qty);
    colaDeRataM = round2(((2 * (hojaAncho + hojaAlto)) / 100 + 0.2) * qty);
    carretillasMosq = 2 * qty;

    vidrios.push({
      tipo: 'malla',
      nombre: 'Tela Mosquitera (Hoja Corrediza)',
      pzas: qty,
      anchoCm: mallaW,
      altoCm: mallaH,
      areaM2: telaMosquiteraM2,
      espesorLabel: `${telaMosquiteraM2.toFixed(2)} m² (incl. 12% tensado)`,
    });

    herrajes.push(
      {
        nombre: 'Carretillas de mosquitero',
        detalle: '2 rodajas inferiores con resorte por hoja corrediza',
        cantidad: carretillasMosq,
        unidad: 'pzas',
      },
      {
        nombre: 'Guías superiores antidescarrilamiento',
        detalle: 'Deslizadores superiores para riel',
        cantidad: 2 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Cola de rata / Vinil redondo',
        detalle: 'Cordón redondo para canal de malla',
        cantidad: colaDeRataM,
        unidad: 'm',
      },
      {
        nombre: 'Tela Mosquitera',
        detalle: `Malla fibra gris/negra (${mallaW}×${mallaH} cm)`,
        cantidad: telaMosquiteraM2,
        unidad: 'm²',
      },
      {
        nombre: 'Escuadras esquineras mosquitero',
        detalle: '4 por bastidor corredizo',
        cantidad: 4 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Felpa guardapolvo',
        detalle: 'Sellado lateral en cruce contra insectos',
        cantidad: round2((hojaAlto / 100) * qty),
        unidad: 'm',
      }
    );
  } else if (linea === 'mosq-abatible') {
    const marcoAncho = round1(Math.max(15, A - tolerancias.marcoH));
    const marcoAlto = round1(Math.max(15, H));
    const hojaAncho = round1(Math.max(15, A - tolerancias.hojaH));
    const hojaAlto = round1(Math.max(15, H - tolerancias.hojaV));

    perfiles.push(
      {
        perfilId: 'alumer_5844',
        nombre: 'Contramarco Mosq. Abatible Horiz. (5844)',
        funcion: 'Cabezal y base perimetral de apoyo abatible',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: marcoAncho,
      },
      {
        perfilId: 'alumer_5844',
        nombre: 'Contramarco Mosq. Abatible Vert. (5844)',
        funcion: 'Laterales verticales de apoyo y bisagras',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: marcoAlto,
      },
      {
        perfilId: 'mosq_marco',
        nombre: 'Bastidor Abatible Horiz. (MOSQ-25)',
        funcion: 'Superior e inferior de hoja abatible',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: hojaAncho,
      },
      {
        perfilId: 'mosq_marco',
        nombre: 'Bastidor Abatible Vert. (MOSQ-25)',
        funcion: 'Laterales de hoja abatible para bisagras y cierre',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: hojaAlto,
      }
    );

    const mallaW = round1(Math.max(10, hojaAncho - tolerancias.vidAncho));
    const mallaH = round1(Math.max(10, hojaAlto - tolerancias.vidAlto));
    const mallaM2Unit = round2(((hojaAncho * hojaAlto) / 10000) * 1.12);
    telaMosquiteraM2 = round2(mallaM2Unit * qty);
    colaDeRataM = round2(((2 * (hojaAncho + hojaAlto)) / 100 + 0.25) * qty);

    vidrios.push({
      tipo: 'malla',
      nombre: 'Tela Mosquitera (Hoja Abatible)',
      pzas: qty,
      anchoCm: mallaW,
      altoCm: mallaH,
      areaM2: telaMosquiteraM2,
      espesorLabel: `${telaMosquiteraM2.toFixed(2)} m² (incl. 12% tensado)`,
    });

    herrajes.push(
      {
        nombre: 'Bisagras de resorte / libro para mosquitero abatible',
        detalle: '2 bisagras laterales (3 si alto > 160 cm)',
        cantidad: (H > 160 ? 3 : 2) * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Jaladera + broche magnético de cierre',
        detalle: 'Apertura manual y cierre hermético contra insectos',
        cantidad: 1 * qty,
        unidad: 'jgo',
      },
      {
        nombre: 'Cola de rata / Vinil redondo',
        detalle: 'Cordón redondo para canal de malla',
        cantidad: colaDeRataM,
        unidad: 'm',
      },
      {
        nombre: 'Tela Mosquitera',
        detalle: `Malla fibra gris/negra (${mallaW}×${mallaH} cm)`,
        cantidad: telaMosquiteraM2,
        unidad: 'm²',
      },
      {
        nombre: 'Escuadras esquineras mosquitero',
        detalle: '4 escuadras de unión para bastidor abatible',
        cantidad: 4 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Felpa perimetral guardapolvo',
        detalle: 'Sellado perimetral entre hoja y contramarco',
        cantidad: round2(((2 * (hojaAncho + hojaAlto)) / 100) * qty),
        unidad: 'm',
      }
    );
  } else if (linea === 'cancel-bano') {
    const rielSup = round1(Math.max(20, A));
    const guiaInf = rielSup;
    // Cancel de Baño: Jambas (2) Alto - 4.0 cm (editable en Mi Taller)
    const jambaH = round1(Math.max(15, H - adj.cancelBanoJambaAlto));
    const numHojas = Math.max(2, Math.min(3, hojas || 2));
    // Cancel Corredizo: Hojas Alto - 3.6 cm
    const hojaV = round1(Math.max(15, H - adj.cancelCorrHojaAlto));
    const hojaH = round1(Math.max(15, (A - tolerancias.hojaH) / numHojas + 2.0));
    const marcoId: PerfilCatalogoId =
      cancelEstilo === 'economico'
        ? 'alumer_11035'
        : cancelEstilo === 'lujo'
          ? 'alumer_11173'
          : 'alumer_11046';
    const marcoNombre =
      cancelEstilo === 'economico'
        ? 'Marco Económico (11035)'
        : cancelEstilo === 'lujo'
          ? 'Marco Lujo (11173)'
          : 'Marco Semilujo (11046)';

    perfiles.push(
      {
        perfilId: 'alumer_11174',
        nombre: 'Riel Superior Económico (11174)',
        funcion: 'Riel colgante superior de cancel',
        pzas: 1 * qty,
        angulo: '90°',
        medidaCm: rielSup,
      },
      {
        perfilId: 'alumer_11387',
        nombre: 'Guía Inferior (11387)',
        funcion: 'Guía inferior de deslizamiento con drenaje',
        pzas: 1 * qty,
        angulo: '90°',
        medidaCm: guiaInf,
      },
      {
        perfilId: 'alumer_11386',
        nombre: 'Jamba Lateral (11386)',
        funcion: 'Laterales de remate fijadas a muro',
        pzas: 2 * qty,
        angulo: '90°',
        medidaCm: jambaH,
      },
      {
        perfilId: marcoId,
        nombre: `${marcoNombre} Vert.`,
        funcion: `Largueros verticales de ${numHojas} hojas`,
        pzas: numHojas * 2 * qty,
        angulo: '45°',
        medidaCm: hojaV,
      },
      {
        perfilId: marcoId,
        nombre: `${marcoNombre} Horiz.`,
        funcion: `Cabeceros y zoclos de ${numHojas} hojas`,
        pzas: numHojas * 2 * qty,
        angulo: '45°',
        medidaCm: hojaH,
      }
    );

    const vidW = round1(Math.max(15, hojaH - tolerancias.vidAncho));
    const vidH = round1(Math.max(20, hojaV - tolerancias.vidAlto));
    const vidPzas = numHojas * qty;
    vidrios.push({
      tipo: 'vidrio',
      nombre: `Cristal / Acrílico Cancel (${vidLabel})`,
      pzas: vidPzas,
      anchoCm: vidW,
      altoCm: vidH,
      areaM2: round2(((vidW * vidH) / 10000) * vidPzas),
      espesorLabel: vidLabel,
    });

    herrajes.push(
      {
        nombre: 'Carretillas Cancel Baño (colgantes)',
        detalle: `2 carretillas superiores por hoja (${numHojas} hojas)`,
        cantidad: numHojas * 2 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Guía plástica separadora inferior',
        detalle: 'Tope guía antirrozamiento entre hojas',
        cantidad: 1 * qty,
        unidad: 'pza',
      },
      {
        nombre: 'Toallero / Jaladera de baño',
        detalle: 'Barra toallero o jaladera botón cromada',
        cantidad: 2 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Silicón antihongos + taquetes',
        detalle: 'Sellado sanitario en guía inferior y jambas',
        cantidad: 1 * qty,
        unidad: 'kit',
      }
    );
  } else if (linea === 'puerta-europea') {
    const marcoV = round1(H);
    const marcoH = round1(Math.max(20, A - tolerancias.marcoH));
    const hojaV = round1(Math.max(20, H - tolerancias.hojaV));
    const hojaH = round1(Math.max(20, A - tolerancias.hojaH));
    const junqV = round1(Math.max(10, hojaV - 10));
    const junqH = round1(Math.max(10, hojaH - 10));

    perfiles.push(
      {
        perfilId: 'jamba',
        nombre: 'Marco Perimetral Vert. (7825 / Europea)',
        funcion: 'Laterales de marco con corte 45° arriba',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: marcoV,
      },
      {
        perfilId: 'cabezal',
        nombre: 'Marco Perimetral Sup. (7836 / Europea)',
        funcion: 'Cabezal superior 45° en ambas puntas',
        pzas: 1 * qty,
        angulo: '45°',
        medidaCm: marcoH,
      },
      {
        perfilId: 'alumer_9204',
        nombre: 'Hoja Perimetral Vert. (Cerco 9204)',
        funcion: 'Largueros de hoja con corte 45°',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: hojaV,
      },
      {
        perfilId: 'alumer_9187',
        nombre: 'Hoja Perimetral Horiz. (Zoclo 9187)',
        funcion: 'Cabezal y zoclo de hoja 45°',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: hojaH,
      }
    );

    if (puertaIntermedio) {
      perfiles.push({
        perfilId: 'alumer_9183',
        nombre: 'Peinazo / Travesaño Intermedio (9183)',
        funcion: 'División horizontal de hoja',
        pzas: 1 * qty,
        angulo: '90°',
        medidaCm: round1(Math.max(10, hojaH - 8)),
      });
    }

    perfiles.push(
      {
        perfilId: 'alumer_6370',
        nombre: 'Junquillo Vertical 45° (6370)',
        funcion: 'Sujeción interior de cristal/panel',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: junqV,
      },
      {
        perfilId: 'alumer_6370',
        nombre: 'Junquillo Horizontal 45° (6370)',
        funcion: 'Sujeción superior/inferior',
        pzas: 2 * qty,
        angulo: '45°',
        medidaCm: junqH,
      }
    );

    const vidW = round1(Math.max(10, A - tolerancias.vidAncho));
    const vidH = round1(
      Math.max(10, puertaIntermedio ? (H - tolerancias.vidAlto) / 2 : H - tolerancias.vidAlto)
    );
    const vidPzas = (puertaIntermedio ? 2 : 1) * qty;
    vidrios.push({
      tipo: 'vidrio',
      nombre: `Cristal Puerta Europea (${vidLabel})`,
      pzas: vidPzas,
      anchoCm: vidW,
      altoCm: vidH,
      areaM2: round2(((vidW * vidH) / 10000) * vidPzas),
      espesorLabel: vidLabel,
    });

    // 6 escuadras por puerta (4 para la hoja a 45° + 2 para esquinas superiores del marco)
    escuadrasCount = 6 * qty;
    herrajes.push(
      {
        nombre: 'Escuadras de unión / alineación 45°',
        detalle: '6 por puerta: 4 para la hoja a 45° + 2 para esquinas superiores del marco',
        cantidad: escuadrasCount,
        unidad: 'pzas',
      },
      {
        nombre: 'Bisagras Europeas 3D / Pala reforzada',
        detalle: '3 bisagras por hoja abatible',
        cantidad: 3 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Cerradura multipunto + juego de manijas',
        detalle: 'Incluye cilindro llave/mariposa y contra',
        cantidad: 1 * qty,
        unidad: 'jgo',
      },
      {
        nombre: 'Empaque EPDM perimetral',
        detalle: 'Sellado hermético en marco y hoja',
        cantidad: round2(((2 * H + A) * 2) / 100 * qty),
        unidad: 'm',
      },
      {
        nombre: 'Taquetes y pijas de fijación a muro',
        detalle: 'Tornillería de montaje 1/4" × 2 1/2"',
        cantidad: 10 * qty,
        unidad: 'pzas',
      }
    );
  } else if (linea === 'puerta-2' || linea === 'puerta-abatible') {
    // Fórmulas exactas de taller para Puerta Abatible 1 Hoja y Puerta Doble Abatible (2 Hojas)
    const esDobleHoja = Boolean(puertaDobleHoja) || hojas === 2;
    const numHojasPuerta = esDobleHoja ? 2 : 1;
    const marcoH = round1(Math.max(15, A));
    const marcoV = round1(Math.max(15, H - adj.puertaJambaAlto));
    const hojaV = round1(Math.max(15, H - adj.puertaLargueroAlto));
    const hojaH = round1(
      esDobleHoja
        ? Math.max(10, (A - adj.puerta2HojasHorizAncho) / 2)
        : Math.max(10, A - adj.puerta1HojaHorizAncho)
    );
    const rellenoEfectivo: 'vidrio' | 'mixta_duela' | 'ciega_duela' =
      puertaRellenoModo ||
      (relleno?.categoria === 'duela' ? 'ciega_duela' : 'vidrio');
    const duelaAncho = Number(duelaAnchoUtilCm) > 0 ? Number(duelaAnchoUtilCm) : adj.duelaAnchoUtilCm;

    if (linea === 'puerta-abatible') {
      perfiles.push(
        {
          perfilId: 'alumer_5844',
          nombre: 'Batiente Lujo PP Vert. / Jambas (5844)',
          funcion: `Jambas laterales marco (Alto - ${adj.puertaJambaAlto.toFixed(1)} cm)`,
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: marcoV,
        },
        {
          perfilId: 'alumer_5060',
          nombre: 'Cabezal Marco Superior (5060)',
          funcion: 'Marco superior a medida de vano (Ancho)',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: marcoH,
        },
        {
          perfilId: 'alumer_9204',
          nombre: 'Cerco Curvo / Largueros (9204)',
          funcion: `Largueros verticales ${esDobleHoja ? '2 hojas (4 pzas)' : '1 hoja (2 pzas)'} · Alto - ${adj.puertaLargueroAlto.toFixed(1)} cm`,
          pzas: 2 * numHojasPuerta * qty,
          angulo: '90°',
          medidaCm: hojaV,
        },
        {
          perfilId: 'alumer_9207',
          nombre: 'Cabezal Hoja PP (9207)',
          funcion: esDobleHoja
            ? `Horizontal sup. ×2 hojas ((Ancho - ${adj.puerta2HojasHorizAncho.toFixed(1)}) / 2)`
            : `Horizontal sup. hoja (Ancho - ${adj.puerta1HojaHorizAncho.toFixed(1)} cm)`,
          pzas: numHojasPuerta * qty,
          angulo: '90°',
          medidaCm: hojaH,
        },
        {
          perfilId: puertaEconomica ? 'zoclo1v' : 'alumer_9187',
          nombre: puertaEconomica ? 'Zoclo 1 Vena (7835-1V)' : 'Zoclo Puerta PP (9187)',
          funcion: `Horizontal inferior (${numHojasPuerta} hoja${numHojasPuerta > 1 ? 's' : ''})`,
          pzas: numHojasPuerta * qty,
          angulo: '90°',
          medidaCm: hojaH,
        }
      );
      if (puertaIntermedio || rellenoEfectivo === 'mixta_duela') {
        perfiles.push({
          perfilId: 'alumer_9183',
          nombre: 'Peinazo / Intermedio PP (9183)',
          funcion: `División intermedia (${numHojasPuerta} hoja${numHojasPuerta > 1 ? 's' : ''})`,
          pzas: numHojasPuerta * qty,
          angulo: '90°',
          medidaCm: hojaH,
        });
      }
      perfiles.push({
        perfilId: 'alumer_6370',
        nombre: 'Junquillo PP (6370)',
        funcion: 'Sujeción interior de vidrio / duela',
        pzas: 4 * numHojasPuerta * qty,
        angulo: '45°',
        medidaCm: round1(Math.max(10, (hojaV + hojaH) / 2 - 12)),
      });
    } else {
      perfiles.push(
        {
          perfilId: 'jamba',
          nombre: 'Canal Liso 2" / Jambas (7825)',
          funcion: `Jambas laterales marco (Alto - ${adj.puertaJambaAlto.toFixed(1)} cm)`,
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: marcoV,
        },
        {
          perfilId: 'batiente',
          nombre: 'Batiente / Cabezal Marco Sup. (BAT-76)',
          funcion: 'Marco superior a medida de vano (Ancho)',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: marcoH,
        },
        {
          perfilId: 'cerco',
          nombre: 'Cerco Chapa / Largueros (7847)',
          funcion: `Largueros verticales ${esDobleHoja ? '2 hojas (4 pzas)' : '1 hoja (2 pzas)'} · Alto - ${adj.puertaLargueroAlto.toFixed(1)} cm`,
          pzas: 2 * numHojasPuerta * qty,
          angulo: '90°',
          medidaCm: hojaV,
        },
        {
          perfilId: 'cabecero',
          nombre: 'Cabezal de Hoja (7835)',
          funcion: esDobleHoja
            ? `Horizontal sup. ×2 hojas ((Ancho - ${adj.puerta2HojasHorizAncho.toFixed(1)}) / 2)`
            : `Horizontal sup. hoja (Ancho - ${adj.puerta1HojaHorizAncho.toFixed(1)} cm)`,
          pzas: numHojasPuerta * qty,
          angulo: '90°',
          medidaCm: hojaH,
        },
        {
          perfilId: puertaEconomica ? 'zoclo1v' : 'zoclo2v',
          nombre: puertaEconomica ? 'Zoclo 1V (7835-1V)' : 'Zoclo Puerta 2 Venas (7842)',
          funcion: `Horizontal inferior (${numHojasPuerta} hoja${numHojasPuerta > 1 ? 's' : ''})`,
          pzas: numHojasPuerta * qty,
          angulo: '90°',
          medidaCm: hojaH,
        }
      );
      if (puertaIntermedio || rellenoEfectivo === 'mixta_duela') {
        perfiles.push({
          perfilId: 'alumer_9382',
          nombre: 'Peinazo Intermedio (9382)',
          funcion: `División central (${numHojasPuerta} hoja${numHojasPuerta > 1 ? 's' : ''})`,
          pzas: numHojasPuerta * qty,
          angulo: '90°',
          medidaCm: hojaH,
        });
      }
    }

    // Cálculo de vidrio y/o duela en puertas (con validación >= 5 cm para nunca dar valores negativos)
    const anchoVidrioHoja = round1(Math.max(5, hojaH + adj.puertaVidrioExtraAncho));
    const perfilHorizSumCm = linea === 'puerta-abatible' ? 13.1 : 12.4; // cabezal (~5.2) + zoclo (~7.9)
    const peinazoCm = 4.2;
    const altoLibreTotal = round1(Math.max(5, hojaV - perfilHorizSumCm));

    if (rellenoEfectivo === 'ciega_duela') {
      const tirasPorHoja = Math.max(1, Math.ceil(hojaH / duelaAncho));
      const totalTiras = tirasPorHoja * numHojasPuerta * qty;
      vidrios.push({
        tipo: 'duela',
        nombre: `Duela Aluminio 100% Ciega (${duelaAncho} cm útil · ${tirasPorHoja} tiras/hoja)`,
        pzas: totalTiras,
        anchoCm: round1(duelaAncho),
        altoCm: altoLibreTotal,
        areaM2: round2(((duelaAncho * altoLibreTotal) / 10000) * totalTiras),
        espesorLabel: `Duela ${duelaAncho} cm (${totalTiras} tiras de ${altoLibreTotal} cm)`,
        permitirRotacion: false,
      });
    } else if (rellenoEfectivo === 'mixta_duela') {
      const altoMitad = round1(Math.max(5, (altoLibreTotal - peinazoCm) / 2));
      const vidPzas = numHojasPuerta * qty;
      vidrios.push({
        tipo: 'vidrio',
        nombre: `Cristal Superior Puerta (${vidLabel})`,
        pzas: vidPzas,
        anchoCm: anchoVidrioHoja,
        altoCm: altoMitad,
        areaM2: round2(((anchoVidrioHoja * altoMitad) / 10000) * vidPzas),
        espesorLabel: vidLabel,
      });
      const tirasPorHoja = Math.max(1, Math.ceil(hojaH / duelaAncho));
      const totalTiras = tirasPorHoja * numHojasPuerta * qty;
      vidrios.push({
        tipo: 'duela',
        nombre: `Duela Inferior Puerta (${duelaAncho} cm útil · ${tirasPorHoja} tiras/hoja)`,
        pzas: totalTiras,
        anchoCm: round1(duelaAncho),
        altoCm: altoMitad,
        areaM2: round2(((duelaAncho * altoMitad) / 10000) * totalTiras),
        espesorLabel: `Duela ${duelaAncho} cm (${totalTiras} tiras de ${altoMitad} cm)`,
        permitirRotacion: false,
      });
    } else {
      const vidH = round1(
        Math.max(5, puertaIntermedio ? (altoLibreTotal - peinazoCm) / 2 : altoLibreTotal)
      );
      const vidPzas = (puertaIntermedio ? 2 : 1) * numHojasPuerta * qty;
      vidrios.push({
        tipo: 'vidrio',
        nombre: `Cristal Puerta ${esDobleHoja ? 'Doble ' : ''}(${vidLabel})`,
        pzas: vidPzas,
        anchoCm: anchoVidrioHoja,
        altoCm: vidH,
        areaM2: round2(((anchoVidrioHoja * vidH) / 10000) * vidPzas),
        espesorLabel: vidLabel,
      });
    }

    const totalVidrioPerimetroM = vidrios
      .filter((v) => v.tipo === 'vidrio')
      .reduce((acc, v) => acc + ((v.anchoCm + v.altoCm) * 2 * v.pzas) / 100, 0);

    herrajes.push(
      {
        nombre: 'Bisagras reforzadas para puerta',
        detalle: `3 bisagras libro o tubulares por hoja (${numHojasPuerta} hoja${numHojasPuerta > 1 ? 's' : ''})`,
        cantidad: 3 * numHojasPuerta * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Chapa / Cerradura de manija o pomo',
        detalle: esDobleHoja ? 'Incluye chapa principal + pasadores de canto en hoja pasiva' : 'Incluye contra en batiente',
        cantidad: 1 * qty,
        unidad: 'jgo',
      },
      {
        nombre: 'Pijas armado #10 × 1 1/2" y #10 × 2"',
        detalle: 'Armado de zoclo, cabecero y marco',
        cantidad: (esDobleHoja ? 28 : 18) * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Vinil pata / cuña para cristal',
        detalle: 'Acristalamiento perimetral',
        cantidad: round2(totalVidrioPerimetroM),
        unidad: 'm',
      }
    );
  } else {
    // Ventanas (3", 2", Europea, Panorámica) según tipo de apertura
    const marcoHoriz = round1(Math.max(15, A - tolerancias.marcoH));
    const marcoVert = round1(H);
    const es45 = linea === 'europea';

    if (apertura === 'fija') {
      // 1. Fija vinculada a los perfiles de Fijo 3" (Alumer)
      const bolsaHoriz = round1(Math.max(15, A));
      const bolsaVert = round1(Math.max(15, H - 8.8));
      const junqH = round1(Math.max(10, A - 8.8));
      const junqV = round1(Math.max(10, H - 8.8));
      const divisiones = A > 160 ? 1 : 0;

      perfiles.push(
        {
          perfilId: 'alumer_9135',
          nombre: 'Bolsa Horizontal Fijo 3" (9135)',
          funcion: 'Cabezal y base superior/inferior Fijo 3"',
          pzas: 2 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: bolsaHoriz,
        },
        {
          perfilId: 'alumer_10235',
          nombre: 'Bolsa Corta Lateral (10235)',
          funcion: 'Jambas verticales de marco Fijo 3"',
          pzas: 2 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: bolsaVert,
        },
        {
          perfilId: 'alumer_9112',
          nombre: 'Junquillo Horiz. Fijo 3" (9112)',
          funcion: 'Sujeción superior/inferior de cristal',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: junqH,
        },
        {
          perfilId: 'alumer_9112',
          nombre: 'Junquillo Vert. Fijo 3" (9112)',
          funcion: 'Sujeción lateral de cristal',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: junqV,
        },
        {
          perfilId: 'alumer_7316',
          nombre: 'Tapa Lisa (7316)',
          funcion: 'Tapa de cierre limpio sobre bolsa',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: bolsaVert,
        }
      );

      if (divisiones > 0) {
        perfiles.push({
          perfilId: 'alumer_9114',
          nombre: 'Bolsa Lisa Manguete (9114)',
          funcion: 'Poste divisor vertical central (>160 cm)',
          pzas: divisiones * qty,
          angulo: '90°',
          medidaCm: bolsaVert,
        });
      }

      const vidW = round1(Math.max(10, (A - tolerancias.vidAncho - 1) / (divisiones + 1)));
      const vidH = round1(Math.max(10, H - tolerancias.vidAncho - 1));
      const vidPzas = (divisiones + 1) * qty;
      vidrios.push({
        tipo: 'vidrio',
        nombre: `Cristal Fijo 3" Alumer (${vidLabel})`,
        pzas: vidPzas,
        anchoCm: vidW,
        altoCm: vidH,
        areaM2: round2(((vidW * vidH) / 10000) * vidPzas),
        espesorLabel: vidLabel,
      });
      herrajes.push(
        {
          nombre: 'Vinil de acristalar / Silicón estructural',
          detalle: 'Sello perimetral para junquillo 9112',
          cantidad: round2(((A + H) * 2) / 100 * qty),
          unidad: 'm',
        },
        {
          nombre: 'Pijas y taquetes de fijación #10',
          detalle: 'Instalación de bolsa 9135 / 10235 a vano',
          cantidad: 8 * qty,
          unidad: 'pzas',
        }
      );
    } else if (apertura === 'guillotina') {
      // 2. Guillotina (deslizamiento vertical: hoja superior + hoja inferior)
      const hojaVert = round1(Math.max(15, H / 2 + 1.5 - tolerancias.hojaV / 2));
      const hojaHoriz = round1(Math.max(15, A - tolerancias.hojaH));

      perfiles.push(
        {
          perfilId: 'cabezal',
          nombre: 'Cabezal Guillotina (7836)',
          funcion: 'Marco superior',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: marcoHoriz,
        },
        {
          perfilId: 'riel',
          nombre: 'Riel Base Guillotina (7857)',
          funcion: 'Marco inferior de asiento',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: marcoHoriz,
        },
        {
          perfilId: 'jamba',
          nombre: 'Jambas Guía Laterales (7825)',
          funcion: 'Guías verticales para balances espirales',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: marcoVert,
        },
        {
          perfilId: 'cerco',
          nombre: 'Cercos Laterales Hoja (7847)',
          funcion: 'Verticales de 2 hojas superpuestas',
          pzas: 4 * qty,
          angulo: '90°',
          medidaCm: hojaVert,
        },
        {
          perfilId: 'traslape',
          nombre: 'Traslapes Centrales Horiz. (7848)',
          funcion: 'Encuentro central entre hoja sup. e inf.',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: hojaHoriz,
        },
        {
          perfilId: 'cabecero',
          nombre: 'Cabecero / Zoclo Hoja (7835)',
          funcion: 'Superior de hoja sup. e inferior de hoja inf.',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: hojaHoriz,
        }
      );

      const vidW = round1(Math.max(10, hojaHoriz - tolerancias.vidAncho));
      const vidH = round1(Math.max(10, hojaVert - 8));
      vidrios.push({
        tipo: 'vidrio',
        nombre: `Cristal Guillotina 2 Hojas (${vidLabel})`,
        pzas: 2 * qty,
        anchoCm: vidW,
        altoCm: vidH,
        areaM2: round2(((vidW * vidH) / 10000) * 2 * qty),
        espesorLabel: vidLabel,
      });

      herrajes.push(
        {
          nombre: 'Balances espirales / contrapesos',
          detalle: '1 par por hoja deslizante vertical',
          cantidad: 2 * qty,
          unidad: 'jgos',
        },
        {
          nombre: 'Seguro media luna / pasador guillotina',
          detalle: 'Cierre en traslape horizontal central',
          cantidad: 1 * qty,
          unidad: 'pza',
        },
        {
          nombre: 'Felpa guardapolvo',
          detalle: 'Sellado lateral en jambas y encuentro central',
          cantidad: round2(((marcoVert * 2 + hojaHoriz) / 100) * qty),
          unidad: 'm',
        },
        {
          nombre: 'Pijas de armado #10 × 1 1/2"',
          detalle: 'Armado de marco y hojas guillotina',
          cantidad: 20 * qty,
          unidad: 'pzas',
        }
      );
    } else if (
      apertura === 'abatible' ||
      apertura === 'banderola' ||
      apertura === 'oscilobatiente'
    ) {
      // 3, 4, 5: Abatible vertical, Banderola, Oscilobatiente
      const numHojas = apertura === 'banderola' ? 1 : Math.max(1, Math.min(2, hojas >= 2 ? 2 : 1));
      const hojaV = round1(Math.max(15, H - tolerancias.hojaV));
      const hojaH = round1(Math.max(15, (A - tolerancias.hojaH) / numHojas));
      const usa45 = es45 || apertura === 'oscilobatiente';

      perfiles.push(
        {
          perfilId: 'alumer_5844',
          nombre: 'Marco Batiente Horiz. (5844)',
          funcion: 'Cabezal y base con tope de cierre',
          pzas: 2 * qty,
          angulo: usa45 ? '45°' : '90°',
          medidaCm: marcoHoriz,
        },
        {
          perfilId: 'alumer_5844',
          nombre: 'Marco Batiente Vert. (5844)',
          funcion: 'Jambas laterales de marco',
          pzas: 2 * qty,
          angulo: usa45 ? '45°' : '90°',
          medidaCm: marcoVert,
        },
        {
          perfilId: 'alumer_9204',
          nombre: 'Cerco Hoja Vert. (9204)',
          funcion: `Largueros verticales (${numHojas} hoja${numHojas > 1 ? 's' : ''})`,
          pzas: 2 * numHojas * qty,
          angulo: usa45 ? '45°' : '90°',
          medidaCm: hojaV,
        },
        {
          perfilId: 'alumer_9207',
          nombre: 'Cabezal / Zoclo Hoja Horiz. (9207)',
          funcion: `Horizontales (${numHojas} hoja${numHojas > 1 ? 's' : ''})`,
          pzas: 2 * numHojas * qty,
          angulo: usa45 ? '45°' : '90°',
          medidaCm: hojaH,
        },
        {
          perfilId: 'alumer_6370',
          nombre: 'Junquillo PP (6370)',
          funcion: 'Sujeción interior de cristal',
          pzas: 4 * numHojas * qty,
          angulo: '45°',
          medidaCm: round1(Math.max(10, (hojaH + hojaV) / 2 - 4)),
        }
      );

      const vidW = round1(Math.max(10, hojaH - tolerancias.vidAncho));
      const vidH = round1(Math.max(10, hojaV - 9));
      vidrios.push({
        tipo: 'vidrio',
        nombre: `Cristal ${apertura.toUpperCase()} (${vidLabel})`,
        pzas: numHojas * qty,
        anchoCm: vidW,
        altoCm: vidH,
        areaM2: round2(((vidW * vidH) / 10000) * numHojas * qty),
        espesorLabel: vidLabel,
      });

      if (usa45) {
        escuadrasCount = (4 + 4 * numHojas) * qty;
        herrajes.push({
          nombre: 'Escuadras de alineación 45°',
          detalle: `4 marco + ${4 * numHojas} hoja(s)`,
          cantidad: escuadrasCount,
          unidad: 'pzas',
        });
      }

      if (apertura === 'banderola') {
        herrajes.push(
          {
            nombre: 'Brazos proyectantes telescópicos',
            detalle: '1 par acero inox para apertura inclinada',
            cantidad: 1 * qty,
            unidad: 'par',
          },
          {
            nombre: 'Manija / Aldaba de cierre banderola',
            detalle: 'Cierre de presión superior/inferior',
            cantidad: 1 * qty,
            unidad: 'pza',
          }
        );
      } else if (apertura === 'oscilobatiente') {
        herrajes.push(
          {
            nombre: 'Kit herraje Oscilobatiente completo',
            detalle: 'Cremona, compás abatible/oscilante y puntos cierre',
            cantidad: numHojas * qty,
            unidad: 'jgo',
          },
          {
            nombre: 'Manija cremón doble acción',
            detalle: 'Posición cerrada, abatible 90° y oscilante 180°',
            cantidad: numHojas * qty,
            unidad: 'pzas',
          }
        );
      } else {
        herrajes.push(
          {
            nombre: 'Bisagras de pala / fricción para ventana',
            detalle: '2 por cada hoja abatible',
            cantidad: 2 * numHojas * qty,
            unidad: 'pzas',
          },
          {
            nombre: 'Manija cremón multipunto',
            detalle: 'Cierre hermético lateral',
            cantidad: numHojas * qty,
            unidad: 'pzas',
          }
        );
      }

      herrajes.push({
        nombre: 'Empaque EPDM / Felpa perimetral',
        detalle: 'Doble sellado hermético marco-hoja',
        cantidad: round2(((A + H) * 2 * 2) / 100 * qty),
        unidad: 'm',
      });
    } else if (apertura === 'plegable') {
      // 6. Plegable / tipo libro (hojas articuladas)
      const numHojas = Math.max(2, Math.min(4, hojas || 3));
      const hojaV = round1(Math.max(20, H - tolerancias.hojaV));
      const hojaH = round1(Math.max(15, (A - tolerancias.hojaH) / numHojas));

      perfiles.push(
        {
          perfilId: 'alumer_7828',
          nombre: 'Riel Superior Guía Plegable (7828)',
          funcion: 'Riel superior portador de carros plegables',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: marcoHoriz,
        },
        {
          perfilId: 'riel',
          nombre: 'Guía Inferior Plegable (7857)',
          funcion: 'Canal guía inferior antidescarrilamiento',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: marcoHoriz,
        },
        {
          perfilId: 'jamba',
          nombre: 'Jambas Laterales (7825)',
          funcion: 'Marcos laterales verticales',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: marcoVert,
        },
        {
          perfilId: 'alumer_9204',
          nombre: 'Cercos Hojas Articuladas (9204)',
          funcion: `Verticales de ${numHojas} hojas libro`,
          pzas: 2 * numHojas * qty,
          angulo: '90°',
          medidaCm: hojaV,
        },
        {
          perfilId: 'alumer_9207',
          nombre: 'Cabecero / Zoclo Hojas (9207)',
          funcion: `Horizontales de ${numHojas} hojas libro`,
          pzas: 2 * numHojas * qty,
          angulo: '90°',
          medidaCm: hojaH,
        }
      );

      const vidW = round1(Math.max(10, hojaH - tolerancias.vidAncho));
      const vidH = round1(Math.max(10, hojaV - 10));
      vidrios.push({
        tipo: 'vidrio',
        nombre: `Cristal Plegable ${numHojas} Hojas (${vidLabel})`,
        pzas: numHojas * qty,
        anchoCm: vidW,
        altoCm: vidH,
        areaM2: round2(((vidW * vidH) / 10000) * numHojas * qty),
        espesorLabel: vidLabel,
      });

      herrajes.push(
        {
          nombre: 'Carros rodantes plegables superiores',
          detalle: 'Rodamiento colgante en articulaciones libro',
          cantidad: Math.max(1, Math.floor(numHojas / 2)) * qty,
          unidad: 'pzas',
        },
        {
          nombre: 'Bisagras articuladas plegables',
          detalle: '3 bisagras por unión entre hojas',
          cantidad: numHojas * 3 * qty,
          unidad: 'pzas',
        },
        {
          nombre: 'Pasadores de pie y cerradura',
          detalle: 'Fijación de hojas al plegar/cerrar',
          cantidad: 2 * qty,
          unidad: 'pzas',
        }
      );
    } else {
      // Corrediza estándar con fórmulas exactas de taller (Línea 2", Línea 3", Europea)
      const numHojas = Math.max(2, Math.min(4, hojas || 2));
      const esL2 = linea === '2';
      const esL3 = linea === '3';

      const cabezalMed = esL2 || esL3 ? round1(A) : marcoHoriz;
      const rielMed = esL2 || esL3 ? round1(A) : marcoHoriz;
      const jambaMed = esL2
        ? round1(Math.max(10, H - adj.l2JambaAlto))
        : esL3
          ? round1(Math.max(10, H - adj.l3JambaAlto))
          : marcoVert;

      const hojaFijaVert = esL2
        ? round1(Math.max(10, H - adj.l2HojaFijaAlto))
        : esL3
          ? round1(Math.max(10, H - adj.l3HojaFijaAlto))
          : round1(Math.max(10, H - tolerancias.hojaV));

      const hojaCorrVert = esL2
        ? round1(Math.max(10, H - adj.l2HojaCorredizaAlto))
        : esL3
          ? round1(Math.max(10, H - adj.l3HojaCorredizaAlto))
          : round1(Math.max(10, H - tolerancias.hojaV));

      let hojaHoriz: number;
      let zocloFormulaNote: string;
      if (esL2) {
        if (numHojas === 3) {
          hojaHoriz = round1(Math.max(10, (A - adj.l2Zoclo3HojasAncho) / 3));
          zocloFormulaNote = `(Ancho - ${adj.l2Zoclo3HojasAncho.toFixed(1)}) / 3`;
        } else if (numHojas === 4) {
          const d4 = round1(adj.l2Zoclo3HojasAncho + 5.0);
          hojaHoriz = round1(Math.max(10, (A - d4) / 4));
          zocloFormulaNote = `(Ancho - ${d4.toFixed(1)}) / 4`;
        } else {
          hojaHoriz = round1(Math.max(10, (A - adj.l2Zoclo2HojasAncho) / 2));
          zocloFormulaNote = `(Ancho - ${adj.l2Zoclo2HojasAncho.toFixed(1)}) / 2`;
        }
      } else if (esL3) {
        if (numHojas === 3) {
          hojaHoriz = round1(Math.max(10, (A - adj.l3Zoclo3HojasAncho) / 3));
          zocloFormulaNote = `(Ancho - ${adj.l3Zoclo3HojasAncho.toFixed(1)}) / 3`;
        } else if (numHojas === 4) {
          const d4 = round1(adj.l3Zoclo3HojasAncho + 6.0);
          hojaHoriz = round1(Math.max(10, (A - d4) / 4));
          zocloFormulaNote = `(Ancho - ${d4.toFixed(1)}) / 4`;
        } else {
          hojaHoriz = round1(Math.max(10, (A - adj.l3Zoclo2HojasAncho) / 2));
          zocloFormulaNote = `(Ancho - ${adj.l3Zoclo2HojasAncho.toFixed(1)}) / 2`;
        }
      } else {
        hojaHoriz = round1(
          Math.max(15, (A - tolerancias.hojaH) / numHojas + (numHojas >= 2 ? 1.5 : 0))
        );
        zocloFormulaNote = `Horizontales de ${numHojas} hojas`;
      }

      const hojasMoviles = dobleCorrediza
        ? numHojas
        : numHojas === 4
          ? 2
          : numHojas === 3 && params.invertido
            ? 2
            : 1;
      const hojasFijas = Math.max(0, numHojas - hojasMoviles);

      perfiles.push(
        {
          perfilId: 'cabezal',
          nombre: `Cabezal (${esL3 ? '7836' : linea.toUpperCase()})`,
          funcion: esL2 || esL3 ? 'Marco superior (Ancho exacto)' : 'Marco superior doble vía',
          pzas: 1 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: cabezalMed,
        },
        {
          perfilId: 'riel',
          nombre: `Riel (${esL3 ? '7857' : linea.toUpperCase()})`,
          funcion: esL2 || esL3 ? 'Marco inferior (Ancho exacto)' : 'Marco inferior doble vía',
          pzas: 1 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: rielMed,
        },
        {
          perfilId: 'jamba',
          nombre: `Jamba (${esL3 ? '7825' : linea.toUpperCase()})`,
          funcion: esL2
            ? `Marcos laterales (Alto - ${adj.l2JambaAlto.toFixed(1)} cm)`
            : esL3
              ? `Marcos laterales (Alto - ${adj.l3JambaAlto.toFixed(1)} cm)`
              : 'Marcos laterales verticales',
          pzas: 2 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: jambaMed,
        }
      );

      if (esL3 && dobleCorrediza) {
        perfiles.push({
          perfilId: 'alumer_7828',
          nombre: 'Riel Adicional (7828)',
          funcion: `Doble corrediza 3" (Ancho - ${adj.l3RielAdicionalAncho.toFixed(1)} cm)`,
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: round1(Math.max(10, A - adj.l3RielAdicionalAncho)),
        });
      }

      if (esL2 || esL3) {
        // Verticales diferenciados: Hoja Fija vs Hoja Corrediza
        if (hojasFijas > 0) {
          perfiles.push(
            {
              perfilId: 'cerco',
              nombre: `Cerco Hoja Fija (${esL3 ? '7847' : '2"'})`,
              funcion: `Hoja fija · Alto - ${(esL2 ? adj.l2HojaFijaAlto : adj.l3HojaFijaAlto).toFixed(1)} cm`,
              pzas: hojasFijas * qty,
              angulo: '90°',
              medidaCm: hojaFijaVert,
            },
            {
              perfilId: 'traslape',
              nombre: `Traslape Hoja Fija (${esL3 ? '7848' : '2"'})`,
              funcion: `Encuentro hoja fija · Alto - ${(esL2 ? adj.l2HojaFijaAlto : adj.l3HojaFijaAlto).toFixed(1)} cm`,
              pzas: hojasFijas * qty,
              angulo: '90°',
              medidaCm: hojaFijaVert,
            }
          );
        }
        if (hojasMoviles > 0) {
          perfiles.push(
            {
              perfilId: 'cerco',
              nombre: `Cerco Hoja Corrediza (${esL3 ? '7847' : '2"'})`,
              funcion: `Hoja corrediza · Alto - ${(esL2 ? adj.l2HojaCorredizaAlto : adj.l3HojaCorredizaAlto).toFixed(1)} cm`,
              pzas: hojasMoviles * qty,
              angulo: '90°',
              medidaCm: hojaCorrVert,
            },
            {
              perfilId: 'traslape',
              nombre: `Traslape Hoja Corrediza (${esL3 ? '7848' : '2"'})`,
              funcion: `Encuentro hoja corrediza · Alto - ${(esL2 ? adj.l2HojaCorredizaAlto : adj.l3HojaCorredizaAlto).toFixed(1)} cm`,
              pzas: (numHojas === 3 ? hojasMoviles + 1 : hojasMoviles) * qty,
              angulo: '90°',
              medidaCm: hojaCorrVert,
            }
          );
        }
      } else {
        perfiles.push(
          {
            perfilId: 'cerco',
            nombre: `Cerco (${linea.toUpperCase()})`,
            funcion: 'Vertical exterior de hojas',
            pzas: 2 * qty,
            angulo: es45 ? '45°' : '90°',
            medidaCm: hojaCorrVert,
          },
          {
            perfilId: 'traslape',
            nombre: `Traslape (${linea.toUpperCase()})`,
            funcion: 'Vertical cruce entre hojas',
            pzas: (numHojas === 2 ? 2 : numHojas === 3 ? 4 : 6) * qty,
            angulo: es45 ? '45°' : '90°',
            medidaCm: hojaCorrVert,
          }
        );
      }

      perfiles.push(
        {
          perfilId: 'cabecero',
          nombre: `Cabezal de Hoja (${esL3 ? '7835' : linea.toUpperCase()})`,
          funcion: `${zocloFormulaNote} · ${numHojas} hojas`,
          pzas: numHojas * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: hojaHoriz,
        },
        {
          perfilId: 'zoclo2v',
          nombre: `Zoclo Inferior (${esL3 ? '7842' : linea.toUpperCase()})`,
          funcion: `${zocloFormulaNote} · ${numHojas} hojas`,
          pzas: numHojas * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: hojaHoriz,
        }
      );

      if (H >= 165 && esL3) {
        perfiles.push({
          perfilId: 'alumer_9382',
          nombre: 'Intermedio (9382)',
          funcion: 'Divisor horizontal de hojas (>165 cm)',
          pzas: numHojas * qty,
          angulo: '90°',
          medidaCm: hojaHoriz,
        });
      }

      const vidW = round1(Math.max(10, hojaHoriz + 1.4));
      const vidH = round1(Math.max(10, hojaCorrVert - (esL2 ? 10.5 : 12.5)));
      const vidPzas = numHojas * qty;
      vidrios.push({
        tipo: 'vidrio',
        nombre: `Cristal ${vidLabel} (${numHojas} hojas)`,
        pzas: vidPzas,
        anchoCm: vidW,
        altoCm: vidH,
        areaM2: round2(((vidW * vidH) / 10000) * vidPzas),
        espesorLabel: vidLabel,
      });

      if (es45) {
        escuadrasCount = (4 + 4 * numHojas) * qty;
        herrajes.push({
          nombre: 'Escuadras de alineación 45°',
          detalle: `4 marco + ${4 * numHojas} hojas`,
          cantidad: escuadrasCount,
          unidad: 'pzas',
        });
      }
      herrajes.push(
        {
          nombre: esL3 ? 'Carretilla doble/tándem 3"' : `Carretilla ${LINEAS_CONFIG[linea].nombre}`,
          detalle: '2 por cada hoja corrediza',
          cantidad: 2 * hojasMoviles * qty,
          unidad: 'pzas',
        },
        {
          nombre: 'Jaladera / Seguro automático',
          detalle: '1 por hoja corrediza',
          cantidad: hojasMoviles * qty,
          unidad: 'pzas',
        },
        {
          nombre: 'Felpa guardapolvo',
          detalle: 'Perímetro de traslapes y cercos',
          cantidad: round2(((hojaCorrVert * (numHojas * 2)) / 100) * qty),
          unidad: 'm',
        },
        {
          nombre: 'Vinil / Cuña acristalar',
          detalle: 'Sujeción de cristal en hojas',
          cantidad: round2((((vidW + vidH) * 2 * numHojas) / 100) * qty),
          unidad: 'm',
        },
        {
          nombre: 'Pijas de armado #10 × 1 1/2" y fijación',
          detalle: 'Armado de marco, hojas y colocación',
          cantidad: (16 + numHojas * 4) * qty,
          unidad: 'pzas',
        }
      );
    }
  }

  const totalAluminioCm = perfiles.reduce((acc, p) => acc + p.pzas * p.medidaCm, 0);
  const totalAluminioM = round2(totalAluminioCm / 100);
  const tramos610 = Math.max(1, Math.ceil((totalAluminioCm * 1.06) / TRAMO_STD_CM));
  const vidriosNormalized = vidrios.map((v) =>
    v.tipo === 'malla' ? v : { ...v, permitirRotacion: v.permitirRotacion ?? permitirRotacionPanel }
  );

  return {
    perfiles,
    vidrios: vidriosNormalized,
    herrajes,
    totalAluminioM,
    tramos610,
    escuadrasCount,
    telaMosquiteraM2,
    colaDeRataM,
    carretillasMosq,
  };
}

export interface CotizacionCalculada {
  areaRealM2: number;
  areaCobradaM2: number;
  tarifaBaseM2: number;
  extraColorM2: number;
  extraVidrioM2: number;
  tarifaCombinadaM2: number;
  subtotalUnitario: number;
  subtotalPiezas: number;
  extraPctMonto: number;
  ivaMonto: number;
  totalFinal: number;
  costoMaterialEstimado: number;
  gananciaLibre: number;
  margenPct: number;
}

export function calcularCotizacion(args: {
  linea: LineaId;
  anchoCm: number;
  altoCm: number;
  color: ColorId;
  vidrio: VidrioId;
  relleno?: PanelRellenoSelection;
  rellenoPrecioM2?: number;
  modoPrecio: 'm2' | 'base';
  precioInput: number;
  cantidad: number;
  cobrarMinM2: boolean;
  incluirIva: boolean;
  extraPct: number;
  descDistribuidorPct: number;
  precioListaTramo: number;
  despiece: DespieceCalculado;
}): CotizacionCalculada {
  const {
    linea,
    anchoCm,
    altoCm,
    color,
    vidrio,
    relleno,
    rellenoPrecioM2,
    modoPrecio,
    precioInput,
    cantidad,
    cobrarMinM2,
    incluirIva,
    extraPct,
    descDistribuidorPct,
    precioListaTramo,
    despiece,
  } = args;

  const qty = Math.max(1, Math.round(cantidad || 1));
  const areaRealM2 = round2((Math.max(10, anchoCm) * Math.max(10, altoCm)) / 10000);
  const areaCobradaM2 = cobrarMinM2 && areaRealM2 < 1 ? 1 : areaRealM2;
  const esMosq = Boolean(LINEAS_CONFIG[linea]?.esMosquitero);

  const hasCustomRelleno =
    Boolean(relleno) ||
    (typeof rellenoPrecioM2 === 'number' && Number.isFinite(rellenoPrecioM2));
  const effectiveRellenoM2 = hasCustomRelleno
    ? typeof rellenoPrecioM2 === 'number' && Number.isFinite(rellenoPrecioM2)
      ? round2(Math.max(0, rellenoPrecioM2))
      : getRellenoPrecioM2(relleno, undefined, vidrio)
    : vidrio === 'filtrasol6'
      ? 720
      : vidrio === 'tintex6'
        ? 760
        : vidrio === 'claro4'
          ? 290
          : 440;

  const extraColorM2 = COLORES_CONFIG[color]?.extraM2 ?? 0;
  const extraVidrioM2 = esMosq
    ? 0
    : hasCustomRelleno
      ? round2(effectiveRellenoM2 - 440)
      : (VIDRIOS_CONFIG[vidrio]?.extraM2 ?? 0);
  const tarifaBaseM2 = Math.max(0, Number(precioInput) || 0);
  const tarifaCombinadaM2 =
    modoPrecio === 'm2' ? Math.max(0, tarifaBaseM2 + extraColorM2 + extraVidrioM2) : tarifaBaseM2;

  const subtotalUnitario =
    modoPrecio === 'm2' ? round2(areaCobradaM2 * tarifaCombinadaM2) : round2(tarifaBaseM2);

  const subtotalPiezas = round2(subtotalUnitario * qty);
  const extraPctMonto = round2(subtotalPiezas * (Math.max(0, extraPct || 0) / 100));
  const baseConExtra = round2(subtotalPiezas + extraPctMonto);
  const ivaMonto = incluirIva ? round2(baseConExtra * 0.16) : 0;
  const totalFinal = round2(baseConExtra + ivaMonto);

  const descFactor = Math.max(0.2, 1 - Math.min(80, Math.max(0, descDistribuidorPct)) / 100);
  const tramoNeto =
    Math.max(100, precioListaTramo) *
    descFactor *
    (color === 'madera' ? 1.25 : color === 'negro' ? 1.08 : 1);
  const costoAluminio = (despiece.totalAluminioM / TRAMO_STD_M) * tramoNeto * 1.08;
  const costoVidrioOMalla = esMosq
    ? despiece.telaMosquiteraM2 * 95
    : despiece.vidrios.reduce(
        (s, v) =>
          s +
          v.areaM2 *
            (hasCustomRelleno
              ? effectiveRellenoM2
              : vidrio === 'filtrasol6' || vidrio === 'tintex6'
                ? 580
                : vidrio === 'claro4'
                  ? 320
                  : 440),
        0
      );
  const costoHerrajes = esMosq
    ? despiece.carretillasMosq * 35 + despiece.colaDeRataM * 8 + 45 * qty
    : linea.startsWith('puerta')
      ? 480 * qty
      : 220 * qty;
  const costoMaterialEstimado = round2(costoAluminio + costoVidrioOMalla + costoHerrajes);
  const gananciaLibre = round2(baseConExtra - costoMaterialEstimado);
  const margenPct = baseConExtra > 0 ? Math.round((gananciaLibre / baseConExtra) * 100) : 0;

  return {
    areaRealM2,
    areaCobradaM2,
    tarifaBaseM2,
    extraColorM2,
    extraVidrioM2,
    tarifaCombinadaM2,
    subtotalUnitario,
    subtotalPiezas,
    extraPctMonto,
    ivaMonto,
    totalFinal,
    costoMaterialEstimado,
    gananciaLibre,
    margenPct,
  };
}

// ==================== LICENCIA PRO, PLANES Y REPOSICIÓN DE DÍAS ====================
export function normalizeDeviceIdInput(raw: string, fallbackDeviceId = ''): string {
  const clean = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!clean) return String(fallbackDeviceId || '').trim().toUpperCase();
  if (clean.startsWith('ALM-')) return clean;
  if (/^ALM[A-Z0-9]{3,}$/.test(clean)) {
    return `ALM-${clean.slice(3)}`;
  }
  if (/^[A-Z0-9]{2,16}$/.test(clean) && !clean.includes('-')) {
    return `ALM-${clean}`;
  }
  return clean;
}

export function formatActivationKeyInput(rawValue: string, prevValue = ''): string {
  const upperRaw = String(rawValue || '').toUpperCase();
  const isDeleting = prevValue.length > 0 && rawValue.length < prevValue.length;
  const alnum = upperRaw.replace(/[^A-Z0-9]/g, '');
  if (!alnum) return '';

  if (alnum.length === 1) return alnum;
  if (alnum.length === 2) {
    return isDeleting ? alnum : `${alnum}-`;
  }

  const prefix = alnum.slice(0, 2);
  const rest = alnum.slice(2);

  if (rest.startsWith('D')) {
    const cleanWithHyphens = upperRaw.replace(/[^A-Z0-9-]/g, '');
    const parts = cleanWithHyphens.split('-');
    if (parts.length >= 3 && parts[1].startsWith('D') && /^D\d{1,4}$/.test(parts[1])) {
      const daysToken = parts[1];
      const hashToken = parts.slice(2).join('').slice(0, 6);
      if (!hashToken) {
        return isDeleting && !cleanWithHyphens.endsWith('-')
          ? `${prefix}-${daysToken}`
          : `${prefix}-${daysToken}-`;
      }
      return `${prefix}-${daysToken}-${hashToken}`;
    }

    const afterD = rest.slice(1);
    if (!afterD) return `${prefix}-D`;
    const mLetter = afterD.match(/^(\d{1,4})([A-Z][A-Z0-9]*)$/);
    if (mLetter) {
      return `${prefix}-D${mLetter[1]}-${mLetter[2].slice(0, 6)}`;
    }
    if (/^\d+$/.test(afterD)) {
      if (afterD.length >= 7) {
        const splitIdx = Math.min(4, afterD.length - 6);
        return `${prefix}-D${afterD.slice(0, splitIdx)}-${afterD.slice(splitIdx, splitIdx + 6)}`;
      }
      return `${prefix}-D${afterD}`;
    }
    return `${prefix}-${rest.slice(0, 1)}-${rest.slice(1, 7)}`;
  }

  const planChar = rest.slice(0, 1);
  const hash = rest.slice(1, 7);
  if (!hash) {
    return isDeleting ? `${prefix}-${planChar}` : `${prefix}-${planChar}-`;
  }
  return `${prefix}-${planChar}-${hash}`;
}

export function computeDeviceHash(deviceId: string, token: string): string {
  const seed = `${deviceId.trim().toUpperCase()}::${token.toUpperCase()}::AP2026`;
  let h1 = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h1 ^= seed.charCodeAt(i);
    h1 = Math.imul(h1, 16777619);
  }
  return (h1 >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

export function generateActivationKey(deviceId: string, planIdx: number, customDays?: number | null): string {
  const diasExactos = customDays && customDays > 0 ? Math.min(3650, Math.round(customDays)) : null;
  if (diasExactos !== null) {
    const token = `D${diasExactos}`;
    const hash = computeDeviceHash(deviceId, token);
    return `AP-${token}-${hash}`;
  }
  const plan = PLANS.find((p) => p.idx === planIdx) || PLANS[1];
  const hash = computeDeviceHash(deviceId, plan.code);
  return `AP-${plan.code}-${hash}`;
}

export function generatePermanentTestKey(deviceId: string): string {
  const hash = computeDeviceHash(deviceId, 'P');
  return `AP-P-${hash}`;
}

export interface ValidationResult {
  ok: boolean;
  plan?: PlanDefinicion;
  customDays?: number;
  isFreeTestPro?: boolean;
  error?: string;
}

export function validateActivationKey(deviceId: string, keyInput: string): ValidationResult {
  const clean = keyInput.trim().toUpperCase();
  const permMatch = clean.match(/^AP-P-([A-Z0-9]{6})$/);
  if (permMatch) {
    const hash = permMatch[1];
    const expected = computeDeviceHash(deviceId, 'P');
    if (hash !== expected) {
      return { ok: false, error: 'La clave PRO permanente no corresponde a este ID de equipo.' };
    }
    return {
      ok: true,
      isFreeTestPro: true,
      plan: {
        code: 'P',
        idx: 4,
        label: 'PRO Permanente (Prueba / Cortesía)',
        price: '$0 MXN',
        ms: null,
        days: 0,
        adminOnly: true,
      },
    };
  }

  const customMatch = clean.match(/^AP-D(\d{1,4})-([A-Z0-9]{6})$/);
  if (customMatch) {
    const days = Math.max(1, Math.min(3650, Number(customMatch[1])));
    const hash = customMatch[2];
    const expected = computeDeviceHash(deviceId, `D${days}`);
    if (hash !== expected) {
      return { ok: false, error: 'La clave de reposición no corresponde a este ID de equipo.' };
    }
    return {
      ok: true,
      customDays: days,
      plan: {
        code: 'G',
        idx: 0,
        label: `Reposición ${days} día${days === 1 ? '' : 's'}`,
        price: 'Reposición',
        ms: days * 24 * 60 * 60 * 1000,
        days,
        adminOnly: true,
      },
    };
  }

  const m = clean.match(/^AP-([GMQA])-([A-Z0-9]{6})$/);
  if (!m) {
    return { ok: false, error: 'Formato inválido. Debe ser AP-X-XXXXXX o AP-DXX-XXXXXX.' };
  }
  const [, code, hash] = m;
  const plan = PLANS.find((p) => p.code === code);
  if (!plan) {
    return { ok: false, error: 'Código de plan desconocido.' };
  }
  const expected = computeDeviceHash(deviceId, code);
  if (hash !== expected) {
    return { ok: false, error: 'La clave no corresponde a este ID de equipo.' };
  }
  return { ok: true, plan };
}

export function isProActive(
  licencia: { active: boolean; expiresAt: number | null } | null,
  now = Date.now()
): boolean {
  if (!licencia || !licencia.active) return false;
  if (licencia.expiresAt === null) return true;
  return licencia.expiresAt > now;
}

export const FREE_TRIAL_MS = 72 * 60 * 60 * 1000;

export interface TrialCountdown {
  active: boolean;
  remainingMs: number;
  days: number;
  hours: number;
  label: string;
}

export function getTrialCountdown(expiresAt: number, now: number = Date.now()): TrialCountdown {
  const remainingMs = Math.max(0, expiresAt - now);
  if (remainingMs <= 0) {
    return {
      active: false,
      remainingMs: 0,
      days: 0,
      hours: 0,
      label: 'Activar PRO',
    };
  }
  const totalHours = Math.floor(Math.max(0, remainingMs - 1) / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return {
    active: true,
    remainingMs,
    days,
    hours,
    label: `Prueba PRO · ${days}d ${hours}h`,
  };
}

export function formatCountdownTimer(expiresAt: number | null, now: number = Date.now()): {
  expired: boolean;
  label: string;
} {
  if (expiresAt === null) {
    return { expired: false, label: '⏳ Vitalicia' };
  }
  const remainingMs = expiresAt - now;
  if (remainingMs <= 0) {
    return { expired: true, label: 'Expirado' };
  }
  const totalSecs = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (days > 0) {
    return { expired: false, label: `⏳ ${days}d ${hours}h ${mins}m` };
  }
  if (hours > 0) {
    return { expired: false, label: `⏳ ${hours}h ${mins}m ${secs}s` };
  }
  return { expired: false, label: `⏳ ${mins}m ${secs}s` };
}

export function isEligibleForCloudBackup(
  licencia: { active: boolean; planCode: string; planLabel?: string; expiresAt: number | null } | null,
  isTrialActive: boolean,
  now: number = Date.now()
): boolean {
  if (isTrialActive) return false;
  if (!licencia || !licencia.active || !isProActive(licencia, now)) return false;
  const code = String(licencia.planCode || '').trim().toUpperCase();
  if (code === 'Q' || code === 'A') return true;
  if (code.startsWith('D')) {
    const days = Number(code.slice(1));
    if (Number.isFinite(days) && days >= 90) return true;
  }
  const lbl = String(licencia.planLabel || '').toLowerCase();
  if (lbl.includes('90') || lbl.includes('365') || lbl.includes('1 año') || lbl.includes('1 ano')) {
    return true;
  }
  return false;
}

// ==================== CONSOLIDADO DE OBRA E INVENTARIO ====================
export interface PartidaObra {
  id: string;
  categoria: CategoriaTrabajo;
  linea: LineaId;
  area: string;
  etiqueta: string;
  anchoCm: number;
  altoCm: number;
  color: ColorId;
  vidrio: VidrioId;
  relleno?: PanelRellenoSelection;
  rellenoPrecioM2?: number;
  hojas: number;
  apertura: AperturaVentanaId;
  sentidoPuerta: 'izq' | 'der';
  puertaIntermedio: boolean;
  puertaEconomica: boolean;
  cancelEstilo?: CancelEstiloId;
  invertido: boolean;
  cantidad: number;
  modoPrecio: 'm2' | 'base';
  precioInput: number;
  cobrarMinM2: boolean;
  extraPct: number;
  totalLinea: number;
  despiece: DespieceCalculado;
}

export interface MaterialConsolidadoRow {
  key: string;
  linea: LineaId;
  perfilId: PerfilCatalogoId;
  perfilNombre: string;
  color: ColorId;
  metrosRequeridos: number;
  tramosRequeridos: number;
  tramosEnBodega: number;
  tramosComprometidos: number;
  tramosDisponibles: number;
  metrosSobrantesDisponibles: number;
  tramosFaltantes: number;
  marcasEnBodega?: string[];
}

export function consolidarMaterialesObra(
  partidas: PartidaObra[],
  inventario: Record<string, number>,
  comprometidos: Record<string, number>,
  sobrantes?: { linea: LineaId; perfilId: PerfilCatalogoId; color: ColorId; largoM: number; cantidad: number }[]
): MaterialConsolidadoRow[] {
  const map = new Map<
    string,
    { linea: LineaId; perfilId: PerfilCatalogoId; perfilNombre: string; color: ColorId; cm: number }
  >();

  for (const item of partidas) {
    if (!item?.despiece || !Array.isArray(item.despiece.perfiles)) continue;
    const normLinea = normalizeLineaId(item.linea);
    const normColor = normalizeColorId(item.color);
    for (const p of item.despiece.perfiles) {
      const key = `${normLinea}__${p.perfilId}__${normColor}`;
      const prev = map.get(key);
      const addCm = p.pzas * p.medidaCm;
      if (prev) {
        prev.cm += addCm;
      } else {
        map.set(key, {
          linea: normLinea,
          perfilId: p.perfilId,
          perfilNombre: CATALOGO_PERFILES.find((c) => c.id === p.perfilId)?.nombre || p.nombre,
          color: normColor,
          cm: addCm,
        });
      }
    }
  }

  const sobrantesMap: Record<string, number> = {};
  if (Array.isArray(sobrantes)) {
    for (const s of sobrantes) {
      const k = `${normalizeLineaId(s.linea)}__${s.perfilId}__${normalizeColorId(s.color)}`;
      sobrantesMap[k] = round2((sobrantesMap[k] || 0) + Math.max(0, s.largoM) * Math.max(1, s.cantidad || 1));
    }
  }

  const rows: MaterialConsolidadoRow[] = [];
  for (const [key, val] of map.entries()) {
    const metrosRequeridos = round2(val.cm / 100);
    const tramosRequeridos = Math.max(1, Math.ceil((val.cm * 1.06) / TRAMO_STD_CM));
    const tramosEnBodega = getInventarioTramosPorPerfilColor(
      inventario,
      val.linea,
      val.perfilId,
      val.color
    );
    const marcasSet = new Set<string>();
    for (const [invKey, rawVal] of Object.entries(inventario || {})) {
      if ((Number(rawVal) || 0) <= 0) continue;
      const parsed = parseInventarioKey(invKey);
      if (
        normalizeLineaId(parsed.linea) === val.linea &&
        parsed.perfilId === val.perfilId &&
        parsed.color === val.color &&
        parsed.marca
      ) {
        marcasSet.add(parsed.marca);
      }
    }
    const tramosComprometidos = round2(comprometidos[key] || 0);
    const tramosDisponibles = Math.max(0, round2(tramosEnBodega - tramosComprometidos));
    const metrosSobrantesDisponibles = round2(sobrantesMap[key] || 0);
    const tramosFaltantes = Math.max(0, Math.ceil(tramosRequeridos - tramosDisponibles));
    rows.push({
      key,
      linea: val.linea,
      perfilId: val.perfilId,
      perfilNombre: val.perfilNombre,
      color: val.color,
      metrosRequeridos,
      tramosRequeridos,
      tramosEnBodega,
      tramosComprometidos,
      tramosDisponibles,
      metrosSobrantesDisponibles,
      tramosFaltantes,
      marcasEnBodega: Array.from(marcasSet),
    });
  }

  return rows;
}

// ==================== CONVERSIÓN DE NOTA DE OBRA A COTIZACIÓN EN 1 CLIC ====================
export interface ParsedNotaCotizacion {
  linea: LineaId;
  apertura: AperturaVentanaId;
  anchoCm: number;
  altoCm: number;
  color: ColorId;
  vidrio: VidrioId;
  area: string;
  etiqueta: string;
}

export function parseNotaACotizacion(nota: {
  titulo: string;
  texto: string;
  lineaHint?: LineaId;
  aperturaHint?: AperturaVentanaId;
  anchoCm?: number;
  altoCm?: number;
}): ParsedNotaCotizacion {
  const full = `${nota.titulo} ${nota.texto}`.toLowerCase();

  let linea: LineaId = nota.lineaHint || '3';
  if (!nota.lineaHint) {
    if (full.includes('cancel') || full.includes('baño') || full.includes('bano')) {
      linea = 'cancel-bano';
    } else if (full.includes('mosquitero corredizo') || (full.includes('mosquitero') && full.includes('corrediz'))) {
      linea = 'mosq-corredizo';
    } else if (full.includes('mosquitero')) {
      linea = 'mosq-fijo';
    } else if (full.includes('puerta europea')) {
      linea = 'puerta-europea';
    } else if (full.includes('puerta batiente') || full.includes('puerta abatible') || full.includes('puerta 3') || full.includes('puerta')) {
      linea = full.includes('2"') || full.includes('2 pulg') ? 'puerta-2' : 'puerta-abatible';
    } else if (full.includes('europea')) {
      linea = 'europea';
    } else if (full.includes('2"') || full.includes('linea 2') || full.includes('línea 2')) {
      linea = '2';
    } else {
      linea = '3';
    }
  }

  let apertura: AperturaVentanaId = nota.aperturaHint || 'corrediza';
  if (!nota.aperturaHint) {
    if (linea === 'mosq-fijo' || full.includes('fijo') || full.includes('fija')) {
      apertura = 'fija';
    } else if (full.includes('guillotina')) {
      apertura = 'guillotina';
    } else if (full.includes('oscilobatiente') || full.includes('oscilo')) {
      apertura = 'oscilobatiente';
    } else if (full.includes('banderola') || full.includes('proyeccion') || full.includes('proyección')) {
      apertura = 'banderola';
    } else if (full.includes('plegable') || full.includes('libro')) {
      apertura = 'plegable';
    } else if (full.includes('abatible')) {
      apertura = 'abatible';
    } else {
      apertura = 'corrediza';
    }
  }

  let anchoCm = nota.anchoCm && nota.anchoCm >= 20 ? nota.anchoCm : linea.startsWith('puerta') ? 90 : 120;
  let altoCm = nota.altoCm && nota.altoCm >= 20 ? nota.altoCm : linea.startsWith('puerta') ? 210 : 100;
  if (!nota.anchoCm || !nota.altoCm) {
    const dimMatch = full.match(/(\d{2,3}(?:\.\d+)?)\s*[x×*]\s*(\d{2,3}(?:\.\d+)?)/i);
    if (dimMatch) {
      anchoCm = Math.max(20, Number(dimMatch[1]) || anchoCm);
      altoCm = Math.max(20, Number(dimMatch[2]) || altoCm);
    }
  }

  let color: ColorId = 'natural';
  if (full.includes('blanco')) color = 'blanco';
  else if (full.includes('negro')) color = 'negro';
  else if (full.includes('madera')) color = 'madera';

  let vidrio: VidrioId = 'claro6';
  if (full.includes('filtrasol')) vidrio = 'filtrasol6';
  else if (full.includes('tintex')) vidrio = 'tintex6';
  else if (full.includes('4 mm') || full.includes('4mm')) vidrio = 'claro4';

  return {
    linea,
    apertura,
    anchoCm,
    altoCm,
    color,
    vidrio,
    area: nota.titulo.split('—')[1]?.trim() || 'General',
    etiqueta: nota.titulo.trim() || 'Nota de Obra',
  };
}

export const ADMIN_ACCESS_PASSWORD = '1983';
export const ADMIN_RECOVERY_PIN = '202699';

export function verifyAdminPassword(candidate: string, customOverride?: string | null): boolean {
  const cleanCandidate = String(candidate || '').trim();
  if (!cleanCandidate) return false;
  const cleanOverride = typeof customOverride === 'string' ? customOverride.trim() : '';
  const expected =
    cleanOverride && cleanOverride !== 'TU_CONTRASEÑA_AQUI' ? cleanOverride : ADMIN_ACCESS_PASSWORD;
  return cleanCandidate === expected;
}

export function verifyRecoveryPin(pin: string): boolean {
  return String(pin || '').trim() === ADMIN_RECOVERY_PIN;
}

export function verifyAdminAccessCredential(
  candidate: string,
  customOverride?: string | null
): { ok: boolean; viaRecoveryPin: boolean } {
  const cleanCandidate = String(candidate || '').trim();
  if (!cleanCandidate) return { ok: false, viaRecoveryPin: false };
  if (verifyAdminPassword(cleanCandidate, customOverride)) {
    return { ok: true, viaRecoveryPin: false };
  }
  if (verifyRecoveryPin(cleanCandidate)) {
    return { ok: true, viaRecoveryPin: true };
  }
  return { ok: false, viaRecoveryPin: false };
}

export const ADMIN_URL_BACKUP_PARAM = 'Admin';
export const ADMIN_URL_BACKUP_SECRET = 'OlmosHer1983';

/**
 * Seguro de respaldo privado sensible a mayúsculas y minúsculas: ?Admin=OlmosHer1983
 */
export function parseAdminUrlShortcut(search: string): boolean {
  if (!search || typeof search !== 'string') return false;
  try {
    const query = search.startsWith('?') ? search.slice(1) : search;
    const params = new URLSearchParams(query);
    return params.get(ADMIN_URL_BACKUP_PARAM) === ADMIN_URL_BACKUP_SECRET;
  } catch {
    return false;
  }
}

export type HomeMenuSectionId = 'principal' | 'herramientas';

export type HomeMenuCardId =
  | 'levantamiento'
  | 'hoja'
  | 'ventanas'
  | 'puertas'
  | 'catalogo'
  | 'inventario'
  | 'notas'
  | 'modulacion'
  | 'taller'
  | 'galeria'
  | 'vidrio'
  | 'cotizaciones'
  | 'videos';

export interface HomeMenuLayout {
  principal: HomeMenuCardId[];
  herramientas: HomeMenuCardId[];
}

export const ALL_HOME_MENU_CARD_IDS: readonly HomeMenuCardId[] = [
  'levantamiento',
  'hoja',
  'ventanas',
  'puertas',
  'catalogo',
  'inventario',
  'notas',
  'modulacion',
  'taller',
  'galeria',
  'vidrio',
  'cotizaciones',
  'videos',
] as const;

export const DEFAULT_HOME_MENU_LAYOUT: HomeMenuLayout = {
  principal: ['levantamiento', 'hoja', 'ventanas', 'puertas', 'catalogo', 'inventario'],
  herramientas: ['notas', 'modulacion', 'taller', 'galeria', 'vidrio', 'cotizaciones', 'videos'],
};

const VALID_HOME_MENU_CARD_SET = new Set<string>(ALL_HOME_MENU_CARD_IDS);

export function cloneHomeMenuLayout(layout: HomeMenuLayout): HomeMenuLayout {
  return {
    principal: [...layout.principal],
    herramientas: [...layout.herramientas],
  };
}

export function normalizeHomeMenuLayout(raw: unknown): HomeMenuLayout {
  if (!raw || typeof raw !== 'object') {
    return cloneHomeMenuLayout(DEFAULT_HOME_MENU_LAYOUT);
  }
  const obj = raw as Partial<Record<HomeMenuSectionId, unknown>>;
  const seen = new Set<HomeMenuCardId>();
  const principal: HomeMenuCardId[] = [];
  const herramientas: HomeMenuCardId[] = [];

  const ingest = (arr: unknown, target: HomeMenuCardId[]) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (typeof item === 'string' && VALID_HOME_MENU_CARD_SET.has(item)) {
        const id = item as HomeMenuCardId;
        if (!seen.has(id)) {
          seen.add(id);
          target.push(id);
        }
      }
    }
  };

  ingest(obj.principal, principal);
  ingest(obj.herramientas, herramientas);

  // Garantizar que ningún módulo se pierda si se agregan nuevas tarjetas en el futuro
  for (const id of DEFAULT_HOME_MENU_LAYOUT.principal) {
    if (!seen.has(id)) {
      seen.add(id);
      principal.push(id);
    }
  }
  for (const id of DEFAULT_HOME_MENU_LAYOUT.herramientas) {
    if (!seen.has(id)) {
      seen.add(id);
      herramientas.push(id);
    }
  }

  return { principal, herramientas };
}

export function moveHomeMenuCard(
  layout: HomeMenuLayout,
  cardId: HomeMenuCardId,
  targetSection: HomeMenuSectionId,
  targetIndex?: number
): HomeMenuLayout {
  const normalized = normalizeHomeMenuLayout(layout);
  if (!VALID_HOME_MENU_CARD_SET.has(cardId)) {
    return normalized;
  }

  const next: HomeMenuLayout = {
    principal: normalized.principal.filter((id) => id !== cardId),
    herramientas: normalized.herramientas.filter((id) => id !== cardId),
  };

  const dest = next[targetSection];
  const rawIdx = typeof targetIndex === 'number' && Number.isFinite(targetIndex)
    ? Math.trunc(targetIndex)
    : dest.length;
  const clampedIdx = Math.max(0, Math.min(dest.length, rawIdx));
  dest.splice(clampedIdx, 0, cardId);
  return next;
}

export function isDefaultHomeMenuLayout(layout: HomeMenuLayout): boolean {
  const norm = normalizeHomeMenuLayout(layout);
  if (
    norm.principal.length !== DEFAULT_HOME_MENU_LAYOUT.principal.length ||
    norm.herramientas.length !== DEFAULT_HOME_MENU_LAYOUT.herramientas.length
  ) {
    return false;
  }
  return (
    norm.principal.every((id, i) => id === DEFAULT_HOME_MENU_LAYOUT.principal[i]) &&
    norm.herramientas.every((id, i) => id === DEFAULT_HOME_MENU_LAYOUT.herramientas[i])
  );
}

export type HomeMenuTier = 'free' | 'pro_paged' | 'pro_annual';

/**
 * Determina la distribución del menú principal según el plan activo:
 * - 'free': Versión Gratuita o Prueba de 3 días (1 vista vertical fija).
 * - 'pro_paged': Planes 30 Días y 90 Días PRO (2 páginas deslizables con tarjetas fijas).
 * - 'pro_annual': Plan 1 Año PRO o PRO Permanente (2 páginas deslizables + reordenamiento libre entre páginas).
 */
export function getHomeMenuTier(
  licencia: {
    active: boolean;
    planCode?: string | null;
    planLabel?: string | null;
    expiresAt: number | null;
    activatedAt?: number | null;
    activatedKey?: string | null;
  } | null | undefined,
  proActive: boolean,
  nowTs: number = Date.now()
): HomeMenuTier {
  if (!proActive || !licencia || !licencia.active) return 'free';
  const code = String(licencia.planCode || '').trim().toUpperCase();
  const label = String(licencia.planLabel || '').toLowerCase();
  const key = String(licencia.activatedKey || '').trim().toUpperCase();

  // Prueba de 3 días / Promo Colega se mantiene en vista simple
  if (
    code === 'G' ||
    code === 'D3' ||
    /^AP-G-/i.test(key) ||
    /^AP-D3-/i.test(key) ||
    /colega|3\s*d[ií]as|regalo/.test(label)
  ) {
    return 'free';
  }

  // Plan 1 Año PRO o Permanente / Vitalicio
  if (
    licencia.expiresAt === null ||
    code === 'A' ||
    code === 'V' ||
    code === 'P' ||
    /^AP-[AVP]-/i.test(key) ||
    /1\s*a[ñn]o|anual|365|vitalici|permanente/.test(label)
  ) {
    return 'pro_annual';
  }

  const refStart =
    typeof licencia.activatedAt === 'number' && Number.isFinite(licencia.activatedAt)
      ? licencia.activatedAt
      : nowTs;
  const totalDays = (licencia.expiresAt - refStart) / (24 * 60 * 60 * 1000);
  if (totalDays >= 300) {
    return 'pro_annual';
  }

  return 'pro_paged';
}

export interface CloudDeviceRecord {
  deviceId: string;
  cliente: string;
  deviceLabel: string;
  firstSeenAt: number;
  lastSeenAt: number;
  totalSessions: number;
  totalMinutes: number;
  activeDays: string[];
  proActive: boolean;
  planCode: string;
  planLabel: string;
  status?: 'free' | 'pro' | 'blocked';
  tipo?: 'pagado' | 'prueba_gratis';
  expiresAt: number | null;
  lastKey: string;
  updatedAt: number;
  revoked?: boolean;
  revokedAt?: number | null;
  blocked?: boolean;
  blockedAt?: number | null;
  trialActive?: boolean;
  adminAssigned?: boolean;
  linkedEmail?: string;
  promo_colega_usada?: boolean;
  fecha_activacion_colega?: number | null;
  tallerNombre?: string;
  nombreTaller?: string;
  tallerResponsable?: string;
  tallerWhatsapp?: string;
  ubicacion?: string;
  plan?: 'gratis' | 'pro';
  ultimaConexion?: number;
  homeMenuLayout?: unknown;
  termsAcceptedAt?: number | null;
  preferredTheme?: 'dark' | 'light';
  preferredSkin?: 'basica' | 'navidena' | 'ejecutiva' | 'industrial';
  preferredSkinVariant?: string;
}

export const PROMO_COLEGA_ALREADY_USED_ERROR =
  'Este ID ya utilizó su promoción Colega de 3 días anteriormente. Para continuar disfrutando los beneficios, adquiere un plan de 30 días, 90 días o 1 Año';

export function isColleaguePromoPlan(
  planCode?: string | null,
  customDays?: number | null,
  keyCode?: string | null
): boolean {
  const code = String(planCode || '').trim().toUpperCase();
  const key = String(keyCode || '').trim().toUpperCase();
  if (code === 'G' || code === 'D3') return true;
  if (typeof customDays === 'number' && customDays === 3) return true;
  if (/^AP-G-/i.test(key) || /^AP-D3-/i.test(key)) return true;
  return false;
}

export function isFreeTestProRecord(params: {
  tipo?: string | null;
  planCode?: string | null;
  planLabel?: string | null;
  keyCode?: string | null;
  key?: string | null;
}): boolean {
  if (params.tipo === 'prueba_gratis') return true;
  const code = String(params.planCode || '').trim().toUpperCase();
  const key = String(params.keyCode || params.key || '').trim().toUpperCase();
  const label = String(params.planLabel || '').toLowerCase();
  if (code === 'P' || /^AP-P-/i.test(key)) return true;
  if (/cortes[ií]a|prueba\s*(gratis|interna)|sin\s*costo|prueba\s*\/\s*cortes/.test(label)) {
    return true;
  }
  return false;
}

export function isUnassignedAutoTrialDevice(
  dev:
    | Pick<CloudDeviceRecord, 'lastKey' | 'adminAssigned' | 'trialActive' | 'planCode' | 'proActive'>
    | null
    | undefined
): boolean {
  if (!dev) return false;
  const hasKey = Boolean(String(dev.lastKey || '').trim());
  const isAssigned = Boolean(dev.adminAssigned);
  if (hasKey || isAssigned) return false;
  return Boolean(dev.trialActive || dev.planCode === 'G' || dev.proActive);
}

export interface UsageStats30d {
  activeUsers30d: number;
  totalDevices: number;
  proActiveDevices: number;
  avgMinutesPerUser30d: number;
  avgSessionsPerUser30d: number;
  avgActiveDaysPerUser30d: number;
}

export interface DailyUsagePoint30d {
  date: string;
  label: string;
  activeUsers: number;
  avgMinutes: number;
}

export function computeUsageStats30d(
  devices: CloudDeviceRecord[],
  now = Date.now()
): UsageStats30d {
  const cutoffMs = now - 30 * 24 * 60 * 60 * 1000;
  const cutoffDateStr = new Date(cutoffMs).toISOString().slice(0, 10);

  const activeList = devices.filter((d) => d.lastSeenAt >= cutoffMs);
  const activeUsers30d = activeList.length;
  const totalDevices = devices.length;
  const proActiveDevices = devices.filter(
    (d) =>
      !d.revoked &&
      !d.blocked &&
      d.planCode !== 'FREE' &&
      d.planCode !== 'REVOKED' &&
      d.planCode !== 'BLOCKED' &&
      d.planCode !== 'SESSION_MOVED' &&
      d.proActive &&
      (d.expiresAt === null || d.expiresAt > now)
  ).length;

  if (activeUsers30d === 0) {
    return {
      activeUsers30d: 0,
      totalDevices,
      proActiveDevices,
      avgMinutesPerUser30d: 0,
      avgSessionsPerUser30d: 0,
      avgActiveDaysPerUser30d: 0,
    };
  }

  let totalMinutes = 0;
  let totalSessions = 0;
  let totalDays = 0;

  for (const d of activeList) {
    totalMinutes += Math.max(0, Number(d.totalMinutes) || 0);
    totalSessions += Math.max(0, Number(d.totalSessions) || 0);
    const daysInWindow = Array.isArray(d.activeDays)
      ? d.activeDays.filter((day) => day >= cutoffDateStr).length
      : 0;
    totalDays += Math.max(1, daysInWindow);
  }

  return {
    activeUsers30d,
    totalDevices,
    proActiveDevices,
    avgMinutesPerUser30d: Math.round((totalMinutes / activeUsers30d) * 10) / 10,
    avgSessionsPerUser30d: Math.round((totalSessions / activeUsers30d) * 10) / 10,
    avgActiveDaysPerUser30d: Math.round((totalDays / activeUsers30d) * 10) / 10,
  };
}

export function buildDailyUsageSeries30d(
  devices: CloudDeviceRecord[],
  now = Date.now()
): DailyUsagePoint30d[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const points: DailyUsagePoint30d[] = [];

  for (let i = 29; i >= 0; i -= 1) {
    const ts = now - i * dayMs;
    const d = new Date(ts);
    const dateStr = d.toISOString().slice(0, 10);
    const label = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

    let activeUsers = 0;
    let totalMinutesDay = 0;

    for (const dev of devices) {
      const lastDay = new Date(dev.lastSeenAt || 0).toISOString().slice(0, 10);
      const hasDay = Array.isArray(dev.activeDays) && dev.activeDays.includes(dateStr);
      if (hasDay || lastDay === dateStr) {
        activeUsers += 1;
        const activeCount = Math.max(1, Array.isArray(dev.activeDays) ? dev.activeDays.length : 1);
        totalMinutesDay += (Math.max(0, Number(dev.totalMinutes) || 0)) / activeCount;
      }
    }

    points.push({
      date: dateStr,
      label,
      activeUsers,
      avgMinutes: activeUsers > 0 ? Math.round((totalMinutesDay / activeUsers) * 10) / 10 : 0,
    });
  }

  return points;
}

export function formatClientPhoneInput(rawValue: string, previousFormatted?: string): string {
  let digits = String(rawValue || '').replace(/\D/g, '').slice(0, 10);

  if (
    previousFormatted !== undefined &&
    String(rawValue || '').length < previousFormatted.length &&
    digits === previousFormatted.replace(/\D/g, '').slice(0, 10) &&
    digits.length > 0
  ) {
    digits = digits.slice(0, -1);
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function formatCombinedClientLabel(nombre: string, telefono?: string): string {
  const cleanName = String(nombre || '').trim().replace(/\s+/g, ' ');
  const formattedPhone = formatClientPhoneInput(String(telefono || ''));
  if (cleanName && formattedPhone) return `${cleanName} · ${formattedPhone}`;
  return cleanName || formattedPhone;
}

export function formatClientHeaderDisplay(rawCliente?: string): string {
  const clean = String(rawCliente || '').trim();
  if (!clean) return 'Cliente sin nombre';
  if (clean.includes(' · ')) {
    const [left, right] = clean.split(' · ');
    const leftTrim = (left || '').trim();
    const rightTrim = (right || '').trim();
    const digitsOnly = rightTrim.replace(/\D/g, '');
    const formattedPhone = digitsOnly.length >= 7 && digitsOnly.length <= 10 && /^[\d\s()-]+$/.test(rightTrim)
      ? formatClientPhoneInput(digitsOnly)
      : rightTrim;
    if (leftTrim && formattedPhone) return `${leftTrim} · ${formattedPhone}`;
    return leftTrim || formattedPhone || 'Cliente sin nombre';
  }
  const trailingDigitsMatch = clean.match(/^(.*?)\s+(\d{7,10})$/);
  if (trailingDigitsMatch) {
    const namePart = trailingDigitsMatch[1].trim();
    const phonePart = formatClientPhoneInput(trailingDigitsMatch[2]);
    if (namePart && phonePart) return `${namePart} · ${phonePart}`;
  }
  return clean;
}

export const TRAMO_COMPROMETIDO_M = 6;

export interface ObraAprobadaMetrosInfo {
  tramos: number;
  tramosAsignados: number;
  metrosComprometidos: number;
  metrosLibres: number;
  resumenTexto: string;
}

export function calcularMetrosObraAprobada(
  tramosRaw: number,
  largoTramoM = TRAMO_COMPROMETIDO_M
): ObraAprobadaMetrosInfo {
  const tramos = Math.max(0, Number(tramosRaw) || 0);
  const metrosComprometidos = round2(tramos * largoTramoM);
  const tramosAsignados = tramos > 0 ? Math.ceil(round2(tramos)) : 0;
  const metrosLibres = round2(Math.max(0, tramosAsignados * largoTramoM - metrosComprometidos));
  const resumenTexto =
    metrosLibres > 0
      ? `${metrosComprometidos.toFixed(2)} m comprometidos · ${metrosLibres.toFixed(2)} m libres del tramo de ${largoTramoM} m`
      : `${metrosComprometidos.toFixed(2)} m comprometidos · 0.00 m libres`;
  return {
    tramos,
    tramosAsignados,
    metrosComprometidos,
    metrosLibres,
    resumenTexto,
  };
}

export interface ResumenObrasAprobadasMetros {
  totalApartados: number;
  totalTramos: number;
  totalMetrosComprometidos: number;
  totalMetrosLibres: number;
}

export function resumirObrasAprobadas(
  obras: Array<{ tramos: number }>,
  largoTramoM = TRAMO_COMPROMETIDO_M
): ResumenObrasAprobadasMetros {
  let totalTramos = 0;
  let totalMetrosComprometidos = 0;
  let totalMetrosLibres = 0;
  for (const ob of obras) {
    const info = calcularMetrosObraAprobada(ob.tramos, largoTramoM);
    totalTramos = round2(totalTramos + info.tramos);
    totalMetrosComprometidos = round2(totalMetrosComprometidos + info.metrosComprometidos);
    totalMetrosLibres = round2(totalMetrosLibres + info.metrosLibres);
  }
  return {
    totalApartados: obras.length,
    totalTramos,
    totalMetrosComprometidos,
    totalMetrosLibres,
  };
}

export const INVENTARIO_DEFAULT_MARCA = 'Alumer';

export interface ParsedInventarioKey {
  linea: LineaId;
  perfilId: PerfilCatalogoId;
  color: ColorId;
  marca: string;
}

export function normalizeColorId(raw?: string): ColorId {
  const clean = String(raw || '').trim().toLowerCase() as ColorId;
  if (clean && Object.prototype.hasOwnProperty.call(COLORES_CONFIG, clean)) {
    return clean;
  }
  return 'natural';
}

export function makeInventarioKey(
  linea: LineaId,
  perfilId: PerfilCatalogoId,
  color: ColorId,
  marca?: string
): string {
  const validColor = normalizeColorId(color);
  const cleanMarca = String(marca || '')
    .trim()
    .replace(/__/g, ' ')
    .replace(/\s+/g, ' ');
  return cleanMarca
    ? `${linea}__${perfilId}__${validColor}__${cleanMarca}`
    : `${linea}__${perfilId}__${validColor}`;
}

export function parseInventarioKey(key: string): ParsedInventarioKey {
  const parts = String(key || '').split('__');
  const linea = (parts[0] || '3') as LineaId;
  const perfilId = (parts[1] || 'cabezal') as PerfilCatalogoId;
  const color = normalizeColorId(parts[2]);
  const marca = parts.length > 3 ? parts.slice(3).join(' ').trim() : '';
  return { linea, perfilId, color, marca };
}

export function getInventarioTramosPorPerfilColor(
  inventario: Record<string, number>,
  linea: LineaId,
  perfilId: PerfilCatalogoId,
  color: ColorId
): number {
  const normLinea = normalizeLineaId(linea);
  const targetColor = normalizeColorId(color);
  let total = 0;
  for (const [k, rawVal] of Object.entries(inventario || {})) {
    const val = Number(rawVal) || 0;
    if (val <= 0) continue;
    const parsed = parseInventarioKey(k);
    if (
      normalizeLineaId(parsed.linea) === normLinea &&
      parsed.perfilId === perfilId &&
      parsed.color === targetColor
    ) {
      total = round2(total + val);
    }
  }
  return total;
}

export function descontarInventarioPorPerfilColor(
  inventario: Record<string, number>,
  linea: LineaId,
  perfilId: PerfilCatalogoId,
  color: ColorId,
  tramosRequeridos: number
): Record<string, number> {
  const next: Record<string, number> = { ...inventario };
  const normLinea = normalizeLineaId(linea);
  const targetColor = normalizeColorId(color);
  let restante = Math.max(0, round2(Number(tramosRequeridos) || 0));
  if (restante <= 0) return next;

  const matchingKeys = Object.keys(next)
    .filter((k) => {
      const val = Number(next[k]) || 0;
      if (val <= 0) return false;
      const parsed = parseInventarioKey(k);
      return (
        normalizeLineaId(parsed.linea) === normLinea &&
        parsed.perfilId === perfilId &&
        parsed.color === targetColor
      );
    })
    .sort((a, b) => a.split('__').length - b.split('__').length);

  for (const k of matchingKeys) {
    if (restante <= 0) break;
    const disponible = Math.max(0, round2(Number(next[k]) || 0));
    const descontar = Math.min(disponible, restante);
    const nuevoValor = round2(disponible - descontar);
    if (nuevoValor <= 0) {
      delete next[k];
    } else {
      next[k] = nuevoValor;
    }
    restante = round2(restante - descontar);
  }

  return next;
}

export type CloudEmailValidationStatus =
  | 'empty'
  | 'invalid_format'
  | 'pending_confirm'
  | 'mismatch'
  | 'confirmed';

export interface CloudEmailValidationResult {
  status: CloudEmailValidationStatus;
  normalizedEmail: string;
  message: string;
}

export function keyRequiresCloudEmailConfirmation(rawKey: string): boolean {
  const clean = String(rawKey || '').trim().toUpperCase();
  if (!clean) return false;
  const parts = clean.split('-');
  if (parts.length >= 2 && parts[0] === 'AP') {
    const code = parts[1];
    if (code === 'Q' || code === 'A') return true;
    const customMatch = /^D(\d+)$/.exec(code);
    if (customMatch) {
      return Number(customMatch[1]) >= 90;
    }
    return false;
  }
  return false;
}

export function isShortPlanKeyPrefix(rawKey: string): boolean {
  const clean = String(rawKey || '').trim().toUpperCase();
  const parts = clean.split('-');
  if (parts.length >= 2 && parts[0] === 'AP') {
    const code = parts[1];
    if (code === 'G' || code === 'M') return true;
    const customMatch = /^D(\d+)$/.exec(code);
    if (customMatch) {
      const days = Number(customMatch[1]);
      return days > 0 && days < 90;
    }
  }
  return false;
}

export function validateCloudBackupEmailPair(
  emailRaw: string,
  confirmEmailRaw: string
): CloudEmailValidationResult {
  const email = String(emailRaw || '').trim().toLowerCase();
  const confirm = String(confirmEmailRaw || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!email && !confirm) {
    return {
      status: 'empty',
      normalizedEmail: '',
      message: 'Ingresa y confirma tu correo para el respaldo en la nube',
    };
  }
  if (!emailRegex.test(email) || email.length > 160) {
    return {
      status: 'invalid_format',
      normalizedEmail: '',
      message: 'Ingresa un correo electrónico válido (ej. nombre@correo.com)',
    };
  }
  if (!confirm) {
    return {
      status: 'pending_confirm',
      normalizedEmail: '',
      message: 'Confirma tu correo electrónico para habilitar la activación',
    };
  }
  if (email !== confirm) {
    return {
      status: 'mismatch',
      normalizedEmail: '',
      message: 'Los correos no coinciden',
    };
  }
  return {
    status: 'confirmed',
    normalizedEmail: email,
    message: 'Correo confirmado',
  };
}

export interface ParsedColleagueReferral {
  refName: string;
  promoNumber: number;
}

export const OFFICIAL_ALUMINERO_URL = APP_SHARE_URL;

export function sanitizeReferralSenderName(raw: string): string {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

export function buildReferralInviteUrl(senderName: string, promoNumber: number): string {
  const cleanName = sanitizeReferralSenderName(senderName) || 'Un colega';
  const safePromo = Math.max(1, Math.round(Number(promoNumber) || 1));
  const params = new URLSearchParams();
  params.set('ref', cleanName);
  params.set('promo', String(safePromo));
  return `${getOfficialShareUrl()}/?${params.toString()}`;
}

export function parseReferralFromSearch(search: string): ParsedColleagueReferral | null {
  try {
    const cleanSearch = String(search || '').trim();
    if (!cleanSearch) return null;
    const params = new URLSearchParams(cleanSearch.startsWith('?') ? cleanSearch.slice(1) : cleanSearch);
    const rawRef = params.get('ref');
    if (!rawRef) return null;
    const explicitName = params.get('refName') || params.get('taller') || '';
    const refName = sanitizeReferralSenderName(explicitName || rawRef);
    if (!refName) return null;
    const rawPromo = params.get('promo');
    const parsedPromo = rawPromo ? parseInt(rawPromo, 10) : 1;
    const promoNumber = Number.isFinite(parsedPromo) && parsedPromo >= 1 ? parsedPromo : 1;
    return { refName, promoNumber };
  } catch {
    return null;
  }
}

export interface ColleaguePromoTallerMeta {
  tallerNombre?: string;
  tallerTel?: string;
  referredById?: string | null;
}

export function buildColleaguePromoWhatsappMessage(
  refName: string,
  deviceId: string,
  promoNumber: number,
  tallerMeta?: ColleaguePromoTallerMeta
): string {
  const cleanRef = sanitizeReferralSenderName(refName) || 'Un colega';
  const cleanDev = String(deviceId || '').trim().toUpperCase() || 'SIN-ID';
  const safePromo = Math.max(1, Math.round(Number(promoNumber) || 1));

  if (tallerMeta && (tallerMeta.tallerNombre || tallerMeta.tallerTel || tallerMeta.referredById)) {
    const tName = String(tallerMeta.tallerNombre || '').trim() || 'Mi Taller';
    const tTel = formatMxPhoneDashed(String(tallerMeta.tallerTel || '')) || String(tallerMeta.tallerTel || '').trim() || 'Sin teléfono';
    const refIdPart = tallerMeta.referredById ? `${tallerMeta.referredById} · ` : '';
    return [
      'Hola, solicito mi clave de prueba de 3 días (Promoción Colega) para Aluminero Pro.',
      `Taller / Cliente: ${tName}`,
      `WhatsApp: ${tTel}`,
      `ID de equipo: ${cleanDev}`,
      `Invitado por: ${cleanRef} (${refIdPart}Promo #${safePromo})`,
    ].join('\n');
  }

  return `Hola, me llegó este mensaje de un colega (${cleanRef}) para probar Aluminero Pro. Mi ID de equipo es: ${cleanDev} (Promoción enviada #${safePromo}). ¿Me compartes mi código de 3 días gratis?`;
}

export function buildColleaguePromoWhatsappUrl(
  whatsappDigitsRaw: string,
  refName: string,
  deviceId: string,
  promoNumber: number,
  tallerMeta?: ColleaguePromoTallerMeta
): string {
  const digits = String(whatsappDigitsRaw || '').replace(/\D+/g, '');
  const fullNumber =
    digits.length === 10
      ? `52${digits}`
      : digits.length > 10
        ? digits
        : '';
  const msg = buildColleaguePromoWhatsappMessage(refName, deviceId, promoNumber, tallerMeta);
  return fullNumber
    ? `https://wa.me/${fullNumber}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export interface DimensionValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePiezaDimensiones(
  anchoCm: number,
  altoCm: number
): DimensionValidationResult {
  const ancho = Number(anchoCm);
  const alto = Number(altoCm);
  if (!Number.isFinite(ancho) || !Number.isFinite(alto)) {
    return {
      valid: false,
      error: 'Medidas sospechosas: el ancho y el alto deben ser valores numéricos válidos.',
    };
  }
  if (ancho <= 0 || alto <= 0) {
    return {
      valid: false,
      error: `Medidas sospechosas (${ancho} × ${alto} cm): el ancho y el alto deben ser mayores a 0 cm.`,
    };
  }
  if (ancho >= 600 || alto >= 600) {
    return {
      valid: false,
      error: `Medidas sospechosas (${ancho} × ${alto} cm): el ancho y el alto deben ser menores a 600 cm.`,
    };
  }
  return { valid: true };
}

// ==================== LÍNEAS Y PERFILES COMERCIALES DE MÉXICO ====================

export type MexicoAluminumCategoryId = 'nacional' | 'espanola' | 'europea' | 'estructural';

export interface MexicoAluminumSystemItem {
  id: string;
  categoria: MexicoAluminumCategoryId;
  nombre: string;
  fabricantes: string;
  tipoCorte: string;
  cristalRecomendado: string;
  aplicacion: string;
  quickLabel: string;
}

export interface MexicoAluminumCategoryMeta {
  id: MexicoAluminumCategoryId;
  titulo: string;
  subtitulo: string;
  corteBadge: string;
  accentClass: string;
}

export const MEXICO_ALUMINUM_CATEGORIES: MexicoAluminumCategoryMeta[] = [
  {
    id: 'nacional',
    titulo: 'Línea Nacional (Tradicional / Panorama)',
    subtitulo: 'Cuprum, Indalum, Alumer · 1 ⅜", 1 ½", 2", 3", 4" y 4 ½"',
    corteBadge: 'Cortes rectos a 90°',
    accentClass: 'blue',
  },
  {
    id: 'espanola',
    titulo: 'Línea Española (Extrusiones Metálicas)',
    subtitulo: 'Series 1400, 3500, 4000, 4600 y 10000',
    corteBadge: 'Cortes a 45° · Templado 6–10 mm',
    accentClass: 'amber',
  },
  {
    id: 'europea',
    titulo: 'Línea Europea (Eurovent / Euroalum)',
    subtitulo: 'Ligeras/medias (35–70 mm), pesadas (80–150 mm) y Muro Cortina',
    corteBadge: 'Cortes a 45° · Doble cristal / Duovent',
    accentClass: 'emerald',
  },
  {
    id: 'estructural',
    titulo: 'Perfiles Estructurales e Industriales',
    subtitulo: 'PTR, ángulos, soleras, canales (U), tees (T), duelas, louvers y V-Slot',
    corteBadge: 'Industrial / Arquitectónico',
    accentClass: 'violet',
  },
];

export const MEXICO_ALUMINUM_SYSTEMS: MexicoAluminumSystemItem[] = [
  // 1. Línea Nacional (Tradicional / Panorama — Cuprum, Indalum)
  {
    id: 'nac-1-3-8',
    categoria: 'nacional',
    nombre: 'Línea Nacional 1 ⅜" (Bolsa / Fijo Ligero)',
    fabricantes: 'Cuprum · Indalum · Panorama',
    tipoCorte: 'Corte recto a 90°',
    cristalRecomendado: 'Vidrio claro 3 a 6 mm',
    aplicacion: 'Cancel de baño económico, fijos ligeros y mosquiteros.',
    quickLabel: 'Nacional 1 ⅜"',
  },
  {
    id: 'nac-1-1-2',
    categoria: 'nacional',
    nombre: 'Línea Nacional 1 ½" (Tradicional)',
    fabricantes: 'Cuprum · Indalum · Panorama',
    tipoCorte: 'Corte recto a 90°',
    cristalRecomendado: 'Vidrio claro 4 a 6 mm',
    aplicacion: 'Ventanas corredizas económicas, fijos y divisiones interiores.',
    quickLabel: 'Nacional 1 ½"',
  },
  {
    id: 'nac-2',
    categoria: 'nacional',
    nombre: 'Línea Nacional 2" (Panorama / Tradicional)',
    fabricantes: 'Cuprum · Indalum · Alumer',
    tipoCorte: 'Corte recto a 90°',
    cristalRecomendado: 'Vidrio claro / Filtrasol 4 a 6 mm',
    aplicacion: 'Ventanas residenciales estándar, puertas ligeras y guillotina.',
    quickLabel: 'Línea 2"',
  },
  {
    id: 'nac-3',
    categoria: 'nacional',
    nombre: 'Línea Nacional 3" (Panorama / Alumer)',
    fabricantes: 'Cuprum · Indalum · Alumer',
    tipoCorte: 'Corte recto a 90°',
    cristalRecomendado: 'Vidrio claro / Templado 6 mm',
    aplicacion: 'Ventanales corredizos, fijos 3" y cancelería residencial reforzada.',
    quickLabel: 'Línea 3"',
  },
  {
    id: 'nac-4',
    categoria: 'nacional',
    nombre: 'Línea Nacional 4" (Comercial)',
    fabricantes: 'Cuprum · Indalum · Panorama',
    tipoCorte: 'Corte recto a 90°',
    cristalRecomendado: 'Cristal 6 a 9.5 mm / Templado',
    aplicacion: 'Frentes comerciales, escaparates, accesos pesados y claros altos.',
    quickLabel: 'Nacional 4"',
  },
  {
    id: 'nac-4-1-2',
    categoria: 'nacional',
    nombre: 'Línea Nacional 4 ½" (Estructural Comercial)',
    fabricantes: 'Cuprum · Indalum · Panorama',
    tipoCorte: 'Corte recto a 90°',
    cristalRecomendado: 'Cristal templado 6 a 10 mm',
    aplicacion: 'Fachadas comerciales de gran altura y accesos de tráfico intenso.',
    quickLabel: 'Nacional 4 ½"',
  },
  // 2. Línea Española (Extrusiones Metálicas)
  {
    id: 'esp-1400',
    categoria: 'espanola',
    nombre: 'Línea Española Serie 1400',
    fabricantes: 'Extrusiones Metálicas',
    tipoCorte: 'Corte a 45° con escuadras',
    cristalRecomendado: 'Cristal templado 6 a 10 mm',
    aplicacion: 'Ventanas abatibles, proyectantes y fijos perimetrales herméticos.',
    quickLabel: 'Española S-1400',
  },
  {
    id: 'esp-3500',
    categoria: 'espanola',
    nombre: 'Línea Española Serie 3500',
    fabricantes: 'Extrusiones Metálicas',
    tipoCorte: 'Corte a 45° con escuadras',
    cristalRecomendado: 'Cristal templado 6 a 10 mm',
    aplicacion: 'Ventanas corredizas residenciales de cierre perimetral y alta hermeticidad.',
    quickLabel: 'Española S-3500',
  },
  {
    id: 'esp-4000',
    categoria: 'espanola',
    nombre: 'Línea Española Serie 4000',
    fabricantes: 'Extrusiones Metálicas',
    tipoCorte: 'Corte a 45° con escuadras',
    cristalRecomendado: 'Cristal templado 6 a 10 mm',
    aplicacion: 'Puertas abatibles, fijos y ventanales comerciales de estilo español.',
    quickLabel: 'Española S-4000',
  },
  {
    id: 'esp-4600',
    categoria: 'espanola',
    nombre: 'Línea Española Serie 4600',
    fabricantes: 'Extrusiones Metálicas',
    tipoCorte: 'Corte a 45° con escuadras',
    cristalRecomendado: 'Cristal templado 6 a 10 mm',
    aplicacion: 'Corredizas pesadas y ventanales panorámicos con riel reforzado.',
    quickLabel: 'Española S-4600',
  },
  {
    id: 'esp-10000',
    categoria: 'espanola',
    nombre: 'Línea Española Serie 10000',
    fabricantes: 'Extrusiones Metálicas',
    tipoCorte: 'Corte a 45° con escuadras',
    cristalRecomendado: 'Cristal templado 6 a 10 mm',
    aplicacion: 'Puertas monumentales, canceles pesados y proyectos residenciales de lujo.',
    quickLabel: 'Española S-10000',
  },
  // 3. Línea Europea (Eurovent / Euroalum)
  {
    id: 'eur-ligeras',
    categoria: 'europea',
    nombre: 'Línea Europea Series Ligeras/Medias (35, 45, 50, 60, 70 mm)',
    fabricantes: 'Eurovent · Euroalum',
    tipoCorte: 'Corte a 45° con escuadras de inyección',
    cristalRecomendado: 'Cristal sencillo o Doble cristal / Duovent',
    aplicacion: 'Ventanas corredizas, abatibles, oscilobatientes y puertas residenciales.',
    quickLabel: 'Europea S-70 (35–70 mm)',
  },
  {
    id: 'eur-35-50',
    categoria: 'europea',
    nombre: 'Línea Europea Serie 35 / 45 / 50 mm',
    fabricantes: 'Eurovent · Euroalum',
    tipoCorte: 'Corte a 45°',
    cristalRecomendado: 'Vidrio claro 6 mm o Duovent',
    aplicacion: 'Ventanas practicables, proyectantes y corredizas serie ligera/media.',
    quickLabel: 'Europea 35/45/50 mm',
  },
  {
    id: 'eur-60-70',
    categoria: 'europea',
    nombre: 'Línea Europea Serie 60 / 70 mm',
    fabricantes: 'Eurovent · Euroalum',
    tipoCorte: 'Corte a 45°',
    cristalRecomendado: 'Doble cristal / Duovent hasta 24 mm',
    aplicacion: 'Corredizas y abatibles de alto aislamiento acústico y térmico.',
    quickLabel: 'Europea 60/70 mm',
  },
  {
    id: 'eur-pesadas',
    categoria: 'europea',
    nombre: 'Línea Europea Series Pesadas (80, 100, 150 mm)',
    fabricantes: 'Eurovent · Euroalum',
    tipoCorte: 'Corte a 45° reforzado',
    cristalRecomendado: 'Doble cristal / Duovent / Templado laminado',
    aplicacion: 'Grandes ventanales piso a techo, corredizas elevables y puertas monumentales.',
    quickLabel: 'Europea Pesada 80–150 mm',
  },
  {
    id: 'eur-muro-cortina',
    categoria: 'europea',
    nombre: 'Línea Europea Muro Cortina (Fachada Integral)',
    fabricantes: 'Eurovent · Euroalum · Cuprum',
    tipoCorte: 'Corte a 45° / 90° estructural',
    cristalRecomendado: 'Doble cristal / Duovent / Control solar templado',
    aplicacion: 'Fachadas acristaladas de edificios corporativos y torres comerciales.',
    quickLabel: 'Muro Cortina',
  },
  // 4. Perfiles Estructurales e Industriales
  {
    id: 'est-ptr',
    categoria: 'estructural',
    nombre: 'Tubulares de Aluminio (PTR Cuadrado / Rectangular)',
    fabricantes: 'Cuprum · Indalum · Extrusoras MX',
    tipoCorte: 'Corte a 90° o 45°',
    cristalRecomendado: 'Pérgolas, portones, rejas y marcos estructurales',
    aplicacion: 'Estructuras ligeras, pérgolas, marcos portantes y barandales.',
    quickLabel: 'Tubular PTR',
  },
  {
    id: 'est-angulos-soleras',
    categoria: 'estructural',
    nombre: 'Ángulos (L) y Soleras de Aluminio',
    fabricantes: 'Cuprum · Indalum · Extrusoras MX',
    tipoCorte: 'Corte a 90° o 45°',
    cristalRecomendado: 'Remates, escuadras y refuerzos',
    aplicacion: 'Remates perimetrales, molduras, soportes y escuadras de armado.',
    quickLabel: 'Ángulo / Solera',
  },
  {
    id: 'est-canales-tees',
    categoria: 'estructural',
    nombre: 'Canales (U) y Tees (T) de Aluminio',
    fabricantes: 'Cuprum · Indalum · Extrusoras MX',
    tipoCorte: 'Corte recto a 90°',
    cristalRecomendado: 'Vidrio templado 6 a 12 mm / paneles',
    aplicacion: 'Sujeción de cristales fijos, canceles templados, plafones y divisiones.',
    quickLabel: 'Canal U / Tee T',
  },
  {
    id: 'est-duelas-louvers',
    categoria: 'estructural',
    nombre: 'Duelas y Louvers Arquitectónicos',
    fabricantes: 'Cuprum · Indalum · Alumer',
    tipoCorte: 'Corte recto a 90°',
    cristalRecomendado: 'Panel ciego / celosía ventilada',
    aplicacion: 'Puertas entableradas, portones, celosías, parasoles y fachadas ventiladas.',
    quickLabel: 'Duela / Louver',
  },
  {
    id: 'est-vslot',
    categoria: 'estructural',
    nombre: 'Perfiles Modulares Industriales tipo V-Slot / T-Slot',
    fabricantes: 'Extrusión Industrial MX',
    tipoCorte: 'Corte de precisión a 90°',
    cristalRecomendado: 'Policarbonato / acrílico / guardas',
    aplicacion: 'Automatización, guardas industriales, mesas de corte CNC y estructuras modulares.',
    quickLabel: 'Perfil V-Slot',
  },
];

// ==================== VALIDACIÓN REALISTA DE MEDIDAS (LEVANTAMIENTO) ====================

export const LEV_MIN_CM = 15;
export const LEV_MAX_CM = 500;

export function validateLevantamientoStrictRange(
  anchoCm: number,
  altoCm: number
): DimensionValidationResult {
  const ancho = Number(anchoCm);
  const alto = Number(altoCm);
  if (!Number.isFinite(ancho) || !Number.isFinite(alto) || ancho <= 0 || alto <= 0) {
    return {
      valid: false,
      error: 'Medidas inválidas: ingresa ancho y alto numéricos mayores a 0 cm.',
    };
  }
  if (ancho < LEV_MIN_CM || alto < LEV_MIN_CM) {
    return {
      valid: false,
      error: `Error de rango (${ancho} × ${alto} cm): las medidas no pueden ser menores a ${LEV_MIN_CM} cm. Verifica ancho y alto (rango permitido: ${LEV_MIN_CM} cm a ${LEV_MAX_CM} cm).`,
    };
  }
  if (ancho > LEV_MAX_CM || alto > LEV_MAX_CM) {
    return {
      valid: false,
      error: `Error de rango (${ancho} × ${alto} cm): las medidas no pueden superar ${LEV_MAX_CM} cm. Verifica ancho y alto (rango permitido: ${LEV_MIN_CM} cm a ${LEV_MAX_CM} cm).`,
    };
  }
  return { valid: true };
}

export function validateRealisticOpeningDimensions(
  anchoCm: number,
  altoCm: number,
  tipo: string = 'Ventana Corrediza'
): DimensionValidationResult {
  const strictRange = validateLevantamientoStrictRange(anchoCm, altoCm);
  if (!strictRange.valid) {
    return strictRange;
  }

  const ancho = Number(anchoCm);
  const alto = Number(altoCm);
  const tipoLower = String(tipo || '').trim().toLowerCase();
  const isPuerta = tipoLower.includes('puerta');
  const isCancel = tipoLower.includes('cancel');

  if (isPuerta) {
    if (ancho < 50 || alto < 150) {
      return {
        valid: false,
        error: `Medida inválida para puerta (${ancho} × ${alto} cm): una puerta real debe medir al menos 50 cm de ancho × 150 cm de alto (máximo ${LEV_MAX_CM} cm).`,
      };
    }
  } else if (isCancel) {
    if (ancho < 30 || alto < 40) {
      return {
        valid: false,
        error: `Medida inválida para cancel (${ancho} × ${alto} cm): verifica las dimensiones reales (mínimo 30 × 40 cm, máximo ${LEV_MAX_CM} cm).`,
      };
    }
  } else {
    if (ancho < 25 || alto < 25 || ancho * alto < 900) {
      return {
        valid: false,
        error: `Medida irreal o inválida (${ancho} × ${alto} cm): una ventana real debe medir al menos 30 × 30 cm (rango permitido: ${LEV_MIN_CM} cm a ${LEV_MAX_CM} cm). Verifica si ingresaste metros en lugar de centímetros.`,
      };
    }
  }

  const ratio = Math.max(ancho / alto, alto / ancho);
  if (ratio > 12) {
    return {
      valid: false,
      error: `Proporción irreal (${ancho} × ${alto} cm): revisa que el ancho y el alto estén en la misma unidad (cm o m).`,
    };
  }

  return { valid: true };
}

// ==================== TELÉFONO ALEATORIO DE EJEMPLO (MX) ====================

const MX_RANDOM_LADAS = ['55', '33', '81', '222', '442', '999', '664', '777', '477', '614'];

export function generateRandomMxPhonePlaceholder(rng: () => number = Math.random): string {
  const ladaIdx = Math.floor(Math.abs(rng()) * MX_RANDOM_LADAS.length) % MX_RANDOM_LADAS.length;
  const lada = MX_RANDOM_LADAS[ladaIdx];
  const remainingLen = 10 - lada.length;
  let rest = '';
  for (let i = 0; i < remainingLen; i += 1) {
    rest += String(Math.floor(Math.abs(rng()) * 10) % 10);
  }
  const full = `${lada}${rest}`;
  // Nunca retornar el número fijo antiguo
  if (full === '7351631532') {
    return 'Ej. 55-4812-9034';
  }
  if (lada.length === 2) {
    return `Ej. ${full.slice(0, 2)}-${full.slice(2, 6)}-${full.slice(6, 10)}`;
  }
  return `Ej. ${full.slice(0, 3)}-${full.slice(3, 6)}-${full.slice(6, 10)}`;
}

// ==================== DETECTOR DE PLAN ANUAL (1 AÑO PRO) ====================

export function isOneYearProPlan(params: {
  planCode?: string | null;
  planLabel?: string | null;
  activatedKey?: string | null;
  dias?: number | null;
}): boolean {
  const code = String(params.planCode || '').trim().toUpperCase();
  const label = String(params.planLabel || '').toLowerCase();
  const key = String(params.activatedKey || '').trim().toUpperCase();
  const dias = Number(params.dias || 0);
  if (code === 'A' || /^AP-A-/i.test(key)) return true;
  if (Number.isFinite(dias) && dias >= 300) return true;
  if (/1\s*a[ñn]o|anual|365\s*d[ií]as/.test(label)) return true;
  return false;
}

// ==================== ANÁLISIS DE VENTAS (PANEL ADMINISTRADOR) ====================

export interface SalesAnalyticsMaterialItem {
  id: string;
  nombre: string;
  codigo: string;
  linea: string;
  cantidad: number;
  unidad: string;
  pct: number;
}

export interface SalesAnalyticsQuoteInput {
  id: string;
  folio: string;
  fecha: string;
  cliente: string;
  total: number;
  piezasCount?: number;
  estado: 'enviada' | 'aprobada' | 'rechazada';
  createdAt?: number;
  materiales?: Array<{
    id?: string;
    nombre: string;
    codigo?: string;
    linea?: string;
    cantidad: number;
    unidad?: string;
  }>;
}

export interface SalesAnalyticsObraInput {
  proyecto: string;
  linea: LineaId;
  perfilId: PerfilCatalogoId;
  tramos: number;
}

export interface SalesAnalyticsHistorialInput {
  referencia: string;
  linea: LineaId;
  cantidad: number;
  total: number;
}

export interface SalesAnalyticsResult {
  totalQuotesCount: number;
  approvedCount: number;
  sentCount: number;
  rejectedCount: number;
  approvalRatePct: number;
  totalApprovedRevenue: number;
  averageTicket: number;
  minTicket: number;
  maxTicket: number;
  topMaterials: SalesAnalyticsMaterialItem[];
  approvedQuotes: SalesAnalyticsQuoteInput[];
  totalMaterialUnits: number;
}

export function computeSalesAnalytics(params: {
  cotizacionesGuardadas: SalesAnalyticsQuoteInput[];
  obrasAprobadas?: SalesAnalyticsObraInput[];
  historial?: SalesAnalyticsHistorialInput[];
}): SalesAnalyticsResult {
  const allQuotes = Array.isArray(params.cotizacionesGuardadas) ? params.cotizacionesGuardadas : [];
  const obras = Array.isArray(params.obrasAprobadas) ? params.obrasAprobadas : [];
  const historial = Array.isArray(params.historial) ? params.historial : [];

  const approvedQuotes = allQuotes.filter((q) => q && q.estado === 'aprobada');
  const sentCount = allQuotes.filter((q) => q && q.estado === 'enviada').length;
  const rejectedCount = allQuotes.filter((q) => q && q.estado === 'rechazada').length;
  const approvedCount = approvedQuotes.length;
  const totalQuotesCount = allQuotes.length;

  let totalApprovedRevenue = 0;
  let minTicket = Infinity;
  let maxTicket = 0;

  for (const q of approvedQuotes) {
    const val = Math.max(0, Number(q.total) || 0);
    totalApprovedRevenue += val;
    if (val < minTicket) minTicket = val;
    if (val > maxTicket) maxTicket = val;
  }

  const averageTicket = approvedCount > 0 ? round2(totalApprovedRevenue / approvedCount) : 0;
  const approvalRatePct =
    totalQuotesCount > 0 ? Math.round((approvedCount / totalQuotesCount) * 100) : 0;

  const materialMap = new Map<
    string,
    { id: string; nombre: string; codigo: string; linea: string; cantidad: number; unidad: string }
  >();

  const addMat = (
    key: string,
    nombre: string,
    codigo: string,
    linea: string,
    cantidad: number,
    unidad: string
  ) => {
    const qty = Number(cantidad) || 0;
    if (qty <= 0 || !nombre.trim()) return;
    const normKey = key.trim().toLowerCase();
    const existing = materialMap.get(normKey);
    if (existing) {
      existing.cantidad = round2(existing.cantidad + qty);
    } else {
      materialMap.set(normKey, {
        id: normKey,
        nombre: nombre.trim(),
        codigo: codigo.trim(),
        linea: linea.trim(),
        cantidad: round2(qty),
        unidad: unidad.trim() || 'pzas',
      });
    }
  };

  let quotesWithMaterials = 0;
  for (const q of approvedQuotes) {
    if (Array.isArray(q.materiales) && q.materiales.length > 0) {
      quotesWithMaterials += 1;
      for (const m of q.materiales) {
        const key = `${m.id || m.nombre}__${m.linea || ''}`;
        addMat(
          key,
          m.nombre,
          m.codigo || '',
          m.linea || 'General',
          m.cantidad,
          m.unidad || 'pzas'
        );
      }
    }
  }

  // Enriquecer con obras aprobadas (perfiles exactos apartados para obras aprobadas)
  for (const o of obras) {
    const perfilMeta = CATALOGO_PERFILES.find((p) => p.id === o.perfilId);
    const lineaMeta = LINEAS_CONFIG[o.linea];
    const nombre = perfilMeta ? perfilMeta.nombre : String(o.perfilId || 'Perfil');
    const codigo = perfilMeta ? perfilMeta.codigoRef : '';
    const lineaNombre = lineaMeta ? lineaMeta.nombre : String(o.linea || 'Aluminio');
    addMat(`${o.perfilId}__${o.linea}`, nombre, codigo, lineaNombre, o.tramos || 1, 'tramos');
  }

  // Fallback si existen cotizaciones aprobadas antiguas sin detalle de perfiles ni obras apartadas
  if (materialMap.size === 0 && approvedCount > 0 && historial.length > 0) {
    const approvedClientNames = new Set(
      approvedQuotes.map((q) => String(q.cliente || '').trim().toLowerCase()).filter(Boolean)
    );
    const matchedHist = historial.filter((h) => {
      const ref = String(h.referencia || '').trim().toLowerCase();
      return !ref || approvedClientNames.size === 0 || approvedClientNames.has(ref);
    });
    const sourceHist = matchedHist.length > 0 ? matchedHist : historial;
    for (const h of sourceHist) {
      const lineaMeta = LINEAS_CONFIG[h.linea];
      const lineaNombre = lineaMeta ? lineaMeta.nombre : `Línea ${h.linea}`;
      addMat(`linea_${h.linea}`, lineaNombre, h.linea.toUpperCase(), lineaNombre, h.cantidad || 1, 'pzas');
    }
  } else if (quotesWithMaterials === 0 && materialMap.size === 0 && approvedCount > 0) {
    // Último respaldo si las cotizaciones aprobadas no tenían detalle de materiales
    for (const q of approvedQuotes) {
      addMat(
        'cot-general',
        'Perfiles / Piezas cotizadas',
        'GENERAL',
        'Cotización aprobada',
        Math.max(1, Number(q.piezasCount) || 1),
        'pzas'
      );
    }
  }

  const rawMaterials = Array.from(materialMap.values()).sort((a, b) => b.cantidad - a.cantidad);
  const totalMaterialUnits = round2(rawMaterials.reduce((acc, m) => acc + m.cantidad, 0));
  const topMaterials: SalesAnalyticsMaterialItem[] = rawMaterials.slice(0, 12).map((m) => ({
    ...m,
    pct: totalMaterialUnits > 0 ? Math.round((m.cantidad / totalMaterialUnits) * 100) : 0,
  }));

  return {
    totalQuotesCount,
    approvedCount,
    sentCount,
    rejectedCount,
    approvalRatePct,
    totalApprovedRevenue: round2(totalApprovedRevenue),
    averageTicket,
    minTicket: approvedCount > 0 && Number.isFinite(minTicket) ? round2(minTicket) : 0,
    maxTicket: approvedCount > 0 ? round2(maxTicket) : 0,
    topMaterials,
    approvedQuotes,
    totalMaterialUnits,
  };
}

// ==================== VALIDACIÓN CAMPOS OBLIGATORIOS LEVANTAMIENTO ====================

export interface LevantamientoRequiredValidationResult {
  valid: boolean;
  missingFields: string[];
  firstMissingKey: 'cliente' | 'ancho' | 'alto' | 'lineaPerfilOtro' | null;
  message: string;
}

export function validateLevantamientoRequiredFields(input: {
  cliente: string;
  anchoRaw: string | number;
  altoRaw: string | number;
  lineaPerfil?: string;
  lineaPerfilOtro?: string;
  requireCliente?: boolean;
}): LevantamientoRequiredValidationResult {
  const missingFields: string[] = [];
  let firstMissingKey: 'cliente' | 'ancho' | 'alto' | 'lineaPerfilOtro' | null = null;

  const clienteClean = String(input.cliente || '').trim();
  const anchoStr = String(input.anchoRaw ?? '').trim();
  const altoStr = String(input.altoRaw ?? '').trim();
  const anchoNum = Number(anchoStr.replace(',', '.'));
  const altoNum = Number(altoStr.replace(',', '.'));

  if (input.requireCliente !== false && !clienteClean) {
    missingFields.push('Nombre del cliente');
    if (!firstMissingKey) firstMissingKey = 'cliente';
  }
  if (!anchoStr || !Number.isFinite(anchoNum) || anchoNum <= 0) {
    missingFields.push('Ancho');
    if (!firstMissingKey) firstMissingKey = 'ancho';
  }
  if (!altoStr || !Number.isFinite(altoNum) || altoNum <= 0) {
    missingFields.push('Alto');
    if (!firstMissingKey) firstMissingKey = 'alto';
  }
  if (input.lineaPerfil === 'Otra' && !String(input.lineaPerfilOtro || '').trim()) {
    missingFields.push('Línea / perfil personalizado');
    if (!firstMissingKey) firstMissingKey = 'lineaPerfilOtro';
  }

  if (missingFields.length === 0) {
    return { valid: true, missingFields: [], firstMissingKey: null, message: '' };
  }

  const formattedList =
    missingFields.length === 1
      ? missingFields[0]
      : `${missingFields.slice(0, -1).join(', ')} y ${missingFields[missingFields.length - 1]}`;

  return {
    valid: false,
    missingFields,
    firstMissingKey,
    message: `Falta completar antes de agregar: ${formattedList}.`,
  };
}

// ==================== FILTRO BASELINE CONTADORES EN 0 (PANEL ADMIN) ====================

export function filterAdminRecordsByResetBaseline<
  T extends { updatedAt?: number; lastSeenAt?: number; createdAt?: number; firstSeenAt?: number },
>(records: T[], resetAtMs: number): T[] {
  if (!Array.isArray(records) || records.length === 0) return [];
  const baseline = Number(resetAtMs) || 0;
  if (baseline <= 0) return records;
  return records.filter((item) => {
    const ts = Math.max(
      Number(item.updatedAt) || 0,
      Number(item.lastSeenAt) || 0,
      Number(item.createdAt) || 0,
      Number(item.firstSeenAt) || 0
    );
    return ts > baseline;
  });
}

// ==================== ONBOARDING OBLIGATORIO "MI TALLER" ====================

export function isTallerOnboardingComplete(
  taller: { nombre?: string; responsable?: string; tel?: string } | null | undefined
): boolean {
  if (!taller) return false;
  const nombre = String(taller.nombre || '').trim();
  const responsable = String(taller.responsable || '').trim();
  const tel = String(taller.tel || '').trim();
  const telDigits = tel.replace(/\D/g, '');
  return nombre.length >= 2 && responsable.length >= 2 && (telDigits.length >= 7 || tel.length >= 7);
}

// ==================== TUTORIAL INTERACTIVO (4 PASOS) ====================

export interface GuidedTutorialStep {
  step: number;
  badge: string;
  title: string;
  description: string;
  icon: 'levantamiento' | 'modulacion' | 'inventario' | 'pdf';
}

export const GUIDED_TUTORIAL_STEPS: GuidedTutorialStep[] = [
  {
    step: 1,
    badge: 'Paso 1 de 4 · En obra',
    title: 'Levantamiento rápido en campo',
    description:
      'Registra medidas, notas y fotos directamente desde la obra. Olvídate de perder papeles o confundir anchos con altos antes de llegar al taller.',
    icon: 'levantamiento',
  },
  {
    step: 2,
    badge: 'Paso 2 de 4 · Despiece exacto',
    title: 'Modulación y cortes exactos',
    description:
      'Selecciona la línea (3", 2", Europea, Batiente) y obtén el despiece al milímetro, optimización de tramos de 6.10 m y cortes de vidrio en 2D.',
    icon: 'modulacion',
  },
  {
    step: 3,
    badge: 'Paso 3 de 4 · Bodega inteligente',
    title: 'Control de inventario y pedacería',
    description:
      'Registra tus tramos completos, sobrantes y herrajes. Antes de comprar material nuevo, revisa lo que ya tienes disponible en tu taller.',
    icon: 'inventario',
  },
  {
    step: 4,
    badge: 'Paso 4 de 4 · Cierre de ventas',
    title: 'Presupuestos en PDF por WhatsApp',
    description:
      'Genera hojas de cotización con el logo de tu taller, tarifas actualizadas y envíalas al instante a tu cliente para aprobar trabajos más rápido.',
    icon: 'pdf',
  },
];

// ==================== VIDEO TUTORIALES (CATEGORÍAS Y PARSER URL) ====================

export type TutorialVideoCategoryId =
  | 'primeros-pasos'
  | 'ventanas-puertas'
  | 'optimizacion-vidrio'
  | 'cotizaciones-pdf';

export interface TutorialVideoCategoryMeta {
  id: TutorialVideoCategoryId;
  label: string;
  shortLabel: string;
}

export const TUTORIAL_VIDEO_CATEGORIES: TutorialVideoCategoryMeta[] = [
  { id: 'primeros-pasos', label: 'Primeros Pasos', shortLabel: 'Primeros Pasos' },
  { id: 'ventanas-puertas', label: 'Ventanas y Puertas', shortLabel: 'Ventanas/Puertas' },
  { id: 'optimizacion-vidrio', label: 'Optimización 6.10m y Vidrio', shortLabel: '6.10m y Vidrio' },
  { id: 'cotizaciones-pdf', label: 'Cotizaciones PDF', shortLabel: 'Cotizaciones PDF' },
];

export type TutorialVideoProvider = 'youtube' | 'vimeo' | 'gdrive' | 'mp4' | 'local' | 'unknown';

export interface ParsedTutorialVideoUrl {
  valid: boolean;
  provider: TutorialVideoProvider;
  embedUrl: string;
  thumbnailUrl?: string;
  originalUrl: string;
}

export function parseTutorialVideoUrl(rawUrl: string): ParsedTutorialVideoUrl {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return { valid: false, provider: 'unknown', embedUrl: '', originalUrl: '' };
  }
  if (trimmed.startsWith('idb://')) {
    return { valid: true, provider: 'local', embedUrl: trimmed, originalUrl: trimmed };
  }

  // YouTube: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      valid: true,
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      originalUrl: trimmed,
    };
  }

  // Vimeo: vimeo.com/123456789 or player.vimeo.com/video/123456789
  const vimeoMatch = trimmed.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d{6,12})/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const id = vimeoMatch[1];
    return {
      valid: true,
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`,
      originalUrl: trimmed,
    };
  }

  // Google Drive: drive.google.com/file/d/{ID}/view or open?id={ID}
  const driveMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})/i) ||
    trimmed.match(/drive\.google\.com\/open\?id=([A-Za-z0-9_-]{10,})/i);
  if (driveMatch && driveMatch[1]) {
    const id = driveMatch[1];
    return {
      valid: true,
      provider: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      originalUrl: trimmed,
    };
  }

  // Direct MP4 / WebM / MOV / OGG URL
  if (/^https?:\/\/.+\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(trimmed)) {
    return {
      valid: true,
      provider: 'mp4',
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  return { valid: false, provider: 'unknown', embedUrl: trimmed, originalUrl: trimmed };
}

// ==================== LÍMITE DIARIO ASISTENTE (PLAN GRATUITO) ====================

export const FREE_ASSISTANT_DAILY_LIMIT = 3;

export interface AssistantDailyQuotaRecord {
  dateKey: string;
  count: number;
}

export interface AssistantDailyQuotaState {
  usedToday: number;
  remaining: number;
  limit: number;
  isLimited: boolean;
  canSend: boolean;
}

export function computeAssistantDailyQuotaState(
  record: AssistantDailyQuotaRecord | null | undefined,
  todayKey: string,
  proActive: boolean,
  dailyLimit: number = FREE_ASSISTANT_DAILY_LIMIT
): AssistantDailyQuotaState {
  if (proActive) {
    return {
      usedToday: 0,
      remaining: 999,
      limit: dailyLimit,
      isLimited: false,
      canSend: true,
    };
  }
  const sameDay = record && record.dateKey === todayKey;
  const usedToday = sameDay ? Math.max(0, Math.floor(Number(record.count) || 0)) : 0;
  const remaining = Math.max(0, dailyLimit - usedToday);
  return {
    usedToday,
    remaining,
    limit: dailyLimit,
    isLimited: true,
    canSend: remaining > 0,
  };
}

// ==================== FORMATO TELÉFONO XXX-XXX-XX-XX ====================
export function formatMxPhoneDashed(rawValue: string, previousFormatted?: string): string {
  let digits = String(rawValue || '').replace(/\D/g, '').slice(0, 10);

  if (
    previousFormatted !== undefined &&
    String(rawValue || '').length < previousFormatted.length &&
    digits === previousFormatted.replace(/\D/g, '').slice(0, 10) &&
    digits.length > 0
  ) {
    digits = digits.slice(0, -1);
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 8) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}

// ==================== BADGE SUPERIOR DE ESTADO + CUENTA REGRESIVA ====================
export interface LicenseCountdownBadgeResult {
  text: string;
  isPro: boolean;
  isTrial: boolean;
  days: number;
  hours: number;
}

export function formatLicenseCountdownBadge(
  licencia: { active: boolean; planCode?: string; planLabel?: string; expiresAt: number | null } | null | undefined,
  trialExpiresAt: number | null | undefined,
  nowTs: number = Date.now()
): LicenseCountdownBadgeResult {
  if (licencia?.active) {
    if (licencia.expiresAt === null) {
      return { text: 'PRO · Vitalicia', isPro: true, isTrial: false, days: 9999, hours: 0 };
    }
    if (licencia.expiresAt > nowTs) {
      const remMs = Math.max(0, licencia.expiresAt - nowTs);
      const totalHours = Math.floor(Math.max(0, remMs - 1) / (60 * 60 * 1000));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const code = String(licencia.planCode || '').trim().toUpperCase();
      if (code === 'G') {
        return {
          text: 'PRO Prueba (3 días)',
          isPro: true,
          isTrial: true,
          days,
          hours,
        };
      }
      const shortPlan =
        code === 'A'
          ? '1 Año'
          : code === 'Q'
            ? '90d'
            : code === 'M'
              ? '30d'
              : /^D\d+$/i.test(code)
                ? `${code.slice(1)}d`
                : '';
      return {
        text: shortPlan ? `PRO · ${shortPlan} · ${days}d ${hours}h` : `PRO · ${days}d ${hours}h`,
        isPro: true,
        isTrial: code === 'D3',
        days,
        hours,
      };
    }
  }

  if (typeof trialExpiresAt === 'number' && trialExpiresAt > nowTs) {
    const remMs = Math.max(0, trialExpiresAt - nowTs);
    const totalHours = Math.floor(Math.max(0, remMs - 1) / (60 * 60 * 1000));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return {
      text: `Prueba PRO · ${days}d ${hours}h`,
      isPro: true,
      isTrial: true,
      days,
      hours,
    };
  }

  return {
    text: 'Versión Gratuita',
    isPro: false,
    isTrial: false,
    days: 0,
    hours: 0,
  };
}

// ==================== PARSER 1-CLIC DE SOLICITUD WHATSAPP (ADMIN) ====================
export interface ParsedWhatsappKeyRequest {
  cliente: string;
  telefono: string;
  telefonoDigits: string;
  deviceId: string;
  planCode: 'G' | 'M' | 'Q' | 'A';
  planIdx: number;
  hasValidDeviceId: boolean;
}

export function parseWhatsappKeyRequestMessage(raw: string): ParsedWhatsappKeyRequest {
  const text = String(raw || '').trim();
  const idMatch = text.match(/\b(ALM-[A-Z0-9]{3,12})\b/i);
  const deviceId = idMatch ? idMatch[1].toUpperCase() : '';

  const clientMatch = text.match(
    /(?:taller\s*\/\s*cliente|taller|cliente|nombre)\s*:\s*([^\n\r]+)/i
  );
  const cliente = clientMatch ? clientMatch[1].trim().slice(0, 80) : '';

  const phoneLineMatch = text.match(
    /(?:whatsapp|tel[eé]fono|tel\.?|cel(?:ular)?)\s*:\s*([^\n\r]+)/i
  );
  let phoneDigits = '';
  if (phoneLineMatch) {
    const cleaned = phoneLineMatch[1].replace(/\D/g, '');
    phoneDigits = cleaned.length > 10 && cleaned.startsWith('52')
      ? cleaned.slice(-10)
      : cleaned.slice(0, 10);
  } else {
    const anyTen = text.match(/(?<!\d)(\d{3}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}|\d{10})(?!\d)/);
    if (anyTen) {
      phoneDigits = anyTen[1].replace(/\D/g, '').slice(0, 10);
    }
  }
  const telefono = phoneDigits ? formatMxPhoneDashed(phoneDigits) : '';

  const lower = text.toLowerCase();
  let planCode: 'G' | 'M' | 'Q' | 'A' = 'M';
  let planIdx = 1;
  if (/promoci[oó]n\s*colega|promo\s*colega|3\s*d[ií]as|prueba\s*de\s*3|regalo/.test(lower)) {
    planCode = 'G';
    planIdx = 0;
  } else if (/1\s*a[ñn]o|365\s*d[ií]as|anual/.test(lower)) {
    planCode = 'A';
    planIdx = 3;
  } else if (/90\s*d[ií]as|trimestral/.test(lower)) {
    planCode = 'Q';
    planIdx = 2;
  } else if (/30\s*d[ií]as|mensual/.test(lower)) {
    planCode = 'M';
    planIdx = 1;
  }

  return {
    cliente,
    telefono,
    telefonoDigits: phoneDigits,
    deviceId,
    planCode,
    planIdx,
    hasValidDeviceId: Boolean(deviceId),
  };
}

export function buildAdminWelcomeMessage(params: {
  cliente: string;
  deviceId: string;
  planCode: string;
  planLabel: string;
  dias: number | null;
}): string {
  const nombre = String(params.cliente || '').split('·')[0].trim() || 'Colega';
  const isColleague = isColleaguePromoPlan(params.planCode, params.dias);
  if (isColleague) {
    return [
      `¡Hola ${nombre}! 👋 Bienvenido a *Aluminero Pro*.`,
      `Aquí tienes tu *Regalo de 3 días PRO* por invitación de un colega para tu equipo *${params.deviceId}*.`,
      '',
      'En el siguiente mensaje te envío *únicamente tu clave* para que solo la copies y la pegues directo en la app (Menú → Activar PRO).',
      '¡Mucho éxito en tus cotizaciones y cortes! 🛠️',
    ].join('\n');
  }
  const diasLabel = params.dias ? `${params.dias} días` : params.planLabel;
  return [
    `¡Hola ${nombre}! 👋 Gracias por activar *Aluminero Pro* (${params.planLabel || diasLabel}).`,
    `Tu licencia PRO quedó ligada a tu ID de equipo *${params.deviceId}*.`,
    '',
    'En el siguiente mensaje te envío *únicamente tu clave de activación* para que la copies con un toque y la pegues directo en la app (Menú → Activar PRO).',
    '¡Gracias por tu confianza! 🛠️',
  ].join('\n');
}

export function buildWhatsAppDirectUrl(phoneRaw: string, message: string): string {
  const digits = String(phoneRaw || '').replace(/\D+/g, '');
  const fullNumber =
    digits.length === 10
      ? `52${digits}`
      : digits.length > 10
        ? digits
        : '';
  return fullNumber
    ? `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// ==================== PRECIOS DE REFERENCIA Y AJUSTE MASIVO (%) ====================
export type ReferencePriceCategory = 'aluminio' | 'vidrio' | 'herrajes';

export interface ReferencePriceItem {
  id: string;
  categoria: ReferencePriceCategory;
  nombre: string;
  unidad: string;
  precioSugerido: number;
  lineaId?: LineaId;
  rellenoKey?: string;
}

export interface ReferencePricesDoc {
  updatedAt: number;
  updatedLabel: string;
  nota: string;
  items: ReferencePriceItem[];
}

export const DEFAULT_REFERENCE_PRICES: ReferencePricesDoc = {
  updatedAt: Date.now(),
  updatedLabel: 'Actualizado esta semana',
  nota: 'Valores promedio de referencia. Verifica con tu proveedor local antes de confirmar.',
  items: [
    { id: 'ref-alu-tramo', categoria: 'aluminio', nombre: 'Tramo Aluminio 6.10 m (Precio Lista Prom.)', unidad: 'tramo', precioSugerido: 890 },
    { id: 'ref-alu-l3', categoria: 'aluminio', nombre: 'Ventana Línea Nacional 3" (Tarifa m²)', unidad: 'm²', precioSugerido: 2950, lineaId: '3' },
    { id: 'ref-alu-l2', categoria: 'aluminio', nombre: 'Ventana Línea 2" Tradicional (Tarifa m²)', unidad: 'm²', precioSugerido: 2350, lineaId: '2' },
    { id: 'ref-alu-eu', categoria: 'aluminio', nombre: 'Ventana Línea Europea (Tarifa m²)', unidad: 'm²', precioSugerido: 4250, lineaId: 'europea' },
    { id: 'ref-alu-pb', categoria: 'aluminio', nombre: 'Puerta Batiente Alumer (Tarifa m²)', unidad: 'm²', precioSugerido: 4050, lineaId: 'puerta-abatible' },
    { id: 'ref-alu-cb', categoria: 'aluminio', nombre: 'Cancel de Baño Semilujo (Tarifa m²)', unidad: 'm²', precioSugerido: 2550, lineaId: 'cancel-bano' },
    { id: 'ref-vid-c4', categoria: 'vidrio', nombre: 'Vidrio Claro 4 mm', unidad: 'm²', precioSugerido: 310, rellenoKey: 'flot-claro__4' },
    { id: 'ref-vid-c6', categoria: 'vidrio', nombre: 'Vidrio Claro 6 mm', unidad: 'm²', precioSugerido: 460, rellenoKey: 'flot-claro__6' },
    { id: 'ref-vid-f6', categoria: 'vidrio', nombre: 'Vidrio Filtrasol 6 mm', unidad: 'm²', precioSugerido: 750, rellenoKey: 'flot-filtrasol__6' },
    { id: 'ref-vid-t6', categoria: 'vidrio', nombre: 'Vidrio Tintex Verde 6 mm', unidad: 'm²', precioSugerido: 790, rellenoKey: 'flot-tintex__6' },
    { id: 'ref-vid-temp9', categoria: 'vidrio', nombre: 'Vidrio Templado Claro 9.5 mm', unidad: 'm²', precioSugerido: 1520, rellenoKey: 'temp-claro__9.5' },
    { id: 'ref-her-carr3', categoria: 'herrajes', nombre: 'Carretilla doble/tándem 3"', unidad: 'pza', precioSugerido: 85 },
    { id: 'ref-her-jal', categoria: 'herrajes', nombre: 'Jaladera / Seguro automático', unidad: 'pza', precioSugerido: 110 },
    { id: 'ref-her-chapa', categoria: 'herrajes', nombre: 'Cerradura de manija residencial', unidad: 'jgo', precioSugerido: 480 },
    { id: 'ref-her-bis', categoria: 'herrajes', nombre: 'Bisagra reforzada para puerta', unidad: 'pza', precioSugerido: 95 },
  ],
};

export function applyBulkPriceAdjustment(params: {
  category: 'aluminio' | 'vidrio' | 'herrajes' | 'todo';
  pct: number;
  precioListaTramo: number;
  tarifasBase: Partial<Record<LineaId, number>>;
  rellenoPreciosM2: Record<string, number>;
  herrajesPrecios: Record<string, number>;
}): {
  precioListaTramo: number;
  tarifasBase: Partial<Record<LineaId, number>>;
  rellenoPreciosM2: Record<string, number>;
  herrajesPrecios: Record<string, number>;
  updatedCount: number;
} {
  const safePct = Math.max(-80, Math.min(200, Number(params.pct) || 0));
  const factor = 1 + safePct / 100;
  let updatedCount = 0;

  let nextTramo = params.precioListaTramo;
  const nextTarifas: Partial<Record<LineaId, number>> = { ...params.tarifasBase };
  const nextRellenos: Record<string, number> = { ...params.rellenoPreciosM2 };
  const nextHerrajes: Record<string, number> = { ...params.herrajesPrecios };

  if (params.category === 'aluminio' || params.category === 'todo') {
    nextTramo = Math.max(10, Math.round(params.precioListaTramo * factor));
    updatedCount += 1;
    (Object.keys(LINEAS_CONFIG) as LineaId[]).forEach((lid) => {
      const current = nextTarifas[lid] ?? LINEAS_CONFIG[lid].tarifaBaseDefault;
      nextTarifas[lid] = Math.max(10, Math.round(current * factor));
      updatedCount += 1;
    });
  }

  if (params.category === 'vidrio' || params.category === 'todo') {
    for (const item of PANEL_RELLENO_CATALOGO) {
      for (const esp of item.espesoresMm) {
        const key = getRellenoPriceKey(item.id, esp);
        const baseVal =
          typeof nextRellenos[key] === 'number'
            ? nextRellenos[key]
            : item.espesorPreciosM2?.[esp] ?? item.precioBaseM2;
        nextRellenos[key] = Math.max(10, Math.round(baseVal * factor));
        updatedCount += 1;
      }
    }
  }

  if (params.category === 'herrajes' || params.category === 'todo') {
    const defaultHerrajes = DEFAULT_REFERENCE_PRICES.items.filter((i) => i.categoria === 'herrajes');
    for (const h of defaultHerrajes) {
      const cur = typeof nextHerrajes[h.id] === 'number' ? nextHerrajes[h.id] : h.precioSugerido;
      nextHerrajes[h.id] = Math.max(5, Math.round(cur * factor));
      updatedCount += 1;
    }
  }

  return {
    precioListaTramo: nextTramo,
    tarifasBase: nextTarifas,
    rellenoPreciosM2: nextRellenos,
    herrajesPrecios: nextHerrajes,
    updatedCount,
  };
}

// ==================== MENSAJES / AVISOS DEL ADMINISTRADOR ====================
export type AdminMessageType = 'aviso' | 'promo' | 'soporte';

export interface AdminMessageItem {
  id: string;
  titulo: string;
  cuerpo: string;
  tipo: AdminMessageType;
  targetMode: 'all' | 'individual';
  targetDeviceId?: string;
  targetLabel?: string;
  createdAt: number;
}

// ==================== INVENTARIO COMPACTO (EXISTENCIAS > 0) ====================
export interface CompactExistenciaItem {
  id: string;
  tipo: 'perfil' | 'herraje' | 'vidrio';
  titulo: string;
  subtitulo: string;
  cantidad: number;
  unidad: string;
  detalle: string;
  inventarioKey?: string;
  herrajeId?: string;
  vidrioId?: string;
  perfilId?: PerfilCatalogoId;
  color?: ColorId;
  marca?: string;
}

export function buildCompactExistenciasList(
  inventario: Record<string, number>,
  inventarioHerrajes: Record<string, number>,
  hojasVidrio: Array<{
    id: string;
    tipoNombre: string;
    anchoCm: number;
    altoCm: number;
    cantidad: number;
    ubicacion?: string;
  }> = []
): CompactExistenciaItem[] {
  const items: CompactExistenciaItem[] = [];

  for (const [key, rawQty] of Object.entries(inventario || {})) {
    const qty = round2(Number(rawQty) || 0);
    if (qty <= 0) continue;
    const parsed = parseInventarioKey(key);
    const perfilMeta = CATALOGO_PERFILES.find((p) => p.id === parsed.perfilId);
    const lineaMeta = LINEAS_CONFIG[normalizeLineaId(parsed.linea)];
    const colorMeta = COLORES_CONFIG[parsed.color];
    const marca = parsed.marca || INVENTARIO_DEFAULT_MARCA;
    items.push({
      id: `perf:${key}`,
      tipo: 'perfil',
      titulo: perfilMeta?.nombre || parsed.perfilId,
      subtitulo: `${lineaMeta?.nombre || parsed.linea} · ${colorMeta?.nombre || parsed.color} · ${marca}`,
      cantidad: qty,
      unidad: qty === 1 ? 'tramo' : 'tramos',
      detalle: `${round2(qty * TRAMO_STD_M)} m totales (tramos de 6.10 m) · ${perfilMeta?.codigoRef || parsed.perfilId}`,
      inventarioKey: key,
      perfilId: parsed.perfilId,
      color: parsed.color,
      marca,
    });
  }

  for (const h of HERRAJES_INVENTARIO_CATALOGO) {
    const qty = round2(Number(inventarioHerrajes?.[h.id]) || 0);
    if (qty <= 0) continue;
    items.push({
      id: `her:${h.id}`,
      tipo: 'herraje',
      titulo: h.nombre,
      subtitulo: `${h.categoria}${h.color ? ` · ${h.color}` : ''}`,
      cantidad: qty,
      unidad: h.unidad,
      detalle: `${h.modelo || h.categoria}${h.tamano ? ` · Medida: ${h.tamano}` : ''}`,
      herrajeId: h.id,
    });
  }

  for (const hv of hojasVidrio || []) {
    const qty = Math.max(0, Math.round(Number(hv.cantidad) || 0));
    if (qty <= 0) continue;
    const m2Hoja = round2(((hv.anchoCm || 0) * (hv.altoCm || 0)) / 10000);
    items.push({
      id: `vid:${hv.id}`,
      tipo: 'vidrio',
      titulo: `${hv.tipoNombre} (${hv.anchoCm} × ${hv.altoCm} cm)`,
      subtitulo: hv.ubicacion ? `Vidrio · ${hv.ubicacion}` : 'Hoja de vidrio en bodega',
      cantidad: qty,
      unidad: qty === 1 ? 'hoja' : 'hojas',
      detalle: `${round2(m2Hoja * qty)} m² totales (${m2Hoja} m² por hoja)`,
      vidrioId: hv.id,
    });
  }

  return items;
}

export interface ExistenciasPriceContext {
  inventarioPreciosUnitarios?: Record<string, number>;
  precioListaTramo?: number;
  rellenoPreciosM2?: Record<string, number>;
  herrajesPrecios?: Record<string, number>;
}

export function resolveExistenciaUnitPrice(
  item: CompactExistenciaItem,
  ctx: ExistenciasPriceContext = {}
): { price: number; unitLabel: string } {
  const custom = ctx.inventarioPreciosUnitarios?.[item.id];
  if (typeof custom === 'number' && Number.isFinite(custom) && custom > 0) {
    const unitLabel =
      item.tipo === 'perfil' ? 'tramo' : item.tipo === 'vidrio' ? 'm²' : item.unidad || 'pza';
    return { price: round2(custom), unitLabel };
  }

  if (item.tipo === 'perfil') {
    const baseTramo = Number(ctx.precioListaTramo) > 0 ? Number(ctx.precioListaTramo) : 890;
    return { price: round2(baseTramo), unitLabel: 'tramo' };
  }

  if (item.tipo === 'herraje') {
    const hKey = item.herrajeId || '';
    const customH = hKey ? ctx.herrajesPrecios?.[hKey] : undefined;
    if (typeof customH === 'number' && Number.isFinite(customH) && customH > 0) {
      return { price: round2(customH), unitLabel: item.unidad || 'pza' };
    }
    const lowerTitle = item.titulo.toLowerCase();
    const fallback = lowerTitle.includes('cerradura') || lowerTitle.includes('chapa')
      ? 480
      : lowerTitle.includes('jaladera') || lowerTitle.includes('cierre')
        ? 110
        : lowerTitle.includes('bisagra')
          ? 95
          : 85;
    return { price: fallback, unitLabel: item.unidad || 'pza' };
  }

  // Vidrio: precio referencial por m²
  const lowerVid = item.titulo.toLowerCase();
  const rellenoPrices = ctx.rellenoPreciosM2 || {};
  let fallbackM2 = 460;
  if (lowerVid.includes('templado')) {
    fallbackM2 = rellenoPrices['temp-claro__9.5'] ?? 1520;
  } else if (lowerVid.includes('filtrasol')) {
    fallbackM2 = rellenoPrices['flot-filtrasol__6'] ?? 750;
  } else if (lowerVid.includes('tintex')) {
    fallbackM2 = rellenoPrices['flot-tintex__6'] ?? 790;
  } else if (lowerVid.includes('4 mm')) {
    fallbackM2 = rellenoPrices['flot-claro__4'] ?? 310;
  } else {
    fallbackM2 = rellenoPrices['flot-claro__6'] ?? 460;
  }
  return { price: round2(fallbackM2), unitLabel: 'm²' };
}

export interface BulkExistenciasAdjustmentResult {
  inventarioPreciosUnitarios: Record<string, number>;
  herrajesPrecios: Record<string, number>;
  updatedCount: number;
  signedPct: number;
  changes: Array<{ id: string; titulo: string; before: number; after: number; unitLabel: string }>;
}

export function applyBulkExistenciasPriceAdjustment(params: {
  selectedItems: CompactExistenciaItem[];
  mode: 'incremento' | 'descuento';
  pct: number;
  ctx: ExistenciasPriceContext;
}): BulkExistenciasAdjustmentResult {
  const rawAbs = Math.abs(Number(params.pct) || 0);
  const clampedAbs =
    params.mode === 'descuento'
      ? Math.min(90, Math.max(0, rawAbs))
      : Math.min(200, Math.max(0, rawAbs));
  const signedPct = params.mode === 'descuento' ? -clampedAbs : clampedAbs;
  const factor = 1 + signedPct / 100;

  const nextUnitMap: Record<string, number> = { ...(params.ctx.inventarioPreciosUnitarios || {}) };
  const nextHerrajes: Record<string, number> = { ...(params.ctx.herrajesPrecios || {}) };
  const changes: BulkExistenciasAdjustmentResult['changes'] = [];

  if (clampedAbs <= 0 || params.selectedItems.length === 0) {
    return {
      inventarioPreciosUnitarios: nextUnitMap,
      herrajesPrecios: nextHerrajes,
      updatedCount: 0,
      signedPct: 0,
      changes,
    };
  }

  for (const item of params.selectedItems) {
    const { price: before, unitLabel } = resolveExistenciaUnitPrice(item, params.ctx);
    const after = Math.max(1, round2(before * factor));
    nextUnitMap[item.id] = after;
    if (item.tipo === 'herraje' && item.herrajeId) {
      nextHerrajes[item.herrajeId] = after;
    }
    changes.push({ id: item.id, titulo: item.titulo, before, after, unitLabel });
  }

  return {
    inventarioPreciosUnitarios: nextUnitMap,
    herrajesPrecios: nextHerrajes,
    updatedCount: changes.length,
    signedPct,
    changes,
  };
}

// ==================== ANALÍTICA ADMIN: COTIZACIONES POR MES Y MATERIALES ====================
export interface MonthlyQuotePoint {
  monthKey: string;
  mes: string;
  cotizaciones: number;
  montoTotal: number;
}

export interface TopMaterialPoint {
  nombre: string;
  usos: number;
  tramosEstimados: number;
}

const MESES_ES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function parseDateMsFlexible(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 1_000_000_000_000) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const s = raw.trim();
    const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) {
      const dt = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      if (!Number.isNaN(dt.getTime())) return dt.getTime();
    }
    const parsed = Date.parse(s);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

export function buildMonthlyQuotesSeries(
  historial: Array<{ fecha?: string; total?: number; id?: string }> = [],
  cotizacionesGuardadas: Array<{ fecha?: string; createdAt?: number; total?: number; id?: string }> = [],
  nowMs = Date.now()
): MonthlyQuotePoint[] {
  const now = new Date(nowMs);
  const buckets = new Map<string, MonthlyQuotePoint>();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, {
      monthKey: key,
      mes: `${MESES_ES_CORTO[dt.getMonth()]} ${String(dt.getFullYear()).slice(-2)}`,
      cotizaciones: 0,
      montoTotal: 0,
    });
  }

  const seenIds = new Set<string>();
  const allEntries: Array<{ id?: string; ts: number | null; total: number }> = [];

  for (const c of cotizacionesGuardadas || []) {
    const ts = parseDateMsFlexible(c.createdAt) ?? parseDateMsFlexible(c.fecha);
    allEntries.push({ id: c.id, ts, total: Number(c.total) || 0 });
  }
  for (const h of historial || []) {
    const ts = parseDateMsFlexible(h.fecha);
    allEntries.push({ id: h.id, ts, total: Number(h.total) || 0 });
  }

  for (const entry of allEntries) {
    if (entry.id && seenIds.has(entry.id)) continue;
    if (entry.id) seenIds.add(entry.id);
    const dt = new Date(entry.ts ?? nowMs);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.cotizaciones += 1;
      existing.montoTotal = round2(existing.montoTotal + Math.max(0, entry.total));
    }
  }

  return Array.from(buckets.values());
}

export function buildTopMaterialsSeries(
  historial: Array<{ linea?: LineaId; color?: ColorId; cantidad?: number }> = [],
  cotizacionesGuardadas: Array<{
    partidas?: PartidaObra[];
    hoja?: { partidas?: PartidaObra[] };
    materiales?: Array<{ perfilNombre?: string; perfilId?: string; tramosRequeridos?: number; linea?: string; nombre?: string; cantidad?: number }>;
  }> = [],
  inventario: Record<string, number> = {}
): TopMaterialPoint[] {
  const counts = new Map<string, { usos: number; tramosEstimados: number }>();

  const bump = (label: string, usosDelta: number, tramosDelta: number) => {
    const cur = counts.get(label) || { usos: 0, tramosEstimados: 0 };
    cur.usos += usosDelta;
    cur.tramosEstimados = round2(cur.tramosEstimados + tramosDelta);
    counts.set(label, cur);
  };

  for (const cot of cotizacionesGuardadas || []) {
    for (const m of cot.materiales || []) {
      const cat = m.perfilId ? CATALOGO_PERFILES.find((c) => c.id === m.perfilId) : undefined;
      const label =
        m.perfilNombre ||
        m.nombre ||
        cat?.nombre ||
        (m.linea ? LINEAS_CONFIG[normalizeLineaId(m.linea)]?.nombre : '') ||
        'Material';
      const tramos = Math.max(0.5, Number(m.tramosRequeridos ?? m.cantidad) || 1);
      bump(label, Math.max(1, Math.round(tramos)), tramos);
    }
    const parts = cot.partidas || cot.hoja?.partidas || [];
    for (const part of parts) {
      const lineaCfg = LINEAS_CONFIG[normalizeLineaId(part.linea)];
      const qty = Math.max(1, Number(part.cantidad) || 1);
      if (part.despiece?.perfiles?.length) {
        for (const p of part.despiece.perfiles) {
          const cat = CATALOGO_PERFILES.find((c) => c.id === p.perfilId);
          const name = cat?.nombre || p.nombre || p.perfilId;
          const tramos = Math.max(0.2, round2(((p.pzas || 1) * (p.medidaCm || 100)) / TRAMO_STD_CM));
          bump(name, 1, tramos);
        }
      } else if (lineaCfg) {
        bump(lineaCfg.nombre, qty, qty * 2);
      }
    }
  }

  for (const h of historial || []) {
    if (!h.linea) continue;
    const lineaCfg = LINEAS_CONFIG[normalizeLineaId(h.linea)];
    const qty = Math.max(1, Number(h.cantidad) || 1);
    bump(lineaCfg?.nombre || String(h.linea), qty, qty * 2);
  }

  if (counts.size === 0) {
    for (const [k, rawVal] of Object.entries(inventario || {})) {
      const qty = Number(rawVal) || 0;
      if (qty <= 0) continue;
      const parsed = parseInventarioKey(k);
      const cat = CATALOGO_PERFILES.find((c) => c.id === parsed.perfilId);
      bump(cat?.nombre || parsed.perfilId, Math.max(1, Math.round(qty)), qty);
    }
  }

  return Array.from(counts.entries())
    .map(([nombre, v]) => ({
      nombre: nombre.length > 26 ? `${nombre.slice(0, 24)}…` : nombre,
      usos: v.usos,
      tramosEstimados: v.tramosEstimados,
    }))
    .sort((a, b) => b.usos - a.usos || b.tramosEstimados - a.tramosEstimados)
    .slice(0, 7);
}

// ==================== TEXTOS CANÓNICOS CONECTAR CON GOOGLE ====================
export const GOOGLE_CONNECT_CTA_LABEL = 'Conectar con Google (Recomendado)';
export const GOOGLE_CONNECT_BENEFIT_SUBTITLE =
  'Respalda tus cotizaciones y protege tu licencia PRO en la nube para no perder tus datos si cambias de celular o borras el navegador.';
export const GOOGLE_CLOUD_PERSUASIVE_TIP =
  '¡Que no se te pierdan tus cotizaciones! Así como alguna vez perdiste el lápiz, tu cuaderno o el último papelito donde anotaste las medidas del cliente, conéctate con el botón de Google para que todos tus apuntes y proyectos queden guardados seguros en la nube.';

// ==================== MATERIALES FRECUENTES EN HISTORIAL (INICIO) ====================
export interface FrequentMaterialSuggestion {
  key: string;
  kind: 'aluminio' | 'vidrio';
  title: string;
  subtitle: string;
  count: number;
  categoria: CategoriaTrabajo;
  linea: LineaId;
  color?: ColorId;
  anchoCm?: number;
  altoCm?: number;
  vidrioLabel?: string;
}

const GLASS_KEYWORD_RE =
  /\b(vidrio|cristal|templado|espejo|filtrasol|tintex|sat[eé]n|reflecta|laminado|acrilico|acr[ií]lico|policarbonato|claro\s*\d+\s*mm)\b/i;

export function analyzeFrequentHistorialMaterials(
  historial: Array<{
    linea?: LineaId | string;
    color?: ColorId | string;
    cantidad?: number;
    anchoCm?: number;
    altoCm?: number;
    referencia?: string;
  }> = [],
  cotizacionesGuardadas: Array<{
    materiales?: Array<{
      nombre?: string;
      linea?: string;
      cantidad?: number;
      unidad?: string;
    }>;
  }> = [],
  limit = 3
): FrequentMaterialSuggestion[] {
  const maxItems = Math.max(1, Math.min(6, Math.round(limit)));
  const buckets = new Map<string, FrequentMaterialSuggestion>();

  const bumpBucket = (item: FrequentMaterialSuggestion, delta: number) => {
    const existing = buckets.get(item.key);
    if (existing) {
      existing.count += delta;
      if (item.anchoCm && item.altoCm && !existing.anchoCm) {
        existing.anchoCm = item.anchoCm;
        existing.altoCm = item.altoCm;
      }
      return;
    }
    buckets.set(item.key, { ...item, count: delta });
  };

  for (const h of historial || []) {
    if (!h || !h.linea) continue;
    const normLinea = normalizeLineaId(String(h.linea));
    const lineaCfg = LINEAS_CONFIG[normLinea];
    if (!lineaCfg) continue;
    const qty = Math.max(1, Math.round(Number(h.cantidad) || 1));
    const colorId =
      h.color && Object.prototype.hasOwnProperty.call(COLORES_CONFIG, h.color)
        ? (h.color as ColorId)
        : undefined;
    const colorNombre = colorId ? COLORES_CONFIG[colorId].nombre : '';
    const title = colorNombre ? `${lineaCfg.nombre} · ${colorNombre}` : lineaCfg.nombre;
    const anchoCm = Number.isFinite(Number(h.anchoCm)) && Number(h.anchoCm) > 0 ? Number(h.anchoCm) : undefined;
    const altoCm = Number.isFinite(Number(h.altoCm)) && Number(h.altoCm) > 0 ? Number(h.altoCm) : undefined;

    bumpBucket(
      {
        key: `alu:${normLinea}:${colorId || 'std'}`,
        kind: 'aluminio',
        title,
        subtitle: anchoCm && altoCm ? `${Math.round(anchoCm)}×${Math.round(altoCm)} cm` : lineaCfg.categoria === 'puertas' ? 'Puerta' : 'Ventana',
        count: 0,
        categoria: lineaCfg.categoria,
        linea: normLinea,
        color: colorId,
        anchoCm,
        altoCm,
      },
      qty
    );

    const refText = (h.referencia || '').trim();
    if (refText && GLASS_KEYWORD_RE.test(refText)) {
      const glassMatch = refText.match(
        /((?:vidrio|cristal|templado|espejo|filtrasol|tintex|sat[eé]n|reflecta|laminado|acr[ií]lico|policarbonato)[^,;·|-]{0,26})/i
      );
      const glassLabel = (glassMatch?.[1] || refText).trim().replace(/\s+/g, ' ');
      if (glassLabel.length >= 4) {
        const normGlassKey = `vid:${glassLabel.toLowerCase()}`;
        bumpBucket(
          {
            key: normGlassKey,
            kind: 'vidrio',
            title: glassLabel.charAt(0).toUpperCase() + glassLabel.slice(1),
            subtitle: lineaCfg.nombre,
            count: 0,
            categoria: lineaCfg.categoria,
            linea: normLinea,
            color: colorId,
            anchoCm,
            altoCm,
            vidrioLabel: glassLabel,
          },
          qty
        );
      }
    }
  }

  for (const cot of cotizacionesGuardadas || []) {
    for (const mat of cot.materiales || []) {
      const name = (mat.nombre || '').trim();
      if (!name) continue;
      const qty = Math.max(1, Math.round(Number(mat.cantidad) || 1));
      const isGlass = GLASS_KEYWORD_RE.test(name);
      const normLinea = mat.linea ? normalizeLineaId(mat.linea) : '3';
      const lineaCfg = LINEAS_CONFIG[normLinea] || LINEAS_CONFIG['3'];
      const cleanTitle = name.length > 34 ? `${name.slice(0, 32)}…` : name;
      if (isGlass) {
        bumpBucket(
          {
            key: `vid:${name.toLowerCase()}`,
            kind: 'vidrio',
            title: cleanTitle,
            subtitle: 'Vidrio frecuente en cotizaciones',
            count: 0,
            categoria: lineaCfg.categoria,
            linea: normLinea,
            vidrioLabel: name,
          },
          qty
        );
      } else {
        bumpBucket(
          {
            key: `alu-mat:${name.toLowerCase()}`,
            kind: 'aluminio',
            title: cleanTitle,
            subtitle: lineaCfg.nombre,
            count: 0,
            categoria: lineaCfg.categoria,
            linea: normLinea,
          },
          qty
        );
      }
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, maxItems);
}

// ==================== PROMO 3 DÍAS PRO GRATIS POR 3 REFERIDOS ====================
export const REFERRAL_3D_GIFT_TARGET = 3;
export const REFERRAL_3D_GIFT_DAYS = 3;

export function countRegisteredReferralsForDevice(
  deviceId: string,
  referralHistory: Array<{ referrerId?: string; referredDeviceId?: string }> = [],
  cloudDevices: Array<{ deviceId?: string; referredById?: string | null; referredBy?: string | null }> = []
): number {
  const myId = String(deviceId || '').trim().toUpperCase();
  if (!myId) return 0;
  const uniqueReferred = new Set<string>();

  for (const rec of referralHistory || []) {
    const refId = String(rec?.referrerId || '').trim().toUpperCase();
    const targetId = String(rec?.referredDeviceId || '').trim().toUpperCase();
    if (refId === myId && targetId && targetId !== myId) {
      uniqueReferred.add(targetId);
    }
  }

  for (const dev of cloudDevices || []) {
    const refId = String(dev?.referredById || dev?.referredBy || '').trim().toUpperCase();
    const targetId = String(dev?.deviceId || '').trim().toUpperCase();
    if (refId === myId && targetId && targetId !== myId) {
      uniqueReferred.add(targetId);
    }
  }

  return uniqueReferred.size;
}

export function canShowFreeReferral3DaysPromo(
  proActive: boolean,
  promoColegaUsed: boolean
): boolean {
  return !proActive && !promoColegaUsed;
}

export function isReferralGiftReadyToOpen(
  registeredCount: number,
  proActive: boolean,
  promoColegaUsed: boolean
): boolean {
  return canShowFreeReferral3DaysPromo(proActive, promoColegaUsed) && registeredCount >= REFERRAL_3D_GIFT_TARGET;
}

export function buildReferral3DaysInviteLink(
  deviceId: string,
  appOrigin?: string
): string {
  const normId = String(deviceId || '').trim().toUpperCase();
  const base =
    (appOrigin && appOrigin.trim().replace(/\/+$/, '')) ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin.replace(/\/+$/, '')
      : 'https://nineropro.pages.dev');
  return `${base}/?ref=${encodeURIComponent(normId)}`;
}

export function buildReferral3DaysWhatsappUrl(
  deviceId: string,
  tallerNombre?: string,
  appOrigin?: string
): string {
  const normId = String(deviceId || '').trim().toUpperCase();
  const inviteLink = buildReferral3DaysInviteLink(normId, appOrigin);
  const sender = tallerNombre && tallerNombre.trim() && tallerNombre.trim() !== 'Mi Taller de Aluminio'
    ? tallerNombre.trim()
    : 'Tu colega aluminero';
  const text =
    `¡Hola colega! ${sender} te recomienda Aluminero Pro para calcular descuentos, optimización de tramos 6.10 m, vidrio 2D y cotizaciones en PDF.\n\n` +
    `Regístrate gratis con mi enlace personal (ID de Equipo: ${normId}):\n${inviteLink}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildReferral3DaysGiftLicense(
  deviceId: string,
  nowTs: number = Date.now()
): {
  active: boolean;
  planCode: 'G';
  planLabel: string;
  days: number;
  activatedAt: number;
  expiresAt: number;
  activatedKey: string;
} {
  const normId = String(deviceId || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || 'PRO3D';
  return {
    active: true,
    planCode: 'G',
    planLabel: 'Regalo 3 Referidos (3 Días PRO Gratis)',
    days: REFERRAL_3D_GIFT_DAYS,
    activatedAt: nowTs,
    expiresAt: nowTs + REFERRAL_3D_GIFT_DAYS * 86_400_000,
    activatedKey: `AP-G-REF3-${normId}`,
  };
}

// ==================== ACTIVACIÓN DIRECTA 3 DÍAS PRO + BONO +5 DÍAS POR 3 COLEGAS ====================
export const WELCOME_TRIAL_3D_DAYS = 3;
export const REFERRAL_BONUS_5D_TARGET = 3;
export const REFERRAL_BONUS_5D_DAYS = 5;

export type HomePromoCardMode = 'welcome_3d' | 'referral_5d' | 'hidden';

/**
 * Determina el estado de la tarjeta promocional en el Inicio:
 * - Paso 1 ('welcome_3d'): usuarios nuevos que aún no activan su prueba gratuita de 3 días.
 * - Paso 2 ('referral_5d'): una vez activada o usada su prueba de bienvenida, se transforma en
 *   "Invita a 3 colegas y gana +5 días PRO extra (X/3)" hasta reclamar el bono.
 * - 'hidden': ya reclamó el bono de +5 días o tiene licencia vitalicia.
 */
export function resolveHomePromoCardMode(input: {
  proActive: boolean;
  welcomeTrialUsed: boolean;
  referral5dBonusClaimed: boolean;
  isLifetimePro?: boolean;
}): HomePromoCardMode {
  if (input.isLifetimePro) return 'hidden';
  if (!input.welcomeTrialUsed && !input.proActive) {
    return 'welcome_3d';
  }
  if (!input.referral5dBonusClaimed) {
    return 'referral_5d';
  }
  return 'hidden';
}

export function isReferral5DaysBonusReady(
  registeredCount: number,
  welcomeTrialUsed: boolean,
  referral5dBonusClaimed: boolean
): boolean {
  return (
    Boolean(welcomeTrialUsed) &&
    !referral5dBonusClaimed &&
    registeredCount >= REFERRAL_BONUS_5D_TARGET
  );
}

/**
 * Construye la licencia inmediata de bienvenida "PRO Prueba (3 días)" (0 MXN, 1 toque).
 */
export function buildWelcome3DaysTrialLicense(
  deviceId: string,
  nowTs: number = Date.now()
): {
  active: boolean;
  planCode: 'G';
  planLabel: string;
  days: number;
  activatedAt: number;
  expiresAt: number;
  activatedKey: string;
} {
  const normId = String(deviceId || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || 'PRO3D';
  return {
    active: true,
    planCode: 'G',
    planLabel: 'PRO Prueba (3 días)',
    days: WELCOME_TRIAL_3D_DAYS,
    activatedAt: nowTs,
    expiresAt: nowTs + WELCOME_TRIAL_3D_DAYS * 86_400_000,
    activatedKey: `AP-G-TRIAL3-${normId}`,
  };
}

/**
 * Suma automáticamente +5 días PRO a la vigencia actual del usuario al completar 3 colegas registrados.
 * - Si tiene licencia vigente con fecha de expiración: extiende expiresAt en +5 días exactos.
 * - Si su prueba ya venció o está en gratuita: activa 5 días PRO nuevos desde nowTs.
 * - Si tiene licencia vitalicia (expiresAt === null): la conserva intacta.
 */
export function applyReferral5DaysBonusToLicense<
  T extends {
    active: boolean;
    planCode: string;
    planLabel: string;
    expiresAt: number | null;
    activatedAt: number;
    activatedKey?: string;
    days?: number;
  }
>(
  currentLicencia: T | null | undefined,
  deviceId: string,
  nowTs: number = Date.now()
): {
  active: boolean;
  planCode: string;
  planLabel: string;
  days: number;
  activatedAt: number;
  expiresAt: number | null;
  activatedKey: string;
} {
  const bonusMs = REFERRAL_BONUS_5D_DAYS * 86_400_000;
  const normId = String(deviceId || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || 'REF5D';

  if (currentLicencia?.active && currentLicencia.expiresAt === null) {
    return {
      ...currentLicencia,
      days: currentLicencia.days ?? 9999,
      activatedKey: currentLicencia.activatedKey || `AP-LIFE-${normId}`,
    };
  }

  const hasActiveExpiry =
    Boolean(currentLicencia?.active) &&
    typeof currentLicencia?.expiresAt === 'number' &&
    currentLicencia.expiresAt > nowTs;

  if (hasActiveExpiry && currentLicencia && typeof currentLicencia.expiresAt === 'number') {
    const baseCode = String(currentLicencia.planCode || '').trim().toUpperCase();
    const totalDays = (currentLicencia.days || 3) + REFERRAL_BONUS_5D_DAYS;
    const nextCode =
      baseCode === 'A' || baseCode === 'Q' || baseCode === 'M'
        ? baseCode
        : `D${totalDays}`;
    return {
      ...currentLicencia,
      active: true,
      planCode: nextCode,
      planLabel:
        baseCode === 'A' || baseCode === 'Q' || baseCode === 'M'
          ? `${currentLicencia.planLabel} (+5 días bono)`
          : `PRO Prueba + Bono 3 Colegas (${totalDays} días)`,
      days: totalDays,
      expiresAt: currentLicencia.expiresAt + bonusMs,
      activatedKey: currentLicencia.activatedKey || `AP-D5-REF3-${normId}`,
    };
  }

  return {
    active: true,
    planCode: 'D5',
    planLabel: 'Bono +5 Días PRO (3 Colegas)',
    days: REFERRAL_BONUS_5D_DAYS,
    activatedAt: nowTs,
    expiresAt: nowTs + bonusMs,
    activatedKey: `AP-D5-REF3-${normId}`,
  };
}

// ==================== LISTA DE COMPRAS SIMPLIFICADA (HOJA DE COTIZACIÓN -> WHATSAPP) ====================
export interface HojaShoppingPerfilItem {
  key: string;
  perfilId: PerfilCatalogoId;
  nombre: string;
  lineaNombre: string;
  colorNombre: string;
  tramosRequeridos: number;
  tramosEnBodega: number;
  tramosAComprar: number;
  metrosTotales: number;
}

export interface HojaShoppingVidrioItem {
  label: string;
  piezas: number;
  areaM2: number;
}

export interface HojaShoppingHerrajeItem {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface HojaShoppingList {
  proyecto: string;
  cliente: string;
  folio: string;
  partidasCount: number;
  perfiles: HojaShoppingPerfilItem[];
  vidrios: HojaShoppingVidrioItem[];
  herrajes: HojaShoppingHerrajeItem[];
  totalTramosRequeridos: number;
  totalTramosAComprar: number;
  totalTramosEnBodega: number;
  totalVidrioM2: number;
  totalHerrajesTipos: number;
}

export function buildHojaShoppingList(
  hoja: {
    proyecto?: string;
    cliente?: string;
    folio?: string;
    partidas: PartidaObra[];
  },
  consolidado: MaterialConsolidadoRow[]
): HojaShoppingList {
  const perfiles: HojaShoppingPerfilItem[] = (consolidado || []).map((r) => ({
    key: r.key,
    perfilId: r.perfilId,
    nombre: r.perfilNombre,
    lineaNombre: LINEAS_CONFIG[r.linea]?.nombre ?? r.linea,
    colorNombre: COLORES_CONFIG[r.color]?.nombre ?? r.color,
    tramosRequeridos: Math.max(0, Math.round(Number(r.tramosRequeridos) || 0)),
    tramosEnBodega: Math.max(0, round2(Number(r.tramosDisponibles) || 0)),
    tramosAComprar: Math.max(0, Math.round(Number(r.tramosFaltantes) || 0)),
    metrosTotales: round2(Number(r.metrosRequeridos) || 0),
  }));

  const vidriosMap = new Map<string, HojaShoppingVidrioItem>();
  const herrajesMap = new Map<string, HojaShoppingHerrajeItem>();

  for (const p of hoja.partidas || []) {
    const vidrios = p.despiece?.vidrios || [];
    for (const v of vidrios) {
      const label = (v.espesorLabel || v.nombre || 'Vidrio / Panel').trim();
      const key = label.toLowerCase();
      const pzas = Math.max(1, Math.round(Number(v.pzas) || 1));
      const area = round2(Number(v.areaM2) || ((Number(v.anchoCm) || 0) * (Number(v.altoCm) || 0) * pzas) / 10000);
      const prev = vidriosMap.get(key);
      if (prev) {
        prev.piezas += pzas;
        prev.areaM2 = round2(prev.areaM2 + area);
      } else {
        vidriosMap.set(key, { label, piezas: pzas, areaM2: area });
      }
    }

    const herrajes = p.despiece?.herrajes || [];
    for (const h of herrajes) {
      const nombre = (h.nombre || '').trim();
      if (!nombre) continue;
      const unidad = (h.unidad || 'pzas').trim();
      const qty = Math.max(0, round2(Number(h.cantidad) || 0));
      if (qty <= 0) continue;
      const key = `${nombre.toLowerCase()}__${unidad.toLowerCase()}`;
      const prev = herrajesMap.get(key);
      if (prev) {
        prev.cantidad = round2(prev.cantidad + qty);
      } else {
        herrajesMap.set(key, { nombre, cantidad: qty, unidad });
      }
    }
  }

  const vidrios = Array.from(vidriosMap.values()).sort((a, b) => b.areaM2 - a.areaM2);
  const herrajes = Array.from(herrajesMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const totalTramosRequeridos = perfiles.reduce((acc, p) => acc + p.tramosRequeridos, 0);
  const totalTramosAComprar = perfiles.reduce((acc, p) => acc + p.tramosAComprar, 0);
  const totalTramosEnBodega = round2(
    perfiles.reduce((acc, p) => acc + Math.min(p.tramosRequeridos, p.tramosEnBodega), 0)
  );
  const totalVidrioM2 = round2(vidrios.reduce((acc, v) => acc + v.areaM2, 0));

  return {
    proyecto: (hoja.proyecto || '').trim() || 'Obra sin nombre',
    cliente: (hoja.cliente || '').trim(),
    folio: (hoja.folio || '').trim(),
    partidasCount: (hoja.partidas || []).length,
    perfiles,
    vidrios,
    herrajes,
    totalTramosRequeridos,
    totalTramosAComprar,
    totalTramosEnBodega,
    totalVidrioM2,
    totalHerrajesTipos: herrajes.length,
  };
}

export function buildHojaShoppingListWhatsAppText(
  list: HojaShoppingList,
  options?: {
    onlyMissing?: boolean;
    tallerNombre?: string;
    includeVidrios?: boolean;
    includeHerrajes?: boolean;
  }
): string {
  const onlyMissing = options?.onlyMissing ?? true;
  const includeVidrios = options?.includeVidrios ?? true;
  const includeHerrajes = options?.includeHerrajes ?? true;
  const taller = (options?.tallerNombre || 'Aluminero Pro').trim();

  const perfilesFiltrados = onlyMissing
    ? list.perfiles.filter((p) => p.tramosAComprar > 0)
    : list.perfiles.filter((p) => p.tramosRequeridos > 0);

  const lines: string[] = [
    `🛒 *LISTA DE COMPRAS — ${taller.toUpperCase()}*`,
    `Proyecto: *${list.proyecto}*${list.folio ? ` (Folio: ${list.folio})` : ''}`,
  ];
  if (list.cliente) {
    lines.push(`Cliente: ${list.cliente}`);
  }
  lines.push(
    `Modo: ${onlyMissing ? 'Solo faltantes vs inventario en bodega' : 'Material total requerido'}`
  );
  lines.push('');

  lines.push('📏 *PERFILES DE ALUMINIO (Tramos 6.10 m):*');
  if (perfilesFiltrados.length === 0) {
    lines.push(
      onlyMissing
        ? '✅ Todos los perfiles están cubiertos con tu inventario en bodega.'
        : '— Sin perfiles requeridos en la cotización.'
    );
  } else {
    for (const p of perfilesFiltrados) {
      const qty = onlyMissing ? p.tramosAComprar : p.tramosRequeridos;
      const unidad = qty === 1 ? 'tramo' : 'tramos';
      const bodegaNote =
        onlyMissing && p.tramosEnBodega > 0
          ? ` (ya en bodega: ${p.tramosEnBodega})`
          : '';
      lines.push(`• *${qty} ${unidad}* — ${p.nombre} · ${p.lineaNombre} · ${p.colorNombre}${bodegaNote}`);
    }
    const sumTramos = onlyMissing ? list.totalTramosAComprar : list.totalTramosRequeridos;
    lines.push(`_Total perfiles a surtir: ${sumTramos} ${sumTramos === 1 ? 'tramo' : 'tramos'} de 6.10 m_`);
  }

  if (includeVidrios && list.vidrios.length > 0) {
    lines.push('');
    lines.push('🪟 *VIDRIOS / PANELES:*');
    for (const v of list.vidrios) {
      lines.push(`• ${v.label}: *${v.areaM2.toFixed(2)} m²* (${v.piezas} ${v.piezas === 1 ? 'pieza' : 'piezas'})`);
    }
  }

  if (includeHerrajes && list.herrajes.length > 0) {
    lines.push('');
    lines.push('🔩 *HERRAJES Y CONSUMIBLES:*');
    for (const h of list.herrajes) {
      lines.push(`• *${h.cantidad} ${h.unidad}* — ${h.nombre}`);
    }
  }

  lines.push('');
  lines.push('_Generado con Aluminero Pro_');
  return lines.join('\n');
}

// =========================================================================
// INVENTARIO DE PERFILES — UMBRAL MÍNIMO CONFIGURABLE Y BADGE VERDE/ROJO
// =========================================================================
export const INVENTARIO_MIN_THRESHOLD_KEY = 'aluminero_inv_min_threshold_v1';
export const DEFAULT_INVENTARIO_MIN_THRESHOLD = 3;

export type PerfilStockLevel = 'ok' | 'low';

export interface PerfilStockBadgeStatus {
  level: PerfilStockLevel;
  isLow: boolean;
  label: string;
  threshold: number;
}

export function sanitizeInventoryMinThreshold(raw: unknown): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 1) return DEFAULT_INVENTARIO_MIN_THRESHOLD;
  return Math.min(999, Math.max(1, Math.round(num)));
}

export function loadInventoryMinThreshold(): number {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_INVENTARIO_MIN_THRESHOLD;
    }
    const raw = window.localStorage.getItem(INVENTARIO_MIN_THRESHOLD_KEY);
    if (raw === null || raw.trim() === '') return DEFAULT_INVENTARIO_MIN_THRESHOLD;
    return sanitizeInventoryMinThreshold(Number(raw));
  } catch {
    return DEFAULT_INVENTARIO_MIN_THRESHOLD;
  }
}

export function saveInventoryMinThreshold(threshold: number): number {
  const clean = sanitizeInventoryMinThreshold(threshold);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(INVENTARIO_MIN_THRESHOLD_KEY, String(clean));
    }
  } catch {
    // ignore storage errors
  }
  return clean;
}

export function getPerfilStockBadgeStatus(
  cantidad: number,
  minThreshold: number
): PerfilStockBadgeStatus {
  const safeThreshold = sanitizeInventoryMinThreshold(minThreshold);
  const safeQty = Number.isFinite(Number(cantidad)) ? Math.max(0, Number(cantidad)) : 0;
  const isLow = safeQty < safeThreshold;
  return {
    level: isLow ? 'low' : 'ok',
    isLow,
    label: isLow ? `Bajo (< ${safeThreshold})` : 'Stock OK',
    threshold: safeThreshold,
  };
}

// =========================================================================
// LIMPIEZA SEGURA DE EQUIPOS DE PRUEBA / DUPLICADOS EN PANEL ADMIN
// =========================================================================
export interface CleanupTestDevicesInput {
  devices: CloudDeviceRecord[];
  adminKeys?: Array<{
    id: string;
    deviceId: string;
    cliente?: string;
    planLabel?: string;
    key?: string;
    tipo?: string;
    createdAt?: number;
  }>;
  currentDeviceId: string;
  currentUserUid?: string | null;
  nowMs?: number;
}

export interface CleanupTestDevicesResult {
  removableDeviceIds: string[];
  keptDeviceIds: string[];
  removableAdminKeyIds: string[];
}

const TEST_NAME_REGEX = /\b(prueba|pruebas|test|testing|demo|simulaci[oó]n|local|localhost|qa|sandbox)\b/i;

export function identifyTestDevicesToClean(
  input: CleanupTestDevicesInput
): CleanupTestDevicesResult {
  const currentNorm = normalizeDeviceIdInput(input.currentDeviceId || '');
  const nowMs = typeof input.nowMs === 'number' && Number.isFinite(input.nowMs) ? input.nowMs : Date.now();
  const STALE_FREE_MS = 7 * 24 * 60 * 60 * 1000;

  const removableSet = new Set<string>();
  const keptSet = new Set<string>();
  const normalizedList: Array<{ normId: string; rec: CloudDeviceRecord; ts: number }> = [];

  for (const rec of input.devices || []) {
    const normId = normalizeDeviceIdInput(rec.deviceId || '');
    if (!normId) continue;
    const ts = Math.max(
      Number(rec.lastSeenAt) || 0,
      Number(rec.updatedAt) || 0,
      Number(rec.firstSeenAt) || 0
    );
    normalizedList.push({ normId, rec, ts });
  }

  // Agrupar posibles duplicados por correo/dueño/nombre para conservar el más reciente o el actual
  const groupLatestMap = new Map<string, { normId: string; ts: number }>();
  for (const entry of normalizedList) {
    const email = String(entry.rec.linkedEmail || '').trim().toLowerCase();
    const ownerUid = String(entry.rec.ownerUid || '').trim();
    const isAdminOwnGroup = Boolean(input.currentUserUid && ownerUid && ownerUid === input.currentUserUid);
    const groupKey = email
      ? `email:${email}`
      : isAdminOwnGroup
        ? `uid:${ownerUid}`
        : '';
    if (!groupKey) continue;
    const prev = groupLatestMap.get(groupKey);
    if (entry.normId === currentNorm) {
      groupLatestMap.set(groupKey, { normId: entry.normId, ts: Number.MAX_SAFE_INTEGER });
    } else if (!prev || entry.ts > prev.ts) {
      groupLatestMap.set(groupKey, { normId: entry.normId, ts: entry.ts });
    }
  }

  for (const entry of normalizedList) {
    const { normId, rec, ts } = entry;
    if (normId === currentNorm) {
      keptSet.add(normId);
      continue;
    }

    const isTestRecord = isFreeTestProRecord({
      tipo: (rec as unknown as { tipo?: string }).tipo,
      planCode: rec.planCode,
      planLabel: rec.planLabel,
      keyCode: rec.lastKey,
    });
    const textBlob = [
      rec.cliente,
      rec.tallerNombre,
      rec.tallerResponsable,
      rec.deviceLabel,
      rec.planLabel,
    ]
      .filter(Boolean)
      .join(' ');
    const looksLikeTestName = TEST_NAME_REGEX.test(textBlob);

    const isActivePaidPro =
      Boolean(rec.proActive) &&
      !isTestRecord &&
      !looksLikeTestName &&
      (!rec.expiresAt || rec.expiresAt > nowMs);

    const email = String(rec.linkedEmail || '').trim().toLowerCase();
    const ownerUid = String(rec.ownerUid || '').trim();
    const isAdminOwnDuplicate = Boolean(
      input.currentUserUid && ownerUid && ownerUid === input.currentUserUid && normId !== currentNorm
    );
    const emailGroupWinner = email ? groupLatestMap.get(`email:${email}`)?.normId : undefined;
    const isOlderEmailDuplicate = Boolean(emailGroupWinner && emailGroupWinner !== normId && !isActivePaidPro);
    const isAutoTrialAnon = isUnassignedAutoTrialDevice(rec);
    const isStaleFreeSingleSession =
      !rec.proActive &&
      !rec.linkedEmail &&
      (Number(rec.totalSessions) || 0) <= 1 &&
      ts > 0 &&
      nowMs - ts > STALE_FREE_MS;

    if (
      isTestRecord ||
      looksLikeTestName ||
      isAdminOwnDuplicate ||
      isOlderEmailDuplicate ||
      isAutoTrialAnon ||
      isStaleFreeSingleSession
    ) {
      removableSet.add(normId);
    } else {
      keptSet.add(normId);
    }
  }

  const removableAdminKeyIds: string[] = [];
  for (const k of input.adminKeys || []) {
    const kDev = normalizeDeviceIdInput(k.deviceId || '');
    if (kDev && kDev === currentNorm) continue;
    const keyIsTest = isFreeTestProRecord({
      tipo: k.tipo,
      planLabel: k.planLabel,
      keyCode: k.key,
    });
    const keyMatchesTestName = TEST_NAME_REGEX.test(String(k.cliente || ''));
    if ((kDev && removableSet.has(kDev)) || keyIsTest || keyMatchesTestName) {
      removableAdminKeyIds.push(k.id);
    }
  }

  return {
    removableDeviceIds: Array.from(removableSet),
    keptDeviceIds: Array.from(keptSet),
    removableAdminKeyIds: Array.from(new Set(removableAdminKeyIds)),
  };
}



