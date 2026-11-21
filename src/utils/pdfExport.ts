import { jsPDF } from 'jspdf';
import {
  COLORES_CONFIG,
  CotizacionCalculada,
  DespieceCalculado,
  getRellenoLabel,
  LINEAS_CONFIG,
  PartidaObra,
  round2,
  TrabajoParams,
} from './alumineroLogic';
import { ContratoClienteInfo, formatMXN, HojaState, TallerConfig } from './storageHelpers';
import { buildPdfHeaderSpec, PdfHeaderSpec } from './pdfHeaderUtils';

const APERTURA_LABELS: Record<string, string> = {
  corrediza: 'Corrediza',
  fija: 'Fija (Fijo 3")',
  guillotina: 'Guillotina',
  abatible: 'Abatible vertical',
  banderola: 'Banderola',
  oscilobatiente: 'Oscilobatiente',
  plegable: 'Plegable (libro)',
};

function drawWorkshopLogoInHeader(doc: jsPDF, logoDataUrl: string, x: number, y: number, size: number): void {
  if (!logoDataUrl) return;
  try {
    const fmt = logoDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, size, size, 2, 2, 'F');
    doc.addImage(logoDataUrl, fmt, x + 1, y + 1, size - 2, size - 2);
  } catch {
    // ignore invalid image
  }
}

