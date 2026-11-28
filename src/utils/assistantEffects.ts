import type { AssistantAvatarId } from '../components/AssistantCharacters';

export const AVATAR_SOUND_KEY = 'aluminero-avatar-sound';
export const AVATAR_SOUND_EVENT_NAME = 'aluminero-avatar-sound';
export const AVATAR_TIPS_KEY = 'aluminero-avatar-tips';
export const AVATAR_TIPS_EVENT_NAME = 'aluminero-avatar-tips';
export const ASSISTANT_CELEBRATE_EVENT_NAME = 'aluminero:assistant-celebrate';
export const GHOST_CLICK_SHIELD_MS = 300;

export function isGhostClickShieldActive(
  shieldUntilMs: number,
  nowMs: number = Date.now()
): boolean {
  if (!Number.isFinite(shieldUntilMs) || !Number.isFinite(nowMs)) return false;
  return nowMs < shieldUntilMs;
}

export function shouldBlockGhostClickTarget(
  target: EventTarget | null,
  assistantRootSelector: string = '#floating-assistant-root'
): boolean {
  if (!target || typeof target !== 'object') return true;
  const el = target as { closest?: (selector: string) => unknown };
  if (typeof el.closest === 'function') {
    return !el.closest(assistantRootSelector);
  }
  return true;
}

export type AssistantSoundKind = 'tap' | 'drop' | 'celebrate' | 'longpress';
export type AssistantCelebrateReason = 'piece' | 'quote';

export interface AssistantCelebrateDetail {
  reason: AssistantCelebrateReason;
  message?: string;
}

export const ASSISTANT_AUDIO_GAIN_TAP = 0.72;
export const ASSISTANT_AUDIO_GAIN_LONGPRESS = 0.68;
export const ASSISTANT_AUDIO_GAIN_DROP = 0.55;
export const ASSISTANT_AUDIO_GAIN_CELEBRATE = 0.68;

export interface SmartBubblePositionInput {
  avatarX: number;
  avatarY: number;
  avatarWidth?: number;
  avatarHeight?: number;
  viewportWidth: number;
  viewportHeight: number;
  bubbleMaxWidth?: number;
  margin?: number;
  gap?: number;
}

export interface SmartBubbleLayout {
  horizontalSide: 'left' | 'right';
  verticalSide: 'above' | 'below';
  left: number;
  top: number | null;
  bottom: number | null;
  width: number;
  tailLeftPx: number;
}

export function loadAvatarSoundEnabled(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    const raw = window.localStorage.getItem(AVATAR_SOUND_KEY);
    if (raw === '0' || raw === 'false') return false;
  } catch {
    // ignore
  }
  return true;
}

export function saveAvatarSoundEnabled(enabled: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(AVATAR_SOUND_KEY, enabled ? '1' : '0');
    window.dispatchEvent(
      new CustomEvent<boolean>(AVATAR_SOUND_EVENT_NAME, { detail: enabled })
    );
  } catch {
    // ignore
  }
}

export function loadAvatarTipsEnabled(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return true;
    const raw = window.localStorage.getItem(AVATAR_TIPS_KEY);
    if (raw === '0' || raw === 'false') return false;
  } catch {
    // ignore
  }
  return true;
}

export function saveAvatarTipsEnabled(enabled: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(AVATAR_TIPS_KEY, enabled ? '1' : '0');
    window.dispatchEvent(
      new CustomEvent<boolean>(AVATAR_TIPS_EVENT_NAME, { detail: enabled })
    );
  } catch {
    // ignore
  }
}

export function computeSmartBubblePosition(
  input: SmartBubblePositionInput
): SmartBubbleLayout {
  const safeViewportW = Math.max(200, Number.isFinite(input.viewportWidth) ? input.viewportWidth : 390);
  const safeViewportH = Math.max(300, Number.isFinite(input.viewportHeight) ? input.viewportHeight : 844);
  const avatarW = Math.max(32, input.avatarWidth ?? 92);
  const avatarH = Math.max(32, input.avatarHeight ?? 92);
  const margin = Math.max(12, input.margin ?? 12);
  const gap = Math.max(6, input.gap ?? 10);
  const maxW = Math.min(248, Math.max(160, input.bubbleMaxWidth ?? 248));
  const width = Math.min(maxW, Math.max(160, safeViewportW - margin * 2));

  const safeX = Number.isFinite(input.avatarX) ? input.avatarX : safeViewportW - margin - avatarW;
  const safeY = Number.isFinite(input.avatarY) ? input.avatarY : safeViewportH - margin - avatarH;

  const isLeftHalf = safeX < safeViewportW / 2;
  const horizontalSide: 'left' | 'right' = isLeftHalf ? 'right' : 'left';
  const rawLeft = isLeftHalf ? safeX : safeX + avatarW - width;
  const maxLeft = Math.max(margin, safeViewportW - margin - width);
  const left = Math.round(Math.min(Math.max(margin, rawLeft), maxLeft));

  const verticalSide: 'above' | 'below' = safeY < 180 ? 'below' : 'above';
  const top =
    verticalSide === 'below'
      ? Math.round(Math.min(safeViewportH - 120, Math.max(margin, safeY + avatarH + gap)))
      : null;
  const bottom =
    verticalSide === 'above'
      ? Math.round(Math.min(safeViewportH - 120, Math.max(margin, safeViewportH - safeY + gap)))
      : null;

  const avatarCenterX = safeX + avatarW / 2;
  const tailLeftPx = Math.round(Math.min(Math.max(18, avatarCenterX - left), width - 18));

  return {
    horizontalSide,
    verticalSide,
    left,
    top,
    bottom,
    width,
    tailLeftPx,
  };
}

