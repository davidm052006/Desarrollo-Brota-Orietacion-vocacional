import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  TIPOS_PREGUNTA,
  TIPO_POR_DEFECTO,
  OPCIONES_TIPO,
  normalizarTipo,
  esTipoValido,
  esSeleccionMultiple,
  getTipoInfo,
} from './tiposPregunta';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalizarTipo', () => {
  it('deja pasar las claves canónicas', () => {
    expect(normalizarTipo('opcion_unica')).toBe('opcion_unica');
    expect(normalizarTipo('opcion_multiple')).toBe('opcion_multiple');
    expect(normalizarTipo('likert')).toBe('likert');
  });

  it('traduce los alias legados que ya están en la base', () => {
    expect(normalizarTipo('single')).toBe('opcion_unica');
    expect(normalizarTipo('seleccion')).toBe('opcion_unica');
    expect(normalizarTipo('multiple')).toBe('opcion_multiple');
  });

  it('tolera espacios y mayúsculas', () => {
    expect(normalizarTipo('  Single ')).toBe('opcion_unica');
    expect(normalizarTipo('OPCION_MULTIPLE')).toBe('opcion_multiple');
  });

  it('cae al tipo por defecto con console.warn si el tipo es desconocido', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizarTipo('cualquier_cosa')).toBe(TIPO_POR_DEFECTO);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('cae al tipo por defecto sin ruido si no hay tipo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizarTipo(undefined)).toBe(TIPO_POR_DEFECTO);
    expect(normalizarTipo(null)).toBe(TIPO_POR_DEFECTO);
    expect(normalizarTipo('')).toBe(TIPO_POR_DEFECTO);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('esTipoValido', () => {
  it('acepta canónicos y alias', () => {
    ['opcion_unica', 'opcion_multiple', 'likert', 'single', 'seleccion', 'multiple']
      .forEach(t => expect(esTipoValido(t)).toBe(true));
  });

  it('rechaza desconocidos y no-strings', () => {
    [ 'cualquier_cosa', '', undefined, null, 3 ]
      .forEach(t => expect(esTipoValido(t)).toBe(false));
  });
});

describe('esSeleccionMultiple', () => {
  it('solo es true para opcion_multiple y su alias', () => {
    expect(esSeleccionMultiple('opcion_multiple')).toBe(true);
    expect(esSeleccionMultiple('multiple')).toBe(true);
  });

  it('es false para única, likert y sus alias', () => {
    ['opcion_unica', 'single', 'seleccion', 'likert']
      .forEach(t => expect(esSeleccionMultiple(t)).toBe(false));
  });

  it('un tipo desconocido no habilita selección múltiple', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(esSeleccionMultiple('cualquier_cosa')).toBe(false);
  });
});

describe('catálogo', () => {
  it('getTipoInfo siempre devuelve metadata usable', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = getTipoInfo('cualquier_cosa');
    expect(info.clave).toBe(TIPO_POR_DEFECTO);
    expect(typeof info.label).toBe('string');
    expect(typeof info.descripcion).toBe('string');
  });

  it('OPCIONES_TIPO cubre todo el catálogo y sirve para un <select>', () => {
    expect(OPCIONES_TIPO).toHaveLength(Object.keys(TIPOS_PREGUNTA).length);
    OPCIONES_TIPO.forEach(({ value, label, descripcion }) => {
      expect(TIPOS_PREGUNTA[value]).toBeDefined();
      expect(label).toBeTruthy();
      expect(descripcion).toBeTruthy();
    });
  });
});
