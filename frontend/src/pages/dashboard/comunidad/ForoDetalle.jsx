import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { getPostsByForo, createPost } from '../../../services/comunidadService';
import { ModeracionBar } from './components/primitivos';

const AV_PALETTE = ['#16A34A', '#2563eb', '#db2777', '#d97706', '#7c3aed', '#0891b2'];
function avatarColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return AV_PALETTE[h % AV_PALETTE.length];
}

function VoteControl({ votos }) {
  const [count, setCount] = useState(votos);
  const [voted, setVoted] = useState(false);
  function vote() { if (voted) { setCount(votos); setVoted(false); } else { setCount(v => v + 1); setVoted(true); } }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <button onClick={vote} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: voted ? 'var(--primary)' : 'var(--ink-soft)', lineHeight: 1, padding: '2px 6px' }}>▲</button>
      <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary-deep)' }}>{count}</span>
    </div>
  );
}

function ModalNuevoPost({ foroId, onClose, onPublicado }) {
  const [form, setForm] = useState({ titulo: '', contenido: '', anonimo: false });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function handleEnviar(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.contenido.trim()) return;
    setEnviando(true);
    const res = await createPost(foroId, form);
    setEnviando(false);
    if (res.success) { onPublicado(res.data); onClose(); }
    else setError(res.error || 'Error al publicar');
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,31,20,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleEnviar} style={{
        background: 'var(--surface)', borderRadius: 20, padding: '28px 32px',
        maxWidth: 600, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.25)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="font-display" style={{ fontWeight: 800, fontSize: 20 }}>Nuevo post</div>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>
        {[
          { key: 'titulo', label: 'Título', tag: 'input', placeholder: '¿Cuál es tu pregunta o tema?' },
          { key: 'contenido', label: 'Detalle', tag: 'textarea', placeholder: 'Explica más tu pregunta o tema…' },
        ].map(({ key, label, tag, placeholder }) => (
          <div key={key}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
            {tag === 'input'
              ? <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} required
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 11, padding: '11px 14px', fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit', outline: 'none' }} />
              : <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} required rows={4}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 11, padding: '11px 14px', fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
            }
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="anon" checked={form.anonimo} onChange={e => setForm(f => ({ ...f, anonimo: e.target.checked }))} />
          <label htmlFor="anon" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Publicar como anónimo</label>
        </div>
        {error && <div style={{ fontSize: 12.5, color: '#dc2626' }}>{error}</div>}
        <button type="submit" disabled={enviando} style={{
          background: 'var(--primary)', color: 'var(--primary-ink)', fontWeight: 700,
          fontSize: 14, padding: '13px', borderRadius: 12, border: 'none',
          cursor: enviando ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: enviando ? .7 : 1,
        }}>{enviando ? 'Publicando…' : 'Publicar post'}</button>
      </form>
    </div>
  );
}

export default function ForoDetalle() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [orden, setOrden] = useState('recientes');
  const [posts, setPosts] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalPost, setModalPost] = useState(false);

  const foro = location.state?.foro || { id, icon: '💬', nombre: id, posts: 0 };

  useEffect(() => {
    setCargando(true);
    getPostsByForo(id, orden).then(res => {
      if (res.success) setPosts(res.data ?? []);
      setCargando(false);
    });
  }, [id, orden]);

  function handlePostPublicado(nuevoPost) {
    setPosts(prev => [nuevoPost, ...prev]);
  }

  return (
    <DashboardLayout>
      <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 66px)', padding: '28px 28px 48px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>

          <button onClick={() => navigate('/dashboard/comunidad')} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5,
            color: 'var(--ink-soft)', fontFamily: 'inherit', padding: 0, marginBottom: 22,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>← Comunidad · Foros</button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, background: 'var(--primary-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
              }}>{foro.icon}</div>
              <div>
                <div className="font-display" style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-.5px' }}>
                  {foro.nombre}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>
                  {posts.length} posts
                </div>
              </div>
            </div>
            <button onClick={() => setModalPost(true)} style={{
              background: 'var(--primary)', color: 'var(--primary-ink)',
              fontWeight: 700, fontSize: 13.5, padding: '11px 20px',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px var(--primary-glow)', fontFamily: 'inherit',
            }}>+ Nuevo post</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {[['recientes', 'Más recientes'], ['votados', 'Más votados']].map(([k, l]) => {
              const active = orden === k;
              return (
                <button key={k} onClick={() => setOrden(k)} style={{
                  fontSize: 13, fontWeight: active ? 700 : 600, padding: '8px 15px', borderRadius: 999,
                  border: active ? 'none' : '1px solid var(--line)',
                  background: active ? 'var(--primary)' : 'var(--surface)',
                  color: active ? 'var(--primary-ink)' : 'var(--ink-soft)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>{l}</button>
              );
            })}
          </div>

          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)' }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Sé el primero en publicar en este foro.</div>
              <button onClick={() => setModalPost(true)} style={{
                marginTop: 18, background: 'var(--primary)', color: 'var(--primary-ink)',
                fontWeight: 700, fontSize: 14, padding: '12px 24px', borderRadius: 12,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>Crear el primer post</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {posts.map(p => (
                <div key={p.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 16,
                  cursor: 'pointer', transition: 'all .15s',
                }}
                  onClick={() => navigate(`/dashboard/comunidad/post/${p.id}`, { state: { post: p, foro } })}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(33,189,104,.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <VoteControl votos={p.votos} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: avatarColor(p.ini), color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 12,
                      }}>{p.ini}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{p.autor_display}</span>
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>· {p.time}</span>
                    </div>
                    <div className="font-display" style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3, marginBottom: 7 }}>
                      {p.titulo}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 10 }}>
                      {p.preview}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>💬 {p.respuestas} respuestas</span>
                    </div>
                    <ModeracionBar
                      tipo="post" id={p.id} autorId={p.autor_id}
                      onCambio={() => setPosts(prev => prev.filter(x => x.id !== p.id))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalPost && (
        <ModalNuevoPost
          foroId={id}
          onClose={() => setModalPost(false)}
          onPublicado={handlePostPublicado}
        />
      )}
    </DashboardLayout>
  );
}
