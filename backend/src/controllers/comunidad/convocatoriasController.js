const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');

const getConvocatorias = asyncHandler('comunidad/convocatoriasController.getConvocatorias', async (req, res) => {
  const { data, error } = await supabase
    .from('convocatorias')
    .select('id, tipo, titulo, institucion, ciudad, fecha_cierre')
    .eq('activa', true)
    .gte('fecha_cierre', new Date().toISOString())
    .order('fecha_cierre', { ascending: true })
    .limit(20);

  if (error) return res.status(500).json({ success: false, message: error.message });

  const result = (data ?? []).map(c => ({
    id:    c.id,
    type:  c.tipo,
    title: c.titulo,
    inst:  c.institucion,
    city:  c.ciudad,
    days:  Math.ceil((new Date(c.fecha_cierre) - Date.now()) / 86400000),
  }));

  return res.json({ success: true, data: result });
});

const getConvocatoria = asyncHandler('comunidad/convocatoriasController.getConvocatoria', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase.from('convocatorias').select('*').eq('id', id).single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Convocatoria no encontrada' });

  return res.json({
    success: true,
    data: {
      id:          data.id,
      type:        data.tipo,
      title:       data.titulo,
      inst:        data.institucion,
      city:        data.ciudad,
      descripcion: data.descripcion || '',
      days:        Math.ceil((new Date(data.fecha_cierre) - Date.now()) / 86400000),
      url:         data.url || '',
      detalles:    data.detalles || {},
    },
  });
});

module.exports = { getConvocatorias, getConvocatoria };
