import React, { useMemo, useState } from 'react';
import {
  COLORES_CONFIG,
  ColorId,
  CorteVidrio,
  LineaId,
  PartidaObra,
  round2,
} from '../utils/alumineroLogic';
import {
  buildPartidaFromModulacion,
  calcularModulacionCortes,
  getPerfilesBaseModulacion,
  MODULACION_MODELOS,
  MODULACION_SECCIONES_META,
  MODULACION_SERIES,
  MODULACION_SUBLINEAS,
  ModulacionCategoria,
  ModulacionModeloId,
  ModulacionSerieId,
  ModulacionSublineaId,
  optimizarTramos1D,
} from '../utils/modulacionLogic';
import { SobranteItem } from '../utils/storageHelpers';
import { PerfilSectionSvg } from './PerfilSectionSvg';

interface ModulacionCortesViewProps {
  tarifasBase: Partial<Record<LineaId, number>>;
  proActive: boolean;
  sobrantes: SobranteItem[];
  onAddSobrante: (item: Omit<SobranteItem, 'id' | 'fecha'>) => void;
  onSendToHoja: (partida: PartidaObra, goToHoja: boolean) => void;
  onSendVidriosToOptimizer?: (vidrios: CorteVidrio[]) => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const ModelSvgIllustration: React.FC<{ modeloId: ModulacionModeloId }> = ({ modeloId }) => {
  if (modeloId === 'win-corrediza') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="14" y="10" width="112" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="20" y="16" width="50" height="64" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <rect x="70" y="16" width="50" height="64" fill="#BFDBFE" stroke="#1D4ED8" strokeWidth="1.5" />
        <line x1="70" y1="12" x2="70" y2="84" stroke="#1E3A8A" strokeWidth="1.8" />
        <path d="M36 48h18m-5-4 5 4-5 4" stroke="#1D4ED8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M104 48H86m5-4-5 4 5 4" stroke="#1D4ED8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (modeloId === 'win-proyeccion') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="22" y="10" width="96" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="28" y="16" width="84" height="64" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <polyline points="28,16 70,80 112,16" fill="none" stroke="#1D4ED8" strokeWidth="1.6" strokeDasharray="4 3" />
        <path d="M70 52v18m-5-5 5 5 5-5" stroke="#1D4ED8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (modeloId === 'win-abatible') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="22" y="10" width="96" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="28" y="16" width="84" height="64" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <polyline points="28,16 112,48 28,80" fill="none" stroke="#1D4ED8" strokeWidth="1.6" strokeDasharray="4 3" />
        <rect x="102" y="42" width="4" height="12" rx="1.5" fill="#1E3A8A" />
      </svg>
    );
  }
  if (modeloId === 'win-fija') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="20" y="10" width="100" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="27" y="17" width="86" height="62" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <line x1="40" y1="28" x2="64" y2="52" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="56" y1="28" x2="72" y2="44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <text x="70" y="68" textAnchor="middle" fill="#1E40AF" fontSize="10" fontWeight="800">FIJO</text>
      </svg>
    );
  }
  if (modeloId === 'win-sifon') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="22" y="10" width="96" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="28" y="16" width="84" height="32" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
        <rect x="28" y="50" width="84" height="30" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <line x1="34" y1="25" x2="106" y2="25" stroke="#1D4ED8" strokeWidth="1.6" />
        <line x1="34" y1="34" x2="106" y2="34" stroke="#1D4ED8" strokeWidth="1.6" />
        <line x1="34" y1="43" x2="106" y2="43" stroke="#1D4ED8" strokeWidth="1.6" />
        <polyline points="28,80 70,50 112,80" fill="none" stroke="#1D4ED8" strokeWidth="1.6" strokeDasharray="4 3" />
      </svg>
    );
  }
  if (modeloId === 'win-guillotina') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="24" y="8" width="92" height="80" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="30" y="14" width="80" height="34" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
        <rect x="30" y="48" width="80" height="34" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.5" />
        <path d="M70 72V56m-4 4 4-4 4 4" stroke="#1E3A8A" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M70 22v16m-4-4 4 4 4-4" stroke="#1E3A8A" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (modeloId === 'door-corrediza') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="18" y="6" width="104" height="84" rx="2" fill="#EEF2FF" stroke="#312E81" strokeWidth="2.4" />
        <rect x="24" y="12" width="46" height="74" fill="#E0E7FF" stroke="#4F46E5" strokeWidth="1.5" />
        <rect x="70" y="12" width="46" height="74" fill="#C7D2FE" stroke="#4338CA" strokeWidth="1.5" />
        <path d="M36 49h16m-4-4 4 4-4 4" stroke="#3730A3" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M104 49H88m4-4-4 4 4 4" stroke="#3730A3" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <rect x="108" y="42" width="4" height="14" rx="1.5" fill="#312E81" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
      <rect x="40" y="6" width="60" height="84" rx="2" fill="#EEF2FF" stroke="#312E81" strokeWidth="2.4" />
      <rect x="46" y="12" width="48" height="40" fill="#C7D2FE" stroke="#4F46E5" strokeWidth="1.5" />
      <rect x="46" y="56" width="48" height="30" fill="#E0E7FF" stroke="#4338CA" strokeWidth="1.5" />
      <polyline points="46,12 94,48 46,86" fill="none" stroke="#4338CA" strokeWidth="1.6" strokeDasharray="4 3" />
      <circle cx="88" cy="50" r="2.8" fill="#312E81" />
    </svg>
  );
};

const STEP_LABELS = [
  '1. Modelo',
  '2. Mosquitero',
  '3. Línea / Serie',
  '4. Perfiles',
  '5. Cortes y Tramos',
];

