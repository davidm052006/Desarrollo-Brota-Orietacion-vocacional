// Semana 2 · capa BD · Julian
// Unidad bajo prueba: calcularEdadDesdeFecha (backend/src/utils/calcularEdad.js)
// La fecha de referencia `hoy` se inyecta: los tests no dependen del reloj.
const { calcularEdadDesdeFecha } = require('../src/utils/calcularEdad');

// 15 de octubre de 2026, mediodía local (mes 9 = octubre).
const HOY = new Date(2026, 9, 15, 12, 0, 0);

describe('calcularEdadDesdeFecha', () => {
  describe('cumpleaños: antes, el mismo día y después', () => {
    test.each([
      ['un día antes del cumpleaños', '2000-10-16', 25],
      ['el mismo día del cumpleaños', '2000-10-15', 26],
      ['un día después del cumpleaños', '2000-10-14', 26],
      ['mes de nacimiento aún no llega', '2000-11-01', 25],
      ['mes de nacimiento ya pasó', '2000-09-30', 26],
    ])('%s (%s) → %i años', (_caso, fechaNacimiento, esperado) => {
      // Arrange: HOY fijo y la fecha del caso
      // Act
      const edad = calcularEdadDesdeFecha(fechaNacimiento, HOY);
      // Assert
      expect(edad).toBe(esperado);
    });
  });

  describe('valores límite del rango permitido (14 a 100 años)', () => {
    test.each([
      ['13 años (uno por debajo del mínimo)', '2013-10-15', null],
      ['un día antes de cumplir 14', '2012-10-16', null],
      ['14 años justos (mínimo)', '2012-10-15', 14],
      ['100 años justos (máximo)', '1926-10-15', 100],
      ['un día antes de cumplir 101', '1925-10-16', 100],
      ['101 años (uno por encima del máximo)', '1925-10-15', null],
    ])('%s → %p', (_caso, fechaNacimiento, esperado) => {
      // Arrange + Act
      const edad = calcularEdadDesdeFecha(fechaNacimiento, HOY);
      // Assert
      expect(edad).toBe(esperado);
    });
  });

  describe('entradas inválidas', () => {
    test.each([
      ['cadena vacía', ''],
      ['null', null],
      ['undefined', undefined],
      ['texto que no es fecha', 'no-es-una-fecha'],
      ['mes 13', '2000-13-01'],
      ['31 de febrero (día inexistente)', '2000-02-31'],
      ['29 de febrero en año no bisiesto', '2001-02-29'],
      ['31 de abril (mes de 30 días)', '2000-04-31'],
      ['día 0', '2000-05-00'],
    ])('%s → null', (_caso, fechaNacimiento) => {
      // Arrange + Act
      const edad = calcularEdadDesdeFecha(fechaNacimiento, HOY);
      // Assert
      expect(edad).toBeNull();
    });

    test('fecha de nacimiento en el futuro → null', () => {
      // Arrange
      const futura = '2030-01-01';
      // Act
      const edad = calcularEdadDesdeFecha(futura, HOY);
      // Assert
      expect(edad).toBeNull();
    });
  });

  describe('año bisiesto', () => {
    test.each([
      // En un año no bisiesto, quien nació el 29 de febrero cumple el 1 de marzo.
      ['28 feb de año no bisiesto: aún no cumple', new Date(2027, 1, 28, 12), 14],
      ['1 mar de año no bisiesto: ya cumplió', new Date(2027, 2, 1, 12), 15],
    ])('nacido 2012-02-29, %s', (_caso, hoy, esperado) => {
      // Arrange + Act
      const edad = calcularEdadDesdeFecha('2012-02-29', hoy);
      // Assert
      expect(edad).toBe(esperado);
    });
  });

  test('sin `hoy` usa la fecha actual del sistema (comportamiento de producción)', () => {
    // Arrange: alguien que cumple 20 hoy, sea cual sea el día de ejecución
    const ahora = new Date();
    const nacimiento = new Date(ahora.getFullYear() - 20, ahora.getMonth(), ahora.getDate(), 12);
    // Act
    const edad = calcularEdadDesdeFecha(nacimiento.toISOString());
    // Assert
    expect(edad).toBe(20);
  });
});
