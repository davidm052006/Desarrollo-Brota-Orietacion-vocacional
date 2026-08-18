const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/rutas — lista las áreas disponibles (para armar los chips de
// selección en el frontend, mismas claves que area_academica en programas)
const getAreasDisponibles = asyncHandler('rutasController.getAreasDisponibles', async (req, res) => {
  const { data, error } = await supabase.from('contenido_rutas').select('area').order('area');
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data: (data ?? []).map(r => r.area) });
});

// GET /api/rutas/:area — contenido estático de una sola área (ver
// backend/scripts/migration_rutas.sql, no hay generación en vivo)
const getRutaPorArea = asyncHandler('rutasController.getRutaPorArea', async (req, res) => {
  const { area } = req.params;

  const { data, error } = await supabase
    .from('contenido_rutas').select('*').eq('area', area).single();

  if (error || !data) {
    return res.status(404).json({ success: false, message: 'No hay contenido para esa área todavía' });
  }

  return res.json({
    success: true,
    data: {
      area: data.area,
      materiasComunes: data.materias_comunes,
      temasPrevios: data.temas_previos,
      proyectos: data.proyectos,
      recursos: data.recursos,
    },
  });
});

module.exports = { getAreasDisponibles, getRutaPorArea };
