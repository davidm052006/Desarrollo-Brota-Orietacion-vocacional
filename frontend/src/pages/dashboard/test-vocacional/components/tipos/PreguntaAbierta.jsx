import { normalizarTipo } from '../../../../../utils/tiposPregunta';

export default function PreguntaAbierta({ pregunta, seleccionadas, onSeleccionar }) {
  const esRespuestaCorta = normalizarTipo(pregunta.tipo) === 'respuesta_corta';

  return (
    <div style={{ marginTop: 24 }}>
      {esRespuestaCorta ? (
        <input
          type="text"
          maxLength={250}
          value={seleccionadas[0] ?? ''}
          onChange={e => onSeleccionar(e.target.value)}
          aria-label="Tu respuesta"
          placeholder="Escribe tu respuesta..."
          style={{
            width: '100%', boxSizing: 'border-box', padding: '14px 16px',
            border: '1px solid var(--line)', borderRadius: 12,
            background: 'var(--bg)', color: 'var(--ink)', font: 'inherit',
          }}
        />
      ) : (
        <textarea
          rows={5}
          value={seleccionadas[0] ?? ''}
          onChange={e => onSeleccionar(e.target.value)}
          aria-label="Tu respuesta"
          placeholder="Desarrolla tu respuesta..."
          style={{
            width: '100%', boxSizing: 'border-box', padding: '14px 16px',
            border: '1px solid var(--line)', borderRadius: 12,
            background: 'var(--bg)', color: 'var(--ink)', font: 'inherit',
            resize: 'vertical',
          }}
        />
      )}
      {esRespuestaCorta && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 11, margin: '5px 0 0', textAlign: 'right' }}>
          {(seleccionadas[0] ?? '').length}/250
        </p>
      )}
    </div>
  );
}
