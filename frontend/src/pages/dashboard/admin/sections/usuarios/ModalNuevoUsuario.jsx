import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { Campo } from '../../components/formPrimitives';
import * as adminService from '../../../../../services/adminService';
import { ROLES_OPCIONES, NIVEL_EDUCATIVO_OPCIONES, GRADO_OPCIONES } from './constants';

// Buscador con debounce contra GET /api/admin/instituciones — el catálogo
// puede tener miles de filas (sync MEN), así que un <select> con todo no
// escala. Mismo patrón de debounce que UsuariosSection.jsx (busquedaDebounce).
function InstitucionPicker({ institucionId, institucionNombre, onSeleccionar }) {
  const [busqueda, setBusqueda] = useState(institucionNombre || '');
  const [resultados, setResultados] = useState([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!busqueda || busqueda === institucionNombre) { setResultados([]); return; }
    const t = setTimeout(async () => {
      const { success, data } = await adminService.getInstituciones({ busqueda, limite: 8 });
      if (success) setResultados(data || []);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  return (
    <div style={{ position: 'relative', gridColumn: '1 / -1' }}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        Institución del catálogo<span className="text-red-500 ml-0.5">*</span>
      </label>
      <input
        type="text"
        value={busqueda}
        onChange={e => { setBusqueda(e.target.value); setAbierto(true); onSeleccionar('', ''); }}
        onFocus={() => setAbierto(true)}
        placeholder="Buscar por nombre o ciudad..."
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {institucionId && <p className="text-xs text-primary font-semibold mt-1">✓ {institucionNombre}</p>}
      {abierto && resultados.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-y-auto">
          {resultados.map(inst => (
            <button
              key={inst.id}
              type="button"
              onClick={() => {
                onSeleccionar(inst.id, inst.nombre);
                setBusqueda(inst.nombre);
                setAbierto(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              {inst.nombre} <span className="text-gray-400">— {inst.ciudad || 'sin ciudad'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Modal de alta de un usuario nuevo (requiere email + password porque también
// crea la cuenta de acceso, a diferencia de "Editar"). Mismos campos y formato
// que el registro público (SignupCard.jsx): fecha de nacimiento en vez de edad
// suelta, nivel educativo/grado como listas cerradas, teléfono. Si el rol
// elegido es "institucion", los campos de estudiante (nivel educativo, grado,
// fecha de nacimiento) no aplican y se reemplazan por el buscador de institución.
export default function ModalNuevoUsuario({ form, setForm, formError, guardando, onCrear, onClose }) {
  const esInstitucion = form.rol === 'institucion';

  return (
    <Modal title="Nuevo usuario" onClose={onClose} size="lg">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Email"    name="email"    type="email"    form={form} setForm={setForm} required />
        <Campo label="Contraseña" name="password" type="password" form={form} setForm={setForm} required />
        <Campo
          label={esInstitucion ? 'Nombre de contacto' : 'Nombre'}
          name="nombre" form={form} setForm={setForm} required
        />
        <Campo
          label={esInstitucion ? 'Apellido de contacto' : 'Apellido'}
          name="apellido" form={form} setForm={setForm} required
        />
        <Campo label="Ciudad"                 name="ciudad"                      form={form} setForm={setForm} />
        <Campo label="Teléfono"               name="telefono"                    form={form} setForm={setForm} />

        {!esInstitucion && (
          <>
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
            <Campo label="Fecha de nacimiento"   name="fecha_nacimiento" type="date" form={form} setForm={setForm} />
            <Campo label="Cond. socioeconómicas" name="condiciones_socioeconomicas" form={form} setForm={setForm} />
          </>
        )}

        {esInstitucion && (
          <InstitucionPicker
            institucionId={form.institucion_id}
            institucionNombre={form.institucion_nombre}
            onSeleccionar={(id, nombre) => setForm(f => ({ ...f, institucion_id: id, institucion_nombre: nombre }))}
          />
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
          <select
            value={form.rol}
            onChange={e => setForm(f => ({ ...f, rol: e.target.value, institucion_id: '', institucion_nombre: '' }))}
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
        <button onClick={onCrear} disabled={guardando}
          className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50">
          {guardando ? 'Creando...' : 'Crear usuario'}
        </button>
      </div>
    </Modal>
  );
}
