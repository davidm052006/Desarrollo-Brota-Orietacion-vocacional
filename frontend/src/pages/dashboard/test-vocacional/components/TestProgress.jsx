// Helper row shown below the question card during the test.
// Props:
//   progreso: number (0-100)

const SKILLS = [
  { label: 'Creatividad',   icon: '💡', tint: 'var(--primary-soft)' },
  { label: 'Lógica',        icon: '🧩', tint: 'var(--accent-soft)'  },
  { label: 'Comunicación',  icon: '💬', tint: 'var(--primary-soft)' },
];

export default function TestProgress({ progreso = 0 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, width: '100%' }}>

      {/* Mini reto */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 18, padding: '18px 20px', boxShadow: 'var(--shadow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            ⚡ Mini reto · descanso activo
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
          {SKILLS.map(k => (
            <div key={k.label} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 7, background: 'var(--surface-2)', borderRadius: 13, padding: 13,
            }}>
              <span style={{
                width: 34, height: 34, borderRadius: 10, background: k.tint,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>{k.icon}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-deep), var(--primary))',
        borderRadius: 18, padding: 20, color: '#fff',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{ fontWeight: 800, fontSize: 15 }}>
            Cada respuesta te acerca a tu mejor versión.
          </div>
          <div style={{ fontSize: 12, opacity: .9, marginTop: 6 }}>
            Vas en el {progreso}% · ¡sigue así!
          </div>
        </div>
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
          <path d="M16 31 V15" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/>
          <path d="M16 18 C16 11 9 8.5 4.5 8.5 C4.5 16 10 19 16 19 Z" fill="#fff"/>
          <path d="M16 16 C16 8.5 23.5 5.5 28.5 6.5 C27.5 14 22 17 16 17 Z" fill="#fff" opacity=".75"/>
        </svg>
      </div>

    </div>
  );
}
