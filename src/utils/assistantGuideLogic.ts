import type { PerfilFamilia } from './alumineroLogic';

export type RobotPoseMode = 'classic' | 'waving' | 'technical';

export interface RobotPoseInput {
  currentView?: string;
  open?: boolean;
  hopActive?: boolean;
  celebrating?: boolean;
  gestureActive?: boolean;
  isLongPressing?: boolean;
}

const TECHNICAL_MEASUREMENT_VIEWS = new Set([
  'trabajo',
  'modulacion',
  'vidrio',
  'hoja',
  'levantamiento',
]);

/**
 * Resuelve cuál de las 3 vistas integradas del Robot Alumi-Bot 3D debe mostrarse:
 * - 'waving': al tocarlo, abrir ayuda o celebrar (mano levantada saludando + pulso cian).
 * - 'technical': en pantallas de medición/cálculo o al mantener presionado (casco LED + medidor láser).
 * - 'classic': en reposo en pantallas generales (cuerpo metálico cian clásico parpadeante).
 */
export function resolveRobotPose(input: RobotPoseInput): RobotPoseMode {
  if (input.isLongPressing || input.gestureActive) {
    return 'technical';
  }
  if (input.open || input.hopActive || input.celebrating) {
    return 'waving';
  }
  if (input.currentView && TECHNICAL_MEASUREMENT_VIEWS.has(input.currentView)) {
    return 'technical';
  }
  return 'classic';
}

export type AssistantGuideTarget =
  | 'hoja'
  | 'ventanas'
  | 'puertas'
  | 'levantamiento'
  | 'modulacion';

export interface AssistantGuideResponse {
  id: string;
  questionLabel: string;
  title: string;
  answer: string;
  target: AssistantGuideTarget;
  targetLabel: string;
  steps: [string, string, string];
}

export const ASSISTANT_QUICK_CHIPS: Array<{ id: string; label: string; query: string }> = [
  { id: 'cotizacion', label: 'Hacer una cotización', query: '¿Cómo hago una cotización?' },
  { id: 'descuentos', label: 'Sacar descuentos de ventana', query: '¿Cómo saco descuentos de ventana?' },
  { id: 'cortes610', label: 'Acomodar cortes 6.10 m', query: '¿Cómo acomodo cortes en tramos de 6.10 m?' },
  { id: 'escanear', label: 'Escanear dibujo', query: '¿Cómo escaneo un dibujo o croquis de obra?' },
];

const GUIDE_CATALOG: Record<string, AssistantGuideResponse> = {
  cotizacion: {
    id: 'cotizacion',
    questionLabel: 'Hacer una cotización',
    title: 'Cómo armar tu cotización paso a paso',
    answer:
      'En la Hoja de Cotización puedes concentrar todas tus ventanas y puertas, ajustar tu margen de ganancia y descargar el PDF profesional con el logo de tu taller listo para mandar por WhatsApp.',
    target: 'hoja',
    targetLabel: 'Hoja de Cotización',
    steps: [
      'Agrega las piezas desde Ventanas, Puertas o desde Levantamiento Rápido.',
      'Revisa los datos del cliente, el desglose de precios y tu margen de utilidad.',
      'Toca "Generar PDF" o "Compartir WhatsApp" para enviar el presupuesto al instante.',
    ],
  },
  descuentos: {
    id: 'descuentos',
    questionLabel: 'Sacar descuentos de ventana',
    title: 'Descuentos exactos de perfiles y vidrio',
    answer:
      'En el apartado de Ventanas eliges tu línea (3", 2", Europea o EuroAlum), capturas ancho y alto en cm y la app calcula al instante las medidas exactas de corte de cada perfil, vidrio y herrajes.',
    target: 'ventanas',
    targetLabel: 'Ventanas y Descuentos',
    steps: [
      'Selecciona la línea de aluminio (Nacional 3", 2", Europea o EuroAlum) y tipo de apertura.',
      'Captura el ancho y alto del vano en centímetros y elige el número de hojas.',
      'Revisa la tabla de Perfiles, Vidrios y Herrajes o toca "Agregar a Hoja" para cotizar.',
    ],
  },
  puertas: {
    id: 'puertas',
    questionLabel: 'Calcular puertas de aluminio',
    title: 'Despiece y cotización de Puertas',
    answer:
      'En Puertas puedes configurar Batiente Alumer, Línea 2" o Europea con duela, vidrio o panel, obteniendo las medidas de cerco, cabezal, zoclo, intermedio y herrajes de forma inmediata.',
    target: 'puertas',
    targetLabel: 'Puertas',
    steps: [
      'Elige el sistema de puerta (Batiente Alumer, 2" o Europea) y el acabado.',
      'Ingresa el ancho y alto en cm junto con el tipo de relleno (vidrio o duela).',
      'Consulta la lista de cortes a 90°/45° y agrégala directo a tu Hoja de Cotización.',
    ],
  },
  cortes610: {
    id: 'cortes610',
    questionLabel: 'Acomodar cortes 6.10 m',
    title: 'Optimización de tramos de 6.10 m',
    answer:
      'El módulo de Modulación y Cortes agrupa tus medidas por perfil y acomoda automáticamente los cortes en barras comerciales de 6.10 m (610 cm) para minimizar el desperdicio de aluminio.',
    target: 'modulacion',
    targetLabel: 'Modulación y Cortes 6.10 m',
    steps: [
      'Selecciona la línea de aluminio y agrega las piezas con sus medidas en cm.',
      'Avanza al paso de "Tramos de 6.10 m ya acomodados" para ver cada barra optimizada.',
      'Revisa cuántos tramos comprar y el sobrante útil de cada barra antes de cortar.',
    ],
  },
  escanear: {
    id: 'escanear',
    questionLabel: 'Escanear dibujo',
    title: 'Escáner de Croquis con IA en obra',
    answer:
      'Dentro de Levantamiento Rápido abre "Escáner de Croquis con IA", toma foto a tu dibujo hecho a mano en libreta y la app detectará automáticamente medidas, distribución de hojas (O-X) y cantidad.',
    target: 'levantamiento',
    targetLabel: 'Levantamiento Rápido',
    steps: [
      'Toca el acordeón "Escáner de Croquis con IA" en la parte superior del levantamiento.',
      'Toma una foto clara de tu croquis en papel o elige una imagen desde tu galería.',
      'Verifica las medidas detectadas y envíalas con un toque a Cotización o Cortes 6.10 m.',
    ],
  },
};

