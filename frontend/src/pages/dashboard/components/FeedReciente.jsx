import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeedReciente } from '../../../services/comunidadService';

const ETIQUETA_TIPO = { post: 'Foro', historia: 'Historia', pregunta: 'Pregunta' };
const COLOR_TIPO = {
  post: { bg: 'var(--primary-soft)', color: 'var(--primary-deep)' },
  historia: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
  pregunta: { bg: 'var(--primary-soft)', color: 'var(--primary-deep)' },
};

// A qué pestaña de Comunidad corresponde cada tipo — se usa para mandar el
// relleno a la sección correcta en vez de al tab por defecto (foros).
const TAB_POR_TIPO = { post: 'foros', historia: 'historias', pregunta: 'preguntas' };

// Relleno para que el feed no se vea vacío mientras la comunidad real todavía
// tiene poca actividad (fase de beta) — solo se usan para completar hasta
// `limite` cuando faltan publicaciones reales, nunca las reemplazan.
// No tienen un id real en la base de datos, así que no pueden llevar a un
// detalle específico (404earía) — enlazan a la pestaña de Comunidad que les
// corresponde según su tipo, no al origen exacto como sí hacen los reales.
const RELLENO = [
  { id: 'relleno-1', tipo: 'historia', titulo: 'Encontré mi carrera gracias al test vocacional', autor: 'María J.', time: 'hace 1 día' },
  { id: 'relleno-2', tipo: 'post', titulo: '¿Alguien sabe si Ingeniería de Sistemas tiene mucha matemática?', autor: 'Santiago R.', time: 'hace 2 días' },
  { id: 'relleno-3', tipo: 'pregunta', titulo: '¿Cómo elegir entre Psicología y Trabajo Social?', autor: 'Anónimo', time: 'hace 3 días' },
  { id: 'relleno-4', tipo: 'post', titulo: 'Tips para el examen de admisión de la Nacional', autor: 'Camila T.', time: 'hace 4 días' },
  { id: 'relleno-5', tipo: 'historia', titulo: 'De no saber qué estudiar a tener claro mi camino', autor: 'Andrés P.', time: 'hace 5 días' },
].map(r => ({
  ...r, relleno: true,
  link: '/dashboard/comunidad',
  linkState: { tab: TAB_POR_TIPO[r.tipo] },
}));

export default function FeedReciente({ limite = 8 }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeedReciente().then(({ success, data }) => {
      const reales = success ? (data ?? []).slice(0, limite) : [];
      const faltan = limite - reales.length;
      setItems(faltan > 0 ? [...reales, ...RELLENO.slice(0, faltan)] : reales);
      setLoading(false);
    });
  }, [limite]);

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {items.map(item => {
            const c = COLOR_TIPO[item.tipo] || COLOR_TIPO.post;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.link, { state: item.linkState })}
                style={{
                  aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', textAlign: 'left',
                  background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 16,
                  padding: 14, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{
                  alignSelf: 'flex-start', fontSize: 10, fontWeight: 700,
                  color: c.color, background: c.bg, padding: '3px 9px', borderRadius: 999,
                }}>
                  {ETIQUETA_TIPO[item.tipo] || item.tipo}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3,
                  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {item.titulo}
                </span>
                <div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.autor}</div>
                  <div>{item.time}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
