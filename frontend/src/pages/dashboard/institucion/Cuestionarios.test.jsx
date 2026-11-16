// Cuestionarios propios de una institución: crear, activar, eliminar y editar
// sus preguntas. El layout del dashboard se reemplaza por un contenedor simple.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { campo, ok, falla } from '../../../test/helpers';

vi.mock('../../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));
vi.mock('./components/InstitucionNav', () => ({ default: () => null }));

const perfil = vi.hoisted(() => ({ obtenerPerfil: vi.fn() }));
vi.mock('../../../services/perfilService', () => perfil);

const api = vi.hoisted(() => ({
  getCuestionarios: vi.fn(),
  createCuestionario: vi.fn(),
  actualizarCuestionario: vi.fn(),
  eliminarCuestionario: vi.fn(),
  getPreguntas: vi.fn(),
  crearPregunta: vi.fn(),
  actualizarPregunta: vi.fn(),
  eliminarPregunta: vi.fn(),
}));
vi.mock('../../../services/institucionService', () => api);

import Cuestionarios from './Cuestionarios';

const CUESTIONARIO = { id: 'c1', nombre: 'Test SENA', version: '2.0', descripcion: 'x', activo: false, num_preguntas: 1 };
const PREGUNTA = { id: 'q1', texto: '¿Te gusta el campo?', tipo: 'opcion_unica', peso: 1, orden: 1, opciones: [{ label: 'Sí', pesos: { agro: 2 } }, { label: 'No', pesos: {} }] };

async function montar() {
  const user = userEvent.setup();
  render(<Cuestionarios user={{ id: 'u-inst' }} />);
  await screen.findByText('Test SENA');
  return user;
}
async function expandir(user) {
  await user.click(screen.getByText('Test SENA'));
  await screen.findByText(/¿Te gusta el campo\?/);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  perfil.obtenerPerfil.mockResolvedValue(ok({ nombre: 'SENA' }));
  api.getCuestionarios.mockResolvedValue(ok([CUESTIONARIO]));
  api.getPreguntas.mockResolvedValue(ok([PREGUNTA]));
  for (const f of ['createCuestionario', 'actualizarCuestionario', 'eliminarCuestionario', 'crearPregunta', 'actualizarPregunta', 'eliminarPregunta']) api[f].mockResolvedValue(ok());
});
afterEach(() => vi.restoreAllMocks());

describe('cuestionarios', () => {
  it('carga el perfil y la lista', async () => {
    await montar();
    expect(perfil.obtenerPerfil).toHaveBeenCalledWith('u-inst');
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('sin cuestionarios muestra el aviso', async () => {
    api.getCuestionarios.mockResolvedValue(ok([]));
    render(<Cuestionarios user={{ id: 'u' }} />);
    expect(await screen.findByText('Todavía no creaste ningún cuestionario propio.')).toBeInTheDocument();
  });

  it('crear exige nombre y versión, y muestra el error del backend', async () => {
    api.createCuestionario.mockResolvedValueOnce(falla('Nombre repetido'));
    const user = await montar();
    await user.click(screen.getByRole('button', { name: '+ Nuevo cuestionario' }));
    await user.clear(screen.getByPlaceholderText('Versión (ej. 1.0)'));
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    expect(screen.getByText('Nombre y versión son obligatorios')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Nombre'), 'Mi test');
    await user.type(screen.getByPlaceholderText('Versión (ej. 1.0)'), '1.1');
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    expect(await screen.findByText('Nombre repetido')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear' }));
    await waitFor(() => expect(screen.queryByPlaceholderText('Nombre')).not.toBeInTheDocument());
    expect(api.createCuestionario).toHaveBeenLastCalledWith({ nombre: 'Mi test', version: '1.1', descripcion: '' });
  });

  it('activar manda el estado contrario', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: 'Activar' }));
    await waitFor(() => expect(api.actualizarCuestionario).toHaveBeenCalledWith('c1', { nombre: 'Test SENA', version: '2.0', descripcion: 'x', activo: true }));
  });

  it('eliminar solo procede si se confirma', async () => {
    const user = await montar();
    window.confirm.mockReturnValueOnce(false);
    // Sin expandir, el único "Eliminar" es el del cuestionario
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(api.eliminarCuestionario).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(api.eliminarCuestionario).toHaveBeenCalledWith('c1'));
  });
});

