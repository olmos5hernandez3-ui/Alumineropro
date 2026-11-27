import {
  applyBulkPriceAdjustment,
  LineaId,
} from './alumineroLogic';
import type { TallerConfig } from './storageHelpers';

// ==================== 1. AJUSTE DE PRECIOS DE UN GOLPE (%) ====================

export type BulkCategoryId = 'aluminio' | 'vidrio' | 'herrajes' | 'todo';

export type AcabadoFiltroId =
  | 'todos'
  | 'natural'
  | 'blanco'
  | 'negro'
  | 'champagne'
  | 'madera'
  | 'bronce';

export interface AcabadoAjusteOption {
  id: AcabadoFiltroId;
  label: string;
  shortLabel: string;
  swatch: string;
  /** Multiplicador orientativo respecto al precio lista de tramo natural (6.10 m) */
  defaultFactor: number;
}

export const ACABADOS_AJUSTE_OPTIONS: AcabadoAjusteOption[] = [
  {
    id: 'todos',
    label: 'Todos los perfiles (catálogo completo)',
    shortLabel: 'Todos los perfiles',
    swatch: '#2563EB',
    defaultFactor: 1,
  },
  {
    id: 'natural',
    label: 'Acabado Natural (Anodizado)',
    shortLabel: 'Natural',
    swatch: '#CBD5E1',
    defaultFactor: 1,
  },
  {
    id: 'blanco',
    label: 'Acabado Blanco',
    shortLabel: 'Blanco',
    swatch: '#F8FAFC',
    defaultFactor: 1.12,
  },
  {
    id: 'negro',
    label: 'Acabado Negro',
    shortLabel: 'Negro',
    swatch: '#1E293B',
    defaultFactor: 1.18,
  },
  {
    id: 'champagne',
    label: 'Acabado Champagne',
    shortLabel: 'Champagne',
    swatch: '#D6C29F',
    defaultFactor: 1.15,
  },
  {
    id: 'madera',
    label: 'Acabado Madera / Sublimado',
    shortLabel: 'Madera',
    swatch: '#8B5A2B',
    defaultFactor: 1.45,
  },
  {
    id: 'bronce',
    label: 'Acabado Bronce / Hueso',
    shortLabel: 'Bronce',
    swatch: '#7C5E44',
    defaultFactor: 1.16,
  },
];

export const SPECIFIC_ACABADO_IDS: Exclude<AcabadoFiltroId, 'todos'>[] = [
  'natural',
  'blanco',
  'negro',
  'champagne',
  'madera',
  'bronce',
];

export function getAcabadoOption(id: AcabadoFiltroId): AcabadoAjusteOption {
  return (
    ACABADOS_AJUSTE_OPTIONS.find((opt) => opt.id === id) ||
    ACABADOS_AJUSTE_OPTIONS[0]
  );
}

export function getAcabadoCurrentPrice(
  acabadoId: Exclude<AcabadoFiltroId, 'todos'>,
  precioListaTramo: number,
  preciosPorAcabado?: Record<string, number>
): number {
  const custom = preciosPorAcabado?.[acabadoId];
  if (typeof custom === 'number' && Number.isFinite(custom) && custom > 0) {
    return Math.round(custom);
  }
  const opt = getAcabadoOption(acabadoId);
  const safeBase = Math.max(10, Number(precioListaTramo) || 680);
  return Math.max(10, Math.round(safeBase * opt.defaultFactor));
}

export function formatSignedPct(pct: number): string {
  const safe = Number(pct) || 0;
  return safe > 0 ? `+${safe}%` : `${safe}%`;
}

export function getBulkScopeLabel(
  acabadoFilter: AcabadoFiltroId,
  category: BulkCategoryId
): string {
  if (acabadoFilter !== 'todos') {
    return getAcabadoOption(acabadoFilter).label;
  }
  switch (category) {
    case 'aluminio':
      return 'Todos los perfiles de aluminio';
    case 'vidrio':
      return 'Todos los vidrios y paneles';
    case 'herrajes':
      return 'Todos los herrajes';
    case 'todo':
    default:
      return 'Todos los perfiles y tarifas';
  }
}

