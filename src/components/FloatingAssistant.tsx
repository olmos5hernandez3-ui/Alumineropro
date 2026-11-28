import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATALOGO_PERFILES,
  computeAssistantDailyQuotaState,
  FREE_ASSISTANT_DAILY_LIMIT,
  GOOGLE_CLOUD_PERSUASIVE_TIP,
  PerfilCatalogoItem,
  PerfilFamilia,
} from '../utils/alumineroLogic';
import {
  AppSkin,
  AppSkinVariant,
  compressImageToDataUrl,
  formatWhatsappUrlDigits,
  getTodayDateKey,
  incrementAssistantDailyQuota,
  loadAssistantDailyQuota,
  sanitizeWhatsappNumber,
} from '../utils/storageHelpers';
import { PhotoPickerButtons } from './PhotoPickerButtons';
import { CollapsibleAccordion } from './CollapsibleAccordion';
import {
  ASSISTANT_CHARACTERS,
  AssistantAvatarId,
  AssistantAvatarMood,
  AssistantCharacterSvg,
  AVATAR_EVENT_NAME,
  AVATAR_POS_KEY,
  AVATAR_VISIBLE_EVENT_NAME,
  loadAvatarVisible,
  loadSelectedAvatar,
  loadSelectedRobotVariant,
  ROBOT_VARIANT_EVENT_NAME,
  ROBOT_VARIANT_OPTIONS,
  RobotVariantChoice,
  saveSelectedAvatar,
  saveSelectedRobotVariant,
} from './AssistantCharacters';
import {
  ASSISTANT_CELEBRATE_EVENT_NAME,
  ASSISTANT_TAP_PARTICLES,
  AssistantCelebrateDetail,
  AVATAR_SOUND_EVENT_NAME,
  AVATAR_TIPS_EVENT_NAME,
  computeDragTiltDegrees,
  computeSmartBubblePosition,
  getCharacterCelebrationText,
  getCharacterQuickGreeting,
  GHOST_CLICK_SHIELD_MS,
  initAssistantAudioAutoUnlock,
  isGhostClickShieldActive,
  loadAvatarSoundEnabled,
  loadAvatarTipsEnabled,
  playAssistantSound,
  saveAvatarSoundEnabled,
  shouldBlockGhostClickTarget,
  unlockAssistantAudio,
} from '../utils/assistantEffects';
import {
  answerAssistantQuestion,
  ASSISTANT_QUICK_CHIPS,
  AssistantGuideResponse,
  AssistantGuideTarget,
  resolveRobotPose,
} from '../utils/assistantGuideLogic';

const VISITED_VIEWS_KEY = 'aluminero_visited_views_v1';

interface ProactiveTip {
  id: string;
  text: string;
  ctaLabel: string;
  action: 'quote' | 'lev' | 'pro' | 'tutorial' | 'google';
}

