import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileDown,
  Lock,
  Palette,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Moon,
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
  ResolvedAppTheme,
  CotizacionGuardada,
  formatMXN,
  FormulaPersonalizada,
  HistorialItem,
  loadCotizacionesGuardadas,
  normalizeSkinVariantForSkin,
  parseBackupPayload,
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
  onEliminarFormula: (id: string) => void;
  onEditarFormula?: (updated: FormulaPersonalizada) => void;
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
  onEliminarFormula,
  onEditarFormula,
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
  const [ajusteFinoOpen, setAjusteFinoOpen] = useState(false);

  // Estado local para editar cualquier fórmula guardada de Mi Taller
  const [localFormulasOverride, setLocalFormulasOverride] = useState<Record<string, FormulaPersonalizada>>({});
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const [editFormulaNombre, setEditFormulaNombre] = useState('');
  const [editFormulaLinea, setEditFormulaLinea] = useState<LineaId>('3');
  const [editMarcoH, setEditMarcoH] = useState('0');
  const [editHojaV, setEditHojaV] = useState('0');
  const [editHojaH, setEditHojaH] = useState('0');

  const displayedFormulas = useMemo(
    () => formulas.map((f) => localFormulasOverride[f.id] || f),
    [formulas, localFormulasOverride]
  );

  const handleStartEditFormula = (f: FormulaPersonalizada) => {
    setEditingFormulaId(f.id);
    setEditFormulaNombre(f.nombre);
    setEditFormulaLinea(f.linea);
    setEditMarcoH(String(f.tolerancias.marcoH));
    setEditHojaV(String(f.tolerancias.hojaV));
    setEditHojaH(String(f.tolerancias.hojaH));
  };

  const handleSaveEditFormula = (original: FormulaPersonalizada) => {
    const cleanName = editFormulaNombre.trim();
    if (!cleanName) {
      onShowToast('Escribe un nombre para la fórmula.');
      return;
    }
    const updated: FormulaPersonalizada = {
      ...original,
      nombre: cleanName,
      linea: editFormulaLinea,
      tolerancias: {
        ...original.tolerancias,
        marcoH: Math.max(0, Number(editMarcoH) || 0),
        hojaV: Math.max(0, Number(editHojaV) || 0),
        hojaH: Math.max(0, Number(editHojaH) || 0),
      },
    };
    setLocalFormulasOverride((prev) => ({ ...prev, [updated.id]: updated }));
    if (onEditarFormula) {
      onEditarFormula(updated);
    } else if (backupData && onImportBackup) {
      const nextList = formulas.map((item) => (item.id === updated.id ? updated : item));
      onImportBackup({ ...backupData, formulas: nextList });
    } else {
      try {
        const raw = window.localStorage.getItem('aluminero_formulas_v1');
        if (raw) {
          const parsed = JSON.parse(raw) as FormulaPersonalizada[];
          if (Array.isArray(parsed)) {
            window.localStorage.setItem(
              'aluminero_formulas_v1',
              JSON.stringify(parsed.map((item) => (item.id === updated.id ? updated : item)))
            );
          }
        }
      } catch {
        // ignore
      }
    }
    setEditingFormulaId(null);
    onShowToast(`Fórmula "${cleanName}" actualizada`, true);
  };

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

  const getCurrentPriceForRefItem = (item: ReferencePriceItem): number => {
    if (item.id === 'ref-alu-tramo') return taller.precioListaTramo;
    if (item.lineaId) {
  const maxConsumo = Math.max(1, ...salesAnalytics.topMaterials.map((m) => m.cantidad));
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
          className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mb-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-blue-600 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="m-0 text-[16px] font-extrabold">Apariencia y Carátula</h2>
                <p className="m-0 text-[12px] text-slate-500">
                  Elige entre Básica, Navideña, Ejecutiva (PRO) o Industrial PRO y Modo Claro / Oscuro
                </p>
              </div>
            </div>
            {onToggleColorMode && (
              <button
                type="button"
                id="btn-taller-color-mode"
                onClick={onToggleColorMode}
                className="min-h-[38px] px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {colorMode === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
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
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-extrabold">Básica</span>
                    <span className="block text-[10.5px] text-slate-500">Gratis y PRO · Limpia</span>
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shrink-0" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  id="btn-taller-skin-navidena"
                  onClick={() => onSelectSkin('navidena')}
                  aria-pressed={skin === 'navidena'}
                  className={`min-h-[54px] px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    skin === 'navidena'
                      ? 'border-red-600 bg-red-50 text-red-950 ring-1 ring-red-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-extrabold">Navideña ❄️</span>
                    <span className="block text-[10.5px] text-slate-500">Gratis y PRO · Invierno</span>
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-red-600 ring-2 ring-amber-400 shrink-0" aria-hidden="true" />
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
                      ? 'border-sky-600 bg-sky-50 text-sky-950 ring-1 ring-sky-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-extrabold">
                      Ejecutiva {!ejecutivaUnlocked && '🔒'}
                    </span>
                    <span className="block text-[10.5px] text-slate-500">
                      {ejecutivaUnlocked ? '4 acabados · Negro Anodizado' : 'Planes PRO (30d/90d/1A)'}
                    </span>
                  </div>
                  {ejecutivaUnlocked ? (
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: '#3b6ef5' }} aria-hidden="true" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
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
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block text-[13px] font-extrabold">
                      Industrial PRO {!industrialUnlocked && '🔒'}
                    </span>
                    <span className="block text-[10.5px] text-slate-500">
                      {industrialUnlocked ? '6 acabados · Champagne / Tintex' : 'Planes PRO (30d/90d/1A)'}
                    </span>
                  </div>
                  {industrialUnlocked ? (
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: '#3d8b5e' }} aria-hidden="true" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </div>

              {onSelectSkinVariant && SKIN_VARIANTS_BY_SKIN[skin]?.length > 0 && (
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
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
                            ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
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

      {/* Métricas del Taller */}
      <div
        id="card-taller-metricas"
        className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mb-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="m-0 text-[17px] font-extrabold">Métricas de Ventas y Materiales</h2>
