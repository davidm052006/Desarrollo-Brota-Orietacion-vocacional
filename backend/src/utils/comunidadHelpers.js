const supabase = require('../config/supabase');

function timeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1)  return 'hace 1 día';
  if (d < 7)    return `hace ${d} días`;
  const w = Math.floor(d / 7);
  if (w === 1)  return 'hace 1 semana';
  return `hace ${w} semanas`;
}

// Incrementa un contador de forma atómica vía RPC (ver
// backend/scripts/migration_contadores_atomicos.sql — hay que ejecutarla en
// Supabase). Si la función RPC todavía no existe porque la migración no se
// corrió, cae al patrón leer-calcular-escribir anterior para no romper la
// función mientras tanto (con su condición de carrera conocida).
async function incrementarContador({ rpcName, rpcParams, tabla, columna, filtroCol, filtroVal, delta, clampMin = null }) {
  const { data, error } = await supabase.rpc(rpcName, rpcParams);
  if (!error) return data;

  console.warn(`[comunidadHelpers] RPC ${rpcName} no disponible (¿falta ejecutar la migración?):`, error.message);
  const { data: actual } = await supabase.from(tabla).select(columna).eq(filtroCol, filtroVal).single();
  let nuevoValor = (actual?.[columna] ?? 0) + delta;
  if (clampMin !== null) nuevoValor = Math.max(clampMin, nuevoValor);
  await supabase.from(tabla).update({ [columna]: nuevoValor }).eq(filtroCol, filtroVal);
  return nuevoValor;
}

async function getNombreUsuario(userId) {
  const { data, error } = await supabase
    .from('perfiles_usuario')
    .select('nombre')
    .eq('user_id', userId)
    .single();
  if (error) {
    console.error('comunidadHelpers.getNombreUsuario:', error.message);
    return 'Usuario';
  }
  return data?.nombre || 'Usuario';
}

// admin y moderador pueden moderar publicaciones de comunidad (ocultar/
// eliminar/ver autor real) — orientador y estudiante no.
async function esModerador(userId) {
  if (!userId) return false;
  const { data } = await supabase.from('perfiles_usuario').select('rol').eq('user_id', userId).single();
  return data?.rol === 'admin' || data?.rol === 'moderador';
}

// Nombre a mostrar de un autor: el real si no es anónimo, "Anónimo" si lo es
// y quien mira no modera, o el real (marcado con esAnonimoReal) si quien
// mira sí modera — para poder ver quién publicó incluso lo anónimo.
async function resolverAutor({ userId, anonimo, autorNombreGuardado, puedeModerar }) {
  if (!anonimo) return { display: autorNombreGuardado || 'Usuario', esAnonimoReal: false };
  if (puedeModerar) {
    const real = await getNombreUsuario(userId);
    return { display: real, esAnonimoReal: true };
  }
  return { display: 'Anónimo', esAnonimoReal: false };
}

module.exports = { timeAgo, incrementarContador, getNombreUsuario, esModerador, resolverAutor };
