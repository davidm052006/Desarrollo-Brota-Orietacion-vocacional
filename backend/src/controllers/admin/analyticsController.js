const supabase = require('../../config/supabase');
const asyncHandler = require('../../utils/asyncHandler');
const { CATEGORIA_ALIAS, normalizarScore, pctAbsoluto } = require('../../utils/algoritmoRecomendacion');

// GET /api/admin/analytics
// Agrega perfil_vocacional de TODOS los resultados guardados en dos formas:
//   conteoPorCategoria    — cuántos usuarios tienen esa categoría como principal (para el gráfico de barras)
//   promedioPorCategoria  — % promedio de puntos en cada categoría a través de todos los resultados (para el radar)
// Reutiliza CATEGORIA_ALIAS/normalizarScore/pctAbsoluto del algoritmo de recomendación
// para no duplicar la tabla de normalización de categorías por tercera vez.
const getAnalytics = asyncHandler('admin/analyticsController.getAnalytics', async (req, res) => {
  const { data, error } = await supabase.from('resultados').select('perfil_vocacional');
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
