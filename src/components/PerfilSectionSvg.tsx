import React from 'react';
import { PerfilCatalogoId } from '../utils/alumineroLogic';

interface Props {
  perfilId: PerfilCatalogoId;
  fotoRealUrl?: string;
  size?: number;
  className?: string;
  orientacion?: 'horizontal' | 'vertical';
}

export const PerfilSectionSvg: React.FC<Props> = ({
  perfilId,
  fotoRealUrl,
  size = 32,
  className = '',
  orientacion,
}) => {
  if (fotoRealUrl) {
    return (
      <img
        src={fotoRealUrl}
        alt={`Foto real de perfil ${perfilId}`}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: 6,
          display: 'block',
          backgroundColor: '#FFFFFF',
        }}
      />
    );
  }

  const ink = '#111827';
  const outerW = 1.2;
  const innerW = 1.05;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', backgroundColor: '#FFFFFF', borderRadius: 6 }}
    >
      {/* Fondo blanco limpio estilo catálogo técnico CAD */}
      <rect x="0" y="0" width="120" height="120" rx="8" fill="#FFFFFF" />

      {/* 1A. CONTRAMARCO / CABEZAL CORREDIZO DOBLE VÍA (7836) */}
      {perfilId === 'cabezal' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Contorno exterior con pestañas superiores de asiento y patas de doble vía */}
          <path
            d="M12,24 H108 V31 H102 V88 H96 V83 H92 V88 H88 V44 H65 V84 H55 V44 H32 V88 H28 V83 H24 V88 H18 V31 H12 Z"
            strokeWidth={outerW}
          />
          {/* Cámaras huecas internas en la cabeza superior */}
          <rect x="23" y="29" width="23" height="9" rx="1.2" strokeWidth={innerW} />
          <rect x="50" y="29" width="20" height="9" rx="1.2" strokeWidth={innerW} />
          <rect x="74" y="29" width="23" height="9" rx="1.2" strokeWidth={innerW} />
          {/* Topes/aletas de felpa interiores en las guías */}
          <path d="M32,68 H36 M55,68 H51 M65,68 H69 M88,68 H84" strokeWidth={innerW} />
        </g>
      )}

      {/* 1B. CABEZAL PP PUERTA BATIENTE (9207) */}
      {perfilId === 'alumer_9207' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Cuerpo hueco rectangular con canal receptor superior y tope batiente lateral */}
          <path
            d="M28,16 H35 V34 H72 V16 H79 V44 H96 V53 H79 V96 H28 Z"
            strokeWidth={outerW}
          />
          {/* Cámara hueca principal + vena semicircular de armado */}
          <path
            d="M35,42 H72 V64 H67 A4,4 0 1 0 67,72 H72 V89 H35 V72 H40 A4,4 0 1 0 40,64 H35 Z"
            strokeWidth={innerW}
          />
          {/* Pequeño tope interno para empaque en canal vidrio y en batiente */}
          <path d="M35,23 H39 M72,23 H68 M86,44 V49 H92" strokeWidth={innerW} />
        </g>
      )}

      {/* 2A. RIEL CORREDIZO DOBLE VÍA (7857) */}
      {perfilId === 'riel' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Base con pestañas inferiores de asiento, cámaras huecas y dos guías superiores para ruedas */}
          <path
            d="M12,89 V82 H18 V50 H24 V66 H38 V33 C38,29.5 44,29.5 44,33 V66 H56 V56 H64 V66 H76 V33 C76,29.5 82,29.5 82,33 V66 H96 V50 H102 V82 H108 V89 Z"
            strokeWidth={outerW}
          />
          {/* Tres cámaras huecas internas de la base */}
          <rect x="24" y="72" width="21" height="10" rx="1.2" strokeWidth={innerW} />
          <rect x="49" y="72" width="22" height="10" rx="1.2" strokeWidth={innerW} />
          <rect x="75" y="72" width="21" height="10" rx="1.2" strokeWidth={innerW} />
          {/* Alma hueca de las dos guías superiores */}
          <rect x="39.8" y="37" width="2.4" height="29" rx="1" strokeWidth={0.95} />
          <rect x="77.8" y="37" width="2.4" height="29" rx="1" strokeWidth={0.95} />
        </g>
      )}

      {/* 2B. RIEL SUPERIOR COLGANTE CANCEL BAÑO (11174) */}
      {perfilId === 'alumer_11174' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Carcasa colgante superior con pestañas de fijación y pistas internas de carretilla */}
          <path
            d="M22,22 H98 V28 H91 V88 H74 V76 H82 V50 H64 V88 H56 V50 H38 V76 H46 V88 H29 V28 H22 Z"
            strokeWidth={outerW}
          />
          {/* Cámaras huecas superiores del riel colgante */}
          <rect x="34" y="28" width="23" height="14" rx="1.2" strokeWidth={innerW} />
          <rect x="63" y="28" width="23" height="14" rx="1.2" strokeWidth={innerW} />
          {/* Pistas cóncavas donde corren las ruedas */}
          <path d="M74,76 C77,73 80,73 82,76 M38,76 C40,73 43,73 46,76" strokeWidth={innerW} />
        </g>
      )}

      {/* 2C. RIEL ADICIONAL 3ª VÍA (7828) */}
      {perfilId === 'alumer_7828' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M28,90 V83 H34 V52 H40 V68 H56 V32 C56,28.5 64,28.5 64,32 V68 H80 V56 H86 V83 H92 V90 Z"
            strokeWidth={outerW}
          />
          <rect x="40" y="74" width="18" height="9" rx="1.2" strokeWidth={innerW} />
          <rect x="62" y="74" width="18" height="9" rx="1.2" strokeWidth={innerW} />
          <rect x="58.5" y="36" width="3" height="32" rx="1" strokeWidth={0.95} />
        </g>
      )}

      {/* 3A. JAMBA LATERAL 3" (7825) */}
      {perfilId === 'jamba' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Canal lateral en U con patas dobles, dos cámaras internas y topes T para felpa */}
          <path
            d="M18,26 H34 V68 H86 V26 H102 V92 H18 Z"
            strokeWidth={outerW}
          />
          {/* Dos cámaras huecas internas en la base y cámaras verticales laterales */}
          <rect x="24" y="75" width="33" height="10" rx="1.2" strokeWidth={innerW} />
          <rect x="63" y="75" width="33" height="10" rx="1.2" strokeWidth={innerW} />
          <rect x="23" y="32" width="5.5" height="36" rx="1" strokeWidth={innerW} />
          <rect x="91.5" y="32" width="5.5" height="36" rx="1" strokeWidth={innerW} />
          {/* Topes / ranuras para felpa en paredes interiores */}
          <path d="M34,42 H38 V48 H34 M86,42 H82 V48 H86 M46,68 V63 H51 V68 M74,68 V63 H69 V68" strokeWidth={innerW} />
        </g>
      )}

      {/* 3B. JAMBA LATERAL / GUÍA INFERIOR CANCEL BAÑO (11386, 11387) */}
      {(perfilId === 'alumer_11386' || perfilId === 'alumer_11387') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M24,32 H34 V72 H56 V44 H64 V72 H86 V32 H96 V88 H24 Z"
            strokeWidth={outerW}
          />
          <rect x="31" y="77" width="27" height="6" rx="1" strokeWidth={innerW} />
          <rect x="62" y="77" width="27" height="6" rx="1" strokeWidth={innerW} />
          <path d="M34,46 H38 M86,46 H82" strokeWidth={innerW} />
        </g>
      )}

      {/* 4A. CERCO CHAPA CORREDIZA (7847) */}
      {perfilId === 'cerco' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Cuerpo rectangular hueco + compartimento lateral derecho para cerradura + canal receptor de vidrio a la izquierda */}
          <path
            d="M18,28 H38 V36 H25 V84 H38 V92 H18 Z"
            strokeWidth={outerW}
          />
          {/* Unión del cuerpo principal y compartimento de cerradura */}
          <path
            d="M38,24 H98 V96 H38 Z"
            strokeWidth={outerW}
          />
          {/* Cámara hueca estructural + vena de armado */}
          <path
            d="M44,31 H74 V89 H44 V65 H49 A3.8,3.8 0 1 0 49,55 H44 Z"
            strokeWidth={innerW}
          />
          {/* Compartimento lateral dedicado para cerradura / jaladera */}
          <path
            d="M80,31 H92 V50 H87 V70 H92 V89 H80 Z"
            strokeWidth={innerW}
          />
          {/* Dientes de retención de vinil en el canal de vidrio */}
          <path d="M25,41 H29 M25,79 H29" strokeWidth={innerW} />
        </g>
      )}

      {/* 4B. CERCO CURVO PUERTA BATIENTE (9204) */}
      {perfilId === 'alumer_9204' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Perfil curvo en cara exterior derecha, canal vidrio izquierdo y cámara de cerradura */}
          <path
            d="M22,26 H38 V36 H29 V84 H38 V94 H22 Z"
            strokeWidth={outerW}
          />
          <path
            d="M38,20 H84 C96,20 100,32 100,60 C100,88 96,100 84,100 H38 Z"
            strokeWidth={outerW}
          />
          {/* Cámara interior con vena de armado */}
          <path
            d="M44,28 H70 V92 H44 V64 H49 A4,4 0 1 0 49,56 H44 Z"
            strokeWidth={innerW}
          />
          {/* Compartimento lateral curvo para alojamiento de chapa */}
          <path
            d="M76,28 H84 C91,28 93,38 93,60 C93,82 91,92 84,92 H76 Z"
            strokeWidth={innerW}
          />
          <path d="M29,42 H33 M29,78 H33" strokeWidth={innerW} />
        </g>
      )}

      {/* 5A. TRASLAPE CENTRAL (7848) */}
      {perfilId === 'traslape' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Canal de vidrio izquierdo + cuerpo hueco + aleta gancho de enganche a la derecha */}
          <path
            d="M20,30 H38 V38 H27 V82 H38 V90 H20 Z"
            strokeWidth={outerW}
          />
          <path
            d="M38,24 H74 V38 H98 V56 H91 V45 H74 V96 H38 Z"
            strokeWidth={outerW}
          />
          {/* Cámara hueca interna + vena de armado */}
          <path
            d="M45,31 H67 V89 H45 V64 H50 A3.8,3.8 0 1 0 50,56 H45 Z"
            strokeWidth={innerW}
          />
          {/* Ranura para felpa guardapolvo en encuentro de traslape */}
          <path d="M74,64 H80 V72 H74 M27,43 H31 M27,77 H31" strokeWidth={innerW} />
        </g>
      )}

      {/* 5B. INTERMEDIOS CORREDIZA (9382, 9382 C) */}
      {(perfilId === 'alumer_9382' || perfilId === 'alumer_9382c') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Perfil en H con canales U superior e inferior para vidrio y cámara central con vena */}
          <path
            d="M32,16 H40 V35 H80 V16 H88 V104 H80 V85 H40 V104 H32 Z"
            strokeWidth={outerW}
          />
          {/* Cámara interna central con doble vena semicircular */}
          <path
            d="M40,42 H80 V56 H75 A4,4 0 1 0 75,64 H80 V78 H40 V64 H45 A4,4 0 1 0 45,56 H40 Z"
            strokeWidth={innerW}
          />
          <path d="M40,22 H44 M80,22 H76 M40,98 H44 M80,98 H76" strokeWidth={innerW} />
        </g>
      )}

      {/* 6A. ZOCLO / CABECERO DE HOJA (7835) */}
      {perfilId === 'cabecero' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Cuerpo hueco vertical con canal superior en U para vidrio y venas semicirculares internas */}
          <path
            d="M30,18 H38 V40 H82 V18 H90 V98 H30 Z"
            strokeWidth={outerW}
          />
          {/* Cámara interna hueca con venas de armado izquierda y derecha */}
          <path
            d="M37,46 H83 V67 H78 A4,4 0 1 0 78,75 H83 V91 H37 V75 H42 A4,4 0 1 0 42,67 H37 Z"
            strokeWidth={innerW}
          />
          {/* Dientes interiores de vinil en el canal U superior */}
          <path d="M38,24 H42 M82,24 H78" strokeWidth={innerW} />
        </g>
      )}

      {/* 6B. ZOCLO 1 VENA (7835-1V) */}
      {perfilId === 'zoclo1v' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Cuerpo alto vertical + canal superior en U para vidrio + 1 vena semicircular central */}
          <path
            d="M32,14 H40 V34 H80 V14 H88 V104 H80 V96 H40 V104 H32 Z"
            strokeWidth={outerW}
          />
          {/* Cámara superior bajo el canal vidrio */}
          <rect x="39" y="40" width="42" height="20" rx="1.2" strokeWidth={innerW} />
          {/* Puente intermedio con 1 vena semicircular interna para tornillo */}
          <circle cx="60" cy="67" r="4.2" strokeWidth={innerW} />
          <path d="M55.8,67 H40 M64.2,67 H80" strokeWidth={innerW} />
          {/* Cámara inferior */}
          <rect x="39" y="74" width="42" height="16" rx="1.2" strokeWidth={innerW} />
          <path d="M40,20 H44 M80,20 H76" strokeWidth={innerW} />
        </g>
      )}

      {/* 6C. ZOCLO 2 VENAS / ZOCLO PP PUERTA (7842, 9187) */}
      {(perfilId === 'zoclo2v' || perfilId === 'alumer_9187') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Cuerpo robusto alto + canal U superior vidrio + 2 venas semicirculares internas en 3 cámaras */}
          <path
            d="M28,12 H36 V31 H84 V12 H92 V106 H84 V99 H36 V106 H28 Z"
            strokeWidth={outerW}
          />
          {/* 3 cámaras huecas con dos venas semicirculares en las divisiones */}
          <path
            d="M35,37 H85 V50 H79 A3.8,3.8 0 1 0 79,57.6 H85 V58 H35 V57.6 H41 A3.8,3.8 0 1 0 41,50 H35 Z"
            strokeWidth={innerW}
          />
          <rect x="35" y="63" width="50" height="14" rx="1.2" strokeWidth={innerW} />
          <path
            d="M35,82 H41 A3.8,3.8 0 1 0 41,89.6 H35 V93 H85 V89.6 H79 A3.8,3.8 0 1 0 79,82 H85 Z"
            strokeWidth={innerW}
          />
          <path d="M36,18 H40 M84,18 H80" strokeWidth={innerW} />
        </g>
      )}

      {/* 6D. MARCOS CANCEL BAÑO ECONÓMICO / SEMILUJO / LUJO (11035, 11046, 11173) */}
      {(perfilId === 'alumer_11035' || perfilId === 'alumer_11046' || perfilId === 'alumer_11173') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {(() => {
            const halfW = perfilId === 'alumer_11035' ? 14 : perfilId === 'alumer_11046' ? 18 : 22;
            const xL = 60 - halfW;
            const xR = 60 + halfW;
            return (
              <>
                <path
                  d={`M${xL},18 H${xL + 6} V38 H${xR - 6} V18 H${xR} V100 H${xL} Z`}
                  strokeWidth={outerW}
                />
                <path
                  d={`M${xL + 6},44 H${xR - 6} V66 H${xR - 10} A3.4,3.4 0 1 0 ${xR - 10},72.8 H${xR - 6} V93 H${xL + 6} V72.8 H${xL + 10} A3.4,3.4 0 1 0 ${xL + 10},66 H${xL + 6} Z`}
                  strokeWidth={innerW}
                />
                <path d={`M${xL + 6},24 H${xL + 9} M${xR - 6},24 H${xR - 9}`} strokeWidth={innerW} />
              </>
            );
          })()}
        </g>
      )}

      {/* 6E. INTERMEDIO PP (9183), REMATE PP (9184), ESQUINERO (9115) */}
      {perfilId === 'alumer_9183' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          <path
            d="M32,18 H40 V35 H80 V18 H88 V102 H80 V85 H40 V102 H32 Z"
            strokeWidth={outerW}
          />
          <rect x="40" y="42" width="40" height="36" rx="1.2" strokeWidth={innerW} />
          <circle cx="46" cy="60" r="3.4" strokeWidth={innerW} />
          <circle cx="74" cy="60" r="3.4" strokeWidth={innerW} />
        </g>
      )}

      {(perfilId === 'alumer_9184' || perfilId === 'alumer_9115') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          <rect x="24" y="24" width="72" height="72" rx="3" strokeWidth={outerW} />
          {/* Cámara hueca cuadrada con venas esquineras de armado */}
          <path
            d="M32,32 H55 V37 A3.5,3.5 0 1 0 65,37 V32 H88 V55 H83 A3.5,3.5 0 1 0 83,65 H88 V88 H65 V83 A3.5,3.5 0 1 0 55,83 V88 H32 V65 H37 A3.5,3.5 0 1 0 37,55 H32 Z"
            strokeWidth={innerW}
          />
          {perfilId === 'alumer_9115' && (
            <path d="M44,44 H76 V76 H44 Z" strokeWidth={0.95} />
          )}
        </g>
      )}

      {/* 7. CHAMBRANA / JUNQUILLOS / TAPAS / ÁNGULO */}
      {(perfilId === 'chambrana' || perfilId === 'alumer_9112' || perfilId === 'alumer_6370') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Junquillo clip con cara exterior biselada, cámara hueca y patas de presión */}
          <path
            d="M28,88 V30 C28,25 32,22 38,22 H52 V56 H92 V74 H82 V88 H74 V74 H48 V88 Z"
            strokeWidth={outerW}
          />
          <rect x="35" y="30" width="11" height="36" rx="1.2" strokeWidth={innerW} />
          <path d="M52,63 H78" strokeWidth={innerW} />
        </g>
      )}

      {(perfilId === 'alumer_10237' || perfilId === 'alumer_7316' || perfilId === 'alumer_7315') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Tapa lisa o moldurada a presión con patas clip inferiores */}
          <path
            d={
              perfilId === 'alumer_10237'
                ? 'M18,52 L28,42 H92 L102,52 V58 H88 V80 H81 V58 H39 V80 H32 V58 H18 Z'
                : perfilId === 'alumer_7315'
                ? 'M20,40 H100 V68 H88 V84 H81 V68 H39 V84 H32 V68 H20 Z'
                : 'M18,50 H102 V58 H88 V76 H81 V58 H39 V76 H32 V58 H18 Z'
            }
            strokeWidth={outerW}
          />
          {perfilId === 'alumer_7315' && (
            <rect x="27" y="46" width="66" height="15" rx="1.2" strokeWidth={innerW} />
          )}
        </g>
      )}

      {perfilId === 'alumer_11032' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Ángulo batiente en L */}
          <path
            d="M28,24 H39 V81 H96 V92 H30 C28.8,92 28,91.2 28,90 Z"
            strokeWidth={outerW}
          />
          <path d="M39,76 H44 V81" strokeWidth={innerW} />
        </g>
      )}

      {/* 8. BATIENTES DE PUERTA */}
      {(perfilId === 'batiente' ||
        perfilId === 'alumer_5844' ||
        perfilId === 'alumer_5060' ||
        perfilId === 'alumer_8550' ||
        perfilId === 'alumer_12756') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Perfil batiente con cuerpo hueco, tope saliente para hoja y canal de felpa/empaque */}
          <path
            d="M16,32 H104 V46 H74 V92 H42 V62 H34 V46 H16 Z"
            strokeWidth={outerW}
          />
          {/* Cámara hueca en el cuerpo vertical + vena de rigidez */}
          <rect x="49" y="46" width="18" height="39" rx="1.2" strokeWidth={innerW} />
          {/* Cámara superior del tope y ranura T para felpa/empaque */}
          <rect x="23" y="37" width="46" height="4.5" rx="0.8" strokeWidth={innerW} />
          <path d="M36,46 V55 H42 M74,56 H69 V64 H74" strokeWidth={innerW} />
        </g>
      )}

      {/* 9. BOLSA FIJO 3" (9135, 9136, 10235, 9114) */}
      {(perfilId === 'alumer_9135' ||
        perfilId === 'alumer_9136' ||
        perfilId === 'alumer_10235' ||
        perfilId === 'alumer_9114') && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Marco bolsa 3" con canal central para cristal/junquillo y cámaras huecas posteriores */}
          <path
            d={
              perfilId === 'alumer_9136'
                ? 'M18,22 H96 V38 H68 V82 H102 V98 H18 Z'
                : 'M20,22 H96 V38 H68 V82 H96 V98 H20 Z'
            }
            strokeWidth={outerW}
          />
          {/* Dos cámaras internas en la bolsa */}
          <rect x="27" y="29" width="33" height="27" rx="1.2" strokeWidth={innerW} />
          <rect x="27" y="61" width="33" height="30" rx="1.2" strokeWidth={innerW} />
          {/* Muescas de acoplamiento para junquillo / tapa bolsa */}
          <path d="M84,38 V43 H90 M84,82 V77 H90" strokeWidth={innerW} />
        </g>
      )}

      {/* 10A. MARCO MOSQUITERO (HORIZONTAL Y VERTICAL) */}
      {perfilId === 'mosq_marco' && (
        <g
          fill="none"
          stroke={ink}
          strokeLinejoin="round"
          strokeLinecap="round"
          transform={orientacion === 'vertical' ? 'rotate(90 60 60)' : undefined}
        >
          {/* Perfil tubular esbelto con ceja perimetral y ranura superior/lateral para tela + cola de rata */}
          <path
            d="M16,42 H74 V50 H66 C63.5,50 63.5,59 66,59 H78 C80.5,59 80.5,50 78,50 H74 V42 H104 V80 H16 Z"
            strokeWidth={outerW}
          />
          {/* Cámara hueca interna para escuadra plástica */}
          <rect x="23" y="49" width="34" height="24" rx="1.5" strokeWidth={innerW} />
          {/* Cámara secundaria derecha junto al canal de cola de rata */}
          <rect x="85" y="49" width="12" height="24" rx="1.2" strokeWidth={innerW} />
          {/* Pequeño borde de asiento para la tela mosquitera */}
          <path d="M62,42 V46 M82,42 V46" strokeWidth={innerW} />
        </g>
      )}

      {/* 10B. RIEL MOSQUITERO (RM-18) */}
      {perfilId === 'riel_mosq' && (
        <g fill="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
          {/* Guía esbelta de mosquitero corredizo con pestañas de fijación y pista de deslizamiento */}
          <path
            d="M18,86 V79 H26 V42 H34 V68 H56 V36 C56,32.5 64,32.5 64,36 V68 H86 V42 H94 V79 H102 V86 Z"
            strokeWidth={outerW}
          />
          {/* Cámara hueca inferior del riel mosquitero */}
          <rect x="34" y="73" width="52" height="7" rx="1" strokeWidth={innerW} />
          <rect x="58.5" y="40" width="3" height="28" rx="1" strokeWidth={0.95} />
        </g>
      )}
    </svg>
  );
};
