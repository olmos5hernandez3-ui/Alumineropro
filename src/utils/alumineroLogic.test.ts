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
  type AperturaVentanaId,
} from './alumineroLogic';
import {
  MODULACION_MODELOS,
  MODULACION_SERIES,
  MODULACION_SUBLINEAS,
  calcularModulacionCortes,
  buildPartidaFromModulacion,
  optimizarTramos1D,
} from './modulacionLogic';
import { optimizarVidrio2D } from './glassOptimizer2D';
import {
  DEFAULT_CONTRATO_CLAUSES,
  DEFAULT_CONTRATO_CLIENTE,
  DEFAULT_TALLER,
  formatContratoFolio,
} from './storageHelpers';

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

  assert.equal(getOfficialShareUrl(), 'https://pages.dev');
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

test('7. Validación de contraseña del Panel de Administrador con .trim() y PIN maestro 202699', () => {
  assert.equal(ADMIN_ACCESS_PASSWORD, 'Olmos5Hernandes32026');
  assert.equal(verifyAdminPassword('Olmos5Hernandes32026'), true);
  assert.equal(verifyAdminPassword('  Olmos5Hernandes32026  '), true);
  assert.equal(verifyAdminPassword(''), false);
  assert.equal(verifyAdminPassword('TU_CONTRASEÑA_AQUI'), false);
  assert.equal(verifyAdminPassword('olmos5hernandes32026'), false);
  // Si existiera un residuo viejo 'TU_CONTRASEÑA_AQUI' se ignora y sigue aplicando la clave fija
  assert.equal(verifyAdminPassword('Olmos5Hernandes32026', 'TU_CONTRASEÑA_AQUI'), true);
  // Contraseña personalizada guardada tras recuperación con PIN
  assert.equal(verifyAdminPassword('  NuevaClave2026 ', 'NuevaClave2026'), true);
  assert.equal(verifyAdminPassword('Olmos5Hernandes32026', 'NuevaClave2026'), false);

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


