import { LevantamientoPieza, LevantamientoUnidad } from './levantamientoLogic';

export type BlueprintLeafKind = 'O' | 'X' | 'A';

export interface BlueprintLeafSpec {
  code: BlueprintLeafKind;
  label: string;
  arrowDir?: 'left' | 'right';
}

/**
 * Parsea la distribución de hojas (ej. "O-X", "X-O", "O-X-O", "X-X", "O")
 * y el tipo de pieza para construir un plano técnico limpio con flechas de corrediza.
 */
export function parseHojasBlueprint(
  hojasRaw?: string,
  tipo?: string
): BlueprintLeafSpec[] {
  const t = (tipo || '').toLowerCase();
  const cleaned = String(hojasRaw || '')
    .toUpperCase()
    .replace(/[^XO]/g, '');

  if (cleaned.length > 0) {
    const chars = cleaned.slice(0, 6).split('') as ('X' | 'O')[];
    return chars.map((ch, idx) => {
      if (ch === 'O') {
        return { code: 'O', label: 'Fija' };
      }
      // Determinar dirección intuitiva de la flecha de corrediza:
      // Si hay una hoja fija O a la izquierda (ej. O-X), desliza hacia la izquierda (←).
      // Si hay una hoja fija O a la derecha (ej. X-O), desliza hacia la derecha (→).
      const leftChar = idx > 0 ? chars[idx - 1] : null;
      const rightChar = idx < chars.length - 1 ? chars[idx + 1] : null;
      let arrowDir: 'left' | 'right' = idx >= Math.floor(chars.length / 2) ? 'left' : 'right';
      if (leftChar === 'O' && rightChar !== 'O') {
        arrowDir = 'left';
      } else if (rightChar === 'O' && leftChar !== 'O') {
        arrowDir = 'right';
      }
      return { code: 'X', label: 'Corrediza', arrowDir };
    });
  }

  if (t.includes('fija')) {
    return [{ code: 'O', label: 'Fija' }];
  }
  if (t.includes('abatible') || t.includes('proyecc') || t.includes('puerta') || t.includes('mosquitero')) {
    return [{ code: 'A', label: t.includes('puerta') ? 'Puerta' : 'Abatible', arrowDir: 'right' }];
  }
  // Por defecto para ventanas corredizas o canceles: O-X (fija + corrediza)
  return [
    { code: 'O', label: 'Fija' },
    { code: 'X', label: 'Corrediza', arrowDir: 'left' },
  ];
}

/**
 * Formatea una cota arquitectónica limpia para mostrar en el dibujo digitalizado
 * (ej. "132 cm", "147.9 cm", "1,500 mm", "1.32 m").
 */
export function formatCotaMedida(cm: number, unit: LevantamientoUnidad | 'mm' = 'cm'): string {
  const safe = Number.isFinite(cm) && cm > 0 ? cm : 0;
  if (unit === 'mm') {
    const mm = Math.round(safe * 10);
    return `${mm.toLocaleString('en-US')} mm`;
  }
  if (unit === 'm') {
    const m = Math.round((safe / 100) * 1000) / 1000;
    return `${Number(m.toFixed(3))} m`;
  }
  const rounded = Math.round(safe * 10) / 10;
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)} cm`;
}

/**
 * Sincroniza la lista de IDs seleccionados para corte al agregar o eliminar piezas.
 * - Conserva únicamente IDs que aún existen en `piezas`.
 * - Marca automáticamente cualquier ID nuevo especificado en `autoSelectNewIds`.
 */
export function syncSelectedPiezaIds(
  prevSelected: string[],
  piezas: Pick<LevantamientoPieza, 'id'>[],
  autoSelectNewIds: string[] = []
): string[] {
  const validSet = new Set(piezas.map((p) => p.id));
  const nextSet = new Set<string>();
  for (const id of prevSelected) {
    if (validSet.has(id)) nextSet.add(id);
  }
  for (const id of autoSelectNewIds) {
    if (validSet.has(id)) nextSet.add(id);
  }
  return piezas.map((p) => p.id).filter((id) => nextSet.has(id));
}

/** Alterna la selección de una pieza específica (selección múltiple). */
export function togglePiezaSelection(selectedIds: string[], id: string): string[] {
  if (selectedIds.includes(id)) {
    return selectedIds.filter((item) => item !== id);
  }
  return [...selectedIds, id];
}

/**
 * Si no están todas seleccionadas, selecciona todas.
 * Si ya están todas seleccionadas, desmarca todas (Ninguna).
 */
export function toggleSelectAllPiezas(
  selectedIds: string[],
  piezas: Pick<LevantamientoPieza, 'id'>[]
): string[] {
  if (piezas.length === 0) return [];
  const selectedSet = new Set(selectedIds);
  const allSelected = piezas.every((p) => selectedSet.has(p.id));
  if (allSelected) return [];
  return piezas.map((p) => p.id);
}

/** Filtra estrictamente las piezas marcadas con círculo ✓ para calcular los tramos de 6.10 m. */
export function filterSelectedPiezasForCut(
  piezas: LevantamientoPieza[],
  selectedIds: string[]
): LevantamientoPieza[] {
  if (piezas.length === 0 || selectedIds.length === 0) return [];
  const selectedSet = new Set(selectedIds);
  return piezas.filter((p) => selectedSet.has(p.id));
}
