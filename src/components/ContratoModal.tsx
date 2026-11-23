import React, { useEffect, useRef, useState } from 'react';
import { COLORES_CONFIG, getRellenoLabel, LINEAS_CONFIG, round2 } from '../utils/alumineroLogic';
import { buildPdfContratoServicioFile, ContratoPdfFileResult } from '../utils/pdfExport';
import {
  pushHistoryOverlay,
  removeHistoryOverlay,
} from '../utils/historyOverlayStack';
import {
  ContratoClienteInfo,
  DEFAULT_CONTRATO_CLAUSES,
  formatMXN,
  HojaState,
  issueNextContratoFolio,
  peekNextContratoFolio,
  TallerConfig,
} from '../utils/storageHelpers';
import { PartidaMiniSvg } from './PartidaMiniSvg';
import { SignaturePadModal } from './SignaturePadModal';

interface ContratoModalProps {
  open: boolean;
  hoja: HojaState;
  taller: TallerConfig;
  cliente: ContratoClienteInfo;
  onUpdateCliente: (patch: Partial<ContratoClienteInfo>) => void;
  onUpdateProyecto: (proyecto: string) => void;
  onToggleIva: (incluirIva: boolean) => void;
  onClose: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const APERTURA_DESC: Record<string, string> = {
  corrediza: 'Corrediza',
  fija: 'Fija',
  guillotina: 'Guillotina',
  abatible: 'Abatible',
  banderola: 'Proyección / Banderola',
  oscilobatiente: 'Oscilobatiente',
  plegable: 'Plegable',
};

const GENERATE_FIRST_WARNING =
  "Primero debes presionar 'Generar Contrato' para crear el documento";

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export const ContratoModal: React.FC<ContratoModalProps> = ({
  open,
  hoja,
  taller,
  cliente,
  onUpdateCliente,
  onUpdateProyecto,
  onToggleIva,
  onClose,
  onShowToast,
}) => {
  const [phase, setPhase] = useState<'setup' | 'preview'>('setup');
  const [cleanPreview, setCleanPreview] = useState(false);
  const [folioActivo, setFolioActivo] = useState<string>(() => peekNextContratoFolio());
  const [editarClausulas, setEditarClausulas] = useState(false);
  const [signatureTarget, setSignatureTarget] = useState<'provider' | 'client' | null>(null);
  const [providerSignatureUrl, setProviderSignatureUrl] = useState<string>('');
  const [clientSignatureUrl, setClientSignatureUrl] = useState<string>('');
  const [generatedContract, setGeneratedContract] = useState<ContratoPdfFileResult | null>(null);
  const [generatingContract, setGeneratingContract] = useState<boolean>(false);
  const [gateAlertMsg, setGateAlertMsg] = useState<string | null>(null);
  const previewCardRef = useRef<HTMLDivElement | null>(null);
  const previewOverlayTokenRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setPhase('setup');
      setCleanPreview(false);
      setEditarClausulas(false);
      setSignatureTarget(null);
      setProviderSignatureUrl('');
      setClientSignatureUrl('');
      setGeneratedContract(null);
      setGeneratingContract(false);
      setGateAlertMsg(null);
      setFolioActivo(peekNextContratoFolio());
    }
  }, [open]);

  // Invalidar el contrato generado si cambian datos, partidas o firmas
  useEffect(() => {
    setGeneratedContract(null);
  }, [
    folioActivo,
    clientSignatureUrl,
    providerSignatureUrl,
    cliente.nombre,
    cliente.telefono,
    cliente.direccion,
    cliente.fechaEntregaEstimada,
    cliente.anticipoPct,
    cliente.anticipoRecibido,
    cliente.clausulaAnticipo,
    cliente.clausulaEntrega,
    cliente.clausulaCondicionesVano,
    cliente.clausulaGarantia,
    hoja.proyecto,
    hoja.incluirIva,
    hoja.descuentoPct,
    hoja.partidas.length,
  ]);

  // Registrar capa de historial local para que Atrás regrese 1 paso (Vista previa -> Configuración -> Hoja)
  useEffect(() => {
    if (!open || phase !== 'preview') {
      removeHistoryOverlay(previewOverlayTokenRef.current);
      previewOverlayTokenRef.current = null;
      return;
    }
    previewOverlayTokenRef.current = pushHistoryOverlay('contrato-preview', () => {
      previewOverlayTokenRef.current = null;
      if (signatureTarget !== null) {
        setSignatureTarget(null);
        return;
      }
      if (cleanPreview) {
        setCleanPreview(false);
        return;
      }
      setPhase('setup');
    });
    return () => {
      removeHistoryOverlay(previewOverlayTokenRef.current);
      previewOverlayTokenRef.current = null;
    };
  }, [open, phase, cleanPreview, signatureTarget]);

  useEffect(() => {
    if (open && phase === 'preview' && previewCardRef.current) {
      previewCardRef.current.scrollTop = 0;
    }
  }, [open, phase, cleanPreview]);

  if (!open) return null;

  const subtotal = hoja.partidas.reduce((acc, p) => acc + p.totalLinea, 0);
  const descuentoVal = subtotal * ((hoja.descuentoPct || 0) / 100);
  const baseDesc = subtotal - descuentoVal;
  const ivaVal = hoja.incluirIva ? baseDesc * 0.16 : 0;
  const total = baseDesc + ivaVal;

  const anticipoPct = Math.max(0, Math.min(100, Number(cliente.anticipoPct ?? 50)));
  const anticipoMonto =
    typeof cliente.anticipoRecibido === 'number' && cliente.anticipoRecibido >= 0
      ? Math.min(total, cliente.anticipoRecibido)
      : round2(total * (anticipoPct / 100));
  const anticipoPctDisplay = total > 0 ? round2((anticipoMonto / total) * 100) : anticipoPct;
  const saldoMonto = Math.max(0, round2(total - anticipoMonto));

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const fechaEntregaTexto = cliente.fechaEntregaEstimada
    ? new Date(`${cliente.fechaEntregaEstimada}T12:00:00`).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'A convenir tras verificación de medidas en obra';

  const cliNombreRaw = String(cliente?.nombre ?? '').trim();
  const cliTelRaw = String(cliente?.telefono ?? '').trim();
  const cliDirRaw = String(cliente?.direccion ?? '').trim();
  const proyectoRaw = String(hoja?.proyecto ?? '').trim();
  const partidasSafe = Array.isArray(hoja?.partidas) ? hoja.partidas : [];

  const cliNombreFinal = cliNombreRaw || proyectoRaw || 'Cliente por confirmar';

  const clausulaAnticipoText =
    String(cliente?.clausulaAnticipo ?? '').trim() || DEFAULT_CONTRATO_CLAUSES.anticipo;
  const clausulaEntregaText =
    String(cliente?.clausulaEntrega ?? '').trim() || DEFAULT_CONTRATO_CLAUSES.entrega;
  const clausulaVanoText =
    String(cliente?.clausulaCondicionesVano ?? '').trim() || DEFAULT_CONTRATO_CLAUSES.condicionesVano;
  const clausulaGarantiaText =
    String(cliente?.clausulaGarantia ?? '').trim() || DEFAULT_CONTRATO_CLAUSES.garantia;

  const handleCloseModal = () => {
    removeHistoryOverlay(previewOverlayTokenRef.current);
    previewOverlayTokenRef.current = null;
    onClose();
  };

  const handleConfirmSetupAndGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const folioNuevo = issueNextContratoFolio();
    setFolioActivo(folioNuevo);
    onUpdateCliente({ folio: folioNuevo });
    setCleanPreview(false);
    setGateAlertMsg(null);
    setPhase('preview');
  };

  const handleOpenPreviewDirect = () => {
    const folioNuevo = cliente?.folio || folioActivo || issueNextContratoFolio();
    setFolioActivo(folioNuevo);
    setEditarClausulas(false);
    setCleanPreview(true);
    setGateAlertMsg(null);
    setPhase('preview');
  };

  const handleGenerateContractPdf = async () => {
    if (partidasSafe.length === 0) {
      onShowToast('Agrega al menos una partida para generar el contrato');
      return;
    }
    setGeneratingContract(true);
    setGateAlertMsg(null);
    try {
      const result = await buildPdfContratoServicioFile(
        hoja,
        taller,
        cliente,
        folioActivo,
        clientSignatureUrl || undefined,
        providerSignatureUrl || undefined
      );
      setGeneratedContract(result);
      onShowToast(`Contrato ${folioActivo} generado. Ya puedes Guardar PDF o enviar por WhatsApp.`, true);
    } catch {
      setGeneratedContract(null);
      onShowToast('No se pudo generar el documento del contrato');
    } finally {
      setGeneratingContract(false);
    }
  };

  const requireGeneratedContractOrWarn = (): ContratoPdfFileResult | null => {
    if (!generatedContract) {
      setGateAlertMsg(GENERATE_FIRST_WARNING);
      onShowToast(GENERATE_FIRST_WARNING);
      return null;
    }
    setGateAlertMsg(null);
    return generatedContract;
  };

  const handleSaveGeneratedPdf = () => {
    const docReady = requireGeneratedContractOrWarn();
    if (!docReady) return;
    triggerBlobDownload(docReady.blob, docReady.filename);
    onShowToast(`PDF Contrato ${folioActivo} descargado`, true);
  };

  const handleShareWhatsApp = async () => {
    const docReady = requireGeneratedContractOrWarn();
    if (!docReady) return;

    const lines = [
      `*CONTRATO DE SERVICIOS — ${folioActivo}*`,
      `*Taller:* ${taller?.nombre || 'Aluminero Pro'}`,
      taller?.tel ? `Tel: ${taller.tel}` : '',
      taller?.ubicacion ? `Ubicación: ${taller.ubicacion}` : '',
      '',
      `*Cliente:* ${cliNombreFinal}`,
      cliDirRaw ? `*Obra:* ${cliDirRaw}` : '',
      `*Entrega estimada:* ${fechaEntregaTexto}`,
      '',
      '*Trabajos contratados:*',
      ...partidasSafe.map((item, idx) => {
        const l = LINEAS_CONFIG[item.linea] || LINEAS_CONFIG['3'];
        const c = COLORES_CONFIG[item.color] || COLORES_CONFIG.natural;
        const rel = l.esMosquitero ? 'Malla mosquitera' : getRellenoLabel(item.relleno, item.vidrio);
        return `${idx + 1}. ${item.etiqueta ? `${item.etiqueta} - ` : ''}${l.nombre} (${item.anchoCm}×${item.altoCm} cm, ${c.corto}, ${rel}) ×${item.cantidad} = ${formatMXN(item.totalLinea)}`;
      }),
      '',
      `Subtotal: ${formatMXN(subtotal)}`,
      descuentoVal > 0 ? `Descuento (${hoja.descuentoPct}%): -${formatMXN(descuentoVal)}` : '',
      ivaVal > 0 ? `IVA (16%): ${formatMXN(ivaVal)}` : 'Precios netos (Sin IVA)',
      `*GRAN TOTAL: ${formatMXN(total)}*`,
      `Anticipo recibido (${anticipoPctDisplay}%): ${formatMXN(anticipoMonto)}`,
      `*Saldo a liquidar contra entrega: ${formatMXN(saldoMonto)}*`,
    ].filter(Boolean);

    const text = lines.join('\n');
    const title = `Contrato ${folioActivo} — ${cliNombreFinal}`;

    // Compartir el archivo PDF directamente (nativo móvil / Web Share Level 2)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareFilesPayload = { files: [docReady.file], title, text };
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [docReady.file] })) {
          await navigator.share(shareFilesPayload);
          onShowToast('Contrato PDF compartido correctamente', true);
          return;
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: descargar el PDF generado y abrir WhatsApp con el resumen listo para adjuntar
    triggerBlobDownload(docReady.blob, docReady.filename);

    const cleanPhone = cliTelRaw.replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignorar si portapapeles bloqueado
    }
    onShowToast('PDF descargado y WhatsApp abierto para adjuntar el contrato', true);
  };

  return (
    <div
      id="modal-contrato"
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-start sm:items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Contrato de Prestación de Servicios"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
    >
      {/* ==================== PASO 1: CONFIGURACIÓN RÁPIDA ANTES DE GENERAR ==================== */}
      {phase === 'setup' ? (
        <div
          data-preserve-light="true"
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
          className="contrato-no-print w-full max-w-[560px] bg-white text-[#1E293B] border border-slate-300 rounded-[22px] p-5 sm:p-6 shadow-2xl max-h-[94vh] overflow-y-auto my-auto"
        >
          <div className="flex items-start justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10.5px] font-extrabold uppercase tracking-wide mb-1">
                Paso 1 de 2 · Configuración Rápida
              </span>
              <h2 className="m-0 text-[18px] font-extrabold text-slate-900" style={{ color: '#0f172a' }}>
                Preparar Contrato Legal
              </h2>
              <p className="m-0 text-[12px] text-slate-600 mt-0.5" style={{ color: '#475569' }}>
                Confirma cliente, obra, anticipo, entrega e IVA antes de revisar y generar el contrato
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Cerrar configuración de contrato"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer shrink-0"
              style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleConfirmSetupAndGenerate} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="inp-contrato-nombre" className="block text-[11.5px] font-extrabold text-slate-700 mb-1" style={{ color: '#334155' }}>
                  Nombre completo del Cliente *
                </label>
                <input
                  id="inp-contrato-nombre"
                  type="text"
                  required
                  value={cliente.nombre}
                  onChange={(e) => onUpdateCliente({ nombre: e.target.value })}
                  placeholder="Ejemplo Cliente"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="inp-contrato-dir" className="block text-[11.5px] font-extrabold text-slate-700 mb-1" style={{ color: '#334155' }}>
                  Dirección de la obra / instalación *
                </label>
                <input
                  id="inp-contrato-dir"
                  type="text"
                  required
                  value={cliente.direccion}
                  onChange={(e) => onUpdateCliente({ direccion: e.target.value })}
                  placeholder="Calle, número, colonia y municipio"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold bg-white"
                />
              </div>

              <div>
                <label htmlFor="inp-contrato-tel" className="block text-[11.5px] font-extrabold text-slate-700 mb-1" style={{ color: '#334155' }}>
                  WhatsApp / Teléfono del Cliente
                </label>
                <input
                  id="inp-contrato-tel"
                  type="tel"
                  value={cliente.telefono}
                  onChange={(e) => onUpdateCliente({ telefono: e.target.value })}
                  placeholder="333-333-4444"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 mono text-[13px] font-semibold bg-white"
                />
              </div>

              <div>
                <label htmlFor="inp-contrato-entrega" className="block text-[11.5px] font-extrabold text-slate-700 mb-1" style={{ color: '#334155' }}>
                  Fecha estimada de entrega
                </label>
                <input
                  id="inp-contrato-entrega"
                  type="date"
                  value={cliente.fechaEntregaEstimada || ''}
                  onChange={(e) => onUpdateCliente({ fechaEntregaEstimada: e.target.value })}
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13px] font-bold bg-white"
                />
              </div>
            </div>

            {/* Anticipo recibido ($) + cálculo automático de saldo restante */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex flex-col gap-2.5" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="inp-contrato-anticipo-mxn" className="text-[12px] font-extrabold text-slate-800" style={{ color: '#1e293b' }}>
                  Anticipo recibido ($ MXN)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[30, 50, 60, 100].map((pct) => {
                    const active = Math.abs(anticipoPctDisplay - pct) < 1;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          onUpdateCliente({
                            anticipoPct: pct,
                            anticipoRecibido: round2(total * (pct / 100)),
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold mono border cursor-pointer ${
                          active
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[14px]">
                    $
                  </span>
                  <input
                    id="inp-contrato-anticipo-mxn"
                    type="number"
                    min={0}
                    max={Math.max(0, round2(total))}
                    step={50}
                    value={anticipoMonto}
                    onChange={(e) => {
                      const monto = Math.max(0, Math.min(total, Number(e.target.value) || 0));
                      const pct = total > 0 ? round2((monto / total) * 100) : 0;
                      onUpdateCliente({
                        anticipoRecibido: monto,
                        anticipoPct: pct,
                      });
                    }}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-7 pr-3 mono text-[15px] font-extrabold bg-white"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[12px]" style={{ backgroundColor: '#ffffff' }}>
                  <span className="font-bold text-slate-600" style={{ color: '#475569' }}>Saldo Restante:</span>
                  <strong id="contrato-setup-saldo" className="mono text-[15px] font-black text-[#0B2545]" style={{ color: '#0B2545' }}>
                    {formatMXN(saldoMonto)}
                  </strong>
                </div>
              </div>

              {/* Interruptor opcional Incluir IVA (16%) */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="block text-[12.5px] font-extrabold text-slate-800" style={{ color: '#1e293b' }}>
                    Incluir IVA (16%)
                  </span>
                  <span className="block text-[11px] text-slate-500" style={{ color: '#64748b' }}>
                    Desactivado por defecto para presupuestos netos
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-contrato-iva-switch"
                  role="switch"
                  aria-checked={hoja.incluirIva}
                  onClick={() => onToggleIva(!hoja.incluirIva)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    hoja.incluirIva ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                      hoja.incluirIva ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center text-[11.5px]">
                <div>
                  <span className="block text-slate-500" style={{ color: '#64748b' }}>Subtotal</span>
                  <strong className="mono text-slate-800" style={{ color: '#1e293b' }}>{formatMXN(baseDesc)}</strong>
                </div>
                <div>
                  <span className="block text-slate-500" style={{ color: '#64748b' }}>IVA (16%)</span>
                  <strong className="mono text-slate-800" style={{ color: '#1e293b' }}>{formatMXN(ivaVal)}</strong>
                </div>
                <div>
                  <span className="block text-blue-700 font-bold" style={{ color: '#1d4ed8' }}>Gran Total</span>
                  <strong className="mono text-blue-700 font-black" style={{ color: '#1d4ed8' }}>{formatMXN(total)}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                id="btn-contrato-cancelar"
                onClick={handleCloseModal}
                style={{ backgroundColor: '#ffffff', color: '#334155' }}
                className="w-full min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[13px] font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-contrato-vista-previa"
                onClick={handleOpenPreviewDirect}
                className="w-full min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-[13px] font-black cursor-pointer shadow-sm"
              >
                👁 Vista previa
              </button>
              <button
                type="submit"
                id="btn-contrato-generar-vista"
                className="w-full min-h-[44px] px-4 rounded-xl bg-[#0B2545] hover:bg-[#133866] text-white text-[13px] font-extrabold cursor-pointer shadow-md"
              >
                Continuar al Documento →
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ==================== PASO 2: DOCUMENTO LEGAL LIMPIO (VISTA CARTA / PDF) ==================== */
        <div
          ref={previewCardRef}
          id="contrato-preview-container"
          data-preserve-light="true"
          style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
          className="w-full max-w-[880px] bg-slate-50 text-[#1E293B] border border-slate-300 rounded-[20px] p-3 sm:p-6 shadow-2xl max-h-[94vh] overflow-y-auto my-auto flex flex-col gap-4"
        >
          {/* Barra superior de edición rápida */}
          <div className="contrato-no-print flex items-start justify-between gap-2 pb-3 border-b border-slate-300">
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                id="btn-contrato-volver-datos"
                onClick={() => {
                  if (cleanPreview) {
                    setCleanPreview(false);
                  } else {
                    setPhase('setup');
                  }
                }}
                style={{ backgroundColor: '#e2e8f0', color: '#0f172a' }}
                className="min-h-[38px] px-3 rounded-xl border border-slate-300 bg-slate-200 hover:bg-slate-300 text-slate-900 text-[12px] font-extrabold cursor-pointer"
              >
                {cleanPreview ? '← Salir de vista previa' : '← Ajustar datos'}
              </button>
              {!cleanPreview && (
                <button
                  type="button"
                  onClick={() => setEditarClausulas((p) => !p)}
                  style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}
                  className="min-h-[38px] px-3 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[12px] font-extrabold cursor-pointer"
                >
                  {editarClausulas ? 'Ocultar cláusulas' : '✏️ Editar cláusulas'}
                </button>
              )}
              <button
                type="button"
                id="btn-contrato-vista-previa-doc"
                onClick={() => {
                  setEditarClausulas(false);
                  setCleanPreview((prev) => !prev);
                  if (previewCardRef.current) {
                    previewCardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}
                className="min-h-[38px] px-3 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[12px] font-extrabold cursor-pointer"
              >
                {cleanPreview ? '✏️ Editar vista' : '👁 Vista limpia'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              aria-label="Cerrar modal de contrato"
              style={{ backgroundColor: '#e2e8f0', color: '#0f172a' }}
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Editor opcional de proyecto y 4 cláusulas */}
          {editarClausulas && (
            <div
              className="contrato-no-print p-3.5 rounded-2xl bg-white border border-slate-300 flex flex-col gap-2.5"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[12.5px] text-[#0B2545]" style={{ color: '#0B2545' }}>
                  Editar Proyecto y Cláusulas Legales (1 a 4)
                </strong>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCliente({
                      clausulaAnticipo: DEFAULT_CONTRATO_CLAUSES.anticipo,
                      clausulaEntrega: DEFAULT_CONTRATO_CLAUSES.entrega,
                      clausulaCondicionesVano: DEFAULT_CONTRATO_CLAUSES.condicionesVano,
                      clausulaGarantia: DEFAULT_CONTRATO_CLAUSES.garantia,
                    })
                  }
                  className="text-[11px] font-bold text-blue-700 hover:underline bg-transparent border-0 cursor-pointer"
                >
                  Restablecer textos base
                </button>
              </div>
              <div>
                <label htmlFor="inp-contrato-proyecto" className="block text-[11px] font-bold text-slate-700 mb-1" style={{ color: '#334155' }}>
                  Referencia / Nombre del Proyecto
                </label>
                <input
                  id="inp-contrato-proyecto"
                  type="text"
                  value={hoja.proyecto}
                  onChange={(e) => onUpdateProyecto(e.target.value)}
                  placeholder="Ejemplo Cliente"
                  style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                  className="w-full min-h-[38px] rounded-xl border border-slate-300 px-3 text-[12.5px] font-semibold bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="txt-clausula-anticipo" className="block text-[11px] font-bold text-slate-700 mb-1" style={{ color: '#334155' }}>
                    1) Anticipo y Fabricación
                  </label>
                  <textarea
                    id="txt-clausula-anticipo"
                    rows={3}
                    value={cliente.clausulaAnticipo ?? ''}
                    onChange={(e) => onUpdateCliente({ clausulaAnticipo: e.target.value })}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-full rounded-xl border border-slate-300 p-2 text-[11.5px] bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="txt-clausula-entrega" className="block text-[11px] font-bold text-slate-700 mb-1" style={{ color: '#334155' }}>
                    2) Entrega e Instalación
                  </label>
                  <textarea
                    id="txt-clausula-entrega"
                    rows={3}
                    value={cliente.clausulaEntrega ?? ''}
                    onChange={(e) => onUpdateCliente({ clausulaEntrega: e.target.value })}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-full rounded-xl border border-slate-300 p-2 text-[11.5px] bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="txt-clausula-vano" className="block text-[11px] font-bold text-slate-700 mb-1" style={{ color: '#334155' }}>
                    3) Condiciones del Vano
                  </label>
                  <textarea
                    id="txt-clausula-vano"
                    rows={3}
                    value={cliente.clausulaCondicionesVano ?? ''}
                    onChange={(e) => onUpdateCliente({ clausulaCondicionesVano: e.target.value })}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-full rounded-xl border border-slate-300 p-2 text-[11.5px] bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="txt-clausula-garantia" className="block text-[11px] font-bold text-slate-700 mb-1" style={{ color: '#334155' }}>
                    4) Garantía
                  </label>
                  <textarea
                    id="txt-clausula-garantia"
                    rows={3}
                    value={cliente.clausulaGarantia ?? ''}
                    onChange={(e) => onUpdateCliente({ clausulaGarantia: e.target.value })}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="w-full rounded-xl border border-slate-300 p-2 text-[11.5px] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== DOCUMENTO LEGAL TAMAÑO CARTA (SIEMPRE PAPEL BLANCO ALTO CONTRASTE) ==================== */}
          <div
            id="contrato-print-area"
            data-preserve-light="true"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            className="w-full bg-white text-slate-900 border border-slate-300 rounded-2xl p-4 sm:p-7 shadow-sm"
          >
            {/* Encabezado Ejecutivo del Taller + Folio Único */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b-2 border-[#0B2545] w-full">
              <div className="flex items-start gap-3 w-full sm:flex-1 sm:min-w-[240px]">
                {taller.logoDataUrl ? (
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
                <div className="flex-1 min-w-0">
                  <div
                    style={{ color: '#1d4ed8' }}
                    className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider"
                  >
                    Contrato de Prestación de Servicios
                  </div>
                  <h1
                    id="contrato-header-taller-nombre"
                    style={{ color: '#0B2545' }}
                    className="m-0 text-[18px] sm:text-[19px] font-black text-[#0B2545] leading-snug break-normal"
                  >
                    {taller.nombre || 'Taller de Aluminio y Vidrio'}
                  </h1>
                  <div
                    id="contrato-header-taller-tel"
                    style={{ color: '#1e293b' }}
                    className="text-[12.5px] text-slate-800 font-bold mt-0.5"
                  >
                    Tel: <span className="mono">{taller.tel || 'Sin especificar'}</span>
                  </div>
                  {taller.ubicacion && (
                    <div
                      style={{ color: '#334155' }}
                      className="text-[11.5px] text-slate-700 font-semibold"
                    >
                      Ubicación: {taller.ubicacion}
                    </div>
                  )}
                </div>
              </div>

              <div
                id="contrato-folio-card"
                style={{ backgroundColor: '#0B2545', color: '#ffffff' }}
                className="contrato-folio-dark w-full sm:w-auto sm:min-w-[215px] sm:max-w-[295px] text-left sm:text-right bg-[#0B2545] border border-sky-400/40 rounded-xl px-4 py-3 shrink-0 shadow-sm"
              >
                <div
                  style={{ color: '#bae6fd' }}
                  className="contrato-folio-label text-[10.5px] font-extrabold uppercase tracking-wider text-sky-200"
                >
                  Folio de Contrato
                </div>
                <div
                  id="contrato-folio-badge"
                  style={{ color: '#ffffff' }}
                  className="mono text-[16px] font-black text-white mt-0.5"
                >
                  {folioActivo}
                </div>
                <div style={{ color: '#f8fafc' }} className="text-[11.5px] text-white mt-1.5 leading-snug">
                  Fecha: <strong style={{ color: '#ffffff' }} className="text-white font-extrabold">{fechaHoy}</strong>
                </div>
                <div style={{ color: '#f8fafc' }} className="text-[11.5px] text-white mt-0.5 leading-snug">
                  Entrega est.: <strong style={{ color: '#ffffff' }} className="text-white font-extrabold">{fechaEntregaTexto}</strong>
                </div>
              </div>
            </div>

            {/* Datos del Cliente y Obra */}
            <div
              style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
              className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-[12px]"
            >
              <div
                style={{ color: '#0B2545' }}
                className="font-extrabold text-[#0B2545] uppercase tracking-wide text-[11px] mb-1.5"
              >
                Datos del Cliente y Lugar de Obra
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-slate-800" style={{ color: '#1e293b' }}>
                <div className="break-words">
                  <strong>Cliente:</strong> {cliNombreFinal}
                </div>
                <div className="break-words">
                  <strong>Teléfono:</strong> {cliTelRaw || 'No especificado'}
                </div>
                <div className="sm:col-span-2 break-words">
                  <strong>Dirección de obra:</strong> {cliDirRaw || 'Por confirmar en sitio'}
                </div>
                {proyectoRaw && (
                  <div className="sm:col-span-2 break-words">
                    <strong>Referencia / Proyecto:</strong> {proyectoRaw}
                  </div>
                )}
              </div>
            </div>

            {/* Tabla de Trabajos Contratados con Dibujo Técnico Acotado */}
            <div className="mt-4 overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full border-collapse text-[12px] min-w-[560px]">
                <thead>
                  <tr style={{ backgroundColor: '#0B2545', color: '#ffffff' }} className="bg-[#0B2545] text-white text-left">
                    <th className="p-2.5 w-[124px]">Dibujo Acotado</th>
                    <th className="p-2.5">Descripción Técnica (Línea, Color y Vidrio/Espesor)</th>
                    <th className="p-2.5 text-center w-[68px]">Cant.</th>
                    <th className="p-2.5 text-right w-[112px]">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {partidasSafe.map((item, idx) => {
                    const linea = LINEAS_CONFIG[item.linea] || LINEAS_CONFIG['3'];
                    const color = COLORES_CONFIG[item.color] || COLORES_CONFIG.natural;
                    const panelDesc = getRellenoLabel(item.relleno, item.vidrio);
                    const apTxt =
                      linea.categoria === 'ventanas' && !linea.esMosquitero && !linea.esCancelBano
                        ? ` · ${APERTURA_DESC[item.apertura] || item.apertura || ''}`
                        : '';
                    const unitPrice = item.cantidad > 0 ? item.totalLinea / item.cantidad : item.totalLinea;
                    return (
                      <tr
                        key={item.id || `part-${idx}`}
                        style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                        className="border-b border-slate-200 last:border-b-0 bg-white"
                      >
                        <td className="p-2 align-middle">
                          <PartidaMiniSvg partida={item} width={112} height={84} />
                        </td>
                        <td className="p-2.5 align-middle">
                          <div style={{ color: '#0f172a' }} className="font-extrabold text-slate-900 text-[12.5px]">
                            {idx + 1}. {item.etiqueta ? `${item.etiqueta} · ` : ''}
                            {linea.nombre}
                            {apTxt}
                          </div>
                          <div style={{ color: '#334155' }} className="text-[11.5px] text-slate-700 mt-0.5">
                            Medidas: <strong className="mono">{item.anchoCm} × {item.altoCm} cm</strong>
                            {item.area ? ` · Área: ${item.area}` : ''}
                          </div>
                          <div style={{ color: '#475569' }} className="text-[11.5px] text-slate-600">
                            Color: <strong>{color.nombre}</strong> ·{' '}
                            {linea.esMosquitero ? 'Malla mosquitera' : `Vidrio / Panel: ${panelDesc}`}
                          </div>
                        </td>
                        <td style={{ color: '#0f172a' }} className="p-2.5 text-center align-middle mono font-bold text-slate-900">
                          {item.cantidad} pza
                        </td>
                        <td className="p-2.5 text-right align-middle">
                          <strong style={{ color: '#0B2545' }} className="mono font-extrabold text-[#0B2545] block">
                            {formatMXN(item.totalLinea)}
                          </strong>
                          {item.cantidad > 1 && (
                            <span style={{ color: '#64748b' }} className="mono text-[10.5px] text-slate-500">
                              {formatMXN(unitPrice)} c/u
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen de Pagos bien visible + Cláusulas Legales */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div
                style={{ backgroundColor: '#f8fafc', color: '#334155' }}
                className="md:col-span-7 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11.3px] text-slate-700 leading-relaxed flex flex-col gap-1.5"
              >
                <strong style={{ color: '#0B2545' }} className="block text-[#0B2545] text-[12px] uppercase tracking-wide">
                  Cláusulas del Contrato
                </strong>
                <div>
                  <strong style={{ color: '#0f172a' }}>1) Anticipo y Fabricación:</strong> {clausulaAnticipoText}
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>2) Entrega e Instalación:</strong> {clausulaEntregaText}
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>3) Condiciones del Vano:</strong> {clausulaVanoText}
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>4) Garantía:</strong> {clausulaGarantiaText}
                </div>
              </div>

              <div
                style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                className="md:col-span-5 p-4 rounded-xl bg-slate-50 border-[1.5px] border-slate-300 text-[12.5px]"
              >
                <div style={{ color: '#0B2545' }} className="text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wide mb-2">
                  Resumen de Pagos
                </div>
                <div className="flex justify-between py-0.5 text-slate-700" style={{ color: '#334155' }}>
                  <span>Subtotal</span>
                  <strong className="mono text-slate-900" style={{ color: '#0f172a' }}>{formatMXN(subtotal)}</strong>
                </div>
                {descuentoVal > 0 && (
                  <div className="flex justify-between py-0.5 text-emerald-700" style={{ color: '#047857' }}>
                    <span>Descuento ({hoja.descuentoPct}%)</span>
                    <strong className="mono">-{formatMXN(descuentoVal)}</strong>
                  </div>
                )}
                {ivaVal > 0 && (
                  <div className="flex justify-between py-0.5 text-slate-700" style={{ color: '#334155' }}>
                    <span>IVA (16%)</span>
                    <strong className="mono text-slate-900" style={{ color: '#0f172a' }}>{formatMXN(ivaVal)}</strong>
                  </div>
                )}
                <div
                  style={{ color: '#0B2545' }}
                  className="flex justify-between items-baseline pt-2 mt-1.5 border-t border-slate-300 font-black text-[15px] text-[#0B2545]"
                >
                  <span>GRAN TOTAL</span>
                  <span className="mono text-[17px]">{formatMXN(total)}</span>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-300 text-[12px] flex flex-col gap-1.5">
                  <div className="flex justify-between text-emerald-800" style={{ color: '#065f46' }}>
                    <span>Anticipo Recibido ({anticipoPctDisplay}%)</span>
                    <strong className="mono">{formatMXN(anticipoMonto)}</strong>
                  </div>
                  <div
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-extrabold"
                  >
                    <span className="text-[11.5px]">Saldo a liquidar contra entrega</span>
                    <strong className="mono text-[14.5px] text-[#0B2545]" style={{ color: '#0B2545' }}>
                      {formatMXN(saldoMonto)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de página con DOS bloques interactivos de firma (Prestador + Cliente) */}
            <div className="contrato-signatures mt-8 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-[11.5px] text-slate-700">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  id="btn-contrato-box-firma-prestador"
                  onClick={() => setSignatureTarget('provider')}
                  style={{ backgroundColor: '#f8fafc' }}
                  className="w-full max-w-[260px] h-16 border-b-2 border-slate-600 rounded-t-lg hover:bg-slate-100 flex items-center justify-center px-2 mb-1.5 cursor-pointer transition-colors"
                >
                  {providerSignatureUrl ? (
                    <img
                      src={providerSignatureUrl}
                      alt="Firma del prestador de servicios"
                      className="max-h-14 max-w-[200px] object-contain"
                    />
                  ) : (
                    <span style={{ color: '#64748b' }} className="text-[11px] font-bold italic">
                      Toca aquí para firmar (Prestador)
                    </span>
                  )}
                </button>
                <strong style={{ color: '#0f172a' }} className="block text-slate-900 uppercase">
                  El Prestador del Servicio
                </strong>
                <span style={{ color: '#334155' }} className="break-words font-semibold">
                  {taller.nombre || 'Taller de Aluminio y Vidrio'}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <button
                  type="button"
                  id="btn-contrato-box-firma-cliente"
                  onClick={() => setSignatureTarget('client')}
                  style={{ backgroundColor: '#f8fafc' }}
                  className="w-full max-w-[260px] h-16 border-b-2 border-slate-600 rounded-t-lg hover:bg-slate-100 flex items-center justify-center px-2 mb-1.5 cursor-pointer transition-colors"
                >
                  {clientSignatureUrl ? (
                    <img
                      src={clientSignatureUrl}
                      alt="Firma del cliente"
                      className="max-h-14 max-w-[200px] object-contain"
                    />
                  ) : (
                    <span style={{ color: '#64748b' }} className="text-[11px] font-bold italic">
                      Toca aquí para firmar (Cliente)
                    </span>
                  )}
                </button>
                <strong style={{ color: '#0f172a' }} className="block text-slate-900 uppercase">
                  El Cliente
                </strong>
                <span style={{ color: '#334155' }} className="break-words font-semibold">
                  {cliNombreFinal}
                </span>
              </div>
            </div>
          </div>

          {/* Barra inferior fija: Firmas + Generar Contrato (Naranja -> Verde) + Guardar PDF + WhatsApp (sin Imprimir) */}
          <div className="contrato-no-print sticky bottom-0 z-10 -mx-3 sm:-mx-6 -mb-3 sm:-mb-6 px-3 sm:px-6 pt-3 pb-4 rounded-b-[19px] bg-[#0f172a] border-t border-slate-700 flex flex-col gap-2.5">
            {gateAlertMsg && (
              <div
                id="contrato-gate-alert"
                role="alert"
                className="px-3 py-2 rounded-xl border border-amber-400/70 bg-amber-500/20 text-amber-100 text-[12px] font-extrabold text-center"
              >
                ⚠️ {gateAlertMsg}
              </div>
            )}

            {/* Fila de firmas (Prestador y Cliente) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-contrato-firmar-prestador"
                onClick={() => setSignatureTarget('provider')}
                className={`min-h-[40px] px-3 rounded-xl border text-[11.5px] sm:text-[12px] font-extrabold cursor-pointer transition-colors ${
                  providerSignatureUrl
                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
                    : 'border-amber-400/60 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
                }`}
              >
                {providerSignatureUrl ? '✓ Firma Prestador' : '✍️ Firma Prestador'}
              </button>
              <button
                type="button"
                id="btn-contrato-firmar-cliente"
                onClick={() => setSignatureTarget('client')}
                className={`min-h-[40px] px-3 rounded-xl border text-[11.5px] sm:text-[12px] font-extrabold cursor-pointer transition-colors ${
                  clientSignatureUrl
                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
                    : 'border-amber-400/60 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
                }`}
              >
                {clientSignatureUrl ? '✓ Firma Cliente' : '✍️ Firma Cliente'}
              </button>
            </div>

            {/* Fila principal de acciones: Generar Contrato -> Guardar PDF -> WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-contrato-generar"
                disabled={generatingContract}
                data-generated={generatedContract ? 'true' : 'false'}
                onClick={() => void handleGenerateContractPdf()}
                className={`min-h-[46px] px-3.5 rounded-xl border text-[13px] font-black cursor-pointer transition-all shadow-sm disabled:opacity-60 ${
                  generatedContract
                    ? 'bg-emerald-500/20 border-emerald-500/65 hover:bg-emerald-500/30 text-emerald-100'
                    : 'bg-orange-500/20 border-orange-500/65 hover:bg-orange-500/30 text-orange-100'
                }`}
              >
                {generatingContract
                  ? '⏳ Generando...'
                  : generatedContract
                    ? '✓ Contrato Generado'
                    : '📝 Generar Contrato'}
              </button>

              <button
                type="button"
                id="btn-contrato-pdf"
                aria-disabled={!generatedContract}
                onClick={handleSaveGeneratedPdf}
                className={`min-h-[46px] px-3.5 rounded-xl border text-[13px] font-extrabold cursor-pointer transition-all shadow-sm ${
                  generatedContract
                    ? 'border-blue-400/65 bg-blue-600 hover:bg-blue-500 text-white'
                    : 'border-slate-600 bg-slate-800/70 text-slate-400 opacity-65'
                }`}
              >
                📄 Guardar PDF
              </button>

              <button
                type="button"
                id="btn-contrato-whatsapp"
                aria-disabled={!generatedContract}
                onClick={() => void handleShareWhatsApp()}
                className={`min-h-[46px] px-3.5 rounded-xl border text-[13px] font-extrabold cursor-pointer transition-all shadow-sm ${
                  generatedContract
                    ? 'border-emerald-400/65 bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'border-slate-600 bg-slate-800/70 text-slate-400 opacity-65'
                }`}
              >
                💬 WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <SignaturePadModal
        open={signatureTarget !== null}
        title={
          signatureTarget === 'provider'
            ? 'Firma del Prestador de Servicios'
            : 'Firma del Cliente en Contrato'
        }
        subtitle={
          signatureTarget === 'provider'
            ? 'Esta firma aparecerá del lado del taller/prestador en el contrato y en el PDF.'
            : 'Esta firma aparecerá del lado del cliente en el contrato y en el PDF.'
        }
        initialSignature={
          signatureTarget === 'provider' ? providerSignatureUrl : clientSignatureUrl
        }
        onApply={(croppedPng) => {
          if (signatureTarget === 'provider') {
            setProviderSignatureUrl(croppedPng);
            onShowToast('Firma del Prestador agregada al contrato', true);
          } else if (signatureTarget === 'client') {
            setClientSignatureUrl(croppedPng);
            onShowToast('Firma del Cliente agregada al contrato', true);
          }
          setSignatureTarget(null);
        }}
        onClose={() => setSignatureTarget(null)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
