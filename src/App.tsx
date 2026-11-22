import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  calcularCotizacion,
  calcularDespiece,
  CategoriaTrabajo,
  CloudDeviceRecord,
  computeUsageStats30d,
  descontarInventarioPorPerfilColor,
  getDefaultRellenoFromVidrio,
  getRellenoLabel,
  getRellenoPrecioM2,
  getRellenoPriceKey,
  isEligibleForCloudBackup,
  isFeatureProRequired,
  isProActive,
  isUnassignedAutoTrialDevice,
  LINEAS_CONFIG,
  LineaId,
  normalizeDeviceIdInput,
  normalizeLineaId,
  parseNotaACotizacion,
  parseReferralFromSearch,
  PartidaObra,
  PerfilCatalogoId,
  round2,
  TrabajoParams,
  UsageStats30d,
  validatePiezaDimensiones,
} from './utils/alumineroLogic';
import {
  activateKeyInCloud,
  checkCloudAccountSession,
  CloudSyncSnapshot,
  deleteAdminKeyInCloud,
  detectDeviceLabel,
  fetchCloudDevicesState,
  loginCloudAccount,
  logoutCloudAccount,
  registerCloudAccount,
  subscribeCloudDevices,
  syncDeviceToCloud,
  updateDeviceLicenseInCloud,
  uploadCloudAccountBackup,
  verifyDeviceStatusInCloud,
} from './utils/cloudSync';
import {
  addReferralHistoryRecord,
  AdminKeyRecord,
  AlumineroBackupPayload,
  buildAdminKeySignature,
  captureReferredByFromSearch,
  clearLegacyAdminKeys,
  clearTrialStart,
  CloudAccountBackupPayload,
  CloudAccountSession,
  compressImageToDataUrl,
  ContratoClienteInfo,
  FormulaPersonalizada,
  getOrCreateDeviceId,
  getPerfilFotoUrl,
  HistorialItem,
  HojaState,
  HojaVidrioItem,
  LicenciaState,
  loadAdminKeys,
  loadAccessBlocked,
  loadCloudAccountSession,
  loadContratoCliente,
  loadCotizacionesGuardadas,
  loadCotizacionReminders,
  loadDeletedAdminKeySigs,
  loadFormulas,
  loadHistorial,
  loadHoja,
  loadHojasVidrio,
  loadInventario,
  loadInventarioHerrajes,
  loadLicencia,
  loadNotas,
  loadObrasAprobadas,
  loadPerfilFotos,
  loadReferralHistory,
  loadRevokedDevicesMap,
  loadSavedColleagueReferral,
  loadSobrantes,
  loadSugerenciasWhatsapp,
  loadTaller,
  loadTrabajosAntesDespues,
  loadTrialRevoked,
  NotaObra,
  ObraAprobadaApartado,
  openExternalLinkSafe,
  PartidaObraExtended,
  PerfilFotosMap,
  ReferralHistoryRecord,
  sanitizeWhatsappNumber,
  saveAdminKeys,
  saveAccessBlocked,
  saveCloudAccountSession,
  saveColleagueReferral,
  saveContratoCliente,
  saveCotizacionReminders,
  saveDeletedAdminKeySigs,
  SavedColleagueReferral,
  AppTheme,
  saveFormulas,
  saveHistorial,
  saveHoja,
  saveHojasVidrio,
  saveInventario,
  saveInventarioHerrajes,
  saveLicencia,
  saveNotas,
  saveObrasAprobadas,
  savePerfilFotos,
  saveReferralHistory,
  saveRevokedDevicesMap,
  saveSobrantes,
  saveSugerenciasWhatsapp,
  saveTaller,
  saveTheme,
  saveTrabajosAntesDespues,
  saveTrialRevoked,
  loadTheme,
  SobranteItem,
  TallerConfig,
  TrabajoAntesDespuesItem,
  upsertCliente,
} from './utils/storageHelpers';
import { consumeTopHistoryOverlay } from './utils/historyOverlayStack';
import { isRunningInIframe } from './utils/iframeEnv';
import {
  computeReminderDueAt,
  CotizacionReminder,
  CotizacionReminderStatus,
  createCotizacionReminder,
  dispatchQuoteReminderNotification,
  getDueCotizacionReminders,
  getNotificationCapability,
  getReadyServiceWorkerRegistration,
  markReminderNotified,
  partitionCotizacionReminders,
  requestPushNotificationPermission,
  snoozeCotizacionReminder,
  subscribeBrowserPushOptional,
  syncRemindersToServer,
  updateCotizacionReminderStatus,
} from './utils/pushReminders';
import { RemindersModal } from './components/CotizacionRemindersPanel';
import { esMaterialDireccional, PiezaVidrioInput } from './utils/glassOptimizer2D';
import { useOnlineStatus, usePWAInstall } from './utils/usePWAInstall';
import { ScreenId, SideDrawer, TopBar } from './components/TopBarAndDrawer';
import { MainMenuView } from './components/MainMenuView';
import { TrabajoView } from './components/TrabajoView';
import { HojaCotizacionView } from './components/HojaCotizacionView';
import { TallerView } from './components/TallerView';
import {
  AdminAuthModal,
  AdminModal,
  CloudBackupModal,
  ColleagueReferralWelcomeModal,
  FormulaModal,
  PerfilModal,
  PRO_PAYMENT_CONFIG,
  ProModal,
  PwaInstallGuideModal,
  RecomendarModal,
  SugerenciasModal,
  TutorialModal,
} from './components/Modals';
import { FloatingAssistant } from './components/FloatingAssistant';
import { FloatingInstallButton } from './components/FloatingInstallButton';
import { CalculadoraModal } from './components/CalculadoraModal';
import { LevantamientoRapido } from './components/LevantamientoRapido';
import {
  AlumBridgePayload,
  LevantamientoDraft,
  mergePiezaSpecsAndNotes,
  normalizeLevantamientoDraft,
  overwriteHojaProyectoInStorage,
  resolveColorAluminioFromLevantamiento,
  resolveLineaFromLevantamiento,
  resolveVidrioFromLevantamiento,
} from './utils/levantamientoLogic';

import { ErrorBoundary } from './components/ErrorBoundary';
import { InventarioView } from './components/InventarioView';
import { ModulacionCortesView } from './components/ModulacionCortesView';
import { VidrioOptimizerView } from './components/VidrioOptimizerView';
import { AntesDespuesModal } from './components/AntesDespuesModal';
import { CatalogoView, NotasView } from './components/NotasAndCatalogoViews';
import { AvisoPrivacidadView, TerminosCondicionesView } from './components/LegalViews';
import { HistorialCotizacionesView } from './components/HistorialCotizacionesView';

function createInitialParams(linea: LineaId = '3'): TrabajoParams {
  const cfg = LINEAS_CONFIG[linea];
  return {
    linea,
    anchoCm: cfg.categoria === 'puertas' ? 90 : 120,
    altoCm: cfg.categoria === 'puertas' ? 210 : cfg.esCancelBano ? 190 : 100,
    color: 'natural',
    vidrio: 'claro6',
    relleno: getDefaultRellenoFromVidrio('claro6'),
    hojas: 2,
    apertura: linea === 'mosq-fijo' ? 'fija' : 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: true,
    puertaEconomica: false,
    cancelEstilo: 'semilujo',
    invertido: false,
    cantidad: 1,
    tolerancias: { ...cfg.toleranciasDefault },
  };
}

