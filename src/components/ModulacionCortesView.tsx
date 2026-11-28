import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AjusteDescuentosConfig,
  COLORES_CONFIG,
  ColorId,
  CorteVidrio,
  LineaId,
  OptimizadorConfig,
  PartidaObra,
  PRE_CUT_WARNING_TEXT,
  resolveOptimizadorConfig,
  round2,
} from '../utils/alumineroLogic';
import {
  aggregateModulacionJobs,
  buildPartidaFromModulacion,
  calcularModulacionCortes,
  getPerfilesBaseModulacion,
  MODULACION_MODELOS,
  MODULACION_SECCIONES_META,
  MODULACION_SERIES,
  MODULACION_SUBLINEAS,
  ModulacionCategoria,
  ModulacionModeloId,
  ModulacionMultiJobInput,
  ModulacionSerieId,
  ModulacionSublineaId,
  optimizarTramos1D,
} from '../utils/modulacionLogic';
import { SobranteItem } from '../utils/storageHelpers';
import {
  formatMedidaText,
  formatPiezaSpecs,
  LEV_KEYS,
  LevantamientoDraft,
  LevantamientoPieza,
  normalizeLevantamientoDraft,
  resolveColorAluminioFromLevantamiento,
  resolveLineaFromLevantamiento,
  resolveMosquiteroFromLevantamiento,
} from '../utils/levantamientoLogic';
import { PerfilSectionSvg } from './PerfilSectionSvg';
import { PerfilZoomData, PerfilZoomModal } from './PerfilZoomModal';
import { Tramos610AcomodadosSection } from './Tramos610AcomodadosSection';

