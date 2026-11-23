import React, { useState } from 'react';
import { Building2, CheckCircle2, Phone, Scale, ShieldCheck, UserCheck, X } from 'lucide-react';
import {
  formatMxPhoneDashed,
  isTallerOnboardingComplete,
  LEGAL_DISCLAIMER_TEXT,
} from '../utils/alumineroLogic';
import { TallerConfig } from '../utils/storageHelpers';
import { AlumineroProMetallicLogo } from './MetallicIcons';

interface TallerOnboardingGateProps {
  taller: TallerConfig;
  referredByName?: string | null;
  onSaveOnboarding: (data: {
    nombre: string;
    responsable: string;
    tel: string;
    termsAcceptedAt: number;
  }) => void;
}

export const TallerOnboardingGate: React.FC<TallerOnboardingGateProps> = ({
  taller,
  referredByName = null,
  onSaveOnboarding,
}) => {
  const [nombre, setNombre] = useState(taller.nombre || '');
  const [responsable, setResponsable] = useState(taller.responsable || '');
  const [tel, setTel] = useState(() => formatMxPhoneDashed(taller.tel || ''));
  const [termsAccepted, setTermsAccepted] = useState<boolean>(Boolean(taller.termsAcceptedAt));
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const cleanResponsable = responsable.trim();
    const cleanTel = formatMxPhoneDashed(tel.trim()) || tel.trim();

    if (cleanNombre.length < 2) {
      setError('Escribe el nombre de tu taller o negocio (mínimo 2 caracteres).');
      return;
    }
    if (cleanResponsable.length < 2) {
      setError('Escribe el nombre del responsable del taller.');
      return;
    }
    const digits = cleanTel.replace(/\D/g, '');
    if (digits.length < 7 && cleanTel.length < 7) {
      setError('Ingresa un teléfono o WhatsApp válido (mínimo 7 dígitos).');
      return;
    }
    if (!termsAccepted) {
      setError('Debes aceptar los Términos de Uso y verificación de medidas antes de continuar.');
      return;
    }
    if (!isTallerOnboardingComplete({ nombre: cleanNombre, responsable: cleanResponsable, tel: cleanTel })) {
      setError('Completa los 3 datos obligatorios de tu taller para continuar.');
      return;
    }

    setError(null);
    onSaveOnboarding({
      nombre: cleanNombre,
      responsable: cleanResponsable,
      tel: cleanTel,
      termsAcceptedAt: Date.now(),
    });
  };

  return (
    <div
      id="view-onboarding-taller"
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-[#07131B] via-[#091722] to-[#050E15] text-white"
    >
      <div className="w-full max-w-[460px] rounded-[24px] border border-[#4A6072]/80 bg-gradient-to-b from-[#112433]/95 via-[#0B1924]/95 to-[#08131C]/98 shadow-[0_24px_60px_rgba(0,0,0,0.65)] p-5 sm:p-7 relative overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[4px] rounded-b-md"
          style={{
            background: 'linear-gradient(90deg, rgba(74,96,114,0.2) 0%, #9BD5F7 50%, rgba(74,96,114,0.2) 100%)',
          }}
        />

        <div className="flex flex-col items-center text-center mb-5">
          <div className="mb-3 p-2.5 rounded-2xl border border-[#4A6072]/70 bg-[#07131B]/80 shadow-inner">
            <AlumineroProMetallicLogo size={48} />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Configuración inicial · Mi Taller
          </span>
          <h1 className="m-0 text-[22px] sm:text-[24px] font-extrabold text-white tracking-tight leading-tight">
            Bienvenido a Aluminero Pro
          </h1>
          <p className="m-0 mt-1.5 text-[13px] text-[#B0C4D4] leading-relaxed">
            Registra los datos básicos de tu taller para personalizar tus cotizaciones PDF, cortes y enlace de invitación.
          </p>

          {referredByName && (
            <div
              id="onboarding-referred-banner"
              className="mt-3 w-full px-3.5 py-2 rounded-xl border border-emerald-400/45 bg-emerald-500/15 text-emerald-200 text-[12px] font-extrabold"
            >
              Invitado por: <span className="text-white">{referredByName}</span>
            </div>
          )}
        </div>

        <form id="form-onboarding-taller" noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label
              htmlFor="inp-onb-taller-nombre"
              className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#D6E4F0] mb-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
              Nombre del taller *
            </label>
            <input
              id="inp-onb-taller-nombre"
              type="text"
              required
              autoComplete="organization"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Aluminios del Centro"
              className="w-full min-h-[46px] rounded-xl border border-[#4A6072]/80 bg-[#07131B]/90 px-3.5 text-[14px] font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label
              htmlFor="inp-onb-taller-responsable"
              className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#D6E4F0] mb-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
              Nombre del responsable *
            </label>
            <input
              id="inp-onb-taller-responsable"
              type="text"
              required
              autoComplete="name"
              value={responsable}
              onChange={(e) => {
                setResponsable(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ejemplo Cliente"
              className="w-full min-h-[46px] rounded-xl border border-[#4A6072]/80 bg-[#07131B]/90 px-3.5 text-[14px] font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label
              htmlFor="inp-onb-taller-tel"
              className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#D6E4F0] mb-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
              Teléfono / WhatsApp * (auto XXX-XXX-XX-XX)
            </label>
            <input
              id="inp-onb-taller-tel"
              type="tel"
              inputMode="numeric"
              required
              autoComplete="tel"
              maxLength={13}
              value={tel}
              onChange={(e) => {
                const formatted = formatMxPhoneDashed(e.target.value, tel);
                setTel(formatted);
                if (error) setError(null);
              }}
              placeholder="333-333-4444"
              className="w-full min-h-[46px] rounded-xl border border-[#4A6072]/80 bg-[#07131B]/90 px-3.5 mono text-[14px] font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Casilla obligatoria de Términos de Uso y Deslinde */}
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3">
            <label
              htmlFor="chk-onboarding-terms"
              className="flex items-start gap-2.5 cursor-pointer select-none"
            >
              <input
                id="chk-onboarding-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (error) setError(null);
                }}
                className="mt-0.5 w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
              />
              <span className="text-[12px] text-slate-100 leading-snug">
                Acepto los{' '}
                <button
                  type="button"
                  id="btn-onboarding-ver-terminos"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="underline font-extrabold text-amber-300 hover:text-amber-200 bg-transparent border-0 p-0 cursor-pointer"
                >
                  Términos de Uso
                </button>{' '}
                y entiendo que debo revisar las medidas antes de cortar.
              </span>
            </label>
          </div>

          {error && (
            <div
              id="onboarding-taller-error"
              role="alert"
              className="rounded-xl border border-rose-400/60 bg-rose-950/70 px-3.5 py-2.5 text-[12.5px] font-bold text-rose-200"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            id="btn-onboarding-guardar"
            disabled={!termsAccepted}
            className={`mt-1 w-full min-h-[50px] px-4 rounded-xl font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all ${
              termsAccepted
                ? 'metal-emerald-pill cursor-pointer active:scale-[0.98]'
                : 'bg-slate-700/70 text-slate-400 border border-slate-600 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            <span>Guardar y entrar a Aluminero Pro</span>
          </button>

          <p className="m-0 text-center text-[11px] text-[#8CA6BA] leading-snug">
            Tus datos se guardan en tu equipo y podrás editarlos en cualquier momento desde{' '}
            <strong className="text-slate-200">Mi Taller y Precios</strong>.
          </p>
        </form>
      </div>

      {/* Modal de Términos de Uso y Deslinde */}
      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Términos de Uso y Deslinde de Responsabilidad"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTermsModal(false);
          }}
        >
          <div className="w-full max-w-[480px] max-h-[82vh] rounded-2xl border border-amber-400/50 bg-[#0B1924] text-white shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/15 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                <strong className="text-[14px] font-extrabold text-white">
                  Términos de Uso y Deslinde
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                aria-label="Cerrar términos"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-[12.5px] text-slate-200 leading-relaxed space-y-3">
              <div className="p-3 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-100 font-semibold">
                {LEGAL_DISCLAIMER_TEXT}
              </div>
              <p className="m-0">
                1. Aluminero Pro es una herramienta profesional de apoyo para cálculo de despiece, optimización de barras de 6.10 m y elaboración de presupuestos de cancelería de aluminio y vidrio.
              </p>
              <p className="m-0">
                2. Los descuentos por línea (Línea 2", Línea 3", Europea, Puertas, Canceles) pueden variar según extrusor, molde, empaque y herraje. Puedes ajustar tus propios descuentos desde <strong className="text-white">Mi Taller → Ajuste fino de descuentos (cm)</strong>.
              </p>
              <p className="m-0">
                3. El instalador o maestro aluminero es responsable de verificar físicamente todas las medidas, escuadras, niveles y holguras antes de ejecutar cualquier corte de perfil o cristal.
              </p>
            </div>
            <div className="p-3.5 border-t border-white/15 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="flex-1 min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[13px] cursor-pointer"
              >
                Aceptar y continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
