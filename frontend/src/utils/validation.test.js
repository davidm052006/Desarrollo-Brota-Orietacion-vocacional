import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, validateFields } from './validation';

// Pruebas mínimas de arranque (agosto 2026) — no había cobertura previa en
// todo el repo. Cubren la validación real que usa el flujo de login/registro
// (Login.jsx vía useAuth), no una reimplementación aparte.

describe('isValidEmail', () => {
  it('acepta un correo válido', () => {
    expect(isValidEmail('estudiante@correo.com')).toBe(true);
  });

  it('rechaza un correo sin arroba', () => {
    expect(isValidEmail('estudiante-correo.com')).toBe(false);
  });

  it('rechaza un correo sin dominio', () => {
    expect(isValidEmail('estudiante@correo')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('acepta una contraseña con letras, números y 8+ caracteres', () => {
    expect(isValidPassword('brota2026')).toBe(true);
  });

  it('rechaza una contraseña corta', () => {
    expect(isValidPassword('br26')).toBe(false);
  });

  it('rechaza una contraseña sin números', () => {
    expect(isValidPassword('brotasena')).toBe(false);
  });
});

describe('validateFields (modo login)', () => {
  it('no genera errores con email y password válidos', () => {
    const errores = validateFields({ email: 'a@b.com', password: 'brota2026' }, 'login');
    expect(errores).toEqual({});
  });

  it('marca el email como requerido si viene vacío', () => {
    const errores = validateFields({ email: '', password: 'brota2026' }, 'login');
    expect(errores.email).toBe('El correo es requerido');
  });
});

describe('validateFields (modo signup)', () => {
  it('exige los campos extra de registro', () => {
    const errores = validateFields({ email: 'a@b.com', password: 'brota2026' }, 'signup');
    expect(errores.nombre).toBeTruthy();
    expect(errores.apellido).toBeTruthy();
    expect(errores.confirmPassword).toBeTruthy();
  });

  it('marca confirmPassword si no coincide con password', () => {
    const errores = validateFields({
      email: 'a@b.com', password: 'brota2026', confirmPassword: 'otra1234',
      nombre: 'Ana', apellido: 'Ruiz', nivelEducativo: 'Media', grado: '10', edad: '16', ciudad: 'Cali', telefono: '3000000000',
    }, 'signup');
    expect(errores.confirmPassword).toBe('Las contraseñas no coinciden');
  });
});
