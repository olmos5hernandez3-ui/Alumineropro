import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calcularCotizacion,
  calcularDespiece,
  CategoriaTrabajo,
  CloudDeviceRecord,
  computeUsageStats30d,
  FREE_TRIAL_MS,
  getDefaultRellenoFromVidrio,
  getRellenoLabel,
  getRellenoPrecioM2,
  getRellenoPriceKey,
  isFeatureProRequired,
  isProActive,
  LINEAS_CONFIG,
  LineaId,
  normalizeLineaId,
  parseNotaACotizacion,
  PartidaObra,
  PerfilCatalogoId,
  round2,
  TrabajoParams,
  UsageStats30d,
} from './utils/alumineroLogic';
import {
  CloudSyncSnapshot,
  detectDeviceLabel,
  fetchCloudDevicesState,
  subscribeCloudDevices,
  syncDeviceToCloud,
  updateDeviceLicenseInCloud,
} from './utils/cloudSync';
import {
  AdminKeyRecord,
  AlumineroBackupPayload,
  clearLegacyAdminKeys,
  compressImageToDataUrl,
  ContratoClienteInfo,
  FormulaPersonalizada,
  getOrCreateDeviceId,
  getOrInitTrialStart,
  getPerfilFotoUrl,
  HistorialItem,
  HojaState,
  HojaVidrioItem,
  LicenciaState,
  loadAdminKeys,
  loadContratoCliente,
  loadFormulas,
  loadHistorial,
  loadHoja,
  loadHojasVidrio,
  loadInventario,
  loadInventarioHerrajes,
  loadLicencia,
  loadNotas,
  loadObrasAprobadas,
  loadPerfilFotos,
  loadSobrantes,
  loadSugerenciasWhatsapp,
  loadTaller,
  loadTrabajosAntesDespues,
  NotaObra,
  ObraAprobadaApartado,
  PerfilFotosMap,
  saveAdminKeys,
  AppTheme,
  saveContratoCliente,
  saveFormulas,
  saveHistorial,
  saveHoja,
  saveHojasVidrio,
  saveInventario,
  saveInventarioHerrajes,
  saveLicencia,
  saveNotas,
  saveObrasAprobadas,
  savePerfilFotos,
  saveSobrantes,
  saveSugerenciasWhatsapp,
  saveTaller,
  saveTheme,
  saveTrabajosAntesDespues,
  loadTheme,
  SobranteItem,
  TallerConfig,
  TrabajoAntesDespuesItem,
} from './utils/storageHelpers';
import { esMaterialDireccional, PiezaVidrioInput } from './utils/glassOptimizer2D';
import { useOnlineStatus, usePWAInstall } from './utils/usePWAInstall';
import { ScreenId, SideDrawer, TopBar } from './components/TopBarAndDrawer';
import { MainMenuView } from './components/MainMenuView';
import { TrabajoView } from './components/TrabajoView';
import { HojaCotizacionView } from './components/HojaCotizacionView';
import { TallerView } from './components/TallerView';
import { InventarioView } from './components/InventarioView';
import { CatalogoView, NotasView } from './components/NotasAndCatalogoViews';
import {
  AdminAuthModal,
  AdminModal,
  FormulaModal,
  PerfilModal,
  ProModal,
  PwaInstallGuideModal,
  RecomendarModal,
  SugerenciasModal,
  TutorialModal,
} from './components/Modals';
import { FloatingAssistant } from './components/FloatingAssistant';
import { CalculadoraModal } from './components/CalculadoraModal';
import { AntesDespuesModal } from './components/AntesDespuesModal';
import { ModulacionCortesView } from './components/ModulacionCortesView';
import { VidrioOptimizerView } from './components/VidrioOptimizerView';
import { LegalDocType, LegalModal } from './components/LegalModal';

function createInitialParams(linea: LineaId = '3'): TrabajoParams {
  const cfg = LINEAS_CONFIG[linea];
  return {
    linea,
    anchoCm: cfg.categoria === 'puertas' ? 90 : 120,
    altoCm: cfg.categoria === 'puertas' ? 210 : cfg.esCancelBano ? 190 : 100,
    color: 'natural',
    vidrio: 'claro6',
    relleno: getDefaultRellenoFromVidrio('claro6'),
    hojas: 2,
    apertura: linea === 'mosq-fijo' ? 'fija' : 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: true,
    puertaEconomica: false,
    cancelEstilo: 'semilujo',
    invertido: false,
    cantidad: 1,
    tolerancias: { ...cfg.toleranciasDefault },
  };
}

