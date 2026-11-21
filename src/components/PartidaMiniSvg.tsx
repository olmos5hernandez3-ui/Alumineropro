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
      ) : partida.apertura === 'fija' || partida.linea === 'mosq-fijo' ? (
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
            points={
              partida.invertido
                ? `${innerX + innerW},${innerY} ${innerX},${innerY + innerH / 2} ${innerX + innerW},${innerY + innerH}`
                : `${innerX},${innerY} ${innerX + innerW},${innerY + innerH / 2} ${innerX},${innerY + innerH}`
            }
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
          <circle
            cx={partida.invertido ? innerX + 4.5 : innerX + innerW - 4.5}
            cy={innerY + innerH / 2}
            r="1.7"
            fill="#0F172A"
          />
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
          <text
            x={innerX + innerW / 2}
            y={innerY + innerH * 0.28}
            textAnchor="middle"
            fill="#1E40AF"
            fontSize="6.5"
            fontWeight="700"
          >
            F
          </text>
          <path
            d={`M ${innerX + innerW / 2} ${innerY + innerH * 0.85} V ${innerY + innerH * 0.6}`}
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
      ) : partida.apertura === 'plegable' ? (
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
          {Array.from({ length: hojas }).map((_, i) => {
            const cellW = innerW / hojas;
            const cx1 = innerX + cellW * i + 2;
            const cx2 = innerX + cellW * (i + 1) - 2;
            const mid = (cx1 + cx2) / 2;
            const apexY = i % 2 === 0 ? innerY + innerH * 0.34 : innerY + innerH * 0.66;
            return (
              <polyline
                key={i}
                points={`${cx1},${innerY + innerH / 2} ${mid},${apexY} ${cx2},${innerY + innerH / 2}`}
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="1.2"
                strokeDasharray="2.5 2"
              />
            );
          })}
        </g>
      ) : (
        /* Corrediza / Cancel por número de hojas */
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
          {Array.from({ length: hojas }).map((_, i) => {
            const cellW = innerW / hojas;
            const cellX = innerX + cellW * i;
            const cy = innerY + innerH / 2;
            const padX = Math.max(3, cellW * 0.22);

            let mode: 'fixed' | 'left' | 'right' = 'fixed';
            if (hojas === 2) {
              mode = partida.invertido ? (i === 0 ? 'right' : 'fixed') : (i === 0 ? 'fixed' : 'left');
            } else if (hojas === 3) {
              if (partida.invertido) {
                mode = i === 0 ? 'right' : i === 2 ? 'left' : 'fixed';
              } else {
                mode = i === 1 ? 'right' : 'fixed';
              }
            } else {
              if (partida.invertido) {
                mode = i === 0 ? 'right' : i === hojas - 1 ? 'left' : 'fixed';
              } else {
                mode = i === 1 ? 'left' : i === 2 ? 'right' : 'fixed';
              }
            }

            if (mode === 'fixed') {
              return (
                <text
                  key={i}
                  x={cellX + cellW / 2}
                  y={cy + 2.5}
                  textAnchor="middle"
                  fill="#1E40AF"
                  fontSize="7"
                  fontWeight="700"
                >
                  F
                </text>
              );
            }
            const xLeft = cellX + padX;
            const xRight = cellX + cellW - padX;
            return (
              <g key={i} stroke="#1D4ED8" strokeWidth="1.4" strokeLinecap="round" fill="none">
                <line x1={xLeft} y1={cy} x2={xRight} y2={cy} />
                {mode === 'left' ? (
                  <polyline points={`${xLeft + 3.5},${cy - 2.8} ${xLeft},${cy} ${xLeft + 3.5},${cy + 2.8}`} />
                ) : (
                  <polyline points={`${xRight - 3.5},${cy - 2.8} ${xRight},${cy} ${xRight - 3.5},${cy + 2.8}`} />
                )}
              </g>
            );
          })}
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
