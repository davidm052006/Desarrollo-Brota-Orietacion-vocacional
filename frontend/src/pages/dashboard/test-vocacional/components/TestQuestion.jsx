// Props:
//   pregunta: { id, texto, tipo, categoria?, opciones: [{id, label, icon}] }
//   preguntaNumero: number (1-based)
//   totalPreguntas: number
//   seleccionadas: string[]
//   onSeleccionar: (id) => void
//   onAnterior, onSiguiente: () => void
//   puedeAvanzar: boolean
//   guardando: boolean
//   esUltima: boolean

const PREGUNTA_DEMO = {
  id: 'demo',
  texto: '¿Qué actividades disfrutas en tu tiempo libre?',
  tipo: 'multiple',
  opciones: [
    { id: 'a', label: 'Dibujar, diseñar o crear cosas',                icon: '🎨' },
    { id: 'b', label: 'Pasar tiempo con amigos o conocer gente nueva', icon: '🤝' },
    { id: 'c', label: 'Jugar videojuegos',                             icon: '🎮' },
    { id: 'd', label: 'Leer, escribir o aprender sobre temas nuevos',  icon: '📚' },
    { id: 'e', label: 'Resolver problemas o retos mentales',           icon: '🧩' },
    { id: 'f', label: 'Tomar fotos, grabar videos o editar contenido', icon: '📷' },
    { id: 'g', label: 'Programar, usar tecnología o investigar',       icon: '💻' },
    { id: 'h', label: 'Hacer deporte o actividades al aire libre',     icon: '🏃' },
  ],
};

function splitTexto(texto) {
  if (!texto) return { normal: '', verde: '' };
  const m = texto.match(/^(.+?)\s+(en tu\b.+|para tu\b.+|sobre tu\b.+|de tu\b.+|con tu\b.+)$/i);
  if (m) return { normal: m[1], verde: m[2] };
  const w = texto.split(' ');
  const h = Math.ceil(w.length / 2);
  return { normal: w.slice(0, h).join(' '), verde: w.slice(h).join(' ') };
}

const LIKERT_MARKS = [
  '/logos/logo-triste.svg',
  '/logos/logo-triste.svg',
  '/logos/logo-base-limpio.svg',
  '/logos/logo-guino.svg',
  '/logos/logo-feliz.svg',
];

export default function TestQuestion({
  pregunta       = PREGUNTA_DEMO,
  preguntaNumero = 1,
  totalPreguntas = 30,
  seleccionadas  = [],
  onSeleccionar  = () => {},
  onAnterior     = () => {},
  onSiguiente    = () => {},
  puedeAvanzar   = false,
  guardando      = false,
  esUltima       = false,
}) {
  const esLikert   = pregunta.tipo === 'likert';
  const esMultiple = pregunta.tipo === 'multiple';
  const { normal, verde } = splitTexto(pregunta.texto);
  // Para likert usamos las opciones reales del DB (con sus UUIDs) y les añadimos el emoji de escala
  const opciones = esLikert
    ? (pregunta.opciones ?? [])
        .slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((o, i) => ({ ...o, mark: LIKERT_MARKS[i] ?? '•' }))
    : pregunta.opciones;

  const catLabel = pregunta.categoria
    ? pregunta.categoria.charAt(0).toUpperCase() + pregunta.categoria.slice(1)
    : 'Intereses';

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 24,
      padding: '34px 40px', boxShadow: 'var(--shadow)',
    }}>
      {/* Category badge + question */}
      <div style={{ textAlign: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'var(--primary-soft)', color: 'var(--primary-deep)',
          fontSize: 12, fontWeight: 700, padding: '5px 13px', borderRadius: 999,
        }}>
          🎯 {catLabel}
        </span>
        <div className="font-display" style={{ fontWeight: 800, fontSize: 28, marginTop: 16, lineHeight: 1.15 }}>
          {normal}{' '}
          {verde && <span style={{ color: 'var(--primary)' }}>{verde}</span>}
        </div>
        <div style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 8 }}>
          {esMultiple
            ? 'Selecciona todas las opciones que apliquen para ti.'
            : 'No hay respuestas correctas. Elige la opción que mejor te represente.'}
        </div>
      </div>

      {/* Options */}
      {esLikert ? (
        /* Likert horizontal scale */
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginTop: 30 }}>
          {/* Track line */}
          <div style={{
            position: 'absolute', top: 32, left: '8%', right: '8%',
            height: 3, background: 'var(--surface-2)', borderRadius: 999,
          }} />
          {opciones.map(o => {
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
      ) : (
        /* Multiple / single grid */
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
                  width: 20, height: 20, flexShrink: 0, borderRadius: esMultiple ? 6 : '50%',
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
      )}

      {esMultiple && (
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 10 }}>
          💡 Puedes seleccionar varias opciones
        </div>
      )}

      {/* Navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 30, paddingTop: 20, borderTop: '1px solid var(--line)',
      }}>
        <button onClick={onAnterior} disabled={preguntaNumero === 1} style={{
          fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)',
          background: 'none', border: 'none', cursor: preguntaNumero === 1 ? 'not-allowed' : 'pointer',
          opacity: preguntaNumero === 1 ? .3 : 1, fontFamily: 'inherit',
        }}>
          ← Anterior
        </button>

        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          Paso {Math.ceil((preguntaNumero / totalPreguntas) * 6)} de 6 · perfil en construcción 🌱
        </span>

        <button onClick={onSiguiente} disabled={!puedeAvanzar || guardando} style={{
          background: puedeAvanzar ? 'var(--primary)' : 'var(--surface-2)',
          color: puedeAvanzar ? 'var(--primary-ink)' : 'var(--ink-soft)',
          padding: '12px 28px', borderRadius: 999, border: 'none',
          fontWeight: 700, fontSize: 14, cursor: puedeAvanzar && !guardando ? 'pointer' : 'not-allowed',
          boxShadow: puedeAvanzar ? '0 8px 20px var(--primary-glow)' : 'none',
          fontFamily: 'inherit', transition: 'all .15s',
        }}>
          {guardando ? 'Guardando...' : esUltima ? 'Ver resultados →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
