import type { PerfilFamilia } from '../utils/alumineroLogic';
import {
  CATALOG_PLACEHOLDER_KEY_BY_FAMILIA,
  type CatalogPlaceholderKey,
} from '../utils/assistantGuideLogic';
import perfilCorredizaImg from '../assets/images/perfil_corrediza_3_1795797438601.jpg';
import perfilEuropeaImg from '../assets/images/perfil_europea_serie_1795797440901.jpg';
import perfilBatienteImg from '../assets/images/perfil_puerta_batiente_1795797441174.jpg';
import perfilCancelImg from '../assets/images/perfil_cancel_bano_1795797441749.jpg';
import perfilMosquiteroImg from '../assets/images/perfil_mosquitero_marco_1795797442119.jpg';

export interface CatalogPlaceholderAsset {
  src: string;
  label: string;
  alt: string;
}

const ASSETS_BY_KEY: Record<CatalogPlaceholderKey, CatalogPlaceholderAsset> = {
  corrediza: {
    src: perfilCorredizaImg,
    label: 'Vista referencial · Línea Nacional 3" / 2"',
    alt: 'Perfiles extruidos de aluminio arquitectónico para ventana corrediza y fija',
  },
  europea: {
    src: perfilEuropeaImg,
    label: 'Vista referencial · Línea Europea / Serie 1400',
    alt: 'Perfiles de aluminio arquitectónico línea europea y serie 1400 con corte a 45 grados',
  },
  batiente: {
    src: perfilBatienteImg,
    label: 'Vista referencial · Puerta Batiente y Herrajes',
    alt: 'Perfiles tubulares reforzados de aluminio para puerta batiente',
  },
  cancel: {
    src: perfilCancelImg,
    label: 'Vista referencial · Cancel para Baño',
    alt: 'Perfiles de aluminio anodizado brillante para cancel de baño y cristal templado',
  },
  mosquitero: {
    src: perfilMosquiteroImg,
    label: 'Vista referencial · Mosquiteros y Perfileto',
    alt: 'Perfiles ligeros de aluminio para marco de mosquitero y línea Perfileto',
  },
};

export function getCatalogProfilePlaceholder(familia: PerfilFamilia): CatalogPlaceholderAsset {
  const key = CATALOG_PLACEHOLDER_KEY_BY_FAMILIA[familia] || 'corrediza';
  return ASSETS_BY_KEY[key];
}
