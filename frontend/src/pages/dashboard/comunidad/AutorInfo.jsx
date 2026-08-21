import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { useModeracion } from '../../../hooks/useModeracion';
import { getInfoAutor } from '../../../services/comunidadService';

function fmtFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Campo({ label, value }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 14.5, color: 'var(--ink)', marginTop: 3 }}>{value || '—'}</div>
    </div>
  );
}

// Página privada — solo admin/moderador. Muestra los datos reales de quien
// hizo una publicación de comunidad, sin importar si la publicó anónima
// (el user_id nunca deja de guardarse, ver comunidadHelpers.resolverAutor).
export default function AutorInfo() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { puedeModerar, loading: cargandoRol } = useModeracion();

  const [autor, setAutor] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cargandoRol) return;
    if (!puedeModerar) { navigate('/dashboard', { replace: true }); return; }

    getInfoAutor(userId).then(({ success, data, error: err }) => {
      if (success) setAutor(data);
      else setError(err || 'No se pudo cargar la información.');
      setCargando(false);
    });
  }, [userId, puedeModerar, cargandoRol, navigate]);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 28px 60px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600, padding: 0,
          }}
        >
          ← Volver
        </button>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
          background: 'var(--accent-soft)', color: 'var(--accent)',
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
        }}>
          🔒 Solo visible para moderación
        </div>

        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Información del autor
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 22 }}>
          Datos reales de quien hizo la publicación, aunque la haya marcado como anónima.
        </p>

        {(cargando || cargandoRol) ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : error ? (
          <p style={{ color: '#dc2626', fontSize: 14 }}>{error}</p>
        ) : autor && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
            padding: '10px 22px',
          }}>
            <Campo label="Nombre" value={[autor.nombre, autor.apellido].filter(Boolean).join(' ')} />
            <Campo label="Correo" value={autor.email} />
            <Campo label="Ciudad" value={autor.ciudad} />
            <Campo label="Edad" value={autor.edad ? `${autor.edad} años` : null} />
            <Campo label="Nivel educativo" value={autor.nivel_educativo} />
            <Campo label="Rol" value={autor.rol} />
            <Campo label="Racha activa" value={autor.racha_dias ? `${autor.racha_dias} días` : '0 días'} />
            <Campo label="Registrado desde" value={fmtFecha(autor.created_at)} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
