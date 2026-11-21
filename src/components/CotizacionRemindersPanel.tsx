import React, { useEffect, useMemo, useState } from 'react';
import {
  buildFollowupWhatsappMessage,
  computeReminderDueAt,
  CotizacionReminder,
  CotizacionReminderStatus,
  createCotizacionReminder,
  formatReminderRelativeTime,
  getNotificationCapability,
  partitionCotizacionReminders,
  REMINDER_PRESET_LABELS,
  ReminderPresetKey,
} from '../utils/pushReminders';
import {
  formatMXN,
  formatWhatsappUrlDigits,
  openExternalLinkSafe,
} from '../utils/storageHelpers';

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
      setCap(getNotificationCapability());
    };
    refreshCap();

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
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

    const timer = window.setInterval(() => {
      setNowTs(Date.now());
      refreshCap();
    }, 15_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const partitioned = useMemo(
    () => partitionCotizacionReminders(reminders, nowTs),
    [reminders, nowTs]
  );

  const handleEnablePush = async () => {
    const result = await onRequestPermission();
    setCap(getNotificationCapability());
    if (result === 'granted') {
      onShowToast('Notificaciones push activadas con Service Worker', true);
    } else if (result === 'denied') {
      onShowToast('Notificaciones bloqueadas en el navegador. Habilítalas en el candado de la URL.');
    } else {
      onShowToast('Permiso de notificaciones pendiente o no compatible');
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
    onShowToast(
      `Recordatorio programado para "${res.reminder.proyecto}"`,
      true
    );
  };

  const permissionBadge =
    !cap.supported
      ? { label: 'No compatible', cls: 'bg-slate-100 text-slate-600 border-slate-300' }
      : cap.permission === 'granted'
        ? {
            label: swReady ? 'Push SW Activo ✓' : 'Permiso Activo ✓',
            cls: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          }
        : cap.permission === 'denied'
          ? { label: 'Bloqueadas en navegador', cls: 'bg-red-50 text-red-700 border-red-300' }
          : { label: 'Pendiente de activar', cls: 'bg-amber-50 text-amber-800 border-amber-300' };

  const activeList = [...partitioned.due, ...partitioned.upcoming];

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
          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-extrabold whitespace-nowrap ${permissionBadge.cls}`}
        >
          {permissionBadge.label}
        </span>
      </div>

      {/* Controles de permiso y prueba SW */}
      <div className="mb-3.5 p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12px] text-slate-600 min-w-0 flex-1">
          {cap.permission === 'granted' ? (
            <span>
              <strong className="text-slate-900">Service Worker listo.</strong> Recibirás alertas cuando venza un seguimiento.
            </span>
          ) : cap.permission === 'denied' ? (
            <span className="text-red-700 font-semibold">
              Las notificaciones fueron bloqueadas. Permite notificaciones en la configuración del navegador para recibir avisos.
            </span>
          ) : (
            <span>
              Activa las notificaciones Push para recibir avisos de cotizaciones por vencer.
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {cap.supported && cap.permission !== 'granted' && (
            <button
              type="button"
              id="btn-enable-push-notifications"
              onClick={() => void handleEnablePush()}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-extrabold cursor-pointer"
            >
              {cap.permission === 'denied' ? 'Reintentar / Verificar permiso' : 'Activar notificaciones'}
            </button>
          )}
          {cap.supported && cap.permission === 'granted' && (
            <button
              type="button"
              id="btn-test-sw-notification"
              onClick={() => void onTestPushNotification()}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[12px] font-extrabold cursor-pointer"
            >
              Probar notificación SW
            </button>
          )}
        </div>
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
