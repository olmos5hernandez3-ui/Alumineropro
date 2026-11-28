import type { AssistantAvatarId } from '../components/AssistantCharacters';

export const AVATAR_SOUND_KEY = 'aluminero-avatar-sound';
export const AVATAR_SOUND_EVENT_NAME = 'aluminero-avatar-sound';
export const AVATAR_TIPS_KEY = 'aluminero-avatar-tips';
export const AVATAR_TIPS_EVENT_NAME = 'aluminero-avatar-tips';
export const ASSISTANT_CELEBRATE_EVENT_NAME = 'aluminero:assistant-celebrate';
export const GHOST_CLICK_SHIELD_MS = 300;
export const ASSISTANT_TAP_PARTICLES = ['🔩', '🔧', '📏', '⚙️', '✨'] as const;

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

export const ASSISTANT_AUDIO_GAIN_TAP = 0.48;
export const ASSISTANT_AUDIO_GAIN_LONGPRESS = 0.44;
export const ASSISTANT_AUDIO_GAIN_DROP = 0.38;
export const ASSISTANT_AUDIO_GAIN_CELEBRATE = 0.48;

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

let audioUnlockedOnce = false;

function primeSilentMobileAudio(ctx: AudioContext): void {
  if (audioUnlockedOnce) return;
  try {
    const silentBuffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = silentBuffer;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlockedOnce = true;
  } catch {
    // ignore on restricted environments
  }
}

/**
 * Desbloquea de forma síncrona el AudioContext global en el gesto táctil/clic del usuario
 * ejecutando resume() automático para celular (Android/iOS) y PC.
 */
export function unlockAssistantAudio(): Promise<AudioContext | null> {
  const ctx = ensureAudioContext();
  if (!ctx) return Promise.resolve(null);
  if (ctx.state === 'suspended') {
    try {
      return ctx
        .resume()
        .then(() => {
          primeSilentMobileAudio(ctx);
          return ctx;
        })
        .catch(() => ctx);
    } catch {
      return Promise.resolve(ctx);
    }
  }
  primeSilentMobileAudio(ctx);
  return Promise.resolve(ctx);
}

/**
 * Registra listeners globales en la primera interacción del usuario (pointerdown, touchstart,
 * click, keydown) para ejecutar AudioContext.resume() automáticamente en Android, iOS y PC.
 */
export function initAssistantAudioAutoUnlock(): () => void {
  if (typeof window === 'undefined') return () => {};
  const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'click', 'keydown'];
  let active = true;
  const detach = () => {
    if (!active) return;
    active = false;
    for (const ev of events) {
      window.removeEventListener(ev, onFirstGesture, true);
    }
  };
  const onFirstGesture = () => {
    void unlockAssistantAudio().then((ctx) => {
      if (ctx && ctx.state === 'running') {
        detach();
      }
    });
  };
  for (const ev of events) {
    window.addEventListener(ev, onFirstGesture, { capture: true, passive: true });
  }
  return detach;
}

function scheduleCatMeow(ctx: AudioContext, now: number, master: GainNode) {
  const osc = ctx.createOscillator();
  const harmonic = ctx.createOscillator();
  const harmonicGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  harmonic.type = 'triangle';
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(820, now + 0.11);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.34);

  harmonic.frequency.setValueAtTime(1000, now);
  harmonic.frequency.exponentialRampToValueAtTime(1640, now + 0.11);
  harmonic.frequency.exponentialRampToValueAtTime(840, now + 0.34);
  harmonicGain.gain.setValueAtTime(0.35, now);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(980, now);
  filter.frequency.exponentialRampToValueAtTime(1550, now + 0.11);
  filter.frequency.exponentialRampToValueAtTime(860, now + 0.34);
  filter.Q.setValueAtTime(2.6, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.95, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

  osc.connect(filter);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(now);
  harmonic.start(now);
  osc.stop(now + 0.38);
  harmonic.stop(now + 0.38);
}

function scheduleCatPurr(ctx: AudioContext, now: number, master: GainNode) {
  const playPurrWave = (start: number, duration: number) => {
    const carrier = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(95, start);
    carrier.frequency.linearRampToValueAtTime(102, start + duration * 0.5);
    carrier.frequency.linearRampToValueAtTime(92, start + duration);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(25, start);
    lfoDepth.gain.setValueAtTime(0.42, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, start);
    filter.Q.setValueAtTime(2.2, start);

    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(0.88, start + 0.06);
    env.gain.setValueAtTime(0.82, start + duration - 0.07);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(0.55, start);
    lfo.connect(lfoDepth);
    lfoDepth.connect(modGain.gain);

    carrier.connect(filter);
    filter.connect(modGain);
    modGain.connect(env);
    env.connect(master);

    carrier.start(start);
    lfo.start(start);
    carrier.stop(start + duration + 0.02);
    lfo.stop(start + duration + 0.02);
  };
  playPurrWave(now, 0.28);
  playPurrWave(now + 0.32, 0.3);
}

