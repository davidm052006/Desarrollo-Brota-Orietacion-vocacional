import { useState } from 'react';
import Modal from '../../components/Modal';
import { Detalle } from '../../components/formPrimitives';
import { formatFecha } from '../../components/formatFecha';
import { DURACIONES_BLOQUEO } from './constants';

// true si bloqueado_hasta existe y todavía no pasó
function estaBloqueadoActualmente(usuario) {
  return !!usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date();
}

// Modal de permisos: muestra el estado de bloqueo actual del usuario y permite
// bloquearlo por una duración predefinida (o una fecha puntual) / desbloquearlo.
// Copiado de la estructura de ModalVerUsuario.jsx (mismos Detalle de solo lectura
// arriba), pero agrega los controles para bloquear/desbloquear vía PATCH
// /usuarios/:id/bloqueo (ver adminService.bloquearUsuario). Ese endpoint recibe
// { horas } relativas desde ahora (o { hasta: null } para desbloquear), así que
// la fecha puntual elegida acá se convierte a horas antes de mandarla.
export default function ModalPermisosUsuario({ usuario, formError, guardando, onGuardar, onClose }) {
  const [duracion, setDuracion]           = useState('7');
  const [fechaPersonalizada, setFechaPersonalizada] = useState('');

  const bloqueado = estaBloqueadoActualmente(usuario);

  const calcularHoras = () => {
    if (duracion === 'custom') {
      if (!fechaPersonalizada) return null;
      const horas = (new Date(fechaPersonalizada).getTime() - Date.now()) / (1000 * 60 * 60);
      return horas > 0 ? horas : null;
    }
    const dias = parseInt(duracion, 10);
    return dias * 24;
  };

  const handleBloquear = () => {
    const horas = calcularHoras();
    if (!horas) return; // fecha personalizada vacía o en el pasado: no hace nada
    onGuardar({ horas });
  };

  const handleDesbloquear = () => onGuardar({ hasta: null });

  return (
    <Modal title="Permisos del usuario" onClose={onClose}>
      <div className="space-y-1 mb-4">
        <Detalle label="Usuario" value={`${usuario.nombre} ${usuario.apellido}`} />
        <Detalle
          label="Estado actual"
          value={
            bloqueado ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                Bloqueado hasta {formatFecha(usuario.bloqueado_hasta)}
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                Sin bloqueo
              </span>
            )
          }
        />
      </div>

      {bloqueado && (
        <button
          onClick={handleDesbloquear}
          disabled={guardando}
          className="w-full mb-4 px-4 py-2 text-sm font-semibold border border-green-200 text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {guardando ? 'Desbloqueando...' : 'Desbloquear ahora'}
        </button>
      )}

      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {bloqueado ? 'Extender o reemplazar bloqueo' : 'Bloquear usuario por'}
        </label>
        <select
          value={duracion}
          onChange={e => setDuracion(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white mb-2"
        >
          {DURACIONES_BLOQUEO.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        {duracion === 'custom' && (
          <input
            type="date"
            value={fechaPersonalizada}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setFechaPersonalizada(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mb-2"
          />
        )}
      </div>

      {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleBloquear}
          disabled={guardando || (duracion === 'custom' && !fechaPersonalizada)}
          className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Bloquear'}
        </button>
      </div>
    </Modal>
  );
}