const supabase = require('../config/supabase');
const { responderErrorInterno } = require('../utils/errorInterno');

const obtenerProgramas = async (req, res) => {
  const { area, search = '', page = 1, limit = 24 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('programas')
    .select(
      `id, nombre, tipo, area_academica, duracion, modalidad, costo_matricula,
       instituciones(nombre, tipo, ciudad, telefono, email, sitio_web)`,
      { count: 'exact' }
    )
    .eq('activo', true)
    .not('area_academica', 'is', null);

  if (area && area !== 'todos') {
    query = query.eq('area_academica', area);
  }

  if (search.trim()) {
    query = query.ilike('nombre', `%${search.trim()}%`);
  }

  query = query
    .order('nombre')
    .range(offset, offset + parseInt(limit) - 1);

  const { data, error, count } = await query;

  if (error) return responderErrorInterno(res, 'programasController', error);

  return res.json({
    success: true,
    data: data ?? [],
    total: count ?? 0,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil((count ?? 0) / parseInt(limit)),
  });
};

const obtenerEstadisticas = async (req, res) => {
  const AREAS = [
    'tecnologia','salud','educacion','administrativo','ciencias',
    'juridico','social','humanidades','ambiental','negocios',
    'diseño','arte','comunicacion','deporte',
  ];

  try {
    const conteos = await Promise.all(
      AREAS.map(async (area) => {
        const { count } = await supabase
          .from('programas')
          .select('*', { count: 'exact', head: true })
          .eq('activo', true)
          .eq('area_academica', area);
        return { area, count: count ?? 0 };
      })
    );

    const { count: total } = await supabase
      .from('programas')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true)
      .not('area_academica', 'is', null);

    return res.json({ success: true, total: total ?? 0, areas: conteos });
  } catch (err) {
    return responderErrorInterno(res, 'programasController', err);
  }
};

module.exports = { obtenerProgramas, obtenerEstadisticas };