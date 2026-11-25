// ============================================================
// Repositorio de programas: todas las consultas a la tabla `programas`
// del catálogo público. El controlador arma la respuesta HTTP; acá solo
// vive el acceso a datos, para poder probarlo contra la BD real
// (tests/integracion/programas.bd.test.js).
// ============================================================
const supabase = require('../config/supabase');

const COLUMNAS_LISTADO = `id, nombre, tipo, area_academica, duracion, modalidad, costo_matricula,
       instituciones(nombre, tipo, ciudad, telefono, email, sitio_web)`;

/**
 * Programas activos con área asignada, ordenados por nombre y paginados.
 * Trae la institución con un JOIN (embed de PostgREST por la FK).
 * @returns {Promise<{data, error, count}>}
 */
function listarActivos({ area, search = '', offset = 0, limit = 24 } = {}) {
  let query = supabase
    .from('programas')
    .select(COLUMNAS_LISTADO, { count: 'exact' })
    .eq('activo', true)
    .not('area_academica', 'is', null);

  if (area && area !== 'todos') {
    query = query.eq('area_academica', area);
  }

  if (search.trim()) {
    query = query.ilike('nombre', `%${search.trim()}%`);
  }

  return query
    .order('nombre')
    .range(offset, offset + limit - 1);
}

/**
 * Cuántos programas activos hay en un área, o en total (con área asignada)
 * si no se pasa `area`.
 * @returns {Promise<{count, error}>}
 */
function contarActivos(area) {
  const query = supabase
    .from('programas')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true);

  return area
    ? query.eq('area_academica', area)
    : query.not('area_academica', 'is', null);
}

module.exports = { listarActivos, contarActivos };
