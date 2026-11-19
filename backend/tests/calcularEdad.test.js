const { calcularEdadDesdeFecha } = require('../src/utils/calcularEdad');

describe('calcularEdadDesdeFecha', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devuelve null si no se recibe una fecha', () => {
    expect(calcularEdadDesdeFecha('')).toBeNull();
    expect(calcularEdadDesdeFecha(null)).toBeNull();
  });

  it('devuelve null si la fecha no es válida', () => {
    expect(calcularEdadDesdeFecha('no-es-una-fecha')).toBeNull();
  });

  it('calcula la edad antes, el día y después del cumpleaños', () => {
    expect(calcularEdadDesdeFecha('2000-10-16T12:00:00Z')).toBe(25);
    expect(calcularEdadDesdeFecha('2000-10-15T12:00:00Z')).toBe(26);
    expect(calcularEdadDesdeFecha('2000-10-14T12:00:00Z')).toBe(26);
  });

  it('solo acepta edades entre 14 y 100 años, inclusive', () => {
    expect(calcularEdadDesdeFecha('2012-10-16T12:00:00Z')).toBeNull();
    expect(calcularEdadDesdeFecha('2012-10-15T12:00:00Z')).toBe(14);
    expect(calcularEdadDesdeFecha('2013-10-15T12:00:00Z')).toBeNull();
    expect(calcularEdadDesdeFecha('1926-10-15T12:00:00Z')).toBe(100);
    expect(calcularEdadDesdeFecha('1925-10-15T12:00:00Z')).toBeNull();
  });
});
