import type { jsPDF as JsPdfType } from 'jspdf';
import {
  COLORES_CONFIG,
  CotizacionCalculada,
  DespieceCalculado,
  getRellenoLabel,
  LINEAS_CONFIG,
  PartidaObra,
  PRE_CUT_WARNING_TEXT,
  round2,
  TrabajoParams,
} from './alumineroLogic';
import {
  OptimizacionTramos1DResult,
  optimizarPartidasTramos1D,
} from './modulacionLogic';
import {
  ContratoClienteInfo,
  DEFAULT_HOJA_CONDITIONS,
  formatMXN,
  HistorialItem,
  HojaState,
  PartidaObraExtended,
  peekNextCotizacionFolio,
  issueNextCotizacionFolio,
  TallerConfig,
} from './storageHelpers';
import {
  buildHistorialPdfReport,
  buildPdfHeaderSpec,
  computePdfLogoMetrics,
  PdfHeaderSpec,
  PdfLogoMetrics,
} from './pdfHeaderUtils';

const APERTURA_LABELS: Record<string, string> = {
  corrediza: 'Corrediza',
  fija: 'Fija (Fijo 3")',
  guillotina: 'Guillotina',
  abatible: 'Abatible vertical',
  banderola: 'Banderola',
  oscilobatiente: 'Oscilobatiente',
  plegable: 'Plegable (libro)',
};

async function createLetterDoc(): Promise<JsPdfType> {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'mm', format: 'letter' });
}

function getSafeImageDims(doc: JsPdfType, dataUrl: string): { width?: number; height?: number } {
  if (!dataUrl) return {};
  try {
    const props = doc.getImageProperties(dataUrl);
    if (props && Number(props.width) > 0 && Number(props.height) > 0) {
      return { width: Number(props.width), height: Number(props.height) };
    }
  } catch {
    // ignorar metadatos no válidos
  }
  return {};
}

function drawWorkshopLogoInHeader(
  doc: JsPdfType,
  logoDataUrl: string,
  x: number,
  y: number,
  metrics: PdfLogoMetrics
): void {
  if (!logoDataUrl) return;
  try {
    const fmt = logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, metrics.frameW, metrics.frameH, 2, 2, 'F');
    doc.addImage(
      logoDataUrl,
      fmt,
      x + metrics.innerPadMm,
      y + metrics.innerPadMm,
      metrics.drawW,
      metrics.drawH
    );
  } catch {
    // ignorar imagen inválida
  }
}

function formatDateEsMx(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

export function buildCotizacionPdfFilename(folio: string, clienteNombre: string): string {
  const slug = (clienteNombre || 'cliente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cliente';
  const cleanFolio = (folio || 'COT').trim().toUpperCase().replace(/[^A-Z0-9-]+/g, '-');
  return `${cleanFolio}-${slug}.pdf`;
}

function drawHeaderContactLines(
  doc: JsPdfType,
  spec: PdfHeaderSpec,
  x: number,
  startY: number,
  maxW: number,
  align: 'left' | 'center'
): void {
  const textOpts = align === 'center' ? ({ align: 'center' } as const) : undefined;
  let y = startY;

  if (spec.contactPrimary) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...spec.theme.mutedRgb);
    const primaryLines = doc.splitTextToSize(spec.contactPrimary, maxW) as string[];
    doc.text(primaryLines[0] || '', x, y, textOpts);
    y += 4.0;
  }

  // Ubicación / Dirección del taller en una sola línea pequeña bajo el teléfono (si existe)
  if (spec.ubicacionLine) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...spec.theme.mutedRgb);
    const ubicLines = doc.splitTextToSize(spec.ubicacionLine, maxW) as string[];
    doc.text(ubicLines[0] || '', x, y, textOpts);
    y += 3.8;
  }

  if (spec.contactSecondary) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...spec.theme.mutedRgb);
    const secLines = doc.splitTextToSize(spec.contactSecondary, maxW) as string[];
    doc.text(secLines[0] || '', x, y, textOpts);
  }
}

function drawStandardWorkshopHeader(
  doc: JsPdfType,
  spec: PdfHeaderSpec,
  dateLabel: string,
  logoMetrics: PdfLogoMetrics | null,
  folioLabel?: string
): void {
  const h = spec.headerHeightMm;
  doc.setFillColor(...spec.theme.bgRgb);
  doc.rect(0, 0, 216, h, 'F');
  doc.setFillColor(...spec.theme.accentRgb);
  doc.rect(0, h - 1.5, 216, 1.5, 'F');

  const drawTopRightFolioAndDate = (rightX: number, topY: number) => {
    let curY = topY;
    if (folioLabel) {
      doc.setTextColor(...spec.theme.textRgb);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.text(folioLabel, rightX, curY, { align: 'right' });
      curY += 4.3;
    }
    doc.setTextColor(...spec.theme.mutedRgb);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.text(`Fecha: ${dateLabel}`, rightX, curY, { align: 'right' });
  };

  if (spec.logoAlign === 'center') {
    drawTopRightFolioAndDate(202, 8.8);

    let cursorY = 12;
    if (spec.showLogo && logoMetrics) {
      const logoX = (216 - logoMetrics.frameW) / 2;
      const logoY = 4.5;
      drawWorkshopLogoInHeader(doc, spec.logoDataUrl, logoX, logoY, logoMetrics);
      cursorY = logoY + logoMetrics.frameH + 5.8;
    }

    doc.setTextColor(...spec.theme.textRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(spec.headline.length > 34 ? 12.2 : 14);
    const headlineLines = doc.splitTextToSize(spec.headline, 170) as string[];
    doc.text(headlineLines[0] || spec.headline, 108, cursorY, { align: 'center' });
    cursorY += 5.4;

    if (spec.workshopName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.6);
      doc.setTextColor(...spec.theme.accentRgb);
      const subParts = [spec.documentLabel, spec.eslogan].filter(Boolean).join(' · ');
      const subLines = doc.splitTextToSize(subParts, 184) as string[];
      doc.text(subLines[0] || '', 108, cursorY, { align: 'center' });
      cursorY += 4.8;
    } else if (spec.eslogan) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.6);
      doc.setTextColor(...spec.theme.mutedRgb);
      const esloganLines = doc.splitTextToSize(spec.eslogan, 184) as string[];
      doc.text(esloganLines[0] || '', 108, cursorY, { align: 'center' });
      cursorY += 4.8;
    }

    drawHeaderContactLines(doc, spec, 108, cursorY, 184, 'center');
    return;
  }

  if (spec.logoAlign === 'right') {
    let textMaxW = 140;
    if (spec.showLogo && logoMetrics) {
      const logoX = 202 - logoMetrics.frameW;
      const logoY = 4.5;
      drawWorkshopLogoInHeader(doc, spec.logoDataUrl, logoX, logoY, logoMetrics);
      const metaY = Math.min(h - 7.5, logoY + logoMetrics.frameH + 4.2);
      drawTopRightFolioAndDate(202, metaY);
      textMaxW = Math.max(82, logoX - 6 - 14);
    } else {
      drawTopRightFolioAndDate(202, 10.2);
    }

    doc.setTextColor(...spec.theme.textRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(spec.headline.length > 34 ? 12.5 : 14.5);
    const headlineLines = doc.splitTextToSize(spec.headline, textMaxW) as string[];
    doc.text(headlineLines[0] || spec.headline, 14, 11.5);

    let cursorY = 17.5;
    if (spec.workshopName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(...spec.theme.accentRgb);
      const subParts = [spec.documentLabel, spec.eslogan].filter(Boolean).join(' · ');
      const subLines = doc.splitTextToSize(subParts, textMaxW) as string[];
      doc.text(subLines[0] || '', 14, cursorY);
      cursorY += 5.2;
    } else if (spec.eslogan) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(...spec.theme.mutedRgb);
      const esloganLines = doc.splitTextToSize(spec.eslogan, textMaxW) as string[];
      doc.text(esloganLines[0] || '', 14, cursorY);
      cursorY += 5.2;
    }

    drawHeaderContactLines(doc, spec, 14, cursorY, textMaxW, 'left');
    return;
  }

  // Alineación izquierda (por defecto)
  if (spec.showLogo && logoMetrics) {
    const logoY = Math.max(4.5, (h - 1.5 - logoMetrics.frameH) / 2);
    drawWorkshopLogoInHeader(doc, spec.logoDataUrl, 14, logoY, logoMetrics);
  }

  const textX = spec.showLogo && logoMetrics ? 14 + logoMetrics.frameW + 5 : 14;
  const maxFullW = 202 - textX;
  const rightMetaReserve = folioLabel ? 56 : 40;
  const maxHeadlineW = Math.max(68, maxFullW - rightMetaReserve);

  drawTopRightFolioAndDate(202, 10.2);

  doc.setTextColor(...spec.theme.textRgb);
  doc.setFont('helvetica', 'bold');
  const headlineSize = spec.headline.length > 34 ? 12.5 : 14.5;
  doc.setFontSize(headlineSize);
  const headlineLines = doc.splitTextToSize(spec.headline, maxHeadlineW) as string[];
  doc.text(headlineLines[0] || spec.headline, textX, 11.5);

  let cursorY = 17.5;
  if (spec.workshopName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(...spec.theme.accentRgb);
    const subParts = [spec.documentLabel, spec.eslogan].filter(Boolean).join(' · ');
    const subLines = doc.splitTextToSize(subParts, maxHeadlineW) as string[];
    doc.text(subLines[0] || '', textX, cursorY);
    cursorY += 5.2;
  } else if (spec.eslogan) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(...spec.theme.mutedRgb);
    const esloganLines = doc.splitTextToSize(spec.eslogan, maxHeadlineW) as string[];
    doc.text(esloganLines[0] || '', textX, cursorY);
    cursorY += 5.2;
  }

  drawHeaderContactLines(doc, spec, textX, cursorY, maxFullW, 'left');
}

