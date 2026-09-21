import { describe, expect, it } from 'vitest';
import { TIPOS_PREGUNTA, esPreguntaAbierta, esPreguntaUnica } from './tiposPregunta';

describe('tipos de pregunta', () => {
  it('expone tipos cerrados y abiertos para instituciones', () => {
    expect(TIPOS_PREGUNTA.map(tipo => tipo.value)).toEqual([
      'opcion_multiple', 'likert', 'respuesta_corta', 'respuesta_larga',
    ]);
    expect(esPreguntaAbierta('respuesta_corta')).toBe(true);
    expect(esPreguntaAbierta('respuesta_larga')).toBe(true);
    expect(esPreguntaAbierta('likert')).toBe(false);
  });

  it('identifica las preguntas de selección única', () => {
    expect(esPreguntaUnica('likert')).toBe(true);
    expect(esPreguntaUnica('single')).toBe(true);
    expect(esPreguntaUnica('opcion_multiple')).toBe(false);
  });
});
