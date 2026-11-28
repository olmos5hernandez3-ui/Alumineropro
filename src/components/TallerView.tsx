import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Download,
  FileDown,
  Lock,
  Moon,
  Palette,
  Pencil,
  RotateCcw,
  Sparkles,
  Sun,
  TrendingUp,
  Undo2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import {
  AjusteDescuentosConfig,
  COLORES_CONFIG,
  computeSalesAnalytics,
  DEFAULT_AJUSTE_DESCUENTOS,
  DEFAULT_OPTIMIZADOR_CONFIG,
  DEFAULT_REFERENCE_PRICES,
  LINEAS_CONFIG,
  LineaId,
  OptimizadorConfig,
  PANEL_RELLENO_CATALOGO,
  ReferencePriceItem,
  ReferencePricesDoc,
  resolveAjusteDescuentos,
  resolveOptimizadorConfig,
} from '../utils/alumineroLogic';
import { generarPdfHistorialCotizaciones } from '../utils/pdfExport';
import {
  AlumineroBackupPayload,
  AppSkin,
  AppSkinVariant,
  CotizacionGuardada,
  formatMXN,
  FormulaPersonalizada,
  HistorialItem,
  loadCotizacionesGuardadas,
  normalizeSkinVariantForSkin,
  parseBackupPayload,
  ResolvedAppTheme,
  SKIN_VARIANTS_BY_SKIN,
  TallerConfig,
} from '../utils/storageHelpers';
import {
  ACABADOS_AJUSTE_OPTIONS,
  AcabadoFiltroId,
  applyOneShotPriceAdjustment,
  buildBulkAdjustmentConfirmMessage,
  BulkAdjustmentUndoSnapshot,
  BulkCategoryId,
  formatSignedPct,
  getAcabadoCurrentPrice,
  restoreUndoSnapshot,
  SPECIFIC_ACABADO_IDS,
} from '../utils/tallerTools';
import { CollapsibleAccordion } from './CollapsibleAccordion';
import { PdfHeaderCustomizer } from './PdfHeaderCustomizer';
import { PublicidadTallerCard } from './PublicidadTallerCard';

