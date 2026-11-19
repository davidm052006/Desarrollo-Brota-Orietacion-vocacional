// Explorador de programas (Profesiones): búsqueda con espera, filtros por
// área y modalidad, paginación "cargar más", detalle y comparador de hasta
// 3 programas. programasService es un stub.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const api = vi.hoisted(() => ({ obtenerProgramas: vi.fn(), obtenerEstadisticas: vi.fn() }));
vi.mock('../../services/programasService', () => api);

import Profesiones from './Profesiones';

const INST = { nombre: 'SENA', ciudad: 'Cali', tipo: 'Pública', telefono: '6025550000', email: 'info@sena.edu.co', sitio_web: 'https://sena.edu.co' };
const prog = (id, extra = {}) => ({
  id, nombre: `Programa ${id}`, area_academica: 'tecnologia', modalidad: 'Presencial', duracion: '6 semestres',
  tipo: 'Tecnólogo', descripcion: `Descripción ${id}`, codigo_snies: `S-${id}`, instituciones: INST, ...extra,
});

async function montar() {
  const user = userEvent.setup();
  render(<Profesiones />);
  await screen.findByText('Programa 1');
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  api.obtenerEstadisticas.mockResolvedValue({ success: true, total: 12000, areas: [{ area: 'tecnologia', total: 3000 }] });
  api.obtenerProgramas.mockResolvedValue({
    success: true, total: 30, totalPages: 2,
    data: [prog(1), prog(2, { modalidad: 'Virtual' }), prog(3), prog(4)],
  });
});

describe('listado y filtros', () => {
  it('carga estadísticas y la primera página de todas las áreas', async () => {
    await montar();
    expect(api.obtenerProgramas).toHaveBeenCalledWith({ area: 'todos', search: '', page: 1, limit: 24 });
    expect(screen.getByText((12000).toLocaleString('es-CO'), { exact: false })).toBeInTheDocument();
  });

  it('la búsqueda espera a que se deje de escribir y se puede borrar', async () => {
    const user = await montar();
    api.obtenerProgramas.mockClear();
    const caja = screen.getByPlaceholderText('Buscar por nombre de programa o institución…');
    await user.type(caja, 'enfer');
    expect(api.obtenerProgramas).not.toHaveBeenCalled();
    await waitFor(() => expect(api.obtenerProgramas).toHaveBeenCalledWith(expect.objectContaining({ search: 'enfer', page: 1 })));
    expect(api.obtenerProgramas).toHaveBeenCalledTimes(1);

    await user.click(caja.parentElement.querySelector('button'));
    expect(caja).toHaveValue('');
  });

  it('cambiar de área reinicia la búsqueda', async () => {
    const user = await montar();
    await user.click(screen.getAllByRole('button', { name: /Salud/ })[0]);
    await waitFor(() => expect(api.obtenerProgramas).toHaveBeenLastCalledWith({ area: 'salud', search: '', page: 1, limit: 24 }));
  });

  it('filtrar por modalidad es local; Limpiar quita todos los filtros', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: 'Virtual' }));
    expect(screen.getByText('Programa 2')).toBeInTheDocument();
    expect(screen.queryByText('Programa 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'A distancia' }));
    expect(screen.getByText(/No hay programas que/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(screen.getByText('Programa 1')).toBeInTheDocument();
  });

  it('"Cargar más" pide la página 2 y agrega los resultados', async () => {
    const user = await montar();
    api.obtenerProgramas.mockResolvedValueOnce({ success: true, total: 30, totalPages: 2, data: [prog(5)] });
    await user.click(screen.getByRole('button', { name: 'Cargar más programas ↓' }));
    expect(await screen.findByText('Programa 5')).toBeInTheDocument();
    expect(screen.getByText('Programa 1')).toBeInTheDocument();
    expect(api.obtenerProgramas).toHaveBeenLastCalledWith({ area: 'todos', search: '', page: 2, limit: 24 });
    expect(screen.queryByRole('button', { name: 'Cargar más programas ↓' })).not.toBeInTheDocument();
  });

  it('si la API falla no rompe la página', async () => {
    api.obtenerProgramas.mockResolvedValue({ success: false, data: [], total: 0 });
    api.obtenerEstadisticas.mockResolvedValue({ success: false });
    render(<Profesiones />);
    expect(await screen.findByText(/No hay programas que/)).toBeInTheDocument();
  });
});

describe('detalle', () => {
  it('abre el detalle con los datos de contacto de la institución y se cierra', async () => {
    const user = await montar();
    await user.click(screen.getByText('Programa 1'));
    expect(await screen.findByText('Descripción 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: INST.email })).toHaveAttribute('href', `mailto:${INST.email}`);
    expect(screen.getByRole('link', { name: INST.telefono })).toHaveAttribute('href', `tel:${INST.telefono}`);
    const cerrar = screen.getAllByRole('button', { name: 'Cerrar' });
    expect(cerrar).toHaveLength(2);
    await user.click(cerrar[0]);
    expect(screen.queryByText('Descripción 1')).not.toBeInTheDocument();
  });

  it('marcar "Comparar" no abre el detalle', async () => {
    const user = await montar();
    await user.click(within(screen.getByText('Programa 1').closest('[style]').parentElement).getAllByRole('checkbox')[0]);
    expect(screen.queryByText('Descripción 1')).not.toBeInTheDocument();
  });
});

describe('comparador', () => {
  const marcar = async (user, i) => user.click(screen.getAllByRole('checkbox', { name: 'Comparar' })[i]);

  it('permite máximo 3 programas y necesita al menos 2 para comparar', async () => {
    const user = await montar();
    await marcar(user, 0);
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comparar \(/ })).toBeDisabled();

    await marcar(user, 1);
    await marcar(user, 2);
    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: 'Comparar' })[3]).toBeDisabled();

    await marcar(user, 2);
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('abre la tabla comparativa y deja quitar programas', async () => {
    const user = await montar();
    await marcar(user, 0);
    await marcar(user, 1);
    await user.click(screen.getByRole('button', { name: /Comparar \(/ }));
    expect(screen.getByText('Comparar programas')).toBeInTheDocument();
    const tabla = () => document.querySelector('table');
    expect(within(tabla()).getByText('Institución')).toBeInTheDocument();
    expect(within(tabla()).getByText('Programa 1')).toBeInTheDocument();

    // Con 2 programas, quitar uno deja menos de 2 y el comparador se cierra
    await user.click(screen.getByRole('button', { name: 'Quitar Programa 1' }));
    expect(screen.queryByText('Comparar programas')).not.toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  it('se puede quitar desde la barra y limpiar todo', async () => {
    const user = await montar();
    await marcar(user, 0);
    await marcar(user, 1);
    await user.click(screen.getByRole('button', { name: 'Quitar Programa 2 de la comparación' }));
    expect(screen.getByText('1/3')).toBeInTheDocument();
    const barra = screen.getByText('1/3').parentElement;
    await user.click(within(barra).getByRole('button', { name: 'Limpiar' }));
    expect(screen.queryByText('1/3')).not.toBeInTheDocument();
  });
});
