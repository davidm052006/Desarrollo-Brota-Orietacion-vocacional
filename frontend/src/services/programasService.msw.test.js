import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { obtenerProgramas } from './programasService';

// MSW es un fake de la red: responde HTTP sin backend ni Supabase reales.
const endpoint = 'http://localhost/api/programas';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Semana 5 / David — programasService con MSW', () => {
  it('devuelve datos y metadatos que la interfaz usa en la respuesta exitosa', async () => {
    // Arrange: stub HTTP de caso feliz.
    server.use(http.get(endpoint, () => HttpResponse.json({
      success: true, data: [{ id: 'p-1', nombre: 'Ingeniería' }],
      total: 1, page: 1, limit: 24, totalPages: 1,
    })));
    // Act
    const resultado = await obtenerProgramas({ area: 'tecnologia' });
    // Assert: estado observado por la UI.
    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual([{ id: 'p-1', nombre: 'Ingeniería' }]);
    expect(resultado.total).toBe(1);
  });

  it('reporta el error 500 sin presentar resultados como exitosos', async () => {
    // Arrange: stub HTTP que falla.
    server.use(http.get(endpoint, () => HttpResponse.json({ success: false, error: 'Servicio no disponible' }, { status: 500 })));
    // Act
    const resultado = await obtenerProgramas();
    // Assert
    expect(resultado.success).toBe(false);
    expect(resultado.error).toBe('Servicio no disponible');
  });

  it('entrega el mensaje de validación 422', async () => {
    // Arrange: stub de validación HTTP.
    server.use(http.get(endpoint, () => HttpResponse.json({ success: false, error: 'Filtro inválido' }, { status: 422 })));
    // Act
    const resultado = await obtenerProgramas({ search: '###' });
    // Assert
    expect(resultado.success).toBe(false);
    expect(resultado.error).toBe('Filtro inválido');
  });

  it('no rompe la interfaz cuando el servidor responde HTML en vez de JSON', async () => {
    // Arrange: fake de respuesta no JSON.
    server.use(http.get(endpoint, () => new HttpResponse('<html>Error</html>', { status: 502, headers: { 'Content-Type': 'text/html' } })));
    // Act
    const resultado = await obtenerProgramas();
    // Assert: el servicio devuelve un estado seguro para la interfaz.
    expect(resultado).toMatchObject({ success: false, data: [], total: 0 });
  });
});
