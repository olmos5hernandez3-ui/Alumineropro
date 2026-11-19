import {
  AperturaVentanaId,
  CATALOGO_PERFILES,
  CortePerfil,
  CorteVidrio,
  LineaId,
  LINEAS_CONFIG,
  PartidaObra,
  PerfilCatalogoId,
  round1,
  round2,
  TRAMO_STD_CM,
} from './alumineroLogic';
import { SobranteItem } from './storageHelpers';

export type ModulacionCategoria = 'ventanas' | 'puertas';

export type ModulacionModeloId =
  | 'win-corrediza'
  | 'win-proyeccion'
  | 'win-abatible'
  | 'win-fija'
  | 'win-sifon'
  | 'win-guillotina'
  | 'door-corrediza'
  | 'door-batiente';

export type ModulacionSerieId =
  | 'u-light'
  | 'c-light'
  | 'linea-2'
  | 'linea-3'
  | 'serie-70'
  | 'serie-80'
  | 'serie-100';

export type ModulacionSublineaId =
  | 'economica-hermetica'
  | 'comercial-hermetica'
  | 'gran-vista-hermetica';

export type ModulacionSeccionId =
  | 'contramarco'
  | 'hoja-fija'
  | 'hoja-movil'
  | 'mosquitero';

export const MODULACION_SECCIONES_META: Array<{
  id: ModulacionSeccionId;
  titulo: string;
  subtitulo: string;
}> = [
  {
    id: 'contramarco',
    titulo: 'Contramarco',
    subtitulo: 'Cabezal, jambas y riel o umbral fijo al vano',
  },
  {
    id: 'hoja-fija',
    titulo: 'Hoja Fija',
    subtitulo: 'Perfiles de hoja fija o paño acristalado fijo',
  },
  {
    id: 'hoja-movil',
    titulo: 'Hoja Móvil',
    subtitulo: 'Perfiles de hoja corrediza, abatible o batiente',
  },
  {
    id: 'mosquitero',
    titulo: 'Mosquitero',
    subtitulo: 'Bastidor de malla y riel guía mosquitero',
  },
];

export interface ModulacionModeloConfig {
  id: ModulacionModeloId;
  categoria: ModulacionCategoria;
  nombre: string;
  resumen: string;
  esCorrediza: boolean;
  esFija: boolean;
}

export const MODULACION_MODELOS: ModulacionModeloConfig[] = [
  {
    id: 'win-corrediza',
    categoria: 'ventanas',
    nombre: 'Corrediza',
    resumen: '2 hojas con riel, cerco y traslape central',
    esCorrediza: true,
    esFija: false,
  },
  {
    id: 'win-proyeccion',
    categoria: 'ventanas',
    nombre: 'Proyección',
    resumen: 'Apertura exterior inferior con brazos tensores',
    esCorrediza: false,
    esFija: false,
  },
  {
    id: 'win-abatible',
    categoria: 'ventanas',
    nombre: 'Abatible',
    resumen: 'Apertura lateral con bisagras y cerradura',
    esCorrediza: false,
    esFija: false,
  },
  {
    id: 'win-fija',
    categoria: 'ventanas',
    nombre: 'Fija',
    resumen: 'Marco perimetral hermético sin hojas móviles',
    esCorrediza: false,
    esFija: true,
  },
  {
    id: 'win-sifon',
    categoria: 'ventanas',
    nombre: 'Sifón',
    resumen: 'Ventilación en ángulo o celosía superior/lateral',
    esCorrediza: false,
    esFija: false,
  },
  {
    id: 'win-guillotina',
    categoria: 'ventanas',
    nombre: 'Guillotina',
    resumen: 'Hojas verticales con contrapesos o balances',
    esCorrediza: true,
    esFija: false,
  },
  {
    id: 'door-corrediza',
    categoria: 'puertas',
    nombre: 'Corrediza',
    resumen: 'Puerta patio deslizante de paso amplio',
    esCorrediza: true,
    esFija: false,
  },
  {
    id: 'door-batiente',
    categoria: 'puertas',
    nombre: 'Batiente',
    resumen: 'Puerta abatible con zoclo reforzado y chapa',
    esCorrediza: false,
    esFija: false,
  },
];

export interface ModulacionSerieConfig {
  id: ModulacionSerieId;
  nombre: string;
  espesorLabel: string;
  descripcion: string;
  mappedLineaVentana: LineaId;
  mappedLineaPuerta: LineaId;
  descuentos: {
    contramarco: number;
    jamba: number;
    riel: number;
    zocloTotalAncho: number;
    cercoAlto: number;
    traslapeAlto: number;
    hojaFijaAncho: number;
    hojaFijaAlto: number;
  };
}