interface FloatingAssistantProps {
  whatsappNumber: string;
  deviceId: string;
  skin?: AppSkin;
  skinVariant?: AppSkinVariant;
  proActive?: boolean;
  googleConnected?: boolean;
  currentView?: string;
  hasPendingQuote?: boolean;
  hasPendingLev?: boolean;
  partidasCount?: number;
  historialCount?: number;
  onNavigateView?: (view: 'hoja' | 'videos') => void;
  onNavigateGuideTarget?: (target: AssistantGuideTarget) => void;
  onOpenLevantamiento?: () => void;
  onOpenTutorial?: () => void;
  onOpenPro?: () => void;
  onConnectGoogle?: () => void;
  suppressAutoBubble?: boolean;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

const FAMILIA_LABELS: Record<PerfilFamilia, string> = {
  corrediza3: 'Corrediza 3" (Alumer)',
  fijo3: 'Fijo 3" (Alumer)',
  batiente: 'Puerta Batiente (Alumer)',
  cancel: 'Cancel para Baño (Alumer)',
  mosquitero: 'Mosquiteros',
  nacional2: 'Línea Nacional 2"',
  serie1400: 'Serie 1400',
  espanola: 'Española / Europea',
  herralum: 'Herralum',
  perfileto: 'Perfileto',
};

const FAMILIA_ORDER: PerfilFamilia[] = [
  'corrediza3',
  'fijo3',
  'nacional2',
  'serie1400',
  'espanola',
  'batiente',
  'cancel',
  'herralum',
  'perfileto',
  'mosquitero',
];

function dataUrlToJpegFile(dataUrl: string, filename: string): File {
  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const b64 = parts[1] || '';
  const mimeMatch = header.match(/data:([^;]+);base64/i);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

function openExternalLinkSafe(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function triggerFileDownload(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1800);
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({
  whatsappNumber,
  deviceId,
  skin = 'basica',
  skinVariant = 'default',
  proActive = false,
  googleConnected = false,
  currentView = 'menu',
  hasPendingQuote = false,
  hasPendingLev = false,
  partidasCount = 0,
  historialCount = 0,
  onNavigateView,
  onNavigateGuideTarget,
  onOpenLevantamiento,
  onOpenTutorial,
  onOpenPro,
  onConnectGoogle,
  suppressAutoBubble = false,
  onShowToast,
}) => {
  const [open, setOpen] = useState(false);
  const [travelingToCenter, setTravelingToCenter] = useState(false);
  const [morphedAtCenter, setMorphedAtCenter] = useState(false);
  const travelTimerRef = useRef<number | null>(null);
  const celebrateTimerRef = useRef<number | null>(null);
  const dropBounceTimerRef = useRef<number | null>(null);
  const [modalTab, setModalTab] = useState<'guide' | 'admin'>('guide');
  const [guideQuery, setGuideQuery] = useState('');
  const [guideAnswer, setGuideAnswer] = useState<AssistantGuideResponse | null>(null);
  const [activeStepGuide, setActiveStepGuide] = useState<AssistantGuideResponse | null>(null);
  const [completedGuideSteps, setCompletedGuideSteps] = useState<Record<number, boolean>>({});
  const [activeOption, setActiveOption] = useState<'A' | 'B'>('A');
  const [quotaRec, setQuotaRec] = useState(() => loadAssistantDailyQuota());

  const [avatarId, setAvatarId] = useState<AssistantAvatarId>(() => loadSelectedAvatar());
  const [robotVariant, setRobotVariant] = useState<RobotVariantChoice>(() =>
    loadSelectedRobotVariant()
  );
  const [avatarPickerOpen, setAvatarPickerOpen] = useState<boolean>(false);
  const [avatarVisible, setAvatarVisible] = useState<boolean>(() => loadAvatarVisible());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadAvatarSoundEnabled());
  const [tipsEnabled, setTipsEnabled] = useState<boolean>(() => loadAvatarTipsEnabled());
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  }));
  const [hopActive, setHopActive] = useState(false);
  const [laserFlashActive, setLaserFlashActive] = useState(false);
  const [particleBurstKey, setParticleBurstKey] = useState(0);
  const [particlesVisible, setParticlesVisible] = useState(false);
  const particleTimerRef = useRef<number | null>(null);
  const laserFlashTimerRef = useRef<number | null>(null);
  const ghostShieldUntilRef = useRef<number>(0);
  const ghostShieldTimerRef = useRef<number | null>(null);
  const [ghostShieldActive, setGhostShieldActive] = useState(false);
  const touchTapRef = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const [gestureActive, setGestureActive] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [dragTiltDeg, setDragTiltDeg] = useState(0);
  const [dropBounceActive, setDropBounceActive] = useState(false);
  const [gestureBanner, setGestureBanner] = useState<string | null>(null);
  const [dismissedTipIds, setDismissedTipIds] = useState<Record<string, boolean>>({});
  const [activeTip, setActiveTip] = useState<ProactiveTip | null>(null);
  const prevPartidasCountRef = useRef<number>(partidasCount);
  const prevHistorialCountRef = useRef<number>(historialCount);

  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = window.localStorage.getItem(AVATAR_POS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { x?: number; y?: number };
      if (
        typeof parsed?.x === 'number' &&
        typeof parsed?.y === 'number' &&
        Number.isFinite(parsed.x) &&
        Number.isFinite(parsed.y)
      ) {
        return { x: parsed.x, y: parsed.y };
      }
    } catch {
      // ignore
    }
    return null;
  });

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    originX: number;
    originY: number;
    moved: boolean;
    longPressed: boolean;
    longPressTimer: number | null;
  } | null>(null);

  const avatarMeta = useMemo(
    () => ASSISTANT_CHARACTERS.find((c) => c.id === avatarId) || ASSISTANT_CHARACTERS[0],
    [avatarId]
  );

  const triggerCelebration = (reason: 'piece' | 'quote', customMsg?: string) => {
    if (!avatarVisible) return;
    if (celebrateTimerRef.current !== null) {
      window.clearTimeout(celebrateTimerRef.current);
    }
    setCelebrating(true);
    setGestureBanner(customMsg || getCharacterCelebrationText(avatarId, reason));
    playAssistantSound(avatarId, 'celebrate', soundEnabled);
    celebrateTimerRef.current = window.setTimeout(() => {
      celebrateTimerRef.current = null;
      setCelebrating(false);
      setGestureBanner(null);
    }, 2400);
  };

  useEffect(() => {
    return initAssistantAudioAutoUnlock();
  }, []);

  useEffect(() => {
    const onRobotVariantEv = (ev: Event) => {
      const next = (ev as CustomEvent<RobotVariantChoice>).detail;
      if (next === 'classic' || next === 'waving' || next === 'technical') {
        setRobotVariant(next);
      }
    };
    window.addEventListener(ROBOT_VARIANT_EVENT_NAME, onRobotVariantEv);
    return () => window.removeEventListener(ROBOT_VARIANT_EVENT_NAME, onRobotVariantEv);
  }, []);

  useEffect(() => {
    const onAvatarEv = (ev: Event) => {
      const next = (ev as CustomEvent<AssistantAvatarId>).detail;
      setAvatarId(next || loadSelectedAvatar());
    };
    const onVisEv = (ev: Event) => {
      const next = (ev as CustomEvent<boolean>).detail;
      setAvatarVisible(typeof next === 'boolean' ? next : loadAvatarVisible());
    };
    const onSoundEv = (ev: Event) => {
      const next = (ev as CustomEvent<boolean>).detail;
      setSoundEnabled(typeof next === 'boolean' ? next : loadAvatarSoundEnabled());
    };
    const onTipsEv = (ev: Event) => {
      const next = (ev as CustomEvent<boolean>).detail;
      const resolved = typeof next === 'boolean' ? next : loadAvatarTipsEnabled();
      setTipsEnabled(resolved);
      if (!resolved) {
        setActiveTip(null);
      }
    };
    const onCelebrateEv = (ev: Event) => {
      const detail = (ev as CustomEvent<AssistantCelebrateDetail>).detail;
      triggerCelebration(detail?.reason || 'piece', detail?.message);
    };
    window.addEventListener(AVATAR_EVENT_NAME, onAvatarEv);
    window.addEventListener(AVATAR_VISIBLE_EVENT_NAME, onVisEv);
    window.addEventListener(AVATAR_SOUND_EVENT_NAME, onSoundEv);
    window.addEventListener(AVATAR_TIPS_EVENT_NAME, onTipsEv);
    window.addEventListener(ASSISTANT_CELEBRATE_EVENT_NAME, onCelebrateEv);
    return () => {
      window.removeEventListener(AVATAR_EVENT_NAME, onAvatarEv);
      window.removeEventListener(AVATAR_VISIBLE_EVENT_NAME, onVisEv);
      window.removeEventListener(AVATAR_SOUND_EVENT_NAME, onSoundEv);
      window.removeEventListener(AVATAR_TIPS_EVENT_NAME, onTipsEv);
      window.removeEventListener(ASSISTANT_CELEBRATE_EVENT_NAME, onCelebrateEv);
    };
  }, [avatarId, avatarVisible, soundEnabled]);

  useEffect(() => {
    if (partidasCount > prevPartidasCountRef.current) {
      triggerCelebration('piece');
    }
    prevPartidasCountRef.current = partidasCount;
  }, [partidasCount]);

  useEffect(() => {
    if (historialCount > prevHistorialCountRef.current) {
      triggerCelebration('quote');
    }
    prevHistorialCountRef.current = historialCount;
  }, [historialCount]);

  const [unvisitedSectionNow, setUnvisitedSectionNow] = useState(false);

  useEffect(() => {
    if (!currentView || currentView === 'menu' || currentView === 'admin') {
      setUnvisitedSectionNow(false);
      return;
    }
    try {
      const raw = window.localStorage.getItem(VISITED_VIEWS_KEY);
      const visited: unknown = raw ? JSON.parse(raw) : [];
      if (!(Array.isArray(visited) && visited.includes(currentView))) {
        setUnvisitedSectionNow(true);
        const nextVisited = Array.isArray(visited) ? [...visited, currentView] : [currentView];
        window.localStorage.setItem(VISITED_VIEWS_KEY, JSON.stringify(nextVisited));
      } else {
        setUnvisitedSectionNow(false);
      }
    } catch {
      setUnvisitedSectionNow(false);
    }
  }, [currentView]);

  const computedProactiveTip = useMemo<ProactiveTip | null>(() => {
    if (open || !avatarVisible || !tipsEnabled || suppressAutoBubble) return null;
    if (unvisitedSectionNow && !dismissedTipIds[`unvisited-${currentView}`]) {
      return {
        id: `unvisited-${currentView}`,
        text: 'Esta sección aún no la has utilizado, ¿quieres que te guíe con un tutorial de cómo hacerla?',
        ctaLabel: 'Ver tutorial',
        action: 'tutorial',
      };
    }
    if ((hasPendingQuote || hasPendingLev) && currentView === 'menu') {
      const tipId = hasPendingQuote ? 'pending-quote' : 'pending-lev';
      if (!dismissedTipIds[tipId]) {
        return {
          id: tipId,
          text: 'Tienes una cotización pendiente, ¿quieres que vayamos a terminarla?',
          ctaLabel: 'Ir a terminar',
          action: hasPendingQuote ? 'quote' : 'lev',
        };
      }
    }
    if (
      !googleConnected &&
      (currentView === 'menu' || currentView === 'hoja') &&
      !dismissedTipIds['google-cloud-backup']
    ) {
      return {
        id: 'google-cloud-backup',
        text: GOOGLE_CLOUD_PERSUASIVE_TIP,
        ctaLabel: 'Conectar Google',
        action: 'google',
      };
    }
    if (!proActive && currentView === 'menu' && !dismissedTipIds['free-unlock']) {
      return {
        id: 'free-unlock',
        text: '¡Estás a unos pasos de desbloquear tu versión gratuita!',
        ctaLabel: 'Ver cómo',
        action: 'pro',
      };
    }
    return null;
  }, [
    open,
    avatarVisible,
    tipsEnabled,
    suppressAutoBubble,
    unvisitedSectionNow,
    currentView,
    hasPendingQuote,
    hasPendingLev,
    googleConnected,
    proActive,
    dismissedTipIds,
  ]);

  useEffect(() => {
    if (suppressAutoBubble) {
      setActiveTip(null);
      setGestureBanner(null);
    }
  }, [suppressAutoBubble]);

  useEffect(() => {
    if (!tipsEnabled || suppressAutoBubble || !computedProactiveTip) {
      setActiveTip(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveTip(computedProactiveTip);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [computedProactiveTip, tipsEnabled, suppressAutoBubble]);

  useEffect(() => {
    const onResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setDragPos((prev) => {
        if (!prev) return null;
        const maxX = Math.max(8, window.innerWidth - 100);
        const maxY = Math.max(66, window.innerHeight - 104);
        return {
          x: Math.min(Math.max(8, prev.x), maxX),
          y: Math.min(Math.max(66, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const quotaState = useMemo(
    () =>
      computeAssistantDailyQuotaState(
        quotaRec,
        getTodayDateKey(),
        proActive,
        FREE_ASSISTANT_DAILY_LIMIT
      ),
    [quotaRec, proActive]
  );

  useEffect(() => {
    return () => {
      if (travelTimerRef.current !== null) window.clearTimeout(travelTimerRef.current);
      if (celebrateTimerRef.current !== null) window.clearTimeout(celebrateTimerRef.current);
      if (dropBounceTimerRef.current !== null) window.clearTimeout(dropBounceTimerRef.current);
      if (particleTimerRef.current !== null) window.clearTimeout(particleTimerRef.current);
      if (laserFlashTimerRef.current !== null) window.clearTimeout(laserFlashTimerRef.current);
      if (ghostShieldTimerRef.current !== null) window.clearTimeout(ghostShieldTimerRef.current);
      if (dragRef.current?.longPressTimer != null) {
        window.clearTimeout(dragRef.current.longPressTimer);
      }
    };
  }, []);

  const activateGhostClickShield = () => {
    ghostShieldUntilRef.current = Date.now() + GHOST_CLICK_SHIELD_MS;
    setGhostShieldActive(true);
    if (ghostShieldTimerRef.current !== null) {
      window.clearTimeout(ghostShieldTimerRef.current);
    }
    ghostShieldTimerRef.current = window.setTimeout(() => {
      ghostShieldTimerRef.current = null;
      setGhostShieldActive(false);
    }, GHOST_CLICK_SHIELD_MS + 10);
  };

  useEffect(() => {
    const interceptGhostEvent = (ev: Event) => {
      if (!isGhostClickShieldActive(ghostShieldUntilRef.current)) return;
      if (!shouldBlockGhostClickTarget(ev.target, '#floating-assistant-root')) return;
      if (ev.cancelable) ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
    };
    const eventTypes = [
      'click',
      'mousedown',
      'mouseup',
      'pointerdown',
      'pointerup',
      'touchstart',
      'touchend',
    ];
    for (const type of eventTypes) {
      window.addEventListener(type, interceptGhostEvent, { capture: true, passive: false });
    }
    return () => {
      for (const type of eventTypes) {
        window.removeEventListener(type, interceptGhostEvent, true);
      }
    };
  }, []);

  const stopEventBubble = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const triggerToolParticles = () => {
    if (particleTimerRef.current !== null) {
      window.clearTimeout(particleTimerRef.current);
    }
    setParticleBurstKey((prev) => prev + 1);
    setParticlesVisible(true);
    particleTimerRef.current = window.setTimeout(() => {
      particleTimerRef.current = null;
      setParticlesVisible(false);
    }, 760);
  };

  const triggerLaserFlash = () => {
    if (laserFlashTimerRef.current !== null) {
      window.clearTimeout(laserFlashTimerRef.current);
    }
    setLaserFlashActive(true);
    laserFlashTimerRef.current = window.setTimeout(() => {
      laserFlashTimerRef.current = null;
      setLaserFlashActive(false);
    }, 600);
  };

  const handleCloseAssistant = () => {
    activateGhostClickShield();
    if (travelTimerRef.current !== null) {
      window.clearTimeout(travelTimerRef.current);
      travelTimerRef.current = null;
    }
    setTravelingToCenter(false);
    setMorphedAtCenter(false);
    setOpen(false);
  };

  const handleToggleAssistant = () => {
    unlockAssistantAudio();
    activateGhostClickShield();
    if (open || travelingToCenter) {
      handleCloseAssistant();
      return;
    }
    setActiveTip(null);
    setGestureBanner(getCharacterQuickGreeting(avatarId));
    setHopActive(true);
    triggerToolParticles();
    triggerLaserFlash();
    playAssistantSound(avatarId, 'tap', soundEnabled);
    window.setTimeout(() => setHopActive(false), 520);
    setTravelingToCenter(true);
    setMorphedAtCenter(false);
    travelTimerRef.current = window.setTimeout(() => {
      travelTimerRef.current = null;
      setTravelingToCenter(false);
      setMorphedAtCenter(true);
      setGestureBanner(null);
      setOpen(true);
    }, 420);
  };

  const triggerLongPressGesture = () => {
    unlockAssistantAudio();
    setGestureActive(true);
    triggerToolParticles();
    triggerLaserFlash();
    setGestureBanner(avatarMeta.gestureText);
    playAssistantSound(avatarId, 'longpress', soundEnabled);
    window.setTimeout(() => setGestureActive(false), 950);
    window.setTimeout(() => setGestureBanner(null), 2800);
  };

  const handleAvatarPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    unlockAssistantAudio();
    if (open || e.button === 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = dragPos ? dragPos.x : rect.left;
    const originY = dragPos ? dragPos.y : rect.top;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const longPressTimer = window.setTimeout(() => {
      if (dragRef.current && !dragRef.current.moved) {
        dragRef.current.longPressed = true;
        triggerLongPressGesture();
      }
    }, 600);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      originX,
      originY,
      moved: false,
      longPressed: false,
      longPressTimer,
    };
  };

  const handleAvatarPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    const stepDx = e.clientX - st.lastX;
    const stepDy = e.clientY - st.lastY;
    st.lastX = e.clientX;
    st.lastY = e.clientY;
    if (!st.moved && Math.hypot(dx, dy) > 8) {
      st.moved = true;
      setIsDraggingAvatar(true);
      if (st.longPressTimer !== null) {
        window.clearTimeout(st.longPressTimer);
        st.longPressTimer = null;
      }
    }
    if (st.moved) {
      const maxX = Math.max(8, window.innerWidth - 100);
      const maxY = Math.max(66, window.innerHeight - 104);
      const nextX = Math.min(Math.max(8, st.originX + dx), maxX);
      const nextY = Math.min(Math.max(66, st.originY + dy), maxY);
      setDragPos({ x: nextX, y: nextY });
      const tilt = computeDragTiltDegrees(stepDx !== 0 ? stepDx : dx * 0.15, stepDy);
      setDragTiltDeg(tilt);
    }
  };

  const handleAvatarPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    if (st.longPressTimer !== null) window.clearTimeout(st.longPressTimer);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const wasMoved = st.moved;
    const wasLongPressed = st.longPressed;
    dragRef.current = null;
    setIsDraggingAvatar(false);
    setDragTiltDeg(0);
    activateGhostClickShield();
    if (wasMoved && dragPos) {
      try {
        window.localStorage.setItem(AVATAR_POS_KEY, JSON.stringify(dragPos));
      } catch {
        // ignore
      }
      if (dropBounceTimerRef.current !== null) {
        window.clearTimeout(dropBounceTimerRef.current);
      }
      setDropBounceActive(true);
      playAssistantSound(avatarId, 'drop', soundEnabled);
      dropBounceTimerRef.current = window.setTimeout(() => {
        dropBounceTimerRef.current = null;
        setDropBounceActive(false);
      }, 540);
      return;
    }
    e.preventDefault();
    if (!wasLongPressed) {
      handleToggleAssistant();
    }
  };

  const handleAvatarTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    unlockAssistantAudio();
    const t = e.touches[0];
    touchTapRef.current = t
      ? { startX: t.clientX, startY: t.clientY, moved: false }
      : { startX: 0, startY: 0, moved: false };
  };

  const handleAvatarTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const t = e.touches[0];
    if (t && touchTapRef.current && !touchTapRef.current.moved) {
      if (Math.hypot(t.clientX - touchTapRef.current.startX, t.clientY - touchTapRef.current.startY) > 8) {
        touchTapRef.current.moved = true;
      }
    }
  };

  const handleAvatarTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const wasTouchDrag = Boolean(touchTapRef.current?.moved);
    touchTapRef.current = null;
    activateGhostClickShield();
    if (!wasTouchDrag && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleExecuteTipAction = (tip: ProactiveTip) => {
    setDismissedTipIds((prev) => ({ ...prev, [tip.id]: true }));
    setActiveTip(null);
    if (tip.action === 'quote') onNavigateView?.('hoja');
    else if (tip.action === 'lev') onOpenLevantamiento?.();
    else if (tip.action === 'pro') onOpenPro?.();
    else if (tip.action === 'google') onConnectGoogle?.();
    else if (tip.action === 'tutorial') {
      if (onOpenTutorial) onOpenTutorial();
      else onNavigateView?.('videos');
    }
  };

  const handleQuickSelectAvatar = (nextId: AssistantAvatarId) => {
    unlockAssistantAudio();
    setAvatarId(nextId);
    saveSelectedAvatar(nextId);
    playAssistantSound(nextId, 'tap', soundEnabled);
  };

  const handleQuickSelectRobotVariant = (nextVariant: RobotVariantChoice) => {
    unlockAssistantAudio();
    setAvatarId('robot');
    saveSelectedAvatar('robot');
    setRobotVariant(nextVariant);
    saveSelectedRobotVariant(nextVariant);
    playAssistantSound('robot', 'tap', soundEnabled);
  };

  const handleToggleModalSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    saveAvatarSoundEnabled(next);
    if (next) {
      unlockAssistantAudio();
      playAssistantSound(avatarId, 'tap', true);
    }
  };

  const handleAskGuide = (rawText: string) => {
    unlockAssistantAudio();
    const trimmed = rawText.trim();
    const result = answerAssistantQuestion(trimmed || 'cotización');
    setGuideQuery(trimmed);
    setGuideAnswer(result);
    playAssistantSound(avatarId, 'tap', soundEnabled);
  };

  const handleGuideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAskGuide(guideQuery);
  };

  const handleGoToGuideTarget = (guide: AssistantGuideResponse) => {
    unlockAssistantAudio();
    setActiveStepGuide(guide);
    setCompletedGuideSteps({});
    handleCloseAssistant();
    if (onNavigateGuideTarget) {
      onNavigateGuideTarget(guide.target);
      return;
    }
    if (guide.target === 'levantamiento') onOpenLevantamiento?.();
    else if (guide.target === 'hoja') onNavigateView?.('hoja');
  };

  const robotPose = useMemo(() => {
    if (gestureActive) return 'technical';
    if (celebrating || hopActive) return 'waving';
    if (robotVariant !== 'classic') return robotVariant;
    return resolveRobotPose({
      currentView,
      open,
      hopActive,
      celebrating,
      gestureActive,
    });
  }, [currentView, open, hopActive, celebrating, gestureActive, robotVariant]);

  const [sugerenciaTexto, setSugerenciaTexto] = useState('');
  const [errorA, setErrorA] = useState('');

  const [selectedPerfilId, setSelectedPerfilId] = useState('');
  const [customPerfilNombre, setCustomPerfilNombre] = useState('');
  const [fotoDataUrl, setFotoDataUrl] = useState('');
  const [fotoFileName, setFotoFileName] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorB, setErrorB] = useState('');

  const cleanWa = sanitizeWhatsappNumber(whatsappNumber);
  const waUrlDigits = formatWhatsappUrlDigits(whatsappNumber);

  const perfilesByFamilia = useMemo(() => {
    const grouped: Record<PerfilFamilia, PerfilCatalogoItem[]> = {
      corrediza3: [],
      fijo3: [],
      batiente: [],
      cancel: [],
      mosquitero: [],
      nacional2: [],
      serie1400: [],
      espanola: [],
      herralum: [],
      perfileto: [],
    };
    for (const item of CATALOGO_PERFILES) {
      grouped[item.familia].push(item);
    }
    return grouped;
  }, []);

  const selectedPerfil = useMemo(
    () => CATALOGO_PERFILES.find((p) => p.id === selectedPerfilId) || null,
    [selectedPerfilId]
  );

  const handleSelectPhoto = async (file: File) => {
    setErrorB('');
    setCompressing(true);
    try {
      const compressed = await compressImageToDataUrl(file, 600, 0.8);
      setFotoDataUrl(compressed);
      const baseName = (selectedPerfil?.id || customPerfilNombre.trim() || 'perfil')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32);
      setFotoFileName(`aprobacion-${baseName || 'perfil'}.jpg`);
    } catch {
      setErrorB('No se pudo procesar la foto seleccionada. Intenta con otra imagen.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSendOptionA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaState.canSend) {
      setErrorA(
        `Alcanzaste tu límite de ${quotaState.limit} consultas diarias en la Versión Gratuita. Actualiza a PRO para consultas ilimitadas.`
      );
      return;
    }
    const cleanText = sugerenciaTexto.trim();
    if (!cleanText) {
      setErrorA('Escribe qué marca, línea, perfil o herraje hace falta.');
      return;
    }
    setSending(true);
    setErrorA('');
    if (!proActive) setQuotaRec(incrementAssistantDailyQuota());
    const message = [
      '*Asistente Aluminero Pro — Sugerencia*',
      `• Solicitud (marca/línea/herraje): ${cleanText}`,
      `• Equipo origen: ${deviceId}`,
    ].join('\n');
    const waUrl = waUrlDigits
      ? `https://wa.me/${waUrlDigits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    try {
      if (cleanWa) {
        openExternalLinkSafe(waUrl);
        onShowToast('Abriendo WhatsApp del Administrador con tu sugerencia', true);
      } else if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: 'Sugerencia — Asistente Aluminero Pro',
            text: message,
          });
          onShowToast('Sugerencia compartida con éxito', true);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          openExternalLinkSafe(waUrl);
          onShowToast('Abriendo WhatsApp con tu sugerencia', true);
        }
      } else {
        openExternalLinkSafe(waUrl);
        onShowToast('Abriendo WhatsApp con tu sugerencia', true);
      }
      setSugerenciaTexto('');
      handleCloseAssistant();
    } finally {
      setSending(false);
    }
  };

  const handleSendOptionB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaState.canSend) {
      setErrorB(
        `Alcanzaste tu límite de ${quotaState.limit} envíos diarios en la Versión Gratuita. Actualiza a PRO para envíos ilimitados.`
      );
      return;
    }
    const cleanCustom = customPerfilNombre.trim();
    if (!selectedPerfil && !cleanCustom) {
      setErrorB('Selecciona un perfil existente o escribe su nombre.');
      return;
    }
    if (!fotoDataUrl) {
      setErrorB('Toma o elige una foto del perfil antes de enviarla.');
      return;
    }
    setSending(true);
    setErrorB('');
    if (!proActive) setQuotaRec(incrementAssistantDailyQuota());
    const message = [
      '*Asistente Aluminero Pro — Foto para aprobación*',
      `• Perfil: ${selectedPerfil ? `${selectedPerfil.nombre} (${selectedPerfil.codigoRef})` : cleanCustom}`,
      ...(selectedPerfil && cleanCustom ? [`• Nombre/nota adicional: ${cleanCustom}`] : []),
      ...(selectedPerfil ? [`• Medidas catálogo: ${selectedPerfil.dimensiones}`] : []),
      `• Equipo origen: ${deviceId}`,
      ...(cleanWa ? [`• WhatsApp Admin: +52 ${cleanWa}`] : []),
      '• Solicitud: Revisar y aprobar foto para el catálogo oficial.',
    ].join('\n');
    const photoFile = dataUrlToJpegFile(fotoDataUrl, fotoFileName || 'perfil-aprobacion.jpg');
    try {
      let canNativeShareFiles = false;
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function'
      ) {
        try {
          canNativeShareFiles = navigator.canShare({ files: [photoFile] });
        } catch {
          canNativeShareFiles = false;
        }
      }
      if (canNativeShareFiles) {
        try {
          await navigator.share({
            title: 'Foto de perfil para aprobación — Aluminero Pro',
            text: message,
            files: [photoFile],
          });
          onShowToast(
            cleanWa
              ? `Foto lista para enviar al Admin (+${cleanWa})`
              : 'Foto enviada para aprobación del Administrador',
            true
          );
          setSelectedPerfilId('');
          setCustomPerfilNombre('');
          setFotoDataUrl('');
          setFotoFileName('');
          handleCloseAssistant();
          return;
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            onShowToast('Envío cancelado');
            return;
          }
        }
      }
      triggerFileDownload(photoFile);
      openExternalLinkSafe(
        waUrlDigits
          ? `https://wa.me/${waUrlDigits}?text=${encodeURIComponent(message)}`
          : `https://wa.me/?text=${encodeURIComponent(message)}`
      );
      onShowToast(
        cleanWa
          ? 'Abriendo WhatsApp del Administrador · Adjunta la foto descargada'
          : 'Foto descargada y abriendo WhatsApp con los datos del perfil',
        true
      );
      setSelectedPerfilId('');
      setCustomPerfilNombre('');
      setFotoDataUrl('');
      setFotoFileName('');
      handleCloseAssistant();
    } finally {
      setSending(false);
    }
  };

  if (!avatarVisible && !open) return null;

  const rootPosStyle: React.CSSProperties | undefined = dragPos
    ? {
        position: 'fixed',
        left: `${dragPos.x}px`,
        top: `${dragPos.y}px`,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  return (
    <div
      id="floating-assistant-root"
      data-skin={skin}
      data-skin-variant={skinVariant}
      data-avatar-id={avatarId}
      data-ghost-shield-active={ghostShieldActive ? 'true' : 'false'}
      onClick={stopEventBubble}
      onPointerDown={stopEventBubble}
      onPointerMove={stopEventBubble}
      onPointerUp={stopEventBubble}
      onTouchStart={stopEventBubble}
      onTouchEnd={stopEventBubble}
      style={rootPosStyle}
      className={
        dragPos
          ? 'z-[9999] select-none'
          : 'fixed bottom-2.5 right-2.5 sm:bottom-5 sm:right-5 z-[9999] select-none'
      }
    >
      {travelingToCenter && (
        <div
          id="assistant-travel-stage"
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerDown={stopEventBubble}
          onPointerMove={stopEventBubble}
          onPointerUp={stopEventBubble}
          onTouchStart={stopEventBubble}
          onTouchEnd={(e) => {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
          }}
          className="fixed inset-0 z-[9999] pointer-events-auto bg-[#040c12]/45 backdrop-blur-[1.5px]"
        >
          <div
            id="assistant-traveling-robot"
            className="robot-3d-glide-center flex items-center justify-center pointer-events-none"
          >
            <AssistantCharacterSvg
              avatarId={avatarId}
              size={74}
              skin={skin}
              skinVariant={skinVariant}
              santaHat={skin === 'navidena'}
              robotPose="waving"
            />
          </div>
        </div>
      )}

      {open && morphedAtCenter && (
        <div
          aria-hidden="true"
          onPointerDown={stopEventBubble}
          onPointerMove={stopEventBubble}
          onPointerUp={stopEventBubble}
          onTouchStart={stopEventBubble}
          onTouchEnd={(e) => {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            handleCloseAssistant();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleCloseAssistant();
          }}
          className="fixed inset-0 z-[9999] bg-[#040c12]/65 backdrop-blur-[3px]"
        />
      )}

      {open && (
        <section
          id="card-floating-assistant"
          role="dialog"
          aria-label="Asistente Aluminero Pro"
          data-centered-morph={morphedAtCenter ? 'true' : 'false'}
          onClick={stopEventBubble}
          onPointerDown={stopEventBubble}
          onPointerMove={stopEventBubble}
          onPointerUp={stopEventBubble}
          onTouchStart={stopEventBubble}
          onTouchEnd={stopEventBubble}
          className={`${
            morphedAtCenter
              ? 'assistant-card-morph-center z-[9999] w-[calc(100vw-2rem)] max-w-[420px] max-h-[calc(100vh-4.5rem)]'
              : 'assistant-card-enter fixed bottom-[92px] right-4 sm:right-5 z-[9999] w-[calc(100vw-2rem)] max-w-[400px] max-h-[calc(100vh-6.5rem)]'
          } overflow-y-auto rounded-[22px] border-[1.5px] shadow-2xl p-4`}
        >
          <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-[#4A6072]/45 assistant-card-divider">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="metal-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                <AssistantCharacterSvg
                  avatarId={avatarId}
                  size={38}
                  skin={skin}
                  skinVariant={skinVariant}
                  santaHat={skin === 'navidena'}
                  mood="happy"
                  robotPose="waving"
                  withHalo={false}
                />
              </div>
              <div className="min-w-0">
                <h2 className="m-0 text-[15px] font-extrabold leading-tight truncate">
                  Asistente · {avatarMeta.label}
                </h2>
                <p className="m-0 text-[11.5px] font-semibold assistant-subtext leading-tight mt-0.5">
                  {getCharacterQuickGreeting(avatarId)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="btn-assistant-modal-sound-toggle"
                aria-label={soundEnabled ? 'Silenciar voz del asistente' : 'Activar voz del asistente'}
                title={soundEnabled ? 'Sonido activado' : 'Sonido en silencio'}
                data-sound-enabled={soundEnabled ? 'true' : 'false'}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  unlockAssistantAudio();
                }}
                onPointerUp={stopEventBubble}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  unlockAssistantAudio();
                }}
                onTouchEnd={stopEventBubble}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleModalSound();
                }}
                className={`min-w-[34px] min-h-[34px] rounded-xl border text-[15px] font-extrabold cursor-pointer flex items-center justify-center transition-colors ${
                  soundEnabled
                    ? 'border-sky-400/60 bg-sky-500/20 text-sky-200 hover:bg-sky-500/30'
                    : 'border-slate-500/50 bg-slate-800/70 text-slate-400 hover:bg-slate-700/80'
                }`}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
              <button
                type="button"
                id="btn-assistant-close"
                onPointerDown={stopEventBubble}
                onPointerUp={stopEventBubble}
                onTouchStart={stopEventBubble}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  if (e.cancelable) e.preventDefault();
                  handleCloseAssistant();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleCloseAssistant();
                }}
                aria-label="Cerrar Asistente Aluminero Pro"
                className="min-w-[34px] min-h-[34px] rounded-xl assistant-close-btn font-extrabold text-[14px] cursor-pointer shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div
            id="assistant-quick-avatar-bar"
            className="mb-3"
            onPointerDown={stopEventBubble}
            onPointerUp={stopEventBubble}
            onTouchStart={stopEventBubble}
            onTouchEnd={stopEventBubble}
          >
            <CollapsibleAccordion
              id="acc-assistant-character-picker"
              title="Cambiar asistente (1 toque)"
              summary={
                avatarId === 'robot'
                  ? `Seleccionado: ${ROBOT_VARIANT_OPTIONS.find((v) => v.id === robotVariant)?.label || 'Alumi-Bot 3D'}`
                  : `Seleccionado: ${avatarMeta.label}`
              }
              open={avatarPickerOpen}
              onToggle={() => {
                unlockAssistantAudio();
                setAvatarPickerOpen((prev) => !prev);
              }}
              tone="dark"
              className="!rounded-2xl !border-[#4A6072]/45 !bg-[#0b1520]/65"
            >
              {/* 3 variantes/vistas del Robot seleccionables */}
              <div className="mb-2.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-sky-300 mb-1.5">
                  3 Vistas de Alumi-Bot 3D
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ROBOT_VARIANT_OPTIONS.map((variant) => {
                    const isSelectedVariant = avatarId === 'robot' && robotVariant === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        id={`btn-quick-robot-${variant.id}`}
                        data-robot-variant={variant.id}
                        aria-pressed={isSelectedVariant}
                        title={variant.label}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          unlockAssistantAudio();
                        }}
                        onPointerUp={stopEventBubble}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          unlockAssistantAudio();
                        }}
                        onTouchEnd={stopEventBubble}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickSelectRobotVariant(variant.id);
                        }}
                        className={`flex flex-col items-center justify-center min-w-0 px-1.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          isSelectedVariant
                            ? 'border-sky-400 bg-sky-500/25 ring-1 ring-sky-400/75 text-white'
                            : 'border-[#4A6072]/40 bg-slate-900/55 hover:border-sky-400/60 text-slate-200'
                        }`}
                      >
                        <span className="w-8 h-8 flex items-center justify-center overflow-visible">
                          <AssistantCharacterSvg
                            avatarId="robot"
                            size={32}
                            skin={skin}
                            skinVariant={skinVariant}
                            santaHat={skin === 'navidena'}
                            robotPose={variant.id}
                            withHalo={false}
                          />
                        </span>
                        <span className="text-[9.5px] font-extrabold leading-tight mt-0.5 truncate max-w-full">
                          {variant.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Galería completa de personajes */}
              <div className="text-[10px] font-extrabold uppercase tracking-wide assistant-subtext mb-1.5">
                Todos los personajes ({ASSISTANT_CHARACTERS.length})
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-[210px] overflow-y-auto pr-0.5">
                {ASSISTANT_CHARACTERS.map((char) => {
                  const isSelected = char.id === avatarId;
                  const shortName = char.id === 'robot' ? 'Robot' : char.label.split(' ')[0];
                  return (
                    <button
                      key={char.id}
                      type="button"
                      id={`btn-quick-avatar-${char.id}`}
                      data-quick-avatar={char.id}
                      aria-pressed={isSelected}
                      title={`Cambiar a ${char.label}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        unlockAssistantAudio();
                      }}
                      onPointerUp={stopEventBubble}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        unlockAssistantAudio();
                      }}
                      onTouchEnd={stopEventBubble}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickSelectAvatar(char.id);
                      }}
                      className={`flex flex-col items-center justify-center min-w-0 px-1 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-sky-400 bg-sky-500/22 ring-1 ring-sky-400/70'
                          : 'border-[#4A6072]/40 bg-slate-900/50 hover:border-sky-400/60'
                      }`}
                    >
                      <span className="w-8 h-8 flex items-center justify-center overflow-hidden">
                        <AssistantCharacterSvg
                          avatarId={char.id}
                          size={30}
                          skin={skin}
                          skinVariant={skinVariant}
                          santaHat={skin === 'navidena'}
                          robotPose={char.id === 'robot' ? robotVariant : undefined}
                          withHalo={false}
                        />
                      </span>
                      <span className="text-[9.5px] font-extrabold leading-tight mt-0.5 truncate max-w-full">
                        {shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleAccordion>
          </div>

          {!googleConnected && (
            <div
              id="assistant-cloud-backup-tip"
              className="mb-3 p-2.5 rounded-2xl border border-sky-400/40 bg-[#0d1829] text-slate-100 flex flex-col gap-2"
            >
              <p className="m-0 text-[11.5px] leading-snug font-semibold text-sky-100">
                ☁️ {GOOGLE_CLOUD_PERSUASIVE_TIP}
              </p>
              {onConnectGoogle && (
                <button
                  type="button"
                  id="btn-assistant-connect-google"
                  onPointerDown={stopEventBubble}
                  onPointerUp={stopEventBubble}
                  onTouchStart={stopEventBubble}
                  onTouchEnd={stopEventBubble}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseAssistant();
                    onConnectGoogle();
                  }}
                  className="self-end px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-[11.5px] cursor-pointer transition-colors"
                >
                  Conectar con Google
                </button>
              )}
            </div>
          )}

          <div
            className="grid grid-cols-2 gap-2 mb-3"
            role="tablist"
            aria-label="Modo del Asistente Aluminero Pro"
          >
            <button
              type="button"
              role="tab"
              id="tab-assistant-guide"
              aria-selected={modalTab === 'guide'}
              onPointerDown={stopEventBubble}
              onPointerUp={stopEventBubble}
              onTouchStart={stopEventBubble}
              onTouchEnd={stopEventBubble}
              onClick={(e) => {
                e.stopPropagation();
                setModalTab('guide');
              }}
              className={`px-2.5 py-2.5 rounded-xl border text-center cursor-pointer transition-all text-[12px] font-extrabold leading-tight ${
                modalTab === 'guide' ? 'assistant-tab-active' : 'assistant-tab-idle'
              }`}
            >
              💬 Pregúntale al Asistente
            </button>
            <button
              type="button"
              role="tab"
              id="tab-assistant-admin"
              aria-selected={modalTab === 'admin'}
              onPointerDown={stopEventBubble}
              onPointerUp={stopEventBubble}
              onTouchStart={stopEventBubble}
              onTouchEnd={stopEventBubble}
              onClick={(e) => {
                e.stopPropagation();
                setModalTab('admin');
              }}
              className={`px-2.5 py-2.5 rounded-xl border text-center cursor-pointer transition-all text-[12px] font-extrabold leading-tight ${
                modalTab === 'admin' ? 'assistant-tab-active' : 'assistant-tab-idle'
              }`}
            >
              📩 Sugerir material al Admin
            </button>
          </div>

          {modalTab === 'guide' && (
            <div id="panel-assistant-guide" className="flex flex-col gap-2.5">
              <form
                id="form-assistant-guide"
                onSubmit={handleGuideSubmit}
                className="flex items-stretch gap-1.5"
              >
                <input
                  id="inp-assistant-question"
                  type="text"
                  value={guideQuery}
                  onClick={stopEventBubble}
                  onPointerDown={stopEventBubble}
                  onPointerMove={stopEventBubble}
                  onPointerUp={stopEventBubble}
                  onTouchStart={stopEventBubble}
                  onTouchEnd={stopEventBubble}
                  style={{ touchAction: 'auto' }}
                  onChange={(e) => setGuideQuery(e.target.value)}
                  placeholder="Ej. ¿Cómo hago una cotización o saco descuentos?"
                  className="flex-1 min-w-0 min-h-[40px] rounded-xl border border-[#4A6072] px-3 text-[12.5px] font-semibold select-text"
                />
                <button
                  type="submit"
                  id="btn-assistant-ask"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    unlockAssistantAudio();
                  }}
                  onPointerUp={stopEventBubble}
                  onTouchStart={stopEventBubble}
                  onTouchEnd={stopEventBubble}
                  onClick={stopEventBubble}
                  className="px-3.5 min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[12.5px] cursor-pointer shrink-0 transition-colors"
                >
                  Preguntar
                </button>
              </form>

              <div id="assistant-quick-chips" className="grid grid-cols-2 gap-1.5">
                {ASSISTANT_QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    id={`btn-assistant-chip-${chip.id}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      unlockAssistantAudio();
                    }}
                    onPointerUp={stopEventBubble}
                    onTouchStart={stopEventBubble}
                    onTouchEnd={stopEventBubble}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAskGuide(chip.query);
                    }}
                    className="px-2.5 py-2 rounded-xl border border-sky-400/35 bg-sky-500/10 hover:bg-sky-500/20 text-left text-[11.5px] font-extrabold leading-tight cursor-pointer transition-colors"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {guideAnswer ? (
                <div
                  id="assistant-guide-answer"
                  className="rounded-2xl border border-sky-400/50 bg-[#0d1c2b]/90 p-3 text-slate-100 flex flex-col gap-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[16px] leading-none mt-0.5" aria-hidden="true">
                      ✨
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="m-0 text-[13px] font-extrabold text-sky-200 leading-snug">
                        {guideAnswer.title}
                      </h3>
                      <p className="m-0 mt-1 text-[12px] font-medium text-slate-200 leading-relaxed">
                        {guideAnswer.answer}
                      </p>
                    </div>
                  </div>
                  <ol className="m-0 pl-4 list-decimal text-[11.5px] font-semibold text-slate-300 space-y-1">
                    {guideAnswer.steps.map((stepText, idx) => (
                      <li key={idx} className="leading-snug">
                        {stepText}
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    id="btn-assistant-go-guide"
                    onPointerDown={stopEventBubble}
                    onPointerUp={stopEventBubble}
                    onTouchStart={stopEventBubble}
                    onTouchEnd={stopEventBubble}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToGuideTarget(guideAnswer);
                    }}
                    className="metal-emerald-pill w-full min-h-[42px] px-3.5 rounded-xl font-extrabold text-[13px] cursor-pointer flex items-center justify-center gap-1.5 mt-0.5"
                  >
                    <span>Ir al apartado y guiarme →</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#4A6072]/40 bg-[#0b1520]/45 px-3 py-2.5 text-[11.5px] font-semibold assistant-subtext leading-relaxed">
                  Toca cualquiera de los 4 accesos rápidos o escribe tu duda arriba. Te explico paso a paso y te llevo directo al apartado sin gastar internet.
                </div>
              )}
            </div>
          )}

          {modalTab === 'admin' && (
            <>
              <div
                id="assistant-quota-bar"
                className={`mb-3 px-3 py-2 rounded-xl border text-[11.5px] font-bold flex items-center justify-between gap-2 ${
                  !quotaState.isLimited
                    ? 'border-emerald-400/40 bg-emerald-500/12 text-emerald-200'
                    : quotaState.canSend
                      ? 'border-sky-400/40 bg-sky-500/12 text-sky-100'
                      : 'border-amber-400/60 bg-amber-500/18 text-amber-100'
                }`}
              >
                <span>
                  {!quotaState.isLimited
                    ? '⚡ Plan PRO · Consultas ilimitadas'
                    : quotaState.canSend
                      ? `Plan Gratuito · ${quotaState.remaining} de ${quotaState.limit} consultas hoy`
                      : `Límite diario alcanzado (${quotaState.usedToday}/${quotaState.limit})`}
                </span>
                {quotaState.isLimited && onOpenPro && (
                  <button
                    type="button"
                    id="btn-assistant-upgrade-pro"
                    onPointerDown={stopEventBubble}
                    onPointerUp={stopEventBubble}
                    onTouchStart={stopEventBubble}
                    onTouchEnd={stopEventBubble}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseAssistant();
                      onOpenPro();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] cursor-pointer shrink-0"
                  >
                    Ver PRO
                  </button>
                )}
              </div>

              <div
                className="grid grid-cols-2 gap-2 mb-3.5"
                role="tablist"
                aria-label="Opciones de envío al administrador"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeOption === 'A'}
                  id="btn-assistant-opt-a"
                  onPointerDown={stopEventBubble}
                  onPointerUp={stopEventBubble}
                  onTouchStart={stopEventBubble}
                  onTouchEnd={stopEventBubble}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveOption('A');
                    setErrorB('');
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    activeOption === 'A' ? 'assistant-tab-active' : 'assistant-tab-idle'
                  }`}
                >
                  <span className="block text-[10px] font-black uppercase tracking-wider opacity-85">
                    Opción A
                  </span>
                  <span className="block text-[12px] font-extrabold leading-tight mt-0.5">
                    Sugerir línea o perfil
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeOption === 'B'}
                  id="btn-assistant-opt-b"
                  onPointerDown={stopEventBubble}
                  onPointerUp={stopEventBubble}
                  onTouchStart={stopEventBubble}
                  onTouchEnd={stopEventBubble}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveOption('B');
                    setErrorA('');
                  }}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    activeOption === 'B' ? 'assistant-tab-active' : 'assistant-tab-idle'
                  }`}
                >
                  <span className="block text-[10px] font-black uppercase tracking-wider opacity-85">
                    Opción B
                  </span>
                  <span className="block text-[12px] font-extrabold leading-tight mt-0.5">
                    Subir foto aprobación
                  </span>
                </button>
              </div>

              {activeOption === 'A' && (
                <form
                  id="form-assistant-opt-a"
                  onSubmit={handleSendOptionA}
                  className="flex flex-col gap-2.5"
                >
                  <div>
                    <label
                      htmlFor="inp-asistente-sugerencia"
                      className="block text-[12px] font-extrabold mb-1"
                    >
                      ¿Qué marca, línea o herraje hace falta? *
                    </label>
                    <textarea
                      id="inp-asistente-sugerencia"
                      rows={3}
                      value={sugerenciaTexto}
                      onClick={stopEventBubble}
                      onPointerDown={stopEventBubble}
                      onPointerMove={stopEventBubble}
                      onPointerUp={stopEventBubble}
                      onTouchStart={stopEventBubble}
                      onTouchEnd={stopEventBubble}
                      style={{ touchAction: 'auto' }}
                      onChange={(e) => {
                        setSugerenciaTexto(e.target.value);
                        if (errorA) setErrorA('');
                      }}
                      placeholder="Ej. Marca Cuprum, Línea Eurovent Serie 70, perfil riel curvo o jaladera multipunto..."
                      className="w-full rounded-xl border border-[#4A6072] p-2.5 text-[13px] font-medium select-text"
                    />
                  </div>
                  {errorA && (
                    <p className="m-0 text-[12px] font-bold text-red-300 bg-red-950/60 border border-red-400/50 rounded-xl px-3 py-2">
                      {errorA}
                    </p>
                  )}
                  <div className="text-[11px] font-semibold assistant-subtext">
                    {cleanWa
                      ? `Destino directo: WhatsApp Admin (+${cleanWa})`
                      : 'Se abrirá Compartir / WhatsApp para enviarlo al Administrador.'}
                  </div>
                  <button
                    type="submit"
                    id="btn-assistant-send-a"
                    disabled={sending}
                    onClick={stopEventBubble}
                    onPointerDown={stopEventBubble}
                    onPointerUp={stopEventBubble}
                    onTouchStart={stopEventBubble}
                    onTouchEnd={stopEventBubble}
                    className="metal-emerald-pill w-full min-h-[44px] px-4 rounded-xl font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{sending ? 'Abriendo envío...' : 'Enviar sugerencia al Administrador'}</span>
                  </button>
                </form>
              )}

              {activeOption === 'B' && (
                <form
                  id="form-assistant-opt-b"
                  onSubmit={handleSendOptionB}
                  className="flex flex-col gap-2.5"
                >
                  <div>
                    <label
                      htmlFor="sel-asistente-perfil"
                      className="block text-[12px] font-extrabold mb-1"
                    >
                      Selecciona un perfil existente
                    </label>
                    <select
                      id="sel-asistente-perfil"
                      value={selectedPerfilId}
                      onClick={stopEventBubble}
                      onPointerDown={stopEventBubble}
                      onPointerUp={stopEventBubble}
                      onTouchStart={stopEventBubble}
                      onTouchEnd={stopEventBubble}
                      style={{ touchAction: 'auto' }}
                      onChange={(e) => {
                        setSelectedPerfilId(e.target.value);
                        if (errorB) setErrorB('');
                      }}
                      className="w-full min-h-[40px] rounded-xl border border-[#4A6072] px-2.5 text-[12.5px] font-bold"
                    >
                      <option value="">— Elegir perfil del catálogo (o escribir abajo) —</option>
                      {FAMILIA_ORDER.map((fam) => (
                        <optgroup key={fam} label={FAMILIA_LABELS[fam]}>
                          {perfilesByFamilia[fam].map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} · {p.codigoRef}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="inp-asistente-perfil-nombre"
                      className="block text-[12px] font-extrabold mb-1"
                    >
                      {selectedPerfil
                        ? 'Nombre o nota adicional (opcional)'
                        : 'O escribe el nombre del perfil *'}
                    </label>
                    <input
                      id="inp-asistente-perfil-nombre"
                      type="text"
                      value={customPerfilNombre}
                      onClick={stopEventBubble}
                      onPointerDown={stopEventBubble}
                      onPointerMove={stopEventBubble}
                      onPointerUp={stopEventBubble}
                      onTouchStart={stopEventBubble}
                      onTouchEnd={stopEventBubble}
                      style={{ touchAction: 'auto' }}
                      onChange={(e) => {
                        setCustomPerfilNombre(e.target.value);
                        if (errorB) setErrorB('');
                      }}
                      placeholder={
                        selectedPerfil
                          ? 'Ej. Corte visto de frente / marca específica'
                          : 'Ej. Cabezal Serie 4500 o perfil nuevo'
                      }
                      className="w-full min-h-[40px] rounded-xl border border-[#4A6072] px-3 text-[13px] font-semibold select-text"
                    />
                  </div>

                  <div>
                    <span className="block text-[12px] font-extrabold mb-1.5">
                      Foto del perfil desde tu celular *
                    </span>
                    <PhotoPickerButtons
                      disabled={compressing}
                      cameraButtonId="btn-assistant-take-photo"
                      galleryButtonId="btn-assistant-pick-photo"
                      compact={true}
                      onSelectFile={(file) => void handleSelectPhoto(file)}
                    />
                    {compressing && (
                      <p className="m-0 mt-2 text-[11.5px] font-bold text-cyan-300">
                        Optimizando foto...
                      </p>
                    )}
                    {fotoDataUrl && !compressing && (
                      <div className="mt-2 p-2 rounded-xl border border-[#4A6072]/60 bg-[#07131B]/80 flex items-center gap-2.5">
                        <img
                          src={fotoDataUrl}
                          alt="Vista previa de foto para aprobación"
                          className="w-14 h-14 rounded-lg object-cover border border-[#4A6072] shrink-0 bg-white"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11.5px] font-extrabold truncate">
                            Foto lista (JPEG)
                          </div>
                          <div className="text-[10.5px] assistant-subtext truncate">
                            {fotoFileName || 'perfil-aprobacion.jpg'}
                          </div>
                        </div>
                        <button
                          type="button"
                          id="btn-assistant-clear-photo"
                          onPointerDown={stopEventBubble}
                          onPointerUp={stopEventBubble}
                          onTouchStart={stopEventBubble}
                          onTouchEnd={stopEventBubble}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFotoDataUrl('');
                            setFotoFileName('');
                          }}
                          className="px-2 py-1 rounded-lg border border-red-400/50 bg-red-950/60 text-red-200 text-[11px] font-extrabold cursor-pointer shrink-0"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>

                  {errorB && (
                    <p className="m-0 text-[12px] font-bold text-red-300 bg-red-950/60 border border-red-400/50 rounded-xl px-3 py-2">
                      {errorB}
                    </p>
                  )}

                  <div className="text-[11px] font-semibold assistant-subtext">
                    {cleanWa
                      ? `Usa Compartir nativo con la foto o abre WhatsApp Admin (+${cleanWa}).`
                      : 'Usa Compartir nativo con el archivo de imagen o WhatsApp.'}
                  </div>

                  <button
                    type="submit"
                    id="btn-asistente-enviar-foto"
                    disabled={sending || compressing}
                    onClick={stopEventBubble}
                    onPointerDown={stopEventBubble}
                    onPointerUp={stopEventBubble}
                    onTouchStart={stopEventBubble}
                    onTouchEnd={stopEventBubble}
                    className="metal-emerald-pill w-full min-h-[44px] px-4 rounded-xl font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>
                      {sending ? 'Preparando envío...' : 'Enviar foto para aprobación'}
                    </span>
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      )}

      {!open && !travelingToCenter && activeStepGuide && (
        <aside
          id="assistant-step-guide-card"
          aria-label="Guía rápida de 3 pasos"
          onClick={stopEventBubble}
          onPointerDown={stopEventBubble}
          onPointerMove={stopEventBubble}
          onPointerUp={stopEventBubble}
          onTouchStart={stopEventBubble}
          onTouchEnd={stopEventBubble}
          className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-[9990] w-[min(calc(100vw-7.5rem),320px)] rounded-2xl border-[1.5px] border-sky-400/75 bg-[#0f172a]/95 text-slate-100 shadow-2xl p-3 select-none"
        >
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-700/80">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-sky-300">
                Guía de 3 pasos · {activeStepGuide.targetLabel}
              </div>
              <div className="text-[12.5px] font-extrabold text-white leading-tight truncate">
                {activeStepGuide.title}
              </div>
            </div>
            <button
              type="button"
              id="btn-step-guide-close"
              aria-label="Cerrar guía de 3 pasos"
              onPointerDown={stopEventBubble}
              onPointerUp={stopEventBubble}
              onTouchStart={stopEventBubble}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (e.cancelable) e.preventDefault();
                activateGhostClickShield();
                setActiveStepGuide(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                activateGhostClickShield();
                setActiveStepGuide(null);
              }}
              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-black cursor-pointer shrink-0 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <ol className="m-0 p-0 list-none flex flex-col gap-1.5">
            {activeStepGuide.steps.map((stepText, idx) => {
              const checked = Boolean(completedGuideSteps[idx]);
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onPointerDown={stopEventBubble}
                    onPointerUp={stopEventBubble}
                    onTouchStart={stopEventBubble}
                    onTouchEnd={stopEventBubble}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompletedGuideSteps((prev) => ({
                        ...prev,
                        [idx]: !prev[idx],
                      }));
                    }}
                    className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-xl border transition-colors cursor-pointer text-[11.5px] leading-snug ${
                      checked
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 line-through'
                        : 'border-slate-700/80 bg-slate-800/70 text-slate-100 hover:border-sky-400/60'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                        checked ? 'bg-emerald-500 text-slate-950' : 'bg-sky-500/30 text-sky-200'
                      }`}
                    >
                      {checked ? '✓' : idx + 1}
                    </span>
                    <span>{stepText}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      )}

      {!open &&
        !travelingToCenter &&
        !suppressAutoBubble && (gestureBanner || (tipsEnabled && activeTip)) &&
        (() => {
          const defaultOffset = viewportSize.width >= 640 ? 20 : 10;
          const bubbleLayout = computeSmartBubblePosition({
            avatarX: dragPos ? dragPos.x : Math.max(8, viewportSize.width - defaultOffset - 92),
            avatarY: dragPos ? dragPos.y : Math.max(66, viewportSize.height - defaultOffset - 92),
            avatarWidth: 92,
            avatarHeight: 92,
            viewportWidth: viewportSize.width,
            viewportHeight: viewportSize.height,
            bubbleMaxWidth: 240,
            margin: 12,
            gap: 10,
          });
          const visibleTip = tipsEnabled ? activeTip : null;
          return (
            <div
              id="floating-assistant-bubble"
              role="status"
              data-bubble-horizontal={bubbleLayout.horizontalSide}
              data-bubble-vertical={bubbleLayout.verticalSide}
              onClick={stopEventBubble}
              onPointerDown={stopEventBubble}
              onPointerMove={stopEventBubble}
              onPointerUp={stopEventBubble}
              onTouchStart={stopEventBubble}
              onTouchEnd={stopEventBubble}
              style={{
                position: 'fixed',
                left: `${bubbleLayout.left}px`,
                width: `${bubbleLayout.width}px`,
                top: bubbleLayout.top !== null ? `${bubbleLayout.top}px` : undefined,
                bottom: bubbleLayout.bottom !== null ? `${bubbleLayout.bottom}px` : undefined,
                backgroundColor: '#0f172a',
                opacity: 1,
              }}
              className="max-w-[240px] rounded-2xl text-white border-[1.5px] border-sky-400/85 p-3 shadow-2xl z-[9999] select-none"
            >
              <span
                aria-hidden="true"
                style={{
                  left: `${bubbleLayout.tailLeftPx}px`,
                  backgroundColor: '#0f172a',
                }}
                className={`absolute -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-sky-400/85 ${
                  bubbleLayout.verticalSide === 'below'
                    ? '-top-[6px] border-l-[1.5px] border-t-[1.5px]'
                    : '-bottom-[6px] border-r-[1.5px] border-b-[1.5px]'
                }`}
              />
              <div className="flex items-start justify-between gap-2">
                <p className="m-0 text-[11.5px] font-bold leading-snug text-slate-100 break-words">
                  {gestureBanner || visibleTip?.text}
                </p>
                <button
                  type="button"
                  id="btn-assistant-bubble-dismiss"
                  aria-label="Cerrar sugerencia del asistente"
                  onPointerDown={stopEventBubble}
                  onPointerUp={stopEventBubble}
                  onTouchStart={stopEventBubble}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    if (e.cancelable) e.preventDefault();
                    activateGhostClickShield();
                    setGestureBanner(null);
                    if (activeTip) {
                      setDismissedTipIds((prev) => ({
                        ...prev,
                        [activeTip.id]: true,
                      }));
                      setActiveTip(null);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    activateGhostClickShield();
                    setGestureBanner(null);
                    if (activeTip) {
                      setDismissedTipIds((prev) => ({
                        ...prev,
                        [activeTip.id]: true,
                      }));
                      setActiveTip(null);
                    }
                  }}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-black cursor-pointer shrink-0 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
              {!gestureBanner && visibleTip && (
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    id="btn-assistant-bubble-cta"
                    onPointerDown={stopEventBubble}
                    onPointerUp={stopEventBubble}
                    onTouchStart={stopEventBubble}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      if (e.cancelable) e.preventDefault();
                      activateGhostClickShield();
                      handleExecuteTipAction(visibleTip);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      activateGhostClickShield();
                      handleExecuteTipAction(visibleTip);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold cursor-pointer"
                  >
                    {visibleTip.ctaLabel}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

      {!travelingToCenter &&
        (() => {
          const currentMood: AssistantAvatarMood = isDraggingAvatar
            ? 'dragging'
            : celebrating
              ? 'celebrating'
              : dropBounceActive
                ? 'bouncing'
                : hopActive || gestureActive
                  ? 'happy'
                  : 'idle';
          const motionClass = isDraggingAvatar
            ? ''
            : celebrating
              ? 'assistant-celebrate-jump'
              : dropBounceActive
                ? 'assistant-drop-bounce'
                : gestureActive
                  ? 'assistant-gesture-once'
                  : hopActive
                    ? 'assistant-hop-once'
                    : 'assistant-idle-float';
          return (
            <div
              id="floating-assistant-shell"
              onClick={stopEventBubble}
              onPointerDown={stopEventBubble}
              onPointerMove={stopEventBubble}
              onPointerUp={stopEventBubble}
              onTouchStart={stopEventBubble}
              onTouchEnd={stopEventBubble}
              className="select-none"
              style={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                touchAction: 'none',
              }}
            >
              <button
                type="button"
                id="btn-floating-assistant"
                data-robot-style="metallic-3d-floating"
                data-avatar-id={avatarId}
                data-mood={currentMood}
                data-drag-tilt={String(dragTiltDeg)}
                data-sound-enabled={soundEnabled ? 'true' : 'false'}
                data-skin={skin}
                data-skin-variant={skinVariant}
                aria-label={
                  open
                    ? 'Cerrar Asistente Aluminero Pro'
                    : `Abrir Asistente ${avatarMeta.label} (arrastra para mover o mantén pulsado para gesto)`
                }
                aria-expanded={open}
                aria-controls="card-floating-assistant"
                onPointerDown={handleAvatarPointerDown}
                onPointerMove={handleAvatarPointerMove}
                onPointerUp={handleAvatarPointerUp}
                onTouchStart={handleAvatarTouchStart}
                onTouchMove={handleAvatarTouchMove}
                onTouchEnd={handleAvatarTouchEnd}
                onPointerCancel={(e) => {
                  e.stopPropagation();
                  if (dragRef.current?.longPressTimer != null) {
                    window.clearTimeout(dragRef.current.longPressTimer);
                  }
                  dragRef.current = null;
                  touchTapRef.current = null;
                  setIsDraggingAvatar(false);
                  setDragTiltDeg(0);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.detail === 0) {
                    handleToggleAssistant();
                  } else if (open) {
                    e.preventDefault();
                    handleCloseAssistant();
                  } else {
                    e.preventDefault();
                  }
                }}
                style={{
                  background: 'transparent',
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  filter: 'none',
                  touchAction: 'none',
                }}
                className={
                  open
                    ? 'relative w-[44px] h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 text-white bg-slate-900/90 select-none'
                    : 'relative bg-transparent border-0 p-0 m-0 w-[92px] h-[92px] overflow-visible flex items-center justify-center cursor-grab active:cursor-grabbing select-none focus:outline-none'
                }
              >
                {open ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                ) : (
                  <span
                    className={`relative w-[92px] h-[92px] overflow-visible p-0 inline-flex items-center justify-center pointer-events-none ${motionClass}`}
                    style={{
                      transform: isDraggingAvatar
                        ? `rotate(${dragTiltDeg}deg) scale(1.08)`
                        : undefined,
                      transition: isDraggingAvatar
                        ? 'transform 60ms linear'
                        : 'transform 180ms ease-out',
                    }}
                  >
                    {particlesVisible && (
                      <span
                        key={particleBurstKey}
                        id="assistant-tool-particles"
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 overflow-visible z-20"
                      >
                        {ASSISTANT_TAP_PARTICLES.map((glyph, idx) => {
                          const offsets = [
                            { x: -34, y: -32 },
                            { x: 32, y: -30 },
                            { x: -40, y: 4 },
                            { x: 38, y: 6 },
                            { x: 0, y: -44 },
                          ];
                          const pos = offsets[idx % offsets.length];
                          return (
                            <span
                              key={`${particleBurstKey}-${idx}`}
                              className="absolute left-1/2 top-1/2 text-[15px] leading-none animate-ping"
                              style={{
                                transform: `translate(${pos.x}px, ${pos.y}px)`,
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
                              }}
                            >
                              {glyph}
                            </span>
                          );
                        })}
                      </span>
                    )}
                    <AssistantCharacterSvg
                      avatarId={avatarId}
                      size={92}
                      skin={skin}
                      skinVariant={skinVariant}
                      santaHat={skin === 'navidena'}
                      gestureActive={gestureActive}
                      laserFlash={laserFlashActive || hopActive || gestureActive || celebrating}
                      mood={currentMood}
                      robotPose={robotPose}
                      withHalo={true}
                      animated={true}
                    />
                  </span>
                )}
              </button>
            </div>
          );
        })()}
    </div>
  );
};
