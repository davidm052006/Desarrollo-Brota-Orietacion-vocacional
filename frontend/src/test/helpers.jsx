// Ayudas compartidas por las pruebas de páginas.
import { screen, within } from '@testing-library/react';

// Los formularios del panel admin usan <label> sin htmlFor, con el input como
// hermano siguiente. Esto busca el control que va justo después del texto.
export function campo(texto, contenedor = document.body) {
  const label = within(contenedor).getAllByText((_, el) => el?.tagName === 'LABEL' && el.textContent.replace('*', '').trim() === texto)[0];
  return label.nextElementSibling;
}

// Respuesta exitosa típica de los servicios (forma de parseResponse)
export const ok = (data, meta) => ({ success: true, data, ...(meta && { meta }) });
export const falla = (error) => ({ success: false, error });

// El modal genérico del admin: el título es un h3/h2 dentro del panel.
export const modal = (titulo) => screen.getByText(titulo).closest('div[class*="rounded"]').parentElement;
