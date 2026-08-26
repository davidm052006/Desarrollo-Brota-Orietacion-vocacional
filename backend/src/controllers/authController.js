const supabase = require('../config/supabase');
const { calcularEdadDesdeFecha } = require('../utils/calcularEdad');

/**
 * POST /api/auth/register-perfil
 * Body: { nombre, apellido }
 * Header: Authorization: Bearer <supabase_token>
 *
 * Crea el registro en perfiles_usuario para el usuario ya autenticado.
 * Si el insert falla, hace rollback eliminando el usuario de Supabase Auth
 * usando la service_role_key del backend (operación que no es segura hacer
 * desde el frontend).
 */
const registerPerfil = async (req, res) => {
  try {
    const { nombre, apellido, fechaNacimiento, ciudad, nivelEducativo, grado, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El campo nombre es requerido' });
    }

    const userId = req.user.id;
    const edad = calcularEdadDesdeFecha(fechaNacimiento);

    const { error } = await supabase
      .from('perfiles_usuario')
      .insert([{
        user_id: userId,
        nombre,
        apellido: apellido ?? '',
        edad,
        ciudad: ciudad ?? null,
        nivel_educativo: nivelEducativo ?? null,
        grado: grado ?? null,
        telefono: telefono ?? null,
        rol: 'estudiante',
      }]);

    if (!error) {
      return res.status(201).json({ success: true });
    }

    console.error('authController.registerPerfil — insert fallido:', error);

    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (deleteErr) {
      console.error('authController.registerPerfil — rollback fallido:', deleteErr);
    }

    return res.status(500).json({
      success: false,
      message: 'No pudimos crear tu perfil. Por favor intenta registrarte de nuevo.',
    });
  } catch (err) {
    console.error('authController.registerPerfil — error inesperado:', err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { registerPerfil };
