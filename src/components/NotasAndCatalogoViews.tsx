import React, { useRef, useState } from 'react';
import {
  AperturaVentanaId,
  CATALOGO_PERFILES,
  HERRAJES_INVENTARIO_CATALOGO,
  HerrajeCategoria,
  LINEAS_CONFIG,
  LineaId,
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
import { PhotoPickerButtons } from './PhotoPickerButtons';

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
      <div className="mb-4">
        <h1 className="m-0 text-[21px] font-extrabold text-white">Notas de Obra</h1>
        <p className="m-0 text-[12.5px] text-slate-300">
          Bloc rápido gratuito en campo con conversión a cotización en 1 clic
        </p>
      </div>

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
    </section>
  );
};

interface CatalogoProps {
  perfilFotos: PerfilFotosMap;
  onOpenPerfilModal: (id: PerfilCatalogoId) => void;
  onUploadPerfilFoto: (id: PerfilCatalogoId, file: File) => void;
  onRemovePerfilFoto: (id: PerfilCatalogoId) => void;
  onOpenSugerencias: () => void;
}

const FAMILIAS_CATALOGO: { id: PerfilFamilia | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'fijo3', label: 'Fijo 3" (Alumer)' },
  { id: 'corrediza3', label: 'Corrediza 3" (Alumer)' },
  { id: 'batiente', label: 'Puerta Batiente (Alumer)' },
  { id: 'cancel', label: 'Cancel Baño (Alumer)' },
  { id: 'mosquitero', label: 'Mosquiteros' },
];

export const CatalogoView: React.FC<CatalogoProps> = ({
  perfilFotos,
  onOpenPerfilModal,
  onUploadPerfilFoto,
  onRemovePerfilFoto,
  onOpenSugerencias,
}) => {
  const [catalogoTab, setCatalogoTab] = useState<'perfiles' | 'herrajes'>('perfiles');
  const [busqueda, setBusqueda] = useState('');
  const [familiaFilter, setFamiliaFilter] = useState<PerfilFamilia | 'all'>('all');
  const [herrajeCat, setHerrajeCat] = useState<HerrajeCategoria | 'all'>('all');
  const [herrajeQuery, setHerrajeQuery] = useState('');
  const uploadTargetRef = useRef<PerfilCatalogoId | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const filtrados = CATALOGO_PERFILES.filter((p) => {
    const matchFam = familiaFilter === 'all' || p.familia === familiaFilter;
    const q = busqueda.toLowerCase();
    const matchText =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      p.codigoRef.toLowerCase().includes(q) ||
      p.uso.toLowerCase().includes(q);
    return matchFam && matchText;
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-[21px] font-extrabold text-white">
            Catálogo de Perfiles y Herrajes
          </h1>
          <p className="m-0 text-[12.5px] text-slate-300">
            Perfiles Alumer (sección transversal y fotos máx. 600 px), Viniles, Chapas, Jaladeras y Escuadras
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
          Perfiles Alumer ({CATALOGO_PERFILES.length})
        </button>
        <button
          type="button"
          id="cat-tab-herrajes"
          onClick={() => setCatalogoTab('herrajes')}
          className={`min-h-[42px] rounded-[10px] text-[13px] font-extrabold cursor-pointer transition-colors ${
            catalogoTab === 'herrajes' ? 'bg-white text-[#1E293B] shadow' : 'bg-transparent text-slate-300'
          }`}
        >
          Herrajes, Viniles y Escuadras ({HERRAJES_INVENTARIO_CATALOGO.length})
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
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
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

          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <input
              type="search"
              value={herrajeQuery}
              onChange={(e) => setHerrajeQuery(e.target.value)}
              placeholder="Buscar vinil, chapa, jaladera, color o escuadra..."
              className="w-full sm:w-auto sm:flex-1 min-w-0 min-h-[44px] rounded-xl border border-slate-200 px-3 text-[13.5px] font-semibold"
            />
            <span className="text-[12px] font-bold text-slate-500 mono shrink-0">
              {herrajesFiltrados.length} de {HERRAJES_INVENTARIO_CATALOGO.length} herrajes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {herrajesFiltrados.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-[14px] border border-slate-300 bg-slate-50/70 text-[#1E293B] flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden"
              >
                <div className="min-w-0">
                  <span className="inline-block text-[10.5px] font-extrabold uppercase tracking-wide text-blue-700 break-words">
                    {h.categoria}
                  </span>
                  <strong className="block text-[13.5px] text-[#1E293B] mt-0.5 break-words">{h.nombre}</strong>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-slate-700 mt-1 min-w-0">
                  {h.modelo && <span className="break-words">Modelo: <strong>{h.modelo}</strong></span>}
                  {h.tamano && <span className="break-words">Medida: <strong className="mono">{h.tamano}</strong></span>}
                  {h.color && <span className="break-words">Color: <strong>{h.color}</strong></span>}
                  <span className="mono text-slate-600">Unidad: {h.unidad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl min-w-0">
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
              placeholder="Buscar perfil o código (ej. 9135, 9207, 11174, Bolsa, Zoclo...)"
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
    </section>
  );
};
