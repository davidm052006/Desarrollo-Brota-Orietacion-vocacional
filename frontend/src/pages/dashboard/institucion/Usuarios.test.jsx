// Estudiantes de una institución: listar, buscar, crear, eliminar y carga
// masiva. Layout reemplazado por un contenedor; institucionService es stub.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { campo, ok, falla } from '../../../test/helpers';

vi.mock('../../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('./components/InstitucionNav', () => ({ default: () => null }));
vi.mock('../../../services/perfilService', () => ({ obtenerPerfil: vi.fn().mockResolvedValue({ success: false }) }));

const api = vi.hoisted(() => ({
  getUsuarios: vi.fn(),
  createUsuario: vi.fn(),
  deleteUsuario: vi.fn(),
  createUsuariosMasivo: vi.fn(),
}));
vi.mock('../../../services/institucionService', () => api);

import Usuarios from './Usuarios';

async function montar() {
  const user = userEvent.setup();
  render(<Usuarios user={{ id: 'inst-1' }} />);
  await screen.findByText('Ana Ruiz');
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  api.getUsuarios.mockResolvedValue(ok([{ id: 'e1', nombre: 'Ana', apellido: 'Ruiz', ciudad: 'Cali', nivel_educativo: null }], { total: 1 }));
  api.createUsuario.mockResolvedValue(ok());
  api.deleteUsuario.mockResolvedValue(ok());
});
afterEach(() => vi.restoreAllMocks());

it('lista los estudiantes con el total', async () => {
  await montar();
  expect(screen.getByText('1 estudiante(s)')).toBeInTheDocument();
  expect(screen.getByText('Cali · —')).toBeInTheDocument();
});

it('sin estudiantes lo dice', async () => {
  api.getUsuarios.mockResolvedValue(ok([]));
  render(<Usuarios user={{ id: 'inst-1' }} />);
  expect(await screen.findByText('Todavía no creaste estudiantes.')).toBeInTheDocument();
});

it('buscar vuelve a consultar con el texto', async () => {
  const user = await montar();
  await user.type(screen.getByPlaceholderText('Buscar por nombre...'), 'ana');
  await waitFor(() => expect(api.getUsuarios).toHaveBeenLastCalledWith({ busqueda: 'ana' }));
});

describe('nuevo estudiante', () => {
  it('exige los campos obligatorios', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: '+ Nuevo' }));
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    expect(screen.getByText('Email, contraseña, nombre y apellido son obligatorios')).toBeInTheDocument();
    expect(api.createUsuario).not.toHaveBeenCalled();
  });

  it('crea, cierra el modal y recarga; si falla muestra el error', async () => {
    api.createUsuario.mockResolvedValueOnce(falla('El correo ya existe'));
    const user = await montar();
    await user.click(screen.getByRole('button', { name: '+ Nuevo' }));
    await user.type(campo('Email'), 'luis@colegio.co');
    await user.type(campo('Contraseña'), 'Clave1234');
    await user.type(campo('Nombre'), 'Luis');
    await user.type(campo('Apellido'), 'Paz');
    await user.type(campo('Ciudad'), 'Cali');
    await user.type(campo('Teléfono'), '300');
    await user.selectOptions(campo('Grado'), 'Once');
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    expect(await screen.findByText('El correo ya existe')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear' }));
    await waitFor(() => expect(screen.queryByText('Nuevo estudiante')).not.toBeInTheDocument());
    expect(api.createUsuario).toHaveBeenLastCalledWith(expect.objectContaining({ email: 'luis@colegio.co', nombre: 'Luis', grado: 'Once', ciudad: 'Cali' }));
  });

  it('cancelar cierra el modal', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: '+ Nuevo' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Nuevo estudiante')).not.toBeInTheDocument();
  });
});

it('eliminar pide confirmación', async () => {
  const user = await montar();
  window.confirm.mockReturnValueOnce(false);
  await user.click(screen.getByRole('button', { name: 'Eliminar' }));
  expect(api.deleteUsuario).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Eliminar' }));
  await waitFor(() => expect(api.deleteUsuario).toHaveBeenCalledWith('e1'));
});

describe('carga masiva', () => {
  const csv = 'email,password,nombre,apellido,ciudad,telefono,nivel_educativo,grado,fecha_nacimiento\n'
    + 'a@x.co,Clave123,Ana,Gil,Cali,1,Tecnico,Once,2009-01-01\nb@x.co,Clave123,Bea,Sol,Cali,2,Tecnico,Once,2009-01-01\n';

  it('importa el CSV y muestra el reporte', async () => {
    api.createUsuariosMasivo.mockResolvedValue({ success: true, resultados: [
      { usuario: { email: 'a@x.co' }, success: true },
      { usuario: { email: 'b@x.co' }, success: false, error: 'Correo repetido' },
    ] });
    const user = await montar();
    await user.click(screen.getByRole('button', { name: '⇪ Carga masiva' }));
    expect(screen.getByRole('button', { name: /^Importar/ })).toBeDisabled();
    await user.upload(document.querySelector('input[type="file"]'), new File([csv], 'est.csv', { type: 'text/csv' }));
    expect(await screen.findByText('2 fila(s) detectada(s)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Importar 2' }));

    expect(await screen.findByText('1 creado(s), 1 con error.')).toBeInTheDocument();
    expect(screen.getByText('Correo repetido')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByText('Carga masiva de estudiantes')).not.toBeInTheDocument();
  });

  it('un error de la importación se muestra', async () => {
    api.createUsuariosMasivo.mockResolvedValue({ success: false, error: 'Archivo muy grande', resultados: [] });
    const user = await montar();
    await user.click(screen.getByRole('button', { name: '⇪ Carga masiva' }));
    await user.upload(document.querySelector('input[type="file"]'), new File([csv], 'est.csv', { type: 'text/csv' }));
    await user.click(await screen.findByRole('button', { name: 'Importar 2' }));
    expect(await screen.findByText('Archivo muy grande')).toBeInTheDocument();
  });
});
