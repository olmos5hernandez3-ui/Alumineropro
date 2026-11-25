import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  AdminMessageItem,
  buildColleaguePromoWhatsappUrl,
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
  isColleaguePromoPlan,
  isEligibleForCloudBackup,
  isFeatureProRequired,
  isOneYearProPlan,
  isProActive,
  isTallerOnboardingComplete,
  isUnassignedAutoTrialDevice,
  LINEAS_CONFIG,
  LineaId,
  normalizeDeviceIdInput,
  normalizeLineaId,
  parseNotaACotizacion,
  parseReferralFromSearch,
  PartidaObra,
  PerfilCatalogoId,
  PROMO_COLEGA_ALREADY_USED_ERROR,
  ReferencePricesDoc,
  round2,
  TrabajoParams,
  UsageStats30d,
  validatePiezaDimensiones,
  cloneHomeMenuLayout,
  DEFAULT_HOME_MENU_LAYOUT,
  getHomeMenuTier,
  HomeMenuLayout,
  normalizeHomeMenuLayout,
  parseAdminUrlShortcut,
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
  saveHomeMenuLayoutToCloud,
  subscribeAdminMessages,
  subscribeCloudDevices,
  subscribeReferencePrices,
  syncDeviceToCloud,
  syncTallerProfileToCloud,
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
  captureReferredByNameFromSearch,
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
  saveCotizacionesGuardadas,
  saveCotizacionReminders,
  saveDeletedAdminKeySigs,
  SavedColleagueReferral,
  AppSkin,
  AppSkinVariant,
  AppTheme,
  getSystemPrefersDark,
  getUnlockedSkinsForLicense,
  isSkinUnlockedForLicense,
  resolveAppTheme,
  ResolvedAppTheme,
  loadAdminMessagesCache,
  loadLegalDisclaimerAccepted,
  loadPromoColegaUsage,
  loadReadAdminMessageIds,
  loadReferencePricesCache,
  loadSkin,
  loadSkinVariant,
  markAdminMessageIdRead,
  normalizeSkinVariantForSkin,
  PromoColegaUsageRecord,
  saveAdminMessagesCache,
  saveFormulas,
  saveHistorial,
  saveHoja,
  saveHojasVidrio,
  saveInventario,
  saveInventarioHerrajes,
  saveLicencia,
  saveLegalDisclaimerAccepted,
  saveNotas,
  saveObrasAprobadas,
  savePerfilFotos,
  savePromoColegaUsage,
  saveReferencePricesCache,
  saveReferralHistory,
  saveRevokedDevicesMap,
  saveSkin,
  saveSkinVariant,
  saveSobrantes,
  saveSugerenciasWhatsapp,
  saveTaller,
  saveTermsAcceptedAt,
  saveTheme,
  saveTrabajosAntesDespues,
  saveTrialRevoked,
  loadGuidedTutorialSeen,
  saveGuidedTutorialSeen,
  loadHomeMenuLayout,
  saveHomeMenuLayout,
  loadCatalogVigenciaLabel,
  saveCatalogVigenciaLabel,
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
import { aggregateModulacionJobs } from './utils/modulacionLogic';
import { useOnlineStatus, usePWAInstall } from './utils/usePWAInstall';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  connectGoogleAccountWithFallback,
  consumeGoogleRedirectResult,
  signOutFirebase,
  subscribeFirebaseAuth,
} from './firebase';
import {
  enqueueOfflineCotizacion,
  flushOfflineCotizacionesQueue,
  loadOfflineCotizacionesQueue,
  OFFLINE_SYNC_QUEUE_EVENT,
  type OfflineCotizacionQueueItem,
} from './utils/offlineSyncQueue';
import {
  getScreenTransitionClasses,
  SCREEN_EXIT_DURATION_MS,
  type NavTransitionDir,
  type ScreenTransitionPhase,
} from './utils/screenTransition';
import { ScreenId, SideDrawer, TopBar } from './components/TopBarAndDrawer';
import { MainMenuView } from './components/MainMenuView';
import { TrabajoView } from './components/TrabajoView';
import { AdminGateModal } from './components/AdminGateModal';
import { InteractiveTutorialModal } from './components/InteractiveTutorialModal';
import { UnifiedWorkshopGateModal } from './components/UnifiedWorkshopGateModal';
import {
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
} from './components/Modals';
import { FloatingAssistant } from './components/FloatingAssistant';

const NAVIDENA_SNOW_FLAKES = [
  { left: '6%', size: 4, duration: '11s', delay: '0s', drift: '14px' },
  { left: '14%', size: 3, duration: '14s', delay: '-4s', drift: '-12px' },
  { left: '23%', size: 5, duration: '12.5s', delay: '-2s', drift: '18px' },
  { left: '34%', size: 3.5, duration: '15s', delay: '-7s', drift: '-10px' },
  { left: '46%', size: 4, duration: '11.8s', delay: '-1s', drift: '16px' },
  { left: '58%', size: 5, duration: '13.4s', delay: '-6s', drift: '-15px' },
  { left: '69%', size: 3, duration: '16s', delay: '-3s', drift: '12px' },
  { left: '78%', size: 4.5, duration: '12s', delay: '-8s', drift: '-14px' },
  { left: '87%', size: 3.5, duration: '14.5s', delay: '-5s', drift: '10px' },
  { left: '94%', size: 4, duration: '13s', delay: '-2.5s', drift: '-12px' },
] as const;

const NAVIDENA_TWINKLES = [
  { left: '11%', top: '14%', size: 5, delay: '0.2s' },
  { left: '28%', top: '8%', size: 4, delay: '1.1s' },
  { left: '72%', top: '11%', size: 5, delay: '0.6s' },
  { left: '89%', top: '20%', size: 4, delay: '1.8s' },
  { left: '19%', top: '68%', size: 4, delay: '2.1s' },
  { left: '83%', top: '74%', size: 5, delay: '0.9s' },
] as const;

