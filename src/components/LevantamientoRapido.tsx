import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlumBridgePayload,
  buildBridgePayloadFromPieza,
  buildLevantamientoWhatsappText,
  cmFromUnit,
  createEmptyLevantamiento,
  evaluateLevantamientoLineLimits,
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
  NormalizedSketchScanResult,
  normalizeScannedSketchResult,
  overwriteHojaProyectoInStorage,
  resolveColorAluminioFromLevantamiento,
  resolveLineaFromLevantamiento,
  resolveVidrioFromLevantamiento,
  resumenLevantamiento,
  SKETCH_SCANNER_OFFLINE_MESSAGE,
  stripBase64DataUrlPrefix,
} from '../utils/levantamientoLogic';
import {
  calcularDespiece,
  COLORES_CONFIG,
  CortePerfil,
  formatClientPhoneInput,
  LEV_MAX_CM,
  LEV_MIN_CM,
  LINEAS_CONFIG,
  MEXICO_ALUMINUM_CATEGORIES,
  MEXICO_ALUMINUM_SYSTEMS,
  MexicoAluminumCategoryId,
  PerfilCatalogoId,
  validateLevantamientoRequiredFields,
  validateLevantamientoStrictRange,
  validateRealisticOpeningDimensions,
} from '../utils/alumineroLogic';
import { buildDespieceTramos1D } from '../utils/modulacionLogic';
import { Tramos610AcomodadosSection } from './Tramos610AcomodadosSection';
import { MarginTrafficLightCard } from './MarginTrafficLightCard';
import { CollapsibleAccordion } from './CollapsibleAccordion';
import { DigitalWindowDrawingSvg } from './DigitalWindowDrawingSvg';
import {
  filterSelectedPiezasForCut,
  syncSelectedPiezaIds,
  togglePiezaSelection,
  toggleSelectAllPiezas,
} from '../utils/levantamientoSelection';
import { dispatchAssistantCelebrate } from '../utils/assistantEffects';
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
  hojas: string;
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
    hojas: '',
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
  proActive?: boolean;
  isAdmin?: boolean;
  onSetHojaProyecto: (cliente: string, telefono?: string, direccion?: string) => void;
  onBatchSendToHoja?: (draft: LevantamientoDraft) => void;
  onOpenModulacion?: () => void;
  onShowToast?: (msg: string, topSuccess?: boolean) => void;
}

