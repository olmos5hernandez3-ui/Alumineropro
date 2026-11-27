import React from 'react';

interface CollapsibleAccordionProps {
  id: string;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  rightAction?: React.ReactNode;
  tone?: 'dark' | 'light';
  className?: string;
  children: React.ReactNode;
}

/**
 * Acordeón desplegable reutilizable para agrupar secciones largas
 * en Levantamiento Rápido, Hoja de Cotización y Despiece.
 * Usa un botón nativo dedicado para abrir/cerrar y un contenedor hermano
 * para acciones rápidas (ej. "Seleccionar todas") evitando botones anidados.
 */
export const CollapsibleAccordion: React.FC<CollapsibleAccordionProps> = ({
  id,
  title,
  summary,
  open,
  onToggle,
  rightAction,
  tone = 'dark',
  className = '',
  children,
}) => {
  const isDark = tone === 'dark';
  const contentId = `${id}-content`;
  const triggerId = `${id}-trigger`;

  return (
    <section
      id={id}
      data-accordion-open={open ? 'true' : 'false'}
      className={`rounded-[15px] border transition-colors ${
        isDark
          ? 'bg-[#121a2e] border-[#263554] text-slate-100'
          : 'bg-white border-slate-300 text-[#1E293B] shadow-sm'
      } ${className}`}
    >
      <div
        className={`flex items-center justify-between gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 ${
          open
            ? isDark
              ? 'border-b border-[#243250]'
              : 'border-b border-slate-200'
            : ''
        }`}
      >
        <button
          id={triggerId}
          type="button"
          data-accordion-trigger="true"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={onToggle}
          className="flex-1 min-w-0 flex items-center gap-2.5 text-left bg-transparent border-0 p-0 cursor-pointer focus:outline-none group"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            width: 'auto',
            minHeight: 'auto',
            borderRadius: 0,
            boxShadow: 'none',
            textAlign: 'left',
            color: 'inherit',
          }}
        >
          <span
            aria-hidden="true"
            className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[13px] font-black shrink-0 transition-transform ${
              isDark
                ? open
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                  : 'bg-slate-800/90 text-slate-300 border border-slate-700'
                : open
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {open ? '▾' : '▸'}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block text-[14px] sm:text-[14.5px] font-extrabold leading-snug break-words ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {title}
            </span>
            {summary && (
              <span
                className={`block text-[11.5px] font-semibold leading-snug mt-0.5 break-words ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {summary}
              </span>
            )}
          </span>
        </button>

        {rightAction && (
          <div className="shrink-0 flex items-center gap-1.5">{rightAction}</div>
        )}
      </div>

      {open && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          className="px-3.5 py-3 sm:px-4 sm:py-3.5"
        >
          {children}
        </div>
      )}
    </section>
  );
};