function scheduleDogBark(ctx: AudioContext, now: number, master: GainNode) {
  const playBark = (start: number, pitchScale: number) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260 * pitchScale, start);
    osc.frequency.exponentialRampToValueAtTime(410 * pitchScale, start + 0.025);
    osc.frequency.exponentialRampToValueAtTime(155 * pitchScale, start + 0.13);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, start);
    filter.frequency.exponentialRampToValueAtTime(300, start + 0.13);
    filter.Q.setValueAtTime(2.8, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(1, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.145);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(start);
    osc.stop(start + 0.16);
  };
  playBark(now, 1);
  playBark(now + 0.175, 1.12);
}

function scheduleRoosterCrow(ctx: AudioContext, now: number, master: GainNode) {
  const notes: Array<{ t: number; d: number; f0: number; f1: number; drop?: number }> = [
    { t: 0, d: 0.085, f0: 620, f1: 780 },
    { t: 0.095, d: 0.085, f0: 790, f1: 960 },
    { t: 0.19, d: 0.08, f0: 940, f1: 1140 },
    { t: 0.28, d: 0.24, f0: 1180, f1: 1480, drop: 1020 },
  ];
  for (const n of notes) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1550, now + n.t);
    filter.Q.setValueAtTime(1.9, now + n.t);

    osc.frequency.setValueAtTime(n.f0, now + n.t);
    osc.frequency.exponentialRampToValueAtTime(n.f1, now + n.t + n.d * 0.6);
    if (n.drop) {
      osc.frequency.exponentialRampToValueAtTime(n.drop, now + n.t + n.d);
    }

    gain.gain.setValueAtTime(0.0001, now + n.t);
    gain.gain.linearRampToValueAtTime(0.95, now + n.t + 0.016);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.02);
  }
}

function schedulePigOink(ctx: AudioContext, now: number, master: GainNode) {
  const playSnort = (start: number, baseHz: number) => {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseHz, start);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 1.6, start + 0.06);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 0.82, start + 0.14);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(38, start);
    lfoGain.gain.setValueAtTime(32, start);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(580, start);
    filter.Q.setValueAtTime(4, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(1, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(start);
    lfo.start(start);
    osc.stop(start + 0.165);
    lfo.stop(start + 0.165);
  };
  playSnort(now, 165);
  playSnort(now + 0.17, 190);
}

function scheduleRobotBipBop(ctx: AudioContext, now: number, master: GainNode) {
  const tones: Array<{ t: number; d: number; f0: number; f1: number; type: OscillatorType }> = [
    { t: 0, d: 0.085, f0: 840, f1: 1180, type: 'sine' },
    { t: 0.095, d: 0.095, f0: 660, f1: 520, type: 'triangle' },
    { t: 0.2, d: 0.14, f0: 980, f1: 1760, type: 'sine' },
  ];
  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.f0, now + tone.t);
    osc.frequency.exponentialRampToValueAtTime(tone.f1, now + tone.t + tone.d);
    gain.gain.setValueAtTime(0.0001, now + tone.t);
    gain.gain.linearRampToValueAtTime(0.92, now + tone.t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.t + tone.d);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + tone.t);
    osc.stop(now + tone.t + tone.d + 0.018);
  }
  const laser = ctx.createOscillator();
  const laserGain = ctx.createGain();
  laser.type = 'sawtooth';
  laser.frequency.setValueAtTime(2150, now + 0.24);
  laser.frequency.exponentialRampToValueAtTime(1420, now + 0.34);
  laserGain.gain.setValueAtTime(0.0001, now + 0.24);
  laserGain.gain.linearRampToValueAtTime(0.32, now + 0.255);
  laserGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.345);
  laser.connect(laserGain);
  laserGain.connect(master);
  laser.start(now + 0.24);
  laser.stop(now + 0.36);
}

function scheduleBeaverKnock(ctx: AudioContext, now: number, master: GainNode) {
  const playKnock = (start: number, freq: number) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.42, start + 0.055);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.4, start);
    filter.Q.setValueAtTime(3.2, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(1, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.068);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 0.08);
  };
  playKnock(now, 440);
  playKnock(now + 0.13, 520);
}

function scheduleOwlHoot(ctx: AudioContext, now: number, master: GainNode) {
  const playHoot = (start: number, startHz: number, endHz: number, dur: number) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startHz, start);
    osc.frequency.exponentialRampToValueAtTime(endHz, start + dur);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.95, start + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };
  playHoot(now, 460, 340, 0.17);
  playHoot(now + 0.2, 430, 310, 0.24);
}

function scheduleCelebrationChime(ctx: AudioContext, now: number, master: GainNode) {
  [784, 987.77, 1174.66, 1567.98].forEach((freq, i) => {
    const start = now + i * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.75, start + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + 0.2);
  });
}

