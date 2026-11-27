import React, { useId } from 'react';
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
    tagline: 'Asistente metálico 3D',
    gestureText: '¡Bip-bop! Sistemas calibrados al milímetro.',
  },
  {
    id: 'gatito',
    label: 'Gatito',
    tagline: 'Ágil y curioso',
    gestureText: '¡Miau! Ojo fino para cada medida.',
  },
  {
    id: 'perrito',
    label: 'Perro',
    tagline: 'Compañero fiel',
    gestureText: '¡Guau! Listo para ayudarte en taller.',
  },
  {
    id: 'gallito',
    label: 'Gallito',
    tagline: 'Madrugador de obra',
    gestureText: '¡Quiquiriquí! A cotizar temprano.',
  },
  {
    id: 'puerquito',
    label: 'Puerquito',
    tagline: 'Ahorrador PRO',
    gestureText: '¡Oink! Cuidando tu margen y sobrantes.',
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
  mood?: AssistantAvatarMood;
  withHalo?: boolean;
  animated?: boolean;
}

export const AssistantCharacterSvg: React.FC<CharacterSvgProps> = ({
  avatarId,
  size = 64,
  skin = 'basica',
  skinVariant = 'default',
  santaHat = false,
  gestureActive = false,
  mood = 'idle',
  withHalo = true,
  animated = true,
}) => {
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '');
  const accent = getSkinAccentHex(skin, skinVariant);

  const effectiveMood: AssistantAvatarMood =
    gestureActive && mood === 'idle' ? 'happy' : mood;
  const isSurprised = effectiveMood === 'dragging';
  const isJoyful = effectiveMood === 'happy' || effectiveMood === 'celebrating';
  const showSparkles = isJoyful;
  const blinkClass = animated && !isSurprised && !isJoyful ? 'assistant-eye-blink' : '';
  const earLeftClass = animated ? 'assistant-ear-left' : '';
  const earRightClass = animated ? 'assistant-ear-right' : '';
  const partWiggleClass = animated ? 'assistant-part-wiggle' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-avatar-svg={avatarId}
      data-avatar-mood={effectiveMood}
      style={{ display: 'block', background: 'transparent', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {/* Halo / Burbuja translúcida azul metálico + cobre */}
        <radialGradient id={`${uid}-halo-bg`} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.34" />
          <stop offset="48%" stopColor="#1e40af" stopOpacity="0.22" />
          <stop offset="82%" stopColor="#0f172a" stopOpacity="0.46" />
          <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.36" />
        </radialGradient>

        <linearGradient id={`${uid}-halo-ring`} x1="10%" y1="6%" x2="90%" y2="94%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="32%" stopColor="#2563eb" />
          <stop offset="68%" stopColor="#d97736" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>

        <linearGradient id={`${uid}-glass-shine`} x1="20%" y1="8%" x2="65%" y2="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.58" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`${uid}-copper-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="38%" stopColor="#d97736" />
          <stop offset="78%" stopColor="#9a4b1d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <linearGradient id={`${uid}-blue-metal`} x1="15%" y1="5%" x2="85%" y2="95%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="32%" stopColor="#2563eb" />
          <stop offset="74%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <radialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#020617" stopOpacity="0.46" />
          <stop offset="70%" stopColor="#020617" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>

        {/* Degradados 3D por personaje */}
        {/* 1. Robot metálico azul-acero + cobre */}
        <radialGradient id={`${uid}-robot-head`} cx="34%" cy="24%" r="74%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="28%" stopColor="#93c5fd" />
          <stop offset="66%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0f2557" />
        </radialGradient>
        <linearGradient id={`${uid}-robot-visor`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#082f49" />
          <stop offset="55%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* 2. Gatito atigrado 3D */}
        <radialGradient id={`${uid}-cat-fur`} cx="35%" cy="25%" r="72%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="34%" stopColor="#fbbf24" />
          <stop offset="76%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <radialGradient id={`${uid}-cat-ear-in`} cx="50%" cy="65%" r="60%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#fde68a" />
        </radialGradient>

        {/* 3. Perrito caramelo 3D */}
        <radialGradient id={`${uid}-dog-fur`} cx="34%" cy="24%" r="74%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="38%" stopColor="#e59a38" />
          <stop offset="78%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
        <linearGradient id={`${uid}-dog-ear`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="55%" stopColor="#6b2e0a" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <radialGradient id={`${uid}-dog-muzzle`} cx="45%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#e7c68b" />
        </radialGradient>

        {/* 4. Gallito perla y rubí 3D */}
        <radialGradient id={`${uid}-rooster-body`} cx="35%" cy="25%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="52%" stopColor="#f1f5f9" />
          <stop offset="85%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <linearGradient id={`${uid}-rooster-comb`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="45%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id={`${uid}-rooster-beak`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* 5. Puerquito rosado 3D */}
        <radialGradient id={`${uid}-pig-skin`} cx="34%" cy="24%" r="74%">
          <stop offset="0%" stopColor="#ffe4ec" />
          <stop offset="42%" stopColor="#f9a8d4" />
          <stop offset="82%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </radialGradient>
        <radialGradient id={`${uid}-pig-snout`} cx="40%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="55%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#be185d" />
        </radialGradient>

        {/* 6 y 7. Castor y Búho 3D */}
        <radialGradient id={`${uid}-beaver-fur`} cx="36%" cy="24%" r="74%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="45%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#451a03" />
        </radialGradient>
        <radialGradient id={`${uid}-owl-feathers`} cx="36%" cy="24%" r="74%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="45%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>

        <filter id={`${uid}-soft-shadow`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2.6" stdDeviation="2.4" floodColor="#020617" floodOpacity="0.42" />
        </filter>
      </defs>

      {/* Halo / Burbuja translúcida con borde iluminado azul metálico y cobre */}
      {withHalo && (
        <g data-halo="blue-copper-bubble">
          <ellipse cx="40" cy="72" rx="22" ry="4.5" fill={`url(#${uid}-shadow)`} />
          <circle
            cx="40"
            cy="40"
            r="35.5"
            fill={`url(#${uid}-halo-bg)`}
            stroke={`url(#${uid}-halo-ring)`}
            strokeWidth={isJoyful || isSurprised ? '2.6' : '2.1'}
          />
          <circle
            cx="40"
            cy="40"
            r="32.6"
            fill="none"
            stroke="#bae6fd"
            strokeOpacity="0.28"
            strokeWidth="0.9"
          />
          {/* Brillo vítreo superior izquierdo de la burbuja */}
          <path
            d="M17 26 C21 15 33 10 45 11.5 C34 14 24 20 19.5 29 Z"
            fill={`url(#${uid}-glass-shine)`}
          />
        </g>
      )}

      {/* Contenido del personaje con sombra suave volumétrica */}
      <g filter={`url(#${uid}-soft-shadow)`}>
        {/* ==================== 1. ROBOT METÁLICO 3D ==================== */}
        {avatarId === 'robot' && (
          <g>
            {/* Antena con punta cobre iluminada */}
            <g className={partWiggleClass} style={{ transformOrigin: '40px 20px' }}>
              <path d="M40 20 V11.5" stroke={`url(#${uid}-copper-metal)`} strokeWidth="2.8" strokeLinecap="round" />
              <circle cx="40" cy="10" r="3.6" fill={`url(#${uid}-copper-metal)`} />
              <circle cx="38.8" cy="8.8" r="1.2" fill="#fffbeb" opacity="0.9" />
            </g>

            {/* Cuerpo / Hombros metálicos con escudo de cobre */}
            <path
              d="M23 55 C23 48.5 30 46 40 46 C50 46 57 48.5 57 55 L55.5 64 C55.5 66.5 52.5 68 48 68 H32 C27.5 68 24.5 66.5 24.5 64 Z"
              fill={`url(#${uid}-blue-metal)`}
            />
            <rect x="33.5" y="53" width="13" height="8" rx="3.5" fill={`url(#${uid}-copper-metal)`} />
            <circle cx="40" cy="57" r="2.2" fill="#38bdf8" />
            <circle cx="39.3" cy="56.3" r="0.8" fill="#ffffff" />

            {/* Brazos animados en celebración */}
            <ellipse
              cx={isJoyful ? '19' : '21'}
              cy={isJoyful ? '48' : '56'}
              rx="4.2"
              ry="7"
              transform={isJoyful ? 'rotate(-36 19 48)' : 'rotate(12 21 56)'}
              fill={`url(#${uid}-blue-metal)`}
            />
            <ellipse
              cx={isJoyful ? '61' : '59'}
              cy={isJoyful ? '48' : '56'}
              rx="4.2"
              ry="7"
              transform={isJoyful ? 'rotate(36 61 48)' : 'rotate(-12 59 56)'}
              fill={`url(#${uid}-blue-metal)`}
            />

            {/* Cápsulas laterales cobre (orejas de robot) */}
            <rect x="15.5" y="29" width="5.5" height="12" rx="2.7" fill={`url(#${uid}-copper-metal)`} />
            <rect x="59" y="29" width="5.5" height="12" rx="2.7" fill={`url(#${uid}-copper-metal)`} />

            {/* Cabeza esférica-biselada 3D */}
            <rect x="19" y="18" width="42" height="31" rx="14.5" fill={`url(#${uid}-robot-head)`} />
            {/* Reflejo especular de casco */}
            <ellipse cx="32" cy="22.5" rx="9" ry="2.6" fill="#ffffff" opacity="0.45" />

            {/* Visor oscuro brillante */}
            <rect
              x="23.5"
              y="24.5"
              width="33"
              height="18.5"
              rx="8.5"
              fill={`url(#${uid}-robot-visor)`}
              stroke="#38bdf8"
              strokeOpacity="0.6"
              strokeWidth="1.2"
            />

            {/* Ojos LED reactivos */}
            <g className={blinkClass} style={{ transformOrigin: '40px 33px' }}>
              {isJoyful ? (
                <>
                  <path d="M28.5 34 Q32.5 28.5 36.5 34" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M43.5 34 Q47.5 28.5 51.5 34" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" />
                </>
              ) : isSurprised ? (
                <>
                  <circle cx="32.5" cy="33" r="4.3" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="1.4" />
                  <circle cx="47.5" cy="33" r="4.3" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="1.4" />
                  <circle cx="31.2" cy="31.4" r="1.4" fill="#ffffff" />
                  <circle cx="46.2" cy="31.4" r="1.4" fill="#ffffff" />
                </>
              ) : (
                <>
                  <ellipse cx="32.5" cy="33" rx="3.4" ry="4" fill="#38bdf8" />
                  <ellipse cx="47.5" cy="33" rx="3.4" ry="4" fill="#38bdf8" />
                  <circle cx="31.3" cy="31.3" r="1.35" fill="#ffffff" />
                  <circle cx="46.3" cy="31.3" r="1.35" fill="#ffffff" />
                  <circle cx="33.8" cy="34.8" r="0.65" fill="#e0f2fe" />
                  <circle cx="48.8" cy="34.8" r="0.65" fill="#e0f2fe" />
                </>
              )}
            </g>

            {/* Boca LED / expresión */}
            {isSurprised ? (
              <ellipse cx="40" cy="39.5" rx="2.4" ry="2.2" fill="#38bdf8" />
            ) : isJoyful ? (
              <path d="M35.5 38.2 Q40 42.2 44.5 38.2" stroke="#fbbf24" strokeWidth="2.1" strokeLinecap="round" />
            ) : (
              <path d="M36.5 39 Q40 41.2 43.5 39" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </g>
        )}

        {/* ==================== 2. GATITO 3D ==================== */}
        {avatarId === 'gatito' && (
          <g>
            {/* Orejas volumétricas con movimiento independiente */}
            <g className={earLeftClass} style={{ transformOrigin: '24px 28px' }}>
              <path
                d="M19 32 L17.5 13.5 C17.4 11.8 19.3 11 20.6 12 L34 22.5 Z"
                fill={`url(#${uid}-cat-fur)`}
              />
              <path d="M21.5 27 L20.5 16.5 L29.5 22.8 Z" fill={`url(#${uid}-cat-ear-in)`} />
            </g>
            <g className={earRightClass} style={{ transformOrigin: '56px 28px' }}>
              <path
                d="M61 32 L62.5 13.5 C62.6 11.8 60.7 11 59.4 12 L46 22.5 Z"
                fill={`url(#${uid}-cat-fur)`}
              />
              <path d="M58.5 27 L59.5 16.5 L50.5 22.8 Z" fill={`url(#${uid}-cat-ear-in)`} />
            </g>

            {/* Cuerpo suave + collar azul metálico y cascabel cobre */}
            <path
              d="M25 54 C25 48 31 46 40 46 C49 46 55 48 55 54 L53.5 64.5 C53.5 66.8 50.5 68 46.5 68 H33.5 C29.5 68 26.5 66.8 26.5 64.5 Z"
              fill={`url(#${uid}-cat-fur)`}
            />
            <ellipse cx="40" cy="59.5" rx="7.5" ry="5.5" fill="#fef3c7" opacity="0.78" />
            {/* Patitas alegres al celebrar */}
            {isJoyful && (
              <>
                <circle cx="22.5" cy="50" r="4.3" fill={`url(#${uid}-cat-fur)`} />
                <circle cx="57.5" cy="50" r="4.3" fill={`url(#${uid}-cat-fur)`} />
              </>
            )}
            <rect x="27" y="49" width="26" height="5" rx="2.5" fill={`url(#${uid}-blue-metal)`} />
            <circle cx="40" cy="53.8" r="3.4" fill={`url(#${uid}-copper-metal)`} />
            <circle cx="38.8" cy="52.6" r="1.05" fill="#fffbeb" />

            {/* Cabeza 3D redonda con brillo */}
            <ellipse cx="40" cy="36" rx="20.5" ry="17.5" fill={`url(#${uid}-cat-fur)`} />
            <ellipse cx="33" cy="24.5" rx="7.5" ry="2.5" fill="#fffbeb" opacity="0.35" />
            {/* Rayitas atigradas suaves */}
            <path d="M40 19.5 V25 M35.5 20.5 L36.8 24.8 M44.5 20.5 L43.2 24.8" stroke="#b45309" strokeOpacity="0.65" strokeWidth="2.1" strokeLinecap="round" />

            {/* Mejillas suaves */}
            <ellipse cx="26" cy="40.5" rx="4.2" ry="2.4" fill="#fb7185" opacity={isJoyful ? '0.52' : '0.28'} />
            <ellipse cx="54" cy="40.5" rx="4.2" ry="2.4" fill="#fb7185" opacity={isJoyful ? '0.52' : '0.28'} />

            {/* Ojos con brillo realista + parpadeo */}
            <g className={blinkClass} style={{ transformOrigin: '40px 35px' }}>
              {isJoyful ? (
                <>
                  <path d="M27.5 35.5 Q31.5 30 35.5 35.5" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M44.5 35.5 Q48.5 30 52.5 35.5" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="31.5" cy="35" r={isSurprised ? '5' : '4.3'} fill="#0f172a" />
                  <circle cx="48.5" cy="35" r={isSurprised ? '5' : '4.3'} fill="#0f172a" />
                  <circle cx="31.8" cy="35.6" r={isSurprised ? '3.3' : '2.7'} fill="#10b981" opacity="0.55" />
                  <circle cx="48.8" cy="35.6" r={isSurprised ? '3.3' : '2.7'} fill="#10b981" opacity="0.55" />
                  <circle cx="31.5" cy="35" r={isSurprised ? '2.2' : '2'} fill="#020617" />
                  <circle cx="48.5" cy="35" r={isSurprised ? '2.2' : '2'} fill="#020617" />
                  <circle cx="30" cy="33.2" r="1.5" fill="#ffffff" />
                  <circle cx="47" cy="33.2" r="1.5" fill="#ffffff" />
                  <circle cx="33" cy="36.8" r="0.7" fill="#ffffff" opacity="0.85" />
                  <circle cx="50" cy="36.8" r="0.7" fill="#ffffff" opacity="0.85" />
                </>
              )}
            </g>

            {/* Nariz esculpida + boquita + bigotes */}
            <path d="M37.5 40 C37.5 38.8 42.5 38.8 42.5 40 L40 42.6 Z" fill="#f43f5e" />
            <ellipse cx="39.3" cy="39.8" rx="0.9" ry="0.45" fill="#ffe4e6" />
            {isSurprised ? (
              <ellipse cx="40" cy="45.2" rx="2.6" ry="2.8" fill="#9f1239" />
            ) : (
              <path d="M35.5 44 Q37.8 46.5 40 44.3 Q42.2 46.5 44.5 44" stroke="#451a03" strokeWidth="1.7" strokeLinecap="round" />
            )}
            <path
              d="M15.5 37.5 L24 38.8 M16.5 41.5 L24.5 41.5 M64.5 37.5 L56 38.8 M63.5 41.5 L55.5 41.5"
              stroke="#78350f"
              strokeOpacity="0.75"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* ==================== 3. PERRO 3D ==================== */}
        {avatarId === 'perrito' && (
          <g>
            {/* Orejas caídas con sombreado suave */}
            <g className={earLeftClass} style={{ transformOrigin: '21px 28px' }}>
              <ellipse
                cx="18.5"
                cy="38"
                rx="6.8"
                ry="13.5"
                transform={isSurprised || isJoyful ? 'rotate(22 18.5 38)' : 'rotate(10 18.5 38)'}
                fill={`url(#${uid}-dog-ear)`}
              />
            </g>
            <g className={earRightClass} style={{ transformOrigin: '59px 28px' }}>
              <ellipse
                cx="61.5"
                cy="38"
                rx="6.8"
                ry="13.5"
                transform={isSurprised || isJoyful ? 'rotate(-22 61.5 38)' : 'rotate(-10 61.5 38)'}
                fill={`url(#${uid}-dog-ear)`}
              />
            </g>

            {/* Cuerpo + paliacate azul metálico y broche cobre */}
            <path
              d="M25 54 C25 48 31 46 40 46 C49 46 55 48 55 54 L53.5 64.5 C53.5 66.8 50.5 68 46.5 68 H33.5 C29.5 68 26.5 66.8 26.5 64.5 Z"
              fill={`url(#${uid}-dog-fur)`}
            />
            <path d="M27 50 L53 50 L40 62.5 Z" fill={`url(#${uid}-blue-metal)`} />
            <circle cx="40" cy="53.5" r="2.6" fill={`url(#${uid}-copper-metal)`} />

            {/* Cabeza 3D */}
            <ellipse cx="40" cy="35.5" rx="19.5" ry="17.5" fill={`url(#${uid}-dog-fur)`} />
            <ellipse cx="34" cy="23.5" rx="7" ry="2.4" fill="#fef3c7" opacity="0.35" />
            {/* Mancha adorable en el ojo izquierdo */}
            <ellipse cx="31" cy="33.5" rx="7.2" ry="6.4" fill="#92400e" opacity="0.55" />

            {/* Hocico claro volumétrico */}
            <ellipse cx="40" cy="42.5" rx="10.8" ry="7.6" fill={`url(#${uid}-dog-muzzle)`} />

            {/* Ojos expresivos con doble brillo + parpadeo */}
            <g className={blinkClass} style={{ transformOrigin: '40px 33.5px' }}>
              {isJoyful ? (
                <>
                  <path d="M27.5 34 Q31.5 29 35.5 34" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M44.5 34 Q48.5 29 52.5 34" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="31.5" cy="33.5" r={isSurprised ? '4.8' : '4.1'} fill="#1c1917" />
                  <circle cx="48.5" cy="33.5" r={isSurprised ? '4.8' : '4.1'} fill="#1c1917" />
                  <circle cx="30" cy="31.8" r="1.5" fill="#ffffff" />
                  <circle cx="47" cy="31.8" r="1.5" fill="#ffffff" />
                  <circle cx="32.9" cy="35.1" r="0.7" fill="#fef3c7" opacity="0.85" />
                  <circle cx="49.9" cy="35.1" r="0.7" fill="#fef3c7" opacity="0.85" />
                </>
              )}
            </g>

            {/* Nariz húmeda brillante + boca / lengua alegre */}
            <ellipse cx="40" cy="39.5" rx="4.5" ry="3.2" fill="#0f172a" />
            <ellipse cx="38.7" cy="38.3" rx="1.6" ry="0.85" fill="#ffffff" opacity="0.65" />
            {isSurprised ? (
              <ellipse cx="40" cy="45.8" rx="3" ry="3.2" fill="#9f1239" />
            ) : (
              <>
                <path d="M35.5 44.5 Q40 47.8 44.5 44.5" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
                {isJoyful && (
                  <path d="M37.4 45.6 H42.6 V49.2 C42.6 50.8 41.4 51.8 40 51.8 C38.6 51.8 37.4 50.8 37.4 49.2 Z" fill="#fb7185" />
                )}
              </>
            )}
          </g>
        )}

        {/* ==================== 4. GALLITO 3D ==================== */}
        {avatarId === 'gallito' && (
          <g>
            {/* Cresta rubí 3D con movimiento */}
            <g className={partWiggleClass} style={{ transformOrigin: '40px 21px' }}>
              <path
                d="M29 22 C27.5 13 35.5 11.5 37.5 18 C39 10.5 47.5 11 46.5 19 C51 14.5 55.5 19 50.5 25 Z"
                fill={`url(#${uid}-rooster-comb)`}
              />
              <ellipse cx="41.5" cy="14.5" rx="2.4" ry="1.1" fill="#fecdd3" opacity="0.65" />
            </g>

            {/* Alas laterales que aletean al celebrar / arrastrar */}
            <ellipse
              cx={isJoyful || isSurprised ? '20.5' : '22.5'}
              cy={isJoyful ? '52' : '56.5'}
              rx="5.5"
              ry="8.5"
              transform={isJoyful || isSurprised ? 'rotate(-36 20.5 52)' : 'rotate(14 22.5 56.5)'}
              fill={`url(#${uid}-rooster-body)`}
            />
            <ellipse
              cx={isJoyful || isSurprised ? '59.5' : '57.5'}
              cy={isJoyful ? '52' : '56.5'}
              rx="5.5"
              ry="8.5"
              transform={isJoyful || isSurprised ? 'rotate(36 59.5 52)' : 'rotate(-14 57.5 56.5)'}
              fill={`url(#${uid}-rooster-body)`}
            />

            {/* Chaleco azul metálico con detalle cobre */}
            <path
              d="M26 54 C26 48 31.5 46 40 46 C48.5 46 54 48 54 54 L52.5 64.5 C52.5 66.8 50 68 46 68 H34 C30 68 27.5 66.8 27.5 64.5 Z"
              fill={`url(#${uid}-blue-metal)`}
            />
            <path d="M36 52 H44 L40 60 Z" fill={`url(#${uid}-copper-metal)`} />

            {/* Cabeza perla 3D */}
            <circle cx="40" cy="36.5" r="18" fill={`url(#${uid}-rooster-body)`} />
            <ellipse cx="33" cy="24.5" rx="6.5" ry="2.4" fill="#ffffff" opacity="0.7" />

            {/* Mejillas cálidas */}
            <ellipse cx="27.5" cy="40" rx="3.4" ry="2" fill="#fda4af" opacity="0.45" />
            <ellipse cx="52.5" cy="40" rx="3.4" ry="2" fill="#fda4af" opacity="0.45" />

            {/* Ojos con brillo + parpadeo */}
            <g className={blinkClass} style={{ transformOrigin: '40px 34.5px' }}>
              {isJoyful ? (
                <>
                  <path d="M28.5 34.5 Q32 29.8 35.5 34.5" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M44.5 34.5 Q48 29.8 51.5 34.5" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="32" cy="34.5" r={isSurprised ? '4.5' : '3.8'} fill="#0f172a" />
                  <circle cx="48" cy="34.5" r={isSurprised ? '4.5' : '3.8'} fill="#0f172a" />
                  <circle cx="30.7" cy="33" r="1.4" fill="#ffffff" />
                  <circle cx="46.7" cy="33" r="1.4" fill="#ffffff" />
                  <circle cx="33.2" cy="35.9" r="0.65" fill="#ffffff" opacity="0.8" />
                  <circle cx="49.2" cy="35.9" r="0.65" fill="#ffffff" opacity="0.8" />
                </>
              )}
            </g>

            {/* Pico 3D + barbilla roja */}
            <path d="M34.5 39 L45.5 39 L40 46 Z" fill={`url(#${uid}-rooster-beak)`} />
            {(isSurprised || isJoyful) && (
              <ellipse cx="40" cy="44.2" rx="2.6" ry="2" fill="#991b1b" />
            )}
            <circle cx="37.6" cy="48.2" r="3" fill={`url(#${uid}-rooster-comb)`} />
            <circle cx="42.4" cy="48.2" r="3" fill={`url(#${uid}-rooster-comb)`} />
          </g>
        )}

        {/* ==================== 5. PUERQUITO 3D ==================== */}
        {avatarId === 'puerquito' && (
          <g>
            {/* Orejas rosadas volumétricas con animación */}
            <g className={earLeftClass} style={{ transformOrigin: '24px 26px' }}>
              <path
                d="M21 30 L17.5 16.5 C17.1 14.8 18.8 13.8 20.3 14.6 L32 21.5 Z"
                fill={`url(#${uid}-pig-skin)`}
              />
              <path d="M22.5 26.5 L20.4 18.4 L28 22.5 Z" fill="#fda4af" opacity="0.7" />
            </g>
            <g className={earRightClass} style={{ transformOrigin: '56px 26px' }}>
              <path
                d="M59 30 L62.5 16.5 C62.9 14.8 61.2 13.8 59.7 14.6 L48 21.5 Z"
                fill={`url(#${uid}-pig-skin)`}
              />
              <path d="M57.5 26.5 L59.6 18.4 L52 22.5 Z" fill="#fda4af" opacity="0.7" />
            </g>

            {/* Overol azul metálico con botones de cobre */}
            <path
              d="M24 54 C24 48 30.5 46 40 46 C49.5 46 56 48 56 54 L54.5 64.5 C54.5 66.8 51.5 68 47 68 H33 C28.5 68 25.5 66.8 25.5 64.5 Z"
              fill={`url(#${uid}-blue-metal)`}
            />
            <circle cx="33.5" cy="56" r="2.4" fill={`url(#${uid}-copper-metal)`} />
            <circle cx="46.5" cy="56" r="2.4" fill={`url(#${uid}-copper-metal)`} />

            {/* Cabeza rosada esférica 3D */}
            <circle cx="40" cy="36.5" r="19" fill={`url(#${uid}-pig-skin)`} />
            <ellipse cx="33" cy="23.8" rx="7" ry="2.6" fill="#ffffff" opacity="0.45" />

            {/* Chapitas */}
            <ellipse cx="25.5" cy="40.5" rx="3.8" ry="2.3" fill="#f43f5e" opacity={isJoyful ? '0.45' : '0.24'} />
            <ellipse cx="54.5" cy="40.5" rx="3.8" ry="2.3" fill="#f43f5e" opacity={isJoyful ? '0.45' : '0.24'} />

            {/* Ojos con brillo + parpadeo */}
            <g className={blinkClass} style={{ transformOrigin: '40px 32.5px' }}>
              {isJoyful ? (
                <>
                  <path d="M27.5 33 Q31 28 34.5 33" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M45.5 33 Q49 28 52.5 33" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="31" cy="32.5" r={isSurprised ? '4.5' : '3.8'} fill="#0f172a" />
                  <circle cx="49" cy="32.5" r={isSurprised ? '4.5' : '3.8'} fill="#0f172a" />
                  <circle cx="29.7" cy="31" r="1.4" fill="#ffffff" />
                  <circle cx="47.7" cy="31" r="1.4" fill="#ffffff" />
                  <circle cx="32.2" cy="34" r="0.65" fill="#ffffff" opacity="0.8" />
                  <circle cx="50.2" cy="34" r="0.65" fill="#ffffff" opacity="0.8" />
                </>
              )}
            </g>

            {/* Trompita 3D ovalada con brillo especular */}
            <ellipse cx="40" cy="41.2" rx="10" ry="6.8" fill={`url(#${uid}-pig-snout)`} />
            <ellipse cx="37.5" cy="37.4" rx="4" ry="1.2" fill="#ffffff" opacity="0.45" />
            <ellipse cx="36.6" cy="41.2" rx="1.9" ry="2.8" fill="#831843" />
            <ellipse cx="43.4" cy="41.2" rx="1.9" ry="2.8" fill="#831843" />
            {isSurprised && (
              <ellipse cx="40" cy="49.5" rx="2.5" ry="2.2" fill="#831843" />
            )}
          </g>
        )}

        {/* ==================== 6. CASTOR MAESTRO 3D ==================== */}
        {avatarId === 'castor' && (
          <g>
            <circle cx="22.5" cy="30" r="5.5" fill={`url(#${uid}-beaver-fur)`} />
            <circle cx="57.5" cy="30" r="5.5" fill={`url(#${uid}-beaver-fur)`} />
            <path
              d="M24 54 C24 48 30.5 46 40 46 C49.5 46 56 48 56 54 L54.5 64.5 C54.5 66.8 51.5 68 47 68 H33 C28.5 68 25.5 66.8 25.5 64.5 Z"
              fill={accent}
            />
            <ellipse cx="40" cy="38.5" rx="18.5" ry="15.5" fill={`url(#${uid}-beaver-fur)`} />
            {/* Casco de obra 3D */}
            <g className={partWiggleClass} style={{ transformOrigin: '40px 26px' }}>
              <path d="M21 29 C22 15.5 58 15.5 59 29 Z" fill={`url(#${uid}-rooster-beak)`} />
              <rect x="18" y="27" width="44" height="4.5" rx="2.2" fill="#ca8a04" />
              <rect x="37" y="17" width="6" height="10" rx="2" fill={`url(#${uid}-blue-metal)`} />
            </g>
            <g className={blinkClass} style={{ transformOrigin: '40px 37.5px' }}>
              <circle cx="32" cy="37.5" r="3.4" fill="#0f172a" />
              <circle cx="48" cy="37.5" r="3.4" fill="#0f172a" />
              <circle cx="30.9" cy="36.2" r="1.2" fill="#ffffff" />
              <circle cx="46.9" cy="36.2" r="1.2" fill="#ffffff" />
            </g>
            <ellipse cx="40" cy="44.2" rx="9" ry="5.5" fill="#fde68a" />
            <ellipse cx="40" cy="42" rx="3.6" ry="2.2" fill="#1e293b" />
            <rect x="36.6" y="45" width="3.2" height="4.6" rx="1" fill="#ffffff" />
            <rect x="40.2" y="45" width="3.2" height="4.6" rx="1" fill="#ffffff" />
          </g>
        )}

        {/* ==================== 7. BÚHO INGENIERO 3D ==================== */}
        {avatarId === 'buho' && (
          <g>
            <path d="M23 26 L18.5 14 L32 21 Z" fill={`url(#${uid}-owl-feathers)`} />
            <path d="M57 26 L61.5 14 L48 21 Z" fill={`url(#${uid}-owl-feathers)`} />
            <path
              d="M24 54 C24 48 30.5 46 40 46 C49.5 46 56 48 56 54 L54.5 64.5 C54.5 66.8 51.5 68 47 68 H33 C28.5 68 25.5 66.8 25.5 64.5 Z"
              fill={accent}
            />
            <ellipse cx="40" cy="36.5" rx="19" ry="16.5" fill={`url(#${uid}-owl-feathers)`} />
            <circle cx="31.5" cy="35.5" r="8.2" fill="#f1f5f9" />
            <circle cx="48.5" cy="35.5" r="8.2" fill="#f1f5f9" />
            <circle cx="31.5" cy="35.5" r="6.8" fill="none" stroke={`url(#${uid}-copper-metal)`} strokeWidth="2.4" />
            <circle cx="48.5" cy="35.5" r="6.8" fill="none" stroke={`url(#${uid}-copper-metal)`} strokeWidth="2.4" />
            <line x1="38.3" y1="35.5" x2="41.7" y2="35.5" stroke={`url(#${uid}-copper-metal)`} strokeWidth="2.4" />
            <g className={blinkClass} style={{ transformOrigin: '40px 35.5px' }}>
              <circle cx="31.5" cy="35.5" r="3.4" fill="#0f172a" />
              <circle cx="48.5" cy="35.5" r="3.4" fill="#0f172a" />
              <circle cx="30.4" cy="34.2" r="1.2" fill="#ffffff" />
              <circle cx="47.4" cy="34.2" r="1.2" fill="#ffffff" />
            </g>
            <polygon points="40,45.5 36.5,40 43.5,40" fill={`url(#${uid}-rooster-beak)`} />
          </g>
        )}

        {/* Gorrito navideño opcional en carátula Navideña */}
        {santaHat && (
          <g>
            <path d="M26 21 C31 8 49 8 55 18 L52 22 L26 22 Z" fill="#dc2626" />
            <rect x="24" y="19.5" width="30" height="4.6" rx="2.3" fill="#f8fafc" />
            <circle cx="56" cy="18.5" r="3.5" fill="#f8fafc" />
          </g>
        )}
      </g>

      {/* Destellos / estrellitas interactivas al tocar o celebrar */}
      {showSparkles && (
        <g className="assistant-sparkles" data-testid="assistant-sparkles">
          <path
            d="M14 14 L15.4 10.2 L16.8 14 L20.6 15.4 L16.8 16.8 L15.4 20.6 L14 16.8 L10.2 15.4 Z"
            fill="#fde047"
          />
          <path
            d="M65 11 L66.1 8 L67.2 11 L70.2 12.1 L67.2 13.2 L66.1 16.2 L65 13.2 L62 12.1 Z"
            fill="#38bdf8"
          />
          <path
            d="M68 56 L69 53.5 L70 56 L72.5 57 L70 58 L69 60.5 L68 58 L65.5 57 Z"
            fill="#fb923c"
          />
          <circle cx="13" cy="58" r="2.2" fill="#fde047" />
        </g>
      )}
    </svg>
  );
};
