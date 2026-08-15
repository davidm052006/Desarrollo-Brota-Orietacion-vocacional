import Modal from '../../components/Modal';
import { Campo } from '../../components/formPrimitives';
import { ROLES_OPCIONES } from './constants';

// Modal de edición de un usuario existente. El estado del formulario vive en
// UsuariosSection (el padre), este componente solo lo presenta.
export default function ModalEditarUsuario({ form, setForm, formError, guardando, onGuardar, onClose }) {
  return (
    <Modal title="Editar usuario" onClose={onClose} size="lg">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nombre"          name="nombre"          form={form} setForm={setForm} />
        <Campo label="Apellido"        name="apellido"        form={form} setForm={setForm} />
        <Campo label="Ciudad"                    name="ciudad"                      form={form} setForm={setForm} />
        <Campo label="Nivel educativo"          name="nivel_educativo"             form={form} setForm={setForm} />
        <Campo label="Cond. socioeconómicas"    name="condiciones_socioeconomicas" form={form} setForm={setForm} />
        <Campo label="Edad"                     name="edad" type="number"          form={form} setForm={setForm} />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
          <select
            value={form.rol}
            onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
          >
            {ROLES_OPCIONES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          Cancelar
        </button>
        <button onClick={onGuardar} disabled={guardando}
          className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  );
}
