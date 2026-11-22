import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * 3D metallic architectural AP + window monogram emblem for the TopBar.
 */
export const AlumineroProMetallicLogo: React.FC<IconProps> = ({ className = '', size = 38 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ap-metal-gold" x1="8" y1="6" x2="58" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F5E6C8" />
        <stop offset="35%" stopColor="#C8B48A" />
        <stop offset="68%" stopColor="#7A8C9C" />
        <stop offset="100%" stopColor="#E6D5B8" />
      </linearGradient>
      <linearGradient id="ap-steel-frame" x1="12" y1="10" x2="48" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D7E4EE" />
        <stop offset="48%" stopColor="#6D8498" />
        <stop offset="100%" stopColor="#263847" />
      </linearGradient>
      <linearGradient id="ap-glass" x1="14" y1="14" x2="42" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B6E94" stopOpacity="0.82" />
        <stop offset="50%" stopColor="#122B3F" stopOpacity="0.92" />
        <stop offset="100%" stopColor="#07131B" stopOpacity="0.96" />
      </linearGradient>
      <linearGradient id="ap-swoosh" x1="6" y1="48" x2="58" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6B8296" stopOpacity="0.2" />
        <stop offset="45%" stopColor="#E6D6B8" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#FFF7E6" />
      </linearGradient>
    </defs>

    {/* 3D Architectural Window Frame */}
    <path
      d="M14 15L32 9L48 15V47L32 54L14 47V15Z"
      fill="url(#ap-glass)"
      stroke="url(#ap-steel-frame)"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    {/* Left & Right Window Panes */}
    <path d="M18 18L30 14V48L18 44V18Z" fill="#0D2232" stroke="#7A95AB" strokeWidth="1.2" />
    <path d="M33 14L44 18V44L33 48V14Z" fill="#132F44" stroke="#99B5CA" strokeWidth="1.2" />
    {/* Mullion crossbars */}
    <line x1="18" y1="31" x2="30" y2="30" stroke="#7A95AB" strokeWidth="1.2" />
    <line x1="33" y1="30" x2="44" y2="31" stroke="#99B5CA" strokeWidth="1.2" />
    {/* Metallic P/A architectural monogram accent */}
    <path
      d="M35 16H46C51 16 54 19 54 24C54 29 50.5 32.5 45 33.5L36 35V49"
      stroke="url(#ap-metal-gold)"
      strokeWidth="3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Dynamic metallic orbit swoosh */}
    <path
      d="M8 40C15 51 39 50 56 26"
      stroke="url(#ap-swoosh)"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <path
      d="M11 45C22 54 44 50 57 31"
      stroke="#4A6072"
      strokeOpacity="0.7"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 3D Brushed Steel Drafting Set-Square (Escuadra metálica) for Levantamiento Rápido.
 */
export const MetallicSetSquareIcon: React.FC<IconProps> = ({ className = '', size = 50 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="esq-outer" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ECE3D0" />
        <stop offset="30%" stopColor="#9E9484" />
        <stop offset="65%" stopColor="#4A5562" />
        <stop offset="100%" stopColor="#CBB99B" />
      </linearGradient>
      <linearGradient id="esq-face" x1="12" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#727982" />
        <stop offset="45%" stopColor="#3B424B" />
        <stop offset="100%" stopColor="#1E242B" />
      </linearGradient>
    </defs>

    {/* Soft ambient drop shadow */}
    <path d="M12 10L56 54H12V10Z" fill="#000000" fillOpacity="0.45" transform="translate(2,3)" />

    {/* Outer metallic triangle */}
    <path
      d="M11 9L55 53H11V9Z"
      fill="url(#esq-face)"
      stroke="url(#esq-outer)"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Inner cutout triangle */}
    <path
      d="M21 26L38 43H21V26Z"
      fill="#0D161E"
      stroke="#A89A82"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Precision ruler ticks along vertical & bottom edges */}
    <g stroke="#E7D8BE" strokeWidth="1.3" strokeLinecap="round" opacity="0.88">
      <line x1="11.5" y1="18" x2="15" y2="18" />
      <line x1="11.5" y1="24" x2="14" y2="24" />
      <line x1="11.5" y1="30" x2="15.5" y2="30" />
      <line x1="11.5" y1="36" x2="14" y2="36" />
      <line x1="11.5" y1="42" x2="15.5" y2="42" />
      <line x1="11.5" y1="48" x2="14" y2="48" />
      <line x1="18" y1="52.5" x2="18" y2="49" />
      <line x1="24" y1="52.5" x2="24" y2="50" />
      <line x1="30" y1="52.5" x2="30" y2="48.5" />
      <line x1="36" y1="52.5" x2="36" y2="50" />
      <line x1="42" y1="52.5" x2="42" y2="48.5" />
      <line x1="48" y1="52.5" x2="48" y2="50" />
    </g>
    {/* Specular diagonal highlight */}
    <line x1="12.5" y1="10.5" x2="53.5" y2="51.5" stroke="#FFF6E5" strokeOpacity="0.55" strokeWidth="1.1" />
  </svg>
);

/**
 * 3D Beveled Metallic Document Tile for Hoja de Cotización.
 */
export const MetallicQuoteDocIcon: React.FC<IconProps> = ({ className = '', size = 54 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="doc-tile-bg" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#99B0C4" />
        <stop offset="28%" stopColor="#465D70" />
        <stop offset="72%" stopColor="#1B2C3B" />
        <stop offset="100%" stopColor="#5D7488" />
      </linearGradient>
      <linearGradient id="doc-tile-inner" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B5164" />
        <stop offset="50%" stopColor="#1F3140" />
        <stop offset="100%" stopColor="#111E2A" />
      </linearGradient>
      <linearGradient id="doc-sheet" x1="20" y1="14" x2="46" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#DCE8F2" />
        <stop offset="55%" stopColor="#8AA1B5" />
        <stop offset="100%" stopColor="#4D6375" />
      </linearGradient>
    </defs>

    {/* Beveled metallic square tile */}
    <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#doc-tile-bg)" />
    <rect
      x="7"
      y="7"
      width="50"
      height="50"
      rx="11"
      fill="url(#doc-tile-inner)"
      stroke="#B9CFE0"
      strokeOpacity="0.4"
      strokeWidth="1"
    />
    {/* Embossed document icon */}
    <path
      d="M21 15H36L45 24V47C45 48.66 43.66 50 42 50H21C19.34 50 18 48.66 18 47V18C18 16.34 19.34 15 21 15Z"
      fill="#162736"
      stroke="url(#doc-sheet)"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M35.5 15V24.5H45" stroke="#D5E4F0" strokeWidth="2" strokeLinejoin="round" />
    <line x1="24" y1="30" x2="39" y2="30" stroke="#C5D8E8" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="24" y1="36.5" x2="39" y2="36.5" stroke="#9AB2C6" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="24" y1="43" x2="33" y2="43" stroke="#9AB2C6" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/**
 * 3D Metallic Architectural Sliding Window Icon for Ventanas.
 */
export const MetallicWindowIcon: React.FC<IconProps> = ({ className = '', size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="win-metal" x1="6" y1="6" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E6EEF5" />
        <stop offset="40%" stopColor="#8AA0B3" />
        <stop offset="80%" stopColor="#415566" />
        <stop offset="100%" stopColor="#B8CAD8" />
      </linearGradient>
      <linearGradient id="win-pane" x1="10" y1="10" x2="46" y2="46" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#284A63" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#0E2333" stopOpacity="0.92" />
        <stop offset="100%" stopColor="#1B394F" stopOpacity="0.8" />
      </linearGradient>
    </defs>

    {/* Outer sill & frame */}
    <rect x="7" y="8" width="42" height="36" rx="3" fill="url(#win-pane)" stroke="url(#win-metal)" strokeWidth="2.6" />
    {/* Sill ledge */}
    <rect x="4" y="43" width="48" height="4.5" rx="1.8" fill="url(#win-metal)" />
    {/* Left & right sashes */}
    <rect x="11" y="12" width="16.5" height="28" rx="1.2" stroke="#9BB3C7" strokeWidth="1.5" fill="none" />
    <rect x="28.5" y="12" width="16.5" height="28" rx="1.2" stroke="#C5D7E6" strokeWidth="1.5" fill="none" />
    {/* Center interlock stile */}
    <line x1="28" y1="10" x2="28" y2="42" stroke="url(#win-metal)" strokeWidth="2.4" />
    {/* Glass diagonal reflection */}
    <path d="M13 24L22 14M31 28L42 16" stroke="#CFE5F5" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />
    {/* Subtle warm bronze interior plant accent (nod to reference) */}
    <path d="M37 39C37 35 39 33 41 33C41 36 39.5 39 37 39Z" fill="#7FB597" fillOpacity="0.85" />
    <path d="M37 39C37 35.5 35 34 33.5 34.5C34 37 35.5 39 37 39Z" fill="#5D9A7A" fillOpacity="0.85" />
    <rect x="34.5" y="38.5" width="5" height="3.5" rx="0.8" fill="#C9A26B" />
  </svg>
);

/**
 * 3D Metallic Architectural Door Icon for Puertas.
 */
export const MetallicDoorIcon: React.FC<IconProps> = ({ className = '', size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="door-metal" x1="12" y1="6" x2="46" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EBF2F8" />
        <stop offset="45%" stopColor="#859BB0" />
        <stop offset="85%" stopColor="#3B4F60" />
        <stop offset="100%" stopColor="#B8C9D8" />
      </linearGradient>
      <linearGradient id="door-leaf" x1="16" y1="10" x2="40" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2A4458" />
        <stop offset="55%" stopColor="#122434" />
        <stop offset="100%" stopColor="#091620" />
      </linearGradient>
    </defs>

    {/* Outer door jamb frame */}
    <rect x="13" y="6" width="30" height="43" rx="2.5" fill="#0B1924" stroke="url(#door-metal)" strokeWidth="2.6" />
    {/* Floor threshold */}
    <rect x="9" y="48" width="38" height="3.5" rx="1.5" fill="url(#door-metal)" />
    {/* Door leaf */}
    <rect x="17" y="10" width="22" height="37" rx="1.2" fill="url(#door-leaf)" stroke="#9BB3C7" strokeWidth="1.4" />
    {/* Upper & lower architectural panels */}
    <rect x="20.5" y="13.5" width="15" height="14" rx="1" stroke="#7E97AC" strokeWidth="1.2" fill="#173044" fillOpacity="0.6" />
    <rect x="20.5" y="31" width="15" height="12.5" rx="1" stroke="#6E879C" strokeWidth="1.2" fill="#122636" fillOpacity="0.7" />
    {/* Metallic handle & lock cylinder */}
    <circle cx="34.5" cy="29.5" r="2.1" fill="#F0D9B5" stroke="#53687A" strokeWidth="0.8" />
    <line x1="34.5" y1="29.5" x2="30.5" y2="29.5" stroke="#F0D9B5" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/**
 * 3D Metallic Extruded Aluminum Profile Cross-Sections for Catálogo Perfiles.
 */
export const MetallicProfilesIcon: React.FC<IconProps> = ({ className = '', size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="prof-steel" x1="8" y1="6" x2="48" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EFF5FA" />
        <stop offset="45%" stopColor="#8CA2B6" />
        <stop offset="100%" stopColor="#3B4E5F" />
      </linearGradient>
      <linearGradient id="prof-warm" x1="20" y1="10" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EEDEC2" />
        <stop offset="55%" stopColor="#8F9FAD" />
        <stop offset="100%" stopColor="#435666" />
      </linearGradient>
    </defs>

    {/* Left extruded tubular channel */}
    <path
      d="M9 12H23V46H9V12Z"
      fill="#152A3B"
      stroke="url(#prof-steel)"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <rect x="13" y="16" width="6" height="26" rx="0.8" fill="#0B1824" stroke="#7A94A9" strokeWidth="1.2" />

    {/* Center stepped rail section */}
    <path
      d="M23 18H36V46H23V18Z"
      fill="#1A3245"
      stroke="url(#prof-steel)"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <rect x="27" y="23" width="5" height="18" rx="0.6" fill="#0A1722" stroke="#8CA6BC" strokeWidth="1.1" />

    {/* Right angled glazing bead profile */}
    <path
      d="M36 11L47 21V46H36V11Z"
      fill="#1D3342"
      stroke="url(#prof-warm)"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M40 20L43.5 23.5V41H40V20Z" fill="#0D1C29" stroke="#B7C8D6" strokeWidth="1" />
  </svg>
);

/**
 * 3D Metallic Isometric Inventory Crate/Box for Mi Inventario.
 */
export const MetallicInventoryBoxIcon: React.FC<IconProps> = ({ className = '', size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="box-top" x1="10" y1="8" x2="46" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#D7E5F0" />
        <stop offset="55%" stopColor="#6D869B" />
        <stop offset="100%" stopColor="#354B5D" />
      </linearGradient>
      <linearGradient id="box-left" x1="8" y1="20" x2="28" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#324B5E" />
        <stop offset="100%" stopColor="#132433" />
      </linearGradient>
      <linearGradient id="box-right" x1="28" y1="20" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1D3446" />
        <stop offset="100%" stopColor="#0B1824" />
      </linearGradient>
    </defs>

    {/* Top face */}
    <path d="M28 7L47 17.5L28 28L9 17.5L28 7Z" fill="url(#box-top)" stroke="#E3EEF7" strokeWidth="1.8" strokeLinejoin="round" />
    {/* Left face */}
    <path d="M9 17.5L28 28V48.5L9 38V17.5Z" fill="url(#box-left)" stroke="#89A2B8" strokeWidth="1.8" strokeLinejoin="round" />
    {/* Right face */}
    <path d="M47 17.5L28 28V48.5L47 38V17.5Z" fill="url(#box-right)" stroke="#6D869B" strokeWidth="1.8" strokeLinejoin="round" />
    {/* Sealing metallic strap across top and right */}
    <path d="M18.5 12.2L37.5 22.8V30.5" stroke="#F0DCBA" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    {/* Barcode / label notch */}
    <path d="M14 28L22 32.5M14 32.5L20 35.8" stroke="#9CB4C9" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
  </svg>
);

/**
 * 3D Metallic Titanium Floating Robot Assistant (No background circle!)
 * Dark brushed steel/titanium chassis with glowing neon cyan eyes, smile, ears, antenna & chest core.
 */
export const MetallicRobot3D: React.FC<{
  size?: number;
  className?: string;
  compactHeadOnly?: boolean;
}> = ({ size = 76, className = '', compactHeadOnly = false }) => {
  const height = compactHeadOnly ? size : Math.round(size * 1.18);
  return (
    <svg
      width={size}
      height={height}
      viewBox={compactHeadOnly ? '0 0 88 72' : '0 0 88 104'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Brushed titanium head gradient */}
        <linearGradient id="rob-titanium-head" x1="18" y1="12" x2="70" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EFF6FC" />
          <stop offset="22%" stopColor="#B8CAD8" />
          <stop offset="56%" stopColor="#4F6374" />
          <stop offset="86%" stopColor="#202E3B" />
          <stop offset="100%" stopColor="#5D7487" />
        </linearGradient>
        {/* Specular crown highlight */}
        <radialGradient id="rob-crown-shine" cx="38%" cy="22%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
          <stop offset="45%" stopColor="#CBE0F0" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#1B2A38" stopOpacity="0" />
        </radialGradient>
        {/* Glossy obsidian screen visor */}
        <linearGradient id="rob-visor" x1="22" y1="24" x2="66" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0A1929" />
          <stop offset="50%" stopColor="#040D16" />
          <stop offset="100%" stopColor="#0E263A" />
        </linearGradient>
        {/* Metallic ear & body gradients */}
        <linearGradient id="rob-body" x1="22" y1="62" x2="66" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D8E6F2" />
          <stop offset="32%" stopColor="#6E8497" />
          <stop offset="72%" stopColor="#243544" />
          <stop offset="100%" stopColor="#485E70" />
        </linearGradient>
        <linearGradient id="rob-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCE8F2" />
          <stop offset="50%" stopColor="#53687A" />
          <stop offset="100%" stopColor="#1E2C38" />
        </linearGradient>
        {/* Neon cyan glow filter */}
        <filter id="rob-cyan-glow" x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="rob-hover-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.48" />
          <stop offset="55%" stopColor="#020B12" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#020B12" stopOpacity="0" />
        </radialGradient>
      </defs>

      {!compactHeadOnly && (
        <>
          {/* Hover ambient shadow & thruster cyan aura beneath robot */}
          <ellipse cx="44" cy="99" rx="22" ry="4.2" fill="url(#rob-hover-shadow)" />

          {/* Left & Right floating metallic arms */}
          <path
            d="M23 68C16 70 14 78 18.5 84C20.5 86.5 24 85 25.5 81.5"
            fill="url(#rob-ear)"
            stroke="#A4BBD0"
            strokeWidth="1.2"
          />
          <path
            d="M65 68C72 70 74 78 69.5 84C67.5 86.5 64 85 62.5 81.5"
            fill="url(#rob-ear)"
            stroke="#A4BBD0"
            strokeWidth="1.2"
          />

          {/* 3D Titanium Pod Torso */}
          <path
            d="M24 65C24 61 32 59 44 59C56 59 64 61 64 65V75C64 86.5 55.2 94.5 44 94.5C32.8 94.5 24 86.5 24 75V65Z"
            fill="url(#rob-body)"
            stroke="#9EB4C7"
            strokeOpacity="0.7"
            strokeWidth="1.3"
          />
          {/* Dark chest plate recess */}
          <path
            d="M31 68H57V75.5C57 82 51.2 86.5 44 86.5C36.8 86.5 31 82 31 75.5V68Z"
            fill="#0A1926"
            stroke="#4A6072"
            strokeWidth="1"
          />
          {/* Glowing Neon Cyan Chest Arc & Core */}
          <g filter="url(#rob-cyan-glow)" className="robot-cyan-glow-pulse">
            <path
              d="M35.5 74.5C37.5 79 40.5 81 44 81C47.5 81 50.5 79 52.5 74.5"
              stroke="#22D3EE"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="44" cy="73.5" r="2.6" fill="#67E8F9" />
          </g>
          {/* Metallic neck collar */}
          <rect x="35" y="57.5" width="18" height="4.5" rx="2.2" fill="#2A3C4C" stroke="#7A93A8" strokeWidth="0.9" />
        </>
      )}

      {/* Top Antenna */}
      <line x1="44" y1="7" x2="44" y2="17" stroke="#AFC4D6" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="44" cy="6.2" r="3.4" fill="#67E8F9" filter="url(#rob-cyan-glow)" className="robot-cyan-glow-pulse" />
      <circle cx="43.2" cy="5.2" r="1.1" fill="#FFFFFF" />

      {/* Left & Right Metallic Ear Pods with Neon Cyan Accent */}
      <rect x="8.5" y="29" width="7.5" height="17" rx="3.75" fill="url(#rob-ear)" stroke="#9BB3C7" strokeWidth="1" />
      <rect x="72" y="29" width="7.5" height="17" rx="3.75" fill="url(#rob-ear)" stroke="#9BB3C7" strokeWidth="1" />
      <rect x="11" y="33" width="2.2" height="9" rx="1.1" fill="#22D3EE" filter="url(#rob-cyan-glow)" className="robot-cyan-glow-pulse" />
      <rect x="74.8" y="33" width="2.2" height="9" rx="1.1" fill="#22D3EE" filter="url(#rob-cyan-glow)" className="robot-cyan-glow-pulse" />

      {/* Main 3D Rounded Titanium Head */}
      <rect
        x="15"
        y="16"
        width="58"
        height="43"
        rx="18"
        fill="url(#rob-titanium-head)"
        stroke="#C5D8E8"
        strokeOpacity="0.8"
        strokeWidth="1.4"
      />
      <rect x="15" y="16" width="58" height="43" rx="18" fill="url(#rob-crown-shine)" />

      {/* Glossy Dark Visor Faceplate */}
      <rect
        x="21.5"
        y="23"
        width="45"
        height="29.5"
        rx="12.5"
        fill="url(#rob-visor)"
        stroke="#4A6072"
        strokeWidth="1.4"
      />
      {/* Subtle glass reflection arc on top of visor */}
      <path
        d="M27 26.5C34 24.8 54 24.8 61 26.5"
        stroke="#BAE6FD"
        strokeOpacity="0.32"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Glowing Neon Cyan Eyes + Friendly Smile */}
      <g filter="url(#rob-cyan-glow)" className="robot-cyan-glow-pulse">
        <ellipse cx="34.5" cy="36.2" rx="4.2" ry="4.5" fill="#22D3EE" />
        <ellipse cx="53.5" cy="36.2" rx="4.2" ry="4.5" fill="#22D3EE" />
        <path
          d="M37.5 45.2C40.5 47.8 47.5 47.8 50.5 45.2"
          stroke="#38BDF8"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
      </g>
      {/* Crisp white inner catchlights in eyes */}
      <circle cx="35.6" cy="34.8" r="1.4" fill="#FFFFFF" />
      <circle cx="54.6" cy="34.8" r="1.4" fill="#FFFFFF" />
    </svg>
  );
};
