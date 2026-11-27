import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLANS,
  CATALOGO_PERFILES,
  HERRAJES_INVENTARIO_CATALOGO,
  calcularDespiece,
  calcularCotizacion,
  generateActivationKey,
  validateActivationKey,
  isProActive,
  FREE_TRIAL_MS,
  getTrialCountdown,
  isFeatureProRequired,
  getOfficialShareUrl,
  consolidarMaterialesObra,
  parseNotaACotizacion,
  LINEAS_CONFIG,
  normalizeLineaId,
  ADMIN_ACCESS_PASSWORD,
  ADMIN_RECOVERY_PIN,
  verifyAdminPassword,
  verifyRecoveryPin,
  computeUsageStats30d,
  buildDailyUsageSeries30d,
  formatCountdownTimer,
  isEligibleForCloudBackup,
  normalizeDeviceIdInput,
  formatActivationKeyInput,
  validatePiezaDimensiones,
  validateRealisticOpeningDimensions,
  generateRandomMxPhonePlaceholder,
  MEXICO_ALUMINUM_CATEGORIES,
  MEXICO_ALUMINUM_SYSTEMS,
  isOneYearProPlan,
  computeSalesAnalytics,
  validateLevantamientoRequiredFields,
  filterAdminRecordsByResetBaseline,
  VIDRIOS_CONFIG,
  LEV_MIN_CM,
  LEV_MAX_CM,
  validateLevantamientoStrictRange,
  isTallerOnboardingComplete,
  GUIDED_TUTORIAL_STEPS,
  parseTutorialVideoUrl,
  TUTORIAL_VIDEO_CATEGORIES,
  FREE_ASSISTANT_DAILY_LIMIT,
  computeAssistantDailyQuotaState,
  parseReferralFromSearch,
  type AperturaVentanaId,
} from './alumineroLogic';
import {
  MODULACION_MODELOS,
  MODULACION_SERIES,
  MODULACION_SUBLINEAS,
  calcularModulacionCortes,
  buildPartidaFromModulacion,
  optimizarTramos1D,
  aggregateModulacionJobs,
} from './modulacionLogic';
import { optimizarVidrio2D } from './glassOptimizer2D';
import {
  DEFAULT_CONTRATO_CLAUSES,
  DEFAULT_CONTRATO_CLIENTE,
  DEFAULT_PDF_HEADER,
  DEFAULT_TALLER,
  filterCotizacionesByEstado,
  formatContratoFolio,
  formatCotizacionFolio,
  formatWhatsappUrlDigits,
  getSavedCurrentCotizacionFolio,
  issueNextCotizacionFolio,
  KEYS,
  loadClientes,
  loadCotizacionReminders,
  loadCotizacionesGuardadas,
  loadSugerenciasWhatsapp,
  loadTaller,
  peekNextCotizacionFolio,
  recordCotizacionGuardada,
  sanitizeWhatsappNumber,
  saveCotizacionReminders,
  saveSugerenciasWhatsapp,
  saveSugerenciasWhatsappValidated,
  saveTaller,
  updateCotizacionEstado,
  upsertCliente,
  validateWhatsappNumber,
} from './storageHelpers';
import {
  buildHistorialPdfReport,
  buildPdfHeaderSpec,
  clampLogoZoomPct,
  computePdfLogoMetrics,
  normalizeLogoAlign,
  PDF_HEADER_THEMES,
  resolvePdfHeaderConfig,
} from './pdfHeaderUtils';
import {
  buildLevantamientoWhatsappText,
  LEV_COLOR_VIDRIO_OPTS,
  LEV_KEYS,
  LEV_TIPOS,
  mergeLevantamientosBackup,
  normalizeLevantamientoDraft,
  resolveLineaFromLevantamiento,
} from './levantamientoLogic';
import {
  computeCorredizaLeafTranslateX,
  computeSimProgressFromElapsed,
  SIM_CLOSE_MS,
  SIM_CYCLE_MS,
  SIM_OPEN_MS,
  SIM_PAUSE_OPEN_MS,
} from './blueprintMotion';
import {
  clearHistoryOverlayStack,
  consumeTopHistoryOverlay,
  getHistoryOverlayDepth,
  pushHistoryOverlay,
  removeHistoryOverlay,
} from './historyOverlayStack';
import {
  buildQuoteReminderNotificationPayload,
  computeReminderDueAt,
  createCotizacionReminder,
  formatReminderRelativeTime,
  getDueCotizacionReminders,
  getPushPermissionGuide,
  markReminderNotified,
  parseSwPushPayload,
  partitionCotizacionReminders,
  requestPushNotificationPermission,
  snoozeCotizacionReminder,
  updateCotizacionReminderStatus,
} from './pushReminders';

test('1. Puerta Línea Europea solicita exactamente 6 escuadras por puerta (4 hoja 45° + 2 marco sup.)', () => {
  const despiece1 = calcularDespiece({
    linea: 'puerta-europea',
    anchoCm: 90,
    altoCm: 210,
    color: 'negro',
    vidrio: 'claro6',
    hojas: 1,
    apertura: 'abatible',
    sentidoPuerta: 'izq',
    puertaIntermedio: true,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['puerta-europea'].toleranciasDefault,
  });

  assert.equal(despiece1.escuadrasCount, 6);
  const esc = despiece1.herrajes.find((h) => h.nombre.toLowerCase().includes('escuadra'));
  assert.ok(esc, 'Debe incluir fila de escuadras');
  assert.equal(esc.cantidad, 6);
  assert.match(esc.detalle, /4 para la hoja a 45° \+ 2 para esquinas superiores del marco/);

  const despiece3 = calcularDespiece({
    linea: 'puerta-europea',
    anchoCm: 90,
    altoCm: 210,
    color: 'negro',
    vidrio: 'claro6',
    hojas: 1,
    apertura: 'abatible',
    sentidoPuerta: 'der',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 3,
    tolerancias: LINEAS_CONFIG['puerta-europea'].toleranciasDefault,
  });
  assert.equal(despiece3.escuadrasCount, 18);
});

test('2. Base de datos de perfiles Alumer incluye Fijo 3", Corrediza 3", Puerta Batiente y Cancel para Baño', () => {
  const byId = new Map(CATALOGO_PERFILES.map((p) => [p.id, p]));

  // Fijo 3"
  for (const id of [
    'alumer_9135',
    'alumer_9112',
    'alumer_9136',
    'alumer_10235',
    'alumer_10237',
    'alumer_7316',
    'alumer_9114',
    'alumer_7315',
    'alumer_9115',
  ] as const) {
    assert.ok(byId.get(id), `Falta perfil Fijo 3": ${id}`);
  }
  assert.match(byId.get('alumer_9135')!.dimensiones, /76\.20 × 44\.45 mm/);
  assert.match(byId.get('alumer_9112')!.dimensiones, /32\.11 × 19\.05 mm/);
  assert.match(byId.get('alumer_9115')!.dimensiones, /76\.20 × 76\.20 mm/);

  // Corrediza 3"
  for (const id of [
    'jamba',
    'riel',
    'cabecero',
    'traslape',
    'cerco',
    'zoclo2v',
    'cabezal',
    'alumer_9382',
    'alumer_9382c',
    'alumer_7828',
  ] as const) {
    assert.ok(byId.get(id), `Falta perfil Corrediza 3": ${id}`);
  }
  assert.match(byId.get('alumer_9382c')!.nombre, /9382 C/);
  assert.match(byId.get('alumer_7828')!.nombre, /7828/);

  // Puerta Batiente
  for (const id of [
    'alumer_9207',
    'alumer_9204',
    'alumer_5844',
    'alumer_5060',
    'alumer_9183',
    'alumer_9187',
    'alumer_8550',
    'alumer_6370',
    'alumer_9184',
    'alumer_12756',
    'alumer_11032',
  ] as const) {
    assert.ok(byId.get(id), `Falta perfil Puerta Batiente: ${id}`);
  }
  assert.match(byId.get('alumer_9187')!.dimensiones, /42\.42 × 78\.99 mm/);
  assert.match(byId.get('alumer_12756')!.dimensiones, /56\.54 × 25\.40 mm/);

  // Cancel para Baño
  for (const id of [
    'alumer_11174',
    'alumer_11386',
    'alumer_11387',
    'alumer_11035',
    'alumer_11046',
    'alumer_11173',
  ] as const) {
    assert.ok(byId.get(id), `Falta perfil Cancel Baño: ${id}`);
  }
  assert.match(byId.get('alumer_11174')!.dimensiones, /42\.09 × 50\.80 mm/);
  assert.match(byId.get('alumer_11173')!.dimensiones, /15\.87 × 50\.80 mm/);
});

test('3. Los 7 tipos de apertura de ventana y Cancel para Baño calculan su despiece y respetan regla PRO', () => {
  // Regla PRO: solo 1a pieza de Corrediza en Línea 3" es gratuita
  assert.equal(isFeatureProRequired('3', 'corrediza', 1), false);
  assert.equal(isFeatureProRequired('3', 'corrediza', 2), true);
  assert.equal(isFeatureProRequired('2', 'corrediza', 1), true);
  assert.equal(isFeatureProRequired('cancel-bano', 'corrediza', 1), true);

  const nuevasAperturas: AperturaVentanaId[] = [
    'fija',
    'guillotina',
    'abatible',
    'banderola',
    'oscilobatiente',
    'plegable',
  ];

  for (const ap of nuevasAperturas) {
    assert.equal(isFeatureProRequired('3', ap, 1), true, `${ap} debe requerir licencia PRO`);
    const d = calcularDespiece({
      linea: '3',
      anchoCm: 140,
      altoCm: 120,
      color: 'blanco',
      vidrio: 'filtrasol6',
      hojas: ap === 'plegable' ? 3 : 2,
      apertura: ap,
      sentidoPuerta: 'izq',
      puertaIntermedio: false,
      puertaEconomica: false,
      invertido: false,
      cantidad: 1,
      tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
    });
    assert.ok(d.perfiles.length >= 2, `${ap} debe generar cortes de perfiles`);
    assert.ok(d.vidrios.length >= 1, `${ap} debe generar cálculo de vidrio`);
    assert.ok(d.herrajes.length >= 1, `${ap} debe generar lista de herrajes`);

    if (ap === 'fija') {
      assert.ok(d.perfiles.some((p) => p.perfilId === 'alumer_9135'), 'Fija debe usar Bolsa 9135');
      assert.ok(d.perfiles.some((p) => p.perfilId === 'alumer_9112'), 'Fija debe usar Junquillo 9112');
    }
    if (ap === 'guillotina') {
      assert.ok(d.herrajes.some((h) => h.nombre.toLowerCase().includes('balance')));
    }
    if (ap === 'banderola') {
      assert.ok(d.herrajes.some((h) => h.nombre.toLowerCase().includes('proyectante')));
    }
    if (ap === 'oscilobatiente') {
      assert.ok(d.herrajes.some((h) => h.nombre.toLowerCase().includes('oscilobatiente')));
    }
    if (ap === 'plegable') {
      assert.ok(d.herrajes.some((h) => h.nombre.toLowerCase().includes('plegable')));
    }
  }

  // Cancel para Baño con estilo lujo
  const cancel = calcularDespiece({
    linea: 'cancel-bano',
    anchoCm: 150,
    altoCm: 190,
    color: 'natural',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    cancelEstilo: 'lujo',
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['cancel-bano'].toleranciasDefault,
  });
  assert.ok(cancel.perfiles.some((p) => p.perfilId === 'alumer_11174'));
  assert.ok(cancel.perfiles.some((p) => p.perfilId === 'alumer_11387'));
  assert.ok(cancel.perfiles.some((p) => p.perfilId === 'alumer_11173'));
});

test('4. Mosquitero Fijo y Corredizo calculan perfiles, Tela Mosquitera (m²), Cola de rata (m) y Carretillas', () => {
  const fijo = calcularDespiece({
    linea: 'mosq-fijo',
    anchoCm: 100,
    altoCm: 120,
    color: 'blanco',
    vidrio: 'claro6',
    hojas: 1,
    apertura: 'fija',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['mosq-fijo'].toleranciasDefault,
  });

  assert.ok(fijo.perfiles.some((p) => p.perfilId === 'mosq_marco'));
  assert.ok(fijo.telaMosquiteraM2 > 1.2);
  assert.ok(fijo.colaDeRataM > 4.4);
  assert.equal(fijo.carretillasMosq, 0);

  const corredizo = calcularDespiece({
    linea: 'mosq-corredizo',
    anchoCm: 150,
    altoCm: 120,
    color: 'madera',
    vidrio: 'claro6',
    hojas: 1,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 2,
    tolerancias: LINEAS_CONFIG['mosq-corredizo'].toleranciasDefault,
  });

  assert.ok(corredizo.perfiles.some((p) => p.perfilId === 'riel_mosq'));
  assert.equal(corredizo.carretillasMosq, 4);
});

test('5. Planes G/M/Q/A, claves de reposición por días exactos y enlace oficial https://pages.dev', () => {
  assert.equal(PLANS.length, 4);
  assert.deepEqual(
    PLANS.map((p) => p.code),
    ['G', 'M', 'Q', 'A']
  );

  const giftPlan = PLANS.find((p) => p.idx === 0)!;
  assert.equal(giftPlan.label, 'Promoción 3 Días (Regalo)');
  assert.equal(giftPlan.adminOnly, true);
  assert.equal(PLANS.filter((p) => !p.adminOnly).length, 3);

  const keyG = generateActivationKey('ALM-TEST', 0);
  assert.match(keyG, /^AP-G-[A-Z0-9]{6}$/);
  assert.equal(validateActivationKey('ALM-TEST', keyG).ok, true);

  const keyQ = generateActivationKey('ALM-TEST', 2);
  assert.match(keyQ, /^AP-Q-[A-Z0-9]{6}$/);
  const resQ = validateActivationKey('ALM-TEST', keyQ);
  assert.equal(resQ.ok, true);
  assert.equal(resQ.plan?.price, '$799 MXN');

  // Reposición de días exactos (equipo perdido)
  const keyCustom = generateActivationKey('ALM-NUEVO', 1, 18);
  assert.match(keyCustom, /^AP-D18-[A-Z0-9]{6}$/);
  const resCustom = validateActivationKey('ALM-NUEVO', keyCustom);
  assert.equal(resCustom.ok, true);
  assert.equal(resCustom.customDays, 18);
  assert.equal(resCustom.plan?.ms, 18 * 24 * 60 * 60 * 1000);
  assert.equal(validateActivationKey('ALM-OTRO', keyCustom).ok, false);

  const now = 1_700_000_000_000;
  assert.equal(isProActive({ active: true, expiresAt: now + giftPlan.ms! }, now), true);
  assert.equal(isProActive({ active: true, expiresAt: now - 1 }, now), false);

  assert.equal(FREE_TRIAL_MS, 72 * 60 * 60 * 1000);
  const trialExpires = now + FREE_TRIAL_MS;
  assert.equal(getTrialCountdown(trialExpires, now).label, 'Prueba PRO · 2d 23h');
  assert.equal(getTrialCountdown(trialExpires, now + 2 * 60 * 60 * 1000).label, 'Prueba PRO · 2d 21h');
  assert.equal(getTrialCountdown(trialExpires, now + 49 * 60 * 60 * 1000).label, 'Prueba PRO · 0d 22h');
  const expiredTrial = getTrialCountdown(trialExpires, trialExpires);
  assert.equal(expiredTrial.active, false);
  assert.equal(expiredTrial.label, 'Activar PRO');

  assert.equal(getOfficialShareUrl(), 'https://alumineropro.pages.dev');
});

test('6. Conversión de Nota de Obra en 1 clic e inventario de 6 carretillas + consolidado', () => {
  const parsedGuillotina = parseNotaACotizacion({
    titulo: 'Ventana guillotina — Cocina',
    texto: 'Medidas 145 x 120 cm en acabado blanco con filtrasol 6 mm',
  });
  assert.equal(parsedGuillotina.linea, '3');
  assert.equal(parsedGuillotina.apertura, 'guillotina');
  assert.equal(parsedGuillotina.anchoCm, 145);
  assert.equal(parsedGuillotina.altoCm, 120);
  assert.equal(parsedGuillotina.color, 'blanco');
  assert.equal(parsedGuillotina.vidrio, 'filtrasol6');

  const parsedCancel = parseNotaACotizacion({
    titulo: 'Cancel para baño — Recámara principal',
    texto: '160x195 negro',
  });
  assert.equal(parsedCancel.linea, 'cancel-bano');
  assert.equal(parsedCancel.anchoCm, 160);
  assert.equal(parsedCancel.altoCm, 195);
  assert.equal(parsedCancel.color, 'negro');

  const carretillas = HERRAJES_INVENTARIO_CATALOGO.filter((h) => h.categoria === 'Carretillas');
  assert.equal(carretillas.length, 6);

  const despiece = calcularDespiece({
    linea: '3',
    anchoCm: 120,
    altoCm: 100,
    color: 'natural',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });

  const cot = calcularCotizacion({
    linea: '3',
    anchoCm: 120,
    altoCm: 100,
    color: 'natural',
    vidrio: 'claro6',
    modoPrecio: 'm2',
    precioInput: 2850,
    cantidad: 1,
    cobrarMinM2: false,
    incluirIva: false,
    extraPct: 0,
    descDistribuidorPct: 15,
    precioListaTramo: 850,
    despiece,
  });

  assert.equal(cot.areaRealM2, 1.2);
  assert.equal(cot.totalFinal, 3420);

  const cons = consolidarMaterialesObra(
    [
      {
        id: 'p1',
        categoria: 'ventanas',
        linea: '3',
        area: 'Sala',
        etiqueta: 'V1',
        anchoCm: 120,
        altoCm: 100,
        color: 'natural',
        vidrio: 'claro6',
        hojas: 2,
        apertura: 'corrediza',
        sentidoPuerta: 'izq',
        puertaIntermedio: false,
        puertaEconomica: false,
        invertido: false,
        cantidad: 1,
        modoPrecio: 'm2',
        precioInput: 2850,
        cobrarMinM2: false,
        extraPct: 0,
        totalLinea: cot.totalFinal,
        despiece,
      },
    ],
    { '3__cabezal__natural': 2 },
    { '3__cabezal__natural': 1 }
  );

  const cab = cons.find((r) => r.perfilId === 'cabezal');
  assert.ok(cab);
  assert.equal(cab.tramosDisponibles, 1);
  assert.equal(cab.tramosFaltantes, 0);
});

test('7. Validación de contraseña por defecto 1983 del Panel de Administrador con .trim() y PIN maestro 202699', () => {
  assert.equal(ADMIN_ACCESS_PASSWORD, '1983');
  assert.equal(verifyAdminPassword('1983'), true);
  assert.equal(verifyAdminPassword('  1983  '), true);
  assert.equal(verifyAdminPassword(''), false);
  assert.equal(verifyAdminPassword('TU_CONTRASEÑA_AQUI'), false);
  assert.equal(verifyAdminPassword('Olmos5Hernandes32026'), false);
  // Si existiera un residuo viejo 'TU_CONTRASEÑA_AQUI' se ignora y sigue aplicando la clave inicial 1983
  assert.equal(verifyAdminPassword('1983', 'TU_CONTRASEÑA_AQUI'), true);
  // Contraseña personalizada guardada tras recuperación con PIN se mantiene activa
  assert.equal(verifyAdminPassword('  NuevaClave2026 ', 'NuevaClave2026'), true);
  assert.equal(verifyAdminPassword('1983', 'NuevaClave2026'), false);

  assert.equal(ADMIN_RECOVERY_PIN, '202699');
  assert.equal(verifyRecoveryPin('202699'), true);
  assert.equal(verifyRecoveryPin(' 202699 '), true);
  assert.equal(verifyRecoveryPin('123456'), false);
});

test('8. Cálculo de estadísticas de usuarios activos, uso promedio y serie diaria de 30 días (Recharts)', () => {
  const now = new Date('2026-11-18T12:00:00Z').getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const sampleDevices = [
    {
      deviceId: 'ALM-AAA1',
      cliente: 'Taller Norte',
      deviceLabel: 'Android',
      firstSeenAt: now - 10 * dayMs,
      lastSeenAt: now - 1 * dayMs,
      totalSessions: 12,
      totalMinutes: 45,
      activeDays: ['2026-11-15', '2026-11-16', '2026-11-17'],
      proActive: true,
      planCode: 'M',
      planLabel: '30 Días',
      expiresAt: now + 20 * dayMs,
      lastKey: 'AP-M-123456',
      updatedAt: now - 1 * dayMs,
    },
    {
      deviceId: 'ALM-BBB2',
      cliente: 'Taller Sur',
      deviceLabel: 'iPhone',
      firstSeenAt: now - 5 * dayMs,
      lastSeenAt: now - 2 * dayMs,
      totalSessions: 4,
      totalMinutes: 15,
      activeDays: ['2026-11-16'],
      proActive: false,
      planCode: 'FREE',
      planLabel: 'Gratuito',
      expiresAt: null,
      lastKey: '',
      updatedAt: now - 2 * dayMs,
    },
    {
      deviceId: 'ALM-OLD3',
      cliente: 'Inactivo',
      deviceLabel: 'Desktop',
      firstSeenAt: now - 50 * dayMs,
      lastSeenAt: now - 40 * dayMs,
      totalSessions: 99,
      totalMinutes: 500,
      activeDays: ['2026-10-05'],
      proActive: true,
      planCode: 'Q',
      planLabel: '90 Días',
      expiresAt: now - 1 * dayMs, // ya expiró
      lastKey: 'AP-Q-OLD',
      updatedAt: now - 40 * dayMs,
    },
  ];
  const stats = computeUsageStats30d(sampleDevices, now);

  assert.equal(stats.totalDevices, 3);
  assert.equal(stats.activeUsers30d, 2);
  assert.equal(stats.proActiveDevices, 1);
  assert.equal(stats.avgMinutesPerUser30d, 30);
  assert.equal(stats.avgSessionsPerUser30d, 8);
  assert.equal(stats.avgActiveDaysPerUser30d, 2);

  const series = buildDailyUsageSeries30d(sampleDevices, now);
  assert.equal(series.length, 30);
  const nov16 = series.find((p) => p.date === '2026-11-16');
  assert.ok(nov16);
  assert.equal(nov16.activeUsers, 2);
  assert.equal(nov16.avgMinutes, 15);
});

test('9. Categoría Viniles, expansión de chapas/jaladeras/escuadras y consolidado con sobrantes < 6m', () => {
  const viniles = HERRAJES_INVENTARIO_CATALOGO.filter((h) => h.categoria === 'Viniles');
  assert.ok(viniles.length >= 8, 'Debe incluir varios modelos y tamaños de Viniles');
  assert.ok(viniles.some((v) => v.nombre.includes('#10')));
  assert.ok(viniles.some((v) => v.nombre.toLowerCase().includes('cola de rata')));

  const jaladerasChapas = HERRAJES_INVENTARIO_CATALOGO.filter(
    (h) => h.categoria === 'Jaladeras y Chapas'
  );
  assert.ok(jaladerasChapas.length >= 16, 'Debe incluir varios modelos y colores de chapas y jaladeras');
  assert.ok(jaladerasChapas.some((j) => (j.color || '').includes('Bronce')));
  assert.ok(jaladerasChapas.some((j) => (j.color || '').includes('Níquel')));

  const escuadras = HERRAJES_INVENTARIO_CATALOGO.filter(
    (h) => h.categoria === 'Tornillería y Escuadras' && h.nombre.toLowerCase().includes('escuadra')
  );
  assert.ok(escuadras.length >= 6, 'Debe incluir varios modelos de escuadras');

  const despiece = calcularDespiece({
    linea: '3',
    anchoCm: 120,
    altoCm: 100,
    color: 'natural',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });

  const cons = consolidarMaterialesObra(
    [
      {
        id: 'p-sob',
        categoria: 'ventanas',
        linea: '3',
        area: 'Sala',
        etiqueta: 'V1',
        anchoCm: 120,
        altoCm: 100,
        color: 'natural',
        vidrio: 'claro6',
        hojas: 2,
        apertura: 'corrediza',
        sentidoPuerta: 'izq',
        puertaIntermedio: false,
        puertaEconomica: false,
        invertido: false,
        cantidad: 1,
        modoPrecio: 'm2',
        precioInput: 2850,
        cobrarMinM2: false,
        extraPct: 0,
        totalLinea: 3420,
        despiece,
      },
    ],
    {},
    {},
    [{ linea: '3', perfilId: 'cabezal', color: 'natural', largoM: 2.5, cantidad: 2 }]
  );

  const cab = cons.find((r) => r.perfilId === 'cabezal');
  assert.ok(cab);
  assert.equal(cab.metrosSobrantesDisponibles, 5);
});

test('10. Línea Panorámica y perfiles asociados eliminados por completo y respaldo para IDs legados', () => {
  assert.equal('panoramica' in LINEAS_CONFIG, false);
  assert.equal(
    HERRAJES_INVENTARIO_CATALOGO.some((h) => h.nombre.toLowerCase().includes('panorám') || h.id.includes('panoram')),
    false
  );
  assert.equal(normalizeLineaId('panoramica'), '3');
  assert.equal(normalizeLineaId('europea'), 'europea');
});

