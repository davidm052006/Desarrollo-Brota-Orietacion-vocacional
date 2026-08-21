// ============================================================
// ALGORITMO DE RECOMENDACIÓN VOCACIONAL — Brota v1
// ============================================================
//
// FUNDAMENTO TEÓRICO:
//   Se basa en la Teoría de Ajuste Persona-Entorno (P-E Fit,
//   Kristof-Brown et al., 2005) y en el modelo Holland RIASEC
//   (Holland, 1997), que demuestran que la compatibilidad entre
//   el perfil de intereses del estudiante y las características
//   del entorno académico/laboral predice satisfacción y
//   permanencia. El algoritmo es content-based filtering:
//   asigna compatibilidad en función de la proporción de puntos
//   que el estudiante acumuló en la categoría de cada programa.
//
// FLUJO:
//   1. Toma los scores absolutos del test (puntos por categoría)
//   2. Normaliza categorías del cuestionario → área académica MEN
//   3. Filtra las top-3 categorías del usuario
//   4. Consulta solo los programas de esas categorías (máx 50 c/u)
//   5. Calcula compatibilidad = % absoluto de puntos + bonificaciones
//   6. Aplica cap de variedad (4-3-2 por categoría)
//   7. Inserta top 8 en la tabla `recomendaciones`
//
// COMPATIBILIDAD (almacenada como 0.0–1.0):
//   base    = puntos_categoría / puntos_totales
//   +0.08   si es la categoría principal del usuario
//   +0.04   si es la categoría secundaria
//   +0.015  pequeño bonus por datos completos del programa
//   La UI lo multiplica ×100 para mostrarlo como porcentaje.
// ============================================================

const LIMITE_POR_CATEGORIA = 50;
const MAX_RECOMENDACIONES  = 8;
// Cuántos programas tomar de cada categoría (principal, secundaria, tercera)
const CAP_POR_RANGO = [4, 3, 1];

// Mapeo de categorías del cuestionario → area_academica de la API del MEN.
// El cuestionario puede usar claves como 'emprendimiento' o 'ambiente' que no
// existen en programas.area_academica; este mapa las normaliza antes de consultar.
const CATEGORIA_ALIAS = {
  emprendimiento: 'negocios',
  ambiente:       'ambiental',
};

// Normaliza un score para que su categoría coincida con area_academica en BD.
function normalizarScore(s) {
  return { ...s, categoria: CATEGORIA_ALIAS[s.categoria] ?? s.categoria };
}

// ── Porcentaje absoluto (proporción real de puntos) ───────────────────────────
function pctAbsoluto(scores, categoria) {
  const totalPuntos = scores.reduce((sum, s) => sum + (s.puntos ?? 0), 0);
  if (totalPuntos === 0) return 0;
  const entrada = scores.find(s => s.categoria === categoria);
  return ((entrada?.puntos ?? 0) / totalPuntos) * 100;
}

// ── Calcula compatibilidad para un programa (0.0–1.0) ────────────────────────
function calcularCompatibilidad(programa, perfilVocacional) {
  const { categoriaPrincipal, categoriaSecundaria, scores } = perfilVocacional;
  const area = programa.area_academica;

  const base = pctAbsoluto(scores, area) / 100;

  let bonus = 0;
  if (area === categoriaPrincipal)  bonus += 0.08;
  if (area === categoriaSecundaria) bonus += 0.04;

  // Bonus mínimo por completitud de datos (desempate)
  const camposCompletos = [programa.duracion, programa.modalidad, programa.descripcion]
    .filter(Boolean).length;
  bonus += camposCompletos * 0.005;

  return parseFloat(Math.min(1.0, base + bonus).toFixed(3));
}

// ── Genera las razones legibles ───────────────────────────────────────────────
function generarRazones(programa, perfilVocacional) {
  const { categoriaPrincipal, categoriaSecundaria, scores } = perfilVocacional;
  const area = programa.area_academica;
  const pct  = Math.round(pctAbsoluto(scores, area));
  const razones = [];

  razones.push(`Tu perfil en ${area} (${pct}% de tus intereses) tiene afinidad con este programa`);

  if (area === categoriaPrincipal) {
    razones.push('Coincide con tu área de mayor fortaleza');
  } else if (area === categoriaSecundaria) {
    razones.push('Complementa tu perfil secundario');
  }

  if (programa.tipo === 'Técnica' || programa.tipo === 'Tecnológica') {
    razones.push('Formación práctica con rápida inserción laboral');
  }

  return razones;
}

