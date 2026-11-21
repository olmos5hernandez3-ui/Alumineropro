export interface SwUpdateState {
  available: boolean;
  reason?: 'sw' | 'version';
  remoteVersion?: string | null;
}

declare global {
  interface Window {
    __alumineroUpdateState?: SwUpdateState;
    __alumineroUpdateBannerMounted?: boolean;
    __alumineroApplyUpdate?: () => void;
    __alumineroCheckForUpdate?: () => Promise<boolean>;
  }
}

export const SW_UPDATE_EVENT = 'aluminero:sw-update-available';

export function extractAppVersionFromHtml(html: string): string | null {
  if (!html || typeof html !== 'string') return null;
  const metaMatches = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaMatches) {
    const nameMatch = tag.match(/\bname\s*=\s*["']([^"']+)["']/i);
    if (!nameMatch || nameMatch[1].trim().toLowerCase() !== 'app-version') {
      continue;
    }
    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    if (contentMatch && contentMatch[1].trim()) {
      return contentMatch[1].trim();
    }
  }
  return null;
}

export function isRemoteVersionNewer(
  currentVersion: string | null | undefined,
  remoteVersion: string | null | undefined
): boolean {
  const cur = typeof currentVersion === 'string' ? currentVersion.trim() : '';
  const rem = typeof remoteVersion === 'string' ? remoteVersion.trim() : '';
  if (!cur || !rem) return false;
  return cur !== rem;
}

export function shouldRunUpdateCheck(
  lastCheckedAt: number,
  now: number,
  minIntervalMs = 4000
): boolean {
  if (!Number.isFinite(now) || now <= 0) return false;
  if (!Number.isFinite(lastCheckedAt) || lastCheckedAt <= 0) return true;
  return now - lastCheckedAt >= Math.max(0, minIntervalMs);
}

export function selectWaitingWorker<T extends { state?: string }>(
  reg: { waiting?: T | null; installing?: T | null } | null | undefined
): T | null {
  if (!reg) return null;
  if (reg.waiting) return reg.waiting;
  if (reg.installing && reg.installing.state === 'installed') {
    return reg.installing;
  }
  return null;
}

export function readCurrentUpdateState(): SwUpdateState {
  if (typeof window === 'undefined') {
    return { available: false };
  }
  return window.__alumineroUpdateState?.available
    ? { ...window.__alumineroUpdateState }
    : { available: false };
}

export function triggerAppUpdateNow(): void {
  if (typeof window === 'undefined') return;
  if (typeof window.__alumineroApplyUpdate === 'function') {
    window.__alumineroApplyUpdate();
    return;
  }
  window.location.reload();
}
