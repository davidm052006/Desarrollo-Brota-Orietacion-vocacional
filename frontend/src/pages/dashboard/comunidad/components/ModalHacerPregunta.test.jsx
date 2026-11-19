import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalHacerPregunta from './ModalHacerPregunta';
import { crearPregunta } from '../../../../services/comunidadService';

// Doble del servicio: el modal solo usa crearPregunta, pero primitivos.jsx
// también importa las funciones de moderación, así que se declaran vacías.
vi.mock('../../../../services/comunidadService', () => ({
  crearPregunta: vi.fn(),
  ocultarPublicacion: vi.fn(),
  eliminarPublicacion: vi.fn(),
}));

afterEach(cleanup);
beforeEach(() => vi.mocked(crearPregunta).mockReset());

function montar() {
  const props = { onClose: vi.fn(), onPublicada: vi.fn() };
  render(<ModalHacerPregunta {...props} />);
  return { props, user: userEvent.setup() };
}

const campoPregunta = () => screen.getByLabelText('Tu pregunta');
const botonPublicar = () => screen.getByRole('button', { name: 'Publicar pregunta' });

describe('ModalHacerPregunta — Julian / S3', () => {
  it('envía la pregunta con el área y el modo anónimo elegidos y muestra la confirmación', async () => {
    // Arrange
    vi.mocked(crearPregunta).mockResolvedValue({ success: true });
    const { props, user } = montar();
    // Act
    await user.type(campoPregunta(), '¿Qué estudio si me gusta la biología?');
    await user.click(screen.getByRole('button', { name: 'Salud' }));
    await user.click(screen.getByRole('switch', { name: 'Publicar como anónimo.' }));
    await user.click(botonPublicar());
    // Assert
    expect(crearPregunta).toHaveBeenCalledTimes(1);
    expect(crearPregunta).toHaveBeenCalledWith({
      titulo: '¿Qué estudio si me gusta la biología?',
      area: 'Salud',
      anonimo: true,
    });
    expect(await screen.findByText('¡Pregunta publicada!')).toBeTruthy();
    expect(props.onPublicada).toHaveBeenCalledTimes(1);
  });

  it('elegir un área o el modo anónimo no publica la pregunta antes de tiempo', async () => {
    // Arrange
    const { user } = montar();
    // Act
    await user.type(campoPregunta(), 'Pregunta a medio escribir');
    await user.click(screen.getByRole('button', { name: 'Artes' }));
    await user.click(screen.getByRole('switch', { name: 'Publicar como anónimo.' }));
    // Assert
    expect(crearPregunta).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Artes' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('switch', { name: 'Publicar como anónimo.' }).getAttribute('aria-checked')).toBe('true');
  });

  it('no envía una pregunta vacía', async () => {
    // Arrange
    const { user } = montar();
    // Act
    await user.click(botonPublicar());
    // Assert
    expect(crearPregunta).not.toHaveBeenCalled();
    expect(campoPregunta().validity.valueMissing).toBe(true);
  });

  it('muestra el error del servidor, no confirma y deja reintentar', async () => {
    // Arrange
    vi.mocked(crearPregunta).mockResolvedValue({ success: false, error: 'Debes iniciar sesión' });
    const { props, user } = montar();
    // Act
    await user.type(campoPregunta(), '¿Sirve el SENA para entrar a la universidad?');
    await user.click(botonPublicar());
    // Assert
    expect((await screen.findByRole('alert')).textContent).toBe('Debes iniciar sesión');
    expect(screen.queryByText('¡Pregunta publicada!')).toBeNull();
    expect(props.onPublicada).not.toHaveBeenCalled();
    expect(botonPublicar().disabled).toBe(false);
  });

  it('usa un mensaje genérico si el servidor no explica el error', async () => {
    // Arrange
    vi.mocked(crearPregunta).mockResolvedValue({ success: false });
    const { user } = montar();
    // Act
    await user.type(campoPregunta(), 'Hola');
    await user.click(botonPublicar());
    // Assert
    expect((await screen.findByRole('alert')).textContent).toBe('Error al publicar. Intenta de nuevo.');
  });

  it('bloquea el botón mientras publica para evitar envíos dobles', async () => {
    // Arrange
    let responder;
    vi.mocked(crearPregunta).mockReturnValue(new Promise((r) => { responder = r; }));
    const { user } = montar();
    // Act
    await user.type(campoPregunta(), 'Pregunta lenta');
    await user.click(botonPublicar());
    const publicando = screen.getByRole('button', { name: 'Publicando…' });
    await user.click(publicando);
    // Assert
    expect(publicando.disabled).toBe(true);
    expect(crearPregunta).toHaveBeenCalledTimes(1);
    responder({ success: true });
    expect(await screen.findByText('¡Pregunta publicada!')).toBeTruthy();
  });

  it('el botón de cerrar llama a onClose sin publicar', async () => {
    // Arrange
    const { props, user } = montar();
    // Act
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    // Assert
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(crearPregunta).not.toHaveBeenCalled();
  });
});