const BAR_SEGMENT_COLORS = [
  '#2563EB',
  '#059669',
  '#7C3AED',
  '#0891B2',
  '#EA580C',
  '#4F46E5',
];

export const ModulacionCortesView: React.FC<ModulacionCortesViewProps> = ({
  tarifasBase,
  proActive,
  sobrantes,
  onAddSobrante,
  onSendToHoja,
  onSendVidriosToOptimizer,
  onShowToast,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [categoria, setCategoria] = useState<ModulacionCategoria>('ventanas');
  const [modeloId, setModeloId] = useState<ModulacionModeloId>('win-corrediza');
  const [mosquiteroModalOpen, setMosquiteroModalOpen] = useState(false);
  const [conMosquitero, setConMosquitero] = useState(false);
  const [serieId, setSerieId] = useState<ModulacionSerieId>('linea-3');
  const [sublineaId, setSublineaId] = useState<ModulacionSublineaId>('comercial-hermetica');

  const [unidad, setUnidad] = useState<'cm' | 'm'>('cm');
  const [anchoInput, setAnchoInput] = useState<string>('120');
  const [altoInput, setAltoInput] = useState<string>('100');

  // Sub-pestaña en Paso 5: Lista de Cortes y Checklist vs Optimizador 1D (6.10 m)
  const [paso5Tab, setPaso5Tab] = useState<'cortes' | 'tramos'>('cortes');
  const [cortadosMap, setCortadosMap] = useState<Record<string, number>>({});
  const [colorParaSobrantes, setColorParaSobrantes] = useState<ColorId>('natural');
  const [marcaParaSobrantes, setMarcaParaSobrantes] = useState<string>('Alumer');
  const [discoKerfMm, setDiscoKerfMm] = useState<number>(3.5);
  const [umbralSobranteCm, setUmbralSobranteCm] = useState<number>(45);

  const modelosVisibles = useMemo(
    () => MODULACION_MODELOS.filter((m) => m.categoria === categoria),
    [categoria]
  );

  const selectedModelo = useMemo(
    () => MODULACION_MODELOS.find((m) => m.id === modeloId) || MODULACION_MODELOS[0],
    [modeloId]
  );

  const selectedSerie = useMemo(
    () => MODULACION_SERIES.find((s) => s.id === serieId) || MODULACION_SERIES[3],
    [serieId]
  );

  const selectedSublinea = useMemo(
    () => MODULACION_SUBLINEAS.find((sl) => sl.id === sublineaId) || MODULACION_SUBLINEAS[0],
    [sublineaId]
  );

  const perfilesPaso4 = useMemo(
    () => getPerfilesBaseModulacion(modeloId, conMosquitero),
    [modeloId, conMosquitero]
  );

  const anchoCm = useMemo(() => {
    const val = Number(anchoInput) || 0;
    return unidad === 'm' ? Math.max(20, round2(val * 100)) : Math.max(20, val);
  }, [anchoInput, unidad]);

  const altoCm = useMemo(() => {
    const val = Number(altoInput) || 0;
    return unidad === 'm' ? Math.max(20, round2(val * 100)) : Math.max(20, val);
  }, [altoInput, unidad]);

  const calculoCortes = useMemo(
    () =>
      calcularModulacionCortes({
        modeloId,
        conMosquitero,
        serieId,
        sublineaId,
        anchoCm,
        altoCm,
      }),
    [modeloId, conMosquitero, serieId, sublineaId, anchoCm, altoCm]
  );

  const lineaCompatible: LineaId =
    selectedModelo.categoria === 'puertas'
      ? selectedSerie.mappedLineaPuerta
      : selectedSerie.mappedLineaVentana;

  const optimizacion1D = useMemo(
    () =>
      optimizarTramos1D({
        perfiles: calculoCortes.perfiles,
        sobrantesInventario: sobrantes,
        lineaCompatible,
        kerfCm: Math.max(0, round2(discoKerfMm / 10)),
        minSobranteGuardableCm: Math.max(10, Math.round(umbralSobranteCm) || 45),
      }),
    [calculoCortes.perfiles, sobrantes, lineaCompatible, discoKerfMm, umbralSobranteCm]
  );

  const seccionesConFilas = useMemo(
    () =>
      MODULACION_SECCIONES_META.map((sec) => ({
        ...sec,
        rows: calculoCortes.perfiles.filter((r) => r.seccion === sec.id),
      })).filter((s) => s.rows.length > 0),
    [calculoCortes.perfiles]
  );

  const totalPiezasRequeridas = useMemo(
    () => calculoCortes.perfiles.reduce((acc, r) => acc + r.cantidad, 0),
    [calculoCortes.perfiles]
  );

  const totalPiezasCortadas = useMemo(
    () =>
      calculoCortes.perfiles.reduce(
        (acc, r) => acc + Math.min(r.cantidad, cortadosMap[r.id] || 0),
        0
      ),
    [calculoCortes.perfiles, cortadosMap]
  );

  const getCutCount = (rowId: string, max: number) =>
    Math.max(0, Math.min(max, cortadosMap[rowId] || 0));

  const handleStepCutCount = (rowId: string, max: number, delta: number) => {
    setCortadosMap((prev) => {
      const cur = Math.max(0, Math.min(max, prev[rowId] || 0));
      const next = Math.max(0, Math.min(max, cur + delta));
      return { ...prev, [rowId]: next };
    });
  };

  const handleToggleCompleteRow = (rowId: string, max: number) => {
    setCortadosMap((prev) => {
      const cur = Math.max(0, Math.min(max, prev[rowId] || 0));
      return { ...prev, [rowId]: cur >= max ? 0 : max };
    });
  };

  const handleToggleUnidad = (nextUnit: 'cm' | 'm') => {
    if (nextUnit === unidad) return;
    const curAncho = Number(anchoInput) || 120;
    const curAlto = Number(altoInput) || 100;
    if (nextUnit === 'm') {
      setAnchoInput(String(round2(curAncho / 100)));
      setAltoInput(String(round2(curAlto / 100)));
    } else {
      setAnchoInput(String(Math.round(curAncho * 100)));
      setAltoInput(String(Math.round(curAlto * 100)));
    }
    setUnidad(nextUnit);
  };

  const handlePickModelo = (id: ModulacionModeloId) => {
    setModeloId(id);
    setCortadosMap({});
    setMosquiteroModalOpen(true);
  };

  const handleChooseMosquitero = (value: boolean) => {
    setConMosquitero(value);
    setMosquiteroModalOpen(false);
    setCortadosMap({});
    setStep(3);
  };

  const handleSendToHoja = () => {
    const partida = buildPartidaFromModulacion(calculoCortes, tarifasBase);
    onSendToHoja(partida, proActive);
    onShowToast(
      proActive
        ? 'Tramos enviados a Hoja de Cotización'
        : 'Tramos guardados en tu Hoja de Cotización',
      true
    );
  };

  const handleGuardarSobrantesGenerados = () => {
    if (optimizacion1D.sobrantesGeneradosGuardables.length === 0) {
      onShowToast(`No hay sobrantes útiles (>= ${umbralSobranteCm} cm) para guardar`);
      return;
    }
    optimizacion1D.sobrantesGeneradosGuardables.forEach((s) => {
      onAddSobrante({
        marca: marcaParaSobrantes || 'Alumer',
        linea: lineaCompatible,
        perfilId: s.perfilId,
        color: colorParaSobrantes,
        largoM: s.largoM,
        cantidad: s.cantidad,
        nota: `Sobrante de Modulación (${selectedModelo.nombre} ${calculoCortes.anchoCm}×${calculoCortes.altoCm} cm)`,
      });
    });
    onShowToast(
      `${optimizacion1D.sobrantesGeneradosGuardables.length} medida(s) de sobrante guardada(s) en Inventario`,
      true
    );
  };

  return (
    <section id="view-modulacion" className="screen-animate">
      {/* Encabezado y barra de pasos */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-[21px] font-extrabold text-white">
              Modulación y Cortes
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-[11px] font-extrabold">
              Gratis
            </span>
          </div>
          <p className="m-0 text-[12.5px] text-slate-300 mt-0.5">
            Asistente técnico en 5 pasos con checklist de taller y optimizador 1D de tramos (6.10 m)
          </p>
        </div>
      </div>

      {/* Stepper interactivo de 5 pasos */}
      <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-3 mb-4 shadow-md">
        <div className="grid grid-cols-5 gap-1.5">
          {STEP_LABELS.map((label, idx) => {
            const num = (idx + 1) as 1 | 2 | 3 | 4 | 5;
            const active = step === num;
            const completed = step > num;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (num === 2) {
                    setMosquiteroModalOpen(true);
                  } else {
                    setStep(num);
                  }
                }}
                className={`min-h-[40px] px-1.5 py-1.5 rounded-xl text-[10.5px] sm:text-[12px] font-extrabold border cursor-pointer transition-all text-center leading-tight ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : completed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Resumen rápido de selección actual */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex flex-wrap items-center gap-2 text-[11.5px] font-bold text-slate-700">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
            {selectedModelo.categoria === 'puertas' ? 'Puerta' : 'Ventana'} {selectedModelo.nombre}
          </span>
          <button
            type="button"
            onClick={() => setMosquiteroModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold cursor-pointer hover:bg-teal-100"
          >
            {conMosquitero ? '✓ Con mosquitero' : 'Sin mosquitero'}
          </button>
          {step >= 3 && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-slate-800">
              {selectedSerie.nombre} · {selectedSublinea.nombre}
            </span>
          )}
        </div>
      </div>

      {/* ==================== PASO 1: VENTANAS Y PUERTAS ==================== */}
      {step === 1 && (
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[20px] p-4 sm:p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold">
                Paso 1: Elige el tipo de ventana o puerta
              </h2>
              <p className="m-0 text-[12.5px] text-slate-600 mt-0.5">
                Toca el modelo que vas a modular para pasar al siguiente paso
              </p>
            </div>
          </div>

          <div className="inv-segmented-tabs grid grid-cols-2 gap-1.5 p-1.5 rounded-[14px] bg-[#13315C] border border-slate-400/30 mb-4">
            <button
              type="button"
              id="mod-tab-ventanas"
              onClick={() => setCategoria('ventanas')}
              className={`min-h-[42px] rounded-[10px] text-[13.5px] font-extrabold cursor-pointer transition-colors ${
                categoria === 'ventanas'
                  ? 'bg-white text-[#1E293B] shadow'
                  : 'bg-transparent text-slate-300'
              }`}
            >
              Ventanas (6)
            </button>
            <button
              type="button"
              id="mod-tab-puertas"
              onClick={() => setCategoria('puertas')}
              className={`min-h-[42px] rounded-[10px] text-[13.5px] font-extrabold cursor-pointer transition-colors ${
                categoria === 'puertas'
                  ? 'bg-white text-[#1E293B] shadow'
                  : 'bg-transparent text-slate-300'
              }`}
            >
              Puertas (2)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {modelosVisibles.map((m) => {
              const selected = modeloId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  id={`mod-modelo-${m.id}`}
                  onClick={() => handlePickModelo(m.id)}
                  className={`p-3 rounded-[16px] border-[1.5px] text-left cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 flex flex-col gap-2 ${
                    selected
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                      : 'border-slate-300 bg-slate-50 hover:border-blue-400'
                  }`}
                >
                  <div className="w-full rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center">
                    <ModelSvgIllustration modeloId={m.id} />
                  </div>
                  <div>
                    <strong className="block text-[14.5px] font-extrabold text-slate-900">
                      {m.nombre}
                    </strong>
                    <span className="block text-[11.5px] text-slate-600 mt-0.5 leading-snug">
                      {m.resumen}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== PASO 3: LÍNEA / SERIE Y SUBLÍNEA ==================== */}
      {step === 3 && (
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[20px] p-4 sm:p-5 shadow-xl flex flex-col gap-5">
          <div>
            <h2 className="m-0 text-[18px] font-extrabold">
              Paso 3: Selecciona Línea / Serie y Sublínea
            </h2>
            <p className="m-0 text-[12.5px] text-slate-600 mt-0.5">
              Define la serie del perfil y la categoría hermética para ajustar los descuentos estándar
            </p>
          </div>

          <div>
            <span className="block text-[12.5px] font-extrabold uppercase tracking-wide text-slate-600 mb-2">
              1. Línea o Serie
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {MODULACION_SERIES.map((s) => {
                const selected = serieId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    id={`mod-serie-${s.id}`}
                    onClick={() => setSerieId(s.id)}
                    className={`p-3 rounded-xl border-[1.5px] text-left cursor-pointer transition-all active:scale-95 ${
                      selected
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-slate-300 bg-slate-50 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[14px] font-extrabold text-slate-900">
                        {s.nombre}
                      </strong>
                      <span className="mono text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-300 text-blue-700 shrink-0">
                        {s.espesorLabel}
                      </span>
                    </div>
                    <span className="block text-[11.5px] text-slate-600 mt-1 leading-snug">
                      {s.descripcion}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-[12.5px] font-extrabold uppercase tracking-wide text-slate-600 mb-2">
              2. Sublínea
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {MODULACION_SUBLINEAS.map((sl) => {
                const selected = sublineaId === sl.id;
                return (
                  <button
                    key={sl.id}
                    type="button"
                    id={`mod-sublinea-${sl.id}`}
                    onClick={() => setSublineaId(sl.id)}
                    className={`p-3.5 rounded-xl border-[1.5px] text-left cursor-pointer transition-all active:scale-95 ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                        : 'border-slate-300 bg-slate-50 hover:border-emerald-400'
                    }`}
                  >
                    <strong className="block text-[13.5px] font-extrabold text-slate-900">
                      {sl.nombre}
                    </strong>
                    <span className="block text-[11.5px] text-slate-600 mt-1 leading-snug">
                      {sl.descripcion}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setMosquiteroModalOpen(true)}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[13px] cursor-pointer"
            >
              ← Cambiar mosquitero
            </button>
            <button
              type="button"
              id="btn-mod-go-step4"
              onClick={() => setStep(4)}
              className="min-h-[46px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-md"
            >
              Ver perfiles requeridos (Paso 4) →
            </button>
          </div>
        </div>
      )}

      {/* ==================== PASO 4: LISTA DE PERFILES REQUERIDOS ==================== */}
      {step === 4 && (
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[20px] p-4 sm:p-5 shadow-xl flex flex-col gap-4">
          <div>
            <h2 className="m-0 text-[18px] font-extrabold">
              Paso 4: Perfiles requeridos y sección transversal
            </h2>
            <p className="m-0 text-[12.5px] text-slate-600 mt-0.5">
              Organizados por sección para armar tu {selectedModelo.categoria === 'puertas' ? 'puerta' : 'ventana'}{' '}
              <strong>{selectedModelo.nombre}</strong> en <strong>{selectedSerie.nombre}</strong> ({selectedSublinea.nombre})
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {MODULACION_SECCIONES_META.map((sec) => {
              const items = perfilesPaso4.filter((item) => item.seccion === sec.id);
              if (items.length === 0) return null;
              return (
                <div key={sec.id} className="rounded-2xl border border-slate-300 bg-slate-50/70 p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div>
                      <h3 className="m-0 text-[14px] font-extrabold text-blue-700 uppercase tracking-wide">
                        {sec.titulo}
                      </h3>
                      <p className="m-0 text-[11.5px] text-slate-500">{sec.subtitulo}</p>
                    </div>
                    <span className="mono text-[11px] font-bold text-slate-600">
                      {items.length} perfiles
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-slate-300 bg-white flex items-center gap-3 min-w-0 overflow-hidden"
                      >
                        <div
                          data-preserve-light="true"
                          className="w-[64px] h-[64px] rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 p-1"
                        >
                          <PerfilSectionSvg
                            perfilId={item.perfilId}
                            orientacion={item.orientacion}
                            size={52}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1 min-w-0">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 mono text-[10.5px] font-extrabold">
                              {item.cantidadLabel}
                            </span>
                            <span className="mono text-[10.5px] font-bold text-slate-500 break-all">
                              {item.codigo}
                            </span>
                          </div>
                          <strong className="block text-[13.5px] font-extrabold text-slate-900 leading-tight break-words">
                            {item.nombre}
                          </strong>
                          <span className="block text-[11px] text-slate-600 mt-0.5 leading-snug break-words">
                            {item.rol}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[13px] cursor-pointer"
            >
              ← Cambiar serie
            </button>
            <button
              type="button"
              id="btn-mod-go-step5"
              onClick={() => setStep(5)}
              className="min-h-[46px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-md"
            >
              Calcular cortes y tramos (Paso 5) →
            </button>
          </div>
        </div>
      )}

      {/* ==================== PASO 5: CORTES AGRUPADOS + CHECKLIST + OPTIMIZADOR 1D ==================== */}
      {step === 5 && (
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[20px] p-4 sm:p-5 shadow-xl flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold">
                Paso 5: Medidas, Checklist de Corte y Tramos (6.10 m)
              </h2>
              <p className="m-0 text-[12.5px] text-slate-600 mt-0.5">
                Marca las piezas conforme las cortas en taller y optimiza tramos aprovechando tus sobrantes
              </p>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-300 shrink-0">
              <button
                type="button"
                id="btn-mod-unit-cm"
                onClick={() => handleToggleUnidad('cm')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold cursor-pointer transition-colors ${
                  unidad === 'cm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                }`}
              >
                cm
              </button>
              <button
                type="button"
                id="btn-mod-unit-m"
                onClick={() => handleToggleUnidad('m')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold cursor-pointer transition-colors ${
                  unidad === 'm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                }`}
              >
                metros (m)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-300">
            <div>
              <label htmlFor="inp-mod-ancho" className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Ancho del vano ({unidad})
              </label>
              <input
                id="inp-mod-ancho"
                type="number"
                step={unidad === 'm' ? '0.01' : '0.5'}
                min={unidad === 'm' ? 0.2 : 20}
                value={anchoInput}
                onChange={(e) => {
                  setAnchoInput(e.target.value);
                  setCortadosMap({});
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 mono text-[16px] font-extrabold bg-white"
              />
              <span className="block text-[11px] text-slate-500 mono mt-1">
                Equivalente: {calculoCortes.anchoCm} cm ({round2(calculoCortes.anchoCm / 100)} m)
              </span>
            </div>

            <div>
              <label htmlFor="inp-mod-alto" className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Alto del vano ({unidad})
              </label>
              <input
                id="inp-mod-alto"
                type="number"
                step={unidad === 'm' ? '0.01' : '0.5'}
                min={unidad === 'm' ? 0.2 : 20}
                value={altoInput}
                onChange={(e) => {
                  setAltoInput(e.target.value);
                  setCortadosMap({});
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 mono text-[16px] font-extrabold bg-white"
              />
              <span className="block text-[11px] text-slate-500 mono mt-1">
                Equivalente: {calculoCortes.altoCm} cm ({round2(calculoCortes.altoCm / 100)} m)
              </span>
            </div>
          </div>

          {/* Pestañas Paso 5: Lista de Cortes y Checklist vs Optimización de Tramos (6.10 m) */}
          <div className="inv-segmented-tabs grid grid-cols-2 gap-1.5 p-1.5 rounded-[14px] bg-[#13315C] border border-slate-400/30">
            <button
              type="button"
              id="btn-mod-tab-cortes"
              onClick={() => setPaso5Tab('cortes')}
              className={`min-h-[42px] rounded-[10px] text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer transition-colors ${
                paso5Tab === 'cortes'
                  ? 'bg-white text-[#1E293B] shadow'
                  : 'bg-transparent text-slate-300'
              }`}
            >
              Checklist de Cortes ({totalPiezasCortadas}/{totalPiezasRequeridas})
            </button>
            <button
              type="button"
              id="btn-mod-tab-tramos"
              onClick={() => setPaso5Tab('tramos')}
              className={`min-h-[42px] rounded-[10px] text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer transition-colors ${
                paso5Tab === 'tramos'
                  ? 'bg-white text-[#1E293B] shadow'
                  : 'bg-transparent text-slate-300'
              }`}
            >
              Optimización de Tramos (6.10 m)
            </button>
          </div>

          {/* SUB-PESTAÑA A: CHECKLIST DE CORTE POR SECCIÓN */}
          {paso5Tab === 'cortes' && (
            <div className="flex flex-col gap-3.5">
              {/* Barra de progreso de corte */}
              <div className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                <div className="flex items-center justify-between gap-2 text-[12px] font-extrabold mb-1.5">
                  <span className="text-slate-700">
                    Avance de corte en taller: <span className="mono text-blue-700">{totalPiezasCortadas}/{totalPiezasRequeridas}</span> piezas
                  </span>
                  {totalPiezasCortadas > 0 && (
                    <button
                      type="button"
                      onClick={() => setCortadosMap({})}
                      className="text-[11.5px] font-bold text-slate-500 hover:text-red-600 cursor-pointer bg-transparent border-0"
                    >
                      Reiniciar checklist
                    </button>
                  )}
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-200"
                    style={{
                      width: `${totalPiezasRequeridas > 0 ? Math.round((totalPiezasCortadas / totalPiezasRequeridas) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {seccionesConFilas.map((sec) => {
                const secReq = sec.rows.reduce((a, r) => a + r.cantidad, 0);
                const secDone = sec.rows.reduce(
                  (a, r) => a + getCutCount(r.id, r.cantidad),
                  0
                );
                return (
                  <div key={sec.id} className="rounded-2xl border-[1.5px] border-slate-300 overflow-hidden">
                    <div className="bg-[#0B2545] text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <strong className="block text-[13.5px] font-extrabold tracking-wide">
                          {sec.titulo}
                        </strong>
                        <span className="block text-[11px] text-slate-300">{sec.subtitulo}</span>
                      </div>
                      <span
                        className={`mono px-2.5 py-1 rounded-lg text-[11.5px] font-extrabold ${
                          secDone >= secReq
                            ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200'
                            : 'bg-white/10 border border-white/20 text-white'
                        }`}
                      >
                        {secDone}/{secReq} pzas
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200 bg-white">
                      {sec.rows.map((row) => {
                        const cutDone = getCutCount(row.id, row.cantidad);
                        const isComplete = cutDone >= row.cantidad;
                        return (
                          <div
                            key={row.id}
                            className={`p-3 flex flex-wrap items-center justify-between gap-2.5 min-w-0 transition-colors ${
                              isComplete ? 'bg-emerald-50/70' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 basis-[200px]">
                              <div
                                data-preserve-light="true"
                                className="w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center shrink-0 p-1"
                              >
                                <PerfilSectionSvg
                                  perfilId={row.perfilId}
                                  orientacion={row.orientacion}
                                  size={36}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  <span className="mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold break-all">
                                    {row.codigo}
                                  </span>
                                  <span className="text-[10.5px] font-bold text-slate-500">
                                    Corte {row.angulo}
                                  </span>
                                </div>
                                <strong
                                  className={`block text-[13.5px] font-extrabold leading-tight mt-0.5 break-words ${
                                    isComplete ? 'line-through text-emerald-800' : 'text-slate-900'
                                  }`}
                                >
                                  {row.nombre}
                                </strong>
                                <span className="block text-[11px] text-slate-500 mono break-words">
                                  {row.formulaTexto}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 ml-auto shrink-0 max-w-full flex-wrap">
                              <div className="text-right">
                                <strong className="mono text-[15px] text-blue-700 block leading-tight whitespace-nowrap">
                                  {row.medidaCm.toFixed(1)} cm
                                </strong>
                                <span className="mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {row.medidaM.toFixed(2)} m · ×{row.cantidad}
                                </span>
                              </div>

                              {/* Contador interactivo 0/N */}
                              <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-xl p-1">
                                <button
                                  type="button"
                                  aria-label={`Restar pieza cortada de ${row.nombre}`}
                                  onClick={() => handleStepCutCount(row.id, row.cantidad, -1)}
                                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-800 font-extrabold text-[15px] cursor-pointer hover:bg-slate-50 active:scale-95"
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCompleteRow(row.id, row.cantidad)}
                                  title="Tocar para marcar o desmarcar todas"
                                  className={`min-w-[46px] h-8 px-2 rounded-lg mono text-[12px] font-extrabold cursor-pointer transition-colors ${
                                    isComplete
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white text-slate-900 border border-slate-200'
                                  }`}
                                >
                                  {cutDone}/{row.cantidad}
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Sumar pieza cortada de ${row.nombre}`}
                                  onClick={() => handleStepCutCount(row.id, row.cantidad, 1)}
                                  className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-[15px] cursor-pointer hover:bg-blue-700 active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Medidas estimadas de vidrio calculadas */}
              {calculoCortes.vidrios.length > 0 && (
                <div className="p-3.5 rounded-2xl border border-sky-300 bg-sky-50/70 flex flex-wrap items-center justify-between gap-2.5">
                  <div>
                    <div className="text-[12px] font-extrabold text-sky-900 uppercase tracking-wide">
                      Cristal calculado para esta modulación
                    </div>
                    {calculoCortes.vidrios.map((v, i) => (
                      <div key={i} className="text-[13px] font-bold text-slate-800 mt-0.5 mono">
                        • {v.pzas} pza(s) de {v.anchoCm} × {v.altoCm} cm ({v.areaM2.toFixed(2)} m²)
                      </div>
                    ))}
                  </div>
                  {onSendVidriosToOptimizer && (
                    <button
                      type="button"
                      id="btn-mod-optimize-vidrio"
                      onClick={() => onSendVidriosToOptimizer(calculoCortes.vidrios)}
                      className="min-h-[42px] px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[12.5px] font-extrabold cursor-pointer shrink-0 active:scale-95"
                    >
                      ✂️ Optimizar Vidrio en 2D
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-PESTAÑA B: OPTIMIZADOR DE TRAMOS (6.10 m) Y SOBRANTES */}
          {paso5Tab === 'tramos' && (
            <div className="flex flex-col gap-4">
              {/* Parámetros configurables del Optimizador 1D */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong className="block text-[12.5px] font-extrabold text-slate-900">
                    Ajustes de corte 1D (Tramos 6.10 m)
                  </strong>
                  <span className="text-[11px] text-slate-600">
                    El grosor del disco se descuenta en cada corte; los retazos menores al umbral pasan a Merma / Chatarra
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700">
                    <span>Disco (mm):</span>
                    <input
                      id="inp-mod-kerf-mm"
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={discoKerfMm}
                      onChange={(e) => setDiscoKerfMm(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                      className="w-[70px] min-h-[34px] rounded-lg border border-slate-300 bg-white px-2 mono text-[12.5px] font-extrabold text-center"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-700">
                    <span>Umbral útil (cm):</span>
                    <input
                      id="inp-mod-umbral-cm"
                      type="number"
                      min={10}
                      max={200}
                      step={5}
                      value={umbralSobranteCm}
                      onChange={(e) =>
                        setUmbralSobranteCm(Math.max(10, Math.min(200, Math.round(Number(e.target.value) || 45))))
                      }
                      className="w-[74px] min-h-[34px] rounded-lg border border-slate-300 bg-white px-2 mono text-[12.5px] font-extrabold text-center"
                    />
                  </label>
                </div>
              </div>

              {/* KPIs de optimización 1D */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                  <span className="block text-[11px] font-bold text-blue-700 uppercase">
                    Tramos 6.10 m nuevos
                  </span>
                  <strong className="mono text-[20px] font-extrabold text-blue-950">
                    {optimizacion1D.tramos610Totales}
                  </strong>
                </div>
                <div className="p-3 rounded-xl border border-amber-300 bg-amber-50">
                  <span className="block text-[11px] font-bold text-amber-800 uppercase">
                    Sobrantes taller usados
                  </span>
                  <strong className="mono text-[20px] font-extrabold text-amber-950">
                    {optimizacion1D.sobrantesInventarioUsados}
                  </strong>
                </div>
                <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50">
                  <span className="block text-[11px] font-bold text-emerald-800 uppercase">
                    Aprovechamiento
                  </span>
                  <strong className="mono text-[20px] font-extrabold text-emerald-950">
                    {optimizacion1D.aprovechamientoGlobalPct}%
                  </strong>
                </div>
                <div className="p-3 rounded-xl border border-rose-300 bg-rose-50">
                  <span className="block text-[11px] font-bold text-rose-800 uppercase">
                    Merma / Chatarra (&lt; {umbralSobranteCm} cm)
                  </span>
                  <strong className="mono text-[20px] font-extrabold text-rose-950">
                    {(optimizacion1D.mermaTotalCm / 100).toFixed(2)} m
                  </strong>
                  <span className="block text-[10.5px] text-slate-600 mono">
                    Sobr. total: {(optimizacion1D.sobranteTotalCm / 100).toFixed(2)} m
                  </span>
                </div>
              </div>

              {/* Despiece visual barra por barra agrupado por perfil */}
              <div className="flex flex-col gap-3">
                {optimizacion1D.grupos.map((grupo) => (
                  <div
                    key={grupo.perfilId}
                    className="rounded-2xl border-[1.5px] border-slate-300 bg-slate-50/70 p-3.5 min-w-0 overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          data-preserve-light="true"
                          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0"
                        >
                          <PerfilSectionSvg perfilId={grupo.perfilId} size={32} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="mono text-[10.5px] font-extrabold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                              {grupo.codigo}
                            </span>
                            <strong className="text-[14px] font-extrabold text-slate-900 break-words">
                              {grupo.perfilNombre}
                            </strong>
                          </div>
                          <span className="block text-[11.5px] text-slate-600 mono break-words">
                            Cortes: {grupo.metrosCortes.toFixed(2)} m · Aprovechamiento: {grupo.aprovechamientoPct}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        {grupo.sobrantesUsados > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-extrabold mono">
                            {grupo.sobrantesUsados} sob.
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 border border-blue-300 text-blue-900 text-[11px] font-extrabold mono">
                          {grupo.tramos610Requeridos} tramo(s) 6.10m
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {grupo.barras.map((barra) => (
                        <div
                          key={barra.id}
                          className="p-2.5 rounded-xl bg-white border border-slate-300"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11.5px] font-bold mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  barra.origen === 'sobrante-inventario'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-[#0B2545] text-white'
                                }`}
                              >
                                {barra.origen === 'sobrante-inventario' ? 'Sobrante Inventario' : 'Tramo 6.10 m'}
                              </span>
                              <span className="text-slate-800">{barra.etiquetaOrigen}</span>
                              {barra.marca && (
                                <span className="text-slate-500">({barra.marca})</span>
                              )}
                            </div>
                            <span className="mono text-slate-700">
                              Usado: {barra.usadoCm.toFixed(1)} cm ·{' '}
                              {barra.esMerma ? (
                                <strong className="text-rose-700">
                                  Merma: {barra.sobranteCm.toFixed(1)} cm
                                </strong>
                              ) : (
                                <strong className="text-amber-700">
                                  Sobrante útil: {barra.sobranteCm.toFixed(1)} cm ({(barra.sobranteCm / 100).toFixed(2)} m)
                                </strong>
                              )}
                            </span>
                          </div>

                          {/* Barra gráfica proporcional de cortes */}
                          <div className="w-full h-8 rounded-lg border border-slate-300 bg-slate-100 overflow-hidden flex">
                            {barra.cortes.map((c, cIdx) => {
                              const pct = Math.max(
                                4,
                                (c.medidaCm / Math.max(1, barra.largoTotalCm)) * 100
                              );
                              return (
                                <div
                                  key={`${barra.id}-${cIdx}`}
                                  title={`${c.nombre}: ${c.medidaCm.toFixed(1)} cm`}
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: BAR_SEGMENT_COLORS[cIdx % BAR_SEGMENT_COLORS.length],
                                  }}
                                  className="h-full border-r border-white/80 flex items-center justify-center text-white text-[10px] font-extrabold mono px-1 truncate"
                                >
                                  {c.medidaCm.toFixed(1)}
                                </div>
                              );
                            })}
                            {barra.sobranteCm > 0 && (
                              <div
                                title={`${barra.esMerma ? 'Merma / Chatarra' : 'Sobrante útil'}: ${barra.sobranteCm.toFixed(1)} cm`}
                                style={{
                                  width: `${Math.max(
                                    2,
                                    (barra.sobranteCm / Math.max(1, barra.largoTotalCm)) * 100
                                  )}%`,
                                }}
                                className={`h-full flex items-center justify-center text-[10px] font-extrabold mono px-1 truncate border-l border-dashed ${
                                  barra.esMerma
                                    ? 'bg-rose-100 text-rose-900 border-rose-400'
                                    : 'bg-amber-100 text-amber-900 border-amber-400'
                                }`}
                              >
                                {barra.sobranteCm >= 12
                                  ? `${barra.esMerma ? 'Merma ' : ''}${barra.sobranteCm.toFixed(0)}cm`
                                  : ''}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {barra.cortes.map((c, cIdx) => (
                              <span
                                key={`${barra.id}-lbl-${cIdx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10.5px] font-bold text-slate-800"
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      BAR_SEGMENT_COLORS[cIdx % BAR_SEGMENT_COLORS.length],
                                  }}
                                />
                                {c.nombre}: <strong className="mono">{c.medidaCm.toFixed(1)} cm</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Guardar sobrantes generados hacia Inventario de Taller */}
              {optimizacion1D.sobrantesGeneradosGuardables.length > 0 && (
                <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50 flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <strong className="block text-[13.5px] text-amber-950 font-extrabold">
                        Sobrantes reutilizables generados (≥ {umbralSobranteCm} cm)
                      </strong>
                      <span className="text-[11.5px] text-amber-900">
                        Guarda estos retazos útiles en tu Inventario de Taller (los menores a {umbralSobranteCm} cm ya se separaron como Merma / Chatarra)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {optimizacion1D.sobrantesGeneradosGuardables.map((s, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-950 text-[11.5px] font-bold mono"
                      >
                        {s.cantidad}× {s.perfilNombre} de {s.largoCm.toFixed(0)} cm ({s.largoM.toFixed(2)} m)
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <select
                      aria-label="Marca para guardar sobrantes"
                      value={marcaParaSobrantes}
                      onChange={(e) => setMarcaParaSobrantes(e.target.value)}
                      className="min-h-[38px] rounded-xl border border-amber-300 bg-white px-2.5 text-[12px] font-bold"
                    >
                      <option value="Alumer">Marca: Alumer</option>
                      <option value="Cuprum">Marca: Cuprum</option>
                      <option value="Indalum">Marca: Indalum</option>
                      <option value="Extrusiones Metálicas">Marca: Extrusiones Metálicas</option>
                      <option value="Perfiles LM">Marca: Perfiles LM</option>
                    </select>
                    <select
                      aria-label="Color para guardar sobrantes"
                      value={colorParaSobrantes}
                      onChange={(e) => setColorParaSobrantes(e.target.value as ColorId)}
                      className="min-h-[38px] rounded-xl border border-amber-300 bg-white px-2.5 text-[12px] font-bold"
                    >
                      {Object.values(COLORES_CONFIG).map((c) => (
                        <option key={c.id} value={c.id}>
                          Acabado: {c.corto}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      id="btn-mod-save-sobrantes"
                      onClick={handleGuardarSobrantesGenerados}
                      className="min-h-[40px] px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12.5px] font-extrabold cursor-pointer active:scale-95"
                    >
                      💾 Guardar sobrantes en Inventario
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumen de material y envío a Hoja de Cotización */}
          <div className="p-4 rounded-2xl border-[1.5px] border-emerald-300 bg-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-extrabold uppercase tracking-wide text-emerald-800">
                Resumen de aluminio calculado
              </div>
              <div className="text-[15px] font-extrabold text-emerald-950 mt-0.5">
                Total lineal: <span className="mono">{calculoCortes.totalAluminioM.toFixed(2)} m</span> · Tramos optimizados:{' '}
                <span className="mono">{optimizacion1D.tramos610Totales} de 6.10 m</span>
                {optimizacion1D.sobrantesInventarioUsados > 0
                  ? ` + ${optimizacion1D.sobrantesInventarioUsados} sobrante(s)`
                  : ''}
              </div>
            </div>
            <button
              type="button"
              id="btn-mod-send-hoja"
              onClick={handleSendToHoja}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-md shrink-0 transition-transform active:scale-95"
            >
              📋 Mandar tramos a Hoja de Cotización
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[13px] cursor-pointer"
            >
              ← Ver perfiles
            </button>
            <button
              type="button"
              onClick={() => {
                setCortadosMap({});
                setStep(1);
              }}
              className="min-h-[44px] px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold text-[13px] cursor-pointer"
            >
              Nueva modulación
            </button>
          </div>
        </div>
      )}

      {/* ==================== PASO 2 MODAL: ¿TENDRÁ MOSQUITERO? ==================== */}
      {mosquiteroModalOpen && (
        <div
          id="modal-mosquitero-paso2"
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="¿Tu modulación tendrá mosquitero?"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMosquiteroModalOpen(false);
          }}
        >
          <div className="w-full max-w-[440px] bg-white text-slate-900 border-[1.5px] border-slate-300 rounded-[24px] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold mb-1.5">
                  Paso 2 de 5 · {selectedModelo.categoria === 'puertas' ? 'Puerta' : 'Ventana'} {selectedModelo.nombre}
                </span>
                <h2 className="m-0 text-[19px] font-extrabold text-slate-900">
                  ¿Tu modulación tendrá mosquitero?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMosquiteroModalOpen(false)}
                aria-label="Cerrar pregunta de mosquitero"
                className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <p className="m-0 text-[12.5px] text-slate-600 mb-4">
              Si eliges <strong>Con mosquitero</strong>, agregaremos automáticamente el Marco y Riel de mosquitero a tu despiece y cortes.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                id="btn-mod-con-mosquitero"
                onClick={() => handleChooseMosquitero(true)}
                className="min-h-[76px] p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-left cursor-pointer flex items-center gap-3.5 transition-transform active:scale-95 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-[16px] font-extrabold">Con mosquitero</strong>
                  <span className="block text-[12px] text-emerald-800">
                    Incluye marco, riel y medidas de corte para malla
                  </span>
                </div>
              </button>

              <button
                type="button"
                id="btn-mod-sin-mosquitero"
                onClick={() => handleChooseMosquitero(false)}
                className="min-h-[76px] p-4 rounded-2xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 text-left cursor-pointer flex items-center gap-3.5 transition-transform active:scale-95 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-[16px] font-extrabold">Sin mosquitero</strong>
                  <span className="block text-[12px] text-slate-600">
                    Solo perfiles de marco y hojas principales
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
