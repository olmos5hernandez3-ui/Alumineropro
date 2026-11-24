import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  buildWhatsAppDirectUrl,
  COLORES_CONFIG,
  consolidarMaterialesObra,
  formatClientPhoneInput,
  getRellenoLabel,
  LINEAS_CONFIG,
  PartidaObra,
  PRE_CUT_WARNING_TEXT,
  round2,
} from '../utils/alumineroLogic';
import { optimizarPartidasTramos1D } from '../utils/modulacionLogic';
import {
  CotizacionPdfBlobResult,
  generarPdfOrdenProduccionTaller,
} from '../utils/pdfExport';
import {
  ClienteGuardado,
  ContratoClienteInfo,
  DEFAULT_HOJA_CONDITIONS,
  formatMXN,
  getPerfilFotoUrl,
  HojaState,
  loadClientes,
  ObraAprobadaApartado,
  PartidaObraExtended,
  peekNextCotizacionFolio,
  PerfilFotosMap,
  recordCotizacionGuardada,
  SobranteItem,
  TallerConfig,
  upsertCliente,
} from '../utils/storageHelpers';
import { enqueueOfflineCotizacion } from '../utils/offlineSyncQueue';
import {
  CotizacionReminder,
  CotizacionReminderStatus,
} from '../utils/pushReminders';
import { ContratoModal } from './ContratoModal';
import { CotizacionRemindersPanel } from './CotizacionRemindersPanel';
import { ErrorBoundary } from './ErrorBoundary';
import { PartidaMiniSvg } from './PartidaMiniSvg';
import { PdfHeaderCustomizerModal, PdfHeaderPreview } from './PdfHeaderCustomizer';
import { PerfilSectionSvg } from './PerfilSectionSvg';

const LazyPdfPreviewModal = lazy(() =>
  import('./PdfPreviewModal').then((m) => ({ default: m.PdfPreviewModal }))
);

const APERTURA_PREVIEW_LABELS: Record<string, string> = {
  corrediza: 'Corrediza',
  fija: 'Fija',
  guillotina: 'Guillotina',
  abatible: 'Abatible',
  banderola: 'Banderola',
  oscilobatiente: 'Oscilobatiente',
  plegable: 'Plegable',
};

