// Editor de preguntas del test vocacional (panel admin). Lo importante son
// las reglas de opciones: selección única = 5 opciones con área asignada,
// el resto ≥ 2 opciones con texto, y las abiertas no llevan opciones.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { campo, ok, falla } from '../../../../test/helpers';

const api = vi.hoisted(() => ({
  getPreguntas: vi.fn(),
  getCuestionarios: vi.fn(),
  createPregunta: vi.fn(),
  updatePregunta: vi.fn(),
  deletePregunta: vi.fn(),
}));
vi.mock('../../../../services/adminService', () => api);

import PreguntasSection from './PreguntasSection';

const PREGUNTA = {
  id: 'p1', cuestionario_id: 'c1', orden: 3, texto: '¿Te gusta resolver problemas?', tipo: 'multiple',
  categoria: 'intereses', peso: 1.5, updated_at: '2026-11-01T10:00:00Z',
  opciones: [{ label: 'Sí', es_correcta: true, pesos: {} }, { label: 'No', es_correcta: false, pesos: {} }],
};

async function montar(props) {
  const user = userEvent.setup();
  render(<PreguntasSection {...props} />);
  await screen.findByText(PREGUNTA.texto);
  return user;
}
const areas = () => screen.getAllByRole('combobox', { name: /Área vocacional de opción/ });
const primeraArea = (select) => select.querySelectorAll('option')[1].value;

beforeEach(() => {
  vi.clearAllMocks();
  api.getPreguntas.mockResolvedValue(ok([PREGUNTA], { es_correcta_disponible: true }));
  api.getCuestionarios.mockResolvedValue(ok([{ id: 'c1', nombre: 'Test', version: 'v1' }]));
  api.createPregunta.mockResolvedValue(ok());
  api.updatePregunta.mockResolvedValue(ok());
  api.deletePregunta.mockResolvedValue(ok());
});

describe('listado', () => {
  it('muestra orden, tipo legible y cantidad', async () => {
    await montar();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('Opción múltiple')).toBeInTheDocument();
    expect(screen.getByText('1 preguntas')).toBeInTheDocument();
  });

  it('parte filtrado por el cuestionario que llega del panel', async () => {
    await montar({ filtroCuestionarioId: 'c1' });
    expect(api.getPreguntas).toHaveBeenCalledWith({ cuestionario_id: 'c1', busqueda: '' });
  });

  it('cambiar el filtro de cuestionario vuelve a consultar', async () => {
    const user = await montar();
    await user.selectOptions(screen.getByDisplayValue('Todos los cuestionarios'), 'c1');
    await waitFor(() => expect(api.getPreguntas).toHaveBeenLastCalledWith({ cuestionario_id: 'c1', busqueda: '' }));
  });

  it('si la carga falla ofrece reintentar', async () => {
    api.getPreguntas.mockResolvedValueOnce(falla('Timeout'));
    const user = userEvent.setup();
    render(<PreguntasSection />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Timeout');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(PREGUNTA.texto)).toBeInTheDocument();
  });

  it('sin preguntas lo dice', async () => {
    api.getPreguntas.mockResolvedValue(ok([]));
    render(<PreguntasSection />);
    expect(await screen.findByText('No se encontraron preguntas')).toBeInTheDocument();
  });
});

describe('nueva pregunta de selección única', () => {
  async function abrir() {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Nueva pregunta/ }));
    await user.selectOptions(campo('Cuestionario *'), 'c1');
    await user.type(campo('Texto de la pregunta *'), '¿Qué prefieres?');
    return user;
  }

  it('arranca con 5 opciones que no se pueden quitar ni sumar', async () => {
    await abrir();
    expect(screen.getAllByPlaceholderText(/^Opción \d$/)).toHaveLength(5);
    expect(screen.getByRole('button', { name: '+ Agregar opción' })).toBeDisabled();
    expect(screen.getAllByTitle('Quitar opción').every((b) => b.disabled)).toBe(true);
  });

  it('exige texto en todas las opciones y luego un área en cada una', async () => {
    const user = await abrir();
    await user.click(screen.getByRole('button', { name: 'Crear pregunta' }));
    expect(screen.getByText('Las preguntas con opciones necesitan al menos 2 opciones con texto.')).toBeInTheDocument();

    for (const [i, input] of screen.getAllByPlaceholderText(/^Opción \d$/).entries()) await user.type(input, `Op ${i}`);
    await user.click(screen.getByRole('button', { name: 'Crear pregunta' }));
    expect(screen.getByText('Asigna un área vocacional a cada opción de selección única.')).toBeInTheDocument();
    expect(api.createPregunta).not.toHaveBeenCalled();
  });

  it('con todo completo manda pesos de 1 punto y sin respuestas correctas', async () => {
    const user = await abrir();
    for (const [i, input] of screen.getAllByPlaceholderText(/^Opción \d$/).entries()) await user.type(input, ` Op ${i} `);
    for (const select of areas()) await user.selectOptions(select, primeraArea(select));
    await user.clear(campo('Orden'));
    await user.click(screen.getByRole('button', { name: 'Crear pregunta' }));

    await waitFor(() => expect(api.createPregunta).toHaveBeenCalled());
    const datos = api.createPregunta.mock.calls[0][0];
    expect(datos).toMatchObject({ cuestionario_id: 'c1', texto: '¿Qué prefieres?', tipo: 'single', orden: 1, peso: 1 });
    expect(datos.opciones).toHaveLength(5);
    expect(datos.opciones[0]).toMatchObject({ label: 'Op 0', orden: 0, es_correcta: false });
    expect(Object.values(datos.opciones[0].pesos)).toEqual([1]);
  });
});

