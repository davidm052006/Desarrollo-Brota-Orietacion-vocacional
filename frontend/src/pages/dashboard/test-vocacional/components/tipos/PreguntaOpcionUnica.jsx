import { ESTILOS_TIPOS } from './estilos';

// Vista de "opción única": una columna de tarjetas altas con indicador
// circular (radio). Elegir una reemplaza la anterior — el toggle real lo hace
// `TestVocacional.toggleOpcion`, que ya consulta `esSeleccionMultiple(tipo)`.
//
// Contrato compartido con las otras vistas: recibe
// { pregunta, opciones, seleccionadas, onSeleccionar } y devuelve solo el
// cuerpo de opciones; el header y la navegación los pone TestQuestion.

export default function PreguntaOpcionUnica({ opciones = [], seleccionadas = [], onSeleccionar }) {
  return (
    <>
      <style>{ESTILOS_TIPOS}</style>
      <div className="bq-unica" role="radiogroup" aria-label="Elige una opción">
        {opciones.map(o => {
          const active = seleccionadas.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSeleccionar(o.id)}
              className="bq-opt"
              style={{
                border: `2px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
                background: active ? 'var(--primary-soft)' : 'var(--surface-2)',
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                background: active ? 'var(--primary-soft)' : 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21,
              }}>
                {o.icon ?? '•'}
              </div>
              <span style={{
                flex: 1, fontSize: 14.5, lineHeight: 1.35,
                color: active ? 'var(--primary-deep)' : 'var(--ink)',
                fontWeight: active ? 600 : 400,
              }}>
                {o.label}
              </span>
              {/* Indicador circular: punto relleno, sin check — lo que distingue
                  visualmente "elegís una" de "marcás varias". */}
              <span
                aria-hidden="true"
                style={{
                  width: 22, height: 22, flexShrink: 0, borderRadius: '50%',
                  border: `2px solid ${active ? 'var(--primary)' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {active && (
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--primary)' }} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
