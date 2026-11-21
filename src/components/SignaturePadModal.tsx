import React, { useCallback, useEffect, useRef, useState } from 'react';
import { pushHistoryOverlay, removeHistoryOverlay } from '../utils/historyOverlayStack';

export function cropCanvasSignature(canvas: HTMLCanvasElement, padding = 10): string | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { width, height } = canvas;
  if (!width || !height) return null;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  const sx = Math.max(0, minX - padding);
  const sy = Math.max(0, minY - padding);
  const sw = Math.min(width - sx, maxX - minX + 1 + padding * 2);
  const sh = Math.min(height - sy, maxY - minY + 1 + padding * 2);

  const out = document.createElement('canvas');
  out.width = Math.max(1, sw);
  out.height = Math.max(1, sh);
  const octx = out.getContext('2d');
  if (!octx) return null;
  octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return out.toDataURL('image/png');
}

interface SignaturePadModalProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  initialSignature?: string;
  onApply: (croppedPngDataUrl: string) => void;
  onClose: () => void;
  onShowToast?: (msg: string, topSuccess?: boolean) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  open,
  title = 'Firma del Cliente',
  subtitle = 'Dibuja la firma dentro del recuadro blanco con el dedo o puntero.',
  initialSignature,
  onApply,
  onClose,
  onShowToast,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<string | null>(null);
  const pushedHistoryRef = useRef(false);
  const closedByPopRef = useRef(false);
  const overlayTokenRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Registro en pila LIFO de historial para cerrar solo esta capa al presionar Atrás
  useEffect(() => {
    if (!open) {
      removeHistoryOverlay(overlayTokenRef.current);
      overlayTokenRef.current = null;
      pushedHistoryRef.current = false;
      closedByPopRef.current = false;
      return;
    }

    closedByPopRef.current = false;
    try {
      window.history.pushState({ apSignaturePad: 1 }, '');
      pushedHistoryRef.current = true;
      overlayTokenRef.current = pushHistoryOverlay('signature-pad', () => {
        pushedHistoryRef.current = false;
        closedByPopRef.current = true;
        overlayTokenRef.current = null;
        onCloseRef.current();
      });
    } catch {
      pushedHistoryRef.current = false;
      overlayTokenRef.current = null;
    }

    return () => {
      removeHistoryOverlay(overlayTokenRef.current);
      overlayTokenRef.current = null;
    };
  }, [open]);

  const requestCloseLayer = useCallback(() => {
    if (pushedHistoryRef.current && !closedByPopRef.current) {
      try {
        window.history.back();
        return;
      } catch {
        pushedHistoryRef.current = false;
      }
    }
    removeHistoryOverlay(overlayTokenRef.current);
    overlayTokenRef.current = null;
    onCloseRef.current();
  }, []);

  // Inicializar o reescalar el canvas conservando los trazos existentes
  useEffect(() => {
    if (!open) {
      snapshotRef.current = null;
      setExpanded(false);
      setHasInk(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(260, Math.round(rect.width || (expanded ? 760 : 480)));
    const cssH = Math.max(180, Math.round(rect.height || (expanded ? 380 : 220)));

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = expanded ? 3.2 : 2.6;

    const srcToRestore = snapshotRef.current || initialSignature || '';
    if (srcToRestore) {
      const img = new Image();
      img.onload = () => {
        const curCanvas = canvasRef.current;
        const curCtx = curCanvas?.getContext('2d');
        if (!curCanvas || !curCtx) return;
        const scale = Math.min(cssW / Math.max(1, img.width), cssH / Math.max(1, img.height), 1);
        const dw = img.width * scale;
        const dh = img.height * scale;
        curCtx.drawImage(img, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
        setHasInk(true);
      };
      img.src = srcToRestore;
    }
  }, [open, expanded, initialSignature]);

  const toggleExpand = () => {
    const canvas = canvasRef.current;
    if (canvas && hasInk) {
      try {
        snapshotRef.current = canvas.toDataURL('image/png');
      } catch {
        snapshotRef.current = null;
      }
    } else if (!hasInk) {
      snapshotRef.current = null;
    }
    setExpanded((prev) => !prev);
  };

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(e.pointerId);
    const pt = getPoint(e);
    drawingRef.current = true;
    lastPtRef.current = pt;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#0F172A';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = expanded ? 3.2 : 2.6;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + 0.01, pt.y + 0.01);
      ctx.stroke();
      setHasInk(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const last = lastPtRef.current;
    if (!canvas || !ctx || !last) return;
    const pt = getPoint(e);
    const midX = (last.x + pt.x) / 2;
    const midY = (last.y + pt.y) / 2;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPtRef.current = pt;
    setHasInk(true);
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPtRef.current = null;
    if (canvasRef.current && hasInk) {
      try {
        snapshotRef.current = canvasRef.current.toDataURL('image/png');
      } catch {
        // ignorar
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    snapshotRef.current = null;
    setHasInk(false);
  };

  const handleApplySignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cropped = cropCanvasSignature(canvas, 10);
    if (!cropped) {
      onShowToast?.('Dibuja una firma antes de aplicar');
      return;
    }
    onApply(cropped);
    requestCloseLayer();
  };

  if (!open) return null;

  return (
    <div
      id="modal-signature-pad"
      className="fixed inset-0 z-[80] bg-slate-950/85 flex items-center justify-center p-2.5 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestCloseLayer();
      }}
    >
      <div
        className={`w-full ${
          expanded ? 'max-w-[96vw] h-[92vh]' : 'max-w-[540px]'
        } bg-[#111827] text-white border border-slate-700 rounded-[22px] p-4 sm:p-5 shadow-2xl flex flex-col gap-3 transition-all`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="m-0 text-[17px] font-extrabold text-white">✍️ {title}</h2>
            <p className="m-0 mt-0.5 text-[12px] text-slate-300">{subtitle}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="btn-signature-toggle-expand"
              onClick={toggleExpand}
              className="min-h-[34px] px-2.5 rounded-xl border border-sky-400/40 bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 text-[11.5px] font-extrabold cursor-pointer whitespace-nowrap"
            >
              {expanded ? '⤡ Reducir recuadro' : '⤢ Ampliar recuadro'}
            </button>
            <button
              type="button"
              id="btn-signature-close-x"
              onClick={requestCloseLayer}
              aria-label="Cerrar firma"
              className="min-w-[34px] min-h-[34px] rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          data-preserve-light="true"
          className={`relative w-full ${
            expanded ? 'flex-1 min-h-[280px]' : 'h-[220px] sm:h-[250px]'
          } rounded-2xl bg-white border-2 border-dashed border-slate-300 overflow-hidden shadow-inner`}
        >
          <canvas
            ref={canvasRef}
            id="canvas-client-signature"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ touchAction: 'none' }}
            className="w-full h-full block cursor-crosshair select-none"
          />
          {!hasInk && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400 select-none">
              <span className="text-[13px] font-bold">Firma aquí</span>
              <span className="mt-8 w-[64%] border-b border-slate-300" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-signature-clear"
              onClick={handleClear}
              className="min-h-[42px] px-3.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[12.5px] font-bold cursor-pointer"
            >
              Limpiar
            </button>
            <button
              type="button"
              id="btn-signature-cancel"
              onClick={requestCloseLayer}
              className="min-h-[42px] px-3.5 rounded-xl border border-slate-600 bg-transparent hover:bg-slate-800 text-slate-300 text-[12.5px] font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <button
            type="button"
            id="btn-signature-apply"
            onClick={handleApplySignature}
            className="min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold cursor-pointer shadow-lg"
          >
            Aplicar firma al PDF
          </button>
        </div>
      </div>
    </div>
  );
};
