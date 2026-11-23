import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Package, Ruler, Scissors, Sparkles, X } from 'lucide-react';
import { GUIDED_TUTORIAL_STEPS, GuidedTutorialStep } from '../utils/alumineroLogic';

interface InteractiveTutorialModalProps {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

const StepArtwork: React.FC<{ icon: GuidedTutorialStep['icon'] }> = ({ icon }) => {
  switch (icon) {
    case 'levantamiento':
      return (
        <div className="w-16 h-16 rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-[#0B1924] flex items-center justify-center shadow-lg">
          <Ruler className="w-8 h-8 text-amber-300" aria-hidden="true" />
        </div>
      );
    case 'modulacion':
      return (
        <div className="w-16 h-16 rounded-2xl border border-sky-400/50 bg-gradient-to-br from-sky-500/25 via-blue-500/20 to-[#0B1924] flex items-center justify-center shadow-lg">
          <Scissors className="w-8 h-8 text-sky-300" aria-hidden="true" />
        </div>
      );
    case 'inventario':
      return (
        <div className="w-16 h-16 rounded-2xl border border-emerald-400/50 bg-gradient-to-br from-emerald-500/25 via-teal-500/20 to-[#0B1924] flex items-center justify-center shadow-lg">
          <Package className="w-8 h-8 text-emerald-300" aria-hidden="true" />
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
}) => {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setStepIdx(0);
    }
  }, [open]);

  if (!open) return null;

  const total = GUIDED_TUTORIAL_STEPS.length;
  const current = GUIDED_TUTORIAL_STEPS[stepIdx] || GUIDED_TUTORIAL_STEPS[0];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === total - 1;

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
      <div className="w-full max-w-[460px] rounded-[24px] border border-[#4A6072]/85 bg-gradient-to-b from-[#112433] via-[#0B1924] to-[#07131B] text-white shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden relative">
        {/* Barra superior de progreso */}
        <div className="h-1.5 w-full bg-slate-900">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300 transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / total) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-2">
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
          key={current.step}
          data-tutorial-step={current.step}
          className="px-6 py-5 flex flex-col items-center text-center"
        >
          <div className="mb-4">
            <StepArtwork icon={current.icon} />
          </div>

          <h2
            id="guided-tutorial-title"
            className="m-0 text-[20px] sm:text-[22px] font-extrabold text-white tracking-tight leading-snug"
          >
            {current.title}
          </h2>

          <p className="m-0 mt-3 text-[13.5px] sm:text-[14px] text-[#C8D8E6] leading-relaxed">
            {current.description}
          </p>

          {/* Indicadores interactivos de los 4 pasos */}
          <div
            className="mt-6 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Pasos del tutorial"
          >
            {GUIDED_TUTORIAL_STEPS.map((s, idx) => (
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
