import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Grid2x2,
  Layers,
  Package,
  Ruler,
  Scissors,
  Sparkles,
  X,
} from 'lucide-react';
import { GUIDED_TUTORIAL_STEPS, GuidedTutorialStep } from '../utils/alumineroLogic';

interface InteractiveTutorialModalProps {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
  onOpenVidrioOptimizer?: () => void;
  initialTrack?: 'inicio' | 'optimizacion';
}

interface CuttingTutorialStep {
  step: number;
  badge: string;
  title: string;
  description: string;
  tip: string;
  highlight2D?: boolean;
  icon: 'barras' | 'kerf' | 'barra_por_barra' | 'vidrio2d';
}

const CUTTING_OPTIMIZATION_STEPS: CuttingTutorialStep[] = [
  {
    step: 1,
    badge: 'Optimización 1/4 · Tramos 6.10 m',
    title: 'Aprovecha cada tramo de 6.10 m sin merma',
    description:
      'En lugar de cortar medidas al azar, ingresa todas las piezas de tu obra en la Hoja de Cotización o en Modulación y Cortes. El motor agrupa perfiles iguales por línea y color para acomodar cortes largos con cortes cortos en una sola barra.',
    tip: 'Ahorro típico: entre 15% y 28% menos desperdicio de aluminio por obra.',
    icon: 'barras',
  },
  {
    step: 2,
    badge: 'Optimización 2/4 · Disco y Despunte',
    title: 'Considera el grosor del disco (kerf) y el despunte',
    description:
      'Configura el ancho de corte de tu sierra (ej. 3 a 4 mm) y el despunte de extremos de fábrica (ej. 5 cm). Así el plan de corte garantiza que el último corte del tramo siempre quepa con exactitud milimétrica.',
    tip: 'Cada barra muestra exactamente cuántos cortes caben, el largo usado y el sobrante en cm.',
    icon: 'kerf',
  },
  {
    step: 3,
    badge: 'Optimización 3/4 · Barra por Barra',
    title: 'Revisa el plan Barra por Barra y tu Inventario',
    description:
      'En "Despiece Total de Material" cruza los tramos requeridos contra las existencias de "Mi Inventario" para comprar solo lo faltante. Luego sigue la lista "Optimizar Barra por Barra" (Tramo #1, #2...) al pie de la sierra.',
    tip: 'Puedes descontar perfiles directamente de tu inventario al aprobar la obra.',
    icon: 'barra_por_barra',
  },
  {
    step: 4,
    badge: 'Optimización 4/4 · Optimizador 2D',
    title: 'Domina el Optimizador de Vidrio 2D',
    description:
      'Para vidrios, espejos y acrílicos, el Optimizador 2D acomoda automáticamente tus piezas en hojas estándar (244×122, 260×180 o 330×214 cm) o en tu stock real, mostrando un plano visual interactivo con el porcentaje de aprovechamiento.',
    tip: 'Antes de calcular verás el resumen total de piezas y m² totales a optimizar.',
    highlight2D: true,
    icon: 'vidrio2d',
  },
];

const StepArtwork: React.FC<{ icon: GuidedTutorialStep['icon'] | CuttingTutorialStep['icon'] }> = ({
  icon,
}) => {
  switch (icon) {
    case 'levantamiento':
      return (
        <div className="w-16 h-16 rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-[#0B1924] flex items-center justify-center shadow-lg">
          <Ruler className="w-8 h-8 text-amber-300" aria-hidden="true" />
        </div>
      );
    case 'modulacion':
    case 'kerf':
      return (
        <div className="w-16 h-16 rounded-2xl border border-sky-400/50 bg-gradient-to-br from-sky-500/25 via-blue-500/20 to-[#0B1924] flex items-center justify-center shadow-lg">
          <Scissors className="w-8 h-8 text-sky-300" aria-hidden="true" />
        </div>
      );
    case 'inventario':
    case 'barras':
      return (
        <div className="w-16 h-16 rounded-2xl border border-emerald-400/50 bg-gradient-to-br from-emerald-500/25 via-teal-500/20 to-[#0B1924] flex items-center justify-center shadow-lg">
          <Package className="w-8 h-8 text-emerald-300" aria-hidden="true" />
        </div>
      );
    case 'barra_por_barra':
      return (
        <div className="w-16 h-16 rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-500/25 via-emerald-500/20 to-[#0B1924] flex items-center justify-center shadow-lg">
          <Layers className="w-8 h-8 text-amber-300" aria-hidden="true" />
        </div>
      );
    case 'vidrio2d':
      return (
        <div className="w-16 h-16 rounded-2xl border border-cyan-400/70 bg-gradient-to-br from-cyan-500/35 via-sky-500/25 to-[#0B1924] flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <Grid2x2 className="w-8 h-8 text-cyan-200" aria-hidden="true" />
        </div>
      );
    case 'pdf':
      return (
        <div className="w-16 h-16 rounded-2xl border border-indigo-400/50 bg-gradient-to-br from-indigo-500/25 via-sky-500/20 to-[#0B1924] flex items-center justify-center shadow-lg">
          <FileText className="w-8 h-8 text-indigo-300" aria-hidden="true" />
        </div>
      );
  }
};

