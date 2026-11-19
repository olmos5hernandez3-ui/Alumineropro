import React, { useState } from 'react';
import {
  buildBeforeAfterCollageFile,
  compressImageToDataUrl,
  dataUrlToJpegFile,
  openExternalLinkSafe,
  sanitizeWhatsappNumber,
  TrabajoAntesDespuesItem,
  triggerFileDownload,
} from '../utils/storageHelpers';
import { PhotoPickerButtons } from './PhotoPickerButtons';

interface AntesDespuesModalProps {
  open: boolean;
  trabajos: TrabajoAntesDespuesItem[];
  whatsappNumber: string;
  deviceId: string;
  onSavePersonalTrabajo: (
    item: Omit<TrabajoAntesDespuesItem, 'id' | 'fecha' | 'aprobado'>
  ) => void;
  onDeletePersonalTrabajo: (id: string) => void;
  onClose: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const PresetVisual: React.FC<{
  variant: NonNullable<TrabajoAntesDespuesItem['presetVariant']>;
  side: 'antes' | 'despues';
}> = ({ variant, side }) => {
  if (variant === 'ventana3') {
    return side === 'antes' ? (
      <svg viewBox="0 0 220 140" className="w-full h-full block" aria-hidden="true">
        <rect width="220" height="140" fill="#CBD5E1" />
        <rect x="18" y="16" width="184" height="108" fill="#64748B" stroke="#475569" strokeWidth="4" />
        <rect x="26" y="24" width="168" height="92" fill="#94A3B8" stroke="#475569" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="26" y1="70" x2="194" y2="70" stroke="#475569" strokeWidth="2" strokeDasharray="5 5" />
        <line x1="110" y1="24" x2="110" y2="116" stroke="#475569" strokeWidth="2" strokeDasharray="5 5" />
        <text x="110" y="75" textAnchor="middle" fill="#1E293B" fontSize="12" fontWeight="800">
          VANO EN OBRA GRIS
        </text>
      </svg>
    ) : (
      <svg viewBox="0 0 220 140" className="w-full h-full block" aria-hidden="true">
        <rect width="220" height="140" fill="#E2E8F0" />
        <rect x="18" y="16" width="184" height="108" rx="3" fill="#0F172A" stroke="#1E293B" strokeWidth="4" />
        <rect x="26" y="24" width="82" height="92" fill="#475569" stroke="#0F172A" strokeWidth="3" />
        <rect x="112" y="24" width="82" height="92" fill="#64748B" stroke="#0F172A" strokeWidth="3" />
        <line x1="36" y1="36" x2="62" y2="62" stroke="#BAE6FD" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        <line x1="122" y1="36" x2="152" y2="66" stroke="#BAE6FD" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        <rect x="182" y="60" width="5" height="20" rx="2" fill="#CBD5E1" />
        <path d="M138 70h26m-6-5 6 5-6 5" stroke="#E0F2FE" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'puerta-europea') {
    return side === 'antes' ? (
      <svg viewBox="0 0 220 140" className="w-full h-full block" aria-hidden="true">
        <rect width="220" height="140" fill="#CBD5E1" />
        <rect x="66" y="10" width="88" height="122" fill="#78350F" stroke="#451A03" strokeWidth="4" />
        <rect x="74" y="18" width="72" height="108" fill="#92400E" />
        <line x1="74" y1="54" x2="146" y2="54" stroke="#451A03" strokeWidth="2" />
        <line x1="74" y1="90" x2="146" y2="90" stroke="#451A03" strokeWidth="2" />
        <circle cx="136" cy="72" r="4" fill="#D97706" />
        <text x="110" y="136" textAnchor="middle" fill="#334155" fontSize="9.5" fontWeight="700">
          PUERTA ANTIGUA
        </text>
      </svg>
    ) : (
      <svg viewBox="0 0 220 140" className="w-full h-full block" aria-hidden="true">
        <rect width="220" height="140" fill="#E2E8F0" />
        <rect x="64" y="10" width="92" height="122" rx="2" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
        <rect x="72" y="18" width="76" height="52" fill="#BAE6FD" stroke="#334155" strokeWidth="2.5" />
        <rect x="72" y="75" width="76" height="49" fill="#334155" stroke="#0F172A" strokeWidth="2" />
        <rect x="136" y="64" width="6" height="18" rx="2" fill="#E2E8F0" />
        <line x1="80" y1="26" x2="104" y2="50" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return side === 'antes' ? (
    <svg viewBox="0 0 220 140" className="w-full h-full block" aria-hidden="true">
      <rect width="220" height="140" fill="#E2E8F0" />
      <rect x="20" y="14" width="180" height="112" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="3" />
      <line x1="20" y1="30" x2="200" y2="30" stroke="#64748B" strokeWidth="3" />
      <path d="M40 30 Q48 80 42 124 M70 30 Q78 80 72 124 M100 30 Q108 80 102 124" stroke="#94A3B8" strokeWidth="3" fill="none" />
      <text x="148" y="82" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="800">
        SIN CANCEL
      </text>
    </svg>
  ) : (
    <svg viewBox="0 0 220 140" className="w-full h-full block" aria-hidden="true">
      <rect width="220" height="140" fill="#E2E8F0" />
      <rect x="20" y="14" width="180" height="112" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="3" />
      <rect x="24" y="18" width="172" height="8" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
      <rect x="24" y="26" width="84" height="96" fill="#6EE7B7" fillOpacity="0.45" stroke="#FFFFFF" strokeWidth="3" />
      <rect x="110" y="26" width="86" height="96" fill="#A7F3D0" fillOpacity="0.55" stroke="#FFFFFF" strokeWidth="3" />
      <circle cx="122" cy="74" r="4" fill="#64748B" />
      <line x1="42" y1="38" x2="66" y2="62" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

export const AntesDespuesModal: React.FC<AntesDespuesModalProps> = ({
  open,
  trabajos,
  whatsappNumber,
  deviceId,
  onSavePersonalTrabajo,
  onDeletePersonalTrabajo,
  onClose,
  onShowToast,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [tituloTrabajo, setTituloTrabajo] = useState('');
  const [lineaNombre, setLineaNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotoAntesUrl, setFotoAntesUrl] = useState('');
  const [fotoDespuesUrl, setFotoDespuesUrl] = useState('');
  const [compressingSlot, setCompressingSlot] = useState<'antes' | 'despues' | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [presentingItem, setPresentingItem] = useState<TrabajoAntesDespuesItem | null>(null);

  if (!open) return null;

  const approvedList = trabajos.filter((t) => t.aprobado);
  const cleanWa = sanitizeWhatsappNumber(whatsappNumber);

  const handlePickPhoto = async (slot: 'antes' | 'despues', file: File) => {
    setErrorMsg('');
    setCompressingSlot(slot);
    try {
      const compressed = await compressImageToDataUrl(file, 600, 0.8);
      if (slot === 'antes') setFotoAntesUrl(compressed);
      else setFotoDespuesUrl(compressed);
    } catch {
      setErrorMsg('No se pudo procesar la foto seleccionada. Intenta con otra imagen.');
    } finally {
      setCompressingSlot(null);
    }
  };

  const sendWorkToAdmin = async (payload: {
    titulo: string;
    lineaNombre: string;
    descripcion: string;
    antesImgUrl?: string;
    despuesImgUrl?: string;
  }) => {
    setSending(true);
    const lines = [
      '*Trabajos: Antes y Después — Aluminero Pro*',
      `• Proyecto: ${payload.titulo}`,
      ...(payload.lineaNombre ? [`• Línea / Acabado: ${payload.lineaNombre}`] : []),
      ...(payload.descripcion ? [`• Descripción: ${payload.descripcion}`] : []),
      `• Equipo origen: ${deviceId}`,
      ...(cleanWa ? [`• WhatsApp Admin: +${cleanWa}`] : []),
    ];
    const message = lines.join('\n');
    const waUrl = cleanWa
      ? `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      if (payload.antesImgUrl && payload.despuesImgUrl) {
        const fileAntes = dataUrlToJpegFile(payload.antesImgUrl, 'trabajo-antes.jpg');
        const fileDespues = dataUrlToJpegFile(payload.despuesImgUrl, 'trabajo-despues.jpg');

        const tryShareFiles = async (
          files: File[]
        ): Promise<'shared' | 'aborted' | 'unsupported'> => {
          if (
            typeof navigator === 'undefined' ||
            typeof navigator.share !== 'function' ||
            typeof navigator.canShare !== 'function'
          ) {
            return 'unsupported';
          }
          try {
            if (!navigator.canShare({ files })) return 'unsupported';
          } catch {
            return 'unsupported';
          }
          try {
            await navigator.share({
              title: `${payload.titulo} — Antes y Después`,
              text: message,
              files,
            });
            return 'shared';
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return 'aborted';
            return 'unsupported';
          }
        };

        const twoFilesRes = await tryShareFiles([fileAntes, fileDespues]);
        if (twoFilesRes === 'aborted') {
          onShowToast('Envío cancelado');
          return false;
        }
        if (twoFilesRes === 'shared') {
          onShowToast(
            cleanWa
              ? `Trabajo enviado al Administrador (+${cleanWa})`
              : 'Trabajo enviado al Administrador',
            true
          );
          return true;
        }

        const collageFile = await buildBeforeAfterCollageFile(
          payload.antesImgUrl,
          payload.despuesImgUrl
        );
        const collageRes = await tryShareFiles([collageFile]);
        if (collageRes === 'aborted') {
          onShowToast('Envío cancelado');
          return false;
        }
        if (collageRes === 'shared') {
          onShowToast('Comparativa Antes y Después enviada al Administrador', true);
          return true;
        }

        triggerFileDownload(collageFile);
        openExternalLinkSafe(waUrl);
        onShowToast(
          cleanWa
            ? 'Comparativa descargada · Abriendo WhatsApp del Administrador'
            : 'Comparativa descargada y abriendo WhatsApp',
          true
        );
        return true;
      }

      openExternalLinkSafe(waUrl);
      onShowToast('Abriendo WhatsApp del Administrador', true);
      return true;
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTituloTrabajo('');
    setLineaNombre('');
    setDescripcion('');
    setFotoAntesUrl('');
    setFotoDespuesUrl('');
    setErrorMsg('');
    setShowForm(false);
  };

  const handleSaveToPersonalGallery = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = tituloTrabajo.trim();
    if (!cleanTitle) {
      setErrorMsg('Escribe el título del proyecto.');
      return;
    }
    if (!fotoAntesUrl || !fotoDespuesUrl) {
      setErrorMsg('Sube ambas fotos comprimidas: Foto Antes y Foto Después.');
      return;
    }

    onSavePersonalTrabajo({
      titulo: cleanTitle,
      lineaNombre: lineaNombre.trim() || 'Trabajo de taller',
      descripcion:
        descripcion.trim() || 'Proyecto instalado y guardado en galería personal para mostrar a clientes.',
      antesImgUrl: fotoAntesUrl,
      despuesImgUrl: fotoDespuesUrl,
      autor: 'Mi galería personal',
      esPersonal: true,
    });
    resetForm();
  };

  const handleSaveAndSendAdmin = async () => {
    const cleanTitle = tituloTrabajo.trim();
    if (!cleanTitle) {
      setErrorMsg('Escribe el título del proyecto.');
      return;
    }
    if (!fotoAntesUrl || !fotoDespuesUrl) {
      setErrorMsg('Sube ambas fotos comprimidas: Foto Antes y Foto Después.');
      return;
    }

    const cleanLinea = lineaNombre.trim() || 'Trabajo de taller';
    const cleanDesc =
      descripcion.trim() || 'Proyecto instalado (Antes y Después) enviado para revisión.';

    onSavePersonalTrabajo({
      titulo: cleanTitle,
      lineaNombre: cleanLinea,
      descripcion: cleanDesc,
      antesImgUrl: fotoAntesUrl,
      despuesImgUrl: fotoDespuesUrl,
      autor: 'Mi galería personal',
      esPersonal: true,
    });

    await sendWorkToAdmin({
      titulo: cleanTitle,
      lineaNombre: cleanLinea,
      descripcion: cleanDesc,
      antesImgUrl: fotoAntesUrl,
      despuesImgUrl: fotoDespuesUrl,
    });
    resetForm();
  };

  return (
    <>
      <div
        id="modal-antes-despues"
        className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Trabajos: Antes y Después"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-[820px] max-h-[92vh] overflow-y-auto bg-white text-slate-900 border-[1.5px] border-slate-300 rounded-[22px] p-5 shadow-2xl my-auto">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
            <div>
              <h2 className="m-0 text-[19px] font-extrabold text-slate-900">
                Trabajos: Antes y Después
              </h2>
              <p className="m-0 text-[12.5px] text-slate-600 mt-0.5">
                Toca cualquier proyecto para verlo en presentación grande para clientes, o sube tus propios trabajos sin internet.
              </p>
            </div>
            <button
              type="button"
              id="btn-antes-despues-close"
              onClick={onClose}
              aria-label="Cerrar Trabajos Antes y Después"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Barra de acciones de la galería */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12.5px] font-extrabold text-slate-700">
              Proyectos en galería ({approvedList.length})
            </span>
            <button
              type="button"
              id="btn-antes-despues-open-form"
              onClick={() => {
                setShowForm((prev) => !prev);
                setErrorMsg('');
              }}
              className={`min-h-[42px] px-4 py-2 rounded-xl font-extrabold text-[13px] cursor-pointer transition-colors shadow-sm ${
                showForm
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {showForm ? '← Volver a la galería' : '📸 Agregar a mi galería'}
            </button>
          </div>

          {/* Formulario para subir Foto Antes, Foto Después y título a galería personal (localStorage) */}
          {showForm && (
            <form
              id="form-antes-despues"
              onSubmit={handleSaveToPersonalGallery}
              className="mb-5 p-4 rounded-2xl border-[1.5px] border-blue-200 bg-blue-50/70 flex flex-col gap-3"
            >
              <div>
                <h3 className="m-0 text-[15px] font-extrabold text-slate-900">
                  Subir trabajo a mi galería (Disponible sin internet)
                </h3>
                <p className="m-0 text-[12px] text-slate-600 mt-0.5">
                  Las fotos se comprimen automáticamente (máx. 600 px JPEG) y se guardan en este dispositivo para mostrarlas a tus clientes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="inp-ad-titulo"
                    className="block text-[12px] font-bold text-slate-700 mb-1"
                  >
                    Título del proyecto *
                  </label>
                  <input
                    id="inp-ad-titulo"
                    type="text"
                    value={tituloTrabajo}
                    onChange={(e) => {
                      setTituloTrabajo(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Ej. Ventanal Sala Residencial"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13px] font-semibold bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inp-ad-linea"
                    className="block text-[12px] font-bold text-slate-700 mb-1"
                  >
                    Línea o acabado (opcional)
                  </label>
                  <input
                    id="inp-ad-linea"
                    type="text"
                    value={lineaNombre}
                    onChange={(e) => setLineaNombre(e.target.value)}
                    placeholder='Ej. Línea 3" Negro Mate · Filtrasol'
                    className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13px] font-semibold bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Foto Antes */}
                <div className="p-3 rounded-xl border border-amber-300 bg-white flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-extrabold text-amber-800">
                      1. Foto Antes *
                    </span>
                    {fotoAntesUrl && (
                      <button
                        type="button"
                        onClick={() => setFotoAntesUrl('')}
                        className="text-[11px] font-bold text-red-700 cursor-pointer bg-transparent border-0 p-0"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  {fotoAntesUrl ? (
                    <img
                      src={fotoAntesUrl}
                      alt="Vista previa Foto Antes"
                      className="w-full h-[140px] object-cover rounded-xl border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-[110px] rounded-xl border border-dashed border-amber-300 bg-amber-50/70 flex items-center justify-center text-[12px] font-semibold text-amber-900 text-center px-2">
                      Sin foto del antes
                    </div>
                  )}
                  {compressingSlot === 'antes' && (
                    <p className="m-0 text-[11.5px] font-bold text-amber-800">
                      Comprimiendo Foto Antes...
                    </p>
                  )}
                  <PhotoPickerButtons
                    disabled={compressingSlot === 'antes'}
                    cameraButtonId="btn-ad-cam-antes"
                    galleryButtonId="btn-ad-pick-antes"
                    tone="amber"
                    compact
                    onSelectFile={(file) => void handlePickPhoto('antes', file)}
                  />
                </div>

                {/* Foto Después */}
                <div className="p-3 rounded-xl border border-emerald-300 bg-white flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-extrabold text-emerald-800">
                      2. Foto Después *
                    </span>
                    {fotoDespuesUrl && (
                      <button
                        type="button"
                        onClick={() => setFotoDespuesUrl('')}
                        className="text-[11px] font-bold text-red-700 cursor-pointer bg-transparent border-0 p-0"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  {fotoDespuesUrl ? (
                    <img
                      src={fotoDespuesUrl}
                      alt="Vista previa Foto Después"
                      className="w-full h-[140px] object-cover rounded-xl border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-[110px] rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 flex items-center justify-center text-[12px] font-semibold text-emerald-900 text-center px-2">
                      Sin foto del trabajo terminado
                    </div>
                  )}
                  {compressingSlot === 'despues' && (
                    <p className="m-0 text-[11.5px] font-bold text-emerald-800">
                      Comprimiendo Foto Después...
                    </p>
                  )}
                  <PhotoPickerButtons
                    disabled={compressingSlot === 'despues'}
                    cameraButtonId="btn-ad-cam-despues"
                    galleryButtonId="btn-ad-pick-despues"
                    tone="emerald"
                    compact
                    onSelectFile={(file) => void handlePickPhoto('despues', file)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inp-ad-descripcion"
                  className="block text-[12px] font-bold text-slate-700 mb-1"
                >
                  Descripción breve (opcional)
                </label>
                <textarea
                  id="inp-ad-descripcion"
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder='Ej. Ventana corrediza 3" blanco con vidrio claro 6mm y mosquitero.'
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-[13px] font-medium bg-white"
                />
              </div>

              {errorMsg && (
                <p className="m-0 text-[12px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="submit"
                  id="btn-ad-save-local"
                  disabled={sending || compressingSlot !== null}
                  className="w-full min-h-[46px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-md disabled:opacity-60"
                >
                  💾 Guardar en mi galería
                </button>
                <button
                  type="button"
                  id="btn-ad-submit"
                  disabled={sending || compressingSlot !== null}
                  onClick={() => void handleSaveAndSendAdmin()}
                  className="w-full min-h-[46px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-md disabled:opacity-60"
                >
                  {sending ? 'Preparando envío...' : 'Guardar y enviar al Admin'}
                </button>
              </div>
            </form>
          )}

          {/* Galería de proyectos (personales y aprobados) */}
          <div id="antes-despues-gallery" className="grid grid-cols-1 gap-4">
            {approvedList.map((item) => (
              <article
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setPresentingItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPresentingItem(item);
                  }
                }}
                className="rounded-2xl border border-slate-300 bg-slate-50 hover:border-blue-500 p-3.5 shadow-sm cursor-pointer transition-all hover:shadow-md text-left"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 text-[15px] font-extrabold text-slate-900">
                      {item.titulo}
                    </h3>
                    <div className="text-[11.5px] text-slate-600 mt-0.5">
                      {item.lineaNombre}
                      {item.autor ? ` · ${item.autor}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.esPersonal ? (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-extrabold">
                        Mi galería · {item.fecha}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold">
                        ✓ Aprobado · {item.fecha}
                      </span>
                    )}
                    {item.esPersonal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePersonalTrabajo(item.id);
                          if (presentingItem?.id === item.id) {
                            setPresentingItem(null);
                          }
                        }}
                        aria-label={`Eliminar ${item.titulo}`}
                        className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-extrabold cursor-pointer"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-white aspect-[16/10]">
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black tracking-wide shadow">
                      ANTES
                    </span>
                    {item.antesImgUrl ? (
                      <img
                        src={item.antesImgUrl}
                        alt={`Antes - ${item.titulo}`}
                        className="w-full h-full object-cover"
                      />
                    ) : item.presetVariant ? (
                      <PresetVisual variant={item.presetVariant} side="antes" />
                    ) : null}
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-white aspect-[16/10]">
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black tracking-wide shadow">
                      DESPUÉS
                    </span>
                    {item.despuesImgUrl ? (
                      <img
                        src={item.despuesImgUrl}
                        alt={`Después - ${item.titulo}`}
                        className="w-full h-full object-cover"
                      />
                    ) : item.presetVariant ? (
                      <PresetVisual variant={item.presetVariant} side="despues" />
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="m-0 text-[12.5px] text-slate-700 leading-relaxed flex-1 min-w-[180px]">
                    {item.descripcion}
                  </p>
                  <span className="text-[11.5px] font-extrabold text-blue-700 shrink-0">
                    Toca para presentar a cliente ⤢
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Vista grande y limpia de presentación para clientes */}
      {presentingItem && (
        <div
          id="modal-antes-despues-presentacion"
          className="fixed inset-0 z-[60] bg-slate-950/90 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`Presentación: ${presentingItem.titulo}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPresentingItem(null);
          }}
        >
          <div className="w-full max-w-[960px] bg-white text-slate-900 border border-slate-300 rounded-[24px] p-4 sm:p-6 shadow-2xl my-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold mb-1.5">
                  {presentingItem.lineaNombre}
                </div>
                <h2 className="m-0 text-[20px] sm:text-[24px] font-extrabold text-slate-900 leading-tight">
                  {presentingItem.titulo}
                </h2>
              </div>
              <button
                type="button"
                id="btn-ad-presentacion-close"
                onClick={() => setPresentingItem(null)}
                aria-label="Cerrar presentación"
                className="min-w-[40px] min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[16px] cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400/70 bg-slate-100 aspect-[4/3]">
                <span className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg bg-amber-600 text-white text-[12px] font-black tracking-wide shadow-md">
                  ANTES
                </span>
                {presentingItem.antesImgUrl ? (
                  <img
                    src={presentingItem.antesImgUrl}
                    alt={`Antes - ${presentingItem.titulo}`}
                    className="w-full h-full object-contain bg-slate-900/5"
                  />
                ) : presentingItem.presetVariant ? (
                  <PresetVisual variant={presentingItem.presetVariant} side="antes" />
                ) : null}
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/70 bg-slate-100 aspect-[4/3]">
                <span className="absolute top-3 left-3 z-10 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[12px] font-black tracking-wide shadow-md">
                  DESPUÉS
                </span>
                {presentingItem.despuesImgUrl ? (
                  <img
                    src={presentingItem.despuesImgUrl}
                    alt={`Después - ${presentingItem.titulo}`}
                    className="w-full h-full object-contain bg-slate-900/5"
                  />
                ) : presentingItem.presetVariant ? (
                  <PresetVisual variant={presentingItem.presetVariant} side="despues" />
                ) : null}
              </div>
            </div>

            <p className="m-0 text-[14px] text-slate-700 leading-relaxed mb-4">
              {presentingItem.descripcion}
            </p>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="btn-ad-send-admin"
                  disabled={sending}
                  onClick={() => void sendWorkToAdmin(presentingItem)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[12px] font-bold cursor-pointer disabled:opacity-60"
                >
                  {sending ? 'Abriendo WhatsApp...' : '💬 Enviar este trabajo al Administrador'}
                </button>
                {presentingItem.esPersonal && (
                  <button
                    type="button"
                    id="btn-ad-presentacion-delete"
                    onClick={() => {
                      const delId = presentingItem.id;
                      setPresentingItem(null);
                      onDeletePersonalTrabajo(delId);
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[12px] font-bold cursor-pointer"
                  >
                    Eliminar de mi galería
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPresentingItem(null)}
                className="min-h-[40px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-extrabold cursor-pointer"
              >
                Cerrar vista
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
