import React from 'react';
import { COLORES_CONFIG, getRellenoItem, LINEAS_CONFIG, PartidaObra, VIDRIOS_CONFIG } from '../utils/alumineroLogic';

interface PartidaMiniSvgProps {
  partida: PartidaObra;
  width?: number;
  height?: number;
}

export const PartidaMiniSvg: React.FC<PartidaMiniSvgProps> = ({
  partida,
  width = 112,
  height = 84,
}) => {
  const linea = LINEAS_CONFIG[partida.linea];
  const colorCfg = COLORES_CONFIG[partida.color];
  const rellenoCfg = partida.relleno ? getRellenoItem(partida.relleno.materialId, partida.vidrio) : null;
  const interiorFill = isMosqPlaceholder(Boolean(linea?.esMosquitero))
    ? '#F1F5F9'
    : rellenoCfg?.categoria === 'duela'
      ? '#CBD5E1'
      : rellenoCfg?.categoria === 'espejo'
        ? '#E2E8F0'
        : rellenoCfg?.fill.startsWith('url(')
          ? '#BAE6FD'
          : rellenoCfg?.fill || VIDRIOS_CONFIG[partida.vidrio]?.fill || '#DBEAFE';
  function isMosqPlaceholder(flag: boolean): boolean {
    return flag;
  }
  const isDoor = partida.categoria === 'puertas' || Boolean(linea?.esCancelBano);
  const isMosq = Boolean(linea?.esMosquitero);
  const hojas = Math.max(1, Math.min(4, Number(partida.hojas) || (partida.apertura === 'fija' ? 1 : 2)));

  // Aspect proportional box inside viewBox (140 x 105) with space for dimension callouts
  const maxBoxW = 92;
  const maxBoxH = 66;
  const ratio = Math.max(0.45, Math.min(2.2, (partida.anchoCm || 120) / Math.max(20, partida.altoCm || 100)));
  let drawW = maxBoxW;
  let drawH = drawW / ratio;
  if (drawH > maxBoxH) {
    drawH = maxBoxH;
    drawW = drawH * ratio;
  }

  const originX = 16 + (maxBoxW - drawW) / 2;
  const originY = 12 + (maxBoxH - drawH) / 2;
  const frameStroke = partida.color === 'natural' ? '#475569' : partida.color === 'blanco' ? '#64748B' : colorCfg.frameStroke;
  const innerPad = 4;
  const innerX = originX + innerPad;
  const innerY = originY + innerPad;
  const innerW = Math.max(16, drawW - innerPad * 2);
  const innerH = Math.max(16, drawH - innerPad * 2);

  return (
    <svg
      viewBox="0 0 140 105"
      width={width}
      height={height}
      className="block rounded-lg border border-slate-200 bg-white shrink-0"
      aria-label={`Plano ${partida.anchoCm} por ${partida.altoCm} cm`}
    >
      <rect x="0" y="0" width="140" height="105" fill="#FFFFFF" />

      {/* Marco exterior */}
      <rect
        x={originX}
        y={originY}
        width={drawW}
        height={drawH}
        rx="1.5"
        fill="#E2E8F0"
        stroke={frameStroke}
        strokeWidth="2.2"
      />

      {/* Interior vidrio / relleno / malla */}
      <rect
        x={innerX}
        y={innerY}
        width={innerW}
        height={innerH}
        fill={interiorFill}
        stroke={frameStroke}
        strokeWidth="1"
      />

      {/* Malla mosquitera */}
      {isMosq && (
        <g stroke="#94A3B8" strokeWidth="0.6" opacity="0.7">
          <line x1={innerX} y1={innerY + innerH * 0.33} x2={innerX + innerW} y2={innerY + innerH * 0.33} />
          <line x1={innerX} y1={innerY + innerH * 0.66} x2={innerX + innerW} y2={innerY + innerH * 0.66} />
          <line x1={innerX + innerW * 0.33} y1={innerY} x2={innerX + innerW * 0.33} y2={innerY + innerH} />
          <line x1={innerX + innerW * 0.66} y1={innerY} x2={innerX + innerW * 0.66} y2={innerY + innerH} />
        </g>
      )}

      {/* Puerta / Cancel o Ventanas según apertura */}
      {isDoor && !linea?.esCancelBano ? (
        <g>
          {partida.puertaIntermedio && (
            <line
              x1={innerX}
              y1={innerY + innerH * 0.62}
              x2={innerX + innerW}
              y2={innerY + innerH * 0.62}
              stroke={frameStroke}
              strokeWidth="2"
            />
          )}
          <polyline
            points={
              partida.sentidoPuerta === 'der'
                ? `${innerX + innerW},${innerY} ${innerX},${innerY + innerH / 2} ${innerX + innerW},${innerY + innerH}`
                : `${innerX},${innerY} ${innerX + innerW},${innerY + innerH / 2} ${innerX},${innerY + innerH}`
            }
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="1.2"
            strokeDasharray="3 2.5"
          />
          <circle
            cx={partida.sentidoPuerta === 'der' ? innerX + 5 : innerX + innerW - 5}
            cy={innerY + innerH * 0.52}
            r="2"
            fill="#0F172A"
          />
        </g>
      ) : partida.apertura === 'fija' ? (
        <g>
          <line
            x1={innerX + 4}
            y1={innerY + 4}
            x2={innerX + 12}
            y2={innerY + 12}
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />
          <text
            x={innerX + innerW / 2}
            y={innerY + innerH / 2 + 3}
            textAnchor="middle"
            fill="#1E40AF"
            fontSize="8"
            fontWeight="700"
          >
            FIJO
          </text>
        </g>
      ) : partida.apertura === 'abatible' || partida.apertura === 'oscilobatiente' ? (
        <g>
          <polyline
            points={`${innerX},${innerY} ${innerX + innerW},${innerY + innerH / 2} ${innerX},${innerY + innerH}`}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="1.2"
            strokeDasharray="3 2.5"
          />
          {partida.apertura === 'oscilobatiente' && (
            <polyline
              points={`${innerX},${innerY + innerH} ${innerX + innerW / 2},${innerY} ${innerX + innerW},${innerY + innerH}`}
              fill="none"
              stroke="#0284C7"
              strokeWidth="1.1"
              strokeDasharray="2.5 2.5"
            />
          )}
        </g>
      ) : partida.apertura === 'banderola' ? (
        <polyline
          points={`${innerX},${innerY} ${innerX + innerW / 2},${innerY + innerH} ${innerX + innerW},${innerY}`}
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="1.2"
          strokeDasharray="3 2.5"
        />
      ) : partida.apertura === 'guillotina' ? (
        <g>
          <line
            x1={innerX}
            y1={innerY + innerH / 2}
            x2={innerX + innerW}
            y2={innerY + innerH / 2}
            stroke={frameStroke}
            strokeWidth="1.8"
          />
          <path
            d={`M ${innerX + innerW / 2} ${innerY + innerH * 0.82} V ${innerY + innerH * 0.6}`}
            stroke="#1D4ED8"
            strokeWidth="1.5"
          />
          <polyline
            points={`${innerX + innerW / 2 - 3},${innerY + innerH * 0.65} ${innerX + innerW / 2},${innerY + innerH * 0.59} ${innerX + innerW / 2 + 3},${innerY + innerH * 0.65}`}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="1.4"
          />
        </g>
      ) : (
        /* Corrediza / Cancel / Plegable por número de hojas */
        <g>
          {Array.from({ length: Math.max(1, hojas - 1) }).map((_, i) => {
            const lx = innerX + (innerW / hojas) * (i + 1);
            return (
              <line
                key={i}
                x1={lx}
                y1={innerY}
                x2={lx}
                y2={innerY + innerH}
                stroke={frameStroke}
                strokeWidth="1.8"
              />
            );
          })}
          {/* Flecha corrediza */}
          <path
            d={`M ${innerX + innerW * 0.62} ${innerY + innerH / 2} H ${innerX + innerW * 0.85}`}
            stroke="#1D4ED8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <polyline
            points={`${innerX + innerW * 0.67},${innerY + innerH / 2 - 3} ${innerX + innerW * 0.61},${innerY + innerH / 2} ${innerX + innerW * 0.67},${innerY + innerH / 2 + 3}`}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="1.3"
          />
        </g>
      )}

      {/* Cota Ancho inferior */}
      <line
        x1={originX}
        y1={originY + drawH + 8}
        x2={originX + drawW}
        y2={originY + drawH + 8}
        stroke="#0F172A"
        strokeWidth="0.9"
      />
      <line x1={originX} y1={originY + drawH + 5} x2={originX} y2={originY + drawH + 11} stroke="#0F172A" strokeWidth="0.9" />
      <line x1={originX + drawW} y1={originY + drawH + 5} x2={originX + drawW} y2={originY + drawH + 11} stroke="#0F172A" strokeWidth="0.9" />
      <text
        x={originX + drawW / 2}
        y={originY + drawH + 18}
        textAnchor="middle"
        fill="#0F172A"
        fontSize="8.5"
        fontWeight="700"
      >
        {partida.anchoCm} cm
      </text>

      {/* Cota Alto derecha */}
      <line
        x1={originX + drawW + 7}
        y1={originY}
        x2={originX + drawW + 7}
        y2={originY + drawH}
        stroke="#0F172A"
        strokeWidth="0.9"
      />
      <line x1={originX + drawW + 4} y1={originY} x2={originX + drawW + 10} y2={originY} stroke="#0F172A" strokeWidth="0.9" />
      <line x1={originX + drawW + 4} y1={originY + drawH} x2={originX + drawW + 10} y2={originY + drawH} stroke="#0F172A" strokeWidth="0.9" />
      <text
        x={originX + drawW + 19}
        y={originY + drawH / 2 + 3}
        textAnchor="middle"
        fill="#0F172A"
        fontSize="8"
        fontWeight="700"
        transform={`rotate(-90 ${originX + drawW + 19} ${originY + drawH / 2 + 3})`}
      >
        {partida.altoCm} cm
      </text>
    </svg>
  );
};