interface Props {
  taller: TallerConfig;
  proActive: boolean;
  formulas: FormulaPersonalizada[];
  historial: HistorialItem[];
  backupData?: AlumineroBackupPayload;
  onImportBackup?: (payload: AlumineroBackupPayload) => void;
  onUpdateTaller: (patch: Partial<TallerConfig>) => void;
  onRestablecerTarifas: () => void;
  onOpenPro: () => void;
  onEntrarInventario: () => void;
  onOpenFormulaModal: () => void;
  onEditarFormula?: (formula: FormulaPersonalizada) => void;
  onEliminarFormula: (id: string) => void;
  onEliminarHistorial: (id: string) => void;
  onLimpiarHistorial: () => void;
  onScheduleHistorialReminder?: (item: HistorialItem) => void;
  onOpenReminders?: () => void;
  pendingRemindersCount?: number;
  skin?: AppSkin;
  skinVariant?: AppSkinVariant;
  unlockedSkins?: AppSkin[];
  onSelectSkin?: (skin: AppSkin) => void;
  onSelectSkinVariant?: (variant: AppSkinVariant) => void;
  colorMode?: ResolvedAppTheme;
  onToggleColorMode?: () => void;
  referencePrices?: ReferencePricesDoc | null;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const AJUSTE_FIELDS: Array<{
  group: string;
  key: keyof AjusteDescuentosConfig;
  label: string;
  hint: string;
}> = [
  { group: 'Línea 2" Tradicional', key: 'l2JambaAlto', label: 'Jambas / Alto', hint: 'Alto - X (1.6)' },
  { group: 'Línea 2" Tradicional', key: 'l2HojaFijaAlto', label: 'Hoja Fija / Alto', hint: 'Alto - X (2.8)' },
  { group: 'Línea 2" Tradicional', key: 'l2HojaCorredizaAlto', label: 'Hoja Corrediza / Alto', hint: 'Alto - X (3.8)' },
  { group: 'Línea 2" Tradicional', key: 'l2Zoclo2HojasAncho', label: 'Zoclo/Cabezal 2H / Ancho', hint: '(Ancho - X)/2 (16.0)' },
  { group: 'Línea 2" Tradicional', key: 'l2Zoclo3HojasAncho', label: 'Zoclo/Cabezal 3H / Ancho', hint: '(Ancho - X)/3 (21.0)' },
  { group: 'Línea Nacional 3"', key: 'l3JambaAlto', label: 'Jambas / Alto', hint: 'Alto - X (2.6)' },
  { group: 'Línea Nacional 3"', key: 'l3RielAdicionalAncho', label: 'Riel adicional / Ancho', hint: 'Ancho - X (2.8)' },
  { group: 'Línea Nacional 3"', key: 'l3HojaFijaAlto', label: 'Hoja Fija / Alto', hint: 'Alto - X (2.7)' },
  { group: 'Línea Nacional 3"', key: 'l3HojaCorredizaAlto', label: 'Hoja Corrediza / Alto', hint: 'Alto - X (3.7)' },
  { group: 'Línea Nacional 3"', key: 'l3Zoclo2HojasAncho', label: 'Zoclo 2H / Ancho', hint: '(Ancho - X)/2 (18.0)' },
  { group: 'Línea Nacional 3"', key: 'l3Zoclo3HojasAncho', label: 'Zoclo 3H / Ancho', hint: '(Ancho - X)/3 (24.0)' },
  { group: 'Cancel Baño y Puertas', key: 'cancelBanoJambaAlto', label: 'Cancel Baño Jamba / Alto', hint: 'Alto - X (4.0)' },
  { group: 'Cancel Baño y Puertas', key: 'puertaJambaAlto', label: 'Puerta Jamba / Alto', hint: 'Alto - X (2.6)' },
  { group: 'Cancel Baño y Puertas', key: 'puertaLargueroAlto', label: 'Puerta Larguero / Alto', hint: 'Alto - X (4.0)' },
  { group: 'Cancel Baño y Puertas', key: 'puerta1HojaHorizAncho', label: 'Puerta 1 Hoja Horiz.', hint: 'Ancho - X (18.0)' },
  { group: 'Cancel Baño y Puertas', key: 'puerta2HojasHorizAncho', label: 'Puerta 2 Hojas Horiz.', hint: '(Ancho - X)/2 (33.5)' },
  { group: 'Cancel Baño y Puertas', key: 'duelaAnchoUtilCm', label: 'Duela ancho útil (cm)', hint: '10.0 o 12.7 cm' },
];

export const TallerView: React.FC<Props> = ({
  taller,
  proActive,
  formulas,
  historial,
  backupData,
  onImportBackup,
  onUpdateTaller,
  onRestablecerTarifas,
  onOpenPro,
  onEntrarInventario,
  onOpenFormulaModal,
  onEditarFormula,
  onEliminarFormula,
  onEliminarHistorial,
  onLimpiarHistorial,
  onScheduleHistorialReminder,
  onOpenReminders,
  pendingRemindersCount = 0,
  skin = 'basica',
  skinVariant = 'default',
  unlockedSkins = ['basica', 'navidena'],
  onSelectSkin,
  onSelectSkinVariant,
  colorMode = 'dark',
  onToggleColorMode,
  referencePrices,
  onShowToast,
}) => {
  const importBackupRef = useRef<HTMLInputElement | null>(null);
  const [cotizacionesList, setCotizacionesList] = useState<CotizacionGuardada[]>(() =>
    loadCotizacionesGuardadas()
  );
  const [refPricesOpen, setRefPricesOpen] = useState(false);
  const [bulkCat, setBulkCat] = useState<BulkCategoryId>('aluminio');
  const [bulkAcabado, setBulkAcabado] = useState<AcabadoFiltroId>('todos');
  const [bulkPct, setBulkPct] = useState<string>('10');
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [lastBulkUndo, setLastBulkUndo] = useState<BulkAdjustmentUndoSnapshot | null>(null);
  const [metricasOpen, setMetricasOpen] = useState(true);
  const [identidadOpen, setIdentidadOpen] = useState(true);
  const [tarifasOpen, setTarifasOpen] = useState(true);
  const [descuentosOpen, setDescuentosOpen] = useState(false);
  const [formulasOpen, setFormulasOpen] = useState(true);
  const [historialOpen, setHistorialOpen] = useState(true);
  const [respaldoOpen, setRespaldoOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setCotizacionesList(loadCotizacionesGuardadas());
    window.addEventListener('aluminero:cotizaciones-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('aluminero:cotizaciones-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const salesAnalytics = useMemo(
    () =>
      computeSalesAnalytics({
        cotizacionesGuardadas: cotizacionesList,
        obrasAprobadas: backupData?.obrasAprobadas || [],
        historial,
      }),
    [cotizacionesList, backupData?.obrasAprobadas, historial]
  );

  const maxConsumo = Math.max(1, ...salesAnalytics.topMaterials.map((m) => m.cantidad));

  const activeRefPrices: ReferencePricesDoc = useMemo(() => {
    if (referencePrices && Array.isArray(referencePrices.items) && referencePrices.items.length > 0) {
      return referencePrices;
    }
    return DEFAULT_REFERENCE_PRICES;
  }, [referencePrices]);

  const ajusteResolved = useMemo(
    () => resolveAjusteDescuentos(taller.ajusteDescuentos),
    [taller.ajusteDescuentos]
  );

  const optResolved = useMemo(
    () => resolveOptimizadorConfig(taller.optimizador),
    [taller.optimizador]
  );

  const ejecutivaUnlocked = unlockedSkins.includes('ejecutiva');
  const industrialUnlocked = unlockedSkins.includes('industrial');
  const isDark = colorMode === 'dark';
  const accordionTone = isDark ? 'dark' : 'light';

  const getCurrentPriceForRefItem = (item: ReferencePriceItem): number => {
    if (item.id === 'ref-alu-tramo') return taller.precioListaTramo;
    if (item.lineaId) {
      return taller.tarifasBase[item.lineaId] ?? LINEAS_CONFIG[item.lineaId]?.tarifaBaseDefault ?? 0;
    }
    if (item.rellenoKey) {
      const custom = taller.rellenoPreciosM2?.[item.rellenoKey];
      if (typeof custom === 'number') return custom;
      const [matId, espStr] = item.rellenoKey.split('__');
      const esp = Number(espStr);
      const found = PANEL_RELLENO_CATALOGO.find((m) => m.id === matId);
      return found?.espesorPreciosM2?.[esp] ?? found?.precioBaseM2 ?? item.precioSugerido;
    }
    if (item.categoria === 'herrajes') {
      const custom = taller.herrajesPrecios?.[item.id];
      return typeof custom === 'number' ? custom : item.precioSugerido;
    }
    return item.precioSugerido;
  };

  const handleApplyAllRefPrices = () => {
    let nextTramo = taller.precioListaTramo;
    const nextTarifas: Partial<Record<LineaId, number>> = { ...taller.tarifasBase };
    const nextRellenos: Record<string, number> = { ...(taller.rellenoPreciosM2 || {}) };
    const nextHerrajes: Record<string, number> = { ...(taller.herrajesPrecios || {}) };

    for (const item of activeRefPrices.items) {
      if (item.id === 'ref-alu-tramo') {
        nextTramo = Math.max(100, Math.round(item.precioSugerido));
      } else if (item.lineaId) {
        nextTarifas[item.lineaId] = Math.max(50, Math.round(item.precioSugerido));
      } else if (item.rellenoKey) {
        nextRellenos[item.rellenoKey] = Math.max(50, Math.round(item.precioSugerido));
      } else if (item.categoria === 'herrajes') {
        nextHerrajes[item.id] = Math.max(5, Math.round(item.precioSugerido));
      }
    }

    onUpdateTaller({
      precioListaTramo: nextTramo,
      tarifasBase: nextTarifas,
      rellenoPreciosM2: nextRellenos,
      herrajesPrecios: nextHerrajes,
    });
    setRefPricesOpen(false);
    onShowToast('Precios de referencia aplicados a Mi Taller', true);
  };

  const bulkPctNum = Number(bulkPct);
  const bulkPctValid = Number.isFinite(bulkPctNum) && bulkPctNum !== 0;

  const handleRequestBulkAdjustment = () => {
    if (!bulkPctValid) {
      onShowToast('Ingresa un porcentaje distinto de 0 (ej. +5, +10 o -5)');
      return;
    }
    setBulkConfirmOpen(true);
  };

  const handleConfirmBulkAdjustment = () => {
    if (!bulkPctValid) {
      setBulkConfirmOpen(false);
      return;
    }
    const res = applyOneShotPriceAdjustment({
      pct: bulkPctNum,
      acabadoFilter: bulkAcabado,
      category: bulkCat,
      tallerSnapshot: {
        precioListaTramo: taller.precioListaTramo,
        tarifasBase: taller.tarifasBase,
        rellenoPreciosM2: taller.rellenoPreciosM2,
        herrajesPrecios: taller.herrajesPrecios,
        preciosPorAcabado: taller.preciosPorAcabado,
      },
    });
    onUpdateTaller(res.nextPatch);
    setLastBulkUndo(res.undoSnapshot);
    setBulkConfirmOpen(false);
    onShowToast(
      `Ajuste ${res.formattedPct} aplicado en ${res.scopeLabel} (${res.updatedCount} ${res.updatedCount === 1 ? 'tarifa actualizada' : 'tarifas actualizadas'})`,
      true
    );
  };

  const handleUndoLastBulkAdjustment = () => {
    if (!lastBulkUndo) return;
    onUpdateTaller(restoreUndoSnapshot(lastBulkUndo));
    const revertedLabel = `${formatSignedPct(lastBulkUndo.appliedPct)} · ${lastBulkUndo.scopeLabel}`;
    setLastBulkUndo(null);
    setBulkConfirmOpen(false);
    onShowToast(`Último ajuste (${revertedLabel}) deshecho correctamente`, true);
  };

  const handleUpdateAjusteField = (key: keyof AjusteDescuentosConfig, raw: string) => {
    const num = Math.max(0, Number(raw) || 0);
    onUpdateTaller({
      ajusteDescuentos: {
        ...ajusteResolved,
        [key]: num,
      },
    });
  };

  const handleUpdateOptField = (key: keyof OptimizadorConfig, raw: string) => {
    const num = Math.max(0, Number(raw) || 0);
    onUpdateTaller({
      optimizador: {
        ...optResolved,
        [key]: num,
      },
    });
  };

  const handleExportTallerJson = () => {
    if (!backupData) return;
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aluminero-respaldo-taller-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    onShowToast('Respaldo JSON del taller exportado', true);
  };

  const handleImportTallerJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onImportBackup) return;
    try {
      const text = await file.text();
      const parsed = parseBackupPayload(text);
      if (!parsed) {
        onShowToast('Archivo de respaldo JSON inválido.');
        return;
      }
      onImportBackup(parsed);
      onShowToast('Respaldo JSON restaurado correctamente', true);
    } catch {
      onShowToast('No se pudo leer el archivo JSON.');
    }
  };

  const subCardCls = isDark
    ? 'bg-[#0f172a] text-slate-100 border border-slate-700/80 rounded-xl'
    : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-xl';
  const inputCls = isDark
    ? 'rounded-xl border border-slate-700 bg-[#161e31] text-slate-100'
    : 'rounded-xl border border-slate-300 bg-white text-slate-900';

  return (
    <section id="view-taller" className="screen-animate pb-28 sm:pb-14">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="m-0 text-[21px] font-extrabold text-slate-900 dark:text-white">
            Mi Taller y Precios
          </h1>
          <p className="m-0 text-[12.5px] text-slate-600 dark:text-slate-300">
            Personaliza el encabezado de tus PDF, tarifas, métricas, apariencia y fórmulas de corte
          </p>
        </div>
      </div>

      {(onSelectSkin || onToggleColorMode) && (
        <div
          id="card-taller-apariencia"
          className={`border-[1.5px] rounded-[18px] p-4 sm:p-5 shadow-xl mb-4 ${
            isDark
              ? 'bg-[#121a2e] text-slate-100 border-[#263554]'
              : 'bg-white text-[#1E293B] border-slate-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-sky-500 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="m-0 text-[16px] font-extrabold">Apariencia y Carátula</h2>
                <p className={`m-0 text-[12px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Elige entre Básica, Navideña, Ejecutiva (PRO) o Industrial PRO y Modo Claro / Oscuro
                </p>
              </div>
            </div>
            {onToggleColorMode && (
              <button
                type="button"
                id="btn-taller-color-mode"
                onClick={onToggleColorMode}
                className={`min-h-[38px] px-3 rounded-xl border text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'border-slate-700 bg-[#1a243b] hover:bg-[#23304d] text-slate-100'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                    <span>Modo Oscuro</span>
                  </>
                )}
              </button>
            )}
          </div>

          {onSelectSkin && (
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  id="btn-taller-skin-basica"
                  onClick={() => onSelectSkin('basica')}
                  aria-pressed={skin === 'basica'}
                  className={`min-h-[54px] px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    skin === 'basica'
                      ? isDark
                        ? 'border-sky-400 bg-sky-500/20 text-sky-100 ring-1 ring-sky-400'
                        : 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                      : isDark
                        ? 'border-slate-700 bg-[#0f172a] hover:bg-[#1a243b] text-slate-200'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-extrabold">Básica</span>
                    <span className={`block text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Gratis y PRO · Limpia
                    </span>
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  id="btn-taller-skin-navidena"
                  onClick={() => onSelectSkin('navidena')}
                  aria-pressed={skin === 'navidena'}
                  className={`min-h-[54px] px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    skin === 'navidena'
                      ? isDark
                        ? 'border-rose-400 bg-rose-500/20 text-rose-100 ring-1 ring-rose-400'
                        : 'border-red-600 bg-red-50 text-red-950 ring-1 ring-red-500'
                      : isDark
                        ? 'border-slate-700 bg-[#0f172a] hover:bg-[#1a243b] text-slate-200'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-extrabold">Navideña ❄️</span>
                    <span className={`block text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Gratis y PRO · Invierno
                    </span>
                  </div>
                  <span
                    className="w-3.5 h-3.5 rounded-full bg-red-600 ring-2 ring-amber-400 shrink-0"
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  id="btn-taller-skin-ejecutiva"
                  onClick={() => {
                    if (!ejecutivaUnlocked) {
                      onOpenPro();
                      return;
                    }
                    onSelectSkin('ejecutiva');
                  }}
                  aria-pressed={skin === 'ejecutiva'}
                  className={`min-h-[54px] px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    skin === 'ejecutiva'
                      ? isDark
                        ? 'border-sky-400 bg-sky-500/20 text-sky-100 ring-1 ring-sky-400'
                        : 'border-sky-600 bg-sky-50 text-sky-950 ring-1 ring-sky-500'
                      : isDark
                        ? 'border-slate-700 bg-[#0f172a] hover:bg-[#1a243b] text-slate-200'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-extrabold">
                      Ejecutiva {!ejecutivaUnlocked && '🔒'}
                    </span>
                    <span className={`block text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {ejecutivaUnlocked ? '4 acabados · Negro Anodizado' : 'Planes PRO (30d/90d/1A)'}
                    </span>
                  </div>
                  {ejecutivaUnlocked ? (
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: '#3b6ef5' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  id="btn-taller-skin-industrial"
                  onClick={() => {
                    if (!industrialUnlocked) {
                      onOpenPro();
                      return;
                    }
                    onSelectSkin('industrial');
                  }}
                  aria-pressed={skin === 'industrial'}
                  className={`min-h-[54px] px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    skin === 'industrial'
                      ? isDark
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400'
                        : 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                      : isDark
                        ? 'border-slate-700 bg-[#0f172a] hover:bg-[#1a243b] text-slate-200'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-extrabold">
                      Industrial PRO {!industrialUnlocked && '🔒'}
                    </span>
                    <span className={`block text-[10.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {industrialUnlocked ? '6 acabados · Champagne / Tintex' : 'Planes PRO (30d/90d/1A)'}
                    </span>
                  </div>
                  {industrialUnlocked ? (
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: '#3d8b5e' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </div>

              {onSelectSkinVariant && SKIN_VARIANTS_BY_SKIN[skin]?.length > 0 && (
                <div
                  className={`pt-2 border-t flex flex-wrap items-center gap-2 ${
                    isDark ? 'border-slate-700/80' : 'border-slate-200'
                  }`}
                >
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Acabado:
                  </span>
                  {SKIN_VARIANTS_BY_SKIN[skin].map((variant) => {
                    const activeVar = normalizeSkinVariantForSkin(skin, skinVariant) === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => onSelectSkinVariant(variant.id)}
                        aria-pressed={activeVar}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11.5px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                          activeVar
                            ? isDark
                              ? 'border-sky-400 bg-sky-500/20 text-sky-100 ring-1 ring-sky-400'
                              : 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                            : isDark
                              ? 'border-slate-700 bg-[#0f172a] hover:bg-[#1a243b] text-slate-300'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-400/60 shrink-0"
                          style={{ backgroundColor: variant.swatchBg }}
                          aria-hidden="true"
                        />
                        <span>{variant.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 1. Métricas de Ventas y Materiales */}
      <CollapsibleAccordion
        id="acc-taller-metricas"
        title="📊 Métricas de Ventas y Materiales"
        summary="Ticket promedio, tasa de aprobación y perfiles más consumidos en tu taller"
        open={metricasOpen}
        onToggle={() => setMetricasOpen((v) => !v)}
        tone={accordionTone}
        className="mb-4 shadow-xl"
        rightAction={
          <span
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold mono ${
              isDark
                ? 'bg-sky-500/15 border-sky-400/40 text-sky-200'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {salesAnalytics.totalQuotesCount} cotización(es)
          </span>
        }
      >
        <div id="card-taller-metricas">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
            <div className={`p-3 ${subCardCls}`}>
              <span
                className={`block text-[11px] font-bold uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Ticket Promedio
              </span>
              <strong
                className={`block text-[17px] font-extrabold mono mt-0.5 ${
                  isDark ? 'text-sky-400' : 'text-blue-700'
                }`}
              >
                {formatMXN(salesAnalytics.averageTicket)}
              </strong>
            </div>

            <div className={`p-3 ${subCardCls}`}>
              <span
                className={`block text-[11px] font-bold uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Total Aprobado
              </span>
              <strong
                className={`block text-[17px] font-extrabold mono mt-0.5 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                {formatMXN(salesAnalytics.totalApprovedRevenue)}
              </strong>
            </div>

            <div className={`p-3 ${subCardCls}`}>
              <span
                className={`block text-[11px] font-bold uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Aprobación
              </span>
              <strong
                className={`block text-[17px] font-extrabold mono mt-0.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {salesAnalytics.approvalRatePct.toFixed(0)}%
              </strong>
            </div>

            <div className={`p-3 ${subCardCls}`}>
              <span
                className={`block text-[11px] font-bold uppercase ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Obras Aprobadas
              </span>
              <strong
                className={`block text-[17px] font-extrabold mono mt-0.5 ${
                  isDark ? 'text-indigo-300' : 'text-indigo-700'
                }`}
              >
                {salesAnalytics.approvedCount}
              </strong>
            </div>
          </div>

          <div>
            <div
              className={`flex items-center gap-1.5 text-[12px] font-extrabold mb-2 ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              <span>Perfiles y Materiales Más Consumidos</span>
            </div>

            {salesAnalytics.topMaterials.length === 0 ? (
              <p
                className={`m-0 text-[12px] p-3 rounded-xl border border-dashed text-center ${
                  isDark
                    ? 'text-slate-400 bg-[#0f172a] border-slate-700'
                    : 'text-slate-500 bg-slate-50 border-slate-200'
                }`}
              >
                Aprueba o descarga cotizaciones en PDF para ver tus perfiles más consumidos.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {salesAnalytics.topMaterials.slice(0, 6).map((mat) => {
                  const pct = Math.max(8, Math.round((mat.cantidad / maxConsumo) * 100));
                  return (
                    <div key={mat.id} className={`p-2.5 ${subCardCls}`}>
                      <div className="flex items-center justify-between gap-2 text-[12px] mb-1">
                        <span className="font-bold truncate">{mat.nombre}</span>
                        <span
                          className={`mono font-extrabold shrink-0 ${
                            isDark ? 'text-sky-400' : 'text-blue-700'
                          }`}
                        >
                          {mat.cantidad} {mat.unidad}
                        </span>
                      </div>
                      <div
                        className={`w-full h-2 rounded-full overflow-hidden ${
                          isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CollapsibleAccordion>

      {/* 2. Datos del Taller y Encabezado PDF */}
      <CollapsibleAccordion
        id="acc-taller-identidad"
        title={`🏢 Datos del Taller y Encabezado PDF${!proActive ? ' 🔒 PRO' : ''}`}
        summary="Se aplica en cotizaciones para cliente, órdenes técnicas de taller y contratos PDF"
        open={identidadOpen}
        onToggle={() => setIdentidadOpen((v) => !v)}
        tone={accordionTone}
        className="mb-4 shadow-xl"
      >
        <PdfHeaderCustomizer
          taller={taller}
          onUpdateTaller={onUpdateTaller}
          onShowToast={onShowToast}
        />
      </CollapsibleAccordion>

      {/* 3. Tarifas Base y Ajuste Masivo */}
      <CollapsibleAccordion
        id="acc-taller-tarifas"
        title="💲 Tarifas Base y Ajuste Masivo"
        summary="Ajuste masivo (%), descuento del distribuidor, tarifas por m² y acceso a bodega"
        open={tarifasOpen}
        onToggle={() => setTarifasOpen((v) => !v)}
        tone={accordionTone}
        className="mb-4 shadow-xl"
      >
        <div className="flex flex-col gap-4">
          <div id="card-taller-bulk-adjust" className={`p-3.5 sm:p-4 ${subCardCls}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[16px] font-extrabold">
                  ⚡ Ajuste de precios de un golpe (%)
                </h2>
                <p className={`m-0 text-[12px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Actualiza tus tarifas en segundos cuando suba o baje el aluminio sin editar perfil por perfil
                </p>
              </div>
              <button
                type="button"
                id="btn-taller-ref-prices"
                onClick={() => {
                  if (!proActive) {
                    onOpenPro();
                    return;
                  }
                  setRefPricesOpen(true);
                }}
                className="min-h-[38px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Consultar Precios de Referencia</span>
                {!proActive && <span className="text-amber-200 text-[11px]">🔒 PRO</span>}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label
                  htmlFor="sel-bulk-acabado"
                  className={`flex items-center gap-1.5 text-[12px] font-extrabold mb-1 ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                  <span>Aplicar a:</span>
                </label>
                <select
                  id="sel-bulk-acabado"
                  value={bulkAcabado}
                  onChange={(e) => {
                    setBulkAcabado(e.target.value as AcabadoFiltroId);
                    setBulkConfirmOpen(false);
                  }}
                  className={`w-full min-h-[40px] px-3 text-[13px] font-bold ${inputCls}`}
                >
                  {ACABADOS_AJUSTE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {bulkAcabado === 'todos' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'aluminio', label: 'Solo Aluminio' },
                      { id: 'vidrio', label: 'Solo Vidrio' },
                      { id: 'herrajes', label: 'Solo Herrajes' },
                      { id: 'todo', label: 'Todo' },
                    ] as Array<{ id: BulkCategoryId; label: string }>
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setBulkCat(c.id);
                        setBulkConfirmOpen(false);
                      }}
                      aria-pressed={bulkCat === c.id}
                      className={`min-h-[34px] px-2 rounded-lg text-[11.5px] font-extrabold border cursor-pointer transition-colors ${
                        bulkCat === c.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : isDark
                            ? 'bg-[#161e31] text-slate-300 border-slate-700 hover:bg-[#1e2942]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {SPECIFIC_ACABADO_IDS.map((fid) => {
                    const opt = ACABADOS_AJUSTE_OPTIONS.find((o) => o.id === fid);
                    if (!opt) return null;
                    const price = getAcabadoCurrentPrice(
                      fid,
                      taller.precioListaTramo,
                      taller.preciosPorAcabado
                    );
                    const isSelected = bulkAcabado === fid;
                    return (
                      <button
                        key={fid}
                        type="button"
                        onClick={() => {
                          setBulkAcabado(fid);
                          setBulkConfirmOpen(false);
                        }}
                        data-testid={`acabado-price-${fid}`}
                        className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-sky-500/20 border-sky-400 text-sky-100'
                              : 'bg-blue-50 border-blue-500 text-blue-900'
                            : isDark
                              ? 'bg-[#161e31] border-slate-700 text-slate-200 hover:bg-[#1e2942]'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0"
                            style={{ backgroundColor: opt.swatch }}
                            aria-hidden="true"
                          />
                          {opt.shortLabel}
                        </span>
                        <span className="mono text-[11.5px] font-extrabold shrink-0">
                          {formatMXN(price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    id="inp-bulk-pct"
                    type="number"
                    min={-80}
                    max={200}
                    step={1}
                    value={bulkPct}
                    onChange={(e) => {
                      setBulkPct(e.target.value);
                      setBulkConfirmOpen(false);
                    }}
                    aria-label="Porcentaje de ajuste masivo"
                    className={`w-[88px] min-h-[40px] px-2.5 text-center mono text-[14px] font-extrabold ${inputCls}`}
                  />
                  <span
                    className={`text-[13px] font-extrabold ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    %
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {['5', '10', '-5'].map((v) => {
                    const num = Number(v);
                    const active = bulkPct === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        id={`btn-quick-pct-${v}`}
                        onClick={() => {
                          setBulkPct(v);
                          setBulkConfirmOpen(false);
                        }}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg border mono text-[12px] font-extrabold cursor-pointer transition-colors ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isDark
                              ? 'bg-[#161e31] border-slate-700 hover:bg-[#1e2942] text-slate-200'
                              : 'bg-white border-slate-200 hover:bg-blue-50 text-slate-700'
                        }`}
                      >
                        {num > 0 ? `+${v}%` : `${v}%`}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  id="btn-apply-bulk-pct"
                  onClick={handleRequestBulkAdjustment}
                  className="ml-auto min-h-[40px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-extrabold cursor-pointer"
                >
                  Aplicar ajuste
                </button>
              </div>

              {bulkConfirmOpen && bulkPctValid && (
                <div
                  id="bulk-adjust-confirm-box"
                  role="alertdialog"
                  aria-label="Confirmar ajuste masivo de precios"
                  className={`p-3 rounded-xl border-[1.5px] flex flex-col gap-2.5 ${
                    isDark
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-100'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-2 text-[12.5px] font-bold">
                    <AlertTriangle
                      className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>
                      {buildBulkAdjustmentConfirmMessage(bulkPctNum, bulkAcabado, bulkCat)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      id="btn-cancel-bulk-pct"
                      onClick={() => setBulkConfirmOpen(false)}
                      className={`min-h-[36px] px-3 rounded-lg border text-[12px] font-bold cursor-pointer ${
                        isDark
                          ? 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200'
                          : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      id="btn-confirm-bulk-pct"
                      onClick={handleConfirmBulkAdjustment}
                      className="min-h-[36px] px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-extrabold cursor-pointer"
                    >
                      Sí, aplicar {formatSignedPct(bulkPctNum)}
                    </button>
                  </div>
                </div>
              )}

              {lastBulkUndo && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border ${
                    isDark
                      ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <span className="text-[12px] font-bold">
                    Último ajuste guardado:{' '}
                    <strong>{formatSignedPct(lastBulkUndo.appliedPct)}</strong> (
                    {lastBulkUndo.scopeLabel})
                  </span>
                  <button
                    type="button"
                    id="btn-undo-bulk-pct"
                    onClick={handleUndoLastBulkAdjustment}
                    className={`min-h-[34px] px-3 rounded-lg border text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-rose-950/40 hover:bg-rose-950/60 border-rose-500/50 text-rose-200'
                        : 'bg-white hover:bg-rose-50 border-rose-300 text-rose-700'
                    }`}
                  >
                    <Undo2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Deshacer último ajuste</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`p-3.5 sm:p-4 ${subCardCls}`}>
            <h3 className="m-0 text-[15.5px] font-extrabold">Descuento del Distribuidor y Costos</h3>
            <p className={`m-0 text-[12px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Calcula el costo real de material y tu ganancia aproximada
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label
                  htmlFor="inp-desc-dist"
                  className={`block text-[12px] font-bold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  % Descuento Distribuidor
                </label>
                <input
                  id="inp-desc-dist"
                  type="number"
                  min={0}
                  max={80}
                  value={taller.descDistribuidorPct}
                  onChange={(e) =>
                    onUpdateTaller({
                      descDistribuidorPct: Math.max(0, Math.min(80, Number(e.target.value) || 0)),
                    })
                  }
                  className={`w-full min-h-[44px] px-3 mono text-[14px] font-semibold ${inputCls}`}
                />
              </div>
              <div>
                <label
                  htmlFor="inp-precio-tramo"
                  className={`block text-[12px] font-bold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Precio lista tramo 6.10 m ($ MXN)
                </label>
                <input
                  id="inp-precio-tramo"
                  type="number"
                  min={100}
                  step={50}
                  value={taller.precioListaTramo}
                  onChange={(e) =>
                    onUpdateTaller({
                      precioListaTramo: Math.max(100, Number(e.target.value) || 100),
                    })
                  }
                  className={`w-full min-h-[44px] px-3 mono text-[14px] font-semibold ${inputCls}`}
                />
              </div>
            </div>
          </div>

          <div className={`p-3.5 sm:p-4 ${subCardCls}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="m-0 text-[15.5px] font-extrabold">Tarifas Base por m² ($ MXN)</h3>
                <p className={`m-0 text-[12px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Se aplican automáticamente al elegir cada línea
                </p>
              </div>
              <button
                type="button"
                onClick={onRestablecerTarifas}
                className={`px-2.5 py-1.5 rounded-lg border text-[12px] font-bold cursor-pointer ${
                  isDark
                    ? 'border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                    : 'border-slate-200 text-blue-600 bg-white'
                }`}
              >
                Restablecer
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {Object.values(LINEAS_CONFIG).map((l) => {
                const locked = l.pro && !proActive;
                const val = taller.tarifasBase[l.id] ?? l.tarifaBaseDefault;
                return (
                  <div key={l.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block text-[13px]">
                        {l.nombre}{' '}
                        {locked && <span className="text-amber-500 text-[11px]">🔒 PRO</span>}
                      </strong>
                      <span className={`text-[11.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {l.desc}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={val}
                      readOnly={locked}
                      onFocus={(e) => {
                        if (locked) {
                          e.target.blur();
                          onOpenPro();
                        }
                      }}
                      onChange={(e) =>
                        onUpdateTaller({
                          tarifasBase: {
                            ...taller.tarifasBase,
                            [l.id]: Math.max(0, Number(e.target.value) || 0),
                          },
                        })
                      }
                      className={`w-[120px] min-h-[40px] px-2.5 text-right mono text-[14px] font-bold ${inputCls}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 ${subCardCls}`}>
            <div>
              <h3 className="m-0 text-[15px] font-extrabold">
                Mi Inventario de Taller{' '}
                {!proActive && <span className="text-amber-500 text-[12px]">🔒 PRO</span>}
              </h3>
              <p className={`m-0 text-[12px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Registra tus tramos de 6.10 m en bodega para saber qué pedir
              </p>
            </div>
            <button
              type="button"
              onClick={onEntrarInventario}
              className="min-h-[42px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] cursor-pointer"
            >
              Abrir Mi Inventario de Taller
            </button>
          </div>
        </div>
      </CollapsibleAccordion>

      {/* 4. Descuentos de Corte y Optimizador 6.10 m */}
      <CollapsibleAccordion
        id="acc-taller-descuentos"
        title="🎛️ Descuentos de Corte y Optimizador 6.10 m"
        summary="Calibra descuentos por extrusor, despunte (2.5 cm), disco (0.4 cm) y sobrante usable (60 cm)"
        open={descuentosOpen}
        onToggle={() => setDescuentosOpen((v) => !v)}
        tone={accordionTone}
        className="mb-4 shadow-xl"
      >
        <div id="card-taller-ajuste-fino" className="flex flex-col gap-4">
          <div
            className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-sky-950/30 border-sky-500/35' : 'bg-blue-50/70 border-blue-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <strong
                className={`text-[13.5px] font-extrabold ${
                  isDark ? 'text-sky-200' : 'text-blue-950'
                }`}
              >
                Parámetros de optimización de barra 6.10 m
              </strong>
              <button
                type="button"
                onClick={() => {
                  onUpdateTaller({ optimizador: { ...DEFAULT_OPTIMIZADOR_CONFIG } });
                  onShowToast('Parámetros del optimizador 6.10 m restablecidos', true);
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                  isDark
                    ? 'border-sky-400/40 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25'
                    : 'border-blue-300 bg-white text-blue-700'
                }`}
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Restablecer 6.10 m
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label
                  htmlFor="inp-opt-largo"
                  className={`block text-[11px] font-bold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Largo barra (cm)
                </label>
                <input
                  id="inp-opt-largo"
                  type="number"
                  min={100}
                  max={800}
                  step={1}
                  value={optResolved.largoBarraCm}
                  onChange={(e) => handleUpdateOptField('largoBarraCm', e.target.value)}
                  className={`w-full min-h-[38px] px-2.5 mono text-[13px] font-bold ${inputCls}`}
                />
              </div>
              <div>
                <label
                  htmlFor="inp-opt-despunte"
                  className={`block text-[11px] font-bold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Despunte x punta (cm)
                </label>
                <input
                  id="inp-opt-despunte"
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={optResolved.despuntePorExtremoCm}
                  onChange={(e) => handleUpdateOptField('despuntePorExtremoCm', e.target.value)}
                  className={`w-full min-h-[38px] px-2.5 mono text-[13px] font-bold ${inputCls}`}
                />
              </div>
              <div>
                <label
                  htmlFor="inp-opt-kerf"
                  className={`block text-[11px] font-bold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Grosor disco / kerf (cm)
                </label>
                <input
                  id="inp-opt-kerf"
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={optResolved.kerfCm}
                  onChange={(e) => handleUpdateOptField('kerfCm', e.target.value)}
                  className={`w-full min-h-[38px] px-2.5 mono text-[13px] font-bold ${inputCls}`}
                />
              </div>
              <div>
                <label
                  htmlFor="inp-opt-umbral"
                  className={`block text-[11px] font-bold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Sobrante usable (cm)
                </label>
                <input
                  id="inp-opt-umbral"
                  type="number"
                  min={10}
                  max={250}
                  step={5}
                  value={optResolved.umbralSobranteUsableCm}
                  onChange={(e) => handleUpdateOptField('umbralSobranteUsableCm', e.target.value)}
                  className={`w-full min-h-[38px] px-2.5 mono text-[13px] font-bold ${inputCls}`}
                />
              </div>
            </div>

            <div
              className={`mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <span className={`mono font-bold ${isDark ? 'text-sky-300' : 'text-blue-900'}`}>
                Largo útil por barra:{' '}
                {(optResolved.largoBarraCm - 2 * optResolved.despuntePorExtremoCm).toFixed(1)} cm
              </span>
              <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={Boolean(taller.ivaPorDefecto)}
                  onChange={(e) => onUpdateTaller({ ivaPorDefecto: e.target.checked })}
                />
                Incluir IVA (16%) por defecto en nuevas cotizaciones
              </label>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <strong className="text-[13.5px] font-extrabold">
                Descuentos estándar de corte en taller (cm)
              </strong>
              <button
                type="button"
                id="btn-reset-ajuste-fino"
                onClick={() => {
                  onUpdateTaller({ ajusteDescuentos: { ...DEFAULT_AJUSTE_DESCUENTOS } });
                  onShowToast('Descuentos de taller restablecidos a valores de fábrica', true);
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                  isDark
                    ? 'border-slate-700 bg-[#161e31] hover:bg-[#1e2942] text-slate-200'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Restablecer valores de fábrica
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {AJUSTE_FIELDS.map((f) => (
                <div
                  key={f.key}
                  className={`p-2.5 flex items-center justify-between gap-2 ${subCardCls}`}
                >
                  <div className="min-w-0">
                    <span
                      className={`block text-[10px] font-extrabold uppercase tracking-wide ${
                        isDark ? 'text-sky-400' : 'text-blue-700'
                      }`}
                    >
                      {f.group}
                    </span>
                    <span className="block text-[12px] font-bold truncate">{f.label}</span>
                    <span
                      className={`block text-[10.5px] mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {f.hint}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    step={0.1}
                    aria-label={`${f.group} ${f.label}`}
                    value={ajusteResolved[f.key]}
                    onChange={(e) => handleUpdateAjusteField(f.key, e.target.value)}
                    className={`w-[74px] min-h-[36px] px-2 text-right mono text-[13px] font-bold shrink-0 ${inputCls}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleAccordion>

      {/* 5. Mis Fórmulas de Corte */}
      <CollapsibleAccordion
        id="acc-taller-formulas"
        title="📐 Mis Fórmulas de Corte"
        summary={
          formulas.length > 0
            ? `${formulas.length} fórmula(s) guardada(s) · Edita nombre, línea y tolerancias sin borrarlas`
            : 'Guarda tus propios descuentos de corte por marca o sistema'
        }
        open={formulasOpen}
        onToggle={() => setFormulasOpen((v) => !v)}
        tone={accordionTone}
        className="mb-4 shadow-xl"
        rightAction={
          <button
            type="button"
            id="btn-taller-nueva-formula"
            onClick={onOpenFormulaModal}
            className="min-h-[34px] px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold cursor-pointer"
          >
            + Nueva Fórmula
          </button>
        }
      >
        {formulas.length === 0 ? (
          <p
            className={`text-[12.5px] p-3.5 text-center border border-dashed rounded-xl m-0 ${
              isDark ? 'text-slate-400 border-slate-600/50' : 'text-slate-500 border-slate-300'
            }`}
          >
            Aún no guardas fórmulas personalizadas. Modifica los descuentos en Ventanas o Puertas o
            usa <strong>+ Nueva Fórmula</strong>.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {formulas.map((f) => (
              <div
                key={f.id}
                className={`p-3 flex items-center justify-between gap-2 ${subCardCls}`}
              >
                <div className="min-w-0">
                  <strong className="block text-[13.5px] truncate">{f.nombre}</strong>
                  <span className={`text-[11.5px] mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {LINEAS_CONFIG[f.linea]?.nombre} · MH:-{f.tolerancias.marcoH} HV:-
                    {f.tolerancias.hojaV} HH:-{f.tolerancias.hojaH}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onEditarFormula && (
                    <button
                      type="button"
                      id={`btn-editar-formula-${f.id}`}
                      onClick={() => onEditarFormula(f)}
                      title={`Editar fórmula ${f.nombre}`}
                      aria-label={`Editar fórmula ${f.nombre}`}
                      className={`px-2.5 py-1.5 rounded-lg border text-[12px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                        isDark
                          ? 'border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300'
                          : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Editar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    id={`btn-eliminar-formula-${f.id}`}
                    onClick={() => onEliminarFormula(f.id)}
                    title={`Eliminar fórmula ${f.nombre}`}
                    aria-label={`Eliminar fórmula ${f.nombre}`}
                    className={`px-2 py-1.5 rounded-lg border text-[12px] font-bold inline-flex items-center justify-center cursor-pointer transition-colors ${
                      isDark
                        ? 'border-red-500/40 bg-red-950/40 hover:bg-red-950/60 text-red-300'
                        : 'border-red-200 bg-white hover:bg-red-50 text-red-600'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleAccordion>

      {/* 6. Historial de Cálculos Recientes */}
      <CollapsibleAccordion
        id="acc-taller-historial"
        title="🗂️ Historial de Cálculos Recientes"
        summary={`Guardado en este equipo (${historial.length})`}
        open={historialOpen}
        onToggle={() => setHistorialOpen((v) => !v)}
        tone={accordionTone}
        className="mb-4 shadow-xl"
        rightAction={
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              id="btn-exportar-historial-pdf"
              disabled={historial.length === 0}
              onClick={() => {
                generarPdfHistorialCotizaciones(historial, taller).then((ok) => {
                  if (ok) onShowToast('Historial de cotizaciones exportado a PDF', true);
                  else onShowToast('Aún no tienes cotizaciones guardadas para exportar');
                });
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold inline-flex items-center gap-1 transition-colors ${
                historial.length === 0
                  ? 'border border-slate-500/40 bg-slate-700/40 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
              PDF
            </button>
            {onOpenReminders && (
              <button
                type="button"
                id="btn-taller-open-reminders"
                onClick={onOpenReminders}
                className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] font-extrabold cursor-pointer ${
                  isDark
                    ? 'border-blue-400/50 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300'
                    : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
                }`}
              >
                🔔{pendingRemindersCount > 0 ? ` (${pendingRemindersCount})` : ''}
              </button>
            )}
            {historial.length > 0 && (
              <button
                type="button"
                onClick={onLimpiarHistorial}
                className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] font-bold cursor-pointer ${
                  isDark
                    ? 'border-slate-600/60 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Limpiar
              </button>
            )}
          </div>
        }
      >
        {historial.length === 0 ? (
          <p
            className={`text-[12.5px] p-4 text-center border border-dashed rounded-xl m-0 ${
              isDark ? 'text-slate-400 border-slate-600/50' : 'text-slate-500 border-slate-300'
            }`}
          >
            Aún no tienes cálculos o cotizaciones guardadas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((h) => (
              <div
                key={h.id}
                className={`p-3 flex flex-wrap items-center justify-between gap-2 ${subCardCls}`}
              >
                <div className="min-w-0 flex-1">
                  <strong className="block text-[13.5px] truncate">{h.referencia}</strong>
                  <span className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {LINEAS_CONFIG[h.linea]?.nombre} · {h.anchoCm}×{h.altoCm} cm ·{' '}
                    {COLORES_CONFIG[h.color]?.corto} · {h.fecha}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <strong className={`mono ${isDark ? 'text-sky-400' : 'text-blue-700'}`}>
                    {formatMXN(h.total)}
                  </strong>
                  {onScheduleHistorialReminder && (
                    <button
                      type="button"
                      onClick={() => onScheduleHistorialReminder(h)}
                      className={`px-2.5 py-1 rounded-lg border text-[11.5px] font-bold cursor-pointer ${
                        isDark
                          ? 'border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300'
                          : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800'
                      }`}
                      title="Programar recordatorio de seguimiento en 24 h"
                    >
                      🔔 Recordar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEliminarHistorial(h.id)}
                    aria-label={`Eliminar cálculo ${h.referencia}`}
                    className={`px-2 py-1 rounded-lg border text-[12px] font-bold cursor-pointer ${
                      isDark
                        ? 'border-red-500/40 bg-red-950/30 text-red-400'
                        : 'border-red-200 bg-white text-red-600'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleAccordion>

      {/* Modal Precios de Referencia */}
      {refPricesOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="modal-reference-prices"
            className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ref-prices-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setRefPricesOpen(false);
            }}
          >
            <div
              className={`w-full max-w-2xl max-h-[90vh] flex flex-col border rounded-2xl shadow-2xl overflow-hidden my-auto ${
                isDark
                  ? 'bg-[#121722] text-slate-100 border-slate-700'
                  : 'bg-white text-slate-900 border-slate-300'
              }`}
            >
              <div
                className={`px-4 sm:px-5 py-3.5 border-b flex items-start justify-between gap-3 ${
                  isDark ? 'bg-[#181f2e] border-slate-700' : 'border-slate-200'
                }`}
              >
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md border text-[10.5px] font-extrabold mb-1 ${
                      isDark
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {activeRefPrices.updatedLabel || 'Actualizado esta semana'}
                  </span>
                  <h2 id="ref-prices-title" className="m-0 text-[17px] font-extrabold">
                    Precios de Referencia de Mercado (MXN)
                  </h2>
                  <p className={`m-0 text-[11.5px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {activeRefPrices.nota ||
                      'Valores promedio orientativos en México. Verifica siempre con tu distribuidor local.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRefPricesOpen(false)}
                  aria-label="Cerrar tabla de precios de referencia"
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer shrink-0 ${
                    isDark
                      ? 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <div
                  className={`overflow-x-auto border rounded-xl ${
                    isDark ? 'border-slate-700' : 'border-slate-200'
                  }`}
                >
                  <table className="w-full border-collapse text-[12px] min-w-[440px]">
                    <thead>
                      <tr
                        className={`border-b ${
                          isDark
                            ? 'bg-[#182030] border-slate-700 text-slate-300'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <th className="p-2.5 text-left">Material / Concepto</th>
                        <th className="p-2.5 text-right">Tu Precio Actual</th>
                        <th className="p-2.5 text-right">Referencia Sugerida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRefPrices.items.map((item) => {
                        const currentVal = getCurrentPriceForRefItem(item);
                        const diff = item.precioSugerido - currentVal;
                        return (
                          <tr
                            key={item.id}
                            className={`border-b last:border-b-0 ${
                              isDark ? 'border-slate-800' : 'border-slate-100'
                            }`}
                          >
                            <td className="p-2.5">
                              <strong className="block">{item.nombre}</strong>
                              <span
                                className={`text-[10.5px] uppercase font-bold ${
                                  isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                {item.categoria} · por {item.unidad}
                              </span>
                            </td>
                            <td className="p-2.5 text-right mono font-bold">
                              {formatMXN(currentVal)}
                            </td>
                            <td className="p-2.5 text-right mono">
                              <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
                                {formatMXN(item.precioSugerido)}
                              </strong>
                              {diff !== 0 && (
                                <span
                                  className={`block text-[10px] font-bold ${
                                    diff > 0
                                      ? isDark
                                        ? 'text-amber-400'
                                        : 'text-amber-700'
                                      : isDark
                                        ? 'text-sky-400'
                                        : 'text-blue-700'
                                  }`}
                                >
                                  {diff > 0 ? `+${formatMXN(diff)}` : formatMXN(diff)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p
                  className={`m-0 mt-3 text-[11px] border rounded-xl p-2.5 ${
                    isDark
                      ? 'text-amber-200 bg-amber-950/35 border-amber-500/40'
                      : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}
                >
                  ⚠️ Aviso: Estos precios son una referencia orientativa semanal y no representan una
                  cotización oficial de proveedores.
                </p>
              </div>

              <div
                className={`px-4 sm:px-5 py-3 border-t flex flex-wrap items-center justify-end gap-2 ${
                  isDark ? 'border-slate-700 bg-[#181f2e]' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setRefPricesOpen(false)}
                  className={`min-h-[42px] px-4 rounded-xl border text-[13px] font-bold cursor-pointer ${
                    isDark
                      ? 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Mantener mis precios
                </button>
                <button
                  type="button"
                  id="btn-apply-all-ref-prices"
                  onClick={handleApplyAllRefPrices}
                  className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-extrabold cursor-pointer"
                >
                  Aplicar todos los sugeridos
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <PublicidadTallerCard taller={taller} onShowToast={onShowToast} />

      {/* 7. Respaldo y Restauración (JSON) */}
      {backupData && onImportBackup && (
        <CollapsibleAccordion
          id="acc-taller-respaldo"
          title="💾 Respaldo y Restauración (JSON)"
          summary="Exporta o restaura tus datos de Mi Taller, tarifas, clientes, inventario e historial"
          open={respaldoOpen}
          onToggle={() => setRespaldoOpen((v) => !v)}
          tone={accordionTone}
          className="mt-4 shadow-xl"
        >
          <div id="card-taller-backup-json" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              id="btn-taller-export-json"
              onClick={handleExportTallerJson}
              className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Exportar respaldo JSON</span>
            </button>
            <button
              type="button"
              id="btn-taller-import-json"
              onClick={() => importBackupRef.current?.click()}
              className={`min-h-[44px] px-3.5 rounded-xl border font-extrabold text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'border-slate-700 bg-[#0f172a] hover:bg-[#1a243b] text-slate-100'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Importar respaldo JSON</span>
            </button>
            <input
              ref={importBackupRef}
              type="file"
              accept="application/json"
              onChange={handleImportTallerJson}
              className="hidden"
            />
          </div>
        </CollapsibleAccordion>
      )}
    </section>
  );
};
