// Secciones secundarias del panel admin: sincronización MEN, solicitudes de
// contacto, moderación de preguntas de comunidad y analíticas. Servicios y
// gráficas son stubs (chart.js no dibuja en jsdom).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ok, falla } from '../../../../test/helpers';

const admin = vi.hoisted(() => ({
  getSincronizacionEstado: vi.fn(),
  ejecutarSincronizacion: vi.fn(),
  getPreguntasComunidad: vi.fn(),
  deletePreguntaComunidad: vi.fn(),
  getAnalytics: vi.fn(),
}));
vi.mock('../../../../services/adminService', () => admin);

const contacto = vi.hoisted(() => ({ getContactos: vi.fn(), actualizarContacto: vi.fn() }));
vi.mock('../../../../services/contactoService', () => contacto);

const pdf = vi.hoisted(() => ({ exportarElementoAPDF: vi.fn().mockResolvedValue() }));
vi.mock('../../../../utils/exportarPDF', () => pdf);

vi.mock('react-chartjs-2', () => ({
  Radar: ({ data }) => <div data-testid="radar">{data.datasets[0].data.join(',')}</div>,
  Bar: ({ data }) => <div data-testid="barras">{data.datasets[0].data.join(',')}</div>,
}));

import ConfiguracionSection from './ConfiguracionSection';
import ContactosSection from './ContactosSection';
import PreguntasComunidadSection from './PreguntasComunidadSection';
import AnaliticasSection from './AnaliticasSection';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => vi.restoreAllMocks());

