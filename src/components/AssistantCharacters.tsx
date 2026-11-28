import React from 'react';
import { AppSkin, AppSkinVariant } from '../utils/storageHelpers';
import type { RobotPoseMode } from '../utils/assistantGuideLogic';

export type AssistantAvatarId =
  | 'robot'
  | 'gatito'
  | 'perrito'
  | 'puerquito'
  | 'gallito'
  | 'castor'
  | 'buho'
  | 'oso'
  | 'perezoso'
  | 'conejita'
  | 'zorro'
  | 'lobo'
  | 'changuito';

export type AssistantAvatarMood =
  | 'idle'
  | 'dragging'
  | 'bouncing'
  | 'happy'
  | 'celebrating';

export const AVATAR_STORAGE_KEY = 'aluminero-avatar';
export const AVATAR_VISIBLE_KEY = 'aluminero-avatar-visible';
export const AVATAR_POS_KEY = 'aluminero-avatar-pos';
export const AVATAR_EVENT_NAME = 'aluminero-avatar';
export const AVATAR_VISIBLE_EVENT_NAME = 'aluminero-avatar-visible';

export const AVATAR_IMAGE_PATHS: Record<AssistantAvatarId, string> = {
  robot: '/avatars/robot.png',
  castor: '/avatars/castor.png',
  buho: '/avatars/buho.png',
  gatito: '/avatars/gatito.png',
  perrito: '/avatars/perrito.png',
  puerquito: '/avatars/puerquito.png',
  gallito: '/avatars/gallito.png',
  oso: '/avatars/oso.png',
  perezoso: '/avatars/perezoso.png',
  conejita: '/avatars/conejita.png',
  zorro: '/avatars/zorro.png',
  lobo: '/avatars/lobo.png',
  changuito: '/avatars/changuito.png',
};

export interface AssistantCharacterMeta {
  id: AssistantAvatarId;
  label: string;
  tagline: string;
  gestureText: string;
  imageSrc: string;
}

export const ASSISTANT_CHARACTERS: AssistantCharacterMeta[] = [
  {
    id: 'robot',
    label: 'Alumi-Bot 3D',
    tagline: 'Casco LED y medidor láser',
    gestureText: '¡Bip-bop! Láser calibrado al milímetro.',
    imageSrc: AVATAR_IMAGE_PATHS.robot,
  },
  {
    id: 'castor',
    label: 'Castor Maestro',
    tagline: 'Casco y flexómetro',
    gestureText: '¡Casco puesto y flexómetro listo!',
    imageSrc: AVATAR_IMAGE_PATHS.castor,
  },
  {
    id: 'buho',
    label: 'Búho Ingeniero',
    tagline: 'Lentes y escuadra',
    gestureText: 'Escuadra exacta a 90° verificada.',
    imageSrc: AVATAR_IMAGE_PATHS.buho,
  },
  {
    id: 'gatito',
    label: 'Gatito',
    tagline: 'Ágil y curioso',
    gestureText: '¡Miau! Ojo fino para cada medida.',
    imageSrc: AVATAR_IMAGE_PATHS.gatito,
  },
  {
    id: 'perrito',
    label: 'Perrito',
    tagline: 'Compañero fiel',
    gestureText: '¡Guau! Listo para ayudarte en taller.',
    imageSrc: AVATAR_IMAGE_PATHS.perrito,
  },
  {
    id: 'puerquito',
    label: 'Puerquito',
    tagline: 'Ahorrador PRO',
    gestureText: '¡Oink! Cuidando tu margen y sobrantes.',
    imageSrc: AVATAR_IMAGE_PATHS.puerquito,
  },
  {
    id: 'gallito',
    label: 'Gallito',
    tagline: 'Madrugador de obra',
    gestureText: '¡Quiquiriquí! A cotizar temprano.',
    imageSrc: AVATAR_IMAGE_PATHS.gallito,
  },
  {
    id: 'oso',
    label: 'Oso Constructor',
    tagline: 'Fuerza en estructura',
    gestureText: '¡Grrr! Perfil pesado bien nivelado.',
    imageSrc: AVATAR_IMAGE_PATHS.oso,
  },
  {
    id: 'perezoso',
    label: 'Perezoso Lentes',
    tagline: 'Cero errores de medida',
    gestureText: 'Despacito pero exacto al milímetro.',
    imageSrc: AVATAR_IMAGE_PATHS.perezoso,
  },
  {
    id: 'conejita',
    label: 'Conejita Ágil',
    tagline: 'Cotizaciones al instante',
    gestureText: '¡Listo en un salto! Medidas verificadas.',
    imageSrc: AVATAR_IMAGE_PATHS.conejita,
  },
  {
    id: 'zorro',
    label: 'Zorro Astuto',
    tagline: 'Optimizador 6.10 m',
    gestureText: '¡Cero desperdicio en tus tramos!',
    imageSrc: AVATAR_IMAGE_PATHS.zorro,
  },
  {
    id: 'lobo',
    label: 'Lobo Instalador',
    tagline: 'Maestro de montaje',
    gestureText: '¡Auuu! Taladro y escuadra listos.',
    imageSrc: AVATAR_IMAGE_PATHS.lobo,
  },
  {
    id: 'changuito',
    label: 'Changuito Chalán',
    tagline: 'Ayudante estrella',
    gestureText: '¡Uh-ah! Tornillos y mazo listos, patrón.',
    imageSrc: AVATAR_IMAGE_PATHS.changuito,
  },
];

