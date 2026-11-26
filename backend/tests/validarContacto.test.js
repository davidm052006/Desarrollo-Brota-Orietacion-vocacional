// Semana 6 · Brayan · DEF-07: POST /api/contacto responde 500 si un campo
// llega con un tipo que no es texto (p. ej. el teléfono como número), porque
// el controlador llama a .trim() sobre él. La regla vive en validarContacto.
const { validarContacto } = require('../src/utils/validarContacto');

const VALIDO = {
  nombre: 'Ana Pérez',
  email: 'ana@colegio.edu.co',
  telefono: '3001234567',
  asunto: 'Otro',
  mensaje: 'Hola',
};

describe('validarContacto', () => {
  it('acepta un cuerpo válido', () => {
    expect(validarContacto(VALIDO)).toBeNull();
  });

  it.each([
    ['sin teléfono', { telefono: undefined }],
    ['teléfono null', { telefono: null }],
    ['teléfono vacío', { telefono: '' }],
  ])('el teléfono es opcional: %s', (_caso, cambio) => {
    expect(validarContacto({ ...VALIDO, ...cambio })).toBeNull();
  });

  it.each([
    ['teléfono como número', { telefono: 3001234567 }],
    ['nombre como número', { nombre: 123 }],
    ['email como lista', { email: ['ana@colegio.edu.co'] }],
    ['asunto como objeto', { asunto: { valor: 'Otro' } }],
    ['mensaje booleano', { mensaje: true }],
  ])('rechaza tipos que no son texto: %s', (_caso, cambio) => {
    expect(validarContacto({ ...VALIDO, ...cambio })).toBe('Formato de datos inválido.');
  });

  it.each(['nombre', 'email', 'asunto', 'mensaje'])('%s es obligatorio (vacío o solo espacios)', (campo) => {
    expect(validarContacto({ ...VALIDO, [campo]: '   ' })).toBe('Campos requeridos incompletos.');
    expect(validarContacto({ ...VALIDO, [campo]: undefined })).toBe('Campos requeridos incompletos.');
  });

  it('rechaza un correo con formato inválido', () => {
    expect(validarContacto({ ...VALIDO, email: 'ana@colegio' })).toBe('Correo electrónico inválido.');
  });

  it('rechaza un asunto fuera de la lista', () => {
    expect(validarContacto({ ...VALIDO, asunto: 'Publicidad' })).toBe('Asunto inválido.');
  });

  it('un cuerpo ausente no lanza: responde como campos incompletos', () => {
    expect(validarContacto(undefined)).toBe('Campos requeridos incompletos.');
  });
});
