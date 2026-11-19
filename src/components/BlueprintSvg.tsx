import React from 'react';
import {
  COLORES_CONFIG,
  DespieceCalculado,
  getRellenoItem,
  getRellenoLabel,
  LINEAS_CONFIG,
  TrabajoParams,
  VIDRIOS_CONFIG,
} from '../utils/alumineroLogic';

interface Props {
  params: TrabajoParams;
  despiece: DespieceCalculado;
  simProgress: number; // 0..100
}

export const BlueprintSvg: React.FC<Props> = ({ params, despiece, simProgress }) => {
  const colorCfg = COLORES_CONFIG[params.color];
  const vidrioCfg = VIDRIOS_CONFIG[params.vidrio];
  const rellenoItem = params.relleno ? getRellenoItem(params.relleno.materialId, params.vidrio) : null;
  const panelFill = rellenoItem ? rellenoItem.fill : vidrioCfg.fill;
  const panelLabel = params.relleno ? getRellenoLabel(params.relleno, params.vidrio) : vidrioCfg.nombre;
  const lineaCfg = LINEAS_CONFIG[params.linea];
  const esPuerta = lineaCfg.categoria === 'puertas';
  const esMosq = Boolean(lineaCfg.esMosquitero);
  const esCancel = Boolean(lineaCfg.esCancelBano);
  const t = Math.max(0, Math.min(1, simProgress / 100));

  const frameX = 88;
  const frameY = 58;
  const frameW = 284;
  const frameH = esPuerta ? 250 : 230;
  const innerX = frameX + 12;
  const innerY = frameY + 12;
  const innerW = frameW - 24;
  const innerH = frameH - 24;

  const slideOffset =
    params.linea === 'mosq-corredizo'
      ? (params.invertido ? 1 : -1) * t * (frameW * 0.44)
      : (params.invertido ? 1 : -1) * t * (frameW * 0.36);

  const swingScaleX = 1 - t * 0.65;

  const footerText = esMosq
    ? `TELA MOSQUITERA: ${despiece.telaMosquiteraM2.toFixed(2)} m² · COLA DE RATA: ${despiece.colaDeRataM.toFixed(2)} m${
        params.linea === 'mosq-corredizo' ? ` · ${despiece.carretillasMosq} CARRETILLAS` : ''
      }`
    : despiece.vidrios[0]
      ? `${esCancel ? 'CANCEL' : 'RELLENO'} (${panelLabel.toUpperCase()} · ${despiece.vidrios.reduce((s, v) => s + v.pzas, 0)} PZAS): ${despiece.vidrios[0].anchoCm} × ${despiece.vidrios[0].altoCm} cm`
      : '';

  return (
    <svg
      id="plano-svg"
      viewBox="0 0 460 360"
      className="w-full h-auto block select-none"
      role="img"
      aria-label={`Plano técnico de ${lineaCfg.nombre}`}
    >
      <defs>
        <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.6" />
        </pattern>
        <linearGradient id="alum-nat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <pattern id="alum-mad" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#8B5A2B" />
          <path d="M0 3 Q6 2 12 3 M0 8 Q6 9 12 8" stroke="#6D431D" fill="none" />
        </pattern>
        <pattern id="mosq-mesh" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#E2E8F0" fillOpacity="0.35" />
          <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#475569" strokeWidth="0.65" strokeOpacity="0.65" />
          <line x1="0" y1="0" x2="6" y2="6" stroke="#64748B" strokeWidth="0.3" strokeOpacity="0.3" />
        </pattern>
        <linearGradient id="fill-reflecta-ambar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="42%" stopColor="#D97706" />
          <stop offset="56%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="fill-reflecta-verde" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="42%" stopColor="#059669" />
          <stop offset="56%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
        <linearGradient id="fill-reflecta-azul" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BFDBFE" />
          <stop offset="42%" stopColor="#1D4ED8" />
          <stop offset="56%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="fill-espejo-plata" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="35%" stopColor="#94A3B8" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="68%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="fill-espejo-bronce" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="38%" stopColor="#B45309" />
          <stop offset="52%" stopColor="#FFFBEB" />
          <stop offset="72%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="fill-espejo-gris" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="38%" stopColor="#334155" />
          <stop offset="52%" stopColor="#E2E8F0" />
          <stop offset="72%" stopColor="#475569" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <pattern id="fill-esmerilado" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#E2E8F0" />
          <circle cx="2" cy="2" r="0.8" fill="#94A3B8" fillOpacity="0.6" />
          <circle cx="6" cy="6" r="0.8" fill="#94A3B8" fillOpacity="0.6" />
        </pattern>
        <pattern id="fill-acrilico-textura" width="8" height="14" patternUnits="userSpaceOnUse">
          <rect width="8" height="14" fill="#E0F2FE" />
          <ellipse cx="4" cy="4" rx="1.2" ry="2.2" fill="#7DD3FC" fillOpacity="0.7" />
          <ellipse cx="4" cy="11" rx="1.0" ry="1.8" fill="#38BDF8" fillOpacity="0.55" />
        </pattern>
        <pattern id="fill-policarbonato" width="6" height="10" patternUnits="userSpaceOnUse">
          <rect width="6" height="10" fill="#F1F5F9" />
          <line x1="0" y1="0" x2="0" y2="10" stroke="#94A3B8" strokeWidth="1.2" />
          <line x1="3" y1="0" x2="3" y2="10" stroke="#CBD5E1" strokeWidth="0.9" />
        </pattern>
        <pattern id="fill-duela-aluminio" width="20" height="10" patternUnits="userSpaceOnUse">
          <rect width="20" height="10" fill="#CBD5E1" />
          <line x1="0" y1="9" x2="20" y2="9" stroke="#475569" strokeWidth="1.3" />
          <line x1="0" y1="2" x2="20" y2="2" stroke="#F8FAFC" strokeWidth="0.8" />
        </pattern>
      </defs>

      <rect width="460" height="360" fill="url(#cad-grid)" />

      {/* Cota Ancho Superior */}
      <g pointerEvents="none">
        <line x1={frameX} y1={frameY} x2={frameX} y2={20} stroke="#1D4ED8" strokeWidth="0.9" strokeOpacity="0.6" />
        <line x1={frameX + frameW} y1={frameY} x2={frameX + frameW} y2={20} stroke="#1D4ED8" strokeWidth="0.9" strokeOpacity="0.6" />
        <line x1={frameX + 4} y1={24} x2={frameX + frameW - 4} y2={24} stroke="#1D4ED8" strokeWidth="1.3" />
        <rect x={180} y={14} width={100} height={19} rx={4} fill="#FFFFFF" stroke="#1D4ED8" strokeOpacity="0.4" />
        <text x={230} y={27} textAnchor="middle" fill="#1D4ED8" fontSize="11" fontWeight="800" fontFamily="monospace">
          Ancho: {params.anchoCm} cm
        </text>
      </g>

      {/* Cota Alto Izquierda */}
      <g pointerEvents="none">
        <line x1={frameX} y1={frameY} x2={52} y2={frameY} stroke="#1D4ED8" strokeWidth="0.9" strokeOpacity="0.6" />
        <line x1={frameX} y1={frameY + frameH} x2={52} y2={frameY + frameH} stroke="#1D4ED8" strokeWidth="0.9" strokeOpacity="0.6" />
        <line x1={56} y1={frameY + 4} x2={56} y2={frameY + frameH - 4} stroke="#1D4ED8" strokeWidth="1.3" />
        <g transform={`translate(56, ${frameY + frameH / 2}) rotate(-90)`}>
          <rect x={-48} y={-9} width={96} height={18} rx={4} fill="#FFFFFF" stroke="#1D4ED8" strokeOpacity="0.4" />
          <text x={0} y={4} textAnchor="middle" fill="#1D4ED8" fontSize="10.5" fontWeight="800" fontFamily="monospace">
            Alto: {params.altoCm} cm
          </text>
        </g>
      </g>

      {/* ==================== MOSQUITERO FIJO ==================== */}
      {params.linea === 'mosq-fijo' && (
        <g>
          <rect
            x={frameX}
            y={frameY}
            width={frameW}
            height={frameH}
            fill="url(#mosq-mesh)"
            stroke={colorCfg.frameStroke}
            strokeWidth="2"
          />
          <rect x={frameX} y={frameY} width={frameW} height={14} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX} y={frameY + frameH - 14} width={frameW} height={14} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX} y={frameY} width={14} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 14} y={frameY} width={14} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect
            x={frameX + 12}
            y={frameY + 12}
            width={frameW - 24}
            height={frameH - 24}
            fill="none"
            stroke="#0F172A"
            strokeWidth="2.2"
            strokeDasharray="6 3"
          />
          {params.altoCm >= 150 && (
            <rect
              x={frameX + 14}
              y={frameY + frameH / 2 - 4}
              width={frameW - 28}
              height={8}
              fill={colorCfg.frameFill}
              stroke={colorCfg.frameStroke}
            />
          )}
          <rect x={142} y={frameY + frameH / 2 - 16} width={176} height={32} rx={8} fill="rgba(255,255,255,0.92)" stroke="#475569" />
          <text x={230} y={frameY + frameH / 2 + 4} textAnchor="middle" fill="#0F172A" fontSize="11.5" fontWeight="800">
            MALLA FIJA · {colorCfg.corto.toUpperCase()}
          </text>
        </g>
      )}

      {/* ==================== MOSQUITERO CORREDIZO ==================== */}
      {params.linea === 'mosq-corredizo' && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#FFFFFF" stroke="#CBD5E1" />
          <rect x={frameX} y={frameY} width={frameW} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX} y={frameY + frameH - 12} width={frameW} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect
            x={params.invertido ? frameX + 4 : frameX + frameW / 2}
            y={frameY + 14}
            width={frameW / 2 - 4}
            height={frameH - 28}
            fill={panelFill}
            fillOpacity="0.28"
            stroke="#94A3B8"
            strokeDasharray="4 3"
          />
          <g transform={`translate(${slideOffset}, 0)`}>
            <rect
              x={params.invertido ? frameX + frameW / 2 : frameX + 2}
              y={frameY + 10}
              width={frameW / 2 - 2}
              height={frameH - 20}
              fill="url(#mosq-mesh)"
              stroke={colorCfg.frameStroke}
              strokeWidth="8"
            />
            <rect
              x={(params.invertido ? frameX + frameW / 2 : frameX + 2) + 6}
              y={frameY + 16}
              width={frameW / 2 - 14}
              height={frameH - 32}
              fill="none"
              stroke="#0F172A"
              strokeWidth="1.8"
              strokeDasharray="5 2"
            />
            <circle cx={(params.invertido ? frameX + frameW / 2 : frameX + 2) + 22} cy={frameY + frameH - 10} r="5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={(params.invertido ? frameX + frameW / 2 : frameX + 2) + frameW / 2 - 24} cy={frameY + frameH - 10} r="5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={(params.invertido ? frameX + frameW * 0.75 : frameX + frameW * 0.25)} cy={frameY + frameH / 2} r="15" fill="rgba(29,78,216,0.9)" />
            <text x={(params.invertido ? frameX + frameW * 0.75 : frameX + frameW * 0.25)} y={frameY + frameH / 2 + 4} textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="800">
              {params.invertido ? '←' : '→'}
            </text>
          </g>
        </g>
      )}

      {/* ==================== CANCEL PARA BAÑO (ALUMER) ==================== */}
      {esCancel && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#F8FAFC" />
          {/* Riel Superior 11174 */}
          <rect x={frameX} y={frameY} width={frameW} height={16} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          {/* Guía Inferior 11387 */}
          <rect x={frameX} y={frameY + frameH - 10} width={frameW} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          {/* Jambas Laterales 11386 */}
          <rect x={frameX} y={frameY} width={10} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 10} y={frameY} width={10} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />

          {/* Hoja fija baño */}
          <rect
            x={params.invertido ? frameX + frameW / 2 : frameX + 10}
            y={frameY + 16}
            width={frameW / 2 - 10}
            height={frameH - 26}
            fill={panelFill}
            fillOpacity="0.45"
            stroke={colorCfg.frameStroke}
            strokeWidth="5"
          />
          {/* Hoja corrediza colgante baño */}
          <g transform={`translate(${slideOffset * 0.85}, 0)`}>
            <rect
              x={params.invertido ? frameX + 10 : frameX + frameW / 2 - 6}
              y={frameY + 16}
              width={frameW / 2 - 4}
              height={frameH - 26}
              fill={panelFill}
              fillOpacity="0.58"
              stroke={colorCfg.frameStroke}
              strokeWidth="6"
            />
            {/* 2 Carretillas colgantes arriba */}
            <circle cx={(params.invertido ? frameX + 34 : frameX + frameW / 2 + 18)} cy={frameY + 10} r="4.5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.5" />
            <circle cx={(params.invertido ? frameX + frameW / 2 - 18 : frameX + frameW - 26)} cy={frameY + 10} r="4.5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.5" />
            {/* Toallero / Jaladera */}
            <rect
              x={(params.invertido ? frameX + 30 : frameX + frameW / 2 + 16)}
              y={frameY + frameH * 0.48}
              width={frameW / 2 - 48}
              height={6}
              rx={3}
              fill="#475569"
            />
            <circle
              cx={(params.invertido ? frameX + frameW * 0.27 : frameX + frameW * 0.73)}
              cy={frameY + frameH * 0.34}
              r="14"
              fill="rgba(29,78,216,0.9)"
            />
            <text
              x={(params.invertido ? frameX + frameW * 0.27 : frameX + frameW * 0.73)}
              y={frameY + frameH * 0.34 + 4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="13"
              fontWeight="800"
            >
              {params.invertido ? '→' : '←'}
            </text>
          </g>
        </g>
      )}

      {/* ==================== PUERTAS ==================== */}
      {esPuerta && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#F8FAFC" />
          <rect x={frameX} y={frameY} width={14} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 14} y={frameY} width={14} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX} y={frameY} width={frameW} height={14} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />

          <g
            transform={
              params.sentidoPuerta === 'izq'
                ? `translate(${frameX + 14}, 0) scale(${swingScaleX}, 1) translate(${-(frameX + 14)}, 0)`
                : `translate(${frameX + frameW - 14}, 0) scale(${swingScaleX}, 1) translate(${-(frameX + frameW - 14)}, 0)`
            }
          >
            <rect
              x={frameX + 14}
              y={frameY + 14}
              width={frameW - 28}
              height={frameH - 16}
              fill={panelFill}
              fillOpacity="0.42"
              stroke={colorCfg.frameStroke}
              strokeWidth="10"
            />
            {params.puertaIntermedio && (
              <rect
                x={frameX + 14}
                y={frameY + frameH * 0.52}
                width={frameW - 28}
                height={14}
                fill={colorCfg.frameFill}
                stroke={colorCfg.frameStroke}
              />
            )}
            <rect
              x={frameX + 14}
              y={frameY + frameH - (params.puertaEconomica ? 18 : 26)}
              width={frameW - 28}
              height={params.puertaEconomica ? 16 : 24}
              fill={colorCfg.frameFill}
              stroke={colorCfg.frameStroke}
            />
            <polyline
              points={
                params.sentidoPuerta === 'izq'
                  ? `${frameX + 14},${frameY + 14} ${frameX + frameW - 14},${frameY + frameH / 2} ${frameX + 14},${frameY + frameH}`
                  : `${frameX + frameW - 14},${frameY + 14} ${frameX + 14},${frameY + frameH / 2} ${frameX + frameW - 14},${frameY + frameH}`
              }
              fill="none"
              stroke="#1D4ED8"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <rect
              x={params.sentidoPuerta === 'izq' ? frameX + frameW - 34 : frameX + 24}
              y={frameY + frameH * 0.46}
              width={10}
              height={24}
              rx={3}
              fill="#0F172A"
            />
          </g>

          {[0.18, 0.5, 0.84].map((ratio, idx) => (
            <rect
              key={idx}
              x={params.sentidoPuerta === 'izq' ? frameX + 9 : frameX + frameW - 19}
              y={frameY + frameH * ratio - 8}
              width={10}
              height={16}
              rx={2}
              fill="#1D4ED8"
            />
          ))}

          {params.linea === 'puerta-europea' && (
            <g>
              <rect x={frameX + 36} y={frameY + 26} width={212} height={24} rx={6} fill="rgba(15,23,42,0.85)" />
              <text x={frameX + 142} y={frameY + 42} textAnchor="middle" fill="#FDE68A" fontSize="10.5" fontWeight="800">
                6 Escuadras (4 Hoja 45° + 2 Marco Sup.)
              </text>
            </g>
          )}
        </g>
      )}

      {/* ==================== VENTANA FIJA (FIJO 3" ALUMER) ==================== */}
      {!esPuerta && !esMosq && !esCancel && params.apertura === 'fija' && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#FFFFFF" />
          <rect
            x={innerX}
            y={innerY}
            width={innerW}
            height={innerH}
            fill={panelFill}
            fillOpacity="0.48"
            stroke={colorCfg.frameStroke}
            strokeWidth="2"
          />
          {/* Junquillo perimetral 9112 */}
          <rect
            x={innerX + 5}
            y={innerY + 5}
            width={innerW - 10}
            height={innerH - 10}
            fill="none"
            stroke={colorCfg.frameStroke}
            strokeWidth="1.5"
          />
          {params.anchoCm > 160 && (
            <rect
              x={frameX + frameW / 2 - 5}
              y={innerY}
              width={10}
              height={innerH}
              fill={colorCfg.frameFill}
              stroke={colorCfg.frameStroke}
            />
          )}
          <line x1={innerX + 20} y1={innerY + innerH - 26} x2={innerX + 74} y2={innerY + 24} stroke="#FFFFFF" strokeWidth="2.4" strokeOpacity="0.75" />
          <line x1={innerX + 36} y1={innerY + innerH - 20} x2={innerX + 86} y2={innerY + 34} stroke="#FFFFFF" strokeWidth="1.6" strokeOpacity="0.55" />

          {/* Marco Bolsa 9135 / 10235 */}
          <rect x={frameX} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 12} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY + frameH - 12} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />

          <circle cx={frameX + frameW / 2} cy={frameY + frameH / 2} r="17" fill="rgba(255,255,255,0.92)" stroke="#64748B" />
          <text x={frameX + frameW / 2} y={frameY + frameH / 2 + 5} textAnchor="middle" fill="#0F172A" fontSize="14" fontWeight="800">
            F
          </text>
        </g>
      )}

      {/* ==================== VENTANA GUILLOTINA (DESLIZAMIENTO VERTICAL) ==================== */}
      {!esPuerta && !esMosq && !esCancel && params.apertura === 'guillotina' && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#FFFFFF" />
          {(() => {
            const sashH = innerH / 2 + 6;
            const slideY = -t * (innerH * 0.42);
            return (
              <>
                {/* Hoja Superior Fija */}
                <g>
                  <rect x={innerX} y={innerY} width={innerW} height={sashH} fill={panelFill} fillOpacity="0.45" stroke={colorCfg.frameStroke} strokeWidth="2" />
                  <rect x={innerX} y={innerY} width={innerW} height={9} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={innerX} y={innerY + sashH - 9} width={innerW} height={9} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={innerX} y={innerY} width={8} height={sashH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={innerX + innerW - 8} y={innerY} width={8} height={sashH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <circle cx={frameX + frameW / 2} cy={innerY + sashH / 2} r="12" fill="rgba(255,255,255,0.9)" stroke="#64748B" />
                  <text x={frameX + frameW / 2} y={innerY + sashH / 2 + 4} textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="800">F</text>
                </g>

                {/* Hoja Inferior Móvil Vertical */}
                <g transform={`translate(0, ${slideY})`}>
                  <rect x={innerX + 2} y={innerY + innerH - sashH} width={innerW - 4} height={sashH} fill={panelFill} fillOpacity="0.58" stroke={colorCfg.frameStroke} strokeWidth="2" />
                  <rect x={innerX + 2} y={innerY + innerH - sashH} width={innerW - 4} height={9} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={innerX + 2} y={innerY + innerH - 10} width={innerW - 4} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={innerX + 2} y={innerY + innerH - sashH} width={8} height={sashH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={innerX + innerW - 10} y={innerY + innerH - sashH} width={8} height={sashH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <circle cx={frameX + frameW / 2} cy={innerY + innerH - sashH / 2} r="14" fill="rgba(29,78,216,0.9)" />
                  <text x={frameX + frameW / 2} y={innerY + innerH - sashH / 2 + 5} textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="800">
                    ↑
                  </text>
                </g>
              </>
            );
          })()}
          <rect x={frameX} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 12} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY + frameH - 12} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
        </g>
      )}

      {/* ==================== ABATIBLE VERTICAL Y OSCILOBATIENTE ==================== */}
      {!esPuerta && !esMosq && !esCancel && (params.apertura === 'abatible' || params.apertura === 'oscilobatiente') && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#FFFFFF" />
          {(() => {
            const numHojas = Math.max(1, Math.min(2, params.hojas >= 2 ? 2 : 1));
            const leafW = innerW / numHojas;
            const isOsc = params.apertura === 'oscilobatiente';
            const turnT = isOsc ? Math.max(0, (t - 0.5) * 2) : t;
            const tiltT = isOsc ? Math.min(1, t * 2) * (1 - turnT) : 0;

            return Array.from({ length: numHojas }).map((_, idx) => {
              const x = innerX + idx * leafW;
              const hingeLeft = idx === 0 ? !params.invertido : false;
              const pivotX = hingeLeft ? x : x + leafW;
              const sx = 1 - turnT * 0.58;
              const sy = 1 - tiltT * 0.14;
              const dyTilt = tiltT * 10;

              return (
                <g
                  key={idx}
                  transform={`translate(${pivotX}, ${innerY + innerH}) scale(${sx}, ${sy}) translate(${-pivotX}, ${-(innerY + innerH - dyTilt)})`}
                >
                  <rect
                    x={x}
                    y={innerY}
                    width={leafW}
                    height={innerH}
                    fill={panelFill}
                    fillOpacity="0.48"
                    stroke={colorCfg.frameStroke}
                    strokeWidth="2"
                  />
                  {/* Marco hoja */}
                  <rect x={x} y={innerY} width={leafW} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={x} y={innerY + innerH - 10} width={leafW} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={x} y={innerY} width={8} height={innerH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={x + leafW - 8} y={innerY} width={8} height={innerH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />

                  {/* Triángulo punteado apertura lateral */}
                  <polyline
                    points={
                      hingeLeft
                        ? `${x + 8},${innerY + 10} ${x + leafW - 8},${innerY + innerH / 2} ${x + 8},${innerY + innerH - 10}`
                        : `${x + leafW - 8},${innerY + 10} ${x + 8},${innerY + innerH / 2} ${x + leafW - 8},${innerY + innerH - 10}`
                    }
                    fill="none"
                    stroke="#1D4ED8"
                    strokeWidth="1.6"
                    strokeDasharray="5 4"
                  />
                  {/* V punteada inclinación si es oscilobatiente */}
                  {isOsc && (
                    <polyline
                      points={`${x + 8},${innerY + innerH - 10} ${x + leafW / 2},${innerY + 10} ${x + leafW - 8},${innerY + innerH - 10}`}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="1.6"
                      strokeDasharray="4 3"
                    />
                  )}
                  {/* Manija */}
                  <rect
                    x={hingeLeft ? x + leafW - 14 : x + 6}
                    y={innerY + innerH / 2 - 12}
                    width={8}
                    height={24}
                    rx={2}
                    fill="#0F172A"
                  />
                </g>
              );
            });
          })()}

          <rect x={frameX} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 12} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY + frameH - 12} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
        </g>
      )}

      {/* ==================== BANDEROLA (PROYECCIÓN INCLINADA) ==================== */}
      {!esPuerta && !esMosq && !esCancel && params.apertura === 'banderola' && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#FFFFFF" />
          <g transform={`translate(0, ${innerY}) scale(1, ${1 - t * 0.28}) translate(0, ${-innerY})`}>
            <rect
              x={innerX}
              y={innerY}
              width={innerW}
              height={innerH}
              fill={panelFill}
              fillOpacity="0.52"
              stroke={colorCfg.frameStroke}
              strokeWidth="2"
            />
            <rect x={innerX} y={innerY} width={innerW} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
            <rect x={innerX} y={innerY + innerH - 10} width={innerW} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
            <rect x={innerX} y={innerY} width={8} height={innerH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
            <rect x={innerX + innerW - 8} y={innerY} width={8} height={innerH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />

            {/* Líneas V de proyección */}
            <polyline
              points={`${innerX + 10},${innerY + 10} ${frameX + frameW / 2},${innerY + innerH - 10} ${innerX + innerW - 10},${innerY + 10}`}
              fill="none"
              stroke="#1D4ED8"
              strokeWidth="1.7"
              strokeDasharray="5 4"
            />
            {/* Manija inferior */}
            <rect x={frameX + frameW / 2 - 14} y={innerY + innerH - 16} width={28} height={7} rx={2} fill="#0F172A" />
          </g>

          <rect x={frameX} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 12} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY + frameH - 12} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
        </g>
      )}

      {/* ==================== PLEGABLE / TIPO LIBRO ==================== */}
      {!esPuerta && !esMosq && !esCancel && params.apertura === 'plegable' && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#FFFFFF" />
          {(() => {
            const numHojas = Math.max(2, Math.min(4, params.hojas || 3));
            const leafW = innerW / numHojas;
            const foldScale = 1 - t * 0.68;

            return Array.from({ length: numHojas }).map((_, idx) => {
              const foldedLeafW = leafW * foldScale;
              const startX = params.invertido
                ? innerX + innerW - (numHojas - idx) * foldedLeafW
                : innerX + idx * foldedLeafW;

              return (
                <g key={idx}>
                  <rect
                    x={startX}
                    y={innerY}
                    width={foldedLeafW}
                    height={innerH}
                    fill={panelFill}
                    fillOpacity="0.48"
                    stroke={colorCfg.frameStroke}
                    strokeWidth="2"
                  />
                  <rect x={startX} y={innerY} width={foldedLeafW} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={startX} y={innerY + innerH - 10} width={foldedLeafW} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={startX} y={innerY} width={6} height={innerH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={startX + foldedLeafW - 6} y={innerY} width={6} height={innerH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  {/* Bisagra libro entre hojas */}
                  {idx > 0 && (
                    <circle cx={startX} cy={innerY + innerH * 0.5} r="4.5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.2" />
                  )}
                  <polyline
                    points={`${startX + 6},${innerY + 12} ${startX + foldedLeafW / 2},${innerY + innerH / 2} ${startX + 6},${innerY + innerH - 12}`}
                    fill="none"
                    stroke="#1D4ED8"
                    strokeWidth="1.3"
                    strokeDasharray="4 3"
                  />
                </g>
              );
            });
          })()}

          <rect x={frameX} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 12} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY + frameH - 12} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
        </g>
      )}

      {/* ==================== VENTANA CORREDIZA ESTÁNDAR ==================== */}
      {!esPuerta && !esMosq && !esCancel && params.apertura === 'corrediza' && (
        <g>
          <rect x={frameX} y={frameY} width={frameW} height={frameH} fill="#FFFFFF" />
          {(() => {
            const numHojas = Math.max(2, Math.min(4, params.hojas || 2));
            const leafW = innerW / numHojas;

            return Array.from({ length: numHojas }).map((_, idx) => {
              const x = innerX + idx * leafW;
              const isMovil =
                (numHojas === 2 && (params.invertido ? idx === 0 : idx === 1)) ||
                (numHojas === 3 && idx === 1) ||
                (numHojas === 4 && (idx === 1 || idx === 2));
              const tx = isMovil ? slideOffset * (idx === 2 ? -0.6 : 0.6) : 0;

              return (
                <g key={idx} transform={`translate(${tx}, 0)`}>
                  <rect
                    x={x}
                    y={innerY}
                    width={leafW}
                    height={innerH}
                    fill={panelFill}
                    fillOpacity="0.48"
                    stroke={colorCfg.frameStroke}
                    strokeWidth="2"
                  />
                  <line
                    x1={x + 14}
                    y1={innerY + innerH - 28}
                    x2={x + Math.min(leafW - 14, 52)}
                    y2={innerY + 24}
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeOpacity="0.7"
                  />
                  <rect x={x} y={innerY} width={leafW} height={10} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={x} y={innerY + innerH - 12} width={leafW} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={x} y={innerY} width={8} height={innerH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
                  <rect x={x + leafW - 8} y={innerY} width={8} height={innerH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />

                  <circle
                    cx={x + leafW / 2}
                    cy={innerY + innerH / 2}
                    r="14"
                    fill={isMovil ? 'rgba(29,78,216,0.9)' : 'rgba(255,255,255,0.9)'}
                    stroke="#64748B"
                  />
                  <text
                    x={x + leafW / 2}
                    y={innerY + innerH / 2 + 5}
                    textAnchor="middle"
                    fill={isMovil ? '#FFFFFF' : '#0F172A'}
                    fontSize="13"
                    fontWeight="800"
                  >
                    {isMovil ? (params.invertido ? '→' : '←') : 'F'}
                  </text>
                </g>
              );
            });
          })()}

          <rect x={frameX} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + frameW - 12} y={frameY} width={12} height={frameH} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
          <rect x={frameX + 12} y={frameY + frameH - 12} width={frameW - 24} height={12} fill={colorCfg.frameFill} stroke={colorCfg.frameStroke} />
        </g>
      )}

      {/* Pie del plano */}
      <text x={230} y={340} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="700" fontFamily="monospace">
        {footerText}
      </text>
    </svg>
  );
};
