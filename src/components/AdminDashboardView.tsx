import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  BarChart3,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  Gift,
  KeyRound,
  PieChart as PieChartIcon,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
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
  CloudDeviceRecord,
  computeSalesAnalytics,
  filterAdminRecordsByResetBaseline,
  formatClientHeaderDisplay,
  formatClientPhoneInput,
  formatCombinedClientLabel,
  generateActivationKey,
  generateRandomMxPhonePlaceholder,
  isColleaguePromoPlan,
  isProActive,
  isUnassignedAutoTrialDevice,
  LineaId,
  LINEAS_CONFIG,
  normalizeDeviceIdInput,
  PLANS,
  UsageStats30d,
} from '../utils/alumineroLogic';
import {
  AdminKeyRecord,
  AlumineroBackupPayload,
  compressImageToDataUrl,
  CotizacionGuardada,
  formatDateTimeExact,
  FormulaPersonalizada,
  LicenciaState,
  loadCotizacionesGuardadas,
  parseBackupPayload,
  ReferralHistoryRecord,
  TrabajoAntesDespuesItem,
  validateWhatsappNumber,
} from '../utils/storageHelpers';
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
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const ADMIN_COUNTERS_RESET_KEY = 'aluminero_admin_counters_reset_at_v1';

type AdminTabId = 'dashboard' | 'graficas' | 'ventas' | 'claves' | 'referidos' | 'herramientas';
type PlanFilterId = 'todos' | 'gratis' | 'colega3d' | '30d' | '90d' | '365d' | 'bloqueados';
type ChartGranularity = 'week' | 'month';

type ClassifiedTier = 'gratis' | 'colega3d' | '30d' | '90d' | '365d' | 'otros_pro' | 'bloqueado';

