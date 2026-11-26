import {
  AjusteDescuentosConfig,
  AperturaVentanaId,
  CATALOGO_PERFILES,
  ColorId,
  COLORES_CONFIG,
  CortePerfil,
  CorteVidrio,
  getInventarioTramosPorPerfilColor,
  LineaId,
  LINEAS_CONFIG,
  normalizeColorId,
  normalizeLineaId,
  OptimizadorConfig,
  parseInventarioKey,
  PartidaObra,
  PerfilCatalogoId,
  resolveAjusteDescuentos,
  resolveOptimizadorConfig,
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

const PROFILE_CODES: Record<string, string> = {
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
  ajusteDescuentos?: Partial<AjusteDescuentosConfig>;
}): ModulacionCalculoResult {
  const modelo = MODULACION_MODELOS.find((m) => m.id === input.modeloId) || MODULACION_MODELOS[0];
  const serie = MODULACION_SERIES.find((s) => s.id === input.serieId) || MODULACION_SERIES[3];
  const sublinea =
    MODULACION_SUBLINEAS.find((sl) => sl.id === input.sublineaId) || MODULACION_SUBLINEAS[0];

  const ancho = Math.max(20, Number(input.anchoCm) || 120);
  const alto = Math.max(20, Number(input.altoCm) || 100);
  const adj = sublinea.ajusteHolguraCm;
  const aj = resolveAjusteDescuentos(input.ajusteDescuentos);
  const hasCustomAj = Boolean(input.ajusteDescuentos);
  const d =
    serie.id === 'linea-2' && hasCustomAj
      ? {
          ...serie.descuentos,
          jamba: aj.l2JambaAlto,
          riel: 0,
          zocloTotalAncho: aj.l2Zoclo2HojasAncho,
          cercoAlto: aj.l2HojaCorredizaAlto,
          traslapeAlto: aj.l2HojaCorredizaAlto,
          hojaFijaAlto: aj.l2HojaFijaAlto,
        }
      : serie.id === 'linea-3' && hasCustomAj
        ? {
            ...serie.descuentos,
            jamba: aj.l3JambaAlto,
            riel: 0,
            zocloTotalAncho: aj.l3Zoclo2HojasAncho,
            cercoAlto: aj.l3HojaCorredizaAlto,
            traslapeAlto: aj.l3HojaCorredizaAlto,
            hojaFijaAlto: aj.l3HojaFijaAlto,
          }
        : serie.descuentos;
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
        const desc = round1((modelo.esFija || item.seccion === 'hoja-fija' ? d.hojaFijaAlto : d.cercoAlto) + adj);
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
        const desc = round1((item.seccion === 'hoja-fija' ? d.hojaFijaAlto : d.traslapeAlto) + adj);
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
  largoUtilCm: number;
  despunteCm: number;
  cortes: CorteTramo1DPieza[];
  usadoCm: number;
  desperdicioDiscoCm: number;
  sobranteCm: number;
  esMerma: boolean;
  aprovechamientoPct: number;
  totalCortes: number;
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
  mermaRealPct: number;
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
  mermaRealPct: number;
  aprovechamientoGlobalPct: number;
  largoBarraCm: number;
  largoUtilCm: number;
  despunteTotalCm: number;
  kerfCm: number;
  minSobranteGuardableCm: number;
  sobrantesGeneradosGuardables: SobranteGeneradoSugerido[];
}

