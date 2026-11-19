import React, { useMemo, useState } from 'react';
import {
  CATALOGO_PERFILES,
  COLORES_CONFIG,
  ColorId,
  HERRAJES_INVENTARIO_CATALOGO,
  HerrajeCategoria,
  LINEAS_CONFIG,
  LineaId,
  PerfilCatalogoId,
  round2,
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
  'Cuprum',
  'Extrusiones Metálicas',
  'Indalum',
  'Perfiles LM',
  'Eurovent',
  'Otra',
];

const SOBRANTE_PRESETS_CM = [60, 120, 150, 250, 300];

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
  onShowToast,
}) => {
  const [invTab, setInvTab] = useState<'perfiles' | 'vidrios' | 'herrajes'>('perfiles');
  const [invLinea, setInvLinea] = useState<LineaId>('3');
  const [invColor, setInvColor] = useState<ColorId>('natural');
  const [aprProyecto, setAprProyecto] = useState('');
  const [aprPerfil, setAprPerfil] = useState<PerfilCatalogoId>('cabezal');
  const [aprTramos, setAprTramos] = useState(1);

  // Sobrantes (< 6.00 m) vinculados a Marca + Línea + Perfil + Color
  const [sobMarca, setSobMarca] = useState('Alumer');
  const [sobMarcaOtra, setSobMarcaOtra] = useState('');
  const [sobLinea, setSobLinea] = useState<LineaId>('3');
  const [sobColor, setSobColor] = useState<ColorId>('natural');
  const [sobPerfil, setSobPerfil] = useState<PerfilCatalogoId>('cabezal');
  const [sobUnit, setSobUnit] = useState<'cm' | 'm'>('cm');
  const [sobLargoStr, setSobLargoStr] = useState('120');
  const [sobCantidad, setSobCantidad] = useState(1);
  const [sobNota, setSobNota] = useState('');

  // Hojas de Vidrio, Espejo y Plástico
  const [vidCategoria, setVidCategoria] = useState<HojaCategoriaId>('vidrio');
  const [vidTono, setVidTono] = useState('Claro');
  const [vidEspesor, setVidEspesor] = useState(6);
  const [vidAnchoCm, setVidAnchoCm] = useState('260');
  const [vidAltoCm, setVidAltoCm] = useState('180');
  const [vidCantidad, setVidCantidad] = useState(1);
  const [vidNota, setVidNota] = useState('');

  // Filtros de Herrajes
  const [herrajeCatFilter, setHerrajeCatFilter] = useState<HerrajeCategoria | 'Todas'>('Todas');
  const [herrajeBusqueda, setHerrajeBusqueda] = useState('');

  const totalTramosGlobal = round2(
    Object.values(inventario).reduce((acc, v) => acc + (Number(v) || 0), 0)
  );
  const totalSobrantesM = round2(
    sobrantes.reduce((acc, s) => acc + (Number(s.largoM) || 0) * Math.max(1, Number(s.cantidad) || 1), 0)
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

  const handleToggleSobUnit = (nextUnit: 'cm' | 'm') => {
    if (nextUnit === sobUnit) return;
    const raw = Number(sobLargoStr);
    if (Number.isFinite(raw) && raw > 0) {
      if (nextUnit === 'm') {
        setSobLargoStr((raw / 100).toFixed(2));
      } else {
        setSobLargoStr(String(Math.round(raw * 100)));
      }
    } else {
      setSobLargoStr(nextUnit === 'cm' ? '120' : '1.20');
    }
    setSobUnit(nextUnit);
  };

  const handleAgregarSobrante = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = Number(sobLargoStr);
    const largoNum = sobUnit === 'cm' ? round2(raw / 100) : round2(raw);
    if (!Number.isFinite(largoNum) || largoNum <= 0 || largoNum >= 6) {
      onShowToast(
        sobUnit === 'cm'
          ? 'Ingresa un largo válido menor a 600 cm (ej. 60, 120 o 300 cm)'
          : 'Ingresa un largo válido menor a 6.00 m (ej. 0.60, 1.20 o 3.00 m)'
      );
      return;
    }
    const marcaFinal = sobMarca === 'Otra' ? sobMarcaOtra.trim() : sobMarca.trim();
    if (!marcaFinal) {
      onShowToast('Selecciona o escribe la marca del aluminio para vincular el sobrante');
      return;
    }
    const cant = Math.max(1, Math.round(Number(sobCantidad) || 1));
    onAddSobrante({
      marca: marcaFinal,
      linea: sobLinea,
      perfilId: sobPerfil,
      color: sobColor,
      largoM: largoNum,
      cantidad: cant,
      nota: sobNota.trim() || undefined,
    });
    setSobNota('');
    setSobCantidad(1);
    onShowToast(
      `Sobrante de ${Math.round(largoNum * 100)} cm (${largoNum.toFixed(2)} m) · ${marcaFinal} agregado`,
      true
    );
  };

  const handleAgregarHojaVidrio = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.round(Number(vidAnchoCm) || 0);
    const h = Math.round(Number(vidAltoCm) || 0);
    const qty = Math.max(1, Math.round(Number(vidCantidad) || 1));
    if (w < 20 || h < 20) {
      onShowToast('Ingresa ancho y alto válidos en cm (mínimo 20 cm)');
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
            Tramos 6.10 m, sobrantes exactos (cm/m), hojas de vidrio y herrajes
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

      {/* Selector de 3 pestañas de Inventario */}
      <div className="inv-segmented-tabs grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1.5 rounded-[14px] bg-[#13315C] border border-slate-400/30 mb-4">
        <button
          type="button"
          id="inv-tab-perfiles"
          onClick={() => setInvTab('perfiles')}
          className={`min-h-[44px] rounded-[10px] text-[13px] font-extrabold cursor-pointer transition-colors ${
            invTab === 'perfiles' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Perfiles y Sobrantes
        </button>
        <button
          type="button"
          id="inv-tab-vidrios"
          onClick={() => setInvTab('vidrios')}
          className={`min-h-[44px] rounded-[10px] text-[13px] font-extrabold cursor-pointer transition-colors px-2 ${
            invTab === 'vidrios' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Hojas (Vidrio, Espejo y Plástico) ({totalHojasVidrio})
        </button>
        <button
          type="button"
          id="inv-tab-herrajes"
          onClick={() => setInvTab('herrajes')}
          className={`min-h-[44px] rounded-[10px] text-[13px] font-extrabold cursor-pointer transition-colors ${
            invTab === 'herrajes' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Herrajes, Viniles y Escuadras
        </button>
      </div>

      {invTab === 'vidrios' ? (
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
                            setVidAnchoCm('183');
                            setVidAltoCm('122');
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
                <div className="text-[11px] font-bold text-slate-600 mb-1.5">Medidas estándar de fábrica</div>
                <div className="flex flex-wrap gap-1.5">
                  {VIDRIO_MEDIDAS_PRESETS.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => {
                        setVidAnchoCm(String(m.w));
                        setVidAltoCm(String(m.h));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold mono border cursor-pointer ${
                        Number(vidAnchoCm) === m.w && Number(vidAltoCm) === m.h
                          ? 'bg-cyan-600 text-white border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="inp-vidrio-ancho" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ancho (cm)
                  </label>
                  <input
                    id="inp-vidrio-ancho"
                    type="number"
                    min={20}
                    max={600}
                    value={vidAnchoCm}
                    onChange={(e) => setVidAnchoCm(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-slate-300 px-2.5 mono text-[13px] font-bold bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="inp-vidrio-alto" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Alto (cm)
                  </label>
                  <input
                    id="inp-vidrio-alto"
                    type="number"
                    min={20}
                    max={600}
                    value={vidAltoCm}
                    onChange={(e) => setVidAltoCm(e.target.value)}
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
                        <div className="mono text-[12.5px] font-bold text-slate-700 mt-0.5">
                          {hv.anchoCm} × {hv.altoCm} cm · <span className="text-cyan-800">{hv.cantidad} hoja(s)</span> ({areaTotal.toFixed(2)} m²)
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
                  <h2 className="m-0 text-[17px] font-extrabold">1. Selecciona Línea y Acabado</h2>
                  <p className="m-0 text-[12px] text-slate-600">
                    Actualiza tus tramos de 6.10 m y registra sobrantes menores a 6 m
                  </p>
                </div>
                <span className="mono text-[12px] font-extrabold text-blue-600 text-right">
                  {totalTramosGlobal} tramos ({round2(totalTramosGlobal * TRAMO_STD_M)} m)
                  {totalSobrantesM > 0 ? ` + ${totalSobrantesM} m sob.` : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {INV_LINEAS.map((lid) => {
                  const l = LINEAS_CONFIG[lid];
                  const active = invLinea === lid;
                  return (
                    <button
                      key={lid}
                      type="button"
                      onClick={() => setInvLinea(lid)}
                      className={`min-h-[50px] p-2.5 rounded-xl border text-left cursor-pointer ${
                        active
                          ? 'bg-[#0B2545] border-[#0B2545] text-white'
                          : 'bg-slate-100 border-slate-300 text-[#1E293B]'
                      }`}
                    >
                      <span className="block text-[12px] font-extrabold leading-tight">{l.nombre}</span>
                      <span className={`block text-[10.5px] ${active ? 'text-blue-200' : 'text-slate-600'}`}>
                        Tramo 6.10 m
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.values(COLORES_CONFIG).map((c) => {
                  const active = invColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setInvColor(c.id)}
                      className={`flex items-center gap-2 min-h-[46px] px-2.5 py-2 rounded-xl border text-left cursor-pointer ${
                        active ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-300 bg-white text-[#1E293B]'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-md border border-slate-300 shrink-0"
                        style={{ background: c.swatch }}
                      />
                      <div>
                        <span className="block text-[12.5px] font-bold">{c.corto}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inventario de Sobrantes (< 6.00 m) vinculados a Marca + Línea + Perfil + Color */}
            <div id="inv-sobrantes-card" className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h2 className="m-0 text-[17px] font-extrabold">Inventario de Sobrantes (&lt; 6.00 m)</h2>
                  <p className="m-0 text-[12px] text-slate-600">
                    Registra retazos en cm o metros vinculados a su Marca, Línea, Perfil y Color
                  </p>
                </div>
                <span className="mono text-[12px] font-extrabold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
                  {totalSobrantesM.toFixed(2)} m
                </span>
              </div>

              <form onSubmit={handleAgregarSobrante} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="sel-sobrante-marca" className="block text-[11px] font-bold text-slate-600 mb-1">
                      Marca de aluminio *
                    </label>
                    <select
                      id="sel-sobrante-marca"
                      value={sobMarca}
                      onChange={(e) => setSobMarca(e.target.value)}
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-[12.5px] font-semibold bg-white"
                    >
                      {MARCAS_ALUMINIO.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sel-sobrante-linea" className="block text-[11px] font-bold text-slate-600 mb-1">
                      Línea *
                    </label>
                    <select
                      id="sel-sobrante-linea"
                      value={sobLinea}
                      onChange={(e) => setSobLinea(e.target.value as LineaId)}
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-[12.5px] font-semibold bg-white"
                    >
                      {INV_LINEAS.map((lid) => (
                        <option key={lid} value={lid}>
                          {LINEAS_CONFIG[lid].nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {sobMarca === 'Otra' && (
                  <input
                    id="inp-sobrante-marca-otra"
                    type="text"
                    value={sobMarcaOtra}
                    onChange={(e) => setSobMarcaOtra(e.target.value)}
                    placeholder="Escribe el nombre de la marca..."
                    className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 text-[12.5px] font-semibold bg-white"
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="sel-sobrante-perfil" className="block text-[11px] font-bold text-slate-600 mb-1">
                      Perfil específico *
                    </label>
                    <select
                      id="sel-sobrante-perfil"
                      value={sobPerfil}
                      onChange={(e) => setSobPerfil(e.target.value as PerfilCatalogoId)}
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-[12.5px] font-semibold bg-white"
                    >
                      {CATALOGO_PERFILES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sel-sobrante-color" className="block text-[11px] font-bold text-slate-600 mb-1">
                      Color / Acabado *
                    </label>
                    <select
                      id="sel-sobrante-color"
                      value={sobColor}
                      onChange={(e) => setSobColor(e.target.value as ColorId)}
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-[12.5px] font-semibold bg-white"
                    >
                      {Object.values(COLORES_CONFIG).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {SOBRANTE_PRESETS_CM.map((cm) => {
                      const display = sobUnit === 'cm' ? `${cm} cm` : `${(cm / 100).toFixed(2)} m`;
                      const valMatch =
                        sobUnit === 'cm'
                          ? Math.round(Number(sobLargoStr)) === cm
                          : Math.round(Number(sobLargoStr) * 100) === cm;
                      return (
                        <button
                          key={cm}
                          type="button"
                          onClick={() =>
                            setSobLargoStr(sobUnit === 'cm' ? String(cm) : (cm / 100).toFixed(2))
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold mono border cursor-pointer ${
                            valMatch
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          {display}
                        </button>
                      );
                    })}
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => handleToggleSobUnit('cm')}
                      className={`px-2 py-0.5 rounded text-[11px] font-extrabold cursor-pointer ${
                        sobUnit === 'cm' ? 'bg-[#0B2545] text-white' : 'text-slate-600'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleSobUnit('m')}
                      className={`px-2 py-0.5 rounded text-[11px] font-extrabold cursor-pointer ${
                        sobUnit === 'm' ? 'bg-[#0B2545] text-white' : 'text-slate-600'
                      }`}
                    >
                      m
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="inp-sobrante-largo" className="block text-[11px] font-bold text-slate-600 mb-1">
                      Largo exacto en {sobUnit === 'cm' ? 'cm (< 600)' : 'metros (< 6.00)'}
                    </label>
                    <input
                      id="inp-sobrante-largo"
                      type="number"
                      min={sobUnit === 'cm' ? 5 : 0.05}
                      max={sobUnit === 'cm' ? 599 : 5.99}
                      step={sobUnit === 'cm' ? 1 : 0.05}
                      value={sobLargoStr}
                      onChange={(e) => setSobLargoStr(e.target.value)}
                      placeholder={sobUnit === 'cm' ? 'Ej. 60 o 120' : 'Ej. 0.60 o 1.20'}
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 mono text-[13px] font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="inp-sobrante-qty" className="block text-[11px] font-bold text-slate-600 mb-1">
                      Piezas / Retazos
                    </label>
                    <input
                      id="inp-sobrante-qty"
                      type="number"
                      min={1}
                      step={1}
                      value={sobCantidad}
                      onChange={(e) => setSobCantidad(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 mono text-[13px] font-bold bg-white text-center"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    id="inp-sobrante-nota"
                    type="text"
                    value={sobNota}
                    onChange={(e) => setSobNota(e.target.value)}
                    placeholder="Ubicación / rack opcional (ej. Rack B)"
                    className="flex-1 min-h-[40px] rounded-xl border border-slate-200 px-3 text-[12.5px] bg-white"
                  />
                  <button
                    type="submit"
                    id="btn-add-sobrante"
                    className="min-h-[40px] px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12.5px] font-extrabold cursor-pointer whitespace-nowrap"
                  >
                    + Agregar Sobrante
                  </button>
                </div>
              </form>

              <div className="mt-3 flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                {sobrantes.length === 0 ? (
                  <p className="text-[12px] text-slate-500 p-3 text-center border border-dashed border-slate-200 rounded-xl">
                    No hay tramos sobrantes registrados todavía.
                  </p>
                ) : (
                  sobrantes.map((s) => {
                    const pNombre = CATALOGO_PERFILES.find((p) => p.id === s.perfilId)?.nombre || s.perfilId;
                    const cmVal = Math.round(s.largoM * 100);
                    const totalItemM = round2(s.largoM * s.cantidad);
                    return (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border-[1.5px] border-amber-300 text-[#1E293B] text-[12px]"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 basis-[170px]">
                          <div
                            data-preserve-light="true"
                            className="w-8 h-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 p-0.5"
                          >
                            <PerfilSectionSvg
                              perfilId={s.perfilId}
                              fotoRealUrl={getPerfilFotoUrl(perfilFotos, s.perfilId, s.linea)}
                              size={26}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
                                {s.marca || 'Alumer'}
                              </span>
                              <strong className="text-[#1E293B] mono">
                                {cmVal} cm ({s.largoM.toFixed(2)} m)
                              </strong>
                              <span className="text-slate-700 font-bold">× {s.cantidad}</span>
                              <span className="mono text-amber-800 font-extrabold">({totalItemM.toFixed(2)} m)</span>
                            </div>
                            <div className="text-slate-700 font-semibold break-words">
                              {pNombre} · {LINEAS_CONFIG[s.linea]?.nombre} · {COLORES_CONFIG[s.color]?.corto}
                            </div>
                            {s.nota && <div className="text-[11px] text-slate-600 break-words">{s.nota}</div>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label="Restar sobrante"
                            onClick={() =>
                              s.cantidad <= 1
                                ? onDeleteSobrante(s.id)
                                : onUpdateSobranteQty(s.id, s.cantidad - 1)
                            }
                            className="w-8 h-8 rounded-lg border border-amber-400 bg-white text-[#1E293B] font-extrabold cursor-pointer"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            aria-label="Sumar sobrante"
                            onClick={() => onUpdateSobranteQty(s.id, s.cantidad + 1)}
                            className="w-8 h-8 rounded-lg border border-amber-400 bg-white text-[#1E293B] font-extrabold cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSobrante(s.id)}
                            aria-label="Eliminar sobrante"
                            className="px-2 h-8 rounded-lg border border-red-300 bg-white text-red-600 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
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
                    const [lid, pid, cid] = k.split('__') as [LineaId, PerfilCatalogoId, ColorId];
                    const pNombre = CATALOGO_PERFILES.find((p) => p.id === pid)?.nombre || pid;
                    return (
                      <div key={k} className="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-slate-100 text-[12.5px] min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            data-preserve-light="true"
                            className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 p-0.5"
                          >
                            <PerfilSectionSvg
                              perfilId={pid}
                              fotoRealUrl={getPerfilFotoUrl(perfilFotos, pid, lid)}
                              size={22}
                            />
                          </div>
                          <span className="min-w-0 break-words">
                            <strong>{pNombre}</strong> · {LINEAS_CONFIG[lid]?.nombre} · {COLORES_CONFIG[cid]?.corto}
                          </span>
                        </div>
                        <span className="mono font-extrabold text-emerald-700 shrink-0">
                          {val} tramos ({round2(val * TRAMO_STD_M)} m)
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
                Tramos apartados en proyectos aprobados para no contarlos dos veces
              </p>
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
              </div>

              <div className="mt-2.5 flex flex-col gap-1.5">
                {obrasAprobadas.length === 0 ? (
                  <p className="text-[12px] text-slate-500 p-3 text-center border border-dashed border-slate-200 rounded-xl">
                    No hay tramos comprometidos en otras obras aprobadas.
                  </p>
                ) : (
                  obrasAprobadas.map((ob) => (
                    <div key={ob.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 text-[12px]">
                      <div>
                        <strong className="block text-amber-950">{ob.proyecto}</strong>
                        <span className="text-amber-800">
                          {CATALOGO_PERFILES.find((p) => p.id === ob.perfilId)?.nombre} · {ob.tramos} tramos
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEliminarApartado(ob.id)}
                        className="px-2 py-1 rounded bg-white border border-amber-300 text-amber-900 font-bold cursor-pointer"
                      >
                        Liberar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <h2 className="m-0 text-[17px] font-extrabold">
              2. Perfiles — {LINEAS_CONFIG[invLinea].nombre} ({COLORES_CONFIG[invColor].corto})
            </h2>
            <p className="m-0 text-[12px] text-slate-600 mb-3">
              Usa + / − por tramo de 6.10 m o escribe tramos disponibles
            </p>

            <div className="flex flex-col max-h-[680px] overflow-y-auto pr-1">
              {CATALOGO_PERFILES.map((perfil) => {
                const key = `${invLinea}__${perfil.id}__${invColor}`;
                const tramos = Number(inventario[key] || 0);
                const metros = round2(tramos * TRAMO_STD_M);
                return (
                  <div
                    key={perfil.id}
                    className="flex flex-wrap items-center justify-between gap-2.5 py-3 border-b border-slate-200 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1 basis-[170px] flex items-center gap-2.5">
                      <button
                        type="button"
                        data-preserve-light="true"
                        onClick={() => onOpenPerfilModal(perfil.id)}
                        title="Ver sección transversal / foto real"
                        className="w-10 h-10 rounded-lg bg-white border border-slate-300 hover:border-blue-500 inline-flex items-center justify-center shrink-0 p-0.5 cursor-pointer overflow-hidden"
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
                          {tramos > 0 ? `Disponible: ${metros.toFixed(2)} m` : 'Sin existencia (0.00 m)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSetInventario(key, Math.max(0, round2(tramos - 1)))}
                        aria-label={`Restar 1 tramo de ${perfil.nombre}`}
                        className="w-10 h-10 rounded-[10px] border border-slate-200 bg-slate-50 hover:bg-blue-50 text-[18px] font-extrabold cursor-pointer"
                      >
                        −
                      </button>
                      <div className="w-[70px]">
                        <span className="block text-[10px] text-slate-500 font-bold text-center">Tramos</span>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={tramos}
                          onChange={(e) => onSetInventario(key, Math.max(0, Number(e.target.value) || 0))}
                          className="w-full min-h-[38px] rounded-lg border border-slate-200 text-center mono text-[13px] font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onSetInventario(key, round2(tramos + 1))}
                        aria-label={`Sumar 1 tramo de ${perfil.nombre}`}
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
    </section>
  );
};
