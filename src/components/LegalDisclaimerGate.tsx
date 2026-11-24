import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Scale, ShieldCheck } from 'lucide-react';
import { LEGAL_DISCLAIMER_TEXT, PRE_CUT_WARNING_TEXT } from '../utils/alumineroLogic';
import { saveLegalDisclaimerAccepted } from '../utils/storageHelpers';

export interface LegalDisclaimerGateProps {
  onAccepted: () => void;
}

export const LegalDisclaimerGate: React.FC<LegalDisclaimerGateProps> = ({ onAccepted }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Requiere llegar al final del texto legal (margen de 24px para tolerar redondeos de subpíxel en móvil)
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining <= 24) {
      setHasScrolledToBottom(true);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Solo auto-habilitar si el contenido no tiene barra de scroll posible
    const timer = window.setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 8) {
        setHasScrolledToBottom(true);
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (!hasScrolledToBottom || !checked) return;
    saveLegalDisclaimerAccepted(true);
    onAccepted();
  };

  return (
    <div
      id="legal-disclaimer-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-disclaimer-gate-title"
      className="fixed inset-0 z-[9999] bg-[#060B16] text-slate-100 flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden"
    >
      <div className="w-full max-w-[600px] max-h-[94dvh] rounded-2xl border border-slate-700/90 bg-[#0F172A] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 bg-[#111C33] border-b border-slate-700/80 flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-400/50 text-blue-300 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-sky-300">
              Aluminero Pro · Lectura Obligatoria
            </span>
            <h1
              id="legal-disclaimer-gate-title"
              className="m-0 text-[17px] sm:text-[19px] font-black text-white leading-tight"
            >
              Aviso Legal y Deslinde de Responsabilidad
            </h1>
          </div>
        </div>

        {/* Scrollable Legal Body */}
        <div
          ref={scrollRef}
          id="legal-disclaimer-scroll-body"
          onScroll={checkScrollPosition}
          className="flex-1 min-h-[180px] max-h-[46dvh] overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5 text-[12.5px] sm:text-[13px] leading-relaxed text-slate-200 bg-[#0B1222]"
        >
          <div className="p-3 rounded-xl border border-amber-400/45 bg-amber-950/40 text-amber-100 flex items-start gap-2.5">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="m-0 text-[12px] font-bold leading-snug">
              {PRE_CUT_WARNING_TEXT.replace(/^⚠️\s*/, '')}
            </p>
          </div>

          <div className="whitespace-pre-line font-sans text-slate-200 leading-relaxed">
            {LEGAL_DISCLAIMER_TEXT}
          </div>

          <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-900/90 space-y-2 text-[12px] text-slate-300">
            <h2 className="m-0 text-[13px] font-extrabold text-white">
              CLÁUSULAS ADICIONALES DE USO Y RESPONSABILIDAD PROFESIONAL
            </h2>
            <p className="m-0">
              <strong>1. Verificación obligatoria en taller:</strong> Todos los descuentos de corte, holguras de vidrio, medidas de perfiles y totales presupuestales generados por Aluminero Pro tienen carácter estrictamente auxiliar y de referencia. El usuario (taller, contratista o aluminero) es el único responsable de rectificar físicamente medidas de vanos, tolerancias del extrusor y precios vigentes de sus proveedores antes de cortar material o comprometer cotizaciones con clientes finales.
            </p>
            <p className="m-0">
              <strong>2. Deslinde por pérdidas o desperdicios:</strong> Los desarrolladores y administradores de Aluminero Pro no asumen responsabilidad civil, comercial ni económica por mermas, cortes incorrectos, roturas de vidrio, diferencias de precio, retrasos de obra o cualquier daño directo o indirecto derivado del uso de la aplicación.
            </p>
            <p className="m-0">
              <strong>3. Resguardo de información y licencias:</strong> Los datos operativos (levantamientos, cotizaciones, clientes e inventario) se almacenan principalmente de forma local en el dispositivo del usuario y, en planes autorizados, en respaldos en la nube. Las licencias PRO son personales e intransferibles por ID de equipo, y su uso indebido o manipulación puede conllevar suspensión del servicio.
            </p>
            <p className="m-0">
              <strong>4. Aceptación expresa:</strong> Al marcar la casilla inferior y presionar «Continuar», declaras haber leído íntegramente este Aviso Legal y Deslinde de Responsabilidad y aceptas todos sus términos para operar Aluminero Pro.
            </p>
          </div>

          <div className="pt-1 pb-2 text-center text-[11px] font-bold text-emerald-300">
            — Fin del Aviso Legal y Deslinde de Responsabilidad —
          </div>
        </div>

        {/* Bottom Gate Controls */}
        <div className="px-4 sm:px-5 py-4 bg-[#111C33] border-t border-slate-700/80 shrink-0 space-y-3">
          {!hasScrolledToBottom ? (
            <div
              id="legal-scroll-hint"
              className="px-3 py-2 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-200 text-[12px] font-bold flex items-center justify-between gap-2"
            >
              <span>Desliza el texto legal hasta el final para habilitar la aceptación.</span>
              <ChevronDown className="w-4 h-4 shrink-0 animate-bounce" aria-hidden="true" />
            </div>
          ) : (
            <div
              id="legal-scroll-ready"
              className="px-3 py-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 text-[12px] font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <span>Lectura completada. Ahora puedes aceptar y continuar.</span>
            </div>
          )}

          <label
            htmlFor="chk-legal-disclaimer-accept"
            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
              hasScrolledToBottom
                ? 'border-slate-600 bg-slate-900/90 hover:border-sky-400/60 cursor-pointer'
                : 'border-slate-800 bg-slate-950/60 opacity-55 cursor-not-allowed'
            }`}
          >
            <input
              id="chk-legal-disclaimer-accept"
              type="checkbox"
              disabled={!hasScrolledToBottom}
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-blue-500 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-[13px] font-bold text-slate-100 leading-snug select-none">
              He leído y acepto el Aviso Legal y Deslinde
            </span>
          </label>

          <button
            type="button"
            id="btn-legal-disclaimer-continue"
            disabled={!hasScrolledToBottom || !checked}
            onClick={handleContinue}
            className="w-full min-h-[48px] px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-[14.5px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <ShieldCheck className="w-4.5 h-4.5" aria-hidden="true" />
            <span>Continuar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
