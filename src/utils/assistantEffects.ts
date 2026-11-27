import type { AssistantAvatarId } from '../components/AssistantCharacters';

export const AVATAR_SOUND_KEY = 'aluminero-avatar-sound';
export const AVATAR_SOUND_EVENT_NAME = 'aluminero-avatar-sound';
export const AVATAR_TIPS_KEY = 'aluminero-avatar-tips';
export const AVATAR_TIPS_EVENT_NAME = 'aluminero-avatar-tips';
export const ASSISTANT_CELEBRATE_EVENT_NAME = 'aluminero:assistant-celebrate';

export type AssistantSoundKind = 'tap' | 'drop' | 'celebrate';
export type AssistantCelebrateReason = 'piece' | 'quote';

export interface AssistantCelebrateDetail {
  reason: AssistantCelebrateReason;
  message?: string;
}

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
    // ignore storage failures
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
    // ignore storage failures
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

/**
 * Calcula la posición inteligente del globo emergente del personaje asistente
 * para que nunca se corte fuera de la pantalla en ninguna esquina:
 * - Mitad izquierda (avatarX < viewportWidth / 2): abre hacia la derecha.
 * - Mitad derecha (avatarX >= viewportWidth / 2): abre hacia la izquierda.
 * - Tercio superior (avatarY < 180): abre debajo del personaje; de lo contrario, arriba.
 * - Ancho máximo 240px con margen mínimo de 12px respecto a bordes izquierdo y derecho.
 */
export function computeSmartBubblePosition(
  input: SmartBubblePositionInput
): SmartBubbleLayout {
  const safeViewportW = Math.max(200, Number.isFinite(input.viewportWidth) ? input.viewportWidth : 390);
  const safeViewportH = Math.max(300, Number.isFinite(input.viewportHeight) ? input.viewportHeight : 844);
  const avatarW = Math.max(32, input.avatarWidth ?? 72);
  const avatarH = Math.max(32, input.avatarHeight ?? 74);
  const margin = Math.max(12, input.margin ?? 12);
  const gap = Math.max(6, input.gap ?? 10);
  const maxW = Math.min(240, Math.max(160, input.bubbleMaxWidth ?? 240));
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

/**
 * Calcula el ángulo de inclinación del cuerpo al arrastrar el avatar,
 * limitado a [-22°, +22°] hacia la dirección del desplazamiento.
 */
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
    case 'robot':
      return '¡Bip-bop! Pieza calculada y agregada ✨';
    default:
      return '¡Genial! Nueva pieza agregada ✨';
  }
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function scheduleCatMeow(ctx: AudioContext, now: number, master: GainNode): void {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc2.type = 'sine';
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1150, now);
  filter.Q.setValueAtTime(1.8, now);

  // Curva dulce de maullido: sube y desciende suave
  osc.frequency.setValueAtTime(540, now);
  osc.frequency.exponentialRampToValueAtTime(920, now + 0.09);
  osc.frequency.exponentialRampToValueAtTime(610, now + 0.27);

  osc2.frequency.setValueAtTime(1080, now);
  osc2.frequency.exponentialRampToValueAtTime(1840, now + 0.09);
  osc2.frequency.exponentialRampToValueAtTime(1220, now + 0.27);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.28, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.95, now + 0.045);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  osc.connect(filter);
  osc2.connect(subGain);
  subGain.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.3);
  osc2.stop(now + 0.3);
}

function scheduleDogBark(ctx: AudioContext, now: number, master: GainNode): void {
  const playYip = (start: number, peakHz: number, endHz: number) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1250, start);
    filter.Q.setValueAtTime(2.2, start);

    osc.frequency.setValueAtTime(peakHz * 0.72, start);
    osc.frequency.exponentialRampToValueAtTime(peakHz, start + 0.025);
    osc.frequency.exponentialRampToValueAtTime(endHz, start + 0.11);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.9, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(start);
    osc.stop(start + 0.13);
  };

  playYip(now, 370, 175);
  playYip(now + 0.135, 420, 195);
}

