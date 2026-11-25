// Catálogo Oficial de Perfiles y Herrajes México 2026–2027
// Claves reales oficiales de Panorama/Cuprum, Perfiletto, Indalum/EuroAlum,
// Extrusiones Metálicas y Herralum (tramo estándar 6.10 m salvo indicación).

export type OfficialBrandId =
  | 'panorama-cuprum'
  | 'perfiletto'
  | 'indalum-euroalum'
  | 'extrusiones-metalicas'
  | 'herralum';

export type OfficialItemTipo = 'perfil' | 'herraje' | 'cancel';

export type OfficialSvgArchetype =
  | 'bolsa'
  | 'escalonado'
  | 'tapa'
  | 'junquillo'
  | 'esquinero'
  | 'union'
  | 'riel'
  | 'cabezal'
  | 'jamba'
  | 'cerco'
  | 'traslape'
  | 'zoclo'
  | 'hoja-euro'
  | 'marco-batiente'
  | 'louver'
  | 'fachada'
  | 'bano'
  | 'mosquitero'
  | 'goteron'
  | 'carretilla'
  | 'chapa'
  | 'cierre-embutido'
  | 'escuadra'
  | 'vinil'
  | 'bisagra'
  | 'manilla'
  | 'cancel-bano';

export interface OfficialCatalogItem {
  id: string;
  brandId: OfficialBrandId;
  brandLabel: string;
  linea: string;
  subcategoria: string;
  clave: string;
  nombre: string;
  tipo: OfficialItemTipo;
  largoUnidad: string;
  uso: string;
  svgArchetype: OfficialSvgArchetype;
}

export interface OfficialBrandMeta {
  id: OfficialBrandId;
  nombre: string;
  subtitulo: string;
  accentClass: string;
}

export const DEFAULT_CATALOG_VIGENCIA_LABEL =
  'Catálogos Oficiales Vigentes 2026 • Próxima Actualización Anual: 2027';

export const OFFICIAL_BRANDS_2026: OfficialBrandMeta[] = [
  {
    id: 'panorama-cuprum',
    nombre: 'Panorama / Cuprum',
    subtitulo: 'Línea Nacional y Arquitectónica (Fijos, Corredizas, Serie 1400, Baño, Louvers, Fachada)',
    accentClass: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'perfiletto',
    nombre: 'Perfiletto',
    subtitulo: 'Perfiletto Aluminum — U-Light/C-Light, 2", 3" y Series Europeas S-35 a S-100',
    accentClass: 'from-sky-600 to-blue-700',
  },
  {
    id: 'indalum-euroalum',
    nombre: 'Indalum / EuroAlum',
    subtitulo: 'Línea Tradicional, Industrial, EuroAlum 2500–4500 y Herrajes Oficiales A-2501 a A-5091',
    accentClass: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'extrusiones-metalicas',
    nombre: 'Extrusiones Metálicas',
    subtitulo: 'Línea Nacional 1 1/2" a 3" + Línea Española Series 3500, 4600, 6000, LE 8500 y 10000',
    accentClass: 'from-amber-600 to-orange-700',
  },
  {
    id: 'herralum',
    nombre: 'Herralum 2026',
    subtitulo: 'Catálogo Oficial 2026 — Carretillas, Chapas, Cierres, Escuadras Monticelli, Viniles y Canceles',
    accentClass: 'from-slate-700 to-slate-900',
  },
];

type CompactEntry = [
  clave: string,
  nombre: string,
  svgArchetype: OfficialSvgArchetype,
  uso?: string,
  largoUnidad?: string,
  tipo?: OfficialItemTipo,
];

function buildEntries(
  brandId: OfficialBrandId,
  brandLabel: string,
  linea: string,
  subcategoria: string,
  entries: CompactEntry[],
  defaultTipo: OfficialItemTipo = 'perfil',
  defaultUnidad = 'Tramo 6.10 m'
): OfficialCatalogItem[] {
  return entries.map(([clave, nombre, svgArchetype, uso, largoUnidad, tipo], idx) => ({
    id: `${brandId}__${linea.toLowerCase().replace(/[^a-z0-9]+/g, '-')}__${clave.toLowerCase().replace(/[^a-z0-9]+/g, '-')}__${idx}`,
    brandId,
    brandLabel,
    linea,
    subcategoria,
    clave,
    nombre,
    tipo: tipo ?? defaultTipo,
    largoUnidad: largoUnidad ?? defaultUnidad,
    uso: uso ?? `${nombre} — ${linea} (${brandLabel})`,
    svgArchetype,
  }));
}

