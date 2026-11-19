// Pantalla de resultado del test vocacional: perfil, distribución,
// recomendaciones (con reintento), detalle del programa y exportar a PDF.
// perfilService y la exportación son stubs; el radar no se dibuja en jsdom.
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const perfil = vi.hoisted(() => ({ obtenerRecomendaciones: vi.fn(), marcarRecomendacionVista: vi.fn() }));
vi.mock('../../../../services/perfilService', () => perfil);
const pdf = vi.hoisted(() => ({ exportarElementoAPDF: vi.fn().mockResolvedValue() }));
vi.mock('../../../../utils/exportarPDF', () => pdf);
vi.mock('react-chartjs-2', () => ({ Radar: ({ data }) => <div data-testid="radar">{data.labels.flat().join('|')}</div> }));

import TestResult from './TestResult';

const PRINCIPAL = { emoji: '💻', titulo: 'Tecnología', descripcion: 'Te gusta resolver problemas', clave: 'tecnologia' };
const SCORES = [
  { categoria: 'Tecnología e innovación digital', porcentaje: 70, emoji: '💻' },
  { categoria: 'Salud', porcentaje: 30, emoji: '🏥' },
];
const REC_COMPLETA = {
  id: 'r1', nombre: 'Ingeniería de Sistemas', compatibilidad: 90, area: 'tecnologia', vista: false,
  descripcion: 'Software y redes', razones: JSON.stringify(['Te interesa la tecnología', 'Buen puntaje lógico']),
  institucion: 'UNAL', institucionTipo: 'Pública', ciudad: 'Bogotá', departamento: 'Cundinamarca', direccion: 'Cra 30',
  modalidad: 'Presencial', duracion: '10 semestres', costoMatricula: 1500000, requisitos: 'Bachiller',
  telefono: '601555', email: 'info@unal.edu.co', sitioWeb: 'https://unal.edu.co',
};
const REC_MINIMA = { id: 'r2', nombre: 'Enfermería', compatibilidad: 72, area: 'diseño', vista: true, razones: 'no-es-json', institucion: 'SENA' };
const REC_BAJA = { id: 'r3', nombre: 'Archivo', compatibilidad: 50, area: 'otra', institucion: 'X', razones: '{"a":1}' };

beforeEach(() => {
  vi.clearAllMocks();
  perfil.obtenerRecomendaciones.mockResolvedValue({ success: true, data: [REC_COMPLETA, REC_MINIMA, REC_BAJA] });
  perfil.marcarRecomendacionVista.mockResolvedValue({ success: true });
});

it('muestra el perfil principal, el secundario y la distribución', async () => {
  render(<TestResult resultadoId="res-1" perfilPrincipal={PRINCIPAL} perfilSecundario={{ emoji: '🏥', titulo: 'Salud' }} scores={SCORES} />);
  expect(screen.getByText('Te gusta resolver problemas')).toBeInTheDocument();
  expect(screen.getByText('Salud', { selector: 'b' })).toBeInTheDocument();
  expect(screen.getByText('Principal')).toBeInTheDocument();
  // Las etiquetas largas del radar se parten en líneas de máximo 14 caracteres
  expect(screen.getByTestId('radar')).toHaveTextContent('Tecnología e|innovación|digital|Salud');
  expect(await screen.findByText('Ingeniería de Sistemas')).toBeInTheDocument();
  expect(perfil.obtenerRecomendaciones).toHaveBeenCalledWith('res-1');
});

it('sin perfil ni resultado usa valores por defecto y no busca recomendaciones', () => {
  render(<TestResult />);
  expect(screen.getByText('Tu perfil')).toBeInTheDocument();
  expect(screen.queryByTestId('radar')).not.toBeInTheDocument();
  expect(screen.getByText('No encontramos programas para tu perfil.')).toBeInTheDocument();
  expect(perfil.obtenerRecomendaciones).not.toHaveBeenCalled();
});

it('las tarjetas muestran afinidad, la primera razón y la ubicación', async () => {
  render(<TestResult resultadoId="res-1" perfilPrincipal={PRINCIPAL} />);
  expect(await screen.findByText('90% afinidad')).toBeInTheDocument();
  expect(screen.getByText('72% afinidad')).toBeInTheDocument();
  expect(screen.getByText('Te interesa la tecnología')).toBeInTheDocument();
  expect(screen.getByText('Bogotá, Cundinamarca')).toBeInTheDocument();
});

