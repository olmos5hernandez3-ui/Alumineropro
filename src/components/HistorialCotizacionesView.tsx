import React, { useEffect, useMemo, useState } from 'react';
import { CloudUpload } from 'lucide-react';
import {
  CotizacionEstado,
  CotizacionGuardada,
  filterCotizacionesByEstado,
  formatMXN,
  loadCotizacionesGuardadas,
  updateCotizacionEstado,
} from '../utils/storageHelpers';
import {
  enqueueOfflineCotizacion,
  isCotizacionPendingSync,
  loadOfflineCotizacionesQueue,
  OFFLINE_SYNC_QUEUE_EVENT,
  type OfflineCotizacionQueueItem,
} from '../utils/offlineSyncQueue';

interface Props {
  isOnline?: boolean;
  onSyncPendingQueue?: () => void;
  onGoHoja: () => void;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const ESTADO_LABELS: Record<CotizacionEstado, string> = {
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const ESTADO_BADGE_CLASSES: Record<CotizacionEstado, string> = {
  enviada: 'bg-sky-50 text-sky-700 border-sky-200',
  aprobada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rechazada: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const HistorialCotizacionesView: React.FC<Props> = ({
  isOnline = true,
  onSyncPendingQueue,
  onGoHoja,
  onShowToast,
}) => {
  const [items, setItems] = useState<CotizacionGuardada[]>(() => loadCotizacionesGuardadas());
  const [pendingQueue, setPendingQueue] = useState<OfflineCotizacionQueueItem[]>(() =>
    loadOfflineCotizacionesQueue()
  );
  const [filtroEstado, setFiltroEstado] = useState<'todas' | CotizacionEstado>('todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const sync = () => {
      setItems(loadCotizacionesGuardadas());
      setPendingQueue(loadOfflineCotizacionesQueue());
    };
    sync();
    window.addEventListener('focus', sync);
    window.addEventListener('aluminero:cotizaciones-updated', sync);
    window.addEventListener(OFFLINE_SYNC_QUEUE_EVENT, sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('aluminero:cotizaciones-updated', sync);
      window.removeEventListener(OFFLINE_SYNC_QUEUE_EVENT, sync);
    };
  }, []);

  const filteredByStatus = useMemo(
    () => filterCotizacionesByEstado(items, filtroEstado),
    [items, filtroEstado]
  );

  const visibleItems = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return filteredByStatus;
    return filteredByStatus.filter(
      (c) =>
        (c?.folio || '').toLowerCase().includes(q) ||
        (c?.cliente || '').toLowerCase().includes(q) ||
        (c?.telefono || '').toLowerCase().includes(q) ||
        (c?.direccion || '').toLowerCase().includes(q)
    );
  }, [filteredByStatus, busqueda]);

  const stats = useMemo(() => {
    let enviadas = 0;
    let aprobadas = 0;
    let rechazadas = 0;
    let montoAprobado = 0;
    for (const c of items) {
      if (c.estado === 'aprobada') {
        aprobadas += 1;
        montoAprobado += Number(c.total) || 0;
      } else if (c.estado === 'rechazada') {
        rechazadas += 1;
      } else {
        enviadas += 1;
      }
    }
    return { total: items.length, enviadas, aprobadas, rechazadas, montoAprobado };
  }, [items]);

  const handleChangeEstado = (id: string, estado: CotizacionEstado) => {
    const next = updateCotizacionEstado(id, estado);
    setItems(next);
    const updatedItem = next.find((c) => c.id === id);
    const offlineNow = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);
    if (offlineNow && updatedItem) {
      const nextQueue = enqueueOfflineCotizacion({
        key: `cotizacion:${updatedItem.folio || updatedItem.id}`,
        action: 'update_estado',
        cotizacionId: updatedItem.id,
        folio: updatedItem.folio,
        cliente: updatedItem.cliente,
        total: updatedItem.total,
        estado,
      });
      setPendingQueue(nextQueue);
      onShowToast(
        `Cotización marcada como ${ESTADO_LABELS[estado]} · En cola para sincronizar al volver la conexión`,
        estado === 'aprobada'
      );
      return;
    }
    onShowToast(`Cotización marcada como ${ESTADO_LABELS[estado]}`, estado === 'aprobada');
  };

  return (
    <section id="view-cotizaciones" className="screen-animate">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h1 className="m-0 text-[21px] font-extrabold text-white">
            Historial de Cotizaciones
          </h1>
          <p className="m-0 text-[12.5px] text-slate-300 mt-0.5">
            Folios descargados o enviados desde Hoja de Cotización y su estado actual
          </p>
        </div>
        <button
          type="button"
          id="btn-cotizaciones-ir-hoja"
          onClick={onGoHoja}
          className="min-h-[42px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12.5px] cursor-pointer"
        >
          📄 Ir a Hoja de Cotización
        </button>
      </div>

      {pendingQueue.length > 0 && (
        <div
          id="cotizaciones-sync-queue-bar"
          role="status"
          className="mb-4 px-3.5 py-2.5 rounded-xl border border-amber-400/70 bg-amber-500/15 text-amber-100 text-[12px] font-bold flex flex-wrap items-center justify-between gap-2"
        >
          <span className="inline-flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
            <span>
              {isOnline
                ? `${pendingQueue.length} cotización(es) pendiente(s) de sincronizar con la nube.`
                : `Sin conexión: ${pendingQueue.length} cotización(es) guardada(s) en cola persistente.`}
            </span>
          </span>
          {isOnline && onSyncPendingQueue && (
            <button
              type="button"
              id="btn-cotizaciones-sync-now"
              onClick={onSyncPendingQueue}
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11.5px] font-extrabold cursor-pointer"
            >
              Sincronizar ahora
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="bg-white text-[#1E293B] border border-slate-300 rounded-2xl p-3 shadow-sm">
          <span className="block text-[10.5px] uppercase font-extrabold text-slate-500">Total</span>
          <strong className="mono text-[18px] font-extrabold text-slate-900">{stats.total}</strong>
        </div>
        <div className="bg-white text-[#1E293B] border border-slate-300 rounded-2xl p-3 shadow-sm">
          <span className="block text-[10.5px] uppercase font-extrabold text-sky-600">Enviadas</span>
          <strong className="mono text-[18px] font-extrabold text-sky-700">{stats.enviadas}</strong>
        </div>
        <div className="bg-white text-[#1E293B] border border-slate-300 rounded-2xl p-3 shadow-sm">
          <span className="block text-[10.5px] uppercase font-extrabold text-emerald-600">Aprobadas</span>
          <strong className="mono text-[18px] font-extrabold text-emerald-700">{stats.aprobadas}</strong>
        </div>
        <div className="bg-white text-[#1E293B] border border-slate-300 rounded-2xl p-3 shadow-sm">
          <span className="block text-[10.5px] uppercase font-extrabold text-emerald-700">Monto aprobado</span>
          <strong className="mono text-[15px] sm:text-[16px] font-extrabold text-emerald-800">
            {formatMXN(stats.montoAprobado)}
          </strong>
        </div>
      </div>

      <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar cotizaciones por estado">
            {(['todas', 'enviada', 'aprobada', 'rechazada'] as const).map((tab) => {
              const active = filtroEstado === tab;
              const label =
                tab === 'todas'
                  ? `Todas (${stats.total})`
                  : tab === 'enviada'
                    ? `Enviadas (${stats.enviadas})`
                    : tab === 'aprobada'
                      ? `Aprobadas (${stats.aprobadas})`
                      : `Rechazadas (${stats.rechazadas})`;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFiltroEstado(tab)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-[12px] font-extrabold cursor-pointer border transition-colors ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar folio o cliente..."
            aria-label="Buscar cotización por folio o cliente"
            className="w-full sm:w-[230px] min-h-[38px] rounded-xl border border-slate-300 px-3 text-[12.5px] font-semibold"
          />
        </div>

        {visibleItems.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <div className="text-[28px] mb-1">📋</div>
            <p className="m-0 text-[13.5px] font-bold text-slate-700">
              {items.length === 0
                ? 'Aún no hay cotizaciones emitidas'
                : 'No hay cotizaciones con ese filtro'}
            </p>
            <p className="m-0 mt-1 text-[12px] text-slate-500">
              Cuando descargues o envíes un PDF final desde Vista Previa en Hoja de Cotización, su folio quedará registrado aquí.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {visibleItems.map((c) => (
              <article
                key={c.id}
                data-cotizacion-id={c.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-[11px] font-extrabold">
                      {c.folio}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-extrabold ${ESTADO_BADGE_CLASSES[c.estado]}`}
                    >
                      {ESTADO_LABELS[c.estado]}
                    </span>
                    {isCotizacionPendingSync(pendingQueue, c) && (
                      <span
                        data-pending-sync="true"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[10.5px] font-extrabold"
                      >
                        <CloudUpload className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>En cola offline</span>
                      </span>
                    )}
                    <span className="text-[11.5px] text-slate-500 font-semibold">{c.fecha}</span>
                  </div>
                  <div className="mt-1.5 text-[14.5px] font-extrabold text-slate-900 truncate">
                    {c.cliente}
                  </div>
                  {(c.telefono || c.direccion) && (
                    <div className="text-[11.5px] text-slate-600 mt-0.5 truncate">
                      {[c.telefono ? `Tel: ${c.telefono}` : '', c.direccion || '']
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                  <div className="mt-1 text-[12px] text-slate-600 font-semibold">
                    {c.piezasCount} pieza(s) · Total:{' '}
                    <strong className="mono text-blue-700 font-extrabold">
                      {formatMXN(c.total)}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {(['enviada', 'aprobada', 'rechazada'] as CotizacionEstado[]).map((est) => {
                    const isCurrent = c.estado === est;
                    return (
                      <button
                        key={est}
                        type="button"
                        onClick={() => handleChangeEstado(c.id, est)}
                        aria-pressed={isCurrent}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11.5px] font-extrabold border cursor-pointer transition-all ${
                          isCurrent
                            ? est === 'aprobada'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : est === 'rechazada'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {ESTADO_LABELS[est]}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