export async function generarPdfTecnico(
  params: TrabajoParams,
  despiece: DespieceCalculado,
  cot: CotizacionCalculada,
  taller: TallerConfig
): Promise<void> {
  const doc = await createLetterDoc();
  const linea = LINEAS_CONFIG[params.linea];
  const color = COLORES_CONFIG[params.color];
  const panelDesc = getRellenoLabel(params.relleno, params.vidrio);
  const aperturaLabel =
    linea.categoria === 'ventanas' && !linea.esMosquitero && !linea.esCancelBano
      ? ` · ${APERTURA_LABELS[params.apertura] || params.apertura}`
      : '';

  const dateLabel = formatDateEsMx();
  const dims = getSafeImageDims(doc, taller.logoDataUrl);
  const headerSpec = buildPdfHeaderSpec(taller, 'tecnico', {
    dateLabel,
    naturalLogoWidth: dims.width,
    naturalLogoHeight: dims.height,
  });
  const logoMetrics = headerSpec.showLogo
    ? computePdfLogoMetrics({
        naturalWidth: dims.width,
        naturalHeight: dims.height,
        zoomPct: headerSpec.logoZoomPct,
        align: headerSpec.logoAlign,
      })
    : null;
  drawStandardWorkshopHeader(doc, headerSpec, dateLabel, logoMetrics);

  const infoY = headerSpec.bodyStartY - 1;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(
    `${linea.nombre}${aperturaLabel} (${params.anchoCm} × ${params.altoCm} cm) · ${params.cantidad} pza(s)`,
    14,
    infoY
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `Acabado: ${color.nombre} · ${linea.esMosquitero ? 'Tela Mosquitera' : `Panel: ${panelDesc}`} · Área: ${cot.areaRealM2.toFixed(2)} m²`,
    14,
    infoY + 7
  );

  let y = infoY + 17;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Lista de Cortes de Aluminio', 14, y);
  y += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, 188, 7, 'F');
  doc.setFontSize(9);
  doc.text('Perfil (Código)', 16, y);
  doc.text('Función', 82, y);
  doc.text('Pzas', 144, y);
  doc.text('Corte', 160, y);
  doc.text('Medida', 180, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  for (const p of despiece.perfiles) {
    const nameLines = doc.splitTextToSize(p.nombre, 62) as string[];
    const funcLines = doc.splitTextToSize(p.funcion, 58) as string[];
    const rowLines = Math.max(nameLines.length, funcLines.length);

    if (y + rowLines * 4.5 > 250) {
      doc.addPage();
      y = 20;
    }

    doc.text(nameLines, 16, y);
    doc.text(funcLines, 82, y);
    doc.text(String(p.pzas), 146, y);
    doc.text(p.angulo, 161, y);
    doc.text(`${p.medidaCm.toFixed(1)} cm`, 180, y);
    y += Math.max(5.8, rowLines * 4.5 + 1.5);
  }

  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(
    `Total Aluminio: ${despiece.totalAluminioM.toFixed(2)} m · ${despiece.tramos610} tramo(s) de 6.10 m`,
    14,
    y
  );

  y += 9;
  doc.setFontSize(11);
  doc.text(linea.esMosquitero ? '2. Malla Mosquitera y Consumibles' : '2. Vidrios y Medidas de Corte', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  for (const v of despiece.vidrios) {
    const vidText = `• ${v.nombre}: ${v.pzas} pza(s) de ${v.anchoCm} × ${v.altoCm} cm (${v.areaM2.toFixed(2)} m²)`;
    const wrapped = doc.splitTextToSize(vidText, 184) as string[];
    doc.text(wrapped, 16, y);
    y += wrapped.length * 4.8 + 1.5;
  }

  y += 4;
  if (y > 246) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. Herrajes, Escuadras y Tornillería', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const h of despiece.herrajes) {
    const hText = `• ${h.nombre}: ${h.cantidad} ${h.unidad} — ${h.detalle}`;
    const wrapped = doc.splitTextToSize(hText, 184) as string[];
    if (y + wrapped.length * 4.6 > 258) {
      doc.addPage();
      y = 20;
    }
    doc.text(wrapped, 16, y);
    y += wrapped.length * 4.6 + 1.2;
  }

  doc.save(`orden-taller-${params.linea}-${params.apertura}-${params.anchoCm}x${params.altoCm}.pdf`);
}

