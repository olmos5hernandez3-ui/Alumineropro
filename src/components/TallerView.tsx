import React, { useRef } from 'react';
import { Download, FileDown, Upload } from 'lucide-react';
import { COLORES_CONFIG, LINEAS_CONFIG, LineaId } from '../utils/alumineroLogic';
import { generarPdfHistorialCotizaciones } from '../utils/pdfExport';
import {
  AlumineroBackupPayload,
  formatMXN,
  FormulaPersonalizada,
  HistorialItem,
  parseBackupPayload,
  TallerConfig,
} from '../utils/storageHelpers';
import { PdfHeaderCustomizer } from './PdfHeaderCustomizer';

interface Props {
  taller: TallerConfig;
  proActive: boolean;
  formulas: FormulaPersonalizada[];
  historial: HistorialItem[];
  backupData?: AlumineroBackupPayload;
  onImportBackup?: (payload: AlumineroBackupPayload) => void;
  onUpdateTaller: (patch: Partial<TallerConfig>) => void;
  onRestablecerTarifas: () => void;
  onOpenPro: () => void;
  onEntrarInventario: () => void;
  onOpenFormulaModal: () => void;
  onEliminarFormula: (id: string) => void;
  onEliminarHistorial: (id: string) => void;
  onLimpiarHistorial: () => void;
  onScheduleHistorialReminder?: (item: HistorialItem) => void;
  onOpenReminders?: () => void;
  pendingRemindersCount?: number;
  onShowToast: (msg: string, topSuccess?: boolean) => void;
}

