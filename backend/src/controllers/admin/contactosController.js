const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePaginacion, metaPaginacion } = require('../../utils/paginacion');

// GET /api/admin/contactos — lista paginada con filtro por estado
const getContactos = asyncHandler('admin/contactosController.getContactos', async (req, res) => {
  const { pagina, limite, desde, hasta } = parsePaginacion(req.query, { limiteDefault: 20 });
  const estado = (req.query.estado || '').trim();

  let query = supabase
    .from('contactos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(desde, hasta);

  if (estado) query = query.eq('estado', estado);

  const { data, count, error } = await query;
  if (error) throw error;

  return res.json({ success: true, data, meta: metaPaginacion(count, pagina, limite) });
});

// PATCH /api/admin/contactos/:id — actualiza estado y/o notas del admin
const updateContacto = asyncHandler('admin/contactosController.updateContacto', async (req, res) => {
  const { id } = req.params;
  const { estado, notas_admin } = req.body;

  const updates = {};
  if (estado)                    updates.estado      = estado;
  if (notas_admin !== undefined) updates.notas_admin = notas_admin;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'Nada que actualizar.' });
  }

  const { error } = await supabase.from('contactos').update(updates).eq('id', id);
  if (error) throw error;

  return res.json({ success: true });
});

module.exports = { getContactos, updateContacto };
