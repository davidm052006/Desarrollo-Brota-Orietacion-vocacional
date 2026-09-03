import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { enviarContacto } from '../../services/contactoService';

const ASUNTOS = [
  'Información general',
  'Soporte técnico',
  'Consulta sobre resultados',
  'Alianzas institucionales',
  'Otro',
];

const INPUT = 'w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-[#2c3140] bg-white dark:bg-[#1a1d24] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-colors';

export default function Contacto() {
  const [searchParams] = useSearchParams();
  // Llegar con ?asunto=institucion (botón "¿Sos una institución?" del login)
  // solo pre-selecciona el asunto — la cuenta institución NO se crea acá, la
  // crea un admin desde el panel después de revisar la solicitud (ver
  // CLAUDE.md sección "Rol institucion": self-signup público está
  // deliberadamente descartado para evitar suplantación).
  const esSolicitudInstitucion = searchParams.get('asunto') === 'institucion';

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '',
    asunto: esSolicitudInstitucion ? 'Alianzas institucionales' : '',
    mensaje: '',
  });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: '' }));
    setServerError('');
  };

  const validate = () => {
    const e = {};
    if (!form.nombre.trim())  e.nombre  = 'Requerido.';
    if (!form.email.trim())   e.email   = 'Requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido.';
    if (!form.asunto)         e.asunto  = 'Selecciona un asunto.';
    if (!form.mensaje.trim()) e.mensaje = 'Requerido.';
    else if (form.mensaje.trim().length < 20) e.mensaje = 'Mínimo 20 caracteres.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const { success, error } = await enviarContacto(form);
    setLoading(false);
    if (success) setEnviado(true);
    else setServerError(error || 'Error al enviar. Intenta de nuevo.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111318]">
      
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#111318]/90 backdrop-blur-sm border-b border-gray-100 dark:border-[#2c3140]">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            ← Volver
            <img
            src="/logo-brota.png" alt="BROTA"        
            className="h-16 w-auto"
        />
        <span className="text-lg font-bold text-emerald-800 dark:text-emerald-600">BROTA</span>
          </a>
          <span className="text-gray-200 dark:text-gray-700">|</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contacto</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {enviado ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">¡Mensaje recibido!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
              Gracias por contactarnos. El equipo de BROTA revisará tu solicitud y se comunicará contigo pronto.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {esSolicitudInstitucion ? 'Solicitar acceso institucional' : 'Contáctanos'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {esSolicitudInstitucion
                  ? 'Contanos sobre tu institución y un administrador va a revisar la solicitud para crear la cuenta.'
                  : 'Escríbenos con tus preguntas o sugerencias. Un miembro del equipo te responderá directamente.'}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1a1d24] rounded-2xl border border-gray-100 dark:border-[#2c3140] p-8">

              {esSolicitudInstitucion && (
                <div className="mb-5 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-sm text-emerald-800 dark:text-emerald-300">
                  🏫 Las cuentas institución no se crean solas por seguridad — mandanos el nombre de tu institución,
                  tu cargo y un teléfono de contacto en el mensaje, y te avisamos por correo cuando esté lista.
                </div>
              )}

              {serverError && (
                <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-[#200a0a] border border-red-200 rounded-xl text-sm text-red-600 dark:text-red-400">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Nombre completo <span className="text-red-400">*</span>
                    </label>
                    <input type="text" placeholder="Tu nombre" value={form.nombre} onChange={set('nombre')} className={INPUT} />
                    {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Correo electrónico <span className="text-red-400">*</span>
                    </label>
                    <input type="email" placeholder="tu@correo.com" value={form.email} onChange={set('email')} className={INPUT} />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input type="tel" placeholder="300 000 0000" value={form.telefono} onChange={set('telefono')} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Asunto <span className="text-red-400">*</span>
                    </label>
                    <select value={form.asunto} onChange={set('asunto')} className={INPUT + ' appearance-none'}>
                      <option value="">Selecciona una opción</option>
                      {ASUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {errors.asunto && <p className="mt-1 text-xs text-red-500">{errors.asunto}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Mensaje <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder={
                      esSolicitudInstitucion
                        ? 'Nombre de la institución, tu cargo, ciudad y un teléfono de contacto...'
                        : 'Cuéntanos en qué podemos ayudarte...'
                    }
                    value={form.mensaje}
                    onChange={set('mensaje')}
                    className={INPUT + ' resize-none'}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.mensaje
                      ? <p className="text-xs text-red-500">{errors.mensaje}</p>
                      : <span />
                    }
                    <span className="text-xs text-gray-400">{form.mensaje.length}/2000</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Al enviar aceptas nuestra{' '}
                    <a href="/privacidad" className="underline hover:text-emerald-600 transition-colors">
                      Política de Privacidad
                    </a>.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {loading ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </div>

              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