function drawPartidaCroquisPdf(
  doc: JsPdfType,
  item: PartidaObra,
  x: number,
  y: number,
  boxMaxW = 24,
  boxMaxH = 14
): void {
  const linea = LINEAS_CONFIG[item.linea];
  const isDoor = item.categoria === 'puertas' && !linea?.esCancelBano;
  const isMosq = Boolean(linea?.esMosquitero);
  const hojas = Math.max(1, Math.min(4, Number(item.hojas) || (item.apertura === 'fija' ? 1 : 2)));

  const ratio = Math.max(0.5, Math.min(1.8, (item.anchoCm || 120) / Math.max(20, item.altoCm || 100)));
  let bw = boxMaxW;
  let bh = bw / ratio;
  if (bh > boxMaxH) {
    bh = boxMaxH;
    bw = bh * ratio;
  }
  const bx = x + (boxMaxW - bw) / 2;
  const by = y + (boxMaxH - bh) / 2;

  doc.setDrawColor(30, 58, 138);
  if (isMosq) {
    doc.setFillColor(241, 245, 249);
  } else {
    doc.setFillColor(224, 242, 254);
  }
  doc.setLineWidth(0.35);
  doc.rect(bx, by, bw, bh, 'FD');

  if (isMosq) {
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.15);
    doc.line(bx, by + bh * 0.33, bx + bw, by + bh * 0.33);
    doc.line(bx, by + bh * 0.66, bx + bw, by + bh * 0.66);
    doc.line(bx + bw * 0.33, by, bx + bw * 0.33, by + bh);
    doc.line(bx + bw * 0.66, by, bx + bw * 0.66, by + bh);
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.35);
  }

  if (isDoor) {
    if (item.puertaIntermedio) {
      doc.line(bx, by + bh * 0.62, bx + bw, by + bh * 0.62);
    }
    if (item.sentidoPuerta === 'der') {
      doc.line(bx + bw, by, bx, by + bh / 2);
      doc.line(bx, by + bh / 2, bx + bw, by + bh);
    } else {
      doc.line(bx, by, bx + bw, by + bh / 2);
      doc.line(bx + bw, by + bh / 2, bx, by + bh);
    }
  } else if (item.apertura === 'fija' || item.linea === 'mosq-fijo') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(30, 64, 175);
    doc.text('FIJO', bx + bw / 2, by + bh / 2 + 1, { align: 'center' });
  } else if (item.apertura === 'abatible' || item.apertura === 'oscilobatiente') {
    if (item.invertido) {
      doc.line(bx + bw, by, bx, by + bh / 2);
      doc.line(bx, by + bh / 2, bx + bw, by + bh);
    } else {
      doc.line(bx, by, bx + bw, by + bh / 2);
      doc.line(bx + bw, by + bh / 2, bx, by + bh);
    }
    if (item.apertura === 'oscilobatiente') {
      doc.line(bx, by + bh, bx + bw / 2, by);
      doc.line(bx + bw / 2, by, bx + bw, by + bh);
    }
  } else if (item.apertura === 'banderola') {
    doc.line(bx, by, bx + bw / 2, by + bh);
    doc.line(bx + bw / 2, by + bh, bx + bw, by);
  } else if (item.apertura === 'guillotina') {
    doc.line(bx, by + bh / 2, bx + bw, by + bh / 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.setTextColor(30, 64, 175);
    doc.text('F', bx + bw / 2, by + bh * 0.3, { align: 'center' });
    doc.line(bx + bw / 2, by + bh * 0.85, bx + bw / 2, by + bh * 0.56);
    doc.line(bx + bw / 2 - 1.3, by + bh * 0.64, bx + bw / 2, by + bh * 0.56);
    doc.line(bx + bw / 2 + 1.3, by + bh * 0.64, bx + bw / 2, by + bh * 0.56);
  } else if (item.apertura === 'plegable') {
    for (let i = 1; i < hojas; i += 1) {
      const lx = bx + (bw / hojas) * i;
      doc.line(lx, by, lx, by + bh);
    }
    const cellW = bw / hojas;
    for (let i = 0; i < hojas; i += 1) {
      const cx1 = bx + cellW * i + 0.8;
      const cx2 = bx + cellW * (i + 1) - 0.8;
      const mid = (cx1 + cx2) / 2;
      const apexY = i % 2 === 0 ? by + bh * 0.32 : by + bh * 0.68;
      doc.line(cx1, by + bh / 2, mid, apexY);
      doc.line(mid, apexY, cx2, by + bh / 2);
    }
  } else {
    for (let i = 1; i < hojas; i += 1) {
      const lx = bx + (bw / hojas) * i;
      doc.line(lx, by, lx, by + bh);
    }
    const cellW = bw / hojas;
    const ay = by + bh / 2;
    for (let i = 0; i < hojas; i += 1) {
      const cellX = bx + cellW * i;
      let mode: 'fixed' | 'left' | 'right' = 'fixed';
      if (hojas === 2) {
        mode = item.invertido ? (i === 0 ? 'right' : 'fixed') : i === 0 ? 'fixed' : 'left';
      } else if (hojas === 3) {
        if (item.invertido) {
          mode = i === 0 ? 'right' : i === 2 ? 'left' : 'fixed';
        } else {
          mode = i === 1 ? 'right' : 'fixed';
        }
      } else if (item.invertido) {
        mode = i === 0 ? 'right' : i === hojas - 1 ? 'left' : 'fixed';
      } else {
        mode = i === 1 ? 'left' : i === 2 ? 'right' : 'fixed';
      }

      if (mode === 'fixed') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.8);
        doc.setTextColor(30, 64, 175);
        doc.text('F', cellX + cellW / 2, ay + 1, { align: 'center' });
      } else {
        const ax1 = cellX + cellW * 0.22;
        const ax2 = cellX + cellW * 0.78;
        doc.line(ax1, ay, ax2, ay);
        if (mode === 'left') {
          doc.line(ax1 + 1.3, ay - 1.1, ax1, ay);
          doc.line(ax1 + 1.3, ay + 1.1, ax1, ay);
        } else {
          doc.line(ax2 - 1.3, ay - 1.1, ax2, ay);
          doc.line(ax2 - 1.3, ay + 1.1, ax2, ay);
        }
      }
    }
  }

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.25);
  doc.line(bx, by + bh + 1.8, bx + bw, by + bh + 1.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text(`${item.anchoCm} cm`, bx + bw / 2, by + bh + 4.8, { align: 'center' });
  doc.text(`${item.altoCm}`, bx + bw + 1.8, by + bh / 2 + 1);
}

function drawSignatureImageProportional(
  doc: JsPdfType,
  signatureDataUrl: string,
  centerX: number,
  lineY: number,
  maxW = 72,
  maxH = 21
): void {
  if (!signatureDataUrl) return;
  try {
    const dims = getSafeImageDims(doc, signatureDataUrl);
    const ratio =
      dims.width && dims.height && dims.height > 0 ? dims.width / dims.height : 2.6;
    let w = maxW;
    let h = w / Math.max(0.4, ratio);
    if (h > maxH) {
      h = maxH;
      w = h * Math.max(0.4, ratio);
    }
    const fmt = signatureDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
    doc.addImage(signatureDataUrl, fmt, centerX - w / 2, lineY - h - 1.2, w, h);
  } catch {
    // ignorar firma inválida
  }
}

export interface CotizacionPdfOptions {
  folio?: string;
  dateLabel?: string;
  clienteFallback?: {
    nombre?: string;
    telefono?: string;
    direccion?: string;
  };
  signatureDataUrl?: string;
  acceptedDateLabel?: string;
}

export interface CotizacionPdfBlobResult {
  blob: Blob;
  filename: string;
  folio: string;
  dateLabel: string;
  clienteNombre: string;
  total: number;
}

/**
 * Construye el PDF de cotización como Blob sin incrementar el folio (`peekNextCotizacionFolio` si no se pasa folio).
 */
