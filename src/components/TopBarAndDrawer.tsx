import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Crown,
  ExternalLink,
  Flame,
  HelpCircle,
  LayoutGrid,
  Lock,
  MessageCircle,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Scale,
  Sun,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';
import {
  APP_VERSION,
  formatLicenseCountdownBadge,
  GOOGLE_CLOUD_PERSUASIVE_TIP,
  GOOGLE_CONNECT_BENEFIT_SUBTITLE,
  GOOGLE_CONNECT_CTA_LABEL,
  HomePromoCardMode,
  isProActive,
} from '../utils/alumineroLogic';
import {
  AppSkin,
  AppSkinVariant,
  AppTheme,
  getSkinPlanRequirementLabel,
  isSkinUnlockedForLicense,
  LicenciaState,
  normalizeSkinVariantForSkin,
  ResolvedAppTheme,
  SKIN_VARIANTS_BY_SKIN,
} from '../utils/storageHelpers';
import { AlumineroProMetallicLogo } from './MetallicIcons';
import { ReferralPromoBanner } from './ReferralPromoBanner';
import {
  ASSISTANT_CHARACTERS,
  AssistantAvatarId,
  AssistantCharacterSvg,
  AVATAR_EVENT_NAME,
  AVATAR_VISIBLE_EVENT_NAME,
  loadAvatarVisible,
  loadSelectedAvatar,
  saveAvatarVisible,
  saveSelectedAvatar,
} from './AssistantCharacters';
import {
  AVATAR_SOUND_EVENT_NAME,
  AVATAR_TIPS_EVENT_NAME,
  loadAvatarSoundEnabled,
  loadAvatarTipsEnabled,
  playAssistantSound,
  saveAvatarSoundEnabled,
  saveAvatarTipsEnabled,
} from '../utils/assistantEffects';

export type ScreenId =
  | 'menu'
  | 'trabajo'
  | 'hoja'
  | 'cotizaciones'
  | 'taller'
  | 'notas'
  | 'modulacion'
  | 'vidrio'
  | 'inventario'
  | 'catalogo'
  | 'videos'
  | 'terminos'
  | 'privacidad'
  | 'admin';