// ── Función principal ─────────────────────────────────────────────────────────
const generarRecomendaciones = async (resultadoId, perfilVocacional, supabase) => {
  try {
    const { scores = [] } = perfilVocacional;

    // Normalizar categorías del cuestionario → area_academica de programas
    const scoresNormalizados = scores.map(normalizarScore);
    const categoriaPrincipalNorm = CATEGORIA_ALIAS[perfilVocacional.categoriaPrincipal]
      ?? perfilVocacional.categoriaPrincipal;
    const categoriaSecundariaNorm = perfilVocacional.categoriaSecundaria
      ? (CATEGORIA_ALIAS[perfilVocacional.categoriaSecundaria] ?? perfilVocacional.categoriaSecundaria)
      : null;

    const perfilNormalizado = {
      ...perfilVocacional,
      scores:              scoresNormalizados,
      categoriaPrincipal:  categoriaPrincipalNorm,
      categoriaSecundaria: categoriaSecundariaNorm,
    };

    // Top 3 categorías con al menos algún puntaje
    const topCategorias = scoresNormalizados
      .filter(s => (s.puntos ?? 0) > 0)
      .slice(0, 3)
      .map(s => s.categoria)
      .filter(Boolean);

    if (topCategorias.length === 0) {
      console.warn('[algoritmoRecomendacion] Sin categorías con puntaje, se omite.');
      return;
    }

    // Consultar programas de cada categoría en paralelo
    const resultadosPorCategoria = await Promise.all(
      topCategorias.map(async (cat) => {
        const { data, error } = await supabase
          .from('programas')
          .select(`
            id, nombre, tipo, area_academica,
            duracion, modalidad, descripcion,
            instituciones ( nombre, ciudad )
          `)
          .eq('area_academica', cat)
          .eq('activo', true)
          .neq('tipo', 'Posgrado')
          .limit(LIMITE_POR_CATEGORIA);

        if (error) {
          console.error(`[algoritmoRecomendacion] Error cargando categoría ${cat}:`, error.message);
          return [];
        }
        return data ?? [];
      })
    );

    // Calcular compatibilidad y aplicar cap de variedad
    const candidatos = [];

    resultadosPorCategoria.forEach((programas, idx) => {
      const cap = CAP_POR_RANGO[idx] ?? 1;

      const conScore = programas
        .map(p => ({
          programa:       p,
          compatibilidad: calcularCompatibilidad(p, perfilNormalizado),
          razones:        generarRazones(p, perfilNormalizado),
        }))
        .sort((a, b) => b.compatibilidad - a.compatibilidad)
        .slice(0, cap);

      candidatos.push(...conScore);
    });

    // Ranking global y top N
    const top = candidatos
      .sort((a, b) => b.compatibilidad - a.compatibilidad)
      .slice(0, MAX_RECOMENDACIONES);

    if (top.length === 0) {
      console.warn('[algoritmoRecomendacion] Sin candidatos para insertar.');
      return;
    }

    const rows = top.map(item => ({
      resultado_id:   resultadoId,
      programa_id:    item.programa.id,
      compatibilidad: item.compatibilidad,
      razones:        JSON.stringify(item.razones),
    }));

    const { error: insertError } = await supabase.from('recomendaciones').insert(rows);

    if (insertError) {
      console.error('[algoritmoRecomendacion] Error al insertar recomendaciones:', insertError.message);
      return;
    }

    console.log(`[algoritmoRecomendacion] ${rows.length} recomendaciones guardadas para resultado ${resultadoId}`);
  } catch (err) {
    console.error('[algoritmoRecomendacion] Error inesperado:', err);
  }
};

module.exports = { generarRecomendaciones, CATEGORIA_ALIAS, normalizarScore, pctAbsoluto };
