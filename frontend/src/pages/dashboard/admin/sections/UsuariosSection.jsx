import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import * as adminService from '../../../../services/adminService';
import Modal from '../components/Modal';

const ROLES_FILTRO   = ['Todos los roles', 'admin', 'estudiante', 'orientador'];
const ROLES_OPCIONES = ['estudiante', 'orientador', 'admin'];

const ROL_COLORS = {
  admin:      'bg-purple-100 text-purple-700',
  orientador: 'bg-orange-100 text-orange-700',
  estudiante: 'bg-blue-100 text-blue-700',
};

const FORM_VACIO = {
  nombre: '', apellido: '', ciudad: '', nivel_educativo: '',
  condiciones_socioeconomicas: '', edad: '', rol: 'estudiante',
};

const FORM_NUEVO_VACIO = {
  ...FORM_VACIO,
  email: '', password: '',
};

// Columnas que debe traer el CSV de carga masiva (mismos nombres que espera createUsuario)
const COLUMNAS_CSV_ESPERADAS = [
  'email', 'password', 'nombre', 'apellido', 'ciudad',
  'nivel_educativo', 'condiciones_socioeconomicas', 'edad', 'rol',
];

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO');
}

// Campo de texto reutilizable para formularios
function Campo({ label, name, type = 'text', form, setForm, required = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      />
    </div>
  );
}

// Fila de solo lectura para el modal "Ver"
function Detalle({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 gap-4">
      <span className="text-xs font-semibold text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value || '—'}</span>
    </div>
  );
}

