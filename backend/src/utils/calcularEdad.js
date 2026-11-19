// Misma fórmula que frontend/src/utils/calcularEdad.js — usada tanto en el
// registro público (authController.registerPerfil) como en la creación de
// usuarios desde el panel admin (controllers/admin/usuariosController.js).
// No duplicarla de nuevo si se vuelve a tocar este cálculo.
//
// `hoy` se puede inyectar para que las pruebas no dependan del reloj del
// sistema; en producción se omite y toma la fecha actual.
function calcularEdadDesdeFecha(fechaNacimiento, hoy = new Date()) {
  if (!fechaNacimiento) return null;

  // Una fecha 'YYYY-MM-DD' (input type="date", CSV) se lee como día de
  // calendario local, igual que el frontend. `new Date('YYYY-MM-DD')` la toma
  // como medianoche UTC y en Colombia (UTC-5) cae en el día anterior, lo que
  // sumaba el año un día antes del cumpleaños.
  const soloFecha = typeof fechaNacimiento === 'string'
    && /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaNacimiento);
  const nacimiento = soloFecha
    ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
    : new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return null;
  // new Date(2000, 12, 1) se desborda a enero de 2001 en vez de fallar, y un
  // día inexistente también (2000-02-31 → 2 de marzo): en ambos casos el mes
  // resultante cambia, así que este chequeo los rechaza.
  if (soloFecha && nacimiento.getMonth() !== Number(soloFecha[2]) - 1) return null;

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1;

  return (edad >= 14 && edad <= 100) ? edad : null;
}

module.exports = { calcularEdadDesdeFecha };
