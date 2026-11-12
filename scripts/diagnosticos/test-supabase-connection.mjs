// ==========================================
// TEST DE CONEXIÓN A SUPABASE
// ==========================================
// Este script prueba si la conexión a Supabase funciona
// Uso: node scripts/diagnosticos/test-supabase-connection.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno desde frontend/.env.local
dotenv.config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Verificando configuración...\n');
console.log(`URL: ${supabaseUrl ? '✅ Configurada' : '❌ Falta VITE_SUPABASE_URL'}`);
console.log(`KEY: ${supabaseKey ? '✅ Configurada' : '❌ Falta VITE_SUPABASE_ANON_KEY'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  No hay keys de Supabase configuradas en .env.local');
  console.log('Descomenta las variables en frontend/.env.local y vuelve a intentar.\n');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// PRUEBAS DE CONEXIÓN
// ==========================================

async function testConnection() {
  console.log('🚀 Iniciando pruebas...\n');

  try {
    // 1. Verificar que podemos hacer una consulta básica
    console.log('1️⃣  Probando conexión básica (SELECT * FROM perfiles_usuario)...');
    const { data: profiles, error: profilesError } = await supabase
      .from('perfiles_usuario')
      .select('*')
      .limit(1);

    if (profilesError) {
      throw new Error(`Error en perfiles_usuario: ${profilesError.message}`);
    }
    console.log(`✅ Tabla perfiles_usuario accesible (${profiles?.length || 0} registros)\n`);

    // 2. Verificar tabla de convocatorias
    console.log('2️⃣  Probando tabla convocatorias...');
    const { data: convocatorias, error: convocError } = await supabase
      .from('convocatorias')
      .select('*')
      .limit(1);

    if (convocError) {
      throw new Error(`Error en convocatorias: ${convocError.message}`);
    }
    console.log(`✅ Tabla convocatorias accesible (${convocatorias?.length || 0} registros)\n`);

    // 3. Verificar tabla de instituciones
    console.log('3️⃣  Probando tabla instituciones...');
    const { data: instituciones, error: instError } = await supabase
      .from('instituciones')
      .select('*')
      .limit(1);

    if (instError) {
      throw new Error(`Error en instituciones: ${instError.message}`);
    }
    console.log(`✅ Tabla instituciones accesible (${instituciones?.length || 0} registros)\n`);

    // 4. Verificar tabla de estudio_recomendado
    console.log('4️⃣  Probando tabla estudio_recomendado...');
    const { data: estudios, error: estudError } = await supabase
      .from('estudio_recomendado')
      .select('*')
      .limit(1);

    if (estudError) {
      throw new Error(`Error en estudio_recomendado: ${estudError.message}`);
    }
    console.log(`✅ Tabla estudio_recomendado accesible (${estudios?.length || 0} registros)\n`);

    // ==========================================
    // RESUMEN
    // ==========================================
    console.log('✅ ✅ ✅ TODAS LAS CONEXIONES FUNCIONAN CORRECTAMENTE ✅ ✅ ✅\n');
    console.log('📊 Resumen:');
    console.log(`  - Perfiles de usuario: ${profiles?.length || 0}`);
    console.log(`  - Convocatorias: ${convocatorias?.length || 0}`);
    console.log(`  - Instituciones: ${instituciones?.length || 0}`);
    console.log(`  - Estudios recomendados: ${estudios?.length || 0}`);
    console.log('\n✨ ¡Listo para usar en la aplicación!\n');

  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:\n');
    console.error(error.message);
    console.error('\n📝 Posibles causas:');
    console.error('  - Keys de Supabase inválidas o expiradas');
    console.error('  - No hay conexión a internet');
    console.error('  - Las tablas no existen en la base de datos');
    console.error('  - Falta configurar RLS (Row Level Security) correctamente');
    console.error('\n💡 Verifica en https://supabase.com tu proyecto.\n');
    process.exit(1);
  }
}

// Ejecutar pruebas
testConnection();
