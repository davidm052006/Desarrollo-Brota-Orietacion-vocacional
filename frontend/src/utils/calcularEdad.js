// Misma lógica que backend/src/controllers/authController.js (registerPerfil)
// para que la edad calculada en el registro y en Ajustes coincida siempre.
// No se persiste la fecha de nacimiento — solo se usa para calcular la edad,
// igual que ya hacía el registro.
export function calcularEdad(dia, mes, anio) {
  if (!dia || !mes || !anio) return null;
  const hoy = new Date();
  const nacimiento = new Date(Number(anio), Number(mes) - 1, Number(dia));
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1;
  return edad;
}
