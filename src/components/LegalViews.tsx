import React from 'react';

interface LegalViewProps {
  onBack: () => void;
}

export const TerminosCondicionesView: React.FC<LegalViewProps> = ({ onBack }) => {
  return (
    <section id="view-terminos" className="screen-animate w-full max-w-[760px] mx-auto">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          id="btn-terminos-back"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300/70 bg-white/90 text-slate-900 text-[13px] font-extrabold cursor-pointer shadow-sm transition-transform active:scale-95 shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Regresar</span>
        </button>
      </div>

      <article className="bg-white text-slate-900 border-[1.5px] border-slate-300 rounded-[22px] p-5 sm:p-7 shadow-xl">
        <div className="pb-4 mb-5 border-b border-slate-200">
          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-extrabold mb-1.5">
            Aluminero Pro · Documento Legal
          </span>
          <h1 className="m-0 text-[21px] sm:text-[23px] font-extrabold text-slate-900 leading-tight">
            Términos y Condiciones de Uso
          </h1>
          <p className="m-0 mt-1.5 text-[12px] text-slate-500 font-semibold">
            Última actualización: Noviembre 2026 · Aplicación Aluminero Pro
          </p>
        </div>

        <div className="space-y-4 text-[13.5px] text-slate-700 leading-relaxed">
          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              1. Objeto y Naturaleza de la Herramienta
            </h2>
            <p className="m-0">
              <strong>Aluminero Pro</strong> es una herramienta digital de apoyo técnico y administrativo para talleres de cancelería de aluminio y vidrio. Permite realizar cálculos orientativos de despiece, modulación de perfiles, optimización de cortes, cotizaciones, contratos de servicio, control de inventario y notas de obra.
            </p>
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              2. Responsabilidad Técnica en Taller y Obra
            </h2>
            <p className="m-0">
              Los descuentos estándar, medidas de corte, holguras, grosor de disco y rendimientos de tramos mostrados en la aplicación (incluyendo el módulo gratuito <em>Modulación y Cortes</em> y los optimizadores 1D/2D) sirven como referencia técnica. El maestro aluminero o responsable del taller debe verificar las tolerancias específicas del fabricante de su perfil, plomos del vano y especificaciones del vidrio antes de ejecutar cortes definitivos.
            </p>
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              3. Acceso Gratuito, Prueba de 72 Horas y Licencias PRO
            </h2>
            <p className="m-0">
              La aplicación ofrece módulos gratuitos permanentes (como Ventana Nacional 3", Catálogo de Perfiles, Notas de Obra y Modulación y Cortes) y un periodo de prueba gratuita de 72 horas para evaluar funciones avanzadas. Concluida la prueba, la activación de funciones PRO requiere una licencia válida vinculada al ID de equipo mostrado en la app.
            </p>
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              4. Uso Comercial de Cotizaciones, Contratos y Respaldo
            </h2>
            <p className="m-0">
              El usuario conserva plena titularidad sobre los presupuestos, contratos, PDFs, logotipos, fotografías e inventarios que genere en su taller. Dado que la app opera principalmente de forma local y sin conexión, es responsabilidad del usuario exportar periódicamente sus respaldos en JSON para evitar pérdidas por borrado de caché o cambio de dispositivo.
            </p>
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              5. Propiedad Intelectual y Limitación de Responsabilidad
            </h2>
            <p className="m-0">
              El diseño, lógica de cálculo, planos CAD y código de Aluminero Pro están protegidos por la legislación aplicable. El servicio se proporciona "tal cual", sin garantías por daños indirectos derivados de errores de medición en obra o variaciones en precios de distribuidores.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-sm"
          >
            ← Volver a la pantalla anterior
          </button>
        </div>
      </article>
    </section>
  );
};

export const AvisoPrivacidadView: React.FC<LegalViewProps> = ({ onBack }) => {
  return (
    <section id="view-privacidad" className="screen-animate w-full max-w-[760px] mx-auto">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          id="btn-privacidad-back"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-300/70 bg-white/90 text-slate-900 text-[13px] font-extrabold cursor-pointer shadow-sm transition-transform active:scale-95 shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Regresar</span>
        </button>
      </div>

      <article className="bg-white text-slate-900 border-[1.5px] border-slate-300 rounded-[22px] p-5 sm:p-7 shadow-xl">
        <div className="pb-4 mb-5 border-b border-slate-200">
          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold mb-1.5">
            Aluminero Pro · Protección de Datos
          </span>
          <h1 className="m-0 text-[21px] sm:text-[23px] font-extrabold text-slate-900 leading-tight">
            Aviso de Privacidad
          </h1>
          <p className="m-0 mt-1.5 text-[12px] text-slate-500 font-semibold">
            Última actualización: Noviembre 2026 · Aplicación Aluminero Pro
          </p>
        </div>

        <div className="space-y-4 text-[13.5px] text-slate-700 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-[13px]">
            <strong>Almacenamiento 100% Local en tu Dispositivo:</strong> Todos los datos de tu taller, presupuestos, clientes, inventarios y fotografías se guardan localmente en la memoria de tu dispositivo (<em>localStorage</em>), sin subirse automáticamente a servidores externos.
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              1. Compromiso de Privacidad (Arquitectura Local-First)
            </h2>
            <p className="m-0">
              En <strong>Aluminero Pro</strong> respetamos la privacidad de tu taller y tus clientes. La aplicación está diseñada para operar sin conexión a internet y resguardar tu información operativa directamente en tu celular, tableta o computadora.
            </p>
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              2. Datos y Fotografías del Taller Guardados Localmente
            </h2>
            <p className="m-0">
              Toda la información que capturas —nombre, ubicación, teléfono y logotipo de tu taller, tarifas, inventario de perfiles, vidrios y herrajes, notas de obra, cotizaciones, contratos, fotografías de perfiles y tu galería personal <em>Antes y Después</em>— se almacena exclusivamente en tu propio dispositivo para tu trabajo diario.
            </p>
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              3. Identificador Técnico de Equipo y Licencias
            </h2>
            <p className="m-0">
              La aplicación genera un identificador técnico aleatorio (ej. <span className="mono font-bold">ALM-XXXX</span>) y guarda la fecha de inicio de tu prueba gratuita de 72 horas para validar licencias PRO y prevenir activaciones duplicadas. Este identificador no recopila contraseñas bancarias, contactos ni ubicaciones GPS.
            </p>
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              4. Uso de Cámara, Galería y Envío Voluntario por WhatsApp
            </h2>
            <p className="m-0">
              El acceso a tu cámara o galería fotográfica se activa únicamente cuando decides tomar o seleccionar una foto dentro de la app. Las imágenes se comprimen y guardan localmente en tu equipo. Ninguna fotografía, contrato o cotización se envía a terceros salvo cuando tú eliges compartirla voluntariamente mediante WhatsApp o la función nativa de compartir de tu celular.
            </p>
          </div>

          <div>
            <h2 className="m-0 text-[15px] font-extrabold text-slate-900 mb-1">
              5. Control Total, Respaldo y Eliminación de Datos
            </h2>
            <p className="m-0">
              Tú tienes el control total sobre tu información: puedes editar, respaldar en archivo JSON o eliminar en cualquier momento tus fotos, notas, inventarios y trabajos personales directamente desde la app o borrando los datos almacenados en tu navegador.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onBack}
            className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[13.5px] cursor-pointer shadow-sm"
          >
            ← Volver a la pantalla anterior
          </button>
        </div>
      </article>
    </section>
  );
};