export function dispatchAssistantCelebrate(
  reason: AssistantCelebrateReason,
  message?: string
): void {
  try {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent<AssistantCelebrateDetail>(ASSISTANT_CELEBRATE_EVENT_NAME, {
        detail: { reason, message },
      })
    );
  } catch {
    // ignore
  }
}

export function computeDragTiltDegrees(dx: number, dy: number = 0): number {
  if (!Number.isFinite(dx)) return 0;
  const safeDy = Number.isFinite(dy) ? dy : 0;
  const horizontalTilt = dx * 1.45;
  const verticalInfluence = Math.max(-4, Math.min(4, safeDy * 0.15));
  const raw = horizontalTilt + (dx >= 0 ? verticalInfluence : -verticalInfluence);
  return Math.max(-22, Math.min(22, Math.round(raw * 10) / 10));
}

export function getCharacterQuickGreeting(avatarId: AssistantAvatarId): string {
  switch (avatarId) {
    case 'gatito':
      return '¡Miau! ¿En qué perfil o medida te ayudo hoy?';
    case 'perrito':
      return '¡Guau! ¡Aquí estoy listo para tu siguiente obra!';
    case 'gallito':
      return '¡Quiquiriquí! ¡Vamos con toda la actitud a cotizar!';
    case 'puerquito':
      return '¡Oink! Cuidando tus tramos y tu margen de ganancia.';
    case 'castor':
      return '¡Flexómetro listo! ¿Qué ventana armamos hoy?';
    case 'buho':
      return 'Escuadra exacta a 90°. ¿Revisamos un corte o perfil?';
    case 'oso':
      return '¡Grrr-buen día! Listo para levantar obra pesada.';
    case 'perezoso':
      return 'Con calma pero sin fallar ni un milímetro... ¿qué medimos?';
    case 'conejita':
      return '¡A toda velocidad! Cotizamos y optimizamos en segundos.';
    case 'zorro':
      return '¡Cero desperdicio! Aprovechemos cada tramo de 6.10 m.';
    case 'lobo':
      return '¡Auuu! Listo para instalar con precisión maestra.';
    case 'changuito':
      return '¡Uh-uh-ah-ah! Ya traje los tornillos y el mazo, patrón.';
    case 'robot':
    default:
      return '¡Bip-bop! Asistente Aluminero calibrado y listo.';
  }
}

export function getCharacterCelebrationText(
  avatarId: AssistantAvatarId,
  reason: AssistantCelebrateReason
): string {
  if (reason === 'quote') {
    switch (avatarId) {
      case 'gatito':
        return '¡Miau genial! Cotización guardada con éxito ✨';
      case 'perrito':
        return '¡Guau bravo! Cotización guardada en tu historial 🎉';
      case 'gallito':
        return '¡Quiquiriquí! ¡Otra gran cotización lista! ⭐';
      case 'puerquito':
        return '¡Oink! ¡Cotización guardada y buen margen asegurado! ✨';
      case 'oso':
        return '¡Fuerza de taller! Cotización guardada con éxito 🎉';
      case 'perezoso':
        return '¡Sin prisas pero seguro! Cotización guardada ✨';
      case 'conejita':
        return '¡Rapidísimo! Cotización lista y guardada 🎉';
      case 'zorro':
        return '¡Jugada maestra! Cotización guardada con excelente margen ⭐';
      case 'lobo':
        return '¡Auuu! Gran cierre de presupuesto guardado 🎉';
      case 'changuito':
        return '¡Uh-ah! ¡Ya quedó guardada la chamba, jefe! ✨';
      case 'robot':
        return '¡Bip-bop! Cotización registrada al 100% 🎉';
      default:
        return '¡Excelente! Cotización guardada con éxito 🎉';
    }
  }
  switch (avatarId) {
    case 'gatito':
      return '¡Miau! Nueva pieza agregada con precisión ✨';
    case 'perrito':
      return '¡Guau! ¡Excelente medida agregada! ⭐';
    case 'gallito':
      return '¡Quiquiriquí! ¡Pieza lista para corte y cotización! ✨';
    case 'puerquito':
      return '¡Oink! Pieza sumada, optimizando tramos 6.10 m ⭐';
    case 'oso':
      return '¡Pieza firme agregada al proyecto! ✨';
    case 'perezoso':
      return '¡Medida verificada y agregada sin errores! ⭐';
    case 'conejita':
      return '¡Listo al instante! Pieza agregada ✨';
    case 'zorro':
      return '¡Corte inteligente sumado al optimizador! ⭐';
    case 'lobo':
      return '¡Auuu! Nueva pieza lista para armar ✨';
    case 'changuito':
      return '¡Uh-ah! Ya apunté esa medida en la lista ⭐';
    case 'robot':
      return '¡Bip-bop! Pieza calculada y agregada ✨';
    default:
      return '¡Genial! Nueva pieza agregada ✨';
  }
}

let sharedAudioCtx: AudioContext | null = null;

function ensureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Desbloquea de forma síncrona el AudioContext global en el gesto táctil/clic del usuario.
 */
