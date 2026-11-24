import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
const AdminMiniCharts = React.lazy(() => import('./AdminMiniCharts'));
import {
  buildDailyUsageSeries30d,
  CATALOGO_PERFILES,
  CloudDeviceRecord,
  computeUsageStats30d,
  formatActivationKeyInput,
  formatClientHeaderDisplay,
  formatClientPhoneInput,
  formatCombinedClientLabel,
  formatCountdownTimer,
  generateActivationKey,
  getOfficialShareUrl,
  getTrialCountdown,
  isColleaguePromoPlan,
  isProActive,
  isShortPlanKeyPrefix,
  isUnassignedAutoTrialDevice,
  keyRequiresCloudEmailConfirmation,
  LineaId,
  LINEAS_CONFIG,
  normalizeDeviceIdInput,
  PerfilCatalogoId,
  PLANS,
  PROMO_COLEGA_ALREADY_USED_ERROR,
  sanitizeReferralSenderName,
  TrabajoParams,
  UsageStats30d,
  validateActivationKey,
  validateCloudBackupEmailPair,
  verifyAdminAccessCredential,
  verifyAdminPassword,
  verifyRecoveryPin,
} from '../utils/alumineroLogic';
import {
  detectDeviceLabel,
  fetchPromocionesEnviadasCount,
  incrementPromocionesEnviadasCount,
  resetAdminPasswordWithServer,
  verifyAdminPasswordWithServer,
} from '../utils/cloudSync';
import {
  AdminKeyRecord,
  AlumineroBackupPayload,
  clearLegacyAdminKeys,
  CloudAccountSession,
  compressImageToDataUrl,
  dataUrlToJpegFile,
  formatWhatsappUrlDigits,
  FormulaPersonalizada,
  LicenciaState,
  loadAdminPasswordOverride,
  loadCachedPromoCount,
  loadReferralSenderName,
  openExternalLinkSafe,
  parseBackupPayload,
  ReferralHistoryRecord,
  sanitizeWhatsappNumber,
  saveAdminPasswordOverride,
  SavedColleagueReferral,
  saveReferralSenderName,
  TrabajoAntesDespuesItem,
  triggerFileDownload,
  validateWhatsappNumber,
} from '../utils/storageHelpers';
import { PerfilSectionSvg } from './PerfilSectionSvg';
import { PhotoPickerButtons } from './PhotoPickerButtons';

/* ==================== MODAL PRO (Adquirir Licencia PRO + Activación por Clave) ==================== */
export const PRO_PAYMENT_CONFIG = {
  plan30Label: 'Promo 30 Días PRO',
  plan30RegularPrice: '$699',
  plan30Price: '$369 MXN',
  plan90Label: 'Plan 90 Días PRO',
  plan90RegularPrice: '$1,899',
  plan90Price: '$989 MXN',
  plan365Label: 'Plan 1 Año PRO',
  plan365RegularPrice: '$3,599',
  plan365Price: '$1,799 MXN',
  mpLink30: 'https://mpago.la/2evqS3r',
  mpLink90: 'https://mpago.la/2xXek7s',
  mpLink365: 'https://mpago.la/335TCqb',
  speiClabe: '722969010141447452',
  beneficiario: 'Tonatiuh O',
  institucion: 'Mercado Pago W',
  whatsapp10Digits: '7351631532',
};

interface ProModalProps {
  open: boolean;
  deviceId: string;
  licencia: LicenciaState | null;
  proActive: boolean;
  promoColegaUsed?: boolean;
  trialExpiresAt?: number | null;
  whatsappNumber?: string;
  defaultEmail?: string;
  tallerNombre?: string;
  tallerTel?: string;
  referredById?: string | null;
  onClose: () => void;
  onActivateLic: (lic: LicenciaState) => Promise<{ ok: boolean; error?: string } | void> | void;
  onDeactivateLic: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const ProModal: React.FC<ProModalProps> = ({
  open,
  deviceId,
  licencia,
  proActive,
  promoColegaUsed = false,
  trialExpiresAt = null,
  whatsappNumber = '',
  defaultEmail = '',
  tallerNombre = '',
  tallerTel = '',
  referredById = null,
  onClose,
  onActivateLic,
  onDeactivateLic,
  onShowToast,
}) => {
  const [selectedPlanKey, setSelectedPlanKey] = useState<'30d' | '90d' | '365d'>('30d');
  const [showSpeiDetails, setShowSpeiDetails] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [cloudEmail, setCloudEmail] = useState(defaultEmail || '');
  const [cloudEmailConfirm, setCloudEmailConfirm] = useState(defaultEmail || '');
  const [activating, setActivating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (open && defaultEmail && !cloudEmail && !cloudEmailConfirm) {
      setCloudEmail(defaultEmail);
      setCloudEmailConfirm(defaultEmail);
    }
  }, [open, defaultEmail, cloudEmail, cloudEmailConfirm]);

  if (!open) return null;

  const safeDeviceId = String(deviceId || '').trim() || 'EQUIPO';
  const cleanReferredById =
    referredById &&
    String(referredById).trim() &&
    String(referredById).trim().toUpperCase() !== safeDeviceId.toUpperCase()
      ? String(referredById).trim()
      : null;

  const validTrialExpiresAt =
    typeof trialExpiresAt === 'number' && Number.isFinite(trialExpiresAt) ? trialExpiresAt : null;
  const trialInfo =
    validTrialExpiresAt !== null && (!licencia || !licencia.active || licencia.planCode === 'G')
      ? getTrialCountdown(validTrialExpiresAt, Date.now())
      : null;

  const emailCheck = validateCloudBackupEmailPair(cloudEmail, cloudEmailConfirm);
  const keyNeedsCloudEmail = keyRequiresCloudEmailConfirmation(keyInput);
  const isShortKey =
    isShortPlanKeyPrefix(keyInput) || keyInput.trim().toUpperCase().startsWith('AP-P-');
  // Obligatorio ÚNICAMENTE para planes de 90 días y 1 año; claves de 30 días / cortas / prueba permanente activan de inmediato sin correo
  const emailRequiredBeforeActivate = isShortKey
    ? false
    : keyNeedsCloudEmail || selectedPlanKey !== '30d';
  const isActivateDisabled =
    activating || (emailRequiredBeforeActivate && emailCheck.status !== 'confirmed');

  const handleCopyPaymentField = async (fieldId: string, rawValue: string, toastMsg: string) => {
    const trimmed = rawValue.trim();
    const cleanVal = /^[\d\s-]+$/.test(trimmed) ? trimmed.replace(/[\s-]+/g, '') : trimmed;
    try {
      await navigator.clipboard.writeText(cleanVal);
    } catch {
      // fallback silencioso si el navegador restringe portapapeles
    }
    setCopiedField(fieldId);
    onShowToast(toastMsg, true);
    window.setTimeout(() => {
      setCopiedField((prev) => (prev === fieldId ? null : prev));
    }, 1800);
  };

  const rawWaDigits = sanitizeWhatsappNumber(PRO_PAYMENT_CONFIG.whatsapp10Digits || whatsappNumber);
  const waFullDigits =
    rawWaDigits.length === 10
      ? `52${rawWaDigits}`
      : rawWaDigits.length > 10
        ? rawWaDigits
        : '527351631532';

  const selectedPlanMeta =
    selectedPlanKey === '30d'
      ? {
          name: PRO_PAYMENT_CONFIG.plan30Label,
          price: PRO_PAYMENT_CONFIG.plan30Price,
          mpLink: PRO_PAYMENT_CONFIG.mpLink30,
        }
      : selectedPlanKey === '90d'
        ? {
            name: PRO_PAYMENT_CONFIG.plan90Label,
            price: PRO_PAYMENT_CONFIG.plan90Price,
            mpLink: PRO_PAYMENT_CONFIG.mpLink90,
          }
        : {
            name: PRO_PAYMENT_CONFIG.plan365Label,
            price: PRO_PAYMENT_CONFIG.plan365Price,
            mpLink: PRO_PAYMENT_CONFIG.mpLink365,
          };

  const cleanTallerName = String(tallerNombre || '').trim();
  const cleanTallerTel = String(tallerTel || '').trim();
  const waBaseLines = [
    `Hola, quiero activar mi licencia de Aluminero Pro por Transferencia SPEI / OXXO.`,
    `Plan elegido: ${selectedPlanMeta.name} (${selectedPlanMeta.price})`,
    ...(cleanTallerName ? [`Nombre del Taller: ${cleanTallerName}`] : []),
    ...(cleanTallerTel ? [`WhatsApp: ${cleanTallerTel}`] : []),
    `ID de Equipo: ${safeDeviceId}`,
  ];
  if (cleanReferredById) {
    waBaseLines.push(`Recomendado por el colega: ${cleanReferredById}`);
  }
  waBaseLines.push('Te adjunto mi comprobante para activar mi licencia.');
  const waPaymentText = waBaseLines.join('\n');
  const waPaymentUrl = `https://wa.me/${waFullDigits}?text=${encodeURIComponent(waPaymentText)}`;

  const handleActivate = async () => {
    if (activating) return;
    const cleanKey = keyInput.trim().toUpperCase();
    const res = validateActivationKey(deviceId, cleanKey);
    if (!res.ok || !res.plan) {
      onShowToast(res.error || 'Clave inválida');
      return;
    }

    if (promoColegaUsed && isColleaguePromoPlan(res.plan.code, res.customDays, cleanKey)) {
      onShowToast(PROMO_COLEGA_ALREADY_USED_ERROR);
      return;
    }

    const planRequiresCloudEmail =
      res.plan.code === 'Q' || res.plan.code === 'A' || (res.customDays ?? 0) >= 90;
    if (planRequiresCloudEmail && emailCheck.status !== 'confirmed') {
      onShowToast(
        emailCheck.status === 'mismatch'
          ? 'Los correos no coinciden'
          : 'Registra y confirma un correo electrónico válido para activar tu licencia de 90 días o 1 año.'
      );
      return;
    }

    const now = Date.now();
    const confirmedEmail =
      planRequiresCloudEmail && emailCheck.status === 'confirmed'
        ? emailCheck.normalizedEmail
        : undefined;
    const nextLic: LicenciaState = {
      active: true,
      planCode: res.customDays ? `D${res.customDays}` : res.plan.code,
      planLabel: res.plan.label,
      expiresAt: res.plan.ms === null ? null : now + res.plan.ms,
      activatedAt: now,
      activatedKey: cleanKey,
      tipo: res.isFreeTestPro ? 'prueba_gratis' : 'pagado',
      ...(confirmedEmail ? { linkedEmail: confirmedEmail } : {}),
    };

    try {
      setActivating(true);
      const result = await Promise.resolve(onActivateLic(nextLic));
      if (result && result.ok === false) {
        onShowToast(result.error || 'Este código fue revocado y ya no puede activarse.');
        return;
      }
      setKeyInput('');
      onShowToast(`✅ Licencia PRO activada (${res.plan.label})`, true);
      onClose();
    } catch {
      // Garantizar que ningún error de red bloquee el cierre ni la activación local
      setKeyInput('');
      onShowToast(`✅ Licencia PRO activada (${res.plan.label})`, true);
      onClose();
    } finally {
      setActivating(false);
    }
  };

  return (
    <div
      id="modal-pro"
      className="fixed inset-0 z-50 bg-slate-950/80 overflow-y-auto flex items-start justify-center px-3 pt-6 pb-8 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Licencia Aluminero Pro"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] my-2 sm:my-auto bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl">
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
            <strong className="mono text-[15px] text-blue-700">{safeDeviceId}</strong>
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard?.writeText(safeDeviceId).catch(() => {});
              onShowToast?.('ID de equipo copiado');
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-bold cursor-pointer"
          >
            Copiar ID
          </button>
        </div>

