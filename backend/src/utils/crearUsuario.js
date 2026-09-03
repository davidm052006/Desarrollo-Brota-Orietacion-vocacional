const supabase = require('../config/supabase');
const { calcularEdadDesdeFecha } = require('./calcularEdad');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES_VALIDOS = ['estudiante', 'orientador', 'moderador', 'admin', 'institucion'];

// Crea un usuario en Supabase Auth + su fila en perfiles_usuario (+ rol).
// Compartida entre admin/usuariosController.js (cualquier rol, institucion_id
// elegido a mano) e institucion/usuariosController.js (siempre 'estudiante',
// institucion_id forzado a la propia institución del que llama) — mismos 3
// pasos y las mismas reglas de validación en los dos lugares.
// `fecha_nacimiento` (mismo campo que pide el registro público, ver SignupCard.jsx)
// tiene prioridad sobre `edad` si llegan los dos — así el formulario de creación
// y la carga masiva pueden usar el mismo formato que el registro real en vez de
// pedir una edad numérica suelta. `edad` se mantiene por compatibilidad (ediciones
// de usuarios existentes, que no tienen fecha de nacimiento guardada).
async function crearUsuarioUnico({
  email, password, nombre, apellido,
  ciudad, nivel_educativo, condiciones_socioeconomicas,
  edad, fecha_nacimiento, grado, telefono,
  rol = 'estudiante', institucion_id,
}) {
  if (!email || !password || !nombre || !apellido) {
    return { success: false, error: 'Email, contraseña, nombre y apellido son obligatorios' };
  }
  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener mínimo 6 caracteres' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: 'El email no tiene un formato válido' };
  }
  if (rol && !ROLES_VALIDOS.includes(rol)) {
    return { success: false, error: `Rol inválido "${rol}" — debe ser uno de: ${ROLES_VALIDOS.join(', ')}` };
  }
  if (rol === 'institucion') {
    if (!institucion_id) {
      return { success: false, error: 'Elegí a qué institución del catálogo pertenece esta cuenta' };
    }
    const { data: institucion, error: institucionError } = await supabase
      .from('instituciones').select('id').eq('id', institucion_id).single();
    if (institucionError || !institucion) {
      return { success: false, error: 'La institución seleccionada no existe' };
    }
  }

  let edadFinal = null;
  if (fecha_nacimiento) {
    edadFinal = calcularEdadDesdeFecha(fecha_nacimiento);
    if (edadFinal === null) {
      return { success: false, error: 'Fecha de nacimiento inválida (la edad debe estar entre 14 y 100 años)' };
    }
  } else if (edad !== undefined && edad !== null && edad !== '') {
    if (isNaN(parseInt(edad))) {
      return { success: false, error: 'La edad debe ser un número' };
    }
    edadFinal = parseInt(edad);
  }

  // 1. Crear usuario en Supabase Auth (solo posible con SERVICE_ROLE_KEY)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  const userId = authData.user.id;

  // 2. Crear registro en perfiles_usuario
  const { error: perfilError } = await supabase
    .from('perfiles_usuario')
    .insert([{
      user_id: userId, nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas,
      edad: edadFinal, grado: grado || null, telefono: telefono || null,
      institucion_id: (rol === 'institucion' || rol === 'estudiante') ? (institucion_id || null) : null,
    }]);

  if (perfilError) {
    // Rollback: eliminar el usuario de auth si el perfil no se pudo crear.
    // Es un fallo de infraestructura después de pasar toda la validación
    // (no un error del cliente) — status 500, no 400.
    await supabase.auth.admin.deleteUser(userId);
    return { success: false, error: 'No se pudo crear el perfil: ' + perfilError.message, status: 500 };
  }

  // 3. Asignar rol en perfiles_usuario
  if (rol) {
    await supabase.from('perfiles_usuario').update({ rol }).eq('user_id', userId);
  }

  return { success: true, id: userId };
}

module.exports = { crearUsuarioUnico, ROLES_VALIDOS, EMAIL_REGEX };
