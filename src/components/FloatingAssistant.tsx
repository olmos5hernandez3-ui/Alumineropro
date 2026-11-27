import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATALOGO_PERFILES,
  computeAssistantDailyQuotaState,
  FREE_ASSISTANT_DAILY_LIMIT,
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
} from './AssistantCharacters';
import {
  ASSISTANT_CELEBRATE_EVENT_NAME,
  AssistantCelebrateDetail,
  AVATAR_SOUND_EVENT_NAME,
  AVATAR_TIPS_EVENT_NAME,
  computeDragTiltDegrees,
  computeSmartBubblePosition,
  getCharacterCelebrationText,
  getCharacterQuickGreeting,
  loadAvatarSoundEnabled,
  loadAvatarTipsEnabled,
  playAssistantSound,
} from '../utils/assistantEffects';

const VISITED_VIEWS_KEY = 'aluminero_visited_views_v1';

interface ProactiveTip {
  id: string;
  text: string;
  ctaLabel: string;
  action: 'quote' | 'lev' | 'pro' | 'tutorial';
}

interface FloatingAssistantProps {
  whatsappNumber: string;
  deviceId: string;
  skin?: AppSkin;
  skinVariant?: AppSkinVariant;
  proActive?: boolean;
  currentView?: string;
  hasPendingQuote?: boolean;
  hasPendingLev?: boolean;
  partidasCount?: number;
  historialCount?: number;
  onNavigateView?: (view: 'hoja' | 'videos') => void;
  onOpenLevantamiento?: () => void;
  onOpenTutorial?: () => void;
  onOpenPro?: () => void;
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
  currentView = 'menu',
  hasPendingQuote = false,
  hasPendingLev = false,
  partidasCount = 0,
  historialCount = 0,
  onNavigateView,
  onOpenLevantamiento,
  onOpenTutorial,
  onOpenPro,
  onShowToast,
}) => {
  const [open, setOpen] = useState(false);
  const [travelingToCenter, setTravelingToCenter] = useState(false);
  const [morphedAtCenter, setMorphedAtCenter] = useState(false);
  const travelTimerRef = useRef<number | null>(null);
  const celebrateTimerRef = useRef<number | null>(null);
  const dropBounceTimerRef = useRef<number | null>(null);
  const [activeOption, setActiveOption] = useState<'A' | 'B'>('A');
  const [quotaRec, setQuotaRec] = useState(() => loadAssistantDailyQuota());

  // 7 personajes + switch de visibilidad + sonido + recordatorios sincronizados con el Menú ☰
  const [avatarId, setAvatarId] = useState<AssistantAvatarId>(() => loadSelectedAvatar());
  const [avatarVisible, setAvatarVisible] = useState<boolean>(() => loadAvatarVisible());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadAvatarSoundEnabled());
  const [tipsEnabled, setTipsEnabled] = useState<boolean>(() => loadAvatarTipsEnabled());
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  }));
  const [hopActive, setHopActive] = useState(false);
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

  // Posición libre arrastrable guardada en localStorage
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

  // Escuchar cambios de personaje, visibilidad, sonido, recordatorios y celebraciones
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

  // Celebración automática cuando el usuario agrega ventana/puerta o guarda cotización
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

  // Registrar secciones visitadas para sugerencias proactivas inteligentes
  const [unvisitedSectionNow, setUnvisitedSectionNow] = useState(false);
  useEffect(() => {
    if (!currentView || currentView === 'menu' || currentView === 'admin') {
      setUnvisitedSectionNow(false);
      return;
    }
    try {
      const raw = window.localStorage.getItem(VISITED_VIEWS_KEY);
      const visited: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      const alreadyVisited = Array.isArray(visited) && visited.includes(currentView);
      if (!alreadyVisited) {
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

  // Calcular globo proactivo contextual discreto (respetando aluminero-avatar-tips)
  const computedProactiveTip = useMemo<ProactiveTip | null>(() => {
    if (open || !avatarVisible || !tipsEnabled) return null;
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
    if (!proActive && currentView === 'menu' && !dismissedTipIds['free-unlock']) {
      return {
        id: 'free-unlock',
        text: '¡Estás a unos pasos de desbloquear tu versión gratuita!',
        ctaLabel: 'Ver cómo',
        action: 'pro',
      };
    }
    return null;
  }, [open, avatarVisible, tipsEnabled, unvisitedSectionNow, currentView, hasPendingQuote, hasPendingLev, proActive, dismissedTipIds]);

  // Mostrar globo proactivo de forma discreta tras 4.5 s (nunca invasivo)
  useEffect(() => {
    if (!tipsEnabled || !computedProactiveTip) {
      setActiveTip(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveTip(computedProactiveTip);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [computedProactiveTip, tipsEnabled]);

  // Mantener dimensiones de ventana sincronizadas y evitar que la posición arrastrada salga de pantalla
  useEffect(() => {
    const onResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setDragPos((prev) => {
        if (!prev) return null;
        const maxX = Math.max(8, window.innerWidth - 76);
        const maxY = Math.max(66, window.innerHeight - 86);
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
      if (travelTimerRef.current !== null) {
        window.clearTimeout(travelTimerRef.current);
      }
      if (celebrateTimerRef.current !== null) {
        window.clearTimeout(celebrateTimerRef.current);
      }
      if (dropBounceTimerRef.current !== null) {
        window.clearTimeout(dropBounceTimerRef.current);
      }
      if (dragRef.current?.longPressTimer != null) {
        window.clearTimeout(dragRef.current.longPressTimer);
      }
    };
  }, []);

  const handleCloseAssistant = () => {
    if (travelTimerRef.current !== null) {
      window.clearTimeout(travelTimerRef.current);
      travelTimerRef.current = null;
    }
    setTravelingToCenter(false);
    setMorphedAtCenter(false);
    setOpen(false);
  };

  const handleToggleAssistant = () => {
    if (open || travelingToCenter) {
      handleCloseAssistant();
      return;
    }
    setActiveTip(null);
    setGestureBanner(getCharacterQuickGreeting(avatarId));
    setHopActive(true);
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
    setGestureActive(true);
    setGestureBanner(avatarMeta.gestureText);
    playAssistantSound(avatarId, 'tap', soundEnabled);
    window.setTimeout(() => setGestureActive(false), 950);
    window.setTimeout(() => setGestureBanner(null), 2800);
  };

  const handleAvatarPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
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
      const maxX = Math.max(8, window.innerWidth - 76);
      const maxY = Math.max(66, window.innerHeight - 86);
      const nextX = Math.min(Math.max(8, st.originX + dx), maxX);
      const nextY = Math.min(Math.max(66, st.originY + dy), maxY);
      setDragPos({ x: nextX, y: nextY });
      const tilt = computeDragTiltDegrees(stepDx !== 0 ? stepDx : dx * 0.15, stepDy);
      setDragTiltDeg(tilt);
    }
  };

  const handleAvatarPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    if (st.longPressTimer !== null) {
      window.clearTimeout(st.longPressTimer);
    }
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
    if (!wasLongPressed) {
      handleToggleAssistant();
    }
  };

  const handleExecuteTipAction = (tip: ProactiveTip) => {
    setDismissedTipIds((prev) => ({ ...prev, [tip.id]: true }));
    setActiveTip(null);
    if (tip.action === 'quote') {
      onNavigateView?.('hoja');
    } else if (tip.action === 'lev') {
      onOpenLevantamiento?.();
    } else if (tip.action === 'pro') {
      onOpenPro?.();
    } else if (tip.action === 'tutorial') {
      if (onOpenTutorial) onOpenTutorial();
      else onNavigateView?.('videos');
    }
  };

  // Opción A — Sugerir línea o perfil
  const [sugerenciaTexto, setSugerenciaTexto] = useState('');
  const [errorA, setErrorA] = useState('');

  // Opción B — Subir foto para aprobación
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
      setErrorA(`Alcanzaste tu límite de ${quotaState.limit} consultas diarias en la Versión Gratuita. Actualiza a PRO para consultas ilimitadas.`);
      return;
    }
    const cleanText = sugerenciaTexto.trim();
    if (!cleanText) {
      setErrorA('Escribe qué marca, línea, perfil o herraje hace falta.');
      return;
    }

    setSending(true);
    setErrorA('');
    if (!proActive) {
      setQuotaRec(incrementAssistantDailyQuota());
    }

    const messageLines = [
      '*Asistente Aluminero Pro — Sugerencia*',
      `• Solicitud (marca/línea/herraje): ${cleanText}`,
      `• Equipo origen: ${deviceId}`,
    ];
    const message = messageLines.join('\n');
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
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
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
      setErrorB(`Alcanzaste tu límite de ${quotaState.limit} envíos diarios en la Versión Gratuita. Actualiza a PRO para envíos ilimitados.`);
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
    if (!proActive) {
      setQuotaRec(incrementAssistantDailyQuota());
    }

    const perfilResumen = selectedPerfil
      ? `${selectedPerfil.nombre} (${selectedPerfil.codigoRef})`
      : cleanCustom;

    const messageLines = [
      '*Asistente Aluminero Pro — Foto para aprobación*',
      `• Perfil: ${perfilResumen}`,
      ...(selectedPerfil && cleanCustom ? [`• Nombre/nota adicional: ${cleanCustom}`] : []),
      ...(selectedPerfil ? [`• Medidas catálogo: ${selectedPerfil.dimensiones}`] : []),
      `• Equipo origen: ${deviceId}`,
      ...(cleanWa ? [`• WhatsApp Admin: +52 ${cleanWa}`] : []),
      '• Solicitud: Revisar y aprobar foto para el catálogo oficial.',
    ];
    const message = messageLines.join('\n');
    const photoFile = dataUrlToJpegFile(
      fotoDataUrl,
      fotoFileName || 'perfil-aprobacion.jpg'
    );

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
          // Continúa al respaldo de WhatsApp si falla la hoja nativa
        }
      }

      // Respaldo universal: descarga la foto JPEG optimizada y abre WhatsApp del Admin con los datos del perfil
      triggerFileDownload(photoFile);
      const waUrl = waUrlDigits
        ? `https://wa.me/${waUrlDigits}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      openExternalLinkSafe(waUrl);
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

  if (!avatarVisible && !open) {
    return null;
  }

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
      style={rootPosStyle}
      className={dragPos ? 'z-40' : 'fixed bottom-2.5 right-2.5 sm:bottom-5 sm:right-5 z-40'}
    >
      {/* Escenario de desplazamiento del personaje hacia el centro */}
      {travelingToCenter && (
        <div
          id="assistant-travel-stage"
          aria-hidden="true"
          className="fixed inset-0 z-50 pointer-events-none bg-[#040c12]/45 backdrop-blur-[1.5px]"
        >
          <div
            id="assistant-traveling-robot"
            className="robot-3d-glide-center flex items-center justify-center"
          >
            <AssistantCharacterSvg
              avatarId={avatarId}
              size={74}
              skin={skin}
              skinVariant={skinVariant}
              santaHat={skin === 'navidena'}
            />
          </div>
        </div>
      )}

      {open && morphedAtCenter && (
        <div
          aria-hidden="true"
          onClick={handleCloseAssistant}
          className="fixed inset-0 z-40 bg-[#040c12]/65 backdrop-blur-[3px]"
        />
      )}

      {open && (
        <section
          id="card-floating-assistant"
          role="dialog"
          aria-label="Asistente Aluminero Pro"
          data-centered-morph={morphedAtCenter ? 'true' : 'false'}
          className={`${
            morphedAtCenter
              ? 'assistant-card-morph-center z-50 w-[calc(100vw-2rem)] max-w-[404px] max-h-[calc(100vh-5rem)]'
              : 'assistant-card-enter fixed bottom-[92px] right-4 sm:right-5 w-[calc(100vw-2rem)] max-w-[388px] max-h-[calc(100vh-7rem)]'
          } overflow-y-auto rounded-[22px] border-[1.5px] shadow-2xl p-4`}
        >
          {/* Encabezado */}
          <div className="flex items-center justify-between gap-2.5 pb-3 mb-3 border-b border-[#4A6072]/45 assistant-card-divider">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="metal-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                <AssistantCharacterSvg
                  avatarId={avatarId}
                  size={38}
                  skin={skin}
                  skinVariant={skinVariant}
                  santaHat={skin === 'navidena'}
                  mood="happy"
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
            <button
              type="button"
              id="btn-assistant-close"
              onClick={handleCloseAssistant}
              aria-label="Cerrar Asistente Aluminero Pro"
              className="min-w-[34px] min-h-[34px] rounded-xl assistant-close-btn font-extrabold text-[14px] cursor-pointer shrink-0 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Indicador de consultas diarias (Plan Gratuito vs PRO ilimitado) */}
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
                onClick={() => {
                  handleCloseAssistant();
                  onOpenPro();
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] cursor-pointer shrink-0"
              >
                Ver PRO
              </button>
            )}
          </div>

          {/* Selector de 2 opciones rápidas */}
          <div className="grid grid-cols-2 gap-2 mb-3.5" role="tablist" aria-label="Opciones del asistente">
            <button
              type="button"
              role="tab"
              aria-selected={activeOption === 'A'}
              id="btn-assistant-opt-a"
              onClick={() => {
                setActiveOption('A');
                setErrorB('');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                activeOption === 'A'
                  ? 'assistant-tab-active'
                  : 'assistant-tab-idle'
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
              onClick={() => {
                setActiveOption('B');
                setErrorA('');
              }}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                activeOption === 'B'
                  ? 'assistant-tab-active'
                  : 'assistant-tab-idle'
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

          {/* Opción A: Sugerir línea o perfil */}
          {activeOption === 'A' && (
            <form id="form-assistant-opt-a" onSubmit={handleSendOptionA} className="flex flex-col gap-2.5">
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
                  onChange={(e) => {
                    setSugerenciaTexto(e.target.value);
                    if (errorA) setErrorA('');
                  }}
                  placeholder="Ej. Marca Cuprum, Línea Eurovent Serie 70, perfil riel curvo o jaladera multipunto..."
                  className="w-full rounded-xl border border-[#4A6072] p-2.5 text-[13px] font-medium"
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
                className="metal-emerald-pill w-full min-h-[44px] px-4 rounded-xl font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{sending ? 'Abriendo envío...' : 'Enviar sugerencia al Administrador'}</span>
              </button>
            </form>
          )}

          {/* Opción B: Subir foto para aprobación del Administrador */}
          {activeOption === 'B' && (
            <form id="form-assistant-opt-b" onSubmit={handleSendOptionB} className="flex flex-col gap-2.5">
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
                  onChange={(e) => {
                    setCustomPerfilNombre(e.target.value);
                    if (errorB) setErrorB('');
                  }}
                  placeholder={
                    selectedPerfil
                      ? 'Ej. Corte visto de frente / marca específica'
                      : 'Ej. Cabezal Serie 4500 o perfil nuevo'
                  }
                  className="w-full min-h-[40px] rounded-xl border border-[#4A6072] px-3 text-[13px] font-semibold"
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
                  compact
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
                      onClick={() => {
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
                className="metal-emerald-pill w-full min-h-[44px] px-4 rounded-xl font-extrabold text-[13.5px] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{sending ? 'Preparando envío...' : 'Enviar foto para aprobación'}</span>
              </button>
            </form>
          )}
        </section>
      )}

      {/* Globo emergente inteligente (adaptado a las coordenadas x/y sin cortarse en esquinas) */}
      {!open && !travelingToCenter && (gestureBanner || (tipsEnabled && activeTip)) && (() => {
        const defaultOffset = viewportSize.width >= 640 ? 20 : 10;
        const effectiveAvatarX = dragPos ? dragPos.x : Math.max(8, viewportSize.width - defaultOffset - 72);
        const effectiveAvatarY = dragPos ? dragPos.y : Math.max(66, viewportSize.height - defaultOffset - 74);
        const bubbleLayout = computeSmartBubblePosition({
          avatarX: effectiveAvatarX,
          avatarY: effectiveAvatarY,
          avatarWidth: 72,
          avatarHeight: 74,
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
            style={{
              position: 'fixed',
              left: `${bubbleLayout.left}px`,
              width: `${bubbleLayout.width}px`,
              top: bubbleLayout.top !== null ? `${bubbleLayout.top}px` : undefined,
              bottom: bubbleLayout.bottom !== null ? `${bubbleLayout.bottom}px` : undefined,
              backgroundColor: '#0f172a',
              opacity: 1,
            }}
            className="max-w-[240px] rounded-2xl text-white border-[1.5px] border-sky-400/85 p-3 shadow-2xl z-40"
          >
            {/* Punta direccional hacia el personaje */}
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
                onClick={() => {
                  setGestureBanner(null);
                  if (activeTip) {
                    setDismissedTipIds((prev) => ({ ...prev, [activeTip.id]: true }));
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
                  onClick={() => handleExecuteTipAction(visibleTip)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold cursor-pointer"
                >
                  {visibleTip.ctaLabel}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Personaje Asistente Flotante (3D con halo azul metálico/cobre, arrastrable, reactivo y con sonido) */}
      {!travelingToCenter && (() => {
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
            style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
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
              onPointerCancel={() => {
                if (dragRef.current?.longPressTimer != null) {
                  window.clearTimeout(dragRef.current.longPressTimer);
                }
                dragRef.current = null;
                setIsDraggingAvatar(false);
                setDragTiltDeg(0);
              }}
              onClick={(e) => {
                // Evitar doble disparo cuando pointerUp ya manejó el tap/drag/long-press;
                // permitir activación por teclado (detail === 0)
                if (e.detail === 0) {
                  handleToggleAssistant();
                } else if (open) {
                  handleCloseAssistant();
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
                  ? 'relative w-[44px] h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 text-white bg-slate-900/90'
                  : 'relative bg-transparent border-0 p-0 m-0 w-[72px] h-[74px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none focus:outline-none'
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
                  className={`inline-flex items-center justify-center pointer-events-none ${motionClass}`}
                  style={{
                    transform: isDraggingAvatar
                      ? `rotate(${dragTiltDeg}deg) scale(1.08)`
                      : undefined,
                    transition: isDraggingAvatar ? 'transform 60ms linear' : 'transform 180ms ease-out',
                  }}
                >
                  <AssistantCharacterSvg
                    avatarId={avatarId}
                    size={68}
                    skin={skin}
                    skinVariant={skinVariant}
                    santaHat={skin === 'navidena'}
                    gestureActive={gestureActive}
                    mood={currentMood}
                    withHalo
                    animated
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
