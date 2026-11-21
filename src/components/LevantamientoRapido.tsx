import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlumBridgePayload,
  buildBridgePayloadFromPieza,
  buildLevantamientoWhatsappText,
  cmFromUnit,
  createEmptyLevantamiento,
  formatMedida,
  formatMedidaText,
  LEV_KEYS,
  LEV_TIPOS,
  LevantamientoDestino,
  LevantamientoDraft,
  LevantamientoPieza,
  LevantamientoUnidad,
  overwriteHojaProyectoInStorage,
  resumenLevantamiento,
} from '../utils/levantamientoLogic';
import { openExternalLinkSafe } from '../utils/storageHelpers';

declare global {
  interface Window {
    __alumBridge?: {
      apply: (payload: AlumBridgePayload) => void;
      setProyecto?: (cliente: string) => void;
    };
    __alumLev?: {
      open: () => void;
    };
    __alumModPending?: AlumBridgePayload | null;
  }
}

interface LevantamientoFormState {
  tipo: string;
  area: string;
  ancho: string;
  alto: string;
  u: LevantamientoUnidad;
  cant: number;
  notas: string;
  foto: string;
  editId: string | null;
}

function createEmptyForm(u: LevantamientoUnidad = 'cm', tipo: string = LEV_TIPOS[0]): LevantamientoFormState {
  return {
    tipo,
    area: '',
    ancho: '',
    alto: '',
    u,
    cant: 1,
    notas: '',
    foto: '',
    editId: null,
  };
}

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

type LevScreen = 'main' | 'dest' | 'hist' | 'foto';

interface Props {
  onSetHojaProyecto: (cliente: string) => void;
  onShowToast?: (msg: string, topSuccess?: boolean) => void;
}

