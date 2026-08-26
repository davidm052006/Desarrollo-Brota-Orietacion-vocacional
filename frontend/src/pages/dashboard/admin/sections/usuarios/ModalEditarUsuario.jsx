import Modal from '../../components/Modal';
import { Campo } from '../../components/formPrimitives';
import { ROLES_OPCIONES, NIVEL_EDUCATIVO_OPCIONES, GRADO_OPCIONES } from './constants';

// Modal de edición de un usuario existente. El estado del formulario vive en
// UsuariosSection (el padre), este componente solo lo presenta.
// La edad se sigue editando como número (no hay fecha de nacimiento guardada
// para usuarios ya existentes, mismo criterio que Perfil.jsx) — grado, teléfono
// y nivel educativo sí usan el mismo formato/valores que "Nuevo usuario".
export default function ModalEditarUsuario({ form, setForm, formError, guardando, onGuardar, onClose }) {
  return (
    <Modal title="Editar usuario" onClose={onClose} size="lg">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Nombre"          name="nombre"          form={form} setForm={setForm} />
        <Campo label="Apellido"        name="apellido"        form={form} setForm={setForm} />
        <Campo label="Ciudad"                    name="ciudad"                      form={form} setForm={setForm} />
        <Campo label="Teléfono"                  name="telefono"                    form={form} setForm={setForm} />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nivel educativo</label>
          <select
            value={form.nivel_educativo}
            onChange={e => setForm(f => ({ ...f, nivel_educativo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
          >
            <option value="">—</option>
            {NIVEL_EDUCATIVO_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Grado</label>
          <select
            value={form.grado}
            onChange={e => setForm(f => ({ ...f, grado: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
          >
            <option value="">—</option>
            {GRADO_OPCIONES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <Campo label="Cond. socioeconómicas"    name="condiciones_socioeconomicas" form={form} setForm={setForm} />
        <Campo label="Edad"                     name="edad" type="number"          form={form} setForm={setForm} />
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
          <select
            value={form.rol}
            onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
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
          className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  );
}
