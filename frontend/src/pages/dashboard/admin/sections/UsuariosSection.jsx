import { useState, useEffect, useCallback } from 'react';
import * as adminService from '../../../../services/adminService';
import TablaUsuarios from './usuarios/TablaUsuarios';
import ModalVerUsuario from './usuarios/ModalVerUsuario';
import ModalEditarUsuario from './usuarios/ModalEditarUsuario';
import ModalEliminarUsuario from './usuarios/ModalEliminarUsuario';
import ModalNuevoUsuario from './usuarios/ModalNuevoUsuario';
import { ROLES_FILTRO, FORM_VACIO, FORM_NUEVO_VACIO } from './usuarios/constants';

// Sección "Usuarios" del panel admin: esta pieza solo se encarga de
//   1. traer la lista de usuarios (paginada/filtrada) del backend,
//   2. orquestar las operaciones CRUD y qué modal está abierto,
// y delega toda la presentación a ./usuarios/*.
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

  // ─── Estado de formularios ────────────────────────────────────────────────
  const [formEditar, setFormEditar] = useState(FORM_VACIO);
  const [formNuevo,  setFormNuevo]  = useState(FORM_NUEVO_VACIO);
  const [guardando,  setGuardando]  = useState(false);
  const [formError,  setFormError]  = useState(null);

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

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

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
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Nuevo usuario
        </button>
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

      <TablaUsuarios
        usuarios={usuarios}
        meta={meta}
        loading={loading}
        pagina={pagina}
        setPagina={setPagina}
        onEditar={abrirEditar}
        onVer={setModalVer}
        onEliminar={(u) => { setFormError(null); setModalEliminar(u); }}
      />

      {modalVer && (
        <ModalVerUsuario usuario={modalVer} onClose={() => setModalVer(null)} />
      )}

      {modalEditar && (
        <ModalEditarUsuario
          form={formEditar} setForm={setFormEditar}
          formError={formError} guardando={guardando}
          onGuardar={guardarEdicion} onClose={() => setModalEditar(null)}
        />
      )}

      {modalEliminar && (
        <ModalEliminarUsuario
          usuario={modalEliminar}
          formError={formError} guardando={guardando}
          onConfirmar={confirmarEliminar} onClose={() => setModalEliminar(null)}
        />
      )}

      {modalNuevo && (
        <ModalNuevoUsuario
          form={formNuevo} setForm={setFormNuevo}
          formError={formError} guardando={guardando}
          onCrear={crearUsuario} onClose={() => setModalNuevo(false)}
        />
      )}

    </div>
  );
}
