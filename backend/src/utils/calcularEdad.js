// Misma fórmula que frontend/src/utils/calcularEdad.js — usada tanto en el
// registro público (authController.registerPerfil) como en la creación de
// usuarios desde el panel admin (controllers/admin/usuariosController.js).
// No duplicarla de nuevo si se vuelve a tocar este cálculo.
//
// `hoy` se puede inyectar para que las pruebas no dependan del reloj del
// sistema; en producción se omite y toma la fecha actual.
function calcularEdadDesdeFecha(fechaNacimiento, hoy = new Date()) {
  if (!fechaNacimiento) return null;

  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return null;

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1;

  return (edad >= 14 && edad <= 100) ? edad : null;
}

module.exports = { calcularEdadDesdeFecha };
