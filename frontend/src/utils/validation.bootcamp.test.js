import { describe, expect, it } from 'vitest';
import { getPasswordStrength, isValidEmail, isValidPassword, validateFields } from './validation';

// Semana 2 — David / Front. AAA y particiones de equivalencia.
describe('validación de entradas — valores límite', () => {
  it.each([
    ['a@b.co', true],
    ['nombre+tag@dominio.com', true],
    ['dos palabras@correo.com', false],
    ['sin-arroba.example.com', false],
    ['a@dominio', false],
    ['a@@dominio.com', false],
  ])('isValidEmail(%s) => %s', (correo, esperado) => {
    // Arrange: correo y expectativa; Act:
    const resultado = isValidEmail(correo);
    // Assert:
    expect(resultado).toBe(esperado);
  });

  it.each([
    ['abc1234', false], // siete caracteres: límite inferior
    ['abc12345', true], // ocho: primer valor válido
    ['12345678', false], // faltan letras
    ['abcdefgh', false], // faltan dígitos
  ])('isValidPassword valida %s', (password, esperado) => {
    // Arrange / Act / Assert
    expect(isValidPassword(password)).toBe(esperado);
  });

  it.each([
    ['abc1234', 'Débil'],
    ['abc12345', 'Media'],
    ['Abc1234!', 'Fuerte'],
  ])('clasifica la fortaleza de %s como %s', (password, esperada) => {
    // Arrange / Act / Assert
    expect(getPasswordStrength(password)).toBe(esperada);
  });

  it('el modo recuperación solo requiere correo y no contraseña', () => {
    // Arrange
    const campos = { email: 'estudiante@brota.co', password: '' };
    // Act
    const errores = validateFields(campos, 'forgotPassword');
    // Assert
    expect(errores).toEqual({});
  });

  it('el registro rechaza confirmación diferente aunque el resto esté completo', () => {
    // Arrange
    const campos = {
      email: 'a@b.com', password: 'brota2026', confirmPassword: 'brota2027',
      nombre: 'Ana', apellido: 'Ruiz', nivelEducativo: 'Media', grado: '10',
      edad: '16', ciudad: 'Bogotá', telefono: '3001234567',
    };
    // Act
    const errores = validateFields(campos, 'signup');
    // Assert
    expect(errores).toEqual({ confirmPassword: 'Las contraseñas no coinciden' });
  });
});