export const MODULACION_SERIES: ModulacionSerieConfig[] = [
  {
    id: 'u-light',
    nombre: 'Línea U Light',
    espesorLabel: '38 mm · Ligera',
    descripcion: 'Perfilería económica ligera en U para vanos compactos',
    mappedLineaVentana: '2',
    mappedLineaPuerta: 'puerta-2',
    descuentos: {
      contramarco: 0,
      jamba: 2.2,
      riel: 3.6,
      zocloTotalAncho: 6.0,
      cercoAlto: 3.2,
      traslapeAlto: 3.2,
      hojaFijaAncho: 2.8,
      hojaFijaAlto: 2.8,
    },
  },
  {
    id: 'c-light',
    nombre: 'Línea C Light',
    espesorLabel: '44 mm · Ligera',
    descripcion: 'Canal en C ligero con mejor ajuste perimetral',
    mappedLineaVentana: '2',
    mappedLineaPuerta: 'puerta-2',
    descuentos: {
      contramarco: 0,
      jamba: 2.4,
      riel: 4.0,
      zocloTotalAncho: 6.4,
      cercoAlto: 3.6,
      traslapeAlto: 3.6,
      hojaFijaAncho: 3.0,
      hojaFijaAlto: 3.0,
    },
  },
  {
    id: 'linea-2',
    nombre: 'Línea 2"',
    espesorLabel: '50.8 mm · Estándar',
    descripcion: 'Línea tradicional de 2 pulgadas para vivienda',
    mappedLineaVentana: '2',
    mappedLineaPuerta: 'puerta-2',
    descuentos: {
      contramarco: 0,
      jamba: 2.5,
      riel: 5.1,
      zocloTotalAncho: 6.4,
      cercoAlto: 4.0,
      traslapeAlto: 4.0,
      hojaFijaAncho: 3.4,
      hojaFijaAlto: 3.4,
    },
  },
  {
    id: 'linea-3',
    nombre: 'Línea 3"',
    espesorLabel: '76.2 mm · Alumer',
    descripcion: 'Línea nacional reforzada de 3 pulgadas para mayor claro',
    mappedLineaVentana: '3',
    mappedLineaPuerta: 'puerta-abatible',
    descuentos: {
      contramarco: 0,
      jamba: 3.2,
      riel: 6.4,
      zocloTotalAncho: 7.5,
      cercoAlto: 4.5,
      traslapeAlto: 4.5,
      hojaFijaAncho: 4.2,
      hojaFijaAlto: 4.2,
    },
  },
  {
    id: 'serie-70',
    nombre: 'Serie 70',
    espesorLabel: '70 mm · Hermética',
    descripcion: 'Sistema europeo perimetral con sellado de doble felpa',
    mappedLineaVentana: 'europea',
    mappedLineaPuerta: 'puerta-europea',
    descuentos: {
      contramarco: 0,
      jamba: 0,
      riel: 5.8,
      zocloTotalAncho: 6.8,
      cercoAlto: 5.2,
      traslapeAlto: 5.2,
      hojaFijaAncho: 4.8,
      hojaFijaAlto: 4.8,
    },
  },
  {
    id: 'serie-80',
    nombre: 'Serie 80',
    espesorLabel: '80 mm · Alta Hermeticidad',
    descripcion: 'Serie robusta para grandes ventanales y puertas patio',
    mappedLineaVentana: 'europea',
    mappedLineaPuerta: 'puerta-europea',
    descuentos: {
      contramarco: 0,
      jamba: 0,
      riel: 6.6,
      zocloTotalAncho: 7.6,
      cercoAlto: 5.6,
      traslapeAlto: 5.6,
      hojaFijaAncho: 5.2,
      hojaFijaAlto: 5.2,
    },
  },
  {
    id: 'serie-100',
    nombre: 'Serie 100',
    espesorLabel: '100 mm · Monumental',
    descripcion: 'Máxima inercia estructural para claros de gran altura',
    mappedLineaVentana: 'europea',
    mappedLineaPuerta: 'puerta-europea',
    descuentos: {
      contramarco: 0,
      jamba: 0,
      riel: 8.0,
      zocloTotalAncho: 9.0,
      cercoAlto: 6.4,
      traslapeAlto: 6.4,
      hojaFijaAncho: 6.0,
      hojaFijaAlto: 6.0,
    },
  },
];

export interface ModulacionSublineaConfig {
  id: ModulacionSublineaId;
  nombre: string;
  descripcion: string;
  ajusteHolguraCm: number;
}

export const MODULACION_SUBLINEAS: ModulacionSublineaConfig[] = [
  {
    id: 'economica-hermetica',
    nombre: 'Económica Hermética',
    descripcion: 'Perfil estándar liviano con empaque hermético básico',
    ajusteHolguraCm: 0,
  },
  {
    id: 'comercial-hermetica',
    nombre: 'Comercial Hermética',
    descripcion: 'Refuerzo intermedio de pared media y doble sello de felpa',
    ajusteHolguraCm: 0.4,
  },
  {
    id: 'gran-vista-hermetica',
    nombre: 'Gran Vista Hermética',
    descripcion: 'Estética minimalista de vista panorámica con cámara reforzada',
    ajusteHolguraCm: 0.8,
  },
];

export interface ModulacionPerfilCorteRow {
  id: string;
  seccion: ModulacionSeccionId;
  codigo: string;
  perfilId: PerfilCatalogoId;
  nombre: string;
  rol: string;
  orientacion: 'horizontal' | 'vertical';
  cantidad: number;
  cantidadLabel: string;
  formulaTexto: string;
  medidaCm: number;
  medidaM: number;
  totalMetros: number;
  angulo: '90°' | '45°';
}

export interface ModulacionCalculoResult {
  modelo: ModulacionModeloConfig;
  serie: ModulacionSerieConfig;
  sublinea: ModulacionSublineaConfig;
  conMosquitero: boolean;
  anchoCm: number;
  altoCm: number;
  perfiles: ModulacionPerfilCorteRow[];
  vidrios: CorteVidrio[];
  totalAluminioM: number;
  tramos610: number;
}

