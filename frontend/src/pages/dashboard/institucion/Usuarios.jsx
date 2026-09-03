import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import InstitucionNav from './components/InstitucionNav';
import { obtenerPerfil } from '../../../services/perfilService';
import * as institucionService from '../../../services/institucionService';
import { NIVEL_EDUCATIVO_OPCIONES, GRADO_OPCIONES } from '../admin/sections/usuarios/constants';

// Mismo formato que el registro público y la carga masiva del admin — no
// inventar otros valores de nivel_educativo/grado (ver usuarios/constants.js).
const COLUMNAS_ESPERADAS = ['email', 'password', 'nombre', 'apellido', 'ciudad', 'telefono', 'nivel_educativo', 'grado', 'fecha_nacimiento'];

const FORM_VACIO = {
  email: '', password: '', nombre: '', apellido: '', ciudad: '',
  telefono: '', nivel_educativo: '', grado: '', fecha_nacimiento: '',
};

const cardStyle = {
  background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
  padding: '16px 18px', marginBottom: 10,
};

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 9,
  border: '1px solid var(--line)', background: 'var(--bg)',
  color: 'var(--ink)', fontSize: 13, fontFamily: 'inherit',
};

function Campo({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  );
}

export default function Usuarios({ user }) {
  const [perfil, setPerfil] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [modalNuevo, setModalNuevo] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const [modalMasivo, setModalMasivo] = useState(false);
  const [csvFilas, setCsvFilas] = useState([]);
  const [importando, setImportando] = useState(false);
  const [reporte, setReporte] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { success, data, meta: m } = await institucionService.getUsuarios({ busqueda });
    if (success) { setEstudiantes(data || []); setMeta(m || { total: 0 }); }
    setLoading(false);
  }, [busqueda]);

  useEffect(() => {
    if (user?.id) obtenerPerfil(user.id).then(({ success, data }) => { if (success) setPerfil(data); });
  }, [user?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const crear = async () => {
    if (!form.email || !form.password || !form.nombre || !form.apellido) {
      setError('Email, contraseña, nombre y apellido son obligatorios');
      return;
    }
    setGuardando(true);
    setError('');
    const { success, error: err } = await institucionService.createUsuario(form);
    setGuardando(false);
    if (!success) { setError(err); return; }
    setModalNuevo(false);
    setForm(FORM_VACIO);
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este estudiante? Esta acción no se puede deshacer.')) return;
    await institucionService.deleteUsuario(id);
    cargar();
  };

  const handleArchivo = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setReporte(null);
    setError('');

    if (/\.(xlsx|xls)$/i.test(archivo.name)) {
      const XLSX = await import('xlsx');
      const buffer = await archivo.arrayBuffer();
      const libro = XLSX.read(buffer, { type: 'array' });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' }).map((fila) => {
        const normalizada = {};
        for (const [clave, valor] of Object.entries(fila)) {
          normalizada[clave.trim()] = valor === null || valor === undefined ? '' : String(valor).trim();
        }
        return normalizada;
      });
      setCsvFilas(filas);
    } else {
      Papa.parse(archivo, {
        header: true, skipEmptyLines: true,
        complete: (r) => setCsvFilas(r.data),
        error: () => setError('No se pudo leer el archivo CSV'),
      });
    }
  };

  const importar = async () => {
    setImportando(true);
    const { success, error: err, resultados } = await institucionService.createUsuariosMasivo(csvFilas);
    setImportando(false);
    if (!success) { setError(err); return; }
    setReporte(resultados);
    cargar();
  };

  return (
    <DashboardLayout profile={perfil}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 28px 60px' }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Estudiantes
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
          Estudiantes creados por tu institución — quedan vinculados a ella automáticamente.
        </p>

        <InstitucionNav />

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            type="text" placeholder="Buscar por nombre..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={() => { setForm(FORM_VACIO); setError(''); setModalNuevo(true); }}
            style={{ background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            + Nuevo
          </button>
          <button onClick={() => { setCsvFilas([]); setReporte(null); setError(''); setModalMasivo(true); }}
            style={{ background: 'var(--surface-2)', color: 'var(--ink)', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            ⇪ Carga masiva
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : estudiantes.length === 0 ? (
          <div style={cardStyle}><p style={{ fontSize: 13.5 }}>Todavía no creaste estudiantes.</p></div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>{meta.total} estudiante(s)</p>
            {estudiantes.map(u => (
              <div key={u.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{u.nombre} {u.apellido}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{u.ciudad || '—'} · {u.nivel_educativo || '—'}</div>
                </div>
                <button onClick={() => eliminar(u.id)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Eliminar
                </button>
              </div>
            ))}
          </>
        )}

        {modalNuevo && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 24, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Nuevo estudiante</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Campo label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
                <Campo label="Contraseña" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" />
                <Campo label="Nombre" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} />
                <Campo label="Apellido" value={form.apellido} onChange={v => setForm(f => ({ ...f, apellido: v }))} />
                <Campo label="Ciudad" value={form.ciudad} onChange={v => setForm(f => ({ ...f, ciudad: v }))} />
                <Campo label="Teléfono" value={form.telefono} onChange={v => setForm(f => ({ ...f, telefono: v }))} />
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Nivel educativo</label>
                  <select value={form.nivel_educativo} onChange={e => setForm(f => ({ ...f, nivel_educativo: e.target.value }))} style={inputStyle}>
                    <option value="">—</option>
                    {NIVEL_EDUCATIVO_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Grado</label>
                  <select value={form.grado} onChange={e => setForm(f => ({ ...f, grado: e.target.value }))} style={inputStyle}>
                    <option value="">—</option>
                    {GRADO_OPCIONES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <Campo label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={v => setForm(f => ({ ...f, fecha_nacimiento: v }))} type="date" />
              </div>
              {error && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 10 }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button onClick={() => setModalNuevo(false)} style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 12px' }}>Cancelar</button>
                <button onClick={crear} disabled={guardando} style={{ background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: guardando ? .6 : 1 }}>
                  {guardando ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalMasivo && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 24, width: 520, maxHeight: '85vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Carga masiva de estudiantes</h2>
              {!reporte ? (
                <>
                  <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 8 }}>
                    Columnas esperadas: {COLUMNAS_ESPERADAS.join(', ')}. Fecha en formato AAAA-MM-DD.
                  </p>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleArchivo} style={{ fontSize: 12.5, marginBottom: 10 }} />
                  {csvFilas.length > 0 && <p style={{ fontSize: 12.5 }}>{csvFilas.length} fila(s) detectada(s)</p>}
                  {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                    <button onClick={() => setModalMasivo(false)} style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 12px' }}>Cancelar</button>
                    <button onClick={importar} disabled={importando || csvFilas.length === 0} style={{ background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: importando || csvFilas.length === 0 ? .6 : 1 }}>
                      {importando ? 'Importando…' : `Importar ${csvFilas.length || ''}`}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, marginBottom: 10 }}>
                    {reporte.filter(r => r.success).length} creado(s), {reporte.filter(r => !r.success).length} con error.
                  </p>
                  <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {reporte.map((r, i) => (
                      <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
                        {r.usuario.email || '—'} — {r.success ? <span style={{ color: 'var(--primary)' }}>✓ Creado</span> : <span style={{ color: '#dc2626' }}>{r.error}</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button onClick={() => setModalMasivo(false)} style={{ background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700, fontSize: 13, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
