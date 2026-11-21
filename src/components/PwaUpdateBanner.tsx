import React, { useEffect, useState } from 'react';
import {
  readCurrentUpdateState,
  SW_UPDATE_EVENT,
  SwUpdateState,
  triggerAppUpdateNow,
} from '../utils/swUpdateUtils';
import { isRunningInIframe } from '../utils/runtimeEnv';

export const PwaUpdateBanner: React.FC = () => {
  const [updateState, setUpdateState] = useState<SwUpdateState>(() =>
    isRunningInIframe() ? { available: false } : readCurrentUpdateState()
  );
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isRunningInIframe()) return;
    try {
      window.__alumineroUpdateBannerMounted = true;

      const fallbackDom = document.getElementById('pwa-update-banner');
      if (fallbackDom) {
        fallbackDom.remove();
      }
    } catch {
      // Ignorar errores DOM aislados
    }

    const syncFromGlobal = () => {
      try {
        const next = readCurrentUpdateState();
        if (next.available) {
          setUpdateState(next);
        }
      } catch {
        // Ignorar
      }
    };

    const handleUpdateEvent = (ev: Event) => {
      try {
        const custom = ev as CustomEvent<SwUpdateState>;
        const detail = custom?.detail;
        if (detail && detail.available) {
          setUpdateState({
            available: true,
            reason: detail.reason,
            remoteVersion: detail.remoteVersion,
          });
        } else {
          syncFromGlobal();
        }
      } catch {
        // Ignorar
      }
    };

    syncFromGlobal();
    try {
      window.addEventListener(SW_UPDATE_EVENT, handleUpdateEvent);
    } catch {
      // Ignorar
    }
    return () => {
      try {
        window.removeEventListener(SW_UPDATE_EVENT, handleUpdateEvent);
        if (typeof window !== 'undefined') {
          window.__alumineroUpdateBannerMounted = false;
        }
      } catch {
        // Ignorar
      }
    };
  }, []);

  if (isRunningInIframe() || !updateState.available) {
    return null;
  }

  const handleApplyClick = () => {
    if (updating) return;
    setUpdating(true);
    triggerAppUpdateNow();
  };

  return (
    <div
      id="pwa-update-banner"
      role="alert"
      aria-live="assertive"
      className="fixed bottom-[86px] md:bottom-5 left-1/2 -translate-x-1/2 z-[10050] w-[min(430px,calc(100vw-24px))] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 border border-amber-200 shadow-2xl"
    >
      <div className="min-w-0 flex-1 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="w-2.5 h-2.5 rounded-full bg-slate-950 shrink-0 animate-pulse"
        />
        <span className="text-[13px] font-extrabold leading-tight">
          Hay una nueva actualización disponible
        </span>
      </div>
      <button
        type="button"
        id="btn-pwa-update-now"
        disabled={updating}
        onClick={handleApplyClick}
        className="shrink-0 min-h-[36px] px-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-75 text-amber-200 text-[12.5px] font-extrabold whitespace-nowrap cursor-pointer shadow-md transition-opacity"
      >
        {updating ? 'Actualizando...' : 'Actualizar'}
      </button>
    </div>
  );
};
