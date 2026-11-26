import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Crown,
  DollarSign,
  Download,
  Edit3,
  Eraser,
  ExternalLink,
  Gift,
  KeyRound,
  LogIn,
  LogOut,
  MessageSquare,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import { collection, getDocsFromServer } from 'firebase/firestore';
import {
  auth,
  connectGoogleAccountWithFallback,
  db,
  getLastGoogleRedirectOutcome,
  isFirebaseAdminUser,
  isFirestoreOfflineError,
  isFirestorePermissionDeniedError,
  signOutFirebase,
  subscribeFirebaseAuth,
} from '../firebase';
import {
  extractFirebaseAuthCode,
  formatAdminAuthDiagnostic,
  shouldAdminFallbackToRedirect,
  type AdminAuthDiagnostic,
} from '../utils/firebaseAuthHelpers';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AdminMessageItem,
  AdminMessageType,
  APP_VERSION,
  buildAdminWelcomeMessage,
  buildMonthlyQuotesSeries,
  buildTopMaterialsSeries,
  buildWhatsAppDirectUrl,
  CloudDeviceRecord,
  DEFAULT_REFERENCE_PRICES,
  filterAdminRecordsByResetBaseline,
  formatClientHeaderDisplay,
  formatCombinedClientLabel,
  formatMxPhoneDashed,
  generateActivationKey,
  generatePermanentTestKey,
  generateRandomMxPhonePlaceholder,
  isColleaguePromoPlan,
  isFreeTestProRecord,
  isProActive,
  isUnassignedAutoTrialDevice,
  LineaId,
  LINEAS_CONFIG,
  normalizeDeviceIdInput,
  parseTutorialVideoUrl,
  parseWhatsappKeyRequestMessage,
  PLANS,
  ReferencePriceItem,
  ReferencePricesDoc,
  TUTORIAL_VIDEO_CATEGORIES,
  TutorialVideoCategoryId,
  UsageStats30d,
} from '../utils/alumineroLogic';
import {
  AdminKeyRecord,
  AlumineroBackupPayload,
  compressImageToDataUrl,
  DEFAULT_CATALOG_VIGENCIA_LABEL,
  formatDateTimeExact,
  FormulaPersonalizada,
  LicenciaState,
  loadCotizacionesGuardadas,
  loadTutorialVideosCache,
  parseBackupPayload,
  ReferralHistoryRecord,
  saveTutorialVideosCache,
  TrabajoAntesDespuesItem,
  TutorialVideoItem,
  validateWhatsappNumber,
} from '../utils/storageHelpers';
import {
  deleteAdminMessageCloud,
  deleteTutorialVideoCloud,
  saveReferencePricesCloud,
  saveTutorialVideoCloud,
  sendAdminMessageCloud,
  subscribeAdminMessages,
  subscribeReferencePrices,
  subscribeTutorialVideos,
} from '../utils/cloudSync';
import {
  CLOUDFLARE_HEADERS_TXT,
  CLOUDFLARE_REDIRECTS_TXT,
  ensureJSZipLoaded,
  escapeInlineScriptContent,
  escapeInlineStyleContent,
  FALLBACK_MANIFEST_JSON,
  FALLBACK_SW_JS,
  injectDeviceSeedIntoHtml,
} from './Modals';