export const TallerView: React.FC<Props> = ({
  taller,
  proActive,
  formulas,
  historial,
  backupData,
  onImportBackup,
  onUpdateTaller,
  onRestablecerTarifas,
  onOpenPro,
  onEntrarInventario,
  onOpenFormulaModal,
  onEliminarFormula,
  onEliminarHistorial,
  onLimpiarHistorial,
  onScheduleHistorialReminder,
  onOpenReminders,
  pendingRemindersCount = 0,
  onShowToast,
}) => {
  const importBackupRef = useRef<HTMLInputElement | null>(null);

  const handleExportTallerJson = () => {
    if (!backupData) return;
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aluminero-respaldo-taller-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    onShowToast('Respaldo JSON del taller exportado', true);
  };

  const handleImportTallerJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onImportBackup) return;
    try {
      const text = await file.text();
      const parsed = parseBackupPayload(text);
      if (!parsed) {
        onShowToast('Archivo de respaldo JSON inválido.');
        return;
      }
      onImportBackup(parsed);
      onShowToast('Respaldo JSON restaurado correctamente', true);
    } catch {
      onShowToast('No se pudo leer el archivo JSON.');
    }
  };

  return (
    <section id="view-taller" className="screen-animate pb-28 sm:pb-14">
      <div className="mb-4">
        <h1 className="m-0 text-[21px] font-extrabold text-white">Mi Taller y Precios</h1>
        <p className="m-0 text-[12.5px] text-slate-300">
          Personaliza el encabezado de tus PDF exportados, logotipo, contacto y tarifas base por m²
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
        <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
          <div className="mb-3.5">
            <h2 className="m-0 text-[17px] font-extrabold">
              Encabezado PDF y Datos de mi Taller{' '}
              {!proActive && <span className="text-amber-700 text-[12px]">🔒 PRO</span>}
            </h2>
            <p className="m-0 text-[12px] text-slate-500">
              Se aplica en cotizaciones para cliente, órdenes técnicas de taller y contratos PDF
            </p>
          </div>

          <PdfHeaderCustomizer
            taller={taller}
            onUpdateTaller={onUpdateTaller}
            onShowToast={onShowToast}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <h2 className="m-0 text-[17px] font-extrabold">Descuento del Distribuidor y Costos</h2>
            <p className="m-0 text-[12px] text-slate-500">
              Calcula el costo real de material y tu ganancia aproximada
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label htmlFor="inp-desc-dist" className="block text-[12px] font-bold text-slate-500 mb-1">
                  % Descuento Distribuidor
                </label>
                <input
                  id="inp-desc-dist"
                  type="number"
                  min={0}
                  max={80}
                  value={taller.descDistribuidorPct}
                  onChange={(e) =>
                    onUpdateTaller({ descDistribuidorPct: Math.max(0, Math.min(80, Number(e.target.value) || 0)) })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[14px] font-semibold"
                />
              </div>
              <div>
                <label htmlFor="inp-precio-tramo" className="block text-[12px] font-bold text-slate-500 mb-1">
                  Precio lista tramo 6.10 m ($ MXN)
                </label>
                <input
                  id="inp-precio-tramo"
                  type="number"
                  min={100}
                  step={50}
                  value={taller.precioListaTramo}
                  onChange={(e) =>
                    onUpdateTaller({ precioListaTramo: Math.max(100, Number(e.target.value) || 100) })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 mono text-[14px] font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="m-0 text-[17px] font-extrabold">Tarifas Base por m² ($ MXN)</h2>
                <p className="m-0 text-[12px] text-slate-500">Se aplican automáticamente al elegir cada línea</p>
              </div>
              <button
                type="button"
                onClick={onRestablecerTarifas}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-blue-600 text-[12px] font-bold cursor-pointer"
              >
                Restablecer
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {Object.values(LINEAS_CONFIG).map((l) => {
                const locked = l.pro && !proActive;
                const val = taller.tarifasBase[l.id] ?? l.tarifaBaseDefault;
                return (
                  <div key={l.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block text-[13px]">
                        {l.nombre} {locked && <span className="text-amber-700 text-[11px]">🔒 PRO</span>}
                      </strong>
                      <span className="text-[11.5px] text-slate-500">{l.desc}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={val}
                      readOnly={locked}
                      onFocus={(e) => {
                        if (locked) {
                          e.target.blur();
                          onOpenPro();
                        }
                      }}
                      onChange={(e) =>
                        onUpdateTaller({
                          tarifasBase: {
                            ...taller.tarifasBase,
                            [l.id as LineaId]: Math.max(0, Number(e.target.value) || 0),
                          },
                        })
                      }
                      className="w-[120px] min-h-[40px] rounded-xl border border-slate-200 px-2.5 text-right mono text-[14px] font-bold"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl">
            <h2 className="m-0 text-[17px] font-extrabold">
              Mi Inventario de Taller {!proActive && <span className="text-amber-700 text-[12px]">🔒 PRO</span>}
            </h2>
            <p className="m-0 text-[12px] text-slate-500 mb-3">
              Registra tus tramos de 6.10 m en bodega para saber qué pedir
            </p>
            <button
              type="button"
              onClick={onEntrarInventario}
              className="w-full min-h-[46px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13.5px] cursor-pointer"
            >
              Abrir Mi Inventario de Taller
            </button>
          </div>

          {backupData && onImportBackup && (
            <div
              id="card-taller-backup-json"
              className="bg-white text-[#1E293B] border-[1.5px] border-emerald-300 rounded-[18px] p-4 sm:p-5 shadow-xl"
            >
              <h2 className="m-0 text-[17px] font-extrabold">Respaldo Local de Datos (JSON)</h2>
              <p className="m-0 text-[12px] text-slate-500 mt-0.5 mb-3">
                Exporta o restaura tus datos de Mi Taller, tarifas, clientes, inventario e historial en un archivo JSON.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-taller-export-json"
                  onClick={handleExportTallerJson}
                  className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Exportar respaldo JSON</span>
                </button>
                <button
                  type="button"
                  id="btn-taller-import-json"
                  onClick={() => importBackupRef.current?.click()}
                  className="min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-[13px] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Importar respaldo JSON</span>
                </button>
                <input
                  ref={importBackupRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImportTallerJson}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mis Fórmulas de Despiece */}
      <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mt-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[17px] font-extrabold">Mis Fórmulas de Despiece</h2>
            <p className="m-0 text-[12px] text-slate-500">
              Guarda tus propios descuentos de corte por marca o sistema
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFormulaModal}
            className="min-h-[36px] px-3 rounded-lg bg-blue-600 text-white text-[12px] font-bold cursor-pointer"
          >
            + Nueva Fórmula
          </button>
        </div>

        {formulas.length === 0 ? (
          <p className="text-[12.5px] text-slate-500 p-3.5 text-center border border-dashed border-slate-200 rounded-xl">
            Aún no guardas fórmulas personalizadas. Modifica los descuentos en Ventanas o Puertas o usa{' '}
            <strong>+ Nueva Fórmula</strong>.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {formulas.map((f) => (
              <div key={f.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                <div>
                  <strong className="block text-[13.5px]">{f.nombre}</strong>
                  <span className="text-[11.5px] text-slate-500 mono">
                    {LINEAS_CONFIG[f.linea]?.nombre} · MH:-{f.tolerancias.marcoH} HV:-{f.tolerancias.hojaV} HH:-{f.tolerancias.hojaH}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onEliminarFormula(f.id)}
                  className="px-2.5 py-1 rounded-lg border border-red-200 bg-white text-red-600 text-[12px] font-bold cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="bg-white text-[#1E293B] border-[1.5px] border-slate-300 rounded-[18px] p-4 sm:p-5 shadow-xl mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="m-0 text-[17px] font-extrabold">Historial de Cotizaciones Guardadas</h2>
            <p className="m-0 text-[12px] text-slate-500">Guardado en este equipo ({historial.length})</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-exportar-historial-pdf"
              disabled={historial.length === 0}
              onClick={() => {
                void generarPdfHistorialCotizaciones(historial, taller).then((ok) => {
                  if (ok) {
                    onShowToast('Historial de cotizaciones exportado a PDF', true);
                  } else {
                    onShowToast('Aún no tienes cotizaciones guardadas para exportar');
                  }
                });
              }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors ${
                historial.length === 0
                  ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
              Exportar PDF
            </button>
            {onOpenReminders && (
              <button
                type="button"
                id="btn-taller-open-reminders"
                onClick={onOpenReminders}
                className="px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-[12px] font-extrabold text-blue-800 cursor-pointer"
              >
                🔔 Seguimientos{pendingRemindersCount > 0 ? ` (${pendingRemindersCount})` : ''}
              </button>
            )}
            {historial.length > 0 && (
              <button
                type="button"
                onClick={onLimpiarHistorial}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 cursor-pointer"
              >
                Limpiar todo
              </button>
            )}
          </div>
        </div>
        {historial.length === 0 ? (
          <p className="text-[12.5px] text-slate-500 p-4 text-center border border-dashed border-slate-200 rounded-xl">
            Aún no tienes cotizaciones guardadas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((h) => (
              <div key={h.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <strong className="block text-[13.5px] truncate">{h.referencia}</strong>
                  <span className="text-[12px] text-slate-500">
                    {LINEAS_CONFIG[h.linea]?.nombre} · {h.anchoCm}×{h.altoCm} cm · {COLORES_CONFIG[h.color]?.corto} · {h.fecha}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <strong className="mono text-blue-600">{formatMXN(h.total)}</strong>
                  {onScheduleHistorialReminder && (
                    <button
                      type="button"
                      onClick={() => onScheduleHistorialReminder(h)}
                      className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11.5px] font-bold cursor-pointer"
                      title="Programar recordatorio de seguimiento en 24 h"
                    >
                      🔔 Recordar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onEliminarHistorial(h.id)}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-red-600 text-[12px] font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