export function optimizarTramos1D(input: {
  perfiles: ModulacionPerfilCorteRow[];
  sobrantesInventario?: SobranteItem[];
  lineaCompatible?: LineaId;
  largoBarraCm?: number;
  despuntePorExtremoCm?: number;
  kerfCm?: number;
  minSobranteGuardableCm?: number;
}): OptimizacionTramos1DResult {
  const largoBarraCm = Math.max(200, Number(input.largoBarraCm ?? TRAMO_STD_CM));
  const despunteExtremo = Math.max(0, Number(input.despuntePorExtremoCm ?? 0));
  const despunteTotalCm = round1(despunteExtremo * 2);
  const largoUtilBarraCm = round1(Math.max(100, largoBarraCm - despunteTotalCm));
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
    sobrantesPool.sort((a, b) => a.largoCm - b.largoCm);

    const barrasAbiertas: Array<{
      id: string;
      origen: 'sobrante-inventario' | 'tramo-610';
      sobranteOrigenId?: string;
      etiquetaOrigen: string;
      marca?: string;
      largoTotalCm: number;
      largoUtilCm: number;
      despunteCm: number;
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
          largoUtilCm: sob.largoCm,
          despunteCm: 0,
          restanteCm: round2(Math.max(0, sob.largoCm - pieza.medidaCm - kerfFirst)),
          cortes: [pieza],
          discoCm: kerfFirst,
        });
        continue;
      }

      // 3. Abrir un nuevo tramo completo (610 cm, útil = 610 - despunte) descontando kerf por corte
      tramoCounter += 1;
      const utilLen = Math.max(largoUtilBarraCm, round1(pieza.medidaCm + kerf));
      const totalLen = Math.max(largoBarraCm, round1(utilLen + despunteTotalCm));
      const kerfFirst = Math.min(kerf, Math.max(0, round2(utilLen - pieza.medidaCm)));
      barrasAbiertas.push({
        id: `tramo-${perfilId}-${tramoCounter}`,
        origen: 'tramo-610',
        etiquetaOrigen: `Tramo ${(totalLen / 100).toFixed(2)} m #${tramoCounter}`,
        largoTotalCm: totalLen,
        largoUtilCm: utilLen,
        despunteCm: round1(Math.max(0, totalLen - utilLen)),
        restanteCm: round2(Math.max(0, utilLen - pieza.medidaCm - kerfFirst)),
        cortes: [pieza],
        discoCm: kerfFirst,
      });
    }

    const barrasPlan: Tramo1DBarraPlan[] = barrasAbiertas.map((b) => {
      const usadoCm = round1(b.cortes.reduce((acc, c) => acc + c.medidaCm, 0));
      const sobranteCm = round1(Math.max(0, b.largoUtilCm - usadoCm - b.discoCm));
      const esMerma = sobranteCm > 0 && sobranteCm < minSaveCm;
      const pct = b.largoUtilCm > 0 ? round1((usadoCm / b.largoUtilCm) * 100) : 0;

      if (b.origen === 'tramo-610' && sobranteCm >= minSaveCm && sobranteCm < b.largoUtilCm) {
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
        largoUtilCm: b.largoUtilCm,
        despunteCm: b.despunteCm,
        cortes: b.cortes,
        usadoCm,
        desperdicioDiscoCm: round2(b.discoCm),
        sobranteCm,
        esMerma,
        aprovechamientoPct: pct,
        totalCortes: b.cortes.length,
      };
    });

    const tramos610Requeridos = barrasPlan.filter((b) => b.origen === 'tramo-610').length;
    const sobrantesUsados = barrasPlan.filter((b) => b.origen === 'sobrante-inventario').length;
    const totalCapacidadCm = barrasPlan.reduce((a, b) => a + b.largoUtilCm, 0);
    const totalUsadoCm = barrasPlan.reduce((a, b) => a + b.usadoCm, 0);
    const sobranteTotalCm = round1(barrasPlan.reduce((a, b) => a + b.sobranteCm, 0));
    const mermaTotalCm = round1(barrasPlan.reduce((a, b) => a + (b.esMerma ? b.sobranteCm : 0), 0));
    const mermaRealPct = totalCapacidadCm > 0 ? round1((mermaTotalCm / totalCapacidadCm) * 100) : 0;

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
      mermaRealPct,
      aprovechamientoPct: totalCapacidadCm > 0 ? round1((totalUsadoCm / totalCapacidadCm) * 100) : 0,
    });
  }

  const tramos610Totales = grupos.reduce((a, g) => a + g.tramos610Requeridos, 0);
  const sobrantesInventarioUsados = grupos.reduce((a, g) => a + g.sobrantesUsados, 0);
  const metrosCortesTotales = round2(grupos.reduce((a, g) => a + g.metrosCortes, 0));
  const sobranteTotalCm = round1(grupos.reduce((a, g) => a + g.sobranteTotalCm, 0));
  const mermaTotalCm = round1(grupos.reduce((a, g) => a + g.mermaTotalCm, 0));
  const capacidadGlobalCm = grupos.reduce(
    (a, g) => a + g.barras.reduce((ba, b) => ba + b.largoUtilCm, 0),
    0
  );
  const aprovechamientoGlobalPct =
    capacidadGlobalCm > 0 ? round1(((metrosCortesTotales * 100) / capacidadGlobalCm) * 100) : 0;
  const mermaRealPct =
    capacidadGlobalCm > 0 ? round1((mermaTotalCm / capacidadGlobalCm) * 100) : 0;

  return {
    grupos,
    tramos610Totales,
    sobrantesInventarioUsados,
    metrosCortesTotales,
    sobranteTotalCm,
    mermaTotalCm,
    mermaRealPct,
    aprovechamientoGlobalPct,
    largoBarraCm,
    largoUtilCm: largoUtilBarraCm,
    despunteTotalCm,
    kerfCm: kerf,
    minSobranteGuardableCm: minSaveCm,
    sobrantesGeneradosGuardables: Array.from(offcutAggregator.values()),
  };
}

