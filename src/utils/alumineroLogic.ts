export type CategoriaTrabajo = 'ventanas' | 'puertas';

export type LineaId =
  | '3'
  | '2'
  | 'europea'
  | 'cancel-bano'
  | 'mosq-fijo'
  | 'mosq-corredizo'
  | 'puerta-2'
  | 'puerta-abatible'
  | 'puerta-europea';

export type ColorId = 'natural' | 'blanco' | 'negro' | 'bronce' | 'madera' | 'otro';
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
  | 'batiente'
  | 'cancel'
  | 'mosquitero';

export type PerfilCatalogoId =
  // Corrediza 3" (Alumer) + compartidos
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
  // Mosquiteros
  | 'mosq_marco'
  | 'riel_mosq';

export interface PlanDefinicion {
  code: 'G' | 'M' | 'Q' | 'A';
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

export const TRAMO_STD_CM = 610;
export const TRAMO_STD_M = 6.1;

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
    nombre: 'Natural / Anodizado',
    corto: 'Natural',
    extraM2: 0,
    swatch: '#C0C5CE',
    frameStroke: '#64748B',
    frameFill: 'url(#alum-nat)',
  },
  blanco: {
    id: 'blanco',
    nombre: 'Blanco',
    corto: 'Blanco',
    extraM2: 180,
    swatch: '#F8FAFC',
    frameStroke: '#94A3B8',
    frameFill: '#F8FAFC',
  },
  negro: {
    id: 'negro',
    nombre: 'Negro',
    corto: 'Negro',
    extraM2: 260,
    swatch: '#1E293B',
    frameStroke: '#0F172A',
    frameFill: '#334155',
  },
  bronce: {
    id: 'bronce',
    nombre: 'Bronce / Champagne',
    corto: 'Bronce',
    extraM2: 320,
    swatch: '#8C6D46',
    frameStroke: '#5C4426',
    frameFill: '#8C6D46',
  },
  madera: {
    id: 'madera',
    nombre: 'Madera',
    corto: 'Madera',
    extraM2: 780,
    swatch: '#7C4A27',
    frameStroke: '#5C3A1B',
    frameFill: 'url(#alum-mad)',
  },
  otro: {
    id: 'otro',
    nombre: 'Otro',
    corto: 'Otro',
    extraM2: 260,
    swatch:
      'conic-gradient(from 45deg, #C0C5CE 0deg, #F8FAFC 72deg, #1E293B 144deg, #8C6D46 216deg, #7C4A27 288deg, #C0C5CE 360deg)',
    frameStroke: '#475569',
    frameFill: '#94A3B8',
  },
};

export function getColorNombre(color: ColorId, colorCustom?: string): string {
  const cfg = COLORES_CONFIG[color] || COLORES_CONFIG.natural;
  if (color === 'otro' && colorCustom && colorCustom.trim()) {
    return colorCustom.trim();
  }
  return cfg.nombre;
}

export function getColorCorto(color: ColorId, colorCustom?: string): string {
  const cfg = COLORES_CONFIG[color] || COLORES_CONFIG.natural;
  if (color === 'otro' && colorCustom && colorCustom.trim()) {
    return colorCustom.trim();
  }
  return cfg.corto;
}

export interface VidrioConfig {
  id: VidrioId;
  nombre: string;
  extraM2: number;
  swatch: string;
  fill: string;
}

export const VIDRIOS_CONFIG: Record<VidrioId, VidrioConfig> = {
  claro4: { id: 'claro4', nombre: 'Claro 4 mm', extraM2: -150, swatch: '#DBEAFE', fill: '#DBEAFE' },
  claro6: { id: 'claro6', nombre: 'Claro 6 mm', extraM2: 0, swatch: '#BAE6FD', fill: '#BAE6FD' },
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
  customLabel?: string;
}

