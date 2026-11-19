// Semana 6 · Parte 4 (umbral 70%) · Julian
// Carrusel de la home: la primera slide refleja el estado real del test
// (borrador en localStorage, resultado guardado o nuevo), navegación con
// flechas y puntos, autoplay que se pausa con el mouse y CTAs de los banners.
// perfilService es stub.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { storageKey, getCategoriaInfo } from '../../../utils/vocacionalCategorias';

const perfil = vi.hoisted(() => ({ obtenerResultado: vi.fn() }));
vi.mock('../../../services/perfilService', () => perfil);

import BannerCarousel from './BannerCarousel';

function Destino() {
  return <p>En {useLocation().pathname}</p>;
}

function montar(props = { userId: 'u1', perfilUsuarioId: 'p1' }) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<BannerCarousel {...props} />} />
        <Route path="/dashboard/*" element={<Destino />} />
      </Routes>
    </MemoryRouter>,
  );
}

// El slide visible es el único con opacity 1.
const slideVisible = (container) =>
  [...container.querySelectorAll('div[style*="position: absolute"]')].find((d) => d.style.opacity === '1');

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  perfil.obtenerResultado.mockResolvedValue({ data: null });
});
afterEach(() => vi.useRealTimers());

describe('slide del test vocacional', () => {
  it('con un borrador guardado muestra el progreso y "Continuar"', async () => {
    localStorage.setItem(storageKey('u1'), JSON.stringify({ seleccionadas: { q1: 'a' }, preguntaIdx: 15 }));
    montar();

    expect(await screen.findByRole('button', { name: 'Continuar →' })).toBeInTheDocument();
    expect(screen.getByText('50% completado')).toBeInTheDocument();
    expect(perfil.obtenerResultado).not.toHaveBeenCalled();
  });

  it('un borrador recién empezado muestra al menos 5%', async () => {
    localStorage.setItem(storageKey('u1'), JSON.stringify({ seleccionadas: { q1: 'a' } }));
    montar();

    expect(await screen.findByText('5% completado')).toBeInTheDocument();
  });

  it('con el test terminado muestra el perfil y "Ver resultado"', async () => {
    perfil.obtenerResultado.mockResolvedValue({ data: { perfil_vocacional: { categoriaPrincipal: 'tecnologia' } } });
    montar();

    expect(await screen.findByRole('button', { name: 'Ver resultado →' })).toBeInTheDocument();
    expect(screen.getByText(`Tu perfil: ${getCategoriaInfo('tecnologia').titulo}`)).toBeInTheDocument();
    expect(screen.getByText('100% completado')).toBeInTheDocument();
  });

  it('acepta el formato viejo del resultado (perfil anidado)', async () => {
    perfil.obtenerResultado.mockResolvedValue({ data: { perfil_vocacional: { perfil: { categoriaPrincipal: 'salud' } } } });
    montar();

    expect(await screen.findByText(`Tu perfil: ${getCategoriaInfo('salud').titulo}`)).toBeInTheDocument();
  });

  it.each([
    ['borrador vacío', () => localStorage.setItem(storageKey('u1'), JSON.stringify({ seleccionadas: {} }))],
    ['borrador corrupto', () => localStorage.setItem(storageKey('u1'), '{no es json')],
    ['el servicio falla', () => perfil.obtenerResultado.mockRejectedValue(new Error('red'))],
  ])('%s → test nuevo con "Comenzar"', async (_caso, preparar) => {
    preparar();
    montar();

    expect(await screen.findByRole('button', { name: 'Comenzar →' })).toBeInTheDocument();
    expect(screen.getByText('0% completado')).toBeInTheDocument();
  });

  it('sin usuario ni perfil queda como nuevo sin llamar al servicio', async () => {
    montar({});

    expect(await screen.findByRole('button', { name: 'Comenzar →' })).toBeInTheDocument();
    expect(perfil.obtenerResultado).not.toHaveBeenCalled();
  });

  it('el botón lleva al test', async () => {
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Comenzar →' }));

    expect(screen.getByText('En /dashboard/test')).toBeInTheDocument();
  });

  it('una cuenta institución no ve la slide del test', async () => {
    const { container } = montar({ userId: 'u1', esInstitucion: true });

    expect(screen.queryByText('Test vocacional')).toBeNull();
    expect(screen.getAllByRole('button', { name: /Ir al banner/ })).toHaveLength(4);
    expect(slideVisible(container).textContent).toContain('Más de 13.000 programas del SNIES');
    expect(perfil.obtenerResultado).not.toHaveBeenCalled();
  });
});

describe('navegación', () => {
  it('flechas avanzan y retroceden en círculo', async () => {
    const { container } = montar();
    await screen.findByRole('button', { name: 'Comenzar →' });

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(slideVisible(container).textContent).toContain('Sumate a la comunidad');

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(slideVisible(container).textContent).toContain('Test vocacional');
  });

  it('los puntos llevan directo a un banner y su CTA navega', async () => {
    const { container } = montar();
    await screen.findByRole('button', { name: 'Comenzar →' });

    fireEvent.click(screen.getByRole('button', { name: 'Ir al banner 4' }));
    expect(slideVisible(container).textContent).toContain('Rutas formativas para cada área');

    fireEvent.click(screen.getByRole('button', { name: 'Ver rutas →' }));
    expect(screen.getByText('En /dashboard/rutas')).toBeInTheDocument();
  });

  it('el autoplay avanza cada 6 s y se pausa con el mouse encima', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { container } = montar();
    await screen.findByRole('button', { name: 'Comenzar →' });

    act(() => { vi.advanceTimersByTime(6000); });
    expect(slideVisible(container).textContent).toContain('Más de 13.000 programas del SNIES');

    fireEvent.mouseEnter(container.firstChild);
    act(() => { vi.advanceTimersByTime(12000); });
    expect(slideVisible(container).textContent).toContain('Más de 13.000 programas del SNIES');

    fireEvent.mouseLeave(container.firstChild);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(slideVisible(container).textContent).toContain('Basado en el modelo RIASEC');
  });
});
