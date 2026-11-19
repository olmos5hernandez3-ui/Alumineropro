import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Eye, EyeOff } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildDailyUsageSeries30d,
  CATALOGO_PERFILES,
  CloudDeviceRecord,
  generateActivationKey,
  getOfficialShareUrl,
  getTrialCountdown,
  LineaId,
  LINEAS_CONFIG,
  PerfilCatalogoId,
  PLANS,
  TrabajoParams,
  UsageStats30d,
  validateActivationKey,
  verifyAdminPassword,
  verifyRecoveryPin,
} from '../utils/alumineroLogic';
import {
  resetAdminPasswordWithServer,
  verifyAdminPasswordWithServer,
} from '../utils/cloudSync';
import {
  AdminKeyRecord,
  AlumineroBackupPayload,
  clearLegacyAdminKeys,
  compressImageToDataUrl,
  dataUrlToJpegFile,
  FormulaPersonalizada,
  LicenciaState,
  loadAdminPasswordOverride,
  openExternalLinkSafe,
  parseBackupPayload,
  sanitizeWhatsappNumber,
  saveAdminPasswordOverride,
  TrabajoAntesDespuesItem,
  triggerFileDownload,
} from '../utils/storageHelpers';
import { PerfilSectionSvg } from './PerfilSectionSvg';
import { PhotoPickerButtons } from './PhotoPickerButtons';