export const VIDRIO_COLOR_PRESETS: Array<{
  id: string;
  nombre: string;
  hex: string;
  swatch: string;
  vidrioCompatId: VidrioId;
}> = [
  {
    id: 'flot-claro',
    nombre: 'Claro / Transparente',
    hex: '#E0F2FE',
    swatch: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(224,242,254,0.9) 55%, rgba(186,230,253,0.75) 100%)',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'flot-filtrasol',
    nombre: 'Filtrasol / Gris',
    hex: '#64748B',
    swatch: 'linear-gradient(135deg, rgba(148,163,184,0.82) 0%, rgba(100,116,139,0.92) 55%, rgba(51,65,85,0.92) 100%)',
    vidrioCompatId: 'filtrasol6',
  },
  {
    id: 'flot-tintex',
    nombre: 'Tintex / Verde',
    hex: '#34D399',
    swatch: 'linear-gradient(135deg, rgba(167,243,208,0.88) 0%, rgba(52,211,153,0.9) 55%, rgba(5,150,105,0.85) 100%)',
    vidrioCompatId: 'tintex6',
  },
  {
    id: 'flot-esmerilado',
    nombre: 'Esmerilado',
    hex: '#CBD5E1',
    swatch: 'linear-gradient(135deg, rgba(248,250,252,0.95) 0%, rgba(203,213,225,0.92) 55%, rgba(148,163,184,0.75) 100%)',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'flot-reflecta',
    nombre: 'Reflecta',
    hex: '#38BDF8',
    swatch: 'linear-gradient(135deg, rgba(224,242,254,0.95) 0%, rgba(56,189,248,0.92) 48%, rgba(2,132,199,0.9) 100%)',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'flot-otro',
    nombre: 'Otro',
    hex: '#BAE6FD',
    swatch: 'conic-gradient(from 45deg, #E0F2FE 0deg, #64748B 72deg, #34D399 144deg, #CBD5E1 216deg, #38BDF8 288deg, #E0F2FE 360deg)',
    vidrioCompatId: 'claro6',
  },
];

export const RELLENO_CATEGORIAS_META: Array<{
  id: RellenoCategoriaId;
  nombre: string;
  corto: string;
  badge: string;
}> = [
  { id: 'flotado', nombre: 'Vidrio Flotado y Control Solar', corto: 'Flotado / Solar', badge: '10 tonos' },
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
    nombre: 'Claro / Transparente',
    descripcion: 'Cristal flotado transparente de alta claridad para ventana o puerta.',
    espesoresMm: [3, 4, 6, 9, 12],
    defaultEspesorMm: 6,
    precioBaseM2: 440,
    espesorPreciosM2: { 3: 240, 4: 290, 6: 440, 9: 680, 12: 960 },
    swatch: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, #E0F2FE 55%, rgba(186,230,253,0.85) 100%)',
    fill: '#E0F2FE',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'flot-filtrasol',
    categoria: 'flotado',
    nombre: 'Filtrasol / Gris',
    descripcion: 'Control solar tono humo/gris que reduce el calor interior.',
    espesoresMm: [3, 6],
    defaultEspesorMm: 6,
    precioBaseM2: 720,
    espesorPreciosM2: { 3: 520, 6: 720 },
    swatch: 'linear-gradient(135deg, rgba(148,163,184,0.85) 0%, #64748B 55%, rgba(51,65,85,0.92) 100%)',
    fill: '#64748B',
    vidrioCompatId: 'filtrasol6',
  },
  {
    id: 'flot-tintex',
    categoria: 'flotado',
    nombre: 'Tintex / Verde',
    descripcion: 'Cristal tintado verde arquitectónico con filtración UV y fresca apariencia.',
    espesoresMm: [3, 6],
    defaultEspesorMm: 6,
    precioBaseM2: 760,
    espesorPreciosM2: { 3: 560, 6: 760 },
    swatch: 'linear-gradient(135deg, rgba(167,243,208,0.88) 0%, #34D399 55%, rgba(5,150,105,0.88) 100%)',
    fill: '#34D399',
    vidrioCompatId: 'tintex6',
  },
  {
    id: 'flot-esmerilado',
    categoria: 'flotado',
    nombre: 'Esmerilado',
    descripcion: 'Cristal translúcido esmerilado ideal para privacidad y paso suave de luz.',
    espesoresMm: [4, 6, 9],
    defaultEspesorMm: 6,
    precioBaseM2: 780,
    espesorPreciosM2: { 4: 620, 6: 780, 9: 1120 },
    swatch: 'linear-gradient(135deg, rgba(248,250,252,0.96) 0%, #CBD5E1 55%, rgba(148,163,184,0.82) 100%)',
    fill: '#CBD5E1',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'flot-reflecta',
    categoria: 'flotado',
    nombre: 'Reflecta',
    descripcion: 'Vidrio reflectivo tipo espejo de día para control solar y privacidad en fachada.',
    espesoresMm: [6],
    defaultEspesorMm: 6,
    precioBaseM2: 1150,
    espesorPreciosM2: { 6: 1150 },
    swatch: 'linear-gradient(135deg, rgba(224,242,254,0.94) 0%, #38BDF8 48%, rgba(2,132,199,0.9) 100%)',
    fill: '#38BDF8',
    vidrioCompatId: 'claro6',
  },
  {
    id: 'flot-otro',
    categoria: 'flotado',
    nombre: 'Otro',
    descripcion: 'Tono o cristal especial especificado manualmente por el taller.',
    espesoresMm: [4, 6, 9, 12],
    defaultEspesorMm: 6,
    precioBaseM2: 650,
    espesorPreciosM2: { 4: 480, 6: 650, 9: 920, 12: 1250 },
    swatch: 'conic-gradient(from 45deg, #E0F2FE 0deg, #64748B 72deg, #34D399 144deg, #CBD5E1 216deg, #38BDF8 288deg, #E0F2FE 360deg)',
    fill: '#BAE6FD',
    vidrioCompatId: 'claro6',
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
  if (sel.materialId === 'flot-otro' && sel.customLabel && sel.customLabel.trim()) {
    return `${sel.customLabel.trim()} ${esp} mm`;
  }
  return `${item.nombre} ${esp} mm`;
}

