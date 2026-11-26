import React from 'react';
import { Gift, Share2, Sparkles } from 'lucide-react';
import {
  buildReferral3DaysWhatsappUrl,
  REFERRAL_3D_GIFT_TARGET,
} from '../utils/alumineroLogic';

export interface ReferralPromoBannerProps {
  variant: 'home' | 'drawer';
  deviceId: string;
  tallerNombre?: string;
  registeredCount: number;
  isDark?: boolean;
  onOpenGift: () => void;
  onShareFeedback?: () => void;
}

export const ReferralPromoBanner: React.FC<ReferralPromoBannerProps> = ({
  variant,
  deviceId,
  tallerNombre,
  registeredCount,
  isDark = true,
  onOpenGift,
  onShareFeedback,
}) => {
  const clamped = Math.max(0, Math.min(REFERRAL_3D_GIFT_TARGET, registeredCount));
  const pct = Math.round((clamped / REFERRAL_3D_GIFT_TARGET) * 100);
  const giftReady = clamped >= REFERRAL_3D_GIFT_TARGET;
  const whatsappHref = buildReferral3DaysWhatsappUrl(deviceId, tallerNombre);

  const handleShareClick = () => {
    onShareFeedback?.();
  };

  if (variant === 'drawer') {
    return (
      <div
        id="drawer-promo-3dias-referidos"
        className={`w-full shrink-0 rounded-xl border p-3 transition-all ${
          giftReady
            ? 'border-amber-400 bg-gradient-to-br from-amber-500/25 via-yellow-500/15 to-emerald-500/20 shadow-[0_0_20px_rgba(251,191,36,0.28)]'
            : isDark
              ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-600/25 via-teal-700/20 to-slate-900/90'
              : 'border-emerald-400 bg-emerald-50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div
              className={`text-[12.5px] font-black leading-tight flex items-center gap-1.5 ${
                isDark ? 'text-amber-300' : 'text-emerald-950'
              }`}
            >
              <Gift className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
              <span>Obtén 3 días PRO gratis</span>
            </div>
            <p
              className={`m-0 mt-1 text-[11px] font-semibold leading-snug ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Invita a 3 colegas a registrarse en la app y desbloquea 3 días PRO gratis
            </p>
          </div>
          <span
            className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${
              giftReady
                ? 'bg-amber-400 text-slate-950'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {clamped}/{REFERRAL_3D_GIFT_TARGET}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[10.5px] font-extrabold mb-1">
            <span className={isDark ? 'text-emerald-200' : 'text-emerald-900'}>
              {clamped} de {REFERRAL_3D_GIFT_TARGET} invitados registrados
            </span>
            <span className={isDark ? 'text-amber-300' : 'text-amber-700'}>{pct}%</span>
          </div>
          <div
            className={`w-full h-2 rounded-full overflow-hidden ${
              isDark ? 'bg-slate-800' : 'bg-emerald-200'
            }`}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={REFERRAL_3D_GIFT_TARGET}
            aria-label="Progreso de invitados registrados"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                giftReady
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-emerald-400'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-300'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {giftReady ? (
          <button
            type="button"
            id="btn-drawer-open-referral-gift"
            onClick={onOpenGift}
            className="mt-2.5 w-full min-h-[42px] px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-105 text-slate-950 font-black text-[12px] cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(251,191,36,0.55)] animate-pulse"
          >
            <Gift className="w-4 h-4 shrink-0 animate-bounce" aria-hidden="true" />
            <span>Abrir mi regalo de 3 días PRO</span>
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <a
            id="btn-drawer-share-referral-wa"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleShareClick}
            className="mt-2.5 w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-slate-950 font-extrabold text-[11.5px] no-underline flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Compartir invitación por WhatsApp</span>
          </a>
        )}
      </div>
    );
  }

  // Variant: 'home' — Banner llamativo en la pantalla principal
  return (
    <section
      id="banner-home-promo-3dias-referidos"
      aria-label="Obtén 3 días PRO gratis"
      className={`mb-4 w-full rounded-2xl border p-3.5 sm:p-4 text-left transition-all shadow-lg ${
        giftReady
          ? 'border-amber-400/90 bg-gradient-to-r from-amber-950/90 via-yellow-900/55 to-emerald-950/90 shadow-[0_0_28px_rgba(251,191,36,0.3)]'
          : 'border-emerald-400/65 bg-gradient-to-r from-[#0c2720] via-[#0f2433] to-[#132036]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10.5px] font-black uppercase tracking-wide">
              <Gift className="w-3.5 h-3.5" aria-hidden="true" />
              Obtén 3 días PRO gratis
            </span>
            <span className="text-[11px] font-extrabold text-emerald-300">
              {clamped} de {REFERRAL_3D_GIFT_TARGET} invitados registrados
            </span>
          </div>

          <p className="m-0 mt-1.5 text-[13px] sm:text-[13.5px] font-extrabold text-white leading-snug">
            Invita a 3 colegas a registrarse en la app y desbloquea 3 días PRO gratis
          </p>

          {/* Barra de progreso */}
          <div className="mt-2.5 flex items-center gap-2.5">
            <div
              className="flex-1 h-2.5 rounded-full bg-slate-900/90 border border-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={clamped}
              aria-valuemin={0}
              aria-valuemax={REFERRAL_3D_GIFT_TARGET}
              aria-label="Progreso para desbloquear 3 días PRO gratis"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  giftReady
                    ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-emerald-400'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] font-black text-amber-300 mono shrink-0">
              {clamped}/{REFERRAL_3D_GIFT_TARGET}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end">
          {giftReady ? (
            <button
              type="button"
              id="btn-home-open-referral-gift"
              onClick={onOpenGift}
              className="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-105 text-slate-950 font-black text-[13px] cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(251,191,36,0.65)] ring-2 ring-amber-200/80 transition-transform active:scale-95"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-950/15 animate-bounce">
                <Gift className="w-5 h-5 text-slate-950" aria-hidden="true" />
              </span>
              <span className="flex flex-col text-left leading-tight">
                <span>¡Abrir Regalo PRO!</span>
                <span className="text-[10px] font-extrabold opacity-85">
                  3/3 colegas listos
                </span>
              </span>
              <Sparkles className="w-4 h-4 shrink-0 animate-pulse" aria-hidden="true" />
            </button>
          ) : (
            <a
              id="btn-home-share-referral-wa"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleShareClick}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-slate-950 font-black text-[12.5px] no-underline flex items-center justify-center gap-2 shadow-md transition-all whitespace-nowrap"
            >
              <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Compartir invitación por WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
