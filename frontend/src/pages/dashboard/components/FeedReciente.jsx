import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeedReciente } from '../../../services/comunidadService';

const ETIQUETA_TIPO = { post: 'Foro', historia: 'Historia', pregunta: 'Pregunta' };
const COLOR_TIPO = {
  post: { bg: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  historia: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
  pregunta: { bg: 'var(--primary-soft)', color: 'var(--primary-deep)' },
};

export default function FeedReciente() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedReciente().then(({ success, data }) => {
      if (success) setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
      padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 17 }}>Últimas publicaciones</div>
        <button
          onClick={() => navigate('/dashboard/comunidad')}
          style={{
            background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700,
            fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Ver comunidad →
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13 }} className="animate-pulse">Cargando…</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Todavía no hay publicaciones en la comunidad.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map(item => {
            const c = COLOR_TIPO[item.tipo] || COLOR_TIPO.post;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.link, { state: item.linkState })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  background: 'none', border: 'none', borderBottom: '1px solid var(--line)',
                  padding: '11px 4px', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                }}
              >
                <span style={{
                  flexShrink: 0, fontSize: 10.5, fontWeight: 700,
                  color: c.color, background: c.bg, padding: '3px 9px', borderRadius: 999,
                }}>
                  {ETIQUETA_TIPO[item.tipo] || item.tipo}
                </span>
                <span style={{
                  flex: 1, fontSize: 13.5, color: 'var(--ink)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.titulo}
                </span>
                <span style={{ flexShrink: 0, fontSize: 11, color: 'var(--ink-soft)' }}>{item.time}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
