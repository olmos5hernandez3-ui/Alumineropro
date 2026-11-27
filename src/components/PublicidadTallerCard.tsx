import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Megaphone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  generateWorkshopAds,
  PUBLICIDAD_SERVICIOS,
  PublicidadServicioId,
} from '../utils/tallerTools';
import { openExternalLinkSafe, TallerConfig } from '../utils/storageHelpers';

interface PublicidadTallerCardProps {
  taller: TallerConfig;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

async function copyTextSafe(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback abajo
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export const PublicidadTallerCard: React.FC<PublicidadTallerCardProps> = ({
  taller,
  onShowToast,
}) => {
  const [open, setOpen] = useState(true);
  const [servicio, setServicio] = useState<PublicidadServicioId>('ventanas');
  const [ciudadZona, setCiudadZona] = useState<string>(() => taller.ubicacion || '');
  const [telefono, setTelefono] = useState<string>(() => taller.tel || '');
  const [ciudadEdited, setCiudadEdited] = useState(false);
  const [telEdited, setTelEdited] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'fb' | 'wa' | null>(null);

  useEffect(() => {
    if (!ciudadEdited && taller.ubicacion && taller.ubicacion !== ciudadZona) {
      setCiudadZona(taller.ubicacion);
    }
  }, [taller.ubicacion, ciudadEdited, ciudadZona]);

  useEffect(() => {
    if (!telEdited && taller.tel && taller.tel !== telefono) {
      setTelefono(taller.tel);
    }
  }, [taller.tel, telEdited, telefono]);

  const ads = useMemo(
    () =>
      generateWorkshopAds({
        servicio,
        ciudadZona,
        telefono,
        tallerNombre: taller.nombre,
      }),
    [servicio, ciudadZona, telefono, taller.nombre]
  );

  const handleCopy = async (key: 'fb' | 'wa', text: string) => {
    const ok = await copyTextSafe(text);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2200);
    if (ok) {
      onShowToast(
        key === 'fb'
          ? 'Anuncio para Facebook / Marketplace copiado'
          : 'Texto corto para Estado de WhatsApp copiado',
        true
      );
    } else {
      onShowToast('Texto listo: selecciónalo si tu navegador bloqueó el portapapeles');
    }
  };

  return (
    <div
      id="card-taller-publicidad"
      className="bg-white text-[#1E293B] border-[1.5px] border-indigo-300 rounded-[18px] p-4 sm:p-5 shadow-xl mt-4"
    >
      <button
        type="button"
        id="btn-toggle-publicidad-taller"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 bg-transparent border-0 p-0 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-[16.5px] font-extrabold text-slate-900">
              📢 Publicidad para tu Taller
            </h2>
            <p className="m-0 text-[12px] text-slate-500">
              Crea anuncios listos para atraer clientes en Facebook, Marketplace y Estados de WhatsApp
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-4">
          {/* Formulario rápido de 3 campos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label
                htmlFor="sel-pub-servicio"
                className="block text-[12px] font-extrabold text-slate-700 mb-1"
              >
                1. ¿Qué quieres promocionar?
              </label>
              <select
                id="sel-pub-servicio"
                value={servicio}
                onChange={(e) => setServicio(e.target.value as PublicidadServicioId)}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-bold text-slate-800"
              >
                {PUBLICIDAD_SERVICIOS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="inp-pub-ciudad"
                className="block text-[12px] font-extrabold text-slate-700 mb-1"
              >
                2. Ciudad o zona de trabajo
              </label>
              <input
                id="inp-pub-ciudad"
                type="text"
                value={ciudadZona}
                onChange={(e) => {
                  setCiudadEdited(true);
                  setCiudadZona(e.target.value);
                }}
                placeholder="Ej. Cuautla, Morelos y alrededores"
                className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-800"
              />
            </div>

            <div>
              <label
                htmlFor="inp-pub-tel"
                className="block text-[12px] font-extrabold text-slate-700 mb-1"
              >
                3. Teléfono / WhatsApp de contacto
              </label>
              <input
                id="inp-pub-tel"
                type="tel"
                value={telefono}
                onChange={(e) => {
                  setTelEdited(true);
                  setTelefono(e.target.value);
                }}
                placeholder="Ej. 735 123 4567"
                className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* 2 textos listos para vender */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Texto 1: Facebook / Marketplace */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <strong className="text-[13.5px] font-extrabold text-slate-900">
                  Texto 1 · Grupos de Facebook / Marketplace
                </strong>
                <span className="text-[11px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-md shrink-0">
                  Anuncio completo
                </span>
              </div>
              <pre
                data-testid="pub-text-fb"
                className="flex-1 m-0 mb-3 p-3 rounded-xl bg-white border border-slate-200 text-[12.5px] leading-relaxed text-slate-800 whitespace-pre-wrap font-sans select-all"
              >
                {ads.facebookMarketplaceText}
              </pre>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  id="btn-copy-pub-fb"
                  onClick={() => handleCopy('fb', ads.facebookMarketplaceText)}
                  className={`flex-1 min-w-[140px] min-h-[40px] px-3 rounded-xl font-extrabold text-[12.5px] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    copiedKey === 'fb'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copiedKey === 'fb' ? (
                    <span>✓ Copiado</span>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Copiar texto</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  id="btn-wa-pub-fb"
                  onClick={() => openExternalLinkSafe(ads.whatsappShareUrlFb)}
                  className="flex-1 min-w-[170px] min-h-[40px] px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-[12.5px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Compartir directo en WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Texto 2: Corto para Estado de WhatsApp / Instagram */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <strong className="text-[13.5px] font-extrabold text-slate-900">
                  Texto 2 · Corto para Estado de WhatsApp / Instagram
                </strong>
                <span className="text-[11px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-md shrink-0">
                  Rápido para estados
                </span>
              </div>
              <pre
                data-testid="pub-text-wa"
                className="flex-1 m-0 mb-3 p-3 rounded-xl bg-white border border-slate-200 text-[12.5px] leading-relaxed text-slate-800 whitespace-pre-wrap font-sans select-all"
              >
                {ads.whatsappStatusText}
              </pre>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  id="btn-copy-pub-wa"
                  onClick={() => handleCopy('wa', ads.whatsappStatusText)}
                  className={`flex-1 min-w-[140px] min-h-[40px] px-3 rounded-xl font-extrabold text-[12.5px] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    copiedKey === 'wa'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copiedKey === 'wa' ? (
                    <span>✓ Copiado</span>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Copiar texto</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  id="btn-wa-pub-wa"
                  onClick={() => openExternalLinkSafe(ads.whatsappShareUrlStatus)}
                  className="flex-1 min-w-[170px] min-h-[40px] px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-[12.5px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Compartir directo en WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
