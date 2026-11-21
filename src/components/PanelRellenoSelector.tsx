import React from 'react';
import {
  getDefaultRellenoFromVidrio,
  getRellenoItem,
  getRellenoLabel,
  getRellenoPrecioM2,
  PANEL_RELLENO_CATALOGO,
  PanelRellenoItem,
  PanelRellenoSelection,
  RELLENO_CATEGORIAS_META,
  RellenoCategoriaId,
  VidrioId,
} from '../utils/alumineroLogic';
import { formatMXN } from '../utils/storageHelpers';

interface Props {
  value?: PanelRellenoSelection;
  vidrioFallback: VidrioId;
  customPrices?: Record<string, number>;
  onChange: (next: PanelRellenoSelection, compatVidrio: VidrioId) => void;
  onUpdatePriceM2: (materialId: string, espesorMm: number, price: number) => void;
}

export const PanelRellenoSelector: React.FC<Props> = ({
  value,
  vidrioFallback,
  customPrices,
  onChange,
  onUpdatePriceM2,
}) => {
  const currentSel: PanelRellenoSelection =
    value || getDefaultRellenoFromVidrio(vidrioFallback);
  const activeItem = getRellenoItem(currentSel.materialId, vidrioFallback);
  const activeCat: RellenoCategoriaId = currentSel.categoria || activeItem.categoria;
  const activeEspesor = activeItem.espesoresMm.includes(currentSel.espesorMm)
    ? currentSel.espesorMm
    : activeItem.defaultEspesorMm;

  const itemsInCategory = PANEL_RELLENO_CATALOGO.filter(
    (item) => item.categoria === activeCat
  );

  const precioM2Actual = getRellenoPrecioM2(
    {
      categoria: activeCat,
      materialId: activeItem.id,
      espesorMm: activeEspesor,
    },
    customPrices,
    vidrioFallback
  );
  const extraVsClaro6 = Math.round(precioM2Actual - 440);

  const handleSelectCategoria = (catId: RellenoCategoriaId) => {
    const first = PANEL_RELLENO_CATALOGO.find((i) => i.categoria === catId);
    if (!first) return;
    onChange(
      {
        categoria: catId,
        materialId: first.id,
        espesorMm: first.defaultEspesorMm,
      },
      first.vidrioCompatId
    );
  };

  const handleSelectMaterial = (item: PanelRellenoItem) => {
    const nextEsp = item.espesoresMm.includes(activeEspesor)
      ? activeEspesor
      : item.defaultEspesorMm;
    onChange(
      {
        categoria: item.categoria,
        materialId: item.id,
        espesorMm: nextEsp,
      },
      item.vidrioCompatId
    );
  };

  const handleSelectEspesor = (esp: number) => {
    onChange(
      {
        categoria: activeCat,
        materialId: activeItem.id,
        espesorMm: esp,
      },
      activeItem.vidrioCompatId
    );
  };

  return (
    <div id="panel-relleno-selector" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <span className="block text-[14px] font-extrabold">
            Panel de Relleno (Cristal, Espejo, Baño o Duela)
          </span>
          <span className="block text-[11.5px] text-slate-500">
            Seleccionado:{' '}
            <strong className="text-blue-700">
              {getRellenoLabel(
                {
                  categoria: activeCat,
                  materialId: activeItem.id,
                  espesorMm: activeEspesor,
                },
                vidrioFallback
              )}
            </strong>
          </span>
        </div>
        <span className="mono text-[12px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
          {extraVsClaro6 === 0
            ? 'Base ($440/m²)'
            : extraVsClaro6 > 0
              ? `+$${extraVsClaro6}/m²`
              : `-$${Math.abs(extraVsClaro6)}/m²`}
        </span>
      </div>

      {/* 5 Categorías */}
      <div
        role="tablist"
        aria-label="Categorías de panel de relleno"
        className="flex flex-wrap gap-1.5"
      >
        {RELLENO_CATEGORIAS_META.map((cat) => {
          const isActive = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectCategoria(cat.id)}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-[12px] font-extrabold cursor-pointer transition-all active:scale-95 ${
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.corto}
            </button>
          );
        })}
      </div>

      {/* Cuadrícula compacta de 2 columnas (igual que Acabado de Perfil) */}
      <div className="grid grid-cols-2 gap-2.5">
        {itemsInCategory.map((item) => {
          const isSelected = activeItem.id === item.id;
          const itemPrecio = getRellenoPrecioM2(
            {
              categoria: item.categoria,
              materialId: item.id,
              espesorMm: isSelected ? activeEspesor : item.defaultEspesorMm,
            },
            customPrices,
            vidrioFallback
          );
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectMaterial(item)}
              className={`flex items-center gap-2 min-h-[48px] px-2.5 py-2 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <span
                className="w-6 h-6 rounded-full border border-slate-300 shadow-inner shrink-0"
                style={{ background: item.swatch }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`block text-[12.5px] font-bold leading-tight truncate ${
                    isSelected ? 'text-blue-700' : 'text-slate-900'
                  }`}
                >
                  {item.nombre}
                </span>
                <span className="block text-[11px] text-slate-500 mono mt-0.5">
                  {formatMXN(itemPrecio)}/m²
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Espesores (mm) + Precio editable $/m² */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="flex-1">
          <span className="block text-[11.5px] font-extrabold text-slate-600 mb-1.5">
            Espesor disponible (mm)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activeItem.espesoresMm.map((esp) => {
              const selected = activeEspesor === esp;
              return (
                <button
                  key={esp}
                  type="button"
                  onClick={() => handleSelectEspesor(esp)}
                  className={`min-h-[40px] min-w-[54px] px-3 py-1.5 rounded-xl border mono text-[12.5px] font-extrabold cursor-pointer transition-colors ${
                    selected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {esp} mm
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full sm:w-[170px]">
          <label
            htmlFor="inp-relleno-precio-m2"
            className="block text-[11.5px] font-extrabold text-slate-600 mb-1"
          >
            Costo taller ($/m²)
          </label>
          <input
            id="inp-relleno-precio-m2"
            type="number"
            min={0}
            step={10}
            value={precioM2Actual}
            onChange={(e) => {
              const nextVal = Math.max(0, Number(e.target.value) || 0);
              onUpdatePriceM2(activeItem.id, activeEspesor, nextVal);
            }}
            className="w-full min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 mono text-[13.5px] font-extrabold text-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