function drawStandardWorkshopHeader(
  doc: jsPDF,
  spec: PdfHeaderSpec,
  dateLabel: string
): void {
  const h = spec.headerHeightMm;
  doc.setFillColor(...spec.theme.bgRgb);
  doc.rect(0, 0, 216, h, 'F');
  doc.setFillColor(...spec.theme.accentRgb);
  doc.rect(0, h - 1.5, 216, 1.5, 'F');

  const logoSize = h >= 34 ? 22 : 19;
  const logoY = Math.max(4.5, (h - 1.5 - logoSize) / 2);
  if (spec.showLogo) {
    drawWorkshopLogoInHeader(doc, spec.logoDataUrl, 14, logoY, logoSize);
  }

  const textX = spec.showLogo ? 14 + logoSize + 5 : 14;
  const maxFullW = 202 - textX;
  const maxHeadlineW = Math.max(70, maxFullW - 40);

  doc.setTextColor(...spec.theme.mutedRgb);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Fecha: ${dateLabel}`, 202, 10.5, { align: 'right' });

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
    const subLines = doc.splitTextToSize(subParts, maxFullW) as string[];
    doc.text(subLines[0] || '', textX, cursorY);
    cursorY += 5.2;
  } else if (spec.eslogan) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(...spec.theme.mutedRgb);
    const esloganLines = doc.splitTextToSize(spec.eslogan, maxFullW) as string[];
    doc.text(esloganLines[0] || '', textX, cursorY);
    cursorY += 5.2;
  }

  if (spec.contactParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...spec.theme.mutedRgb);
    const contactText = spec.contactParts.join(' · ');
    const contactLines = doc.splitTextToSize(contactText, maxFullW) as string[];
    doc.text(contactLines[0] || '', textX, cursorY);
    if (contactLines[1]) {
      doc.text(contactLines[1], textX, cursorY + 4.3);
    }
  }
}

export function generarPdfTecnico(
  params: TrabajoParams,
  despiece: DespieceCalculado,
  cot: CotizacionCalculada,
  taller: TallerConfig
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const linea = LINEAS_CONFIG[params.linea];
  const color = COLORES_CONFIG[params.color];
  const panelDesc = getRellenoLabel(params.relleno, params.vidrio);
  const aperturaLabel =
    linea.categoria === 'ventanas' && !linea.esMosquitero && !linea.esCancelBano
      ? ` · ${APERTURA_LABELS[params.apertura] || params.apertura}`
      : '';

  const dateLabel = new Date().toLocaleDateString('es-MX');
  const headerSpec = buildPdfHeaderSpec(taller, 'tecnico', { dateLabel });
  drawStandardWorkshopHeader(doc, headerSpec, dateLabel);

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
  doc: jsPDF,
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
    // Corrediza / cancel por número de hojas
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

  // Cotas de ancho (abajo) y alto (derecha)
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.25);
  doc.line(bx, by + bh + 1.8, bx + bw, by + bh + 1.8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text(`${item.anchoCm} cm`, bx + bw / 2, by + bh + 4.8, { align: 'center' });
  doc.text(`${item.altoCm}`, bx + bw + 1.8, by + bh / 2 + 1);
}

export function generarPdfClienteLimpio(hoja: HojaState, taller: TallerConfig): void {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const dateLabel = new Date().toLocaleDateString('es-MX');
  const headerSpec = buildPdfHeaderSpec(taller, 'cotizacion', { dateLabel });

  drawStandardWorkshopHeader(doc, headerSpec, dateLabel);

  const clientY = headerSpec.bodyStartY - 1;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Proyecto / Cliente: ${hoja.proyecto || taller.clienteDefault || 'Cliente General'}`, 14, clientY);

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

  let y = clientY + 10;
  drawTableHeader(y);
  y += 6.5;

  let subtotal = 0;
  for (const item of hoja.partidas) {
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
    const desc = `${item.area ? `[${item.area}] ` : ''}${item.etiqueta ? `${item.etiqueta} · ` : ''}${linea.nombre}${apTag} (${color.corto} · ${panelDesc})`;
    const wrappedDesc = doc.splitTextToSize(desc, 68) as string[];
    const neededH = Math.max(24, wrappedDesc.length * 4.5 + 5);

    if (y + neededH > 235) {
      doc.addPage();
      y = 20;
      drawTableHeader(y);
      y += 6.5;
    }

    drawPartidaCroquisPdf(doc, item, 16, y, 24, 14);

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
  if (y > 220) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(148, 163, 184);
  doc.line(120, y, 202, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
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

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Notas y Condiciones:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('• Vigencia de esta cotización: 8 días naturales (sujeta a variación por precio de materiales).', 14, y + 6);
  doc.text('• Garantía de 30 días en mano de obra, sellado hermético y funcionamiento de herrajes.', 14, y + 11);

  doc.save(`cotizacion-${(hoja.proyecto || 'aluminero').toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function generarPdfContratoServicio(
  hoja: HojaState,
  taller: TallerConfig,
  cliente: ContratoClienteInfo,
  folioOverride?: string
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
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

  const headerSpec = buildPdfHeaderSpec(taller, 'contrato', { dateLabel: fechaHoy });
  const h = headerSpec.headerHeightMm;

  // Encabezado ejecutivo del taller
  doc.setFillColor(...headerSpec.theme.bgRgb);
  doc.rect(0, 0, 216, h, 'F');
  doc.setFillColor(...headerSpec.theme.accentRgb);
  doc.rect(0, h - 1.5, 216, 1.5, 'F');
  if (headerSpec.showLogo) {
    drawWorkshopLogoInHeader(doc, headerSpec.logoDataUrl, 14, 6.5, 22);
  }
  const headX = headerSpec.showLogo ? 41 : 14;
  doc.setTextColor(...headerSpec.theme.textRgb);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(headerSpec.documentLabel, headX, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(headerSpec.workshopName || 'Taller de Aluminio y Vidrio', headX, 17);
  let infoY = 22;
  if (headerSpec.eslogan) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...headerSpec.theme.accentRgb);
    const esloganLines = doc.splitTextToSize(headerSpec.eslogan, 108) as string[];
    doc.text(esloganLines[0] || '', headX, infoY);
    infoY += 4.5;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(...headerSpec.theme.mutedRgb);
  const tallerInfoLine =
    headerSpec.contactParts.length > 0
      ? headerSpec.contactParts.join(' · ')
      : `Tel: ${taller.tel || 'Sin especificar'}`;
  const wrappedTallerInfo = doc.splitTextToSize(tallerInfoLine, 108) as string[];
  doc.text(wrappedTallerInfo[0] || '', headX, infoY);
  if (wrappedTallerInfo[1]) {
    doc.text(wrappedTallerInfo[1], headX, infoY + 4.2);
  }

  // Recuadro derecho de Folio y Fecha
  doc.setTextColor(...headerSpec.theme.textRgb);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`FOLIO: ${folio}`, 202, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(...headerSpec.theme.mutedRgb);
  doc.text(`Fecha: ${fechaHoy}`, 202, 18, { align: 'right' });
  doc.text(`Entrega est.: ${fechaEntregaTexto}`, 202, 23.5, { align: 'right' });

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
  const cliNombre = cliente.nombre.trim() || hoja.proyecto || taller.clienteDefault || 'Cliente por confirmar';
  const cliTel = cliente.telefono.trim() || 'No especificado';
  const cliDir = cliente.direccion.trim() || 'Por confirmar en obra';
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

    // Dibuja croquis técnico vectorial con cotas y flechas de apertura
    drawPartidaCroquisPdf(doc, item, 16, y, 24, 14);

    // Texto partida
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

  // Resumen de Pagos (derecha)
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

  // 4 Cláusulas Legales Editables (izquierda)
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

  // Bloques de Firmas
  const fy = Math.max(y + boxH + 22, cy + 12 + clausulasLines.length * 3.6 + 12);
  if (fy + 16 > 272) {
    doc.addPage();
    doc.line(24, 42, 92, 42);
    doc.line(124, 42, 192, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text('El Prestador del Servicio', 58, 47, { align: 'center' });
    doc.text('El Cliente', 158, 47, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(taller.nombre || 'Taller de Aluminio y Vidrio', 58, 51.5, { align: 'center' });
    doc.text(cliNombre, 158, 51.5, { align: 'center' });
  } else {
    doc.setDrawColor(71, 85, 105);
    doc.line(24, fy, 92, fy);
    doc.line(124, fy, 192, fy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.text('El Prestador del Servicio', 58, fy + 5, { align: 'center' });
    doc.text('El Cliente', 158, fy + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(taller.nombre || 'Taller de Aluminio y Vidrio', 58, fy + 9.5, { align: 'center' });
    doc.text(cliNombre, 158, fy + 9.5, { align: 'center' });
  }

  doc.save(`contrato-${folio.toLowerCase()}-${(cliNombre || 'cliente').toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

