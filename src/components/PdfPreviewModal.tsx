import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COLORES_CONFIG,
  getRellenoLabel,
  LINEAS_CONFIG,
} from '../utils/alumineroLogic';
import { CotizacionPdfBlobResult, generarPdfClienteBlob } from '../utils/pdfExport';
import {
  ContratoClienteInfo,
  formatMXN,
  HojaState,
  issueNextCotizacionFolio,
  peekNextCotizacionFolio,
  TallerConfig,
} from '../utils/storageHelpers';
import {
  pushHistoryOverlay,
  removeHistoryOverlay,
} from '../utils/historyOverlayStack';
import { isRunningInIframe } from '../utils/iframeEnv';
import { SignaturePadModal } from './SignaturePadModal';

interface PdfPreviewModalProps {
  open: boolean;
  hoja: HojaState;
  taller: TallerConfig;
  contratoCliente: ContratoClienteInfo;
  onClose: () => void;
  onFinalPdfDownloaded?: (res: CotizacionPdfBlobResult) => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const APERTURA_LABELS: Record<string, string> = {
  corrediza: 'Corrediza',
  fija: 'Fija',
  guillotina: 'Guillotina',
  abatible: 'Abatible',
  banderola: 'Proyección / Banderola',
  oscilobatiente: 'Oscilobatiente',
  plegable: 'Plegable',
};

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  hoja,
  taller,
  contratoCliente,
  onClose,
  onFinalPdfDownloaded,
  onShowToast,
}) => {
  const [viewMode, setViewMode] = useState<'documento' | 'pdf_canvas'>('documento');
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [acceptedDateLabel, setAcceptedDateLabel] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<CotizacionPdfBlobResult | null>(null);
  const [generatingBlob, setGeneratingBlob] = useState(false);
  const [renderingPages, setRenderingPages] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  const pagesContainerRef = useRef<HTMLDivElement | null>(null);
  const issuedFolioForSessionRef = useRef<string | null>(null);
  const sheetHistoryPushedRef = useRef(false);
  const sheetOverlayTokenRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      removeHistoryOverlay(sheetOverlayTokenRef.current);
      sheetOverlayTokenRef.current = null;
      sheetHistoryPushedRef.current = false;
      setViewMode('documento');
      setSignatureOpen(false);
      setSignatureDataUrl('');
      setAcceptedDateLabel('');
      setPreviewResult(null);
      setRenderError(null);
      setPageCount(0);
      issuedFolioForSessionRef.current = null;
      return;
    }

    sheetOverlayTokenRef.current = pushHistoryOverlay('pdf-preview-modal', () => {
      sheetHistoryPushedRef.current = false;
      sheetOverlayTokenRef.current = null;
      onCloseRef.current();
    });

    if (!isRunningInIframe()) {
      try {
        window.history.pushState({ apPdfLayer: 'preview' }, '');
        sheetHistoryPushedRef.current = true;
      } catch {
        sheetHistoryPushedRef.current = false;
      }
    } else {
      sheetHistoryPushedRef.current = false;
    }

    return () => {
      removeHistoryOverlay(sheetOverlayTokenRef.current);
      sheetOverlayTokenRef.current = null;
    };
  }, [open]);

  const requestClose = useCallback(() => {
    if (!isRunningInIframe() && sheetHistoryPushedRef.current) {
      try {
        window.history.back();
        return;
      } catch {
        sheetHistoryPushedRef.current = false;
      }
    }
    removeHistoryOverlay(sheetOverlayTokenRef.current);
    sheetOverlayTokenRef.current = null;
    onCloseRef.current();
  }, []);

  // Preparar el Blob PDF en segundo plano (sin bloquear la vista previa estructurada inmediata)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setGeneratingBlob(true);
    setRenderError(null);

    const previewFolio = issuedFolioForSessionRef.current || peekNextCotizacionFolio();

    generarPdfClienteBlob(hoja, taller, {
      folio: previewFolio,
      clienteFallback: {
        nombre: contratoCliente?.nombre || '',
        telefono: contratoCliente?.telefono || '',
        direccion: contratoCliente?.direccion || '',
      },
      signatureDataUrl: signatureDataUrl || undefined,
      acceptedDateLabel: acceptedDateLabel || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setPreviewResult(res);
          setGeneratingBlob(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGeneratingBlob(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, hoja, taller, contratoCliente, signatureDataUrl, acceptedDateLabel]);

  // Renderizar páginas reales de PDF en canvas solo cuando el usuario elige "Vista PDF (Canvas)"
  useEffect(() => {
    if (!open || viewMode !== 'pdf_canvas' || !previewResult?.blob) return;
    let cancelled = false;
    const container = pagesContainerRef.current;
    if (!container) return;

    setRenderingPages(true);
    setRenderError(null);
    setPageCount(0);
    container.innerHTML = '';

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          '/pdf.worker.min.mjs',
          window.location.origin
        ).toString();
        const arrayBuf = await previewResult.blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuf });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);

        const containerW = Math.min(760, Math.max(290, (container.clientWidth || 340) - 8));
        const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) break;
          const page = await pdf.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const fitScale = containerW / unscaledViewport.width;
          const viewport = page.getViewport({ scale: fitScale * dpr });

          const card = document.createElement('div');
          card.setAttribute('data-preserve-light', 'true');
          card.className =
            'bg-white rounded-xl shadow-2xl border border-slate-700/60 overflow-hidden mx-auto';
          card.style.width = `${Math.round(unscaledViewport.width * fitScale)}px`;

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.setAttribute('aria-label', `Página ${pageNum} de ${pdf.numPages}`);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          }
          card.appendChild(canvas);
          container.appendChild(card);
        }
        if (!cancelled) setRenderingPages(false);
      } catch {
        if (!cancelled) {
          setRenderError(
            'El visor canvas no está disponible en este navegador. Usa la Vista Documento o descarga el PDF.'
          );
          setRenderingPages(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, viewMode, previewResult]);

  const totals = useMemo(() => {
    const partidasSafe = Array.isArray(hoja?.partidas) ? hoja.partidas : [];
    const subtotal = partidasSafe.reduce((acc, p) => acc + (Number(p.totalLinea) || 0), 0);
    const descuentoPct = Math.max(0, Number(hoja?.descuentoPct) || 0);
    const descuentoVal = subtotal * (descuentoPct / 100);
    const base = subtotal - descuentoVal;
    const ivaVal = hoja?.incluirIva ? base * 0.16 : 0;
    const granTotal = base + ivaVal;
    const anticipoPct = Math.max(0, Math.min(100, Number(contratoCliente?.anticipoPct ?? 50)));
    const anticipoSugerido = granTotal * (anticipoPct / 100);
    return {
      partidasSafe,
      subtotal,
      descuentoPct,
      descuentoVal,
      ivaVal,
      granTotal,
      anticipoPct,
      anticipoSugerido,
    };
  }, [hoja, contratoCliente]);

  const buildAndCommitFinalPdf = async (): Promise<CotizacionPdfBlobResult> => {
    const finalFolio = issuedFolioForSessionRef.current || issueNextCotizacionFolio();
    issuedFolioForSessionRef.current = finalFolio;
    const finalRes = await generarPdfClienteBlob(hoja, taller, {
      folio: finalFolio,
      clienteFallback: {
        nombre: contratoCliente?.nombre || '',
        telefono: contratoCliente?.telefono || '',
        direccion: contratoCliente?.direccion || '',
      },
      signatureDataUrl: signatureDataUrl || undefined,
      acceptedDateLabel: acceptedDateLabel || undefined,
    });
    setPreviewResult(finalRes);
    onFinalPdfDownloaded?.(finalRes);
    return finalRes;
  };

  const triggerDownloadFallback = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  };

  const handleSaveToDevice = async () => {
    try {
      const res = await buildAndCommitFinalPdf();
      const savePicker = (
        window as unknown as {
          showSaveFilePicker?: (opts?: {
            suggestedName?: string;
            types?: Array<{ description: string; accept: Record<string, string[]> }>;
          }) => Promise<{
            createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
          }>;
        }
      ).showSaveFilePicker;

      if (typeof savePicker === 'function') {
        try {
          const handle = await savePicker({
            suggestedName: res.filename,
            types: [{ description: 'Documento PDF', accept: { 'application/pdf': ['.pdf'] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(res.blob);
          await writable.close();
          onShowToast(`Cotización ${res.folio} guardada en tu dispositivo`, true);
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }

      triggerDownloadFallback(res.blob, res.filename);
      onShowToast(`Cotización ${res.folio} guardada en tu dispositivo`, true);
    } catch {
      onShowToast('No se pudo guardar el archivo PDF');
    }
  };

  const handleSendWhatsapp = async () => {
    try {
      const res = await buildAndCommitFinalPdf();
      const file = new File([res.blob], res.filename, { type: 'application/pdf' });
      const navWithShare = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
      };

      if (
        typeof navWithShare.share === 'function' &&
        (!navWithShare.canShare || navWithShare.canShare({ files: [file] }))
      ) {
        try {
          await navWithShare.share({
            title: `Cotización ${res.folio} — ${res.clienteNombre}`,
            text: `Te comparto la cotización ${res.folio} de ${taller?.nombre || 'nuestro taller'}.`,
            files: [file],
          });
          onShowToast(`Cotización ${res.folio} compartida`, true);
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }

      triggerDownloadFallback(res.blob, res.filename);
      const cleanTel = (hoja?.clienteTel || contratoCliente?.telefono || '').replace(/\D+/g, '');
      const waMsg = `Hola ${res.clienteNombre}, te comparto la cotización ${res.folio} por ${formatMXN(totals.granTotal)} (${res.filename}).`;
      const waHref = cleanTel
        ? `https://wa.me/${cleanTel.length === 10 ? `52${cleanTel}` : cleanTel}?text=${encodeURIComponent(waMsg)}`
        : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
      const a = document.createElement('a');
      a.href = waHref;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      onShowToast(`PDF ${res.folio} descargado · Adjúntalo en WhatsApp`, true);
    } catch {
      onShowToast('No se pudo preparar el archivo para WhatsApp');
    }
  };

  if (!open) return null;

  const folioDisplay = previewResult?.folio || issuedFolioForSessionRef.current || peekNextCotizacionFolio();
  const displayFilename =
    previewResult?.filename ||
    `${folioDisplay}-${(hoja?.proyecto || contratoCliente?.nombre || 'cliente')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'cliente'}.pdf`;

  const clienteNombre =
    String(hoja?.proyecto || contratoCliente?.nombre || '').trim() || 'Cliente por confirmar';
  const clienteTel = String(hoja?.clienteTel || contratoCliente?.telefono || '').trim();
  const clienteDir = String(hoja?.clienteDir || contratoCliente?.direccion || '').trim();
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <div
        id="modal-pdf-viewer"
        className="fixed inset-0 z-[65] bg-[#07111F]/92 backdrop-blur-sm text-white flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa de cotización ${folioDisplay}`}
      >
        {/* Barra superior */}
        <div className="shrink-0 px-3 sm:px-5 py-2.5 bg-[#0f172a] border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              id="btn-pdf-preview-close"
              onClick={requestClose}
              aria-label="Cerrar vista previa de cotización"
              className="min-w-[38px] min-h-[38px] rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer shrink-0"
            >
              ←
            </button>
            <div className="min-w-0">
              <div className="text-[14px] font-extrabold text-white truncate">
                Vista Previa de Cotización · <span className="mono text-sky-300">{folioDisplay}</span>
              </div>
              <div id="pdf-preview-filename" className="text-[11px] text-slate-300 mono truncate">
                {generatingBlob ? 'Preparando archivo PDF...' : displayFilename}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900 p-0.5">
              <button
                type="button"
                id="btn-pdf-mode-doc"
                onClick={() => setViewMode('documento')}
                className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-extrabold cursor-pointer border-0 ${
                  viewMode === 'documento'
                    ? 'bg-sky-600 text-white'
                    : 'bg-transparent text-slate-300 hover:text-white'
                }`}
              >
                Vista Documento
              </button>
              <button
                type="button"
                id="btn-pdf-mode-canvas"
                disabled={generatingBlob || !previewResult}
                onClick={() => setViewMode('pdf_canvas')}
                className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-extrabold cursor-pointer border-0 disabled:opacity-45 ${
                  viewMode === 'pdf_canvas'
                    ? 'bg-sky-600 text-white'
                    : 'bg-transparent text-slate-300 hover:text-white'
                }`}
              >
                Vista PDF {pageCount > 0 ? `(${pageCount})` : ''}
              </button>
            </div>

            <button
              type="button"
              id="btn-pdf-preview-sign"
              onClick={() => setSignatureOpen(true)}
              className="min-h-[36px] px-3 rounded-xl border border-amber-400/55 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[12px] font-extrabold cursor-pointer"
            >
              {signatureDataUrl ? '✓ Firma aplicada' : '✍️ Firma del Cliente'}
            </button>
          </div>
        </div>

        {/* Cuerpo scrolleable con Vista Documento (nunca en blanco) o Canvas PDF */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
          {viewMode === 'documento' ? (
            <div
              id="cotizacion-preview-document"
              data-preserve-light="true"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
              className="max-w-[820px] mx-auto bg-white text-slate-900 rounded-2xl border border-slate-300 shadow-2xl p-4 sm:p-7"
            >
              {/* Encabezado Taller y Folio */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b-2 border-[#0B2545]">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {taller?.logoDataUrl ? (
                    <img
                      src={taller.logoDataUrl}
                      alt="Logo del taller"
                      className="w-16 h-16 rounded-xl object-contain border border-slate-200 bg-white shrink-0"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: '#0B2545', color: '#ffffff' }}
                      className="w-14 h-14 rounded-xl bg-[#0B2545] text-white flex items-center justify-center font-black text-[18px] shrink-0"
                    >
                      AP
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                      Presupuesto / Cotización Formal
                    </div>
                    <h2 className="m-0 text-[19px] font-black text-[#0B2545] leading-tight">
                      {taller?.nombre || 'Taller de Aluminio y Vidrio'}
                    </h2>
                    <div className="text-[12.5px] font-bold text-slate-700 mt-0.5">
                      Tel / WhatsApp: <span className="mono">{taller?.tel || 'Sin especificar'}</span>
                    </div>
                    {taller?.ubicacion && (
                      <div className="text-[11.5px] font-semibold text-slate-600">
                        Ubicación: {taller.ubicacion}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{ backgroundColor: '#0B2545', color: '#ffffff' }}
                  className="rounded-xl px-4 py-3 text-left sm:text-right shrink-0 min-w-[205px]"
                >
                  <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-sky-200">
                    Folio de Cotización
                  </div>
                  <div className="mono text-[17px] font-black text-white mt-0.5">{folioDisplay}</div>
                  <div className="text-[11.5px] text-slate-100 mt-1">Fecha: {fechaHoy}</div>
                  <div className="text-[11px] text-sky-200">Vigencia: 15 días naturales</div>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div
                style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                className="mt-4 p-3.5 rounded-xl border border-slate-300 text-[12.5px]"
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#0B2545] mb-1.5">
                  Datos del Cliente y Obra
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>
                    <strong>Cliente / Proyecto:</strong> {clienteNombre}
                  </div>
                  <div>
                    <strong>Teléfono:</strong> {clienteTel || 'No especificado'}
                  </div>
                  <div className="sm:col-span-2">
                    <strong>Dirección de obra:</strong> {clienteDir || 'Por confirmar en sitio'}
                  </div>
                </div>
              </div>

              {/* Tabla de Partidas */}
              <div className="mt-4 overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full border-collapse text-[12px] min-w-[520px]">
                  <thead>
                    <tr style={{ backgroundColor: '#0B2545', color: '#ffffff' }}>
                      <th className="p-2.5 text-left w-[36px]">#</th>
                      <th className="p-2.5 text-left">Descripción Técnica</th>
                      <th className="p-2.5 text-center w-[95px]">Medidas</th>
                      <th className="p-2.5 text-center w-[62px]">Cant.</th>
                      <th className="p-2.5 text-right w-[112px]">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totals.partidasSafe.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-5 text-center text-slate-500 font-semibold">
                          No hay partidas agregadas todavía en la Hoja de Cotización.
                        </td>
                      </tr>
                    ) : (
                      totals.partidasSafe.map((item, idx) => {
                        const linea = LINEAS_CONFIG[item.linea] || LINEAS_CONFIG['3'];
                        const color = COLORES_CONFIG[item.color] || COLORES_CONFIG.natural;
                        const panelDesc = linea.esMosquitero
                          ? 'Malla mosquitera'
                          : getRellenoLabel(item.relleno, item.vidrio);
                        const apLabel =
                          linea.categoria === 'ventanas' && !linea.esMosquitero && !linea.esCancelBano
                            ? ` · ${APERTURA_LABELS[item.apertura] || item.apertura || ''}`
                            : '';
                        const unitPrice =
                          item.cantidad > 0 ? item.totalLinea / item.cantidad : item.totalLinea;
                        return (
                          <tr key={item.id || `cot-row-${idx}`} className="border-b border-slate-200 last:border-b-0">
                            <td className="p-2.5 font-extrabold mono text-slate-600">{idx + 1}</td>
                            <td className="p-2.5">
                              <div className="font-extrabold text-slate-900">
                                {item.etiqueta ? `${item.etiqueta} — ` : ''}
                                {linea.nombre}
                                {apLabel}
                              </div>
                              <div className="text-[11.5px] text-slate-600 mt-0.5">
                                Color: <strong>{color.nombre}</strong> · {panelDesc}
                                {item.area ? ` · Área: ${item.area}` : ''}
                              </div>
                            </td>
                            <td className="p-2.5 text-center mono font-bold text-slate-800">
                              {item.anchoCm} × {item.altoCm} cm
                            </td>
                            <td className="p-2.5 text-center mono font-bold text-slate-900">
                              {item.cantidad}
                            </td>
                            <td className="p-2.5 text-right">
                              <strong className="mono font-extrabold text-[#0B2545] block">
                                {formatMXN(item.totalLinea)}
                              </strong>
                              {item.cantidad > 1 && (
                                <span className="mono text-[10.5px] text-slate-500">
                                  {formatMXN(unitPrice)} c/u
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Condiciones y Desglose de Totales */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div
                  style={{ backgroundColor: '#f8fafc', color: '#334155' }}
                  className="md:col-span-7 p-3.5 rounded-xl border border-slate-200 text-[11.5px] leading-relaxed"
                >
                  <strong className="block text-[#0B2545] uppercase tracking-wide text-[11px] mb-1.5">
                    Condiciones Comerciales y Cláusulas
                  </strong>
                  <ul className="m-0 pl-4 flex flex-col gap-1">
                    <li>Anticipo del {totals.anticipoPct}% para inicio de fabricación y compra de material.</li>
                    <li>Saldo restante liquidable al concluir la instalación a entera satisfacción.</li>
                    <li>Precios sujetos a verificación física de medidas y plomo/nivel de vanos en sitio.</li>
                    <li>Garantía en instalación, sellado y funcionamiento de herrajes bajo uso normal.</li>
                  </ul>
                  {(hoja as { notas?: string } | undefined)?.notas && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <strong className="text-slate-800">Notas adicionales:</strong>{' '}
                      {(hoja as { notas?: string }).notas}
                    </div>
                  )}
                </div>

                <div
                  style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                  className="md:col-span-5 p-4 rounded-xl border-[1.5px] border-slate-300 text-[12.5px]"
                >
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#0B2545] mb-2">
                    Resumen Financiero
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span>Subtotal</span>
                    <strong className="mono text-slate-900">{formatMXN(totals.subtotal)}</strong>
                  </div>
                  {totals.descuentoVal > 0 && (
                    <div className="flex justify-between py-0.5 text-emerald-700">
                      <span>Descuento ({totals.descuentoPct}%)</span>
                      <strong className="mono">-{formatMXN(totals.descuentoVal)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span>{hoja?.incluirIva ? 'IVA (16%)' : 'IVA'}</span>
                    <strong className="mono text-slate-900">
                      {hoja?.incluirIva ? formatMXN(totals.ivaVal) : 'Precios netos'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 mt-1.5 border-t border-slate-300 font-black text-[15px] text-[#0B2545]">
                    <span>GRAN TOTAL</span>
                    <span className="mono text-[18px]">{formatMXN(totals.granTotal)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-300 text-[11.5px] flex justify-between text-emerald-800">
                    <span>Anticipo sugerido ({totals.anticipoPct}%)</span>
                    <strong className="mono">{formatMXN(totals.anticipoSugerido)}</strong>
                  </div>
                </div>
              </div>

              {/* Firma de Aceptación del Cliente */}
              {signatureDataUrl && (
                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col items-center text-center">
                  <img
                    src={signatureDataUrl}
                    alt="Firma de aceptación del cliente"
                    className="max-h-16 max-w-[220px] object-contain"
                  />
                  <div className="w-[240px] border-t border-slate-600 mt-1 pt-1 text-[11.5px] font-bold text-slate-800">
                    Aceptación del Cliente · {acceptedDateLabel}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {renderingPages && (
                <div className="text-center text-slate-300 text-[13px] py-4">
                  Renderizando páginas PDF...
                </div>
              )}
              {renderError && (
                <div className="max-w-[540px] mx-auto p-4 rounded-xl bg-amber-950/60 border border-amber-400/50 text-amber-100 text-[12.5px] text-center">
                  {renderError}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('documento')}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-[12px] cursor-pointer"
                    >
                      Volver a Vista Documento
                    </button>
                  </div>
                </div>
              )}
              <div
                ref={pagesContainerRef}
                id="pdf-viewer-pages"
                className="flex flex-col items-center gap-4 pb-6"
              />
            </div>
          )}
        </div>

        {/* Barra inferior de acciones funcionales */}
        <div className="shrink-0 px-3 sm:px-5 py-3 bg-[#0f172a] border-t border-slate-800 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            id="btn-pdf-viewer-whatsapp"
            onClick={() => void handleSendWhatsapp()}
            className="flex-1 min-w-[160px] max-w-[260px] min-h-[46px] px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-lg"
          >
            💬 Compartir PDF / WhatsApp
          </button>
          <button
            type="button"
            id="btn-pdf-viewer-save"
            onClick={() => void handleSaveToDevice()}
            className="flex-1 min-w-[160px] max-w-[260px] min-h-[46px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-lg"
          >
            💾 Descargar PDF
          </button>
        </div>
      </div>

      <SignaturePadModal
        open={signatureOpen}
        title="Firma de Aceptación del Cliente"
        subtitle="La firma se estampará al pie de la cotización sin deformarse."
        initialSignature={signatureDataUrl}
        onApply={(croppedPng) => {
          const d = new Date();
          const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(
            d.getMonth() + 1
          ).padStart(2, '0')}/${d.getFullYear()}`;
          setSignatureDataUrl(croppedPng);
          setAcceptedDateLabel(dateStr);
          onShowToast('Firma del cliente aplicada al PDF', true);
        }}
        onClose={() => setSignatureOpen(false)}
        onShowToast={onShowToast}
      />
    </>
  );
};
