import React, { useRef } from 'react';

interface PhotoPickerButtonsProps {
  onSelectFile: (file: File) => void;
  disabled?: boolean;
  cameraButtonId?: string;
  galleryButtonId?: string;
  cameraLabel?: string;
  galleryLabel?: string;
  compact?: boolean;
  tone?: 'blue' | 'amber' | 'emerald' | 'slate';
}

export const PhotoPickerButtons: React.FC<PhotoPickerButtonsProps> = ({
  onSelectFile,
  disabled = false,
  cameraButtonId,
  galleryButtonId,
  cameraLabel = 'Tomar Foto (Cámara)',
  galleryLabel = 'Elegir de Galería',
  compact = false,
  tone = 'blue',
}) => {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const cameraClasses =
    tone === 'amber'
      ? 'border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950'
      : tone === 'emerald'
        ? 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
        : 'border-blue-400 bg-blue-50 hover:bg-blue-100 text-blue-950';

  const galleryClasses =
    'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900';

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        id={cameraButtonId}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          cameraRef.current?.click();
        }}
        className={`flex flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] font-extrabold text-center cursor-pointer transition-all active:scale-95 disabled:opacity-60 ${
          compact ? 'min-h-[58px] px-2 py-2 text-[11px]' : 'min-h-[68px] px-2.5 py-2.5 text-[12px]'
        } ${cameraClasses}`}
      >
        <svg
          width={compact ? 22 : 26}
          height={compact ? 22 : 26}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        <span className="leading-tight">{cameraLabel}</span>
      </button>

      <button
        type="button"
        id={galleryButtonId}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          galleryRef.current?.click();
        }}
        className={`flex flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] font-extrabold text-center cursor-pointer transition-all active:scale-95 disabled:opacity-60 ${
          compact ? 'min-h-[58px] px-2 py-2 text-[11px]' : 'min-h-[68px] px-2.5 py-2.5 text-[12px]'
        } ${galleryClasses}`}
      >
        <svg
          width={compact ? 22 : 26}
          height={compact ? 22 : 26}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span className="leading-tight">{galleryLabel}</span>
      </button>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelectFile(file);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelectFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};