export interface AdminDashboardViewProps {
  deviceId: string;
  licencia: LicenciaState | null;
  adminKeys: AdminKeyRecord[];
  revokedDevicesMap: Record<string, number>;
  revokedKeys: string[];
  cloudDevices: CloudDeviceRecord[];
  cloudStats: UsageStats30d;
  cloudConnected: boolean;
  cloudRefreshing: boolean;
  cloudLastSyncAt: number | null;
  formulas: FormulaPersonalizada[];
  backupData: AlumineroBackupPayload;
  onExit: () => void;
  onActivateLic: (lic: LicenciaState) => void;
  onRecordAdminKey: (rec: AdminKeyRecord) => void;
  onDeleteAdminKey: (rec: AdminKeyRecord) => void;
  onRefreshCloud: () => Promise<void> | void;
  onCloudActivateDevice: (params: {
    deviceId: string;
    cliente: string;
    planCode: string;
    planLabel: string;
    expiresAt: number | null;
    key: string;
    dias: number | null;
    revoke?: boolean;
    recordKeyOnly?: boolean;
    resetPromoColega?: boolean;
  }) => Promise<boolean | void> | void;
  onRevokePromo: (targetDeviceId: string, keyCode?: string) => Promise<boolean | void> | void;
  onRevokeFreeAccess: (targetDeviceId: string, keyCode?: string) => Promise<boolean | void> | void;
  onResetPromoColega: (targetDeviceId: string) => Promise<boolean | void> | void;
  onImportFormulas: (list: FormulaPersonalizada[]) => void;
  onImportBackup: (payload: AlumineroBackupPayload) => void;
  sugerenciasWhatsapp: string;
  onSaveSugerenciasWhatsapp: (phone: string) => void;
  trabajosAntesDespues: TrabajoAntesDespuesItem[];
  onPublishTrabajoAprobado: (item: Omit<TrabajoAntesDespuesItem, 'id' | 'fecha' | 'aprobado'>) => void;
  onDeleteTrabajoAprobado: (id: string) => void;
  referralHistory: ReferralHistoryRecord[];
  onAddReferralRecord: (rec: Omit<ReferralHistoryRecord, 'id' | 'createdAt'>) => void;
  onDeleteReferralRecord: (id: string) => void;
  onResetCounters?: () => void;
  catalogVigenciaLabel?: string;
  onUpdateCatalogVigenciaLabel?: (next: string) => Promise<void> | void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const ADMIN_COUNTERS_RESET_KEY = 'aluminero_admin_counters_reset_at_v2';

type AdminTabId = 'dashboard' | 'graficas' | 'claves' | 'referidos' | 'precios' | 'mensajes' | 'herramientas' | 'videos';
type PlanFilterId = 'todos' | 'gratis' | 'colega3d' | '30d' | '90d' | '365d' | 'bloqueados';
type ChartGranularity = 'week' | 'month';

type ClassifiedTier = 'gratis' | 'colega3d' | 'prueba_gratis' | '30d' | '90d' | '365d' | 'otros_pro' | 'bloqueado';

function classifyPlanTier(params: {
  isBlocked: boolean;
  hasActivePro: boolean;
  planCode?: string | null;
  planLabel?: string | null;
  dias?: number | null;
  keyCode?: string | null;
  tipo?: string | null;
}): ClassifiedTier {
  if (params.isBlocked) return 'bloqueado';
  if (!params.hasActivePro) return 'gratis';
  if (
    isFreeTestProRecord({
      tipo: params.tipo,
      planCode: params.planCode,
      planLabel: params.planLabel,
      keyCode: params.keyCode,
    })
  ) {
    return 'prueba_gratis';
  }
  const code = String(params.planCode || '').trim().toUpperCase();
  const label = String(params.planLabel || '').toLowerCase();
  const key = String(params.keyCode || '').trim().toUpperCase();
  if (isColleaguePromoPlan(code, params.dias ?? null, key) || /colega|3\s*d[ií]as|regalo/.test(label)) {
    return 'colega3d';
  }
  if (code === 'A' || code === 'V' || /^AP-A-/i.test(key) || /1\s*a[ñn]o|anual|365|vitalici/.test(label) || (params.dias ?? 0) >= 300) {
    return '365d';
  }
  if (code === 'Q' || /^AP-Q-/i.test(key) || /90\s*d[ií]as|trimestral/.test(label) || ((params.dias ?? 0) >= 80 && (params.dias ?? 0) < 300)) {
    return '90d';
  }
  if (code === 'M' || /^AP-M-/i.test(key) || /30\s*d[ií]as|mensual/.test(label) || ((params.dias ?? 0) >= 20 && (params.dias ?? 0) < 80)) {
    return '30d';
  }
  return 'otros_pro';
}

function getIsoWeekLabel(ts: number): { sortKey: string; label: string } {
  const d = new Date(ts);
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const wk = String(weekNo).padStart(2, '0');
  return {
    sortKey: `${utc.getUTCFullYear()}-W${wk}`,
    label: `Sem ${wk}`,
  };
}

function getMonthLabel(ts: number): { sortKey: string; label: string } {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = d.getMonth();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return {
    sortKey: `${yyyy}-${String(mm + 1).padStart(2, '0')}`,
    label: `${months[mm]} ${String(yyyy).slice(2)}`,
  };
}

const QUICK_PLAN_OPTIONS = [
  { id: 'colega', label: 'Colega 3 días', planIdx: 0, code: 'G', days: 3, fullLabel: 'Regalo / Promo Colega 3 días' },
  { id: '30d', label: 'PRO 30 días', planIdx: 1, code: 'M', days: 30, fullLabel: 'Promo 30 Días PRO' },
  { id: '90d', label: 'PRO 90 días', planIdx: 2, code: 'Q', days: 90, fullLabel: 'Plan 90 Días PRO' },
  { id: '365d', label: 'PRO 1 Año', planIdx: 3, code: 'A', days: 365, fullLabel: 'Plan 1 Año PRO' },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  deviceId,
  licencia,
  adminKeys,
  revokedDevicesMap,
  revokedKeys,
  cloudDevices,
  cloudConnected,
  cloudRefreshing,
  cloudLastSyncAt,
  formulas,
  backupData,
  onExit,
  onActivateLic,
  onRecordAdminKey,
  onDeleteAdminKey,
  onRefreshCloud,
  onCloudActivateDevice,
  onRevokePromo,
  onRevokeFreeAccess,
  onResetPromoColega,
  onImportFormulas,
  onImportBackup,
  sugerenciasWhatsapp,
  onSaveSugerenciasWhatsapp,
  trabajosAntesDespues,
  onPublishTrabajoAprobado,
  onDeleteTrabajoAprobado,
  referralHistory,
  onAddReferralRecord,
  onDeleteReferralRecord,
  onResetCounters,
  catalogVigenciaLabel,
  onUpdateCatalogVigenciaLabel,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [vigenciaDraft, setVigenciaDraft] = useState<string>(
    () => catalogVigenciaLabel || DEFAULT_CATALOG_VIGENCIA_LABEL
  );
  const [vigenciaSaving, setVigenciaSaving] = useState(false);

  useEffect(() => {
    if (catalogVigenciaLabel) {
      setVigenciaDraft(catalogVigenciaLabel);
    }
  }, [catalogVigenciaLabel]);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [countersResetAt, setCountersResetAt] = useState<number>(() => {
    try {
      const saved = window.localStorage.getItem(ADMIN_COUNTERS_RESET_KEY);
      if (saved !== null) {
        const parsed = Number(saved);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
      // Por defecto 0 para mostrar en tiempo real todos los dispositivos en Firestore (Gratuitos y PRO)
      return 0;
    } catch {
      return 0;
    }
  });
  const [confirmResetCounters, setConfirmResetCounters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilterId>('todos');
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('week');
  const [expandedUserDevId, setExpandedUserDevId] = useState<string | null>(null);
  const [expandedActionDevId, setExpandedActionDevId] = useState<string | null>(null);
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [phonePlaceholder] = useState<string>(() => generateRandomMxPhonePlaceholder());
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [firebaseAuthBusy, setFirebaseAuthBusy] = useState(false);
  const [firebaseAuthDiagnostic, setFirebaseAuthDiagnostic] = useState<AdminAuthDiagnostic | null>(
    null
  );
  const [serverDevicesCount, setServerDevicesCount] = useState<number | null>(null);
  const [serverDevicesList, setServerDevicesList] = useState<CloudDeviceRecord[] | null>(null);
  const [serverSyncBusy, setServerSyncBusy] = useState(false);
  const [serverLastSyncAt, setServerLastSyncAt] = useState<number | null>(null);
  const [serverSyncFeedback, setServerSyncFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    syncedAt: number;
  } | null>(null);
  const lastSyncedAdminUidRef = useRef<string | null>(null);
  const onRefreshCloudRef = useRef(onRefreshCloud);
  onRefreshCloudRef.current = onRefreshCloud;
  const onShowToastRef = useRef(onShowToast);
  onShowToastRef.current = onShowToast;

  const fetchDevicesFromServerDirect = async (options?: { silent?: boolean }) => {
    if (serverSyncBusy) return;
    setServerSyncBusy(true);
    if (!options?.silent) {
      setServerSyncFeedback(null);
    }
    try {
      const snapshot = await getDocsFromServer(collection(db, 'devices'));
      const totalServerUsers = snapshot.size;
      const freshDevices: CloudDeviceRecord[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as CloudDeviceRecord;
        const devId = normalizeDeviceIdInput(data?.deviceId || docSnap.id) || docSnap.id;
        return {
          ...data,
          deviceId: devId,
        };
      });
      const syncedNow = Date.now();
      setServerDevicesCount(totalServerUsers);
      setServerDevicesList(freshDevices);
      setServerLastSyncAt(syncedNow);

      const okMsg = `Nube actualizada: ${totalServerUsers} ${
        totalServerUsers === 1 ? 'usuario encontrado' : 'usuarios encontrados'
      }`;
      if (!options?.silent) {
        setServerSyncFeedback({
          type: 'success',
          message: okMsg,
          syncedAt: syncedNow,
        });
        onShowToastRef.current(okMsg, true);
      }

      // Sincronizar también colecciones complementarias en App.tsx (claves, revocados, bloqueados)
      try {
        await onRefreshCloudRef.current();
      } catch {
        // Ignorar error secundario si la lectura principal de devices ya tuvo éxito
      }
    } catch (err) {
      const errCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      const rawMsg = err instanceof Error ? err.message : String(err || 'Error desconocido');
      let friendlyMsg = `Error al sincronizar nube${errCode ? ` (${errCode})` : ''}: ${rawMsg}`;
      if (isFirestorePermissionDeniedError(err)) {
        friendlyMsg = isFirebaseAdminUser(auth.currentUser)
          ? 'Permisos insuficientes en Firebase (permission-denied) al consultar devices. Verifica las reglas o vuelve a conectar tu cuenta Google.'
          : 'Permisos insuficientes en Firebase: conecta tu cuenta Google de Administrador (botón "Conectar Google") para leer el conteo real de usuarios en la nube.';
      } else if (isFirestoreOfflineError(err) || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        friendlyMsg = 'Sin conexión con Firebase. Verifica tu internet e intenta presionar "Actualizar Nube" nuevamente.';
      }
      if (!options?.silent) {
        setServerSyncFeedback({
          type: 'error',
          message: friendlyMsg,
          syncedAt: Date.now(),
        });
        onShowToastRef.current(friendlyMsg);
      }
    } finally {
      setServerSyncBusy(false);
    }
  };
  const fetchDevicesFromServerRef = useRef(fetchDevicesFromServerDirect);
  fetchDevicesFromServerRef.current = fetchDevicesFromServerDirect;

  useEffect(() => {
    let active = true;

    const handleAuthenticatedAdminUser = (user: User, showSuccessToast = false) => {
      if (!active) return;
      setFirebaseUser(user);
      setFirebaseAuthDiagnostic(null);
      if (isFirebaseAdminUser(user)) {
        if (lastSyncedAdminUidRef.current !== user.uid) {
          lastSyncedAdminUidRef.current = user.uid;
          if (showSuccessToast) {
            onShowToastRef.current('Conectado en Nube como Administrador', true);
          }
          void fetchDevicesFromServerRef.current({ silent: true });
        }
      } else if (showSuccessToast) {
        onShowToastRef.current(
          'Sesión iniciada, pero solo el correo de Administrador tiene acceso completo a Firestore.'
        );
      }
    };

    const unsub = subscribeFirebaseAuth((user) => {
      if (!active) return;
      if (user) {
        handleAuthenticatedAdminUser(user, false);
      } else {
        lastSyncedAdminUidRef.current = null;
        setFirebaseUser(null);
      }
    });

    // Al montar AdminDashboardView, recibir resultado de signInWithRedirect en móvil / PWA
    void (async () => {
      try {
        const redirectCred = await getRedirectResult(auth);
        if (!active) return;
        if (redirectCred?.user) {
          handleAuthenticatedAdminUser(redirectCred.user, true);
          return;
        }
        // Si App.tsx consumió getRedirectResult antes de montar el panel, respetar resultado/error
        const cachedOutcome = getLastGoogleRedirectOutcome();
        if (cachedOutcome?.status === 'signed_in') {
          handleAuthenticatedAdminUser(cachedOutcome.user, false);
        } else if (cachedOutcome?.status === 'error' && !auth.currentUser) {
          const diag = formatAdminAuthDiagnostic({
            code: cachedOutcome.code,
            message: cachedOutcome.message,
          });
          setFirebaseAuthDiagnostic(diag);
        }
      } catch (redirectErr) {
        if (!active) return;
        const diag = formatAdminAuthDiagnostic(redirectErr);
        setFirebaseAuthDiagnostic(diag);
        onShowToastRef.current(diag.fullMessage);
      }
    })();

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const isFirebaseAdminSignedIn = isFirebaseAdminUser(firebaseUser);
  const isAdminCloudOnline = cloudConnected || isFirebaseAdminSignedIn;

  const handleToggleFirebaseGoogleAuth = async () => {
    if (firebaseAuthBusy) return;
    setFirebaseAuthBusy(true);
    setFirebaseAuthDiagnostic(null);
    try {
      if (firebaseUser) {
        await signOutFirebase();
        lastSyncedAdminUidRef.current = null;
        onShowToast('Sesión de nube desconectada');
        return;
      }

      const result = await connectGoogleAccountWithFallback();
      if (result.status === 'redirecting') {
        onShowToast('Redirigiendo a Google para iniciar sesión...');
        return;
      }
      if (result.status === 'signed_in') {
        setFirebaseUser(result.user);
        setFirebaseAuthDiagnostic(null);
        if (isFirebaseAdminUser(result.user)) {
          lastSyncedAdminUidRef.current = result.user.uid;
          onShowToast('Conectado en Nube como Administrador', true);
          void fetchDevicesFromServerDirect({ silent: false });
        } else {
          onShowToast(
            'Sesión iniciada, pero solo el correo de Administrador tiene acceso completo a Firestore.'
          );
        }
        return;
      }
      if (result.code === 'auth/popup-closed-by-user' || result.code === 'auth/cancelled-popup-request') {
        onShowToast('Ventana de Google cerrada antes de completar el inicio de sesión.');
        return;
      }

      const diag = formatAdminAuthDiagnostic({
        code: result.code,
        message: result.message,
      });
      setFirebaseAuthDiagnostic(diag);
      onShowToast(`${diag.fullMessage} (${result.code})`);
    } finally {
      setFirebaseAuthBusy(false);
    }
  };

  // Confirmations
  const [pendingAction, setPendingAction] = useState<
    | { type: 'revokePromo'; deviceId: string; cliente: string; keyCode?: string }
    | { type: 'blockFree'; deviceId: string; cliente: string; keyCode?: string }
    | { type: 'resetColega'; deviceId: string; cliente: string }
    | { type: 'deleteRecord'; rec: AdminKeyRecord }
    | null
  >(null);

  // Key generator tab state
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [targetDevice, setTargetDevice] = useState(deviceId);
  const [planIdx, setPlanIdx] = useState<number>(1);
  const [customDaysStr, setCustomDaysStr] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteModalText, setPasteModalText] = useState('');
  const [pasteAutoGen, setPasteAutoGen] = useState(true);
  const [confirmDirectCloudOpen, setConfirmDirectCloudOpen] = useState(false);

  // Permanent free PRO (pruebas / cortesías) state — $0 MXN, tipo: 'prueba_gratis'
  const [permTestDeviceId, setPermTestDeviceId] = useState(deviceId);
  const [permTestLabel, setPermTestLabel] = useState('');
  const [permTestBusy, setPermTestBusy] = useState(false);
  const [permTestGeneratedKey, setPermTestGeneratedKey] = useState('');

  // Reference Prices tab state
  const [refPricesDoc, setRefPricesDoc] = useState<ReferencePricesDoc>(() => ({
    ...DEFAULT_REFERENCE_PRICES,
    items: DEFAULT_REFERENCE_PRICES.items.map((i) => ({ ...i })),
  }));
  const [refSaving, setRefSaving] = useState(false);
  const importRefPricesInputRef = useRef<HTMLInputElement>(null);

  // Admin Messages / Avisos tab state
  const [adminMessages, setAdminMessages] = useState<AdminMessageItem[]>([]);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgType, setMsgType] = useState<AdminMessageType>('aviso');
  const [msgTargetMode, setMsgTargetMode] = useState<'all' | 'individual'>('all');
  const [msgTargetDeviceId, setMsgTargetDeviceId] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  // Referrals tab state
  const [refSearch, setRefSearch] = useState('');
  const [manualReferrerId, setManualReferrerId] = useState('');
  const [manualReferredId, setManualReferredId] = useState('');
  const [manualReferredName, setManualReferredName] = useState('');
  const [manualPlanCode, setManualPlanCode] = useState<'M' | 'Q' | 'A' | 'G'>('M');

  // Tools / Backup tab state
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [waSugerenciasInput, setWaSugerenciasInput] = useState(sugerenciasWhatsapp);
  const [waSugerenciasError, setWaSugerenciasError] = useState('');
  const [adTitulo, setAdTitulo] = useState('');
  const [adLinea, setAdLinea] = useState('Línea Nacional 3"');
  const [adDesc, setAdDesc] = useState('');
  const [adAntesUrl, setAdAntesUrl] = useState('');
  const [adDespuesUrl, setAdDespuesUrl] = useState('');
  const importFormulasRef = useRef<HTMLInputElement>(null);
  const importBackupRef = useRef<HTMLInputElement>(null);
  const adminAntesRef = useRef<HTMLInputElement>(null);
  const adminDespuesRef = useRef<HTMLInputElement>(null);
  const importVideosJsonRef = useRef<HTMLInputElement>(null);

  // Video Tutoriales Firestore state
  const [adminVideos, setAdminVideos] = useState<TutorialVideoItem[]>(() => loadTutorialVideosCache());
  const [vidEditingId, setVidEditingId] = useState<string | null>(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidDesc, setVidDesc] = useState('');
  const [vidCategory, setVidCategory] = useState<TutorialVideoCategoryId>('primeros-pasos');
  const [vidUrl, setVidUrl] = useState('');
  const [vidSaving, setVidSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeTutorialVideos((items) => {
      setAdminVideos(items);
      saveTutorialVideosCache(items);
    });
    const unsubPrices = subscribeReferencePrices((doc) => {
      if (doc && Array.isArray(doc.items) && doc.items.length > 0) {
        setRefPricesDoc(doc);
      }
    });
    const unsubMsgs = subscribeAdminMessages((items) => {
      setAdminMessages(items);
    });
    return () => {
      unsub();
      unsubPrices();
      unsubMsgs();
    };
  }, []);

  useEffect(() => {
    void onRefreshCloud();
    if (isFirebaseAdminUser(auth.currentUser)) {
      void fetchDevicesFromServerRef.current({ silent: true });
    }
    const timer = window.setInterval(() => setNowTick(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setWaSugerenciasInput(sugerenciasWhatsapp);
  }, [sugerenciasWhatsapp]);

  const revokedKeysSet = useMemo(
    () => new Set(revokedKeys.map((k) => k.trim().toUpperCase())),
    [revokedKeys]
  );

  const activeReferralHistory = useMemo(
    () => filterAdminRecordsByResetBaseline(referralHistory, countersResetAt),
    [referralHistory, countersResetAt]
  );

  const handleConfirmResetCounters = () => {
    const ts = Date.now();
    setCountersResetAt(ts);
    try {
      window.localStorage.setItem(ADMIN_COUNTERS_RESET_KEY, String(ts));
    } catch {
      // ignore storage quota errors
    }
    onResetCounters?.();
    setConfirmResetCounters(false);
    onShowToast('Contadores estadísticos reiniciados a 0. Se actualizarán con cada nuevo registro real.', true);
  };

  const activeCloudDevices = useMemo(
    () => (serverDevicesList !== null ? serverDevicesList : cloudDevices),
    [serverDevicesList, cloudDevices]
  );

  // Merge filtered cloud devices + adminKeys history into a single auditable user directory (starts at 0 cleanly)
  const auditUsers = useMemo(() => {
    const cleanSelfId = normalizeDeviceIdInput(deviceId) || deviceId.trim().toUpperCase();
    const now = nowTick;

    const effectiveAdminKeys = filterAdminRecordsByResetBaseline(adminKeys, countersResetAt);
    const effectiveCloudDevices = filterAdminRecordsByResetBaseline(activeCloudDevices, countersResetAt);

    // Group all historical keys per device
    const keysByDevice = new Map<string, AdminKeyRecord[]>();
    for (const k of effectiveAdminKeys) {
      const norm = normalizeDeviceIdInput(k.deviceId);
      if (!norm) continue;
      const list = keysByDevice.get(norm) || [];
      list.push(k);
      keysByDevice.set(norm, list);
    }
    for (const [norm, list] of keysByDevice.entries()) {
      list.sort((a, b) => b.createdAt - a.createdAt);
      keysByDevice.set(norm, list);
    }

    const devById = new Map<string, CloudDeviceRecord>();
    for (const dev of effectiveCloudDevices) {
      const norm = normalizeDeviceIdInput(dev.deviceId);
      if (norm) devById.set(norm, dev);
    }

    // Do NOT inject cleanSelfId as a dummy user when there is no real record after reset
    const allIds = Array.from(new Set([...devById.keys(), ...keysByDevice.keys()])).filter(Boolean);

    return allIds
      .map((normId) => {
        const dev = devById.get(normId) || null;
        const historyKeys = keysByDevice.get(normId) || [];
        const latestKey = historyKeys[0] || null;
        const isSelf = normId === cleanSelfId;

        const isBlocked = Boolean(dev?.blocked || dev?.planCode === 'BLOCKED');
        const keyCode = (latestKey?.key || dev?.lastKey || '').trim().toUpperCase();
        const localRevokedTs = revokedDevicesMap[normId] ?? 0;
        const isDevRevoked = Boolean(dev && (dev.revoked || dev.planCode === 'REVOKED'));
        const isKeyRevoked = Boolean(
          latestKey && (latestKey.revoked || localRevokedTs >= latestKey.createdAt || revokedKeysSet.has(keyCode))
        );
        const unassignedAutoTrial = Boolean(dev && !isBlocked && !isDevRevoked && isUnassignedAutoTrialDevice(dev));

        const localSelfActivePro = Boolean(
          isSelf &&
            licencia?.active &&
            (Boolean(licencia.activatedKey?.trim()) || Boolean(licencia.adminAssigned)) &&
            isProActive(licencia, now)
        );
        const devActivePro = Boolean(
          dev &&
            !isBlocked &&
            !isDevRevoked &&
            !unassignedAutoTrial &&
            dev.proActive &&
            (dev.expiresAt === null || dev.expiresAt > now)
        );
        const keyActivePro = Boolean(
          latestKey &&
            !isBlocked &&
            !isKeyRevoked &&
            (!dev || !isDevRevoked) &&
            (latestKey.expiresAt === null || latestKey.expiresAt > now)
        );

        const hasActivePro = !isBlocked && (localSelfActivePro || devActivePro || keyActivePro);
        const isRevoked = !isBlocked && !hasActivePro && (isDevRevoked || isKeyRevoked);

        const effectivePlanCode = isBlocked
          ? 'BLOCKED'
          : hasActivePro
            ? (localSelfActivePro ? licencia!.planCode : devActivePro ? dev!.planCode : latestKey?.dias === 3 ? 'G' : latestKey?.dias === 30 ? 'M' : latestKey?.dias === 90 ? 'Q' : latestKey?.dias === 365 ? 'A' : 'PRO')
            : 'FREE';

        const effectivePlanLabel = isBlocked
          ? 'Bloqueado'
          : hasActivePro
            ? (localSelfActivePro
                ? licencia!.planLabel
                : devActivePro
                  ? dev!.planLabel
                  : latestKey?.planLabel || 'PRO')
            : isRevoked
              ? 'Versión Gratuita (Revocada)'
              : 'Versión Gratuita';

        const effectiveTipo =
          (localSelfActivePro ? licencia?.tipo : null) ||
          latestKey?.tipo ||
          dev?.tipo ||
          (isFreeTestProRecord({
            planCode: effectivePlanCode,
            planLabel: effectivePlanLabel,
            keyCode,
          })
            ? 'prueba_gratis'
            : undefined);

        const tier = classifyPlanTier({
          isBlocked,
          hasActivePro,
          planCode: effectivePlanCode,
          planLabel: effectivePlanLabel,
          dias: latestKey?.dias ?? null,
          keyCode,
          tipo: effectiveTipo,
        });

        const hasHistoricalColleagueKey = historyKeys.some((k) =>
          isColleaguePromoPlan(null, k.dias, k.key)
        );
        const promoColegaUsed = Boolean(
          dev?.promo_colega_usada ||
            tier === 'colega3d' ||
            hasHistoricalColleagueKey
        );
        const colegaKeyDate =
          historyKeys.find((k) => isColleaguePromoPlan(null, k.dias, k.key))?.createdAt ?? null;
        const fechaActivacionColega =
          dev?.fecha_activacion_colega ?? colegaKeyDate ?? (tier === 'colega3d' ? dev?.updatedAt ?? null : null);

        const activatedAt =
          hasActivePro
            ? (localSelfActivePro
                ? licencia!.activatedAt
                : latestKey?.createdAt || dev?.updatedAt || dev?.firstSeenAt || null)
            : latestKey?.createdAt || dev?.firstSeenAt || null;

        const expiresAt = isBlocked || !hasActivePro
          ? null
          : localSelfActivePro
            ? licencia!.expiresAt
            : devActivePro
              ? dev!.expiresAt
              : latestKey?.expiresAt ?? null;

        const selfDisplayName =
          backupData.taller?.clienteDefault?.trim() ||
          backupData.taller?.nombre?.trim() ||
          'Este equipo (Admin)';

        const rawCliente =
          dev?.nombreTaller && dev.nombreTaller.trim()
            ? dev.nombreTaller.trim()
            : dev?.cliente && dev.cliente !== 'Cliente sin nombre'
              ? dev.cliente
              : latestKey?.cliente || (isSelf ? selfDisplayName : 'Usuario sin nombre');

        const clienteDisplay = formatClientHeaderDisplay(rawCliente) || 'Usuario sin nombre';
        const linkedEmail = dev?.linkedEmail || latestKey?.linkedEmail || '';

        const phoneMatch = rawCliente.match(/(?:\+?52[\s-]*)?(\d[\d\s-]{8,13}\d)/);
        const rawPhoneDigits = phoneMatch
          ? phoneMatch[1].replace(/\D/g, '').slice(-10)
          : isSelf
            ? String(backupData.taller?.tel || '').replace(/\D/g, '').slice(-10)
            : '';
        const telefonoDisplay = rawPhoneDigits ? formatMxPhoneDashed(rawPhoneDigits) : 'Sin teléfono';
        const nombreSolo =
          clienteDisplay
            .replace(/\s*·\s*[\d\s-]{8,}$/, '')
            .replace(/\s+[\d-]{10,}$/, '')
            .trim() || 'Usuario sin nombre';

        const deleteRecord: AdminKeyRecord = latestKey
          ? { ...latestKey, deviceId: normId, cliente: rawCliente }
          : {
              id: `FREE-${normId}`,
              deviceId: normId,
              cliente: rawCliente,
              planLabel: effectivePlanLabel,
              dias: null,
              key: keyCode,
              createdAt: dev?.firstSeenAt || now,
              expiresAt: null,
              linkedEmail: linkedEmail || undefined,
            };

        return {
          deviceId: normId,
          isSelf,
          clienteRaw: rawCliente,
          clienteDisplay,
          nombreSolo,
          telefonoDisplay,
          linkedEmail,
          deviceLabel: dev?.deviceLabel || 'Dispositivo Web',
          tier,
          hasActivePro,
          isBlocked,
          isRevoked,
          planCode: effectivePlanCode,
          planLabel: effectivePlanLabel,
          keyCode,
          promoColegaUsed,
          fechaActivacionColega,
          activatedAt,
          expiresAt,
          firstSeenAt: dev?.firstSeenAt ?? latestKey?.createdAt ?? now,
          lastSeenAt: dev?.lastSeenAt ?? latestKey?.createdAt ?? now,
          historyKeys,
          deleteRecord,
        };
      })
      .sort((a, b) => {
        if (a.isSelf) return -1;
        if (b.isSelf) return 1;
        return b.lastSeenAt - a.lastSeenAt;
      });
  }, [activeCloudDevices, adminKeys, deviceId, licencia, backupData.taller, revokedDevicesMap, revokedKeysSet, nowTick, countersResetAt]);

  // KPI metrics (los planes internos tipo 'prueba_gratis' NUNCA suman a ventas ni a Conversión a PRO Pagado)
  const kpis = useMemo(() => {
    let gratis = 0;
    let colega3d = 0;
    let pruebasGratis = 0;
    let pro30 = 0;
    let pro90 = 0;
    let pro365 = 0;
    let otrosPro = 0;
    let bloqueados = 0;
    let colegaUsadaTotal = 0;

    for (const u of auditUsers) {
      if (u.promoColegaUsed) colegaUsadaTotal++;
      switch (u.tier) {
        case 'gratis':
          gratis++;
          break;
        case 'colega3d':
          colega3d++;
          break;
        case 'prueba_gratis':
          pruebasGratis++;
          break;
        case '30d':
          pro30++;
          break;
        case '90d':
          pro90++;
          break;
        case '365d':
          pro365++;
          break;
        case 'otros_pro':
          otrosPro++;
          break;
        case 'bloqueado':
          bloqueados++;
          break;
      }
    }

    const totalProPaid = pro30 + pro90 + pro365 + otrosPro;
    const totalNonTestUsers = Math.max(0, auditUsers.length - pruebasGratis);
    return {
      totalUsers: totalNonTestUsers,
      gratis,
      colega3d,
      pruebasGratis,
      pro30,
      pro90,
      pro365,
      otrosPro,
      totalProPaid,
      bloqueados,
      colegaUsadaTotal,
    };
  }, [auditUsers]);

  // Chart 1 & 2: Plan distribution (Bars + Donut)
  const planDistributionData = useMemo(
    () => [
      { name: 'Gratis', usuarios: kpis.gratis, color: '#64748b' },
      { name: 'Colega 3d', usuarios: kpis.colega3d, color: '#10b981' },
      { name: 'PRO 30d', usuarios: kpis.pro30, color: '#3b82f6' },
      { name: 'PRO 90d', usuarios: kpis.pro90, color: '#8b5cf6' },
      { name: 'PRO 1 Año', usuarios: kpis.pro365, color: '#f59e0b' },
      ...(kpis.otrosPro > 0 ? [{ name: 'Otros PRO', usuarios: kpis.otrosPro, color: '#06b6d4' }] : []),
    ],
    [kpis]
  );

  // Chart 4: Colleague 3-day single-use security breakdown
  const colleagueAuditData = useMemo(() => {
    let convertedToPro = 0;
    let available = 0;
    for (const u of auditUsers) {
      if (u.promoColegaUsed && u.hasActivePro && u.tier !== 'colega3d') {
        convertedToPro++;
      }
      if (!u.promoColegaUsed && !u.isBlocked) {
        available++;
      }
    }
    return [
      { name: 'Activos hoy (3d)', cantidad: kpis.colega3d, color: '#10b981' },
      { name: 'Ya la usaron (total)', cantidad: kpis.colegaUsadaTotal, color: '#f59e0b' },
      { name: 'Pasaron a PRO', cantidad: convertedToPro, color: '#3b82f6' },
      { name: 'Aún disponible', cantidad: available, color: '#64748b' },
    ];
  }, [auditUsers, kpis.colega3d, kpis.colegaUsadaTotal]);

  const analyticsRates = useMemo(() => {
    const proRate = kpis.totalUsers > 0 ? Math.round((kpis.totalProPaid / kpis.totalUsers) * 100) : 0;
    const colegaUsageRate =
      kpis.totalUsers > 0 ? Math.round((kpis.colegaUsadaTotal / kpis.totalUsers) * 100) : 0;
    const estimatedProValue = kpis.pro30 * 369 + kpis.pro90 * 989 + kpis.pro365 * 1799;
    const paidKeysIssued = filterAdminRecordsByResetBaseline(adminKeys, countersResetAt).filter(
      (k) => !isFreeTestProRecord({ tipo: k.tipo, planLabel: k.planLabel, keyCode: k.key })
    ).length;
    return {
      proRate,
      colegaUsageRate,
      estimatedProValue,
      totalKeysIssued: paidKeysIssued,
    };
  }, [kpis, adminKeys, countersResetAt]);

  // Chart 2: Promo activations per week or month
  const activationsSeriesData = useMemo(() => {
    const events: { ts: number; isColleague: boolean }[] = [];
    const seenSigs = new Set<string>();
    const filteredKeys = filterAdminRecordsByResetBaseline(adminKeys, countersResetAt);

    for (const k of filteredKeys) {
      if (!k.createdAt) continue;
      const sig = `${normalizeDeviceIdInput(k.deviceId)}::${k.createdAt}`;
      seenSigs.add(sig);
      events.push({
        ts: k.createdAt,
        isColleague: isColleaguePromoPlan(null, k.dias, k.key),
      });
    }

    for (const u of auditUsers) {
      if (u.fechaActivacionColega) {
        const sig = `${u.deviceId}::colega::${Math.floor(u.fechaActivacionColega / 60000)}`;
        if (!seenSigs.has(sig)) {
          seenSigs.add(sig);
          events.push({ ts: u.fechaActivacionColega, isColleague: true });
        }
      }
      if (u.hasActivePro && u.tier !== 'colega3d' && u.activatedAt && u.historyKeys.length === 0) {
        events.push({ ts: u.activatedAt, isColleague: false });
      }
    }

    const buckets = new Map<string, { sortKey: string; label: string; total: number; colega: number; pagos: number }>();

    // Seed last 6 periods so chart always has clean X-axis structure even with low data
    const now = Date.now();
    const periodCount = chartGranularity === 'week' ? 8 : 6;
    for (let i = periodCount - 1; i >= 0; i--) {
      const refTs =
        chartGranularity === 'week'
          ? now - i * 7 * 24 * 60 * 60 * 1000
          : new Date(new Date(now).getFullYear(), new Date(now).getMonth() - i, 15).getTime();
      const b = chartGranularity === 'week' ? getIsoWeekLabel(refTs) : getMonthLabel(refTs);
      if (!buckets.has(b.sortKey)) {
        buckets.set(b.sortKey, { sortKey: b.sortKey, label: b.label, total: 0, colega: 0, pagos: 0 });
      }
    }

    for (const ev of events) {
      const b = chartGranularity === 'week' ? getIsoWeekLabel(ev.ts) : getMonthLabel(ev.ts);
      const entry = buckets.get(b.sortKey) || {
        sortKey: b.sortKey,
        label: b.label,
        total: 0,
        colega: 0,
        pagos: 0,
      };
      entry.total += 1;
      if (ev.isColleague) entry.colega += 1;
      else entry.pagos += 1;
      buckets.set(b.sortKey, entry);
    }

    return Array.from(buckets.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-10);
  }, [adminKeys, auditUsers, chartGranularity, countersResetAt]);

  // Conteo directo en tiempo real desde Firestore `devices` usando getDocsFromServer (snapshot.size)
  const cloudRealtimeCounts = useMemo(() => {
    const now = nowTick;
    let gratis = 0;
    let pro = 0;
    for (const dev of activeCloudDevices) {
      const isProDev = Boolean(
        !dev.blocked &&
          !dev.revoked &&
          dev.planCode !== 'BLOCKED' &&
          dev.planCode !== 'REVOKED' &&
          !isUnassignedAutoTrialDevice(dev) &&
          (dev.plan === 'pro' || (dev.proActive && (dev.expiresAt === null || dev.expiresAt > now)))
      );
      if (isProDev) pro += 1;
      else gratis += 1;
    }
    const total = serverDevicesCount !== null ? serverDevicesCount : activeCloudDevices.length;
    return { total, gratis, pro };
  }, [activeCloudDevices, serverDevicesCount, nowTick]);

  // Gráficas Recharts: Cotizaciones generadas por mes y Materiales más utilizados
  const savedQuotesForCharts = useMemo(
    () => loadCotizacionesGuardadas(),
    [activeTab, (backupData.historial || []).length, nowTick]
  );

  const monthlyQuotesChartData = useMemo(
    () => buildMonthlyQuotesSeries(backupData.historial || [], savedQuotesForCharts),
    [savedQuotesForCharts, backupData.historial]
  );

  const topMaterialsChartData = useMemo(
    () =>
      buildTopMaterialsSeries(
        backupData.historial || [],
        savedQuotesForCharts,
        backupData.inventario || {}
      ),
    [savedQuotesForCharts, backupData.historial, backupData.inventario]
  );

  // Filtered audit users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return auditUsers.filter((u) => {
      if (planFilter === 'gratis' && u.tier !== 'gratis') return false;
      if (planFilter === 'colega3d' && u.tier !== 'colega3d') return false;
      if (planFilter === '30d' && u.tier !== '30d') return false;
      if (planFilter === '90d' && u.tier !== '90d') return false;
      if (planFilter === '365d' && u.tier !== '365d') return false;
      if (planFilter === 'bloqueados' && u.tier !== 'bloqueado') return false;
      if (!q) return true;
      return (
        u.deviceId.toLowerCase().includes(q) ||
        u.clienteDisplay.toLowerCase().includes(q) ||
        u.clienteRaw.toLowerCase().includes(q) ||
        u.linkedEmail.toLowerCase().includes(q) ||
        u.planLabel.toLowerCase().includes(q)
      );
    });
  }, [auditUsers, searchQuery, planFilter]);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      // ignore
    }
    setCopiedId(id);
    onShowToast(`ID ${id} copiado`, true);
    window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
  };

  // Quick plan change/renewal for any user in audit list
  const handleQuickAssignPlan = async (
    targetUser: (typeof auditUsers)[number],
    opt: (typeof QUICK_PLAN_OPTIONS)[number]
  ) => {
    setBusyDeviceId(targetUser.deviceId);
    try {
      const now = Date.now();
      const key = generateActivationKey(targetUser.deviceId, opt.planIdx, null);
      const expiresAt = now + opt.days * 24 * 60 * 60 * 1000;
      const cleanCliente = targetUser.clienteRaw || targetUser.clienteDisplay || 'Cliente';

      onRecordAdminKey({
        id: `ak-${now}`,
        cliente: cleanCliente,
        deviceId: targetUser.deviceId,
        planLabel: opt.fullLabel,
        dias: opt.days,
        key,
        createdAt: now,
        expiresAt,
      });

      if (targetUser.isSelf) {
        onActivateLic({
          active: true,
          planCode: opt.code,
          planLabel: opt.fullLabel,
          expiresAt,
          activatedAt: now,
          activatedKey: key,
          adminAssigned: true,
        });
      }

      const ok = await onCloudActivateDevice({
        deviceId: targetUser.deviceId,
        cliente: cleanCliente,
        planCode: opt.code,
        planLabel: opt.fullLabel,
        expiresAt,
        key,
        dias: opt.days,
        revoke: false,
        recordKeyOnly: false,
      });

      if (ok === false) {
        onShowToast(`Error al conectar con la nube para actualizar a ${targetUser.deviceId}`);
      } else {
        onShowToast(`Plan "${opt.label}" asignado a ${targetUser.deviceId}`, true);
        setExpandedActionDevId(null);
      }
    } finally {
      setBusyDeviceId(null);
    }
  };

  // Key generator helpers
  const parsedCustomDays = customDaysStr.trim()
    ? Math.max(1, Math.min(3650, Math.round(Number(customDaysStr) || 0)))
    : null;

  const refreshKeyPreview = (
    dev = targetDevice,
    idx = planIdx,
    days = parsedCustomDays,
    name = clienteNombre,
    phone = clienteTelefono
  ) => {
    if (!name.trim() || phone.replace(/\D/g, '').length === 0) {
      setGeneratedKey('');
      return '';
    }
    const cleanDev = normalizeDeviceIdInput(dev, deviceId);
    const key = generateActivationKey(cleanDev, idx, days);
    setGeneratedKey(key);
    return key;
  };

  const applyParsedWhatsappText = (rawText: string, autoGenerate: boolean): boolean => {
    const parsed = parseWhatsappKeyRequestMessage(rawText);
    if (!parsed.hasValidDeviceId || !parsed.deviceId) {
      onShowToast('No se detectó un ID de equipo válido, verifica el mensaje');
      return false;
    }
    const nextCliente = parsed.cliente || clienteNombre || 'Cliente Taller';
    const nextPhone = parsed.telefono ? formatMxPhoneDashed(parsed.telefono) : clienteTelefono;
    const nextPlanIdx = typeof parsed.planIdx === 'number' ? parsed.planIdx : planIdx;

    setClienteNombre(nextCliente);
    setClienteTelefono(nextPhone);
    setTargetDevice(parsed.deviceId);
    setPlanIdx(nextPlanIdx);
    setCustomDaysStr('');

    if (autoGenerate) {
      const key = generateActivationKey(parsed.deviceId, nextPlanIdx, null);
      setGeneratedKey(key);
      const now = Date.now();
      const plan = PLANS.find((p) => p.idx === nextPlanIdx) || PLANS[0];
      const expiresAt = now + plan.days * 24 * 60 * 60 * 1000;
      const cleanCliente = formatCombinedClientLabel(nextCliente, nextPhone || '0000000000');
      onRecordAdminKey({
        id: `ak-${now}`,
        cliente: cleanCliente,
        deviceId: parsed.deviceId,
        planLabel: plan.label,
        dias: plan.days,
        key,
        createdAt: now,
        expiresAt,
        tipo: 'pagado',
      });
      void Promise.resolve(
        onCloudActivateDevice({
          deviceId: parsed.deviceId,
          cliente: cleanCliente,
          planCode: plan.code,
          planLabel: plan.label,
          expiresAt,
          key,
          dias: plan.days,
          recordKeyOnly: true,
        })
      ).catch(() => false);
      void navigator.clipboard.writeText(key).catch(() => {});
      onShowToast(`Clave ${key} generada, copiada y registrada para ${parsed.deviceId}`, true);
    } else {
      const preview = generateActivationKey(parsed.deviceId, nextPlanIdx, null);
      setGeneratedKey(preview);
      onShowToast(`Datos extraídos para ${parsed.deviceId}`, true);
    }
    return true;
  };

  const handleOneClickClipboardPaste = async (autoGenerate: boolean) => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt && txt.trim()) {
        applyParsedWhatsappText(txt, autoGenerate);
        return;
      }
    } catch {
      // Clipboard read blocked — fall back to manual paste modal
    }
    setPasteAutoGen(autoGenerate);
    setPasteModalText('');
    setPasteModalOpen(true);
  };

  const handleClearKeyForm = () => {
    setClienteNombre('');
    setClienteTelefono('');
    setTargetDevice('');
    setCustomDaysStr('');
    setGeneratedKey('');
    onShowToast('Formulario de claves limpiado');
  };

  const handleActivatePermanentTestPro = async () => {
    const cleanTarget = normalizeDeviceIdInput(permTestDeviceId, deviceId);
    if (!cleanTarget) {
      onShowToast('Escribe un ID de Equipo válido (ej. ALM-XXXX)');
      return;
    }
    setPermTestBusy(true);
    try {
      const now = Date.now();
      const key = generatePermanentTestKey(cleanTarget);
      const planLabel = 'PRO Permanente (Prueba / Cortesía)';
      const cleanNota = permTestLabel.trim() || 'Prueba interna / Cortesía';
      const isSelf = cleanTarget === deviceId.trim().toUpperCase();

      onRecordAdminKey({
        id: `ak-test-${now}`,
        cliente: `${cleanNota} · $0 MXN`,
        deviceId: cleanTarget,
        planLabel,
        dias: null,
        key,
        createdAt: now,
        expiresAt: null,
        tipo: 'prueba_gratis',
      });

      if (isSelf) {
        onActivateLic({
          active: true,
          planCode: 'P',
          planLabel,
          expiresAt: null,
          activatedAt: now,
          activatedKey: key,
          adminAssigned: true,
          tipo: 'prueba_gratis',
        });
      }

      setPermTestGeneratedKey(key);
      void navigator.clipboard.writeText(key).catch(() => {});

      void Promise.resolve(
        onCloudActivateDevice({
          deviceId: cleanTarget,
          cliente: `${cleanNota} · $0 MXN`,
          planCode: 'P',
          planLabel,
          expiresAt: null,
          key,
          dias: null,
          revoke: false,
          recordKeyOnly: false,
        })
      ).catch(() => false);

      onShowToast(
        `PRO Permanente ($0 · Prueba/Cortesía) activado para ${cleanTarget}. No suma a ventas.`,
        true
      );
    } finally {
      setPermTestBusy(false);
    }
  };

  const openWhatsappLink = (phone: string, text: string) => {
    const url = buildWhatsAppDirectUrl(phone, text);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSaveRefPricesCloud = async () => {
    setRefSaving(true);
    try {
      const ok = await saveReferencePricesCloud({
        updatedLabel: refPricesDoc.updatedLabel.trim() || 'Actualizado esta semana',
        nota: refPricesDoc.nota.trim(),
        items: refPricesDoc.items,
      });
      if (ok) {
        onShowToast('Precios de referencia publicados en Firestore', true);
      } else {
        onShowToast('No se pudieron guardar los precios en la nube');
      }
    } finally {
      setRefSaving(false);
    }
  };

  const handleExportRefPricesJson = () => {
    const blob = new Blob([JSON.stringify(refPricesDoc, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `precios-referencia-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    onShowToast('Precios de referencia exportados a JSON', true);
  };

  const handleImportRefPricesFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      if (file.name.toLowerCase().endsWith('.csv')) {
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const imported: ReferencePriceItem[] = [];
        lines.slice(1).forEach((line, idx) => {
          const cols = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 4) {
            const cat = (['aluminio', 'vidrio', 'herrajes'].includes(cols[0])
              ? cols[0]
              : 'aluminio') as ReferencePriceItem['categoria'];
            const precio = Math.max(1, Number(cols[3]) || 0);
            if (cols[1] && precio > 0) {
              imported.push({
                id: `ref-csv-${Date.now()}-${idx}`,
                categoria: cat,
                nombre: cols[1],
                unidad: cols[2] || 'pza',
                precioSugerido: precio,
              });
            }
          }
        });
        if (imported.length === 0) {
          onShowToast('CSV sin filas válidas (formato: categoria,nombre,unidad,precioSugerido)');
          return;
        }
        setRefPricesDoc((prev) => ({ ...prev, items: imported }));
        onShowToast(`${imported.length} precios importados desde CSV`, true);
      } else {
        const parsed = JSON.parse(text) as Partial<ReferencePricesDoc>;
        if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
          onShowToast('Archivo JSON sin lista de items válida');
          return;
        }
        setRefPricesDoc((prev) => ({
          updatedAt: Date.now(),
          updatedLabel: parsed.updatedLabel || prev.updatedLabel,
          nota: parsed.nota ?? prev.nota,
          items: parsed.items as ReferencePriceItem[],
        }));
        onShowToast(`${parsed.items.length} precios cargados desde JSON`, true);
      }
    } catch {
      onShowToast('No se pudo leer el archivo importado');
    }
  };

  const handleSendAdminMessage = async () => {
    const cleanTitle = msgTitle.trim();
    const cleanBody = msgBody.trim();
    if (!cleanTitle || !cleanBody) {
      onShowToast('Escribe el título y el cuerpo del mensaje');
      return;
    }
    const cleanDev = msgTargetMode === 'individual' ? normalizeDeviceIdInput(msgTargetDeviceId) : '';
    if (msgTargetMode === 'individual' && !cleanDev) {
      onShowToast('Selecciona o escribe el ID de equipo destinatario');
      return;
    }
    setMsgSending(true);
    try {
      const targetUser = auditUsers.find((u) => u.deviceId === cleanDev);
      const ok = await sendAdminMessageCloud({
        titulo: cleanTitle,
        cuerpo: cleanBody,
        tipo: msgType,
        targetMode: msgTargetMode,
        targetDeviceId: msgTargetMode === 'individual' ? cleanDev : undefined,
        targetLabel:
          msgTargetMode === 'individual'
            ? targetUser
              ? `${targetUser.clienteDisplay} (${cleanDev})`
              : cleanDev
            : 'Todos los usuarios',
      });
      if (ok) {
        setMsgTitle('');
        setMsgBody('');
        setMsgTargetDeviceId('');
        onShowToast(
          msgTargetMode === 'all'
            ? 'Aviso general enviado a todos los usuarios'
            : `Mensaje enviado a ${cleanDev}`,
          true
        );
      } else {
        onShowToast('Error al enviar el mensaje a Firestore');
      }
    } finally {
      setMsgSending(false);
    }
  };

  const handleActivateDirect = async () => {
    if (!clienteNombre.trim() || clienteTelefono.replace(/\D/g, '').length === 0) {
      onShowToast('Escribe el nombre y teléfono del cliente para activar');
      return;
    }
    const cleanTarget = normalizeDeviceIdInput(targetDevice, deviceId);
    if (!cleanTarget) {
      onShowToast('Escribe el ID de Equipo destino');
      return;
    }
    const key = refreshKeyPreview(cleanTarget, planIdx, parsedCustomDays);
    const now = Date.now();
    const plan = PLANS.find((p) => p.idx === planIdx) || PLANS[0];
    const dias = parsedCustomDays ?? plan.days;
    const planLabel = parsedCustomDays ? `Reposición ${parsedCustomDays} días` : plan.label;
    const planCode = parsedCustomDays ? `D${parsedCustomDays}` : plan.code;
    const expiresAt = now + dias * 24 * 60 * 60 * 1000;
    const isSelf = cleanTarget === deviceId.trim().toUpperCase();
    const cleanCliente = formatCombinedClientLabel(clienteNombre, clienteTelefono);

    onRecordAdminKey({
      id: `ak-${now}`,
      cliente: cleanCliente,
      deviceId: cleanTarget,
      planLabel,
      dias,
      key,
      createdAt: now,
      expiresAt,
    });

    if (isSelf) {
      onActivateLic({
        active: true,
        planCode,
        planLabel,
        expiresAt,
        activatedAt: now,
        activatedKey: key,
        adminAssigned: true,
      });
    }

    const ok = await onCloudActivateDevice({
      deviceId: cleanTarget,
      cliente: cleanCliente,
      planCode,
      planLabel,
      expiresAt,
      key,
      dias,
      revoke: false,
      recordKeyOnly: false,
    });

    if (ok === false) {
      onShowToast(`No se pudo conectar con la nube para activar a ${cleanTarget}`);
      return;
    }
    setClienteNombre('');
    setClienteTelefono('');
    setCustomDaysStr('');
    setGeneratedKey('');
    onShowToast(`Plan "${planLabel}" activado en la nube para ${cleanTarget}`, true);
  };

  // HTML / Cloudflare ZIP export helpers (preserving 100% of previous Admin tools)
  const buildCompleteStandaloneHtml = async (): Promise<string> => {
    let rawHtml = '';
    try {
      const res = await fetch('/__aluminero_single.html', { cache: 'no-store' });
      if (res.ok) {
        const candidate = await res.text();
        if (
          res.headers.get('x-aluminero-single') === '1' ||
          (/<script[^>]+type=["']module["'][^>]*>[\s\S]{1500,}/i.test(candidate) &&
            !candidate.includes('src="/src/main.tsx"'))
        ) {
          rawHtml = candidate;
        }
      }
    } catch {
      // fallback
    }

    let baseHtml = rawHtml;
    if (!baseHtml) {
      const docToSerialize = document.documentElement.cloneNode(true) as HTMLElement;
      docToSerialize.querySelectorAll('script, style, link').forEach((el) => {
        const src = (el.getAttribute('src') || el.getAttribute('href') || '').toLowerCase();
        const viteId = (el.getAttribute('data-vite-dev-id') || '').toLowerCase();
        if (src.includes('/@vite') || src.includes('@react-refresh') || src.includes('/src/main.tsx') || viteId.length > 0) {
          el.remove();
        }
      });
      const rootEl = docToSerialize.querySelector('#root');
      if (rootEl) rootEl.innerHTML = '';
      docToSerialize.querySelectorAll('script').forEach((sEl) => {
        if (!sEl.getAttribute('src') && sEl.textContent) {
          sEl.textContent = escapeInlineScriptContent(sEl.textContent);
        }
      });
      docToSerialize.querySelectorAll('style').forEach((stEl) => {
        if (stEl.textContent) {
          stEl.textContent = escapeInlineStyleContent(stEl.textContent);
        }
      });
      baseHtml = `<!doctype html>\n${docToSerialize.outerHTML}`;
    }

    return injectDeviceSeedIntoHtml(baseHtml, backupData);
  };

  const handleDownloadStandaloneHtml = async () => {
    setDownloadingHtml(true);
    try {
      const finalHtml = await buildCompleteStandaloneHtml();
      const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      onShowToast('Archivo index.html completo descargado', true);
    } catch {
      onShowToast('No se pudo generar la descarga de index.html');
    } finally {
      setDownloadingHtml(false);
    }
  };

  const handleDownloadCloudflareZip = async () => {
    setDownloadingZip(true);
    try {
      const fetchText = async (path: string, fallback: string) => {
        try {
          const r = await fetch(path, { cache: 'no-store' });
          if (r.ok) {
            const t = await r.text();
            if (t.trim() && !t.trim().startsWith('<!')) return t;
          }
        } catch {
          // fallback
        }
        return fallback;
      };
      const iconFiles = [
        'icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-192x192.png',
        'pwa-maskable-512x512.png',
        'apple-touch-icon.png',
      ];
      const [JSZip, fullHtml, manifestText, swText, iconBlobs] = await Promise.all([
        ensureJSZipLoaded(),
        buildCompleteStandaloneHtml(),
        fetchText('/manifest.json', FALLBACK_MANIFEST_JSON),
        fetchText('/sw.js', FALLBACK_SW_JS),
        Promise.all(
          iconFiles.map(async (name) => {
            try {
              const r = await fetch(`/${name}`, { cache: 'no-store' });
              if (!r.ok || (r.headers.get('content-type') || '').includes('text/html')) return null;
              return await r.blob();
            } catch {
              return null;
            }
          })
        ),
      ]);
      const zip = new JSZip();
      zip.file('index.html', fullHtml);
      zip.file('manifest.json', manifestText);
      zip.file('sw.js', swText);
      zip.file('_headers', CLOUDFLARE_HEADERS_TXT);
      zip.file('_redirects', CLOUDFLARE_REDIRECTS_TXT);
      iconFiles.forEach((name, i) => {
        if (iconBlobs[i]) zip.file(name, iconBlobs[i]!);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'aluminero_cloudflare.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      onShowToast('Paquete aluminero_cloudflare.zip descargado', true);
    } catch {
      onShowToast('No se pudo generar aluminero_cloudflare.zip');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleExportBackupJson = () => {
    try {
      const payload: AlumineroBackupPayload = {
        ...backupData,
        app: 'Aluminero Pro',
        version: 1,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `aluminero-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      onShowToast('Respaldo JSON descargado', true);
    } catch {
      onShowToast('No se pudo exportar el respaldo');
    }
  };

  const handleImportBackupFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseBackupPayload(text);
      if (!parsed) {
        onShowToast('El archivo JSON de respaldo no es válido');
        return;
      }
      onImportBackup(parsed);
      onShowToast('Respaldo completo restaurado correctamente', true);
    } catch {
      onShowToast('Error al leer el archivo de respaldo');
    }
  };

  const handleExportFormulasJson = () => {
    const blob = new Blob([JSON.stringify(formulas, null, 2)], { type: 'application/json;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'aluminero-formulas.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    onShowToast(`Exportadas ${formulas.length} fórmula(s)`, true);
  };

  const handleImportFormulasFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const rawList = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { formulas?: unknown[] }).formulas)
          ? (parsed as { formulas: unknown[] }).formulas
          : null;
      if (!rawList) {
        onShowToast('El archivo JSON no contiene fórmulas válidas');
        return;
      }
      const validLineas = new Set(Object.keys(LINEAS_CONFIG));
      const normalized: FormulaPersonalizada[] = [];
      rawList.forEach((item, idx) => {
        if (!item || typeof item !== 'object') return;
        const obj = item as Record<string, unknown>;
        const nombre = typeof obj.nombre === 'string' ? obj.nombre.trim() : '';
        const tol = obj.tolerancias as Record<string, unknown> | undefined;
        if (!nombre || !tol) return;
        normalized.push({
          id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : `f-imp-${Date.now()}-${idx}`,
          nombre,
          linea: typeof obj.linea === 'string' && validLineas.has(obj.linea) ? (obj.linea as LineaId) : '3',
          tolerancias: {
            marcoH: Math.max(0, Number(tol.marcoH) || 0),
            hojaV: Math.max(0, Number(tol.hojaV) || 0),
            hojaH: Math.max(0, Number(tol.hojaH) || 0),
            vidAncho: Math.max(0, Number(tol.vidAncho) || 0),
            vidAlto: Math.max(0, Number(tol.vidAlto) || 0),
          },
        });
      });
      if (normalized.length === 0) {
        onShowToast('No se encontraron fórmulas válidas');
        return;
      }
      onImportFormulas(normalized);
      onShowToast(`Importadas ${normalized.length} fórmula(s)`, true);
    } catch {
      onShowToast('Archivo JSON inválido');
    }
  };

  const filteredReferrals = useMemo(() => {
    const q = refSearch.trim().toLowerCase();
    if (!q) return activeReferralHistory;
    return activeReferralHistory.filter(
      (r) =>
        r.referrerId.toLowerCase().includes(q) ||
        r.referredDeviceId.toLowerCase().includes(q) ||
        (r.referredName || '').toLowerCase().includes(q) ||
        r.planLabel.toLowerCase().includes(q)
    );
  }, [referralHistory, refSearch]);

  const uniqueReferrersCount = useMemo(
    () => new Set(referralHistory.map((r) => r.referrerId.trim().toUpperCase())).size,
    [referralHistory]
  );

  const tierBadgeMeta = (tier: ClassifiedTier, planLabel: string) => {
    switch (tier) {
      case 'bloqueado':
        return { text: 'Bloqueado', cls: 'bg-red-500/20 text-red-300 border-red-500/45' };
      case 'colega3d':
        return { text: 'Promo Colega 3 días', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/45' };
      case '30d':
        return { text: 'PRO 30 días', cls: 'bg-blue-500/20 text-blue-200 border-blue-400/45' };
      case '90d':
        return { text: 'PRO 90 días', cls: 'bg-violet-500/20 text-violet-200 border-violet-400/45' };
      case '365d':
        return { text: 'PRO 1 Año', cls: 'bg-amber-500/20 text-amber-200 border-amber-400/50' };
      case 'otros_pro':
        return { text: planLabel || 'PRO Activo', cls: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/45' };
      default:
        return { text: 'Versión Gratuita', cls: 'bg-slate-700/60 text-slate-200 border-slate-600/70' };
    }
  };

  return (
    <section
      id="view-admin-dashboard"
      className="w-full max-w-[1400px] mx-auto pb-32 text-slate-100 screen-animate"
    >
      {/* Cabecera Full-Screen del Panel de Administrador */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-white shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="m-0 text-[20px] sm:text-[24px] font-extrabold text-white tracking-tight leading-tight">
                  Panel de Administrador
                </h1>
                <span
                  id="admin-app-version"
                  className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold mono"
                >
                  v{APP_VERSION}
                </span>
              </div>
              <p className="m-0 mt-1 text-[12.5px] sm:text-[13.5px] text-slate-300 leading-snug">
                Gestión centralizada de licencias PRO, usuarios, gráficas, precios de referencia, avisos y video tutoriales
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11.5px] text-slate-400">
                <span
                  id="admin-cloud-status-badge"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isAdminCloudOnline || serverDevicesCount !== null ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    aria-hidden="true"
                  />
                  {serverSyncBusy || cloudRefreshing
                    ? 'Sincronizando...'
                    : isAdminCloudOnline || serverDevicesCount !== null
                      ? 'Conectado en Nube'
                      : 'Modo Local'}
                </span>
                {firebaseUser?.email && (
                  <span className="text-slate-300 font-medium truncate max-w-[220px]">
                    {firebaseUser.email}
                  </span>
                )}
                {(serverLastSyncAt || cloudLastSyncAt) && (
                  <span className="mono">
                    Últ. sinc.: {formatDateTimeExact(serverLastSyncAt || cloudLastSyncAt || Date.now())}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              id="btn-admin-google-auth"
              onClick={() => void handleToggleFirebaseGoogleAuth()}
              disabled={firebaseAuthBusy}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl border font-bold text-[12px] inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60 ${
                firebaseUser
                  ? 'border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100'
                  : 'border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-100'
              }`}
            >
              {firebaseUser ? (
                <LogOut className="w-4 h-4" aria-hidden="true" />
              ) : (
                <LogIn className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {firebaseAuthBusy
                  ? 'Conectando...'
                  : firebaseUser
                    ? 'Desconectar Google'
                    : 'Conectar Google'}
              </span>
            </button>
            <button
              type="button"
              id="btn-admin-refresh-cloud"
              onClick={() => void fetchDevicesFromServerDirect({ silent: false })}
              disabled={serverSyncBusy || cloudRefreshing}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-sky-400/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-100 font-bold text-[12px] inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
            >
              <RefreshCw
                className={`w-4 h-4 ${serverSyncBusy || cloudRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{serverSyncBusy || cloudRefreshing ? 'Sincronizando...' : 'Actualizar Nube'}</span>
            </button>
            <button
              type="button"
              id="btn-admin-exit"
              onClick={onExit}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Salir al Inicio</span>
            </button>
          </div>
        </div>

        {serverSyncFeedback && (
          <div
            id="admin-cloud-sync-feedback"
            role={serverSyncFeedback.type === 'error' ? 'alert' : 'status'}
            className={`mt-3.5 rounded-xl border px-3.5 py-2.5 text-[12px] font-bold flex items-center justify-between gap-3 ${
              serverSyncFeedback.type === 'success'
                ? 'border-emerald-500/45 bg-emerald-950/60 text-emerald-100'
                : 'border-rose-500/50 bg-rose-950/60 text-rose-100'
            }`}
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              {serverSyncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
              )}
              <span className="leading-snug">{serverSyncFeedback.message}</span>
            </span>
            <button
              type="button"
              onClick={() => setServerSyncFeedback(null)}
              className="px-2 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-[11px] font-bold cursor-pointer shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {firebaseAuthDiagnostic && (
          <div
            id="admin-google-auth-diagnostic"
            role="alert"
            className="mt-3.5 rounded-xl border border-rose-500/50 bg-rose-950/60 px-3.5 py-3 text-[12px] text-rose-100 flex items-start justify-between gap-3"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2 font-extrabold text-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                <span>{firebaseAuthDiagnostic.summary}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-rose-900/80 border border-rose-500/40 text-rose-100 mono">
                  Código: {firebaseAuthDiagnostic.code}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-sky-200 mono break-all">
                  Dominio: {firebaseAuthDiagnostic.hostname}
                </span>
              </div>
              <p className="m-0 text-[11.5px] text-rose-200/90 leading-snug">
                {firebaseAuthDiagnostic.detail}
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar diagnóstico de Firebase"
              onClick={() => setFirebaseAuthDiagnostic(null)}
              className="px-2 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-rose-100 text-[11px] font-bold cursor-pointer shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Acción Principal Compacta: Generar Claves PRO (naranja translúcido, navegación directa) */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col gap-2.5">
          <button
            type="button"
            role="tab"
            id="tab-admin-claves"
            aria-selected={activeTab === 'claves'}
            onClick={() => setActiveTab('claves')}
            className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
              activeTab === 'claves'
                ? 'bg-orange-500/30 border-orange-400 text-orange-50 ring-1 ring-orange-400/50 shadow-sm'
                : 'bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30 text-orange-100'
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <KeyRound className="w-4 h-4 text-orange-300 shrink-0" aria-hidden="true" />
              <span className="text-[14px] font-black tracking-tight text-orange-100 truncate">
                Generar Claves PRO
              </span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/25 border border-orange-400/45 text-orange-100 text-[11px] font-extrabold">
              <span>{activeTab === 'claves' ? 'Activo' : 'Abrir'}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </button>

          {/* Navegación secundaria con etiquetas cortas y legibles (Métricas movida a Mi Taller) */}
          <div
            role="tablist"
            aria-label="Páginas secundarias de administración"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2"
          >
            {(
              [
                { id: 'dashboard', label: 'Usuarios', icon: Users },
                { id: 'graficas', label: 'Gráficas', icon: BarChart3 },
                { id: 'precios', label: 'Precios Ref.', icon: DollarSign },
                { id: 'mensajes', label: `Avisos (${adminMessages.length})`, icon: Bell },
                { id: 'referidos', label: `Referidos (${activeReferralHistory.length})`, icon: Gift },
                { id: 'herramientas', label: 'Respaldos', icon: Settings },
                { id: 'videos', label: 'Videos', icon: Video },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-admin-${tab.id}`}
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-[12px] font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all text-center leading-tight ${
                    active
                      ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                      : 'border-slate-700/80 bg-slate-800/70 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== PÁGINA 1: RESUMEN KPI Y AUDITORÍA DETALLADA DE USUARIOS ==================== */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-6">
          {/* 1. Tarjetas KPI superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            <div
              id="kpi-card-usuarios-nube"
              className="rounded-2xl border border-sky-500/45 bg-slate-900/95 p-4 shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-sky-300">
                  Usuarios en la Nube
                </span>
                <Users className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
              </div>
              <div
                id="kpi-val-usuarios-nube"
                className="mt-2 mono text-[28px] font-extrabold text-white leading-none"
              >
                {serverDevicesCount !== null
                  ? serverDevicesCount
                  : cloudRealtimeCounts.total > 0
                    ? cloudRealtimeCounts.total
                    : kpis.totalUsers}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-600 text-slate-200 mono">
                  Gratis: {serverDevicesCount !== null || cloudRealtimeCounts.total > 0 ? cloudRealtimeCounts.gratis : kpis.gratis}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 mono">
                  PRO: {serverDevicesCount !== null || cloudRealtimeCounts.total > 0 ? cloudRealtimeCounts.pro : kpis.totalProPaid + kpis.colega3d}
                </span>
              </div>
              {countersResetAt > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.localStorage.setItem(ADMIN_COUNTERS_RESET_KEY, '0');
                    } catch {
                      // ignore
                    }
                    setCountersResetAt(0);
                    onShowToast('Mostrando todos los usuarios históricos en la nube', true);
                  }}
                  className="mt-1.5 text-[10.5px] font-bold text-sky-300 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  Mostrar historial completo
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
                  Versión Gratuita
                </span>
                <UserCheck className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-2 mono text-[28px] font-extrabold text-slate-100 leading-none">
                {kpis.gratis}
              </div>
              <p className="m-0 mt-1.5 text-[11.5px] text-slate-400">
                Activos en plan gratuito{kpis.bloqueados > 0 ? ` · ${kpis.bloqueados} bloqueado(s)` : ''}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/35 bg-slate-900/95 p-4 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-300">
                  Prueba Colega (3 días)
                </span>
                <Gift className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-2 mono text-[28px] font-extrabold text-emerald-300 leading-none">
                {kpis.colega3d}
              </div>
              <p className="m-0 mt-1.5 text-[11.5px] text-slate-300">
                Activos hoy · <strong className="mono text-emerald-200">{kpis.colegaUsadaTotal}</strong> ID(s) ya la usaron
              </p>
            </div>

            <div id="kpi-card-planes-pro-activos" className="rounded-2xl border border-amber-500/40 bg-slate-900/95 p-4 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-300">
                  Planes PRO Activos
                </span>
                <Crown className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              </div>
              <div id="kpi-val-planes-pro-activos" className="mt-2 mono text-[28px] font-extrabold text-amber-300 leading-none">
                {kpis.totalProPaid}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-200 mono">
                  30d: {kpis.pro30}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-400/40 text-violet-200 mono">
                  90d: {kpis.pro90}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-200 mono">
                  1 Año: {kpis.pro365}
                </span>
              </div>
            </div>
          </div>

          {/* Acceso rápido hacia la página dedicada de Gráficas y Analíticas */}
          <div className="rounded-2xl border border-blue-500/35 bg-gradient-to-r from-slate-900 via-blue-950/50 to-slate-900 p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                <BarChart3 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <strong className="block text-[14.5px] font-extrabold text-white">
                  Página dedicada de Gráficas y Analíticas
                </strong>
                <span className="block text-[12px] text-slate-300">
                  Visualiza distribución por plan (barras y pastel), tendencias semanales/mensuales y auditoría de Promo Colega en pantalla amplia
                </span>
              </div>
            </div>
            <button
              type="button"
              id="btn-open-admin-graficas"
              onClick={() => setActiveTab('graficas')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[12.5px] inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors shadow-md"
            >
              <span>Abrir Gráficas</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* 3. Sección Inferior: Relación y Auditoría Detallada de Usuarios */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <h2 className="m-0 text-[16px] font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" aria-hidden="true" />
                  <span>Relación y Auditoría de Usuarios ({filteredUsers.length})</span>
                </h2>
                <p className="m-0 mt-0.5 text-[12px] text-slate-400">
                  Control de promociones activadas, bloqueo de uso único de Promo Colega y gestión directa de planes
                </p>
              </div>

              {/* Buscador rápido */}
              <div className="relative w-full md:w-[320px]">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  id="inp-admin-audit-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por ID, nombre o correo..."
                  className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-400 text-[13px] focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Filtros por tipo de plan */}
            <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-slate-800">
              {(
                [
                  { id: 'todos', label: `Todos (${kpis.totalUsers})` },
                  { id: 'gratis', label: `Gratis (${kpis.gratis})` },
                  { id: 'colega3d', label: `Colega 3d (${kpis.colega3d})` },
                  { id: '30d', label: `30d (${kpis.pro30})` },
                  { id: '90d', label: `90d (${kpis.pro90})` },
                  { id: '365d', label: `1 Año (${kpis.pro365})` },
                  { id: 'bloqueados', label: `Bloqueados (${kpis.bloqueados})` },
                ] as const
              ).map((f) => {
                const active = planFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    id={`btn-admin-filter-${f.id}`}
                    onClick={() => setPlanFilter(f.id)}
                    className={`min-h-[36px] px-3 py-1 rounded-xl border text-[12px] font-extrabold cursor-pointer transition-colors ${
                      active
                        ? 'border-sky-400 bg-sky-500/25 text-white'
                        : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Lista compacta desplegable (acordeón) por usuario */}
            {filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-[13px]">
                No se encontraron usuarios que coincidan con el filtro seleccionado.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredUsers.map((user) => {
                  const badge = tierBadgeMeta(user.tier, user.planLabel);
                  const isRowOpen = expandedUserDevId === user.deviceId;
                  const isPlanPickerOpen = expandedActionDevId === user.deviceId;
                  const isBusy = busyDeviceId === user.deviceId;

                  return (
                    <div
                      key={user.deviceId}
                      data-admin-user-row={user.deviceId}
                      data-expanded={isRowOpen ? 'true' : 'false'}
                      className={`rounded-xl border transition-colors ${
                        isRowOpen
                          ? 'border-sky-500/50 bg-slate-950/95'
                          : 'border-slate-700/80 bg-slate-950/75 hover:border-slate-600'
                      }`}
                    >
                      {/* Fila colapsada compacta: SOLO ID, Nombre, Teléfono y Tipo de promoción */}
                      <button
                        type="button"
                        id={`btn-admin-user-row-${user.deviceId}`}
                        aria-expanded={isRowOpen}
                        onClick={() =>
                          setExpandedUserDevId((prev) =>
                            prev === user.deviceId ? null : user.deviceId
                          )
                        }
                        className="w-full px-3.5 py-3 text-left flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 cursor-pointer bg-transparent border-0"
                      >
                        <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-2.5 items-center">
                          <div className="sm:col-span-3 flex items-center gap-1.5 min-w-0">
                            <span className="mono text-[12.5px] font-extrabold text-sky-300 bg-sky-500/15 border border-sky-400/35 px-2 py-0.5 rounded-md truncate">
                              {user.deviceId}
                            </span>
                          </div>
                          <div className="sm:col-span-4 min-w-0">
                            <strong className="block text-[13.5px] text-white font-extrabold truncate">
                              {user.nombreSolo}
                            </strong>
                          </div>
                          <div className="sm:col-span-3 min-w-0">
                            <span className="mono text-[12px] text-slate-300 font-semibold truncate block">
                              {user.telefonoDisplay}
                            </span>
                          </div>
                          <div className="sm:col-span-2 flex items-center sm:justify-end">
                            <span className={`px-2 py-0.5 rounded-md border text-[10.5px] font-extrabold whitespace-nowrap ${badge.cls}`}>
                              {badge.text}
                            </span>
                          </div>
                        </div>

                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isRowOpen ? 'rotate-180 text-sky-300' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {/* Detalles desplegables al hacer clic en la fila */}
                      {isRowOpen && (
                        <div className="px-3.5 pb-4 pt-3 border-t border-slate-800/90 flex flex-col gap-3">
                          {/* Metadatos rápidos + Copiar ID + Promo Colega */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                              <button
                                type="button"
                                onClick={() => void handleCopyId(user.deviceId)}
                                className="min-h-[30px] px-2.5 py-0.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" aria-hidden="true" />
                                {copiedId === user.deviceId ? 'Copiado' : 'Copiar ID'}
                              </button>
                              {user.isSelf && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[10.5px] font-extrabold">
                                  Este equipo
                                </span>
                              )}
                              {user.linkedEmail && (
                                <span className="text-sky-300/90 break-all">{user.linkedEmail}</span>
                              )}
                              <span className="text-slate-400">{user.deviceLabel}</span>
                            </div>

                            {user.promoColegaUsed ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-400/45 bg-amber-500/15 text-amber-200 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                                Promo Colega 3d: Consumida
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 text-[11px] font-semibold">
                                Promo Colega 3d: Disponible
                              </span>
                            )}
                          </div>

                          {/* Fechas exactas */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
                            <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2">
                              <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                Activación Plan Actual
                              </span>
                              <strong className="mono text-slate-100 font-bold text-[11.5px]">
                                {formatDateTimeExact(user.activatedAt)}
                              </strong>
                            </div>
                            <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2">
                              <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                Vencimiento Plan Actual
                              </span>
                              <strong className="mono text-slate-100 font-bold text-[11.5px]">
                                {user.hasActivePro
                                  ? user.expiresAt === null
                                    ? 'Vitalicia'
                                    : formatDateTimeExact(user.expiresAt)
                                  : 'Sin plan PRO activo'}
                              </strong>
                            </div>
                            <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2">
                              <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                Fecha Promo Colega 3d
                              </span>
                              <strong className="mono text-amber-200 font-bold text-[11.5px]">
                                {user.promoColegaUsed
                                  ? formatDateTimeExact(user.fechaActivacionColega)
                                  : 'No utilizada'}
                              </strong>
                            </div>
                          </div>

                          {/* Historial de promociones activadas */}
                          {user.historyKeys.length > 0 && (
                            <div className="rounded-lg bg-slate-900/60 border border-slate-800/80 px-3 py-2">
                              <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                                Historial de Promociones ({user.historyKeys.length})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {user.historyKeys.slice(0, 6).map((hk) => (
                                  <span
                                    key={hk.id}
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${
                                      hk.revoked
                                        ? 'border-red-500/35 bg-red-500/10 text-red-300 line-through'
                                        : 'border-slate-700 bg-slate-800 text-slate-200'
                                    }`}
                                  >
                                    <span>{hk.planLabel}</span>
                                    <span className="mono text-slate-400 text-[10px]">
                                      · {formatDateTimeExact(hk.createdAt)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Acciones: Cambiar Plan, Revocar / Denegar, Eliminar */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                setExpandedActionDevId((prev) =>
                                  prev === user.deviceId ? null : user.deviceId
                                )
                              }
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[12px] cursor-pointer transition-colors disabled:opacity-60"
                            >
                              {isPlanPickerOpen ? 'Ocultar planes' : 'Cambiar Plan'}
                            </button>

                            {user.hasActivePro && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  setPendingAction({
                                    type: 'revokePromo',
                                    deviceId: user.deviceId,
                                    cliente: user.clienteDisplay,
                                    keyCode: user.keyCode || undefined,
                                  })
                                }
                                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 font-bold text-[12px] cursor-pointer transition-colors"
                              >
                                Revocar a Gratis
                              </button>
                            )}

                            {user.promoColegaUsed && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  setPendingAction({
                                    type: 'resetColega',
                                    deviceId: user.deviceId,
                                    cliente: user.clienteDisplay,
                                  })
                                }
                                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-emerald-400/45 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                Restablecer Promo Colega
                              </button>
                            )}

                            {!user.isBlocked && !user.isSelf && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  setPendingAction({
                                    type: 'blockFree',
                                    deviceId: user.deviceId,
                                    cliente: user.clienteDisplay,
                                    keyCode: user.keyCode || undefined,
                                  })
                                }
                                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-red-500/45 bg-red-500/15 hover:bg-red-500/25 text-red-200 font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                                Denegar / Bloquear
                              </button>
                            )}

                            {!user.isSelf && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  setPendingAction({
                                    type: 'deleteRecord',
                                    rec: user.deleteRecord,
                                  })
                                }
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-red-500/20 hover:border-red-500/40 text-slate-300 hover:text-red-200 font-bold text-[12px] inline-flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                Eliminar
                              </button>
                            )}
                          </div>

                          {/* Selector rápido inline de plan */}
                          {isPlanPickerOpen && (
                            <div className="mt-1 p-3 rounded-xl border border-blue-500/40 bg-slate-900 flex flex-col gap-2">
                              <span className="text-[11.5px] font-bold text-blue-200">
                                Selecciona el plan a asignar inmediatamente en la nube para{' '}
                                <strong className="mono text-white">{user.deviceId}</strong>:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {QUICK_PLAN_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => void handleQuickAssignPlan(user, opt)}
                                    className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 hover:bg-blue-600 hover:border-blue-400 text-white font-extrabold text-[12px] cursor-pointer transition-colors disabled:opacity-50"
                                  >
                                    {isBusy ? 'Aplicando...' : opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== PÁGINA 2 (DEDICADA): GRÁFICAS Y ANALÍTICAS ==================== */}
      {activeTab === 'graficas' && (
        <div id="admin-page-graficas" className="flex flex-col gap-6">
          {/* Cabecera de la página de Gráficas + Indicadores Ejecutivos */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="m-0 text-[18px] sm:text-[20px] font-extrabold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" aria-hidden="true" />
                  <span>Gráficas y Analíticas de Licencias</span>
                </h2>
                <p className="m-0 mt-1 text-[12.5px] text-slate-400">
                  Panorama completo de planes activos, evolución de activaciones y control de uso único de Promo Colega
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Volver a Usuarios</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              <div className="rounded-xl border border-blue-500/35 bg-slate-950/75 p-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  Conversión a PRO Pagado
                </span>
                <div className="mt-1.5 mono text-[26px] font-extrabold text-white leading-none">
                  {analyticsRates.proRate}%
                </div>
                <span className="block mt-1.5 text-[11.5px] text-slate-400">
                  {kpis.totalProPaid} de {kpis.totalUsers} equipos registrados
                </span>
              </div>

              <div className="rounded-xl border border-emerald-500/35 bg-slate-950/75 p-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Adopción Promo Colega 3d
                </span>
                <div className="mt-1.5 mono text-[26px] font-extrabold text-emerald-300 leading-none">
                  {analyticsRates.colegaUsageRate}%
                </div>
                <span className="block mt-1.5 text-[11.5px] text-slate-400">
                  {kpis.colegaUsadaTotal} equipo(s) ya consumieron su prueba
                </span>
              </div>

              <div className="rounded-xl border border-amber-500/35 bg-slate-950/75 p-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Valor Activo Planes PRO
                </span>
                <div className="mt-1.5 mono text-[26px] font-extrabold text-amber-300 leading-none">
                  ${analyticsRates.estimatedProValue.toLocaleString('es-MX')}
                </div>
                <span className="block mt-1.5 text-[11.5px] text-slate-400">
                  MXN en planes activos ($369 / $989 / $1,799)
                </span>
              </div>

              <div className="rounded-xl border border-violet-500/35 bg-slate-950/75 p-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-violet-300">
                  Historial de Claves y Referidos
                </span>
                <div className="mt-1.5 mono text-[26px] font-extrabold text-violet-200 leading-none">
                  {analyticsRates.totalKeysIssued}
                </div>
                <span className="block mt-1.5 text-[11.5px] text-slate-400">
                  Claves emitidas · {referralHistory.length} referido(s)
                </span>
              </div>
            </div>
          </div>

          {/* Fila 1: Gráfica de Barras + Gráfica de Pastel (Dona) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gráfica 1: Distribución de Planes Activos (Barras) */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="m-0 text-[16px] font-extrabold text-white">
                    Distribución de Planes Activos
                  </h3>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-400">
                    Comparativa directa: Gratis vs Colega 3d vs PRO 30d / 90d / 1 Año
                  </p>
                </div>
                <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" aria-hidden="true" />
              </div>
              <div className="w-full h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planDistributionData} margin={{ top: 12, right: 16, left: -12, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#cbd5e1', fontSize: 11.5, fontWeight: 700 }}
                      axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#94a3b8', fontSize: 11.5 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(148,163,184,0.3)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="usuarios" name="Usuarios" radius={[8, 8, 0, 0]} maxBarSize={54} isAnimationActive={false}>
                      {planDistributionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica 2: Proporción por Plan (Pastel / Dona) */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="m-0 text-[16px] font-extrabold text-white">
                    Participación por Nivel de Plan
                  </h3>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-400">
                    Porcentaje que representa cada suscripción sobre el total activo
                  </p>
                </div>
                <PieChartIcon className="w-5 h-5 text-violet-400 shrink-0" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          planDistributionData.some((d) => d.usuarios > 0)
                            ? planDistributionData.filter((d) => d.usuarios > 0)
                            : [{ name: 'Sin datos', usuarios: 1, color: '#334155' }]
                        }
                        dataKey="usuarios"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={92}
                        paddingAngle={3}
                        isAnimationActive={false}
                      >
                        {(planDistributionData.some((d) => d.usuarios > 0)
                          ? planDistributionData.filter((d) => d.usuarios > 0)
                          : [{ name: 'Sin datos', usuarios: 1, color: '#334155' }]
                        ).map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="rgba(15,23,42,0.85)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(148,163,184,0.3)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-2">
                  {planDistributionData.map((entry) => {
                    const pct = kpis.totalUsers > 0 ? Math.round((entry.usuarios / kpis.totalUsers) * 100) : 0;
                    return (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/75 border border-slate-800"
                      >
                        <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-slate-200">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: entry.color }}
                            aria-hidden="true"
                          />
                          {entry.name}
                        </span>
                        <span className="mono text-[12.5px] font-extrabold text-white">
                          {entry.usuarios}{' '}
                          <span className="text-slate-400 font-semibold">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Fila 2: Gráfica Grande de Tendencia de Activaciones por Semana / Mes */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="m-0 text-[16px] font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" aria-hidden="true" />
                  <span>Nuevas Activaciones de Promociones</span>
                </h3>
                <p className="m-0 mt-0.5 text-[12px] text-slate-400">
                  Evolución temporal de pruebas Promo Colega (3 días) frente a suscripciones PRO pagadas
                </p>
              </div>
              <div className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1">
                <button
                  type="button"
                  id="btn-chart-granularity-week"
                  onClick={() => setChartGranularity('week')}
                  className={`px-3 py-1.5 rounded-lg text-[11.5px] font-extrabold cursor-pointer transition-colors ${
                    chartGranularity === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Por Semana
                </button>
                <button
                  type="button"
                  id="btn-chart-granularity-month"
                  onClick={() => setChartGranularity('month')}
                  className={`px-3 py-1.5 rounded-lg text-[11.5px] font-extrabold cursor-pointer transition-colors ${
                    chartGranularity === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Por Mes
                </button>
              </div>
            </div>

            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activationsSeriesData} margin={{ top: 12, right: 16, left: -10, bottom: 6 }}>
                  <defs>
                    <linearGradient id="gradProPagos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradColega" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#cbd5e1', fontSize: 11.5, fontWeight: 700 }}
                    axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 11.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(148,163,184,0.3)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pagos"
                    name="Planes PRO (30d/90d/1Año)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#gradProPagos)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="colega"
                    name="Promo Colega (3d)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gradColega)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-end gap-5 text-[12px] text-slate-300">
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="w-3 h-3 rounded-full bg-blue-500" aria-hidden="true" />
                Planes PRO (30d / 90d / 1 Año)
              </span>
              <span className="inline-flex items-center gap-2 font-semibold">
                <span className="w-3 h-3 rounded-full bg-emerald-500" aria-hidden="true" />
                Promo Colega (3 días)
              </span>
            </div>
          </div>

          {/* Fila 3: Auditoría Visual Promo Colega + Desglose de Planes PRO Pagados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gráfica 4: Control de Uso Único Promo Colega */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="m-0 text-[16px] font-extrabold text-white">
                    Seguridad Uso Único · Promo Colega (3 días)
                  </h3>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-400">
                    Seguimiento de equipos con bandera permanente promo_colega_usada
                  </p>
                </div>
                <Gift className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
              </div>

              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={colleagueAuditData}
                    layout="vertical"
                    margin={{ top: 6, right: 20, left: 16, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={132}
                      tick={{ fill: '#e2e8f0', fontSize: 11.5, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(148,163,184,0.3)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="cantidad" name="Equipos" radius={[0, 8, 8, 0]} maxBarSize={32} isAnimationActive={false}>
                      {colleagueAuditData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica 5: Desglose visual de Suscripciones PRO Pagadas */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-md flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="m-0 text-[16px] font-extrabold text-white">
                    Desglose de Planes PRO Pagados
                  </h3>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-400">
                    Volumen activo y referencia de ingresos según tarifas de lanzamiento
                  </p>
                </div>
                <Crown className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-3.5">
                {[
                  {
                    label: 'Promo 30 Días PRO ($369 MXN)',
                    count: kpis.pro30,
                    amount: kpis.pro30 * 369,
                    barColor: 'bg-blue-500',
                    textColor: 'text-blue-300',
                  },
                  {
                    label: 'Plan 90 Días PRO ($989 MXN)',
                    count: kpis.pro90,
                    amount: kpis.pro90 * 989,
                    barColor: 'bg-violet-500',
                    textColor: 'text-violet-300',
                  },
                  {
                    label: 'Plan 1 Año PRO ($1,799 MXN)',
                    count: kpis.pro365,
                    amount: kpis.pro365 * 1799,
                    barColor: 'bg-amber-500',
                    textColor: 'text-amber-300',
                  },
                ].map((row) => {
                  const pct =
                    kpis.totalProPaid > 0 ? Math.round((row.count / kpis.totalProPaid) * 100) : 0;
                  return (
                    <div
                      key={row.label}
                      className="rounded-xl border border-slate-800 bg-slate-950/75 p-3.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[12.5px] font-bold">
                        <span className="text-slate-100">{row.label}</span>
                        <span className={`mono font-extrabold ${row.textColor}`}>
                          {row.count} activo(s) · ${row.amount.toLocaleString('es-MX')} MXN
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.barColor} transition-all duration-300`}
                          style={{ width: `${Math.max(row.count > 0 ? 6 : 0, pct)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-right text-[11px] text-slate-400 mono">
                        {pct}% de los planes PRO pagados
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fila 4: Cotizaciones generadas por mes y Materiales más utilizados (Recharts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gráfica 6: Cotizaciones generadas por mes */}
            <div
              id="admin-chart-cotizaciones-mes"
              className="rounded-2xl border border-sky-500/35 bg-slate-900/95 p-5 sm:p-6 shadow-md"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="m-0 text-[16px] font-extrabold text-white">
                    Cotizaciones generadas por mes
                  </h3>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-400">
                    Volumen mensual de cotizaciones emitidas en los últimos 6 meses
                  </p>
                </div>
                <BarChart3 className="w-5 h-5 text-sky-400 shrink-0" aria-hidden="true" />
              </div>

              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyQuotesChartData}
                    margin={{ top: 10, right: 16, left: -10, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: '#cbd5e1', fontSize: 11.5, fontWeight: 700 }}
                      axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#94a3b8', fontSize: 11.5 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(56,189,248,0.10)' }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(56,189,248,0.45)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 700, marginBottom: '2px' }}
                      itemStyle={{ color: '#7dd3fc', fontWeight: 600 }}
                      formatter={(value, name) =>
                        name === 'montoTotal'
                          ? [`$${Number(value || 0).toLocaleString('es-MX')} MXN`, 'Monto acumulado']
                          : [Number(value || 0), 'Cotizaciones']
                      }
                    />
                    <Bar
                      dataKey="cotizaciones"
                      name="Cotizaciones"
                      fill="#38bdf8"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={40}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate-300">
                <span>
                  Total últimos 6 meses:{' '}
                  <strong className="mono text-sky-300">
                    {monthlyQuotesChartData.reduce((a, b) => a + b.cotizaciones, 0)} cotizaciones
                  </strong>
                </span>
                <span className="mono text-emerald-300 font-bold">
                  $
                  {monthlyQuotesChartData
                    .reduce((a, b) => a + b.montoTotal, 0)
                    .toLocaleString('es-MX')}{' '}
                  MXN
                </span>
              </div>
            </div>

            {/* Gráfica 7: Materiales más utilizados */}
            <div
              id="admin-chart-materiales-top"
              className="rounded-2xl border border-emerald-500/35 bg-slate-900/95 p-5 sm:p-6 shadow-md"
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="m-0 text-[16px] font-extrabold text-white">
                    Materiales más utilizados
                  </h3>
                  <p className="m-0 mt-0.5 text-[12px] text-slate-400">
                    Perfiles y líneas con mayor demanda en cotizaciones, despieces e inventario
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
              </div>

              {topMaterialsChartData.length === 0 ? (
                <div className="h-[260px] flex flex-col items-center justify-center text-center px-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60">
                  <p className="m-0 text-[13px] font-bold text-slate-300">
                    Sin materiales registrados todavía
                  </p>
                  <p className="m-0 mt-1 text-[11.5px] text-slate-400">
                    Al generar cotizaciones o registrar existencias en Mi Inventario, verás aquí el ranking en tiempo real.
                  </p>
                </div>
              ) : (
                <div className="w-full h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topMaterialsChartData}
                      layout="vertical"
                      margin={{ top: 6, right: 20, left: 10, bottom: 6 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148,163,184,0.16)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        width={136}
                        tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(16,185,129,0.12)' }}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(16,185,129,0.45)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 700, marginBottom: '2px' }}
                        itemStyle={{ color: '#6ee7b7', fontWeight: 600 }}
                        formatter={(value) => [Number(value || 0), 'Usos / partidas']}
                      />
                      <Bar
                        dataKey="usos"
                        name="Usos"
                        radius={[0, 8, 8, 0]}
                        maxBarSize={26}
                        isAnimationActive={false}
                      >
                        {topMaterialsChartData.map((entry, idx) => {
                          const palette = [
                            '#10b981',
                            '#38bdf8',
                            '#6366f1',
                            '#f59e0b',
                            '#14b8a6',
                            '#ec4899',
                            '#8b5cf6',
                            '#06b6d4',
                          ];
                          return <Cell key={entry.nombre} fill={palette[idx % palette.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: GENERADOR DE CLAVES Y LICENCIAS ==================== */}
      {activeTab === 'claves' && (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-6 shadow-md max-w-3xl pb-8">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="m-0 text-[17px] font-extrabold text-white">
                Generador de Claves de Activación PRO
              </h2>
              <p className="m-0 mt-1 text-[12.5px] text-slate-400">
                Pega el mensaje de solicitud de WhatsApp en 1 clic, genera la clave o actívala en la nube.
              </p>
            </div>
          </div>

          {/* Barra rápida: Pegar 1 Clic (genera, copia y guarda) + Limpiar */}
          <div className="mt-4 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-admin-paste-generate"
              onClick={() => void handleOneClickClipboardPaste(true)}
              className="flex-1 min-w-[210px] min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[12.5px] inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ClipboardPaste className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Pegar mensaje y Generar Clave (1 Clic)</span>
            </button>
            <button
              type="button"
              id="btn-admin-clear-key"
              onClick={handleClearKeyForm}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Limpiar</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Nombre del cliente / Taller *
              </label>
              <input
                type="text"
                id="inp-admin-cliente"
                value={clienteNombre}
                onChange={(e) => {
                  setClienteNombre(e.target.value);
                  refreshKeyPreview(targetDevice, planIdx, parsedCustomDays, e.target.value, clienteTelefono);
                }}
                placeholder="Ej. Taller Hermanos López"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Teléfono WhatsApp *
              </label>
              <input
                type="tel"
                id="inp-admin-tel"
                inputMode="numeric"
                value={clienteTelefono}
                onChange={(e) => {
                  const formatted = formatMxPhoneDashed(e.target.value);
                  setClienteTelefono(formatted);
                  refreshKeyPreview(targetDevice, planIdx, parsedCustomDays, clienteNombre, formatted);
                }}
                placeholder={phonePlaceholder}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white mono text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                ID de Equipo destino
              </label>
              <input
                type="text"
                id="inp-admin-device"
                value={targetDevice}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase();
                  setTargetDevice(upper);
                  refreshKeyPreview(upper, planIdx, parsedCustomDays, clienteNombre, clienteTelefono);
                }}
                placeholder="ALM-XXXX"
                className="mono w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-sky-300 font-bold text-[13.5px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Días exactos de reposición (opcional)
              </label>
              <input
                type="number"
                min={1}
                max={3650}
                value={customDaysStr}
                onChange={(e) => {
                  setCustomDaysStr(e.target.value);
                  const d = e.target.value.trim()
                    ? Math.max(1, Math.min(3650, Math.round(Number(e.target.value) || 0)))
                    : null;
                  refreshKeyPreview(targetDevice, planIdx, d, clienteNombre, clienteTelefono);
                }}
                placeholder="Dejar vacío para usar plan"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
            </div>
          </div>

          <div className="mt-4">
            <span className="block text-[11.5px] font-bold text-slate-300 mb-1.5">
              Plan a otorgar
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p.idx}
                  type="button"
                  onClick={() => {
                    setPlanIdx(p.idx);
                    setCustomDaysStr('');
                    refreshKeyPreview(targetDevice, p.idx, null, clienteNombre, clienteTelefono);
                  }}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-[12px] font-extrabold cursor-pointer transition-all ${
                    !parsedCustomDays && planIdx === p.idx
                      ? 'border-blue-400 bg-blue-600 text-white'
                      : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Destacado Verde de Envío Rápido en 2 Mensajes */}
          {generatedKey && (() => {
            const activePlan = PLANS.find((p) => p.idx === planIdx) || PLANS[0];
            const diasVal = parsedCustomDays ?? activePlan.days;
            const planLabelVal = parsedCustomDays ? `Reposición ${parsedCustomDays} días` : activePlan.label;
            const planCodeVal = parsedCustomDays ? `D${parsedCustomDays}` : activePlan.code;
            const cleanDev = normalizeDeviceIdInput(targetDevice, deviceId);
            const welcomeText = buildAdminWelcomeMessage({
              cliente: clienteNombre || 'Colega',
              deviceId: cleanDev,
              planCode: planCodeVal,
              planLabel: planLabelVal,
              dias: diasVal,
            });
            return (
              <div
                id="admin-quick-send-panel"
                className="mt-4 p-4 rounded-2xl border-2 border-emerald-400/60 bg-emerald-950/45 flex flex-col gap-3 shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="block text-[10.5px] uppercase tracking-wider font-black text-emerald-300">
                      ✅ Envío Rápido WhatsApp (2 Mensajes)
                    </span>
                    <strong className="mono text-[18px] text-white tracking-wider">
                      {generatedKey}
                    </strong>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold mono">
                    {cleanDev} · {planLabelVal}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      id="btn-admin-wa-welcome"
                      onClick={() => openWhatsappLink(clienteTelefono, welcomeText)}
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[12px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>1. Enviar Bienvenida a WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(welcomeText).catch(() => {});
                        onShowToast('Mensaje de bienvenida copiado', true);
                      }}
                      aria-label="Copiar bienvenida"
                      className="min-w-[42px] min-h-[44px] rounded-xl border border-emerald-400/50 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 inline-flex items-center justify-center cursor-pointer"
                    >
                      <Copy className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      id="btn-admin-wa-key-only"
                      onClick={() => openWhatsappLink(clienteTelefono, generatedKey)}
                      className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-[12px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>2. Enviar Clave Sola a WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(generatedKey).catch(() => {});
                        onShowToast(`Clave sola ${generatedKey} copiada`, true);
                      }}
                      aria-label="Copiar clave sola"
                      className="min-w-[42px] min-h-[44px] rounded-xl border border-teal-400/50 bg-teal-900/60 hover:bg-teal-800 text-teal-100 inline-flex items-center justify-center cursor-pointer"
                    >
                      <Copy className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              id="btn-admin-activate-cloud-trigger"
              onClick={() => {
                if (!clienteNombre.trim() || clienteTelefono.replace(/\D/g, '').length === 0) {
                  onShowToast('Escribe el nombre y teléfono del cliente para activar');
                  return;
                }
                const cleanTarget = normalizeDeviceIdInput(targetDevice, deviceId);
                if (!cleanTarget) {
                  onShowToast('Escribe el ID de Equipo destino');
                  return;
                }
                setConfirmDirectCloudOpen(true);
              }}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[13px] cursor-pointer shadow-md"
            >
              Activar Directo en la Nube
            </button>
          </div>

          {/* Sección dedicada: Planes PRO Permanentes sin costo (Pruebas / Cortesías — $0 MXN) */}
          <div
            id="admin-permanent-test-pro-section"
            className="mt-6 pt-5 border-t border-slate-700/80"
          >
            <div className="rounded-2xl border border-violet-400/45 bg-violet-950/25 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-violet-300">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    Pruebas Internas / Cortesías ($0 MXN)
                  </span>
                  <h3 className="m-0 mt-0.5 text-[15.5px] font-extrabold text-white">
                    Planes PRO Permanentes sin costo
                  </h3>
                  <p className="m-0 mt-1 text-[12px] text-slate-300 leading-snug">
                    Activa acceso PRO permanente (<span className="mono font-bold text-violet-200">tipo: prueba_gratis</span>) por ID de Equipo para tus pruebas o cortesías. Nunca suma a ventas, ingresos ni a Conversión a PRO Pagado.
                  </p>
                </div>
                {kpis.pruebasGratis > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 border border-violet-400/40 text-violet-200 text-[11px] font-extrabold mono shrink-0">
                    {kpis.pruebasGratis} cortesía(s) activa(s)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inp-admin-perm-device" className="block text-[11.5px] font-bold text-slate-300 mb-1">
                    ID de Equipo destino *
                  </label>
                  <input
                    id="inp-admin-perm-device"
                    type="text"
                    value={permTestDeviceId}
                    onChange={(e) => setPermTestDeviceId(e.target.value.toUpperCase())}
                    placeholder="ALM-XXXX"
                    className="mono w-full min-h-[42px] px-3 py-2 rounded-xl border border-violet-400/40 bg-slate-950 text-violet-200 font-bold text-[13.5px]"
                  />
                </div>
                <div>
                  <label htmlFor="inp-admin-perm-cliente" className="block text-[11.5px] font-bold text-slate-300 mb-1">
                    Nota / Etiqueta (opcional)
                  </label>
                  <input
                    id="inp-admin-perm-cliente"
                    type="text"
                    value={permTestLabel}
                    onChange={(e) => setPermTestLabel(e.target.value)}
                    placeholder="Ej. Teléfono de pruebas / Cortesía"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  id="btn-admin-activate-perm-test"
                  disabled={permTestBusy}
                  onClick={() => void handleActivatePermanentTestPro()}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                >
                  <Crown className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{permTestBusy ? 'Activando...' : 'Activar PRO Permanente ($0 MXN)'}</span>
                </button>

                {permTestGeneratedKey && (
                  <div
                    id="admin-perm-test-key-result"
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-violet-400/50 bg-slate-950/90 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase text-violet-300">
                        Clave Permanente ($0 · prueba_gratis)
                      </span>
                      <strong className="mono text-[13.5px] text-white">{permTestGeneratedKey}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(permTestGeneratedKey).catch(() => {});
                        onShowToast(`Clave permanente ${permTestGeneratedKey} copiada`, true);
                      }}
                      className="min-h-[34px] px-2.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 border border-violet-400/50 text-violet-100 text-[11px] font-bold cursor-pointer"
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: REFERIDOS ==================== */}
      {activeTab === 'referidos' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-2xl border border-emerald-500/35 bg-slate-900/95 p-4">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-300">
                Total Referidos Registrados
              </span>
              <div className="mt-1 mono text-[28px] font-extrabold text-white">
                {referralHistory.length}
              </div>
            </div>
            <div className="rounded-2xl border border-sky-500/35 bg-slate-900/95 p-4">
              <span className="text-[11px] uppercase tracking-wider font-bold text-sky-300">
                Colegas Referidores Únicos
              </span>
              <div className="mt-1 mono text-[28px] font-extrabold text-white">
                {uniqueReferrersCount}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5">
            <h2 className="m-0 text-[15px] font-extrabold text-white">
              Registrar Referido Manualmente
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                value={manualReferrerId}
                onChange={(e) => setManualReferrerId(e.target.value.toUpperCase())}
                placeholder="ID Referidor (ej. ALM-1A2B)"
                className="mono min-h-[40px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px]"
              />
              <input
                type="text"
                value={manualReferredId}
                onChange={(e) => setManualReferredId(e.target.value.toUpperCase())}
                placeholder="ID Nuevo Cliente"
                className="mono min-h-[40px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px]"
              />
              <input
                type="text"
                value={manualReferredName}
                onChange={(e) => setManualReferredName(e.target.value)}
                placeholder="Nombre del cliente"
                className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px]"
              />
              <select
                value={manualPlanCode}
                onChange={(e) => setManualPlanCode(e.target.value as 'M' | 'Q' | 'A' | 'G')}
                className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px]"
              >
                <option value="M">Promo 30 Días ($369 MXN)</option>
                <option value="Q">Plan 90 Días ($989 MXN)</option>
                <option value="A">Plan 1 Año ($1,799 MXN)</option>
                <option value="G">Promo Colega 3 días ($0)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!manualReferrerId.trim() || !manualReferredId.trim()) {
                  onShowToast('Ingresa el ID del referidor y el ID del cliente referido');
                  return;
                }
                const metaMap = {
                  M: { label: 'Promo 30 Días PRO', amount: '$369 MXN' },
                  Q: { label: 'Plan 90 Días PRO', amount: '$989 MXN' },
                  A: { label: 'Plan 1 Año PRO', amount: '$1,799 MXN' },
                  G: { label: 'Promo Colega 3 días', amount: '$0 MXN' },
                };
                onAddReferralRecord({
                  referrerId: manualReferrerId.trim(),
                  referredDeviceId: manualReferredId.trim(),
                  referredName: manualReferredName.trim(),
                  planCode: manualPlanCode,
                  planLabel: metaMap[manualPlanCode].label,
                  amountLabel: metaMap[manualPlanCode].amount,
                });
                setManualReferrerId('');
                setManualReferredId('');
                setManualReferredName('');
                onShowToast('Referido registrado en el historial', true);
              }}
              className="mt-3 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[12.5px] cursor-pointer"
            >
              Guardar Registro de Referido
            </button>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3">
              <h3 className="m-0 text-[15px] font-extrabold text-white">
                Historial de Referidos ({filteredReferrals.length})
              </h3>
              <input
                type="text"
                value={refSearch}
                onChange={(e) => setRefSearch(e.target.value)}
                placeholder="Filtrar por ID o nombre..."
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px] w-full sm:w-[260px]"
              />
            </div>

            {filteredReferrals.length === 0 ? (
              <p className="text-[13px] text-slate-400 text-center py-6 m-0">
                Aún no hay referidos registrados.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredReferrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-white">
                        Colega <span className="mono text-emerald-300">{ref.referrerId}</span> → Cliente{' '}
                        <span className="mono text-sky-300">{ref.referredDeviceId}</span>
                        {ref.referredName ? ` (${ref.referredName})` : ''}
                      </div>
                      <div className="text-[11.5px] text-slate-400 mt-0.5">
                        {ref.planLabel} {ref.amountLabel ? `· ${ref.amountLabel}` : ''} ·{' '}
                        <span className="mono">{formatDateTimeExact(ref.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteReferralRecord(ref.id)}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-200 text-[11.5px] font-bold cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: HERRAMIENTAS, RESPALDO Y PUBLICACIÓN ==================== */}
      {activeTab === 'herramientas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Respaldo completo y Fórmulas */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5 flex flex-col gap-3">
            <h2 className="m-0 text-[15px] font-extrabold text-white">
              Respaldo JSON y Fórmulas de Taller
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExportBackupJson}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[12.5px] cursor-pointer"
              >
                Exportar Respaldo JSON
              </button>
              <button
                type="button"
                onClick={() => importBackupRef.current?.click()}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[12.5px] cursor-pointer"
              >
                Restaurar Respaldo JSON
              </button>
              <input
                ref={importBackupRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImportBackupFile(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={handleExportFormulasJson}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[12.5px] cursor-pointer"
              >
                Exportar Fórmulas ({formulas.length})
              </button>
              <button
                type="button"
                onClick={() => importFormulasRef.current?.click()}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[12.5px] cursor-pointer"
              >
                Importar Fórmulas JSON
              </button>
              <input
                ref={importFormulasRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImportFormulasFile(f);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="pt-3 mt-1 border-t border-slate-800 flex flex-col gap-2">
              <h3 className="m-0 text-[13.5px] font-extrabold text-white">
                Publicación Cloudflare Pages / HTML
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={downloadingHtml}
                  onClick={() => void handleDownloadStandaloneHtml()}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-emerald-500/45 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-100 font-bold text-[12.5px] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  {downloadingHtml ? 'Generando...' : 'Descargar index.html'}
                </button>
                <button
                  type="button"
                  disabled={downloadingZip}
                  onClick={() => void handleDownloadCloudflareZip()}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-sky-500/45 bg-sky-600/20 hover:bg-sky-600/30 text-sky-100 font-bold text-[12.5px] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  {downloadingZip ? 'Empaquetando...' : 'Descargar Cloudflare ZIP'}
                </button>
              </div>
            </div>

            <div className="pt-3 mt-1 border-t border-slate-800">
              <label className="block text-[12.5px] font-extrabold text-white mb-1.5">
                WhatsApp para Sugerencias (10 dígitos)
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={waSugerenciasInput}
                  onChange={(e) => {
                    setWaSugerenciasInput(e.target.value);
                    setWaSugerenciasError('');
                  }}
                  placeholder={phonePlaceholder.replace(/-/g, '')}
                  className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!waSugerenciasInput.trim()) {
                      onSaveSugerenciasWhatsapp('');
                      setWaSugerenciasError('');
                      onShowToast('WhatsApp de sugerencias limpiado');
                      return;
                    }
                    const check = validateWhatsappNumber(waSugerenciasInput);
                    if (!check.valid) {
                      setWaSugerenciasError(check.error || 'Número inválido');
                      return;
                    }
                    onSaveSugerenciasWhatsapp(check.digits);
                    setWaSugerenciasError('');
                    onShowToast('Número de WhatsApp guardado', true);
                  }}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[12.5px] cursor-pointer"
                >
                  Guardar
                </button>
              </div>
              {waSugerenciasError && (
                <p className="m-0 mt-1 text-[11.5px] text-red-400 font-semibold">
                  {waSugerenciasError}
                </p>
              )}
            </div>

            {/* Zona de mantenimiento: Reiniciar contadores estadísticos a 0 (con confirmación de seguridad) */}
            <div className="pt-3 mt-1 border-t border-slate-800">
              <div className="rounded-xl border border-amber-500/35 bg-amber-500/5 p-3 flex flex-col gap-2">
                <div className="text-[12px] font-extrabold text-amber-200 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Reinicio de contadores del panel</span>
                </div>
                <p className="m-0 text-[11.5px] text-slate-300 leading-snug">
                  Reinicia la línea base de métricas estadísticas en este panel a 0 sin borrar datos de tus clientes en Firestore.
                </p>
                {!confirmResetCounters ? (
                  <button
                    type="button"
                    id="btn-admin-reset-counters"
                    onClick={() => setConfirmResetCounters(true)}
                    className="self-start min-h-[38px] px-3.5 py-1.5 rounded-xl border border-amber-500/45 bg-amber-500/15 hover:bg-amber-500/25 text-amber-100 font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reiniciar contadores a 0</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/60 px-3 py-2">
                    <span className="text-[11.5px] font-bold text-rose-100">
                      ¿Confirmas poner todos los contadores en 0?
                    </span>
                    <button
                      type="button"
                      id="btn-admin-reset-counters-confirm"
                      onClick={handleConfirmResetCounters}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11.5px] cursor-pointer border-0"
                    >
                      Sí, reiniciar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetCounters(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11.5px] cursor-pointer border border-slate-600"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Galería Antes y Después */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5 flex flex-col gap-3">
            <h2 className="m-0 text-[15px] font-extrabold text-white">
              Galería Antes y Después ({trabajosAntesDespues.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={adTitulo}
                onChange={(e) => setAdTitulo(e.target.value)}
                placeholder="Título del trabajo"
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px]"
              />
              <input
                type="text"
                value={adLinea}
                onChange={(e) => setAdLinea(e.target.value)}
                placeholder='Línea (ej. Línea Nacional 3")'
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px]"
              />
            </div>
            <textarea
              value={adDesc}
              onChange={(e) => setAdDesc(e.target.value)}
              rows={2}
              placeholder="Descripción breve del trabajo instalado..."
              className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px]"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => adminAntesRef.current?.click()}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-[12px] font-bold cursor-pointer"
              >
                {adAntesUrl ? '✓ Foto Antes cargada' : 'Subir Foto Antes'}
              </button>
              <button
                type="button"
                onClick={() => adminDespuesRef.current?.click()}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-[12px] font-bold cursor-pointer"
              >
                {adDespuesUrl ? '✓ Foto Después cargada' : 'Subir Foto Después'}
              </button>
              <input
                ref={adminAntesRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const url = await compressImageToDataUrl(f, 600, 0.78).catch(() => '');
                    if (url) setAdAntesUrl(url);
                  }
                  e.target.value = '';
                }}
              />
              <input
                ref={adminDespuesRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const url = await compressImageToDataUrl(f, 600, 0.78).catch(() => '');
                    if (url) setAdDespuesUrl(url);
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!adTitulo.trim()) {
                    onShowToast('Escribe el título del trabajo antes de publicar');
                    return;
                  }
                  onPublishTrabajoAprobado({
                    titulo: adTitulo.trim(),
                    descripcion: adDesc.trim() || 'Trabajo aprobado de taller.',
                    lineaNombre: adLinea.trim() || 'Aluminio',
                    antesImgUrl: adAntesUrl || undefined,
                    despuesImgUrl: adDespuesUrl || undefined,
                  });
                  setAdTitulo('');
                  setAdDesc('');
                  setAdAntesUrl('');
                  setAdDespuesUrl('');
                  onShowToast('Trabajo publicado en Galería', true);
                }}
                className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-extrabold cursor-pointer ml-auto"
              >
                Publicar Trabajo
              </button>
            </div>

            <div className="mt-1 max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1">
              {trabajosAntesDespues.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <strong className="block text-[12.5px] text-white truncate">{t.titulo}</strong>
                    <span className="block text-[11px] text-slate-400 truncate">
                      {t.lineaNombre} · {t.fecha}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteTrabajoAprobado(t.id)}
                    className="min-h-[30px] px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/40 text-red-200 text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: GESTIÓN DE VIDEO TUTORIALES (FIRESTORE) ==================== */}
      {activeTab === 'videos' && (
        <div id="admin-tab-videos-content" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-[15px] font-extrabold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-sky-400" aria-hidden="true" />
                <span>{vidEditingId ? 'Editar Video Tutorial' : 'Publicar Video Tutorial'}</span>
              </h2>
              {vidEditingId && (
                <button
                  type="button"
                  onClick={() => {
                    setVidEditingId(null);
                    setVidTitle('');
                    setVidDesc('');
                    setVidUrl('');
                  }}
                  className="text-[11.5px] font-bold text-slate-300 underline cursor-pointer bg-transparent border-0"
                >
                  Cancelar edición
                </button>
              )}
            </div>
            <p className="m-0 text-[12px] text-slate-400 leading-snug">
              Los videos publicados aquí se sincronizan en tiempo real con Firestore (<span className="mono">tutorial_videos</span>) para todos los usuarios.
            </p>

            <div>
              <label htmlFor="admin-vid-title" className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Título del video *
              </label>
              <input
                id="admin-vid-title"
                type="text"
                value={vidTitle}
                onChange={(e) => setVidTitle(e.target.value)}
                placeholder="Ej. Cómo cotizar una ventana 3 pulgadas"
                className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
            </div>

            <div>
              <label htmlFor="admin-vid-category" className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Categoría *
              </label>
              <select
                id="admin-vid-category"
                value={vidCategory}
                onChange={(e) => setVidCategory(e.target.value as TutorialVideoCategoryId)}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              >
                {TUTORIAL_VIDEO_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="admin-vid-url" className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Enlace de YouTube, Vimeo, Google Drive o MP4 *
              </label>
              <input
                id="admin-vid-url"
                type="url"
                value={vidUrl}
                onChange={(e) => setVidUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
              {vidUrl.trim() && (
                <div className="mt-1 text-[11px] font-bold">
                  {parseTutorialVideoUrl(vidUrl).valid ? (
                    <span className="text-emerald-400">
                      ✓ Fuente válida detectada ({parseTutorialVideoUrl(vidUrl).provider.toUpperCase()})
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      ✕ Ingresa un enlace válido de YouTube, Vimeo, Google Drive o archivo MP4/WebM
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="admin-vid-desc" className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Descripción breve
              </label>
              <textarea
                id="admin-vid-desc"
                rows={2}
                value={vidDesc}
                onChange={(e) => setVidDesc(e.target.value)}
                placeholder="Resumen práctico de lo que aprenderá el aluminero..."
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[12.5px]"
              />
            </div>

            <button
              type="button"
              id="btn-admin-save-video"
              disabled={vidSaving}
              onClick={async () => {
                if (!vidTitle.trim()) {
                  onShowToast('Escribe el título del video tutorial');
                  return;
                }
                const parsed = parseTutorialVideoUrl(vidUrl);
                if (!parsed.valid) {
                  onShowToast('Ingresa una URL válida de YouTube, Vimeo, Google Drive o MP4');
                  return;
                }
                setVidSaving(true);
                try {
                  const id = vidEditingId || `vid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                  const nextItem: TutorialVideoItem = {
                    id,
                    titulo: vidTitle.trim(),
                    descripcion: vidDesc.trim(),
                    categoria: vidCategory,
                    url: vidUrl.trim(),
                    orden: adminVideos.length + 1,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  const ok = await saveTutorialVideoCloud(nextItem);
                  setAdminVideos((prev) => {
                    const updated = [nextItem, ...prev.filter((v) => v.id !== id)];
                    saveTutorialVideosCache(updated);
                    return updated;
                  });
                  setVidEditingId(null);
                  setVidTitle('');
                  setVidDesc('');
                  setVidUrl('');
                  onShowToast(
                    ok
                      ? 'Video publicado y sincronizado en Firestore'
                      : 'Video guardado localmente (sincronizará al volver la red)',
                    true
                  );
                } finally {
                  setVidSaving(false);
                }
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{vidSaving ? 'Guardando...' : vidEditingId ? 'Actualizar Video' : 'Publicar en Video Tutoriales'}</span>
            </button>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(adminVideos, null, 2)], { type: 'application/json' });
                  const u = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = u;
                  a.download = 'aluminero-video-tutoriales.json';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.setTimeout(() => URL.revokeObjectURL(u), 1500);
                  onShowToast(`Exportados ${adminVideos.length} video(s)`, true);
                }}
                className="flex-1 min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11.5px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Exportar JSON</span>
              </button>
              <button
                type="button"
                onClick={() => importVideosJsonRef.current?.click()}
                className="flex-1 min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11.5px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Importar JSON</span>
              </button>
              <input
                ref={importVideosJsonRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  try {
                    const arr = JSON.parse(await f.text()) as unknown;
                    if (!Array.isArray(arr)) {
                      onShowToast('Formato JSON inválido');
                      return;
                    }
                    let count = 0;
                    for (const raw of arr) {
                      if (!raw || typeof raw !== 'object') continue;
                      const obj = raw as Record<string, unknown>;
                      const titulo = String(obj.titulo || obj.title || '').trim();
                      const url = String(obj.url || '').trim();
                      if (!titulo || !parseTutorialVideoUrl(url).valid) continue;
                      const rawCat = obj.categoria ?? obj.category;
                      const matchedCat = TUTORIAL_VIDEO_CATEGORIES.find(
                        (c) => c.id === rawCat || c.label === rawCat
                      );
                      const categoria: TutorialVideoCategoryId = matchedCat ? matchedCat.id : 'primeros-pasos';
                      await saveTutorialVideoCloud({
                        id: String(obj.id || `vid_${Date.now()}_${count}`),
                        titulo,
                        descripcion: String(obj.descripcion || obj.description || '').trim(),
                        categoria,
                        url,
                        orden: Number(obj.orden) || count + 1,
                        createdAt: Date.now(),
                      });
                      count++;
                    }
                    onShowToast(`Importados ${count} video(s) tutoriales`, true);
                  } catch {
                    onShowToast('No se pudo leer el JSON de videos');
                  }
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-[15px] font-extrabold text-white">
                Catálogo Publicado ({adminVideos.length})
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                Sincronización en vivo Firestore
              </span>
            </div>

            {adminVideos.length === 0 ? (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/60 text-center text-[12.5px] text-slate-400">
                Aún no hay videos tutoriales publicados. Agrega tu primer enlace en el formulario izquierdo.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {adminVideos.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/75 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/35 text-sky-300 text-[10px] font-extrabold mb-1">
                        {TUTORIAL_VIDEO_CATEGORIES.find((c) => c.id === v.categoria)?.label || v.categoria}
                      </span>
                      <strong className="block text-[13.5px] text-white truncate">{v.titulo}</strong>
                      {v.descripcion && (
                        <p className="m-0 mt-0.5 text-[11.5px] text-slate-400 line-clamp-2">{v.descripcion}</p>
                      )}
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-[11px] text-sky-400 hover:underline break-all"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>{v.url}</span>
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setVidEditingId(v.id);
                          setVidTitle(v.titulo);
                          setVidDesc(v.descripcion || '');
                          setVidCategory(v.categoria);
                          setVidUrl(v.url);
                        }}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteTutorialVideoCloud(v.id);
                          setAdminVideos((prev) => {
                            const updated = prev.filter((item) => item.id !== v.id);
                            saveTutorialVideosCache(updated);
                            return updated;
                          });
                          onShowToast('Video eliminado del catálogo');
                        }}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-200 text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: PRECIOS DE REFERENCIA (FIRESTORE) Y VIGENCIA CATÁLOGOS ==================== */}
      {activeTab === 'precios' && (
        <div id="admin-panel-precios" className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-6 shadow-md flex flex-col gap-5">
          {/* Control de Insignia de Vigencia Anual de Catálogos Oficiales */}
          <div
            id="admin-catalog-vigencia-card"
            className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="m-0 text-[15px] font-extrabold text-emerald-200">
                  Insignia de Vigencia Anual de Catálogos Oficiales (2026–2027)
                </h3>
                <p className="m-0 mt-0.5 text-[12px] text-slate-300">
                  Edita el año o texto de actualización que se muestra en la cabecera del Catálogo y en el selector de marcas del Cotizador cuando subas los catálogos 2027.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-emerald-400/50 bg-emerald-500/15 text-emerald-100 text-[11px] font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                <span>{vigenciaDraft.trim() || DEFAULT_CATALOG_VIGENCIA_LABEL}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="input-admin-catalog-vigencia"
                type="text"
                maxLength={140}
                value={vigenciaDraft}
                onChange={(e) => setVigenciaDraft(e.target.value)}
                placeholder={DEFAULT_CATALOG_VIGENCIA_LABEL}
                className="flex-1 min-w-[240px] min-h-[42px] px-3 rounded-xl border border-emerald-500/40 bg-slate-950 text-white text-[13px] font-semibold"
              />
              <button
                type="button"
                id="btn-admin-save-catalog-vigencia"
                disabled={vigenciaSaving}
                onClick={async () => {
                  if (!onUpdateCatalogVigenciaLabel) return;
                  setVigenciaSaving(true);
                  try {
                    await onUpdateCatalogVigenciaLabel(vigenciaDraft);
                  } finally {
                    setVigenciaSaving(false);
                  }
                }}
                className="min-h-[42px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-[12.5px] font-black cursor-pointer"
              >
                {vigenciaSaving ? 'Guardando...' : 'Guardar Vigencia'}
              </button>
              <button
                type="button"
                id="btn-admin-reset-catalog-vigencia"
                disabled={vigenciaSaving}
                onClick={async () => {
                  setVigenciaDraft(DEFAULT_CATALOG_VIGENCIA_LABEL);
                  if (!onUpdateCatalogVigenciaLabel) return;
                  setVigenciaSaving(true);
                  try {
                    await onUpdateCatalogVigenciaLabel(DEFAULT_CATALOG_VIGENCIA_LABEL);
                  } finally {
                    setVigenciaSaving(false);
                  }
                }}
                className="min-h-[42px] px-3 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[12px] font-bold cursor-pointer"
              >
                Restaurar 2026–2027
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                <span>Precios de Referencia de Mercado (MXN)</span>
              </h2>
              <p className="m-0 mt-1 text-[12.5px] text-slate-400">
                Publica precios semanales sugeridos visibles para usuarios con Prueba o Licencia PRO desde Mi Taller.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportRefPricesJson}
                className="min-h-[38px] px-3 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Exportar JSON</span>
              </button>
              <button
                type="button"
                onClick={() => importRefPricesInputRef.current?.click()}
                className="min-h-[38px] px-3 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Importar CSV/JSON</span>
              </button>
              <input
                ref={importRefPricesInputRef}
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={handleImportRefPricesFile}
                className="hidden"
              />
              <button
                type="button"
                id="btn-admin-save-ref-prices"
                disabled={refSaving}
                onClick={() => void handleSaveRefPricesCloud()}
                className="min-h-[38px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-[12.5px] font-black cursor-pointer"
              >
                {refSaving ? 'Guardando...' : 'Publicar en la Nube'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Etiqueta de semana / fecha
              </label>
              <input
                type="text"
                value={refPricesDoc.updatedLabel}
                onChange={(e) =>
                  setRefPricesDoc((prev) => ({ ...prev, updatedLabel: e.target.value }))
                }
                placeholder="Ej. Actualizado Semana 47 · Nov 2026"
                className="w-full min-h-[40px] px-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Nota / Deslinde para talleres
              </label>
              <input
                type="text"
                value={refPricesDoc.nota}
                onChange={(e) => setRefPricesDoc((prev) => ({ ...prev, nota: e.target.value }))}
                placeholder="Valores promedio orientativos en México"
                className="w-full min-h-[40px] px-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-700 rounded-xl">
            <table className="w-full text-left border-collapse text-[12px] min-w-[520px]">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300">
                  <th className="p-2.5">Categoría</th>
                  <th className="p-2.5">Concepto / Perfil</th>
                  <th className="p-2.5">Unidad</th>
                  <th className="p-2.5 text-right">Precio Sugerido ($ MXN)</th>
                </tr>
              </thead>
              <tbody>
                {refPricesDoc.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-800 last:border-b-0">
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10.5px] uppercase font-bold text-sky-300">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.nombre}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRefPricesDoc((prev) => ({
                            ...prev,
                            items: prev.items.map((it, i) => (i === idx ? { ...it, nombre: val } : it)),
                          }));
                        }}
                        className="w-full min-h-[34px] px-2 rounded-lg border border-slate-700 bg-slate-950 text-white text-[12px]"
                      />
                    </td>
                    <td className="p-2 text-slate-300 mono">{item.unidad}</td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min={1}
                        step={5}
                        value={item.precioSugerido}
                        onChange={(e) => {
                          const num = Math.max(1, Number(e.target.value) || 0);
                          setRefPricesDoc((prev) => ({
                            ...prev,
                            items: prev.items.map((it, i) =>
                              i === idx ? { ...it, precioSugerido: num } : it
                            ),
                          }));
                        }}
                        className="w-[100px] min-h-[34px] px-2 rounded-lg border border-slate-700 bg-slate-950 text-emerald-300 font-extrabold mono text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB: MENSAJES / AVISOS ==================== */}
      {activeTab === 'mensajes' && (
        <div id="admin-panel-mensajes" className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-6 shadow-md flex flex-col gap-3.5">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400" aria-hidden="true" />
                <span>Enviar Aviso o Mensaje a Usuarios</span>
              </h2>
              <p className="m-0 mt-1 text-[12.5px] text-slate-400">
                Envía un aviso general a todos los talleres o un mensaje directo a un ID de equipo específico.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-msg-target-all"
                onClick={() => setMsgTargetMode('all')}
                className={`min-h-[40px] rounded-xl border text-[12px] font-extrabold cursor-pointer ${
                  msgTargetMode === 'all'
                    ? 'border-blue-400 bg-blue-600 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                📢 Todos los usuarios
              </button>
              <button
                type="button"
                id="btn-msg-target-one"
                onClick={() => setMsgTargetMode('individual')}
                className={`min-h-[40px] rounded-xl border text-[12px] font-extrabold cursor-pointer ${
                  msgTargetMode === 'individual'
                    ? 'border-blue-400 bg-blue-600 text-white'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                🎯 Usuario específico
              </button>
            </div>

            {msgTargetMode === 'individual' && (
              <div>
                <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                  ID de Equipo destinatario
                </label>
                <input
                  type="text"
                  list="admin-devices-datalist"
                  value={msgTargetDeviceId}
                  onChange={(e) => setMsgTargetDeviceId(e.target.value.toUpperCase())}
                  placeholder="Ej. ALM-XXXX"
                  className="w-full min-h-[42px] px-3 rounded-xl border border-slate-700 bg-slate-950 text-sky-300 mono font-bold text-[13px]"
                />
                <datalist id="admin-devices-datalist">
                  {auditUsers.map((u) => (
                    <option key={u.deviceId} value={u.deviceId}>
                      {u.clienteDisplay}
                    </option>
                  ))}
                </datalist>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'aviso', label: '🔔 Aviso' },
                  { id: 'promo', label: '🎁 Promo' },
                  { id: 'soporte', label: '🛠️ Soporte' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMsgType(t.id)}
                  className={`min-h-[36px] rounded-xl border text-[12px] font-bold cursor-pointer ${
                    msgType === t.id
                      ? 'border-emerald-400 bg-emerald-600 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">Título *</label>
              <input
                type="text"
                id="inp-admin-msg-title"
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                placeholder="Ej. Nueva lista de precios de aluminio"
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Mensaje / Cuerpo *
              </label>
              <textarea
                id="inp-admin-msg-body"
                rows={4}
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Escribe aquí el aviso o mensaje para tus usuarios..."
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
            </div>

            <button
              type="button"
              id="btn-admin-send-msg"
              disabled={msgSending}
              onClick={() => void handleSendAdminMessage()}
              className="min-h-[46px] px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-extrabold text-[13.5px] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{msgSending ? 'Enviando...' : 'Publicar Aviso / Mensaje'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-6 shadow-md">
            <h3 className="m-0 text-[16px] font-extrabold text-white mb-3">
              Mensajes Enviados ({adminMessages.length})
            </h3>
            {adminMessages.length === 0 ? (
              <p className="m-0 text-[12.5px] text-slate-400 p-5 text-center border border-dashed border-slate-700 rounded-xl">
                Aún no has enviado avisos o mensajes a los usuarios.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                {adminMessages.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-slate-700/80 bg-slate-950/70 flex items-start justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-200 text-[10px] font-extrabold uppercase">
                          {m.tipo}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                          {m.targetMode === 'all' ? 'Todos' : m.targetLabel || m.targetDeviceId}
                        </span>
                      </div>
                      <strong className="block text-[13.5px] text-white">{m.titulo}</strong>
                      <p className="m-0 mt-0.5 text-[12px] text-slate-300 whitespace-pre-line">{m.cuerpo}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteAdminMessageCloud(m.id);
                        onShowToast('Aviso eliminado');
                      }}
                      aria-label={`Eliminar aviso ${m.titulo}`}
                      className="min-w-[34px] min-h-[34px] rounded-lg border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 text-red-200 inline-flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de pegado manual (fallback cuando el navegador bloquea clipboard.readText) */}
      {pasteModalOpen && (
        <div
          id="modal-admin-manual-paste"
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPasteModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
            <h3 className="m-0 text-[16px] font-extrabold">Pegar mensaje de WhatsApp</h3>
            <p className="m-0 mt-1 text-[12px] text-slate-300">
              Pega aquí el mensaje recibido del cliente para extraer automáticamente Taller, Teléfono, Plan e ID de Equipo.
            </p>
            <textarea
              id="inp-admin-manual-paste-text"
              rows={5}
              autoFocus
              value={pasteModalText}
              onChange={(e) => setPasteModalText(e.target.value)}
              placeholder="Pega aquí el texto de WhatsApp..."
              className="mt-3 w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="min-h-[40px] px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 font-bold text-[12.5px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-admin-extract-manual"
                onClick={() => {
                  const ok = applyParsedWhatsappText(pasteModalText, pasteAutoGen);
                  if (ok) setPasteModalOpen(false);
                }}
                className="min-h-[40px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[12.5px] cursor-pointer"
              >
                Extraer datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación obligatoria para Activar Directo en la Nube */}
      {confirmDirectCloudOpen && (() => {
        const plan = PLANS.find((p) => p.idx === planIdx) || PLANS[0];
        const planLabelVal = parsedCustomDays ? `Reposición ${parsedCustomDays} días` : plan.label;
        const cleanDev = normalizeDeviceIdInput(targetDevice, deviceId);
        return (
          <div
            id="modal-confirm-direct-cloud"
            className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDirectCloudOpen(false);
            }}
          >
            <div className="w-full max-w-md rounded-2xl border border-blue-500/50 bg-slate-900 p-5 text-white shadow-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="m-0 text-[16px] font-extrabold">
                    ¿Realmente quieres activar esta licencia en la nube?
                  </h3>
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[12.5px] space-y-1">
                    <div>
                      <span className="text-slate-400">ID de Equipo: </span>
                      <strong className="mono text-sky-300">{cleanDev}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Taller / Cliente: </span>
                      <strong className="text-white">{clienteNombre} ({clienteTelefono})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Plan: </span>
                      <strong className="text-emerald-300">{planLabelVal}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  id="btn-cancel-direct-cloud"
                  onClick={() => setConfirmDirectCloudOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 font-bold text-[12.5px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-direct-cloud"
                  onClick={async () => {
                    setConfirmDirectCloudOpen(false);
                    await handleActivateDirect();
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[12.5px] cursor-pointer"
                >
                  Sí, confirmar activación
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Diálogo in-app de confirmación de acciones críticas */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingAction(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="m-0 text-[16px] font-extrabold">
                  {pendingAction.type === 'revokePromo' && '¿Revocar plan y pasar a Versión Gratuita?'}
                  {pendingAction.type === 'blockFree' && '¿Bloquear acceso completo a este equipo?'}
                  {pendingAction.type === 'resetColega' && '¿Restablecer permiso de Promo Colega?'}
                  {pendingAction.type === 'deleteRecord' && '¿Eliminar registro del historial?'}
                </h3>
                <p className="m-0 mt-1.5 text-[12.5px] text-slate-300 leading-relaxed">
                  {pendingAction.type === 'revokePromo' &&
                    `El equipo ${pendingAction.deviceId} (${pendingAction.cliente}) perderá su licencia activa y regresará a Versión Gratuita. Su bandera promo_colega_usada se conserva intacta.`}
                  {pendingAction.type === 'blockFree' &&
                    `El equipo ${pendingAction.deviceId} (${pendingAction.cliente}) quedará bloqueado inmediatamente en la nube.`}
                  {pendingAction.type === 'resetColega' &&
                    `Se restablecerá manualmente promo_colega_usada = false para el equipo ${pendingAction.deviceId} (${pendingAction.cliente}), permitiéndole usar nuevamente una prueba de 3 días si así lo autorizas.`}
                  {pendingAction.type === 'deleteRecord' &&
                    `Se eliminará el registro de ${pendingAction.rec.deviceId} del panel de administración.`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 font-bold text-[12.5px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const act = pendingAction;
                  setPendingAction(null);
                  if (act.type === 'revokePromo') {
                    await onRevokePromo(act.deviceId, act.keyCode);
                  } else if (act.type === 'blockFree') {
                    await onRevokeFreeAccess(act.deviceId, act.keyCode);
                  } else if (act.type === 'resetColega') {
                    await onResetPromoColega(act.deviceId);
                  } else if (act.type === 'deleteRecord') {
                    onDeleteAdminKey(act.rec);
                  }
                }}
                className={`min-h-[40px] px-4 py-2 rounded-xl font-extrabold text-[12.5px] cursor-pointer ${
                  pendingAction.type === 'resetColega'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
