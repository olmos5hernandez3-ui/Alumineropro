export const ONBOARDING_TOUR_KEY = 'aluminero_onboarding_tour_done_v1';

export interface OnboardingTourStep {
  id: 'levantamiento' | 'hoja-cotizacion';
  targetSelector: string;
  badge: string;
  title: string;
  description: string;
  tip: string;
}

export const ONBOARDING_TOUR_STEPS: OnboardingTourStep[] = [
  {
    id: 'levantamiento',
    targetSelector: '#lev-entry',
    badge: 'Paso 1 de 2',
    title: 'Levantamiento Rápido en Obra',
    description:
      'Captura medidas de ventanas y puertas directo en obra, escanea croquis con IA o usa el dibujo digitalizado y envía todo con un toque a cotizar o modular.',
    tip: 'Ideal cuando estás tomando medidas frente al cliente.',
  },
  {
    id: 'hoja-cotizacion',
    targetSelector: '#btn-menu-hoja',
    badge: 'Paso 2 de 2',
    title: 'Hoja de Cotización y Cortes 6.10 m',
    description:
      'Reúne todas tus partidas de la obra, calcula precios al instante, optimiza tramos de 6.10 m con mínimo desperdicio y genera tu cotización en PDF lista para compartir.',
    tip: 'Aquí concentras presupuesto, despiece y envío por WhatsApp.',
  },
];

export interface TourAutoStartCheck {
  completed: boolean;
  currentView: string;
  splashVisible: boolean;
  hasBlockingModal: boolean;
  reorderMode: boolean;
}

export function shouldAutoStartOnboardingTour(check: TourAutoStartCheck): boolean {
  if (check.completed) return false;
  if (check.currentView !== 'menu') return false;
  if (check.splashVisible) return false;
  if (check.hasBlockingModal) return false;
  if (check.reorderMode) return false;
  return true;
}

export function loadOnboardingTourCompleted(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem(ONBOARDING_TOUR_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveOnboardingTourCompleted(completed: boolean): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (completed) {
      window.localStorage.setItem(ONBOARDING_TOUR_KEY, '1');
    } else {
      window.localStorage.removeItem(ONBOARDING_TOUR_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

export interface TourTargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TourPopoverLayout {
  placement: 'below' | 'above';
  top: number;
  left: number;
  width: number;
  arrowLeft: number;
}

/**
 * Calcula una posición segura y visible para la tarjeta del tour guiado
 * junto al elemento resaltado sin salirse de los bordes de la pantalla.
 */
export function computeTourPopoverLayout(
  targetRect: TourTargetRect,
  viewport: { width: number; height: number },
  popoverSize?: { width?: number; height?: number }
): TourPopoverLayout {
  const safeVpW = Math.max(280, Number.isFinite(viewport.width) ? viewport.width : 390);
  const safeVpH = Math.max(420, Number.isFinite(viewport.height) ? viewport.height : 844);
  const margin = 14;
  const gap = 14;

  const desiredW = popoverSize?.width ?? 348;
  const estimatedH = popoverSize?.height ?? 210;
  const width = Math.min(desiredW, Math.max(240, safeVpW - margin * 2));

  const targetCenterX = targetRect.left + targetRect.width / 2;
  const rawLeft = targetCenterX - width / 2;
  const maxLeft = Math.max(margin, safeVpW - margin - width);
  const left = Math.round(Math.min(Math.max(margin, rawLeft), maxLeft));

  const spaceBelow = safeVpH - (targetRect.top + targetRect.height + gap);
  const spaceAbove = targetRect.top - gap;
  const placement: 'below' | 'above' =
    spaceBelow >= estimatedH || spaceBelow >= spaceAbove ? 'below' : 'above';

  const rawTop =
    placement === 'below'
      ? targetRect.top + targetRect.height + gap
      : targetRect.top - gap - estimatedH;
  const maxTop = Math.max(margin, safeVpH - margin - estimatedH);
  const top = Math.round(Math.min(Math.max(margin, rawTop), maxTop));

  const arrowLeft = Math.round(
    Math.min(Math.max(22, targetCenterX - left), width - 22)
  );

  return {
    placement,
    top,
    left,
    width,
    arrowLeft,
  };
}
