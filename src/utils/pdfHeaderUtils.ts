import { COLORES_CONFIG, LINEAS_CONFIG } from './alumineroLogic';
import {
  DEFAULT_PDF_HEADER,
  formatMXN,
  HistorialItem,
  PdfHeaderColorId,
  PdfHeaderConfig,
  PdfLogoAlign,
  TallerConfig,
} from './storageHelpers';

export type PdfDocumentKind = 'cotizacion' | 'tecnico' | 'contrato' | 'historial';

export const PDF_LOGO_ZOOM_MIN = 60;
export const PDF_LOGO_ZOOM_MAX = 150;
export const PDF_LOGO_ZOOM_STEP = 5;

export interface PdfHeaderTheme {
  id: PdfHeaderColorId;
  label: string;
  hex: string;
  accentHex: string;
  bgRgb: [number, number, number];
  accentRgb: [number, number, number];
  textRgb: [number, number, number];
  mutedRgb: [number, number, number];
}

export const PDF_HEADER_THEMES: Record<PdfHeaderColorId, PdfHeaderTheme> = {
  navy: {
    id: 'navy',
    label: 'Azul Marino',
    hex: '#0B2545',
    accentHex: '#38BDF8',
    bgRgb: [11, 37, 69],
    accentRgb: [56, 189, 248],
    textRgb: [255, 255, 255],
    mutedRgb: [203, 213, 225],
  },
  blue: {
    id: 'blue',
    label: 'Azul Real',
    hex: '#1D4ED8',
    accentHex: '#93C5FD',
    bgRgb: [29, 78, 216],
    accentRgb: [147, 197, 253],
    textRgb: [255, 255, 255],
    mutedRgb: [219, 234, 254],
  },
  slate: {
    id: 'slate',
    label: 'Pizarra',
    hex: '#1E293B',
    accentHex: '#F59E0B',
    bgRgb: [30, 41, 59],
    accentRgb: [245, 158, 11],
    textRgb: [255, 255, 255],
    mutedRgb: [203, 213, 225],
  },
  emerald: {
    id: 'emerald',
    label: 'Verde Taller',
    hex: '#065F46',
    accentHex: '#34D399',
    bgRgb: [6, 95, 70],
    accentRgb: [52, 211, 153],
    textRgb: [255, 255, 255],
    mutedRgb: [209, 250, 229],
  },
  charcoal: {
    id: 'charcoal',
    label: 'Grafito',
    hex: '#18181B',
    accentHex: '#A1A1AA',
    bgRgb: [24, 24, 27],
    accentRgb: [161, 161, 170],
    textRgb: [255, 255, 255],
    mutedRgb: [212, 212, 216],
  },
};

export interface PdfLogoMetrics {
  frameW: number;
  frameH: number;
  drawW: number;
  drawH: number;
  innerPadMm: number;
  aspectRatio: number;
}

export interface PdfHeaderSpec {
  theme: PdfHeaderTheme;
  showLogo: boolean;
  logoDataUrl: string;
  logoZoomPct: number;
  logoAlign: PdfLogoAlign;
  workshopName: string;
  headline: string;
  documentLabel: string;
  eslogan: string;
  contactPrimary: string;
  contactSecondary: string;
  ubicacionLine: string;
  contactParts: string[];
  headerHeightMm: number;
  bodyStartY: number;
}

export function clampLogoZoomPct(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_PDF_HEADER.logoZoomPct;
  }
  return Math.max(PDF_LOGO_ZOOM_MIN, Math.min(PDF_LOGO_ZOOM_MAX, Math.round(value)));
}

export function normalizeLogoAlign(value?: unknown): PdfLogoAlign {
  if (value === 'left' || value === 'center' || value === 'right') {
    return value;
  }
  return DEFAULT_PDF_HEADER.logoAlign;
}

