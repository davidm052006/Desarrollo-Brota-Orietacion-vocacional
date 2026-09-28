import { ESTILOS_TIPOS } from './estilos';

// Vista de "opción múltiple": grilla de dos columnas (una sola en móvil) con
// indicador cuadrado tipo checkbox, contador de seleccionadas y la ayuda de
// que se puede marcar más de una.

export default function PreguntaOpcionMultiple({ opciones = [], seleccionadas = [], onSeleccionar }) {
  const total = seleccionadas.length;

  return (
    <>
      <style>{ESTILOS_TIPOS}</style>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 22, marginBottom: 2, minHeight: 22,
      }}>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          💡 Puedes seleccionar varias opciones
        </span>
        {total > 0 && (
          <span
            aria-live="polite"
            style={{
              fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999,
              background: 'var(--primary-soft)', color: 'var(--primary-deep)',
            }}
          >
            {total} {total === 1 ? 'seleccionada' : 'seleccionadas'}
          </span>
        )}
      </div>

      <div className="bq-multiple" role="group" aria-label="Marca todas las opciones que apliquen">
        {opciones.map(o => {
          const active = seleccionadas.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => onSeleccionar(o.id)}
              className="bq-opt"
              style={{
                border: `2px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
                background: active ? 'var(--primary-soft)' : 'var(--surface-2)',
              }}
            >
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
              {/* Indicador cuadrado con check — contraparte del círculo de la
                  vista de opción única. */}
              <span
                aria-hidden="true"
                style={{
                  width: 20, height: 20, flexShrink: 0, borderRadius: 6,
                  border: `2px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
                  background: active ? 'var(--primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {active && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--primary-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