const PROFILE_CODES: Record<PerfilCatalogoId, string> = {
  cabezal: 'ALM-7836',
  jamba: 'ALM-7825',
  riel: 'ALM-7857',
  cerco: 'ALM-7847',
  traslape: 'ALM-7848',
  cabecero: 'ALM-7835',
  zoclo1v: 'ALM-7835-1V',
  zoclo2v: 'ALM-7842',
  alumer_9382: 'ALM-9382',
  alumer_9382c: 'ALM-9382C',
  alumer_7828: 'ALM-7828',
  chambrana: 'CH-19',
  batiente: 'BAT-76',
  alumer_9135: 'ALM-9135',
  alumer_9112: 'ALM-9112',
  alumer_9136: 'ALM-9136',
  alumer_10235: 'ALM-10235',
  alumer_10237: 'ALM-10237',
  alumer_7316: 'ALM-7316',
  alumer_9114: 'ALM-9114',
  alumer_7315: 'ALM-7315',
  alumer_9115: 'ALM-9115',
  alumer_9207: 'ALM-9207',
  alumer_9204: 'ALM-9204',
  alumer_5844: 'ALM-5844',
  alumer_5060: 'ALM-5060',
  alumer_9183: 'ALM-9183',
  alumer_9187: 'ALM-9187',
  alumer_8550: 'ALM-8550',
  alumer_6370: 'ALM-6370',
  alumer_9184: 'ALM-9184',
  alumer_12756: 'ALM-12756',
  alumer_11032: 'ALM-11032',
  alumer_11174: 'ALM-11174',
  alumer_11386: 'ALM-11386',
  alumer_11387: 'ALM-11387',
  alumer_11035: 'ALM-11035',
  alumer_11046: 'ALM-11046',
  alumer_11173: 'ALM-11173',
  mosq_marco: 'MOSQ-25',
  riel_mosq: 'RM-18',
};

export interface PerfilBaseModulacion {
  id: string;
  seccion: ModulacionSeccionId;
  codigo: string;
  perfilId: PerfilCatalogoId;
  nombre: string;
  rol: string;
  orientacion: 'horizontal' | 'vertical';
  cantidad: number;
  cantidadLabel: string;
  calcRule:
    | 'contramarco'
    | 'jamba'
    | 'riel'
    | 'zoclo'
    | 'cerco'
    | 'traslape'
    | 'mosq_h'
    | 'mosq_v'
    | 'riel_mosq';
}

