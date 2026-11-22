import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Crown, Lock, Palette } from 'lucide-react';
import { getTrialCountdown, isProActive } from '../utils/alumineroLogic';
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
        : 'Versión Gratuita';

  return (
    <header
      className={`sticky top-0 z-40 w-full max-w-[100vw] overflow-x-hidden box-border h-[62px] backdrop-blur-lg border-b transition-colors ${
        isDark
          ? 'metal-topbar-dark text-white'
          : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-sm'
      }`}
    >
      <div className="w-full max-w-full lg:max-w-[1120px] mx-auto h-full px-2.5 sm:px-3.5 flex items-center justify-between gap-2 box-border">
        {/* Lado izquierdo: Botón regresar (←) en extremo izquierdo junto al logo metálico AP */}
        <div className="min-w-0 flex-1 flex items-center gap-1.5 sm:gap-2 overflow-hidden">
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
          <button
            type="button"
            id="logo-ap"
            onClick={onLogoClick}
            title="Aluminero Pro"
            aria-label="Logotipo AP"
            className="p-0 border-0 bg-transparent cursor-pointer rounded-[10px] shrink-0 transition-transform active:scale-95"
          >
            <AlumineroProMetallicLogo size={36} className="block w-[34px] h-[34px] sm:w-[38px] sm:h-[38px]" />
          </button>
          {currentView === 'menu' && (
            <button
              type="button"
              id="title-ap"
              onClick={onLogoClick}
              title="Aluminero Pro"
              className={`min-w-0 flex-1 truncate block p-0 border-0 bg-transparent cursor-pointer font-extrabold text-[15.5px] sm:text-[18.5px] tracking-tight text-left ${
                isDark ? 'metal-brand-text' : 'text-slate-900'
              }`}
            >
              Aluminero Pro
            </button>
          )}
        </div>

        {/* Lado derecho: Inicio (internas), Calculadora metálica, píldora verde Versión Gratuita y Menú Hamburguesa */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
            className={`inline-flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] sm:min-h-[38px] px-2 sm:px-2.5 py-1 rounded-[11px] border text-[12px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              isDark
                ? 'metal-icon-btn'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
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
            className={`min-h-[34px] sm:min-h-[36px] px-3 sm:px-3.5 py-1 rounded-full border text-[11px] sm:text-[12px] max-[380px]:text-[10px] max-[380px]:px-2.5 max-[380px]:min-h-[30px] font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-all active:scale-95 ${
              paidLicenseActive
                ? isDark
                  ? 'metal-gold-pro-badge'
                  : 'border-amber-500 bg-amber-100 hover:bg-amber-200 text-amber-900'
                : isDark
                  ? 'metal-emerald-pill'
                  : chipIsGreen
                    ? 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                    : 'border-emerald-500 bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {licChipText}
          </button>

          <button
            type="button"
            id="btn-open-drawer"
            onClick={onOpenDrawer}
            aria-label="Abrir menú lateral"
            className={`min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] rounded-[11px] border inline-flex items-center justify-center cursor-pointer shrink-0 transition-all active:scale-95 ${
              isDark
                ? 'metal-icon-btn'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
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
  onOpenLegal: (doc: 'terminos' | 'privacidad') => void;
  showInstallApp?: boolean;
  onInstallApp?: () => void;
  pendingRemindersCount?: number;
  dueRemindersCount?: number;
  onOpenReminders?: () => void;
  onOpenCotizaciones?: () => void;
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
    title: 'Básica (Actual)',
    subtitle: 'Diseño plano oscuro #0B1120 de alto contraste',
    tierBadge: 'Gratis y Promo Colega',
    previewBg: '#0B1120',
    previewCardA: 'linear-gradient(135deg, #f97316, #ea580c)',
    previewCardB: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
    previewBorder: 'rgba(148, 163, 184, 0.35)',
    previewAccent: '#38bdf8',
  },
  {
    id: 'ejecutiva',
    title: 'Ejecutiva Azul (Intermedia)',
    subtitle: 'Azul acero metálico, bordes cian y acentos cobre',
    tierBadge: 'PRO 30d o 90d',
    previewBg: 'linear-gradient(145deg, #07152e, #0c234a)',
    previewCardA: 'linear-gradient(135deg, #163d75, #0f2c59)',
    previewCardB: 'linear-gradient(135deg, #142f5c, #0a1934)',
    previewBorder: 'rgba(56, 189, 248, 0.72)',
    previewAccent: '#f59e0b',
  },
  {
    id: 'industrial',
    title: 'Industrial Pro (Exclusiva)',
    subtitle: 'Aluminio cepillado, marcos plata/oro y detalles esmeralda',
    tierBadge: 'PRO Anual (1 Año)',
    previewBg: 'linear-gradient(145deg, #0b0f17, #1a212e)',
    previewCardA: 'linear-gradient(135deg, #064e3b, #1d2432)',
    previewCardB: 'linear-gradient(135deg, #272f3d, #121720)',
    previewBorder: 'rgba(212, 175, 55, 0.8)',
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
}) => {
  const [skinsExpanded, setSkinsExpanded] = useState(false);
  const [missionExpanded, setMissionExpanded] = useState(false);
  const [lockedSkinPrompt, setLockedSkinPrompt] = useState<SkinOptionMeta | null>(null);

  if (!open) return null;

  const isDark = theme === 'dark';
  const currentSkinMeta = SKIN_OPTIONS.find((s) => s.id === skin) || SKIN_OPTIONS[0];

  const handleSkinTap = (option: SkinOptionMeta) => {
    const unlocked = isSkinUnlockedForLicense(option.id, licencia, proActive);
    if (!unlocked) {
      setLockedSkinPrompt(option);
      return;
    }
    onSelectSkin(option.id);
  };

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
        className="w-full max-w-[340px] h-full bg-gradient-to-b from-[#0A1A26] via-[#081520] to-[#07131B] text-white border-l border-[#4A6072]/75 p-5 flex flex-col gap-2.5 overflow-y-auto shadow-2xl relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#4A6072]/45">
          <div className="flex items-center gap-2.5">
            <AlumineroProMetallicLogo size={32} />
            <div>
              <div className="font-extrabold text-[16px] tracking-tight metal-brand-text">Aluminero Pro</div>
              <div className="text-[11.5px] text-[#B0C4D4]">
                Herramientas y Configuración
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setLockedSkinPrompt(null);
              onClose();
            }}
            aria-label="Cerrar menú lateral"
            className="min-w-[38px] min-h-[38px] rounded-xl metal-icon-btn font-bold cursor-pointer"
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

        {/* 1.5 Carátulas / Apariencia (3 Temas Visuales Globales) */}
        <div className="rounded-xl border border-sky-400/35 bg-slate-950/35 overflow-hidden shrink-0">
          <button
            type="button"
            id="btn-drawer-caratulas"
            aria-expanded={skinsExpanded}
            onClick={() => setSkinsExpanded((prev) => !prev)}
            className="w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-left text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Palette className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <span className="block text-[13.5px] font-extrabold leading-tight">
                  Carátulas / Apariencia
                </span>
                <span className="block text-[11px] text-sky-200/90 truncate">
                  Activa: {currentSkinMeta.title}
                </span>
              </div>
            </div>
            {skinsExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
            )}
          </button>

          {skinsExpanded && (
            <div
              id="drawer-caratulas-list"
              className="px-2.5 pb-3 pt-1.5 border-t border-white/10 flex flex-col gap-2"
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
                        ? 'border-sky-400 bg-sky-500/20 ring-1 ring-sky-400/70'
                        : unlocked
                          ? 'border-white/15 bg-white/5 hover:bg-white/10'
                          : 'border-amber-400/30 bg-slate-900/60 hover:bg-slate-900/80 opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Miniatura visual fiel de la carátula */}
                      <div
                        className="w-12 h-12 rounded-lg p-1.5 flex flex-col justify-between shrink-0 shadow-inner"
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
                            className="h-3.5 rounded-[3px]"
                            style={{
                              background: opt.previewCardB,
                              border: `1px solid ${opt.previewBorder}`,
                            }}
                          />
                          <span
                            className="h-3.5 rounded-[3px]"
                            style={{
                              background: opt.previewCardB,
                              border: `1px solid ${opt.previewBorder}`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[12.5px] font-extrabold text-white leading-tight truncate">
                            {opt.title}
                          </span>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-[10px] font-extrabold shrink-0">
                              <Check className="w-3 h-3" aria-hidden="true" />
                              Activa
                            </span>
                          ) : !unlocked ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/25 border border-amber-400/50 text-amber-200 text-[10px] font-extrabold shrink-0">
                              <Lock className="w-3 h-3" aria-hidden="true" />
                              PRO
                            </span>
                          ) : null}
                        </div>
                        <p className="m-0 mt-0.5 text-[10.5px] text-slate-300 leading-snug">
                          {opt.subtitle}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-amber-200/90">
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
                  className="mt-1 p-3 rounded-xl border border-amber-400/60 bg-slate-950/95 text-left shadow-lg"
                >
                  <div className="flex items-start gap-2">
                    <Crown className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <strong className="block text-[12px] font-extrabold text-amber-200">
                        Carátula bloqueada: {lockedSkinPrompt.title}
                      </strong>
                      <p className="m-0 mt-1 text-[11px] text-slate-200 leading-snug">
                        Disponible exclusivamente con{' '}
                        <strong className="text-white">
                          {getSkinPlanRequirementLabel(lockedSkinPrompt.id)}
                        </strong>
                        . {isTrialActive ? 'La Promo Colega de 3 días incluye solo la carátula Básica.' : 'Mejora tu plan para activarla al instante en toda la app.'}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          id="btn-drawer-skin-upgrade-pro"
                          onClick={() => {
                            setLockedSkinPrompt(null);
                            onOpenPro();
                          }}
                          className="flex-1 min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11.5px] cursor-pointer"
                        >
                          Mejorar a PRO
                        </button>
                        <button
                          type="button"
                          onClick={() => setLockedSkinPrompt(null)}
                          className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-[11px] cursor-pointer"
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

        {/* Misión y Visión */}
        <div className="pt-2 mt-1 border-t border-white/15 shrink-0">
          <div className="rounded-xl border border-indigo-400/35 bg-slate-950/35 overflow-hidden">
            <button
              type="button"
              id="btn-drawer-mision-vision"
              aria-expanded={missionExpanded}
              onClick={() => setMissionExpanded((prev) => !prev)}
              className="w-full min-h-[46px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-left text-white hover:bg-white/10 cursor-pointer transition-colors"
            >
              <span className="text-[13.5px] font-extrabold leading-tight">
                🎯 Misión y Visión
              </span>
              {missionExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
              )}
            </button>

            {missionExpanded && (
              <div
                id="drawer-mision-vision-panel"
                className="px-3.5 pb-3.5 pt-2 border-t border-white/10 flex flex-col gap-3 text-[12px] leading-relaxed text-slate-200"
              >
                <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                  <strong className="block text-[11px] uppercase tracking-wider font-extrabold text-sky-300 mb-1">
                    Misión
                  </strong>
                  <p className="m-0 text-slate-100">
                    Facilitar y profesionalizar el trabajo diario de los aluminieros y vidrieros mediante una herramienta móvil rápida y precisa, que permita cotizar en obra, optimizar cortes de perfiles y reducir desperdicios para hacer cada proyecto más rentable.
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                  <strong className="block text-[11px] uppercase tracking-wider font-extrabold text-amber-300 mb-1">
                    Visión
                  </strong>
                  <p className="m-0 text-slate-100">
                    Convertirnos en la aplicación indispensable y de mayor confianza para los profesionales del aluminio y vidrio en México y Latinoamérica, impulsando la modernización digital de cada taller desde la palma de su mano.
                  </p>
                </div>
              </div>
            )}
          </div>
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
