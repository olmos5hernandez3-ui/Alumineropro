import React, { useEffect, useMemo } from 'react';
import { CATALOGO_PERFILES, PerfilCatalogoId } from '../utils/alumineroLogic';
import { PerfilSectionSvg } from './PerfilSectionSvg';

export interface PerfilZoomData {
  perfilId: PerfilCatalogoId;
  nombre: string;
  codigo?: string;
  subtitulo?: string;
  orientacion?: 'horizontal' | 'vertical';
  fotoRealUrl?: string;
  onEditFoto?: () => void;
}

interface PerfilZoomModalProps {
  data: PerfilZoomData | null;
  onClose: () => void;
}

interface PerfilDims {
  widthMm: number;
  heightMm: number;
  widthIn: string;
  heightIn: string;
  claveNumerica: string;
}

function parsePerfilDimensiones(
  perfilId: PerfilCatalogoId,
  codigoProp?: string
): PerfilDims {
  const item = CATALOGO_PERFILES.find((p) => p.id === perfilId);
  let widthMm = 76.2;
  let heightMm = 38.1;

  if (item?.dimensiones) {
    const m = item.dimensiones.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm/i);
    if (m) {
      widthMm = parseFloat(m[1]);
      heightMm = parseFloat(m[2]);
    }
  }

  const formatIn = (mm: number) => `${(mm / 25.4).toFixed(3)}"`;

  // Extrae clave numérica limpia del código o referencia (ej. 7836, 7825, 7857, MOSQ-25)
  const rawCode = (codigoProp || item?.codigoRef || '').trim();
  const numMatch = rawCode.match(/(?:ALM-|Alumer\s+|CH-|BAT-|MOSQ-|RM-)?(\d{3,5}(?:\s*C|-1V)?)/i);
  const claveNumerica = rawCode
    ? rawCode.split('·')[0].trim()
    : numMatch
      ? numMatch[0].trim()
      : perfilId.toUpperCase();

  return {
    widthMm,
    heightMm,
    widthIn: formatIn(widthMm),
    heightIn: formatIn(heightMm),
    claveNumerica,
  };
}