export function getPerfilesBaseModulacion(
  modeloId: ModulacionModeloId,
  conMosquitero: boolean
): PerfilBaseModulacion[] {
  const modelo = MODULACION_MODELOS.find((m) => m.id === modeloId) || MODULACION_MODELOS[0];
  const isDoor = modelo.categoria === 'puertas';
  const isFija = modelo.esFija;
  const isGuillotina = modelo.id === 'win-guillotina';

  const base: PerfilBaseModulacion[] = [
    {
      id: 'contramarco',
      seccion: 'contramarco',
      codigo: PROFILE_CODES.cabezal,
      perfilId: 'cabezal',
      nombre: 'Contramarco (Cabezal)',
      rol: 'Marco superior perimetral del vano',
      orientacion: 'horizontal',
      cantidad: 1,
      cantidadLabel: 'x1 horizontal',
      calcRule: 'contramarco',
    },
    {
      id: 'jamba',
      seccion: 'contramarco',
      codigo: PROFILE_CODES.jamba,
      perfilId: 'jamba',
      nombre: 'Jamba',
      rol: 'Laterales verticales de guía y cierre del marco',
      orientacion: 'vertical',
      cantidad: 2,
      cantidadLabel: 'x2 verticales',
      calcRule: 'jamba',
    },
    {
      id: 'riel',
      seccion: 'contramarco',
      codigo: PROFILE_CODES.riel,
      perfilId: 'riel',
      nombre: isFija ? 'Riel / Base inferior' : isDoor && !modelo.esCorrediza ? 'Umbral / Riel inferior' : 'Riel',
      rol: isFija
        ? 'Base horizontal inferior de asiento en el vano'
        : 'Pista inferior donde corren o asientan las hojas',
      orientacion: 'horizontal',
      cantidad: 1,
      cantidadLabel: 'x1 horizontal',
      calcRule: 'riel',
    },
  ];

  const zocloPerfil: PerfilCatalogoId = isDoor ? 'zoclo2v' : 'zoclo1v';

  if (modelo.esCorrediza) {
    // Hoja Fija
    base.push(
      {
        id: 'zoclo_fija',
        seccion: 'hoja-fija',
        codigo: PROFILE_CODES[zocloPerfil],
        perfilId: zocloPerfil,
        nombre: isGuillotina ? 'Zoclo / Cabecero Hoja Superior Fija' : 'Zoclo / Cabecero Hoja Fija',
        rol: 'Cabezal y zoclo inferior horizontal de la hoja fija',
        orientacion: 'horizontal',
        cantidad: 2,
        cantidadLabel: 'x2 horizontales',
        calcRule: 'zoclo',
      },
      {
        id: 'cerco_fija',
        seccion: 'hoja-fija',
        codigo: PROFILE_CODES.cerco,
        perfilId: 'cerco',
        nombre: 'Cerco Hoja Fija',
        rol: 'Vertical lateral de cierre contra jamba en hoja fija',
        orientacion: 'vertical',
        cantidad: 1,
        cantidadLabel: 'x1 vertical',
        calcRule: 'cerco',
      },
      {
        id: 'traslape_fija',
        seccion: 'hoja-fija',
        codigo: PROFILE_CODES.traslape,
        perfilId: 'traslape',
        nombre: 'Traslape Hoja Fija',
        rol: 'Vertical central de encuentro con la hoja móvil',
        orientacion: 'vertical',
        cantidad: 1,
        cantidadLabel: 'x1 vertical',
        calcRule: 'traslape',
      }
    );

    // Hoja Móvil
    base.push(
      {
        id: 'zoclo_movil',
        seccion: 'hoja-movil',
        codigo: PROFILE_CODES[zocloPerfil],
        perfilId: zocloPerfil,
        nombre: isGuillotina ? 'Zoclo / Cabecero Hoja Inferior Móvil' : 'Zoclo / Cabecero Hoja Móvil',
        rol: 'Cabezal y zoclo inferior horizontal con carretillas de hoja móvil',
        orientacion: 'horizontal',
        cantidad: 2,
        cantidadLabel: 'x2 horizontales',
        calcRule: 'zoclo',
      },
      {
        id: 'cerco_movil',
        seccion: 'hoja-movil',
        codigo: PROFILE_CODES.cerco,
        perfilId: 'cerco',
        nombre: 'Cerco Hoja Móvil',
        rol: 'Vertical exterior con alojamiento de jaladera / chapa',
        orientacion: 'vertical',
        cantidad: 1,
        cantidadLabel: 'x1 vertical',
        calcRule: 'cerco',
      },
      {
        id: 'traslape_movil',
        seccion: 'hoja-movil',
        codigo: PROFILE_CODES.traslape,
        perfilId: 'traslape',
        nombre: 'Traslape Hoja Móvil',
        rol: 'Vertical central de sello con felpa guardapolvo',
        orientacion: 'vertical',
        cantidad: 1,
        cantidadLabel: 'x1 vertical',
        calcRule: 'traslape',
      }
    );
  } else if (isFija) {
    base.push(
      {
        id: 'zoclo',
        seccion: 'hoja-fija',
        codigo: PROFILE_CODES[zocloPerfil],
        perfilId: zocloPerfil,
        nombre: 'Zoclo / Junquillo Horizontal Fijo',
        rol: 'Travesaño horizontal superior/inferior de asiento del cristal',
        orientacion: 'horizontal',
        cantidad: 2,
        cantidadLabel: 'x2 horizontales',
        calcRule: 'zoclo',
      },
      {
        id: 'cerco',
        seccion: 'hoja-fija',
        codigo: PROFILE_CODES.cerco,
        perfilId: 'cerco',
        nombre: 'Cerco / Vertical Fijo',
        rol: 'Verticales laterales interiores para asiento del cristal fijo',
        orientacion: 'vertical',
        cantidad: 2,
        cantidadLabel: 'x2 verticales',
        calcRule: 'cerco',
      }
    );
  } else {
    // Abatible, Proyección, Sifón o Puerta Batiente (Hoja Móvil)
    base.push(
      {
        id: 'zoclo',
        seccion: 'hoja-movil',
        codigo: PROFILE_CODES[zocloPerfil],
        perfilId: zocloPerfil,
        nombre: 'Cabezal y Zoclo Hoja Móvil',
        rol: 'Horizontales superior e inferior de la hoja abatible/proyectante',
        orientacion: 'horizontal',
        cantidad: 2,
        cantidadLabel: 'x2 horizontales',
        calcRule: 'zoclo',
      },
      {
        id: 'cerco',
        seccion: 'hoja-movil',
        codigo: PROFILE_CODES.cerco,
        perfilId: 'cerco',
        nombre: 'Cerco Hoja Móvil',
        rol: 'Verticales laterales de la hoja (bisagras y chapa/manija)',
        orientacion: 'vertical',
        cantidad: 2,
        cantidadLabel: 'x2 verticales',
        calcRule: 'cerco',
      },
      {
        id: 'traslape',
        seccion: 'hoja-movil',
        codigo: PROFILE_CODES.traslape,
        perfilId: 'traslape',
        nombre: isDoor ? 'Peinazo / Intermedio Hoja Móvil' : 'Batiente / Remate Hoja Móvil',
        rol: isDoor ? 'Travesaño intermedio o contrabatiente de puerta' : 'Perfil de remate y sellado de hoja móvil',
        orientacion: 'vertical',
        cantidad: 1,
        cantidadLabel: 'x1 pieza',
        calcRule: 'traslape',
      }
    );
  }

  if (conMosquitero) {
    base.push(
      {
        id: 'mosq_h',
        seccion: 'mosquitero',
        codigo: PROFILE_CODES.mosq_marco,
        perfilId: 'mosq_marco',
        nombre: 'Marco Mosquitero (Horizontales)',
        rol: 'Cabezal y zoclo de la hoja de malla mosquitera',
        orientacion: 'horizontal',
        cantidad: 2,
        cantidadLabel: 'x2 horizontales',
        calcRule: 'mosq_h',
      },
      {
        id: 'mosq_v',
        seccion: 'mosquitero',
        codigo: PROFILE_CODES.mosq_marco,
        perfilId: 'mosq_marco',
        nombre: 'Marco Mosquitero (Verticales)',
        rol: 'Laterales verticales de la hoja de malla mosquitera',
        orientacion: 'vertical',
        cantidad: 2,
        cantidadLabel: 'x2 verticales',
        calcRule: 'mosq_v',
      },
      {
        id: 'riel_mosq',
        seccion: 'mosquitero',
        codigo: PROFILE_CODES.riel_mosq,
        perfilId: 'riel_mosq',
        nombre: 'Riel Mosquitero',
        rol: 'Guía adicional para deslizar o fijar el mosquitero',
        orientacion: 'horizontal',
        cantidad: 2,
        cantidadLabel: 'x2 horizontales',
        calcRule: 'riel_mosq',
      }
    );
  }

  return base;
}

