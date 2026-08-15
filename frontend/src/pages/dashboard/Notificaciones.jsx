import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { getNotificaciones } from '../../services/comunidadService';

// Todavía no hay chat/mensajería en Brota, así que esto no es una bandeja de
// mensajes — es un feed de lo que ya pasa de verdad en Comunidad (respuestas
// a tus preguntas, likes a tus historias). Reemplaza al placeholder que
// antes vivía en /dashboard/mensajes.
const COLOR_TIPO = {
  respuesta: 'var(--primary)',
  like:      'var(--accent)',
};

export default function Notificaciones({ isDemoMode = false }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotificaciones().then(({ success, data }) => {
      if (success) setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout isDemoMode={isDemoMode}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 28px 60px' }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 22 }}>
          Notificaciones
        </h1>

        {loading ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }} className="animate-pulse">Cargando…</p>
        ) : items.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
            padding: '40px 26px', textAlign: 'center',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
              Todavía no tenés notificaciones
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', maxWidth: 340, margin: '0 auto' }}>
              Te vamos a avisar acá cuando alguien responda tus preguntas o le sirva alguna de tus historias en Comunidad.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(n => (
              <button
                key={n.id}
                onClick={() => navigate(n.link, { state: n.linkState })}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
                  background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
                  padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                  background: COLOR_TIPO[n.tipo] || 'var(--ink-soft)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.4 }}>{n.texto}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 3 }}>{n.time}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