export default function App() {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [trialRevoked, setTrialRevoked] = useState<boolean>(() => loadTrialRevoked());
  const [accessBlocked, setAccessBlocked] = useState<boolean>(() => loadAccessBlocked());
  const [revokedDevicesMap, setRevokedDevicesMap] = useState<Record<string, number>>(() =>
    loadRevokedDevicesMap()
  );
  const [licencia, setLicencia] = useState<LicenciaState | null>(() => {
    clearTrialStart();
    const loaded = loadLicencia();
    if (!loaded || !loaded.active) return null;
    const hasAuthorization = Boolean(loaded.activatedKey?.trim() || loaded.adminAssigned);
    if (!hasAuthorization || !isProActive(loaded)) {
      saveLicencia(null);
      return null;
    }
    return loaded;
  });
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  const hasPaidOrManualPro = useMemo(() => isProActive(licencia, nowTs), [licencia, nowTs]);
  const trialExpiresAt = useMemo<number | null>(
    () => (hasPaidOrManualPro && licencia?.planCode === 'G' ? licencia.expiresAt : null),
    [hasPaidOrManualPro, licencia]
  );
  const isTrialActive = useMemo(
    () => Boolean(hasPaidOrManualPro && licencia?.planCode === 'G'),
    [hasPaidOrManualPro, licencia]
  );
  const proActive = hasPaidOrManualPro;

  useEffect(() => {
    const nextExpiry = hasPaidOrManualPro ? (licencia?.expiresAt ?? null) : null;
    if (nextExpiry === null) return;
    const delay = nextExpiry - Date.now();
    if (delay <= 0) {
      setNowTs(Date.now());
      return;
    }
    // JavaScript setTimeout máximo ~24.8 días; acotamos para evitar desbordamiento de 32 bits
    const boundedDelay = Math.min(delay + 50, 2_147_483_000);
    const timer = window.setTimeout(() => {
      setNowTs(Date.now());
    }, boundedDelay);
    return () => window.clearTimeout(timer);
  }, [hasPaidOrManualPro, licencia, nowTs]);

  type GlobalModalId =
    | 'drawer'
    | 'pro'
    | 'cloudBackup'
    | 'recomendar'
    | 'sugerencias'
    | 'tutorial'
    | 'calculadora'
    | 'antesDespues'
    | 'adminAuth'
    | 'adminModal'
    | 'installGuide'
    | 'formula'
    | 'perfil'
    | 'referralWelcome'
    | 'reminders'
    | 'levBatchConfirm';

  type SubModalId = 'contrato' | 'zoomPerfil' | null;

  interface NavFrame {
    depth: number;
    view: ScreenId;
    workTab: 'descuentos' | 'cotizacion';
    invTab: 'perfiles' | 'vidrios' | 'herrajes';
    catalogoTab: 'perfiles' | 'herrajes';
    modStep: 1 | 2 | 3 | 4 | 5;
    modPaso5Tab: 'cortes' | 'tramos';
    modMosqOpen: boolean;
    globalModals: GlobalModalId[];
    perfilModalId: PerfilCatalogoId | null;
    subModal: SubModalId;
  }

  const BASE_FRAME: NavFrame = {
    depth: 0,
    view: 'menu',
    workTab: 'descuentos',
    invTab: 'perfiles',
    catalogoTab: 'perfiles',
    modStep: 1,
    modPaso5Tab: 'cortes',
    modMosqOpen: false,
    globalModals: [],
    perfilModalId: null,
    subModal: null,
  };

  // Rastreo persistente de referidos (?ref=[ID_DEL_USUARIO]) en localStorage bajo clave 'referred_by_id'
  // (ignora auto-referidos si coincide con el deviceId de este mismo equipo)
  const [referredById] = useState<string | null>(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    return captureReferredByFromSearch(search, deviceId);
  });
  const [referralHistory, setReferralHistory] = useState<ReferralHistoryRecord[]>(() =>
    loadReferralHistory()
  );

  // Invitación estilo Spotify (?ref=[ID_O_Nombre]&promo=[NumeroPromo])
  // Se inicializa antes de globalModals y navFramesRef para garantizar que la pantalla verde
  // de invitación aparezca SIEMPRE desde el primer frame antes de cualquier aviso PWA.
  const [savedColleagueReferral] = useState<SavedColleagueReferral | null>(() => {
    const parsedFromUrl =
      typeof window !== 'undefined' ? parseReferralFromSearch(window.location.search) : null;
    if (
      parsedFromUrl &&
      parsedFromUrl.refName.trim().toUpperCase() !== deviceId.trim().toUpperCase()
    ) {
      const nextRef: SavedColleagueReferral = {
        refName: parsedFromUrl.refName,
        promoNumber: parsedFromUrl.promoNumber,
        savedAt: Date.now(),
      };
      saveColleagueReferral(nextRef);
      return nextRef;
    }
    return loadSavedColleagueReferral();
  });
  const [initialReferralActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const parsed = parseReferralFromSearch(window.location.search);
    return Boolean(
      parsed && parsed.refName.trim().toUpperCase() !== deviceId.trim().toUpperCase()
    );
  });

  const [currentView, setCurrentView] = useState<ScreenId>('menu');
  const [workTab, setWorkTab] = useState<'descuentos' | 'cotizacion'>('descuentos');
  const [invTab, setInvTab] = useState<'perfiles' | 'vidrios' | 'herrajes'>('perfiles');
  const [catalogoTab, setCatalogoTab] = useState<'perfiles' | 'herrajes'>('perfiles');
  const [modStep, setModStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [modPaso5Tab, setModPaso5Tab] = useState<'cortes' | 'tramos'>('cortes');
  const [modMosqOpen, setModMosqOpen] = useState<boolean>(false);
  const [globalModals, setGlobalModals] = useState<GlobalModalId[]>(() =>
    initialReferralActive && !proActive && Boolean(savedColleagueReferral)
      ? ['referralWelcome']
      : []
  );
  const [perfilModalId, setPerfilModalId] = useState<PerfilCatalogoId | null>(null);
  const [navTransitionDir, setNavTransitionDir] = useState<'none' | 'back' | 'forward'>('none');

  const navFramesRef = useRef<NavFrame[]>(
    initialReferralActive && !proActive && Boolean(savedColleagueReferral)
      ? [BASE_FRAME, { ...BASE_FRAME, depth: 1, globalModals: ['referralWelcome'] }]
      : [BASE_FRAME]
  );
  const pendingInternalBackSyncRef = useRef<number>(0);
  const closeSubModalRef = useRef<(() => void) | null>(null);
  const historyInitializedRef = useRef<boolean>(false);

  const currentViewRef = useRef<ScreenId>(currentView);
  currentViewRef.current = currentView;

  const registerCloseSubModal = useCallback((fn: (() => void) | null) => {
    closeSubModalRef.current = fn;
  }, []);

  const [categoria, setCategoria] = useState<CategoriaTrabajo>('ventanas');
  const [params, setParams] = useState<TrabajoParams>(() => createInitialParams('3'));

  const [taller, setTaller] = useState<TallerConfig>(() => loadTaller());
  const [hoja, setHoja] = useState<HojaState>(() => loadHoja());
  const [contratoCliente, setContratoCliente] = useState<ContratoClienteInfo>(() =>
    loadContratoCliente()
  );
  const [inventario, setInventario] = useState<Record<string, number>>(() => loadInventario());
  const [inventarioHerrajes, setInventarioHerrajes] = useState<Record<string, number>>(() =>
    loadInventarioHerrajes()
  );
  const [sobrantes, setSobrantes] = useState<SobranteItem[]>(() => loadSobrantes());
  const [hojasVidrio, setHojasVidrio] = useState<HojaVidrioItem[]>(() => loadHojasVidrio());
  const [vidrioPiezasDraft, setVidrioPiezasDraft] = useState<PiezaVidrioInput[]>([]);
  const [obrasAprobadas, setObrasAprobadas] = useState<ObraAprobadaApartado[]>(() =>
    loadObrasAprobadas()
  );
  const [notas, setNotas] = useState<NotaObra[]>(() => loadNotas());
  const [historial, setHistorial] = useState<HistorialItem[]>(() => loadHistorial());
  const [formulas, setFormulas] = useState<FormulaPersonalizada[]>(() => loadFormulas());
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('std');
  const [perfilFotos, setPerfilFotos] = useState<PerfilFotosMap>(() => loadPerfilFotos());
  const [adminKeys, setAdminKeys] = useState<AdminKeyRecord[]>(() => loadAdminKeys());

  // Cotización controls in TrabajoView
  const [modoPrecio, setModoPrecio] = useState<'m2' | 'base'>('m2');
  const [precioInput, setPrecioInput] = useState<number>(
    () => taller.tarifasBase['3'] ?? LINEAS_CONFIG['3'].tarifaBaseDefault
  );
  const [cobrarMinM2, setCobrarMinM2] = useState(false);
  const [incluirIva, setIncluirIva] = useState(false);
  const [areaText, setAreaText] = useState('Sala');
  const [etiquetaPieza, setEtiquetaPieza] = useState('');
  const [extraPct, setExtraPct] = useState(0);
  const [referencia, setReferencia] = useState('');
  const [editingPartidaId, setEditingPartidaId] = useState<string | null>(null);

  // Modals & UI (controlados desde la pila unificada NavFrame + popstate)
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());
  const pwa = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [installFabDismissed, setInstallFabDismissed] = useState(false);
  const [trabajosAntesDespues, setTrabajosAntesDespues] = useState<TrabajoAntesDespuesItem[]>(() =>
    loadTrabajosAntesDespues()
  );
  const [sugerenciasWhatsapp, setSugerenciasWhatsapp] = useState<string>(() =>
    loadSugerenciasWhatsapp()
  );
  const [cloudAccountSession, setCloudAccountSession] = useState<CloudAccountSession | null>(() =>
    loadCloudAccountSession()
  );
  const [cloudAccountSyncing, setCloudAccountSyncing] = useState(false);
  const [cotizacionReminders, setCotizacionReminders] = useState<CotizacionReminder[]>(() =>
    loadCotizacionReminders()
  );
  const [highlightedReminderId, setHighlightedReminderId] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationCapability().permission
  );
  const [cotizacionesCount, setCotizacionesCount] = useState<number>(() =>
    loadCotizacionesGuardadas().length
  );
  const [pendingLevBatch, setPendingLevBatch] = useState<{
    draft: LevantamientoDraft;
    partidas: PartidaObraExtended[];
    skippedProCount: number;
  } | null>(null);

  const drawerOpen = globalModals.includes('drawer');
  const proModalOpen = globalModals.includes('pro');
  const cloudBackupOpen = globalModals.includes('cloudBackup');
  const recomendarOpen = globalModals.includes('recomendar');
  const sugerenciasOpen = globalModals.includes('sugerencias');
  const tutorialOpen = globalModals.includes('tutorial');
  const calculadoraOpen = globalModals.includes('calculadora');
  const antesDespuesOpen = globalModals.includes('antesDespues');
  const adminAuthOpen = globalModals.includes('adminAuth');
  const adminModalOpen = globalModals.includes('adminModal');
  const installGuideOpen = globalModals.includes('installGuide');
  const formulaModalOpen = globalModals.includes('formula');
  const referralWelcomeOpen = globalModals.includes('referralWelcome');
  const remindersModalOpen = globalModals.includes('reminders');
  const levBatchConfirmOpen = globalModals.includes('levBatchConfirm');

  const isReferralWelcomeShowing =
    referralWelcomeOpen && !proActive && Boolean(savedColleagueReferral);

  const handleClaimColleaguePromo = () => {
    if (!savedColleagueReferral) return;
    const msg = `Hola Administrador, solicito mi PIN de promoción colega de 3 días para Aluminero Pro. Mi ID de equipo es: ${deviceId} (Invitación de ${savedColleagueReferral.refName} · Promo #${savedColleagueReferral.promoNumber}).`;
    const url = `https://wa.me/527351631532?text=${encodeURIComponent(msg)}`;
    openExternalLinkSafe(url);
    showToast('Abriendo WhatsApp con el Administrador para solicitar tu PIN...', true);
  };

  const [toast, setToast] = useState<{ msg: string; topSuccess: boolean } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const logoTapsRef = useRef<{ count: number; lastTs: number }>({ count: 0, lastTs: 0 });
  const logoTapTimerRef = useRef<number | null>(null);
  const licenciaRef = useRef<LicenciaState | null>(licencia);
  licenciaRef.current = licencia;
  const trialRevokedRef = useRef<boolean>(trialRevoked);
  trialRevokedRef.current = trialRevoked;
  const accessBlockedRef = useRef<boolean>(accessBlocked);
  accessBlockedRef.current = accessBlocked;
  const setAccessBlockedSync = (blocked: boolean) => {
    accessBlockedRef.current = blocked;
    saveAccessBlocked(blocked);
    setAccessBlocked(blocked);
  };
  const isTrialActiveRef = useRef<boolean>(isTrialActive);
  isTrialActiveRef.current = isTrialActive;
  const trialExpiresAtRef = useRef<number | null>(trialExpiresAt);
  trialExpiresAtRef.current = trialExpiresAt;
  const cloudAccountSessionRef = useRef<CloudAccountSession | null>(cloudAccountSession);
  cloudAccountSessionRef.current = cloudAccountSession;
  const skipNextAutoBackupRef = useRef<boolean>(false);
  const deletedAdminKeySigsRef = useRef<Set<string>>(new Set(loadDeletedAdminKeySigs()));
  const revokedKeysRef = useRef<Set<string>>(new Set());

  const isCloudBackupEligible = useMemo(
    () => isEligibleForCloudBackup(licencia, isTrialActive, nowTs),
    [licencia, isTrialActive, nowTs]
  );

  const [cloudDevices, setCloudDevices] = useState<CloudDeviceRecord[]>([]);
  const [revokedKeys, setRevokedKeys] = useState<string[]>([]);
  const [cloudStats, setCloudStats] = useState<UsageStats30d>(() => computeUsageStats30d([]));
  const [cloudConnected, setCloudConnected] = useState(false);
  const [cloudRefreshing, setCloudRefreshing] = useState(false);
  const [cloudLastSyncAt, setCloudLastSyncAt] = useState<number | null>(null);

  const showToast = useCallback((msg: string, topSuccess = false) => {
    setToast({ msg, topSuccess });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const handleRemoteSessionClosed = () => {
    const hadSession = Boolean(cloudAccountSessionRef.current);
    if (cloudAccountSessionRef.current) {
      saveCloudAccountSession(null);
      setCloudAccountSession(null);
    }
    if (licenciaRef.current?.active) {
      saveLicencia(null);
      setLicencia(null);
    }
    if (hadSession) {
      showToast('Sesión cerrada automáticamente porque abriste tu cuenta en otro celular.');
    }
  };

  const buildCurrentCloudBackup = (): CloudAccountBackupPayload => ({
    licencia: licenciaRef.current,
    hoja,
    historial,
    contratoCliente,
    inventario,
    inventarioHerrajes,
    sobrantes,
    hojasVidrio,
    obrasAprobadas,
    notas,
    formulas,
    updatedAt: Date.now(),
  });

  const revokeLocalProAccess = (opts?: { showMessage?: boolean; markTrialRevoked?: boolean; customMsg?: string }) => {
    clearTrialStart();
    const hadProOrTrial = Boolean(licenciaRef.current?.active);
    if (licenciaRef.current) {
      licenciaRef.current = null;
      saveLicencia(null);
      setLicencia(null);
    }
    if (cloudAccountSessionRef.current) {
      cloudAccountSessionRef.current = null;
      saveCloudAccountSession(null);
      setCloudAccountSession(null);
    }
    if (opts?.markTrialRevoked !== false && !trialRevokedRef.current) {
      trialRevokedRef.current = true;
      isTrialActiveRef.current = false;
      saveTrialRevoked(true);
      setTrialRevoked(true);
    }
    if (opts?.showMessage && hadProOrTrial) {
      showToast(opts.customMsg || 'Tu promoción o licencia fue revocada. Regresaste a la Versión Gratuita.');
    }
  };

  const applyCloudSnapshot = (snap: CloudSyncSnapshot | null) => {
    if (!snap) return;
    setCloudDevices(snap.devices || []);
    setCloudStats(snap.stats || computeUsageStats30d(snap.devices || []));
    setCloudLastSyncAt(snap.serverTime || Date.now());

    if (Array.isArray(snap.revokedKeys)) {
      const normalizedKeys = snap.revokedKeys.map((k) => k.trim().toUpperCase()).filter(Boolean);
      revokedKeysRef.current = new Set(normalizedKeys);
      setRevokedKeys(normalizedKeys);
    }

    if (Array.isArray(snap.adminKeys)) {
      const deletedSigs = deletedAdminKeySigsRef.current;
      const nowMs = Date.now();
      setAdminKeys((prev) => {
        const prevBySig = new Map(prev.map((p) => [buildAdminKeySignature(p), p]));
        const bySig = new Map<string, AdminKeyRecord>();
        for (const k of snap.adminKeys) {
          const sig = buildAdminKeySignature(k);
          if (!deletedSigs.has(sig)) {
            const localRec = prevBySig.get(sig);
            const mergedRevoked = Boolean(
              k.revoked ||
              revokedKeysRef.current.has(k.key.trim().toUpperCase()) ||
              (localRec?.revoked && (localRec.revokedAt ?? 0) >= k.createdAt)
            );
            bySig.set(sig, {
              ...k,
              revoked: mergedRevoked,
              revokedAt: k.revokedAt ?? localRec?.revokedAt ?? null,
            });
          }
        }
        for (const k of prev) {
          const sig = buildAdminKeySignature(k);
          if (!deletedSigs.has(sig) && !bySig.has(sig) && nowMs - k.createdAt < 10_000) {
            bySig.set(sig, k);
          }
        }
        const next = Array.from(bySig.values())
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 80);
        saveAdminKeys(next);
        return next;
      });
    }

    const localLicBefore = licenciaRef.current;
    const localKeyUpper = (localLicBefore?.activatedKey || '').trim().toUpperCase();
    if (localKeyUpper && revokedKeysRef.current.has(localKeyUpper)) {
      revokeLocalProAccess({ showMessage: true, markTrialRevoked: true });
      return;
    }

    const normSelfId = deviceId.trim().toUpperCase();
    const myCloudRec = (snap.devices || []).find((d) => d.deviceId.trim().toUpperCase() === normSelfId);
    if (myCloudRec) {
      const localLic = licenciaRef.current;
      const now = Date.now();
      const isSessionMoved = myCloudRec.planCode === 'SESSION_MOVED';
      const isCloudBlocked = Boolean(myCloudRec.blocked || myCloudRec.planCode === 'BLOCKED');
      const isCloudRevoked = Boolean(myCloudRec.revoked || myCloudRec.planCode === 'REVOKED');
      const isPlainLocalTrial = isUnassignedAutoTrialDevice(myCloudRec);
      const hasCloudAssignment = Boolean(
        myCloudRec.adminAssigned || String(myCloudRec.lastKey || '').trim()
      );
      const cloudProValid =
        !isCloudBlocked &&
        !isSessionMoved &&
        !isCloudRevoked &&
        !isPlainLocalTrial &&
        hasCloudAssignment &&
        myCloudRec.planCode !== 'FREE' &&
        myCloudRec.proActive &&
        (myCloudRec.expiresAt === null || myCloudRec.expiresAt > now);

      if (isCloudBlocked) {
        setAccessBlockedSync(true);
        revokeLocalProAccess({ showMessage: false, markTrialRevoked: true });
      } else {
        if (accessBlockedRef.current) setAccessBlockedSync(false);
        if (isSessionMoved) {
          if (cloudAccountSessionRef.current || localLic?.active) {
            handleRemoteSessionClosed();
          }
        } else if (isCloudRevoked) {
          revokeLocalProAccess({ showMessage: true, markTrialRevoked: true });
        } else if (cloudProValid) {
          const needsSync =
            !localLic?.active ||
            localLic.planCode !== myCloudRec.planCode ||
            localLic.expiresAt !== myCloudRec.expiresAt ||
            (Boolean(myCloudRec.lastKey) && localLic.activatedKey !== myCloudRec.lastKey);
          if (needsSync) {
            const syncedLic: LicenciaState = {
              active: true,
              planCode: myCloudRec.planCode,
              planLabel: myCloudRec.planLabel,
              expiresAt: myCloudRec.expiresAt,
              activatedAt: myCloudRec.updatedAt || now,
              ...(myCloudRec.lastKey ? { activatedKey: myCloudRec.lastKey } : {}),
              ...(myCloudRec.adminAssigned ? { adminAssigned: true } : {}),
            };
            trialRevokedRef.current = false;
            licenciaRef.current = syncedLic;
            saveTrialRevoked(false);
            setTrialRevoked(false);
            saveLicencia(syncedLic);
            setLicencia(syncedLic);
          }
        } else if (!cloudProValid && localLic?.active) {
          revokeLocalProAccess({
            showMessage: true,
            markTrialRevoked: false,
            customMsg: 'Tu licencia PRO no está activa en la nube. Regresaste a la Versión Gratuita.',
          });
        }
      }
    }
  };

  const verifyAndSyncClientStatus = async () => {
    const res = await verifyDeviceStatusInCloud({
      deviceId,
      activatedKey: licenciaRef.current?.activatedKey,
    });
    if (!res.ok || res.offline) return;
    clearTrialStart();

    if (Array.isArray(res.revokedKeys)) {
      const normalizedKeys = res.revokedKeys.map((k) => k.trim().toUpperCase()).filter(Boolean);
      revokedKeysRef.current = new Set(normalizedKeys);
      setRevokedKeys(normalizedKeys);
    }

    if (res.blocked) {
      setAccessBlockedSync(true);
      revokeLocalProAccess({ showMessage: false, markTrialRevoked: true });
    } else {
      if (accessBlockedRef.current) setAccessBlockedSync(false);
      if (res.sessionMoved) {
        handleRemoteSessionClosed();
      } else if (res.revoked || res.keyRevoked) {
        revokeLocalProAccess({ showMessage: true, markTrialRevoked: true });
      } else if (res.existsInCloud === false || res.hasValidAssignment === false) {
        if (licenciaRef.current?.active) {
          revokeLocalProAccess({
            showMessage: true,
            markTrialRevoked: false,
            customMsg: 'Tu licencia no está registrada en la nube. Regresaste a la Versión Gratuita.',
          });
        }
      } else if (!res.proActive) {
        if (licenciaRef.current?.active) {
          revokeLocalProAccess({
            showMessage: true,
            markTrialRevoked: false,
            customMsg: res.expired
              ? 'Tu licencia o promoción expiró. Regresaste a la Versión Gratuita.'
              : 'Tu licencia PRO no está activa en la nube. Regresaste a la Versión Gratuita.',
          });
        }
      }
    }

    if (res.devices && res.stats) {
      applyCloudSnapshot({
        devices: res.devices,
        adminKeys: res.adminKeys || [],
        revokedKeys: res.revokedKeys,
        stats: res.stats,
        serverTime: res.serverTime || Date.now(),
        device: res.device,
      });
    }
  };

  const refreshCloudNow = async () => {
    setCloudRefreshing(true);
    try {
      await verifyAndSyncClientStatus();
      const snap = await fetchCloudDevicesState();
      applyCloudSnapshot(snap);
    } finally {
      setCloudRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    clearLegacyAdminKeys();
    clearTrialStart();
    const label = detectDeviceLabel();

    void (async () => {
      await verifyAndSyncClientStatus();
      if (!active) return;
      const snap = await syncDeviceToCloud({
        deviceId,
        cliente: hoja.proyecto.trim() || taller.nombre || '',
        deviceLabel: label,
        eventType: 'open',
        minutesDelta: 1,
        trialActive: Boolean(licenciaRef.current?.active && licenciaRef.current.planCode === 'G'),
        trialExpiresAt:
          licenciaRef.current?.active && licenciaRef.current.planCode === 'G'
            ? licenciaRef.current.expiresAt
            : null,
        licencia: licenciaRef.current,
      });
      if (active) applyCloudSnapshot(snap);
    })();

    const unsub = subscribeCloudDevices(
      (snap) => {
        if (active) applyCloudSnapshot(snap);
      },
      (connected) => {
        if (active) setCloudConnected(connected);
      }
    );

    const heartbeatId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void verifyAndSyncClientStatus();
      void syncDeviceToCloud({
        deviceId,
        cliente: hoja.proyecto.trim() || taller.nombre || '',
        deviceLabel: label,
        eventType: 'heartbeat',
        minutesDelta: 1,
        trialActive: Boolean(licenciaRef.current?.active && licenciaRef.current.planCode === 'G'),
        trialExpiresAt:
          licenciaRef.current?.active && licenciaRef.current.planCode === 'G'
            ? licenciaRef.current.expiresAt
            : null,
        licencia: licenciaRef.current,
      }).then((snap) => {
        if (active) applyCloudSnapshot(snap);
      });
    }, 60_000);

    const handleResumeCheck = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void verifyAndSyncClientStatus();
    };
    document.addEventListener('visibilitychange', handleResumeCheck);
    window.addEventListener('focus', handleResumeCheck);
    window.addEventListener('pageshow', handleResumeCheck);

    return () => {
      active = false;
      unsub();
      window.clearInterval(heartbeatId);
      document.removeEventListener('visibilitychange', handleResumeCheck);
      window.removeEventListener('focus', handleResumeCheck);
      window.removeEventListener('pageshow', handleResumeCheck);
    };
  }, [deviceId]);

  useEffect(() => {
    saveTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    saveTaller(taller);
  }, [taller]);

  useEffect(() => {
    saveHoja(hoja);
  }, [hoja]);

  useEffect(() => {
    saveContratoCliente(contratoCliente);
  }, [contratoCliente]);

  useEffect(() => {
    saveInventario(inventario);
  }, [inventario]);

  useEffect(() => {
    saveInventarioHerrajes(inventarioHerrajes);
  }, [inventarioHerrajes]);

  useEffect(() => {
    saveSobrantes(sobrantes);
  }, [sobrantes]);

  useEffect(() => {
    saveHojasVidrio(hojasVidrio);
  }, [hojasVidrio]);

  useEffect(() => {
    saveObrasAprobadas(obrasAprobadas);
  }, [obrasAprobadas]);

  useEffect(() => {
    saveNotas(notas);
  }, [notas]);

  useEffect(() => {
    saveHistorial(historial);
  }, [historial]);

  useEffect(() => {
    saveFormulas(formulas);
  }, [formulas]);

  useEffect(() => {
    savePerfilFotos(perfilFotos);
  }, [perfilFotos]);

  useEffect(() => {
    saveAdminKeys(adminKeys);
  }, [adminKeys]);

  useEffect(() => {
    saveTrabajosAntesDespues(trabajosAntesDespues);
  }, [trabajosAntesDespues]);

  useEffect(() => {
    saveCloudAccountSession(cloudAccountSession);
  }, [cloudAccountSession]);

  useEffect(() => {
    saveCotizacionReminders(cotizacionReminders);
    void syncRemindersToServer(deviceId, cotizacionReminders);
  }, [cotizacionReminders, deviceId]);

  const cotizacionRemindersRef = useRef<CotizacionReminder[]>(cotizacionReminders);
  cotizacionRemindersRef.current = cotizacionReminders;

  useEffect(() => {
    let active = true;
    const checkDueReminders = async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      const now = Date.now();
      const due = getDueCotizacionReminders(cotizacionRemindersRef.current, now);
      if (due.length === 0) return;

      const notifiedIds = new Set<string>();
      for (const rem of due.slice(0, 3)) {
        const res = await dispatchQuoteReminderNotification(rem);
        if (res.ok) {
          notifiedIds.add(rem.id);
        }
      }
      if (active && notifiedIds.size > 0) {
        const ts = Date.now();
        setCotizacionReminders((prev) =>
          prev.map((item) => (notifiedIds.has(item.id) ? markReminderNotified(item, ts) : item))
        );
      }
    };

    void checkDueReminders();
    const intervalId = window.setInterval(() => {
      void checkDueReminders();
    }, 30_000);

    const refreshPermAndCheck = () => {
      setPushPermission(getNotificationCapability().permission);
      if (document.visibilityState === 'visible') {
        void checkDueReminders();
      }
    };
    window.addEventListener('focus', refreshPermAndCheck);
    document.addEventListener('visibilitychange', refreshPermAndCheck);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshPermAndCheck);
      document.removeEventListener('visibilitychange', refreshPermAndCheck);
    };
  }, []);

  // Verificación periódica de candado de 1 dispositivo cuando existe cuenta vinculada
  useEffect(() => {
    if (!cloudAccountSession) return;
    let active = true;

    const verifySession = async () => {
      const cur = cloudAccountSessionRef.current;
      if (!cur) return;
      const res = await checkCloudAccountSession({
        email: cur.email,
        sessionToken: cur.sessionToken,
        deviceId,
      });
      if (!active) return;
      if (res.sessionExpired) {
        handleRemoteSessionClosed();
      }
    };

    void verifySession();
    const intervalId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void verifySession();
    }, 45_000);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void verifySession();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [cloudAccountSession?.sessionToken, deviceId]);

  // Respaldo automático en la nube (exclusivo 90 días y 1 año) al modificar cotizaciones o inventario
  useEffect(() => {
    if (!cloudAccountSession || !isCloudBackupEligible) return;
    if (skipNextAutoBackupRef.current) {
      skipNextAutoBackupRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      const curSession = cloudAccountSessionRef.current;
      if (!curSession) return;
      void uploadCloudAccountBackup({
        email: curSession.email,
        sessionToken: curSession.sessionToken,
        deviceId,
        licencia: licenciaRef.current,
        backup: buildCurrentCloudBackup(),
      }).then((res) => {
        if (res.sessionExpired) {
          handleRemoteSessionClosed();
          return;
        }
        if (res.ok && res.updatedAt) {
          setCloudAccountSession((prev) =>
            prev && prev.sessionToken === curSession.sessionToken
              ? { ...prev, lastBackedUpAt: res.updatedAt ?? Date.now() }
              : prev
          );
        }
      });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [
    cloudAccountSession?.sessionToken,
    isCloudBackupEligible,
    deviceId,
    licencia,
    hoja,
    historial,
    contratoCliente,
    inventario,
    inventarioHerrajes,
    sobrantes,
    hojasVidrio,
    obrasAprobadas,
    notas,
    formulas,
  ]);

  const despiece = useMemo(() => calcularDespiece(params), [params]);
  const cot = useMemo(
    () =>
      calcularCotizacion({
        linea: params.linea,
        anchoCm: params.anchoCm,
        altoCm: params.altoCm,
        color: params.color,
        vidrio: params.vidrio,
        relleno: params.relleno,
        rellenoPrecioM2: getRellenoPrecioM2(
          params.relleno,
          taller.rellenoPreciosM2,
          params.vidrio
        ),
        modoPrecio,
        precioInput,
        cantidad: params.cantidad,
        cobrarMinM2,
        incluirIva,
        extraPct,
        descDistribuidorPct: taller.descDistribuidorPct,
        precioListaTramo: taller.precioListaTramo,
        despiece,
      }),
    [
      params,
      modoPrecio,
      precioInput,
      cobrarMinM2,
      incluirIva,
      extraPct,
      taller.descDistribuidorPct,
      taller.precioListaTramo,
      taller.rellenoPreciosM2,
      despiece,
    ]
  );

  const applyFrameState = useCallback(
    (
      next: NavFrame,
      prev?: NavFrame | null,
      dir: 'none' | 'back' | 'forward' = 'none',
      skipScroll = false
    ) => {
      currentViewRef.current = next.view;
      if (prev && prev.view !== next.view) {
        setNavTransitionDir(dir);
      }
      setCurrentView(next.view);
      setWorkTab(next.workTab);
      setInvTab(next.invTab);
      setCatalogoTab(next.catalogoTab);
      setModStep(next.modStep);
      setModPaso5Tab(next.modPaso5Tab);
      setModMosqOpen(next.modMosqOpen);
      setGlobalModals(next.globalModals);
      setPerfilModalId(next.perfilModalId);

      if (next.subModal === null && (!prev || prev.subModal !== null)) {
        closeSubModalRef.current?.();
      }

      if (!skipScroll && (!prev || prev.view !== next.view || prev.modStep !== next.modStep)) {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }
    },
    []
  );

  const getHistoryViewName = (frame: NavFrame): string => {
    if (
      frame.depth <= 0 &&
      frame.view === 'menu' &&
      frame.globalModals.length === 0 &&
      !frame.subModal
    ) {
      return 'root';
    }
    if (frame.subModal) return `${frame.view}:${frame.subModal}`;
    if (frame.globalModals.length > 0) {
      return `${frame.view}:modal:${frame.globalModals[frame.globalModals.length - 1]}`;
    }
    return frame.view;
  };

  const pushNavFrame = useCallback(
    (patch: Partial<NavFrame>) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      const next: NavFrame = {
        ...cur,
        ...patch,
        depth: cur.depth + 1,
      };
      navFramesRef.current = [...navFramesRef.current, next];
      applyFrameState(next, cur, 'forward');
      if (!isRunningInIframe() && typeof window !== 'undefined' && window.history?.pushState) {
        try {
          window.history.pushState(
            {
              internalStep: true,
              view: getHistoryViewName(next),
              app: 'aluminero-pro',
              depth: next.depth,
              subModal: next.subModal,
              modal: next.globalModals[next.globalModals.length - 1] || null,
            },
            ''
          );
        } catch {
          // Ignorar si history.pushState está restringido en el navegador
        }
      }
    },
    [applyFrameState]
  );

  const replaceNavFrame = useCallback(
    (patch: Partial<NavFrame>) => {
      const frames = navFramesRef.current;
      const cur = frames[frames.length - 1] || BASE_FRAME;
      const next: NavFrame = {
        ...cur,
        ...patch,
        depth: cur.depth,
      };
      const updated = [...frames];
      updated[updated.length - 1] = next;
      navFramesRef.current = updated;
      applyFrameState(next, cur);
      if (!isRunningInIframe() && typeof window !== 'undefined' && window.history?.replaceState) {
        try {
          window.history.replaceState(
            {
              internalStep: next.depth > 0,
              view: getHistoryViewName(next),
              app: 'aluminero-pro',
              depth: next.depth,
              subModal: next.subModal,
              modal: next.globalModals[next.globalModals.length - 1] || null,
            },
            ''
          );
        } catch {
          // Ignorar
        }
      }
    },
    [applyFrameState]
  );

  const requestBack = useCallback(() => {
    if (navFramesRef.current.length <= 1) {
      return;
    }
    const prev = navFramesRef.current[navFramesRef.current.length - 1];
    const nextFrames = navFramesRef.current.slice(0, -1);
    const next = nextFrames[nextFrames.length - 1] || BASE_FRAME;
    navFramesRef.current = nextFrames;
    applyFrameState(next, prev, 'back');

    if (
      !isRunningInIframe() &&
      typeof window !== 'undefined' &&
      window.history?.back &&
      window.history.state?.internalStep === true
    ) {
      try {
        pendingInternalBackSyncRef.current += 1;
        window.history.back();
      } catch {
        pendingInternalBackSyncRef.current = Math.max(0, pendingInternalBackSyncRef.current - 1);
      }
    }
  }, [applyFrameState]);

  const navigateTo = useCallback(
    (view: ScreenId, extraPatch?: Partial<NavFrame>) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      if (cur.view === view && cur.globalModals.length === 0 && cur.subModal === null && !extraPatch) {
        return;
      }
      if (view === 'menu' && !extraPatch) {
        if (
          cur.depth === 0 &&
          cur.view === 'menu' &&
          cur.globalModals.length === 0 &&
          cur.subModal === null
        ) {
          return;
        }
        navFramesRef.current = [BASE_FRAME];
        applyFrameState(BASE_FRAME, cur, 'back');
        if (!isRunningInIframe() && typeof window !== 'undefined' && window.history?.replaceState) {
          try {
            window.history.replaceState(
              {
                internalStep: false,
                view: 'root',
                app: 'aluminero-pro',
                depth: 0,
              },
              ''
            );
          } catch {
            // Ignorar
          }
        }
        return;
      }
      pushNavFrame({
        view,
        workTab: extraPatch?.workTab ?? (view === 'trabajo' ? 'descuentos' : cur.workTab),
        invTab: extraPatch?.invTab ?? (view === 'inventario' ? 'perfiles' : cur.invTab),
        catalogoTab: extraPatch?.catalogoTab ?? (view === 'catalogo' ? 'perfiles' : cur.catalogoTab),
        modStep: extraPatch?.modStep ?? (view === 'modulacion' ? 1 : cur.modStep),
        modPaso5Tab: extraPatch?.modPaso5Tab ?? (view === 'modulacion' ? 'cortes' : cur.modPaso5Tab),
        modMosqOpen: extraPatch?.modMosqOpen ?? false,
        globalModals: [],
        perfilModalId: null,
        subModal: null,
        ...extraPatch,
      });
    },
    [applyFrameState, pushNavFrame]
  );

  const goHome = useCallback(() => {
    const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
    navFramesRef.current = [BASE_FRAME];
    applyFrameState(BASE_FRAME, cur, 'back');
    if (!isRunningInIframe() && typeof window !== 'undefined' && window.history?.replaceState) {
      try {
        window.history.replaceState(
          {
            internalStep: false,
            view: 'root',
            app: 'aluminero-pro',
            depth: 0,
          },
          ''
        );
      } catch {
        // Ignorar
      }
    }
  }, [applyFrameState]);

  const openGlobalModal = useCallback(
    (modalId: GlobalModalId) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      if (cur.globalModals[cur.globalModals.length - 1] === modalId) return;
      const nextModals = [...cur.globalModals.filter((m) => m !== modalId), modalId];
      pushNavFrame({ globalModals: nextModals });
    },
    [pushNavFrame]
  );

  const openModalFromDrawer = useCallback(
    (modalId: GlobalModalId) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      const withoutDrawer = cur.globalModals.filter((m) => m !== 'drawer' && m !== modalId);
      const nextModals = [...withoutDrawer, modalId];
      if (cur.globalModals.includes('drawer') && cur.depth > 0) {
        replaceNavFrame({ globalModals: nextModals });
      } else {
        pushNavFrame({ globalModals: nextModals });
      }
    },
    [pushNavFrame, replaceNavFrame]
  );

  const openScreenFromDrawer = useCallback(
    (view: ScreenId) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      if (cur.globalModals.includes('drawer') && cur.depth > 0) {
        replaceNavFrame({
          view,
          globalModals: [],
          perfilModalId: null,
          subModal: null,
        });
      } else {
        navigateTo(view);
      }
    },
    [navigateTo, replaceNavFrame]
  );

  const replaceGlobalModal = useCallback(
    (fromModal: GlobalModalId, toModal: GlobalModalId) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      const nextModals = [...cur.globalModals.filter((m) => m !== fromModal && m !== toModal), toModal];
      if (cur.globalModals.includes(fromModal) && cur.depth > 0) {
        replaceNavFrame({ globalModals: nextModals });
      } else {
        pushNavFrame({ globalModals: nextModals });
      }
    },
    [pushNavFrame, replaceNavFrame]
  );

  const openPerfilModal = useCallback(
    (id: PerfilCatalogoId) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      const nextModals = [...cur.globalModals.filter((m) => m !== 'perfil'), 'perfil'] as GlobalModalId[];
      pushNavFrame({ globalModals: nextModals, perfilModalId: id });
    },
    [pushNavFrame]
  );

  const replaceSubModalWithPerfil = useCallback(
    (id: PerfilCatalogoId) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      const nextModals = [...cur.globalModals.filter((m) => m !== 'perfil'), 'perfil'] as GlobalModalId[];
      if (cur.subModal !== null && cur.depth > 0) {
        replaceNavFrame({ subModal: null, globalModals: nextModals, perfilModalId: id });
      } else {
        pushNavFrame({ subModal: null, globalModals: nextModals, perfilModalId: id });
      }
    },
    [pushNavFrame, replaceNavFrame]
  );

  const requestOpenAdmin = useCallback(() => {
    const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
    if (cur.globalModals.includes('adminModal')) {
      replaceGlobalModal('adminModal', 'adminAuth');
    } else {
      openGlobalModal('adminAuth');
    }
  }, [openGlobalModal, replaceGlobalModal]);

  useEffect(() => {
    if (!historyInitializedRef.current) {
      historyInitializedRef.current = true;
      if (
        initialReferralActive &&
        !proActive &&
        Boolean(savedColleagueReferral) &&
        !navFramesRef.current[navFramesRef.current.length - 1]?.globalModals.includes('referralWelcome')
      ) {
        const refFrame: NavFrame = {
          ...BASE_FRAME,
          depth: 1,
          globalModals: ['referralWelcome'],
        };
        navFramesRef.current = [BASE_FRAME, refFrame];
        applyFrameState(refFrame, BASE_FRAME);
      }
      if (!isRunningInIframe() && typeof window !== 'undefined' && window.history?.replaceState) {
        try {
          window.history.replaceState(
            {
              internalStep: false,
              view: 'root',
              app: 'aluminero-pro',
              depth: 0,
            },
            ''
          );
        } catch {
          // Ignorar si history API está restringida
        }
      }
    }

    if (isRunningInIframe() || typeof window === 'undefined' || !window.history?.pushState) {
      return;
    }

    const commitBackFrameSync = (targetFrame: NavFrame, prevFrame: NavFrame) => {
      flushSync(() => {
        applyFrameState(targetFrame, prevFrame, 'none', true);
      });
      if (
        prevFrame.view !== targetFrame.view ||
        prevFrame.modStep !== targetFrame.modStep
      ) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (pendingInternalBackSyncRef.current > 0) {
        pendingInternalBackSyncRef.current -= 1;
        if (
          navFramesRef.current.length <= 1 &&
          (!event.state || event.state.view === 'root' || event.state.internalStep === false)
        ) {
          try {
            window.history.pushState(
              { internalStep: false, view: 'root', app: 'aluminero-pro', depth: 0 },
              ''
            );
          } catch {
            // Ignorar
          }
        }
        return;
      }

      if (consumeTopHistoryOverlay()) {
        return;
      }

      const prevFrame = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;

      if (navFramesRef.current.length > 1) {
        const targetDepth =
          event.state &&
          typeof event.state.depth === 'number' &&
          event.state.depth < navFramesRef.current.length - 1
            ? Math.max(0, event.state.depth)
            : navFramesRef.current.length - 2;
        const targetFrame = navFramesRef.current[targetDepth] || BASE_FRAME;
        navFramesRef.current = navFramesRef.current.slice(0, targetDepth + 1);
        commitBackFrameSync(targetFrame, prevFrame);

        if (navFramesRef.current.length === 1) {
          try {
            window.history.pushState(
              { internalStep: false, view: 'root', app: 'aluminero-pro', depth: 0 },
              ''
            );
          } catch {
            // Ignorar
          }
        }
        return;
      }

      navFramesRef.current = [BASE_FRAME];
      commitBackFrameSync(BASE_FRAME, prevFrame);
      try {
        window.history.pushState(
          { internalStep: false, view: 'root', app: 'aluminero-pro', depth: 0 },
          ''
        );
      } catch {
        // Ignorar
      }
      if (!accessBlockedRef.current) {
        showToastRef.current('Ya estás en el inicio · Presiona de nuevo para salir');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [applyFrameState, initialReferralActive]);

  const handleSelectLinea = (lineaId: LineaId) => {
    const cfg = LINEAS_CONFIG[lineaId];
    if (cfg.pro && !proActive) {
      openGlobalModal('pro');
      return;
    }
    setCategoria(cfg.categoria);
    setParams((prev) => ({
      ...prev,
      linea: lineaId,
      anchoCm:
        cfg.categoria === 'puertas' && prev.linea.startsWith('puerta')
          ? prev.anchoCm
          : cfg.categoria === 'puertas'
            ? 90
            : prev.anchoCm,
      altoCm:
        cfg.categoria === 'puertas' && prev.linea.startsWith('puerta')
          ? prev.altoCm
          : cfg.categoria === 'puertas'
            ? 210
            : cfg.esCancelBano
              ? 190
              : prev.altoCm,
      apertura:
        lineaId === 'mosq-fijo'
          ? 'fija'
          : lineaId === 'mosq-corredizo' || lineaId === 'cancel-bano'
            ? 'corrediza'
            : prev.apertura,
      tolerancias: { ...cfg.toleranciasDefault },
    }));
    const baseRate = taller.tarifasBase[lineaId] ?? cfg.tarifaBaseDefault;
    setPrecioInput(baseRate);
    setSelectedFormulaId('std');
  };

  const handleEntrarTrabajo = (cat: CategoriaTrabajo) => {
    if (cat === 'puertas' && !proActive) {
      openGlobalModal('pro');
      return;
    }
    setCategoria(cat);
    const defaultLine: LineaId = cat === 'puertas' ? 'puerta-europea' : '3';
    if (LINEAS_CONFIG[params.linea].categoria !== cat) {
      const cfg = LINEAS_CONFIG[defaultLine];
      setParams(createInitialParams(defaultLine));
      setPrecioInput(taller.tarifasBase[defaultLine] ?? cfg.tarifaBaseDefault);
    }
    navigateTo('trabajo');
  };

  const handleEntrarHoja = () => {
    if (!proActive) {
      openGlobalModal('pro');
      return;
    }
    navigateTo('hoja');
  };

  const handleEntrarInventario = (tab?: 'perfiles' | 'vidrios' | 'herrajes') => {
    if (!proActive) {
      openGlobalModal('pro');
      return;
    }
    navigateTo('inventario', tab ? { invTab: tab } : undefined);
  };

  const handleLogoClick = () => {
    const now = Date.now();
    if (logoTapTimerRef.current) {
      window.clearTimeout(logoTapTimerRef.current);
      logoTapTimerRef.current = null;
    }

    if (now - logoTapsRef.current.lastTs <= 2000) {
      logoTapsRef.current.count += 1;
    } else {
      logoTapsRef.current.count = 1;
    }
    logoTapsRef.current.lastTs = now;

    if (logoTapsRef.current.count >= 5) {
      logoTapsRef.current = { count: 0, lastTs: 0 };
      requestOpenAdmin();
      return;
    }

    logoTapTimerRef.current = window.setTimeout(() => {
      logoTapsRef.current = { count: 0, lastTs: 0 };
      logoTapTimerRef.current = null;
    }, 2000);

    if (currentView !== 'menu') {
      goHome();
    }
  };

  const handleAgregarObra = () => {
    const dimCheck = validatePiezaDimensiones(params.anchoCm, params.altoCm);
    if (!dimCheck.valid) {
      showToast(
        dimCheck.error ||
          'Medidas sospechosas: el ancho y el alto deben ser mayores a 0 y menores a 600 cm.'
      );
      return;
    }

    const nuevaPartida: PartidaObra = {
      id:
        editingPartidaId ||
        `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      categoria,
      linea: params.linea,
      area: areaText.trim() || 'General',
      etiqueta: etiquetaPieza.trim(),
      anchoCm: params.anchoCm,
      altoCm: params.altoCm,
      color: params.color,
      vidrio: params.vidrio,
      relleno: params.relleno,
      hojas: params.hojas,
      apertura: params.apertura,
      sentidoPuerta: params.sentidoPuerta,
      puertaIntermedio: params.puertaIntermedio,
      puertaEconomica: params.puertaEconomica,
      cancelEstilo: params.cancelEstilo,
      invertido: params.invertido,
      cantidad: params.cantidad,
      modoPrecio,
      precioInput,
      cobrarMinM2,
      extraPct,
      totalLinea: cot.totalFinal,
      despiece,
    };

    setHoja((prev) => {
      if (editingPartidaId) {
        return {
          ...prev,
          partidas: prev.partidas.map((item) => (item.id === editingPartidaId ? nuevaPartida : item)),
        };
      }
      return { ...prev, partidas: [...prev.partidas, nuevaPartida] };
    });

    showToast(
      editingPartidaId
        ? 'Partida actualizada en Hoja de Cotización'
        : 'Pieza agregada a Hoja de Cotización',
      true
    );
    setEditingPartidaId(null);
    setEtiquetaPieza('');
  };

  const handleEditarPartida = (p: PartidaObra) => {
    const safeLinea = normalizeLineaId(p.linea);
    setCategoria(p.categoria);
    setParams({
      linea: safeLinea,
      anchoCm: p.anchoCm,
      altoCm: p.altoCm,
      color: p.color,
      vidrio: p.vidrio,
      relleno: p.relleno || getDefaultRellenoFromVidrio(p.vidrio),
      hojas: p.hojas,
      apertura: p.apertura,
      sentidoPuerta: p.sentidoPuerta,
      puertaIntermedio: p.puertaIntermedio,
      puertaEconomica: p.puertaEconomica,
      cancelEstilo: p.cancelEstilo || 'semilujo',
      invertido: p.invertido,
      cantidad: p.cantidad,
      tolerancias: { ...LINEAS_CONFIG[safeLinea].toleranciasDefault },
    });
    setModoPrecio(p.modoPrecio);
    setPrecioInput(p.precioInput);
    setCobrarMinM2(p.cobrarMinM2);
    setExtraPct(p.extraPct);
    setAreaText(p.area);
    setEtiquetaPieza(p.etiqueta);
    setEditingPartidaId(p.id);
    navigateTo('trabajo');
  };

  const handleConvertirNota = (nota: NotaObra) => {
    const parsed = parseNotaACotizacion(nota);
    if (isFeatureProRequired(parsed.linea, parsed.apertura, 1) && !proActive) {
      showToast('Esta línea o tipo de apertura detectado requiere Licencia PRO');
      openGlobalModal('pro');
      return;
    }
    const cfg = LINEAS_CONFIG[parsed.linea];
    setCategoria(cfg.categoria);
    setParams((prev) => ({
      ...prev,
      linea: parsed.linea,
      apertura: parsed.apertura,
      anchoCm: parsed.anchoCm,
      altoCm: parsed.altoCm,
      color: parsed.color,
      vidrio: parsed.vidrio,
      relleno: getDefaultRellenoFromVidrio(parsed.vidrio),
      tolerancias: { ...cfg.toleranciasDefault },
    }));
    setPrecioInput(taller.tarifasBase[parsed.linea] ?? cfg.tarifaBaseDefault);
    setAreaText(parsed.area);
    setEtiquetaPieza(parsed.etiqueta);
    navigateTo('trabajo');
    showToast(`Nota convertida: ${cfg.nombre} (${parsed.apertura})`, true);
  };

  const handleUploadPerfilFoto = async (id: PerfilCatalogoId, file: File) => {
    try {
      const compressed = await compressImageToDataUrl(file, 600, 0.78);
      setPerfilFotos((prev) => ({
        ...prev,
        [id]: compressed,
        [`${params.linea}__${id}`]: compressed,
      }));
      showToast('Foto real del perfil guardada (máx. 600 px JPEG)', true);
    } catch {
      showToast('Error al comprimir o guardar la imagen');
    }
  };

  const handleRemovePerfilFoto = (id: PerfilCatalogoId) => {
    setPerfilFotos((prev) => {
      const next = { ...prev };
      delete next[id];
      for (const k of Object.keys(next)) {
        if (k.endsWith(`__${id}`)) {
          delete next[k];
        }
      }
      return next;
    });
    showToast('Foto real removida');
  };

  const handleInstallApp = async (fromDrawer = false) => {
    if (pwa.isInstalled || isReferralWelcomeShowing) return;
    if (pwa.canPromptNative) {
      const outcome = await pwa.install();
      if (outcome === 'accepted') {
        if (fromDrawer) requestBack();
        showToast('Aluminero Pro instalada en tu dispositivo', true);
        return;
      }
      if (outcome === 'dismissed') {
        if (fromDrawer) requestBack();
        return;
      }
    }
    if (fromDrawer) {
      openModalFromDrawer('installGuide');
    } else {
      openGlobalModal('installGuide');
    }
  };

  const handleImportBackup = (payload: AlumineroBackupPayload) => {
    const importedPhotosCount = Object.keys(payload.perfilFotos || {}).length;
    if (importedPhotosCount > 0) {
      setPerfilFotos((prev) => ({ ...prev, ...payload.perfilFotos }));
    }
    if (Array.isArray(payload.notas) && payload.notas.length > 0) {
      setNotas((prev) => {
        const byId = new Map(prev.map((n) => [n.id, n]));
        for (const n of payload.notas!) {
          if (n && n.id) byId.set(n.id, n);
        }
        return Array.from(byId.values());
      });
    }
    if (payload.taller) {
      setTaller((prev) => ({
        ...prev,
        ...payload.taller,
        tarifasBase: { ...prev.tarifasBase, ...(payload.taller?.tarifasBase || {}) },
        rellenoPreciosM2: {
          ...(prev.rellenoPreciosM2 || {}),
          ...(payload.taller?.rellenoPreciosM2 || {}),
        },
      }));
    }
    if (Array.isArray(payload.formulas) && payload.formulas.length > 0) {
      setFormulas((prev) => {
        const byId = new Map(prev.map((f) => [f.id, f]));
        for (const f of payload.formulas!) {
          if (f && f.id) byId.set(f.id, f);
        }
        return Array.from(byId.values());
      });
    }
    if (payload.inventario) {
      setInventario((prev) => ({ ...prev, ...payload.inventario }));
    }
    if (payload.inventarioHerrajes) {
      setInventarioHerrajes((prev) => ({ ...prev, ...payload.inventarioHerrajes }));
    }
    if (Array.isArray(payload.sobrantes) && payload.sobrantes.length > 0) {
      setSobrantes((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]));
        for (const s of payload.sobrantes!) {
          if (s && s.id) byId.set(s.id, s);
        }
        return Array.from(byId.values());
      });
    }
    if (Array.isArray(payload.hojasVidrio) && payload.hojasVidrio.length > 0) {
      setHojasVidrio((prev) => {
        const byId = new Map(prev.map((hv) => [hv.id, hv]));
        for (const hv of payload.hojasVidrio!) {
          if (hv && hv.id) byId.set(hv.id, hv);
        }
        return Array.from(byId.values());
      });
    }
    if (Array.isArray(payload.obrasAprobadas) && payload.obrasAprobadas.length > 0) {
      setObrasAprobadas((prev) => {
        const byId = new Map(prev.map((o) => [o.id, o]));
        for (const o of payload.obrasAprobadas!) {
          if (o && o.id) byId.set(o.id, o);
        }
        return Array.from(byId.values());
      });
    }
    if (Array.isArray(payload.historial) && payload.historial.length > 0) {
      setHistorial((prev) => {
        const byId = new Map(prev.map((h) => [h.id, h]));
        for (const h of payload.historial!) {
          if (h && h.id) byId.set(h.id, h);
        }
        return Array.from(byId.values());
      });
    }

    if (typeof payload.sugerenciasWhatsapp === 'string') {
      const cleanWa = saveSugerenciasWhatsapp(payload.sugerenciasWhatsapp);
      setSugerenciasWhatsapp(cleanWa);
    }

    if (Array.isArray(payload.trabajosAntesDespues) && payload.trabajosAntesDespues.length > 0) {
      setTrabajosAntesDespues((prev) => {
        const byId = new Map(prev.map((t) => [t.id, t]));
        for (const t of payload.trabajosAntesDespues!) {
          if (t && t.id) byId.set(t.id, t);
        }
        return Array.from(byId.values());
      });
    }

    if (Array.isArray(payload.recordatorios) && payload.recordatorios.length > 0) {
      setCotizacionReminders((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        for (const r of payload.recordatorios!) {
          if (r && r.id) byId.set(r.id, r);
        }
        return Array.from(byId.values());
      });
    }

    const notasRestored = payload.notas?.length || 0;
    showToast(
      `Respaldo importado: ${importedPhotosCount} fotos de perfiles y ${notasRestored} notas restauradas`,
      true
    );
  };

  useEffect(() => {
    const syncQuotesCount = () => setCotizacionesCount(loadCotizacionesGuardadas().length);
    window.addEventListener('aluminero:cotizaciones-updated', syncQuotesCount);
    window.addEventListener('focus', syncQuotesCount);
    return () => {
      window.removeEventListener('aluminero:cotizaciones-updated', syncQuotesCount);
      window.removeEventListener('focus', syncQuotesCount);
    };
  }, []);

  const handleSetHojaProyectoFromLev = useCallback(
    (cliente: string, telefono?: string, direccion?: string) => {
      const clean = String(cliente || '').trim();
      const tel = String(telefono || '').trim();
      const dir = String(direccion || '').trim();
      if (!clean) return;
      overwriteHojaProyectoInStorage(clean);
      setHoja((prev) => {
        const next: HojaState = {
          ...prev,
          proyecto: clean,
          ...(tel ? { clienteTel: tel } : {}),
          ...(dir ? { clienteDir: dir } : {}),
        };
        saveHoja(next);
        return next;
      });
      setContratoCliente((prev) => ({
        ...prev,
        nombre: clean,
        ...(tel ? { telefono: tel } : {}),
        ...(dir ? { direccion: dir } : {}),
      }));
    },
    []
  );

  const commitBatchPartidasToHoja = useCallback(
    (
      mode: 'replace' | 'append',
      draft: LevantamientoDraft,
      partidas: PartidaObraExtended[],
      skippedProCount: number
    ) => {
      const norm = normalizeLevantamientoDraft(draft);
      const cli = norm.cliente.trim();
      const tel = (norm.telefono || '').trim();
      const dir = (norm.direccion || '').trim();
      if (cli) {
        upsertCliente({ nombre: cli, telefono: tel, direccion: dir });
      }
      setHoja((prev) => {
        const next: HojaState = {
          ...prev,
          proyecto: cli || prev.proyecto,
          clienteTel: tel || prev.clienteTel,
          clienteDir: dir || prev.clienteDir,
          partidas: mode === 'replace' ? partidas : [...prev.partidas, ...partidas],
        };
        saveHoja(next);
        return next;
      });
      setContratoCliente((prev) => ({
        ...prev,
        nombre: cli || prev.nombre,
        telefono: tel || prev.telefono,
        direccion: dir || prev.direccion,
      }));
      setPendingLevBatch(null);
      navigateTo('hoja');
      if (skippedProCount > 0) {
        showToast(
          `${partidas.length} partida(s) agregada(s). ${skippedProCount} pieza(s) PRO omitida(s) en versión gratuita.`,
          true
        );
      } else {
        showToast(`${partidas.length} partida(s) enviada(s) a Hoja de Cotización`, true);
      }
    },
    [navigateTo, showToast]
  );

  const handleBatchSendToHojaFromLev = useCallback(
    (rawDraft: LevantamientoDraft) => {
      const draft = normalizeLevantamientoDraft(rawDraft);
      const partidas: PartidaObraExtended[] = [];
      let skippedProCount = 0;

      for (const p of draft.piezas) {
        const dimCheck = validatePiezaDimensiones(p.anchoCm, p.altoCm);
        if (!dimCheck.valid) continue;
        const resolved = resolveLineaFromLevantamiento(p);
        const lineaCfg = LINEAS_CONFIG[resolved.linea];
        if (!lineaCfg) continue;

        const apertura =
          resolved.apertura || (lineaCfg.categoria === 'puertas' ? 'abatible' : 'corrediza');
        const qty = Math.max(1, Number(p.cant) || 1);
        if (!proActive && (lineaCfg.pro || isFeatureProRequired(resolved.linea, apertura, qty))) {
          skippedProCount += 1;
          continue;
        }

        const color = resolveColorAluminioFromLevantamiento(p.colorAluminio);
        const { vidrio, relleno } = resolveVidrioFromLevantamiento(p.colorVidrio);
        const pieceNotas = mergePiezaSpecsAndNotes(p);
        const pieceParams: TrabajoParams = {
          linea: resolved.linea,
          anchoCm: p.anchoCm,
          altoCm: p.altoCm,
          color,
          vidrio,
          relleno,
          hojas: 2,
          apertura,
          sentidoPuerta: 'izq',
          puertaIntermedio: true,
          puertaEconomica: false,
          cancelEstilo: 'semilujo',
          invertido: false,
          cantidad: qty,
          tolerancias: { ...lineaCfg.toleranciasDefault },
        };
        const pieceDespiece = calcularDespiece(pieceParams);
        const piecePrecioInput = taller.tarifasBase[resolved.linea] ?? lineaCfg.tarifaBaseDefault;
        const pieceCot = calcularCotizacion({
          linea: resolved.linea,
          anchoCm: p.anchoCm,
          altoCm: p.altoCm,
          color,
          vidrio,
          relleno,
          rellenoPrecioM2: getRellenoPrecioM2(relleno, taller.rellenoPreciosM2, vidrio),
          modoPrecio: 'm2',
          precioInput: piecePrecioInput,
          cantidad: qty,
          cobrarMinM2,
          incluirIva: false,
          extraPct: 0,
          descDistribuidorPct: taller.descDistribuidorPct,
          precioListaTramo: taller.precioListaTramo,
          despiece: pieceDespiece,
        });

        partidas.push({
          id: `p-lev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          categoria: lineaCfg.categoria,
          linea: resolved.linea,
          area: p.area.trim() || 'General',
          etiqueta: '',
          anchoCm: p.anchoCm,
          altoCm: p.altoCm,
          color,
          vidrio,
          relleno,
          hojas: 2,
          apertura,
          sentidoPuerta: 'izq',
          puertaIntermedio: true,
          puertaEconomica: false,
          cancelEstilo: 'semilujo',
          invertido: false,
          cantidad: qty,
          modoPrecio: 'm2',
          precioInput: piecePrecioInput,
          cobrarMinM2,
          extraPct: 0,
          totalLinea: pieceCot.totalFinal,
          despiece: pieceDespiece,
          notas: pieceNotas || undefined,
          fotoDataUrl: p.foto || undefined,
        });
      }

      if (partidas.length === 0) {
        if (skippedProCount > 0) {
          showToast('Las piezas seleccionadas requieren Licencia PRO.');
          openGlobalModal('pro');
        } else {
          showToast('No se encontraron piezas válidas para enviar a la Hoja.');
        }
        return;
      }

      if (hoja.partidas.length > 0) {
        setPendingLevBatch({ draft, partidas, skippedProCount });
        openGlobalModal('levBatchConfirm');
      } else {
        commitBatchPartidasToHoja('replace', draft, partidas, skippedProCount);
      }
    },
    [
      cobrarMinM2,
      commitBatchPartidasToHoja,
      hoja.partidas.length,
      openGlobalModal,
      proActive,
      showToast,
      taller.descDistribuidorPct,
      taller.precioListaTramo,
      taller.rellenoPreciosM2,
      taller.tarifasBase,
    ]
  );

  const alumBridgeHandlerRef = useRef<{
    apply: (p: AlumBridgePayload) => void;
    setProyecto: (cliente: string) => void;
  }>({
    apply: () => {},
    setProyecto: () => {},
  });

  alumBridgeHandlerRef.current = {
    setProyecto: (cliente: string) => {
      handleSetHojaProyectoFromLev(cliente);
    },
    apply: (p: AlumBridgePayload) => {
      if (typeof p.cliente === 'string' && p.cliente.trim()) {
        handleSetHojaProyectoFromLev(p.cliente);
      }

      // 2) Salir siempre del modo 'Editando partida existente de la Hoja' y actualizar área/etiqueta de la pieza
      setEditingPartidaId(null);
      setAreaText(typeof p.area === 'string' ? p.area.trim() : '');
      setEtiquetaPieza(typeof p.etiqueta === 'string' ? p.etiqueta.trim() : '');

      if (p.destino === 'modulacion') {
        window.__alumModPending = p;
        window.dispatchEvent(new CustomEvent('alum-mod-apply'));
        if (currentViewRef.current === 'modulacion') {
          replaceNavFrame({ modStep: 5, modPaso5Tab: 'cortes' });
        } else {
          navigateTo('modulacion', { modStep: 5, modPaso5Tab: 'cortes' });
        }
        return;
      }

      const cfg = LINEAS_CONFIG[p.linea];
      if (!cfg) return;
      if (cfg.pro && !proActive) {
        openGlobalModal('pro');
        return;
      }
      handleSelectLinea(p.linea);
      setParams((prev) => ({
        ...prev,
        anchoCm: p.ancho,
        altoCm: p.alto,
        cantidad: p.cant,
        ...(p.apertura ? { apertura: p.apertura } : {}),
        ...(p.color ? { color: p.color } : {}),
        ...(p.vidrio ? { vidrio: p.vidrio } : {}),
        ...(p.relleno ? { relleno: p.relleno } : {}),
      }));
      if (typeof p.notas === 'string') {
        setReferencia(p.notas);
      }
      const targetWorkTab = p.destino === 'cotizacion' ? 'cotizacion' : 'descuentos';
      if (currentViewRef.current === 'trabajo') {
        replaceNavFrame({ workTab: targetWorkTab });
      } else {
        navigateTo('trabajo', { workTab: targetWorkTab });
      }
    },
  };

  useEffect(() => {
    window.__alumBridge = {
      apply: (p: AlumBridgePayload) => alumBridgeHandlerRef.current.apply(p),
      setProyecto: (cliente: string) => alumBridgeHandlerRef.current.setProyecto(cliente),
    };
    return () => {
      delete window.__alumBridge;
    };
  }, []);

  const hojaPiezasCount = hoja.partidas.reduce((acc, p) => acc + p.cantidad, 0);
  const hojaTotalAprox = useMemo(() => {
    const sub = hoja.partidas.reduce((a, p) => a + p.totalLinea, 0);
    const desc = sub * ((hoja.descuentoPct || 0) / 100);
    const base = sub - desc;
    return hoja.incluirIva ? base * 1.16 : base;
  }, [hoja]);

  const inventarioTramosTotal = round2(
    Object.values(inventario).reduce((acc, v) => acc + (Number(v) || 0), 0)
  );
  const hojasVidrioTotalCount = hojasVidrio.reduce(
    (acc, h) => acc + Math.max(0, Number(h.cantidad) || 0),
    0
  );

  const reminderSummary = useMemo(() => {
    const part = partitionCotizacionReminders(cotizacionReminders);
    return {
      dueCount: part.due.length,
      pendingCount: part.due.length + part.upcoming.length,
    };
  }, [cotizacionReminders]);

  const handleAddReminder = useCallback((rem: CotizacionReminder) => {
    setCotizacionReminders((prev) => [rem, ...prev.filter((r) => r.id !== rem.id)].slice(0, 100));
  }, []);

  const handleUpdateReminderStatus = useCallback(
    (id: string, status: CotizacionReminderStatus) => {
      setCotizacionReminders((prev) =>
        prev.map((r) => (r.id === id ? updateCotizacionReminderStatus(r, status) : r))
      );
      showToast(
        status === 'aprobada'
          ? 'Cotización marcada como aprobada'
          : status === 'seguimiento'
            ? 'Seguimiento marcado como atendido'
            : 'Recordatorio actualizado',
        true
      );
    },
    [showToast]
  );

  const handleSnoozeReminder = useCallback(
    (id: string) => {
      setCotizacionReminders((prev) =>
        prev.map((r) => (r.id === id ? snoozeCotizacionReminder(r) : r))
      );
      showToast('Recordatorio pospuesto 1 día', true);
    },
    [showToast]
  );

  const handleDeleteReminder = useCallback(
    (id: string) => {
      setCotizacionReminders((prev) => prev.filter((r) => r.id !== id));
      showToast('Recordatorio eliminado');
    },
    [showToast]
  );

  const handleRequestPushPermission = useCallback(async () => {
    const perm = await requestPushNotificationPermission();
    setPushPermission(getNotificationCapability().permission);
    if (perm === 'granted') {
      await getReadyServiceWorkerRegistration();
      await subscribeBrowserPushOptional(deviceId);
    }
    return perm;
  }, [deviceId]);

  const handleNotifyReminderNow = useCallback(
    async (rem: CotizacionReminder) => {
      const res = await dispatchQuoteReminderNotification(rem);
      if (res.ok) {
        setCotizacionReminders((prev) =>
          prev.map((r) => (r.id === rem.id ? markReminderNotified(r) : r))
        );
        showToast(
          res.via === 'service-worker'
            ? `Notificación enviada vía Service Worker para "${rem.proyecto}"`
            : `Notificación enviada para "${rem.proyecto}"`,
          true
        );
      } else {
        showToast(res.error || 'No se pudo enviar la notificación');
      }
    },
    [showToast]
  );

  const handleTestPushNotification = useCallback(async () => {
    const sampleRes = createCotizacionReminder({
      id: 'test-sw-push',
      proyecto: hoja.proyecto.trim() || taller.nombre || 'Cotización de prueba',
      total: hojaTotalAprox > 0 ? hojaTotalAprox : 4850,
      partidasCount: hojaPiezasCount > 0 ? hojaPiezasCount : 2,
      nota: 'Prueba de notificación push Service Worker',
      dueAt: Date.now(),
    });
    if (!sampleRes.ok) return;
    const res = await dispatchQuoteReminderNotification(sampleRes.reminder);
    if (res.ok) {
      showToast('Notificación de prueba enviada por Service Worker', true);
    } else {
      showToast(res.error || 'Activa los permisos de notificación primero');
    }
  }, [hoja.proyecto, hojaPiezasCount, hojaTotalAprox, showToast, taller.nombre]);

  const handleScheduleHistorialReminder = useCallback(
    (item: HistorialItem) => {
      const created = createCotizacionReminder({
        proyecto: item.referencia,
        total: item.total,
        partidasCount: item.cantidad,
        nota: `${LINEAS_CONFIG[item.linea]?.nombre || item.linea} · ${item.anchoCm}×${item.altoCm} cm`,
        dueAt: computeReminderDueAt('24h'),
      });
      if (!created.ok) {
        showToast(created.error);
        return;
      }
      handleAddReminder(created.reminder);
      const cap = getNotificationCapability();
      setPushPermission(cap.permission);
      if (cap.supported && cap.permission !== 'granted') {
        setHighlightedReminderId(created.reminder.id);
        openGlobalModal('reminders');
        showToast(
          `Seguimiento programado para "${item.referencia}". Activa las notificaciones Push para recibir el aviso.`
        );
      } else {
        showToast(`Seguimiento en 24 h programado para "${item.referencia}"`, true);
      }
    },
    [handleAddReminder, openGlobalModal, showToast]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const paramsUrl = new URLSearchParams(window.location.search);
    const remId = paramsUrl.get('reminderId');
    const remAction = paramsUrl.get('reminderAction');
    const viewParam = paramsUrl.get('view');

    if (remAction === 'snooze-1d' && remId) {
      handleSnoozeReminder(remId);
    } else if (viewParam === 'hoja' || remId) {
      if (remId) setHighlightedReminderId(remId);
      if (proActive) {
        navigateTo('hoja');
      } else {
        openGlobalModal('reminders');
      }
    }

    if (isRunningInIframe() || !('serviceWorker' in navigator)) return;
    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; action?: string; reminderId?: string } | null;
      if (!data || data.type !== 'SW_REMINDER_ACTION') return;
      if (data.action === 'snooze-1d' && data.reminderId) {
        handleSnoozeReminder(data.reminderId);
        return;
      }
      if (data.reminderId) {
        setHighlightedReminderId(data.reminderId);
      }
      if (proActive) {
        navigateTo('hoja');
      } else {
        openGlobalModal('reminders');
      }
      showToast('Abriendo seguimiento de cotización pendiente', true);
    };

    navigator.serviceWorker.addEventListener('message', onSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
  }, [handleSnoozeReminder, navigateTo, openGlobalModal, proActive, showToast]);

  const screenTitleMap: Record<ScreenId, string> = {
    menu: 'Aluminero Pro',
    trabajo: LINEAS_CONFIG[params.linea].nombre,
    hoja: 'Hoja de Cotización',
    cotizaciones: 'Historial de Cotizaciones',
    taller: 'Mi Taller y Precios',
    notas: 'Notas de Obra',
    modulacion: 'Modulación y Cortes',
    vidrio: 'Optimizador de Vidrio 2D',
    inventario: 'Mi Inventario de Taller',
    catalogo: 'Catálogo de Perfiles',
    terminos: 'Términos y Condiciones',
    privacidad: 'Aviso de Privacidad',
  };

  return (
    <div
      className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden box-border transition-colors ${
        theme === 'dark' ? 'bg-[#060E1B] text-slate-100' : 'bg-[#EEF3F9] text-slate-900'
      }`}
    >
      <TopBar
        currentView={currentView}
        title={screenTitleMap[currentView]}
        proActive={proActive}
        licencia={licencia}
        trialExpiresAt={trialExpiresAt}
        theme={theme}
        onBack={requestBack}
        onGoHome={goHome}
        onLogoClick={handleLogoClick}
        onOpenPro={() => openGlobalModal('pro')}
        onOpenDrawer={() => openGlobalModal('drawer')}
        onOpenCalculadora={() => openGlobalModal('calculadora')}
      />

      <main className="w-full max-w-[1120px] mx-auto px-3 sm:px-4 pt-5 pb-24 box-border overflow-x-hidden">
        {!isOnline && (
          <div
            id="offline-banner"
            role="status"
            className="mb-3 px-3.5 py-2 rounded-xl border border-amber-400/60 bg-amber-500/15 text-amber-200 text-[12px] font-bold flex items-center justify-between gap-2"
          >
            <span>Modo sin internet activo · Tus cálculos, inventario y fotos locales siguen funcionando.</span>
          </div>
        )}

        <ErrorBoundary resetKey={currentView} onGoHome={goHome}>
        <div
          key={currentView}
          className={
            navTransitionDir === 'back'
              ? 'ap-view-back'
              : navTransitionDir === 'forward'
                ? 'ap-view-forward'
                : ''
          }
        >
        {currentView === 'menu' && (
          <MainMenuView
            proActive={proActive}
            hojaPiezasCount={hojaPiezasCount}
            hojaTotal={hojaTotalAprox}
            inventarioTramosTotal={inventarioTramosTotal}
            hojasVidrioCount={hojasVidrioTotalCount}
            notasCount={notas.length}
            cotizacionesCount={cotizacionesCount}
            savedReferral={savedColleagueReferral}
            referredById={referredById}
            pendingRemindersCount={reminderSummary.pendingCount}
            dueRemindersCount={reminderSummary.dueCount}
            pushPermission={pushPermission}
            onClaimColleaguePromo={handleClaimColleaguePromo}
            onOpenPro={() => openGlobalModal('pro')}
            onEntrarTrabajo={handleEntrarTrabajo}
            onEntrarHoja={handleEntrarHoja}
            onEntrarInventario={() => handleEntrarInventario()}
            onGoToView={(view) => navigateTo(view)}
            onOpenAntesDespues={() => openGlobalModal('antesDespues')}
            onOpenLevantamiento={() => window.__alumLev?.open()}
            onOpenReminders={() => openGlobalModal('reminders')}
          />
        )}

        {currentView === 'trabajo' && (
          <TrabajoView
            categoria={categoria}
            params={params}
            despiece={despiece}
            cot={cot}
            modoPrecio={modoPrecio}
            precioInput={precioInput}
            cobrarMinM2={cobrarMinM2}
            incluirIva={incluirIva}
            areaText={areaText}
            etiquetaPieza={etiquetaPieza}
            extraPct={extraPct}
            referencia={referencia}
            proActive={proActive}
            hojaCount={hojaPiezasCount}
            editingPartidaId={editingPartidaId}
            taller={taller}
            formulas={formulas}
            selectedFormulaId={selectedFormulaId}
            perfilFotos={perfilFotos}
            workTab={workTab}
            onChangeWorkTab={(tab) => {
              if (tab !== workTab) pushNavFrame({ workTab: tab });
            }}
            onChangeParams={(patch) => setParams((prev) => ({ ...prev, ...patch }))}
            onSelectLinea={handleSelectLinea}
            onChangeModoPrecio={setModoPrecio}
            onChangePrecioInput={setPrecioInput}
            onChangeCobrarMinM2={setCobrarMinM2}
            onChangeIncluirIva={setIncluirIva}
            onChangeAreaText={setAreaText}
            onChangeEtiquetaPieza={setEtiquetaPieza}
            onChangeExtraPct={setExtraPct}
            onChangeReferencia={setReferencia}
            onAgregarObra={handleAgregarObra}
            onCancelarEdicion={() => setEditingPartidaId(null)}
            onGuardarHistorial={() => {
              const ref =
                referencia.trim() || `${LINEAS_CONFIG[params.linea].nombre} ${params.anchoCm}×${params.altoCm}`;
              setHistorial((prev) => [
                {
                  id: `h-${Date.now()}`,
                  referencia: ref,
                  fecha: new Date().toLocaleDateString('es-MX'),
                  linea: params.linea,
                  anchoCm: params.anchoCm,
                  altoCm: params.altoCm,
                  color: params.color,
                  cantidad: params.cantidad,
                  total: cot.totalFinal,
                },
                ...prev,
              ]);
              setReferencia('');
              showToast('Cotización guardada en historial', true);
            }}
            onGoHoja={handleEntrarHoja}
            onOpenPro={() => openGlobalModal('pro')}
            onOpenPerfilModal={openPerfilModal}
            onOpenFormulaModal={() => openGlobalModal('formula')}
            onSelectFormulaId={setSelectedFormulaId}
            onUpdateRellenoPrecioM2={(materialId, espesorMm, price) => {
              const key = getRellenoPriceKey(materialId, espesorMm);
              setTaller((prev) => ({
                ...prev,
                rellenoPreciosM2: {
                  ...(prev.rellenoPreciosM2 || {}),
                  [key]: price,
                },
              }));
              showToast('Precio m² del panel actualizado', true);
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'hoja' && (
          <HojaCotizacionView
            hoja={hoja}
            taller={taller}
            contratoCliente={contratoCliente}
            inventario={inventario}
            sobrantes={sobrantes}
            obrasAprobadas={obrasAprobadas}
            perfilFotos={perfilFotos}
            onUpdateHoja={(patch) => setHoja((prev) => ({ ...prev, ...patch }))}
            onUpdateTaller={(patch) => setTaller((prev) => ({ ...prev, ...patch }))}
            onUpdateContratoCliente={(patch) =>
              setContratoCliente((prev) => ({ ...prev, ...patch }))
            }
            onEditarPartida={handleEditarPartida}
            onEliminarPartida={(id) =>
              setHoja((prev) => ({ ...prev, partidas: prev.partidas.filter((p) => p.id !== id) }))
            }
            onVaciarHoja={() => setHoja((prev) => ({ ...prev, partidas: [] }))}
            onAgregarPieza={() => handleEntrarTrabajo('ventanas')}
            onApartarStockObra={(rows) => {
              const nombreObra = hoja.proyecto.trim() || `Obra ${new Date().toLocaleDateString('es-MX')}`;
              const nuevos: ObraAprobadaApartado[] = rows.map((r) => ({
                id: `apr-${Date.now()}-${r.key}`,
                proyecto: nombreObra,
                key: r.key,
                linea: r.linea,
                perfilId: r.perfilId,
                color: r.color,
                tramos: r.tramosRequeridos,
                fecha: new Date().toLocaleDateString('es-MX'),
              }));
              setObrasAprobadas((prev) => [...prev, ...nuevos]);
              showToast(`Stock apartado para "${nombreObra}"`, true);
            }}
            onDescontarInventarioObra={(rows) => {
              setInventario((prev) => {
                let next = { ...prev };
                for (const r of rows) {
                  next = descontarInventarioPorPerfilColor(
                    next,
                    r.linea,
                    r.perfilId,
                    r.color,
                    r.tramosRequeridos
                  );
                }
                return next;
              });
              showToast('Material descontado de tu inventario', true);
            }}
            onOpenGlassOptimizer={() => {
              const imported: PiezaVidrioInput[] = [];
              for (const part of hoja.partidas) {
                const partQty = Math.max(1, Number(part.cantidad) || 1);
                const fallbackTipo = part.relleno
                  ? getRellenoLabel(part.relleno, part.vidrio)
                  : undefined;
                for (const vid of part.despiece?.vidrios || []) {
                  if (vid.tipo !== 'vidrio') continue;
                  const tipoFinal = vid.espesorLabel || fallbackTipo || 'Claro 6 mm';
                  imported.push({
                    id: `v-hoja-${part.id}-${imported.length}`,
                    etiqueta: part.etiqueta || part.area || 'Pieza',
                    tipoNombre: tipoFinal,
                    anchoCm: vid.anchoCm,
                    altoCm: vid.altoCm,
                    cantidad: Math.max(1, vid.pzas * partQty),
                    permitirRotacion:
                      typeof vid.permitirRotacion === 'boolean'
                        ? vid.permitirRotacion
                        : !esMaterialDireccional(tipoFinal),
                  });
                }
              }
              if (imported.length > 0) {
                setVidrioPiezasDraft(imported);
              }
              navigateTo('vidrio');
            }}
            onPushSubModal={(sub) => pushNavFrame({ subModal: sub })}
            onRequestBack={requestBack}
            onRegisterCloseSubModal={registerCloseSubModal}
            reminders={cotizacionReminders}
            highlightedReminderId={highlightedReminderId}
            onAddReminder={handleAddReminder}
            onUpdateReminderStatus={handleUpdateReminderStatus}
            onSnoozeReminder={handleSnoozeReminder}
            onDeleteReminder={handleDeleteReminder}
            onNotifyReminderNow={handleNotifyReminderNow}
            onTestPushNotification={handleTestPushNotification}
            onRequestPushPermission={handleRequestPushPermission}
            onShowToast={showToast}
          />
        )}

        {currentView === 'taller' && (
          <TallerView
            taller={taller}
            proActive={proActive}
            formulas={formulas}
            historial={historial}
            onUpdateTaller={(patch) => setTaller((prev) => ({ ...prev, ...patch }))}
            onRestablecerTarifas={() => {
              setTaller((prev) => ({ ...prev, tarifasBase: {} }));
              showToast('Tarifas restablecidas');
            }}
            onOpenPro={() => openGlobalModal('pro')}
            onEntrarInventario={() => handleEntrarInventario()}
            onOpenFormulaModal={() => openGlobalModal('formula')}
            onEliminarFormula={(id) => setFormulas((prev) => prev.filter((f) => f.id !== id))}
            onEliminarHistorial={(id) => setHistorial((prev) => prev.filter((h) => h.id !== id))}
            onLimpiarHistorial={() => setHistorial([])}
            onScheduleHistorialReminder={handleScheduleHistorialReminder}
            onOpenReminders={() => openGlobalModal('reminders')}
            pendingRemindersCount={reminderSummary.pendingCount}
            onShowToast={showToast}
          />
        )}

        {currentView === 'cotizaciones' && (
          <HistorialCotizacionesView onGoHoja={handleEntrarHoja} onShowToast={showToast} />
        )}

        {currentView === 'inventario' && (
          <InventarioView
              inventario={inventario}
              inventarioHerrajes={inventarioHerrajes}
              sobrantes={sobrantes}
              hojasVidrio={hojasVidrio}
              obrasAprobadas={obrasAprobadas}
              hojaCount={hojaPiezasCount}
              perfilFotos={perfilFotos}
              invTab={invTab}
              onChangeInvTab={(tab) => {
                if (tab !== invTab) pushNavFrame({ invTab: tab });
              }}
              onSetInventario={(key, tramos) =>
                setInventario((prev) => {
                  const next = { ...prev };
                  const clean = Math.max(0, Math.round((Number(tramos) || 0) * 10000) / 10000);
                  if (clean <= 0) {
                    delete next[key];
                  } else {
                    next[key] = clean;
                  }
                  return next;
                })
              }
              onSetInventarioHerraje={(id, qty) =>
                setInventarioHerrajes((prev) => ({ ...prev, [id]: qty }))
              }
              onAddSobrante={(item) => {
                setSobrantes((prev) => [
                  {
                    ...item,
                    id: `sob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    fecha: new Date().toLocaleDateString('es-MX'),
                  },
                  ...prev,
                ]);
                showToast(`Sobrante de ${item.largoM.toFixed(2)} m agregado`, true);
              }}
              onUpdateSobranteQty={(id, cantidad) =>
                setSobrantes((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, cantidad: Math.max(1, cantidad) } : s))
                )
              }
              onDeleteSobrante={(id) => {
                setSobrantes((prev) => prev.filter((s) => s.id !== id));
                showToast('Sobrante eliminado');
              }}
              onAddHojaVidrio={(item) => {
                setHojasVidrio((prev) => [
                  {
                    ...item,
                    id: `hv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    fecha: new Date().toLocaleDateString('es-MX'),
                  },
                  ...prev,
                ]);
                showToast(`Hoja ${item.tipoNombre} (${item.anchoCm}×${item.altoCm} cm) agregada`, true);
              }}
              onUpdateHojaVidrioQty={(id, cantidad) =>
                setHojasVidrio((prev) =>
                  prev.map((h) => (h.id === id ? { ...h, cantidad: Math.max(1, cantidad) } : h))
                )
              }
              onDeleteHojaVidrio={(id) => {
                setHojasVidrio((prev) => prev.filter((h) => h.id !== id));
                showToast('Hoja de vidrio eliminada');
              }}
              onLimpiarInventario={() => {
                setInventario({});
                showToast('Inventario puesto en 0');
              }}
              onAgregarApartado={(item) => {
                setObrasAprobadas((prev) => [
                  ...prev,
                  { ...item, id: `apr-${Date.now()}`, fecha: new Date().toLocaleDateString('es-MX') },
                ]);
                showToast('Tramos apartados en obra aprobada', true);
              }}
              onEliminarApartado={(id) => setObrasAprobadas((prev) => prev.filter((o) => o.id !== id))}
              onGoCatalogo={() => navigateTo('catalogo')}
              onGoHoja={handleEntrarHoja}
              onGoVidrioOptimizer={() => navigateTo('vidrio')}
              onOpenPerfilModal={openPerfilModal}
              onPushSubModal={(sub) => pushNavFrame({ subModal: sub })}
              onRequestBack={requestBack}
              onRegisterCloseSubModal={registerCloseSubModal}
              onReplaceSubModalWithPerfil={replaceSubModalWithPerfil}
              onShowToast={showToast}
            />
        )}

        {currentView === 'notas' && (
          <NotasView
            notas={notas}
            onAddNota={(n) =>
              setNotas((prev) => [
                { ...n, id: `nota-${Date.now()}`, fecha: new Date().toLocaleString('es-MX') },
                ...prev,
              ])
            }
            onDeleteNota={(id) => setNotas((prev) => prev.filter((n) => n.id !== id))}
            onConvertirNota={handleConvertirNota}
            onShowToast={showToast}
          />
        )}

        {currentView === 'modulacion' && (
          <ModulacionCortesView
              tarifasBase={taller.tarifasBase}
              proActive={proActive}
              sobrantes={sobrantes}
              step={modStep}
              paso5Tab={modPaso5Tab}
              mosquiteroModalOpen={modMosqOpen}
              onNavigateModState={(patch) =>
                pushNavFrame({
                  ...(patch.step !== undefined ? { modStep: patch.step } : {}),
                  ...(patch.paso5Tab !== undefined ? { modPaso5Tab: patch.paso5Tab } : {}),
                  ...(patch.mosquiteroModalOpen !== undefined
                    ? { modMosqOpen: patch.mosquiteroModalOpen }
                    : {}),
                })
              }
              onPushSubModal={(sub) => pushNavFrame({ subModal: sub })}
              onRequestBack={requestBack}
              onRegisterCloseSubModal={registerCloseSubModal}
              onAddSobrante={(item) => {
                setSobrantes((prev) => [
                  {
                    ...item,
                    id: `sob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    fecha: new Date().toLocaleDateString('es-MX'),
                  },
                  ...prev,
                ]);
              }}
              onSendToHoja={(partida, goToHoja) => {
                const dimCheck = validatePiezaDimensiones(partida.anchoCm, partida.altoCm);
                if (!dimCheck.valid) {
                  showToast(
                    dimCheck.error ||
                      'Medidas sospechosas: el ancho y el alto deben ser mayores a 0 y menores a 600 cm.'
                  );
                  return false;
                }
                setHoja((prev) => ({
                  ...prev,
                  partidas: [...prev.partidas, partida],
                }));
                if (goToHoja) {
                  navigateTo('hoja');
                }
                return true;
              }}
              onSendVidriosToOptimizer={(vidrios) => {
                const piezas: PiezaVidrioInput[] = vidrios
                  .filter((v) => v.tipo === 'vidrio')
                  .map((v, idx) => {
                    const tipoFinal = v.espesorLabel || 'Claro 6 mm';
                    return {
                      id: `v-mod-${Date.now()}-${idx}`,
                      etiqueta: v.nombre,
                      tipoNombre: tipoFinal,
                      anchoCm: v.anchoCm,
                      altoCm: v.altoCm,
                      cantidad: v.pzas,
                      permitirRotacion:
                        typeof v.permitirRotacion === 'boolean'
                          ? v.permitirRotacion
                          : !esMaterialDireccional(tipoFinal),
                    };
                  });
                if (piezas.length > 0) {
                  setVidrioPiezasDraft(piezas);
                }
                navigateTo('vidrio');
              }}
              onShowToast={showToast}
            />
        )}

        {currentView === 'vidrio' && (
          <VidrioOptimizerView
            hojasVidrio={hojasVidrio}
            hojaPartidas={hoja.partidas}
            piezasIniciales={vidrioPiezasDraft}
            onGoInventarioVidrios={() => handleEntrarInventario('vidrios')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'catalogo' && (
          <CatalogoView
            perfilFotos={perfilFotos}
            catalogoTab={catalogoTab}
            onChangeCatalogoTab={(tab) => {
              if (tab !== catalogoTab) pushNavFrame({ catalogoTab: tab });
            }}
            onOpenPerfilModal={openPerfilModal}
            onUploadPerfilFoto={handleUploadPerfilFoto}
            onRemovePerfilFoto={handleRemovePerfilFoto}
            onOpenSugerencias={() => openGlobalModal('sugerencias')}
          />
        )}

        {currentView === 'terminos' && (
          <TerminosCondicionesView onBack={requestBack} />
        )}

        {currentView === 'privacidad' && (
          <AvisoPrivacidadView onBack={requestBack} />
        )}
        </div>
        </ErrorBoundary>
      </main>

      <SideDrawer
        open={drawerOpen}
        proActive={proActive}
        isTrialActive={isTrialActive}
        deviceId={deviceId}
        theme={theme}
        cloudAccountEmail={cloudAccountSession?.email || null}
        isCloudBackupEligible={isCloudBackupEligible}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onClose={requestBack}
        onOpenPro={() => openModalFromDrawer('pro')}
        onOpenCloudBackup={() => openModalFromDrawer('cloudBackup')}
        onOpenRecomendar={() => openModalFromDrawer('recomendar')}
        onOpenSugerencias={() => openModalFromDrawer('sugerencias')}
        onOpenTutorial={() => openModalFromDrawer('tutorial')}
        onOpenLegal={(doc) => openScreenFromDrawer(doc)}
        showInstallApp={!pwa.isInstalled}
        onInstallApp={() => void handleInstallApp(true)}
        pendingRemindersCount={reminderSummary.pendingCount}
        dueRemindersCount={reminderSummary.dueCount}
        onOpenReminders={() => openModalFromDrawer('reminders')}
        onOpenCotizaciones={() => openScreenFromDrawer('cotizaciones')}
      />

      <ErrorBoundary
        isModal
        resetKey={proModalOpen}
        title="No se pudo abrir la ventana de Licencia PRO"
        onGoHome={goHome}
      >
      <ProModal
        open={proModalOpen}
        deviceId={deviceId}
        licencia={licencia}
        proActive={proActive}
        trialExpiresAt={trialExpiresAt}
        whatsappNumber={sugerenciasWhatsapp}
        defaultEmail={cloudAccountSession?.email || licencia?.linkedEmail || ''}
        referredById={referredById}
        onClose={requestBack}
        onActivateLic={async (lic) => {
          const normKey = (lic.activatedKey || '').trim().toUpperCase();
          if (normKey && revokedKeysRef.current.has(normKey)) {
            return {
              ok: false,
              error: 'Este código de activación fue revocado por el administrador y ya no puede utilizarse.',
            };
          }

          const cloudRes = await activateKeyInCloud({
            deviceId,
            key: normKey,
            planCode: lic.planCode,
            planLabel: lic.planLabel,
            expiresAt: lic.expiresAt,
            cliente: hoja.proyecto.trim() || taller.nombre || '',
            deviceLabel: detectDeviceLabel(),
            linkedEmail: lic.linkedEmail,
          });

          if (!cloudRes.ok && !cloudRes.offline) {
            if (cloudRes.revoked && normKey) {
              revokedKeysRef.current.add(normKey);
              setRevokedKeys((prev) => (prev.includes(normKey) ? prev : [...prev, normKey]));
            }
            return {
              ok: false,
              error: cloudRes.error || 'Este código fue revocado y ya no puede activarse.',
            };
          }

          saveTrialRevoked(false);
          setTrialRevoked(false);
          setRevokedDevicesMap((prev) => {
            const norm = deviceId.trim().toUpperCase();
            if (!(norm in prev)) return prev;
            const next = { ...prev };
            delete next[norm];
            saveRevokedDevicesMap(next);
            return next;
          });
          saveLicencia(lic);
          setLicencia(lic);

          // Registrar automáticamente en el historial local de referidos si fue invitado por un colega
          if (
            referredById &&
            referredById.trim().toUpperCase() !== deviceId.trim().toUpperCase()
          ) {
            const amountByCode: Record<string, string> = {
              M: '$350 MXN',
              Q: '$950 MXN',
              A: '$1,800 MXN',
              G: '$0 MXN',
              V: 'Vitalicia',
            };
            const updatedRefs = addReferralHistoryRecord({
              referrerId: referredById,
              referredDeviceId: deviceId,
              referredName: taller.nombre || hoja.proyecto.trim() || '',
              planCode: lic.planCode,
              planLabel: lic.planLabel,
              amountLabel: amountByCode[lic.planCode] || '',
            });
            setReferralHistory(updatedRefs);
          }

          if (cloudRes.ok && cloudRes.devices && cloudRes.stats) {
            applyCloudSnapshot({
              devices: cloudRes.devices,
              adminKeys: cloudRes.adminKeys || [],
              revokedKeys: cloudRes.revokedKeys,
              stats: cloudRes.stats,
              serverTime: cloudRes.serverTime || Date.now(),
              device: cloudRes.device,
            });
          } else {
            void syncDeviceToCloud({
              deviceId,
              cliente: hoja.proyecto.trim() || taller.nombre || '',
              deviceLabel: detectDeviceLabel(),
              eventType: 'license_sync',
              licencia: lic,
            }).then(applyCloudSnapshot);
          }
          return { ok: true };
        }}
        onDeactivateLic={() => {
          saveLicencia(null);
          setLicencia(null);
          void syncDeviceToCloud({
            deviceId,
            cliente: hoja.proyecto.trim() || taller.nombre || '',
            deviceLabel: detectDeviceLabel(),
            eventType: 'license_sync',
            licencia: null,
          }).then(applyCloudSnapshot);
          showToast('Licencia desactivada');
        }}
        onShowToast={showToast}
      />
      </ErrorBoundary>

      <AdminAuthModal
        open={adminAuthOpen}
        onClose={requestBack}
        onSuccess={() => {
          replaceGlobalModal('adminAuth', 'adminModal');
        }}
      />

      <AdminModal
        open={adminModalOpen}
        deviceId={deviceId}
        licencia={licencia}
        isTrialActive={isTrialActive}
        trialExpiresAt={trialExpiresAt}
        adminKeys={adminKeys}
        revokedDevicesMap={revokedDevicesMap}
        revokedKeys={revokedKeys}
        formulas={formulas}
        backupData={{
          app: 'Aluminero Pro',
          version: 1,
          exportedAt: new Date().toISOString(),
          perfilFotos,
          notas,
          taller,
          formulas,
          inventario,
          inventarioHerrajes,
          sobrantes,
          hojasVidrio,
          obrasAprobadas,
          historial,
          sugerenciasWhatsapp,
          trabajosAntesDespues,
          recordatorios: cotizacionReminders,
        }}
        cloudDevices={cloudDevices}
        cloudStats={cloudStats}
        cloudConnected={cloudConnected}
        cloudRefreshing={cloudRefreshing}
        cloudLastSyncAt={cloudLastSyncAt}
        onRefreshCloud={refreshCloudNow}
        onCloudActivateDevice={async (payload) => {
          const normTarget = normalizeDeviceIdInput(payload.deviceId, deviceId);
          if (!payload.revoke && !payload.block && !payload.recordKeyOnly) {
            if (normTarget === deviceId.trim().toUpperCase()) {
              setAccessBlockedSync(false);
            }
            setRevokedDevicesMap((prev) => {
              if (!(normTarget in prev)) return prev;
              const next = { ...prev };
              delete next[normTarget];
              saveRevokedDevicesMap(next);
              return next;
            });
            if (payload.key) {
              const nk = payload.key.trim().toUpperCase();
              revokedKeysRef.current.delete(nk);
              setRevokedKeys((prev) => prev.filter((k) => k.trim().toUpperCase() !== nk));
            }
          }
          const snap = await updateDeviceLicenseInCloud({ ...payload, deviceId: normTarget });
          applyCloudSnapshot(snap);
          return Boolean(snap);
        }}
        onClose={requestBack}
        onActivateLic={(lic) => {
          setAccessBlockedSync(false);
          saveTrialRevoked(false);
          setTrialRevoked(false);
          setRevokedDevicesMap((prev) => {
            const norm = deviceId.trim().toUpperCase();
            if (!(norm in prev)) return prev;
            const next = { ...prev };
            delete next[norm];
            saveRevokedDevicesMap(next);
            return next;
          });
          if (lic.activatedKey) {
            const nk = lic.activatedKey.trim().toUpperCase();
            revokedKeysRef.current.delete(nk);
            setRevokedKeys((prev) => prev.filter((k) => k.trim().toUpperCase() !== nk));
          }
          const assignedLic: LicenciaState = { ...lic, adminAssigned: true };
          saveLicencia(assignedLic);
          setLicencia(assignedLic);
        }}
        onRecordAdminKey={(rec) => {
          const sig = buildAdminKeySignature(rec);
          if (deletedAdminKeySigsRef.current.has(sig)) {
            deletedAdminKeySigsRef.current.delete(sig);
            saveDeletedAdminKeySigs(Array.from(deletedAdminKeySigsRef.current));
          }
          const normDev = rec.deviceId.trim().toUpperCase();
          const normKey = rec.key.trim().toUpperCase();
          revokedKeysRef.current.delete(normKey);
          setRevokedKeys((prev) => prev.filter((k) => k.trim().toUpperCase() !== normKey));
          setRevokedDevicesMap((prev) => {
            if (!(normDev in prev)) return prev;
            const next = { ...prev };
            delete next[normDev];
            saveRevokedDevicesMap(next);
            return next;
          });
          setAdminKeys((prev) => {
            const next = [
              { ...rec, revoked: false, revokedAt: null },
              ...prev.filter((item) => buildAdminKeySignature(item) !== sig),
            ];
            saveAdminKeys(next);
            return next;
          });
        }}
        onDeleteAdminKey={async (rec) => {
          const normDev = normalizeDeviceIdInput(rec.deviceId);
          if (rec.key) {
            const sig = buildAdminKeySignature(rec);
            deletedAdminKeySigsRef.current.add(sig);
            saveDeletedAdminKeySigs(Array.from(deletedAdminKeySigsRef.current));
            setAdminKeys((prev) => {
              const next = prev.filter(
                (item) =>
                  item.id !== rec.id &&
                  buildAdminKeySignature(item) !== sig &&
                  normalizeDeviceIdInput(item.deviceId) !== normDev
              );
              saveAdminKeys(next);
              return next;
            });
          } else {
            setAdminKeys((prev) => {
              const next = prev.filter((item) => normalizeDeviceIdInput(item.deviceId) !== normDev);
              saveAdminKeys(next);
              return next;
            });
          }
          setCloudDevices((prev) =>
            prev.filter((d) => normalizeDeviceIdInput(d.deviceId) !== normDev)
          );
          if (normDev === deviceId.trim().toUpperCase()) {
            setAccessBlockedSync(false);
          }
          try {
            const snap = await deleteAdminKeyInCloud({
              id: rec.id,
              deviceId: normDev,
              key: rec.key || '',
              deleteDevice: true,
            });
            if (snap) {
              applyCloudSnapshot(snap);
            }
          } catch (err) {
            console.error('Error al borrar en nube:', err);
          }
          showToast('Usuario eliminado de la lista de historial');
        }}
        onRevokeDevicePromo={async (targetDeviceId, keyRecordId, keyCode) => {
          const normTarget = normalizeDeviceIdInput(targetDeviceId, deviceId);
          const now = Date.now();
          const matchedHistoryKey = adminKeys.find(
            (item) =>
              (keyRecordId ? item.id === keyRecordId : normalizeDeviceIdInput(item.deviceId) === normTarget) &&
              !item.revoked
          )?.key;
          const matchedDeviceKey = cloudDevices.find(
            (d) => normalizeDeviceIdInput(d.deviceId) === normTarget
          )?.lastKey;
          const resolvedKey = (keyCode || matchedHistoryKey || matchedDeviceKey || '').trim().toUpperCase();

          if (resolvedKey) {
            revokedKeysRef.current.add(resolvedKey);
            setRevokedKeys((prev) => (prev.includes(resolvedKey) ? prev : [...prev, resolvedKey]));
          }

          setAdminKeys((prev) => {
            const next = prev.map((item) => {
              const matchesTarget =
                normalizeDeviceIdInput(item.deviceId) === normTarget ||
                (keyRecordId ? item.id === keyRecordId : false) ||
                (resolvedKey ? item.key.trim().toUpperCase() === resolvedKey : false);
              if (!matchesTarget) return item;
              return { ...item, revoked: true, revokedAt: now };
            });
            saveAdminKeys(next);
            return next;
          });

          setRevokedDevicesMap((prev) => {
            const next = { ...prev, [normTarget]: now };
            saveRevokedDevicesMap(next);
            return next;
          });

          const selfKeyUpper = (licenciaRef.current?.activatedKey || '').trim().toUpperCase();
          if (
            normTarget === deviceId.trim().toUpperCase() ||
            (resolvedKey && selfKeyUpper === resolvedKey)
          ) {
            setAccessBlockedSync(false);
            revokeLocalProAccess({ showMessage: false, markTrialRevoked: true });
          }

          setCloudDevices((prev) =>
            prev.map((d) =>
              normalizeDeviceIdInput(d.deviceId) === normTarget
                ? {
                    ...d,
                    proActive: false,
                    revoked: true,
                    revokedAt: now,
                    blocked: false,
                    blockedAt: null,
                    planCode: 'FREE',
                    planLabel: 'Versión Gratuita',
                    status: 'free',
                    expiresAt: null,
                    trialActive: false,
                    adminAssigned: false,
                    updatedAt: now,
                  }
                : d
            )
          );

          let snap: CloudSyncSnapshot | null = null;
          try {
            snap = await updateDeviceLicenseInCloud({
              deviceId: normTarget,
              key: resolvedKey || undefined,
              revoke: true,
            });
          } catch (err) {
            console.error('Error al revocar promoción en la nube:', err);
            snap = null;
          }
          applyCloudSnapshot(snap);
          if (snap) {
            showToast('Promoción revocada en la nube. El usuario regresó a Versión Gratuita.');
          } else {
            showToast('Error al conectar con la nube para revocar la promoción.');
          }
          return Boolean(snap);
        }}
        onRevokeFreeAccess={async (targetDeviceId, keyCode) => {
          const normTarget = normalizeDeviceIdInput(targetDeviceId, deviceId);
          const now = Date.now();
          const matchedDeviceKey = cloudDevices.find(
            (d) => normalizeDeviceIdInput(d.deviceId) === normTarget
          )?.lastKey;
          const resolvedKey = (keyCode || matchedDeviceKey || '').trim().toUpperCase();

          if (resolvedKey) {
            revokedKeysRef.current.add(resolvedKey);
            setRevokedKeys((prev) => (prev.includes(resolvedKey) ? prev : [...prev, resolvedKey]));
          }

          setAdminKeys((prev) => {
            const next = prev.map((item) =>
              normalizeDeviceIdInput(item.deviceId) === normTarget
                ? { ...item, revoked: true, revokedAt: now }
                : item
            );
            saveAdminKeys(next);
            return next;
          });

          setRevokedDevicesMap((prev) => {
            const next = { ...prev, [normTarget]: now };
            saveRevokedDevicesMap(next);
            return next;
          });

          setCloudDevices((prev) =>
            prev.map((d) =>
              normalizeDeviceIdInput(d.deviceId) === normTarget
                ? {
                    ...d,
                    proActive: false,
                    revoked: true,
                    revokedAt: now,
                    blocked: true,
                    blockedAt: now,
                    planCode: 'BLOCKED',
                    planLabel: 'Bloqueado',
                    status: 'blocked',
                    expiresAt: null,
                  }
                : d
            )
          );

          if (normTarget === deviceId.trim().toUpperCase()) {
            setAccessBlockedSync(true);
            revokeLocalProAccess({ showMessage: false, markTrialRevoked: true });
          }

          let snap: CloudSyncSnapshot | null = null;
          try {
            snap = await updateDeviceLicenseInCloud({
              deviceId: normTarget,
              key: resolvedKey || undefined,
              block: true,
            });
          } catch (err) {
            console.error('Error al revocar acceso en la nube:', err);
            snap = null;
          }
          applyCloudSnapshot(snap);
          if (snap) {
            showToast('Acceso gratuito revocado. El usuario verá un aviso de acceso suspendido.');
          } else {
            showToast('Error al conectar con la nube para revocar el acceso.');
          }
          return Boolean(snap);
        }}
        onImportFormulas={(imported) => {
          setFormulas((prev) => {
            const byId = new Map(prev.map((f) => [f.id, f]));
            for (const f of imported) {
              byId.set(f.id, f);
            }
            const next = Array.from(byId.values());
            saveFormulas(next);
            return next;
          });
        }}
        onImportBackup={handleImportBackup}
        sugerenciasWhatsapp={sugerenciasWhatsapp}
        onSaveSugerenciasWhatsapp={(phone) => {
          if (!phone.trim()) {
            const clean = saveSugerenciasWhatsapp('');
            setSugerenciasWhatsapp(clean);
            return;
          }
          const clean = saveSugerenciasWhatsapp(phone);
          setSugerenciasWhatsapp(clean);
        }}
        trabajosAntesDespues={trabajosAntesDespues}
        onPublishTrabajoAprobado={(item) => {
          setTrabajosAntesDespues((prev) => [
            {
              ...item,
              id: `ad-${Date.now()}`,
              fecha: new Date().toLocaleDateString('es-MX'),
              aprobado: true,
            },
            ...prev,
          ]);
        }}
        onDeleteTrabajoAprobado={(id) => {
          setTrabajosAntesDespues((prev) => prev.filter((t) => t.id !== id));
          showToast('Trabajo eliminado de la galería');
        }}
        referralHistory={referralHistory}
        onAddReferralRecord={(rec) => {
          const updated = addReferralHistoryRecord(rec);
          setReferralHistory(updated);
        }}
        onDeleteReferralRecord={(id) => {
          setReferralHistory((prev) => {
            const next = prev.filter((item) => item.id !== id);
            saveReferralHistory(next);
            return next;
          });
          showToast('Registro de referido eliminado');
        }}
        onShowToast={showToast}
      />

      <RecomendarModal
        open={recomendarOpen}
        deviceId={deviceId}
        defaultSenderName={taller.nombre}
        referralHistory={referralHistory}
        onClose={requestBack}
        onShowToast={showToast}
      />

      <ColleagueReferralWelcomeModal
        open={isReferralWelcomeShowing}
        referral={savedColleagueReferral}
        referredById={referredById}
        deviceId={deviceId}
        whatsappNumber={sugerenciasWhatsapp}
        onExploreFree={() => {
          goHome();
          if (!isRunningInIframe() && typeof window !== 'undefined' && window.location.search.includes('ref=')) {
            window.setTimeout(() => {
              try {
                const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
                window.history.replaceState(
                  window.history.state || { app: 'aluminero-pro', depth: 0, view: 'menu' },
                  document.title,
                  cleanUrl
                );
              } catch {
                // ignorar si history.replaceState no está permitido
              }
            }, 80);
          }
        }}
        onShowToast={showToast}
      />

      <SugerenciasModal
        open={sugerenciasOpen}
        whatsappNumber={sugerenciasWhatsapp}
        deviceId={deviceId}
        onClose={requestBack}
        onShowToast={showToast}
      />

      <CalculadoraModal
        open={calculadoraOpen}
        onClose={requestBack}
        onShowToast={showToast}
      />

      {antesDespuesOpen && (
        <ErrorBoundary
          isModal
          resetKey={antesDespuesOpen}
          title="No se pudo abrir la Galería Antes y Después"
          onGoHome={goHome}
        >
          <AntesDespuesModal
            open={antesDespuesOpen}
            trabajos={trabajosAntesDespues}
            whatsappNumber={sugerenciasWhatsapp}
            deviceId={deviceId}
            onSavePersonalTrabajo={(item) => {
              setTrabajosAntesDespues((prev) => [
                {
                  ...item,
                  id: `ad-per-${Date.now()}`,
                  fecha: new Date().toLocaleDateString('es-MX'),
                  aprobado: true,
                  esPersonal: true,
                },
                ...prev,
              ]);
              showToast('Trabajo guardado en tu galería personal (sin internet)', true);
            }}
            onDeletePersonalTrabajo={(id) => {
              setTrabajosAntesDespues((prev) => prev.filter((t) => t.id !== id));
              showToast('Trabajo eliminado de tu galería');
            }}
            onClose={requestBack}
            onShowToast={showToast}
          />
        </ErrorBoundary>
      )}

      <TutorialModal open={tutorialOpen} onClose={requestBack} />

      <CloudBackupModal
        open={cloudBackupOpen}
        deviceId={deviceId}
        licencia={licencia}
        session={cloudAccountSession}
        isEligible={isCloudBackupEligible}
        syncing={cloudAccountSyncing}
        onClose={requestBack}
        onOpenProPlans={() => openGlobalModal('pro')}
        onRegisterAccount={async (email, password) => {
          const res = await registerCloudAccount({
            email,
            password,
            deviceId,
            licencia: licenciaRef.current,
            backup: buildCurrentCloudBackup(),
          });
          if (!res.ok || !res.sessionToken) {
            return { ok: false, error: res.error || 'No se pudo vincular la cuenta.' };
          }
          const nextSession: CloudAccountSession = {
            email: res.email || email,
            sessionToken: res.sessionToken,
            linkedDeviceId: deviceId,
            lastBackedUpAt: res.lastBackedUpAt ?? Date.now(),
          };
          saveCloudAccountSession(nextSession);
          setCloudAccountSession(nextSession);
          if (res.snapshot) applyCloudSnapshot(res.snapshot);
          showToast(`Correo ${nextSession.email} vinculado y respaldo guardado en la nube`, true);
          return { ok: true };
        }}
        onLoginAccount={async (email, password) => {
          const res = await loginCloudAccount({
            email,
            password,
            deviceId,
            licencia: licenciaRef.current,
          });
          if (!res.ok || !res.sessionToken) {
            return { ok: false, error: res.error || 'No se pudo iniciar sesión.' };
          }

          skipNextAutoBackupRef.current = true;
          saveTrialRevoked(false);
          setTrialRevoked(false);
          setRevokedDevicesMap((prev) => {
            const norm = deviceId.trim().toUpperCase();
            if (!(norm in prev)) return prev;
            const next = { ...prev };
            delete next[norm];
            saveRevokedDevicesMap(next);
            return next;
          });

          if (res.licencia) {
            const restoredLic: LicenciaState = { ...res.licencia, adminAssigned: true };
            saveLicencia(restoredLic);
            setLicencia(restoredLic);
          }

          if (res.backup) {
            if (res.backup.hoja && typeof res.backup.hoja === 'object') {
              setHoja(res.backup.hoja);
            }
            if (Array.isArray(res.backup.historial)) {
              setHistorial(res.backup.historial);
            }
            if (res.backup.contratoCliente && typeof res.backup.contratoCliente === 'object') {
              setContratoCliente(res.backup.contratoCliente);
            }
            if (res.backup.inventario && typeof res.backup.inventario === 'object') {
              setInventario(res.backup.inventario);
            }
            if (res.backup.inventarioHerrajes && typeof res.backup.inventarioHerrajes === 'object') {
              setInventarioHerrajes(res.backup.inventarioHerrajes);
            }
            if (Array.isArray(res.backup.sobrantes)) {
              setSobrantes(res.backup.sobrantes);
            }
            if (Array.isArray(res.backup.hojasVidrio)) {
              setHojasVidrio(res.backup.hojasVidrio);
            }
            if (Array.isArray(res.backup.obrasAprobadas)) {
              setObrasAprobadas(res.backup.obrasAprobadas);
            }
            if (Array.isArray(res.backup.notas)) {
              setNotas(res.backup.notas);
            }
            if (Array.isArray(res.backup.formulas)) {
              setFormulas(res.backup.formulas);
            }
          }

          const nextSession: CloudAccountSession = {
            email: res.email || email,
            sessionToken: res.sessionToken,
            linkedDeviceId: deviceId,
            lastBackedUpAt: res.lastBackedUpAt ?? Date.now(),
          };
          saveCloudAccountSession(nextSession);
          setCloudAccountSession(nextSession);
          if (res.snapshot) applyCloudSnapshot(res.snapshot);
          showToast(
            res.replacedPreviousDevice
              ? 'Cuenta restaurada en este equipo. Se cerró la sesión en el celular anterior.'
              : 'Cuenta iniciada y respaldo restaurado en la nube',
            true
          );
          return { ok: true };
        }}
        onSyncNow={async () => {
          if (!cloudAccountSession) return;
          setCloudAccountSyncing(true);
          try {
            const res = await uploadCloudAccountBackup({
              email: cloudAccountSession.email,
              sessionToken: cloudAccountSession.sessionToken,
              deviceId,
              licencia: licenciaRef.current,
              backup: buildCurrentCloudBackup(),
            });
            if (res.sessionExpired) {
              handleRemoteSessionClosed();
              return;
            }
            if (res.ok) {
              const ts = res.updatedAt || Date.now();
              setCloudAccountSession((prev) => (prev ? { ...prev, lastBackedUpAt: ts } : prev));
              showToast('Respaldo de cotizaciones e inventario guardado en la nube', true);
            } else {
              showToast(res.error || 'No se pudo respaldar en la nube');
            }
          } finally {
            setCloudAccountSyncing(false);
          }
        }}
        onLogout={async () => {
          if (cloudAccountSession) {
            await logoutCloudAccount({
              email: cloudAccountSession.email,
              sessionToken: cloudAccountSession.sessionToken,
              deviceId,
            });
          }
          saveCloudAccountSession(null);
          setCloudAccountSession(null);
          showToast('Sesión de respaldo en la nube cerrada en este equipo');
        }}
      />

      <PwaInstallGuideModal
        open={installGuideOpen && !pwa.isInstalled && !isReferralWelcomeShowing}
        isIOS={pwa.isIOS}
        onClose={requestBack}
      />

      <FormulaModal
        open={formulaModalOpen}
        linea={params.linea}
        tolerancias={params.tolerancias}
        formulas={formulas}
        onClose={requestBack}
        onSaveFormula={(nombre, linea, tolerancias) => {
          const newId = `f-${Date.now()}`;
          setFormulas((prev) => [...prev, { id: newId, nombre, linea, tolerancias }]);
          setSelectedFormulaId(newId);
          setParams((prev) => ({ ...prev, tolerancias: { ...tolerancias } }));
          showToast('Fórmula personalizada guardada', true);
        }}
        onApplyFormula={(f) => {
          setSelectedFormulaId(f.id);
          setParams((prev) => ({ ...prev, tolerancias: { ...f.tolerancias } }));
          showToast(`Fórmula "${f.nombre}" aplicada`, true);
        }}
        onDeleteFormula={(id) => {
          setFormulas((prev) => prev.filter((f) => f.id !== id));
          if (selectedFormulaId === id) {
            setSelectedFormulaId('std');
            setParams((prev) => ({
              ...prev,
              tolerancias: { ...LINEAS_CONFIG[prev.linea].toleranciasDefault },
            }));
          }
          showToast('Fórmula eliminada');
        }}
      />

      <PerfilModal
        perfilId={globalModals.includes('perfil') ? perfilModalId : null}
        fotoRealUrl={perfilModalId ? getPerfilFotoUrl(perfilFotos, perfilModalId, params.linea) : undefined}
        onClose={requestBack}
        onUploadFoto={handleUploadPerfilFoto}
        onRemoveFoto={handleRemovePerfilFoto}
      />

      <RemindersModal
        open={remindersModalOpen}
        onClose={requestBack}
        reminders={cotizacionReminders}
        defaultProyecto={hoja.proyecto || ''}
        defaultTotal={hojaTotalAprox}
        defaultPartidasCount={hoja.partidas.length}
        defaultTelefono={hoja.clienteTel || contratoCliente.telefono || ''}
        tallerNombre={taller.nombre}
        highlightedReminderId={highlightedReminderId}
        onAddReminder={handleAddReminder}
        onUpdateStatus={handleUpdateReminderStatus}
        onSnoozeReminder={handleSnoozeReminder}
        onDeleteReminder={handleDeleteReminder}
        onNotifyNow={handleNotifyReminderNow}
        onTestPushNotification={handleTestPushNotification}
        onRequestPermission={handleRequestPushPermission}
        onShowToast={showToast}
      />

      <FloatingInstallButton
        visible={
          currentView === 'menu' &&
          !pwa.isInstalled &&
          !installFabDismissed &&
          !accessBlocked &&
          !isReferralWelcomeShowing
        }
        onInstall={() => void handleInstallApp(false)}
        onDismiss={() => setInstallFabDismissed(true)}
      />

      <FloatingAssistant
        whatsappNumber={sugerenciasWhatsapp}
        deviceId={deviceId}
        onShowToast={showToast}
      />

      <LevantamientoRapido
        onSetHojaProyecto={handleSetHojaProyectoFromLev}
        onBatchSendToHoja={handleBatchSendToHojaFromLev}
        onOpenModulacion={() => navigateTo('modulacion', { modStep: 1 })}
        onShowToast={showToast}
      />

      {levBatchConfirmOpen && pendingLevBatch && (
        <div
          id="modal-lev-batch-confirm"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar envío de levantamiento a Hoja de Cotización"
          className="fixed inset-0 z-[9980] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-[420px] rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border border-slate-200">
            <h2 className="m-0 text-[18px] font-extrabold text-slate-900">
              Ya hay partidas en tu Hoja
            </h2>
            <p className="m-0 mt-2 text-[13px] text-slate-600 leading-relaxed">
              Tu Hoja de Cotización tiene actualmente{' '}
              <strong>{hoja.partidas.length} partida(s)</strong>. Se enviarán{' '}
              <strong>{pendingLevBatch.partidas.length} nueva(s)</strong> desde el levantamiento de{' '}
              <strong>{pendingLevBatch.draft.cliente || 'Cliente General'}</strong>.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                id="btn-lev-batch-replace"
                onClick={() => {
                  const batch = pendingLevBatch;
                  requestBack();
                  commitBatchPartidasToHoja(
                    'replace',
                    batch.draft,
                    batch.partidas,
                    batch.skippedProCount
                  );
                }}
                className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer"
              >
                Reemplazar partidas actuales
              </button>
              <button
                type="button"
                id="btn-lev-batch-append"
                onClick={() => {
                  const batch = pendingLevBatch;
                  requestBack();
                  commitBatchPartidasToHoja(
                    'append',
                    batch.draft,
                    batch.partidas,
                    batch.skippedProCount
                  );
                }}
                className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13.5px] cursor-pointer"
              >
                Agregar a las existentes
              </button>
              <button
                type="button"
                id="btn-lev-batch-cancel"
                onClick={() => {
                  setPendingLevBatch(null);
                  requestBack();
                }}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {accessBlocked && !adminModalOpen && !adminAuthOpen && (
        <div
          id="modal-access-suspended"
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[9990] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-5"
        >
          <div className="w-full max-w-[400px] rounded-2xl bg-white text-slate-900 p-6 shadow-2xl border border-red-200 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center text-[28px]">
              ⛔
            </div>
            <h2 className="m-0 text-[19px] font-extrabold text-slate-900">Acceso suspendido</h2>
            <p className="m-0 mt-2 text-[13.5px] text-slate-600 leading-relaxed">
              El acceso a Aluminero Pro para este equipo (
              <span className="mono font-bold text-slate-800">{deviceId}</span>) fue suspendido por el administrador.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  await verifyAndSyncClientStatus();
                  if (accessBlockedRef.current) {
                    showToast('El acceso de este equipo sigue suspendido.');
                  } else {
                    showToast('Acceso restablecido', true);
                  }
                }}
                className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13.5px] cursor-pointer"
              >
                Verificar estado
              </button>
              <button
                type="button"
                onClick={() => openGlobalModal('adminAuth')}
                className="text-[11.5px] font-semibold text-slate-500 hover:text-slate-800 bg-transparent border-0 py-1 cursor-pointer"
              >
                Acceso Administrador
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 rounded-xl text-[13.5px] font-bold shadow-2xl max-w-[90vw] text-center ${
            toast.topSuccess
              ? 'top-[70px] bg-gradient-to-br from-green-600 to-green-700 text-white border border-green-300 toast-slide-down'
              : 'bottom-5 bg-slate-900 text-white border border-slate-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
