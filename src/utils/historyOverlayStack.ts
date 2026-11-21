export interface HistoryOverlayEntry {
  token: number;
  label: string;
  onPop: () => void;
}

let nextToken = 1;
const stack: HistoryOverlayEntry[] = [];

export function pushHistoryOverlay(label: string, onPop: () => void): number {
  const token = nextToken++;
  stack.push({ token, label, onPop });
  return token;
}

export function removeHistoryOverlay(token: number | null | undefined): void {
  if (!token) return;
  const idx = stack.findIndex((entry) => entry.token === token);
  if (idx >= 0) {
    stack.splice(idx, 1);
  }
}

export function consumeTopHistoryOverlay(): boolean {
  const top = stack.pop();
  if (!top) return false;
  try {
    top.onPop();
  } catch {
    // Ignorar error aislado al cerrar capa superior
  }
  return true;
}

export function getHistoryOverlayDepth(): number {
  return stack.length;
}

export function clearHistoryOverlayStack(): void {
  stack.length = 0;
}