function scheduleRoosterCrow(ctx: AudioContext, now: number, master: GainNode): void {
  const notes: Array<{ t: number; d: number; f0: number; f1: number }> = [
    { t: 0.0, d: 0.07, f0: 560, f1: 720 },
    { t: 0.08, d: 0.08, f0: 820, f1: 960 },
    { t: 0.17, d: 0.07, f0: 700, f1: 820 },
    { t: 0.25, d: 0.18, f0: 980, f1: 1180 },
  ];

  for (const n of notes) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now + n.t);
    filter.Q.setValueAtTime(1.4, now + n.t);

    osc.frequency.setValueAtTime(n.f0, now + n.t);
    osc.frequency.exponentialRampToValueAtTime(n.f1, now + n.t + n.d * 0.7);
    if (n.d > 0.12) {
      osc.frequency.exponentialRampToValueAtTime(920, now + n.t + n.d);
    }

    gain.gain.setValueAtTime(0.0001, now + n.t);
    gain.gain.linearRampToValueAtTime(0.9, now + n.t + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.02);
  }
}

function schedulePigOink(ctx: AudioContext, now: number, master: GainNode): void {
  const playSnort = (start: number, baseHz: number) => {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseHz, start);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 1.55, start + 0.055);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 0.85, start + 0.12);

    // Modulación rápida nasal divertida
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(42, start);
    lfoGain.gain.setValueAtTime(28, start);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(640, start);
    filter.Q.setValueAtTime(4.2, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(1.0, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.125);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(start);
    lfo.start(start);
    osc.stop(start + 0.135);
    lfo.stop(start + 0.135);
  };

  playSnort(now, 180);
  playSnort(now + 0.145, 205);
}

function scheduleRobotBipBop(ctx: AudioContext, now: number, master: GainNode): void {
  const tones = [
    { t: 0.0, d: 0.085, f: 920, type: 'sine' as OscillatorType },
    { t: 0.095, d: 0.09, f: 620, type: 'triangle' as OscillatorType },
    { t: 0.19, d: 0.075, f: 1280, type: 'sine' as OscillatorType },
  ];

  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.f, now + tone.t);

    gain.gain.setValueAtTime(0.0001, now + tone.t);
    gain.gain.linearRampToValueAtTime(0.72, now + tone.t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.t + tone.d);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now + tone.t);
    osc.stop(now + tone.t + tone.d + 0.015);
  }
}

function scheduleOwlOrBeaverTone(
  ctx: AudioContext,
  now: number,
  master: GainNode,
  avatarId: 'castor' | 'buho'
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  if (avatarId === 'buho') {
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.18);
  } else {
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
  }
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.65, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.22);
}

function scheduleCelebrationChime(ctx: AudioContext, now: number, master: GainNode): void {
  const chord = [784, 987.77, 1174.66, 1567.98]; // G5 - B5 - D6 - G6
  chord.forEach((freq, i) => {
    const start = now + i * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.5, start + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 0.18);
  });
}

/**
 * Reproduce un efecto de sonido corto y limpio mediante Web Audio API
 * (sin archivos externos) respetando el interruptor de silencio del usuario.
 */
export function playAssistantSound(
  avatarId: AssistantAvatarId,
  kind: AssistantSoundKind = 'tap',
  soundEnabledOverride?: boolean
): boolean {
  const enabled =
    typeof soundEnabledOverride === 'boolean'
      ? soundEnabledOverride
      : loadAvatarSoundEnabled();
  if (!enabled) return false;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime + 0.005;
    const master = ctx.createGain();
    const vol = kind === 'drop' ? 0.13 : kind === 'celebrate' ? 0.14 : 0.17;
    master.gain.setValueAtTime(vol, now);
    master.connect(ctx.destination);

    if (kind === 'celebrate') {
      scheduleCelebrationChime(ctx, now, master);
      return true;
    }

    switch (avatarId) {
      case 'gatito':
        scheduleCatMeow(ctx, now, master);
        break;
      case 'perrito':
        scheduleDogBark(ctx, now, master);
        break;
      case 'gallito':
        scheduleRoosterCrow(ctx, now, master);
        break;
      case 'puerquito':
        schedulePigOink(ctx, now, master);
        break;
      case 'robot':
        scheduleRobotBipBop(ctx, now, master);
        break;
      case 'castor':
      case 'buho':
        scheduleOwlOrBeaverTone(ctx, now, master, avatarId);
        break;
      default:
        scheduleRobotBipBop(ctx, now, master);
        break;
    }
    return true;
  } catch {
    return false;
  }
}
