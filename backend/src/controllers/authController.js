const supabase = require('../config/supabase');
const { calcularEdadDesdeFecha } = require('../utils/calcularEdad');
const { validarLimitesPerfil } = require('../utils/validarCampos');

/**
 * POST /api/auth/register-perfil
 * Body: { nombre, apellido }
 * Header: Authorization: Bearer <supabase_token>
 *
 * Crea el registro en perfiles_usuario para el usuario ya autenticado.
 * No elimina cuentas de Auth en caso de error: la sesión autenticada podría
 * pertenecer a una cuenta existente y el endpoint no prueba que sea nueva.
 */
const registerPerfil = async (req, res) => {
  try {
    const { nombre, apellido, fechaNacimiento, ciudad, nivelEducativo, grado, telefono } = req.body;

    const userId = req.user.id;
    const errorValidacion = !nombre
      ? 'El campo nombre es requerido'
      : validarLimitesPerfil({ nombre, apellido, ciudad, nivelEducativo, grado, telefono });
    if (errorValidacion) {
      // Nunca borrar una cuenta autenticada solo porque envió datos inválidos.
      return res.status(400).json({ success: false, message: errorValidacion });
    }

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
