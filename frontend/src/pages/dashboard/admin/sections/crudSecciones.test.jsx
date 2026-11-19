// Las cuatro secciones CRUD simples del panel admin comparten el mismo
// contrato: listar, crear, editar y eliminar, mostrando el error del backend
// sin cerrar el modal. Se prueba ese contrato con una tabla por sección.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { campo, ok, falla } from '../../../../test/helpers';

const api = vi.hoisted(() => {
  const nombres = [
    'getInstituciones', 'createInstitucion', 'updateInstitucion', 'deleteInstitucion',
    'getProgramas', 'createPrograma', 'updatePrograma', 'deletePrograma',
    'getConvocatorias', 'createConvocatoria', 'updateConvocatoria', 'deleteConvocatoria',
    'getCuestionarios', 'createCuestionario', 'updateCuestionario', 'deleteCuestionario',
  ];
  return Object.fromEntries(nombres.map((n) => [n, vi.fn()]));
});
vi.mock('../../../../services/adminService', () => api);

import InstitucionesSection from './InstitucionesSection';
import OportunidadesSection from './OportunidadesSection';
import ConvocatoriasSection from './ConvocatoriasSection';
import CuestionariosSection from './CuestionariosSection';

const META = { total: 1, pagina: 1, totalPaginas: 1 };

const SECCIONES = [
  {
    nombre: 'Instituciones', Componente: InstitucionesSection,
    listar: 'getInstituciones', crear: 'createInstitucion', editar: 'updateInstitucion', borrar: 'deleteInstitucion',
    item: { id: 10, nombre: 'SENA Cali', tipo: 'Pública', ciudad: 'Cali', activa: true },
    textoFila: 'SENA Cali', botonNuevo: /Nueva institución/, botonCrear: 'Crear institución',
    llenar: async (user) => { await user.type(campo('Nombre *'), 'Uniandes'); await user.type(campo('Ciudad'), 'Bogotá'); },
    esperado: { nombre: 'Uniandes', ciudad: 'Bogotá' },
    campoEditar: 'Ciudad', vacio: 'No se encontraron instituciones', buscador: 'Buscar por nombre o ciudad...',
  },
  {
    nombre: 'Programas', Componente: OportunidadesSection,
    listar: 'getProgramas', crear: 'createPrograma', editar: 'updatePrograma', borrar: 'deletePrograma',
    item: { id: 20, nombre: 'Enfermería', tipo: 'Tecnólogo', area_academica: 'Salud', activo: true, institucion_id: 10 },
    textoFila: 'Enfermería', botonNuevo: /Nuevo programa/, botonCrear: 'Crear programa',
    llenar: async (user) => {
      await user.type(campo('Nombre *'), 'Medicina');
      await user.selectOptions(campo('Institución'), '10');
    },
    esperado: { nombre: 'Medicina', institucion_id: '10' },
    campoEditar: 'Área académica', vacio: 'No se encontraron programas', buscador: 'Buscar programas...',
  },
  {
    nombre: 'Convocatorias', Componente: ConvocatoriasSection,
    listar: 'getConvocatorias', crear: 'createConvocatoria', editar: 'updateConvocatoria', borrar: 'deleteConvocatoria',
    item: { id: 30, tipo: 'Beca', titulo: 'Beca Talento', institucion: 'ICETEX', ciudad: 'Nacional', activa: true, fecha_cierre: '2026-12-31T23:59:00Z' },
    textoFila: 'Beca Talento', botonNuevo: /Nueva convocatoria/, botonCrear: 'Crear convocatoria',
    llenar: async (user) => {
      await user.type(campo('Tipo *'), 'Beca');
      await user.type(campo('Título *'), 'Generación E');
      await user.type(campo('Institución *'), 'MEN');
    },
    esperado: { tipo: 'Beca', titulo: 'Generación E', institucion: 'MEN', ciudad: 'Nacional' },
    campoEditar: 'Ciudad', vacio: 'No se encontraron convocatorias', buscador: 'Buscar por título, institución o ciudad...',
  },
  {
    nombre: 'Cuestionarios', Componente: CuestionariosSection,
    listar: 'getCuestionarios', crear: 'createCuestionario', editar: 'updateCuestionario', borrar: 'deleteCuestionario',
    item: { id: 40, nombre: 'Test vocacional', version: 'v2', descripcion: 'Oficial', activo: true },
    textoFila: 'Test vocacional', botonNuevo: /Nuevo cuestionario/, botonCrear: 'Crear cuestionario',
    llenar: async (user) => { await user.type(campo('Nombre *'), 'Piloto'); await user.type(campo('Versión *'), 'v3'); },
    esperado: { nombre: 'Piloto', version: 'v3', activo: false },
    campoEditar: 'Versión *', vacio: 'No hay cuestionarios',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  for (const s of SECCIONES) {
    api[s.listar].mockResolvedValue(ok([s.item], META));
    for (const m of [s.crear, s.editar, s.borrar]) api[m].mockResolvedValue(ok());
  }
});

