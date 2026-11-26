import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { LEGAL_DISCLAIMER_TEXT, PRE_CUT_WARNING_TEXT } from '../utils/alumineroLogic';
import type { TallerConfig } from '../utils/storageHelpers';
import type { LegalDocType } from './LegalModal';

export interface UnifiedWorkshopGateModalProps {
  open: boolean;
  blocking?: boolean;
  taller: TallerConfig;
  targetToolLabel?: string;
  googleAuthLoading?: boolean;
  googleAuthError?: string | null;
  onOpenLegalDoc?: (doc: Exclude<LegalDocType, null>) => void;
  onContinueWithGoogle: () => Promise<void> | void;
  onSaveManual: (data: {
    nombre: string;
    correo: string;
    tel: string;
    ubicacion: string;
    termsAcceptedAt: number;
  }) => void;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const UnifiedWorkshopGateModal: React.FC<UnifiedWorkshopGateModalProps> = ({
  open,
  blocking = false,
  taller,
  targetToolLabel,
  googleAuthLoading = false,
  googleAuthError = null,
  onOpenLegalDoc,
  onContinueWithGoogle,
  onSaveManual,
  onClose,
}) => {
  const [nombre, setNombre] = useState(
    taller.nombre && taller.nombre !== 'Mi Taller de Aluminio' ? taller.nombre : ''
  );
  const [correo, setCorreo] = useState(taller.correo || '');
  const [tel, setTel] = useState(taller.tel || '');
  const [ubicacion, setUbicacion] = useState(taller.ubicacion || '');
  const [accepted, setAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setAccepted(false);
  }, [open]);

  if (!open) return null;

