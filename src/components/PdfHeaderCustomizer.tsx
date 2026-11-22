import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Palette,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  buildPdfHeaderSpec,
  clampLogoZoomPct,
  computePdfLogoMetrics,
  PDF_HEADER_THEMES,
  PDF_LOGO_ZOOM_MAX,
  PDF_LOGO_ZOOM_MIN,
  PDF_LOGO_ZOOM_STEP,
  PdfDocumentKind,
  resolvePdfHeaderConfig,
} from '../utils/pdfHeaderUtils';
import {
  compressImageToDataUrl,
  PdfHeaderColorId,
  PdfHeaderConfig,
  PdfLogoAlign,
  TallerConfig,
} from '../utils/storageHelpers';

interface PdfHeaderPreviewProps {
  taller: TallerConfig;
  proyectoNombre?: string;
  kind?: PdfDocumentKind;
  onPreviewPdf?: () => void;
}

export const PdfHeaderPreview: React.FC<PdfHeaderPreviewProps> = ({
  taller,
  proyectoNombre,
  kind = 'cotizacion',
  onPreviewPdf,
}) => {
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number }>({ w: 1, h: 1 });

  useEffect(() => {
    setNaturalDims({ w: 1, h: 1 });
  }, [taller.logoDataUrl]);

  const dateLabel = new Date().toLocaleDateString('es-MX');
  const spec = buildPdfHeaderSpec(taller, kind, {
    dateLabel,
    naturalLogoWidth: naturalDims.w,
    naturalLogoHeight: naturalDims.h,
  });
  const logoMetrics = spec.showLogo
    ? computePdfLogoMetrics({
        naturalWidth: naturalDims.w,
        naturalHeight: naturalDims.h,
        zoomPct: spec.logoZoomPct,
        align: spec.logoAlign,
      })
    : null;
  const pxScale = 2.4;
  const clienteTexto = (proyectoNombre || '').trim() || 'Cliente General';

  const logoElement = spec.showLogo && logoMetrics && (
    <div
      data-testid="pdf-preview-logo-frame"
      data-align={spec.logoAlign}
      data-zoom={spec.logoZoomPct}
      className="rounded-lg bg-[#fefefe] shrink-0 flex items-center justify-center overflow-hidden shadow-xs transition-all"
      style={{
        width: `${Math.round(logoMetrics.frameW * pxScale)}px`,
        height: `${Math.round(logoMetrics.frameH * pxScale)}px`,
        padding: `${Math.max(2, Math.round(logoMetrics.innerPadMm * pxScale))}px`,
      }}
    >
      <img
        src={spec.logoDataUrl}
        alt="Logo del taller en encabezado PDF"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
          }
        }}
        className="w-full h-full object-contain"
      />
    </div>
  );

  return (
    <div
      data-testid="pdf-header-preview"
      data-preserve-light="true"
      className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm"
    >
      <div
        className="px-4 py-3.5 transition-colors relative"
        style={{
          backgroundColor: spec.theme.hex,
          borderBottom: `3px solid ${spec.theme.accentHex}`,
        }}
      >
        {spec.logoAlign === 'center' ? (
          <div className="flex flex-col items-center text-center">
            <span className="self-end text-[9.5px] font-medium text-[#e2e8f0] whitespace-nowrap mono mb-1">
              Fecha: {dateLabel}
            </span>
            {logoElement && <div className="mb-2">{logoElement}</div>}
            <p className="m-0 text-[13.5px] font-extrabold tracking-tight text-[#fefefe] max-w-full truncate">
              {spec.headline}
            </p>
            {spec.workshopName ? (
              <p
                className="m-0 mt-0.5 text-[10.5px] font-bold max-w-full truncate"
                style={{ color: spec.theme.accentHex }}
              >
                {[spec.documentLabel, spec.eslogan].filter(Boolean).join(' · ')}
              </p>
            ) : (
              spec.eslogan && (
                <p className="m-0 mt-0.5 text-[10.5px] text-[#e2e8f0] max-w-full truncate">
                  {spec.eslogan}
                </p>
              )
            )}
            {spec.contactParts.length > 0 ? (
              <p className="m-0 mt-1 text-[10px] leading-snug text-[#cbd5e1] line-clamp-2 max-w-full">
                {spec.contactParts.join(' · ')}
              </p>
            ) : (
              <p className="m-0 mt-1 text-[10px] italic text-[#94a3b8]">
                Sin datos de contacto visibles en el encabezado
              </p>
            )}
          </div>
        ) : (
          <div
            className={`flex items-start gap-3 ${
              spec.logoAlign === 'right' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className="flex flex-col items-end shrink-0 gap-1">
              {logoElement}
              {spec.logoAlign === 'right' && (
                <span className="text-[9.5px] font-medium text-[#e2e8f0] whitespace-nowrap mono">
                  Fecha: {dateLabel}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="m-0 text-[13.5px] font-extrabold tracking-tight text-[#fefefe] truncate">
                  {spec.headline}
                </p>
                {spec.logoAlign !== 'right' && (
                  <span className="text-[10px] font-medium text-[#e2e8f0] whitespace-nowrap shrink-0 mono">
                    Fecha: {dateLabel}
                  </span>
                )}
              </div>

              {spec.workshopName ? (
                <p
                  className="m-0 mt-0.5 text-[10.5px] font-bold truncate"
                  style={{ color: spec.theme.accentHex }}
                >
                  {[spec.documentLabel, spec.eslogan].filter(Boolean).join(' · ')}
                </p>
              ) : (
                spec.eslogan && (
                  <p className="m-0 mt-0.5 text-[10.5px] text-[#e2e8f0] truncate">
                    {spec.eslogan}
                  </p>
                )
              )}

              {spec.contactParts.length > 0 ? (
                <p className="m-0 mt-1 text-[10px] leading-snug text-[#cbd5e1] line-clamp-2">
                  {spec.contactParts.join(' · ')}
                </p>
              ) : (
                <p className="m-0 mt-1 text-[10px] italic text-[#94a3b8]">
                  Sin datos de contacto visibles en el encabezado
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 bg-[#ffffff] flex items-center justify-between gap-2 text-[11px] border-t border-[#e2e8f0]">
        <span className="font-bold text-[#0f1729] truncate">
          Proyecto / Cliente: {clienteTexto}
        </span>
        {onPreviewPdf ? (
          <button
            type="button"
            id="btn-hoja-vista-previa-badge"
            onClick={onPreviewPdf}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 border border-amber-300 text-slate-950 font-black text-[11px] whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            👁 Vista previa
          </button>
        ) : (
          <span className="text-[10px] text-[#64748b] whitespace-nowrap shrink-0">
            Vista previa PDF
          </span>
        )}
      </div>
    </div>
  );
};

interface CustomizerProps {
  taller: TallerConfig;
  proyectoNombre?: string;
  compact?: boolean;
  onUpdateTaller: (patch: Partial<TallerConfig>) => void;
  onShowToast?: (msg: string, topSuccess?: boolean) => void;
}

export const PdfHeaderCustomizer: React.FC<CustomizerProps> = ({
  taller,
  proyectoNombre,
  compact = false,
  onUpdateTaller,
  onShowToast,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [previewKind, setPreviewKind] = useState<PdfDocumentKind>('cotizacion');
  const headerCfg = resolvePdfHeaderConfig(taller);

  const updatePdfHeader = (subPatch: Partial<PdfHeaderConfig>) => {
    onUpdateTaller({
      pdfHeader: {
        ...headerCfg,
        ...subPatch,
      },
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file, 600, 0.84, true);
      onUpdateTaller({
        logoDataUrl: dataUrl,
        pdfHeader: {
          ...headerCfg,
          mostrarLogo: true,
        },
      });
      onShowToast?.('Logotipo guardado para tus encabezados PDF', true);
    } catch {
      onShowToast?.('No se pudo procesar el logotipo seleccionado');
    } finally {
      e.target.value = '';
    }
  };

  const themeList = Object.values(PDF_HEADER_THEMES);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Selector de vista previa + Preview */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[12px] font-bold text-slate-600">
            Vista previa del encabezado exportado
          </span>
          <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            {(
              [
                { id: 'cotizacion', label: 'Cotización' },
                { id: 'tecnico', label: 'Orden Taller' },
                { id: 'contrato', label: 'Contrato' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPreviewKind(tab.id)}
                aria-pressed={previewKind === tab.id}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                  previewKind === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <PdfHeaderPreview
          taller={taller}
          proyectoNombre={proyectoNombre}
          kind={previewKind}
        />
      </div>

      {/* Logo y controles de visibilidad */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
        <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
          {taller.logoDataUrl ? (
            <img
              src={taller.logoDataUrl}
              alt="Logo actual del taller"
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <Building2 className="w-6 h-6 text-slate-400" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              id="btn-subir-logo-taller"
              onClick={() => logoInputRef.current?.click()}
              className="min-h-[38px] px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <ImagePlus className="w-4 h-4" aria-hidden="true" />
              {taller.logoDataUrl ? 'Cambiar logotipo' : 'Subir logotipo'}
            </button>
            {taller.logoDataUrl && (
              <button
                type="button"
                id="btn-quitar-logo-taller"
                onClick={() => onUpdateTaller({ logoDataUrl: '' })}
                className="min-h-[38px] px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[12px] font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Quitar logo
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              id="btn-toggle-pdf-logo"
              aria-pressed={headerCfg.mostrarLogo}
              onClick={() => updatePdfHeader({ mostrarLogo: !headerCfg.mostrarLogo })}
              className={`min-h-[34px] px-2.5 rounded-lg border text-[11.5px] font-bold cursor-pointer inline-flex items-center gap-1.5 ${
                headerCfg.mostrarLogo
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {headerCfg.mostrarLogo ? (
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              Mostrar logo en PDF
            </button>

            <button
              type="button"
              id="btn-toggle-pdf-contacto"
              aria-pressed={headerCfg.mostrarContacto}
              onClick={() => updatePdfHeader({ mostrarContacto: !headerCfg.mostrarContacto })}
              className={`min-h-[34px] px-2.5 rounded-lg border text-[11.5px] font-bold cursor-pointer inline-flex items-center gap-1.5 ${
                headerCfg.mostrarContacto
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {headerCfg.mostrarContacto ? (
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              Mostrar contacto en PDF
            </button>
          </div>
        </div>

        {/* Controles sencillos de Alineación y Escalado (Zoom) del logotipo */}
        <div className="w-full pt-2.5 mt-1 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-[11.5px] font-bold text-slate-600 mb-1.5">
              Alineación del logotipo
            </span>
            <div
              className="grid grid-cols-3 gap-1.5"
              role="group"
              aria-label="Alineación del logotipo"
            >
              {(
                [
                  { id: 'left', label: 'Izq.', full: 'Alinear logotipo a la izquierda', Icon: AlignLeft },
                  { id: 'center', label: 'Centro', full: 'Centrar logotipo', Icon: AlignCenter },
                  { id: 'right', label: 'Der.', full: 'Alinear logotipo a la derecha', Icon: AlignRight },
                ] as const
              ).map(({ id, label, full, Icon }) => {
                const active = headerCfg.logoAlign === id;
                return (
                  <button
                    key={id}
                    type="button"
                    id={compact ? `btn-compact-logo-align-${id}` : `btn-logo-align-${id}`}
                    data-logo-align={id}
                    aria-label={full}
                    aria-pressed={active}
                    onClick={() => updatePdfHeader({ logoAlign: id as PdfLogoAlign })}
                    className={`min-h-[36px] px-2 rounded-lg border text-[11.5px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor={compact ? 'inp-compact-logo-zoom' : 'inp-logo-zoom'}
                className="text-[11.5px] font-bold text-slate-600"
              >
                Escala del logo:{' '}
                <span className="mono text-blue-700">{headerCfg.logoZoomPct}%</span>
              </label>
              {headerCfg.logoZoomPct !== 100 && (
                <button
                  type="button"
                  onClick={() => updatePdfHeader({ logoZoomPct: 100 })}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  100%
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id={compact ? 'btn-compact-logo-zoom-out' : 'btn-logo-zoom-out'}
                aria-label="Reducir tamaño del logotipo"
                disabled={headerCfg.logoZoomPct <= PDF_LOGO_ZOOM_MIN}
                onClick={() =>
                  updatePdfHeader({
                    logoZoomPct: clampLogoZoomPct(headerCfg.logoZoomPct - PDF_LOGO_ZOOM_STEP * 2),
                  })
                }
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer text-slate-700 shrink-0"
              >
                <ZoomOut className="w-4 h-4" aria-hidden="true" />
              </button>
              <input
                id={compact ? 'inp-compact-logo-zoom' : 'inp-logo-zoom'}
                type="range"
                min={PDF_LOGO_ZOOM_MIN}
                max={PDF_LOGO_ZOOM_MAX}
                step={PDF_LOGO_ZOOM_STEP}
                value={headerCfg.logoZoomPct}
                onChange={(e) =>
                  updatePdfHeader({ logoZoomPct: clampLogoZoomPct(Number(e.target.value)) })
                }
                className="flex-1 min-w-[80px] accent-blue-600 cursor-pointer"
              />
              <button
                type="button"
                id={compact ? 'btn-compact-logo-zoom-in' : 'btn-logo-zoom-in'}
                aria-label="Aumentar tamaño del logotipo"
                disabled={headerCfg.logoZoomPct >= PDF_LOGO_ZOOM_MAX}
                onClick={() =>
                  updatePdfHeader({
                    logoZoomPct: clampLogoZoomPct(headerCfg.logoZoomPct + PDF_LOGO_ZOOM_STEP * 2),
                  })
                }
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center cursor-pointer text-slate-700 shrink-0"
              >
                <ZoomIn className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de color del encabezado PDF */}
      <div>
        <span className="text-[12px] font-bold text-slate-500 mb-1.5 inline-flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" aria-hidden="true" />
          Color del encabezado PDF
        </span>
        <div className="flex flex-wrap gap-2">
          {themeList.map((theme) => {
            const active = headerCfg.colorTema === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                data-theme-color={theme.id}
                aria-pressed={active}
                onClick={() => updatePdfHeader({ colorTema: theme.id as PdfHeaderColorId })}
                className={`min-h-[36px] px-2.5 rounded-xl border text-[11.5px] font-bold cursor-pointer inline-flex items-center gap-1.5 transition-all ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/60 shrink-0 inline-flex items-center justify-center"
                  style={{ backgroundColor: theme.hex }}
                  aria-hidden="true"
                >
                  {active && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                {theme.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campos de identidad y contacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label
            htmlFor={compact ? 'inp-pdf-taller-nombre' : 'inp-taller-nombre'}
            className="block text-[12px] font-bold text-slate-500 mb-1"
          >
            Nombre de la Empresa / Taller
          </label>
          <input
            id={compact ? 'inp-pdf-taller-nombre' : 'inp-taller-nombre'}
            type="text"
            value={taller.nombre}
            onChange={(e) => onUpdateTaller({ nombre: e.target.value })}
            placeholder="Ej. Aluminios y Vidrios del Centro"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13.5px] font-semibold"
          />
        </div>

        <div>
          <label
            htmlFor={compact ? 'inp-pdf-eslogan' : 'inp-taller-eslogan'}
            className="block text-[12px] font-bold text-slate-500 mb-1"
          >
            Eslogan o especialidad
          </label>
          <input
            id={compact ? 'inp-pdf-eslogan' : 'inp-taller-eslogan'}
            type="text"
            value={headerCfg.eslogan}
            onChange={(e) => updatePdfHeader({ eslogan: e.target.value })}
            placeholder="Ej. Cancelería residencial y vidrio templado"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-medium"
          />
        </div>

        <div>
          <label
            htmlFor={compact ? 'inp-pdf-titulo-doc' : 'inp-taller-titulo-pdf'}
            className="block text-[12px] font-bold text-slate-500 mb-1"
          >
            Título en PDF de cotización
          </label>
          <input
            id={compact ? 'inp-pdf-titulo-doc' : 'inp-taller-titulo-pdf'}
            type="text"
            value={headerCfg.tituloCotizacion}
            onChange={(e) => updatePdfHeader({ tituloCotizacion: e.target.value })}
            placeholder="COTIZACIÓN DE ALUMINIO Y VIDRIO"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-medium"
          />
        </div>

        <div>
          <label
            htmlFor={compact ? 'inp-pdf-tel' : 'inp-taller-tel'}
            className="block text-[12px] font-bold text-slate-500 mb-1"
          >
            Teléfono / WhatsApp
          </label>
          <input
            id={compact ? 'inp-pdf-tel' : 'inp-taller-tel'}
            type="text"
            value={taller.tel}
            onChange={(e) => onUpdateTaller({ tel: e.target.value })}
            placeholder="Ej. 55 1234 5678"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 mono text-[13.5px] font-semibold"
          />
        </div>

        <div>
          <label
            htmlFor={compact ? 'inp-pdf-email' : 'inp-taller-email'}
            className="block text-[12px] font-bold text-slate-500 mb-1"
          >
            Correo electrónico
          </label>
          <input
            id={compact ? 'inp-pdf-email' : 'inp-taller-email'}
            type="email"
            value={headerCfg.email}
            onChange={(e) => updatePdfHeader({ email: e.target.value })}
            placeholder="Ej. ventas@mitaller.mx"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-medium"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={compact ? 'inp-pdf-ubicacion' : 'inp-taller-ubicacion'}
            className="block text-[12px] font-bold text-slate-500 mb-1"
          >
            Ubicación / Dirección del Taller
          </label>
          <input
            id={compact ? 'inp-pdf-ubicacion' : 'inp-taller-ubicacion'}
            type="text"
            value={taller.ubicacion || ''}
            onChange={(e) => onUpdateTaller({ ubicacion: e.target.value })}
            placeholder="Ej. Av. Hidalgo #420, Col. Centro, Puebla"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-medium"
          />
        </div>

        <div>
          <label
            htmlFor={compact ? 'inp-pdf-web' : 'inp-taller-web'}
            className="block text-[12px] font-bold text-slate-500 mb-1"
          >
            Sitio web o red social
          </label>
          <input
            id={compact ? 'inp-pdf-web' : 'inp-taller-web'}
            type="text"
            value={headerCfg.sitioWeb}
            onChange={(e) => updatePdfHeader({ sitioWeb: e.target.value })}
            placeholder="Ej. @aluminiosdelcentro"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-[13px] font-medium"
          />
        </div>

        <div>
          <label
            htmlFor={compact ? 'inp-pdf-rfc' : 'inp-taller-rfc'}
            className="block text-[12px] font-bold text-slate-500 mb-1"
          >
            RFC / Registro (opcional)
          </label>
          <input
            id={compact ? 'inp-pdf-rfc' : 'inp-taller-rfc'}
            type="text"
            value={headerCfg.rfc}
            onChange={(e) => updatePdfHeader({ rfc: e.target.value })}
            placeholder="Ej. XAXX010101000"
            className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 mono text-[13px] font-medium uppercase"
          />
        </div>
      </div>
    </div>
  );
};

interface ModalProps {
  open: boolean;
  taller: TallerConfig;
  proyectoNombre?: string;
  onUpdateTaller: (patch: Partial<TallerConfig>) => void;
  onClose: () => void;
  onExportPdf?: () => void;
  onShowToast?: (msg: string, topSuccess?: boolean) => void;
}

export const PdfHeaderCustomizerModal: React.FC<ModalProps> = ({
  open,
  taller,
  proyectoNombre,
  onUpdateTaller,
  onClose,
  onExportPdf,
  onShowToast,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pdf-header-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white text-[#1E293B] border border-slate-300 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 id="modal-pdf-header-title" className="m-0 text-[16px] sm:text-[17px] font-extrabold">
              Personalizar Encabezado del PDF
            </h2>
            <p className="m-0 text-[12px] text-slate-500">
              Agrega el logotipo de tu taller, color corporativo y datos de contacto
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar personalización del encabezado PDF"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center cursor-pointer text-slate-600"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <PdfHeaderCustomizer
            taller={taller}
            proyectoNombre={proyectoNombre}
            compact
            onUpdateTaller={onUpdateTaller}
            onShowToast={onShowToast}
          />
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-[13px] font-bold text-slate-700 cursor-pointer"
          >
            Guardar y Cerrar
          </button>
          {onExportPdf && (
            <button
              type="button"
              onClick={() => {
                onExportPdf();
                onClose();
              }}
              className="min-h-[42px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold cursor-pointer"
            >
              Guardar y Descargar PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
