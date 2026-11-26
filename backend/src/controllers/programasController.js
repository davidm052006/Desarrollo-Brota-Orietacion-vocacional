const programasRepository = require('../repositories/programasRepository');
const { responderErrorInterno } = require('../utils/errorInterno');

const obtenerProgramas = async (req, res) => {
  const { area, search = '', page = 1, limit = 24 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { data, error, count } = await programasRepository.listarActivos({
    area,
    search,
    offset,
    limit: parseInt(limit),
  });

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
        const { count } = await programasRepository.contarActivos(area);
        return { area, count: count ?? 0 };
      })
    );

    const { count: total } = await programasRepository.contarActivos();

    return res.json({ success: true, total: total ?? 0, areas: conteos });
  } catch (err) {
    return responderErrorInterno(res, 'programasController', err);
  }
};

module.exports = { obtenerProgramas, obtenerEstadisticas };
