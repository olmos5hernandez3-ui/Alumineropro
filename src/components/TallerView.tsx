import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  FileDown,
  Lock,
  Palette,
  Percent,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Moon,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react';
import {
  AjusteDescuentosConfig,
  applyBulkPriceAdjustment,
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
  AppTheme,
  CotizacionGuardada,
  formatMXN,
  FormulaPersonalizada,
  HistorialItem,
  loadCotizacionesGuardadas,
  parseBackupPayload,
  TallerConfig,
} from '../utils/storageHelpers';
import { PdfHeaderCustomizer } from './PdfHeaderCustomizer';

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
  colorMode?: AppTheme;
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
  const [bulkCat, setBulkCat] = useState<'aluminio' | 'vidrio' | 'herrajes' | 'todo'>('aluminio');
  const [bulkPct, setBulkPct] = useState<string>('10');
  const [ajusteFinoOpen, setAjusteFinoOpen] = useState(false);

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

  const handleApplyBulkAdjustment = () => {
    const pctNum = Number(bulkPct);
    if (!Number.isFinite(pctNum) || pctNum === 0) {
      onShowToast('Ingresa un porcentaje distinto de 0 (ej. 10 o -5)');
      return;
    }
    const res = applyBulkPriceAdjustment({
      category: bulkCat,
      pct: pctNum,
      precioListaTramo: taller.precioListaTramo,
      tarifasBase: taller.tarifasBase,
      rellenoPreciosM2: taller.rellenoPreciosM2 || {},
      herrajesPrecios: taller.herrajesPrecios || {},
    });
    onUpdateTaller({
      precioListaTramo: res.precioListaTramo,
      tarifasBase: res.tarifasBase,
      rellenoPreciosM2: res.rellenoPreciosM2,
      herrajesPrecios: res.herrajesPrecios,
    });
    const sign = pctNum > 0 ? `+${pctNum}%` : `${pctNum}%`;
    onShowToast(`Ajuste masivo ${sign} aplicado (${res.updatedCount} tarifas actualizadas)`, true);
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

  const maxConsumo = Math.max(1, ...salesAnalytics.topMaterials.map((m) => m.cantidad));

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

      {/* Apariencia rápida: Azul Básico / Verde PRO + Modo Claro / Oscuro */}
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
                      {ejecutivaUnlocked ? 'Oscuro luminoso PRO' : 'Planes PRO (30d/90d/1A)'}
                    </span>
                  </div>
                  {ejecutivaUnlocked ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shrink-0" aria-hidden="true" />
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
                      {industrialUnlocked ? 'Cuadrícula metálica PRO' : 'Planes PRO (30d/90d/1A)'}
                    </span>
                  </div>
                  {industrialUnlocked ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Métricas del Taller (movido del Panel de Administrador) */}
      <div
        id="card-taller-metricas"
        className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mb-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="m-0 text-[17px] font-extrabold">Métricas de Ventas y Materiales</h2>
              <p className="m-0 text-[12px] text-slate-500">
                Ticket promedio, tasa de aprobación y perfiles más consumidos en tu taller
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold mono">
            {salesAnalytics.totalQuotesCount} cotización(es)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 uppercase">Ticket Promedio</span>
            <strong className="block text-[17px] font-extrabold text-blue-700 mono mt-0.5">
              {formatMXN(salesAnalytics.averageTicket)}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 uppercase">Total Aprobado</span>
            <strong className="block text-[17px] font-extrabold text-emerald-700 mono mt-0.5">
              {formatMXN(salesAnalytics.totalApprovedRevenue)}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 uppercase">Aprobación</span>
            <strong className="block text-[17px] font-extrabold text-slate-900 mono mt-0.5">
              {salesAnalytics.approvalRatePct.toFixed(0)}%
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-[11px] font-bold text-slate-500 uppercase">Obras Aprobadas</span>
            <strong className="block text-[17px] font-extrabold text-indigo-700 mono mt-0.5">
              {salesAnalytics.approvedCount}
            </strong>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-700 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Perfiles y Materiales Más Consumidos</span>
          </div>
          {salesAnalytics.topMaterials.length === 0 ? (
            <p className="m-0 text-[12px] text-slate-500 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
              Aprueba o descarga cotizaciones en PDF para ver tus perfiles más consumidos.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {salesAnalytics.topMaterials.slice(0, 6).map((mat) => {
                const pct = Math.max(8, Math.round((mat.cantidad / maxConsumo) * 100));
                return (
                  <div key={mat.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2 text-[12px] mb-1">
                      <span className="font-bold text-slate-900 truncate">{mat.nombre}</span>
                      <span className="mono font-extrabold text-blue-700 shrink-0">
                        {mat.cantidad} {mat.unidad}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
          <div className="mb-3.5">
            <h2 className="m-0 text-[17px] font-extrabold">
              Encabezado PDF y Datos de mi Taller{' '}
              {!proActive && <span className="text-amber-700 text-[12px]">🔒 PRO</span>}
            </h2>
            <p className="m-0 text-[12px] text-slate-500">
              Se aplica en cotizaciones para cliente, órdenes técnicas de taller y contratos PDF
            </p>
          </div>

          <PdfHeaderCustomizer
            taller={taller}
            onUpdateTaller={onUpdateTaller}
            onShowToast={onShowToast}
          />
        </div>

        <div className="flex flex-col gap-4">
          {/* Precios de Referencia (PRO) + Ajuste Masivo (%) */}
          <div
            id="card-taller-bulk-adjust"
            className="bg-white text-[#1E293B] border-[1.5px] border-blue-300 rounded-[18px] p-4 sm:p-5 shadow-xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold">Precios de Referencia y Ajuste Masivo</h2>
                <p className="m-0 text-[12px] text-slate-500">
                  Compara precios de mercado o sube/baja tus tarifas por porcentaje en un clic
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

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-slate-800 mb-2">
                <Percent className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>Ajuste Masivo de Precios (%)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
                {(
                  [
                    { id: 'aluminio', label: 'Solo Aluminio' },
                    { id: 'vidrio', label: 'Solo Vidrio' },
                    { id: 'herrajes', label: 'Solo Herrajes' },
                    { id: 'todo', label: 'Todo' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setBulkCat(c.id)}
                    aria-pressed={bulkCat === c.id}
                    className={`min-h-[34px] px-2 rounded-lg text-[11.5px] font-extrabold border cursor-pointer transition-colors ${
                      bulkCat === c.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    id="inp-bulk-pct"
                    type="number"
                    min={-80}
                    max={200}
                    step={1}
                    value={bulkPct}
                    onChange={(e) => setBulkPct(e.target.value)}
                    aria-label="Porcentaje de ajuste masivo"
                    className="w-[92px] min-h-[40px] rounded-xl border border-slate-300 bg-white px-2.5 text-center mono text-[14px] font-extrabold"
                  />
                  <span className="text-[13px] font-extrabold text-slate-600">%</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {['-5', '5', '10', '15'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBulkPct(v)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 mono text-[11px] font-bold cursor-pointer"
                    >
                      {Number(v) > 0 ? `+${v}%` : `${v}%`}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  id="btn-apply-bulk-pct"
                  onClick={handleApplyBulkAdjustment}
                  className="ml-auto min-h-[40px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-extrabold cursor-pointer"
                >
                  Aplicar ajuste
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <h2 className="m-0 text-[17px] font-extrabold">Descuento del Distribuidor y Costos</h2>
            <p className="m-0 text-[12px] text-slate-500">
              Calcula el costo real de material y tu ganancia aproximada
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label htmlFor="inp-desc-dist" className="block text-[12px] font-bold text-slate-500 mb-1">
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
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[14px] font-semibold"
                />
              </div>
              <div>
                <label htmlFor="inp-precio-tramo" className="block text-[12px] font-bold text-slate-500 mb-1">
                  Precio lista tramo 6.10 m ($ MXN)
                </label>
                <input
                  id="inp-precio-tramo"
                  type="number"
                  min={100}
                  step={50}
                  value={taller.precioListaTramo}
                  onChange={(e) =>
                    onUpdateTaller({ precioListaTramo: Math.max(100, Number(e.target.value) || 100) })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[14px] font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold">Tarifas Base por m² ($ MXN)</h2>
                <p className="m-0 text-[12px] text-slate-500">Se aplican automáticamente al elegir cada línea</p>
              </div>
              <button
                type="button"
                onClick={onRestablecerTarifas}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-blue-600 text-[12px] font-bold cursor-pointer"
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
                        {l.nombre} {locked && <span className="text-amber-700 text-[11px]">🔒 PRO</span>}
                      </strong>
                      <span className="text-[11.5px] text-slate-500">{l.desc}</span>
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
                            [l.id as LineaId]: Math.max(0, Number(e.target.value) || 0),
                          },
                        })
                      }
                      className="w-[120px] min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-right mono text-[14px] font-bold"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <h2 className="m-0 text-[17px] font-extrabold">
              Mi Inventario de Taller {!proActive && <span className="text-amber-700 text-[12px]">🔒 PRO</span>}
            </h2>
            <p className="m-0 text-[12px] text-slate-500 mb-3">
              Registra tus tramos de 6.10 m en bodega para saber qué pedir
            </p>
            <button
              type="button"
              onClick={onEntrarInventario}
              className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13.5px] cursor-pointer"
            >
              Abrir Mi Inventario de Taller
            </button>
          </div>

          {backupData && onImportBackup && (
            <div
              id="card-taller-backup-json"
              className="bg-white text-[#1E293B] border-[1.5px] border-emerald-300 rounded-[18px] p-4 sm:p-5 shadow-xl"
            >
              <h2 className="m-0 text-[17px] font-extrabold">Respaldo Local de Datos (JSON)</h2>
              <p className="m-0 text-[12px] text-slate-500 mt-0.5 mb-3">
                Exporta o restaura tus datos de Mi Taller, tarifas, clientes, inventario e historial en un archivo JSON.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                  className="min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer"
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
            </div>
          )}
        </div>
      </div>

      {/* Ajuste fino de descuentos (cm) y Parámetros de optimización 6.10 m */}
      <div
        id="card-taller-ajuste-fino"
        className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mt-4"
      >
        <button
          type="button"
          id="btn-toggle-ajuste-fino"
          onClick={() => setAjusteFinoOpen((v) => !v)}
          aria-expanded={ajusteFinoOpen}
          className="w-full flex items-center justify-between gap-3 bg-transparent border-0 p-0 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <SlidersHorizontal className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="m-0 text-[16.5px] font-extrabold text-slate-900">
                Ajuste fino de descuentos (cm) y Optimizador 6.10 m
              </h2>
              <p className="m-0 text-[12px] text-slate-500">
                Calibra los descuentos de taller por extrusor, despunte (2.5 cm), disco (0.4 cm) y sobrante usable (60 cm)
              </p>
            </div>
          </div>
          {ajusteFinoOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
          )}
        </button>

        {ajusteFinoOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-4">
            {/* Parámetros del optimizador 6.10 m */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <strong className="text-[13.5px] font-extrabold text-blue-950">
                  Parámetros de optimización de barra 6.10 m
                </strong>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTaller({ optimizador: { ...DEFAULT_OPTIMIZADOR_CONFIG } });
                    onShowToast('Parámetros del optimizador 6.10 m restablecidos', true);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-blue-300 bg-white text-blue-700 text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  Restablecer 6.10 m
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label htmlFor="inp-opt-largo" className="block text-[11px] font-bold text-slate-600 mb-1">
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
                    className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 mono text-[13px] font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="inp-opt-despunte" className="block text-[11px] font-bold text-slate-600 mb-1">
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
                    className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 mono text-[13px] font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="inp-opt-kerf" className="block text-[11px] font-bold text-slate-600 mb-1">
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
                    className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 mono text-[13px] font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="inp-opt-umbral" className="block text-[11px] font-bold text-slate-600 mb-1">
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
                    className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 mono text-[13px] font-bold"
                  />
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate-700">
                <span className="mono font-bold text-blue-900">
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

            {/* Descuentos exactos editables */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <strong className="text-[13.5px] font-extrabold text-slate-900">
                  Descuentos estándar de corte en taller (cm)
                </strong>
                <button
                  type="button"
                  id="btn-reset-ajuste-fino"
                  onClick={() => {
                    onUpdateTaller({ ajusteDescuentos: { ...DEFAULT_AJUSTE_DESCUENTOS } });
                    onShowToast('Descuentos de taller restablecidos a valores de fábrica', true);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  Restablecer valores de fábrica
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {AJUSTE_FIELDS.map((f) => (
                  <div
                    key={f.key}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
                        {f.group}
                      </span>
                      <span className="block text-[12px] font-bold text-slate-900 truncate">
                        {f.label}
                      </span>
                      <span className="block text-[10.5px] text-slate-500 mono">{f.hint}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      step={0.1}
                      aria-label={`${f.group} ${f.label}`}
                      value={ajusteResolved[f.key]}
                      onChange={(e) => handleUpdateAjusteField(f.key, e.target.value)}
                      className="w-[74px] min-h-[36px] rounded-lg border border-slate-300 bg-white px-2 text-right mono text-[13px] font-bold shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mis Fórmulas de Despiece */}
      <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mt-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[17px] font-extrabold">Mis Fórmulas de Despiece</h2>
            <p className="m-0 text-[12px] text-slate-500">
              Guarda tus propios descuentos de corte por marca o sistema
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFormulaModal}
            className="min-h-[36px] px-3 rounded-lg bg-blue-600 text-white text-[12px] font-bold cursor-pointer"
          >
            + Nueva Fórmula
          </button>
        </div>

        {formulas.length === 0 ? (
          <p className="text-[12.5px] text-slate-500 p-3.5 text-center border border-dashed border-slate-200 rounded-xl">
            Aún no guardas fórmulas personalizadas. Modifica los descuentos en Ventanas o Puertas o usa{' '}
            <strong>+ Nueva Fórmula</strong>.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {formulas.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
              >
                <div>
                  <strong className="block text-[13.5px]">{f.nombre}</strong>
                  <span className="text-[11.5px] text-slate-500 mono">
                    {LINEAS_CONFIG[f.linea]?.nombre} · MH:-{f.tolerancias.marcoH} HV:-{f.tolerancias.hojaV} HH:-
                    {f.tolerancias.hojaH}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onEliminarFormula(f.id)}
                  className="px-2.5 py-1 rounded-lg border border-red-200 bg-white text-red-600 text-[12px] font-bold cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[17px] font-extrabold">Historial de Cotizaciones Guardadas</h2>
            <p className="m-0 text-[12px] text-slate-500">Guardado en este equipo ({historial.length})</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-exportar-historial-pdf"
              disabled={historial.length === 0}
              onClick={() => {
                void generarPdfHistorialCotizaciones(historial, taller).then((ok) => {
                  if (ok) {
                    onShowToast('Historial de cotizaciones exportado a PDF', true);
                  } else {
                    onShowToast('Aún no tienes cotizaciones guardadas para exportar');
                  }
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors ${
                historial.length === 0
                  ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
              Exportar PDF
            </button>
            {onOpenReminders && (
              <button
                type="button"
                id="btn-taller-open-reminders"
                onClick={onOpenReminders}
                className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-[12px] font-extrabold text-blue-800 cursor-pointer"
              >
                🔔 Seguimientos{pendingRemindersCount > 0 ? ` (${pendingRemindersCount})` : ''}
              </button>
            )}
            {historial.length > 0 && (
              <button
                type="button"
                onClick={onLimpiarHistorial}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 cursor-pointer"
              >
                Limpiar todo
              </button>
            )}
          </div>
        </div>
        {historial.length === 0 ? (
          <p className="text-[12.5px] text-slate-500 p-4 text-center border border-dashed border-slate-200 rounded-xl">
            Aún no tienes cotizaciones guardadas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <strong className="block text-[13.5px] truncate">{h.referencia}</strong>
                  <span className="text-[12px] text-slate-500">
                    {LINEAS_CONFIG[h.linea]?.nombre} · {h.anchoCm}×{h.altoCm} cm · {COLORES_CONFIG[h.color]?.corto} ·{' '}
                    {h.fecha}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <strong className="mono text-blue-600">{formatMXN(h.total)}</strong>
                  {onScheduleHistorialReminder && (
                    <button
                      type="button"
                      onClick={() => onScheduleHistorialReminder(h)}
                      className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11.5px] font-bold cursor-pointer"
                      title="Programar recordatorio de seguimiento en 24 h"
                    >
                      🔔 Recordar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEliminarHistorial(h.id)}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-red-600 text-[12px] font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Comparativo de Precios de Referencia (PRO) */}
      {refPricesOpen && (
        <div
          id="modal-reference-prices"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ref-prices-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRefPricesOpen(false);
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-start justify-between gap-3">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-extrabold mb-1">
                  {activeRefPrices.updatedLabel || 'Actualizado esta semana'}
                </span>
                <h2 id="ref-prices-title" className="m-0 text-[17px] font-extrabold text-slate-900">
                  Precios de Referencia de Mercado (MXN)
                </h2>
                <p className="m-0 text-[11.5px] text-slate-500 mt-0.5">
                  {activeRefPrices.nota ||
                    'Valores promedio orientativos en México. Verifica siempre con tu distribuidor local.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefPricesOpen(false)}
                aria-label="Cerrar tabla de precios de referencia"
                className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full border-collapse text-[12px] min-w-[440px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
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
                        <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                          <td className="p-2.5">
                            <strong className="block text-slate-900">{item.nombre}</strong>
                            <span className="text-[10.5px] uppercase font-bold text-slate-500">
                              {item.categoria} · por {item.unidad}
                            </span>
                          </td>
                          <td className="p-2.5 text-right mono font-bold text-slate-700">
                            {formatMXN(currentVal)}
                          </td>
                          <td className="p-2.5 text-right mono">
                            <strong className="text-emerald-700">{formatMXN(item.precioSugerido)}</strong>
                            {diff !== 0 && (
                              <span
                                className={`block text-[10px] font-bold ${
                                  diff > 0 ? 'text-amber-700' : 'text-blue-700'
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
              <p className="m-0 mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                ⚠️ Aviso: Estos precios son una referencia orientativa semanal y no representan una cotización oficial de proveedores.
              </p>
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefPricesOpen(false)}
                className="min-h-[42px] px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[13px] font-bold cursor-pointer"
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
        </div>
      )}
    </section>
  );
};