export function buildBulkAdjustmentConfirmMessage(
  pct: number,
  acabadoFilter: AcabadoFiltroId,
  category: BulkCategoryId
): string {
  const scopeLabel = getBulkScopeLabel(acabadoFilter, category);
  return `¿Seguro que deseas ajustar todos los precios seleccionados (${scopeLabel}) en ${formatSignedPct(pct)}?`;
}

export interface BulkAdjustmentUndoSnapshot {
  precioListaTramo: number;
  tarifasBase: Partial<Record<LineaId, number>>;
  rellenoPreciosM2: Record<string, number>;
  herrajesPrecios: Record<string, number>;
  preciosPorAcabado: Record<string, number>;
  appliedPct: number;
  scopeLabel: string;
  appliedAt: number;
}

export interface OneShotPriceAdjustmentInput {
  pct: number;
  acabadoFilter: AcabadoFiltroId;
  category: BulkCategoryId;
  tallerSnapshot: Pick<
    TallerConfig,
    | 'precioListaTramo'
    | 'tarifasBase'
    | 'rellenoPreciosM2'
    | 'herrajesPrecios'
    | 'preciosPorAcabado'
  >;
}

export interface OneShotPriceAdjustmentResult {
  nextPatch: Partial<TallerConfig>;
  undoSnapshot: BulkAdjustmentUndoSnapshot;
  updatedCount: number;
  scopeLabel: string;
  formattedPct: string;
}

export function applyOneShotPriceAdjustment(
  input: OneShotPriceAdjustmentInput
): OneShotPriceAdjustmentResult {
  const safePct = Math.max(-80, Math.min(200, Number(input.pct) || 0));
  const factor = 1 + safePct / 100;
  const scopeLabel = getBulkScopeLabel(input.acabadoFilter, input.category);

  const prevPreciosAcabado: Record<string, number> = {
    ...(input.tallerSnapshot.preciosPorAcabado || {}),
  };

  const undoSnapshot: BulkAdjustmentUndoSnapshot = {
    precioListaTramo: input.tallerSnapshot.precioListaTramo,
    tarifasBase: { ...(input.tallerSnapshot.tarifasBase || {}) },
    rellenoPreciosM2: { ...(input.tallerSnapshot.rellenoPreciosM2 || {}) },
    herrajesPrecios: { ...(input.tallerSnapshot.herrajesPrecios || {}) },
    preciosPorAcabado: { ...prevPreciosAcabado },
    appliedPct: safePct,
    scopeLabel,
    appliedAt: Date.now(),
  };

  // Caso 1: Ajuste filtrado a un acabado/color específico
  if (input.acabadoFilter !== 'todos') {
    const finishId = input.acabadoFilter;
    const currentPrice = getAcabadoCurrentPrice(
      finishId,
      input.tallerSnapshot.precioListaTramo,
      prevPreciosAcabado
    );
    const nextPrice = Math.max(10, Math.round(currentPrice * factor));
    const nextPreciosAcabado: Record<string, number> = {
      ...prevPreciosAcabado,
      [finishId]: nextPrice,
    };

    return {
      nextPatch: {
        preciosPorAcabado: nextPreciosAcabado,
      },
      undoSnapshot,
      updatedCount: 1,
      scopeLabel,
      formattedPct: formatSignedPct(safePct),
    };
  }

  // Caso 2: Ajuste general a todos los perfiles/tarifas de la categoría elegida
  const baseRes = applyBulkPriceAdjustment({
    category: input.category,
    pct: safePct,
    precioListaTramo: input.tallerSnapshot.precioListaTramo,
    tarifasBase: input.tallerSnapshot.tarifasBase || {},
    rellenoPreciosM2: input.tallerSnapshot.rellenoPreciosM2 || {},
    herrajesPrecios: input.tallerSnapshot.herrajesPrecios || {},
  });

  const nextPreciosAcabado: Record<string, number> = { ...prevPreciosAcabado };
  let extraCount = 0;

  if (input.category === 'aluminio' || input.category === 'todo') {
    for (const finishId of SPECIFIC_ACABADO_IDS) {
      if (typeof nextPreciosAcabado[finishId] === 'number' && nextPreciosAcabado[finishId] > 0) {
        nextPreciosAcabado[finishId] = Math.max(
          10,
          Math.round(nextPreciosAcabado[finishId] * factor)
        );
        extraCount += 1;
      }
    }
  }

  return {
    nextPatch: {
      precioListaTramo: baseRes.precioListaTramo,
      tarifasBase: baseRes.tarifasBase,
      rellenoPreciosM2: baseRes.rellenoPreciosM2,
      herrajesPrecios: baseRes.herrajesPrecios,
      preciosPorAcabado: nextPreciosAcabado,
    },
    undoSnapshot,
    updatedCount: baseRes.updatedCount + extraCount,
    scopeLabel,
    formattedPct: formatSignedPct(safePct),
  };
}

