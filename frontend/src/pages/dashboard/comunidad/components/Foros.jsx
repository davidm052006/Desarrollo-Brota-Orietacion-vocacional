import { Spinner } from './primitivos';

// Pestaña "Foros": grilla de tarjetas, una por foro.
export default function Foros({ data, cargando, onEntrar }) {
  if (cargando) return <Spinner />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {data.map(f => (
        <div key={f.id} onClick={() => onEntrar(f)} style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ fontSize: 30 }}>{f.icon}</div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 15.5, marginTop: 10, lineHeight: 1.25 }}>
            {f.nombre}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 4 }}>
            {f.posts} posts activos
          </div>
          <div style={{
            display: 'inline-flex', marginTop: 14,
            background: 'var(--primary-soft)', color: 'var(--primary-deep)',
            fontWeight: 700, fontSize: 13, padding: '8px 14px', borderRadius: 9,
          }}>
            Entrar →
          </div>
        </div>
      ))}
      {!cargando && data.length === 0 && (
        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--ink-soft)' }}>
          No hay foros disponibles aún.
        </div>
      )}
    </div>
  );
}
