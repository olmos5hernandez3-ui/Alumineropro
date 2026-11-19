import React from 'react';
import { CATALOGO_PERFILES } from '../utils/alumineroLogic';
import { formatMXN } from '../utils/storageHelpers';
import { ScreenId } from './TopBarAndDrawer';

interface Props {
  proActive: boolean;
  hojaPiezasCount: number;
  hojaTotal: number;
  inventarioTramosTotal: number;
  hojasVidrioCount: number;
  notasCount: number;
  onEntrarTrabajo: (cat: 'ventanas' | 'puertas') => void;
  onEntrarHoja: () => void;
  onEntrarInventario: () => void;
  onGoToView: (view: ScreenId) => void;
  onOpenAntesDespues: () => void;
}

export const MainMenuView: React.FC<Props> = ({
  proActive,
  hojaPiezasCount,
  hojaTotal,
  inventarioTramosTotal,
  hojasVidrioCount,
  notasCount,
  onEntrarTrabajo,
  onEntrarHoja,
  onEntrarInventario,
  onGoToView,
  onOpenAntesDespues,
}) => {
  return (
    <section
      id="view-menu"
      data-pro-active={proActive ? 'true' : 'false'}
      className="screen-animate"
    >
      <div className="mb-4 sm:mb-5">
        <h1 className="m-0 text-[clamp(1.45rem,3.6vw,2.1rem)] font-extrabold text-white leading-[1.15] tracking-tight [text-wrap:balance]">
          ¿Qué vamos a trabajar?
        </h1>
      </div>

      {/* Tarjeta principal destacada: Hoja de Cotización */}
      <button
        type="button"
        id="btn-menu-hoja"
        onClick={onEntrarHoja}
        className="menu-hero-card mb-3.5 sm:mb-4 w-full rounded-[22px] p-4 sm:p-5 text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 shadow-xl"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0 backdrop-blur-sm shadow-inner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[16.5px] sm:text-[18px] font-extrabold text-white tracking-tight">
                Hoja de Cotización
              </span>
              {!proActive && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-extrabold whitespace-nowrap">
                  🔒 PRO
                </span>
              )}
            </div>
            <p className="m-0 text-[12px] sm:text-[12.5px] text-blue-100/90 mt-0.5">
              Partidas de obra, optimización de tramos 6.10 m y PDF
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-white/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white">
              <span className="block text-[9.5px] uppercase tracking-wider text-blue-100 font-bold">
                Piezas
              </span>
              <strong className="mono text-[13.5px] font-extrabold">
                {hojaPiezasCount} pzas
              </strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white">
              <span className="block text-[9.5px] uppercase tracking-wider text-blue-100 font-bold">
                Total rápido
              </span>
              <strong className="mono text-[13.5px] font-extrabold">
                {formatMXN(hojaTotal)}
              </strong>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="text-white/90 hidden sm:block" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {/* Cuadrícula moderna de 2 columnas */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* 1. VENTANAS */}
        <button
          type="button"
          id="btn-menu-ventanas"
          onClick={() => onEntrarTrabajo('ventanas')}
          className="menu-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="menu-icon-box menu-icon-blue w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <path d="M16 12h2m-1-1 2 1-2 1" />
              </svg>
            </div>
            <span className="menu-badge-free px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap">
              3" Gratis
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
              Ventanas
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              3", 2", Europea, Cancel y Mosq.
            </span>
          </div>
        </button>

        {/* 2. PUERTAS */}
        <button
          type="button"
          id="btn-menu-puertas"
          onClick={() => onEntrarTrabajo('puertas')}
          className="menu-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="menu-icon-box menu-icon-indigo w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
                <path d="M4 21h16" />
                <circle cx="15" cy="12" r="1" />
              </svg>
            </div>
            {!proActive && (
              <span className="menu-badge-pro text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap">
                🔒 PRO
              </span>
            )}
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
              Puertas
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Batiente Alumer, 2" y Europea
            </span>
          </div>
        </button>

        {/* 3. CATÁLOGO PERFILES */}
        <button
          type="button"
          id="btn-menu-catalogo"
          onClick={() => onGoToView('catalogo')}
          className="menu-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="menu-icon-box menu-icon-emerald w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h6v16H4z" />
                <path d="M10 10h10v10H10z" />
                <path d="M14 4h6v3h-6z" />
              </svg>
            </div>
            <span className="menu-badge-free mono px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
              {CATALOGO_PERFILES.length} perf.
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
              Catálogo Perfiles
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Secciones Alumer y fotos reales
            </span>
          </div>
        </button>

        {/* 4. MI INVENTARIO */}
        <button
          type="button"
          id="btn-menu-inventario"
          onClick={onEntrarInventario}
          className="menu-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center justify-between gap-1.5 w-full">
            <div className="menu-icon-box menu-icon-amber w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="menu-badge-info mono px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
                {inventarioTramosTotal} tr.
              </span>
              {!proActive && (
                <span className="menu-badge-pro text-[10px] font-extrabold whitespace-nowrap">
                  🔒
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
              Mi Inventario
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Tramos, sobrantes y herrajes
            </span>
          </div>
        </button>

        {/* 5. NOTAS DE OBRA */}
        <button
          type="button"
          id="btn-menu-notas"
          onClick={() => onGoToView('notas')}
          className="menu-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="menu-icon-box menu-icon-teal w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </div>
            <span className="menu-badge-free mono px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
              {notasCount > 0 ? `${notasCount} notas` : 'Gratis'}
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
              Notas de Obra
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Medidas rápidas y fotos en campo
            </span>
          </div>
        </button>

        {/* 6. MODULACIÓN Y CORTES (GRATIS) */}
        <button
          type="button"
          id="btn-menu-modulacion"
          onClick={() => onGoToView('modulacion')}
          className="menu-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="menu-icon-box menu-icon-orange w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 6H3" />
                <path d="M10 12H3" />
                <path d="M10 18H3" />
                <path d="m14 15 3 3 5-5" />
              </svg>
            </div>
            <span className="menu-badge-free px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
              Gratis
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
              Modulación y Cortes
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Asistente 5 pasos y medidas exactas
            </span>
          </div>
        </button>

        {/* 7. MI TALLER Y PRECIOS */}
        <button
          type="button"
          id="btn-menu-taller"
          onClick={() => onGoToView('taller')}
          className="menu-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="menu-icon-box menu-icon-violet w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
              Mi Taller y Precios
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Logo, tarifas m² y fórmulas
            </span>
          </div>
        </button>

        {/* 8. GALERÍA (ANTES Y DESPUÉS) */}
        <button
          type="button"
          id="btn-menu-antes-despues"
          onClick={onOpenAntesDespues}
          className="menu-grid-card flex flex-col justify-between gap-3 w-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="menu-icon-box menu-icon-cyan w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <path d="M6.5 14l2-2 2 2" />
                <path d="M14.5 12l2-2 2 2" />
              </svg>
            </div>
            <span className="menu-badge-cyan px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap">
              Clientes
            </span>
          </div>
          <div>
            <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
              Galería (Antes y Después)
            </span>
            <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
              Portafolio y presentación a clientes
            </span>
          </div>
        </button>

        {/* 9. OPTIMIZADOR DE VIDRIO (2D) */}
        <button
          type="button"
          id="btn-menu-vidrio"
          onClick={() => onGoToView('vidrio')}
          className="menu-grid-card col-span-2 flex items-center justify-between gap-3 w-full min-h-[86px] p-3.5 sm:p-4 rounded-[20px] border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="menu-icon-box menu-icon-cyan w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="11" y1="3" x2="11" y2="21" />
                <line x1="11" y1="12" x2="21" y2="12" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold leading-tight">
                Optimizador de Vidrio (2D)
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-0.5 leading-snug">
                Cortes guillotina, rotación 90°, kerf y % de merma con tus hojas de taller
              </span>
            </div>
          </div>
          <span className="menu-badge-cyan mono px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold whitespace-nowrap shrink-0">
            {hojasVidrioCount > 0 ? `${hojasVidrioCount} hojas` : 'Corte 2D'}
          </span>
        </button>
      </div>
    </section>
  );
};
