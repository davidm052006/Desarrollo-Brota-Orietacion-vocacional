// Sección Usuarios del panel admin: listado, filtros, CRUD por modales,
// permisos/bloqueo y carga masiva por CSV. adminService es un stub.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { campo, ok, falla } from '../../../../test/helpers';

const api = vi.hoisted(() => ({
  getUsuarios: vi.fn(),
  updateUsuario: vi.fn(),
  deleteUsuario: vi.fn(),
  bloquearUsuario: vi.fn(),
  actualizarPermisosUsuario: vi.fn(),
  createUsuario: vi.fn(),
  createUsuariosMasivo: vi.fn(),
  getCatalogoPermisos: vi.fn(),
  getInstituciones: vi.fn(),
}));
vi.mock('../../../../services/adminService', () => api);

import UsuariosSection from './UsuariosSection';

const ANA = {
  id: 'u1', nombre: 'Ana', apellido: 'Ruiz', ciudad: 'Cali', telefono: '300', rol: 'estudiante',
  nivel_educativo: 'Tecnico', grado: 'Once', edad: 17, created_at: '2026-10-01T00:00:00Z', permisos_override: {},
};
const LUIS = { ...ANA, id: 'u2', nombre: 'Luis', apellido: 'Paz', rol: 'moderador', bloqueado_hasta: '2099-01-01T00:00:00Z' };
const META = { total: 2, pagina: 1, totalPaginas: 2 };

async function montar(props = {}) {
  const user = userEvent.setup();
  render(<UsuariosSection {...props} />);
  await screen.findByText('Ana Ruiz', { exact: false });
  return user;
}
const fila = (nombre) => screen.getByText(nombre, { exact: false }).closest('tr');

beforeEach(() => {
  vi.clearAllMocks();
  api.getUsuarios.mockResolvedValue(ok([ANA, LUIS], META));
  api.getCatalogoPermisos.mockResolvedValue(ok({
    recursos: ['comunidad.publicar', 'comunidad.comentar'],
    porRol: { estudiante: ['comunidad.publicar', 'comunidad.comentar'], moderador: ['comunidad.publicar'] },
  }));
  api.getInstituciones.mockResolvedValue(ok([{ id: 9, nombre: 'SENA Cali', ciudad: 'Cali' }]));
});

describe('listado', () => {
  it('muestra los usuarios y el total registrado', async () => {
    await montar();
    expect(screen.getByText('2 usuarios registrados')).toBeInTheDocument();
    expect(api.getUsuarios).toHaveBeenCalledWith({ pagina: 1, busqueda: '', rol: '' });
  });

  it('filtrar por rol vuelve a pedir la lista desde la página 1', async () => {
    const user = await montar();
    await user.selectOptions(screen.getByDisplayValue('Todos los roles'), 'moderador');
    await waitFor(() => expect(api.getUsuarios).toHaveBeenLastCalledWith({ pagina: 1, busqueda: '', rol: 'moderador' }));
  });

  it('la búsqueda espera a que se deje de escribir', async () => {
    const user = await montar();
    api.getUsuarios.mockClear();
    await user.type(screen.getByPlaceholderText('Buscar por nombre o ciudad...'), 'cal');
    expect(api.getUsuarios).not.toHaveBeenCalled();
    await waitFor(() => expect(api.getUsuarios).toHaveBeenCalledWith({ pagina: 1, busqueda: 'cal', rol: '' }));
  });

  it('la paginación pide la página siguiente', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: '2' }));
    await waitFor(() => expect(api.getUsuarios).toHaveBeenLastCalledWith({ pagina: 2, busqueda: '', rol: '' }));
  });

  it('sin resultados lo dice', async () => {
    api.getUsuarios.mockResolvedValue(ok([], { total: 0, pagina: 1, totalPaginas: 1 }));
    render(<UsuariosSection />);
    expect(await screen.findByText('No se encontraron usuarios')).toBeInTheDocument();
  });
});

