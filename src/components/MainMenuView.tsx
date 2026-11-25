import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, RotateCcw, Lock, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import {
  AdminMessageItem,
  CATALOGO_PERFILES,
  DEFAULT_HOME_MENU_LAYOUT,
  HomeMenuCardId,
  HomeMenuLayout,
  HomeMenuSectionId,
  HomeMenuTier,
  isDefaultHomeMenuLayout,
  moveHomeMenuCard,
  normalizeHomeMenuLayout,
} from '../utils/alumineroLogic';
import { formatMXN, SavedColleagueReferral } from '../utils/storageHelpers';
import { ScreenId } from './TopBarAndDrawer';
import {
  MetallicSetSquareIcon,
  MetallicQuoteDocIcon,
  MetallicWindowIcon,
  MetallicDoorIcon,
  MetallicProfilesIcon,
  MetallicInventoryBoxIcon,
} from './MetallicIcons';

interface Props {
  proActive: boolean;
  hojaPiezasCount: number;
  hojaTotal: number;
  inventarioTramosTotal: number;
  hojasVidrioCount: number;
  notasCount: number;
  cotizacionesCount?: number;
  savedReferral?: SavedColleagueReferral | null;
  referredById?: string | null;
  referredByName?: string | null;
  promoColegaUsed?: boolean;
  pendingRemindersCount?: number;
  dueRemindersCount?: number;
  pushPermission?: NotificationPermission | 'unsupported';
  unreadAdminMessages?: AdminMessageItem[];
  menuTier?: HomeMenuTier;
  menuLayout?: HomeMenuLayout;
  reorderMode?: boolean;
  onChangeMenuLayout?: (next: HomeMenuLayout) => void;
  onSaveAndLockLayout?: (layout: HomeMenuLayout) => void;
  onResetMenuLayout?: () => void;
  onForceExitReorderMode?: () => void;
  onMarkAdminMessageRead?: (id: string) => void;
  onClaimColleaguePromo?: () => void;
  onOpenColleagueInvite?: () => void;
  onOpenPro?: () => void;
  onEntrarTrabajo: (cat: 'ventanas' | 'puertas') => void;
  onEntrarHoja: () => void;
  onEntrarInventario: () => void;
  onGoToView: (view: ScreenId) => void;
  onOpenAntesDespues: () => void;
  onOpenLevantamiento?: () => void;
  onOpenReminders?: () => void;
}

const FULL_WIDTH_CARD_IDS = new Set<HomeMenuCardId>(['levantamiento', 'hoja', 'videos']);

function computeSectionSpanMap(cards: HomeMenuCardId[]): Record<string, boolean> {
  const spans: Record<string, boolean> = {};
  let colCursor = 0;
  let lastCompactId: HomeMenuCardId | null = null;

  for (const cardId of cards) {
    if (FULL_WIDTH_CARD_IDS.has(cardId)) {
      if (colCursor === 1 && lastCompactId) {
        spans[lastCompactId] = true;
      }
      spans[cardId] = true;
      colCursor = 0;
      lastCompactId = null;
    } else {
      spans[cardId] = false;
      if (colCursor === 0) {
        colCursor = 1;
        lastCompactId = cardId;
      } else {
        colCursor = 0;
        lastCompactId = null;
      }
    }
  }

  if (colCursor === 1 && lastCompactId) {
    spans[lastCompactId] = true;
  }

  return spans;
}

const CARD_DISPLAY_LABELS: Record<HomeMenuCardId, string> = {
  levantamiento: 'Levantamiento Rápido',
  hoja: 'Hoja de Cotización',
  ventanas: 'Ventanas',
  puertas: 'Puertas',
  catalogo: 'Catálogo Perfiles',
  inventario: 'Mi Inventario',
  notas: 'Notas de Obra',
  modulacion: 'Modulación y Cortes',
  taller: 'Mi Taller y Precios',
  galeria: 'Galería (Antes y Después)',
  vidrio: 'Optimizador de Vidrio (2D)',
  cotizaciones: 'Historial de Cotizaciones',
  videos: 'Video Tutoriales',
};

const SteelCornerAccent: React.FC<{ gold?: boolean }> = ({ gold = false }) => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute top-0 right-5 w-16 h-[5px] rounded-b-md opacity-90"
    style={{
      background: gold
        ? 'linear-gradient(90deg, rgba(164,132,76,0.2) 0%, #E7CE98 48%, rgba(164,132,76,0.25) 100%)'
        : 'linear-gradient(90deg, rgba(96,124,146,0.18) 0%, #C8DCEB 50%, rgba(96,124,146,0.22) 100%)',
      boxShadow: gold
        ? '0 1px 6px rgba(212, 175, 55, 0.4)'
        : '0 1px 6px rgba(148, 197, 232, 0.35)',
    }}
  />
);

interface ActiveDragState {
  cardId: HomeMenuCardId;
  pointerId: number;
  x: number;
  y: number;
}

interface DropTargetState {
  section: HomeMenuSectionId;
  index: number;
  overCardId: HomeMenuCardId | null;
}