test('11. Modulación y Cortes: modelos, series, secciones agrupadas, mosquitero y envío a Hoja de Cotización', () => {
  assert.equal(MODULACION_MODELOS.filter((m) => m.categoria === 'ventanas').length, 6);
  assert.equal(MODULACION_MODELOS.filter((m) => m.categoria === 'puertas').length, 2);
  assert.equal(MODULACION_SERIES.length, 7);
  assert.equal(MODULACION_SUBLINEAS.length, 3);

  const sinMosq = calcularModulacionCortes({
    modeloId: 'win-corrediza',
    conMosquitero: false,
    serieId: 'linea-3',
    sublineaId: 'economica-hermetica',
    anchoCm: 120,
    altoCm: 100,
  });
  // Contramarco (3) + Hoja Fija (3) + Hoja Móvil (3) = 9
  assert.equal(sinMosq.perfiles.length, 9);
  assert.equal(sinMosq.perfiles.filter((p) => p.seccion === 'contramarco').length, 3);
  assert.equal(sinMosq.perfiles.filter((p) => p.seccion === 'hoja-fija').length, 3);
  assert.equal(sinMosq.perfiles.filter((p) => p.seccion === 'hoja-movil').length, 3);
  assert.ok(sinMosq.vidrios.length >= 1, 'Debe calcular vidrios de la modulación');

  const contramarco = sinMosq.perfiles.find((p) => p.id === 'contramarco');
  assert.ok(contramarco);
  assert.equal(contramarco.medidaCm, 120);
  assert.equal(contramarco.cantidad, 1);

  const conMosq = calcularModulacionCortes({
    modeloId: 'win-corrediza',
    conMosquitero: true,
    serieId: 'serie-70',
    sublineaId: 'gran-vista-hermetica',
    anchoCm: 150,
    altoCm: 120,
  });
  assert.equal(conMosq.perfiles.length, 12);
  assert.equal(conMosq.perfiles.filter((p) => p.seccion === 'mosquitero').length, 3);
  assert.ok(conMosq.totalAluminioM > sinMosq.totalAluminioM);

  const partida = buildPartidaFromModulacion(conMosq);
  assert.equal(partida.area, 'Modulación y Cortes');
  assert.equal(partida.despiece.perfiles.length, 12);
  assert.ok(partida.despiece.vidrios.length >= 1);
  assert.ok(partida.totalLinea > 0);
});

test('12. Optimizador 1D de Tramos (6.10 m): prioriza sobrantes compatibles de taller y detecta sobrantes guardables', () => {
  const calc = calcularModulacionCortes({
    modeloId: 'win-corrediza',
    conMosquitero: false,
    serieId: 'linea-3',
    sublineaId: 'comercial-hermetica',
    anchoCm: 140,
    altoCm: 110,
  });

  // 1 sobrante compatible de jamba (2.40 m) y 1 de cabezal (1.50 m) en Línea 3"
  const opt = optimizarTramos1D({
    perfiles: calc.perfiles,
    lineaCompatible: '3',
    sobrantesInventario: [
      {
        id: 'sob-1',
        marca: 'Alumer',
        linea: '3',
        perfilId: 'jamba',
        color: 'natural',
        largoM: 2.4,
        cantidad: 1,
        fecha: 'hoy',
      },
      {
        id: 'sob-2',
        marca: 'Cuprum',
        linea: '3',
        perfilId: 'cabezal',
        color: 'natural',
        largoM: 1.5,
        cantidad: 1,
        fecha: 'hoy',
      },
    ],
  });

  assert.ok(opt.grupos.length >= 4);
  assert.equal(opt.sobrantesInventarioUsados, 2, 'Debe priorizar los 2 sobrantes compatibles antes de pedir tramos 6.10 m');

  const grupoJamba = opt.grupos.find((g) => g.perfilId === 'jamba');
  assert.ok(grupoJamba);
  assert.equal(grupoJamba.sobrantesUsados, 1);
  assert.equal(grupoJamba.tramos610Requeridos, 0, 'Con sobrante de 2.40 m cubren las 2 jambas de ~106.8 cm sin abrir tramo nuevo');

  assert.ok(opt.sobrantesGeneradosGuardables.length >= 1, 'Tramos de 6.10 m deben reportar retazos reutilizables >= 15 cm');
});

test('13. Optimizador de Corte de Vidrio 2D: algoritmo guillotina, kerf 3 mm, rotación 90°, merma y alerta de faltantes', () => {
  const res = optimizarVidrio2D({
    piezas: [
      { id: 'v1', etiqueta: 'Sala', tipoNombre: 'Claro 6 mm', anchoCm: 140, altoCm: 100, cantidad: 1 },
      { id: 'v2', etiqueta: 'Comedor', tipoNombre: 'Claro 6 mm', anchoCm: 140, altoCm: 100, cantidad: 1 },
      { id: 'v3', etiqueta: 'Cocina', tipoNombre: 'Claro 6 mm', anchoCm: 120, altoCm: 90, cantidad: 2 },
    ],
    hojasInventario: [
      {
        id: 'hv-1',
        tipoNombre: 'Claro 6 mm',
        espesorMm: 6,
        anchoCm: 260,
        altoCm: 180,
        cantidad: 1,
        fecha: 'hoy',
      },
    ],
    grosorCorteMm: 3,
    permitirRotacion: true,
    hojaRespaldo: { tipoNombre: 'Claro 6 mm', anchoCm: 260, altoCm: 180 },
  });

  assert.equal(res.hojasInventarioUsadas, 1);
  assert.ok(res.hojasFaltantes >= 1, '1 sola hoja no alcanza para 4 vidrios grandes; debe alertar hoja(s) faltante(s)');
  assert.ok(res.resumenFaltanteTexto && res.resumenFaltanteTexto.includes('falta'));
  assert.ok(res.aprovechamientoPct > 0 && res.aprovechamientoPct <= 100);
  assert.equal(Math.round((res.aprovechamientoPct + res.mermaPct) * 10) / 10, 100);
  assert.ok(res.secuenciaGlobal.length >= 4, 'Debe emitir pasos de corte guillotina (Vertical X / Horizontal Y)');
  assert.equal(res.piezasNoCaben.length, 0);
});

import {
  esMaterialDireccional,
  getRellenoLabel,
  getRellenoPrecioM2,
  getRellenoPriceKey,
  PANEL_RELLENO_CATALOGO,
  RELLENO_CATEGORIAS_META,
} from './alumineroLogic';

test('14. Panel de Relleno 5 categorías, espesores, precios editables y sobrecosto en cotización', () => {
  assert.equal(RELLENO_CATEGORIAS_META.length, 5);
  assert.ok(PANEL_RELLENO_CATALOGO.some((r) => r.categoria === 'espejo' && r.id === 'esp-plata'));
  assert.ok(PANEL_RELLENO_CATALOGO.some((r) => r.categoria === 'plastico' && r.id === 'plas-gota'));
  assert.ok(PANEL_RELLENO_CATALOGO.some((r) => r.categoria === 'duela' && r.id === 'duela-doble'));

  const sel = { categoria: 'espejo' as const, materialId: 'esp-plata', espesorMm: 4 };
  assert.equal(getRellenoLabel(sel), 'Espejo Plata 4 mm');
  assert.equal(getRellenoPrecioM2(sel), 680);

  const customMap = { [getRellenoPriceKey('esp-plata', 4)]: 840 };
  assert.equal(getRellenoPrecioM2(sel, customMap), 840);

  const d = calcularDespiece({
    linea: '3',
    anchoCm: 100,
    altoCm: 100,
    color: 'natural',
    vidrio: 'claro6',
    relleno: { categoria: 'plastico', materialId: 'plas-gota', espesorMm: 3 },
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: true,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: { ...LINEAS_CONFIG['3'].toleranciasDefault },
  });
  assert.equal(d.vidrios[0].espesorLabel, 'Acrílico Gota de Agua / Llovizna 3 mm');
  assert.equal(d.vidrios[0].permitirRotacion, false);

  const cotCustom = calcularCotizacion({
    linea: '3',
    anchoCm: 100,
    altoCm: 100,
    color: 'natural',
    vidrio: 'claro6',
    relleno: sel,
    rellenoPrecioM2: 840,
    modoPrecio: 'm2',
    precioInput: 2850,
    cantidad: 1,
    cobrarMinM2: false,
    incluirIva: false,
    extraPct: 0,
    descDistribuidorPct: 40,
    precioListaTramo: 1450,
    despiece: d,
  });
  assert.equal(cotCustom.extraVidrioM2, 400);
  assert.equal(cotCustom.totalFinal, 3250);
});

test('15. Optimizador 1D: descuento de disco 3.5 mm por corte y umbral de sobrante útil 45 cm vs Merma', () => {
  const perfiles = [
    {
      id: 'cabezal-test',
      perfilId: 'cabezal' as const,
      codigo: 'AL-7836',
      nombre: 'Cabezal',
      rol: 'Cabezal superior',
      orientacion: 'horizontal' as const,
      seccion: 'contramarco' as const,
      formulaTexto: 'A',
      medidaCm: 290,
      medidaM: 2.9,
      cantidad: 2,
      cantidadLabel: 'x2',
      totalMetros: 5.8,
      angulo: '90°' as const,
    },
  ];
  const opt = optimizarTramos1D({ perfiles, lineaCompatible: '3' });
  const g = opt.grupos[0];
  assert.equal(g.barras.length, 1);
  // 2 cortes de 290 = 580 cm + 2 * 0.35 cm (disco) = 580.70 cm -> sobrante = 610 - 580.7 = 29.3 cm < 45 cm -> Merma
  assert.equal(g.barras[0].desperdicioDiscoCm, 0.7);
  assert.equal(g.barras[0].sobranteCm, 29.3);
  assert.equal(g.barras[0].esMerma, true);
  assert.equal(g.mermaTotalCm, 29.3);
  assert.equal(opt.sobrantesGeneradosGuardables.length, 0);

  // Con cortes más cortos que dejan >= 45 cm, debe guardarse como sobrante útil
  const optUtil = optimizarTramos1D({
    perfiles: [{ ...perfiles[0], medidaCm: 250, medidaM: 2.5, totalMetros: 5.0 }],
    lineaCompatible: '3',
  });
  assert.equal(optUtil.grupos[0].barras[0].esMerma, false);
  assert.equal(optUtil.sobrantesGeneradosGuardables.length, 1);
  assert.ok(optUtil.sobrantesGeneradosGuardables[0].largoCm >= 45);
});

test('16. Optimizador 2D: igualdad estricta material+espesor y bloqueo automático de giro 90° en plásticos direccionales', () => {
  const res = optimizarVidrio2D({
    piezas: [
      { id: 'c4', etiqueta: 'Ventana', tipoNombre: 'Claro 4 mm', anchoCm: 80, altoCm: 60, cantidad: 1 },
      { id: 'pl', etiqueta: 'Cancel Baño', tipoNombre: 'Acrílico Gota de Agua / Llovizna 3 mm', anchoCm: 60, altoCm: 150, cantidad: 1 },
    ],
    hojasInventario: [
      {
        id: 'hv-c6',
        categoria: 'vidrio',
        tipoNombre: 'Claro 6 mm',
        espesorMm: 6,
        anchoCm: 260,
        altoCm: 180,
        cantidad: 1,
        fecha: 'hoy',
      },
      {
        id: 'hv-pl',
        categoria: 'plastico',
        tipoNombre: 'Acrílico Gota de Agua / Llovizna 3 mm',
        espesorMm: 3,
        anchoCm: 183,
        altoCm: 122,
        cantidad: 1,
        fecha: 'hoy',
      },
    ],
    grosorCorteMm: 3,
    permitirRotacion: true,
    hojaRespaldo: { tipoNombre: 'Claro 4 mm', anchoCm: 183, altoCm: 122 },
  });

  // Claro 4 mm no debe usar hoja Claro 6 mm; debe pedir hoja faltante de Claro 4 mm
  const panelC4 = res.paneles.find((p) => p.tipoNombre === 'Claro 4 mm');
  assert.ok(panelC4);
  assert.equal(panelC4.origen, 'faltante');
  assert.equal(res.hojasFaltantes, 1);
  assert.ok(res.resumenFaltanteTexto && res.resumenFaltanteTexto.includes('Claro 4 mm'));

  // Plástico direccional 60×150 no cabe verticalmente en 183×122 sin rotar porque alto 150 > 122
  assert.equal(esMaterialDireccional('Acrílico Gota de Agua / Llovizna 3 mm'), true);
  assert.equal(res.piezasNoCaben.length, 1);
  assert.equal(res.piezasNoCaben[0].etiqueta, 'Cancel Baño');
});

test('17. Contrato: folio CONT-YYYY-NNN, 4 cláusulas base y ubicación del taller', () => {
  assert.equal(formatContratoFolio(1, 2026), 'CONT-2026-001');
  assert.equal(formatContratoFolio(14, 2026), 'CONT-2026-014');
  assert.ok('ubicacion' in DEFAULT_TALLER);
  assert.ok(DEFAULT_CONTRATO_CLAUSES.anticipo.includes('compra de material a medida'));
  assert.ok(DEFAULT_CONTRATO_CLAUSES.entrega.includes('pago del anticipo'));
  assert.ok(DEFAULT_CONTRATO_CLAUSES.condicionesVano.includes('vanos terminados'));
  assert.ok(DEFAULT_CONTRATO_CLAUSES.garantia.includes('rotura de cristales'));
  assert.equal(DEFAULT_CONTRATO_CLIENTE.clausulaCondicionesVano, DEFAULT_CONTRATO_CLAUSES.condicionesVano);
});

test('18. Contador en retroceso en tiempo real y elegibilidad de respaldo en nube (90 días y 1 año)', () => {
  const now = 1_750_000_000_000;
  const twoDays18h45m = ((2 * 24 + 18) * 60 + 45) * 60 * 1000;

  const activeCountdown = formatCountdownTimer(now + twoDays18h45m, now);
  assert.equal(activeCountdown.expired, false);
  assert.equal(activeCountdown.label, '⏳ 2d 18h 45m');

  const shortCountdown = formatCountdownTimer(now + 45_000, now);
  assert.equal(shortCountdown.expired, false);
  assert.equal(shortCountdown.label, '⏳ 0m 45s');

  const expiredCountdown = formatCountdownTimer(now - 1000, now);
  assert.equal(expiredCountdown.expired, true);
  assert.equal(expiredCountdown.label, 'Expirado');

  const lifetimeCountdown = formatCountdownTimer(null, now);
  assert.equal(lifetimeCountdown.expired, false);
  assert.equal(lifetimeCountdown.label, '⏳ Vitalicia');

  // Prueba de 3 días / Gratis / 30 días NO elegibles; 90 días y 1 año SÍ elegibles
  assert.equal(isEligibleForCloudBackup(null, false, now), false);
  assert.equal(isEligibleForCloudBackup(null, true, now), false);
  assert.equal(
    isEligibleForCloudBackup(
      { active: true, planCode: 'G', planLabel: 'Promoción 3 Días (Regalo)', expiresAt: now + 86_400_000 },
      true,
      now
    ),
    false
  );
  assert.equal(
    isEligibleForCloudBackup(
      { active: true, planCode: 'M', planLabel: '30 Días ($329 MXN)', expiresAt: now + 30 * 86_400_000 },
      false,
      now
    ),
    false
  );
  assert.equal(
    isEligibleForCloudBackup(
      { active: true, planCode: 'Q', planLabel: '90 Días ($799 MXN)', expiresAt: now + 90 * 86_400_000 },
      false,
      now
    ),
    true
  );
  assert.equal(
    isEligibleForCloudBackup(
      { active: true, planCode: 'A', planLabel: '1 Año / 365 Días ($1,499 MXN)', expiresAt: now + 365 * 86_400_000 },
      false,
      now
    ),
    true
  );
  // Expirado no es elegible
  assert.equal(
    isEligibleForCloudBackup(
      { active: true, planCode: 'Q', planLabel: '90 Días ($799 MXN)', expiresAt: now - 1000 },
      false,
      now
    ),
    false
  );
});

test('19. Normalización de ID de equipo, formato automático con guiones en clave y conteo exacto de PRO activos', () => {
  // normalizeDeviceIdInput
  assert.equal(normalizeDeviceIdInput('9x2k'), 'ALM-9X2K');
  assert.equal(normalizeDeviceIdInput('alm9x2k'), 'ALM-9X2K');
  assert.equal(normalizeDeviceIdInput('  alm-9x2k  '), 'ALM-9X2K');
  assert.equal(normalizeDeviceIdInput('', 'ALM-FALL'), 'ALM-FALL');

  // formatActivationKeyInput: inserción automática de guiones y borrado fluido
  assert.equal(formatActivationKeyInput('ap'), 'AP-');
  assert.equal(formatActivationKeyInput('apm', 'AP-'), 'AP-M-');
  assert.equal(formatActivationKeyInput('apm123abc', 'AP-M-123AB'), 'AP-M-123ABC');
  assert.equal(formatActivationKeyInput('AP-M', 'AP-M-'), 'AP-M');
  assert.equal(formatActivationKeyInput('AP', 'AP-'), 'AP');
  assert.equal(formatActivationKeyInput('ap-d18-ab12cd'), 'AP-D18-AB12CD');
  assert.equal(formatActivationKeyInput('apd18ab12cd'), 'AP-D18-AB12CD');

  // computeUsageStats30d excluye revocados y FREE incluso si tuvieran proActive residual
  const now = 1_760_000_000_000;
  const stats = computeUsageStats30d(
    [
      {
        deviceId: 'ALM-PRO1',
        cliente: 'Activo',
        deviceLabel: 'Android',
        firstSeenAt: now - 1000,
        lastSeenAt: now,
        totalSessions: 2,
        totalMinutes: 10,
        activeDays: ['2026-11-18'],
        proActive: true,
        planCode: 'M',
        planLabel: '30 Días',
        expiresAt: now + 86_400_000,
        lastKey: 'AP-M-AAAAAA',
        updatedAt: now,
      },
      {
        deviceId: 'ALM-REV1',
        cliente: 'Revocado',
        deviceLabel: 'Android',
        firstSeenAt: now - 1000,
        lastSeenAt: now,
        totalSessions: 2,
        totalMinutes: 10,
        activeDays: ['2026-11-18'],
        proActive: true,
        revoked: true,
        planCode: 'REVOKED',
        planLabel: 'Revocada',
        expiresAt: now + 86_400_000,
        lastKey: 'AP-G-BBBBBB',
        updatedAt: now,
      },
      {
        deviceId: 'ALM-FREE1',
        cliente: 'Gratis',
        deviceLabel: 'iPhone',
        firstSeenAt: now - 1000,
        lastSeenAt: now,
        totalSessions: 1,
        totalMinutes: 5,
        activeDays: ['2026-11-18'],
        proActive: true, // dato residual inconsistente
        planCode: 'FREE',
        planLabel: 'Versión Gratuita',
        expiresAt: null,
        lastKey: '',
        updatedAt: now,
      },
      {
        deviceId: 'ALM-BLK1',
        cliente: 'Bloqueado',
        deviceLabel: 'Android',
        firstSeenAt: now - 1000,
        lastSeenAt: now,
        totalSessions: 1,
        totalMinutes: 5,
        activeDays: ['2026-11-18'],
        proActive: true, // dato residual inconsistente
        blocked: true,
        planCode: 'BLOCKED',
        planLabel: 'Bloqueado',
        expiresAt: now + 86_400_000,
        lastKey: '',
        updatedAt: now,
      },
    ],
    now
  );
  assert.equal(stats.totalDevices, 4);
  assert.equal(stats.proActiveDevices, 1);
});

test('20. Inicio en Versión Gratuita y detección de pruebas automáticas sin clave ni asignación Admin', async () => {
  const { isUnassignedAutoTrialDevice } = await import('./alumineroLogic.ts');

  // Dispositivo que obtuvo prueba automática antigua sin clave ni asignación del Admin
  assert.equal(
    isUnassignedAutoTrialDevice({
      lastKey: '',
      adminAssigned: false,
      trialActive: true,
      planCode: 'G',
      proActive: true,
    }),
    true
  );

  // Dispositivo nuevo en Versión Gratuita no es prueba automática
  assert.equal(
    isUnassignedAutoTrialDevice({
      lastKey: '',
      adminAssigned: false,
      trialActive: false,
      planCode: 'FREE',
      proActive: false,
    }),
    false
  );

  // Dispositivo con clave válida generada por Admin (ej. 3 días) SÍ está autorizado
  assert.equal(
    isUnassignedAutoTrialDevice({
      lastKey: 'AP-G-123456',
      adminAssigned: false,
      trialActive: true,
      planCode: 'G',
      proActive: true,
    }),
    false
  );

  // Dispositivo activado directamente desde el Panel Admin SÍ está autorizado
  assert.equal(
    isUnassignedAutoTrialDevice({
      lastKey: '',
      adminAssigned: true,
      trialActive: true,
      planCode: 'G',
      proActive: true,
    }),
    false
  );
});

test('21. Teléfono de cliente con guiones automáticos, borrado fluido y encabezado combinado', async () => {
  const {
    formatClientPhoneInput,
    formatCombinedClientLabel,
    formatClientHeaderDisplay,
  } = await import('./alumineroLogic.ts');

  // Auto-guiones progresivos XXX-XXX-XXXX
  assert.equal(formatClientPhoneInput('555'), '555');
  assert.equal(formatClientPhoneInput('5551'), '555-1');
  assert.equal(formatClientPhoneInput('555123'), '555-123');
  assert.equal(formatClientPhoneInput('5551234567'), '555-123-4567');
  assert.equal(formatClientPhoneInput('555-123-456799'), '555-123-4567');

  // Borrado fluido cuando el cursor retrocede justo sobre un guion
  assert.equal(formatClientPhoneInput('555-123', '555-123-'), '555-12');
  assert.equal(formatClientPhoneInput('555', '555-'), '55');

  // Nombre y teléfono combinados para tarjetas del historial
  assert.equal(formatCombinedClientLabel('  Juan Pérez  ', '5551234567'), 'Juan Pérez · 555-123-4567');
  assert.equal(formatClientHeaderDisplay('Juan Pérez · 5551234567'), 'Juan Pérez · 555-123-4567');
  assert.equal(formatClientHeaderDisplay('Juan Pérez 5551234567'), 'Juan Pérez · 555-123-4567');
  assert.equal(formatClientHeaderDisplay(''), 'Cliente sin nombre');
});

test('22. Obras Aprobadas: cálculo de metros comprometidos, metros libres del tramo de 6 m y resumen total', async () => {
  const { calcularMetrosObraAprobada, resumirObrasAprobadas } = await import('./alumineroLogic.ts');

  const medioTramo = calcularMetrosObraAprobada(0.5);
  assert.equal(medioTramo.metrosComprometidos, 3);
  assert.equal(medioTramo.metrosLibres, 3);
  assert.equal(medioTramo.tramosAsignados, 1);
  assert.equal(medioTramo.resumenTexto, '3.00 m comprometidos · 3.00 m libres del tramo de 6 m');

  const unTramo = calcularMetrosObraAprobada(1);
  assert.equal(unTramo.metrosComprometidos, 6);
  assert.equal(unTramo.metrosLibres, 0);
  assert.equal(unTramo.tramosAsignados, 1);
  assert.equal(unTramo.resumenTexto, '6.00 m comprometidos · 0.00 m libres');

  const unoYMedio = calcularMetrosObraAprobada(1.5);
  assert.equal(unoYMedio.metrosComprometidos, 9);
  assert.equal(unoYMedio.metrosLibres, 3);
  assert.equal(unoYMedio.tramosAsignados, 2);

  const resumen = resumirObrasAprobadas([{ tramos: 0.5 }, { tramos: 1 }, { tramos: 1.5 }]);
  assert.equal(resumen.totalApartados, 3);
  assert.equal(resumen.totalTramos, 3);
  assert.equal(resumen.totalMetrosComprometidos, 18);
  assert.equal(resumen.totalMetrosLibres, 6);
});

test('23. Bodega Tramos completos (6.10 m): conserva Color (Blanco/Negro/Madera) y Marca sin agrupar como Natural', async () => {
  const {
    makeInventarioKey,
    parseInventarioKey,
    getInventarioTramosPorPerfilColor,
    descontarInventarioPorPerfilColor,
  } = await import('./alumineroLogic.ts');

  const kBlancoAlumer = makeInventarioKey('3', 'cabezal', 'blanco', 'Alumer');
  const kNegroCuprum = makeInventarioKey('3', 'cabezal', 'negro', 'Cuprum');
  const kMaderaAlumer = makeInventarioKey('3', 'cabezal', 'madera', 'Alumer');
  const kNegroAlumer = makeInventarioKey('3', 'cabezal', 'negro', 'Alumer');

  assert.equal(kBlancoAlumer, '3__cabezal__blanco__Alumer');
  assert.equal(kNegroCuprum, '3__cabezal__negro__Cuprum');
  assert.equal(kMaderaAlumer, '3__cabezal__madera__Alumer');

  assert.deepEqual(parseInventarioKey(kBlancoAlumer), {
    linea: '3',
    perfilId: 'cabezal',
    color: 'blanco',
    marca: 'Alumer',
  });
  assert.deepEqual(parseInventarioKey(kNegroCuprum), {
    linea: '3',
    perfilId: 'cabezal',
    color: 'negro',
    marca: 'Cuprum',
  });
  assert.deepEqual(parseInventarioKey('3__jamba__madera'), {
    linea: '3',
    perfilId: 'jamba',
    color: 'madera',
    marca: '',
  });

  const inv: Record<string, number> = {
    [kBlancoAlumer]: 2,
    [kNegroCuprum]: 3,
    [kNegroAlumer]: 1,
    [kMaderaAlumer]: 4,
  };

  // Natural debe ser 0 (no debe colapsar otros colores hacia Natural)
  assert.equal(getInventarioTramosPorPerfilColor(inv, '3', 'cabezal', 'natural'), 0);
  assert.equal(getInventarioTramosPorPerfilColor(inv, '3', 'cabezal', 'blanco'), 2);
  assert.equal(getInventarioTramosPorPerfilColor(inv, '3', 'cabezal', 'negro'), 4);
  assert.equal(getInventarioTramosPorPerfilColor(inv, '3', 'cabezal', 'madera'), 4);

  // Descuento solo afecta el color solicitado
  const despues = descontarInventarioPorPerfilColor(inv, '3', 'cabezal', 'negro', 2);
  assert.equal(getInventarioTramosPorPerfilColor(despues, '3', 'cabezal', 'negro'), 2);
  assert.equal(getInventarioTramosPorPerfilColor(despues, '3', 'cabezal', 'blanco'), 2);
  assert.equal(getInventarioTramosPorPerfilColor(despues, '3', 'cabezal', 'madera'), 4);
});

