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
  saveSelectedAvatar,
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
  GHOST_CLICK_SHIELD_MS,
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
  CLOUD_BACKUP_PERSUASIVE_MSG,
  resolveRobotPose,
  RobotPoseMode,
} from '../utils/assistantGuideLogic';

const VISITED_VIEWS_KEY = 'aluminero_visited_views_v1';

interface ProactiveTip {
  id: string;
  text: string;
  ctaLabel: string;
  action: 'quote' | 'lev' | 'pro' | 'tutorial' | 'cloud';
}

interface ChatTurn {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  guide?: AssistantGuideResponse;
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
  onNavigateGuideTarget?: (target: AssistantGuideTarget) => void;
  onOpenLevantamiento?: () => void;
  onOpenTutorial?: () => void;
  onOpenPro?: () => void;
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
  suppressAutoBubble = false,
  onShowToast,
}) => {
  const [open, setOpen] = useState(false);
  const [travelingToCenter, setTravelingToCenter] = useState(false);
  const [morphedAtCenter, setMorphedAtCenter] = useState(false);
  const travelTimerRef = useRef<number | null>(null);
  const celebrateTimerRef = useRef<number | null>(null);
  const dropBounceTimerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [modalTab, setModalTab] = useState<'guide' | 'admin'>('guide');
  const [guideQuery, setGuideQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [activeStepGuide, setActiveStepGuide] = useState<AssistantGuideResponse | null>(null);
  const [completedGuideSteps, setCompletedGuideSteps] = useState<Record<number, boolean>>({});
  const [activeOption, setActiveOption] = useState<'A' | 'B'>('A');
  const [quotaRec, setQuotaRec] = useState(() => loadAssistantDailyQuota());

  const [avatarId, setAvatarId] = useState<AssistantAvatarId>(() => loadSelectedAvatar());
  const [manualRobotPose, setManualRobotPose] = useState<RobotPoseMode | null>(null);
  const [avatarVisible, setAvatarVisible] = useState<boolean>(() => loadAvatarVisible());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadAvatarSoundEnabled());
  const [tipsEnabled, setTipsEnabled] = useState<boolean>(() => loadAvatarTipsEnabled());
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  }));
  const [hopActive, setHopActive] = useState(false);
  const [laserFlashActive, setLaserFlashActive] = useState(false);
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
    () => ASSISTANT_CHARACTERS.find((c) => c.id === avatarId) || ASSISTANT_CHARACTERS,
    [avatarId]
  );

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, open]);

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
