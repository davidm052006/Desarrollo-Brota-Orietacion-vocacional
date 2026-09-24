import { describe, expect, it } from 'vitest';
import { translateAuthError } from './authErrors';

describe('translateAuthError', () => {
  it('traduce credenciales inválidas', () => {
    expect(translateAuthError('Invalid login credentials')).toBe('Correo o contraseña incorrectos.');
    expect(translateAuthError('Invalid email or password')).toBe('Correo o contraseña incorrectos.');
  });

  it('traduce errores comunes de confirmación y registro', () => {
    expect(translateAuthError('Email not confirmed')).toBe('Debes confirmar tu correo antes de iniciar sesión.');
    expect(translateAuthError('User already registered')).toBe('Este correo ya está registrado. Intenta iniciar sesión.');
  });

  it('devuelve un mensaje genérico seguro cuando el error no está mapeado', () => {
    expect(translateAuthError('AuthApiError: unexpected issue')).toBe('Ocurrió un error. Intenta nuevamente.');
    expect(translateAuthError(null)).toBe('Ocurrió un error. Intenta nuevamente.');
  });
});
