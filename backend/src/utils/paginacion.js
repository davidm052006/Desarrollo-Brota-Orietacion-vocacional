// Cálculo de paginación repetido en casi todos los listados admin.
function parsePaginacion(query, { maxLimite = 50, limiteDefault = 10 } = {}) {
  const pagina = Math.max(1, parseInt(query.pagina) || 1);
  const limite = Math.min(maxLimite, parseInt(query.limite) || limiteDefault);
  const desde  = (pagina - 1) * limite;
  const hasta  = desde + limite - 1;
  return { pagina, limite, desde, hasta };
}

function metaPaginacion(count, pagina, limite) {
  return { total: count ?? 0, pagina, limite, totalPaginas: Math.ceil((count ?? 0) / limite) };
}

module.exports = { parsePaginacion, metaPaginacion };