export const PerfilZoomModal: React.FC<PerfilZoomModalProps> = ({ data, onClose }) => {
  useEffect(() => {
    if (!data) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [data, onClose]);

  const dims = useMemo(() => {
    if (!data) return null;
    return parsePerfilDimensiones(data.perfilId, data.codigo);
  }, [data]);

  if (!data || !dims) return null;

  const widthLabel = `${dims.widthMm.toFixed(1)} mm / ${dims.widthIn}`;
  const heightLabel = `${dims.heightMm.toFixed(1)} mm / ${dims.heightIn}`;

  return (
    <div
      id="modal-perfil-zoom"
      className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Plano técnico de ${data.nombre}`}
      onClick={onClose}
    >
      <div
        data-preserve-light="true"
        className="w-full max-w-[400px] rounded-[24px] bg-white text-slate-900 border-2 border-slate-200 p-4 sm:p-5 shadow-2xl flex flex-col items-center gap-3 screen-animate"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado limpio estilo catálogo técnico: nombre en azul centrado */}
        <div className="w-full relative flex flex-col items-center pt-0.5">
          <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-400">
            Plano de Extrusión · Sección Transversal
          </span>
          <h3 className="m-0 mt-1 text-[19px] sm:text-[20px] font-extrabold text-blue-700 leading-tight text-center px-8 break-words">
            {data.nombre}
          </h3>
          <button
            type="button"
            id="btn-perfil-zoom-close"
            onClick={onClose}
            aria-label="Cerrar plano técnico"
            className="absolute right-0 top-0 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[14px] cursor-pointer flex items-center justify-center transition-transform active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Lámina CAD blanca con líneas de cota reales en mm y pulgadas */}
        <button
          type="button"
          onClick={onClose}
          title="Tocar para cerrar vista ampliada"
          aria-label="Plano técnico acotado del perfil, tocar para cerrar"
          data-preserve-light="true"
          className="w-full rounded-2xl bg-white border border-slate-200 shadow-inner p-3 cursor-zoom-out flex flex-col items-center justify-center transition-transform active:scale-[0.99]"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {data.fotoRealUrl ? (
            <div className="w-full max-w-[280px] aspect-square flex items-center justify-center p-2 bg-white">
              <PerfilSectionSvg
                perfilId={data.perfilId}
                orientacion={data.orientacion}
                fotoRealUrl={data.fotoRealUrl}
                size={256}
                className="max-w-full max-h-full"
              />
            </div>
          ) : (
            <div className="w-full max-w-[330px] flex flex-col items-center">
              {/* Cota horizontal superior (Ancho en mm / pulgadas) */}
              <div className="w-full pr-10 pl-2 mb-0.5">
                <svg
                  viewBox="0 0 240 34"
                  className="w-full h-[30px] block overflow-visible"
                  aria-hidden="true"
                >
                  {/* Texto de cota superior */}
                  <text
                    x="120"
                    y="12"
                    textAnchor="middle"
                    fill="#111827"
                    fontFamily="JetBrains Mono, ui-monospace, monospace"
                    fontWeight="700"
                    fontSize="11.5"
                  >
                    {widthLabel}
                  </text>
                  {/* Líneas de extensión verticales */}
                  <line x1="20" y1="18" x2="20" y2="33" stroke="#111827" strokeWidth="1" />
                  <line x1="220" y1="18" x2="220" y2="33" stroke="#111827" strokeWidth="1" />
                  {/* Línea de cota horizontal con puntas de flecha */}
                  <line x1="22" y1="22" x2="218" y2="22" stroke="#111827" strokeWidth="1" />
                  <polygon points="20,22 27,19.2 27,24.8" fill="#111827" />
                  <polygon points="220,22 213,19.2 213,24.8" fill="#111827" />
                </svg>
              </div>

              {/* Cuerpo central: Dibujo CAD + Cota vertical derecha (Alto en mm / pulgadas) */}
              <div className="w-full flex items-stretch justify-center pl-2">
                <div className="flex-1 flex items-center justify-center bg-white">
                  <PerfilSectionSvg
                    perfilId={data.perfilId}
                    orientacion={data.orientacion}
                    size={224}
                    className="max-w-full h-auto"
                  />
                </div>

                {/* Cota vertical derecha */}
                <div className="w-10 shrink-0 flex items-center justify-center">
                  <svg
                    viewBox="0 0 42 224"
                    className="w-10 h-[224px] block overflow-visible"
                    aria-hidden="true"
                  >
                    {/* Líneas de extensión horizontales */}
                    <line x1="0" y1="22" x2="18" y2="22" stroke="#111827" strokeWidth="1" />
                    <line x1="0" y1="202" x2="18" y2="202" stroke="#111827" strokeWidth="1" />
                    {/* Línea de cota vertical con puntas de flecha */}
                    <line x1="13" y1="24" x2="13" y2="200" stroke="#111827" strokeWidth="1" />
                    <polygon points="13,22 10.2,29 15.8,29" fill="#111827" />
                    <polygon points="13,202 10.2,195 15.8,195" fill="#111827" />
                    {/* Texto de cota vertical rotado */}
                    <text
                      x="28"
                      y="112"
                      textAnchor="middle"
                      fill="#111827"
                      fontFamily="JetBrains Mono, ui-monospace, monospace"
                      fontWeight="700"
                      fontSize="11"
                      transform="rotate(90 28 112)"
                    >
                      {heightLabel}
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Clave numérica del perfil centrada debajo del plano */}
          <div className="mt-2 pt-2 border-t border-slate-100 w-full flex flex-col items-center gap-0.5">
            <span className="mono text-[15px] font-black tracking-wide text-slate-900">
              {dims.claveNumerica}
            </span>
            <span className="mono text-[11px] font-semibold text-slate-500">
              {dims.widthMm.toFixed(1)} × {dims.heightMm.toFixed(1)} mm ({dims.widthIn} × {dims.heightIn})
            </span>
          </div>
        </button>

        {data.subtitulo && (
          <p className="m-0 text-[12px] font-semibold text-slate-600 text-center leading-snug break-words px-2">
            {data.subtitulo}
          </p>
        )}

        <div className="w-full flex flex-col gap-2 pt-0.5">
          {data.onEditFoto && (
            <button
              type="button"
              onClick={() => {
                data.onEditFoto?.();
              }}
              className="w-full min-h-[40px] px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[12.5px] font-extrabold cursor-pointer transition-colors"
            >
              📷 Ver ficha / cambiar foto real
            </button>
          )}
          <button
            type="button"
            id="btn-perfil-zoom-regresar"
            onClick={onClose}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-extrabold cursor-pointer shadow-md transition-all active:scale-95"
          >
            ← Regresar
          </button>
        </div>
      </div>
    </div>
  );
};
