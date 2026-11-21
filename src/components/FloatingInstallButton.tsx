import React from 'react';
import { Download, X } from 'lucide-react';

interface FloatingInstallButtonProps {
  visible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const FloatingInstallButton: React.FC<FloatingInstallButtonProps> = ({
  visible,
  onInstall,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <div
      id="floating-install-wrap"
      className="fixed bottom-4 left-4 sm:bottom-5 sm:left-5 z-40 max-w-[calc(100vw-6rem)]"
    >
      <div className="install-fab-float install-fab-glow inline-flex items-center rounded-2xl border border-emerald-300/70 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white shadow-2xl overflow-hidden backdrop-blur-sm">
        <button
          type="button"
          id="btn-floating-install-app"
          onClick={onInstall}
          className="inline-flex items-center gap-2 min-h-[46px] pl-3.5 pr-3 py-2 text-[13px] sm:text-[13.5px] font-extrabold tracking-tight text-white hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <span className="w-7 h-7 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
            <Download size={15} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span>Instalar App</span>
        </button>

        <span className="w-px h-6 bg-white/25 shrink-0" aria-hidden="true" />

        <button
          type="button"
          id="btn-floating-install-close"
          onClick={onDismiss}
          aria-label="Cerrar botón de instalar por esta sesión"
          title="Ocultar por esta sesión"
          className="inline-flex items-center justify-center min-w-[36px] min-h-[46px] px-2 text-white/85 hover:text-white hover:bg-white/15 active:scale-95 transition-colors cursor-pointer shrink-0"
        >
          <X size={14} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
