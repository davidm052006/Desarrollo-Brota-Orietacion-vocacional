import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignupCard from './SignupCard';

// La validación del formulario vive en Login: el botón queda habilitado para
// que, al enviarlo incompleto, se muestren los mensajes de campo requerido
// (lo cubre e2e/tests/signup-validation.spec.js). Solo se deshabilita mientras carga.
describe('SignupCard', () => {
  it('deja enviar el formulario incompleto para que Login muestre la validación', () => {
    render(<SignupCard />);

    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled();
  });

  it('deshabilita el envío mientras se crea la cuenta', () => {
    render(<SignupCard loading />);

    expect(screen.getByRole('button', { name: /Crear cuenta|Creando/ })).toBeDisabled();
  });
});
