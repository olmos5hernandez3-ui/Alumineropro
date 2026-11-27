import React from 'react';
import { LevantamientoUnidad } from '../utils/levantamientoLogic';
import { formatCotaMedida, parseHojasBlueprint } from '../utils/levantamientoSelection';

interface DigitalWindowDrawingSvgProps {
  anchoCm: number;
  altoCm: number;
  unit?: LevantamientoUnidad;
  hojas?: string;
  tipo?: string;
  selected?: boolean;
  compact?: boolean;
}

/**
 * Dibujo técnico digitalizado (plano arquitectónico SVG limpio)
 * con marco, divisiones de hojas (O fija / X corrediza con flecha → o ← / abatible)
 * y cotas de medidas exactas (Ancho en la base, Alto en el costado derecho).
 */
export const DigitalWindowDrawingSvg: React.FC<DigitalWindowDrawingSvgProps> = ({
  anchoCm,
  altoCm,
  unit = 'cm',
  hojas,
  tipo,
  selected = false,
  compact = false,
}) => {
  const leaves = parseHojasBlueprint(hojas, tipo);
  const leafCount = Math.max(1, leaves.length);

  // Dimensiones del lienzo SVG (con espacio limpio para cota inferior y cota derecha)
  const vbW = 240;
  const vbH = 156;
  const padLeft = 14;
  const padTop = 12;
  const padRight = 64;
  const padBottom = 34;

  const maxFrameW = vbW - padLeft - padRight;
  const maxFrameH = vbH - padTop - padBottom;

  // Proporción real acotada para que siempre se lea nítido sin verse aplastado
  const safeW = Math.max(20, anchoCm || 120);
  const safeH = Math.max(20, altoCm || 120);
  const ratio = Math.max(0.55, Math.min(2.1, safeW / safeH));

  let frameW = maxFrameW;
  let frameH = frameW / ratio;
  if (frameH > maxFrameH) {
    frameH = maxFrameH;
    frameW = frameH * ratio;
  }

  const fx = Math.round(padLeft + (maxFrameW - frameW) / 2);
  const fy = Math.round(padTop + (maxFrameH - frameH) / 2);
  const fw = Math.round(frameW);
  const fh = Math.round(frameH);

  const innerInset = 5;
  const ix = fx + innerInset;
  const iy = fy + innerInset;
  const iw = Math.max(24, fw - innerInset * 2);
  const ih = Math.max(24, fh - innerInset * 2);
  const leafW = iw / leafCount;

  const anchoLabel = formatCotaMedida(anchoCm, unit);
  const altoLabel = formatCotaMedida(altoCm, unit);

  const strokeFrame = selected ? '#0284c7' : '#334155';
  const strokeDim = '#0369a1';
  const dimBottomY = fy + fh + 16;
  const dimRightX = fx + fw + 14;

  return (
    <div
      data-preserve-light="true"
      className={`rounded-xl border overflow-hidden select-none ${
        selected
          ? 'bg-sky-50/95 border-sky-400'
          : 'bg-slate-50 border-slate-300'
      }`}
      style={{
        width: compact ? '186px' : '100%',
        maxWidth: compact ? '210px' : '250px',
      }}
    >
      <svg
        data-testid="digital-window-svg"
        viewBox={`0 0 ${vbW} ${vbH}`}
        role="img"
        aria-label={`Dibujo técnico ${tipo || 'Ventana'} ${anchoLabel} por ${altoLabel}`}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        {/* Fondo cuadriculado sutil estilo plano CAD */}
        <rect x="0" y="0" width={vbW} height={vbH} fill="#f8fafc" />

        {/* Marco perimetral exterior */}
        <rect
          x={fx}
          y={fy}
          width={fw}
          height={fh}
          fill="#e2e8f0"
          stroke={strokeFrame}
          strokeWidth="2.2"
          rx="1.5"
        />

        {/* Marco interior */}
        <rect
          x={ix}
          y={iy}
          width={iw}
          height={ih}
          fill="#e0f2fe"
          stroke={strokeFrame}
          strokeWidth="1.4"
        />

        {/* Divisiones de hojas */}
        {leaves.map((leaf, idx) => {
          const lx = ix + idx * leafW;
          const cx = lx + leafW / 2;
          const cy = iy + ih / 2;
          const isSliding = leaf.code === 'X';
          const isHinged = leaf.code === 'A';

          return (
            <g key={`leaf-${idx}`}>
              {/* Fondo de vidrio diferenciado sutilmente */}
              <rect
                x={lx + 1}
                y={iy + 1}
                width={Math.max(4, leafW - 2)}
                height={Math.max(4, ih - 2)}
                fill={isSliding ? '#dbeafe' : '#e0f2fe'}
                stroke={strokeFrame}
                strokeWidth="1.2"
              />

              {/* Reflejo diagonal sutil de vidrio */}
              <line
                x1={lx + 4}
                y1={iy + Math.min(18, ih * 0.35)}
                x2={lx + Math.min(18, leafW * 0.4)}
                y2={iy + 4}
                stroke="#ffffff"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* Triángulo discontinuo para abatible / puerta */}
              {isHinged && (
                <polyline
                  points={`${lx + 3},${iy + 3} ${lx + leafW - 3},${cy} ${lx + 3},${iy + ih - 3}`}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1.2"
                  strokeDasharray="3.5 2.5"
                />
              )}

              {/* Código de hoja (O / X / A) */}
              <text
                x={cx}
                y={isSliding ? cy - 4 : cy + 4}
                textAnchor="middle"
                fontSize={leafCount >= 4 ? '11' : '13'}
                fontWeight="800"
                fill="#0f172a"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                {leaf.code}
              </text>

              {/* Flecha direccional de deslizamiento para hoja corrediza X */}
              {isSliding && (
                <g stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {leaf.arrowDir === 'left' ? (
                    <>
                      <line x1={cx + 10} y1={cy + 10} x2={cx - 10} y2={cy + 10} />
                      <polyline points={`${cx - 5},${cy + 6} ${cx - 10},${cy + 10} ${cx - 5},${cy + 14}`} fill="none" />
                    </>
                  ) : (
                    <>
                      <line x1={cx - 10} y1={cy + 10} x2={cx + 10} y2={cy + 10} />
                      <polyline points={`${cx + 5},${cy + 6} ${cx + 10},${cy + 10} ${cx + 5},${cy + 14}`} fill="none" />
                    </>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* COTA INFERIOR: ANCHO */}
        <g>
          <line x1={fx} y1={fy + fh + 4} x2={fx} y2={dimBottomY + 4} stroke={strokeDim} strokeWidth="1" opacity="0.7" />
          <line x1={fx + fw} y1={fy + fh + 4} x2={fx + fw} y2={dimBottomY + 4} stroke={strokeDim} strokeWidth="1" opacity="0.7" />
          <line x1={fx} y1={dimBottomY} x2={fx + fw} y2={dimBottomY} stroke={strokeDim} strokeWidth="1.3" />
          <circle cx={fx} cy={dimBottomY} r="2" fill={strokeDim} />
          <circle cx={fx + fw} cy={dimBottomY} r="2" fill={strokeDim} />
          <rect
            x={fx + fw / 2 - 34}
            y={dimBottomY - 8}
            width="68"
            height="16"
            rx="4"
            fill="#f8fafc"
          />
          <text
            x={fx + fw / 2}
            y={dimBottomY + 4}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="800"
            fill="#0f172a"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {anchoLabel}
          </text>
        </g>

        {/* COTA DERECHA: ALTO */}
        <g>
          <line x1={fx + fw + 4} y1={fy} x2={dimRightX + 4} y2={fy} stroke={strokeDim} strokeWidth="1" opacity="0.7" />
          <line x1={fx + fw + 4} y1={fy + fh} x2={dimRightX + 4} y2={fy + fh} stroke={strokeDim} strokeWidth="1" opacity="0.7" />
          <line x1={dimRightX} y1={fy} x2={dimRightX} y2={fy + fh} stroke={strokeDim} strokeWidth="1.3" />
          <circle cx={dimRightX} cy={fy} r="2" fill={strokeDim} />
          <circle cx={dimRightX} cy={fy + fh} r="2" fill={strokeDim} />
          <text
            x={dimRightX + 6}
            y={fy + fh / 2 + 4}
            textAnchor="start"
            fontSize="10.5"
            fontWeight="800"
            fill="#0f172a"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {altoLabel}
          </text>
        </g>
      </svg>
    </div>
  );
};
