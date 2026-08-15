const supabase                                              = require('../config/supabase');
const { calcularDesdeRespuestas, calcularPorcentajes }      = require('../utils/perfilvocacional');
const { generarRecomendaciones }                            = require('../utils/algoritmoRecomendacion');

// ─────────────────────────────────────────────────────────────
// GET /api/perfil/cuestionario
// Devuelve el cuestionario activo con sus preguntas, opciones y pesos.
// ─────────────────────────────────────────────────────────────
const obtenerCuestionario = async (req, res) => {
  try {
    const { data: cuestionario, error: errC } = await supabase
      .from('cuestionarios')
      .select('id, nombre, version, activo')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (errC) {
      return res.status(404).json({ success: false, message: 'No hay cuestionario activo' });
    }

    const { data: preguntas, error: errP } = await supabase
      .from('preguntas')
      .select(`
        id, texto, tipo, orden, categoria, peso,
        opciones (
          id, label, icon, orden,
          pesos_opciones ( categoria, puntos )
        )
      `)
      .eq('cuestionario_id', cuestionario.id)
      .order('orden', { ascending: true });

    if (errP) {
      return res.status(500).json({ success: false, message: errP.message });
    }

    // Normalizar: convertir pesos_opciones (array) a pesos (objeto) para el frontend
    const preguntasFormateadas = preguntas.map((p) => ({
      ...p,
      opciones: (p.opciones ?? [])
        .sort((a, b) => a.orden - b.orden)
        .map((o) => ({
          id:    o.id,
          label: o.label,
          icon:  o.icon,
          orden: o.orden,
          pesos: Object.fromEntries(
            (o.pesos_opciones ?? []).map(({ categoria, puntos }) => [categoria, puntos])
          ),
        })),
    }));

    return res.json({
      success: true,
      data: { id: cuestionario.id, cuestionario, preguntas: preguntasFormateadas },
    });
  } catch (err) {
    console.error('perfilController.obtenerCuestionario:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/perfil/resultado
// Body: { perfil_usuario_id, cuestionario_id, respuestas }
//
// El cálculo del perfil vocacional se realiza aquí, en el servidor.
// El frontend solo envía las respuestas crudas (IDs de opciones elegidas).
// ─────────────────────────────────────────────────────────────
const guardarResultado = async (req, res) => {
  try {
    const { perfil_usuario_id, cuestionario_id, respuestas } = req.body;

    if (!perfil_usuario_id || !cuestionario_id || !respuestas) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos: perfil_usuario_id, cuestionario_id, respuestas',
      });
    }

    // Verificar que el perfil pertenece al usuario autenticado
    const { data: perfil, error: errPerfil } = await supabase
      .from('perfiles_usuario')
      .select('id')
      .eq('id', perfil_usuario_id)
      .eq('user_id', req.user.id)
      .single();

    if (errPerfil || !perfil) {
      return res.status(403).json({ success: false, message: 'No autorizado para este perfil' });
    }

    // Calcular el perfil vocacional en el servidor a partir de las respuestas
    const perfilVocacional = await calcularDesdeRespuestas(cuestionario_id, respuestas, supabase);
    const porcentajes      = calcularPorcentajes(perfilVocacional);

    const { data, error } = await supabase
      .from('resultados')
      .insert([{
        perfil_usuario_id,
        cuestionario_id,
        respuestas,
        perfil_vocacional: { ...perfilVocacional, porcentajes },
        fecha_realizacion: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('perfilController.guardarResultado — insert:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    // Generar recomendaciones antes de responder, así el frontend las encuentra de inmediato
    await generarRecomendaciones(data.id, perfilVocacional, supabase)
      .catch((err) => console.error('[perfilController] generarRecomendaciones:', err));

    return res.status(201).json({ success: true, message: 'Resultado guardado', data });
  } catch (err) {
    console.error('perfilController.guardarResultado:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/perfil/resultado/:perfilUsuarioId
// Devuelve el último resultado del usuario.
// ─────────────────────────────────────────────────────────────
const obtenerResultado = async (req, res) => {
  try {
    const { perfilUsuarioId } = req.params;

    // Verificar que el perfil pertenece al usuario autenticado
    const { data: perfil, error: errPerfil } = await supabase
      .from('perfiles_usuario')
      .select('id')
      .eq('id', perfilUsuarioId)
      .eq('user_id', req.user.id)
      .single();

    if (errPerfil || !perfil) {
      return res.status(403).json({ success: false, message: 'No autorizado para este perfil' });
    }

    const { data, error } = await supabase
      .from('resultados')
      .select(`
        *,
        cuestionarios ( nombre, version ),
        recomendaciones (
          compatibilidad, razones,
          programas (
            nombre, tipo, area_academica, duracion,
            instituciones ( nombre, ciudad )
          )
        )
      `)
      .eq('perfil_usuario_id', perfilUsuarioId)
      .order('fecha_realizacion', { ascending: false })
      .limit(1)
      .single();

    if (error?.code === 'PGRST116') {
      return res.json({ success: true, data: null });
    }
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('perfilController.obtenerResultado:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/perfil/recomendaciones/:resultadoId
// Devuelve las recomendaciones de un resultado dado.
// ─────────────────────────────────────────────────────────────
const obtenerRecomendaciones = async (req, res) => {
  try {
    const { resultadoId } = req.params;

    // Verificar que el resultado pertenece a un perfil del usuario autenticado
    const { data: resultado, error: errResultado } = await supabase
      .from('resultados')
      .select('perfil_usuario_id')
      .eq('id', resultadoId)
      .single();

    if (errResultado || !resultado) {
      return res.status(404).json({ success: false, message: 'Resultado no encontrado' });
    }

    const { data: perfil, error: errPerfil } = await supabase
      .from('perfiles_usuario')
      .select('id')
      .eq('id', resultado.perfil_usuario_id)
      .eq('user_id', req.user.id)
      .single();

    if (errPerfil || !perfil) {
      return res.status(403).json({ success: false, message: 'No autorizado para este resultado' });
    }

    const { data, error } = await supabase
      .from('recomendaciones')
      .select(`
        id, compatibilidad, razones, vista,
        programas (
          id, nombre, tipo, area_academica, duracion, modalidad, descripcion,
          instituciones ( id, nombre, ciudad, departamento )
        )
      `)
      .eq('resultado_id', resultadoId)
      .order('compatibilidad', { ascending: false })
      .limit(8);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    const recomendaciones = (data ?? []).map((r) => ({
      id:            r.id,
      nombre:        r.programas?.nombre                        ?? '—',
      descripcion:   r.programas?.descripcion                   ?? '',
      institucion:   r.programas?.instituciones?.nombre         ?? '—',
      ciudad:        r.programas?.instituciones?.ciudad         ?? '',
      departamento:  r.programas?.instituciones?.departamento   ?? '',
      area:          r.programas?.area_academica                ?? '',
      tipo:          r.programas?.tipo                          ?? '',
      duracion:      r.programas?.duracion                      ?? '',
      modalidad:     r.programas?.modalidad                     ?? '',
      compatibilidad: Math.round((r.compatibilidad ?? 0) * 100),
      razones:       r.razones                                  ?? '',
      vista:         r.vista                                    ?? false,
    }));

    return res.json({ success: true, data: recomendaciones });
  } catch (err) {
    console.error('perfilController.obtenerRecomendaciones:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/perfil/recomendaciones/:id/vista
// Marca una recomendación como vista. Solo puede hacerlo el dueño.
// ─────────────────────────────────────────────────────────────
const marcarRecomendacionVista = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la recomendación pertenece a un resultado del usuario autenticado
    const { data: recomendacion, error: errRecomendacion } = await supabase
      .from('recomendaciones')
      .select('id, resultados ( perfil_usuario_id )')
      .eq('id', id)
      .single();

    if (errRecomendacion || !recomendacion) {
      return res.status(404).json({ success: false, message: 'Recomendación no encontrada' });
    }

    const { data: perfil, error: errPerfil } = await supabase
      .from('perfiles_usuario')
      .select('id')
      .eq('id', recomendacion.resultados?.perfil_usuario_id)
      .eq('user_id', req.user.id)
      .single();

    if (errPerfil || !perfil) {
      return res.status(403).json({ success: false, message: 'No autorizado para esta recomendación' });
    }

    const { error } = await supabase
      .from('recomendaciones')
      .update({ vista: true })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('perfilController.marcarRecomendacionVista:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/perfil/resultado/:perfilUsuarioId
// Elimina todos los resultados y sus recomendaciones.
// ─────────────────────────────────────────────────────────────
const eliminarResultado = async (req, res) => {
  try {
    const { perfilUsuarioId } = req.params;

    // Verificar que el perfil pertenece al usuario autenticado
    const { data: perfil, error: errPerfil } = await supabase
      .from('perfiles_usuario')
      .select('id')
      .eq('id', perfilUsuarioId)
      .eq('user_id', req.user.id)
      .single();

    if (errPerfil || !perfil) {
      return res.status(403).json({ success: false, message: 'No autorizado para este perfil' });
    }

    const { data: resultados } = await supabase
      .from('resultados')
      .select('id')
      .eq('perfil_usuario_id', perfilUsuarioId);

    if (resultados?.length) {
      const ids = resultados.map((r) => r.id);
      await supabase.from('recomendaciones').delete().in('resultado_id', ids);
    }

    const { error } = await supabase
      .from('resultados')
      .delete()
      .eq('perfil_usuario_id', perfilUsuarioId);

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, message: 'Resultados eliminados' });
  } catch (err) {
    console.error('perfilController.eliminarResultado:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/perfil/:userId
// Devuelve el perfil completo del usuario autenticado.
// ─────────────────────────────────────────────────────────────
// Actualiza racha_dias/ultima_actividad si hoy todavía no se registró
// actividad. Se llama desde obtenerPerfil (se pide en cada carga del
// Dashboard), así que no hace falta un endpoint de "check-in" aparte.
async function actualizarRacha(perfil, userId) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (perfil.ultima_actividad === hoy) return { ...perfil, racha_rota: false }; // ya contada hoy

  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const continua = perfil.ultima_actividad === ayer;
  const nuevaRacha = continua ? (perfil.racha_dias || 0) + 1 : 1;
  // "rota" = de verdad se perdió una racha en curso (no el primer check-in nunca)
  const rachaRota = !continua && (perfil.racha_dias || 0) > 1;

  const { data: actualizado, error } = await supabase
    .from('perfiles_usuario')
    .update({ ultima_actividad: hoy, racha_dias: nuevaRacha })
    .eq('user_id', userId)
    .select()
    .single();

  // si falla el update, seguir con el dato viejo en vez de romper la carga del perfil
  return error ? { ...perfil, racha_rota: false } : { ...actualizado, racha_rota: rachaRota };
}

const obtenerPerfil = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado para este perfil' });
    }

    const { data, error } = await supabase
      .from('perfiles_usuario')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
    }

    const dataConRacha = await actualizarRacha(data, userId);

    return res.json({ success: true, data: dataConRacha });
  } catch (err) {
    console.error('perfilController.obtenerPerfil:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/perfil/:userId — autoedición del propio perfil (sección Ajustes)
// ─────────────────────────────────────────────────────────────
const actualizarPerfil = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado para este perfil' });
    }

    const { nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas, edad } = req.body;

    const { data, error } = await supabase
      .from('perfiles_usuario')
      .update({
        nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas,
        edad: edad ? parseInt(edad) : null,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('perfilController.actualizarPerfil:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  obtenerCuestionario,
  guardarResultado,
  obtenerResultado,
  obtenerRecomendaciones,
  marcarRecomendacionVista,
  eliminarResultado,
  obtenerPerfil,
  actualizarPerfil,
};
