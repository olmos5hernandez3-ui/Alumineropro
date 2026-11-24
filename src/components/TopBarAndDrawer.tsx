import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, ChevronDown, ChevronUp, Crown, Lock, LogOut, Palette, Scale } from 'lucide-react';
import {
  APP_VERSION,
  formatLicenseCountdownBadge,
  isProActive,
} from '../utils/alumineroLogic';
import {
  AppSkin,
  AppTheme,
  getSkinPlanRequirementLabel,
  isSkinUnlockedForLicense,
  LicenciaState,
} from '../utils/storageHelpers';
import { AlumineroProMetallicLogo } from './MetallicIcons';

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
  theme: AppTheme;
  unreadMessagesCount?: number;
  onBack: () => void;
  onGoHome: () => void;
  onLogoClick?: () => void;
  onOpenPro: () => void;
  onOpenDrawer: () => void;
  onOpenCalculadora: () => void;
  onRequestExit?: () => void;
  onOpenMessages?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  proActive,
  licencia,
  trialExpiresAt,
  theme,
  unreadMessagesCount = 0,
  onBack,
  onGoHome,
  onOpenPro,
  onOpenDrawer,
  onOpenCalculadora,
  onRequestExit,
  onOpenMessages,
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
        {/* Lado izquierdo: Botón regresar (←) en internas, o botón compacto Salir + Logo AP + Título brillante */}
        <div className="min-w-0 flex-1 flex items-center gap-1 sm:gap-2 overflow-hidden">
          {currentView !== 'menu' && (
            <button
              type="button"
              id="btn-top-back"
              onClick={onBack}
              aria-label="Volver un paso atrás"
              title="Regresar"
              className={`inline-flex items-center justify-center gap-1 min-w-[34px] min-h-[34px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 rounded-[11px] border text-[12px] font-bold cursor-pointer whitespace-nowrap shrink-0 transition-transform active:scale-95 ${
                isDark
                  ? 'metal-icon-btn'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            className="p-0 border-0 bg-transparent rounded-[10px] shrink-0 select-none"
          >
            <AlumineroProMetallicLogo size={32} className="block w-[30px] h-[30px] sm:w-[36px] sm:h-[36px]" />
          </div>
          {currentView === 'menu' && (
            <span
              id="title-ap"
              className={`min-w-0 truncate block p-0 font-extrabold text-[14px] sm:text-[18px] tracking-tight text-left select-none ${
                isDark ? 'text-white drop-shadow-[0_1px_6px_rgba(56,189,248,0.28)]' : 'text-slate-900'
              }`}
            >
              Aluminero Pro
            </span>
          )}
          {currentView === 'menu' && onRequestExit && (
            <button
              type="button"
              id="btn-top-salir"
              onClick={onRequestExit}
              title="Salir de Aluminero Pro"
              aria-label="Salir de la aplicación"
              className={`inline-flex items-center gap-0.5 min-h-[28px] px-1.5 sm:px-2 py-0.5 rounded-lg border text-[10px] sm:text-[10.5px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                isDark
                  ? 'border-slate-500/60 bg-slate-800/80 hover:bg-rose-600/30 hover:border-rose-400/60 text-slate-200'
                  : 'border-slate-300 bg-slate-100 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-700'
              }`}
            >
              <LogOut className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>Salir</span>
            </button>
          )}
        </div>

        {/* Lado derecho: Inicio (internas), Campana avisos, Calculadora, Estado PRO (verde/azul), Menú */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {currentView !== 'menu' && (
            <button
              type="button"
              id="btn-top-home"
              onClick={onGoHome}
              aria-label="Ir directo al menú principal (Inicio)"
              title="Ir a Inicio"
              className={`inline-flex items-center justify-center gap-1 min-h-[34px] sm:min-h-[36px] px-2.5 py-1 rounded-[11px] border text-[11.5px] sm:text-[12px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                isDark
                  ? 'border-emerald-400/55 bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-100'
                  : 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
              </svg>
              <span>Inicio</span>
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
  theme: AppTheme;
  skin: AppSkin;
  cloudAccountEmail?: string | null;
  isCloudBackupEligible?: boolean;
  onToggleTheme: () => void;
  onSelectSkin: (skin: AppSkin) => void;
  onClose: () => void;
  onOpenPro: () => void;
  onOpenCloudBackup: () => void;
  onOpenRecomendar: () => void;
  onOpenSugerencias: () => void;
  onOpenTutorial: () => void;
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
    subtitle: 'Tema Azul Básico de alto contraste',
    tierBadge: 'Gratis y PRO',
    previewBg: '#0B1120',
    previewCardA: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    previewCardB: 'linear-gradient(135deg, #1E293B, #0F172A)',
    previewBorder: 'rgba(148, 163, 184, 0.35)',
    previewAccent: '#38bdf8',
  },
  {
    id: 'ejecutiva',
    title: 'Ejecutiva Azul',
    subtitle: 'Azul acero metálico con reflejos cian',
    tierBadge: 'PRO 30d / 90d / 1 Año',
    previewBg: 'linear-gradient(145deg, #07152e, #0c234a)',
    previewCardA: 'linear-gradient(135deg, #163d75, #0f2c59)',
    previewCardB: 'linear-gradient(135deg, #142f5c, #0a1934)',
    previewBorder: 'rgba(56, 189, 248, 0.72)',
    previewAccent: '#38bdf8',
  },
  {
    id: 'industrial',
    title: 'Industrial Pro',
    subtitle: 'Tema Verde PRO esmeralda de taller',
    tierBadge: 'Prueba PRO (3d) y PRO',
    previewBg: 'linear-gradient(145deg, #071A13, #0B261C)',
    previewCardA: 'linear-gradient(135deg, #059669, #047857)',
    previewCardB: 'linear-gradient(135deg, #0F3025, #071813)',
    previewBorder: 'rgba(52, 211, 153, 0.78)',
    previewAccent: '#10b981',
  },
];

export const SideDrawer: React.FC<SideDrawerProps> = ({
  open,
  proActive,
  isTrialActive = false,
  licencia = null,
  deviceId,
  theme,
  skin,
  cloudAccountEmail = null,
  isCloudBackupEligible = false,
  onToggleTheme,
  onSelectSkin,
  onClose,
  onOpenPro,
  onOpenCloudBackup,
  onOpenRecomendar,
  onOpenSugerencias,
  onOpenTutorial,
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
}) => {
  const [skinsExpanded, setSkinsExpanded] = useState(false);
  const [missionExpanded, setMissionExpanded] = useState(false);
  const [lockedSkinPrompt, setLockedSkinPrompt] = useState<SkinOptionMeta | null>(null);
  const drawerBrandTapsRef = useRef<{ count: number; lastTs: number }>({ count: 0, lastTs: 0 });
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
  const verdeProUnlocked = isSkinUnlockedForLicense('industrial', licencia, proActive);

  const handleSkinTap = (option: SkinOptionMeta) => {
    const unlocked = isSkinUnlockedForLicense(option.id, licencia, proActive);
    if (!unlocked) {
      setLockedSkinPrompt(option);
      return;
    }
    setLockedSkinPrompt(null);
    onSelectSkin(option.id);
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

        {/* 1. Cambiar Tema (Modo Claro / Modo Oscuro) */}
        <button
          type="button"
          id="btn-drawer-theme"
          onClick={onToggleTheme}
          className={`flex items-center justify-between w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border text-[13.5px] font-extrabold text-left cursor-pointer transition-colors ${itemNeutralClass}`}
        >
          <span>{isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}</span>
          <span
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold ${
              isDark ? 'bg-white/15 text-sky-200' : 'bg-slate-200 text-slate-800'
            }`}
          >
            Actual: {isDark ? 'Oscuro' : 'Claro'}
          </span>
        </button>

        {/* 1.2 Selector rápido Azul Básico vs Verde PRO */}
        <div className={`rounded-xl border p-2.5 shrink-0 ${isDark ? 'border-emerald-400/30 bg-slate-950/35' : 'border-slate-200 bg-slate-50'}`}>
          <div className={`text-[10.5px] font-extrabold uppercase tracking-wider mb-1.5 ${subTextClass}`}>
            Color Principal
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-drawer-quick-azul"
              onClick={() => onSelectSkin('basica')}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-[12px] font-extrabold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                skin !== 'industrial'
                  ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                  : isDark
                    ? 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-sky-300 shrink-0" aria-hidden="true" />
              <span>Azul Básico</span>
            </button>
            <button
              type="button"
              id="btn-drawer-quick-verde"
              onClick={() => {
                if (!verdeProUnlocked) {
                  onClose();
                  onOpenPro();
                  return;
                }
                onSelectSkin('industrial');
              }}
              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-[12px] font-extrabold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                skin === 'industrial'
                  ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                  : isDark
                    ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {!verdeProUnlocked ? (
                <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 shrink-0" aria-hidden="true" />
              )}
              <span>Verde PRO</span>
            </button>
          </div>
        </div>

        {/* 1.5 Carátulas / Apariencia (3 Temas Visuales Globales) */}
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
                return (
                  <button
                    key={opt.id}
                    type="button"
                    id={`btn-skin-${opt.id}`}
                    onClick={() => handleSkinTap(opt)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
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
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-11 h-11 rounded-lg p-1.5 flex flex-col justify-between shrink-0 shadow-inner"
                        style={{
                          background: opt.previewBg,
                          border: `1.5px solid ${opt.previewBorder}`,
                        }}
                        aria-hidden="true"
                      >
                        <div
                          className="h-2.5 w-full rounded-[3px]"
                          style={{
                            background: opt.previewCardA,
                            borderTop: `1.5px solid ${opt.previewAccent}`,
                          }}
                        />
                        <div className="grid grid-cols-2 gap-1">
                          <span
                            className="h-3 rounded-[3px]"
                            style={{
                              background: opt.previewCardB,
                              border: `1px solid ${opt.previewBorder}`,
                            }}
                          />
                          <span
                            className="h-3 rounded-[3px]"
                            style={{
                              background: opt.previewCardB,
                              border: `1px solid ${opt.previewBorder}`,
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
        </button>

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

          {/* 6. Tutorial Interactivo (4 pasos — bloqueado hasta completar Mi Taller) */}
          <button
            type="button"
            id="btn-drawer-tutorial"
            disabled={!tallerOnboardingComplete}
            onClick={onOpenTutorial}
            title={
              tallerOnboardingComplete
                ? 'Abrir tutorial interactivo paso a paso'
                : 'Completa primero los datos de Mi Taller para desbloquear el tutorial'
            }
            className={`flex items-center justify-between w-full min-h-[44px] px-3.5 py-2 rounded-xl border text-[13px] font-bold text-left ${
              tallerOnboardingComplete
                ? `${itemNeutralClass} cursor-pointer`
                : 'border-slate-300/30 bg-slate-800/30 text-slate-400 opacity-65 cursor-not-allowed'
            }`}
          >
            <span>📖 Tutorial Interactivo (4 pasos)</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              {!tallerOnboardingComplete && (
                <span className="px-1.5 py-0.5 rounded bg-blue-600/25 text-[10px] font-extrabold">
                  🔒 Mi Taller
                </span>
              )}
              <span>›</span>
            </span>
          </button>

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
            Aluminero Pro · {APP_VERSION}
          </div>
        </div>
      </div>
    </div>
  );
};