function classifyPlanTier(params: {
  isBlocked: boolean;
  hasActivePro: boolean;
  planCode?: string | null;
  planLabel?: string | null;
  dias?: number | null;
  keyCode?: string | null;
}): ClassifiedTier {
  if (params.isBlocked) return 'bloqueado';
  if (!params.hasActivePro) return 'gratis';
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
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [countersResetAt, setCountersResetAt] = useState<number>(() => {
    try {
      const saved = window.localStorage.getItem(ADMIN_COUNTERS_RESET_KEY);
      if (saved !== null) {
        const parsed = Number(saved);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
      // Inicio limpio en 0 para contadores estadísticos (se actualizan dinámicamente con nueva actividad real)
      const baseline = Date.now();
      window.localStorage.setItem(ADMIN_COUNTERS_RESET_KEY, String(baseline));
      return baseline;
    } catch {
      return Date.now();
    }
  });
  const [confirmResetCounters, setConfirmResetCounters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanFilterId>('todos');
  const [chartGranularity, setChartGranularity] = useState<ChartGranularity>('week');
  const [expandedActionDevId, setExpandedActionDevId] = useState<string | null>(null);
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [phonePlaceholder] = useState<string>(() => generateRandomMxPhonePlaceholder());
  const [cotizacionesList, setCotizacionesList] = useState<CotizacionGuardada[]>(() =>
    loadCotizacionesGuardadas()
  );

  useEffect(() => {
    const refreshQuotes = () => setCotizacionesList(loadCotizacionesGuardadas());
    window.addEventListener('aluminero:cotizaciones-updated', refreshQuotes);
    window.addEventListener('focus', refreshQuotes);
    return () => {
      window.removeEventListener('aluminero:cotizaciones-updated', refreshQuotes);
      window.removeEventListener('focus', refreshQuotes);
    };
  }, []);

  const salesAnalytics = useMemo(
    () =>
      computeSalesAnalytics({
        cotizacionesGuardadas: cotizacionesList,
        obrasAprobadas: backupData.obrasAprobadas,
        historial: backupData.historial,
      }),
    [cotizacionesList, backupData.obrasAprobadas, backupData.historial]
  );

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

  useEffect(() => {
    void onRefreshCloud();
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

  // Merge filtered cloud devices + adminKeys history into a single auditable user directory (starts at 0 cleanly)
  const auditUsers = useMemo(() => {
    const cleanSelfId = normalizeDeviceIdInput(deviceId) || deviceId.trim().toUpperCase();
    const now = nowTick;

    const effectiveAdminKeys = filterAdminRecordsByResetBaseline(adminKeys, countersResetAt);
    const effectiveCloudDevices = filterAdminRecordsByResetBaseline(cloudDevices, countersResetAt);

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

        const tier = classifyPlanTier({
          isBlocked,
          hasActivePro,
          planCode: effectivePlanCode,
          planLabel: effectivePlanLabel,
          dias: latestKey?.dias ?? null,
          keyCode,
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
          dev?.cliente && dev.cliente !== 'Cliente sin nombre'
            ? dev.cliente
            : latestKey?.cliente || (isSelf ? selfDisplayName : 'Usuario sin nombre');

        const clienteDisplay = formatClientHeaderDisplay(rawCliente) || 'Usuario sin nombre';
        const linkedEmail = dev?.linkedEmail || latestKey?.linkedEmail || '';

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
  }, [cloudDevices, adminKeys, deviceId, licencia, backupData.taller, revokedDevicesMap, revokedKeysSet, nowTick, countersResetAt]);

  // KPI metrics
  const kpis = useMemo(() => {
    let gratis = 0;
    let colega3d = 0;
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
    return {
      totalUsers: auditUsers.length,
      gratis,
      colega3d,
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
    const total = Math.max(1, kpis.totalUsers);
    const proRate = Math.round((kpis.totalProPaid / total) * 100);
    const colegaUsageRate = Math.round((kpis.colegaUsadaTotal / total) * 100);
    const estimatedProValue = kpis.pro30 * 369 + kpis.pro90 * 989 + kpis.pro365 * 1799;
    return {
      proRate,
      colegaUsageRate,
      estimatedProValue,
      totalKeysIssued: filterAdminRecordsByResetBaseline(adminKeys, countersResetAt).length,
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

  const handleCopyKeyAndSave = async () => {
    if (!clienteNombre.trim() || clienteTelefono.replace(/\D/g, '').length === 0) {
      onShowToast('Escribe el nombre y teléfono del cliente para generar su clave');
      return;
    }
    const key = refreshKeyPreview();
    const now = Date.now();
    const plan = PLANS.find((p) => p.idx === planIdx) || PLANS[0];
    const dias = parsedCustomDays ?? plan.days;
    const planLabel = parsedCustomDays ? `Reposición ${parsedCustomDays} días` : plan.label;
    const planCode = parsedCustomDays ? `D${parsedCustomDays}` : plan.code;
    const expiresAt = now + dias * 24 * 60 * 60 * 1000;
    const cleanTarget = normalizeDeviceIdInput(targetDevice, deviceId);
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

    void Promise.resolve(
      onCloudActivateDevice({
        deviceId: cleanTarget,
        cliente: cleanCliente,
        planCode,
        planLabel,
        expiresAt,
        key,
        dias,
        recordKeyOnly: true,
      })
    ).catch(() => false);

    await navigator.clipboard.writeText(key).catch(() => {});
    onShowToast(`Clave ${key} copiada y registrada`, true);
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
      className="w-full max-w-[1400px] mx-auto pb-24 text-slate-100 screen-animate"
    >
      {/* Cabecera Full-Screen del Panel de Administrador */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40 flex items-center justify-center text-white shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="m-0 text-[20px] sm:text-[24px] font-extrabold text-white tracking-tight leading-tight">
                Panel de Administrador
              </h1>
              <p className="m-0 mt-1 text-[12.5px] sm:text-[13.5px] text-slate-300 leading-snug">
                Espacio completo de gestión: auditoría de usuarios, página dedicada de gráficas, licencias PRO y control de Promo Colega
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11.5px] text-slate-400">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold">
                  <span
                    className={`w-2 h-2 rounded-full ${cloudConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    aria-hidden="true"
                  />
                  {cloudConnected ? 'Conectado a Firestore' : 'Modo Local / Sincronizando'}
                </span>
                {cloudLastSyncAt && (
                  <span className="mono">
                    Últ. sinc.: {formatDateTimeExact(cloudLastSyncAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {!confirmResetCounters ? (
              <button
                type="button"
                id="btn-admin-reset-counters"
                onClick={() => setConfirmResetCounters(true)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 font-bold text-[12px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reiniciar contadores a 0</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-950/60 px-2.5 py-1.5">
                <span className="text-[11.5px] font-bold text-rose-100">¿Poner todo en 0?</span>
                <button
                  type="button"
                  id="btn-admin-reset-counters-confirm"
                  onClick={handleConfirmResetCounters}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11.5px] cursor-pointer border-0"
                >
                  Sí, reiniciar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetCounters(false)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11.5px] cursor-pointer border border-slate-600"
                >
                  No
                </button>
              </div>
            )}
            <button
              type="button"
              id="btn-admin-refresh-cloud"
              onClick={() => void onRefreshCloud()}
              disabled={cloudRefreshing}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-sky-400/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-100 font-bold text-[12px] inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${cloudRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{cloudRefreshing ? 'Actualizando...' : 'Actualizar Nube'}</span>
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

        {/* Acción Principal Destacada: Generar Claves */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-3">
          <button
            type="button"
            role="tab"
            id="tab-admin-claves"
            aria-selected={activeTab === 'claves'}
            onClick={() => setActiveTab('claves')}
            className={`w-full min-h-[56px] px-5 py-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-3 cursor-pointer transition-all shadow-lg ${
              activeTab === 'claves'
                ? 'border-amber-300 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 shadow-orange-500/35 ring-2 ring-amber-300/40'
                : 'border-amber-400/80 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-orange-500/20'
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-slate-950/20 border border-slate-950/20 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-slate-950" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[16px] sm:text-[17px] font-black tracking-tight leading-tight text-slate-950">
                  Generar Claves PRO
                </span>
                <span className="block text-[12px] font-bold text-slate-900/90 mt-0.5 truncate">
                  Acción principal · Emitir PINs de 3 días (Colega), 30 días, 90 días o 1 Año al instante
                </span>
              </span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 text-amber-300 text-[12px] font-extrabold">
              <span>{activeTab === 'claves' ? 'Abierto' : 'Abrir generador'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </span>
          </button>

          {/* Navegación secundaria ordenada y simétrica */}
          <div
            role="tablist"
            aria-label="Páginas secundarias de administración"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"
          >
            {(
              [
                { id: 'dashboard', label: 'Usuarios y Auditoría', icon: Users },
                { id: 'graficas', label: 'Gráficas y Analíticas', icon: BarChart3 },
                { id: 'ventas', label: 'Análisis de Ventas', icon: TrendingUp },
                { id: 'referidos', label: `Referidos (${activeReferralHistory.length})`, icon: Gift },
                { id: 'herramientas', label: 'Respaldo y Ajustes', icon: Settings },
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
                  className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border text-[12.5px] font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    active
                      ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                      : 'border-slate-700/80 bg-slate-800/70 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{tab.label}</span>
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
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
                  Total Registrados
                </span>
                <Users className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-2 mono text-[28px] font-extrabold text-white leading-none">
                {kpis.totalUsers}
              </div>
              <p className="m-0 mt-1.5 text-[11.5px] text-slate-400">
                Equipos únicos en directorio y nube
              </p>
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

            <div className="rounded-2xl border border-amber-500/40 bg-slate-900/95 p-4 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-300">
                  Usuarios PRO Activos
                </span>
                <Crown className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              </div>
              <div className="mt-2 mono text-[28px] font-extrabold text-amber-300 leading-none">
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

            {/* Lista estructurada y sin textos encimados */}
            {filteredUsers.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-[13px]">
                No se encontraron usuarios que coincidan con el filtro seleccionado.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredUsers.map((user) => {
                  const badge = tierBadgeMeta(user.tier, user.planLabel);
                  const isExpanded = expandedActionDevId === user.deviceId;
                  const isBusy = busyDeviceId === user.deviceId;

                  return (
                    <div
                      key={user.deviceId}
                      className="rounded-xl border border-slate-700/80 bg-slate-950/75 p-4 flex flex-col gap-3"
                    >
                      {/* Fila 1: Identidad, ID + Copiar, Estado actual y Promo Colega */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="mono text-[14px] font-extrabold text-sky-300 bg-sky-500/15 border border-sky-400/35 px-2.5 py-0.5 rounded-lg">
                              {user.deviceId}
                            </span>
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
                            <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-extrabold ${badge.cls}`}>
                              {badge.text}
                            </span>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <strong className="text-[14.5px] text-white font-extrabold">
                              {user.clienteDisplay}
                            </strong>
                            {user.linkedEmail && (
                              <span className="text-[12px] text-sky-300/90 break-all">
                                {user.linkedEmail}
                              </span>
                            )}
                            <span className="text-[11.5px] text-slate-400">
                              {user.deviceLabel}
                            </span>
                          </div>
                        </div>

                        {/* Indicador explícito de uso de Promo Colega 3 días */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {user.promoColegaUsed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-400/45 bg-amber-500/15 text-amber-200 text-[11.5px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                              Promo Colega 3d: YA CONSUMIDA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 text-[11.5px] font-semibold">
                              Promo Colega 3d: Disponible
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fila 2: Fechas exactas (Activación, Promo Colega y Vencimiento) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-800/90 text-[12px]">
                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2">
                          <span className="block text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
                            Activación Plan Actual
                          </span>
                          <strong className="mono text-slate-100 font-bold">
                            {formatDateTimeExact(user.activatedAt)}
                          </strong>
                        </div>
                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2">
                          <span className="block text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
                            Vencimiento Plan Actual
                          </span>
                          <strong className="mono text-slate-100 font-bold">
                            {user.hasActivePro
                              ? user.expiresAt === null
                                ? 'Vitalicia'
                                : formatDateTimeExact(user.expiresAt)
                              : 'Sin plan PRO activo'}
                          </strong>
                        </div>
                        <div className="rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2">
                          <span className="block text-[10.5px] uppercase tracking-wider font-bold text-slate-400">
                            Fecha Promo Colega 3d
                          </span>
                          <strong className="mono text-amber-200 font-bold">
                            {user.promoColegaUsed
                              ? formatDateTimeExact(user.fechaActivacionColega)
                              : 'No utilizada'}
                          </strong>
                        </div>
                      </div>

                      {/* Historial de promociones activadas para este usuario */}
                      {user.historyKeys.length > 0 && (
                        <div className="rounded-lg bg-slate-900/60 border border-slate-800/80 px-3 py-2">
                          <span className="block text-[10.5px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">
                            Historial de Promociones Activadas ({user.historyKeys.length})
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

                      {/* Fila 3: Acciones por usuario */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
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
                          {isExpanded ? 'Ocultar planes' : 'Renovar / Cambiar Plan'}
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
                            Bloquear
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

                      {/* Selector rápido inline de plan para renovar / cambiar */}
                      {isExpanded && (
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
        </div>
      )}

      {/* ==================== PÁGINA 3: ANÁLISIS DE VENTAS (TICKET PROMEDIO Y MATERIALES) ==================== */}
      {activeTab === 'ventas' && (
        <div id="admin-panel-ventas" className="flex flex-col gap-6">
          <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-blue-950/60 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-[18px] font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                <span>Análisis de Ventas y Consumo de Materiales</span>
              </h2>
              <p className="m-0 mt-1 text-[12.5px] text-slate-300">
                Calculado automáticamente a partir del historial de cotizaciones aprobadas y obras apartadas.
              </p>
            </div>
            <button
              type="button"
              id="btn-admin-ventas-refresh"
              onClick={() => setCotizacionesList(loadCotizacionesGuardadas())}
              className="min-h-[40px] px-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 font-extrabold text-[12px] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Recalcular datos</span>
            </button>
          </div>

          {/* 4 KPI cards principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-4 shadow-md">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                Ticket Promedio Aprobado
              </div>
              <div
                id="kpi-ventas-ticket-promedio"
                className="mt-1.5 text-[28px] font-black text-white mono leading-none"
              >
                ${salesAnalytics.averageTicket.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-[11.5px] text-slate-400">
                Min: ${salesAnalytics.minTicket.toLocaleString('es-MX')} · Máx: ${salesAnalytics.maxTicket.toLocaleString('es-MX')}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/40 bg-slate-900/95 p-4 shadow-md">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-300">
                Cotizaciones Aprobadas
              </div>
              <div
                id="kpi-ventas-aprobadas-count"
                className="mt-1.5 text-[28px] font-black text-white mono leading-none"
              >
                {salesAnalytics.approvedCount}
              </div>
              <div className="mt-2 text-[11.5px] text-slate-400">
                Tasa de cierre: <strong className="text-blue-200">{salesAnalytics.approvalRatePct}%</strong> ({salesAnalytics.totalQuotesCount} totales)
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/40 bg-slate-900/95 p-4 shadow-md">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                Ingresos Aprobados Totales
              </div>
              <div
                id="kpi-ventas-ingresos-totales"
                className="mt-1.5 text-[28px] font-black text-amber-200 mono leading-none"
              >
                ${salesAnalytics.totalApprovedRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-[11.5px] text-slate-400">
                Enviadas: {salesAnalytics.sentCount} · Rechazadas: {salesAnalytics.rejectedCount}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-500/40 bg-slate-900/95 p-4 shadow-md">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300">
                Perfil / Material #1
              </div>
              <div
                id="kpi-ventas-top-material"
                className="mt-1.5 text-[16px] font-black text-white leading-snug line-clamp-2"
              >
                {salesAnalytics.topMaterials[0]
                  ? salesAnalytics.topMaterials[0].nombre
                  : 'Sin consumo registrado'}
              </div>
              <div className="mt-1.5 text-[11.5px] text-violet-200 mono">
                {salesAnalytics.topMaterials[0]
                  ? `${salesAnalytics.topMaterials[0].cantidad} ${salesAnalytics.topMaterials[0].unidad} (${salesAnalytics.topMaterials[0].pct}%)`
                  : 'Aprueba cotizaciones para ver ranking'}
              </div>
            </div>
          </div>

          {/* Gráficas: Perfiles más consumidos + Montos de cotizaciones aprobadas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Gráfica 1: Perfiles / Materiales más consumidos */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="m-0 text-[15px] font-extrabold text-white">
                    Perfiles y Materiales Más Consumidos
                  </h3>
                  <p className="m-0 text-[11.5px] text-slate-400">
                    Top perfiles utilizados en cotizaciones aprobadas y obras apartadas
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 border border-violet-400/40 text-violet-200 text-[11px] font-extrabold mono">
                  {salesAnalytics.topMaterials.length} perfiles
                </span>
              </div>

              {salesAnalytics.topMaterials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-[13px] text-slate-400">
                  Aún no hay cotizaciones aprobadas con consumo de perfiles. Marca una cotización como <strong>Aprobada</strong> en el Historial para ver el ranking.
                </div>
              ) : (
                <>
                  <div className="w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesAnalytics.topMaterials.slice(0, 7).map((m) => ({
                          name: m.nombre.length > 22 ? `${m.nombre.slice(0, 20)}…` : m.nombre,
                          cantidad: m.cantidad,
                          unidad: m.unidad,
                        }))}
                        layout="vertical"
                        margin={{ top: 6, right: 20, left: 10, bottom: 6 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#e2e8f0"
                          fontSize={11}
                          width={130}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [`${value ?? 0}`, 'Consumo']}
                        />
                        <Bar dataKey="cantidad" radius={[0, 8, 8, 0]}>
                          {salesAnalytics.topMaterials.slice(0, 7).map((m, idx) => {
                            const palette = [
                              '#38bdf8',
                              '#34d399',
                              '#fbbf24',
                              '#a78bfa',
                              '#fb7185',
                              '#60a5fa',
                              '#2dd4bf',
                            ];
                            return <Cell key={m.id} fill={palette[idx % palette.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Lista detallada de materiales */}
                  <div className="mt-3 flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {salesAnalytics.topMaterials.map((mat, idx) => (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-[12px]"
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-white truncate">
                            #{idx + 1} · {mat.nombre}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {mat.linea}
                            {mat.codigo ? ` · Ref ${mat.codigo}` : ''}
                          </div>
                        </div>
                        <div className="text-right shrink-0 mono">
                          <div className="font-black text-emerald-300">
                            {mat.cantidad} {mat.unidad}
                          </div>
                          <div className="text-[10.5px] text-slate-400">{mat.pct}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Gráfica 2: Ticket por Cotización Aprobada */}
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-5 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="m-0 text-[15px] font-extrabold text-white">
                    Cotizaciones Aprobadas y Ticket
                  </h3>
                  <p className="m-0 text-[11.5px] text-slate-400">
                    Comparativa de montos aprobados frente al ticket promedio
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-extrabold mono">
                  Prom: ${salesAnalytics.averageTicket.toLocaleString('es-MX')}
                </span>
              </div>

              {salesAnalytics.approvedQuotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-[13px] text-slate-400">
                  No hay cotizaciones aprobadas todavía. Al aprobar cotizaciones en el Historial aparecerán aquí con su monto y promedio.
                </div>
              ) : (
                <>
                  <div className="w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesAnalytics.approvedQuotes.slice(0, 10).map((q, idx) => ({
                          label: q.folio || `Cot #${idx + 1}`,
                          cliente: q.cliente || 'Cliente',
                          total: Number(q.total) || 0,
                        }))}
                        margin={{ top: 10, right: 14, left: 4, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [
                            `$${Number(value ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                            'Monto aprobado',
                          ]}
                        />
                        <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabla de cotizaciones aprobadas recientes */}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                          <th className="py-2 pr-2">Folio / Cliente</th>
                          <th className="py-2 px-2 text-center">Piezas</th>
                          <th className="py-2 pl-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesAnalytics.approvedQuotes.slice(0, 8).map((q) => (
                          <tr key={q.id} className="border-b border-slate-800/60">
                            <td className="py-2 pr-2">
                              <div className="font-extrabold text-white">{q.cliente || 'Cliente sin nombre'}</div>
                              <div className="text-[10.5px] text-slate-400 mono">{q.folio || q.id}</div>
                            </td>
                            <td className="py-2 px-2 text-center mono text-slate-300">
                              {q.piezasCount || 0}
                            </td>
                            <td className="py-2 pl-2 text-right font-black text-emerald-300 mono">
                              ${(Number(q.total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: GENERADOR DE CLAVES Y LICENCIAS ==================== */}
      {activeTab === 'claves' && (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 sm:p-6 shadow-md max-w-3xl">
          <h2 className="m-0 text-[17px] font-extrabold text-white">
            Generador de Claves de Activación PRO
          </h2>
          <p className="m-0 mt-1 text-[12.5px] text-slate-400">
            Genera una clave ligada al ID de equipo del cliente o actívala directamente en la nube sin pedirle código.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                Nombre del cliente *
              </label>
              <input
                type="text"
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
                value={clienteTelefono}
                onChange={(e) => {
                  const formatted = formatClientPhoneInput(e.target.value);
                  setClienteTelefono(formatted);
                  refreshKeyPreview(targetDevice, planIdx, parsedCustomDays, clienteNombre, formatted);
                }}
                placeholder={phonePlaceholder}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-bold text-slate-300 mb-1">
                ID de Equipo destino
              </label>
              <input
                type="text"
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

          {generatedKey && (
            <div className="mt-4 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 flex items-center justify-between gap-3">
              <div>
                <span className="block text-[10.5px] uppercase font-bold text-emerald-300">
                  Clave generada lista para entrega
                </span>
                <strong className="mono text-[16px] text-white tracking-wider">
                  {generatedKey}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyKeyAndSave()}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[12px] cursor-pointer"
              >
                Copiar Clave
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => void handleCopyKeyAndSave()}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[13px] cursor-pointer"
            >
              Generar, Copiar y Guardar Clave
            </button>
            <button
              type="button"
              onClick={() => void handleActivateDirect()}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[13px] cursor-pointer shadow-md"
            >
              Activar Directo en la Nube
            </button>
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
