import React, { useEffect, useRef, useState } from 'react';
import {
  COLORES_CONFIG,
  consolidarMaterialesObra,
  getRellenoLabel,
  LINEAS_CONFIG,
  PartidaObra,
} from '../utils/alumineroLogic';
import { generarPdfClienteLimpio } from '../utils/pdfExport';
import {
  ContratoClienteInfo,
  formatMXN,
  getPerfilFotoUrl,
  HojaState,
  ObraAprobadaApartado,
  PerfilFotosMap,
  SobranteItem,
  TallerConfig,
} from '../utils/storageHelpers';
import { ContratoModal } from './ContratoModal';
import { PartidaMiniSvg } from './PartidaMiniSvg';
import { PerfilSectionSvg } from './PerfilSectionSvg';

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
  onUpdateContratoCliente: (patch: Partial<ContratoClienteInfo>) => void;
  onEditarPartida: (p: PartidaObra) => void;
  onEliminarPartida: (id: string) => void;
  onVaciarHoja: () => void;
  onAgregarPieza: () => void;
  onApartarStockObra: (rows: ReturnType<typeof consolidarMaterialesObra>) => void;
  onDescontarInventarioObra: (rows: ReturnType<typeof consolidarMaterialesObra>) => void;
  onOpenGlassOptimizer?: () => void;
  onPushSubModal?: (sub: 'contrato') => void;
  onRequestBack?: () => void;
  onRegisterCloseSubModal?: (fn: (() => void) | null) => void;
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
  onUpdateContratoCliente,
  onEditarPartida,
  onEliminarPartida,
  onVaciarHoja,
  onAgregarPieza,
  onApartarStockObra,
  onDescontarInventarioObra,
  onOpenGlassOptimizer,
  onPushSubModal,
  onRequestBack,
  onRegisterCloseSubModal,
  onShowToast,
}) => {
  const [showDespieceObra, setShowDespieceObra] = useState(false);
  const [contratoOpen, setContratoOpen] = useState(false);

  useEffect(() => {
    if (!onRegisterCloseSubModal) return;
    onRegisterCloseSubModal(() => {
      setContratoOpen(false);
    });
    return () => onRegisterCloseSubModal(null);
  }, [onRegisterCloseSubModal]);

  const comprometidosMap: Record<string, number> = {};
  for (const ob of obrasAprobadas) {
    comprometidosMap[ob.key] = (comprometidosMap[ob.key] || 0) + ob.tramos;
  }

  const consolidado = consolidarMaterialesObra(hoja.partidas, inventario, comprometidosMap, sobrantes);

  const subtotal = hoja.partidas.reduce((acc, p) => acc + p.totalLinea, 0);
  const descuentoVal = subtotal * ((hoja.descuentoPct || 0) / 100);
  const baseDesc = subtotal - descuentoVal;
  const ivaVal = hoja.incluirIva ? baseDesc * 0.16 : 0;
  const grandTotal = baseDesc + ivaVal;

  const groupedByArea = hoja.partidas.reduce<Record<string, PartidaObra[]>>((acc, p) => {
    const key = p.area || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const copiarPresupuestoWhatsApp = async () => {
    if (hoja.partidas.length === 0) {
      onShowToast('Agrega al menos una pieza primero');
      return;
    }
    const lines = [
      `*${taller.nombre || 'PRESUPUESTO DE ALUMINIO Y VIDRIO'}*`,
      `Proyecto: ${hoja.proyecto || taller.clienteDefault || 'Cliente General'}`,
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
      '',
      'Vigencia: 8 días naturales · Garantía: 30 días en mano de obra.',
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      onShowToast('Presupuesto copiado para WhatsApp', true);
    } catch {
      onShowToast('No se pudo copiar al portapapeles');
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
        <h2 className="m-0 text-[17px] font-extrabold">Datos del Proyecto / Obra</h2>
        <p className="m-0 text-[12px] text-slate-600 mb-3">
          Se mostrará en el encabezado de la cotización, PDF para cliente y WhatsApp
        </p>
        <label htmlFor="inp-hoja-proyecto" className="block text-[12px] font-bold text-slate-600 mb-1.5">
          Nombre del Cliente / Proyecto
        </label>
        <input
          id="inp-hoja-proyecto"
          type="text"
          value={hoja.proyecto}
          onChange={(e) => onUpdateHoja({ proyecto: e.target.value })}
          placeholder="Ej. Casa del Sr. García o Residencial Lomas"
          className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-[14px] font-semibold"
        />
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

          {(taller.logoDataUrl || taller.nombre || hoja.proyecto) && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {taller.logoDataUrl && (
                  <img
                    src={taller.logoDataUrl}
                    alt="Logo del taller"
                    className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <strong className="block text-[13px] font-extrabold text-slate-900 truncate">
                    {taller.nombre || 'Presupuesto de Aluminio y Vidrio'}
                  </strong>
                  <span className="block text-[11px] text-slate-500 truncate">
                    {hoja.proyecto || taller.clienteDefault || 'Cliente General'}
                    {taller.tel ? ` · Tel: ${taller.tel}` : ''}
                  </span>
                </div>
              </div>
              <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2 py-1 shrink-0">
                Vista Previa
              </span>
            </div>
          )}

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
            <h2 className="m-0 text-[17px] font-extrabold">Resumen Económico</h2>
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

            <div className="flex justify-between items-baseline font-extrabold mb-4">
              <span>Gran Total Final</span>
              <span className="mono text-[25px] text-blue-600">{formatMXN(grandTotal)}</span>
            </div>

            <div className="mb-3.5 p-3 rounded-[10px] bg-slate-50 border border-slate-200 text-[11.8px] text-slate-600 leading-relaxed">
              <strong className="block text-slate-900 text-[12px] mb-1">Notas y Condiciones</strong>
              <div>• Vigencia de esta cotización: 8 días naturales (sujeta a variación por precio de materiales)</div>
              <div>• Garantía de 30 días en mano de obra, sellado hermético y funcionamiento de herrajes</div>
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
              <button
                type="button"
                onClick={() => {
                  if (hoja.partidas.length === 0) {
                    onShowToast('Agrega piezas antes de generar el PDF');
                    return;
                  }
                  generarPdfClienteLimpio(hoja, taller);
                  onShowToast('PDF para Cliente descargado', true);
                }}
                className="w-full min-h-[48px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] cursor-pointer"
              >
                Generar PDF para Cliente
              </button>
              <button
                type="button"
                onClick={copiarPresupuestoWhatsApp}
                className="w-full min-h-[46px] px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-[14px] cursor-pointer"
              >
                Copiar Presupuesto para WhatsApp
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
      <ContratoModal
        open={contratoOpen}
        hoja={hoja}
        taller={taller}
        cliente={contratoCliente}
        onUpdateCliente={onUpdateContratoCliente}
        onUpdateProyecto={(proyecto) => onUpdateHoja({ proyecto })}
        onToggleIva={(incluirIva) => onUpdateHoja({ incluirIva })}
        onClose={() => (onRequestBack ? onRequestBack() : setContratoOpen(false))}
        onShowToast={onShowToast}
      />
    </section>
  );
};
