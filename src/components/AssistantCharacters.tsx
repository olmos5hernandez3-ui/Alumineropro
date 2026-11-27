import React from 'react';
import { AppSkin, AppSkinVariant } from '../utils/storageHelpers';

export type AssistantAvatarId =
  | 'robot'
  | 'gatito'
  | 'perrito'
  | 'puerquito'
  | 'gallito'
  | 'castor'
  | 'buho';

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
    label: 'Robot',
    tagline: 'Asistente animado LED',
    gestureText: '¡Bip-bop! Sistemas calibrados al milímetro.',
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

/**
 * Devuelve el color de acento exacto (--sk-accent) para los detalles/LED del Robot
 * y los destellos de los personajes según la carátula y variante activas.
 */
export function getSkinAccentHex(
  skin: AppSkin,
  skinVariant: AppSkinVariant
): string {
  if (skin === 'navidena') return '#eab354';
  if (skin === 'ejecutiva') {
    if (skinVariant === 'naranja') return '#d96b27';
    if (skinVariant === 'verde') return '#2e8b57';
    if (skinVariant === 'negro_anodizado') return '#cbd5e1';
    return '#3b6ef5';
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
  mood?: AssistantAvatarMood;
  withHalo?: boolean;
  animated?: boolean;
}

const BlinkingRobotSvg: React.FC<{
  size: number;
  accent: string;
  mood: AssistantAvatarMood;
  animated: boolean;
}> = ({ size, accent, mood, animated }) => {
  const uid = React.useId().replace(/:/g, '');
  const isHappy = mood === 'happy' || mood === 'celebrating';
  const isSurprised = mood === 'dragging';
  const blinkClass = animated && !isHappy && !isSurprised ? 'assistant-eye-blink' : '';
  const antennaClass = animated ? 'assistant-part-wiggle' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 84 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full bg-transparent select-none pointer-events-none"
      style={{
        background: 'transparent',
        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.45))',
      }}
      data-robot-svg="animated-blinking"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`rb-head-${uid}`} x1="16" y1="16" x2="68" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="48%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={`rb-body-${uid}`} x1="22" y1="50" x2="62" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="55%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`rb-visor-${uid}`} x1="22" y1="24" x2="62" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#090e1a" />
        </linearGradient>
        <radialGradient id={`rb-led-${uid}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor={accent} />
          <stop offset="100%" stopColor={accent} stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id={`rb-arm-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>

      {/* Antena superior con LED adaptable a la carátula */}
      <g className={antennaClass} style={{ transformOrigin: '42px 20px' }}>
        <line x1="42" y1="20" x2="42" y2="10" stroke="#94a3b8" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="42" cy="8.5" r="5" fill={accent} opacity="0.28" />
        <circle cx="42" cy="8.5" r="3.4" fill={`url(#rb-led-${uid})`} stroke="#ffffff" strokeWidth="0.9" />
      </g>

      {/* Brazos laterales metálicos */}
      <rect x="11" y="54" width="9" height="17" rx="4.5" fill={`url(#rb-arm-${uid})`} stroke="#334155" strokeWidth="1.2" />
      <rect x="64" y="54" width="9" height="17" rx="4.5" fill={`url(#rb-arm-${uid})`} stroke="#334155" strokeWidth="1.2" />

      {/* Torso metálico redondeado con núcleo LED adaptable */}
      <rect x="23" y="51" width="38" height="24" rx="10" fill={`url(#rb-body-${uid})`} stroke="#334155" strokeWidth="1.4" />
      <rect x="29" y="56.5" width="26" height="12" rx="6" fill="#0f172a" stroke={accent} strokeWidth="1.2" strokeOpacity="0.75" />
      <circle cx="36" cy="62.5" r="2.7" fill={accent} />
      <rect x="42" y="60.4" width="10" height="4.2" rx="2.1" fill={accent} opacity="0.9" />

      {/* Pies / base flotante */}
      <rect x="28" y="73" width="10" height="5.5" rx="2.75" fill="#475569" stroke="#1e293b" strokeWidth="1" />
      <rect x="46" y="73" width="10" height="5.5" rx="2.75" fill="#475569" stroke="#1e293b" strokeWidth="1" />

      {/* Orejas / pernos laterales de la cabeza con acento de carátula */}
      <rect x="12.5" y="29" width="6.5" height="14" rx="3.2" fill="#475569" stroke="#1e293b" strokeWidth="1.2" />
      <rect x="14.2" y="32" width="2.8" height="8" rx="1.4" fill={accent} />
      <rect x="65" y="29" width="6.5" height="14" rx="3.2" fill="#475569" stroke="#1e293b" strokeWidth="1.2" />
      <rect x="67" y="32" width="2.8" height="8" rx="1.4" fill={accent} />

      {/* Cabeza 3D satinada */}
      <rect x="17" y="18" width="50" height="35" rx="14" fill={`url(#rb-head-${uid})`} stroke="#334155" strokeWidth="1.5" />
      {/* Brillo superior metálico */}
      <path d="M26 21.5 H58" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />

      {/* Visor oscuro LED con borde del acento de la carátula */}
      <rect x="22.5" y="24" width="39" height="23" rx="9" fill={`url(#rb-visor-${uid})`} stroke={accent} strokeWidth="1.5" strokeOpacity="0.9" />
      {/* Reflejo cristal en visor */}
      <path d="M27 27.5 H42" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.22" />

      {/* Ojos LED expresivos con parpadeo continuo natural */}
      {isHappy ? (
        <g stroke={accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M29.5 35.5 Q34 30.5 38.5 35.5" />
          <path d="M45.5 35.5 Q50 30.5 54.5 35.5" />
        </g>
      ) : isSurprised ? (
        <g>
          <circle cx="34" cy="34.8" r="4.6" fill={accent} />
          <circle cx="34" cy="34.8" r="2.1" fill="#0f172a" />
          <circle cx="35.3" cy="33.3" r="1.1" fill="#ffffff" />
          <circle cx="50" cy="34.8" r="4.6" fill={accent} />
          <circle cx="50" cy="34.8" r="2.1" fill="#0f172a" />
          <circle cx="51.3" cy="33.3" r="1.1" fill="#ffffff" />
        </g>
      ) : (
        <g className={blinkClass} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          {/* Ojo izquierdo */}
          <ellipse cx="34" cy="34.8" rx="4.2" ry="5.1" fill={accent} />
          <ellipse cx="34" cy="34.8" rx="2.8" ry="3.6" fill="#e0f2fe" opacity="0.72" />
          <circle cx="35.5" cy="32.7" r="1.4" fill="#ffffff" />
          {/* Ojo derecho */}
          <ellipse cx="50" cy="34.8" rx="4.2" ry="5.1" fill={accent} />
          <ellipse cx="50" cy="34.8" rx="2.8" ry="3.6" fill="#e0f2fe" opacity="0.72" />
          <circle cx="51.5" cy="32.7" r="1.4" fill="#ffffff" />
        </g>
      )}

      {/* Sonrisa LED simpática */}
      {isSurprised ? (
        <circle cx="42" cy="42.5" r="2.1" fill={accent} opacity="0.95" />
      ) : (
        <path
          d={isHappy ? 'M35.5 40.8 Q42 46 48.5 40.8' : 'M37 41.8 Q42 44.8 47 41.8'}
          stroke={accent}
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
      )}
    </svg>
  );
};