export function calcularModulacionCortes(input: {
  modeloId: ModulacionModeloId;
  conMosquitero: boolean;
  serieId: ModulacionSerieId;
  sublineaId: ModulacionSublineaId;
  anchoCm: number;
  altoCm: number;
}): ModulacionCalculoResult {
  const modelo = MODULACION_MODELOS.find((m) => m.id === input.modeloId) || MODULACION_MODELOS[0];
  const serie = MODULACION_SERIES.find((s) => s.id === input.serieId) || MODULACION_SERIES[3];
  const sublinea =
    MODULACION_SUBLINEAS.find((sl) => sl.id === input.sublineaId) || MODULACION_SUBLINEAS[0];

  const ancho = Math.max(20, Number(input.anchoCm) || 120);
  const alto = Math.max(20, Number(input.altoCm) || 100);
  const adj = sublinea.ajusteHolguraCm;
  const d = serie.descuentos;
  const isSerieEuropea =
    serie.id === 'serie-70' || serie.id === 'serie-80' || serie.id === 'serie-100';
  const anguloMarco: '90°' | '45°' = isSerieEuropea ? '45°' : '90°';

  const baseList = getPerfilesBaseModulacion(modelo.id, input.conMosquitero);

  const perfiles: ModulacionPerfilCorteRow[] = baseList.map((item) => {
    let medidaCm = 0;
    let formulaTexto = '';
    let angulo: '90°' | '45°' = '90°';

    if (item.calcRule === 'contramarco') {
      const desc = round1(d.contramarco);
      medidaCm = round1(Math.max(10, ancho - desc));
      formulaTexto = desc === 0 ? 'Ancho exacto (0.0 cm)' : `Ancho - ${desc.toFixed(1)} cm`;
      angulo = anguloMarco;
    } else if (item.calcRule === 'jamba') {
      const desc = round1(d.jamba);
      medidaCm = round1(Math.max(10, alto - desc));
      formulaTexto = desc === 0 ? 'Alto exacto (0.0 cm)' : `Alto - ${desc.toFixed(1)} cm`;
      angulo = anguloMarco;
    } else if (item.calcRule === 'riel') {
      const desc = round1(d.riel + adj * 0.5);
      medidaCm = round1(Math.max(10, ancho - desc));
      formulaTexto = `Ancho - ${desc.toFixed(1)} cm`;
    } else if (item.calcRule === 'zoclo') {
      if (modelo.esCorrediza && modelo.id !== 'win-guillotina') {
        const descTotal = round1(d.zocloTotalAncho + adj);
        medidaCm = round1(Math.max(10, (ancho - descTotal) / 2));
        formulaTexto = `(Ancho - ${descTotal.toFixed(1)} cm) ÷ 2`;
      } else {
        const desc = round1(d.hojaFijaAncho + adj);
        medidaCm = round1(Math.max(10, ancho - desc));
        formulaTexto = `Ancho - ${desc.toFixed(1)} cm`;
      }
      angulo = isSerieEuropea && !modelo.esCorrediza ? '45°' : '90°';
    } else if (item.calcRule === 'cerco') {
      if (modelo.id === 'win-guillotina') {
        const desc = round1(d.cercoAlto + adj);
        medidaCm = round1(Math.max(10, (alto - desc) / 2));
        formulaTexto = `(Alto - ${desc.toFixed(1)} cm) ÷ 2`;
      } else {
        const desc = round1((modelo.esFija ? d.hojaFijaAlto : d.cercoAlto) + adj);
        medidaCm = round1(Math.max(10, alto - desc));
        formulaTexto = `Alto - ${desc.toFixed(1)} cm`;
      }
      angulo = isSerieEuropea && !modelo.esCorrediza ? '45°' : '90°';
    } else if (item.calcRule === 'traslape') {
      if (modelo.id === 'win-guillotina' || modelo.categoria === 'puertas') {
        const desc = round1(d.traslapeAlto + adj);
        medidaCm = round1(Math.max(10, modelo.esCorrediza ? alto - desc : ancho - d.zocloTotalAncho));
        formulaTexto = modelo.esCorrediza ? `Alto - ${desc.toFixed(1)} cm` : `Ancho - ${d.zocloTotalAncho.toFixed(1)} cm`;
      } else {
        const desc = round1(d.traslapeAlto + adj);
        medidaCm = round1(Math.max(10, alto - desc));
        formulaTexto = `Alto - ${desc.toFixed(1)} cm`;
      }
    } else if (item.calcRule === 'mosq_h') {
      const desc = round1((d.zocloTotalAncho + adj) / 2 + 2.2);
      medidaCm = round1(Math.max(10, ancho / 2 - (modelo.esCorrediza ? 1.8 : 4.5)));
      formulaTexto = modelo.esCorrediza ? '(Ancho ÷ 2) - 1.8 cm' : `Ancho - ${desc.toFixed(1)} cm`;
      if (!modelo.esCorrediza) {
        medidaCm = round1(Math.max(10, ancho - desc));
      }
    } else if (item.calcRule === 'mosq_v') {
      const desc = round1(d.cercoAlto + 0.6);
      medidaCm = round1(Math.max(10, alto - desc));
      formulaTexto = `Alto - ${desc.toFixed(1)} cm`;
    } else if (item.calcRule === 'riel_mosq') {
      const desc = round1(d.riel);
      medidaCm = round1(Math.max(10, ancho - desc));
      formulaTexto = `Ancho - ${desc.toFixed(1)} cm`;
    }

    const totalMetros = round2((medidaCm * item.cantidad) / 100);
    return {
      id: item.id,
      seccion: item.seccion,
      codigo: item.codigo,
      perfilId: item.perfilId,
      nombre: item.nombre,
      rol: item.rol,
      orientacion: item.orientacion,
      cantidad: item.cantidad,
      cantidadLabel: item.cantidadLabel,
      formulaTexto,
      medidaCm,
      medidaM: round2(medidaCm / 100),
      totalMetros,
      angulo,
    };
  });

  // Cálculo de vidrios estimados de la modulación para integración 2D y Hoja de Cotización
  const vidrios: CorteVidrio[] = [];
  if (modelo.esCorrediza && modelo.id !== 'win-guillotina') {
    const vw = round1(Math.max(15, (ancho - (d.zocloTotalAncho + adj)) / 2 - 1.2));
    const vh = round1(Math.max(15, alto - (d.cercoAlto + adj) - 9.5));
    vidrios.push({
      tipo: 'vidrio',
      nombre: `Vidrio ${modelo.nombre} (${serie.nombre})`,
      pzas: 2,
      anchoCm: vw,
      altoCm: vh,
      areaM2: round2(((vw * vh) / 10000) * 2),
      espesorLabel: 'Claro 6 mm',
      permitirRotacion: true,
    });
  } else if (modelo.id === 'win-guillotina') {
    const vw = round1(Math.max(15, ancho - (d.hojaFijaAncho + adj) - 2.0));
    const vh = round1(Math.max(15, (alto - (d.cercoAlto + adj)) / 2 - 5.5));
    vidrios.push({
      tipo: 'vidrio',
      nombre: `Vidrio Guillotina (${serie.nombre})`,
      pzas: 2,
      anchoCm: vw,
      altoCm: vh,
      areaM2: round2(((vw * vh) / 10000) * 2),
      espesorLabel: 'Claro 6 mm',
      permitirRotacion: true,
    });
  } else {
    const vw = round1(Math.max(15, ancho - (d.hojaFijaAncho + adj) - 3.2));
    const vh = round1(Math.max(15, alto - (d.hojaFijaAlto + adj) - 4.2));
    vidrios.push({
      tipo: 'vidrio',
      nombre: `Vidrio ${modelo.nombre} (${serie.nombre})`,
      pzas: 1,
      anchoCm: vw,
      altoCm: vh,
      areaM2: round2((vw * vh) / 10000),
      espesorLabel: 'Claro 6 mm',
      permitirRotacion: true,
    });
  }

  const totalAluminioM = round2(perfiles.reduce((acc, r) => acc + r.totalMetros, 0));
  const tramos610 = Math.max(1, Math.ceil((totalAluminioM * 100) / TRAMO_STD_CM));

  return {
    modelo,
    serie,
    sublinea,
    conMosquitero: input.conMosquitero,
    anchoCm: round1(ancho),
    altoCm: round1(alto),
    perfiles,
    vidrios,
    totalAluminioM,
    tramos610,
  };
}