export const MainMenuView: React.FC<Props> = ({
  proActive,
  hojaPiezasCount,
  hojaTotal,
  inventarioTramosTotal,
  hojasVidrioCount,
  notasCount,
  cotizacionesCount = 0,
  savedReferral = null,
  referredById = null,
  referredByName = null,
  promoColegaUsed = false,
  pendingRemindersCount = 0,
  dueRemindersCount = 0,
  pushPermission = 'default',
  unreadAdminMessages = [],
  menuTier,
  menuLayout,
  reorderMode = false,
  onChangeMenuLayout,
  onSaveAndLockLayout,
  onResetMenuLayout,
  onForceExitReorderMode,
  onMarkAdminMessageRead,
  onClaimColleaguePromo,
  onOpenColleagueInvite,
  onOpenPro,
  onEntrarTrabajo,
  onEntrarHoja,
  onEntrarInventario,
  onGoToView,
  onOpenAntesDespues,
  onOpenLevantamiento,
  onOpenReminders,
}) => {
  const effectiveTier: HomeMenuTier = menuTier ?? (proActive ? 'pro_paged' : 'free');
  const isPaged = effectiveTier === 'pro_paged' || effectiveTier === 'pro_annual';
  const canReorder = Boolean(effectiveTier === 'pro_annual' && onChangeMenuLayout);
  const isEditModeActive = Boolean(canReorder && reorderMode);

  const effectiveLayout = useMemo<HomeMenuLayout>(
    () => (effectiveTier === 'pro_annual' ? normalizeHomeMenuLayout(menuLayout) : DEFAULT_HOME_MENU_LAYOUT),
    [effectiveTier, menuLayout]
  );
  const isCustomLayout = useMemo(
    () => effectiveTier === 'pro_annual' && !isDefaultHomeMenuLayout(effectiveLayout),
    [effectiveTier, effectiveLayout]
  );

  const [activePage, setActivePage] = useState<0 | 1>(0);
  const [dragState, setDragState] = useState<ActiveDragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTargetState | null>(null);

  const sectionRootRef = useRef<HTMLElement | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const layoutRef = useRef<HomeMenuLayout>(effectiveLayout);
  layoutRef.current = effectiveLayout;

  const dragStateRef = useRef<ActiveDragState | null>(null);
  dragStateRef.current = dragState;

  const dropTargetRef = useRef<DropTargetState | null>(null);
  dropTargetRef.current = dropTarget;

  const pendingPressRef = useRef<{
    cardId: HomeMenuCardId;
    pointerId: number;
    startX: number;
    startY: number;
    immediate: boolean;
    longPressTimer: number | null;
  } | null>(null);

  const suppressClickUntilRef = useRef<number>(0);

  const clearPendingPress = useCallback(() => {
    const p = pendingPressRef.current;
    if (p && p.longPressTimer !== null) {
      window.clearTimeout(p.longPressTimer);
    }
    pendingPressRef.current = null;
  }, []);

  // Verificación de seguridad: si el usuario pierde Plan 1 Año PRO (expiración/cambio), apagar homeReorderMode y bloquear arrastre automáticamente
  useEffect(() => {
    if (reorderMode && effectiveTier !== 'pro_annual') {
      clearPendingPress();
      dragStateRef.current = null;
      dropTargetRef.current = null;
      setDragState(null);
      setDropTarget(null);
      onForceExitReorderMode?.();
    }
  }, [reorderMode, effectiveTier, clearPendingPress, onForceExitReorderMode]);

  // Si se desactiva el modo edición o cambia el plan, limpiar cualquier arrastre en curso
  useEffect(() => {
    if (!isEditModeActive) {
      clearPendingPress();
      dragStateRef.current = null;
      dropTargetRef.current = null;
      setDragState(null);
      setDropTarget(null);
    }
  }, [isEditModeActive, clearPendingPress]);

  useEffect(() => {
    if (!isPaged) {
      setActivePage(0);
    }
  }, [isPaged]);

  const handleTogglePage = useCallback(() => {
    setActivePage((prev) => (prev === 0 ? 1 : 0));
  }, []);

  const handleCarouselTouchStart = (e: React.TouchEvent) => {
    if (!isPaged || isEditModeActive || dragStateRef.current || e.touches.length !== 1) return;
    swipeStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleCarouselTouchEnd = (e: React.TouchEvent) => {
    if (!isPaged || isEditModeActive || dragStateRef.current || !swipeStartRef.current || e.changedTouches.length === 0) {
      swipeStartRef.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - swipeStartRef.current.x;
    const dy = e.changedTouches[0].clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      handleTogglePage();
    }
  };

  // Evitar selección accidental de texto mientras se arrastra una tarjeta
  useEffect(() => {
    if (!dragState) return;
    const prevUserSelect = document.body.style.userSelect;
    const prevWebkitSelect = (document.body.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect || '';
    document.body.style.userSelect = 'none';
    (document.body.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect = 'none';
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // ignorar
    }
    return () => {
      document.body.style.userSelect = prevUserSelect;
      (document.body.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect = prevWebkitSelect;
    };
  }, [Boolean(dragState)]);

  // Nota: clearPendingPress está declarado arriba para el efecto de limpieza de edición

  const resolveDropTargetAtPoint = useCallback(
    (clientX: number, clientY: number, draggingId: HomeMenuCardId): DropTargetState | null => {
      const root = sectionRootRef.current;
      if (!root) return null;

      // 1) Zona dedicada para mover tarjeta a la otra página (Plan 1 Año / Permanente PRO)
      const crossPageEl = root.querySelector<HTMLElement>('[data-cross-page-target]');
      if (crossPageEl) {
        const targetSec = crossPageEl.dataset.crossPageTarget as HomeMenuSectionId | undefined;
        if (targetSec === 'principal' || targetSec === 'herramientas') {
          const rect = crossPageEl.getBoundingClientRect();
          if (
            clientX >= rect.left - 12 &&
            clientX <= rect.right + 12 &&
            clientY >= rect.top - 12 &&
            clientY <= rect.bottom + 12
          ) {
            return {
              section: targetSec,
              index: layoutRef.current[targetSec].length,
              overCardId: null,
            };
          }
        }
      }

      const cardEls = Array.from(root.querySelectorAll<HTMLElement>('[data-menu-card-id]'));
      let bestCard: { section: HomeMenuSectionId; index: number; id: HomeMenuCardId; dist: number } | null = null;

      for (const el of cardEls) {
        const cid = el.dataset.menuCardId as HomeMenuCardId | undefined;
        const sec = el.dataset.menuSection as HomeMenuSectionId | undefined;
        const idx = Number(el.dataset.menuIndex);
        if (!cid || !sec || Number.isNaN(idx) || cid === draggingId) continue;
        const rect = el.getBoundingClientRect();
        const inside =
          clientX >= rect.left - 8 &&
          clientX <= rect.right + 8 &&
          clientY >= rect.top - 8 &&
          clientY <= rect.bottom + 8;
        if (inside) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dist = Math.hypot(clientX - cx, clientY - cy);
          if (!bestCard || dist < bestCard.dist) {
            bestCard = { section: sec, index: idx, id: cid, dist };
          }
        }
      }

      if (bestCard) {
        return {
          section: bestCard.section,
          index: bestCard.index,
          overCardId: bestCard.id,
        };
      }

      const sectionEls = Array.from(root.querySelectorAll<HTMLElement>('[data-menu-section]'));
      let closestSection: { section: HomeMenuSectionId; dist: number } | null = null;
      for (const el of sectionEls) {
        const sec = el.dataset.menuSection as HomeMenuSectionId | undefined;
        if (sec !== 'principal' && sec !== 'herramientas') continue;
        const rect = el.getBoundingClientRect();
        if (clientY >= rect.top - 16 && clientY <= rect.bottom + 16) {
          return {
            section: sec,
            index: layoutRef.current[sec].length,
            overCardId: null,
          };
        }
        const dy = clientY < rect.top ? rect.top - clientY : clientY - rect.bottom;
        if (!closestSection || dy < closestSection.dist) {
          closestSection = { section: sec, dist: dy };
        }
      }

      if (closestSection) {
        return {
          section: closestSection.section,
          index: layoutRef.current[closestSection.section].length,
          overCardId: null,
        };
      }
      return null;
    },
    []
  );

  useEffect(() => {
    if (!isEditModeActive) return;

    const handlePointerMove = (e: PointerEvent) => {
      const active = dragStateRef.current;
      if (active) {
        if (e.pointerId !== active.pointerId) return;
        e.preventDefault();
        setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
        const target = resolveDropTargetAtPoint(e.clientX, e.clientY, active.cardId);
        if (target) {
          setDropTarget(target);
        }
        // Auto-scroll suave al arrastrar cerca de los bordes superior/inferior
        const edge = 76;
        if (e.clientY < edge) {
          window.scrollBy({ top: -14, behavior: 'auto' });
        } else if (e.clientY > window.innerHeight - edge) {
          window.scrollBy({ top: 14, behavior: 'auto' });
        }
        return;
      }

      const pending = pendingPressRef.current;
      if (!pending || e.pointerId !== pending.pointerId) return;
      const dx = e.clientX - pending.startX;
      const dy = e.clientY - pending.startY;
      const dist = Math.hypot(dx, dy);

      if (pending.immediate) {
        if (dist >= 4) {
          clearPendingPress();
          const nextDrag: ActiveDragState = {
            cardId: pending.cardId,
            pointerId: pending.pointerId,
            x: e.clientX,
            y: e.clientY,
          };
          dragStateRef.current = nextDrag;
          setDragState(nextDrag);
          setDropTarget(resolveDropTargetAtPoint(e.clientX, e.clientY, pending.cardId));
          suppressClickUntilRef.current = Date.now() + 400;
        }
      } else if (dist > 10) {
        // El usuario está haciendo scroll normal -> cancelar long-press
        clearPendingPress();
      }
    };

    const finishDrag = (e: PointerEvent, cancelled = false) => {
      const pending = pendingPressRef.current;
      if (pending && e.pointerId === pending.pointerId) {
        clearPendingPress();
      }

      const active = dragStateRef.current;
      if (!active || e.pointerId !== active.pointerId) return;

      suppressClickUntilRef.current = Date.now() + 260;
      const finalTarget =
        !cancelled
          ? resolveDropTargetAtPoint(e.clientX, e.clientY, active.cardId) || dropTargetRef.current
          : null;

      dragStateRef.current = null;
      dropTargetRef.current = null;
      setDragState(null);
      setDropTarget(null);

      if (finalTarget && onChangeMenuLayout) {
        const current = layoutRef.current;
        const sourceSection: HomeMenuSectionId = current.principal.includes(active.cardId)
          ? 'principal'
          : 'herramientas';
        const sourceIndex = current[sourceSection].indexOf(active.cardId);
        let insertIndex = finalTarget.index;
        if (sourceSection === finalTarget.section && sourceIndex !== -1 && sourceIndex < insertIndex) {
          insertIndex = Math.max(0, insertIndex);
        }
        const nextLayout = moveHomeMenuCard(current, active.cardId, finalTarget.section, insertIndex);
        onChangeMenuLayout(nextLayout);
        if (sourceSection !== finalTarget.section) {
          setActivePage(finalTarget.section === 'principal' ? 0 : 1);
        }
      }
    };

    const onUp = (e: PointerEvent) => finishDrag(e, false);
    const onCancel = (e: PointerEvent) => finishDrag(e, true);

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [isEditModeActive, clearPendingPress, onChangeMenuLayout, resolveDropTargetAtPoint]);

  useEffect(() => {
    return () => clearPendingPress();
  }, [clearPendingPress]);

  const startPendingDrag = (
    cardId: HomeMenuCardId,
    e: React.PointerEvent,
    immediate: boolean
  ) => {
    if (!isEditModeActive) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (immediate) {
      e.preventDefault();
      e.stopPropagation();
    }
    clearPendingPress();

    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;

    if (immediate) {
      pendingPressRef.current = {
        cardId,
        pointerId,
        startX,
        startY,
        immediate: true,
        longPressTimer: null,
      };
      return;
    }

    const timer = window.setTimeout(() => {
      const p = pendingPressRef.current;
      if (!p || p.pointerId !== pointerId || p.cardId !== cardId) return;
      clearPendingPress();
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(18);
        }
      } catch {
        // vibración opcional
      }
      const nextDrag: ActiveDragState = {
        cardId,
        pointerId,
        x: p.startX,
        y: p.startY,
      };
      dragStateRef.current = nextDrag;
      setDragState(nextDrag);
      setDropTarget(resolveDropTargetAtPoint(p.startX, p.startY, cardId));
      suppressClickUntilRef.current = Date.now() + 500;
    }, 260);

    pendingPressRef.current = {
      cardId,
      pointerId,
      startX,
      startY,
      immediate: false,
      longPressTimer: timer,
    };
  };

  const guardActionClick = (action: () => void) => {
    if (dragStateRef.current || Date.now() < suppressClickUntilRef.current) {
      return;
    }
    if (isEditModeActive) {
      return;
    }
    action();
  };

  const handlePedirPinClick = () => {
    if (promoColegaUsed) {
      onOpenPro?.();
      return;
    }
    if (savedReferral && onClaimColleaguePromo) {
      onClaimColleaguePromo();
      return;
    }
    if (onOpenPro) {
      onOpenPro();
    } else if (onOpenColleagueInvite) {
      onOpenColleagueInvite();
    }
  };

  const inviterDisplayName = (referredByName || savedReferral?.refName || referredById || '').trim();
  const hasReferral = Boolean(inviterDisplayName);

  const renderCardButton = (cardId: HomeMenuCardId): React.ReactNode => {
    switch (cardId) {
      case 'levantamiento':
        return (
          <button
            type="button"
            id="lev-entry"
            onClick={() =>
              guardActionClick(() => {
                if (onOpenLevantamiento) {
                  onOpenLevantamiento();
                } else {
                  window.__alumLev?.open();
                }
              })
            }
            className="group !m-0 w-full"
          >
            <MetallicSetSquareIcon size={46} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <span style={{ flex: 1, minWidth: 0 }} className={isEditModeActive ? 'pr-7' : ''}>
              <span className="block text-[17.5px] sm:text-[19px] font-extrabold text-slate-900 dark:text-white tracking-[-0.015em] leading-tight">
                Levantamiento Rápido
              </span>
              <small>Toma medidas en obra y manda directo a cotizar o modular</small>
            </span>
          </button>
        );

      case 'hoja':
        return (
          <button
            type="button"
            id="btn-menu-hoja"
            onClick={() => guardActionClick(onEntrarHoja)}
            className="menu-hero-card metal-hero-card w-full rounded-[18px] p-3.5 sm:p-4 text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.985] flex flex-col gap-2.5"
          >
            <SteelCornerAccent gold={!proActive} />
            <div className="flex items-start gap-3 min-w-0 w-full">
              <MetallicQuoteDocIcon size={48} className="shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className={`flex items-start justify-between gap-2 ${canReorder ? 'pr-7' : ''}`}>
                  <span className="text-[17.5px] sm:text-[19px] font-extrabold text-white tracking-[-0.015em] leading-tight">
                    Hoja de Cotización
                  </span>
                  {!proActive ? (
                    <span className="metal-gold-pro-badge inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold leading-none whitespace-nowrap shrink-0">
                      <span aria-hidden="true">🔒</span>
                      <span>PRO</span>
                    </span>
                  ) : (
                    <span className="metal-emerald-pill inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-extrabold leading-none whitespace-nowrap shrink-0">
                      PRO Activo
                    </span>
                  )}
                </div>
                <p className="m-0 text-[12.5px] sm:text-[13px] text-[#B0C4D4] mt-1 leading-snug">
                  Partidas de obra, optimización de tramos 6.10 m y PDF
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#4A6072]/40 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#07131B]/75 border border-[#4A6072]/55 text-[11px] font-semibold text-[#B0C4D4]">
                  <span className="text-[9.5px] uppercase tracking-wider opacity-80">Piezas</span>
                  <strong className="mono text-white font-extrabold">{hojaPiezasCount} pzas</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#07131B]/75 border border-[#4A6072]/55 text-[11px] font-semibold text-[#B0C4D4]">
                  <span className="text-[9.5px] uppercase tracking-wider opacity-80">Total</span>
                  <strong className="mono text-emerald-300 font-extrabold">{formatMXN(hojaTotal)}</strong>
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                className="text-[#8CA6BA] shrink-0"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        );

      case 'ventanas':
        return (
          <button
            type="button"
            id="btn-menu-ventanas"
            onClick={() => guardActionClick(() => onEntrarTrabajo('ventanas'))}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-2 w-full h-full min-h-[126px] sm:min-h-[144px] p-3 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <SteelCornerAccent />
            <div className="flex items-start justify-between gap-1.5 w-full">
              <MetallicWindowIcon size={40} className="shrink-0" />
            </div>
            <div className="mt-1">
              <span className="block text-[16px] sm:text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.01em]">
                Ventanas
              </span>
              <span className="menu-card-sub block text-[11.5px] sm:text-[12.5px] mt-1 leading-snug">
                3", 2", Europea, Cancel y Mosq.
              </span>
            </div>
          </button>
        );

      case 'puertas':
        return (
          <button
            type="button"
            id="btn-menu-puertas"
            onClick={() => guardActionClick(() => onEntrarTrabajo('puertas'))}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-2 w-full h-full min-h-[126px] sm:min-h-[144px] p-3 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <SteelCornerAccent />
            <div className={`flex items-start justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <MetallicDoorIcon size={40} className="shrink-0" />
              <span
                className={`${
                  proActive ? 'metal-emerald-pill' : 'metal-gold-pro-badge'
                } inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0 mt-0.5`}
              >
                {proActive ? 'PRO Activo' : '🔒 PRO'}
              </span>
            </div>
            <div className="mt-1">
              <span className="block text-[15.5px] sm:text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.01em]">
                Puertas
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12.5px] mt-0.5 leading-snug">
                Batiente Alumer, 2" y Europea
              </span>
            </div>
          </button>
        );

      case 'catalogo':
        return (
          <button
            type="button"
            id="btn-menu-catalogo"
            onClick={() => guardActionClick(() => onGoToView('catalogo'))}
            className="menu-grid-card metal-grid-card !overflow-visible flex flex-col justify-between gap-2 w-full h-full min-h-[132px] sm:min-h-[150px] p-3 sm:p-4 pb-5 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <SteelCornerAccent />
            <div className={`flex items-start justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <MetallicProfilesIcon size={40} className="shrink-0" />
              <span className="metal-bronze-free-badge inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0 mt-0.5">
                3" Gratis
              </span>
            </div>
            <div className="mt-1">
              <span className="block text-[15px] sm:text-[16.5px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.01em]">
                Catálogo Perfiles
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12.5px] mt-0.5 leading-snug">
                Secciones Alumer y fotos reales
              </span>
            </div>
            <span className="metal-cat-bottom-pill mono pointer-events-none absolute -bottom-3.5 left-1/2 -translate-x-1/2 inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11.5px] font-extrabold leading-none whitespace-nowrap z-10">
              {CATALOGO_PERFILES.length} perf.
            </span>
          </button>
        );

      case 'inventario':
        return (
          <button
            type="button"
            id="btn-menu-inventario"
            onClick={() => guardActionClick(onEntrarInventario)}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-2 w-full h-full min-h-[132px] sm:min-h-[150px] p-3 sm:p-4 pb-5 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <SteelCornerAccent />
            <div className={`flex items-start justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <MetallicInventoryBoxIcon size={40} className="shrink-0" />
              <span
                className={`${
                  proActive ? 'metal-emerald-pill' : 'metal-gold-pro-badge'
                } mono inline-flex items-center justify-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0 mt-0.5`}
              >
                {!proActive ? '🔒 PRO' : `${inventarioTramosTotal} tr.`}
              </span>
            </div>
            <div className="mt-1">
              <span className="block text-[15px] sm:text-[16.5px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-[-0.01em]">
                Mi Inventario
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12.5px] mt-0.5 leading-snug">
                Existencias, tramos y herrajes
              </span>
            </div>
          </button>
        );

      case 'notas':
        return (
          <button
            type="button"
            id="btn-menu-notas"
            onClick={() => guardActionClick(() => onGoToView('notas'))}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full h-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <div className={`flex items-center justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <span className="metal-emerald-pill mono inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
                {notasCount > 0 ? `${notasCount} notas` : 'Gratis'}
              </span>
            </div>
            <div>
              <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
                Notas de Obra
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
                Medidas rápidas y fotos en campo
              </span>
            </div>
          </button>
        );

      case 'modulacion':
        return (
          <button
            type="button"
            id="btn-menu-modulacion"
            onClick={() => guardActionClick(() => onGoToView('modulacion'))}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full h-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <div className={`flex items-center justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 6H3" />
                  <path d="M10 12H3" />
                  <path d="M10 18H3" />
                  <path d="m14 15 3 3 5-5" />
                </svg>
              </div>
              <span className="metal-emerald-pill inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
                Gratis
              </span>
            </div>
            <div>
              <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
                Modulación y Cortes
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
                Asistente 5 pasos y medidas exactas
              </span>
            </div>
          </button>
        );

      case 'taller':
        return (
          <button
            type="button"
            id="btn-menu-taller"
            onClick={() => guardActionClick(() => onGoToView('taller'))}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full h-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <div className={`flex items-center justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </div>
              <span className="metal-bronze-free-badge inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
                Tarifas
              </span>
            </div>
            <div>
              <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
                Mi Taller y Precios
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
                Logo, tarifas m², métricas y fórmulas
              </span>
            </div>
          </button>
        );

      case 'galeria':
        return (
          <button
            type="button"
            id="btn-menu-antes-despues"
            onClick={() => guardActionClick(onOpenAntesDespues)}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full h-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <div className={`flex items-center justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                  <path d="M6.5 14l2-2 2 2" />
                  <path d="M14.5 12l2-2 2 2" />
                </svg>
              </div>
              <span className="metal-bronze-free-badge inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
                Clientes
              </span>
            </div>
            <div>
              <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
                Galería (Antes y Después)
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
                Portafolio y presentación a clientes
              </span>
            </div>
          </button>
        );

      case 'vidrio':
        return (
          <button
            type="button"
            id="btn-menu-vidrio"
            onClick={() => guardActionClick(() => onGoToView('vidrio'))}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full h-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <div className={`flex items-center justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="11" y1="3" x2="11" y2="21" />
                  <line x1="11" y1="12" x2="21" y2="12" />
                </svg>
              </div>
              <span className="metal-bronze-free-badge mono inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
                {hojasVidrioCount > 0 ? `${hojasVidrioCount} hojas` : 'Corte 2D'}
              </span>
            </div>
            <div>
              <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
                Optimizador de Vidrio (2D)
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
                Cortes guillotina y % de merma
              </span>
            </div>
          </button>
        );

      case 'cotizaciones':
        return (
          <button
            type="button"
            id="btn-menu-cotizaciones"
            onClick={() => guardActionClick(() => onGoToView('cotizaciones'))}
            className="menu-grid-card metal-grid-card flex flex-col justify-between gap-3 w-full h-full min-h-[124px] sm:min-h-[132px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <div className={`flex items-center justify-between gap-1.5 w-full ${canReorder ? 'pr-7' : ''}`}>
              <div className="metal-icon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 12h6" />
                  <path d="M9 16h4" />
                </svg>
              </div>
              <span className="metal-bronze-free-badge mono inline-flex items-center justify-center px-2 py-1 rounded-full text-[10px] font-extrabold leading-none whitespace-nowrap shrink-0">
                {cotizacionesCount > 0 ? `${cotizacionesCount} folios` : 'Folios'}
              </span>
            </div>
            <div>
              <span className="block text-[14.5px] sm:text-[15.5px] font-extrabold text-slate-900 dark:text-white leading-tight">
                Historial de Cotizaciones
              </span>
              <span className="menu-card-sub block text-[11px] sm:text-[12px] mt-1 leading-snug">
                Enviadas, aprobadas y seguimiento
              </span>
            </div>
          </button>
        );

      case 'videos':
        return (
          <button
            type="button"
            id="btn-menu-videos"
            onClick={() => guardActionClick(() => onGoToView('videos'))}
            className="menu-grid-card metal-grid-card flex items-center justify-between gap-3 w-full min-h-[82px] p-3.5 sm:p-4 rounded-[18px] text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.985]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="metal-icon-btn w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <polygon points="10 9 16 12 10 15 10 9" fill="currentColor" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="block text-[15px] sm:text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight">
                  Video Tutoriales
                </span>
                <span className="menu-card-sub block text-[11.5px] sm:text-[12.5px] mt-0.5 leading-snug">
                  Guías rápidas de ventanas, cortes 6.10 m, vidrio 2D y PDF
                </span>
              </div>
            </div>
            <span className={`metal-emerald-pill inline-flex items-center justify-center px-3 py-1 rounded-full text-[10.5px] font-extrabold leading-none whitespace-nowrap shrink-0 ${isEditModeActive ? 'mr-7' : ''}`}>
              Academia
            </span>
          </button>
        );
    }
  };

  const renderSectionGrid = (sectionId: HomeMenuSectionId, cards: HomeMenuCardId[]) => {
    const isDropZoneSection =
      Boolean(dragState) &&
      dropTarget?.section === sectionId &&
      dropTarget.overCardId === null;
    const spanMap = computeSectionSpanMap(cards);

    return (
      <div
        data-menu-section={sectionId}
        className={`grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-4 rounded-[20px] transition-all ${
          sectionId === 'principal' ? 'mb-7' : ''
        } ${
          isDropZoneSection
            ? 'p-2 -m-2 ring-2 ring-dashed ring-emerald-400/85 bg-emerald-500/8'
            : ''
        }`}
      >
        {cards.length === 0 ? (
          <div
            className="col-span-2 min-h-[76px] rounded-[18px] border-2 border-dashed border-sky-400/45 bg-slate-900/35 flex items-center justify-center px-4 text-center text-[12px] font-bold text-slate-400"
          >
            Arrastra cualquier apartado aquí
          </div>
        ) : (
          cards.map((cardId, idx) => {
            const isFullWidth = Boolean(spanMap[cardId]);
            const isDraggingThis = dragState?.cardId === cardId;
            const isOverThis = Boolean(dragState && dropTarget?.overCardId === cardId);

            return (
              <div
                key={cardId}
                data-menu-card-id={cardId}
                data-menu-section={sectionId}
                data-menu-index={idx}
                style={!isEditModeActive ? { animationDelay: `${idx * 45}ms` } : undefined}
                onPointerDown={
                  isEditModeActive
                    ? (e) => startPendingDrag(cardId, e, true)
                    : undefined
                }
                className={`relative rounded-[18px] transition-all duration-150 ${
                  isFullWidth ? 'col-span-2' : 'col-span-1'
                } ${cardId === 'catalogo' ? 'mb-1.5' : ''} ${
                  !isEditModeActive ? 'ap-menu-card-stagger' : ''
                } ${
                  isEditModeActive
                    ? 'touch-none select-none cursor-grab active:cursor-grabbing ring-1 ring-emerald-400/60'
                    : ''
                } ${
                  isEditModeActive && !isDraggingThis && !isOverThis ? 'ap-card-reorder-wiggle' : ''
                } ${
                  isDraggingThis
                    ? 'opacity-35 scale-[0.97] ring-2 ring-dashed ring-sky-400'
                    : isOverThis
                      ? 'ring-2 ring-emerald-400 scale-[1.015] shadow-[0_0_22px_rgba(16,185,129,0.35)]'
                      : ''
                }`}
              >
                {renderCardButton(cardId)}

                {/* Manija de arrastre visible SOLO cuando el modo edición "Organizar apartados" está activo */}
                {isEditModeActive && (
                  <button
                    type="button"
                    data-drag-handle={cardId}
                    aria-label={`Arrastrar ${CARD_DISPLAY_LABELS[cardId]}`}
                    title="Arrastra para mover o cambiar de página"
                    onPointerDown={(e) => startPendingDrag(cardId, e, true)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="absolute top-2 right-2 z-20 inline-flex items-center justify-center w-6 h-6 rounded-lg border border-emerald-400/85 bg-emerald-600/90 text-white shadow-md touch-none select-none cursor-grab active:cursor-grabbing transition-transform"
                  >
                    <GripVertical className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <section
      ref={sectionRootRef}
      id="view-menu"
      data-pro-active={proActive ? 'true' : 'false'}
      data-reorder-enabled={canReorder ? 'true' : 'false'}
      data-reorder-mode={isEditModeActive ? 'true' : 'false'}
      className={`screen-animate ${isEditModeActive ? 'pb-36 sm:pb-28 select-none' : 'pb-28 sm:pb-14'} ${dragState ? 'select-none' : ''}`}
    >
      {/* Avisos / Mensajes del Administrador (sin leer) */}
      {unreadAdminMessages.length > 0 && (
        <div id="menu-admin-messages-stack" className="mb-3 flex flex-col gap-2">
          {unreadAdminMessages.slice(0, 3).map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl border p-3.5 shadow-lg ${
                msg.tipo === 'promo'
                  ? 'border-emerald-400/65 bg-emerald-50 dark:bg-emerald-950/75 text-emerald-950 dark:text-emerald-50'
                  : msg.tipo === 'soporte'
                    ? 'border-amber-400/65 bg-amber-50 dark:bg-amber-950/70 text-amber-950 dark:text-amber-50'
                    : 'border-sky-400/65 bg-blue-50 dark:bg-sky-950/75 text-slate-900 dark:text-sky-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white">
                      {msg.tipo === 'promo' ? '🎁 Promo' : msg.tipo === 'soporte' ? '🛠️ Soporte' : '📢 Aviso'}
                    </span>
                    <strong className="text-[13.5px] font-extrabold leading-tight">
                      {msg.titulo}
                    </strong>
                  </div>
                  <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed whitespace-pre-line opacity-95">
                    {msg.cuerpo}
                  </p>
                </div>
              </div>
              {onMarkAdminMessageRead && (
                <div className="mt-2.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onMarkAdminMessageRead(msg.id)}
                    className="min-h-[34px] px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11.5px] font-extrabold cursor-pointer transition-transform active:scale-95"
                  >
                    ✓ Entendido / Marcar como leído
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Título principal centrado con brillo/contraste máximo */}
      <div className="mb-3 sm:mb-4 flex flex-col items-center justify-center text-center gap-1.5">
        <h1 className="m-0 text-[clamp(1.55rem,5vw,2.2rem)] font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-[-0.02em] dark:drop-shadow-[0_2px_14px_rgba(255,255,255,0.18)] [text-wrap:balance]">
          ¿Qué vamos a trabajar?
        </h1>
        {hasReferral && (
          <span
            id="badge-menu-referred-by"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300/95 bg-emerald-100 dark:bg-emerald-500/12 border border-emerald-400/50 rounded-full px-3.5 py-1 leading-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            Invitado por: {inviterDisplayName}
          </span>
        )}

        {/* Controles de paginación (Planes 30d, 90d y 1 Año PRO) */}
        {isPaged && (
          <div
            id="menu-pro-controls-bar"
            data-menu-tier={effectiveTier}
            className="mt-1.5 w-full flex flex-wrap items-center justify-center gap-2"
          >
            <div
              id="menu-page-switcher"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-slate-300 dark:border-[#4A6072]/70 bg-white/90 dark:bg-[#0D1E2B]/90 shadow-xs"
            >
              <button
                type="button"
                id="btn-menu-page-prev"
                onClick={handleTogglePage}
                aria-label="Página anterior"
                className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-sky-200 cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                id="btn-menu-page-1"
                onClick={() => setActivePage(0)}
                aria-pressed={activePage === 0}
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all ${
                  activePage === 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                Pág. 1 · Principal
              </button>
              <button
                type="button"
                id="btn-menu-page-2"
                onClick={() => setActivePage(1)}
                aria-pressed={activePage === 1}
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all ${
                  activePage === 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                Pág. 2 · Taller
              </button>
              <button
                type="button"
                id="btn-menu-page-next"
                onClick={handleTogglePage}
                aria-label="Página siguiente"
                className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-sky-200 cursor-pointer transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Aviso de seguimiento de cotizaciones pendientes (si existen) */}
      {onOpenReminders && pendingRemindersCount > 0 && (() => {
        const needsPushActivation = pushPermission === 'default' || pushPermission === 'denied';
        const ctaText =
          pushPermission === 'denied'
            ? 'Desbloquear Push →'
            : pushPermission === 'default'
              ? 'Activar Push →'
              : 'Ver';
        return (
          <button
            type="button"
            id="btn-menu-pending-reminders"
            data-push-permission={pushPermission}
            onClick={onOpenReminders}
            className={`mb-3.5 w-full rounded-2xl px-4 py-3 text-left cursor-pointer border transition-all active:scale-[0.98] flex items-center justify-between gap-3 shadow-lg ${
              dueRemindersCount > 0 || pushPermission === 'denied'
                ? 'border-amber-400/70 bg-amber-500/18 hover:bg-amber-500/26 text-white'
                : 'border-sky-400/50 bg-sky-500/15 hover:bg-sky-500/24 text-white'
            }`}
          >
            <div className="min-w-0">
              <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-amber-200 truncate">
                {dueRemindersCount > 0
                  ? `🔔 ${dueRemindersCount} seguimiento(s) vencido(s)`
                  : '🔔 Recordatorios de Cotizaciones'}
                {needsPushActivation ? ' · Falta activar avisos Push' : ''}
              </span>
              <span className="block text-[13px] font-extrabold text-white leading-snug mt-0.5">
                {pushPermission === 'denied'
                  ? `Las notificaciones están bloqueadas: desbloquéalas para tus ${pendingRemindersCount} cotización(es) pendiente(s)`
                  : pushPermission === 'default'
                    ? `Activa las notificaciones del navegador para recibir aviso de tus ${pendingRemindersCount} cotización(es) pendiente(s)`
                    : `Tienes ${pendingRemindersCount} cotización(es) pendiente(s) por dar seguimiento`}
              </span>
            </div>
            <span className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-[11.5px] whitespace-nowrap">
              {ctaText}
            </span>
          </button>
        );
      })()}

      {/* Banner horizontal verde esmeralda: SOLO visible cuando el usuario llegó por invitación de un colega */}
      {!proActive && hasReferral && (
        <div
          id="card-menu-colleague-promo"
          className={`mb-3 w-full rounded-[16px] px-3.5 py-2.5 text-left transition-all ${
            promoColegaUsed
              ? 'border border-amber-400/50 bg-gradient-to-r from-[#1a1812]/90 via-[#111b24]/95 to-[#161c24]/95 shadow-lg'
              : 'metal-colleague-banner'
          }`}
        >
          {promoColegaUsed ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block text-[13.5px] sm:text-[14.5px] font-extrabold text-amber-200 leading-tight">
                  Prueba Colega de 3 días concluida
                </span>
                <p className="m-0 mt-0.5 text-[11px] text-[#B0C4D4] leading-snug">
                  Adquiere un plan de 30, 90 días o 1 Año para continuar con PRO.
                </p>
              </div>
              {onOpenPro && (
                <button
                  type="button"
                  id="btn-menu-upgrade-pro-after-colleague"
                  onClick={onOpenPro}
                  className="shrink-0 min-h-[38px] px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-[0.97] text-slate-950 font-extrabold text-[12.5px] cursor-pointer shadow-md whitespace-nowrap"
                >
                  Actualizar a PRO
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (savedReferral && onClaimColleaguePromo) {
                      onClaimColleaguePromo();
                    } else if (onOpenColleagueInvite) {
                      onOpenColleagueInvite();
                    } else {
                      onOpenPro?.();
                    }
                  }}
                >
                  <span className="block text-[15px] sm:text-[16.5px] font-extrabold text-[#78F5BA] tracking-[-0.01em] leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] truncate">
                    Invitado por: {inviterDisplayName}
                  </span>
                  <span className="block text-[11px] font-semibold text-emerald-100/90 mt-0.5 truncate">
                    {savedReferral
                      ? `Promo #${savedReferral.promoNumber} · 3 días PRO gratis`
                      : '3 días PRO gratis por invitación de colega'}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-menu-claim-colleague-promo"
                  onClick={handlePedirPinClick}
                  className="metal-colleague-pin-btn shrink-0 min-h-[38px] px-4 sm:px-5 py-1.5 rounded-full font-extrabold text-[13.5px] sm:text-[14px] tracking-tight cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  Pedir PIN
                </button>
              </div>

              {savedReferral && onOpenPro && (
                <div className="flex items-center justify-end pt-1 border-t border-emerald-300/20">
                  <button
                    type="button"
                    id="btn-menu-enter-colleague-pin"
                    onClick={onOpenPro}
                    className="text-[11.5px] font-bold text-emerald-100 hover:text-white underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0"
                  >
                    Ya tengo mi PIN →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DISTRIBUCIÓN SEGÚN PLAN ACTIVO */}
      {!isPaged ? (
        /* VERSIÓN GRATUITA / PRUEBA 3D: 1 sola vista vertical fija sin división de páginas ni arrastre */
        <div id="menu-free-vertical-view" data-menu-layout-mode="free-vertical">
          {renderSectionGrid('principal', effectiveLayout.principal)}

          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#4A6072]/60 to-transparent" aria-hidden="true" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-[#8CA6BA]">
              Herramientas del Taller
            </span>
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#4A6072]/60 to-transparent" aria-hidden="true" />
          </div>

          {renderSectionGrid('herramientas', effectiveLayout.herramientas)}
        </div>
      ) : (
        /* PLANES 30d / 90d PRO (fijo) y 1 AÑO / PERMANENTE PRO (reorganizable con long-press entre páginas) */
        <div
          id="menu-paged-carousel"
          data-menu-layout-mode={canReorder ? 'pro-annual-paged-editable' : 'pro-paged-fixed'}
          data-active-page={activePage + 1}
          onTouchStart={handleCarouselTouchStart}
          onTouchEnd={handleCarouselTouchEnd}
          className="relative"
        >
          {/* Zona interactiva para soltar y mover una tarjeta a la otra página (solo en modo edición 1 Año PRO) */}
          {isEditModeActive && (() => {
            const targetSec: HomeMenuSectionId = activePage === 0 ? 'herramientas' : 'principal';
            const targetLabel = activePage === 0 ? 'Página 2 · Taller' : 'Página 1 · Principal';
            const isHovering = Boolean(dragState && dropTarget?.section === targetSec);
            return (
              <div
                id="menu-cross-page-dropzone"
                data-cross-page-target={targetSec}
                className={`mb-3 px-4 py-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-[12px] font-extrabold transition-all ${
                  isHovering
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 scale-[1.01] shadow-lg'
                    : dragState
                      ? 'border-sky-400/80 bg-sky-500/15 text-sky-950 dark:text-sky-100'
                      : 'border-emerald-400/55 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {dragState
                    ? `Soltar aquí para mover a ${targetLabel}`
                    : `Arrastra cualquier tarjeta aquí para moverla a ${targetLabel}`}
                </span>
              </div>
            );
          })()}

          {activePage === 0 ? (
            <div id="menu-page-panel-1" className="ap-view-forward">
              {renderSectionGrid('principal', effectiveLayout.principal)}
            </div>
          ) : (
            <div id="menu-page-panel-2" className="ap-view-forward">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#4A6072]/60 to-transparent" aria-hidden="true" />
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-[#8CA6BA]">
                  Página 2 · Herramientas del Taller
                </span>
                <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#4A6072]/60 to-transparent" aria-hidden="true" />
              </div>
              {renderSectionGrid('herramientas', effectiveLayout.herramientas)}
            </div>
          )}

          {/* Indicadores inferiores de página (desliza o toca) */}
          <div className="mt-1 mb-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActivePage(0)}
              aria-label="Ir a Página 1"
              className={`h-2 rounded-full transition-all cursor-pointer border-0 ${
                activePage === 0 ? 'w-7 bg-blue-500' : 'w-2 bg-slate-500/60 hover:bg-slate-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setActivePage(1)}
              aria-label="Ir a Página 2"
              className={`h-2 rounded-full transition-all cursor-pointer border-0 ${
                activePage === 1 ? 'w-7 bg-blue-500' : 'w-2 bg-slate-500/60 hover:bg-slate-400'
              }`}
            />
            <span className="ml-1 text-[10.5px] font-semibold text-slate-400">
              Desliza ↔ para cambiar página ({activePage + 1}/2)
            </span>
          </div>
        </div>
      )}

      {/* Barra flotante discreta abajo en modo edición (portal al body para position:fixed real) */}
      {isEditModeActive &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="menu-reorder-floating-bar"
            role="region"
            aria-label="Controles de organización de apartados"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9960] max-w-[calc(100vw-24px)] px-2.5 py-2 rounded-2xl border border-emerald-400/75 bg-slate-950/94 backdrop-blur-md shadow-[0_14px_36px_rgba(0,0,0,0.68)] flex items-center gap-2"
          >
            {isCustomLayout && onResetMenuLayout && (
              <button
                type="button"
                id="btn-menu-reset-layout"
                onClick={onResetMenuLayout}
                className="inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-100 text-[12px] font-bold cursor-pointer whitespace-nowrap transition-transform active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Restaurar</span>
              </button>
            )}
            <button
              type="button"
              id="btn-menu-save-lock-layout"
              onClick={() => onSaveAndLockLayout?.(effectiveLayout)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-xl border border-emerald-300/80 bg-emerald-600 hover:bg-emerald-500 text-white text-[12.5px] font-extrabold shadow-md cursor-pointer whitespace-nowrap transition-transform active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Guardar y Bloquear</span>
            </button>
          </div>,
          document.body
        )}

      {/* Vista fantasma flotante durante arrastre PRO (portal al body para coordenadas exactas) */}
      {dragState &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="menu-drag-ghost"
            aria-hidden="true"
            style={{
              left: dragState.x,
              top: dragState.y,
            }}
            className="fixed z-[9970] pointer-events-none -translate-x-1/2 -translate-y-1/2 px-4 py-2.5 rounded-2xl border-2 border-emerald-400 bg-[#0A1E2E]/95 text-white shadow-[0_14px_34px_rgba(0,0,0,0.7)] flex items-center gap-2 text-[13px] font-extrabold whitespace-nowrap"
          >
            <GripVertical className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{CARD_DISPLAY_LABELS[dragState.cardId]}</span>
          </div>,
          document.body
        )}
    </section>
  );
};
