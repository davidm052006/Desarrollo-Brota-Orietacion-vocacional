import { afterEach, describe, expect, it, vi } from 'vitest';
import { obtenerProgramas } from './programasService';

// Red simulada sin servicio externo ni dependencias nuevas.
afterEach(() => vi.unstubAllGlobals());

function simularRespuesta(body, status = 200, contentType = 'application/json') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => contentType },
    json: async () => body,
  }));
}

describe('Semana 5 / David — contrato HTTP de programasService', () => {
  it('devuelve datos y metadatos de una respuesta exitosa', async () => {
    simularRespuesta({ success: true, data: [{ id: 'p-1', nombre: 'Ingeniería' }], total: 1, page: 1, limit: 24, totalPages: 1 });
    const resultado = await obtenerProgramas({ area: 'tecnologia' });
    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual([{ id: 'p-1', nombre: 'Ingeniería' }]);
    expect(resultado.total).toBe(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('area=tecnologia'));
  });

  it('reporta un error 500 sin presentar resultados como exitosos', async () => {
    simularRespuesta({ success: false, error: 'Servicio no disponible' }, 500);
    const resultado = await obtenerProgramas();
    expect(resultado.success).toBe(false);
    expect(resultado.error).toBe('Servicio no disponible');
  });

  it('entrega el mensaje de validación 422', async () => {
    simularRespuesta({ success: false, error: 'Filtro inválido' }, 422);
    const resultado = await obtenerProgramas({ search: '###' });
    expect(resultado.success).toBe(false);
    expect(resultado.error).toBe('Filtro inválido');
  });

  it('no rompe la interfaz si el servidor responde HTML', async () => {
    simularRespuesta(null, 502, 'text/html');
    const resultado = await obtenerProgramas();
    expect(resultado).toMatchObject({ success: false, data: [], total: 0 });
  });
});
