const LIMITES_TEXTO_PERFIL = [
  ['nombre', 100],
  ['apellido', 100],
  ['ciudad', 100],
  ['nivelEducativo', 100],
  ['grado', 50],
  ['telefono', 50],
];

function validarLimitesPerfil(datos) {
  for (const [campo, limite] of LIMITES_TEXTO_PERFIL) {
    const valor = datos[campo];
    if (valor === undefined || valor === null) continue;
    if (typeof valor !== 'string') return `El campo ${campo} debe ser texto`;
    if (Array.from(valor).length > limite) {
      return `El campo ${campo} no puede superar ${limite} caracteres`;
    }
  }

  return null;
}

const EDAD_MIN = 14;
const EDAD_MAX = 100;

/**
 * Reglas de PATCH /api/perfil/:userId (DEF-05, #80): las mismas restricciones
 * de perfiles_usuario (NOT NULL, VARCHAR, CHECK de edad), verificadas antes
 * de escribir para responder 400 en vez del 500 de la BD. Solo valida los
 * campos que vienen en el cuerpo: un PATCH parcial no tiene que traerlos todos.
 * @returns {string|null} el mensaje del primer error, o null si todo es válido
 */
function validarActualizacionPerfil(cuerpo) {
  for (const campo of ['nombre', 'apellido']) {
    if (!(campo in cuerpo)) continue;
    const valor = cuerpo[campo];
    if (typeof valor !== 'string' || !valor.trim()) {
      return `El campo ${campo} es obligatorio`;
    }
  }

  const errorLimites = validarLimitesPerfil({
    nombre: cuerpo.nombre,
    apellido: cuerpo.apellido,
    ciudad: cuerpo.ciudad,
    nivelEducativo: cuerpo.nivel_educativo,
    telefono: cuerpo.telefono,
  });
  if (errorLimites) return errorLimites;

  const { edad } = cuerpo;
  if (edad !== undefined && edad !== null && edad !== '') {
    const numero = Number(edad);
    if (!Number.isInteger(numero) || numero < EDAD_MIN || numero > EDAD_MAX) {
      return `La edad debe ser un número entero entre ${EDAD_MIN} y ${EDAD_MAX}`;
    }
  }

  return null;
}

module.exports = { validarLimitesPerfil, validarActualizacionPerfil };