export async function generarPdfClienteBlob(
  hoja: HojaState,
  taller: TallerConfig,
  options?: CotizacionPdfOptions
): Promise<CotizacionPdfBlobResult> {
  const doc = await createLetterDoc();
  const dateLabel = options?.dateLabel || formatDateEsMx();
  const folio = options?.folio?.trim() || peekNextCotizacionFolio();
  const dims = getSafeImageDims(doc, taller.logoDataUrl);
  const headerSpec = buildPdfHeaderSpec(taller, 'cotizacion', {
    dateLabel,
    naturalLogoWidth: dims.width,
    naturalLogoHeight: dims.height,
  });
  const logoMetrics = headerSpec.showLogo
    ? computePdfLogoMetrics({
        naturalWidth: dims.width,
        naturalHeight: dims.height,
        zoomPct: headerSpec.logoZoomPct,
        align: headerSpec.logoAlign,
      })
    : null;

  drawStandardWorkshopHeader(
    doc,
    headerSpec,
    dateLabel,
    logoMetrics,
    `COTIZACIÓN No. ${folio}`
  );

  const clienteNombre =
    (hoja.proyecto || '').trim() ||
    (options?.clienteFallback?.nombre || '').trim() ||
    'Cliente General';
  const clienteTel =
    (hoja.clienteTel || '').trim() ||
    (options?.clienteFallback?.telefono || '').trim();
  const clienteDir =
    (hoja.clienteDir || '').trim() ||
    (options?.clienteFallback?.direccion || '').trim();

  let infoCursorY = headerSpec.bodyStartY - 1;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  const projLines = doc.splitTextToSize(`Proyecto / Cliente: ${clienteNombre}`, 186) as string[];
  doc.text(projLines, 14, infoCursorY);
  infoCursorY += projLines.length * 4.8 + 0.5;

  if (clienteTel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(51, 65, 85);
    doc.text(`Tel.: ${clienteTel}`, 14, infoCursorY);
    infoCursorY += 4.5;
  }

  if (clienteDir) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(51, 65, 85);
    const dirLines = doc.splitTextToSize(`Dir.: ${clienteDir}`, 186) as string[];
    doc.text(dirLines, 14, infoCursorY);
    infoCursorY += dirLines.length * 4.3 + 0.5;
  }

  const drawTableHeader = (headerY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, headerY - 4.5, 188, 7, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Dibujo', 16, headerY);
    doc.text('Concepto / Especificación', 52, headerY);
    doc.text('Medidas', 124, headerY);
    doc.text('Cant.', 158, headerY, { align: 'center' });
    doc.text('Importe', 200, headerY, { align: 'right' });
  };

  let y = infoCursorY + 6;
  drawTableHeader(y);
  y += 6.5;

  const includePhotos = Boolean(hoja.incluirFotosPdf);
  let subtotal = 0;

  for (const rawItem of hoja.partidas) {
    const item = rawItem as PartidaObraExtended;
    subtotal += item.totalLinea;
    const linea = LINEAS_CONFIG[item.linea];
    const color = COLORES_CONFIG[item.color];
    const panelDesc = linea.esMosquitero ? 'Malla' : getRellenoLabel(item.relleno, item.vidrio);
    const apTag =
      linea.categoria === 'ventanas' && !linea.esMosquitero && !linea.esCancelBano
        ? ` · ${APERTURA_LABELS[item.apertura] || item.apertura}`
        : linea.categoria === 'puertas' && !linea.esCancelBano
          ? ` · Puerta ${item.sentidoPuerta === 'der' ? 'Der.' : 'Izq.'}`
          : '';
    const desc = `${item.area ? `[${item.area}] ` : ''}${item.etiqueta ? `${item.etiqueta} · ` : ''}${linea.nombre}${apTag} (${color.corto} · ${panelDesc})${item.notas ? ` · Nota: ${item.notas}` : ''}`;
    const wrappedDesc = doc.splitTextToSize(desc, 68) as string[];
    const hasPhoto = includePhotos && Boolean(item.fotoDataUrl && item.fotoDataUrl.startsWith('data:image/'));
    const neededH = Math.max(hasPhoto ? 34 : 24, wrappedDesc.length * 4.5 + (hasPhoto ? 14 : 5));

    if (y + neededH > 235) {
      doc.addPage();
      y = 20;
      drawTableHeader(y);
      y += 6.5;
    }

    drawPartidaCroquisPdf(doc, item, 16, y, 24, 14);

    if (hasPhoto && item.fotoDataUrl) {
      try {
        const fmt = item.fotoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(item.fotoDataUrl, fmt, 52, y + wrappedDesc.length * 4.4 + 2, 18, 12);
      } catch {
        // ignorar foto no válida
      }
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.text(wrappedDesc, 52, y + 3.5);
    doc.text(`${item.anchoCm}×${item.altoCm} cm`, 124, y + 3.5);
    doc.text(String(item.cantidad), 158, y + 3.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatMXN(item.totalLinea), 200, y + 3.5, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, y + neededH - 1.5, 202, y + neededH - 1.5);
    y += neededH;
  }

  const descuento = subtotal * ((hoja.descuentoPct || 0) / 100);
  const base = subtotal - descuento;
  const iva = hoja.incluirIva ? base * 0.16 : 0;
  const total = base + iva;

  y += 6;
  if (y > 218) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(148, 163, 184);
  doc.line(120, y, 202, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Subtotal: ${formatMXN(subtotal)}`, 200, y, { align: 'right' });
  if (descuento > 0) {
    y += 6;
    doc.text(`Descuento (${hoja.descuentoPct}%): -${formatMXN(descuento)}`, 200, y, { align: 'right' });
  }
  if (iva > 0) {
    y += 6;
    doc.text(`IVA (16%): ${formatMXN(iva)}`, 200, y, { align: 'right' });
  }
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`TOTAL: ${formatMXN(total)}`, 200, y, { align: 'right' });

  const vigenciaDias =
    typeof hoja.vigenciaDias === 'number' && hoja.vigenciaDias > 0
      ? Math.round(hoja.vigenciaDias)
      : 7;
  const anticipoPct =
    typeof hoja.anticipoPct === 'number' && hoja.anticipoPct >= 0 && hoja.anticipoPct <= 100
      ? Math.round(hoja.anticipoPct)
      : 60;
  const saldoPct = Math.max(0, 100 - anticipoPct);
  const anticipoMonto = round2(total * (anticipoPct / 100));
  const saldoMonto = Math.max(0, round2(total - anticipoMonto));
  const tiempoEntrega =
    (hoja.tiempoEntrega || '').trim() || DEFAULT_HOJA_CONDITIONS.tiempoEntrega;

  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  doc.setTextColor(4, 120, 87);
  doc.text(`Anticipo (${anticipoPct}%): ${formatMXN(anticipoMonto)}`, 200, y, { align: 'right' });
  y += 5.2;
  doc.setTextColor(15, 23, 42);
  doc.text(`Saldo contra entrega (${saldoPct}%): ${formatMXN(saldoMonto)}`, 200, y, { align: 'right' });

  y += 10;
  if (y + 30 > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Notas y Condiciones:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(51, 65, 85);
  const condLines = doc.splitTextToSize(
    `• Cotización válida por ${vigenciaDias} días. Se requiere ${anticipoPct}% de anticipo para iniciar fabricación. No incluye albañilería salvo especificación.`,
    186
  ) as string[];
  doc.text(condLines, 14, y + 5.5);
  const afterCondY = y + 5.5 + condLines.length * 4.3;
  doc.text(
    `• Tiempo estimado de entrega: ${tiempoEntrega} · Garantía de 30 días en mano de obra y sellado.`,
    14,
    afterCondY + 1.5
  );
  y = afterCondY + 9;

  // Bloque de firma de aceptación siempre al pie de la última página
  const neededSigSpace = options?.signatureDataUrl ? 34 : 24;
  if (y + neededSigSpace > 268) {
    doc.addPage();
    y = 22;
  }

  const sigLineY = Math.max(y + 18, 248);
  if (options?.signatureDataUrl) {
    drawSignatureImageProportional(doc, options.signatureDataUrl, 108, sigLineY, 72, 21);
  }
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.35);
  doc.line(58, sigLineY, 158, sigLineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('FIRMA DE ACEPTACIÓN DEL CLIENTE', 108, sigLineY + 4.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(clienteNombre, 108, sigLineY + 9.2, { align: 'center' });

  if (options?.signatureDataUrl) {
    doc.setFontSize(7.8);
    doc.text(
      `Fecha de aceptación: ${options.acceptedDateLabel || dateLabel}`,
      108,
      sigLineY + 13.4,
      { align: 'center' }
    );
  }

  const blob = doc.output('blob');
  const filename = buildCotizacionPdfFilename(folio, clienteNombre);
  return {
    blob,
    filename,
    folio,
    dateLabel,
    clienteNombre,
    total,
  };
}

export async function generarPdfClienteLimpio(
  hoja: HojaState,
  taller: TallerConfig,
  options?: Omit<CotizacionPdfOptions, 'folio'> & { advanceFolio?: boolean }
): Promise<CotizacionPdfBlobResult> {
  const folio = options?.advanceFolio === false
    ? peekNextCotizacionFolio()
    : issueNextCotizacionFolio();
  const res = await generarPdfClienteBlob(hoja, taller, {
    ...options,
    folio,
  });
  const url = URL.createObjectURL(res.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = res.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  return res;
}

export interface ContratoPdfFileResult {
  blob: Blob;
  file: File;
  filename: string;
}

export async function buildPdfContratoServicioFile(
  hoja: HojaState,
  taller: TallerConfig,
  cliente: ContratoClienteInfo,
  folioOverride?: string,
  clientSignatureDataUrl?: string,
  providerSignatureDataUrl?: string
): Promise<ContratoPdfFileResult> {
  const doc = await createLetterDoc();
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const folio = folioOverride?.trim() || cliente.folio?.trim() || `CONT-${new Date().getFullYear()}-001`;
  const anticipoPct = Math.max(0, Math.min(100, Number(cliente.anticipoPct ?? 50)));
  const fechaEntregaTexto = cliente.fechaEntregaEstimada
    ? new Date(`${cliente.fechaEntregaEstimada}T12:00:00`).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'A convenir con el cliente';

  const dims = getSafeImageDims(doc, taller.logoDataUrl);
  const headerSpec = buildPdfHeaderSpec(taller, 'contrato', {
    dateLabel: fechaHoy,
    naturalLogoWidth: dims.width,
    naturalLogoHeight: dims.height,
  });
  const logoMetrics = headerSpec.showLogo
    ? computePdfLogoMetrics({
        naturalWidth: dims.width,
        naturalHeight: dims.height,
        zoomPct: headerSpec.logoZoomPct,
        align: headerSpec.logoAlign,
      })
    : null;
  const h = headerSpec.headerHeightMm;

  // Encabezado ejecutivo del taller
  doc.setFillColor(...headerSpec.theme.bgRgb);
  doc.rect(0, 0, 216, h, 'F');
  doc.setFillColor(...headerSpec.theme.accentRgb);
  doc.rect(0, h - 1.5, 216, 1.5, 'F');

  const tallerInfoLine =
    headerSpec.contactParts.length > 0
      ? headerSpec.contactParts.join(' · ')
      : `Tel: ${taller.tel || 'Sin especificar'}`;

  if (headerSpec.logoAlign === 'center') {
    doc.setTextColor(...headerSpec.theme.textRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`FOLIO: ${folio}`, 202, 9.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...headerSpec.theme.mutedRgb);
    doc.text(`Fecha: ${fechaHoy}`, 202, 14.2, { align: 'right' });
    doc.text(`Entrega: ${fechaEntregaTexto}`, 202, 18.8, { align: 'right' });

    let cursorY = 11.5;
    if (headerSpec.showLogo && logoMetrics) {
      const logoX = (216 - logoMetrics.frameW) / 2;
      const logoY = 4.5;
      drawWorkshopLogoInHeader(doc, headerSpec.logoDataUrl, logoX, logoY, logoMetrics);
      cursorY = logoY + logoMetrics.frameH + 5.5;
    }

    doc.setTextColor(...headerSpec.theme.textRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(headerSpec.documentLabel, 108, cursorY, { align: 'center' });
    cursorY += 5.2;
    doc.setFontSize(9.8);
    doc.text(headerSpec.workshopName || 'Taller de Aluminio y Vidrio', 108, cursorY, {
      align: 'center',
    });
    cursorY += 4.6;
    if (headerSpec.eslogan) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...headerSpec.theme.accentRgb);
      const esloganLines = doc.splitTextToSize(headerSpec.eslogan, 180) as string[];
      doc.text(esloganLines[0] || '', 108, cursorY, { align: 'center' });
      cursorY += 4.3;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.1);
    doc.setTextColor(...headerSpec.theme.mutedRgb);
    const wrappedTallerInfo = doc.splitTextToSize(tallerInfoLine, 184) as string[];
    doc.text(wrappedTallerInfo[0] || '', 108, cursorY, { align: 'center' });
    if (wrappedTallerInfo[1]) {
      doc.text(wrappedTallerInfo[1], 108, cursorY + 4, { align: 'center' });
    }
  } else if (headerSpec.logoAlign === 'right') {
    let rightMetaX = 202;
    if (headerSpec.showLogo && logoMetrics) {
      const logoX = 202 - logoMetrics.frameW;
      const logoY = Math.max(4.5, (h - 1.5 - logoMetrics.frameH) / 2);
      drawWorkshopLogoInHeader(doc, headerSpec.logoDataUrl, logoX, logoY, logoMetrics);
      rightMetaX = logoX - 5;
    }

    const leftMaxW = Math.max(74, rightMetaX - 48 - 14);
    doc.setTextColor(...headerSpec.theme.textRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const titleLines = doc.splitTextToSize(headerSpec.documentLabel, leftMaxW) as string[];
    doc.text(titleLines[0] || headerSpec.documentLabel, 14, 11);
    doc.setFontSize(9.8);
    const nameLines = doc.splitTextToSize(
      headerSpec.workshopName || 'Taller de Aluminio y Vidrio',
      leftMaxW
    ) as string[];
    doc.text(nameLines[0] || '', 14, 17);
    let infoY = 22;
    if (headerSpec.eslogan) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...headerSpec.theme.accentRgb);
      const esloganLines = doc.splitTextToSize(headerSpec.eslogan, leftMaxW) as string[];
      doc.text(esloganLines[0] || '', 14, infoY);
      infoY += 4.5;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.1);
    doc.setTextColor(...headerSpec.theme.mutedRgb);
    const wrappedTallerInfo = doc.splitTextToSize(tallerInfoLine, leftMaxW) as string[];
    doc.text(wrappedTallerInfo[0] || '', 14, infoY);
    if (wrappedTallerInfo[1]) {
      doc.text(wrappedTallerInfo[1], 14, infoY + 4.1);
    }

    doc.setTextColor(...headerSpec.theme.textRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.text(`FOLIO: ${folio}`, rightMetaX, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.1);
    doc.setTextColor(...headerSpec.theme.mutedRgb);
    doc.text(`Fecha: ${fechaHoy}`, rightMetaX, 18, { align: 'right' });
    doc.text(`Entrega est.: ${fechaEntregaTexto}`, rightMetaX, 23.5, { align: 'right' });
  } else {
    if (headerSpec.showLogo && logoMetrics) {
      const logoY = Math.max(4.5, (h - 1.5 - logoMetrics.frameH) / 2);
      drawWorkshopLogoInHeader(doc, headerSpec.logoDataUrl, 14, logoY, logoMetrics);
    }
    const headX = headerSpec.showLogo && logoMetrics ? 14 + logoMetrics.frameW + 5 : 14;
    const leftMaxW = Math.max(82, 146 - headX);
    doc.setTextColor(...headerSpec.theme.textRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.2);
    doc.text(headerSpec.documentLabel, headX, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(headerSpec.workshopName || 'Taller de Aluminio y Vidrio', headX, 17);
    let infoY = 22;
    if (headerSpec.eslogan) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(...headerSpec.theme.accentRgb);
      const esloganLines = doc.splitTextToSize(headerSpec.eslogan, leftMaxW) as string[];
      doc.text(esloganLines[0] || '', headX, infoY);
      infoY += 4.5;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(...headerSpec.theme.mutedRgb);
    const wrappedTallerInfo = doc.splitTextToSize(tallerInfoLine, leftMaxW) as string[];
    doc.text(wrappedTallerInfo[0] || '', headX, infoY);
    if (wrappedTallerInfo[1]) {
      doc.text(wrappedTallerInfo[1], headX, infoY + 4.2);
    }

    doc.setTextColor(...headerSpec.theme.textRgb);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`FOLIO: ${folio}`, 202, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(...headerSpec.theme.mutedRgb);
    doc.text(`Fecha: ${fechaHoy}`, 202, 18, { align: 'right' });
    doc.text(`Entrega est.: ${fechaEntregaTexto}`, 202, 23.5, { align: 'right' });
  }

  // Recuadro de Datos del Cliente y Obra
  const boxY = h + 4;
  doc.setDrawColor(148, 163, 184);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, boxY, 188, 25, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATOS DEL CLIENTE Y LUGAR DE OBRA', 18, boxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  const cliNombre = cliente.nombre.trim() || hoja.proyecto || 'Cliente por confirmar';
  const cliTel = cliente.telefono.trim() || hoja.clienteTel?.trim() || 'No especificado';
  const cliDir = cliente.direccion.trim() || hoja.clienteDir?.trim() || 'Por confirmar en obra';
  const cliProy = hoja.proyecto.trim() || 'Suministro e instalación de cancelería';

  doc.text(`Cliente: ${cliNombre}`, 18, boxY + 12);
  doc.text(`Teléfono: ${cliTel}`, 126, boxY + 12);
  doc.text(`Proyecto: ${cliProy}`, 18, boxY + 17.2);
  const dirLines = doc.splitTextToSize(`Dirección de obra: ${cliDir}`, 178) as string[];
  doc.text(dirLines[0] || '', 18, boxY + 22.2);

  // Tabla de trabajos contratados con croquis técnico acotado
  let y = boxY + 32;
  doc.setFillColor(...headerSpec.theme.bgRgb);
  doc.rect(14, y - 4.5, 188, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Dibujo Acotado', 16, y);
  doc.text('Descripción (Línea, Color y Vidrio/Espesor)', 54, y);
  doc.text('Cant.', 155, y, { align: 'center' });
  doc.text('Precio', 200, y, { align: 'right' });
  y += 6.5;
  doc.setTextColor(15, 23, 42);

  let subtotal = 0;
  for (const [idx, item] of hoja.partidas.entries()) {
    subtotal += item.totalLinea;
    const linea = LINEAS_CONFIG[item.linea];
    const color = COLORES_CONFIG[item.color];
    const panelDesc = getRellenoLabel(item.relleno, item.vidrio);
    const apLabel =
      linea.categoria === 'ventanas' && !linea.esMosquitero && !linea.esCancelBano
        ? ` · ${APERTURA_LABELS[item.apertura] || item.apertura}`
        : '';
    const titleDesc = `${idx + 1}. ${item.etiqueta ? `${item.etiqueta} · ` : ''}${linea.nombre}${apLabel}`;
    const specDesc = `${item.area ? `Área: ${item.area} · ` : ''}Color: ${color.nombre} · ${
      linea.esMosquitero ? 'Malla mosquitera' : `Panel: ${panelDesc}`
    }`;
    const wrappedTitle = doc.splitTextToSize(titleDesc, 92) as string[];
    const wrappedSpec = doc.splitTextToSize(specDesc, 92) as string[];
    const textH = (wrappedTitle.length + wrappedSpec.length) * 4.3 + 5;
    const rowH = Math.max(24, textH);

    if (y + rowH > 244) {
      doc.addPage();
      y = 20;
    }

    drawPartidaCroquisPdf(doc, item, 16, y, 24, 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text(wrappedTitle, 54, y + 3.8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(wrappedSpec, 54, y + 3.8 + wrappedTitle.length * 4.2);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    doc.text(`${item.cantidad} pza`, 155, y + 4.5, { align: 'center' });
    doc.text(formatMXN(item.totalLinea), 200, y + 4.5, { align: 'right' });
    if (item.cantidad > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(100, 116, 139);
      doc.text(`${formatMXN(item.totalLinea / item.cantidad)} c/u`, 200, y + 9, { align: 'right' });
      doc.setTextColor(15, 23, 42);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + rowH - 1.5, 202, y + rowH - 1.5);
    y += rowH;
  }

  const descuento = subtotal * ((hoja.descuentoPct || 0) / 100);
  const base = subtotal - descuento;
  const iva = hoja.incluirIva ? base * 0.16 : 0;
  const total = base + iva;
  const anticipo =
    typeof cliente.anticipoRecibido === 'number' && cliente.anticipoRecibido >= 0
      ? Math.min(total, cliente.anticipoRecibido)
      : round2(total * (anticipoPct / 100));
  const anticipoPctReal = total > 0 ? round2((anticipo / total) * 100) : anticipoPct;
  const saldo = Math.max(0, round2(total - anticipo));

  y += 4;
  if (y + 82 > 266) {
    doc.addPage();
    y = 20;
  }

  const boxH = 33 + (descuento > 0 ? 5 : 0) + (iva > 0 ? 5 : 0);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(116, y, 86, boxH, 2, 2, 'FD');

  let ty = y + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.text('Subtotal:', 120, ty);
  doc.text(formatMXN(subtotal), 198, ty, { align: 'right' });
  if (descuento > 0) {
    ty += 5;
    doc.text(`Descuento (${hoja.descuentoPct}%):`, 120, ty);
    doc.text(`-${formatMXN(descuento)}`, 198, ty, { align: 'right' });
  }
  if (iva > 0) {
    ty += 5;
    doc.text('IVA (16%):', 120, ty);
    doc.text(formatMXN(iva), 198, ty, { align: 'right' });
  }
  ty += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('GRAN TOTAL:', 120, ty);
  doc.text(formatMXN(total), 198, ty, { align: 'right' });
  ty += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(4, 120, 87);
  doc.text(`Anticipo Recibido (${anticipoPctReal}%):`, 120, ty);
  doc.text(formatMXN(anticipo), 198, ty, { align: 'right' });
  ty += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Saldo contra entrega:', 120, ty);
  doc.text(formatMXN(saldo), 198, ty, { align: 'right' });

  const cy = y + 1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLÁUSULAS DEL CONTRATO', 14, cy + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  const c1 =
    cliente.clausulaAnticipo?.trim() ||
    'El anticipo se destina a la compra de material a medida; una vez iniciado el corte no aplican cancelaciones ni cambios de medida sin costo adicional.';
  const c2 =
    cliente.clausulaEntrega?.trim() ||
    'La fecha de entrega corre a partir del pago del anticipo y verificación de medidas finales en obra.';
  const c3 =
    cliente.clausulaCondicionesVano?.trim() ||
    'El cliente deberá entregar los vanos terminados y libres; trabajos de albañilería o electricidad no están incluidos.';
  const c4 =
    cliente.clausulaGarantia?.trim() ||
    'Garantía en mano de obra, sellado hermético y herrajes por uso normal (no cubre rotura de cristales posterior a la entrega).';
  const clausulasText = [
    `1) Anticipo y Fabricación: ${c1}`,
    `2) Entrega e Instalación: ${c2}`,
    `3) Condiciones del Vano: ${c3}`,
    `4) Garantía: ${c4}`,
  ].join('\n');
  const clausulasLines = doc.splitTextToSize(clausulasText, 97) as string[];
  doc.text(clausulasLines, 14, cy + 9);

  const fy = Math.max(y + boxH + 24, cy + 12 + clausulasLines.length * 3.6 + 16);
  let targetSigY = fy;
  if (fy + 22 > 272) {
    doc.addPage();
    targetSigY = 46;
  }

  doc.setDrawColor(71, 85, 105);
  if (providerSignatureDataUrl) {
    drawSignatureImageProportional(doc, providerSignatureDataUrl, 58, targetSigY, 64, 20);
  }
  if (clientSignatureDataUrl) {
    drawSignatureImageProportional(doc, clientSignatureDataUrl, 158, targetSigY, 64, 20);
  }
  doc.line(24, targetSigY, 92, targetSigY);
  doc.line(124, targetSigY, 192, targetSigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text('El Prestador del Servicio', 58, targetSigY + 5, { align: 'center' });
  doc.text('El Cliente', 158, targetSigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(taller.nombre || 'Taller de Aluminio y Vidrio', 58, targetSigY + 9.5, { align: 'center' });
  doc.text(cliNombre, 158, targetSigY + 9.5, { align: 'center' });

  const safeClientSlug = (cliNombre || 'cliente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cliente';
  const filename = `contrato-${folio.toLowerCase()}-${safeClientSlug}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  return { blob, file, filename };
}

