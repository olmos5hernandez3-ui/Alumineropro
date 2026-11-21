import React, { useEffect, useState } from 'react';
import { getTrialCountdown, isProActive } from '../utils/alumineroLogic';
import { AppTheme, LicenciaState } from '../utils/storageHelpers';

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
  | 'terminos'
  | 'privacidad';

interface TopBarProps {
  currentView: ScreenId;
  title: string;
  proActive: boolean;
  licencia: LicenciaState | null;
  trialExpiresAt: number | null;
  theme: AppTheme;
  onBack: () => void;
  onGoHome: () => void;
  onLogoClick: () => void;
  onOpenPro: () => void;
  onOpenDrawer: () => void;
  onOpenCalculadora: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  proActive,
  licencia,
  trialExpiresAt,
  theme,
  onBack,
  onGoHome,
  onLogoClick,
  onOpenPro,
  onOpenDrawer,
  onOpenCalculadora,
}) => {
  const isDark = theme === 'dark';
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  const effectiveExpiresAt =
    licencia && licencia.active && licencia.expiresAt !== null
      ? licencia.expiresAt
      : trialExpiresAt;

  useEffect(() => {
    setNowTs(Date.now());
    if (effectiveExpiresAt === null) return;
    if (Date.now() >= effectiveExpiresAt) return;
    const intervalId = window.setInterval(() => {
      const cur = Date.now();
      setNowTs(cur);
      if (cur >= effectiveExpiresAt) {
        window.clearInterval(intervalId);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [effectiveExpiresAt]);

  const licenseActiveNow = Boolean(licencia && licencia.active && isProActive(licencia, nowTs));
  const activeCountdown =
    effectiveExpiresAt !== null ? getTrialCountdown(effectiveExpiresAt, nowTs) : null;

  const chipIsGreen = licenseActiveNow || Boolean(activeCountdown?.active);
  const countdownSuffix =
    activeCountdown && activeCountdown.active
      ? activeCountdown.days > 0 || activeCountdown.hours > 0
        ? `${activeCountdown.days}d ${activeCountdown.hours}h`
        : `${Math.max(1, Math.ceil(activeCountdown.remainingMs / 60000))}m`
      : null;

  const licChipText = chipIsGreen
    ? countdownSuffix
      ? `Promo PRO · ${countdownSuffix}`
      : 'Promo PRO'
    : 'Versión Gratuita';

  return (
    <header
      className={`sticky top-0 z-40 w-full max-w-[100vw] overflow-x-hidden box-border h-[62px] backdrop-blur-lg border-b transition-colors ${
        isDark
          ? 'bg-[#071326]/85 border-sky-400/20 text-white shadow-lg shadow-slate-950/25'
          : 'bg-white/85 border-slate-200/90 text-slate-900 shadow-sm'
      }`}
    >
      <div className="w-full max-w-full lg:max-w-[1120px] mx-auto h-full px-2.5 sm:px-3 flex items-center justify-between gap-2 box-border">
        {/* Lado izquierdo: Botón regresar (←) en extremo izquierdo junto al logo AP */}
        <div className="min-w-0 flex-1 flex items-center gap-1.5 sm:gap-2 overflow-hidden">
          {currentView !== 'menu' && (
            <button
              type="button"
              id="btn-top-back"
              onClick={onBack}
              aria-label="Volver un paso atrás"
              title="Regresar"
              className={`inline-flex items-center justify-center gap-1 min-w-[34px] min-h-[34px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 rounded-[10px] border text-[12px] font-bold cursor-pointer whitespace-nowrap shrink-0 transition-transform active:scale-95 ${
                isDark
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
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
          <button
            type="button"
            id="logo-ap"
            onClick={onLogoClick}
            title="Aluminero Pro"
            aria-label="Logotipo AP"
            className="p-0 border-0 bg-transparent cursor-pointer rounded-[10px] shrink-0 shadow-md transition-transform active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="32" height="32" className="block w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-[8px] sm:rounded-[9px]">
              <rect width="512" height="512" rx="112" fill="#1D4ED8" />
              <rect x="22" y="22" width="468" height="468" rx="94" fill="#1E40AF" stroke="#60A5FA" strokeOpacity="0.45" strokeWidth="4" />
              <rect x="92" y="84" width="328" height="222" rx="18" fill="#0F172A" fillOpacity="0.25" stroke="#FFFFFF" strokeWidth="24" />
              <rect x="114" y="106" width="130" height="178" rx="4" fill="#60A5FA" fillOpacity="0.55" stroke="#FFFFFF" strokeWidth="6" />
              <rect x="268" y="106" width="130" height="178" rx="4" fill="#DBEAFE" fillOpacity="0.92" stroke="#FFFFFF" strokeWidth="6" />
              <rect x="245" y="96" width="22" height="198" rx="4" fill="#FFFFFF" />
              <rect x="148" y="328" width="216" height="102" rx="22" fill="#FFFFFF" />
              <text x="256" y="405" textAnchor="middle" fill="#1D4ED8" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="82" letterSpacing="6">
                AP
              </text>
            </svg>
          </button>
          {currentView === 'menu' && (
            <button
              type="button"
              id="title-ap"
              onClick={onLogoClick}
              title="Aluminero Pro"
              className={`min-w-0 flex-1 truncate block p-0 border-0 bg-transparent cursor-pointer font-extrabold text-[15px] sm:text-[18px] tracking-tight text-left ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Aluminero Pro
            </button>
          )}
        </div>

        {/* Lado derecho: Inicio (internas), Calculadora Rápida, Prueba PRO y Menú Hamburguesa */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentView !== 'menu' && (
            <button
              type="button"
              id="btn-top-home"
              onClick={onGoHome}
              aria-label="Ir directo al menú principal (Inicio)"
              title="Ir a Inicio"
              className={`inline-flex items-center justify-center gap-1 min-h-[34px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 rounded-[10px] border text-[11.5px] sm:text-[12px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                isDark
                  ? 'border-emerald-400/45 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100'
                  : 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
              </svg>
              <span>Inicio</span>
            </button>
          )}

          <button
            type="button"
            id="btn-top-calculadora"
            onClick={onOpenCalculadora}
            aria-label="Abrir Calculadora Rápida"
            title="Calculadora Rápida"
            className={`inline-flex items-center justify-center gap-1.5 min-w-[34px] min-h-[34px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 rounded-[10px] border text-[12px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              isDark
                ? 'border-sky-400/45 bg-sky-500/20 hover:bg-sky-500/30 text-sky-100'
                : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800'
            }`}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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

          <button
            type="button"
            id="btn-top-lic"
            onClick={onOpenPro}
            className={`min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3 py-1 rounded-full border text-[10.5px] sm:text-[12px] max-[380px]:text-[10px] max-[380px]:px-2 max-[380px]:min-h-[30px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              chipIsGreen
                ? isDark
                  ? 'border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200'
                  : 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                : isDark
                  ? 'border-amber-400/75 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200'
                  : 'border-amber-500 bg-amber-100 hover:bg-amber-200 text-amber-900'
            }`}
          >
            {licChipText}
          </button>

          <button
            type="button"
            id="btn-open-drawer"
            onClick={onOpenDrawer}
            aria-label="Abrir menú lateral"
            className={`min-w-[34px] min-h-[34px] sm:min-w-[38px] sm:min-h-[38px] rounded-[10px] border inline-flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95 ${
              isDark
                ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
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
  deviceId: string;
  theme: AppTheme;
  cloudAccountEmail?: string | null;
  isCloudBackupEligible?: boolean;
  onToggleTheme: () => void;
  onClose: () => void;
  onOpenPro: () => void;
  onOpenCloudBackup: () => void;
  onOpenRecomendar: () => void;
  onOpenSugerencias: () => void;
  onOpenTutorial: () => void;
  onOpenLegal: (doc: 'terminos' | 'privacidad') => void;
  showInstallApp?: boolean;
  onInstallApp?: () => void;
  pendingRemindersCount?: number;
  dueRemindersCount?: number;
  onOpenReminders?: () => void;
  onOpenCotizaciones?: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  open,
  proActive,
  isTrialActive = false,
  deviceId,
  theme,
  cloudAccountEmail = null,
  isCloudBackupEligible = false,
  onToggleTheme,
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
}) => {
  if (!open) return null;

  const isDark = theme === 'dark';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Menú lateral de herramientas y configuración"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[330px] h-full bg-[#0B2545] text-white border-l border-slate-400/20 p-5 flex flex-col gap-2.5 overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <div>
            <div className="font-extrabold text-[16px] tracking-tight">Aluminero Pro</div>
            <div className="text-[11.5px] text-slate-300">
              Herramientas y Configuración
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú lateral"
            className="min-w-[38px] min-h-[38px] rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 1. Cambiar Tema (Claro / Oscuro) */}
        <button
          type="button"
          id="btn-drawer-theme"
          onClick={onToggleTheme}
          className="flex items-center justify-between w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-white text-[13.5px] font-bold text-left cursor-pointer"
        >
          <span>{isDark ? '🌙 Cambiar Tema' : '☀️ Cambiar Tema'}</span>
          <span className="px-2.5 py-0.5 rounded-lg bg-white/15 text-[11.5px] font-extrabold">
            {isDark ? 'Oscuro' : 'Claro'}
          </span>
        </button>

        {/* 2. Estado de Licencia PRO (con ID Equipo) */}
        <button
          type="button"
          id="btn-drawer-pro"
          onClick={onOpenPro}
          className={`w-full shrink-0 h-auto p-3.5 rounded-xl border text-left cursor-pointer ${
            proActive
              ? 'border-emerald-400/40 bg-emerald-600/20 hover:bg-emerald-600/30'
              : 'border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13.5px] font-extrabold text-white leading-snug">
              {proActive ? '💎 Estado de Licencia PRO' : '⚡ Estado de Licencia PRO'}
            </span>
            <span className={`text-[11px] font-extrabold shrink-0 ${proActive ? 'text-emerald-300' : 'text-amber-300'}`}>
              {proActive ? (isTrialActive ? 'Prueba' : 'Activa') : 'Versión Gratuita'}
            </span>
          </div>
          <div className="mt-1 text-[11.5px] text-slate-200 leading-snug">
            ID Equipo: <strong className="mono text-white">{deviceId}</strong>
          </div>
        </button>

        {/* 3. Respaldo y Cuenta en la Nube (Exclusivo 90 días y 1 año) */}
        <button
          type="button"
          id="btn-drawer-cloud-backup"
          onClick={onOpenCloudBackup}
          className={`btn-cloud-gold-shimmer w-full shrink-0 h-auto p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99] ${
            cloudAccountEmail
              ? 'border-amber-300/80 bg-gradient-to-r from-amber-500/25 via-sky-500/20 to-amber-500/25 hover:from-amber-500/35 hover:via-sky-500/30 hover:to-amber-500/35'
              : isCloudBackupEligible
                ? 'border-amber-400/80 bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-600/25 hover:from-amber-500/35 hover:via-yellow-500/25 hover:to-amber-600/35'
                : 'border-amber-400/70 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 hover:from-amber-500/30 hover:via-yellow-500/20 hover:to-amber-600/30'
          }`}
        >
          <div className="relative z-10 flex items-start justify-between gap-2">
            <span className="min-w-0 flex-1 text-[13.5px] font-extrabold text-white leading-snug">
              ☁️ Respaldo y Cuenta en la Nube
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold shrink-0 whitespace-nowrap ${
                cloudAccountEmail
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  : isCloudBackupEligible
                    ? 'bg-sky-500/30 text-sky-100 border border-sky-400/40'
                    : 'bg-amber-500/30 text-amber-100 border border-amber-300/50'
              }`}
            >
              {cloudAccountEmail ? '✓ Activo' : isCloudBackupEligible ? 'Vincular' : '90d / 1 Año'}
            </span>
          </div>
          <div className="relative z-10 mt-1 text-[11.5px] text-amber-100/90 leading-snug break-words">
            {cloudAccountEmail
              ? cloudAccountEmail
              : isCloudBackupEligible
                ? 'Vincula tu correo para respaldo automático'
                : 'Recuperación por cambio o robo de celular'}
          </div>
        </button>

        <div className="pt-2 mt-1 border-t border-white/15 flex flex-col gap-2.5">
          {/* 4. Recomendar App (QR) */}
          <button
            type="button"
            id="btn-drawer-recomendar"
            onClick={onOpenRecomendar}
            className="btn-recomendar-shimmer flex items-center justify-between w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-emerald-400/80 bg-gradient-to-r from-emerald-600/35 via-emerald-500/25 to-teal-600/35 hover:from-emerald-600/50 hover:via-emerald-500/40 hover:to-teal-600/50 text-white text-[13.5px] font-extrabold text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span>📲 Recomendar App (QR)</span>
            </span>
            <span className="relative z-10 text-emerald-200 text-[16px] leading-none">›</span>
          </button>

          {/* 5. Sugerir Línea o Perfil */}
          <button
            type="button"
            id="btn-drawer-sugerencias"
            onClick={onOpenSugerencias}
            className="flex items-center justify-between w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-amber-400/45 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[13.5px] font-extrabold text-left cursor-pointer"
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
              className="flex items-center justify-between w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-indigo-400/45 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-100 text-[13.5px] font-extrabold text-left cursor-pointer"
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
              className="flex items-center justify-between w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-sky-400/45 bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 text-[13.5px] font-extrabold text-left cursor-pointer"
            >
              <span>🔔 Recordatorios de Cotizaciones</span>
              <span className="inline-flex items-center gap-1.5 shrink-0">
                {pendingRemindersCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${
                      dueRemindersCount > 0
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-sky-400/30 text-white border border-sky-300/40'
                    }`}
                  >
                    {pendingRemindersCount}
                  </span>
                )}
                <span>›</span>
              </span>
            </button>
          )}

          {/* 6. Tutorial */}
          <button
            type="button"
            id="btn-drawer-tutorial"
            onClick={onOpenTutorial}
            className="flex items-center justify-between w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-slate-100 text-[13.5px] font-bold text-left cursor-pointer"
          >
            <span>📖 Tutorial / ¿Cómo cotizar?</span>
            <span>›</span>
          </button>

          {showInstallApp && onInstallApp && (
            <button
              type="button"
              id="btn-drawer-install-app"
              onClick={onInstallApp}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-emerald-400/45 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-100 text-[13.5px] font-extrabold cursor-pointer"
            >
              ⬇️ Instalar App (Sin internet)
            </button>
          )}
        </div>

        {/* Apartado Legal al final del menú lateral */}
        <div className="pt-3 mt-auto border-t border-white/15 flex flex-col gap-2">
          <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 px-1">
            Legal
          </div>
          <button
            type="button"
            id="btn-drawer-terminos"
            onClick={() => onOpenLegal('terminos')}
            className="flex items-center justify-between w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-slate-200 text-[12.5px] font-bold text-left cursor-pointer"
          >
            <span>📜 Términos y Condiciones</span>
            <span>›</span>
          </button>
          <button
            type="button"
            id="btn-drawer-privacidad"
            onClick={() => onOpenLegal('privacidad')}
            className="flex items-center justify-between w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-slate-200 text-[12.5px] font-bold text-left cursor-pointer"
          >
            <span>🛡️ Aviso de Privacidad</span>
            <span>›</span>
          </button>
        </div>
      </div>
    </div>
  );
};
