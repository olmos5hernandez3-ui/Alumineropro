import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlumBridgePayload,
  buildBridgePayloadFromPieza,
  buildLevantamientoWhatsappText,
  cmFromUnit,
  createEmptyLevantamiento,
  formatMedida,
  formatMedidaText,
  getDefaultLineaPerfilForTipo,
  LEV_COLOR_ALUMINIO_OPTS,
  LEV_COLOR_VIDRIO_OPTS,
  LEV_KEYS,
  LEV_LINEA_PERFIL_OPTS,
  LEV_MOSQUITERO_OPTS,
  LEV_TIPOS,
  LevantamientoDestino,
  LevantamientoDraft,
  LevantamientoPieza,
  LevantamientoUnidad,
  mergeLevantamientosBackup,
  normalizeLevantamientoDraft,
  normalizeLevantamientoList,
  overwriteHojaProyectoInStorage,
  resumenLevantamiento,
} from '../utils/levantamientoLogic';
import {
  formatClientPhoneInput,
  generateRandomMxPhonePlaceholder,
  MEXICO_ALUMINUM_CATEGORIES,
  MEXICO_ALUMINUM_SYSTEMS,
  MexicoAluminumCategoryId,
  validateRealisticOpeningDimensions,
} from '../utils/alumineroLogic';
import {
  ClienteGuardado,
  loadClientes,
  openExternalLinkSafe,
  upsertCliente,
} from '../utils/storageHelpers';
import { isRunningInIframe } from '../utils/iframeEnv';

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
  lineaPerfil: string;
  colorAluminio: string;
  colorVidrio: string;
  mosquitero: string;
  notas: string;
  foto: string;
  editId: string | null;
}