interface Props {
  hoja: HojaState;
  taller: TallerConfig;
  contratoCliente: ContratoClienteInfo;
  inventario: Record<string, number>;
  sobrantes?: SobranteItem[];
  obrasAprobadas: ObraAprobadaApartado[];
  perfilFotos: PerfilFotosMap;
  onUpdateHoja: (patch: Partial<HojaState>) => void;
  onUpdateTaller?: (patch: Partial<TallerConfig>) => void;
  onUpdateContratoCliente: (patch: Partial<ContratoClienteInfo>) => void;
  onEditarPartida: (p: PartidaObra) => void;
  onEliminarPartida: (id: string) => void;
  onVaciarHoja: () => void;
  onAgregarPieza: () => void;
  onApartarStockObra: (rows: ReturnType<typeof consolidarMaterialesObra>) => void;
  onDescontarInventarioObra: (rows: ReturnType<typeof consolidarMaterialesObra>) => void;
  onAddSobrante?: (item: Omit<SobranteItem, 'id' | 'fecha'>) => void;
  onOpenGlassOptimizer?: () => void;
  onPushSubModal?: (sub: 'contrato') => void;
  onRequestBack?: () => void;
  onRegisterCloseSubModal?: (fn: (() => void) | null) => void;
  reminders?: CotizacionReminder[];
  highlightedReminderId?: string | null;
  onAddReminder?: (reminder: CotizacionReminder) => void;
  onUpdateReminderStatus?: (id: string, status: CotizacionReminderStatus) => void;
  onSnoozeReminder?: (id: string) => void;
  onDeleteReminder?: (id: string) => void;
  onNotifyReminderNow?: (reminder: CotizacionReminder) => Promise<void>;
  onTestPushNotification?: () => Promise<void>;
  onRequestPushPermission?: () => Promise<NotificationPermission | 'unsupported'>;
  onRecordFinalPdf?: (res: CotizacionPdfBlobResult) => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const HojaCotizacionView: React.FC<Props> = ({
  hoja,
  taller,
  contratoCliente,
  inventario,
  sobrantes = [],
  obrasAprobadas,
  perfilFotos,
  onUpdateHoja,
  onUpdateTaller,
  onUpdateContratoCliente,
  onEditarPartida,
  onEliminarPartida,
  onVaciarHoja,
  onAgregarPieza,
  onApartarStockObra,
  onDescontarInventarioObra,
  onAddSobrante,
  onOpenGlassOptimizer,
  onPushSubModal,
  onRequestBack,
  onRegisterCloseSubModal,
  reminders = [],
  highlightedReminderId = null,
  onAddReminder,
  onUpdateReminderStatus,
  onSnoozeReminder,
  onDeleteReminder,
  onNotifyReminderNow,
  onTestPushNotification,
  onRequestPushPermission,
  onRecordFinalPdf,
  onShowToast,
}) => {
  const [showDespieceObra, setShowDespieceObra] = useState(false);
  const [contratoOpen, setContratoOpen] = useState(false);
  const [pdfHeaderModalOpen, setPdfHeaderModalOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [currentFolio, setCurrentFolio] = useState<string>(() => peekNextCotizacionFolio());
  const [clientesGuardados, setClientesGuardados] = useState<ClienteGuardado[]>(() => loadClientes());
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  useEffect(() => {
    if (!onRegisterCloseSubModal) return;
    onRegisterCloseSubModal(() => {
      setContratoOpen(false);
    });
    return () => onRegisterCloseSubModal(null);
  }, [onRegisterCloseSubModal]);

  useEffect(() => {
    setClientesGuardados(loadClientes());
  }, [hoja.proyecto]);

  const dNow = new Date();
  const todayLabel = `${String(dNow.getDate()).padStart(2, '0')}/${String(
    dNow.getMonth() + 1
  ).padStart(2, '0')}/${dNow.getFullYear()}`;

  const handleOpenPdfPreview = () => {
    if (hoja.partidas.length === 0) {
      onShowToast('Agrega piezas antes de ver o generar el PDF');
      return;
    }
    if ((hoja.proyecto || '').trim()) {
      const updatedClients = upsertCliente({
        nombre: hoja.proyecto,
        telefono: hoja.clienteTel || contratoCliente.telefono,
        direccion: hoja.clienteDir || contratoCliente.direccion,
      });
      setClientesGuardados(updatedClients);
    }
    setPdfPreviewOpen(true);
  };

  const comprometidosMap: Record<string, number> = {};
  for (const ob of obrasAprobadas) {
    comprometidosMap[ob.key] = (comprometidosMap[ob.key] || 0) + ob.tramos;
  }

  const consolidado = consolidarMaterialesObra(hoja.partidas, inventario, comprometidosMap, sobrantes);

  const opt1D = useMemo(
    () => optimizarPartidasTramos1D(hoja.partidas, sobrantes, taller.optimizador),
    [hoja.partidas, sobrantes, taller.optimizador]
  );

  const subtotal = hoja.partidas.reduce((acc, p) => acc + p.totalLinea, 0);
  const descuentoVal = subtotal * ((hoja.descuentoPct || 0) / 100);
  const baseDesc = subtotal - descuentoVal;
  const ivaVal = hoja.incluirIva ? baseDesc * 0.16 : 0;
  const grandTotal = baseDesc + ivaVal;
  const anticipoPctVal =
    typeof hoja.anticipoPct === 'number' && hoja.anticipoPct >= 0 && hoja.anticipoPct <= 100
      ? Math.round(hoja.anticipoPct)
      : 60;
  const anticipoMonto = round2(grandTotal * (anticipoPctVal / 100));
  const saldoMonto = Math.max(0, round2(grandTotal - anticipoMonto));

  const groupedByArea = hoja.partidas.reduce<Record<string, PartidaObra[]>>((acc, p) => {
    const key = p.area || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const buildResumenWhatsAppText = (): string => {
    const vigencia =
      typeof hoja.vigenciaDias === 'number' && hoja.vigenciaDias > 0
        ? Math.round(hoja.vigenciaDias)
        : 7;
    const entrega =
      (hoja.tiempoEntrega || '').trim() || DEFAULT_HOJA_CONDITIONS.tiempoEntrega;
    const lines = [
      `*${taller.nombre || 'PRESUPUESTO DE ALUMINIO Y VIDRIO'}*`,
      `Folio: ${currentFolio} · Fecha: ${todayLabel}`,
      `Proyecto: ${hoja.proyecto || 'Cliente General'}`,
      hoja.clienteTel ? `Tel.: ${hoja.clienteTel}` : '',
      hoja.clienteDir ? `Dir.: ${hoja.clienteDir}` : '',
      '',
      ...hoja.partidas.map((p, i) => {
        const l = LINEAS_CONFIG[p.linea];
        const c = COLORES_CONFIG[p.color];
        const rel = l.esMosquitero ? 'Tela Mosquitera' : getRellenoLabel(p.relleno, p.vidrio);
        return `${i + 1}. [${p.area || 'General'}] ${p.etiqueta ? `${p.etiqueta} - ` : ''}${l.nombre} (${p.anchoCm}×${p.altoCm} cm, ${c.corto}, ${rel}) ×${p.cantidad} = ${formatMXN(p.totalLinea)}`;
      }),
      '',
      `Subtotal: ${formatMXN(subtotal)}`,
      descuentoVal > 0 ? `Descuento (${hoja.descuentoPct}%): -${formatMXN(descuentoVal)}` : '',
      ivaVal > 0 ? `IVA (16%): ${formatMXN(ivaVal)}` : '',
      `*TOTAL FINAL: ${formatMXN(grandTotal)}*`,
      `Anticipo (${anticipoPctVal}%): ${formatMXN(anticipoMonto)}`,
      `Saldo contra entrega (${100 - anticipoPctVal}%): ${formatMXN(saldoMonto)}`,
      '',
      `Cotización válida por ${vigencia} días. Se requiere ${anticipoPctVal}% de anticipo para iniciar fabricación. Entrega: ${entrega}. No incluye albañilería salvo especificación.`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const enviarResumenWhatsApp = async () => {
    if (hoja.partidas.length === 0) {
      onShowToast('Agrega al menos una pieza primero');
      return;
    }
    const text = buildResumenWhatsAppText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignorar si portapapeles bloqueado
    }
    const waUrl = buildWhatsAppDirectUrl(hoja.clienteTel || contratoCliente.telefono || '', text);
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    onShowToast('Resumen listo y abierto en WhatsApp', true);
  };

  const handleDescargarOrdenProduccion = async () => {
    if (hoja.partidas.length === 0) {
      onShowToast('Agrega al menos una pieza primero');
      return;
    }
    const ok = await generarPdfOrdenProduccionTaller(hoja, taller, opt1D);
    if (ok) {
      onShowToast('PDF Orden de Producción (Para Taller) descargado sin precios', true);
    }
  };

  const copiarFaltanteWhatsApp = async () => {
    const faltantes = consolidado.filter((r) => r.tramosFaltantes > 0);
    if (faltantes.length === 0) {
      onShowToast('Tu bodega cubre todos los perfiles de esta obra', true);
      return;
    }
    const lines = [
      `*PEDIDO DE MATERIAL — ${hoja.proyecto || 'Obra'}*`,
      ...faltantes.map(
        (r) =>
          `• ${r.tramosFaltantes} tramo(s) 6.10 m — ${r.perfilNombre} (${LINEAS_CONFIG[r.linea].nombre}, ${COLORES_CONFIG[r.color].corto})`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      onShowToast('Lista de faltantes copiada para WhatsApp', true);
    } catch {
      onShowToast('Error al copiar lista');
    }
  };

  return (
    <section id="view-hoja" className="screen-animate">
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        <div>
          <h1 className="m-0 text-[21px] font-extrabold text-white">Hoja de Cotización</h1>
          <p className="m-0 text-[12.5px] text-slate-300">
            Partidas de la obra agrupadas por área, descuento y PDF limpio
          </p>
        </div>
        <button
          type="button"
          onClick={onAgregarPieza}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12.5px] cursor-pointer"
        >
          + Agregar pieza
        </button>
      </div>

      <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="m-0 text-[17px] font-extrabold">Datos del Proyecto / Obra</h2>
          <span
            id="hoja-folio-badge"
            className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 mono text-[11.5px] font-extrabold"
          >
            Cotización No. {currentFolio} · {todayLabel}
          </span>
        </div>
        <p className="m-0 text-[12px] text-slate-600 mb-3">
          Se mostrará en el encabezado de la cotización, PDF para cliente y WhatsApp
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 relative">
            <label htmlFor="inp-hoja-proyecto" className="block text-[12px] font-bold text-slate-600 mb-1.5">
              Nombre del Cliente / Proyecto
            </label>
            <input
              id="inp-hoja-proyecto"
              type="text"
              value={hoja.proyecto}
              onFocus={() => setShowClientSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowClientSuggestions(false), 180)}
              onChange={(e) => {
                onUpdateHoja({ proyecto: e.target.value });
                setShowClientSuggestions(true);
              }}
              placeholder="Ejemplo Cliente"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-[14px] font-semibold"
            />
            {showClientSuggestions && clientesGuardados.length > 0 && (() => {
              const q = (hoja.proyecto || '').trim().toLowerCase();
              const matches = clientesGuardados
                .filter((c) => !q || c.nombre.toLowerCase().includes(q))
                .slice(0, 5);
              if (matches.length === 0) return null;
              return (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border border-slate-300 bg-white shadow-xl overflow-hidden">
                  {matches.map((cli) => (
                    <button
                      key={cli.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onUpdateHoja({
                          proyecto: cli.nombre,
                          clienteTel: cli.telefono || hoja.clienteTel || '',
                          clienteDir: cli.direccion || hoja.clienteDir || '',
                        });
                        if (cli.telefono || cli.direccion) {
                          onUpdateContratoCliente({
                            nombre: cli.nombre,
                            telefono: cli.telefono || contratoCliente.telefono,
                            direccion: cli.direccion || contratoCliente.direccion,
                          });
                        }
                        setShowClientSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="text-[13px] font-bold text-slate-900 truncate">{cli.nombre}</span>
                      <span className="text-[11px] text-slate-500 mono shrink-0">
                        {cli.telefono || cli.direccion || 'Cliente guardado'}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          <div>
            <label htmlFor="inp-hoja-cliente-tel" className="block text-[12px] font-bold text-slate-600 mb-1.5">
              Teléfono del cliente
            </label>
            <input
              id="inp-hoja-cliente-tel"
              type="tel"
              inputMode="tel"
              maxLength={14}
              value={hoja.clienteTel ?? ''}
              onChange={(e) => {
                const formatted = formatClientPhoneInput(e.target.value, hoja.clienteTel ?? '');
                onUpdateHoja({ clienteTel: formatted });
              }}
              placeholder="333-333-4444"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 mono text-[13.5px] font-semibold"
            />
          </div>

          <div>
            <label htmlFor="inp-hoja-cliente-dir" className="block text-[12px] font-bold text-slate-600 mb-1.5">
              Dirección del cliente
            </label>
            <input
              id="inp-hoja-cliente-dir"
              type="text"
              value={hoja.clienteDir ?? ''}
              onChange={(e) => onUpdateHoja({ clienteDir: e.target.value })}
              placeholder="Calle, colonia o referencia de entrega"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
        {/* Lista de partidas */}
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="m-0 text-[17px] font-extrabold">
                Partidas Agregadas (<span className="mono">{hoja.partidas.length}</span>)
              </h2>
              <p className="m-0 text-[12px] text-slate-500">Edita o elimina cualquier ventana, mosquitero o puerta</p>
            </div>
            {hoja.partidas.length > 0 && (
              <button
                type="button"
                onClick={onVaciarHoja}
                className="min-h-[34px] px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-500 hover:text-red-600 cursor-pointer"
              >
                Vaciar
              </button>
            )}
          </div>

          <div className="mb-3 flex flex-col gap-2">
            <PdfHeaderPreview
              taller={taller}
              proyectoNombre={hoja.proyecto}
              kind="cotizacion"
              onPreviewPdf={handleOpenPdfPreview}
            />
            {onUpdateTaller && (
              <div className="flex justify-end">
                <button
                  type="button"
                  id="btn-hoja-editar-encabezado-inline"
                  onClick={() => setPdfHeaderModalOpen(true)}
                  className="text-[11.5px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Personalizar logo, color y contacto del encabezado PDF
                </button>
              </div>
            )}
          </div>

          {hoja.partidas.length === 0 ? (
            <p className="text-[12.5px] text-slate-500 p-5 text-center border border-dashed border-slate-200 rounded-xl">
              Aún no hay piezas en la Hoja de Cotización. Ve a Ventanas o Puertas y presiona{' '}
              <strong>+ Agregar a Hoja de Cotización</strong>.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(groupedByArea).map(([area, items]) => (
                <div key={area} className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
                  <div className="text-[12px] font-extrabold text-blue-700 mb-2 uppercase tracking-wider">
                    Área: {area}
                  </div>
                  {items.map((p) => {
                    const lineaCfg = LINEAS_CONFIG[p.linea];
                    const apLabel =
                      p.categoria === 'puertas' && !lineaCfg.esCancelBano
                        ? `Puerta ${p.sentidoPuerta === 'der' ? 'Der.' : 'Izq.'}`
                        : !lineaCfg.esMosquitero && !lineaCfg.esCancelBano
                          ? APERTURA_PREVIEW_LABELS[p.apertura] || p.apertura
                          : lineaCfg.esCancelBano
                            ? 'Corredizo'
                            : p.linea === 'mosq-fijo'
                              ? 'Fijo'
                              : 'Corredizo';
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 border-b border-slate-200/70 last:border-b-0"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div data-preserve-light="true" className="shrink-0">
                            <PartidaMiniSvg partida={p} width={96} height={72} />
                          </div>
                          <div className="min-w-0">
                            <strong className="block text-[13.5px] text-slate-900 leading-snug">
                              {p.etiqueta ? `${p.etiqueta} · ` : ''}
                              {lineaCfg.nombre}
                            </strong>
                            <span className="block text-[11.5px] font-semibold text-blue-700 mt-0.5">
                              {apLabel}
                              {p.hojas > 1 && p.apertura !== 'fija' && p.categoria !== 'puertas'
                                ? ` (${p.hojas} hojas)`
                                : ''}
                            </span>
                            <span className="block text-[12px] text-slate-500 mt-0.5">
                              {p.anchoCm} × {p.altoCm} cm · {COLORES_CONFIG[p.color].corto} ·{' '}
                              {lineaCfg.esMosquitero
                                ? 'Malla'
                                : getRellenoLabel(p.relleno, p.vidrio)}{' '}
                              · ×{p.cantidad} pza(s)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <span className="mono font-extrabold text-blue-600 text-[14px]">
                            {formatMXN(p.totalLinea)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onEditarPartida(p)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-bold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => onEliminarPartida(p.id)}
                            aria-label={`Eliminar ${p.etiqueta || lineaCfg.nombre}`}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales y Consolidado */}
        <div className="flex flex-col gap-4">
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="m-0 text-[17px] font-extrabold">Resumen Económico</h2>
              <span className="mono text-[11px] font-extrabold text-blue-700">
                {currentFolio} · {todayLabel}
              </span>
            </div>
            <p className="m-0 text-[12px] text-slate-500">Ajuste por volumen de obra e impuestos</p>

            <div className="my-3.5">
              <label htmlFor="inp-descuento-obra" className="block text-[12px] font-bold text-slate-500 mb-1.5">
                % de descuento por volumen de obra
              </label>
              <input
                id="inp-descuento-obra"
                type="number"
                min={0}
                max={80}
                step={0.5}
                value={hoja.descuentoPct}
                onChange={(e) => onUpdateHoja({ descuentoPct: Math.max(0, Math.min(80, Number(e.target.value) || 0)) })}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[14.5px] font-semibold"
              />
              <label className="inline-flex items-center gap-1.5 cursor-pointer mt-2.5 text-[13px] font-semibold">
                <input
                  type="checkbox"
                  checked={hoja.incluirIva}
                  onChange={(e) => onUpdateHoja({ incluirIva: e.target.checked })}
                />
                Incluir IVA (16%)
              </label>
            </div>

            <div className="border-y border-slate-100 py-2.5 my-2.5 flex flex-col gap-1.5 text-[13.5px] text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal partidas</span>
                <strong className="mono text-slate-900">{formatMXN(subtotal)}</strong>
              </div>
              {descuentoVal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento ({hoja.descuentoPct}%)</span>
                  <strong className="mono">-{formatMXN(descuentoVal)}</strong>
                </div>
              )}
              {ivaVal > 0 && (
                <div className="flex justify-between">
                  <span>IVA (16%)</span>
                  <strong className="mono text-slate-900">{formatMXN(ivaVal)}</strong>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline font-extrabold mb-2">
              <span>Gran Total Final</span>
              <span className="mono text-[25px] text-blue-600">{formatMXN(grandTotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px]">
              <div>
                <span className="block text-[10.5px] font-bold text-emerald-800 uppercase">
                  Anticipo ({anticipoPctVal}%)
                </span>
                <strong className="mono text-[14px] text-emerald-900">{formatMXN(anticipoMonto)}</strong>
              </div>
              <div className="text-right">
                <span className="block text-[10.5px] font-bold text-slate-600 uppercase">
                  Saldo contra entrega ({100 - anticipoPctVal}%)
                </span>
                <strong className="mono text-[14px] text-slate-900">{formatMXN(saldoMonto)}</strong>
              </div>
            </div>

            <div className="mb-3.5 p-3 rounded-[12px] bg-slate-50 border border-slate-200 text-[11.8px] text-slate-600 leading-relaxed flex flex-col gap-2">
              <strong className="block text-slate-900 text-[12px]">Condiciones editables del PDF</strong>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="inp-hoja-vigencia" className="block text-[10.5px] font-bold text-slate-500 mb-0.5">
                    Vigencia (días)
                  </label>
                  <input
                    id="inp-hoja-vigencia"
                    type="number"
                    min={1}
                    max={90}
                    value={hoja.vigenciaDias ?? DEFAULT_HOJA_CONDITIONS.vigenciaDias}
                    onChange={(e) =>
                      onUpdateHoja({
                        vigenciaDias: Math.max(1, Math.min(90, Math.round(Number(e.target.value) || 8))),
                      })
                    }
                    className="w-full min-h-[34px] rounded-lg border border-slate-300 bg-white px-2 mono text-[12.5px] font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="inp-hoja-anticipo" className="block text-[10.5px] font-bold text-slate-500 mb-0.5">
                    Anticipo (%)
                  </label>
                  <input
                    id="inp-hoja-anticipo"
                    type="number"
                    min={0}
                    max={100}
                    value={hoja.anticipoPct ?? DEFAULT_HOJA_CONDITIONS.anticipoPct}
                    onChange={(e) =>
                      onUpdateHoja({
                        anticipoPct: Math.max(0, Math.min(100, Math.round(Number(e.target.value) || 0))),
                      })
                    }
                    className="w-full min-h-[34px] rounded-lg border border-slate-300 bg-white px-2 mono text-[12.5px] font-bold"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label htmlFor="inp-hoja-entrega" className="block text-[10.5px] font-bold text-slate-500 mb-0.5">
                    Entrega
                  </label>
                  <input
                    id="inp-hoja-entrega"
                    type="text"
                    value={hoja.tiempoEntrega ?? DEFAULT_HOJA_CONDITIONS.tiempoEntrega}
                    onChange={(e) => onUpdateHoja({ tiempoEntrega: e.target.value })}
                    placeholder="5 a 7 días hábiles"
                    className="w-full min-h-[34px] rounded-lg border border-slate-300 bg-white px-2 text-[12px] font-semibold"
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-[11.5px] font-bold text-slate-700 pt-1">
                <input
                  id="chk-hoja-fotos-pdf"
                  type="checkbox"
                  checked={Boolean(hoja.incluirFotosPdf)}
                  onChange={(e) => onUpdateHoja({ incluirFotosPdf: e.target.checked })}
                />
                Incluir fotos de piezas en el PDF (si existen)
              </label>
              <div className="text-[11px] text-slate-500">
                • Garantía de 30 días en mano de obra, sellado hermético y funcionamiento de herrajes
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowDespieceObra((p) => !p)}
                className="w-full min-h-[46px] px-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold text-[13px] cursor-pointer"
              >
                {showDespieceObra
                  ? 'Ocultar Despiece Total de Material'
                  : 'Ver Despiece Total de Material (Tramos 6.10 m)'}
              </button>
              <button
                type="button"
                id="btn-generar-contrato"
                onClick={() => {
                  if (hoja.partidas.length === 0) {
                    onShowToast('Agrega al menos una partida para convertir en Contrato');
                    return;
                  }
                  setContratoOpen(true);
                  onPushSubModal?.('contrato');
                }}
                className="w-full min-h-[50px] px-4 rounded-xl bg-[#0B2545] hover:bg-[#133866] text-white border border-sky-400/35 font-extrabold text-[14px] cursor-pointer shadow-md"
              >
                📝 Convertir en Contrato
              </button>
              {onUpdateTaller && (
                <button
                  type="button"
                  id="btn-personalizar-encabezado-pdf"
                  onClick={() => setPdfHeaderModalOpen(true)}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-[13px] cursor-pointer"
                >
                  Personalizar Encabezado PDF (Logo y Contacto)
                </button>
              )}
              <button
                type="button"
                id="btn-generar-pdf-cliente"
                onClick={handleOpenPdfPreview}
                className="w-full min-h-[50px] px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 text-slate-950 border border-amber-300 font-black text-[14px] cursor-pointer shadow-lg"
              >
                📄 PDF Cotización (Para Cliente)
              </button>
              <button
                type="button"
                id="btn-generar-pdf-orden-taller"
                onClick={() => void handleDescargarOrdenProduccion()}
                className="w-full min-h-[48px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-extrabold text-[13.5px] cursor-pointer shadow-md"
              >
                🛠️ PDF Orden de Producción (Para Taller)
              </button>
              <button
                type="button"
                id="btn-hoja-whatsapp-resumen"
                onClick={() => void enviarResumenWhatsApp()}
                className="w-full min-h-[46px] px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-[14px] cursor-pointer shadow-sm"
              >
                💬 Enviar resumen por WhatsApp
              </button>
              {onOpenGlassOptimizer && (
                <button
                  type="button"
                  id="btn-hoja-opt-vidrio"
                  onClick={onOpenGlassOptimizer}
                  className="w-full min-h-[44px] px-4 rounded-xl border border-cyan-300 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-extrabold text-[13px] cursor-pointer"
                >
                  ✂️ Optimizar Cortes de Vidrio en 2D
                </button>
              )}
            </div>
          </div>

          {showDespieceObra && (
            <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
              <h2 className="m-0 text-[17px] font-extrabold">Despiece Total de Material (Uso Interno)</h2>
              <p className="m-0 text-[12px] text-slate-500 mb-3">
                Suma de perfiles, tramos completos de 6.10 m y cruce automático contra inventario
              </p>

              {consolidado.length === 0 ? (
                <p className="text-[12.5px] text-slate-500">Sin partidas en la hoja.</p>
              ) : (
                <>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full border-collapse text-[12px] min-w-[440px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <th className="p-2 text-left">Perfil / Acabado</th>
                          <th className="p-2 text-center">Requerido</th>
                          <th className="p-2 text-center">Disp.</th>
                          <th className="p-2 text-right">Falta pedir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consolidado.map((row) => (
                          <tr key={row.key} className="border-b border-slate-100 last:border-b-0">
                            <td className="p-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  data-preserve-light="true"
                                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 p-0.5"
                                >
                                  <PerfilSectionSvg
                                    perfilId={row.perfilId}
                                    fotoRealUrl={getPerfilFotoUrl(perfilFotos, row.perfilId, row.linea)}
                                    size={26}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <strong className="block text-slate-900 break-words">{row.perfilNombre}</strong>
                                  <span className="text-[11px] text-slate-500 break-words">
                                    {LINEAS_CONFIG[row.linea].nombre} · {COLORES_CONFIG[row.color].corto}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-2 text-center mono font-bold">
                              {row.tramosRequeridos} t ({row.metrosRequeridos.toFixed(1)} m)
                            </td>
                            <td className="p-2 text-center mono">
                              <div>{row.tramosDisponibles} t</div>
                              {row.metrosSobrantesDisponibles > 0 && (
                                <span className="block text-[10px] font-bold text-amber-700">
                                  +{row.metrosSobrantesDisponibles.toFixed(2)}m sob.
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right">
                              {row.tramosFaltantes > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-50 text-orange-700 border border-orange-300 font-extrabold text-[11px] mono">
                                  Pedir {row.tramosFaltantes}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-extrabold text-[11px]">
                                  OK Bodega
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Diagrama visual de optimización 6.10 m barra por barra */}
                  {opt1D.grupos.length > 0 && (
                    <div id="hoja-optimizador-610" className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="m-0 text-[14.5px] font-extrabold text-slate-900">
                            Optimización Barra por Barra (6.10 m)
                          </h3>
                          <p className="m-0 text-[11.5px] text-slate-500">
                            Aprovechamiento: <strong className="mono text-emerald-700">{opt1D.aprovechamientoGlobalPct}%</strong> · Merma real (&lt;{opt1D.grupos[0]?.barras[0] ? (taller.optimizador?.umbralSobranteUsableCm ?? 60) : 60} cm):{' '}
                            <strong className="mono text-rose-700">{opt1D.mermaRealPct}%</strong> ({(opt1D.mermaTotalCm / 100).toFixed(2)} m)
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 mono text-[11.5px] font-extrabold">
                          {opt1D.tramos610Totales} tramo(s) 6.10 m
                        </span>
                      </div>

                      <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-semibold">
                        {PRE_CUT_WARNING_TEXT}
                      </div>

                      {opt1D.grupos.map((g) => (
                        <div key={g.perfilId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2 text-[12px]">
                            <strong className="text-slate-900 truncate">
                              {g.codigo} · {g.perfilNombre}
                            </strong>
                            <span className="mono font-bold text-blue-700 shrink-0">
                              {g.tramos610Requeridos} barra(s) · {g.aprovechamientoPct}%
                            </span>
                          </div>
                          {g.barras.map((barra) => (
                            <div key={barra.id} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                                <span className="font-bold">{barra.etiquetaOrigen}</span>
                                <span className="mono">
                                  {barra.esMerma ? (
                                    <strong className="text-rose-700">Merma ({barra.sobranteCm.toFixed(1)} cm)</strong>
                                  ) : (
                                    <strong className="text-emerald-700">Sobrante usable ({barra.sobranteCm.toFixed(1)} cm)</strong>
                                  )}
                                </span>
                              </div>
                              <div className="w-full h-6 rounded-md border border-slate-300 bg-slate-100 overflow-hidden flex">
                                {barra.cortes.map((c, cIdx) => {
                                  const wPct = Math.max(4, (c.medidaCm / Math.max(1, barra.largoTotalCm)) * 100);
                                  const segColors = ['#2563EB', '#0D9488', '#4F46E5', '#0284C7', '#D97706'];
                                  return (
                                    <div
                                      key={`${barra.id}-${cIdx}`}
                                      style={{ width: `${wPct}%`, backgroundColor: segColors[cIdx % segColors.length] }}
                                      title={`${c.nombre}: ${c.medidaCm.toFixed(1)} cm`}
                                      className="h-full border-r border-white/80 flex items-center justify-center text-white text-[9.5px] font-extrabold mono px-0.5 truncate"
                                    >
                                      {c.medidaCm.toFixed(0)}
                                    </div>
                                  );
                                })}
                                {barra.sobranteCm > 0 && (
                                  <div
                                    style={{ width: `${Math.max(3, (barra.sobranteCm / Math.max(1, barra.largoTotalCm)) * 100)}%` }}
                                    className={`h-full flex items-center justify-center text-[9.5px] font-extrabold mono px-0.5 truncate border-l border-dashed ${
                                      barra.esMerma
                                        ? 'bg-rose-100 text-rose-900 border-rose-400'
                                        : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                    }`}
                                  >
                                    {barra.sobranteCm >= 15 ? `${barra.sobranteCm.toFixed(0)}` : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}

                      {onAddSobrante && opt1D.sobrantesGeneradosGuardables.length > 0 && (
                        <button
                          type="button"
                          id="btn-hoja-save-sobrantes"
                          onClick={() => {
                            const mainPartida = hoja.partidas[0];
                            opt1D.sobrantesGeneradosGuardables.forEach((s) => {
                              onAddSobrante({
                                marca: 'Alumer',
                                linea: mainPartida?.linea || '3',
                                perfilId: s.perfilId,
                                color: mainPartida?.color || 'natural',
                                largoM: s.largoM,
                                cantidad: s.cantidad,
                                nota: `Sobrante usable de obra (${hoja.proyecto || 'Cotización'})`,
                              });
                            });
                            onShowToast(
                              `${opt1D.sobrantesGeneradosGuardables.length} sobrante(s) usable(s) guardado(s) en Mi Inventario`,
                              true
                            );
                          }}
                          className="w-full min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[12.5px] cursor-pointer"
                        >
                          + Guardar en Mi Inventario ({opt1D.sobrantesGeneradosGuardables.length} sobrante(s) ≥ {taller.optimizador?.umbralSobranteUsableCm ?? 60} cm)
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mt-3">
                    <button
                      type="button"
                      onClick={copiarFaltanteWhatsApp}
                      className="w-full min-h-[44px] px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-[13px] cursor-pointer"
                    >
                      Copiar Lista de Compra Faltante para WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => onApartarStockObra(consolidado)}
                      className="w-full min-h-[44px] px-4 rounded-xl border border-amber-400 bg-amber-50 text-amber-900 font-bold text-[13px] cursor-pointer"
                    >
                      📌 Aprobar Obra y Apartar Stock en Bodega
                    </button>
                    <button
                      type="button"
                      onClick={() => onDescontarInventarioObra(consolidado)}
                      className="w-full min-h-[44px] px-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold text-[13px] cursor-pointer"
                    >
                      Descontar material usado del inventario
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {onAddReminder &&
        onUpdateReminderStatus &&
        onSnoozeReminder &&
        onDeleteReminder &&
        onNotifyReminderNow &&
        onTestPushNotification &&
        onRequestPushPermission && (
          <div className="mt-4">
            <CotizacionRemindersPanel
              reminders={reminders}
              defaultProyecto={hoja.proyecto || ''}
              defaultTotal={grandTotal}
              defaultPartidasCount={hoja.partidas.length}
              defaultTelefono={hoja.clienteTel || contratoCliente.telefono || ''}
              tallerNombre={taller.nombre}
              highlightedReminderId={highlightedReminderId}
              onAddReminder={onAddReminder}
              onUpdateStatus={onUpdateReminderStatus}
              onSnoozeReminder={onSnoozeReminder}
              onDeleteReminder={onDeleteReminder}
              onNotifyNow={onNotifyReminderNow}
              onTestPushNotification={onTestPushNotification}
              onRequestPermission={onRequestPushPermission}
              onShowToast={onShowToast}
            />
          </div>
        )}

      {contratoOpen && (
        <ErrorBoundary
          resetKey={contratoOpen}
          title="No se pudo abrir la pantalla de Contrato"
          onGoHome={() => setContratoOpen(false)}
        >
          <ContratoModal
            open={contratoOpen}
            hoja={hoja}
            taller={taller}
            cliente={contratoCliente}
            onUpdateCliente={onUpdateContratoCliente}
            onUpdateProyecto={(proyecto) => onUpdateHoja({ proyecto })}
            onToggleIva={(incluirIva) => onUpdateHoja({ incluirIva })}
            onClose={() => {
              setContratoOpen(false);
              onRequestBack?.();
            }}
            onShowToast={onShowToast}
          />
        </ErrorBoundary>
      )}

      {pdfPreviewOpen && (
        <Suspense fallback={null}>
          <LazyPdfPreviewModal
            open={pdfPreviewOpen}
            hoja={hoja}
            taller={taller}
            contratoCliente={contratoCliente}
            onClose={() => setPdfPreviewOpen(false)}
            onFinalPdfDownloaded={(res) => {
              const materialesResumen = consolidado.map((row) => ({
                id: `${row.perfilId}__${row.linea}`,
                nombre: row.perfilNombre,
                codigo: row.perfilId,
                linea: LINEAS_CONFIG[row.linea]?.nombre || row.linea,
                cantidad: row.tramosRequeridos || 1,
                unidad: 'tramos',
              }));
              const savedList = recordCotizacionGuardada({
                folio: res.folio,
                fecha: res.dateLabel,
                cliente: res.clienteNombre,
                telefono: hoja.clienteTel || contratoCliente.telefono,
                direccion: hoja.clienteDir || contratoCliente.direccion,
                total: res.total,
                piezasCount: hoja.partidas.length,
                materiales: materialesResumen,
              });
              const createdEntry = savedList.find((item) => item.folio === res.folio) || savedList[0];
              if (typeof navigator !== 'undefined' && !navigator.onLine) {
                enqueueOfflineCotizacion({
                  key: `cotizacion:${res.folio}`,
                  action: 'save_cotizacion',
                  cotizacionId: createdEntry?.id,
                  folio: res.folio,
                  cliente: res.clienteNombre,
                  total: res.total,
                  estado: createdEntry?.estado || 'enviada',
                });
                onShowToast(
                  `Cotización ${res.folio} guardada localmente (en cola para sincronizar al volver la conexión)`,
                  true
                );
              }
              window.dispatchEvent(new CustomEvent('aluminero:cotizaciones-updated'));
              setCurrentFolio(peekNextCotizacionFolio());
              onRecordFinalPdf?.(res);
            }}
            onShowToast={onShowToast}
          />
        </Suspense>
      )}

      {onUpdateTaller && (
        <PdfHeaderCustomizerModal
          open={pdfHeaderModalOpen}
          taller={taller}
          proyectoNombre={hoja.proyecto}
          onUpdateTaller={onUpdateTaller}
          onClose={() => setPdfHeaderModalOpen(false)}
          onExportPdf={
            hoja.partidas.length > 0
              ? () => {
                  setPdfHeaderModalOpen(false);
                  handleOpenPdfPreview();
                }
              : undefined
          }
          onShowToast={onShowToast}
        />
      )}
    </section>
  );
};
