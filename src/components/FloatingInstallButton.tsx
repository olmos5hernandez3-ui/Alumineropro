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
      className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-40 max-w-[calc(100vw-6.5rem)]"
    >
      <div className="inline-flex items-center rounded-full border border-[#45C98E]/80 bg-gradient-to-r from-[#0B2A24]/95 via-[#0E362E]/95 to-[#0D2535]/95 text-white shadow-[0_10px_24px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(176,252,218,0.3)] overflow-hidden backdrop-blur-md">
        <button
          type="button"
          id="btn-floating-install-app"
          onClick={onInstall}
          className="inline-flex items-center gap-1.5 min-h-[38px] pl-2.5 pr-2.5 py-1 text-[12px] sm:text-[12.5px] font-extrabold tracking-tight text-[#E8FFF4] hover:bg-emerald-400/15 active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
        >
          <span className="w-6 h-6 rounded-full bg-emerald-400/20 border border-emerald-300/50 text-[#76F2B6] flex items-center justify-center shrink-0">
            <Download size={13} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span>Instalar App</span>
        </button>

        <span className="w-px h-5 bg-[#4A6072]/60 shrink-0" aria-hidden="true" />

        <button
          type="button"
          id="btn-floating-install-close"
          onClick={onDismiss}
          aria-label="Cerrar botón de instalar por esta sesión"
          title="Ocultar por esta sesión"
          className="inline-flex items-center justify-center min-w-[32px] min-h-[38px] px-2 text-[#B0C4D4] hover:text-white hover:bg-white/10 active:scale-95 transition-colors cursor-pointer shrink-0"
        >
          <X size={13} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