export function computePdfLogoMetrics(options: {
  naturalWidth?: number;
  naturalHeight?: number;
  zoomPct?: number;
  align?: PdfLogoAlign;
}): PdfLogoMetrics {
  const zoomPct = clampLogoZoomPct(options.zoomPct);
  const scale = zoomPct / 100;
  const align = normalizeLogoAlign(options.align);

  const hasDims =
    typeof options.naturalWidth === 'number' &&
    typeof options.naturalHeight === 'number' &&
    options.naturalWidth > 0 &&
    options.naturalHeight > 0;
  const rawRatio = hasDims ? options.naturalWidth! / options.naturalHeight! : 1;
  const aspectRatio = Math.max(0.45, Math.min(3.0, rawRatio));

  const innerPadMm = 1.2;
  const baseArtH = align === 'center' ? 14 : 17.5;
  const maxArtW = align === 'center' ? 72 : 42;
  const maxArtH = align === 'center' ? 22 : 26;

  let drawH = baseArtH * scale;
  let drawW = drawH * aspectRatio;

  if (drawW > maxArtW) {
    const k = maxArtW / drawW;
    drawW = maxArtW;
    drawH *= k;
  }
  if (drawH > maxArtH) {
    const k = maxArtH / drawH;
    drawH = maxArtH;
    drawW *= k;
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  drawW = round2(drawW);
  drawH = round2(drawH);

  return {
    frameW: round2(drawW + innerPadMm * 2),
    frameH: round2(drawH + innerPadMm * 2),
    drawW,
    drawH,
    innerPadMm,
    aspectRatio: round2(aspectRatio),
  };
}

export function resolvePdfHeaderConfig(
  taller?: Partial<TallerConfig> | null
): Required<PdfHeaderConfig> {
  const raw = taller?.pdfHeader || {};
  const colorTema: PdfHeaderColorId =
    raw.colorTema && raw.colorTema in PDF_HEADER_THEMES ? raw.colorTema : DEFAULT_PDF_HEADER.colorTema;

  return {
    mostrarLogo: typeof raw.mostrarLogo === 'boolean' ? raw.mostrarLogo : DEFAULT_PDF_HEADER.mostrarLogo,
    mostrarContacto:
      typeof raw.mostrarContacto === 'boolean' ? raw.mostrarContacto : DEFAULT_PDF_HEADER.mostrarContacto,
    eslogan: typeof raw.eslogan === 'string' ? raw.eslogan : DEFAULT_PDF_HEADER.eslogan,
    email: typeof raw.email === 'string' ? raw.email : DEFAULT_PDF_HEADER.email,
    sitioWeb: typeof raw.sitioWeb === 'string' ? raw.sitioWeb : DEFAULT_PDF_HEADER.sitioWeb,
    rfc: typeof raw.rfc === 'string' ? raw.rfc : DEFAULT_PDF_HEADER.rfc,
    colorTema,
    tituloCotizacion:
      typeof raw.tituloCotizacion === 'string'
        ? raw.tituloCotizacion
        : DEFAULT_PDF_HEADER.tituloCotizacion,
    logoZoomPct: clampLogoZoomPct(raw.logoZoomPct),
    logoAlign: normalizeLogoAlign(raw.logoAlign),
  };
}

export function buildPdfHeaderSpec(
  taller: Partial<TallerConfig> | null | undefined,
  kind: PdfDocumentKind,
  options?: { dateLabel?: string; naturalLogoWidth?: number; naturalLogoHeight?: number }
): PdfHeaderSpec {
  const cfg = resolvePdfHeaderConfig(taller);
  const theme = PDF_HEADER_THEMES[cfg.colorTema];
  const logoDataUrl = typeof taller?.logoDataUrl === 'string' ? taller.logoDataUrl.trim() : '';
  const showLogo = Boolean(logoDataUrl) && cfg.mostrarLogo;

  const workshopName = (taller?.nombre || '').trim();
  const eslogan = cfg.eslogan.trim();
  const customQuoteTitle = cfg.tituloCotizacion.trim();

  let documentLabel = 'COTIZACIÓN DE ALUMINIO Y VIDRIO';
  if (kind === 'tecnico') {
    documentLabel = 'ORDEN TÉCNICA DE CORTE';
  } else if (kind === 'contrato') {
    documentLabel = 'CONTRATO DE PRESTACIÓN DE SERVICIOS';
  } else if (kind === 'historial') {
    documentLabel = 'HISTORIAL DE COTIZACIONES';
  } else if (customQuoteTitle) {
    documentLabel = customQuoteTitle.toUpperCase();
  }

  const headline =
    kind === 'contrato'
      ? documentLabel
      : workshopName || documentLabel;

  const contactParts: string[] = [];
  if (cfg.mostrarContacto) {
    const tel = (taller?.tel || '').trim();
    const email = cfg.email.trim();
    const ubicacion = (taller?.ubicacion || '').trim();
    const sitioWeb = cfg.sitioWeb.trim();
    const rfc = cfg.rfc.trim();

    if (tel) contactParts.push(`Tel: ${tel}`);
    if (email) contactParts.push(email);
    if (ubicacion) contactParts.push(ubicacion);
    if (sitioWeb) contactParts.push(sitioWeb);
    if (rfc) contactParts.push(`RFC: ${rfc.toUpperCase()}`);
  }

  const primaryItems: string[] = [];
  if (cfg.mostrarContacto) {
    const tel = (taller?.tel || '').trim();
    const email = cfg.email.trim();
    if (tel) primaryItems.push(`Tel: ${tel}`);
    if (email) primaryItems.push(email);
  }

  const ubicacionLine = cfg.mostrarContacto ? (taller?.ubicacion || '').trim() : '';

  const secondaryItems: string[] = [];
  if (cfg.mostrarContacto) {
    const sitioWeb = cfg.sitioWeb.trim();
    const rfc = cfg.rfc.trim();
    if (sitioWeb) secondaryItems.push(sitioWeb);
    if (rfc) secondaryItems.push(`RFC: ${rfc.toUpperCase()}`);
  }

  const contactPrimary = primaryItems.join(' · ');
  const contactSecondary = secondaryItems.join(' · ');

  const hasExtraLines = Boolean(
    eslogan || ubicacionLine || contactSecondary || (kind === 'cotizacion' && workshopName)
  );
  const baseHeight = kind === 'contrato' ? 38 : hasExtraLines ? 37 : 30;

  let headerHeightMm = baseHeight;
  if (showLogo) {
    const logoMetrics = computePdfLogoMetrics({
      naturalWidth: options?.naturalLogoWidth,
      naturalHeight: options?.naturalLogoHeight,
      zoomPct: cfg.logoZoomPct,
      align: cfg.logoAlign,
    });
    if (cfg.logoAlign === 'center') {
      const textBlockMm =
        (workshopName || kind === 'contrato' ? 25 : 20) +
        (contactParts.length > 0 ? 5 : 0) +
        (ubicacionLine ? 4 : 0);
      headerHeightMm = Math.max(46, Math.ceil(logoMetrics.frameH + textBlockMm + 5));
    } else {
      const dateSpace = cfg.logoAlign === 'right' ? 14 : 11;
      headerHeightMm = Math.max(baseHeight, Math.ceil(logoMetrics.frameH + dateSpace));
    }
  } else if (cfg.logoAlign === 'center') {
    headerHeightMm = Math.max(baseHeight, kind === 'contrato' ? 40 : 34);
  }

  const bodyStartY = headerHeightMm + 9;

  return {
    theme,
    showLogo,
    logoDataUrl,
    logoZoomPct: cfg.logoZoomPct,
    logoAlign: cfg.logoAlign,
    workshopName,
    headline,
    documentLabel,
    eslogan,
    contactPrimary,
    contactSecondary,
    ubicacionLine,
    contactParts,
    headerHeightMm,
    bodyStartY,
  };
}

export interface HistorialPdfRow {
  index: number;
  fecha: string;
  referencia: string;
  especificacion: string;
  cantidad: number;
  total: number;
  totalFormatted: string;
}

export interface HistorialPdfReport {
  totalCotizaciones: number;
  totalPiezas: number;
  montoAcumulado: number;
  montoAcumuladoFormatted: string;
  rows: HistorialPdfRow[];
}

export function buildHistorialPdfReport(historial: HistorialItem[]): HistorialPdfReport {
  let totalPiezas = 0;
  let montoAcumulado = 0;

  const rows: HistorialPdfRow[] = historial.map((item, idx) => {
    const cantidad = Math.max(1, Number(item.cantidad) || 1);
    const total = Number.isFinite(Number(item.total)) ? Number(item.total) : 0;
    totalPiezas += cantidad;
    montoAcumulado += total;

    const lineaNombre = LINEAS_CONFIG[item.linea]?.nombre || String(item.linea || 'Perfil');
    const colorCorto = COLORES_CONFIG[item.color]?.corto || String(item.color || '');
    const medidas = `${item.anchoCm || 0}×${item.altoCm || 0} cm`;
    const especificacion = [lineaNombre, medidas, colorCorto].filter(Boolean).join(' · ');

    return {
      index: idx + 1,
      fecha: (item.fecha || '').trim() || 'Sin fecha',
      referencia: (item.referencia || '').trim() || `Cotización #${idx + 1}`,
      especificacion,
      cantidad,
      total,
      totalFormatted: formatMXN(total),
    };
  });

  return {
    totalCotizaciones: rows.length,
    totalPiezas,
    montoAcumulado,
    montoAcumuladoFormatted: formatMXN(montoAcumulado),
    rows,
  };
}