describe('ver, editar y eliminar', () => {
  it('ver detalle muestra los datos y se cierra', async () => {
    const user = await montar();
    await user.click(within(fila('Ana Ruiz')).getByTitle('Ver detalle'));
    expect(screen.getByText('Nombre completo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '×' }));
    expect(screen.queryByText('Nombre completo')).not.toBeInTheDocument();
  });

  it('editar precarga el formulario y guarda los cambios', async () => {
    api.updateUsuario.mockResolvedValue(ok());
    const user = await montar();
    await user.click(within(fila('Ana Ruiz')).getByTitle('Editar'));
    const ciudad = campo('Ciudad');
    expect(ciudad).toHaveValue('Cali');
    await user.clear(ciudad);
    await user.type(ciudad, 'Pasto');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(screen.queryByText('Guardar cambios')).not.toBeInTheDocument());
    expect(api.updateUsuario).toHaveBeenCalledWith('u1', expect.objectContaining({ ciudad: 'Pasto', rol: 'estudiante', edad: 17 }));
    expect(api.getUsuarios).toHaveBeenCalledTimes(2);
  });

  it('si editar falla el modal sigue abierto con el error', async () => {
    api.updateUsuario.mockResolvedValue(falla('Rol inválido'));
    const user = await montar();
    await user.click(within(fila('Ana Ruiz')).getByTitle('Editar'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Rol inválido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
  });

  it('eliminar pide confirmación; un error se muestra y no cierra', async () => {
    api.deleteUsuario.mockResolvedValueOnce(falla('No se puede eliminar al último admin')).mockResolvedValueOnce(ok());
    const user = await montar();
    await user.click(within(fila('Ana Ruiz')).getByTitle('Eliminar'));
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(await screen.findByText('No se puede eliminar al último admin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(screen.queryByText('Sí, eliminar')).not.toBeInTheDocument());
    expect(api.deleteUsuario).toHaveBeenCalledWith('u1');
  });
});

describe('permisos y bloqueo', () => {
  it('bloquear 3 días manda 72 horas', async () => {
    api.bloquearUsuario.mockResolvedValue(ok());
    const user = await montar();
    await user.click(within(fila('Ana Ruiz')).getByTitle('Permisos / bloqueo'));
    expect(screen.getByText('Sin bloqueo')).toBeInTheDocument();
    await user.selectOptions(screen.getByDisplayValue('7 días'), '3');
    await user.click(screen.getByRole('button', { name: 'Bloquear' }));
    await waitFor(() => expect(api.bloquearUsuario).toHaveBeenCalledWith('u1', { horas: 72 }));
  });

  it('fecha personalizada: sin fecha no deja bloquear; con fecha futura manda horas positivas', async () => {
    api.bloquearUsuario.mockResolvedValue(falla('Error de conexión con el servidor'));
    const user = await montar();
    await user.click(within(fila('Ana Ruiz')).getByTitle('Permisos / bloqueo'));
    await user.selectOptions(screen.getByDisplayValue('7 días'), 'custom');
    expect(screen.getByRole('button', { name: 'Bloquear' })).toBeDisabled();

    const fecha = document.querySelector('input[type="date"]');
    await user.type(fecha, '2099-01-01');
    await user.click(screen.getByRole('button', { name: 'Bloquear' }));
    await waitFor(() => expect(api.bloquearUsuario).toHaveBeenCalled());
    expect(api.bloquearUsuario.mock.calls[0][1].horas).toBeGreaterThan(0);
    expect(await screen.findByText('Error de conexión con el servidor')).toBeInTheDocument();
  });

  it('un usuario bloqueado se puede desbloquear', async () => {
    api.bloquearUsuario.mockResolvedValue(ok());
    const user = await montar();
    await user.click(within(fila('Luis Paz')).getByTitle('Permisos / bloqueo'));
    expect(screen.getAllByText(/Bloqueado hasta/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Desbloquear ahora' }));
    await waitFor(() => expect(api.bloquearUsuario).toHaveBeenCalledWith('u2', { hasta: null }));
  });

  it('los permisos parten del default del rol y guardan la excepción', async () => {
    api.actualizarPermisosUsuario.mockResolvedValueOnce(falla('Recurso desconocido')).mockResolvedValueOnce(ok());
    const user = await montar();
    await user.click(within(fila('Luis Paz')).getByTitle('Permisos / bloqueo'));
    const comentar = await screen.findByRole('checkbox', { name: /Comentar en Comunidad/ });
    expect(comentar).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Publicar en Comunidad/ })).toBeChecked();

    await user.click(comentar);
    expect(comentar).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Guardar permisos' }));
    expect(await screen.findByText('Recurso desconocido')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar permisos' }));
    await waitFor(() => expect(api.actualizarPermisosUsuario).toHaveBeenLastCalledWith('u2', { 'comunidad.comentar': true }));
  });
});

describe('nuevo usuario', () => {
  it('exige email, contraseña, nombre y apellido', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Nuevo usuario/ }));
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));
    expect(screen.getByText('Email, contraseña, nombre y apellido son obligatorios')).toBeInTheDocument();
    expect(api.createUsuario).not.toHaveBeenCalled();
  });

  it('crea un estudiante', async () => {
    api.createUsuario.mockResolvedValue(ok());
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Nuevo usuario/ }));
    await user.type(campo('Email'), 'nuevo@brota.co');
    await user.type(campo('Contraseña'), 'Clave1234');
    await user.type(campo('Nombre'), 'Sara');
    await user.type(campo('Apellido'), 'Gil');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() => expect(screen.queryByText('Crear usuario')).not.toBeInTheDocument());
    expect(api.createUsuario).toHaveBeenCalledWith(expect.objectContaining({ email: 'nuevo@brota.co', nombre: 'Sara', rol: 'estudiante' }));
  });

  it('una cuenta institución exige elegir la institución del catálogo', async () => {
    api.createUsuario.mockResolvedValue(falla('El email ya existe'));
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Nuevo usuario/ }));
    await user.type(campo('Email'), 'inst@brota.co');
    await user.type(campo('Contraseña'), 'Clave1234');
    await user.selectOptions(campo('Rol'), 'institucion');
    await user.type(campo('Nombre de contacto'), 'Rosa');
    await user.type(campo('Apellido de contacto'), 'Mora');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));
    expect(screen.getByText('Elegí a qué institución del catálogo pertenece esta cuenta')).toBeInTheDocument();

    const modal = screen.getByRole('button', { name: 'Crear usuario' }).closest('div').parentElement;
    await user.type(within(modal).getByPlaceholderText('Buscar por nombre o ciudad...'), 'SENA');
    await user.click(await screen.findByRole('button', { name: /SENA Cali/ }));
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() => expect(api.createUsuario).toHaveBeenCalledWith(expect.objectContaining({ rol: 'institucion', institucion_id: 9 })));
    expect(await screen.findByText('El email ya existe')).toBeInTheDocument();
  });

  it('llega precargado desde una solicitud de contacto', async () => {
    const consumido = vi.fn();
    await montar({ prefillUsuario: { nombre: 'Colegio X', telefono: '311', email: 'x@colegio.co' }, onPrefillConsumido: consumido });
    expect(campo('Email')).toHaveValue('x@colegio.co');
    expect(campo('Rol')).toHaveValue('institucion');
    expect(consumido).toHaveBeenCalledTimes(1);
  });
});

