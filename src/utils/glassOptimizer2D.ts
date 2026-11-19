import { esMaterialDireccional, round1, round2 } from './alumineroLogic';
import { HojaVidrioItem } from './storageHelpers';

export { esMaterialDireccional };

export interface PiezaVidrioInput {
  id: string;
  etiqueta: string;
  tipoNombre: string;
  anchoCm: number;
  altoCm: number;
  cantidad: number;
  permitirRotacion?: boolean;
}

export interface Vidrio2DPlacedPiece {
  piezaId: string;
  etiqueta: string;
  tipoNombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
  origAnchoCm: number;
  origAltoCm: number;
  rotada: boolean;
}

export interface Vidrio2DFreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Vidrio2DCutStep {
  paso: number;
  panelNumero: number;
  eje: 'Vertical (X)' | 'Horizontal (Y)';
  posicionCm: number;
  medidaCorteCm: number;
  resultado: string;
  sobranteDesc: string;
}

export interface Vidrio2DPanelPlan {
  panelNumero: number;
  origen: 'inventario' | 'faltante';
  hojaInventarioId?: string;
  tipoNombre: string;
  anchoCm: number;
  altoCm: number;
  areaHojaM2: number;
  areaUsadaM2: number;
  areaMermaM2: number;
  aprovechamientoPct: number;
  mermaPct: number;
  piezas: Vidrio2DPlacedPiece[];
  sobrantesRects: Vidrio2DFreeRect[];
  secuenciaCortes: Vidrio2DCutStep[];
}

export interface OptimizacionVidrio2DResult {
  paneles: Vidrio2DPanelPlan[];
  piezasNoCaben: Array<{
    etiqueta: string;
    tipoNombre: string;
    anchoCm: number;
    altoCm: number;
    motivo: string;
  }>;
  grosorCorteMm: number;
  hojasInventarioUsadas: number;
  hojasFaltantes: number;
  totalHojasNecesarias: number;
  areaPiezasM2: number;
  areaHojasM2: number;
  areaMermaM2: number;
  aprovechamientoPct: number;
  mermaPct: number;
  secuenciaGlobal: Vidrio2DCutStep[];
  resumenFaltanteTexto: string | null;
}

interface ExpandedPiece {
  piezaId: string;
  etiqueta: string;
  tipoNombre: string;
  anchoCm: number;
  altoCm: number;
  area: number;
  permitirRotacion: boolean;
}