export function restoreUndoSnapshot(
  snapshot: BulkAdjustmentUndoSnapshot
): Partial<TallerConfig> {
  return {
    precioListaTramo: snapshot.precioListaTramo,
    tarifasBase: { ...snapshot.tarifasBase },
    rellenoPreciosM2: { ...snapshot.rellenoPreciosM2 },
    herrajesPrecios: { ...snapshot.herrajesPrecios },
    preciosPorAcabado: { ...snapshot.preciosPorAcabado },
  };
}

// ==================== 2. GENERADOR DE PUBLICIDAD PARA TU TALLER ====================

export type PublicidadServicioId =
  | 'ventanas'
  | 'puertas'
  | 'canceles'
  | 'domos'
  | 'mosquiteros';

export interface PublicidadServicioOption {
  id: PublicidadServicioId;
  label: string;
  emoji: string;
  headlineFb: string;
  highlightsFb: string[];
  hookStatus: string;
}

export const PUBLICIDAD_SERVICIOS: PublicidadServicioOption[] = [
  {
    id: 'ventanas',
    label: 'Ventanas de aluminio',
    emoji: '🪟',
    headlineFb: 'VENTANAS DE ALUMINIO A LA MEDIDA',
    highlightsFb: [
      'Perfiles de aluminio de primera calidad (Natural, Blanco, Negro, Champagne y Madera)',
      'Vidrio claro, tintex, filtrasol o reflecta con sellado hermético',
      'Fabricación a medidas a la orden e instalación profesional y limpia',
    ],
    hookStatus: '🪟 ¿Renovando casa u obra? Fabricamos ventanas de aluminio a tu medida con acabado impecable.',
  },
  {
    id: 'puertas',
    label: 'Puertas y zaguanes',
    emoji: '🚪',
    headlineFb: 'PUERTAS Y ZAGUANES DE ALUMINIO REFORZADO',
    highlightsFb: [
      'Diseños modernos, resistentes y libres de óxido para exterior o interior',
      'Duela lisa, acanalada o combinada con vidrio templado/esmerilado',
      'Fabricados con medidas a la orden, chapas de seguridad e instalación garantizada',
    ],
    hookStatus: '🚪 Dale seguridad y vista moderna a tu hogar con puertas y zaguanes de aluminio a la medida.',
  },
  {
    id: 'canceles',
    label: 'Canceles de baño (templado/acrílico)',
    emoji: '🚿',
    headlineFb: 'CANCELES DE BAÑO EN VIDRIO TEMPLADO Y ACRÍLICO',
    highlightsFb: [
      'Vidrio templado de seguridad (6 mm / 9.5 mm) o acrílico decorativo',
      'Herrajes inoxidables, corredizos o abatibles que no se oxidan ni se traban',
      'Hechos con medidas a la orden para que tu baño luzca elegante y sin filtraciones',
    ],
    hookStatus: '🚿 ¡Renueva tu baño hoy! Canceles en vidrio templado y acrílico hechos a tu medida.',
  },
  {
    id: 'domos',
    label: 'Domos y techumbres',
    emoji: '☀️',
    headlineFb: 'DOMOS Y TECHUMBRES DE ALUMINIO Y POLICARBONATO',
    highlightsFb: [
      'Estructura ligera y resistente de aluminio o cristal templado laminado',
      'Policarbonato con protección UV: más luz natural y menos calor en patios o cocheras',
      'Diseño con medidas a la orden y sellado profesional contra goteras',
    ],
    hookStatus: '☀️ Protege tu patio, cochera o terraza con domos y techumbres hechos a la medida.',
  },
  {
    id: 'mosquiteros',
    label: 'Mosquiteros / Reparaciones',
    emoji: '🦟',
    headlineFb: 'MOSQUITEROS A LA MEDIDA Y REPARACIÓN DE ALUMINIO',
    highlightsFb: [
      'Mosquiteros fijos, corredizos o abatibles con tela de fibra de vidrio o aluminio',
      'Cambio de carretillas, jaladeras, chapas, empaques, viniles y vidrios rotos',
      'Servicio rápido, medidas a la orden y mantenimiento directo en tu domicilio',
    ],
    hookStatus: '🦟 ¡Adiós zancudos y ventanas atoradas! Mosquiteros a la medida y reparaciones rápidas.',
  },
];