function createEmptyForm(
  u: LevantamientoUnidad = 'cm',
  tipo: string = LEV_TIPOS[0],
  specs?: Partial<Pick<LevantamientoFormState, 'lineaPerfil' | 'colorAluminio' | 'colorVidrio' | 'mosquitero'>>
): LevantamientoFormState {
  return {
    tipo,
    area: '',
    ancho: '',
    alto: '',
    u,
    cant: 1,
    lineaPerfil: specs?.lineaPerfil || getDefaultLineaPerfilForTipo(tipo),
    colorAluminio: specs?.colorAluminio || 'Natural',
    colorVidrio: specs?.colorVidrio || 'Vidrio claro',
    mosquitero: specs?.mosquitero || 'Sin mosquitero',
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
  onSetHojaProyecto: (cliente: string, telefono?: string, direccion?: string) => void;
  onBatchSendToHoja?: (draft: LevantamientoDraft) => void;
  onOpenModulacion?: () => void;
  onShowToast?: (msg: string, topSuccess?: boolean) => void;
}

export const LevantamientoRapido: React.FC<Props> = ({
  onSetHojaProyecto,
  onBatchSendToHoja,
  onOpenModulacion,
  onShowToast,
}) => {
  const [draft, setDraft] = useState<LevantamientoDraft>(() => {
    const loaded = typeof window !== 'undefined' ? safeLoad<LevantamientoDraft | null>(LEV_KEYS.draft, null) : null;
    if (loaded && Array.isArray(loaded.piezas)) return normalizeLevantamientoDraft(loaded);
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
    typeof window !== 'undefined' ? normalizeLevantamientoList(safeLoad<unknown[]>(LEV_KEYS.saved, [])) : []
  );
  const [clientesGuardados, setClientesGuardados] = useState<ClienteGuardado[]>(() =>
    typeof window !== 'undefined' ? loadClientes() : []
  );
  const [showCliSuggestions, setShowCliSuggestions] = useState(false);
  const [showMexicoLines, setShowMexicoLines] = useState(false);
  const [mexicoLineCat, setMexicoLineCat] = useState<MexicoAluminumCategoryId>('nacional');
  const [customLineaText, setCustomLineaText] = useState('');
  const randomPhonePlaceholder = useMemo(() => generateRandomMxPhonePlaceholder(), []);
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [confirmDeletePieceId, setConfirmDeletePieceId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

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
    try {
      window.dispatchEvent(new CustomEvent('aluminero:lev-draft-updated'));
    } catch {
      // ignorar
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
    if (!isRunningInIframe()) {
      try {
        window.history.pushState({ alumLev: 1, v }, '');
      } catch {
        // ignore if restricted
      }
    }
  }, []);

  const openModal = useCallback(() => {
    if (viewsRef.current.length > 0) return;
    setSavedList(normalizeLevantamientoList(safeLoad<unknown[]>(LEV_KEYS.saved, [])));
    setClientesGuardados(loadClientes());
    document.body.style.overflow = 'hidden';
    pushView('main');
  }, [pushView]);

  const goBackView = useCallback(() => {
    if (viewsRef.current.length > 0) {
      if (isRunningInIframe()) {
        const next = viewsRef.current.slice(0, -1);
        viewsRef.current = next;
        setViews(next);
        if (next.length === 0) {
          document.body.style.overflow = '';
          setViewerFoto('');
        }
        return;
      }
      try {
        window.history.go(-1);
      } catch {
        const next = viewsRef.current.slice(0, -1);
        viewsRef.current = next;
        setViews(next);
        if (next.length === 0) {
          document.body.style.overflow = '';
          setViewerFoto('');
        }
      }
    }
  }, []);

  const closeAllViews = useCallback((cb?: () => void) => {
    if (viewsRef.current.length === 0) {
      cb?.();
      return;
    }
    if (isRunningInIframe()) {
      viewsRef.current = [];
      setViews([]);
      document.body.style.overflow = '';
      setViewerFoto('');
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
    if (isRunningInIframe()) {
      return () => {
        document.body.style.overflow = '';
      };
    }
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
    (clienteName: string, telefono?: string, direccion?: string) => {
      const clean = String(clienteName || '').trim();
      if (!clean) return;
      overwriteHojaProyectoInStorage(clean);
      onSetHojaProyecto(clean, telefono, direccion);
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
    const dimCheck = validateRealisticOpeningDimensions(anchoCm, altoCm, form.tipo);
    if (!dimCheck.valid) {
      const msg = dimCheck.error || 'Medidas inválidas para el tipo de pieza seleccionado.';
      setLocalError(msg);
      notify(msg);
      return;
    }
    const lineaFinal =
      form.lineaPerfil === 'Otra' && customLineaText.trim()
        ? customLineaText.trim()
        : form.lineaPerfil;
    const pieza: LevantamientoPieza = {
      id: form.editId || `lv-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      tipo: form.tipo,
      area: form.area.trim(),
      anchoCm,
      altoCm,
      cant: Math.max(1, form.cant),
      lineaPerfil: lineaFinal,
      colorAluminio: form.colorAluminio,
      colorVidrio: form.colorVidrio || 'Vidrio claro',
      mosquitero: form.mosquitero,
      notas: form.notas.trim(),
      foto: form.foto,
    };
    const isEditing = Boolean(form.editId);
    const nextPiezas = form.editId
      ? draft.piezas.map((x) => (x.id === form.editId ? pieza : x))
      : [...draft.piezas, pieza];
    persistDraft({ ...draft, piezas: nextPiezas });
    setForm(
      createEmptyForm(form.u, form.tipo, {
        lineaPerfil: lineaFinal,
        colorAluminio: form.colorAluminio,
        colorVidrio: form.colorVidrio || 'Vidrio claro',
        mosquitero: form.mosquitero,
      })
    );
    setLocalError(null);
    notify(
      isEditing
        ? 'Cambios guardados en la pieza.'
        : `Medida #${nextPiezas.length} agregada. Puedes seguir capturando más medidas.`,
      true
    );
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
    const cli = ensureCliente();
    if (!cli) return;
    if (draft.piezas.length === 0) {
      notify('Agrega al menos una medida.');
      return;
    }
    const nextClientes = upsertCliente({
      nombre: cli,
      telefono: draft.telefono,
      direccion: draft.direccion,
    });
    setClientesGuardados(nextClientes);
    const currentList = normalizeLevantamientoList(safeLoad<unknown[]>(LEV_KEYS.saved, []));
    const copy: LevantamientoDraft = normalizeLevantamientoDraft({
      ...JSON.parse(JSON.stringify(draft)),
      guardado: true,
    });
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

  const handleDuplicatePieza = (idx: number) => {
    const source = draft.piezas[idx];
    if (!source) return;
    const cloned: LevantamientoPieza = {
      ...source,
      id: `lv-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    };
    const nextPiezas = [
      ...draft.piezas.slice(0, idx + 1),
      cloned,
      ...draft.piezas.slice(idx + 1),
    ];
    persistDraft({ ...draft, piezas: nextPiezas });
    notify('Medida duplicada.', true);
  };

  const handleExportBackupJson = () => {
    const payload = {
      app: 'Aluminero Pro',
      tipo: 'levantamientos',
      exportedAt: new Date().toISOString(),
      levantamientos: savedList,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `levantamientos-aluminero-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Respaldo de levantamientos exportado (.json).', true);
  };

  const handleImportBackupJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '[]'));
        const { merged, addedCount, updatedCount } = mergeLevantamientosBackup(savedList, parsed);
        if (addedCount === 0 && updatedCount === 0) {
          notify('El archivo no contiene levantamientos válidos.');
          return;
        }
        if (safeSave(LEV_KEYS.saved, merged)) {
          setSavedList(merged);
          notify(
            `Respaldo importado: ${addedCount} nuevo(s), ${updatedCount} actualizado(s).`,
            true
          );
        } else {
          notify('No hay espacio suficiente para importar el respaldo.');
        }
      } catch {
        notify('Archivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenSendDest = () => {
    const cli = ensureCliente();
    if (!cli) return;
    if (draft.piezas.length === 0) {
      notify('Agrega al menos una medida.');
      return;
    }
    const nextClientes = upsertCliente({
      nombre: cli,
      telefono: draft.telefono,
      direccion: draft.direccion,
    });
    setClientesGuardados(nextClientes);
    applyClienteToHoja(cli, draft.telefono, draft.direccion);
    safeSave(LEV_KEYS.draft, draft);
    pushView('dest');
  };

  const handleLaunchDestino = (dest: LevantamientoDestino) => {
    const normalized = normalizeLevantamientoDraft(draft);
    const piecesCopy = normalized.piezas.slice();
    const clienteCopy = normalized.cliente.trim();
    applyClienteToHoja(clienteCopy, normalized.telefono, normalized.direccion);
    setClientesGuardados(
      upsertCliente({
        nombre: clienteCopy,
        telefono: normalized.telefono,
        direccion: normalized.direccion,
      })
    );

    if (dest === 'cotizacion' && onBatchSendToHoja) {
      closeAllViews(() => {
        onBatchSendToHoja(normalized);
      });
      return;
    }

    safeSave(LEV_KEYS.activo, normalized);
    window.dispatchEvent(new CustomEvent('aluminero:lev-activo-updated'));

    if (dest === 'modulacion' && onOpenModulacion) {
      closeAllViews(() => {
        onOpenModulacion();
      });
      return;
    }

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

            <div className="card" style={{ position: 'relative' }}>
              <label htmlFor="lv-cli">Cliente *</label>
              <input
                ref={cliInputRef}
                id="lv-cli"
                type="text"
                autoComplete="off"
                value={draft.cliente}
                onFocus={() => setShowCliSuggestions(true)}
                onBlur={() => setTimeout(() => setShowCliSuggestions(false), 180)}
                onChange={(e) => {
                  setLocalError(null);
                  setShowCliSuggestions(true);
                  persistDraft({ ...draft, cliente: e.target.value });
                }}
                placeholder="Ej. Sr. Juan Pérez"
              />
              {showCliSuggestions && clientesGuardados.length > 0 && (() => {
                const q = draft.cliente.trim().toLowerCase();
                const matches = clientesGuardados
                  .filter((c) => !q || c.nombre.toLowerCase().includes(q))
                  .slice(0, 5);
                if (matches.length === 0) return null;
                return (
                  <div
                    style={{
                      marginTop: '4px',
                      borderRadius: '10px',
                      border: '1px solid rgba(96,165,250,0.45)',
                      background: '#0f172a',
                      overflow: 'hidden',
                    }}
                  >
                    {matches.map((c) => (
                      <button
                        key={c.nombre}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          persistDraft({
                            ...draft,
                            cliente: c.nombre,
                            telefono: c.telefono || draft.telefono || '',
                            direccion: c.direccion || draft.direccion || '',
                            ref: c.direccion || draft.ref || '',
                          });
                          setShowCliSuggestions(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid rgba(148,163,184,0.18)',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          fontSize: '12.5px',
                        }}
                      >
                        <strong style={{ display: 'block', color: '#fff' }}>{c.nombre}</strong>
                        {(c.telefono || c.direccion) && (
                          <small style={{ color: '#94a3b8' }}>
                            {[c.telefono, c.direccion].filter(Boolean).join(' · ')}
                          </small>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })()}

              <label htmlFor="lv-tel">Teléfono (opcional)</label>
              <input
                id="lv-tel"
                type="tel"
                inputMode="tel"
                value={draft.telefono || ''}
                onChange={(e) =>
                  persistDraft({
                    ...draft,
                    telefono: formatClientPhoneInput(e.target.value, draft.telefono ?? ''),
                  })
                }
                placeholder={randomPhonePlaceholder}
              />

              <label htmlFor="lv-dir">Dirección / ubicación / referencia (opcional)</label>
              <input
                id="lv-dir"
                type="text"
                value={draft.direccion ?? draft.ref ?? ''}
                onChange={(e) =>
                  persistDraft({
                    ...draft,
                    direccion: e.target.value,
                    ref: e.target.value,
                  })
                }
                placeholder="Ej. Col. Centro #45, entre Hidalgo y Juárez"
              />
            </div>

            <div className="card">
              <b>{form.editId ? '✏️ Editando pieza' : '➕ Nueva medida'}</b>
              <label htmlFor="lv-tipo">Tipo</label>
              <select
                id="lv-tipo"
                value={form.tipo}
                onChange={(e) => {
                  const nextTipo = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    tipo: nextTipo,
                    lineaPerfil: prev.editId
                      ? prev.lineaPerfil
                      : getDefaultLineaPerfilForTipo(nextTipo),
                  }));
                }}
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

              <label>Línea de perfil (México: Nacional, Española, Europea, Estructural)</label>
              <div className="lev-chip-group" role="group" aria-label="Línea de perfil">
                {LEV_LINEA_PERFIL_OPTS.map((opt) => {
                  const active = form.lineaPerfil === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`lev-chip${active ? ' on' : ''}`}
                      aria-pressed={active}
                      onClick={() => {
                        setForm((prev) => ({ ...prev, lineaPerfil: opt.label }));
                        if (opt.id === 'otra') setShowMexicoLines(true);
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  id="lv-btn-mexico-lines"
                  className={`lev-chip${showMexicoLines ? ' on' : ''}`}
                  aria-expanded={showMexicoLines}
                  onClick={() => setShowMexicoLines((prev) => !prev)}
                >
                  {showMexicoLines ? '▲ Ocultar líneas MX' : '🇲🇽 Más líneas MX'}
                </button>
              </div>

              {form.lineaPerfil &&
                !LEV_LINEA_PERFIL_OPTS.some((o) => o.label === form.lineaPerfil) && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#38bdf8',
                    }}
                  >
                    Línea seleccionada: {form.lineaPerfil}
                  </div>
                )}

              {showMexicoLines && (
                <div
                  id="lv-mexico-lines-panel"
                  style={{
                    marginTop: '8px',
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.72)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                  }}
                >
                  <div className="lev-chip-group" style={{ marginBottom: '8px' }}>
                    {MEXICO_ALUMINUM_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`lev-chip${mexicoLineCat === cat.id ? ' on' : ''}`}
                        onClick={() => setMexicoLineCat(cat.id)}
                      >
                        {cat.id === 'nacional'
                          ? 'Nacional (90°)'
                          : cat.id === 'espanola'
                            ? 'Española (45°)'
                            : cat.id === 'europea'
                              ? 'Europea (45°)'
                              : 'Estructural / Ind.'}
                      </button>
                    ))}
                  </div>
                  <div className="lev-chip-group">
                    {MEXICO_ALUMINUM_SYSTEMS.filter((s) => s.categoria === mexicoLineCat).map((sys) => {
                      const active = form.lineaPerfil === sys.quickLabel;
                      return (
                        <button
                          key={sys.id}
                          type="button"
                          className={`lev-chip${active ? ' on' : ''}`}
                          title={`${sys.nombre} · ${sys.tipoCorte} · ${sys.cristalRecomendado}`}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, lineaPerfil: sys.quickLabel }));
                            setCustomLineaText('');
                          }}
                        >
                          {sys.quickLabel}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    id="lv-custom-linea"
                    type="text"
                    value={customLineaText}
                    onChange={(e) => {
                      setCustomLineaText(e.target.value);
                      if (e.target.value.trim()) {
                        setForm((prev) => ({ ...prev, lineaPerfil: e.target.value.trim() }));
                      }
                    }}
                    placeholder="O escribe otra línea/serie (ej. Española 4600, Eurovent 100 mm, PTR 2x1)..."
                    style={{ marginTop: '8px' }}
                  />
                </div>
              )}

              <label>Color de aluminio</label>
              <div className="lev-chip-group" role="group" aria-label="Color de aluminio">
                {LEV_COLOR_ALUMINIO_OPTS.map((opt) => {
                  const active = form.colorAluminio === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`lev-chip${active ? ' on' : ''}`}
                      aria-pressed={active}
                      onClick={() => setForm((prev) => ({ ...prev, colorAluminio: opt.label }))}
                    >
                      {opt.hex && (
                        <span
                          className="lev-swatch"
                          style={{ backgroundColor: opt.hex }}
                          aria-hidden="true"
                        />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <label>Vidrio</label>
              <div className="lev-chip-group" role="group" aria-label="Vidrio">
                {LEV_COLOR_VIDRIO_OPTS.map((opt) => {
                  const active = form.colorVidrio === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`lev-chip${active ? ' on' : ''}`}
                      aria-pressed={active}
                      onClick={() => setForm((prev) => ({ ...prev, colorVidrio: opt.label }))}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <label>Mosquitero</label>
              <div className="lev-chip-group" role="group" aria-label="Mosquitero">
                {LEV_MOSQUITERO_OPTS.map((opt) => {
                  const active = form.mosquitero === opt.label;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`lev-chip${active ? ' on' : ''}`}
                      aria-pressed={active}
                      onClick={() => setForm((prev) => ({ ...prev, mosquitero: opt.label }))}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <label htmlFor="lv-nt">Notas (detalle adicional)</label>
              <textarea
                id="lv-nt"
                rows={2}
                value={form.notas}
                onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
                placeholder="Ej. Detalle de instalación, jaladera, zoclo especial..."
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
                  {form.editId ? '💾 Guardar cambios' : '＋ Agregar más medidas'}
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
              <b>Piezas del levantamiento ({draft.piezas.length})</b>
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
                      {(p.lineaPerfil || p.colorAluminio || p.colorVidrio || p.mosquitero) && (
                        <div className="lev-piece-badges">
                          {p.lineaPerfil && (
                            <span className="lev-piece-badge">{p.lineaPerfil}</span>
                          )}
                          {p.colorAluminio && (() => {
                            const alumOpt = LEV_COLOR_ALUMINIO_OPTS.find(
                              (o) => o.label === p.colorAluminio
                            );
                            return (
                              <span className="lev-piece-badge">
                                {alumOpt?.hex && (
                                  <span
                                    className="lev-piece-dot"
                                    style={{ backgroundColor: alumOpt.hex }}
                                    aria-hidden="true"
                                  />
                                )}
                                {p.colorAluminio}
                              </span>
                            );
                          })()}
                          {p.colorVidrio && (
                            <span className="lev-piece-badge">Vidrio: {p.colorVidrio}</span>
                          )}
                          {p.mosquitero && (
                            <span className="lev-piece-badge">{p.mosquitero}</span>
                          )}
                        </div>
                      )}
                      {p.notas && <small>{p.notas}</small>}
                    </div>
                    <div className="ac">
                      <button
                        type="button"
                        title="Duplicar medida"
                        aria-label={`Duplicar ${p.tipo}`}
                        onClick={() => handleDuplicatePieza(idx)}
                      >
                        📋
                      </button>
                      <button
                        type="button"
                        title="Editar medida"
                        aria-label={`Editar ${p.tipo}`}
                        onClick={() => {
                          setForm({
                            tipo: p.tipo,
                            area: p.area,
                            ancho: String(p.anchoCm),
                            alto: String(p.altoCm),
                            u: 'cm',
                            cant: p.cant,
                            lineaPerfil: p.lineaPerfil || getDefaultLineaPerfilForTipo(p.tipo),
                            colorAluminio: p.colorAluminio || 'Natural',
                            colorVidrio: p.colorVidrio || 'Claro',
                            mosquitero: p.mosquitero || 'Sin mosquitero',
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
                          title="Eliminar medida"
                          aria-label={`Eliminar ${p.tipo}`}
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
              Cotización agrega todas las piezas de una vez a tu Hoja. Modulación y Lista de Cortes cargan tu lista activa de trabajos.
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
            <div className="card">
              <div className="row" style={{ gap: '8px' }}>
                <button
                  type="button"
                  id="lv-btn-export-backup"
                  className="gh"
                  onClick={handleExportBackupJson}
                >
                  ⬇ Exportar respaldo (.json)
                </button>
                <button
                  type="button"
                  id="lv-btn-import-backup"
                  className="gh"
                  onClick={() => importFileRef.current?.click()}
                >
                  ⬆ Importar respaldo (.json)
                </button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportBackupJson(f);
                    e.target.value = '';
                  }}
                />
              </div>
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
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => {
                        const loaded = normalizeLevantamientoDraft(JSON.parse(JSON.stringify(rec)));
                        setDraft(loaded);
                        setForm(createEmptyForm());
                        safeSave(LEV_KEYS.draft, loaded);
                        goBackView();
                      }}
                    >
                      <b>{rec.cliente}</b>
                      {(rec.telefono || rec.direccion) && (
                        <small style={{ display: 'block', color: '#cbd5e1' }}>
                          {[rec.telefono, rec.direccion].filter(Boolean).join(' · ')}
                        </small>
                      )}
                      <small style={{ display: 'block', color: '#94a3b8' }}>
                        {rec.fecha} · {resumenLevantamiento(rec.piezas)}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="dg"
                      style={{ flex: '0 0 auto' }}
                      aria-label={`Eliminar levantamiento de ${rec.cliente}`}
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
