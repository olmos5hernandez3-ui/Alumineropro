import { jsPDF } from 'jspdf';
import {
  COLORES_CONFIG,
  CotizacionCalculada,
  DespieceCalculado,
  getRellenoLabel,
  LINEAS_CONFIG,
  round2,
  TrabajoParams,
} from './alumineroLogic';
import { ContratoClienteInfo, formatMXN, HojaState, TallerConfig } from './storageHelpers';

const APERTURA_LABELS: Record<string, string> = {
  corrediza: 'Corrediza',
  fija: 'Fija (Fijo 3")',
  guillotina: 'Guillotina',
  abatible: 'Abatible vertical',
  banderola: 'Banderola',
  oscilobatiente: 'Oscilobatiente',
  plegable: 'Plegable (libro)',
};

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

  doc.setFillColor(11, 37, 69);
  doc.rect(0, 0, 216, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ALUMINERO PRO — ORDEN TÉCNICA DE CORTE', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `${taller.nombre || 'Taller de Aluminio'} · Fecha: ${new Date().toLocaleDateString('es-MX')}`,
    14,
    19
  );

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(
    `${linea.nombre}${aperturaLabel} (${params.anchoCm} × ${params.altoCm} cm) · ${params.cantidad} pza(s)`,
    14,
    36
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `Acabado: ${color.nombre} · ${linea.esMosquitero ? 'Tela Mosquitera' : `Panel: ${panelDesc}`} · Área: ${cot.areaRealM2.toFixed(2)} m²`,
    14,
    43
  );

  let y = 53;
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

