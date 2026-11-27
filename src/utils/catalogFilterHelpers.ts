import {
  filterOfficialCatalog,
  OfficialBrandId,
  OfficialCatalogItem,
  OfficialItemTipo,
} from './officialCatalog2026';

export type CatalogMaterialSeriesId =
  | 'all'
  | 'aluminio-nacional'
  | 'euroalum-espanola'
  | 'serie-1400-monumental'
  | 'puertas-canceles'
  | 'herrajes-viniles';

export interface CatalogMaterialSeriesOption {
  id: CatalogMaterialSeriesId;
  label: string;
  shortLabel: string;
}

export const CATALOG_MATERIAL_SERIES_OPTIONS: CatalogMaterialSeriesOption[] = [
  { id: 'all', label: 'Todos los materiales y series', shortLabel: 'Todos' },
  { id: 'aluminio-nacional', label: 'Aluminio Nacional (2" y 3")', shortLabel: 'Nacional 2"/3"' },
  { id: 'euroalum-espanola', label: 'EuroAlum / Línea Española', shortLabel: 'EuroAlum / Española' },
  { id: 'serie-1400-monumental', label: 'Serie 1400 / 10000 / Monumental', shortLabel: 'Serie 1400 / Monum.' },
  { id: 'puertas-canceles', label: 'Puertas, Baño y Canceles', shortLabel: 'Puertas y Canceles' },
  { id: 'herrajes-viniles', label: 'Herrajes, Viniles y Sellos', shortLabel: 'Herrajes y Viniles' },
];

export function matchesCatalogMaterialSeries(
  item: OfficialCatalogItem,
  materialSeries: CatalogMaterialSeriesId
): boolean {
  if (materialSeries === 'all') return true;

  const hay = `${item.linea} ${item.subcategoria} ${item.nombre} ${item.uso} ${item.brandLabel}`.toLowerCase();

  switch (materialSeries) {
    case 'aluminio-nacional':
      return (
        item.tipo === 'perfil' &&
        (hay.includes('2"') ||
          hay.includes('3"') ||
          hay.includes('nacional') ||
          hay.includes('tradicional') ||
          hay.includes('bolsa') ||
          hay.includes('corrediza') ||
          hay.includes('fijo')) &&
        !hay.includes('euroalum') &&
        !hay.includes('española')
      );
    case 'euroalum-espanola':
      return (
        hay.includes('euroalum') ||
        hay.includes('española') ||
        hay.includes('europea') ||
        hay.includes('serie 2500') ||
        hay.includes('serie 2800') ||
        hay.includes('serie 3800') ||
        hay.includes('serie 4000') ||
        hay.includes('serie 5000') ||
        hay.includes('serie 70') ||
        hay.includes('serie 80') ||
        hay.includes('serie 35')
      );
    case 'serie-1400-monumental':
      return (
        hay.includes('1400') ||
        hay.includes('10000') ||
        hay.includes('monumental') ||
        hay.includes('4600') ||
        hay.includes('cuprum') ||
        hay.includes('panorama')
      );
    case 'puertas-canceles':
      return (
        item.tipo === 'cancel' ||
        hay.includes('puerta') ||
        hay.includes('baño') ||
        hay.includes('cancel') ||
        hay.includes('batiente') ||
        hay.includes('duela') ||
        hay.includes('templado')
      );
    case 'herrajes-viniles':
      return (
        item.tipo === 'herraje' ||
        hay.includes('herraje') ||
        hay.includes('carretilla') ||
        hay.includes('vinil') ||
        hay.includes('felpa') ||
        hay.includes('chapa') ||
        hay.includes('cerradura') ||
        hay.includes('bisagra') ||
        hay.includes('escuadra') ||
        hay.includes('jaladera')
      );
    default:
      return true;
  }
}

export function filterOfficialCatalogAdvanced(params: {
  brandId: OfficialBrandId | 'all';
  query: string;
  tipo?: OfficialItemTipo | 'all';
  linea?: string;
  materialSeries?: CatalogMaterialSeriesId;
}): OfficialCatalogItem[] {
  const base = filterOfficialCatalog(
    params.brandId,
    params.query,
    params.tipo ?? 'all',
    params.linea ?? 'all'
  );
  const ms = params.materialSeries ?? 'all';
  if (ms === 'all') return base;
  return base.filter((item) => matchesCatalogMaterialSeries(item, ms));
}