export async function generarPdfContratoServicio(
  hoja: HojaState,
  taller: TallerConfig,
  cliente: ContratoClienteInfo,
  folioOverride?: string,
  clientSignatureDataUrl?: string,
  providerSignatureDataUrl?: string
): Promise<ContratoPdfFileResult> {
  const res = await buildPdfContratoServicioFile(
    hoja,
    taller,
    cliente,
    folioOverride,
    clientSignatureDataUrl,
    providerSignatureDataUrl
  );
  const url = URL.createObjectURL(res.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = res.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  return res;
}

export async function generarPdfHistorialCotizaciones(
  historial: HistorialItem[],
  taller: TallerConfig
): Promise<boolean> {
  if (!Array.isArray(historial) || historial.length === 0) {
    return false;
  }

  const doc = await createLetterDoc();
  const now = new Date();
  const dateLabel = formatDateEsMx(now);
  const dims = getSafeImageDims(doc, taller.logoDataUrl);
  const headerSpec = buildPdfHeaderSpec(taller, 'historial', {
    dateLabel,
    naturalLogoWidth: dims.width,
    naturalLogoHeight: dims.height,
  });
  const logoMetrics = headerSpec.showLogo
    ? computePdfLogoMetrics({
        naturalWidth: dims.width,
        naturalHeight: dims.height,
        zoomPct: headerSpec.logoZoomPct,
        align: headerSpec.logoAlign,
      })
    : null;

  drawStandardWorkshopHeader(doc, headerSpec, dateLabel, logoMetrics);

  const report = buildHistorialPdfReport(historial);
  const introY = headerSpec.bodyStartY - 1;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('Historial de Cotizaciones Guardadas', 14, introY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Registros: ${report.totalCotizaciones} · Piezas totales: ${report.totalPiezas} · Total acumulado: ${report.montoAcumuladoFormatted}`,
    14,
    introY + 5.5
  );

  const drawTableHeader = (headerY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, headerY - 4.5, 188, 7, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('#', 16, headerY);
    doc.text('Fecha', 24, headerY);
    doc.text('Referencia / Trabajo', 49, headerY);
    doc.text('Línea, Medidas y Color', 98, headerY);
    doc.text('Cant.', 168, headerY, { align: 'center' });
    doc.text('Total', 200, headerY, { align: 'right' });
  };

  let y = introY + 13;
  drawTableHeader(y);
  y += 6.5;

  for (const row of report.rows) {
    const refLines = doc.splitTextToSize(row.referencia, 45) as string[];
    const specLines = doc.splitTextToSize(row.especificacion, 60) as string[];
    const lineCount = Math.max(refLines.length, specLines.length, 1);
    const rowH = Math.max(7.5, lineCount * 4.2 + 3);

    if (y + rowH > 246) {
      doc.addPage();
      y = 20;
      drawTableHeader(y);
      y += 6.5;
    }

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.text(String(row.index), 16, y);
    doc.text(row.fecha.slice(0, 12), 24, y);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(refLines, 49, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(specLines, 98, y);

    doc.setTextColor(15, 23, 42);
    doc.text(String(row.cantidad), 168, y, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(row.totalFormatted, 200, y, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, y + rowH - 3.2, 202, y + rowH - 3.2);
    y += rowH;
  }

  y += 4;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(120, y, 82, 12, 1.5, 1.5, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Total acumulado:', 124, y + 7.5);
  doc.text(report.montoAcumuladoFormatted, 198, y + 7.5, { align: 'right' });

  const isoDate = now.toISOString().slice(0, 10);
  doc.save(`historial-cotizaciones-${isoDate}.pdf`);
  return true;
}

/**
 * Genera el PDF de Orden de Producción (Para Taller) — CERO precios ni montos.
 * Incluye resumen de tramos 6.10 m por perfil, diagrama visual barra por barra,
 * lista de vidrios/paneles y advertencia ámbar de verificación antes de cortar.
 */
export async function generarPdfOrdenProduccionTaller(
  hoja: HojaState,
  taller: TallerConfig,
  optResult?: OptimizacionTramos1DResult
): Promise<boolean> {
  if (!hoja.partidas || hoja.partidas.length === 0) return false;
  const doc = await createLetterDoc();
  const dateLabel = formatDateEsMx();
  const dims = getSafeImageDims(doc, taller.logoDataUrl);
  const headerSpec = buildPdfHeaderSpec(taller, 'tecnico', {
    dateLabel,
    naturalLogoWidth: dims.width,
    naturalLogoHeight: dims.height,
  });
  const logoMetrics = headerSpec.showLogo
    ? computePdfLogoMetrics({
        naturalWidth: dims.width,
        naturalHeight: dims.height,
        zoomPct: headerSpec.logoZoomPct,
        align: headerSpec.logoAlign,
      })
    : null;

  drawStandardWorkshopHeader(
    doc,
    {
      ...headerSpec,
      documentLabel: 'ORDEN DE PRODUCCIÓN (PARA TALLER)',
    },
    dateLabel,
    logoMetrics,
    'SOLO PRODUCCIÓN · SIN PRECIOS'
  );

  const opt = optResult || optimizarPartidasTramos1D(hoja.partidas, [], taller.optimizador);
  const proyectoLabel = (hoja.proyecto || '').trim() || 'Obra / Cliente General';
  const totalPiezas = hoja.partidas.reduce((acc, p) => acc + Math.max(1, Number(p.cantidad) || 1), 0);

  let y = headerSpec.bodyStartY - 1;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Obra / Proyecto: ${proyectoLabel}`, 14, y);
  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Partidas: ${hoja.partidas.length} (${totalPiezas} pza(s)) · Tramos 6.10 m requeridos: ${opt.tramos610Totales} · Aprovechamiento: ${opt.aprovechamientoGlobalPct}% · Merma real: ${opt.mermaRealPct}%`,
    14,
    y
  );
  y += 7;

  // 1. Resumen de partidas (sin precios)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. Partidas a Fabricar', 14, y);
  y += 5.5;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, 188, 6.5, 'F');
  doc.setFontSize(8.5);
  doc.text('#', 16, y);
  doc.text('Área / Especificación', 24, y);
  doc.text('Medidas (cm)', 136, y);
  doc.text('Cant.', 198, y, { align: 'right' });
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  hoja.partidas.forEach((p, idx) => {
    const l = LINEAS_CONFIG[p.linea];
    const c = COLORES_CONFIG[p.color];
    const rel = l.esMosquitero ? 'Tela Mosquitera' : getRellenoLabel(p.relleno, p.vidrio);
    const label = `${p.area ? `[${p.area}] ` : ''}${p.etiqueta ? `${p.etiqueta} · ` : ''}${l.nombre} · ${c.corto} · ${rel}`;
    const wrapped = doc.splitTextToSize(label, 108) as string[];
    const rowH = Math.max(5.5, wrapped.length * 4.1 + 1.5);
    if (y + rowH > 246) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(15, 23, 42);
    doc.text(String(idx + 1), 16, y);
    doc.text(wrapped, 24, y);
    doc.text(`${p.anchoCm} × ${p.altoCm} cm`, 136, y);
    doc.text(`×${p.cantidad}`, 198, y, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + rowH - 2, 202, y + rowH - 2);
    y += rowH;
  });

  // 2. Resumen y Diagrama Barra por Barra (6.10 m)
  y += 6;
  if (y > 236) {
    doc.addPage();
    y = 20;
  }
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. Optimización y Diagrama de Cortes por Barra (6.10 m)', 14, y);
  y += 6;

  const SEG_RGBS: Array<[number, number, number]> = [
    [37, 99, 235],
    [13, 148, 136],
    [79, 70, 229],
    [2, 132, 199],
    [217, 119, 6],
  ];

  for (const grupo of opt.grupos) {
    if (y + 18 > 248) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, 188, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${grupo.codigo} · ${grupo.perfilNombre}`, 16, y);
    doc.text(
      `${grupo.tramos610Requeridos} tramo(s) 6.10 m · Aprov: ${grupo.aprovechamientoPct}%`,
      200,
      y,
      { align: 'right' }
    );
    y += 5.5;

    for (const barra of grupo.barras) {
      if (y + 17 > 248) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(51, 65, 85);
      const remLabel = barra.esMerma
        ? `Merma: ${barra.sobranteCm.toFixed(1)} cm`
        : `Sobrante usable: ${barra.sobranteCm.toFixed(1)} cm`;
      doc.text(
        `${barra.etiquetaOrigen} · Usado: ${barra.usadoCm.toFixed(1)} cm · ${remLabel}`,
        16,
        y
      );
      y += 2;

      // Barra visual (ancho total = 186 mm)
      const barX = 16;
      const barW = 184;
      const barH = 6.5;
      doc.setFillColor(226, 232, 240);
      doc.rect(barX, y, barW, barH, 'F');

      let curX = barX;
      const totalLen = Math.max(1, barra.largoTotalCm);
      barra.cortes.forEach((corte, cIdx) => {
        const segW = Math.max(3, (corte.medidaCm / totalLen) * barW);
        const drawW = Math.min(segW, barX + barW - curX);
        if (drawW <= 0) return;
        const rgb = SEG_RGBS[cIdx % SEG_RGBS.length];
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.rect(curX, y, drawW, barH, 'F');
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.25);
        doc.line(curX + drawW, y, curX + drawW, y + barH);
        if (drawW >= 12) {
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.text(`${corte.medidaCm.toFixed(1)}`, curX + drawW / 2, y + 4.3, { align: 'center' });
        }
        curX += drawW;
      });

      const remW = Math.max(0, barX + barW - curX);
      if (remW > 0.5) {
        if (barra.esMerma) {
          doc.setFillColor(254, 205, 211);
        } else {
          doc.setFillColor(167, 243, 208);
        }
        doc.rect(curX, y, remW, barH, 'F');
        if (remW >= 16) {
          doc.setTextColor(barra.esMerma ? 159 : 6, barra.esMerma ? 18 : 95, barra.esMerma ? 57 : 70);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.2);
          doc.text(
            `${barra.esMerma ? 'Merma' : 'Usable'} ${barra.sobranteCm.toFixed(0)}`,
            curX + remW / 2,
            y + 4.3,
            { align: 'center' }
          );
        }
      }

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      doc.rect(barX, y, barW, barH, 'S');
      y += barH + 4.5;
    }
    y += 1.5;
  }

  // 3. Lista consolidada de vidrios / paneles
  const allVidrios = hoja.partidas.flatMap((p, idx) =>
    (p.despiece?.vidrios || []).map((v) => ({
      partidaLabel: `#${idx + 1} ${p.area || 'General'} · ${p.etiqueta || LINEAS_CONFIG[p.linea]?.nombre || ''}`,
      nombre: v.nombre,
      espesor: v.espesorLabel,
      anchoCm: v.anchoCm,
      altoCm: v.altoCm,
      pzas: v.pzas * Math.max(1, Number(p.cantidad) || 1),
      areaM2: round2(v.areaM2 * Math.max(1, Number(p.cantidad) || 1)),
    }))
  );

  if (allVidrios.length > 0) {
    y += 3;
    if (y > 235) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('3. Lista de Cortes de Vidrio y Paneles', 14, y);
    y += 5.5;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, 188, 6.5, 'F');
    doc.setFontSize(8.3);
    doc.text('Partida / Vidrio', 16, y);
    doc.text('Material', 102, y);
    doc.text('Medidas (cm)', 152, y);
    doc.text('Pzas', 198, y, { align: 'right' });
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    for (const v of allVidrios) {
      const desc = `${v.partidaLabel} (${v.nombre})`;
      const wrapped = doc.splitTextToSize(desc, 82) as string[];
      const rowH = Math.max(5.2, wrapped.length * 4 + 1.5);
      if (y + rowH > 246) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(15, 23, 42);
      doc.text(wrapped, 16, y);
      doc.text(v.espesor.slice(0, 26), 102, y);
      doc.text(`${v.anchoCm} × ${v.altoCm} cm`, 152, y);
      doc.text(String(v.pzas), 198, y, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + rowH - 1.8, 202, y + rowH - 1.8);
      y += rowH;
    }
  }

  // Aviso técnico ámbar al pie antes de cortar
  y += 6;
  if (y + 18 > 266) {
    doc.addPage();
    y = 22;
  }
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, y, 188, 14, 2, 2, 'FD');
  doc.setTextColor(120, 53, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const warnLines = doc.splitTextToSize(PRE_CUT_WARNING_TEXT, 180) as string[];
  doc.text(warnLines, 18, y + 5.5);

  const slug = proyectoLabel
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'taller';
  doc.save(`orden-produccion-taller-${slug}.pdf`);
  return true;
}

