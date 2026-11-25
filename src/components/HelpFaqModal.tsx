import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, X } from 'lucide-react';
import { ResolvedAppTheme } from '../utils/storageHelpers';

export interface WorkshopFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const WORKSHOP_FAQ_ITEMS: readonly WorkshopFaqItem[] = [
  {
    id: 'offline',
    question: '¿Funciona sin internet?',
    answer:
      'Sí. Una vez instalada en tu celular, puedes calcular descuentos, optimizar tramos y cotizar en plena obra aunque no tengas datos ni Wi-Fi.',
  },
  {
    id: 'marcas-lineas',
    question: '¿Qué marcas y líneas incluye?',
    answer:
      'Incluye perfiles y descuentos oficiales vigentes (Edición 2026–2027) de Panorama, Cuprum, Indalum, EuroAlum, Alugama, Extrusiones Metálicas, Perfiletto y Herralum 2026 (Línea Nacional 1 1/2", 2", 3", Serie 1400, Línea Española/Europea y Canceles de Baño).',
  },
  {
    id: 'precios',
    question: '¿Con qué precios cotiza?',
    answer:
      'Con los precios reales de tu proveedor local; los guardas una vez y la app los recuerda para tus siguientes cotizaciones, permitiéndote actualizarlos cuando suba el material.',
  },
  {
    id: 'puertas-ventanas',
    question: '¿Sirve para puertas y ventanas complejas?',
    answer:
      'Sí. Reconoce ventanas corredizas, fijas, proyectantes, oscilobatientes, puertas abatibles, plegadizas y canceles de baño.',
  },
  {
    id: 'pagos-planes',
    question: '¿Tengo que pagar cada mes a la fuerza?',
    answer:
      'No. Tienes versión gratuita sin límite de tiempo, o puedes activar PRO por 30 días ($369), 90 días ($989) o 1 Año completo ($1,799 MXN) sin plazos forzosos ni cargos automáticos sorpresa.',
  },
] as const;

interface HelpFaqModalProps {
  open: boolean;
  theme: ResolvedAppTheme;
  onClose: () => void;
}

export const HelpFaqModal: React.FC<HelpFaqModalProps> = ({ open, theme, onClose }) => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    offline: true,
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isDark = theme === 'dark';

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allExpanded = WORKSHOP_FAQ_ITEMS.every((item) => Boolean(openIds[item.id]));

  const toggleAll = () => {
    if (allExpanded) {
      setOpenIds({});
    } else {
      const next: Record<string, boolean> = {};
      for (const item of WORKSHOP_FAQ_ITEMS) next[item.id] = true;
      setOpenIds(next);
    }
  };

  return (
    <div
      id="modal-help-faq"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-faq-title"
      className="fixed inset-0 z-[9970] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-[540px] max-h-[88vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark
            ? 'bg-gradient-to-b from-[#0B1B28] via-[#091622] to-[#07131D] border-sky-400/35 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-4 sm:px-5 py-4 border-b flex items-start justify-between gap-3 shrink-0 ${
            isDark ? 'border-white/15 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-sky-500/20 border-sky-400/45 text-sky-300'
                  : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}
              aria-hidden="true"
            >
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="help-faq-title"
                className={`m-0 text-[17px] sm:text-[18px] font-extrabold leading-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Ayuda y Preguntas Frecuentes
              </h2>
              <p
                className={`m-0 mt-1 text-[12px] leading-snug ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Respuestas directas de taller sobre uso sin internet, líneas, precios y planes.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-help-faq"
            onClick={onClose}
            aria-label="Cerrar Ayuda y Preguntas Frecuentes"
            className={`min-w-[36px] min-h-[36px] rounded-xl border inline-flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
              isDark
                ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 mb-0.5 shrink-0">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${
                isDark ? 'text-sky-300' : 'text-blue-700'
              }`}
            >
              {WORKSHOP_FAQ_ITEMS.length} preguntas clave
            </span>
            <button
              type="button"
              id="btn-faq-toggle-all"
              onClick={toggleAll}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                isDark
                  ? 'border-white/15 bg-white/5 hover:bg-white/15 text-slate-200'
                  : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {allExpanded ? 'Contraer todas' : 'Ver todas abiertas'}
            </button>
          </div>

          {WORKSHOP_FAQ_ITEMS.map((item, idx) => {
            const expanded = Boolean(openIds[item.id]);
            return (
              <div
                key={item.id}
                id={`faq-card-${item.id}`}
                className={`shrink-0 rounded-xl border transition-colors overflow-hidden ${
                  expanded
                    ? isDark
                      ? 'border-sky-400/55 bg-sky-500/10'
                      : 'border-blue-300 bg-blue-50/50'
                    : isDark
                      ? 'border-white/15 bg-white/5 hover:bg-white/10'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80'
                }`}
              >
                <button
                  type="button"
                  id={`btn-faq-${item.id}`}
                  aria-expanded={expanded}
                  aria-controls={`faq-answer-${item.id}`}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full min-h-[50px] px-3.5 py-3 flex items-center justify-between gap-3 text-left cursor-pointer bg-transparent border-0 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center shrink-0 ${
                        expanded
                          ? 'bg-blue-600 text-white'
                          : isDark
                            ? 'bg-white/10 text-sky-200'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-[13.5px] sm:text-[14px] font-extrabold leading-snug">
                      {item.question}
                    </span>
                  </span>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 opacity-80 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
                  )}
                </button>

                {expanded && (
                  <div
                    id={`faq-answer-${item.id}`}
                    className={`px-4 pb-3.5 pt-2 border-t text-[13px] leading-relaxed ${
                      isDark
                        ? 'border-white/10 text-slate-100'
                        : 'border-blue-200/70 text-slate-700'
                    }`}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className={`px-4 sm:px-5 py-3 border-t flex items-center justify-end shrink-0 ${
            isDark ? 'border-white/15 bg-slate-950/40' : 'border-slate-200 bg-slate-50/80'
          }`}
        >
          <button
            type="button"
            id="btn-help-faq-done"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[13px] cursor-pointer shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
