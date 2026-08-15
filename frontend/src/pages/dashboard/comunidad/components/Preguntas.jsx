import { Spinner } from './primitivos';
import { avatarColor } from './constantes';

// Pestaña "Preguntas": barra para preguntar + listado de preguntas de la comunidad.
export default function Preguntas({ data, cargando, onPreguntar, onPreguntaClick }) {
  if (cargando) return <Spinner />;
  return (
    <>
      <div style={{
        display: 'flex', gap: 10, background: 'var(--surface)',
        border: '1px solid var(--line)', borderRadius: 12, padding: 13, marginBottom: 14,
      }}>
        <div onClick={onPreguntar} style={{
          flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)',
          borderRadius: 10, padding: '12px 15px', fontSize: 13.5, color: 'var(--ink-soft)', cursor: 'text',
        }}>
          ¿Tienes una duda? Pregúntale a la comunidad…
        </div>
        <button onClick={onPreguntar} style={{
          background: 'var(--primary)', color: 'var(--primary-ink)',
          fontWeight: 700, fontSize: 13.5, padding: '0 20px',
          borderRadius: 10, border: 'none', cursor: 'pointer',
          whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}>Preguntar</button>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-soft)' }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>No hay preguntas aún.</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>¡Sé el primero en preguntar!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {data.map(q => (
            <div key={q.id} style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'border-color .15s',
            }}
              onClick={() => onPreguntaClick(q)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: avatarColor(q.ini), color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>{q.ini}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{q.name}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>· {q.time}</span>
                {q.resolved && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--primary-soft)',
                    color: 'var(--primary-deep)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                  }}>Resuelta ✓</span>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 11, lineHeight: 1.3 }}>
                {q.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 11 }}>
                <span style={{ background: 'var(--surface-2)', color: 'var(--ink-soft)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                  {q.area}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>💬 {q.answers} respuestas</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
