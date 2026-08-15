import Modal from '../../components/Modal';

// Modal de confirmación de borrado.
export default function ModalEliminarUsuario({ usuario, formError, guardando, onConfirmar, onClose }) {
  return (
    <Modal title="Eliminar usuario" onClose={onClose} size="sm">
      <p className="text-sm text-gray-600 mb-1">
        ¿Eliminar a <strong>{usuario.nombre} {usuario.apellido}</strong>?
      </p>
      <p className="text-xs text-gray-400 mb-4">Esta acción eliminará el perfil y el acceso al sistema.</p>
      {formError && <p className="text-sm text-red-500 mb-3">{formError}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          Cancelar
        </button>
        <button onClick={onConfirmar} disabled={guardando}
          className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
          {guardando ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
      </div>
    </Modal>
  );
}
