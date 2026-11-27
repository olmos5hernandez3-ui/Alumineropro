import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  computeTourPopoverLayout,
  ONBOARDING_TOUR_STEPS,
  TourTargetRect,
} from '../utils/onboardingTour';

interface OnboardingTourProps {
  open: boolean;
  onFinish: () => void;
  onSkip: () => void;
}

const SPOTLIGHT_PADDING = 6;

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  open,
  onFinish,
  onSkip,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TourTargetRect | null>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  }));

  const currentStep = ONBOARDING_TOUR_STEPS[stepIndex] || ONBOARDING_TOUR_STEPS[0];
  const isLastStep = stepIndex >= ONBOARDING_TOUR_STEPS.length - 1;

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  const measureTarget = useCallback(() => {
    if (!open || !currentStep) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewport({ width: vw, height: vh });

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }

    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) {
      setTargetRect(null);
      return;
    }

    setTargetRect({
      top: Math.max(8, r.top - SPOTLIGHT_PADDING),
      left: Math.max(8, r.left - SPOTLIGHT_PADDING),
      width: Math.min(vw - 16, r.width + SPOTLIGHT_PADDING * 2),
      height: r.height + SPOTLIGHT_PADDING * 2,
    });
  }, [open, currentStep]);

  useLayoutEffect(() => {
    if (!open || !currentStep) return;

    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      const outOfView = rect.top < 72 || rect.bottom > window.innerHeight - 96;
      if (outOfView) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          // ignore
        }
      }
    }

    measureTarget();
    const rafId = window.requestAnimationFrame(measureTarget);
    const settleTimer = window.setTimeout(measureTarget, 240);

    const onViewportChange = () => measureTarget();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, currentStep, measureTarget]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLastStep) {
          onFinish();
        } else {
          setStepIndex((prev) => Math.min(ONBOARDING_TOUR_STEPS.length - 1, prev + 1));
        }
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        setStepIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, stepIndex, isLastStep, onFinish, onSkip]);

  if (!open || !currentStep || typeof document === 'undefined') {
    return null;
  }

  const fallbackRect: TourTargetRect = {
    top: Math.max(96, Math.round(viewport.height * 0.28)),
    left: Math.max(16, Math.round((viewport.width - Math.min(540, viewport.width - 32)) / 2)),
    width: Math.min(540, viewport.width - 32),
    height: 92,
  };
  const activeRect = targetRect || fallbackRect;
  const layout = computeTourPopoverLayout(activeRect, viewport, {
    width: 356,
    height: 224,
  });

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isLastStep) {
      onFinish();
    } else {
      setStepIndex((prev) => Math.min(ONBOARDING_TOUR_STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSkipClick = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.stopPropagation();
    onSkip();
  };

  return createPortal(
    <div
      id="onboarding-tour-root"
      data-tour-step={currentStep.id}
      data-tour-index={String(stepIndex)}
      className="fixed inset-0 z-[9950]"
      onClick={handleSkipClick}
    >
      {/* Fondo atenuado + recorte luminoso alrededor de la tarjeta resaltada */}
      {targetRect ? (
        <div
          id="onboarding-tour-spotlight"
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            borderRadius: '20px',
            boxShadow:
              '0 0 0 9999px rgba(4, 10, 18, 0.76), 0 0 0 2.5px rgba(56, 189, 248, 0.95), 0 0 28px rgba(56, 189, 248, 0.35)',
            transition: 'top 220ms ease, left 220ms ease, width 220ms ease, height 220ms ease',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-[#040a12]/75"
        />
      )}

      {/* Tarjeta de paso guiado */}
      <section
        id="onboarding-tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        data-placement={layout.placement}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: `${layout.top}px`,
          left: `${layout.left}px`,
          width: `${layout.width}px`,
          backgroundColor: '#161B22',
          borderColor: 'rgba(56, 189, 248, 0.55)',
          color: '#F1F5F9',
        }}
        className="rounded-2xl border-[1.5px] p-4 shadow-2xl"
      >
        {/* Flecha direccional hacia la tarjeta resaltada */}
        <span
          aria-hidden="true"
          style={{
            left: `${layout.arrowLeft}px`,
            backgroundColor: '#161B22',
            borderColor: 'rgba(56, 189, 248, 0.55)',
          }}
          className={`absolute -translate-x-1/2 w-3 h-3 rotate-45 ${
            layout.placement === 'below'
              ? '-top-[7px] border-l-[1.5px] border-t-[1.5px]'
              : '-bottom-[7px] border-r-[1.5px] border-b-[1.5px]'
          }`}
        />

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/40">
              {currentStep.badge}
            </span>
            <div className="flex items-center gap-1" aria-hidden="true">
              {ONBOARDING_TOUR_STEPS.map((st, idx) => (
                <span
                  key={st.id}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === stepIndex ? 'w-5 bg-sky-400' : 'w-1.5 bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            id="btn-tour-skip"
            onClick={handleSkipClick}
            className="text-[11.5px] font-bold text-slate-400 hover:text-slate-100 px-2 py-1 rounded-lg cursor-pointer transition-colors"
          >
            Omitir
          </button>
        </div>

        <h2
          id="onboarding-tour-title"
          className="m-0 text-[16px] font-extrabold leading-snug text-slate-50"
        >
          {currentStep.title}
        </h2>

        <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-slate-300">
          {currentStep.description}
        </p>

        <p className="m-0 mt-2 text-[11.5px] font-semibold text-sky-300/95">
          💡 {currentStep.tip}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-700/70 flex items-center justify-between gap-2">
          {stepIndex > 0 ? (
            <button
              type="button"
              id="btn-tour-prev"
              onClick={handlePrev}
              style={{
                backgroundColor: '#222936',
                borderColor: '#334155',
                color: '#CBD5E1',
              }}
              className="px-3.5 py-2 rounded-xl border text-[12.5px] font-extrabold cursor-pointer transition-colors hover:brightness-110"
            >
              ← Anterior
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400">
              Guía rápida de inicio
            </span>
          )}

          <button
            type="button"
            id="btn-tour-next"
            onClick={handleNext}
            style={{
              backgroundColor: '#1D4ED8',
              borderColor: '#2563EB',
              color: '#FFFFFF',
            }}
            className="px-4 py-2 rounded-xl border text-[12.5px] font-extrabold cursor-pointer shadow-md transition-transform active:scale-95 hover:brightness-110"
          >
            {isLastStep ? '¡Empezar!' : 'Siguiente →'}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
};