test('24. Confirmación obligatoria de correo para activar PIN de 90 días y 1 año', async () => {
  const {
    keyRequiresCloudEmailConfirmation,
    isShortPlanKeyPrefix,
    validateCloudBackupEmailPair,
  } = await import('./alumineroLogic.ts');

  // Claves de 90 días (Q), 1 año (A) y >= 90 días personalizados (D90/D365) requieren correo confirmado
  assert.equal(keyRequiresCloudEmailConfirmation('AP-Q-1A2B3C'), true);
  assert.equal(keyRequiresCloudEmailConfirmation('AP-A-9Z8Y7X'), true);
  assert.equal(keyRequiresCloudEmailConfirmation('AP-D90-123456'), true);
  assert.equal(keyRequiresCloudEmailConfirmation('AP-D365-123456'), true);

  // Claves cortas (3 días G, 30 días M, D15) no son obligatorias
  assert.equal(keyRequiresCloudEmailConfirmation('AP-G-123456'), false);
  assert.equal(keyRequiresCloudEmailConfirmation('AP-M-123456'), false);
  assert.equal(isShortPlanKeyPrefix('AP-M-123456'), true);
  assert.equal(isShortPlanKeyPrefix('AP-G-123456'), true);
  assert.equal(isShortPlanKeyPrefix('AP-Q-123456'), false);

  // Validación de formato y coincidencia exacta
  assert.equal(validateCloudBackupEmailPair('', '').status, 'empty');
  assert.equal(validateCloudBackupEmailPair('correo-malo', 'correo-malo').status, 'invalid_format');
  assert.equal(validateCloudBackupEmailPair('taller@ejemplo.com', '').status, 'pending_confirm');

  const mismatch = validateCloudBackupEmailPair('taller@ejemplo.com', 'otro@ejemplo.com');
  assert.equal(mismatch.status, 'mismatch');
  assert.equal(mismatch.message, 'Los correos no coinciden');

  const ok = validateCloudBackupEmailPair('  Taller@Ejemplo.COM ', 'taller@ejemplo.com');
  assert.equal(ok.status, 'confirmed');
  assert.equal(ok.normalizedEmail, 'taller@ejemplo.com');
  assert.equal(ok.message, 'Correo confirmado');
});

test('25. Invitación estilo Spotify: URL con ?ref y &promo, parser y mensaje de WhatsApp de 3 días', async () => {
  const {
    buildReferralInviteUrl,
    parseReferralFromSearch,
    buildColleaguePromoWhatsappMessage,
    buildColleaguePromoWhatsappUrl,
  } = await import('./alumineroLogic.ts');

  const url = buildReferralInviteUrl('Taller Olmos', 17);
  assert.equal(url, 'https://alumineropro.pages.dev/?ref=Taller+Olmos&promo=17');

  const parsed = parseReferralFromSearch('?ref=Taller%20Olmos&promo=17');
  assert.deepEqual(parsed, { refName: 'Taller Olmos', promoNumber: 17 });
  assert.equal(parseReferralFromSearch(''), null);
  assert.equal(parseReferralFromSearch('?promo=5'), null);

  const msg = buildColleaguePromoWhatsappMessage('Taller Olmos', 'ALM-9X2K', 17);
  assert.equal(
    msg,
    'Hola, me llegó este mensaje de un colega (Taller Olmos) para probar Aluminero Pro. Mi ID de equipo es: ALM-9X2K (Promoción enviada #17). ¿Me compartes mi código de 3 días gratis?'
  );

  const wa10 = buildColleaguePromoWhatsappUrl('5512345678', 'Taller Olmos', 'ALM-9X2K', 17);
  assert.ok(wa10.startsWith('https://wa.me/525512345678?text='));
  assert.ok(decodeURIComponent(wa10).includes('Promoción enviada #17'));

  const waEmpty = buildColleaguePromoWhatsappUrl('', 'Taller Olmos', 'ALM-9X2K', 17);
  assert.ok(waEmpty.startsWith('https://wa.me/?text='));
});

test('26. Levantamiento Rápido: sobrescribe aluminero_hoja_v1.proyecto y propaga área sin conservar modo edición', async () => {
  const {
    LEV_KEYS,
    overwriteHojaProyectoInStorage,
    buildBridgePayloadFromPieza,
    cmFromUnit,
  } = await import('./levantamientoLogic.ts');

  const store = new Map<string, string>();
  store.set(
    LEV_KEYS.hoja,
    JSON.stringify({
      proyecto: 'Cliente Anterior / Default',
      partidas: [{ id: 'p-1', area: 'Patio', totalLinea: 1500 }],
      descuentoPct: 10,
      incluirIva: true,
    })
  );

  const mockStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  assert.equal(overwriteHojaProyectoInStorage('  Carlos Mendoza  ', mockStorage), true);
  const updatedHoja = JSON.parse(store.get(LEV_KEYS.hoja)!);
  assert.equal(updatedHoja.proyecto, 'Carlos Mendoza');
  assert.equal(updatedHoja.partidas.length, 1);
  assert.equal(updatedHoja.descuentoPct, 10);
  assert.equal(updatedHoja.incluirIva, true);

  assert.equal(cmFromUnit('1.5', 'm'), 150);

  const p1 = buildBridgePayloadFromPieza(
    {
      id: 'lv-1',
      tipo: 'Ventana Corrediza',
      area: 'Sala',
      anchoCm: 150,
      altoCm: 100,
      cant: 1,
      notas: '',
      foto: '',
    },
    'Carlos Mendoza',
    'cotizacion'
  );
  assert.equal(p1.unsupportedInModulacion, false);
  assert.equal(p1.payload?.cliente, 'Carlos Mendoza');
  assert.equal(p1.payload?.area, 'Sala');
  assert.equal(p1.payload?.etiqueta, '');

  const p2 = buildBridgePayloadFromPieza(
    {
      id: 'lv-2',
      tipo: 'Ventana Fija',
      area: 'Cocina',
      anchoCm: 120,
      altoCm: 80,
      cant: 2,
      notas: '',
      foto: '',
    },
    'Carlos Mendoza',
    'cotizacion'
  );
  assert.equal(p2.payload?.area, 'Cocina');
  assert.equal(p2.payload?.apertura, 'fija');

  const pUnsupported = buildBridgePayloadFromPieza(
    {
      id: 'lv-3',
      tipo: 'Cancel / Otro',
      area: 'Baño',
      anchoCm: 140,
      altoCm: 190,
      cant: 1,
      notas: '',
      foto: '',
    },
    'Carlos Mendoza',
    'modulacion'
  );
  assert.equal(pUnsupported.unsupportedInModulacion, true);
  assert.equal(pUnsupported.payload, null);
});

test('34. sanitizeWhatsappNumber y validateWhatsappNumber exigen exactamente 10 dígitos obligatorios y rechazan formatos inválidos', () => {
  // Formatos válidos con o sin separadores -> normalizados a exactamente 10 dígitos
  assert.equal(sanitizeWhatsappNumber('5512345678'), '5512345678');
  assert.equal(sanitizeWhatsappNumber('55 1234 5678'), '5512345678');
  assert.equal(sanitizeWhatsappNumber('555-123-4567'), '5551234567');
  assert.equal(sanitizeWhatsappNumber('(555) 123-4567'), '5551234567');
  assert.equal(sanitizeWhatsappNumber('  55.1234.5678  '), '5512345678');
  assert.equal(formatWhatsappUrlDigits('55-1234-5678'), '525512345678');

  // Formatos inválidos -> sanitizeWhatsappNumber devuelve '' y validateWhatsappNumber entrega error descriptivo
  for (const invalidInput of [
    '',
    '   ',
    '12345',
    '551234567',
    '12345678901',
    '5215512345678',
    '+52 55 1234 5678',
    '55abc12345',
    '5512345678a',
  ]) {
    assert.equal(sanitizeWhatsappNumber(invalidInput), '');
    const res = validateWhatsappNumber(invalidInput);
    assert.equal(res.valid, false);
    assert.equal(res.digits, '');
    assert.ok(res.error && res.error.length > 10);
  }

  // Simular localStorage para validar que no se guarda ni sobreescribe con formatos inválidos
  const store = new Map<string, string>();
  const prevLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };

  try {
    const okSave = saveSugerenciasWhatsappValidated('(55) 1234-5678');
    assert.equal(okSave.ok, true);
    assert.equal(okSave.digits, '5512345678');
    assert.equal(loadSugerenciasWhatsapp(), '5512345678');

    // Intento inválido no debe sobreescribir ni borrar el número válido almacenado
    const badSaveShort = saveSugerenciasWhatsappValidated('12345');
    assert.equal(badSaveShort.ok, false);
    assert.match(badSaveShort.error || '', /10 dígitos/);
    assert.equal(loadSugerenciasWhatsapp(), '5512345678');

    const badSaveLada = saveSugerenciasWhatsapp('5215512345678');
    assert.equal(badSaveLada, '5512345678');
    assert.equal(loadSugerenciasWhatsapp(), '5512345678');

    // Limpieza explícita con cadena vacía sí limpia
    assert.equal(saveSugerenciasWhatsapp(''), '');
    assert.equal(loadSugerenciasWhatsapp(), '');
  } finally {
    if (prevLocalStorage === undefined) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
      (globalThis as { localStorage?: unknown }).localStorage = prevLocalStorage;
    }
  }
});

test('35. validatePiezaDimensiones exige ancho y alto mayores a 0 cm y menores a 600 cm', () => {
  // Valores válidos físicamente posibles (> 0 y < 600)
  assert.equal(validatePiezaDimensiones(120, 100).valid, true);
  assert.equal(validatePiezaDimensiones(0.5, 599.5).valid, true);
  assert.equal(validatePiezaDimensiones(20, 210).valid, true);

  // Valores <= 0 son sospechosos
  for (const [w, h] of [
    [0, 100],
    [120, 0],
    [-10, 100],
    [120, -5],
    [0, 0],
  ]) {
    const res = validatePiezaDimensiones(w, h);
    assert.equal(res.valid, false);
    assert.match(res.error || '', /mayores a 0 cm/);
  }

  // Valores >= 600 son sospechosos
  for (const [w, h] of [
    [600, 100],
    [120, 600],
    [750, 100],
    [120, 900],
  ]) {
    const res = validatePiezaDimensiones(w, h);
    assert.equal(res.valid, false);
    assert.match(res.error || '', /menores a 600 cm/);
  }

  // Valores no finitos
  assert.equal(validatePiezaDimensiones(Number.NaN, 100).valid, false);
  assert.equal(validatePiezaDimensiones(120, Number.POSITIVE_INFINITY).valid, false);
});

test('36. Recordatorios Push de cotizaciones pendientes: creación, vencimiento, cooldown, posponer y estados', () => {
  const baseNow = 1_700_000_000_000;

  // Rechaza proyecto vacío o teléfono inválido
  const emptyProj = createCotizacionReminder({
    proyecto: '   ',
    total: 5000,
    partidasCount: 2,
    dueAt: baseNow + 60_000,
    now: baseNow,
  });
  assert.equal(emptyProj.ok, false);

  const badPhone = createCotizacionReminder({
    proyecto: 'Casa López',
    total: 5000,
    partidasCount: 2,
    telefonoCliente: '12345',
    dueAt: baseNow + 60_000,
    now: baseNow,
  });
  assert.equal(badPhone.ok, false);

  // Crea recordatorio válido normalizando teléfono a 10 dígitos
  const r1Res = createCotizacionReminder({
    id: 'rem-due',
    proyecto: 'Casa Sr. Ramírez',
    total: 12500.5,
    partidasCount: 3,
    telefonoCliente: '(55) 1234-5678',
    nota: 'Confirmar anticipo 50%',
    dueAt: baseNow - 5 * 60_000,
    now: baseNow - 60 * 60_000,
  });
  assert.equal(r1Res.ok, true);
  if (!r1Res.ok) return;
  assert.equal(r1Res.reminder.telefonoCliente, '5512345678');
  assert.equal(r1Res.reminder.status, 'pendiente');

  const due24h = computeReminderDueAt('24h', baseNow);
  assert.equal(due24h, baseNow + 24 * 60 * 60 * 1000);
  const r2Res = createCotizacionReminder({
    id: 'rem-future',
    proyecto: 'Residencia Lomas',
    total: 24000,
    partidasCount: 5,
    dueAt: due24h,
    now: baseNow,
  });
  assert.equal(r2Res.ok, true);
  if (!r2Res.ok) return;

  // Solo el vencido pendiente debe aparecer en getDueCotizacionReminders
  const dueList = getDueCotizacionReminders([r1Res.reminder, r2Res.reminder], baseNow);
  assert.equal(dueList.length, 1);
  assert.equal(dueList[0].id, 'rem-due');

  // Después de notificar, respeta cooldown
  const notified = markReminderNotified(r1Res.reminder, baseNow);
  assert.equal(getDueCotizacionReminders([notified, r2Res.reminder], baseNow + 60_000).length, 0);
  // Al vencer el cooldown (4 h), vuelve a considerarse pendiente por notificar
  assert.equal(
    getDueCotizacionReminders([notified, r2Res.reminder], baseNow + 4 * 60 * 60 * 1000 + 1).length,
    1
  );

  // Posponer 1 día mueve dueAt al futuro y reinicia lastNotifiedAt
  const snoozed = snoozeCotizacionReminder(notified, undefined, baseNow);
  assert.equal(snoozed.snoozeCount, 1);
  assert.equal(snoozed.lastNotifiedAt, null);
  assert.ok(snoozed.dueAt >= baseNow + 24 * 60 * 60 * 1000);
  assert.equal(getDueCotizacionReminders([snoozed], baseNow + 1000).length, 0);

  // Cambio de estado a aprobada lo mueve a completed
  const approved = updateCotizacionReminderStatus(snoozed, 'aprobada');
  const part = partitionCotizacionReminders([approved, r2Res.reminder], baseNow);
  assert.equal(part.due.length, 0);
  assert.equal(part.upcoming.length, 1);
  assert.equal(part.completed.length, 1);
  assert.equal(part.completed[0].status, 'aprobada');

  const relOverdue = formatReminderRelativeTime(baseNow - 15 * 60_000, baseNow);
  assert.equal(relOverdue.isOverdue, true);
  assert.match(relOverdue.label, /Vencido hace 15 min/);
});

test('37. Payloads de Service Worker Push, parser SW y persistencia de recordatorios en localStorage', () => {
  const created = createCotizacionReminder({
    id: 'rem-sw-1',
    proyecto: 'Local Comercial Centro',
    total: 8900,
    partidasCount: 2,
    nota: 'Cotización con IVA',
    dueAt: 1_700_000_000_000,
    now: 1_699_990_000_000,
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;

  const swPayload = buildQuoteReminderNotificationPayload(created.reminder);
  assert.equal(swPayload.title, 'Seguimiento pendiente: Local Comercial Centro');
  assert.match(swPayload.body, /8,900\.00/);
  assert.match(swPayload.body, /2 partidas/);
  assert.equal(swPayload.tag, 'aluminero-quote-rem-sw-1');
  assert.equal(swPayload.data.reminderId, 'rem-sw-1');
  assert.equal(swPayload.actions.length, 2);
  assert.equal(swPayload.actions[0].action, 'open-quote');
  assert.equal(swPayload.actions[1].action, 'snooze-1d');

  // Parser SW tolera JSON serializado, texto plano o estructura vacía
  const parsedJson = parseSwPushPayload(JSON.stringify(swPayload));
  assert.equal(parsedJson.title, swPayload.title);
  assert.equal(parsedJson.data.reminderId, 'rem-sw-1');

  const parsedText = parseSwPushPayload('Revisar cotización de Sr. Pérez');
  assert.equal(parsedText.body, 'Revisar cotización de Sr. Pérez');
  assert.equal(parsedText.data.type, 'quote-followup');

  // Persistencia simulada en localStorage
  const store = new Map<string, string>();
  const prevLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };
  try {
    saveCotizacionReminders([created.reminder]);
    const loaded = loadCotizacionReminders();
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'rem-sw-1');
    assert.equal(loaded[0].proyecto, 'Local Comercial Centro');
  } finally {
    if (prevLocalStorage === undefined) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
      (globalThis as { localStorage?: unknown }).localStorage = prevLocalStorage;
    }
  }
});

test('38. Personalización de encabezado PDF: temas, logo, contacto, eslogan y modos cotización/técnico/contrato', () => {
  const defaultSpec = buildPdfHeaderSpec(DEFAULT_TALLER, 'cotizacion', { dateLabel: '21/11/2026' });
  assert.equal(defaultSpec.theme.id, 'navy');
  assert.equal(defaultSpec.showLogo, false);
  assert.equal(defaultSpec.headline, 'COTIZACIÓN DE ALUMINIO Y VIDRIO');
  assert.equal(defaultSpec.contactParts.length, 0);
  assert.equal(defaultSpec.headerHeightMm, 30);

  const customTaller = {
    ...DEFAULT_TALLER,
    nombre: 'Aluminios del Valle',
    tel: '55 8899 1122',
    ubicacion: 'Av. Reforma 120, Puebla',
    logoDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    pdfHeader: {
      mostrarLogo: true,
      mostrarContacto: true,
      eslogan: 'Cancelería Residencial y Vidrio Templado',
      email: 'ventas@aluminiosdelvalle.mx',
      sitioWeb: '@aluminiosdelvalle',
      rfc: 'alva900101abc',
      colorTema: 'emerald' as const,
      tituloCotizacion: 'Presupuesto Formal',
    },
  };

  const quoteSpec = buildPdfHeaderSpec(customTaller, 'cotizacion', { dateLabel: '21/11/2026' });
  assert.equal(quoteSpec.theme.id, 'emerald');
  assert.deepEqual(quoteSpec.theme.bgRgb, PDF_HEADER_THEMES.emerald.bgRgb);
  assert.equal(quoteSpec.showLogo, true);
  assert.equal(quoteSpec.headline, 'Aluminios del Valle');
  assert.equal(quoteSpec.documentLabel, 'PRESUPUESTO FORMAL');
  assert.equal(quoteSpec.eslogan, 'Cancelería Residencial y Vidrio Templado');
  assert.deepEqual(quoteSpec.contactParts, [
    'Tel: 55 8899 1122',
    'ventas@aluminiosdelvalle.mx',
    'Av. Reforma 120, Puebla',
    '@aluminiosdelvalle',
    'RFC: ALVA900101ABC',
  ]);
  assert.equal(quoteSpec.headerHeightMm, 37);
  assert.equal(quoteSpec.bodyStartY, 46);

  const techSpec = buildPdfHeaderSpec(customTaller, 'tecnico', { dateLabel: '21/11/2026' });
  assert.equal(techSpec.headline, 'Aluminios del Valle');
  assert.equal(techSpec.documentLabel, 'ORDEN TÉCNICA DE CORTE');

  const contractSpec = buildPdfHeaderSpec(customTaller, 'contrato', { dateLabel: '21/11/2026' });
  assert.equal(contractSpec.headline, 'CONTRATO DE PRESTACIÓN DE SERVICIOS');
  assert.equal(contractSpec.workshopName, 'Aluminios del Valle');
  assert.equal(contractSpec.headerHeightMm, 38);

  // Al ocultar logo y contacto en toggles, el logo/contacto dejan de mostrarse sin borrar los datos
  const hiddenSpec = buildPdfHeaderSpec(
    {
      ...customTaller,
      pdfHeader: {
        ...customTaller.pdfHeader,
        mostrarLogo: false,
        mostrarContacto: false,
      },
    },
    'cotizacion'
  );
  assert.equal(hiddenSpec.showLogo, false);
  assert.equal(hiddenSpec.contactParts.length, 0);

  // Color desconocido cae limpiamente a navy
  const normalized = resolvePdfHeaderConfig({
    ...DEFAULT_TALLER,
    pdfHeader: { colorTema: 'invalid-theme' as never },
  });
  assert.equal(normalized.colorTema, DEFAULT_PDF_HEADER.colorTema);
});

test('39. loadTaller mantiene compatibilidad retroactiva al cargar talleres sin pdfHeader en localStorage', () => {
  const store = new Map<string, string>();
  const prevLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  };

  try {
    // Caso 1: registro antiguo guardado sin propiedad pdfHeader
    store.set(
      'aluminero_taller_v1',
      JSON.stringify({
        nombre: 'Taller Clásico',
        tel: '2223334455',
        ubicacion: 'Puebla',
      })
    );
    const legacyLoaded = loadTaller();
    assert.equal(legacyLoaded.nombre, 'Taller Clásico');
    assert.equal(legacyLoaded.pdfHeader?.mostrarLogo, true);
    assert.equal(legacyLoaded.pdfHeader?.mostrarContacto, true);
    assert.equal(legacyLoaded.pdfHeader?.colorTema, 'navy');

    // Caso 2: guardado y lectura con personalización parcial
    saveTaller({
      ...legacyLoaded,
      pdfHeader: {
        ...legacyLoaded.pdfHeader,
        colorTema: 'blue',
        email: 'contacto@clasico.mx',
      },
    });
    const updatedLoaded = loadTaller();
    assert.equal(updatedLoaded.pdfHeader?.colorTema, 'blue');
    assert.equal(updatedLoaded.pdfHeader?.email, 'contacto@clasico.mx');
    assert.equal(updatedLoaded.pdfHeader?.mostrarLogo, true);
  } finally {
    if (prevLocalStorage === undefined) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
      (globalThis as { localStorage?: unknown }).localStorage = prevLocalStorage;
    }
  }
});

test('40. Escalado (zoom), alineación (izq/centro/der) y conservación de aspecto del logotipo PDF en distintos formatos', () => {
  // Clamp y normalización segura
  assert.equal(clampLogoZoomPct(undefined), 100);
  assert.equal(clampLogoZoomPct(25), 60);
  assert.equal(clampLogoZoomPct(260), 150);
  assert.equal(clampLogoZoomPct(124.6), 125);
  assert.equal(normalizeLogoAlign('center'), 'center');
  assert.equal(normalizeLogoAlign('right'), 'right');
  assert.equal(normalizeLogoAlign('invalid'), 'left');

  // Logo cuadrado (1:1) al 60%, 100% y 150%
  const sq60 = computePdfLogoMetrics({ naturalWidth: 300, naturalHeight: 300, zoomPct: 60, align: 'left' });
  const sq100 = computePdfLogoMetrics({ naturalWidth: 300, naturalHeight: 300, zoomPct: 100, align: 'left' });
  const sq150 = computePdfLogoMetrics({ naturalWidth: 300, naturalHeight: 300, zoomPct: 150, align: 'left' });
  assert.equal(sq100.drawW, sq100.drawH);
  assert.ok(sq60.frameW < sq100.frameW);
  assert.ok(sq150.frameW > sq100.frameW);

  // Logo horizontal panorámico (3:1): conserva relación de aspecto sin superar el ancho máximo
  const wideLeft = computePdfLogoMetrics({ naturalWidth: 600, naturalHeight: 200, zoomPct: 100, align: 'left' });
  assert.equal(wideLeft.aspectRatio, 3);
  assert.ok(wideLeft.drawW <= 42);
  assert.ok(Math.abs(wideLeft.drawW / wideLeft.drawH - 3) < 0.05);

  const wideCenter = computePdfLogoMetrics({ naturalWidth: 600, naturalHeight: 200, zoomPct: 120, align: 'center' });
  assert.ok(wideCenter.drawW > wideLeft.drawW);
  assert.ok(wideCenter.drawW <= 72);

  // Logo vertical alto (1:2): conserva proporción vertical
  const tallRight = computePdfLogoMetrics({ naturalWidth: 150, naturalHeight: 300, zoomPct: 100, align: 'right' });
  assert.equal(tallRight.aspectRatio, 0.5);
  assert.ok(Math.abs(tallRight.drawW / tallRight.drawH - 0.5) < 0.05);

  // Altura del encabezado crece automáticamente para evitar cortes al centrar o ampliar el logo
  const tallerConLogo = {
    ...DEFAULT_TALLER,
    nombre: 'Vidrios Norte',
    logoDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    pdfHeader: {
      mostrarLogo: true,
      logoZoomPct: 140,
      logoAlign: 'center' as const,
    },
  };
  const centerSpec = buildPdfHeaderSpec(tallerConLogo, 'cotizacion', {
    dateLabel: '21/11/2026',
    naturalLogoWidth: 400,
    naturalLogoHeight: 200,
  });
  assert.equal(centerSpec.logoAlign, 'center');
  assert.equal(centerSpec.logoZoomPct, 140);
  assert.ok(centerSpec.headerHeightMm >= 46);
  assert.equal(centerSpec.bodyStartY, centerSpec.headerHeightMm + 9);

  // Valores por defecto en resolvePdfHeaderConfig
  const resolved = resolvePdfHeaderConfig({ ...DEFAULT_TALLER, pdfHeader: {} });
  assert.equal(resolved.logoZoomPct, 100);
  assert.equal(resolved.logoAlign, 'left');
});