interface ModulacionCortesViewProps {
  tarifasBase: Partial<Record<LineaId, number>>;
  proActive: boolean;
  sobrantes: SobranteItem[];
  onAddSobrante: (item: Omit<SobranteItem, 'id' | 'fecha'>) => void;
  onSendToHoja: (partida: PartidaObra, goToHoja: boolean) => boolean | void;
  onSendVidriosToOptimizer?: (vidrios: CorteVidrio[]) => void;
  step?: 1 | 2 | 3 | 4 | 5;
  paso5Tab?: 'cortes' | 'tramos';
  mosquiteroModalOpen?: boolean;
  onNavigateModState?: (patch: {
    step?: 1 | 2 | 3 | 4 | 5;
    paso5Tab?: 'cortes' | 'tramos';
    mosquiteroModalOpen?: boolean;
  }) => void;
  onPushSubModal?: (sub: 'zoomPerfil') => void;
  onRequestBack?: () => void;
  onRegisterCloseSubModal?: (fn: (() => void) | null) => void;
  ajusteDescuentos?: Partial<AjusteDescuentosConfig>;
  optimizadorConfig?: Partial<OptimizadorConfig>;
  catalogVigenciaLabel?: string;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const ModelSvgIllustration: React.FC<{ modeloId: ModulacionModeloId }> = ({ modeloId }) => {
  if (modeloId === 'win-corrediza') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="14" y="10" width="112" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="20" y="16" width="50" height="64" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <rect x="70" y="16" width="50" height="64" fill="#BFDBFE" stroke="#1D4ED8" strokeWidth="1.5" />
        <line x1="70" y1="12" x2="70" y2="84" stroke="#1E3A8A" strokeWidth="1.8" />
        <path d="M36 48h18m-5-4 5 4-5 4" stroke="#1D4ED8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M104 48H86m5-4-5 4 5 4" stroke="#1D4ED8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (modeloId === 'win-proyeccion') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="22" y="10" width="96" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="28" y="16" width="84" height="64" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <polyline points="28,16 70,80 112,16" fill="none" stroke="#1D4ED8" strokeWidth="1.6" strokeDasharray="4 3" />
        <path d="M70 52v18m-5-5 5 5 5-5" stroke="#1D4ED8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (modeloId === 'win-abatible') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="22" y="10" width="96" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="28" y="16" width="84" height="64" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <polyline points="28,16 112,48 28,80" fill="none" stroke="#1D4ED8" strokeWidth="1.6" strokeDasharray="4 3" />
        <rect x="102" y="42" width="4" height="12" rx="1.5" fill="#1E3A8A" />
      </svg>
    );
  }
  if (modeloId === 'win-fija') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="20" y="10" width="100" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="27" y="17" width="86" height="62" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <line x1="40" y1="28" x2="64" y2="52" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
        <line x1="56" y1="28" x2="72" y2="44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <text x="70" y="68" textAnchor="middle" fill="#1E40AF" fontSize="10" fontWeight="800">FIJO</text>
      </svg>
    );
  }
  if (modeloId === 'win-sifon') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="22" y="10" width="96" height="76" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="28" y="16" width="84" height="32" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
        <rect x="28" y="50" width="84" height="30" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
        <line x1="34" y1="25" x2="106" y2="25" stroke="#1D4ED8" strokeWidth="1.6" />
        <line x1="34" y1="34" x2="106" y2="34" stroke="#1D4ED8" strokeWidth="1.6" />
        <line x1="34" y1="43" x2="106" y2="43" stroke="#1D4ED8" strokeWidth="1.6" />
        <polyline points="28,80 70,50 112,80" fill="none" stroke="#1D4ED8" strokeWidth="1.6" strokeDasharray="4 3" />
      </svg>
    );
  }
  if (modeloId === 'win-guillotina') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="24" y="8" width="92" height="80" rx="2" fill="#EFF6FF" stroke="#1E3A8A" strokeWidth="2.4" />
        <rect x="30" y="14" width="80" height="34" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.5" />
        <rect x="30" y="48" width="80" height="34" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.5" />
        <path d="M70 72V56m-4 4 4-4 4 4" stroke="#1E3A8A" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M70 22v16m-4-4 4 4 4-4" stroke="#1E3A8A" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (modeloId === 'door-corrediza') {
    return (
      <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
        <rect x="18" y="6" width="104" height="84" rx="2" fill="#EEF2FF" stroke="#312E81" strokeWidth="2.4" />
        <rect x="24" y="12" width="46" height="74" fill="#E0E7FF" stroke="#4F46E5" strokeWidth="1.5" />
        <rect x="70" y="12" width="46" height="74" fill="#C7D2FE" stroke="#4338CA" strokeWidth="1.5" />
        <path d="M36 49h16m-4-4 4 4-4 4" stroke="#3730A3" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M104 49H88m4-4-4 4 4 4" stroke="#3730A3" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="108" y="42" width="4" height="14" rx="1.5" fill="#312E81" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 140 96" className="w-full h-[88px] block" aria-hidden="true">
      <rect x="40" y="6" width="60" height="84" rx="2" fill="#EEF2FF" stroke="#312E81" strokeWidth="2.4" />
      <rect x="46" y="12" width="48" height="40" fill="#C7D2FE" stroke="#4F46E5" strokeWidth="1.5" />
      <rect x="46" y="56" width="48" height="30" fill="#E0E7FF" stroke="#4338CA" strokeWidth="1.5" />
      <polyline points="46,12 94,48 46,86" fill="none" stroke="#4338CA" strokeWidth="1.6" strokeDasharray="4 3" />
      <circle cx="88" cy="50" r="2.8" fill="#312E81" />
    </svg>
  );
};

const STEP_ITEMS: { num: 1 | 2 | 3 | 4 | 5; short: string; full: string }[] = [
  { num: 1, short: 'Modelo', full: '1. Modelo' },
  { num: 2, short: 'Mosquitero', full: '2. Mosquitero' },
  { num: 3, short: 'Línea/Serie', full: '3. Línea / Serie' },
  { num: 4, short: 'Perfiles', full: '4. Perfiles' },
  { num: 5, short: 'Cortes', full: '5. Cortes y Tramos' },
];

const BAR_SEGMENT_COLORS = [
  '#2563EB',
  '#059669',
  '#7C3AED',
  '#0891B2',
  '#EA580C',
  '#4F46E5',
];