interface TopBarProps {
  currentView: ScreenId;
  title: string;
  proActive: boolean;
  licencia: LicenciaState | null;
  trialExpiresAt: number | null;
  theme: ResolvedAppTheme;
  isOnline?: boolean;
  pendingSyncCount?: number;
  syncingOfflineQueue?: boolean;
  unreadMessagesCount?: number;
  onBack: () => void;
  onGoHome: () => void;
  onLogoClick?: () => void;
  onOpenPro: () => void;
  onOpenDrawer: () => void;
  onOpenCalculadora: () => void;
  onToggleTheme?: () => void;
  onRequestExit?: () => void;
  onOpenMessages?: () => void;
  onClickOfflineStatus?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  proActive,
  licencia,
  trialExpiresAt,
  theme,
  isOnline = true,
  pendingSyncCount = 0,
  syncingOfflineQueue = false,
  unreadMessagesCount = 0,
  onBack,
  onGoHome,
  onOpenPro,
  onOpenDrawer,
  onOpenCalculadora,
  onToggleTheme,
  onRequestExit,
  onOpenMessages,
  onClickOfflineStatus,
}) => {
  const isDark = theme === 'dark';
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    setNowTs(Date.now());
    const hasExpiry =
      (licencia?.active && typeof licencia.expiresAt === 'number' && licencia.expiresAt > Date.now()) ||
      (typeof trialExpiresAt === 'number' && trialExpiresAt > Date.now());
    if (!hasExpiry) return;
    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, [trialExpiresAt, licencia?.active, licencia?.expiresAt]);

  const paidLicenseActive = Boolean(
    licencia && licencia.active && licencia.planCode !== 'G' && isProActive(licencia, nowTs)
  );
  const badge = formatLicenseCountdownBadge(
    licencia && licencia.active ? licencia : null,
    trialExpiresAt,
    nowTs
  );
  const effectiveIsPro = badge.isPro || paidLicenseActive || proActive;
  const licChipText = badge.text;

  return (
    <header
      className={`sticky top-0 z-40 w-full max-w-[100vw] overflow-x-hidden box-border h-[62px] backdrop-blur-lg border-b transition-colors ${
        isDark
          ? 'metal-topbar-dark text-white'
          : 'bg-white/95 border-slate-300/90 text-slate-900 shadow-sm'
      }`}
    >
      <div className="w-full max-w-full lg:max-w-[1120px] mx-auto h-full px-1.5 sm:px-3.5 flex items-center justify-between gap-1 sm:gap-2 box-border">
        {/* Lado izquierdo: Botón regresar (←) en internas, o Logo AP + Título brillante */}
        <div
          className={`flex items-center gap-1 sm:gap-2 overflow-hidden ${
            currentView !== 'menu' ? 'shrink-0' : 'min-w-0 flex-1'
          }`}
        >
          {currentView !== 'menu' && (
            <button
              type="button"
              id="btn-top-back"
              onClick={onBack}
              aria-label="Volver un paso atrás"
              title="Regresar"
              className={`inline-flex items-center justify-center gap-1 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[36px] px-1.5 sm:px-2.5 py-1 rounded-[11px] border text-[12px] font-bold cursor-pointer whitespace-nowrap shrink-0 transition-transform active:scale-95 ${
                isDark
                  ? 'metal-icon-btn'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span className="hidden md:inline">Volver</span>
            </button>
          )}
          <div
            id="logo-ap"
            title="Aluminero Pro"
            aria-label="Logotipo Aluminero Pro"
            className={`p-0 border-0 bg-transparent rounded-[10px] shrink-0 select-none ${
              currentView !== 'menu' && (!isOnline || pendingSyncCount > 0) ? 'hidden sm:block' : ''
            }`}
          >
            <AlumineroProMetallicLogo size={32} className="block w-[28px] h-[28px] sm:w-[36px] sm:h-[36px]" />
          </div>
          {currentView === 'menu' && (
            <span
              id="title-ap"
              className={`min-w-0 block truncate p-0 font-extrabold text-[14.5px] sm:text-[18px] tracking-tight text-left whitespace-nowrap select-none ${
                isDark ? 'text-slate-50 drop-shadow-[0_1px_6px_rgba(56,189,248,0.28)]' : 'text-slate-900'
              }`}
            >
              Aluminero Pro
            </span>
          )}
        </div>

        {/* Lado derecho: Estado Offline / Cola Sync, Inicio (internas), Campana avisos, Calculadora, Estado PRO, Menú */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {!isOnline ? (
            <button
              type="button"
              id="topbar-offline-badge"
              role="status"
              aria-live="polite"
              onClick={onClickOfflineStatus}
              title={
                pendingSyncCount > 0
                  ? `Sin conexión a internet · ${pendingSyncCount} cotización(es) en cola para sincronizar`
                  : 'Sin conexión a internet · Modo offline activo'
              }
              aria-label={
                pendingSyncCount > 0
                  ? `Sin conexión a internet. ${pendingSyncCount} cotizaciones pendientes de sincronizar`
                  : 'Sin conexión a internet'
              }
              className="inline-flex items-center gap-1 min-h-[32px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 rounded-full border border-rose-300/90 bg-rose-600 text-white text-[10px] sm:text-[11.5px] font-extrabold shadow-[0_2px_10px_rgba(225,29,72,0.42)] whitespace-nowrap shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">Sin red</span>
              <span className="hidden sm:inline">Sin conexión</span>
              {pendingSyncCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[9.5px] font-black leading-tight">
                  {pendingSyncCount}
                </span>
              )}
            </button>
          ) : pendingSyncCount > 0 ? (
            <button
              type="button"
              id="topbar-pending-sync-badge"
              role="status"
              aria-live="polite"
              onClick={onClickOfflineStatus}
              title={
                syncingOfflineQueue
                  ? `Sincronizando ${pendingSyncCount} cotización(es)...`
                  : `${pendingSyncCount} cotización(es) pendiente(s) de sincronizar en la nube`
              }
              aria-label={
                syncingOfflineQueue
                  ? `Sincronizando ${pendingSyncCount} cotizaciones`
                  : `${pendingSyncCount} cotizaciones pendientes de sincronizar`
              }
              className={`inline-flex items-center gap-1 min-h-[32px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 rounded-full border text-[10px] sm:text-[11.5px] font-extrabold whitespace-nowrap shrink-0 cursor-pointer active:scale-95 transition-transform ${
                isDark
                  ? 'border-amber-300/80 bg-amber-500/25 text-amber-100 hover:bg-amber-500/35'
                  : 'border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              {syncingOfflineQueue ? (
                <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {syncingOfflineQueue ? 'Sincronizando' : 'Por sincronizar'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9.5px] font-black leading-tight">
                {pendingSyncCount}
              </span>
            </button>
          ) : null}

          {currentView !== 'menu' && (
            <button
              type="button"
              id="btn-top-home"
              onClick={onGoHome}
              aria-label="Ir directo al menú principal (Inicio)"
              title="Ir a Inicio"
              className={`inline-flex items-center justify-center gap-1 min-w-[32px] min-h-[32px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 rounded-[11px] border text-[11.5px] sm:text-[12px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                isDark
                  ? 'border-emerald-400/55 bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-100'
                  : 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
              </svg>
              <span className={!isOnline || pendingSyncCount > 0 ? 'hidden sm:inline' : ''}>Inicio</span>
            </button>
          )}

          {unreadMessagesCount > 0 && onOpenMessages && (
            <button
              type="button"
              id="btn-top-messages"
              onClick={onOpenMessages}
              aria-label={`Tienes ${unreadMessagesCount} aviso(s) sin leer`}
              title="Avisos del Administrador"
              className={`relative inline-flex items-center justify-center min-w-[34px] min-h-[34px] sm:min-h-[36px] px-2 rounded-[11px] border cursor-pointer shrink-0 transition-all active:scale-95 ${
                isDark
                  ? 'border-sky-400/60 bg-sky-500/20 text-sky-200 hover:bg-sky-500/30'
                  : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9.5px] font-extrabold flex items-center justify-center">
                {unreadMessagesCount}
              </span>
            </button>
          )}

          {onToggleTheme && (
            <button
              type="button"
              id="btn-top-theme-toggle"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className={`inline-flex items-center justify-center min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] px-2 py-1 rounded-[11px] border cursor-pointer shrink-0 transition-all active:scale-95 ${
                isDark
                  ? 'metal-icon-btn text-amber-300'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              {isDark ? (
                <Sun className="w-[16px] h-[16px]" aria-hidden="true" />
              ) : (
                <Moon className="w-[16px] h-[16px]" aria-hidden="true" />
              )}
            </button>
          )}

          <button
            type="button"
            id="btn-top-calculadora"
            onClick={onOpenCalculadora}
            aria-label="Abrir Calculadora Rápida"
            title="Calculadora Rápida"
            className={`inline-flex items-center justify-center gap-1.5 min-w-[34px] min-h-[34px] sm:min-h-[36px] px-2 py-1 rounded-[11px] border text-[12px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              isDark
                ? 'metal-icon-btn'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="2" width="16" height="20" rx="2.5" />
              <rect x="7.5" y="5.5" width="9" height="4" rx="1" />
              <line x1="8" y1="13" x2="8.01" y2="13" />
              <line x1="12" y1="13" x2="12.01" y2="13" />
              <line x1="16" y1="13" x2="16.01" y2="13" />
              <line x1="8" y1="17" x2="8.01" y2="17" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
              <line x1="16" y1="17" x2="16.01" y2="17" />
            </svg>
            <span className="hidden md:inline">Calculadora</span>
          </button>

          {/* Badge de estado + días/horas en verde esmeralda o azul (NUNCA amarillo) */}
          <button
            type="button"
            id="btn-top-lic"
            onClick={onOpenPro}
            className={`min-h-[32px] sm:min-h-[36px] px-2 sm:px-3 py-1 rounded-full border text-[10px] sm:text-[11.5px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              effectiveIsPro
                ? isDark
                  ? 'border-emerald-400/80 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_3px_12px_rgba(16,185,129,0.35)]'
                  : 'border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                : isDark
                  ? 'border-sky-400/75 bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-[0_3px_12px_rgba(37,99,235,0.32)]'
                  : 'border-blue-600 bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {licChipText}
          </button>

          <button
            type="button"
            id="btn-open-drawer"
            onClick={onOpenDrawer}
            aria-label="Abrir menú lateral"
            className={`min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] rounded-[11px] border inline-flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95 ${
              isDark
                ? 'metal-icon-btn'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

interface SideDrawerProps {
  open: boolean;
  proActive: boolean;
  isTrialActive?: boolean;
  licencia?: LicenciaState | null;
  deviceId: string;
  theme: ResolvedAppTheme;
  themePreference?: AppTheme;
  skin: AppSkin;
  skinVariant?: AppSkinVariant;
  cloudAccountEmail?: string | null;
  isCloudBackupEligible?: boolean;
  googleUserEmail?: string | null;
  googleAuthLoading?: boolean;
  googleAuthError?: string | null;
  pendingSyncCount?: number;
  onSelectTheme?: (theme: AppTheme) => void;
  onToggleTheme: () => void;
  onSelectSkin: (skin: AppSkin) => void;
  onSelectSkinVariant?: (variant: AppSkinVariant, targetSkin?: AppSkin) => void;
  onConnectGoogle?: () => Promise<void> | void;
  onDisconnectGoogle?: () => Promise<void> | void;
  onClearGoogleAuthError?: () => void;
  onClose: () => void;
  onOpenPro: () => void;
  onOpenCloudBackup: () => void;
  onOpenRecomendar: () => void;
  onOpenSugerencias: () => void;
  onOpenTutorial: () => void;
  onOpenFaq?: () => void;
  onOpenLegal: (doc: 'terminos' | 'privacidad' | 'deslinde') => void;
  showInstallApp?: boolean;
  onInstallApp?: () => void;
  pendingRemindersCount?: number;
  dueRemindersCount?: number;
  onOpenReminders?: () => void;
  onOpenCotizaciones?: () => void;
  onOpenVideos?: () => void;
  onOpenAdminSecret?: () => void;
  tallerOnboardingComplete?: boolean;
  canOrganizeHomeMenu?: boolean;
  homeReorderMode?: boolean;
  onToggleHomeReorderMode?: (enabled: boolean) => void;
  tallerNombre?: string;
  showFreeReferral3DaysPromo?: boolean;
  homePromoMode?: HomePromoCardMode;
  registeredReferralsCount?: number;
  onActivateWelcome3Days?: () => void;
  onOpenReferralGift?: () => void;
  onReferralShareFeedback?: () => void;
}

interface SkinOptionMeta {
  id: AppSkin;
  title: string;
  subtitle: string;
  tierBadge: string;
  previewBg: string;
  previewCardA: string;
  previewCardB: string;
  previewBorder: string;
  previewAccent: string;
}

const SKIN_OPTIONS: SkinOptionMeta[] = [
  {
    id: 'basica',
    title: 'Básica',
    subtitle: 'Pizarra oscura descansada con acento Azul Satinado y Terracota',
    tierBadge: 'Gratis y PRO',
    previewBg: '#0f1218',
    previewCardA: '#3b6ef5',
    previewCardB: '#181d27',
    previewBorder: '#e07a3c',
    previewAccent: '#3b6ef5',
  },
  {
    id: 'navidena',
    title: 'Navideña ❄️',
    subtitle: 'Azul noche profundo, filo dorado cálido y rojo vino elegante',
    tierBadge: 'Gratis y PRO',
    previewBg: '#0d1726',
    previewCardA: '#9e2a2b',
    previewCardB: '#132136',
    previewBorder: '#eab354',
    previewAccent: '#eab354',
  },
  {
    id: 'ejecutiva',
    title: 'Ejecutiva',
    subtitle: '4 acabados: Azul, Naranja, Verde y Negro Anodizado',
    tierBadge: 'Exclusiva Planes PRO',
    previewBg: '#0e1420',
    previewCardA: '#3b6ef5',
    previewCardB: '#181c26',
    previewBorder: '#3b6ef5',
    previewAccent: '#3b6ef5',
  },
  {
    id: 'industrial',
    title: 'Industrial PRO',
    subtitle: '6 acabados: Oro, Plata, Bronce, Verde, Champagne y Cristal Tintex',
    tierBadge: 'Exclusiva Planes PRO',
    previewBg: '#101513',
    previewCardA: '#30724c',
    previewCardB: '#181c26',
    previewBorder: '#3d8b5e',
    previewAccent: '#3d8b5e',
  },
];

export const SideDrawer: React.FC<SideDrawerProps> = ({
  open,
  proActive,
  isTrialActive = false,
  licencia = null,
  deviceId,
  theme,
  themePreference,
  skin,
  skinVariant = 'default',
  cloudAccountEmail = null,
  isCloudBackupEligible = false,
  googleUserEmail = null,
  googleAuthLoading = false,
  googleAuthError = null,
  pendingSyncCount = 0,
  onSelectTheme,
  onToggleTheme,
  onSelectSkin,
  onSelectSkinVariant,
  onConnectGoogle,
  onDisconnectGoogle,
  onClearGoogleAuthError,
  onClose,
  onOpenPro,
  onOpenCloudBackup,
  onOpenRecomendar,
  onOpenSugerencias,
  onOpenTutorial,
  onOpenFaq,
  onOpenLegal,
  showInstallApp = false,
  onInstallApp,
  pendingRemindersCount = 0,
  dueRemindersCount = 0,
  onOpenReminders,
  onOpenCotizaciones,
  onOpenVideos,
  onOpenAdminSecret,
  tallerOnboardingComplete = true,
  canOrganizeHomeMenu = false,
  homeReorderMode = false,
  onToggleHomeReorderMode,
  tallerNombre,
  showFreeReferral3DaysPromo = false,
  homePromoMode,
  registeredReferralsCount = 0,
  onActivateWelcome3Days,
  onOpenReferralGift,
  onReferralShareFeedback,
}) => {
  const effectivePromoMode: HomePromoCardMode =
    homePromoMode ?? (showFreeReferral3DaysPromo ? 'referral_5d' : 'hidden');
  const [skinsExpanded, setSkinsExpanded] = useState(false);
  const [avatarExpanded, setAvatarExpanded] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AssistantAvatarId>(() => loadSelectedAvatar());
  const [avatarVisible, setAvatarVisible] = useState<boolean>(() => loadAvatarVisible());
  const [avatarSoundEnabled, setAvatarSoundEnabled] = useState<boolean>(() => loadAvatarSoundEnabled());
  const [avatarTipsEnabled, setAvatarTipsEnabled] = useState<boolean>(() => loadAvatarTipsEnabled());
  const [promoFlyerExpanded, setPromoFlyerExpanded] = useState(true);
  const [missionExpanded, setMissionExpanded] = useState(false);
  const [lockedSkinPrompt, setLockedSkinPrompt] = useState<SkinOptionMeta | null>(null);
  const drawerBrandTapsRef = useRef<{ count: number; lastTs: number }>({ count: 0, lastTs: 0 });

  useEffect(() => {
    const onAvatarChange = (ev: Event) => {
      const detail = (ev as CustomEvent<AssistantAvatarId>).detail;
      if (detail) setSelectedAvatar(detail);
      else setSelectedAvatar(loadSelectedAvatar());
    };
    const onVisChange = (ev: Event) => {
      const detail = (ev as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') setAvatarVisible(detail);
      else setAvatarVisible(loadAvatarVisible());
    };
    const onSoundChange = (ev: Event) => {
      const detail = (ev as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') setAvatarSoundEnabled(detail);
      else setAvatarSoundEnabled(loadAvatarSoundEnabled());
    };
    const onTipsChange = (ev: Event) => {
      const detail = (ev as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') setAvatarTipsEnabled(detail);
      else setAvatarTipsEnabled(loadAvatarTipsEnabled());
    };
    window.addEventListener(AVATAR_EVENT_NAME, onAvatarChange);
    window.addEventListener(AVATAR_VISIBLE_EVENT_NAME, onVisChange);
    window.addEventListener(AVATAR_SOUND_EVENT_NAME, onSoundChange);
    window.addEventListener(AVATAR_TIPS_EVENT_NAME, onTipsChange);
    return () => {
      window.removeEventListener(AVATAR_EVENT_NAME, onAvatarChange);
      window.removeEventListener(AVATAR_VISIBLE_EVENT_NAME, onVisChange);
      window.removeEventListener(AVATAR_SOUND_EVENT_NAME, onSoundChange);
      window.removeEventListener(AVATAR_TIPS_EVENT_NAME, onTipsChange);
    };
  }, []);
  const drawerBrandTapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      drawerBrandTapsRef.current = { count: 0, lastTs: 0 };
      if (drawerBrandTapTimerRef.current !== null) {
        window.clearTimeout(drawerBrandTapTimerRef.current);
        drawerBrandTapTimerRef.current = null;
      }
    }
    return () => {
      if (drawerBrandTapTimerRef.current !== null) {
        window.clearTimeout(drawerBrandTapTimerRef.current);
        drawerBrandTapTimerRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const handleDrawerBrandSecretClick = () => {
    if (!onOpenAdminSecret) return;
    const now = Date.now();
    if (drawerBrandTapTimerRef.current !== null) {
      window.clearTimeout(drawerBrandTapTimerRef.current);
      drawerBrandTapTimerRef.current = null;
    }
    if (now - drawerBrandTapsRef.current.lastTs <= 2500) {
      drawerBrandTapsRef.current.count += 1;
    } else {
      drawerBrandTapsRef.current.count = 1;
    }
    drawerBrandTapsRef.current.lastTs = now;

    if (drawerBrandTapsRef.current.count >= 5) {
      drawerBrandTapsRef.current = { count: 0, lastTs: 0 };
      setLockedSkinPrompt(null);
      onOpenAdminSecret();
      return;
    }

    drawerBrandTapTimerRef.current = window.setTimeout(() => {
      drawerBrandTapsRef.current = { count: 0, lastTs: 0 };
      drawerBrandTapTimerRef.current = null;
    }, 2500);
  };

  const isDark = theme === 'dark';
  const currentSkinMeta = SKIN_OPTIONS.find((s) => s.id === skin) || SKIN_OPTIONS[0];
  const normalizedActiveVariant = normalizeSkinVariantForSkin(skin, skinVariant);
  const currentSkinVariantMeta = SKIN_VARIANTS_BY_SKIN[skin]?.find((v) => v.id === normalizedActiveVariant);

  const handleSkinTap = (option: SkinOptionMeta) => {
    const unlocked = isSkinUnlockedForLicense(option.id, licencia, proActive);
    if (!unlocked) {
      setLockedSkinPrompt(option);
      return;
    }
    setLockedSkinPrompt(null);
    onSelectSkin(option.id);
  };

  const handleVariantTap = (option: SkinOptionMeta, variantId: AppSkinVariant) => {
    const unlocked = isSkinUnlockedForLicense(option.id, licencia, proActive);
    if (!unlocked) {
      setLockedSkinPrompt(option);
      return;
    }
    setLockedSkinPrompt(null);
    if (onSelectSkinVariant) {
      onSelectSkinVariant(variantId, option.id);
    } else if (skin !== option.id) {
      onSelectSkin(option.id);
    }
  };

  const panelClass = isDark
    ? 'bg-gradient-to-b from-[#0A1A26] via-[#081520] to-[#07131B] text-white border-l border-[#4A6072]/75'
    : 'bg-white text-slate-900 border-l border-slate-200';
  const itemNeutralClass = isDark
    ? 'border-white/15 bg-white/5 hover:bg-white/15 text-white'
    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900';
  const subTextClass = isDark ? 'text-[#B0C4D4]' : 'text-slate-500';
  const dividerClass = isDark ? 'border-white/15' : 'border-slate-200';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Menú lateral de herramientas y configuración"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setLockedSkinPrompt(null);
          onClose();
        }
      }}
    >
      <div
        id="drawer-panel-surface"
        className={`w-full max-w-[340px] h-full p-5 flex flex-col gap-2.5 overflow-y-auto shadow-2xl relative ${panelClass}`}
      >
        <div className={`flex items-center justify-between pb-3 border-b ${dividerClass}`}>
          <button
            type="button"
            id="btn-drawer-brand-secret"
            onClick={handleDrawerBrandSecretClick}
            aria-label="Aluminero Pro Herramientas y Configuración"
            className="flex items-center gap-2.5 bg-transparent border-0 p-0 text-left select-none cursor-default focus:outline-none"
          >
            <AlumineroProMetallicLogo size={32} />
            <div>
              <div className={`font-extrabold text-[16px] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Aluminero Pro
              </div>
              <div className={`text-[11.5px] ${subTextClass}`}>
                Herramientas y Configuración
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setLockedSkinPrompt(null);
              onClose();
            }}
            aria-label="Cerrar menú lateral"
            className={`min-w-[38px] min-h-[38px] rounded-xl font-bold cursor-pointer border ${
              isDark ? 'metal-icon-btn' : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            ✕
          </button>
        </div>

        {/* 1. Apariencia / Tema (Modo Oscuro, Modo Claro, Seguir el sistema) */}
        <div
          id="drawer-theme-selector"
          role="radiogroup"
          aria-label="Tema de apariencia"
          className={`rounded-xl border p-2.5 shrink-0 ${
            isDark
              ? 'border-sky-400/25 bg-slate-950/35'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`text-[10.5px] font-extrabold uppercase tracking-wider ${subTextClass}`}>
              Tema de la aplicación
            </span>
            <span
              id="drawer-theme-active-badge"
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold ${
                isDark ? 'bg-white/10 text-sky-200' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {(themePreference ?? theme) === 'system'
                ? `Sistema (${isDark ? 'Oscuro' : 'Claro'})`
                : isDark
                  ? 'Oscuro'
                  : 'Claro'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'dark', label: 'Modo Oscuro', Icon: Moon },
                { id: 'light', label: 'Modo Claro', Icon: Sun },
                { id: 'system', label: 'Seguir el sistema', Icon: Monitor },
              ] as const
            ).map(({ id, label, Icon }) => {
              const selected = (themePreference ?? theme) === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  id={`btn-drawer-theme-${id}`}
                  onClick={() => {
                    if (onSelectTheme) {
                      onSelectTheme(id);
                    } else if (id !== theme) {
                      onToggleTheme();
                    }
                  }}
                  className={`min-h-[52px] px-1.5 py-2 rounded-lg border text-[11px] font-extrabold leading-tight cursor-pointer flex flex-col items-center justify-center gap-1 text-center transition-colors ${
                    selected
                      ? isDark
                        ? 'border-sky-400 bg-blue-600/90 text-white shadow-sm'
                        : 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : isDark
                        ? 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1.1 Configuración de Pantalla (Exclusivo Plan 1 Año PRO) */}
        {canOrganizeHomeMenu && onToggleHomeReorderMode && (
          <div
            id="drawer-screen-config-section"
            className={`rounded-xl border p-2.5 shrink-0 ${
              isDark
                ? 'border-emerald-400/35 bg-emerald-950/25'
                : 'border-emerald-200 bg-emerald-50/70'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider ${
                isDark ? 'text-emerald-300' : 'text-emerald-800'
              }`}>
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Configuración de Pantalla</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold ${
                  isDark ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40' : 'bg-emerald-600 text-white'
                }`}
              >
                1 Año PRO
              </span>
            </div>
            <button
              type="button"
              id="btn-drawer-organize-cards"
              role="switch"
              aria-checked={homeReorderMode}
              onClick={() => onToggleHomeReorderMode(!homeReorderMode)}
              className={`w-full min-h-[46px] px-3 py-2 rounded-lg border text-left cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                homeReorderMode
                  ? isDark
                    ? 'border-emerald-400/75 bg-emerald-600/30 text-white'
                    : 'border-emerald-500 bg-emerald-100 text-emerald-950'
                  : isDark
                    ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="block text-[13px] font-extrabold leading-tight">
                  Organizar apartados
                </span>
                <span className={`block text-[10.5px] leading-snug mt-0.5 ${subTextClass}`}>
                  {homeReorderMode
                    ? 'Edición activa: arrastra tus tarjetas en inicio'
                    : 'Desbloquea para mover tarjetas sin arrastres accidentales'}
                </span>
              </div>
              <span
                aria-hidden="true"
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                  homeReorderMode
                    ? 'bg-emerald-500 border-emerald-400'
                    : isDark
                      ? 'bg-slate-700 border-slate-500'
                      : 'bg-slate-300 border-slate-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    homeReorderMode ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>
        )}

        {/* 1.2 Selector rápido Básica vs Navideña */}
        <div className={`rounded-xl border p-2.5 shrink-0 ${isDark ? 'border-sky-400/25 bg-slate-950/35' : 'border-slate-200 bg-slate-50'}`}>
          <div className={`text-[10.5px] font-extrabold uppercase tracking-wider mb-1.5 ${subTextClass}`}>
            Acceso Rápido de Carátula
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-drawer-quick-azul"
              onClick={() => onSelectSkin('basica')}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-[12px] font-extrabold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                skin === 'basica'
                  ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                  : isDark
                    ? 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-300 shrink-0" aria-hidden="true" />
              <span>Básica</span>
            </button>
            <button
              type="button"
              id="btn-drawer-quick-navidena"
              onClick={() => onSelectSkin('navidena')}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-[12px] font-extrabold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                skin === 'navidena'
                  ? 'border-amber-400 bg-red-700 text-white shadow-sm'
                  : isDark
                    ? 'border-amber-400/35 bg-red-950/40 text-amber-100 hover:bg-red-900/50'
                    : 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shrink-0" aria-hidden="true" />
              <span>Navideña</span>
            </button>
          </div>
        </div>

        {/* 1.5 Carátulas / Apariencia (4 Temas Visuales Globales + Sub-variantes) */}
        <div
          className={`rounded-xl border overflow-hidden shrink-0 ${
            isDark ? 'border-sky-400/35 bg-slate-950/35' : 'border-blue-200 bg-blue-50/50'
          }`}
        >
          <button
            type="button"
            id="btn-drawer-caratulas"
            aria-expanded={skinsExpanded}
            onClick={() => setSkinsExpanded((prev) => !prev)}
            className={`w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
              isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-blue-100/60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Palette className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-300' : 'text-blue-600'}`} aria-hidden="true" />
              <div className="min-w-0">
                <span className="block text-[13.5px] font-extrabold leading-tight">
                  Carátulas / Apariencia
                </span>
                <span className={`block text-[11px] font-semibold ${isDark ? 'text-sky-200/90' : 'text-blue-700'}`}>
                  Activa: {currentSkinMeta.title}
                  {currentSkinVariantMeta ? ` · ${currentSkinVariantMeta.label}` : ''}
                </span>
              </div>
            </div>
            {skinsExpanded ? (
              <ChevronUp className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
            )}
          </button>

          {skinsExpanded && (
            <div
              id="drawer-caratulas-list"
              className={`px-2.5 pb-3 pt-1.5 border-t flex flex-col gap-2 ${dividerClass}`}
            >
              {SKIN_OPTIONS.map((opt) => {
                const unlocked = isSkinUnlockedForLicense(opt.id, licencia, proActive);
                const isSelected = skin === opt.id;
                const variants = SKIN_VARIANTS_BY_SKIN[opt.id] || [];
                const activeVariantForCard = isSelected
                  ? normalizeSkinVariantForSkin(opt.id, skinVariant)
                  : 'default';
                const activeSwatchObj = variants.find((v) => v.id === activeVariantForCard);
                const cardPreviewBg = activeSwatchObj?.previewBg || opt.previewBg;
                const cardPreviewCard = activeSwatchObj?.previewCard || opt.previewCardB;
                const cardPreviewHero = activeSwatchObj?.previewHero || opt.previewCardA;
                const cardPreviewAccent = activeSwatchObj?.swatchBg || opt.previewAccent;
                return (
                  <div
                    key={opt.id}
                    className={`w-full rounded-xl border transition-all ${
                      isSelected
                        ? isDark
                          ? 'border-sky-400 bg-sky-500/20 ring-1 ring-sky-400/70'
                          : 'border-blue-500 bg-blue-100/80 ring-1 ring-blue-400'
                        : unlocked
                          ? isDark
                            ? 'border-white/15 bg-white/5 hover:bg-white/10'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                          : isDark
                            ? 'border-amber-400/30 bg-slate-900/60 hover:bg-slate-900/80 opacity-90'
                            : 'border-slate-200 bg-slate-100/80 hover:bg-slate-100 opacity-90'
                    }`}
                  >
                    <button
                      type="button"
                      id={`btn-skin-${opt.id}`}
                      onClick={() => handleSkinTap(opt)}
                      className="w-full p-2.5 text-left cursor-pointer active:scale-[0.98] bg-transparent border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-11 h-11 rounded-lg p-1.5 flex flex-col justify-between shrink-0"
                          style={{
                            backgroundColor: isDark ? cardPreviewBg : '#F8FAFC',
                            border: `1.5px solid ${cardPreviewAccent}`,
                          }}
                          aria-hidden="true"
                        >
                          <div
                            className="h-2.5 w-full rounded-[3px]"
                            style={{
                              backgroundColor: cardPreviewHero,
                            }}
                          />
                          <div className="grid grid-cols-2 gap-1">
                            <span
                              className="h-3 rounded-[3px]"
                              style={{
                                backgroundColor: isDark ? cardPreviewCard : '#FFFFFF',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderLeft: `2.5px solid ${cardPreviewAccent}`,
                              }}
                            />
                            <span
                              className="h-3 rounded-[3px]"
                              style={{
                                backgroundColor: isDark ? cardPreviewCard : '#FFFFFF',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderLeft: `2.5px solid ${opt.id === 'basica' ? '#e07a3c' : cardPreviewAccent}`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`text-[13px] font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {opt.title}
                            </span>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold shrink-0">
                                <Check className="w-3 h-3" aria-hidden="true" />
                                Activa
                              </span>
                            ) : !unlocked ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold shrink-0">
                                <Lock className="w-3 h-3" aria-hidden="true" />
                                PRO
                              </span>
                            ) : null}
                          </div>
                          <p className={`m-0 mt-0.5 text-[10.5px] leading-snug ${subTextClass}`}>
                            {opt.subtitle}
                          </p>
                          <span className={`inline-block mt-1 text-[10px] font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            {opt.tierBadge}
                          </span>
                        </div>
                      </div>
                    </button>

                    {variants.length > 0 && (
                      <div
                        id={`skin-variants-${opt.id}`}
                        className={`px-2.5 pb-2.5 pt-2 border-t ${
                          isDark ? 'border-white/10' : 'border-slate-200'
                        }`}
                      >
                        <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${subTextClass}`}>
                          Acabado / Color ({variants.length}):
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {variants.map((variant) => {
                            const isVariantSelected = isSelected && activeVariantForCard === variant.id;
                            return (
                              <button
                                key={variant.id}
                                type="button"
                                id={`btn-skin-${opt.id}-variant-${variant.id}`}
                                title={variant.label}
                                aria-pressed={isVariantSelected}
                                onClick={() => handleVariantTap(opt, variant.id)}
                                className={`min-h-[34px] px-1.5 py-1 rounded-lg border text-[10.5px] leading-tight font-extrabold cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                                  isVariantSelected
                                    ? isDark
                                      ? 'border-white bg-white/15 text-white'
                                      : 'border-slate-900 bg-slate-900 text-white'
                                    : isDark
                                      ? 'border-white/15 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 border border-white/75"
                                  style={{ backgroundColor: variant.swatchBg }}
                                  aria-hidden="true"
                                />
                                <span className="whitespace-nowrap">{variant.label}</span>
                                {isVariantSelected && <Check className="w-3 h-3 shrink-0" aria-hidden="true" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {lockedSkinPrompt && (
                <div
                  id="drawer-skin-upgrade-prompt"
                  className={`mt-1 p-3 rounded-xl border text-left shadow-lg ${
                    isDark ? 'border-sky-400/60 bg-slate-950/95' : 'border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Crown className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <strong className={`block text-[12px] font-extrabold ${isDark ? 'text-sky-200' : 'text-slate-900'}`}>
                        Carátula bloqueada: {lockedSkinPrompt.title}
                      </strong>
                      <p className={`m-0 mt-1 text-[11px] leading-snug ${subTextClass}`}>
                        Disponible con{' '}
                        <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                          {getSkinPlanRequirementLabel(lockedSkinPrompt.id)}
                        </strong>
                        . Activa tu plan PRO para desbloquearla al instante.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          id="btn-drawer-skin-upgrade-pro"
                          onClick={() => {
                            setLockedSkinPrompt(null);
                            onOpenPro();
                          }}
                          className="flex-1 min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11.5px] cursor-pointer"
                        >
                          Activar PRO
                        </button>
                        <button
                          type="button"
                          onClick={() => setLockedSkinPrompt(null)}
                          className={`min-h-[36px] px-2.5 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer ${
                            isDark ? 'bg-white/10 hover:bg-white/20 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 1.6 Personaje Asistente Inteligente (7 personajes + switch visibilidad) */}
        <div
          id="drawer-assistant-character-section"
          className={`rounded-xl border overflow-hidden shrink-0 ${
            isDark ? 'border-sky-400/35 bg-slate-950/35' : 'border-blue-200 bg-blue-50/50'
          }`}
        >
          <button
            type="button"
            id="btn-drawer-assistant-toggle-accordion"
            aria-expanded={avatarExpanded}
            onClick={() => setAvatarExpanded((prev) => !prev)}
            className={`w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
              isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-blue-100/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 shrink-0 flex items-center justify-center" aria-hidden="true">
                <AssistantCharacterSvg
                  avatarId={selectedAvatar}
                  size={28}
                  skin={skin}
                  skinVariant={skinVariant}
                  santaHat={skin === 'navidena'}
                />
              </span>
              <div className="min-w-0">
                <span className="block text-[13.5px] font-extrabold leading-tight">
                  Personaje Asistente
                </span>
                <span className={`block text-[11px] font-semibold ${isDark ? 'text-sky-200/90' : 'text-blue-700'}`}>
                  {avatarVisible
                    ? `Activo: ${ASSISTANT_CHARACTERS.find((c) => c.id === selectedAvatar)?.label || 'Robot'}`
                    : 'Oculto en pantalla'}
                </span>
              </div>
            </div>
            {avatarExpanded ? (
              <ChevronUp className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
            )}
          </button>

          {avatarExpanded && (
            <div className={`px-2.5 pb-3 pt-2 border-t flex flex-col gap-2.5 ${dividerClass}`}>
              {/* Controles ordenados del Personaje Asistente antes de la cuadrícula */}
              <div className="flex flex-col gap-2">
                {/* 1. Switch Mostrar personaje asistente */}
                <button
                  type="button"
                  id="btn-drawer-avatar-visible-switch"
                  role="switch"
                  aria-checked={avatarVisible}
                  onClick={() => {
                    const next = !avatarVisible;
                    setAvatarVisible(next);
                    saveAvatarVisible(next);
                  }}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-left cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isDark
                      ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block text-[12px] font-extrabold leading-tight">
                      Mostrar personaje asistente
                    </span>
                    <span className={`block text-[10px] leading-snug mt-0.5 ${subTextClass}`}>
                      Arrastrable, con gestos y consejos del taller
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-colors ${
                      avatarVisible
                        ? 'bg-emerald-500 border-emerald-400'
                        : isDark
                          ? 'bg-slate-700 border-slate-500'
                          : 'bg-slate-300 border-slate-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        avatarVisible ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>

                {/* 2. Interruptor Silenciar / Activar sonidos del personaje */}
                <button
                  type="button"
                  id="btn-drawer-avatar-sound-switch"
                  role="switch"
                  aria-checked={avatarSoundEnabled}
                  onClick={() => {
                    const next = !avatarSoundEnabled;
                    setAvatarSoundEnabled(next);
                    saveAvatarSoundEnabled(next);
                    if (next) {
                      playAssistantSound(selectedAvatar, 'tap', true);
                    }
                  }}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-left cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isDark
                      ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {avatarSoundEnabled ? (
                      <Volume2 className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <span className="block text-[12px] font-extrabold leading-tight">
                        Sonidos interactivos
                      </span>
                      <span className={`block text-[10px] leading-snug mt-0.5 ${subTextClass}`}>
                        {avatarSoundEnabled
                          ? 'Activados al tocar, soltar o celebrar'
                          : 'Silenciados (sin efectos de audio)'}
                      </span>
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-colors ${
                      avatarSoundEnabled
                        ? 'bg-sky-500 border-sky-400'
                        : isDark
                          ? 'bg-slate-700 border-slate-500'
                          : 'bg-slate-300 border-slate-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        avatarSoundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>

                {/* 3. Interruptor Sugerencias y recordatorios automáticos */}
                <button
                  type="button"
                  id="btn-drawer-avatar-tips-switch"
                  role="switch"
                  aria-checked={avatarTipsEnabled}
                  onClick={() => {
                    const next = !avatarTipsEnabled;
                    setAvatarTipsEnabled(next);
                    saveAvatarTipsEnabled(next);
                  }}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-left cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isDark
                      ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {avatarTipsEnabled ? (
                      <Bell className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <BellOff className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <span className="block text-[12px] font-extrabold leading-tight">
                        Sugerencias y recordatorios automáticos
                      </span>
                      <span className={`block text-[10px] leading-snug mt-0.5 ${subTextClass}`}>
                        Avisar cotizaciones pendientes y guías de uso
                      </span>
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border transition-colors ${
                      avatarTipsEnabled
                        ? 'bg-amber-500 border-amber-400'
                        : isDark
                          ? 'bg-slate-700 border-slate-500'
                          : 'bg-slate-300 border-slate-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        avatarTipsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>
              </div>

              {/* Cuadrícula de los personajes 3D transparentes */}
              <div className={`text-[10px] font-extrabold uppercase tracking-wider pt-0.5 ${subTextClass}`}>
                Elige tu personaje ({ASSISTANT_CHARACTERS.length}):
              </div>
              <div
                id="drawer-avatar-grid"
                className="grid grid-cols-2 gap-1.5"
              >
                {ASSISTANT_CHARACTERS.map((char) => {
                  const isActiveChar = selectedAvatar === char.id;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      id={`btn-drawer-avatar-${char.id}`}
                      aria-pressed={isActiveChar}
                      onClick={() => {
                        setSelectedAvatar(char.id);
                        saveSelectedAvatar(char.id);
                        if (!avatarVisible) {
                          setAvatarVisible(true);
                          saveAvatarVisible(true);
                        }
                        if (avatarSoundEnabled) {
                          playAssistantSound(char.id, 'tap', true);
                        }
                      }}
                      className={`pt-3.5 pb-2.5 px-2.5 rounded-xl border text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors relative overflow-hidden ${
                        isActiveChar
                          ? isDark
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-blue-600 bg-blue-100 text-slate-900'
                          : isDark
                            ? 'border-white/15 bg-white/5 hover:bg-white/10 text-slate-200'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {isActiveChar && (
                        <Check
                          className="w-3.5 h-3.5 text-emerald-400 absolute top-2 right-2 z-10"
                          aria-hidden="true"
                        />
                      )}
                      <span className="w-16 h-16 p-0 shrink-0 flex items-center justify-center overflow-visible bg-transparent" aria-hidden="true">
                        <AssistantCharacterSvg
                          avatarId={char.id}
                          size={64}
                          skin={skin}
                          skinVariant={skinVariant}
                          santaHat={skin === 'navidena'}
                        />
                      </span>
                      <div className="min-w-0 w-full relative z-10">
                        <span className="block text-[11.5px] font-extrabold leading-tight truncate">
                          {char.label}
                        </span>
                        <span className={`block text-[9.5px] leading-tight truncate mt-0.5 ${subTextClass}`}>
                          {char.tagline}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 1.8 Flyer Promocional de Lanzamiento Desplegable con Animación de Flama */}
        <section
          id="drawer-launch-promo-flyer"
          aria-label="Promoción exclusiva de lanzamiento Aluminero Pro"
          className={`rounded-xl border-2 overflow-hidden shrink-0 ${
            isDark
              ? 'border-orange-500 bg-[#1B120C] text-white'
              : 'border-orange-500 bg-[#FFF7ED] text-slate-900'
          }`}
        >
          <button
            type="button"
            id="btn-drawer-promo-flyer-toggle"
            aria-expanded={promoFlyerExpanded}
            onClick={() => setPromoFlyerExpanded((prev) => !prev)}
            className="w-full px-3 py-2.5 bg-[#EA580C] hover:bg-[#DC4E07] text-white flex items-center justify-between gap-2 text-left cursor-pointer border-0 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="promo-flame-badge inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#7C2D12] text-amber-300 shrink-0"
                aria-hidden="true"
              >
                <Flame className="w-4 h-4 promo-flame-anim fill-amber-400 text-yellow-200" />
              </span>
              <div className="min-w-0">
                <span className="block text-[11px] font-black tracking-wide uppercase leading-tight text-white">
                  🔥 PROMOCIÓN EXCLUSIVA DE LANZAMIENTO
                </span>
                <span className="block text-[10.5px] font-bold text-orange-100 leading-tight mt-0.5">
                  {promoFlyerExpanded ? 'Toca para minimizar ofertas' : 'Hasta 50% OFF este mes · Ver planes'}
                </span>
              </div>
            </div>
            {promoFlyerExpanded ? (
              <ChevronUp className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
            )}
          </button>

          {promoFlyerExpanded && (
            <div id="drawer-launch-promo-body" className="p-3 flex flex-col gap-2.5">
              <p
                className={`m-0 text-[11.5px] font-extrabold leading-snug ${
                  isDark ? 'text-orange-100' : 'text-orange-950'
                }`}
              >
                ¡Aprovecha este mes hasta 50% de descuento antes de que suban a su precio regular!
              </p>

              {/* Plan 30 días */}
              <div
                className={`rounded-lg border p-2.5 flex flex-col gap-1.5 ${
                  isDark
                    ? 'border-orange-400/35 bg-[#261810]'
                    : 'border-orange-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11.5px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    PLAN 30 DÍAS PRO
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white text-[9.5px] font-black uppercase">
                    Lanzamiento
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[11.5px] line-through font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      $699 MXN
                    </span>
                    <span className={`text-[16px] font-black ${isDark ? 'text-amber-300' : 'text-orange-700'}`}>
                      $369 MXN
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-orange-200' : 'text-slate-600'}`}>
                    Precio Final
                  </span>
                </div>
                <a
                  href="https://mpago.la/2evqS3r"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="link-promo-plan-30"
                  className="w-full min-h-[34px] px-2.5 py-1.5 rounded-lg bg-[#009EE3] hover:bg-[#0089C7] text-white text-[11.5px] font-extrabold no-underline inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Pagar Plan 30 Días · $369</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </div>

              {/* Plan 90 días */}
              <div
                className={`rounded-lg border p-2.5 flex flex-col gap-1.5 ${
                  isDark
                    ? 'border-orange-400/35 bg-[#261810]'
                    : 'border-orange-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11.5px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    PLAN 90 DÍAS PRO
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9.5px] font-black uppercase">
                    -48% OFF
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[11.5px] line-through font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      $1,899 MXN
                    </span>
                    <span className={`text-[16px] font-black ${isDark ? 'text-amber-300' : 'text-orange-700'}`}>
                      $989 MXN
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-orange-200' : 'text-slate-600'}`}>
                    Precio Final
                  </span>
                </div>
                <a
                  href="https://mpago.la/2xXek7s"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="link-promo-plan-90"
                  className="w-full min-h-[34px] px-2.5 py-1.5 rounded-lg bg-[#009EE3] hover:bg-[#0089C7] text-white text-[11.5px] font-extrabold no-underline inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Pagar Plan 90 Días · $989</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </div>

              {/* Plan 1 Año PRO (Mejor Ahorro) */}
              <div
                className={`rounded-lg border-2 p-2.5 flex flex-col gap-1.5 ${
                  isDark
                    ? 'border-emerald-400 bg-[#0D2A20]'
                    : 'border-emerald-600 bg-[#ECFDF5]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`text-[11.5px] font-black tracking-tight ${isDark ? 'text-white' : 'text-emerald-950'}`}>
                    PLAN 1 AÑO PRO
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9.5px] font-black uppercase">
                    ¡MEJOR AHORRO!
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[11.5px] line-through font-bold ${isDark ? 'text-emerald-200/70' : 'text-slate-500'}`}>
                      $3,499 MXN
                    </span>
                    <span className={`text-[17px] font-black ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                      $1,799 MXN
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
                    Precio Final
                  </span>
                </div>
                <a
                  href="https://mpago.la/335TCqb"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="link-promo-plan-anual"
                  className="w-full min-h-[36px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-extrabold no-underline inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Pagar Plan 1 Año · $1,799</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </div>

              {/* Pie de contacto WhatsApp directo */}
              <a
                href="https://wa.me/527351631532"
                target="_blank"
                rel="noopener noreferrer"
                id="link-promo-whatsapp"
                className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white no-underline flex items-center justify-between gap-2 transition-colors"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="text-[11.5px] font-extrabold leading-tight">
                    Contáctanos por WhatsApp
                  </span>
                </span>
                <span className="text-[11.5px] font-black tracking-tight whitespace-nowrap bg-white/20 px-2 py-0.5 rounded">
                  735 163 1532
                </span>
              </a>
            </div>
          )}
        </section>

        {/* 2. Estado de Licencia PRO (con ID Equipo) */}
        <button
          type="button"
          id="btn-drawer-pro"
          onClick={onOpenPro}
          className={`w-full shrink-0 h-auto p-3.5 rounded-xl border text-left cursor-pointer ${
            proActive
              ? isDark
                ? 'border-emerald-400/50 bg-emerald-600/20 hover:bg-emerald-600/30 text-white'
                : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
              : isDark
                ? 'border-sky-400/50 bg-blue-600/20 hover:bg-blue-600/30 text-white'
                : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-950'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13.5px] font-extrabold leading-snug">
              {proActive ? '💎 Estado de Licencia PRO' : '⚡ Estado de Licencia PRO'}
            </span>
            <span
              className={`text-[11px] font-extrabold shrink-0 ${
                proActive
                  ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                  : isDark ? 'text-sky-300' : 'text-blue-700'
              }`}
            >
              {proActive ? (isTrialActive ? 'Prueba PRO' : 'Activa') : 'Gratuita'}
            </span>
          </div>
          <div className={`mt-1 text-[11.5px] leading-snug ${subTextClass}`}>
            ID Equipo: <strong className={`mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{deviceId}</strong>
          </div>
        </button>

        {/* 3. Respaldo y Cuenta en la Nube (Exclusivo 90 días y 1 año) */}
        <button
          type="button"
          id="btn-drawer-cloud-backup"
          onClick={onOpenCloudBackup}
          className={`w-full shrink-0 h-auto p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99] ${
            isDark
              ? 'btn-cloud-gold-shimmer border-sky-400/60 bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-emerald-500/20 hover:from-sky-500/30 text-white'
              : 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-slate-900'
          }`}
        >
          <div className="relative z-10 flex items-start justify-between gap-2">
            <span className="min-w-0 flex-1 text-[13.5px] font-extrabold leading-snug">
              ☁️ Respaldo y Cuenta en la Nube
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold shrink-0 whitespace-nowrap ${
                cloudAccountEmail
                  ? 'bg-emerald-600 text-white'
                  : isCloudBackupEligible
                    ? 'bg-blue-600 text-white'
                    : isDark
                      ? 'bg-sky-500/30 text-sky-100 border border-sky-300/50'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {cloudAccountEmail ? '✓ Activo' : isCloudBackupEligible ? 'Vincular' : '90d / 1 Año'}
            </span>
          </div>
          <div className={`relative z-10 mt-1 text-[11.5px] leading-snug break-words ${subTextClass}`}>
            {cloudAccountEmail
              ? cloudAccountEmail
              : isCloudBackupEligible
                ? 'Vincula tu correo para respaldo automático'
                : 'Recuperación por cambio o robo de celular'}
          </div>
          {pendingSyncCount > 0 && (
            <div className="relative z-10 mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[10.5px] font-extrabold">
              <CloudUpload className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{pendingSyncCount} cotización(es) en cola offline</span>
            </div>
          )}
        </button>

        {/* 3.5 Acceso Firebase con Google (signInWithPopup + fallback signInWithRedirect) */}
        {onConnectGoogle && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              id="btn-drawer-google-auth"
              disabled={googleAuthLoading}
              onClick={() => {
                if (googleUserEmail && onDisconnectGoogle) {
                  void onDisconnectGoogle();
                } else {
                  onConnectGoogle();
                }
              }}
              className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-[12.5px] font-extrabold text-left cursor-pointer flex items-center justify-between gap-2 transition-colors disabled:opacity-65 ${
                googleUserEmail
                  ? isDark
                    ? 'border-emerald-400/50 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-100'
                    : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
                  : isDark
                    ? 'border-white/25 bg-white text-slate-900 hover:bg-slate-100 shadow-sm'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900 shadow-xs'
              }`}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.14-4.06 1.14-3.12 0-5.77-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.1z" />
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.1c.95-2.84 3.6-4.95 6.72-4.95z" />
                </svg>
                <span className="min-w-0 flex flex-col">
                  <span className={googleUserEmail ? 'truncate' : 'leading-snug'}>
                    {googleAuthLoading
                      ? 'Conectando con Google...'
                      : googleUserEmail
                        ? googleUserEmail
                        : GOOGLE_CONNECT_CTA_LABEL}
                  </span>
                  {googleUserEmail && !googleAuthLoading && (
                    <span className="text-[10.5px] font-extrabold text-emerald-500 dark:text-emerald-300 leading-tight">
                      ● Nube Conectada
                    </span>
                  )}
                </span>
              </span>
              {(googleAuthLoading || googleUserEmail) && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                    googleUserEmail
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  {googleAuthLoading ? '...' : 'Salir'}
                </span>
              )}
            </button>

            {!googleUserEmail && (
              <p
                id="drawer-google-persuasive-tip"
                className={`m-0 px-2 py-1.5 rounded-lg border text-[11px] leading-snug font-bold ${
                  isDark
                    ? 'border-sky-400/35 bg-sky-950/45 text-sky-100'
                    : 'border-blue-200 bg-blue-50 text-slate-800'
                }`}
              >
                ☁️ {GOOGLE_CLOUD_PERSUASIVE_TIP}
              </p>
            )}
            <p
              id="drawer-google-benefit"
              className={`m-0 px-1 text-[11px] leading-snug font-semibold ${subTextClass}`}
            >
              {GOOGLE_CONNECT_BENEFIT_SUBTITLE}
            </p>

            {googleAuthError && (
              <div
                id="drawer-google-auth-error"
                role="alert"
                className="p-2.5 rounded-xl border border-rose-400/70 bg-rose-950/90 text-rose-100 text-[11px] font-semibold leading-snug flex items-start justify-between gap-2"
              >
                <span className="break-words">{googleAuthError}</span>
                {onClearGoogleAuthError && (
                  <button
                    type="button"
                    onClick={onClearGoogleAuthError}
                    aria-label="Cerrar aviso de Google"
                    className="text-rose-200 hover:text-white font-extrabold bg-transparent border-0 p-0.5 cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3.6 Tarjeta de bienvenida (3 días PRO) -> Bono referidos (+5 días PRO extra por 3 colegas) */}
        {effectivePromoMode !== 'hidden' && onOpenReferralGift && (
          <ReferralPromoBanner
            variant="drawer"
            mode={effectivePromoMode}
            deviceId={deviceId}
            tallerNombre={tallerNombre}
            registeredCount={registeredReferralsCount}
            isDark={isDark}
            onActivateWelcome3Days={onActivateWelcome3Days}
            onOpenGift={onOpenReferralGift}
            onShareFeedback={onReferralShareFeedback}
          />
        )}

        <div className={`pt-2 mt-1 border-t flex flex-col gap-2 ${dividerClass}`}>
          {/* 4. Recomendar App (QR) */}
          <button
            type="button"
            id="btn-drawer-recomendar"
            onClick={onOpenRecomendar}
            className={`flex items-center justify-between w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border text-[13.5px] font-extrabold text-left cursor-pointer transition-all active:scale-[0.99] ${
              isDark
                ? 'border-emerald-400/75 bg-gradient-to-r from-emerald-600/35 to-teal-600/35 hover:from-emerald-600/50 text-white'
                : 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
            }`}
          >
            <span>📲 Recomendar App (QR)</span>
            <span className="text-[16px] leading-none">›</span>
          </button>

          {/* 5. Sugerir Línea o Perfil */}
          <button
            type="button"
            id="btn-drawer-sugerencias"
            onClick={onOpenSugerencias}
            className={`flex items-center justify-between w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-[13px] font-extrabold text-left cursor-pointer ${itemNeutralClass}`}
          >
            <span>💬 Sugerir Línea o Perfil</span>
            <span>›</span>
          </button>

          {/* 5.5 Historial de Cotizaciones */}
          {onOpenCotizaciones && (
            <button
              type="button"
              id="btn-drawer-cotizaciones"
              onClick={onOpenCotizaciones}
              className={`flex items-center justify-between w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-[13px] font-extrabold text-left cursor-pointer ${itemNeutralClass}`}
            >
              <span>📋 Historial de Cotizaciones</span>
              <span>›</span>
            </button>
          )}

          {/* 5.6 Recordatorios Push de Cotizaciones */}
          {onOpenReminders && (
            <button
              type="button"
              id="btn-drawer-reminders"
              onClick={onOpenReminders}
              className={`flex items-center justify-between w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-[13px] font-extrabold text-left cursor-pointer ${itemNeutralClass}`}
            >
              <span>🔔 Recordatorios de Cotizaciones</span>
              <span className="inline-flex items-center gap-1.5 shrink-0">
                {pendingRemindersCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${
                      dueRemindersCount > 0
                        ? 'bg-rose-500 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {pendingRemindersCount}
                  </span>
                )}
                <span>›</span>
              </span>
            </button>
          )}

          {/* 5.7 Video Tutoriales */}
          {onOpenVideos && (
            <button
              type="button"
              id="btn-drawer-videos"
              onClick={onOpenVideos}
              className={`flex items-center justify-between w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-[13px] font-extrabold text-left cursor-pointer ${itemNeutralClass}`}
            >
              <span>🎬 Video Tutoriales</span>
              <span>›</span>
            </button>
          )}

          {/* 6. Tutorial Interactivo (Inicio Rápido + Optimizar Cortes y Vidrio 2D) */}
          <button
            type="button"
            id="btn-drawer-tutorial"
            onClick={onOpenTutorial}
            title="Abrir tutorial interactivo paso a paso y guía de optimización de cortes 2D"
            className={`flex items-center justify-between w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-[13px] font-bold text-left ${itemNeutralClass} cursor-pointer`}
          >
            <span>📖 Tutorial Interactivo y Cortes 2D</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <span>›</span>
            </span>
          </button>

          {/* 6.5 Ayuda y Preguntas Frecuentes */}
          {onOpenFaq && (
            <button
              type="button"
              id="btn-drawer-faq"
              onClick={onOpenFaq}
              title="Abrir respuestas rápidas de taller y preguntas frecuentes"
              className={`flex items-center justify-between gap-2 w-full min-h-[46px] px-3.5 py-2 rounded-xl border text-left cursor-pointer transition-colors ${
                isDark
                  ? 'border-sky-400/40 bg-sky-500/15 hover:bg-sky-500/25 text-white'
                  : 'border-blue-200 bg-blue-50/75 hover:bg-blue-100/80 text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <HelpCircle
                  className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-300' : 'text-blue-600'}`}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold leading-tight">
                    Ayuda y Preguntas Frecuentes
                  </span>
                  <span className={`block text-[10.5px] leading-snug ${subTextClass}`}>
                    Uso sin internet, marcas, precios y planes
                  </span>
                </span>
              </span>
              <span className="text-[15px] leading-none shrink-0">›</span>
            </button>
          )}

          {showInstallApp && onInstallApp && (
            <button
              type="button"
              id="btn-drawer-install-app"
              onClick={onInstallApp}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-emerald-500 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-extrabold cursor-pointer"
            >
              ⬇️ Instalar App (Sin internet)
            </button>
          )}
        </div>

        {/* Misión y Visión */}
        <div className={`pt-2 mt-1 border-t shrink-0 ${dividerClass}`}>
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-indigo-400/35 bg-slate-950/35' : 'border-slate-200 bg-slate-50'}`}>
            <button
              type="button"
              id="btn-drawer-mision-vision"
              aria-expanded={missionExpanded}
              onClick={() => setMissionExpanded((prev) => !prev)}
              className={`w-full min-h-[44px] px-3.5 py-2 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
                isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="text-[13px] font-extrabold leading-tight">
                🎯 Misión y Visión
              </span>
              {missionExpanded ? (
                <ChevronUp className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 opacity-70 shrink-0" aria-hidden="true" />
              )}
            </button>

            {missionExpanded && (
              <div
                id="drawer-mision-vision-panel"
                className={`px-3.5 pb-3.5 pt-2 border-t flex flex-col gap-3 text-[12px] leading-relaxed ${dividerClass}`}
              >
                <div className={`rounded-lg border p-2.5 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <strong className={`block text-[11px] uppercase tracking-wider font-extrabold mb-1 ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>
                    Misión
                  </strong>
                  <p className={`m-0 ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                    Facilitar y profesionalizar el trabajo diario de los aluminieros y vidrieros mediante una herramienta móvil rápida y precisa, que permita cotizar en obra, optimizar cortes de perfiles y reducir desperdicios para hacer cada proyecto más rentable.
                  </p>
                </div>
                <div className={`rounded-lg border p-2.5 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <strong className={`block text-[11px] uppercase tracking-wider font-extrabold mb-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    Visión
                  </strong>
                  <p className={`m-0 ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
                    Convertirnos en la aplicación indispensable y de mayor confianza para los profesionales del aluminio y vidrio en México y Latinoamérica, impulsando la modernización digital de cada taller desde la palma de su mano.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Apartado Legal y Versión */}
        <div className={`pt-3 mt-auto border-t flex flex-col gap-2 ${dividerClass}`}>
          <div className={`text-[10.5px] uppercase tracking-wider font-extrabold px-1 ${subTextClass}`}>
            Legal y Versión
          </div>
          <button
            type="button"
            id="btn-drawer-deslinde"
            onClick={() => onOpenLegal('deslinde')}
            className={`flex items-center justify-between w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-[12.5px] font-bold text-left cursor-pointer ${itemNeutralClass}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
              <span>Aviso Legal y Deslinde</span>
            </span>
            <span>›</span>
          </button>
          <button
            type="button"
            id="btn-drawer-terminos"
            onClick={() => onOpenLegal('terminos')}
            className={`flex items-center justify-between w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-[12.5px] font-bold text-left cursor-pointer ${itemNeutralClass}`}
          >
            <span>📜 Términos y Condiciones</span>
            <span>›</span>
          </button>
          <button
            type="button"
            id="btn-drawer-privacidad"
            onClick={() => onOpenLegal('privacidad')}
            className={`flex items-center justify-between w-full min-h-[42px] px-3.5 py-2 rounded-xl border text-[12.5px] font-bold text-left cursor-pointer ${itemNeutralClass}`}
          >
            <span>🛡️ Aviso de Privacidad</span>
            <span>›</span>
          </button>
          <div
            id="drawer-app-version"
            className={`pt-1 text-center text-[11px] font-bold mono ${subTextClass}`}
          >
            Aluminero Pro • v{APP_VERSION}
          </div>
        </div>
      </div>
    </div>
  );
};