describe('preguntas del cuestionario', () => {
  it('al expandir carga las preguntas; sin preguntas lo dice', async () => {
    api.getPreguntas.mockResolvedValueOnce(ok([]));
    const user = await montar();
    await user.click(screen.getByText('Test SENA'));
    expect(await screen.findByText('Sin preguntas todavía.')).toBeInTheDocument();
    expect(api.getPreguntas).toHaveBeenCalledWith('c1');
  });

  it('nueva pregunta: exige texto y opciones con texto', async () => {
    const user = await montar();
    await expandir(user);
    await user.click(screen.getByRole('button', { name: '+ Agregar pregunta' }));
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
    expect(screen.getByText('El texto de la pregunta es obligatorio')).toBeInTheDocument();

    await user.type(campo('Texto de la pregunta'), '¿Te gusta programar?');
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
    expect(screen.getByText('Necesitás al menos 2 opciones, todas con texto')).toBeInTheDocument();
    expect(api.crearPregunta).not.toHaveBeenCalled();
  });

  it('nueva pregunta con opciones, pesos y respuesta correcta', async () => {
    const user = await montar();
    await expandir(user);
    await user.click(screen.getByRole('button', { name: '+ Agregar pregunta' }));
    await user.type(campo('Texto de la pregunta'), '¿Te gusta programar?');
    await user.click(screen.getByRole('button', { name: '+ Agregar opción' }));
    const textos = screen.getAllByPlaceholderText('Texto de la opción');
    expect(textos).toHaveLength(3);
    await user.click(screen.getAllByRole('button', { name: '✕' })[2]);
    await user.type(textos[0], 'Mucho');
    await user.type(textos[1], 'Poco');
    await user.click(screen.getAllByRole('checkbox', { name: /Respuesta correcta/ })[0]);
    await user.click(screen.getAllByRole('button', { name: '+ Agregar peso por categoría' })[0]);
    const categoria = screen.getByDisplayValue('Elegir categoría...');
    const valor = categoria.querySelectorAll('option')[1].value;
    await user.selectOptions(categoria, valor);
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }));

    await waitFor(() => expect(api.crearPregunta).toHaveBeenCalled());
    const datos = api.crearPregunta.mock.calls[0][0];
    expect(datos).toMatchObject({ cuestionario_id: 'c1', texto: '¿Te gusta programar?', tipo: 'opcion_unica' });
    expect(datos.opciones[0]).toMatchObject({ label: 'Mucho', es_correcta: true, pesos: { [valor]: 1 } });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Guardar pregunta' })).not.toBeInTheDocument());
  });

  it('selección única pide 5 opciones con área', async () => {
    const user = await montar();
    await expandir(user);
    await user.click(screen.getByRole('button', { name: '+ Agregar pregunta' }));
    await user.type(campo('Texto de la pregunta'), 'Perfil');
    await user.selectOptions(campo('Tipo de pregunta'), 'single');
    const textos = screen.getAllByPlaceholderText('Texto de la opción');
    expect(textos).toHaveLength(5);
    expect(screen.getByRole('button', { name: '+ Agregar opción' })).toBeDisabled();
    for (const [i, t] of textos.entries()) await user.type(t, `Op ${i}`);
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
    expect(screen.getByText('Asigna un área vocacional a cada opción de selección única')).toBeInTheDocument();
  });

  it('una pregunta abierta se guarda sin opciones', async () => {
    const user = await montar();
    await expandir(user);
    await user.click(screen.getByRole('button', { name: '+ Agregar pregunta' }));
    await user.type(campo('Texto de la pregunta'), 'Cuéntanos tu meta');
    await user.selectOptions(campo('Tipo de pregunta'), 'respuesta_corta');
    expect(screen.getByText(/no usa opciones/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
    await waitFor(() => expect(api.crearPregunta).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'respuesta_corta', opciones: [] })));
  });

  it('editar una pregunta usa actualizar y muestra el error del backend', async () => {
    api.actualizarPregunta.mockResolvedValueOnce(falla('Sin permiso'));
    const user = await montar();
    await expandir(user);
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(campo('Texto de la pregunta')).toHaveValue('¿Te gusta el campo?');
    await user.click(screen.getByRole('button', { name: 'Guardar pregunta' }));
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument();
    expect(api.actualizarPregunta).toHaveBeenCalledWith('q1', expect.objectContaining({ cuestionario_id: 'c1' }));

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('button', { name: 'Guardar pregunta' })).not.toBeInTheDocument();
  });

  it('eliminar una pregunta pide confirmación', async () => {
    const user = await montar();
    await expandir(user);
    const fila = screen.getByText(/¿Te gusta el campo\?/).parentElement;
    await user.click(within(fila).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(api.eliminarPregunta).toHaveBeenCalledWith('q1'));
  });
});
