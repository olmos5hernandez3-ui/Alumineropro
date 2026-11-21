import React, { useEffect, useState } from 'react';
import {
  AperturaVentanaId,
  CancelEstiloId,
  CategoriaTrabajo,
  COLORES_CONFIG,
  ColorId,
  CotizacionCalculada,
  DespieceCalculado,
  getRellenoLabel,
  LINEAS_CONFIG,
  LineaId,
  PerfilCatalogoId,
  TrabajoParams,
} from '../utils/alumineroLogic';
import { generarPdfTecnico } from '../utils/pdfExport';
import {
  formatMXN,
  FormulaPersonalizada,
  getPerfilFotoUrl,
  PerfilFotosMap,
  TallerConfig,
} from '../utils/storageHelpers';
import { BlueprintSvg } from './BlueprintSvg';
import { PanelRellenoSelector } from './PanelRellenoSelector';
import { PerfilSectionSvg } from './PerfilSectionSvg';

interface Props {
  categoria: CategoriaTrabajo;
  params: TrabajoParams;
  despiece: DespieceCalculado;
  cot: CotizacionCalculada;
  modoPrecio: 'm2' | 'base';
  precioInput: number;
  cobrarMinM2: boolean;
  incluirIva: boolean;
  areaText: string;
  etiquetaPieza: string;
  extraPct: number;
  referencia: string;
  proActive: boolean;
  hojaCount: number;
  editingPartidaId: string | null;
  taller: TallerConfig;
  formulas: FormulaPersonalizada[];
  selectedFormulaId: string;
  perfilFotos: PerfilFotosMap;
  onChangeParams: (patch: Partial<TrabajoParams>) => void;
  onSelectLinea: (linea: LineaId) => void;
  onChangeModoPrecio: (m: 'm2' | 'base') => void;
  onChangePrecioInput: (v: number) => void;
  onChangeCobrarMinM2: (v: boolean) => void;
  onChangeIncluirIva: (v: boolean) => void;
  onChangeAreaText: (v: string) => void;
  onChangeEtiquetaPieza: (v: string) => void;
  onChangeExtraPct: (v: number) => void;
  onChangeReferencia: (v: string) => void;
  onAgregarObra: () => void;
  onCancelarEdicion: () => void;
  onGuardarHistorial: () => void;
  onGoHoja: () => void;
  onOpenPro: () => void;
  onOpenPerfilModal: (perfilId: PerfilCatalogoId) => void;
  onOpenFormulaModal: () => void;
  onSelectFormulaId: (id: string) => void;
  onUpdateRellenoPrecioM2: (materialId: string, espesorMm: number, price: number) => void;
  workTab?: 'descuentos' | 'cotizacion';
  onChangeWorkTab?: (tab: 'descuentos' | 'cotizacion') => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const AREAS_SUGERIDAS = [
  'Sala',
  'Cocina',
  'Comedor',
  'Cuarto Principal',
  'Cuarto 2',
  'Cuarto 3',
  'Baño Principal',
  'Baño Visitas',
  'Fachada',
  'Patio',
];

const APERTURAS_LIST: { id: AperturaVentanaId; label: string; pro: boolean }[] = [
  { id: 'corrediza', label: 'Corrediza', pro: false },
  { id: 'fija', label: 'Fija (Fijo 3")', pro: true },
  { id: 'guillotina', label: 'Guillotina', pro: true },
  { id: 'abatible', label: 'Abatible vertical', pro: true },
  { id: 'banderola', label: 'Banderola', pro: true },
  { id: 'oscilobatiente', label: 'Oscilobatiente', pro: true },
  { id: 'plegable', label: 'Plegable (libro)', pro: true },
];

export const TrabajoView: React.FC<Props> = ({
  categoria,
  params,
  despiece,
  cot,
  modoPrecio,
  precioInput,
  cobrarMinM2,
  incluirIva,
  areaText,
  etiquetaPieza,
  extraPct,
  referencia,
  proActive,
  hojaCount,
  editingPartidaId,
  taller,
  formulas,
  selectedFormulaId,
  perfilFotos,
  onChangeParams,
  onSelectLinea,
  onChangeModoPrecio,
  onChangePrecioInput,
  onChangeCobrarMinM2,
  onChangeIncluirIva,
  onChangeAreaText,
  onChangeEtiquetaPieza,
  onChangeExtraPct,
  onChangeReferencia,
  onAgregarObra,
  onCancelarEdicion,
  onGuardarHistorial,
  onGoHoja,
  onOpenPro,
  onOpenPerfilModal,
  onOpenFormulaModal,
  onSelectFormulaId,
  onUpdateRellenoPrecioM2,
  workTab: controlledWorkTab,
  onChangeWorkTab,
  onShowToast,
}) => {
  const [localWorkTab, setLocalWorkTab] = useState<'descuentos' | 'cotizacion'>('descuentos');
  const workTab = controlledWorkTab ?? localWorkTab;
  const setWorkTab = (next: 'descuentos' | 'cotizacion') => {
    if (next === workTab) return;
    if (onChangeWorkTab) onChangeWorkTab(next);
    else setLocalWorkTab(next);
  };
  const [despieceTab, setDespieceTab] = useState<'perfiles' | 'vidrios' | 'herrajes'>('perfiles');
  const [showTolerancias, setShowTolerancias] = useState(false);
  const [simPlaying, setSimPlaying] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  const lineaCfg = LINEAS_CONFIG[params.linea];
  const colorCfg = COLORES_CONFIG[params.color];
  const rellenoLabel = getRellenoLabel(params.relleno, params.vidrio);
  const esMosq = Boolean(lineaCfg.esMosquitero);
  const esCancel = Boolean(lineaCfg.esCancelBano);
  const esPuerta = lineaCfg.categoria === 'puertas';

  const LINEAS_ORDER: LineaId[] = [
    '3',
    '2',
    'europea',
    'cancel-bano',
    'mosq-fijo',
    'mosq-corredizo',
    'puerta-2',
    'puerta-abatible',
    'puerta-europea',
  ];
  const lineasDeCategoria = LINEAS_ORDER.map((id) => LINEAS_CONFIG[id]).filter(
    (l) => l.categoria === categoria
  );

  useEffect(() => {
    if (!simPlaying) return;
    let dir = 1;
    let val = simProgress;
    const id = window.setInterval(() => {
      val += dir * 4;
      if (val >= 100) {
        val = 100;
        dir = -1;
      } else if (val <= 0) {
        val = 0;
        dir = 1;
      }
      setSimProgress(val);
    }, 45);
    return () => window.clearInterval(id);
  }, [simPlaying]);

  const handleToggleSim = () => {
    if (!proActive) {
      onOpenPro();
      return;
    }
    setSimPlaying((prev) => !prev);
  };

  const handleSelectFormula = (val: string) => {
    onSelectFormulaId(val);
    if (val === 'std') {
      onChangeParams({ tolerancias: { ...lineaCfg.toleranciasDefault } });
    } else if (val === 'carr-adj') {
      onChangeParams({
        tolerancias: {
          ...lineaCfg.toleranciasDefault,
          hojaV: Math.max(0, lineaCfg.toleranciasDefault.hojaV + 0.5),
        },
      });
    } else if (val === 'corte-45') {
      onChangeParams({
        tolerancias: {
          ...lineaCfg.toleranciasDefault,
          marcoH: 0,
        },
      });
    } else {
      const custom = formulas.find((f) => f.id === val);
      if (custom) {
        onChangeParams({ tolerancias: { ...custom.tolerancias } });
      }
    }
    onShowToast('Fórmula de corte aplicada');
  };

  const copiarWhatsApp = async () => {
    const lineDetail = esMosq
      ? `Tela Mosquitera (${despiece.telaMosquiteraM2.toFixed(2)} m²) + Cola de rata (${despiece.colaDeRataM.toFixed(2)} m)`
      : `Panel de Relleno: ${rellenoLabel}`;
    const msg = [
      `*${taller.nombre || 'COTIZACIÓN ALUMINERO PRO'}*`,
      `• ${lineaCfg.nombre} (${params.anchoCm} × ${params.altoCm} cm)`,
      `• Acabado: ${colorCfg.nombre}`,
      `• ${lineDetail}`,
      `• Cantidad: ${params.cantidad} pza(s) · Área: ${cot.areaRealM2.toFixed(2)} m²`,
      `*Total: ${formatMXN(cot.totalFinal)}*`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(msg);
      onShowToast('Cotización copiada para WhatsApp', true);
    } catch {
      onShowToast('Texto listo para WhatsApp');
    }
  };

  return (
    <section id="view-trabajo" className="screen-animate">
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        <div>
          <h1 id="work-screen-title" className="m-0 text-[21px] font-extrabold text-white">
            {lineaCfg.nombre}
          </h1>
          <p id="work-screen-sub" className="m-0 text-[12.5px] text-slate-300">
            {params.anchoCm} × {params.altoCm} cm ({cot.areaRealM2.toFixed(2)} m²) · {colorCfg.nombre} ·{' '}
            {esMosq ? `${despiece.telaMosquiteraM2.toFixed(2)} m² malla` : rellenoLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-top-crear-formula"
            onClick={onOpenFormulaModal}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl border border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[12px] font-bold cursor-pointer whitespace-nowrap"
          >
            <span>+ Crear mi propia fórmula de corte</span>
          </button>
          <button
            type="button"
            onClick={onGoHoja}
            className="inline-flex items-center justify-center gap-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-[12px] font-bold cursor-pointer whitespace-nowrap"
          >
            <span>Hoja</span>
            <span className="mono">({hojaCount})</span>
          </button>
        </div>
      </div>

      {/* Selector de Línea (incluye Mosquiteros en Ventanas) */}
      <div id="work-lineas-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
        {lineasDeCategoria.map((l) => {
          const active = params.linea === l.id;
          const locked = l.pro && !proActive;
          return (
            <button
              key={l.id}
              type="button"
              data-line-active={active ? 'true' : 'false'}
              aria-pressed={active}
              onClick={() => onSelectLinea(l.id)}
              className={`relative flex flex-col justify-between gap-1.5 min-h-[66px] px-3 py-2.5 rounded-[14px] text-left cursor-pointer transition-all active:scale-[0.98] ${
                active
                  ? 'border-2 border-emerald-400 bg-emerald-950/70 text-white shadow-lg ring-1 ring-emerald-400/50'
                  : locked
                    ? 'border border-dashed border-amber-400/45 bg-[#13315C]/70 text-white hover:bg-[#183B6E]'
                    : 'border border-white/15 bg-white/10 text-white hover:bg-white/15 hover:border-white/30'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5 w-full">
                <span className="block text-[13px] font-extrabold leading-tight line-card-title">
                  {l.nombre}
                </span>
                {active ? (
                  <span className="line-active-badge inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-400/20 border border-emerald-300/60 text-emerald-200 text-[10px] font-extrabold shrink-0 whitespace-nowrap">
                    ✓ Activa
                  </span>
                ) : !l.pro ? (
                  <span className="text-[10.5px] font-extrabold text-emerald-400 shrink-0">Gratis</span>
                ) : locked ? (
                  <span className="text-[10.5px] font-extrabold text-amber-300 shrink-0">🔒 PRO</span>
                ) : (
                  <span className="text-[10.5px] font-extrabold text-emerald-300 shrink-0">
                    PRO
                  </span>
                )}
              </div>
              <span className={`block text-[11px] leading-snug line-card-desc ${active ? 'text-emerald-100' : 'text-slate-300'}`}>
                {l.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dos pestañas superiores limpias */}
      <div className="inv-segmented-tabs grid grid-cols-2 gap-1.5 p-1.5 rounded-[14px] bg-[#13315C] border border-slate-400/30 mb-4">
        <button
          type="button"
          id="wtab-btn-descuentos"
          onClick={() => setWorkTab('descuentos')}
          className={`min-h-[46px] rounded-[10px] text-[13.5px] font-extrabold tracking-wide cursor-pointer transition-colors ${
            workTab === 'descuentos' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          DESCUENTOS
        </button>
        <button
          type="button"
          id="wtab-btn-cotizacion"
          onClick={() => setWorkTab('cotizacion')}
          className={`min-h-[46px] rounded-[10px] text-[13.5px] font-extrabold tracking-wide cursor-pointer transition-colors ${
            workTab === 'cotizacion' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          COTIZACIÓN
        </button>
      </div>

      {/* PESTAÑA A: DESCUENTOS */}
      {workTab === 'descuentos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
          <div className="flex flex-col gap-4">
            {/* Plano técnico animado */}
            <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                <div>
                  <h2 className="m-0 text-[17px] font-extrabold text-slate-900">
                    Plano Técnico — {lineaCfg.nombre}
                  </h2>
                  <p className="m-0 text-[12px] text-slate-500">
                    {esMosq
                      ? `${params.linea === 'mosq-fijo' ? 'Malla fija tensada con cola de rata' : 'Hoja mosquitera corrediza con 2 carretillas'} · ${colorCfg.nombre}`
                      : esPuerta
                        ? `Puerta abatible apertura ${params.sentidoPuerta === 'izq' ? 'izquierda' : 'derecha'}`
                        : `${params.apertura === 'fija' ? '1 hoja fija' : `${params.hojas} hojas`} · ${colorCfg.nombre}`}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    id="btn-simular-apertura"
                    onClick={handleToggleSim}
                    className="inline-flex items-center justify-center min-h-[38px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold cursor-pointer"
                  >
                    {simPlaying ? 'Pausar Simulación' : proActive ? 'Simular Apertura' : 'Simular Apertura 🔒'}
                  </button>
                  {!esPuerta && params.linea !== 'mosq-fijo' && (
                    <button
                      type="button"
                      onClick={() => onChangeParams({ invertido: !params.invertido })}
                      className="inline-flex items-center justify-center min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-[12px] font-bold cursor-pointer"
                    >
                      ⇄ Invertir
                    </button>
                  )}
                </div>
              </div>

              {/* Opciones específicas de Cancel para Baño (Alumer) */}
              {esCancel && (
                <div className="mb-2.5">
                  <div className="text-[12px] font-extrabold text-slate-500 mb-1.5">
                    Serie de Marco Cancel de Baño (Alumer)
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    {(
                      [
                        ['economico', 'Económico (11035)'],
                        ['semilujo', 'Semilujo (11046)'],
                        ['lujo', 'Lujo (11173)'],
                      ] as const
                    ).map(([id, lbl]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onChangeParams({ cancelEstilo: id as CancelEstiloId })}
                        className={`min-h-[38px] px-2 rounded-lg text-[11.5px] font-bold cursor-pointer ${
                          (params.cancelEstilo || 'semilujo') === id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600'
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opciones específicas de ventana estándar */}
              {!esPuerta && !esMosq && !esCancel && (
                <>
                  <div className="mb-2.5">
                    <div className="text-[12px] font-extrabold text-slate-500 mb-1.5">Tipo de apertura</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {APERTURAS_LIST.map((ap) => {
                        const active = params.apertura === ap.id;
                        const locked = ap.pro && !proActive;
                        return (
                          <button
                            key={ap.id}
                            type="button"
                            onClick={() => {
                              if (locked) {
                                onOpenPro();
                                return;
                              }
                              onChangeParams({ apertura: ap.id });
                            }}
                            className={`flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl border text-left text-[12px] font-bold cursor-pointer ${
                              active
                                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <span className="truncate">{ap.label}</span>
                            {locked && <span className="text-amber-600 text-[10px]">🔒</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {params.apertura !== 'fija' &&
                    params.apertura !== 'guillotina' &&
                    params.apertura !== 'banderola' && (
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-2.5">
                        {[2, 3, 4].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => onChangeParams({ hojas: h })}
                            className={`min-h-[36px] rounded-lg text-[12px] font-bold cursor-pointer ${
                              params.hojas === h ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                            }`}
                          >
                            {h} Hojas
                          </button>
                        ))}
                      </div>
                    )}
                </>
              )}

              {/* Opciones específicas de puertas */}
              {esPuerta && (
                <div className="mb-2.5 flex flex-col gap-1.5">
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => onChangeParams({ sentidoPuerta: 'izq' })}
                      className={`min-h-[36px] rounded-lg text-[12.5px] font-bold cursor-pointer ${
                        params.sentidoPuerta === 'izq' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Apertura Izquierda
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeParams({ sentidoPuerta: 'der' })}
                      className={`min-h-[36px] rounded-lg text-[12.5px] font-bold cursor-pointer ${
                        params.sentidoPuerta === 'der' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Apertura Derecha
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeParams({ puertaIntermedio: !params.puertaIntermedio })}
                      className={`flex-1 min-h-[38px] px-2 py-1.5 rounded-xl border text-[12px] font-bold cursor-pointer ${
                        params.puertaIntermedio
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Intermedio / Peinazo: {params.puertaIntermedio ? 'Sí' : 'No'}
                    </button>
                    {params.linea !== 'puerta-europea' && (
                      <button
                        type="button"
                        onClick={() => onChangeParams({ puertaEconomica: !params.puertaEconomica })}
                        className={`flex-1 min-h-[38px] px-2 py-1.5 rounded-xl border text-[12px] font-bold cursor-pointer ${
                          params.puertaEconomica
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        Modo Puerta Económica: {params.puertaEconomica ? 'Sí' : 'No'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(simPlaying || simProgress > 0) && (
                <div className="mb-2.5 p-2.5 rounded-[10px] bg-slate-100 border border-slate-200">
                  <div className="flex items-center justify-between text-[11.5px] font-bold text-slate-600 mb-1.5">
                    <span>{simProgress > 5 ? 'Abierta' : 'Cerrada'}</span>
                    <span className="mono">{Math.round(simProgress)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-300 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-75"
                      style={{ width: `${simProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="border border-slate-300 rounded-xl bg-[#FAFBFD] overflow-hidden">
                <BlueprintSvg params={params} despiece={despiece} simProgress={simProgress} />
              </div>
            </div>

            {/* Medidas, Acabado y Vidrio */}
            <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[14px] font-extrabold">Medidas Totales (cm)</span>
                <span className="text-[12px] text-slate-500 mono">
                  Perímetro: {Math.round(2 * (params.anchoCm + params.altoCm))} cm
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inp-ancho" className="block text-[12px] font-bold text-slate-500 mb-1.5">
                    Ancho total (cm)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeParams({ anchoCm: Math.max(20, params.anchoCm - 5) })}
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 text-[18px] font-bold cursor-pointer"
                    >
                      −
                    </button>
                    <input
                      id="inp-ancho"
                      type="number"
                      min={1}
                      max={599.5}
                      step={0.5}
                      value={params.anchoCm}
                      onChange={(e) =>
                        onChangeParams({
                          anchoCm: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[44px] rounded-xl border border-slate-200 px-2 text-center mono text-[14.5px] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeParams({ anchoCm: params.anchoCm + 5 })}
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 text-[18px] font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[90, 100, 120, 150, 180, 240].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onChangeParams({ anchoCm: v })}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold mono cursor-pointer ${
                          params.anchoCm === v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="inp-alto" className="block text-[12px] font-bold text-slate-500 mb-1.5">
                    Alto total (cm)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeParams({ altoCm: Math.max(20, params.altoCm - 5) })}
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 text-[18px] font-bold cursor-pointer"
                    >
                      −
                    </button>
                    <input
                      id="inp-alto"
                      type="number"
                      min={1}
                      max={599.5}
                      step={0.5}
                      value={params.altoCm}
                      onChange={(e) =>
                        onChangeParams({
                          altoCm: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      className="w-full min-h-[44px] rounded-xl border border-slate-200 px-2 text-center mono text-[14.5px] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeParams({ altoCm: params.altoCm + 5 })}
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 text-[18px] font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[100, 120, 150, 210].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onChangeParams({ altoCm: v })}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold mono cursor-pointer ${
                          params.altoCm === v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="border-t border-slate-100 my-4" />

              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[14px] font-extrabold">Acabado de Perfil</span>
                <span className="text-[12px] text-slate-500 mono">
                  {colorCfg.extraM2 > 0 ? `+$${colorCfg.extraM2}/m²` : 'Base'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(COLORES_CONFIG).map((c) => {
                  const active = params.color === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onChangeParams({ color: c.id as ColorId })}
                      className={`flex items-center gap-2 min-h-[48px] px-2.5 py-2 rounded-xl border text-left cursor-pointer ${
                        active ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-md border border-slate-300 shrink-0"
                        style={{ background: c.swatch }}
                      />
                      <div>
                        <span className={`block text-[12.5px] font-bold ${active ? 'text-blue-700' : 'text-slate-900'}`}>
                          {c.nombre}
                        </span>
                        <span className="block text-[11px] text-slate-500 mono">
                          {c.extraM2 > 0 ? `+$${c.extraM2}/m²` : 'Incluido'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!esMosq ? (
                <>
                  <hr className="border-t border-slate-100 my-4" />
                  <PanelRellenoSelector
                    value={params.relleno}
                    vidrioFallback={params.vidrio}
                    customPrices={taller.rellenoPreciosM2}
                    onChange={(nextSel, compatVidrio) =>
                      onChangeParams({ relleno: nextSel, vidrio: compatVidrio })
                    }
                    onUpdatePriceM2={onUpdateRellenoPrecioM2}
                  />
                </>
              ) : (
                <>
                  <hr className="border-t border-slate-100 my-4" />
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[12.5px]">
                    <strong className="block mb-1">Insumos de Mosquitero Calculados Automáticamente:</strong>
                    <div className="mono">
                      • Tela Mosquitera: <strong>{despiece.telaMosquiteraM2.toFixed(2)} m²</strong>
                    </div>
                    <div className="mono">
                      • Cola de rata / Vinil redondo: <strong>{despiece.colaDeRataM.toFixed(2)} m</strong>
                    </div>
                    {params.linea === 'mosq-corredizo' && (
                      <div className="mono">
                        • Carretillas de mosquitero: <strong>{despiece.carretillasMosq} pzas</strong>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tarjeta Blanca: Lista de Cortes, Vidrio/Tela y Herrajes */}
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold">
                  {esMosq ? 'Lista de Cortes, Tela Mosquitera y Herrajes' : 'Lista de Cortes, Vidrio y Pijas'}
                </h2>
                <p className="m-0 text-[12px] text-slate-500">
                  {lineaCfg.nombre} · Aluminio: <span className="mono font-bold">{despiece.totalAluminioM.toFixed(2)} m/pza</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTolerancias((p) => !p)}
                className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold cursor-pointer"
              >
                Ajustar descuentos
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 mb-2 rounded-[11px] bg-blue-50 border border-blue-200">
              <label htmlFor="sel-formula-corte" className="text-[12px] font-extrabold text-blue-700 whitespace-nowrap">
                Fórmula de Corte Activa:
              </label>
              <select
                id="sel-formula-corte"
                value={selectedFormulaId}
                onChange={(e) => handleSelectFormula(e.target.value)}
                className="flex-1 min-w-[160px] min-h-[36px] rounded-lg border border-slate-200 px-2.5 text-[12.5px] font-semibold bg-white"
              >
                <optgroup label="Fórmulas de la App">
                  <option value="std">Estándar Nacional</option>
                  <option value="carr-adj">Con Carretilla Ajustable</option>
                  <option value="corte-45">Corte 45°</option>
                </optgroup>
                {formulas.length > 0 && (
                  <optgroup label="Mis Fórmulas Personalizadas">
                    {formulas.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nombre}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <button
              type="button"
              id="btn-formula-trigger"
              onClick={onOpenFormulaModal}
              className="w-full min-h-[44px] mb-3 px-4 py-2.5 rounded-xl border-[1.5px] border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[13px] font-extrabold cursor-pointer shadow-sm transition-colors"
            >
              + Crear mi propia fórmula de corte
            </button>

            {showTolerancias && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-extrabold">Tolerancias de corte (cm)</span>
                  <button
                    type="button"
                    onClick={() => onChangeParams({ tolerancias: { ...lineaCfg.toleranciasDefault } })}
                    className="text-[12px] font-bold text-blue-600 cursor-pointer"
                  >
                    Restablecer
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      ['marcoH', '− Marco Horiz.'],
                      ['hojaV', '− Hoja Vert.'],
                      ['hojaH', '− Hoja Horiz.'],
                      ['vidAncho', '− Vidrio/Tela Ancho'],
                      ['vidAlto', '− Vidrio/Tela Alto'],
                    ] as const
                  ).map(([k, lbl]) => (
                    <div key={k}>
                      <label className="block text-[11px] text-slate-500 mb-1">{lbl}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={params.tolerancias[k]}
                        onChange={(e) =>
                          onChangeParams({
                            tolerancias: {
                              ...params.tolerancias,
                              [k]: Math.max(0, Number(e.target.value) || 0),
                            },
                          })
                        }
                        className="w-full min-h-[36px] px-2 py-1 rounded-lg border border-slate-200 mono text-[12px] bg-white"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onOpenFormulaModal}
                  className="w-full min-h-[40px] mt-2.5 px-3 py-2 rounded-[10px] border border-emerald-400 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[12.5px] font-extrabold cursor-pointer"
                >
                  💾 Guardar como mi Fórmula Personalizada
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-3.5">
              <button
                type="button"
                id="tab-perfiles"
                onClick={() => setDespieceTab('perfiles')}
                className={`min-h-[38px] rounded-lg text-[12.5px] font-bold cursor-pointer ${
                  despieceTab === 'perfiles' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Perfiles ({despiece.perfiles.length})
              </button>
              <button
                type="button"
                id="tab-vidrios"
                onClick={() => setDespieceTab('vidrios')}
                className={`min-h-[38px] rounded-lg text-[12.5px] font-bold cursor-pointer ${
                  despieceTab === 'vidrios' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                {esMosq ? 'Tela (m²)' : `Vidrios (${despiece.vidrios.reduce((s, v) => s + v.pzas, 0)})`}
              </button>
              <button
                type="button"
                id="tab-herrajes"
                onClick={() => setDespieceTab('herrajes')}
                className={`min-h-[38px] rounded-lg text-[12.5px] font-bold cursor-pointer ${
                  despieceTab === 'herrajes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Herrajes ({despiece.herrajes.length})
              </button>
            </div>

            {despieceTab === 'perfiles' && (
              <div>
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full border-collapse text-[13.5px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-[12px] text-slate-500">
                        <th className="text-left py-2 px-1">Perfil</th>
                        <th className="text-center py-2 px-1">Pzas</th>
                        <th className="text-center py-2 px-1">Corte</th>
                        <th className="text-right py-2 px-1">Medida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despiece.perfiles.map((p, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2.5 px-1">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <button
                                type="button"
                                data-preserve-light="true"
                                onClick={() => onOpenPerfilModal(p.perfilId)}
                                title="Ver detalle y subir foto real del perfil"
                                className="w-9 h-9 rounded-lg bg-white border border-slate-300 hover:border-blue-500 inline-flex items-center justify-center shrink-0 p-0.5 cursor-pointer overflow-hidden"
                              >
                                <PerfilSectionSvg
                                  perfilId={p.perfilId}
                                  fotoRealUrl={getPerfilFotoUrl(perfilFotos, p.perfilId, params.linea)}
                                  size={32}
                                />
                              </button>
                              <div className="min-w-0">
                                <strong className="block text-slate-900 break-words">{p.nombre}</strong>
                                <span className="block text-[11.5px] text-slate-500 break-words">{p.funcion}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center mono font-bold">{p.pzas}</td>
                          <td className="text-center mono">{p.angulo}</td>
                          <td className="text-right mono font-extrabold text-blue-600 whitespace-nowrap">
                            {p.medidaCm.toFixed(1)} cm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[12px] text-slate-500 mono mt-3 mb-0">
                  Total aluminio: {despiece.totalAluminioM.toFixed(2)} m · {despiece.tramos610} tramo(s) de 6.10 m
                </p>
              </div>
            )}

            {despieceTab === 'vidrios' && (
              <div className="flex flex-col gap-2.5">
                {despiece.vidrios.map((v, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-[13.5px]">{v.nombre}</strong>
                      <span className="text-[12px] text-slate-500">
                        {v.pzas} pza(s) · {v.espesorLabel}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block mono font-extrabold text-blue-600 text-[14px]">
                        {v.anchoCm} × {v.altoCm} cm
                      </span>
                      <span className="mono text-[11.5px] text-slate-500">{v.areaM2.toFixed(2)} m²</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {despieceTab === 'herrajes' && (
              <div className="flex flex-col gap-2">
                {despiece.herrajes.map((h, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <strong className="block text-[13px] text-slate-900">{h.nombre}</strong>
                      <span className="text-[11.5px] text-slate-500">{h.detalle}</span>
                    </div>
                    <span className="mono font-extrabold text-blue-700 text-[13.5px] whitespace-nowrap">
                      {h.cantidad} {h.unidad}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <hr className="border-t border-slate-100 my-4" />
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setWorkTab('cotizacion')}
                className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13.5px] cursor-pointer"
              >
                Ir a Cotización →
              </button>
              <button
                type="button"
                onClick={() => generarPdfTecnico(params, despiece, cot, taller)}
                className="min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-bold text-[13px] cursor-pointer"
              >
                PDF Taller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA B: COTIZACIÓN */}
      {workTab === 'cotizacion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[14px] font-extrabold">Cálculo de Costo y Ajustes</span>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl w-[170px]">
                <button
                  type="button"
                  onClick={() => onChangeModoPrecio('m2')}
                  className={`min-h-[34px] rounded-lg text-[12px] font-bold cursor-pointer ${
                    modoPrecio === 'm2' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Por m²
                </button>
                <button
                  type="button"
                  onClick={() => onChangeModoPrecio('base')}
                  className={`min-h-[34px] rounded-lg text-[12px] font-bold cursor-pointer ${
                    modoPrecio === 'base' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Precio base
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="inp-precio" className="block text-[12px] font-bold text-slate-500 mb-1.5">
                  {modoPrecio === 'm2' ? 'Base por m² ($ MXN)' : 'Precio unitario fijo ($ MXN)'}
                </label>
                <input
                  id="inp-precio"
                  type="number"
                  min={0}
                  step={50}
                  value={precioInput}
                  onChange={(e) => onChangePrecioInput(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[14.5px] font-semibold"
                />
              </div>

              <div>
                <span className="block text-[12px] font-bold text-slate-500 mb-1.5">
                  Cantidad (pzas) {!proActive && <span className="text-amber-600">🔒 PRO +1</span>}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeParams({ cantidad: Math.max(1, params.cantidad - 1) })}
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 text-[18px] font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <div className="w-full min-h-[44px] rounded-xl border border-slate-200 flex items-center justify-center mono font-bold">
                    {params.cantidad}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!proActive) {
                        onOpenPro();
                        return;
                      }
                      onChangeParams({ cantidad: params.cantidad + 1 });
                    }}
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 text-[18px] font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="inp-area" className="block text-[12px] font-bold text-slate-500 mb-1.5">
                Área / Habitación {!proActive && <span className="text-amber-600">🔒 PRO</span>}
              </label>
              <input
                id="inp-area"
                type="text"
                value={areaText}
                onChange={(e) => onChangeAreaText(e.target.value)}
                placeholder="Ej. Sala, Cocina"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-[13.5px] font-semibold"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AREAS_SUGERIDAS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => onChangeAreaText(a)}
                    className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer ${
                      areaText === a ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label htmlFor="inp-etiqueta-pieza" className="block text-[12px] font-bold text-slate-500 mb-1.5">
                  Etiqueta / No. de pieza
                </label>
                <input
                  id="inp-etiqueta-pieza"
                  type="text"
                  value={etiquetaPieza}
                  onChange={(e) => onChangeEtiquetaPieza(e.target.value)}
                  placeholder="Ej. Ventana 1, Mosquitero Sala"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-[13.5px] font-semibold"
                />
              </div>
              <div>
                <label htmlFor="inp-extra-pct" className="block text-[12px] font-bold text-slate-500 mb-1.5">
                  % extra por pieza {!proActive && <span className="text-amber-600">🔒 PRO</span>}
                </label>
                <input
                  id="inp-extra-pct"
                  type="number"
                  min={0}
                  max={500}
                  value={extraPct}
                  onChange={(e) => {
                    if (!proActive) {
                      onOpenPro();
                      return;
                    }
                    onChangeExtraPct(Math.max(0, Number(e.target.value) || 0));
                  }}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[14.5px] font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-3.5 text-[13px] font-semibold text-slate-800">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cobrarMinM2}
                  onChange={(e) => onChangeCobrarMinM2(e.target.checked)}
                />
                Cobrar mínimo 1.00 m²
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirIva}
                  onChange={(e) => onChangeIncluirIva(e.target.checked)}
                />
                Incluir IVA (16%)
              </label>
            </div>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold">Resumen de Pieza Actual</h2>
                <p className="m-0 text-[12px] text-slate-500">
                  {params.cantidad} pza(s) · {lineaCfg.nombre} · {colorCfg.nombre}
                </p>
              </div>
              <span className="mono text-[13px] font-extrabold text-blue-600">
                {cot.areaCobradaM2.toFixed(2)} m²
              </span>
            </div>

            <div className="border-y border-slate-100 py-2.5 my-3 flex flex-col gap-1.5 text-[13.5px] text-slate-600">
              <div className="flex justify-between">
                <span>
                  Base {lineaCfg.nombre} ({modoPrecio === 'm2' ? `${formatMXN(cot.tarifaBaseM2)}/m²` : 'fijo'})
                </span>
                <span className="mono font-bold text-slate-900">
                  {formatMXN(modoPrecio === 'm2' ? cot.areaCobradaM2 * cot.tarifaBaseM2 * params.cantidad : cot.subtotalPiezas)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Acabado {colorCfg.nombre}</span>
                <span className="mono font-bold text-slate-900">
                  {formatMXN(modoPrecio === 'm2' ? cot.areaCobradaM2 * cot.extraColorM2 * params.cantidad : 0)}
                </span>
              </div>
              {!esMosq && (
                <div className="flex justify-between">
                  <span>Panel {rellenoLabel}</span>
                  <span className="mono font-bold text-slate-900">
                    {formatMXN(modoPrecio === 'm2' ? cot.areaCobradaM2 * cot.extraVidrioM2 * params.cantidad : 0)}
                  </span>
                </div>
              )}
              {cot.extraPctMonto > 0 && (
                <div className="flex justify-between">
                  <span>Extra ({extraPct}%)</span>
                  <span className="mono font-bold text-slate-900">{formatMXN(cot.extraPctMonto)}</span>
                </div>
              )}
              {cot.ivaMonto > 0 && (
                <div className="flex justify-between">
                  <span>IVA (16%)</span>
                  <span className="mono font-bold text-slate-900">{formatMXN(cot.ivaMonto)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline font-extrabold pt-1">
              <span>Total pieza actual</span>
              <span className="mono text-[25px] text-blue-600">{formatMXN(cot.totalFinal)}</span>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[11.5px] font-extrabold text-emerald-800 mb-1">
                RESUMEN INTERNO TALLER (Desc. Distribuidor: {taller.descDistribuidorPct}%)
              </div>
              <div className="flex justify-between text-[12px] text-emerald-900">
                <span>Costo real material ({despiece.tramos610} tramos + {esMosq ? 'malla' : 'cristal'} + herrajes)</span>
                <strong className="mono">{formatMXN(cot.costoMaterialEstimado)}</strong>
              </div>
              <div className="flex justify-between text-[13px] text-emerald-700 mt-0.5">
                <strong>Ganancia libre aproximada</strong>
                <strong className="mono">
                  {formatMXN(cot.gananciaLibre)} ({cot.margenPct}%)
                </strong>
              </div>
            </div>

            {editingPartidaId && (
              <div className="mt-2.5 px-3 py-2 rounded-[10px] bg-amber-100 text-amber-900 text-[12px] font-bold flex items-center justify-between gap-2">
                <span>Editando partida existente de la Hoja</span>
                <button
                  type="button"
                  onClick={onCancelarEdicion}
                  className="underline font-extrabold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            <button
              type="button"
              id="btn-agregar-obra"
              onClick={() => {
                if (!proActive) {
                  onOpenPro();
                  return;
                }
                onAgregarObra();
              }}
              className="w-full min-h-[50px] mt-3.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] cursor-pointer"
            >
              {editingPartidaId
                ? '✓ Guardar Cambios en Hoja de Cotización'
                : proActive
                  ? '+ Agregar a Hoja de Cotización'
                  : '+ Agregar a Hoja de Cotización 🔒 PRO'}
            </button>

            <hr className="border-t border-slate-100 my-4" />

            <div className="mb-3">
              <label htmlFor="inp-referencia" className="block text-[12px] font-bold text-slate-500 mb-1.5">
                Referencia rápida / Guardar en historial
              </label>
              <div className="flex gap-2">
                <input
                  id="inp-referencia"
                  type="text"
                  value={referencia}
                  onChange={(e) => onChangeReferencia(e.target.value)}
                  placeholder="Ej. Ventana sala Casa Sr. López"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-[13.5px] font-semibold"
                />
                <button
                  type="button"
                  onClick={onGuardarHistorial}
                  className="min-h-[44px] px-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold text-[13px] cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copiarWhatsApp}
                className="min-h-[46px] px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-[14px] cursor-pointer"
              >
                Copiar para WhatsApp
              </button>
              <button
                type="button"
                onClick={() => generarPdfTecnico(params, despiece, cot, taller)}
                className="min-h-[46px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-bold text-[13px] cursor-pointer"
              >
                PDF Técnico Taller
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
