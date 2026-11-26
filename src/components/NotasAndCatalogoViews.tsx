import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, PencilLine, Calendar, Ruler, Layers } from 'lucide-react';
import {
  AperturaVentanaId,
  CATALOGO_MARCAS_MEXICO,
  CATALOGO_PERFILES,
  HERRAJES_INVENTARIO_CATALOGO,
  HerrajeCategoria,
  LINEAS_CONFIG,
  LineaId,
  MEXICO_ALUMINUM_CATEGORIES,
  MEXICO_ALUMINUM_SYSTEMS,
  MexicoAluminumCategoryId,
  PerfilCatalogoId,
  PerfilFamilia,
} from '../utils/alumineroLogic';
import {
  compressImageToDataUrl,
  getPerfilFotoUrl,
  NotaObra,
  PerfilFotosMap,
} from '../utils/storageHelpers';
import { PerfilSectionSvg } from './PerfilSectionSvg';
import { OfficialProfileSvg } from './OfficialProfileSvg';
import { PhotoPickerButtons } from './PhotoPickerButtons';
import {
  DEFAULT_CATALOG_VIGENCIA_LABEL,
  filterOfficialCatalog,
  OFFICIAL_BRANDS_2026,
  OFFICIAL_CATALOG_2026,
  OFFICIAL_EUROALUM_CUT_TABLES,
  OfficialBrandId,
  OfficialCatalogItem,
  OfficialItemTipo,
  OfficialSvgArchetype,
} from '../utils/officialCatalog2026';

