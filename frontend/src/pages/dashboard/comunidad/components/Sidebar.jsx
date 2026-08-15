import { TIPO_COLOR } from './constantes';

// Barra lateral derecha: se deriva de las mismas preguntas/convocatorias que
// ya cargó la página, no pide datos propios.
export default function Sidebar({ preguntas, convocatorias }) {
  const sinRespuesta = preguntas.filter(p => p.answers === 0).slice(0, 3);
  const proximas     = convocatorias.filter(c => c.days <= 7).slice(0, 3);

  return (
    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 14 }}>
          Preguntas sin respuesta
        </div>
        {sinRespuesta.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 10 }}>
            Todas las preguntas tienen respuesta 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 12 }}>
            {sinRespuesta.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{u.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{u.area}</div>
                </div>
                <button style={{
                  background: 'var(--primary-soft)', color: 'var(--primary-deep)',
                  fontSize: 11.5, fontWeight: 700, padding: '6px 11px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap', fontFamily: 'inherit',
                }}>Responder</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 14 }}>
          Próximas a cerrar
        </div>
        {proximas.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 10 }}>
            No hay convocatorias urgentes.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 12 }}>
            {proximas.map(c => {
              const { color = '#16A34A', bg = '#dcfce7' } = TIPO_COLOR[c.type] ?? {};
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 38, height: 38, borderRadius: 10, background: bg, color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', fontWeight: 800, fontSize: 14, flexShrink: 0, lineHeight: 1,
                  }}>
                    {c.days}<span style={{ fontSize: 8, fontWeight: 600 }}>días</span>
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{c.inst}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: 'linear-gradient(135deg, var(--primary-deep), var(--primary))', borderRadius: 12, padding: 16, color: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          ⭐ Consejo
        </div>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 15, marginTop: 9, lineHeight: 1.25 }}>
          El primer paso siempre es explorar
        </div>
        <div style={{ fontSize: 12.5, opacity: .92, marginTop: 7, lineHeight: 1.5 }}>
          No tienes que saberlo todo hoy. Cada pregunta que haces es un paso hacia tu camino.
        </div>
      </div>
    </div>
  );
}