function scheduleBearGrowl(ctx: AudioContext, now: number, master: GainNode) {
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(118, now);
  osc.frequency.exponentialRampToValueAtTime(84, now + 0.34);
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(22, now);
  lfoGain.gain.setValueAtTime(14, now);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(340, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.95, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  osc.start(now);
  lfo.start(now);
  osc.stop(now + 0.38);
  lfo.stop(now + 0.38);
}

function scheduleSlothChillHum(ctx: AudioContext, now: number, master: GainNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(235, now + 0.36);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.8, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.42);
}

function scheduleBunnyHop(ctx: AudioContext, now: number, master: GainNode) {
  for (const h of [
    { t: 0, f0: 680, f1: 1220, d: 0.085 },
    { t: 0.11, f0: 820, f1: 1460, d: 0.095 },
  ]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(h.f0, now + h.t);
    osc.frequency.exponentialRampToValueAtTime(h.f1, now + h.t + h.d);
    gain.gain.setValueAtTime(0.0001, now + h.t);
    gain.gain.linearRampToValueAtTime(0.85, now + h.t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + h.t + h.d);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + h.t);
    osc.stop(now + h.t + h.d + 0.02);
  }
}

function scheduleFoxYip(ctx: AudioContext, now: number, master: GainNode) {
  for (const y of [
    { t: 0, f0: 540, f1: 1120, f2: 720, d: 0.11 },
    { t: 0.13, f0: 620, f1: 1280, f2: 780, d: 0.12 },
  ]) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(y.f0, now + y.t);
    osc.frequency.exponentialRampToValueAtTime(y.f1, now + y.t + y.d * 0.45);
    osc.frequency.exponentialRampToValueAtTime(y.f2, now + y.t + y.d);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(980, now + y.t);
    filter.Q.setValueAtTime(2, now + y.t);
    gain.gain.setValueAtTime(0.0001, now + y.t);
    gain.gain.linearRampToValueAtTime(0.92, now + y.t + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + y.t + y.d);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(now + y.t);
    osc.stop(now + y.t + y.d + 0.02);
  }
}

function scheduleWolfHowl(ctx: AudioContext, now: number, master: GainNode) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(280, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
  osc.frequency.exponentialRampToValueAtTime(360, now + 0.44);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(860, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.9, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.48);
}

function scheduleMonkeyChatter(ctx: AudioContext, now: number, master: GainNode) {
  for (const n of [
    { t: 0, f0: 520, f1: 960, d: 0.08 },
    { t: 0.095, f0: 660, f1: 1180, d: 0.085 },
    { t: 0.195, f0: 780, f1: 1320, d: 0.09 },
  ]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(n.f0, now + n.t);
    osc.frequency.exponentialRampToValueAtTime(n.f1, now + n.t + n.d);
    gain.gain.setValueAtTime(0.0001, now + n.t);
    gain.gain.linearRampToValueAtTime(0.85, now + n.t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.015);
  }
}

function dispatchCharacterSound(
  ctx: AudioContext,
  avatarId: AssistantAvatarId,
  kind: AssistantSoundKind
) {
  const now = ctx.currentTime + 0.008;
  const master = ctx.createGain();
  const vol =
    kind === 'drop'
      ? ASSISTANT_AUDIO_GAIN_DROP
      : kind === 'celebrate'
        ? ASSISTANT_AUDIO_GAIN_CELEBRATE
        : kind === 'longpress'
          ? ASSISTANT_AUDIO_GAIN_LONGPRESS
          : ASSISTANT_AUDIO_GAIN_TAP;
  master.gain.setValueAtTime(vol, now);
  master.connect(ctx.destination);

  if (kind === 'celebrate') {
    scheduleCelebrationChime(ctx, now, master);
    return;
  }

  switch (avatarId) {
    case 'gatito':
      if (kind === 'longpress') scheduleCatPurr(ctx, now, master);
      else scheduleCatMeow(ctx, now, master);
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
      scheduleBeaverKnock(ctx, now, master);
      break;
    case 'buho':
      scheduleOwlHoot(ctx, now, master);
      break;
    case 'oso':
      scheduleBearGrowl(ctx, now, master);
      break;
    case 'perezoso':
      scheduleSlothChillHum(ctx, now, master);
      break;
    case 'conejita':
      scheduleBunnyHop(ctx, now, master);
      break;
    case 'zorro':
      scheduleFoxYip(ctx, now, master);
      break;
    case 'lobo':
      scheduleWolfHowl(ctx, now, master);
      break;
    case 'changuito':
      scheduleMonkeyChatter(ctx, now, master);
      break;
    default:
      scheduleRobotBipBop(ctx, now, master);
  }
}

/**
 * Reproduce un efecto de sonido claro y audible en celular y escritorio mediante
 * Web Audio API (sin archivos externos), desbloqueando el AudioContext en el gesto
 * del usuario y respetando el interruptor de silencio.
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
  const ctx = ensureAudioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          try {
            dispatchCharacterSound(ctx, avatarId, kind);
          } catch {
            // ignore
          }
        })
        .catch(() => {});
      return true;
    }
    dispatchCharacterSound(ctx, avatarId, kind);
    return true;
  } catch {
    return false;
  }
}
