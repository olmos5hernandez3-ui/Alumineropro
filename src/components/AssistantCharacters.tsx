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
 * Devuelve el color de acento exacto (--sk-accent) para los detalles/LED de Alumi-Bot 3D
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

/**
 * Mascota Oficial "Alumi-Bot 3D" con 3 vistas integradas en un solo personaje dinámico:
 * - Vista 1 ('classic'): Robot Metálico Cian clásico en reposo (cuerpo plateado/azul, visor oscuro, ojos parpadeantes y sonrisa LED).
 * - Vista 2 ('waving'): Robot Saludando / Activo (levanta manita saludando, expresión alegre y pulso luminoso cian).
 * - Vista 3 ('technical'): Robot Técnico con Casco de seguridad con franja LED + Medidor Láser amarillo/rojo hacia abajo.
 */
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
      xmlns="http://www.w3.org/2000/svg"
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
        {/* Acero cepillado 3D para casco y carcasa */}
        <linearGradient id={`ab-steel-${uid}`} x1="20" y1="14" x2="76" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="28%" stopColor="#e2e8f0" />
          <stop offset="68%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Casco superior estilizado en acero brillante */}
        <linearGradient id={`ab-helmet-${uid}`} x1="24" y1="8" x2="72" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="32%" stopColor="#e2e8f0" />
          <stop offset="72%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Cuerpo tipo dron esférico/aerodinámico */}
        <radialGradient id={`ab-drone-${uid}`} cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="38%" stopColor="#cbd5e1" />
          <stop offset="76%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>

        {/* Visor frontal curvo negro profundo (#090d16) */}
        <linearGradient id={`ab-visor-${uid}`} x1="24" y1="29" x2="72" y2="57" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#162033" />
          <stop offset="32%" stopColor="#090d16" />
          <stop offset="100%" stopColor="#04070d" />
        </linearGradient>

        {/* Brillo especular sobre el visor */}
        <linearGradient id={`ab-glass-shine-${uid}`} x1="28" y1="30" x2="54" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Brillo LED adaptable al acento de la carátula */}
        <radialGradient id={`ab-led-${uid}`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor={accent} />
          <stop offset="100%" stopColor={accent} stopOpacity="0.72" />
        </radialGradient>

        {/* Propulsores inferiores luminosos */}
        <linearGradient id={`ab-thrust-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor={accent} stopOpacity="0.88" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>

        {/* Medidor láser amarillo / negro */}
        <linearGradient id={`ab-meter-yellow-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        {/* Haz láser hacia abajo */}
        <linearGradient id={`ab-laser-beam-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#ef4444" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>

        {/* Destello breve al tocar */}
        <radialGradient id={`ab-laser-flare-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#ff4d6d" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>

        {/* Sombra de contacto suave flotante */}
        <radialGradient id={`ab-shadow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#020617" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sombra de flotación suave en base */}
      <ellipse cx="48" cy="91.5" rx="22" ry="3.2" fill={`url(#ab-shadow-${uid})`} />

      {/* Propulsores inferiores luminosos (izquierdo y derecho) */}
      <g className={thrusterClass} style={{ transformBox: 'fill-box', transformOrigin: 'top center' }}>
        <path d="M35.5 76 L39 88.5 L42.5 76 Z" fill={`url(#ab-thrust-${uid})`} />
        <ellipse cx="39" cy="76.5" rx="3.4" ry="1.4" fill="#ffffff" opacity="0.9" />
        <path d="M53.5 76 L57 88.5 L60.5 76 Z" fill={`url(#ab-thrust-${uid})`} />
        <ellipse cx="57" cy="76.5" rx="3.4" ry="1.4" fill="#ffffff" opacity="0.9" />
      </g>

      {/* Boquillas metálicas de los 2 propulsores */}
      <rect x="34" y="71.5" width="10" height="5.5" rx="2.75" fill="#334155" />
      <rect x="35.2" y="72.4" width="7.6" height="2" rx="1" fill="#94a3b8" opacity="0.7" />
      <rect x="52" y="71.5" width="10" height="5.5" rx="2.75" fill="#334155" />
      <rect x="53.2" y="72.4" width="7.6" height="2" rx="1" fill="#94a3b8" opacity="0.7" />

      {/* Cuerpo inferior tipo dron metálico 3D */}
      <path
        d="M28 57 C28 53 36 51 48 51 C60 51 68 53 68 57 L65 69.5 C64 73 57 74.5 48 74.5 C39 74.5 32 73 31 69.5 Z"
        fill={`url(#ab-drone-${uid})`}
      />
      {/* Banda pectoral oscura + núcleo LED luminoso */}
      <rect x="36" y="59.5" width="24" height="9" rx="4.5" fill="#090d16" />
      <circle cx="42.5" cy="64" r="2.4" fill={`url(#ab-led-${uid})`} />
      <rect x="47.5" y="62.2" width="9.5" height="3.6" rx="1.8" fill={accent} opacity="0.92" />
      {/* Brillo especular inferior */}
      <path d="M35 71.2 Q48 73.2 61 71.2" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />

      {/* Antena lateral derecha del casco */}
      <g className={antennaClass} style={{ transformBox: 'fill-box', transformOrigin: 'bottom left' }}>
        <path d="M71 27 L78 14.5" stroke="#94a3b8" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M71 27 L77.6 15.2" stroke="#e2e8f0" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
        <circle cx="78.8" cy="13.2" r="5" fill={accent} opacity="0.28" />
        <circle cx="78.8" cy="13.2" r="3" fill={`url(#ab-led-${uid})`} />
        <circle cx="78" cy="12.2" r="1" fill="#ffffff" />
      </g>

      {/* Cabeza 3D en acero cepillado */}
      <rect x="20" y="21" width="56" height="37" rx="17" fill={`url(#ab-steel-${uid})`} />
      {/* Anillo lateral izquierdo/derecho metálico */}
      <rect x="16.5" y="34" width="5" height="12" rx="2.5" fill="#475569" />
      <rect x="17.8" y="36.2" width="2" height="7.6" rx="1" fill={accent} opacity="0.9" />
      <rect x="74.5" y="34" width="5" height="12" rx="2.5" fill="#475569" />
      <rect x="76.2" y="36.2" width="2" height="7.6" rx="1" fill={accent} opacity="0.9" />

      {/* Pulso luminoso cian cuando está en Vista 2 (Saludando / Activo) */}
      {isWavingPose && (
        <circle
          cx="48"
          cy="47"
          r="37"
          stroke={accent}
          strokeWidth="1.8"
          strokeOpacity="0.45"
          strokeDasharray="6 5"
          fill="none"
        />
      )}

      {/* Casco de seguridad aluminero estilizado SOLO en Vista 3 (Técnico) */}
      {isTechnicalPose && (
        <g data-robot-part="safety-helmet">
          <path
            d="M22.5 29.5 C23 15.5 33 10 48 10 C63 10 73 15.5 73.5 29.5 C66 26.8 57.5 25.5 48 25.5 C38.5 25.5 30 26.8 22.5 29.5 Z"
            fill={`url(#ab-helmet-${uid})`}
          />
          {/* Cresta central volumétrica del casco */}
          <path
            d="M42.5 11.2 C44 9.5 52 9.5 53.5 11.2 L55 24.5 C50.5 23.9 45.5 23.9 41 24.5 Z"
            fill="#f8fafc"
            opacity="0.72"
          />
          {/* Visera del casco */}
          <path
            d="M21 29.2 Q48 23.8 75 29.2 Q75.5 31.8 72.5 32.2 Q48 27.6 23.5 32.2 Q20.5 31.8 21 29.2 Z"
            fill="#64748b"
          />
          {/* Franja LED frontal brillante del casco */}
          <rect x="37" y="19.2" width="22" height="3.6" rx="1.8" fill={accent} opacity="0.42" />
          <rect x="38.5" y="19.8" width="19" height="2.4" rx="1.2" fill={`url(#ab-led-${uid})`} />
        </g>
      )}

      {/* Brillo superior metálico limpio cuando está en Vista 1 (Clásico) o Vista 2 (Saludando) */}
      {!isTechnicalPose && (
        <path
          d="M31 24.2 Q48 20.5 65 24.2"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.65"
        />
      )}

      {/* Visor oscuro frontal curvo (#090d16) */}
      <rect x="25.5" y="31" width="45" height="23.5" rx="11" fill={`url(#ab-visor-${uid})`} />
      {/* Borde iluminado sutil del visor */}
      <rect
        x="26.2"
        y="31.7"
        width="43.6"
        height="22.1"
        rx="10.4"
        stroke={accent}
        strokeWidth={isWavingPose ? '1.6' : '1.15'}
        strokeOpacity={isWavingPose ? '0.9' : '0.65'}
        fill="none"
      />
      {/* Brillo especular curvo en cristal del visor */}
      <path
        d="M31 35.5 C36 33.2 47 33.2 53.5 34.4 C46 36.2 37.5 37.2 30.5 39.2 Z"
        fill={`url(#ab-glass-shine-${uid})`}
      />

      {/* Ojos LED circulares con parpadeo natural continuo (~3.5s) */}
      {isHappy ? (
        <g stroke={accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M34 42.5 Q38.5 37.5 43 42.5" />
          <path d="M53 42.5 Q57.5 37.5 62 42.5" />
        </g>
      ) : isSurprised ? (
        <g>
          <circle cx="38.5" cy="41.8" r="5" fill={accent} opacity="0.28" />
          <circle cx="38.5" cy="41.8" r="3.9" fill={`url(#ab-led-${uid})`} />
          <circle cx="38.5" cy="41.8" r="1.7" fill="#090d16" />
          <circle cx="39.8" cy="40.4" r="1" fill="#ffffff" />

          <circle cx="57.5" cy="41.8" r="5" fill={accent} opacity="0.28" />
          <circle cx="57.5" cy="41.8" r="3.9" fill={`url(#ab-led-${uid})`} />
          <circle cx="57.5" cy="41.8" r="1.7" fill="#090d16" />
          <circle cx="58.8" cy="40.4" r="1" fill="#ffffff" />
        </g>
      ) : (
        <g className={blinkClass} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          {/* Halo + ojo circular izquierdo */}
          <circle cx="38.5" cy="41.8" r="5.2" fill={accent} opacity="0.24" />
          <circle cx="38.5" cy="41.8" r="3.9" fill={`url(#ab-led-${uid})`} />
          <circle cx="39.9" cy="40.3" r="1.35" fill="#ffffff" />
          {/* Halo + ojo circular derecho */}
          <circle cx="57.5" cy="41.8" r="5.2" fill={accent} opacity="0.24" />
          <circle cx="57.5" cy="41.8" r="3.9" fill={`url(#ab-led-${uid})`} />
          <circle cx="58.9" cy="40.3" r="1.35" fill="#ffffff" />
        </g>
      )}

      {/* Sonrisa amigable LED */}
      {isSurprised ? (
        <circle cx="48" cy="49.2" r="2.1" fill={accent} />
      ) : (
        <path
          d={isHappy ? 'M41.5 47.4 Q48 52.8 54.5 47.4' : 'M43 48.3 Q48 51.4 53 48.3'}
          stroke={accent}
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Mano izquierda: Medidor Láser amarillo/rojo SOLO en Vista 3 (Técnico); en reposo/saludando mano flotante limpia */}
      {isTechnicalPose ? (
        <g data-robot-part="laser-meter">
          {/* Haz láser continuo hacia abajo */}
          <path
            d={laserActive ? 'M14.5 72.5 L11.5 92 L17.5 92 Z' : 'M14.5 72.5 L13.4 89 L15.6 89 Z'}
            fill={`url(#ab-laser-beam-${uid})`}
            className={laserActive ? 'alumibot-laser-flash' : ''}
          />
          <line
            x1="14.5"
            y1="72.5"
            x2="14.5"
            y2={laserActive ? '91' : '87.5'}
            stroke={laserActive ? '#ffffff' : '#ff4d6d'}
            strokeWidth={laserActive ? '1.8' : '1.1'}
            strokeLinecap="round"
            opacity={laserActive ? '1' : '0.85'}
          />
          {/* Punto láser / destello 0.6s en el impacto inferior */}
          <circle
            cx="14.5"
            cy={laserActive ? '90' : '87.5'}
            r={laserActive ? '5.2' : '2.3'}
            fill={`url(#ab-laser-flare-${uid})`}
            className={laserActive ? 'alumibot-laser-flash' : ''}
          />
          {laserActive && (
            <g className="alumibot-laser-flash">
              <line x1="8.5" y1="90" x2="20.5" y2="90" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="14.5" y1="84.5" x2="14.5" y2="94.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          )}

          {/* Medidor láser amarillo y negro */}
          <rect x="9.5" y="55" width="10" height="17.5" rx="2.6" fill={`url(#ab-meter-yellow-${uid})`} />
          <rect x="11" y="57.2" width="7" height="5.5" rx="1.2" fill="#0f172a" />
          <rect x="12" y="58.5" width="5" height="2.4" rx="0.6" fill="#38bdf8" opacity="0.85" />
          <rect x="10.8" y="64" width="7.4" height="6.8" rx="1.4" fill="#1e293b" />
          <circle cx="14.5" cy="66.6" r="1.4" fill="#ef4444" />
          <circle cx="14.5" cy="72.3" r="1.3" fill="#ff4d6d" />

          {/* Mano metálica flotante izquierda sujetando el medidor */}
          <ellipse cx="21.2" cy="63.5" rx="4.4" ry="4.8" fill={`url(#ab-drone-${uid})`} />
          <ellipse cx="20.2" cy="61.8" rx="1.5" ry="1.8" fill="#ffffff" opacity="0.65" />
        </g>
      ) : (
        <g data-robot-part="idle-left-hand">
          <ellipse cx="21.5" cy="63.5" rx="4.4" ry="5" transform="rotate(-14 21.5 63.5)" fill={`url(#ab-drone-${uid})`} />
          <ellipse cx="20.4" cy="61.8" rx="1.5" ry="1.8" fill="#ffffff" opacity="0.68" />
        </g>
      )}

      {/* Mano derecha: Levantada saludando en Vista 2 (Saludando / Activo) y Vista 3; relajada flotando en Vista 1 (Clásico) */}
      {isWavingPose ? (
        <g
          data-robot-part="waving-hand"
          className={waveClass}
          style={{ transformBox: 'fill-box', transformOrigin: 'bottom left' }}
        >
          <ellipse cx="81" cy="46.5" rx="5" ry="5.8" transform="rotate(18 81 46.5)" fill={`url(#ab-drone-${uid})`} />
          <rect x="79.5" y="36.5" width="2.6" height="6.6" rx="1.3" transform="rotate(8 79.5 36.5)" fill="#e2e8f0" />
          <rect x="82.8" y="37.4" width="2.5" height="6.4" rx="1.25" transform="rotate(18 82.8 37.4)" fill="#cbd5e1" />
          <rect x="85.8" y="40" width="2.3" height="5.5" rx="1.15" transform="rotate(28 85.8 40)" fill="#94a3b8" />
          <ellipse cx="79.8" cy="45" rx="1.6" ry="2" fill="#ffffff" opacity="0.78" />
          {/* Líneas de saludo cian */}
          <path d="M88 33.5 Q91 36 89.5 39.5" stroke={accent} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M91.2 35.5 Q93.5 38 92.2 41.2" stroke={accent} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" fill="none" />
        </g>
      ) : (
        <g data-robot-part="rest-right-hand">
          <ellipse cx="74.5" cy="63.5" rx="4.4" ry="5" transform="rotate(14 74.5 63.5)" fill={`url(#ab-drone-${uid})`} />
          <ellipse cx="73.6" cy="61.8" rx="1.5" ry="1.8" fill="#ffffff" opacity="0.68" />
        </g>
      )}
    </svg>
  );
};

export const AssistantCharacterSvg: React.FC<CharacterSvgProps> = ({
  avatarId,
  size = 92,
  skin = 'basica',
  skinVariant = 'default',
  santaHat = false,
  gestureActive = false,
  laserFlash = false,
  robotPose,
  mood = 'idle',
  animated = true,
}) => {
  const imageSrc = AVATAR_IMAGE_PATHS[avatarId] || AVATAR_IMAGE_PATHS.robot;
  const meta = ASSISTANT_CHARACTERS.find((c) => c.id === avatarId) || ASSISTANT_CHARACTERS[0];
  const accent = getSkinAccentHex(skin, skinVariant);

  const effectiveMood: AssistantAvatarMood =
    gestureActive && mood === 'idle' ? 'happy' : mood;
  const effectivePose: RobotPoseMode =
    robotPose ??
    (gestureActive ? 'technical' : effectiveMood === 'happy' || effectiveMood === 'celebrating' ? 'waving' : 'classic');
  const showToolSparkle =
    effectiveMood === 'happy' || effectiveMood === 'celebrating' || gestureActive;

  const isRobot = avatarId === 'robot';
  const sizeClass = size === 92 ? 'w-[92px] h-[92px]' : '';

  return (
    <span
      data-avatar-svg={avatarId}
      data-avatar-src={isRobot ? 'svg:alumi-bot-3d' : imageSrc}
      data-avatar-mood={effectiveMood}
      data-robot-pose={isRobot ? effectivePose : undefined}
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
        <AlumiBot3DSvg
          size={size}
          accent={accent}
          mood={effectiveMood}
          pose={effectivePose}
          animated={animated}
          laserFlash={laserFlash}
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
