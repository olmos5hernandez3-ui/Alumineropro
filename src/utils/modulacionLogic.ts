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
  color?: ColorId;
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