export const LevantamientoRapido: React.FC<Props> = ({ onSetHojaProyecto, onShowToast }) => {
  const [draft, setDraft] = useState<LevantamientoDraft>(() => {
    const loaded = typeof window !== 'undefined' ? safeLoad<LevantamientoDraft | null>(LEV_KEYS.draft, null) : null;
    if (loaded && Array.isArray(loaded.piezas)) return loaded;
    return createEmptyLevantamiento();
  });
  const [form, setForm] = useState<LevantamientoFormState>(() => createEmptyForm());
  const [views, setViews] = useState<LevScreen[]>([]);
  const [viewerFoto, setViewerFoto] = useState<string>('');
  const [queue, setQueue] = useState<LevantamientoPieza[] | null>(null);
  const [queueIdx, setQueueIdx] = useState<number>(0);
  const [queueCli, setQueueCli] = useState<string>('');
  const [queueDest, setQueueDest] = useState<LevantamientoDestino>('cotizacion');
  const [savedList, setSavedList] = useState<LevantamientoDraft[]>(() =>
    typeof window !== 'undefined' ? safeLoad<LevantamientoDraft[]>(LEV_KEYS.saved, []) : []
  );
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [confirmDeletePieceId, setConfirmDeletePieceId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const cliInputRef = useRef<HTMLInputElement | null>(null);
  const viewsRef = useRef<LevScreen[]>(views);
  viewsRef.current = views;
  const closingCbRef = useRef<(() => void) | null>(null);
  const draftRef = useRef<LevantamientoDraft>(draft);
  draftRef.current = draft;

  const isOpen = views.length > 0;
  const currentScreen: LevScreen | undefined = views[views.length - 1];

  const notify = useCallback(
    (msg: string, topSuccess = false) => {
      if (onShowToast) {
        onShowToast(msg, topSuccess);
      } else {
        setLocalError(msg);
      }
    },
    [onShowToast]
  );

  const persistDraft = useCallback((next: LevantamientoDraft) => {
    const updated: LevantamientoDraft = { ...next, guardado: false };
    setDraft(updated);
    if (!safeSave(LEV_KEYS.draft, updated)) {
      notify('No hay espacio suficiente para guardar. Elimina fotos o levantamientos antiguos.');
    }
    return updated;
  }, [notify]);

  const pushView = useCallback((v: LevScreen) => {
    setLocalError(null);
    setConfirmNewOpen(false);
    setConfirmDeletePieceId(null);
    setViews((prev) => {
      const next = [...prev, v];
      viewsRef.current = next;
      return next;
    });
    try {
      window.history.pushState({ alumLev: 1, v }, '');
    } catch {
      // ignore if restricted
    }
  }, []);

  const openModal = useCallback(() => {
    if (viewsRef.current.length > 0) return;
    setSavedList(safeLoad<LevantamientoDraft[]>(LEV_KEYS.saved, []));
    document.body.style.overflow = 'hidden';
    pushView('main');
  }, [pushView]);

  const goBackView = useCallback(() => {
    if (viewsRef.current.length > 0) {
      try {
        window.history.go(-1);
      } catch {
        setViews((prev) => prev.slice(0, -1));
      }
    }
  }, []);

  const closeAllViews = useCallback((cb?: () => void) => {
    if (viewsRef.current.length === 0) {
      cb?.();
      return;
    }
    closingCbRef.current = cb || (() => {});
    try {
      window.history.go(-viewsRef.current.length);
    } catch {
      const fn = closingCbRef.current;
      closingCbRef.current = null;
      viewsRef.current = [];
      setViews([]);
      document.body.style.overflow = '';
      setViewerFoto('');
      fn?.();
    }
  }, []);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (viewsRef.current.length === 0 && !closingCbRef.current) return;
      e.stopImmediatePropagation();
      if (closingCbRef.current) {
        const cb = closingCbRef.current;
        closingCbRef.current = null;
        viewsRef.current = [];
        setViews([]);
        document.body.style.overflow = '';
        setViewerFoto('');
        cb();
        return;
      }
      const next = viewsRef.current.slice(0, -1);
      viewsRef.current = next;
      setViews(next);
      if (next.length === 0) {
        document.body.style.overflow = '';
        setViewerFoto('');
      }
    };
    window.addEventListener('popstate', onPopState, true);
    return () => {
      window.removeEventListener('popstate', onPopState, true);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    window.__alumLev = { open: openModal };
    return () => {
      if (window.__alumLev?.open === openModal) {
        delete window.__alumLev;
      }
    };
  }, [openModal]);

  const applyClienteToHoja = useCallback(
    (clienteName: string) => {
      const clean = String(clienteName || '').trim();
      if (!clean) return;
      overwriteHojaProyectoInStorage(clean);
      onSetHojaProyecto(clean);
      window.__alumBridge?.setProyecto?.(clean);
    },
    [onSetHojaProyecto]
  );

  const enviarPieza = useCallback(
    (
      index: number,
      targetQueue: LevantamientoPieza[],
      clienteName: string,
      dest: LevantamientoDestino
    ) => {
      const pieza = targetQueue[index];
      if (!pieza) return;
      const bridge = window.__alumBridge;
      if (!bridge) {
        notify('El cotizador aún no está listo. Intenta de nuevo.');
        return;
      }
      const { payload, unsupportedInModulacion } = buildBridgePayloadFromPieza(
        pieza,
        clienteName,
        dest
      );
      if (unsupportedInModulacion || !payload) {
        notify('Esta pieza (Cancel / Otro) no existe en Modulación; envíala a Cortes o Cotización.');
        setQueueIdx(index);
        return;
      }
      setQueueIdx(index);
      bridge.apply(payload);
    },
    [notify]
  );

  const ensureCliente = (): string | null => {
    const clean = draft.cliente.trim();
    if (!clean) {
      setLocalError('Escribe el nombre del cliente.');
      cliInputRef.current?.focus();
      return null;
    }
    setLocalError(null);
    return clean;
  };

  const handleAddOrUpdatePieza = () => {
    if (!ensureCliente()) return;
    const anchoCm = cmFromUnit(form.ancho, form.u);
    const altoCm = cmFromUnit(form.alto, form.u);
    if (!anchoCm || !altoCm) {
      setLocalError('Captura ancho y alto válidos.');
      return;
    }
    const pieza: LevantamientoPieza = {
      id: form.editId || `lv-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      tipo: form.tipo,
      area: form.area.trim(),
      anchoCm,
      altoCm,
      cant: Math.max(1, form.cant),
      notas: form.notas.trim(),
      foto: form.foto,
    };
    const nextPiezas = form.editId
      ? draft.piezas.map((x) => (x.id === form.editId ? pieza : x))
      : [...draft.piezas, pieza];
    persistDraft({ ...draft, piezas: nextPiezas });
    setForm(createEmptyForm(form.u, form.tipo));
    setLocalError(null);
    if (rootRef.current) rootRef.current.scrollTop = 0;
  };

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const im = new Image();
      im.onload = () => {
        const w = Math.min(600, im.width);
        const h = Math.round((im.height * w) / im.width);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(im, 0, 0, w, h);
          setForm((prev) => ({ ...prev, foto: canvas.toDataURL('image/jpeg', 0.6) }));
        }
      };
      im.onerror = () => notify('No se pudo leer la imagen.');
      im.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleCopySummary = async () => {
    if (!ensureCliente()) return;
    if (draft.piezas.length === 0) {
      notify('Agrega al menos una medida.');
      return;
    }
    const text = buildLevantamientoWhatsappText(draft);
    try {
      await navigator.clipboard.writeText(text);
      notify('Resumen copiado al portapapeles.', true);
    } catch {
      notify('No se pudo copiar al portapapeles.');
    }
  };

  const handleShareWhatsapp = () => {
    if (!ensureCliente()) return;
    if (draft.piezas.length === 0) {
      notify('Agrega al menos una medida.');
      return;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(buildLevantamientoWhatsappText(draft))}`;
    openExternalLinkSafe(url);
  };

  const handleSaveLevantamiento = () => {
    if (!ensureCliente()) return;
    if (draft.piezas.length === 0) {
      notify('Agrega al menos una medida.');
      return;
    }
    const currentList = safeLoad<LevantamientoDraft[]>(LEV_KEYS.saved, []);
    const copy: LevantamientoDraft = {
      ...JSON.parse(JSON.stringify(draft)),
      guardado: true,
    };
    const existingIdx = currentList.findIndex((r) => r.id === copy.id);
    const nextList =
      existingIdx >= 0
        ? currentList.map((r, idx) => (idx === existingIdx ? copy : r))
        : [copy, ...currentList];
    if (safeSave(LEV_KEYS.saved, nextList)) {
      setSavedList(nextList);
      const savedDraft = { ...copy, guardado: true };
      setDraft(savedDraft);
      safeSave(LEV_KEYS.draft, savedDraft);
      notify('Levantamiento guardado.', true);
    } else {
      notify('No hay espacio suficiente para guardar. Elimina fotos o levantamientos antiguos.');
    }
  };

  const handleOpenSendDest = () => {
    const cli = ensureCliente();
    if (!cli) return;
    if (draft.piezas.length === 0) {
      notify('Agrega al menos una medida.');
      return;
    }
    // 1) Al presionar 'Enviar a Cotizador', sobrescribe Proyecto / Cliente y aluminero_hoja_v1.proyecto
    applyClienteToHoja(cli);
    safeSave(LEV_KEYS.draft, draft);
    pushView('dest');
  };

  const handleLaunchDestino = (dest: LevantamientoDestino) => {
    const piecesCopy = draft.piezas.slice();
    const clienteCopy = draft.cliente.trim();
    applyClienteToHoja(clienteCopy);
    closeAllViews(() => {
      setQueue(piecesCopy);
      setQueueIdx(0);
      setQueueCli(clienteCopy);
      setQueueDest(dest);
      enviarPieza(0, piecesCopy, clienteCopy, dest);
    });
  };

  const anchoCmPreview = cmFromUnit(form.ancho, form.u);
  const altoCmPreview = cmFromUnit(form.alto, form.u);
  const previewText =
    anchoCmPreview && altoCmPreview
      ? `📐 ${formatMedida(anchoCmPreview)} × ${formatMedida(altoCmPreview)} cm  (${formatMedida(
          anchoCmPreview / 100
        )} × ${formatMedida(altoCmPreview / 100)} m)`
      : '';

  const activeQueuePieza = queue ? queue[queueIdx] : null;

  return (
    <>
      <div
        id="lev-root"
        ref={rootRef}
        style={{ display: isOpen ? 'block' : 'none' }}
        role="dialog"
        aria-modal="true"
        aria-label="Levantamiento Rápido en Obra"
      >
        {isOpen && currentScreen === 'main' && (
          <div className="w">
            <div className="top">
              <button type="button" className="gh" id="lv-btn-back" onClick={goBackView}>
                ← Salir
              </button>
              <h2>📐 Levantamiento Rápido</h2>
              <button
                type="button"
                className="gh"
                id="lv-btn-hist"
                onClick={() => {
                  setSavedList(safeLoad<LevantamientoDraft[]>(LEV_KEYS.saved, []));
                  pushView('hist');
                }}
              >
                📂 Guardados
              </button>
            </div>

            {localError && (
              <div
                id="lv-error-banner"
                role="alert"
                style={{
                  background: '#7f1d1d',
                  border: '1px solid #f87171',
                  color: '#fef2f2',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '12px',
                }}
              >
                {localError}
              </div>
            )}

            <div className="card">
              <label htmlFor="lv-cli">Cliente *</label>
              <input
                ref={cliInputRef}
                id="lv-cli"
                type="text"
                value={draft.cliente}
                onChange={(e) => {
                  setLocalError(null);
                  persistDraft({ ...draft, cliente: e.target.value });
                }}
                placeholder="Ej. Sr. Juan Pérez"
              />
              <label htmlFor="lv-ref">Teléfono o ubicación (opcional)</label>
              <input
                id="lv-ref"
                type="text"
                value={draft.ref}
                onChange={(e) => persistDraft({ ...draft, ref: e.target.value })}
                placeholder="Ej. 55 1234 5678 / Col. Centro"
              />
            </div>

            <div className="card">
              <b>{form.editId ? '✏️ Editando pieza' : '➕ Nueva medida'}</b>
              <label htmlFor="lv-tipo">Tipo</label>
              <select
                id="lv-tipo"
                value={form.tipo}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
              >
                {LEV_TIPOS.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>

              <label htmlFor="lv-area">Ubicación / área (opcional)</label>
              <input
                id="lv-area"
                type="text"
                value={form.area}
                onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                placeholder="Ej. Sala, Baño"
              />

              <label>Medidas y unidad</label>
              <div className="row">
                <input
                  id="lv-an"
                  type="text"
                  inputMode="decimal"
                  value={form.ancho}
                  onChange={(e) => setForm((prev) => ({ ...prev, ancho: e.target.value }))}
                  placeholder={form.u === 'm' ? 'Ancho (m)' : 'Ancho (cm)'}
                />
                <input
                  id="lv-al"
                  type="text"
                  inputMode="decimal"
                  value={form.alto}
                  onChange={(e) => setForm((prev) => ({ ...prev, alto: e.target.value }))}
                  placeholder={form.u === 'm' ? 'Alto (m)' : 'Alto (cm)'}
                />
                <div className="seg">
                  <button
                    type="button"
                    className={form.u === 'cm' ? 'on' : ''}
                    onClick={() => setForm((prev) => ({ ...prev, u: 'cm' }))}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    className={form.u === 'm' ? 'on' : ''}
                    onClick={() => setForm((prev) => ({ ...prev, u: 'm' }))}
                  >
                    m
                  </button>
                </div>
              </div>
              <div className="pv" id="lv-pv">
                {previewText}
              </div>

              <label>Cantidad</label>
              <div className="qty">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, cant: Math.max(1, prev.cant - 1) }))
                  }
                >
                  −
                </button>
                <b id="lv-q">{form.cant}</b>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, cant: prev.cant + 1 }))}
                >
                  +
                </button>
              </div>

              <label htmlFor="lv-nt">Notas (color, vidrio, detalle)</label>
              <textarea
                id="lv-nt"
                rows={2}
                value={form.notas}
                onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
                placeholder="Ej. Aluminio negro, vidrio tintex"
              />

              <label>Foto de referencia (opcional)</label>
              <div className="row" style={{ alignItems: 'center' }}>
                <input
                  id="lv-ft"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoUpload(f);
                  }}
                />
                <button
                  type="button"
                  className="gh"
                  onClick={() => document.getElementById('lv-ft')?.click()}
                >
                  {form.foto ? '📷 Cambiar foto' : '📷 Tomar / subir foto'}
                </button>
                {form.foto && (
                  <>
                    <img
                      className="th"
                      src={form.foto}
                      alt="Foto de pieza"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setViewerFoto(form.foto);
                        pushView('foto');
                      }}
                    />
                    <button
                      type="button"
                      className="dg"
                      style={{ flex: '0 0 auto' }}
                      onClick={() => setForm((prev) => ({ ...prev, foto: '' }))}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>

              <div className="grid" style={{ marginTop: '12px' }}>
                <button type="button" className="or" id="lv-btn-add" onClick={handleAddOrUpdatePieza}>
                  {form.editId ? '💾 Guardar cambios' : '➕ Agregar pieza'}
                </button>
                {form.editId && (
                  <button
                    type="button"
                    className="gh"
                    onClick={() => setForm(createEmptyForm(form.u, form.tipo))}
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </div>

            <div className="card">
              <b>Piezas del levantamiento</b>
              {draft.piezas.length === 0 ? (
                <div className="pv" style={{ color: '#94a3b8', padding: '10px 0' }}>
                  Aún no has agregado medidas.
                </div>
              ) : (
                draft.piezas.map((p, idx) => (
                  <div className="it" key={p.id}>
                    {p.foto ? (
                      <img
                        className="th"
                        src={p.foto}
                        alt="Foto"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setViewerFoto(p.foto);
                          pushView('foto');
                        }}
                      />
                    ) : (
                      <div
                        className="th"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        🪟
                      </div>
                    )}
                    <div className="tx">
                      <b>
                        {idx + 1}. {p.tipo}
                      </b>
                      {p.area && <small>{p.area}</small>}
                      <div>
                        {formatMedidaText(p)} · Cant: {p.cant}
                      </div>
                      {p.notas && <small>{p.notas}</small>}
                    </div>
                    <div className="ac">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            tipo: p.tipo,
                            area: p.area,
                            ancho: String(p.anchoCm),
                            alto: String(p.altoCm),
                            u: 'cm',
                            cant: p.cant,
                            notas: p.notas,
                            foto: p.foto,
                            editId: p.id,
                          });
                          if (rootRef.current) rootRef.current.scrollTop = 0;
                        }}
                      >
                        ✏️
                      </button>
                      {confirmDeletePieceId === p.id ? (
                        <button
                          type="button"
                          className="dg"
                          onClick={() => {
                            const nextPiezas = draft.piezas.filter((x) => x.id !== p.id);
                            persistDraft({ ...draft, piezas: nextPiezas });
                            if (form.editId === p.id) setForm(createEmptyForm());
                            setConfirmDeletePieceId(null);
                          }}
                        >
                          Confirmar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="dg"
                          onClick={() => setConfirmDeletePieceId(p.id)}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div className="tot">{resumenLevantamiento(draft.piezas)}</div>
            </div>

            <div className="grid">
              <button type="button" className="or" id="lv-btn-send" onClick={handleOpenSendDest}>
                ⚙️ Enviar a Cotizador / Lista de Cortes
              </button>
              <div className="row">
                <button type="button" className="gr" onClick={handleShareWhatsapp}>
                  💬 Compartir por WhatsApp
                </button>
                <button
                  type="button"
                  className="gh"
                  style={{ flex: '0 0 auto' }}
                  onClick={() => void handleCopySummary()}
                >
                  📋 Copiar
                </button>
              </div>
              <button type="button" onClick={handleSaveLevantamiento}>
                💾 Guardar Levantamiento
              </button>
              {!confirmNewOpen ? (
                <button
                  type="button"
                  className="gh"
                  onClick={() => {
                    if (draft.piezas.length > 0 && !draft.guardado) {
                      setConfirmNewOpen(true);
                    } else {
                      const empty = createEmptyLevantamiento();
                      setDraft(empty);
                      setForm(createEmptyForm());
                      safeSave(LEV_KEYS.draft, empty);
                    }
                  }}
                >
                  ＋ Nuevo levantamiento
                </button>
              ) : (
                <div className="row">
                  <button
                    type="button"
                    className="dg"
                    onClick={() => {
                      const empty = createEmptyLevantamiento();
                      setDraft(empty);
                      setForm(createEmptyForm());
                      safeSave(LEV_KEYS.draft, empty);
                      setConfirmNewOpen(false);
                    }}
                  >
                    Sí, empezar nuevo sin guardar
                  </button>
                  <button type="button" className="gh" onClick={() => setConfirmNewOpen(false)}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isOpen && currentScreen === 'dest' && (
          <div className="w">
            <div className="top">
              <button type="button" className="gh" onClick={goBackView}>
                ←
              </button>
              <h2>Enviar a…</h2>
            </div>
            <div className="card pv" style={{ color: '#94a3b8' }}>
              {draft.cliente} · {resumenLevantamiento(draft.piezas)}
            </div>
            <div className="grid">
              <button
                type="button"
                className="or"
                id="lv-dest-modulacion"
                onClick={() => handleLaunchDestino('modulacion')}
              >
                🧩 Modulación (despiece y cortes)
              </button>
              <button
                type="button"
                className="or"
                id="lv-dest-cortes"
                onClick={() => handleLaunchDestino('cortes')}
              >
                ✂️ Lista de Cortes (plano técnico)
              </button>
              <button
                type="button"
                className="or"
                id="lv-dest-cotizacion"
                onClick={() => handleLaunchDestino('cotizacion')}
              >
                💲 Cotización
              </button>
            </div>
            <div className="pv" style={{ color: '#94a3b8', marginTop: '10px' }}>
              Se carga la primera pieza; con la barra inferior pasas a las demás.
            </div>
          </div>
        )}

        {isOpen && currentScreen === 'hist' && (
          <div className="w">
            <div className="top">
              <button type="button" className="gh" onClick={goBackView}>
                ←
              </button>
              <h2>📂 Levantamientos Guardados</h2>
            </div>
            {savedList.length === 0 ? (
              <div className="card pv" style={{ color: '#94a3b8' }}>
                Todavía no hay levantamientos guardados.
              </div>
            ) : (
              savedList.map((rec) => (
                <div className="card" key={rec.id}>
                  <div className="row" style={{ alignItems: 'center' }}>
                    <div
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const loaded = JSON.parse(JSON.stringify(rec)) as LevantamientoDraft;
                        setDraft(loaded);
                        setForm(createEmptyForm());
                        safeSave(LEV_KEYS.draft, loaded);
                        goBackView();
                      }}
                    >
                      <b>{rec.cliente}</b>
                      <small style={{ display: 'block', color: '#94a3b8' }}>
                        {rec.fecha} · {resumenLevantamiento(rec.piezas)}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="dg"
                      style={{ flex: '0 0 auto' }}
                      onClick={() => {
                        const next = savedList.filter((x) => x.id !== rec.id);
                        setSavedList(next);
                        safeSave(LEV_KEYS.saved, next);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {isOpen && currentScreen === 'foto' && viewerFoto && (
          <div className="vw" onClick={goBackView}>
            <img src={viewerFoto} alt="Vista ampliada" />
          </div>
        )}
      </div>

      {queue && activeQueuePieza && (
        <div id="lev-bar" style={{ display: 'flex' }}>
          <button
            type="button"
            data-b="p"
            aria-label="Pieza anterior"
            onClick={() => {
              if (queueIdx > 0) {
                enviarPieza(queueIdx - 1, queue, queueCli, queueDest);
              }
            }}
          >
            ◀
          </button>
          <span>
            📏 {queueCli} · Pieza {queueIdx + 1}/{queue.length}
            <br />
            {activeQueuePieza.tipo}
            {activeQueuePieza.area ? ` · ${activeQueuePieza.area}` : ''} ·{' '}
            {formatMedidaText(activeQueuePieza)} ×{activeQueuePieza.cant}
          </span>
          <button
            type="button"
            data-b="n"
            aria-label="Siguiente pieza"
            onClick={() => {
              if (queueIdx < queue.length - 1) {
                enviarPieza(queueIdx + 1, queue, queueCli, queueDest);
              }
            }}
          >
            ▶
          </button>
          <button
            type="button"
            data-b="x"
            aria-label="Cerrar barra de levantamiento"
            style={{ background: '#be123c' }}
            onClick={() => setQueue(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};