function normalizeSpanishText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Motor 100% offline de guía paso a paso para el cuadro de diálogo del Asistente.
 */
export function answerAssistantQuestion(rawQuery: string): AssistantGuideResponse {
  const q = normalizeSpanishText(rawQuery);

  if (
    /escan|croquis|dibuj|foto|libreta|camara|ia\b|levantamiento|medir en obra|medidas en obra/.test(q)
  ) {
    return GUIDE_CATALOG.escanear;
  }

  if (
    /6\.10|610|tramo|barra|acomod|optimiz|desperdicio|sobrante|modul|corte/.test(q) &&
    !/descuento|ventana/.test(q)
  ) {
    return GUIDE_CATALOG.cortes610;
  }

  if (/puerta|batiente|duela|bisagra|chapa/.test(q)) {
    return GUIDE_CATALOG.puertas;
  }

  if (
    /descuento|ventana|hoja|corrediz|linea 3|linea 2|europea|euroalum|despiece|vidrio|cabezal|riel|jamba/.test(
      q
    )
  ) {
    return GUIDE_CATALOG.descuentos;
  }

  if (/cotiz|presupuesto|precio|pdf|margen|cliente|whatsapp|hoja/.test(q)) {
    return GUIDE_CATALOG.cotizacion;
  }

  if (/6\.10|610|tramo|barra|acomod|optimiz|corte/.test(q)) {
    return GUIDE_CATALOG.cortes610;
  }

  return {
    id: 'general-cotizacion',
    questionLabel: rawQuery.trim() || 'Guía rápida',
    title: 'Empieza rápido en Aluminero Pro',
    answer:
      'Para trabajar más rápido en taller te recomiendo iniciar en Levantamiento Rápido para anotar o escanear medidas de obra, o entrar directo a Ventanas / Hoja de Cotización para sacar descuentos y PDF.',
    target: 'hoja',
    targetLabel: 'Hoja de Cotización',
    steps: [
      'Anota tus medidas en Levantamiento Rápido o configura cada pieza en Ventanas / Puertas.',
      'Revisa los descuentos exactos y los tramos de 6.10 m ya acomodados.',
      'Descarga o comparte el PDF final desde la Hoja de Cotización.',
    ],
  };
}

export type CatalogPlaceholderKey =
  | 'corrediza'
  | 'europea'
  | 'batiente'
  | 'cancel'
  | 'mosquitero';

export const CATALOG_PLACEHOLDER_KEY_BY_FAMILIA: Record<PerfilFamilia, CatalogPlaceholderKey> = {
  corrediza3: 'corrediza',
  fijo3: 'corrediza',
  nacional2: 'corrediza',
  espanola: 'europea',
  serie1400: 'europea',
  batiente: 'batiente',
  herralum: 'batiente',
  cancel: 'cancel',
  mosquitero: 'mosquitero',
  perfileto: 'mosquitero',
};