  const cleanNombre = nombre.trim();
  const cleanCorreo = correo.trim().toLowerCase();
  const cleanTel = tel.trim();
  const cleanUbicacion = ubicacion.trim();
  const isEmailValid = EMAIL_RE.test(cleanCorreo);
  const canSubmitManual = accepted && cleanNombre.length >= 2 && isEmailValid;
  const canUseGoogle = accepted && !googleAuthLoading;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setFormError(
        'Debes marcar la casilla "He leído y acepto los Términos, Condiciones y Aviso de Privacidad" para continuar.'
      );
      return;
    }
    if (cleanNombre.length < 2) {
      setFormError('Ingresa tu Nombre completo o el Nombre de tu Taller.');
      return;
    }
    if (!isEmailValid) {
      setFormError('Ingresa un correo electrónico válido (ej. taller@correo.com).');
      return;
    }
    setFormError(null);
    onSaveManual({
      nombre: cleanNombre,
      correo: cleanCorreo,
      tel: cleanTel,
      ubicacion: cleanUbicacion,
      termsAcceptedAt: Date.now(),
    });
  };

  return (
    <div
      id="unified-workshop-gate-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unified-workshop-gate-title"
      className="fixed inset-0 z-[9995] bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (!blocking && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[600px] max-h-[94dvh] rounded-2xl border border-slate-700/90 bg-[#0F172A] text-slate-100 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#111C33] border-b border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/25 border border-blue-400/50 text-sky-300 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
                {blocking
                  ? 'Acceso inicial obligatorio · Solo una vez'
                  : targetToolLabel
                    ? `Antes de abrir ${targetToolLabel} · Solo una vez`
                    : 'Registro único de usuario'}
              </span>
              <h2
                id="unified-workshop-gate-title"
                className="m-0 text-[16px] sm:text-[18px] font-black text-white leading-tight"
              >
                Aviso Legal, Privacidad y Registro
              </h2>
            </div>
          </div>
          {!blocking && (
            <button
              type="button"
              id="btn-close-unified-workshop-gate"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={handleManualSubmit}
          className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3"
        >
          {/* PASO 1: Aviso Legal y Privacidad (Bloqueante hasta aceptar) */}
          <div className="space-y-2 p-3 rounded-xl border border-amber-400/35 bg-slate-900/95">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Paso 1 · Aviso Legal y Privacidad</span>
              </div>
              {onOpenLegalDoc && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    id="btn-gate-open-terminos"
                    onClick={() => onOpenLegalDoc('terminos')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sky-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Términos</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    id="btn-gate-open-aviso-legal"
                    onClick={() => onOpenLegalDoc('deslinde')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Aviso Legal</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    id="btn-gate-open-privacidad"
                    onClick={() => onOpenLegalDoc('privacidad')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Privacidad</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <div
              id="unified-legal-scroll-body"
              className="max-h-[96px] overflow-y-auto px-3 py-2 rounded-xl border border-slate-700 bg-[#0B1222] text-[11.5px] leading-relaxed text-slate-200 space-y-2"
            >
              <div className="p-2 rounded-lg border border-amber-400/40 bg-amber-950/40 text-amber-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="m-0 text-[11px] font-bold leading-snug">
                  {PRE_CUT_WARNING_TEXT.replace(/^⚠️\s*/, '')}
                </p>
              </div>
              <div className="whitespace-pre-line font-sans text-slate-200">
                {LEGAL_DISCLAIMER_TEXT}
              </div>
            </div>

            <label
              htmlFor="chk-unified-legal-accept"
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                accepted
                  ? 'border-emerald-400/70 bg-emerald-950/35'
                  : 'border-amber-400/50 bg-slate-950/80 hover:border-sky-400/60'
              }`}
            >
              <input
                id="chk-unified-legal-accept"
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  if (e.target.checked) setFormError(null);
                }}
                className="mt-0.5 w-5 h-5 rounded accent-emerald-500 shrink-0 cursor-pointer"
              />
              <span className="text-[12.5px] font-bold text-slate-100 leading-snug select-none">
                He leído y acepto los Términos, Condiciones y Aviso de Privacidad
              </span>
            </label>

            {!accepted && (
              <div
                id="unified-legal-lock-hint"
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 text-[11.5px] font-semibold flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                <span>Marca la casilla de aceptación para desbloquear el registro y el acceso con Google.</span>
              </div>
            )}
          </div>

          {/* PASO 2: Opción rápida con Google */}
          <div className="p-3 rounded-xl border border-sky-400/40 bg-sky-950/40 space-y-2">
            <div className="text-[12px] font-extrabold text-sky-200">
              Paso 2 · Registro rápido con Google (1 toque):
            </div>
            <button
              type="button"
              id="btn-unified-gate-google"
              disabled={!canUseGoogle}
              onClick={() => onContinueWithGoogle()}
              className="w-full min-h-[44px] px-4 rounded-xl bg-white hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-400 disabled:border-slate-600 disabled:cursor-not-allowed text-slate-900 font-extrabold text-[14px] flex items-center justify-center gap-2.5 cursor-pointer shadow-md border border-slate-200 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.14-4.06 1.14-3.12 0-5.77-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.1z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.1c.95-2.84 3.6-4.95 6.72-4.95z" />
              </svg>
              <span>{googleAuthLoading ? 'Conectando con Google...' : 'Conectar con Google'}</span>
            </button>
            {googleAuthError && (
              <div
                id="unified-gate-google-error"
                role="alert"
                className="p-2.5 rounded-lg border border-rose-400/70 bg-rose-950/90 text-rose-100 text-[11.5px] font-semibold leading-snug"
              >
                {googleAuthError}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-slate-700" />
            <span>O regístrate manualmente</span>
            <span className="h-px flex-1 bg-slate-700" />
          </div>

          {/* Campos manuales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="inp-unified-taller-nombre"
                className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-200 mb-1"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                <span>Nombre completo o Taller *</span>
              </label>
              <input
                id="inp-unified-taller-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Carlos Olmos · Aluminio y Vidrio"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-600 bg-slate-900 text-white text-[13.5px] font-semibold focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="inp-unified-taller-correo"
                className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-200 mb-1"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                <span>Correo electrónico *</span>
              </label>
              <input
                id="inp-unified-taller-correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Ej. taller@correo.com"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-600 bg-slate-900 text-white text-[13.5px] font-semibold focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="inp-unified-taller-whatsapp"
                className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-200 mb-1"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>WhatsApp (opcional)</span>
              </label>
              <input
                id="inp-unified-taller-whatsapp"
                type="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="Ej. 55 1234 5678"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-600 bg-slate-900 text-white text-[13.5px] font-semibold focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="inp-unified-taller-ciudad"
                className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-200 mb-1"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Ciudad / Estado (opcional)</span>
              </label>
              <input
                id="inp-unified-taller-ciudad"
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej. Guadalajara, Jalisco"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-600 bg-slate-900 text-white text-[13.5px] font-semibold focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="p-2.5 rounded-xl border border-rose-400/60 bg-rose-950/80 text-rose-100 text-[12px] font-bold"
            >
              {formError}
            </div>
          )}

          <button
            type="submit"
            id="btn-unified-gate-save"
            disabled={!canSubmitManual}
            className="w-full min-h-[48px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-[14.5px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <ShieldCheck className="w-4.5 h-4.5" aria-hidden="true" />
            <span>Registrarme y Continuar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
