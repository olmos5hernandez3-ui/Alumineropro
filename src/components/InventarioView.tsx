import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  applyBulkExistenciasPriceAdjustment,
  buildCompactExistenciasList,
  calcularMetrosObraAprobada,
  CATALOGO_PERFILES,
  COLORES_CONFIG,
  ColorId,
  ExistenciasPriceContext,
  HERRAJES_INVENTARIO_CATALOGO,
  HerrajeCategoria,
  INVENTARIO_DEFAULT_MARCA,
  LINEAS_CONFIG,
  LineaId,
  makeInventarioKey,
  parseInventarioKey,
  PerfilCatalogoId,
  resolveExistenciaUnitPrice,
  resumirObrasAprobadas,
  round2,
  TRAMO_COMPROMETIDO_M,
  TRAMO_STD_M,
} from '../utils/alumineroLogic';
import {
  getPerfilFotoUrl,
  HojaCategoriaId,
  HojaVidrioItem,
  ObraAprobadaApartado,
  PerfilFotosMap,
  SobranteItem,
} from '../utils/storageHelpers';
import { PerfilSectionSvg } from './PerfilSectionSvg';
import { PerfilZoomData, PerfilZoomModal } from './PerfilZoomModal';

interface Props {
  inventario: Record<string, number>;
  inventarioHerrajes: Record<string, number>;
  sobrantes: SobranteItem[];
  hojasVidrio: HojaVidrioItem[];
  obrasAprobadas: ObraAprobadaApartado[];
  hojaCount: number;
  perfilFotos: PerfilFotosMap;
  onSetInventario: (key: string, tramos: number) => void;
  onSetInventarioHerraje: (id: string, qty: number) => void;
  onAddSobrante: (item: Omit<SobranteItem, 'id' | 'fecha'>) => void;
  onUpdateSobranteQty: (id: string, cantidad: number) => void;
  onDeleteSobrante: (id: string) => void;
  onAddHojaVidrio: (item: Omit<HojaVidrioItem, 'id' | 'fecha'>) => void;
  onUpdateHojaVidrioQty: (id: string, cantidad: number) => void;
  onDeleteHojaVidrio: (id: string) => void;
  onLimpiarInventario: () => void;
  onAgregarApartado: (item: Omit<ObraAprobadaApartado, 'id' | 'fecha'>) => void;
  onEliminarApartado: (id: string) => void;
  onGoCatalogo: () => void;
  onGoHoja: () => void;
  onGoVidrioOptimizer: () => void;
  onOpenPerfilModal: (perfilId: PerfilCatalogoId) => void;
  invTab?: 'existencias' | 'perfiles' | 'vidrios' | 'herrajes';
  onChangeInvTab?: (tab: 'existencias' | 'perfiles' | 'vidrios' | 'herrajes') => void;
  onPushSubModal?: (sub: 'zoomPerfil') => void;
  onRequestBack?: () => void;
  onRegisterCloseSubModal?: (fn: (() => void) | null) => void;
  onReplaceSubModalWithPerfil?: (perfilId: PerfilCatalogoId) => void;
  existenciasPriceCtx?: ExistenciasPriceContext;
  onSaveExistenciasPrices?: (next: {
    inventarioPreciosUnitarios: Record<string, number>;
    herrajesPrecios: Record<string, number>;
  }) => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const INV_LINEAS: LineaId[] = [
  '3',
  '2',
  'europea',
  'cancel-bano',
  'puerta-abatible',
  'puerta-2',
  'puerta-europea',
  'mosq-fijo',
  'mosq-corredizo',
];

const MARCAS_ALUMINIO = [
  'Alumer',
  'Perfileto',
  'Cuprum',
  'Extrusiones Metálicas',
  'Indalum',
  'Herralum',
  'Perfiles LM',
  'Eurovent',
  'Otra',
];

const HOJA_CATEGORIAS_META: Array<{
  id: HojaCategoriaId;
  label: string;
  badge: string;
  badgeClass: string;
  tonos: Array<{ nombre: string; espesor: number }>;
}> = [
  {
    id: 'vidrio',
    label: 'Vidrio Flotado',
    badge: 'Flotado',
    badgeClass: 'bg-cyan-700 text-white',
    tonos: [
      { nombre: 'Claro', espesor: 6 },
      { nombre: 'Claro 4 mm', espesor: 4 },
      { nombre: 'Filtrasol', espesor: 6 },
      { nombre: 'Tintex Verde', espesor: 6 },
      { nombre: 'Sol Lite', espesor: 6 },
      { nombre: 'Reflecta Ámbar', espesor: 6 },
      { nombre: 'Reflecta Verde', espesor: 6 },
      { nombre: 'Reflecta Azul', espesor: 6 },
    ],
  },
  {
    id: 'templado',
    label: 'Vidrio Templado',
    badge: 'Templado',
    badgeClass: 'bg-blue-700 text-white',
    tonos: [
      { nombre: 'Claro Templado', espesor: 9.5 },
      { nombre: 'Filtrasol Templado', espesor: 9.5 },
      { nombre: 'Tintex Templado', espesor: 9.5 },
      { nombre: 'Esmerilado Templado', espesor: 9.5 },
    ],
  },
  {
    id: 'espejo',
    label: 'Espejo',
    badge: 'Espejo',
    badgeClass: 'bg-violet-700 text-white',
    tonos: [
      { nombre: 'Espejo Plata', espesor: 4 },
      { nombre: 'Espejo Bronce / Ámbar', espesor: 4 },
      { nombre: 'Espejo Gris / Ahumado', espesor: 4 },
    ],
  },
  {
    id: 'plastico',
    label: 'Plástico / Acrílico',
    badge: 'Plástico',
    badgeClass: 'bg-teal-700 text-white',
    tonos: [
      { nombre: 'Acrílico Gota de Agua / Llovizna', espesor: 3 },
      { nombre: 'Acrílico Burbuja / Cristal', espesor: 3 },
      { nombre: 'Poliestireno Grabado', espesor: 2.5 },
      { nombre: 'Policarbonato Celular', espesor: 6 },
    ],
  },
];

const VIDRIO_MEDIDAS_PRESETS = [
  { label: '244 × 122 cm', w: 244, h: 122 },
  { label: '260 × 180 cm', w: 260, h: 180 },
  { label: '330 × 214 cm', w: 330, h: 214 },
  { label: '183 × 122 cm (Acrílico)', w: 183, h: 122 },
  { label: '214 × 165 cm', w: 214, h: 165 },
];

export const InventarioView: React.FC<Props> = ({
  inventario,
  inventarioHerrajes,
  sobrantes,
  hojasVidrio,
  obrasAprobadas,
  hojaCount,
  perfilFotos,
  onSetInventario,
  onSetInventarioHerraje,
  onAddSobrante,
  onUpdateSobranteQty,
  onDeleteSobrante,
  onAddHojaVidrio,
  onUpdateHojaVidrioQty,
  onDeleteHojaVidrio,
  onLimpiarInventario,
  onAgregarApartado,
  onEliminarApartado,
  onGoCatalogo,
  onGoHoja,
  onGoVidrioOptimizer,
  onOpenPerfilModal,
  invTab: controlledInvTab,
  onChangeInvTab,
  onPushSubModal,
  onRequestBack,
  onRegisterCloseSubModal,
  onReplaceSubModalWithPerfil,
  existenciasPriceCtx,
  onSaveExistenciasPrices,
  onShowToast,
}) => {
  const [localInvTab, setLocalInvTab] = useState<'existencias' | 'perfiles' | 'vidrios' | 'herrajes'>('existencias');
  const invTab = controlledInvTab ?? localInvTab;
  const setInvTab = (next: 'existencias' | 'perfiles' | 'vidrios' | 'herrajes') => {
    if (next === invTab) return;
    if (onChangeInvTab) onChangeInvTab(next);
    else setLocalInvTab(next);
  };
  const [expandedExistenciaId, setExpandedExistenciaId] = useState<string | null>(null);
  const [existenciasFiltroTipo, setExistenciasFiltroTipo] = useState<'todos' | 'perfil' | 'herraje' | 'vidrio'>('todos');
  const [existenciasQuery, setExistenciasQuery] = useState('');
  const [selectedExistenciasIds, setSelectedExistenciasIds] = useState<string[]>([]);
  const [bulkPriceMode, setBulkPriceMode] = useState<'incremento' | 'descuento'>('incremento');
  const [bulkPricePct, setBulkPricePct] = useState<string>('10');
  const [lastBulkUndoSnapshot, setLastBulkUndoSnapshot] = useState<{
    inventarioPreciosUnitarios: Record<string, number>;
    herrajesPrecios: Record<string, number>;
    summary: string;
  } | null>(null);

  const effectivePriceCtx: ExistenciasPriceContext = existenciasPriceCtx ?? {
    inventarioPreciosUnitarios: {},
    precioListaTramo: 890,
    rellenoPreciosM2: {},
    herrajesPrecios: {},
  };

  const compactExistencias = useMemo(
    () => buildCompactExistenciasList(inventario, inventarioHerrajes, hojasVidrio),
    [inventario, inventarioHerrajes, hojasVidrio]
  );

  const compactExistenciasFiltradas = useMemo(() => {
    const q = existenciasQuery.trim().toLowerCase();
    return compactExistencias.filter((item) => {
      if (existenciasFiltroTipo !== 'todos' && item.tipo !== existenciasFiltroTipo) return false;
      if (!q) return true;
      return (
        item.titulo.toLowerCase().includes(q) ||
        item.subtitulo.toLowerCase().includes(q) ||
        (item.marca || '').toLowerCase().includes(q)
      );
    });
  }, [compactExistencias, existenciasFiltroTipo, existenciasQuery]);

  const handleQuickDeductExistencia = (item: (typeof compactExistencias)[number], amount = 1) => {
    if (item.tipo === 'perfil' && item.inventarioKey) {
      const next = Math.max(0, round2(item.cantidad - amount));
      onSetInventario(item.inventarioKey, next);
      onShowToast(`Descontado ${amount} tr. de ${item.titulo}`);
    } else if (item.tipo === 'herraje' && item.herrajeId) {
      const next = Math.max(0, Math.round(item.cantidad - amount));
      onSetInventarioHerraje(item.herrajeId, next);
      onShowToast(`Descontado ${amount} de ${item.titulo}`);
    } else if (item.vidrioId) {
      const next = Math.max(0, Math.round(item.cantidad - amount));
      if (next <= 0) {
        onDeleteHojaVidrio(item.vidrioId);
      } else {
        onUpdateHojaVidrioQty(item.vidrioId, next);
      }
      onShowToast(`Descontada ${amount} hoja de ${item.titulo}`);
    }
  };

  const selectedExistenciasSet = useMemo(
    () => new Set(selectedExistenciasIds),
    [selectedExistenciasIds]
  );

  const selectedExistenciasItems = useMemo(
    () => compactExistencias.filter((it) => selectedExistenciasSet.has(it.id)),
    [compactExistencias, selectedExistenciasSet]
  );

  const allVisibleSelected =
    compactExistenciasFiltradas.length > 0 &&
    compactExistenciasFiltradas.every((it) => selectedExistenciasSet.has(it.id));

  const toggleSelectExistencia = (id: string) => {
    setSelectedExistenciasIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllVisible = () => {
    const visibleIds = compactExistenciasFiltradas.map((it) => it.id);
    if (allVisibleSelected) {
      const visibleSet = new Set(visibleIds);
      setSelectedExistenciasIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      setSelectedExistenciasIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleApplyBulkExistenciasPrice = () => {
    const pctNum = Math.abs(Number(bulkPricePct) || 0);
    if (selectedExistenciasItems.length === 0) {
      onShowToast('Selecciona al menos un material de la lista');
      return;
    }
    if (!Number.isFinite(pctNum) || pctNum <= 0) {
      onShowToast('Ingresa un porcentaje mayor a 0 (ej. 5, 10 o 15)');
      return;
    }
    if (bulkPriceMode === 'descuento' && pctNum > 90) {
      onShowToast('El descuento máximo permitido es 90%');
      return;
    }
    const prevSnapshot = {
      inventarioPreciosUnitarios: { ...(effectivePriceCtx.inventarioPreciosUnitarios || {}) },
      herrajesPrecios: { ...(effectivePriceCtx.herrajesPrecios || {}) },
    };
    const res = applyBulkExistenciasPriceAdjustment({
      selectedItems: selectedExistenciasItems,
      mode: bulkPriceMode,
      pct: pctNum,
      ctx: effectivePriceCtx,
    });
    if (res.updatedCount === 0) {
      onShowToast('No se aplicaron cambios de precio');
      return;
    }
    const signLabel = res.signedPct > 0 ? `+${res.signedPct}%` : `${res.signedPct}%`;
    onSaveExistenciasPrices?.({
      inventarioPreciosUnitarios: res.inventarioPreciosUnitarios,
      herrajesPrecios: res.herrajesPrecios,
    });
    setLastBulkUndoSnapshot({
      ...prevSnapshot,
      summary: `${signLabel} en ${res.updatedCount} material(es)`,
    });
    onShowToast(
      `Ajuste ${signLabel} aplicado a ${res.updatedCount} material(es) de inventario`,
      true
    );
  };

  const handleUndoBulkExistenciasPrice = () => {
    if (!lastBulkUndoSnapshot) return;
    onSaveExistenciasPrices?.({
      inventarioPreciosUnitarios: lastBulkUndoSnapshot.inventarioPreciosUnitarios,
      herrajesPrecios: lastBulkUndoSnapshot.herrajesPrecios,
    });
    const prevSummary = lastBulkUndoSnapshot.summary;
    setLastBulkUndoSnapshot(null);
    onShowToast(`Se revirtió el ajuste (${prevSummary})`, true);
  };

  const handleSetSingleExistenciaPrice = (item: (typeof compactExistencias)[number], rawVal: string) => {
    const parsed = Number(rawVal);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const clean = Math.max(1, round2(parsed));
    const nextUnitMap = {
      ...(effectivePriceCtx.inventarioPreciosUnitarios || {}),
      [item.id]: clean,
    };
    const nextHerrajes = { ...(effectivePriceCtx.herrajesPrecios || {}) };
    if (item.tipo === 'herraje' && item.herrajeId) {
      nextHerrajes[item.herrajeId] = clean;
    }
    onSaveExistenciasPrices?.({
      inventarioPreciosUnitarios: nextUnitMap,
      herrajesPrecios: nextHerrajes,
    });
  };
  const [invMarca, setInvMarca] = useState(INVENTARIO_DEFAULT_MARCA);
  const [invMarcaOtra, setInvMarcaOtra] = useState('');
  const [invLinea, setInvLinea] = useState<LineaId>('3');
  const [invColor, setInvColor] = useState<ColorId>('natural');
  const [aprProyecto, setAprProyecto] = useState('');
  const [aprPerfil, setAprPerfil] = useState<PerfilCatalogoId>('cabezal');
  const [aprTramos, setAprTramos] = useState(1);

  // Modo de captura para tramos completos de perfiles (Tramos 6.10 m | m | cm)
  const [perfilInputUnit, setPerfilInputUnit] = useState<'tramos' | 'm' | 'cm'>('tramos');
  const [perfilDraftMap, setPerfilDraftMap] = useState<Record<string, string>>({});

  const handleSelectLinea = (nextLinea: LineaId) => {
    setInvLinea(nextLinea);
  };

  const handleSelectColor = (nextColor: ColorId) => {
    setInvColor(nextColor);
  };

  const handleSelectMarca = (nextMarca: string) => {
    setInvMarca(nextMarca);
  };

  const handleSelectMarcaOtra = (nextVal: string) => {
    setInvMarcaOtra(nextVal);
  };

  const activeMarcaFinal =
    (invMarca === 'Otra' ? invMarcaOtra.trim() : invMarca.trim()) || INVENTARIO_DEFAULT_MARCA;

  // Hojas de Vidrio, Espejo y Plástico (captura en cm o m, almacenado en base cm)
  const [vidCategoria, setVidCategoria] = useState<HojaCategoriaId>('vidrio');
  const [vidTono, setVidTono] = useState('Claro');
  const [vidEspesor, setVidEspesor] = useState(6);
  const [vidUnit, setVidUnit] = useState<'cm' | 'm'>('cm');
  const [vidAnchoCm, setVidAnchoCm] = useState('260');
  const [vidAltoCm, setVidAltoCm] = useState('180');
  const [vidCantidad, setVidCantidad] = useState(1);
  const [vidNota, setVidNota] = useState('');

  // Filtros de Herrajes
  const [herrajeCatFilter, setHerrajeCatFilter] = useState<HerrajeCategoria | 'Todas'>('Todas');
  const [herrajeBusqueda, setHerrajeBusqueda] = useState('');
  const [zoomPerfil, setZoomPerfil] = useState<PerfilZoomData | null>(null);

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

  const totalTramosGlobal = round2(
    Object.values(inventario).reduce((acc, v) => acc + (Number(v) || 0), 0)
  );
  const totalHojasVidrio = hojasVidrio.reduce((acc, h) => acc + Math.max(0, Number(h.cantidad) || 0), 0);
  const totalVidrioM2 = round2(
    hojasVidrio.reduce(
      (acc, h) => acc + ((Number(h.anchoCm) * Number(h.altoCm)) / 10000) * Math.max(0, Number(h.cantidad) || 0),
      0
    )
  );

  const bodegaExistencias = Object.entries(inventario).filter(([, val]) => val > 0);
  const herrajesCategorias = useMemo(
    () => Array.from(new Set(HERRAJES_INVENTARIO_CATALOGO.map((h) => h.categoria))),
    []
  );

  const categoriasVisibles = useMemo(() => {
    const q = herrajeBusqueda.trim().toLowerCase();
    return herrajesCategorias
      .filter((cat) => herrajeCatFilter === 'Todas' || cat === herrajeCatFilter)
      .map((cat) => ({
        cat,
        items: HERRAJES_INVENTARIO_CATALOGO.filter((h) => {
          if (h.categoria !== cat) return false;
          if (!q) return true;
          return (
            h.nombre.toLowerCase().includes(q) ||
            (h.modelo || '').toLowerCase().includes(q) ||
            (h.tamano || '').toLowerCase().includes(q) ||
            (h.color || '').toLowerCase().includes(q)
          );
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [herrajesCategorias, herrajeCatFilter, herrajeBusqueda]);

  const handleApartarManual = () => {
    const proyecto = aprProyecto.trim();
    if (!proyecto) return;
    const key = `${invLinea}__${aprPerfil}__${invColor}`;
    onAgregarApartado({
      proyecto,
      key,
      linea: invLinea,
      perfilId: aprPerfil,
      color: invColor,
      tramos: Math.max(0.5, Number(aprTramos) || 1),
    });
    setAprProyecto('');
  };

  const handleToggleVidUnit = (nextUnit: 'cm' | 'm') => {
    if (nextUnit === vidUnit) return;
    const rawW = Number(vidAnchoCm);
    const rawH = Number(vidAltoCm);
    if (Number.isFinite(rawW) && rawW > 0) {
      setVidAnchoCm(nextUnit === 'm' ? (rawW / 100).toFixed(2) : String(Math.round(rawW * 100)));
    } else {
      setVidAnchoCm(nextUnit === 'm' ? '2.60' : '260');
    }
    if (Number.isFinite(rawH) && rawH > 0) {
      setVidAltoCm(nextUnit === 'm' ? (rawH / 100).toFixed(2) : String(Math.round(rawH * 100)));
    } else {
      setVidAltoCm(nextUnit === 'm' ? '1.80' : '180');
    }
    setVidUnit(nextUnit);
  };

  const handleAgregarHojaVidrio = (e: React.FormEvent) => {
    e.preventDefault();
    const rawW = Number(vidAnchoCm);
    const rawH = Number(vidAltoCm);
    const w = vidUnit === 'm' ? Math.round(rawW * 100) : Math.round(rawW);
    const h = vidUnit === 'm' ? Math.round(rawH * 100) : Math.round(rawH);
    const qty = Math.max(1, Math.round(Number(vidCantidad) || 1));
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 20 || h < 20) {
      onShowToast(
        vidUnit === 'm'
          ? 'Ingresa ancho y alto válidos en metros (mínimo 0.20 m)'
          : 'Ingresa ancho y alto válidos en cm (mínimo 20 cm)'
      );
      return;
    }
    const cleanTono = vidTono.trim() || 'Claro';
    const espNum = Number(vidEspesor) || 6;
    const baseWithoutMm = cleanTono.replace(/\s+\d+(?:\.\d+)?\s*mm$/i, '').trim();
    const tipoNombre = `${baseWithoutMm} ${espNum} mm`;
    onAddHojaVidrio({
      categoria: vidCategoria,
      tono: baseWithoutMm,
      tipoNombre,
      espesorMm: espNum,
      anchoCm: w,
      altoCm: h,
      cantidad: qty,
      nota: vidNota.trim() || undefined,
    });
    setVidNota('');
    setVidCantidad(1);
  };

  return (
    <section id="view-inventario" className="screen-animate">
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        <div>
          <h1 className="m-0 text-[21px] font-extrabold text-white">Mi Inventario de Taller</h1>
          <p className="m-0 text-[12.5px] text-slate-300">
            Existencias reales en bodega, tramos 6.10 m, hojas de vidrio y herrajes
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={onGoVidrioOptimizer}
            className="min-h-[40px] px-3 rounded-xl border border-cyan-400/50 bg-cyan-500/20 text-cyan-100 text-[12px] font-bold cursor-pointer"
          >
            ✂️ Optimizador Vidrio 2D
          </button>
          <button
            type="button"
            onClick={onGoCatalogo}
            className="min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-[12px] font-bold cursor-pointer"
          >
            Catálogo de Perfiles
          </button>
          <button
            type="button"
            onClick={onGoHoja}
            className="min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-[12px] font-bold cursor-pointer"
          >
            Ir a Hoja (<span className="mono">{hojaCount}</span>)
          </button>
        </div>
      </div>

      {/* Selector de pestañas de Inventario */}
      <div className="inv-segmented-tabs grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-[14px] bg-[#13315C] border border-slate-400/30 mb-4">
        <button
          type="button"
          id="inv-tab-existencias"
          onClick={() => setInvTab('existencias')}
          className={`min-h-[44px] rounded-[10px] text-[12.5px] font-extrabold cursor-pointer transition-colors px-2 ${
            invTab === 'existencias'
              ? 'bg-emerald-500 text-white shadow'
              : 'bg-transparent text-emerald-200 hover:bg-white/5'
          }`}
        >
          En Inventario (Existencias) ({compactExistencias.length})
        </button>
        <button
          type="button"
          id="inv-tab-perfiles"
          onClick={() => setInvTab('perfiles')}
          className={`min-h-[44px] rounded-[10px] text-[12.5px] font-extrabold cursor-pointer transition-colors px-2 ${
            invTab === 'perfiles' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Perfiles (6.10 m)
        </button>
        <button
          type="button"
          id="inv-tab-vidrios"
          onClick={() => setInvTab('vidrios')}
          className={`min-h-[44px] rounded-[10px] text-[12.5px] font-extrabold cursor-pointer transition-colors px-2 ${
            invTab === 'vidrios' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Hojas Vidrio ({totalHojasVidrio})
        </button>
        <button
          type="button"
          id="inv-tab-herrajes"
          onClick={() => setInvTab('herrajes')}
          className={`min-h-[44px] rounded-[10px] text-[12.5px] font-extrabold cursor-pointer transition-colors px-2 ${
            invTab === 'herrajes' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Herrajes y Viniles
        </button>
      </div>

      {invTab === 'existencias' ? (
        <div
          id="inv-existencias-compact-panel"
          className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
            <div>
              <h2 className="m-0 text-[17px] font-extrabold text-[#1E293B]">
                En Inventario (Existencias &gt; 0)
              </h2>
              <p className="m-0 text-[12px] text-slate-600">
                Vista compacta solo con perfiles, herrajes y hojas que sí tienen existencia disponible. Toca para ver detalles o descontar al instante.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mono px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11.5px] font-extrabold">
                {compactExistencias.length} con existencia
              </span>
              <button
                type="button"
                onClick={() => setInvTab('perfiles')}
                className="min-h-[34px] px-3 rounded-lg bg-[#0B2545] text-white text-[11.5px] font-extrabold cursor-pointer"
              >
                + Capturar stock
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'todos', label: `Todos (${compactExistencias.length})` },
                  {
                    id: 'perfil',
                    label: `Perfiles (${compactExistencias.filter((i) => i.tipo === 'perfil').length})`,
                  },
                  {
                    id: 'herraje',
                    label: `Herrajes (${compactExistencias.filter((i) => i.tipo === 'herraje').length})`,
                  },
                  {
                    id: 'vidrio',
                    label: `Vidrios (${compactExistencias.filter((i) => i.tipo === 'vidrio').length})`,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setExistenciasFiltroTipo(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11.5px] font-extrabold border cursor-pointer ${
                    existenciasFiltroTipo === f.id
                      ? 'bg-[#0B2545] text-white border-[#0B2545]'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={existenciasQuery}
              onChange={(e) => setExistenciasQuery(e.target.value)}
              placeholder="Filtrar existencia por perfil, marca o herraje..."
              className="w-full sm:w-[260px] min-h-[36px] rounded-lg border border-slate-300 px-3 text-[12.5px] font-semibold bg-slate-50"
            />
          </div>

          {/* Herramienta de ajuste masivo de precio (%) por proveedor */}
          {compactExistencias.length > 0 && (
            <div
              id="inv-bulk-price-panel"
              className="mb-3 p-3 rounded-xl border border-slate-300 bg-slate-50 flex flex-col gap-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <strong className="block text-[13px] font-extrabold text-[#1E293B]">
                    Actualización Masiva de Precios (Proveedor)
                  </strong>
                  <span className="block text-[11.5px] text-slate-600">
                    Marca varios materiales y aplica un incremento o descuento porcentual al instante.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    id="btn-existencias-select-all"
                    onClick={handleToggleSelectAllVisible}
                    className="min-h-[32px] px-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-[11.5px] font-extrabold cursor-pointer"
                  >
                    {allVisibleSelected
                      ? `Quitar visibles (${compactExistenciasFiltradas.length})`
                      : `Seleccionar visibles (${compactExistenciasFiltradas.length})`}
                  </button>
                  {selectedExistenciasItems.length > 0 && (
                    <button
                      type="button"
                      id="btn-existencias-clear-selection"
                      onClick={() => setSelectedExistenciasIds([])}
                      className="min-h-[32px] px-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-[11.5px] font-bold cursor-pointer"
                    >
                      Limpiar ({selectedExistenciasItems.length})
                    </button>
                  )}
                  {lastBulkUndoSnapshot && (
                    <button
                      type="button"
                      id="btn-undo-bulk-existencias-price"
                      onClick={handleUndoBulkExistenciasPrice}
                      className="min-h-[32px] px-2.5 rounded-lg border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11.5px] font-extrabold cursor-pointer"
                    >
                      ↩ Deshacer ({lastBulkUndoSnapshot.summary})
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Tipo de ajuste de precio"
                  className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shrink-0"
                >
                  <button
                    type="button"
                    id="btn-bulk-mode-inc"
                    onClick={() => setBulkPriceMode('incremento')}
                    className={`min-h-[34px] px-2.5 rounded-md text-[11.5px] font-extrabold cursor-pointer transition-colors ${
                      bulkPriceMode === 'incremento'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-transparent text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    + Incremento
                  </button>
                  <button
                    type="button"
                    id="btn-bulk-mode-dec"
                    onClick={() => setBulkPriceMode('descuento')}
                    className={`min-h-[34px] px-2.5 rounded-md text-[11.5px] font-extrabold cursor-pointer transition-colors ${
                      bulkPriceMode === 'descuento'
                        ? 'bg-rose-600 text-white'
                        : 'bg-transparent text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    − Descuento
                  </button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    id="input-bulk-price-pct"
                    type="number"
                    min="0.5"
                    max={bulkPriceMode === 'descuento' ? '90' : '200'}
                    step="0.5"
                    value={bulkPricePct}
                    onChange={(e) => setBulkPricePct(e.target.value)}
                    aria-label="Porcentaje de ajuste de precio"
                    className="w-[74px] min-h-[36px] rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-extrabold text-right mono text-slate-900"
                  />
                  <span className="text-[13px] font-extrabold text-slate-700">%</span>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  {[5, 10, 15, 20].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBulkPricePct(String(preset))}
                      className={`min-h-[32px] px-2 rounded-lg border text-[11px] font-extrabold mono cursor-pointer ${
                        Number(bulkPricePct) === preset
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {bulkPriceMode === 'incremento' ? `+${preset}%` : `-${preset}%`}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  id="btn-apply-bulk-existencias-price"
                  disabled={selectedExistenciasItems.length === 0}
                  onClick={handleApplyBulkExistenciasPrice}
                  className={`ml-auto min-h-[38px] px-3.5 rounded-lg text-[12px] font-extrabold cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                    bulkPriceMode === 'incremento'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  Aplicar {bulkPriceMode === 'incremento' ? '+' : '−'}
                  {Math.abs(Number(bulkPricePct) || 0)}% a {selectedExistenciasItems.length}{' '}
                  {selectedExistenciasItems.length === 1 ? 'material' : 'materiales'}
                </button>
              </div>
            </div>
          )}

          {compactExistenciasFiltradas.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <p className="m-0 text-[13.5px] font-extrabold text-slate-700">
                {compactExistencias.length === 0
                  ? 'Aún no tienes materiales con existencia mayor a 0.'
                  : 'Ningún material coincide con ese filtro.'}
              </p>
              <p className="m-0 mt-1 text-[12px] text-slate-500">
                Agrega existencias en las pestañas Perfiles (6.10 m), Hojas Vidrio o Herrajes y aparecerán resumidas aquí.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {compactExistenciasFiltradas.map((item) => {
                const isExpanded = expandedExistenciaId === item.id;
                const isSelected = selectedExistenciasSet.has(item.id);
                const priceInfo = resolveExistenciaUnitPrice(item, effectivePriceCtx);
                const previewPct = Math.abs(Number(bulkPricePct) || 0);
                const previewFactor =
                  bulkPriceMode === 'descuento'
                    ? Math.max(0.1, 1 - Math.min(90, previewPct) / 100)
                    : 1 + Math.min(200, previewPct) / 100;
                const previewNextPrice = Math.max(1, round2(priceInfo.price * previewFactor));
                const badgeStyle =
                  item.tipo === 'perfil'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : item.tipo === 'herraje'
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : 'bg-cyan-100 text-cyan-900 border-cyan-200';
                const badgeText =
                  item.tipo === 'perfil' ? 'Perfil' : item.tipo === 'herraje' ? 'Herraje' : 'Hoja';

                return (
                  <div
                    key={item.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                      <label className="inline-flex items-center cursor-pointer shrink-0 pr-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectExistencia(item.id)}
                          aria-label={`Seleccionar ${item.titulo} para ajuste de precio`}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedExistenciaId((prev) => (prev === item.id ? null : item.id))
                        }
                        aria-expanded={isExpanded}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-extrabold uppercase shrink-0 ${badgeStyle}`}
                        >
                          {badgeText}
                        </span>
                        {item.marca && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white text-[10px] font-extrabold shrink-0">
                            {item.marca}
                          </span>
                        )}
                        <span className="text-[13px] font-extrabold text-[#1E293B] truncate">
                          {item.titulo}
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <span
                          className="mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-900 text-[11.5px] font-extrabold tabular-nums"
                          title={`Precio unitario actual por ${priceInfo.unitLabel}`}
                        >
                          ${priceInfo.price.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/{priceInfo.unitLabel}
                          {isSelected && previewPct > 0 && (
                            <span
                              className={`ml-1 font-extrabold ${
                                bulkPriceMode === 'incremento' ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              → ${previewNextPrice.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </span>
                        <span className="mono px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-[12px] font-extrabold tabular-nums">
                          {item.cantidad} {item.unidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickDeductExistencia(item, 1)}
                          title={`Descontar 1 ${item.unidad} de ${item.titulo}`}
                          className="min-h-[30px] px-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11.5px] font-extrabold cursor-pointer"
                        >
                          −1
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-2.5 pt-1.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                        <div className="text-slate-600 font-semibold">{item.subtitulo}</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                            <span>Precio ({priceInfo.unitLabel}): $</span>
                            <input
                              type="number"
                              min="1"
                              step="0.5"
                              defaultValue={priceInfo.price}
                              key={`${item.id}-${priceInfo.price}`}
                              onBlur={(e) => handleSetSingleExistenciaPrice(item, e.target.value)}
                              className="w-[82px] min-h-[28px] rounded-md border border-slate-300 bg-white px-2 text-[11.5px] font-extrabold mono text-slate-900"
                            />
                          </label>
                          {item.tipo === 'perfil' && (
                            <button
                              type="button"
                              onClick={() => handleQuickDeductExistencia(item, 0.5)}
                              className="px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-extrabold cursor-pointer"
                            >
                              −0.5 tr.
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleQuickDeductExistencia(item, 1)}
                            className="px-2.5 py-1 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-[11px] font-extrabold cursor-pointer"
                          >
                            Descontar 1 {item.unidad}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.tipo === 'perfil' && item.inventarioKey) {
                                onSetInventario(item.inventarioKey, round2(item.cantidad + 1));
                              } else if (item.tipo === 'herraje' && item.herrajeId) {
                                onSetInventarioHerraje(item.herrajeId, item.cantidad + 1);
                              } else if (item.vidrioId) {
                                onUpdateHojaVidrioQty(item.vidrioId, item.cantidad + 1);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-extrabold cursor-pointer"
                          >
                            +1 {item.unidad}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : invTab === 'vidrios' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold">Registrar Hojas (Vidrio, Espejo y Plástico)</h2>
                <p className="m-0 text-[12px] text-slate-600">
                  Control exacto por categoría, tono y espesor para el Optimizador de Corte 2D
                </p>
              </div>
              <span className="mono text-[12px] font-extrabold text-cyan-800 bg-cyan-50 border border-cyan-300 px-2.5 py-1 rounded-lg">
                {totalHojasVidrio} hojas · {totalVidrioM2.toFixed(2)} m²
              </span>
            </div>

            <form onSubmit={handleAgregarHojaVidrio} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
              <div>
                <div className="text-[11px] font-bold text-slate-600 mb-1.5">Categoría del material</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {HOJA_CATEGORIAS_META.map((cat) => {
                    const active = vidCategoria === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        id={`btn-inv-cat-${cat.id}`}
                        onClick={() => {
                          setVidCategoria(cat.id);
                          const first = cat.tonos[0];
                          if (first) {
                            setVidTono(first.nombre.replace(/\s+\d+(?:\.\d+)?\s*mm$/i, ''));
                            setVidEspesor(first.espesor);
                          }
                          if (cat.id === 'plastico') {
                            setVidAnchoCm(vidUnit === 'm' ? '1.83' : '183');
                            setVidAltoCm(vidUnit === 'm' ? '1.22' : '122');
                          }
                        }}
                        className={`min-h-[38px] px-2 py-1.5 rounded-lg text-[11.5px] font-extrabold border cursor-pointer ${
                          active
                            ? 'bg-[#0B2545] text-white border-[#0B2545]'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-600 mb-1.5">Tono / acabado rápido</div>
                <div className="flex flex-wrap gap-1.5">
                  {(HOJA_CATEGORIAS_META.find((c) => c.id === vidCategoria)?.tonos || []).map((vp) => {
                    const cleanName = vp.nombre.replace(/\s+\d+(?:\.\d+)?\s*mm$/i, '');
                    const active = vidTono.toLowerCase() === cleanName.toLowerCase() && vidEspesor === vp.espesor;
                    return (
                      <button
                        key={vp.nombre}
                        type="button"
                        onClick={() => {
                          setVidTono(cleanName);
                          setVidEspesor(vp.espesor);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold border cursor-pointer ${
                          active
                            ? 'bg-cyan-700 text-white border-cyan-800'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {vp.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="inp-vidrio-tipo" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tono / Material *
                  </label>
                  <input
                    id="inp-vidrio-tipo"
                    type="text"
                    value={vidTono}
                    onChange={(e) => setVidTono(e.target.value)}
                    placeholder="Ej. Reflecta Ámbar, Espejo Plata, Gota de Agua..."
                    className="w-full min-h-[40px] rounded-xl border border-slate-300 px-3 text-[13px] font-semibold bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="inp-vidrio-espesor" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Espesor (mm)
                  </label>
                  <input
                    id="inp-vidrio-espesor"
                    type="number"
                    min={2}
                    max={25}
                    step={0.5}
                    value={vidEspesor}
                    onChange={(e) => setVidEspesor(Number(e.target.value) || 6)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-300 px-3 mono text-[13px] font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="text-[11px] font-bold text-slate-600">
                    Medidas estándar de fábrica ({vidUnit})
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                    <button
                      type="button"
                      id="btn-vidrio-unit-cm"
                      onClick={() => handleToggleVidUnit('cm')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold cursor-pointer ${
                        vidUnit === 'cm' ? 'bg-[#0B2545] text-white' : 'text-slate-600'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      id="btn-vidrio-unit-m"
                      onClick={() => handleToggleVidUnit('m')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold cursor-pointer ${
                        vidUnit === 'm' ? 'bg-[#0B2545] text-white' : 'text-slate-600'
                      }`}
                    >
                      m
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VIDRIO_MEDIDAS_PRESETS.map((m) => {
                    const labelPreset =
                      vidUnit === 'm'
                        ? `${(m.w / 100).toFixed(2)} × ${(m.h / 100).toFixed(2)} m${m.label.includes('Acrílico') ? ' (Acrílico)' : ''}`
                        : m.label;
                    const wCurCm =
                      vidUnit === 'm' ? Math.round((Number(vidAnchoCm) || 0) * 100) : Math.round(Number(vidAnchoCm) || 0);
                    const hCurCm =
                      vidUnit === 'm' ? Math.round((Number(vidAltoCm) || 0) * 100) : Math.round(Number(vidAltoCm) || 0);
                    const isPresetActive = wCurCm === m.w && hCurCm === m.h;
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => {
                          setVidAnchoCm(vidUnit === 'm' ? (m.w / 100).toFixed(2) : String(m.w));
                          setVidAltoCm(vidUnit === 'm' ? (m.h / 100).toFixed(2) : String(m.h));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold mono border cursor-pointer ${
                          isPresetActive
                            ? 'bg-cyan-600 text-white border-cyan-700'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {labelPreset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="inp-vidrio-ancho" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ancho ({vidUnit})
                  </label>
                  <input
                    id="inp-vidrio-ancho"
                    type="number"
                    min={vidUnit === 'm' ? 0.2 : 20}
                    max={vidUnit === 'm' ? 6 : 600}
                    step={vidUnit === 'm' ? 0.01 : 1}
                    value={vidAnchoCm}
                    onChange={(e) => setVidAnchoCm(e.target.value)}
                    placeholder={vidUnit === 'm' ? 'Ej. 2.60' : 'Ej. 260'}
                    className="w-full min-h-[40px] rounded-xl border border-slate-300 px-2.5 mono text-[13px] font-bold bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="inp-vidrio-alto" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Alto ({vidUnit})
                  </label>
                  <input
                    id="inp-vidrio-alto"
                    type="number"
                    min={vidUnit === 'm' ? 0.2 : 20}
                    max={vidUnit === 'm' ? 6 : 600}
                    step={vidUnit === 'm' ? 0.01 : 1}
                    value={vidAltoCm}
                    onChange={(e) => setVidAltoCm(e.target.value)}
                    placeholder={vidUnit === 'm' ? 'Ej. 1.80' : 'Ej. 180'}
                    className="w-full min-h-[40px] rounded-xl border border-slate-300 px-2.5 mono text-[13px] font-bold bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="inp-vidrio-qty" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Hojas
                  </label>
                  <input
                    id="inp-vidrio-qty"
                    type="number"
                    min={1}
                    step={1}
                    value={vidCantidad}
                    onChange={(e) => setVidCantidad(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    className="w-full min-h-[40px] rounded-xl border border-slate-300 px-2.5 mono text-[13px] font-bold bg-white text-center"
                  />
                </div>
              </div>

              {(() => {
                const rw = Number(vidAnchoCm);
                const rh = Number(vidAltoCm);
                if (!Number.isFinite(rw) || !Number.isFinite(rh) || rw <= 0 || rh <= 0) return null;
                const wCmEq = vidUnit === 'm' ? Math.round(rw * 100) : Math.round(rw);
                const hCmEq = vidUnit === 'm' ? Math.round(rh * 100) : Math.round(rh);
                const wMEq = (wCmEq / 100).toFixed(2);
                const hMEq = (hCmEq / 100).toFixed(2);
                const areaM2Eq = round2((wCmEq * hCmEq) / 10000);
                return (
                  <div
                    id="vidrio-unit-preview"
                    className="px-3 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-[11.5px] font-bold text-cyan-900 mono flex flex-wrap items-center justify-between gap-2"
                  >
                    <span>
                      Equivalencia: {vidUnit === 'm' ? `= ${wCmEq} × ${hCmEq} cm` : `= ${wMEq} × ${hMEq} m`}
                    </span>
                    <span className="text-cyan-800">Área: {areaM2Eq.toFixed(2)} m²</span>
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-2">
                <input
                  id="inp-vidrio-nota"
                  type="text"
                  value={vidNota}
                  onChange={(e) => setVidNota(e.target.value)}
                  placeholder="Rack / proveedor / nota opcional"
                  className="flex-1 min-w-[160px] min-h-[40px] rounded-xl border border-slate-300 px-3 text-[12.5px] bg-white"
                />
                <button
                  type="submit"
                  id="btn-add-hoja-vidrio"
                  className="min-h-[40px] px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-[13px] font-extrabold cursor-pointer whitespace-nowrap"
                >
                  + Agregar Hoja
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold">Hojas en Existencia</h2>
                <p className="m-0 text-[12px] text-slate-600">
                  El Optimizador de Vidrio 2D descuenta y prioriza automáticamente estas hojas
                </p>
              </div>
              <button
                type="button"
                onClick={onGoVidrioOptimizer}
                className="min-h-[38px] px-3 rounded-xl bg-[#0B2545] text-white text-[12px] font-extrabold cursor-pointer"
              >
                ✂️ Ir a Optimizar 2D
              </button>
            </div>

            {hojasVidrio.length === 0 ? (
              <p className="text-[12.5px] text-slate-500 p-5 text-center border border-dashed border-slate-300 rounded-xl">
                Aún no registras hojas completas o retazos rectangulares de vidrio en taller.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[540px] overflow-y-auto pr-1">
                {hojasVidrio.map((hv) => {
                  const areaTotal = round2(((hv.anchoCm * hv.altoCm) / 10000) * hv.cantidad);
                  const catMeta =
                    HOJA_CATEGORIAS_META.find((c) => c.id === hv.categoria) ||
                    (/espejo/i.test(hv.tipoNombre)
                      ? HOJA_CATEGORIAS_META[2]
                      : /acr[ií]lico|poliestireno|policarbonato/i.test(hv.tipoNombre)
                        ? HOJA_CATEGORIAS_META[3]
                        : /templado/i.test(hv.tipoNombre)
                          ? HOJA_CATEGORIAS_META[1]
                          : HOJA_CATEGORIAS_META[0]);
                  return (
                    <div
                      key={hv.id}
                      className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-cyan-50/70 border-[1.5px] border-cyan-300 text-[#1E293B]"
                    >
                      <div className="min-w-[160px] flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${catMeta.badgeClass}`}>
                            {catMeta.badge}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-white text-[10px] font-extrabold uppercase">
                            {hv.espesorMm} mm
                          </span>
                          <strong className="text-[13.5px] text-[#1E293B]">{hv.tipoNombre}</strong>
                        </div>
                        <div className="mono text-[12px] font-bold text-slate-700 mt-0.5">
                          {hv.anchoCm} × {hv.altoCm} cm ({(hv.anchoCm / 100).toFixed(2)} × {(hv.altoCm / 100).toFixed(2)} m) ·{' '}
                          <span className="text-cyan-800">{hv.cantidad} hoja(s)</span> ({areaTotal.toFixed(2)} m²)
                        </div>
                        {hv.nota && <div className="text-[11px] text-slate-600">{hv.nota}</div>}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Restar hoja ${hv.tipoNombre}`}
                          onClick={() =>
                            hv.cantidad <= 1
                              ? onDeleteHojaVidrio(hv.id)
                              : onUpdateHojaVidrioQty(hv.id, hv.cantidad - 1)
                          }
                          className="w-8 h-8 rounded-lg border border-cyan-400 bg-white text-[#1E293B] font-extrabold cursor-pointer"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          aria-label={`Sumar hoja ${hv.tipoNombre}`}
                          onClick={() => onUpdateHojaVidrioQty(hv.id, hv.cantidad + 1)}
                          className="w-8 h-8 rounded-lg border border-cyan-400 bg-white text-[#1E293B] font-extrabold cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar hoja ${hv.tipoNombre}`}
                          onClick={() => onDeleteHojaVidrio(hv.id)}
                          className="px-2 h-8 rounded-lg border border-red-300 bg-white text-red-600 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : invTab === 'herrajes' ? (
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="m-0 text-[17px] font-extrabold">
                Herrajes, Viniles, Chapas, Jaladeras y Escuadras
              </h2>
              <p className="m-0 text-[12px] text-slate-500">
                Incluye Carretillas, categoría Viniles por tamaño/modelo, más colores en Chapas/Jaladeras y modelos de Escuadras
              </p>
            </div>
            <span className="mono text-[12px] font-bold text-blue-700">
              {HERRAJES_INVENTARIO_CATALOGO.length} artículos
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {(['Todas', ...herrajesCategorias] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setHerrajeCatFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold border cursor-pointer ${
                  herrajeCatFilter === cat
                    ? 'bg-[#0B2545] text-white border-[#0B2545]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <input
              type="search"
              value={herrajeBusqueda}
              onChange={(e) => setHerrajeBusqueda(e.target.value)}
              placeholder="Buscar vinil, chapa, jaladera, color o escuadra (ej. Negro, #11, tetón, multipunto...)"
              className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-semibold bg-white"
            />
          </div>

          {categoriasVisibles.length === 0 ? (
            <p className="text-[13px] text-slate-500 p-5 text-center border border-dashed border-slate-200 rounded-xl">
              No se encontraron herrajes o viniles con ese filtro.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categoriasVisibles.map(({ cat, items }) => (
                <div key={cat} className="border border-slate-300 rounded-2xl p-3.5 bg-slate-50/70">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <h3 className="m-0 text-[13.5px] font-extrabold text-blue-700 uppercase tracking-wide">
                      {cat}
                    </h3>
                    <span className="mono text-[11px] font-bold text-slate-600">{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((h) => {
                      const val = Number(inventarioHerrajes[h.id] || 0);
                      const metaParts = [h.modelo, h.tamano, h.color].filter(Boolean);
                      return (
                        <div
                          key={h.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-300 text-[#1E293B]"
                        >
                          <div className="min-w-[150px] flex-1">
                            <strong className="block text-[13px] text-[#1E293B]">{h.nombre}</strong>
                            {metaParts.length > 0 && (
                              <span className="block text-[11px] text-blue-700 font-semibold">
                                {metaParts.join(' · ')}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 mono">
                              Disponible: {val} {h.unidad}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Restar ${h.nombre}`}
                              onClick={() => onSetInventarioHerraje(h.id, Math.max(0, val - 1))}
                              className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-[17px] font-extrabold cursor-pointer"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              aria-label={`Cantidad de ${h.nombre}`}
                              value={val}
                              onChange={(e) =>
                                onSetInventarioHerraje(h.id, Math.max(0, Number(e.target.value) || 0))
                              }
                              className="w-16 min-h-[36px] rounded-lg border border-slate-200 text-center mono text-[13px] font-bold"
                            />
                            <button
                              type="button"
                              aria-label={`Sumar ${h.nombre}`}
                              onClick={() => onSetInventarioHerraje(h.id, val + 1)}
                              className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-[17px] font-extrabold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
          <div className="flex flex-col gap-4">
            <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="m-0 text-[17px] font-extrabold">1. Selecciona Marca, Línea y Acabado</h2>
                  <p className="m-0 text-[12px] text-slate-600">
                    Actualiza tus existencias en tramos completos de 6.10 m por marca y color
                  </p>
                </div>
                <span className="mono text-[12px] font-extrabold text-blue-600 text-right">
                  {totalTramosGlobal} tramos ({round2(totalTramosGlobal * TRAMO_STD_M)} m)
                </span>
              </div>

              <div className="mb-3">
                <label htmlFor="sel-inv-marca" className="block text-[11px] font-bold text-slate-600 mb-1">
                  Marca de aluminio (para tramos completos 6.10 m)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="sel-inv-marca"
                    value={invMarca}
                    onChange={(e) => handleSelectMarca(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-300 px-2.5 text-[12.5px] font-semibold bg-white"
                  >
                    {MARCAS_ALUMINIO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {invMarca === 'Otra' && (
                    <input
                      id="inp-inv-marca-otra"
                      type="text"
                      value={invMarcaOtra}
                      onChange={(e) => handleSelectMarcaOtra(e.target.value)}
                      placeholder="Escribe la marca..."
                      className="w-full min-h-[40px] rounded-xl border border-slate-300 px-3 text-[12.5px] font-semibold bg-white"
                    />
                  )}
                </div>
              </div>

              <div id="inv-lineas-grid" className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {INV_LINEAS.map((lid) => {
                  const l = LINEAS_CONFIG[lid];
                  const active = invLinea === lid;
                  return (
                    <button
                      key={lid}
                      type="button"
                      data-line-active={active ? 'true' : 'false'}
                      aria-pressed={active}
                      onClick={() => handleSelectLinea(lid)}
                      className={`min-h-[54px] p-2.5 rounded-xl text-left cursor-pointer transition-all ${
                        active
                          ? 'border-2 border-emerald-400 bg-emerald-950/75 text-white shadow-md'
                          : 'border border-slate-300 bg-slate-100 text-[#1E293B] hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="block text-[12px] font-extrabold leading-tight">{l.nombre}</span>
                        {active && (
                          <span className="line-active-badge text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-400/20 border border-emerald-300/60 text-emerald-200 shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className={`block text-[10.5px] mt-0.5 ${active ? 'text-emerald-100' : 'text-slate-600'}`}>
                        Tramo 6.10 m
                      </span>
                    </button>
                  );
                })}
              </div>

              <div id="inv-colores-grid" className="grid grid-cols-2 gap-2">
                {Object.values(COLORES_CONFIG).map((c) => {
                  const active = invColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-color-active={active ? 'true' : 'false'}
                      aria-pressed={active}
                      onClick={() => handleSelectColor(c.id)}
                      className={`flex items-center justify-between gap-2 min-h-[46px] px-2.5 py-2 rounded-xl border text-left cursor-pointer transition-all ${
                        active
                          ? 'border-2 border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm'
                          : 'border-slate-300 bg-white text-[#1E293B] hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-5 h-5 rounded-md border border-slate-300 shrink-0"
                          style={{ background: c.swatch }}
                        />
                        <span className="block text-[12.5px] font-bold truncate">{c.corto}</span>
                      </div>
                      {active && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-600 text-white shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div>
                  <h2 className="m-0 text-[17px] font-extrabold">Resumen de Bodega (Con existencia)</h2>
                  <p className="m-0 text-[12px] text-slate-500">Perfiles registrados mayores a 0 m</p>
                </div>
                {bodegaExistencias.length > 0 && (
                  <button
                    type="button"
                    onClick={onLimpiarInventario}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-red-600 text-[12px] font-bold cursor-pointer"
                  >
                    Poner en 0
                  </button>
                )}
              </div>
              {bodegaExistencias.length === 0 ? (
                <p className="text-[12.5px] text-slate-500 p-3.5 text-center border border-dashed border-slate-200 rounded-xl">
                  Aún no tienes tramos completos registrados en bodega.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {bodegaExistencias.map(([k, val]) => {
                    const { linea: lid, perfilId: pid, color: cid, marca } = parseInventarioKey(k);
                    const pNombre = CATALOGO_PERFILES.find((p) => p.id === pid)?.nombre || pid;
                    const colorCfg = COLORES_CONFIG[cid] || COLORES_CONFIG.natural;
                    const lineaNombre = LINEAS_CONFIG[lid]?.nombre || lid;
                    return (
                      <div key={k} className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-slate-100 text-[12.5px] min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            data-preserve-light="true"
                            onClick={() => {
                              const pItem = CATALOGO_PERFILES.find((p) => p.id === pid);
                              openZoomPerfil({
                                perfilId: pid,
                                nombre: pNombre,
                                codigo: marca || pItem?.codigoRef || undefined,
                                subtitulo: `${marca ? `${marca} · ` : ''}${lineaNombre} · ${colorCfg.corto} · ${val} ${val === 1 ? 'tramo' : 'tramos'} (${round2(val * TRAMO_STD_M)} m)`,
                                fotoRealUrl: getPerfilFotoUrl(perfilFotos, pid, lid),
                              });
                            }}
                            title={`Ampliar dibujo técnico de ${pNombre}`}
                            aria-label={`Ampliar dibujo técnico de ${pNombre}`}
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-400/40 flex items-center justify-center shrink-0 p-0.5 cursor-zoom-in transition-all active:scale-95"
                          >
                            <PerfilSectionSvg
                              perfilId={pid}
                              fotoRealUrl={getPerfilFotoUrl(perfilFotos, pid, lid)}
                              size={22}
                            />
                          </button>
                          <div className="min-w-0 flex flex-wrap items-center gap-1.5 break-words">
                            {marca && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                                {marca}
                              </span>
                            )}
                            <strong>{pNombre}</strong>
                            <span className="text-slate-500">· {lineaNombre} ·</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-slate-300 bg-slate-50 text-[11px] font-bold">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0"
                                style={{ background: colorCfg.swatch }}
                              />
                              {colorCfg.corto}
                            </span>
                          </div>
                        </div>
                        <span className="mono font-extrabold text-emerald-700 shrink-0">
                          {val} {val === 1 ? 'tramo' : 'tramos'} · {round2(val * TRAMO_STD_M).toFixed(2)} m ({Math.round(val * TRAMO_STD_M * 100)} cm)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
              <h2 className="m-0 text-[17px] font-extrabold">Obras Aprobadas (Stock Comprometido)</h2>
              <p className="m-0 text-[12px] text-slate-500 mb-2.5">
                Tramos apartados en proyectos aprobados para no contarlos dos veces (tramo de {TRAMO_COMPROMETIDO_M.toFixed(2)} m)
              </p>

              {(() => {
                const resumenObras = resumirObrasAprobadas(obrasAprobadas, TRAMO_COMPROMETIDO_M);
                return (
                  <div
                    id="obras-aprobadas-resumen"
                    className="grid grid-cols-2 gap-2 mb-3"
                  >
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="block text-[10.5px] font-extrabold uppercase tracking-wide text-amber-800">
                        Total comprometido
                      </span>
                      <strong className="block mono text-[16px] font-extrabold text-amber-950 mt-0.5">
                        {resumenObras.totalMetrosComprometidos.toFixed(2)} m
                      </strong>
                      <span className="block text-[11px] text-amber-800 font-semibold">
                        {resumenObras.totalTramos} {resumenObras.totalTramos === 1 ? 'tramo' : 'tramos'} en {resumenObras.totalApartados} {resumenObras.totalApartados === 1 ? 'obra' : 'obras'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="block text-[10.5px] font-extrabold uppercase tracking-wide text-emerald-800">
                        Metros libres estimados
                      </span>
                      <strong className="block mono text-[16px] font-extrabold text-emerald-950 mt-0.5">
                        {resumenObras.totalMetrosLibres.toFixed(2)} m
                      </strong>
                      <span className="block text-[11px] text-emerald-800 font-semibold">
                        Balance disponible en obra
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <div className="text-[11.5px] font-extrabold text-slate-600">
                  Apartar tramo de {LINEAS_CONFIG[invLinea].nombre} · {COLORES_CONFIG[invColor].corto}
                </div>
                <input
                  type="text"
                  value={aprProyecto}
                  onChange={(e) => setAprProyecto(e.target.value)}
                  placeholder="Nombre de la obra aprobada (Ej. Casa Sr. López)"
                  className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-[13px] bg-white"
                />
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={aprPerfil}
                    onChange={(e) => setAprPerfil(e.target.value as PerfilCatalogoId)}
                    className="flex-1 min-w-[140px] min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-[12.5px] bg-white"
                  >
                    {CATALOGO_PERFILES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={aprTramos}
                    onChange={(e) => setAprTramos(Math.max(0.5, Number(e.target.value) || 0.5))}
                    className="w-20 min-h-[40px] rounded-xl border border-slate-200 text-center mono text-[13px] bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApartarManual}
                    className="min-h-[40px] px-3 rounded-xl bg-blue-600 text-white text-[12.5px] font-bold cursor-pointer"
                  >
                    + Apartar
                  </button>
                </div>
                <div className="text-[11px] font-semibold text-slate-600 mono">
                  Vista previa: {calcularMetrosObraAprobada(aprTramos, TRAMO_COMPROMETIDO_M).resumenTexto}
                </div>
              </div>

              <div className="mt-2.5 flex flex-col gap-1.5">
                {obrasAprobadas.length === 0 ? (
                  <p className="text-[12px] text-slate-500 p-3 text-center border border-dashed border-slate-200 rounded-xl">
                    No hay tramos comprometidos en otras obras aprobadas.
                  </p>
                ) : (
                  obrasAprobadas.map((ob) => {
                    const metrosInfo = calcularMetrosObraAprobada(ob.tramos, TRAMO_COMPROMETIDO_M);
                    return (
                      <div
                        key={ob.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[12px]"
                      >
                        <div className="min-w-0 flex-1">
                          <strong className="block text-amber-950 break-words">{ob.proyecto}</strong>
                          <span className="block text-amber-900 font-semibold mt-0.5">
                            {CATALOGO_PERFILES.find((p) => p.id === ob.perfilId)?.nombre} · {ob.tramos}{' '}
                            {ob.tramos === 1 ? 'tramo' : 'tramos'}
                          </span>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 mono text-[11px] font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900">
                              {metrosInfo.metrosComprometidos.toFixed(2)} m comprometidos
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded border ${
                                metrosInfo.metrosLibres > 0
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : 'bg-slate-100 border-slate-300 text-slate-600'
                              }`}
                            >
                              {metrosInfo.metrosLibres > 0
                                ? `${metrosInfo.metrosLibres.toFixed(2)} m libres del tramo de 6 m`
                                : '0.00 m libres'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onEliminarApartado(ob.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold cursor-pointer shrink-0"
                        >
                          Liberar
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold">
                  2. Perfiles — {LINEAS_CONFIG[invLinea].nombre} ({COLORES_CONFIG[invColor].corto})
                </h2>
                <p className="m-0 text-[12px] text-slate-600">
                  Captura por tramos de 6.10 m, metros (m) o centímetros (cm)
                </p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 p-1 shrink-0">
                {(['tramos', 'm', 'cm'] as const).map((unitOpt) => (
                  <button
                    key={unitOpt}
                    type="button"
                    id={`btn-perfil-unit-${unitOpt}`}
                    onClick={() => {
                      setPerfilInputUnit(unitOpt);
                      setPerfilDraftMap({});
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11.5px] font-extrabold cursor-pointer transition-colors ${
                      perfilInputUnit === unitOpt
                        ? 'bg-[#0B2545] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white/70'
                    }`}
                  >
                    {unitOpt === 'tramos' ? 'Tramos' : unitOpt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 mb-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 flex-wrap text-[11.5px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                  {activeMarcaFinal}
                </span>
                <span className="text-slate-600">Registrando en color:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-blue-400 bg-blue-50 text-blue-800 font-extrabold">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0"
                    style={{ background: COLORES_CONFIG[invColor].swatch }}
                  />
                  {COLORES_CONFIG[invColor].corto}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {Object.values(COLORES_CONFIG).map((c) => {
                  const active = invColor === c.id;
                  return (
                    <button
                      key={`quick-color-${c.id}`}
                      type="button"
                      onClick={() => handleSelectColor(c.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                        style={{ background: c.swatch }}
                      />
                      {c.corto}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col max-h-[680px] overflow-y-auto pr-1">
              {CATALOGO_PERFILES.map((perfil) => {
                const brandedKey = makeInventarioKey(invLinea, perfil.id, invColor, activeMarcaFinal);
                const legacyKey = makeInventarioKey(invLinea, perfil.id, invColor);
                const useLegacy =
                  activeMarcaFinal === INVENTARIO_DEFAULT_MARCA &&
                  inventario[brandedKey] === undefined &&
                  Number(inventario[legacyKey] || 0) > 0;
                const key = useLegacy ? legacyKey : brandedKey;
                const tramos = Number(inventario[key] || 0);
                const metros = round2(tramos * TRAMO_STD_M);
                const cmTotales = Math.round(tramos * TRAMO_STD_M * 100);
                const displayedFromStore =
                  perfilInputUnit === 'tramos'
                    ? String(tramos)
                    : perfilInputUnit === 'm'
                      ? String(metros)
                      : String(cmTotales);
                const inputDisplayVal =
                  perfilDraftMap[key] !== undefined ? perfilDraftMap[key] : displayedFromStore;
                const parsedDraft = Number(inputDisplayVal);
                const hasValidDraft = Number.isFinite(parsedDraft) && parsedDraft > 0;
                const eqFromDraft =
                  perfilInputUnit === 'm' && hasValidDraft
                    ? `= ${Math.round(parsedDraft * 100)} cm (${round2(parsedDraft / TRAMO_STD_M).toFixed(2)} tr.)`
                    : perfilInputUnit === 'cm' && hasValidDraft
                      ? `= ${(parsedDraft / 100).toFixed(2)} m (${round2(parsedDraft / (TRAMO_STD_M * 100)).toFixed(2)} tr.)`
                      : null;

                const handleStepDelta = (dir: -1 | 1) => {
                  setPerfilDraftMap((prev) => {
                    if (!(key in prev)) return prev;
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                  if (perfilInputUnit === 'tramos') {
                    onSetInventario(key, Math.max(0, round2(tramos + dir)));
                  } else if (perfilInputUnit === 'm') {
                    const nextM = Math.max(0, round2(metros + dir * 1));
                    onSetInventario(key, Math.round((nextM / TRAMO_STD_M) * 10000) / 10000);
                  } else {
                    const nextCm = Math.max(0, cmTotales + dir * 50);
                    onSetInventario(key, Math.round((nextCm / (TRAMO_STD_M * 100)) * 10000) / 10000);
                  }
                };

                return (
                  <div
                    key={key}
                    className="flex flex-wrap items-center justify-between gap-2.5 py-3 border-b border-slate-200 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1 basis-[170px] flex items-center gap-2.5">
                      <button
                        type="button"
                        data-preserve-light="true"
                        onClick={() =>
                          openZoomPerfil({
                            perfilId: perfil.id,
                            nombre: perfil.nombre,
                            codigo: activeMarcaFinal || perfil.codigoRef || undefined,
                            subtitulo: `${activeMarcaFinal} · ${LINEAS_CONFIG[invLinea]?.nombre || ''} · ${COLORES_CONFIG[invColor]?.corto || ''} · ${perfil.uso}`,
                            fotoRealUrl: getPerfilFotoUrl(perfilFotos, perfil.id, invLinea),
                            onEditFoto: () => {
                              setZoomPerfil(null);
                              if (onReplaceSubModalWithPerfil) {
                                onReplaceSubModalWithPerfil(perfil.id);
                              } else {
                                onOpenPerfilModal(perfil.id);
                              }
                            },
                          })
                        }
                        title={`Ampliar dibujo técnico de ${perfil.nombre}`}
                        aria-label={`Ampliar dibujo técnico de ${perfil.nombre}`}
                        className="w-10 h-10 rounded-lg bg-white border border-slate-300 hover:border-blue-500 hover:ring-2 hover:ring-blue-400/40 inline-flex items-center justify-center shrink-0 p-0.5 cursor-zoom-in overflow-hidden transition-all active:scale-95"
                      >
                        <PerfilSectionSvg
                          perfilId={perfil.id}
                          fotoRealUrl={getPerfilFotoUrl(perfilFotos, perfil.id, invLinea)}
                          size={34}
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <strong className="block text-[13.5px] text-[#1E293B] break-words">{perfil.nombre}</strong>
                        <span className="block text-[11.5px] text-slate-600 break-words">{perfil.uso}</span>
                        <div className={`mono text-[11.5px] font-bold mt-0.5 ${tramos > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {tramos > 0
                            ? `Disponible: ${metros.toFixed(2)} m (${cmTotales} cm) · ${round2(tramos)} tr.`
                            : 'Sin existencia (0.00 m · 0 cm)'}
                        </div>
                        {eqFromDraft && (
                          <div className="mono text-[10.5px] font-bold text-blue-700 mt-0.5">
                            {eqFromDraft}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStepDelta(-1)}
                        aria-label={`Restar ${perfilInputUnit} de ${perfil.nombre}`}
                        className="w-10 h-10 rounded-[10px] border border-slate-200 bg-slate-50 hover:bg-blue-50 text-[18px] font-extrabold cursor-pointer"
                      >
                        −
                      </button>
                      <div className="w-[78px]">
                        <span className="block text-[10px] text-slate-500 font-bold text-center">
                          {perfilInputUnit === 'tramos' ? 'Tramos' : perfilInputUnit === 'm' ? 'Metros (m)' : 'Centím. (cm)'}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={perfilInputUnit === 'tramos' ? 0.5 : perfilInputUnit === 'm' ? 0.1 : 10}
                          value={inputDisplayVal}
                          onChange={(e) => {
                            const rawStr = e.target.value;
                            setPerfilDraftMap((prev) => ({ ...prev, [key]: rawStr }));
                            const numVal = Math.max(0, Number(rawStr) || 0);
                            if (perfilInputUnit === 'tramos') {
                              onSetInventario(key, numVal);
                            } else if (perfilInputUnit === 'm') {
                              onSetInventario(key, Math.round((numVal / TRAMO_STD_M) * 10000) / 10000);
                            } else {
                              onSetInventario(key, Math.round((numVal / (TRAMO_STD_M * 100)) * 10000) / 10000);
                            }
                          }}
                          onBlur={() => {
                            setPerfilDraftMap((prev) => {
                              if (!(key in prev)) return prev;
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                          }}
                          className="w-full min-h-[38px] rounded-lg border border-slate-200 text-center mono text-[13px] font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStepDelta(1)}
                        aria-label={`Sumar ${perfilInputUnit} de ${perfil.nombre}`}
                        className="w-10 h-10 rounded-[10px] border border-slate-200 bg-slate-50 hover:bg-blue-50 text-[18px] font-extrabold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <PerfilZoomModal
        data={zoomPerfil}
        onClose={() => (onRequestBack ? onRequestBack() : setZoomPerfil(null))}
      />
    </section>
  );
};