test('41. Reporte de Historial de Cotizaciones para exportación a PDF calcula filas, piezas y total acumulado', () => {
  const emptyReport = buildHistorialPdfReport([]);
  assert.equal(emptyReport.totalCotizaciones, 0);
  assert.equal(emptyReport.totalPiezas, 0);
  assert.equal(emptyReport.montoAcumulado, 0);

  const histSpec = buildPdfHeaderSpec(
    { ...DEFAULT_TALLER, nombre: 'Taller Central' },
    'historial',
    { dateLabel: '21/11/2026' }
  );
  assert.equal(histSpec.documentLabel, 'HISTORIAL DE COTIZACIONES');
  assert.equal(histSpec.headline, 'Taller Central');

  const report = buildHistorialPdfReport([
    {
      id: 'h-1',
      referencia: 'Sala Residencia Norte',
      fecha: '20/11/2026',
      linea: '3',
      anchoCm: 150,
      altoCm: 120,
      color: 'natural',
      cantidad: 2,
      total: 10260,
    },
    {
      id: 'h-2',
      referencia: 'Puerta Acceso Principal',
      fecha: '21/11/2026',
      linea: 'puerta-abatible',
      anchoCm: 95,
      altoCm: 215,
      color: 'negro',
      cantidad: 1,
      total: 7965.75,
    },
  ]);

  assert.equal(report.totalCotizaciones, 2);
  assert.equal(report.totalPiezas, 3);
  assert.equal(report.montoAcumulado, 18225.75);
  assert.match(report.montoAcumuladoFormatted, /18,225\.75/);
  assert.equal(report.rows[0].index, 1);
  assert.equal(report.rows[0].referencia, 'Sala Residencia Norte');
  assert.match(report.rows[0].especificacion, /150×120 cm/);
  assert.equal(report.rows[1].index, 2);
  assert.match(report.rows[1].especificacion, /95×215 cm/);
  assert.match(report.rows[1].totalFormatted, /7,965\.75/);
});

test('42. Guía de activación de notificaciones Push (default, denied, granted, unsupported/iOS) y solicitud de permisos', async () => {
  const guideDefaultPending = getPushPermissionGuide(
    { supported: true, swSupported: true, pushSupported: true, permission: 'default' },
    { swReady: true, pendingCount: 3 }
  );
  assert.equal(guideDefaultPending.status, 'default');
  assert.equal(guideDefaultPending.needsAction, true);
  assert.equal(guideDefaultPending.canRequestDirectly, true);
  assert.match(guideDefaultPending.headline, /3 cotización\(es\) pendiente\(s\)/);
  assert.equal(guideDefaultPending.steps.length, 3);
  assert.equal(guideDefaultPending.ctaLabel, 'Activar notificaciones Push');

  const guideDenied = getPushPermissionGuide(
    { supported: true, swSupported: true, pushSupported: true, permission: 'denied' },
    { swReady: false, pendingCount: 2 }
  );
  assert.equal(guideDenied.status, 'denied');
  assert.equal(guideDenied.needsAction, true);
  assert.equal(guideDenied.canRequestDirectly, false);
  assert.match(guideDenied.headline, /2 seguimiento\(s\) pendiente\(s\)/);
  assert.match(guideDenied.steps[0], /candado/i);
  assert.equal(guideDenied.ctaLabel, 'Verificar permiso ahora');

  const guideGranted = getPushPermissionGuide(
    { supported: true, swSupported: true, pushSupported: true, permission: 'granted' },
    { swReady: true, pendingCount: 4 }
  );
  assert.equal(guideGranted.status, 'granted');
  assert.equal(guideGranted.needsAction, false);
  assert.equal(guideGranted.badgeLabel, 'Push SW Activo ✓');
  assert.match(guideGranted.description, /4 seguimiento\(s\) pendiente\(s\)/);
  assert.equal(guideGranted.ctaLabel, null);

  const guideIosBrowser = getPushPermissionGuide(
    { supported: false, swSupported: false, pushSupported: false, permission: 'unsupported' },
    { isAppleMobile: true, isStandalone: false }
  );
  assert.equal(guideIosBrowser.status, 'unsupported');
  assert.equal(guideIosBrowser.needsAction, true);
  assert.match(guideIosBrowser.headline, /iOS/);
  assert.equal(guideIosBrowser.steps.length, 3);

  const guideUnsupportedDesktop = getPushPermissionGuide(
    { supported: false, swSupported: false, pushSupported: false, permission: 'unsupported' },
    { isAppleMobile: false, isStandalone: false }
  );
  assert.equal(guideUnsupportedDesktop.needsAction, false);
  assert.equal(guideUnsupportedDesktop.steps.length, 0);

  assert.equal(await requestPushNotificationPermission(), 'unsupported');

  const g = globalThis as Record<string, unknown>;
  const prevWindow = g.window;
  const prevNotification = g.Notification;
  try {
    const fakeNotification = {
      permission: 'default' as NotificationPermission,
      requestPermission: (cb?: (perm: NotificationPermission) => void) => {
        fakeNotification.permission = 'granted';
        if (cb) cb('granted');
        return Promise.resolve('granted' as NotificationPermission);
      },
    };
    g.Notification = fakeNotification;
    g.window = { Notification: fakeNotification };
    const requested = await requestPushNotificationPermission();
    assert.equal(requested, 'granted');
  } finally {
    if (prevWindow === undefined) delete g.window;
    else g.window = prevWindow;
    if (prevNotification === undefined) delete g.Notification;
    else g.Notification = prevNotification;
  }
});

test('53. Folio de cotización COT-AAAA-NNN: peek no incrementa y solo issue avanza el contador', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  assert.equal(formatCotizacionFolio(1, 2026), 'COT-2026-001');
  assert.equal(peekNextCotizacionFolio(2026, mockStorage), 'COT-2026-001');
  assert.equal(peekNextCotizacionFolio(2026, mockStorage), 'COT-2026-001');
  assert.equal(store.get(KEYS.COT_COUNTER), undefined);

  const issued1 = issueNextCotizacionFolio(2026, mockStorage);
  assert.equal(issued1, 'COT-2026-001');
  assert.equal(store.get(KEYS.COT_ACTUAL), 'COT-2026-001');
  assert.equal(getSavedCurrentCotizacionFolio(2026, mockStorage), 'COT-2026-001');
  assert.equal(peekNextCotizacionFolio(2026, mockStorage), 'COT-2026-002');

  const issued2 = issueNextCotizacionFolio(2026, mockStorage);
  assert.equal(issued2, 'COT-2026-002');
  assert.equal(store.get(KEYS.COT_ACTUAL), 'COT-2026-002');
});

test('54. Encabezado PDF no repite Fecha junto a Tel y separa ubicacionLine', () => {
  const spec = buildPdfHeaderSpec(
    {
      ...DEFAULT_TALLER,
      nombre: 'Aluminios del Centro',
      tel: '735-163-1532',
      ubicacion: 'Av. Reforma #120, Col. Centro',
    },
    'cotizacion',
    { dateLabel: '19/11/2026' }
  );
  assert.equal(spec.ubicacionLine, 'Av. Reforma #120, Col. Centro');
  assert.ok(spec.contactPrimary.includes('Tel: 735-163-1532'));
  assert.equal(spec.contactPrimary.toLowerCase().includes('fecha:'), false);
});

test('55. Libreta de clientes (aluminero_clientes_v1) y Historial de cotizaciones (estados + filtro)', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  upsertCliente(
    { nombre: 'Cliente General', telefono: '000', direccion: 'Nada' },
    mockStorage
  );
  assert.equal(loadClientes(mockStorage).length, 0);

  upsertCliente(
    { nombre: 'Sr. Juan Pérez', telefono: '735-163-1532', direccion: 'Col. Centro #45' },
    mockStorage
  );
  upsertCliente(
    { nombre: 'Sr. Juan Pérez', telefono: '735-999-0000' },
    mockStorage
  );
  const clients = loadClientes(mockStorage);
  assert.equal(clients.length, 1);
  assert.equal(clients[0].telefono, '735-999-0000');
  assert.equal(clients[0].direccion, 'Col. Centro #45');

  recordCotizacionGuardada(
    {
      folio: 'COT-2026-001',
      fecha: '19/11/2026',
      cliente: 'Sr. Juan Pérez',
      total: 12500,
      piezasCount: 3,
    },
    mockStorage
  );
  recordCotizacionGuardada(
    {
      folio: 'COT-2026-002',
      fecha: '19/11/2026',
      cliente: 'Arq. Laura Gómez',
      total: 8400,
      piezasCount: 2,
    },
    mockStorage
  );
  const saved = loadCotizacionesGuardadas(mockStorage);
  assert.equal(saved.length, 2);
  assert.equal(saved[0].estado, 'enviada');

  const updated = updateCotizacionEstado(saved[0].id, 'aprobada', mockStorage);
  assert.equal(filterCotizacionesByEstado(updated, 'aprobada').length, 1);
  assert.equal(filterCotizacionesByEstado(updated, 'enviada').length, 1);
});

test('56. Levantamiento: migración ref -> direccion, fusión JSON sin duplicados y resumen WhatsApp', () => {
  assert.equal(LEV_KEYS.activo, 'aluminero_lev_activo_v1');
  const migrated = normalizeLevantamientoDraft({
    id: 'lv-1',
    cliente: 'Sr. Carlos',
    ref: 'Av. Juárez 88',
    fecha: '19/11/2026',
    piezas: [{ id: 'p-1', tipo: 'Ventana Corrediza', area: 'Sala', anchoCm: 120, altoCm: 100, cant: 1, notas: '', foto: '' }],
  });
  assert.equal(migrated.direccion, 'Av. Juárez 88');

  const merged = mergeLevantamientosBackup(
    [migrated],
    [
      { ...migrated, telefono: '735-111-2233' },
      {
        id: 'lv-2',
        cliente: 'Sra. Ana',
        telefono: '555-123-4567',
        direccion: 'Col. Norte',
        fecha: '20/11/2026',
        piezas: [{ id: 'p-2', tipo: 'Puerta', area: 'Entrada', anchoCm: 90, altoCm: 210, cant: 1, notas: '', foto: '' }],
      },
    ]
  );
  assert.equal(merged.merged.length, 2);
  assert.equal(merged.addedCount, 1);
  assert.equal(merged.updatedCount, 1);

  const wa = buildLevantamientoWhatsappText({
    ...migrated,
    telefono: '735-111-2233',
  });
  assert.match(wa, /Teléfono: 735-111-2233/);
  assert.match(wa, /Dirección: Av\. Juárez 88/);
});

test('57. Plano corredizo 2 y 3 hojas recorre 100% de leafW y ciclo rAF respeta pausas', () => {
  const leafW = 130;
  assert.equal(
    computeCorredizaLeafTranslateX({ numHojas: 2, idx: 1, leafW, t: 1, invertido: false, slideOffset: -90 }),
    -130
  );
  assert.equal(
    computeCorredizaLeafTranslateX({ numHojas: 2, idx: 0, leafW, t: 1, invertido: true, slideOffset: 90 }),
    130
  );
  assert.equal(
    computeCorredizaLeafTranslateX({ numHojas: 3, idx: 1, leafW: 86, t: 1, invertido: false, slideOffset: -90 }),
    -86
  );

  assert.equal(computeSimProgressFromElapsed(0), 0);
  assert.equal(computeSimProgressFromElapsed(SIM_OPEN_MS + 200), 100);
  assert.equal(computeSimProgressFromElapsed(SIM_OPEN_MS + SIM_PAUSE_OPEN_MS + SIM_CLOSE_MS + 100), 0);
  assert.equal(computeSimProgressFromElapsed(SIM_CYCLE_MS), 0);
});

test('58. Pila LIFO de capas de historial cierra solo la capa superior (PDF sheet -> visor -> firma)', () => {
  clearHistoryOverlayStack();
  const closed: string[] = [];

  pushHistoryOverlay('pdf-sheet', () => closed.push('sheet'));
  const viewerTok = pushHistoryOverlay('pdf-viewer', () => closed.push('viewer'));
  pushHistoryOverlay('signature-pad', () => closed.push('signature'));

  assert.equal(getHistoryOverlayDepth(), 3);
  assert.equal(consumeTopHistoryOverlay(), true);
  assert.deepEqual(closed, ['signature']);
  assert.equal(getHistoryOverlayDepth(), 2);

  // Remover por token sin afectar otras capas
  removeHistoryOverlay(viewerTok);
  assert.equal(getHistoryOverlayDepth(), 1);

  assert.equal(consumeTopHistoryOverlay(), true);
  assert.deepEqual(closed, ['signature', 'sheet']);
  assert.equal(consumeTopHistoryOverlay(), false);
});

test('59. Análisis de Ventas: ticket promedio, tasa de aprobación y materiales más consumidos', () => {
  const res = computeSalesAnalytics({
    cotizacionesGuardadas: [
      {
        id: 'q1',
        folio: 'COT-2026-001',
        fecha: '20/11/2026',
        cliente: 'Casa Sur',
        total: 15000,
        piezasCount: 4,
        estado: 'aprobada',
        materiales: [
          { id: 'cabezal', nombre: 'Cabezal 3" (7836)', codigo: '7836', linea: 'Línea 3"', cantidad: 6, unidad: 'tramos' },
          { id: 'riel', nombre: 'Riel 3" (7857)', codigo: '7857', linea: 'Línea 3"', cantidad: 4, unidad: 'tramos' },
        ],
      },
      {
        id: 'q2',
        folio: 'COT-2026-002',
        fecha: '21/11/2026',
        cliente: 'Depto Centro',
        total: 25000,
        piezasCount: 5,
        estado: 'aprobada',
        materiales: [
          { id: 'cabezal', nombre: 'Cabezal 3" (7836)', codigo: '7836', linea: 'Línea 3"', cantidad: 8, unidad: 'tramos' },
          { id: 'jamba', nombre: 'Jamba 3" (7825)', codigo: '7825', linea: 'Línea 3"', cantidad: 10, unidad: 'tramos' },
        ],
      },
      {
        id: 'q3',
        folio: 'COT-2026-003',
        fecha: '21/11/2026',
        cliente: 'No aprobada',
        total: 99000,
        piezasCount: 10,
        estado: 'enviada',
        materiales: [
          { id: 'ignorado', nombre: 'Perfil Ignorado', linea: 'Línea 2"', cantidad: 99, unidad: 'tramos' },
        ],
      },
      {
        id: 'q4',
        folio: 'COT-2026-004',
        fecha: '21/11/2026',
        cliente: 'Rechazada',
        total: 50000,
        piezasCount: 2,
        estado: 'rechazada',
      },
    ],
  });

  assert.equal(res.approvedCount, 2);
  assert.equal(res.sentCount, 1);
  assert.equal(res.rejectedCount, 1);
  assert.equal(res.approvalRatePct, 50);
  assert.equal(res.totalApprovedRevenue, 40000);
  assert.equal(res.averageTicket, 20000);
  assert.equal(res.minTicket, 15000);
  assert.equal(res.maxTicket, 25000);
  assert.equal(res.topMaterials[0].nombre, 'Cabezal 3" (7836)');
  assert.equal(res.topMaterials[0].cantidad, 14);
  assert.equal(res.topMaterials[1].nombre, 'Jamba 3" (7825)');
  assert.equal(res.topMaterials[1].cantidad, 10);
  assert.ok(!res.topMaterials.some((m) => m.nombre === 'Perfil Ignorado'));
});

test('60. Levantamiento Rápido: validación realista bloquea 10×11 cm y acepta medidas de obra reales', () => {
  const absurd = validateRealisticOpeningDimensions(10, 11, 'Ventana Corrediza');
  assert.equal(absurd.valid, false);
  assert.ok(absurd.error && absurd.error.length > 10);

  const tinyWindow = validateRealisticOpeningDimensions(25, 25, 'Ventana Corrediza');
  assert.equal(tinyWindow.valid, false);

  const goodWindow = validateRealisticOpeningDimensions(120, 100, 'Ventana Corrediza');
  assert.equal(goodWindow.valid, true);

  const tinyDoor = validateRealisticOpeningDimensions(40, 120, 'Puerta Batiente');
  assert.equal(tinyDoor.valid, false);

  const goodDoor = validateRealisticOpeningDimensions(90, 210, 'Puerta Batiente');
  assert.equal(goodDoor.valid, true);

  const giant = validateRealisticOpeningDimensions(750, 200, 'Ventana Fija');
  assert.equal(giant.valid, false);
});

test('61. Teléfono placeholder aleatorio MX (10 dígitos, nunca 735-163-1532)', () => {
  for (let i = 0; i < 15; i += 1) {
    const ph = generateRandomMxPhonePlaceholder(() => (i * 0.13 + 0.05) % 0.99);
    const digits = ph.replace(/\D/g, '');
    assert.equal(digits.length, 10);
    assert.ok(!ph.includes('735-163-1532') && !digits.includes('7351631532'));
  }
});

test('62. Catálogo completo de líneas de aluminio en México y detección de plan 1 año', () => {
  const cats = new Set(MEXICO_ALUMINUM_CATEGORIES.map((c) => c.id));
  assert.ok(cats.has('nacional'));
  assert.ok(cats.has('espanola'));
  assert.ok(cats.has('europea'));
  assert.ok(cats.has('estructural'));

  const nombres = MEXICO_ALUMINUM_SYSTEMS.map((s) => s.nombre).join(' | ');
  for (const token of ['1 ⅜"', '1 ½"', '2"', '3"', '4"', '4 ½"', '1400', '3500', '4000', '4600', '10000', 'Muro Cortina', 'PTR', 'V-Slot']) {
    assert.ok(nombres.includes(token), `Falta sistema comercial: ${token}`);
  }

  assert.equal(
    resolveLineaFromLevantamiento({ id: '1', tipo: 'Ventana Corrediza', area: 'Sala', anchoCm: 120, altoCm: 100, cant: 1, notas: '', foto: '', lineaPerfil: 'Línea Española 4600' }).linea,
    'europea'
  );
  assert.equal(
    resolveLineaFromLevantamiento({ id: '2', tipo: 'Ventana Corrediza', area: 'Sala', anchoCm: 120, altoCm: 100, cant: 1, notas: '', foto: '', lineaPerfil: 'Eurovent Serie 70' }).linea,
    'europea'
  );
  assert.equal(
    resolveLineaFromLevantamiento({ id: '3', tipo: 'Ventana Corrediza', area: 'Sala', anchoCm: 120, altoCm: 100, cant: 1, notas: '', foto: '', lineaPerfil: 'Nacional 2"' }).linea,
    '2'
  );

  assert.equal(isOneYearProPlan({ planCode: 'A' }), true);
  assert.equal(isOneYearProPlan({ planCode: 'M' }), false);
  assert.equal(isOneYearProPlan({ dias: 365 }), true);
  assert.equal(isOneYearProPlan({ planLabel: 'Plan 1 Año PRO' }), true);
});

test('63. Vidrio claro por defecto en todos los catálogos de vidrio', () => {
  assert.equal(VIDRIOS_CONFIG.claro6.nombre, 'Vidrio claro 6 mm');
  assert.equal(VIDRIOS_CONFIG.claro4.nombre, 'Vidrio claro 4 mm');
  const flotClaro = PANEL_RELLENO_CATALOGO.find((p) => p.id === 'flot-claro');
  assert.equal(flotClaro?.nombre, 'Vidrio claro');
  assert.equal(LEV_COLOR_VIDRIO_OPTS[0].label, 'Vidrio claro');
});

test('64. Validación específica de campos faltantes al agregar medidas en Levantamiento Rápido', () => {
  const allMissing = validateLevantamientoRequiredFields({
    cliente: '   ',
    anchoRaw: '',
    altoRaw: '',
    lineaPerfil: 'Línea 3"',
  });
  assert.equal(allMissing.valid, false);
  assert.deepEqual(allMissing.missingFields, ['Nombre del cliente', 'Ancho', 'Alto']);
  assert.equal(allMissing.firstMissingKey, 'cliente');
  assert.match(allMissing.message, /Nombre del cliente, Ancho y Alto/);

  const onlyAlto = validateLevantamientoRequiredFields({
    cliente: 'Juan Pérez',
    anchoRaw: '120',
    altoRaw: '0',
    lineaPerfil: 'Línea 3"',
  });
  assert.equal(onlyAlto.valid, false);
  assert.deepEqual(onlyAlto.missingFields, ['Alto']);
  assert.equal(onlyAlto.firstMissingKey, 'alto');
  assert.match(onlyAlto.message, /Alto/);

  const customPerfilMissing = validateLevantamientoRequiredFields({
    cliente: 'Juan Pérez',
    anchoRaw: '120',
    altoRaw: '100',
    lineaPerfil: 'Otra',
    lineaPerfilOtro: '  ',
  });
  assert.equal(customPerfilMissing.valid, false);
  assert.equal(customPerfilMissing.firstMissingKey, 'lineaPerfilOtro');

  const ok = validateLevantamientoRequiredFields({
    cliente: 'Juan Pérez',
    anchoRaw: '120',
    altoRaw: '100',
    lineaPerfil: 'Línea 3"',
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.missingFields.length, 0);
});

test('65. Mosquitero abatible disponible en Levantamiento y con despiece completo', () => {
  assert.ok(LEV_TIPOS.includes('Mosquitero abatible'));
  assert.ok(LINEAS_CONFIG['mosq-abatible']);
  assert.equal(LINEAS_CONFIG['mosq-abatible'].esMosquitero, true);

  const resolved = resolveLineaFromLevantamiento({
    id: 'm1',
    tipo: 'Mosquitero abatible',
    area: 'Puerta patio',
    anchoCm: 95,
    altoCm: 210,
    cant: 1,
    notas: '',
    foto: '',
  });
  assert.equal(resolved.linea, 'mosq-abatible');
  assert.equal(resolved.apertura, 'abatible');

  const d = calcularDespiece({
    linea: 'mosq-abatible',
    anchoCm: 95,
    altoCm: 210,
    color: 'blanco',
    vidrio: 'claro6',
    hojas: 1,
    apertura: 'abatible',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 2,
    tolerancias: LINEAS_CONFIG['mosq-abatible'].toleranciasDefault,
  });
  assert.ok(d.perfiles.some((p) => p.perfilId === 'mosq_marco'));
  assert.ok(d.perfiles.some((p) => p.perfilId === 'alumer_5844'));
  assert.ok(d.herrajes.some((h) => h.nombre.toLowerCase().includes('bisagra')));
  assert.ok(d.telaMosquiteraM2 > 0);
  assert.ok(d.colaDeRataM > 0);
});

test('66. Modulación multi-trabajo consolida perfiles, tramos 6.10m y TODOS los vidrios seleccionados', () => {
  const res = aggregateModulacionJobs([
    {
      id: 'j1',
      etiqueta: 'Sala · Ventana Corrediza',
      modeloId: 'win-corrediza',
      conMosquitero: false,
      serieId: 'linea-3',
      sublineaId: 'comercial-hermetica',
      anchoCm: 150,
      altoCm: 120,
      cantidad: 2,
      vidrioLabel: 'Claro 6 mm',
    },
    {
      id: 'j2',
      etiqueta: 'Recámara · Ventana Fija',
      modeloId: 'win-fija',
      conMosquitero: false,
      serieId: 'linea-3',
      sublineaId: 'economica-hermetica',
      anchoCm: 100,
      altoCm: 100,
      cantidad: 1,
      vidrioLabel: 'Filtrasol 6 mm',
    },
    {
      id: 'j3',
      etiqueta: 'Patio · Mosquitero abatible',
      modeloId: 'win-abatible',
      conMosquitero: true,
      serieId: 'linea-3',
      sublineaId: 'economica-hermetica',
      anchoCm: 90,
      altoCm: 205,
      cantidad: 1,
      sinVidrio: true,
    },
  ]);

  assert.equal(res.totalTrabajos, 3);
  assert.equal(res.totalPiezas, 4);
  assert.equal(res.items.length, 3);
  assert.equal(res.vidriosConsolidados.length, 2, 'Debe consolidar vidrios de Sala y Recámara y omitir el sinVidrio');
  assert.equal(res.vidriosConsolidados[0].pzas, 4, '2 hojas × cantidad 2 = 4 vidrios en Sala');
  assert.equal(res.vidriosConsolidados[1].pzas, 1);
  assert.ok(res.perfilesConsolidados.length > 15);
  assert.ok(res.totalAluminioM > 15);
});

test('67. Panel Admin: filtro baseline de reinicio de contadores a 0 conserva solo actividad posterior', () => {
  const baseline = 1_770_000_000_000;
  const rows = [
    { id: 'old1', updatedAt: baseline - 5000, lastSeenAt: baseline - 5000 },
    { id: 'old2', createdAt: baseline },
    { id: 'new1', updatedAt: baseline + 1000 },
  ];
  const filtered = filterAdminRecordsByResetBaseline(rows, baseline);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'new1');
  assert.equal(filterAdminRecordsByResetBaseline(rows, 0).length, 3);
});

test('68. Levantamiento Rápido: validación estricta de rango [15 cm, 500 cm]', () => {
  assert.equal(LEV_MIN_CM, 15);
  assert.equal(LEV_MAX_CM, 500);

  assert.equal(validateLevantamientoStrictRange(15, 15).valid, true);
  assert.equal(validateLevantamientoStrictRange(120, 210).valid, true);
  assert.equal(validateLevantamientoStrictRange(500, 500).valid, true);

  const tooSmallW = validateLevantamientoStrictRange(14.9, 120);
  assert.equal(tooSmallW.valid, false);
  assert.match(tooSmallW.error || '', /15 cm/);

  const tooSmallH = validateLevantamientoStrictRange(120, 10);
  assert.equal(tooSmallH.valid, false);
  assert.match(tooSmallH.error || '', /15 cm/);

  const tooLargeW = validateLevantamientoStrictRange(501, 120);
  assert.equal(tooLargeW.valid, false);
  assert.match(tooLargeW.error || '', /500 cm/);

  const tooLargeH = validateLevantamientoStrictRange(120, 550);
  assert.equal(tooLargeH.valid, false);
  assert.match(tooLargeH.error || '', /500 cm/);

  // También integrada dentro de validateRealisticOpeningDimensions
  assert.equal(validateRealisticOpeningDimensions(10, 100, 'Ventana Corrediza').valid, false);
  assert.equal(validateRealisticOpeningDimensions(100, 520, 'Puerta Abatible').valid, false);
});

