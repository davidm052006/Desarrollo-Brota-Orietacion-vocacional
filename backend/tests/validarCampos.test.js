const { validarLimitesPerfil, validarActualizacionPerfil } = require('../src/utils/validarCampos');

describe('validarLimitesPerfil', () => {
  it('acepta los valores que están dentro de los límites de la base de datos', () => {
    const datos = {
      nombre: 'N'.repeat(100),
      apellido: 'A'.repeat(100),
      ciudad: 'C'.repeat(100),
      nivelEducativo: 'E'.repeat(100),
      grado: 'G'.repeat(50),
      telefono: 'T'.repeat(50),
    };

    expect(validarLimitesPerfil(datos)).toBeNull();
  });

  it('rechaza un valor que supera el máximo de su columna', () => {
    expect(validarLimitesPerfil({ nombre: 'N'.repeat(101) }))
      .toBe('El campo nombre no puede superar 100 caracteres');
  });

  it('permite omitir los campos que son opcionales en el registro actual', () => {
    expect(validarLimitesPerfil({ nombre: 'Edward' })).toBeNull();
  });

  it('rechaza valores que no son texto para columnas de texto', () => {
    expect(validarLimitesPerfil({ nombre: 123 }))
      .toBe('El campo nombre debe ser texto');
  });
});

// DEF-05 (#80): PATCH /api/perfil/:userId respondía 500 cuando el cuerpo
// violaba una restricción de perfiles_usuario. Valores límite de cada regla.
describe('validarActualizacionPerfil (DEF-05)', () => {
  it.each([14, 100, '15'])('acepta la edad %p (dentro del CHECK 14–100)', (edad) => {
    expect(validarActualizacionPerfil({ edad })).toBeNull();
  });

  it.each([13, 101, 15.5, 'quince'])('rechaza la edad %p', (edad) => {
    expect(validarActualizacionPerfil({ edad }))
      .toBe('La edad debe ser un número entero entre 14 y 100');
  });

  it('permite no enviar edad, o enviarla vacía para borrarla', () => {
    expect(validarActualizacionPerfil({})).toBeNull();
    expect(validarActualizacionPerfil({ edad: null })).toBeNull();
    expect(validarActualizacionPerfil({ edad: '' })).toBeNull();
  });

  it('acepta nombre y ciudad de 100 caracteres y rechaza 101', () => {
    expect(validarActualizacionPerfil({ nombre: 'N'.repeat(100), ciudad: 'C'.repeat(100) })).toBeNull();
    expect(validarActualizacionPerfil({ ciudad: 'C'.repeat(101) }))
      .toBe('El campo ciudad no puede superar 100 caracteres');
  });

  it('valida nivel_educativo con su nombre de columna', () => {
    expect(validarActualizacionPerfil({ nivel_educativo: 'E'.repeat(101) }))
      .toBe('El campo nivelEducativo no puede superar 100 caracteres');
  });

  it.each([
    ['nombre', null],
    ['nombre', ''],
    ['apellido', '   '],
  ])('no deja %s en %p (es NOT NULL y obligatorio)', (campo, valor) => {
    expect(validarActualizacionPerfil({ [campo]: valor }))
      .toBe(`El campo ${campo} es obligatorio`);
  });

  it('no exige nombre ni apellido si el PATCH no los trae', () => {
    expect(validarActualizacionPerfil({ telefono: '3001234567' })).toBeNull();
  });
});
