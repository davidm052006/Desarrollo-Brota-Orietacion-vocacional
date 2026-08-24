import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as adminService from './adminService';
import * as apiClient from './apiClient';

describe('createUsuariosMasivo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock getAuthHeaders to avoid supabase calls
    vi.spyOn(apiClient, 'getAuthHeaders').mockResolvedValue({ 'Content-Type': 'application/json' });
  });

  it('devuelve resultados con success=true cuando todas las filas exitosas', async () => {
    const usuarios = [ { email: 'a@b.com' }, { email: 'c@d.com' } ];
    // Mock fetch to simulate successful POST
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'u1' } }) }));

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(res.success).toBe(true);
    expect(res.resultados).toHaveLength(2);
    expect(res.resultados.every(r => r.success)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('incluye errores por fila cuando createUsuario falla en algunas filas', async () => {
    const usuarios = [ { email: 'ok@x.com' }, { email: 'bad@y.com' } ];
    // Make fetch return success for first, failure for second
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: 'ok' } }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'invalid' }) });
    vi.stubGlobal('fetch', mockFetch);

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(res.success).toBe(true);
    expect(res.resultados).toHaveLength(2);
    expect(res.resultados[0].success).toBe(true);
    expect(res.resultados[1].success).toBe(false);
    expect(res.resultados[1].error).toBe('invalid');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('reporta error de conexión por fila cuando fetch rechaza', async () => {
    const usuarios = [ { email: 'net@x.com' } ];
    // Simular fallo de red
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(res.success).toBe(true);
    expect(res.resultados).toHaveLength(1);
    expect(res.resultados[0].success).toBe(false);
    expect(res.resultados[0].error).toBe('Error de conexión con el servidor');
    // debe incluir la fila original
    expect(res.resultados[0].usuario).toEqual(usuarios[0]);
  });

  it('reporta mensaje genérico cuando backend responde sin message', async () => {
    const usuarios = [ { email: 'g@x.com' } ];
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({}) });
    vi.stubGlobal('fetch', mockFetch);

    const res = await adminService.createUsuariosMasivo(usuarios);

    expect(res.success).toBe(true);
    expect(res.resultados).toHaveLength(1);
    expect(res.resultados[0].success).toBe(false);
    expect(res.resultados[0].error).toBe('Error del servidor (502)');
    expect(res.resultados[0].usuario).toEqual(usuarios[0]);
  });
});
