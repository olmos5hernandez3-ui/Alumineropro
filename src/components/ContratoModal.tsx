import React, { useEffect, useState } from 'react';
import {
  getColorCorto,
  getColorNombre,
  getRellenoLabel,
  LINEAS_CONFIG,
  round2,
} from '../utils/alumineroLogic';
import { generarPdfContratoServicio } from '../utils/pdfExport';
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
  const [folioActivo, setFolioActivo] = useState<string>(() => peekNextContratoFolio());
  const [editarClausulas, setEditarClausulas] = useState(false);
  const [signaturePadOpen, setSignaturePadOpen] = useState(false);
  const [clientSignatureUrl, setClientSignatureUrl] = useState<string>('');

  useEffect(() => {
    if (open) {
      setPhase('setup');
      setEditarClausulas(false);
      setSignaturePadOpen(false);
      setClientSignatureUrl('');
      setFolioActivo(peekNextContratoFolio());
    }
  }, [open]);

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

  const cliNombreFinal =
    cliente.nombre.trim() || hoja.proyecto.trim() || 'Cliente por confirmar';

  const clausulaAnticipoText =
    cliente.clausulaAnticipo?.trim() || DEFAULT_CONTRATO_CLAUSES.anticipo;
  const clausulaEntregaText =
    cliente.clausulaEntrega?.trim() || DEFAULT_CONTRATO_CLAUSES.entrega;
  const clausulaVanoText =
    cliente.clausulaCondicionesVano?.trim() || DEFAULT_CONTRATO_CLAUSES.condicionesVano;
  const clausulaGarantiaText =
    cliente.clausulaGarantia?.trim() || DEFAULT_CONTRATO_CLAUSES.garantia;

  const handleConfirmSetupAndGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const folioNuevo = issueNextContratoFolio();
    setFolioActivo(folioNuevo);
    onUpdateCliente({ folio: folioNuevo });
    setPhase('preview');
  };

  const handleShareWhatsApp = async () => {
    const lines = [
      `*CONTRATO DE SERVICIOS — ${folioActivo}*`,
      `*Taller:* ${taller.nombre || 'Aluminero Pro'}`,
      taller.tel ? `Tel: ${taller.tel}` : '',
      taller.ubicacion ? `Ubicación: ${taller.ubicacion}` : '',
      '',
      `*Cliente:* ${cliNombreFinal}`,
      cliente.direccion.trim() ? `*Obra:* ${cliente.direccion.trim()}` : '',
      `*Entrega estimada:* ${fechaEntregaTexto}`,
      '',
      '*Trabajos contratados:*',
      ...hoja.partidas.map((item, idx) => {
        const l = LINEAS_CONFIG[item.linea];
        const colorTxt = getColorCorto(item.color, item.colorCustom);
        const rel = l.esMosquitero ? 'Malla mosquitera' : getRellenoLabel(item.relleno, item.vidrio);
        return `${idx + 1}. ${item.etiqueta ? `${item.etiqueta} - ` : ''}${l.nombre} (${item.anchoCm}×${item.altoCm} cm, ${colorTxt}, ${rel}) ×${item.cantidad} = ${formatMXN(item.totalLinea)}`;
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
    const cleanPhone = (cliente.telefono || '').replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Contrato ${folioActivo} — ${cliNombreFinal}`,
          text,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();

    try {
      await navigator.clipboard.writeText(text);
      onShowToast('Resumen copiado y enviado a WhatsApp', true);
    } catch {
      onShowToast('Abriendo resumen en WhatsApp', true);
    }
  };

  return (
    <div
      id="modal-contrato"
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Contrato de Prestación de Servicios"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ==================== PASO 1: CONFIGURACIÓN RÁPIDA ANTES DE GENERAR ==================== */}
      {phase === 'setup' ? (
        <div className="contrato-no-print w-full max-w-[560px] bg-white text-[#1E293B] border border-slate-300 rounded-[22px] p-5 sm:p-6 shadow-2xl max-h-[94vh] overflow-y-auto my-auto">
          <div className="flex items-start justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10.5px] font-extrabold uppercase tracking-wide mb-1">
                Paso 1 de 2 · Configuración Rápida
              </span>
              <h2 className="m-0 text-[18px] font-extrabold text-slate-900">
                Preparar Contrato Legal
              </h2>
              <p className="m-0 text-[12px] text-slate-600 mt-0.5">
                Confirma cliente, obra, anticipo, entrega e IVA antes de generar el documento Carta
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar configuración de contrato"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleConfirmSetupAndGenerate} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="inp-contrato-nombre" className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                  Nombre completo del Cliente *
                </label>
                <input
                  id="inp-contrato-nombre"
                  type="text"
                  required
                  value={cliente.nombre}
                  onChange={(e) => onUpdateCliente({ nombre: e.target.value })}
                  placeholder="Ej. Arq. Carlos Mendoza López"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="inp-contrato-dir" className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                  Dirección de la obra / instalación *
                </label>
                <input
                  id="inp-contrato-dir"
                  type="text"
                  required
                  value={cliente.direccion}
                  onChange={(e) => onUpdateCliente({ direccion: e.target.value })}
                  placeholder="Calle, número, colonia y municipio"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold bg-white"
                />
              </div>

              <div>
                <label htmlFor="inp-contrato-tel" className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                  WhatsApp / Teléfono del Cliente
                </label>
                <input
                  id="inp-contrato-tel"
                  type="tel"
                  value={cliente.telefono}
                  onChange={(e) => onUpdateCliente({ telefono: e.target.value })}
                  placeholder="Ej. 55 1234 5678"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 mono text-[13px] font-semibold bg-white"
                />
              </div>

              <div>
                <label htmlFor="inp-contrato-entrega" className="block text-[11.5px] font-extrabold text-slate-700 mb-1">
                  Fecha estimada de entrega
                </label>
                <input
                  id="inp-contrato-entrega"
                  type="date"
                  value={cliente.fechaEntregaEstimada || ''}
                  onChange={(e) => onUpdateCliente({ fechaEntregaEstimada: e.target.value })}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13px] font-bold bg-white"
                />
              </div>
            </div>

            {/* Anticipo recibido ($) + cálculo automático de saldo restante */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="inp-contrato-anticipo-mxn" className="text-[12px] font-extrabold text-slate-800">
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
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-7 pr-3 mono text-[15px] font-extrabold bg-white"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[12px]">
                  <span className="font-bold text-slate-600">Saldo Restante:</span>
                  <strong id="contrato-setup-saldo" className="mono text-[15px] font-black text-[#0B2545]">
                    {formatMXN(saldoMonto)}
                  </strong>
                </div>
              </div>

              {/* Interruptor opcional Incluir IVA (16%) */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="block text-[12.5px] font-extrabold text-slate-800">
                    Incluir IVA (16%)
                  </span>
                  <span className="block text-[11px] text-slate-500">
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
                  <span className="block text-slate-500">Subtotal</span>
                  <strong className="mono text-slate-800">{formatMXN(baseDesc)}</strong>
                </div>
                <div>
                  <span className="block text-slate-500">IVA (16%)</span>
                  <strong className="mono text-slate-800">{formatMXN(ivaVal)}</strong>
                </div>
                <div>
                  <span className="block text-blue-700 font-bold">Gran Total</span>
                  <strong className="mono text-blue-700 font-black">{formatMXN(total)}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-[13px] font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-contrato-generar-vista"
                className="min-h-[46px] px-5 rounded-xl bg-[#0B2545] hover:bg-[#133866] text-white text-[13.5px] font-extrabold cursor-pointer shadow-md"
              >
                Generar Documento Carta →
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ==================== PASO 2: DOCUMENTO LEGAL LIMPIO (VISTA CARTA / PDF) ==================== */
        <div className="w-full max-w-[850px] bg-white text-[#1E293B] border border-slate-300 rounded-[20px] p-3 sm:p-6 shadow-2xl max-h-[94vh] overflow-y-auto my-auto flex flex-col gap-4">
          {/* Barra superior de edición rápida (oculta al imprimir) */}
          <div className="contrato-no-print flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="min-h-[36px] px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-extrabold cursor-pointer"
              >
                ← Ajustar datos
              </button>
              <button
                type="button"
                onClick={() => setEditarClausulas((p) => !p)}
                className="min-h-[36px] px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[12px] font-extrabold cursor-pointer"
              >
                {editarClausulas ? 'Ocultar editor de cláusulas' : '✏️ Editar cláusulas'}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal de contrato"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Editor opcional de proyecto y 4 cláusulas (oculto al imprimir) */}
          {editarClausulas && (
            <div className="contrato-no-print p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-[12.5px] text-[#0B2545]">
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
                <label htmlFor="inp-contrato-proyecto" className="block text-[11px] font-bold text-slate-600 mb-1">
                  Referencia / Nombre del Proyecto
                </label>
                <input
                  id="inp-contrato-proyecto"
                  type="text"
                  value={hoja.proyecto}
                  onChange={(e) => onUpdateProyecto(e.target.value)}
                  placeholder="Ej. Ventanería Residencial"
                  className="w-full min-h-[38px] rounded-xl border border-slate-300 px-3 text-[12.5px] font-semibold bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="txt-clausula-anticipo" className="block text-[11px] font-bold text-slate-600 mb-1">
                    1) Anticipo y Fabricación
                  </label>
                  <textarea
                    id="txt-clausula-anticipo"
                    rows={3}
                    value={cliente.clausulaAnticipo ?? ''}
                    onChange={(e) => onUpdateCliente({ clausulaAnticipo: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-[11.5px] bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="txt-clausula-entrega" className="block text-[11px] font-bold text-slate-600 mb-1">
                    2) Entrega e Instalación
                  </label>
                  <textarea
                    id="txt-clausula-entrega"
                    rows={3}
                    value={cliente.clausulaEntrega ?? ''}
                    onChange={(e) => onUpdateCliente({ clausulaEntrega: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-[11.5px] bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="txt-clausula-vano" className="block text-[11px] font-bold text-slate-600 mb-1">
                    3) Condiciones del Vano
                  </label>
                  <textarea
                    id="txt-clausula-vano"
                    rows={3}
                    value={cliente.clausulaCondicionesVano ?? ''}
                    onChange={(e) => onUpdateCliente({ clausulaCondicionesVano: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-[11.5px] bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="txt-clausula-garantia" className="block text-[11px] font-bold text-slate-600 mb-1">
                    4) Garantía
                  </label>
                  <textarea
                    id="txt-clausula-garantia"
                    rows={3}
                    value={cliente.clausulaGarantia ?? ''}
                    onChange={(e) => onUpdateCliente({ clausulaGarantia: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-[11.5px] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== DOCUMENTO LEGAL TAMAÑO CARTA ==================== */}
          <div
            id="contrato-print-area"
            data-preserve-light="true"
            className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-5 sm:p-7 shadow-sm"
          >
            {/* Encabezado Ejecutivo del Taller + Folio Único */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-[#0B2545]">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {taller.logoDataUrl ? (
                  <img
                    src={taller.logoDataUrl}
                    alt="Logo del taller"
                    className="w-16 h-16 rounded-xl object-contain border border-slate-200 bg-white shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#0B2545] text-white flex items-center justify-center font-black text-[18px] shrink-0">
                    AP
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider">
                    Contrato de Prestación de Servicios
                  </div>
                  <h1 className="m-0 text-[18px] font-black text-[#0B2545] leading-tight break-words">
                    {taller.nombre || 'Taller de Aluminio y Vidrio'}
                  </h1>
                  <div className="text-[12px] text-slate-700 font-semibold mt-0.5 break-words">
                    Tel: <span className="mono">{taller.tel || 'Sin especificar'}</span>
                  </div>
                  {taller.ubicacion && (
                    <div className="text-[11.5px] text-slate-600 break-words">
                      Ubicación: {taller.ubicacion}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 shrink-0">
                <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Folio de Contrato
                </div>
                <div id="contrato-folio-badge" className="mono text-[15px] font-black text-[#0B2545]">
                  {folioActivo}
                </div>
                <div className="text-[11.5px] text-slate-700 mt-1">
                  Fecha: <strong>{fechaHoy}</strong>
                </div>
                <div className="text-[11.5px] text-slate-700">
                  Entrega est.: <strong>{fechaEntregaTexto}</strong>
                </div>
              </div>
            </div>

            {/* Datos del Cliente y Obra */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-[12px]">
              <div className="font-extrabold text-[#0B2545] uppercase tracking-wide text-[11px] mb-1.5">
                Datos del Cliente y Lugar de Obra
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-slate-800">
                <div className="break-words">
                  <strong>Cliente:</strong> {cliNombreFinal}
                </div>
                <div className="break-words">
                  <strong>Teléfono:</strong> {cliente.telefono.trim() || 'No especificado'}
                </div>
                <div className="sm:col-span-2 break-words">
                  <strong>Dirección de obra:</strong> {cliente.direccion.trim() || 'Por confirmar en sitio'}
                </div>
                {hoja.proyecto.trim() && (
                  <div className="sm:col-span-2 break-words">
                    <strong>Referencia / Proyecto:</strong> {hoja.proyecto.trim()}
                  </div>
                )}
              </div>
            </div>

            {/* Tabla de Trabajos Contratados con Dibujo Técnico Acotado */}
            <div className="mt-4 overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full border-collapse text-[12px] min-w-[560px]">
                <thead>
                  <tr className="bg-[#0B2545] text-white text-left">
                    <th className="p-2.5 w-[124px]">Dibujo Acotado</th>
                    <th className="p-2.5">Descripción Técnica (Línea, Color y Vidrio/Espesor)</th>
                    <th className="p-2.5 text-center w-[68px]">Cant.</th>
                    <th className="p-2.5 text-right w-[112px]">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {hoja.partidas.map((item, idx) => {
                    const linea = LINEAS_CONFIG[item.linea];
                    const colorNombre = getColorNombre(item.color, item.colorCustom);
                    const panelDesc = getRellenoLabel(item.relleno, item.vidrio);
                    const apTxt =
                      linea.categoria === 'ventanas' && !linea.esMosquitero && !linea.esCancelBano
                        ? ` · ${APERTURA_DESC[item.apertura] || item.apertura}`
                        : '';
                    const unitPrice = item.cantidad > 0 ? item.totalLinea / item.cantidad : item.totalLinea;
                    return (
                      <tr key={item.id} className="border-b border-slate-200 last:border-b-0 bg-white">
                        <td className="p-2 align-middle">
                          <PartidaMiniSvg partida={item} width={112} height={84} />
                        </td>
                        <td className="p-2.5 align-middle">
                          <div className="font-extrabold text-slate-900 text-[12.5px]">
                            {idx + 1}. {item.etiqueta ? `${item.etiqueta} · ` : ''}
                            {linea.nombre}
                            {apTxt}
                          </div>
                          <div className="text-[11.5px] text-slate-700 mt-0.5">
                            Medidas: <strong className="mono">{item.anchoCm} × {item.altoCm} cm</strong>
                            {item.area ? ` · Área: ${item.area}` : ''}
                          </div>
                          <div className="text-[11.5px] text-slate-600">
                            Color: <strong>{colorNombre}</strong> ·{' '}
                            {linea.esMosquitero ? 'Malla mosquitera' : `Vidrio / Panel: ${panelDesc}`}
                          </div>
                        </td>
                        <td className="p-2.5 text-center align-middle mono font-bold text-slate-900">
                          {item.cantidad} pza
                        </td>
                        <td className="p-2.5 text-right align-middle">
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
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumen de Pagos bien visible + Cláusulas Legales */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-7 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11.3px] text-slate-700 leading-relaxed flex flex-col gap-1.5">
                <strong className="block text-[#0B2545] text-[12px] uppercase tracking-wide">
                  Cláusulas del Contrato
                </strong>
                <div>
                  <strong>1) Anticipo y Fabricación:</strong> {clausulaAnticipoText}
                </div>
                <div>
                  <strong>2) Entrega e Instalación:</strong> {clausulaEntregaText}
                </div>
                <div>
                  <strong>3) Condiciones del Vano:</strong> {clausulaVanoText}
                </div>
                <div>
                  <strong>4) Garantía:</strong> {clausulaGarantiaText}
                </div>
              </div>

              <div className="md:col-span-5 p-4 rounded-xl bg-slate-50 border-[1.5px] border-slate-300 text-[12.5px]">
                <div className="text-[11px] font-extrabold text-[#0B2545] uppercase tracking-wide mb-2">
                  Resumen de Pagos
                </div>
                <div className="flex justify-between py-0.5 text-slate-700">
                  <span>Subtotal</span>
                  <strong className="mono text-slate-900">{formatMXN(subtotal)}</strong>
                </div>
                {descuentoVal > 0 && (
                  <div className="flex justify-between py-0.5 text-emerald-700">
                    <span>Descuento ({hoja.descuentoPct}%)</span>
                    <strong className="mono">-{formatMXN(descuentoVal)}</strong>
                  </div>
                )}
                {ivaVal > 0 && (
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span>IVA (16%)</span>
                    <strong className="mono text-slate-900">{formatMXN(ivaVal)}</strong>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 mt-1.5 border-t border-slate-300 font-black text-[15px] text-[#0B2545]">
                  <span>GRAN TOTAL</span>
                  <span className="mono text-[17px]">{formatMXN(total)}</span>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-300 text-[12px] flex flex-col gap-1.5">
                  <div className="flex justify-between text-emerald-800">
                    <span>Anticipo Recibido ({anticipoPctDisplay}%)</span>
                    <strong className="mono">{formatMXN(anticipoMonto)}</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-extrabold">
                    <span className="text-[11.5px]">Saldo a liquidar contra entrega</span>
                    <strong className="mono text-[14.5px] text-[#0B2545]">{formatMXN(saldoMonto)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de página con dos bloques de firma */}
            <div className="contrato-signatures mt-10 pt-4 grid grid-cols-2 gap-6 text-center text-[11.5px] text-slate-700">
              <div>
                <div className="h-14 border-b border-slate-600 mx-4 mb-1.5" />
                <strong className="block text-slate-900 uppercase">El Prestador del Servicio</strong>
                <span className="break-words">{taller.nombre || 'Taller de Aluminio y Vidrio'}</span>
              </div>
              <div>
                <div className="h-14 border-b border-slate-600 mx-4 mb-1.5 flex items-end justify-center pb-1">
                  {clientSignatureUrl ? (
                    <img
                      src={clientSignatureUrl}
                      alt="Firma del cliente"
                      className="max-h-12 max-w-[160px] object-contain"
                    />
                  ) : null}
                </div>
                <strong className="block text-slate-900 uppercase">El Cliente</strong>
                <span className="break-words">{cliNombreFinal}</span>
              </div>
            </div>
          </div>

          {/* Botones flotantes inferiores (ocultos al imprimir) */}
          <div className="contrato-no-print sticky bottom-0 z-10 -mx-3 sm:-mx-6 -mb-3 sm:-mb-6 px-3 sm:px-6 py-3 bg-white/95 backdrop-blur border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              id="btn-contrato-firmar"
              onClick={() => setSignaturePadOpen(true)}
              className="min-h-[44px] px-4 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer"
            >
              {clientSignatureUrl ? '✍️ Cambiar firma' : '✍️ Firmar cliente'}
            </button>
            <button
              type="button"
              id="btn-contrato-whatsapp"
              onClick={handleShareWhatsApp}
              className="min-h-[44px] px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer shadow-sm"
            >
              💬 Compartir Resumen por WhatsApp
            </button>
            <button
              type="button"
              id="btn-contrato-pdf"
              onClick={() => {
                if (hoja.partidas.length === 0) {
                  onShowToast('Agrega al menos una partida para generar el contrato PDF');
                  return;
                }
                void generarPdfContratoServicio(
                  hoja,
                  taller,
                  cliente,
                  folioActivo,
                  clientSignatureUrl || undefined
                ).then(() => {
                  onShowToast(`PDF Contrato ${folioActivo} descargado`, true);
                });
              }}
              className="min-h-[44px] px-4 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer"
            >
              📄 Descargar PDF
            </button>
            <button
              type="button"
              id="btn-contrato-print"
              onClick={() => window.print()}
              className="min-h-[44px] px-5 rounded-xl bg-[#0B2545] hover:bg-[#133866] text-white text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer shadow-md"
            >
              🖨️ Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      )}

      <SignaturePadModal
        open={signaturePadOpen}
        title="Firma del Cliente en Contrato"
        subtitle="La firma se incluirá en el documento y en el PDF del contrato."
        initialSignature={clientSignatureUrl}
        onApply={(croppedPng) => {
          setClientSignatureUrl(croppedPng);
          onShowToast('Firma agregada al contrato', true);
        }}
        onClose={() => setSignaturePadOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
