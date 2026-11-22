import React, { useMemo, useState } from 'react';
import { Crown, Gift, Sparkles, X } from 'lucide-react';

interface AnnualCelebrationOverlayProps {
  open: boolean;
  onClose: () => void;
  onApplyIndustrialSkin: () => void;
}

interface ConfettiPiece {
  id: number;
  leftPct: number;
  delaySec: number;
  durationSec: number;
  sizePx: number;
  color: string;
  shape: 'rect' | 'circle' | 'star';
  driftPx: number;
}

const CONFETTI_COLORS = [
  '#FBBF24', // gold
  '#F59E0B', // amber
  '#34D399', // emerald
  '#38BDF8', // sky
  '#F97316', // orange
  '#E879F9', // fuchsia
  '#FDE68A', // light gold
  '#FFFFFF',
];

export const AnnualCelebrationOverlay: React.FC<AnnualCelebrationOverlayProps> = ({
  open,
  onClose,
  onApplyIndustrialSkin,
}) => {
  const [giftOpened, setGiftOpened] = useState(false);

  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 48; i += 1) {
      const seed = (i * 73 + 19) % 100;
      pieces.push({
        id: i,
        leftPct: (i * 2.1 + (seed % 7)) % 98 + 1,
        delaySec: Number(((i % 12) * 0.14).toFixed(2)),
        durationSec: Number((2.6 + (i % 5) * 0.45).toFixed(2)),
        sizePx: 7 + (i % 4) * 3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        shape: i % 5 === 0 ? 'star' : i % 3 === 0 ? 'circle' : 'rect',
        driftPx: ((i % 2 === 0 ? 1 : -1) * (24 + (seed % 46))),
      });
    }
    return pieces;
  }, []);

  if (!open) return null;

  const handleClose = () => {
    setGiftOpened(false);
    onClose();
  };

  const handleApplySkin = () => {
    setGiftOpened(false);
    onApplyIndustrialSkin();
    onClose();
  };

  return (
    <div
      id="annual-celebration-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Celebración Membresía 1 Año PRO"
      className="fixed inset-0 z-[10120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden"
    >
      {/* Capa de confeti y destellos en toda la pantalla */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        {confettiPieces.map((p) => (
          <span
            key={p.id}
            className="annual-confetti-piece"
            style={{
              left: `${p.leftPct}%`,
              width: `${p.sizePx}px`,
              height: p.shape === 'rect' ? `${Math.round(p.sizePx * 1.6)}px` : `${p.sizePx}px`,
              backgroundColor: p.shape === 'star' ? 'transparent' : p.color,
              borderRadius: p.shape === 'circle' ? '9999px' : '2px',
              animationDelay: `${p.delaySec}s`,
              animationDuration: `${p.durationSec}s`,
              ['--confetti-drift' as string]: `${p.driftPx}px`,
              color: p.color,
            }}
          >
            {p.shape === 'star' ? '✦' : null}
          </span>
        ))}
      </div>

      {/* Estado 1: Regalo flotante interactivo + celebración */}
      {!giftOpened ? (
        <div className="relative z-10 w-full max-w-[390px] rounded-[28px] border-2 border-amber-400/70 bg-gradient-to-b from-[#131d31] via-[#0c1424] to-[#080d18] text-white p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_45px_rgba(251,191,36,0.28)]">
          <button
            type="button"
            id="btn-annual-celebration-close"
            onClick={handleClose}
            aria-label="Cerrar celebración"
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer border border-slate-600/60"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Membresía PRO 1 Año Activada</span>
          </div>

          <h2 className="m-0 text-[22px] font-black leading-tight text-white">
            ¡Bienvenido al Plan Anual PRO!
          </h2>
          <p className="m-0 mt-2 text-[13px] text-slate-300 leading-relaxed">
            Tienes acceso total durante 365 días, respaldo en la nube y una{' '}
            <strong className="text-amber-300">sorpresa exclusiva</strong> esperándote.
          </p>

          {/* Paquete de regalo flotante interactivo */}
          <div className="my-6 flex flex-col items-center justify-center">
            <button
              type="button"
              id="btn-annual-gift-box"
              onClick={() => setGiftOpened(true)}
              aria-label="Abrir regalo de nueva carátula gratis"
              className="annual-gift-float relative w-32 h-32 rounded-3xl border-2 border-amber-300/85 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-[0_18px_44px_rgba(245,158,11,0.55)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <span
                aria-hidden="true"
                className="annual-gift-glow absolute inset-0 rounded-3xl pointer-events-none"
              />
              <span className="text-[54px] leading-none drop-shadow-md" aria-hidden="true">
                🎁
              </span>
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-950 bg-amber-200/95 px-2.5 py-0.5 rounded-full shadow-sm">
                Toca para abrir
              </span>
            </button>
          </div>

          <p className="m-0 text-[12px] font-bold text-emerald-300 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Toca el regalo para descubrir tu recompensa anual</span>
          </p>
        </div>
      ) : (
        /* Estado 2: Regalo abierto con mensaje exacto y aplicación inmediata de carátula */
        <div
          id="card-annual-gift-opened"
          className="annual-gift-unbox relative z-10 w-full max-w-[410px] rounded-[28px] border-2 border-emerald-400/75 bg-gradient-to-b from-[#132230] via-[#0d1724] to-[#080d18] text-white p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.88),0_0_50px_rgba(16,185,129,0.28)]"
        >
          <button
            type="button"
            id="btn-annual-gift-close"
            onClick={handleClose}
            aria-label="Cerrar aviso de regalo"
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer border border-slate-600/60"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center shadow-lg border border-amber-300/70 mb-4">
            <Gift className="w-8 h-8 text-slate-950" aria-hidden="true" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Regalo Desbloqueado · Plan 1 Año</span>
          </div>

          <h2
            id="annual-gift-congrats-title"
            className="m-0 text-[22px] font-black leading-snug text-amber-200"
          >
            ¡Felicidades, obtuviste una nueva carátula gratis!
          </h2>

          <p className="m-0 mt-3 text-[13px] text-slate-300 leading-relaxed">
            Ahora tienes desbloqueada la carátula exclusiva{' '}
            <strong className="text-white">Industrial Pro (Acero &amp; Oro)</strong> con textura
            metálica cepillada y animación exclusiva del asistente robot.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              id="btn-annual-apply-skin"
              onClick={handleApplySkin}
              className="w-full min-h-[48px] px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 hover:brightness-105 text-slate-950 font-black text-[14px] cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Crown className="w-4 h-4" aria-hidden="true" />
              <span>Activar Carátula Industrial Pro ahora</span>
            </button>

            <button
              type="button"
              id="btn-annual-later"
              onClick={handleClose}
              className="w-full min-h-[42px] px-4 rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-[12.5px] cursor-pointer"
            >
              Continuar y cambiarla después
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