describe('carga masiva', () => {
  const COLUMNAS = 'email,password,nombre,apellido,ciudad,telefono,nivel_educativo,grado,fecha_nacimiento,condiciones_socioeconomicas,rol';
  const archivo = (contenido, nombre = 'usuarios.csv') => new File([contenido], nombre, { type: 'text/csv' });

  it('un CSV sin las columnas obligatorias se rechaza', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Carga masiva/ }));
    await user.upload(document.querySelector('input[type="file"]'), archivo('email,nombre\na@b.co,Ana\n'));
    expect(await screen.findByText(/Faltan columnas obligatorias: password, apellido/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importar/ })).toBeDisabled();
  });

  it('previsualiza, importa y muestra el reporte por fila', async () => {
    api.createUsuariosMasivo.mockResolvedValue({
      success: true,
      resultados: [
        { usuario: { email: 'a@b.co' }, success: true },
        { usuario: { email: 'c@d.co' }, success: false, error: 'Email duplicado' },
      ],
    });
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Carga masiva/ }));
    const csv = `${COLUMNAS}\na@b.co,Clave123,Ana,Ruiz,Cali,300,Tecnico,Once,2009-01-01,,estudiante\nc@d.co,Clave123,Luis,Paz,Cali,301,Tecnico,Once,2009-01-01,,estudiante\n`;
    await user.upload(document.querySelector('input[type="file"]'), archivo(csv));

    expect(await screen.findByText(/2 fila\(s\) detectada\(s\)/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Importar 2 usuario(s)' }));

    expect(await screen.findByText('1 creado(s), 1 con error, de 2 fila(s)')).toBeInTheDocument();
    expect(screen.getByText('✗ Email duplicado')).toBeInTheDocument();
    expect(api.createUsuariosMasivo.mock.calls[0][0]).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByText(/creado\(s\)/)).not.toBeInTheDocument();
  });

  it('si la importación falla muestra el error', async () => {
    api.createUsuariosMasivo.mockResolvedValue({ success: false, error: 'Máximo 500 filas', resultados: [] });
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Carga masiva/ }));
    await user.upload(document.querySelector('input[type="file"]'), archivo(`${COLUMNAS}\na@b.co,x,A,B,C,1,T,O,2009-01-01,,estudiante\n`));
    await user.click(await screen.findByRole('button', { name: 'Importar 1 usuario(s)' }));
    expect(await screen.findByText('Máximo 500 filas')).toBeInTheDocument();
  });
});