/* ==================== OPTIMIZADOR 1D DE TRAMOS (6.10 m) Y SOBRANTES ==================== */
export interface CorteTramo1DPieza {
  nombre: string;
  seccion: ModulacionSeccionId;
  medidaCm: number;
}

export interface Tramo1DBarraPlan {
  id: string;
  origen: 'sobrante-inventario' | 'tramo-610';
  sobranteOrigenId?: string;
  etiquetaOrigen: string;
  marca?: string;
  largoTotalCm: number;
  cortes: CorteTramo1DPieza[];
  usadoCm: number;
  desperdicioDiscoCm: number;
  sobranteCm: number;
  esMerma: boolean;
  aprovechamientoPct: number;
}

export interface Tramo1DGrupoPerfil {
  perfilId: PerfilCatalogoId;
  perfilNombre: string;
  codigo: string;
  barras: Tramo1DBarraPlan[];
  tramos610Requeridos: number;
  sobrantesUsados: number;
  metrosCortes: number;
  sobranteTotalCm: number;
  mermaTotalCm: number;
  aprovechamientoPct: number;
}

export interface SobranteGeneradoSugerido {
  perfilId: PerfilCatalogoId;
  perfilNombre: string;
  largoCm: number;
  largoM: number;
  cantidad: number;
}

export interface OptimizacionTramos1DResult {
  grupos: Tramo1DGrupoPerfil[];
  tramos610Totales: number;
  sobrantesInventarioUsados: number;
  metrosCortesTotales: number;
  sobranteTotalCm: number;
  mermaTotalCm: number;
  aprovechamientoGlobalPct: number;
  sobrantesGeneradosGuardables: SobranteGeneradoSugerido[];
}

