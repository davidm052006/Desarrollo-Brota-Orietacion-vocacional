const supabase                                              = require('../config/supabase');
const { calcularDesdeRespuestas, calcularPorcentajes }      = require('../utils/perfilvocacional');
const { generarRecomendaciones }                            = require('../utils/algoritmoRecomendacion');

// ─────────────────────────────────────────────────────────────
// GET /api/perfil/cuestionario
// Devuelve el cuestionario activo con sus preguntas, opciones y pesos.
// ─────────────────────────────────────────────────────────────
const obtenerCuestionario = async (req, res) => {
  try {
    // Resolución: primero el cuestionario propio de la institución del
    // estudiante (si tiene una vinculada y esa institución tiene uno activo),
    // si no, el global. Nunca al revés — un cuestionario de institución
    // jamás reemplaza el global para nadie más.
    //
    // Código de error '42703' (columna inexistente): mientras
    // migration_cuestionarios_institucion.sql no se haya corrido contra
    // Supabase, `cuestionarios.institucion_id` no existe todavía — sin este
    // fallback, ESTA consulta rompería el test vocacional para TODOS los
    // usuarios (no solo institución) hasta correr la migración. Una vez
    // corrida, el camino institución-aware empieza a funcionar solo.
    const { data: perfilPropio } = await supabase
      .from('perfiles_usuario').select('institucion_id').eq('user_id', req.user.id).single();

    let cuestionario = null;
    if (perfilPropio?.institucion_id) {
      const { data, error } = await supabase
        .from('cuestionarios')
        .select('id, nombre, version, activo')
        .eq('institucion_id', perfilPropio.institucion_id)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== '42703') throw error;
      cuestionario = data;
    }

    if (!cuestionario) {
      let { data, error: errC } = await supabase
        .from('cuestionarios')
        .select('id, nombre, version, activo')
        .is('institucion_id', null)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (errC?.code === '42703') {
        ({ data, error: errC } = await supabase
          .from('cuestionarios')
          .select('id, nombre, version, activo')
          .eq('activo', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single());
      }

      if (errC) {
        return res.status(404).json({ success: false, message: 'No hay cuestionario activo' });
      }
      cuestionario = data;
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
          requisitos, costo_matricula,
          instituciones ( id, nombre, ciudad, departamento, tipo, direccion, telefono, email, sitio_web, costo_promedio )
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
      requisitos:    r.programas?.requisitos                    ?? '',
      costoMatricula: r.programas?.costo_matricula               ?? null,
      institucion:   r.programas?.instituciones?.nombre         ?? '—',
      institucionTipo: r.programas?.instituciones?.tipo         ?? '',
      direccion:     r.programas?.instituciones?.direccion      ?? '',
      telefono:      r.programas?.instituciones?.telefono       ?? '',
      email:         r.programas?.instituciones?.email          ?? '',
      sitioWeb:      r.programas?.instituciones?.sitio_web      ?? '',
      costoPromedioInstitucion: r.programas?.instituciones?.costo_promedio ?? null,
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

  // si falla el update, seguir con el dato viejo en vez de romper la carga del perfil.
  // `perfil` primero: el `.select()` de este update no pide el embed de
  // `institucion` (obtenerPerfil sí lo pide) — sin el spread de `perfil`
  // primero, ese campo desaparecería justo en la primera carga del día.
  return error ? { ...perfil, racha_rota: false } : { ...perfil, ...actualizado, racha_rota: rachaRota };
}

const obtenerPerfil = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado para este perfil' });
    }

    // El embed `institucion:instituciones(...)` solo trae algo si hay
    // institucion_id (rol 'institucion') — PostgREST lo resuelve solo por la
    // FK fk_perfiles_institucion (backend/setup_database.sql). Si viene null
    // es porque el usuario no es institución o quedó desvinculado tras una
    // sync MEN (ver migration_rol_institucion.sql).
    let { data, error } = await supabase
      .from('perfiles_usuario')
      .select('*, institucion:instituciones(nombre, tipo, ciudad, departamento, direccion, telefono, email, sitio_web)')
      .eq('user_id', userId)
      .single();

    // Fallback mientras migration_rol_institucion.sql no se haya corrido
    // contra Supabase todavía: sin la FK, PostgREST no reconoce el embed
    // (error PGRST200) y de otro modo esto rompía el login de TODOS los
    // usuarios, no solo instituciones. Una vez corrida la migración, el
    // primer intento (con embed) empieza a funcionar solo.
    if (error?.code === 'PGRST200') {
      ({ data, error } = await supabase
        .from('perfiles_usuario')
        .select('*')
        .eq('user_id', userId)
        .single());
    }

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

    const {
      nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas, edad,
      // Cuestionario propio de la cuenta institución (rol 'institucion'),
      // completado en /dashboard/institucion tras el alta desde el panel
      // admin. `institucion_id` NO se acepta acá a propósito — solo un
      // admin puede cambiar a qué institución del catálogo está vinculada
      // una cuenta (ver admin/usuariosController.updateUsuario). `telefono`
      // se acepta acá (a diferencia de antes) porque es el único dato de
      // ese cuestionario que ya existía como columna genérica.
      institucion_contacto, institucion_descripcion, telefono,
    } = req.body;

    const { data, error } = await supabase
      .from('perfiles_usuario')
      .update({
        nombre, apellido, ciudad, nivel_educativo, condiciones_socioeconomicas,
        edad: edad ? parseInt(edad) : null,
        institucion_contacto, institucion_descripcion, telefono,
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

// PATCH /api/perfil/:userId/broti — guarda qué items tiene equipados en cada
// categoría (lentes/fondo/accesorio/etc). Separado de actualizarPerfil
// porque es un concepto distinto (personalización de la mascota, no datos
// del usuario) — ver frontend/src/utils/brotiCatalog.js para el catálogo.
const actualizarBroti = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado para este perfil' });
    }

    const { broti_config } = req.body;
    if (typeof broti_config !== 'object' || broti_config === null || Array.isArray(broti_config)) {
      return res.status(400).json({ success: false, message: 'broti_config inválido' });
    }

    const { data, error } = await supabase
      .from('perfiles_usuario')
      .update({ broti_config })
      .eq('user_id', userId)
      .select('broti_config')
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error('perfilController.actualizarBroti:', err);
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
  actualizarBroti,
};
