const { validarLimitesPerfil } = require('../src/utils/validarCampos');

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
