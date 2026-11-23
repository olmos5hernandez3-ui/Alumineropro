import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATALOGO_PERFILES,
  computeAssistantDailyQuotaState,
  FREE_ASSISTANT_DAILY_LIMIT,
  PerfilCatalogoItem,
  PerfilFamilia,
} from '../utils/alumineroLogic';
import {
  AppSkin,
  AppSkinVariant,
  compressImageToDataUrl,
  formatWhatsappUrlDigits,
  getTodayDateKey,
  incrementAssistantDailyQuota,
  loadAssistantDailyQuota,
  sanitizeWhatsappNumber,
} from '../utils/storageHelpers';
import { PhotoPickerButtons } from './PhotoPickerButtons';
import { getRobotPaletteForSkin, MetallicRobot3D } from './MetallicIcons';

interface FloatingAssistantProps {
  whatsappNumber: string;
  deviceId: string;
  skin?: AppSkin;
  skinVariant?: AppSkinVariant;
  proActive?: boolean;
  onOpenPro?: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const FAMILIA_LABELS: Record<PerfilFamilia, string> = {
  corrediza3: 'Corrediza 3" (Alumer)',
  fijo3: 'Fijo 3" (Alumer)',
  batiente: 'Puerta Batiente (Alumer)',
  cancel: 'Cancel para Baño (Alumer)',
  mosquitero: 'Mosquiteros',
};

const FAMILIA_ORDER: PerfilFamilia[] = [
  'corrediza3',
  'fijo3',
  'batiente',
  'cancel',
  'mosquitero',
];

function dataUrlToJpegFile(dataUrl: string, filename: string): File {
  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const b64 = parts[1] || '';
  const mimeMatch = header.match(/data:([^;]+);base64/i);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

function openExternalLinkSafe(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function triggerFileDownload(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1800);
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({
  whatsappNumber,
  deviceId,
  skin = 'basica',
  skinVariant = 'default',
  proActive = false,
  onOpenPro,
  onShowToast,
}) => {
  const robotPalette = getRobotPaletteForSkin(skin, skinVariant);
  const [open, setOpen] = useState(false);
  const [travelingToCenter, setTravelingToCenter] = useState(false);
  const [morphedAtCenter, setMorphedAtCenter] = useState(false);
  const travelTimerRef = useRef<number | null>(null);
  const [activeOption, setActiveOption] = useState<'A' | 'B'>('A');
  const [quotaRec, setQuotaRec] = useState(() => loadAssistantDailyQuota());

  const quotaState = useMemo(
    () =>
      computeAssistantDailyQuotaState(
        quotaRec,
        getTodayDateKey(),
        proActive,
        FREE_ASSISTANT_DAILY_LIMIT
      ),
    [quotaRec, proActive]
  );

  useEffect(() => {
    return () => {
      if (travelTimerRef.current !== null) {
        window.clearTimeout(travelTimerRef.current);
      }
    };
  }, []);

  const handleCloseAssistant = () => {
    if (travelTimerRef.current !== null) {
      window.clearTimeout(travelTimerRef.current);
      travelTimerRef.current = null;
    }
    setTravelingToCenter(false);
    setMorphedAtCenter(false);
    setOpen(false);
  };

  const handleToggleAssistant = () => {
    if (open || travelingToCenter) {
      handleCloseAssistant();
      return;
    }
    // Animación universal del robot 3D metálico: desplazamiento fluido desde la esquina inferior derecha hacia el centro
    setTravelingToCenter(true);
    setMorphedAtCenter(false);
    travelTimerRef.current = window.setTimeout(() => {
      travelTimerRef.current = null;
      setTravelingToCenter(false);
      setMorphedAtCenter(true);
      setOpen(true);
    }, 480);
  };

  // Opción A — Sugerir línea o perfil
  const [sugerenciaTexto, setSugerenciaTexto] = useState('');
  const [errorA, setErrorA] = useState('');

  // Opción B — Subir foto para aprobación
  const [selectedPerfilId, setSelectedPerfilId] = useState('');
  const [customPerfilNombre, setCustomPerfilNombre] = useState('');
  const [fotoDataUrl, setFotoDataUrl] = useState('');
  const [fotoFileName, setFotoFileName] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorB, setErrorB] = useState('');

  const cleanWa = sanitizeWhatsappNumber(whatsappNumber);
  const waUrlDigits = formatWhatsappUrlDigits(whatsappNumber);

  const perfilesByFamilia = useMemo(() => {
    const grouped: Record<PerfilFamilia, PerfilCatalogoItem[]> = {
      corrediza3: [],
      fijo3: [],
      batiente: [],
      cancel: [],
      mosquitero: [],
    };
    for (const item of CATALOGO_PERFILES) {
      grouped[item.familia].push(item);
    }
    return grouped;
  }, []);

  const selectedPerfil = useMemo(
    () => CATALOGO_PERFILES.find((p) => p.id === selectedPerfilId) || null,
    [selectedPerfilId]
  );

  const handleSelectPhoto = async (file: File) => {
    setErrorB('');
    setCompressing(true);
    try {
      const compressed = await compressImageToDataUrl(file, 600, 0.8);
      setFotoDataUrl(compressed);
      const baseName = (selectedPerfil?.id || customPerfilNombre.trim() || 'perfil')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32);
      setFotoFileName(`aprobacion-${baseName || 'perfil'}.jpg`);
    } catch {
      setErrorB('No se pudo procesar la foto seleccionada. Intenta con otra imagen.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSendOptionA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaState.canSend) {
      setErrorA(`Alcanzaste tu límite de ${quotaState.limit} consultas diarias en la Versión Gratuita. Actualiza a PRO para consultas ilimitadas.`);
      return;
    }
    const cleanText = sugerenciaTexto.trim();
    if (!cleanText) {
      setErrorA('Escribe qué marca, línea, perfil o herraje hace falta.');
      return;
    }

    setSending(true);
    setErrorA('');
    if (!proActive) {
      setQuotaRec(incrementAssistantDailyQuota());
    }

    const messageLines = [
      '*Asistente Aluminero Pro — Sugerencia*',
      `• Solicitud (marca/línea/herraje): ${cleanText}`,
      `• Equipo origen: ${deviceId}`,
    ];
    const message = messageLines.join('\n');
    const waUrl = waUrlDigits
      ? `https://wa.me/${waUrlDigits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      if (cleanWa) {
        openExternalLinkSafe(waUrl);
        onShowToast('Abriendo WhatsApp del Administrador con tu sugerencia', true);
      } else if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: 'Sugerencia — Asistente Aluminero Pro',
            text: message,
          });
          onShowToast('Sugerencia compartida con éxito', true);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
          openExternalLinkSafe(waUrl);
          onShowToast('Abriendo WhatsApp con tu sugerencia', true);
        }
      } else {
        openExternalLinkSafe(waUrl);
        onShowToast('Abriendo WhatsApp con tu sugerencia', true);
      }

      setSugerenciaTexto('');
      handleCloseAssistant();
    } finally {
      setSending(false);
    }
  };

  const handleSendOptionB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaState.canSend) {
      setErrorB(`Alcanzaste tu límite de ${quotaState.limit} envíos diarios en la Versión Gratuita. Actualiza a PRO para envíos ilimitados.`);
      return;
    }
    const cleanCustom = customPerfilNombre.trim();
    if (!selectedPerfil && !cleanCustom) {
      setErrorB('Selecciona un perfil existente o escribe su nombre.');
      return;
    }
    if (!fotoDataUrl) {
      setErrorB('Toma o elige una foto del perfil antes de enviarla.');
      return;
    }

    setSending(true);
    setErrorB('');
    if (!proActive) {
      setQuotaRec(incrementAssistantDailyQuota());
    }

    const perfilResumen = selectedPerfil
      ? `${selectedPerfil.nombre} (${selectedPerfil.codigoRef})`
      : cleanCustom;

    const messageLines = [
      '*Asistente Aluminero Pro — Foto para aprobación*',
      `• Perfil: ${perfilResumen}`,
      ...(selectedPerfil && cleanCustom ? [`• Nombre/nota adicional: ${cleanCustom}`] : []),
      ...(selectedPerfil ? [`• Medidas catálogo: ${selectedPerfil.dimensiones}`] : []),
      `• Equipo origen: ${deviceId}`,
      ...(cleanWa ? [`• WhatsApp Admin: +52 ${cleanWa}`] : []),
      '• Solicitud: Revisar y aprobar foto para el catálogo oficial.',
    ];
    const message = messageLines.join('\n');
    const photoFile = dataUrlToJpegFile(
      fotoDataUrl,
      fotoFileName || 'perfil-aprobacion.jpg'
    );

    try {
      let canNativeShareFiles = false;
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function'
      ) {
        try {
          canNativeShareFiles = navigator.canShare({ files: [photoFile] });
        } catch {
          canNativeShareFiles = false;
        }
      }

      if (canNativeShareFiles) {
        try {
          await navigator.share({
            title: 'Foto de perfil para aprobación — Aluminero Pro',
            text: message,
            files: [photoFile],
          });
          onShowToast(
            cleanWa
              ? `Foto lista para enviar al Admin (+${cleanWa})`
              : 'Foto enviada para aprobación del Administrador',
            true
          );
          setSelectedPerfilId('');
          setCustomPerfilNombre('');
          setFotoDataUrl('');
          setFotoFileName('');
          handleCloseAssistant();
          return;
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            onShowToast('Envío cancelado');
            return;
          }
          // Continúa al respaldo de WhatsApp si falla la hoja nativa
        }
      }

      // Respaldo universal: descarga la foto JPEG optimizada y abre WhatsApp del Admin con los datos del perfil
      triggerFileDownload(photoFile);
      const waUrl = waUrlDigits
        ? `https://wa.me/${waUrlDigits}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      openExternalLinkSafe(waUrl);
      onShowToast(
        cleanWa
          ? 'Abriendo WhatsApp del Administrador · Adjunta la foto descargada'
          : 'Foto descargada y abriendo WhatsApp con los datos del perfil',
        true
      );
      setSelectedPerfilId('');
      setCustomPerfilNombre('');
      setFotoDataUrl('');
      setFotoFileName('');
      handleCloseAssistant();
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      id="floating-assistant-root"
      data-skin={skin}
      data-skin-variant={skinVariant}
      className="fixed bottom-2.5 right-2.5 sm:bottom-5 sm:right-5 z-40"
    >
      {/* Escenario de desplazamiento del robot 3D metálico desde la esquina hacia el centro */}
      {travelingToCenter && (
        <div
          id="assistant-travel-stage"
          aria-hidden="true"
          className="fixed inset-0 z-50 pointer-events-none bg-[#040c12]/45 backdrop-blur-[1.5px]"
        >
          <div
            id="assistant-traveling-robot"
            className="robot-3d-glide-center flex items-center justify-center"
          >
            <MetallicRobot3D size={78} skin={skin} skinVariant={skinVariant} />
          </div>
        </div>
      )}

      {open && morphedAtCenter && (
        <div
          aria-hidden="true"
          onClick={handleCloseAssistant}
          className="fixed inset-0 z-40 bg-[#040c12]/65 backdrop-blur-[3px]"
        />
      )}

      {open && (
        <section
          id="card-floating-assistant"
          role="dialog"
          aria-label="Asistente Aluminero Pro"
          data-centered-morph={morphedAtCenter ? 'true' : 'false'}
          className={`${
            morphedAtCenter
              ? 'assistant-card-morph-center z-50 w-[calc(100vw-2rem)] max-w-[404px] max-h-[calc(100vh-5rem)]'
              : 'assistant-card-enter fixed bottom-[92px] right-4 sm:right-5 w-[calc(100vw-2rem)] max-w-[388px] max-h-[calc(100vh-7rem)]'
          } overflow-y-auto rounded-[22px] border-[1.5px] shadow-2xl p-4`}
        >
          {/* Encabezado */}
          <div className="flex items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[#4A6072]/45 assistant-card-divider">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="metal-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                <MetallicRobot3D size={36} compactHeadOnly skin={skin} skinVariant={skinVariant} />
              </div>
              <div className="min-w-0">
                <h2 className="m-0 text-[15px] font-extrabold leading-tight truncate">
                  Asistente Aluminero Pro
                </h2>
                <p className="m-0 text-[11.5px] font-semibold assistant-subtext leading-tight mt-0.5">
                  Contacto directo con el Administrador
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-assistant-close"
              onClick={handleCloseAssistant}
              aria-label="Cerrar Asistente Aluminero Pro"
              className="min-w-[34px] min-h-[34px] rounded-xl assistant-close-btn font-extrabold text-[14px] cursor-pointer shrink-0 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Indicador de consultas diarias (Plan Gratuito vs PRO ilimitado) */}
          <div
            id="assistant-quota-bar"
            className={`mb-3 px-3 py-2 rounded-xl border text-[11.5px] font-bold flex items-center justify-between gap-2 ${
              !quotaState.isLimited
                ? 'border-emerald-400/40 bg-emerald-500/12 text-emerald-200'
                : quotaState.canSend
                  ? 'border-sky-400/40 bg-sky-500/12 text-sky-100'
                  : 'border-amber-400/60 bg-amber-500/18 text-amber-100'
            }`}
          >
            <span>
              {!quotaState.isLimited
                ? '⚡ Plan PRO · Consultas ilimitadas'
                : quotaState.canSend
                  ? `Plan Gratuito · ${quotaState.remaining} de ${quotaState.limit} consultas hoy`
                  : `Límite diario alcanzado (${quotaState.usedToday}/${quotaState.limit})`}
            </span>
            {quotaState.isLimited && onOpenPro && (
              <button
                type="button"
                id="btn-assistant-upgrade-pro"
                onClick={() => {
                  handleCloseAssistant();
                  onOpenPro();
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] cursor-pointer shrink-0"
              >
                Ver PRO
              </button>
            )}
          </div>

          {/* Selector de 2 opciones rápidas */}
          <div className="grid grid-cols-2 gap-2 mb-3.5" role="tablist" aria-label="Opciones del asistente">
            <button
              type="button"
              role="tab"
              aria-selected={activeOption === 'A'}
              id="btn-assistant-opt-a"
              onClick={() => {
                setActiveOption('A');
                setErrorB('');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                activeOption === 'A'
                  ? 'assistant-tab-active'
                  : 'assistant-tab-idle'
              }`}
            >
              <span className="block text-[10px] font-black uppercase tracking-wider opacity-85">
                Opción A
              </span>
              <span className="block text-[12px] font-extrabold leading-tight mt-0.5">
                Sugerir línea o perfil
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeOption === 'B'}
              id="btn-assistant-opt-b"
              onClick={() => {
                setActiveOption('B');
                setErrorA('');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                activeOption === 'B'
                  ? 'assistant-tab-active'
                  : 'assistant-tab-idle'
              }`}
            >
              <span className="block text-[10px] font-black uppercase tracking-wider opacity-85">
                Opción B
              </span>
              <span className="block text-[12px] font-extrabold leading-tight mt-0.5">
                Subir foto aprobación
              </span>
            </button>
          </div>

          {/* Opción A: Sugerir línea o perfil */}
          {activeOption === 'A' && (
            <form id="form-assistant-opt-a" onSubmit={handleSendOptionA} className="flex flex-col gap-2.5">
              <div>
                <label
                  htmlFor="inp-asistente-sugerencia"
                  className="block text-[12px] font-extrabold mb-1"
                >
                  ¿Qué marca, línea o herraje hace falta? *
                </label>
                <textarea
                  id="inp-asistente-sugerencia"
                  rows={3}
                  value={sugerenciaTexto}
                  onChange={(e) => {
                    setSugerenciaTexto(e.target.value);
                    if (errorA) setErrorA('');
                  }}
                  placeholder="Ej. Marca Cuprum, Línea Eurovent Serie 70, perfil riel curvo o jaladera multipunto..."
                  className="w-full rounded-xl border border-[#4A6072] p-2.5 text-[13px] font-medium"
                />
              </div>

              {errorA && (
                <p className="m-0 text-[12px] font-bold text-red-300 bg-red-950/60 border border-red-400/50 rounded-xl px-3 py-2">
                  {errorA}
                </p>
              )}

              <div className="text-[11px] font-semibold assistant-subtext">
                {cleanWa
                  ? `Destino directo: WhatsApp Admin (+${cleanWa})`
                  : 'Se abrirá Compartir / WhatsApp para enviarlo al Administrador.'}
              </div>

              <button
                type="submit"
                id="btn-assistant-send-a"
                disabled={sending}
                className="metal-emerald-pill w-full min-h-[44px] px-4 rounded-xl font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{sending ? 'Abriendo envío...' : 'Enviar sugerencia al Administrador'}</span>
              </button>
            </form>
          )}

          {/* Opción B: Subir foto para aprobación del Administrador */}
          {activeOption === 'B' && (
            <form id="form-assistant-opt-b" onSubmit={handleSendOptionB} className="flex flex-col gap-2.5">
              <div>
                <label
                  htmlFor="sel-asistente-perfil"
                  className="block text-[12px] font-extrabold mb-1"
                >
                  Selecciona un perfil existente
                </label>
                <select
                  id="sel-asistente-perfil"
                  value={selectedPerfilId}
                  onChange={(e) => {
                    setSelectedPerfilId(e.target.value);
                    if (errorB) setErrorB('');
                  }}
                  className="w-full min-h-[40px] rounded-xl border border-[#4A6072] px-2.5 text-[12.5px] font-bold"
                >
                  <option value="">— Elegir perfil del catálogo (o escribir abajo) —</option>
                  {FAMILIA_ORDER.map((fam) => (
                    <optgroup key={fam} label={FAMILIA_LABELS[fam]}>
                      {perfilesByFamilia[fam].map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} · {p.codigoRef}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="inp-asistente-perfil-nombre"
                  className="block text-[12px] font-extrabold mb-1"
                >
                  {selectedPerfil
                    ? 'Nombre o nota adicional (opcional)'
                    : 'O escribe el nombre del perfil *'}
                </label>
                <input
                  id="inp-asistente-perfil-nombre"
                  type="text"
                  value={customPerfilNombre}
                  onChange={(e) => {
                    setCustomPerfilNombre(e.target.value);
                    if (errorB) setErrorB('');
                  }}
                  placeholder={
                    selectedPerfil
                      ? 'Ej. Corte visto de frente / marca específica'
                      : 'Ej. Cabezal Serie 4500 o perfil nuevo'
                  }
                  className="w-full min-h-[40px] rounded-xl border border-[#4A6072] px-3 text-[13px] font-semibold"
                />
              </div>

              <div>
                <span className="block text-[12px] font-extrabold mb-1.5">
                  Foto del perfil desde tu celular *
                </span>
                <PhotoPickerButtons
                  disabled={compressing}
                  cameraButtonId="btn-assistant-take-photo"
                  galleryButtonId="btn-assistant-pick-photo"
                  compact
                  onSelectFile={(file) => void handleSelectPhoto(file)}
                />

                {compressing && (
                  <p className="m-0 mt-2 text-[11.5px] font-bold text-cyan-300">
                    Optimizando foto...
                  </p>
                )}

                {fotoDataUrl && !compressing && (
                  <div className="mt-2 p-2 rounded-xl border border-[#4A6072]/60 bg-[#07131B]/80 flex items-center gap-2.5">
                    <img
                      src={fotoDataUrl}
                      alt="Vista previa de foto para aprobación"
                      className="w-14 h-14 rounded-lg object-cover border border-[#4A6072] shrink-0 bg-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11.5px] font-extrabold truncate">
                        Foto lista (JPEG)
                      </div>
                      <div className="text-[10.5px] assistant-subtext truncate">
                        {fotoFileName || 'perfil-aprobacion.jpg'}
                      </div>
                    </div>
                    <button
                      type="button"
                      id="btn-assistant-clear-photo"
                      onClick={() => {
                        setFotoDataUrl('');
                        setFotoFileName('');
                      }}
                      className="px-2 py-1 rounded-lg border border-red-400/50 bg-red-950/60 text-red-200 text-[11px] font-extrabold cursor-pointer shrink-0"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {errorB && (
                <p className="m-0 text-[12px] font-bold text-red-300 bg-red-950/60 border border-red-400/50 rounded-xl px-3 py-2">
                  {errorB}
                </p>
              )}

              <div className="text-[11px] font-semibold assistant-subtext">
                {cleanWa
                  ? `Usa Compartir nativo con la foto o abre WhatsApp Admin (+${cleanWa}).`
                  : 'Usa Compartir nativo con el archivo de imagen o WhatsApp.'}
              </div>

              <button
                type="submit"
                id="btn-asistente-enviar-foto"
                disabled={sending || compressing}
                className="metal-emerald-pill w-full min-h-[44px] px-4 rounded-xl font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{sending ? 'Preparando envío...' : 'Enviar foto para aprobación'}</span>
              </button>
            </form>
          )}
        </section>
      )}

      {/* Robot 3D Metálico Flotante Camaleón (-10% escala para no tapar botones) */}
      {!travelingToCenter && (
        <button
          type="button"
          id="btn-floating-assistant"
          data-robot-style="metallic-3d-floating"
          data-skin={skin}
          data-skin-variant={skinVariant}
          aria-label={open ? 'Cerrar Asistente Aluminero Pro' : 'Abrir Asistente Aluminero Pro'}
          aria-expanded={open}
          aria-controls="card-floating-assistant"
          onClick={handleToggleAssistant}
          style={
            !open
              ? { filter: `drop-shadow(0 6px 14px ${robotPalette.auraHex}66)` }
              : undefined
          }
          className={
            open
              ? 'metal-icon-btn relative w-[44px] h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 text-white'
              : 'relative bg-transparent border-0 p-0 m-0 w-[68px] h-[78px] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 rounded-2xl'
          }
        >
          {open ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          ) : (
            <MetallicRobot3D
              size={64}
              skin={skin}
              skinVariant={skinVariant}
              className={`${skin === 'industrial' ? 'assistant-robot-hop-1yr' : 'robot-3d-levitate'} select-none`}
            />
          )}
        </button>
      )}
    </div>
  );
};