export interface PerfilCatalogoItem {
  id: PerfilCatalogoId;
  familia: PerfilFamilia;
  nombre: string;
  codigoRef: string;
  uso: string;
  dimensiones: string;
  pesoAprox: string;
  notasTaller: string;
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
  tipo: 'vidrio' | 'malla';
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

export interface TrabajoParams {
  linea: LineaId;
  anchoCm: number;
  altoCm: number;
  color: ColorId;
  colorCustom?: string;
  vidrio: VidrioId;
  relleno?: PanelRellenoSelection;
  hojas: number;
  apertura: AperturaVentanaId;
  sentidoPuerta: 'izq' | 'der';
  puertaIntermedio: boolean;
  puertaEconomica: boolean;
  cancelEstilo?: CancelEstiloId;
  invertido: boolean;
  cantidad: number;
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

export const APP_SHARE_URL = 'https://alumineropro1.pages.dev';

export function getOfficialShareUrl(): string {
  return APP_SHARE_URL;
}

export function isFeatureProRequired(linea: LineaId, apertura: AperturaVentanaId, cantidad = 1): boolean {
  if (linea !== '3') return true;
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
    cancelEstilo = 'semilujo',
    cantidad,
    tolerancias,
  } = params;

  const qty = Math.max(1, Math.round(cantidad || 1));
  const A = Math.max(20, Number(anchoCm) || 120);
  const H = Math.max(20, Number(altoCm) || 100);
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