/* ==================== MODAL PRO (Solo planes de pago: $329, $799 y $1,499 MXN) ==================== */
interface ProModalProps {
  open: boolean;
  deviceId: string;
  licencia: LicenciaState | null;
  proActive: boolean;
  trialExpiresAt?: number | null;
  onClose: () => void;
  onActivateLic: (lic: LicenciaState) => void;
  onDeactivateLic: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const ProModal: React.FC<ProModalProps> = ({
  open,
  deviceId,
  licencia,
  proActive,
  trialExpiresAt = null,
  onClose,
  onActivateLic,
  onDeactivateLic,
  onShowToast,
}) => {
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(1);
  const [keyInput, setKeyInput] = useState('');

  if (!open) return null;

  const publicPlans = PLANS.filter((p) => !p.adminOnly);
  const trialInfo =
    trialExpiresAt !== null && (!licencia || !licencia.active || licencia.planCode === 'G')
      ? getTrialCountdown(trialExpiresAt, Date.now())
      : null;

  const handleActivate = () => {
    const res = validateActivationKey(deviceId, keyInput);
    if (!res.ok || !res.plan) {
      onShowToast(res.error || 'Clave inválida');
      return;
    }
    const now = Date.now();
    onActivateLic({
      active: true,
      planCode: res.customDays ? `D${res.customDays}` : res.plan.code,
      planLabel: res.plan.label,
      expiresAt: res.plan.ms === null ? null : now + res.plan.ms,
      activatedAt: now,
    });
    setKeyInput('');
    onShowToast(`Licencia PRO activada (${res.plan.label})`, true);
    onClose();
  };

  return (
    <div
      id="modal-pro"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Licencia Aluminero Pro"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="m-0 text-[18px] font-extrabold">Estado de Licencia PRO</h2>
            <p className="m-0 text-[12px] text-slate-500">
              Aluminero Pro · Desbloquea Fijo 3", Guillotina, Abatible, Banderola, Oscilobatiente, Plegable, Cancel Baño, Mosquiteros, Puertas e Inventario
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal PRO"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <div>
            <span className="block text-[11px] font-bold text-slate-500">ID DE TU EQUIPO</span>
            <strong className="mono text-[15px] text-blue-700">{deviceId}</strong>
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(deviceId).catch(() => {});
              onShowToast('ID de equipo copiado');
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-bold cursor-pointer"
          >
            Copiar ID
          </button>
        </div>

        {proActive && licencia ? (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[12.5px]">
            <strong className="block">✓ Licencia Activa: {licencia.planLabel}</strong>
            <span>
              {licencia.expiresAt === null
                ? 'Vigencia vitalicia'
                : `Vence: ${new Date(licencia.expiresAt).toLocaleString('es-MX')}`}
            </span>
            <div className="mt-2">
              <button
                type="button"
                onClick={onDeactivateLic}
                className="text-[11.5px] font-bold text-red-700 underline cursor-pointer"
              >
                Desactivar licencia en este equipo
              </button>
            </div>
          </div>
        ) : trialInfo?.active ? (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[12.5px]">
            <strong className="block">⏳ {trialInfo.label} (Prueba gratuita de 3 días)</strong>
            <span>
              Acceso completo habilitado durante 72 horas desde tu primer uso. Vence:{' '}
              {new Date(trialExpiresAt!).toLocaleString('es-MX')}
            </span>
          </div>
        ) : (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[12.5px]">
            <strong className="block">⚠️ Tu prueba gratuita de 3 días finalizó</strong>
            <span>Elige un plan e ingresa tu clave de activación para continuar con las funciones PRO.</span>
          </div>
        )}

        <div id="pro-planes-grid" className="grid grid-cols-1 gap-2 mt-3">
          {publicPlans.map((p) => {
            const sel = selectedPlanIdx === p.idx;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => setSelectedPlanIdx(p.idx)}
                className={`flex items-center justify-between p-3 rounded-xl border-[1.5px] text-left cursor-pointer ${
                  sel ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <strong className="block text-[13.5px]">{p.label}</strong>
                  <span className="text-[11.5px] text-slate-500">Acceso total en este equipo</span>
                </div>
                <strong className="mono text-[14px] text-blue-700">{p.price}</strong>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <label htmlFor="inp-lic-key" className="block text-[12px] font-bold text-slate-600 mb-1">
            ¿Ya tienes tu clave de activación?
          </label>
          <div className="flex gap-2">
            <input
              id="inp-lic-key"
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
              placeholder="AP-M-XXXXXX o AP-D18-XXXXXX"
              className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[13.5px] font-bold uppercase"
            />
            <button
              type="button"
              onClick={handleActivate}
              className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] cursor-pointer"
            >
              Activar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================== MODAL SEGURIDAD ADMINISTRADOR ==================== */
interface AdminAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState<'login' | 'pin' | 'new-password'>('login');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);
  const newPwdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      clearLegacyAdminKeys();
      setStep('login');
      setPassword('');
      setShowPassword(false);
      setRecoveryPin('');
      setNewPassword('');
      setShowNewPassword(false);
      setErrorMsg('');
      setInfoMsg('');
      setSubmitting(false);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    } else {
      setStep('login');
      setPassword('');
      setShowPassword(false);
      setRecoveryPin('');
      setNewPassword('');
      setShowNewPassword(false);
      setErrorMsg('');
      setInfoMsg('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = password.trim();
    if (!cleanPass) {
      setErrorMsg('Contraseña incorrecta');
      return;
    }

    setSubmitting(true);
    try {
      const serverCheck = await verifyAdminPasswordWithServer(cleanPass);
      const isAuthorized = serverCheck.offline
        ? verifyAdminPassword(cleanPass, loadAdminPasswordOverride())
        : serverCheck.ok;

      if (!isAuthorized) {
        setErrorMsg('Contraseña incorrecta');
        return;
      }

      if (!serverCheck.offline) {
        saveAdminPasswordOverride(cleanPass);
      }

      setPassword('');
      setErrorMsg('');
      setInfoMsg('');
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyRecoveryPin(recoveryPin)) {
      setErrorMsg('PIN de recuperación incorrecto');
      return;
    }
    setErrorMsg('');
    setStep('new-password');
    window.setTimeout(() => newPwdRef.current?.focus(), 40);
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newPassword.trim();
    if (cleanNew.length < 4) {
      setErrorMsg('Escribe una contraseña de al menos 4 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      const res = await resetAdminPasswordWithServer(recoveryPin, cleanNew);
      if (!res.offline && !res.ok) {
        setErrorMsg(res.error || 'No se pudo actualizar la contraseña');
        return;
      }
      saveAdminPasswordOverride(cleanNew);
      setPassword('');
      setRecoveryPin('');
      setNewPassword('');
      setErrorMsg('');
      setInfoMsg('Nueva contraseña guardada correctamente. Ingresa con tu nueva clave.');
      setStep('login');
      window.setTimeout(() => inputRef.current?.focus(), 40);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="modal-admin-auth"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Acceso de Administrador"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {step === 'login' && (
        <form
          onSubmit={handleLoginSubmit}
          className="w-full max-w-[400px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold">Seguridad · Administrador</h2>
              <p className="m-0 text-[12px] text-slate-500">
                Ingresa la contraseña para abrir el Panel de Administrador
              </p>
            </div>
            <button
              type="button"
              id="btn-admin-auth-close"
              onClick={onClose}
              aria-label="Cerrar cuadro de contraseña"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {infoMsg && (
            <p
              id="msg-admin-password-reset-ok"
              className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-bold"
            >
              {infoMsg}
            </p>
          )}

          <div className="mb-3">
            <label htmlFor="inp-admin-password" className="block text-[12px] font-bold text-slate-600 mb-1">
              Clave de acceso
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="inp-admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="••••••••••••"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 pl-3 pr-11 text-[14px] font-semibold"
              />
              <button
                type="button"
                id="btn-toggle-admin-password"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-1.5 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errorMsg && (
              <p
                id="err-admin-password"
                role="alert"
                className="mt-1.5 mb-0 text-[12.5px] font-bold text-red-600"
                style={{ color: '#DC2626' }}
              >
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              id="btn-admin-auth-cancel"
              onClick={onClose}
              className="min-h-[42px] px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-[13px] font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-admin-auth-submit"
              disabled={submitting}
              className="min-h-[42px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Verificando...' : 'Entrar'}
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              id="btn-forgot-admin-password"
              onClick={() => {
                setErrorMsg('');
                setInfoMsg('');
                setRecoveryPin('');
                setStep('pin');
                window.setTimeout(() => pinRef.current?.focus(), 40);
              }}
              className="text-[12px] font-semibold text-slate-500 hover:text-blue-600 underline cursor-pointer bg-transparent border-0"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      )}

      {step === 'pin' && (
        <form
          onSubmit={handlePinSubmit}
          className="w-full max-w-[400px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold">Recuperar Acceso</h2>
              <p className="m-0 text-[12px] text-slate-500">
                Ingresa el PIN de recuperación maestro para definir una nueva clave
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar recuperación"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mb-3">
            <label htmlFor="inp-admin-recovery-pin" className="block text-[12px] font-bold text-slate-600 mb-1">
              PIN de recuperación maestro
            </label>
            <input
              ref={pinRef}
              id="inp-admin-recovery-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={recoveryPin}
              onChange={(e) => {
                setRecoveryPin(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="PIN maestro"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[14px] font-bold"
            />
            {errorMsg && (
              <p
                id="err-admin-recovery-pin"
                role="alert"
                className="mt-1.5 mb-0 text-[12.5px] font-bold text-red-600"
                style={{ color: '#DC2626' }}
              >
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setStep('login');
              }}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-[12.5px] font-bold cursor-pointer"
            >
              Volver
            </button>
            <button
              type="submit"
              id="btn-verify-recovery-pin"
              className="min-h-[42px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold cursor-pointer"
            >
              Validar PIN
            </button>
          </div>
        </form>
      )}

      {step === 'new-password' && (
        <form
          onSubmit={handleSaveNewPassword}
          className="w-full max-w-[400px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="m-0 text-[18px] font-extrabold">Nueva Contraseña Admin</h2>
              <p className="m-0 text-[12px] text-slate-500">
                Guarda una nueva contraseña persistente para el Panel de Administrador
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar cambio de contraseña"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="mb-3">
            <label htmlFor="inp-admin-new-password" className="block text-[12px] font-bold text-slate-600 mb-1">
              Nueva contraseña de administrador
            </label>
            <div className="relative flex items-center">
              <input
                ref={newPwdRef}
                id="inp-admin-new-password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Mínimo 4 caracteres"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 pl-3 pr-11 text-[14px] font-semibold"
              />
              <button
                type="button"
                id="btn-toggle-admin-new-password"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                className="absolute right-1.5 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errorMsg && (
              <p
                role="alert"
                className="mt-1.5 mb-0 text-[12.5px] font-bold text-red-600"
                style={{ color: '#DC2626' }}
              >
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setStep('login');
              }}
              className="min-h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-[12.5px] font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-new-admin-password"
              disabled={submitting}
              className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-extrabold cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

/* ==================== EMPAQUETADO CLOUDFLARE PAGES (JSZip CDN + Datos/Fotos del Dispositivo) ==================== */
interface JSZipInstance {
  file: (name: string, data: string | Blob) => JSZipInstance;
  generateAsync: (options: { type: 'blob'; compression?: string }) => Promise<Blob>;
}

type JSZipConstructor = new () => JSZipInstance;

const CLOUDFLARE_HEADERS_TXT = `/*
  Content-Type: text/html; charset=utf-8
`;

const FALLBACK_MANIFEST_JSON = JSON.stringify(
  {
    id: '/',
    name: 'Aluminero Pro',
    short_name: 'Aluminero',
    description:
      'Calculadora técnica y cotizador de taller para maestros alumineros: plano SVG animado, despiece, inventario de tramos y sobrantes, catálogo y PDF.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#0B2545',
    background_color: '#060E1B',
    lang: 'es',
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  null,
  2
);

const FALLBACK_SW_JS = `const CACHE_NAME = 'aluminero-pro-v1';
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL_ASSETS.map((asset) => cache.add(asset).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/api/') || url.pathname === '/__aluminero_single.html')
  ) {
    return;
  }

  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'cdn.jsdelivr.net'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && url.origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match(request)) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/'))
          );
        })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          return cached || Response.error();
        })
    );
  }
});
`;

async function ensureJSZipLoaded(): Promise<JSZipConstructor> {
  const win = window as unknown as { JSZip?: JSZipConstructor };
  if (typeof win.JSZip === 'function') {
    return win.JSZip;
  }

  const cdnUrls = [
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  ];

  for (const src of cdnUrls) {
    try {
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
        if (existing && typeof win.JSZip === 'function') {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Error al cargar ${src}`));
        document.head.appendChild(script);
      });
      if (typeof win.JSZip === 'function') {
        return win.JSZip;
      }
    } catch {
      // Intenta con el siguiente CDN
    }
  }

  throw new Error('No se pudo cargar JSZip desde CDN');
}

function escapeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const CLOSE_SCRIPT_TAG = '</scr' + 'ipt>';
const CLOSE_STYLE_TAG = '</sty' + 'le>';

function escapeInlineScriptContent(code: string): string {
  return code.replace(new RegExp('</scr' + 'ipt', 'gi'), '<\\/scr' + 'ipt');
}

function escapeInlineStyleContent(css: string): string {
  return css.replace(new RegExp('</sty' + 'le', 'gi'), '<\\/sty' + 'le');
}

function injectDeviceSeedIntoHtml(baseHtml: string, backupData: AlumineroBackupPayload): string {
  const seedMap: Record<string, string> = {
    aluminero_perfil_fotos_v1: JSON.stringify(backupData.perfilFotos || {}),
    aluminero_notas_v1: JSON.stringify(backupData.notas || []),
    aluminero_taller_v1: JSON.stringify(backupData.taller || {}),
    aluminero_formulas_v1: JSON.stringify(backupData.formulas || []),
    aluminero_inventario_v1: JSON.stringify(backupData.inventario || {}),
    aluminero_inv_herrajes_v1: JSON.stringify(backupData.inventarioHerrajes || {}),
    aluminero_sobrantes_v1: JSON.stringify(backupData.sobrantes || []),
    aluminero_inv_vidrios_v1: JSON.stringify(backupData.hojasVidrio || []),
    aluminero_obras_aprobadas_v1: JSON.stringify(backupData.obrasAprobadas || []),
    aluminero_historial_v1: JSON.stringify(backupData.historial || []),
  };

  if (typeof localStorage !== 'undefined') {
    [
      'aluminero_hoja_v1',
      'aluminero_comprometidos_v1',
      'aluminero_theme_v1',
      'aluminero_wa_sugerencias_v1',
      'aluminero_antes_despues_v1',
      'aluminero_inv_vidrios_v1',
      'aluminero_contrato_cliente_v1',
    ].forEach((extraKey) => {
      try {
        const val = localStorage.getItem(extraKey);
        if (val !== null) seedMap[extraKey] = val;
      } catch {
        // Ignora errores de lectura de almacenamiento
      }
    });
  }
  if (backupData.sugerenciasWhatsapp) {
    seedMap.aluminero_wa_sugerencias_v1 = backupData.sugerenciasWhatsapp;
  }
  if (Array.isArray(backupData.trabajosAntesDespues) && backupData.trabajosAntesDespues.length > 0) {
    seedMap.aluminero_antes_despues_v1 = JSON.stringify(backupData.trabajosAntesDespues);
  }

  const seedSig = `seed-${Date.now()}`;
  const serializedMap = escapeJsonForInlineScript(seedMap);
  const seedBody = escapeInlineScriptContent(
    `(function(){try{var sig=${escapeJsonForInlineScript(seedSig)};var prev=localStorage.getItem('aluminero_embedded_sig_v1');if(prev===sig)return;var seed=${serializedMap};Object.keys(seed).forEach(function(k){if(k==='aluminero_perfil_fotos_v1'){try{var cur=JSON.parse(localStorage.getItem(k)||'{}');var inc=JSON.parse(seed[k]||'{}');localStorage.setItem(k,JSON.stringify(Object.assign({},cur,inc)));}catch(e){localStorage.setItem(k,seed[k]);}}else if(localStorage.getItem(k)===null){localStorage.setItem(k,seed[k]);}});localStorage.setItem('aluminero_embedded_sig_v1',sig);}catch(e){}})();`
  );
  const seedScriptTag = `<script id="aluminero-embedded-data">${seedBody}${CLOSE_SCRIPT_TAG}`;

  const embeddedRe = new RegExp(
    '<script\\b[^>]*\\bid=["\']aluminero-embedded-data["\'][^>]*>[\\s\\S]*?<\\/scr' + 'ipt>\\s*',
    'gi'
  );
  const cleanedHtml = baseHtml.replace(embeddedRe, '');

  if (/<head\b[^>]*>/i.test(cleanedHtml)) {
    return cleanedHtml.replace(/<head\b[^>]*>/i, (match) => `${match}\n    ${seedScriptTag}`);
  }
  if (/<\/head>/i.test(cleanedHtml)) {
    return cleanedHtml.replace(/<\/head>/i, () => `${seedScriptTag}\n</head>`);
  }
  if (/<\/body>/i.test(cleanedHtml)) {
    return cleanedHtml.replace(/<\/body>/i, () => `${seedScriptTag}\n</body>`);
  }
  return `${cleanedHtml}\n${seedScriptTag}`;
}

/* ==================== MODAL PANEL ADMINISTRADOR (4 Planes + Días Exactos + Historial de Claves) ==================== */
interface AdminModalProps {
  open: boolean;
  deviceId: string;
  adminKeys: AdminKeyRecord[];
  formulas: FormulaPersonalizada[];
  backupData: AlumineroBackupPayload;
  cloudDevices: CloudDeviceRecord[];
  cloudStats: UsageStats30d;
  cloudConnected: boolean;
  cloudRefreshing: boolean;
  cloudLastSyncAt: number | null;
  onRefreshCloud: () => Promise<void> | void;
  onCloudActivateDevice: (params: {
    deviceId: string;
    cliente?: string;
    planCode?: string;
    planLabel?: string;
    expiresAt?: number | null;
    key?: string;
    dias?: number | null;
    revoke?: boolean;
    recordKeyOnly?: boolean;
  }) => Promise<void> | void;
  onClose: () => void;
  onActivateLic: (lic: LicenciaState) => void;
  onRecordAdminKey: (rec: AdminKeyRecord) => void;
  onImportFormulas: (imported: FormulaPersonalizada[]) => void;
  onImportBackup: (payload: AlumineroBackupPayload) => void;
  sugerenciasWhatsapp: string;
  onSaveSugerenciasWhatsapp: (phone: string) => void;
  trabajosAntesDespues?: TrabajoAntesDespuesItem[];
  onPublishTrabajoAprobado?: (item: Omit<TrabajoAntesDespuesItem, 'id' | 'fecha' | 'aprobado'>) => void;
  onDeleteTrabajoAprobado?: (id: string) => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  open,
  deviceId,
  adminKeys,
  formulas,
  backupData,
  cloudDevices,
  cloudStats,
  cloudConnected,
  cloudRefreshing,
  cloudLastSyncAt,
  onRefreshCloud,
  onCloudActivateDevice,
  onClose,
  onActivateLic,
  onRecordAdminKey,
  onImportFormulas,
  onImportBackup,
  sugerenciasWhatsapp,
  onSaveSugerenciasWhatsapp,
  trabajosAntesDespues = [],
  onPublishTrabajoAprobado,
  onDeleteTrabajoAprobado,
  onShowToast,
}) => {
  const [targetDevice, setTargetDevice] = useState(deviceId);
  const [clienteNombre, setClienteNombre] = useState('');
  const [planIdx, setPlanIdx] = useState(0); // idx 0 = Promoción 3 Días (Regalo)
  const [customDaysStr, setCustomDaysStr] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [waSugerenciasInput, setWaSugerenciasInput] = useState(sugerenciasWhatsapp);
  const [adTitulo, setAdTitulo] = useState('');
  const [adLinea, setAdLinea] = useState('Línea Nacional 3"');
  const [adDesc, setAdDesc] = useState('');
  const [adAntesUrl, setAdAntesUrl] = useState('');
  const [adDespuesUrl, setAdDespuesUrl] = useState('');
  const importFormulasRef = useRef<HTMLInputElement>(null);
  const importBackupRef = useRef<HTMLInputElement>(null);
  const adminAntesRef = useRef<HTMLInputElement>(null);
  const adminDespuesRef = useRef<HTMLInputElement>(null);

  const dailySeries30d = useMemo(() => buildDailyUsageSeries30d(cloudDevices), [cloudDevices]);

  const parsedCustomDays = customDaysStr.trim() ? Math.max(1, Math.min(3650, Math.round(Number(customDaysStr) || 0))) : null;

  useEffect(() => {
    if (open) {
      setTargetDevice(deviceId);
      setGeneratedKey(generateActivationKey(deviceId, planIdx, parsedCustomDays));
      setWaSugerenciasInput(sugerenciasWhatsapp);
      void onRefreshCloud();
    }
  }, [open, deviceId, sugerenciasWhatsapp]);

  if (!open) return null;

  const refreshKey = (dev = targetDevice, idx = planIdx, days = parsedCustomDays) => {
    const key = generateActivationKey(dev || deviceId, idx, days);
    setGeneratedKey(key);
    return key;
  };

  const buildClientMessage = (rec: { cliente: string; deviceId: string; planLabel: string; key: string; expiresAt: number | null }) => {
    const vence = rec.expiresAt ? new Date(rec.expiresAt).toLocaleDateString('es-MX') : 'Vitalicia';
    return `Hola${rec.cliente ? ` ${rec.cliente}` : ''}, aquí tienes tu clave Aluminero Pro (${rec.planLabel}, vence ${vence}) para el equipo ${rec.deviceId}: ${rec.key}`;
  };

  const handleSaveToHistory = (keyOverride?: string, syncCloudRecordOnly = false) => {
    const key = keyOverride || refreshKey();
    const now = Date.now();
    const plan = PLANS.find((p) => p.idx === planIdx) || PLANS[0];
    const dias = parsedCustomDays ?? plan.days;
    const planLabel = parsedCustomDays ? `Reposición ${parsedCustomDays} días` : plan.label;
    const expiresAt = now + dias * 24 * 60 * 60 * 1000;
    const cleanTarget = (targetDevice || deviceId).trim().toUpperCase();
    const cleanCliente = clienteNombre.trim() || 'Cliente sin nombre';

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

    if (syncCloudRecordOnly) {
      void onCloudActivateDevice({
        deviceId: cleanTarget,
        cliente: cleanCliente,
        planCode: parsedCustomDays ? `D${parsedCustomDays}` : plan.code,
        planLabel,
        expiresAt,
        key,
        dias,
        recordKeyOnly: true,
      });
    }
  };

  const handleCopyKeyAndSave = async () => {
    const key = refreshKey();
    handleSaveToHistory(key, true);
    await navigator.clipboard.writeText(key).catch(() => {});
    onShowToast('Clave copiada y sincronizada en la nube', true);
  };

  const handleActivateDirect = async () => {
    const key = refreshKey();
    const now = Date.now();
    const plan = PLANS.find((p) => p.idx === planIdx) || PLANS[0];
    const dias = parsedCustomDays ?? plan.days;
    const planLabel = parsedCustomDays ? `Reposición ${parsedCustomDays} días` : plan.label;
    const planCode = parsedCustomDays ? `D${parsedCustomDays}` : plan.code;
    const ms = dias * 24 * 60 * 60 * 1000;
    const expiresAt = now + ms;
    const cleanTarget = (targetDevice || deviceId).trim().toUpperCase();
    const isSelf = cleanTarget === deviceId.trim().toUpperCase();

    handleSaveToHistory(key, false);

    if (isSelf) {
      onActivateLic({
        active: true,
        planCode,
        planLabel,
        expiresAt,
        activatedAt: now,
      });
    }

    await onCloudActivateDevice({
      deviceId: cleanTarget,
      cliente: clienteNombre.trim() || undefined,
      planCode,
      planLabel,
      expiresAt,
      key,
      dias,
      revoke: false,
      recordKeyOnly: false,
    });

    onShowToast(
      isSelf
        ? `Plan "${planLabel}" activado en este equipo`
        : `Plan "${planLabel}" activado en tiempo real para ${cleanTarget}`,
      true
    );
    if (isSelf) onClose();
  };

  const buildCompleteStandaloneHtml = async (): Promise<string> => {
    let rawHtml = '';
    for (let attempt = 0; attempt < 2 && !rawHtml; attempt++) {
      try {
        const res = await fetch('/__aluminero_single.html', { cache: 'no-store' });
        if (res.ok) {
          const candidate = await res.text();
          const hasCompiledModule =
            res.headers.get('x-aluminero-single') === '1' ||
            (/<script[^>]+type=["']module["'][^>]*>[\s\S]{1500,}/i.test(candidate) &&
              !candidate.includes('src="/src/main.tsx"'));
          if (hasCompiledModule) {
            rawHtml = candidate;
          }
        }
      } catch {
        // Fallback al HTML compilado en ejecución en el navegador
      }
    }

    let baseHtml = '';
    if (rawHtml) {
      baseHtml = rawHtml;
    } else {
      const docToSerialize = document.documentElement.cloneNode(true) as HTMLElement;

      // Limpia scripts/estilos temporales de vista previa o desarrollo
      docToSerialize.querySelectorAll('script, style, link').forEach((el) => {
        const src = (el.getAttribute('src') || el.getAttribute('href') || '').toLowerCase();
        const id = (el.getAttribute('id') || '').toLowerCase();
        const viteId = (el.getAttribute('data-vite-dev-id') || '').toLowerCase();
        const txt = el.textContent || '';
        const isSmallInlineScript = el.tagName === 'SCRIPT' && !src && txt.length < 5000;
        if (
          src.includes('aistudio') ||
          src.includes('/@vite') ||
          src.includes('@react-refresh') ||
          src.includes('html2canvas') ||
          src.includes('/src/main.tsx') ||
          id.includes('aistudio') ||
          viteId.length > 0 ||
          (isSmallInlineScript && txt.includes('react-refresh'))
        ) {
          el.remove();
        }
      });

      // Si existen hojas de estilo o scripts compilados externos (/assets/...), los incrusta inline
      const externalStyles = Array.from(
        docToSerialize.querySelectorAll('link[rel="stylesheet"][href]')
      ) as HTMLLinkElement[];
      for (const linkEl of externalStyles) {
        const href = linkEl.getAttribute('href') || '';
        if (href.startsWith('/') || href.startsWith(window.location.origin)) {
          try {
            const cssRes = await fetch(href, { cache: 'no-store' });
            if (cssRes.ok) {
              const cssText = await cssRes.text();
              const styleTag = document.createElement('style');
              styleTag.textContent = escapeInlineStyleContent(cssText);
              linkEl.replaceWith(styleTag);
            }
          } catch {
            // Conserva el link si no pudo obtenerse
          }
        }
      }

      const externalModuleScripts = Array.from(
        docToSerialize.querySelectorAll('script[type="module"][src]')
      ) as HTMLScriptElement[];
      for (const scriptEl of externalModuleScripts) {
        const src = scriptEl.getAttribute('src') || '';
        if (
          (src.startsWith('/') || src.startsWith(window.location.origin)) &&
          !src.includes('/src/')
        ) {
          try {
            const jsRes = await fetch(src, { cache: 'no-store' });
            if (jsRes.ok) {
              const jsText = await jsRes.text();
              const inlineScript = document.createElement('script');
              inlineScript.type = 'module';
              inlineScript.textContent = escapeInlineScriptContent(jsText);
              scriptEl.replaceWith(inlineScript);
            }
          } catch {
            // Conserva referencia si falla
          }
        }
      }

      // Oculta modales abiertos y limpia inputs sensibles
      [
        'modal-pro',
        'modal-admin-auth',
        'modal-admin',
        'modal-recomendar',
        'modal-sugerencias',
        'modal-calculadora',
        'modal-antes-despues',
        'modal-contrato',
        'modal-legal',
        'modal-mosquitero-paso2',
        'modal-tutorial',
        'modal-formula',
        'modal-perfil',
      ].forEach((mId) => {
        const modalEl = docToSerialize.querySelector(`#${mId}`) as HTMLElement | null;
        if (modalEl) {
          modalEl.style.display = 'none';
          modalEl.setAttribute('aria-hidden', 'true');
        }
      });

      docToSerialize
        .querySelectorAll(
          'input[type="password"], #inp-admin-password, #inp-lic-key, #inp-admin-cliente, #inp-admin-device, #inp-admin-dias'
        )
        .forEach((inp) => {
          (inp as HTMLInputElement).value = '';
          inp.setAttribute('value', '');
        });

      // Verifica que exista un script módulo compilado y vacía #root para evitar texto duplicado o modales pegados
      const hasInlineCompiledModule = Array.from(
        docToSerialize.querySelectorAll('script[type="module"]')
      ).some((s) => !s.getAttribute('src') && (s.textContent || '').trim().length > 500);

      if (!hasInlineCompiledModule) {
        throw new Error('No se encontró el bundle compilado en ejecución');
      }

      const rootEl = docToSerialize.querySelector('#root');
      if (rootEl) {
        rootEl.innerHTML = '';
      }

      // Regla 1: escapa cualquier </script> y </style> interno antes de serializar outerHTML
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

    // Reasegura el escape de cualquier cierre interno dentro de <script>...</script> excepto el cierre real del tag
    const scriptBlockRe = new RegExp(
      '(<script\\b[^>]*>)([\\s\\S]*?)(<\\/scr' + 'ipt>)',
      'gi'
    );
    const safeHtml = baseHtml.replace(
      scriptBlockRe,
      (_full, openTag: string, body: string, closeTag: string) =>
        `${openTag}${escapeInlineScriptContent(body)}${closeTag}`
    );

    void CLOSE_STYLE_TAG;
    return injectDeviceSeedIntoHtml(safeHtml, backupData);
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
      onShowToast('Archivo index.html completo descargado para Cloudflare Pages', true);
    } catch {
      onShowToast('No se pudo generar la descarga de index.html');
    } finally {
      setDownloadingHtml(false);
    }
  };

  const fetchStaticAssetOrFallback = async (path: string, fallback: string, expectJson = false): Promise<string> => {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (res.ok) {
        const txt = await res.text();
        const trimmed = txt.trim();
        if (trimmed && !trimmed.startsWith('<!')) {
          if (!expectJson || trimmed.startsWith('{')) {
            return txt;
          }
        }
      }
    } catch {
      // Usa respaldo embebido si se ejecuta sin servidor o sin conexión
    }
    return fallback;
  };

  const handleDownloadCloudflareZip = async () => {
    setDownloadingZip(true);
    try {
      const [JSZip, fullHtml, manifestText, swText] = await Promise.all([
        ensureJSZipLoaded(),
        buildCompleteStandaloneHtml(),
        fetchStaticAssetOrFallback('/manifest.json', FALLBACK_MANIFEST_JSON, true),
        fetchStaticAssetOrFallback('/sw.js', FALLBACK_SW_JS, false),
      ]);

      const zip = new JSZip();
      zip.file('index.html', fullHtml);
      zip.file('manifest.json', manifestText);
      zip.file('sw.js', swText);
      zip.file('_headers', CLOUDFLARE_HEADERS_TXT);

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'aluminero_cloudflare.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      onShowToast('Paquete aluminero_cloudflare.zip listo (4 archivos con fotos y datos)', true);
    } catch {
      onShowToast('No se pudo generar aluminero_cloudflare.zip. Verifica tu conexión para cargar JSZip.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleExportFormulasJson = () => {
    try {
      const jsonStr = JSON.stringify(formulas, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'aluminero-formulas.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      onShowToast(`Exportadas ${formulas.length} fórmula(s) a JSON`, true);
    } catch {
      onShowToast('No se pudieron exportar las fórmulas');
    }
  };

  const handleImportFormulasFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const rawList = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { formulas?: unknown[] }).formulas)
          ? (parsed as { formulas: unknown[] }).formulas
          : null;

      if (!rawList) {
        onShowToast('El archivo JSON no contiene una lista válida de fórmulas');
        return;
      }

      const validLineas = new Set(Object.keys(LINEAS_CONFIG));
      const normalized: FormulaPersonalizada[] = [];
      const now = Date.now();

      rawList.forEach((item, idx) => {
        if (!item || typeof item !== 'object') return;
        const obj = item as Record<string, unknown>;
        const nombre = typeof obj.nombre === 'string' ? obj.nombre.trim() : '';
        const tol = obj.tolerancias as Record<string, unknown> | undefined;
        if (!nombre || !tol || typeof tol !== 'object') return;

        const lineaRaw = typeof obj.linea === 'string' && validLineas.has(obj.linea) ? (obj.linea as LineaId) : '3';
        normalized.push({
          id: typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : `f-imp-${now}-${idx}`,
          nombre,
          linea: lineaRaw,
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
        onShowToast('No se encontraron fórmulas válidas en el archivo JSON');
        return;
      }

      onImportFormulas(normalized);
      onShowToast(`Importadas ${normalized.length} fórmula(s) desde JSON`, true);
    } catch {
      onShowToast('Archivo JSON inválido o corrupto');
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
      const jsonStr = JSON.stringify(payload);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `aluminero-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      const fotosCount = Object.keys(payload.perfilFotos || {}).length;
      const notasFotosCount = (payload.notas || []).filter((n) => Boolean(n.fotoDataUrl)).length;
      onShowToast(
        `Respaldo exportado (${fotosCount + notasFotosCount} fotos). Compártelo por WhatsApp entre celulares.`,
        true
      );
    } catch {
      onShowToast('No se pudo exportar el respaldo completo');
    }
  };

  const handleImportBackupFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseBackupPayload(text);
      if (!parsed) {
        onShowToast('El archivo JSON no es un respaldo válido de Aluminero Pro');
        return;
      }
      onImportBackup(parsed);
    } catch {
      onShowToast('No se pudo leer el archivo de respaldo JSON');
    }
  };

  return (
    <div
      id="modal-admin"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Panel de Administrador"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[520px] max-h-[92vh] overflow-y-auto bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[18px] font-extrabold">Panel de Administrador</h2>
            <p className="m-0 text-[12px] text-slate-500">
              4 planes oficiales, reposición de días exactos e historial de clientes
            </p>
          </div>
          <button
            type="button"
            id="btn-admin-close"
            onClick={onClose}
            aria-label="Cerrar Panel Admin"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div id="admin-gen-box" className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="inp-admin-cliente" className="block text-[12px] font-bold text-slate-600 mb-1">
                Nombre / Teléfono del cliente (opcional)
              </label>
              <input
                id="inp-admin-cliente"
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Mtro. Luis 55-1234-5678"
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-semibold"
              />
            </div>

            <div>
              <label htmlFor="inp-admin-device" className="block text-[12px] font-bold text-slate-600 mb-1">
                ID de Equipo del cliente
              </label>
              <input
                id="inp-admin-device"
                type="text"
                value={targetDevice}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setTargetDevice(v);
                  refreshKey(v, planIdx, parsedCustomDays);
                }}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 mono text-[13.5px] font-bold uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="sel-admin-plan" className="block text-[12px] font-bold text-slate-600 mb-1">
                Plan a otorgar
              </label>
              <select
                id="sel-admin-plan"
                value={planIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setPlanIdx(idx);
                  refreshKey(targetDevice, idx, parsedCustomDays);
                }}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-semibold bg-white"
              >
                {PLANS.map((p) => (
                  <option key={p.code} value={p.idx}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="inp-admin-dias" className="block text-[12px] font-bold text-slate-600 mb-1">
                Días exactos personalizados (opcional)
              </label>
              <input
                id="inp-admin-dias"
                type="number"
                min={1}
                max={3650}
                value={customDaysStr}
                onChange={(e) => {
                  const raw = e.target.value;
                  setCustomDaysStr(raw);
                  const d = raw.trim() ? Math.max(1, Math.min(3650, Math.round(Number(raw) || 0))) : null;
                  refreshKey(targetDevice, planIdx, d);
                }}
                placeholder="Ej. 18 (reposición por extravío)"
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 mono text-[13px] font-semibold"
              />
            </div>
          </div>

          <div id="admin-result-box" className="flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2">
              <div>
                <span className="block text-[10.5px] text-slate-400 font-bold">
                  CLAVE GENERADA {parsedCustomDays ? `· REPOSICIÓN ${parsedCustomDays} DÍAS` : ''}
                </span>
                <strong id="lbl-admin-key" className="mono text-[16px] text-emerald-300">
                  {generatedKey}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleCopyKeyAndSave}
                className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[12px] font-bold cursor-pointer"
              >
                Copiar y Guardar
              </button>
            </div>

            <button
              type="button"
              id="btn-admin-activar-aqui"
              onClick={handleActivateDirect}
              className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13.5px] cursor-pointer"
            >
              {(targetDevice || deviceId).trim().toUpperCase() === deviceId.trim().toUpperCase()
                ? 'Activar este plan ahora en este equipo'
                : `Activar este plan en la nube para ${(targetDevice || deviceId).trim().toUpperCase()}`}
            </button>
          </div>

          {/* Sección de Estadísticas (Últimos 30 días + Gráficos Recharts) */}
          <div id="admin-stats-box" className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="m-0 text-[13.5px] font-extrabold text-slate-800">
                Estadísticas de Uso (Últimos 30 días)
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {cloudStats.proActiveDevices} PRO · {cloudStats.totalDevices} total
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                <span className="block text-[11px] font-bold text-slate-600">
                  Usuarios activos (últimos 30 días)
                </span>
                <strong id="stat-active-users-30d" className="mono text-[22px] font-extrabold text-blue-700 block mt-0.5">
                  {cloudStats.activeUsers30d}
                </strong>
                <span className="block text-[11px] text-slate-600">
                  Equipos con actividad reciente en la nube
                </span>
              </div>
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                <span className="block text-[11px] font-bold text-slate-600">
                  Uso promedio de la app
                </span>
                <strong id="stat-avg-usage-30d" className="mono text-[22px] font-extrabold text-emerald-700 block mt-0.5">
                  {cloudStats.avgMinutesPerUser30d} min
                </strong>
                <span className="block text-[11px] text-slate-600">
                  {cloudStats.avgSessionsPerUser30d} sesiones · {cloudStats.avgActiveDaysPerUser30d} días prom./usuario
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
              <div
                id="chart-active-users-30d"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              >
                <div className="text-[11px] font-extrabold text-slate-700 mb-1.5">
                  Usuarios activos por día (30 días)
                </div>
                <div style={{ width: '100%', height: 135 }}>
                  <ResponsiveContainer width="100%" height={135}>
                    <BarChart data={dailySeries30d} margin={{ top: 4, right: 6, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={6} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid rgba(96,165,250,0.35)',
                          borderRadius: 10,
                          color: '#F8FAFC',
                          fontSize: 11,
                        }}
                        formatter={(value) => [`${value} usuarios`, 'Activos']}
                      />
                      <Bar dataKey="activeUsers" name="Activos" fill="#3B82F6" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                id="chart-avg-usage-30d"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              >
                <div className="text-[11px] font-extrabold text-slate-700 mb-1.5">
                  Uso promedio diario (min/usuario)
                </div>
                <div style={{ width: '100%', height: 135 }}>
                  <ResponsiveContainer width="100%" height={135}>
                    <AreaChart data={dailySeries30d} margin={{ top: 4, right: 6, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradAvgMin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={6} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          border: '1px solid rgba(52,211,153,0.35)',
                          borderRadius: 10,
                          color: '#F8FAFC',
                          fontSize: 11,
                        }}
                        formatter={(value) => [`${value} min`, 'Promedio']}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgMinutes"
                        name="Promedio (min)"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#gradAvgMin)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Dispositivos Vinculados en Tiempo Real */}
          <div id="admin-devices-box" className="pt-3 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h3 className="m-0 text-[13.5px] font-extrabold text-slate-800">
                  Dispositivos Vinculados ({cloudDevices.length})
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      cloudConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span id="lbl-cloud-sync-status">
                    {cloudConnected ? 'Sincronización en tiempo real activa' : 'Reconectando con servidor...'}
                    {cloudLastSyncAt ? ` · ${new Date(cloudLastSyncAt).toLocaleTimeString('es-MX')}` : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="btn-admin-refresh-devices"
                disabled={cloudRefreshing}
                onClick={async () => {
                  await onRefreshCloud();
                  onShowToast('Dispositivos actualizados desde la nube', true);
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-extrabold cursor-pointer disabled:opacity-60"
              >
                {cloudRefreshing ? 'Actualizando...' : 'Actualizar / Refrescar'}
              </button>
            </div>

            {cloudDevices.length === 0 ? (
              <p className="text-[12px] text-slate-500 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                Esperando registro de dispositivos en la nube...
              </p>
            ) : (
              <div id="admin-devices-list" className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {cloudDevices.map((dev) => {
                  const isSelfDev = dev.deviceId === deviceId;
                  const isProValid =
                    dev.proActive && (dev.expiresAt === null || dev.expiresAt > Date.now());
                  return (
                    <div
                      key={dev.deviceId}
                      data-device-id={dev.deviceId}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-[11.5px]"
                    >
                      <div className="min-w-[180px] flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <strong className="mono text-blue-700 text-[12.5px]">{dev.deviceId}</strong>
                          {isSelfDev && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-extrabold">
                              Este equipo
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                              isProValid
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isProValid ? `PRO · ${dev.planLabel}` : 'Gratuito'}
                          </span>
                        </div>
                        <div className="text-slate-700 font-semibold mt-0.5">
                          {dev.cliente || 'Sin cliente asignado'} · {dev.deviceLabel}
                        </div>
                        <div className="text-slate-500">
                          {dev.totalSessions} sesiones · {dev.totalMinutes} min · Últ. actividad:{' '}
                          {new Date(dev.lastSeenAt).toLocaleString('es-MX')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetDevice(dev.deviceId);
                            if (dev.cliente) setClienteNombre(dev.cliente);
                            refreshKey(dev.deviceId, planIdx, parsedCustomDays);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-[11px] cursor-pointer"
                        >
                          Seleccionar
                        </button>
                        {isProValid && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (isSelfDev) {
                                onActivateLic({
                                  active: false,
                                  planCode: 'FREE',
                                  planLabel: 'Gratuito',
                                  expiresAt: null,
                                  activatedAt: Date.now(),
                                });
                              }
                              await onCloudActivateDevice({
                                deviceId: dev.deviceId,
                                revoke: true,
                              });
                              onShowToast(`Licencia revocada para ${dev.deviceId}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 font-bold text-[11px] cursor-pointer"
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="sep border-t border-slate-200" style={{ margin: '16px 0' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ padding: '2px 8px' }}>
            <button
              type="button"
              id="btn-admin-export-formulas"
              onClick={handleExportFormulasJson}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[12.5px] font-extrabold cursor-pointer"
            >
              Exportar fórmulas a JSON
            </button>
            <button
              type="button"
              id="btn-admin-import-formulas"
              onClick={() => importFormulasRef.current?.click()}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[12.5px] font-extrabold cursor-pointer"
            >
              Importar fórmulas desde JSON
            </button>
            <input
              ref={importFormulasRef}
              id="inp-admin-import-formulas"
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFormulasFile(file);
                e.target.value = '';
              }}
            />
          </div>

          {/* Respaldo completo (Fotos comprimidas + datos para pasar por WhatsApp) */}
          <div
            id="admin-backup-box"
            className="p-3.5 rounded-xl border-2 border-amber-500 bg-[#1E293B] text-slate-100 shadow-md"
            style={{ margin: '0 8px' }}
          >
            <div className="admin-backup-title text-[12.5px] font-extrabold text-amber-300 mb-0.5">
              Respaldo de Fotos y Datos (WhatsApp entre celulares)
            </div>
            <p className="admin-backup-desc m-0 text-[11.5px] text-slate-200 mb-2.5 leading-snug">
              Incluye fotos reales del catálogo ({Object.keys(backupData.perfilFotos || {}).length}), notas con foto, sobrantes, inventario y fórmulas en un archivo JSON.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-admin-export-backup"
                onClick={handleExportBackupJson}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-amber-300 bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0F172A] text-[12.5px] font-extrabold cursor-pointer"
              >
                📤 Exportar Respaldo
              </button>
              <button
                type="button"
                id="btn-admin-import-backup"
                onClick={() => importBackupRef.current?.click()}
                className="min-h-[42px] px-3 py-2 rounded-xl border border-blue-400 bg-blue-600 hover:bg-blue-500 text-white text-[12.5px] font-extrabold cursor-pointer"
              >
                📥 Importar Respaldo
              </button>
              <input
                ref={importBackupRef}
                id="inp-admin-import-backup"
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportBackupFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Número de WhatsApp receptor de sugerencias */}
          <div
            id="admin-sugerencias-wa-box"
            className="p-3.5 rounded-xl border border-emerald-400/50"
            style={{ margin: '0 8px' }}
          >
            <label
              htmlFor="inp-admin-wa-sugerencias"
              className="block text-[12.5px] font-extrabold mb-1"
            >
              WhatsApp receptor de Sugerencias (Líneas / Perfiles)
            </label>
            <p className="m-0 text-[11.5px] opacity-85 mb-2 leading-snug">
              Incluye código de país sin símbolos (ej. <span className="mono font-bold">5215512345678</span>). Las sugerencias enviadas desde el buzón abrirán este número.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                id="inp-admin-wa-sugerencias"
                type="tel"
                inputMode="numeric"
                value={waSugerenciasInput}
                onChange={(e) => setWaSugerenciasInput(e.target.value)}
                placeholder="Ej. 5215512345678"
                className="flex-1 min-w-[180px] min-h-[42px] rounded-xl border border-slate-300 px-3 mono text-[13.5px] font-bold bg-white text-slate-900"
              />
              <button
                type="button"
                id="btn-admin-save-wa-sugerencias"
                onClick={() => {
                  const clean = sanitizeWhatsappNumber(waSugerenciasInput);
                  setWaSugerenciasInput(clean);
                  onSaveSugerenciasWhatsapp(clean);
                  onShowToast(
                    clean
                      ? `WhatsApp receptor guardado: ${clean}`
                      : 'Número receptor limpiado (abrirá selector de WhatsApp)',
                    true
                  );
                }}
                className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-extrabold cursor-pointer shrink-0"
              >
                Guardar WhatsApp
              </button>
            </div>
          </div>

          {onPublishTrabajoAprobado && (
            <div
              id="admin-antes-despues-box"
              className="p-3.5 rounded-xl border border-slate-300 bg-slate-50"
              style={{ margin: '0 8px' }}
            >
              <div className="text-[12.5px] font-extrabold text-slate-900 mb-0.5">
                Publicar Trabajo Aprobado (Antes y Después)
              </div>
              <p className="m-0 text-[11.5px] text-slate-600 mb-2.5">
                Aprueba y agrega directamente a la galería las fotos Antes y Después enviadas por un taller.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={adTitulo}
                  onChange={(e) => setAdTitulo(e.target.value)}
                  placeholder="Título del proyecto (ej. Ventanal Sala)"
                  className="min-h-[38px] rounded-xl border border-slate-300 px-3 text-[12.5px] font-semibold bg-white"
                />
                <input
                  type="text"
                  value={adLinea}
                  onChange={(e) => setAdLinea(e.target.value)}
                  placeholder="Línea (ej. Línea Nacional 3&quot;)"
                  className="min-h-[38px] rounded-xl border border-slate-300 px-3 text-[12.5px] font-semibold bg-white"
                />
              </div>
              <textarea
                rows={2}
                value={adDesc}
                onChange={(e) => setAdDesc(e.target.value)}
                placeholder="Descripción breve del trabajo aprobado..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-[12.5px] font-medium bg-white mb-2"
              />
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => adminAntesRef.current?.click()}
                  className="min-h-[38px] px-2.5 rounded-xl border border-amber-400 bg-amber-50 text-amber-900 text-[12px] font-extrabold cursor-pointer"
                >
                  {adAntesUrl ? '✓ Foto Antes lista' : '📷 Subir Foto Antes'}
                </button>
                <button
                  type="button"
                  onClick={() => adminDespuesRef.current?.click()}
                  className="min-h-[38px] px-2.5 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-900 text-[12px] font-extrabold cursor-pointer"
                >
                  {adDespuesUrl ? '✓ Foto Después lista' : '📷 Subir Foto Después'}
                </button>
                <input
                  ref={adminAntesRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void compressImageToDataUrl(f, 600, 0.8).then(setAdAntesUrl).catch(() => {});
                    e.target.value = '';
                  }}
                />
                <input
                  ref={adminDespuesRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void compressImageToDataUrl(f, 600, 0.8).then(setAdDespuesUrl).catch(() => {});
                    e.target.value = '';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!adTitulo.trim() || !adDesc.trim() || !adAntesUrl || !adDespuesUrl) {
                    onShowToast('Completa título, descripción y ambas fotos (Antes y Después)');
                    return;
                  }
                  onPublishTrabajoAprobado({
                    titulo: adTitulo.trim(),
                    lineaNombre: adLinea.trim() || 'Aluminio y Vidrio',
                    descripcion: adDesc.trim(),
                    antesImgUrl: adAntesUrl,
                    despuesImgUrl: adDespuesUrl,
                    autor: 'Aprobado por Administrador',
                  });
                  setAdTitulo('');
                  setAdDesc('');
                  setAdAntesUrl('');
                  setAdDespuesUrl('');
                  onShowToast('Trabajo Antes y Después publicado como aprobado', true);
                }}
                className="w-full min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-extrabold cursor-pointer"
              >
                Publicar proyecto aprobado
              </button>
              {trabajosAntesDespues.filter((t) => !t.presetVariant).length > 0 && onDeleteTrabajoAprobado && (
                <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1">
                  {trabajosAntesDespues
                    .filter((t) => !t.presetVariant)
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 text-[11.5px]">
                        <span className="truncate font-semibold text-slate-700">{t.titulo}</span>
                        <button
                          type="button"
                          onClick={() => onDeleteTrabajoAprobado(t.id)}
                          className="text-red-700 font-bold cursor-pointer bg-transparent border-0 p-0 shrink-0"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2" style={{ padding: '2px 8px' }}>
            <button
              type="button"
              id="btn-admin-download-html"
              disabled={downloadingHtml || downloadingZip}
              onClick={handleDownloadStandaloneHtml}
              className="btn-secondary flex items-center justify-center font-extrabold text-[13px] cursor-pointer disabled:opacity-60"
              style={{
                display: 'flex',
                width: '100%',
                minHeight: '48px',
                padding: '12px 18px',
                border: '1.5px solid #93C5FD',
                borderRadius: '12px',
                background: '#EFF6FF',
                color: '#1E3A8A',
                whiteSpace: 'normal',
                textAlign: 'center',
                lineHeight: 1.35,
              }}
            >
              {downloadingHtml
                ? 'Empaquetando index.html completo...'
                : 'Descargar código completo (index.html)'}
            </button>

            <button
              type="button"
              id="btn-admin-download-cloudflare-zip"
              disabled={downloadingHtml || downloadingZip}
              onClick={handleDownloadCloudflareZip}
              className="btn-secondary flex items-center justify-center font-extrabold text-[13px] cursor-pointer disabled:opacity-60"
              style={{
                display: 'flex',
                width: '100%',
                minHeight: '48px',
                padding: '12px 18px',
                border: '1.5px solid #F59E0B',
                borderRadius: '12px',
                background: '#FFFBEB',
                color: '#78350F',
                whiteSpace: 'normal',
                textAlign: 'center',
                lineHeight: 1.35,
              }}
            >
              {downloadingZip
                ? 'Empaquetando aluminero_cloudflare.zip...'
                : 'Descargar paquete listo para Cloudflare (.zip)'}
            </button>
          </div>

          {/* Historial de Claves Generadas */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="m-0 text-[13.5px] font-extrabold text-slate-800 mb-2">
              Historial de Claves Generadas ({adminKeys.length})
            </h3>
            {adminKeys.length === 0 ? (
              <p className="text-[12px] text-slate-500 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                Aquí aparecerá cada clave que generes o copies para control de vencimientos.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[210px] overflow-y-auto pr-1">
                {adminKeys.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-[11.5px]"
                  >
                    <div className="min-w-[180px]">
                      <strong className="block text-slate-900">
                        {rec.cliente} · <span className="mono text-blue-700">{rec.deviceId}</span>
                      </strong>
                      <div className="text-slate-600">
                        {rec.planLabel} · <span className="mono font-bold text-emerald-700">{rec.key}</span>
                      </div>
                      <div className="text-slate-500">
                        Creada: {new Date(rec.createdAt).toLocaleDateString('es-MX')} · Vence:{' '}
                        {rec.expiresAt ? new Date(rec.expiresAt).toLocaleDateString('es-MX') : 'Vitalicia'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(buildClientMessage(rec)).catch(() => {});
                        onShowToast('Mensaje de entrega copiado', true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11.5px] cursor-pointer"
                    >
                      Copiar mensaje
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================== MODAL RECOMENDAR APP (QR LOCAL EN CANVAS -> window.location.origin || https://pages.dev) ==================== */
interface RecomendarModalProps {
  open: boolean;
  onClose: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const RecomendarModal: React.FC<RecomendarModalProps> = ({ open, onClose, onShowToast }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const shareUrl = useMemo(() => getOfficialShareUrl(), [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    QRCode.toDataURL(shareUrl, {
      width: 216,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0B2545', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});

    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 216,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#0B2545', light: '#FFFFFF' },
        },
        () => {}
      );
    }
    return () => {
      active = false;
    };
  }, [open, shareUrl]);

  if (!open) return null;

  const handleCopiarEnlaceFijo = async () => {
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied && typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        ta.remove();
      } catch {
        copied = false;
      }
    }
    onShowToast(copied ? `Enlace ${shareUrl} copiado` : `Enlace oficial: ${shareUrl}`, true);
  };

  const handleCompartirRedes = () => {
    const text = encodeURIComponent(
      `Te recomiendo Aluminero Pro, la app calculadora de despiece y cotización para aluminio y vidrio: ${shareUrl}`
    );
    const webUrl = `https://wa.me/?text=${text}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: 'Aluminero Pro',
          text: 'Calculadora técnica de aluminio y vidrio',
          url: shareUrl,
        })
        .catch(() => {
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        });
    } else {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id="modal-recomendar"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Recomendar App"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[400px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl text-center">
        <div className="flex items-center justify-between mb-2">
          <h2 className="m-0 text-[18px] font-extrabold">Recomendar Aluminero Pro</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Recomendar App"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
        <p className="text-[12.5px] text-slate-600 mb-3">
          Escanea este código QR local o comparte el enlace oficial con otros maestros alumineros
        </p>

        <div
          data-preserve-light="true"
          className="inline-flex p-3 rounded-2xl border border-slate-200 bg-white shadow-sm mb-3"
        >
          {qrDataUrl ? (
            <img
              id="img-recomendar-qr"
              src={qrDataUrl}
              alt={`Código QR para ${shareUrl}`}
              width={216}
              height={216}
              className="block rounded-lg"
            />
          ) : (
            <canvas ref={canvasRef} aria-label={`Código QR local para ${shareUrl}`} />
          )}
        </div>

        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 mono text-[13px] font-bold text-blue-700 break-all mb-3">
          <span id="lbl-share-url">{shareUrl}</span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            id="btn-copy-share-url"
            onClick={handleCopiarEnlaceFijo}
            className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13.5px] cursor-pointer"
          >
            Copiar Enlace Oficial
          </button>
          <button
            type="button"
            onClick={handleCompartirRedes}
            className="w-full min-h-[44px] rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-[13.5px] cursor-pointer"
          >
            Compartir por WhatsApp / Redes
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==================== MODAL TUTORIAL ==================== */
export const TutorialModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;
  const steps = [
    { tag: 'Paso 1', text: 'Elige Ventanas, Cancel de Baño, Mosquiteros o Puertas desde el menú principal y selecciona la línea.' },
    { tag: 'Paso 2', text: 'Ajusta ancho, alto, acabado y vidrio en la pestaña DESCUENTOS. Revisa el plano SVG y los cortes Alumer.' },
    { tag: 'Paso 3', text: 'Pasa a COTIZACIÓN para verificar tu ganancia libre, guardar o agregar la pieza a la Hoja de Cotización.' },
    { tag: 'Paso 4', text: 'En la Hoja de Cotización descarga el PDF limpio para tu cliente o revisa los tramos de 6.10 m vs tu Inventario.' },
  ];

  return (
    <div
      id="modal-tutorial"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial rápido"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[460px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="m-0 text-[18px] font-extrabold">¿Cómo cotizar paso a paso?</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar tutorial"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-2.5 mt-3">
          {steps.map((s) => (
            <div key={s.tag} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="block text-[11px] font-extrabold uppercase text-blue-600 mb-0.5">{s.tag}</span>
              <p className="m-0 text-[13px] text-slate-800 font-medium">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ==================== MODAL FORMULA PERSONALIZADA (CON 5 DESCUENTOS EDITABLES) ==================== */
interface FormulaModalProps {
  open: boolean;
  linea: LineaId;
  tolerancias: TrabajoParams['tolerancias'];
  formulas: FormulaPersonalizada[];
  onClose: () => void;
  onSaveFormula: (nombre: string, linea: LineaId, tolerancias: TrabajoParams['tolerancias']) => void;
  onApplyFormula: (formula: FormulaPersonalizada) => void;
  onDeleteFormula: (id: string) => void;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({
  open,
  linea,
  tolerancias,
  formulas,
  onClose,
  onSaveFormula,
  onApplyFormula,
  onDeleteFormula,
}) => {
  const [nombre, setNombre] = useState('');
  const [tol, setTol] = useState(tolerancias);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setTol({ ...tolerancias });
      setErrorMsg('');
    }
  }, [open, tolerancias]);

  if (!open) return null;

  const handleSave = () => {
    if (!nombre.trim()) {
      setErrorMsg('Escribe un nombre para identificar tu fórmula de corte.');
      return;
    }
    onSaveFormula(nombre.trim(), linea, tol);
    setNombre('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      id="modal-formula"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Crear mi propia fórmula de corte"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[460px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl my-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="m-0 text-[17px] font-extrabold">Crear mi propia fórmula de corte</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal fórmula"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
        <p className="text-[12px] text-slate-500 mb-3">
          Para <strong>{LINEAS_CONFIG[linea].nombre}</strong> · Define nombre y los 5 descuentos (en cm). Se guarda en este dispositivo:
        </p>

        <label htmlFor="inp-formula-nombre" className="block text-[11.5px] font-bold text-slate-600 mb-1">
          Nombre de la fórmula
        </label>
        <input
          id="inp-formula-nombre"
          type="text"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          placeholder="Ej. Alumer 3 pulgadas mi ajuste"
          className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-[13.5px] font-semibold mb-3"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3.5">
          {(
            [
              ['marcoH', 'Marco H (cm)'],
              ['hojaV', 'Hoja V (cm)'],
              ['hojaH', 'Hoja H (cm)'],
              ['vidAncho', 'Vidrio Ancho (cm)'],
              ['vidAlto', 'Vidrio Alto (cm)'],
            ] as const
          ).map(([k, lbl]) => (
            <div key={k}>
              <label htmlFor={`inp-formula-${k}`} className="block text-[11px] font-bold text-slate-500 mb-1">
                {lbl}
              </label>
              <input
                id={`inp-formula-${k}`}
                type="number"
                step="0.1"
                min="0"
                value={tol[k]}
                onChange={(e) => setTol((prev) => ({ ...prev, [k]: Math.max(0, Number(e.target.value) || 0) }))}
                className="w-full min-h-[38px] px-2 rounded-lg border border-slate-200 mono text-[12.5px] font-bold"
              />
            </div>
          ))}
        </div>

        {errorMsg && (
          <p className="text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            {errorMsg}
          </p>
        )}

        <button
          type="button"
          id="btn-guardar-formula-modal"
          onClick={handleSave}
          className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13.5px] cursor-pointer"
        >
          Guardar Fórmula
        </button>

        {formulas.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <h3 className="m-0 text-[13px] font-extrabold text-slate-800 mb-2">
              Mis Fórmulas Guardadas ({formulas.length})
            </h3>
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {formulas.map((f) => (
                <div
                  key={f.id}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-[11.5px]"
                >
                  <div className="min-w-0">
                    <strong className="block text-slate-900 truncate">{f.nombre}</strong>
                    <span className="text-slate-500 mono">
                      MH:{f.tolerancias.marcoH} · HV:{f.tolerancias.hojaV} · HH:{f.tolerancias.hojaH} · VA:{f.tolerancias.vidAncho} · VH:{f.tolerancias.vidAlto}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onApplyFormula(f);
                        onClose();
                      }}
                      className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteFormula(f.id)}
                      className="px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold text-[11px] cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== MODAL DETALLE DE PERFIL + SUBIR FOTO REAL ==================== */
interface PerfilModalProps {
  perfilId: PerfilCatalogoId | null;
  fotoRealUrl?: string;
  onClose: () => void;
  onUploadFoto: (id: PerfilCatalogoId, file: File) => void;
  onRemoveFoto: (id: PerfilCatalogoId) => void;
}

export const PerfilModal: React.FC<PerfilModalProps> = ({
  perfilId,
  fotoRealUrl,
  onClose,
  onUploadFoto,
  onRemoveFoto,
}) => {
  if (!perfilId) return null;
  const perfil = CATALOGO_PERFILES.find((p) => p.id === perfilId);
  if (!perfil) return null;

  return (
    <div
      id="modal-perfil"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${perfil.nombre}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[460px] max-h-[90vh] overflow-y-auto bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[18px] font-extrabold break-words">{perfil.nombre}</h2>
            <span className="mono text-[12px] font-bold text-blue-600 break-words">{perfil.codigoRef}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle de perfil"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          <div
            data-preserve-light="true"
            className="p-3 rounded-xl bg-white border border-slate-300 flex flex-col items-center justify-center"
          >
            <span className="text-[10.5px] font-bold text-slate-600 mb-1">SECCIÓN TRANSVERSAL</span>
            <PerfilSectionSvg perfilId={perfil.id} size={114} />
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
            <span className="text-[10.5px] font-bold text-slate-500 mb-1">FOTO REAL DE CATÁLOGO</span>
            {fotoRealUrl ? (
              <img
                src={fotoRealUrl}
                alt={`Foto real de ${perfil.nombre}`}
                className="w-[110px] h-[110px] object-contain rounded-lg border border-slate-200 bg-white"
              />
            ) : (
              <span className="text-[11.5px] text-slate-600 text-center py-6">
                Sin foto real cargada
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-3.5">
          <PhotoPickerButtons
            onSelectFile={(file) => onUploadFoto(perfil.id, file)}
          />
          {fotoRealUrl && (
            <button
              type="button"
              onClick={() => onRemoveFoto(perfil.id)}
              className="w-full min-h-[38px] px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[12.5px] cursor-pointer"
            >
              Quitar foto actual
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 text-[13px] bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <strong>Uso en taller:</strong> {perfil.uso}
          </div>
          <div>
            <strong>Dimensiones:</strong> <span className="mono">{perfil.dimensiones}</span>
          </div>
          <div>
            <strong>Peso aprox.:</strong> <span className="mono">{perfil.pesoAprox}</span>
          </div>
          <div>
            <strong>Tip de armado:</strong> {perfil.notasTaller}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================== MODAL GUÍA DE INSTALACIÓN PWA (Android / iOS) ==================== */
interface PwaInstallGuideModalProps {
  open: boolean;
  isIOS: boolean;
  onClose: () => void;
}

export const PwaInstallGuideModal: React.FC<PwaInstallGuideModalProps> = ({ open, isIOS, onClose }) => {
  if (!open) return null;

  return (
    <div
      id="modal-pwa-install"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Instalar Aluminero Pro"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[18px] font-extrabold">Instalar Aluminero Pro</h2>
            <p className="m-0 text-[12px] text-slate-500">
              Úsala como aplicación en tu celular incluso sin internet
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar instrucciones de instalación"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5 text-[13px]">
          {isIOS ? (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 text-slate-800">
              <strong className="block text-blue-900 mb-1">En iPhone / iPad (Safari):</strong>
              <ol className="m-0 pl-4 space-y-1 text-[12.5px]">
                <li>Toca el botón <strong>Compartir</strong> (cuadro con flecha hacia arriba) en la barra inferior.</li>
                <li>Desliza y selecciona <strong>Agregar a inicio</strong>.</li>
                <li>Toca <strong>Agregar</strong> arriba a la derecha.</li>
              </ol>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 text-slate-800">
              <strong className="block text-blue-900 mb-1">En Android / Chrome / Edge:</strong>
              <ol className="m-0 pl-4 space-y-1 text-[12.5px]">
                <li>Abre el menú del navegador (icono <strong>⋮</strong> arriba a la derecha).</li>
                <li>Selecciona <strong>Instalar aplicación</strong> o <strong>Agregar a la pantalla principal</strong>.</li>
                <li>Confirma tocando <strong>Instalar</strong>.</li>
              </ol>
            </div>
          )}
          <p className="m-0 text-[11.5px] text-slate-500">
            Una vez instalada, el botón "Instalar App" desaparecerá automáticamente y podrás cotizar sin conexión.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full min-h-[42px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

/* ==================== MODAL BUZÓN DE SUGERENCIAS POR WHATSAPP ==================== */
interface SugerenciasModalProps {
  open: boolean;
  whatsappNumber: string;
  deviceId: string;
  onClose: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const SUGERENCIA_TIPOS = [
  'Línea de aluminio',
  'Perfil / Código',
  'Herraje / Vinil / Escuadra',
  'Otro',
] as const;

export const SugerenciasModal: React.FC<SugerenciasModalProps> = ({
  open,
  whatsappNumber,
  deviceId,
  onClose,
  onShowToast,
}) => {
  const [tipo, setTipo] = useState<(typeof SUGERENCIA_TIPOS)[number]>('Línea de aluminio');
  const [nombreTaller, setNombreTaller] = useState('');
  const [detalle, setDetalle] = useState('');
  const [fotoDataUrl, setFotoDataUrl] = useState('');
  const [fotoFileName, setFotoFileName] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setErrorMsg('');
    }
  }, [open]);

  if (!open) return null;

  const cleanWa = sanitizeWhatsappNumber(whatsappNumber);

  const handleSelectPhoto = async (file: File) => {
    setErrorMsg('');
    setCompressing(true);
    try {
      const compressed = await compressImageToDataUrl(file, 600, 0.8);
      setFotoDataUrl(compressed);
      setFotoFileName(file.name ? file.name.replace(/\.[^.]+$/, '.jpg') : 'sugerencia-perfil.jpg');
    } catch {
      setErrorMsg('No se pudo procesar la imagen seleccionada. Intenta con otra foto.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDetalle = detalle.trim();
    if (!cleanDetalle) {
      setErrorMsg('Escribe qué línea, perfil o herraje necesitas que agreguemos.');
      return;
    }

    setSending(true);
    setErrorMsg('');

    const lines = [
      '*Sugerencia Aluminero Pro*',
      `• Categoría: ${tipo}`,
      `• Solicitud: ${cleanDetalle}`,
      ...(nombreTaller.trim() ? [`• Taller / Maestro: ${nombreTaller.trim()}`] : []),
      `• Equipo: ${deviceId}`,
      ...(cleanWa ? [`• WhatsApp Admin: +${cleanWa}`] : []),
    ];
    const message = lines.join('\n');
    const encoded = encodeURIComponent(message);
    const waUrl = cleanWa
      ? `https://wa.me/${cleanWa}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    try {
      if (fotoDataUrl) {
        const photoFile = dataUrlToJpegFile(
          fotoDataUrl,
          fotoFileName || 'sugerencia-perfil.jpg'
        );

        let canShareFiles = false;
        if (
          typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function'
        ) {
          try {
            canShareFiles = navigator.canShare({ files: [photoFile] });
          } catch {
            canShareFiles = false;
          }
        }

        if (canShareFiles) {
          try {
            await navigator.share({
              title: 'Sugerencia Aluminero Pro',
              text: message,
              files: [photoFile],
            });
            setDetalle('');
            setFotoDataUrl('');
            setFotoFileName('');
            setErrorMsg('');
            onShowToast('Sugerencia con foto compartida hacia WhatsApp', true);
            onClose();
            return;
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
              onShowToast('Envío cancelado');
              return;
            }
          }
        }

        triggerFileDownload(photoFile);
        openExternalLinkSafe(waUrl);
        setDetalle('');
        setFotoDataUrl('');
        setFotoFileName('');
        setErrorMsg('');
        onShowToast(
          cleanWa
            ? 'Abriendo WhatsApp del Administrador · Adjunta la imagen descargada'
            : 'Imagen descargada y abriendo WhatsApp con tu sugerencia',
          true
        );
        onClose();
        return;
      }

      openExternalLinkSafe(waUrl);
      setDetalle('');
      setErrorMsg('');
      onShowToast('Abriendo WhatsApp con tu sugerencia', true);
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      id="modal-sugerencias"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Sugerir Línea o Perfil"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[460px] bg-white text-slate-900 border-[1.5px] border-slate-300 rounded-[20px] p-5 shadow-2xl my-auto">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[18px] font-extrabold text-slate-900">
              Sugerir Línea o Perfil
            </h2>
            <p className="m-0 text-[12.5px] text-slate-600 mt-0.5">
              ¿Te falta una serie, perfil o herraje en la app? Escríbelo y envíalo directo por WhatsApp.
            </p>
          </div>
          <button
            type="button"
            id="btn-sugerencias-close"
            onClick={onClose}
            aria-label="Cerrar Buzón de Sugerencias"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <span className="block text-[12px] font-bold text-slate-700 mb-1.5">
              ¿Qué necesitas agregar?
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGERENCIA_TIPOS.map((item) => {
                const selected = tipo === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTipo(item)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold border cursor-pointer transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="inp-sugerencia-taller"
              className="block text-[12px] font-bold text-slate-700 mb-1"
            >
              Tu nombre o taller (opcional)
            </label>
            <input
              id="inp-sugerencia-taller"
              type="text"
              value={nombreTaller}
              onChange={(e) => setNombreTaller(e.target.value)}
              placeholder="Ej. Aluminios del Norte / Mtro. Juan"
              className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold"
            />
          </div>

          <div>
            <label
              htmlFor="inp-sugerencia-detalle"
              className="block text-[12px] font-bold text-slate-700 mb-1"
            >
              Línea, perfil o herraje que necesitas *
            </label>
            <textarea
              id="inp-sugerencia-detalle"
              rows={3}
              value={detalle}
              onChange={(e) => {
                setDetalle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Ej. Línea Española 3500, Riel curvo, Bisagra hidráulica, perfil código Alumer..."
              className="w-full rounded-xl border border-slate-300 p-3 text-[13.5px] font-medium"
            />
          </div>

          {/* Imagen o foto opcional */}
          <div>
            <span className="block text-[12px] font-bold text-slate-700 mb-1.5">
              Imagen o foto de referencia (opcional)
            </span>
            {compressing && (
              <p className="m-0 mb-1.5 text-[11.5px] font-bold text-blue-700">
                Optimizando imagen...
              </p>
            )}
            <PhotoPickerButtons
              disabled={compressing}
              cameraButtonId="btn-sugerencia-camara"
              galleryButtonId="btn-sugerencia-foto"
              onSelectFile={(file) => void handleSelectPhoto(file)}
            />

            {fotoDataUrl && !compressing && (
              <div className="mt-2 p-2 rounded-xl border border-slate-300 bg-slate-50 flex items-center gap-2.5">
                <img
                  src={fotoDataUrl}
                  alt="Vista previa de imagen adjunta"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0 bg-white"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-extrabold text-slate-800 truncate">
                    Imagen adjunta lista
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {fotoFileName || 'sugerencia-perfil.jpg'}
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-sugerencia-clear-foto"
                  onClick={() => {
                    setFotoDataUrl('');
                    setFotoFileName('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[11px] font-extrabold cursor-pointer shrink-0"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="m-0 text-[12px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMsg}
            </p>
          )}

          {cleanWa && (
            <p className="m-0 text-[11.5px] text-slate-600">
              Se enviará al WhatsApp configurado: <strong className="mono">+{cleanWa}</strong>
            </p>
          )}

          <button
            type="submit"
            id="btn-enviar-sugerencia-wa"
            disabled={sending || compressing}
            className="w-full min-h-[48px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[14px] cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          >
            <span>
              {sending
                ? 'Preparando envío...'
                : fotoDataUrl
                  ? 'Compartir sugerencia e imagen por WhatsApp'
                  : 'Enviar sugerencia por WhatsApp'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

