import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATALOGO_PERFILES,
  PerfilCatalogoItem,
  PerfilFamilia,
} from '../utils/alumineroLogic';
import {
  AppSkin,
  compressImageToDataUrl,
  formatWhatsappUrlDigits,
  sanitizeWhatsappNumber,
} from '../utils/storageHelpers';
import { PhotoPickerButtons } from './PhotoPickerButtons';

interface FloatingAssistantProps {
  whatsappNumber: string;
  deviceId: string;
  skin?: AppSkin;
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
  onShowToast,
}) => {
  const [open, setOpen] = useState(false);
  const [travelingToCenter, setTravelingToCenter] = useState(false);
  const [morphedAtCenter, setMorphedAtCenter] = useState(false);
  const travelTimerRef = useRef<number | null>(null);
  const [activeOption, setActiveOption] = useState<'A' | 'B'>('A');
  const isIndustrial1Yr = skin === 'industrial';

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
    if (isIndustrial1Yr) {
      setTravelingToCenter(true);
      setMorphedAtCenter(false);
      travelTimerRef.current = window.setTimeout(() => {
        travelTimerRef.current = null;
        setTravelingToCenter(false);
        setMorphedAtCenter(true);
        setOpen(true);
      }, 560);
    } else {
      setMorphedAtCenter(false);
      setOpen(true);
    }
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
    const cleanText = sugerenciaTexto.trim();
    if (!cleanText) {
      setErrorA('Escribe qué marca, línea, perfil o herraje hace falta.');
      return;
    }

    setSending(true);
    setErrorA('');

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
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  const handleSendOptionB = async (e: React.FormEvent) => {
    e.preventDefault();
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
          setOpen(false);
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
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div id="floating-assistant-root" className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40">
      {/* Animación de recorrido de izquierda a derecha hasta el centro en carátula de 1 año */}
      {travelingToCenter && (
        <div
          id="assistant-travel-stage"
          aria-hidden="true"
          className="fixed inset-0 z-50 pointer-events-none bg-slate-950/35 backdrop-blur-[1px]"
        >
          <div
            id="assistant-traveling-robot"
            className="assistant-robot-travel-center fixed w-[68px] h-[68px] rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 via-emerald-600 to-slate-900 border-2 border-amber-300 shadow-[0_18px_40px_rgba(0,0,0,0.7),0_0_24px_rgba(251,191,36,0.5)]"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <line x1="20" y1="4.5" x2="20" y2="9.5" stroke="#FDE68A" strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="20" cy="4" r="2.6" fill="#34D399" />
              <rect x="4" y="16" width="4" height="9" rx="2" fill="#FCD34D" />
              <rect x="32" y="16" width="4" height="9" rx="2" fill="#FCD34D" />
              <rect x="8" y="9.5" width="24" height="22" rx="9" fill="#FFFFFF" />
              <rect x="11.5" y="14.5" width="17" height="9.5" rx="4.75" fill="#0F172A" />
              <circle cx="16.2" cy="19.2" r="2.1" fill="#34D399" />
              <circle cx="23.8" cy="19.2" r="2.1" fill="#34D399" />
              <path d="M15.5 26.8C17.2 28.4 22.8 28.4 24.5 26.8" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}

      {open && morphedAtCenter && (
        <div
          aria-hidden="true"
          onClick={handleCloseAssistant}
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px]"
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
              ? 'assistant-card-morph-center z-50 w-[calc(100vw-2rem)] max-w-[400px] max-h-[calc(100vh-5rem)]'
              : 'assistant-card-enter fixed bottom-[86px] right-4 sm:right-5 w-[calc(100vw-2rem)] max-w-[388px] max-h-[calc(100vh-7rem)]'
          } overflow-y-auto rounded-[22px] border-[1.5px] shadow-2xl p-4`}
        >
          {/* Encabezado */}
          <div className="flex items-center justify-between gap-2.5 pb-3 mb-3 border-b border-slate-200/80 assistant-card-divider">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-md">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 36 36"
                  fill="none"
                  aria-hidden="true"
                >
                  <line x1="18" y1="3" x2="18" y2="8" stroke="#E0F2FE" strokeWidth="2.4" strokeLinecap="round" />
                  <circle cx="18" cy="3" r="2.2" fill="#34D399" />
                  <rect x="6" y="8" width="24" height="20" rx="8" fill="#FFFFFF" />
                  <rect x="10" y="13" width="16" height="8" rx="4" fill="#0F172A" />
                  <circle cx="14.5" cy="17" r="1.8" fill="#38BDF8" />
                  <circle cx="21.5" cy="17" r="1.8" fill="#38BDF8" />
                  <path d="M14 24.5C15.4 25.8 20.6 25.8 22 24.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                </svg>
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
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-[13px] font-medium"
                />
              </div>

              {errorA && (
                <p className="m-0 text-[12px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
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
                className="w-full min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
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
                  className="w-full min-h-[40px] rounded-xl border border-slate-300 px-2.5 text-[12.5px] font-bold"
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
                  className="w-full min-h-[40px] rounded-xl border border-slate-300 px-3 text-[13px] font-semibold"
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
                  <p className="m-0 mt-2 text-[11.5px] font-bold text-blue-600">
                    Optimizando foto...
                  </p>
                )}

                {fotoDataUrl && !compressing && (
                  <div className="mt-2 p-2 rounded-xl border border-slate-300 bg-slate-50 flex items-center gap-2.5">
                    <img
                      src={fotoDataUrl}
                      alt="Vista previa de foto para aprobación"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0 bg-white"
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
                      className="px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[11px] font-extrabold cursor-pointer shrink-0"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {errorB && (
                <p className="m-0 text-[12px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
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
                className="w-full min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
              >
                <span>{sending ? 'Preparando envío...' : 'Enviar foto para aprobación'}</span>
              </button>
            </form>
          )}
        </section>
      )}

      {/* Botón flotante animado con robot amistoso */}
      <button
        type="button"
        id="btn-floating-assistant"
        data-skin-animation={isIndustrial1Yr ? 'industrial-hop-1yr' : 'default'}
        aria-label={open ? 'Cerrar Asistente Aluminero Pro' : 'Abrir Asistente Aluminero Pro'}
        aria-expanded={open}
        aria-controls="card-floating-assistant"
        onClick={handleToggleAssistant}
        className={`relative w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer shadow-2xl border-2 border-cyan-300/80 transition-transform active:scale-95 ${
          open || travelingToCenter
            ? 'bg-slate-900 text-white'
            : isIndustrial1Yr
              ? 'assistant-robot-hop-1yr bg-gradient-to-br from-slate-800 via-emerald-800 to-amber-600 text-white'
              : 'assistant-fab-float bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-500 text-white'
        }`}
      >
        {!open && !travelingToCenter && (
          <span
            aria-hidden="true"
            className="assistant-fab-ring absolute inset-0 rounded-full pointer-events-none"
          />
        )}

        {open ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        ) : (
          <svg
            width="36"
            height="36"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className="relative z-10"
          >
            {/* Antena amistosa */}
            <line x1="20" y1="4.5" x2="20" y2="9.5" stroke="#BAE6FD" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="20" cy="4" r="2.6" fill="#34D399" />
            {/* Orejas / audífonos laterales */}
            <rect x="4" y="16" width="4" height="9" rx="2" fill="#93C5FD" />
            <rect x="32" y="16" width="4" height="9" rx="2" fill="#93C5FD" />
            {/* Cabeza del robot */}
            <rect x="8" y="9.5" width="24" height="22" rx="9" fill="#FFFFFF" />
            {/* Visor oscuro */}
            <rect x="11.5" y="14.5" width="17" height="9.5" rx="4.75" fill="#0F172A" />
            {/* Ojos amigables */}
            <circle cx="16.2" cy="19.2" r="2.1" fill="#38BDF8" />
            <circle cx="23.8" cy="19.2" r="2.1" fill="#38BDF8" />
            <circle cx="16.8" cy="18.5" r="0.7" fill="#FFFFFF" />
            <circle cx="24.4" cy="18.5" r="0.7" fill="#FFFFFF" />
            {/* Sonrisa */}
            <path
              d="M15.5 26.8C17.2 28.4 22.8 28.4 24.5 26.8"
              stroke="#1D4ED8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
};
