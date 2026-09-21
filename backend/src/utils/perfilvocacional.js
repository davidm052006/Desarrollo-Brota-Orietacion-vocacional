/**
 * Calcula el perfil vocacional a partir de las respuestas crudas del usuario.
 *
 * Recibe el cuestionarioId y el mapa de respuestas { [preguntaId]: [opcionId, ...] },
 * carga los pesos desde la BD y suma los puntos por categoría.
 *
 * @param {string} cuestionarioId
 * @param {Object} respuestas - { [preguntaId]: string[] }
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ categoriaPrincipal, categoriaSecundaria, scores }>}
 */
async function calcularDesdeRespuestas(cuestionarioId, respuestas, supabase) {
  const { data: preguntas, error } = await supabase
    .from('preguntas')
    .select(`
      id,
      opciones (
        id,
        pesos_opciones ( categoria, puntos )
      )
    `)
    .eq('cuestionario_id', cuestionarioId);

  if (error) throw new Error(`Error cargando preguntas para cálculo: ${error.message}`);

  const acumulado = {};

  preguntas.forEach((pregunta) => {
    const opcionesElegidas = Array.isArray(respuestas[pregunta.id]) ? respuestas[pregunta.id] : [];
    opcionesElegidas.forEach((opcionId) => {
      const opcion = pregunta.opciones?.find((o) => o.id === opcionId);
      if (!opcion?.pesos_opciones) return;
      opcion.pesos_opciones.forEach(({ categoria, puntos }) => {
        acumulado[categoria] = (acumulado[categoria] ?? 0) + puntos;
      });
    });
  });

  const ordenados = Object.entries(acumulado).sort(([, a], [, b]) => b - a);
  const maxPuntos = ordenados[0]?.[1] ?? 1;

  return {
    categoriaPrincipal:  ordenados[0]?.[0] ?? null,
    categoriaSecundaria: ordenados[1]?.[0] ?? null,
    scores: ordenados.map(([categoria, puntos]) => ({
      categoria,
      puntos,
      porcentaje: Math.round((puntos / maxPuntos) * 100),
    })),
  };
}

/**
 * Normaliza el objeto perfil_vocacional que puede venir en distintos formatos
 * legacy (con wrapper .perfil o sin él).
 */
function normalizarPerfil(perfilVocacional = {}) {
  if (perfilVocacional?.perfil && typeof perfilVocacional.perfil === 'object') {
    return perfilVocacional.perfil;
  }
  return perfilVocacional;
}

/**
 * Convierte los scores absolutos a porcentajes relativos al total de puntos.
 * Se usa para almacenar junto al resultado (dato complementario, no el cálculo principal).
 */
function calcularPorcentajes(perfilVocacional = {}) {
  const { scores = [] } = perfilVocacional;
  const total = scores.reduce((sum, s) => sum + (s.puntos ?? 0), 0);
  if (total === 0) return {};
  return Object.fromEntries(
    scores.map(({ categoria, puntos }) => [
      categoria,
      parseFloat(((puntos / total) * 100).toFixed(1)),
    ])
  );
}

module.exports = { calcularDesdeRespuestas, calcularPorcentajes, normalizarPerfil };
