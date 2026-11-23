import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Edit3,
  Film,
  Lock,
  Play,
  Plus,
  Trash2,
  Unlock,
  Upload,
  Video,
  X,
} from 'lucide-react';
import {
  parseTutorialVideoUrl,
  TUTORIAL_VIDEO_CATEGORIES,
  verifyAdminPassword,
} from '../utils/alumineroLogic';
import {
  deleteTutorialVideoCloud,
  saveTutorialVideoCloud,
  subscribeTutorialVideos,
} from '../utils/cloudSync';
import {
  loadAdminPasswordOverride,
  loadTutorialVideosCache,
  saveTutorialVideosCache,
  TutorialVideoCategory,
  TutorialVideoItem,
} from '../utils/storageHelpers';
import {
  deleteLocalTestVideoBlob,
  getLocalTestVideoBlob,
  saveLocalTestVideoBlob,
} from '../utils/videoIndexedDb';

interface VideoTutorialesViewProps {
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const LOCAL_VIDEOS_META_KEY = 'aluminero_local_test_videos_meta_v1';

function loadLocalTestVideosMeta(): TutorialVideoItem[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_VIDEOS_META_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalTestVideosMeta(list: TutorialVideoItem[]): void {
  try {
    window.localStorage.setItem(LOCAL_VIDEOS_META_KEY, JSON.stringify(list));
  } catch {
    // ignorar
  }
}

const VideoPlayerEmbed: React.FC<{ video: TutorialVideoItem }> = ({ video }) => {
  const parsed = useMemo(() => parseTutorialVideoUrl(video.url), [video.url]);
  const [localObjectUrl, setLocalObjectUrl] = useState<string>('');
  const [localErr, setLocalErr] = useState<string>('');

  useEffect(() => {
    let active = true;
    let createdUrl = '';
    setLocalObjectUrl('');
    setLocalErr('');
    if (parsed.provider === 'local') {
      const idbKey = parsed.originalUrl.replace(/^idb:\/\//, '');
      void getLocalTestVideoBlob(idbKey)
        .then((blob) => {
          if (!active) return;
          if (!blob) {
            setLocalErr('El video local de prueba ya no está disponible en este dispositivo.');
            return;
          }
          createdUrl = URL.createObjectURL(blob);
          setLocalObjectUrl(createdUrl);
        })
        .catch(() => {
          if (active) setLocalErr('No se pudo cargar el video local desde IndexedDB.');
        });
    }
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [parsed.originalUrl, parsed.provider]);

  if (parsed.provider === 'local') {
    if (localErr) {
      return (
        <div className="aspect-video w-full rounded-xl bg-slate-950 border border-rose-500/40 flex items-center justify-center p-4 text-center text-[12.5px] text-rose-200 font-semibold">
          {localErr}
        </div>
      );
    }
    if (!localObjectUrl) {
      return (
        <div className="aspect-video w-full rounded-xl bg-slate-950 border border-[#4A6072]/60 flex items-center justify-center text-[12px] text-[#B0C4D4]">
          Cargando video local...
        </div>
      );
    }
    return (
      <video
        src={localObjectUrl}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-black border border-[#4A6072]/70"
      />
    );
  }

  if (parsed.provider === 'mp4') {
    return (
      <video
        src={parsed.embedUrl}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-black border border-[#4A6072]/70"
      />
    );
  }

  if (parsed.provider === 'youtube' || parsed.provider === 'vimeo' || parsed.provider === 'gdrive') {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-[#4A6072]/70">
        <iframe
          src={parsed.embedUrl}
          title={video.titulo}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col items-center justify-center gap-2 p-4 text-center">
      <p className="m-0 text-[12.5px] text-amber-200 font-bold">
        Formato de enlace no incrustable directamente.
      </p>
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[12px] font-extrabold no-underline"
      >
        Abrir video en pestaña nueva ↗
      </a>
    </div>
  );
};

export const VideoTutorialesView: React.FC<VideoTutorialesViewProps> = ({ onShowToast }) => {
  const [cloudVideos, setCloudVideos] = useState<TutorialVideoItem[]>(() => loadTutorialVideosCache());
  const [localVideos, setLocalVideos] = useState<TutorialVideoItem[]>(() => loadLocalTestVideosMeta());
  const [activeCategory, setActiveCategory] = useState<TutorialVideoCategory | 'todos'>('todos');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Modo editor rápido protegido por clave de administrador
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Formulario Crear / Editar
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<TutorialVideoCategory>('primeros-pasos');
  const [descripcion, setDescripcion] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const importJsonRef = useRef<HTMLInputElement | null>(null);
  const localVideoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = subscribeTutorialVideos((list) => {
      setCloudVideos(list);
    });
    return () => unsub();
  }, []);

  const allVideos = useMemo(() => {
    return [...cloudVideos, ...localVideos].sort(
      (a, b) => (a.orden ?? 999) - (b.orden ?? 999) || b.updatedAt - a.updatedAt
    );
  }, [cloudVideos, localVideos]);

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'todos') return allVideos;
    return allVideos.filter((v) => v.categoria === activeCategory);
  }, [allVideos, activeCategory]);

  const activeVideo = useMemo(
    () => allVideos.find((v) => v.id === playingVideoId) || null,
    [allVideos, playingVideoId]
  );

  const resetForm = () => {
    setEditingId(null);
    setTitulo('');
    setCategoria('primeros-pasos');
    setDescripcion('');
    setUrl('');
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const override = loadAdminPasswordOverride();
    if (verifyAdminPassword(pinInput, override)) {
      setAdminUnlocked(true);
      setPinModalOpen(false);
      setPinInput('');
      setPinError('');
      onShowToast('Modo editor de Video Tutoriales activado', true);
    } else {
      setPinError('Clave de administrador incorrecta.');
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = titulo.trim();
    const cleanUrl = url.trim();
    if (cleanTitle.length < 2) {
      onShowToast('Escribe un título de al menos 2 caracteres.');
      return;
    }
    const parsed = parseTutorialVideoUrl(cleanUrl);
    if (!parsed.valid) {
      onShowToast('Ingresa una URL válida de YouTube, Vimeo, Google Drive o enlace directo .mp4');
      return;
    }

    setSaving(true);
    try {
      const existing = cloudVideos.find((v) => v.id === editingId);
      const saved = await saveTutorialVideoCloud({
        id: editingId || undefined,
        titulo: cleanTitle,
        categoria,
        descripcion: descripcion.trim(),
        url: cleanUrl,
        orden: existing?.orden ?? cloudVideos.length + 1,
        createdAt: existing?.createdAt,
      });
      setCloudVideos((prev) => {
        const next = [saved, ...prev.filter((v) => v.id !== saved.id)].sort(
          (a, b) => a.orden - b.orden || b.updatedAt - a.updatedAt
        );
        saveTutorialVideosCache(next);
        return next;
      });
      resetForm();
      onShowToast(editingId ? 'Video tutorial actualizado en Firestore' : 'Video tutorial publicado en tiempo real', true);
    } catch {
      onShowToast('No se pudo guardar el video en la nube. Verifica tu conexión.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (v: TutorialVideoItem) => {
    if (v.isLocalOnly || v.url.startsWith('idb://')) {
      const idbKey = v.url.replace(/^idb:\/\//, '');
      await deleteLocalTestVideoBlob(idbKey).catch(() => {});
      const nextLocal = localVideos.filter((item) => item.id !== v.id);
      setLocalVideos(nextLocal);
      saveLocalTestVideosMeta(nextLocal);
      if (playingVideoId === v.id) setPlayingVideoId(null);
      onShowToast('Video local de prueba eliminado', true);
      return;
    }
    try {
      await deleteTutorialVideoCloud(v.id);
      setCloudVideos((prev) => {
        const next = prev.filter((item) => item.id !== v.id);
        saveTutorialVideosCache(next);
        return next;
      });
      if (playingVideoId === v.id) setPlayingVideoId(null);
      onShowToast('Video tutorial eliminado', true);
    } catch {
      onShowToast('Error al eliminar el video en Firestore.');
    }
  };

  const handleUploadLocalTestVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 60 * 1024 * 1024) {
      onShowToast('Para pruebas locales elige un video menor a 60 MB.');
      return;
    }
    try {
      const id = `local-vid-${Date.now()}`;
      await saveLocalTestVideoBlob(id, file);
      const now = Date.now();
      const item: TutorialVideoItem = {
        id,
        titulo: titulo.trim() || file.name.replace(/\.[^.]+$/, ''),
        categoria,
        descripcion: descripcion.trim() || 'Video temporal de prueba guardado solo en IndexedDB de este equipo.',
        url: `idb://${id}`,
        orden: 999,
        createdAt: now,
        updatedAt: now,
        isLocalOnly: true,
      };
      const next = [item, ...localVideos];
      setLocalVideos(next);
      saveLocalTestVideosMeta(next);
      setPlayingVideoId(item.id);
      onShowToast('Video de prueba guardado en IndexedDB (sin afectar el peso de la app)', true);
    } catch {
      onShowToast('No se pudo guardar el video local en IndexedDB.');
    }
  };

  const handleExportJson = () => {
    const data = JSON.stringify(cloudVideos, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `aluminero-video-tutoriales-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(dlUrl), 1500);
    onShowToast('Lista de videos exportada a JSON', true);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (!Array.isArray(parsed)) {
        onShowToast('El archivo JSON debe contener una lista de videos.');
        return;
      }
      let imported = 0;
      for (const raw of parsed) {
        if (!raw || typeof raw.titulo !== 'string' || typeof raw.url !== 'string') continue;
        const check = parseTutorialVideoUrl(raw.url);
        if (!check.valid || check.provider === 'local') continue;
        await saveTutorialVideoCloud({
          id: typeof raw.id === 'string' ? raw.id : undefined,
          titulo: raw.titulo,
          categoria: raw.categoria || 'primeros-pasos',
          descripcion: String(raw.descripcion || ''),
          url: raw.url,
          orden: Number(raw.orden) || imported + 1,
        });
        imported += 1;
      }
      onShowToast(`Se importaron ${imported} video(s) tutoriales a Firestore`, true);
    } catch {
      onShowToast('Archivo JSON inválido.');
    }
  };

  return (
    <section id="view-videos" className="screen-animate pb-28 sm:pb-14">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-[21px] sm:text-[23px] font-extrabold text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-sky-300" aria-hidden="true" />
            Video Tutoriales
          </h1>
          <p className="m-0 text-[12.5px] text-[#B0C4D4] mt-0.5">
            Aprende a sacar el máximo provecho a Aluminero Pro paso a paso
          </p>
        </div>

        <button
          type="button"
          id="btn-videos-admin-toggle"
          onClick={() => {
            if (adminUnlocked) {
              setAdminUnlocked(false);
              resetForm();
            } else {
              setPinModalOpen(true);
              setPinError('');
            }
          }}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${
            adminUnlocked
              ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
              : 'border-[#4A6072]/70 bg-[#0B1924]/90 text-[#B0C4D4] hover:text-white'
          }`}
        >
          {adminUnlocked ? (
            <>
              <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
              Modo Admin activo
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              Gestionar videos
            </>
          )}
        </button>
      </div>

      {/* Pestañas de 4 categorías */}
      <div
        role="tablist"
        aria-label="Categorías de video tutoriales"
        className="flex flex-wrap gap-2 mb-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'todos'}
          onClick={() => setActiveCategory('todos')}
          className={`min-h-[36px] px-3.5 rounded-xl border text-[12px] font-extrabold cursor-pointer transition-all ${
            activeCategory === 'todos'
              ? 'border-sky-400 bg-sky-500/25 text-white shadow-sm'
              : 'border-[#4A6072]/60 bg-[#0B1924]/85 text-[#B0C4D4] hover:text-white'
          }`}
        >
          Todos ({allVideos.length})
        </button>
        {TUTORIAL_VIDEO_CATEGORIES.map((cat) => {
          const count = allVideos.filter((v) => v.categoria === cat.id).length;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(cat.id)}
              className={`min-h-[36px] px-3.5 rounded-xl border text-[12px] font-extrabold cursor-pointer transition-all ${
                active
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-sm'
                  : 'border-[#4A6072]/60 bg-[#0B1924]/85 text-[#B0C4D4] hover:text-white'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Reproductor activo */}
      {activeVideo && (
        <div
          id="video-tutorial-active-player"
          className="mb-5 rounded-[20px] border border-sky-400/50 bg-[#0A1824]/95 p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-200 text-[10.5px] font-extrabold mb-1">
                {TUTORIAL_VIDEO_CATEGORIES.find((c) => c.id === activeVideo.categoria)?.label || activeVideo.categoria}
              </span>
              <h2 className="m-0 text-[16.5px] font-extrabold text-white leading-snug">
                {activeVideo.titulo}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setPlayingVideoId(null)}
              aria-label="Cerrar reproductor"
              className="w-9 h-9 rounded-xl metal-icon-btn flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <VideoPlayerEmbed video={activeVideo} />
          {activeVideo.descripcion && (
            <p className="m-0 mt-3 text-[13px] text-[#C8D8E6] leading-relaxed">
              {activeVideo.descripcion}
            </p>
          )}
        </div>
      )}

      {/* Panel de gestión Admin inline */}
      {adminUnlocked && (
        <div
          id="panel-admin-videos-inline"
          className="mb-5 rounded-[20px] border border-emerald-400/45 bg-[#0A1926]/95 p-4 sm:p-5 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="m-0 text-[15.5px] font-extrabold text-emerald-200">
              {editingId ? 'Editar Video Tutorial' : 'Agregar Nuevo Video Tutorial'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="min-h-[34px] px-3 rounded-lg border border-sky-400/50 bg-sky-500/15 text-sky-100 text-[11.5px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={() => importJsonRef.current?.click()}
                className="min-h-[34px] px-3 rounded-lg border border-amber-400/50 bg-amber-500/15 text-amber-100 text-[11.5px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                Importar JSON
              </button>
              <input
                ref={importJsonRef}
                type="file"
                accept="application/json"
                onChange={handleImportJson}
                className="hidden"
              />
            </div>
          </div>

          <form onSubmit={handleSaveVideo} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="inp-vid-titulo" className="block text-[11.5px] font-bold text-[#B0C4D4] mb-1">
                Título del video *
              </label>
              <input
                id="inp-vid-titulo"
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Cómo hacer tu primer levantamiento en 2 minutos"
                className="w-full min-h-[42px] rounded-xl border border-[#4A6072] bg-[#07131B] px-3 text-[13px] font-semibold text-white"
              />
            </div>

            <div>
              <label htmlFor="sel-vid-categoria" className="block text-[11.5px] font-bold text-[#B0C4D4] mb-1">
                Categoría *
              </label>
              <select
                id="sel-vid-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as TutorialVideoCategory)}
                className="w-full min-h-[42px] rounded-xl border border-[#4A6072] bg-[#07131B] px-3 text-[13px] font-bold text-white"
              >
                {TUTORIAL_VIDEO_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="inp-vid-url" className="block text-[11.5px] font-bold text-[#B0C4D4] mb-1">
                URL del video (YouTube, Vimeo, Google Drive o enlace directo .mp4) *
              </label>
              <input
                id="inp-vid-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtu.be/... o https://vimeo.com/... o https://drive.google.com/file/d/.../view"
                className="w-full min-h-[42px] rounded-xl border border-[#4A6072] bg-[#07131B] px-3 text-[13px] font-medium text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="inp-vid-desc" className="block text-[11.5px] font-bold text-[#B0C4D4] mb-1">
                Descripción corta
              </label>
              <textarea
                id="inp-vid-desc"
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Explica brevemente qué aprenderá el usuario en este video..."
                className="w-full rounded-xl border border-[#4A6072] bg-[#07131B] p-2.5 text-[13px] text-white"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="metal-emerald-pill min-h-[42px] px-4 rounded-xl text-[13px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  {saving ? 'Guardando...' : editingId ? 'Actualizar video' : 'Publicar video'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="min-h-[42px] px-3.5 rounded-xl border border-[#4A6072] bg-white/5 text-slate-200 text-[12.5px] font-bold cursor-pointer"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => localVideoInputRef.current?.click()}
                className="min-h-[38px] px-3 rounded-xl border border-indigo-400/50 bg-indigo-500/15 text-indigo-100 text-[11.5px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" aria-hidden="true" />
                Probar video local (IndexedDB)
              </button>
              <input
                ref={localVideoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleUploadLocalTestVideo}
                className="hidden"
              />
            </div>
          </form>
        </div>
      )}

      {/* Lista de Videos */}
      {filteredVideos.length === 0 ? (
        <div
          id="videos-empty-state"
          className="rounded-[20px] border border-dashed border-[#4A6072]/70 bg-[#0B1924]/75 p-8 text-center"
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl border border-sky-400/40 bg-sky-500/15 flex items-center justify-center">
            <Film className="w-7 h-7 text-sky-300" aria-hidden="true" />
          </div>
          <h2 className="m-0 text-[16px] font-extrabold text-white">
            Próximamente nuevos video tutoriales
          </h2>
          <p className="m-0 mt-1.5 text-[13px] text-[#B0C4D4] max-w-md mx-auto">
            Aquí aparecerán automáticamente las guías en video publicadas por el equipo de Aluminero Pro. Si eres administrador, puedes agregarlos desde el Panel de Administrador o usando el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredVideos.map((v) => {
            const parsed = parseTutorialVideoUrl(v.url);
            const catMeta = TUTORIAL_VIDEO_CATEGORIES.find((c) => c.id === v.categoria);
            const isPlaying = playingVideoId === v.id;
            return (
              <article
                key={v.id}
                className={`rounded-[18px] border overflow-hidden transition-all flex flex-col justify-between ${
                  isPlaying
                    ? 'border-sky-400 bg-[#0F2434] shadow-lg'
                    : 'border-[#4A6072]/70 bg-gradient-to-b from-[#102230]/95 to-[#091620]/95'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPlayingVideoId(v.id)}
                  className="w-full text-left bg-transparent border-0 p-0 cursor-pointer group"
                >
                  <div className="relative aspect-video w-full bg-[#061018] overflow-hidden flex items-center justify-center">
                    {parsed.thumbnailUrl ? (
                      <img
                        src={parsed.thumbnailUrl}
                        alt={v.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-[1.02] transition-all"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-sky-300/80">
                        <Film className="w-10 h-10" aria-hidden="true" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {parsed.provider === 'local' ? 'Prueba Local' : parsed.provider.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/15 transition-colors">
                      <span className="w-12 h-12 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" aria-hidden="true" />
                      </span>
                    </span>
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#07131B]/85 border border-[#4A6072]/70 text-[10.5px] font-extrabold text-sky-200">
                      {catMeta?.shortLabel || v.categoria}
                    </span>
                    {v.isLocalOnly && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-indigo-600/90 text-[10px] font-extrabold text-white">
                        Solo local
                      </span>
                    )}
                  </div>
                  <div className="p-3.5">
                    <h3 className="m-0 text-[15px] font-extrabold text-white leading-snug">
                      {v.titulo}
                    </h3>
                    {v.descripcion && (
                      <p className="m-0 mt-1 text-[12px] text-[#B0C4D4] line-clamp-2 leading-relaxed">
                        {v.descripcion}
                      </p>
                    )}
                  </div>
                </button>

                {adminUnlocked && (
                  <div className="px-3.5 pb-3 pt-1 flex items-center justify-end gap-2 border-t border-[#4A6072]/30">
                    {!v.isLocalOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(v.id);
                          setTitulo(v.titulo);
                          setCategoria(v.categoria);
                          setDescripcion(v.descripcion);
                          setUrl(v.url);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-sky-400/50 bg-sky-500/15 text-sky-200 text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDeleteVideo(v)}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-400/50 bg-rose-500/15 text-rose-200 text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Eliminar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Modal PIN Administrador */}
      {pinModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Acceso administrador de Video Tutoriales"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleUnlockAdmin}
            className="w-full max-w-[360px] rounded-2xl border border-[#4A6072] bg-[#0B1924] p-5 text-white shadow-2xl"
          >
            <h2 className="m-0 text-[16px] font-extrabold">Clave de Administrador</h2>
            <p className="m-0 mt-1 text-[12px] text-[#B0C4D4]">
              Ingresa la contraseña del Panel de Administrador para subir, editar o borrar videos.
            </p>
            <input
              type="password"
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              placeholder="Contraseña de administrador"
              className="mt-3 w-full min-h-[42px] rounded-xl border border-[#4A6072] bg-[#07131B] px-3 text-[14px] text-white"
            />
            {pinError && <p className="m-0 mt-2 text-[12px] font-bold text-rose-300">{pinError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="min-h-[38px] px-3.5 rounded-xl border border-[#4A6072] bg-white/5 text-slate-200 text-[12.5px] font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="metal-emerald-pill min-h-[38px] px-4 rounded-xl text-[12.5px] font-extrabold cursor-pointer"
              >
                Desbloquear
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default VideoTutorialesView;
