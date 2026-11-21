import React, { useCallback, useEffect, useRef, useState } from 'react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { CotizacionPdfBlobResult, generarPdfClienteBlob } from '../utils/pdfExport';
import {
  ContratoClienteInfo,
  HojaState,
  issueNextCotizacionFolio,
  peekNextCotizacionFolio,
  TallerConfig,
} from '../utils/storageHelpers';
import {
  pushHistoryOverlay,
  removeHistoryOverlay,
} from '../utils/historyOverlayStack';
import { safeHistoryBack, safeHistoryPushState } from '../utils/runtimeEnv';
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

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  hoja,
  taller,
  contratoCliente,
  onClose,
  onFinalPdfDownloaded,
  onShowToast,
}) => {
  const [viewerOpen, setViewerOpen] = useState(false);
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
  const viewerHistoryPushedRef = useRef(false);
  const sheetOverlayTokenRef = useRef<number | null>(null);
  const viewerOverlayTokenRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Empujar capa de ventana inferior al historial al abrir
  useEffect(() => {
    if (!open) {
      removeHistoryOverlay(sheetOverlayTokenRef.current);
      removeHistoryOverlay(viewerOverlayTokenRef.current);
      sheetOverlayTokenRef.current = null;
      viewerOverlayTokenRef.current = null;
      sheetHistoryPushedRef.current = false;
      viewerHistoryPushedRef.current = false;
      setViewerOpen(false);
      setSignatureOpen(false);
      setSignatureDataUrl('');
      setAcceptedDateLabel('');
      setPreviewResult(null);
      setRenderError(null);
      issuedFolioForSessionRef.current = null;
      return;
    }

    try {
      const pushed = safeHistoryPushState({ apPdfLayer: 'sheet' }, '');
      if (pushed) {
        sheetHistoryPushedRef.current = true;
        sheetOverlayTokenRef.current = pushHistoryOverlay('pdf-sheet', () => {
          sheetHistoryPushedRef.current = false;
          sheetOverlayTokenRef.current = null;
          onCloseRef.current();
        });
      } else {
        sheetHistoryPushedRef.current = false;
        sheetOverlayTokenRef.current = null;
      }
    } catch {
      sheetHistoryPushedRef.current = false;
      sheetOverlayTokenRef.current = null;
    }

    return () => {
      removeHistoryOverlay(sheetOverlayTokenRef.current);
      sheetOverlayTokenRef.current = null;
    };
  }, [open]);

  // Empujar capa de visor completo al historial únicamente mientras viewerOpen está activo
  useEffect(() => {
    if (!open || !viewerOpen) {
      removeHistoryOverlay(viewerOverlayTokenRef.current);
      viewerOverlayTokenRef.current = null;
      viewerHistoryPushedRef.current = false;
      return;
    }

    try {
      const pushed = safeHistoryPushState({ apPdfLayer: 'viewer' }, '');
      if (pushed) {
        viewerHistoryPushedRef.current = true;
        viewerOverlayTokenRef.current = pushHistoryOverlay('pdf-viewer', () => {
          viewerHistoryPushedRef.current = false;
          viewerOverlayTokenRef.current = null;
          setViewerOpen(false);
        });
      } else {
        viewerHistoryPushedRef.current = false;
        viewerOverlayTokenRef.current = null;
      }
    } catch {
      viewerHistoryPushedRef.current = false;
      viewerOverlayTokenRef.current = null;
    }

    return () => {
      removeHistoryOverlay(viewerOverlayTokenRef.current);
      viewerOverlayTokenRef.current = null;
    };
  }, [open, viewerOpen]);

  const requestCloseSheet = useCallback(() => {
    if (sheetHistoryPushedRef.current) {
      if (safeHistoryBack()) {
        return;
      }
      sheetHistoryPushedRef.current = false;
    }
    removeHistoryOverlay(sheetOverlayTokenRef.current);
    sheetOverlayTokenRef.current = null;
    onCloseRef.current();
  }, []);

  const openViewerLayer = () => {
    if (viewerOpen) return;
    setViewerOpen(true);
  };

  const closeViewerLayer = () => {
    if (viewerHistoryPushedRef.current) {
      if (safeHistoryBack()) {
        return;
      }
      viewerHistoryPushedRef.current = false;
    }
    removeHistoryOverlay(viewerOverlayTokenRef.current);
    viewerOverlayTokenRef.current = null;
    setViewerOpen(false);
  };

  // Generar el Blob de vista previa (sin avanzar el folio) cada vez que abre o cambia la firma
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setGeneratingBlob(true);
    setRenderError(null);

    const previewFolio = issuedFolioForSessionRef.current || peekNextCotizacionFolio();

    generarPdfClienteBlob(hoja, taller, {
      folio: previewFolio,
      clienteFallback: {
        nombre: contratoCliente.nombre,
        telefono: contratoCliente.telefono,
        direccion: contratoCliente.direccion,
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
          setRenderError('No se pudo preparar la vista previa del PDF.');
          setGeneratingBlob(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, hoja, taller, contratoCliente, signatureDataUrl, acceptedDateLabel]);

  // Renderizar páginas en canvas con pdfjs-dist cuando el visor interno está abierto
  useEffect(() => {
    if (!open || !viewerOpen || !previewResult?.blob) return;
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
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
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
          setRenderError('No se pudieron renderizar las páginas del PDF en pantalla.');
          setRenderingPages(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, viewerOpen, previewResult]);

  const buildAndCommitFinalPdf = async (): Promise<CotizacionPdfBlobResult> => {
    const finalFolio = issuedFolioForSessionRef.current || issueNextCotizacionFolio();
    issuedFolioForSessionRef.current = finalFolio;
    const finalRes = await generarPdfClienteBlob(hoja, taller, {
      folio: finalFolio,
      clienteFallback: {
        nombre: contratoCliente.nombre,
        telefono: contratoCliente.telefono,
        direccion: contratoCliente.direccion,
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
            text: `Te comparto la cotización ${res.folio} de ${taller.nombre || 'nuestro taller'}.`,
            files: [file],
          });
          onShowToast(`Cotización ${res.folio} compartida`, true);
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }

      triggerDownloadFallback(res.blob, res.filename);
      const cleanTel = (hoja.clienteTel || contratoCliente.telefono || '').replace(/\D+/g, '');
      const waMsg = `Hola ${res.clienteNombre}, te comparto la cotización ${res.folio} (${res.filename}).`;
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

  const displayFilename =
    previewResult?.filename ||
    `${peekNextCotizacionFolio()}-${(hoja.proyecto || 'cliente').toLowerCase().replace(/\s+/g, '-')}.pdf`;

  return (
    <>
      {/* ==================== VENTANA INFERIOR: COTIZACIÓN LISTA ==================== */}
      {!viewerOpen && (
        <div
          id="modal-pdf-ready-sheet"
          className="fixed inset-0 z-[55] bg-slate-950/75 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Cotización lista"
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseSheet();
          }}
        >
          <div className="w-full sm:max-w-[460px] bg-[#0f172a] text-white border-t sm:border border-slate-700 rounded-t-[26px] sm:rounded-[24px] p-5 pb-7 sm:p-6 shadow-2xl flex flex-col gap-3.5">
            <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto sm:hidden" />

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="m-0 text-[18px] font-extrabold text-white">
                  📄 Cotización lista
                </h2>
                <p
                  id="pdf-preview-filename"
                  className="m-0 mt-1 text-[12.5px] font-bold text-sky-300 mono break-all"
                >
                  {generatingBlob ? 'Preparando documento...' : displayFilename}
                </p>
                {signatureDataUrl && (
                  <span className="inline-block mt-1.5 text-[11px] font-bold text-emerald-300">
                    ✓ Firma del cliente aplicada ({acceptedDateLabel})
                  </span>
                )}
              </div>
            </div>

            {renderError && (
              <p className="m-0 text-[12px] text-red-300 bg-red-950/40 border border-red-500/40 rounded-xl px-3 py-2">
                {renderError}
              </p>
            )}

            <div className="flex flex-col gap-2.5 mt-1">
              <button
                type="button"
                id="btn-pdf-preview-open-viewer"
                disabled={generatingBlob || !previewResult}
                onClick={openViewerLayer}
                className="w-full min-h-[48px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-[14px] cursor-pointer shadow-lg"
              >
                👁 Ver PDF
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-pdf-preview-sign"
                  onClick={() => setSignatureOpen(true)}
                  className="flex-1 min-h-[46px] px-4 rounded-xl border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 font-bold text-[13.5px] cursor-pointer"
                >
                  {signatureDataUrl ? '✍️ Cambiar firma del cliente' : '✍️ Aplicar firma del cliente'}
                </button>
                {signatureDataUrl && (
                  <button
                    type="button"
                    id="btn-pdf-preview-clear-sign"
                    onClick={() => {
                      setSignatureDataUrl('');
                      setAcceptedDateLabel('');
                      onShowToast('Firma retirada del PDF');
                    }}
                    className="min-h-[46px] px-3 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 text-[12px] font-bold cursor-pointer"
                  >
                    Quitar
                  </button>
                )}
              </div>

              <button
                type="button"
                id="btn-pdf-preview-close"
                onClick={requestCloseSheet}
                className="w-full min-h-[44px] px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-[13.5px] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VISOR INTERNO DE PÁGINAS PDF ==================== */}
      {viewerOpen && (
        <div
          id="modal-pdf-viewer"
          className="fixed inset-0 z-[65] bg-[#090d16] text-white flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`Visor PDF ${displayFilename}`}
        >
          {/* Barra superior */}
          <div className="shrink-0 h-[58px] px-3 sm:px-5 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                id="btn-pdf-viewer-back"
                onClick={closeViewerLayer}
                aria-label="Volver a opciones del PDF"
                className="min-w-[38px] min-h-[38px] rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer shrink-0"
              >
                ←
              </button>
              <div className="min-w-0">
                <div className="text-[13.5px] font-extrabold text-white truncate mono">
                  {displayFilename}
                </div>
                <div className="text-[11px] text-slate-400">
                  {renderingPages
                    ? 'Renderizando páginas...'
                    : pageCount > 0
                      ? `${pageCount} página${pageCount === 1 ? '' : 's'}`
                      : 'Vista previa'}
                </div>
              </div>
            </div>
          </div>

          {/* Área de páginas renderizadas en canvas */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
            {renderingPages && (
              <div className="text-center text-slate-300 text-[13px] py-4">
                Cargando vista de páginas PDF...
              </div>
            )}
            {renderError && (
              <div className="max-w-[520px] mx-auto p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-[13px]">
                {renderError}
              </div>
            )}
            <div
              ref={pagesContainerRef}
              id="pdf-viewer-pages"
              className="flex flex-col items-center gap-4 pb-6"
            />
          </div>

          {/* Barra inferior con SOLO 2 botones finales */}
          <div className="shrink-0 px-3 sm:px-5 py-3 bg-[#0f172a] border-t border-slate-800 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              id="btn-pdf-viewer-whatsapp"
              onClick={() => void handleSendWhatsapp()}
              className="flex-1 min-w-[160px] max-w-[260px] min-h-[46px] px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-lg"
            >
              💬 Enviar por WhatsApp
            </button>
            <button
              type="button"
              id="btn-pdf-viewer-save"
              onClick={() => void handleSaveToDevice()}
              className="flex-1 min-w-[160px] max-w-[260px] min-h-[46px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-lg"
            >
              💾 Guardar en mi dispositivo
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE FIRMA DEL CLIENTE ==================== */}
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