export const LevantamientoRapido: React.FC<Props> = ({
  proActive = false,
  isAdmin = false,
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
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const [confirmDeletePieceId, setConfirmDeletePieceId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [editModalPiece, setEditModalPiece] = useState<{
    id: string;
    tipo: string;
    area: string;
    ancho: string;
    alto: string;
    cant: number;
    lineaPerfil: string;
    colorAluminio: string;
    colorVidrio: string;
    mosquitero: string;
    notas: string;
  } | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [sketchPanelOpen, setSketchPanelOpen] = useState<boolean>(false);
  const [sketchScanning, setSketchScanning] = useState<boolean>(false);
  const [sketchPreviewUrl, setSketchPreviewUrl] = useState<string>('');
  const [sketchError, setSketchError] = useState<string | null>(null);
  const [sketchOfflineAlert, setSketchOfflineAlert] = useState<boolean>(false);
  const [sketchResult, setSketchResult] = useState<NormalizedSketchScanResult | null>(null);
  const [accScannerOpen, setAccScannerOpen] = useState<boolean>(false);
  const [accManualOpen, setAccManualOpen] = useState<boolean>(true);
  const [accPiezasOpen, setAccPiezasOpen] = useState<boolean>(() => draft.piezas.length > 0);
  const [accTramosOpen, setAccTramosOpen] = useState<boolean>(false);
  const [selectedCutIds, setSelectedCutIds] = useState<string[]>(() =>
    draft.piezas.map((p) => p.id)
  );
  const knownPiezaIdsRef = useRef<Set<string>>(new Set(draft.piezas.map((p) => p.id)));
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const sketchCameraInputRef = useRef<HTMLInputElement | null>(null);
  const sketchGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const lastTapRef = useRef<{ id: string; ts: number }>({ id: '', ts: 0 });

  useEffect(() => {
    const prevKnown = knownPiezaIdsRef.current;
    const newlyAddedIds = draft.piezas.filter((p) => !prevKnown.has(p.id)).map((p) => p.id);
    knownPiezaIdsRef.current = new Set(draft.piezas.map((p) => p.id));
    setSelectedCutIds((prev) => syncSelectedPiezaIds(prev, draft.piezas, newlyAddedIds));
    if (newlyAddedIds.length > 0) {
      setAccPiezasOpen(true);
    }
  }, [draft.piezas]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const cliInputRef = useRef<HTMLInputElement | null>(null);
  const anchoInputRef = useRef<HTMLInputElement | null>(null);
  const altoInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSketchOfflineAlert(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const openPieceEditModal = (p: LevantamientoPieza) => {
    setSelectedPieceId(p.id);
    setEditModalError(null);
    setEditModalPiece({
      id: p.id,
      tipo: p.tipo,
      area: p.area || '',
      ancho: String(p.anchoCm),
      alto: String(p.altoCm),
      cant: Math.max(1, Number(p.cant) || 1),
      lineaPerfil: p.lineaPerfil || getDefaultLineaPerfilForTipo(p.tipo),
      colorAluminio: p.colorAluminio || 'Natural',
      colorVidrio: p.colorVidrio || (p.tipo === 'Mosquitero abatible' ? 'Sin vidrio' : 'Vidrio claro'),
      mosquitero: p.mosquitero || (p.tipo === 'Mosquitero abatible' ? 'Mosquitero abatible' : 'Sin mosquitero'),
      notas: p.notas || '',
    });
  };

  const handleSavePieceEditModal = () => {
    if (!editModalPiece) return;
    const reqCheck = validateLevantamientoRequiredFields({
      cliente: draft.cliente || 'Cliente',
      anchoRaw: editModalPiece.ancho,
      altoRaw: editModalPiece.alto,
      requireCliente: false,
    });
    if (!reqCheck.valid) {
      setEditModalError(reqCheck.message);
      return;
    }
    const anchoCm = cmFromUnit(editModalPiece.ancho, 'cm');
    const altoCm = cmFromUnit(editModalPiece.alto, 'cm');
    if (!anchoCm || !altoCm) {
      setEditModalError('Falta completar: Ancho y Alto válidos en cm.');
      return;
    }
    const dimCheck = validateRealisticOpeningDimensions(anchoCm, altoCm, editModalPiece.tipo);
    if (!dimCheck.valid) {
      setEditModalError(dimCheck.error || 'Medidas inválidas para el tipo de pieza seleccionado.');
      return;
    }
    const nextPiezas = draft.piezas.map((x) =>
      x.id === editModalPiece.id
        ? {
            ...x,
            tipo: editModalPiece.tipo,
            area: editModalPiece.area.trim(),
            anchoCm,
            altoCm,
            cant: Math.max(1, Number(editModalPiece.cant) || 1),
            lineaPerfil: editModalPiece.lineaPerfil.trim() || getDefaultLineaPerfilForTipo(editModalPiece.tipo),
            colorAluminio: editModalPiece.colorAluminio || 'Natural',
            colorVidrio: editModalPiece.colorVidrio || 'Vidrio claro',
            mosquitero: editModalPiece.mosquitero || 'Sin mosquitero',
            notas: editModalPiece.notas.trim(),
          }
        : x
    );
    const updatedDraft: LevantamientoDraft = { ...draft, piezas: nextPiezas };
    persistDraft(updatedDraft);
    safeSave(LEV_KEYS.activo, updatedDraft);
    window.dispatchEvent(new CustomEvent('aluminero:lev-activo-updated'));
    setEditModalPiece(null);
    setEditModalError(null);
    notify('Pieza actualizada correctamente.', true);
  };

  const handleAddOrUpdatePieza = () => {
    const reqCheck = validateLevantamientoRequiredFields({
      cliente: draft.cliente,
      anchoRaw: form.ancho,
      altoRaw: form.alto,
      lineaPerfil: form.lineaPerfil,
      lineaPerfilOtro: customLineaText,
    });
    if (!reqCheck.valid) {
      setLocalError(reqCheck.message);
      notify(reqCheck.message);
      if (reqCheck.firstMissingKey === 'cliente') {
        cliInputRef.current?.focus();
      } else if (reqCheck.firstMissingKey === 'ancho') {
        anchoInputRef.current?.focus();
      } else if (reqCheck.firstMissingKey === 'alto') {
        altoInputRef.current?.focus();
      }
      return;
    }
    const anchoCm = cmFromUnit(form.ancho, form.u);
    const altoCm = cmFromUnit(form.alto, form.u);
    if (!anchoCm || !altoCm) {
      const msg = 'Falta completar: Ancho y Alto válidos mayores a 0.';
      setLocalError(msg);
      notify(msg);
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
      hojas: form.hojas.trim() || undefined,
      notas: form.notas.trim(),
      foto: form.foto,
    };
    const isEditing = Boolean(form.editId);
    const nextPiezas = form.editId
      ? draft.piezas.map((x) => (x.id === form.editId ? pieza : x))
      : [...draft.piezas, pieza];
    const nextDraft = { ...draft, piezas: nextPiezas };
    persistDraft(nextDraft);
    safeSave(LEV_KEYS.activo, nextDraft);
    window.dispatchEvent(new CustomEvent('aluminero:lev-activo-updated'));
    setSelectedPieceId(pieza.id);
    setForm(
      createEmptyForm(form.u, form.tipo, {
        lineaPerfil: lineaFinal,
        colorAluminio: form.colorAluminio,
        colorVidrio: form.colorVidrio || 'Vidrio claro',
        mosquitero: form.mosquitero,
      })
    );
    setLocalError(null);
    if (!isEditing) {
      dispatchAssistantCelebrate('piece');
    }
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

  const compressImageForSketchScan = (
    file: File
  ): Promise<{ cleanBase64: string; thumbDataUrl: string }> =>
    new Promise((resolve, reject) => {
      const renderImageToCanvas = (im: HTMLImageElement, cleanup?: () => void) => {
        try {
          const maxSide = 1024;
          const naturalW = im.naturalWidth || im.width || 1;
          const naturalH = im.naturalHeight || im.height || 1;
          const scale = Math.min(1, maxSide / Math.max(naturalW, naturalH));
          const w = Math.max(1, Math.round(naturalW * scale));
          const h = Math.max(1, Math.round(naturalH * scale));
          const scanCanvas = document.createElement('canvas');
          scanCanvas.width = w;
          scanCanvas.height = h;
          const scanCtx = scanCanvas.getContext('2d');
          if (!scanCtx) {
            cleanup?.();
            reject(new Error('No se pudo preparar el lienzo de compresión para el escáner.'));
            return;
          }
          scanCtx.fillStyle = '#ffffff';
          scanCtx.fillRect(0, 0, w, h);
          scanCtx.drawImage(im, 0, 0, w, h);
          const scanDataUrl = scanCanvas.toDataURL('image/jpeg', 0.8);
          const cleanBase64 = stripBase64DataUrlPrefix(scanDataUrl);

          const thumbW = Math.min(600, w);
          const thumbH = Math.max(1, Math.round((h * thumbW) / w));
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbW;
          thumbCanvas.height = thumbH;
          const thumbCtx = thumbCanvas.getContext('2d');
          if (thumbCtx) {
            thumbCtx.drawImage(scanCanvas, 0, 0, thumbW, thumbH);
          }
          const thumbDataUrl = thumbCtx ? thumbCanvas.toDataURL('image/jpeg', 0.65) : scanDataUrl;
          cleanup?.();
          resolve({ cleanBase64, thumbDataUrl });
        } catch (canvasErr) {
          cleanup?.();
          reject(
            canvasErr instanceof Error
              ? canvasErr
              : new Error('Error al comprimir la imagen del croquis.')
          );
        }
      };

      const loadViaFileReader = () => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen seleccionado.'));
        reader.onload = () => {
          const im = new Image();
          im.onerror = () => reject(new Error('La imagen seleccionada no es compatible o está dañada.'));
          im.onload = () => renderImageToCanvas(im);
          im.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
      };

      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const objectUrl = URL.createObjectURL(file);
        const im = new Image();
        im.onload = () => renderImageToCanvas(im, () => URL.revokeObjectURL(objectUrl));
        im.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          loadViaFileReader();
        };
        im.src = objectUrl;
      } else {
        loadViaFileReader();
      }
    });

  const handleToggleSketchScanner = () => {
    const currentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : isOnline;
    setIsOnline(currentlyOnline);
    if (!currentlyOnline) {
      setSketchOfflineAlert(true);
      setSketchError(null);
      setSketchPanelOpen(false);
      notify(SKETCH_SCANNER_OFFLINE_MESSAGE);
      return;
    }
    setSketchOfflineAlert(false);
    setSketchError(null);
    setSketchPanelOpen((prev) => !prev);
  };

  const handleSketchFileSelected = async (file: File) => {
    const currentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : isOnline;
    setIsOnline(currentlyOnline);
    if (!currentlyOnline) {
      setSketchOfflineAlert(true);
      setSketchError(null);
      notify(SKETCH_SCANNER_OFFLINE_MESSAGE);
      return;
    }

    setSketchOfflineAlert(false);
    setSketchError(null);
    setSketchResult(null);
    setSketchScanning(true);

    try {
      const { cleanBase64, thumbDataUrl } = await compressImageForSketchScan(file);
      setSketchPreviewUrl(thumbDataUrl);

      const response = await fetch('/api/scan-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: cleanBase64,
          mimeType: 'image/jpeg',
        }),
      });

      const rawBodyText = await response.text().catch(() => '');
      let payload: {
        ok?: boolean;
        result?: NormalizedSketchScanResult;
        error?: string;
        errorCode?: string;
        detail?: string;
      } = {};
      if (rawBodyText) {
        try {
          payload = JSON.parse(rawBodyText) as typeof payload;
        } catch {
          console.error(
            '[Escanear Croquis IA] Respuesta no JSON del servidor:',
            response.status,
            rawBodyText.slice(0, 260)
          );
        }
      }

      if (!response.ok || !payload.ok || !payload.result) {
        const detailLog = {
          status: response.status,
          errorCode: payload.errorCode || `HTTP_${response.status}`,
          error: payload.error,
          detail: payload.detail,
        };
        console.error('[Escanear Croquis IA] Error de escaneo:', detailLog);

        const friendlyError =
          payload.error ||
          (response.status === 404
            ? 'El servidor de escáner IA (/api/scan-sketch) no está disponible en este alojamiento (404). Puedes capturar las medidas manualmente abajo.'
            : response.status === 503
              ? 'El escáner IA no tiene configurada la API Key de Gemini en el servidor (503). Puedes capturar las medidas manualmente.'
              : `No se pudo interpretar el croquis (HTTP ${response.status}). Intenta con una foto más clara o captura las medidas manualmente.`);
        throw new Error(friendlyError);
      }

      const normalized = normalizeScannedSketchResult(payload.result);
      setSketchResult(normalized);
      setSketchPanelOpen(false);
      setAccScannerOpen(true);
      setAccManualOpen(true);
      setLocalError(null);

      setForm((prev) => {
        const isMosqAbatible = normalized.tipo === 'Mosquitero abatible';
        return {
          ...prev,
          tipo: normalized.tipo,
          u: 'cm',
          ancho: normalized.anchoCm ? String(normalized.anchoCm) : prev.ancho,
          alto: normalized.altoCm ? String(normalized.altoCm) : prev.alto,
          hojas: normalized.hojasDistribucion || prev.hojas,
          area: normalized.area || prev.area,
          lineaPerfil: prev.editId
            ? prev.lineaPerfil
            : getDefaultLineaPerfilForTipo(normalized.tipo),
          colorVidrio: isMosqAbatible ? 'Sin vidrio' : prev.colorVidrio,
          mosquitero: isMosqAbatible ? 'Mosquitero abatible' : prev.mosquitero,
          notas: normalized.notasFormateadas,
          foto: thumbDataUrl,
        };
      });

      notify(
        normalized.anchoCm && normalized.altoCm
          ? `✓ Croquis detectado: ${normalized.resumenCorto}. Campos rellenados automáticamente.`
          : '✓ Croquis detectado. Confirma o completa las medidas en los campos de abajo.',
        true
      );
    } catch (err) {
      const nowOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (nowOffline) {
        setIsOnline(false);
        setSketchOfflineAlert(true);
        setSketchError(null);
        notify(SKETCH_SCANNER_OFFLINE_MESSAGE);
      } else {
        console.error('[Escanear Croquis IA] Excepción al procesar foto:', err);
        const msg =
          err instanceof Error
            ? err.message
            : 'Error de red al analizar el croquis. Verifica tu conexión o captura las medidas manualmente.';
        setSketchError(msg);
        notify(msg);
      }
    } finally {
      setSketchScanning(false);
      if (sketchCameraInputRef.current) sketchCameraInputRef.current.value = '';
      if (sketchGalleryInputRef.current) sketchGalleryInputRef.current.value = '';
    }
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
    const outOfRange = normalized.piezas.find(
      (p) => !validateLevantamientoStrictRange(p.anchoCm, p.altoCm).valid
    );
    if (outOfRange) {
      const msg =
        validateLevantamientoStrictRange(outOfRange.anchoCm, outOfRange.altoCm).error ||
        `Todas las medidas deben estar entre ${LEV_MIN_CM} cm y ${LEV_MAX_CM} cm.`;
      setLocalError(msg);
      notify(msg);
      return;
    }
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
                placeholder="Ejemplo Cliente"
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
                placeholder="333-333-4444"
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

            {/* ACORDEÓN 1: Escáner de Croquis con IA (colapsado por defecto) */}
            <CollapsibleAccordion
              id="acc-lev-scanner"
              title="📷 Escáner de Croquis con IA"
              summary={
                accScannerOpen
                  ? isOnline
                    ? 'IA Lista · En línea · Lee medidas y hojas X / O'
                    : 'Modo Sin Red · Captura manual disponible abajo'
                  : 'Toca para escanear dibujo con cámara o foto'
              }
              open={accScannerOpen}
              onToggle={() => setAccScannerOpen((prev) => !prev)}
              tone="dark"
              className="card !p-0"
              rightAction={
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: isOnline ? 'rgba(14, 165, 233, 0.2)' : 'rgba(244, 63, 94, 0.22)',
                    border: isOnline
                      ? '1px solid rgba(56, 189, 248, 0.55)'
                      : '1px solid rgba(251, 113, 133, 0.65)',
                    color: isOnline ? '#7dd3fc' : '#fecdd3',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isOnline ? 'IA Lista' : 'Sin Red'}
                </span>
              }
            >
              {/* Escáner de Croquis a Mano con Cámara / IA */}
              <div>
                <input
                  ref={sketchCameraInputRef}
                  id="lv-sketch-camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleSketchFileSelected(f);
                  }}
                />
                <input
                  ref={sketchGalleryInputRef}
                  id="lv-sketch-gallery-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleSketchFileSelected(f);
                  }}
                />

                <button
                  type="button"
                  id="btn-scan-sketch-ai"
                  disabled={sketchScanning}
                  onClick={handleToggleSketchScanner}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(56, 189, 248, 0.75)',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: sketchScanning ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    opacity: sketchScanning ? 0.8 : 1,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                    <span aria-hidden="true" style={{ fontSize: '18px', lineHeight: 1 }}>📷</span>
                    <span>
                      <span style={{ display: 'block', lineHeight: 1.2 }}>
                        {sketchScanning
                          ? 'Analizando croquis con IA...'
                          : 'Escanear Croquis con Cámara / Foto'}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 600,
                          opacity: 0.92,
                          marginTop: '2px',
                        }}
                      >
                        Lee medidas a mano y hojas X (corrediza) / O (fija)
                      </span>
                    </span>
                  </span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.35)',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    IA
                  </span>
                </button>

                {sketchOfflineAlert && (
                  <div
                    id="sketch-offline-notice"
                    role="alert"
                    style={{
                      marginTop: '8px',
                      padding: '10px 12px',
                      borderRadius: '11px',
                      background: 'rgba(180, 83, 9, 0.25)',
                      border: '1px solid rgba(251, 191, 36, 0.7)',
                      color: '#fef3c7',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span>📡 {SKETCH_SCANNER_OFFLINE_MESSAGE}</span>
                    <button
                      type="button"
                      aria-label="Cerrar aviso sin conexión"
                      onClick={() => setSketchOfflineAlert(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fde68a',
                        fontWeight: 800,
                        padding: '0 4px',
                        minHeight: 'auto',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {sketchPanelOpen && !sketchScanning && (
                  <div
                    id="sketch-scanner-panel"
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.45, marginBottom: '10px' }}>
                      <strong style={{ color: '#7dd3fc', display: 'block', marginBottom: '3px' }}>
                        ¿Cómo tomar la foto del croquis?
                      </strong>
                      Dibuja tu ventana o puerta en papel con sus medidas (cm, mm o m) y marca{' '}
                      <strong style={{ color: '#fff' }}>X</strong> en cada hoja corrediza y{' '}
                      <strong style={{ color: '#fff' }}>O</strong> en cada hoja fija (ej. O-X o O-X-O).
                    </div>
                    <div className="row">
                      <button
                        type="button"
                        id="btn-sketch-take-photo"
                        onClick={() => sketchCameraInputRef.current?.click()}
                        style={{
                          background: '#0ea5e9',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '12.5px',
                        }}
                      >
                        📷 Tomar foto ahora
                      </button>
                      <button
                        type="button"
                        id="btn-sketch-upload-gallery"
                        className="gh"
                        onClick={() => sketchGalleryInputRef.current?.click()}
                        style={{ fontSize: '12.5px', fontWeight: 800 }}
                      >
                        🖼️ Subir foto / galería
                      </button>
                    </div>
                  </div>
                )}

                {sketchScanning && (
                  <div
                    id="sketch-scanning-state"
                    role="status"
                    aria-live="polite"
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(2, 132, 199, 0.18)',
                      border: '1px solid rgba(56, 189, 248, 0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    {sketchPreviewUrl && (
                      <img
                        src={sketchPreviewUrl}
                        alt="Croquis en análisis"
                        style={{
                          width: '54px',
                          height: '54px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid rgba(148,163,184,0.45)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ fontSize: '12.5px', color: '#e0f2fe', lineHeight: 1.4 }}>
                      <strong style={{ display: 'block', color: '#ffffff' }}>
                        Leyendo croquis y medidas a mano...
                      </strong>
                      Identificando tipo de pieza, ancho, alto y hojas X / O.
                    </div>
                  </div>
                )}

                {sketchError && (
                  <div
                    id="sketch-scan-error"
                    role="alert"
                    style={{
                      marginTop: '8px',
                      padding: '10px 12px',
                      borderRadius: '11px',
                      background: 'rgba(153, 27, 27, 0.28)',
                      border: '1px solid rgba(248, 113, 113, 0.7)',
                      color: '#fecaca',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    ⚠️ {sketchError}
                  </div>
                )}

                {sketchResult && !sketchScanning && (
                  <div
                    id="sketch-scan-result-card"
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(6, 78, 59, 0.28)',
                      border: '1.5px solid rgba(52, 211, 153, 0.65)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#6ee7b7' }}>
                          ✓ Croquis leído y prellenado
                        </strong>
                        <div style={{ fontSize: '12.5px', color: '#f8fafc', fontWeight: 700, marginTop: '2px' }}>
                          {sketchResult.resumenCorto}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: '6px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          background:
                            sketchResult.confianza === 'alta'
                              ? 'rgba(16, 185, 129, 0.35)'
                              : sketchResult.confianza === 'media'
                                ? 'rgba(245, 158, 11, 0.35)'
                                : 'rgba(244, 63, 94, 0.35)',
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Confianza {sketchResult.confianza}
                      </span>
                    </div>

                    {sketchResult.disposicionHojas && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginTop: '8px',
                        }}
                      >
                        {sketchResult.disposicionHojas.split('').map((leaf, i) => (
                          <span
                            key={`${leaf}-${i}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              background:
                                leaf === 'X'
                                  ? 'rgba(14, 165, 233, 0.28)'
                                  : 'rgba(148, 163, 184, 0.22)',
                              border:
                                leaf === 'X'
                                  ? '1px solid rgba(56, 189, 248, 0.7)'
                                  : '1px solid rgba(148, 163, 184, 0.5)',
                              color: '#ffffff',
                            }}
                          >
                            <span>{leaf}</span>
                            <span style={{ fontWeight: 600, fontSize: '10.5px', opacity: 0.9 }}>
                              {leaf === 'X' ? 'Corrediza' : 'Fija'}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {sketchResult.anchoCm && sketchResult.altoCm && (
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                        <DigitalWindowDrawingSvg
                          anchoCm={sketchResult.anchoCm}
                          altoCm={sketchResult.altoCm}
                          unit="cm"
                          hojas={sketchResult.hojasDistribucion}
                          tipo={sketchResult.tipo}
                          selected
                        />
                      </div>
                    )}

                    <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#d1fae5', lineHeight: 1.4 }}>
                      Verifica o ajusta los datos prellenados abajo y pulsa{' '}
                      <strong style={{ color: '#fff' }}>＋ Agregar más medidas</strong> para enviar a cortes o cotización.
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleAccordion>

            {/* ACORDEÓN 2: Nueva Medida (Captura Manual — abierto por defecto) */}
            <CollapsibleAccordion
              id="acc-lev-manual"
              title={form.editId ? '✏️ Editando Medida (Captura Manual)' : '➕ Nueva Medida (Captura Manual)'}
              summary={!accManualOpen ? 'Captura tipo, ancho, alto y acabado' : undefined}
              open={accManualOpen}
              onToggle={() => setAccManualOpen((prev) => !prev)}
              tone="dark"
              className="card !p-0"
            >
              <label htmlFor="lv-tipo">Tipo</label>
              <select
                id="lv-tipo"
                value={form.tipo}
                onChange={(e) => {
                  const nextTipo = e.target.value;
                  const isMosqAbatible = nextTipo === 'Mosquitero abatible';
                  setForm((prev) => ({
                    ...prev,
                    tipo: nextTipo,
                    lineaPerfil: prev.editId
                      ? prev.lineaPerfil
                      : getDefaultLineaPerfilForTipo(nextTipo),
                    colorVidrio: isMosqAbatible
                      ? 'Sin vidrio'
                      : prev.colorVidrio === 'Sin vidrio'
                        ? 'Vidrio claro'
                        : prev.colorVidrio,
                    mosquitero: isMosqAbatible ? 'Mosquitero abatible' : prev.mosquitero,
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
              {(() => {
                const aCmNow = cmFromUnit(form.ancho, form.u);
                const hCmNow = cmFromUnit(form.alto, form.u);
                const aHardOut = aCmNow > 0 && (aCmNow < LEV_MIN_CM || aCmNow > LEV_MAX_CM);
                const hHardOut = hCmNow > 0 && (hCmNow < LEV_MIN_CM || hCmNow > LEV_MAX_CM);
                const activeLinea =
                  form.lineaPerfil === 'Otra' && customLineaText.trim()
                    ? customLineaText.trim()
                    : form.lineaPerfil;
                const lineWarn = evaluateLevantamientoLineLimits(
                  aCmNow,
                  hCmNow,
                  activeLinea,
                  form.tipo
                );
                const anchoWarnStyle: React.CSSProperties | undefined = aHardOut
                  ? { borderColor: 'rgba(248, 113, 113, 0.9)', boxShadow: '0 0 0 1px rgba(248, 113, 113, 0.35)' }
                  : lineWarn.anchoExceeded || lineWarn.anchoBelowMin
                    ? { borderColor: 'rgba(251, 191, 36, 0.85)', boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.28)' }
                    : undefined;
                const altoWarnStyle: React.CSSProperties | undefined = hHardOut
                  ? { borderColor: 'rgba(248, 113, 113, 0.9)', boxShadow: '0 0 0 1px rgba(248, 113, 113, 0.35)' }
                  : lineWarn.altoExceeded || lineWarn.altoBelowMin
                    ? { borderColor: 'rgba(251, 191, 36, 0.85)', boxShadow: '0 0 0 1px rgba(251, 191, 36, 0.28)' }
                    : undefined;

                return (
                  <>
                    <div className="row">
                      <input
                        ref={anchoInputRef}
                        id="lv-an"
                        type="text"
                        inputMode="decimal"
                        aria-invalid={aHardOut || lineWarn.anchoExceeded || lineWarn.anchoBelowMin}
                        aria-describedby={lineWarn.hasWarning && !aHardOut && !hHardOut ? 'lv-line-limit-warning' : undefined}
                        style={anchoWarnStyle}
                        value={form.ancho}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, ancho: e.target.value }));
                          if (localError) setLocalError(null);
                        }}
                        placeholder={form.u === 'm' ? 'Ancho (m)' : 'Ancho (cm)'}
                      />
                      <input
                        ref={altoInputRef}
                        id="lv-al"
                        type="text"
                        inputMode="decimal"
                        aria-invalid={hHardOut || lineWarn.altoExceeded || lineWarn.altoBelowMin}
                        aria-describedby={lineWarn.hasWarning && !aHardOut && !hHardOut ? 'lv-line-limit-warning' : undefined}
                        style={altoWarnStyle}
                        value={form.alto}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, alto: e.target.value }));
                          if (localError) setLocalError(null);
                        }}
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
                    {!aHardOut && !hHardOut && lineWarn.hasWarning && lineWarn.message && (
                      <div
                        id="lv-line-limit-warning"
                        role="status"
                        aria-live="polite"
                        style={{
                          marginTop: '6px',
                          padding: '8px 11px',
                          borderRadius: '10px',
                          background: 'rgba(217, 119, 6, 0.14)',
                          border: '1px solid rgba(251, 191, 36, 0.55)',
                          color: '#fde68a',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          lineHeight: 1.38,
                        }}
                      >
                        ⚠️ Aviso de línea estándar · {lineWarn.message}
                      </div>
                    )}
                  </>
                );
              })()}

              <label htmlFor="lv-hojas">Hojas / Distribución (X corrediza · O fija)</label>
              <input
                id="lv-hojas"
                type="text"
                value={form.hojas}
                onChange={(e) => setForm((prev) => ({ ...prev, hojas: e.target.value.toUpperCase() }))}
                placeholder="Ej. O-X, X-O, O-X-O, X-X"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', marginBottom: '4px' }}>
                {['O-X', 'X-O', 'O-X-O', 'X-X', 'O'].map((opt) => {
                  const active = form.hojas === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      style={{
                        width: 'auto',
                        minWidth: '46px',
                        padding: '5px 11px',
                        fontSize: '12px',
                        fontWeight: 800,
                        minHeight: '30px',
                        borderRadius: '8px',
                        border: active ? '1.5px solid #38bdf8' : '1px solid rgba(148,163,184,0.38)',
                        background: active ? '#1b7a9c' : 'rgba(15,23,42,0.55)',
                        color: active ? '#ffffff' : '#cbd5e1',
                        cursor: 'pointer',
                        flex: '0 0 auto',
                      }}
                      onClick={() => setForm((prev) => ({ ...prev, hojas: opt }))}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const aCm = cmFromUnit(form.ancho, form.u);
                const hCm = cmFromUnit(form.alto, form.u);
                const aOut = aCm > 0 && (aCm < LEV_MIN_CM || aCm > LEV_MAX_CM);
                const hOut = hCm > 0 && (hCm < LEV_MIN_CM || hCm > LEV_MAX_CM);
                if (aOut || hOut) {
                  return (
                    <div
                      id="lv-range-alert"
                      role="alert"
                      style={{
                        marginTop: '8px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: 'rgba(153, 27, 27, 0.25)',
                        border: '1.5px solid rgba(248, 113, 113, 0.75)',
                        color: '#fecaca',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        lineHeight: 1.35,
                      }}
                    >
                      ⚠️ Error de rango: las medidas deben estar entre {LEV_MIN_CM} cm y {LEV_MAX_CM} cm (cálculo bloqueado hasta corregir ancho/alto).
                    </div>
                  );
                }
                return (
                  <div className="pv" id="lv-pv">
                    {previewText}
                  </div>
                );
              })()}

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

              {localError && (
                <div
                  id="lv-missing-alert"
                  role="alert"
                  style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(185, 28, 28, 0.22)',
                    border: '1px solid rgba(248, 113, 113, 0.65)',
                    color: '#fecaca',
                    fontSize: '13px',
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  ⚠️ {localError}
                </div>
              )}

              {(() => {
                const prevAncho = cmFromUnit(form.ancho, form.u);
                const prevAlto = cmFromUnit(form.alto, form.u);
                if (!prevAncho || !prevAlto || prevAncho <= 0 || prevAlto <= 0) return null;
                return (
                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <small style={{ color: '#7dd3fc', fontSize: '11px', fontWeight: 700 }}>
                      Vista previa del plano digitalizado
                    </small>
                    <DigitalWindowDrawingSvg
                      anchoCm={prevAncho}
                      altoCm={prevAlto}
                      unit={form.u}
                      hojas={form.hojas}
                      tipo={form.tipo}
                      selected
                    />
                  </div>
                );
              })()}

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
            </CollapsibleAccordion>

            {/* ACORDEÓN 3: Piezas del Levantamiento con dibujo digitalizado y selección múltiple */}
            {(() => {
              const allCutSelected =
                draft.piezas.length > 0 &&
                draft.piezas.every((pz) => selectedCutIds.includes(pz.id));
              const selectedPiezasForCut = filterSelectedPiezasForCut(draft.piezas, selectedCutIds);

              // Optimización de tramos 6.10 m calculada ÚNICAMENTE con las piezas marcadas (✓)
              const acabadoByPerfil: Partial<Record<PerfilCatalogoId, string>> = {};
              const allPerfiles: CortePerfil[] = [];
              for (const pz of selectedPiezasForCut) {
                const resolved = resolveLineaFromLevantamiento(pz);
                const colorId = resolveColorAluminioFromLevantamiento(pz.colorAluminio);
                const vidrioInfo = resolveVidrioFromLevantamiento(pz.colorVidrio);
                const finish = COLORES_CONFIG[colorId]?.corto || pz.colorAluminio || 'Natural';
                const hojasCount = pz.hojas
                  ? Math.max(1, Math.min(4, pz.hojas.replace(/[^XO]/gi, '').length || 2))
                  : resolved.apertura === 'fija'
                    ? 1
                    : 2;
                const desp = calcularDespiece({
                  linea: resolved.linea,
                  anchoCm: pz.anchoCm,
                  altoCm: pz.altoCm,
                  color: colorId,
                  vidrio: vidrioInfo.vidrio,
                  hojas: hojasCount,
                  apertura: resolved.apertura || 'corrediza',
                  sentidoPuerta: 'izq',
                  puertaIntermedio: false,
                  puertaEconomica: false,
                  invertido: false,
                  cantidad: pz.cant,
                  tolerancias: LINEAS_CONFIG[resolved.linea].toleranciasDefault,
                });
                for (const perf of desp.perfiles) {
                  if (!acabadoByPerfil[perf.perfilId]) {
                    acabadoByPerfil[perf.perfilId] = finish;
                  }
                  allPerfiles.push(perf);
                }
              }
              const levOpt =
                allPerfiles.length > 0
                  ? buildDespieceTramos1D(allPerfiles, 'Levantamiento')
                  : null;
              const totalBarras = levOpt ? levOpt.tramos610Totales : 0;
              const usoPct = levOpt ? Math.round(levOpt.aprovechamientoGlobalPct) : 0;

              return (
                <>
                  <CollapsibleAccordion
                    id="acc-lev-piezas"
                    title={`🪟 Piezas del Levantamiento (${draft.piezas.length} ${draft.piezas.length === 1 ? 'pieza' : 'piezas'})`}
                    summary={
                      draft.piezas.length === 0
                        ? 'Aún no has agregado medidas'
                        : `${selectedPiezasForCut.length} de ${draft.piezas.length} marcadas (✓) para tramos de 6.10 m`
                    }
                    open={accPiezasOpen}
                    onToggle={() => setAccPiezasOpen((prev) => !prev)}
                    tone="dark"
                    className="card !p-0"
                    rightAction={
                      draft.piezas.length > 0 ? (
                        <button
                          type="button"
                          id="btn-lev-select-all-cut"
                          onClick={() =>
                            setSelectedCutIds((prev) => toggleSelectAllPiezas(prev, draft.piezas))
                          }
                          style={{
                            width: 'auto',
                            padding: '5px 10px',
                            minHeight: '30px',
                            borderRadius: '999px',
                            border: allCutSelected
                              ? '1px solid rgba(148, 163, 184, 0.55)'
                              : '1px solid rgba(52, 211, 153, 0.75)',
                            background: allCutSelected
                              ? 'rgba(30, 41, 59, 0.9)'
                              : 'rgba(16, 185, 129, 0.22)',
                            color: allCutSelected ? '#e2e8f0' : '#6ee7b7',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {allCutSelected ? 'Ninguna' : 'Seleccionar todas'}
                        </button>
                      ) : undefined
                    }
                  >
                    {draft.piezas.length === 0 ? (
                      <div className="pv" style={{ color: '#94a3b8', padding: '8px 0' }}>
                        Aún no has agregado medidas. Captura arriba o usa el Escáner IA.
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginBottom: '6px',
                          }}
                        >
                          <small style={{ color: '#93c5fd', fontSize: '11.5px', fontWeight: 600 }}>
                            Marca el círculo ○/✓ de las medidas que deseas incluir en cortes de 6.10 m · Doble toque para editar
                          </small>
                        </div>

                        {draft.piezas.map((p, idx) => {
                          const isCheckedForCut = selectedCutIds.includes(p.id);
                          const isSelected = selectedPieceId === p.id;
                          return (
                            <div
                              className="it"
                              key={p.id}
                              data-piece-id={p.id}
                              data-selected={isSelected ? 'true' : 'false'}
                              data-cut-selected={isCheckedForCut ? 'true' : 'false'}
                              style={{
                                cursor: 'pointer',
                                border: isCheckedForCut
                                  ? '2px solid #10b981'
                                  : isSelected
                                    ? '2px solid #f97316'
                                    : '1px solid #26324d',
                                background: isCheckedForCut
                                  ? 'rgba(16, 185, 129, 0.08)'
                                  : isSelected
                                    ? 'rgba(249, 115, 22, 0.1)'
                                    : undefined,
                                borderRadius: '13px',
                                padding: '10px',
                                marginTop: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                transition: 'border-color 140ms ease, background-color 140ms ease',
                              }}
                              onClick={() => {
                                const now = Date.now();
                                if (lastTapRef.current.id === p.id && now - lastTapRef.current.ts < 360) {
                                  lastTapRef.current = { id: '', ts: 0 };
                                  openPieceEditModal(p);
                                  return;
                                }
                                lastTapRef.current = { id: p.id, ts: now };
                                setSelectedPieceId(p.id);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                openPieceEditModal(p);
                              }}
                            >
                              {/* Fila superior: Círculo de selección múltiple (○ / ✓) + Título + Acciones */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: '10px',
                                  width: '100%',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
                                  <button
                                    type="button"
                                    id={`btn-lev-check-${p.id}`}
                                    role="checkbox"
                                    aria-checked={isCheckedForCut}
                                    aria-label={
                                      isCheckedForCut
                                        ? `Quitar pieza ${idx + 1} (${p.tipo}) de cortes 6.10 m`
                                        : `Seleccionar pieza ${idx + 1} (${p.tipo}) para cortes 6.10 m`
                                    }
                                    title={isCheckedForCut ? 'Incluida en cortes 6.10 m' : 'Toca para incluir en cortes 6.10 m'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCutIds((prev) => togglePiezaSelection(prev, p.id));
                                    }}
                                    style={{
                                      width: '30px',
                                      height: '30px',
                                      minWidth: '30px',
                                      minHeight: '30px',
                                      padding: 0,
                                      borderRadius: '999px',
                                      border: isCheckedForCut
                                        ? '2px solid #34d399'
                                        : '2px solid #64748b',
                                      background: isCheckedForCut
                                        ? '#10b981'
                                        : 'rgba(15, 23, 42, 0.7)',
                                      color: isCheckedForCut ? '#ffffff' : '#94a3b8',
                                      fontSize: '15px',
                                      fontWeight: 900,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      marginTop: '1px',
                                    }}
                                  >
                                    {isCheckedForCut ? '✓' : '○'}
                                  </button>

                                  <div className="tx" style={{ flex: 1, minWidth: 0 }}>
                                    <b>
                                      {idx + 1}. {p.tipo}
                                      {p.hojas && (
                                        <span
                                          style={{
                                            marginLeft: '6px',
                                            fontSize: '10.5px',
                                            padding: '1px 6px',
                                            borderRadius: '6px',
                                            background: 'rgba(14, 165, 233, 0.25)',
                                            border: '1px solid rgba(56, 189, 248, 0.5)',
                                            color: '#bae6fd',
                                            fontWeight: 800,
                                          }}
                                        >
                                          {p.hojas}
                                        </span>
                                      )}
                                      {isCheckedForCut && (
                                        <span
                                          style={{
                                            marginLeft: '6px',
                                            fontSize: '10px',
                                            padding: '1px 6px',
                                            borderRadius: '6px',
                                            background: '#059669',
                                            color: '#fff',
                                            fontWeight: 800,
                                            whiteSpace: 'nowrap',
                                            display: 'inline-block',
                                          }}
                                        >
                                          En corte
                                        </span>
                                      )}
                                    </b>
                                    {p.area && <small>{p.area}</small>}
                                    <div>
                                      {formatMedidaText(p)} · Cant: {p.cant}
                                    </div>
                                  </div>
                                </div>

                                <div className="ac" onClick={(e) => e.stopPropagation()}>
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
                                    onClick={() => openPieceEditModal(p)}
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
                                        if (selectedPieceId === p.id) setSelectedPieceId(null);
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

                              {/* Fila central: Dibujo técnico digitalizado (SVG) + foto opcional + especificaciones */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  flexWrap: 'wrap',
                                  width: '100%',
                                }}
                              >
                                <DigitalWindowDrawingSvg
                                  anchoCm={p.anchoCm}
                                  altoCm={p.altoCm}
                                  unit={form.u}
                                  hojas={p.hojas}
                                  tipo={p.tipo}
                                  selected={isCheckedForCut}
                                  compact
                                />

                                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
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
                                  {p.notas && (
                                    <small style={{ display: 'block', marginTop: '4px', color: '#cbd5e1' }}>
                                      {p.notas}
                                    </small>
                                  )}
                                  {p.foto && (
                                    <button
                                      type="button"
                                      className="gh"
                                      style={{
                                        marginTop: '6px',
                                        minHeight: '30px',
                                        padding: '4px 10px',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewerFoto(p.foto);
                                        pushView('foto');
                                      }}
                                    >
                                      📷 Ver foto adjunta
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                    <div className="tot">{resumenLevantamiento(draft.piezas)}</div>
                  </CollapsibleAccordion>

                  {/* ACORDEÓN 4: Tramos de 6.10 m ya acomodados (colapsado por defecto, calcula SOLO seleccionadas ✓) */}
                  <CollapsibleAccordion
                    id="acc-lev-tramos-610"
                    title={`✂️ Tramos de 6.10 m ya acomodados (${totalBarras} ${totalBarras === 1 ? 'barra' : 'barras'} · ${usoPct}% uso)`}
                    summary={
                      draft.piezas.length === 0
                        ? 'Agrega medidas para calcular barras de 6.10 m'
                        : selectedPiezasForCut.length === 0
                          ? 'Ninguna pieza marcada · Toca el círculo ○ en las piezas que deseas cortar'
                          : `${selectedPiezasForCut.length} de ${draft.piezas.length} pieza(s) seleccionada(s) · Toca para ver cortes`
                    }
                    open={accTramosOpen}
                    onToggle={() => setAccTramosOpen((prev) => !prev)}
                    tone="dark"
                    className="card !p-0"
                  >
                    {selectedPiezasForCut.length === 0 || !levOpt || levOpt.grupos.length === 0 ? (
                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '11px',
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px dashed rgba(148, 163, 184, 0.45)',
                          color: '#cbd5e1',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          lineHeight: 1.45,
                        }}
                      >
                        Marca el círculo <strong>○</strong> de una o más piezas en{' '}
                        <strong>🪟 Piezas del Levantamiento</strong> para calcular al instante los cortes en barras de 6.10 m.
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          background: '#f8fafc',
                          color: '#0f172a',
                        }}
                      >
                        <Tramos610AcomodadosSection
                          id="lev-tramos-610-acomodados"
                          optimizacion={levOpt}
                          acabadoByPerfil={acabadoByPerfil}
                          defaultAcabado={selectedPiezasForCut[0]?.colorAluminio || 'Natural'}
                          compact
                        />
                      </div>
                    )}
                  </CollapsibleAccordion>
                </>
              );
            })()}

            {/* Semáforo de Margen compacto — Exclusivo PRO / Administrador (oculto en Versión Gratuita) */}
            <div style={{ marginBottom: '12px' }}>
              <MarginTrafficLightCard
                id="semaforo-margen-levantamiento"
                proActive={proActive}
                isAdmin={isAdmin}
                variant="compact"
              />
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

        {isOpen && editModalPiece && (
          <div
            id="modal-lev-edit-piece"
            role="dialog"
            aria-modal="true"
            aria-label="Editar pieza del levantamiento"
            onClick={() => setEditModalPiece(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10020,
              background: 'rgba(2, 6, 23, 0.82)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflowY: 'auto',
            }}
          >
            <div
              className="card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <b style={{ fontSize: '16px', color: '#f8fafc' }}>✏️ Editar pieza</b>
                <button
                  type="button"
                  className="gh"
                  style={{ flex: '0 0 auto', padding: '6px 10px' }}
                  onClick={() => setEditModalPiece(null)}
                >
                  ✕
                </button>
              </div>

              {editModalError && (
                <div
                  role="alert"
                  style={{
                    marginBottom: '10px',
                    padding: '9px 11px',
                    borderRadius: '10px',
                    background: 'rgba(185, 28, 28, 0.25)',
                    border: '1px solid rgba(248, 113, 113, 0.65)',
                    color: '#fecaca',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  ⚠️ {editModalError}
                </div>
              )}

              <label htmlFor="lv-edit-tipo">Tipo de pieza</label>
              <select
                id="lv-edit-tipo"
                value={editModalPiece.tipo}
                onChange={(e) => {
                  const nextTipo = e.target.value;
                  setEditModalPiece((prev) =>
                    prev
                      ? {
                          ...prev,
                          tipo: nextTipo,
                          colorVidrio: nextTipo === 'Mosquitero abatible' ? 'Sin vidrio' : prev.colorVidrio,
                          mosquitero: nextTipo === 'Mosquitero abatible' ? 'Mosquitero abatible' : prev.mosquitero,
                        }
                      : prev
                  );
                }}
              >
                {LEV_TIPOS.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>

              <label htmlFor="lv-edit-area">Ubicación / área</label>
              <input
                id="lv-edit-area"
                type="text"
                value={editModalPiece.area}
                onChange={(e) =>
                  setEditModalPiece((prev) => (prev ? { ...prev, area: e.target.value } : prev))
                }
                placeholder="Ej. Sala, Recámara"
              />

              <label>Medidas (cm) y cantidad</label>
              <div className="row">
                <input
                  id="lv-edit-ancho"
                  type="text"
                  inputMode="decimal"
                  value={editModalPiece.ancho}
                  onChange={(e) =>
                    setEditModalPiece((prev) => (prev ? { ...prev, ancho: e.target.value } : prev))
                  }
                  placeholder="Ancho (cm)"
                />
                <input
                  id="lv-edit-alto"
                  type="text"
                  inputMode="decimal"
                  value={editModalPiece.alto}
                  onChange={(e) =>
                    setEditModalPiece((prev) => (prev ? { ...prev, alto: e.target.value } : prev))
                  }
                  placeholder="Alto (cm)"
                />
                <input
                  id="lv-edit-cant"
                  type="number"
                  min={1}
                  max={999}
                  style={{ maxWidth: '82px' }}
                  value={editModalPiece.cant}
                  onChange={(e) =>
                    setEditModalPiece((prev) =>
                      prev ? { ...prev, cant: Math.max(1, Number(e.target.value) || 1) } : prev
                    )
                  }
                />
              </div>

              <label htmlFor="lv-edit-perfil">Línea / Perfil</label>
              <select
                id="lv-edit-perfil"
                value={editModalPiece.lineaPerfil}
                onChange={(e) =>
                  setEditModalPiece((prev) => (prev ? { ...prev, lineaPerfil: e.target.value } : prev))
                }
              >
                {LEV_LINEA_PERFIL_OPTS.filter((o) => o.id !== 'otra').map((opt) => (
                  <option key={opt.id} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
                {!LEV_LINEA_PERFIL_OPTS.some((o) => o.label === editModalPiece.lineaPerfil) && (
                  <option value={editModalPiece.lineaPerfil}>{editModalPiece.lineaPerfil}</option>
                )}
              </select>

              <div className="row">
                <div style={{ flex: 1 }}>
                  <label htmlFor="lv-edit-color">Color aluminio</label>
                  <select
                    id="lv-edit-color"
                    value={editModalPiece.colorAluminio}
                    onChange={(e) =>
                      setEditModalPiece((prev) =>
                        prev ? { ...prev, colorAluminio: e.target.value } : prev
                      )
                    }
                  >
                    {LEV_COLOR_ALUMINIO_OPTS.map((opt) => (
                      <option key={opt.id} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="lv-edit-vidrio">Tipo de vidrio</label>
                  <select
                    id="lv-edit-vidrio"
                    value={editModalPiece.colorVidrio}
                    onChange={(e) =>
                      setEditModalPiece((prev) =>
                        prev ? { ...prev, colorVidrio: e.target.value } : prev
                      )
                    }
                  >
                    {LEV_COLOR_VIDRIO_OPTS.map((opt) => (
                      <option key={opt.id} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label htmlFor="lv-edit-mosq">Mosquitero</label>
              <select
                id="lv-edit-mosq"
                value={editModalPiece.mosquitero}
                onChange={(e) =>
                  setEditModalPiece((prev) => (prev ? { ...prev, mosquitero: e.target.value } : prev))
                }
              >
                {LEV_MOSQUITERO_OPTS.map((opt) => (
                  <option key={opt.id} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <label htmlFor="lv-edit-notas">Notas</label>
              <input
                id="lv-edit-notas"
                type="text"
                value={editModalPiece.notas}
                onChange={(e) =>
                  setEditModalPiece((prev) => (prev ? { ...prev, notas: e.target.value } : prev))
                }
                placeholder="Detalle de instalación..."
              />

              <div className="row" style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  id="lv-edit-save-btn"
                  className="or"
                  onClick={handleSavePieceEditModal}
                >
                  💾 Guardar cambios
                </button>
                <button
                  type="button"
                  className="gh"
                  onClick={() => setEditModalPiece(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
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