export function optimizarTramos1D(input: {
  perfiles: ModulacionPerfilCorteRow[];
  sobrantesInventario?: SobranteItem[];
  lineaCompatible?: LineaId;
  kerfCm?: number;
  minSobranteGuardableCm?: number;
}): OptimizacionTramos1DResult {
  const kerf = Math.max(0, Number(input.kerfCm ?? 0.35));
  const minSaveCm = Math.max(10, Number(input.minSobranteGuardableCm ?? 45));
  const invSobrantes = input.sobrantesInventario || [];

  // Agrupar cortes individuales por perfilId físico
  const byPerfil = new Map<
    PerfilCatalogoId,
    { codigo: string; piezas: CorteTramo1DPieza[] }
  >();

  for (const row of input.perfiles) {
    if (!byPerfil.has(row.perfilId)) {
      byPerfil.set(row.perfilId, { codigo: row.codigo, piezas: [] });
    }
    const bucket = byPerfil.get(row.perfilId)!;
    for (let i = 0; i < Math.max(1, row.cantidad); i++) {
      bucket.piezas.push({
        nombre: row.nombre,
        seccion: row.seccion,
        medidaCm: row.medidaCm,
      });
    }
  }

  const grupos: Tramo1DGrupoPerfil[] = [];
  const offcutAggregator = new Map<string, SobranteGeneradoSugerido>();

  for (const [perfilId, data] of byPerfil.entries()) {
    const perfilCatalogo = CATALOGO_PERFILES.find((p) => p.id === perfilId);
    const perfilNombre = perfilCatalogo?.nombre || perfilId;

    // Ordenar piezas de mayor a menor (First/Best-Fit Decreasing)
    const piezasOrdenadas = [...data.piezas].sort((a, b) => b.medidaCm - a.medidaCm);

    // Sobrantes disponibles compatibles en inventario (priorizar los más cortos que sirvan)
    const sobrantesPool: Array<{
      id: string;
      largoCm: number;
      marca?: string;
      linea: LineaId;
    }> = [];
    for (const s of invSobrantes) {
      if (s.perfilId !== perfilId) continue;
      if (input.lineaCompatible && s.linea !== input.lineaCompatible) {
        // Permite compatibilidad si no se filtra estricto, pero si se pasa lineaCompatible prioriza misma línea; aún así incluimos compatibles de misma serie o exacta
        continue;
      }
      const cm = round1((Number(s.largoM) || 0) * 100);
      if (cm <= 0) continue;
      const qty = Math.max(1, Math.round(Number(s.cantidad) || 1));
      for (let q = 0; q < qty; q++) {
        sobrantesPool.push({
          id: s.id,
          largoCm: cm,
          marca: s.marca,
          linea: s.linea,
        });
      }
    }
    // Ordenar sobrantes del más corto al más largo para aprovechar retazos chicos primero (Best-Fit)
    sobrantesPool.sort((a, b) => a.largoCm - b.largoCm);

    const barrasAbiertas: Array<{
      id: string;
      origen: 'sobrante-inventario' | 'tramo-610';
      sobranteOrigenId?: string;
      etiquetaOrigen: string;
      marca?: string;
      largoTotalCm: number;
      restanteCm: number;
      cortes: CorteTramo1DPieza[];
      discoCm: number;
    }> = [];

    let tramoCounter = 0;
    let sobCounter = 0;

    for (const pieza of piezasOrdenadas) {
      // 1. Buscar mejor barra abierta donde quepa (menor desperdicio restante después de cortar)
      let bestOpenIdx = -1;
      let bestRemaining = Infinity;

      for (let idx = 0; idx < barrasAbiertas.length; idx++) {
        const b = barrasAbiertas[idx];
        const needed = pieza.medidaCm + kerf;
        if (needed <= b.restanteCm + 0.001) {
          const rem = b.restanteCm - needed;
          if (rem < bestRemaining) {
            bestRemaining = rem;
            bestOpenIdx = idx;
          }
        }
      }

      if (bestOpenIdx >= 0) {
        const b = barrasAbiertas[bestOpenIdx];
        b.cortes.push(pieza);
        b.discoCm = round2(b.discoCm + kerf);
        b.restanteCm = round2(Math.max(0, b.restanteCm - (pieza.medidaCm + kerf)));
        continue;
      }

      // 2. Si no cabe en barras abiertas, buscar primero un sobrante compatible del inventario
      const sobIdx = sobrantesPool.findIndex((s) => s.largoCm >= pieza.medidaCm);
      if (sobIdx >= 0) {
        const sob = sobrantesPool.splice(sobIdx, 1)[0];
        sobCounter += 1;
        const kerfFirst = Math.min(kerf, Math.max(0, round2(sob.largoCm - pieza.medidaCm)));
        barrasAbiertas.push({
          id: `sob-use-${perfilId}-${sobCounter}`,
          origen: 'sobrante-inventario',
          sobranteOrigenId: sob.id,
          etiquetaOrigen: `Sobrante taller #${sobCounter} (${(sob.largoCm / 100).toFixed(2)} m)`,
          marca: sob.marca,
          largoTotalCm: sob.largoCm,
          restanteCm: round2(Math.max(0, sob.largoCm - pieza.medidaCm - kerfFirst)),
          cortes: [pieza],
          discoCm: kerfFirst,
        });
        continue;
      }

      // 3. Abrir un nuevo tramo completo de 6.10 m (610 cm) descontando grosor del disco en cada corte
      tramoCounter += 1;
      const barLen = Math.max(TRAMO_STD_CM, round1(pieza.medidaCm + kerf));
      const kerfFirst = Math.min(kerf, Math.max(0, round2(barLen - pieza.medidaCm)));
      barrasAbiertas.push({
        id: `tramo-${perfilId}-${tramoCounter}`,
        origen: 'tramo-610',
        etiquetaOrigen: `Tramo 6.10 m #${tramoCounter}`,
        largoTotalCm: barLen,
        restanteCm: round2(Math.max(0, barLen - pieza.medidaCm - kerfFirst)),
        cortes: [pieza],
        discoCm: kerfFirst,
      });
    }

    const barrasPlan: Tramo1DBarraPlan[] = barrasAbiertas.map((b) => {
      const usadoCm = round1(b.cortes.reduce((acc, c) => acc + c.medidaCm, 0));
      const sobranteCm = round1(Math.max(0, b.largoTotalCm - usadoCm - b.discoCm));
      const esMerma = sobranteCm > 0 && sobranteCm < minSaveCm;
      const pct = b.largoTotalCm > 0 ? round1((usadoCm / b.largoTotalCm) * 100) : 0;

      if (b.origen === 'tramo-610' && sobranteCm >= minSaveCm && sobranteCm < 600) {
        const key = `${perfilId}__${sobranteCm}`;
        const existing = offcutAggregator.get(key);
        if (existing) {
          existing.cantidad += 1;
        } else {
          offcutAggregator.set(key, {
            perfilId,
            perfilNombre,
            largoCm: sobranteCm,
            largoM: round2(sobranteCm / 100),
            cantidad: 1,
          });
        }
      }

      return {
        id: b.id,
        origen: b.origen,
        sobranteOrigenId: b.sobranteOrigenId,
        etiquetaOrigen: b.etiquetaOrigen,
        marca: b.marca,
        largoTotalCm: b.largoTotalCm,
        cortes: b.cortes,
        usadoCm,
        desperdicioDiscoCm: round2(b.discoCm),
        sobranteCm,
        esMerma,
        aprovechamientoPct: pct,
      };
    });

    const tramos610Requeridos = barrasPlan.filter((b) => b.origen === 'tramo-610').length;
    const sobrantesUsados = barrasPlan.filter((b) => b.origen === 'sobrante-inventario').length;
    const totalCapacidadCm = barrasPlan.reduce((a, b) => a + b.largoTotalCm, 0);
    const totalUsadoCm = barrasPlan.reduce((a, b) => a + b.usadoCm, 0);
    const sobranteTotalCm = round1(barrasPlan.reduce((a, b) => a + b.sobranteCm, 0));
    const mermaTotalCm = round1(barrasPlan.reduce((a, b) => a + (b.esMerma ? b.sobranteCm : 0), 0));

    grupos.push({
      perfilId,
      perfilNombre,
      codigo: data.codigo,
      barras: barrasPlan,
      tramos610Requeridos,
      sobrantesUsados,
      metrosCortes: round2(totalUsadoCm / 100),
      sobranteTotalCm,
      mermaTotalCm,
      aprovechamientoPct: totalCapacidadCm > 0 ? round1((totalUsadoCm / totalCapacidadCm) * 100) : 0,
    });
  }

  const tramos610Totales = grupos.reduce((a, g) => a + g.tramos610Requeridos, 0);
  const sobrantesInventarioUsados = grupos.reduce((a, g) => a + g.sobrantesUsados, 0);
  const metrosCortesTotales = round2(grupos.reduce((a, g) => a + g.metrosCortes, 0));
  const sobranteTotalCm = round1(grupos.reduce((a, g) => a + g.sobranteTotalCm, 0));
  const mermaTotalCm = round1(grupos.reduce((a, g) => a + g.mermaTotalCm, 0));
  const capacidadGlobalCm = grupos.reduce(
    (a, g) => a + g.barras.reduce((ba, b) => ba + b.largoTotalCm, 0),
    0
  );
  const aprovechamientoGlobalPct =
    capacidadGlobalCm > 0 ? round1(((metrosCortesTotales * 100) / capacidadGlobalCm) * 100) : 0;

  return {
    grupos,
    tramos610Totales,
    sobrantesInventarioUsados,
    metrosCortesTotales,
    sobranteTotalCm,
    mermaTotalCm,
    aprovechamientoGlobalPct,
    sobrantesGeneradosGuardables: Array.from(offcutAggregator.values()),
  };
}

