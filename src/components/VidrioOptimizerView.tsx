import React, { useEffect, useMemo, useState } from 'react';
import {
  getRellenoLabel,
  PANEL_RELLENO_CATALOGO,
  PartidaObra,
  round2,
} from '../utils/alumineroLogic';
import {
  esMaterialDireccional,
  optimizarVidrio2D,
  PiezaVidrioInput,
} from '../utils/glassOptimizer2D';
import { LEV_KEYS } from '../utils/levantamientoLogic';
import { HojaVidrioItem } from '../utils/storageHelpers';

interface LevBorradorResumen {
  cliente: string;
  tel: string;
  dir: string;
  piezasCount: number;
  piezasTotalCant: number;
}

function readLevantamientoBorrador(): LevBorradorResumen | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LEV_KEYS.draft);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    const cliente = typeof parsed.cliente === 'string' ? parsed.cliente.trim() : '';
    if (!cliente) return null;
    const tel =
      (typeof parsed.tel === 'string' && parsed.tel.trim()) ||
      (typeof parsed.telefono === 'string' && parsed.telefono.trim()) ||
      '';
    const dir =
      (typeof parsed.dir === 'string' && parsed.dir.trim()) ||
      (typeof parsed.direccion === 'string' && parsed.direccion.trim()) ||
      (typeof parsed.ref === 'string' && parsed.ref.trim()) ||
      '';
    const piezasArr = Array.isArray(parsed.piezas) ? parsed.piezas : [];
    const piezasCount = piezasArr.length;
    const piezasTotalCant = piezasArr.reduce((acc: number, item: unknown) => {
      const cant =
        item && typeof item === 'object' ? Number((item as { cant?: unknown }).cant) : 1;
      return acc + Math.max(1, Number.isFinite(cant) ? Math.round(cant) : 1);
    }, 0);
    return { cliente, tel, dir, piezasCount, piezasTotalCant };
  } catch {
    return null;
  }
}

