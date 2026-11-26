const supabase = require('../config/supabase');
const { validarContacto } = require('../utils/validarContacto');

const crearContacto = async (req, res) => {
  try {
    // DEF-07: la validación (incluido el tipo de cada campo) va antes de
    // cualquier .trim(), para responder 400 y no 500.
    const errorValidacion = validarContacto(req.body);
    if (errorValidacion) {
      return res.status(400).json({ success: false, message: errorValidacion });
    }

    const { nombre, email, telefono, asunto, mensaje } = req.body;

    const { error } = await supabase.from('contactos').insert({
      nombre:   nombre.trim().substring(0, 200),
      email:    email.trim().toLowerCase().substring(0, 200),
      telefono: telefono?.trim().substring(0, 50) || null,
      asunto:   asunto.trim(),
      mensaje:  mensaje.trim().substring(0, 2000),
    });

    if (error) throw error;

    return res.json({ success: true, message: 'Solicitud enviada correctamente.' });
  } catch (err) {
    console.error('contactoController.crearContacto:', err);
    return res.status(500).json({ success: false, message: 'Error al procesar la solicitud.' });
  }
};

module.exports = { crearContacto };