export const OFFICIAL_CATALOG_2026: OfficialCatalogItem[] = [
  // =========================================================================
  // 1. PANORAMA / CUPRUM (Línea Nacional y Arquitectónica)
  // =========================================================================
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Fijo 1.500"', 'Fijos', [
    ['39073', 'Bolsa Fijo 1.500"', 'bolsa', 'Marco perimetral con bolsa para fijo nacional 1.500"'],
    ['29076', 'Bolsa Lisa 1.500"', 'bolsa', 'Marco o manguete liso con bolsa 1.500"'],
    ['39074', 'Escalonado 1.500"', 'escalonado', 'Marco escalonado perimetral 1.500"'],
    ['39075', 'Tapa Bolsa 1.500"', 'tapa', 'Tapa de cierre para canal de bolsa 1.500"'],
    ['9356', 'Tapa Lisa 1.500"', 'tapa', 'Tapa lisa de remate 1.500"'],
    ['36370', 'Junquillo 1.500"', 'junquillo', 'Junquillo clip de acristalamiento 1.500"'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Serie 1400 (Fijos)', 'Fijos', [
    ['73971', 'Cerco Liso Serie 1400', 'bolsa', 'Marco tubular liso Serie 1400 Panorama / Cuprum'],
    ['74073', 'Junquillo Redondo Ancho', 'junquillo', 'Junquillo clip curvo ancho Serie 1400'],
    ['73978', 'Junquillo Ancho', 'junquillo', 'Junquillo recto ancho Serie 1400'],
    ['74634', 'Junquillo Estrecho (74634)', 'junquillo', 'Junquillo estrecho para vidrio grueso Serie 1400'],
    ['74635', 'Junquillo Estrecho (74635)', 'junquillo', 'Junquillo estrecho alternativo Serie 1400'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Fijo 2.000"', 'Fijos', [
    ['69083', 'Bolsa Fijo 2.000"', 'bolsa', 'Marco perimetral con bolsa línea 2"'],
    ['68591', 'Bolsa Lisa 2.000"', 'bolsa', 'Poste/marco bolsa lisa línea 2"'],
    ['39084', 'Escalonado 2.000"', 'escalonado', 'Marco escalonado perimetral línea 2"'],
    ['28586', 'Esquinero 2.000"', 'esquinero', 'Esquinero a 90° línea 2"'],
    ['69085', 'Tapa Bolsa 2.000"', 'tapa', 'Tapa para perfil bolsa línea 2"'],
    ['24051', 'Tapa Lisa 2.000"', 'tapa', 'Tapa lisa de cierre línea 2"'],
    ['7792', 'Unión 2.000"', 'union', 'Perfil de unión entre módulos línea 2"'],
    ['9088', 'Junquillo 2.000" (9088)', 'junquillo', 'Junquillo estándar línea 2"'],
    ['39088', 'Junquillo 2.000" (39088)', 'junquillo', 'Junquillo reforzado línea 2"'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Fijo 3.000"', 'Fijos', [
    ['69135', 'Bolsa Fijo 3.000"', 'bolsa', 'Marco principal con bolsa línea 3"'],
    ['69114', 'Bolsa Lisa 3.000"', 'bolsa', 'Poste o marco bolsa lisa línea 3"'],
    ['39136', 'Escalonado 3.000"', 'escalonado', 'Marco escalonado arquitectónico línea 3"'],
    ['67315', 'Tapa Bolsa 3.000"', 'tapa', 'Tapa de cierre para bolsa línea 3"'],
    ['27316', 'Tapa Lisa 3.000"', 'tapa', 'Tapa lisa limpia línea 3"'],
    ['9112', 'Junquillo 3.000"', 'junquillo', 'Junquillo clip de sujeción de cristal 3"'],
    ['39115', 'Esquinero 3.000"', 'esquinero', 'Esquinero estructural 90° línea 3"'],
    ['10266', 'Unión 3.000"', 'union', 'Perfil de acople/unión línea 3"'],
    ['18270', 'Bolsa Doble Vidrio 3"', 'bolsa', 'Perfil Fijo 3" para doble acristalamiento (Duovent)'],
    ['28183', 'Escalonado Doble Vidrio 3"', 'escalonado', 'Perfil escalonado para cristal insulado 3"'],
    ['8184', 'Junquillo Doble Vidrio 3"', 'junquillo', 'Junquillo para doble vidrio en Fijo 3"'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Fijo 4.000"', 'Fijos', [
    ['29117', 'Bolsa Fijo 4.000"', 'bolsa', 'Marco principal bolsa 4" para claros monumentales'],
    ['29119', 'Bolsa Lisa 4.000"', 'bolsa', 'Manguete o marco bolsa lisa 4"'],
    ['29118', 'Escalonado 4.000"', 'escalonado', 'Marco escalonado 4"'],
    ['26609', 'Tapa Bolsa 4.000"', 'tapa', 'Tapa para bolsa 4"'],
    ['24055', 'Tapa Lisa 4.000"', 'tapa', 'Tapa lisa 4"'],
    ['26606', 'Junquillo 4.000"', 'junquillo', 'Junquillo clip para fijo 4"'],
    ['7158', 'Esquinero 4.000"', 'esquinero', 'Esquinero estructural 4"'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Corrediza C-Light', 'Corredizas', [
    ['11835 / 15309', 'Jamba / Cabezal C-Light', 'jamba', 'Marco superior y lateral económico C-Light'],
    ['11838 / 15310', 'Riel C-Light', 'riel', 'Riel inferior doble vía C-Light'],
    ['11837 / 15311', 'Cabezal / Zoclo C-Light', 'zoclo', 'Horizontales superior e inferior de hoja C-Light'],
    ['11836 / 15312', 'Cerco C-Light', 'cerco', 'Perfil vertical de hoja corrediza C-Light'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Corrediza 2"', 'Corredizas', [
    ['67518', 'Cabezal / Jamba 2"', 'cabezal', 'Marco superior y jambas laterales corrediza 2"'],
    ['14286', 'Riel 2"', 'riel', 'Riel inferior doble carril corrediza 2"'],
    ['27819 / 67819', 'Cabezal Mosquitero 2"', 'cabezal', 'Cabezal con carril integrado para mosquitero 2"'],
    ['68370 / 38370', 'Riel Mosquitero 2"', 'riel', 'Riel inferior con guía para hoja mosquitera 2"'],
    ['11044 / 9956', 'Cabezal / Zoclo Ventana 2"', 'zoclo', 'Horizontales de hoja ventana corrediza 2"'],
    ['37825', 'Zoclo Puerta 2"', 'zoclo', 'Zoclo inferior reforzado para puerta corrediza 2"'],
    ['67821', 'Cerco Puerta 2"', 'cerco', 'Cerco lateral reforzado para chapa de puerta 2"'],
    ['8320', 'Cerco Ventana 2"', 'cerco', 'Cerco vertical exterior para ventana corrediza 2"'],
    ['69955', 'Traslape Puerta 2"', 'traslape', 'Traslape central reforzado puerta 2"'],
    ['39954', 'Traslape Ventana 2"', 'traslape', 'Traslape central para ventana corrediza 2"'],
    ['67822', 'Cerco OXXO 2"', 'cerco', 'Cerco encuentro central para arreglo OXXO 2"'],
    ['7818', 'Adaptador XX 2"', 'union', 'Adaptador encuentro doble corrediza XX 2"'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Corrediza 3"', 'Corredizas', [
    ['67826', 'Cabezal / Jamba 3"', 'cabezal', 'Marco superior y jambas laterales corrediza 3"'],
    ['69957', 'Riel 3"', 'riel', 'Riel inferior doble vía de 3" para carretilla tándem'],
    ['27862 / 67862', 'Cabezal Mosquitero 3"', 'cabezal', 'Cabezal 3" con tercer carril para mosquitero'],
    ['69272 / 39272', 'Riel Mosquitero 3"', 'riel', 'Riel inferior 3" con vía para hoja mosquitera'],
    ['67836', 'Cabezal Ventana 3"', 'zoclo', 'Horizontal superior de hoja ventana 3"'],
    ['67835', 'Zoclo Ventana 3"', 'zoclo', 'Horizontal inferior (zoclo) de hoja ventana 3"'],
    ['67842', 'Zoclo Puerta 3"', 'zoclo', 'Zoclo puerta doble vena 3"'],
    ['67847', 'Cerco Chapa Puerta 3"', 'cerco', 'Cerco reforzado con caja para chapa puerta 3"'],
    ['67843', 'Cerco Ventana 3"', 'cerco', 'Cerco lateral para hoja de ventana 3"'],
    ['67848', 'Traslape Puerta 3"', 'traslape', 'Traslape central reforzado para puerta 3"'],
    ['67844', 'Cerco Traslape Ventana 3"', 'traslape', 'Traslape central para ventana corrediza 3"'],
    ['67850', 'Cerco OXXO 3"', 'cerco', 'Cerco encuentro central para arreglo 4 hojas OXXO 3"'],
    ['7828', 'Adaptador XX 3"', 'union', 'Adaptador encuentro doble hoja móvil XX / riel adic. 3"'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Guillotina y Puerta California', 'Corredizas', [
    ['10570', 'Jamba Guillotina (10570)', 'jamba', 'Jamba lateral con guía para balance guillotina'],
    ['10568', 'Cabezal Guillotina (10568)', 'cabezal', 'Marco superior sistema guillotina'],
    ['12797', 'Riel Base Guillotina (12797)', 'riel', 'Perfil base inferior con drenaje guillotina'],
    ['20569', 'Cerco Hoja Guillotina (20569)', 'cerco', 'Perfil vertical de hoja deslizante guillotina'],
    ['19272', 'Traslape Guillotina (19272)', 'traslape', 'Encuentro horizontal central entre hojas guillotina'],
    ['7109', 'Marco California (7109)', 'cabezal', 'Marco perimetral Puerta California'],
    ['7110', 'Riel California (7110)', 'riel', 'Riel inferior Puerta California'],
    ['27111', 'Jamba California (27111)', 'jamba', 'Jamba lateral Puerta California'],
    ['7108', 'Zoclo California (7108)', 'zoclo', 'Zoclo reforzado Puerta California'],
    ['7105', 'Cerco Chapa California (7105)', 'cerco', 'Cerco lateral con alojamiento de chapa California'],
    ['7106', 'Traslape California (7106)', 'traslape', 'Traslape central Puerta California'],
    ['7107', 'Cabezal Hoja California (7107)', 'zoclo', 'Horizontal superior de hoja Puerta California'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Batientes Serie 1400', 'Batientes, Baño, Louvers y Fachada', [
    ['73972', 'Pilastra Ventana Serie 1400', 'marco-batiente', 'Pilastra intermedia / divisor para ventana Serie 1400'],
    ['73981', 'Hoja Ventana Serie 1400', 'hoja-euro', 'Perfil perimetral de hoja abatible/proyectable S1400'],
    ['73985', 'Pilastra Puerta Serie 1400', 'marco-batiente', 'Pilastra reforzada para puerta Serie 1400'],
    ['73973', 'Cerco Puerta Serie 1400', 'marco-batiente', 'Marco / cerco perimetral de puerta Serie 1400'],
    ['74074', 'Cerco Curvo Serie 1400', 'marco-batiente', 'Marco curvo estético para puerta Serie 1400'],
    ['73983', 'Hoja Puerta Serie 1400', 'hoja-euro', 'Perfil perimetral tubular de hoja puerta S1400'],
    ['74075', 'Zoclo Serie 1400', 'zoclo', 'Zoclo inferior reforzado puerta Serie 1400'],
    ['73974', 'Hoja Monumental Serie 1400', 'hoja-euro', 'Hoja de gran peralte para claros monumentales S1400'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Cancel de Baño', 'Batientes, Baño, Louvers y Fachada', [
    ['9947', 'Riel Superior Baño (9947)', 'bano', 'Riel superior clásico para cancel de baño'],
    ['10197', 'Jamba Lateral Baño (10197)', 'bano', 'Jamba U de fijación a muro para baño'],
    ['10198', 'Guía Inferior Baño (10198)', 'bano', 'Canal guía inferior para cancel de baño'],
    ['11174', 'Riel Curvo Baño (11174)', 'bano', 'Riel superior curvo semilujo / lujo para baño'],
    ['11176', 'Marco Bastidor Baño (11176)', 'bano', 'Bastidor vertical/horizontal hoja de baño'],
    ['11386', 'Jamba Lateral Semilujo (11386)', 'bano', 'Jamba de ajuste a muro para cancel semilujo'],
    ['11387', 'Guía Inferior Doble (11387)', 'bano', 'Guía inferior doble canal con drenaje interior'],
    ['4154', 'Marco Económico Baño (4154)', 'bano', 'Perfil bastidor ligero para acrílico o vidrio'],
    ['7102', 'Tapa / Remate Baño (7102)', 'bano', 'Perfil remate y sellado para cancel de baño'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Louvers', 'Batientes, Baño, Louvers y Fachada', [
    ['66053', 'Marco Louver Principal (66053)', 'louver', 'Marco perimetral para rejilla louver'],
    ['10087', 'Tableta Louver Estándar (10087)', 'louver', 'Tableta inclinada cortasol / ventilación'],
    ['10088', 'Tableta Louver Reforzada (10088)', 'louver', 'Tableta louver de mayor peralte estructural'],
    ['11599', 'Poste Soporte Louver (11599)', 'louver', 'Poste lateral con guía para tabletas louver'],
    ['63299', 'Marco Perimetral Louver (63299)', 'louver', 'Contramarco exterior para louver arquitectónico'],
    ['11162', 'Tableta Z Louver (11162)', 'louver', 'Tableta tipo Z antilluvia para ventilación'],
    ['67362', 'Remate / Tapa Louver (67362)', 'louver', 'Perfil de cierre superior e inferior louver'],
  ]),
  ...buildEntries('panorama-cuprum', 'Panorama / Cuprum', 'Fachada Integral', 'Batientes, Baño, Louvers y Fachada', [
    ['10581', 'Manguete Fachada (10581)', 'fachada', 'Poste estructural vertical para muro cortina'],
    ['11417', 'Travesaño Fachada (11417)', 'fachada', 'Travesaño horizontal para fachada integral'],
    ['11005', 'Tapa Presión Fachada (11005)', 'fachada', 'Tapa de presión con tornillería oculta fachada'],
    ['14669', 'Tapa Vista Exterior (14669)', 'fachada', 'Cubierta estética exterior para fachada integral'],
    ['14668', 'Bastidor Oculto Fachada (14668)', 'fachada', 'Perfil bastidor para silicón estructural'],
    ['12208', 'Adaptador Ventana Fachada (12208)', 'fachada', 'Marco adaptador para ventana proyectable en fachada'],
    ['63463', 'Refuerzo Interior Fachada (63463)', 'fachada', 'Refuerzo tubular para grandes alturas de fachada'],
  ]),

  // =========================================================================
  // 2. PERFILETTO (Perfiletto Aluminum)
  // =========================================================================
  ...buildEntries('perfiletto', 'Perfiletto', 'U-Light / C-Light', 'Líneas Ligeras', [
    ['9073', 'Bolsa U-Light (9073)', 'bolsa', 'Bolsa perimetral U-Light 1 1/2" Perfiletto'],
    ['49074', 'Escalonado U-Light (49074)', 'escalonado', 'Escalonado U-Light Perfiletto'],
    ['46370', 'Junquillo U-Light (46370)', 'junquillo', 'Junquillo clip U-Light Perfiletto'],
    ['9075', 'Tapa Bolsa U-Light (9075)', 'tapa', 'Tapa bolsa U-Light Perfiletto'],
    ['9356', 'Tapa Lisa U-Light (9356)', 'tapa', 'Tapa lisa U-Light Perfiletto'],
    ['9078', 'Intermedio U-Light (9078)', 'union', 'Perfil intermedio / unión U-Light'],
    ['15309', 'Jamba / Cabezal C-Light (15309)', 'jamba', 'Jamba y cabezal corrediza C-Light Perfiletto'],
    ['15310', 'Riel C-Light (15310)', 'riel', 'Riel doble vía C-Light Perfiletto'],
    ['15311', 'Cabezal / Zoclo C-Light (15311)', 'zoclo', 'Horizontal superior/inferior hoja C-Light'],
    ['11041', 'Cerco C-Light (11041)', 'cerco', 'Cerco vertical exterior hoja C-Light'],
    ['11048', 'Traslape C-Light (11048)', 'traslape', 'Traslape central hoja C-Light'],
    ['9255', 'Canal U Mosquitero (9255)', 'mosquitero', 'Perfil bastidor ligero C-Light'],
    ['9236', 'Riel Auxiliar Light (9236)', 'riel', 'Guía auxiliar C-Light Perfiletto'],
    ['7837', 'Remate Light (7837)', 'tapa', 'Remate perimetral línea ligera Perfiletto'],
  ]),
  ...buildEntries('perfiletto', 'Perfiletto', 'Línea 2" Light / Comercial', 'Línea Nacional 2"', [
    ['69083 / 9083', 'Bolsa Fijo 2" (69083 / 9083)', 'bolsa', 'Bolsa 2" Light y Comercial Perfiletto'],
    ['69084 / 9084', 'Escalonado 2" (69084 / 9084)', 'escalonado', 'Escalonado 2" Light y Comercial Perfiletto'],
    ['69088 / 9088', 'Junquillo 2" (69088 / 9088)', 'junquillo', 'Junquillo 2" Light y Comercial Perfiletto'],
    ['67518 / 7518', 'Cabezal / Jamba 2" (67518 / 7518)', 'cabezal', 'Marco superior y jambas corrediza 2" Perfiletto'],
    ['T67518 / T7518', 'Jamba Tubular 2" (T67518 / T7518)', 'jamba', 'Jamba tubular reforzada 2" Perfiletto'],
    ['69953 / 9953', 'Riel Doble 2" (69953 / 9953)', 'riel', 'Riel inferior doble carril 2" Perfiletto'],
    ['611044 / 11044', 'Cabezal / Zoclo 2" (611044 / 11044)', 'zoclo', 'Horizontal hoja ventana corrediza 2" Perfiletto'],
    ['67821 / 7821 / 8320', 'Cerco Puerta/Ventana 2"', 'cerco', 'Cerco vertical puerta (67821/7821) y ventana (8320)'],
    ['69954 / 9954', 'Traslape Ventana 2" (69954 / 9954)', 'traslape', 'Traslape central ventana corrediza 2"'],
    ['69955 / 9955', 'Traslape Puerta 2" (69955 / 9955)', 'traslape', 'Traslape reforzado puerta corrediza 2"'],
    ['35844 / 65844', 'Marco Batiente 2" (35844 / 65844)', 'marco-batiente', 'Marco con tope para puerta batiente 2"'],
    ['69204', 'Cerco Puerta Batiente (69204)', 'cerco', 'Cerco curvo / larguero puerta batiente Perfiletto'],
    ['69207', 'Cabezal Hoja Puerta (69207)', 'zoclo', 'Cabezal superior hoja puerta batiente Perfiletto'],
    ['69187', 'Zoclo Puerta Batiente (69187)', 'zoclo', 'Zoclo inferior reforzado puerta batiente Perfiletto'],
  ]),
  ...buildEntries('perfiletto', 'Perfiletto', 'Línea 3"', 'Línea Nacional 3"', [
    ['69135 / 9135', 'Bolsa Fijo 3" (69135 / 9135)', 'bolsa', 'Marco bolsa 3" Light y Comercial Perfiletto'],
    ['69136 / 9136', 'Escalonado 3" (69136 / 9136)', 'escalonado', 'Escalonado 3" Perfiletto'],
    ['69112 / 9112', 'Junquillo 3" (69112 / 9112)', 'junquillo', 'Junquillo clip 3" Perfiletto'],
    ['77826 / 67826 / 7826', 'Cabezal / Jamba 3"', 'cabezal', 'Marco superior y jambas corrediza 3" Perfiletto'],
    ['T77826 / T67826', 'Jamba Tubular 3"', 'jamba', 'Jamba tubular reforzada 3" Perfiletto'],
    ['79957 / 9957', 'Riel Doble 3" (79957 / 9957)', 'riel', 'Riel inferior doble vía 3" Perfiletto'],
    ['7835 / 7842', 'Zoclo Ventana / Puerta 3"', 'zoclo', 'Zoclo ventana (7835) y zoclo 2 venas puerta (7842)'],
    ['67847 / 7847', 'Cerco Chapa 3" (67847 / 7847)', 'cerco', 'Cerco vertical exterior 3" Perfiletto'],
    ['77848 / 67848 / 7848', 'Traslape 3"', 'traslape', 'Traslape central reforzado 3" Perfiletto'],
  ]),
  ...buildEntries('perfiletto', 'Perfiletto', 'Serie Europea S-35', 'Series Europeas Perfiletto', [
    ['12606', 'Marco S-35 (12606)', 'marco-batiente', 'Marco perimetral abatible/proyectable Serie 35'],
    ['12608', 'Hoja S-35 (12608)', 'hoja-euro', 'Perfil perimetral de hoja corte 45° Serie 35'],
    ['12609', 'Pilastra / Inversora S-35 (12609)', 'marco-batiente', 'Divisor / inversora para doble hoja Serie 35'],
    ['42273', 'Junquillo Recto S-35 (42273)', 'junquillo', 'Junquillo acristalamiento Serie 35'],
    ['32274', 'Junquillo Doble Vidrio S-35 (32274)', 'junquillo', 'Junquillo para cristal insulado Serie 35'],
  ]),
  ...buildEntries('perfiletto', 'Perfiletto', 'Serie Europea S-50', 'Series Europeas Perfiletto', [
    ['12504', 'Marco S-50 (12504)', 'marco-batiente', 'Marco canal europeo abatible/oscilobatiente Serie 50'],
    ['12506', 'Hoja S-50 (12506)', 'hoja-euro', 'Hoja canal europeo corte 45° Serie 50'],
    ['12507', 'Pilastra S-50 (12507)', 'marco-batiente', 'Pilastra estructural intermedia Serie 50'],
    ['54396', 'Junquillo S-50 (54396)', 'junquillo', 'Junquillo clip Serie 50'],
    ['54395', 'Junquillo Duovent S-50 (54395)', 'junquillo', 'Junquillo para doble acristalamiento Serie 50'],
  ]),
  ...buildEntries('perfiletto', 'Perfiletto', 'Serie Europea S-70', 'Series Europeas Perfiletto', [
    ['22504', 'Marco Fijo S-70 (22504)', 'bolsa', 'Marco perimetral fijo/batiente Serie 70'],
    ['32506', 'Hoja Batiente S-70 (32506)', 'hoja-euro', 'Hoja perimetral abatible Serie 70'],
    ['42507', 'Pilastra S-70 (42507)', 'marco-batiente', 'Pilastra divisora Serie 70'],
    ['628407', 'Riel Marco Corrediza S-70 (628407)', 'riel', 'Marco riel doble vía perimetral 45° Serie 70'],
    ['662373', 'Riel Triple S-70 (662373)', 'riel', 'Marco riel triple vía corrediza Serie 70'],
    ['628408', 'Hoja Corrediza S-70 (628408)', 'hoja-euro', 'Hoja corrediza perimetral 45° Serie 70'],
    ['28411', 'Traslape / Gancho S-70 (28411)', 'traslape', 'Adaptador de traslape hermético Serie 70'],
    ['28412', 'Encuentro Central S-70 (28412)', 'union', 'Perfil encuentro central OXXO Serie 70'],
    ['22547', 'Junquillo S-70 (22547)', 'junquillo', 'Junquillo clip acristalamiento Serie 70'],
  ]),
  ...buildEntries('perfiletto', 'Perfiletto', 'Serie Europea S-80', 'Series Europeas Perfiletto', [
    ['638407', 'Riel Marco Doble S-80 (638407)', 'riel', 'Marco riel doble vía corrediza pesada Serie 80'],
    ['648407', 'Riel Marco Triple S-80 (648407)', 'riel', 'Marco riel triple vía corrediza pesada Serie 80'],
    ['648408', 'Hoja Perimetral S-80 (648408)', 'hoja-euro', 'Hoja perimetral reforzada 45° Serie 80'],
    ['48409', 'Traslape Reforzado S-80 (48409)', 'traslape', 'Traslape central con refuerzo viento Serie 80'],
    ['68410', 'Encuentro OXXO S-80 (68410)', 'union', 'Encuentro central 4 hojas Serie 80'],
    ['62263', 'Riel Guía Inox / Mosq S-80 (62263)', 'mosquitero', 'Perfil complementario mosquitero/guía Serie 80'],
  ]),
  ...buildEntries('perfiletto', 'Perfiletto', 'Serie Europea S-100', 'Series Europeas Perfiletto', [
    ['13614', 'Marco Riel Doble S-100 (13614)', 'riel', 'Marco riel monumental doble vía Serie 100'],
    ['13617', 'Marco Riel Triple S-100 (13617)', 'riel', 'Marco riel monumental triple vía Serie 100'],
    ['13616', 'Jamba / Cabezal S-100 (13616)', 'cabezal', 'Perfil cabezal/jamba monumental Serie 100'],
    ['93578P', 'Hoja Perimetral S-100 (93578P)', 'hoja-euro', 'Hoja pesada corte 45° Serie 100'],
    ['94715P', 'Hoja Duovent S-100 (94715P)', 'hoja-euro', 'Hoja para vidrio insulado monumental Serie 100'],
    ['23579', 'Traslape S-100 (23579)', 'traslape', 'Traslape estructural de alta inercia Serie 100'],
    ['93580', 'Encuentro Central S-100 (93580)', 'union', 'Perfil de encuentro central Serie 100'],
    ['H84427', 'Refuerzo Inercia S-100 (H84427)', 'fachada', 'Refuerzo de inercia contra carga de viento S-100'],
    ['74581', 'Junquillo Monumental S-100 (74581)', 'junquillo', 'Junquillo para cristal 10 mm o Duovent Serie 100'],
  ]),

  // =========================================================================
  // 3. INDALUM (Línea Tradicional, Industrial y Línea EuroAlum)
  // =========================================================================
  ...buildEntries('indalum-euroalum', 'Indalum', 'Tradicional 1 3/8" y 1 1/2"', 'Línea Tradicional Indalum', [
    ['1577', 'Bolsa 1 1/2" (1577)', 'bolsa', 'Marco bolsa 1 1/2" Indalum Tradicional'],
    ['1579', 'Escalonado 1 1/2" (1579)', 'escalonado', 'Marco escalonado 1 1/2" Indalum'],
    ['1583', 'Tapa Bolsa 1 1/2" (1583)', 'tapa', 'Tapa para bolsa 1 1/2" Indalum'],
    ['1584', 'Tapa Lisa 1 1/2" (1584)', 'tapa', 'Tapa lisa 1 1/2" Indalum'],
    ['1557', 'Junquillo 1 1/2" (1557)', 'junquillo', 'Junquillo clip 1 1/2" Indalum'],
    ['1564', 'Cabezal 1 3/8" (1564)', 'cabezal', 'Cabezal corrediza 1 3/8" Indalum'],
    ['1553', 'Riel 1 3/8" (1553)', 'riel', 'Riel doble vía 1 3/8" Indalum'],
    ['1559', 'Jamba 1 3/8" (1559)', 'jamba', 'Jamba lateral 1 3/8" Indalum'],
    ['1550', 'Zoclo 1 3/8" (1550)', 'zoclo', 'Zoclo/cabecero hoja 1 3/8" Indalum'],
    ['1560', 'Cerco 1 3/8" (1560)', 'cerco', 'Cerco vertical hoja 1 3/8" Indalum'],
    ['1580', 'Traslape 1 3/8" (1580)', 'traslape', 'Traslape central 1 3/8" Indalum'],
    ['1570', 'Mosquitero 1 3/8" (1570)', 'mosquitero', 'Perfil bastidor mosquitero Indalum'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum', 'Tradicional 2"', 'Línea Tradicional Indalum', [
    ['2050', 'Bolsa 2" (2050)', 'bolsa', 'Marco bolsa Fijo 2" Indalum'],
    ['2069', 'Bolsa Lisa 2" (2069)', 'bolsa', 'Bolsa lisa Fijo 2" Indalum'],
    ['2011', 'Escalonado 2" (2011)', 'escalonado', 'Marco escalonado 2" Indalum'],
    ['2043', 'Tapa Bolsa 2" (2043)', 'tapa', 'Tapa bolsa 2" Indalum'],
    ['2045', 'Tapa Lisa 2" (2045)', 'tapa', 'Tapa lisa 2" Indalum'],
    ['2105', 'Junquillo 2" (2105)', 'junquillo', 'Junquillo clip 2" Indalum'],
    ['2086', 'Cabezal / Jamba 2" (2086)', 'cabezal', 'Marco superior y jambas corrediza 2" Indalum'],
    ['2094', 'Riel Doble 2" (2094)', 'riel', 'Riel doble vía corrediza 2" Indalum'],
    ['2098', 'Cerco Puerta 2" (2098)', 'cerco', 'Cerco lateral reforzado 2" Indalum'],
    ['2097', 'Traslape 2" (2097)', 'traslape', 'Traslape central corrediza 2" Indalum'],
    ['2080', 'Zoclo Ventana 2" (2080)', 'zoclo', 'Horizontal hoja corrediza 2" Indalum'],
    ['2356', 'Cabezal Mosquitero 2" (2356)', 'cabezal', 'Cabezal con vía mosquitero 2" Indalum'],
    ['2366', 'Riel Mosquitero 2" (2366)', 'riel', 'Riel inferior con vía mosquitero 2" Indalum'],
    ['2360', 'Zoclo Puerta 2" (2360)', 'zoclo', 'Zoclo reforzado puerta 2" Indalum'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum', 'Tradicional 3"', 'Línea Tradicional Indalum', [
    ['3076', 'Bolsa 3" (3076)', 'bolsa', 'Marco bolsa Fijo 3" Indalum'],
    ['3083', 'Bolsa Lisa 3" (3083)', 'bolsa', 'Bolsa lisa Fijo 3" Indalum'],
    ['3008', 'Escalonado 3" (3008)', 'escalonado', 'Marco escalonado Fijo 3" Indalum'],
    ['3005', 'Tapa Bolsa 3" (3005)', 'tapa', 'Tapa bolsa Fijo 3" Indalum'],
    ['3015', 'Junquillo 3" (3015)', 'junquillo', 'Junquillo clip Fijo 3" Indalum'],
    ['3086', 'Cabezal / Jamba 3" (3086)', 'cabezal', 'Marco superior y jambas corrediza 3" Indalum'],
    ['3090', 'Riel Doble 3" (3090)', 'riel', 'Riel inferior doble vía 3" Indalum'],
    ['3100', 'Zoclo Puerta 3" (3100)', 'zoclo', 'Zoclo 2 venas puerta corrediza 3" Indalum'],
    ['3035', 'Zoclo Ventana 3" (3035)', 'zoclo', 'Horizontal superior/inferior ventana 3" Indalum'],
    ['3150', 'Intermedio 3" (3150)', 'union', 'Peinazo divisor intermedio 3" Indalum'],
    ['3095', 'Cerco Chapa 3" (3095)', 'cerco', 'Cerco lateral para chapa corrediza 3" Indalum'],
    ['3097', 'Traslape 3" (3097)', 'traslape', 'Traslape central corrediza 3" Indalum'],
    ['3451', 'Cabezal Mosquitero 3" (3451)', 'cabezal', 'Cabezal con carril mosquitero 3" Indalum'],
    ['3461', 'Riel Mosquitero 3" (3461)', 'riel', 'Riel inferior con guía mosquitero 3" Indalum'],
    ['3455', 'Adaptador XX 3" (3455)', 'union', 'Adaptador encuentro doble móvil 3" Indalum'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum', 'Tradicional 4" y 4 1/2"', 'Línea Tradicional Indalum', [
    ['4080', 'Bolsa 4" (4080)', 'bolsa', 'Marco bolsa 4" Indalum'],
    ['4085', 'Bolsa Lisa 4" (4085)', 'bolsa', 'Manguete bolsa lisa 4" Indalum'],
    ['4010', 'Escalonado 4" (4010)', 'escalonado', 'Marco escalonado 4" Indalum'],
    ['4060', 'Tapa Bolsa 4" (4060)', 'tapa', 'Tapa de cierre bolsa 4" Indalum'],
    ['4020', 'Junquillo 4" (4020)', 'junquillo', 'Junquillo acristalamiento 4" Indalum'],
    ['4200', 'Esquinero 4" (4200)', 'esquinero', 'Esquinero estructural 4" Indalum'],
    ['4300', 'Poste Fachada 4 1/2" (4300)', 'fachada', 'Poste estructural 4 1/2" Indalum'],
    ['4031', 'Travesaño 4 1/2" (4031)', 'fachada', 'Travesaño horizontal 4 1/2" Indalum'],
    ['4030', 'Tapa Lisa 4 1/2" (4030)', 'tapa', 'Tapa lisa 4 1/2" Indalum'],
    ['4033', 'Junquillo Doble Vidrio 4 1/2" (4033)', 'junquillo', 'Junquillo para cristal insulado 4 1/2"'],
    ['4063', 'Unión 4 1/2" (4063)', 'union', 'Perfil de unión 4 1/2" Indalum'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum', 'Puerta 1 3/4", Baño y Sifón', 'Línea Tradicional Indalum', [
    ['5178', 'Marco Batiente 1 3/4" (5178)', 'marco-batiente', 'Marco con tope para puerta batiente 1 3/4"'],
    ['5216', 'Cerco Puerta 1 3/4" (5216)', 'cerco', 'Larguero vertical puerta 1 3/4" Indalum'],
    ['5181', 'Cabezal Hoja 1 3/4" (5181)', 'zoclo', 'Horizontal superior puerta 1 3/4" Indalum'],
    ['5191', 'Zoclo Puerta 1 3/4" (5191)', 'zoclo', 'Zoclo inferior reforzado puerta 1 3/4"'],
    ['5200', 'Peinazo Puerta 1 3/4" (5200)', 'union', 'Peinazo intermedio puerta 1 3/4"'],
    ['5106', 'Junquillo Puerta 1 3/4" (5106)', 'junquillo', 'Junquillo acristalamiento puerta 1 3/4"'],
    ['5120', 'Tope / Batiente Puerta (5120)', 'marco-batiente', 'Tope con canal de felpa puerta 1 3/4"'],
    ['6700', 'Riel Superior Baño (6700)', 'bano', 'Riel superior cancel de baño Indalum'],
    ['6705', 'Guía Inferior Baño (6705)', 'bano', 'Guía inferior cancel de baño Indalum'],
    ['6710', 'Jamba Lateral Baño (6710)', 'bano', 'Jamba a muro cancel de baño Indalum'],
    ['6552', 'Marco Hoja Económico Baño (6552)', 'bano', 'Bastidor hoja baño económico Indalum'],
    ['6562', 'Marco Hoja Semilujo Baño (6562)', 'bano', 'Bastidor hoja baño semilujo Indalum'],
    ['6518', 'Marco Hoja Lujo Baño (6518)', 'bano', 'Bastidor hoja baño lujo Indalum'],
    ['6511', 'Remate Baño (6511)', 'bano', 'Perfil remate cancel de baño Indalum'],
    ['3760', 'Marco Sifón (3760)', 'louver', 'Marco perimetral ventana sifón Indalum'],
    ['3762', 'Hoja Sifón (3762)', 'louver', 'Perfil hoja inclinada sifón Indalum'],
    ['3765', 'Tableta Sifón (3765)', 'louver', 'Tableta / celosía ventilación sifón'],
    ['3775', 'Intermedio Sifón (3775)', 'louver', 'Divisor horizontal sifón Indalum'],
    ['3780', 'Goterón Sifón (3780)', 'goteron', 'Vierteaguas / goterón sifón Indalum'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum / EuroAlum', 'EuroAlum 2500 (Corte 45°)', 'Línea EuroAlum Indalum', [
    ['1677', 'Marco Batiente 2500 (1677)', 'marco-batiente', 'Marco perimetral abatible/fijo EuroAlum 2500'],
    ['1680', 'Hoja Interior 2500 (1680)', 'hoja-euro', 'Hoja apertura interior EuroAlum 2500'],
    ['1678', 'Hoja Exterior 2500 (1678)', 'hoja-euro', 'Hoja apertura exterior EuroAlum 2500'],
    ['1684 / 1668 / 1686 / 1667', 'Junquillos 2500 (1684–1667)', 'junquillo', 'Juego de junquillos para cristal 4–20 mm EuroAlum 2500'],
    ['1695', 'Riel Doble 2500 (1695)', 'riel', 'Marco riel doble vía corte 45° (H×2, V×2)'],
    ['1694', 'Riel Triple 2500 (1694)', 'riel', 'Marco riel triple vía corte 45° EuroAlum 2500'],
    ['1699', 'Hoja Corrediza 2500 (1699)', 'hoja-euro', 'Hoja perimetral corte 45° ((H-4)/2 ×4, V-63 ×4)'],
    ['1673', 'Hoja Duo 2500 (1673)', 'hoja-euro', 'Hoja corrediza para doble vidrio EuroAlum 2500'],
    ['1619', 'Adaptador Traslape 2500 (1619)', 'traslape', 'Adaptador traslape central corte 90° (V-65 ×2)'],
    ['1612', 'Mosquitero 2500 (1612)', 'mosquitero', 'Perfil bastidor hoja mosquitera EuroAlum 2500'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum / EuroAlum', 'EuroAlum 2800 (Corte 90°)', 'Línea EuroAlum Indalum', [
    ['12150', 'Riel Inferior 2800 (12150)', 'riel', 'Riel inferior corrediza corte 90° (H-12 ×1)'],
    ['12151', 'Riel Superior 2800 (12151)', 'cabezal', 'Riel superior / cabezal corte 90° (H-12 ×1)'],
    ['12152', 'Jamba 2800 (12152)', 'jamba', 'Jamba lateral corte 90° (V ×2)'],
    ['12153', 'Zoclo / Cabecero 2800 (12153)', 'zoclo', 'Horizontales hoja corte 90° ((H-45)/2 ×4)'],
    ['12154', 'Cerco 2800 (12154)', 'cerco', 'Cerco lateral hoja corte 90° (V-44 ×2)'],
    ['12155', 'Traslape 2800 (12155)', 'traslape', 'Traslape central corte 90° (V-44 ×2)'],
    ['12159', 'Mosquitero 2800 (12159)', 'mosquitero', 'Perfil bastidor mosquitero EuroAlum 2800'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum / EuroAlum', 'EuroAlum 3500', 'Línea EuroAlum Indalum', [
    ['2273', 'Contramarco 3500 (2273)', 'marco-batiente', 'Contramarco perimetral EuroAlum 3500'],
    ['2277', 'Cabezal 3500 (2277)', 'cabezal', 'Cabezal comercial/residencial EuroAlum 3500'],
    ['2278', 'Zoclo Comercial 3500 (2278)', 'zoclo', 'Zoclo puerta comercial EuroAlum 3500'],
    ['2279', 'Zoclo Residencial 3500 (2279)', 'zoclo', 'Zoclo puerta residencial EuroAlum 3500'],
    ['2287', 'Cerco Comercial 3500 (2287)', 'cerco', 'Cerco vertical comercial EuroAlum 3500'],
    ['2288', 'Cerco Residencial 3500 (2288)', 'cerco', 'Cerco vertical residencial EuroAlum 3500'],
    ['2215', 'Intermedio 3500 (2215)', 'union', 'Travesaño intermedio EuroAlum 3500'],
    ['2220–2227', 'Junquillos 3500 (2220 a 2227)', 'junquillo', 'Serie completa de junquillos para 6 mm a insulado'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum / EuroAlum', 'EuroAlum 3800 (Corte 90°)', 'Línea EuroAlum Indalum', [
    ['12263', 'Riel Doble 3800 (12263)', 'riel', 'Riel superior e inferior doble vía 90° (H-25 ×2)'],
    ['12302', 'Riel con Ceja 3800 (12302)', 'riel', 'Riel con ceja perimetral de remate EuroAlum 3800'],
    ['12264', 'Riel Triple 3800 (12264)', 'riel', 'Riel triple vía para 3 hojas o mosquitero 3800'],
    ['12208', 'Jamba 3800 (12208)', 'jamba', 'Jamba lateral corte 90° (V ×2)'],
    ['12240', 'Zoclo / Cabecero Ventana 3800 (12240)', 'zoclo', 'Horizontales hoja ventana 90° ((H-102)/2 ×4)'],
    ['12288', 'Cerco Ventana 3800 (12288)', 'cerco', 'Cerco lateral ventana 90° (V-68 ×2)'],
    ['12297', 'Traslape Ventana 3800 (12297)', 'traslape', 'Traslape central ventana 90° (V-68 ×2)'],
    ['12245', 'Zoclo / Cabecero Puerta 3800 (12245)', 'zoclo', 'Horizontales reforzados puerta corrediza 3800'],
    ['12290', 'Cerco Puerta 3800 (12290)', 'cerco', 'Cerco reforzado con caja de chapa puerta 3800'],
    ['12299', 'Traslape Puerta 3800 (12299)', 'traslape', 'Traslape reforzado puerta corrediza 3800'],
    ['12301', 'Goterón 3800 (12301)', 'goteron', 'Perfil goterón/vierteaguas corte 90° (H ×1)'],
    ['2138', 'Mosquitero 3800 (2138)', 'mosquitero', 'Perfil bastidor hoja mosquitera EuroAlum 3800'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum / EuroAlum', 'EuroAlum 3900', 'Línea EuroAlum Indalum', [
    ['12303', 'Riel Doble 3900 (12303)', 'riel', 'Riel doble vía corte 90° EuroAlum 3900'],
    ['12305', 'Jamba 3900 (12305)', 'jamba', 'Jamba lateral EuroAlum 3900'],
    ['12307', 'Zoclo / Cabecero 3900 (12307)', 'zoclo', 'Horizontales hoja EuroAlum 3900'],
    ['12308', 'Cerco 3900 (12308)', 'cerco', 'Cerco lateral hoja EuroAlum 3900'],
    ['12309', 'Traslape 3900 (12309)', 'traslape', 'Traslape central EuroAlum 3900'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum / EuroAlum', 'EuroAlum 4000', 'Línea EuroAlum Indalum', [
    ['2314', 'Riel Doble 4000 (2314)', 'riel', 'Marco riel doble vía EuroAlum 4000'],
    ['2346', 'Riel Triple 4000 (2346)', 'riel', 'Marco riel triple vía EuroAlum 4000'],
    ['2297', 'Hoja Ventana 4000 (2297)', 'hoja-euro', 'Hoja corrediza ventana EuroAlum 4000'],
    ['2298', 'Hoja Duo Ventana 4000 (2298)', 'hoja-euro', 'Hoja ventana doble vidrio EuroAlum 4000'],
    ['2316', 'Hoja Puerta 4000 (2316)', 'hoja-euro', 'Hoja corrediza puerta EuroAlum 4000'],
    ['2319', 'Hoja Puerta Duo 4000 (2319)', 'hoja-euro', 'Hoja puerta doble vidrio EuroAlum 4000'],
    ['2276 / 2344', 'Traslapes 4000 (2276 / 2344)', 'traslape', 'Traslape estándar y reforzado EuroAlum 4000'],
    ['12009 / 12013', 'Fijos 4000 (12009 / 12013)', 'bolsa', 'Marcos fijos compatibles con EuroAlum 4000'],
    ['2302', 'Marco Batiente 4000 (2302)', 'marco-batiente', 'Marco perimetral abatible EuroAlum 4000'],
    ['2301 / 2334', 'Hojas Batientes 4000 (2301 / 2334)', 'hoja-euro', 'Hojas abatibles interior/exterior EuroAlum 4000'],
  ]),
  ...buildEntries('indalum-euroalum', 'Indalum / EuroAlum', 'EuroAlum 4500', 'Línea EuroAlum Indalum', [
    ['4041', 'Riel Doble 4500 (4041)', 'riel', 'Riel monumental doble vía EuroAlum 4500'],
    ['4057', 'Riel Triple 4500 (4057)', 'riel', 'Riel monumental triple vía EuroAlum 4500'],
    ['4053', 'Riel Bajo Doble 4500 (4053)', 'riel', 'Riel bajo accesible doble vía EuroAlum 4500'],
    ['4054', 'Riel Bajo Triple 4500 (4054)', 'riel', 'Riel bajo accesible triple vía EuroAlum 4500'],
    ['4055', 'Hoja Monumental 4500 (4055)', 'hoja-euro', 'Hoja perimetral pesada EuroAlum 4500'],
    ['4056', 'Hoja Duo 4500 (4056)', 'hoja-euro', 'Hoja doble vidrio monumental EuroAlum 4500'],
    ['4044', 'Adaptador Traslape 4500 (4044)', 'traslape', 'Adaptador traslape central EuroAlum 4500'],
    ['4059', 'Mosquitero 4500 (4059)', 'mosquitero', 'Perfil bastidor mosquitero EuroAlum 4500'],
  ]),
  ...buildEntries(
    'indalum-euroalum',
    'Indalum / EuroAlum',
    'Herrajes Oficiales EuroAlum',
    'Herrajes EuroAlum',
    [
      ['A-2501 – A-2525', 'Kit Herrajes Línea 2500 (A-2501 a A-2525)', 'escuadra', 'Escuadras 45°, carretillas, topes, guías y drenes EuroAlum 2500', 'Juego / Pieza'],
      ['A-2801 – A-2807', 'Kit Herrajes Línea 2800 (A-2801 a A-2807)', 'carretilla', 'Carretillas, guías superiores, topes y drenes EuroAlum 2800', 'Juego / Pieza'],
      ['A-3501 – A-3505', 'Kit Herrajes Línea 3500 (A-3501 a A-3505)', 'bisagra', 'Escuadras, bisagras y accesorios puerta EuroAlum 3500', 'Juego / Pieza'],
      ['A-3801 – A-3810', 'Kit Herrajes Línea 3800 (A-3801 a A-3810)', 'carretilla', 'Carretillas regulables, guías, topes y tapas dren EuroAlum 3800', 'Juego / Pieza'],
      ['A-3901 – A-3910', 'Kit Herrajes Línea 3900 (A-3901 a A-3910)', 'carretilla', 'Accesorios de rodamiento y sellado EuroAlum 3900', 'Juego / Pieza'],
      ['A-4001 – A-4070', 'Kit Herrajes Línea 4000 (A-4001 a A-4070)', 'escuadra', 'Carretillas pesadas, escuadras, multipunto y sellos EuroAlum 4000', 'Juego / Pieza'],
      ['A-4501 – A-4510', 'Kit Herrajes Línea 4500 (A-4501 a A-4510)', 'carretilla', 'Carretillas tándem alta carga y guías monumentales EuroAlum 4500', 'Juego / Pieza'],
      ['A-5000 – A-5091', 'Herrajes Generales EuroAlum (A-5000 a A-5091)', 'cierre-embutido', 'Accesorios generales compatibles en toda la gama EuroAlum', 'Pieza'],
      ['F-304 AS / F-304 AT', 'Broches Automáticos EuroAlum', 'cierre-embutido', 'Broches de cierre automático con/sin llave para corredizas', 'Pieza'],
      ['F-243i', 'Uñero Embutido EuroAlum (F-243i)', 'cierre-embutido', 'Jaladera uñero embutida minimalista EuroAlum', 'Pieza'],
      ['MULT. MAC', 'Cerradura Multipunto (MULT. MAC)', 'chapa', 'Sistema de cierre multipunto con varilla para puerta corrediza', 'Juego'],
      ['F-608 / F-708 / F-5212', 'Manillas / Cremonas EuroAlum', 'manilla', 'Manillas ergonómicas para abatible y corrediza EuroAlum', 'Pieza'],
      ['FELPA ESP', 'Felpa Especial EuroAlum (FELPA ESP)', 'vinil', 'Felpa de alta densidad con aleta central antifiltración', 'Rollo / m'],
      ['328-10 / 328-11 / 195-11 / E-3540/6-7', 'Empaques EPDM EuroAlum', 'vinil', 'Empaques de acristalamiento y batiente EPDM oficiales EuroAlum', 'Rollo / m'],
    ],
    'herraje',
    'Pieza / Juego'
  ),

  // =========================================================================
  // 4. EXTRUSIONES METÁLICAS (Línea Nacional + Línea Española)
  // =========================================================================
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Nacional 1 1/2"', 'Línea Nacional', [
    ['9073', 'Bolsa 1 1/2" (9073)', 'bolsa', 'Marco bolsa 1 1/2" Extrusiones Metálicas'],
    ['9074', 'Escalonado 1 1/2" (9074)', 'escalonado', 'Marco escalonado 1 1/2"'],
    ['9076', 'Bolsa Lisa 1 1/2" (9076)', 'bolsa', 'Poste bolsa lisa 1 1/2"'],
    ['9075', 'Tapa Bolsa 1 1/2" (9075)', 'tapa', 'Tapa bolsa 1 1/2"'],
    ['6370', 'Junquillo 1 1/2" (6370)', 'junquillo', 'Junquillo clip 1 1/2"'],
    ['11068', 'Cabezal 1 1/2" (11068)', 'cabezal', 'Marco superior corrediza 1 1/2"'],
    ['11037', 'Riel 1 1/2" (11037)', 'riel', 'Riel inferior corrediza 1 1/2"'],
    ['11044', 'Zoclo / Cabecero (11044)', 'zoclo', 'Horizontal de hoja corrediza'],
    ['11041', 'Cerco 1 1/2" (11041)', 'cerco', 'Cerco lateral de hoja corrediza 1 1/2"'],
  ]),
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Nacional 2"', 'Línea Nacional', [
    ['9083', 'Bolsa 2" (9083)', 'bolsa', 'Bolsa perimetral Fijo 2" Extrusiones Metálicas'],
    ['9084', 'Escalonado 2" (9084)', 'escalonado', 'Escalonado Fijo 2"'],
    ['8591', 'Bolsa Lisa 2" (8591)', 'bolsa', 'Bolsa lisa Fijo 2"'],
    ['4051', 'Tapa Lisa 2" (4051)', 'tapa', 'Tapa lisa Fijo 2"'],
    ['9085', 'Tapa Bolsa 2" (9085)', 'tapa', 'Tapa bolsa Fijo 2"'],
    ['7792', 'Unión 2" (7792)', 'union', 'Perfil de unión 2"'],
    ['9088', 'Junquillo 2" (9088)', 'junquillo', 'Junquillo clip Fijo 2"'],
    ['7518', 'Cabezal / Jamba 2" (7518)', 'cabezal', 'Marco superior y jambas corrediza 2"'],
    ['9953', 'Riel Doble 2" (9953)', 'riel', 'Riel doble vía corrediza 2"'],
    ['9955', 'Traslape Puerta 2" (9955)', 'traslape', 'Traslape puerta 2"'],
    ['7821', 'Cerco Puerta 2" (7821)', 'cerco', 'Cerco lateral puerta 2"'],
    ['9954', 'Traslape Ventana 2" (9954)', 'traslape', 'Traslape ventana 2"'],
    ['8320', 'Cerco Ventana 2" (8320)', 'cerco', 'Cerco lateral ventana 2"'],
    ['7825', 'Zoclo Puerta 2" (7825)', 'zoclo', 'Zoclo reforzado puerta 2"'],
    ['11044', 'Cabezal / Zoclo Ventana 2" (11044)', 'zoclo', 'Horizontal hoja ventana 2"'],
  ]),
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Nacional 3"', 'Línea Nacional', [
    ['9135', 'Bolsa 3" (9135)', 'bolsa', 'Marco bolsa Fijo 3" Extrusiones Metálicas'],
    ['9136', 'Escalonado 3" (9136)', 'escalonado', 'Marco escalonado Fijo 3"'],
    ['9112', 'Junquillo 3" (9112)', 'junquillo', 'Junquillo clip Fijo 3"'],
    ['9114', 'Bolsa Lisa 3" (9114)', 'bolsa', 'Poste bolsa lisa Fijo 3"'],
    ['7315', 'Tapa Bolsa 3" (7315)', 'tapa', 'Tapa bolsa Fijo 3"'],
    ['7316', 'Tapa Lisa 3" (7316)', 'tapa', 'Tapa lisa Fijo 3"'],
    ['7826', 'Cabezal / Jamba 3" (7826)', 'cabezal', 'Marco superior y jambas corrediza 3"'],
    ['9957', 'Riel Doble 3" (9957)', 'riel', 'Riel inferior doble vía 3"'],
    ['7844', 'Traslape Ventana 3" (7844)', 'traslape', 'Traslape central ventana 3"'],
    ['7843', 'Cerco Ventana 3" (7843)', 'cerco', 'Cerco lateral ventana 3"'],
    ['7848', 'Traslape Puerta 3" (7848)', 'traslape', 'Traslape reforzado puerta 3"'],
    ['7847', 'Cerco Chapa Puerta 3" (7847)', 'cerco', 'Cerco chapa puerta 3"'],
    ['7835', 'Zoclo Ventana 3" (7835)', 'zoclo', 'Horizontal hoja ventana 3"'],
    ['7836', 'Cabezal Ventana 3" (7836)', 'zoclo', 'Horizontal superior hoja 3"'],
    ['7842', 'Zoclo Puerta 2 Venas 3" (7842)', 'zoclo', 'Zoclo inferior reforzado puerta 3"'],
  ]),
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Puerta 1 3/4" y Sifón', 'Línea Nacional', [
    ['9204', 'Cerco Curvo Puerta 1 3/4" (9204)', 'cerco', 'Larguero vertical puerta batiente 1 3/4"'],
    ['9207', 'Cabezal Hoja Puerta 1 3/4" (9207)', 'zoclo', 'Horizontal superior puerta 1 3/4"'],
    ['9187', 'Zoclo Puerta 1 3/4" (9187)', 'zoclo', 'Zoclo inferior puerta 1 3/4"'],
    ['6370', 'Junquillo Puerta 1 3/4" (6370)', 'junquillo', 'Junquillo acristalamiento puerta 1 3/4"'],
    ['9183', 'Peinazo Intermedio (9183)', 'union', 'Divisor intermedio puerta 1 3/4"'],
    ['9184', 'Tope / Batiente Puerta (9184)', 'marco-batiente', 'Perfil batiente con canal de felpa'],
    ['10465', 'Marco Sifón (10465)', 'louver', 'Marco perimetral sifón Extrusiones Metálicas'],
    ['10466', 'Hoja Sifón (10466)', 'louver', 'Bastidor inclinable sifón'],
    ['10554', 'Tableta Sifón (10554)', 'louver', 'Tableta de ventilación sifón'],
    ['10697', 'Intermedio Sifón (10697)', 'louver', 'Travesaño intermedio sifón'],
    ['10467', 'Remate Sifón (10467)', 'goteron', 'Vierteaguas / remate inferior sifón'],
  ]),
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Línea Española Serie 3500', 'Línea Española', [
    ['3501', 'Marco Serie 3500 (3501)', 'marco-batiente', 'Cerco / marco perimetral Línea Española Serie 3500'],
    ['3502', 'Hoja Serie 3500 (3502)', 'hoja-euro', 'Hoja perimetral corte 45° Serie 3500'],
    ['3508', 'Pilastra Serie 3500 (3508)', 'marco-batiente', 'Pilastra intermedia Serie 3500'],
    ['3504', 'Hoja Exterior Serie 3500 (3504)', 'hoja-euro', 'Hoja apertura exterior Serie 3500'],
    ['3505', 'Inversora Serie 3500 (3505)', 'union', 'Perfil inversor doble hoja Serie 3500'],
    ['3507', 'Zócalo Serie 3500 (3507)', 'zoclo', 'Zócalo inferior puerta Serie 3500'],
    ['3510', 'Vierteaguas Serie 3500 (3510)', 'goteron', 'Vierteaguas exterior Serie 3500'],
    ['3533–3537', 'Junquillos Serie 3500 (3533 a 3537)', 'junquillo', 'Juego completo junquillos Serie 3500'],
    ['1736', 'Herraje Escuadra 3500 (1736)', 'escuadra', 'Escuadra de alineación Serie 3500', 'Pieza', 'herraje'],
    ['5117-0', 'Herraje Bisagra 3500 (5117-0)', 'bisagra', 'Bisagra abatible oficial Serie 3500', 'Pieza', 'herraje'],
    ['3205-0', 'Herraje Cierre 3500 (3205-0)', 'manilla', 'Manilla / cierre presión Serie 3500', 'Pieza', 'herraje'],
  ]),
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Línea Española Serie 4600', 'Línea Española', [
    ['4601', 'Riel Doble Serie 4600 (4601)', 'riel', 'Marco riel doble vía corrediza Serie 4600'],
    ['4602', 'Riel Triple Serie 4600 (4602)', 'riel', 'Marco riel triple vía Serie 4600'],
    ['4603', 'Hoja Ventana Serie 4600 (4603)', 'hoja-euro', 'Hoja corrediza perimetral Serie 4600'],
    ['4605', 'Traslape Serie 4600 (4605)', 'traslape', 'Traslape central hermético Serie 4600'],
    ['4606', 'Encuentro Central 4600 (4606)', 'union', 'Encuentro central OXXO Serie 4600'],
    ['4604', 'Hoja Reforzada 4600 (4604)', 'hoja-euro', 'Hoja reforzada puerta corrediza Serie 4600'],
    ['74631', 'Riel Mosquitero 4600 (74631)', 'mosquitero', 'Perfil complementario mosquitero Serie 4600'],
    ['64622', 'Junquillo 4600 (64622)', 'junquillo', 'Junquillo acristalamiento Serie 4600'],
    ['64624', 'Junquillo Duovent 4600 (64624)', 'junquillo', 'Junquillo para doble vidrio Serie 4600'],
    ['2605', 'Carretilla Simple 4600 (2605)', 'carretilla', 'Carretilla corrediza regulable Serie 4600', 'Pieza', 'herraje'],
    ['2705', 'Carretilla Doble 4600 (2705)', 'carretilla', 'Carretilla tándem alta carga Serie 4600', 'Pieza', 'herraje'],
    ['7150', 'Cierre Embutido 4600 (7150)', 'cierre-embutido', 'Cierre embutido automático Serie 4600', 'Pieza', 'herraje'],
    ['7270', 'Multipunto 4600 (7270)', 'chapa', 'Cierre multipunto con manilla Serie 4600', 'Juego', 'herraje'],
    ['7153-0', 'Escuadra Marco 4600 (7153-0)', 'escuadra', 'Escuadra de ensamble marco 45° Serie 4600', 'Pieza', 'herraje'],
    ['1326-0', 'Tope / Guía 4600 (1326-0)', 'escuadra', 'Juego guía superior y tope antidescarrilamiento 4600', 'Juego', 'herraje'],
  ]),
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Línea Española Serie 6000 Abatible / Oscilobatiente', 'Línea Española', [
    ['6001', 'Cerco Ventana 6000 (6001)', 'marco-batiente', 'Marco perimetral ventana canal europeo Serie 6000'],
    ['6002', 'Hoja Interior 6000 (6002)', 'hoja-euro', 'Hoja ventana apertura interior / oscilobatiente 6000'],
    ['6003', 'Pilastra Ventana 6000 (6003)', 'marco-batiente', 'Pilastra intermedia ventana Serie 6000'],
    ['6004', 'Hoja Exterior 6000 (6004)', 'hoja-euro', 'Hoja ventana apertura exterior Serie 6000'],
    ['6005', 'Inversora 6000 (6005)', 'union', 'Perfil inversor central para doble hoja 6000'],
    ['6006', 'Cerco Puerta 6000 (6006)', 'marco-batiente', 'Marco perimetral reforzado puerta Serie 6000'],
    ['6007', 'Hoja Puerta Interior 6000 (6007)', 'hoja-euro', 'Hoja puerta apertura interior Serie 6000'],
    ['6008', 'Pilastra Puerta 6000 (6008)', 'marco-batiente', 'Pilastra estructural puerta Serie 6000'],
    ['6009', 'Hoja Puerta Exterior 6000 (6009)', 'hoja-euro', 'Hoja puerta apertura exterior Serie 6000'],
    ['6010', 'Zócalo Inferior 6000 (6010)', 'zoclo', 'Zócalo inferior puerta Serie 6000'],
    ['6011', 'Zócalo Central 6000 (6011)', 'zoclo', 'Travesaño / zócalo central Serie 6000'],
    ['6015', 'Pletina 6000 (6015)', 'tapa', 'Pletina de ajuste / remate Serie 6000'],
    ['6016', 'Vierteaguas 6000 (6016)', 'goteron', 'Perfil vierteaguas inferior Serie 6000'],
    ['6017–6118', 'Junquillos Serie 6000 (6017 a 6118)', 'junquillo', 'Gama completa de junquillos rectos y curvos Serie 6000'],
    ['7004-0', 'Escuadra Cerco 6000 (7004-0)', 'escuadra', 'Escuadra inyectada para marco Serie 6000', 'Pieza', 'herraje'],
    ['7006-0', 'Escuadra Hoja 6000 (7006-0)', 'escuadra', 'Escuadra inyectada para hoja Serie 6000', 'Pieza', 'herraje'],
    ['7042', 'Bisagra Blitz (7042)', 'bisagra', 'Bisagra canal europeo Blitz regulable Serie 6000', 'Pieza', 'herraje'],
    ['7044', 'Bisagra Grip (7044)', 'bisagra', 'Bisagra pesada Grip para puerta Serie 6000', 'Pieza', 'herraje'],
    ['7011', 'Cremona Nefer (7011)', 'manilla', 'Cremona / manilla abatible Nefer canal europeo', 'Pieza', 'herraje'],
    ['7010', 'Cremona OB (7010)', 'manilla', 'Cremona oscilobatiente doble acción Serie 6000', 'Pieza', 'herraje'],
  ]),
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Línea Española Serie LE 8500', 'Línea Española', [
    ['68500', 'Riel Doble LE 8500 (68500)', 'riel', 'Marco riel doble vía corrediza pesada LE 8500'],
    ['68501', 'Riel Triple LE 8500 (68501)', 'riel', 'Marco riel triple vía LE 8500'],
    ['68502', 'Hoja Perimetral LE 8500 (68502)', 'hoja-euro', 'Hoja perimetral pesada corte 45° LE 8500'],
    ['68503', 'Traslape LE 8500 (68503)', 'traslape', 'Traslape central con refuerzo LE 8500'],
    ['68506', 'Encuentro Central LE 8500 (68506)', 'union', 'Encuentro central OXXO LE 8500'],
    ['68512', 'Junquillo LE 8500 (68512)', 'junquillo', 'Junquillo acristalamiento LE 8500'],
    ['68505', 'Mosquitero LE 8500 (68505)', 'mosquitero', 'Perfil bastidor mosquitero LE 8500'],
    ['8524-0', 'Carretilla Tándem LE 8500 (8524-0)', 'carretilla', 'Carretilla tándem alta capacidad LE 8500', 'Pieza', 'herraje'],
    ['8602-0', 'Escuadra Inyectada LE 8500 (8602-0)', 'escuadra', 'Escuadra perimetral 45° LE 8500', 'Pieza', 'herraje'],
  ]),
  ...buildEntries('extrusiones-metalicas', 'Extrusiones Metálicas', 'Línea Española Serie 10000', 'Línea Española', [
    ['10001', 'Riel Doble Serie 10000 (10001)', 'riel', 'Marco riel monumental doble vía Serie 10000'],
    ['10002', 'Riel Triple Serie 10000 (10002)', 'riel', 'Marco riel monumental triple vía Serie 10000'],
    ['10003', 'Hoja Monumental Serie 10000 (10003)', 'hoja-euro', 'Hoja monumental de alta inercia Serie 10000'],
    ['10004', 'Traslape Monumental 10000 (10004)', 'traslape', 'Traslape reforzado Serie 10000'],
    ['10012', 'Junquillo Monumental 10000 (10012)', 'junquillo', 'Junquillo para vidrio templado o Duovent Serie 10000'],
    ['7155-0', 'Carretilla Monumental 10000 (7155-0)', 'carretilla', 'Carretilla tándem hasta 180 kg Serie 10000', 'Pieza', 'herraje'],
    ['7157-0', 'Escuadra Monumental 10000 (7157-0)', 'escuadra', 'Escuadra de alineación monumental Serie 10000', 'Pieza', 'herraje'],
    ['7260', 'Cierre Multipunto 10000 (7260)', 'chapa', 'Cierre multipunto de alta seguridad Serie 10000', 'Juego', 'herraje'],
  ]),

  // =========================================================================
  // 5. HERRALUM (Catálogo 2026 — Herrajes y Canceles)
  // =========================================================================
  ...buildEntries(
    'herralum',
    'Herralum 2026',
    'Carretillas Herralum',
    'Herrajes Herralum 2026',
    [
      ['2008', 'Carretilla Simple 2" (2008)', 'carretilla', 'Carretilla ajustable estándar para línea 2"', 'Pieza'],
      ['2004', 'Carretilla Doble 3" (2004)', 'carretilla', 'Carretilla tándem de acero/nylon para línea 3"', 'Pieza'],
      ['2095', 'Carretilla Uso Rudo (2095)', 'carretilla', 'Carretilla reforzada con balero sellado', 'Pieza'],
      ['2099', 'Carretilla Tándem Alta Carga (2099)', 'carretilla', 'Carretilla tándem regulable para puerta patio', 'Pieza'],
      ['138201700 – 138203700', 'Carretillas Europeas (138201700–138203700)', 'carretilla', 'Gama oficial de carretillas regulables para series europeas', 'Pieza'],
    ],
    'herraje',
    'Pieza'
  ),
  ...buildEntries(
    'herralum',
    'Herralum 2026',
    'Chapas Herralum',
    'Herrajes Herralum 2026',
    [
      ['1123', 'Chapa Puerta Batiente (1123)', 'chapa', 'Cerradura residencial de cilindro para puerta de aluminio', 'Juego'],
      ['1124', 'Chapa Puerta Jaladera (1124)', 'chapa', 'Cerradura para perfil angosto con llave tetra/estándar', 'Juego'],
      ['1131', 'Chapa Gancho Corrediza (1131)', 'chapa', 'Chapa pico de loro para puerta corrediza 2" y 3"', 'Juego'],
      ['1132', 'Chapa Gancho Doble Cilindro (1132)', 'chapa', 'Chapa corrediza llave-llave alta seguridad', 'Juego'],
      ['1285', 'Chapa Cristal Templado (1285)', 'chapa', 'Cerradura central para puerta de vidrio templado 10 mm', 'Juego'],
      ['1298', 'Chapa Piso / Parche Templado (1298)', 'chapa', 'Cerradura inferior de parche para vidrio templado', 'Juego'],
      ['1096', 'Chapa Manija Serie 1400 (1096)', 'chapa', 'Cerradura angosta con manija para Serie 1400', 'Juego'],
    ],
    'herraje',
    'Juego'
  ),
  ...buildEntries(
    'herralum',
    'Herralum 2026',
    'Cierres Embutidos',
    'Herrajes Herralum 2026',
    [
      ['1280200', 'Cierre Embutido Automático (1280200)', 'cierre-embutido', 'Jaladera cierre embutido sin llave corrediza', 'Pieza'],
      ['1280300', 'Cierre Embutido con Llave (1280300)', 'cierre-embutido', 'Jaladera cierre embutido con cilindro y llave', 'Pieza'],
      ['1382052', 'Cierre Embutido Europeo (1382052)', 'cierre-embutido', 'Cierre embutido multiposición línea europea', 'Pieza'],
      ['1382053', 'Cierre Embutido con Seguro (1382053)', 'cierre-embutido', 'Cierre embutido reforzado con contra regulable', 'Pieza'],
    ],
    'herraje',
    'Pieza'
  ),
  ...buildEntries(
    'herralum',
    'Herralum 2026',
    'Escuadras Monticelli y Serie 1400',
    'Herrajes Herralum 2026',
    [
      ['1068149079', 'Escuadra Monticelli (1068149079)', 'escuadra', 'Escuadra italiana Monticelli de tetón / apriete excéntrico', 'Pieza'],
      ['1068224104', 'Escuadra Monticelli Pesada (1068224104)', 'escuadra', 'Escuadra Monticelli de alta rigidez para hoja pesada', 'Pieza'],
      ['1068359139', 'Escuadra Monticelli Monumental (1068359139)', 'escuadra', 'Escuadra Monticelli para series europeas monumentales', 'Pieza'],
      ['204801400', 'Escuadra Marco Serie 1400 (204801400)', 'escuadra', 'Escuadra de ensamble 45° para marco Serie 1400', 'Pieza'],
      ['204901400', 'Escuadra Hoja Serie 1400 (204901400)', 'escuadra', 'Escuadra de ensamble 45° para hoja Serie 1400', 'Pieza'],
    ],
    'herraje',
    'Pieza'
  ),
  ...buildEntries(
    'herralum',
    'Herralum 2026',
    'Viniles Herralum',
    'Herrajes Herralum 2026',
    [
      ['185', 'Vinil Cuña #185', 'vinil', 'Vinil de acristalamiento pata/cuña estándar 4–6 mm', 'Rollo / m'],
      ['187', 'Vinil Cuña #187', 'vinil', 'Vinil de acristalamiento grueso 6–9 mm', 'Rollo / m'],
      ['143', 'Vinil Cola de Rata #143', 'vinil', 'Cordón redondo para malla mosquitera', 'Rollo / m'],
      ['193', 'Vinil Tope / Burlete #193', 'vinil', 'Empaque sellador para batiente y marco puerta', 'Rollo / m'],
      ['194', 'Vinil EPDM Europeo #194', 'vinil', 'Empaque perimetral EPDM para canal europeo', 'Rollo / m'],
      ['208', 'Vinil Sello Baño #208', 'vinil', 'Sello transparente PVC/silicón para cristal templado de baño', 'Tramo 2.20 m'],
    ],
    'herraje',
    'Rollo / m'
  ),
  ...buildEntries(
    'herralum',
    'Herralum 2026',
    'Canceles de Baño Herralum 2026',
    'Canceles de Baño',
    [
      ['1300 Curvo', 'Cancel de Baño 1300 Curvo', 'cancel-bano', 'Sistema corredizo con riel tubular curvo para cristal templado 8–10 mm', 'Kit completo', 'cancel'],
      ['1301 Río Bravo', 'Cancel de Baño 1301 Río Bravo', 'cancel-bano', 'Sistema corredizo de acero inoxidable con carretillas vistas Río Bravo', 'Kit completo', 'cancel'],
      ['1305 Bacalar', 'Cancel de Baño 1305 Bacalar', 'cancel-bano', 'Sistema corredizo minimalista de barra plana acero inox Bacalar', 'Kit completo', 'cancel'],
      ['1306 Cozumel', 'Cancel de Baño 1306 Cozumel', 'cancel-bano', 'Sistema corredizo doble hoja con riel rectangular Cozumel', 'Kit completo', 'cancel'],
      ['1338 Mexicali', 'Cancel de Baño 1338 Mexicali', 'cancel-bano', 'Sistema abatible / corredizo compacto con herrajes acero inox Mexicali', 'Kit completo', 'cancel'],
    ],
    'cancel',
    'Kit completo'
  ),
];

export interface OfficialCutFormulaRow {
  clave: string;
  perfil: string;
  formulaMm: string;
  cantidad: string;
  corte: '45°' | '90°' | 'Vidrio';
}

export interface OfficialCutTableSpec {
  id: 'euroalum-2500' | 'euroalum-2800' | 'euroalum-3800';
  titulo: string;
  marca: string;
  subtitulo: string;
  anguloPrincipal: '45°' | '90°';
  filas: OfficialCutFormulaRow[];
}

export const OFFICIAL_EUROALUM_CUT_TABLES: OfficialCutTableSpec[] = [
  {
    id: 'euroalum-2500',
    titulo: 'EuroAlum 2500 (2 hojas, 45°)',
    marca: 'Indalum / EuroAlum',
    subtitulo: 'Fórmulas oficiales en milímetros (H = Ancho mm, V = Alto mm)',
    anguloPrincipal: '45°',
    filas: [
      { clave: '1695', perfil: 'Riel Doble Horizontal', formulaMm: 'H', cantidad: '×2', corte: '45°' },
      { clave: '1695', perfil: 'Riel Doble Vertical', formulaMm: 'V', cantidad: '×2', corte: '45°' },
      { clave: '1699', perfil: 'Hoja Horizontal', formulaMm: '(H - 4) / 2', cantidad: '×4', corte: '45°' },
      { clave: '1699', perfil: 'Hoja Vertical', formulaMm: 'V - 63', cantidad: '×4', corte: '45°' },
      { clave: '1619', perfil: 'Adaptador Traslape', formulaMm: 'V - 65', cantidad: '×2', corte: '90°' },
      { clave: 'Vidrio 6 mm', perfil: 'Cristal 6 mm (2 hojas)', formulaMm: '(H - 215) / 2  ×  (V - 170)', cantidad: '2 pzas', corte: 'Vidrio' },
    ],
  },
  {
    id: 'euroalum-2800',
    titulo: 'EuroAlum 2800 (2 hojas, 90°)',
    marca: 'Indalum / EuroAlum',
    subtitulo: 'Fórmulas oficiales en milímetros (H = Ancho mm, V = Alto mm)',
    anguloPrincipal: '90°',
    filas: [
      { clave: '12150', perfil: 'Riel Inferior', formulaMm: 'H - 12', cantidad: '×1', corte: '90°' },
      { clave: '12151', perfil: 'Riel Superior', formulaMm: 'H - 12', cantidad: '×1', corte: '90°' },
      { clave: '12152', perfil: 'Jamba Lateral', formulaMm: 'V', cantidad: '×2', corte: '90°' },
      { clave: '12153', perfil: 'Zoclo / Cabecero', formulaMm: '(H - 45) / 2', cantidad: '×4', corte: '90°' },
      { clave: '12154', perfil: 'Cerco Lateral', formulaMm: 'V - 44', cantidad: '×2', corte: '90°' },
      { clave: '12155', perfil: 'Traslape Central', formulaMm: 'V - 44', cantidad: '×2', corte: '90°' },
      { clave: 'Vidrio', perfil: 'Cristal (2 hojas)', formulaMm: '(H - 141) / 2  ×  (V - 130)', cantidad: '2 pzas', corte: 'Vidrio' },
    ],
  },
  {
    id: 'euroalum-3800',
    titulo: 'EuroAlum 3800 (Ventana 2 hojas, 90°)',
    marca: 'Indalum / EuroAlum',
    subtitulo: 'Fórmulas oficiales en milímetros (H = Ancho mm, V = Alto mm)',
    anguloPrincipal: '90°',
    filas: [
      { clave: '12263', perfil: 'Riel Doble (Sup. e Inf.)', formulaMm: 'H - 25', cantidad: '×2', corte: '90°' },
      { clave: '12208', perfil: 'Jamba Lateral', formulaMm: 'V', cantidad: '×2', corte: '90°' },
      { clave: '12240', perfil: 'Zoclo / Cabecero Ventana', formulaMm: '(H - 102) / 2', cantidad: '×4', corte: '90°' },
      { clave: '12288', perfil: 'Cerco Ventana', formulaMm: 'V - 68', cantidad: '×2', corte: '90°' },
      { clave: '12297', perfil: 'Traslape Ventana', formulaMm: 'V - 68', cantidad: '×2', corte: '90°' },
      { clave: '12301', perfil: 'Goterón Exterior', formulaMm: 'H', cantidad: '×1', corte: '90°' },
      { clave: 'Vidrio', perfil: 'Cristal (2 hojas)', formulaMm: '(H - 198) / 2  ×  (V - 191)', cantidad: '2 pzas', corte: 'Vidrio' },
    ],
  },
];

export function filterOfficialCatalog(
  brandId: OfficialBrandId | 'all',
  query: string,
  tipo: OfficialItemTipo | 'all' = 'all',
  linea: string = 'all'
): OfficialCatalogItem[] {
  const q = query.trim().toLowerCase();
  return OFFICIAL_CATALOG_2026.filter((item) => {
    if (brandId !== 'all' && item.brandId !== brandId) return false;
    if (tipo !== 'all' && item.tipo !== tipo) return false;
    if (linea !== 'all' && item.linea !== linea) return false;
    if (!q) return true;
    const normalizedQ = q.replace('perfileto', 'perfiletto');
    return (
      item.clave.toLowerCase().includes(q) ||
      item.nombre.toLowerCase().includes(q) ||
      item.linea.toLowerCase().includes(q) ||
      item.subcategoria.toLowerCase().includes(q) ||
      item.brandLabel.toLowerCase().includes(q) ||
      item.brandLabel.toLowerCase().includes(normalizedQ) ||
      item.uso.toLowerCase().includes(q)
    );
  });
}
