import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { LEGAL_DISCLAIMER_TEXT, PRE_CUT_WARNING_TEXT } from '../utils/alumineroLogic';
import type { TallerConfig } from '../utils/storageHelpers';

export interface UnifiedWorkshopGateModalProps {
  open: boolean;
  taller: TallerConfig;
  targetToolLabel?: string;
  googleAuthLoading?: boolean;
  googleAuthError?: string | null;
  onContinueWithGoogle: () => Promise<void> | void;
  onSaveManual: (data: {
    nombre: string;
    tel: string;
    ubicacion: string;
    termsAcceptedAt: number;
  }) => void;
  onClose: () => void;
}

export const UnifiedWorkshopGateModal: React.FC<UnifiedWorkshopGateModalProps> = ({
  open,
  taller,
  targetToolLabel,
  googleAuthLoading = false,
  googleAuthError = null,
  onContinueWithGoogle,
  onSaveManual,
  onClose,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nombre, setNombre] = useState(
    taller.nombre && taller.nombre !== 'Mi Taller de Aluminio' ? taller.nombre : ''
  );
  const [tel, setTel] = useState(taller.tel || '');
  const [ubicacion, setUbicacion] = useState(taller.ubicacion || '');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setHasScrolledToBottom(false);
    setAccepted(false);
    const el = scrollRef.current;
    if (!el) return;
    const timer = window.setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 8) {
        setHasScrolledToBottom(true);
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [open]);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining <= 24) {
      setHasScrolledToBottom(true);
    }
  }, []);

  if (!open) return null;

  const cleanNombre = nombre.trim();
  const cleanTel = tel.trim();
  const cleanUbicacion = ubicacion.trim();
  const canSubmit =
    cleanNombre.length >= 2 &&
    cleanTel.length >= 7 &&
    cleanUbicacion.length >= 2 &&
    hasScrolledToBottom &&
    accepted;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanNombre.length < 2) {
      setFormError('Ingresa tu Nombre o el Nombre de tu Taller.');
      return;
    }
    if (cleanTel.length < 7) {
      setFormError('Ingresa un número de WhatsApp válido (mínimo 7 dígitos).');
      return;
    }
    if (cleanUbicacion.length < 2) {
      setFormError('Ingresa tu Ciudad y Estado.');
      return;
    }
    if (!hasScrolledToBottom || !accepted) {
      setFormError('Lee el Aviso Legal hasta el final y marca la casilla de aceptación.');
      return;
    }
    setFormError(null);
    onSaveManual({
      nombre: cleanNombre,
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
      className="fixed inset-0 z-[9995] bg-slate-950/82 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[580px] max-h-[94dvh] rounded-2xl border border-slate-700/90 bg-[#0F172A] text-slate-100 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#111C33] border-b border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/50 text-sky-300 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
                {targetToolLabel
                  ? `Antes de abrir ${targetToolLabel} · Solo una vez`
                  : 'Registro único de taller'}
              </span>
              <h2
                id="unified-workshop-gate-title"
                className="m-0 text-[16px] sm:text-[18px] font-black text-white leading-tight"
              >
                Aviso Legal, Deslinde y Registro de Taller
              </h2>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-unified-workshop-gate"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={handleManualSubmit}
          className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4"
        >
          {/* Opción rápida arriba: Continuar con Google */}
          <div className="p-3.5 rounded-xl border border-sky-400/40 bg-sky-950/40 space-y-2">
            <div className="text-[12px] font-extrabold text-sky-200">
              Opción rápida en 1 toque (rellena tus datos y guarda tu registro en la nube):
            </div>
            <button
              type="button"
              id="btn-unified-gate-google"
              disabled={googleAuthLoading}
              onClick={() => void onContinueWithGoogle()}
              className="w-full min-h-[46px] px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-[14px] flex items-center justify-center gap-2.5 cursor-pointer shadow-md border border-slate-200 disabled:opacity-65 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.14-4.06 1.14-3.12 0-5.77-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.1z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.1c.95-2.84 3.6-4.95 6.72-4.95z" />
              </svg>
              <span>{googleAuthLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
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
            <span>O completa tu registro manual</span>
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
                <span>Nombre o Taller *</span>
              </label>
              <input
                id="inp-unified-taller-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Aluminio y Vidrio Olmos"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-600 bg-slate-900 text-white text-[13.5px] font-semibold focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="inp-unified-taller-whatsapp"
                className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-200 mb-1"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>WhatsApp *</span>
              </label>
              <input
                id="inp-unified-taller-whatsapp"
                type="tel"
                required
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
                <span>Ciudad / Estado *</span>
              </label>
              <input
                id="inp-unified-taller-ciudad"
                type="text"
                required
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej. Guadalajara, Jalisco"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-600 bg-slate-900 text-white text-[13.5px] font-semibold focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Texto legal scrollable */}
          <div className="space-y-2">
            <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-amber-300">
              Aviso Legal y Deslinde de Responsabilidad
            </div>
            <div
              ref={scrollRef}
              id="unified-legal-scroll-body"
              onScroll={checkScrollPosition}
              className="max-h-[170px] overflow-y-auto px-3.5 py-3 rounded-xl border border-slate-700 bg-[#0B1222] text-[12px] leading-relaxed text-slate-200 space-y-2.5"
            >
              <div className="p-2.5 rounded-lg border border-amber-400/45 bg-amber-950/40 text-amber-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="m-0 text-[11.5px] font-bold leading-snug">
                  {PRE_CUT_WARNING_TEXT.replace(/^⚠️\s*/, '')}
                </p>
              </div>
              <div className="whitespace-pre-line font-sans text-slate-200">
                {LEGAL_DISCLAIMER_TEXT}
              </div>
              <p className="m-0 text-[11px] font-bold text-emerald-300 text-center pt-1">
                — Fin del Aviso Legal y Deslinde de Responsabilidad —
              </p>
            </div>

            {!hasScrolledToBottom ? (
              <div
                id="unified-legal-scroll-hint"
                className="px-3 py-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-200 text-[11.5px] font-bold flex items-center justify-between gap-2"
              >
                <span>Desliza el Aviso Legal hasta el final para habilitar la casilla.</span>
                <ChevronDown className="w-4 h-4 shrink-0 animate-bounce" aria-hidden="true" />
              </div>
            ) : (
              <div
                id="unified-legal-scroll-ready"
                className="px-3 py-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 text-[11.5px] font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" aria-hidden="true" />
                <span>Lectura completada. Ya puedes aceptar y continuar.</span>
              </div>
            )}

            <label
              htmlFor="chk-unified-legal-accept"
              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors ${
                hasScrolledToBottom
                  ? 'border-slate-600 bg-slate-900/90 hover:border-sky-400/60 cursor-pointer'
                  : 'border-slate-800 bg-slate-950/60 opacity-55 cursor-not-allowed'
              }`}
            >
              <input
                id="chk-unified-legal-accept"
                type="checkbox"
                disabled={!hasScrolledToBottom}
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded accent-blue-500 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-[12.5px] font-bold text-slate-100 leading-snug select-none">
                He leído y acepto el Aviso Legal y Deslinde
              </span>
            </label>
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
            disabled={!canSubmit}
            className="w-full min-h-[48px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-[14.5px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <ShieldCheck className="w-4.5 h-4.5" aria-hidden="true" />
            <span>Guardar y Continuar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