export function generarPdfClienteLimpio(hoja: HojaState, taller: TallerConfig): void {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });

  doc.setFillColor(11, 37, 69);
  doc.rect(0, 0, 216, 30, 'F');
  if (taller.logoDataUrl) {
    try {
      doc.addImage(taller.logoDataUrl, 'JPEG', 14, 5, 20, 20);
    } catch {
      // ignore invalid image
    }
  }
  const textX = taller.logoDataUrl ? 38 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(taller.nombre || 'COTIZACIÓN DE ALUMINIO Y VIDRIO', textX, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `Tel: ${taller.tel || 'Sin especificar'} · Fecha: ${new Date().toLocaleDateString('es-MX')}`,
    textX,
    20
  );

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Proyecto / Cliente: ${hoja.proyecto || taller.clienteDefault || 'Cliente General'}`, 14, 40);

  let y = 50;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, 188, 7, 'F');
  doc.setFontSize(9.5);
  doc.text('Concepto / Especificación', 16, y);
  doc.text('Medidas', 120, y);
  doc.text('Cant.', 152, y);
  doc.text('Importe', 176, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let subtotal = 0;
  for (const item of hoja.partidas) {
    subtotal += item.totalLinea;
    const linea = LINEAS_CONFIG[item.linea];
    const color = COLORES_CONFIG[item.color];
    const panelDesc = linea.esMosquitero ? 'Malla' : getRellenoLabel(item.relleno, item.vidrio);
    const apTag =
      linea.categoria === 'ventanas' && !linea.esMosquitero && !linea.esCancelBano
        ? ` · ${APERTURA_LABELS[item.apertura] || item.apertura}`
        : '';
    const desc = `${item.area ? `[${item.area}] ` : ''}${item.etiqueta ? `${item.etiqueta} · ` : ''}${linea.nombre}${apTag} (${color.corto} · ${panelDesc})`;
    const wrappedDesc = doc.splitTextToSize(desc, 100) as string[];
    const neededH = Math.max(6.5, wrappedDesc.length * 4.5 + 2);

    if (y + neededH > 235) {
      doc.addPage();
      y = 20;
    }

    doc.text(wrappedDesc, 16, y);
    doc.text(`${item.anchoCm}×${item.altoCm} cm`, 120, y);
    doc.text(String(item.cantidad), 155, y);
    doc.text(formatMXN(item.totalLinea), 174, y);
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
  doc.line(120, y, 202, y);
  y += 6;
  doc.text(`Subtotal: ${formatMXN(subtotal)}`, 142, y);
  if (descuento > 0) {
    y += 6;
    doc.text(`Descuento (${hoja.descuentoPct}%): -${formatMXN(descuento)}`, 132, y);
  }
  if (iva > 0) {
    y += 6;
    doc.text(`IVA (16%): ${formatMXN(iva)}`, 144, y);
  }
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`TOTAL: ${formatMXN(total)}`, 138, y);

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

  // Encabezado ejecutivo del taller
  doc.setFillColor(11, 37, 69);
  doc.rect(0, 0, 216, 35, 'F');
  if (taller.logoDataUrl) {
    try {
      doc.addImage(taller.logoDataUrl, 'JPEG', 14, 6, 22, 22);
    } catch {
      // ignora logo inválido
    }
  }
  const headX = taller.logoDataUrl ? 40 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CONTRATO DE PRESTACIÓN DE SERVICIOS', headX, 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(taller.nombre || 'Taller de Aluminio y Vidrio', headX, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const tallerInfoLine = [
    `Tel: ${taller.tel || 'Sin especificar'}`,
    taller.ubicacion ? `Ubicación: ${taller.ubicacion}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const wrappedTallerInfo = doc.splitTextToSize(tallerInfoLine, 112) as string[];
  doc.text(wrappedTallerInfo[0] || '', headX, 23.5);
  if (wrappedTallerInfo[1]) {
    doc.text(wrappedTallerInfo[1], headX, 28);
  }

  // Recuadro derecho de Folio y Fecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`FOLIO: ${folio}`, 202, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.text(`Fecha: ${fechaHoy}`, 202, 18, { align: 'right' });
  doc.text(`Entrega est.: ${fechaEntregaTexto}`, 202, 23.5, { align: 'right' });

  // Recuadro de Datos del Cliente y Obra
  doc.setDrawColor(148, 163, 184);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 40, 188, 25, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATOS DEL CLIENTE Y LUGAR DE OBRA', 18, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  const cliNombre = cliente.nombre.trim() || hoja.proyecto || taller.clienteDefault || 'Cliente por confirmar';
  const cliTel = cliente.telefono.trim() || 'No especificado';
  const cliDir = cliente.direccion.trim() || 'Por confirmar en obra';
  const cliProy = hoja.proyecto.trim() || 'Suministro e instalación de cancelería';

  doc.text(`Cliente: ${cliNombre}`, 18, 52);
  doc.text(`Teléfono: ${cliTel}`, 126, 52);
  doc.text(`Proyecto: ${cliProy}`, 18, 57.2);
  const dirLines = doc.splitTextToSize(`Dirección de obra: ${cliDir}`, 178) as string[];
  doc.text(dirLines[0] || '', 18, 62.2);

  // Tabla de trabajos contratados con croquis técnico acotado
  let y = 72;
  doc.setFillColor(15, 30, 52);
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
    const boxMaxW = 24;
    const boxMaxH = 14;
    const ratio = Math.max(0.5, Math.min(1.8, (item.anchoCm || 120) / Math.max(20, item.altoCm || 100)));
    let bw = boxMaxW;
    let bh = bw / ratio;
    if (bh > boxMaxH) {
      bh = boxMaxH;
      bw = bh * ratio;
    }
    const bx = 16 + (boxMaxW - bw) / 2;
    const by = y + (boxMaxH - bh) / 2;

    doc.setDrawColor(30, 58, 138);
    doc.setFillColor(224, 242, 254);
    doc.rect(bx, by, bw, bh, 'FD');

    if (item.categoria === 'puertas') {
      doc.line(bx, by, bx + bw, by + bh / 2);
      doc.line(bx + bw, by + bh / 2, bx, by + bh);
    } else if (item.apertura === 'abatible' || item.apertura === 'oscilobatiente') {
      doc.line(bx, by, bx + bw, by + bh / 2);
      doc.line(bx + bw, by + bh / 2, bx, by + bh);
    } else if (item.apertura === 'banderola') {
      doc.line(bx, by, bx + bw / 2, by + bh);
      doc.line(bx + bw / 2, by + bh, bx + bw, by);
    } else if (item.apertura === 'guillotina') {
      doc.line(bx, by + bh / 2, bx + bw, by + bh / 2);
      doc.line(bx + bw / 2, by + bh * 0.85, bx + bw / 2, by + bh * 0.56);
      doc.line(bx + bw / 2 - 1.5, by + bh * 0.64, bx + bw / 2, by + bh * 0.56);
      doc.line(bx + bw / 2 + 1.5, by + bh * 0.64, bx + bw / 2, by + bh * 0.56);
    } else if (item.apertura === 'fija') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text('FIJO', bx + bw / 2, by + bh / 2 + 1, { align: 'center' });
    } else {
      // Corrediza / cancel: divisor y flecha horizontal
      doc.line(bx + bw / 2, by, bx + bw / 2, by + bh);
      const ax1 = bx + bw * 0.6;
      const ax2 = bx + bw * 0.88;
      const ay = by + bh / 2;
      doc.line(ax1, ay, ax2, ay);
      doc.line(ax1 + 1.5, ay - 1.3, ax1, ay);
      doc.line(ax1 + 1.5, ay + 1.3, ax1, ay);
    }

    // Cotas de ancho (abajo) y alto (derecha)
    doc.setDrawColor(100, 116, 139);
    doc.line(bx, by + bh + 1.8, bx + bw, by + bh + 1.8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.anchoCm} cm`, bx + bw / 2, by + bh + 4.8, { align: 'center' });
    doc.text(`${item.altoCm}`, bx + bw + 2.2, by + bh / 2 + 1);

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

