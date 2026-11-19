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

module.exports = { validarLimitesPerfil };
