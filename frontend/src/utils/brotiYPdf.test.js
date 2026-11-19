// Catálogo de Broti y exportación a PDF. html2canvas y jsPDF son stubs:
// se verifica qué se les pide, no el PDF real.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ITEMS, CATEGORIAS, getItem, getItemsPorCategoria, getBadgeBackground } from './brotiCatalog';

const pdf = vi.hoisted(() => ({ addImage: vi.fn(), save: vi.fn(), opciones: null }));
const html2canvas = vi.hoisted(() => vi.fn());
vi.mock('html2canvas', () => ({ default: html2canvas }));
vi.mock('jspdf', () => ({
  default: vi.fn(function JsPDF(opciones) {
    pdf.opciones = opciones;
    return pdf;
  }),
}));

import { exportarElementoAPDF } from './exportarPDF';

describe('brotiCatalog', () => {
  it('cada ítem pertenece a una categoría existente y los ids son únicos', () => {
    const claves = CATEGORIAS.map((c) => c.key);
    expect(ITEMS.every((i) => claves.includes(i.categoria))).toBe(true);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  it('getItem busca por id o devuelve null', () => {
    expect(getItem('variante-panda').nombre).toBe('Panda');
    expect(getItem('no-existe')).toBeNull();
  });

  it('getItemsPorCategoria filtra', () => {
    const fondos = getItemsPorCategoria('fondo');
    expect(fondos.length).toBeGreaterThan(0);
    expect(fondos.every((i) => i.categoria === 'fondo')).toBe(true);
    expect(getItemsPorCategoria('sombrero')).toEqual([]);
  });

  it('getBadgeBackground: imagen, color o superficie por defecto', () => {
    expect(getBadgeBackground(null)).toBe('var(--surface-2)');
    expect(getBadgeBackground({ color: '#123456' })).toBe('#123456');
    expect(getBadgeBackground({ imagen: '/a.png', color: '#000' })).toBe('url(/a.png) center / cover');
  });
});

describe('exportarElementoAPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pdf.opciones = null;
  });

  it('sin elemento no hace nada', async () => {
    await exportarElementoAPDF(null);
    expect(html2canvas).not.toHaveBeenCalled();
  });

  it('captura el elemento y guarda un PDF del tamaño del canvas', async () => {
    html2canvas.mockResolvedValue({ width: 800, height: 600, toDataURL: () => 'data:image/png;base64,AAA' });
    const el = document.createElement('div');
    await exportarElementoAPDF(el, 'reporte.pdf');

    expect(html2canvas).toHaveBeenCalledWith(el, expect.objectContaining({ scale: 2, useCORS: true, backgroundColor: '#ffffff' }));
    expect(pdf.opciones).toEqual({ orientation: 'landscape', unit: 'px', format: [800, 600] });
    expect(pdf.addImage).toHaveBeenCalledWith('data:image/png;base64,AAA', 'PNG', 0, 0, 800, 600);
    expect(pdf.save).toHaveBeenCalledWith('reporte.pdf');
  });

  it('usa orientación vertical, el color de --surface y el nombre por defecto', async () => {
    document.documentElement.style.setProperty('--surface', '#101010');
    html2canvas.mockResolvedValue({ width: 300, height: 900, toDataURL: () => 'x' });
    await exportarElementoAPDF(document.createElement('div'));
    document.documentElement.style.removeProperty('--surface');

    expect(html2canvas.mock.calls[0][1].backgroundColor).toBe('#101010');
    expect(pdf.opciones.orientation).toBe('portrait');
    expect(pdf.save).toHaveBeenCalledWith('brota-export.pdf');
  });
});