export default function App() {
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());
  const [trialStartAt] = useState<number>(() => getOrInitTrialStart());
  const [licencia, setLicencia] = useState<LicenciaState | null>(() => loadLicencia());
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  const hasPaidOrManualPro = useMemo(() => isProActive(licencia, nowTs), [licencia, nowTs]);
  const trialExpiresAt = useMemo<number | null>(() => {
    if (hasPaidOrManualPro) {
      return licencia?.planCode === 'G' ? licencia.expiresAt : null;
    }
    return trialStartAt + FREE_TRIAL_MS;
  }, [hasPaidOrManualPro, licencia, trialStartAt]);
  const isTrialActive = useMemo(
    () =>
      (hasPaidOrManualPro && licencia?.planCode === 'G') ||
      (!hasPaidOrManualPro && trialExpiresAt !== null && trialExpiresAt > nowTs),
    [hasPaidOrManualPro, licencia, trialExpiresAt, nowTs]
  );
  const proActive = useMemo(
    () => hasPaidOrManualPro || (trialExpiresAt !== null && trialExpiresAt > nowTs),
    [hasPaidOrManualPro, trialExpiresAt, nowTs]
  );

  useEffect(() => {
    const nextExpiry = hasPaidOrManualPro
      ? (licencia?.expiresAt ?? null)
      : trialExpiresAt;
    if (nextExpiry === null) return;
    const delay = nextExpiry - Date.now();
    if (delay <= 0) {
      setNowTs(Date.now());
      return;
    }
    // JavaScript setTimeout máximo ~24.8 días; acotamos para evitar desbordamiento de 32 bits
    const boundedDelay = Math.min(delay + 50, 2_147_483_000);
    const timer = window.setTimeout(() => {
      setNowTs(Date.now());
    }, boundedDelay);
    return () => window.clearTimeout(timer);
  }, [hasPaidOrManualPro, licencia, trialExpiresAt, nowTs]);

  const [currentView, setCurrentView] = useState<ScreenId>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
      return 'trabajo';
    }
    return 'menu';
  });
  const [historyStack, setHistoryStack] = useState<ScreenId[]>([]);

  const [categoria, setCategoria] = useState<CategoriaTrabajo>('ventanas');
  const [params, setParams] = useState<TrabajoParams>(() => createInitialParams('3'));

  const [taller, setTaller] = useState<TallerConfig>(() => loadTaller());
  const [hoja, setHoja] = useState<HojaState>(() => loadHoja());
  const [contratoCliente, setContratoCliente] = useState<ContratoClienteInfo>(() =>
    loadContratoCliente()
  );
  const [inventario, setInventario] = useState<Record<string, number>>(() => loadInventario());
  const [inventarioHerrajes, setInventarioHerrajes] = useState<Record<string, number>>(() =>
    loadInventarioHerrajes()
  );
  const [sobrantes, setSobrantes] = useState<SobranteItem[]>(() => loadSobrantes());
  const [hojasVidrio, setHojasVidrio] = useState<HojaVidrioItem[]>(() => loadHojasVidrio());
  const [vidrioPiezasDraft, setVidrioPiezasDraft] = useState<PiezaVidrioInput[]>([]);
  const [obrasAprobadas, setObrasAprobadas] = useState<ObraAprobadaApartado[]>(() =>
    loadObrasAprobadas()
  );
  const [notas, setNotas] = useState<NotaObra[]>(() => loadNotas());
  const [historial, setHistorial] = useState<HistorialItem[]>(() => loadHistorial());
  const [formulas, setFormulas] = useState<FormulaPersonalizada[]>(() => loadFormulas());
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('std');
  const [perfilFotos, setPerfilFotos] = useState<PerfilFotosMap>(() => loadPerfilFotos());
  const [adminKeys, setAdminKeys] = useState<AdminKeyRecord[]>(() => loadAdminKeys());

  // Cotización controls in TrabajoView
  const [modoPrecio, setModoPrecio] = useState<'m2' | 'base'>('m2');
  const [precioInput, setPrecioInput] = useState<number>(
    () => taller.tarifasBase['3'] ?? LINEAS_CONFIG['3'].tarifaBaseDefault
  );
  const [cobrarMinM2, setCobrarMinM2] = useState(false);
  const [incluirIva, setIncluirIva] = useState(false);
  const [areaText, setAreaText] = useState('Sala');
  const [etiquetaPieza, setEtiquetaPieza] = useState('');
  const [extraPct, setExtraPct] = useState(0);
  const [referencia, setReferencia] = useState('');
  const [editingPartidaId, setEditingPartidaId] = useState<string | null>(null);

  // Modals & UI
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());
  const pwa = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [recomendarOpen, setRecomendarOpen] = useState(false);
  const [sugerenciasOpen, setSugerenciasOpen] = useState(false);
  const [calculadoraOpen, setCalculadoraOpen] = useState(false);
  const [antesDespuesOpen, setAntesDespuesOpen] = useState(false);
  const [trabajosAntesDespues, setTrabajosAntesDespues] = useState<TrabajoAntesDespuesItem[]>(() =>
    loadTrabajosAntesDespues()
  );
  const [sugerenciasWhatsapp, setSugerenciasWhatsapp] = useState<string>(() =>
    loadSugerenciasWhatsapp()
  );
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType>(null);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [perfilModalId, setPerfilModalId] = useState<PerfilCatalogoId | null>(null);

  const [toast, setToast] = useState<{ msg: string; topSuccess: boolean } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const logoTapsRef = useRef<{ count: number; lastTs: number }>({ count: 0, lastTs: 0 });
  const logoTapTimerRef = useRef<number | null>(null);
  const licenciaRef = useRef<LicenciaState | null>(licencia);
  licenciaRef.current = licencia;

  const [cloudDevices, setCloudDevices] = useState<CloudDeviceRecord[]>([]);
  const [cloudStats, setCloudStats] = useState<UsageStats30d>(() => computeUsageStats30d([]));
  const [cloudConnected, setCloudConnected] = useState(false);
  const [cloudRefreshing, setCloudRefreshing] = useState(false);
  const [cloudLastSyncAt, setCloudLastSyncAt] = useState<number | null>(null);

  const requestOpenAdmin = () => {
    setAdminModalOpen(false);
    setAdminAuthOpen(true);
  };

  const showToast = (msg: string, topSuccess = false) => {
    setToast({ msg, topSuccess });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  };

  const applyCloudSnapshot = (snap: CloudSyncSnapshot | null) => {
    if (!snap) return;
    setCloudDevices(snap.devices || []);
    setCloudStats(snap.stats || computeUsageStats30d(snap.devices || []));
    setCloudLastSyncAt(snap.serverTime || Date.now());

    if (Array.isArray(snap.adminKeys) && snap.adminKeys.length > 0) {
      setAdminKeys((prev) => {
        const bySig = new Map<string, AdminKeyRecord>();
        for (const k of snap.adminKeys) {
          bySig.set(`${k.deviceId}::${k.key}`, k);
        }
        for (const k of prev) {
          const sig = `${k.deviceId}::${k.key}`;
          if (!bySig.has(sig)) bySig.set(sig, k);
        }
        return Array.from(bySig.values())
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 80);
      });
    }

    const myCloudRec = (snap.devices || []).find((d) => d.deviceId === deviceId);
    if (myCloudRec) {
      const localLic = licenciaRef.current;
      const localUpdated = localLic?.activatedAt ?? 0;
      const now = Date.now();
      const cloudProValid =
        myCloudRec.proActive && (myCloudRec.expiresAt === null || myCloudRec.expiresAt > now);

      if (myCloudRec.updatedAt > localUpdated + 800) {
        if (cloudProValid && (!localLic?.active || localLic.planCode !== myCloudRec.planCode || localLic.expiresAt !== myCloudRec.expiresAt)) {
          const syncedLic: LicenciaState = {
            active: true,
            planCode: myCloudRec.planCode,
            planLabel: myCloudRec.planLabel,
            expiresAt: myCloudRec.expiresAt,
            activatedAt: myCloudRec.updatedAt,
          };
          saveLicencia(syncedLic);
          setLicencia(syncedLic);
        } else if (!cloudProValid && localLic?.active) {
          saveLicencia(null);
          setLicencia(null);
        }
      }
    }
  };

  const refreshCloudNow = async () => {
    setCloudRefreshing(true);
    try {
      const snap = await fetchCloudDevicesState();
      applyCloudSnapshot(snap);
    } finally {
      setCloudRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    clearLegacyAdminKeys();
    const label = detectDeviceLabel();
    void syncDeviceToCloud({
      deviceId,
      cliente: taller.clienteDefault,
      deviceLabel: label,
      eventType: 'open',
      minutesDelta: 1,
      licencia: licenciaRef.current,
    }).then((snap) => {
      if (active) applyCloudSnapshot(snap);
    });

    const unsub = subscribeCloudDevices(
      (snap) => {
        if (active) applyCloudSnapshot(snap);
      },
      (connected) => {
        if (active) setCloudConnected(connected);
      }
    );

    const heartbeatId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void syncDeviceToCloud({
        deviceId,
        cliente: taller.clienteDefault,
        deviceLabel: label,
        eventType: 'heartbeat',
        minutesDelta: 1,
        licencia: licenciaRef.current,
      }).then((snap) => {
        if (active) applyCloudSnapshot(snap);
      });
    }, 60_000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshCloudNow();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      unsub();
      window.clearInterval(heartbeatId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [deviceId]);

  useEffect(() => {
    saveTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    saveTaller(taller);
  }, [taller]);

  useEffect(() => {
    saveHoja(hoja);
  }, [hoja]);

  useEffect(() => {
    saveContratoCliente(contratoCliente);
  }, [contratoCliente]);

  useEffect(() => {
    saveInventario(inventario);
  }, [inventario]);

  useEffect(() => {
    saveInventarioHerrajes(inventarioHerrajes);
  }, [inventarioHerrajes]);

  useEffect(() => {
    saveSobrantes(sobrantes);
  }, [sobrantes]);

  useEffect(() => {
    saveHojasVidrio(hojasVidrio);
  }, [hojasVidrio]);

  useEffect(() => {
    saveObrasAprobadas(obrasAprobadas);
  }, [obrasAprobadas]);

  useEffect(() => {
    saveNotas(notas);
  }, [notas]);

  useEffect(() => {
    saveHistorial(historial);
  }, [historial]);

  useEffect(() => {
    saveFormulas(formulas);
  }, [formulas]);

  useEffect(() => {
    savePerfilFotos(perfilFotos);
  }, [perfilFotos]);

  useEffect(() => {
    saveAdminKeys(adminKeys);
  }, [adminKeys]);

  useEffect(() => {
    saveTrabajosAntesDespues(trabajosAntesDespues);
  }, [trabajosAntesDespues]);

  const despiece = useMemo(() => calcularDespiece(params), [params]);
  const cot = useMemo(
    () =>
      calcularCotizacion({
        linea: params.linea,
        anchoCm: params.anchoCm,
        altoCm: params.altoCm,
        color: params.color,
        vidrio: params.vidrio,
        relleno: params.relleno,
        rellenoPrecioM2: getRellenoPrecioM2(
          params.relleno,
          taller.rellenoPreciosM2,
          params.vidrio
        ),
        modoPrecio,
        precioInput,
        cantidad: params.cantidad,
        cobrarMinM2,
        incluirIva,
        extraPct,
        descDistribuidorPct: taller.descDistribuidorPct,
        precioListaTramo: taller.precioListaTramo,
        despiece,
      }),
    [
      params,
      modoPrecio,
      precioInput,
      cobrarMinM2,
      incluirIva,
      extraPct,
      taller.descDistribuidorPct,
      taller.precioListaTramo,
      taller.rellenoPreciosM2,
      despiece,
    ]
  );

  const navigateTo = (view: ScreenId) => {
    if (view !== currentView) {
      setHistoryStack((prev) => [...prev, currentView]);
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setHistoryStack((prev) => {
      if (prev.length === 0) {
        setCurrentView('menu');
        return [];
      }
      const next = [...prev];
      const last = next.pop() || 'menu';
      setCurrentView(last);
      return next;
    });
  };

  const handleSelectLinea = (lineaId: LineaId) => {
    const cfg = LINEAS_CONFIG[lineaId];
    if (cfg.pro && !proActive) {
      setProModalOpen(true);
      return;
    }
    setCategoria(cfg.categoria);
    setParams((prev) => ({
      ...prev,
      linea: lineaId,
      anchoCm:
        cfg.categoria === 'puertas' && prev.linea.startsWith('puerta')
          ? prev.anchoCm
          : cfg.categoria === 'puertas'
            ? 90
            : prev.anchoCm,
      altoCm:
        cfg.categoria === 'puertas' && prev.linea.startsWith('puerta')
          ? prev.altoCm
          : cfg.categoria === 'puertas'
            ? 210
            : cfg.esCancelBano
              ? 190
              : prev.altoCm,
      apertura:
        lineaId === 'mosq-fijo'
          ? 'fija'
          : lineaId === 'mosq-corredizo' || lineaId === 'cancel-bano'
            ? 'corrediza'
            : prev.apertura,
      tolerancias: { ...cfg.toleranciasDefault },
    }));
    const baseRate = taller.tarifasBase[lineaId] ?? cfg.tarifaBaseDefault;
    setPrecioInput(baseRate);
    setSelectedFormulaId('std');
  };

  const handleEntrarTrabajo = (cat: CategoriaTrabajo) => {
    if (cat === 'puertas' && !proActive) {
      setProModalOpen(true);
      return;
    }
    setCategoria(cat);
    const defaultLine: LineaId = cat === 'puertas' ? 'puerta-europea' : '3';
    if (LINEAS_CONFIG[params.linea].categoria !== cat) {
      const cfg = LINEAS_CONFIG[defaultLine];
      setParams(createInitialParams(defaultLine));
      setPrecioInput(taller.tarifasBase[defaultLine] ?? cfg.tarifaBaseDefault);
    }
    navigateTo('trabajo');
  };

  const handleEntrarHoja = () => {
    if (!proActive) {
      setProModalOpen(true);
      return;
    }
    navigateTo('hoja');
  };

  const handleEntrarInventario = () => {
    if (!proActive) {
      setProModalOpen(true);
      return;
    }
    navigateTo('inventario');
  };

  const handleLogoClick = () => {
    const now = Date.now();
    if (logoTapTimerRef.current) {
      window.clearTimeout(logoTapTimerRef.current);
      logoTapTimerRef.current = null;
    }

    if (now - logoTapsRef.current.lastTs <= 2000) {
      logoTapsRef.current.count += 1;
    } else {
      logoTapsRef.current.count = 1;
    }
    logoTapsRef.current.lastTs = now;

    if (logoTapsRef.current.count >= 5) {
      logoTapsRef.current = { count: 0, lastTs: 0 };
      requestOpenAdmin();
      return;
    }

    logoTapTimerRef.current = window.setTimeout(() => {
      logoTapsRef.current = { count: 0, lastTs: 0 };
      logoTapTimerRef.current = null;
    }, 2000);

    if (currentView !== 'menu') {
      navigateTo('menu');
    }
  };

  const handleAgregarObra = () => {
    const nuevaPartida: PartidaObra = {
      id: editingPartidaId || `p-${Date.now()}`,
      categoria,
      linea: params.linea,
      area: areaText.trim() || 'General',
      etiqueta: etiquetaPieza.trim(),
      anchoCm: params.anchoCm,
      altoCm: params.altoCm,
      color: params.color,
      vidrio: params.vidrio,
      relleno: params.relleno,
      hojas: params.hojas,
      apertura: params.apertura,
      sentidoPuerta: params.sentidoPuerta,
      puertaIntermedio: params.puertaIntermedio,
      puertaEconomica: params.puertaEconomica,
      cancelEstilo: params.cancelEstilo,
      invertido: params.invertido,
      cantidad: params.cantidad,
      modoPrecio,
      precioInput,
      cobrarMinM2,
      extraPct,
      totalLinea: cot.totalFinal,
      despiece,
    };

    setHoja((prev) => {
      if (editingPartidaId) {
        return {
          ...prev,
          partidas: prev.partidas.map((item) => (item.id === editingPartidaId ? nuevaPartida : item)),
        };
      }
      return { ...prev, partidas: [...prev.partidas, nuevaPartida] };
    });

    showToast(
      editingPartidaId
        ? 'Partida actualizada en Hoja de Cotización'
        : 'Pieza agregada a Hoja de Cotización',
      true
    );
    setEditingPartidaId(null);
    setEtiquetaPieza('');
  };

  const handleEditarPartida = (p: PartidaObra) => {
    const safeLinea = normalizeLineaId(p.linea);
    setCategoria(p.categoria);
    setParams({
      linea: safeLinea,
      anchoCm: p.anchoCm,
      altoCm: p.altoCm,
      color: p.color,
      vidrio: p.vidrio,
      relleno: p.relleno || getDefaultRellenoFromVidrio(p.vidrio),
      hojas: p.hojas,
      apertura: p.apertura,
      sentidoPuerta: p.sentidoPuerta,
      puertaIntermedio: p.puertaIntermedio,
      puertaEconomica: p.puertaEconomica,
      cancelEstilo: p.cancelEstilo || 'semilujo',
      invertido: p.invertido,
      cantidad: p.cantidad,
      tolerancias: { ...LINEAS_CONFIG[safeLinea].toleranciasDefault },
    });
    setModoPrecio(p.modoPrecio);
    setPrecioInput(p.precioInput);
    setCobrarMinM2(p.cobrarMinM2);
    setExtraPct(p.extraPct);
    setAreaText(p.area);
    setEtiquetaPieza(p.etiqueta);
    setEditingPartidaId(p.id);
    navigateTo('trabajo');
  };

  const handleConvertirNota = (nota: NotaObra) => {
    const parsed = parseNotaACotizacion(nota);
    if (isFeatureProRequired(parsed.linea, parsed.apertura, 1) && !proActive) {
      showToast('Esta línea o tipo de apertura detectado requiere Licencia PRO');
      setProModalOpen(true);
      return;
    }
    const cfg = LINEAS_CONFIG[parsed.linea];
    setCategoria(cfg.categoria);
    setParams((prev) => ({
      ...prev,
      linea: parsed.linea,
      apertura: parsed.apertura,
      anchoCm: parsed.anchoCm,
      altoCm: parsed.altoCm,
      color: parsed.color,
      vidrio: parsed.vidrio,
      relleno: getDefaultRellenoFromVidrio(parsed.vidrio),
      tolerancias: { ...cfg.toleranciasDefault },
    }));
    setPrecioInput(taller.tarifasBase[parsed.linea] ?? cfg.tarifaBaseDefault);
    setAreaText(parsed.area);
    setEtiquetaPieza(parsed.etiqueta);
    navigateTo('trabajo');
    showToast(`Nota convertida: ${cfg.nombre} (${parsed.apertura})`, true);
  };

  const handleUploadPerfilFoto = async (id: PerfilCatalogoId, file: File) => {
    try {
      const compressed = await compressImageToDataUrl(file, 600, 0.78);
      setPerfilFotos((prev) => ({
        ...prev,
        [id]: compressed,
        [`${params.linea}__${id}`]: compressed,
      }));
      showToast('Foto real del perfil guardada (máx. 600 px JPEG)', true);
    } catch {
      showToast('Error al comprimir o guardar la imagen');
    }
  };

  const handleRemovePerfilFoto = (id: PerfilCatalogoId) => {
    setPerfilFotos((prev) => {
      const next = { ...prev };
      delete next[id];
      for (const k of Object.keys(next)) {
        if (k.endsWith(`__${id}`)) {
          delete next[k];
        }
      }
      return next;
    });
    showToast('Foto real removida');
  };

  const handleInstallApp = async () => {
    if (pwa.isInstalled) return;
    if (pwa.canPromptNative) {
      const outcome = await pwa.install();
      if (outcome === 'accepted') {
        showToast('Aluminero Pro instalada en tu dispositivo', true);
        return;
      }
      if (outcome === 'dismissed') return;
    }
    setInstallGuideOpen(true);
  };

  const handleImportBackup = (payload: AlumineroBackupPayload) => {
    const importedPhotosCount = Object.keys(payload.perfilFotos || {}).length;
    if (importedPhotosCount > 0) {
      setPerfilFotos((prev) => ({ ...prev, ...payload.perfilFotos }));
    }
    if (Array.isArray(payload.notas) && payload.notas.length > 0) {
      setNotas((prev) => {
        const byId = new Map(prev.map((n) => [n.id, n]));
        for (const n of payload.notas!) {
          if (n && n.id) byId.set(n.id, n);
        }
        return Array.from(byId.values());
      });
    }
    if (payload.taller) {
      setTaller((prev) => ({
        ...prev,
        ...payload.taller,
        tarifasBase: { ...prev.tarifasBase, ...(payload.taller?.tarifasBase || {}) },
        rellenoPreciosM2: {
          ...(prev.rellenoPreciosM2 || {}),
          ...(payload.taller?.rellenoPreciosM2 || {}),
        },
      }));
    }
    if (Array.isArray(payload.formulas) && payload.formulas.length > 0) {
      setFormulas((prev) => {
        const byId = new Map(prev.map((f) => [f.id, f]));
        for (const f of payload.formulas!) {
          if (f && f.id) byId.set(f.id, f);
        }
        return Array.from(byId.values());
      });
    }
    if (payload.inventario) {
      setInventario((prev) => ({ ...prev, ...payload.inventario }));
    }
    if (payload.inventarioHerrajes) {
      setInventarioHerrajes((prev) => ({ ...prev, ...payload.inventarioHerrajes }));
    }
    if (Array.isArray(payload.sobrantes) && payload.sobrantes.length > 0) {
      setSobrantes((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]));
        for (const s of payload.sobrantes!) {
          if (s && s.id) byId.set(s.id, s);
        }
        return Array.from(byId.values());
      });
    }
    if (Array.isArray(payload.hojasVidrio) && payload.hojasVidrio.length > 0) {
      setHojasVidrio((prev) => {
        const byId = new Map(prev.map((hv) => [hv.id, hv]));
        for (const hv of payload.hojasVidrio!) {
          if (hv && hv.id) byId.set(hv.id, hv);
        }
        return Array.from(byId.values());
      });
    }
    if (Array.isArray(payload.obrasAprobadas) && payload.obrasAprobadas.length > 0) {
      setObrasAprobadas((prev) => {
        const byId = new Map(prev.map((o) => [o.id, o]));
        for (const o of payload.obrasAprobadas!) {
          if (o && o.id) byId.set(o.id, o);
        }
        return Array.from(byId.values());
      });
    }
    if (Array.isArray(payload.historial) && payload.historial.length > 0) {
      setHistorial((prev) => {
        const byId = new Map(prev.map((h) => [h.id, h]));
        for (const h of payload.historial!) {
          if (h && h.id) byId.set(h.id, h);
        }
        return Array.from(byId.values());
      });
    }

    if (typeof payload.sugerenciasWhatsapp === 'string') {
      const cleanWa = saveSugerenciasWhatsapp(payload.sugerenciasWhatsapp);
      setSugerenciasWhatsapp(cleanWa);
    }

    if (Array.isArray(payload.trabajosAntesDespues) && payload.trabajosAntesDespues.length > 0) {
      setTrabajosAntesDespues((prev) => {
        const byId = new Map(prev.map((t) => [t.id, t]));
        for (const t of payload.trabajosAntesDespues!) {
          if (t && t.id) byId.set(t.id, t);
        }
        return Array.from(byId.values());
      });
    }

    const notasRestored = payload.notas?.length || 0;
    showToast(
      `Respaldo importado: ${importedPhotosCount} fotos de perfiles y ${notasRestored} notas restauradas`,
      true
    );
  };

  const hojaPiezasCount = hoja.partidas.reduce((acc, p) => acc + p.cantidad, 0);
  const hojaTotalAprox = useMemo(() => {
    const sub = hoja.partidas.reduce((a, p) => a + p.totalLinea, 0);
    const desc = sub * ((hoja.descuentoPct || 0) / 100);
    const base = sub - desc;
    return hoja.incluirIva ? base * 1.16 : base;
  }, [hoja]);

  const inventarioTramosTotal = round2(
    Object.values(inventario).reduce((acc, v) => acc + (Number(v) || 0), 0)
  );
  const hojasVidrioTotalCount = hojasVidrio.reduce(
    (acc, h) => acc + Math.max(0, Number(h.cantidad) || 0),
    0
  );

  const screenTitleMap: Record<ScreenId, string> = {
    menu: 'Aluminero Pro',
    trabajo: LINEAS_CONFIG[params.linea].nombre,
    hoja: 'Hoja de Cotización',
    taller: 'Mi Taller y Precios',
    notas: 'Notas de Obra',
    modulacion: 'Modulación y Cortes',
    vidrio: 'Optimizador de Vidrio 2D',
    inventario: 'Mi Inventario de Taller',
    catalogo: 'Catálogo de Perfiles',
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        theme === 'dark' ? 'bg-[#060E1B] text-slate-100' : 'bg-[#EEF3F9] text-slate-900'
      }`}
    >
      <TopBar
        currentView={currentView}
        title={screenTitleMap[currentView]}
        proActive={proActive}
        licencia={licencia}
        trialExpiresAt={trialExpiresAt}
        theme={theme}
        onBack={goBack}
        onLogoClick={handleLogoClick}
        onOpenPro={() => setProModalOpen(true)}
        onOpenDrawer={() => setDrawerOpen(true)}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      <main className="max-w-[1120px] mx-auto px-4 pt-5 pb-24">
        {!isOnline && (
          <div
            id="offline-banner"
            role="status"
            className="mb-3 px-3.5 py-2 rounded-xl border border-amber-400/60 bg-amber-500/15 text-amber-200 text-[12px] font-bold flex items-center justify-between gap-2"
          >
            <span>Modo sin internet activo · Tus cálculos, inventario y fotos locales siguen funcionando.</span>
          </div>
        )}

        {currentView === 'menu' && (
          <MainMenuView
            proActive={proActive}
            hojaPiezasCount={hojaPiezasCount}
            hojaTotal={hojaTotalAprox}
            inventarioTramosTotal={inventarioTramosTotal}
            hojasVidrioCount={hojasVidrioTotalCount}
            notasCount={notas.length}
            onEntrarTrabajo={handleEntrarTrabajo}
            onEntrarHoja={handleEntrarHoja}
            onEntrarInventario={handleEntrarInventario}
            onGoToView={navigateTo}
            onOpenAntesDespues={() => setAntesDespuesOpen(true)}
          />
        )}

        {currentView === 'trabajo' && (
          <TrabajoView
            categoria={categoria}
            params={params}
            despiece={despiece}
            cot={cot}
            modoPrecio={modoPrecio}
            precioInput={precioInput}
            cobrarMinM2={cobrarMinM2}
            incluirIva={incluirIva}
            areaText={areaText}
            etiquetaPieza={etiquetaPieza}
            extraPct={extraPct}
            referencia={referencia}
            proActive={proActive}
            hojaCount={hojaPiezasCount}
            editingPartidaId={editingPartidaId}
            taller={taller}
            formulas={formulas}
            selectedFormulaId={selectedFormulaId}
            perfilFotos={perfilFotos}
            onChangeParams={(patch) => setParams((prev) => ({ ...prev, ...patch }))}
            onSelectLinea={handleSelectLinea}
            onChangeModoPrecio={setModoPrecio}
            onChangePrecioInput={setPrecioInput}
            onChangeCobrarMinM2={setCobrarMinM2}
            onChangeIncluirIva={setIncluirIva}
            onChangeAreaText={setAreaText}
            onChangeEtiquetaPieza={setEtiquetaPieza}
            onChangeExtraPct={setExtraPct}
            onChangeReferencia={setReferencia}
            onAgregarObra={handleAgregarObra}
            onCancelarEdicion={() => setEditingPartidaId(null)}
            onGuardarHistorial={() => {
              const ref =
                referencia.trim() || `${LINEAS_CONFIG[params.linea].nombre} ${params.anchoCm}×${params.altoCm}`;
              setHistorial((prev) => [
                {
                  id: `h-${Date.now()}`,
                  referencia: ref,
                  fecha: new Date().toLocaleDateString('es-MX'),
                  linea: params.linea,
                  anchoCm: params.anchoCm,
                  altoCm: params.altoCm,
                  color: params.color,
                  cantidad: params.cantidad,
                  total: cot.totalFinal,
                },
                ...prev,
              ]);
              setReferencia('');
              showToast('Cotización guardada en historial', true);
            }}
            onGoHoja={handleEntrarHoja}
            onOpenPro={() => setProModalOpen(true)}
            onOpenPerfilModal={(id) => setPerfilModalId(id)}
            onOpenFormulaModal={() => setFormulaModalOpen(true)}
            onSelectFormulaId={setSelectedFormulaId}
            onUpdateRellenoPrecioM2={(materialId, espesorMm, price) => {
              const key = getRellenoPriceKey(materialId, espesorMm);
              setTaller((prev) => ({
                ...prev,
                rellenoPreciosM2: {
                  ...(prev.rellenoPreciosM2 || {}),
                  [key]: price,
                },
              }));
              showToast('Precio m² del panel actualizado', true);
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'hoja' && (
          <HojaCotizacionView
            hoja={hoja}
            taller={taller}
            contratoCliente={contratoCliente}
            inventario={inventario}
            sobrantes={sobrantes}
            obrasAprobadas={obrasAprobadas}
            perfilFotos={perfilFotos}
            onUpdateHoja={(patch) => setHoja((prev) => ({ ...prev, ...patch }))}
            onUpdateContratoCliente={(patch) =>
              setContratoCliente((prev) => ({ ...prev, ...patch }))
            }
            onEditarPartida={handleEditarPartida}
            onEliminarPartida={(id) =>
              setHoja((prev) => ({ ...prev, partidas: prev.partidas.filter((p) => p.id !== id) }))
            }
            onVaciarHoja={() => setHoja((prev) => ({ ...prev, partidas: [] }))}
            onAgregarPieza={() => handleEntrarTrabajo('ventanas')}
            onApartarStockObra={(rows) => {
              const nombreObra = hoja.proyecto.trim() || `Obra ${new Date().toLocaleDateString('es-MX')}`;
              const nuevos: ObraAprobadaApartado[] = rows.map((r) => ({
                id: `apr-${Date.now()}-${r.key}`,
                proyecto: nombreObra,
                key: r.key,
                linea: r.linea,
                perfilId: r.perfilId,
                color: r.color,
                tramos: r.tramosRequeridos,
                fecha: new Date().toLocaleDateString('es-MX'),
              }));
              setObrasAprobadas((prev) => [...prev, ...nuevos]);
              showToast(`Stock apartado para "${nombreObra}"`, true);
            }}
            onDescontarInventarioObra={(rows) => {
              setInventario((prev) => {
                const next = { ...prev };
                for (const r of rows) {
                  next[r.key] = Math.max(0, round2((next[r.key] || 0) - r.tramosRequeridos));
                }
                return next;
              });
              showToast('Material descontado de tu inventario', true);
            }}
            onOpenGlassOptimizer={() => {
              const imported: PiezaVidrioInput[] = [];
              for (const part of hoja.partidas) {
                const partQty = Math.max(1, Number(part.cantidad) || 1);
                const fallbackTipo = part.relleno
                  ? getRellenoLabel(part.relleno, part.vidrio)
                  : undefined;
                for (const vid of part.despiece?.vidrios || []) {
                  if (vid.tipo !== 'vidrio') continue;
                  const tipoFinal = vid.espesorLabel || fallbackTipo || 'Claro 6 mm';
                  imported.push({
                    id: `v-hoja-${part.id}-${imported.length}`,
                    etiqueta: part.etiqueta || part.area || 'Pieza',
                    tipoNombre: tipoFinal,
                    anchoCm: vid.anchoCm,
                    altoCm: vid.altoCm,
                    cantidad: Math.max(1, vid.pzas * partQty),
                    permitirRotacion:
                      typeof vid.permitirRotacion === 'boolean'
                        ? vid.permitirRotacion
                        : !esMaterialDireccional(tipoFinal),
                  });
                }
              }
              if (imported.length > 0) {
                setVidrioPiezasDraft(imported);
              }
              navigateTo('vidrio');
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'taller' && (
          <TallerView
            taller={taller}
            proActive={proActive}
            formulas={formulas}
            historial={historial}
            onUpdateTaller={(patch) => setTaller((prev) => ({ ...prev, ...patch }))}
            onRestablecerTarifas={() => {
              setTaller((prev) => ({ ...prev, tarifasBase: {} }));
              showToast('Tarifas restablecidas');
            }}
            onOpenPro={() => setProModalOpen(true)}
            onEntrarInventario={handleEntrarInventario}
            onOpenFormulaModal={() => setFormulaModalOpen(true)}
            onEliminarFormula={(id) => setFormulas((prev) => prev.filter((f) => f.id !== id))}
            onEliminarHistorial={(id) => setHistorial((prev) => prev.filter((h) => h.id !== id))}
            onLimpiarHistorial={() => setHistorial([])}
            onShowToast={showToast}
          />
        )}

        {currentView === 'inventario' && (
          <InventarioView
            inventario={inventario}
            inventarioHerrajes={inventarioHerrajes}
            sobrantes={sobrantes}
            hojasVidrio={hojasVidrio}
            obrasAprobadas={obrasAprobadas}
            hojaCount={hojaPiezasCount}
            perfilFotos={perfilFotos}
            onSetInventario={(key, tramos) => setInventario((prev) => ({ ...prev, [key]: tramos }))}
            onSetInventarioHerraje={(id, qty) =>
              setInventarioHerrajes((prev) => ({ ...prev, [id]: qty }))
            }
            onAddSobrante={(item) => {
              setSobrantes((prev) => [
                {
                  ...item,
                  id: `sob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  fecha: new Date().toLocaleDateString('es-MX'),
                },
                ...prev,
              ]);
              showToast(`Sobrante de ${item.largoM.toFixed(2)} m agregado`, true);
            }}
            onUpdateSobranteQty={(id, cantidad) =>
              setSobrantes((prev) =>
                prev.map((s) => (s.id === id ? { ...s, cantidad: Math.max(1, cantidad) } : s))
              )
            }
            onDeleteSobrante={(id) => {
              setSobrantes((prev) => prev.filter((s) => s.id !== id));
              showToast('Sobrante eliminado');
            }}
            onAddHojaVidrio={(item) => {
              setHojasVidrio((prev) => [
                {
                  ...item,
                  id: `hv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  fecha: new Date().toLocaleDateString('es-MX'),
                },
                ...prev,
              ]);
              showToast(`Hoja ${item.tipoNombre} (${item.anchoCm}×${item.altoCm} cm) agregada`, true);
            }}
            onUpdateHojaVidrioQty={(id, cantidad) =>
              setHojasVidrio((prev) =>
                prev.map((h) => (h.id === id ? { ...h, cantidad: Math.max(1, cantidad) } : h))
              )
            }
            onDeleteHojaVidrio={(id) => {
              setHojasVidrio((prev) => prev.filter((h) => h.id !== id));
              showToast('Hoja de vidrio eliminada');
            }}
            onLimpiarInventario={() => {
              setInventario({});
              showToast('Inventario puesto en 0');
            }}
            onAgregarApartado={(item) => {
              setObrasAprobadas((prev) => [
                ...prev,
                { ...item, id: `apr-${Date.now()}`, fecha: new Date().toLocaleDateString('es-MX') },
              ]);
              showToast('Tramos apartados en obra aprobada', true);
            }}
            onEliminarApartado={(id) => setObrasAprobadas((prev) => prev.filter((o) => o.id !== id))}
            onGoCatalogo={() => navigateTo('catalogo')}
            onGoHoja={handleEntrarHoja}
            onGoVidrioOptimizer={() => navigateTo('vidrio')}
            onOpenPerfilModal={(id) => setPerfilModalId(id)}
            onShowToast={showToast}
          />
        )}

        {currentView === 'notas' && (
          <NotasView
            notas={notas}
            onAddNota={(n) =>
              setNotas((prev) => [
                { ...n, id: `nota-${Date.now()}`, fecha: new Date().toLocaleString('es-MX') },
                ...prev,
              ])
            }
            onDeleteNota={(id) => setNotas((prev) => prev.filter((n) => n.id !== id))}
            onConvertirNota={handleConvertirNota}
            onShowToast={showToast}
          />
        )}

        {currentView === 'modulacion' && (
          <ModulacionCortesView
            tarifasBase={taller.tarifasBase}
            proActive={proActive}
            sobrantes={sobrantes}
            onAddSobrante={(item) => {
              setSobrantes((prev) => [
                {
                  ...item,
                  id: `sob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  fecha: new Date().toLocaleDateString('es-MX'),
                },
                ...prev,
              ]);
            }}
            onSendToHoja={(partida, goToHoja) => {
              setHoja((prev) => ({
                ...prev,
                partidas: [...prev.partidas, partida],
              }));
              if (goToHoja) {
                navigateTo('hoja');
              }
            }}
            onSendVidriosToOptimizer={(vidrios) => {
              const piezas: PiezaVidrioInput[] = vidrios
                .filter((v) => v.tipo === 'vidrio')
                .map((v, idx) => {
                  const tipoFinal = v.espesorLabel || 'Claro 6 mm';
                  return {
                    id: `v-mod-${Date.now()}-${idx}`,
                    etiqueta: v.nombre,
                    tipoNombre: tipoFinal,
                    anchoCm: v.anchoCm,
                    altoCm: v.altoCm,
                    cantidad: v.pzas,
                    permitirRotacion:
                      typeof v.permitirRotacion === 'boolean'
                        ? v.permitirRotacion
                        : !esMaterialDireccional(tipoFinal),
                  };
                });
              if (piezas.length > 0) {
                setVidrioPiezasDraft(piezas);
              }
              navigateTo('vidrio');
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'vidrio' && (
          <VidrioOptimizerView
            hojasVidrio={hojasVidrio}
            hojaPartidas={hoja.partidas}
            piezasIniciales={vidrioPiezasDraft}
            onGoInventarioVidrios={() => navigateTo('inventario')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'catalogo' && (
          <CatalogoView
            perfilFotos={perfilFotos}
            onOpenPerfilModal={(id) => setPerfilModalId(id)}
            onUploadPerfilFoto={handleUploadPerfilFoto}
            onRemovePerfilFoto={handleRemovePerfilFoto}
            onOpenSugerencias={() => setSugerenciasOpen(true)}
          />
        )}
      </main>

      <SideDrawer
        open={drawerOpen}
        proActive={proActive}
        isTrialActive={isTrialActive}
        deviceId={deviceId}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onClose={() => setDrawerOpen(false)}
        onOpenPro={() => setProModalOpen(true)}
        onOpenRecomendar={() => setRecomendarOpen(true)}
        onOpenSugerencias={() => setSugerenciasOpen(true)}
        onOpenCalculadora={() => setCalculadoraOpen(true)}
        onOpenTutorial={() => setTutorialOpen(true)}
        onOpenLegal={(doc) => setLegalDoc(doc)}
        showInstallApp={!pwa.isInstalled}
        onInstallApp={() => void handleInstallApp()}
      />

      <ProModal
        open={proModalOpen}
        deviceId={deviceId}
        licencia={licencia}
        proActive={proActive}
        trialExpiresAt={trialExpiresAt}
        onClose={() => setProModalOpen(false)}
        onActivateLic={(lic) => {
          saveLicencia(lic);
          setLicencia(lic);
          void syncDeviceToCloud({
            deviceId,
            cliente: taller.clienteDefault,
            deviceLabel: detectDeviceLabel(),
            eventType: 'license_sync',
            licencia: lic,
          }).then(applyCloudSnapshot);
        }}
        onDeactivateLic={() => {
          saveLicencia(null);
          setLicencia(null);
          void syncDeviceToCloud({
            deviceId,
            cliente: taller.clienteDefault,
            deviceLabel: detectDeviceLabel(),
            eventType: 'license_sync',
            licencia: null,
          }).then(applyCloudSnapshot);
          showToast('Licencia desactivada');
        }}
        onShowToast={showToast}
      />

      <AdminAuthModal
        open={adminAuthOpen}
        onClose={() => setAdminAuthOpen(false)}
        onSuccess={() => {
          setAdminAuthOpen(false);
          setAdminModalOpen(true);
        }}
      />

      <AdminModal
        open={adminModalOpen}
        deviceId={deviceId}
        adminKeys={adminKeys}
        formulas={formulas}
        backupData={{
          app: 'Aluminero Pro',
          version: 1,
          exportedAt: new Date().toISOString(),
          perfilFotos,
          notas,
          taller,
          formulas,
          inventario,
          inventarioHerrajes,
          sobrantes,
          hojasVidrio,
          obrasAprobadas,
          historial,
          sugerenciasWhatsapp,
          trabajosAntesDespues,
        }}
        cloudDevices={cloudDevices}
        cloudStats={cloudStats}
        cloudConnected={cloudConnected}
        cloudRefreshing={cloudRefreshing}
        cloudLastSyncAt={cloudLastSyncAt}
        onRefreshCloud={refreshCloudNow}
        onCloudActivateDevice={async (payload) => {
          const snap = await updateDeviceLicenseInCloud(payload);
          applyCloudSnapshot(snap);
        }}
        onClose={() => setAdminModalOpen(false)}
        onActivateLic={(lic) => {
          saveLicencia(lic);
          setLicencia(lic);
        }}
        onRecordAdminKey={(rec) => setAdminKeys((prev) => [rec, ...prev])}
        onImportFormulas={(imported) => {
          setFormulas((prev) => {
            const byId = new Map(prev.map((f) => [f.id, f]));
            for (const f of imported) {
              byId.set(f.id, f);
            }
            const next = Array.from(byId.values());
            saveFormulas(next);
            return next;
          });
        }}
        onImportBackup={handleImportBackup}
        sugerenciasWhatsapp={sugerenciasWhatsapp}
        onSaveSugerenciasWhatsapp={(phone) => {
          const clean = saveSugerenciasWhatsapp(phone);
          setSugerenciasWhatsapp(clean);
        }}
        trabajosAntesDespues={trabajosAntesDespues}
        onPublishTrabajoAprobado={(item) => {
          setTrabajosAntesDespues((prev) => [
            {
              ...item,
              id: `ad-${Date.now()}`,
              fecha: new Date().toLocaleDateString('es-MX'),
              aprobado: true,
            },
            ...prev,
          ]);
        }}
        onDeleteTrabajoAprobado={(id) => {
          setTrabajosAntesDespues((prev) => prev.filter((t) => t.id !== id));
          showToast('Trabajo eliminado de la galería');
        }}
        onShowToast={showToast}
      />

      <RecomendarModal
        open={recomendarOpen}
        onClose={() => setRecomendarOpen(false)}
        onShowToast={showToast}
      />

      <SugerenciasModal
        open={sugerenciasOpen}
        whatsappNumber={sugerenciasWhatsapp}
        deviceId={deviceId}
        onClose={() => setSugerenciasOpen(false)}
        onShowToast={showToast}
      />

      <CalculadoraModal
        open={calculadoraOpen}
        onClose={() => setCalculadoraOpen(false)}
        onShowToast={showToast}
      />

      <AntesDespuesModal
        open={antesDespuesOpen}
        trabajos={trabajosAntesDespues}
        whatsappNumber={sugerenciasWhatsapp}
        deviceId={deviceId}
        onSavePersonalTrabajo={(item) => {
          setTrabajosAntesDespues((prev) => [
            {
              ...item,
              id: `ad-per-${Date.now()}`,
              fecha: new Date().toLocaleDateString('es-MX'),
              aprobado: true,
              esPersonal: true,
            },
            ...prev,
          ]);
          showToast('Trabajo guardado en tu galería personal (sin internet)', true);
        }}
        onDeletePersonalTrabajo={(id) => {
          setTrabajosAntesDespues((prev) => prev.filter((t) => t.id !== id));
          showToast('Trabajo eliminado de tu galería');
        }}
        onClose={() => setAntesDespuesOpen(false)}
        onShowToast={showToast}
      />

      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

      <LegalModal
        docType={legalDoc}
        onClose={() => setLegalDoc(null)}
        onSwitchDoc={(next) => setLegalDoc(next)}
      />

      <PwaInstallGuideModal
        open={installGuideOpen}
        isIOS={pwa.isIOS}
        onClose={() => setInstallGuideOpen(false)}
      />

      <FormulaModal
        open={formulaModalOpen}
        linea={params.linea}
        tolerancias={params.tolerancias}
        formulas={formulas}
        onClose={() => setFormulaModalOpen(false)}
        onSaveFormula={(nombre, linea, tolerancias) => {
          const newId = `f-${Date.now()}`;
          setFormulas((prev) => [...prev, { id: newId, nombre, linea, tolerancias }]);
          setSelectedFormulaId(newId);
          setParams((prev) => ({ ...prev, tolerancias: { ...tolerancias } }));
          showToast('Fórmula personalizada guardada', true);
        }}
        onApplyFormula={(f) => {
          setSelectedFormulaId(f.id);
          setParams((prev) => ({ ...prev, tolerancias: { ...f.tolerancias } }));
          showToast(`Fórmula "${f.nombre}" aplicada`, true);
        }}
        onDeleteFormula={(id) => {
          setFormulas((prev) => prev.filter((f) => f.id !== id));
          if (selectedFormulaId === id) {
            setSelectedFormulaId('std');
            setParams((prev) => ({
              ...prev,
              tolerancias: { ...LINEAS_CONFIG[prev.linea].toleranciasDefault },
            }));
          }
          showToast('Fórmula eliminada');
        }}
      />

      <PerfilModal
        perfilId={perfilModalId}
        fotoRealUrl={perfilModalId ? getPerfilFotoUrl(perfilFotos, perfilModalId, params.linea) : undefined}
        onClose={() => setPerfilModalId(null)}
        onUploadFoto={handleUploadPerfilFoto}
        onRemoveFoto={handleRemovePerfilFoto}
      />

      <FloatingAssistant
        whatsappNumber={sugerenciasWhatsapp}
        deviceId={deviceId}
        onShowToast={showToast}
      />

      {toast && (
        <div
          role="status"
          className={`pointer-events-none fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-[13.5px] font-bold shadow-2xl max-w-[90vw] text-center ${
            toast.topSuccess
              ? 'top-[70px] bg-gradient-to-br from-green-600 to-green-700 text-white border border-green-300 toast-slide-down'
              : 'bottom-5 bg-slate-900 text-white border border-slate-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
