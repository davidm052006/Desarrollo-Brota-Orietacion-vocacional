// Ayudas compartidas por las pruebas de páginas.
import { within } from '@testing-library/react';

// Los formularios del panel admin usan <label> sin htmlFor, con el input como
// hermano siguiente. Esto busca el control que va justo después del texto.
const limpio = (t) => t.replace('*', '').trim();
export function campo(texto, contenedor = document.body) {
  const label = within(contenedor).getAllByText((_, el) => el?.tagName === 'LABEL' && limpio(el.textContent) === limpio(texto))[0];
  return label.nextElementSibling;
}

// Respuesta exitosa típica de los servicios (forma de parseResponse)
export const ok = (data, meta) => ({ success: true, data, ...(meta && { meta }) });
export const falla = (error) => ({ success: false, error });