describe('otros tipos', () => {
  it('opción múltiple permite agregar y quitar opciones y marcar correctas', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Nueva pregunta/ }));
    await user.selectOptions(campo('Tipo'), 'opcion_multiple');
    await user.click(screen.getByRole('button', { name: '+ Agregar opción' }));
    expect(screen.getAllByPlaceholderText(/^Opción \d$/)).toHaveLength(6);
    for (let i = 0; i < 4; i++) await user.click(screen.getAllByTitle('Quitar opción')[0]);
    expect(screen.getAllByPlaceholderText(/^Opción \d$/)).toHaveLength(2);
    expect(screen.getAllByTitle('Quitar opción')[0]).toBeDisabled();

    const [a, b] = screen.getAllByPlaceholderText(/^Opción \d$/);
    await user.type(a, 'Rojo');
    await user.type(b, 'Azul');
    await user.click(within(screen.getAllByTitle('Marcar como respuesta correcta')[1]).getByRole('checkbox'));
    await user.type(campo('Texto de la pregunta *'), 'Color');
    await user.click(screen.getByRole('button', { name: 'Crear pregunta' }));

    await waitFor(() => expect(api.createPregunta).toHaveBeenCalled());
    expect(api.createPregunta.mock.calls[0][0].opciones.map((o) => [o.label, o.es_correcta])).toEqual([['Rojo', false], ['Azul', true]]);
  });

  it('una pregunta abierta se guarda sin opciones', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Nueva pregunta/ }));
    await user.selectOptions(campo('Tipo'), 'respuesta_larga');
    expect(screen.getByText(/no modifica el perfil vocacional/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear pregunta' }));
    await waitFor(() => expect(api.createPregunta).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'respuesta_larga', opciones: [] })));
  });

  it('sin la migración de respuestas correctas el checkbox queda deshabilitado con aviso', async () => {
    api.getPreguntas.mockResolvedValue(ok([PREGUNTA], { es_correcta_disponible: false }));
    const user = await montar();
    await user.click(screen.getByTitle('Editar'));
    expect(screen.getByText(/primero aplica la migración/)).toBeInTheDocument();
    expect(within(screen.getAllByTitle('Marcar como respuesta correcta')[0]).getByRole('checkbox')).toBeDisabled();
  });
});

describe('editar y eliminar', () => {
  it('editar normaliza el tipo legado y guarda', async () => {
    const user = await montar();
    await user.click(screen.getByTitle('Editar'));
    expect(campo('Tipo')).toHaveValue('opcion_multiple');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(api.updatePregunta).toHaveBeenCalledWith('p1', expect.objectContaining({ tipo: 'opcion_multiple', orden: 3, peso: 1.5 })));
    expect(api.getPreguntas.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('una pregunta sin opciones guardadas se edita con 5 vacías', async () => {
    api.getPreguntas.mockResolvedValue(ok([{ ...PREGUNTA, tipo: 'single', opciones: [] }]));
    const user = await montar();
    await user.click(screen.getByTitle('Editar'));
    expect(screen.getAllByPlaceholderText(/^Opción \d$/)).toHaveLength(5);
  });

  it('el error del backend al editar se muestra', async () => {
    api.updatePregunta.mockResolvedValue(falla('Orden duplicado'));
    const user = await montar();
    await user.click(screen.getByTitle('Editar'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Orden duplicado')).toBeInTheDocument();
  });

  it('eliminar confirma con el número de orden', async () => {
    api.deletePregunta.mockResolvedValueOnce(falla('Tiene respuestas')).mockResolvedValueOnce(ok());
    const user = await montar();
    await user.click(screen.getByTitle('Eliminar'));
    expect(screen.getByText('#3', { selector: 'strong' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(await screen.findByText('Tiene respuestas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Sí, eliminar' })).not.toBeInTheDocument());
    expect(api.deletePregunta).toHaveBeenLastCalledWith('p1');
  });

  it('crear con error del backend deja el modal abierto', async () => {
    api.createPregunta.mockResolvedValue(falla('Cuestionario requerido'));
    const user = await montar();
    await user.click(screen.getByRole('button', { name: /Nueva pregunta/ }));
    await user.selectOptions(campo('Tipo'), 'respuesta_corta');
    await user.click(screen.getByRole('button', { name: 'Crear pregunta' }));
    expect(await screen.findByText('Cuestionario requerido')).toBeInTheDocument();
  });
});
