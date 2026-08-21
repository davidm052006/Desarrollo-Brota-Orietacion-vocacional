import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { getHistoria, toggleLikeHistoria } from '../../../services/comunidadService';
import { ModeracionBar } from './components/primitivos';

const AV_PALETTE = ['#16A34A', '#2563eb', '#db2777', '#d97706', '#7c3aed', '#0891b2'];
function avatarColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AV_PALETTE[h % AV_PALETTE.length];
}

export default function HistoriaDetalle() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    getHistoria(id).then(res => {
      if (res.success) setDatos(res.data);
      setCargando(false);
    });
  }, [id]);

  async function handleLike() {
    if (!datos) return;
    const res = await toggleLikeHistoria(id);
    if (res.success) {
      setDatos(prev => ({
        ...prev,
        likes: res.data.likes,
        yo_di_like: res.data.yo_di_like,
      }));
    }
  }

  if (cargando) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      </div>
    </DashboardLayout>
  );

  if (!datos) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-soft)' }}>
        <div style={{ fontSize: 36 }}>😕</div>
        <div style={{ fontWeight: 700, marginTop: 14 }}>Historia no encontrada.</div>
        <button onClick={() => navigate('/dashboard/comunidad')} style={{ marginTop: 20, background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700, padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Volver</button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 66px)', padding: '28px 28px 60px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          <button onClick={() => navigate('/dashboard/comunidad')} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5,
            color: 'var(--ink-soft)', fontFamily: 'inherit', padding: 0, marginBottom: 22,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>← Comunidad · Historias</button>

          {/* Cabecera */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '26px 28px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <span style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: avatarColor(datos.ini), color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 22,
              }}>{datos.ini}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{datos.name}</div>
                {(datos.carrera || datos.inst) && (
                  <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>
                    {datos.carrera}{datos.carrera && datos.inst ? ' · ' : ''}{datos.inst}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ background: 'var(--primary-soft)', color: 'var(--primary-deep)', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999 }}>
                    {datos.area}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{datos.date}</span>
                </div>
              </div>
            </div>

            <div className="font-display" style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.2, letterSpacing: '-.5px', marginBottom: 22 }}>
              {datos.titulo}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {(Array.isArray(datos.body) ? datos.body : [datos.body]).map((parrafo, i) => (
                <p key={i} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink)' }}>
                  {parrafo}
                </p>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              <button onClick={handleLike} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: datos.yo_di_like ? 'var(--accent-soft)' : 'var(--surface-2)',
                border: `1.5px solid ${datos.yo_di_like ? 'var(--accent)' : 'var(--line)'}`,
                color: datos.yo_di_like ? 'var(--accent)' : 'var(--ink-soft)',
                borderRadius: 999, padding: '9px 18px', cursor: 'pointer',
                fontWeight: 700, fontSize: 13.5, fontFamily: 'inherit', transition: 'all .15s',
              }}>
                {datos.yo_di_like ? '❤️' : '🤍'} {datos.likes} Me ayudó
              </button>
              <button onClick={() => navigate('/dashboard/comunidad')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'inherit', fontWeight: 600,
              }}>← Más historias</button>
              <ModeracionBar
                tipo="historia" id={id} autorId={datos.autor_id}
                onCambio={() => navigate('/dashboard/comunidad')}
              />
            </div>
          </div>

          {/* Historias relacionadas */}
          {datos.relacionadas?.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Más historias</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {datos.relacionadas.map(r => (
                  <div key={r.id} onClick={() => navigate(`/dashboard/comunidad/historia/${r.id}`)}
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--line)',
                      borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = ''; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: avatarColor(r.ini), color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 14,
                      }}>{r.ini}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>❤️ {r.likes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
