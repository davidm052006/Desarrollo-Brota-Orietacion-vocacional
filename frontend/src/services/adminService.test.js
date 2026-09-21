import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as adminService from './adminService';
import * as apiClient from './apiClient';

// createUsuariosMasivo hace UNA sola request a POST /api/admin/usuarios/masivo
// (el backend crea todas las filas, ver usuariosController.createUsuariosMasivo) —
// no hay un loop de fetch por fila, eso se eliminó en agosto 2026.
describe('createUsuariosMasivo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'getAuthHeaders').mockResolvedValue({ 'Content-Type': 'application/json' });
  });

  it('hace una sola request con el array completo de usuarios', async () => {
    const usuarios = [{ email: 'a@b.com' }, { email: 'c@d.com' }];
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        resultados: [
          { usuario: usuarios[0], success: true, error: null },
          { usuario: usuarios[1], success: true, error: null },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, opciones] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/admin/usuarios/masivo');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body)).toEqual({ usuarios });

    expect(res.success).toBe(true);
    expect(res.resultados).toHaveLength(2);
    expect(res.resultados.every(r => r.success)).toBe(true);
  });

  it('propaga fallos parciales por fila que reporta el backend', async () => {
    const usuarios = [{ email: 'ok@x.com' }, { email: 'bad@y.com' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        resultados: [
          { usuario: usuarios[0], success: true, error: null },
          { usuario: usuarios[1], success: false, error: 'Email duplicado dentro del archivo' },
        ],
      }),
    }));

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(res.success).toBe(true);
    expect(res.resultados[0].success).toBe(true);
    expect(res.resultados[1].success).toBe(false);
    expect(res.resultados[1].error).toBe('Email duplicado dentro del archivo');
  });

  it('reporta el mensaje del backend cuando la respuesta no es ok', async () => {
    const usuarios = [{ email: 'g@x.com' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'El archivo tiene demasiadas filas' }),
    }));

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(res.success).toBe(false);
    expect(res.error).toBe('El archivo tiene demasiadas filas');
    expect(res.resultados).toEqual([]);
  });

  it('reporta mensaje genérico cuando la respuesta no es ok y no trae message', async () => {
    const usuarios = [{ email: 'g@x.com' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    }));

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(res.success).toBe(false);
    expect(res.error).toBe('Error del servidor (502)');
    expect(res.resultados).toEqual([]);
  });

  it('reporta error de conexión cuando fetch rechaza', async () => {
    const usuarios = [{ email: 'net@x.com' }];
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(res.success).toBe(false);
    expect(res.error).toBe('Error de conexión con el servidor');
    expect(res.resultados).toEqual([]);
  });
});

describe('adminService convocatorias', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'getAuthHeaders').mockResolvedValue({ 'Content-Type': 'application/json' });
  });

  it('consulta convocatorias con paginación y búsqueda', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [], meta: { total: 0 } }),
    }));

    const respuesta = await adminService.getConvocatorias({ pagina: 2, busqueda: 'beca' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/convocatorias?pagina=2&limite=10&busqueda=beca'),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
    expect(respuesta.success).toBe(true);
  });

  it('envía la creación de una convocatoria', async () => {
    const convocatoria = { tipo: 'Beca', titulo: 'Beca SENA', institucion: 'SENA' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: 'c-1', ...convocatoria } }),
    }));

    const respuesta = await adminService.createConvocatoria(convocatoria);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/convocatorias'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(convocatoria) }),
    );
    expect(respuesta.data.id).toBe('c-1');
  });
});
