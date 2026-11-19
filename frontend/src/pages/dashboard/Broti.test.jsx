// Semana 6 · Parte 4 (umbral 70%) · Julian
// Personalización de Broti: lo equipado en "Mi Broti", equipar y quitar
// desde la tienda (toggle), qué se guarda y el modo demo. perfilService es stub.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ok, falla } from '../../test/helpers';

vi.mock('../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const api = vi.hoisted(() => ({ obtenerPerfil: vi.fn(), actualizarBroti: vi.fn() }));
vi.mock('../../services/perfilService', () => api);

import Broti from './Broti';

function montar(props = {}) {
  const user = userEvent.setup();
  render(<Broti user={{ id: 'u1' }} {...props} />);
  return user;
}
const imagenBroti = () => screen.getByAltText('Broti');
const vista = (container) => container.querySelector('img[alt="Broti"]').parentElement;

beforeEach(() => {
  vi.clearAllMocks();
  api.obtenerPerfil.mockResolvedValue(ok({ id: 'p1', broti_config: { variante: 'variante-panda', fondo: 'fondo-cielo' } }));
  api.actualizarBroti.mockResolvedValue({ success: true });
});

describe('Mi Broti', () => {
  it('muestra la variante y el fondo equipados', async () => {
    const { container } = render(<Broti user={{ id: 'u1' }} />);

    expect(await screen.findByText(/Panda/)).toBeInTheDocument();
    expect(screen.getByText(/Cielo con arcoíris/)).toBeInTheDocument();
    expect(imagenBroti()).toHaveAttribute('src', '/broti/variantes/panda.png');
    expect(vista(container).style.background).toContain('cielo-arcoiris.jpg');
  });

  it('sin nada equipado muestra la mascota base y "Nada equipado"', async () => {
    api.obtenerPerfil.mockResolvedValue(ok({ id: 'p1', broti_config: null }));
    montar();

    expect(await screen.findAllByText('Nada equipado')).toHaveLength(2);
    expect(imagenBroti()).toHaveAttribute('src', '/logos/logo-feliz.svg');
  });

  it('si el perfil no carga arranca sin nada equipado', async () => {
    api.obtenerPerfil.mockResolvedValue(falla('x'));
    montar();

    expect(await screen.findAllByText('Nada equipado')).toHaveLength(2);
  });

  it('sin sesión se queda cargando', () => {
    render(<Broti user={null} />);

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(api.obtenerPerfil).not.toHaveBeenCalled();
  });

  it('Quitar deja vacía esa categoría y lo guarda', async () => {
    const user = montar();
    const [quitarVariante] = await screen.findAllByRole('button', { name: 'Quitar' });

    await user.click(quitarVariante);

    expect(api.actualizarBroti).toHaveBeenCalledWith('u1', { variante: null, fondo: 'fondo-cielo' });
    expect(screen.getByText('Nada equipado')).toBeInTheDocument();
    expect(imagenBroti()).toHaveAttribute('src', '/logos/logo-feliz.svg');
  });
});

describe('Tienda', () => {
  it('lista los items con su etiqueta Gratis o Premium', async () => {
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Tienda' }));

    expect(screen.getByRole('button', { name: /Zorro.*Premium/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bosque encantado.*Gratis/ })).toBeInTheDocument();
    expect(screen.getByText(/todo se puede usar sin costo/)).toBeInTheDocument();
  });

  it('equipar otro item lo reemplaza y lo guarda; tocar el equipado lo quita', async () => {
    const user = montar();
    await user.click(await screen.findByRole('button', { name: 'Tienda' }));

    await user.click(screen.getByRole('button', { name: /Zorro/ }));
    expect(api.actualizarBroti).toHaveBeenLastCalledWith('u1', { variante: 'variante-zorro', fondo: 'fondo-cielo' });

    await user.click(screen.getByRole('button', { name: /Cielo con arcoíris/ }));
    expect(api.actualizarBroti).toHaveBeenLastCalledWith('u1', { variante: 'variante-zorro', fondo: null });

    await user.click(screen.getByRole('button', { name: 'Mi Broti' }));
    expect(screen.getByText(/Zorro/)).toBeInTheDocument();
    expect(screen.getByText('Nada equipado')).toBeInTheDocument();
  });

  it('en modo demo cambia la vista pero no guarda', async () => {
    const user = montar({ isDemoMode: true });
    expect(await screen.findByText('No se guarda en modo demo.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tienda' }));
    await user.click(screen.getByRole('button', { name: /Espacio/ }));
    await user.click(screen.getByRole('button', { name: 'Mi Broti' }));

    expect(screen.getByText(/Espacio/)).toBeInTheDocument();
    expect(api.actualizarBroti).not.toHaveBeenCalled();
  });
});