describe.each(SECCIONES)('$nombre', (s) => {
  async function montar() {
    const user = userEvent.setup();
    render(<s.Componente />);
    await screen.findByText(s.textoFila);
    return user;
  }
  const fila = () => screen.getByText(s.textoFila).closest('tr');

  it('lista lo que devuelve el servicio', async () => {
    await montar();
    expect(api[s.listar]).toHaveBeenCalled();
  });

  it('muestra un estado vacío', async () => {
    api[s.listar].mockResolvedValue(ok([], { total: 0, pagina: 1, totalPaginas: 1 }));
    render(<s.Componente />);
    expect(await screen.findByText(s.vacio)).toBeInTheDocument();
  });

  it('crea con los datos del formulario y recarga la lista', async () => {
    const user = await montar();
    await user.click(screen.getByRole('button', { name: s.botonNuevo }));
    await s.llenar(user);
    await user.click(screen.getByRole('button', { name: s.botonCrear }));
    await waitFor(() => expect(screen.queryByRole('button', { name: s.botonCrear })).not.toBeInTheDocument());
    expect(api[s.crear]).toHaveBeenCalledWith(expect.objectContaining(s.esperado));
    expect(api[s.listar].mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('si crear falla deja el modal abierto con el error', async () => {
    api[s.crear].mockResolvedValue(falla('Ya existe'));
    const user = await montar();
    await user.click(screen.getByRole('button', { name: s.botonNuevo }));
    await s.llenar(user);
    await user.click(screen.getByRole('button', { name: s.botonCrear }));
    expect(await screen.findByText('Ya existe')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('button', { name: s.botonCrear })).not.toBeInTheDocument();
  });

  it('edita el registro elegido', async () => {
    const user = await montar();
    await user.click(within(fila()).getByTitle('Editar'));
    const input = campo(s.campoEditar);
    await user.clear(input);
    await user.type(input, 'Cambiado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(api[s.editar]).toHaveBeenCalledWith(s.item.id, expect.any(Object)));
    expect(Object.values(api[s.editar].mock.calls[0][1])).toContain('Cambiado');
  });

  it('error al editar se muestra', async () => {
    api[s.editar].mockResolvedValue(falla('Sin permiso'));
    const user = await montar();
    await user.click(within(fila()).getByTitle('Editar'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument();
  });

  it('elimina tras confirmar; un error no cierra el modal', async () => {
    api[s.borrar].mockResolvedValueOnce(falla('Tiene datos asociados'));
    const user = await montar();
    await user.click(within(fila()).getByTitle('Eliminar'));
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(await screen.findByText('Tiene datos asociados')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Sí, eliminar' })).not.toBeInTheDocument());
    expect(api[s.borrar]).toHaveBeenLastCalledWith(s.item.id);
  });

  if (s.buscador) {
    it('la búsqueda se manda al servicio', async () => {
      const user = await montar();
      await user.type(screen.getByPlaceholderText(s.buscador), 'x');
      await waitFor(() => expect(api[s.listar]).toHaveBeenLastCalledWith(expect.objectContaining({ busqueda: 'x' })));
    });
  }
});

describe('Cuestionarios: extras', () => {
  it('el badge Activo/Inactivo alterna el estado del cuestionario', async () => {
    const user = userEvent.setup();
    render(<CuestionariosSection />);
    await user.click(await screen.findByRole('button', { name: 'Activo' }));
    await waitFor(() => expect(api.updateCuestionario).toHaveBeenCalledWith(40, expect.objectContaining({ activo: false })));
  });

  it('"ver preguntas" avisa al panel qué cuestionario abrir', async () => {
    const onVerPreguntas = vi.fn();
    const user = userEvent.setup();
    render(<CuestionariosSection onVerPreguntas={onVerPreguntas} />);
    await user.click(await screen.findByTitle('Ver preguntas de este cuestionario'));
    expect(onVerPreguntas).toHaveBeenCalledWith(40);
  });
});