export interface GenerateWorkshopAdsInput {
  servicio: PublicidadServicioId;
  ciudadZona: string;
  telefono: string;
  tallerNombre?: string;
}

export interface GeneratedWorkshopAds {
  servicioLabel: string;
  facebookMarketplaceText: string;
  whatsappStatusText: string;
  whatsappShareUrlFb: string;
  whatsappShareUrlStatus: string;
}

export function generateWorkshopAds(
  input: GenerateWorkshopAdsInput
): GeneratedWorkshopAds {
  const srv =
    PUBLICIDAD_SERVICIOS.find((s) => s.id === input.servicio) ||
    PUBLICIDAD_SERVICIOS[0];

  const zonaClean = input.ciudadZona.trim() || 'tu ciudad y alrededores';
  const telClean = input.telefono.trim() || '(escribe tu número de WhatsApp)';
  const tallerClean = input.tallerNombre?.trim();

  const firma = tallerClean ? `🏭 ${tallerClean}\n` : '';

  const facebookMarketplaceText = [
    `${srv.emoji} ¡${srv.headlineFb}! ${srv.emoji}`,
    '',
    `¿Buscas trabajo bien hecho y duradero en ${zonaClean}? Somos especialistas en cancelería de aluminio y vidrio:`,
    ...srv.highlightsFb.map((h) => `✅ ${h}`),
    '📐 Trabajos 100% con medidas a la orden y acabados de taller profesional.',
    '💬 ¡Cotización sin compromiso! Mándanos tus medidas aproximadas y te damos precio rápido.',
    '',
    `${firma}📍 Zona de servicio: ${zonaClean}`,
    `📲 WhatsApp / Teléfono: ${telClean}`,
    '',
    '🔥 ¡Pregunta hoy mismo y aparta tu fecha de instalación!',
  ].join('\n');

  const tallerTag = tallerClean ? ` — ${tallerClean}` : '';
  const whatsappStatusText = [
    srv.hookStatus,
    `📐 Medidas a la orden • 💬 Cotización sin compromiso`,
    `📍 ${zonaClean}`,
    `📲 WhatsApp: ${telClean}${tallerTag}`,
  ].join('\n');

  return {
    servicioLabel: srv.label,
    facebookMarketplaceText,
    whatsappStatusText,
    whatsappShareUrlFb: `https://wa.me/?text=${encodeURIComponent(facebookMarketplaceText)}`,
    whatsappShareUrlStatus: `https://wa.me/?text=${encodeURIComponent(whatsappStatusText)}`,
  };
}
