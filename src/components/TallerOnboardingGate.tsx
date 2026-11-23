import React, { useState } from 'react';
import { Building2, CheckCircle2, Phone, ShieldCheck, UserCheck } from 'lucide-react';
import { generateRandomMxPhonePlaceholder, isTallerOnboardingComplete } from '../utils/alumineroLogic';
import { TallerConfig } from '../utils/storageHelpers';
import { AlumineroProMetallicLogo } from './MetallicIcons';

interface TallerOnboardingGateProps {
  taller: TallerConfig;
  referredByName?: string | null;
  onSaveOnboarding: (data: { nombre: string; responsable: string; tel: string }) => void;
}

export const TallerOnboardingGate: React.FC<TallerOnboardingGateProps> = ({
  taller,
  referredByName = null,
  onSaveOnboarding,
}) => {
  const [nombre, setNombre] = useState(taller.nombre || '');
  const [responsable, setResponsable] = useState(taller.responsable || '');
  const [tel, setTel] = useState(taller.tel || '');
  const [error, setError] = useState<string | null>(null);
  const [phoneHint] = useState(() => generateRandomMxPhonePlaceholder());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    const cleanResponsable = responsable.trim();
    const cleanTel = tel.trim();

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
    if (!isTallerOnboardingComplete({ nombre: cleanNombre, responsable: cleanResponsable, tel: cleanTel })) {
      setError('Completa los 3 datos obligatorios de tu taller para continuar.');
      return;
    }

    setError(null);
    onSaveOnboarding({
      nombre: cleanNombre,
      responsable: cleanResponsable,
      tel: cleanTel,
    });
  };

  return (
    <div
      id="view-onboarding-taller"
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-[#07131B] via-[#091722] to-[#050E15] text-white"
    >
      <div className="w-full max-w-[460px] rounded-[24px] border border-[#4A6072]/80 bg-gradient-to-b from-[#112433]/95 via-[#0B1924]/95 to-[#08131C]/98 shadow-[0_24px_60px_rgba(0,0,0,0.65)] p-5 sm:p-7 relative overflow-hidden">
        {/* Acento metálico superior */}
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
              placeholder="Ej. Cancelería y Vidrios del Centro"
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
              placeholder="Ej. Ing. Roberto Hernández"
              className="w-full min-h-[46px] rounded-xl border border-[#4A6072]/80 bg-[#07131B]/90 px-3.5 text-[14px] font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label
              htmlFor="inp-onb-taller-tel"
              className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#D6E4F0] mb-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
              Teléfono / WhatsApp *
            </label>
            <input
              id="inp-onb-taller-tel"
              type="tel"
              required
              autoComplete="tel"
              value={tel}
              onChange={(e) => {
                setTel(e.target.value);
                if (error) setError(null);
              }}
              placeholder={phoneHint}
              className="w-full min-h-[46px] rounded-xl border border-[#4A6072]/80 bg-[#07131B]/90 px-3.5 mono text-[14px] font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
            />
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
            className="metal-emerald-pill mt-1 w-full min-h-[50px] px-4 rounded-xl font-extrabold text-[15px] cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
    </div>
  );
};
