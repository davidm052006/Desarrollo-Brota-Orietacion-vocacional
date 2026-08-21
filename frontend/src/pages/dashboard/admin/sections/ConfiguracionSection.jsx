import { useState, useEffect, useCallback } from 'react';
import { getSincronizacionEstado, ejecutarSincronizacion } from '../../../../services/adminService';

function fmt(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function MenSyncPanel() {
  const [estado, setEstado]       = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [verificando, setVerif]   = useState(false);
  const [sincronizando, setSinc]  = useState(false);
  const [mensaje, setMensaje]     = useState(null); // { tipo: 'ok'|'error', texto }

  const cargarEstado = useCallback(async () => {
    setCargando(true);
    const { success, data } = await getSincronizacionEstado();
    if (success) setEstado(data);
    setCargando(false);
  }, []);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  const verificar = async () => {
    setVerif(true);
    setMensaje(null);
    const { success, data } = await getSincronizacionEstado();
    if (success) {
      setEstado(data);
      setMensaje(
        data.hayActualizacion
          ? { tipo: 'info', texto: 'Hay datos nuevos disponibles en la API del MEN.' }
          : { tipo: 'ok',  texto: 'Los datos ya están al día. No se requiere sincronizar.' }
      );
    } else {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con la API del MEN.' });
    }
    setVerif(false);
  };

  const sincronizar = async () => {
    if (!confirm('Esta operación reemplaza todos los programas e instituciones en la base de datos. ¿Continuar?')) return;
    setSinc(true);
    setMensaje(null);
    const { success, data, error } = await ejecutarSincronizacion();
    if (success) {
      setMensaje({
        tipo: 'ok',
        texto: `Sincronización exitosa: ${data.programasImportados.toLocaleString('es-CO')} programas y ${data.institucionesImportadas.toLocaleString('es-CO')} instituciones importadas en ${data.duracionSegundos}s.`,
      });
      cargarEstado();
    } else {
      setMensaje({ tipo: 'error', texto: error ?? 'Error al sincronizar.' });
    }
    setSinc(false);
  };

  const msgCls = {
    ok:    'bg-primary-soft dark:bg-[#0a2018] border-primary/25 dark:border-[#1a4030] text-primary ',
    info:  'bg-blue-50 dark:bg-[#0d1a30] border-blue-200 dark:border-[#1a3060] text-blue-700 dark:text-blue-400',
    error: 'bg-red-50 dark:bg-[#200a0a] border-red-200 dark:border-[#401a1a] text-red-700 dark:text-red-400',
  };

  return (
    <div className="border border-gray-100 dark:border-[#1e2a21] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Base de datos de programas (MEN)</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Fuente: Sistema Nacional de Información de la Educación Superior (SNIES) vía datos.gov.co
          </p>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          cargando ? 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500'
          : estado?.hayActualizacion
            ? 'bg-amber-100 text-amber-700 dark:bg-[#2a1800] dark:text-amber-400'
            : 'bg-primary-soft text-primary dark:bg-[#0a2018] '
        }`}>
          {cargando ? 'Verificando...' : estado?.hayActualizacion ? 'Actualización disponible' : 'Al día'}
        </span>
      </div>

      {/* Estadísticas actuales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-[#0d110e] rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Programas</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white mt-0.5">
            {cargando ? '—' : (estado?.programasImportados ?? 0).toLocaleString('es-CO')}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#0d110e] rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Instituciones</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white mt-0.5">
            {cargando ? '—' : (estado?.institucionesImportadas ?? 0).toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Fechas */}
      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Última sincronización:</span>
          <span className="text-gray-600 dark:text-gray-300 font-medium">{fmt(estado?.ultimaSincronizacion)}</span>
        </div>
        <div className="flex justify-between">
          <span>Datos MEN disponibles al:</span>
          <span className="text-gray-600 dark:text-gray-300 font-medium">{fmt(estado?.remoteDate)}</span>
        </div>
      </div>

      {/* Mensaje de resultado */}
      {mensaje && (
        <div className={`text-xs px-3 py-2.5 rounded-xl border ${msgCls[mensaje.tipo]}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={verificar}
          disabled={verificando || sincronizando}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-[#1e2a21] text-gray-600 dark:text-gray-300 bg-white dark:bg-[#141a16] hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-50"
        >
          {verificando ? (
            <><span className="animate-spin inline-block w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full" /> Verificando...</>
          ) : 'Verificar actualizaciones'}
        </button>
        <button
          onClick={sincronizar}
          disabled={sincronizando || verificando}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50"
        >
          {sincronizando ? (
            <><span className="animate-spin inline-block w-3.5 h-3.5 border border-white/60 border-t-white rounded-full" /> Sincronizando...</>
          ) : 'Sincronizar ahora'}
        </button>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        La sincronización reemplaza todos los programas e instituciones con los datos actuales del MEN.
        Los programas activos del cuestionario vocacional no se ven afectados.
      </p>
    </div>
  );
}

export default function ConfiguracionSection() {
  return (
    <div className="flex flex-col gap-5 max-w-xl">

      <div className="bg-white dark:bg-[#141a16] rounded-2xl border border-gray-100 dark:border-[#1e2a21] p-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Configuración general</h2>
        <p className="text-xs text-gray-400 mb-5">Ajustes globales del sistema Brota.</p>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">Modo mantenimiento</p>
              <p className="text-xs text-gray-400">Bloquea el acceso a usuarios durante actualizaciones</p>
            </div>
            <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full relative cursor-pointer flex-shrink-0">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-[#1e2a21]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">Permitir nuevos registros</p>
              <p className="text-xs text-gray-400">Habilita el formulario de registro público</p>
            </div>
            <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer flex-shrink-0">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-[#1e2a21]" />
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">Preguntas por test</p>
            <input
              type="number"
              defaultValue={20}
              className="w-28 px-3 py-1.5 border border-gray-200 dark:border-[#1e2a21] rounded-lg text-sm bg-white dark:bg-[#0d110e] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <button className="mt-5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-5 py-2 rounded-xl transition">
          Guardar cambios
        </button>
      </div>

      <div className="bg-white dark:bg-[#141a16] rounded-2xl border border-gray-100 dark:border-[#1e2a21] p-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Datos educativos</h2>
        <p className="text-xs text-gray-400 mb-4">Sincroniza los programas e instituciones con la API oficial del MEN.</p>
        <MenSyncPanel />
      </div>

    </div>
  );
}