test('69. Onboarding obligatorio de Mi Taller y parseo dinámico de referidos (?ref & ?refName)', () => {
  assert.equal(isTallerOnboardingComplete({ nombre: '', responsable: '', tel: '' }), false);
  assert.equal(isTallerOnboardingComplete({ nombre: 'Aluminios Sur', responsable: '', tel: '5512345678' }), false);
  assert.equal(isTallerOnboardingComplete({ nombre: 'Aluminios Sur', responsable: 'Carlos', tel: '123' }), false);
  assert.equal(
    isTallerOnboardingComplete({ nombre: 'Aluminios Sur', responsable: 'Carlos Ruiz', tel: '55 1234 5678' }),
    true
  );

  const refWithTaller = parseReferralFromSearch('?ref=ALM-REF1&refName=Taller%20Norte&promo=3');
  assert.ok(refWithTaller);
  assert.equal(refWithTaller.refName, 'Taller Norte');
  assert.equal(refWithTaller.promoNumber, 3);
});

test('70. Tutorial interactivo de 4 pasos conserva los textos exactos solicitados', () => {
  assert.equal(GUIDED_TUTORIAL_STEPS.length, 4);
  assert.equal(GUIDED_TUTORIAL_STEPS[0].title, 'Levantamiento rápido en campo');
  assert.equal(GUIDED_TUTORIAL_STEPS[1].title, 'Modulación y cortes exactos');
  assert.equal(GUIDED_TUTORIAL_STEPS[2].title, 'Control de inventario y pedacería');
  assert.equal(GUIDED_TUTORIAL_STEPS[3].title, 'Presupuestos en PDF por WhatsApp');
});

test('71. Video Tutoriales: parser de YouTube, Vimeo, Google Drive y MP4 directo + 4 categorías', () => {
  assert.equal(TUTORIAL_VIDEO_CATEGORIES.length, 4);

  const yt = parseTutorialVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(yt.valid, true);
  assert.equal(yt.provider, 'youtube');
  assert.match(yt.embedUrl, /youtube\.com\/embed\/dQw4w9WgXcQ/);

  const ytShort = parseTutorialVideoUrl('https://youtu.be/dQw4w9WgXcQ');
  assert.equal(ytShort.valid, true);
  assert.equal(ytShort.provider, 'youtube');

  const vimeo = parseTutorialVideoUrl('https://vimeo.com/123456789');
  assert.equal(vimeo.valid, true);
  assert.equal(vimeo.provider, 'vimeo');
  assert.match(vimeo.embedUrl, /player\.vimeo\.com\/video\/123456789/);

  const drive = parseTutorialVideoUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing');
  assert.equal(drive.valid, true);
  assert.equal(drive.provider, 'gdrive');
  assert.match(drive.embedUrl, /\/preview$/);

  const mp4 = parseTutorialVideoUrl('https://cdn.ejemplo.com/videos/corte-linea-3.mp4');
  assert.equal(mp4.valid, true);
  assert.equal(mp4.provider, 'mp4');

  const bad = parseTutorialVideoUrl('javascript:alert(1)');
  assert.equal(bad.valid, false);
});

test('72. Asistente flotante: límite diario gratuito (3 consultas/día) e ilimitado para PRO', () => {
  assert.equal(FREE_ASSISTANT_DAILY_LIMIT, 3);
  const today = '2026-11-23';

  const freeStart = computeAssistantDailyQuotaState(null, today, false);
  assert.equal(freeStart.remaining, 3);
  assert.equal(freeStart.isLimited, true);
  assert.equal(freeStart.canSend, true);

  const freeTwo = computeAssistantDailyQuotaState({ dateKey: today, count: 2 }, today, false);
  assert.equal(freeTwo.remaining, 1);
  assert.equal(freeTwo.canSend, true);

  const freeExhausted = computeAssistantDailyQuotaState({ dateKey: today, count: 3 }, today, false);
  assert.equal(freeExhausted.remaining, 0);
  assert.equal(freeExhausted.canSend, false);

  const nextDayReset = computeAssistantDailyQuotaState({ dateKey: '2026-11-22', count: 3 }, today, false);
  assert.equal(nextDayReset.remaining, 3);
  assert.equal(nextDayReset.canSend, true);

  const proState = computeAssistantDailyQuotaState({ dateKey: today, count: 99 }, today, true);
  assert.equal(proState.isLimited, false);
  assert.equal(proState.canSend, true);
});

test('73. Teléfono mexicano automático XXX-XXX-XX-XX y contador TopBar de días/horas sin texto truncado', async () => {
  const { formatMxPhoneDashed, formatLicenseCountdownBadge } = await import('./alumineroLogic.ts');

  assert.equal(formatMxPhoneDashed('8237822818'), '823-782-28-18');
  assert.equal(formatMxPhoneDashed('823-782-28-1899'), '823-782-28-18');
  assert.equal(formatMxPhoneDashed('82378'), '823-78');
  assert.equal(formatMxPhoneDashed('8237822'), '823-782-2');
  assert.equal(formatMxPhoneDashed(''), '');

  const now = 1_760_000_000_000;
  const oneYearLeft = ((364 * 24) + 23) * 60 * 60 * 1000 + 120_000;
  assert.equal(
    formatLicenseCountdownBadge(
      { active: true, planCode: 'A', planLabel: '1 Año PRO', expiresAt: now + oneYearLeft },
      null,
      now
    ).text,
    'PRO · 1 Año · 364d 23h'
  );
  assert.equal(
    formatLicenseCountdownBadge(
      null,
      now + 50 * 3600 * 1000 + 60_000,
      now
    ).text,
    'Prueba PRO · 2d 2h'
  );
  assert.equal(formatLicenseCountdownBadge(null, null, now).text, 'Versión Gratuita');
});

test('74. Solicitud WhatsApp con datos de Mi Taller + Parser 1-Clic Admin + Mensajes de Bienvenida y Clave Sola', async () => {
  const {
    buildColleaguePromoWhatsappMessage,
    parseWhatsappKeyRequestMessage,
    buildAdminWelcomeMessage,
  } = await import('./alumineroLogic.ts');

  const msg = buildColleaguePromoWhatsappMessage('Taller Sur', 'ALM-9X2K', 9, {
    tallerNombre: 'Aluminios del Norte',
    tallerTel: '823-782-28-18',
    referredById: 'ALM-SUR1',
  });
  assert.match(msg, /ID de equipo: ALM-9X2K/);
  assert.match(msg, /Taller \/ Cliente: Aluminios del Norte/);
  assert.match(msg, /WhatsApp: 823-782-28-18/);
  assert.match(msg, /Invitado por: Taller Sur/);

  const parsed = parseWhatsappKeyRequestMessage(msg);
  assert.equal(parsed.hasValidDeviceId, true);
  assert.equal(parsed.deviceId, 'ALM-9X2K');
  assert.equal(parsed.cliente, 'Aluminios del Norte');
  assert.equal(parsed.telefonoDigits, '8237822818');
  assert.equal(parsed.planCode, 'G');

  const invalid = parseWhatsappKeyRequestMessage('Hola quiero activar la app');
  assert.equal(invalid.hasValidDeviceId, false);
  assert.equal(invalid.deviceId, '');

  const welcome = buildAdminWelcomeMessage({
    cliente: 'Aluminios del Norte',
    planCode: 'G',
    planLabel: 'Promoción 3 Días (Regalo)',
    deviceId: 'ALM-9X2K',
    dias: 3,
  });
  assert.match(welcome, /Aluminios del Norte/);
  assert.match(welcome, /ALM-9X2K/);
  assert.equal(welcome.includes('AP-G-'), false, 'El mensaje 1 de bienvenida NO debe mezclar la clave');
});

test('75. Fórmulas exactas de corte de taller: Línea 2", Línea 3" (2h/3h/doble corr.), Cancel Baño y Puertas 1h/2h + Duela', () => {
  // Línea 2" 2 hojas: A=120, H=100
  const l2 = calcularDespiece({
    linea: '2',
    anchoCm: 120,
    altoCm: 100,
    color: 'blanco',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['2'].toleranciasDefault,
  });
  assert.equal(l2.perfiles.find((p) => p.perfilId === 'jamba')?.medidaCm, 98.4); // 100 - 1.6
  assert.equal(l2.perfiles.find((p) => p.perfilId === 'riel')?.medidaCm, 120.0); // Ancho exacto
  assert.equal(l2.perfiles.find((p) => p.perfilId === 'zoclo2v')?.medidaCm, 52.0); // (120 - 16) / 2
  assert.equal(l2.perfiles.find((p) => p.nombre.includes('Hoja Fija') && p.perfilId === 'cerco')?.medidaCm, 97.2); // 100 - 2.8
  assert.equal(l2.perfiles.find((p) => p.nombre.includes('Corrediza') && p.perfilId === 'cerco')?.medidaCm, 96.2); // 100 - 3.8

  // Línea 3" 3 hojas con doble corrediza: A=240, H=150
  const l3 = calcularDespiece({
    linea: '3',
    anchoCm: 240,
    altoCm: 150,
    color: 'negro',
    vidrio: 'claro6',
    hojas: 3,
    apertura: 'corrediza',
    dobleCorrediza: true,
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });
  assert.equal(l3.perfiles.find((p) => p.perfilId === 'jamba')?.medidaCm, 147.4); // 150 - 2.6
  assert.equal(l3.perfiles.find((p) => p.perfilId === 'alumer_7828')?.medidaCm, 237.2); // 240 - 2.8
  assert.equal(l3.perfiles.find((p) => p.perfilId === 'zoclo2v')?.medidaCm, 72.0); // (240 - 24) / 3

  // Puerta abatible 2 hojas 100% Ciega Duela: A=180, H=210
  const puerta2h = calcularDespiece({
    linea: 'puerta-abatible',
    anchoCm: 180,
    altoCm: 210,
    color: 'blanco',
    vidrio: 'claro6',
    hojas: 2,
    puertaDobleHoja: true,
    puertaRellenoModo: 'ciega_duela',
    duelaAnchoUtilCm: 10,
    apertura: 'abatible',
    sentidoPuerta: 'izq',
    puertaIntermedio: true,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['puerta-abatible'].toleranciasDefault,
  });
  assert.equal(puerta2h.perfiles.find((p) => p.perfilId === 'alumer_5844')?.medidaCm, 207.4); // 210 - 2.6
  assert.equal(puerta2h.perfiles.find((p) => p.perfilId === 'alumer_9204')?.medidaCm, 206.0); // 210 - 4.0
  assert.equal(puerta2h.perfiles.find((p) => p.perfilId === 'alumer_9204')?.pzas, 4);
  assert.equal(puerta2h.perfiles.find((p) => p.perfilId === 'alumer_9207')?.medidaCm, 73.3); // round1((180 - 33.5)/2) = 73.3
  const duela = puerta2h.perfiles.find((p) => (p.nombre || '').toLowerCase().includes('duela')) || puerta2h.vidrios.find((v) => (v.nombre || '').toLowerCase().includes('duela'));
  assert.ok(duela, 'Puerta ciega duela debe calcular tiras de duela');
});

test('76. Optimizador 6.10 m (605 cm útil, 0.4 cm kerf, 60 cm sobrante usable vs merma real)', async () => {
  const { optimizarPartidasTramos1D } = await import('./modulacionLogic.ts');
  const d = calcularDespiece({
    linea: '3',
    anchoCm: 150,
    altoCm: 120,
    color: 'natural',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });

  const opt = optimizarPartidasTramos1D([
    {
      id: 'p1',
      categoria: 'ventanas',
      linea: '3',
      area: 'Sala',
      etiqueta: 'Ventana Sala',
      anchoCm: 150,
      altoCm: 120,
      color: 'natural',
      vidrio: 'claro6',
      hojas: 2,
      apertura: 'corrediza',
      sentidoPuerta: 'izq',
      puertaIntermedio: false,
      puertaEconomica: false,
      invertido: false,
      cantidad: 1,
      modoPrecio: 'm2',
      precioInput: 2850,
      cobrarMinM2: false,
      extraPct: 0,
      totalLinea: 5130,
      despiece: d,
    },
  ]);

  assert.equal(opt.largoBarraCm, 610);
  assert.equal(opt.largoUtilCm, 605);
  assert.equal(opt.kerfCm, 0.4);
  assert.equal(opt.minSobranteGuardableCm, 60);
  assert.ok(opt.tramos610Totales >= 1);
  // Con sobrantes >= 60 cm (usables), mermaRealPct debe ser 0% (no contar retazos usables como merma)
  assert.equal(opt.mermaRealPct, 0);
  assert.ok(opt.sobrantesGeneradosGuardables.length >= 1);
});

test('77. Ajuste masivo de precios por porcentaje (Aluminio, Vidrio, Herrajes, Todo)', async () => {
  const { applyBulkPriceAdjustment } = await import('./alumineroLogic.ts');

  const alumOnly = applyBulkPriceAdjustment({
    category: 'aluminio',
    pct: 10,
    precioListaTramo: 1000,
    tarifasBase: { '3': 2800 },
    rellenoPreciosM2: { 'flot-claro__6': 500 },
    herrajesPrecios: { 'ref-her-carr3': 100 },
  });
  assert.equal(alumOnly.precioListaTramo, 1100);
  assert.equal(alumOnly.tarifasBase['3'], 3080);
  assert.equal(alumOnly.rellenoPreciosM2['flot-claro__6'], 500);
  assert.equal(alumOnly.herrajesPrecios['ref-her-carr3'], 100);

  const allDown = applyBulkPriceAdjustment({
    category: 'todo',
    pct: -10,
    precioListaTramo: 1000,
    tarifasBase: { '3': 2000 },
    rellenoPreciosM2: { 'flot-claro__6': 500 },
    herrajesPrecios: { 'ref-her-carr3': 100 },
  });
  assert.equal(allDown.precioListaTramo, 900);
  assert.equal(allDown.tarifasBase['3'], 1800);
  assert.equal(allDown.rellenoPreciosM2['flot-claro__6'], 450);
  assert.equal(allDown.herrajesPrecios['ref-her-carr3'], 90);
});

test('78. Carátulas por nivel de suscripción: Básica y Navideña en Gratis/3d; Ejecutiva e Industrial PRO en Planes PRO pagados', async () => {
  const { getUnlockedSkinsForLicense, isSkinUnlockedForLicense } = await import('./storageHelpers.ts');

  // Gratis: Básica y Navideña desbloqueadas; Ejecutiva e Industrial PRO bloqueadas
  assert.deepEqual(getUnlockedSkinsForLicense(null, false), ['basica', 'navidena']);
  assert.equal(isSkinUnlockedForLicense('navidena', null, false), true);
  assert.equal(isSkinUnlockedForLicense('ejecutiva', null, false), false);
  assert.equal(isSkinUnlockedForLicense('industrial', null, false), false);

  // Prueba PRO 3 días (G): mantiene Básica + Navideña
  const trialLic = {
    active: true,
    planCode: 'G',
    planLabel: 'Promoción 3 Días (Regalo)',
    expiresAt: Date.now() + 86_400_000,
    activatedAt: Date.now(),
  };
  assert.deepEqual(getUnlockedSkinsForLicense(trialLic, true), ['basica', 'navidena']);
  assert.equal(isSkinUnlockedForLicense('industrial', trialLic, true), false);

  // Plan PRO pagado (M/Q/A): desbloquea Básica, Navideña, Ejecutiva e Industrial PRO
  const paidLic = {
    active: true,
    planCode: 'M',
    planLabel: '30 Días PRO',
    expiresAt: Date.now() + 30 * 86_400_000,
    activatedAt: Date.now(),
  };
  assert.deepEqual(getUnlockedSkinsForLicense(paidLic, true), [
    'basica',
    'navidena',
    'ejecutiva',
    'industrial',
  ]);
});

test('79. Acceso de Administrador acepta contraseña 1983, override personalizado y PIN de recuperación 202699', async () => {
  const { verifyAdminAccessCredential } = await import('./alumineroLogic.ts');

  assert.deepEqual(verifyAdminAccessCredential('1983'), { ok: true, viaRecoveryPin: false });
  assert.deepEqual(verifyAdminAccessCredential('  1983  '), { ok: true, viaRecoveryPin: false });
  assert.deepEqual(verifyAdminAccessCredential('202699'), { ok: true, viaRecoveryPin: true });
  assert.deepEqual(verifyAdminAccessCredential(' 202699 '), { ok: true, viaRecoveryPin: true });
  assert.deepEqual(verifyAdminAccessCredential('0000'), { ok: false, viaRecoveryPin: false });
  assert.deepEqual(verifyAdminAccessCredential(''), { ok: false, viaRecoveryPin: false });

  // Con override personalizado, el override y el PIN maestro 202699 siguen permitiendo acceso inmediato
  assert.deepEqual(verifyAdminAccessCredential('MiClavePro26', 'MiClavePro26'), {
    ok: true,
    viaRecoveryPin: false,
  });
  assert.deepEqual(verifyAdminAccessCredential('202699', 'MiClavePro26'), {
    ok: true,
    viaRecoveryPin: true,
  });
  assert.deepEqual(verifyAdminAccessCredential('1983', 'MiClavePro26'), {
    ok: false,
    viaRecoveryPin: false,
  });
});

test('80. HomeMenuLayout: normalización segura y reordenamiento drag-and-drop dentro y entre secciones', async () => {
  const {
    ALL_HOME_MENU_CARD_IDS,
    DEFAULT_HOME_MENU_LAYOUT,
    isDefaultHomeMenuLayout,
    moveHomeMenuCard,
    normalizeHomeMenuLayout,
  } = await import('./alumineroLogic.ts');

  // Normalización sobre entradas inválidas o incompletas devuelve todas las tarjetas sin duplicados
  const fallback = normalizeHomeMenuLayout(null);
  assert.equal(isDefaultHomeMenuLayout(fallback), true);
  assert.equal(
    fallback.principal.length + fallback.herramientas.length,
    ALL_HOME_MENU_CARD_IDS.length
  );

  const partial = normalizeHomeMenuLayout({
    principal: ['puertas', 'puertas', 'desconocida' as never],
    herramientas: ['notas'],
  });
  const combined = [...partial.principal, ...partial.herramientas];
  assert.equal(combined.length, ALL_HOME_MENU_CARD_IDS.length);
  assert.equal(new Set(combined).size, ALL_HOME_MENU_CARD_IDS.length);
  assert.equal(partial.principal[0], 'puertas');
  assert.equal(partial.herramientas[0], 'notas');

  // Reordenar dentro de la misma sección (principal)
  const firstDefault = DEFAULT_HOME_MENU_LAYOUT.principal[0];
  const reorderedSame = moveHomeMenuCard(DEFAULT_HOME_MENU_LAYOUT, 'puertas', 'principal', 0);
  assert.equal(reorderedSame.principal[0], 'puertas');
  assert.equal(reorderedSame.principal[1], firstDefault);
  assert.equal(isDefaultHomeMenuLayout(reorderedSame), false);

  // Mover tarjeta entre secciones (herramientas -> principal)
  const movedUp = moveHomeMenuCard(reorderedSame, 'notas', 'principal', 1);
  assert.equal(movedUp.principal[1], 'notas');
  assert.equal(movedUp.herramientas.includes('notas'), false);
  assert.equal(
    movedUp.principal.length + movedUp.herramientas.length,
    ALL_HOME_MENU_CARD_IDS.length
  );

  // Mover tarjeta de principal -> herramientas con índice fuera de rango (clamping)
  const movedDown = moveHomeMenuCard(movedUp, 'ventanas', 'herramientas', 999);
  assert.equal(movedDown.principal.includes('ventanas'), false);
  assert.equal(movedDown.herramientas[movedDown.herramientas.length - 1], 'ventanas');
  assert.equal(
    movedDown.principal.length + movedDown.herramientas.length,
    ALL_HOME_MENU_CARD_IDS.length
  );
});

test('81. Seguro de respaldo privado ?Admin=OlmosHer1983 es estricto en mayúsculas y minúsculas', async () => {
  const { parseAdminUrlShortcut } = await import('./alumineroLogic.ts');
  assert.equal(parseAdminUrlShortcut('?Admin=OlmosHer1983'), true);
  assert.equal(parseAdminUrlShortcut('?foo=1&Admin=OlmosHer1983&bar=2'), true);
  assert.equal(parseAdminUrlShortcut('?admin=OlmosHer1983'), false);
  assert.equal(parseAdminUrlShortcut('?Admin=olmosher1983'), false);
  assert.equal(parseAdminUrlShortcut('?Admin=1983'), false);
  assert.equal(parseAdminUrlShortcut(''), false);
});

test('82. getHomeMenuTier asigna vista vertical fija (free), 2 páginas fijas (30d/90d) y 2 páginas editables (1 año/permanente)', async () => {
  const { getHomeMenuTier } = await import('./alumineroLogic.ts');
  const now = 1_800_000_000_000;
  const DAY = 86_400_000;

  assert.equal(getHomeMenuTier(null, false, now), 'free');
  // 3 días de cortesía / colega => free
  assert.equal(
    getHomeMenuTier(
      { active: true, planCode: 'G', planLabel: 'Cortesía 3 días', activatedAt: now, expiresAt: now + 3 * DAY },
      true,
      now
    ),
    'free'
  );
  // 30 días PRO => pro_paged
  assert.equal(
    getHomeMenuTier(
      { active: true, planCode: 'M', planLabel: '30 Días PRO', activatedAt: now, expiresAt: now + 30 * DAY },
      true,
      now
    ),
    'pro_paged'
  );
  // 90 días PRO => pro_paged
  assert.equal(
    getHomeMenuTier(
      { active: true, planCode: 'Q', planLabel: '90 Días PRO', activatedAt: now, expiresAt: now + 90 * DAY },
      true,
      now
    ),
    'pro_paged'
  );
  // 1 Año PRO => pro_annual
  assert.equal(
    getHomeMenuTier(
      { active: true, planCode: 'A', planLabel: '1 Año PRO', activatedAt: now, expiresAt: now + 365 * DAY },
      true,
      now
    ),
    'pro_annual'
  );
  // PRO Permanente sin costo => pro_annual
  assert.equal(
    getHomeMenuTier(
      { active: true, planCode: 'P', planLabel: 'PRO Permanente (Prueba / Cortesía)', activatedAt: now, expiresAt: null },
      true,
      now
    ),
    'pro_annual'
  );
});

test('83. generatePermanentTestKey y validateActivationKey validan claves permanentes AP-P-XXXXXX sin vencimiento', async () => {
  const { generatePermanentTestKey, validateActivationKey } = await import('./alumineroLogic.ts');
  const devId = 'ALM-TEST99';
  const permKey = generatePermanentTestKey(devId);
  assert.match(permKey, /^AP-P-[A-Z0-9]{6}$/);

  const okRes = validateActivationKey(devId, permKey);
  assert.equal(okRes.ok, true);
  assert.equal(okRes.isFreeTestPro, true);
  assert.equal(okRes.plan?.code, 'P');
  assert.equal(okRes.plan?.ms, null);

  const wrongDev = validateActivationKey('ALM-OTRO11', permKey);
  assert.equal(wrongDev.ok, false);
});

test('84. isFreeTestProRecord distingue licencias PRO permanentes de prueba/cortesía frente a planes pagados', async () => {
  const { isFreeTestProRecord } = await import('./alumineroLogic.ts');
  assert.equal(isFreeTestProRecord({ tipo: 'prueba_gratis' }), true);
  assert.equal(isFreeTestProRecord({ planCode: 'P' }), true);
  assert.equal(isFreeTestProRecord({ key: 'AP-P-123456' }), true);
  assert.equal(isFreeTestProRecord({ planLabel: 'PRO Permanente (Prueba / Cortesía)' }), true);
  assert.equal(isFreeTestProRecord({ tipo: 'pagado', planCode: 'M', key: 'AP-M-123456', planLabel: '30 Días PRO' }), false);
  assert.equal(isFreeTestProRecord({ tipo: 'pagado', planCode: 'A', key: 'AP-A-999999', planLabel: '1 Año PRO' }), false);
});

test('85. Carátulas y sub-variantes desbloqueadas por plan (Free/3d: Básica+Navideña; PRO pagado/permanente: todas)', async () => {
  const { getUnlockedSkinsForLicense, normalizeSkinVariantForSkin } = await import('./storageHelpers.ts');
  const now = Date.now();
  const DAY = 86_400_000;

  assert.deepEqual(getUnlockedSkinsForLicense(null, false), ['basica', 'navidena']);
  assert.deepEqual(
    getUnlockedSkinsForLicense(
      { active: true, planCode: 'G', planLabel: 'Cortesía 3 días', activatedAt: now, expiresAt: now + 3 * DAY },
      true
    ),
    ['basica', 'navidena']
  );
  assert.deepEqual(
    getUnlockedSkinsForLicense(
      { active: true, planCode: 'M', planLabel: '30 Días PRO', activatedAt: now, expiresAt: now + 30 * DAY },
      true
    ),
    ['basica', 'navidena', 'ejecutiva', 'industrial']
  );
  assert.deepEqual(
    getUnlockedSkinsForLicense(
      { active: true, planCode: 'P', planLabel: 'PRO Permanente (Prueba / Cortesía)', activatedAt: now, expiresAt: null, tipo: 'prueba_gratis' },
      true
    ),
    ['basica', 'navidena', 'ejecutiva', 'industrial']
  );

  assert.equal(normalizeSkinVariantForSkin('ejecutiva', 'verde'), 'verde');
  assert.equal(normalizeSkinVariantForSkin('ejecutiva', 'naranja'), 'naranja');
  assert.equal(normalizeSkinVariantForSkin('ejecutiva', 'bronce'), 'default');
  assert.equal(normalizeSkinVariantForSkin('industrial', 'bronce'), 'bronce');
  assert.equal(normalizeSkinVariantForSkin('industrial', 'dorada'), 'dorada');
  assert.equal(normalizeSkinVariantForSkin('industrial', 'plateada'), 'plateada');
  assert.equal(normalizeSkinVariantForSkin('navidena', 'dorada'), 'default');
});

