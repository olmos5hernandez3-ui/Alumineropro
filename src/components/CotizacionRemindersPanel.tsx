import React, { useEffect, useMemo, useState } from 'react';
import {
  buildFollowupWhatsappMessage,
  computeReminderDueAt,
  CotizacionReminder,
  CotizacionReminderStatus,
  createCotizacionReminder,
  detectAppleMobileAndStandalone,
  formatReminderRelativeTime,
  getNotificationCapability,
  getPushPermissionGuide,
  getReadyServiceWorkerRegistration,
  partitionCotizacionReminders,
  REMINDER_PRESET_LABELS,
  ReminderPresetKey,
} from '../utils/pushReminders';
import {
  formatMXN,
  formatWhatsappUrlDigits,
  openExternalLinkSafe,
} from '../utils/storageHelpers';
import { isRunningInIframe } from '../utils/iframeEnv';

interface PanelProps {
  reminders: CotizacionReminder[];
  defaultProyecto?: string;
  defaultTotal?: number;
  defaultPartidasCount?: number;
  defaultTelefono?: string;
  tallerNombre?: string;
  highlightedReminderId?: string | null;
  onAddReminder: (reminder: CotizacionReminder) => void;
  onUpdateStatus: (id: string, status: CotizacionReminderStatus) => void;
  onSnoozeReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onNotifyNow: (reminder: CotizacionReminder) => Promise<void>;
  onTestPushNotification: () => Promise<void>;
  onRequestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

function toDatetimeLocalValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const CotizacionRemindersPanel: React.FC<PanelProps> = ({
  reminders,
  defaultProyecto = '',
  defaultTotal = 0,
  defaultPartidasCount = 0,
  defaultTelefono = '',
  tallerNombre = '',
  highlightedReminderId = null,
  onAddReminder,
  onUpdateStatus,
  onSnoozeReminder,
  onDeleteReminder,
  onNotifyNow,
  onTestPushNotification,
  onRequestPermission,
  onShowToast,
}) => {
  const [cap, setCap] = useState(() => getNotificationCapability());
  const [swReady, setSwReady] = useState(false);
  const [requestingPush, setRequestingPush] = useState(false);
  const [newlyScheduledNeedsPush, setNewlyScheduledNeedsPush] = useState(false);
  const [envFlags] = useState(() => detectAppleMobileAndStandalone());
  const [proyecto, setProyecto] = useState(defaultProyecto);
  const [totalStr, setTotalStr] = useState(() =>
    defaultTotal > 0 ? String(Math.round(defaultTotal * 100) / 100) : ''
  );
  const [telefono, setTelefono] = useState(defaultTelefono);
  const [nota, setNota] = useState('');
  const [preset, setPreset] = useState<ReminderPresetKey | 'custom'>('24h');
  const [customDatetime, setCustomDatetime] = useState(() =>
    toDatetimeLocalValue(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [formError, setFormError] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    if (defaultProyecto && !proyecto.trim()) {
      setProyecto(defaultProyecto);
    }
  }, [defaultProyecto]);

  useEffect(() => {
    if (defaultTotal > 0) {
      setTotalStr(String(Math.round(defaultTotal * 100) / 100));
    }
  }, [defaultTotal]);

  useEffect(() => {
    if (defaultTelefono && !telefono.trim()) {
      setTelefono(defaultTelefono);
    }
  }, [defaultTelefono]);

  useEffect(() => {
    let active = true;
    const refreshCap = () => {
      if (!active) return;
      const next = getNotificationCapability();
      setCap(next);
      if (next.permission === 'granted') {
        setNewlyScheduledNeedsPush(false);
      }
    };
    refreshCap();

    if (!isRunningInIframe() && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (active) setSwReady(Boolean(reg));
        })
        .catch(() => {});
      navigator.serviceWorker.ready
        .then((reg) => {
          if (active) setSwReady(Boolean(reg));
        })
        .catch(() => {});
    }

    const onFocusOrVisible = () => refreshCap();
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    const timer = window.setInterval(() => {
      setNowTs(Date.now());
      refreshCap();
    }, 15_000);
    return () => {
      active = false;
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
      window.clearInterval(timer);
    };
  }, []);

  const partitioned = useMemo(
    () => partitionCotizacionReminders(reminders, nowTs),
    [reminders, nowTs]
  );
  const activeList = [...partitioned.due, ...partitioned.upcoming];

  const guide = useMemo(
    () =>
      getPushPermissionGuide(cap, {
        swReady,
        pendingCount: activeList.length,
        isAppleMobile: envFlags.isAppleMobile,
        isStandalone: envFlags.isStandalone,
      }),
    [activeList.length, cap, envFlags.isAppleMobile, envFlags.isStandalone, swReady]
  );

  const handleEnablePush = async () => {
    if (requestingPush) return;
    setRequestingPush(true);
    try {
      const result = await onRequestPermission();
      const refreshed = getNotificationCapability();
      setCap(refreshed);
      if (result === 'granted') {
        setNewlyScheduledNeedsPush(false);
        const reg = await getReadyServiceWorkerRegistration();
        setSwReady(Boolean(reg));
        onShowToast('Notificaciones Push activadas correctamente', true);
      } else if (result === 'denied') {
        onShowToast(
          'Permiso bloqueado en el navegador. Sigue los 3 pasos para desbloquearlo en el candado de la URL.'
        );
      } else {
        onShowToast('Permiso pendiente. Presiona "Permitir" en la ventana del navegador.');
      }
    } finally {
      setRequestingPush(false);
    }
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const now = Date.now();
    let dueAt = 0;
    if (preset === 'custom') {
      const parsed = Date.parse(customDatetime);
      if (!Number.isFinite(parsed)) {
        setFormError('Selecciona una fecha y hora válida.');
        return;
      }
      dueAt = parsed;
    } else {
      dueAt = computeReminderDueAt(preset, now);
    }

    const res = createCotizacionReminder({
      proyecto: proyecto.trim() || defaultProyecto.trim(),
      total: Number(totalStr) || defaultTotal || 0,
      partidasCount: defaultPartidasCount,
      telefonoCliente: telefono,
      nota,
      dueAt,
      now,
    });

    if (!res.ok) {
      setFormError(res.error);
      onShowToast(res.error);
      return;
    }

    onAddReminder(res.reminder);
    setNota('');

    const currentCap = getNotificationCapability();
    setCap(currentCap);
    if (currentCap.supported && currentCap.permission !== 'granted') {
      setNewlyScheduledNeedsPush(true);
      onShowToast(
        `Recordatorio guardado. Activa las notificaciones Push para recibir el aviso de "${res.reminder.proyecto}".`
      );
    } else {
      onShowToast(
        `Recordatorio programado para "${res.reminder.proyecto}"`,
        true
      );
    }
  };

  const permissionBadgeCls =
    guide.status === 'granted'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
      : guide.status === 'denied'
        ? 'bg-red-50 text-red-700 border-red-300'
        : guide.status === 'default' || guide.needsAction
          ? 'bg-amber-50 text-amber-800 border-amber-300'
          : 'bg-slate-100 text-slate-600 border-slate-300';

  const guideCardCls =
    guide.status === 'granted'
      ? 'border-emerald-300 bg-emerald-50'
      : guide.status === 'denied'
        ? 'border-red-300 bg-red-50'
        : guide.needsAction
          ? 'border-amber-300 bg-amber-50'
          : 'border-slate-200 bg-slate-50';

  return (
    <div
      id="panel-recordatorios-cotizacion"
      className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-2.5 mb-3">
        <div className="min-w-0">
          <h2 className="m-0 text-[17px] font-extrabold flex items-center gap-2">
            <span>🔔 Seguimiento de Cotizaciones Pendientes</span>
          </h2>
          <p className="m-0 text-[12px] text-slate-500 mt-0.5">
            Programa recordatorios con notificaciones Push vía Service Worker para no perder clientes
          </p>
        </div>
        <span
          id="badge-push-permission-status"
          data-permission-status={guide.status}
          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-extrabold whitespace-nowrap ${permissionBadgeCls}`}
        >
          {guide.badgeLabel}
        </span>
      </div>

      {/* Guía paso a paso de activación Push y estado de Service Worker */}
      <div
        id="push-permission-guide-card"
        data-guide-status={guide.status}
        className={`mb-3.5 p-3.5 rounded-xl border transition-colors ${guideCardCls}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-[13px] text-slate-900">
                {guide.headline}
              </strong>
              <span className="text-[10.5px] font-bold text-slate-600 px-2 py-0.5 rounded-full bg-white border border-slate-200">
                {guide.swStatusLabel}
              </span>
            </div>
            <p className="m-0 mt-1 text-[12px] text-slate-700 leading-relaxed">
              {guide.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {guide.ctaLabel && (
              <button
                type="button"
                id="btn-enable-push-notifications"
                disabled={requestingPush}
                onClick={() => void handleEnablePush()}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-[12px] font-extrabold cursor-pointer shadow-xs transition-colors ${
                  requestingPush
                    ? 'bg-blue-400 text-white cursor-wait'
                    : guide.status === 'denied'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {requestingPush ? 'Solicitando permiso...' : guide.ctaLabel}
              </button>
            )}
            {guide.status === 'granted' && (
              <button
                type="button"
                id="btn-test-sw-notification"
                onClick={() => void onTestPushNotification()}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[12px] font-extrabold cursor-pointer"
              >
                Probar notificación SW
              </button>
            )}
          </div>
        </div>

        {guide.steps.length > 0 && (
          <ol
            id="push-permission-guide-steps"
            className="mt-2.5 mb-0 pl-0 list-none flex flex-col gap-1.5"
          >
            {guide.steps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-[12px] text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
              >
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-extrabold inline-flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Formulario para programar recordatorio */}
      <form onSubmit={handleCreateReminder} className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 mb-4">
        <div className="text-[12.5px] font-extrabold text-slate-800 mb-2">
          Programar nuevo recordatorio de seguimiento
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
          <div>
            <label htmlFor="inp-rem-proyecto" className="block text-[11px] font-bold text-slate-600 mb-1">
              Cliente / Proyecto *
            </label>
            <input
              id="inp-rem-proyecto"
              type="text"
              value={proyecto}
              onChange={(e) => setProyecto(e.target.value)}
              placeholder="Ej. Casa Sr. Martínez"
              className="w-full min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="inp-rem-total" className="block text-[11px] font-bold text-slate-600 mb-1">
                Monto cotizado ($)
              </label>
              <input
                id="inp-rem-total"
                type="number"
                min={0}
                step="0.01"
                value={totalStr}
                onChange={(e) => setTotalStr(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[40px] rounded-xl border border-slate-300 bg-white px-2.5 mono text-[13px] font-semibold"
              />
            </div>
            <div>
              <label htmlFor="inp-rem-tel" className="block text-[11px] font-bold text-slate-600 mb-1">
                WhatsApp (10 díg.)
              </label>
              <input
                id="inp-rem-tel"
                type="tel"
                inputMode="numeric"
                maxLength={14}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="5512345678"
                className="w-full min-h-[40px] rounded-xl border border-slate-300 bg-white px-2.5 mono text-[13px] font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="mb-2.5">
          <label htmlFor="inp-rem-nota" className="block text-[11px] font-bold text-slate-600 mb-1">
            Nota de seguimiento (opcional)
          </label>
          <input
            id="inp-rem-nota"
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Confirmar anticipo del 50% y color aluminio negro"
            className="w-full min-h-[38px] rounded-xl border border-slate-300 bg-white px-3 text-[12.5px]"
          />
        </div>

        <div className="mb-3">
          <div className="text-[11px] font-bold text-slate-600 mb-1.5">¿Cuándo recordar?</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(REMINDER_PRESET_LABELS) as ReminderPresetKey[]).map((key) => (
              <button
                key={key}
                type="button"
                data-reminder-preset={key}
                onClick={() => setPreset(key)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] font-bold cursor-pointer ${
                  preset === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {REMINDER_PRESET_LABELS[key]}
              </button>
            ))}
            <button
              type="button"
              data-reminder-preset="custom"
              onClick={() => setPreset('custom')}
              className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] font-bold cursor-pointer ${
                preset === 'custom'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Fecha/hora exacta
            </button>
          </div>
          {preset === 'custom' && (
            <input
              id="inp-rem-custom-dt"
              type="datetime-local"
              value={customDatetime}
              onChange={(e) => setCustomDatetime(e.target.value)}
              className="mt-2 w-full sm:w-auto min-h-[38px] rounded-xl border border-slate-300 bg-white px-3 text-[12.5px] font-semibold"
            />
          )}
        </div>

        {formError && (
          <p id="rem-form-error" role="alert" className="text-[12px] font-bold text-red-600 mb-2">
            {formError}
          </p>
        )}

        <button
          type="submit"
          id="btn-programar-recordatorio"
          className="w-full min-h-[42px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold cursor-pointer"
        >
          + Programar recordatorio de cotización
        </button>
      </form>

      {newlyScheduledNeedsPush && cap.supported && cap.permission !== 'granted' && (
        <div
          id="push-followup-guide-callout"
          role="status"
          className="mb-4 p-3 rounded-xl border border-blue-300 bg-blue-50 flex flex-wrap items-center justify-between gap-2.5"
        >
          <div className="min-w-0 flex-1 text-[12px] text-slate-800">
            <strong className="block text-blue-900">
              ¡Seguimiento guardado! Falta activar los avisos Push
            </strong>
            <span>
              {cap.permission === 'denied'
                ? 'Permite las notificaciones en el candado de la barra de direcciones para que este aviso aparezca en tu pantalla.'
                : 'Haz clic para autorizar las notificaciones en tu navegador y recibir el aviso al vencer.'}
            </span>
          </div>
          <button
            type="button"
            id="btn-followup-enable-push"
            disabled={requestingPush}
            onClick={() => void handleEnablePush()}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-extrabold cursor-pointer shrink-0"
          >
            {cap.permission === 'denied' ? 'Verificar permiso' : 'Activar alertas Push ahora'}
          </button>
        </div>
      )}

      {/* Lista de recordatorios activos */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[13px] font-extrabold text-slate-800">
          Pendientes por seguimiento (<span className="mono">{activeList.length}</span>)
          {partitioned.due.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10.5px] font-extrabold">
              {partitioned.due.length} vencida(s)
            </span>
          )}
        </div>
        {partitioned.completed.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="text-[11.5px] font-bold text-blue-700 hover:underline cursor-pointer bg-transparent border-0 p-0"
          >
            {showCompleted
              ? 'Ocultar atendidas'
              : `Ver atendidas (${partitioned.completed.length})`}
          </button>
        )}
      </div>

      {activeList.length === 0 ? (
        <p className="text-[12px] text-slate-500 p-4 text-center border border-dashed border-slate-200 rounded-xl">
          No hay cotizaciones pendientes con recordatorio activo. Programa una arriba para recibir alertas.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {activeList.map((rem) => {
            const rel = formatReminderRelativeTime(rem.dueAt, nowTs);
            const isHighlighted = highlightedReminderId === rem.id;
            const waUrlDigits = rem.telefonoCliente
              ? formatWhatsappUrlDigits(rem.telefonoCliente)
              : '';
            return (
              <div
                key={rem.id}
                data-reminder-id={rem.id}
                className={`p-3 rounded-xl border transition-all ${
                  isHighlighted
                    ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50/70'
                    : rel.isOverdue
                      ? 'border-amber-300 bg-amber-50/70'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <strong className="text-[13.5px] text-slate-900 break-words">
                        {rem.proyecto}
                      </strong>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                          rel.isOverdue
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {rel.label}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-slate-600 mt-0.5">
                      <strong className="mono text-blue-700">{formatMXN(rem.total)}</strong>
                      {rem.partidasCount > 0 ? ` · ${rem.partidasCount} partida(s)` : ''}
                      {' · '}
                      <span>{new Date(rem.dueAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    {rem.nota && (
                      <div className="text-[11.5px] text-slate-600 mt-1 italic">
                        “{rem.nota}”
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteReminder(rem.id)}
                    aria-label={`Eliminar recordatorio ${rem.proyecto}`}
                    className="px-2 py-1 rounded-lg border border-red-200 bg-white text-red-600 text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <button
                    type="button"
                    data-action="notify-now"
                    onClick={() => void onNotifyNow(rem)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11.5px] font-bold cursor-pointer"
                  >
                    🔔 Notificar ahora
                  </button>
                  <button
                    type="button"
                    data-action="snooze-1d"
                    onClick={() => onSnoozeReminder(rem.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11.5px] font-bold cursor-pointer"
                  >
                    +1 día
                  </button>
                  <button
                    type="button"
                    data-action="mark-seguimiento"
                    onClick={() => onUpdateStatus(rem.id, 'seguimiento')}
                    className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11.5px] font-bold cursor-pointer"
                  >
                    ✓ Atendida
                  </button>
                  <button
                    type="button"
                    data-action="mark-aprobada"
                    onClick={() => onUpdateStatus(rem.id, 'aprobada')}
                    className="px-2.5 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11.5px] font-bold cursor-pointer"
                  >
                    ★ Aprobada
                  </button>
                  {waUrlDigits && (
                    <button
                      type="button"
                      onClick={() => {
                        const msg = buildFollowupWhatsappMessage(rem, tallerNombre);
                        openExternalLinkSafe(
                          `https://wa.me/${waUrlDigits}?text=${encodeURIComponent(msg)}`
                        );
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11.5px] font-bold cursor-pointer"
                    >
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCompleted && partitioned.completed.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2">
          <div className="text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wide">
            Atendidas / Cerradas
          </div>
          {partitioned.completed.map((rem) => (
            <div
              key={rem.id}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-[12px]"
            >
              <div className="min-w-0">
                <strong className="text-slate-800 block truncate">{rem.proyecto}</strong>
                <span className="text-slate-500 mono">{formatMXN(rem.total)}</span>
                <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  {rem.status === 'aprobada' ? 'Aprobada' : rem.status === 'seguimiento' ? 'Atendida' : 'Descartada'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onSnoozeReminder(rem.id)}
                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold cursor-pointer"
                >
                  Reactivar
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteReminder(rem.id)}
                  aria-label={`Eliminar recordatorio ${rem.proyecto}`}
                  className="px-2 py-1 rounded-lg border border-red-200 bg-white text-red-600 text-[11px] font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface RemindersModalProps extends PanelProps {
  open: boolean;
  onClose: () => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  open,
  onClose,
  ...panelProps
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Recordatorios de cotizaciones pendientes"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[640px] my-auto rounded-[20px]">
        <div className="flex justify-end mb-2 sticky top-0 z-10">
          <button
            type="button"
            id="btn-close-reminders-modal"
            onClick={onClose}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-white border border-white/25 text-[12.5px] font-bold cursor-pointer shadow-lg"
          >
            ✕ Cerrar
          </button>
        </div>
        <CotizacionRemindersPanel {...panelProps} />
      </div>
    </div>
  );
};
