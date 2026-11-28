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
  const [colorPerfil, setColorPerfil] = useState<ColorId>('natural');

  // Acordiones colapsables para mayor eficiencia visual
  const [accClienteOpen, setAccClienteOpen] = useState(false);
  const [accTrabajosOpen, setAccTrabajosOpen] = useState(true);
  const [accSecCollapsed, setAccSecCollapsed] = useState<Record<string, boolean>>({});

  const [unidad, setUnidad] = useState<'cm' | 'm'>('cm');