export default function UsuariosSection() {
  // ─── Estado de datos ──────────────────────────────────────────────────────
  const [usuarios, setUsuarios]   = useState([]);
  const [meta, setMeta]           = useState({ total: 0, pagina: 1, totalPaginas: 1 });
  const [loading, setLoading]     = useState(true);

  // ─── Filtros y paginación (server-side) ───────────────────────────────────
  const [pagina, setPagina]           = useState(1);
  const [busqueda, setBusqueda]       = useState('');
  const [busquedaDebounce, setBusquedaDebounce] = useState('');
  const [rolFiltro, setRolFiltro]     = useState('');

  // ─── Control de modales ───────────────────────────────────────────────────
  const [modalVer,      setModalVer]      = useState(null);
  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalNuevo,    setModalNuevo]    = useState(false);
  const [modalMasivo,   setModalMasivo]   = useState(false);

  // ─── Estado de formularios ────────────────────────────────────────────────
  const [formEditar, setFormEditar] = useState(FORM_VACIO);
  const [formNuevo,  setFormNuevo]  = useState(FORM_NUEVO_VACIO);
  const [guardando,  setGuardando]  = useState(false);
  const [formError,  setFormError]  = useState(null);

  // ─── Estado de carga masiva (CSV) ─────────────────────────────────────────
  const [csvNombreArchivo, setCsvNombreArchivo]     = useState('');
  const [csvFilas, setCsvFilas]                     = useState([]);
  const [importando, setImportando]                 = useState(false);
  const [reporteImportacion, setReporteImportacion] = useState(null);

  // Debounce: espera 350ms después del último keystroke antes de buscar
  useEffect(() => {
    const t = setTimeout(() => { setBusquedaDebounce(busqueda); setPagina(1); }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // ─── READ ─────────────────────────────────────────────────────────────────
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    const { success, data, meta: metaResp } = await adminService.getUsuarios({
      pagina,
      busqueda: busquedaDebounce,
      rol: rolFiltro,
    });

    if (success) {
      setUsuarios(data);
      setMeta(metaResp);
    }
    setLoading(false);
  }, [pagina, busquedaDebounce, rolFiltro]);

useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]); // eslint-disable-line react-hooks/set-state-in-effect

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  const abrirEditar = (usuario) => {
    setFormEditar({
      nombre:                      usuario.nombre                      || '',
      apellido:                    usuario.apellido                    || '',
      ciudad:                      usuario.ciudad                      || '',
      nivel_educativo:             usuario.nivel_educativo             || '',
      condiciones_socioeconomicas: usuario.condiciones_socioeconomicas || '',
      edad:                        usuario.edad                        || '',
      rol:                         usuario.rol                         || 'estudiante',
    });
    setFormError(null);
    setModalEditar(usuario);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    setFormError(null);

    const { success, error } = await adminService.updateUsuario(modalEditar.id, formEditar);

    if (!success) {
      setFormError(error);
      setGuardando(false);
      return;
    }

    setModalEditar(null);
    setGuardando(false);
    fetchUsuarios();
  };

  // ─── DELETE ───────────────────────────────────────────────────────────────
  const confirmarEliminar = async () => {
    setGuardando(true);
    setFormError(null);

    const { success, error } = await adminService.deleteUsuario(modalEliminar.id);

    if (!success) {
      setFormError(error);
      setGuardando(false);
      return;
    }

    setModalEliminar(null);
    setGuardando(false);
    fetchUsuarios();
  };

  // ─── CREATE ───────────────────────────────────────────────────────────────
  const abrirNuevo = () => {
    setFormNuevo(FORM_NUEVO_VACIO);
    setFormError(null);
    setModalNuevo(true);
  };

  const crearUsuario = async () => {
    if (!formNuevo.email || !formNuevo.password || !formNuevo.nombre || !formNuevo.apellido) {
      setFormError('Email, contraseña, nombre y apellido son obligatorios');
      return;
    }

    setGuardando(true);
    setFormError(null);

    const { success, error } = await adminService.createUsuario(formNuevo);

    if (!success) {
      setFormError(error);
      setGuardando(false);
      return;
    }

    setModalNuevo(false);
    setGuardando(false);
    fetchUsuarios();
  };

  // ─── CARGA MASIVA (CSV) ────────────────────────────────────────────────────
  const abrirMasivo = () => {
    setCsvNombreArchivo('');
    setCsvFilas([]);
    setReporteImportacion(null);
    setFormError(null);
    setModalMasivo(true);
  };

  const cerrarMasivo = () => {
    setModalMasivo(false);
    setCsvNombreArchivo('');
    setCsvFilas([]);
    setReporteImportacion(null);
  };

  // Lee el archivo seleccionado y lo convierte en filas para la previsualización
  const handleArchivoCSV = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setCsvNombreArchivo(archivo.name);
    setReporteImportacion(null);
    setFormError(null);

    Papa.parse(archivo, {
      header: true,
      skipEmptyLines: true,
      complete: (resultado) => {
        if (resultado.errors.length > 0) {
          setFormError(`El CSV tiene ${resultado.errors.length} fila(s) con formato inválido`);
        }
        setCsvFilas(resultado.data);
      },
      error: () => {
        setFormError('No se pudo leer el archivo CSV');
      },
    });
  };

  // Envía todas las filas previsualizadas y guarda el reporte fila por fila
  const importarMasivo = async () => {
    setImportando(true);
    setFormError(null);

    const { resultados } = await adminService.createUsuariosMasivo(csvFilas);

    setReporteImportacion(resultados);
    setImportando(false);
    fetchUsuarios();
  };

  // ─── Helpers de UI ────────────────────────────────────────────────────────
  const cambiarFiltro = (setter) => (valor) => {
    setter(valor);
    setPagina(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">

      {/* Encabezado */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-400">
            {meta.total > 0 ? `${meta.total.toLocaleString('es-CO')} usuarios registrados` : 'Gestiona los usuarios del sistema'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={abrirMasivo}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-base leading-none">⇪</span>
            Carga masiva
          </button>
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Filtros server-side: busqueda + rol */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
          />
          <span className="absolute right-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>
        <select
          value={rolFiltro}
          onChange={e => cambiarFiltro(setRolFiltro)(e.target.value === 'Todos los roles' ? '' : e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
        >
          {ROLES_FILTRO.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-2">👥</span>
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ciudad</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nivel educativo</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registro</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{u.nombre} {u.apellido}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{u.ciudad || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{u.nivel_educativo || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROL_COLORS[u.rol] || 'bg-gray-100 text-gray-600'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{formatFecha(u.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => abrirEditar(u)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Editar">✏️</button>
                      <button onClick={() => setModalVer(u)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalle">👁️</button>
                      <button onClick={() => { setFormError(null); setModalEliminar(u); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {!loading && meta.total > 0 && (
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm text-gray-400">
            Página {meta.pagina} de {meta.totalPaginas} — {meta.total.toLocaleString('es-CO')} usuarios
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              ‹ Anterior
            </button>
            {Array.from({ length: Math.min(5, meta.totalPaginas) }, (_, i) => {
              const n = Math.max(1, Math.min(pagina - 2, meta.totalPaginas - 4)) + i;
              return (
                <button key={n} onClick={() => setPagina(n)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${pagina === n ? 'bg-green-600 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {n}
                </button>
              );
            })}
            <button onClick={() => setPagina(p => Math.min(meta.totalPaginas, p + 1))} disabled={pagina === meta.totalPaginas}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente ›
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL VER ──────────────────────────────────────────────────────── */}
      {modalVer && (
        <Modal title="Detalle del usuario" onClose={() => setModalVer(null)}>
          <div className="space-y-1">
            <Detalle label="Nombre completo"  value={`${modalVer.nombre} ${modalVer.apellido}`} />
            <Detalle label="Ciudad"           value={modalVer.ciudad} />
            <Detalle label="Nivel educativo"          value={modalVer.nivel_educativo} />
            <Detalle label="Cond. socioeconómicas"    value={modalVer.condiciones_socioeconomicas} />
            <Detalle label="Edad"                     value={modalVer.edad} />
            <Detalle label="Rol"
              value={
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROL_COLORS[modalVer.rol] || 'bg-gray-100'}`}>
                  {modalVer.rol}
                </span>
              }
            />
            <Detalle label="Fecha de registro" value={formatFecha(modalVer.created_at)} />
          </div>
        </Modal>
      )}

      {/* ── MODAL EDITAR ───────────────────────────────────────────────────── */}
      {modalEditar && (
        <Modal title="Editar usuario" onClose={() => setModalEditar(null)} size="lg">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nombre"          name="nombre"          form={formEditar} setForm={setFormEditar} />
            <Campo label="Apellido"        name="apellido"        form={formEditar} setForm={setFormEditar} />
            <Campo label="Ciudad"                    name="ciudad"                      form={formEditar} setForm={setFormEditar} />
            <Campo label="Nivel educativo"          name="nivel_educativo"             form={formEditar} setForm={setFormEditar} />
            <Campo label="Cond. socioeconómicas"    name="condiciones_socioeconomicas" form={formEditar} setForm={setFormEditar} />
            <Campo label="Edad"                     name="edad" type="number"          form={formEditar} setForm={setFormEditar} />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
              <select
                value={formEditar.rol}
                onChange={e => setFormEditar(f => ({ ...f, rol: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
              >
                {ROLES_OPCIONES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalEditar(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={guardarEdicion} disabled={guardando}
              className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL ELIMINAR ─────────────────────────────────────────────────── */}
      {modalEliminar && (
        <Modal title="Eliminar usuario" onClose={() => setModalEliminar(null)} size="sm">
          <p className="text-sm text-gray-600 mb-1">
            ¿Eliminar a <strong>{modalEliminar.nombre} {modalEliminar.apellido}</strong>?
          </p>
          <p className="text-xs text-gray-400 mb-4">Esta acción eliminará el perfil y el acceso al sistema.</p>
          {formError && <p className="text-sm text-red-500 mb-3">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalEliminar(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={confirmarEliminar} disabled={guardando}
              className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
              {guardando ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL NUEVO USUARIO ────────────────────────────────────────────── */}
      {modalNuevo && (
        <Modal title="Nuevo usuario" onClose={() => setModalNuevo(false)} size="lg">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Email"    name="email"    type="email"    form={formNuevo} setForm={setFormNuevo} required />
            <Campo label="Contraseña" name="password" type="password" form={formNuevo} setForm={setFormNuevo} required />
            <Campo label="Nombre"   name="nombre"   form={formNuevo} setForm={setFormNuevo} required />
            <Campo label="Apellido" name="apellido" form={formNuevo} setForm={setFormNuevo} required />
            <Campo label="Ciudad"                 name="ciudad"                      form={formNuevo} setForm={setFormNuevo} />
            <Campo label="Nivel educativo"       name="nivel_educativo"             form={formNuevo} setForm={setFormNuevo} />
            <Campo label="Cond. socioeconómicas" name="condiciones_socioeconomicas" form={formNuevo} setForm={setFormNuevo} />
            <Campo label="Edad"                  name="edad" type="number"          form={formNuevo} setForm={setFormNuevo} />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Rol</label>
              <select
                value={formNuevo.rol}
                onChange={e => setFormNuevo(f => ({ ...f, rol: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
              >
                {ROLES_OPCIONES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-red-500 mt-3">{formError}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalNuevo(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={crearUsuario} disabled={guardando}
              className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
              {guardando ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── MODAL CARGA MASIVA (CSV) ───────────────────────────────────────── */}
      {modalMasivo && (
        <Modal title="Carga masiva de usuarios" onClose={cerrarMasivo} size="lg">
          {!reporteImportacion ? (
            <>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Archivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleArchivoCSV}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:text-sm file:font-semibold file:cursor-pointer hover:file:bg-green-100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Columnas esperadas: {COLUMNAS_CSV_ESPERADAS.join(', ')}
                </p>
              </div>

              {csvFilas.length > 0 && (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    {csvFilas.length} fila(s) detectada(s) en <strong>{csvNombreArchivo}</strong>
                  </p>
                  <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg mb-4">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Email</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Nombre</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Apellido</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Rol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvFilas.map((fila, i) => (
                          <tr key={i} className="border-t border-gray-50">
                            <td className="px-3 py-1.5 text-gray-700">{fila.email || '—'}</td>
                            <td className="px-3 py-1.5 text-gray-700">{fila.nombre || '—'}</td>
                            <td className="px-3 py-1.5 text-gray-700">{fila.apellido || '—'}</td>
                            <td className="px-3 py-1.5 text-gray-700">{fila.rol || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {formError && <p className="text-sm text-red-500 mb-3">{formError}</p>}

              <div className="flex justify-end gap-2">
                <button onClick={cerrarMasivo}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={importarMasivo} disabled={importando || csvFilas.length === 0}
                  className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                  {importando ? 'Importando...' : `Importar ${csvFilas.length || ''} usuario(s)`}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                {reporteImportacion.filter(r => r.success).length} creado(s), {reporteImportacion.filter(r => !r.success).length} con error, de {reporteImportacion.length} fila(s)
              </p>
              <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg mb-4">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteImportacion.map((r, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="px-3 py-1.5 text-gray-700">{r.usuario.email || '—'}</td>
                        <td className="px-3 py-1.5">
                          {r.success
                            ? <span className="text-green-600 font-semibold">✓ Creado</span>
                            : <span className="text-red-500">✗ {r.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button onClick={cerrarMasivo}
                  className="px-4 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                  Cerrar
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

    </div>
  );
}