interface NotasProps {
  notas: NotaObra[];
  onAddNota: (nota: Omit<NotaObra, 'id' | 'fecha'>) => void;
  onDeleteNota: (id: string) => void;
  onConvertirNota: (nota: NotaObra) => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const NotasView: React.FC<NotasProps> = ({
  notas,
  onAddNota,
  onDeleteNota,
  onConvertirNota,
  onShowToast,
}) => {
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [lineaHint, setLineaHint] = useState<LineaId | ''>('');
  const [aperturaHint, setAperturaHint] = useState<AperturaVentanaId | ''>('');
  const [anchoCm, setAnchoCm] = useState<string>('');
  const [altoCm, setAltoCm] = useState<string>('');
  const [fotoDataUrl, setFotoDataUrl] = useState<string | undefined>(undefined);
  const [modoLectura, setModoLectura] = useState<boolean>(false);

  const handlePhotoFile = async (file: File) => {
    try {
      const url = await compressImageToDataUrl(file, 600, 0.78);
      setFotoDataUrl(url);
      onShowToast('Foto adjuntada a la nota (máx. 600 px JPEG)');
    } catch {
      onShowToast('No se pudo cargar la foto');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() && !texto.trim()) {
      onShowToast('Escribe un título o nota primero');
      return;
    }
    onAddNota({
      titulo: titulo.trim() || 'Nota de Obra',
      texto: texto.trim(),
      fotoDataUrl,
      lineaHint: lineaHint || undefined,
      aperturaHint: aperturaHint || undefined,
      anchoCm: anchoCm ? Math.max(20, Number(anchoCm) || 0) : undefined,
      altoCm: altoCm ? Math.max(20, Number(altoCm) || 0) : undefined,
    });
    setTitulo('');
    setTexto('');
    setLineaHint('');
    setAperturaHint('');
    setAnchoCm('');
    setAltoCm('');
    setFotoDataUrl(undefined);
    onShowToast('Nota guardada', true);
  };

  return (
    <section id="view-notas" className="screen-animate">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-[21px] font-extrabold text-white">Notas de Obra</h1>
          <p className="m-0 text-[12.5px] text-slate-300">
            {modoLectura
              ? 'Modo Lectura activo · Vista limpia sin campos de edición para revisar tus apuntes en campo'
              : 'Bloc rápido gratuito en campo con conversión a cotización en 1 clic'}
          </p>
        </div>

        <button
          type="button"
          id="btn-notas-modo-lectura"
          aria-pressed={modoLectura}
          onClick={() => setModoLectura((prev) => !prev)}
          className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-xl border text-[12.5px] font-extrabold cursor-pointer transition-all shadow-sm ${
            modoLectura
              ? 'bg-amber-400 hover:bg-amber-300 border-amber-300 text-slate-950'
              : 'bg-slate-800/90 hover:bg-slate-700 border-slate-600 text-white'
          }`}
        >
          {modoLectura ? (
            <>
              <PencilLine className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Modo Edición</span>
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Modo Lectura</span>
            </>
          )}
        </button>
      </div>

      {modoLectura ? (
        <div
          id="notas-modo-lectura-view"
          className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[20px] p-4 sm:p-6 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="m-0 text-[17px] font-extrabold text-slate-900">
                  Apuntes de Obra ({notas.length})
                </h2>
                <span className="text-[11.5px] font-semibold text-slate-500">
                  Lectura limpia en tarjetas · Toca cualquier nota para cotizar
                </span>
              </div>
            </div>
            <button
              type="button"
              id="btn-notas-salir-lectura"
              onClick={() => setModoLectura(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[12px] font-extrabold cursor-pointer"
            >
              <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Agregar / Editar notas</span>
            </button>
          </div>

          {notas.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50">
              <p className="m-0 text-[14px] font-bold text-slate-700">
                Todavía no tienes notas de obra guardadas.
              </p>
              <p className="m-0 mt-1 text-[12.5px] text-slate-500">
                Cambia a Modo Edición para registrar tu primera nota o foto de campo.
              </p>
              <button
                type="button"
                onClick={() => setModoLectura(false)}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold cursor-pointer"
              >
                + Crear primera nota
              </button>
            </div>
          ) : (
            <div
              id="notas-modo-lectura-grid"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {notas.map((n) => (
                <article
                  key={n.id}
                  data-nota-reading-card="true"
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3.5 hover:border-blue-300 transition-colors"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2.5">
                      <h3 className="m-0 text-[16px] font-extrabold text-slate-900 leading-snug">
                        {n.titulo}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-bold shrink-0">
                        <Calendar className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        {n.fecha}
                      </span>
                    </div>

                    {(n.lineaHint || n.aperturaHint || n.anchoCm || n.altoCm) && (
                      <div className="flex flex-wrap gap-1.5">
                        {n.lineaHint && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11.5px] font-extrabold">
                            <Layers className="w-3 h-3" aria-hidden="true" />
                            {LINEAS_CONFIG[n.lineaHint]?.nombre || n.lineaHint}
                          </span>
                        )}
                        {n.aperturaHint && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-200/80 text-slate-800 text-[11.5px] font-extrabold capitalize">
                            {n.aperturaHint}
                          </span>
                        )}
                        {(n.anchoCm || n.altoCm) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11.5px] font-extrabold mono">
                            <Ruler className="w-3 h-3" aria-hidden="true" />
                            {n.anchoCm || '?'} × {n.altoCm || '?'} cm
                          </span>
                        )}
                      </div>
                    )}

                    {n.texto && (
                      <p className="m-0 text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap bg-white rounded-xl border border-slate-200/90 p-3">
                        {n.texto}
                      </p>
                    )}

                    {n.fotoDataUrl && (
                      <img
                        src={n.fotoDataUrl}
                        alt={n.titulo}
                        className="w-full max-h-60 rounded-xl border border-slate-200 object-cover bg-white"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onConvertirNota(n)}
                    className="w-full min-h-[42px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-extrabold cursor-pointer transition-colors"
                  >
                    ⚡ Convertir a Cotización en 1 Clic
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
        <form
          onSubmit={handleSave}
          className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl flex flex-col gap-3"
        >
          <h2 className="m-0 text-[17px] font-extrabold">Nueva Nota Rápida</h2>
          <div>
            <label htmlFor="inp-nota-titulo" className="block text-[12px] font-bold text-slate-500 mb-1">
              Obra / Ubicación
            </label>
            <input
              id="inp-nota-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Casa Sr. Martínez — Recámara principal"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-[14px] font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="sel-nota-linea" className="block text-[11.5px] font-bold text-slate-500 mb-1">
                Línea (opcional)
              </label>
              <select
                id="sel-nota-linea"
                value={lineaHint}
                onChange={(e) => setLineaHint(e.target.value as LineaId | '')}
                className="w-full min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-[12.5px] font-semibold bg-white"
              >
                <option value="">Detectar automáticamente del texto</option>
                {Object.values(LINEAS_CONFIG).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sel-nota-apertura" className="block text-[11.5px] font-bold text-slate-500 mb-1">
                Tipo de ventana (opcional)
              </label>
              <select
                id="sel-nota-apertura"
                value={aperturaHint}
                onChange={(e) => setAperturaHint(e.target.value as AperturaVentanaId | '')}
                className="w-full min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-[12.5px] font-semibold bg-white"
              >
                <option value="">Detectar automáticamente del texto</option>
                <option value="corrediza">Corrediza</option>
                <option value="fija">Fija (Fijo 3")</option>
                <option value="guillotina">Guillotina</option>
                <option value="abatible">Abatible vertical</option>
                <option value="banderola">Banderola</option>
                <option value="oscilobatiente">Oscilobatiente</option>
                <option value="plegable">Plegable / tipo libro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="inp-nota-ancho" className="block text-[11.5px] font-bold text-slate-500 mb-1">
                Ancho cm (opcional)
              </label>
              <input
                id="inp-nota-ancho"
                type="number"
                min={20}
                value={anchoCm}
                onChange={(e) => setAnchoCm(e.target.value)}
                placeholder="Ej. 145"
                className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 mono text-[13px]"
              />
            </div>
            <div>
              <label htmlFor="inp-nota-alto" className="block text-[11.5px] font-bold text-slate-500 mb-1">
                Alto cm (opcional)
              </label>
              <input
                id="inp-nota-alto"
                type="number"
                min={20}
                value={altoCm}
                onChange={(e) => setAltoCm(e.target.value)}
                placeholder="Ej. 120"
                className="w-full min-h-[40px] rounded-xl border border-slate-200 px-3 mono text-[13px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="inp-nota-texto" className="block text-[12px] font-bold text-slate-500 mb-1">
              Medidas y observaciones
            </label>
            <textarea
              id="inp-nota-texto"
              rows={3}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej. Ventana guillotina 145 x 120 cm en blanco con vidrio filtrasol, o cancel para baño 150 x 190 cm."
              className="w-full rounded-xl border border-slate-200 p-3 text-[13.5px]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-bold text-slate-600">Foto de Campo (opcional)</span>
              {fotoDataUrl && <span className="text-[12px] text-emerald-700 font-bold">✓ Foto lista</span>}
            </div>
            <PhotoPickerButtons
              compact
              onSelectFile={(file) => void handlePhotoFile(file)}
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] cursor-pointer"
          >
            Guardar Nota
          </button>
        </form>

        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
          <h2 className="m-0 text-[17px] font-extrabold mb-3">Apuntes Guardados ({notas.length})</h2>
          {notas.length === 0 ? (
            <p className="text-[12.5px] text-slate-600 p-5 text-center border border-dashed border-slate-300 rounded-xl">
              Sin notas guardadas todavía.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {notas.map((n) => (
                <div key={n.id} className="p-3 rounded-xl border border-slate-300 bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="block text-[14px] text-[#1E293B]">{n.titulo}</strong>
                      <span className="text-[11px] text-slate-600">{n.fecha}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteNota(n.id)}
                      className="px-2 py-1 rounded-lg border border-red-200 bg-white text-red-600 text-[12px] font-bold cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                  {(n.lineaHint || n.aperturaHint || n.anchoCm || n.altoCm) && (
                    <div className="mt-1.5 text-[11.5px] font-bold text-blue-700 mono">
                      {n.lineaHint ? LINEAS_CONFIG[n.lineaHint]?.nombre : 'Auto'} ·{' '}
                      {n.aperturaHint || 'auto'} · {n.anchoCm || '?'}×{n.altoCm || '?'} cm
                    </div>
                  )}
                  {n.texto && <p className="text-[13px] text-slate-700 mt-1.5 mb-0 whitespace-pre-wrap">{n.texto}</p>}
                  {n.fotoDataUrl && (
                    <img
                      src={n.fotoDataUrl}
                      alt={n.titulo}
                      className="mt-2.5 max-h-44 rounded-lg border border-slate-200 object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onConvertirNota(n)}
                    className="w-full min-h-[40px] mt-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-extrabold cursor-pointer"
                  >
                    ⚡ Convertir a Cotización en 1 Clic
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </section>
  );
};

interface CatalogoProps {
  perfilFotos: PerfilFotosMap;
  onOpenPerfilModal: (id: PerfilCatalogoId) => void;
  onUploadPerfilFoto: (id: PerfilCatalogoId, file: File) => void;
  onRemovePerfilFoto: (id: PerfilCatalogoId) => void;
  onOpenSugerencias: () => void;
  catalogoTab?: 'perfiles' | 'herrajes';
  onChangeCatalogoTab?: (tab: 'perfiles' | 'herrajes') => void;
  catalogVigenciaLabel?: string;
  onSelectLineaFromCatalog?: (linea: LineaId) => void;
}

const FAMILIAS_CATALOGO: { id: PerfilFamilia | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos los sistemas' },
  { id: 'nacional2', label: 'Línea Nacional 2"' },
  { id: 'fijo3', label: 'Línea Nacional 3" (Fijo)' },
  { id: 'corrediza3', label: 'Línea Nacional 3" (Corrediza)' },
  { id: 'serie1400', label: 'Serie 1400' },
  { id: 'espanola', label: 'Española / Europea' },
  { id: 'cancel', label: 'Cancel de Baño' },
  { id: 'herralum', label: 'Herralum' },
  { id: 'perfileto', label: 'Perfiletto' },
  { id: 'batiente', label: 'Puerta Batiente' },
  { id: 'mosquitero', label: 'Mosquiteros' },
];

function inferHerrajeArchetype(cat: HerrajeCategoria, nombre: string): OfficialSvgArchetype {
  const n = nombre.toLowerCase();
  if (cat === 'Carretillas' || n.includes('carretilla')) return 'carretilla';
  if (cat === 'Viniles' || cat === 'Felpas y Sellos' || n.includes('vinil') || n.includes('felpa')) return 'vinil';
  if (n.includes('bisagra')) return 'bisagra';
  if (n.includes('jaladera') || n.includes('embutir') || n.includes('uñero') || n.includes('automátic')) return 'cierre-embutido';
  if (n.includes('chapa') || n.includes('cerradura') || n.includes('multipunto')) return 'chapa';
  if (n.includes('manija')) return 'manilla';
  return 'escuadra';
}

export const CatalogoView: React.FC<CatalogoProps> = ({
  perfilFotos,
  onOpenPerfilModal,
  onUploadPerfilFoto,
  onRemovePerfilFoto,
  onOpenSugerencias,
  catalogoTab: controlledCatalogoTab,
  onChangeCatalogoTab,
  catalogVigenciaLabel,
  onSelectLineaFromCatalog,
}) => {
  const [localCatalogoTab, setLocalCatalogoTab] = useState<'perfiles' | 'herrajes'>('perfiles');
  const catalogoTab = controlledCatalogoTab ?? localCatalogoTab;
  const setCatalogoTab = (next: 'perfiles' | 'herrajes') => {
    if (next === catalogoTab) return;
    if (onChangeCatalogoTab) onChangeCatalogoTab(next);
    else setLocalCatalogoTab(next);
  };

  // Estado del Catálogo Oficial 2026–2027 (5 marcas reales)
  const [officialBrand, setOfficialBrand] = useState<OfficialBrandId | 'all'>('panorama-cuprum');
  const [officialLinea, setOfficialLinea] = useState<string>('all');
  const [officialTipo, setOfficialTipo] = useState<OfficialItemTipo | 'all'>('all');
  const [officialQuery, setOfficialQuery] = useState('');
  const [zoomOfficialItem, setZoomOfficialItem] = useState<OfficialCatalogItem | null>(null);
  const [showWorkshopCatalog, setShowWorkshopCatalog] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [marcaFilter, setMarcaFilter] = useState<string>('Todos');
  const [familiaFilter, setFamiliaFilter] = useState<PerfilFamilia | 'all'>('all');
  const [mxCatFilter, setMxCatFilter] = useState<MexicoAluminumCategoryId | 'all'>('all');
  const [herrajeCat, setHerrajeCat] = useState<HerrajeCategoria | 'all'>('all');
  const [herrajeQuery, setHerrajeQuery] = useState('');
  const uploadTargetRef = useRef<PerfilCatalogoId | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const vigenciaTexto = catalogVigenciaLabel?.trim() || DEFAULT_CATALOG_VIGENCIA_LABEL;

  const officialLineasForBrand = Array.from(
    new Set(
      OFFICIAL_CATALOG_2026.filter((it) => officialBrand === 'all' || it.brandId === officialBrand).map(
        (it) => it.linea
      )
    )
  );

  const officialFiltered = filterOfficialCatalog(
    officialBrand,
    officialQuery,
    officialTipo,
    officialLinea
  );

  const officialHerrajesAndCanceles = filterOfficialCatalog(
    'all',
    herrajeQuery,
    'all',
    'all'
  ).filter((it) => it.tipo === 'herraje' || it.tipo === 'cancel');

  const filtrados = CATALOGO_PERFILES.filter((p) => {
    const matchFam = familiaFilter === 'all' || p.familia === familiaFilter;
    const itemMarca = (p.marcaCatalogo || 'Alumer').toLowerCase();
    const selMarca = marcaFilter.toLowerCase();
    const matchMarca =
      marcaFilter === 'Todos' ||
      itemMarca.includes(selMarca) ||
      p.codigoRef.toLowerCase().includes(selMarca) ||
      (p.sistemaCatalogo || '').toLowerCase().includes(selMarca);
    const q = busqueda.trim().toLowerCase();
    const matchText =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      p.codigoRef.toLowerCase().includes(q) ||
      p.uso.toLowerCase().includes(q) ||
      (p.marcaCatalogo || '').toLowerCase().includes(q) ||
      (p.sistemaCatalogo || '').toLowerCase().includes(q);
    return matchFam && matchMarca && matchText;
  });

  const herrajesCategorias = Array.from(
    new Set(HERRAJES_INVENTARIO_CATALOGO.map((h) => h.categoria))
  );

  const herrajesFiltrados = HERRAJES_INVENTARIO_CATALOGO.filter((h) => {
    const matchCat = herrajeCat === 'all' || h.categoria === herrajeCat;
    const q = herrajeQuery.trim().toLowerCase();
    const matchText =
      !q ||
      h.nombre.toLowerCase().includes(q) ||
      (h.modelo || '').toLowerCase().includes(q) ||
      (h.tamano || '').toLowerCase().includes(q) ||
      (h.color || '').toLowerCase().includes(q);
    return matchCat && matchText;
  });

  const triggerUpload = (id: PerfilCatalogoId, source: 'camera' | 'gallery', e: React.MouseEvent) => {
    e.stopPropagation();
    uploadTargetRef.current = id;
    if (source === 'camera') {
      cameraInputRef.current?.click();
    } else {
      galleryInputRef.current?.click();
    }
  };

  return (
    <section id="view-catalogo" className="screen-animate">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              id="catalogo-vigencia-badge"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-emerald-400/60 bg-emerald-500/20 text-emerald-100 text-[11.5px] font-extrabold shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
              <span>{vigenciaTexto}</span>
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl border border-blue-400/40 bg-blue-500/15 text-blue-100 text-[11px] font-bold mono">
              {OFFICIAL_CATALOG_2026.length} claves oficiales · Tramo 6.10 m
            </span>
          </div>
          <h1 className="m-0 text-[21px] font-extrabold text-white">
            Catálogo Oficial de Perfiles y Herrajes (México)
          </h1>
          <p className="m-0 text-[12.5px] text-slate-300 mt-0.5">
            Claves oficiales vigentes de Panorama / Cuprum, Perfiletto, Indalum / EuroAlum, Extrusiones Metálicas y Herralum 2026 con dibujos técnicos CAD
          </p>
        </div>
        <button
          type="button"
          id="btn-catalogo-sugerencias"
          onClick={onOpenSugerencias}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-[12px] border border-amber-400/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[13px] font-extrabold cursor-pointer shrink-0 transition-colors"
        >
          <span>💬</span>
          <span>Sugerir Línea o Perfil</span>
        </button>
      </div>

      <div className="inv-segmented-tabs grid grid-cols-2 gap-1.5 p-1.5 rounded-[14px] bg-[#13315C] border border-slate-400/30 mb-4">
        <button
          type="button"
          id="cat-tab-perfiles"
          onClick={() => setCatalogoTab('perfiles')}
          className={`min-h-[42px] rounded-[10px] text-[13px] font-extrabold cursor-pointer transition-colors ${
            catalogoTab === 'perfiles' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Perfiles y Catálogos Oficiales ({OFFICIAL_CATALOG_2026.length})
        </button>
        <button
          type="button"
          id="cat-tab-herrajes"
          onClick={() => setCatalogoTab('herrajes')}
          className={`min-h-[42px] rounded-[10px] text-[13px] font-extrabold cursor-pointer transition-colors ${
            catalogoTab === 'herrajes' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Herrajes, Viniles y Canceles ({officialHerrajesAndCanceles.length + HERRAJES_INVENTARIO_CATALOGO.length})
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadTargetRef.current) {
            onUploadPerfilFoto(uploadTargetRef.current, file);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadTargetRef.current) {
            onUploadPerfilFoto(uploadTargetRef.current, file);
          }
          e.target.value = '';
        }}
      />

      {catalogoTab === 'herrajes' ? (
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl flex flex-col gap-5">
          {/* Bloque 1: Herrajes Oficiales 2026 (Herralum, EuroAlum, Línea Española) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[16.5px] font-extrabold text-slate-900">
                  Herrajes y Canceles Oficiales 2026 (Claves Reales)
                </h2>
                <p className="m-0 text-[12px] text-slate-600 mt-0.5">
                  Herralum 2026 (Carretillas, Chapas, Cierres, Escuadras Monticelli, Viniles, Canceles 1300–1338) · Herrajes EuroAlum (A-2501 a A-5091) · Línea Española
                </p>
              </div>
              <span className="mono text-[11.5px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 shrink-0">
                {officialHerrajesAndCanceles.length} claves oficiales
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <input
                type="search"
                value={herrajeQuery}
                onChange={(e) => setHerrajeQuery(e.target.value)}
                placeholder="Buscar clave oficial o nombre (ej. 2008, 138201700, 1068149079, A-2501, 1305 Bacalar, 7042)..."
                className="w-full sm:w-auto sm:flex-1 min-w-0 min-h-[44px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {officialHerrajesAndCanceles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setZoomOfficialItem(item)}
                  className="p-3 rounded-[14px] border border-slate-300 bg-slate-50/70 hover:bg-white hover:border-blue-500 hover:shadow-md text-left text-[#1E293B] flex items-center gap-3 min-w-0 cursor-pointer transition-all"
                >
                  <OfficialProfileSvg archetype={item.svgArchetype} clave={item.clave} size={68} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#0B2545] text-white text-[10px] font-extrabold uppercase tracking-wide">
                        {item.brandLabel}
                      </span>
                      <span className="mono text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                        {item.clave}
                      </span>
                    </div>
                    <strong className="block text-[13px] text-[#1E293B] mt-1 leading-snug break-words">
                      {item.nombre}
                    </strong>
                    <span className="block text-[11px] text-slate-600 mt-0.5 leading-snug break-words">
                      {item.uso}
                    </span>
                    <span className="inline-block mono text-[10.5px] font-bold text-slate-500 mt-1">
                      {item.linea} · {item.largoUnidad}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bloque 2: Catálogo general de taller (Inventario) */}
          <div className="pt-4 border-t-2 border-slate-200">
            <h3 className="m-0 text-[15px] font-extrabold text-slate-900 mb-2">
              Accesorios y Herrajes de Uso Frecuente en Taller ({herrajesFiltrados.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => setHerrajeCat('all')}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold border cursor-pointer ${
                  herrajeCat === 'all'
                    ? 'bg-[#0B2545] text-white border-[#0B2545]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {herrajesCategorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setHerrajeCat(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold border cursor-pointer ${
                    herrajeCat === cat
                      ? 'bg-[#0B2545] text-white border-[#0B2545]'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {herrajesFiltrados.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-[14px] border border-slate-300 bg-slate-50/70 text-[#1E293B] flex items-center gap-3 min-w-0 overflow-hidden"
                >
                  <OfficialProfileSvg
                    archetype={inferHerrajeArchetype(h.categoria, h.nombre)}
                    clave={h.modelo || h.categoria}
                    size={58}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wide text-blue-700 break-words">
                      {h.categoria}
                    </span>
                    <strong className="block text-[13px] text-[#1E293B] mt-0.5 break-words leading-snug">
                      {h.nombre}
                    </strong>
                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-slate-700 mt-1 min-w-0">
                      {h.modelo && <span className="break-words">Mod: <strong>{h.modelo}</strong></span>}
                      {h.tamano && <span className="break-words">Med: <strong className="mono">{h.tamano}</strong></span>}
                      {h.color && <span className="break-words">Color: <strong>{h.color}</strong></span>}
                      <span className="mono text-slate-600">Ud: {h.unidad}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* PANEL PRINCIPAL: CATÁLOGOS OFICIALES 2026–2027 (5 MARCAS + CLAVES REALES + CAD SVG) */}
          <div
            id="official-catalog-2026-panel"
            className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl min-w-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold text-[#0B2545]">
                  Catálogos Oficiales por Marca (Claves Reales 2026)
                </h2>
                <p className="m-0 text-[12px] text-slate-600 mt-0.5">
                  Tramo estándar 6.10 m salvo indicación · Selecciona una marca o busca directamente por clave oficial (ej. 69135, 628407, 12263, 6001, 138201700)
                </p>
              </div>
              <span className="mono text-[11.5px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 shrink-0">
                {officialFiltered.length} de {OFFICIAL_CATALOG_2026.length} claves
              </span>
            </div>

            {/* Pestañas de las 5 Marcas Oficiales */}
            <div
              role="tablist"
              aria-label="Marcas oficiales de aluminio y herrajes"
              className="flex flex-wrap gap-1.5 mb-3"
            >
              <button
                type="button"
                role="tab"
                aria-selected={officialBrand === 'all'}
                id="brand-tab-all"
                onClick={() => {
                  setOfficialBrand('all');
                  setOfficialLinea('all');
                }}
                className={`px-3 py-2 rounded-xl text-[12px] font-extrabold border cursor-pointer transition-all ${
                  officialBrand === 'all'
                    ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Todas ({OFFICIAL_CATALOG_2026.length})
              </button>
              {OFFICIAL_BRANDS_2026.map((b) => {
                const count = OFFICIAL_CATALOG_2026.filter((it) => it.brandId === b.id).length;
                const active = officialBrand === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    id={`brand-tab-${b.id}`}
                    onClick={() => {
                      setOfficialBrand(b.id);
                      setOfficialLinea('all');
                    }}
                    className={`px-3 py-2 rounded-xl text-[12px] font-extrabold border cursor-pointer transition-all ${
                      active
                        ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                        : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    {b.nombre} ({count})
                  </button>
                );
              })}
            </div>

            {/* Filtros de línea/serie, tipo y búsqueda por clave */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mb-4">
              <div className="sm:col-span-5">
                <input
                  id="input-official-catalog-search"
                  type="search"
                  value={officialQuery}
                  onChange={(e) => setOfficialQuery(e.target.value)}
                  placeholder="Buscar por clave oficial o perfil (ej. 69135, 1695, 12263, A-2501, 6001)..."
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13px] font-semibold bg-white"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  aria-label="Filtrar por línea o serie oficial"
                  value={officialLinea}
                  onChange={(e) => setOfficialLinea(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-2.5 text-[12.5px] font-bold bg-white text-slate-800"
                >
                  <option value="all">Todas las líneas / series ({officialLineasForBrand.length})</option>
                  {officialLineasForBrand.map((ln) => (
                    <option key={ln} value={ln}>
                      {ln}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <select
                  aria-label="Filtrar por tipo de artículo"
                  value={officialTipo}
                  onChange={(e) => setOfficialTipo(e.target.value as OfficialItemTipo | 'all')}
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-2.5 text-[12.5px] font-bold bg-white text-slate-800"
                >
                  <option value="all">Perfiles, Herrajes y Canceles</option>
                  <option value="perfil">Solo Perfiles (6.10 m)</option>
                  <option value="herraje">Solo Herrajes</option>
                  <option value="cancel">Solo Canceles de Baño</option>
                </select>
              </div>
            </div>

            {officialFiltered.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-[13px] font-semibold text-slate-600">
                No se encontraron claves oficiales con ese filtro. Prueba cambiar la marca a "Todas" o limpiar la búsqueda.
              </div>
            ) : (
              <div
                id="official-catalog-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[640px] overflow-y-auto pr-1"
              >
                {officialFiltered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setZoomOfficialItem(item)}
                    className="p-3 rounded-[14px] border border-slate-300 bg-white hover:border-blue-500 hover:shadow-md text-left text-[#1E293B] flex items-center gap-3 min-w-0 cursor-pointer transition-all"
                  >
                    <OfficialProfileSvg archetype={item.svgArchetype} clave={item.clave} size={74} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="mono text-[11.5px] font-black px-2 py-0.5 rounded-md bg-[#0B2545] text-white">
                          {item.clave}
                        </span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800">
                          {item.linea}
                        </span>
                      </div>
                      <strong className="block text-[13px] font-extrabold text-slate-900 mt-1 leading-snug break-words">
                        {item.nombre}
                      </strong>
                      <p className="m-0 text-[11px] text-slate-600 mt-0.5 leading-snug break-words line-clamp-2">
                        {item.uso}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1 text-[10.5px] font-bold text-slate-500">
                        <span>{item.brandLabel}</span>
                        <span className="mono text-emerald-700">{item.largoUnidad}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TABLAS OFICIALES DE DESCUENTO DE CORTE: EUROALUM 2500, 2800 Y 3800 */}
          <div
            id="official-euroalum-cut-tables"
            className="bg-white text-[#1E293B] border-[1.5px] border-emerald-300 rounded-[18px] p-4 sm:p-5 shadow-xl min-w-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold text-[#0B2545]">
                  Tablas Oficiales de Descuento de Corte — Indalum EuroAlum
                </h2>
                <p className="m-0 text-[12px] text-slate-600 mt-0.5">
                  Integradas directamente en el motor de cálculo (fórmulas en milímetros: H = Ancho mm, V = Alto mm)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {OFFICIAL_EUROALUM_CUT_TABLES.map((tbl) => (
                <div
                  key={tbl.id}
                  className="p-4 rounded-2xl border border-slate-300 bg-slate-50 flex flex-col justify-between gap-3 min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <strong className="text-[14px] font-extrabold text-[#0B2545] leading-snug">
                        {tbl.titulo}
                      </strong>
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10.5px] font-extrabold mono shrink-0">
                        Corte {tbl.anguloPrincipal}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                      {tbl.filas.map((f, idx) => (
                        <div key={idx} className="py-2 flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="mono text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 shrink-0">
                                {f.clave}
                              </span>
                              <span className="text-[12px] font-bold text-slate-800 truncate">
                                {f.perfil}
                              </span>
                            </div>
                            <span className="mono text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 shrink-0">
                              {f.cantidad}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[11.5px] pl-0.5">
                            <span className="mono font-extrabold text-slate-900 break-words">
                              {f.formulaMm} mm
                            </span>
                            <span className="text-[10.5px] font-bold text-slate-500 shrink-0">
                              {f.corte}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {onSelectLineaFromCatalog && (
                    <button
                      type="button"
                      id={`btn-calc-${tbl.id}`}
                      onClick={() => onSelectLineaFromCatalog(tbl.id)}
                      className="w-full min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold cursor-pointer transition-colors"
                    >
                      Calcular {tbl.titulo.split(' (')[0]} en Cotizador →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN FOTOS REALES DE PERFILES DEL TALLER (COLAPSABLE) */}
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="m-0 text-[16px] font-extrabold text-[#1E293B]">
                  Secciones con Foto Real de Taller ({CATALOGO_PERFILES.length} perfiles base)
                </h2>
                <p className="m-0 text-[12px] text-slate-600 mt-0.5">
                  Personaliza con fotografías reales de tu cámara o galería los perfiles utilizados en despieces
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkshopCatalog((prev) => !prev)}
                className="min-h-[38px] px-3.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900 text-[12px] font-extrabold cursor-pointer"
              >
                {showWorkshopCatalog ? 'Ocultar perfiles con foto ▲' : 'Ver / Subir fotos reales ▼'}
              </button>
            </div>

            {showWorkshopCatalog && (
              <div className="mt-4">
                <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label
                      htmlFor="sel-catalogo-marca"
                      className="text-[11.5px] font-extrabold uppercase tracking-wide text-slate-700"
                    >
                      Catálogo / Marca comercial (México)
                    </label>
                    <select
                      id="sel-catalogo-marca"
                      value={marcaFilter}
                      onChange={(e) => setMarcaFilter(e.target.value)}
                      className="min-h-[34px] rounded-lg border border-slate-300 bg-white px-2.5 text-[12px] font-extrabold text-slate-900"
                    >
                      <option value="Todos">Todas las marcas</option>
                      {CATALOGO_MARCAS_MEXICO.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Todos', ...CATALOGO_MARCAS_MEXICO].map((m) => (
                      <button
                        key={m}
                        type="button"
                        data-marca-filter={m}
                        onClick={() => setMarcaFilter(m)}
                        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-extrabold border cursor-pointer transition-colors ${
                          marcaFilter === m
                            ? m === 'Perfileto'
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-blue-700 text-white border-blue-800'
                            : m === 'Perfileto'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m === 'Perfileto' ? '★ Perfiletto' : m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {FAMILIAS_CATALOGO.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFamiliaFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold border cursor-pointer ${
                        familiaFilter === f.id
                          ? 'bg-[#0B2545] text-white border-[#0B2545]'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar perfil, marca o clave oficial..."
                    className="w-full sm:w-auto sm:flex-1 min-w-0 min-h-[44px] rounded-xl border border-slate-200 px-3 text-[13.5px] font-semibold"
                  />
                  <span className="text-[12px] font-bold text-slate-500 mono shrink-0">
                    {filtrados.length} de {CATALOGO_PERFILES.length} perfiles
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtrados.map((p) => {
                    const fotoUrl = getPerfilFotoUrl(perfilFotos, p.id);
                    const tieneFoto = Boolean(fotoUrl);
                    const marcaLabel = p.marcaCatalogo || 'Panorama / Cuprum';
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col justify-between p-3.5 rounded-[14px] border-[1.5px] border-slate-300 bg-white text-[#1E293B] hover:border-blue-500 hover:shadow-md transition-all min-w-0 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenPerfilModal(p.id)}
                          className="text-left bg-transparent border-0 p-0 cursor-pointer w-full min-w-0"
                        >
                          <div
                            data-preserve-light="true"
                            className="w-full h-[132px] rounded-[11px] bg-white border border-slate-300 flex items-center justify-center mb-2.5 p-2 overflow-hidden"
                          >
                            <PerfilSectionSvg perfilId={p.id} fotoRealUrl={fotoUrl} size={112} />
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                                marcaLabel.toLowerCase().includes('perfilet')
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {marcaLabel}
                            </span>
                            {p.sistemaCatalogo && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                                {p.sistemaCatalogo}
                              </span>
                            )}
                          </div>
                          <div className="flex items-start justify-between gap-2 min-w-0 flex-wrap">
                            <strong className="text-[14px] text-[#1E293B] break-words min-w-0 flex-1">{p.nombre}</strong>
                            {tieneFoto && (
                              <span className="text-[10.5px] font-extrabold text-emerald-700 shrink-0">Foto real</span>
                            )}
                          </div>
                          <div className="mono text-[11.5px] font-bold text-blue-600 mt-0.5 break-words">{p.codigoRef}</div>
                          <div className="mono text-[11px] text-slate-600 mt-0.5 break-words">{p.dimensiones}</div>
                          <p className="text-[12px] text-slate-700 mt-1 mb-2 leading-snug break-words">{p.uso}</p>
                        </button>

                        <div className="flex flex-col gap-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => triggerUpload(p.id, 'camera', e)}
                              className="flex flex-col items-center justify-center gap-1 min-h-[54px] px-2 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-extrabold cursor-pointer text-center"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                <circle cx="12" cy="13" r="3.5" />
                              </svg>
                              <span className="leading-tight">Tomar Foto (Cámara)</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => triggerUpload(p.id, 'gallery', e)}
                              className="flex flex-col items-center justify-center gap-1 min-h-[54px] px-2 py-1.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900 text-[11px] font-extrabold cursor-pointer text-center"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="3" width="18" height="18" rx="3" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="m21 15-5-5L5 21" />
                              </svg>
                              <span className="leading-tight">Elegir de Galería</span>
                            </button>
                          </div>
                          {tieneFoto && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemovePerfilFoto(p.id);
                              }}
                              className="w-full min-h-[34px] px-2.5 py-1 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11.5px] font-bold cursor-pointer"
                            >
                              Quitar foto
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Catálogo Integral de Líneas Comerciales de Aluminio en México */}
            <div
              id="catalogo-lineas-mexico"
              className="mt-5 pt-4 border-t-2 border-slate-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="m-0 text-[16px] font-extrabold text-[#1E293B]">
                    🇲🇽 Líneas y Sistemas Comerciales de Aluminio en México
                  </h2>
                  <p className="m-0 text-[12px] text-slate-600 mt-0.5">
                    Línea Nacional (Panorama / Cuprum / Indalum / Perfiletto), Línea Española (Extrusiones Metálicas), Línea Europea (EuroAlum / Perfiletto) y Estructurales
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold mono shrink-0">
                  {MEXICO_ALUMINUM_SYSTEMS.length} sistemas
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setMxCatFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold border cursor-pointer ${
                    mxCatFilter === 'all'
                      ? 'bg-[#0B2545] text-white border-[#0B2545]'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Todas las líneas
                </button>
                {MEXICO_ALUMINUM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setMxCatFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold border cursor-pointer ${
                      mxCatFilter === cat.id
                        ? 'bg-[#0B2545] text-white border-[#0B2545]'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {cat.id === 'nacional'
                      ? 'Línea Nacional (90°)'
                      : cat.id === 'espanola'
                        ? 'Línea Española (45°)'
                        : cat.id === 'europea'
                          ? 'Línea Europea (45°)'
                          : 'Estructurales / Industriales'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {MEXICO_ALUMINUM_SYSTEMS.filter((s) => {
                  const matchCat = mxCatFilter === 'all' || s.categoria === mxCatFilter;
                  const q = officialQuery.trim().toLowerCase();
                  const matchText =
                    !q ||
                    s.nombre.toLowerCase().includes(q) ||
                    s.fabricantes.toLowerCase().includes(q) ||
                    s.tipoCorte.toLowerCase().includes(q) ||
                    s.aplicacion.toLowerCase().includes(q);
                  return matchCat && matchText;
                }).map((sys) => (
                  <div
                    key={sys.id}
                    className="p-3.5 rounded-[14px] border border-slate-300 bg-slate-50/80 text-[#1E293B] flex flex-col justify-between gap-1.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-blue-700">
                          {sys.fabricantes}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                          {sys.tipoCorte}
                        </span>
                      </div>
                      <strong className="block text-[13.5px] text-[#1E293B] mt-1">{sys.nombre}</strong>
                      <p className="text-[11.5px] text-slate-600 mt-1 mb-0 leading-snug">
                        {sys.aplicacion}
                      </p>
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-slate-200 text-[11px] font-semibold text-slate-700">
                      Cristal / uso: <strong className="text-slate-900">{sys.cristalRecomendado}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ficha Técnica y Zoom CAD (renderizado en portal sobre viewport) */}
      {zoomOfficialItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="official-zoom-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Ficha técnica clave ${zoomOfficialItem.clave}`}
            onClick={() => setZoomOfficialItem(null)}
            className="fixed inset-0 z-[1200] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-300 bg-white text-slate-900 p-5 shadow-2xl flex flex-col gap-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="mono px-2.5 py-0.5 rounded-md bg-[#0B2545] text-white text-[12px] font-black">
                      Clave: {zoomOfficialItem.clave}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-extrabold">
                      {zoomOfficialItem.largoUnidad}
                    </span>
                  </div>
                  <h3 className="m-0 mt-1.5 text-[17px] font-extrabold text-slate-900">
                    {zoomOfficialItem.nombre}
                  </h3>
                  <p className="m-0 text-[12px] font-semibold text-blue-700">
                    {zoomOfficialItem.brandLabel} · {zoomOfficialItem.linea}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar ficha técnica"
                  onClick={() => setZoomOfficialItem(null)}
                  className="min-h-[36px] min-w-[36px] rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-center">
                <OfficialProfileSvg
                  archetype={zoomOfficialItem.svgArchetype}
                  clave={zoomOfficialItem.clave}
                  size={210}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[12.5px] text-slate-700 leading-relaxed">
                <strong className="block text-slate-900 mb-0.5">Aplicación oficial:</strong>
                {zoomOfficialItem.uso}
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] font-bold text-emerald-800">
                  ✓ {vigenciaTexto}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setZoomOfficialItem(null)}
                className="w-full min-h-[42px] rounded-xl bg-[#0B2545] hover:bg-slate-800 text-white text-[13px] font-extrabold cursor-pointer"
              >
                Cerrar Ficha Técnica
              </button>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