        {cleanReferredById && (
          <div
            id="badge-pro-referred-by"
            className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11.5px] font-semibold flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>
              Invitado por colega: <strong className="mono font-extrabold text-emerald-800">{cleanReferredById}</strong>
            </span>
          </div>
        )}

        {proActive && licencia ? (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[12.5px]">
            <strong className="block">✓ Licencia Activa: {licencia?.planLabel || 'PRO'}</strong>
            <span>
              {licencia?.expiresAt === null || licencia?.expiresAt === undefined
                ? 'Vigencia vitalicia'
                : Number.isFinite(licencia.expiresAt)
                  ? `Vence: ${new Date(licencia.expiresAt).toLocaleString('es-MX')}`
                  : 'Licencia activa'}
            </span>
            {licencia?.planCode === 'G' && trialInfo?.active && (
              <span className="block mt-0.5 font-bold text-emerald-800">
                ⏳ {trialInfo.label}
              </span>
            )}
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
        ) : (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[12.5px]">
            <strong className="block">🔒 Versión Gratuita</strong>
            <span>
              Ingresa una clave de activación válida o elige tu plan de lanzamiento para desbloquear todas las funciones PRO.
            </span>
          </div>
        )}

        {/* Sección Adquirir Licencia PRO */}
        <div
          id="pro-adquirir-section"
          className="mt-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3"
        >
          {/* Banner Promoción Exclusiva de Lanzamiento (translúcido oscuro ámbar + shimmer + fuego pulsante) */}
          <div
            id="pro-launch-promo-banner"
            className="pro-promo-shimmer p-3.5 rounded-xl bg-slate-950/90 bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 border border-amber-500/40 shadow-md"
          >
            <div className="relative z-10 flex items-center gap-2 text-[11.5px] font-black uppercase tracking-wider text-amber-300">
              <span className="pro-fire-pulse text-[15px] leading-none" aria-hidden="true">
                🔥
              </span>
              <span>PROMOCIÓN EXCLUSIVA DE LANZAMIENTO</span>
            </div>
            <p className="relative z-10 m-0 mt-1 text-[12px] font-semibold leading-snug text-amber-50/95">
              Aprovecha hasta 50% de descuento este mes antes de que suban a su precio regular
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="m-0 text-[15px] font-extrabold text-slate-900">Adquirir Licencia PRO</h3>
              <p className="m-0 text-[11.5px] text-slate-500">
                Elige tu plan, realiza tu pago seguro y envía tu comprobante para activar al instante
              </p>
            </div>
            <Cloud className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
          </div>

          <div id="pro-planes-grid" className="grid grid-cols-1 gap-2">
            <button
              type="button"
              id="btn-select-plan-30d"
              onClick={() => setSelectedPlanKey('30d')}
              className={`flex justify-between items-center gap-2 p-3 rounded-xl border-[1.5px] text-left cursor-pointer transition-all ${
                selectedPlanKey === '30d'
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <strong className="block text-[13px] text-slate-900">
                  {PRO_PAYMENT_CONFIG.plan30Label}
                </strong>
                <span className="block text-[11.5px] text-slate-500">
                  Activación inmediata con PIN (sin correo / uso local)
                </span>
              </div>
              <div className="flex items-baseline justify-end gap-1.5 shrink-0 whitespace-nowrap">
                <span className="mono text-[11.5px] text-slate-400 line-through font-semibold">
                  {PRO_PAYMENT_CONFIG.plan30RegularPrice}
                </span>
                <strong className="mono text-[15px] text-blue-700 font-extrabold">
                  {PRO_PAYMENT_CONFIG.plan30Price}
                </strong>
              </div>
            </button>

            <button
              type="button"
              id="btn-select-plan-90d"
              onClick={() => setSelectedPlanKey('90d')}
              className={`flex justify-between items-center gap-2 p-3 rounded-xl border-[1.5px] text-left cursor-pointer transition-all ${
                selectedPlanKey === '90d'
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <strong className="block text-[13px] text-slate-900">
                  {PRO_PAYMENT_CONFIG.plan90Label}
                </strong>
                <span className="block text-[11.5px] text-slate-500">
                  Con respaldo en nube y acceso total
                </span>
              </div>
              <div className="flex items-baseline justify-end gap-1.5 shrink-0 whitespace-nowrap">
                <span className="mono text-[11.5px] text-slate-400 line-through font-semibold">
                  {PRO_PAYMENT_CONFIG.plan90RegularPrice}
                </span>
                <strong className="mono text-[15px] text-blue-700 font-extrabold">
                  {PRO_PAYMENT_CONFIG.plan90Price}
                </strong>
              </div>
            </button>

            <button
              type="button"
              id="btn-select-plan-365d"
              onClick={() => setSelectedPlanKey('365d')}
              className={`flex justify-between items-center gap-2 p-3 rounded-xl border-[1.5px] text-left cursor-pointer transition-all ${
                selectedPlanKey === '365d'
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <strong className="block text-[13px] text-slate-900">
                  {PRO_PAYMENT_CONFIG.plan365Label}
                </strong>
                <span className="block text-[11.5px] text-slate-500">
                  Con respaldo en nube - Mejor ahorro anual
                </span>
              </div>
              <div className="flex items-baseline justify-end gap-1.5 shrink-0 whitespace-nowrap">
                <span className="mono text-[11.5px] text-slate-400 line-through font-semibold">
                  {PRO_PAYMENT_CONFIG.plan365RegularPrice}
                </span>
                <strong className="mono text-[15px] text-blue-700 font-extrabold">
                  {PRO_PAYMENT_CONFIG.plan365Price}
                </strong>
              </div>
            </button>
          </div>

          {/* Métodos de Pago Seguros: Opción Principal (Mercado Pago) + Segunda Opción (SPEI) */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col gap-2.5 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Métodos de Pago Seguros
              </span>
              <span className="mono text-[11px] font-extrabold text-blue-700">
                {selectedPlanMeta.price}
              </span>
            </div>

            {/* Opción Principal: Pago con Mercado Pago (abre en pestaña nueva el enlace del plan seleccionado) */}
            <a
              id="btn-pro-mercado-pago"
              href={selectedPlanMeta.mpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.99] text-white font-extrabold text-[13px] flex items-center justify-center gap-2 no-underline cursor-pointer shadow-md transition-all text-center leading-tight"
            >
              <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Pagar con Mercado Pago (Tarjeta, SPEI o Efectivo)</span>
            </a>

            {/* Segunda Opción: Transferencia SPEI desplegable */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <button
                type="button"
                id="btn-toggle-spei-details"
                aria-expanded={showSpeiDetails}
                onClick={() => setShowSpeiDetails((prev) => !prev)}
                className="w-full min-h-[42px] px-3 py-2 flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-[12.5px] cursor-pointer text-left transition-colors"
              >
                <span>Transferencia SPEI (Mismo precio)</span>
                {showSpeiDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                )}
              </button>

              {showSpeiDetails && (
                <div
                  id="pro-spei-collapsible-panel"
                  className="px-3 pb-3 pt-2 border-t border-slate-200 bg-white flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10.5px] font-bold text-slate-500">
                        CLABE Interbancaria
                      </span>
                      <strong
                        id="pro-spei-clabe-number"
                        className="mono block whitespace-nowrap tracking-tight text-[11px] min-[360px]:text-[12px] sm:text-[13px] text-slate-900"
                      >
                        {PRO_PAYMENT_CONFIG.speiClabe}
                      </strong>
                    </div>
                    <button
                      type="button"
                      id="btn-copy-spei-clabe"
                      onClick={() =>
                        void handleCopyPaymentField(
                          'spei',
                          PRO_PAYMENT_CONFIG.speiClabe,
                          'CLABE SPEI copiada'
                        )
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-[11.5px] font-bold cursor-pointer shrink-0 transition-colors ${
                        copiedField === 'spei'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      {copiedField === 'spei' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12px]">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">
                        Beneficiario
                      </span>
                      <strong className="text-slate-900">{PRO_PAYMENT_CONFIG.beneficiario}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">
                        Institución
                      </span>
                      <strong className="text-slate-900">{PRO_PAYMENT_CONFIG.institucion}</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11.5px] font-semibold leading-snug">
                    Escribe tu ID de Equipo (<strong className="mono">{safeDeviceId}</strong>) en el concepto de transferencia para activar tu licencia más rápido.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[12px]">
            <span className="text-slate-700 font-semibold">Tu ID de Equipo actual:</span>
            <strong className="mono text-[13.5px] font-extrabold text-blue-700">{safeDeviceId}</strong>
          </div>

          <a
            id="btn-pro-whatsapp-comprobante"
            href={waPaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 no-underline shadow-md transition-colors text-center leading-tight"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Activar por WhatsApp (Transferencia SPEI / OXXO)</span>
          </a>
        </div>

        {/* Separador visual claro entre Pagos / Comprobante y Canje de Clave / PIN */}
        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-slate-300 to-slate-300" />
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-600 whitespace-nowrap">
            Canje de Clave / PIN
          </span>
          <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-slate-300 to-slate-300" />
        </div>

        <div
          id="pro-pin-redemption-section"
          className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-200 shadow-sm flex flex-col gap-3"
        >
          <div>
            <label htmlFor="inp-lic-key" className="block text-[13px] font-extrabold text-slate-900 mb-1">
              ¿Ya tienes tu clave / PIN de activación?
            </label>
            <input
              id="inp-lic-key"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={keyInput}
              onChange={(e) => {
                const formatted = formatActivationKeyInput(e.target.value, keyInput);
                setKeyInput(formatted);
              }}
              placeholder="AP-X-XXXXXX (ej. AP-Q-1A2B3C)"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 mono text-[13.5px] font-bold uppercase bg-white"
            />
          </div>

          {emailRequiredBeforeActivate ? (
            <div
              id="pro-cloud-email-fields"
              className="flex flex-col gap-2 pt-2 border-t border-slate-200"
            >
              <div className="text-[11px] font-bold text-slate-600">
                Obligatorio para activar planes de 90 Días y 1 Año (respaldo en la nube):
              </div>

              <div>
                <label
                  htmlFor="inp-pro-cloud-email"
                  className="block text-[11.5px] font-bold text-slate-700 mb-1"
                >
                  Correo electrónico (para respaldo en la nube) *
                </label>
                <input
                  id="inp-pro-cloud-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={cloudEmail}
                  onChange={(e) => setCloudEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13px] font-semibold bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="inp-pro-cloud-email-confirm"
                  className="block text-[11.5px] font-bold text-slate-700 mb-1"
                >
                  Confirmar correo electrónico *
                </label>
                <input
                  id="inp-pro-cloud-email-confirm"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={cloudEmailConfirm}
                  onChange={(e) => setCloudEmailConfirm(e.target.value)}
                  placeholder="Vuelve a escribir tu correo"
                  className={`w-full min-h-[42px] rounded-xl border px-3 text-[13px] font-semibold bg-white ${
                    emailCheck.status === 'mismatch' || emailCheck.status === 'invalid_format'
                      ? 'border-red-500 ring-1 ring-red-500/40'
                      : emailCheck.status === 'confirmed'
                        ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                        : 'border-slate-300'
                  }`}
                />
              </div>

              {emailCheck.status === 'mismatch' && (
                <div
                  id="pro-email-status-error"
                  className="text-[12px] font-bold text-red-600 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Los correos no coinciden</span>
                </div>
              )}

              {emailCheck.status === 'invalid_format' && (
                <div
                  id="pro-email-status-invalid"
                  className="text-[12px] font-bold text-red-600 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{emailCheck.message}</span>
                </div>
              )}

              {emailCheck.status === 'pending_confirm' && (
                <div className="text-[11.5px] font-semibold text-amber-700">
                  {emailCheck.message}
                </div>
              )}

              {emailCheck.status === 'confirmed' && (
                <div
                  id="pro-email-status-ok"
                  className="text-[12px] font-extrabold text-emerald-700 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>Correo confirmado</span>
                </div>
              )}
            </div>
          ) : (
            <div
              id="pro-short-key-no-email-note"
              className="text-[11.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-2 flex items-start gap-1.5 leading-snug"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
              <span>
                Válido para cualquier PIN o código de prueba (3 días, 30 días o vitalicio): activación inmediata sin correo electrónico.
              </span>
            </div>
          )}

          <button
            type="button"
            id="btn-pro-activar-pin"
            disabled={isActivateDisabled}
            onClick={() => void handleActivate()}
            className="w-full min-h-[46px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:opacity-70 text-white font-extrabold text-[13.5px] cursor-pointer transition-colors"
          >
            {activating ? 'Verificando...' : 'Activar'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==================== MODAL SEGURIDAD ADMINISTRADOR (EXTRAÍDO A AdminGateModal.tsx) ==================== */
export { AdminGateModal, AdminAuthModal } from './AdminGateModal';

/* ==================== EMPAQUETADO CLOUDFLARE PAGES (JSZip CDN + Datos/Fotos del Dispositivo) ==================== */
interface JSZipInstance {
  file: (name: string, data: string | Blob) => JSZipInstance;
  generateAsync: (options: { type: 'blob'; compression?: string }) => Promise<Blob>;
}

type JSZipConstructor = new () => JSZipInstance;

export const CLOUDFLARE_HEADERS_TXT = `/
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-cache

/index.html
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-cache

/manifest.json
  Content-Type: application/manifest+json; charset=utf-8
  Cache-Control: no-cache

/sw.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: no-cache
`;

export const CLOUDFLARE_REDIRECTS_TXT = `/* /index.html 200
`;

export const FALLBACK_MANIFEST_JSON = JSON.stringify(
  {
    id: './',
    name: 'Aluminero Pro',
    short_name: 'Aluminero',
    description:
      'Calculadora técnica y cotizador de taller para maestros alumineros: plano SVG animado, despiece, inventario de tramos y sobrantes, catálogo y PDF.',
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#090d16',
    background_color: '#090d16',
    lang: 'es',
    icons: [
      { src: './pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: './pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: './pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: './pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
  null,
  2
);

export const FALLBACK_SW_JS = `const CACHE_NAME = 'aluminero-pro-v42-20261122';
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-192x192.png',
  './pwa-maskable-512x512.png',
  './apple-touch-icon.png',
];

function normalizePushPayload(raw) {
  const fallback = {
    title: 'Recordatorio de Cotización · Aluminero Pro',
    body: 'Tienes una cotización pendiente por dar seguimiento al cliente.',
    tag: 'aluminero-quote-push',
    renotify: true,
    icon: './pwa-192x192.png',
    badge: './pwa-192x192.png',
    requireInteraction: true,
    actions: [
      { action: 'open-quote', title: 'Abrir cotización' },
      { action: 'snooze-1d', title: 'Posponer 1 día' },
    ],
    data: { type: 'quote-followup', reminderId: '', url: './?view=hoja' },
  };
  if (!raw || typeof raw !== 'object') return fallback;
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
  const reminderId = String(raw.reminderId || data.reminderId || '').trim();
  return {
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : fallback.title,
    body: typeof raw.body === 'string' && raw.body.trim() ? raw.body.trim() : fallback.body,
    tag: typeof raw.tag === 'string' && raw.tag.trim() ? raw.tag.trim() : fallback.tag,
    renotify: raw.renotify !== false,
    icon: typeof raw.icon === 'string' && raw.icon.trim() ? raw.icon : fallback.icon,
    badge: typeof raw.badge === 'string' && raw.badge.trim() ? raw.badge : fallback.badge,
    requireInteraction: raw.requireInteraction !== false,
    actions: Array.isArray(raw.actions) && raw.actions.length > 0 ? raw.actions : fallback.actions,
    data: {
      type: 'quote-followup',
      reminderId,
      url: typeof data.url === 'string' && data.url.trim() ? data.url : (reminderId ? './?view=hoja&reminderId=' + encodeURIComponent(reminderId) : fallback.data.url),
    },
  };
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        APP_SHELL_ASSETS.map((asset) =>
          cache.add(new Request(asset, { cache: 'reload' })).catch(() => {})
        )
      )
    )
  );
});

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (msg.type === 'SHOW_QUOTE_REMINDER') {
    const payload = normalizePushPayload(msg.payload || {});
    event.waitUntil(
      self.registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        renotify: payload.renotify,
        icon: payload.icon,
        badge: payload.badge,
        requireInteraction: payload.requireInteraction,
        actions: payload.actions,
        data: payload.data,
      })
    );
  }
});

self.addEventListener('push', (event) => {
  let raw = {};
  if (event.data) {
    try { raw = event.data.json(); } catch {
      try { const text = event.data.text(); raw = text ? { body: text } : {}; } catch { raw = {}; }
    }
  }
  const payload = normalizePushPayload(raw);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      renotify: payload.renotify,
      icon: payload.icon,
      badge: payload.badge,
      requireInteraction: payload.requireInteraction,
      actions: payload.actions,
      data: payload.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action || 'open-quote';
  const data = (notification && notification.data) || {};
  const reminderId = typeof data.reminderId === 'string' ? data.reminderId : '';
  notification.close();
  const targetUrl = action === 'snooze-1d'
    ? './?reminderAction=snooze-1d&reminderId=' + encodeURIComponent(reminderId)
    : (typeof data.url === 'string' && data.url.trim() ? data.url : './?view=hoja&reminderId=' + encodeURIComponent(reminderId));
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus().catch(() => {});
          client.postMessage({ type: 'SW_REMINDER_ACTION', action, reminderId });
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
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

export async function ensureJSZipLoaded(): Promise<JSZipConstructor> {
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

export function escapeInlineScriptContent(code: string): string {
  return code.replace(new RegExp('</scr' + 'ipt', 'gi'), '<\\/scr' + 'ipt');
}

export function escapeInlineStyleContent(css: string): string {
  return css.replace(new RegExp('</sty' + 'le', 'gi'), '<\\/sty' + 'le');
}

export function injectDeviceSeedIntoHtml(baseHtml: string, backupData: AlumineroBackupPayload): string {
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
  // Importante: construimos el carácter '<' en tiempo de ejecución para que el minificador (Rolldown)
  // nunca genere un literal '<script id="aluminero-embedded-data">' dentro del bundle JS compilado.
  const lt = String.fromCharCode(60);
  const openSeedTag = `${lt}script id="aluminero-embedded-data">`;
  const seedStartMarker = `${lt}!--ALUM_SEED_START-->`;
  const seedEndMarker = `${lt}!--ALUM_SEED_END-->`;
  const seedBlock = `${seedStartMarker}${openSeedTag}${seedBody}${CLOSE_SCRIPT_TAG}${seedEndMarker}`;

  // Solo limpiamos semillas previas dentro del bloque <head> (antes del bundle <script type="module">)
  // para nunca tocar ni truncar el código compilado de la aplicación.
  const headCloseIdx = baseHtml.search(/<\/head>/i);
  const moduleScriptIdx = baseHtml.search(new RegExp('<scr' + 'ipt\\b[^>]*type=["\']module["\']', 'i'));
  const safePrefixEnd =
    headCloseIdx !== -1 && moduleScriptIdx !== -1
      ? Math.min(headCloseIdx, moduleScriptIdx)
      : headCloseIdx !== -1
        ? headCloseIdx
        : moduleScriptIdx !== -1
          ? moduleScriptIdx
          : 0;

  let headSlice = baseHtml.slice(0, safePrefixEnd);
  const restSlice = baseHtml.slice(safePrefixEnd);

  const markedSeedRe = new RegExp(
    '<!--ALUM_' + 'SEED_START-->[\\s\\S]*?<!--ALUM_' + 'SEED_END-->\\s*',
    'g'
  );
  const legacySeedRe = new RegExp(
    '<scr' + 'ipt\\b[^>]*\\bid=["\']aluminero-embedded-data["\'][^>]*>[\\s\\S]*?<\\/scr' + 'ipt>\\s*',
    'gi'
  );
  headSlice = headSlice.replace(markedSeedRe, '').replace(legacySeedRe, '');

  const headOpenMatch = headSlice.match(/<head\b[^>]*>/i);
  if (headOpenMatch && headOpenMatch.index !== undefined) {
    const insertAt = headOpenMatch.index + headOpenMatch[0].length;
    return `${headSlice.slice(0, insertAt)}\n    ${seedBlock}${headSlice.slice(insertAt)}${restSlice}`;
  }

  const rebuilt = `${headSlice}${restSlice}`;
  if (/<head\b[^>]*>/i.test(rebuilt)) {
    return rebuilt.replace(/<head\b[^>]*>/i, (match) => `${match}\n    ${seedBlock}`);
  }
  return `${seedBlock}\n${rebuilt}`;
}

/* ==================== MODAL PANEL ADMINISTRADOR (4 Planes + Días Exactos + Historial de Claves) ==================== */
interface AdminModalProps {
  open: boolean;
  deviceId: string;
  licencia?: LicenciaState | null;
  isTrialActive?: boolean;
  trialExpiresAt?: number | null;
  adminKeys: AdminKeyRecord[];
  revokedDevicesMap?: Record<string, number>;
  revokedKeys?: string[];
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
    block?: boolean;
    recordKeyOnly?: boolean;
  }) => Promise<boolean | void> | void;
  onClose: () => void;
  onActivateLic: (lic: LicenciaState) => void;
  onRecordAdminKey: (rec: AdminKeyRecord) => void;
  onDeleteAdminKey: (rec: AdminKeyRecord) => Promise<void> | void;
  onRevokeDevicePromo: (targetDeviceId: string, keyRecordId?: string, keyCode?: string) => Promise<boolean | void> | void;
  onRevokeFreeAccess?: (targetDeviceId: string, keyCode?: string) => Promise<boolean | void> | void;
  onImportFormulas: (imported: FormulaPersonalizada[]) => void;
  onImportBackup: (payload: AlumineroBackupPayload) => void;
  sugerenciasWhatsapp: string;
  onSaveSugerenciasWhatsapp: (phone: string) => void;
  trabajosAntesDespues?: TrabajoAntesDespuesItem[];
  onPublishTrabajoAprobado?: (item: Omit<TrabajoAntesDespuesItem, 'id' | 'fecha' | 'aprobado'>) => void;
  onDeleteTrabajoAprobado?: (id: string) => void;
  referralHistory?: ReferralHistoryRecord[];
  onAddReferralRecord?: (rec: Omit<ReferralHistoryRecord, 'id' | 'createdAt'>) => void;
  onDeleteReferralRecord?: (id: string) => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  open,
  deviceId,
  licencia = null,
  isTrialActive = false,
  trialExpiresAt = null,
  adminKeys,
  revokedDevicesMap = {},
  revokedKeys = [],
  formulas,
  backupData,
  cloudDevices,
  cloudStats,
  onRefreshCloud,
  onCloudActivateDevice,
  onClose,
  onActivateLic,
  onRecordAdminKey,
  onDeleteAdminKey,
  onRevokeDevicePromo,
  onRevokeFreeAccess,
  onImportFormulas,
  onImportBackup,
  sugerenciasWhatsapp,
  onSaveSugerenciasWhatsapp,
  trabajosAntesDespues = [],
  onPublishTrabajoAprobado,
  onDeleteTrabajoAprobado,
  referralHistory = [],
  onAddReferralRecord,
  onDeleteReferralRecord,
  onShowToast,
}) => {
  const [adminTab, setAdminTab] = useState<'general' | 'referidos'>('general');
  const [refSearch, setRefSearch] = useState('');
  const [refReferrerInput, setRefReferrerInput] = useState('');
  const [refReferredIdInput, setRefReferredIdInput] = useState('');
  const [refReferredNameInput, setRefReferredNameInput] = useState('');
  const [refPlanSelect, setRefPlanSelect] = useState('M|Promo 30 Días PRO|$350 MXN');
  const [targetDevice, setTargetDevice] = useState(deviceId);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [planIdx, setPlanIdx] = useState(0); // idx 0 = Promoción 3 Días (Regalo)
  const [customDaysStr, setCustomDaysStr] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [downloadingHtml, setDownloadingHtml] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [waSugerenciasInput, setWaSugerenciasInput] = useState(sugerenciasWhatsapp);
  const [waSugerenciasError, setWaSugerenciasError] = useState('');
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [pendingDeleteKeyRec, setPendingDeleteKeyRec] = useState<AdminKeyRecord | null>(null);
  const [pendingRevokePromo, setPendingRevokePromo] = useState<{
    deviceId: string;
    cliente: string;
    planLabel: string;
    keyRecordId?: string;
    keyCode?: string;
  } | null>(null);
  const [pendingRevokeFree, setPendingRevokeFree] = useState<{
    deviceId: string;
    cliente: string;
    keyCode?: string;
  } | null>(null);
  const [adTitulo, setAdTitulo] = useState('');
  const [adLinea, setAdLinea] = useState('Línea Nacional 3"');
  const [adDesc, setAdDesc] = useState('');
  const [adAntesUrl, setAdAntesUrl] = useState('');
  const [adDespuesUrl, setAdDespuesUrl] = useState('');
  const importFormulasRef = useRef<HTMLInputElement>(null);
  const importBackupRef = useRef<HTMLInputElement>(null);
  const adminAntesRef = useRef<HTMLInputElement>(null);
  const adminDespuesRef = useRef<HTMLInputElement>(null);

  const filteredReferrals = useMemo(() => {
    const q = refSearch.trim().toLowerCase();
    if (!q) return referralHistory;
    return referralHistory.filter(
      (r) =>
        r.referrerId.toLowerCase().includes(q) ||
        r.referredDeviceId.toLowerCase().includes(q) ||
        (r.referredName || '').toLowerCase().includes(q) ||
        r.planLabel.toLowerCase().includes(q)
    );
  }, [referralHistory, refSearch]);

  const uniqueReferrersCount = useMemo(() => {
    return new Set(referralHistory.map((r) => r.referrerId.trim().toUpperCase())).size;
  }, [referralHistory]);

  useEffect(() => {
    if (!open) return;
    setNowTick(Date.now());
    const id = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  const revokedKeysSet = useMemo(
    () => new Set(revokedKeys.map((k) => k.trim().toUpperCase())),
    [revokedKeys]
  );

  const registeredDevices = useMemo<CloudDeviceRecord[]>(() => {
    const cleanSelfId = deviceId.trim().toUpperCase();
    const now = nowTick;
    const today = new Date(now).toISOString().slice(0, 10);
    const localKeyRevoked = Boolean(
      licencia?.activatedKey && revokedKeysSet.has(licencia.activatedKey.trim().toUpperCase())
    );
    const localAuthorizedPro = Boolean(
      !localKeyRevoked &&
      licencia &&
      licencia.active &&
      (Boolean(licencia.activatedKey?.trim()) || Boolean(licencia.adminAssigned)) &&
      isProActive(licencia, now)
    );
    const latestSelfKey =
      adminKeys.find((k) => k.deviceId.trim().toUpperCase() === cleanSelfId)?.key || '';
    const selfDisplayName =
      backupData.taller?.clienteDefault?.trim() ||
      backupData.taller?.nombre?.trim() ||
      'Este equipo';

    const byId = new Map<string, CloudDeviceRecord>();
    for (const dev of cloudDevices) {
      const normId = dev.deviceId.trim().toUpperCase();
      if (!normId) continue;
      const localRevokedTs = revokedDevicesMap[normId] ?? 0;
      const isBlocked = Boolean(dev.blocked || dev.planCode === 'BLOCKED');
      const serverRevoked = Boolean(dev.revoked || dev.planCode === 'REVOKED');
      const unassignedAutoTrial = !isBlocked && !serverRevoked && isUnassignedAutoTrialDevice(dev);

      if (isBlocked) {
        byId.set(normId, {
          ...dev,
          deviceId: normId,
          cliente:
            normId === cleanSelfId && (!dev.cliente || dev.cliente === 'Cliente sin nombre')
              ? selfDisplayName
              : dev.cliente || 'Cliente sin nombre',
          proActive: false,
          revoked: true,
          blocked: true,
          planCode: 'BLOCKED',
          planLabel: 'Bloqueado',
          expiresAt: null,
          lastKey: dev.lastKey || (normId === cleanSelfId ? latestSelfKey : ''),
        });
      } else if (normId === cleanSelfId) {
        const cloudValid =
          !unassignedAutoTrial &&
          !serverRevoked &&
          dev.proActive &&
          (dev.expiresAt === null || dev.expiresAt > now);
        const effectivePro = !localKeyRevoked && (localAuthorizedPro || cloudValid);
        const isSelfRevoked = localKeyRevoked || (!effectivePro && (serverRevoked || localRevokedTs > 0));
        byId.set(normId, {
          ...dev,
          deviceId: normId,
          cliente: dev.cliente && dev.cliente !== 'Cliente sin nombre' ? dev.cliente : selfDisplayName,
          proActive: effectivePro,
          revoked: isSelfRevoked,
          blocked: false,
          planCode: isSelfRevoked
            ? 'REVOKED'
            : localAuthorizedPro
              ? licencia!.planCode
              : cloudValid
                ? dev.planCode
                : 'FREE',
          planLabel: isSelfRevoked
            ? 'Versión Gratuita'
            : localAuthorizedPro
              ? licencia!.planLabel
              : cloudValid
                ? dev.planLabel
                : 'Versión Gratuita',
          expiresAt: isSelfRevoked
            ? null
            : localAuthorizedPro
              ? licencia!.expiresAt
              : cloudValid
                ? dev.expiresAt
                : null,
          lastKey: dev.lastKey || latestSelfKey,
        });
      } else {
        const isDevRevoked = serverRevoked || localRevokedTs > (dev.updatedAt ?? 0);
        const otherCloudValid =
          !isDevRevoked &&
          !unassignedAutoTrial &&
          dev.proActive &&
          (dev.expiresAt === null || dev.expiresAt > now);
        byId.set(normId, {
          ...dev,
          deviceId: normId,
          proActive: otherCloudValid,
          revoked: isDevRevoked,
          blocked: false,
          planCode: isDevRevoked ? 'REVOKED' : unassignedAutoTrial ? 'FREE' : dev.planCode,
          planLabel: isDevRevoked || unassignedAutoTrial ? 'Versión Gratuita' : dev.planLabel,
          expiresAt: isDevRevoked || unassignedAutoTrial ? null : dev.expiresAt,
        });
      }
    }

    if (cleanSelfId && !byId.has(cleanSelfId)) {
      const selfRevokedTs = revokedDevicesMap[cleanSelfId] ?? 0;
      const effectiveSelfPro = localAuthorizedPro;
      const isSelfRevoked = !effectiveSelfPro && selfRevokedTs > 0;
      byId.set(cleanSelfId, {
        deviceId: cleanSelfId,
        cliente: selfDisplayName,
        deviceLabel: detectDeviceLabel(),
        firstSeenAt: now,
        lastSeenAt: now,
        totalSessions: 1,
        totalMinutes: 1,
        activeDays: [today],
        proActive: effectiveSelfPro,
        revoked: isSelfRevoked,
        blocked: false,
        planCode: isSelfRevoked ? 'REVOKED' : localAuthorizedPro ? licencia!.planCode : 'FREE',
        planLabel: isSelfRevoked
          ? 'Versión Gratuita'
          : localAuthorizedPro
            ? licencia!.planLabel
            : 'Versión Gratuita',
        expiresAt: isSelfRevoked ? null : localAuthorizedPro ? licencia!.expiresAt : null,
        lastKey: latestSelfKey,
        updatedAt: now,
      });
    }

    return Array.from(byId.values()).sort((a, b) => {
      if (a.deviceId === cleanSelfId) return -1;
      if (b.deviceId === cleanSelfId) return 1;
      return b.lastSeenAt - a.lastSeenAt;
    });
  }, [cloudDevices, deviceId, licencia, adminKeys, backupData.taller, revokedDevicesMap, revokedKeysSet, nowTick]);

  const unifiedHistoryItems = useMemo(() => {
    const cleanSelfId = deviceId.trim().toUpperCase();
    const keyByDevice = new Map<string, AdminKeyRecord>();
    for (const k of adminKeys) {
      const norm = normalizeDeviceIdInput(k.deviceId);
      if (!norm) continue;
      const existing = keyByDevice.get(norm);
      if (!existing || (!k.revoked && existing.revoked) || k.createdAt > existing.createdAt) {
        keyByDevice.set(norm, k);
      }
    }

    const devById = new Map<string, CloudDeviceRecord>();
    for (const d of registeredDevices) {
      const norm = normalizeDeviceIdInput(d.deviceId);
      if (norm) devById.set(norm, d);
    }

    const allIds = Array.from(new Set([...devById.keys(), ...keyByDevice.keys()]));
    return allIds
      .map((normDev) => {
        const dev = devById.get(normDev) ?? null;
        const keyRec = keyByDevice.get(normDev) ?? null;
        const isSelf = normDev === cleanSelfId;
        const isBlocked = Boolean(dev?.blocked || dev?.planCode === 'BLOCKED');
        const keyCode = (keyRec?.key || dev?.lastKey || '').trim().toUpperCase();
        const localRevokedTs = revokedDevicesMap[normDev] ?? 0;
        const isKeyRevoked = Boolean(
          keyRec &&
            (keyRec.revoked ||
              localRevokedTs >= keyRec.createdAt ||
              revokedKeysSet.has(keyCode))
        );
        const isDevRevoked = Boolean(dev && (dev.revoked || dev.planCode === 'REVOKED'));

        const devHasActivePro = Boolean(
          dev &&
            !isBlocked &&
            !isDevRevoked &&
            dev.proActive &&
            (dev.expiresAt === null || dev.expiresAt > nowTick)
        );
        const keyHasActivePromo = Boolean(
          keyRec &&
            !isBlocked &&
            !isKeyRevoked &&
            (!dev || !isDevRevoked) &&
            (keyRec.expiresAt === null || keyRec.expiresAt > nowTick)
        );
        const hasActivePromoOrPro = !isBlocked && (devHasActivePro || keyHasActivePromo);

        const isRevoked =
          !isBlocked &&
          !hasActivePromoOrPro &&
          (isKeyRevoked || isDevRevoked || (Boolean(keyCode) && revokedKeysSet.has(keyCode)));

        const rawPlanLabel = devHasActivePro
          ? dev?.planLabel || keyRec?.planLabel || 'PRO'
          : keyRec?.planLabel || dev?.planLabel || 'Versión Gratuita';
        const isPromoOrTrial =
          dev?.planCode === 'G' ||
          keyRec?.dias === 3 ||
          /^AP-G-/i.test(keyCode) ||
          /promoci[oó]n|prueba|regalo|d[ií]as/i.test(rawPlanLabel);

        let statusText = 'Versión Gratuita';
        let statusClass = 'border-slate-300 bg-slate-100 text-slate-700';
        if (isBlocked) {
          statusText = 'Bloqueado';
          statusClass = 'border-red-300 bg-red-50 text-red-700';
        } else if (isRevoked) {
          statusText = 'Revocado';
          statusClass = 'border-amber-300 bg-amber-50 text-amber-800';
        } else if (hasActivePromoOrPro) {
          if (isPromoOrTrial) {
            statusText = rawPlanLabel.toLowerCase().includes('promoción') || rawPlanLabel.toLowerCase().includes('prueba')
              ? rawPlanLabel
              : `Promoción ${rawPlanLabel}`;
            statusClass = 'border-blue-300 bg-blue-50 text-blue-800';
          } else {
            statusText = 'PRO Activo';
            statusClass = 'border-emerald-300 bg-emerald-50 text-emerald-800';
          }
        }

        const cliente =
          dev?.cliente && dev.cliente !== 'Cliente sin nombre'
            ? dev.cliente
            : keyRec?.cliente || dev?.cliente || 'Cliente sin nombre';
        const linkedEmail = dev?.linkedEmail || keyRec?.linkedEmail || '';
        const createdAt = keyRec?.createdAt || dev?.firstSeenAt || dev?.updatedAt || nowTick;
        const expiresAt = isBlocked || isRevoked
          ? null
          : devHasActivePro
            ? dev?.expiresAt ?? keyRec?.expiresAt ?? null
            : keyRec?.expiresAt ?? dev?.expiresAt ?? null;

        const deleteRecord: AdminKeyRecord = keyRec
          ? { ...keyRec, deviceId: normDev, cliente }
          : {
              id: `FREE-${normDev}`,
              deviceId: normDev,
              cliente,
              planLabel: statusText,
              dias: null,
              key: '',
              createdAt,
              expiresAt: null,
              linkedEmail: linkedEmail || undefined,
            };

        return {
          normDev,
          isSelf,
          dev,
          keyRec,
          keyCode,
          cliente,
          linkedEmail,
          isBlocked,
          isRevoked,
          hasActivePromoOrPro,
          statusText,
          statusClass,
          promoLabelForDialog: rawPlanLabel || statusText,
          createdAt,
          expiresAt,
          deleteRecord,
        };
      })
      .sort((a, b) => {
        if (a.isSelf) return -1;
        if (b.isSelf) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [registeredDevices, adminKeys, deviceId, revokedDevicesMap, revokedKeysSet, nowTick]);

  const effectiveStats = useMemo<UsageStats30d>(
    () => computeUsageStats30d(registeredDevices, nowTick),
    [registeredDevices, nowTick]
  );

  const dailySeries30d = useMemo(
    () => buildDailyUsageSeries30d(registeredDevices),
    [registeredDevices]
  );

  const parsedCustomDays = customDaysStr.trim() ? Math.max(1, Math.min(3650, Math.round(Number(customDaysStr) || 0))) : null;

  useEffect(() => {
    if (open) {
      setTargetDevice(deviceId);
      const hasNameNow = clienteNombre.trim().length > 0;
      const hasPhoneNow = clienteTelefono.replace(/\D/g, '').length > 0;
      setGeneratedKey(
        hasNameNow && hasPhoneNow ? generateActivationKey(deviceId, planIdx, parsedCustomDays) : ''
      );
      setWaSugerenciasInput(sugerenciasWhatsapp);
      setWaSugerenciasError('');
      setPendingDeleteKeyRec(null);
      setPendingRevokePromo(null);
      setPendingRevokeFree(null);
      void onRefreshCloud();
    }
  }, [open, deviceId, sugerenciasWhatsapp]);

  if (!open) return null;

  const normalizedTargetDevice = normalizeDeviceIdInput(targetDevice, deviceId);
  const hasClienteNombre = clienteNombre.trim().length > 0;
  const hasClienteTelefono = clienteTelefono.replace(/\D/g, '').length > 0;
  const hasClientRequiredInfo = hasClienteNombre && hasClienteTelefono;

  const refreshKey = (
    dev = targetDevice,
    idx = planIdx,
    days = parsedCustomDays,
    nameOverride = clienteNombre,
    phoneOverride = clienteTelefono
  ) => {
    if (!nameOverride.trim() || phoneOverride.replace(/\D/g, '').length === 0) {
      setGeneratedKey('');
      return '';
    }
    const resolvedDev = normalizeDeviceIdInput(dev, deviceId);
    const key = generateActivationKey(resolvedDev, idx, days);
    setGeneratedKey(key);
    return key;
  };

  const buildClientMessage = (rec: { cliente: string; deviceId: string; planLabel: string; key: string; expiresAt: number | null }) => {
    const vence = rec.expiresAt ? new Date(rec.expiresAt).toLocaleDateString('es-MX') : 'Vitalicia';
    const cleanClient = formatClientHeaderDisplay(rec.cliente);
    return `Hola${cleanClient && cleanClient !== 'Cliente sin nombre' ? ` ${cleanClient}` : ''}, aquí tienes tu clave Aluminero Pro (${rec.planLabel}, vence ${vence}) para el equipo ${rec.deviceId}: ${rec.key}`;
  };

  const handleSaveToHistory = (keyOverride?: string, syncCloudRecordOnly = false): boolean => {
    if (!clienteNombre.trim() || clienteTelefono.replace(/\D/g, '').length === 0) {
      onShowToast('Escribe el nombre y teléfono del cliente para generar su clave');
      return false;
    }
    const key = keyOverride || refreshKey();
    const now = Date.now();
    const plan = PLANS.find((p) => p.idx === planIdx) || PLANS[0];
    const dias = parsedCustomDays ?? plan.days;
    const planLabel = parsedCustomDays ? `Reposición ${parsedCustomDays} días` : plan.label;
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

    if (syncCloudRecordOnly) {
      void Promise.resolve(
        onCloudActivateDevice({
          deviceId: cleanTarget,
          cliente: cleanCliente,
          planCode: parsedCustomDays ? `D${parsedCustomDays}` : plan.code,
          planLabel,
          expiresAt,
          key,
          dias,
          recordKeyOnly: true,
        })
      ).catch(() => false);
    }
    return true;
  };

  const resetAdminFormFields = () => {
    setClienteNombre('');
    setClienteTelefono('');
    setTargetDevice('');
    setCustomDaysStr('');
    setGeneratedKey('');
  };

  const handleCopyKeyAndSave = async () => {
    if (!clienteNombre.trim() || clienteTelefono.replace(/\D/g, '').length === 0) {
      onShowToast('Escribe el nombre y teléfono del cliente para generar su clave');
      return;
    }
    const key = refreshKey();
    const saved = handleSaveToHistory(key, true);
    if (!saved) return;
    await navigator.clipboard.writeText(key).catch(() => {});
    resetAdminFormFields();
    onShowToast('Clave copiada y sincronizada en la nube', true);
  };

  const handleActivateDirect = async () => {
    if (!clienteNombre.trim() || clienteTelefono.replace(/\D/g, '').length === 0) {
      onShowToast('Escribe el nombre y teléfono del cliente para generar su clave');
      return;
    }
    const cleanTarget = normalizeDeviceIdInput(targetDevice, deviceId);
    if (!cleanTarget) {
      onShowToast('Escribe el ID de Equipo del cliente antes de activar');
      return;
    }
    const key = refreshKey(cleanTarget, planIdx, parsedCustomDays);
    const now = Date.now();
    const plan = PLANS.find((p) => p.idx === planIdx) || PLANS[0];
    const dias = parsedCustomDays ?? plan.days;
    const planLabel = parsedCustomDays ? `Reposición ${parsedCustomDays} días` : plan.label;
    const planCode = parsedCustomDays ? `D${parsedCustomDays}` : plan.code;
    const ms = dias * 24 * 60 * 60 * 1000;
    const expiresAt = now + ms;
    const isSelf = cleanTarget === deviceId.trim().toUpperCase();
    const cleanCliente = formatCombinedClientLabel(clienteNombre, clienteTelefono);

    handleSaveToHistory(key, false);

    if (isSelf) {
      onActivateLic({
        active: true,
        planCode,
        planLabel,
        expiresAt,
        activatedAt: now,
        activatedKey: key,
      });
    }

    let syncedOk: boolean | void = false;
    try {
      syncedOk = await onCloudActivateDevice({
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
    } catch {
      syncedOk = false;
    }

    if (syncedOk === false) {
      onShowToast(`No se pudo conectar con la nube para activar a ${cleanTarget}. Revisa tu conexión.`);
      return;
    }

    resetAdminFormFields();
    onShowToast(
      isSelf
        ? `Plan "${planLabel}" activado en este equipo`
        : `Plan "${planLabel}" activado en la nube para ${cleanTarget}`,
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
          'input[type="password"], #inp-admin-password, #inp-lic-key, #inp-admin-cliente, #inp-admin-telefono, #inp-admin-device, #inp-admin-dias'
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

    void CLOSE_STYLE_TAG;
    const finalHtml = injectDeviceSeedIntoHtml(baseHtml, backupData);
    if (!finalHtml.includes('id="root"') || !/<\/body>/i.test(finalHtml)) {
      throw new Error('El HTML exportado resultó incompleto');
    }
    return finalHtml;
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

  const fetchBinaryAssetOptional = async (assetPath: string): Promise<Blob | null> => {
    try {
      const res = await fetch(assetPath, { cache: 'no-store' });
      if (!res.ok) return null;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) return null;
      return await res.blob();
    } catch {
      return null;
    }
  };

  const handleDownloadCloudflareZip = async () => {
    setDownloadingZip(true);
    try {
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
        fetchStaticAssetOrFallback('/manifest.json', FALLBACK_MANIFEST_JSON, true),
        fetchStaticAssetOrFallback('/sw.js', FALLBACK_SW_JS, false),
        Promise.all(iconFiles.map((name) => fetchBinaryAssetOptional(`/${name}`))),
      ]);

      const zip = new JSZip();
      zip.file('index.html', fullHtml);
      zip.file('manifest.json', manifestText);
      zip.file('sw.js', swText);
      zip.file('_headers', CLOUDFLARE_HEADERS_TXT);
      zip.file('_redirects', CLOUDFLARE_REDIRECTS_TXT);
      iconFiles.forEach((name, idx) => {
        const blob = iconBlobs[idx];
        if (blob) {
          zip.file(name, blob);
        }
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
      onShowToast('Paquete aluminero_cloudflare.zip listo para Cloudflare Pages', true);
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

  const confirmModalsNode = (
    <>
      {pendingDeleteKeyRec && (
        <div
          id="modal-confirm-delete-admin-key"
          className="fixed inset-0 z-[9999] bg-slate-950/75 flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="lbl-confirm-delete-admin-key"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setPendingDeleteKeyRec(null);
          }}
        >
          <div
            className="w-full max-w-[380px] rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} aria-hidden="true" />
              </span>
              <div>
                <h4 id="lbl-confirm-delete-admin-key" className="m-0 text-[14.5px] font-extrabold text-slate-900 leading-snug">
                  ¿Estás seguro que deseas borrar este usuario de la lista de historial?
                </h4>
                <p className="m-0 mt-1.5 text-[12px] text-slate-600">
                  {formatClientHeaderDisplay(pendingDeleteKeyRec.cliente)} ·{' '}
                  <span className="mono font-bold text-blue-700">{pendingDeleteKeyRec.deviceId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                id="btn-cancel-delete-admin-key"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDeleteKeyRec(null);
                }}
                className="min-h-[40px] px-4 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-admin-key"
                onClick={(e) => {
                  e.stopPropagation();
                  const targetRec = pendingDeleteKeyRec;
                  setPendingDeleteKeyRec(null);
                  void onDeleteAdminKey(targetRec);
                }}
                className="min-h-[40px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-extrabold cursor-pointer"
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingRevokePromo && (
        <div
          id="modal-confirm-revoke-promo"
          className="fixed inset-0 z-[9999] bg-slate-950/75 flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="lbl-confirm-revoke-promo"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setPendingRevokePromo(null);
          }}
        >
          <div
            className="w-full max-w-[400px] rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <div>
                <h4 id="lbl-confirm-revoke-promo" className="m-0 text-[14.5px] font-extrabold text-slate-900 leading-snug">
                  ¿Seguro deseas quitarle la promoción {pendingRevokePromo.planLabel} a este usuario?
                </h4>
                <p className="m-0 mt-1.5 text-[12px] text-slate-600">
                  {formatClientHeaderDisplay(pendingRevokePromo.cliente)} ·{' '}
                  <span className="mono font-bold text-blue-700">{pendingRevokePromo.deviceId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                id="btn-cancel-revoke-promo"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingRevokePromo(null);
                }}
                className="min-h-[40px] px-4 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-revoke-promo"
                onClick={(e) => {
                  e.stopPropagation();
                  const target = pendingRevokePromo;
                  setPendingRevokePromo(null);
                  void onRevokeDevicePromo(target.deviceId, target.keyRecordId, target.keyCode);
                }}
                className="min-h-[40px] px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-extrabold cursor-pointer"
              >
                Sí, quitar promoción
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingRevokeFree && (
        <div
          id="modal-confirm-revoke-free"
          className="fixed inset-0 z-[9999] bg-slate-950/75 flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="lbl-confirm-revoke-free"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setPendingRevokeFree(null);
          }}
        >
          <div
            className="w-full max-w-[400px] rounded-2xl bg-white text-slate-900 p-5 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <div>
                <h4 id="lbl-confirm-revoke-free" className="m-0 text-[14.5px] font-extrabold text-slate-900 leading-snug">
                  ¿Seguro deseas revocar el acceso gratuito a este usuario?
                </h4>
                <p className="m-0 mt-1.5 text-[12px] text-slate-600">
                  {formatClientHeaderDisplay(pendingRevokeFree.cliente)} ·{' '}
                  <span className="mono font-bold text-blue-700">{pendingRevokeFree.deviceId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                id="btn-cancel-revoke-free"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingRevokeFree(null);
                }}
                className="min-h-[40px] px-4 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-revoke-free"
                onClick={(e) => {
                  e.stopPropagation();
                  const target = pendingRevokeFree;
                  setPendingRevokeFree(null);
                  void onRevokeFreeAccess?.(target.deviceId, target.keyCode);
                }}
                className="min-h-[40px] px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-extrabold cursor-pointer"
              >
                Sí, revocar acceso
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
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
              Planes oficiales, reposición de días exactos, referidos e historial de clientes
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

        {/* Pestañas del Panel de Administrador */}
        <div
          role="tablist"
          aria-label="Secciones del Panel de Administrador"
          className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 mb-3.5"
        >
          <button
            type="button"
            role="tab"
            id="tab-admin-general"
            aria-selected={adminTab === 'general'}
            onClick={() => setAdminTab('general')}
            className={`min-h-[38px] px-3 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all ${
              adminTab === 'general'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Licencias y Panel
          </button>
          <button
            type="button"
            role="tab"
            id="tab-admin-referidos"
            aria-selected={adminTab === 'referidos'}
            onClick={() => setAdminTab('referidos')}
            className={`min-h-[38px] px-3 rounded-lg text-[12.5px] font-extrabold cursor-pointer transition-all inline-flex items-center justify-center gap-1.5 ${
              adminTab === 'referidos'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                : 'bg-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Referidos ({referralHistory.length})</span>
          </button>
        </div>

        {adminTab === 'referidos' ? (
          <div id="admin-referidos-panel" className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="block text-[10.5px] font-bold uppercase text-emerald-700">
                  Referidos registrados
                </span>
                <strong className="mono text-[20px] font-extrabold text-emerald-900">
                  {referralHistory.length}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="block text-[10.5px] font-bold uppercase text-blue-700">
                  Colegas referentes
                </span>
                <strong className="mono text-[20px] font-extrabold text-blue-900">
                  {uniqueReferrersCount}
                </strong>
              </div>
            </div>

            {/* Formulario manual para registrar referido desde comprobante WhatsApp */}
            {onAddReferralRecord && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <div className="text-[12px] font-extrabold text-slate-800">
                  Registrar recomendación de colega
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="inp-admin-ref-referrer"
                      className="block text-[11px] font-bold text-slate-600 mb-0.5"
                    >
                      ID de quien recomendó *
                    </label>
                    <input
                      id="inp-admin-ref-referrer"
                      type="text"
                      value={refReferrerInput}
                      onChange={(e) => setRefReferrerInput(e.target.value)}
                      placeholder="Ej. ALM-9X2K"
                      className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 mono text-[12.5px] font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inp-admin-ref-referred"
                      className="block text-[11px] font-bold text-slate-600 mb-0.5"
                    >
                      ID del colega referido *
                    </label>
                    <input
                      id="inp-admin-ref-referred"
                      type="text"
                      value={refReferredIdInput}
                      onChange={(e) => setRefReferredIdInput(e.target.value)}
                      placeholder="Ej. ALM-4M7P"
                      className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 mono text-[12.5px] font-bold uppercase"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor="inp-admin-ref-name"
                      className="block text-[11px] font-bold text-slate-600 mb-0.5"
                    >
                      Nombre / Taller (opcional)
                    </label>
                    <input
                      id="inp-admin-ref-name"
                      type="text"
                      value={refReferredNameInput}
                      onChange={(e) => setRefReferredNameInput(e.target.value)}
                      placeholder="Ej. Taller Hernández"
                      className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-2.5 text-[12.5px] font-semibold"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="sel-admin-ref-plan"
                      className="block text-[11px] font-bold text-slate-600 mb-0.5"
                    >
                      Plan PRO adquirido
                    </label>
                    <select
                      id="sel-admin-ref-plan"
                      value={refPlanSelect}
                      onChange={(e) => setRefPlanSelect(e.target.value)}
                      className="w-full min-h-[38px] rounded-lg border border-slate-300 bg-white px-2 text-[12px] font-bold"
                    >
                      <option value="M|Promo 30 Días PRO|$350 MXN">Promo 30 Días PRO ($350 MXN)</option>
                      <option value="Q|Plan 90 Días PRO|$950 MXN">Plan 90 Días PRO ($950 MXN)</option>
                      <option value="A|Plan 1 Año PRO|$1,800 MXN">Plan 1 Año PRO ($1,800 MXN)</option>
                      <option value="G|Promoción 3 Días|$0 MXN">Promoción 3 Días ($0 MXN)</option>
                      <option value="V|Licencia Vitalicia|Vitalicia">Licencia Vitalicia</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-admin-add-referral"
                  onClick={() => {
                    const cleanReferrer = refReferrerInput.trim().toUpperCase();
                    const cleanReferred = refReferredIdInput.trim().toUpperCase();
                    if (!cleanReferrer || !cleanReferred) {
                      onShowToast('Ingresa el ID de quien recomendó y el ID del colega referido');
                      return;
                    }
                    if (cleanReferrer === cleanReferred) {
                      onShowToast('El ID referente y el ID referido no pueden ser iguales');
                      return;
                    }
                    const [planCode, planLabel, amountLabel] = refPlanSelect.split('|');
                    onAddReferralRecord({
                      referrerId: cleanReferrer,
                      referredDeviceId: cleanReferred,
                      referredName: refReferredNameInput.trim(),
                      planCode: planCode || 'M',
                      planLabel: planLabel || 'Promo 30 Días PRO',
                      amountLabel: amountLabel || '',
                    });
                    setRefReferrerInput('');
                    setRefReferredIdInput('');
                    setRefReferredNameInput('');
                    onShowToast('Referido registrado en el historial', true);
                  }}
                  className="w-full min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[12.5px] cursor-pointer transition-colors"
                >
                  Guardar referido en historial
                </button>
              </div>
            )}

            {/* Buscador e historial de referidos */}
            <div>
              <input
                type="search"
                value={refSearch}
                onChange={(e) => setRefSearch(e.target.value)}
                placeholder="Buscar por ID referente, ID referido, nombre o plan..."
                className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12.5px] font-semibold"
              />
            </div>

            {filteredReferrals.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-[12px] text-slate-500">
                {referralHistory.length === 0
                  ? 'Aún no hay referidos registrados. Se guardan automáticamente cuando un colega invitado activa un plan PRO o al registrarlos manualmente aquí.'
                  : 'No hay coincidencias para tu búsqueda.'}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-0.5">
                {filteredReferrals.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col gap-1.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-slate-800">
                          Recomendó:{' '}
                          <span className="mono text-emerald-700 font-extrabold">{rec.referrerId}</span>
                        </div>
                        <div className="text-[12px] text-slate-700">
                          Colega invitado:{' '}
                          <span className="mono font-bold text-blue-700">{rec.referredDeviceId}</span>
                          {rec.referredName ? ` · ${rec.referredName}` : ''}
                        </div>
                      </div>
                      {onDeleteReferralRecord && (
                        <button
                          type="button"
                          onClick={() => onDeleteReferralRecord(rec.id)}
                          aria-label="Eliminar registro de referido"
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold">
                        {rec.planLabel}
                        {rec.amountLabel ? ` · ${rec.amountLabel}` : ''}
                      </span>
                      <span className="text-[10.5px] text-slate-400 mono">
                        {new Date(rec.createdAt).toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <div id="admin-gen-box" className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="inp-admin-cliente" className="block text-[12px] font-bold text-slate-600 mb-1">
                Nombre del cliente (obligatorio)
              </label>
              <input
                id="inp-admin-cliente"
                type="text"
                required
                value={clienteNombre}
                onChange={(e) => {
                  const val = e.target.value;
                  setClienteNombre(val);
                  refreshKey(targetDevice, planIdx, parsedCustomDays, val, clienteTelefono);
                }}
                placeholder="Ej. Juan Pérez"
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-semibold"
              />
            </div>

            <div>
              <label htmlFor="inp-admin-telefono" className="block text-[12px] font-bold text-slate-600 mb-1">
                Teléfono del cliente (obligatorio)
              </label>
              <input
                id="inp-admin-telefono"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={12}
                required
                value={clienteTelefono}
                onChange={(e) => {
                  const formatted = formatClientPhoneInput(e.target.value, clienteTelefono);
                  setClienteTelefono(formatted);
                  refreshKey(targetDevice, planIdx, parsedCustomDays, clienteNombre, formatted);
                }}
                placeholder="Ej. 555-123-4567"
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 mono text-[13px] font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label htmlFor="inp-admin-device" className="block text-[12px] font-bold text-slate-600">
                ID de Equipo del cliente
              </label>
              {targetDevice.trim().toUpperCase() !== deviceId.trim().toUpperCase() && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetDevice(deviceId);
                    refreshKey(deviceId, planIdx, parsedCustomDays);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  Usar mi ID
                </button>
              )}
            </div>
            <input
              id="inp-admin-device"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={targetDevice}
              placeholder="Ej. ALM-9X2K o 9X2K"
              onChange={(e) => {
                const raw = e.target.value;
                setTargetDevice(raw);
                refreshKey(raw, planIdx, parsedCustomDays);
              }}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 mono text-[13.5px] font-bold uppercase"
            />
            {targetDevice.trim() && normalizedTargetDevice !== targetDevice.trim().toUpperCase() && (
              <span className="block text-[10.5px] font-bold text-blue-700 mt-0.5 mono">
                Equipo destino: {normalizedTargetDevice}
              </span>
            )}
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
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col gap-3">
              <div className="w-full text-center">
                <span className="block text-[10.5px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                  CLAVE GENERADA {parsedCustomDays ? `· REPOSICIÓN ${parsedCustomDays} DÍAS` : ''}
                </span>
                {hasClientRequiredInfo ? (
                  <strong
                    id="lbl-admin-key"
                    className="mono block whitespace-nowrap text-[18px] sm:text-[20px] font-extrabold tracking-wider text-emerald-300 overflow-x-auto"
                  >
                    {generatedKey}
                  </strong>
                ) : (
                  <span id="lbl-admin-key" className="block text-[12.5px] font-bold text-amber-300 mt-0.5">
                    Escribe el nombre y teléfono del cliente para generar su clave
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  id="btn-admin-save-history-only"
                  disabled={!hasClientRequiredInfo}
                  onClick={() => {
                    const key = refreshKey();
                    if (handleSaveToHistory(key, true)) {
                      resetAdminFormFields();
                      onShowToast('Dispositivo y clave guardados en el historial', true);
                    }
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 disabled:opacity-45 disabled:cursor-not-allowed border border-emerald-400/40 text-emerald-200 text-[12.5px] font-bold flex items-center justify-center whitespace-nowrap cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  id="btn-admin-copy-and-save"
                  disabled={!hasClientRequiredInfo}
                  onClick={handleCopyKeyAndSave}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-45 disabled:cursor-not-allowed text-white text-[12.5px] font-bold flex items-center justify-center whitespace-nowrap cursor-pointer"
                >
                  Copiar y Guardar
                </button>
              </div>
            </div>

            <button
              type="button"
              id="btn-admin-activar-aqui"
              disabled={!hasClientRequiredInfo}
              onClick={handleActivateDirect}
              className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-[13.5px] cursor-pointer"
            >
              {normalizedTargetDevice === deviceId.trim().toUpperCase()
                ? 'Activar este plan ahora en este equipo'
                : `Activar este plan en la nube para ${normalizedTargetDevice}`}
            </button>
          </div>

          {/* Historial de Usuarios y Claves (incluye Promociones, PRO y Versión Gratuita) */}
          <div id="admin-keys-history-box" className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="m-0 text-[13.5px] font-extrabold text-slate-800">
                Historial de Usuarios y Claves ({unifiedHistoryItems.length})
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Todos los dispositivos registrados
              </span>
            </div>
            {unifiedHistoryItems.length === 0 ? (
              <p className="text-[12px] text-slate-500 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                Aquí aparecerán todos los dispositivos registrados (PRO, promociones y Versión Gratuita).
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                {unifiedHistoryItems.map((item) => {
                  const countdown =
                    !item.isBlocked && !item.isRevoked && (item.expiresAt !== null || item.hasActivePromoOrPro)
                      ? formatCountdownTimer(item.expiresAt, nowTick)
                      : null;
                  const clienteDisplay = formatClientHeaderDisplay(item.cliente);
                  return (
                    <div
                      key={item.normDev}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2 text-[11.5px]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <strong className="text-slate-900 break-words">{clienteDisplay}</strong>
                            <span className="mono px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10.5px] font-extrabold shrink-0">
                              {item.normDev}
                            </span>
                            {item.isSelf && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-extrabold">
                                Este equipo
                              </span>
                            )}
                          </div>
                          {item.linkedEmail && (
                            <div className="text-[11px] font-bold text-sky-700 mt-0.5 break-all">
                              {item.normDev} · {item.linkedEmail}
                            </div>
                          )}
                          <div className="text-slate-700 mt-0.5 flex flex-wrap items-center gap-1.5">
                            {item.keyCode ? (
                              <>
                                <span className="font-semibold">{item.promoLabelForDialog}</span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={`mono font-extrabold ${
                                    item.isBlocked || item.isRevoked ? 'line-through text-slate-400' : 'text-emerald-700'
                                  }`}
                                >
                                  {item.keyCode}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-600 font-medium">
                                {item.dev?.deviceLabel || 'Navegador Web'} · Sin clave generada
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 text-[11px] mt-1 flex flex-wrap items-center gap-1.5">
                            <span>Fecha: {new Date(item.createdAt).toLocaleDateString('es-MX')}</span>
                            {item.isBlocked ? (
                              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-red-950/90 border border-red-500/50 text-red-300 whitespace-nowrap">
                                Bloqueado
                              </span>
                            ) : item.isRevoked ? (
                              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-slate-800/90 border border-amber-500/50 text-amber-300 whitespace-nowrap">
                                Revocada
                              </span>
                            ) : countdown ? (
                              countdown.expired ? (
                                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-red-950/90 border border-red-500/50 text-red-300 whitespace-nowrap">
                                  Expirado
                                </span>
                              ) : (
                                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 whitespace-nowrap">
                                  {countdown.label}
                                </span>
                              )
                            ) : (
                              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-slate-200/80 border border-slate-300 text-slate-700 whitespace-nowrap">
                                Versión Gratuita
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-extrabold whitespace-nowrap shrink-0 ${item.statusClass}`}
                        >
                          {item.statusText}
                        </span>
                      </div>

                      <div className="grid grid-cols-[1fr_1.45fr_1fr] gap-2 w-full">
                        {item.keyRec || item.keyCode ? (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const copyPayload = item.keyRec ? buildClientMessage(item.keyRec) : item.keyCode;
                              await navigator.clipboard.writeText(copyPayload).catch(() => {});
                              onShowToast(item.keyRec ? 'Mensaje de entrega copiado' : `Clave ${item.keyCode} copiada`, true);
                            }}
                            className="min-w-0 min-h-[38px] py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-1.5 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <Copy size={13} className="shrink-0" aria-hidden="true" />
                            <span>Copiar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await navigator.clipboard.writeText(item.normDev).catch(() => {});
                              onShowToast(`ID ${item.normDev} copiado`, true);
                            }}
                            className="min-w-0 min-h-[38px] py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-1.5 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <Eye size={13} className="shrink-0" aria-hidden="true" />
                            <span>Ver ID</span>
                          </button>
                        )}

                        {item.hasActivePromoOrPro ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingRevokePromo({
                                deviceId: item.normDev,
                                cliente: item.cliente,
                                planLabel: item.promoLabelForDialog,
                                keyRecordId: item.keyRec?.id,
                                keyCode: item.keyCode || undefined,
                              });
                            }}
                            aria-label={`Revocar promoción a ${item.normDev}`}
                            title="Revocar promoción"
                            className="min-w-0 min-h-[38px] py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] px-1.5 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <AlertTriangle size={13} className="shrink-0" aria-hidden="true" />
                            <span>Revocar promo</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={item.isBlocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.isBlocked) return;
                              setPendingRevokeFree({
                                deviceId: item.normDev,
                                cliente: item.cliente,
                                keyCode: item.keyCode || undefined,
                              });
                            }}
                            aria-label={`Revocar acceso a ${item.normDev}`}
                            title={item.isBlocked ? 'Usuario bloqueado' : 'Revocar acceso gratuito'}
                            className="min-w-0 min-h-[38px] py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[11px] px-1.5 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <AlertTriangle size={13} className="shrink-0" aria-hidden="true" />
                            <span>Revocar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDeleteKeyRec(item.deleteRecord);
                          }}
                          aria-label={`Borrar usuario ${item.normDev} de la lista de historial`}
                          title="Borrar del historial"
                          className="min-w-0 min-h-[38px] py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] px-1.5 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          <Trash2 size={13} className="shrink-0" aria-hidden="true" />
                          <span>Borrar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sección de Estadísticas (Últimos 30 días + Gráficos Recharts + Lista de usuarios) */}
          <div id="admin-stats-box" className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="m-0 text-[13.5px] font-extrabold text-slate-800">
                Estadísticas de Uso (Últimos 30 días)
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {effectiveStats.proActiveDevices} PRO · {effectiveStats.totalDevices} total
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                <span className="block text-[11px] font-bold text-slate-600">
                  Usuarios activos (últimos 30 días)
                </span>
                <strong id="stat-active-users-30d" className="mono text-[22px] font-extrabold text-blue-700 block mt-0.5">
                  {effectiveStats.activeUsers30d}
                </strong>
                <span className="block text-[11px] text-slate-600">
                  Equipos con actividad reciente registrada
                </span>
              </div>
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                <span className="block text-[11px] font-bold text-slate-600">
                  Uso promedio de la app
                </span>
                <strong id="stat-avg-usage-30d" className="mono text-[22px] font-extrabold text-emerald-700 block mt-0.5">
                  {effectiveStats.avgMinutesPerUser30d} min
                </strong>
                <span className="block text-[11px] text-slate-600">
                  {effectiveStats.avgSessionsPerUser30d} sesiones · {effectiveStats.avgActiveDaysPerUser30d} días prom./usuario
                </span>
              </div>
            </div>

            <React.Suspense
              fallback={
                <div className="mt-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11.5px] text-slate-500 text-center">
                  Cargando gráficas de uso...
                </div>
              }
            >
              <AdminMiniCharts dailySeries30d={dailySeries30d} />
            </React.Suspense>

            {/* Lista detallada de dispositivos / usuarios registrados */}
            <div id="admin-stats-devices-list" className="mt-3 pt-2.5 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="m-0 text-[12.5px] font-extrabold text-slate-800">
                  Dispositivos y Usuarios Registrados ({registeredDevices.length})
                </h4>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Estado y clave en uso
                </span>
              </div>
              {registeredDevices.length === 0 ? (
                <p className="text-[12px] text-slate-500 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  Aún no hay dispositivos registrados.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
                  {registeredDevices.map((dev) => {
                    const now = nowTick;
                    const isSelf = dev.deviceId === deviceId.trim().toUpperCase();
                    const isBlockedDevice = Boolean(dev.blocked || dev.planCode === 'BLOCKED');
                    const isRevokedDevice = !isBlockedDevice && Boolean(dev.revoked || dev.planCode === 'REVOKED');
                    const hasValidPro =
                      !isBlockedDevice &&
                      !isRevokedDevice &&
                      dev.proActive &&
                      (dev.expiresAt === null || dev.expiresAt > now);
                    const isTrialStatus =
                      !isBlockedDevice &&
                      !isRevokedDevice &&
                      hasValidPro &&
                      dev.planCode === 'G';

                    const statusText = isBlockedDevice
                      ? 'Bloqueado'
                      : isRevokedDevice
                        ? 'Revocado'
                        : isTrialStatus
                          ? 'Prueba PRO'
                          : hasValidPro
                            ? 'PRO Activo'
                            : 'Versión Gratuita';

                    const statusClass = isBlockedDevice
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : isRevokedDevice
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : isTrialStatus
                          ? 'border-blue-200 bg-blue-50 text-blue-800'
                          : hasValidPro
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-slate-100 text-slate-700';

                    const matchingHistoryRec = adminKeys.find(
                      (k) => k.deviceId.trim().toUpperCase() === dev.deviceId && !k.revoked
                    );
                    const activeKeyCode = (dev.lastKey || matchingHistoryRec?.key || '').trim();
                    const canRevokePromo = !isBlockedDevice && !isRevokedDevice && (hasValidPro || isTrialStatus || Boolean(dev.proActive));
                    const promoLabelForDialog = isTrialStatus
                      ? dev.planLabel && dev.planLabel !== 'Gratuito'
                        ? dev.planLabel
                        : 'Prueba PRO (3 días)'
                      : dev.planLabel || 'PRO';

                    const devExpiresAt =
                      dev.expiresAt !== null
                        ? dev.expiresAt
                        : isSelf && isTrialStatus && trialExpiresAt
                          ? trialExpiresAt
                          : matchingHistoryRec?.expiresAt ?? null;
                    const devCountdown =
                      !isBlockedDevice && !isRevokedDevice && (devExpiresAt !== null || hasValidPro)
                        ? formatCountdownTimer(devExpiresAt, now)
                        : null;
                    const devStartDate = dev.firstSeenAt || dev.updatedAt || now;

                    return (
                      <div
                        key={dev.deviceId}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-1.5 text-[11.5px]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span className="mono font-extrabold text-slate-900 text-[12px]">
                                {dev.deviceId}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-extrabold">
                                  Este equipo
                                </span>
                              )}
                              <span className="font-bold text-slate-700 break-words">
                                · {formatClientHeaderDisplay(dev.cliente)}
                              </span>
                            </div>
                            {dev.linkedEmail && (
                              <div className="text-[11px] font-bold text-sky-700 mt-0.5 break-all">
                                {dev.deviceId} · {dev.linkedEmail}
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg border text-[10.5px] font-extrabold whitespace-nowrap shrink-0 ${statusClass}`}
                          >
                            {statusText}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1.5">
                          <span>Fecha: {new Date(devStartDate).toLocaleDateString('es-MX')}</span>
                          {isBlockedDevice ? (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-red-950/90 border border-red-500/50 text-red-300 whitespace-nowrap">
                              Bloqueado
                            </span>
                          ) : isRevokedDevice ? (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-slate-800/90 border border-amber-500/50 text-amber-300 whitespace-nowrap">
                              Revocada
                            </span>
                          ) : devCountdown ? (
                            devCountdown.expired ? (
                              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-red-950/90 border border-red-500/50 text-red-300 whitespace-nowrap">
                                Expirado
                              </span>
                            ) : (
                              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 whitespace-nowrap">
                                {devCountdown.label}
                              </span>
                            )
                          ) : null}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-600">
                          <span>
                            {dev.deviceLabel || 'Navegador Web'} · {dev.totalSessions} ses. · {dev.totalMinutes} min
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isBlockedDevice ? (
                              <span className="text-red-600 font-bold">
                                Acceso suspendido
                              </span>
                            ) : isRevokedDevice ? (
                              <span className="text-amber-700 font-semibold">
                                Acceso PRO revocado
                              </span>
                            ) : activeKeyCode && (hasValidPro || !isTrialStatus) ? (
                              <span className="mono px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10.5px]">
                                Clave: {activeKeyCode}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">
                                {isTrialStatus ? 'Periodo de prueba gratuito' : 'Sin clave activa'}
                              </span>
                            )}
                            {canRevokePromo ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingRevokePromo({
                                    deviceId: dev.deviceId,
                                    cliente: dev.cliente || 'Cliente sin nombre',
                                    planLabel: promoLabelForDialog,
                                    keyRecordId: matchingHistoryRec?.id,
                                    keyCode: activeKeyCode || undefined,
                                  });
                                }}
                                className="min-h-[32px] py-1 rounded-lg border border-amber-400 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] px-1.5 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                              >
                                <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
                                <span>Revocar promo</span>
                              </button>
                            ) : !isBlockedDevice ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingRevokeFree({
                                    deviceId: dev.deviceId,
                                    cliente: dev.cliente || 'Cliente sin nombre',
                                    keyCode: activeKeyCode || undefined,
                                  });
                                }}
                                className="min-h-[32px] py-1 rounded-lg border border-amber-400 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] px-1.5 flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                              >
                                <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
                                <span>Revocar</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sincronización local entre dispositivos (100% offline mediante respaldo JSON por WhatsApp) */}
          <div
            id="admin-sync-local-box"
            className="pt-3 border-t border-slate-200"
          >
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-[15px] shrink-0"
                    aria-hidden="true"
                  >
                    📱
                  </span>
                  <div>
                    <h3 className="m-0 text-[13.5px] font-extrabold text-slate-900">
                      Sincronización entre dispositivos
                    </h3>
                    <span className="block text-[11px] font-bold text-blue-700">
                      Almacenamiento 100% local sin servidor en la nube
                    </span>
                  </div>
                </div>
                <span className="mono px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 text-[10.5px] font-extrabold">
                  ID: {deviceId}
                </span>
              </div>
              <p className="m-0 text-[12px] text-slate-700 leading-relaxed">
                Tus precios, inventario, sobrantes, fotos de perfiles, notas y fórmulas se guardan de forma privada y offline en este equipo. Para pasar tus datos a otro celular o computadora, utiliza el{' '}
                <strong>Respaldo de Fotos y Datos (JSON por WhatsApp)</strong> en la sección de abajo: exporta el archivo, envíalo por WhatsApp e impórtalo en el nuevo equipo.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-600">
                  Paso 1: Exportar Respaldo → Paso 2: Enviar por WhatsApp → Paso 3: Importar
                </span>
                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById('admin-backup-box')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-blue-300 bg-white hover:bg-blue-100 text-blue-800 text-[11.5px] font-extrabold cursor-pointer transition-colors"
                >
                  Ir al respaldo JSON ↓
                </button>
              </div>
            </div>
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
              Ingresa exactamente <strong>10 dígitos obligatorios</strong> sin lada internacional ni símbolos (ej. <span className="mono font-bold">5512345678</span>). Las sugerencias enviadas desde el buzón abrirán este número.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                id="inp-admin-wa-sugerencias"
                type="tel"
                inputMode="numeric"
                maxLength={24}
                value={waSugerenciasInput}
                aria-invalid={Boolean(waSugerenciasError)}
                aria-describedby={waSugerenciasError ? 'err-admin-wa-sugerencias' : undefined}
                onChange={(e) => {
                  setWaSugerenciasInput(e.target.value);
                  if (waSugerenciasError) setWaSugerenciasError('');
                }}
                placeholder="Ej. 5512345678"
                className={`flex-1 min-w-[180px] min-h-[42px] rounded-xl border px-3 mono text-[13.5px] font-bold bg-white text-slate-900 ${
                  waSugerenciasError ? 'border-red-500 ring-2 ring-red-400/30' : 'border-slate-300'
                }`}
              />
              <button
                type="button"
                id="btn-admin-save-wa-sugerencias"
                onClick={() => {
                  const validation = validateWhatsappNumber(waSugerenciasInput);
                  if (!validation.valid) {
                    const errMsg =
                      validation.error ||
                      'Formato inválido. Ingresa exactamente 10 dígitos numéricos.';
                    setWaSugerenciasError(errMsg);
                    onShowToast(errMsg, false);
                    return;
                  }
                  setWaSugerenciasError('');
                  setWaSugerenciasInput(validation.digits);
                  onSaveSugerenciasWhatsapp(validation.digits);
                  onShowToast(`WhatsApp receptor guardado: ${validation.digits}`, true);
                }}
                className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-extrabold cursor-pointer shrink-0"
              >
                Guardar WhatsApp
              </button>
              {(sugerenciasWhatsapp || waSugerenciasInput.trim()) && (
                <button
                  type="button"
                  id="btn-admin-clear-wa-sugerencias"
                  onClick={() => {
                    setWaSugerenciasError('');
                    setWaSugerenciasInput('');
                    onSaveSugerenciasWhatsapp('');
                    onShowToast('Número receptor limpiado (abrirá selector de WhatsApp)', true);
                  }}
                  className="min-h-[42px] px-3 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold cursor-pointer shrink-0"
                >
                  Limpiar
                </button>
              )}
            </div>
            {waSugerenciasError && (
              <p
                id="err-admin-wa-sugerencias"
                role="alert"
                className="m-0 mt-2 text-[12px] font-bold text-red-600 dark:text-red-400"
              >
                {waSugerenciasError}
              </p>
            )}
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
        </div>
        )}
      </div>
    </div>
    {typeof document !== 'undefined' ? createPortal(confirmModalsNode, document.body) : confirmModalsNode}
    </>
  );
};

/* ==================== MODAL RECOMENDAR APP (INVITAR A UN COLEGA + RASTREO POR ID + QR LOCAL) ==================== */
interface RecomendarModalProps {
  open: boolean;
  deviceId: string;
  defaultSenderName?: string;
  referralHistory?: ReferralHistoryRecord[];
  onClose: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const RecomendarModal: React.FC<RecomendarModalProps> = ({
  open,
  deviceId,
  defaultSenderName = '',
  referralHistory = [],
  onClose,
  onShowToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [senderName, setSenderName] = useState<string>(() => {
    return loadReferralSenderName() || sanitizeReferralSenderName(defaultSenderName);
  });
  const [promoTotal, setPromoTotal] = useState<number>(() => loadCachedPromoCount());
  const [loadingCount, setLoadingCount] = useState<boolean>(false);
  const [busyAction, setBusyAction] = useState<'wa' | 'copy' | null>(null);

  const safeDeviceId = useMemo(
    () => String(deviceId || '').trim().toUpperCase() || 'EQUIPO',
    [deviceId]
  );

  const displaySenderName = useMemo(
    () => sanitizeReferralSenderName(senderName) || 'Tu nombre o taller',
    [senderName]
  );

  // URL limpia y fija para el código QR, recuadro inferior y botón de copiar enlace
  const qrTargetUrl = useMemo(
    () => getOfficialShareUrl().replace(/\/+$/, ''),
    []
  );

  // Enlace personalizado con ID de Equipo y Nombre del Taller para compartir por WhatsApp
  const whatsappReferralUrl = useMemo(() => {
    const cleanSender = sanitizeReferralSenderName(senderName || defaultSenderName);
    const params = new URLSearchParams();
    params.set('ref', safeDeviceId);
    if (cleanSender) params.set('refName', cleanSender);
    return `${qrTargetUrl}/?${params.toString()}`;
  }, [qrTargetUrl, safeDeviceId, senderName, defaultSenderName]);

  const myReferralsCount = useMemo(
    () =>
      referralHistory.filter(
        (r) => r.referrerId.trim().toUpperCase() === safeDeviceId
      ).length,
    [referralHistory, safeDeviceId]
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    const savedName = loadReferralSenderName();
    if (!savedName && defaultSenderName.trim()) {
      setSenderName((prev) => prev || sanitizeReferralSenderName(defaultSenderName));
    }
    setLoadingCount(true);
    fetchPromocionesEnviadasCount()
      .then((count) => {
        if (active) setPromoTotal(count);
      })
      .finally(() => {
        if (active) setLoadingCount(false);
      });
    return () => {
      active = false;
    };
  }, [open, defaultSenderName]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    QRCode.toDataURL(qrTargetUrl, {
      width: 184,
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
        qrTargetUrl,
        {
          width: 184,
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
  }, [open, qrTargetUrl]);

  if (!open) return null;

  const handleChangeSenderName = (val: string) => {
    const bounded = val.slice(0, 60);
    setSenderName(bounded);
    saveReferralSenderName(bounded);
  };

  const copyTextSafe = async (text: string): Promise<boolean> => {
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied && typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
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
    return copied;
  };

  const handleCopiarEnlaceInvitacion = async () => {
    if (busyAction) return;
    setBusyAction('copy');
    try {
      const nextPromoNum = await incrementPromocionesEnviadasCount();
      setPromoTotal(nextPromoNum);
      const copied = await copyTextSafe(qrTargetUrl);
      onShowToast(
        copied
          ? `Enlace de invitación copiado: ${qrTargetUrl}`
          : `Enlace de invitación: ${qrTargetUrl}`,
        true
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleCompartirInvitacionWhatsapp = async () => {
    if (busyAction) return;
    setBusyAction('wa');
    try {
      const cleanName = sanitizeReferralSenderName(senderName) || 'Un colega';
      const nextPromoNum = await incrementPromocionesEnviadasCount();
      setPromoTotal(nextPromoNum);
      const waMessage = `${cleanName} te acaba de mandar 3 días de Aluminero Pro por 0 MXN. ¡Eso es amistad!\n\nExplora una herramienta profesional: tendrás acceso total a inventario, optimización de tramos y cotizaciones en PDF, e incluso sin conexión.\n\nAbre tu invitación personal (#${nextPromoNum}) aquí:\n${whatsappReferralUrl}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
      openExternalLinkSafe(waUrl);
      onShowToast(`Invitación #${nextPromoNum} lista para compartir en WhatsApp`, true);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div
      id="modal-recomendar"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-[2px] overflow-y-auto flex items-start justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Invitar a un colega"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] my-auto bg-white text-slate-900 rounded-[22px] p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h2 className="m-0 text-[17.5px] font-extrabold tracking-tight">Invitar a un colega (QR)</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Invitar a un colega"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Distintivo discreto de conteo global en Firebase */}
        <div
          id="lbl-community-promos"
          className="mb-2.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11.5px] font-bold flex items-center justify-between gap-2"
        >
          <span className="truncate">Promociones compartidas por la comunidad:</span>
          <span className="mono font-extrabold text-emerald-700 whitespace-nowrap">
            {loadingCount ? `#${promoTotal}...` : `#${promoTotal}`}
          </span>
        </div>

        {/* Rastreo personal por ID de Equipo */}
        <div className="mb-3 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11.5px] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase text-blue-700">
              Tu código de referido automático
            </span>
            <strong className="mono text-[13px] font-extrabold text-blue-800">{safeDeviceId}</strong>
          </div>
          {myReferralsCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10.5px] font-extrabold whitespace-nowrap">
              {myReferralsCount} referido(s)
            </span>
          )}
        </div>

        {/* Campo para nombre o taller del remitente */}
        <div className="mb-3 text-left">
          <label
            htmlFor="input-referral-sender"
            className="block text-[11.5px] font-extrabold text-slate-600 mb-1"
          >
            Tu nombre o taller (se guarda automáticamente)
          </label>
          <input
            id="input-referral-sender"
            type="text"
            value={senderName}
            onChange={(e) => handleChangeSenderName(e.target.value)}
            placeholder="Ej. Taller Olmos o Maestro Carlos"
            maxLength={60}
            className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-[13.5px] font-semibold outline-none focus:border-emerald-500"
          />
        </div>

        {/* Tarjeta de vista previa estilo Spotify (#060b14 + resplandor radial #10b981) */}
        <div
          id="card-spotify-referral-preview"
          className="relative overflow-hidden rounded-[20px] p-4 sm:p-5 mb-3.5 text-left border border-emerald-400/35 bg-[#060b14] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.36)_0%,rgba(16,185,129,0.12)_42%,rgba(6,11,20,0.98)_78%)] shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" aria-hidden="true" />
              ALUMINERO PRO · REGALO DE COLEGA
            </span>
            <span className="mono text-[10.5px] font-extrabold text-emerald-200/90 whitespace-nowrap shrink-0">
              Promo #{promoTotal}
            </span>
          </div>

          <h3 className="m-0 text-[18px] sm:text-[19.5px] font-extrabold text-white leading-[1.22] tracking-tight">
            {displaySenderName} te acaba de mandar 3 días de Aluminero Pro por 0 MXN. ¡Eso es amistad!
          </h3>

          <p className="mt-2.5 mb-0 text-[12.5px] leading-relaxed text-slate-300 font-medium">
            Explora una herramienta profesional: tendrás acceso total a inventario, optimización de tramos y cotizaciones en PDF, e incluso sin conexión.
          </p>
        </div>

        {/* Acciones principales que incrementan el contador global en Firebase */}
        <div className="flex flex-col gap-2 mb-4">
          <button
            type="button"
            id="btn-share-referral-wa"
            disabled={busyAction !== null}
            onClick={handleCompartirInvitacionWhatsapp}
            className="w-full min-h-[46px] px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-65 text-slate-950 font-extrabold text-[13.5px] cursor-pointer shadow-md transition-colors"
          >
            {busyAction === 'wa' ? 'Generando invitación...' : 'Compartir invitación por WhatsApp'}
          </button>
          <button
            type="button"
            id="btn-copy-share-url"
            disabled={busyAction !== null}
            onClick={handleCopiarEnlaceInvitacion}
            className="w-full min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-65 text-white font-bold text-[13px] cursor-pointer transition-colors"
          >
            {busyAction === 'copy' ? 'Copiando enlace...' : 'Copiar enlace de invitación'}
          </button>
        </div>

        {/* Bloque QR intacto para compartir en persona */}
        <div className="pt-3 border-t border-slate-200 text-center">
          <p className="text-[11.5px] text-slate-600 font-semibold m-0 mb-2.5">
            O escanea este código QR local en persona con otro maestro aluminero
          </p>
          <div
            data-preserve-light="true"
            className="inline-flex p-2.5 rounded-2xl border border-slate-200 bg-white shadow-sm mb-2.5"
          >
            {qrDataUrl ? (
              <img
                id="img-recomendar-qr"
                src={qrDataUrl}
                alt={`Código QR para ${qrTargetUrl}`}
                width={184}
                height={184}
                className="block rounded-lg"
              />
            ) : (
              <canvas ref={canvasRef} aria-label={`Código QR local para ${qrTargetUrl}`} />
            )}
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 mono text-[12px] font-bold text-blue-700 text-center whitespace-nowrap overflow-x-auto">
            <span id="lbl-share-url">{qrTargetUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================== PANTALLA DE BIENVENIDA ESTILO SPOTIFY (INVITACIÓN DE COLEGA) ==================== */
interface ColleagueReferralWelcomeModalProps {
  open: boolean;
  referral: SavedColleagueReferral | null;
  referredById?: string | null;
  deviceId: string;
  whatsappNumber?: string;
  onExploreFree: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const ColleagueReferralWelcomeModal: React.FC<ColleagueReferralWelcomeModalProps> = ({
  open,
  referral,
  referredById = null,
  deviceId,
  onExploreFree,
}) => {
  if (!open || !referral) return null;

  const displayReferredBy =
    (referral.refName && String(referral.refName).trim()) || (referredById && String(referredById).trim());

  return (
    <div
      id="modal-colleague-referral-welcome"
      className="fixed inset-0 z-[90] overflow-y-auto bg-[#060b14] bg-[radial-gradient(circle_at_50%_12%,rgba(16,185,129,0.42)_0%,rgba(16,185,129,0.14)_36%,rgba(6,11,20,0.99)_74%)] flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Invitación de colega Aluminero Pro"
    >
      <div className="w-full max-w-[440px] flex flex-col items-center text-center">
        <div className="mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 text-[11px] font-extrabold uppercase tracking-[0.12em]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" aria-hidden="true" />
          Invitación especial · Promo #{referral.promoNumber}
        </div>

        {displayReferredBy && (
          <div
            id="badge-welcome-referred-by"
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-emerald-300/30 text-emerald-200 text-[11.5px] font-semibold"
          >
            <span>Invitado por colega:</span>
            <strong className="mono font-extrabold text-white">{displayReferredBy}</strong>
          </div>
        )}

        <h1 className="m-0 text-[26px] sm:text-[31px] font-extrabold text-white leading-[1.16] tracking-tight [text-wrap:balance]">
          {referral.refName} te acaba de mandar 3 días de Aluminero Pro por 0 MXN. ¡Eso es amistad!
        </h1>

        <p className="mt-4 mb-5 text-[14px] sm:text-[15px] leading-relaxed text-slate-300 font-medium max-w-[390px]">
          Explora una herramienta profesional: tendrás acceso total a inventario, optimización de tramos y cotizaciones en PDF, e incluso sin conexión.
        </p>

        <div className="w-full mb-6 px-4 py-3 rounded-2xl border border-emerald-400/25 bg-white/5 backdrop-blur-sm flex items-center justify-between gap-3 text-left">
          <div className="min-w-0">
            <span className="block text-[10.5px] uppercase tracking-wider font-bold text-emerald-300">
              ID de tu equipo (se incluye automático)
            </span>
            <strong className="mono text-[15px] font-extrabold text-white tracking-wide">
              {deviceId}
            </strong>
          </div>
          <span className="mono text-[11px] font-extrabold text-emerald-200 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/35 whitespace-nowrap">
            3 días · $0
          </span>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            id="btn-referral-explore-free"
            onClick={onExploreFree}
            className="w-full min-h-[54px] px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-slate-950 font-extrabold text-[15px] cursor-pointer shadow-[0_10px_30px_rgba(16,185,129,0.42)] transition-all"
          >
            Explorar versión gratuita primero
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
      className="fixed inset-0 z-[60] bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Instalar Aluminero Pro"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[18px] font-extrabold">Instalar Aluminero Pro</h2>
            <p className="m-0 text-[12px] text-slate-500">
              Agrégala a tu pantalla de inicio en 2 pasos rápidos
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar instrucciones de instalación"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5 text-[13px]">
          <div
            className={`p-3.5 rounded-xl border text-slate-900 ${
              !isIOS
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <strong className="block text-emerald-900 mb-1">
              En Android / Chrome:
            </strong>
            <p className="m-0 text-[12.5px] font-semibold text-slate-800 leading-snug">
              Toca el menú de los 3 puntos <strong>(⋮)</strong> arriba a la derecha y selecciona{' '}
              <strong>&quot;Instalar aplicación&quot;</strong> (o &quot;Agregar a pantalla de inicio&quot;).
            </p>
          </div>

          <div
            className={`p-3.5 rounded-xl border text-slate-800 ${
              isIOS
                ? 'border-blue-300 bg-blue-50'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <strong className="block text-blue-900 mb-1">
              En iPhone / iPad (Safari):
            </strong>
            <p className="m-0 text-[12.5px] font-semibold text-slate-800 leading-snug">
              Toca el botón <strong>Compartir</strong> (cuadro con flecha hacia arriba) y selecciona{' '}
              <strong>&quot;Agregar a inicio&quot;</strong>.
            </p>
          </div>

          <p className="m-0 text-[11.5px] text-slate-500">
            Una vez instalada, el botón &quot;Instalar App&quot; desaparecerá automáticamente y podrás usar Aluminero Pro directamente desde tu pantalla de inicio.
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
  const waUrlDigits = formatWhatsappUrlDigits(whatsappNumber);

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
      ...(cleanWa ? [`• WhatsApp Admin: +52 ${cleanWa}`] : []),
    ];
    const message = lines.join('\n');
    const encoded = encodeURIComponent(message);
    const waUrl = waUrlDigits
      ? `https://wa.me/${waUrlDigits}?text=${encoded}`
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

/* ==================== MODAL RESPALDO Y CUENTA EN LA NUBE (EXCLUSIVO 90 DÍAS Y 1 AÑO) ==================== */
interface CloudBackupModalProps {
  open: boolean;
  deviceId: string;
  licencia: LicenciaState | null;
  session: CloudAccountSession | null;
  isEligible: boolean;
  syncing: boolean;
  googleUserEmail?: string | null;
  googleAuthLoading?: boolean;
  googleAuthError?: string | null;
  pendingSyncCount?: number;
  isOnline?: boolean;
  onConnectGoogle?: () => Promise<void> | void;
  onDisconnectGoogle?: () => Promise<void> | void;
  onClearGoogleAuthError?: () => void;
  onClose: () => void;
  onOpenProPlans: () => void;
  onRegisterAccount: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onLoginAccount: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onSyncNow: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  open,
  deviceId,
  licencia,
  session,
  isEligible,
  syncing,
  googleUserEmail = null,
  googleAuthLoading = false,
  googleAuthError = null,
  pendingSyncCount = 0,
  isOnline = true,
  onConnectGoogle,
  onDisconnectGoogle,
  onClearGoogleAuthError,
  onClose,
  onOpenProPlans,
  onRegisterAccount,
  onLoginAccount,
  onSyncNow,
  onLogout,
}) => {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [showRecoveryLogin, setShowRecoveryLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      setErrorMsg('');
      setPassword('');
      setConfirmPassword('');
      setShowRecoveryLogin(false);
      setTab(isEligible ? 'register' : 'login');
    }
  }, [open, isEligible]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setErrorMsg('Ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const isRegisterMode = isEligible && tab === 'register' && !showRecoveryLogin;
    if (isRegisterMode && password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      const result = isRegisterMode
        ? await onRegisterAccount(cleanEmail, password)
        : await onLoginAccount(cleanEmail, password);
      if (!result.ok) {
        setErrorMsg(result.error || 'No se pudo completar la operación.');
      } else {
        setPassword('');
        setConfirmPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="modal-cloud-backup"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Respaldo y Cuenta en la Nube"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[460px] max-h-[92vh] overflow-y-auto bg-white text-slate-900 rounded-[20px] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
              <Cloud size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="m-0 text-[17.5px] font-extrabold text-slate-900">
                Respaldo y Cuenta en la Nube
              </h2>
              <p className="m-0 text-[12px] text-slate-500">
                Equipo actual: <strong className="mono text-blue-700">{deviceId}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-cloud-backup-close"
            onClick={onClose}
            aria-label="Cerrar ventana de Respaldo y Cuenta en la Nube"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Estado de autenticación con Google (Firebase Auth con respaldo automático signInWithRedirect) */}
        {onConnectGoogle && (
          <div className="mb-3 p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-extrabold uppercase tracking-wide text-slate-600">
                Cuenta de Google (Firebase)
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  googleUserEmail
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {googleUserEmail ? 'Conectada' : 'Sin conectar'}
              </span>
            </div>

            {googleUserEmail ? (
              <div className="flex items-center justify-between gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-emerald-700">Sesión de Google activa</div>
                  <div className="text-[12.5px] font-extrabold text-slate-900 truncate">{googleUserEmail}</div>
                </div>
                {onDisconnectGoogle && (
                  <button
                    type="button"
                    id="btn-cloud-disconnect-google"
                    disabled={googleAuthLoading}
                    onClick={() => void onDisconnectGoogle()}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold cursor-pointer shrink-0 disabled:opacity-60"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="btn-cloud-connect-google"
                disabled={googleAuthLoading}
                onClick={() => void onConnectGoogle()}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-[13px] cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.14-4.06 1.14-3.12 0-5.77-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4-3.1z" />
                  <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4 3.1c.95-2.84 3.6-4.95 6.72-4.95z" />
                </svg>
                <span>{googleAuthLoading ? 'Conectando con Google...' : 'Conectar con Google'}</span>
              </button>
            )}

            {googleAuthError && (
              <div
                id="cloud-google-auth-error"
                role="alert"
                className="p-2.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-[11.5px] font-bold leading-snug flex items-start justify-between gap-2"
              >
                <span className="break-words">{googleAuthError}</span>
                {onClearGoogleAuthError && (
                  <button
                    type="button"
                    onClick={onClearGoogleAuthError}
                    aria-label="Cerrar error de Google"
                    className="text-rose-700 hover:text-rose-950 font-extrabold bg-transparent border-0 p-0.5 cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {pendingSyncCount > 0 && (
          <div
            id="cloud-offline-queue-notice"
            role="status"
            className="mb-3 p-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-[12px] font-bold flex items-center justify-between gap-2"
          >
            <span>
              {isOnline
                ? `Hay ${pendingSyncCount} cotización(es) guardada(s) sin internet listas para sincronizar.`
                : `Modo sin conexión: ${pendingSyncCount} cotización(es) en cola persistente para sincronizar al volver la red.`}
            </span>
          </div>
        )}

        {session ? (
          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-extrabold text-[14px] text-emerald-800">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>Cuenta vinculada y protegida</span>
              </div>
              <div className="text-[12.5px]">
                Correo: <strong className="break-all">{session.email}</strong>
              </div>
              <div className="text-[12px] text-emerald-900">
                Plan activo: <strong>{licencia?.planLabel || 'PRO'}</strong>
              </div>
              <div className="text-[11.5px] text-emerald-800">
                Último respaldo en la nube:{' '}
                <strong>
                  {session.lastBackedUpAt
                    ? new Date(session.lastBackedUpAt).toLocaleString('es-MX')
                    : 'Pendiente de sincronizar'}
                </strong>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-[12px] text-slate-700 flex items-start gap-2">
              <Lock size={16} className="text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Candado de 1 dispositivo activo:</strong> tus cotizaciones, inventario y licencia se respaldan automáticamente. Si inicias sesión en otro celular, este equipo cerrará su sesión de forma automática.
              </span>
            </div>

            <button
              type="button"
              id="btn-cloud-sync-now"
              disabled={syncing}
              onClick={() => void onSyncNow()}
              className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} aria-hidden="true" />
              <span>{syncing ? 'Sincronizando respaldo...' : 'Sincronizar respaldo ahora'}</span>
            </button>

            <button
              type="button"
              id="btn-cloud-logout"
              onClick={() => void onLogout()}
              className="w-full min-h-[42px] rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[12.5px] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut size={15} aria-hidden="true" />
              <span>Cerrar sesión en este equipo</span>
            </button>
          </div>
        ) : !isEligible && !showRecoveryLogin ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-slate-800">
              <div className="flex items-center gap-2 font-extrabold text-[14px] text-amber-900 mb-1.5">
                <ShieldCheck size={18} className="text-amber-700 shrink-0" aria-hidden="true" />
                <span>Beneficio exclusivo PRO (90 días y 1 año)</span>
              </div>
              <p className="m-0 text-[12.5px] leading-relaxed text-slate-700">
                El respaldo automático de cotizaciones, inventario y recuperación por cambio o robo de celular es un beneficio exclusivo de los planes PRO de <strong>90 días</strong> y <strong>1 año</strong>.
              </p>
            </div>

            <button
              type="button"
              id="btn-cloud-ver-planes-pro"
              onClick={() => {
                onClose();
                onOpenProPlans();
              }}
              className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-sm"
            >
              Ver planes PRO (90 días / 1 año)
            </button>

            <div className="pt-2 border-t border-slate-200 text-center">
              <p className="m-0 mb-2 text-[11.5px] text-slate-500">
                ¿Cambiaste de celular o te robaron tu equipo y ya tenías una cuenta vinculada?
              </p>
              <button
                type="button"
                id="btn-cloud-open-recovery-login"
                onClick={() => setShowRecoveryLogin(true)}
                className="w-full min-h-[42px] rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-extrabold text-[12.5px] cursor-pointer"
              >
                Ya tengo cuenta PRO (90 días / 1 año) · Iniciar sesión
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
            {isEligible ? (
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  id="tab-cloud-register"
                  onClick={() => {
                    setTab('register');
                    setErrorMsg('');
                  }}
                  className={`min-h-[38px] rounded-lg text-[12px] font-extrabold cursor-pointer transition-colors ${
                    tab === 'register'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vincular correo
                </button>
                <button
                  type="button"
                  id="tab-cloud-login"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg('');
                  }}
                  className={`min-h-[38px] rounded-lg text-[12px] font-extrabold cursor-pointer transition-colors ${
                    tab === 'login'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Iniciar sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[12px] font-bold text-blue-900">
                <span>Recuperar cuenta PRO (90 días / 1 año)</span>
                <button
                  type="button"
                  onClick={() => setShowRecoveryLogin(false)}
                  className="text-[11.5px] font-extrabold text-blue-700 underline bg-transparent border-0 cursor-pointer"
                >
                  Volver
                </button>
              </div>
            )}

            <div>
              <label htmlFor="inp-cloud-email" className="block text-[12px] font-bold text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="inp-cloud-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="taller@ejemplo.com"
                className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold"
              />
            </div>

            <div>
              <label htmlFor="inp-cloud-password" className="block text-[12px] font-bold text-slate-700 mb-1">
                Contraseña (mínimo 6 caracteres)
              </label>
              <div className="relative flex items-center">
                <input
                  id="inp-cloud-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isEligible && tab === 'register' && !showRecoveryLogin ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="••••••••"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 pl-3 pr-10 text-[13.5px] font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 p-1.5 text-slate-500 hover:text-slate-800 bg-transparent border-0 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {isEligible && tab === 'register' && !showRecoveryLogin && (
              <div>
                <label htmlFor="inp-cloud-password-confirm" className="block text-[12px] font-bold text-slate-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  id="inp-cloud-password-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="••••••••"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 px-3 text-[13.5px] font-semibold"
                />
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11.5px] text-slate-600 leading-relaxed">
              {isEligible && tab === 'register' && !showRecoveryLogin ? (
                <span>
                  Se guardará tu plan activo ({licencia?.planLabel}), cotizaciones e inventario en la nube. Tu cuenta solo podrá permanecer activa en <strong>1 celular a la vez</strong>.
                </span>
              ) : (
                <span>
                  Al iniciar sesión aquí se restaurará tu plan PRO y tus respaldos, y se cerrará automáticamente la sesión en el equipo anterior.
                </span>
              )}
            </div>

            {errorMsg && (
              <p className="m-0 text-[12px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              id="btn-cloud-submit"
              disabled={submitting}
              className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer disabled:opacity-60"
            >
              {submitting
                ? 'Conectando con la nube...'
                : isEligible && tab === 'register' && !showRecoveryLogin
                  ? 'Vincular correo y respaldar ahora'
                  : 'Iniciar sesión y restaurar datos'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};