  if (linea === 'mosq-fijo') {
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
  } else if (linea === 'cancel-bano') {
    const rielSup = round1(Math.max(30, A - tolerancias.marcoH));
    const guiaInf = rielSup;
    const jambaH = round1(H);
    const numHojas = Math.max(2, Math.min(3, hojas || 2));
    const hojaV = round1(Math.max(30, H - tolerancias.hojaV));
    const hojaH = round1(Math.max(20, (A - tolerancias.hojaH) / numHojas + 2.0));
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
    const marcoH = round1(Math.max(20, A - tolerancias.marcoH));
    const marcoV = round1(H);
    const hojaV = round1(Math.max(20, H - tolerancias.hojaV));
    const hojaH = round1(Math.max(20, A - tolerancias.hojaH));

    if (linea === 'puerta-abatible') {
      perfiles.push(
        {
          perfilId: 'alumer_5844',
          nombre: 'Batiente Lujo PP Vert. (5844)',
          funcion: 'Laterales de marco abatible PP',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: marcoV,
        },
        {
          perfilId: 'alumer_5060',
          nombre: 'Batiente Superior Mini (5060)',
          funcion: 'Marco superior con tope de cierre',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: marcoH,
        },
        {
          perfilId: 'alumer_9204',
          nombre: 'Cerco Curvo (9204)',
          funcion: 'Largueros verticales de hoja abatible',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: hojaV,
        },
        {
          perfilId: 'alumer_9207',
          nombre: 'Cabezal PP (9207)',
          funcion: 'Horizontal superior de hoja PP',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: hojaH,
        },
        {
          perfilId: puertaEconomica ? 'zoclo1v' : 'alumer_9187',
          nombre: puertaEconomica ? 'Zoclo 1 Vena (7835-1V)' : 'Zoclo PP Reforzado (9187)',
          funcion: 'Horizontal inferior de hoja',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: hojaH,
        }
      );
      if (puertaIntermedio) {
        perfiles.push({
          perfilId: 'alumer_9183',
          nombre: 'Intermedio PP (9183)',
          funcion: 'División central de puerta',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: hojaH,
        });
      }
      perfiles.push({
        perfilId: 'alumer_6370',
        nombre: 'Junquillo PP (6370)',
        funcion: 'Sujeción interior de vidrio / duela',
        pzas: 4 * qty,
        angulo: '45°',
        medidaCm: round1(Math.max(10, (hojaV + hojaH) / 2 - 12)),
      });
    } else {
      perfiles.push(
        {
          perfilId: 'jamba',
          nombre: 'Canal Liso 2" (7825 / Marco Vert.)',
          funcion: 'Laterales de marco abatible',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: marcoV,
        },
        {
          perfilId: 'batiente',
          nombre: 'Batiente / Cabezal Marco Sup. (BAT-76)',
          funcion: 'Marco superior con tope de cierre',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: marcoH,
        },
        {
          perfilId: 'cerco',
          nombre: 'Cerco Chapa (7847 / Verticales Hoja)',
          funcion: 'Largueros de hoja abatible',
          pzas: 2 * qty,
          angulo: '90°',
          medidaCm: hojaV,
        },
        {
          perfilId: 'cabecero',
          nombre: 'Cabecero de Hoja (7835)',
          funcion: 'Horizontal superior de puerta',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: hojaH,
        },
        {
          perfilId: puertaEconomica ? 'zoclo1v' : 'zoclo2v',
          nombre: puertaEconomica ? 'Zoclo 1V (7835-1V)' : 'Zoclo 2 Venas (7842)',
          funcion: 'Horizontal inferior de hoja',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: hojaH,
        }
      );
      if (puertaIntermedio) {
        perfiles.push({
          perfilId: 'alumer_9382',
          nombre: 'Peinazo Intermedio (9382)',
          funcion: 'División central de puerta',
          pzas: 1 * qty,
          angulo: '90°',
          medidaCm: hojaH,
        });
      }
    }

    const vidW = round1(Math.max(10, A - tolerancias.vidAncho));
    const vidH = round1(
      Math.max(10, puertaIntermedio ? (H - tolerancias.vidAlto) / 2 : H - tolerancias.vidAlto)
    );
    const vidPzas = (puertaIntermedio ? 2 : 1) * qty;
    vidrios.push({
      tipo: 'vidrio',
      nombre: `Cristal Puerta (${vidLabel})`,
      pzas: vidPzas,
      anchoCm: vidW,
      altoCm: vidH,
      areaM2: round2(((vidW * vidH) / 10000) * vidPzas),
      espesorLabel: vidLabel,
    });

    herrajes.push(
      {
        nombre: 'Bisagras reforzadas para puerta',
        detalle: '3 bisagras libro o tubulares por puerta',
        cantidad: 3 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Chapa / Cerradura de manija o pomo',
        detalle: 'Incluye contra en batiente',
        cantidad: 1 * qty,
        unidad: 'jgo',
      },
      {
        nombre: 'Pijas armado #10 × 1 1/2" y #10 × 2"',
        detalle: 'Armado de zoclo, cabecero y marco',
        cantidad: 18 * qty,
        unidad: 'pzas',
      },
      {
        nombre: 'Vinil pata / cuña para cristal',
        detalle: 'Acristalamiento perimetral',
        cantidad: round2(((vidW + vidH) * 2 * (puertaIntermedio ? 2 : 1)) / 100 * qty),
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
      // Corrediza estándar (3" Alumer, 2", Europea, Panorámica)
      const numHojas = Math.max(2, Math.min(4, hojas || 2));
      const hojaVert = round1(Math.max(15, H - tolerancias.hojaV));
      const hojaHoriz = round1(
        Math.max(15, (A - tolerancias.hojaH) / numHojas + (numHojas >= 2 ? 1.5 : 0))
      );

      perfiles.push(
        {
          perfilId: 'cabezal',
          nombre: `Cabezal (${linea === '3' ? '7836' : linea.toUpperCase()})`,
          funcion: 'Marco superior doble vía',
          pzas: 1 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: marcoHoriz,
        },
        {
          perfilId: 'riel',
          nombre: `Riel (${linea === '3' ? '7857' : linea.toUpperCase()})`,
          funcion: 'Marco inferior doble vía',
          pzas: 1 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: marcoHoriz,
        },
        {
          perfilId: 'jamba',
          nombre: `Jamba (${linea === '3' ? '7825' : linea.toUpperCase()})`,
          funcion: 'Marcos laterales verticales',
          pzas: 2 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: marcoVert,
        },
        {
          perfilId: 'cerco',
          nombre: `Cerco (${linea === '3' ? '7847' : linea.toUpperCase()})`,
          funcion: 'Vertical exterior de hojas',
          pzas: 2 * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: hojaVert,
        },
        {
          perfilId: 'traslape',
          nombre: `Traslape (${linea === '3' ? '7848' : linea.toUpperCase()})`,
          funcion: 'Vertical cruce entre hojas',
          pzas: (numHojas === 2 ? 2 : numHojas === 3 ? 4 : 6) * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: hojaVert,
        },
        {
          perfilId: 'cabecero',
          nombre: `Zoclo / Cabecero (${linea === '3' ? '7835' : linea.toUpperCase()})`,
          funcion: `Horizontales superior de ${numHojas} hojas`,
          pzas: numHojas * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: hojaHoriz,
        },
        {
          perfilId: 'zoclo2v',
          nombre: `Zoclo Inferior (${linea === '3' ? '7842' : linea.toUpperCase()})`,
          funcion: `Inferior reforzado de ${numHojas} hojas`,
          pzas: numHojas * qty,
          angulo: es45 ? '45°' : '90°',
          medidaCm: hojaHoriz,
        }
      );

      if (H >= 165 && linea === '3') {
        perfiles.push({
          perfilId: 'alumer_9382',
          nombre: 'Intermedio (9382)',
          funcion: 'Divisor horizontal de hojas (>165 cm)',
          pzas: numHojas * qty,
          angulo: '90°',
          medidaCm: hojaHoriz,
        });
      }

      const vidW = round1(Math.max(10, hojaHoriz - tolerancias.vidAncho + 2.0));
      const vidH = round1(Math.max(10, H - tolerancias.vidAlto));
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

      const hojasMoviles = numHojas === 4 ? 2 : 1;
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
          nombre: linea === '3' ? 'Carretilla doble/tándem 3"' : `Carretilla ${LINEAS_CONFIG[linea].nombre}`,
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
          cantidad: round2(((hojaVert * (numHojas * 2)) / 100) * qty),
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

export interface ValidationResult {
  ok: boolean;
  plan?: PlanDefinicion;
  customDays?: number;
  error?: string;
}

export function validateActivationKey(deviceId: string, keyInput: string): ValidationResult {
  const clean = keyInput.trim().toUpperCase();
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
  colorCustom?: string;
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
    for (const p of item.despiece.perfiles) {
      const key = `${item.linea}__${p.perfilId}__${item.color}`;
      const prev = map.get(key);
      const addCm = p.pzas * p.medidaCm;
      if (prev) {
        prev.cm += addCm;
      } else {
        map.set(key, {
          linea: item.linea,
          perfilId: p.perfilId,
          perfilNombre: CATALOGO_PERFILES.find((c) => c.id === p.perfilId)?.nombre || p.nombre,
          color: item.color,
          cm: addCm,
        });
      }
    }
  }

  const sobrantesMap: Record<string, number> = {};
  if (Array.isArray(sobrantes)) {
    for (const s of sobrantes) {
      const k = `${s.linea}__${s.perfilId}__${s.color}`;
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
  const targetColor = normalizeColorId(color);
  let total = 0;
  for (const [k, rawVal] of Object.entries(inventario || {})) {
    const val = Number(rawVal) || 0;
    if (val <= 0) continue;
    const parsed = parseInventarioKey(k);
    if (parsed.linea === linea && parsed.perfilId === perfilId && parsed.color === targetColor) {
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
  const targetColor = normalizeColorId(color);
  let restante = Math.max(0, round2(Number(tramosRequeridos) || 0));
  if (restante <= 0) return next;

  const matchingKeys = Object.keys(next)
    .filter((k) => {
      const val = Number(next[k]) || 0;
      if (val <= 0) return false;
      const parsed = parseInventarioKey(k);
      return parsed.linea === linea && parsed.perfilId === perfilId && parsed.color === targetColor;
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

export const OFFICIAL_ALUMINERO_URL = 'https://alumineropro1.pages.dev';

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
  return `${OFFICIAL_ALUMINERO_URL}/?${params.toString()}`;
}

export function parseReferralFromSearch(search: string): ParsedColleagueReferral | null {
  try {
    const cleanSearch = String(search || '').trim();
    if (!cleanSearch) return null;
    const params = new URLSearchParams(cleanSearch.startsWith('?') ? cleanSearch.slice(1) : cleanSearch);
    const rawRef = params.get('ref');
    if (!rawRef) return null;
    const refName = sanitizeReferralSenderName(rawRef);
    if (!refName) return null;
    const rawPromo = params.get('promo');
    const parsedPromo = rawPromo ? parseInt(rawPromo, 10) : 1;
    const promoNumber = Number.isFinite(parsedPromo) && parsedPromo >= 1 ? parsedPromo : 1;
    return { refName, promoNumber };
  } catch {
    return null;
  }
}

export function buildColleaguePromoWhatsappMessage(
  refName: string,
  deviceId: string,
  promoNumber: number
): string {
  const cleanRef = sanitizeReferralSenderName(refName) || 'Un colega';
  const cleanDev = String(deviceId || '').trim().toUpperCase() || 'SIN-ID';
  const safePromo = Math.max(1, Math.round(Number(promoNumber) || 1));
  return `Hola, me llegó este mensaje de un colega (${cleanRef}) para probar Aluminero Pro. Mi ID de equipo es: ${cleanDev} (Promoción enviada #${safePromo}). ¿Me compartes mi código de 3 días gratis?`;
}

export function buildColleaguePromoWhatsappUrl(
  whatsappDigitsRaw: string,
  refName: string,
  deviceId: string,
  promoNumber: number
): string {
  const digits = String(whatsappDigitsRaw || '').replace(/\D+/g, '');
  const fullNumber =
    digits.length === 10
      ? `52${digits}`
      : digits.length > 10
        ? digits
        : '';
  const msg = buildColleaguePromoWhatsappMessage(refName, deviceId, promoNumber);
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

