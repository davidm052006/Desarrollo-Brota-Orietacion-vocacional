const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePaginacion, metaPaginacion } = require('../../utils/paginacion');
const { patronIlike } = require('../../utils/postgrestFiltro');

const CAMPOS = ['tipo', 'titulo', 'institucion', 'ciudad', 'descripcion', 'detalles', 'url', 'fecha_cierre', 'activa'];

function normalizarDatos(body = {}) {
  const datos = {};
  for (const campo of CAMPOS) {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  }
  if (datos.ciudad === '') datos.ciudad = 'Nacional';
  if (datos.fecha_cierre === '') datos.fecha_cierre = null;
  if (datos.url === '') datos.url = null;
  if (datos.descripcion === '') datos.descripcion = null;
  return datos;
}

function validar(datos) {
  if (!datos.tipo || !String(datos.tipo).trim()) return 'El tipo es obligatorio';
  if (!datos.titulo || !String(datos.titulo).trim()) return 'El título es obligatorio';
  if (!datos.institucion || !String(datos.institucion).trim()) return 'La institución es obligatoria';
  if (datos.fecha_cierre && Number.isNaN(Date.parse(datos.fecha_cierre))) return 'La fecha de cierre no es válida';
  return null;
}

const getConvocatorias = asyncHandler('admin/convocatoriasController.getConvocatorias', async (req, res) => {
  const { pagina, limite, desde, hasta } = parsePaginacion(req.query);
  const busqueda = (req.query.busqueda || '').trim();

  let query = supabase
    .from('convocatorias')
    .select('*', { count: 'exact' })
    .order('fecha_cierre', { ascending: true, nullsFirst: false });

  if (busqueda) {
    const patron = patronIlike(busqueda);
    query = query.or(`titulo.ilike.${patron},institucion.ilike.${patron},ciudad.ilike.${patron}`);
  }

  query = query.range(desde, hasta);

  const { data, count, error } = await query;
  if (error) throw error;

  return res.json({ success: true, data: data || [], meta: metaPaginacion(count, pagina, limite) });
});

const createConvocatoria = asyncHandler('admin/convocatoriasController.createConvocatoria', async (req, res) => {
  const datos = normalizarDatos(req.body);
  const errorValidacion = validar(datos);
  if (errorValidacion) return res.status(400).json({ success: false, message: errorValidacion });

  const { data, error } = await supabase.from('convocatorias').insert([datos]).select().single();
  if (error) throw error;

  return res.status(201).json({ success: true, data });
});

const updateConvocatoria = asyncHandler('admin/convocatoriasController.updateConvocatoria', async (req, res) => {
  const datos = normalizarDatos(req.body);
  const errorValidacion = validar(datos);
  if (errorValidacion) return res.status(400).json({ success: false, message: errorValidacion });

  const { data, error } = await supabase
    .from('convocatorias')
    .update(datos)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Convocatoria no encontrada' });
  return res.json({ success: true, data });
});

const deleteConvocatoria = asyncHandler('admin/convocatoriasController.deleteConvocatoria', async (req, res) => {
  const { data, error } = await supabase
    .from('convocatorias')
    .delete()
    .eq('id', req.params.id)
    .select('id')
    .single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Convocatoria no encontrada' });
  return res.json({ success: true, message: 'Convocatoria eliminada' });
});

module.exports = { getConvocatorias, createConvocatoria, updateConvocatoria, deleteConvocatoria };