export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  open,
  onClose,
  onFinish,
  onOpenVidrioOptimizer,
  initialTrack = 'inicio',
}) => {
  const [activeTrack, setActiveTrack] = useState<'inicio' | 'optimizacion'>(initialTrack);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setActiveTrack(initialTrack);
      setStepIdx(0);
    }
  }, [open, initialTrack]);

  if (!open) return null;

  const isCuttingTrack = activeTrack === 'optimizacion';
  const steps = isCuttingTrack ? CUTTING_OPTIMIZATION_STEPS : GUIDED_TUTORIAL_STEPS;
  const total = steps.length;
  const current = steps[stepIdx] || steps[0];
  const cuttingExtra = isCuttingTrack ? (current as CuttingTutorialStep) : null;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === total - 1;

  const handleSwitchTrack = (track: 'inicio' | 'optimizacion') => {
    setActiveTrack(track);
    setStepIdx(0);
  };

  const handleComplete = () => {
    onFinish?.();
    onClose();
  };

  return (
    <div
      id="modal-interactive-tutorial"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-tutorial-title"
      className="fixed inset-0 z-50 bg-[#040C12]/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[490px] rounded-[24px] border border-[#4A6072]/85 bg-gradient-to-b from-[#112433] via-[#0B1924] to-[#07131B] text-white shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden relative">
        {/* Barra superior de progreso */}
        <div className="h-1.5 w-full bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300 transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / total) * 100}%` }}
          />
        </div>

        {/* Selector de pista de tutorial */}
        <div className="px-5 pt-4 pb-1">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950/75 border border-white/10">
            <button
              type="button"
              id="btn-tutorial-track-inicio"
              onClick={() => handleSwitchTrack('inicio')}
              className={`min-h-[36px] px-2.5 rounded-lg text-[11.5px] font-extrabold transition-all cursor-pointer border-0 ${
                !isCuttingTrack
                  ? 'bg-sky-500 text-white shadow'
                  : 'bg-transparent text-slate-300 hover:text-white'
              }`}
            >
              Inicio Rápido (4 pasos)
            </button>
            <button
              type="button"
              id="btn-tutorial-track-optimizacion"
              onClick={() => handleSwitchTrack('optimizacion')}
              className={`min-h-[36px] px-2.5 rounded-lg text-[11.5px] font-extrabold transition-all cursor-pointer border-0 ${
                isCuttingTrack
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'bg-transparent text-cyan-200 hover:text-white'
              }`}
            >
              Optimizar Cortes y 2D
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="px-5 pt-2.5 pb-1 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-200 text-[11px] font-extrabold">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            {current.badge}
          </span>
          <button
            type="button"
            id="btn-tutorial-skip"
            onClick={handleComplete}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 text-[12px] font-bold text-[#B0C4D4] hover:text-white cursor-pointer"
          >
            <span>Saltar</span>
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Contenido de la tarjeta del paso */}
        <div
          key={`${activeTrack}-${current.step}`}
          data-tutorial-step={current.step}
          data-tutorial-track={activeTrack}
          className="px-6 py-4 flex flex-col items-center text-center"
        >
          <div className="mb-3.5">
            <StepArtwork icon={current.icon} />
          </div>

          <h2
            id="guided-tutorial-title"
            className="m-0 text-[19px] sm:text-[21px] font-extrabold text-white tracking-tight leading-snug"
          >
            {current.title}
          </h2>

          <p className="m-0 mt-2.5 text-[13.5px] sm:text-[14px] text-[#C8D8E6] leading-relaxed">
            {current.description}
          </p>

          {/* Tarjeta visual de ahorro / demo interactiva en pista de Optimización */}
          {cuttingExtra && (
            <div
              className={`w-full mt-3.5 p-3 rounded-xl border text-left ${
                cuttingExtra.highlight2D
                  ? 'border-cyan-400/60 bg-cyan-500/12'
                  : 'border-emerald-400/40 bg-emerald-500/10'
              }`}
            >
              {cuttingExtra.icon === 'barras' && (
                <div className="mb-2">
                  <div className="flex justify-between text-[10.5px] font-bold text-emerald-200 mb-1 mono">
                    <span>Tramo 6.10 m · 4 cortes</span>
                    <span>94% usado · 36 cm sobrante</span>
                  </div>
                  <div className="w-full h-3.5 rounded-md bg-slate-900 overflow-hidden flex gap-0.5 p-0.5">
                    <div className="h-full bg-sky-400 rounded-sm" style={{ width: '32%' }} />
                    <div className="h-full bg-emerald-400 rounded-sm" style={{ width: '28%' }} />
                    <div className="h-full bg-cyan-400 rounded-sm" style={{ width: '20%' }} />
                    <div className="h-full bg-amber-400 rounded-sm" style={{ width: '14%' }} />
                  </div>
                </div>
              )}

              {cuttingExtra.highlight2D && (
                <div className="mb-2.5 rounded-lg border border-cyan-300/40 bg-slate-950/65 p-2">
                  <div className="flex items-center justify-between text-[10.5px] font-extrabold text-cyan-200 mb-1.5">
                    <span>✨ Plano Visual Optimizador 2D</span>
                    <span className="mono">Hoja 260 × 180 cm</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 h-12">
                    <div className="col-span-2 rounded bg-cyan-500/35 border border-cyan-300/70 flex items-center justify-center text-[10px] font-bold text-white mono">
                      120×110
                    </div>
                    <div className="rounded bg-emerald-500/35 border border-emerald-300/70 flex items-center justify-center text-[10px] font-bold text-white mono">
                      80×110
                    </div>
                  </div>
                </div>
              )}

              <p className="m-0 text-[12px] font-semibold text-slate-100 leading-snug">
                💡 {cuttingExtra.tip}
              </p>

              {cuttingExtra.highlight2D && onOpenVidrioOptimizer && (
                <button
                  type="button"
                  id="btn-tutorial-open-vidrio-2d"
                  onClick={() => {
                    onFinish?.();
                    onOpenVidrioOptimizer();
                  }}
                  className="mt-2.5 w-full min-h-[38px] px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[12.5px] font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer border-0"
                >
                  <Grid2x2 className="w-4 h-4" aria-hidden="true" />
                  <span>Abrir Optimizador de Vidrio 2D ahora</span>
                </button>
              )}
            </div>
          )}

          {/* Indicadores interactivos de los 4 pasos */}
          <div
            className="mt-5 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Pasos del tutorial"
          >
            {steps.map((s, idx) => (
              <button
                key={s.step}
                type="button"
                role="tab"
                aria-selected={idx === stepIdx}
                aria-label={`Ir al paso ${s.step}: ${s.title}`}
                onClick={() => setStepIdx(idx)}
                className={`h-2.5 rounded-full transition-all cursor-pointer border-0 p-0 ${
                  idx === stepIdx
                    ? 'w-8 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]'
                    : idx < stepIdx
                      ? 'w-2.5 bg-sky-400/75'
                      : 'w-2.5 bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer de navegación */}
        <div className="px-5 py-4 border-t border-[#4A6072]/45 bg-[#07131B]/85 flex items-center justify-between gap-2.5">
          <button
            type="button"
            id="btn-tutorial-prev"
            disabled={isFirst}
            onClick={() => setStepIdx((prev) => Math.max(0, prev - 1))}
            className="min-h-[44px] px-4 rounded-xl border border-[#4A6072]/70 bg-white/5 hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed text-white text-[13px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Anterior</span>
          </button>

          {!isLast ? (
            <button
              type="button"
              id="btn-tutorial-next"
              onClick={() => setStepIdx((prev) => Math.min(total - 1, prev + 1))}
              className="metal-emerald-pill min-h-[44px] px-5 rounded-xl text-[13.5px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              id="btn-tutorial-finish"
              onClick={handleComplete}
              className="metal-emerald-pill min-h-[44px] px-5 rounded-xl text-[13.5px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Comenzar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
