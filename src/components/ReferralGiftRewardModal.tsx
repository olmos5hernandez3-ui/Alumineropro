import React from 'react';
import { Crown, Gift, Sparkles, X } from 'lucide-react';

export interface ReferralGiftRewardModalProps {
  open: boolean;
  onViewPlans: () => void;
  onUseFreeDaysNow: () => void;
}

const CONFETTI_PIECES = [
  { left: '8%', delay: '0s', duration: '2.6s', color: '#FBBF24' },
  { left: '16%', delay: '0.3s', duration: '2.2s', color: '#34D399' },
  { left: '25%', delay: '0.15s', duration: '2.8s', color: '#FDE047' },
  { left: '34%', delay: '0.5s', duration: '2.4s', color: '#38BDF8' },
  { left: '44%', delay: '0.1s', duration: '2.7s', color: '#F59E0B' },
  { left: '53%', delay: '0.4s', duration: '2.3s', color: '#A7F3D0' },
  { left: '62%', delay: '0.2s', duration: '2.5s', color: '#FBBF24' },
  { left: '72%', delay: '0.6s', duration: '2.9s', color: '#FDE68A' },
  { left: '82%', delay: '0.25s', duration: '2.2s', color: '#34D399' },
  { left: '91%', delay: '0.45s', duration: '2.6s', color: '#F59E0B' },
];

export const ReferralGiftRewardModal: React.FC<ReferralGiftRewardModalProps> = ({
  open,
  onViewPlans,
  onUseFreeDaysNow,
}) => {
  if (!open) return null;

  return (
    <div
      id="modal-referral-gift-reward"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-gift-reward-title"
      className="fixed inset-0 z-[9996] bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onUseFreeDaysNow();
      }}
    >
      <style>{`
        @keyframes ap-confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(340px) rotate(360deg); opacity: 0; }
        }
        @keyframes ap-sparkle-pop {
          0%, 100% { transform: scale(0.85) rotate(0deg); opacity: 0.7; }
          50% { transform: scale(1.18) rotate(12deg); opacity: 1; }
        }
      `}</style>

      <div className="relative w-full max-w-[460px] rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-[#172136] via-[#0F172A] to-[#0B1120] text-white shadow-[0_0_50px_rgba(251,191,36,0.35)] overflow-hidden">
        {/* Confeti y destellos dorados festivos */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {CONFETTI_PIECES.map((p, idx) => (
            <span
              key={idx}
              style={{
                position: 'absolute',
                top: '-10px',
                left: p.left,
                width: idx % 2 === 0 ? '9px' : '7px',
                height: idx % 2 === 0 ? '14px' : '10px',
                borderRadius: '3px',
                backgroundColor: p.color,
                animation: `ap-confetti-fall ${p.duration} linear ${p.delay} infinite`,
              }}
            />
          ))}
        </div>

        {/* Botón cerrar */}
        <button
          type="button"
          id="btn-close-referral-gift-modal"
          onClick={onUseFreeDaysNow}
          aria-label="Cerrar ventana de regalo"
          className="absolute top-3.5 right-3.5 z-20 min-w-[36px] min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="relative z-10 p-6 text-center">
          {/* Icono regalo dorado con destellos */}
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-[0_0_32px_rgba(251,191,36,0.65)] ring-4 ring-amber-300/30">
            <Gift className="w-10 h-10" aria-hidden="true" />
            <Sparkles
              className="w-6 h-6 text-amber-200 absolute -top-3 -right-3"
              style={{ animation: 'ap-sparkle-pop 1.6s ease-in-out infinite' }}
              aria-hidden="true"
            />
            <Sparkles
              className="w-5 h-5 text-emerald-300 absolute -bottom-2 -left-3"
              style={{ animation: 'ap-sparkle-pop 1.9s ease-in-out 0.3s infinite' }}
              aria-hidden="true"
            />
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-[11px] font-black uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>3 Días PRO Activados</span>
          </div>

          <h2
            id="referral-gift-reward-title"
            className="m-0 mt-3 text-[20px] sm:text-[22px] font-black text-amber-200 leading-snug"
          >
            🎉 ¡Felicidades! Acabas de obtener 3 días gratis para usar la Versión PRO.
          </h2>

          <p className="m-0 mt-3 text-[13.5px] text-slate-200 leading-relaxed font-semibold bg-slate-900/70 border border-amber-400/30 rounded-xl p-3.5 text-left">
            ¿Quieres seguir obteniendo recompensas? Adquiere por lo menos el Plan de 30 Días PRO y
            gana <strong className="text-amber-300">+5 días</strong>,{' '}
            <strong className="text-amber-300">+15 días</strong> o hasta{' '}
            <strong className="text-emerald-300">1 MES completamente gratis</strong> por cada
            colega que compre (acumulable hasta 1 año gratis).
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              id="btn-gift-reward-view-plans"
              onClick={onViewPlans}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-105 text-slate-950 font-black text-[14px] cursor-pointer shadow-[0_8px_24px_rgba(251,191,36,0.35)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <Crown className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Ver planes y desbloquear recompensas</span>
            </button>

            <button
              type="button"
              id="btn-gift-reward-use-now"
              onClick={onUseFreeDaysNow}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-extrabold text-[13px] cursor-pointer transition-colors"
            >
              Usar mis 3 días gratis ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