interface VidrioOptimizerViewProps {
  hojasVidrio: HojaVidrioItem[];
  hojaPartidas: PartidaObra[];
  piezasIniciales: PiezaVidrioInput[];
  onGoInventarioVidrios: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const TIPOS_VIDRIO_OPTS: string[] = Array.from(
  new Set(
    PANEL_RELLENO_CATALOGO.flatMap((item) =>
      item.espesoresMm.map((esp) => `${item.nombre} ${esp} mm`)
    )
  )
);

const HOJAS_RESPALDO_PRESETS = [
  { label: '244 × 122 cm', w: 244, h: 122 },
  { label: '260 × 180 cm', w: 260, h: 180 },
  { label: '330 × 214 cm', w: 330, h: 214 },
  { label: '183 × 122 cm (Acrílico)', w: 183, h: 122 },
  { label: '214 × 165 cm', w: 214, h: 165 },
];

const PIECE_COLORS = [
  { fill: '#DBEAFE', stroke: '#1D4ED8', text: '#1E3A8A' },
  { fill: '#D1FAE5', stroke: '#047857', text: '#064E3B' },
  { fill: '#E0E7FF', stroke: '#4338CA', text: '#312E81' },
  { fill: '#CFFAFE', stroke: '#0E7490', text: '#164E63' },
  { fill: '#FEF3C7', stroke: '#B45309', text: '#78350F' },
  { fill: '#FCE7F3', stroke: '#BE185D', text: '#831843' },
];

export const VidrioOptimizerView: React.FC<VidrioOptimizerViewProps> = ({
  hojasVidrio,
  hojaPartidas,
  piezasIniciales,
  onGoInventarioVidrios,
  onShowToast,
}) => {
  const [piezas, setPiezas] = useState<PiezaVidrioInput[]>(() =>
    piezasIniciales.length > 0
      ? piezasIniciales
      : [
          {
            id: 'v-demo-1',
            etiqueta: 'Ventana Sala',
            tipoNombre: 'Claro 6 mm',
            anchoCm: 56.5,
            altoCm: 82.0,
            cantidad: 2,
          },
        ]
  );

  const [levBorrador, setLevBorrador] = useState<LevBorradorResumen | null>(() =>
    readLevantamientoBorrador()
  );

  useEffect(() => {
    const syncLev = () => setLevBorrador(readLevantamientoBorrador());
    syncLev();
    window.addEventListener('focus', syncLev);
    window.addEventListener('storage', syncLev);
    return () => {
      window.removeEventListener('focus', syncLev);
      window.removeEventListener('storage', syncLev);
    };
  }, []);

  const hojaPiezasTotal = useMemo(
    () =>
      hojaPartidas.reduce(
        (acc, p) => acc + Math.max(1, Math.round(Number(p.cantidad) || 1)),
        0
      ),
    [hojaPartidas]
  );

  useEffect(() => {
    if (piezasIniciales.length > 0) {
      setPiezas(piezasIniciales);
    }
  }, [piezasIniciales]);

  // Nueva pieza manual
  const [newEtiqueta, setNewEtiqueta] = useState('');
  const [newTipo, setNewTipo] = useState('Claro 6 mm');
  const [newAncho, setNewAncho] = useState('80');
  const [newAlto, setNewAlto] = useState('110');
  const [newCantidad, setNewCantidad] = useState(2);

  // Parámetros 2D
  const [filtrarTipo, setFiltrarTipo] = useState<string>('todos');
  const [grosorCorteMm, setGrosorCorteMm] = useState<number>(3);
  const [permitirRotacion, setPermitirRotacion] = useState<boolean>(true);
  const [respaldoW, setRespaldoW] = useState<number>(260);
  const [respaldoH, setRespaldoH] = useState<number>(180);

  const tiposDisponibles = useMemo(() => {
    const set = new Set<string>(TIPOS_VIDRIO_OPTS);
    for (const p of piezas) {
      if (p.tipoNombre) set.add(p.tipoNombre);
    }
    for (const h of hojasVidrio) {
      if (h.tipoNombre) set.add(h.tipoNombre);
    }
    return Array.from(set);
  }, [piezas, hojasVidrio]);

  const handleImportarDesdeHoja = () => {
    const imported: PiezaVidrioInput[] = [];
    for (const part of hojaPartidas) {
      const partQty = Math.max(1, Number(part.cantidad) || 1);
      const fallbackTipo = part.relleno
        ? getRellenoLabel(part.relleno, part.vidrio)
        : undefined;
      for (const vid of part.despiece?.vidrios || []) {
        if (vid.tipo !== 'vidrio') continue;
        const tipoFinal = vid.espesorLabel || fallbackTipo || 'Claro 6 mm';
        const canRot =
          typeof vid.permitirRotacion === 'boolean'
            ? vid.permitirRotacion
            : !esMaterialDireccional(tipoFinal);
        imported.push({
          id: `v-cot-${part.id}-${imported.length}`,
          etiqueta: `${part.etiqueta || part.area || 'Pieza'}`,
          tipoNombre: tipoFinal,
          anchoCm: vid.anchoCm,
          altoCm: vid.altoCm,
          cantidad: Math.max(1, vid.pzas * partQty),
          permitirRotacion: canRot,
        });
      }
    }

    if (imported.length === 0) {
      onShowToast('Tu Hoja de Cotización no tiene vidrios o paneles pendientes por importar');
      return;
    }

    setPiezas(imported);
    onShowToast(`${imported.length} medida(s) importadas desde Hoja de Cotización`, true);
  };

  const handleAgregarPieza = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(newAncho);
    const h = Number(newAlto);
    const cant = Math.max(1, Math.round(Number(newCantidad) || 1));
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 5 || h < 5) {
      onShowToast('Ingresa ancho y alto válidos en cm (mínimo 5 cm)');
      return;
    }
    const tipoClean = newTipo.trim() || 'Claro 6 mm';
    setPiezas((prev) => [
      ...prev,
      {
        id: `v-man-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        etiqueta: newEtiqueta.trim() || `Corte ${prev.length + 1}`,
        tipoNombre: tipoClean,
        anchoCm: Math.round(w * 10) / 10,
        altoCm: Math.round(h * 10) / 10,
        cantidad: cant,
        permitirRotacion: !esMaterialDireccional(tipoClean),
      },
    ]);
    setNewEtiqueta('');
    onShowToast('Pieza añadida al optimizador 2D', true);
  };

  const resultado = useMemo(
    () =>
      optimizarVidrio2D({
        piezas,
        hojasInventario: hojasVidrio,
        grosorCorteMm,
        permitirRotacion,
        filtrarTipo,
        hojaRespaldo: {
          tipoNombre: filtrarTipo !== 'todos' ? filtrarTipo : piezas[0]?.tipoNombre || 'Claro 6 mm',
          anchoCm: Math.max(40, Number(respaldoW) || 260),
          altoCm: Math.max(40, Number(respaldoH) || 180),
        },
      }),
    [piezas, hojasVidrio, grosorCorteMm, permitirRotacion, filtrarTipo, respaldoW, respaldoH]
  );

  const totalPiezasCount = piezas.reduce((acc, p) => acc + Math.max(1, p.cantidad), 0);
  const totalHojasStock = hojasVidrio.reduce((acc, h) => acc + Math.max(0, h.cantidad), 0);

  return (
    <section id="view-vidrio" className="screen-animate">
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
        <div>
          <h1 className="m-0 text-[21px] font-extrabold text-white">Optimizador de Corte de Vidrio (2D)</h1>
          <p className="m-0 text-[12.5px] text-slate-300">
            Cortes tipo guillotina sobre hojas del taller, rotación 90°, kerf de disco y % de merma
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            id="btn-vidrio-importar-hoja"
            onClick={handleImportarDesdeHoja}
            className="min-h-[40px] px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-extrabold cursor-pointer"
          >
            📥 Importar de Cotización ({hojaPartidas.length})
          </button>
          <button
            type="button"
            onClick={onGoInventarioVidrios}
            className="min-h-[40px] px-3 rounded-xl border border-cyan-300/60 bg-cyan-500/20 text-cyan-100 text-[12px] font-extrabold cursor-pointer"
          >
            📦 Stock Hojas ({totalHojasStock})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Columna izquierda: Lista de piezas y configuración */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {levBorrador && (
            <div
              id="vidrio-lev-cliente-card"
              className="rounded-[18px] border border-sky-400/35 bg-[#0f1b31] text-slate-100 p-4 shadow-xl flex flex-col gap-2"
            >
              <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-sky-300">
                👤 Datos del cliente · Levantamiento Rápido
              </div>
              <div className="text-[15px] font-extrabold text-white leading-snug">
                {levBorrador.cliente}
              </div>
              {(levBorrador.tel || levBorrador.dir) && (
                <div className="text-[12px] text-slate-300 leading-relaxed">
                  {[
                    levBorrador.tel ? `Tel: ${levBorrador.tel}` : '',
                    levBorrador.dir ? `Dir: ${levBorrador.dir}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              )}
              <div className="text-[12.5px] text-slate-200 font-semibold pt-1 border-t border-slate-700/70">
                🪟 Piezas del levantamiento: <strong className="mono text-white">{levBorrador.piezasCount}</strong> (
                <strong className="mono text-white">{levBorrador.piezasTotalCant}</strong> en total) · En la hoja de cotización:{' '}
                <strong className="mono text-white">{hojaPartidas.length}</strong> partida(s),{' '}
                <strong className="mono text-white">{hojaPiezasTotal}</strong> pza(s)
              </div>
              {hojaPartidas.length >= levBorrador.piezasCount &&
              hojaPiezasTotal >= levBorrador.piezasTotalCant ? (
                <div className="text-[12px] font-bold text-emerald-400">
                  ✔ La hoja tiene todas las piezas del levantamiento.
                </div>
              ) : (
                <div className="text-[12px] font-bold text-amber-300 leading-snug">
                  ⚠ La hoja no tiene todas las piezas del levantamiento. Envíalo a Cotización o Lista de Cortes y luego importa los vidrios.
                </div>
              )}
              <button
                type="button"
                id="btn-vidrio-importar-todas-hoja"
                onClick={handleImportarDesdeHoja}
                className="mt-1 w-full min-h-[40px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-extrabold cursor-pointer transition-all active:scale-[0.99]"
              >
                📥 Importar vidrios de todas las piezas de la hoja
              </button>
            </div>
          )}

          {/* Agregar corte */}
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 shadow-xl">
            <h2 className="m-0 text-[16px] font-extrabold">1. Medidas de Vidrio a Cortar</h2>
            <p className="m-0 text-[12px] text-slate-500 mb-3">
              Agrega cortes manuales o impórtalos desde Hoja de Cotización / Modulación
            </p>

            <form onSubmit={handleAgregarPieza} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="inp-v2d-etiqueta" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Etiqueta / Referencia
                  </label>
                  <input
                    id="inp-v2d-etiqueta"
                    type="text"
                    value={newEtiqueta}
                    onChange={(e) => setNewEtiqueta(e.target.value)}
                    placeholder="Ej. Ventana Cocina"
                    className="w-full min-h-[38px] rounded-xl border border-slate-300 px-2.5 text-[12.5px] bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="sel-v2d-tipo" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tipo de vidrio
                  </label>
                  <select
                    id="sel-v2d-tipo"
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value)}
                    className="w-full min-h-[38px] rounded-xl border border-slate-300 px-2.5 text-[12.5px] font-semibold bg-white"
                  >
                    {tiposDisponibles.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="inp-v2d-ancho" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ancho (cm)
                  </label>
                  <input
                    id="inp-v2d-ancho"
                    type="number"
                    min={5}
                    max={400}
                    step={0.1}
                    value={newAncho}
                    onChange={(e) => setNewAncho(e.target.value)}
                    className="w-full min-h-[38px] rounded-xl border border-slate-300 px-2.5 mono text-[13px] font-bold bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="inp-v2d-alto" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Alto (cm)
                  </label>
                  <input
                    id="inp-v2d-alto"
                    type="number"
                    min={5}
                    max={400}
                    step={0.1}
                    value={newAlto}
                    onChange={(e) => setNewAlto(e.target.value)}
                    className="w-full min-h-[38px] rounded-xl border border-slate-300 px-2.5 mono text-[13px] font-bold bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="inp-v2d-qty" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Piezas
                  </label>
                  <input
                    id="inp-v2d-qty"
                    type="number"
                    min={1}
                    step={1}
                    value={newCantidad}
                    onChange={(e) => setNewCantidad(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    className="w-full min-h-[38px] rounded-xl border border-slate-300 px-2.5 mono text-[13px] font-bold bg-white text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-v2d-add"
                className="w-full min-h-[40px] rounded-xl bg-[#0B2545] hover:bg-[#133866] text-white text-[12.5px] font-extrabold cursor-pointer"
              >
                + Agregar Medida de Corte
              </button>
            </form>

            {/* Lista de piezas agregadas */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-extrabold text-slate-700">
                  Lista de corte (<span className="mono">{totalPiezasCount}</span> piezas)
                </span>
                {piezas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPiezas([])}
                    className="text-[11.5px] font-bold text-red-600 cursor-pointer bg-transparent border-0"
                  >
                    Vaciar lista
                  </button>
                )}
              </div>

              {piezas.length === 0 ? (
                <p className="text-[12px] text-slate-500 p-4 text-center border border-dashed border-slate-300 rounded-xl">
                  Agrega medidas arriba o importa desde tu Cotización para calcular el acomodo 2D.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {piezas.map((pz) => {
                    const rotActive = pz.permitirRotacion ?? !esMaterialDireccional(pz.tipoNombre);
                    const isDir = esMaterialDireccional(pz.tipoNombre);
                    return (
                      <div
                        key={pz.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
                      >
                        <div className="min-w-[140px] flex-1">
                          <strong className="block text-slate-900 truncate">{pz.etiqueta}</strong>
                          <span className="mono text-[11.5px] font-bold text-blue-700 block">
                            {pz.anchoCm} × {pz.altoCm} cm · {pz.tipoNombre}
                          </span>
                          {isDir && !rotActive && (
                            <span className="inline-block mt-0.5 text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              Textura vertical fija (no rotar)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setPiezas((prev) =>
                                prev.map((x) =>
                                  x.id === pz.id ? { ...x, permitirRotacion: !rotActive } : x
                                )
                              )
                            }
                            title="Permitir o bloquear rotación 90° en esta pieza"
                            className={`px-2 h-7 rounded-lg text-[10.5px] font-extrabold border cursor-pointer ${
                              rotActive
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-900 border-amber-300'
                            }`}
                          >
                            {rotActive ? '↻ 90° Sí' : '🔒 Sin giro'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPiezas((prev) =>
                                prev.map((x) =>
                                  x.id === pz.id ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x
                                )
                              )
                            }
                            className="w-7 h-7 rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                          >
                            −
                          </button>
                          <span className="mono font-extrabold w-7 text-center">×{pz.cantidad}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPiezas((prev) =>
                                prev.map((x) => (x.id === pz.id ? { ...x, cantidad: x.cantidad + 1 } : x))
                              )
                            }
                            className="w-7 h-7 rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setPiezas((prev) => prev.filter((x) => x.id !== pz.id))}
                            aria-label={`Eliminar ${pz.etiqueta}`}
                            className="px-2 h-7 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold cursor-pointer"
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

          {/* Parámetros de optimización 2D */}
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 shadow-xl">
            <h2 className="m-0 text-[16px] font-extrabold">2. Parámetros de Corte Guillotina</h2>
            <p className="m-0 text-[12px] text-slate-500 mb-3">
              Ajusta el grosor de disco/rayador, rotación 90° y tamaño de hoja estándar faltante
            </p>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="sel-v2d-filter" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Filtrar tipo de vidrio
                  </label>
                  <select
                    id="sel-v2d-filter"
                    value={filtrarTipo}
                    onChange={(e) => setFiltrarTipo(e.target.value)}
                    className="w-full min-h-[38px] rounded-xl border border-slate-300 px-2.5 text-[12.5px] font-semibold bg-white"
                  >
                    <option value="todos">Todos por tipo</option>
                    {tiposDisponibles.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inp-v2d-kerf" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Grosor corte / kerf (mm)
                  </label>
                  <input
                    id="inp-v2d-kerf"
                    type="number"
                    min={0}
                    max={15}
                    step={0.5}
                    value={grosorCorteMm}
                    onChange={(e) => setGrosorCorteMm(Math.max(0, Math.min(15, Number(e.target.value) || 0)))}
                    className="w-full min-h-[38px] rounded-xl border border-slate-300 px-3 mono text-[13px] font-bold bg-white"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer text-[12.5px] font-bold text-slate-800 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={permitirRotacion}
                  onChange={(e) => setPermitirRotacion(e.target.checked)}
                />
                <span>Permitir rotar piezas 90° para aprovechar mejor la hoja</span>
              </label>

              <div>
                <div className="text-[11px] font-bold text-slate-600 mb-1.5">
                  Medida de hoja estándar (si falta stock en inventario)
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {HOJAS_RESPALDO_PRESETS.map((hp) => (
                    <button
                      key={hp.label}
                      type="button"
                      onClick={() => {
                        setRespaldoW(hp.w);
                        setRespaldoH(hp.h);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold mono border cursor-pointer ${
                        respaldoW === hp.w && respaldoH === hp.h
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {hp.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={40}
                    max={600}
                    aria-label="Ancho de hoja estándar en cm"
                    value={respaldoW}
                    onChange={(e) => setRespaldoW(Math.max(40, Number(e.target.value) || 260))}
                    className="w-full min-h-[36px] rounded-xl border border-slate-300 px-2.5 mono text-[12.5px] font-bold bg-white"
                  />
                  <input
                    type="number"
                    min={40}
                    max={600}
                    aria-label="Alto de hoja estándar en cm"
                    value={respaldoH}
                    onChange={(e) => setRespaldoH(Math.max(40, Number(e.target.value) || 180))}
                    className="w-full min-h-[36px] rounded-xl border border-slate-300 px-2.5 mono text-[12.5px] font-bold bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: Resultados 2D, KPIs, Planos SVG y Secuencia Guillotina */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Alerta de inventario insuficiente o stock OK */}
          {resultado.resumenFaltanteTexto ? (
            <div
              id="v2d-alerta-faltante"
              role="alert"
              className="p-3.5 rounded-2xl border-[1.5px] border-amber-400 bg-amber-50 text-amber-950 flex flex-wrap items-center justify-between gap-2 shadow"
            >
              <div className="text-[12.5px] font-extrabold">
                ⚠️ {resultado.resumenFaltanteTexto}
              </div>
              <button
                type="button"
                onClick={onGoInventarioVidrios}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11.5px] font-extrabold cursor-pointer whitespace-nowrap"
              >
                + Cargar Hojas en Inventario
              </button>
            </div>
          ) : resultado.totalHojasNecesarias > 0 ? (
            <div className="p-3 rounded-2xl border border-emerald-400/60 bg-emerald-50 text-emerald-900 text-[12.5px] font-extrabold">
              ✅ Tu inventario actual de Hojas de Vidrio cubre el 100% de las piezas ({resultado.hojasInventarioUsadas} hoja/s).
            </div>
          ) : null}

          {resultado.piezasNoCaben.length > 0 && (
            <div className="p-3 rounded-2xl border border-red-300 bg-red-50 text-red-900 text-[12px]">
              <strong>Piezas fuera de rango:</strong>{' '}
              {resultado.piezasNoCaben.map((x) => `${x.etiqueta} (${x.anchoCm}×${x.altoCm} cm)`).join(', ')}
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white text-[#1E293B] border border-slate-300 rounded-2xl p-3 shadow">
              <span className="block text-[10.5px] font-bold text-slate-500 uppercase">% Área Utilizada</span>
              <strong className="mono text-[20px] font-black text-emerald-700">
                {resultado.aprovechamientoPct}%
              </strong>
              <span className="block text-[10.5px] text-slate-500 mono">
                {resultado.areaPiezasM2.toFixed(2)} m² útiles
              </span>
            </div>
            <div className="bg-white text-[#1E293B] border border-slate-300 rounded-2xl p-3 shadow">
              <span className="block text-[10.5px] font-bold text-slate-500 uppercase">% Merma</span>
              <strong className="mono text-[20px] font-black text-amber-700">{resultado.mermaPct}%</strong>
              <span className="block text-[10.5px] text-slate-500 mono">
                {resultado.areaMermaM2.toFixed(2)} m² sobr.
              </span>
            </div>
            <div className="bg-white text-[#1E293B] border border-slate-300 rounded-2xl p-3 shadow">
              <span className="block text-[10.5px] font-bold text-slate-500 uppercase">Hojas Stock Usadas</span>
              <strong className="mono text-[20px] font-black text-blue-700">
                {resultado.hojasInventarioUsadas}
              </strong>
              <span className="block text-[10.5px] text-slate-500">De tu inventario</span>
            </div>
            <div className="bg-white text-[#1E293B] border border-slate-300 rounded-2xl p-3 shadow">
              <span className="block text-[10.5px] font-bold text-slate-500 uppercase">Hojas Faltantes</span>
              <strong
                className={`mono text-[20px] font-black ${
                  resultado.hojasFaltantes > 0 ? 'text-red-600' : 'text-slate-700'
                }`}
              >
                {resultado.hojasFaltantes}
              </strong>
              <span className="block text-[10.5px] text-slate-500">Por pedir al proveedor</span>
            </div>
          </div>

          {/* Diagramas SVG por hoja */}
          <div className="flex flex-col gap-3.5">
            {resultado.paneles.length === 0 ? (
              <div className="bg-white text-[#1E293B] border border-slate-300 rounded-[18px] p-6 text-center text-[13px] text-slate-500">
                No hay piezas válidas para optimizar en el filtro seleccionado.
              </div>
            ) : (
              resultado.paneles.map((panel) => {
                const svgW = panel.anchoCm;
                const svgH = panel.altoCm;
                const pad = 12;
                return (
                  <div
                    key={panel.panelNumero}
                    className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 shadow-xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#0B2545] text-white text-[11.5px] font-extrabold mono">
                          Hoja #{panel.panelNumero}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${
                            panel.origen === 'inventario'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {panel.origen === 'inventario' ? '✓ De Inventario' : '⚠️ Hoja Faltante'}
                        </span>
                        <strong className="text-[13.5px]">
                          {panel.tipoNombre} ({panel.anchoCm} × {panel.altoCm} cm)
                        </strong>
                      </div>
                      <div className="mono text-[12px] font-extrabold text-slate-700">
                        Uso: <span className="text-emerald-700">{panel.aprovechamientoPct}%</span> · Merma:{' '}
                        <span className="text-amber-700">{panel.mermaPct}%</span>
                      </div>
                    </div>

                    {/* Lienzo SVG a escala real */}
                    <div
                      data-preserve-light="true"
                      className="rounded-xl border border-slate-300 bg-slate-50 p-2 overflow-hidden"
                    >
                      <svg
                        viewBox={`${-pad} ${-pad} ${svgW + pad * 2} ${svgH + pad * 2}`}
                        className="w-full h-auto max-h-[340px] block mx-auto"
                        aria-label={`Diagrama 2D Hoja ${panel.panelNumero}`}
                      >
                        {/* Fondo de lámina */}
                        <rect
                          x={0}
                          y={0}
                          width={svgW}
                          height={svgH}
                          fill="#F1F5F9"
                          stroke="#0F172A"
                          strokeWidth="1.6"
                        />

                        {/* Cotas superiores de lámina */}
                        <text
                          x={svgW / 2}
                          y={-3}
                          textAnchor="middle"
                          fill="#0F172A"
                          fontSize={Math.max(7, Math.min(11, svgW * 0.032))}
                          fontWeight="800"
                        >
                          {panel.anchoCm} cm
                        </text>

                        {/* Sobrantes libres */}
                        {panel.sobrantesRects.map((sr, sIdx) => (
                          <g key={`sr-${sIdx}`}>
                            <rect
                              x={sr.x}
                              y={sr.y}
                              width={sr.w}
                              height={sr.h}
                              fill="#E2E8F0"
                              fillOpacity="0.55"
                              stroke="#94A3B8"
                              strokeWidth="0.9"
                              strokeDasharray="3 3"
                            />
                            {sr.w >= 26 && sr.h >= 18 && (
                              <text
                                x={sr.x + sr.w / 2}
                                y={sr.y + sr.h / 2 + 2}
                                textAnchor="middle"
                                fill="#64748B"
                                fontSize={Math.max(5.5, Math.min(8.5, sr.w * 0.11))}
                                fontWeight="600"
                              >
                                {round2(sr.w)}×{round2(sr.h)}
                              </text>
                            )}
                          </g>
                        ))}

                        {/* Piezas cortadas */}
                        {panel.piezas.map((pz, pIdx) => {
                          const palette = PIECE_COLORS[pIdx % PIECE_COLORS.length];
                          const fontSz = Math.max(5.5, Math.min(10, Math.min(pz.w, pz.h) * 0.16));
                          return (
                            <g key={`${pz.piezaId}-${pIdx}`}>
                              <rect
                                x={pz.x}
                                y={pz.y}
                                width={pz.w}
                                height={pz.h}
                                fill={palette.fill}
                                stroke={palette.stroke}
                                strokeWidth="1.3"
                              />
                              {pz.w >= 20 && pz.h >= 16 && (
                                <>
                                  <text
                                    x={pz.x + pz.w / 2}
                                    y={pz.y + pz.h / 2 - fontSz * 0.25}
                                    textAnchor="middle"
                                    fill={palette.text}
                                    fontSize={fontSz}
                                    fontWeight="800"
                                  >
                                    {pz.etiqueta.slice(0, 16)}
                                  </text>
                                  <text
                                    x={pz.x + pz.w / 2}
                                    y={pz.y + pz.h / 2 + fontSz * 0.95}
                                    textAnchor="middle"
                                    fill={palette.stroke}
                                    fontSize={fontSz * 0.88}
                                    fontWeight="700"
                                  >
                                    {pz.w}×{pz.h}
                                    {pz.rotada ? ' ↻' : ''}
                                  </text>
                                </>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Secuencia paso a paso de cortes guillotina */}
          {resultado.secuenciaGlobal.length > 0 && (
            <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 shadow-xl">
              <h2 className="m-0 text-[16px] font-extrabold">Secuencia de Cortes Guillotina (Paso a Paso)</h2>
              <p className="m-0 text-[12px] text-slate-500 mb-3">
                Sigue el orden numérico en mesa de corte (kerf considerado: {resultado.grosorCorteMm} mm)
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px]">
                <table className="w-full border-collapse text-[12px] min-w-[480px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                      <th className="p-2 text-left">Paso</th>
                      <th className="p-2 text-left">Hoja</th>
                      <th className="p-2 text-left">Eje de corte</th>
                      <th className="p-2 text-center">Posición</th>
                      <th className="p-2 text-left">Pieza / Franja</th>
                      <th className="p-2 text-left">Sobrante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.secuenciaGlobal.map((step) => (
                      <tr key={`${step.panelNumero}-${step.paso}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="p-2 mono font-extrabold text-blue-700">#{step.paso}</td>
                        <td className="p-2 mono font-bold">H{step.panelNumero}</td>
                        <td className="p-2 font-bold">{step.eje}</td>
                        <td className="p-2 text-center mono font-extrabold">{step.posicionCm} cm</td>
                        <td className="p-2 font-semibold">{step.resultado}</td>
                        <td className="p-2 text-slate-600">{step.sobranteDesc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
