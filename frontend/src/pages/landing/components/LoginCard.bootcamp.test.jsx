import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginCard from './LoginCard';

afterEach(cleanup);

const propsBase = () => ({
  email: '', password: '', validationErrors: {}, error: '', loading: false,
  onEmailChange: vi.fn(), onPasswordChange: vi.fn(), onSubmit: vi.fn((e) => e.preventDefault()),
  onSwitchToSignup: vi.fn(), onSwitchToForgotPassword: vi.fn(),
});

function montar(props) {
  render(<MemoryRouter><LoginCard {...props} /></MemoryRouter>);
}

describe('LoginCard — David / S3', () => {
  it('permite escribir en correo y contraseña y enviar el formulario', async () => {
    // Arrange
    const props = propsBase();
    montar(props);
    const user = userEvent.setup();
    // Act
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu correo…' }), 'a@b.co');
    await user.type(screen.getByLabelText('Contraseña…'), 'abc12345');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    // Assert
    expect(props.onEmailChange).toHaveBeenCalled();
    expect(props.onPasswordChange).toHaveBeenCalled();
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('muestra las validaciones del login sin reemplazarlas por éxito', () => {
    // Arrange / Act
    montar({ ...propsBase(), validationErrors: { email: 'El correo es requerido', password: 'La contraseña es requerida' } });
    // Assert
    expect(screen.getByText('El correo es requerido')).toBeTruthy();
    expect(screen.getByText('La contraseña es requerida')).toBeTruthy();
  });

  it('deshabilita el envío mientras la petición está en curso', () => {
    // Arrange / Act
    montar({ ...propsBase(), loading: true });
    // Assert
    expect(screen.getByRole('button', { name: 'Ingresando…' }).disabled).toBe(true);
  });

  it('permite cambiar a registro y recuperación de contraseña', async () => {
    // Arrange
    const props = propsBase();
    montar(props);
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByRole('button', { name: 'Regístrate' }));
    await user.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    // Assert
    expect(props.onSwitchToSignup).toHaveBeenCalledTimes(1);
    expect(props.onSwitchToForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('informa el error recibido del servidor sin ocultar el formulario', () => {
    // Arrange / Act
    montar({ ...propsBase(), error: 'Credenciales inválidas' });
    // Assert
    expect(screen.getByText('Credenciales inválidas')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ingresar' }).disabled).toBe(false);
  });
});
