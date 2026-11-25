// Semana 6 · Parte 4 (umbral 70%) · Julian
// Página Rutas formativas: áreas relacionadas con el resultado del test,
// CTA si no lo hizo, cuenta institución y contenido de cada área.
// rutasService y perfilService son stubs.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ok, falla } from '../../test/helpers';

vi.mock('../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const rutas = vi.hoisted(() => ({ getAreasDisponibles: vi.fn(), getRutaPorArea: vi.fn() }));
const perfil = vi.hoisted(() => ({ obtenerPerfil: vi.fn(), obtenerResultado: vi.fn() }));
vi.mock('../../services/rutasService', () => rutas);
vi.mock('../../services/perfilService', () => perfil);

import Rutas from './Rutas';

const AREAS = ['tecnologia', 'salud', 'negocios', 'arte'];
const CONTENIDO = {
  materiasComunes: ['Programación', 'Bases de datos'],
  temasPrevios: ['Lógica'],
  proyectos: ['Una calculadora'],
  recursos: [{ titulo: 'Cursos gratis', url: 'https://ejemplo.co' }],
};

function montar(user = { id: 'u1' }) {
  const usuario = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/dashboard/rutas']}>
      <Routes>
        <Route path="/dashboard/rutas" element={<Rutas user={user} />} />
        <Route path="/dashboard/test" element={<p>Página del test</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return usuario;
}

beforeEach(() => {
  vi.clearAllMocks();
  rutas.getAreasDisponibles.mockResolvedValue(ok(AREAS));
  rutas.getRutaPorArea.mockResolvedValue(ok(CONTENIDO));
  perfil.obtenerPerfil.mockResolvedValue(ok({ id: 'p1', rol: 'estudiante' }));
  perfil.obtenerResultado.mockResolvedValue(ok({
    perfil_vocacional: { categoriaPrincipal: 'tecnologia', categoriaSecundaria: 'emprendimiento' },
  }));
});

describe('áreas según el resultado del test', () => {
  it('separa las áreas afines (con el alias emprendimiento → negocios) del resto', async () => {
    montar();

    expect(await screen.findByText('Relacionadas con tus resultados')).toBeInTheDocument();
    const botones = screen.getAllByRole('button').map((b) => b.textContent);
    expect(botones).toEqual(['Tecnología', 'Negocios', 'Salud', 'Arte']);
    expect(screen.getByText('Elegí un área arriba para ver su ruta.')).toBeInTheDocument();
  });

  it('sin test hecho muestra el aviso y lleva al test', async () => {
    perfil.obtenerResultado.mockResolvedValue(ok(null));
    const usuario = montar();

    await usuario.click(await screen.findByRole('button', { name: 'Hacer el test' }));

    expect(screen.getByText('Página del test')).toBeInTheDocument();
  });

  it.each([
    ['sin sesión', null, () => {}],
    ['el perfil no carga', { id: 'u1' }, () => perfil.obtenerPerfil.mockResolvedValue(falla('x'))],
    ['el resultado no carga', { id: 'u1' }, () => perfil.obtenerResultado.mockResolvedValue(falla('x'))],
  ])('%s → se trata como sin test', async (_caso, user, preparar) => {
    preparar();
    montar(user);

    expect(await screen.findByRole('button', { name: 'Hacer el test' })).toBeInTheDocument();
  });

  it('una cuenta institución no ve el aviso del test ni la sección de afines', async () => {
    perfil.obtenerPerfil.mockResolvedValue(ok({ id: 'p1', rol: 'institucion' }));
    montar();

    expect(await screen.findByRole('button', { name: 'Tecnología' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hacer el test' })).toBeNull();
    expect(screen.queryByText('Relacionadas con tus resultados')).toBeNull();
    expect(perfil.obtenerResultado).not.toHaveBeenCalled();
  });

  it('si las áreas no cargan no muestra chips', async () => {
    rutas.getAreasDisponibles.mockResolvedValue(falla('x'));
    montar();

    expect(await screen.findByText('Elegí un área arriba para ver su ruta.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tecnología' })).toBeNull();
  });
});

describe('contenido de un área', () => {
  it('al elegir un área pide su ruta y muestra materias, temas, proyectos y recursos', async () => {
    const usuario = montar();

    await usuario.click(await screen.findByRole('button', { name: 'Salud' }));

    expect(rutas.getRutaPorArea).toHaveBeenCalledWith('salud');
    expect(await screen.findByText('Programación')).toBeInTheDocument();
    expect(screen.getByText('Lógica')).toBeInTheDocument();
    expect(screen.getByText('Una calculadora')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cursos gratis →' })).toHaveAttribute('href', 'https://ejemplo.co');
    expect(screen.queryByText('Elegí un área arriba para ver su ruta.')).toBeNull();
  });

  it('sin materias comunes omite esa sección', async () => {
    rutas.getRutaPorArea.mockResolvedValue(ok({ ...CONTENIDO, materiasComunes: [] }));
    const usuario = montar();

    await usuario.click(await screen.findByRole('button', { name: 'Tecnología' }));

    expect(await screen.findByText('Lógica')).toBeInTheDocument();
    expect(screen.queryByText('Materias más comunes de la carrera')).toBeNull();
  });

  it('si la ruta no carga no muestra contenido', async () => {
    rutas.getRutaPorArea.mockResolvedValue(falla('x'));
    const usuario = montar();

    await usuario.click(await screen.findByRole('button', { name: 'Arte' }));

    await screen.findByRole('button', { name: 'Arte' });
    expect(screen.queryByText('Qué estudiar antes de entrar')).toBeNull();
  });
});
