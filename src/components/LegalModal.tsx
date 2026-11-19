import React from 'react';

export type LegalDocType = 'terminos' | 'privacidad' | null;

interface LegalModalProps {
  docType: LegalDocType;
  onClose: () => void;
  onSwitchDoc: (next: Exclude<LegalDocType, null>) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ docType, onClose, onSwitchDoc }) => {
  if (!docType) return null;

  const isTerms = docType === 'terminos';

  return (
    <div
      id="modal-legal"
      className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isTerms ? 'Términos y Condiciones' : 'Aviso de Privacidad'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-[1.5px] border-slate-300 rounded-[22px] p-5 sm:p-6 shadow-2xl my-auto">
        <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-200">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold mb-1">
              Aluminero Pro · Documento Legal
            </span>
            <h2 className="m-0 text-[19px] font-extrabold text-slate-900">
              {isTerms ? 'Términos y Condiciones de Uso' : 'Aviso de Privacidad'}
            </h2>
          </div>
          <button
            type="button"
            id="btn-legal-close"
            onClick={onClose}
            aria-label="Cerrar documento legal"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => onSwitchDoc('terminos')}
            className={`flex-1 min-h-[38px] px-3 rounded-xl text-[12.5px] font-extrabold border cursor-pointer transition-colors ${
              isTerms
                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            Términos y Condiciones
          </button>
          <button
            type="button"
            onClick={() => onSwitchDoc('privacidad')}
            className={`flex-1 min-h-[38px] px-3 rounded-xl text-[12.5px] font-extrabold border cursor-pointer transition-colors ${
              !isTerms
                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            Aviso de Privacidad
          </button>
        </div>

        {isTerms ? (
          <div className="space-y-3.5 text-[13px] text-slate-700 leading-relaxed">
            <p className="m-0 text-[12px] text-slate-500 font-semibold">
              Última actualización: Noviembre 2026 · Aplicación Aluminero Pro
            </p>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                1. Objeto y Naturaleza de la Herramienta
              </h3>
              <p className="m-0">
                <strong>Aluminero Pro</strong> es una herramienta digital de apoyo técnico y administrativo para talleres de cancelería de aluminio y vidrio. Permite realizar cálculos orientativos de despiece, modulación de perfiles, cotizaciones, control de inventario y notas de obra.
              </p>
            </div>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                2. Responsabilidad Técnica en Taller y Obra
              </h3>
              <p className="m-0">
                Los descuentos estándar, medidas de corte, holguras y rendimientos de tramos mostrados en la aplicación (incluyendo el módulo gratuito <em>Modulación y Cortes</em>) sirven como referencia técnica. El maestro aluminero o responsable del taller debe verificar las tolerancias específicas del fabricante de su perfil, plomos del vano y especificaciones del vidrio antes de ejecutar cortes definitivos.
              </p>
            </div>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                3. Acceso Gratuito, Prueba de 72 Horas y Licencias PRO
              </h3>
              <p className="m-0">
                La aplicación ofrece módulos gratuitos permanentes (como Ventana Nacional 3", Catálogo, Notas de Obra y Modulación y Cortes) y un periodo de prueba gratuita de 72 horas para evaluar funciones avanzadas. Concluida la prueba, la activación de funciones PRO requiere una licencia válida vinculada al ID de equipo mostrado en la app.
              </p>
            </div>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                4. Uso Comercial de Cotizaciones y Respaldo de Datos
              </h3>
              <p className="m-0">
                El usuario conserva plena titularidad sobre los presupuestos, PDFs, logotipos, fotografías e inventarios que genere en su taller. Dado que la app opera principalmente de forma local y sin conexión, es responsabilidad del usuario exportar periódicamente sus respaldos en JSON para evitar pérdidas por borrado de caché o cambio de dispositivo.
              </p>
            </div>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                5. Propiedad Intelectual y Limitación de Responsabilidad
              </h3>
              <p className="m-0">
                El diseño, lógica de cálculo, ilustraciones y código de Aluminero Pro están protegidos por la legislación aplicable. El servicio se proporciona "tal cual", sin garantías por daños indirectos derivados de errores de medición en obra o variaciones en precios de distribuidores.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-[13px] text-slate-700 leading-relaxed">
            <p className="m-0 text-[12px] text-slate-500 font-semibold">
              Última actualización: Noviembre 2026 · Aplicación Aluminero Pro
            </p>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                1. Compromiso de Privacidad (Arquitectura Local-First)
              </h3>
              <p className="m-0">
                En <strong>Aluminero Pro</strong> respetamos la privacidad de tu taller y tus clientes. La aplicación está diseñada para funcionar sin conexión y resguardar tu información operativa directamente en la memoria local de tu navegador o dispositivo (<em>localStorage</em>).
              </p>
            </div>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                2. Información que Almacena la Aplicación
              </h3>
              <p className="m-0">
                Los datos que capturas —nombre y logotipo de tu taller, tarifas, inventario de perfiles y herrajes, notas de obra, cotizaciones, fotografías comprimidas de perfiles y galería Antes y Después— se guardan exclusivamente en tu dispositivo para tu operación diaria.
              </p>
            </div>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                3. Identificador Técnico de Equipo y Licencias
              </h3>
              <p className="m-0">
                La aplicación genera un identificador técnico aleatorio (ej. <span className="mono font-bold">ALM-XXXX</span>) y guarda la fecha de inicio de tu prueba gratuita de 72 horas para validar licencias PRO y prevenir activaciones duplicadas. Este identificador no recopila contraseñas bancarias ni ubicaciones GPS.
              </p>
            </div>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                4. Uso de Cámara, Galería y Envío por WhatsApp
              </h3>
              <p className="m-0">
                El acceso a tu cámara o galería fotográfica se activa únicamente cuando tocas los botones <em>Tomar Foto</em> o <em>Elegir de Galería</em>. Las imágenes se comprimen localmente en tu equipo. Ninguna fotografía o cotización se envía a terceros salvo cuando tú decides compartirla voluntariamente mediante WhatsApp o la función de compartir de tu celular.
              </p>
            </div>

            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-slate-900 mb-1">
                5. Control y Eliminación de Datos
              </h3>
              <p className="m-0">
                Puedes editar, respaldar o eliminar en cualquier momento tus fotos, notas, inventarios y trabajos personales directamente desde las opciones de la app o limpiando los datos de almacenamiento de tu navegador.
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-sm"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
