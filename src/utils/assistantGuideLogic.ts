import { GOOGLE_CLOUD_PERSUASIVE_TIP, type PerfilFamilia } from './alumineroLogic';

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

export const CLOUD_BACKUP_PERSUASIVE_MSG = GOOGLE_CLOUD_PERSUASIVE_TIP;

export const ASSISTANT_QUICK_CHIPS: Array<{ id: string; label: string; query: string }> = [
  { id: 'cotizacion', label: '¿Cómo cotizar?', query: '¿Dónde y cómo hago una cotización?' },
  { id: 'descuentos', label: 'Descuentos ventana', query: '¿Dónde saco descuentos de ventana?' },
  { id: 'cortes610', label: 'Cortes 6.10 m', query: '¿Para qué sirve y cómo uso cortes 6.10 m?' },
  { id: 'respaldo', label: 'Guardar en la nube', query: '¿Cómo guardo mis cotizaciones con Google?' },
];

const GUIDE_CATALOG: Record<string, AssistantGuideResponse> = {
  cotizacion: {
    id: 'cotizacion',
    questionLabel: 'Hacer una cotización',
    title: 'Hoja de Cotización · Ubicación y Guía',
    answer:
      'Está en el botón azul grande del Menú Principal ("Hoja de Cotización"). Sirve para juntar todas tus ventanas y puertas, ajustar tu margen de ganancia, agregar datos del cliente y descargar el PDF profesional listo para WhatsApp.',
    target: 'hoja',
    targetLabel: 'Ir a Hoja de Cotización',
    steps: [
      'Agrega piezas desde Ventanas, Puertas o Levantamiento Rápido.',
      'Abre el acordeón de Datos del Cliente y verifica tus precios y margen.',
      'Toca "Generar PDF" o "Compartir WhatsApp" para mandarlo al cliente.',
    ],
  },
  descuentos: {
    id: 'descuentos',
    questionLabel: 'Sacar descuentos de ventana',
    title: 'Ventanas y Descuentos · Ubicación y Guía',
    answer:
      'Lo encuentras en la tarjeta "Ventanas" del Menú Principal. Sirve para calcular al instante los cortes exactos de perfiles, vidrios y herrajes en líneas 3", 2", Española, Serie 1400 o con tus propias fórmulas de Mi Taller.',
    target: 'ventanas',
    targetLabel: 'Ir a Ventanas y Descuentos',
    steps: [
      'Elige la línea de aluminio, el acabado/color y el tipo de ventana.',
      'Escribe ancho y alto en cm (y activa mosquitero si lleva).',
      'Consulta tus cortes exactos o envíalos directo a Cotización o Cortes 6.10 m.',
    ],
  },
  puertas: {
    id: 'puertas',
    questionLabel: 'Calcular puertas de aluminio',
    title: 'Puertas y Canceles · Ubicación y Guía',
    answer:
      'Entra a la tarjeta "Puertas" en el Menú Principal. Sirve para sacar el despiece completo de cerco, cabezal, zoclo, intermedio, duela o vidrio en Batiente Alumer, Línea 2", Española o Canceles de Baño.',
    target: 'puertas',
    targetLabel: 'Ir a Puertas',
    steps: [
      'Elige el sistema de puerta o cancel y el color del perfil.',
      'Captura ancho, alto en cm y elige el relleno (vidrio, duela o combinado).',
      'Revisa la lista de cortes a 90°/45° y agrégala directo a tu cotización.',
    ],
  },
  cortes610: {
    id: 'cortes610',
    questionLabel: 'Acomodar cortes 6.10 m',
    title: 'Modulación y Cortes 6.10 m · Ubicación y Guía',
    answer:
      'Está en la tarjeta "Modulación y Cortes" del Menú Principal. Sirve para acomodar todos tus cortes en tramos comerciales de 6.10 m (610 cm), aprovechar sobrantes de tu inventario del mismo color y evitar desperdicio de material.',
    target: 'modulacion',
    targetLabel: 'Ir a Cortes 6.10 m',
    steps: [
      'Elige modelo, mosquitero, línea y captura las medidas de tus piezas.',
      'Avanza al Paso 5 ("Checklist de cortes y tramos") para ver el acomodo.',
      'Revisa cuántos tramos completos usarás y guarda los sobrantes útiles en inventario.',
    ],
  },
  escanear: {
    id: 'escanear',
    questionLabel: 'Escanear dibujo o medidas en obra',
    title: 'Levantamiento Rápido y Escáner IA',
    answer:
      'Está en el botón destacado naranja "Levantamiento Rápido" arriba del Menú Principal. Sirve para anotar medidas rápido en obra o tomarle foto a tu croquis hecho a mano para que la IA lo convierta en piezas listas para cotizar.',
    target: 'levantamiento',
    targetLabel: 'Ir a Levantamiento Rápido',
    steps: [
      'Toca "Levantamiento Rápido" y abre el acordeón "Escáner de Croquis con IA".',
      'Toma una foto a tu dibujo en libreta o elige una imagen desde tu galería.',
      'Verifica las medidas detectadas y envíalas con un toque a Cotización o Cortes 6.10 m.',
    ],
  },
  respaldo: {
    id: 'respaldo',
    questionLabel: 'Guardar cotizaciones en la nube',
    title: 'Respaldo en la Nube con Google',
    answer: `${CLOUD_BACKUP_PERSUASIVE_MSG} El botón de Google está en el Menú lateral (☰ arriba a la derecha) o en la barra superior de Inicio.`,
    target: 'hoja',
    targetLabel: 'Ir a Hoja de Cotización',
    steps: [
      'Abre el menú lateral (☰) arriba a la derecha en la pantalla principal.',
      'Toca el botón "Conectar con Google" en la tarjeta de Respaldo en la Nube.',
      'Tus cotizaciones, fórmulas de Mi Taller e inventario se sincronizarán solos.',
    ],
  },
  taller: {
    id: 'taller',
    questionLabel: 'Fórmulas personalizadas e Inventario',
    title: 'Mi Taller e Inventario · Ubicación y Guía',
    answer:
      'En el Menú Principal encontrarás "Mi Taller" (para guardar, editar o borrar tus propias fórmulas de descuento) e "Inventario" (para llevar el control de tus perfiles, sobrantes por color, vidrios y herrajes).',
    target: 'ventanas',
    targetLabel: 'Ir a Ventanas',
    steps: [
      'Entra a "Mi Taller" desde el Menú Principal para crear o editar tus fórmulas.',
      'Usa el ícono de lápiz junto a cualquier fórmula guardada si quieres ajustarla.',
      'En "Inventario" registra tus sobrantes con su color exacto para reutilizarlos.',
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

export function answerAssistantQuestion(rawQuery: string): AssistantGuideResponse {
  const q = normalizeSpanishText(rawQuery);

  if (
    /nube|google|respald|perder|lapiz|cuaderno|papelit|sincroniz|cuenta|guardar/.test(q) &&
    !/pdf/.test(q)
  ) {
    return GUIDE_CATALOG.respaldo;
  }

  if (
    /mi taller|formula|inventario|sobrante|perfil guardado|editar formula|herramienta/.test(q)
  ) {
    return GUIDE_CATALOG.taller;
  }

  if (
    /escan|croquis|dibuj|foto|libreta|camara|ia\b|levantamiento|medir en obra|medidas en obra/.test(q)
  ) {
    return GUIDE_CATALOG.escanear;
  }

  if (
    /6\.10|610|tramo|barra|acomod|optimiz|desperdicio|modul|corte/.test(q) &&
    !/descuento|ventana/.test(q)
  ) {
    return GUIDE_CATALOG.cortes610;
  }

  if (/puerta|batiente|duela|bisagra|chapa|cancel|bano/.test(q)) {
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

  return {
    id: 'general-mapa',
    questionLabel: rawQuery.trim() || 'Mapa de la app',
    title: '¿Dónde está cada cosa en Aluminero Pro?',
    answer:
      'Arriba en el Menú tienes "Levantamiento Rápido" (anotar/escanear en obra) y "Hoja de Cotización" (armar presupuesto y PDF). Abajo están "Ventanas", "Puertas", "Modulación y Cortes 6.10 m", "Mi Taller" (tus fórmulas) e "Inventario".',
    target: 'hoja',
    targetLabel: 'Ir a Hoja de Cotización',
    steps: [
      'Anota medidas en Levantamiento Rápido o calcula en Ventanas / Puertas.',
      'Optimiza tus barras en Modulación y Cortes 6.10 m sin mezclar colores.',
      'Conecta tu cuenta de Google en el menú ☰ para respaldar todo en la nube.',
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