it('abrir un programa no visto lo marca como visto y muestra todo el detalle', async () => {
  const onVerPrograma = vi.fn();
  const user = userEvent.setup();
  render(<TestResult resultadoId="res-1" perfilPrincipal={PRINCIPAL} onVerPrograma={onVerPrograma} />);
  await user.click(await screen.findByText('Ingeniería de Sistemas'));

  expect(perfil.marcarRecomendacionVista).toHaveBeenCalledWith('r1');
  expect(onVerPrograma).toHaveBeenCalledWith(REC_COMPLETA);
  expect(screen.getByText('90% de afinidad estimada')).toBeInTheDocument();
  expect(screen.getByText('Buen puntaje lógico')).toBeInTheDocument();
  expect(screen.getByText('Bachiller')).toBeInTheDocument();
  expect(screen.getByText(/1\.500\.000 matrícula/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /info@unal.edu.co/ })).toHaveAttribute('href', 'mailto:info@unal.edu.co');
  expect(screen.getByText(/Cra 30, Bogotá/)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '✕' }));
  expect(screen.queryByText('90% de afinidad estimada')).not.toBeInTheDocument();
});

it('abrir un programa ya visto no lo vuelve a marcar; datos mínimos no rompen el detalle', async () => {
  const user = userEvent.setup();
  render(<TestResult resultadoId="res-1" perfilPrincipal={PRINCIPAL} />);
  await user.click(await screen.findByText('Enfermería'));
  expect(perfil.marcarRecomendacionVista).not.toHaveBeenCalled();
  expect(screen.getByText('72% de afinidad estimada')).toBeInTheDocument();
  expect(screen.queryByText('Contacto de la institución')).not.toBeInTheDocument();
  await user.click(screen.getByText('72% de afinidad estimada').parentElement.parentElement);
  expect(screen.queryByText('72% de afinidad estimada')).not.toBeInTheDocument();

  await user.click(screen.getByText('Archivo'));
  expect(screen.getByText('50% de afinidad estimada')).toBeInTheDocument();
});

it('si falla la carga permite reintentar', async () => {
  perfil.obtenerRecomendaciones.mockResolvedValueOnce({ success: false, error: 'caído' })
    .mockResolvedValueOnce({ success: false, error: 'sigue caído' })
    .mockResolvedValueOnce({ success: true, data: [REC_MINIMA] });
  const user = userEvent.setup();
  render(<TestResult resultadoId="res-1" perfilPrincipal={PRINCIPAL} />);
  await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
  await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
  expect(await screen.findByText('Enfermería')).toBeInTheDocument();
  expect(perfil.obtenerRecomendaciones).toHaveBeenCalledTimes(3);
});

it('exporta el resultado a PDF y dispara las acciones finales', async () => {
  const onVerRutas = vi.fn();
  const onReiniciar = vi.fn();
  const user = userEvent.setup();
  render(<TestResult perfilPrincipal={PRINCIPAL} onVerRutas={onVerRutas} onReiniciar={onReiniciar} />);
  await user.click(screen.getByRole('button', { name: /Descargar resultado en PDF/ }));
  expect(pdf.exportarElementoAPDF).toHaveBeenCalledWith(expect.any(HTMLElement), 'brota-resultado-vocacional.pdf');
  await user.click(screen.getByRole('button', { name: 'Ver rutas formativas →' }));
  await user.click(screen.getByRole('button', { name: '↺ Volver a hacer el test' }));
  expect(onVerRutas).toHaveBeenCalledTimes(1);
  expect(onReiniciar).toHaveBeenCalledTimes(1);
});

it('perfil con ícono usa imagen en vez de emoji', () => {
  const { container } = render(<TestResult perfilPrincipal={{ ...PRINCIPAL, icono: '/i.svg' }} perfilSecundario={{ icono: '/s.svg', titulo: 'Arte' }} />);
  expect(container.querySelectorAll('img[src="/i.svg"], img[src="/s.svg"]')).toHaveLength(2);
});