function normMaterialKey(tipoNombre: string): string {
  return String(tipoNombre || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

interface OpenPanelState {
  panelNumero: number;
  origen: 'inventario' | 'faltante';
  hojaInventarioId?: string;
  tipoNombre: string;
  anchoCm: number;
  altoCm: number;
  freeRects: Vidrio2DFreeRect[];
  piezas: Vidrio2DPlacedPiece[];
  secuenciaCortes: Vidrio2DCutStep[];
}

interface PlacementCandidate {
  freeRectIndex: number;
  w: number;
  h: number;
  rotada: boolean;
  scoreShortSide: number;
  scoreAreaWaste: number;
}

function canFitOnSize(
  pw: number,
  ph: number,
  sw: number,
  sh: number,
  permitirRotacion: boolean
): boolean {
  if (pw <= sw + 0.001 && ph <= sh + 0.001) return true;
  if (permitirRotacion && ph <= sw + 0.001 && pw <= sh + 0.001) return true;
  return false;
}

function findBestPlacementInPanel(
  panel: OpenPanelState,
  piece: ExpandedPiece,
  permitirRotacion: boolean
): PlacementCandidate | null {
  let best: PlacementCandidate | null = null;

  for (let i = 0; i < panel.freeRects.length; i++) {
    const r = panel.freeRects[i];
    const orientations: Array<{ w: number; h: number; rotada: boolean }> = [
      { w: piece.anchoCm, h: piece.altoCm, rotada: false },
    ];
    if (permitirRotacion && Math.abs(piece.anchoCm - piece.altoCm) > 0.01) {
      orientations.push({ w: piece.altoCm, h: piece.anchoCm, rotada: true });
    }

    for (const o of orientations) {
      if (o.w <= r.w + 0.001 && o.h <= r.h + 0.001) {
        const leftoverH = Math.max(0, r.w - o.w);
        const leftoverV = Math.max(0, r.h - o.h);
        const shortSide = Math.min(leftoverH, leftoverV);
        const areaWaste = r.w * r.h - o.w * o.h;
        if (
          !best ||
          shortSide < best.scoreShortSide - 0.01 ||
          (Math.abs(shortSide - best.scoreShortSide) <= 0.01 && areaWaste < best.scoreAreaWaste)
        ) {
          best = {
            freeRectIndex: i,
            w: o.w,
            h: o.h,
            rotada: o.rotada,
            scoreShortSide: shortSide,
            scoreAreaWaste: areaWaste,
          };
        }
      }
    }
  }

  return best;
}

function applyGuillotinePlacement(
  panel: OpenPanelState,
  candidate: PlacementCandidate,
  piece: ExpandedPiece,
  kerfCm: number
): void {
  const r = panel.freeRects.splice(candidate.freeRectIndex, 1)[0];
  const pw = round1(candidate.w);
  const ph = round1(candidate.h);
  const remW = round1(Math.max(0, r.w - pw - kerfCm));
  const remH = round1(Math.max(0, r.h - ph - kerfCm));
  const hasRight = remW >= 0.5 && r.w > pw + 0.05;
  const hasBottom = remH >= 0.5 && r.h > ph + 0.05;

  panel.piezas.push({
    piezaId: piece.piezaId,
    etiqueta: piece.etiqueta,
    tipoNombre: piece.tipoNombre,
    x: round1(r.x),
    y: round1(r.y),
    w: pw,
    h: ph,
    origAnchoCm: round1(piece.anchoCm),
    origAltoCm: round1(piece.altoCm),
    rotada: candidate.rotada,
  });

  // Decisión guillotina: elegir corte Vertical primero o Horizontal primero según mayor rectángulo libre resultante
  const maxIfVerticalFirst = Math.max(remW * r.h, pw * remH);
  const maxIfHorizontalFirst = Math.max(r.w * remH, remW * ph);
  const cutVerticalFirst = maxIfVerticalFirst >= maxIfHorizontalFirst;

  if (hasRight && hasBottom) {
    if (cutVerticalFirst) {
      // Corte 1: Vertical (X) en toda la altura de r
      const cutX = round1(r.x + pw);
      panel.secuenciaCortes.push({
        paso: panel.secuenciaCortes.length + 1,
        panelNumero: panel.panelNumero,
        eje: 'Vertical (X)',
        posicionCm: cutX,
        medidaCorteCm: round1(r.h),
        resultado: `Franja de ${pw} × ${round1(r.h)} cm`,
        sobranteDesc: `Derecho ${remW} × ${round1(r.h)} cm`,
      });
      // Corte 2: Horizontal (Y) en la franja izquierda para liberar pieza
      const cutY = round1(r.y + ph);
      panel.secuenciaCortes.push({
        paso: panel.secuenciaCortes.length + 1,
        panelNumero: panel.panelNumero,
        eje: 'Horizontal (Y)',
        posicionCm: cutY,
        medidaCorteCm: pw,
        resultado: `Pieza ${piece.etiqueta} (${pw} × ${ph} cm)`,
        sobranteDesc: `Inferior ${pw} × ${remH} cm`,
      });

      panel.freeRects.push({
        x: round1(r.x + pw + kerfCm),
        y: round1(r.y),
        w: remW,
        h: round1(r.h),
      });
      panel.freeRects.push({
        x: round1(r.x),
        y: round1(r.y + ph + kerfCm),
        w: pw,
        h: remH,
      });
    } else {
      // Corte 1: Horizontal (Y) en todo el ancho de r
      const cutY = round1(r.y + ph);
      panel.secuenciaCortes.push({
        paso: panel.secuenciaCortes.length + 1,
        panelNumero: panel.panelNumero,
        eje: 'Horizontal (Y)',
        posicionCm: cutY,
        medidaCorteCm: round1(r.w),
        resultado: `Franja de ${round1(r.w)} × ${ph} cm`,
        sobranteDesc: `Inferior ${round1(r.w)} × ${remH} cm`,
      });
      // Corte 2: Vertical (X) en la franja superior para liberar pieza
      const cutX = round1(r.x + pw);
      panel.secuenciaCortes.push({
        paso: panel.secuenciaCortes.length + 1,
        panelNumero: panel.panelNumero,
        eje: 'Vertical (X)',
        posicionCm: cutX,
        medidaCorteCm: ph,
        resultado: `Pieza ${piece.etiqueta} (${pw} × ${ph} cm)`,
        sobranteDesc: `Derecho ${remW} × ${ph} cm`,
      });

      panel.freeRects.push({
        x: round1(r.x),
        y: round1(r.y + ph + kerfCm),
        w: round1(r.w),
        h: remH,
      });
      panel.freeRects.push({
        x: round1(r.x + pw + kerfCm),
        y: round1(r.y),
        w: remW,
        h: ph,
      });
    }
  } else if (hasRight) {
    const cutX = round1(r.x + pw);
    panel.secuenciaCortes.push({
      paso: panel.secuenciaCortes.length + 1,
      panelNumero: panel.panelNumero,
      eje: 'Vertical (X)',
      posicionCm: cutX,
      medidaCorteCm: round1(r.h),
      resultado: `Pieza ${piece.etiqueta} (${pw} × ${ph} cm)`,
      sobranteDesc: `Derecho ${remW} × ${round1(r.h)} cm`,
    });
    panel.freeRects.push({
      x: round1(r.x + pw + kerfCm),
      y: round1(r.y),
      w: remW,
      h: round1(r.h),
    });
  } else if (hasBottom) {
    const cutY = round1(r.y + ph);
    panel.secuenciaCortes.push({
      paso: panel.secuenciaCortes.length + 1,
      panelNumero: panel.panelNumero,
      eje: 'Horizontal (Y)',
      posicionCm: cutY,
      medidaCorteCm: round1(r.w),
      resultado: `Pieza ${piece.etiqueta} (${pw} × ${ph} cm)`,
      sobranteDesc: `Inferior ${round1(r.w)} × ${remH} cm`,
    });
    panel.freeRects.push({
      x: round1(r.x),
      y: round1(r.y + ph + kerfCm),
      w: round1(r.w),
      h: remH,
    });
  } else {
    panel.secuenciaCortes.push({
      paso: panel.secuenciaCortes.length + 1,
      panelNumero: panel.panelNumero,
      eje: 'Vertical (X)',
      posicionCm: round1(r.x + pw),
      medidaCorteCm: ph,
      resultado: `Aprovechamiento exacto ${piece.etiqueta} (${pw} × ${ph} cm)`,
      sobranteDesc: 'Sin sobrante en sección',
    });
  }
}

export function optimizarVidrio2D(input: {
  piezas: PiezaVidrioInput[];
  hojasInventario: HojaVidrioItem[];
  grosorCorteMm?: number;
  permitirRotacion?: boolean;
  hojaRespaldo?: { tipoNombre: string; anchoCm: number; altoCm: number };
  filtrarTipo?: string;
}): OptimizacionVidrio2DResult {
  const grosorCorteMm = Math.max(0, Math.min(20, Number(input.grosorCorteMm ?? 3)));
  const kerfCm = round2(grosorCorteMm / 10);
  const permitirRotacion = input.permitirRotacion !== false;
  const filtro = normMaterialKey(input.filtrarTipo || '');

  // 1. Expandir piezas solicitadas
  const expanded: ExpandedPiece[] = [];
  for (const p of input.piezas) {
    const w = round1(Number(p.anchoCm) || 0);
    const h = round1(Number(p.altoCm) || 0);
    const qty = Math.max(1, Math.round(Number(p.cantidad) || 1));
    if (w <= 0 || h <= 0) continue;
    const matNombre = (p.tipoNombre || 'Claro 6 mm').trim();
    if (filtro && filtro !== 'todos' && normMaterialKey(matNombre) !== filtro) {
      continue;
    }
    const rotAllowed =
      permitirRotacion && (p.permitirRotacion ?? !esMaterialDireccional(matNombre));
    for (let i = 0; i < qty; i++) {
      expanded.push({
        piezaId: p.id,
        etiqueta: qty > 1 ? `${p.etiqueta} #${i + 1}` : p.etiqueta,
        tipoNombre: matNombre,
        anchoCm: w,
        altoCm: h,
        area: w * h,
        permitirRotacion: rotAllowed,
      });
    }
  }

  // Ordenar por lado mayor descendente, luego área descendente (mejor heurística guillotina)
  expanded.sort((a, b) => {
    const maxA = Math.max(a.anchoCm, a.altoCm);
    const maxB = Math.max(b.anchoCm, b.altoCm);
    if (Math.abs(maxB - maxA) > 0.1) return maxB - maxA;
    return b.area - a.area;
  });

  // 2. Pool de hojas físicas disponibles en inventario
  const invPool: Array<{
    hojaInventarioId: string;
    tipoNombre: string;
    anchoCm: number;
    altoCm: number;
    area: number;
  }> = [];

  for (const h of input.hojasInventario) {
    const w = round1(Number(h.anchoCm) || 0);
    const ht = round1(Number(h.altoCm) || 0);
    const qty = Math.max(0, Math.round(Number(h.cantidad) || 0));
    if (w <= 0 || ht <= 0 || qty <= 0) continue;
    if (filtro && filtro !== 'todos' && normMaterialKey(h.tipoNombre) !== filtro) {
      continue;
    }
    for (let q = 0; q < qty; q++) {
      invPool.push({
        hojaInventarioId: h.id,
        tipoNombre: h.tipoNombre,
        anchoCm: w,
        altoCm: ht,
        area: w * ht,
      });
    }
  }

  // Priorizar hojas de inventario de menor a mayor área para aprovechar retazos/hojas chicas antes de abrir hojas grandes
  invPool.sort((a, b) => a.area - b.area);

  const fallbackSheet = input.hojaRespaldo || {
    tipoNombre:
      (filtro && filtro !== 'todos' ? input.filtrarTipo : expanded[0]?.tipoNombre) ||
      invPool[0]?.tipoNombre ||
      'Claro 6 mm',
    anchoCm: invPool[invPool.length - 1]?.anchoCm || 260,
    altoCm: invPool[invPool.length - 1]?.altoCm || 180,
  };

  const openPanels: OpenPanelState[] = [];
  const piezasNoCaben: OptimizacionVidrio2DResult['piezasNoCaben'] = [];

  for (const piece of expanded) {
    const canRotPiece = piece.permitirRotacion;
    // 1. Buscar en paneles ya abiertos del MISMO material y espesor exacto
    let bestPanel: OpenPanelState | null = null;
    let bestCand: PlacementCandidate | null = null;

    for (const panel of openPanels) {
      if (normMaterialKey(panel.tipoNombre) !== normMaterialKey(piece.tipoNombre)) {
        continue;
      }
      const cand = findBestPlacementInPanel(panel, piece, canRotPiece);
      if (!cand) continue;
      if (
        !bestCand ||
        cand.scoreShortSide < bestCand.scoreShortSide - 0.01 ||
        (Math.abs(cand.scoreShortSide - bestCand.scoreShortSide) <= 0.01 &&
          cand.scoreAreaWaste < bestCand.scoreAreaWaste)
      ) {
        bestCand = cand;
        bestPanel = panel;
      }
    }

    if (bestPanel && bestCand) {
      applyGuillotinePlacement(bestPanel, bestCand, piece, kerfCm);
      continue;
    }

    // 2. Abrir una nueva hoja del inventario del MISMO material y espesor exacto
    const invIdx = invPool.findIndex(
      (s) =>
        normMaterialKey(s.tipoNombre) === normMaterialKey(piece.tipoNombre) &&
        canFitOnSize(piece.anchoCm, piece.altoCm, s.anchoCm, s.altoCm, canRotPiece)
    );

    if (invIdx >= 0) {
      const sheet = invPool.splice(invIdx, 1)[0];
      const newPanel: OpenPanelState = {
        panelNumero: openPanels.length + 1,
        origen: 'inventario',
        hojaInventarioId: sheet.hojaInventarioId,
        tipoNombre: sheet.tipoNombre,
        anchoCm: sheet.anchoCm,
        altoCm: sheet.altoCm,
        freeRects: [{ x: 0, y: 0, w: sheet.anchoCm, h: sheet.altoCm }],
        piezas: [],
        secuenciaCortes: [],
      };
      const cand = findBestPlacementInPanel(newPanel, piece, canRotPiece);
      if (cand) {
        applyGuillotinePlacement(newPanel, cand, piece, kerfCm);
        openPanels.push(newPanel);
        continue;
      }
    }

    // 3. No alcanza el inventario: abrir una hoja virtual faltante con el mismo material/espesor de la pieza
    if (
      canFitOnSize(
        piece.anchoCm,
        piece.altoCm,
        fallbackSheet.anchoCm,
        fallbackSheet.altoCm,
        canRotPiece
      )
    ) {
      const newPanel: OpenPanelState = {
        panelNumero: openPanels.length + 1,
        origen: 'faltante',
        tipoNombre: piece.tipoNombre || fallbackSheet.tipoNombre,
        anchoCm: round1(fallbackSheet.anchoCm),
        altoCm: round1(fallbackSheet.altoCm),
        freeRects: [
          {
            x: 0,
            y: 0,
            w: round1(fallbackSheet.anchoCm),
            h: round1(fallbackSheet.altoCm),
          },
        ],
        piezas: [],
        secuenciaCortes: [],
      };
      const cand = findBestPlacementInPanel(newPanel, piece, canRotPiece);
      if (cand) {
        applyGuillotinePlacement(newPanel, cand, piece, kerfCm);
        openPanels.push(newPanel);
        continue;
      }
    }

    piezasNoCaben.push({
      etiqueta: piece.etiqueta,
      tipoNombre: piece.tipoNombre,
      anchoCm: piece.anchoCm,
      altoCm: piece.altoCm,
      motivo: `Excede las dimensiones de la hoja estándar (${fallbackSheet.anchoCm} × ${fallbackSheet.altoCm} cm).`,
    });
  }

  const paneles: Vidrio2DPanelPlan[] = openPanels.map((p) => {
    const areaHojaM2 = round2((p.anchoCm * p.altoCm) / 10000);
    const areaUsadaM2 = round2(
      p.piezas.reduce((acc, pz) => acc + (pz.w * pz.h) / 10000, 0)
    );
    const areaMermaM2 = round2(Math.max(0, areaHojaM2 - areaUsadaM2));
    const aprovechamientoPct =
      areaHojaM2 > 0 ? round1(Math.min(100, (areaUsadaM2 / areaHojaM2) * 100)) : 0;
    const mermaPct = round1(Math.max(0, 100 - aprovechamientoPct));

    return {
      panelNumero: p.panelNumero,
      origen: p.origen,
      hojaInventarioId: p.hojaInventarioId,
      tipoNombre: p.tipoNombre,
      anchoCm: p.anchoCm,
      altoCm: p.altoCm,
      areaHojaM2,
      areaUsadaM2,
      areaMermaM2,
      aprovechamientoPct,
      mermaPct,
      piezas: p.piezas,
      sobrantesRects: p.freeRects.filter((r) => r.w >= 1 && r.h >= 1),
      secuenciaCortes: p.secuenciaCortes,
    };
  });

  const hojasInventarioUsadas = paneles.filter((p) => p.origen === 'inventario').length;
  const hojasFaltantes = paneles.filter((p) => p.origen === 'faltante').length;
  const totalHojasNecesarias = paneles.length;
  const areaPiezasM2 = round2(paneles.reduce((a, p) => a + p.areaUsadaM2, 0));
  const areaHojasM2 = round2(paneles.reduce((a, p) => a + p.areaHojaM2, 0));
  const areaMermaM2 = round2(Math.max(0, areaHojasM2 - areaPiezasM2));
  const aprovechamientoPct =
    areaHojasM2 > 0 ? round1(Math.min(100, (areaPiezasM2 / areaHojasM2) * 100)) : 0;
  const mermaPct = areaHojasM2 > 0 ? round1(Math.max(0, 100 - aprovechamientoPct)) : 0;

  let pasoGlobal = 0;
  const secuenciaGlobal: Vidrio2DCutStep[] = [];
  for (const panel of paneles) {
    for (const c of panel.secuenciaCortes) {
      pasoGlobal += 1;
      secuenciaGlobal.push({
        ...c,
        paso: pasoGlobal,
      });
    }
  }

  const faltantesPorTipo = new Map<string, number>();
  for (const p of paneles) {
    if (p.origen === 'faltante') {
      const label = `${p.tipoNombre} (${p.anchoCm} × ${p.altoCm} cm)`;
      faltantesPorTipo.set(label, (faltantesPorTipo.get(label) || 0) + 1);
    }
  }
  const faltantesDetalle = Array.from(faltantesPorTipo.entries())
    .map(([label, qty]) => `${qty} hoja${qty === 1 ? '' : 's'} de ${label}`)
    .join(', ');

  const resumenFaltanteTexto =
    hojasFaltantes > 0
      ? `Inventario insuficiente: te ${hojasFaltantes === 1 ? 'falta' : 'faltan'} ${faltantesDetalle}.`
      : null;

  return {
    paneles,
    piezasNoCaben,
    grosorCorteMm,
    hojasInventarioUsadas,
    hojasFaltantes,
    totalHojasNecesarias,
    areaPiezasM2,
    areaHojasM2,
    areaMermaM2,
    aprovechamientoPct,
    mermaPct,
    secuenciaGlobal,
    resumenFaltanteTexto,
  };
}