export function optimizarPartidasTramos1D(
  partidas: PartidaObra[],
  sobrantesInventario: SobranteItem[] = [],
  optConfig?: Partial<OptimizadorConfig>
): OptimizacionTramos1DResult {
  const cfg = resolveOptimizadorConfig(optConfig);
  const filas: ModulacionPerfilCorteRow[] = [];
  for (const p of partidas || []) {
    const list = p.despiece?.perfiles || [];
    list.forEach((c, idx) => {
      // p.despiece.perfiles ya incluye el multiplicador de cantidad de la partida (calcularDespiece)
      const pzasTotal = Math.max(1, Math.round(Number(c.pzas) || 1));
      const medidaCm = round1(Math.max(5, Number(c.medidaCm) || 0));
      filas.push({
        id: `${p.id}__${c.perfilId}__${idx}`,
        seccion:
          c.perfilId === 'cabezal' || c.perfilId === 'jamba' || c.perfilId === 'riel'
            ? 'contramarco'
            : c.perfilId === 'mosq_marco' || c.perfilId === 'riel_mosq'
              ? 'mosquitero'
              : 'hoja-movil',
        codigo: PROFILE_CODES[c.perfilId] || c.perfilId.toUpperCase(),
        perfilId: c.perfilId,
        nombre: `${c.nombre} · ${p.etiqueta || p.area || 'Partida'}`,
        rol: c.funcion || '',
        orientacion: 'horizontal',
        cantidad: pzasTotal,
        cantidadLabel: `x${pzasTotal}`,
        formulaTexto: c.funcion || '',
        medidaCm,
        medidaM: round2(medidaCm / 100),
        totalMetros: round2((medidaCm * pzasTotal) / 100),
        angulo: c.angulo || '90°',
      });
    });
  }

  return optimizarTramos1D({
    perfiles: filas,
    sobrantesInventario,
    largoBarraCm: cfg.largoBarraCm,
    despuntePorExtremoCm: cfg.despuntePorExtremoCm,
    kerfCm: cfg.kerfCm,
    minSobranteGuardableCm: cfg.umbralSobranteUsableCm,
  });
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

/* ==================== AGREGACIÓN MULTI-TRABAJO PARA MODULACIÓN Y VIDRIO 2D ==================== */

export interface ModulacionMultiJobInput {
  id: string;
  etiqueta: string;
  modeloId: ModulacionModeloId;
  conMosquitero: boolean;
  serieId: ModulacionSerieId;
  sublineaId: ModulacionSublineaId;
  anchoCm: number;
  altoCm: number;
  cantidad: number;
  vidrioLabel?: string;
  sinVidrio?: boolean;
}

export interface ModulacionJobCalculatedItem {
  job: ModulacionMultiJobInput;
  calculo: ModulacionCalculoResult;
  perfilesEscalados: ModulacionPerfilCorteRow[];
  vidriosEscalados: CorteVidrio[];
  totalAluminioM: number;
}

export interface ModulacionMultiJobResult {
  items: ModulacionJobCalculatedItem[];
  perfilesConsolidados: ModulacionPerfilCorteRow[];
  vidriosConsolidados: CorteVidrio[];
  totalTrabajos: number;
  totalPiezas: number;
  totalAluminioM: number;
  tramos610Estimados: number;
}

export function aggregateModulacionJobs(
  jobs: ModulacionMultiJobInput[]
): ModulacionMultiJobResult {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const items: ModulacionJobCalculatedItem[] = [];
  const perfilesConsolidados: ModulacionPerfilCorteRow[] = [];
  const vidriosConsolidados: CorteVidrio[] = [];
  let totalPiezas = 0;
  let totalAluminioM = 0;

  for (const job of safeJobs) {
    const qty = Math.max(1, Math.round(Number(job.cantidad) || 1));
    const calculo = calcularModulacionCortes({
      modeloId: job.modeloId,
      conMosquitero: job.conMosquitero,
      serieId: job.serieId,
      sublineaId: job.sublineaId,
      anchoCm: job.anchoCm,
      altoCm: job.altoCm,
    });

    const perfilesEscalados: ModulacionPerfilCorteRow[] = calculo.perfiles.map((row) => {
      const scaledQty = row.cantidad * qty;
      return {
        ...row,
        id: `${job.id}__${row.id}`,
        nombre: safeJobs.length > 1 ? `${row.nombre} · ${job.etiqueta}` : row.nombre,
        cantidad: scaledQty,
        cantidadLabel:
          qty > 1 ? `x${scaledQty} (${row.cantidad} × ${qty} pzas)` : row.cantidadLabel,
        totalMetros: round2(row.totalMetros * qty),
      };
    });

    const vidriosEscalados: CorteVidrio[] = job.sinVidrio
      ? []
      : calculo.vidrios.map((v) => {
          const pzas = Math.max(1, v.pzas * qty);
          return {
            ...v,
            nombre: job.etiqueta || v.nombre,
            pzas,
            areaM2: round2(((v.anchoCm * v.altoCm) / 10000) * pzas),
            espesorLabel: job.vidrioLabel || v.espesorLabel || 'Claro 6 mm',
          };
        });

    const jobAluminioM = round2(calculo.totalAluminioM * qty);
    totalPiezas += qty;
    totalAluminioM = round2(totalAluminioM + jobAluminioM);

    items.push({
      job,
      calculo,
      perfilesEscalados,
      vidriosEscalados,
      totalAluminioM: jobAluminioM,
    });

    perfilesConsolidados.push(...perfilesEscalados);
    vidriosConsolidados.push(...vidriosEscalados);
  }

  return {
    items,
    perfilesConsolidados,
    vidriosConsolidados,
    totalTrabajos: items.length,
    totalPiezas,
    totalAluminioM,
    tramos610Estimados: totalAluminioM > 0 ? Math.max(1, Math.ceil((totalAluminioM * 100) / TRAMO_STD_CM)) : 0,
  };
}

/* ==================== ANÁLISIS DE DESPERDICIO DE PERFILES VS INVENTARIO (HOJA COTIZACIÓN) ==================== */

export interface ProfileWasteGroupAnalysis {
  key: string;
  linea: LineaId;
  lineaNombre: string;
  perfilId: PerfilCatalogoId;
  perfilNombre: string;
  color: ColorId;
  colorLabel: string;
  totalCortes: number;
  metrosCortes: number;
  tramosEstimadosLineal: number;
  tramosOpt1D: number;
  tramosEnInventario: number;
  tramosCubiertosInventario: number;
  tramosPorComprar: number;
  aprovechamientoPct: number;
  desperdicioTotalCm: number;
  mermaIrrecuperableCm: number;
  mermaIrrecuperablePct: number;
  sobranteReutilizableCm: number;
  isHighWaste: boolean;
  altColorStock: Array<{ color: ColorId; colorLabel: string; tramos: number }>;
}

export interface ProfileOptimizationSuggestion {
  id: string;
  tipo: 'ahorro' | 'alerta' | 'info';
  titulo: string;
  detalle: string;
  ahorroPotencialTramos?: number;
}

export interface HojaProfileWasteAnalysisResult {
  grupos: ProfileWasteGroupAnalysis[];
  totalTramosOpt1D: number;
  totalTramosLineal: number;
  tramosCubiertosInventario: number;
  tramosPorComprar: number;
  coberturaInventarioPct: number;
  aprovechamientoGlobalPct: number;
  desperdicioTotalM: number;
  mermaIrrecuperableM: number;
  mermaIrrecuperablePct: number;
  perfilesAltoDesperdicio: ProfileWasteGroupAnalysis[];
  puedeOptimizarse: boolean;
  sugerencias: ProfileOptimizationSuggestion[];
}

export function analyzeHojaProfileWasteVsInventory(
  partidas: PartidaObra[],
  inventario: Record<string, number>,
  comprometidos: Record<string, number> = {},
  optConfig?: Partial<OptimizadorConfig>
): HojaProfileWasteAnalysisResult {
  const safePartidas = Array.isArray(partidas) ? partidas : [];
  if (safePartidas.length === 0) {
    return {
      grupos: [],
      totalTramosOpt1D: 0,
      totalTramosLineal: 0,
      tramosCubiertosInventario: 0,
      tramosPorComprar: 0,
      coberturaInventarioPct: 0,
      aprovechamientoGlobalPct: 0,
      desperdicioTotalM: 0,
      mermaIrrecuperableM: 0,
      mermaIrrecuperablePct: 0,
      perfilesAltoDesperdicio: [],
      puedeOptimizarse: false,
      sugerencias: [],
    };
  }

  const cfg = resolveOptimizadorConfig(optConfig);
  const groupedCuts = new Map<
    string,
    {
      linea: LineaId;
      perfilId: PerfilCatalogoId;
      perfilNombre: string;
      color: ColorId;
      filas: ModulacionPerfilCorteRow[];
      totalCm: number;
      totalCortes: number;
    }
  >();

  for (const p of safePartidas) {
    const cuts = p?.despiece?.perfiles;
    if (!Array.isArray(cuts) || cuts.length === 0) continue;
    const normLinea = normalizeLineaId(p.linea);
    const normColor = normalizeColorId(p.color);

    cuts.forEach((c, idx) => {
      const pzasTotal = Math.max(1, Math.round(Number(c.pzas) || 1));
      const medidaCm = round1(Math.max(5, Number(c.medidaCm) || 0));
      const key = `${normLinea}__${c.perfilId}__${normColor}`;
      const perfilNombre =
        CATALOGO_PERFILES.find((item) => item.id === c.perfilId)?.nombre || c.nombre;

      const row: ModulacionPerfilCorteRow = {
        id: `${p.id}__${c.perfilId}__${idx}`,
        seccion: 'contramarco',
        codigo: PROFILE_CODES[c.perfilId] || c.perfilId.toUpperCase(),
        perfilId: c.perfilId,
        nombre: `${perfilNombre} · ${p.etiqueta || p.area || 'Partida'}`,
        rol: c.funcion || '',
        orientacion: 'horizontal',
        cantidad: pzasTotal,
        cantidadLabel: `x${pzasTotal}`,
        formulaTexto: c.funcion || '',
        medidaCm,
        medidaM: round2(medidaCm / 100),
        totalMetros: round2((medidaCm * pzasTotal) / 100),
        angulo: c.angulo || '90°',
      };

      const prev = groupedCuts.get(key);
      if (prev) {
        prev.filas.push(row);
        prev.totalCm += medidaCm * pzasTotal;
        prev.totalCortes += pzasTotal;
      } else {
        groupedCuts.set(key, {
          linea: normLinea,
          perfilId: c.perfilId,
          perfilNombre,
          color: normColor,
          filas: [row],
          totalCm: medidaCm * pzasTotal,
          totalCortes: pzasTotal,
        });
      }
    });
  }

  // Mapa rápido de existencias disponibles por (linea, perfilId, color) para detectar stock alterno
  const invByLineaPerfil = new Map<string, Map<ColorId, number>>();
  for (const [invKey, rawQty] of Object.entries(inventario || {})) {
    const qty = Number(rawQty) || 0;
    if (qty <= 0) continue;
    const parsed = parseInventarioKey(invKey);
    const lId = normalizeLineaId(parsed.linea);
    const cId = normalizeColorId(parsed.color);
    const lpKey = `${lId}__${parsed.perfilId}`;
    let colorMap = invByLineaPerfil.get(lpKey);
    if (!colorMap) {
      colorMap = new Map<ColorId, number>();
      invByLineaPerfil.set(lpKey, colorMap);
    }
    colorMap.set(cId, round2((colorMap.get(cId) || 0) + qty));
  }

  const grupos: ProfileWasteGroupAnalysis[] = [];
  let totalTramosOpt1D = 0;
  let totalTramosLineal = 0;
  let totalCubiertos = 0;
  let totalPorComprar = 0;
  let capacidadGlobalCm = 0;
  let cortesGlobalCm = 0;
  let desperdicioTotalCm = 0;
  let mermaIrrecuperableCm = 0;

  for (const [key, entry] of groupedCuts.entries()) {
    const optGroupRes = optimizarTramos1D({
      perfiles: entry.filas,
      sobrantesInventario: [],
      largoBarraCm: cfg.largoBarraCm,
      despuntePorExtremoCm: cfg.despuntePorExtremoCm,
      kerfCm: cfg.kerfCm,
      minSobranteGuardableCm: cfg.umbralSobranteUsableCm,
    });
    const g = optGroupRes.grupos[0];
    const tramosOpt1D = g ? g.tramos610Requeridos : Math.max(1, Math.ceil(entry.totalCm / TRAMO_STD_CM));
    const tramosEstimadosLineal = Math.max(1, Math.ceil((entry.totalCm * 1.06) / TRAMO_STD_CM));

    const tramosEnBodega = getInventarioTramosPorPerfilColor(
      inventario,
      entry.linea,
      entry.perfilId,
      entry.color
    );
    const tramosComp = round2(comprometidos[key] || 0);
    const tramosEnInventario = Math.max(0, Math.floor(round2(tramosEnBodega - tramosComp)));
    const tramosCubiertosInventario = Math.min(tramosOpt1D, tramosEnInventario);
    const tramosPorComprar = Math.max(0, tramosOpt1D - tramosCubiertosInventario);

    const groupCapCm = g
      ? g.barras.reduce((acc, b) => acc + b.largoUtilCm, 0)
      : tramosOpt1D * (cfg.largoBarraCm - cfg.despuntePorExtremoCm * 2);
    const groupMermaCm = g ? g.mermaTotalCm : 0;
    const groupDesperdicioCm = g ? g.sobranteTotalCm : Math.max(0, round1(groupCapCm - entry.totalCm));
    const groupSobranteReutilizableCm = Math.max(0, round1(groupDesperdicioCm - groupMermaCm));
    const aprovechamientoPct =
      groupCapCm > 0 ? round1(Math.min(100, (entry.totalCm / groupCapCm) * 100)) : 0;
    const mermaIrrecuperablePct =
      groupCapCm > 0 ? round1((groupMermaCm / groupCapCm) * 100) : 0;

    // Revisar si existe stock del mismo perfil/línea en otro color cuando falta surtir
    const altColorStock: Array<{ color: ColorId; colorLabel: string; tramos: number }> = [];
    if (tramosPorComprar > 0) {
      const lpMap = invByLineaPerfil.get(`${entry.linea}__${entry.perfilId}`);
      if (lpMap) {
        for (const [altColor, altQty] of lpMap.entries()) {
          if (altColor !== entry.color && Math.floor(altQty) > 0) {
            altColorStock.push({
              color: altColor,
              colorLabel: COLORES_CONFIG[altColor]?.corto || altColor,
              tramos: Math.floor(altQty),
            });
          }
        }
      }
    }

    const isHighWaste = aprovechamientoPct < 70 || mermaIrrecuperablePct >= 18;

    grupos.push({
      key,
      linea: entry.linea,
      lineaNombre: LINEAS_CONFIG[entry.linea]?.nombre || entry.linea,
      perfilId: entry.perfilId,
      perfilNombre: entry.perfilNombre,
      color: entry.color,
      colorLabel: COLORES_CONFIG[entry.color]?.corto || entry.color,
      totalCortes: entry.totalCortes,
      metrosCortes: round2(entry.totalCm / 100),
      tramosEstimadosLineal,
      tramosOpt1D,
      tramosEnInventario,
      tramosCubiertosInventario,
      tramosPorComprar,
      aprovechamientoPct,
      desperdicioTotalCm: round1(groupDesperdicioCm),
      mermaIrrecuperableCm: round1(groupMermaCm),
      mermaIrrecuperablePct,
      sobranteReutilizableCm: groupSobranteReutilizableCm,
      isHighWaste,
      altColorStock,
    });

    totalTramosOpt1D += tramosOpt1D;
    totalTramosLineal += tramosEstimadosLineal;
    totalCubiertos += tramosCubiertosInventario;
    totalPorComprar += tramosPorComprar;
    capacidadGlobalCm += groupCapCm;
    cortesGlobalCm += entry.totalCm;
    desperdicioTotalCm += groupDesperdicioCm;
    mermaIrrecuperableCm += groupMermaCm;
  }

  grupos.sort((a, b) => a.aprovechamientoPct - b.aprovechamientoPct);

  const aprovechamientoGlobalPct =
    capacidadGlobalCm > 0 ? round1(Math.min(100, (cortesGlobalCm / capacidadGlobalCm) * 100)) : 0;
  const mermaIrrecuperablePct =
    capacidadGlobalCm > 0 ? round1((mermaIrrecuperableCm / capacidadGlobalCm) * 100) : 0;
  const coberturaInventarioPct =
    totalTramosOpt1D > 0 ? round1((totalCubiertos / totalTramosOpt1D) * 100) : 0;
  const perfilesAltoDesperdicio = grupos.filter((g) => g.isHighWaste);

  const sugerencias: ProfileOptimizationSuggestion[] = [];

  // 1. Cobertura con inventario existente
  if (totalCubiertos > 0) {
    sugerencias.push({
      id: 'inv-coverage',
      tipo: 'ahorro',
      titulo: `Aprovecha ${totalCubiertos} tramo(s) ya disponibles en tu bodega`,
      detalle:
        totalPorComprar === 0
          ? `Tu inventario cubre el 100% de los ${totalTramosOpt1D} tramos de 6.10 m requeridos por corte real 1D. No necesitas comprar aluminio nuevo para esta obra.`
          : `Tu inventario cubre el ${coberturaInventarioPct}% (${totalCubiertos} de ${totalTramosOpt1D} tramos optimizados). Solo falta surtir ${totalPorComprar} tramo(s) nuevo(s).`,
      ahorroPotencialTramos: totalCubiertos,
    });
  } else if (totalTramosOpt1D > 0) {
    sugerencias.push({
      id: 'inv-empty',
      tipo: 'info',
      titulo: 'Sin existencias coincidentes en Mi Inventario',
      detalle: `Ninguno de los ${totalTramosOpt1D} tramos requeridos (por línea, perfil y acabado) tiene stock libre en bodega. Registra tus tramos en Mi Inventario para descontar compras automáticamente.`,
    });
  }

  // 2. Diferencia entre cálculo lineal (+6%) vs corte real 1D
  const deltaLinealVsOpt = totalTramosLineal - totalTramosOpt1D;
  if (deltaLinealVsOpt > 0) {
    sugerencias.push({
      id: 'opt-saves-vs-linear',
      tipo: 'ahorro',
      titulo: `El anidado 1D ahorra ${deltaLinealVsOpt} tramo(s) frente al cálculo lineal (+6%)`,
      detalle: `Agrupando cortes por línea y color en barras de 6.10 m solo requieres ${totalTramosOpt1D} tramos reales en lugar de ${totalTramosLineal} estimados linealmente.`,
      ahorroPotencialTramos: deltaLinealVsOpt,
    });
  } else if (deltaLinealVsOpt < 0) {
    sugerencias.push({
      id: 'opt-needs-more-than-linear',
      tipo: 'alerta',
      titulo: `Cuidado: el corte real 1D requiere ${Math.abs(deltaLinealVsOpt)} tramo(s) extra`,
      detalle: `Por el largo de los cortes individuales (pérdida en puntas), necesitas ${totalTramosOpt1D} tramos reales y no ${totalTramosLineal} del estimado lineal. Revisa el diagrama barra por barra antes de pedir.`,
    });
  }

  // 3. Perfiles con alto desperdicio (<70% aprovechamiento o >=18% merma)
  if (perfilesAltoDesperdicio.length > 0) {
    const topWaste = perfilesAltoDesperdicio.slice(0, 3);
    const listTxt = topWaste
      .map(
        (g) =>
          `${g.perfilNombre} (${g.lineaNombre} · ${g.colorLabel}: ${g.aprovechamientoPct}% uso, ${(g.desperdicioTotalCm / 100).toFixed(2)} m sin usar)`
      )
      .join('; ');
    sugerencias.push({
      id: 'high-waste-profiles',
      tipo: 'alerta',
      titulo: `${perfilesAltoDesperdicio.length} perfil(es) con bajo aprovechamiento (<70%)`,
      detalle: `${listTxt}. Sugerencia: agrupa más piezas en la misma línea/color o aprovecha el tramo sobrante (> ${cfg.umbralSobranteUsableCm} cm) para otra ventana de la misma obra.`,
    });
  }

  // 4. Fragmentación de acabados / colores en la misma obra
  const distinctColors = new Set(grupos.map((g) => g.color));
  const distinctLineas = new Set(grupos.map((g) => g.linea));
  if (distinctColors.size > 1 && perfilesAltoDesperdicio.length > 0) {
    const lowFillGroups = grupos.filter((g) => g.aprovechamientoPct < 50);
    if (lowFillGroups.length >= 2) {
      sugerencias.push({
        id: 'fragmented-finishes',
        tipo: 'alerta',
        titulo: `Obra fragmentada en ${distinctColors.size} acabados distintos`,
        detalle: `Tienes ${lowFillGroups.length} perfiles con menos de 50% de uso por mezclar colores (${Array.from(distinctColors)
          .map((c) => COLORES_CONFIG[c]?.corto || c)
          .join(', ')}). Si el cliente acepta unificar color${distinctLineas.size > 1 ? ' o línea' : ''}, podrás combinar cortes en las mismas barras de 6.10 m.`,
        ahorroPotencialTramos: Math.max(1, Math.floor(lowFillGroups.length / 2)),
      });
    }
  }

  // 5. Stock disponible en otro acabado dentro de Mi Inventario
  const withAltStock = grupos.filter((g) => g.tramosPorComprar > 0 && g.altColorStock.length > 0);
  if (withAltStock.length > 0) {
    const sample = withAltStock
      .slice(0, 2)
      .map(
        (g) =>
          `${g.perfilNombre} ${g.lineaNombre} (tienes ${g.altColorStock
            .map((a) => `${a.tramos} tr. en ${a.colorLabel}`)
            .join(', ')})`
      )
      .join('; ');
    sugerencias.push({
      id: 'alt-color-inventory',
      tipo: 'info',
      titulo: `Tienes stock en otro acabado para ${withAltStock.length} perfil(es) faltante(s)`,
      detalle: `${sample}. Si el cliente es flexible con el color, puedes evitar comprar tramos nuevos y bajar tu desperdicio.`,
    });
  }

  const puedeOptimizarse =
    perfilesAltoDesperdicio.length > 0 ||
    deltaLinealVsOpt !== 0 ||
    withAltStock.length > 0 ||
    (totalCubiertos > 0 && totalPorComprar > 0);

  return {
    grupos,
    totalTramosOpt1D,
    totalTramosLineal,
    tramosCubiertosInventario: totalCubiertos,
    tramosPorComprar: totalPorComprar,
    coberturaInventarioPct,
    aprovechamientoGlobalPct,
    desperdicioTotalM: round2(desperdicioTotalCm / 100),
    mermaIrrecuperableM: round2(mermaIrrecuperableCm / 100),
    mermaIrrecuperablePct,
    perfilesAltoDesperdicio,
    puedeOptimizarse,
    sugerencias,
  };
}

// ============================================================================
// APARTADO VISUAL: "✓ Tramos de 6.10 ya acomodados" (tarjetas proporcionales en mm)
// ============================================================================

export interface Tramo610VisualPieza {
  nombre: string;
  mm: number;
  widthPct: number;
}

export interface Tramo610VisualBarra {
  id: string;
  numero: number;
  origen: 'sobrante-inventario' | 'tramo-610';
  largoTotalMm: number;
  piezas: Tramo610VisualPieza[];
  netoMm: number;
  sobranteMm: number;
  sobrantePct: number;
  resumenTexto: string;
}

export interface Tramo610VisualCard {
  perfilId: PerfilCatalogoId;
  codigo: string;
  perfilNombre: string;
  acabado: string;
  headerLeft: string;
  barrasCount: number;
  headerRight: string;
  totalPiezas: number;
  netoMm: number;
  sobranteTotalMm: number;
  subtitulo: string;
  aprovechamientoPct: number;
  barras: Tramo610VisualBarra[];
}

export function formatMmWithCommas(mm: number): string {
  const safe = Math.max(0, Math.round(Number(mm) || 0));
  return safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function buildTramos610AcomodadosCards(
  opt: OptimizacionTramos1DResult,
  options?: {
    acabadoByPerfil?: Partial<Record<PerfilCatalogoId, string>>;
    defaultAcabado?: string;
  }
): Tramo610VisualCard[] {
  const defaultAcabado = (options?.defaultAcabado || 'Natural').trim() || 'Natural';
  const acabadoByPerfil = options?.acabadoByPerfil || {};

  return (opt?.grupos || []).map((g) => {
    const acabado = (acabadoByPerfil[g.perfilId] || defaultAcabado).trim() || 'Natural';
    const codigo = (g.codigo || String(g.perfilId)).trim();
    const headerLeft = `${codigo} · ${acabado}`;

    let totalPiezas = 0;
    let netoMmTotal = 0;
    let sobranteTotalMm = 0;

    const barras: Tramo610VisualBarra[] = g.barras.map((b, idx) => {
      const largoTotalCm = Math.max(100, Number(b.largoTotalCm) || TRAMO_STD_CM);
      const largoTotalMm = Math.round(largoTotalCm * 10);
      const piezas: Tramo610VisualPieza[] = b.cortes.map((c) => {
        const mm = Math.max(1, Math.round((Number(c.medidaCm) || 0) * 10));
        return {
          nombre: c.nombre,
          mm,
          widthPct: Math.max(2, (mm / largoTotalMm) * 100),
        };
      });
      const netoMm = piezas.reduce((acc, p) => acc + p.mm, 0);
      const sobranteMm = Math.max(0, Math.round((Number(b.sobranteCm) || 0) * 10));
      const usedPctSum = piezas.reduce((acc, p) => acc + p.widthPct, 0);
      const sobrantePct = Math.max(0, Math.min(100 - Math.min(98, usedPctSum), (sobranteMm / largoTotalMm) * 100));

      totalPiezas += piezas.length;
      netoMmTotal += netoMm;
      sobranteTotalMm += sobranteMm;

      const cutsText = piezas.map((p) => String(p.mm)).join(' + ');
      const resumenTexto = `Barra ${idx + 1}: ${cutsText} · sobra ${formatMmWithCommas(sobranteMm)} mm`;

      return {
        id: b.id,
        numero: idx + 1,
        origen: b.origen,
        largoTotalMm,
        piezas,
        netoMm,
        sobranteMm,
        sobrantePct,
        resumenTexto,
      };
    });

    const barrasCount = Math.max(1, g.tramos610Requeridos || barras.length);
    const headerRight = `${barrasCount} ${barrasCount === 1 ? 'barra' : 'barras'} de 6.10 m`;
    const subtitulo = `${totalPiezas} ${totalPiezas === 1 ? 'pieza' : 'piezas'} · ${formatMmWithCommas(netoMmTotal)} mm netos · sobrante ${formatMmWithCommas(sobranteTotalMm)} mm`;

    return {
      perfilId: g.perfilId,
      codigo,
      perfilNombre: g.perfilNombre,
      acabado,
      headerLeft,
      barrasCount,
      headerRight,
      totalPiezas,
      netoMm: netoMmTotal,
      sobranteTotalMm,
      subtitulo,
      aprovechamientoPct: g.aprovechamientoPct,
      barras,
    };
  });
}

export function buildDespieceTramos1D(
  perfiles: CortePerfil[],
  etiqueta = 'Pieza',
  optConfig?: Partial<OptimizadorConfig>
): OptimizacionTramos1DResult {
  const cfg = resolveOptimizadorConfig(optConfig);
  const filas: ModulacionPerfilCorteRow[] = (perfiles || []).map((c, idx) => {
    const pzasTotal = Math.max(1, Math.round(Number(c.pzas) || 1));
    const medidaCm = round1(Math.max(5, Number(c.medidaCm) || 0));
    return {
      id: `desp__${c.perfilId}__${idx}`,
      seccion:
        c.perfilId === 'cabezal' || c.perfilId === 'jamba' || c.perfilId === 'riel'
          ? 'contramarco'
          : c.perfilId === 'mosq_marco' || c.perfilId === 'riel_mosq'
            ? 'mosquitero'
            : 'hoja-movil',
      codigo: PROFILE_CODES[c.perfilId] || c.perfilId.toUpperCase(),
      perfilId: c.perfilId,
      nombre: `${c.nombre} · ${etiqueta}`,
      rol: c.funcion || '',
      orientacion: 'horizontal',
      cantidad: pzasTotal,
      cantidadLabel: `x${pzasTotal}`,
      formulaTexto: c.funcion || '',
      medidaCm,
      medidaM: round2(medidaCm / 100),
      totalMetros: round2((medidaCm * pzasTotal) / 100),
      angulo: c.angulo || '90°',
    };
  });

  return optimizarTramos1D({
    perfiles: filas,
    largoBarraCm: cfg.largoBarraCm,
    despuntePorExtremoCm: cfg.despuntePorExtremoCm,
    kerfCm: cfg.kerfCm,
    minSobranteGuardableCm: cfg.umbralSobranteUsableCm,
  });
}


