import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import TopNavbar from './TopNavbar';

const mocks = vi.hoisted(() => ({
  useAdmin: vi.fn(),
  useInstitucion: vi.fn(),
  useDarkMode: vi.fn(),
  useFontFamily: vi.fn(),
  useInactivityLogout: vi.fn(),
  handleLogout: vi.fn(),
  getNotificaciones: vi.fn(),
  toggleDark: vi.fn(),
}));

vi.mock('../../hooks/useAdmin', () => ({ useAdmin: mocks.useAdmin }));
vi.mock('../../hooks/useInstitucion', () => ({ useInstitucion: mocks.useInstitucion }));
vi.mock('../../hooks/useDarkMode', () => ({ useDarkMode: mocks.useDarkMode }));
vi.mock('../../hooks/useFontFamily', () => ({ useFontFamily: mocks.useFontFamily }));
vi.mock('../../hooks/useInactivityLogout', () => ({
  useInactivityLogout: mocks.useInactivityLogout,
}));
vi.mock('../../utils/auth', () => ({ handleLogout: mocks.handleLogout }));
vi.mock('../../services/comunidadService', () => ({
  getNotificaciones: mocks.getNotificaciones,
}));
vi.mock('../Shared/BrotiAvatar', () => ({
  default: () => <span aria-hidden="true" />,
}));

function LocationDisplay() {
  const location = useLocation();
  return <output aria-label="Ruta actual">{location.pathname}</output>;
}

function renderNavbar({ profile = {}, isDemoMode = false } = {}) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <TopNavbar profile={profile} isDemoMode={isDemoMode} />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe('TopNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAdmin.mockReturnValue({ isAdmin: false, loading: false });
    mocks.useInstitucion.mockReturnValue({ esInstitucion: false });
    mocks.useDarkMode.mockReturnValue([false, mocks.toggleDark]);
    mocks.useInactivityLogout.mockReturnValue({
      mostrarAviso: false,
      segundosRestantes: 30,
      seguirConectado: vi.fn(),
      cerrarSesionAhora: vi.fn(),
    });
    mocks.getNotificaciones.mockResolvedValue({ success: true, data: [] });
  });

  it('muestra la navegación de estudiante sin enlaces de administración', () => {
    renderNavbar();

    expect(screen.getByRole('link', { name: 'Test vocacional' }).getAttribute('href'))
      .toBe('/dashboard/test');
    expect(screen.queryByRole('link', { name: 'Panel Admin' })).toBeNull();
  });

  it('oculta el test vocacional y muestra la institución para un perfil institucional', () => {
    mocks.useInstitucion.mockReturnValue({ esInstitucion: true });

    renderNavbar();

    expect(screen.queryByRole('link', { name: 'Test vocacional' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Mi institución' }).getAttribute('href'))
      .toBe('/dashboard/institucion');
  });

  it('abre el perfil incompleto y navega a editarlo al pulsar el botón', async () => {
    const user = userEvent.setup();
    renderNavbar({ profile: {} });

    await user.click(screen.getByRole('button', { name: /Mi perfil/ }));

    expect(screen.getByText('Perfil 0% completo')).toBeTruthy();
    expect(screen.getAllByText('Sin definir')).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Editar perfil →' }));

    expect(screen.getByLabelText('Ruta actual').textContent).toBe('/dashboard/perfil');
  });

  it('no consulta notificaciones en modo demo', async () => {
    renderNavbar({ isDemoMode: true });

    await waitFor(() => {
      expect(mocks.getNotificaciones).not.toHaveBeenCalled();
    });
  });
});
