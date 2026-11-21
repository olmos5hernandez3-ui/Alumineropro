import {
  DEFAULT_PDF_HEADER,
  PdfHeaderColorId,
  PdfHeaderConfig,
  TallerConfig,
} from './storageHelpers';

export type PdfDocumentKind = 'cotizacion' | 'tecnico' | 'contrato';

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

export interface PdfHeaderSpec {
  theme: PdfHeaderTheme;
  showLogo: boolean;
  logoDataUrl: string;
  workshopName: string;
  headline: string;
  documentLabel: string;
  eslogan: string;
  contactPrimary: string;
  contactSecondary: string;
  contactParts: string[];
  headerHeightMm: number;
  bodyStartY: number;
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
  };
}

export function buildPdfHeaderSpec(
  taller: Partial<TallerConfig> | null | undefined,
  kind: PdfDocumentKind,
  options?: { dateLabel?: string }
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

  const dateText = options?.dateLabel ? `Fecha: ${options.dateLabel}` : '';
  const primaryItems: string[] = [];
  if (cfg.mostrarContacto) {
    const tel = (taller?.tel || '').trim();
    const email = cfg.email.trim();
    if (tel) primaryItems.push(`Tel: ${tel}`);
    if (email) primaryItems.push(email);
  }
  if (dateText && kind !== 'contrato') {
    primaryItems.push(dateText);
  }

  const secondaryItems: string[] = [];
  if (cfg.mostrarContacto) {
    const ubicacion = (taller?.ubicacion || '').trim();
    const sitioWeb = cfg.sitioWeb.trim();
    const rfc = cfg.rfc.trim();
    if (ubicacion) secondaryItems.push(ubicacion);
    if (sitioWeb) secondaryItems.push(sitioWeb);
    if (rfc) secondaryItems.push(`RFC: ${rfc.toUpperCase()}`);
  }

  const contactPrimary = primaryItems.join(' · ');
  const contactSecondary = secondaryItems.join(' · ');

  const hasExtraLines = Boolean(eslogan || contactSecondary || (kind === 'cotizacion' && workshopName));
  const headerHeightMm = kind === 'contrato' ? 38 : hasExtraLines ? 36 : 30;
  const bodyStartY = headerHeightMm + 9;

  return {
    theme,
    showLogo,
    logoDataUrl,
    workshopName,
    headline,
    documentLabel,
    eslogan,
    contactPrimary,
    contactSecondary,
    contactParts,
    headerHeightMm,
    bodyStartY,
  };
}
