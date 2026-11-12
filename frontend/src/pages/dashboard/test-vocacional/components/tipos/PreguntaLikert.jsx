import { ESTILOS_TIPOS } from './estilos';

// Vista "escala Likert": los puntos se reparten sobre una línea de track, con
// la mascota expresando de menos a más afinidad y la etiqueta real de la
// opción debajo. En móvil la escala no se comprime: scrollea horizontal.

const LIKERT_MARKS = [
  '/logos/logo-triste.svg',
  '/logos/logo-triste.svg',
  '/logos/logo-base-limpio.svg',
  '/logos/logo-guino.svg',
  '/logos/logo-feliz.svg',
];

export default function PreguntaLikert({ opciones = [], seleccionadas = [], onSeleccionar }) {
  // Las opciones vienen de la base con sus UUIDs; el emoji de la escala se
  // asigna por posición, no está guardado.
  const puntos = opciones
    .slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((o, i) => ({ ...o, mark: LIKERT_MARKS[i] ?? '•' }));

  return (
    <>
      <style>{ESTILOS_TIPOS}</style>
      <div className="bq-likert-wrap">
        <div className="bq-likert" role="radiogroup" aria-label="Elige un punto de la escala">
          {/* Track */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 32, left: '8%', right: '8%',
              height: 3, background: 'var(--surface-2)', borderRadius: 999,
            }}
          />
          {puntos.map(o => {
            const active = seleccionadas.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSeleccionar(o.id)}
                className="bq-likert-punto"
              >
                <span style={{
                  width: 64, height: 64, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, border: `3px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
                  background: active ? 'var(--primary)' : 'var(--surface)',
                  transform: active ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all .2s',
                }}>
                  {o.mark.startsWith('/')
                    ? <img src={o.mark} alt="" style={{ width: 54, height: 54 }} />
                    : o.mark}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: active ? 700 : 600, textAlign: 'center',
                  maxWidth: 90, lineHeight: 1.25,
                  color: active ? 'var(--primary-deep)' : 'var(--ink-soft)',
                }}>
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
