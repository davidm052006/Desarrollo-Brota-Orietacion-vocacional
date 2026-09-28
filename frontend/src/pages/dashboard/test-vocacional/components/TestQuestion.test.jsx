import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import TestQuestion from './TestQuestion';

// Verifica el despacho por tipo, no el diseño de cada vista: que cualquiera de
// los vocabularios que conviven en la base (`single`/`seleccion`/`multiple` y
// las claves canónicas) llegue a la vista correcta y nunca deje la pregunta en
// blanco. El render fino de cada tipo lo cubren los tests de `tipos/`.

const preguntaCon = (tipo) => ({
  id: 'p1',
  texto: '¿Qué prefieres?',
  tipo,
  categoria: 'tecnologia',
  opciones: [
    { id: 'o1', label: 'Programar', icon: '💻', orden: 0 },
    { id: 'o2', label: 'Dibujar',   icon: '🎨', orden: 1 },
  ],
});

const AYUDA_MULTIPLE = /Puedes seleccionar varias opciones/i;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TestQuestion (dispatcher por tipo)', () => {
  it.each(['opcion_unica', 'single', 'seleccion'])(
    'renderiza %s como selección única',
    (tipo) => {
      render(<TestQuestion pregunta={preguntaCon(tipo)} />);

      expect(screen.getByRole('button', { name: /Programar/i })).toBeTruthy();
      expect(screen.getByText(/Elige la opción que mejor te represente/i)).toBeTruthy();
      expect(screen.queryByText(AYUDA_MULTIPLE)).toBeNull();
    }
  );

  it.each(['opcion_multiple', 'multiple'])(
    'renderiza %s como selección múltiple',
    (tipo) => {
      render(<TestQuestion pregunta={preguntaCon(tipo)} />);

      expect(screen.getByRole('button', { name: /Programar/i })).toBeTruthy();
      expect(screen.getByText(/Selecciona todas las opciones que apliquen/i)).toBeTruthy();
      expect(screen.getByText(AYUDA_MULTIPLE)).toBeTruthy();
    }
  );

  it('renderiza likert como escala, no como grilla de botones', () => {
    render(<TestQuestion pregunta={preguntaCon('likert')} />);

    // La escala pinta las etiquetas sin envolverlas en <button>.
    expect(screen.getByText('Programar')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Programar/i })).toBeNull();
    expect(screen.queryByText(AYUDA_MULTIPLE)).toBeNull();
  });

  it('un tipo desconocido cae a opción única en vez de dejar la pregunta vacía', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<TestQuestion pregunta={preguntaCon('cualquier_cosa')} />);

    expect(screen.getByRole('button', { name: /Programar/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Dibujar/i })).toBeTruthy();
    expect(warn).toHaveBeenCalled();
  });

  it('una pregunta sin opciones no rompe el render (header y navegación siguen)', () => {
    render(<TestQuestion pregunta={{ ...preguntaCon('opcion_unica'), opciones: undefined }} />);

    expect(screen.getByText(/¿Qué/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Siguiente/i })).toBeTruthy();
  });
});
