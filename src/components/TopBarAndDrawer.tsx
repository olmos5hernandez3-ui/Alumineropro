import React, { useEffect, useState } from 'react';
import { getTrialCountdown, isProActive } from '../utils/alumineroLogic';
import { AppTheme, LicenciaState } from '../utils/storageHelpers';

export type ScreenId =
  | 'menu'
  | 'trabajo'
  | 'hoja'
  | 'taller'
  | 'notas'
  | 'modulacion'
  | 'vidrio'
  | 'inventario'
  | 'catalogo';

interface TopBarProps {
  currentView: ScreenId;
  title: string;
  proActive: boolean;
  licencia: LicenciaState | null;
  trialExpiresAt: number | null;
  theme: AppTheme;
  onBack: () => void;
  onLogoClick: () => void;
  onOpenPro: () => void;
  onOpenDrawer: () => void;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  title,
  proActive,
  licencia,
  trialExpiresAt,
  theme,
  onBack,
  onLogoClick,
  onOpenPro,
  onOpenDrawer,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    setNowTs(Date.now());
    if (trialExpiresAt === null) return;
    if (Date.now() >= trialExpiresAt) return;
    const intervalId = window.setInterval(() => {
      const cur = Date.now();
      setNowTs(cur);
      if (cur >= trialExpiresAt) {
        window.clearInterval(intervalId);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [trialExpiresAt]);

  const paidLicenseActive = Boolean(
    licencia && licencia.active && licencia.planCode !== 'G' && isProActive(licencia, nowTs)
  );
  const trialCountdown =
    !paidLicenseActive && trialExpiresAt !== null ? getTrialCountdown(trialExpiresAt, nowTs) : null;

  const chipIsGreen = paidLicenseActive || Boolean(trialCountdown?.active);
  const licChipText = paidLicenseActive
    ? `PRO · ${licencia?.planLabel?.split(' ')[0] || 'Activo'}`
    : trialCountdown?.active
      ? trialCountdown.label
      : proActive
        ? `PRO · ${licencia?.planLabel?.split(' ')[0] || 'Activo'}`
        : 'Activar PRO';

  return (
    <header
      className={`sticky top-0 z-40 h-[62px] backdrop-blur-lg border-b transition-colors ${
        isDark
          ? 'bg-[#071326]/85 border-sky-400/20 text-white shadow-lg shadow-slate-950/25'
          : 'bg-white/85 border-slate-200/90 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-[1120px] mx-auto h-full px-3 sm:px-4 flex items-center justify-between gap-2">
        <div className={`flex items-center gap-2 ${currentView === 'menu' ? 'shrink-0' : 'min-w-0 flex-1'}`}>
          {currentView !== 'menu' && (
            <button
              type="button"
              id="btn-top-back"
              onClick={onBack}
              aria-label="Volver a la pantalla anterior"
              className={`inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-[10px] border text-[12.5px] font-bold cursor-pointer whitespace-nowrap shrink-0 transition-transform active:scale-95 ${
                isDark
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span className="hidden sm:inline">Volver</span>
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="34" height="34" className="block rounded-[10px]">
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
          <button
            type="button"
            id="title-ap"
            onClick={onLogoClick}
            title="Aluminero Pro"
            className={`p-0 border-0 bg-transparent cursor-pointer font-extrabold text-[15.5px] sm:text-[18px] tracking-tight whitespace-nowrap text-left ${
              currentView === 'menu' ? 'shrink-0' : 'truncate'
            } ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {currentView === 'menu' ? 'Aluminero Pro' : title}
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            id="btn-top-theme"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro (alta visibilidad bajo el sol)' : 'Cambiar a modo oscuro ejecutivo'}
            title={isDark ? 'Modo Claro (Día en obra)' : 'Modo Oscuro (Ejecutivo)'}
            className={`min-w-[36px] min-h-[36px] px-2 rounded-[11px] border inline-flex items-center justify-center gap-1 text-[12px] font-bold cursor-pointer shrink-0 transition-all active:scale-95 ${
              isDark
                ? 'border-amber-300/35 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
            <span className="hidden md:inline">{isDark ? 'Día' : 'Noche'}</span>
          </button>

          <button
            type="button"
            id="btn-top-lic"
            onClick={onOpenPro}
            className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-full border text-[11px] sm:text-[12px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
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
            className={`min-w-[38px] min-h-[38px] rounded-[11px] border inline-flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95 ${
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
  onToggleTheme: () => void;
  onClose: () => void;
  onOpenPro: () => void;
  onOpenRecomendar: () => void;
  onOpenSugerencias: () => void;
  onOpenCalculadora: () => void;
  onOpenTutorial: () => void;
  onOpenLegal: (doc: 'terminos' | 'privacidad') => void;
  showInstallApp?: boolean;
  onInstallApp?: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  open,
  proActive,
  isTrialActive = false,
  deviceId,
  theme,
  onToggleTheme,
  onClose,
  onOpenPro,
  onOpenRecomendar,
  onOpenSugerencias,
  onOpenCalculadora,
  onOpenTutorial,
  onOpenLegal,
  showInstallApp = false,
  onInstallApp,
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

        {/* 1. Calculadora Rápida */}
        <button
          type="button"
          id="btn-drawer-calculadora"
          onClick={() => {
            onClose();
            onOpenCalculadora();
          }}
          className="flex items-center justify-between w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-sky-400/35 bg-sky-500/15 hover:bg-sky-500/25 text-sky-100 text-[13.5px] font-bold text-left cursor-pointer"
        >
          <span>🧮 Calculadora Rápida</span>
          <span>›</span>
        </button>

        {/* 2. Cambiar Tema (Claro/Oscuro) */}
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

        {/* 3. Estado de Licencia PRO (con ID Equipo) */}
        <button
          type="button"
          id="btn-drawer-pro"
          onClick={() => {
            onClose();
            onOpenPro();
          }}
          className={`w-full p-3.5 rounded-xl border text-left cursor-pointer ${
            proActive
              ? 'border-emerald-400/40 bg-emerald-600/20 hover:bg-emerald-600/30'
              : 'border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13.5px] font-extrabold text-white">
              {proActive ? '💎 Estado de Licencia PRO' : '⚡ Estado de Licencia PRO'}
            </span>
            <span className={`text-[11px] font-extrabold ${proActive ? 'text-emerald-300' : 'text-amber-300'}`}>
              {proActive ? (isTrialActive ? 'Prueba' : 'Activa') : 'Activar PRO'}
            </span>
          </div>
          <div className="mt-1 text-[11.5px] text-slate-200">
            ID Equipo: <strong className="mono text-white">{deviceId}</strong>
          </div>
        </button>

        <div className="pt-2 mt-1 border-t border-white/15 flex flex-col gap-2.5">
          {/* 4. Recomendar App (QR) */}
          <button
            type="button"
            id="btn-drawer-recomendar"
            onClick={() => {
              onClose();
              onOpenRecomendar();
            }}
            className="flex items-center justify-between w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-blue-300/30 bg-blue-500/15 hover:bg-blue-500/25 text-sky-100 text-[13.5px] font-bold text-left cursor-pointer"
          >
            <span>📲 Recomendar App (QR)</span>
            <span>›</span>
          </button>

          {/* 5. Sugerir Línea o Perfil */}
          <button
            type="button"
            id="btn-drawer-sugerencias"
            onClick={() => {
              onClose();
              onOpenSugerencias();
            }}
            className="flex items-center justify-between w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-amber-400/45 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-[13.5px] font-extrabold text-left cursor-pointer"
          >
            <span>💬 Sugerir Línea o Perfil</span>
            <span>›</span>
          </button>

          {/* 6. Tutorial */}
          <button
            type="button"
            id="btn-drawer-tutorial"
            onClick={() => {
              onClose();
              onOpenTutorial();
            }}
            className="flex items-center justify-between w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-slate-100 text-[13.5px] font-bold text-left cursor-pointer"
          >
            <span>📖 Tutorial / ¿Cómo cotizar?</span>
            <span>›</span>
          </button>

          {showInstallApp && onInstallApp && (
            <button
              type="button"
              id="btn-drawer-install-app"
              onClick={() => {
                onClose();
                onInstallApp();
              }}
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
            onClick={() => {
              onClose();
              onOpenLegal('terminos');
            }}
            className="flex items-center justify-between w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-slate-200 text-[12.5px] font-bold text-left cursor-pointer"
          >
            <span>📜 Términos y Condiciones</span>
            <span>›</span>
          </button>
          <button
            type="button"
            id="btn-drawer-privacidad"
            onClick={() => {
              onClose();
              onOpenLegal('privacidad');
            }}
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