describe('ConfiguracionSection (sincronización MEN)', () => {
  const ESTADO = { hayActualizacion: false, programasImportados: 12345, institucionesImportadas: 300, remoteDate: '2026-11-01T00:00:00Z' };

  it('muestra el estado actual de la base', async () => {
    admin.getSincronizacionEstado.mockResolvedValue(ok(ESTADO));
    render(<ConfiguracionSection />);
    expect(await screen.findByText('Al día')).toBeInTheDocument();
    expect(screen.getByText((12345).toLocaleString('es-CO'))).toBeInTheDocument();
  });

  it('verificar informa si hay datos nuevos o si falla la conexión', async () => {
    admin.getSincronizacionEstado.mockResolvedValueOnce(ok(ESTADO))
      .mockResolvedValueOnce(ok({ ...ESTADO, hayActualizacion: true }))
      .mockResolvedValueOnce(falla('x'));
    const user = userEvent.setup();
    render(<ConfiguracionSection />);
    await screen.findByText('Al día');
    await user.click(screen.getByRole('button', { name: 'Verificar actualizaciones' }));
    expect(await screen.findByText('Hay datos nuevos disponibles en la API del MEN.')).toBeInTheDocument();
    expect(screen.getByText('Actualización disponible')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Verificar actualizaciones' }));
    expect(await screen.findByText('No se pudo conectar con la API del MEN.')).toBeInTheDocument();
  });

  it('verificar sin novedades lo dice', async () => {
    admin.getSincronizacionEstado.mockResolvedValue(ok(ESTADO));
    const user = userEvent.setup();
    render(<ConfiguracionSection />);
    await user.click(await screen.findByRole('button', { name: 'Verificar actualizaciones' }));
    expect(await screen.findByText(/ya están al día/)).toBeInTheDocument();
  });

  it('sincronizar pide confirmación y reporta el resultado', async () => {
    admin.getSincronizacionEstado.mockResolvedValue(ok(ESTADO));
    admin.ejecutarSincronizacion.mockResolvedValueOnce(ok({ programasImportados: 10, institucionesImportadas: 2, duracionSegundos: 5 }))
      .mockResolvedValueOnce(falla('Timeout del MEN'));
    const user = userEvent.setup();
    render(<ConfiguracionSection />);
    await screen.findByText('Al día');

    window.confirm.mockReturnValueOnce(false);
    await user.click(screen.getByRole('button', { name: 'Sincronizar ahora' }));
    expect(admin.ejecutarSincronizacion).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Sincronizar ahora' }));
    expect(await screen.findByText(/Sincronización exitosa: 10 programas y 2 instituciones/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sincronizar ahora' }));
    expect(await screen.findByText('Timeout del MEN')).toBeInTheDocument();
  });
});

describe('ContactosSection', () => {
  const PENDIENTE = { id: 1, nombre: 'Colegio Sol', email: 'sol@x.co', telefono: '311', asunto: 'Alianzas institucionales', mensaje: 'Queremos usar Brota', estado: 'pendiente', created_at: '2026-11-10T00:00:00Z' };
  const ARCHIVADO = { id: 2, nombre: 'Pedro', email: 'p@x.co', asunto: 'Soporte', mensaje: 'Hola', estado: 'archivado' };

  beforeEach(() => {
    contacto.getContactos.mockResolvedValue({ success: true, data: [PENDIENTE, ARCHIVADO], meta: { total: 2, totalPaginas: 2 } });
    contacto.actualizarContacto.mockResolvedValue({ success: true });
  });

  it('lista las solicitudes con el contador de pendientes', async () => {
    render(<ContactosSection />);
    expect(await screen.findByText('Colegio Sol')).toBeInTheDocument();
    expect(screen.getByText('· 1 sin leer')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
  });

  it('filtrar por estado y paginar consultan de nuevo', async () => {
    const user = userEvent.setup();
    render(<ContactosSection />);
    await screen.findByText('Colegio Sol');
    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    await waitFor(() => expect(contacto.getContactos).toHaveBeenLastCalledWith({ estado: 'archivado', pagina: 1, limite: 20 }));
    await user.click(await screen.findByRole('button', { name: 'Siguiente →' }));
    await waitFor(() => expect(contacto.getContactos).toHaveBeenLastCalledWith({ estado: 'archivado', pagina: 2, limite: 20 }));
  });

  it('error y lista vacía', async () => {
    contacto.getContactos.mockResolvedValueOnce({ success: false, error: 'Sin permiso' });
    const { unmount } = render(<ContactosSection />);
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument();
    unmount();
    contacto.getContactos.mockResolvedValueOnce({ success: true, data: [], meta: { total: 0, totalPaginas: 1 } });
    render(<ContactosSection />);
    expect(await screen.findByText(/No hay solicitudes/)).toBeInTheDocument();
  });

  it('abrir una pendiente la marca como leída; se pueden guardar notas y cambiar estado', async () => {
    const onCrearCredenciales = vi.fn();
    const user = userEvent.setup();
    render(<ContactosSection onCrearCredenciales={onCrearCredenciales} />);
    await user.click(await screen.findByText('Colegio Sol'));
    expect(contacto.actualizarContacto).toHaveBeenCalledWith(1, { estado: 'leido' });

    await user.type(screen.getByPlaceholderText('Agrega notas sobre esta solicitud...'), 'Llamar el lunes');
    await user.click(screen.getByRole('button', { name: 'Guardar notas' }));
    expect(await screen.findByText('Guardado')).toBeInTheDocument();
    expect(contacto.actualizarContacto).toHaveBeenCalledWith(1, { notas_admin: 'Llamar el lunes' });

    await user.click(screen.getByRole('button', { name: /Marcar como respondido/ }));
    expect(contacto.actualizarContacto).toHaveBeenCalledWith(1, { estado: 'respondido' });
    await user.click(screen.getByRole('button', { name: /Archivar/ }));
    expect(contacto.actualizarContacto).toHaveBeenCalledWith(1, { estado: 'archivado' });
    await user.click(screen.getByRole('button', { name: /Dar credenciales/ }));
    expect(onCrearCredenciales).toHaveBeenCalledWith(PENDIENTE);
  });

  it('una archivada se puede reabrir', async () => {
    const user = userEvent.setup();
    render(<ContactosSection />);
    await user.click(await screen.findByText('Pedro'));
    const card = screen.getByText('Pedro').closest('button').parentElement;
    const botones = within(card).getAllByRole('button').map((b) => b.textContent);
    expect(botones.some((t) => /Archivar/.test(t))).toBe(false);
    await user.click(within(card).getAllByRole('button').at(-1));
    expect(contacto.actualizarContacto).toHaveBeenCalledWith(2, { estado: 'pendiente' });
  });
});

describe('PreguntasComunidadSection', () => {
  const PREGUNTAS = [
    { id: 'q1', titulo: '¿Medicina o enfermería?', area: 'salud', autor: 'Anónimo', reportes: 3, resuelta: false, respuestas: [] },
    { id: 'q2', titulo: '¿Qué estudiar?', area: 'general', autor: 'luz', reportes: 0, resuelta: true,
      respuestas: [{ id: 'r1', autor: 'ana', contenido: 'Lo que te guste', mejor: true }] },
  ];

  it('lista, expande respuestas y marca la mejor', async () => {
    admin.getPreguntasComunidad.mockResolvedValue(ok(PREGUNTAS));
    const user = userEvent.setup();
    render(<PreguntasComunidadSection />);
    expect(await screen.findByText('2 preguntas')).toBeInTheDocument();
    expect(screen.getByText('Abierta')).toBeInTheDocument();
    expect(screen.getByText('Resuelta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '1 ▼' }));
    expect(await screen.findByText('Lo que te guste')).toBeInTheDocument();
    expect(screen.getByText('★ Mejor respuesta')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '1 ▲' }));
    expect(screen.queryByText('Lo que te guste')).not.toBeInTheDocument();
  });

  it('eliminar: error se muestra, éxito recarga', async () => {
    admin.getPreguntasComunidad.mockResolvedValue(ok(PREGUNTAS));
    admin.deletePreguntaComunidad.mockResolvedValueOnce(falla('No existe')).mockResolvedValueOnce(ok());
    const user = userEvent.setup();
    render(<PreguntasComunidadSection />);
    await screen.findByText('2 preguntas');
    await user.click(screen.getAllByTitle('Eliminar')[0]);
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(await screen.findByText('No existe')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Sí, eliminar' })).not.toBeInTheDocument());
    expect(admin.deletePreguntaComunidad).toHaveBeenLastCalledWith('q1');
    expect(admin.getPreguntasComunidad).toHaveBeenCalledTimes(2);
  });

  it('sin preguntas muestra el vacío', async () => {
    admin.getPreguntasComunidad.mockResolvedValue(ok([]));
    render(<PreguntasComunidadSection />);
    expect(await screen.findByText('No hay preguntas publicadas')).toBeInTheDocument();
  });
});

describe('AnaliticasSection', () => {
  it('grafica promedio y conteo por categoría y exporta a PDF', async () => {
    admin.getAnalytics.mockResolvedValue(ok({
      totalResultados: 7,
      promedioPorCategoria: { tecnologia: 80, salud: 40 },
      conteoPorCategoria: { tecnologia: 5, salud: 2 },
    }));
    const user = userEvent.setup();
    render(<AnaliticasSection />);
    expect(await screen.findByTestId('radar')).toHaveTextContent('80,40');
    expect(screen.getByTestId('barras')).toHaveTextContent('5,2');
    expect(screen.getByText(/Basado en 7 resultado/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Descargar PDF/ }));
    expect(pdf.exportarElementoAPDF).toHaveBeenCalledWith(expect.any(HTMLElement), 'brota-analiticas.pdf');
  });

  it('sin resultados explica que faltan tests', async () => {
    admin.getAnalytics.mockResolvedValue(ok({ totalResultados: 0, promedioPorCategoria: {}, conteoPorCategoria: {} }));
    render(<AnaliticasSection />);
    expect(await screen.findByText('Todavía no hay resultados de test suficientes')).toBeInTheDocument();
  });

  it('si falla muestra el error', async () => {
    admin.getAnalytics.mockResolvedValue(falla('Sin permiso'));
    render(<AnaliticasSection />);
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument();
  });
});
