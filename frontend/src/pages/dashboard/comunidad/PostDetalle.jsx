import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { getPost, votarPost, responderPost, getPregunta, responderPregunta, reportarPregunta } from '../../../services/comunidadService';
import { ModeracionBar } from './components/primitivos';
import BrotiAvatar from '../../../components/Shared/BrotiAvatar';

const AV_PALETTE = ['#16A34A', '#2563eb', '#db2777', '#d97706', '#7c3aed', '#0891b2'];
function avatarColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AV_PALETTE[h % AV_PALETTE.length];
}

function VoteControl({ votos: inicial, miVoto: inicial_mv, onVotar, vertical = false }) {
  const [count, setCount] = useState(inicial);
  const [voted, setVoted] = useState(inicial_mv);

  async function vote(dir) {
    const res = await onVotar(dir);
    if (res?.success) { setCount(res.data.votos); setVoted(res.data.mi_voto); }
  }

  const style = vertical
    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }
    : { display: 'flex', alignItems: 'center', gap: 6 };

  return (
    <div style={style}>
      <button onClick={() => vote('up')} style={{
        background: 'none', border: 'none', cursor: 'pointer', fontSize: vertical ? 18 : 15,
        color: voted === 'up' ? 'var(--primary)' : 'var(--ink-soft)', lineHeight: 1, padding: '2px 5px',
      }}>▲</button>
      <span style={{ fontWeight: 800, fontSize: vertical ? 17 : 14, color: 'var(--primary-deep)' }}>{count}</span>
      <button onClick={() => vote('down')} style={{
        background: 'none', border: 'none', cursor: 'pointer', fontSize: vertical ? 18 : 15,
        color: voted === 'down' ? '#dc2626' : 'var(--ink-soft)', lineHeight: 1, padding: '2px 5px',
      }}>▼</button>
    </div>
  );
}

