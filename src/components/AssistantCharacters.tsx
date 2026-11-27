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
    tagline: 'Asistente metálico 3D',
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
 * Devuelve el color de acento exacto (--sk-accent) para destellos de los 7 personajes
 * según la carátula y variante activas.
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
  return '#3b6ef5';
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

export const AssistantCharacterSvg: React.FC<CharacterSvgProps> = ({
  avatarId,
  size = 68,
  skin = 'basica',
  skinVariant = 'default',
  santaHat = false,
  gestureActive = false,
  mood = 'idle',
}) => {
  const imageSrc = AVATAR_IMAGE_PATHS[avatarId] || AVATAR_IMAGE_PATHS.robot;
  const meta = ASSISTANT_CHARACTERS.find((c) => c.id === avatarId) || ASSISTANT_CHARACTERS[0];
  const accent = getSkinAccentHex(skin, skinVariant);

  const effectiveMood: AssistantAvatarMood =
    gestureActive && mood === 'idle' ? 'happy' : mood;
  const showToolSparkle =
    effectiveMood === 'happy' || effectiveMood === 'celebrating' || gestureActive;

  return (
    <span
      data-avatar-svg={avatarId}
      data-avatar-src={imageSrc}
      data-avatar-mood={effectiveMood}
      className="relative inline-flex items-center justify-center bg-transparent select-none pointer-events-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
      aria-hidden="true"
    >
      <img
        src={imageSrc}
        alt={`Personaje asistente ${meta.label}`}
        width={size}
        height={size}
        draggable={false}
        decoding="async"
        className="w-full h-full bg-transparent object-contain select-none pointer-events-none"
        style={{
          background: 'transparent',
          filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.45))',
        }}
      />

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
