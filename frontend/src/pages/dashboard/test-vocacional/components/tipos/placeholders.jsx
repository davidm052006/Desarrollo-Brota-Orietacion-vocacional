// Vistas provisionales por tipo de pregunta.
//
// Son el render que vivía dentro de TestQuestion.jsx antes de partirlo en un
// dispatcher, movido tal cual acá para que el test siga funcionando mientras
// las vistas definitivas (PreguntaOpcionUnica / PreguntaOpcionMultiple /
// PreguntaLikert, una por tipo, visualmente distintas entre sí) se construyen
// aparte. Cuando entren, se cambian los imports de `tipos/index.js` y este
// archivo se borra completo — nada más lo importa.
//
// Contrato común de las tres, el mismo que tendrán las definitivas:
//   { pregunta, opciones, seleccionadas, onSeleccionar } -> solo el cuerpo de
//   opciones (el badge de categoría, el título y la navegación los pone el
//   dispatcher).

const LIKERT_MARKS = [
  '/logos/logo-triste.svg',
  '/logos/logo-triste.svg',
  '/logos/logo-base-limpio.svg',
  '/logos/logo-guino.svg',
  '/logos/logo-feliz.svg',
];

function GrillaOpciones({ opciones = [], seleccionadas = [], onSeleccionar, multiple }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
      {opciones.map(o => {
        const active = seleccionadas.includes(o.id);
        return (
          <button key={o.id} onClick={() => onSeleccionar(o.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 18, textAlign: 'left',
            border: `2px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
            background: active ? 'var(--primary-soft)' : 'var(--surface-2)',
            cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: active ? 'var(--primary-soft)' : 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {o.icon ?? '•'}
            </div>
            <span style={{
              flex: 1, fontSize: 13.5, lineHeight: 1.3,
              color: active ? 'var(--primary-deep)' : 'var(--ink)',
              fontWeight: active ? 600 : 400,
            }}>
              {o.label}
            </span>
            <div style={{
              width: 20, height: 20, flexShrink: 0, borderRadius: multiple ? 6 : '50%',
              border: `2px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
              background: active ? 'var(--primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {active && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="var(--primary-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function PlaceholderOpcionUnica(props) {
  return <GrillaOpciones {...props} multiple={false} />;
}

export function PlaceholderOpcionMultiple(props) {
  return (
    <>
      <GrillaOpciones {...props} multiple />
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 10 }}>
        💡 Puedes seleccionar varias opciones
      </div>
    </>
  );
}

export function PlaceholderLikert({ opciones = [], seleccionadas = [], onSeleccionar }) {
  // Las opciones reales vienen de la base (con sus UUIDs); el emoji de la
  // escala se asigna por posición, no viene guardado.
  const puntos = opciones
    .slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((o, i) => ({ ...o, mark: LIKERT_MARKS[i] ?? '•' }));

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginTop: 30 }}>
      {/* Track line */}
      <div style={{
        position: 'absolute', top: 32, left: '8%', right: '8%',
        height: 3, background: 'var(--surface-2)', borderRadius: 999,
      }} />
      {puntos.map(o => {
        const active = seleccionadas.includes(o.id);
        return (
          <div key={o.id} onClick={() => onSeleccionar(o.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 11, zIndex: 1, cursor: 'pointer',
          }}>
            <span style={{
              width: 64, height: 64, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, border: `3px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
              background: active ? 'var(--primary)' : 'var(--surface)',
              transform: active ? 'scale(1.12)' : 'scale(1)',
              transition: 'all .2s',
            }}>
              {o.mark.startsWith('/') ? <img src={o.mark} alt="" style={{ width: 54, height: 54 }} /> : o.mark}
            </span>
            <span style={{
              fontSize: 12, fontWeight: active ? 700 : 600, textAlign: 'center',
              maxWidth: 90, lineHeight: 1.25,
              color: active ? 'var(--primary-deep)' : 'var(--ink-soft)',
            }}>
              {o.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
