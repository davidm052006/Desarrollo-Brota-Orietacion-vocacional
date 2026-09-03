const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { CATEGORIA_ALIAS, normalizarScore, pctAbsoluto } = require('../../utils/algoritmoRecomendacion');

// GET /api/institucion/analytics — mismo cálculo que admin/analyticsController.js
// (conteoPorCategoria para las barras, promedioPorCategoria para el radar),
// pero solo sobre resultados de estudiantes de ESTA institución — nunca de
// otra institución ni del resto de la plataforma. El filtro real vive acá
// (el embed inner-join por institucion_id), no en el frontend.
const getAnalytics = asyncHandler('institucion/analyticsController.getAnalytics', async (req, res) => {
  if (!req.institucionId) {
    return res.json({ success: true, data: { totalResultados: 0, conteoPorCategoria: {}, promedioPorCategoria: {} } });
  }

  const { data, error } = await supabase
    .from('resultados')
    .select('perfil_vocacional, perfiles_usuario!inner(institucion_id)')
    .eq('perfiles_usuario.institucion_id', req.institucionId);

  if (error) throw error;

  const conteoPorCategoria = {};
  const sumaPorcentajes = {};
  const countPorcentajes = {};

  for (const row of data ?? []) {
    const perfil = row.perfil_vocacional;
    if (!perfil?.scores?.length) continue;

    const scores = perfil.scores.map(normalizarScore);
    const principal = CATEGORIA_ALIAS[perfil.categoriaPrincipal] ?? perfil.categoriaPrincipal;
    if (principal) conteoPorCategoria[principal] = (conteoPorCategoria[principal] ?? 0) + 1;

    const categoriasVistas = new Set(scores.map(s => s.categoria));
    for (const categoria of categoriasVistas) {
      const pct = pctAbsoluto(scores, categoria);
      sumaPorcentajes[categoria] = (sumaPorcentajes[categoria] ?? 0) + pct;
      countPorcentajes[categoria] = (countPorcentajes[categoria] ?? 0) + 1;
    }
  }

  const promedioPorCategoria = Object.fromEntries(
    Object.entries(sumaPorcentajes).map(([categoria, suma]) => [
      categoria,
      Math.round((suma / countPorcentajes[categoria]) * 10) / 10,
    ])
  );

  return res.json({
    success: true,
    data: {
      totalResultados: data?.length ?? 0,
      conteoPorCategoria,
      promedioPorCategoria,
    },
  });
});

module.exports = { getAnalytics };
