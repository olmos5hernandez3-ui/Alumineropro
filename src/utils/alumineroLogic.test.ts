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


