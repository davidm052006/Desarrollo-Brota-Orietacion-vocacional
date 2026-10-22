import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignupCard from './SignupCard';

describe('SignupCard', () => {
  it('mantiene deshabilitado el envío cuando el formulario está incompleto', () => {
    render(<SignupCard />);

    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled();
  });
});
