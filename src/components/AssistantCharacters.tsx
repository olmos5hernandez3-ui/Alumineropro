import React from 'react';
import { AppSkin, AppSkinVariant } from '../utils/storageHelpers';
import { MetallicRobot3D } from './MetallicIcons';

export type AssistantAvatarId =
  | 'robot'
  | 'gatito'
  | 'perrito'
  | 'puerquito'
  | 'gallito'
  | 'castor'
  | 'buho';

export const AVATAR_STORAGE_KEY = 'aluminero-avatar';
export const AVATAR_VISIBLE_KEY = 'aluminero-avatar-visible';
export const AVATAR_POS_KEY = 'aluminero-avatar-pos';
export const AVATAR_EVENT_NAME = 'aluminero-avatar';
export const AVATAR_VISIBLE_EVENT_NAME = 'aluminero-avatar-visible';

export interface AssistantCharacterMeta {
  id: AssistantAvatarId;
  label: string;
  tagline: string;
  gestureText: string;
}

export const ASSISTANT_CHARACTERS: AssistantCharacterMeta[] = [
  {
    id: 'robot',
    label: 'Robot',
    tagline: 'Asistente metálico',
    gestureText: '¡Sistemas calibrados al milímetro!',
  },
  {
    id: 'gatito',
    label: 'Gatito',
    tagline: 'Ágil y curioso',
    gestureText: '¡Miau! Ojo fino para cada medida.',
  },
  {
    id: 'perrito',
    label: 'Perrito',
    tagline: 'Compañero fiel',
    gestureText: '¡Guau! Listo para ayudarte en taller.',
  },
  {
    id: 'puerquito',
    label: 'Puerquito',
    tagline: 'Ahorrador PRO',
    gestureText: '¡Oink! Cuidando tu margen y sobrantes.',
  },
  {
    id: 'gallito',
    label: 'Gallito',
    tagline: 'Madrugador de obra',
    gestureText: '¡Quiquiriquí! A cotizar temprano.',
  },
  {
    id: 'castor',
    label: 'Castor Maestro',
    tagline: 'Casco y flexómetro',
    gestureText: '¡Casco puesto y flexómetro listo!',
  },
  {
    id: 'buho',
    label: 'Búho Ingeniero',
    tagline: 'Lentes y escuadra',
    gestureText: 'Escuadra exacta a 90° verificada.',
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
 * Devuelve el color de acento exacto (--sk-line) para tintar accesorios de los 7 personajes
 * según la carátula y variante activas.
 */
export function getSkinAccentHex(
  skin: AppSkin,
  skinVariant: AppSkinVariant
): string {
  if (skin === 'navidena') return '#f5c26b';
  if (skin === 'ejecutiva') {
    if (skinVariant === 'naranja') return '#d46432';
    if (skinVariant === 'verde') return '#4aa05a';
    return '#3a66e3';
  }
  if (skin === 'industrial') {
    if (skinVariant === 'dorada') return '#bd8e34';
    if (skinVariant === 'plateada') return '#98a0b3';
    if (skinVariant === 'bronce') return '#935f37';
    return '#4aa05a';
  }
  return '#3a66e3';
}

interface CharacterSvgProps {
  avatarId: AssistantAvatarId;
  size?: number;
  skin?: AppSkin;
  skinVariant?: AppSkinVariant;
  santaHat?: boolean;
  gestureActive?: boolean;
}

export const AssistantCharacterSvg: React.FC<CharacterSvgProps> = ({
  avatarId,
  size = 56,
  skin = 'basica',
  skinVariant = 'default',
  santaHat = false,
  gestureActive = false,
}) => {
  const accent = getSkinAccentHex(skin, skinVariant);

  if (avatarId === 'robot') {
    return (
      <MetallicRobot3D
        size={size}
        skin={skin}
        skinVariant={skinVariant}
        className="block"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', background: 'transparent' }}
      aria-hidden="true"
    >
      {avatarId === 'gatito' && (
        <g>
          {/* Orejas puntiagudas */}
          <path d="M15 28 L13 10 L27 19 Z" fill="#F59E0B" stroke="#1E293B" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M49 28 L51 10 L37 19 Z" fill="#F59E0B" stroke="#1E293B" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M17.5 23 L16.5 15 L23.5 19.5 Z" fill="#FDE68A" />
          <path d="M46.5 23 L47.5 15 L40.5 19.5 Z" fill="#FDE68A" />
          {/* Cuerpo + collar del color de la carátula */}
          <rect x="20" y="45" width="24" height="14" rx="7" fill="#F59E0B" stroke="#1E293B" strokeWidth="2.2" />
          <rect x="21" y="44" width="22" height="5" rx="2.5" fill={accent} stroke="#1E293B" strokeWidth="1.6" />
          <circle cx="32" cy="48" r="2.6" fill="#FDE047" stroke="#1E293B" strokeWidth="1.3" />
          {/* Cabeza */}
          <ellipse cx="32" cy="31" rx="18" ry="15" fill="#FBBF24" stroke="#1E293B" strokeWidth="2.2" />
          {/* Rayitas frente */}
          <path d="M32 17 V22 M28 18 L29 22 M36 18 L35 22" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          {/* Ojos */}
          {gestureActive ? (
            <>
              <path d="M21 30 Q24.5 26 28 30" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M36 30 Q39.5 26 43 30" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="24.5" cy="30" r="3.4" fill="#0F172A" />
              <circle cx="39.5" cy="30" r="3.4" fill="#0F172A" />
              <circle cx="23.5" cy="28.8" r="1.1" fill="#FFFFFF" />
              <circle cx="38.5" cy="28.8" r="1.1" fill="#FFFFFF" />
            </>
          )}
          {/* Nariz y bigotes */}
          <polygon points="32,36 29.5,33.5 34.5,33.5" fill="#EC4899" />
          <path d="M28 37.5 Q32 40.5 36 37.5" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 32 H20 M13 36 H20 M44 32 H52 M44 36 H51" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}

      {avatarId === 'perrito' && (
        <g>
          {/* Orejas caídas */}
          <ellipse cx="13.5" cy="31" rx="6" ry="12" transform={gestureActive ? 'rotate(-16 13.5 31)' : 'rotate(8 13.5 31)'} fill="#92400E" stroke="#1E293B" strokeWidth="2.2" />
          <ellipse cx="50.5" cy="31" rx="6" ry="12" transform={gestureActive ? 'rotate(16 50.5 31)' : 'rotate(-8 50.5 31)'} fill="#92400E" stroke="#1E293B" strokeWidth="2.2" />
          {/* Cuerpo + pañuelo acento */}
          <rect x="20" y="45" width="24" height="14" rx="7" fill="#D97706" stroke="#1E293B" strokeWidth="2.2" />
          <polygon points="21,45 43,45 32,55" fill={accent} stroke="#1E293B" strokeWidth="1.6" strokeLinejoin="round" />
          {/* Cabeza */}
          <ellipse cx="32" cy="30" rx="17" ry="15.5" fill="#F59E0B" stroke="#1E293B" strokeWidth="2.2" />
          {/* Mancha ojo */}
          <ellipse cx="24" cy="28.5" rx="6" ry="5.5" fill="#B45309" opacity="0.65" />
          {/* Hocico claro */}
          <ellipse cx="32" cy="36.5" rx="9" ry="6.5" fill="#FEF3C7" />
          {/* Ojos */}
          <circle cx="24.5" cy="28.5" r="3.2" fill="#0F172A" />
          <circle cx="39.5" cy="28.5" r="3.2" fill="#0F172A" />
          <circle cx="23.5" cy="27.3" r="1.1" fill="#FFFFFF" />
          <circle cx="38.5" cy="27.3" r="1.1" fill="#FFFFFF" />
          {/* Nariz y lengua alegre */}
          <ellipse cx="32" cy="34" rx="3.8" ry="2.7" fill="#0F172A" />
          <path d="M28 38 Q32 41 36 38" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
          {gestureActive && (
            <rect x="29.5" y="39" width="5" height="5.5" rx="2.5" fill="#F43F5E" stroke="#1E293B" strokeWidth="1.2" />
          )}
        </g>
      )}

      {avatarId === 'puerquito' && (
        <g>
          {/* Orejas rosadas */}
          <path d="M16 24 L13 12 L25 17 Z" fill="#F472B6" stroke="#1E293B" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M48 24 L51 12 L39 17 Z" fill="#F472B6" stroke="#1E293B" strokeWidth="2.2" strokeLinejoin="round" />
          {/* Cuerpo con overol del color de acento */}
          <rect x="19" y="45" width="26" height="14" rx="7" fill={accent} stroke="#1E293B" strokeWidth="2.2" />
          <circle cx="26" cy="51" r="1.8" fill="#FDE047" />
          <circle cx="38" cy="51" r="1.8" fill="#FDE047" />
          {/* Cabeza */}
          <circle cx="32" cy="31" r="17" fill="#F9A8D4" stroke="#1E293B" strokeWidth="2.2" />
          {/* Ojos */}
          <circle cx="24" cy="27.5" r="3" fill="#0F172A" />
          <circle cx="40" cy="27.5" r="3" fill="#0F172A" />
          <circle cx="23.2" cy="26.5" r="1" fill="#FFFFFF" />
          <circle cx="39.2" cy="26.5" r="1" fill="#FFFFFF" />
          {/* Trompita */}
          <ellipse cx="32" cy="35" rx="8.5" ry="6" fill="#F472B6" stroke="#1E293B" strokeWidth="2" />
          <ellipse cx="29" cy="35" rx="1.7" ry="2.5" fill="#831843" />
          <ellipse cx="35" cy="35" rx="1.7" ry="2.5" fill="#831843" />
          {gestureActive && (
            <text x="47" y="16" fontSize="10" fontWeight="900" fill="#FDE047">
              ★
            </text>
          )}
        </g>
      )}

      {avatarId === 'gallito' && (
        <g>
          {/* Cresta roja */}
          <path
            d="M23 18 C22 10 29 9 30 15 C31 8 39 9 38 16 C42 12 46 16 42 21 Z"
            fill="#EF4444"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Cuerpo + chaleco acento */}
          <rect x="20" y="45" width="24" height="14" rx="7" fill={accent} stroke="#1E293B" strokeWidth="2.2" />
          {/* Alas */}
          <ellipse
            cx="15"
            cy="49"
            rx="5"
            ry="7"
            transform={gestureActive ? 'rotate(-35 15 49)' : 'rotate(12 15 49)'}
            fill="#F8FAFC"
            stroke="#1E293B"
            strokeWidth="2"
          />
          <ellipse
            cx="49"
            cy="49"
            rx="5"
            ry="7"
            transform={gestureActive ? 'rotate(35 49 49)' : 'rotate(-12 49 49)'}
            fill="#F8FAFC"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Cabeza */}
          <circle cx="32" cy="31" r="16" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2.2" />
          {/* Ojos */}
          <circle cx="25" cy="29" r="3" fill="#0F172A" />
          <circle cx="39" cy="29" r="3" fill="#0F172A" />
          <circle cx="24" cy="28" r="1" fill="#FFFFFF" />
          <circle cx="38" cy="28" r="1" fill="#FFFFFF" />
          {/* Pico y barbilla */}
          <polygon points="32,39 27,33 37,33" fill="#F59E0B" stroke="#1E293B" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="30" cy="41" r="2.6" fill="#EF4444" stroke="#1E293B" strokeWidth="1.4" />
          <circle cx="34" cy="41" r="2.6" fill="#EF4444" stroke="#1E293B" strokeWidth="1.4" />
        </g>
      )}

      {avatarId === 'castor' && (
        <g>
          {/* Orejitas */}
          <circle cx="17" cy="24" r="5" fill="#78350F" stroke="#1E293B" strokeWidth="2" />
          <circle cx="47" cy="24" r="5" fill="#78350F" stroke="#1E293B" strokeWidth="2" />
          {/* Chaleco de obra con acento */}
          <rect x="19" y="45" width="26" height="14" rx="7" fill={accent} stroke="#1E293B" strokeWidth="2.2" />
          {/* Cabeza */}
          <ellipse cx="32" cy="33" rx="16.5" ry="14" fill="#92400E" stroke="#1E293B" strokeWidth="2.2" />
          {/* Casco de obra */}
          <path
            d="M15 24 C16 12 48 12 49 24 Z"
            fill="#FACC15"
            stroke="#1E293B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <rect x="12" y="22.5" width="40" height="4" rx="2" fill="#EAB308" stroke="#1E293B" strokeWidth="1.8" />
          <rect x="29.5" y="13" width="5" height="9" rx="1.5" fill={accent} />
          {/* Ojos */}
          <circle cx="25" cy="32" r="2.9" fill="#0F172A" />
          <circle cx="39" cy="32" r="2.9" fill="#0F172A" />
          <circle cx="24.2" cy="31" r="1" fill="#FFFFFF" />
          <circle cx="38.2" cy="31" r="1" fill="#FFFFFF" />
          {/* Hocico y dientes de castor */}
          <ellipse cx="32" cy="38.5" rx="8" ry="5" fill="#FDE68A" />
          <ellipse cx="32" cy="36.5" rx="3.2" ry="2" fill="#1E293B" />
          <rect x="29" y="39.5" width="2.8" height="4.2" rx="0.8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.2" />
          <rect x="32.2" y="39.5" width="2.8" height="4.2" rx="0.8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.2" />
          {/* Flexómetro en la mano */}
          <rect x="44" y="46" width="11" height="10" rx="2.5" fill="#F59E0B" stroke="#1E293B" strokeWidth="1.8" />
          <circle cx="49.5" cy="51" r="2.4" fill="#1E293B" />
          {gestureActive && (
            <rect x="54" y="49" width="9" height="3.5" rx="1" fill="#FDE047" stroke="#1E293B" strokeWidth="1.2" />
          )}
        </g>
      )}

      {avatarId === 'buho' && (
        <g>
          {/* Penachos / orejitas de búho */}
          <path d="M16 21 L12 10 L25 16 Z" fill="#475569" stroke="#1E293B" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M48 21 L52 10 L39 16 Z" fill="#475569" stroke="#1E293B" strokeWidth="2.2" strokeLinejoin="round" />
          {/* Cuerpo plumaje + camisa acento */}
          <rect x="19" y="45" width="26" height="14" rx="7" fill={accent} stroke="#1E293B" strokeWidth="2.2" />
          {/* Cabeza */}
          <ellipse cx="32" cy="31" rx="17.5" ry="15" fill="#64748B" stroke="#1E293B" strokeWidth="2.2" />
          {/* Discos faciales */}
          <circle cx="24" cy="30" r="7.5" fill="#F1F5F9" />
          <circle cx="40" cy="30" r="7.5" fill="#F1F5F9" />
          {/* Lentes de ingeniero */}
          <circle
            cx="24"
            cy={gestureActive ? '29' : '30'}
            r="6.2"
            fill="none"
            stroke="#0F172A"
            strokeWidth="2.3"
          />
          <circle
            cx="40"
            cy={gestureActive ? '29' : '30'}
            r="6.2"
            fill="none"
            stroke="#0F172A"
            strokeWidth="2.3"
          />
          <line x1="30.2" y1={gestureActive ? '29' : '30'} x2="33.8" y2={gestureActive ? '29' : '30'} stroke="#0F172A" strokeWidth="2.2" />
          {/* Ojos */}
          <circle cx="24" cy="30" r="2.8" fill="#0F172A" />
          <circle cx="40" cy="30" r="2.8" fill="#0F172A" />
          <circle cx="23.2" cy="29" r="0.9" fill="#FFFFFF" />
          <circle cx="39.2" cy="29" r="0.9" fill="#FFFFFF" />
          {/* Pico */}
          <polygon points="32,39 29,34 35,34" fill="#F59E0B" stroke="#1E293B" strokeWidth="1.6" strokeLinejoin="round" />
          {/* Escuadra metálica */}
          <polygon
            points="45,58 58,58 45,44"
            fill="#E2E8F0"
            stroke="#1E293B"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <polygon points="48,55 53,55 48,49" fill={accent} />
        </g>
      )}
    </svg>
  );
};