export function buildPartidaFromModulacion(
  calc: ModulacionCalculoResult,
  tarifasBase: Partial<Record<LineaId, number>> = {}
): PartidaObra {
  const lineaId: LineaId =
    calc.modelo.categoria === 'puertas'
      ? calc.serie.mappedLineaPuerta
      : calc.serie.mappedLineaVentana;
  const cfg = LINEAS_CONFIG[lineaId];
  const areaM2 = Math.max(0.5, (calc.anchoCm / 100) * (calc.altoCm / 100));
  const rate = tarifasBase[lineaId] ?? cfg.tarifaBaseDefault;
  const totalLinea = round2(areaM2 * rate);

  const aperturaMap: Record<ModulacionModeloId, AperturaVentanaId> = {
    'win-corrediza': 'corrediza',
    'win-proyeccion': 'banderola',
    'win-abatible': 'abatible',
    'win-fija': 'fija',
    'win-sifon': 'banderola',
    'win-guillotina': 'guillotina',
    'door-corrediza': 'corrediza',
    'door-batiente': 'abatible',
  };

  const perfilesDespiece: CortePerfil[] = calc.perfiles.map((p) => ({
    perfilId: p.perfilId,
    nombre: p.nombre,
    funcion: `${p.cantidadLabel} (${p.formulaTexto})`,
    pzas: p.cantidad,
    angulo: p.angulo,
    medidaCm: p.medidaCm,
  }));

  return {
    id: `p-mod-${Date.now()}`,
    categoria: calc.modelo.categoria,
    linea: lineaId,
    area: 'Modulación y Cortes',
    etiqueta: `${calc.modelo.categoria === 'puertas' ? 'Puerta' : 'Ventana'} ${calc.modelo.nombre} · ${calc.serie.nombre} · ${calc.sublinea.nombre}${calc.conMosquitero ? ' (Con mosquitero)' : ''}`,
    anchoCm: calc.anchoCm,
    altoCm: calc.altoCm,
    color: 'natural',
    vidrio: 'claro6',
    hojas: calc.modelo.esCorrediza ? 2 : 1,
    apertura: aperturaMap[calc.modelo.id],
    sentidoPuerta: 'izq',
    puertaIntermedio: calc.modelo.categoria === 'puertas',
    puertaEconomica: calc.sublinea.id === 'economica-hermetica',
    invertido: false,
    cantidad: 1,
    modoPrecio: 'm2',
    precioInput: rate,
    cobrarMinM2: false,
    extraPct: 0,
    totalLinea,
    despiece: {
      perfiles: perfilesDespiece,
      vidrios: calc.vidrios,
      herrajes: [],
      totalAluminioM: calc.totalAluminioM,
      tramos610: calc.tramos610,
      escuadrasCount: calc.serie.id.startsWith('serie-') ? 4 : 0,
      telaMosquiteraM2: calc.conMosquitero ? round2(areaM2 * 0.55) : 0,
      colaDeRataM: calc.conMosquitero ? round2(((calc.anchoCm + calc.altoCm) * 2) / 100) : 0,
      carretillasMosq: calc.conMosquitero && calc.modelo.esCorrediza ? 2 : 0,
    },
  };
}
