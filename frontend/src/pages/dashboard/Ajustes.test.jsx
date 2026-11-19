// Semana 6 · Parte 4 (umbral 70%) · Julian
// Ajustes: tipo de letra (persistido), cambio de contraseña con código OTP
// de 8 dígitos y sus validaciones, reenviar código, cerrar sesión y modo
// demo. perfilService, authService y utils/auth son stubs.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ok, falla, campo } from '../../test/helpers';

vi.mock('../../components/Layout/DashboardLayout', () => ({ default: ({ children }) => <main>{children}</main> }));

const perfil = vi.hoisted(() => ({ obtenerPerfil: vi.fn() }));
const auth = vi.hoisted(() => ({ sendPasswordReset: vi.fn(), verifyOtpAndUpdatePassword: vi.fn() }));
const sesion = vi.hoisted(() => ({ handleLogout: vi.fn() }));
vi.mock('../../services/perfilService', () => perfil);
vi.mock('../../services/authService', () => auth);
vi.mock('../../utils/auth', () => sesion);

import Ajustes from './Ajustes';

const USUARIO = { id: 'u1', email: 'ana@colegio.co' };

function montar(props = {}) {
  const user = userEvent.setup();
  render(<Ajustes user={USUARIO} {...props} />);
  return user;
}

async function pedirCodigo(user) {
  await user.click(await screen.findByRole('button', { name: 'Enviar código de verificación' }));
  await screen.findByText(`Te enviamos un código de 8 dígitos a ${USUARIO.email}.`);
}

async function llenar(user, { codigo = '12345678', nueva = 'nuevaClave1', confirmar = 'nuevaClave1' } = {}) {
  if (codigo) await user.type(campo('Código de 8 dígitos'), codigo);
  if (nueva) await user.type(campo('Nueva contraseña'), nueva);
  if (confirmar) await user.type(campo('Confirmar contraseña'), confirmar);
}

const cambiar = (user) => user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  perfil.obtenerPerfil.mockResolvedValue(ok({ id: 'p1' }));
  auth.sendPasswordReset.mockResolvedValue({ success: true });
  auth.verifyOtpAndUpdatePassword.mockResolvedValue({ success: true });
});

describe('apariencia', () => {
  it('cambiar el tipo de letra lo aplica y lo guarda en el dispositivo', async () => {
    const user = montar();
    await user.click(await screen.findByRole('button', { name: /^Predeterminada/ }));
    await user.click(screen.getByRole('button', { name: 'Clásica' }));

    expect(localStorage.getItem('brota-font')).toBe('clasica');
    expect(document.documentElement.style.getPropertyValue('--font-body')).toContain('Georgia');
  });

  it('si el perfil no carga igual muestra los ajustes; sin sesión queda cargando', async () => {
    perfil.obtenerPerfil.mockResolvedValue(falla('x'));
    const { unmount } = render(<Ajustes user={USUARIO} />);
    expect(await screen.findByText('Apariencia')).toBeInTheDocument();
    unmount();

    render(<Ajustes user={null} />);
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });
});

describe('cambiar contraseña', () => {
  it('flujo completo: pide el código, valida y actualiza', async () => {
    const user = montar();
    await pedirCodigo(user);
    expect(auth.sendPasswordReset).toHaveBeenCalledWith(USUARIO.email);

    await llenar(user);
    await cambiar(user);

    expect(auth.verifyOtpAndUpdatePassword).toHaveBeenCalledWith(USUARIO.email, '12345678', 'nuevaClave1');
    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument();
    // Vuelve al paso inicial con el formulario limpio
    expect(screen.getByRole('button', { name: 'Enviar código de verificación' })).toBeInTheDocument();
  });

  it('el código solo acepta 8 dígitos y el botón espera a tenerlos', async () => {
    const user = montar();
    await pedirCodigo(user);

    await user.type(campo('Código de 8 dígitos'), '12ab34-5678999');

    expect(campo('Código de 8 dígitos')).toHaveValue('12345678');
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeEnabled();
  });

  it('con menos de 8 dígitos el botón queda deshabilitado', async () => {
    const user = montar();
    await pedirCodigo(user);
    await user.type(campo('Código de 8 dígitos'), '1234');

    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeDisabled();
  });

  it.each([
    ['contraseña de menos de 6 caracteres', { nueva: 'abc', confirmar: 'abc' }, 'La contraseña debe tener mínimo 6 caracteres.'],
    ['las contraseñas no coinciden', { nueva: 'nuevaClave1', confirmar: 'otraClave1' }, 'Las contraseñas no coinciden.'],
  ])('%s → avisa y no llama al servicio', async (_caso, datos, mensaje) => {
    const user = montar();
    await pedirCodigo(user);
    await llenar(user, datos);

    await cambiar(user);

    expect(screen.getByText(mensaje)).toBeInTheDocument();
    expect(auth.verifyOtpAndUpdatePassword).not.toHaveBeenCalled();
  });

  it('código rechazado: muestra el error del servicio, o uno genérico', async () => {
    auth.verifyOtpAndUpdatePassword
      .mockResolvedValueOnce({ success: false, error: 'Código inválido o vencido' })
      .mockResolvedValueOnce({ success: false });
    const user = montar();
    await pedirCodigo(user);
    await llenar(user);

    await cambiar(user);
    expect(await screen.findByText('Código inválido o vencido')).toBeInTheDocument();

    await cambiar(user);
    expect(await screen.findByText('No se pudo cambiar la contraseña.')).toBeInTheDocument();
  });

  it('si no se puede enviar el código lo dice (con o sin mensaje del servicio)', async () => {
    auth.sendPasswordReset
      .mockResolvedValueOnce({ success: false, error: 'Demasiados intentos' })
      .mockResolvedValueOnce({ success: false });
    const user = montar();
    const enviar = await screen.findByRole('button', { name: 'Enviar código de verificación' });

    await user.click(enviar);
    expect(await screen.findByText('Demasiados intentos')).toBeInTheDocument();

    await user.click(enviar);
    expect(await screen.findByText('No se pudo enviar el código.')).toBeInTheDocument();
    expect(screen.queryByText('Código de 8 dígitos')).toBeNull();
  });

  it('Reenviar código vuelve a pedirlo', async () => {
    const user = montar();
    await pedirCodigo(user);

    await user.click(screen.getByRole('button', { name: 'Reenviar código' }));

    expect(auth.sendPasswordReset).toHaveBeenCalledTimes(2);
  });

  it('en modo demo no se puede pedir el código', async () => {
    montar({ isDemoMode: true });

    expect(await screen.findByRole('button', { name: 'Enviar código de verificación' })).toBeDisabled();
    expect(screen.getByText('No disponible en modo demo.')).toBeInTheDocument();
  });
});

describe('cuenta', () => {
  it('Cerrar sesión llama a handleLogout con el modo', async () => {
    const user = montar({ isDemoMode: true });

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(sesion.handleLogout).toHaveBeenCalledWith(true);
  });

  it('muestra las opciones que vienen después como "Próximamente"', async () => {
    montar();

    expect(await screen.findByText('Exportar o eliminar mi cuenta')).toBeInTheDocument();
    expect(screen.getAllByText('Próximamente').length).toBeGreaterThanOrEqual(5);
  });
});