export const AssistantCharacterSvg: React.FC<CharacterSvgProps> = ({
  avatarId,
  size = 84,
  skin = 'basica',
  skinVariant = 'default',
  santaHat = false,
  gestureActive = false,
  mood = 'idle',
  animated = true,
}) => {
  const imageSrc = AVATAR_IMAGE_PATHS[avatarId] || AVATAR_IMAGE_PATHS.robot;
  const meta = ASSISTANT_CHARACTERS.find((c) => c.id === avatarId) || ASSISTANT_CHARACTERS[0];
  const accent = getSkinAccentHex(skin, skinVariant);

  const effectiveMood: AssistantAvatarMood =
    gestureActive && mood === 'idle' ? 'happy' : mood;
  const showToolSparkle =
    effectiveMood === 'happy' || effectiveMood === 'celebrating' || gestureActive;

  const isRobot = avatarId === 'robot';
  const sizeClass = size === 84 ? 'w-[84px] h-[84px]' : '';

  return (
    <span
      data-avatar-svg={avatarId}
      data-avatar-src={isRobot ? 'svg:robot-animated' : imageSrc}
      data-avatar-mood={effectiveMood}
      className={`relative ${sizeClass} overflow-visible inline-flex items-center justify-center bg-transparent select-none pointer-events-none`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
      aria-hidden="true"
    >
      {isRobot ? (
        <BlinkingRobotSvg
          size={size}
          accent={accent}
          mood={effectiveMood}
          animated={animated}
        />
      ) : (
        <img
          src={imageSrc}
          alt={`Personaje asistente ${meta.label}`}
          width={size}
          height={size}
          draggable={false}
          decoding="async"
          className="w-full h-full bg-transparent object-contain scale-[1.45] select-none pointer-events-none"
          style={{
            background: 'transparent',
            filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.45))',
          }}
        />
      )}

      {/* Gorro navideño sutil cuando la carátula Navideña está activa */}
      {santaHat && (
        <svg
          width={Math.round(size * 0.48)}
          height={Math.round(size * 0.36)}
          viewBox="0 0 40 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
          aria-hidden="true"
        >
          <path d="M6 22 C10 6 24 4 33 13 L29 18 C22 14 14 16 11 22 Z" fill="#b91c1c" />
          <rect x="4" y="20" width="26" height="6" rx="3" fill="#f8fafc" />
          <circle cx="34" cy="14" r="4" fill="#f8fafc" />
        </svg>
      )}

      {/* Destello alegre de herramienta al toque rápido / gesto / celebración */}
      {showToolSparkle && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 pointer-events-none assistant-sparkles"
          aria-hidden="true"
        >
          <path
            d="M14 16 L16.2 10 L18.4 16 L24 18 L18.4 20 L16.2 26 L14 20 L8.5 18 Z"
            fill="#fde047"
          />
          <path
            d="M64 14 L65.8 9 L67.6 14 L72.5 15.8 L67.6 17.6 L65.8 22.5 L64 17.6 L59 15.8 Z"
            fill="#7dd3fc"
          />
          <circle cx="66" cy="56" r="2.6" fill={accent} />
          <circle cx="13" cy="54" r="2.2" fill="#fbbf24" />
        </svg>
      )}
    </span>
  );
};
