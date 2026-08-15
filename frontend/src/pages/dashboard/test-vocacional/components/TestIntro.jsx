export default function TestIntro({
  onStart,
  onContinuar,
  onVerResultado,
  loading,
  totalPreguntas,
  tieneBorrador  = false,
  tieneResultado = false,
}) {
  const btnPrimary = {
    width: '100%', padding: '14px', borderRadius: 16, border: 'none',
    background: 'var(--primary)', color: 'var(--primary-ink)',
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    boxShadow: '0 8px 20px var(--primary-glow)', fontFamily: 'inherit',
  };
  const btnOutline = {
    width: '100%', padding: '12px', borderRadius: 16,
    border: '1px solid var(--line)', background: 'var(--surface-2)',
    color: 'var(--ink-soft)', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '72vh', padding: '24px' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 28,
        boxShadow: 'var(--shadow)', padding: '40px 36px', maxWidth: 480, width: '100%', textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <img src="/logos/logo-feliz.svg" alt="Brota" style={{ width: 56, height: 56 }} />
        </div>

        <div className="font-display" style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>
          Test Vocacional
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginBottom: 28, lineHeight: 1.55 }}>
          No hay respuestas correctas o incorrectas.<br />
          Elige todo lo que realmente te represente.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { icon: '❓', label: `${totalPreguntas || 30} preguntas` },
            { icon: '⏱️', label: '10–15 min' },
            { icon: '🎯', label: 'Perfil único' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              background: 'var(--surface-2)', borderRadius: 16, padding: '12px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div style={{
          background: 'var(--primary-soft)', borderRadius: 14, padding: '14px 16px',
          marginBottom: 26, fontSize: 13, color: 'var(--primary-deep)',
          fontStyle: 'italic', lineHeight: 1.45,
        }}>
          "Tu camino comienza con un paso. Cada respuesta te acerca a descubrir tu mejor versión."
        </div>

        {/* Botones según estado */}
        {tieneResultado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={onVerResultado} style={btnPrimary}>✓ Ver mi resultado anterior</button>
            {tieneBorrador && (
              <button onClick={onContinuar} style={btnOutline}>▶ Continuar test en progreso</button>
            )}
            <button onClick={onStart} style={btnOutline}>↺ Reiniciar test</button>
          </div>
        )}

        {tieneBorrador && !tieneResultado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={onContinuar} style={btnPrimary}>▶ Continuar donde lo dejé</button>
            <button onClick={onStart} style={btnOutline}>↺ Empezar de nuevo</button>
          </div>
        )}

        {!tieneBorrador && !tieneResultado && (
          <button onClick={onStart} disabled={loading} style={{ ...btnPrimary, opacity: loading ? .6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Cargando...' : 'Comenzar test →'}
          </button>
        )}
      </div>
    </div>
  );
}