export const ModulacionCortesView: React.FC<ModulacionCortesViewProps> = ({
  tarifasBase,
  proActive,
  sobrantes,
  onAddSobrante,
  onSendToHoja,
  onSendVidriosToOptimizer,
  step: controlledStep,
  paso5Tab: controlledPaso5Tab,
  mosquiteroModalOpen: controlledMosqOpen,
  onNavigateModState,
  onPushSubModal,
  onRequestBack,
  onRegisterCloseSubModal,
  ajusteDescuentos,
  optimizadorConfig,
  catalogVigenciaLabel,
  onShowToast,
}) => {
  const resolvedOptCfg = useMemo(
    () => resolveOptimizadorConfig(optimizadorConfig),
    [optimizadorConfig]
  );
  const [localStep, setLocalStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [categoria, setCategoria] = useState<ModulacionCategoria>('ventanas');
  const [modeloId, setModeloId] = useState<ModulacionModeloId>('win-corrediza');
  const [localMosqOpen, setLocalMosqOpen] = useState(false);

  const [conMosquitero, setConMosquitero] = useState(false);
  const [serieId, setSerieId] = useState<ModulacionSerieId>('linea-3');
  const [sublineaId, setSublineaId] = useState<ModulacionSublineaId>('comercial-hermetica');
  const [colorSeleccionado, setColorSeleccionado] = useState<ColorId>('natural');

  const [unidad, setUnidad] = useState<'cm' | 'm'>('cm');
  const [anchoInput, setAnchoInput] = useState<string>('120');
  const [altoInput, setAltoInput] = useState<string>('100');
      const [clienteAccordionOpen, setClienteAccordionOpen] = useState<boolean>(false);
  const [trabajosAccordionOpen, setTrabajosAccordionOpen] = useState<boolean>(true);
  const [localPaso5Tab, setLocalPaso5Tab] = useState<'cortes' | 'tramos'>('cortes');
  const [cortadosMap, setCortadosMap] = useState<Record<string, number>>({});
  const [discoKerfMm, setDiscoKerfMm] = useState<number>(() => round2(resolvedOptCfg.kerfCm * 10));
  const [umbralSobranteCm, setUmbralSobranteCm] = useState<number>(() => resolvedOptCfg.umbralSobranteUsableCm);
  const [zoomPerfil, setZoomPerfil] = useState<PerfilZoomData | null>(null);
  const [vidrioSeleccionado, setVidrioSeleccionado] = useState<string>('Vidrio claro 6 mm');
  const [activoLev, setActivoLev] = useState<LevantamientoDraft | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      for (const key of [LEV_KEYS.activo, LEV_KEYS.draft]) {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const norm = normalizeLevantamientoDraft(JSON.parse(raw));
        if (norm.piezas.length > 0) return norm;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [activeLevPiezaId, setActiveLevPiezaId] = useState<string | null>(null);
  const autoAppliedLevRef = useRef<string | null>(null);

  const step = controlledStep ?? localStep;
  const paso5Tab = controlledPaso5Tab ?? localPaso5Tab;
  const mosquiteroModalOpen = controlledMosqOpen ?? localMosqOpen;

  const setStep = (next: 1 | 2 | 3 | 4 | 5) => {
    if (next === step) return;
    if (onNavigateModState) onNavigateModState({ step: next, mosquiteroModalOpen: false });
    else {
      setLocalMosqOpen(false);
      setLocalStep(next);
    }
  };

  const setPaso5Tab = (next: 'cortes' | 'tramos') => {
    if (next === paso5Tab) return;
    if (onNavigateModState) onNavigateModState({ paso5Tab: next });
    else setLocalPaso5Tab(next);
  };

  const openMosquiteroModal = () => {
    if (mosquiteroModalOpen) return;
    if (onNavigateModState) onNavigateModState({ mosquiteroModalOpen: true });
    else setLocalMosqOpen(true);
  };

  const openZoomPerfil = (data: PerfilZoomData) => {
    setZoomPerfil(data);
    onPushSubModal?.('zoomPerfil');
  };

  useEffect(() => {
    if (!onRegisterCloseSubModal) return;
    onRegisterCloseSubModal(() => {
      setZoomPerfil(null);
    });
    return () => onRegisterCloseSubModal(null);
  }, [onRegisterCloseSubModal]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step, paso5Tab]);

  useEffect(() => {
    const applyPending = () => {
      const p = window.__alumModPending;
      if (!p) return;
      window.__alumModPending = null;
      setUnidad('cm');
      setAnchoInput(String(p.ancho));
      setAltoInput(String(p.alto));
      if (p.cat === 'ventanas' || p.cat === 'puertas') setCategoria(p.cat);
      if (p.modelo) setModeloId(p.modelo);
      if (p.serieMod) setSerieId(p.serieMod);
      if (typeof p.conMosquitero === 'boolean') setConMosquitero(p.conMosquitero);
      if (p.colorVidrio) {
        const vLow = p.colorVidrio.trim().toLowerCase();
        setVidrioSeleccionado(
          vLow === 'claro' || vLow === 'vidrio claro'
            ? 'Vidrio claro 6 mm'
            : vLow === 'sin vidrio'
              ? 'Sin vidrio'
              : `${p.colorVidrio} 6 mm`
        );
      }
      if (onNavigateModState) {
        onNavigateModState({ step: 5, mosquiteroModalOpen: false, paso5Tab: 'cortes' });
      } else {
        setLocalMosqOpen(false);
        setLocalStep(5);
        setLocalPaso5Tab('cortes');
      }
    };
    applyPending();
    window.addEventListener('alum-mod-apply', applyPending);
    return () => window.removeEventListener('alum-mod-apply', applyPending);
  }, []);

  const [selectedLevIds, setSelectedLevIds] = useState<string[]>(() => {
    if (!activoLev) return [];
    return activoLev.piezas.map((p) => p.id);
  });

  useEffect(() => {
    if (!activoLev) {
      setSelectedLevIds([]);
      return;
    }
    const allIds = activoLev.piezas.map((p) => p.id);
    setSelectedLevIds((prev) => {
      const stillValid = prev.filter((id) => allIds.includes(id));
      if (stillValid.length === 0) return allIds;
      const newOnes = allIds.filter((id) => !prev.includes(id));
      return [...stillValid, ...newOnes];
    });
  }, [activoLev]);

  useEffect(() => {
    const syncActivo = () => {
      try {
        const candidates: LevantamientoDraft[] = [];
        for (const key of [LEV_KEYS.draft, LEV_KEYS.activo]) {
          const raw = window.localStorage.getItem(key);
          if (!raw) continue;
          const norm = normalizeLevantamientoDraft(JSON.parse(raw));
          if (norm.piezas.length > 0) candidates.push(norm);
        }
        if (candidates.length === 0) {
          setActivoLev(null);
          return;
        }
        const best =
          candidates.length === 2 && candidates[1].piezas.length > candidates[0].piezas.length
            ? candidates[1]
            : candidates[0];
        setActivoLev(best);
      } catch {
        setActivoLev(null);
      }
    };
    window.addEventListener('aluminero:lev-activo-updated', syncActivo);
    window.addEventListener('aluminero:lev-draft-updated', syncActivo);
    window.addEventListener('focus', syncActivo);
    return () => {
      window.removeEventListener('aluminero:lev-activo-updated', syncActivo);
      window.removeEventListener('aluminero:lev-draft-updated', syncActivo);
      window.removeEventListener('focus', syncActivo);
    };
  }, []);

  const handleSelectLevPieza = (p: LevantamientoPieza, silent = false) => {
    const resolved = resolveLineaFromLevantamiento(p);
    if (!resolved.modelo || !resolved.cat) {
      if (!silent) onShowToast('Cancel / Otro no está disponible en Modulación.');
      return;
    }
    setActiveLevPiezaId(p.id);
    setUnidad('cm');
    setAnchoInput(String(p.anchoCm));
    setAltoInput(String(p.altoCm));
    setCategoria(resolved.cat);
    setModeloId(resolved.modelo);
    setSerieId(resolved.serieMod);
    setConMosquitero(resolveMosquiteroFromLevantamiento(p.mosquitero));
    setColorSeleccionado(resolveColorAluminioFromLevantamiento(p.colorAluminio));
    const vRaw = String(p.colorVidrio || 'Vidrio claro').trim();
    setVidrioSeleccionado(
      vRaw.toLowerCase() === 'claro' || vRaw.toLowerCase() === 'vidrio claro'
        ? 'Vidrio claro 6 mm'
        : vRaw.toLowerCase() === 'sin vidrio'
          ? 'Sin vidrio'
          : `${vRaw} 6 mm`
    );
    setCortadosMap({});
    if (onNavigateModState) {
      onNavigateModState({ step: 5, mosquiteroModalOpen: false, paso5Tab: 'cortes' });
    } else {
      setLocalMosqOpen(false);
      setLocalStep(5);
      setLocalPaso5Tab('cortes');
    }
    if (!silent) {
      const specs = formatPiezaSpecs(p);
      onShowToast(
        specs
          ? `Cortes calculados: ${p.tipo} (${formatMedidaText(p)}) · ${specs}`
          : `Cortes calculados: ${p.tipo} (${formatMedidaText(p)})`,
        true
      );
    }
  };

  useEffect(() => {
    if (!activoLev || activoLev.piezas.length === 0) return;
    const firstSupported = activoLev.piezas.find((p) => {
      const resolved = resolveLineaFromLevantamiento(p);
      return Boolean(resolved.modelo && resolved.cat);
    });
    if (!firstSupported) return;
    const sig = `${activoLev.id}:${firstSupported.id}:${firstSupported.anchoCm}x${firstSupported.altoCm}`;
    if (autoAppliedLevRef.current === sig) return;
    autoAppliedLevRef.current = sig;
    handleSelectLevPieza(firstSupported, true);
  }, [activoLev]);

  const handleRemoveLevPieza = (id: string) => {
    if (!activoLev) return;
    const nextPiezas = activoLev.piezas.filter((x) => x.id !== id);
    if (nextPiezas.length === 0) {
      try {
        window.localStorage.removeItem(LEV_KEYS.activo);
      } catch {}
      setActivoLev(null);
      setActiveLevPiezaId(null);
      return;
    }
    const nextDraft: LevantamientoDraft = { ...activoLev, piezas: nextPiezas };
    setActivoLev(nextDraft);
    if (activeLevPiezaId === id) setActiveLevPiezaId(null);
    try {
      window.localStorage.setItem(LEV_KEYS.activo, JSON.stringify(nextDraft));
    } catch {}
    onShowToast('Trabajo quitado de la lista de modulación');
  };

  const handleReassignLevPiezaTipo = (id: string, nextTipo: string) => {
    if (!activoLev || !nextTipo) return;
    const nextPiezas = activoLev.piezas.map((item) =>
      item.id === id ? { ...item, tipo: nextTipo } : item
    );
    const nextDraft: LevantamientoDraft = { ...activoLev, piezas: nextPiezas };
    setActivoLev(nextDraft);
    try {
      window.localStorage.setItem(LEV_KEYS.activo, JSON.stringify(nextDraft));
      const rawDraft = window.localStorage.getItem(LEV_KEYS.draft);
      if (rawDraft) {
        const parsedDraft = normalizeLevantamientoDraft(JSON.parse(rawDraft));
        if (parsedDraft.piezas.some((x) => x.id === id)) {
          window.localStorage.setItem(
            LEV_KEYS.draft,
            JSON.stringify({
              ...parsedDraft,
              piezas: parsedDraft.piezas.map((x) => (x.id === id ? { ...x, tipo: nextTipo } : x)),
            })
          );
        }
      }
      window.dispatchEvent(new Event('aluminero:lev-activo-updated'));
    } catch {}
    const updated = nextPiezas.find((x) => x.id === id);
    if (updated) {
      if (!selectedLevIds.includes(id)) setSelectedLevIds((prev) => [...prev, id]);
      const res = resolveLineaFromLevantamiento(updated);
      if (res.modelo && res.cat) handleSelectLevPieza(updated, true);
    }
    onShowToast(`Modelo asignado: ${nextTipo}`, true);
  };

  const handleSendDirectCancelToHoja = (p: LevantamientoPieza) => {
    const ancho = Math.max(15, Number(p.anchoCm) || 100);
    const alto = Math.max(15, Number(p.altoCm) || 190);
    const cant = Math.max(1, Number(p.cant) || 1);

  return (
    <section id="view-modulacion" className="screen-animate pb-28 sm:pb-14">
      {/* Encabezado y barra de pasos */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-[21px] font-extrabold text-white">
              Modulación y Cortes
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-[11px] font-extrabold">
              Gratis
            </span>
          </div>
          <p className="m-0 text-[12.5px] text-slate-300 mt-0.5">
            Asistente técnico en 5 pasos con checklist de taller y optimizador 1D de tramos (6.10 m)
          </p>
        </div>
      </div>

      {/* Lista activa de Levantamiento Rápido con Acordiones */}
      {activoLev && activoLev.piezas.length > 0 && (
        <div id="mod-lev-activo-panel" className="mb-4 flex flex-col gap-3">
          {/* Acordeón 1: Datos del cliente */}
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] shadow-md overflow-hidden">
            <button
              type="button"
              onClick={() => setClienteAccordionOpen((prev) => !prev)}
              className="w-full p-3.5 sm:p-4 bg-transparent border-0 text-left cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                  👤 Datos del cliente (Levantamiento activo)
                </div>
                <div className="text-[14.5px] font-extrabold text-slate-900 mt-0.5 truncate">
                  {activoLev.cliente || 'Cliente General'}
                  {!clienteAccordionOpen && activoLev.telefono ? ` · Tel: ${activoLev.telefono}` : ''}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-extrabold shrink-0">
                {clienteAccordionOpen ? '▲ Ocultar' : '▼ Ver datos'}
              </span>
            </button>
            {clienteAccordionOpen && (
              <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <div className="text-[12px] text-slate-600">
                  {[
                    activoLev.telefono ? `Tel: ${activoLev.telefono}` : '',
                    activoLev.direccion || '',
                    activoLev.fecha ? `Fecha: ${activoLev.fecha}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Sin datos adicionales registrados.'}
                </div>
                <button
                  type="button"
                  id="btn-mod-limpiar-lev"
                  onClick={handleClearActivoLev}
                  className="min-h-[34px] px-3 py-1 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11.5px] font-bold cursor-pointer"
                >
                  🧹 Limpiar lista
                </button>
              </div>
            )}
          </div>

          {/* Acordeón 2: Trabajos a modular */}
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] shadow-md overflow-hidden">
            <button
              type="button"
              onClick={() => setTrabajosAccordionOpen((prev) => !prev)}
              className="w-full p-3.5 sm:p-4 bg-transparent border-0 text-left cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <h2 className="m-0 text-[14.5px] font-extrabold text-slate-900">
                  🪟 Trabajos a modular / Lista de cortes ({activoLev.piezas.length})
                </h2>
                <p className="m-0 text-[11.5px] text-slate-500 mt-0.5 truncate">
                  {selectedLevIds.length} de {allLevPiezas.length} seleccionado(s) · Toca para {trabajosAccordionOpen ? 'contraer' : 'desplegar'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold shrink-0">
                {trabajosAccordionOpen ? '▲ Contraer' : '▼ Desplegar'}
              </span>
            </button>

            {trabajosAccordionOpen && (
              <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <label
                    htmlFor="chk-mod-select-all"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 text-blue-900 text-[12px] font-extrabold cursor-pointer select-none"
                  >
                    <input
                      id="chk-mod-select-all"
                      type="checkbox"
                      checked={allLevSelected}
                      onChange={toggleSelectAllLev}
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                    <span>Seleccionar todos ({selectedLevIds.length}/{allLevPiezas.length})</span>
                  </label>
                  {onSendVidriosToOptimizer && (
                    <button
                      type="button"
                      id="btn-mod-send-selected-vidrio"
                      disabled={effectiveVidrios.length === 0}
                      onClick={() => {
                        if (effectiveVidrios.length === 0) {
                          onShowToast('Selecciona al menos un trabajo con vidrio para optimizar en 2D');
                          return;
                        }
                        onSendVidriosToOptimizer(effectiveVidrios);
                      }}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-[12px] font-extrabold cursor-pointer shadow-sm"
                    >
                      ✂️ Enviar a Vidrio 2D ({effectiveVidrios.length})
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="sel-mod-vidrio" className="text-[11px] font-bold text-slate-600">
                      Vidrio:
                    </label>
                    <select
                      id="sel-mod-vidrio"
                      value={vidrioSeleccionado}
                      onChange={(e) => setVidrioSeleccionado(e.target.value)}
                      className="min-h-[32px] rounded-lg border border-slate-300 bg-white px-2 text-[11.5px] font-bold text-slate-800"
                    >
                      <option value="Vidrio claro 6 mm">Vidrio claro 6 mm</option>
                      <option value="Vidrio claro 4 mm">Vidrio claro 4 mm</option>
                      <option value="Filtrasol 6 mm">Filtrasol 6 mm</option>
                      <option value="Tintex 6 mm">Tintex 6 mm</option>
                      <option value="Esmerilado 6 mm">Esmerilado 6 mm</option>
                      <option value="Reflecta 6 mm">Reflecta 6 mm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activoLev.piezas.map((p, idx) => {
                    const resolved = resolveLineaFromLevantamiento(p);
                    const supported = Boolean(resolved.modelo && resolved.cat);
                    const isChecked = selectedLevIds.includes(p.id);
                    const isActivePreview = activeLevPiezaId === p.id;
                    return (
                      <div
                        key={p.id}
                        id={`mod-job-card-${p.id}`}
                        data-selected={isChecked ? 'true' : 'false'}
                        className={`rounded-2xl border p-3 flex flex-col gap-2 transition-all ${
                          isChecked
                            ? supported
                              ? 'border-2 border-blue-600 bg-blue-50/90 shadow-md ring-1 ring-blue-400/40'
                              : 'border-2 border-amber-500 bg-amber-50/85 shadow-md ring-1 ring-amber-400/35'
                            : 'border-slate-300 bg-slate-50 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              aria-label={`Seleccionar trabajo ${idx + 1}: ${p.tipo}`}
                              checked={isChecked}
                              onChange={() => toggleSelectOneLev(p.id)}
                              className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer shrink-0"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (supported) {
                                  handleSelectLevPieza(p);
                                } else {
                                  onShowToast('Puedes asignar un modelo o enviar este trabajo directo a Vidrio 2D / Cotización.');
                                }
                                if (!selectedLevIds.includes(p.id)) {
                                  toggleSelectOneLev(p.id);
                                }
                              }}
      {/* ==================== PASO 5: CORTES AGRUPADOS + CHECKLIST + OPTIMIZADOR 1D ==================== */}
      {step === 5 && (
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[20px] p-4 sm:p-5 shadow-xl flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold">
                Paso 5: Medidas, Checklist de Corte y Tramos (6.10 m)
              </h2>
              <p className="m-0 text-[12.5px] text-slate-600 mt-0.5">
                Marca las piezas conforme las cortas en taller y optimiza tramos aprovechando sobrantes del mismo color ({COLORES_CONFIG[colorSeleccionado]?.nombre || colorSeleccionado})
              </p>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-300 shrink-0">
              <button
                type="button"
                id="btn-mod-unit-cm"
                onClick={() => handleToggleUnidad('cm')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold cursor-pointer transition-colors ${
                  unidad === 'cm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                }`}
              >
                cm
              </button>
              <button
                type="button"
                id="btn-mod-unit-m"
                onClick={() => handleToggleUnidad('m')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold cursor-pointer transition-colors ${
                  unidad === 'm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                }`}
              >
                metros (m)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-300">
            <div>
              <label htmlFor="inp-mod-ancho" className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Ancho del vano ({unidad})
              </label>
              <input
                id="inp-mod-ancho"
                type="number"
                step={unidad === 'm' ? '0.01' : '0.5'}
                min={unidad === 'm' ? 0.2 : 20}
                value={anchoInput}
                onChange={(e) => {
                  setAnchoInput(e.target.value);
                  setCortadosMap({});
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 mono text-[16px] font-extrabold bg-white"
              />
              <span className="block text-[11px] text-slate-500 mono mt-1">
                Equivalente: {calculoCortes.anchoCm} cm ({round2(calculoCortes.anchoCm / 100)} m)
              </span>
            </div>

            <div>
              <label htmlFor="inp-mod-alto" className="block text-[12px] font-extrabold text-slate-700 mb-1">
                Alto del vano ({unidad})
              </label>
              <input
                id="inp-mod-alto"
                type="number"
                step={unidad === 'm' ? '0.01' : '0.5'}
                min={unidad === 'm' ? 0.2 : 20}
                value={altoInput}
                onChange={(e) => {
                  setAltoInput(e.target.value);
                  setCortadosMap({});
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 mono text-[16px] font-extrabold bg-white"
              />
              <span className="block text-[11px] text-slate-500 mono mt-1">
                Equivalente: {calculoCortes.altoCm} cm ({round2(calculoCortes.altoCm / 100)} m)
              </span>
            </div>
          </div>

          {/* Pestañas Paso 5 */}
          <div className="inv-segmented-tabs grid grid-cols-2 gap-1.5 p-1.5 rounded-[14px] bg-[#13315C] border border-slate-400/30">
            <button
              type="button"
              id="btn-mod-tab-cortes"
              onClick={() => setPaso5Tab('cortes')}
              className={`min-h-[42px] rounded-[10px] text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer transition-colors ${
                paso5Tab === 'cortes'
                  ? 'bg-white text-[#1E293B] shadow'
                  : 'bg-transparent text-slate-300'
              }`}
            >
              Checklist de Cortes ({totalPiezasCortadas}/{totalPiezasRequeridas})
            </button>
            <button
              type="button"
              id="btn-mod-tab-tramos"
              onClick={() => setPaso5Tab('tramos')}
              className={`min-h-[42px] rounded-[10px] text-[12.5px] sm:text-[13px] font-extrabold cursor-pointer transition-colors ${
                paso5Tab === 'tramos'
                  ? 'bg-white text-[#1E293B] shadow'
                  : 'bg-transparent text-slate-300'
              }`}
            >
              Optimización de Tramos (6.10 m)
            </button>
          </div>

          {/* SUB-PESTAÑA A: CHECKLIST DE CORTE POR SECCIÓN */}
          {paso5Tab === 'cortes' && (
            <div className="flex flex-col gap-3.5">
              {(() => {
                const globalPct =
                  totalPiezasRequeridas > 0
                    ? Math.round((totalPiezasCortadas / totalPiezasRequeridas) * 100)
                    : 0;
                const allDone =
                  totalPiezasRequeridas > 0 && totalPiezasCortadas >= totalPiezasRequeridas;
                return (
                  <div
                    id="mod-cut-summary-card"
                    className={`p-3.5 rounded-2xl border-2 transition-colors ${
                      allDone
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                          Avance de corte en taller
                        </span>
                        <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
                          <strong className="mono text-[20px] font-black text-blue-700 leading-none">
                            {totalPiezasCortadas}/{totalPiezasRequeridas}
                          </strong>
                          <span className="text-[13.5px] font-extrabold text-slate-800">
                            Total perfiles
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`mono px-2.5 py-1 rounded-lg text-[12px] font-extrabold ${
                            allDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-50 border border-blue-200 text-blue-800'
                          }`}
                        >
                          {allDone ? '✓ 100%' : `${globalPct}%`}
                        </span>
                        {totalPiezasCortadas > 0 && (
                          <button
                            type="button"
                            onClick={() => setCortadosMap({})}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-[11.5px] font-bold text-slate-600 cursor-pointer transition-colors"
                          >
                            Reiniciar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-emerald-500"
                        style={{ width: `${globalPct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              <div
                id="mod-precut-warning"
                className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11.5px] font-semibold leading-snug"
              >
                {PRE_CUT_WARNING_TEXT}
              </div>

              {seccionesConFilas.map((sec) => {
                const secReq = sec.rows.reduce((a, r) => a + r.cantidad, 0);
                const secDone = sec.rows.reduce(
                  (a, r) => a + getCutCount(r.id, r.cantidad),
                  0
                );
                return (
                  <div key={sec.id} className="rounded-2xl border-[1.5px] border-slate-300 overflow-hidden">
                    <div className="bg-[#0B2545] text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <strong className="block text-[13.5px] font-extrabold tracking-wide">
                          {sec.titulo}
                        </strong>
                        <span className="block text-[11px] text-slate-300">{sec.subtitulo}</span>
                      </div>
                      <span
                        className={`mono px-2.5 py-1 rounded-lg text-[11.5px] font-extrabold ${
                          secDone >= secReq
                            ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200'
                            : 'bg-white/10 border border-white/20 text-white'
                        }`}
                      >
                        {secDone}/{secReq} pzas
                      </span>
                    </div>


