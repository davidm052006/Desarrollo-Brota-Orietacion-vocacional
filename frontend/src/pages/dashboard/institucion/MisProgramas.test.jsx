// Semana 6 · Parte 4 (umbral 70%) · Julian
// Cuenta institución: lista de sus programas y edición de lo único que
// puede tocar (descripción, requisitos, costo, activo). Servicios stub.
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ok, falla, campo } from '../../../test/helpers';

vi.mock('../../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const perfil = vi.hoisted(() => ({ obtenerPerfil: vi.fn() }));
const inst = vi.hoisted(() => ({ getMisProgramas: vi.fn(), actualizarMiPrograma: vi.fn() }));
vi.mock('../../../services/perfilService', () => perfil);
vi.mock('../../../services/institucionService', () => inst);

import MisProgramas from './MisProgramas';

const PROGRAMAS = [
  { id: 'p1', nombre: 'Ingeniería de Sistemas', tipo: 'Pregrado', area_academica: 'tecnologia', descripcion: 'Software', requisitos: '', costo_matricula: 4000000, activo: true },
  { id: 'p2', nombre: 'Técnico en Cocina', tipo: 'Técnico', area_academica: null, descripcion: null, requisitos: null, costo_matricula: null, activo: false },
];

function montar(user = { id: 'u1' }) {
  const usuario = userEvent.setup();
  render(<MemoryRouter><MisProgramas user={user} /></MemoryRouter>);
  return usuario;
}

beforeEach(() => {
  vi.clearAllMocks();
  perfil.obtenerPerfil.mockResolvedValue(ok({ id: 'per1', rol: 'institucion' }));
  inst.getMisProgramas.mockResolvedValue(ok(PROGRAMAS));
  inst.actualizarMiPrograma.mockResolvedValue({ success: true });
});

it('lista los programas con su estado y "Sin área" cuando falta', async () => {
  montar();

  expect(await screen.findByText('Ingeniería de Sistemas')).toBeInTheDocument();
  expect(screen.getByText('Pregrado · tecnologia')).toBeInTheDocument();
  expect(screen.getByText('Técnico · Sin área')).toBeInTheDocument();
  expect(screen.getByText('Inactivo')).toBeInTheDocument();
  expect(perfil.obtenerPerfil).toHaveBeenCalledWith('u1');
});

it('sin programas lo dice', async () => {
  inst.getMisProgramas.mockResolvedValue(ok([]));
  montar();

  expect(await screen.findByText('Todavía no hay programas de tu institución en el catálogo.')).toBeInTheDocument();
});

it('si la lista falla muestra el aviso vacío; sin sesión no pide el perfil', async () => {
  inst.getMisProgramas.mockResolvedValue(falla('x'));
  montar(null);

  expect(await screen.findByText('Todavía no hay programas de tu institución en el catálogo.')).toBeInTheDocument();
  expect(perfil.obtenerPerfil).not.toHaveBeenCalled();
});

it('editar guarda los cambios, cierra el formulario y recarga la lista', async () => {
  const user = montar();
  await screen.findByText('Técnico en Cocina');
  const [, editarCocina] = screen.getAllByRole('button', { name: 'Editar' });

  await user.click(editarCocina);
  await user.type(campo('Descripción'), 'Cocina colombiana');
  await user.type(campo('Requisitos'), 'Bachiller');
  await user.type(campo('Costo matrícula'), '900000');
  await user.click(screen.getByRole('checkbox', { name: 'Activo' }));
  await user.click(screen.getByRole('button', { name: 'Guardar' }));

  expect(inst.actualizarMiPrograma).toHaveBeenCalledWith('p2', {
    descripcion: 'Cocina colombiana', requisitos: 'Bachiller', costo_matricula: '900000', activo: true,
  });
  expect(await screen.findAllByRole('button', { name: 'Editar' })).toHaveLength(2);
  expect(inst.getMisProgramas).toHaveBeenCalledTimes(2);
});

it('si guardar falla muestra el error y deja el formulario abierto', async () => {
  inst.actualizarMiPrograma.mockResolvedValue({ success: false, error: 'No es tu programa' });
  const user = montar();
  await user.click((await screen.findAllByRole('button', { name: 'Editar' }))[0]);

  expect(campo('Descripción')).toHaveValue('Software');
  await user.click(screen.getByRole('button', { name: 'Guardar' }));

  expect(await screen.findByText('No es tu programa')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  expect(inst.getMisProgramas).toHaveBeenCalledTimes(1);
});

it('Cerrar oculta el formulario sin guardar', async () => {
  const user = montar();
  await user.click((await screen.findAllByRole('button', { name: 'Editar' }))[0]);
  await user.click(screen.getByRole('button', { name: 'Cerrar' }));

  expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull();
  expect(inst.actualizarMiPrograma).not.toHaveBeenCalled();
});