test('86. optimizarPartidasTramos1D calcula totalCortes por tramo sin duplicar cortes cuando partida.cantidad > 1', async () => {
  const { optimizarPartidasTramos1D } = await import('./modulacionLogic.ts');
  const despiece = calcularDespiece({
    linea: '3',
    anchoCm: 120,
    altoCm: 100,
    color: 'natural',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 2,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });

  const res = optimizarPartidasTramos1D([
    {
      id: 'p-qty2',
      categoria: 'ventanas',
      linea: '3',
      area: 'Sala',
      etiqueta: 'V-Doble',
      anchoCm: 120,
      altoCm: 100,
      color: 'natural',
      vidrio: 'claro6',
      hojas: 2,
      apertura: 'corrediza',
      sentidoPuerta: 'izq',
      puertaIntermedio: false,
      puertaEconomica: false,
      invertido: false,
      cantidad: 2,
      modoPrecio: 'm2',
      precioInput: 2850,
      cobrarMinM2: false,
      extraPct: 0,
      totalLinea: 6840,
      despiece,
    },
  ]);

  const cabezalGrupo = res.grupos.find((g) => g.perfilId === 'cabezal');
  assert.ok(cabezalGrupo, 'Debe existir grupo de cabezal');
  // calcularDespiece con cantidad=2 ya produce 2 piezas de cabezal (no debe multiplicarse otra vez por 2)
  assert.equal(cabezalGrupo.barras.length, 1);
  assert.equal(cabezalGrupo.barras[0].totalCortes, 2);
  assert.equal(cabezalGrupo.barras[0].cortes.length, 2);
  assert.ok(cabezalGrupo.barras[0].usadoCm > 235 && cabezalGrupo.barras[0].sobranteCm > 350);
});

test('87. Catálogo de Perfiles México incluye explícitamente marca Perfileto y sistemas vigentes', async () => {
  const { CATALOGO_MARCAS_MEXICO, CATALOGO_PERFILES } = await import('./alumineroLogic.ts');
  assert.ok(CATALOGO_MARCAS_MEXICO.includes('Perfileto'), 'Perfileto debe estar en CATALOGO_MARCAS_MEXICO');
  assert.ok(CATALOGO_MARCAS_MEXICO.includes('Herralum'), 'Herralum debe estar en CATALOGO_MARCAS_MEXICO');
  const perfiletoItems = CATALOGO_PERFILES.filter((p) =>
    `${p.marcaCatalogo || ''} ${p.codigoRef || ''}`.toLowerCase().includes('perfileto')
  );
  assert.ok(perfiletoItems.length >= 6, 'Debe haber múltiples perfiles con marca Perfileto');
  assert.ok(CATALOGO_PERFILES.some((p) => p.sistemaCatalogo === 'Serie 1400'), 'Debe incluir Serie 1400');
  assert.ok(CATALOGO_PERFILES.some((p) => p.familia === 'cancel'), 'Debe incluir Cancel de Baño');
});

test('88. consolidarMaterialesObra cruza existencias reales de Mi Inventario incluyendo marca Perfileto y marcasEnBodega', async () => {
  const { makeInventarioKey } = await import('./alumineroLogic.ts');
  const despiece = calcularDespiece({
    linea: '3',
    anchoCm: 150,
    altoCm: 120,
    color: 'blanco',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });

  const kPerfileto = makeInventarioKey('3', 'cabezal', 'blanco', 'Perfileto');
  const cons = consolidarMaterialesObra(
    [
      {
        id: 'p-inv',
        categoria: 'ventanas',
        linea: '3',
        area: 'Recámara',
        etiqueta: 'V1',
        anchoCm: 150,
        altoCm: 120,
        color: 'blanco',
        vidrio: 'claro6',
        hojas: 2,
        apertura: 'corrediza',
        sentidoPuerta: 'izq',
        puertaIntermedio: false,
        puertaEconomica: false,
        invertido: false,
        cantidad: 1,
        modoPrecio: 'm2',
        precioInput: 2850,
        cobrarMinM2: false,
        extraPct: 0,
        totalLinea: 5130,
        despiece,
      },
    ],
    { [kPerfileto]: 3 },
    {}
  );

  const cab = cons.find((r) => r.perfilId === 'cabezal');
  assert.ok(cab);
  assert.equal(cab.tramosEnBodega, 3);
  assert.equal(cab.tramosDisponibles, 3);
  assert.equal(cab.tramosFaltantes, 0);
  assert.ok(cab.marcasEnBodega?.includes('Perfileto'));
});

test('89. buildCompactExistenciasList filtra estrictamente existencias > 0 en perfiles, herrajes y vidrio', async () => {
  const { buildCompactExistenciasList, makeInventarioKey } = await import('./alumineroLogic.ts');
  const kPos = makeInventarioKey('3', 'cabezal', 'natural', 'Perfileto');
  const kZero = makeInventarioKey('3', 'jamba', 'negro', 'Cuprum');
  const firstHerrajeId = HERRAJES_INVENTARIO_CATALOGO[0].id;
  const secondHerrajeId = HERRAJES_INVENTARIO_CATALOGO[1].id;

  const items = buildCompactExistenciasList(
    { [kPos]: 4, [kZero]: 0 },
    { [firstHerrajeId]: 12, [secondHerrajeId]: 0 },
    [
      { id: 'v-ok', tipoNombre: 'Claro 6 mm', anchoCm: 260, altoCm: 180, cantidad: 2 },
      { id: 'v-0', tipoNombre: 'Filtrasol 6 mm', anchoCm: 260, altoCm: 180, cantidad: 0 },
    ]
  );

  assert.equal(items.length, 3);
  assert.ok(items.every((i) => i.cantidad > 0));
  assert.equal(items.filter((i) => i.tipo === 'perfil').length, 1);
  assert.equal(items.filter((i) => i.tipo === 'herraje').length, 1);
  assert.equal(items.filter((i) => i.tipo === 'vidrio').length, 1);
  assert.equal(items.find((i) => i.tipo === 'perfil')?.marca, 'Perfileto');
});

test('90. buildMonthlyQuotesSeries y buildTopMaterialsSeries agregan métricas mensuales y materiales top para Admin Recharts', async () => {
  const { buildMonthlyQuotesSeries, buildTopMaterialsSeries } = await import('./alumineroLogic.ts');
  const now = new Date('2026-11-20T12:00:00Z').getTime();

  const historial = [
    { id: 'h1', fecha: '2026-11-05', total: 12000, linea: '3' as const, color: 'negro' as const, cantidad: 2 },
    { id: 'h2', fecha: '2026-10-15', total: 8500, linea: '3' as const, color: 'natural' as const, cantidad: 3 },
  ];
  const cotizaciones = [
    {
      id: 'q1',
      fecha: '2026-11-10',
      createdAt: now - 5 * 86_400_000,
      total: 15000,
      partidas: [
        { linea: 'europea' as const, color: 'blanco' as const, cantidad: 1 } as never,
      ],
    },
  ];

  const monthly = buildMonthlyQuotesSeries(historial, cotizaciones, now);
  assert.equal(monthly.length, 6);
  const totalQuotes = monthly.reduce((acc, m) => acc + m.cotizaciones, 0);
  assert.equal(totalQuotes, 3);

  const topMaterials = buildTopMaterialsSeries(historial, cotizaciones, {});
  assert.ok(topMaterials.length >= 2);
  assert.equal(topMaterials[0].usos, 5);
  assert.ok(topMaterials[0].nombre.includes('3'));
});

test('91. Escáner de Croquis IA: normaliza X/O, convierte mm/m a cm, mapea tipo y formatea notas de taller', async () => {
  const {
    normalizeLeafDisposition,
    convertSketchDimensionToCm,
    mapSketchTypeToLevantamientoTipo,
    normalizeScannedSketchResult,
    SKETCH_SCANNER_OFFLINE_MESSAGE,
  } = await import('./levantamientoLogic.ts');

  assert.equal(normalizeLeafDisposition('o-x-o'), 'OXO');
  assert.equal(normalizeLeafDisposition('0 x 0'), 'OXO');
  assert.equal(normalizeLeafDisposition('O / X / X / O'), 'OXXO');

  // Conversión de unidades a cm
  assert.equal(convertSketchDimensionToCm(1500, 'mm'), 150);
  assert.equal(convertSketchDimensionToCm('1.85', 'm'), 185);
  assert.equal(convertSketchDimensionToCm('120', 'cm'), 120);
  // Heurística cuando viene como número en metros o mm sin etiqueta
  assert.equal(convertSketchDimensionToCm(1.5, 'cm', true), 150);
  assert.equal(convertSketchDimensionToCm(2100, 'cm', true), 210);
  assert.equal(convertSketchDimensionToCm(0, 'cm', true), null);

  // Mapeo de tipos
  assert.equal(mapSketchTypeToLevantamientoTipo('Ventana proyectante', ''), 'Ventana Abatible / Proyección');
  assert.equal(mapSketchTypeToLevantamientoTipo('Puerta abatible', ''), 'Puerta');
  assert.equal(mapSketchTypeToLevantamientoTipo('Cancel de baño', 'OX'), 'Cancel / Otro');
  assert.equal(mapSketchTypeToLevantamientoTipo('Ventana', 'OO'), 'Ventana Fija');
  assert.equal(mapSketchTypeToLevantamientoTipo('Ventana', 'OX'), 'Ventana Corrediza');

  // Resultado completo normalizado
  const res = normalizeScannedSketchResult({
    tipo: 'Ventana Corrediza',
    hojas: 3,
    disposicionHojas: 'O-X-O',
    anchoCm: 2400, // el modelo devolvió mm por error -> debe corregirse a 240 cm
    altoCm: 1.2, // el modelo devolvió metros por error -> debe corregirse a 120 cm
    unidadDetectada: 'mm',
    area: 'Sala',
    notas: 'Con mosquitero en hoja central',
    confianza: 'alta',
  });

  assert.equal(res.tipo, 'Ventana Corrediza');
  assert.equal(res.hojas, 3);
  assert.equal(res.disposicionHojas, 'OXO');
  assert.equal(res.hojasCorredizas, 1);
  assert.equal(res.hojasFijas, 2);
  assert.equal(res.anchoCm, 240);
  assert.equal(res.altoCm, 120);
  assert.equal(res.area, 'Sala');
  assert.equal(res.confianza, 'alta');
  assert.ok(res.notasFormateadas.includes('O-X-O'));
  assert.ok(res.notasFormateadas.includes('1 corrediza (X)'));
  assert.ok(res.notasFormateadas.includes('2 fijas (O)'));
  assert.ok(SKETCH_SCANNER_OFFLINE_MESSAGE.toLowerCase().includes('internet'));
});

test('92. Ayuda y Preguntas Frecuentes: contiene exactamente las 5 preguntas clave y respuestas de taller', async () => {
  const { WORKSHOP_FAQ_ITEMS } = await import('../components/HelpFaqModal.tsx');

  assert.equal(WORKSHOP_FAQ_ITEMS.length, 5);
  assert.equal(WORKSHOP_FAQ_ITEMS[0].question, '¿Funciona sin internet?');
  assert.ok(WORKSHOP_FAQ_ITEMS[0].answer.includes('en plena obra aunque no tengas datos ni Wi-Fi'));

  assert.equal(WORKSHOP_FAQ_ITEMS[1].question, '¿Qué marcas y líneas incluye?');
  assert.ok(WORKSHOP_FAQ_ITEMS[1].answer.includes('Edición 2026–2027'));
  assert.ok(WORKSHOP_FAQ_ITEMS[1].answer.includes('Panorama, Cuprum, Indalum, EuroAlum, Alugama, Extrusiones Metálicas, Perfiletto y Herralum 2026'));

  assert.equal(WORKSHOP_FAQ_ITEMS[2].question, '¿Con qué precios cotiza?');
  assert.ok(WORKSHOP_FAQ_ITEMS[2].answer.includes('proveedor local'));

  assert.equal(WORKSHOP_FAQ_ITEMS[3].question, '¿Sirve para puertas y ventanas complejas?');
  assert.ok(WORKSHOP_FAQ_ITEMS[3].answer.includes('oscilobatientes'));

  assert.equal(WORKSHOP_FAQ_ITEMS[4].question, '¿Tengo que pagar cada mes a la fuerza?');
  assert.ok(WORKSHOP_FAQ_ITEMS[4].answer.includes('30 días ($369)'));
  assert.ok(WORKSHOP_FAQ_ITEMS[4].answer.includes('90 días ($989)'));
  assert.ok(WORKSHOP_FAQ_ITEMS[4].answer.includes('1 Año completo ($1,799 MXN)'));
});

test('93. EuroAlum 2500 (2 hojas, corte 45°): fórmulas oficiales de perfiles, vidrio y 12 escuadras', async () => {
  const { calcularDespiece } = await import('./alumineroLogic.ts');
  // 120 × 100 cm -> H = 1200 mm, V = 1000 mm
  const res = calcularDespiece({
    anchoCm: 120,
    altoCm: 100,
    cantidad: 1,
    linea: 'euroalum-2500',
    color: 'natural',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    puertaIntermedio: false,
    puertaEconomica: false,
    sentidoPuerta: 'der',
    invertido: false,
    tolerancias: { marcoH: 0, hojaV: 0, hojaH: 0, vidAncho: 0, vidAlto: 0 },
  });

  const findPerfil = (code: string) => res.perfiles.filter((p) => p.nombre.includes(code));
  // Riel 1695: H×2 = 120 cm, V×2 = 100 cm (45°)
  const rieles = findPerfil('1695');
  assert.equal(rieles.length, 2);
  assert.ok(rieles.some((p) => Math.abs(p.medidaCm - 120) < 0.01 && p.pzas === 2 && p.angulo === '45°'));
  assert.ok(rieles.some((p) => Math.abs(p.medidaCm - 100) < 0.01 && p.pzas === 2 && p.angulo === '45°'));

  // Hoja 1699: ((1200-4)/2)/10 = 59.8 cm ×4, (1000-63)/10 = 93.7 cm ×4 (45°)
  const hojas = findPerfil('1699');
  assert.equal(hojas.length, 2);
  assert.ok(hojas.some((p) => Math.abs(p.medidaCm - 59.8) < 0.01 && p.pzas === 4 && p.angulo === '45°'));
  assert.ok(hojas.some((p) => Math.abs(p.medidaCm - 93.7) < 0.01 && p.pzas === 4 && p.angulo === '45°'));

  // Traslape 1619: (1000-65)/10 = 93.5 cm ×2 (90°)
  const traslape = findPerfil('1619');
  assert.equal(traslape.length, 1);
  assert.ok(Math.abs(traslape[0].medidaCm - 93.5) < 0.01);
  assert.equal(traslape[0].pzas, 2);
  assert.equal(traslape[0].angulo, '90°');

  // Vidrio: ((1200-215)/2)/10 = 49.25 cm × (1000-170)/10 = 83.0 cm (2 pzas)
  assert.equal(res.vidrios.length, 1);
  assert.ok(Math.abs(res.vidrios[0].anchoCm - 49.25) < 0.01);
  assert.ok(Math.abs(res.vidrios[0].altoCm - 83.0) < 0.01);
  assert.equal(res.vidrios[0].pzas, 2);

  // 12 escuadras de unión 45° (4 marco + 8 hojas)
  const escuadras = res.herrajes.find((h) => h.nombre.toLowerCase().includes('escuadra'));
  assert.ok(escuadras);
  assert.equal(escuadras.cantidad, 12);
});

test('94. EuroAlum 2800 (2 hojas, 90°) y EuroAlum 3800 (2 hojas, 90°): fórmulas exactas de corte y vidrio', async () => {
  const { calcularDespiece } = await import('./alumineroLogic.ts');
  const baseInput = {
    anchoCm: 120,
    altoCm: 100,
    cantidad: 1,
    color: 'negro' as const,
    vidrio: 'claro6' as const,
    hojas: 2 as const,
    apertura: 'corrediza' as const,
    puertaIntermedio: false,
    puertaEconomica: false,
    sentidoPuerta: 'der' as const,
    invertido: false,
    tolerancias: { marcoH: 0, hojaV: 0, hojaH: 0, vidAncho: 0, vidAlto: 0 },
  };

  // --- EuroAlum 2800 ---
  const r2800 = calcularDespiece({ ...baseInput, linea: 'euroalum-2800' });
  const p28 = (code: string) => r2800.perfiles.find((p) => p.nombre.includes(code));
  assert.ok(Math.abs((p28('12150')?.medidaCm ?? 0) - 118.8) < 0.01);
  assert.equal(p28('12150')?.pzas, 1);
  assert.ok(Math.abs((p28('12151')?.medidaCm ?? 0) - 118.8) < 0.01);
  assert.equal(p28('12151')?.pzas, 1);
  assert.ok(Math.abs((p28('12152')?.medidaCm ?? 0) - 100) < 0.01);
  assert.equal(p28('12152')?.pzas, 2);
  assert.ok(Math.abs((p28('12153')?.medidaCm ?? 0) - 57.75) < 0.01);
  assert.equal(p28('12153')?.pzas, 4);
  assert.ok(Math.abs((p28('12154')?.medidaCm ?? 0) - 95.6) < 0.01);
  assert.equal(p28('12154')?.pzas, 2);
  assert.ok(Math.abs((p28('12155')?.medidaCm ?? 0) - 95.6) < 0.01);
  assert.equal(p28('12155')?.pzas, 2);
  assert.ok(r2800.perfiles.every((p) => p.angulo === '90°'));
  assert.ok(Math.abs(r2800.vidrios[0].anchoCm - 52.95) < 0.01);
  assert.ok(Math.abs(r2800.vidrios[0].altoCm - 87.0) < 0.01);
  assert.equal(r2800.vidrios[0].pzas, 2);

  // --- EuroAlum 3800 ---
  const r3800 = calcularDespiece({ ...baseInput, linea: 'euroalum-3800' });
  const p38 = (code: string) => r3800.perfiles.find((p) => p.nombre.includes(code));
  assert.ok(Math.abs((p38('12263')?.medidaCm ?? 0) - 117.5) < 0.01);
  assert.equal(p38('12263')?.pzas, 2);
  assert.ok(Math.abs((p38('12208')?.medidaCm ?? 0) - 100) < 0.01);
  assert.equal(p38('12208')?.pzas, 2);
  assert.ok(Math.abs((p38('12240')?.medidaCm ?? 0) - 54.9) < 0.01);
  assert.equal(p38('12240')?.pzas, 4);
  assert.ok(Math.abs((p38('12288')?.medidaCm ?? 0) - 93.2) < 0.01);
  assert.equal(p38('12288')?.pzas, 2);
  assert.ok(Math.abs((p38('12297')?.medidaCm ?? 0) - 93.2) < 0.01);
  assert.equal(p38('12297')?.pzas, 2);
  assert.ok(Math.abs((p38('12301')?.medidaCm ?? 0) - 120) < 0.01);
  assert.equal(p38('12301')?.pzas, 1);
  assert.ok(r3800.perfiles.every((p) => p.angulo === '90°'));
  assert.ok(Math.abs(r3800.vidrios[0].anchoCm - 50.1) < 0.01);
  assert.ok(Math.abs(r3800.vidrios[0].altoCm - 80.9) < 0.01);
  assert.equal(r3800.vidrios[0].pzas, 2);
});

test('95. Catálogo Oficial 2026–2027: 5 marcas oficiales, claves reales sin códigos ficticios y tablas EuroAlum', async () => {
  const {
    OFFICIAL_BRANDS_2026,
    OFFICIAL_CATALOG_2026,
    OFFICIAL_EUROALUM_CUT_TABLES,
    DEFAULT_CATALOG_VIGENCIA_LABEL,
    filterOfficialCatalog,
  } = await import('./officialCatalog2026.ts');
  const { CATALOGO_PERFILES } = await import('./alumineroLogic.ts');

  assert.equal(
    DEFAULT_CATALOG_VIGENCIA_LABEL,
    'Catálogos Oficiales Vigentes 2026 • Próxima Actualización Anual: 2027'
  );
  assert.equal(OFFICIAL_BRANDS_2026.length, 5);
  assert.equal(OFFICIAL_EUROALUM_CUT_TABLES.length, 3);

  // Claves clave presentes en OFFICIAL_CATALOG_2026
  const requiredClaves = [
    '39073',
    '73971',
    '69135',
    '67826',
    '628407',
    '13614',
    '1695',
    '12150',
    '12263',
    'A-2501',
    '6001',
    '68500',
    '10001',
    '2008',
    '138201700',
    '1068149079',
    '1305 Bacalar',
  ];
  for (const clave of requiredClaves) {
    assert.ok(
      OFFICIAL_CATALOG_2026.some((item) => item.clave === clave || item.clave.includes(clave)),
      `Falta clave oficial en catálogo 2026: ${clave}`
    );
  }

  // Búsqueda por marca y texto funciona incluyendo Perfileto/Perfiletto
  assert.ok(filterOfficialCatalog('perfiletto', '').length >= 15);
  assert.ok(filterOfficialCatalog('all', '12263').some((i) => i.clave === '12263'));
  assert.ok(filterOfficialCatalog('all', 'Bacalar').some((i) => i.brandId === 'herralum'));

  // Ninguna clave ficticia heredada debe existir en CATALOGO_PERFILES
  const allRuntimeClaves = CATALOGO_PERFILES.map((p) => p.codigoRef);
  for (const fake of ['PF-301', 'PF-302', 'PF-CB01', 'EU-3501', 'EU-7012', 'HER-1500', '2401', '1401']) {
    assert.ok(!allRuntimeClaves.includes(fake), `Se encontró clave ficticia residual: ${fake}`);
  }
});

test('96. normalizeCatalogVigenciaLabel conserva vigencia 2026–2027 por defecto y acepta edición de Admin', async () => {
  const { normalizeCatalogVigenciaLabel, DEFAULT_CATALOG_VIGENCIA_LABEL } = await import('./storageHelpers.ts');

  assert.equal(normalizeCatalogVigenciaLabel(''), DEFAULT_CATALOG_VIGENCIA_LABEL);
  assert.equal(normalizeCatalogVigenciaLabel('   '), DEFAULT_CATALOG_VIGENCIA_LABEL);
  assert.equal(
    normalizeCatalogVigenciaLabel('Catálogos Oficiales Vigentes 2027 • Próxima Actualización Anual: 2028'),
    'Catálogos Oficiales Vigentes 2027 • Próxima Actualización Anual: 2028'
  );
});

test('97. applyBulkExistenciasPriceAdjustment aplica incremento y descuento masivo sobre múltiples materiales y sincroniza herrajesPrecios', async () => {
  const {
    buildCompactExistenciasList,
    makeInventarioKey,
    resolveExistenciaUnitPrice,
    applyBulkExistenciasPriceAdjustment,
  } = await import('./alumineroLogic.ts');

  const kPerfil = makeInventarioKey('3', 'cabezal', 'natural', 'Perfileto');
  const herrajeId = HERRAJES_INVENTARIO_CATALOGO[0].id;
  const compactItems = buildCompactExistenciasList(
    { [kPerfil]: 4 },
    { [herrajeId]: 6 },
    [{ id: 'v-bulk-1', tipoNombre: 'Claro 6 mm', anchoCm: 260, altoCm: 180, cantidad: 3 }]
  );

  assert.equal(compactItems.length, 3);
  const perfilItem = compactItems.find((i) => i.tipo === 'perfil')!;
  const herrajeItem = compactItems.find((i) => i.tipo === 'herraje')!;
  const vidrioItem = compactItems.find((i) => i.tipo === 'vidrio')!;

  const baseCtx = {
    inventarioPreciosUnitarios: {
      [perfilItem.id]: 400,
      [vidrioItem.id]: 1000,
    },
    herrajesPrecios: {
      [herrajeId]: 200,
    },
  };

  assert.equal(resolveExistenciaUnitPrice(perfilItem, baseCtx).price, 400);
  assert.equal(resolveExistenciaUnitPrice(herrajeItem, baseCtx).price, 200);
  assert.equal(resolveExistenciaUnitPrice(vidrioItem, baseCtx).price, 1000);

  // Incremento masivo +10% sobre perfil y herraje
  const incRes = applyBulkExistenciasPriceAdjustment({
    selectedItems: [perfilItem, herrajeItem],
    mode: 'incremento',
    pct: 10,
    ctx: baseCtx,
  });
  assert.equal(incRes.updatedCount, 2);
  assert.equal(incRes.signedPct, 10);
  assert.equal(incRes.inventarioPreciosUnitarios[perfilItem.id], 440);
  assert.equal(incRes.inventarioPreciosUnitarios[herrajeItem.id], 220);
  assert.equal(incRes.herrajesPrecios[herrajeId], 220);
  assert.equal(incRes.inventarioPreciosUnitarios[vidrioItem.id], 1000);

  // Descuento masivo -15% sobre todos
  const discRes = applyBulkExistenciasPriceAdjustment({
    selectedItems: [perfilItem, herrajeItem, vidrioItem],
    mode: 'descuento',
    pct: 15,
    ctx: {
      inventarioPreciosUnitarios: incRes.inventarioPreciosUnitarios,
      herrajesPrecios: incRes.herrajesPrecios,
    },
  });
  assert.equal(discRes.updatedCount, 3);
  assert.equal(discRes.signedPct, -15);
  assert.equal(discRes.inventarioPreciosUnitarios[perfilItem.id], 374);
  assert.equal(discRes.inventarioPreciosUnitarios[herrajeItem.id], 187);
  assert.equal(discRes.herrajesPrecios[herrajeId], 187);
  assert.equal(discRes.inventarioPreciosUnitarios[vidrioItem.id], 850);

  // Tope máximo de descuento 90% (no permite precios negativos o cero)
  const clampedDisc = applyBulkExistenciasPriceAdjustment({
    selectedItems: [vidrioItem],
    mode: 'descuento',
    pct: 150,
    ctx: baseCtx,
  });
  assert.equal(clampedDisc.signedPct, -90);
  assert.equal(clampedDisc.inventarioPreciosUnitarios[vidrioItem.id], 100);
});

