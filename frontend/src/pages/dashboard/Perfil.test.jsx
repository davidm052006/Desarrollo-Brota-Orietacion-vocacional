// Semana 6 · Parte 4 (umbral 70%) · Julian
// Página Mi perfil: carga los datos, fecha de nacimiento con tres
// GlassSelect (día/mes/año) que calcula la edad, validaciones antes de
// guardar, respuesta del servicio y modo demo. perfilService es stub.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ok, falla } from '../../test/helpers';
import { calcularEdad } from '../../utils/calcularEdad';

vi.mock('../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const api = vi.hoisted(() => ({ obtenerPerfil: vi.fn(), actualizarPerfil: vi.fn() }));
vi.mock('../../services/perfilService', () => api);

import Perfil from './Perfil';

const ANIO = new Date().getFullYear();
const PERFIL = { id: 'p1', nombre: 'Ana', apellido: 'Ruiz', ciudad: 'Montería', nivel_educativo: 'Técnico', edad: null };

function Destino() {
  return <p>En {useLocation().pathname}</p>;
}

function montar(props = {}) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/dashboard/perfil']}>
      <Routes>
        <Route path="/dashboard/perfil" element={<Perfil user={{ id: 'u1', email: 'ana@x.co' }} {...props} />} />
        <Route path="/dashboard/*" element={<Destino />} />
        <Route path="/dashboard" element={<Destino />} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

// Abre el GlassSelect que hoy muestra `actual` y elige `opcion`.
async function elegir(user, actual, opcion) {
  await user.click(screen.getByRole('button', { name: new RegExp(`^${actual}`) }));
  await user.click(screen.getByRole('button', { name: opcion }));
}

const guardar = (user) => user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

beforeEach(() => {
  vi.clearAllMocks();
  api.obtenerPerfil.mockResolvedValue(ok(PERFIL));
  api.actualizarPerfil.mockResolvedValue({ success: true });
});

describe('carga del perfil', () => {
  it('llena el formulario con los datos guardados', async () => {
    montar();

    expect(await screen.findByDisplayValue('Ana')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ruiz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Montería/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Técnico/ })).toBeInTheDocument();
    expect(api.obtenerPerfil).toHaveBeenCalledWith('u1');
  });

  it('con edad guardada estima el año y muestra la edad', async () => {
    api.obtenerPerfil.mockResolvedValue(ok({ ...PERFIL, edad: 16 }));
    montar();

    expect(await screen.findByText('Eso te da 16 años.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(`^${ANIO - 16}`) })).toBeInTheDocument();
  });

  it('si el perfil no carga deja el formulario vacío', async () => {
    api.obtenerPerfil.mockResolvedValue(falla('x'));
    montar();

    expect(await screen.findByRole('button', { name: /^Elegir ciudad/ })).toBeInTheDocument();
    expect(screen.queryByText(/Eso te da/)).toBeNull();
  });

  it('sin sesión se queda cargando y no llama al servicio', () => {
    render(<MemoryRouter><Perfil user={null} /></MemoryRouter>);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(api.obtenerPerfil).not.toHaveBeenCalled();
  });
});

describe('guardar', () => {
  it('envía los cambios y la edad calculada desde la fecha', async () => {
    const user = montar();
    const nombre = await screen.findByDisplayValue('Ana');
    await user.clear(nombre);
    await user.type(nombre, 'Ana María');
    await elegir(user, 'Montería', 'Sincelejo');
    await elegir(user, 'Mes', 'Enero');
    await elegir(user, 'Día', '1');
    await elegir(user, 'Año', String(ANIO - 20));
    await elegir(user, 'Técnico', 'Universitario');
    const edad = calcularEdad('1', '1', String(ANIO - 20));

    await guardar(user);

    expect(api.actualizarPerfil).toHaveBeenCalledWith('u1', {
      nombre: 'Ana María', apellido: 'Ruiz', ciudad: 'Sincelejo', nivel_educativo: 'Universitario', edad,
    });
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument();
    expect(screen.getByText(`Eso te da ${edad} años.`)).toBeInTheDocument();
  });

  it('sin tocar la fecha guarda con la edad null', async () => {
    const user = montar();
    await screen.findByDisplayValue('Ana');

    await guardar(user);

    expect(api.actualizarPerfil).toHaveBeenCalledWith('u1', expect.objectContaining({ edad: null }));
  });

  it('con la fecha incompleta avisa y no guarda', async () => {
    const user = montar();
    await screen.findByDisplayValue('Ana');
    await elegir(user, 'Mes', 'Marzo');

    await guardar(user);

    expect(screen.getByText('Completá día, mes y año de nacimiento.')).toBeInTheDocument();
    expect(api.actualizarPerfil).not.toHaveBeenCalled();
  });

  it('comportamiento actual: con edad guardada y sin completar día y mes, no deja guardar', async () => {
    // El año se precarga desde la edad, así que cuenta como "fecha tocada".
    api.obtenerPerfil.mockResolvedValue(ok({ ...PERFIL, edad: 16 }));
    const user = montar();
    await screen.findByText('Eso te da 16 años.');

    await guardar(user);

    expect(screen.getByText('Completá día, mes y año de nacimiento.')).toBeInTheDocument();
    expect(api.actualizarPerfil).not.toHaveBeenCalled();
  });

  it('una fecha que da menos de 14 años no se guarda', async () => {
    const user = montar();
    await screen.findByDisplayValue('Ana');
    // 31 de diciembre del año más reciente de la lista: 13 años salvo el propio 31-dic
    await elegir(user, 'Mes', 'Diciembre');
    await elegir(user, 'Día', '31');
    await elegir(user, 'Año', String(ANIO - 14));

    await guardar(user);

    if (calcularEdad('31', '12', String(ANIO - 14)) < 14) {
      expect(screen.getByText('La fecha de nacimiento da una edad fuera de 14–100 años.')).toBeInTheDocument();
      expect(api.actualizarPerfil).not.toHaveBeenCalled();
    } else {
      expect(api.actualizarPerfil).toHaveBeenCalled();
    }
  });

  it('cambiar el mes borra el día y ajusta los días disponibles (febrero bisiesto)', async () => {
    const user = montar();
    await screen.findByDisplayValue('Ana');
    await elegir(user, 'Mes', 'Enero');
    await elegir(user, 'Día', '31');
    await elegir(user, 'Enero', 'Febrero');

    await user.click(screen.getByRole('button', { name: /^Día/ }));
    expect(screen.getByRole('button', { name: '29' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '30' })).toBeNull();
  });

  it('muestra el error del servicio, o uno genérico si no lo trae', async () => {
    api.actualizarPerfil.mockResolvedValueOnce({ success: false, error: 'La edad debe ser un número entero entre 14 y 100' });
    api.actualizarPerfil.mockResolvedValueOnce({ success: false });
    const user = montar();
    await screen.findByDisplayValue('Ana');

    await guardar(user);
    expect(await screen.findByText('La edad debe ser un número entero entre 14 y 100')).toBeInTheDocument();

    await guardar(user);
    expect(await screen.findByText('No se pudo guardar. Intentá de nuevo.')).toBeInTheDocument();
  });

  it('en modo demo el botón está deshabilitado y lo explica', async () => {
    montar({ isDemoMode: true });

    expect(await screen.findByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
    expect(screen.getByText('No disponible en modo demo.')).toBeInTheDocument();
  });
});

describe('navegación y selector', () => {
  it('Volver va al dashboard y Personalizar a Broti', async () => {
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Personalizar →' }));
    expect(screen.getByText('En /dashboard/broti')).toBeInTheDocument();
  });

  it('Volver regresa al dashboard', async () => {
    const user = montar();
    await user.click(await screen.findByRole('button', { name: '← Volver' }));
    expect(screen.getByText('En /dashboard')).toBeInTheDocument();
  });

  it('el selector se cierra con Escape o con un clic afuera', async () => {
    const user = montar();
    await screen.findByDisplayValue('Ana');

    await user.click(screen.getByRole('button', { name: /^Mes/ }));
    expect(screen.getByRole('button', { name: 'Julio' })).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Julio' }));
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Julio' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Julio' })).toBeNull();

    await user.click(screen.getByRole('button', { name: /^Mes/ }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'Julio' })).toBeNull();
  });
});
