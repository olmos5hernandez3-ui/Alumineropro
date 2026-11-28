import React, { useEffect, useMemo, useState } from 'react';
import {
  computeMarginTrafficLight,
  MARGIN_TRAFFIC_LIGHT_LEGEND,
} from '../utils/marginTrafficLight';
import { formatMXN } from '../utils/storageHelpers';

interface MarginTrafficLightCardProps {
  /** Solo visible para usuarios PRO o en modo Administrador. En Versión Gratuita devuelve null. */
  proActive: boolean;
  isAdmin?: boolean;
  variant: 'full' | 'compact';
  /** Costo base inicial estimado (materiales/mano de obra). */
  initialBaseCost?: number;
  /** Precio al cliente enlazado (ej. gran total de la Hoja). En compact puede ser editable internamente. */
  clientPrice?: number;
  id?: string;
}

export const MarginTrafficLightCard: React.FC<MarginTrafficLightCardProps> = (props) => {
  // REGLA ESTRICTA: En Versión Gratuita NO se muestra nada (ni candado ni aviso).
  if (!props.proActive && !props.isAdmin) {
    return null;
  }
  return <MarginTrafficLightCardInner {...props} />;
};

const MarginTrafficLightCardInner: React.FC<MarginTrafficLightCardProps> = ({
  variant,
  initialBaseCost = 0,
  clientPrice = 0,
  id,
}) => {
  const [baseCostStr, setBaseCostStr] = useState<string>(() =>
    initialBaseCost > 0 ? String(Math.round(initialBaseCost)) : ''
  );
  const [baseCostTouched, setBaseCostTouched] = useState<boolean>(false);
  const [fleteStr, setFleteStr] = useState<string>('');
  const [herrajesStr, setHerrajesStr] = useState<string>('');
  const [customClientPriceStr, setCustomClientPriceStr] = useState<string>(() =>
    clientPrice > 0 ? String(Math.round(clientPrice)) : ''
  );
  const [clientPriceTouched, setClientPriceTouched] = useState<boolean>(false);

  // Sincronizar costo base automático si el usuario no lo ha editado manualmente
  useEffect(() => {
    if (!baseCostTouched) {
      setBaseCostStr(initialBaseCost > 0 ? String(Math.round(initialBaseCost)) : '');
    }
  }, [initialBaseCost, baseCostTouched]);

  // En modo full, siempre usar el precio cliente de la cotización si es > 0
  useEffect(() => {
    if (variant === 'full' || !clientPriceTouched) {
      setCustomClientPriceStr(clientPrice > 0 ? String(Math.round(clientPrice)) : '');
    }
  }, [clientPrice, variant, clientPriceTouched]);

  const effectiveClientPrice =
    variant === 'full' && clientPrice > 0
      ? clientPrice
      : Number(customClientPriceStr) || 0;

  const result = useMemo(
    () =>
      computeMarginTrafficLight({
        costoBase: Number(baseCostStr) || 0,
        flete: Number(fleteStr) || 0,
        herrajesExtra: Number(herrajesStr) || 0,
        precioCliente: effectiveClientPrice,
      }),
    [baseCostStr, fleteStr, herrajesStr, effectiveClientPrice]
  );

  const hasValues = effectiveClientPrice > 0 || result.costoTotal > 0;

  const statusStyles =
    result.status === 'verde'
      ? {
          border: 'border-emerald-500/70',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          text: 'text-emerald-400',
        }
      : result.status === 'amarillo'
        ? {
            border: 'border-amber-500/70',
            badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
            text: 'text-amber-400',
          }
        : {
            border: 'border-red-500/70',
            badgeBg: 'bg-red-500/20 text-red-300 border-red-500/50',
            text: 'text-red-400',
          };

  const renderLights = (small = false) => {
    const dotSize = small ? 'w-3.5 h-3.5' : 'w-4 h-4';
    return (
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 shrink-0"
          aria-label={`Semáforo: ${result.label}`}
        >
          <span
            data-light="rojo"
            data-active={hasValues && result.status === 'rojo' ? 'true' : 'false'}
            className={`${dotSize} rounded-full transition-all ${
              hasValues && result.status === 'rojo'
                ? 'bg-red-500 opacity-100 ring-2 ring-red-400/70 shadow-[0_0_12px_rgba(239,68,68,0.85)]'
                : 'bg-red-950 opacity-35'
            }`}
            title="Rojo (<18% Bajo)"
          />
          <span
            data-light="amarillo"
            data-active={hasValues && result.status === 'amarillo' ? 'true' : 'false'}
            className={`${dotSize} rounded-full transition-all ${
              hasValues && result.status === 'amarillo'
                ? 'bg-amber-400 opacity-100 ring-2 ring-amber-300/75 shadow-[0_0_12px_rgba(251,191,36,0.92)]'
                : 'bg-amber-950 opacity-35'
            }`}
            title="Amarillo (18% a 29.9% Justo)"
          />
          <span
            data-light="verde"
            data-active={hasValues && result.status === 'verde' ? 'true' : 'false'}
            className={`${dotSize} rounded-full transition-all ${
              hasValues && result.status === 'verde'
                ? 'bg-emerald-400 opacity-100 ring-2 ring-emerald-300/70 shadow-[0_0_12px_rgba(52,211,153,0.85)]'
                : 'bg-emerald-950 opacity-35'
            }`}
            title="Verde (≥30% Óptimo)"
          />
        </div>
        <div
          data-testid="semaforo-legend"
          className="text-[10px] font-bold text-slate-300 text-right leading-tight"
        >
          <span>{MARGIN_TRAFFIC_LIGHT_LEGEND}</span>
          {hasValues && (
            <span className={`block mono font-extrabold mt-0.5 ${statusStyles.text}`}>
              {result.margenPct.toFixed(1)}% · {formatMXN(result.gananciaNeta)}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <section
        id={id || 'semaforo-margen-compact'}
        data-testid="semaforo-margen-card"
        data-margin-status={hasValues ? result.status : 'idle'}
        aria-label="Semáforo de Margen PRO"
        className={`mt-3 rounded-xl bg-slate-900 text-slate-100 border-2 ${
          hasValues ? statusStyles.border : 'border-slate-700'
        } p-3`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-[12.5px] font-black text-white flex items-center gap-1.5">
              <span>🚦 Semáforo de Margen</span>
              <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase">
                PRO
              </span>
            </div>
            <p className="m-0 text-[10.5px] text-slate-400">
              Verifica tu ganancia rápida antes de responder al cliente
            </p>
          </div>
          {renderLights(true)}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
              Costo est. ($)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="10"
              value={baseCostStr}
              onChange={(e) => {
                setBaseCostTouched(true);
                setBaseCostStr(e.target.value);
              }}
              placeholder="Ej. 3200"
              className="w-full h-9 px-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-[12.5px] font-bold mono focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
              Flete / extra ($)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="10"
              value={fleteStr}
              onChange={(e) => setFleteStr(e.target.value)}
              placeholder="Ej. 450"
              className="w-full h-9 px-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-[12.5px] font-bold mono focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
              Precio cliente ($)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="10"
              value={customClientPriceStr}
              onChange={(e) => {
                setClientPriceTouched(true);
                setCustomClientPriceStr(e.target.value);
              }}
              placeholder="Ej. 5800"
              className="w-full h-9 px-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-[12.5px] font-bold mono focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {hasValues ? (
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${statusStyles.badgeBg}`}
            >
              {result.label}
            </span>
            <div className="flex items-center gap-3 text-[12px] mono font-extrabold">
              <span className={statusStyles.text}>
                Utilidad: {formatMXN(result.gananciaNeta)}
              </span>
              <span className="text-white">
                {result.margenPct.toFixed(1)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-[11px] text-slate-400">
            Ingresa costo estimado y precio al cliente para encender el semáforo.
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      id={id || 'semaforo-margen-hoja'}
      data-testid="semaforo-margen-card"
      data-margin-status={hasValues ? result.status : 'idle'}
      aria-label="Semáforo de Margen PRO"
      className={`rounded-2xl bg-slate-900 text-slate-100 border-2 ${
        hasValues ? statusStyles.border : 'border-slate-700'
      } p-4 mb-3`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-[14.5px] font-black text-white">
              🚦 Semáforo de Margen
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wide">
              Exclusivo PRO
            </span>
          </div>
          <p className="m-0 mt-0.5 text-[11.5px] text-slate-400">
            Revisa tu margen real neto antes de descargar o enviar tu cotización.
          </p>
        </div>
        {renderLights(false)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label
            htmlFor="semaforo-costo-base"
            className="block text-[11px] font-bold text-slate-300 mb-1"
          >
            Costo base estimado ($)
          </label>
          <input
            id="semaforo-costo-base"
            type="number"
            inputMode="decimal"
            min="0"
            step="50"
            value={baseCostStr}
            onChange={(e) => {
              setBaseCostTouched(true);
              setBaseCostStr(e.target.value);
            }}
            placeholder="0"
            className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-[13px] font-bold mono focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label
            htmlFor="semaforo-flete"
            className="block text-[11px] font-bold text-slate-300 mb-1"
          >
            Traslado / Flete ($)
          </label>
          <input
            id="semaforo-flete"
            type="number"
            inputMode="decimal"
            min="0"
            step="50"
            value={fleteStr}
            onChange={(e) => setFleteStr(e.target.value)}
            placeholder="0"
            className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-[13px] font-bold mono focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label
            htmlFor="semaforo-herrajes"
            className="block text-[11px] font-bold text-slate-300 mb-1"
          >
            Herrajes / Consumibles extra ($)
          </label>
          <input
            id="semaforo-herrajes"
            type="number"
            inputMode="decimal"
            min="0"
            step="50"
            value={herrajesStr}
            onChange={(e) => setHerrajesStr(e.target.value)}
            placeholder="0"
            className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-[13px] font-bold mono focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Costo total</div>
          <div className="text-[13.5px] font-black mono text-slate-100 mt-0.5">
            {formatMXN(result.costoTotal)}
          </div>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Ganancia neta</div>
          <div className={`text-[13.5px] font-black mono mt-0.5 ${statusStyles.text}`}>
            {formatMXN(result.gananciaNeta)}
          </div>
        </div>
        <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Margen real</div>
          <div className={`text-[15px] font-black mono mt-0.5 ${statusStyles.text}`}>
            {result.margenPct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[12px] font-extrabold ${statusStyles.badgeBg}`}
        >
          {result.status === 'verde' ? '🟢' : result.status === 'amarillo' ? '🟡' : '🔴'}{' '}
          {result.label}
        </span>
        <span className="text-[11px] text-slate-400">{result.shortHint}</span>
      </div>
    </section>
  );
};
