import { Spinner } from './primitivos';
import { avatarColor } from './constantes';

// Pestaña "Historias reales": banner para compartir + listado de historias.
export default function Historias({ data, cargando, onCompartir, onLeer }) {
  if (cargando) return <Spinner />;
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 14,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>¿Tu camino dio un giro? 🌱</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>
            Tu experiencia puede orientar a alguien más.
          </div>
        </div>
        <button onClick={onCompartir} style={{
          background: 'var(--primary)', color: 'var(--primary-ink)',
          fontWeight: 700, fontSize: 13.5, padding: '10px 18px',
          borderRadius: 10, border: 'none', cursor: 'pointer',
          whiteSpace: 'nowrap', fontFamily: 'inherit', boxShadow: '0 4px 14px var(--primary-glow)',
        }}>+ Compartir tu historia</button>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-soft)' }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>✍️</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Sé el primero en compartir tu historia.</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Tu experiencia puede orientar a alguien más.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {data.map(h => (
            <div key={h.id} style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: avatarColor(h.ini), color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 16, flexShrink: 0,
                }}>{h.ini}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{h.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
                    {h.carrera}{h.carrera && h.inst ? ' · ' : ''}{h.inst}
                  </div>
                </div>
              </div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: 16, marginTop: 13, lineHeight: 1.25, letterSpacing: '-.2px' }}>
                {h.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 7, lineHeight: 1.5 }}>
                {h.excerpt}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 13 }}>
                <span style={{ background: 'var(--primary-soft)', color: 'var(--primary-deep)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                  {h.tag}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>❤️ {h.likes}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>· {h.date}</span>
              </div>
              <div style={{ flex: 1 }} />
              <div onClick={() => onLeer(h)} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13.5, marginTop: 14, cursor: 'pointer' }}>
                Leer historia →
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
