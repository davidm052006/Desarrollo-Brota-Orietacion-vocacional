// Escapa un valor para usarlo dentro de un filtro .or()/.ilike() de PostgREST.
// Sin esto, un ',' o ')' en el input del usuario puede alterar la estructura
// del filtro (inyectar condiciones OR adicionales). PostgREST soporta values
// entre comillas dobles para tratarlos como literales; solo hay que escapar
// backslashes y comillas dobles internas.
function escaparValorFiltro(valor) {
  const texto = String(valor ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${texto}"`;
}

// Azúcar para el caso más común: patrón ilike con comodines %texto%
function patronIlike(valor) {
  return escaparValorFiltro(`%${valor}%`);
}

module.exports = { escaparValorFiltro, patronIlike };