test('98. SKIN_VARIANTS_BY_SKIN define exactamente colores planos (plastas) para Ejecutiva (Azul, Verde, Naranja) e Industrial PRO (Verde, Oro, Plata, Bronce)', async () => {
  const { SKIN_VARIANTS_BY_SKIN } = await import('./storageHelpers.ts');

  assert.deepEqual(
    SKIN_VARIANTS_BY_SKIN.ejecutiva.map((v) => ({ id: v.id, label: v.label })),
    [
      { id: 'default', label: 'Azul' },
      { id: 'verde', label: 'Verde' },
      { id: 'naranja', label: 'Naranja' },
    ]
  );

  assert.deepEqual(
    SKIN_VARIANTS_BY_SKIN.industrial.map((v) => ({ id: v.id, label: v.label })),
    [
      { id: 'default', label: 'Verde' },
      { id: 'dorada', label: 'Oro' },
      { id: 'plateada', label: 'Plata' },
      { id: 'bronce', label: 'Bronce' },
    ]
  );

  for (const list of Object.values(SKIN_VARIANTS_BY_SKIN)) {
    for (const variant of list) {
      assert.match(variant.swatchBg, /^#[0-9A-Fa-f]{6}$/);
      assert.ok(!variant.swatchBg.includes('gradient'));
    }
  }
});

test('99. Versión centralizada APP_VERSION=1.0.4 sincronizada con public/sw.js sin skipWaiting automático en install', async () => {
  const { readFileSync } = await import('node:fs');
  const { APP_VERSION, APP_VERSION_LABEL } = await import('./alumineroLogic.ts');
  assert.equal(APP_VERSION, '1.0.4');
  assert.equal(APP_VERSION_LABEL, 'v1.0.4');

  const swSource = readFileSync('public/sw.js', 'utf8');
  assert.match(swSource, /const APP_VERSION\s*=\s*['"]1\.0\.4['"]/);
  assert.match(swSource, /const CACHE_NAME\s*=\s*`aluminero-pro-v\$\{APP_VERSION\}`/);

  // Verificar que el bloque install NO llama self.skipWaiting() automáticamente
  const installMatch = swSource.match(/self\.addEventListener\(\s*['"]install['"][\s\S]*?\n\}\);/);
  assert.ok(installMatch, 'Debe existir el evento install en public/sw.js');
  const installNoComments = installMatch[0].replace(/\/\/.*$/gm, '');
  assert.equal(
    /self\.skipWaiting\s*\(/.test(installNoComments),
    false,
    'install NO debe llamar self.skipWaiting() automáticamente'
  );

  // Verificar que activate limpia cachés antiguas y message escucha SKIP_WAITING
  assert.match(swSource, /caches\.delete\(key\)/);
  assert.match(swSource, /msg\.type === ['"]SKIP_WAITING['"][\s\S]*?self\.skipWaiting\(\)/);
});

test('100. analyzeHojaProfileWasteVsInventory detecta cobertura de inventario, alto desperdicio y stock en acabado alterno', async () => {
  const { analyzeHojaProfileWasteVsInventory } = await import('./modulacionLogic.ts');
  const { calcularDespiece } = await import('./alumineroLogic.ts');

  const d1 = calcularDespiece({
    linea: '3',
    anchoCm: 140,
    altoCm: 120,
    color: 'natural',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });
  const d2 = calcularDespiece({
    linea: '3',
    anchoCm: 90,
    altoCm: 80,
    color: 'negro',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 1,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });

  const partidas = [
    {
      id: 'p1',
      categoria: 'ventanas' as const,
      linea: '3' as const,
      area: 'Sala',
      etiqueta: 'V-1',
      anchoCm: 140,
      altoCm: 120,
      color: 'natural' as const,
      vidrio: 'claro6' as const,
      hojas: 2,
      apertura: 'corrediza' as const,
      sentidoPuerta: 'izq' as const,
      puertaIntermedio: false,
      puertaEconomica: false,
      invertido: false,
      cantidad: 1,
      modoPrecio: 'm2' as const,
      precioInput: 2600,
      cobrarMinM2: false,
      extraPct: 0,
      totalLinea: 4368,
      despiece: d1,
    },
    {
      id: 'p2',
      categoria: 'ventanas' as const,
      linea: '3' as const,
      area: 'Baño',
      etiqueta: 'V-2',
      anchoCm: 90,
      altoCm: 80,
      color: 'negro' as const,
      vidrio: 'claro6' as const,
      hojas: 2,
      apertura: 'corrediza' as const,
      sentidoPuerta: 'izq' as const,
      puertaIntermedio: false,
      puertaEconomica: false,
      invertido: false,
      cantidad: 1,
      modoPrecio: 'm2' as const,
      precioInput: 2600,
      cobrarMinM2: false,
      extraPct: 0,
      totalLinea: 2400,
      despiece: d2,
    },
  ];

  // Stock en inventario: cabezal y jamba 3" en natural (cubre V-1 y sirve como stock alterno para V-2 negro)
  const inventario: Record<string, number> = {
    '3__cabezal__natural': 3,
    '3__jamba__natural': 3,
    '3__riel__natural': 2,
  };

  const analysis = analyzeHojaProfileWasteVsInventory(partidas, inventario);
  assert.ok(analysis.grupos.length >= 6);
  assert.ok(analysis.tramosCubiertosInventario >= 3, 'Debe detectar cobertura de inventario para perfiles 3" natural');
  assert.ok(analysis.perfilesAltoDesperdicio.length > 0, 'Debe detectar perfiles con bajo aprovechamiento (<70%)');
  assert.equal(analysis.puedeOptimizarse, true);
  assert.ok(
    analysis.sugerencias.some((s) => s.id === 'inv-coverage'),
    'Debe sugerir aprovechar tramos existentes en bodega'
  );
  assert.ok(
    analysis.sugerencias.some((s) => s.id === 'alt-color-inventory'),
    'Debe detectar stock disponible en otro acabado dentro de Mi Inventario'
  );
  assert.ok(
    analysis.sugerencias.some((s) => s.id === 'fragmented-finishes'),
    'Debe detectar fragmentación de acabados (natural + negro) con bajo uso por barra'
  );
});

test('101. buildLeanFreeDeviceUpdatePayload respeta estrictamente las llaves permitidas por firestore.rules', async () => {
  const { buildLeanFreeDeviceUpdatePayload } = await import('./cloudSync.ts');
  const allowedKeys = new Set([
    'cliente',
    'tallerNombre',
    'nombreTaller',
    'tallerResponsable',
    'tallerWhatsapp',
    'ubicacion',
    'deviceLabel',
    'termsAcceptedAt',
    'preferredTheme',
    'preferredSkin',
    'preferredSkinVariant',
    'lastSeenAt',
    'ultimaConexion',
    'totalSessions',
    'totalMinutes',
    'activeDays',
    'updatedAt',
    'plan',
  ]);
  const payload = buildLeanFreeDeviceUpdatePayload({
    cliente: 'Taller El Maestro',
    tallerNombre: 'Taller El Maestro',
    tallerResponsable: 'Juan Pérez',
    tallerWhatsapp: '3312345678',
    ubicacion: 'Guadalajara, Jal.',
    deviceLabel: 'Teléfono Android',
    termsAcceptedAt: 1_765_000_000_000,
    lastSeenAt: 1_765_000_000_000,
    totalSessions: 3,
    totalMinutes: 12,
    activeDays: ['2026-11-26'],
  });
  for (const key of Object.keys(payload)) {
    assert.ok(allowedKeys.has(key), `Llave no permitida en update gratuito de Firestore: ${key}`);
  }
  assert.equal(payload.plan, 'gratis');
  assert.equal(payload.tallerNombre, 'Taller El Maestro');
});

test('102. AdminDashboardView consulta devices con getDocsFromServer + snapshot.size y App.tsx monitorea SW ready/waiting', async () => {
  const { readFileSync } = await import('node:fs');
  const adminSrc = readFileSync('src/components/AdminDashboardView.tsx', 'utf8');
  assert.match(adminSrc, /getDocsFromServer\(collection\(db,\s*['"]devices['"]\)\)/);
  assert.match(adminSrc, /snapshot\.size/);
  assert.match(adminSrc, /Nube actualizada:/);

  const appSrc = readFileSync('src/App.tsx', 'utf8');
  assert.match(appSrc, /navigator\.serviceWorker\.ready/);
  assert.match(appSrc, /reg\.waiting/);
  assert.match(appSrc, /SKIP_WAITING/);
  assert.match(appSrc, /controllerchange/);
  assert.match(appSrc, /¡Hay una nueva actualización disponible!/);
  assert.match(appSrc, /Actualizar ahora/);
  assert.match(appSrc, /Más tarde/);
});

test('103. Historial de sesiones y detección de dispositivo/navegador para colección usuarios', async () => {
  const {
    createSessionHistoryEntry,
    detectBrowserAndDeviceInfo,
    mergeSessionHistoryList,
  } = await import('./cloudSync.ts');

  const androidChrome = detectBrowserAndDeviceInfo(
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0.0.0 Mobile Safari/537.36'
  );
  assert.equal(androidChrome.dispositivo, 'Teléfono Android');
  assert.equal(androidChrome.navegador, 'Chrome');

  const winEdge = detectBrowserAndDeviceInfo(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0'
  );
  assert.equal(winEdge.dispositivo, 'PC Windows');
  assert.equal(winEdge.navegador, 'Edge');

  const baseTs = 1_765_000_000_000;
  const e1 = createSessionHistoryEntry(baseTs, androidChrome.label);
  const eDup = createSessionHistoryEntry(baseTs + 5_000, androidChrome.label);
  const e2 = createSessionHistoryEntry(baseTs + 60_000, winEdge.label);

  assert.match(e1.fecha, /^\d{2}\/\d{2}\/\d{4}$/);
  assert.match(e1.hora, /^\d{2}:\d{2}:\d{2}$/);

  let list = mergeSessionHistoryList([], e1, 30);
  list = mergeSessionHistoryList(list, eDup, 30);
  assert.equal(list.length, 1, 'Debe evitar duplicados dentro de la misma ventana de 20s');

  list = mergeSessionHistoryList(list, e2, 30);
  assert.equal(list.length, 2);

  // Tope máximo de 30 entradas para cumplir reglas de Firestore
  for (let i = 0; i < 40; i++) {
    list = mergeSessionHistoryList(
      list,
      createSessionHistoryEntry(baseTs + (i + 5) * 60_000, 'PC Windows · Chrome'),
      30
    );
  }
  assert.equal(list.length, 30);
});

test('104. public/sw.js usa CACHE_NAME unificado aluminero-pro-v1.0.4, limpia cachés en activate y solo ejecuta skipWaiting en SKIP_WAITING', async () => {
  const { readFileSync } = await import('node:fs');
  const swSrc = readFileSync('public/sw.js', 'utf8');

  assert.match(swSrc, /const APP_VERSION = '1\.0\.4';/);
  assert.match(swSrc, /const CACHE_NAME = `aluminero-pro-v\$\{APP_VERSION\}`;/);
  assert.doesNotMatch(swSrc, /CACHE_VERSION/, 'No deben quedar referencias sueltas a CACHE_VERSION');
  assert.match(swSrc, /keys\.filter\(\(key\) => key !== CACHE_NAME\)\.map\(\(key\) => caches\.delete\(key\)\)/);
  assert.match(swSrc, /msg\.type === 'SKIP_WAITING'[\s\S]*self\.skipWaiting\(\)/);

  // Verificar que install NO llama self.skipWaiting() automáticamente
  const installBlockMatch = swSrc.match(/self\.addEventListener\('install'[\s\S]*?\n\}\);/);
  assert.ok(installBlockMatch, 'Debe existir listener install en sw.js');
  assert.doesNotMatch(
    installBlockMatch[0],
    /^\s*self\.skipWaiting\(\)/m,
    'install NO debe llamar self.skipWaiting() automáticamente'
  );
});

test('105. Bloque 1 y 2: modal legal bloqueante, colección usuarios en Firestore/Admin y acceso Admin intacto', async () => {
  const { readFileSync } = await import('node:fs');

  const gateSrc = readFileSync('src/components/UnifiedWorkshopGateModal.tsx', 'utf8');
  assert.match(gateSrc, /He leído y acepto los Términos, Condiciones y Aviso de Privacidad/);
  assert.match(gateSrc, /blocking\s*=\s*false/);
  assert.match(gateSrc, /btn-gate-open-aviso-legal/);
  assert.match(gateSrc, /btn-gate-open-privacidad/);

  const cloudSrc = readFileSync('src/utils/cloudSync.ts', 'utf8');
  assert.match(cloudSrc, /setDoc\(doc\(db,\s*'usuarios',\s*effectiveUid\)/);
  assert.match(cloudSrc, /ultimaConexion\s*[:=]\s*serverTimestamp\(\)/);
  assert.match(cloudSrc, /getDocsFromServer\(collection\(db,\s*'usuarios'\)\)/);

  const adminSrc = readFileSync('src/components/AdminDashboardView.tsx', 'utf8');
  assert.match(adminSrc, /fetchLiveCloudUsuariosFromServer/);
  assert.match(adminSrc, /Sincronizando nube\.\.\./);
  assert.match(adminSrc, /usuarios registrados/);
  assert.match(adminSrc, /admin-cloud-usuarios-section/);

  const rulesSrc = readFileSync('firestore.rules', 'utf8');
  assert.match(rulesSrc, /match \/usuarios\/\{uid\}/);
  assert.match(rulesSrc, /val is timestamp/);

  // Verificar que AdminGateModal sigue intacto con su acceso de administrador
  const adminGateSrc = readFileSync('src/components/AdminGateModal.tsx', 'utf8');
  assert.match(adminGateSrc, /verifyAdminAccessCredential|Panel de Administrador/);
});

test('106. Acceso libre al inicio y disparador único del modal legal/registro al entrar a Cotización o Cortes', async () => {
  const { readFileSync } = await import('node:fs');
  const appSrc = readFileSync('src/App.tsx', 'utf8');
  const firebaseSrc = readFileSync('src/firebase.ts', 'utf8');

  // Sin bloqueo inicial al abrir la app
  assert.doesNotMatch(
    appSrc,
    /isStartupGateBlocking/,
    'No debe existir bloqueo inicial al abrir la aplicación'
  );
  assert.match(appSrc, /<UnifiedWorkshopGateModal[\s\S]*open=\{unifiedGateTarget !== null\}/);
  assert.match(appSrc, /<UnifiedWorkshopGateModal[\s\S]*blocking=\{false\}/);

  // Disparador en Cotización (Ventanas/Puertas, Hoja, Levantamiento) y Cortes (Modulación, Vidrio 2D)
  assert.match(appSrc, /requestActiveToolAccess\(\s*['"]hoja['"]/);
  assert.match(appSrc, /requestActiveToolAccess\(\s*['"]levantamiento['"]/);
  assert.match(appSrc, /requestActiveToolAccess\(\s*['"]modulacion['"]/);
  assert.match(appSrc, /requestActiveToolAccess\(\s*['"]vidrio['"]/);
  assert.match(appSrc, /'trabajo-ventanas'/);
  assert.match(appSrc, /'trabajo-puertas'/);

  // Google signInWithPopup + manejo de errores de ventana emergente intacto
  const authHelpersSrc = readFileSync('src/utils/firebaseAuthHelpers.ts', 'utf8');
  assert.match(firebaseSrc, /signInWithPopup\(auth,\s*provider\)/);
  assert.match(firebaseSrc, /formatFirebaseAuthError/);
  assert.match(authHelpersSrc, /auth\/popup-blocked/);
  assert.match(authHelpersSrc, /auth\/popup-closed-by-user/);
});

test('107. Google Auth sincrónico con signInWithPopup en onClick, respaldo exclusivo auth/popup-blocked, ● Nube Conectada y getDocs(devices)', async () => {
  const { readFileSync } = await import('node:fs');
  const {
    formatFirebaseAuthError,
    shouldAdminFallbackToRedirect,
  } = await import('./firebaseAuthHelpers.ts');

  // Respaldo a signInWithRedirect ÚNICAMENTE para auth/popup-blocked (incluso en móvil/PWA)
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/popup-blocked' }, { isMobileOrPwa: true }),
    true
  );
  assert.equal(
    shouldAdminFallbackToRedirect({ code: 'auth/popup-blocked' }, { isMobileOrPwa: false }),
    true
  );
  for (const nonRedirectCode of [
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
    'auth/unauthorized-domain',
    'auth/network-request-failed',
    'auth/operation-not-supported-in-this-environment',
    'auth/unknown',
  ]) {
    assert.equal(
      shouldAdminFallbackToRedirect({ code: nonRedirectCode }, { isMobileOrPwa: true }),
      false,
      `${nonRedirectCode} NO debe redirigir con signInWithRedirect`
    );
    assert.equal(
      formatFirebaseAuthError({ code: nonRedirectCode }).shouldFallbackToRedirect,
      false,
      `formatFirebaseAuthError(${nonRedirectCode}).shouldFallbackToRedirect debe ser false`
    );
  }
  assert.equal(
    formatFirebaseAuthError({ code: 'auth/popup-blocked' }).shouldFallbackToRedirect,
    true
  );

  // Verificar src/firebase.ts: sin rama móvil previa a signInWithPopup y respaldo exclusivo en auth/popup-blocked
  const firebaseSrc = readFileSync('src/firebase.ts', 'utf8');
  assert.doesNotMatch(firebaseSrc, /if\s*\(\s*isMobileOrStandalonePwa\(\)\s*\)/);
  assert.match(firebaseSrc, /export function connectGoogleAccountWithFallback\(\)/);
  assert.match(firebaseSrc, /if\s*\(\s*info\.code === 'auth\/popup-blocked'\s*\)/);

  // Verificar AdminDashboardView.tsx: handler sincrónico, signInWithPopup directo, ● Nube Conectada, getDocs(collection(db, 'devices'))
  const adminSrc = readFileSync('src/components/AdminDashboardView.tsx', 'utf8');
  assert.match(adminSrc, /const handleToggleFirebaseGoogleAuth = \(\) => \{/);
  assert.match(adminSrc, /onClick=\{handleToggleFirebaseGoogleAuth\}/);
  assert.match(adminSrc, /const popupPromise = signInWithPopup\(auth,\s*provider\)/);
  assert.match(adminSrc, /if\s*\(\s*code === 'auth\/popup-blocked'\s*\)/);
  assert.match(adminSrc, /● Nube Conectada/);
  assert.match(adminSrc, /getDocs\(collection\(db,\s*'devices'\)\)/);

  // Verificar App.tsx: handleConnectGoogle sincrónico, signInWithPopup directo, ● Nube Conectada, getDocs(collection(db, 'devices'))
  const appSrc = readFileSync('src/App.tsx', 'utf8');
  assert.match(appSrc, /const handleConnectGoogle = \(\) => \{/);
  assert.match(appSrc, /const popupPromise = signInWithPopup\(auth,\s*provider\)/);
  assert.match(appSrc, /if\s*\(\s*code === 'auth\/popup-blocked'\s*\)/);
  assert.match(appSrc, /● Nube Conectada/);
  assert.match(appSrc, /getDocs\(collection\(db,\s*'devices'\)\)/);

  // Verificar que los botones en TopBarAndDrawer y Modals muestran ● Nube Conectada
  const drawerSrc = readFileSync('src/components/TopBarAndDrawer.tsx', 'utf8');
  assert.match(drawerSrc, /● Nube Conectada/);
  const modalsSrc = readFileSync('src/components/Modals.tsx', 'utf8');
  assert.match(modalsSrc, /● Nube Conectada/);

  // Verificar seguridad de Admin intacta
  const adminGateSrc = readFileSync('src/components/AdminGateModal.tsx', 'utf8');
  assert.match(adminGateSrc, /verifyAdminAccessCredential|Panel de Administrador/);
});

test('108. Top 3 materiales frecuentes en inicio, texto/subtítulo de Google y promo 3 días PRO por 3 referidos con caja de regalo', async () => {
  const { readFileSync } = await import('node:fs');
  const {
    GOOGLE_CONNECT_CTA_LABEL,
    GOOGLE_CONNECT_BENEFIT_SUBTITLE,
    REFERRAL_3D_GIFT_TARGET,
    REFERRAL_3D_GIFT_DAYS,
    analyzeFrequentHistorialMaterials,
    countRegisteredReferralsForDevice,
    canShowFreeReferral3DaysPromo,
    isReferralGiftReadyToOpen,
    buildReferral3DaysInviteLink,
    buildReferral3DaysWhatsappUrl,
    buildReferral3DaysGiftLicense,
    isProActive,
  } = await import('./alumineroLogic.ts');

  // 1. Copy exacto del botón Google y subtítulo de respaldo en la nube
  assert.equal(GOOGLE_CONNECT_CTA_LABEL, 'Conectar con Google (Recomendado)');
  assert.equal(
    GOOGLE_CONNECT_BENEFIT_SUBTITLE,
    'Respalda tus cotizaciones y protege tu licencia PRO en la nube para no perder tus datos si cambias de celular o borras el navegador.'
  );

  // 2. Top 3 materiales más usados del historial + cotizaciones guardadas
  const frequent = analyzeFrequentHistorialMaterials(
    [
      { linea: '3', color: 'blanco', cantidad: 4, anchoCm: 150, altoCm: 120, referencia: 'Vidrio Filtrasol 6mm' },
      { linea: '3', color: 'blanco', cantidad: 2, anchoCm: 140, altoCm: 110, referencia: 'Vidrio Filtrasol 6mm' },
      { linea: '2', color: 'negro', cantidad: 3, anchoCm: 100, altoCm: 100, referencia: 'Vidrio claro 6mm' },
      { linea: 'esp', color: 'natural', cantidad: 1, anchoCm: 180, altoCm: 140, referencia: '' },
    ],
    [
      {
        materiales: [
          { nombre: 'Vidrio Templado 9mm', cantidad: 2, unidad: 'm2' },
        ],
      },
    ],
    3
  );
  assert.equal(frequent.length, 3);
  assert.equal(frequent[0].linea, '3');
  assert.equal(frequent[0].color, 'blanco');
  assert.equal(frequent[0].count, 6);
  assert.ok(frequent.some((f) => f.kind === 'vidrio' && /filtrasol/i.test(f.title)));
  assert.equal(analyzeFrequentHistorialMaterials([], [], 3).length, 0);

  // 3. Dinámica de 3 referidos -> 3 días PRO gratis (1 sola vez por ID de Equipo)
  assert.equal(REFERRAL_3D_GIFT_TARGET, 3);
  assert.equal(REFERRAL_3D_GIFT_DAYS, 3);

  assert.equal(canShowFreeReferral3DaysPromo(false, false), true);
  assert.equal(canShowFreeReferral3DaysPromo(true, false), false, 'Oculto si ya es PRO');
  assert.equal(canShowFreeReferral3DaysPromo(false, true), false, 'Oculto si ya canjeó su prueba de 3 días');

  const count = countRegisteredReferralsForDevice(
    'ALM-HOST1',
    [
      { referrerId: 'ALM-HOST1', referredDeviceId: 'ALM-COL1' },
      { referrerId: 'alm-host1', referredDeviceId: 'ALM-COL2' },
      { referrerId: 'ALM-HOST1', referredDeviceId: 'ALM-COL1' }, // duplicado
      { referrerId: 'ALM-HOST1', referredDeviceId: 'ALM-HOST1' }, // auto-referido
    ],
    [
      { deviceId: 'ALM-COL3', referredBy: 'ALM-HOST1' },
      { deviceId: 'ALM-COL2', referredBy: 'ALM-HOST1' }, // duplicado con local
    ]
  );
  assert.equal(count, 3);

  assert.equal(isReferralGiftReadyToOpen(2, false, false), false);
  assert.equal(isReferralGiftReadyToOpen(3, false, false), true);
  assert.equal(isReferralGiftReadyToOpen(3, true, false), false);
  assert.equal(isReferralGiftReadyToOpen(3, false, true), false);

  const inviteLink = buildReferral3DaysInviteLink('ALM-HOST1', 'https://alumineropro.pages.dev');
  assert.equal(inviteLink, 'https://alumineropro.pages.dev/?ref=ALM-HOST1');
  const waUrl = buildReferral3DaysWhatsappUrl('ALM-HOST1', 'Taller Norte', 'https://alumineropro.pages.dev');
  assert.match(waUrl, /^https:\/\/wa\.me\/\?text=/);
  assert.match(decodeURIComponent(waUrl), /ALM-HOST1/);

  const now = 1_780_000_000_000;
  const giftLic = buildReferral3DaysGiftLicense('ALM-HOST1', now);
  assert.equal(giftLic.active, true);
  assert.equal(giftLic.planCode, 'G');
  assert.equal(giftLic.expiresAt, now + 3 * 24 * 60 * 60 * 1000);
  assert.equal(isProActive(giftLic, now + 1000), true);
  assert.equal(isProActive(giftLic, now + 4 * 24 * 60 * 60 * 1000), false);

  // 4. Verificación en componentes de UI: Google button + subtítulo, Banner en Inicio y Menú, Modal de regalo y Admin intacto
  const gateSrc = readFileSync('src/components/UnifiedWorkshopGateModal.tsx', 'utf8');
  assert.match(gateSrc, /GOOGLE_CONNECT_CTA_LABEL/);
  assert.match(gateSrc, /GOOGLE_CONNECT_BENEFIT_SUBTITLE/);

  const drawerSrc = readFileSync('src/components/TopBarAndDrawer.tsx', 'utf8');
  assert.match(drawerSrc, /GOOGLE_CONNECT_CTA_LABEL/);
  assert.match(drawerSrc, /GOOGLE_CONNECT_BENEFIT_SUBTITLE/);
  assert.match(drawerSrc, /ReferralPromoBanner/);
  assert.match(drawerSrc, /variant="drawer"/);

  const modalsSrc = readFileSync('src/components/Modals.tsx', 'utf8');
  assert.match(modalsSrc, /Conectar con Google \(Recomendado\)/);
  assert.match(modalsSrc, /Respalda tus cotizaciones y protege tu licencia PRO en la nube/);

  const mainMenuSrc = readFileSync('src/components/MainMenuView.tsx', 'utf8');
  assert.match(mainMenuSrc, /ReferralPromoBanner/);
  assert.match(mainMenuSrc, /variant="home"/);
  assert.match(mainMenuSrc, /section-home-frequent-materials/);

  const promoBannerSrc = readFileSync('src/components/ReferralPromoBanner.tsx', 'utf8');
  assert.match(promoBannerSrc, /Obtén 3 días PRO gratis/);
  assert.match(promoBannerSrc, /Invita a 3 colegas a registrarse en la app y desbloquea 3 días PRO gratis/);
  assert.match(promoBannerSrc, /Compartir invitación por WhatsApp/);
  assert.match(promoBannerSrc, /de \{REFERRAL_3D_GIFT_TARGET\} invitados registrados/);

  const giftModalSrc = readFileSync('src/components/ReferralGiftRewardModal.tsx', 'utf8');
  assert.match(giftModalSrc, /¡Felicidades! Acabas de obtener 3 días gratis para usar la Versión PRO\./);
  assert.match(giftModalSrc, /Adquiere por lo menos el Plan de 30 Días PRO/);
  assert.match(giftModalSrc, /Ver planes y desbloquear recompensas/);
  assert.match(giftModalSrc, /Usar mis 3 días gratis ahora/);

  // 5. Verificar que Admin Login y SW v1.0.4 permanecen completamente intactos
  const swSrc = readFileSync('public/sw.js', 'utf8');
  assert.match(swSrc, /const APP_VERSION = '1\.0\.4'/);
  assert.match(swSrc, /aluminero-pro-v\$\{APP_VERSION\}/);
  const adminGateSrc = readFileSync('src/components/AdminGateModal.tsx', 'utf8');
  assert.match(adminGateSrc, /verifyAdminAccessCredential|Panel de Administrador/);
});

test('109. Prompt 1: Escáner IA de croquis (1024px JPEG 0.8 + mm JSON), Tramos de 6.10 ya acomodados y Notas Modo Lectura', async () => {
  const { readFileSync } = await import('node:fs');
  const {
    stripBase64DataUrlPrefix,
    formatHojasDashed,
    normalizeScannedSketchResult,
  } = await import('./levantamientoLogic.ts');
  const {
    formatMmWithCommas,
    buildTramos610AcomodadosCards,
    buildDespieceTramos1D,
  } = await import('./modulacionLogic.ts');

  // 1. Limpieza de base64 (elimina prefijo data:image/jpeg;base64,)
  assert.equal(
    stripBase64DataUrlPrefix('data:image/jpeg;base64,/9j/4AAQSkZJRg=='),
    '/9j/4AAQSkZJRg=='
  );
  assert.equal(
    stripBase64DataUrlPrefix('  data:image/png;base64,iVBORw0KGgo=  '),
    'iVBORw0KGgo='
  );
  assert.equal(stripBase64DataUrlPrefix('ABC123=='), 'ABC123==');

  // 2. Normalización de distribución de hojas con guiones (O-X, X-O, O-X-O, X-X)
  assert.equal(formatHojasDashed('OX'), 'O-X');
  assert.equal(formatHojasDashed('x-o'), 'X-O');
  assert.equal(formatHojasDashed('OXO'), 'O-X-O');
  assert.equal(formatHojasDashed('X X'), 'X-X');
  assert.equal(formatHojasDashed('O'), 'O');

  // 3. Normalización de respuesta JSON estricta en milímetros desde Gemini Vision
  const normMm = normalizeScannedSketchResult({
    tipo: 'Ventana Corrediza',
    ancho: 1500,
    alto: 1200,
    hojas: 'O-X',
    unidadDetectada: 'mm',
    area: 'Sala',
    confianza: 'alta',
  });
  assert.equal(normMm.tipo, 'Ventana Corrediza');
  assert.equal(normMm.anchoMm, 1500);
  assert.equal(normMm.altoMm, 1200);
  assert.equal(normMm.anchoCm, 150);
  assert.equal(normMm.altoCm, 120);
  assert.equal(normMm.hojasDistribucion, 'O-X');
  assert.equal(normMm.disposicionHojas, 'OX');
  assert.equal(normMm.hojas, 2);

  // 4. Formato de milímetros con comas y construcción de tarjetas "✓ Tramos de 6.10 ya acomodados"
  assert.equal(formatMmWithCommas(1652), '1,652');
  assert.equal(formatMmWithCommas(4384), '4,384');

  const despiece = calcularDespiece({
    linea: '3',
    anchoCm: 120,
    altoCm: 100,
    color: 'natural',
    vidrio: 'claro6',
    hojas: 2,
    apertura: 'corrediza',
    sentidoPuerta: 'izq',
    puertaIntermedio: false,
    puertaEconomica: false,
    invertido: false,
    cantidad: 2,
    tolerancias: LINEAS_CONFIG['3'].toleranciasDefault,
  });
  const opt1D = buildDespieceTramos1D(despiece.perfiles, 'Ventana 120x100');
  assert.ok(opt1D.grupos.length > 0);

  const cards = buildTramos610AcomodadosCards(opt1D, { defaultAcabado: 'Natural' });
  assert.ok(cards.length > 0);
  const firstCard = cards[0];
  assert.match(firstCard.headerLeft, /· Natural$/);
  assert.match(firstCard.headerRight, /^\d+ barras? de 6\.10 m$/);
  assert.match(firstCard.subtitulo, /^\d+ piezas? · [\d,]+ mm netos · sobrante [\d,]+ mm$/);
  assert.ok(firstCard.barras.length >= 1);
  assert.match(firstCard.barras[0].resumenTexto, /^Barra 1: [\d +]+ · sobra [\d,]+ mm$/);
  assert.ok(
    firstCard.barras[0].piezas.every((p) => p.mm > 0 && p.widthPct > 0 && p.widthPct <= 100)
  );

  // 5. Verificación estática de requisitos clave en los archivos modificados
  const tramosCompSrc = readFileSync('src/components/Tramos610AcomodadosSection.tsx', 'utf8');
  assert.match(tramosCompSrc, /✓ Tramos de 6\.10 ya acomodados/);
  assert.match(tramosCompSrc, /#1b7a9c/);

  const serverSrc = readFileSync('server.ts', 'utf8');
  assert.match(serverSrc, /gemini-2\.5-flash/);
  assert.match(serverSrc, /responseMimeType:\s*'application\/json'/);
  assert.match(serverSrc, /base64Clean/);

  const levSrc = readFileSync('src/components/LevantamientoRapido.tsx', 'utf8');
  assert.match(levSrc, /maxSide\s*=\s*1024/);
  assert.match(levSrc, /'image\/jpeg',\s*0\.8/);
  assert.match(levSrc, /stripBase64DataUrlPrefix/);
  assert.match(levSrc, /Tramos610AcomodadosSection/);
  assert.match(levSrc, /id="lv-hojas"/);

  const notasSrc = readFileSync('src/components/NotasAndCatalogoViews.tsx', 'utf8');
  assert.match(notasSrc, /Modo Lectura/);
  assert.match(notasSrc, /btn-notas-modo-lectura/);
  assert.match(notasSrc, /notas-modo-lectura-view/);

  const trabajoSrc = readFileSync('src/components/TrabajoView.tsx', 'utf8');
  assert.match(trabajoSrc, /Tramos610AcomodadosSection/);
  const hojaSrc = readFileSync('src/components/HojaCotizacionView.tsx', 'utf8');
  assert.match(hojaSrc, /Tramos610AcomodadosSection/);
  const modSrc = readFileSync('src/components/ModulacionCortesView.tsx', 'utf8');
  assert.match(modSrc, /Tramos610AcomodadosSection/);

  // 6. Reglas de oro intactas: SW v1.0.4 y Admin Login sin tocar
  const swSrc = readFileSync('public/sw.js', 'utf8');
  assert.match(swSrc, /const APP_VERSION = '1\.0\.4'/);
  const adminGateSrc = readFileSync('src/components/AdminGateModal.tsx', 'utf8');
  assert.match(adminGateSrc, /verifyAdminAccessCredential|Panel de Administrador/);
});

test('110. Prompt 2: Carátulas plastas (9 combinaciones), 7 personajes transparentes, Firma Portal, Contrato Tabs, Semáforo de Margen PRO y Admin Activos Ahora + getDocsFromServer', async () => {
  const { readFileSync } = await import('node:fs');
  const { computeMarginTrafficLight, computeActiveDevicesMetrics } = await import(
    './marginTrafficLight.ts'
  );

  // 1. Semáforo de Margen — lógica pura y umbrales exactos (<15% rojo, 15%-29.99% amarillo, >=30% verde)
  const loss = computeMarginTrafficLight({ precioCliente: 1000, costoBase: 1200 });
  assert.equal(loss.status, 'rojo');
  assert.equal(loss.label, 'Muy por debajo del margen');
  assert.equal(loss.gananciaNeta, -200);

  const low = computeMarginTrafficLight({ precioCliente: 1000, costoBase: 880 }); // 12%
  assert.equal(low.status, 'rojo');
  assert.equal(low.label, 'Muy por debajo del margen');

  const midLow = computeMarginTrafficLight({ precioCliente: 1000, costoBase: 850 }); // 15%
  assert.equal(midLow.status, 'amarillo');
  assert.equal(midLow.label, 'Un poco por debajo');

  const midHigh = computeMarginTrafficLight({ precioCliente: 1000, costoBase: 701 }); // 29.9%
  assert.equal(midHigh.status, 'amarillo');
  assert.equal(midHigh.label, 'Un poco por debajo');

  const okExact = computeMarginTrafficLight({
    precioCliente: 1000,
    costoBase: 600,
    flete: 50,
    herrajesExtra: 50,
  }); // 30%
  assert.equal(okExact.status, 'verde');
  assert.equal(okExact.label, 'Cumples tu margen');
  assert.equal(okExact.gananciaNeta, 300);

  // 2. Métricas de Actividad en Tiempo Real (Activos ahora: 15m, 24h, 7d, 30d y 24 barras min 6%)
  const now = Date.UTC(2026, 10, 27, 12, 0, 0);
  const metrics = computeActiveDevicesMetrics(
    [
      { lastSeenAt: now - 5 * 60 * 1000 }, // 5 min ago -> 15m, 24h, 7d, 30d
      { lastSeenAt: now - 2 * 60 * 60 * 1000 }, // 2h ago -> 24h, 7d, 30d
      { lastSeenAt: now - 3 * 24 * 60 * 60 * 1000 }, // 3d ago -> 7d, 30d
      { lastSeenAt: now - 20 * 24 * 60 * 60 * 1000 }, // 20d ago -> 30d
      { lastSeenAt: now - 45 * 24 * 60 * 60 * 1000 }, // 45d ago -> none
    ],
    now
  );
  assert.equal(metrics.activos15m, 1);
  assert.equal(metrics.activos24h, 2);
  assert.equal(metrics.activos7d, 3);
  assert.equal(metrics.activos30d, 4);
  assert.equal(metrics.hourly24.length, 24);
  assert.ok(metrics.hourly24.every((b) => b.heightPct >= 6 && b.heightPct <= 100));

  // 3. Carátulas plastas (CSS variables unificadas y Ejecutiva Verde #377340)
  const cssSrc = readFileSync('src/index.css', 'utf8');
  assert.match(cssSrc, /--sk-bg:\s*#0b111f;/);
  assert.match(cssSrc, /--sk-hero:\s*#aa2e26;/);
  assert.match(cssSrc, /--sk-hero:\s*#2a4dcf;/);
  assert.match(cssSrc, /--sk-hero:\s*#377340;/);
  assert.match(cssSrc, /--sk-hero:\s*#d9622a;/);
  assert.match(cssSrc, /--sk-hero:\s*#9a6523;/);
  assert.match(cssSrc, /--sk-hero:\s*#4a5567;/);
  assert.match(cssSrc, /--sk-hero:\s*#834e2f;/);
  assert.match(cssSrc, /#btn-floating-assistant/);

  // 4. 7 Personajes Asistentes + Switch + Keys
  const charSrc = readFileSync('src/components/AssistantCharacters.tsx', 'utf8');
  for (const id of ['robot', 'gatito', 'perrito', 'puerquito', 'gallito', 'castor', 'buho']) {
    assert.ok(charSrc.includes(`'${id}'`), `Debe existir el personaje ${id}`);
  }
  assert.match(charSrc, /aluminero-avatar-visible/);
  assert.match(charSrc, /aluminero-avatar-pos/);

  const drawerSrc = readFileSync('src/components/TopBarAndDrawer.tsx', 'utf8');
  assert.match(drawerSrc, /Mostrar personaje asistente/);
  assert.match(drawerSrc, /Plastas ejecutivas en Azul, Verde o Naranja/);
  assert.match(drawerSrc, /rounded-full/);

  // 5. Modal de Firma con createPortal y orden de botones Aplicar -> Limpiar -> Cancelar
  const sigSrc = readFileSync('src/components/SignaturePadModal.tsx', 'utf8');
  assert.match(sigSrc, /createPortal\(/);
  const idxApply = sigSrc.indexOf('id="btn-signature-apply"');
  const idxClear = sigSrc.indexOf('id="btn-signature-clear"');
  const idxCancel = sigSrc.indexOf('id="btn-signature-cancel"');
  assert.ok(idxApply > 0 && idxClear > idxApply && idxCancel > idxClear);

  // 6. ContratoModal con pestañas Vista Documento y Vista PDF
  const contratoSrc = readFileSync('src/components/ContratoModal.tsx', 'utf8');
  assert.match(contratoSrc, /Vista Documento/);
  assert.match(contratoSrc, /Vista PDF/);
  assert.match(contratoSrc, /buildPdfContratoServicioFile/);

  // 7. Semáforo de Margen 100% oculto en Gratis (PRO/Admin only)
  const marginCardSrc = readFileSync('src/components/MarginTrafficLightCard.tsx', 'utf8');
  assert.match(marginCardSrc, /if\s*\(!props\.proActive\s*&&\s*!props\.isAdmin\)\s*\{\s*return\s+null;\s*\}/);

  // 8. AdminDashboardView con getDocsFromServer(collection(db, 'usuarios')) + snapshot.size + Activos ahora
  const adminDashSrc = readFileSync('src/components/AdminDashboardView.tsx', 'utf8');
  assert.match(adminDashSrc, /getDocsFromServer\(collection\(db,\s*'usuarios'\)\)/);
  assert.match(adminDashSrc, /snapshot\.size/);
  assert.match(adminDashSrc, /Activos ahora/);
  assert.match(adminDashSrc, /Total Registrados/);
  assert.match(adminDashSrc, /Versión Gratuita/);
});

test('111. Botón de tema en TopBar, Acordeones desplegables y Dibujo digitalizado con selección múltiple para cortes 6.10 m', async () => {
  const { readFileSync } = await import('node:fs');
  const {
    parseHojasBlueprint,
    formatCotaMedida,
    syncSelectedPiezaIds,
    togglePiezaSelection,
    toggleSelectAllPiezas,
    filterSelectedPiezasForCut,
  } = await import('./levantamientoSelection.ts');

  // 1. Parseo de plano digitalizado (X corrediza con flecha, O fija, puerta/abatible)
  const ox = parseHojasBlueprint('O-X', 'Ventana Corrediza');
  assert.equal(ox.length, 2);
  assert.equal(ox[0].code, 'O');
  assert.equal(ox[1].code, 'X');
  assert.equal(ox[1].arrowDir, 'left');

  const xo = parseHojasBlueprint('X-O', 'Ventana Corrediza');
  assert.equal(xo[0].code, 'X');
  assert.equal(xo[0].arrowDir, 'right');
  assert.equal(xo[1].code, 'O');

  const oxo = parseHojasBlueprint('O-X-O', 'Ventana Corrediza');
  assert.equal(oxo.length, 3);
  assert.deepEqual(oxo.map((l) => l.code), ['O', 'X', 'O']);

  const fija = parseHojasBlueprint('', 'Ventana Fija');
  assert.deepEqual(fija.map((l) => l.code), ['O']);

  const puerta = parseHojasBlueprint('', 'Puerta');
  assert.deepEqual(puerta.map((l) => l.code), ['A']);

  // 2. Formato limpio de cotas de plano
  assert.equal(formatCotaMedida(132, 'cm'), '132 cm');
  assert.equal(formatCotaMedida(147.9, 'cm'), '147.9 cm');
  assert.equal(formatCotaMedida(150, 'mm'), '1,500 mm');
  assert.equal(formatCotaMedida(132, 'm'), '1.32 m');

  // 3. Selección múltiple y filtrado para tramos de 6.10 m
  const mockPiezas = [
    {
      id: 'p1',
      tipo: 'Ventana Corrediza',
      area: 'Sala',
      anchoCm: 132,
      altoCm: 147.9,
      cant: 1,
      hojas: 'O-X',
      notas: '',
      foto: '',
    },
    {
      id: 'p2',
      tipo: 'Ventana Corrediza',
      area: 'Recámara',
      anchoCm: 180,
      altoCm: 120,
      cant: 1,
      hojas: 'O-X-O',
      notas: '',
      foto: '',
    },
  ];
  let sel = syncSelectedPiezaIds(['p1'], mockPiezas, ['p2']);
  assert.deepEqual(sel, ['p1', 'p2']);

  sel = togglePiezaSelection(sel, 'p1');
  assert.deepEqual(sel, ['p2']);
  assert.deepEqual(
    filterSelectedPiezasForCut(mockPiezas, sel).map((p) => p.id),
    ['p2']
  );

  // Seleccionar todas / Ninguna
  sel = toggleSelectAllPiezas(sel, mockPiezas);
  assert.deepEqual(sel, ['p1', 'p2']);
  sel = toggleSelectAllPiezas(sel, mockPiezas);
  assert.deepEqual(sel, []);
  assert.equal(filterSelectedPiezasForCut(mockPiezas, sel).length, 0);

  // 4. Botón directo de tema claro/oscuro en TopBar conectado en App.tsx
  const topBarSrc = readFileSync('src/components/TopBarAndDrawer.tsx', 'utf8');
  assert.match(topBarSrc, /id="btn-top-theme-toggle"/);
  assert.match(topBarSrc, /onToggleTheme\?: \(\) => void/);
  const appSrc = readFileSync('src/App.tsx', 'utf8');
  assert.match(appSrc, /onToggleTheme=\{handleToggleTheme\}/);

  // 5. Acordeones desplegables en Levantamiento Rápido, Hoja y Trabajo + Dibujo SVG + selección múltiple
  const levSrc = readFileSync('src/components/LevantamientoRapido.tsx', 'utf8');
  assert.match(levSrc, /id="acc-lev-scanner"/);
  assert.match(levSrc, /📷 Escáner de Croquis con IA/);
  assert.match(levSrc, /Toca para escanear dibujo con cámara o foto/);
  assert.match(levSrc, /id="acc-lev-manual"/);
  assert.match(levSrc, /Captura tipo, ancho, alto y acabado/);
  assert.match(levSrc, /id="acc-lev-piezas"/);
  assert.match(levSrc, /id="btn-lev-select-all-cut"/);
  assert.match(levSrc, /id="acc-lev-tramos-610"/);
  assert.match(levSrc, /DigitalWindowDrawingSvg/);
  assert.match(levSrc, /filterSelectedPiezasForCut/);

  const hojaSrc = readFileSync('src/components/HojaCotizacionView.tsx', 'utf8');
  assert.match(hojaSrc, /CollapsibleAccordion/);
  assert.match(hojaSrc, /id="acc-hoja-cliente"/);
  assert.match(hojaSrc, /id="acc-hoja-condiciones"/);

  const trabajoSrc = readFileSync('src/components/TrabajoView.tsx', 'utf8');
  assert.match(trabajoSrc, /CollapsibleAccordion/);
  assert.match(trabajoSrc, /id="acc-trabajo-tramos-610"/);

  // 6. Reglas de oro: SW sigue en 1.0.4 (sin subir versión hasta Prompt 2) y Admin Login intacto
  const swSrc = readFileSync('public/sw.js', 'utf8');
  assert.match(swSrc, /const APP_VERSION = '1\.0\.4'/);
  const adminGateSrc = readFileSync('src/components/AdminGateModal.tsx', 'utf8');
  assert.match(adminGateSrc, /verifyAdminAccessCredential|Panel de Administrador/);
});

test('112. Avatares 3D con halo azul/cobre, animaciones reactivas, Web Audio API, silencio en selector y enlace de selección múltiple 6.10 m', async () => {
  const { readFileSync } = await import('node:fs');
  const {
    computeDragTiltDegrees,
    getCharacterQuickGreeting,
    getCharacterCelebrationText,
    playAssistantSound,
    AVATAR_SOUND_KEY,
    ASSISTANT_CELEBRATE_EVENT_NAME,
  } = await import('./assistantEffects.ts');

  // 1. Física pura de inclinación al arrastrar (dirección y límite [-22°, +22°])
  assert.equal(computeDragTiltDegrees(0, 0), 0);
  assert.ok(computeDragTiltDegrees(8, 0) > 0, 'Debe inclinarse a la derecha');
  assert.ok(computeDragTiltDegrees(-8, 0) < 0, 'Debe inclinarse a la izquierda');
  assert.equal(computeDragTiltDegrees(120, 50), 22);
  assert.equal(computeDragTiltDegrees(-120, -50), -22);

  // 2. Saludos y mensajes de celebración para los 5 personajes principales
  const mainChars = ['gatito', 'perrito', 'gallito', 'puerquito', 'robot'] as const;
  for (const id of mainChars) {
    assert.ok(getCharacterQuickGreeting(id).length > 8);
    assert.ok(getCharacterCelebrationText(id, 'piece').length > 8);
    assert.ok(getCharacterCelebrationText(id, 'quote').length > 8);
    // Silenciado explícitamente nunca reproduce ni lanza excepción
    assert.equal(playAssistantSound(id, 'tap', false), false);
    assert.equal(playAssistantSound(id, 'drop', false), false);
    assert.equal(playAssistantSound(id, 'celebrate', false), false);
  }
  assert.equal(AVATAR_SOUND_KEY, 'aluminero-avatar-sound');
  assert.equal(ASSISTANT_CELEBRATE_EVENT_NAME, 'aluminero:assistant-celebrate');

  // 3. Rediseño 3D SVG con degradados, halo azul metálico/cobre, parpadeo y destellos
  const charSrc = readFileSync('src/components/AssistantCharacters.tsx', 'utf8');
  assert.match(charSrc, /data-halo="blue-copper-bubble"/);
  assert.match(charSrc, /radialGradient/);
  assert.match(charSrc, /assistant-eye-blink/);
  assert.match(charSrc, /assistant-ear-left/);
  assert.match(charSrc, /assistant-part-wiggle/);
  assert.match(charSrc, /assistant-sparkles/);

  // 4. Web Audio API procedural para los 5 sonidos sin archivos externos
  const fxSrc = readFileSync('src/utils/assistantEffects.ts', 'utf8');
  assert.match(fxSrc, /scheduleCatMeow/);
  assert.match(fxSrc, /scheduleDogBark/);
  assert.match(fxSrc, /scheduleRoosterCrow/);
  assert.match(fxSrc, /schedulePigOink/);
  assert.match(fxSrc, /scheduleRobotBipBop/);

  // 5. Interactividad en FloatingAssistant + switch de sonido en SideDrawer + celebración en App y Levantamiento
  const floatSrc = readFileSync('src/components/FloatingAssistant.tsx', 'utf8');
  assert.match(floatSrc, /AVATAR_POS_KEY/);
  assert.match(floatSrc, /computeDragTiltDegrees/);
  assert.match(floatSrc, /assistant-drop-bounce/);
  assert.match(floatSrc, /assistant-celebrate-jump/);
  assert.match(floatSrc, /assistant-idle-float/);
  assert.match(floatSrc, /playAssistantSound/);

  const drawerSrc = readFileSync('src/components/TopBarAndDrawer.tsx', 'utf8');
  assert.match(drawerSrc, /id="btn-drawer-avatar-sound-switch"/);
  assert.match(drawerSrc, /saveAvatarSoundEnabled/);

  const levSrc = readFileSync('src/components/LevantamientoRapido.tsx', 'utf8');
  assert.match(levSrc, /filterSelectedPiezasForCut/);
  assert.match(levSrc, /dispatchAssistantCelebrate\('piece'\)/);

  // 6. Login del administrador intacto
  const adminGateSrc = readFileSync('src/components/AdminGateModal.tsx', 'utf8');
  assert.match(adminGateSrc, /verifyAdminAccessCredential|Panel de Administrador/);
});