export default function PostDetalle() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const tipo = location.state?.tipo || 'post';
  const foro = location.state?.foro;

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [anonimo, setAnonimo] = useState(false);
  const [reporteEstado, setReporteEstado] = useState(null); // null | 'enviando' | 'ok' | mensaje de error

  useEffect(() => {
    setCargando(true);
    const fn = tipo === 'pregunta' ? getPregunta : getPost;
    fn(id).then(res => {
      if (res.success) setDatos(res.data);
      setCargando(false);
    });
  }, [id, tipo]);

  async function handleVotar(dir) {
    const res = await votarPost(id, dir);
    return res;
  }

  async function handleReportar() {
    setReporteEstado('enviando');
    const res = await reportarPregunta(id);
    setReporteEstado(res.success ? 'ok' : (res.error || 'No se pudo reportar'));
  }

  async function handleResponder() {
    if (!nuevoTexto.trim()) return;
    setEnviando(true);
    const fn = tipo === 'pregunta' ? responderPregunta : responderPost;
    const res = await fn(id, { contenido: nuevoTexto.trim(), anonimo });
    setEnviando(false);
    if (res.success) {
      setDatos(prev => ({ ...prev, respuestas: [...(prev.respuestas ?? []), res.data] }));
      setNuevoTexto('');
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
        <div style={{ fontWeight: 700, marginTop: 14 }}>Post no encontrado.</div>
        <button onClick={() => navigate('/dashboard/comunidad')} style={{ marginTop: 20, background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700, padding: '11px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Volver</button>
      </div>
    </DashboardLayout>
  );

  const breadcrumbLabel = foro ? `Comunidad · ${foro.nombre}` : 'Comunidad';
  const breadcrumbPath  = foro ? `/dashboard/comunidad/foro/${foro.id}` : '/dashboard/comunidad';

  return (
    <DashboardLayout>
      <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 66px)', padding: '28px 28px 60px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          <button onClick={() => navigate(breadcrumbPath, { state: { foro } })} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5,
            color: 'var(--ink-soft)', fontFamily: 'inherit', padding: 0, marginBottom: 22,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>← {breadcrumbLabel}</button>

          {/* Post principal */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '26px 28px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              {tipo === 'post' && (
                <VoteControl votos={datos.votos ?? 0} miVoto={datos.mi_voto ?? null} onVotar={handleVotar} vertical />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-display" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.2, letterSpacing: '-.4px', marginBottom: 16 }}>
                  {datos.titulo || datos.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  {datos.broti_config ? <BrotiAvatar config={datos.broti_config} size={36} /> : (
                    <span style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: avatarColor(datos.ini), color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, flexShrink: 0,
                    }}>{datos.ini}</span>
                  )}
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{datos.autor_display || datos.name}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>· {datos.time}</span>
                  {datos.resuelta && (
                    <span style={{ background: 'var(--primary-soft)', color: 'var(--primary-deep)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                      Resuelta ✓
                    </span>
                  )}
                  {tipo === 'pregunta' && !datos.es_autor && (
                    <button
                      onClick={handleReportar}
                      disabled={reporteEstado === 'enviando' || reporteEstado === 'ok'}
                      style={{
                        marginLeft: 'auto', background: 'none', border: '1px solid var(--line)',
                        color: 'var(--ink-soft)', fontSize: 11.5, fontWeight: 600, padding: '4px 10px',
                        borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {reporteEstado === 'ok' ? 'Reportada' : '🚩 Reportar'}
                    </button>
                  )}
                </div>
                {reporteEstado && reporteEstado !== 'enviando' && reporteEstado !== 'ok' && (
                  <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 10 }}>{reporteEstado}</div>
                )}
                <ModeracionBar
                  tipo={tipo} id={id} autorId={datos.autor_id}
                  onCambio={() => navigate('/dashboard/comunidad')}
                />
                <div style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink)', marginTop: 14 }}>
                  {datos.body || datos.contenido}
                </div>
              </div>
            </div>
          </div>

          {/* Respuestas */}
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
            {(datos.respuestas ?? []).length} {(datos.respuestas ?? []).length === 1 ? 'respuesta' : 'respuestas'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            {(datos.respuestas ?? []).map(r => (
              <div key={r.id} style={{
                background: r.mejor ? 'var(--primary-soft)' : 'var(--surface)',
                border: `1px solid ${r.mejor ? 'var(--primary)' : 'var(--line)'}`,
                borderRadius: 16, padding: '20px 22px',
              }}>
                {r.mejor && (
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary-deep)', marginBottom: 10 }}>
                    ★ Mejor respuesta
                  </div>
                )}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: avatarColor(r.ini), color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 12,
                      }}>{r.ini}</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{r.autor_display}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>· {r.time}</span>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>
                      {r.texto}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>▲ {r.votos} votos</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {(datos.respuestas ?? []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ink-soft)' }}>
                <div style={{ fontSize: 13 }}>Sé el primero en responder.</div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>Tu respuesta</div>
            <textarea
              value={nuevoTexto}
              onChange={e => setNuevoTexto(e.target.value)}
              placeholder="Escribe tu respuesta aquí…"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface-2)', border: '1px solid var(--line)',
                borderRadius: 12, padding: '13px 16px', fontSize: 14,
                color: 'var(--ink)', fontFamily: 'inherit',
                resize: 'vertical', outline: 'none', lineHeight: 1.65,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                <input type="checkbox" checked={anonimo} onChange={e => setAnonimo(e.target.checked)} />
                Responder como anónimo
              </label>
              <button
                onClick={handleResponder}
                disabled={!nuevoTexto.trim() || enviando}
                style={{
                  background: nuevoTexto.trim() ? 'var(--primary)' : 'var(--surface-2)',
                  color: nuevoTexto.trim() ? 'var(--primary-ink)' : 'var(--ink-soft)',
                  fontWeight: 700, fontSize: 14, padding: '11px 24px',
                  borderRadius: 12, border: 'none',
                  cursor: nuevoTexto.trim() && !enviando ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', transition: 'all .15s',
                  opacity: enviando ? .7 : 1,
                }}
              >
                {enviando ? 'Publicando…' : 'Publicar →'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