const AdminDashboardView = lazy(() =>
  import('./components/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView }))
);
const VideoTutorialesView = lazy(() => import('./components/VideoTutorialesView'));
const HojaCotizacionView = lazy(() =>
  import('./components/HojaCotizacionView').then((m) => ({ default: m.HojaCotizacionView }))
);
const TallerView = lazy(() =>
  import('./components/TallerView').then((m) => ({ default: m.TallerView }))
);
const InventarioView = lazy(() =>
  import('./components/InventarioView').then((m) => ({ default: m.InventarioView }))
);
const ModulacionCortesView = lazy(() =>
  import('./components/ModulacionCortesView').then((m) => ({ default: m.ModulacionCortesView }))
);
const VidrioOptimizerView = lazy(() =>
  import('./components/VidrioOptimizerView').then((m) => ({ default: m.VidrioOptimizerView }))
);
const HistorialCotizacionesView = lazy(() =>
  import('./components/HistorialCotizacionesView').then((m) => ({
    default: m.HistorialCotizacionesView,
  }))
);
import { AnnualCelebrationOverlay } from './components/AnnualCelebrationOverlay';
import { FloatingInstallButton } from './components/FloatingInstallButton';
import { CalculadoraModal } from './components/CalculadoraModal';
import { LevantamientoRapido } from './components/LevantamientoRapido';
import {
  AlumBridgePayload,
  LevantamientoDraft,
  LevantamientoPieza,
  mergePiezaSpecsAndNotes,
  normalizeLevantamientoDraft,
  overwriteHojaProyectoInStorage,
  resolveColorAluminioFromLevantamiento,
  resolveLineaFromLevantamiento,
  resolveMosquiteroFromLevantamiento,
  resolveVidrioFromLevantamiento,
} from './utils/levantamientoLogic';

import { ErrorBoundary } from './components/ErrorBoundary';
import { AntesDespuesModal } from './components/AntesDespuesModal';
import { CatalogoView, NotasView } from './components/NotasAndCatalogoViews';
import { AvisoPrivacidadView, TerminosCondicionesView } from './components/LegalViews';
import { LegalDocType, LegalModal } from './components/LegalModal';
import { HelpFaqModal } from './components/HelpFaqModal';

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
    | 'faq'
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
    invTab: 'existencias' | 'perfiles' | 'vidrios' | 'herrajes';
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
    invTab: 'existencias',
    catalogoTab: 'perfiles',
    modStep: 1,
    modPaso5Tab: 'cortes',
    modMosqOpen: false,
    globalModals: [],
    perfilModalId: null,
    subModal: null,
  };

  // Rastreo persistente de referidos (?ref=[ID_DEL_USUARIO]&refName=[NOMBRE_DEL_TALLER]) en localStorage
  // (ignora auto-referidos si coincide con el deviceId de este mismo equipo)
  const [referredById] = useState<string | null>(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    return captureReferredByFromSearch(search, deviceId);
  });
  const [referredByName] = useState<string | null>(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    return captureReferredByNameFromSearch(search, deviceId);
  });
  const [autostartSkip] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return new URLSearchParams(window.location.search).get('autostart') === '1';
    } catch {
      return false;
    }
  });
  const [guidedTutorialAutoOpen, setGuidedTutorialAutoOpen] = useState<boolean>(false);
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
  const [invTab, setInvTab] = useState<'existencias' | 'perfiles' | 'vidrios' | 'herrajes'>('existencias');
  const [catalogoTab, setCatalogoTab] = useState<'perfiles' | 'herrajes'>('perfiles');
  const [unifiedGateTarget, setUnifiedGateTarget] = useState<null | {
    tool: 'levantamiento' | 'hoja' | 'modulacion' | 'vidrio';
    label: string;
  }>(null);
  const [modStep, setModStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [modPaso5Tab, setModPaso5Tab] = useState<'cortes' | 'tramos'>('cortes');
  const [modMosqOpen, setModMosqOpen] = useState<boolean>(false);
  const [globalModals, setGlobalModals] = useState<GlobalModalId[]>(() =>
    initialReferralActive && !proActive && Boolean(savedColleagueReferral)
      ? ['referralWelcome']
      : []
  );
  const [perfilModalId, setPerfilModalId] = useState<PerfilCatalogoId | null>(null);
  const [navTransitionDir, setNavTransitionDir] = useState<NavTransitionDir>('none');
  const [displayedView, setDisplayedView] = useState<ScreenId>('menu');
  const [screenTransitionPhase, setScreenTransitionPhase] =
    useState<ScreenTransitionPhase>('idle');
  const screenExitTimerRef = useRef<number | null>(null);
  const screenEnterRafRef = useRef<number | null>(null);
  const screenEnterRaf2Ref = useRef<number | null>(null);

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
  const displayedViewRef = useRef<ScreenId>(displayedView);
  displayedViewRef.current = displayedView;

  useEffect(() => {
    if (currentView === displayedViewRef.current) return;

    if (screenExitTimerRef.current !== null) {
      window.clearTimeout(screenExitTimerRef.current);
      screenExitTimerRef.current = null;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      displayedViewRef.current = currentView;
      setDisplayedView(currentView);
      setScreenTransitionPhase('idle');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      return;
    }

    setScreenTransitionPhase('exiting');

    screenExitTimerRef.current = window.setTimeout(() => {
      screenExitTimerRef.current = null;
      displayedViewRef.current = currentView;
      setDisplayedView(currentView);
      setScreenTransitionPhase('entering');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, SCREEN_EXIT_DURATION_MS);

    return () => {
      if (screenExitTimerRef.current !== null) {
        window.clearTimeout(screenExitTimerRef.current);
        screenExitTimerRef.current = null;
      }
    };
  }, [currentView]);

  useEffect(() => {
    if (screenTransitionPhase !== 'entering') return;

    screenEnterRafRef.current = window.requestAnimationFrame(() => {
      screenEnterRafRef.current = null;
      screenEnterRaf2Ref.current = window.requestAnimationFrame(() => {
        screenEnterRaf2Ref.current = null;
        setScreenTransitionPhase('idle');
      });
    });

    return () => {
      if (screenEnterRafRef.current !== null) {
        window.cancelAnimationFrame(screenEnterRafRef.current);
        screenEnterRafRef.current = null;
      }
      if (screenEnterRaf2Ref.current !== null) {
        window.cancelAnimationFrame(screenEnterRaf2Ref.current);
        screenEnterRaf2Ref.current = null;
      }
    };
  }, [screenTransitionPhase]);

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
  const [incluirIva, setIncluirIva] = useState<boolean>(() => Boolean(taller.ivaPorDefecto));
  const [areaText, setAreaText] = useState('');
  const [etiquetaPieza, setEtiquetaPieza] = useState('');
  const [extraPct, setExtraPct] = useState(0);
  const [referencia, setReferencia] = useState('');
  const [editingPartidaId, setEditingPartidaId] = useState<string | null>(null);

  // Modals & UI (controlados desde la pila unificada NavFrame + popstate)
  const [legalAccepted, setLegalAccepted] = useState<boolean>(() =>
    loadLegalDisclaimerAccepted()
  );
  const [themePreference, setThemePreference] = useState<AppTheme>(() => loadTheme());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    getSystemPrefersDark()
  );
  const resolvedTheme: ResolvedAppTheme = useMemo(
    () => resolveAppTheme(themePreference, systemPrefersDark),
    [themePreference, systemPrefersDark]
  );
  const [skin, setSkin] = useState<AppSkin>(() => loadSkin());
  const [skinVariant, setSkinVariant] = useState<AppSkinVariant>(() =>
    loadSkinVariant(loadSkin())
  );
  const [annualCelebrationOpen, setAnnualCelebrationOpen] = useState(false);
  const [promoColegaUsage, setPromoColegaUsage] = useState<PromoColegaUsageRecord>(() =>
    loadPromoColegaUsage(deviceId)
  );
  const [referencePrices, setReferencePrices] = useState<ReferencePricesDoc | null>(() =>
    loadReferencePricesCache()
  );
  const [adminMessages, setAdminMessages] = useState<AdminMessageItem[]>(() =>
    loadAdminMessagesCache()
  );
  const [readAdminMessageIds, setReadAdminMessageIds] = useState<string[]>(() =>
    loadReadAdminMessageIds()
  );
  const [legalModalDoc, setLegalModalDoc] = useState<LegalDocType>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState<boolean>(false);
  const [sessionEnded, setSessionEnded] = useState<boolean>(false);
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<OfflineCotizacionQueueItem[]>(() =>
    loadOfflineCotizacionesQueue()
  );
  const [syncingOfflineQueue, setSyncingOfflineQueue] = useState(false);
  const syncingOfflineQueueRef = useRef(false);
  const hojaMountedRef = useRef(false);
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
  const faqOpen = globalModals.includes('faq');
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
    const refName = savedColleagueReferral?.refName || referredByName || 'Colega';
    const promoNumber = savedColleagueReferral?.promoNumber || 1;
    const url = buildColleaguePromoWhatsappUrl('527351631532', refName, deviceId, promoNumber, {
      tallerNombre: taller.nombre,
      tallerTel: taller.tel,
      referredById: referredById || savedColleagueReferral?.refName || null,
    });
    openExternalLinkSafe(url);
    showToast('Abriendo WhatsApp con el Administrador para solicitar tu PIN...', true);
  };

  const unlockedSkins = useMemo(
    () => getUnlockedSkinsForLicense(licencia, proActive),
    [licencia, proActive]
  );

  const unreadAdminMessages = useMemo(() => {
    const normDev = deviceId.trim().toUpperCase();
    return adminMessages.filter((m) => {
      if (readAdminMessageIds.includes(m.id)) return false;
      if (m.targetMode === 'individual') {
        return Boolean(m.targetDeviceId && m.targetDeviceId.trim().toUpperCase() === normDev);
      }
      return true;
    });
  }, [adminMessages, readAdminMessageIds, deviceId]);

  const handleMarkAdminMessageRead = useCallback((id: string) => {
    const next = markAdminMessageIdRead(id);
    setReadAdminMessageIds(next);
  }, []);

  const handleSelectTheme = useCallback((nextTheme: AppTheme) => {
    saveTheme(nextTheme);
    setThemePreference(nextTheme);
  }, []);

  const handleToggleTheme = useCallback(() => {
    const next: AppTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    setThemePreference(next);
  }, [resolvedTheme]);

  const homeMenuTier = useMemo(
    () => getHomeMenuTier(licencia, proActive),
    [licencia, proActive]
  );

  const handleSelectSkin = useCallback((nextSkin: AppSkin) => {
    setSkin(nextSkin);
    const nextVariant = loadSkinVariant(nextSkin);
    setSkinVariant(nextVariant);
    const skinNames: Record<AppSkin, string> = {
      basica: 'Básica',
      navidena: 'Navideña',
      ejecutiva: 'Ejecutiva',
      industrial: 'Industrial PRO',
    };
    showToastRef.current(`Carátula "${skinNames[nextSkin]}" aplicada en toda la app`, true);
  }, []);

  const handleSelectSkinVariant = useCallback(
    (variant: AppSkinVariant, targetSkin?: AppSkin) => {
      const effectiveSkin = targetSkin ?? skin;
      const normalized = normalizeSkinVariantForSkin(effectiveSkin, variant);
      if (effectiveSkin !== skin) {
        saveSkin(effectiveSkin);
        setSkin(effectiveSkin);
      }
      saveSkinVariant(effectiveSkin, normalized);
      setSkinVariant(normalized);
      const variantLabelMap: Record<AppSkinVariant, string> = {
        default: effectiveSkin === 'industrial' ? 'Verde' : 'Azul',
        verde: 'Verde',
        naranja: 'Naranja',
        plateada: 'Plata',
        dorada: 'Oro',
        bronce: 'Bronce',
      };
      showToastRef.current(
        `Color plano "${variantLabelMap[normalized]}" aplicado`,
        true
      );
    },
    [skin]
  );

  const [homeMenuLayout, setHomeMenuLayout] = useState<HomeMenuLayout>(() => loadHomeMenuLayout());
  const [homeReorderMode, setHomeReorderMode] = useState<boolean>(false);

  useEffect(() => {
    if (homeMenuTier !== 'pro_annual') {
      setHomeReorderMode(false);
    }
  }, [homeMenuTier]);

  const handleChangeHomeMenuLayout = useCallback((next: HomeMenuLayout) => {
    const saved = saveHomeMenuLayout(next);
    setHomeMenuLayout(saved);
  }, []);

  const handleResetHomeMenuLayout = useCallback(() => {
    const saved = saveHomeMenuLayout(cloneHomeMenuLayout(DEFAULT_HOME_MENU_LAYOUT));
    setHomeMenuLayout(saved);
    showToastRef.current('Orden predeterminado restaurado', true);
  }, []);

  const [catalogVigenciaLabel, setCatalogVigenciaLabel] = useState<string>(() =>
    loadCatalogVigenciaLabel()
  );

  useEffect(() => {
    let active = true;
    fetch('/api/config/catalog-vigencia')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data || typeof data.label !== 'string') return;
        const saved = saveCatalogVigenciaLabel(data.label);
        setCatalogVigenciaLabel(saved);
      })
      .catch(() => {
        // offline fallback: mantener valor en localStorage
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUpdateCatalogVigenciaLabel = useCallback(async (nextLabel: string) => {
    const saved = saveCatalogVigenciaLabel(nextLabel);
    setCatalogVigenciaLabel(saved);
    try {
      await fetch('/api/config/catalog-vigencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: saved }),
      });
    } catch {
      // guardado local ya aplicado
    }
    showToastRef.current('Etiqueta de vigencia de catálogos actualizada', true);
  }, []);

  const [toast, setToast] = useState<{ msg: string; topSuccess: boolean } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
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
    cotizacionesGuardadas: loadCotizacionesGuardadas(),
    contratoCliente,
    inventario,
    inventarioHerrajes,
    sobrantes,
    hojasVidrio,
    obrasAprobadas,
    notas,
    formulas,
    homeMenuLayout,
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
      // Sincroniza la bandera permanente promo_colega_usada desde Firestore hacia el respaldo local
      if (myCloudRec.promo_colega_usada === true) {
        const savedUsage = savePromoColegaUsage(
          deviceId,
          true,
          myCloudRec.fecha_activacion_colega ?? myCloudRec.updatedAt ?? Date.now()
        );
        setPromoColegaUsage(savedUsage);
      } else if (
        myCloudRec.promo_colega_usada === false &&
        myCloudRec.fecha_activacion_colega === null
      ) {
        const resetUsage = savePromoColegaUsage(deviceId, false, null);
        setPromoColegaUsage(resetUsage);
      }
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
        tallerNombre: taller.nombre || '',
        tallerResponsable: taller.responsable || '',
        tallerWhatsapp: taller.tel || '',
        ubicacion: taller.ubicacion || '',
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
        tallerNombre: taller.nombre || '',
        tallerWhatsapp: taller.tel || '',
        ubicacion: taller.ubicacion || '',
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
    let active = true;
    const unsubPrices = subscribeReferencePrices((doc) => {
      if (!active || !doc) return;
      setReferencePrices(doc);
      saveReferencePricesCache(doc);
    });
    const unsubMsgs = subscribeAdminMessages((items) => {
      if (!active) return;
      setAdminMessages(items);
      saveAdminMessagesCache(items);
    });
    return () => {
      active = false;
      unsubPrices();
      unsubMsgs();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = (ev?: MediaQueryListEvent) => {
      setSystemPrefersDark(typeof ev?.matches === 'boolean' ? ev.matches : mq.matches);
    };
    syncSystemTheme();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', syncSystemTheme);
      return () => mq.removeEventListener('change', syncSystemTheme);
    }
    mq.addListener(syncSystemTheme);
    return () => mq.removeListener(syncSystemTheme);
  }, []);

  useEffect(() => {
    saveTheme(themePreference);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.setAttribute('data-color-mode', resolvedTheme);
    document.documentElement.setAttribute('data-theme-preference', themePreference);
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#090d16' : '#F1F5F9');
    }
  }, [themePreference, resolvedTheme]);

  useEffect(() => {
    const allowed = isSkinUnlockedForLicense(skin, licencia, proActive);
    const effectiveSkin: AppSkin = allowed ? skin : 'basica';
    if (effectiveSkin !== skin) {
      setSkin('basica');
    }
    const effectiveVariant: AppSkinVariant = normalizeSkinVariantForSkin(effectiveSkin, skinVariant);
    if (skinVariant !== effectiveVariant) {
      setSkinVariant(effectiveVariant);
    }
    saveSkin(effectiveSkin);
    saveSkinVariant(effectiveSkin, effectiveVariant);
    document.documentElement.setAttribute('data-skin', effectiveSkin);
    document.documentElement.setAttribute('data-skin-variant', effectiveVariant);
  }, [skin, skinVariant, licencia, proActive]);

  const tallerOnboardingComplete = useMemo(
    () => isTallerOnboardingComplete(taller),
    [taller]
  );

  useEffect(() => {
    saveTaller(taller);
    if (isTallerOnboardingComplete(taller)) {
      void syncTallerProfileToCloud({
        deviceId,
        nombre: taller.nombre,
        responsable: taller.responsable || '',
        tel: taller.tel || '',
        termsAcceptedAt: taller.termsAcceptedAt ?? null,
        preferredTheme: resolvedTheme,
        preferredSkin: skin,
        preferredSkinVariant: normalizeSkinVariantForSkin(skin, skinVariant),
      });
    }
  }, [taller, deviceId, resolvedTheme, skin, skinVariant]);

  useEffect(() => {
    saveHoja(hoja);
    if (!hojaMountedRef.current) {
      hojaMountedRef.current = true;
      return;
    }
    const offlineNow = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    if (offlineNow && hoja.partidas.length > 0) {
      const totalAprox = hoja.partidas.reduce((acc, p) => acc + (Number(p.totalLinea) || 0), 0);
      enqueueOfflineCotizacion({
        key: 'hoja:draft',
        action: 'save_hoja_draft',
        cliente: hoja.proyecto || 'Hoja de Cotización',
        total: totalAprox,
      });
    }
  }, [hoja, isOnline]);

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
      if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        if (hoja.partidas.length > 0) {
          enqueueOfflineCotizacion({
            key: 'hoja:draft',
            action: 'save_hoja_draft',
            cliente: hoja.proyecto || 'Hoja de Cotización',
          });
        }
        return;
      }
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
        } else if (res.offline && hoja.partidas.length > 0) {
          enqueueOfflineCotizacion({
            key: 'hoja:draft',
            action: 'save_hoja_draft',
            cliente: hoja.proyecto || 'Hoja de Cotización',
          });
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
    homeMenuLayout,
  ]);

  const despiece = useMemo(
    () => calcularDespiece({ ...params, ajusteDescuentos: taller.ajusteDescuentos }),
    [params, taller.ajusteDescuentos]
  );
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

      if (!skipScroll && prev && prev.view === next.view && prev.modStep !== next.modStep) {
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
    // 1. Primero consumir cualquier capa/modal local registrada (Visor PDF, Hoja PDF, Vista previa de Contrato, etc.)
    if (consumeTopHistoryOverlay()) {
      return;
    }
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
        invTab: extraPatch?.invTab ?? (view === 'inventario' ? 'existencias' : cur.invTab),
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

  const handleToggleHomeReorderFromDrawer = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        if (homeMenuTier !== 'pro_annual') return;
        setHomeReorderMode(true);
        goHome();
      } else {
        setHomeReorderMode(false);
        showToastRef.current('Apartados bloqueados');
      }
    },
    [homeMenuTier, goHome]
  );

  const handleSaveAndLockHomeMenuLayout = useCallback(
    (nextLayout: HomeMenuLayout) => {
      const saved = saveHomeMenuLayout(nextLayout);
      setHomeMenuLayout(saved);
      setHomeReorderMode(false);
      showToastRef.current('Orden guardado y apartados bloqueados', true);

      // Persistir también el orden personalizado en Firestore
      void saveHomeMenuLayoutToCloud(deviceId, saved);

      const curSession = cloudAccountSessionRef.current;
      if (
        curSession &&
        isCloudBackupEligible &&
        isOnline &&
        (typeof navigator === 'undefined' || navigator.onLine)
      ) {
        skipNextAutoBackupRef.current = true;
        void uploadCloudAccountBackup({
          email: curSession.email,
          sessionToken: curSession.sessionToken,
          deviceId,
          licencia: licenciaRef.current,
          backup: {
            ...buildCurrentCloudBackup(),
            homeMenuLayout: saved,
            updatedAt: Date.now(),
          },
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
      }
    },
    [isCloudBackupEligible, isOnline, deviceId, buildCurrentCloudBackup]
  );

  const openGlobalModal = useCallback(
    (modalId: GlobalModalId) => {
      const cur = navFramesRef.current[navFramesRef.current.length - 1] || BASE_FRAME;
      if (cur.globalModals[cur.globalModals.length - 1] === modalId) return;
      const nextModals = [...cur.globalModals.filter((m) => m !== modalId), modalId];
      pushNavFrame({ globalModals: nextModals });
    },
    [pushNavFrame]
  );

  // Seguro de respaldo privado por URL: ?Admin=OlmosHer1983 (sensible a mayúsculas/minúsculas)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!parseAdminUrlShortcut(window.location.search)) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('Admin');
      const cleanedPath = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, '', cleanedPath || '/');
    } catch {
      // ignorar si el navegador restringe history.replaceState
    }
    openGlobalModal('adminAuth');
  }, [openGlobalModal]);

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
        // Retroceder ESTRICTAMENTE 1 pantalla/paso a la vez (nunca saltar directo al Menú Inicio)
        const targetDepth = Math.max(0, navFramesRef.current.length - 2);
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

  // Gesto táctil nativo de deslizar desde el borde izquierdo (Swipe-Back) en Modulación, Cortes y demás pantallas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const touch = e.touches[0];
      // Solo activar desde el borde izquierdo (<= 36px) para no interferir con scroll horizontal de tablas/planos
      if (touch.clientX <= 36) {
        startX = touch.clientX;
        startY = touch.clientY;
        tracking = true;
      } else {
        tracking = false;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking || e.changedTouches.length === 0) return;
      tracking = false;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (dx >= 65 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (currentViewRef.current !== 'menu' || navFramesRef.current.length > 1) {
          requestBack();
        }
      }
    };

    const onTouchCancel = () => {
      tracking = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [requestBack]);

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
          : lineaId === 'mosq-abatible'
            ? 'abatible'
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

  const needsFirstTimeWorkshopGate =
    !proActive && !firebaseUser && !(legalAccepted && tallerOnboardingComplete);

  const executeActiveTool = useCallback(
    (tool: 'levantamiento' | 'hoja' | 'modulacion' | 'vidrio') => {
      if (tool === 'levantamiento') {
        window.__alumLev?.open();
      } else if (tool === 'hoja') {
        navigateTo('hoja');
      } else if (tool === 'modulacion') {
        navigateTo('modulacion');
      } else if (tool === 'vidrio') {
        navigateTo('vidrio');
      }
    },
    [navigateTo]
  );

  const requestActiveToolAccess = useCallback(
    (tool: 'levantamiento' | 'hoja' | 'modulacion' | 'vidrio', label: string) => {
      if (needsFirstTimeWorkshopGate) {
        setUnifiedGateTarget({ tool, label });
        return;
      }
      executeActiveTool(tool);
    },
    [needsFirstTimeWorkshopGate, executeActiveTool]
  );

  const handleEntrarHoja = () => {
    requestActiveToolAccess('hoja', 'Hoja de Cotización');
  };

  const handleEntrarInventario = (tab?: 'existencias' | 'perfiles' | 'vidrios' | 'herrajes') => {
    navigateTo('inventario', tab ? { invTab: tab } : undefined);
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

  const completeGoogleUserRegistration = useCallback(
    (user: FirebaseUser) => {
      const now = Date.now();
      saveLegalDisclaimerAccepted(true);
      setLegalAccepted(true);
      saveTermsAcceptedAt(now);

      const emailPrefix = (user.email || '').split('@')[0] || 'Mi Taller';
      const resolvedNombre = taller.nombre?.trim() || user.displayName?.trim() || emailPrefix;
      const resolvedResponsable =
        taller.responsable?.trim() || user.displayName?.trim() || resolvedNombre;
      const nextTaller: TallerConfig = {
        ...taller,
        nombre: resolvedNombre,
        responsable: resolvedResponsable,
        termsAcceptedAt: taller.termsAcceptedAt || now,
      };
      saveTaller(nextTaller);
      setTaller(nextTaller);

      void syncTallerProfileToCloud({
        deviceId,
        nombre: nextTaller.nombre,
        responsable: nextTaller.responsable || nextTaller.nombre,
        tel: nextTaller.tel || '',
        ubicacion: nextTaller.ubicacion || '',
        termsAcceptedAt: nextTaller.termsAcceptedAt || now,
        preferredTheme: resolvedTheme,
        preferredSkin: skin,
        preferredSkinVariant: normalizeSkinVariantForSkin(skin, skinVariant),
      });

      void syncDeviceToCloud({
        deviceId,
        cliente: nextTaller.nombre,
        tallerNombre: nextTaller.nombre,
        tallerResponsable: nextTaller.responsable || nextTaller.nombre,
        tallerWhatsapp: nextTaller.tel || '',
        ubicacion: nextTaller.ubicacion || '',
        termsAcceptedAt: nextTaller.termsAcceptedAt || now,
        deviceLabel: detectDeviceLabel(),
        eventType: 'open',
        minutesDelta: 0,
        licencia: licenciaRef.current,
      });
    },
    [deviceId, taller, resolvedTheme, skin, skinVariant]
  );

  const completeGoogleUserRef = useRef(completeGoogleUserRegistration);
  completeGoogleUserRef.current = completeGoogleUserRegistration;
  const executeActiveToolRef = useRef(executeActiveTool);
  executeActiveToolRef.current = executeActiveTool;

  // Sincronización reactiva del estado de autenticación con Google (incluyendo retorno de signInWithRedirect)
  useEffect(() => {
    const unsub = subscribeFirebaseAuth((user) => {
      setFirebaseUser(user);
      if (user) {
        setGoogleAuthError(null);
      }
    });
    void consumeGoogleRedirectResult().then((result) => {
      if (!result) return;
      if (result.status === 'signed_in') {
        setFirebaseUser(result.user);
        setGoogleAuthError(null);
        completeGoogleUserRef.current(result.user);
        showToast(
          `Conectado en Nube${result.user.email ? `: ${result.user.email}` : ''}`,
          true
        );
        try {
          const pendingTool = window.sessionStorage.getItem('ap_pending_google_tool') as
            | 'levantamiento'
            | 'hoja'
            | 'modulacion'
            | 'vidrio'
            | null;
          if (pendingTool) {
            window.sessionStorage.removeItem('ap_pending_google_tool');
            setUnifiedGateTarget(null);
            executeActiveToolRef.current(pendingTool);
          }
        } catch {
          // ignore
        }
      } else if (result.status === 'error') {
        const detailed = result.code ? `[${result.code}] ${result.message}` : result.message;
        setGoogleAuthError(detailed);
        showToast(detailed);
      }
    });
    return () => unsub();
  }, []);

  // Suscripción reactiva a la cola persistente de cotizaciones offline
  useEffect(() => {
    const refreshQueue = () => setOfflineSyncQueue(loadOfflineCotizacionesQueue());
    refreshQueue();
    window.addEventListener(OFFLINE_SYNC_QUEUE_EVENT, refreshQueue);
    window.addEventListener('storage', refreshQueue);
    return () => {
      window.removeEventListener(OFFLINE_SYNC_QUEUE_EVENT, refreshQueue);
      window.removeEventListener('storage', refreshQueue);
    };
  }, []);

  const handleFlushOfflineCotizacionesQueue = async (opts?: {
    manual?: boolean;
    silentIfUnlinked?: boolean;
  }) => {
    if (syncingOfflineQueueRef.current) return;
    const pending = loadOfflineCotizacionesQueue();
    if (pending.length === 0) {
      if (opts?.manual) {
        showToast('Todas tus cotizaciones ya están sincronizadas', true);
      }
      return;
    }

    const offlineNow = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    if (offlineNow) {
      if (opts?.manual) {
        showToast(
          `Sin conexión a internet · ${pending.length} cotización(es) permanecen en cola persistente`
        );
      }
      return;
    }

    const curSession = cloudAccountSessionRef.current;
    if (!curSession) {
      if (opts?.manual) {
        openGlobalModal('cloudBackup');
        showToast(
          `Conecta tu cuenta en la nube para sincronizar ${pending.length} cotización(es) pendiente(s)`
        );
      }
      return;
    }

    syncingOfflineQueueRef.current = true;
    setSyncingOfflineQueue(true);
    try {
      const result = await flushOfflineCotizacionesQueue(async () => {
        const res = await uploadCloudAccountBackup({
          email: curSession.email,
          sessionToken: curSession.sessionToken,
          deviceId,
          licencia: licenciaRef.current,
          backup: buildCurrentCloudBackup(),
        });
        if (res.sessionExpired) {
          handleRemoteSessionClosed();
          return {
            ok: false,
            needsAuth: true,
            error: 'Sesión cerrada en otro dispositivo',
          };
        }
        if (res.ok) {
          const ts = res.updatedAt || Date.now();
          setCloudAccountSession((prev) =>
            prev && prev.sessionToken === curSession.sessionToken
              ? { ...prev, lastBackedUpAt: ts }
              : prev
          );
          return { ok: true };
        }
        return {
          ok: false,
          offline: res.offline,
          error: res.error || 'No se pudo completar la sincronización',
        };
      });

      setOfflineSyncQueue(loadOfflineCotizacionesQueue());
      if (result.ok && result.flushedCount > 0) {
        showToast(
          `✓ ${result.flushedCount} cotización(es) pendiente(s) sincronizada(s) en la nube`,
          true
        );
      } else if (!result.ok && opts?.manual) {
        showToast(result.error || 'No se pudo sincronizar la cola en este momento');
      }
    } finally {
      syncingOfflineQueueRef.current = false;
      setSyncingOfflineQueue(false);
    }
  };

  // Vacía automáticamente la cola persistente al recuperar internet o al iniciar sesión en la nube
  useEffect(() => {
    if (!isOnline) return;
    if (offlineSyncQueue.length === 0) return;
    if (!cloudAccountSession?.sessionToken) return;
    const timer = window.setTimeout(() => {
      void handleFlushOfflineCotizacionesQueue({ silentIfUnlinked: true });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isOnline, offlineSyncQueue.length, cloudAccountSession?.sessionToken, firebaseUser?.uid]);

  const handleConnectGoogle = async () => {
    if (googleAuthLoading) return;
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      const msg = 'Sin conexión a internet para conectar con Google. Revisa tu red e intenta de nuevo.';
      setGoogleAuthError(msg);
      showToast(msg);
      return;
    }
    setGoogleAuthLoading(true);
    setGoogleAuthError(null);
    try {
      if (unifiedGateTarget?.tool) {
        try {
          window.sessionStorage.setItem('ap_pending_google_tool', unifiedGateTarget.tool);
        } catch {
          // ignore
        }
      }
      const result = await connectGoogleAccountWithFallback();
      if (result.status === 'signed_in') {
        setFirebaseUser(result.user);
        setGoogleAuthError(null);
        completeGoogleUserRegistration(result.user);
        showToast(
          `Conectado en Nube${result.user.email ? `: ${result.user.email}` : ''}`,
          true
        );
        if (unifiedGateTarget?.tool) {
          const targetTool = unifiedGateTarget.tool;
          setUnifiedGateTarget(null);
          try {
            window.sessionStorage.removeItem('ap_pending_google_tool');
          } catch {
            // ignore
          }
          executeActiveTool(targetTool);
        }
        if (loadOfflineCotizacionesQueue().length > 0 && cloudAccountSessionRef.current) {
          void handleFlushOfflineCotizacionesQueue({ silentIfUnlinked: true });
        }
      } else if (result.status === 'redirecting') {
        showToast(result.message);
      } else {
        const detailed = result.code ? `[${result.code}] ${result.message}` : result.message;
        setGoogleAuthError(detailed);
        showToast(detailed);
      }
    } catch (err) {
      const errCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      const baseMsg =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo iniciar sesión con Google. Intenta nuevamente.';
      const msg = errCode ? `[${errCode}] ${baseMsg}` : baseMsg;
      setGoogleAuthError(msg);
      showToast(msg);
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (googleAuthLoading) return;
    setGoogleAuthLoading(true);
    setGoogleAuthError(null);
    try {
      await signOutFirebase();
      setFirebaseUser(null);
      showToast('Sesión de Google desconectada');
    } catch {
      showToast('No se pudo cerrar la sesión de Google');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

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
        const pieceDespiece = calcularDespiece({
          ...pieceParams,
          ajusteDescuentos: taller.ajusteDescuentos,
        });
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
      taller.ajusteDescuentos,
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
    videos: 'Video Tutoriales',
    terminos: 'Términos y Condiciones',
    privacidad: 'Aviso de Privacidad',
    admin: 'Panel de Administrador',
  };

  const isInteractiveTutorialVisible = guidedTutorialAutoOpen || tutorialOpen;

  const handleCloseInteractiveTutorial = () => {
    saveGuidedTutorialSeen(true);
    setGuidedTutorialAutoOpen(false);
    if (tutorialOpen) requestBack();
  };

  const currentBackupPayload: AlumineroBackupPayload = {
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
  };

  if (sessionEnded) {
    return (
      <div
        id="view-session-ended"
        className={`min-h-screen w-full flex items-center justify-center p-5 ${
          resolvedTheme === 'light' ? 'bg-[#F1F5F9] text-slate-900' : 'bg-[#0B1120] text-slate-100'
        }`}
      >
        <div
          className={`w-full max-w-[400px] rounded-2xl border p-6 text-center shadow-2xl ${
            resolvedTheme === 'light'
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-900/95 border-slate-700 text-slate-100'
          }`}
        >
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-400 flex items-center justify-center text-[26px]">
            ✓
          </div>
          <h1 className="m-0 text-[20px] font-extrabold">Sesión finalizada</h1>
          <p className="m-0 mt-2 text-[13.5px] opacity-80 leading-relaxed">
            Ya puedes cerrar la aplicación de forma segura. Tus datos de taller, inventario y cotizaciones quedan guardados en tu equipo.
          </p>
          <button
            type="button"
            id="btn-reenter-app"
            onClick={() => {
              setExitConfirmOpen(false);
              setSessionEnded(false);
            }}
            className="mt-5 w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[14px] cursor-pointer shadow-lg"
          >
            Volver a entrar
          </button>
        </div>
      </div>
    );
  }

  // Entrada libre en Modo Gratuito: sin pantallas previas bloqueantes al abrir la app.
  // El modal unificado 'Aviso Legal, Deslinde y Registro de Taller' se muestra únicamente
  // la primera vez que el usuario gratuito entra a Levantamiento Rápido, Hoja de Cotización u Optimizar Cortes.

  return (
    <div
      className={`relative min-h-screen w-full max-w-[100vw] overflow-x-hidden box-border transition-colors ${
        resolvedTheme === 'light'
          ? 'bg-[#F1F5F9] text-slate-900'
          : skin !== 'basica'
            ? 'bg-transparent text-slate-100'
            : 'bg-[#0B1120] text-slate-100'
      }`}
    >
      {skin === 'navidena' && (
        <div className="navidena-snow-overlay" aria-hidden="true">
          {NAVIDENA_SNOW_FLAKES.map((flake, idx) => (
            <span
              key={`snow-${idx}`}
              className="navidena-snow-flake"
              style={
                {
                  left: flake.left,
                  width: `${flake.size}px`,
                  height: `${flake.size}px`,
                  animationDuration: flake.duration,
                  animationDelay: flake.delay,
                  '--snow-drift': flake.drift,
                } as React.CSSProperties
              }
            />
          ))}
          {NAVIDENA_TWINKLES.map((tw, idx) => (
            <span
              key={`twinkle-${idx}`}
              className="navidena-twinkle"
              style={{
                left: tw.left,
                top: tw.top,
                width: `${tw.size}px`,
                height: `${tw.size}px`,
                animationDelay: tw.delay,
              }}
            />
          ))}
        </div>
      )}
      <TopBar
        currentView={currentView}
        title={screenTitleMap[currentView]}
        proActive={proActive}
        licencia={licencia}
        trialExpiresAt={trialExpiresAt}
        theme={resolvedTheme}
        isOnline={isOnline}
        pendingSyncCount={offlineSyncQueue.length}
        syncingOfflineQueue={syncingOfflineQueue}
        unreadMessagesCount={unreadAdminMessages.length}
        onBack={requestBack}
        onGoHome={goHome}
        onOpenPro={() => openGlobalModal('pro')}
        onOpenDrawer={() => openGlobalModal('drawer')}
        onOpenCalculadora={() => openGlobalModal('calculadora')}
        onRequestExit={() => setExitConfirmOpen(true)}
        onClickOfflineStatus={() => {
          if (!isOnline) {
            showToast(
              offlineSyncQueue.length > 0
                ? `Modo sin internet activo · ${offlineSyncQueue.length} cotización(es) en cola para sincronizar`
                : 'Modo sin internet activo · Tus cotizaciones se guardan localmente y se sincronizarán al volver la red'
            );
          } else if (offlineSyncQueue.length > 0) {
            void handleFlushOfflineCotizacionesQueue({ manual: true });
          }
        }}
        onOpenMessages={() => {
          if (currentView !== 'menu') goHome();
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      <main
        className={`w-full ${
          displayedView === 'admin' ? 'max-w-[1440px] px-4 sm:px-6 lg:px-8' : 'max-w-[1120px] px-3 sm:px-4'
        } mx-auto pt-5 pb-24 box-border overflow-x-hidden`}
      >
        {!isOnline ? (
          <div
            id="offline-banner"
            role="status"
            aria-live="polite"
            className="mb-3 px-3.5 py-2.5 rounded-xl border border-rose-400/70 bg-rose-600/20 text-rose-100 text-[12px] font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" aria-hidden="true" />
              <span>
                Sin conexión a internet · Modo offline activo.{' '}
                {offlineSyncQueue.length > 0
                  ? `${offlineSyncQueue.length} cotización(es) en cola persistente para sincronizar automáticamente al reconectar.`
                  : 'Tus cálculos, cotizaciones e inventario siguen guardándose localmente.'}
              </span>
            </div>
          </div>
        ) : offlineSyncQueue.length > 0 ? (
          <div
            id="offline-pending-sync-banner"
            role="status"
            aria-live="polite"
            className="mb-3 px-3.5 py-2.5 rounded-xl border border-amber-400/70 bg-amber-500/20 text-amber-100 text-[12px] font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm"
          >
            <span>
              {syncingOfflineQueue
                ? `Sincronizando ${offlineSyncQueue.length} cotización(es) guardada(s) sin conexión...`
                : `Conexión restablecida · ${offlineSyncQueue.length} cotización(es) pendiente(s) de sincronizar en la nube.`}
            </span>
            <button
              type="button"
              id="btn-retry-offline-sync"
              disabled={syncingOfflineQueue}
              onClick={() => void handleFlushOfflineCotizacionesQueue({ manual: true })}
              className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11.5px] font-extrabold cursor-pointer disabled:opacity-60 shrink-0"
            >
              {syncingOfflineQueue ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
          </div>
        ) : null}

        <ErrorBoundary resetKey={displayedView} onGoHome={goHome}>
        <Suspense
          fallback={
            <div className="p-8 rounded-2xl border border-slate-700/70 bg-slate-900/90 text-center text-slate-300 text-[13px] font-bold">
              Cargando módulo...
            </div>
          }
        >
        <div
          id="screen-transition-stage"
          data-view={displayedView}
          data-transition-phase={screenTransitionPhase}
          data-transition-dir={navTransitionDir}
          className={getScreenTransitionClasses(screenTransitionPhase, navTransitionDir)}
        >
        {displayedView === 'menu' && (
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
            referredByName={referredByName}
            promoColegaUsed={promoColegaUsage.promo_colega_usada}
            pendingRemindersCount={reminderSummary.pendingCount}
            dueRemindersCount={reminderSummary.dueCount}
            pushPermission={pushPermission}
            unreadAdminMessages={unreadAdminMessages}
            onMarkAdminMessageRead={handleMarkAdminMessageRead}
            onClaimColleaguePromo={handleClaimColleaguePromo}
            onOpenColleagueInvite={() => openGlobalModal('recomendar')}
            onOpenPro={() => openGlobalModal('pro')}
            onEntrarTrabajo={handleEntrarTrabajo}
            onEntrarHoja={handleEntrarHoja}
            onEntrarInventario={() => handleEntrarInventario()}
            onGoToView={(view) => {
              if (view === 'modulacion') {
                requestActiveToolAccess('modulacion', 'Optimizar Cortes');
                return;
              }
              if (view === 'vidrio') {
                requestActiveToolAccess('vidrio', 'Optimizar Cortes (Vidrio 2D)');
                return;
              }
              navigateTo(view);
            }}
            onOpenAntesDespues={() => openGlobalModal('antesDespues')}
            onOpenLevantamiento={() =>
              requestActiveToolAccess('levantamiento', 'Levantamiento Rápido')
            }
            onOpenReminders={() => openGlobalModal('reminders')}
            menuTier={homeMenuTier}
            menuLayout={homeMenuLayout}
            reorderMode={homeReorderMode}
            onChangeMenuLayout={handleChangeHomeMenuLayout}
            onSaveAndLockLayout={handleSaveAndLockHomeMenuLayout}
            onResetMenuLayout={handleResetHomeMenuLayout}
            onForceExitReorderMode={() => setHomeReorderMode(false)}
          />
        )}

        {displayedView === 'trabajo' && (
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
            catalogVigenciaLabel={catalogVigenciaLabel}
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
            onOpenGlassOptimizerFromJobs={(jobs: LevantamientoPieza[]) => {
              const agg = aggregateModulacionJobs(
                jobs.map((p) => {
                  const m = resolveLineaFromLevantamiento(p);
                  return {
                    id: p.id,
                    etiqueta: p.area ? `${p.tipo} (${p.area})` : p.tipo,
                    modeloId: m.modelo || 'win-corrediza',
                    conMosquitero: resolveMosquiteroFromLevantamiento(p.mosquitero),
                    serieId: m.serieMod,
                    sublineaId: 'comercial-hermetica',
                    anchoCm: Math.max(20, Number(p.anchoCm) || 120),
                    altoCm: Math.max(20, Number(p.altoCm) || 120),
                    cantidad: Math.max(1, Number(p.cant) || 1),
                    vidrioLabel: p.colorVidrio || 'Claro 6mm',
                    sinVidrio:
                      String(p.colorVidrio || '').toLowerCase().includes('sin vidrio') ||
                      String(p.tipo || '').toLowerCase().includes('mosquitero'),
                  };
                })
              );
              const imported: PiezaVidrioInput[] = agg.vidriosConsolidados.map((v, idx) => ({
                id: `v-trab-${Date.now()}-${idx}`,
                etiqueta: v.nombre,
                tipoNombre: v.espesorLabel || 'Claro 6mm',
                anchoCm: v.anchoCm,
                altoCm: v.altoCm,
                cantidad: Math.max(1, v.pzas),
                permitirRotacion: !esMaterialDireccional(v.espesorLabel || 'Claro 6mm'),
              }));
              if (imported.length === 0) {
                showToast('Los trabajos seleccionados no llevan vidrio');
                return;
              }
              setVidrioPiezasDraft(imported);
              navigateTo('vidrio');
              showToast(`${imported.length} corte(s) de vidrio enviados al Optimizador 2D`, true);
            }}
            onShowToast={showToast}
          />
        )}

        {displayedView === 'hoja' && (
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
            onVaciarHoja={() =>
              setHoja((prev) => ({
                ...prev,
                partidas: [],
                incluirIva: Boolean(taller.ivaPorDefecto),
              }))
            }
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
            onAddSobrante={(item) => {
              setSobrantes((prev) => [
                {
                  ...item,
                  id: `sob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  fecha: new Date().toLocaleDateString('es-MX'),
                },
                ...prev,
              ]);
              showToast(`Sobrante de ${item.largoM.toFixed(2)} m guardado en Mi Inventario`, true);
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

        {displayedView === 'taller' && (
          <TallerView
            taller={taller}
            proActive={proActive}
            formulas={formulas}
            historial={historial}
            backupData={currentBackupPayload}
            onImportBackup={handleImportBackup}
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
            skin={skin}
            skinVariant={skinVariant}
            unlockedSkins={unlockedSkins}
            onSelectSkin={handleSelectSkin}
            onSelectSkinVariant={handleSelectSkinVariant}
            colorMode={resolvedTheme}
            onToggleColorMode={handleToggleTheme}
            referencePrices={referencePrices}
            onShowToast={showToast}
          />
        )}

        {displayedView === 'cotizaciones' && (
          <HistorialCotizacionesView
            isOnline={isOnline}
            onSyncPendingQueue={() => void handleFlushOfflineCotizacionesQueue({ manual: true })}
            onGoHoja={handleEntrarHoja}
            onShowToast={showToast}
          />
        )}

        {displayedView === 'inventario' && (
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
              existenciasPriceCtx={{
                inventarioPreciosUnitarios: taller.inventarioPreciosUnitarios || {},
                precioListaTramo: taller.precioListaTramo,
                rellenoPreciosM2: taller.rellenoPreciosM2 || {},
                herrajesPrecios: taller.herrajesPrecios || {},
              }}
              onSaveExistenciasPrices={({ inventarioPreciosUnitarios, herrajesPrecios }) => {
                setTaller((prev) => ({
                  ...prev,
                  inventarioPreciosUnitarios,
                  herrajesPrecios,
                }));
              }}
              onShowToast={showToast}
            />
        )}

        {displayedView === 'notas' && (
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

        {displayedView === 'modulacion' && (
          <ModulacionCortesView
              tarifasBase={taller.tarifasBase}
              proActive={proActive}
              sobrantes={sobrantes}
              ajusteDescuentos={taller.ajusteDescuentos}
              optimizadorConfig={taller.optimizador}
              catalogVigenciaLabel={catalogVigenciaLabel}
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

        {displayedView === 'vidrio' && (
          <VidrioOptimizerView
            hojasVidrio={hojasVidrio}
            hojaPartidas={hoja.partidas}
            piezasIniciales={vidrioPiezasDraft}
            onGoInventarioVidrios={() => handleEntrarInventario('vidrios')}
            onShowToast={showToast}
          />
        )}

        {displayedView === 'catalogo' && (
          <CatalogoView
            perfilFotos={perfilFotos}
            catalogoTab={catalogoTab}
            catalogVigenciaLabel={catalogVigenciaLabel}
            onSelectLineaFromCatalog={(linea) => {
              setCategoria('ventanas');
              handleSelectLinea(linea);
              navigateTo('trabajo');
              showToast(`Serie ${LINEAS_CONFIG[linea].nombre} cargada en Cotizador`, true);
            }}
            onChangeCatalogoTab={(tab) => {
              if (tab !== catalogoTab) pushNavFrame({ catalogoTab: tab });
            }}
            onOpenPerfilModal={openPerfilModal}
            onUploadPerfilFoto={handleUploadPerfilFoto}
            onRemovePerfilFoto={handleRemovePerfilFoto}
            onOpenSugerencias={() => openGlobalModal('sugerencias')}
          />
        )}

        {displayedView === 'videos' && (
          <Suspense
            fallback={
              <div className="p-8 rounded-2xl border border-slate-700/70 bg-slate-900/90 text-center text-slate-300 text-[13px] font-bold">
                Cargando Video Tutoriales...
              </div>
            }
          >
            <VideoTutorialesView onShowToast={showToast} />
          </Suspense>
        )}

        {displayedView === 'terminos' && (
          <TerminosCondicionesView onBack={requestBack} />
        )}

        {displayedView === 'privacidad' && (
          <AvisoPrivacidadView onBack={requestBack} />
        )}

        {displayedView === 'admin' && (
          <Suspense
            fallback={
              <div className="p-8 rounded-2xl border border-slate-700/70 bg-slate-900/90 text-center text-slate-300 text-[13px] font-bold">
                Cargando Panel de Administrador...
              </div>
            }
          >
          <AdminDashboardView
            deviceId={deviceId}
            catalogVigenciaLabel={catalogVigenciaLabel}
            onUpdateCatalogVigenciaLabel={handleUpdateCatalogVigenciaLabel}
            licencia={licencia}
            adminKeys={adminKeys}
            revokedDevicesMap={revokedDevicesMap}
            revokedKeys={revokedKeys}
            cloudDevices={cloudDevices}
            cloudStats={cloudStats}
            cloudConnected={cloudConnected}
            cloudRefreshing={cloudRefreshing}
            cloudLastSyncAt={cloudLastSyncAt}
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
            onExit={goHome}
            onRefreshCloud={refreshCloudNow}
            onCloudActivateDevice={async (payload) => {
              const normTarget = normalizeDeviceIdInput(payload.deviceId, deviceId);
              if (!payload.revoke && !payload.recordKeyOnly) {
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
                if (
                  normTarget === deviceId.trim().toUpperCase() &&
                  isColleaguePromoPlan(payload.planCode, payload.dias ?? null, payload.key)
                ) {
                  setPromoColegaUsage(savePromoColegaUsage(deviceId, true, Date.now()));
                }
              }
              const snap = await updateDeviceLicenseInCloud({ ...payload, deviceId: normTarget });
              applyCloudSnapshot(snap);
              return Boolean(snap);
            }}
            onActivateLic={(lic) => {
              setAccessBlockedSync(false);
              saveTrialRevoked(false);
              setTrialRevoked(false);
              const assignedLic: LicenciaState = { ...lic, adminAssigned: true };
              saveLicencia(assignedLic);
              setLicencia(assignedLic);
              if (isColleaguePromoPlan(lic.planCode, null, lic.activatedKey)) {
                setPromoColegaUsage(savePromoColegaUsage(deviceId, true, lic.activatedAt || Date.now()));
              }
              if (isOneYearProPlan(assignedLic)) {
                setAnnualCelebrationOpen(true);
              }
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
              try {
                const snap = await deleteAdminKeyInCloud({
                  id: rec.id,
                  deviceId: normDev,
                  key: rec.key || '',
                  deleteDevice: true,
                });
                if (snap) applyCloudSnapshot(snap);
              } catch (err) {
                console.error('Error al borrar en nube:', err);
              }
              showToast('Usuario eliminado del historial');
            }}
            onRevokePromo={async (targetDeviceId, keyCode) => {
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
              if (normTarget === deviceId.trim().toUpperCase()) {
                setAccessBlockedSync(false);
                revokeLocalProAccess({ showMessage: false, markTrialRevoked: true });
              }
              const snap = await updateDeviceLicenseInCloud({
                deviceId: normTarget,
                key: resolvedKey || undefined,
                revoke: true,
              }).catch(() => null);
              applyCloudSnapshot(snap);
              showToast(
                snap
                  ? `Plan revocado en la nube para ${normTarget}. Regresó a Versión Gratuita.`
                  : 'Error al conectar con la nube para revocar.'
              );
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
              setRevokedDevicesMap((prev) => {
                const next = { ...prev, [normTarget]: now };
                saveRevokedDevicesMap(next);
                return next;
              });
              if (normTarget === deviceId.trim().toUpperCase()) {
                setAccessBlockedSync(true);
                revokeLocalProAccess({ showMessage: false, markTrialRevoked: true });
              }
              const snap = await updateDeviceLicenseInCloud({
                deviceId: normTarget,
                key: resolvedKey || undefined,
                block: true,
              }).catch(() => null);
              applyCloudSnapshot(snap);
              showToast(
                snap
                  ? `Acceso bloqueado en la nube para ${normTarget}.`
                  : 'Error al conectar con la nube para bloquear.'
              );
              return Boolean(snap);
            }}
            onResetPromoColega={async (targetDeviceId) => {
              const normTarget = normalizeDeviceIdInput(targetDeviceId, deviceId);
              if (normTarget === deviceId.trim().toUpperCase()) {
                setPromoColegaUsage(savePromoColegaUsage(deviceId, false, null));
              }
              const snap = await updateDeviceLicenseInCloud({
                deviceId: normTarget,
                resetPromoColega: true,
              }).catch(() => null);
              applyCloudSnapshot(snap);
              showToast(
                snap
                  ? `Permiso de Promo Colega restablecido manualmente para ${normTarget}.`
                  : 'No se pudo conectar con la nube para restablecer el permiso.',
                Boolean(snap)
              );
              return Boolean(snap);
            }}
            onImportFormulas={(imported) => {
              setFormulas((prev) => {
                const byId = new Map(prev.map((f) => [f.id, f]));
                for (const f of imported) byId.set(f.id, f);
                const next = Array.from(byId.values());
                saveFormulas(next);
                return next;
              });
            }}
            onImportBackup={handleImportBackup}
            sugerenciasWhatsapp={sugerenciasWhatsapp}
            onSaveSugerenciasWhatsapp={(phone) => {
              const clean = saveSugerenciasWhatsapp(phone.trim());
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
            onResetCounters={() => {
              setAdminKeys([]);
              saveAdminKeys([]);
              setReferralHistory([]);
              saveReferralHistory([]);
            }}
            onShowToast={showToast}
          />
          </Suspense>
        )}
        </div>
        </Suspense>
        </ErrorBoundary>
      </main>

      <SideDrawer
        open={drawerOpen}
        proActive={proActive}
        isTrialActive={isTrialActive}
        licencia={licencia}
        deviceId={deviceId}
        theme={resolvedTheme}
        themePreference={themePreference}
        skin={skin}
        skinVariant={skinVariant}
        cloudAccountEmail={cloudAccountSession?.email || null}
        isCloudBackupEligible={isCloudBackupEligible}
        googleUserEmail={firebaseUser?.email || null}
        googleAuthLoading={googleAuthLoading}
        googleAuthError={googleAuthError}
        pendingSyncCount={offlineSyncQueue.length}
        onSelectTheme={handleSelectTheme}
        onToggleTheme={handleToggleTheme}
        onSelectSkin={handleSelectSkin}
        onSelectSkinVariant={handleSelectSkinVariant}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        onClearGoogleAuthError={() => setGoogleAuthError(null)}
        onClose={requestBack}
        onOpenPro={() => openModalFromDrawer('pro')}
        onOpenCloudBackup={() => openModalFromDrawer('cloudBackup')}
        onOpenRecomendar={() => openModalFromDrawer('recomendar')}
        onOpenSugerencias={() => openModalFromDrawer('sugerencias')}
        onOpenTutorial={() => openModalFromDrawer('tutorial')}
        onOpenFaq={() => openModalFromDrawer('faq')}
        onOpenLegal={(doc) => {
          if (doc === 'deslinde') {
            requestBack();
            setLegalModalDoc('deslinde');
          } else {
            openScreenFromDrawer(doc);
          }
        }}
        showInstallApp={!pwa.isInstalled}
        onInstallApp={() => void handleInstallApp(true)}
        pendingRemindersCount={reminderSummary.pendingCount}
        dueRemindersCount={reminderSummary.dueCount}
        onOpenReminders={() => openModalFromDrawer('reminders')}
        onOpenCotizaciones={() => openScreenFromDrawer('cotizaciones')}
        onOpenVideos={() => openScreenFromDrawer('videos')}
        onOpenAdminSecret={() => openModalFromDrawer('adminAuth')}
        tallerOnboardingComplete={tallerOnboardingComplete}
        canOrganizeHomeMenu={homeMenuTier === 'pro_annual'}
        homeReorderMode={homeReorderMode}
        onToggleHomeReorderMode={handleToggleHomeReorderFromDrawer}
      />

      <LegalModal
        docType={legalModalDoc}
        onClose={() => setLegalModalDoc(null)}
        onSwitchDoc={(next) => setLegalModalDoc(next)}
      />

      {exitConfirmOpen && (
        <div
          id="modal-exit-confirm"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar salida de Aluminero Pro"
          className="fixed inset-0 z-[9985] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExitConfirmOpen(false);
          }}
        >
          <div className="w-full max-w-[360px] rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border border-slate-200 text-center">
            <h2 className="m-0 text-[18px] font-extrabold text-slate-900">
              ¿Deseas salir de Aluminero Pro?
            </h2>
            <p className="m-0 mt-2 text-[13px] text-slate-600 leading-relaxed">
              Tus cotizaciones, inventario y datos de taller permanecen guardados en tu equipo.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="btn-exit-cancel"
                onClick={() => setExitConfirmOpen(false)}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[13.5px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-exit-confirm"
                onClick={() => {
                  setExitConfirmOpen(false);
                  try {
                    window.close();
                  } catch {
                    // ignorar si el navegador bloquea window.close()
                  }
                  setSessionEnded(true);
                }}
                className="min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

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
        promoColegaUsed={promoColegaUsage.promo_colega_usada}
        trialExpiresAt={trialExpiresAt}
        whatsappNumber={sugerenciasWhatsapp}
        defaultEmail={cloudAccountSession?.email || licencia?.linkedEmail || ''}
        tallerNombre={taller.nombre}
        tallerTel={taller.tel}
        referredById={referredById}
        onClose={requestBack}
        onActivateLic={async (lic) => {
          const normKey = (lic.activatedKey || '').trim().toUpperCase();
          const isColleague3d = isColleaguePromoPlan(lic.planCode, null, normKey);

          // Validación estricta de uso único en almacenamiento local
          if (isColleague3d && promoColegaUsage.promo_colega_usada) {
            return {
              ok: false,
              error: PROMO_COLEGA_ALREADY_USED_ERROR,
            };
          }

          if (normKey && revokedKeysRef.current.has(normKey)) {
            return {
              ok: false,
              error: 'Este código de activación fue revocado por el administrador y ya no puede utilizarse.',
            };
          }

          // Activación inmediata en local: nunca bloquear al usuario esperando red o reglas de Firestore
          if (isColleague3d) {
            const savedUsage = savePromoColegaUsage(deviceId, true, lic.activatedAt || Date.now());
            setPromoColegaUsage(savedUsage);
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
          licenciaRef.current = lic;
          saveLicencia(lic);
          setLicencia(lic);
          if (isOneYearProPlan(lic)) {
            setAnnualCelebrationOpen(true);
          }

          // Registrar automáticamente en el historial local de referidos si fue invitado por un colega
          if (
            referredById &&
            referredById.trim().toUpperCase() !== deviceId.trim().toUpperCase()
          ) {
            const amountByCode: Record<string, string> = {
              M: '$369 MXN',
              Q: '$989 MXN',
              A: '$1,799 MXN',
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

          // Registro en segundo plano hacia Firebase Firestore (no bloquea ni cancela la activación local)
          void (async () => {
            try {
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
                const snap = await syncDeviceToCloud({
                  deviceId,
                  cliente: hoja.proyecto.trim() || taller.nombre || '',
                  deviceLabel: detectDeviceLabel(),
                  eventType: 'license_sync',
                  licencia: lic,
                });
                applyCloudSnapshot(snap);
              }
            } catch (err) {
              console.warn('[Aluminero Pro] Registro en segundo plano de licencia omitido:', err);
            }
          })();

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

      <AdminGateModal
        open={adminAuthOpen}
        onClose={requestBack}
        onSuccess={() => {
          // Cierra el diálogo de contraseña de inmediato y abre directamente AdminDashboardView
          replaceNavFrame({ view: 'admin', globalModals: [] });
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
          if (isOneYearProPlan(assignedLic)) {
            setAnnualCelebrationOpen(true);
          }
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
        defaultSenderName={taller.nombre || taller.responsable || ''}
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

      <InteractiveTutorialModal
        open={isInteractiveTutorialVisible}
        onClose={handleCloseInteractiveTutorial}
        onFinish={handleCloseInteractiveTutorial}
        onOpenVidrioOptimizer={() => {
          handleCloseInteractiveTutorial();
          requestActiveToolAccess('vidrio', 'Optimizar Cortes (Vidrio 2D)');
        }}
      />

      <HelpFaqModal
        open={faqOpen}
        theme={resolvedTheme}
        onClose={requestBack}
      />

      <UnifiedWorkshopGateModal
        open={unifiedGateTarget !== null}
        targetToolLabel={unifiedGateTarget?.label || 'Herramienta de trabajo'}
        taller={taller}
        googleAuthLoading={googleAuthLoading}
        googleAuthError={googleAuthError}
        onContinueWithGoogle={handleConnectGoogle}
        onClose={() => setUnifiedGateTarget(null)}
        onSaveManual={({ nombre, tel, ubicacion, termsAcceptedAt }) => {
          const acceptedTs = termsAcceptedAt || Date.now();
          saveLegalDisclaimerAccepted(true);
          setLegalAccepted(true);
          saveTermsAcceptedAt(acceptedTs);
          const resolvedResponsable = taller.responsable?.trim() || nombre;
          const nextTaller: TallerConfig = {
            ...taller,
            nombre,
            responsable: resolvedResponsable,
            tel,
            ubicacion,
            termsAcceptedAt: acceptedTs,
          };
          saveTaller(nextTaller);
          setTaller(nextTaller);

          void syncTallerProfileToCloud({
            deviceId,
            nombre,
            responsable: resolvedResponsable,
            tel,
            ubicacion,
            termsAcceptedAt: acceptedTs,
            preferredTheme: resolvedTheme,
            preferredSkin: skin,
            preferredSkinVariant: normalizeSkinVariantForSkin(skin, skinVariant),
          });
          void syncDeviceToCloud({
            deviceId,
            cliente: nombre,
            tallerNombre: nombre,
            tallerResponsable: resolvedResponsable,
            tallerWhatsapp: tel,
            ubicacion,
            termsAcceptedAt: acceptedTs,
            deviceLabel: detectDeviceLabel(),
            eventType: 'open',
            minutesDelta: 0,
            licencia: licenciaRef.current,
          });

          const targetTool = unifiedGateTarget?.tool;
          setUnifiedGateTarget(null);
          showToast(`¡Registro guardado, ${nombre}! Ya puedes trabajar sin interrupciones.`, true);
          if (targetTool) {
            executeActiveTool(targetTool);
          }
        }}
      />

      <CloudBackupModal
        open={cloudBackupOpen}
        deviceId={deviceId}
        licencia={licencia}
        session={cloudAccountSession}
        isEligible={isCloudBackupEligible}
        syncing={cloudAccountSyncing}
        googleUserEmail={firebaseUser?.email || null}
        googleAuthLoading={googleAuthLoading}
        googleAuthError={googleAuthError}
        pendingSyncCount={offlineSyncQueue.length}
        isOnline={isOnline}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        onClearGoogleAuthError={() => setGoogleAuthError(null)}
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
            if (Array.isArray(res.backup.cotizacionesGuardadas)) {
              saveCotizacionesGuardadas(res.backup.cotizacionesGuardadas);
              setCotizacionesCount(res.backup.cotizacionesGuardadas.length);
              window.dispatchEvent(new CustomEvent('aluminero:cotizaciones-updated'));
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
            if (res.backup.homeMenuLayout) {
              setHomeMenuLayout(saveHomeMenuLayout(normalizeHomeMenuLayout(res.backup.homeMenuLayout)));
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
              if (loadOfflineCotizacionesQueue().length > 0) {
                await flushOfflineCotizacionesQueue(async () => ({ ok: true }));
                setOfflineSyncQueue(loadOfflineCotizacionesQueue());
              }
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
          !homeReorderMode &&
          !pwa.isInstalled &&
          !installFabDismissed &&
          !accessBlocked &&
          !isReferralWelcomeShowing
        }
        onInstall={() => void handleInstallApp(false)}
        onDismiss={() => setInstallFabDismissed(true)}
      />

      {!(currentView === 'menu' && homeReorderMode) && (
        <FloatingAssistant
          whatsappNumber={sugerenciasWhatsapp}
          deviceId={deviceId}
          skin={skin}
          skinVariant={skinVariant}
          proActive={proActive}
          onOpenPro={() => openGlobalModal('pro')}
          onShowToast={showToast}
        />
      )}

      <AnnualCelebrationOverlay
        open={annualCelebrationOpen}
        onClose={() => setAnnualCelebrationOpen(false)}
        onApplyIndustrialSkin={() => {
          setSkin('industrial');
          saveSkin('industrial');
          showToast('¡Carátula Industrial Pro (1 Año) activada en toda la app!', true);
        }}
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

      {accessBlocked && !adminModalOpen && !adminAuthOpen && currentView !== 'admin' && (
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
