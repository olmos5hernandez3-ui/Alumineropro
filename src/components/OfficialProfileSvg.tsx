import React from 'react';
import { OfficialSvgArchetype } from '../utils/officialCatalog2026';

interface Props {
  archetype: OfficialSvgArchetype;
  clave: string;
  size?: number;
  className?: string;
}

/**
 * Dibujo técnico CAD vectorial (sección transversal para perfiles de aluminio
 * o esquema técnico de ingeniería para herrajes y canceles de baño).
 */
export const OfficialProfileSvg: React.FC<Props> = ({
  archetype,
  clave,
  size = 84,
  className = '',
}) => {
  const stroke = '#0B2545';
  const fillAlum = '#CBD5E1';
  const fillDark = '#1E3A8A';
  const accent = '#2563EB';
  const dim = '#64748B';

  const renderShape = () => {
    switch (archetype) {
      case 'bolsa':
        return (
          <>
            <path
              d="M22 18 H98 V82 H22 V18 Z M34 30 V70 H86 V30 H34 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <path d="M52 18 V32 H68 V18" fill="#FFFFFF" stroke={stroke} strokeWidth="2.2" />
            <line x1="22" y1="92" x2="98" y2="92" stroke={dim} strokeWidth="1.2" strokeDasharray="3 2" />
            <line x1="12" y1="18" x2="12" y2="82" stroke={dim} strokeWidth="1.2" strokeDasharray="3 2" />
          </>
        );
      case 'escalonado':
        return (
          <>
            <path
              d="M20 20 H74 V42 H100 V82 H20 Z M32 32 V70 H88 V54 H62 V32 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <rect x="76" y="20" width="20" height="18" fill="#DBEAFE" stroke={accent} strokeWidth="1.6" strokeDasharray="2 2" />
          </>
        );
      case 'tapa':
        return (
          <>
            <path
              d="M18 40 H102 V56 H90 V68 H80 V56 H40 V68 H30 V56 H18 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <line x1="18" y1="30" x2="102" y2="30" stroke={accent} strokeWidth="1.4" strokeDasharray="3 2" />
          </>
        );
      case 'junquillo':
        return (
          <>
            <path
              d="M34 24 H84 L90 36 V74 H74 V40 H48 V74 H34 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <path d="M48 64 L56 72 L48 76" fill="none" stroke={accent} strokeWidth="2" />
          </>
        );
      case 'esquinero':
        return (
          <>
            <path
              d="M20 20 H100 V44 H44 V100 H20 Z M30 30 V88 H34 V34 H88 V30 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <circle cx="32" cy="32" r="4" fill={accent} />
          </>
        );
      case 'union':
        return (
          <>
            <path
              d="M18 32 H102 V44 H66 V66 H102 V78 H18 V66 H54 V44 H18 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <line x1="60" y1="18" x2="60" y2="92" stroke={accent} strokeWidth="1.4" strokeDasharray="3 2" />
          </>
        );
      case 'riel':
        return (
          <>
            <path
              d="M14 78 H106 V42 H94 V64 H72 V34 H62 V64 H48 V34 H38 V64 H26 V42 H14 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <line x1="43" y1="24" x2="43" y2="34" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
            <line x1="67" y1="24" x2="67" y2="34" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
          </>
        );
      case 'cabezal':
        return (
          <>
            <path
              d="M14 22 H106 V68 H94 V36 H72 V64 H62 V36 H48 V64 H38 V36 H26 V68 H14 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <rect x="26" y="22" width="68" height="8" fill="#93C5FD" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case 'jamba':
        return (
          <>
            <path
              d="M22 18 H98 V82 H84 V32 H36 V82 H22 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <rect x="44" y="42" width="32" height="34" fill="#EFF6FF" stroke={accent} strokeWidth="1.5" strokeDasharray="3 2" />
          </>
        );
      case 'cerco':
        return (
          <>
            <path
              d="M30 16 H90 V84 H30 Z M42 28 V72 H78 V28 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <path d="M90 38 H102 V62 H90" fill="#DBEAFE" stroke={accent} strokeWidth="2.2" />
          </>
        );
      case 'traslape':
        return (
          <>
            <path
              d="M26 20 H78 V52 H96 V82 H26 Z M38 32 V70 H66 V32 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <path d="M78 36 H94 V48 H84" fill="none" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
          </>
        );
      case 'zoclo':
        return (
          <>
            <path
              d="M26 16 H94 V86 H26 Z M38 28 V52 H82 V28 Z M38 62 V76 H82 V62 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <circle cx="48" cy="69" r="3" fill={fillDark} />
            <circle cx="72" cy="69" r="3" fill={fillDark} />
          </>
        );
      case 'hoja-euro':
        return (
          <>
            <path
              d="M22 16 H96 V84 H44 V66 H22 Z M36 28 V54 H84 V28 Z M54 62 V74 H84 V62 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <rect x="22" y="24" width="10" height="22" fill={accent} rx="1" />
          </>
        );
      case 'marco-batiente':
        return (
          <>
            <path
              d="M18 18 H84 V44 H102 V84 H18 Z M30 30 V72 H90 V54 H72 V30 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <circle cx="84" cy="44" r="3.5" fill={accent} />
          </>
        );
      case 'louver':
        return (
          <>
            <path d="M22 72 L52 24 H70 L40 72 Z" fill={fillAlum} stroke={stroke} strokeWidth="2.2" />
            <path d="M54 72 L84 24 H102 L72 72 Z" fill={fillAlum} stroke={stroke} strokeWidth="2.2" />
            <line x1="16" y1="80" x2="104" y2="80" stroke={accent} strokeWidth="2" />
          </>
        );
      case 'fachada':
        return (
          <>
            <path
              d="M34 12 H86 V88 H34 Z M44 22 V78 H76 V22 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <rect x="24" y="12" width="72" height="10" fill="#93C5FD" stroke={stroke} strokeWidth="2" />
            <line x1="60" y1="8" x2="60" y2="28" stroke={accent} strokeWidth="2.4" />
          </>
        );
      case 'bano':
        return (
          <>
            <path
              d="M24 22 Q60 12 96 22 V62 H84 V32 Q60 26 36 32 V62 H24 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <rect x="34" y="68" width="52" height="14" rx="2" fill="#DBEAFE" stroke={accent} strokeWidth="2" />
          </>
        );
      case 'mosquitero':
        return (
          <>
            <path
              d="M28 24 H92 V76 H28 Z M40 36 V64 H80 V36 Z"
              fill={fillAlum}
              fillRule="evenodd"
              stroke={stroke}
              strokeWidth="2.4"
            />
            <circle cx="60" cy="24" r="6" fill={accent} stroke={stroke} strokeWidth="1.8" />
          </>
        );
      case 'goteron':
        return (
          <>
            <path
              d="M20 28 H76 V54 L100 72 L92 80 L64 60 H20 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <path d="M92 84 Q96 90 92 94 Q88 90 92 84 Z" fill={accent} />
          </>
        );
      case 'carretilla':
        return (
          <>
            <rect x="18" y="34" width="84" height="24" rx="4" fill={fillAlum} stroke={stroke} strokeWidth="2.4" />
            <circle cx="40" cy="64" r="14" fill="#E2E8F0" stroke={stroke} strokeWidth="2.4" />
            <circle cx="40" cy="64" r="5" fill={accent} />
            <circle cx="80" cy="64" r="14" fill="#E2E8F0" stroke={stroke} strokeWidth="2.4" />
            <circle cx="80" cy="64" r="5" fill={accent} />
            <line x1="12" y1="80" x2="108" y2="80" stroke={dim} strokeWidth="2" />
          </>
        );
      case 'chapa':
        return (
          <>
            <rect x="34" y="16" width="52" height="72" rx="6" fill={fillAlum} stroke={stroke} strokeWidth="2.4" />
            <rect x="20" y="36" width="14" height="16" rx="2" fill={accent} stroke={stroke} strokeWidth="2" />
            <circle cx="60" cy="40" r="9" fill="#FFFFFF" stroke={stroke} strokeWidth="2" />
            <rect x="58" y="35" width="4" height="10" rx="1" fill={stroke} />
            <circle cx="60" cy="68" r="6" fill={fillDark} />
          </>
        );
      case 'cierre-embutido':
        return (
          <>
            <rect x="38" y="14" width="44" height="74" rx="8" fill={fillAlum} stroke={stroke} strokeWidth="2.4" />
            <rect x="48" y="26" width="24" height="32" rx="4" fill="#FFFFFF" stroke={stroke} strokeWidth="2" />
            <path d="M54 66 H66 L60 76 Z" fill={accent} />
          </>
        );
      case 'escuadra':
        return (
          <>
            <path
              d="M22 22 H92 V42 H42 V92 H22 Z"
              fill={fillAlum}
              stroke={stroke}
              strokeWidth="2.4"
            />
            <circle cx="62" cy="32" r="4" fill={accent} />
            <circle cx="80" cy="32" r="4" fill={accent} />
            <circle cx="32" cy="62" r="4" fill={accent} />
            <circle cx="32" cy="80" r="4" fill={accent} />
          </>
        );
      case 'vinil':
        return (
          <>
            <path
              d="M36 20 H76 V34 H58 V74 H74 V86 H36 V74 H48 V34 H36 Z"
              fill="#334155"
              stroke={stroke}
              strokeWidth="2.2"
            />
            <path d="M76 28 Q94 42 76 58 Q94 70 76 80" fill="none" stroke={accent} strokeWidth="2.4" />
          </>
        );
      case 'bisagra':
        return (
          <>
            <rect x="22" y="24" width="28" height="52" rx="3" fill={fillAlum} stroke={stroke} strokeWidth="2.2" />
            <rect x="70" y="24" width="28" height="52" rx="3" fill={fillAlum} stroke={stroke} strokeWidth="2.2" />
            <rect x="52" y="16" width="16" height="68" rx="6" fill={accent} stroke={stroke} strokeWidth="2.2" />
            <circle cx="36" cy="38" r="3" fill={stroke} />
            <circle cx="36" cy="62" r="3" fill={stroke} />
            <circle cx="84" cy="38" r="3" fill={stroke} />
            <circle cx="84" cy="62" r="3" fill={stroke} />
          </>
        );
      case 'manilla':
        return (
          <>
            <rect x="34" y="18" width="22" height="54" rx="5" fill={fillAlum} stroke={stroke} strokeWidth="2.4" />
            <path d="M45 36 H92 Q98 36 98 42 V46 Q98 52 92 52 H45 Z" fill={accent} stroke={stroke} strokeWidth="2.2" />
            <circle cx="45" cy="26" r="2.5" fill={stroke} />
            <circle cx="45" cy="64" r="2.5" fill={stroke} />
          </>
        );
      case 'cancel-bano':
        return (
          <>
            <rect x="16" y="16" width="88" height="72" rx="3" fill="#EFF6FF" stroke={stroke} strokeWidth="2.4" />
            <line x1="16" y1="26" x2="104" y2="26" stroke={stroke} strokeWidth="3.2" />
            <rect x="20" y="28" width="40" height="56" fill="#DBEAFE" stroke={accent} strokeWidth="1.6" />
            <rect x="60" y="28" width="40" height="56" fill="#BFDBFE" stroke={accent} strokeWidth="1.6" />
            <circle cx="32" cy="24" r="4" fill={accent} stroke={stroke} strokeWidth="1.5" />
            <circle cx="50" cy="24" r="4" fill={accent} stroke={stroke} strokeWidth="1.5" />
            <line x1="68" y1="48" x2="68" y2="66" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <rect x="24" y="24" width="72" height="52" rx="4" fill={fillAlum} stroke={stroke} strokeWidth="2.4" />
        );
    }
  };

  return (
    <svg
      viewBox="0 0 120 104"
      width={size}
      height={Math.round(size * 0.87)}
      className={`block shrink-0 ${className}`}
      role="img"
      aria-label={`Dibujo técnico perfil o herraje clave ${clave}`}
    >
      {/* Cuadrícula CAD sutil */}
      <defs>
        <pattern id={`cad-grid-${archetype}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#E2E8F0" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="118" height="102" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
      <rect x="2" y="2" width="116" height="100" rx="7" fill={`url(#cad-grid-${archetype})`} />
      {renderShape()}
    </svg>
  );
};
