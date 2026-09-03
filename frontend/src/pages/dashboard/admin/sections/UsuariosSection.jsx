import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import * as adminService from '../../../../services/adminService';
import Modal from '../components/Modal';
import TablaUsuarios from './usuarios/TablaUsuarios';
import ModalVerUsuario from './usuarios/ModalVerUsuario';
import ModalEditarUsuario from './usuarios/ModalEditarUsuario';
import ModalEliminarUsuario from './usuarios/ModalEliminarUsuario';
import ModalNuevoUsuario from './usuarios/ModalNuevoUsuario';
import ModalPermisosUsuario from './usuarios/ModalPermisosUsuario';
import {
  ROLES_FILTRO, ROLES_OPCIONES, NIVEL_EDUCATIVO_OPCIONES, GRADO_OPCIONES,
  FORM_VACIO, FORM_NUEVO_VACIO,
} from './usuarios/constants';

// Columnas que debe traer el CSV/Excel de carga masiva (mismos nombres que espera
// createUsuario, y mismo formato que pide el registro público — fecha_nacimiento
// en vez de una edad suelta, ver ModalNuevoUsuario.jsx)
const COLUMNAS_ESPERADAS = [
  'email', 'password', 'nombre', 'apellido', 'ciudad', 'telefono',
  'nivel_educativo', 'grado', 'fecha_nacimiento', 'condiciones_socioeconomicas', 'rol',
];

// Fila de ejemplo para la plantilla descargable
const FILA_EJEMPLO_PLANTILLA = {
  email: 'estudiante@ejemplo.com', password: 'clave123',
  nombre: 'Ana', apellido: 'Gómez', ciudad: 'Bogotá', telefono: '3001234567',
  nivel_educativo: 'Educacion media', grado: 'Décimo', fecha_nacimiento: '2009-03-12',
  condiciones_socioeconomicas: 'Estrato 3', rol: 'estudiante',
};

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
  const [modalMasivo,   setModalMasivo]   = useState(false);
  const [modalPermisos, setModalPermisos] = useState(null);

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
      telefono:                    usuario.telefono                    || '',
      nivel_educativo:             usuario.nivel_educativo             || '',
      grado:                       usuario.grado                       || '',
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

  // ─── PERMISOS (bloqueo/desbloqueo) ─────────────────────────────────────────
  const guardarPermisos = async (bloqueadoHasta) => {
    setGuardando(true);
    setFormError(null);

    const { success, error } = await adminService.updatePermisosUsuario(modalPermisos.id, {
      bloqueado_hasta: bloqueadoHasta,
    });

    if (!success) {
      setFormError(error);
      setGuardando(false);
      return;
    }

    setModalPermisos(null);
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

  // Lee el archivo seleccionado (CSV o Excel) y lo convierte en filas para la previsualización.
  // `xlsx` (SheetJS) se importa dinámicamente (mismo patrón que utils/exportarPDF.js con
  // jspdf/html2canvas) para no sumarla al bundle inicial de toda la app — solo se descarga
  // cuando alguien realmente sube un archivo en este modal.
  const handleArchivo = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    setCsvNombreArchivo(archivo.name);
    setReporteImportacion(null);
    setFormError(null);

    const esExcel = /\.(xlsx|xls)$/i.test(archivo.name);

    if (esExcel) {
      try {
        const XLSX = await import('xlsx');
        const buffer = await archivo.arrayBuffer();
        const libro = XLSX.read(buffer, { type: 'array' });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        // defval: '' para que las celdas vacías no desaparezcan de la fila;
        // se normaliza todo a string (igual que hace Papa.parse con el CSV)
        // porque SheetJS puede devolver números para columnas como "edad".
        const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' }).map((fila) => {
          const normalizada = {};
          for (const [clave, valor] of Object.entries(fila)) {
            normalizada[clave.trim()] = valor === null || valor === undefined ? '' : String(valor).trim();
          }
          return normalizada;
        });
        setCsvFilas(filas);
      } catch {
        setFormError('No se pudo leer el archivo Excel');
      }
    } else {
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
    }
  };

  // Genera y descarga un .xlsx con las columnas esperadas + una fila de ejemplo
  const descargarPlantilla = async () => {
    const XLSX = await import('xlsx');
    const hoja = XLSX.utils.json_to_sheet([FILA_EJEMPLO_PLANTILLA], { header: COLUMNAS_ESPERADAS });
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Usuarios');
    XLSX.writeFile(libro, 'plantilla_carga_usuarios.xlsx');
  };

  // Envía todas las filas previsualizadas en una sola request y guarda el reporte fila por fila
  const importarMasivo = async () => {
    setImportando(true);
    setFormError(null);

    const { success, error, resultados } = await adminService.createUsuariosMasivo(csvFilas);

    if (!success) {
      setFormError(error);
      setImportando(false);
      return;
    }

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
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
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
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
          />
          <span className="absolute right-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>
        <select
          value={rolFiltro}
          onChange={e => cambiarFiltro(setRolFiltro)(e.target.value === 'Todos los roles' ? '' : e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
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
        onPermisos={(u) => { setFormError(null); setModalPermisos(u); }}
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

      {modalPermisos && (
        <ModalPermisosUsuario
          usuario={modalPermisos}
          formError={formError} guardando={guardando}
          onGuardar={guardarPermisos} onClose={() => setModalPermisos(null)}
        />
      )}

      {/* ── MODAL CARGA MASIVA (CSV) ───────────────────────────────────────── */}
      {modalMasivo && (
        <Modal title="Carga masiva de usuarios" onClose={cerrarMasivo} size="lg">
          {!reporteImportacion ? (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-600">
                    Archivo CSV o Excel (.xlsx, .xls)
                  </label>
                  <button
                    type="button"
                    onClick={descargarPlantilla}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Descargar plantilla
                  </button>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleArchivo}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-soft file:text-primary file:text-sm file:font-semibold file:cursor-pointer hover:file:bg-primary-soft"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Columnas esperadas: {COLUMNAS_ESPERADAS.join(', ')}.<br />
                  Rol válido: {ROLES_OPCIONES.join(', ')}. Nivel educativo: {NIVEL_EDUCATIVO_OPCIONES.map(o => o.value).join(', ')}. Grado: {GRADO_OPCIONES.join(', ')}.
                  Fecha de nacimiento en formato AAAA-MM-DD.
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
                  className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50">
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
                            ? <span className="text-primary font-semibold">✓ Creado</span>
                            : <span className="text-red-500">✗ {r.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button onClick={cerrarMasivo}
                  className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors">
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