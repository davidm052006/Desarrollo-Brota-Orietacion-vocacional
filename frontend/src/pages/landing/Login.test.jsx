// Pantalla de acceso completa (login, registro y recuperar contraseña) con el
// hook useAuth real. Solo authService es un stub: no hay red.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const auth = vi.hoisted(() => ({
  loginWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
  verifyOtpAndUpdatePassword: vi.fn(),
}));
vi.mock('../../services/authService', () => auth);

import Login from './Login';

function montar() {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<p>Panel del estudiante</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('Login', () => {
  it('con credenciales válidas entra al dashboard', async () => {
    auth.loginWithEmail.mockResolvedValue({ success: true });
    const user = montar();
    await user.type(screen.getByPlaceholderText('Escribe tu correo…'), 'ana@brota.co');
    await user.type(screen.getByPlaceholderText('Contraseña…'), 'Clave1234');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Panel del estudiante')).toBeInTheDocument();
    expect(auth.loginWithEmail).toHaveBeenCalledWith('ana@brota.co', 'Clave1234');
  });

  it('muestra el error del servicio y se queda en la página', async () => {
    auth.loginWithEmail.mockResolvedValue({ success: false, error: 'Correo o contraseña incorrectos.' });
    const user = montar();
    await user.type(screen.getByPlaceholderText('Escribe tu correo…'), 'ana@brota.co');
    await user.type(screen.getByPlaceholderText('Contraseña…'), 'Clave1234');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument();
    expect(screen.queryByText('Panel del estudiante')).not.toBeInTheDocument();
  });

  it('el botón del ojo muestra la contraseña', async () => {
    const user = montar();
    const campo = screen.getByPlaceholderText('Contraseña…');
    expect(campo).toHaveAttribute('type', 'password');
    const ojo = campo.parentElement.querySelector('button');
    await user.click(ojo);
    expect(campo).toHaveAttribute('type', 'text');
  });

  it('el modo oscuro se puede alternar', async () => {
    const user = montar();
    await user.click(screen.getByTitle('Modo oscuro'));
    expect(screen.getByTitle('Modo claro')).toBeInTheDocument();
    expect(localStorage.getItem('brota-theme')).toBe('dark');
  });
});

describe('Registro', () => {
  async function irARegistro() {
    const user = montar();
    await user.click(screen.getByRole('button', { name: 'Regístrate' }));
    return user;
  }

  it('Crear cuenta con el formulario vacío muestra la validación y no registra', async () => {
    const user = await irARegistro();
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('El nombre es requerido')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
    expect(auth.signUpWithEmail).not.toHaveBeenCalled();
  });

  it('completa el formulario, elige ciudad del autocompletado y crea la cuenta', async () => {
    auth.signUpWithEmail.mockResolvedValue({ success: true });
    const user = await irARegistro();

    await user.type(screen.getByPlaceholderText('Nombres completos'), 'Ana');
    await user.type(screen.getByPlaceholderText('Apellidos completos'), 'Ruiz');
    await user.type(screen.getByPlaceholderText('Correo electrónico'), 'ana@brota.co');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'Clave1234');
    expect(screen.getByText('Media')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Confirmar contraseña'), 'Clave1234');
    const [nivel, grado] = screen.getAllByRole('combobox');
    await user.selectOptions(nivel, 'Tecnico');
    await user.selectOptions(grado, 'Once');
    await user.type(screen.getByPlaceholderText('Fecha de nacimiento'), '2009-05-01');
    await user.type(screen.getByPlaceholderText('Ciudad'), 'Med');
    await user.click(await screen.findByRole('button', { name: 'Medellín' }));
    expect(screen.getByPlaceholderText('Ciudad')).toHaveValue('Medellín');
    await user.type(screen.getByPlaceholderText('Número de teléfono'), '3001234567');
    await user.click(screen.getByRole('checkbox'));

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Panel del estudiante')).toBeInTheDocument();
    expect(auth.signUpWithEmail).toHaveBeenCalledWith('ana@brota.co', 'Clave1234', 'Ana', 'Ruiz', {
      nivelEducativo: 'Tecnico', grado: 'Once', fechaNacimiento: '2009-05-01', ciudad: 'Medellín', telefono: '3001234567',
    });
  });

  it('Inicia sesión vuelve al formulario de login', async () => {
    const user = await irARegistro();
    await user.click(screen.getByRole('button', { name: 'Inicia sesión' }));
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });
});

describe('Recuperar contraseña', () => {
  async function irARecuperar() {
    const user = montar();
    await user.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    return user;
  }

  it('valida el correo antes de enviar el código', async () => {
    const user = await irARecuperar();
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(screen.getByText('El correo es requerido')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Escribe tu correo…'), 'ana@');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(screen.getByText('Correo inválido')).toBeInTheDocument();
    expect(auth.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('error al enviar el código se muestra en el paso 1', async () => {
    auth.sendPasswordReset.mockResolvedValue({ success: false, error: 'Demasiados intentos.' });
    const user = await irARecuperar();
    await user.type(screen.getByPlaceholderText('Escribe tu correo…'), 'ana@brota.co');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(await screen.findByText('Demasiados intentos.')).toBeInTheDocument();
  });

  it('flujo completo: código, nueva clave y regreso al login a los 3 s', async () => {
    auth.sendPasswordReset.mockResolvedValue({ success: true });
    auth.verifyOtpAndUpdatePassword.mockResolvedValue({ success: true });
    const user = await irARecuperar();
    await user.type(screen.getByPlaceholderText('Escribe tu correo…'), 'ana@brota.co');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(await screen.findByText('Enviamos un código de 8 dígitos a ana@brota.co')).toBeInTheDocument();

    // Validaciones del paso 2
    await user.type(screen.getByPlaceholderText('Código de 8 dígitos'), '12ab34');
    expect(screen.getByPlaceholderText('Código de 8 dígitos')).toHaveValue('1234');
    await user.type(screen.getByPlaceholderText('Nueva contraseña'), 'corta');
    await user.type(screen.getByPlaceholderText('Confirmar contraseña'), 'otra');
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(screen.getByText('Ingresa el código de 8 dígitos')).toBeInTheDocument();
    expect(screen.getByText('Mínimo 8 caracteres, con letras y números')).toBeInTheDocument();
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(auth.verifyOtpAndUpdatePassword).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText('Código de 8 dígitos'), '56789');
    await user.clear(screen.getByPlaceholderText('Nueva contraseña'));
    await user.type(screen.getByPlaceholderText('Nueva contraseña'), 'Nueva1234');
    await user.clear(screen.getByPlaceholderText('Confirmar contraseña'));
    await user.type(screen.getByPlaceholderText('Confirmar contraseña'), 'Nueva1234');

    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
      expect(await screen.findByText(/Contraseña cambiada con éxito/)).toBeInTheDocument();
      expect(auth.verifyOtpAndUpdatePassword).toHaveBeenCalledWith('ana@brota.co', '12345678', 'Nueva1234');
      await act(async () => { vi.advanceTimersByTime(3000); });
      await waitFor(() => expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument());
    } finally {
      vi.useRealTimers();
    }
  });

  it('código rechazado muestra el error; "reenviar" vuelve al paso 1', async () => {
    auth.sendPasswordReset.mockResolvedValue({ success: true });
    auth.verifyOtpAndUpdatePassword.mockResolvedValue({ success: false, error: 'Código incorrecto o expirado.' });
    const user = await irARecuperar();
    await user.type(screen.getByPlaceholderText('Escribe tu correo…'), 'ana@brota.co');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    await user.type(await screen.findByPlaceholderText('Código de 8 dígitos'), '12345678');
    await user.type(screen.getByPlaceholderText('Nueva contraseña'), 'Nueva1234');
    await user.type(screen.getByPlaceholderText('Confirmar contraseña'), 'Nueva1234');
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(await screen.findByText('Código incorrecto o expirado.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reenviar|volver a enviar|enviar de nuevo/i }));
    expect(screen.getByRole('button', { name: 'Enviar código' })).toBeInTheDocument();
  });

  it('"Volver al inicio" regresa al login', async () => {
    const user = await irARecuperar();
    await user.click(screen.getByRole('button', { name: 'Volver al inicio' }));
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });
});