export function loadSelectedAvatar(): AssistantAvatarId {
  try {
    const raw = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    if (raw && ASSISTANT_CHARACTERS.some((c) => c.id === raw)) {
      return raw as AssistantAvatarId;
    }
  } catch {
    // ignore
  }
  return 'robot';
}

export function saveSelectedAvatar(id: AssistantAvatarId): void {
  try {
    window.localStorage.setItem(AVATAR_STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent(AVATAR_EVENT_NAME, { detail: id }));
  } catch {
    // ignore
  }
}

export function loadAvatarVisible(): boolean {
  try {
    const raw = window.localStorage.getItem(AVATAR_VISIBLE_KEY);
    if (raw === '0' || raw === 'false') return false;
  } catch {
    // ignore
  }
  return true;
}

export function saveAvatarVisible(visible: boolean): void {
  try {
    window.localStorage.setItem(AVATAR_VISIBLE_KEY, visible ? '1' : '0');
    window.dispatchEvent(
      new CustomEvent(AVATAR_VISIBLE_EVENT_NAME, { detail: visible })
    );
  } catch {
    // ignore
  }
}

export function getSkinAccentHex(
  skin: AppSkin,
  skinVariant: AppSkinVariant
): string {
  if (skin === 'navidena') return '#eab354';
  if (skin === 'ejecutiva') {
    if (skinVariant === 'naranja') return '#d96b27';
    if (skinVariant === 'verde') return '#2e8b57';
    if (skinVariant === 'negro_anodizado') return '#cbd5e1';
    return '#38bdf8';
  }
  if (skin === 'industrial') {
    if (skinVariant === 'dorada') return '#c59638';
    if (skinVariant === 'plateada') return '#94a3b8';
    if (skinVariant === 'bronce') return '#a46b3e';
    if (skinVariant === 'champagne') return '#cbb692';
    if (skinVariant === 'cristal_tintex') return '#14967f';
    return '#3d8b5e';
  }
  return '#38bdf8';
}

interface CharacterSvgProps {
  avatarId: AssistantAvatarId;
  size?: number;
  skin?: AppSkin;
  skinVariant?: AppSkinVariant;
  santaHat?: boolean;
  gestureActive?: boolean;
  laserFlash?: boolean;
  robotPose?: RobotPoseMode;
  mood?: AssistantAvatarMood;
  withHalo?: boolean;
  animated?: boolean;
}

const AlumiBot3DSvg: React.FC<{
  size: number;
  accent: string;
  mood: AssistantAvatarMood;
  pose: RobotPoseMode;
  animated: boolean;
  laserFlash: boolean;
}> = ({ size, accent, mood, pose, animated, laserFlash }) => {
  const uid = React.useId().replace(/:/g, '');
  const isWavingPose = pose === 'waving';
  const isTechnicalPose = pose === 'technical';
  const isHappy = isWavingPose || mood === 'happy' || mood === 'celebrating';
  const isSurprised = mood === 'dragging';
  const blinkClass = animated && !isHappy && !isSurprised ? 'alumibot-eye-blink' : '';
  const antennaClass = animated ? 'assistant-part-wiggle' : '';
  const waveClass = animated ? 'alumibot-wave-hand' : '';
  const thrusterClass = animated ? 'alumibot-thruster' : '';
  const laserActive = isTechnicalPose && (laserFlash || isHappy);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://w3.org"
      className="w-full h-full bg-transparent select-none pointer-events-none"
      style={{
        background: 'transparent',
        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.45))',
      }}
      data-robot-svg="alumi-bot-3d"
      data-robot-pose={pose}
      data-laser-flash={laserActive ? 'true' : 'false'}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`ab-steel-${uid}`} x1="20" y1="14" x2="76" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="28%" stopColor="#e2e8f0" />
          <stop offset="68%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id={`ab-helmet-${uid}`} x1="24" y1="8" x2="72" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="32%" stopColor="#e2e8f0" />
          <stop offset="72%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <radialGradient id={`ab-drone-${uid}`} cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="38%" stopColor="#cbd5e1" />
          <stop offset="76%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>

        <linearGradient id={`ab-visor-${uid}`} x1="24" y1="29" x2="72" y2="57" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#162033" />
          <stop offset="32%" stopColor="#090d16" />
          <stop offset="100%" stopColor="#04070d" />
        </linearGradient>

        <linearGradient id={`ab-glass-shine-${uid}`} x1="28" y1="30" x2="54" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={`ab-led-${uid}`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor={accent} />
          <stop offset="100%" stopColor={accent} stopOpacity="0.72" />
        </radialGradient>

        <linearGradient id={`ab-thrust-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor={accent} stopOpacity="0.88" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`ab-meter-yellow-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        <linearGradient id={`ab-laser-beam-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#ef4444" stopOpacity="0.75" />
